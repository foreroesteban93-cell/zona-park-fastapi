from fastapi import HTTPException

from app.models.customer import CustomerCreate, CustomerUpdate
from app.repositories.customer_repository import CustomerRepository


class CustomerService:
    def __init__(self, repository: CustomerRepository):
        self.repository = repository

    async def get_by_id(self, customer_id: int):
        customer = await self.repository.get_by_id(customer_id)

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="Cliente no encontrado",
            )

        return customer

    async def list_all(self):
        return await self.repository.get_all()

    async def create(self, customer_data: CustomerCreate):
        existing = await self.repository.get_by_document_number(
            customer_data.document_number
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="El documento ya está registrado",
            )

        return await self.repository.create(customer_data)

    async def update(
        self,
        customer_id: int,
        customer_data: CustomerUpdate,
    ):
        customer = await self.get_by_id(customer_id)

        update_data = customer_data.model_dump(exclude_unset=True)

        document_number = update_data.get("document_number")

        if document_number:
            existing = await self.repository.get_by_document_number(
                document_number
            )

            if existing and existing.id != customer_id:
                raise HTTPException(
                    status_code=400,
                    detail="El documento ya pertenece a otro cliente",
                )

        updated_customer = await self.repository.update(
            customer_id,
            customer_data,
        )

        return updated_customer

    async def delete(self, customer_id: int):
        await self.get_by_id(customer_id)

        deleted = await self.repository.delete(customer_id)

        return deleted