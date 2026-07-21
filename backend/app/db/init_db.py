"""Create tables and (optionally) seed one demo user per role.

Idempotent: safe to call on every startup — existing users are left alone.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models.roles import Role
from app.models.user import User
from app.models.vehicle import Vehicle

# email -> (full_name, password, role)
_DEMO_USERS = {
    "cliente@demo.com": ("Cliente Demo", "cliente1234", Role.CLIENTE),
    "empleado@demo.com": ("Empleado Demo", "empleado1234", Role.EMPLEADO),
    "gerente@demo.com": ("Gerente Demo", "gerente1234", Role.GERENTE),
    "dev@demo.com": ("Desarrollador Demo", "developer1234", Role.DESARROLLADOR),
}


def _seed_users(db: Session) -> None:
    for email, (name, password, role) in _DEMO_USERS.items():
        exists = db.scalar(select(User).where(User.email == email))
        if exists:
            continue
        db.add(
            User(
                full_name=name,
                email=email,
                hashed_password=hash_password(password),
                role=role.value,
            )
        )
    db.commit()


# (brand, model, year, price, body_type, fuel, transmission, color, mileage, hue, tagline, featured)
_DEMO_VEHICLES = [
    ("Toyota", "Corolla Cross", 2024, 118000000, "SUV", "Híbrido", "Automática", "Blanco Perla", 0, 205,
     "El equilibrio perfecto entre eficiencia y aventura.", True),
    ("Mazda", "CX-5 Signature", 2024, 165000000, "SUV", "Gasolina", "Automática", "Rojo Cristal", 0, 355,
     "Diseño KODO que emociona en cada curva.", True),
    ("Renault", "Koleos Iconic", 2023, 132000000, "SUV", "Gasolina", "Automática", "Gris Cassiopée", 12000, 220,
     "Espacio y confort premium para la familia.", False),
    ("Chevrolet", "Onix Turbo", 2024, 78000000, "Sedán", "Gasolina", "Automática", "Azul Boracay", 0, 210,
     "Conectividad y potencia para la ciudad.", True),
    ("Volkswagen", "Taos Highline", 2024, 142000000, "SUV", "Gasolina", "Automática", "Plata Pyrit", 0, 40,
     "Tecnología alemana al alcance de todos.", False),
    ("Nissan", "Sentra Exclusive", 2023, 98000000, "Sedán", "Gasolina", "Automática", "Negro Perla", 8000, 0,
     "Elegancia y seguridad en cada trayecto.", False),
    ("BYD", "Dolphin EV", 2024, 115000000, "Hatchback", "Eléctrico", "Automática", "Blanco Ártico", 0, 190,
     "El futuro eléctrico, hoy y sin ruido.", True),
    ("Kia", "Sportage GT-Line", 2024, 158000000, "SUV", "Híbrido", "Automática", "Verde Bosque", 0, 150,
     "Osadía en el diseño, calma al volante.", False),
    ("Ford", "Territory Titanium", 2023, 135000000, "SUV", "Gasolina", "Automática", "Gris Magnetic", 15000, 215,
     "Amplitud premium con carácter.", False),
    ("Suzuki", "Swift Sport", 2024, 72000000, "Hatchback", "Gasolina", "Manual", "Amarillo Champion", 0, 48,
     "Ligero, ágil y puro entusiasmo.", False),
]


def _seed_vehicles(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Vehicle)):
        return  # already seeded
    for (brand, model, year, price, body, fuel, trans, color, km, hue, tag, feat) in _DEMO_VEHICLES:
        db.add(
            Vehicle(
                brand=brand, model=model, year=year, price=price, body_type=body,
                fuel=fuel, transmission=trans, color=color, mileage_km=km, hue=hue,
                tagline=tag, description=tag, featured=feat, in_stock=True,
            )
        )
    db.commit()


def init_db() -> None:
    # Import side-effect: ensures models are registered on Base before create_all.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if settings.seed_demo_users:
            _seed_users(db)
        _seed_vehicles(db)
