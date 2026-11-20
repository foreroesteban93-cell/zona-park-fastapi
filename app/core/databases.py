
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.core.config import settings


# Adaptar los parámetros SSL de Neon para asyncpg
database_url = make_url(settings.DATABASE_URL)
query_params = dict(database_url.query)

sslmode = query_params.pop("sslmode", None)
query_params.pop("channel_binding", None)

database_url = database_url.set(query=query_params)

connect_args: dict[str, Any] = {}

if sslmode:
    connect_args["ssl"] = sslmode

# Configuración especial para Neon Pooler
if "neon.tech" in settings.DATABASE_URL and "pooler" in settings.DATABASE_URL:
    connect_args["statement_cache_size"] = 0


# Motor asíncrono compatible con SQLite y Neon PostgreSQL
engine = create_async_engine(
    database_url,
    echo=settings.ECHO_SQL,
    pool_pre_ping=True,
    connect_args=connect_args,
    future=True,
)


# Fábrica de sesiones
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Crea las tablas si no existen."""
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Obtiene una sesión de base de datos."""
    async with async_session_maker() as session:
        yield session
