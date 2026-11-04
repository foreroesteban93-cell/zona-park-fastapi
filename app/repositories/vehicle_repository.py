from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.vehicle import Vehicle, VehicleCreate, VehicleUpdate


class VehicleRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, vehicle_data: VehicleCreate) -> Vehicle:
        vehicle = Vehicle.model_validate(vehicle_data)
        self.session.add(vehicle)
        await self.session.commit()
        await self.session.refresh(vehicle)
        return vehicle

    async def get_by_id(self, vehicle_id: int) -> Vehicle | None:
        statement = select(Vehicle).where(Vehicle.id == vehicle_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_by_plate(self, plate: str) -> Vehicle | None:
        statement = select(Vehicle).where(Vehicle.plate == plate)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Vehicle]:
        statement = select(Vehicle).order_by(Vehicle.id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def update(
        self,
        vehicle_id: int,
        vehicle_data: VehicleUpdate,
    ) -> Vehicle | None:
        vehicle = await self.get_by_id(vehicle_id)

        if vehicle is None:
            return None

        update_data = vehicle_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(vehicle, field, value)

        vehicle.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(vehicle)
        return vehicle

    async def delete(self, vehicle_id: int) -> bool:
        vehicle = await self.get_by_id(vehicle_id)

        if vehicle is None:
            return False

        await self.session.delete(vehicle)
        await self.session.commit()
        return True