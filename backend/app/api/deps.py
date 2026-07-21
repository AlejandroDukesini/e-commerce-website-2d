"""Reusable FastAPI dependencies: current-user resolution and RBAC guards."""
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.roles import ROLE_LEVEL
from app.models.user import User

# tokenUrl is only used by the OpenAPI docs "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/login")

_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No se pudieron validar las credenciales",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        raise _CREDENTIALS_EXC

    user_id = payload.get("sub")
    if user_id is None:
        raise _CREDENTIALS_EXC

    user = db.scalar(select(User).where(User.id == int(user_id)))
    if user is None or not user.is_active:
        raise _CREDENTIALS_EXC
    return user


def require_roles(*allowed: str) -> Callable[..., User]:
    """Guard factory: allow only the *exact* roles passed in."""
    allowed_set = {r for r in allowed}

    def guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para este recurso",
            )
        return user

    return guard


def require_min_level(role: str) -> Callable[..., User]:
    """Guard factory: allow the given role *and above* (privilege ladder)."""
    threshold = ROLE_LEVEL[role]

    def guard(user: User = Depends(get_current_user)) -> User:
        if ROLE_LEVEL.get(user.role, 0) < threshold:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nivel de privilegio insuficiente",
            )
        return user

    return guard
