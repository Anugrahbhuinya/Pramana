# app/main.py
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.health import router as health_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger
from app.middleware.request_logger import RequestLoggerMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application startup and shutdown lifecycle events."""
    # Startup tasks
    logger.info(
        "Pramana platform backend starting up...",
        project_name=settings.PROJECT_NAME,
        env=settings.ENV,
        api_prefix=settings.API_V1_STR,
    )
    
    # Auto-seed database if empty
    try:
        from app.database.session import async_session_factory
        from sqlalchemy import select
        from app.models.models import Document
        from app.database.seeder import seed_demo_data
        
        async with async_session_factory() as session:
            stmt = select(Document)
            res = await session.execute(stmt)
            if not res.scalars().first():
                logger.info("Database is empty. Auto-seeding SEBI compliance demo dataset...")
                await seed_demo_data(session)
    except Exception as e:
        logger.error("Auto-seeding check failed during startup", error=str(e))
        
    yield
    # Shutdown tasks
    logger.info("Pramana platform backend shutting down...")


# Initialize the FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Regulatory Intelligence Platform - Enterprise Architecture Foundation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Apply CORS Middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Apply Request Logging Middleware
app.add_middleware(RequestLoggerMiddleware)

# Register Error Handlers
register_exception_handlers(app)

# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)


# Customize OpenAPI definitions for Pramana branding
def custom_openapi() -> Dict[str, Any]:
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://raw.githubusercontent.com/google/material-design-icons/master/png/action/verified_user/black_24dp.png"
    }
    app.openapi_schema = openapi_schema
    return openapi_schema


app.openapi = custom_openapi  # type: ignore
