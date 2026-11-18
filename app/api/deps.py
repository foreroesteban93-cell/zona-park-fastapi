
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.databases import get_session

from app.repositories.customer_repository import CustomerRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.parking_space_repository import ParkingSpaceRepository
from app.repositories.rate_repository import RateRepository
from app.repositories.parking_session_repository import ParkingSessionRepository

from app.services.customer_service import CustomerService
from app.services.vehicle_service import VehicleService
from app.services.parking_space_service import ParkingSpaceService
from app.services.rate_service import RateService
from app.services.parking_session_service import ParkingSessionService


# 1. Dependencia para obtener la sesión de base de datos
SessionDep = Annotated[AsyncSession, Depends(get_session)]


# 2. Servicio de clientes
def get_customer_service(session: SessionDep) -> CustomerService:
    repository = CustomerRepository(session)
    return CustomerService(repository)


# 3. Servicio de vehículos
def get_vehicle_service(session: SessionDep) -> VehicleService:
    repository = VehicleRepository(session)
    return VehicleService(repository)


# 4. Servicio de espacios de parqueadero
def get_parking_space_service(session: SessionDep) -> ParkingSpaceService:
    repository = ParkingSpaceRepository(session)
    return ParkingSpaceService(repository)


# 5. Servicio de tarifas
def get_rate_service(session: SessionDep) -> RateService:
    repository = RateRepository(session)
    return RateService(repository)


# 6. Servicio de sesiones de parqueo
def get_parking_session_service(session: SessionDep) -> ParkingSessionService:
    repository = ParkingSessionRepository(session)
    rate_repository = RateRepository(session)

    return ParkingSessionService(repository, rate_repository)


# 7. Dependencias listas para utilizar en los routers
CustomerServiceDep = Annotated[
    CustomerService, Depends(get_customer_service)
]

VehicleServiceDep = Annotated[
    VehicleService, Depends(get_vehicle_service)
]

ParkingSpaceServiceDep = Annotated[
    ParkingSpaceService, Depends(get_parking_space_service)
]

RateServiceDep = Annotated[
    RateService, Depends(get_rate_service)
]

ParkingSessionServiceDep = Annotated[
    ParkingSessionService, Depends(get_parking_session_service)
]
