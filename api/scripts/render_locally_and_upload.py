"""One-shot: build a Content Studio job's video on this machine (fast local
CPU) instead of the CPU-constrained VPS, then upload the result straight to
the server via /content-studio/jobs/{id}/upload-video so it's immediately
servable from a public URL for Facebook/Instagram to fetch.

The job must already exist on the server with its scenes generated. Any
scene missing an image_url/audio_url gets one generated server-side first
(via the existing generate-image / generate-audio endpoints -- those need
the server's configured API keys, so they stay server-side even though the
ffmpeg encoding doesn't) before this script downloads the assets, builds
clips locally, concatenates, and pushes the finished output.mp4 back up.

Usage:
    # Against an existing job:
    ADMIN_JWT=<token> python scripts/render_locally_and_upload.py <job_id> \
        [--base-url https://api.aadikarta.org] [--font /path/to/devanagari.ttf]

    # Or create a fresh synthetic test job first, then do the above:
    ADMIN_JWT=<token> python scripts/render_locally_and_upload.py --topic "Test topic" \
        [--content-type VOICE_OVER_IMAGE] [--voice-gender FEMALE] [--scene-count 2]
"""
import argparse
import os
import platform
import sys
import tempfile

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services import content_studio_video as csv  # noqa: E402

# Local dev machines don't have the VPS's fonts-noto-core package -- fall
# back to whatever Devanagari-capable font ships with the OS.
DEFAULT_FONT_CANDIDATES = {
    "Darwin": [
        "/System/Library/Fonts/Supplemental/DevanagariMT.ttc",
        "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc",
    ],
    "Linux": [
        "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf",
    ],
}


def _pick_font(explicit: str | None) -> str:
    if explicit:
        return explicit
    for path in DEFAULT_FONT_CANDIDATES.get(platform.system(), []):
        if os.path.exists(path):
            return path
    raise SystemExit(
        "No Devanagari-capable font found automatically -- pass --font /path/to/font.ttf"
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("job_id", type=int, nargs="?", default=None)
    parser.add_argument("--topic", default=None, help="Create a fresh job with this topic instead of using an existing job_id")
    parser.add_argument("--content-type", default="VOICE_OVER_IMAGE", choices=["SHORT_VIDEO", "VOICE_OVER_IMAGE"])
    parser.add_argument("--voice-gender", default="FEMALE", choices=["MALE", "FEMALE"])
    parser.add_argument("--scene-count", type=int, default=2)
    parser.add_argument("--base-url", default="https://api.aadikarta.org")
    parser.add_argument("--font", default=None)
    args = parser.parse_args()

    if not args.topic and args.job_id is None:
        raise SystemExit("Pass either a job_id or --topic \"...\" to create a fresh test job.")

    token = os.environ.get("ADMIN_JWT")
    if not token:
        raise SystemExit("Set ADMIN_JWT env var to an admin's bearer token first.")

    csv.CAPTION_FONT_PATH = _pick_font(args.font)

    headers = {"Authorization": f"Bearer {token}"}
    client = httpx.Client(base_url=args.base_url, headers=headers, timeout=60.0)

    if args.topic:
        print(f"Creating synthetic test job: {args.topic!r}...")
        resp = client.post(
            "/content-studio/jobs",
            json={
                "topic": args.topic,
                "content_type": args.content_type,
                "voice_gender": args.voice_gender,
                "scene_count": args.scene_count,
            },
        )
        resp.raise_for_status()
        job = resp.json()
        job_id = job["id"]
        print(f"Created job {job_id}.")
    else:
        job_id = args.job_id
        print(f"Fetching job {job_id}...")
        resp = client.get(f"/content-studio/jobs/{job_id}")
        resp.raise_for_status()
        job = resp.json()

    scenes = sorted(job["scenes"], key=lambda s: s["index"])
    if not scenes:
        raise SystemExit("Job has no scenes.")

    # Fill in any missing image/audio server-side (needs the server's API
    # keys) before we download and build locally.
    for scene in scenes:
        idx = scene["index"]
        if not scene.get("image_url"):
            print(f"Scene {idx}: generating image server-side...")
            resp = client.post(
                f"/content-studio/jobs/{job_id}/scenes/{idx}/generate-image",
                json={"image_prompt_en": scene["image_prompt_en"]},
                timeout=120.0,
            )
            resp.raise_for_status()
            job = resp.json()
        if not scene.get("audio_url"):
            print(f"Scene {idx}: generating audio server-side...")
            resp = client.post(f"/content-studio/jobs/{job_id}/scenes/{idx}/generate-audio", timeout=60.0)
            resp.raise_for_status()
            job = resp.json()

    scenes = sorted(job["scenes"], key=lambda s: s["index"])

    with tempfile.TemporaryDirectory(prefix=f"content_studio_{job_id}_") as work_dir:
        # This job's disclaimer overlay is rendered once per process into
        # work_dir, same as the real pipeline does per-job on the server.
        csv.DISCLAIMER_PNG_PATH = os.path.join(work_dir, "disclaimer.png")

        clip_paths = []
        for scene in scenes:
            idx = scene["index"]
            print(f"Scene {idx}: downloading assets...")
            image_path = os.path.join(work_dir, f"scene_{idx}.jpg")
            audio_path = os.path.join(work_dir, f"scene_{idx}.wav")

            for url, path in ((scene["image_url"], image_path), (scene["audio_url"], audio_path)):
                full_url = url if url.startswith("http") else f"{args.base_url}{url}"
                r = client.get(full_url)
                r.raise_for_status()
                with open(path, "wb") as f:
                    f.write(r.content)

            clip_path = os.path.join(work_dir, f"scene_{idx}_clip.mp4")
            print(f"Scene {idx}: building clip...")
            csv.build_scene_clip(image_path, audio_path, scene["narration_hi"], work_dir, clip_path)
            clip_paths.append(clip_path)

        output_path = os.path.join(work_dir, "output.mp4")
        print("Concatenating final video...")
        csv.concat_clips(clip_paths, work_dir, output_path)

        print("Uploading to server...")
        with open(output_path, "rb") as f:
            resp = client.post(
                f"/content-studio/jobs/{job_id}/upload-video",
                files={"file": ("output.mp4", f, "video/mp4")},
                timeout=120.0,
            )
        resp.raise_for_status()
        updated = resp.json()
        print(f"Done. Public URL: {args.base_url}{updated['output_video_url']}")


if __name__ == "__main__":
    main()
