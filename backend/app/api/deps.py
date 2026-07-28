"""Reusable FastAPI dependencies: current-user resolution and RBAC guards."""
import logging
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import audit
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
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        audit.log_event(
            audit.TOKEN_INVALID, request, reason="undecodable_or_wrong_type",
            level=logging.WARNING,
        )
        raise _CREDENTIALS_EXC

    raw_subject = payload.get("sub")
    if raw_subject is None:
        audit.log_event(
            audit.TOKEN_INVALID, request, reason="missing_sub", level=logging.WARNING
        )
        raise _CREDENTIALS_EXC

    # A non-numeric `sub` used to raise ValueError here and surface as an
    # unhandled 500 — an availability and information-disclosure bug reachable
    # by anyone able to present a token with a malformed subject.
    try:
        user_id = int(raw_subject)
    except (TypeError, ValueError):
        audit.log_event(
            audit.TOKEN_INVALID, request, reason="non_numeric_sub",
            level=logging.WARNING,
        )
        raise _CREDENTIALS_EXC

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        # A validly signed token for a deleted/disabled account is a strong
        # signal: either stale credentials or a leaked signing key.
        audit.log_event(
            audit.TOKEN_UNKNOWN_SUBJECT, request, user_id=user_id,
            reason="missing_user" if user is None else "inactive_user",
            level=logging.WARNING,
        )
        raise _CREDENTIALS_EXC

    # The role is re-read from the database on every request rather than
    # trusted from the token claim, so a revoked/downgraded privilege takes
    # effect immediately instead of at token expiry.
    return user


def require_roles(*allowed: str) -> Callable[..., User]:
    """Guard factory: allow only the *exact* roles passed in."""
    allowed_set = {r for r in allowed}

    def guard(request: Request, user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_set:
            audit.log_event(
                audit.RBAC_DENIED, request, user_id=user.id, role=user.role,
                required=",".join(sorted(allowed_set)), check="exact",
                level=logging.WARNING,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para este recurso",
            )
        return user

    return guard


def require_min_level(role: str) -> Callable[..., User]:
    """Guard factory: allow the given role *and above* (privilege ladder)."""
    threshold = ROLE_LEVEL[role]

    def guard(request: Request, user: User = Depends(get_current_user)) -> User:
        if ROLE_LEVEL.get(user.role, 0) < threshold:
            audit.log_event(
                audit.RBAC_DENIED, request, user_id=user.id, role=user.role,
                required=f">={role}", check="min_level", level=logging.WARNING,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nivel de privilegio insuficiente",
            )
        return user

    return guard
