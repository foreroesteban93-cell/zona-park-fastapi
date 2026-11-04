from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.parking_session import (
    ParkingSession,
    ParkingSessionCreate,
    ParkingSessionUpdate,
)


class ParkingSessionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self, session_data: ParkingSessionCreate
    ) -> ParkingSession:
        parking_session = ParkingSession.model_validate(session_data)
        self.session.add(parking_session)
        await self.session.commit()
        await self.session.refresh(parking_session)
        return parking_session

    async def get_by_id(
        self, session_id: int
    ) -> ParkingSession | None:
        statement = select(ParkingSession).where(
            ParkingSession.id == session_id
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_all(self) -> list[ParkingSession]:
        statement = select(ParkingSession).order_by(ParkingSession.id)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def get_active(self) -> list[ParkingSession]:
        statement = select(ParkingSession).where(
            ParkingSession.is_active == True
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def update(
        self, session_id: int, session_data: ParkingSessionUpdate
    ) -> ParkingSession | None:
        parking_session = await self.get_by_id(session_id)

        if parking_session is None:
            return None

        update_data = session_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(parking_session, field, value)

        parking_session.updated_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(parking_session)
        return parking_session

    async def delete(self, session_id: int) -> bool:
        parking_session = await self.get_by_id(session_id)

        if parking_session is None:
            return False

        await self.session.delete(parking_session)
        await self.session.commit()
        return True