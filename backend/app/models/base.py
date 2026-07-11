# app/models/base.py
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy models."""

    pass


class UUIDPrimaryKeyMixin:
    """Mixin to inject a UUID4 primary key."""

    @declared_attr
    def id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            server_default=func.gen_random_uuid(),
            index=True,
        )


class TimestampMixin:
    """Mixin to track creation and update timestamps in UTC."""

    @declared_attr
    def created_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        )

    @declared_attr
    def updated_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        )


class SoftDeleteMixin:
    """Mixin to support soft deletes on models."""

    @declared_attr
    def is_deleted(cls) -> Mapped[bool]:
        return mapped_column(
            Boolean,
            nullable=False,
            default=False,
            server_default="false",
        )

    @declared_attr
    def deleted_at(cls) -> Mapped[datetime | None]:
        return mapped_column(
            DateTime(timezone=True),
            nullable=True,
            default=None,
        )

    def soft_delete(self) -> None:
        """Flags the model as deleted and records the timestamp."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)
