from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Village, Block, District, State
import crud

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/states")
def list_states(db: Session = Depends(get_db)):
    states = crud.get_states(db)
    return [{"id": s.id, "name": s.name} for s in states]


@router.get("/districts/{state_id}")
def list_districts(state_id: int, db: Session = Depends(get_db)):
    districts = crud.get_districts_by_state(db, state_id)
    return [{"id": d.id, "name": d.name} for d in districts]


@router.get("/blocks/{district_id}")
def list_blocks(district_id: int, db: Session = Depends(get_db)):
    blocks = crud.get_blocks_by_district(db, district_id)
    return [{"id": b.id, "name": b.name} for b in blocks]


@router.get("/villages/{block_id}")
def list_villages(block_id: int, db: Session = Depends(get_db)):
    villages = crud.get_villages_by_block(db, block_id)
    return [{"id": v.id, "name": v.name} for v in villages]


def _location_result(village):
    block = village.block
    district = block.district if block else None
    state = district.state if district else None
    return {
        "id": village.id,
        "name": village.name,
        "latitude": village.latitude,
        "longitude": village.longitude,
        "block": {"id": block.id, "name": block.name} if block else None,
        "district": {"id": district.id, "name": district.name} if district else None,
        "state": {"id": state.id, "name": state.name} if state else None,
    }


@router.get("/search")
def search_locations(q: str = Query(min_length=2, max_length=100), db: Session = Depends(get_db)):
    term = f"%{q.strip()}%"
    villages = (
        db.query(Village)
        .join(Block)
        .join(District)
        .join(State)
        .filter(
            (Village.name.ilike(term))
            | (Block.name.ilike(term))
            | (District.name.ilike(term))
            | (State.name.ilike(term))
        )
        .order_by(State.name, District.name, Block.name, Village.name)
        .limit(25)
        .all()
    )
    return [_location_result(v) for v in villages]


@router.get("/nearest")
def nearest_location(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    db: Session = Depends(get_db),
):
    villages = (
        db.query(Village)
        .filter(Village.latitude.isnot(None), Village.longitude.isnot(None))
        .all()
    )
    if not villages:
        raise HTTPException(
            status_code=404,
            detail="No locations have verified coordinates yet. Please search by locality instead.",
        )

    def distance_km(village):
        lat1, lon1, lat2, lon2 = map(
            radians, [latitude, longitude, village.latitude, village.longitude]
        )
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        return 6371 * 2 * asin(sqrt(min(1, a)))

    closest = min(villages, key=distance_km)
    result = _location_result(closest)
    result["distance_km"] = round(distance_km(closest), 2)
    return result
