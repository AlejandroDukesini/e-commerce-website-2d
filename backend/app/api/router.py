"""Top-level API router aggregating every route module."""
from fastapi import APIRouter, Depends

from app.api.deps import require_min_level
from app.api.routes import auth, catalog
from app.models.roles import Role
from app.models.user import User
from app.models.schemas import UserPublic

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(catalog.router)


@api_router.get(
    "/admin/ping",
    response_model=UserPublic,
    tags=["admin"],
    summary="RBAC smoke test (gerente o superior)",
)
def admin_ping(user: User = Depends(require_min_level(Role.GERENTE.value))):
    """Example endpoint proving the privilege-ladder guard works."""
    return user
