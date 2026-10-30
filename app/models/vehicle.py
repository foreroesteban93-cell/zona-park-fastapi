from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.parking_session import ParkingSession


# ==========================================
# 1. Base Común
# ==========================================
class VehicleBase(SQLModel):
    """Atributos comunes del vehículo."""

    plate: str = Field(
        min_length=5,
        max_length=10,
        unique=True,
        index=True,
        description="Placa del vehículo (única), ej: ABC123",
    )
    vehicle_type: str = Field(
        max_length=20,
        description="Tipo de vehículo: carro, moto o bicicleta",
    )
    brand: str | None = Field(
        default=None,
        max_length=50,
        description="Marca del vehículo (opcional)",
    )
    color: str | None = Field(
        default=None,
        max_length=30,
        description="Color del vehículo (opcional)",
    )
    customer_id: int | None = Field(
        default=None,
        foreign_key="customers.id",
        description="Dueño del vehículo (opcional, visitantes no se registran)",
    )


# ==========================================
# 2. Tabla de Base de Datos
# ==========================================
class Vehicle(VehicleBase, table=True):
    """Tabla física de vehículos."""

    __tablename__ = "vehicles"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Lado "muchos" -> cada vehículo pertenece a un cliente (opcional)
    customer: Optional["Customer"] = Relationship(back_populates="vehicles")
    # Lado "1" -> un vehículo tiene muchas sesiones de parqueo
    sessions: list["ParkingSession"] = Relationship(back_populates="vehicle")


# ==========================================
# 3. DTOs de la API
# ==========================================
class VehicleCreate(VehicleBase):
    """Datos requeridos para registrar un vehículo (POST)."""

    pass


class VehicleUpdate(SQLModel):
    """Datos para editar un vehículo (PATCH, todo opcional)."""

    plate: str | None = Field(default=None, min_length=5, max_length=10)
    vehicle_type: str | None = Field(default=None, max_length=20)
    brand: str | None = Field(default=None, max_length=50)
    color: str | None = Field(default=None, max_length=30)
    customer_id: int | None = Field(default=None)


class VehiclePublic(VehicleBase):
    """Datos que la API devuelve al cliente (GET)."""

    id: int
    created_at: datetime
    updated_at: datetime