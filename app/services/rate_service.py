from fastapi import HTTPException

from app.models.rate import RateCreate, RateUpdate
from app.repositories.rate_repository import RateRepository


class RateService:

    def __init__(self, repository: RateRepository):
        self.repository = repository

    async def get_by_id(self, rate_id: int):
        rate = await self.repository.get_by_id(rate_id)

        if rate is None:
            raise HTTPException(
                status_code=404,
                detail="Tarifa no encontrada",
            )

        return rate

    async def list_all(self):
        return await self.repository.get_all()

    async def list_active(self):
        return await self.repository.get_active()

    async def create(self, rate_data: RateCreate):
        rates = await self.repository.get_all()

        for rate in rates:
            if (
                rate.name.lower() == rate_data.name.lower()
                and rate.vehicle_type.lower()
                == rate_data.vehicle_type.lower()
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Ya existe una tarifa con ese nombre y tipo de vehículo",
                )

        return await self.repository.create(rate_data)

    async def update(self, rate_id: int, rate_data: RateUpdate):
        await self.get_by_id(rate_id)

        update_data = rate_data.model_dump(exclude_unset=True)

        if "name" in update_data or "vehicle_type" in update_data:
            rates = await self.repository.get_all()

            name = update_data.get("name")
            vehicle_type = update_data.get("vehicle_type")

            current_rate = await self.repository.get_by_id(rate_id)

            name = name or current_rate.name
            vehicle_type = vehicle_type or current_rate.vehicle_type

            for rate in rates:
                if (
                    rate.id != rate_id
                    and rate.name.lower() == name.lower()
                    and rate.vehicle_type.lower()
                    == vehicle_type.lower()
                ):
                    raise HTTPException(
                        status_code=400,
                        detail="Ya existe otra tarifa con ese nombre y tipo de vehículo",
                    )

        return await self.repository.update(rate_id, rate_data)

    async def delete(self, rate_id: int):
        await self.get_by_id(rate_id)
        return await self.repository.delete(rate_id)