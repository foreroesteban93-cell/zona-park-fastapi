from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.parking_space import (
    ParkingSpace,
    ParkingSpaceCreate,
    ParkingSpaceUpdate,
)


class ParkingSpaceRepository:
    """Repository para gestionar los espacios de parqueadero."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        parking_space_data: ParkingSpaceCreate,
    ) -> ParkingSpace:
        """Crear un espacio de parqueadero."""
        parking_space = ParkingSpace.model_validate(parking_space_data)

        self.session.add(parking_space)
        await self.session.commit()
        await self.session.refresh(parking_space)

        return parking_space

    async def get_by_id(
        self,
        parking_space_id: int,
    ) -> ParkingSpace | None:
        """Obtener un espacio por su ID."""
        statement = select(ParkingSpace).where(
            ParkingSpace.id == parking_space_id
        )

        result = await self.session.execute(statement)

        return result.scalar_one_or_none()

    async def get_by_code(
        self,
        code: str,
    ) -> ParkingSpace | None:
        """Obtener un espacio por su código."""
        statement = select(ParkingSpace).where(
            ParkingSpace.code == code
        )

        result = await self.session.execute(statement)

        return result.scalar_one_or_none()

    async def get_all(self) -> list[ParkingSpace]:
        """Obtener todos los espacios de parqueadero."""
        statement = select(ParkingSpace).order_by(ParkingSpace.id)

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(
        self,
        parking_space_id: int,
        parking_space_data: ParkingSpaceUpdate,
    ) -> ParkingSpace | None:
        """Actualizar un espacio de parqueadero."""
        parking_space = await self.get_by_id(parking_space_id)

        if parking_space is None:
            return None

        update_data = parking_space_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(parking_space, field, value)

        parking_space.updated_at = datetime.now(timezone.utc)

        self.session.add(parking_space)
        await self.session.commit()
        await self.session.refresh(parking_space)

        return parking_space

    async def delete(self, parking_space_id: int) -> bool:
        """Eliminar un espacio de parqueadero."""
        parking_space = await self.get_by_id(parking_space_id)

        if parking_space is None:
            return False

        await self.session.delete(parking_space)
        await self.session.commit()

        return True