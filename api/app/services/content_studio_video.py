"""Assembles scene images + Hindi narration audio into a final vertical MP4
via ffmpeg: Ken Burns pan/zoom per scene, Hindi captions overlaid, then concat.

Captions are pre-rendered to a transparent PNG in Python (Pillow, raqm text
layout) and composited via ffmpeg's overlay filter -- NOT ffmpeg's `subtitles`
filter. That filter goes through libass/HarfBuzz, which has a confirmed
Devanagari shaping bug that transposes vowel signs (e.g. "करियर" renders as
"करयिर") -- verified to reproduce identically across multiple fonts, so it's
a shaping-engine bug, not a font issue. Pillow's raqm layout (HarfBuzz +
FriBidi, the same combo libass is supposed to use) shapes it correctly.
"""
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

WIDTH = 1080
HEIGHT = 1920
FPS = 25
CAPTION_FONT_PATH = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf"
CAPTION_FONT_SIZE = 42
CAPTION_MARGIN_X = 60
CAPTION_MARGIN_BOTTOM = 120
CAPTION_LINE_SPACING = 14


class VideoAssemblyError(RuntimeError):
    pass


def _run(cmd: list[str], timeout: float = 300.0):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise VideoAssemblyError(f"ffmpeg command timed out after {timeout:.0f}s: {' '.join(cmd)}")
    if result.returncode != 0:
        raise VideoAssemblyError(f"ffmpeg command failed: {' '.join(cmd)}\n{result.stderr[-2000:]}")


def get_audio_duration(audio_path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        raise VideoAssemblyError(f"ffprobe failed to read duration for {audio_path}: {result.stderr[-500:]}")
    return float(result.stdout.strip())


def _wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split(" ")
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if current and draw.textbbox((0, 0), trial, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def render_caption_png(narration_text: str, out_path: str):
    """Renders Hindi caption text to a transparent WIDTHxHEIGHT PNG, bottom-aligned
    and centered, matching the look of the previous burned-in subtitle style."""
    font = ImageFont.truetype(CAPTION_FONT_PATH, CAPTION_FONT_SIZE, layout_engine=ImageFont.Layout.RAQM)
    img = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    max_width = WIDTH - 2 * CAPTION_MARGIN_X
    lines = _wrap_lines(draw, narration_text, font, max_width)

    line_height = CAPTION_FONT_SIZE + CAPTION_LINE_SPACING
    y = HEIGHT - CAPTION_MARGIN_BOTTOM - len(lines) * line_height

    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        x = (WIDTH - (bbox[2] - bbox[0])) / 2
        draw.text((x, y), line, font=font, fill="white", stroke_width=3, stroke_fill="black")
        y += line_height

    img.save(out_path)


def build_scene_clip(image_path: str, audio_path: str, narration_text: str, work_dir: str, out_path: str):
    """Ken Burns zoom over the image, narration audio, overlaid Hindi caption."""
    duration_sec = get_audio_duration(audio_path)
    frames = max(int(round(duration_sec * FPS)), 1)

    caption_path = os.path.join(work_dir, os.path.basename(out_path) + "_caption.png")
    render_caption_png(narration_text, caption_path)

    # Pre-upscale modestly (not to some huge absolute size — that OOMs zoompan,
    # which materializes a full upscaled frame per output frame) just enough
    # to avoid zoompan's jittery-zoom artifact on a static source image. 2x
    # (not the original 3x) -- on the VPS this filter chain was observed
    # pegging ~2.8 CPU cores and taking a long time per scene; halving the
    # pixel count per frame (2x width = ~44% the pixels of 3x) cuts that
    # substantially while still being enough headroom to avoid the jitter.
    upscale_width = WIDTH * 2
    # Source images come back roughly square (Pollinations/Flux's native, best-quality
    # aspect ratio) — center-crop to 9:16 here instead of requesting a vertical image
    # directly, which was producing visibly stretched/warped content from the generator.
    filter_complex = (
        f"[0:v]crop=w='min(iw\\,ih*9/16)':h='min(ih\\,iw*16/9)',"
        f"scale={upscale_width}:-2,"
        f"zoompan=z='min(zoom+0.0015,1.5)':d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS}:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[bg];"
        f"[bg][2:v]overlay=0:0[v]"
    )

    _run([
        "ffmpeg", "-y",
        # Single-threaded: the container is limited to 1 CPU, but libx264 detects
        # the host's full core count and spawns threads/lookahead buffers sized
        # for it, which under-runs the actual CPU quota and snowballs into an
        # OOM on longer scenes instead of just encoding slower.
        "-threads", "1",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-i", caption_path,
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "1:a",
        "-c:v", "libx264", "-threads", "1", "-x264-params", "threads=1",
        # medium (ffmpeg's default) was a large share of the per-scene time on
        # the VPS's constrained CPU -- veryfast trades some compression
        # efficiency for substantially faster encoding, which is a fine trade
        # for short vertical clips that get re-compressed by Facebook/
        # Instagram/YouTube on upload anyway.
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        # Explicit trim instead of -shortest: with a looped image input, -shortest
        # was observed to overrun past zoompan's own frame count (e.g. 342 frames
        # instead of the requested 302) rather than cutting cleanly.
        "-t", f"{duration_sec:.3f}",
        # Without faststart the moov atom lands at the end of the file --
        # plays fine locally/in ffprobe, but Facebook's Graph API video
        # ingestion rejects such files outright as "corrupt"/"unreadable".
        "-movflags", "+faststart",
        out_path,
    ])


def concat_clips(clip_paths: list[str], work_dir: str, out_path: str):
    list_path = os.path.join(work_dir, "concat_list.txt")
    with open(list_path, "w", encoding="utf-8") as f:
        for path in clip_paths:
            f.write(f"file '{os.path.abspath(path)}'\n")

    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", "-movflags", "+faststart", out_path])
