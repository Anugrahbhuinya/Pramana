# app/database/base.py
# Import all the models so that Base has them before Alembic imports it.
from app.models.base import (  # noqa
    Base,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)
from app.models.models import (  # noqa
    AnalysisSession,
    AuditItem,
    Clause,
    Document,
    DocumentChunk,
    Embedding,
    Impact,
    Obligation,
    Regulation,
    Risk,
)

target_metadata = Base.metadata
