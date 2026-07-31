"""
Free public astrology tools router — Manglik/Yoga dosha check, Navamsa (D9) chart,
and Numerology profile. No auth required; anyone can use these directly from the
homepage. Every result is cached indefinitely (deterministic given the inputs) so
repeat lookups for the same person don't re-hit FreeAstroAPI's daily quota.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import database, models, schemas
from ..free_astro_service import (
    generate_numerology_profile,
    generate_vargas,
    generate_yogas,
    get_numerology_methods,
)

router = APIRouter(prefix="/free-tools", tags=["Free Tools"])

# Numerology requires a `method` id that FreeAstroAPI defines; cache the first
# available method in-process rather than calling GET /numerology/methods on
# every request (it's static metadata, not worth spending quota on repeatedly).
_numerology_method_cache: dict = {"method": None}


async def _default_numerology_method() -> str:
    if _numerology_method_cache["method"]:
        return _numerology_method_cache["method"]

    try:
        data = await get_numerology_methods()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    methods = data.get("methods") if isinstance(data, dict) else data
    first = methods[0] if methods else None
    method_id = first.get("id") if isinstance(first, dict) else first

    if not method_id:
        raise HTTPException(status_code=502, detail="Could not determine a numerology method from FreeAstroAPI")

    _numerology_method_cache["method"] = method_id
    return method_id


@router.post("/manglik-check", response_model=schemas.ManglikCheckResponse)
async def manglik_check(
    request: schemas.FreeToolBirthRequest,
    db: Session = Depends(database.get_db),
):
    """Detect Manglik/Mangal Dosha and other yogas for a birth chart."""
    existing = db.query(models.ManglikCheck).filter(
        models.ManglikCheck.date_of_birth == request.date_of_birth,
        models.ManglikCheck.time_of_birth == request.time_of_birth,
        models.ManglikCheck.place_of_birth == request.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        yogas_data = await generate_yogas(
            birth_date=request.date_of_birth.isoformat(),
            birth_time=request.time_of_birth.strftime("%H:%M:%S"),
            birth_place=request.place_of_birth,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.ManglikCheck(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        time_of_birth=request.time_of_birth,
        place_of_birth=request.place_of_birth,
        yogas_data=yogas_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.ManglikCheck).filter(
            models.ManglikCheck.date_of_birth == request.date_of_birth,
            models.ManglikCheck.time_of_birth == request.time_of_birth,
            models.ManglikCheck.place_of_birth == request.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/navamsa", response_model=schemas.NavamsaChartResponse)
async def navamsa_chart(
    request: schemas.FreeToolBirthRequest,
    db: Session = Depends(database.get_db),
):
    """Generate the Navamsa (D9) divisional chart for a birth chart."""
    existing = db.query(models.NavamsaChart).filter(
        models.NavamsaChart.date_of_birth == request.date_of_birth,
        models.NavamsaChart.time_of_birth == request.time_of_birth,
        models.NavamsaChart.place_of_birth == request.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        vargas_data = await generate_vargas(
            birth_date=request.date_of_birth.isoformat(),
            birth_time=request.time_of_birth.strftime("%H:%M:%S"),
            birth_place=request.place_of_birth,
            vargas=["D9"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.NavamsaChart(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        time_of_birth=request.time_of_birth,
        place_of_birth=request.place_of_birth,
        vargas_data=vargas_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.NavamsaChart).filter(
            models.NavamsaChart.date_of_birth == request.date_of_birth,
            models.NavamsaChart.time_of_birth == request.time_of_birth,
            models.NavamsaChart.place_of_birth == request.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/numerology", response_model=schemas.NumerologyProfileResponse)
async def numerology_profile(
    request: schemas.NumerologyRequest,
    db: Session = Depends(database.get_db),
):
    """Generate a numerology profile from a name and date of birth."""
    method = await _default_numerology_method()

    existing = db.query(models.NumerologyProfile).filter(
        models.NumerologyProfile.subject_name == request.full_name,
        models.NumerologyProfile.date_of_birth == request.date_of_birth,
    ).first()
    if existing:
        return existing

    try:
        profile_data = await generate_numerology_profile(
            subject_name=request.full_name,
            birth_date=request.date_of_birth.isoformat(),
            method=method,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.NumerologyProfile(
        subject_name=request.full_name,
        date_of_birth=request.date_of_birth,
        method=method,
        profile_data=profile_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.NumerologyProfile).filter(
            models.NumerologyProfile.subject_name == request.full_name,
            models.NumerologyProfile.date_of_birth == request.date_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record
