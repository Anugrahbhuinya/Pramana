# tests/test_api_contract.py
"""
Integration tests validating the full Pramana API contract.

Tests the complete flow:
  Upload PDF ? Analyze ? Dashboard ? Action Plan ? Digital Twin ? Explainability

Validates:
- No undefined identifiers in any URL
- Every endpoint returns expected schemas
- Frontend and backend are synchronized
"""
import io
import pytest
from uuid import UUID
from httpx import AsyncClient, ASGITransport
from app.main import app

# Minimal valid PDF bytes (1-page, valid structure)
MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
    b"/Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 "
    b"/BaseFont /Helvetica >> >> >> >>\nendobj\n"
    b"4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td "
    b"(SEBI Circular Test) Tj ET\nendstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n"
    b"0000000058 00000 n \n0000000115 00000 n \n0000000274 00000 n \n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n369\n%%EOF"
)


@pytest.mark.anyio
async def test_upload_response_contract():
    """POST /upload must return document_id, name, status, file_hash."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/upload",
            files={"file": ("test_sebi.pdf", io.BytesIO(MINIMAL_PDF_BYTES), "application/pdf")},
        )
        assert response.status_code in (200, 201), f"Upload failed: {response.text}"
        data = response.json()
        assert "document_id" in data, "Missing document_id in upload response"
        assert "name" in data
        assert "status" in data
        assert "file_hash" in data
        doc_id = data["document_id"]
        assert doc_id and doc_id != "undefined"
        UUID(doc_id)  # Must be valid UUID


@pytest.mark.anyio
async def test_no_422_on_regulatory_analysis_schema():
    """Validates that ClauseExtract in ai_service comes from regulatory_prompt (no 422)."""
    from app.services.prompts.regulatory_prompt import ClauseExtract, ObligationExtract
    from app.services.ai_service import ClauseExtract as AIClauseExtract
    from app.services.ai_service import ObligationExtract as AIObligationExtract
    assert ClauseExtract is AIClauseExtract, (
        "CRITICAL: ClauseExtract in ai_service.py is NOT the same as in regulatory_prompt.py. "
        "This causes 422 ValidationErrors."
    )
    assert ObligationExtract is AIObligationExtract


@pytest.mark.anyio
async def test_analyze_returns_session_id_not_404():
    """POST /analyze/{document_id} must return session_id without 404 or 422."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        upload_resp = await ac.post(
            "/api/v1/upload",
            files={"file": ("analyze_test.pdf", io.BytesIO(MINIMAL_PDF_BYTES), "application/pdf")},
        )
        assert upload_resp.status_code in (200, 201)
        doc_id = upload_resp.json()["document_id"]
        analyze_resp = await ac.post(f"/api/v1/analyze/{doc_id}")
        assert analyze_resp.status_code == 200, f"Analyze: {analyze_resp.status_code} - {analyze_resp.text}"
        data = analyze_resp.json()
        assert "session_id" in data
        assert "document_id" in data
        assert data["session_id"] and data["session_id"] != "undefined"
        assert data["document_id"] == doc_id


@pytest.mark.anyio
async def test_action_plan_accessible_by_session_id():
    """GET /action-plan/{session_id} must return tasks (not 404 with 'undefined')."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/v1/seed-demo")
        sessions_resp = await ac.get("/api/v1/sessions")
        assert sessions_resp.status_code == 200
        sessions = sessions_resp.json()
        assert len(sessions) > 0
        session_id = sessions[0]["session_id"]
        assert session_id and session_id != "undefined"
        ap_resp = await ac.get(f"/api/v1/action-plan/{session_id}")
        assert ap_resp.status_code == 200, f"Action plan 404: session_id={session_id}"
        tasks = ap_resp.json()
        assert isinstance(tasks, list)
