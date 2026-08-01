"""
Muhurat router — auspicious timing search (generic or personalized to a birth chart).
Astrologer-only endpoints that use FreeAstroAPI for muhurat calculation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..vedic_rishi_service import geocode_place
from ..free_astro_service import search_muhurat, search_personalized_muhurat
from .auth import get_current_user

router = APIRouter(
    prefix="/muhurat",
    tags=["Muhurat"]
)

MAX_RANGE_DAYS = 31


def _require_astrologer(current_user: models.User):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=403, detail="Only astrologers can access Muhurat features")


async def _resolve_search_params(request: schemas.MuhuratSearchRequest, db: Session):
    """Validate the request and resolve subject/geocode details shared by search and edit."""
    if request.end_date < request.start_date:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
    if (request.end_date - request.start_date).days > MAX_RANGE_DAYS:
        raise HTTPException(status_code=400, detail=f"Date range cannot exceed {MAX_RANGE_DAYS} days")

    subject_dob = subject_tob = subject_place = None
    subject_seeker_id = request.seeker_id

    if request.subject:
        subject_dob = request.subject.date_of_birth
        subject_tob = request.subject.time_of_birth
        subject_place = request.subject.place_of_birth
        subject_seeker_id = request.subject.seeker_id or request.seeker_id
    elif request.seeker_id:
        seeker_profile = db.query(models.SeekerProfile).filter(
            models.SeekerProfile.user_id == request.seeker_id
        ).first()
        if seeker_profile and seeker_profile.date_of_birth and seeker_profile.time_of_birth and seeker_profile.place_of_birth:
            subject_dob = seeker_profile.date_of_birth
            subject_tob = seeker_profile.time_of_birth
            subject_place = seeker_profile.place_of_birth
        else:
            raise HTTPException(status_code=400, detail="Seeker profile is missing birth details for a personalized search")

    personalized = subject_dob is not None

    try:
        lat, lon = await geocode_place(request.place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    return {
        "subject_seeker_id": subject_seeker_id,
        "subject_dob": subject_dob,
        "subject_tob": subject_tob,
        "subject_place": subject_place,
        "personalized": personalized,
        "lat": lat,
        "lon": lon,
        "rounded_lat": round(lat, 2),
        "rounded_lon": round(lon, 2),
    }


async def _run_muhurat_lookup(request: schemas.MuhuratSearchRequest, params: dict):
    """Call FreeAstroAPI for the resolved search params."""
    try:
        if params["personalized"]:
            subject_lat, subject_lon = await geocode_place(params["subject_place"])
            return await search_personalized_muhurat(
                start_date=request.start_date.isoformat(),
                end_date=request.end_date.isoformat(),
                latitude=params["lat"],
                longitude=params["lon"],
                purpose=request.purpose,
                subject={
                    "year": params["subject_dob"].year, "month": params["subject_dob"].month, "day": params["subject_dob"].day,
                    "hour": params["subject_tob"].hour, "minute": params["subject_tob"].minute,
                    "lat": subject_lat, "lng": subject_lon, "tz_str": "Asia/Kolkata",
                },
            )
        return await search_muhurat(
            start_date=request.start_date.isoformat(),
            end_date=request.end_date.isoformat(),
            latitude=params["lat"],
            longitude=params["lon"],
            purpose=request.purpose,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")


@router.post("/search", response_model=schemas.MuhuratSearchResponse)
async def search_muhurat_windows(
    request: schemas.MuhuratSearchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Search for auspicious muhurat windows in a date range, optionally personalized
    to a seeker's birth chart. Caches the result in muhurat_searches, keyed by the
    search parameters, so repeat lookups don't re-hit FreeAstroAPI.
    """
    _require_astrologer(current_user)

    params = await _resolve_search_params(request, db)

    existing = db.query(models.MuhuratSearch).filter(
        models.MuhuratSearch.purpose == request.purpose,
        models.MuhuratSearch.start_date == request.start_date,
        models.MuhuratSearch.end_date == request.end_date,
        models.MuhuratSearch.latitude == params["rounded_lat"],
        models.MuhuratSearch.longitude == params["rounded_lon"],
        models.MuhuratSearch.personalized == params["personalized"],
        models.MuhuratSearch.subject_date_of_birth == params["subject_dob"],
        models.MuhuratSearch.subject_time_of_birth == params["subject_tob"],
        models.MuhuratSearch.subject_place_of_birth == params["subject_place"],
    ).first()

    if existing:
        return existing

    muhurat_data = await _run_muhurat_lookup(request, params)

    result = models.MuhuratSearch(
        generated_by=current_user.id,
        seeker_id=params["subject_seeker_id"],
        purpose=request.purpose,
        start_date=request.start_date,
        end_date=request.end_date,
        place=request.place,
        latitude=params["rounded_lat"],
        longitude=params["rounded_lon"],
        personalized=params["personalized"],
        subject_date_of_birth=params["subject_dob"],
        subject_time_of_birth=params["subject_tob"],
        subject_place_of_birth=params["subject_place"],
        muhurat_data=muhurat_data,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return result


@router.get("/{search_id}", response_model=schemas.MuhuratSearchResponse)
def get_muhurat_search(
    search_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a specific Muhurat search by ID."""
    _require_astrologer(current_user)

    result = db.query(models.MuhuratSearch).filter(
        models.MuhuratSearch.id == search_id,
        models.MuhuratSearch.generated_by == current_user.id,
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Muhurat search not found")

    return result


@router.get("/history/all", response_model=List[schemas.MuhuratSearchResponse])
def get_astrologer_muhurat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all Muhurat searches performed by the current astrologer."""
    _require_astrologer(current_user)

    results = db.query(models.MuhuratSearch).filter(
        models.MuhuratSearch.generated_by == current_user.id
    ).order_by(models.MuhuratSearch.created_at.desc()).all()

    return results


@router.put("/{search_id}", response_model=schemas.MuhuratSearchResponse)
async def update_muhurat_search(
    search_id: int,
    request: schemas.MuhuratSearchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Edit a Muhurat search's parameters and re-run the lookup."""
    _require_astrologer(current_user)

    result = db.query(models.MuhuratSearch).filter(
        models.MuhuratSearch.id == search_id,
        models.MuhuratSearch.generated_by == current_user.id,
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Muhurat search not found")

    params = await _resolve_search_params(request, db)
    muhurat_data = await _run_muhurat_lookup(request, params)

    result.seeker_id = params["subject_seeker_id"]
    result.purpose = request.purpose
    result.start_date = request.start_date
    result.end_date = request.end_date
    result.place = request.place
    result.latitude = params["rounded_lat"]
    result.longitude = params["rounded_lon"]
    result.personalized = params["personalized"]
    result.subject_date_of_birth = params["subject_dob"]
    result.subject_time_of_birth = params["subject_tob"]
    result.subject_place_of_birth = params["subject_place"]
    result.muhurat_data = muhurat_data

    db.commit()
    db.refresh(result)

    return result


@router.delete("/{search_id}", status_code=204)
def delete_muhurat_search(
    search_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete a Muhurat search."""
    _require_astrologer(current_user)

    result = db.query(models.MuhuratSearch).filter(
        models.MuhuratSearch.id == search_id,
        models.MuhuratSearch.generated_by == current_user.id,
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Muhurat search not found")

    db.delete(result)
    db.commit()
