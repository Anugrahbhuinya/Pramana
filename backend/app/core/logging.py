# app/core/logging.py
import logging
import sys
from typing import Any, Dict, List

import structlog

from app.core.config import settings

# Shared processors for both standard logging and structlog
shared_processors: List[Any] = [
    structlog.contextvars.merge_contextvars,
    structlog.processors.add_log_level,
    structlog.processors.TimeStamper(fmt="iso"),
    structlog.processors.StackInfoRenderer(),
    structlog.processors.format_exc_info,
]


def setup_logging() -> None:
    """Configures structured logging for the FastAPI application."""
    log_level_str = settings.LOG_LEVEL.upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    # Configure standard library logging wrapper
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Determine processor based on environment
    formatter_processor: Any
    if settings.ENV == "development":
        # Pretty printing for console
        formatter_processor = structlog.dev.ConsoleRenderer(colors=True)
    else:
        # JSON formatting for production / container logging (Splunk, CloudWatch, ELK)
        formatter_processor = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.ExtraAdder(),
            structlog.processors.UnicodeDecoder(),
            formatter_processor,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Redirect standard library loggers (like uvicorn) to structlog
    for logger_name in (
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "sqlalchemy.engine",
    ):
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = []
        logging_logger.propagate = True


# Initialize logger
logger = structlog.get_logger("pramana")
setup_logging()
logger.info(
    "Structured logging initialized", env=settings.ENV, level=settings.LOG_LEVEL
)
