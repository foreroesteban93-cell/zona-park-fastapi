from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.databases import init_db, engine
from app.routers import api_router


BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await engine.dispose()


app = FastAPI(
    title="Zona Park API",
    description="API para la gestión de un sistema de parqueadero",
    version="1.0.0",
    lifespan=lifespan,
)


app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)


@app.get("/", include_in_schema=False)
async def home():
    return FileResponse(BASE_DIR / "templates" / "index.html")


app.include_router(
    api_router,
    prefix="/api/v1",
)