
from fastapi import FastAPI

from app.routers import api_router

app = FastAPI(
    title="Zona Park API",
    description="API para la gestión de un sistema de parqueadero",
    version="1.0.0",
)

app.include_router(
    api_router,
    prefix="/api/v1",
)
