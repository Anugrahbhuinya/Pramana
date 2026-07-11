# app/database/session.py
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.logging import logger

# Create the async engine with optimized connection pool configuration
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Set to True for query debugging in development
    pool_size=20,  # Max persistent connections in the pool
    max_overflow=10,  # Max additional connections to allow beyond pool_size
    pool_timeout=30,  # Seconds to wait for a connection from the pool before erroring
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Check connection health before checking out
)

# Async session maker
async_session_factory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for injecting database sessions into route handlers.

    Ensures proper cleanup and rollback in case of transactions failure.
    """
    session: AsyncSession = async_session_factory()
    try:
        yield session
    except Exception as e:
        logger.error(
            "Database session transaction error. Rolling back...", error=str(e)
        )
        await session.rollback()
        raise
    finally:
        await session.close()
