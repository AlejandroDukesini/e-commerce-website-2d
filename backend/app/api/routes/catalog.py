"""Public catalog routes: list vehicles with filters + fetch one."""
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.schemas import VehicleList, VehiclePublic
from app.models.vehicle import Vehicle

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=VehicleList)
def list_vehicles(
    db: Session = Depends(get_db),
    # Every free-text/filter field is length-capped. Unbounded strings reach
    # the LIKE evaluator and the query planner; a multi-megabyte `q` is a cheap
    # way to burn server CPU on an unauthenticated endpoint (CWE-770).
    q: str | None = Query(None, max_length=80, description="Búsqueda por marca o modelo"),
    brand: str | None = Query(None, max_length=60),
    body_type: str | None = Query(None, max_length=40),
    fuel: str | None = Query(None, max_length=30),
    price_max: float | None = Query(None, ge=0, le=1e12),
    featured: bool | None = None,
    sort: str = Query("relevance", pattern="^(relevance|price_asc|price_desc|year_desc)$"),
    limit: int = Query(100, ge=1, le=200, description="Máximo de resultados"),
    offset: int = Query(0, ge=0, le=100_000),
):
    """Filterable vehicle listing. Also returns facet lists so the frontend
    can build its filter controls without a second round-trip."""
    stmt = select(Vehicle).where(Vehicle.in_stock.is_(True))

    if q:
        # Escape the LIKE metacharacters so user input is matched literally.
        # Without this, a query of "%" matches the whole table and "_" acts as
        # a single-char wildcard — pattern injection into the LIKE operand.
        # (This is *not* SQL injection: the value is still a bound parameter.)
        escaped = q.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{escaped}%"
        stmt = stmt.where(
            func.lower(Vehicle.brand).like(like, escape="\\")
            | func.lower(Vehicle.model).like(like, escape="\\")
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

    # Full matching count before slicing, so the UI still reports the true
    # number of results while the response body stays bounded.
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # Bounded fetch: the endpoint is unauthenticated, so an unbounded
    # SELECT * would let any caller force the whole inventory into memory
    # and onto the wire on every request.
    items = db.scalars(stmt.limit(limit).offset(offset)).all()

    # Facets over the full in-stock inventory (not the filtered set), computed
    # as aggregates in SQL instead of materialising every row in Python.
    in_stock = Vehicle.in_stock.is_(True)
    brands = sorted(db.scalars(select(Vehicle.brand).where(in_stock).distinct()).all())
    body_types = sorted(
        db.scalars(select(Vehicle.body_type).where(in_stock).distinct()).all()
    )
    fuels = sorted(db.scalars(select(Vehicle.fuel).where(in_stock).distinct()).all())
    price_lo, price_hi = db.execute(
        select(func.min(Vehicle.price), func.max(Vehicle.price)).where(in_stock)
    ).one()

    return VehicleList(
        items=[VehiclePublic.model_validate(v) for v in items],
        total=total,
        brands=brands,
        body_types=body_types,
        fuels=fuels,
        price_min=float(price_lo or 0.0),
        price_max=float(price_hi or 0.0),
    )


@router.get("/{vehicle_id}", response_model=VehiclePublic)
def get_vehicle(vehicle_id: int = Path(ge=1, le=2**31 - 1), db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")
    return vehicle
