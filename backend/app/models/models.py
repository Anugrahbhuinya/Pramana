# app/models/models.py
from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Represents a regulatory document uploaded to the platform."""

    __tablename__ = "documents"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="uploaded")
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    total_pages: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    # Relationships
    chunks: Mapped[List["DocumentChunk"]] = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )
    regulations: Mapped[List["Regulation"]] = relationship(
        "Regulation", back_populates="document", cascade="all, delete-orphan"
    )
    analysis_sessions: Mapped[List["AnalysisSession"]] = relationship(
        "AnalysisSession", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Text chunks extracted from a Document for vector search and RAG."""

    __tablename__ = "chunks"

    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")
    embeddings: Mapped[List["Embedding"]] = relationship(
        "Embedding", back_populates="chunk", cascade="all, delete-orphan"
    )


class Embedding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Stores the generated embeddings and metadata linked to a document chunk."""

    __tablename__ = "embeddings"

    chunk_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("chunks.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    embedding_json: Mapped[List[float]] = mapped_column(
        JSONB, nullable=False
    )  # Float array fallback
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    # Relationships
    chunk: Mapped["DocumentChunk"] = relationship(
        "DocumentChunk", back_populates="embeddings"
    )


class Regulation(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Top-level regulatory metadata entity extracted from an uploaded document."""

    __tablename__ = "regulations"

    document_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    number: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    applicability: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    # Relationships
    document: Mapped[Optional["Document"]] = relationship(
        "Document", back_populates="regulations"
    )
    clauses: Mapped[List["Clause"]] = relationship(
        "Clause", back_populates="regulation", cascade="all, delete-orphan"
    )


class Clause(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Represents a specific section or clause in a Regulation."""

    __tablename__ = "clauses"

    regulation_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("regulations.id", ondelete="CASCADE"),
        nullable=False,
    )
    clause_number: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    regulation: Mapped["Regulation"] = relationship(
        "Regulation", back_populates="clauses"
    )
    obligations: Mapped[List["Obligation"]] = relationship(
        "Obligation", back_populates="clause", cascade="all, delete-orphan"
    )


class Obligation(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """An actionable compliance mandate extracted from a Clause."""

    __tablename__ = "obligations"

    clause_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clauses.id", ondelete="CASCADE"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    deadline: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    penalty: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    exceptions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dependencies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    clause: Mapped["Clause"] = relationship("Clause", back_populates="obligations")
    risks: Mapped[List["Risk"]] = relationship(
        "Risk", back_populates="obligation", cascade="all, delete-orphan"
    )
    impacts: Mapped[List["Impact"]] = relationship(
        "Impact", back_populates="obligation", cascade="all, delete-orphan"
    )
    audit_items: Mapped[List["AuditItem"]] = relationship(
        "AuditItem", back_populates="obligation", cascade="all, delete-orphan"
    )


class Risk(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Stores the risk metrics calculated for an obligation."""

    __tablename__ = "risks"

    obligation_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=True,
    )
    session_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=True,
    )
    risk_level: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # High / Medium / Low
    criticality: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)
    compliance_score: Mapped[float] = mapped_column(
        Float, nullable=False, default=100.0
    )
    urgency: Mapped[str] = mapped_column(String(100), nullable=False)
    implementation_complexity: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    obligation: Mapped[Optional["Obligation"]] = relationship(
        "Obligation", back_populates="risks"
    )
    session: Mapped[Optional["AnalysisSession"]] = relationship(
        "AnalysisSession", back_populates="risks"
    )


class Impact(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Stores operational/system impacts mapped to an obligation."""

    __tablename__ = "impacts"

    obligation_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=True,
    )
    session_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=True,
    )
    affected_departments: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of strings
    affected_systems: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of strings
    affected_policies: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of strings
    affected_controls: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of strings
    affected_stakeholders: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of strings
    business_impact: Mapped[str] = mapped_column(Text, nullable=False)
    operational_impact: Mapped[str] = mapped_column(Text, nullable=False)
    technology_impact: Mapped[str] = mapped_column(Text, nullable=False)
    compliance_impact: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    obligation: Mapped[Optional["Obligation"]] = relationship(
        "Obligation", back_populates="impacts"
    )
    session: Mapped[Optional["AnalysisSession"]] = relationship(
        "AnalysisSession", back_populates="impacts"
    )


class AuditItem(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Audit readiness, checklist, and evidence mappings linked to an obligation."""

    __tablename__ = "audit_items"

    obligation_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=True,
    )
    session_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("analysis_sessions.id", ondelete="CASCADE"),
        nullable=True,
    )
    evidence_required: Mapped[str] = mapped_column(Text, nullable=False)
    documents_required: Mapped[str] = mapped_column(Text, nullable=False)
    policies_required: Mapped[str] = mapped_column(Text, nullable=False)
    audit_checklist: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False
    )  # Array of checklist points
    control_mapping: Mapped[str] = mapped_column(Text, nullable=False)
    readiness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Relationships
    obligation: Mapped[Optional["Obligation"]] = relationship(
        "Obligation", back_populates="audit_items"
    )
    session: Mapped[Optional["AnalysisSession"]] = relationship(
        "AnalysisSession", back_populates="audit_items"
    )


class AnalysisSession(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Consolidated orchestration analysis run, storing summaries and results."""

    __tablename__ = "analysis_sessions"

    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    regulatory_ai_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    risk_ai_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    operations_ai_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    audit_ai_analysis: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    executive_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decision_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )
    explainability_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document", back_populates="analysis_sessions"
    )
    risks: Mapped[List["Risk"]] = relationship(
        "Risk", back_populates="session", cascade="all, delete-orphan"
    )
    impacts: Mapped[List["Impact"]] = relationship(
        "Impact", back_populates="session", cascade="all, delete-orphan"
    )
    audit_items: Mapped[List["AuditItem"]] = relationship(
        "AuditItem", back_populates="session", cascade="all, delete-orphan"
    )
