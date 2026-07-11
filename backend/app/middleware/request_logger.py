# app/middleware/request_logger.py
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.logging import logger


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware for tracking, measuring, and logging all HTTP traffic."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.perf_counter()

        # Log basic request arrival information
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Suppress logging healthcheck requests in standard logs to avoid clutter
        is_healthcheck = path.endswith("/health") or path.endswith("/version")

        if not is_healthcheck:
            logger.info(
                "Request received",
                method=method,
                path=path,
                client_ip=client_ip,
            )

        try:
            response = await call_next(request)
            duration = time.perf_counter() - start_time

            if not is_healthcheck:
                logger.info(
                    "Request completed",
                    method=method,
                    path=path,
                    status_code=response.status_code,
                    duration_ms=round(duration * 1000, 2),
                )

            # Add process time header
            response.headers["X-Process-Time-Ms"] = str(round(duration * 1000, 2))
            return response

        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(
                "Request failed",
                method=method,
                path=path,
                error=str(e),
                duration_ms=round(duration * 1000, 2),
                exc_info=True,
            )
            raise
