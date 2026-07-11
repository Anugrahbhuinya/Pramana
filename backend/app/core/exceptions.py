# app/core/exceptions.py
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import logger


class PramanaException(Exception):
    """Base application exception for Pramana."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class EntityNotFoundError(PramanaException):
    """Raised when a requested resource is not found."""

    def __init__(
        self, message: str = "Resource not found", details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class PermissionDeniedError(PramanaException):
    """Raised when the user does not have permission to perform an action."""

    def __init__(
        self, message: str = "Permission denied", details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details,
        )


class AuthenticationError(PramanaException):
    """Raised when authentication fails."""

    def __init__(
        self, message: str = "Not authenticated", details: Optional[Any] = None
    ):
        super().__init__(
            message=message,
            code="UNAUTHENTICATED",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details,
        )


class BusinessRuleValidationError(PramanaException):
    """Raised when validation of business logic fails."""

    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


def format_error_response(
    code: str, message: str, details: Optional[Any] = None
) -> Dict[str, Any]:
    """Generates a standardized error response envelope."""
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Registers exception handlers on the FastAPI application instance."""

    @app.exception_handler(PramanaException)
    async def pramana_exception_handler(
        request: Request, exc: PramanaException
    ) -> JSONResponse:
        logger.warning(
            "Application exception occurred",
            code=exc.code,
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=format_error_response(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # Standardize Pydantic validation errors
        errors = []
        for error in exc.errors():
            loc = " -> ".join(str(x) for x in error.get("loc", []))
            errors.append(
                {
                    "field": loc,
                    "type": error.get("type"),
                    "message": error.get("msg"),
                }
            )

        logger.warning(
            "Request validation failed",
            errors=errors,
            path=request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=format_error_response(
                code="REQUEST_VALIDATION_ERROR",
                message="The request payload validation failed.",
                details={"errors": errors},
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        logger.info(
            "HTTP exception received",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
        )
        # Map status code to standard codes
        code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
            code = "UNAUTHENTICATED"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            code = "PERMISSION_DENIED"

        return JSONResponse(
            status_code=exc.status_code,
            content=format_error_response(
                code=code,
                message=str(exc.detail),
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        # Unexpected crashes (database down, uncaught system faults)
        logger.exception(
            "Unhandled server error occurred",
            error=str(exc),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=format_error_response(
                code="INTERNAL_SERVER_ERROR",
                message="An unexpected system failure occurred. Please contact administrator.",
            ),
        )
