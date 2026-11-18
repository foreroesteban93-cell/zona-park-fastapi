from fastapi import APIRouter, status

from app.api.deps import VehicleServiceDep
from app.models.vehicle import (
    VehicleCreate,
    VehiclePublic,
    VehicleUpdate,
)

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"],
)


@router.post(
    "/",
    response_model=VehiclePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    service: VehicleServiceDep,
):
    return await service.create(vehicle_data)


@router.get(
    "/",
    response_model=list[VehiclePublic],
)
async def list_vehicles(
    service: VehicleServiceDep,
):
    return await service.list_all()


@router.get(
    "/{vehicle_id}",
    response_model=VehiclePublic,
)
async def get_vehicle(
    vehicle_id: int,
    service: VehicleServiceDep,
):
    return await service.get_by_id(vehicle_id)


@router.patch(
    "/{vehicle_id}",
    response_model=VehiclePublic,
)
async def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    service: VehicleServiceDep,
):
    return await service.update(vehicle_id, vehicle_data)


@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_vehicle(
    vehicle_id: int,
    service: VehicleServiceDep,
):
    await service.delete(vehicle_id)