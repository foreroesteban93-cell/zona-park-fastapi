from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


# ==========================================
# 1. Base Común
# ==========================================
class RateBase(SQLModel):
    """Atributos comunes de una tarifa."""

    name: str = Field(
        min_length=3,
        max_length=60,
        index=True,
        description="Nombre de la tarifa, ej: Carro por hora",
    )
    vehicle_type: str = Field(
        max_length=20,
        description="Tipo de vehículo al que aplica: carro, moto o bicicleta",
    )
    price_per_hour: int = Field(
        ge=0,
        description="Valor de la hora en pesos colombianos (COP)",
    )
    price_per_day: int | None = Field(
        default=None,
        ge=0,
        description="Valor del día completo en COP (opcional)",
    )
    is_active: bool = Field(
        default=True,
        description="True si la tarifa está vigente",
    )


# ==========================================
# 2. Tabla de Base de Datos
# ==========================================
class Rate(RateBase, table=True):
    """Tabla física de tarifas."""

    __tablename__ = "rates"

    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# ==========================================
# 3. DTOs de la API
# ==========================================
class RateCreate(RateBase):
    """Datos requeridos para crear una tarifa (POST)."""

    pass


class RateUpdate(SQLModel):
    """Datos para editar una tarifa (PATCH, todo opcional)."""

    name: str | None = Field(default=None, min_length=3, max_length=60)
    vehicle_type: str | None = Field(default=None, max_length=20)
    price_per_hour: int | None = Field(default=None, ge=0)
    price_per_day: int | None = Field(default=None, ge=0)
    is_active: bool | None = Field(default=None)


class RatePublic(RateBase):
    """Datos que la API devuelve al cliente (GET)."""

    id: int
    created_at: datetime
    updated_at: datetime