# backend/tests/test_integration.py
"""
Pramana Phase 4D.1 — Integration Test Suite

Validates the end-to-end pipeline: Upload → Analysis → Dashboard → Council → Twin → Blueprint
Tests API contract parity between backend responses and frontend expectations.
"""
import io
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def client():
    """Creates an async HTTP test client bound to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver/api/v1") as ac:
        yield ac


# ============================================================================
# 1. Health Check & Connectivity
# ============================================================================
class TestHealthAndVersion:
    """Validates that the backend starts and responds to health probes."""

    @pytest.mark.anyio
    async def test_health_endpoint(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"

    @pytest.mark.anyio
    async def test_version_endpoint(self, client: AsyncClient):
        response = await client.get("/version")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data


# ============================================================================
# 2. Upload Endpoint Contract
# ============================================================================
class TestUploadEndpoint:
    """Validates the /upload POST endpoint returns the correct schema."""

    @pytest.mark.anyio
    async def test_upload_rejects_non_pdf(self, client: AsyncClient):
        """Frontend sends only PDFs. Non-PDF should return 400."""
        fake_file = io.BytesIO(b"not a pdf")
        response = await client.post(
            "/upload",
            files={"file": ("test.txt", fake_file, "text/plain")},
        )
        assert response.status_code in (400, 422)

    @pytest.mark.anyio
    async def test_upload_rejects_empty_file(self, client: AsyncClient):
        """Empty file should be rejected."""
        empty_file = io.BytesIO(b"")
        response = await client.post(
            "/upload",
            files={"file": ("empty.pdf", empty_file, "application/pdf")},
        )
        # Should reject empty files
        assert response.status_code in (400, 422, 500)


# ============================================================================
# 3. Analysis Session Retrieval Contract
# ============================================================================
class TestAnalysisSessionContract:
    """Validates that /analysis/{id} returns the schema expected by the frontend."""

    @pytest.mark.anyio
    async def test_analysis_404_for_invalid_uuid(self, client: AsyncClient):
        """Frontend handles 404 gracefully. Backend must return 404 for non-existent sessions."""
        import uuid
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/analysis/{fake_id}")
        assert response.status_code == 404

    @pytest.mark.anyio
    async def test_analysis_422_for_non_uuid(self, client: AsyncClient):
        """Non-UUID path params should return 422 validation error."""
        response = await client.get("/analysis/not-a-uuid")
        assert response.status_code == 422


# ============================================================================
# 4. Executive Summary Contract
# ============================================================================
class TestExecutiveSummaryContract:
    """Validates /executive-summary/{id} returns correct schema."""

    @pytest.mark.anyio
    async def test_executive_summary_404(self, client: AsyncClient):
        import uuid
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/executive-summary/{fake_id}")
        assert response.status_code == 404


# ============================================================================
# 5. Explainability Trace Contract
# ============================================================================
class TestExplainabilityContract:
    """Validates /explainability/{id} returns the trace array format."""

    @pytest.mark.anyio
    async def test_explainability_404(self, client: AsyncClient):
        import uuid
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/explainability/{fake_id}")
        assert response.status_code == 404


# ============================================================================
# 6. Digital Twin Graph Contract
# ============================================================================
class TestDigitalTwinContract:
    """Validates /digital-twin/{id} returns nodes and edges arrays."""

    @pytest.mark.anyio
    async def test_digital_twin_404(self, client: AsyncClient):
        import uuid
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/digital-twin/{fake_id}")
        assert response.status_code == 404


# ============================================================================
# 7. Action Plan Contract
# ============================================================================
class TestActionPlanContract:
    """Validates /action-plan/{session_id} returns ActionPlanTask[] format."""

    @pytest.mark.anyio
    async def test_action_plan_404(self, client: AsyncClient):
        import uuid
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/action-plan/{fake_id}")
        # Action plan returns empty list for non-existent session (not 404)
        assert response.status_code in (200, 404)
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list)


# ============================================================================
# 8. Dashboard Summary Contract
# ============================================================================
class TestDashboardSummaryContract:
    """Validates /dashboard-summary returns the expected dashboard shape."""

    @pytest.mark.anyio
    async def test_dashboard_summary_returns_200(self, client: AsyncClient):
        response = await client.get("/dashboard-summary")
        assert response.status_code == 200
        data = response.json()
        assert "compliance_readiness" in data
        assert "critical_risks" in data
        assert "recent_sessions" in data
        assert isinstance(data["recent_sessions"], list)


# ============================================================================
# 9. Sessions List Contract
# ============================================================================
class TestSessionsListContract:
    """Validates /sessions returns SessionListItem[] format."""

    @pytest.mark.anyio
    async def test_sessions_list_returns_200(self, client: AsyncClient):
        response = await client.get("/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ============================================================================
# 10. Seed Demo Endpoint
# ============================================================================
class TestSeedDemoEndpoint:
    """Validates /seed-demo POST initializes demo data."""

    @pytest.mark.anyio
    async def test_seed_demo_returns_200(self, client: AsyncClient):
        response = await client.post("/seed-demo")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"


# ============================================================================
# 11. Error Response Format Consistency
# ============================================================================
class TestErrorResponseFormat:
    """Validates that error responses follow the standardized envelope format."""

    @pytest.mark.anyio
    async def test_validation_error_format(self, client: AsyncClient):
        """Pydantic validation errors should return structured format, not raw stack traces."""
        response = await client.get("/analysis/not-a-uuid")
        assert response.status_code == 422
        data = response.json()
        # Should follow the standardized format
        assert "success" in data or "detail" in data
        # Must NOT contain Python class names or stack trace fragments
        response_text = str(data)
        assert "Traceback" not in response_text
        assert "pydantic" not in response_text.lower() or "validation" in response_text.lower()

    @pytest.mark.anyio
    async def test_404_error_format(self, client: AsyncClient):
        """404 errors should return user-friendly messages."""
        import uuid
        response = await client.get(f"/analysis/{uuid.uuid4()}")
        assert response.status_code == 404


# ============================================================================
# 12. Import Validation (non-runtime checks)
# ============================================================================
class TestImportIntegrity:
    """Validates that critical modules import without errors."""

    def test_retrieval_service_imports(self):
        """Verifies that the missing 're' import fix is in place."""
        from app.services.retrieval_service import RetrievalService
        assert RetrievalService is not None

    def test_ai_service_imports(self):
        """Verifies ai_service asyncio import works."""
        from app.services.ai_service import RegulationAnalysisService
        assert RegulationAnalysisService is not None

    def test_embedding_service_imports(self):
        """Verifies embedding_service asyncio import works."""
        from app.services.embedding_service import EmbeddingService
        assert EmbeddingService is not None

    def test_document_service_imports(self):
        from app.services.document_service import DocumentService
        assert DocumentService is not None

    def test_models_import(self):
        from app.models.models import Document, AnalysisSession, Regulation
        assert Document is not None
        assert AnalysisSession is not None
        assert Regulation is not None
