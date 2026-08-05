"""Content Studio: generates Vedic-astrology short-video / voice-over-image
scripts (Groq), turns each scene into narrated visuals (Bhashini TTS +
Pollinations.ai images), and assembles a final vertical MP4 (ffmpeg) for the
admin to preview, download, and post manually to Facebook/Instagram/YouTube.
"""
import asyncio
import os
import shutil
from datetime import datetime, timezone
from typing import Literal

from io import BytesIO

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .. import models, schemas_content_studio, database
from ..database import SessionLocal
from ..limiter import limiter
from ..services import content_studio_llm, content_studio_tts, content_studio_images, content_studio_video, content_studio_social, content_studio_youtube
from .auth import get_current_admin

# Enforced on manual scene-image uploads (generated images are already JPEG
# from Pollinations, so this only applies to the upload-image path below).
MAX_SCENE_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_SCENE_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
# Lets a video rendered elsewhere (e.g. locally, on faster hardware than the
# VPS) be uploaded and served from here so it gets a public URL Facebook/
# Instagram can fetch -- see upload_video below.
MAX_VIDEO_BYTES = 200 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {"video/mp4"}
# Ken Burns zoompan in content_studio_video.py upscales to 2x the final
# WIDTH (1080) before zooming, so anything short of that softens visibly.
MIN_SCENE_IMAGE_DIMENSION = 1080

router = APIRouter(
    prefix="/content-studio",
    tags=["Content Studio"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("/suggest-topic", response_model=schemas_content_studio.TopicSuggestion)
@limiter.limit("10/minute")
def suggest_topic(request: Request):
    return schemas_content_studio.TopicSuggestion(topic=content_studio_llm.suggest_topic())


@router.post("/jobs", response_model=schemas_content_studio.Job)
@limiter.limit("10/minute")
def create_job(
    request: Request,
    payload: schemas_content_studio.GenerateScenesRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin),
):
    content_type = models.ContentType(payload.content_type.value)
    scenes = content_studio_llm.generate_scenes(payload.topic, content_type, payload.scene_count)

    job = models.ContentStudioJob(
        topic=payload.topic,
        short_description=payload.short_description,
        content_type=content_type,
        voice_gender=models.VoiceGender(payload.voice_gender.value),
        status=models.ContentJobStatus.SCENES_GENERATED,
        scenes=scenes,
        created_by=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.put("/jobs/{job_id}", response_model=schemas_content_studio.Job)
def update_job(
    job_id: int,
    payload: schemas_content_studio.UpdateJobRequest,
    db: Session = Depends(database.get_db),
):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.short_description = payload.short_description
    db.commit()
    db.refresh(job)
    return job


@router.get("/topics", response_model=schemas_content_studio.TopicOptionsResponse)
def list_topics(db: Session = Depends(database.get_db)):
    """Lightweight topic list (id, topic, short_description) for pickers like
    the Social Copy Generator's Topic dropdown -- avoids shipping full job
    rows (scenes JSON, posting status, etc.) just to populate a dropdown.
    """
    jobs = (
        db.query(models.ContentStudioJob)
        .order_by(models.ContentStudioJob.created_at.desc())
        .limit(200)
        .all()
    )
    return schemas_content_studio.TopicOptionsResponse(
        topics=[schemas_content_studio.TopicOption.model_validate(job) for job in jobs]
    )


@router.put("/jobs/{job_id}/scenes", response_model=schemas_content_studio.Job)
def update_scenes(
    job_id: int,
    payload: schemas_content_studio.UpdateScenesRequest,
    db: Session = Depends(database.get_db),
):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot edit scenes while rendering")

    job.scenes = [scene.model_dump() for scene in payload.scenes]
    flag_modified(job, "scenes")
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/scenes/{scene_index}/generate-image", response_model=schemas_content_studio.Job)
@limiter.limit("30/minute")
async def generate_scene_image(
    request: Request,
    job_id: int,
    scene_index: int,
    payload: schemas_content_studio.GenerateSceneImageRequest,
    db: Session = Depends(database.get_db),
):
    """Generates (or regenerates) just one scene's preview image, using
    whatever image_prompt_en the admin currently has in the editor -- lets
    them see and approve/retry each image before committing to a full render.
    """
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot edit scenes while rendering")
    if not any(s["index"] == scene_index for s in job.scenes):
        raise HTTPException(status_code=404, detail="Scene not found")

    image_bytes = await asyncio.to_thread(content_studio_images.generate_image, payload.image_prompt_en)

    job_dir = os.path.join("uploads", "content_studio", str(job_id))
    os.makedirs(job_dir, exist_ok=True)
    image_path = os.path.join(job_dir, f"scene_{scene_index}.jpg")
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    # Re-read scenes fresh right before writing, not before the slow Pollinations
    # call above -- another request (e.g. a different scene's generate-image
    # call) may have committed its own change in the meantime, and writing back
    # a copy captured before that would silently clobber it.
    db.refresh(job)
    # Fresh dict copies, not the same dict objects job.scenes already holds --
    # mutating shared dicts in place (before reassigning job.scenes) confuses
    # SQLAlchemy's change detection, which silently no-ops the UPDATE (the bug
    # that caused generated images to never actually save).
    scenes = [dict(s) for s in job.scenes]
    scene = next((s for s in scenes if s["index"] == scene_index), None)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene["image_prompt_en"] = payload.image_prompt_en
    scene["full_image_prompt"] = content_studio_images.build_prompt(payload.image_prompt_en)
    scene["image_url"] = f"/static/content_studio/{job_id}/scene_{scene_index}.jpg?v={int(datetime.now(timezone.utc).timestamp())}"
    job.scenes = scenes
    flag_modified(job, "scenes")
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/scenes/{scene_index}/upload-image", response_model=schemas_content_studio.Job)
@limiter.limit("30/minute")
async def upload_scene_image(
    request: Request,
    job_id: int,
    scene_index: int,
    db: Session = Depends(database.get_db),
    file: UploadFile = File(...),
):
    """Lets the admin supply their own image for a scene instead of the
    Pollinations auto-generated one -- same slot/URL convention as
    generate_scene_image, so the rest of the pipeline (render, preview) can't
    tell the difference.
    """
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot edit scenes while rendering")
    if not any(s["index"] == scene_index for s in job.scenes):
        raise HTTPException(status_code=404, detail="Scene not found")

    if file.content_type not in ALLOWED_SCENE_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Use JPEG, PNG, or WebP.")

    content = await file.read()
    if len(content) > MAX_SCENE_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_SCENE_IMAGE_BYTES // (1024 * 1024)}MB)")

    try:
        img = Image.open(BytesIO(content))
        img.load()
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="File is not a valid image")

    if min(img.width, img.height) < MIN_SCENE_IMAGE_DIMENSION:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Image too small ({img.width}x{img.height}). "
                f"Minimum {MIN_SCENE_IMAGE_DIMENSION}px on the shorter side "
                f"-- recommended {MIN_SCENE_IMAGE_DIMENSION}x1920 (9:16 portrait) "
                f"or {MIN_SCENE_IMAGE_DIMENSION}x{MIN_SCENE_IMAGE_DIMENSION} square."
            ),
        )

    # Normalize to JPEG regardless of upload format -- render/_run_render_job
    # hardcodes scene_{idx}.jpg, and the video filter chain assumes a single
    # consistent input format.
    job_dir = os.path.join("uploads", "content_studio", str(job_id))
    os.makedirs(job_dir, exist_ok=True)
    image_path = os.path.join(job_dir, f"scene_{scene_index}.jpg")
    img.convert("RGB").save(image_path, format="JPEG", quality=92)

    db.refresh(job)
    scenes = [dict(s) for s in job.scenes]
    scene = next((s for s in scenes if s["index"] == scene_index), None)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene["image_url"] = f"/static/content_studio/{job_id}/scene_{scene_index}.jpg?v={int(datetime.now(timezone.utc).timestamp())}"
    job.scenes = scenes
    flag_modified(job, "scenes")
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/scenes/{scene_index}/generate-audio", response_model=schemas_content_studio.Job)
@limiter.limit("30/minute")
async def generate_scene_audio(
    request: Request,
    job_id: int,
    scene_index: int,
    db: Session = Depends(database.get_db),
):
    """Generates just one scene's narration audio, same slot/URL convention
    as generate_scene_image -- normally audio is only produced inline during
    a full /render, this lets it be fetched standalone (e.g. by a script
    building the video elsewhere) without also triggering the ffmpeg pass.
    """
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot edit scenes while rendering")
    scene = next((s for s in job.scenes if s["index"] == scene_index), None)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    audio_bytes = await asyncio.to_thread(
        content_studio_tts.get_narration_audio, scene["narration_hi"], job.voice_gender.value
    )

    job_dir = os.path.join("uploads", "content_studio", str(job_id))
    os.makedirs(job_dir, exist_ok=True)
    audio_path = os.path.join(job_dir, f"scene_{scene_index}.wav")
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)

    db.refresh(job)
    scenes = [dict(s) for s in job.scenes]
    scene = next((s for s in scenes if s["index"] == scene_index), None)
    if scene is None:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene["audio_url"] = f"/static/content_studio/{job_id}/scene_{scene_index}.wav?v={int(datetime.now(timezone.utc).timestamp())}"
    job.scenes = scenes
    flag_modified(job, "scenes")
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/render", response_model=schemas_content_studio.Job)
@limiter.limit("5/minute")
async def render_video(
    request: Request,
    job_id: int,
    db: Session = Depends(database.get_db),
):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Job is already rendering")

    job.status = models.ContentJobStatus.RENDERING
    job.error_message = None
    db.commit()
    db.refresh(job)

    asyncio.create_task(_run_render_job(job_id))
    return job


@router.post("/jobs/{job_id}/upload-video", response_model=schemas_content_studio.Job)
@limiter.limit("10/minute")
async def upload_video(
    request: Request,
    job_id: int,
    db: Session = Depends(database.get_db),
    file: UploadFile = File(...),
):
    """Accepts a video rendered outside this server (e.g. locally, where a
    faster CPU makes the ffmpeg re-encode steps much quicker than on the
    VPS) and stores it as this job's output -- so it ends up served from a
    public URL Facebook/Instagram can fetch, same as a normal render.
    """
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot upload while rendering")

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Use MP4.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_VIDEO_BYTES // (1024 * 1024)}MB)")

    job_dir = os.path.join("uploads", "content_studio", str(job_id))
    os.makedirs(job_dir, exist_ok=True)
    video_path = os.path.join(job_dir, "output.mp4")
    with open(video_path, "wb") as f:
        f.write(content)

    job.output_video_url = f"/static/content_studio/{job_id}/output.mp4"
    job.status = models.ContentJobStatus.DONE
    job.error_message = None
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/upload", response_model=schemas_content_studio.Job)
@limiter.limit("10/minute")
async def create_job_with_video(
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin),
    topic: str = Form(..., min_length=1, max_length=500),
    short_description: str = Form(None, max_length=2000),
    file: UploadFile = File(...),
):
    """Creates a job straight from a topic + an already-rendered video file --
    skips the scene-generation/render pipeline entirely for admins who produced
    the video themselves (e.g. locally), same storage convention as upload_video.
    """
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Use MP4.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_VIDEO_BYTES // (1024 * 1024)}MB)")

    job = models.ContentStudioJob(
        topic=topic,
        short_description=short_description or None,
        content_type=models.ContentType.SHORT_VIDEO,
        voice_gender=models.VoiceGender.FEMALE,
        status=models.ContentJobStatus.SCENES_GENERATED,
        scenes=[],
        created_by=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_dir = os.path.join("uploads", "content_studio", str(job.id))
    os.makedirs(job_dir, exist_ok=True)
    video_path = os.path.join(job_dir, "output.mp4")
    with open(video_path, "wb") as f:
        f.write(content)

    job.output_video_url = f"/static/content_studio/{job.id}/output.mp4"
    job.status = models.ContentJobStatus.DONE
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=schemas_content_studio.Job)
def get_job(job_id: int, db: Session = Depends(database.get_db)):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs", response_model=schemas_content_studio.JobListResponse)
def list_jobs(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db)):
    query = db.query(models.ContentStudioJob).order_by(models.ContentStudioJob.created_at.desc())
    total = query.count()
    jobs = query.offset(skip).limit(limit).all()
    return schemas_content_studio.JobListResponse(total=total, jobs=jobs)


@router.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(database.get_db)):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == models.ContentJobStatus.RENDERING:
        raise HTTPException(status_code=409, detail="Cannot delete while rendering")

    job_dir = os.path.join("uploads", "content_studio", str(job_id))
    shutil.rmtree(job_dir, ignore_errors=True)

    db.delete(job)
    db.commit()


def _get_ready_job(job_id: int, db: Session) -> models.ContentStudioJob:
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != models.ContentJobStatus.DONE or not job.output_video_url:
        raise HTTPException(status_code=400, detail="Video is not ready yet. Render it first.")
    return job


@router.post("/jobs/{job_id}/generate-caption", response_model=schemas_content_studio.CaptionSuggestion)
@limiter.limit("10/minute")
def generate_caption(request: Request, job_id: int, db: Session = Depends(database.get_db)):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return schemas_content_studio.CaptionSuggestion(caption=content_studio_llm.generate_social_caption(job.topic))


class GenerateSocialCopyRequest(BaseModel):
    platform: Literal["twitter", "linkedin"]


@router.post("/jobs/{job_id}/generate-social-copy", response_model=schemas_content_studio.SocialCopySuggestion)
@limiter.limit("10/minute")
def generate_social_copy(request: Request, job_id: int, payload: GenerateSocialCopyRequest, db: Session = Depends(database.get_db)):
    job = db.get(models.ContentStudioJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = content_studio_llm.generate_social_copy(job.topic, payload.platform)
    return schemas_content_studio.SocialCopySuggestion(**result)


@router.post("/jobs/{job_id}/post/facebook", response_model=schemas_content_studio.Job)
@limiter.limit("5/minute")
async def post_facebook(
    request: Request,
    job_id: int,
    payload: schemas_content_studio.PostSocialRequest,
    db: Session = Depends(database.get_db),
):
    job = _get_ready_job(job_id, db)
    caption = f"{payload.caption}\n\n{payload.seo_keywords}" if payload.seo_keywords else payload.caption
    await asyncio.to_thread(content_studio_social.post_to_facebook, job.output_video_url, caption)
    job.posted_facebook_at = datetime.now(timezone.utc)
    job.seo_keywords_facebook = payload.seo_keywords
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/post/instagram", response_model=schemas_content_studio.Job)
@limiter.limit("5/minute")
async def post_instagram(
    request: Request,
    job_id: int,
    payload: schemas_content_studio.PostSocialRequest,
    db: Session = Depends(database.get_db),
):
    job = _get_ready_job(job_id, db)
    caption = f"{payload.caption}\n\n{payload.seo_keywords}" if payload.seo_keywords else payload.caption
    await asyncio.to_thread(content_studio_social.post_to_instagram, job.output_video_url, caption)
    job.posted_instagram_at = datetime.now(timezone.utc)
    job.seo_keywords_instagram = payload.seo_keywords
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/post/youtube", response_model=schemas_content_studio.Job)
@limiter.limit("5/minute")
async def post_youtube(
    request: Request,
    job_id: int,
    payload: schemas_content_studio.PostSocialRequest,
    db: Session = Depends(database.get_db),
):
    job = _get_ready_job(job_id, db)
    tags = [t.strip() for t in payload.seo_keywords.split(",") if t.strip()] if payload.seo_keywords else None
    result = await asyncio.to_thread(content_studio_youtube.post_to_youtube, job.output_video_url, job.topic, payload.caption, tags)
    job.posted_youtube_at = datetime.now(timezone.utc)
    job.youtube_video_id = result.get("id")
    job.seo_keywords_youtube = payload.seo_keywords
    db.commit()
    db.refresh(job)
    return job


async def _run_render_job(job_id: int):
    """Runs off the request/response cycle (scheduled via asyncio.create_task,
    same pattern as main.py's billing_loop/_stale_request_sweep). Opens its own
    DB session since the request-scoped one closes when the response returns.
    Blocking TTS/image/ffmpeg calls run in a thread so this doesn't stall the
    single event loop (shared with live chat billing) for the whole render.
    """
    db = SessionLocal()
    try:
        job = db.get(models.ContentStudioJob, job_id)
        if not job:
            return

        job_dir = os.path.join("uploads", "content_studio", str(job_id))
        os.makedirs(job_dir, exist_ok=True)

        # Fresh dict copies (not job.scenes' own dict objects) -- mutating shared
        # dicts in place before reassigning job.scenes confuses SQLAlchemy's
        # change detection and can silently no-op the UPDATE.
        scenes = [dict(s) for s in job.scenes]
        clip_paths = []
        for scene in scenes:
            idx = scene["index"]
            try:
                image_path = os.path.join(job_dir, f"scene_{idx}.jpg")
                if not os.path.exists(image_path):
                    # Reuse the already-generated/approved preview image (from
                    # generate_scene_image) if present, instead of generating a
                    # different one at render time -- only a fallback for scenes
                    # where the admin skipped previewing.
                    image_bytes = await asyncio.to_thread(content_studio_images.generate_image, scene["image_prompt_en"])
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    scene["full_image_prompt"] = content_studio_images.build_prompt(scene["image_prompt_en"])

                audio_bytes = await asyncio.to_thread(
                    content_studio_tts.get_narration_audio, scene["narration_hi"], job.voice_gender.value
                )
                audio_path = os.path.join(job_dir, f"scene_{idx}.wav")
                with open(audio_path, "wb") as f:
                    f.write(audio_bytes)

                clip_path = os.path.join(job_dir, f"scene_{idx}_clip.mp4")
                await asyncio.to_thread(
                    content_studio_video.build_scene_clip,
                    image_path, audio_path, scene["narration_hi"], job_dir, clip_path,
                )

                scene["image_url"] = f"/static/content_studio/{job_id}/scene_{idx}.jpg"
                scene["audio_url"] = f"/static/content_studio/{job_id}/scene_{idx}.wav"
                scene["duration_sec"] = await asyncio.to_thread(content_studio_video.get_audio_duration, audio_path)
                scene["error"] = None
                clip_paths.append(clip_path)
            except Exception as e:
                scene["error"] = getattr(e, "detail", str(e))
                raise
            finally:
                job.scenes = list(scenes)
                flag_modified(job, "scenes")
                db.commit()

        output_path = os.path.join(job_dir, "output.mp4")
        await asyncio.to_thread(content_studio_video.concat_clips, clip_paths, job_dir, output_path)

        job.output_video_url = f"/static/content_studio/{job_id}/output.mp4"
        job.status = models.ContentJobStatus.DONE
        db.commit()
    except Exception as e:
        print(f"Content Studio: render job {job_id} failed: {e}")
        job = db.get(models.ContentStudioJob, job_id)
        if job:
            job.status = models.ContentJobStatus.FAILED
            job.error_message = getattr(e, "detail", str(e)) or "Rendering failed."
            db.commit()
    finally:
        db.close()
