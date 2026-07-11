# tests/e2e_integration_test.py
import pytest
from uuid import UUID
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_e2e_compliance_platform_workflow():
    """Runs a complete end-to-end simulation of the Pramana integration workflow.
    
    Checks:
    1. System Health Status Check
    2. Database Seeding of SEBI Circulars
    3. Compliance Control Center Metrics
    4. Execution Blueprint Task Retrieval
    5. Regulatory Digital Twin Graph Nodes & Edges
    6. Decision Traceability Journey Traces
    """
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Probe System Health
        health_response = await ac.get("/api/v1/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert health_data["status"] == "healthy"
        assert "database" in health_data

        # 2. Trigger Seeder (resets and populates 3 SEBI circulars, 20 obligations, 40 tasks)
        seed_response = await ac.post("/api/v1/seed-demo")
        assert seed_response.status_code == 200
        assert seed_response.json()["status"] == "success"

        # 3. Query Compliance Control Center (Dashboard Summary)
        dashboard_response = await ac.get("/api/v1/dashboard-summary")
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()
        
        # Basic metric range validations
        assert "compliance_readiness" in dashboard_data
        assert "critical_risks" in dashboard_data
        assert "pending_obligations" in dashboard_data
        assert len(dashboard_data["recent_sessions"]) > 0

        # Extract the UUID of the first seeded SEBI circular analysis session
        first_session = dashboard_data["recent_sessions"][0]
        session_id = first_session["session_id"]
        assert session_id is not None
        
        # Verify UUID format is correct
        session_uuid = UUID(session_id)
        assert isinstance(session_uuid, UUID)

        # 4. Query Execution Blueprint Tasks
        blueprint_response = await ac.get(f"/api/v1/action-plan/{session_uuid}")
        assert blueprint_response.status_code == 200
        blueprint_tasks = blueprint_response.json()
        assert len(blueprint_tasks) > 0
        
        # Verify first blueprint task fields
        first_task = blueprint_tasks[0]
        assert "task" in first_task
        assert "owner" in first_task
        assert "status" in first_task
        assert "priority" in first_task
        assert "evidence" in first_task

        # 5. Query Regulatory Digital Twin Topological Nodes
        twin_response = await ac.get(f"/api/v1/digital-twin/{session_uuid}")
        assert twin_response.status_code == 200
        twin_data = twin_response.json()
        assert "nodes" in twin_data
        assert "edges" in twin_data
        assert len(twin_data["nodes"]) > 0
        assert len(twin_data["edges"]) > 0

        # 6. Query Decision Traceability Journey
        trace_response = await ac.get(f"/api/v1/explainability/{session_uuid}")
        assert trace_response.status_code == 200
        trace_data = trace_response.json()
        assert "trace" in trace_data
        assert len(trace_data["trace"]) > 0
        
        # Verify first trace path details
        first_trace = trace_data["trace"][0]
        assert "source_clause" in first_trace
        assert "reason" in first_trace
        assert "confidence" in first_trace
        assert "evidence_required" in first_trace
