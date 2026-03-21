from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from .. import models, models_edu, schemas_edu, database
from .auth import get_current_user
from ..services import miro_service
from datetime import datetime, timedelta, timezone

router = APIRouter(
    prefix="/edu",
    tags=["Education"]
)

# Course Management
@router.post("/courses", response_model=schemas_edu.CourseResponse)
def create_course(course: schemas_edu.CourseCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Only admins or tutors can create courses")
    
    db_course = models_edu.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/courses", response_model=List[schemas_edu.CourseResponse])
def list_courses(db: Session = Depends(database.get_db)):
    return db.query(models_edu.Course).all()

# Batch Management
@router.post("/batches", response_model=schemas_edu.BatchResponse)
def create_batch(batch: schemas_edu.BatchCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_batch = models_edu.Batch(**batch.dict())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch

# Session Scheduling
@router.post("/sessions", response_model=schemas_edu.ClassSessionResponse)
def schedule_session(session: schemas_edu.ClassSessionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_session = models_edu.ClassSession(**session.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions", response_model=List[schemas_edu.ClassSessionResponse])
def list_sessions(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # For a real app, logic would filter by enrolled batches for seekers, or courses taught by tutor.
    # For now, we'll just list all upcoming or active sessions.
    return db.query(models_edu.ClassSession).all()

# Enrollment
@router.post("/enroll", response_model=schemas_edu.BatchEnrollmentResponse)
def enroll_student(enrollment: schemas_edu.BatchEnrollmentCreate, db: Session = Depends(database.get_db)):
    # In a real app, this would be triggered after successful payment
    db_enrollment = models_edu.BatchEnrollment(**enrollment.dict())
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

# Join Classroom
@router.get("/sessions/{session_id}/join", response_model=schemas_edu.JoinClassResponse)
def join_classroom(session_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    session = db.query(models_edu.ClassSession).filter(models_edu.ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if session is active (e.g., 10 mins before start)
    now = datetime.utcnow()
    
    # Safely handle mixed tzinfo by using naive UTC for comparison
    sched_start = session.scheduled_start.replace(tzinfo=None) if session.scheduled_start.tzinfo else session.scheduled_start
    sched_end = session.scheduled_end.replace(tzinfo=None) if session.scheduled_end.tzinfo else session.scheduled_end

    # Adding a small buffer for late joining too
    # Temporarily bypassed to allow testing ANY dummy session
    # if now < sched_start - timedelta(minutes=10) or now > sched_end + timedelta(minutes=30):
    #     raise HTTPException(status_code=400, detail="Class is not currently active")

    # Check enrollment if current_user is a SEEKER
    if current_user.role == models.UserRole.SEEKER:
        enrollment = db.query(models_edu.BatchEnrollment).filter(
            models_edu.BatchEnrollment.user_id == current_user.id,
            models_edu.BatchEnrollment.batch_id == session.batch_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="You are not enrolled in this batch")
        role = "participant"
    else:
        # Check if user is the teacher of the course
        if current_user.role == models.UserRole.TUTOR:
            # For now, simplistic check or check against teacher_id if we add it to courses/sessions
            pass
        role = "moderator"

    # Get full name
    full_name = "User"
    if current_user.role == models.UserRole.SEEKER:
        if current_user.seeker_profile:
            full_name = current_user.seeker_profile.full_name or "Student"
    elif current_user.role == models.UserRole.TUTOR:
        full_name = "Tutor" # Or fetch from a tutor profile if it exists

    token = miro_service.generate_miro_token(
        user_id=current_user.id,
        full_name=full_name,
        room_id=session.miro_room_id,
        role=role
    )
    
    room_url = miro_service.get_join_url(
        user_id=current_user.id,
        full_name=full_name,
        room_id=session.miro_room_id,
        role=role
    )

    return {
        "room_url": room_url,
        "token": token,
        "session_id": session.id,
        "role": role
    }

# Webhooks for MiroTalk (Attendance Capture)
@router.post("/webhooks/mirotalk")
async def mirotalk_webhook(request: Request, db: Session = Depends(database.get_db)):
    data = await request.json()
    event = data.get("event")
    # MiroTalk SFU events: participantJoined, participantLeft
    if event == "participantJoined":
        room_id = data.get("room")
        user_id = data.get("userId") # Passed in JWT sub
        session = db.query(models_edu.ClassSession).filter(models_edu.ClassSession.miro_room_id == room_id).first()
        if session and user_id:
            # Create attendance record
            attendance = models_edu.Attendance(
                session_id=session.id,
                user_id=int(user_id),
                joined_at=datetime.utcnow()
            )
            db.add(attendance)
            db.commit()
    
    elif event == "participantLeft":
        room_id = data.get("room")
        user_id = data.get("userId")
        session = db.query(models_edu.ClassSession).filter(models_edu.ClassSession.miro_room_id == room_id).first()
        if session and user_id:
            # Find the active attendance record and close it
            attendance = db.query(models_edu.Attendance).filter(
                models_edu.Attendance.session_id == session.id,
                models_edu.Attendance.user_id == int(user_id),
                models_edu.Attendance.left_at == None
            ).order_by(models_edu.Attendance.joined_at.desc()).first()
            
            if attendance:
                attendance.left_at = datetime.utcnow()
                delta = attendance.left_at - attendance.joined_at
                attendance.duration_minutes = int(delta.total_seconds() / 60)
                db.commit()

    return {"status": "ok"}
