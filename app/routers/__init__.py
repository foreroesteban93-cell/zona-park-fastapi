
from fastapi import APIRouter

from app.routers.customer import router as customer_router
from app.routers.vehicle import router as vehicle_router
from app.routers.parking_space import router as parking_space_router
from app.routers.rate import router as rate_router
from app.routers.parking_session import router as parking_session_router


api_router = APIRouter()

api_router.include_router(customer_router)
api_router.include_router(vehicle_router)
api_router.include_router(parking_space_router)
api_router.include_router(rate_router)
api_router.include_router(parking_session_router)
