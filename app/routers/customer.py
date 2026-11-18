
from fastapi import APIRouter, status

from app.api.deps import CustomerServiceDep
from app.models.customer import (
    CustomerCreate,
    CustomerPublic,
    CustomerUpdate,
)

router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


@router.post(
    "/",
    response_model=CustomerPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer(
    customer_data: CustomerCreate,
    service: CustomerServiceDep,
):
    return await service.create(customer_data)


@router.get(
    "/",
    response_model=list[CustomerPublic],
)
async def list_customers(
    service: CustomerServiceDep,
):
    return await service.list_all()


@router.get(
    "/{customer_id}",
    response_model=CustomerPublic,
)
async def get_customer(
    customer_id: int,
    service: CustomerServiceDep,
):
    return await service.get_by_id(customer_id)


@router.patch(
    "/{customer_id}",
    response_model=CustomerPublic,
)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    service: CustomerServiceDep,
):
    return await service.update(customer_id, customer_data)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_customer(
    customer_id: int,
    service: CustomerServiceDep,
):
    await service.delete(customer_id)
