
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.customer import Customer, CustomerCreate, CustomerUpdate


class CustomerRepository:
    """Repository para gestionar las operaciones de clientes."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, customer_data: CustomerCreate) -> Customer:
        """Crear un nuevo cliente."""

        customer = Customer.model_validate(customer_data)

        self.session.add(customer)
        await self.session.commit()
        await self.session.refresh(customer)

        return customer

    async def get_by_id(self, customer_id: int) -> Customer | None:
        """Obtener un cliente por su ID."""

        statement = select(Customer).where(Customer.id == customer_id)

        result = await self.session.execute(statement)

        return result.scalar_one_or_none()

    async def get_by_document_number(
        self,
        document_number: str,
    ) -> Customer | None:
        """Obtener un cliente por su número de documento."""

        statement = select(Customer).where(
            Customer.document_number == document_number
        )

        result = await self.session.execute(statement)

        return result.scalar_one_or_none()

    async def get_all(self) -> list[Customer]:
        """Obtener todos los clientes."""

        statement = select(Customer).order_by(Customer.id)

        result = await self.session.execute(statement)

        return list(result.scalars().all())

    async def update(
        self,
        customer_id: int,
        customer_data: CustomerUpdate,
    ) -> Customer | None:
        """Actualizar un cliente existente."""

        customer = await self.get_by_id(customer_id)

        if customer is None:
            return None

        update_data = customer_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(customer, field, value)

        customer.updated_at = datetime.now(timezone.utc)

        self.session.add(customer)
        await self.session.commit()
        await self.session.refresh(customer)

        return customer

    async def delete(self, customer_id: int) -> bool:
        """Eliminar un cliente por su ID."""

        customer = await self.get_by_id(customer_id)

        if customer is None:
            return False

        await self.session.delete(customer)
        await self.session.commit()

        return True
