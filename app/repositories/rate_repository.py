from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.rate import Rate, RateCreate, RateUpdate


class RateRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, rate_data: RateCreate) -> Rate:
        rate = Rate.model_validate(rate_data)
        self.session.add(rate)
        await self.session.commit()
        await self.session.refresh(rate)
        return rate

    async def get_by_id(self, rate_id: int) -> Rate | None:
        statement = select(Rate).where(Rate.id == rate_id)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Rate]:
        statement = select(Rate).order_by(Rate.id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_active(self) -> list[Rate]:
        statement = select(Rate).where(Rate.is_active == True)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def update(
        self, rate_id: int, rate_data: RateUpdate
    ) -> Rate | None:
        rate = await self.get_by_id(rate_id)

        if rate is None:
            return None

        update_data = rate_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(rate, field, value)

        rate.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(rate)
        return rate

    async def delete(self, rate_id: int) -> bool:
        rate = await self.get_by_id(rate_id)

        if rate is None:
            return False

        await self.session.delete(rate)
        await self.session.commit()
        return True