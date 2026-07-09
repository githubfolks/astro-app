"""Assembles scene images + Hindi narration audio into a final vertical MP4
via ffmpeg: Ken Burns pan/zoom per scene, burned-in Hindi captions, then concat.
"""
import os
import subprocess

WIDTH = 1080
HEIGHT = 1920
FPS = 25
CAPTION_FONT = "Noto Sans Devanagari"


class VideoAssemblyError(RuntimeError):
    pass


def _run(cmd: list[str]):
    result = subprocess.run(cmd, capture_output=True, text=True)
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


def _escape_subtitles_path(path: str) -> str:
    # ffmpeg filtergraph syntax treats ':' and '\' specially inside filter args.
    return path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")


def _write_scene_srt(narration_text: str, duration_sec: float, srt_path: str):
    def fmt(t: float) -> str:
        ms = int(round(t * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(f"1\n{fmt(0)} --> {fmt(duration_sec)}\n{narration_text}\n")


def build_scene_clip(image_path: str, audio_path: str, narration_text: str, work_dir: str, out_path: str):
    """Ken Burns zoom over the image, narration audio, burned-in Hindi caption."""
    duration_sec = get_audio_duration(audio_path)
    frames = max(int(round(duration_sec * FPS)), 1)

    srt_path = os.path.join(work_dir, os.path.basename(out_path) + ".srt")
    _write_scene_srt(narration_text, duration_sec, srt_path)

    # Commas must be backslash-escaped even inside the single-quoted force_style
    # value — ffmpeg's filtergraph parser splits on unescaped commas regardless
    # of quoting, a well-known gotcha with the subtitles filter.
    style = f"FontName={CAPTION_FONT}\\,FontSize=20\\,PrimaryColour=&HFFFFFF&\\,OutlineColour=&H000000&\\,BorderStyle=1\\,Outline=2\\,Alignment=2\\,MarginV=80"
    # Pre-upscale modestly (not to some huge absolute size — that OOMs zoompan,
    # which materializes a full upscaled frame per output frame) just enough
    # to avoid zoompan's jittery-zoom artifact on a static source image.
    upscale_width = WIDTH * 3
    filter_complex = (
        f"[0:v]scale={upscale_width}:-2,"
        f"zoompan=z='min(zoom+0.0015,1.5)':d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS}:"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',"
        f"subtitles={_escape_subtitles_path(srt_path)}:force_style='{style}'[v]"
    )

    _run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "1:a",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-shortest",
        out_path,
    ])


def concat_clips(clip_paths: list[str], work_dir: str, out_path: str):
    list_path = os.path.join(work_dir, "concat_list.txt")
    with open(list_path, "w", encoding="utf-8") as f:
        for path in clip_paths:
            f.write(f"file '{os.path.abspath(path)}'\n")

    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", out_path])
