from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle


# ==========================================
# 1. Base Común
# ==========================================
class CustomerBase(SQLModel):
    """Atributos comunes del cliente (dueño del vehículo)."""

    full_name: str = Field(
        min_length=3,
        max_length=120,
        index=True,
        description="Nombre completo del cliente",
    )
    document_number: str = Field(
        min_length=5,
        max_length=20,
        unique=True,
        index=True,
        description="Número de documento de identidad (único)",
    )
    phone: str | None = Field(
        default=None,
        max_length=20,
        description="Teléfono de contacto (opcional)",
    )
    email: str | None = Field(
        default=None,
        max_length=120,
        description="Correo electrónico (opcional)",
    )


# ==========================================
# 2. Tabla de Base de Datos
# ==========================================
class Customer(CustomerBase, table=True):
    """Tabla física de clientes."""

    __tablename__ = "customers"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación 1:N -> un cliente tiene muchos vehículos
    vehicles: list["Vehicle"] = Relationship(back_populates="customer")


# ==========================================
# 3. DTOs de la API
# ==========================================
class CustomerCreate(CustomerBase):
    """Datos requeridos para registrar un cliente (POST)."""

    pass


class CustomerUpdate(SQLModel):
    """Datos para editar un cliente (PATCH, todo opcional)."""

    full_name: str | None = Field(default=None, min_length=3, max_length=120)
    document_number: str | None = Field(default=None, min_length=5, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=120)


class CustomerPublic(CustomerBase):
    """Datos que la API devuelve al cliente (GET)."""

    id: int
    created_at: datetime
    updated_at: datetime