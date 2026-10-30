from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle
    from app.models.parking_space import ParkingSpace
    from app.models.rate import Rate


# ==========================================
# 1. Base Común
# ==========================================
class ParkingSessionBase(SQLModel):
    """Datos que se piden al registrar la entrada de un vehículo."""

    vehicle_id: int = Field(
        foreign_key="vehicles.id",
        index=True,
        description="Vehículo que ingresa al parqueadero",
    )
    space_id: int = Field(
        foreign_key="parking_spaces.id",
        description="Celda asignada al vehículo",
    )
    rate_id: int = Field(
        foreign_key="rates.id",
        description="Tarifa aplicada a esta sesión",
    )


# ==========================================
# 2. Tabla de Base de Datos
# ==========================================
class ParkingSession(ParkingSessionBase, table=True):
    """Tabla física de sesiones (tickets) de parqueo."""

    __tablename__ = "parking_sessions"

    id: int | None = Field(default=None, primary_key=True)

    entry_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    exit_time: datetime | None = Field(
        default=None,
        description="Se llena al registrar la salida",
    )
    total_amount: int | None = Field(
        default=None,
        ge=0,
        description="Total a pagar en COP, se calcula al salir",
    )
    is_active: bool = Field(
        default=True,
        description="True mientras el vehículo siga dentro",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relaciones N:1 -> cada sesión pertenece a un vehículo,
    # una celda y una tarifa.
    vehicle: "Vehicle" = Relationship(
        back_populates="sessions"
    )
    space: "ParkingSpace" = Relationship(
        back_populates="sessions"
    )
    rate: "Rate" = Relationship(
        back_populates="sessions"
    )


# ==========================================
# 3. DTOs de la API
# ==========================================
class ParkingSessionCreate(ParkingSessionBase):
    """Registrar entrada de un vehículo (POST)."""

    pass


class ParkingSessionUpdate(SQLModel):
    """Editar o cerrar una sesión (PATCH, todo opcional)."""

    space_id: int | None = Field(default=None)
    rate_id: int | None = Field(default=None)
    exit_time: datetime | None = Field(default=None)
    total_amount: int | None = Field(default=None, ge=0)
    is_active: bool | None = Field(default=None)


class ParkingSessionPublic(ParkingSessionBase):
    """Datos que la API devuelve al cliente (GET)."""

    id: int
    entry_time: datetime
    exit_time: datetime | None
    total_amount: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
