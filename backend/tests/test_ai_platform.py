# tests/test_ai_platform.py
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import status
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.database.session import get_db_session
from app.main import app
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.prompts.audit_prompt import AuditItemSchema, AuditResponse
from app.services.prompts.decision_prompt import (
    CouncilAgentSchema,
    CouncilSchema,
    DecisionResponse,
    ExplainabilityItem,
)
from app.services.prompts.impact_prompt import ImpactItem, ImpactResponse
from app.services.prompts.regulatory_prompt import (
    ClauseExtract,
    ObligationExtract,
    RegulatoryAnalysisSchema,
)
from app.services.prompts.risk_prompt import RiskItem, RiskResponse
from app.services.retrieval_service import RetrievalService

client = TestClient(app)


# --- 1. Document Processing & Cleaning Tests ---


def test_document_hash_calculation():
    service = DocumentService()
    content = b"SEBI Circular 2026 content details"
    h1 = service.calculate_hash(content)
    h2 = service.calculate_hash(content)
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 is 64 chars hex


def test_text_cleaning_and_normalization():
    service = DocumentService()
    raw = "All   registered   stock  brokers   \n\n  shall segregate client escrow funds.  "
    cleaned = service.clean_text(raw)
    assert (
        cleaned == "All registered stock brokers\nshall segregate client escrow funds."
    )


def test_language_detection_heuristics():
    service = DocumentService()
    eng_text = "Regulatory compliance checks must verify ledger balances."
    hin_text = "सेबी सर्कुलर और एस्क्रो अकाउंट नियम।"
    assert service.detect_language(eng_text) == "English"
    assert service.detect_language(hin_text) == "Hindi"


def test_document_text_chunking():
    service = DocumentService(chunk_size=30, chunk_overlap=10)
    pages = [
        (1, "This is page number one raw compliance text."),
        (2, "Second page contains limit rules."),
    ]
    chunks = service.chunk_document(pages)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1
    assert chunks[-1]["page_number"] == 2
    assert "chunk_index" in chunks[0]


# --- 2. Schema Validation Tests ---


def test_regulatory_schema_validation():
    # Valid schema check
    data = {
        "title": "Escrow Segregation Mandate",
        "number": "SEBI/HO/2026/1",
        "issue_date": "2026-01-01",
        "effective_date": "2026-06-01",
        "applicability": "Brokers",
        "clauses": [
            {
                "clause_number": "1.1",
                "title": "Rules",
                "text_content": "Raw rules",
                "obligations": [
                    {
                        "description": "Duty 1",
                        "deadline": "Immediate",
                        "penalty": "Fine",
                        "exceptions": None,
                        "dependencies": None,
                    }
                ],
            }
        ],
    }
    schema = RegulatoryAnalysisSchema.model_validate(data)
    assert schema.title == "Escrow Segregation Mandate"
    assert len(schema.clauses) == 1

    # Invalid check
    bad_data = data.copy()
    del bad_data["title"]
    with pytest.raises(ValidationError):
        RegulatoryAnalysisSchema.model_validate(bad_data)


def test_decision_schema_validation():
    # Verify complex executive council nesting
    data = {
        "executive_summary": "SEBI updates rules.",
        "recommended_actions": ["Action 1"],
        "priority_order": ["P0: Act"],
        "dependencies": ["None"],
        "escalation_needed": False,
        "approval_required": True,
        "council": {
            "Regulatory AI": {
                "status": "compliant",
                "analysis": "No issues.",
                "confidence": 0.99,
                "recommendations": ["R1"],
            },
            "Risk AI": {
                "status": "pending",
                "analysis": "Exposure detected.",
                "confidence": 0.92,
                "recommendations": ["R2"],
            },
            "Operations AI": {
                "status": "under_review",
                "analysis": "Workloads affected.",
                "confidence": 0.95,
                "recommendations": ["R3"],
            },
            "Audit AI": {
                "status": "inactive",
                "analysis": "Awaiting files.",
                "confidence": 0.90,
                "recommendations": [],
            },
        },
        "explainability": [
            {
                "source_clause": "Clause 4.1",
                "reason": "Escrow check needed.",
                "confidence": 0.98,
                "supporting_context": "Text",
                "affected_entity": "Treasury",
                "evidence_required": "Log files",
            }
        ],
    }
    schema = DecisionResponse.model_validate(data)
    assert schema.council.regulatory_ai.status == "compliant"
    assert schema.explainability[0].source_clause == "Clause 4.1"


# --- 3. Mock AI reasoning Fallback Tests ---


@pytest.mark.asyncio
async def test_regulatory_service_mock_fallback():
    # Running without API key uses mock
    service = EmbeddingService(api_key="")
    vector = await service.generate_embedding("Test compliance instruction")
    assert len(vector) == 768
    assert all(isinstance(v, float) for v in vector)


# --- 4. API Endpoints Tests (with database mock) ---


@patch("app.api.endpoints.ai.get_db_session")
@patch("app.api.endpoints.ai.DocumentService")
def test_upload_endpoint(mock_service_class, mock_db):
    # Setup service mock
    mock_service = MagicMock()
    mock_service.calculate_hash.return_value = "dummyhash123"
    mock_service.is_duplicate = AsyncMock(return_value=(False, None))

    mock_doc = MagicMock()
    mock_doc.id = uuid4()
    mock_doc.name = "circular.pdf"
    mock_doc.status = "processed"
    mock_doc.total_pages = 5
    mock_doc.language = "English"
    mock_doc.file_hash = "dummyhash123"
    mock_service.process_and_save_document = AsyncMock(return_value=mock_doc)

    mock_service_class.return_value = mock_service

    # Override dependencies
    app.dependency_overrides[get_db_session] = lambda: mock_db

    # Call endpoint with mock pdf bytes
    response = client.post(
        "/api/v1/upload",
        files={
            "file": ("circular.pdf", b"%PDF-1.4 dummy contents...", "application/pdf")
        },
    )

    assert response.status_code == status.HTTP_201_CREATED
    res_data = response.json()
    assert res_data["name"] == "circular.pdf"
    assert res_data["file_hash"] == "dummyhash123"

    # Clean up overrides
    app.dependency_overrides.clear()


@patch("app.api.endpoints.ai.get_db_session")
def test_get_analysis_session_not_found(mock_db):
    mock_session = MagicMock()
    mock_session.execute = AsyncMock(
        return_value=MagicMock(scalar_one_or_none=lambda: None)
    )
    app.dependency_overrides[get_db_session] = lambda: mock_session

    missing_uuid = uuid4()
    response = client.get(f"/api/v1/analysis/{missing_uuid}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error"]["message"] == "Analysis session not found."

    app.dependency_overrides.clear()
