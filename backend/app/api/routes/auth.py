"""Authentication routes: register, login and current-user (/me)."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import audit
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    dummy_verify,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.models.roles import Role
from app.models.schemas import Token, UserLogin, UserPublic, UserRegister
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

# Single generic message for every credential failure: revealing whether the
# email exists turns login into a user-enumeration oracle (CWE-204).
_INVALID_CREDENTIALS = "Correo o contraseña incorrectos"


def _issue_token(user: User) -> Token:
    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=UserPublic.model_validate(user),
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new account. Rate limited to curb abuse/enumeration.

    SECURITY: the role is assigned here, server-side, and is always the lowest
    privilege (`cliente`). It is never read from the request body — see the
    note on `UserRegister`. Promoting a user to empleado/gerente/desarrollador
    is an administrative action performed out-of-band.
    """
    if db.scalar(select(User).where(User.email == payload.email)):
        audit.log_event(
            audit.REGISTER_DUPLICATE, request, email=payload.email,
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=Role.CLIENTE.value,  # server-assigned, never client-controlled
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    audit.log_event(
        audit.REGISTER_SUCCESS, request, user_id=user.id, email=user.email,
        role=user.role,
    )
    return _issue_token(user)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    """Validate credentials and return a signed JWT + public profile."""
    user = db.scalar(select(User).where(User.email == payload.email))

    if user is None:
        # Burn an equivalent bcrypt cycle so a missing account takes the same
        # wall-clock time as a wrong password. Without this, response latency
        # leaks which emails are registered (timing-based enumeration).
        dummy_verify(payload.password)
        audit.log_event(
            audit.LOGIN_FAILURE, request, email=payload.email,
            reason="unknown_email", level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_CREDENTIALS
        )

    if not verify_password(payload.password, user.hashed_password):
        audit.log_event(
            audit.LOGIN_FAILURE, request, user_id=user.id, email=payload.email,
            reason="bad_password", level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=_INVALID_CREDENTIALS
        )

    if not user.is_active:
        audit.log_event(
            audit.LOGIN_INACTIVE, request, user_id=user.id, email=user.email,
            level=logging.WARNING,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está desactivada",
        )

    audit.log_event(
        audit.LOGIN_SUCCESS, request, user_id=user.id, email=user.email,
        role=user.role,
    )
    return _issue_token(user)


@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile (used by frontend route guards)."""
    return current_user
