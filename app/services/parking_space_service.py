from fastapi import HTTPException

from app.models.parking_space import (
    ParkingSpaceCreate,
    ParkingSpaceUpdate,
)
from app.repositories.parking_space_repository import (
    ParkingSpaceRepository,
)


class ParkingSpaceService:
    def __init__(self, repository: ParkingSpaceRepository):
        self.repository = repository

    async def get_by_id(self, parking_space_id: int):
        parking_space = await self.repository.get_by_id(
            parking_space_id
        )

        if parking_space is None:
            raise HTTPException(
                status_code=404,
                detail="Espacio de parqueadero no encontrado",
            )

        return parking_space

    async def list_all(self):
        return await self.repository.get_all()

    async def create(self, parking_space_data: ParkingSpaceCreate):
        existing = await self.repository.get_by_code(
            parking_space_data.code
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="El código del espacio ya está registrado",
            )

        return await self.repository.create(parking_space_data)

    async def update(
        self,
        parking_space_id: int,
        parking_space_data: ParkingSpaceUpdate,
    ):
        parking_space = await self.get_by_id(parking_space_id)

        update_data = parking_space_data.model_dump(
            exclude_unset=True
        )

        code = update_data.get("code")

        if code:
            existing = await self.repository.get_by_code(code)

            if existing and existing.id != parking_space_id:
                raise HTTPException(
                    status_code=400,
                    detail="El código ya pertenece a otro espacio",
                )

        return await self.repository.update(
            parking_space_id,
            parking_space_data,
        )

    async def delete(self, parking_space_id: int):
        await self.get_by_id(parking_space_id)

        return await self.repository.delete(parking_space_id)