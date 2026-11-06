from datetime import datetime, timezone
from math import ceil

from fastapi import HTTPException

from app.models.parking_session import (
    ParkingSessionCreate,
    ParkingSessionUpdate,
)
from app.repositories.parking_session_repository import (
    ParkingSessionRepository,
)
from app.repositories.rate_repository import RateRepository


class ParkingSessionService:

    def __init__(
        self,
        repository: ParkingSessionRepository,
        rate_repository: RateRepository,
    ):
        self.repository = repository
        self.rate_repository = rate_repository

    async def get_by_id(self, session_id: int):
        session = await self.repository.get_by_id(session_id)

        if session is None:
            raise HTTPException(
                status_code=404,
                detail="Sesión de parqueadero no encontrada",
            )

        return session

    async def list_all(self):
        return await self.repository.get_all()

    async def list_active(self):
        return await self.repository.get_active()

    async def create(self, session_data: ParkingSessionCreate):
        rate = await self.rate_repository.get_by_id(
            session_data.rate_id
        )

        if rate is None or not rate.is_active:
            raise HTTPException(
                status_code=400,
                detail="La tarifa no existe o está inactiva",
            )

        return await self.repository.create(session_data)

    async def close_session(self, session_id: int):
        session = await self.get_by_id(session_id)

        if not session.is_active:
            raise HTTPException(
                status_code=400,
                detail="La sesión ya está cerrada",
            )

        rate = await self.rate_repository.get_by_id(session.rate_id)

        if rate is None:
            raise HTTPException(
                status_code=404,
                detail="No se encontró la tarifa de la sesión",
            )

        exit_time = datetime.now(timezone.utc)

        duration = exit_time - session.entry_time
        total_hours = max(1, ceil(duration.total_seconds() / 3600))

        if rate.price_per_day and total_hours >= 24:
            full_days = total_hours // 24
            remaining_hours = total_hours % 24

            total_amount = (
                full_days * rate.price_per_day
                + remaining_hours * rate.price_per_hour
            )
        else:
            total_amount = total_hours * rate.price_per_hour

        update_data = ParkingSessionUpdate(
            exit_time=exit_time,
            total_amount=total_amount,
            is_active=False,
        )

        return await self.repository.update(
            session_id,
            update_data,
        )

    async def update(
        self,
        session_id: int,
        session_data: ParkingSessionUpdate,
    ):
        session = await self.get_by_id(session_id)

        if not session.is_active:
            raise HTTPException(
                status_code=400,
                detail="No se puede modificar una sesión cerrada",
            )

        update_data = session_data.model_dump(exclude_unset=True)

        if "rate_id" in update_data:
            rate = await self.rate_repository.get_by_id(
                update_data["rate_id"]
            )

            if rate is None or not rate.is_active:
                raise HTTPException(
                    status_code=400,
                    detail="La tarifa no existe o está inactiva",
                )

        return await self.repository.update(
            session_id,
            session_data,
        )

    async def delete(self, session_id: int):
        await self.get_by_id(session_id)
        return await self.repository.delete(session_id)