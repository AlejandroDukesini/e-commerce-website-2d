"""Vehicle ORM model for the catalog."""
from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    brand: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    year: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), index=True, nullable=False)
    body_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)  # SUV, Sedán...
    fuel: Mapped[str] = mapped_column(String(30), nullable=False)  # Gasolina, Híbrido, Eléctrico
    transmission: Mapped[str] = mapped_column(String(30), nullable=False)
    color: Mapped[str] = mapped_column(String(30), nullable=False)
    mileage_km: Mapped[int] = mapped_column(Integer, default=0)
    # Accent hue (0-360) so the frontend can render a tasteful procedural
    # placeholder when resources/ has no real photo yet.
    hue: Mapped[int] = mapped_column(Integer, default=210)
    tagline: Mapped[str] = mapped_column(String(160), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
