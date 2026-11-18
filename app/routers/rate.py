from fastapi import APIRouter, status

from app.api.deps import RateServiceDep
from app.models.rate import (
    RateCreate,
    RatePublic,
    RateUpdate,
)

router = APIRouter(
    prefix="/rates",
    tags=["Rates"],
)


@router.post(
    "/",
    response_model=RatePublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_rate(
    rate_data: RateCreate,
    service: RateServiceDep,
):
    return await service.create(rate_data)


@router.get(
    "/",
    response_model=list[RatePublic],
)
async def list_rates(
    service: RateServiceDep,
):
    return await service.list_all()


@router.get(
    "/active",
    response_model=list[RatePublic],
)
async def list_active_rates(
    service: RateServiceDep,
):
    return await service.list_active()


@router.get(
    "/{rate_id}",
    response_model=RatePublic,
)
async def get_rate(
    rate_id: int,
    service: RateServiceDep,
):
    return await service.get_by_id(rate_id)


@router.patch(
    "/{rate_id}",
    response_model=RatePublic,
)
async def update_rate(
    rate_id: int,
    rate_data: RateUpdate,
    service: RateServiceDep,
):
    return await service.update(rate_id, rate_data)


@router.delete(
    "/{rate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_rate(
    rate_id: int,
    service: RateServiceDep,
):
    await service.delete(rate_id)