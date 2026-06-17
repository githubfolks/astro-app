from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from jose import JWTError
from .. import models, models_edu, schemas_edu, database
from .auth import get_current_user, get_current_user_optional
from ..services import miro_service, email_service
from datetime import datetime, timedelta, timezone
import os
import hmac

router = APIRouter(
    prefix="/edu",
    tags=["Education"]
)

# Course Management
@router.post("/courses", response_model=schemas_edu.CourseResponse)
def create_course(course: schemas_edu.CourseCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Only admins or tutors can create courses")
    
    course_data = course.dict()
    if current_user.role == models.UserRole.TUTOR:
        course_data['teacher_id'] = current_user.id

    db_course = models_edu.Course(**course_data)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.put("/courses/{course_id}", response_model=schemas_edu.CourseResponse)
def update_course(course_id: int, course_update: schemas_edu.CourseUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db_course = db.query(models_edu.Course).filter(models_edu.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.role != models.UserRole.ADMIN and db_course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this course")
    
    update_data = course_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/courses", response_model=List[schemas_edu.CourseResponse])
def list_courses(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_optional)):
    courses = db.query(models_edu.Course).options(
        joinedload(models_edu.Course.batches).options(
            joinedload(models_edu.Batch.enrollments).joinedload(models_edu.BatchEnrollment.user),
            joinedload(models_edu.Batch.sessions)
        )
    ).filter(models_edu.Course.is_active == True).all()
    
    if current_user:
        # Get all enrollments for this user
        enrollments = db.query(models_edu.BatchEnrollment.batch_id).filter(
            models_edu.BatchEnrollment.user_id == current_user.id
        ).all()
        enrolled_batch_ids = {e.batch_id for e in enrollments}
        
        for course in courses:
            # Mark as enrolled if enrolled in ANY batch of this course
            course_batch_ids = {b.id for b in course.batches}
            course.is_enrolled = not course_batch_ids.isdisjoint(enrolled_batch_ids)
            
    return courses

@router.get("/my/courses", response_model=List[schemas_edu.CourseResponse])
def my_courses(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == models.UserRole.TUTOR:
        return db.query(models_edu.Course).options(
            joinedload(models_edu.Course.batches).options(
                joinedload(models_edu.Batch.enrollments).joinedload(models_edu.BatchEnrollment.user),
                joinedload(models_edu.Batch.sessions)
            )
        ).filter(models_edu.Course.teacher_id == current_user.id).all()
    elif current_user.role == models.UserRole.SEEKER:
        # Enrolled courses
        return db.query(models_edu.Course).options(joinedload(models_edu.Course.batches)).join(models_edu.Batch).join(models_edu.BatchEnrollment).filter(
            models_edu.BatchEnrollment.user_id == current_user.id
        ).all()
    return []

# Batch Management
@router.post("/batches", response_model=schemas_edu.BatchResponse)
def create_batch(batch: schemas_edu.BatchCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_batch = models_edu.Batch(**batch.dict())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)

    _notify_batch_created(background_tasks, db, db_batch, current_user)
    return db_batch


def _notify_batch_created(background_tasks: BackgroundTasks, db: Session, batch: models_edu.Batch, creator: models.User):
    """Email enrolled students and admins about a newly created batch.

    Batches are created empty, so the student notification is usually a no-op
    at creation time; it covers the case where enrollments already exist.
    """
    course = db.query(models_edu.Course).filter(models_edu.Course.id == batch.course_id).first()
    course_title = course.title if course else "your course"

    # Resolve the creator's display name (tutor or admin)
    tutor_name = None
    if creator.role == models.UserRole.ASTROLOGER and creator.astrologer_profile:
        tutor_name = creator.astrologer_profile.full_name
    elif creator.seeker_profile:
        tutor_name = creator.seeker_profile.full_name
    tutor_name = tutor_name or creator.email

    # Notify enrolled students
    for enrollment in batch.enrollments:
        student = enrollment.user
        if not student or not student.email:
            continue
        student_name = student.seeker_profile.full_name if student.seeker_profile else None
        subject, html = email_service.build_batch_created_student_email(student_name, batch.name, course_title)
        email_service.send_email(background_tasks, [student.email], subject, html)

    # Notify admins
    admin_emails = [
        u.email for u in db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).all() if u.email
    ]
    if admin_emails:
        subject, html = email_service.build_batch_created_admin_email(tutor_name, batch.name, course_title)
        email_service.send_email(background_tasks, admin_emails, subject, html)

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

@router.put("/sessions/{session_id}", response_model=schemas_edu.ClassSessionResponse)
def update_session(session_id: int, session: schemas_edu.ClassSessionUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.TUTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_session = db.query(models_edu.ClassSession).filter(models_edu.ClassSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = session.dict(exclude_unset=True)
    for key, value in session_data.items():
        setattr(db_session, key, value)
        
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/sessions", response_model=List[schemas_edu.ClassSessionResponse])
def list_sessions(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """
    Lists active sessions relevant to the current user.
    - Admins: All active sessions.
    - Tutors: Sessions for courses they teach.
    - Seekers: Sessions for batches they are enrolled in.
    """
    if current_user.role == models.UserRole.ADMIN:
        return db.query(models_edu.ClassSession).filter(models_edu.ClassSession.is_active == True).all()
        
    if current_user.role == models.UserRole.TUTOR:
        return db.query(models_edu.ClassSession)\
            .join(models_edu.Batch)\
            .join(models_edu.Course)\
            .filter(
                models_edu.Course.teacher_id == current_user.id,
                models_edu.ClassSession.is_active == True
            ).all()
            
    if current_user.role == models.UserRole.SEEKER:
        return db.query(models_edu.ClassSession)\
            .join(models_edu.Batch)\
            .join(models_edu.BatchEnrollment)\
            .filter(
                models_edu.BatchEnrollment.user_id == current_user.id,
                models_edu.ClassSession.is_active == True
            ).all()
            
    return []

# Enrollment
@router.post("/enroll", response_model=schemas_edu.BatchEnrollmentResponse)
def enroll_student(enrollment: schemas_edu.BatchEnrollmentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Check batch and course
    batch = db.query(models_edu.Batch).filter(models_edu.Batch.id == enrollment.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    course = db.query(models_edu.Course).filter(models_edu.Course.id == batch.course_id).first()

    # Check if already enrolled in this batch
    existing = db.query(models_edu.BatchEnrollment).filter(
        models_edu.BatchEnrollment.user_id == current_user.id,
        models_edu.BatchEnrollment.batch_id == enrollment.batch_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You are already enrolled in this batch")

    # Payment Logic
    if course and course.price > 0:
        wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
        if not wallet:
            # Auto-create wallet if missing (safety check)
            wallet = models.UserWallet(user_id=current_user.id, balance=0)
            db.add(wallet)
            db.flush()
        
        if wallet.balance < course.price:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED, 
                detail=f"Insufficient balance. Course price is {course.price}, but your balance is {wallet.balance}"
            )
        
        # Deduct balance
        wallet.balance -= course.price
        
        # Record Transaction
        transaction = models.WalletTransaction(
            user_id=current_user.id,
            amount=-course.price,
            transaction_type=models.TransactionType.COURSE_PURCHASE,
            description=f"Enrollment fee for course: {course.title}"
        )
        db.add(transaction)

    # Create Enrollment
    db_enrollment = models_edu.BatchEnrollment(
        user_id=current_user.id,
        batch_id=enrollment.batch_id
    )
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

    if now < sched_start - timedelta(minutes=10):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class session has not started yet. You can join 10 minutes before the scheduled time.")
    
    if now > sched_end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This class session has already ended.")

    # Check enrollment if current_user is a SEEKER
    if current_user.role == models.UserRole.SEEKER:
        enrollment = db.query(models_edu.BatchEnrollment).filter(
            models_edu.BatchEnrollment.user_id == current_user.id,
            models_edu.BatchEnrollment.batch_id == session.batch_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="You are not enrolled in this batch")
        role = "participant"
    elif current_user.role == models.UserRole.TUTOR:
        # A tutor may only moderate sessions for a course they actually teach.
        batch = db.query(models_edu.Batch).filter(models_edu.Batch.id == session.batch_id).first()
        course = db.query(models_edu.Course).filter(models_edu.Course.id == batch.course_id).first() if batch else None
        if not course or course.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="You are not the teacher of this course")
        role = "moderator"
    elif current_user.role == models.UserRole.ADMIN:
        role = "moderator"
    else:
        raise HTTPException(status_code=403, detail="Not authorized to join this session")

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
#
# mirotalk/sfu posts { "event": "join"|"exit"|"disconnect", "data": { room_id, peer_info } }
# with no auth header. If MIROTALK_WEBHOOK_SECRET is set, we expect it to be supplied
# via an X-MiroTalk-Secret header injected by a reverse proxy in front of the SFU;
# otherwise the endpoint is open (rely on network isolation).
def _peer_user_id(peer_info: dict) -> Optional[int]:
    """Recover our DB user id from the peer's JWT (carried in peer_info.peer_token)."""
    token = (peer_info or {}).get("peer_token")
    if not token:
        return None
    try:
        username = miro_service.decode_miro_token(token).get("username")
        return int(username)
    except (ValueError, TypeError, KeyError, JWTError):
        return None


@router.post("/webhooks/mirotalk")
async def mirotalk_webhook(request: Request, db: Session = Depends(database.get_db)):
    webhook_secret = os.getenv("MIROTALK_WEBHOOK_SECRET")
    if webhook_secret:
        provided = request.headers.get("X-MiroTalk-Secret", "")
        if not hmac.compare_digest(provided, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid webhook secret")

    body = await request.json()
    event = body.get("event")
    data = body.get("data", {}) or {}
    room_id = data.get("room_id")
    peer_info = data.get("peer_info", {}) or {}

    if not room_id:
        return {"status": "ignored"}

    session = db.query(models_edu.ClassSession).filter(
        models_edu.ClassSession.miro_room_id == room_id
    ).first()
    if not session:
        return {"status": "ignored"}

    user_id = _peer_user_id(peer_info)
    if not user_id:
        return {"status": "ignored"}

    if event == "join":
        # Avoid duplicate open records on reconnect/refresh.
        existing = db.query(models_edu.Attendance).filter(
            models_edu.Attendance.session_id == session.id,
            models_edu.Attendance.user_id == user_id,
            models_edu.Attendance.left_at == None
        ).first()
        if not existing:
            db.add(models_edu.Attendance(
                session_id=session.id,
                user_id=user_id,
                joined_at=datetime.utcnow()
            ))
            db.commit()

    elif event in ("exit", "disconnect"):
        attendance = db.query(models_edu.Attendance).filter(
            models_edu.Attendance.session_id == session.id,
            models_edu.Attendance.user_id == user_id,
            models_edu.Attendance.left_at == None
        ).order_by(models_edu.Attendance.joined_at.desc()).first()
        if attendance:
            attendance.left_at = datetime.utcnow()
            delta = attendance.left_at - attendance.joined_at
            attendance.duration_minutes = int(delta.total_seconds() / 60)
            db.commit()

    return {"status": "ok"}

# --- Course Materials ---

@router.post("/courses/{course_id}/materials", response_model=schemas_edu.CourseMaterialResponse)
def add_course_material(
    course_id: int, 
    material: schemas_edu.CourseMaterialCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TUTOR:
        raise HTTPException(status_code=403, detail="Only tutors can add materials")
    
    course = db.query(models_edu.Course).filter(models_edu.Course.id == course_id, models_edu.Course.teacher_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")

    db_material = models_edu.CourseMaterial(
        course_id=course.id,
        title=material.title,
        url=material.url,
        material_type=material.material_type
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

@router.get("/courses/{course_id}/materials", response_model=List[schemas_edu.CourseMaterialResponse])
def get_course_materials(
    course_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Only allow if user is the teacher or an enrolled student
    course = db.query(models_edu.Course).filter(models_edu.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == models.UserRole.SEEKER:
        # Check enrollment across ANY batch in this course
        enrollment = db.query(models_edu.BatchEnrollment).join(models_edu.Batch).filter(
            models_edu.BatchEnrollment.user_id == current_user.id,
            models_edu.Batch.course_id == course_id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")
    elif current_user.role == models.UserRole.TUTOR and course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these materials")

    return db.query(models_edu.CourseMaterial).filter(models_edu.CourseMaterial.course_id == course_id).all()

@router.delete("/materials/{material_id}")
def delete_course_material(
    material_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.TUTOR:
        raise HTTPException(status_code=403, detail="Only tutors can delete materials")

    material = db.query(models_edu.CourseMaterial).filter(models_edu.CourseMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    course = db.query(models_edu.Course).filter(models_edu.Course.id == material.course_id).first()
    if course.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this material")

    db.delete(material)
    db.commit()
    return {"status": "deleted"}
