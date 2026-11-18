from fastapi import APIRouter, status

from app.api.deps import ParkingSpaceServiceDep
from app.models.parking_space import (
    ParkingSpaceCreate,
    ParkingSpacePublic,
    ParkingSpaceUpdate,
)

router = APIRouter(
    prefix="/parking-spaces",
    tags=["Parking Spaces"],
)


@router.post(
    "/",
    response_model=ParkingSpacePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_parking_space(
    parking_space_data: ParkingSpaceCreate,
    service: ParkingSpaceServiceDep,
):
    return await service.create(parking_space_data)


@router.get(
    "/",
    response_model=list[ParkingSpacePublic],
)
async def list_parking_spaces(
    service: ParkingSpaceServiceDep,
):
    return await service.list_all()


@router.get(
    "/{parking_space_id}",
    response_model=ParkingSpacePublic,
)
async def get_parking_space(
    parking_space_id: int,
    service: ParkingSpaceServiceDep,
):
    return await service.get_by_id(parking_space_id)


@router.patch(
    "/{parking_space_id}",
    response_model=ParkingSpacePublic,
)
async def update_parking_space(
    parking_space_id: int,
    parking_space_data: ParkingSpaceUpdate,
    service: ParkingSpaceServiceDep,
):
    return await service.update(
        parking_space_id,
        parking_space_data,
    )


@router.delete(
    "/{parking_space_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_parking_space(
    parking_space_id: int,
    service: ParkingSpaceServiceDep,
):
    await service.delete(parking_space_id)