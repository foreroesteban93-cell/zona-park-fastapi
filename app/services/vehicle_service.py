from fastapi import HTTPException

from app.models.vehicle import VehicleCreate, VehicleUpdate
from app.repositories.vehicle_repository import VehicleRepository


class VehicleService:
    def __init__(self, repository: VehicleRepository):
        self.repository = repository

    async def get_by_id(self, vehicle_id: int):
        vehicle = await self.repository.get_by_id(vehicle_id)

        if vehicle is None:
            raise HTTPException(
                status_code=404,
                detail="Vehículo no encontrado",
            )

        return vehicle

    async def list_all(self):
        return await self.repository.get_all()

    async def create(self, vehicle_data: VehicleCreate):
        existing = await self.repository.get_by_plate(
            vehicle_data.plate
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="La placa ya está registrada",
            )

        return await self.repository.create(vehicle_data)

    async def update(
        self,
        vehicle_id: int,
        vehicle_data: VehicleUpdate,
    ):
        vehicle = await self.get_by_id(vehicle_id)

        update_data = vehicle_data.model_dump(
            exclude_unset=True
        )

        plate = update_data.get("plate")

        if plate:
            existing = await self.repository.get_by_plate(plate)

            if existing and existing.id != vehicle_id:
                raise HTTPException(
                    status_code=400,
                    detail="La placa pertenece a otro vehículo",
                )

        return await self.repository.update(
            vehicle_id,
            vehicle_data,
        )

    async def delete(self, vehicle_id: int):
        await self.get_by_id(vehicle_id)

        return await self.repository.delete(vehicle_id)