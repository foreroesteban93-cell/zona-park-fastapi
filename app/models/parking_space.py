from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.parking_session import ParkingSession


# ==========================================
# 1. Base Común
# ==========================================
class ParkingSpaceBase(SQLModel):
    """Atributos comunes de una celda del parqueadero."""

    code: str = Field(
        min_length=2,
        max_length=10,
        unique=True,
        index=True,
        description="Código de la celda (único), ej: A-01",
    )
    vehicle_type: str = Field(
        max_length=20,
        description="Tipo de vehículo que admite: carro, moto o bicicleta",
    )
    floor: int = Field(
        default=1,
        ge=0,
        le=20,
        description="Piso o nivel donde está la celda",
    )
    is_available: bool = Field(
        default=True,
        description="True si la celda está libre, False si está ocupada",
    )


# ==========================================
# 2. Tabla de Base de Datos
# ==========================================
class ParkingSpace(ParkingSpaceBase, table=True):
    """Tabla física de celdas."""

    __tablename__ = "parking_spaces"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación 1:N -> una celda tiene muchas sesiones de parqueo
    sessions: list["ParkingSession"] = Relationship(back_populates="space")


# ==========================================
# 3. DTOs de la API
# ==========================================
class ParkingSpaceCreate(ParkingSpaceBase):
    """Datos requeridos para crear una celda (POST)."""

    pass


class ParkingSpaceUpdate(SQLModel):
    """Datos para editar una celda (PATCH, todo opcional)."""

    code: str | None = Field(default=None, min_length=2, max_length=10)
    vehicle_type: str | None = Field(default=None, max_length=20)
    floor: int | None = Field(default=None, ge=0, le=20)
    is_available: bool | None = Field(default=None)


class ParkingSpacePublic(ParkingSpaceBase):
    """Datos que la API devuelve al cliente (GET)."""

    id: int
    created_at: datetime
    updated_at: datetime