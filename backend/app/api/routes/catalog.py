"""Public catalog routes: list vehicles with filters + fetch one."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import VehicleList, VehiclePublic
from app.models.vehicle import Vehicle

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=VehicleList)
def list_vehicles(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="Búsqueda por marca o modelo"),
    brand: str | None = None,
    body_type: str | None = None,
    fuel: str | None = None,
    price_max: float | None = Query(None, ge=0),
    featured: bool | None = None,
    sort: str = Query("relevance", pattern="^(relevance|price_asc|price_desc|year_desc)$"),
):
    """Filterable vehicle listing. Also returns facet lists so the frontend
    can build its filter controls without a second round-trip."""
    stmt = select(Vehicle).where(Vehicle.in_stock.is_(True))

    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            func.lower(Vehicle.brand).like(like) | func.lower(Vehicle.model).like(like)
        )
    if brand:
        stmt = stmt.where(Vehicle.brand == brand)
    if body_type:
        stmt = stmt.where(Vehicle.body_type == body_type)
    if fuel:
        stmt = stmt.where(Vehicle.fuel == fuel)
    if price_max is not None:
        stmt = stmt.where(Vehicle.price <= price_max)
    if featured is not None:
        stmt = stmt.where(Vehicle.featured.is_(featured))

    sort_map = {
        "price_asc": Vehicle.price.asc(),
        "price_desc": Vehicle.price.desc(),
        "year_desc": Vehicle.year.desc(),
        "relevance": Vehicle.featured.desc(),
    }
    stmt = stmt.order_by(sort_map[sort], Vehicle.id.asc())

    items = db.scalars(stmt).all()

    # Facets computed over the full in-stock inventory (not the filtered set).
    all_stmt = select(Vehicle).where(Vehicle.in_stock.is_(True))
    all_rows = db.scalars(all_stmt).all()
    prices = [float(v.price) for v in all_rows] or [0.0]

    return VehicleList(
        items=[VehiclePublic.model_validate(v) for v in items],
        total=len(items),
        brands=sorted({v.brand for v in all_rows}),
        body_types=sorted({v.body_type for v in all_rows}),
        fuels=sorted({v.fuel for v in all_rows}),
        price_min=min(prices),
        price_max=max(prices),
    )


@router.get("/{vehicle_id}", response_model=VehiclePublic)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehicle
