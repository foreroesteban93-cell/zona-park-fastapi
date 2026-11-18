from fastapi import APIRouter, status

from app.api.deps import ParkingSessionServiceDep
from app.models.parking_session import (
    ParkingSessionCreate,
    ParkingSessionPublic,
    ParkingSessionUpdate,
)

router = APIRouter(
    prefix="/parking-sessions",
    tags=["Parking Sessions"],
)


@router.post(
    "/",
    response_model=ParkingSessionPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_parking_session(
    session_data: ParkingSessionCreate,
    service: ParkingSessionServiceDep,
):
    return await service.create(session_data)


@router.get(
    "/",
    response_model=list[ParkingSessionPublic],
)
async def list_parking_sessions(
    service: ParkingSessionServiceDep,
):
    return await service.list_all()


@router.get(
    "/active",
    response_model=list[ParkingSessionPublic],
)
async def list_active_parking_sessions(
    service: ParkingSessionServiceDep,
):
    return await service.list_active()


@router.get(
    "/{session_id}",
    response_model=ParkingSessionPublic,
)
async def get_parking_session(
    session_id: int,
    service: ParkingSessionServiceDep,
):
    return await service.get_by_id(session_id)


@router.patch(
    "/{session_id}",
    response_model=ParkingSessionPublic,
)
async def update_parking_session(
    session_id: int,
    session_data: ParkingSessionUpdate,
    service: ParkingSessionServiceDep,
):
    return await service.update(session_id, session_data)


@router.post(
    "/{session_id}/close",
    response_model=ParkingSessionPublic,
)
async def close_parking_session(
    session_id: int,
    service: ParkingSessionServiceDep,
):
    return await service.close_session(session_id)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_parking_session(
    session_id: int,
    service: ParkingSessionServiceDep,
):
    await service.delete(session_id)
    