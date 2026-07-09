"""Content Studio: generates Vedic-astrology short-video / voice-over-image
scripts (Groq), turns each scene into narrated visuals (Bhashini TTS +
Pollinations.ai images), and assembles a final vertical MP4 (ffmpeg) for the
admin to preview, download, and post manually to Facebook/Instagram/YouTube.
"""
import asyncio
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import models, schemas_content_studio, database
from ..database import SessionLocal
from ..limiter import limiter
from ..services import content_studio_llm, content_studio_tts, content_studio_images, content_studio_video
from .auth import get_current_admin

router = APIRouter(
    prefix="/content-studio",
    tags=["Content Studio"],
    dependencies=[Depends(get_current_admin)],
)


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
        content_type=content_type,
        status=models.ContentJobStatus.SCENES_GENERATED,
        scenes=scenes,
        created_by=current_user.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


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

        scenes = list(job.scenes)
        clip_paths = []
        for scene in scenes:
            idx = scene["index"]
            try:
                image_bytes = await asyncio.to_thread(content_studio_images.generate_image, scene["image_prompt_en"])
                image_path = os.path.join(job_dir, f"scene_{idx}.jpg")
                with open(image_path, "wb") as f:
                    f.write(image_bytes)

                audio_bytes = await asyncio.to_thread(content_studio_tts.text_to_speech, scene["narration_hi"])
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
                job.scenes = list(scenes)  # new list object so SQLAlchemy detects the JSON-column change
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
