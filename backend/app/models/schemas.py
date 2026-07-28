"""Pydantic request/response schemas (the API contract)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.roles import Role


class UserRegister(BaseModel):
    """Public self-registration payload.

    SECURITY: `role` is deliberately NOT part of this contract. Accepting a
    role from the request body let any anonymous caller mint a
    `desarrollador` (max privilege) account — a mass-assignment privilege
    escalation (CWE-269 / CWE-915). The role is now assigned server-side and
    is always `cliente`. Elevated roles must be granted out-of-band by an
    already-privileged operator.

    `extra="forbid"` makes a stray `"role": "..."` an explicit 422 instead of
    being silently ignored, so escalation attempts are visible in logs.
    """

    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    """User data safe to return to the client (never the password hash)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserPublic


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------
class VehiclePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brand: str
    model: str
    year: int
    price: float
    body_type: str
    fuel: str
    transmission: str
    color: str
    mileage_km: int
    hue: int
    tagline: str
    description: str
    featured: bool
    in_stock: bool


class VehicleList(BaseModel):
    """Paginated-ish envelope plus the distinct facets used to build filters."""
    items: list[VehiclePublic]
    total: int
    brands: list[str]
    body_types: list[str]
    fuels: list[str]
    price_min: float
    price_max: float
