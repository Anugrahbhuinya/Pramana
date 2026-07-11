# app/api/endpoints/health.py
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.database.session import get_db_session

router = APIRouter()


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Overall health status of the application")
    database: str = Field(..., description="Database connection health status")
    environment: str = Field(..., description="Deployment environment")


class VersionResponse(BaseModel):
    version: str = Field("1.0.0", description="Application semantic version")
    project: str = Field(..., description="Project name metadata")


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform a system health check",
    tags=["System"],
)
async def check_health(
    db: AsyncSession = Depends(get_db_session),
) -> HealthCheckResponse:
    """Verifies that the backend server is running and the database connection is healthy."""
    db_status = "healthy"
    overall_status = "healthy"

    try:
        # Perform database connection validation probe
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error("Health check database probe failed", error=str(e))
        db_status = "unhealthy"
        overall_status = "degraded"

    return HealthCheckResponse(
        status=overall_status,
        database=db_status,
        environment=settings.ENV,
    )


@router.get(
    "/version",
    response_model=VersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current application version",
    tags=["System"],
)
async def get_version() -> VersionResponse:
    """Returns application version and metadata."""
    return VersionResponse(
        version="1.0.0",
        project=settings.PROJECT_NAME,
    )
