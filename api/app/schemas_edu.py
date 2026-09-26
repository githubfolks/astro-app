from pydantic import BaseModel, Field, StringConstraints, model_validator
from datetime import datetime
from typing import Annotated, List, Optional
from decimal import Decimal
from enum import Enum

class BatchStatus(str, Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class SessionStatus(str, Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class UserSimple(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

# Batch Schemas
class BatchBase(BaseModel):
    name: str # e.g. "Batch A"
    max_students: int = 10
    status: BatchStatus = BatchStatus.UPCOMING

class BatchCreate(BatchBase):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    course_id: int

class BatchResponse(BatchBase):
    id: int
    course_id: int
    created_at: datetime
    enrollments: List["BatchEnrollmentResponse"] = []
    sessions: List["ClassSessionResponse"] = []

    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: Decimal = 0.0
    thumbnail_url: Optional[str] = None
    is_active: bool = True

class CourseCreate(CourseBase):
    teacher_id: int

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None

class CourseResponse(CourseBase):
    id: int
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    batches: List[BatchResponse] = []
    is_enrolled: Optional[bool] = False

    class Config:
        from_attributes = True

# Public catalogue schemas (GET /edu/courses, callable without login). They must never
# carry other students' details or classroom room ids — those are capabilities.
class PublicSession(BaseModel):
    id: int
    title: str
    scheduled_start: datetime
    scheduled_end: datetime

class PublicBatch(BaseModel):
    id: int
    name: str
    max_students: int
    status: BatchStatus
    seats_taken: int
    sessions: List[PublicSession] = []

class PublicCourse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price: Decimal
    thumbnail_url: Optional[str] = None
    is_enrolled: bool = False
    enrolled_batch_id: Optional[int] = None
    batches: List[PublicBatch] = []

# Session Schemas
class ClassSessionBase(BaseModel):
    title: str
    miro_room_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    status: SessionStatus = SessionStatus.UPCOMING
    is_active: bool = True

SessionTopic = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]

class ClassSessionCreate(ClassSessionBase):
    title: SessionTopic
    batch_id: int
    # Ignored: the server always generates the room id. Kept optional so older
    # clients that still send it are not rejected.
    miro_room_id: Optional[str] = None

    @model_validator(mode="after")
    def _end_after_start(self):
        if self.scheduled_end <= self.scheduled_start:
            raise ValueError("scheduled_end must be after scheduled_start")
        return self

class ClassSessionUpdate(BaseModel):
    title: Optional[SessionTopic] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    status: Optional[SessionStatus] = None
    is_active: Optional[bool] = None

class ClassSessionResponse(ClassSessionBase):
    id: int
    batch_id: int
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None

    class Config:
        from_attributes = True

# Enrollment Schemas
class BatchEnrollmentCreate(BaseModel):
    user_id: int
    batch_id: int
    payment_id: Optional[str] = None

class BatchEnrollmentResponse(BaseModel):
    id: int
    user_id: int
    batch_id: int
    enrolled_at: datetime
    user: Optional[UserSimple] = None

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceBase(BaseModel):
    session_id: int
    user_id: int
    joined_at: datetime
    left_at: Optional[datetime] = None
    duration_minutes: int = 0

class AttendanceResponse(AttendanceBase):
    id: int

    class Config:
        from_attributes = True

# Join response
class JoinClassResponse(BaseModel):
    room_url: str
    token: str
    session_id: int
    role: str

# Course Material Schemas
class CourseMaterialBase(BaseModel):
    title: str
    url: str
    material_type: str

class CourseMaterialCreate(CourseMaterialBase):
    course_id: int

class CourseMaterialResponse(CourseMaterialBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Admin Report Schemas
class AdminEnrollmentDetail(BaseModel):
    id: int
    user_id: int
    user_email: str
    course_title: str
    batch_name: str
    price: Decimal
    enrolled_at: datetime

    class Config:
        from_attributes = True

class AdminEduStatsResponse(BaseModel):
    total_enrollments: int
    total_earnings: Decimal
    enrollments: List[AdminEnrollmentDetail]

    class Config:
        from_attributes = True
