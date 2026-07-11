# backend/tests/conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.main import app
from app.database.session import get_db_session

# Simple mock database session dependency override
@pytest.fixture(autouse=True)
def override_db_dependency():
    """Overrides the FastAPI db session dependency with a mock to avoid hitting real database."""
    mock_db = MagicMock()
    
    # Explicitly make async operations AsyncMock
    mock_db.commit = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.close = AsyncMock()
    mock_db.rollback = AsyncMock()
    
    def mock_add(obj):
        import uuid
        if hasattr(obj, "id") and obj.id is None:
            obj.id = uuid.uuid4()
        return None
    mock_db.add = mock_add

    async def mock_execute(stmt, *args, **kwargs):
        import uuid
        from datetime import date, datetime
        from app.models.models import Document, DocumentChunk, AnalysisSession, Regulation, Clause, Obligation, Risk, Impact, AuditItem
        
        stmt_str = str(stmt).lower()
        res = MagicMock()
        
        # Extract UUID from bind parameters if present
        bind_uuid = None
        try:
            params = stmt.compile().params
            for k, v in params.items():
                if isinstance(v, uuid.UUID):
                    bind_uuid = v
                    break
                elif isinstance(v, str):
                    try:
                        bind_uuid = uuid.UUID(v)
                        break
                    except ValueError:
                        pass
        except Exception:
            pass
            
        # Default empty/none values
        res.scalar_one_or_none.return_value = None
        res.scalar_one.return_value = None
        res.scalars.return_value = res
        res.scalar.return_value = 0
        res.all.return_value = []
        
        # If querying analysis sessions
        if "from analysis_sessions" in stmt_str or "analysis_sessions" in stmt_str:
            session_doc_id = bind_uuid or uuid.uuid4()
            mock_session = AnalysisSession(
                id=uuid.uuid4(),
                document_id=session_doc_id,
                status="completed",
                executive_summary="SEBI has mandated strict guidelines.",
                decision_metadata={
                    "recommended_actions": ["Action 1"],
                    "priority_order": ["P0: Action 1"],
                    "dependencies": [],
                    "escalation_needed": False,
                    "approval_required": False,
                    "key_findings": ["Finding 1"],
                    "immediate_actions_required": ["Immediate 1"],
                    "affected_departments": ["Compliance"],
                    "implementation_timeline": "Immediate",
                    "referenced_regulations": []
                },
                explainability_data={
                    "trace": [
                        {
                            "source_clause": "Clause 4.1",
                            "source_text_snippet": "All registered stock brokers shall segregate client escrow funds.",
                            "reason": "Escrow account segregation is mandatory.",
                            "confidence": 0.98,
                            "supporting_context": "All registered stock brokers shall segregate client escrow funds.",
                            "affected_entity": "Compliance",
                            "evidence_required": "Escrow balance statement.",
                            "action_required": "Implement escrow account segregation."
                        }
                    ]
                }
            )
            # For join query in list_sessions: it returns (AnalysisSession, Document)
            mock_doc = Document(id=session_doc_id, name="test_sebi.pdf", status="processed")
            res.all.return_value = [(mock_session, mock_doc)]
            res.scalar_one_or_none.return_value = mock_session
            res.scalar_one.return_value = mock_session
            
        # If querying documents
        elif "from documents" in stmt_str or "documents.file_hash" in stmt_str:
            doc_id = bind_uuid or uuid.uuid4()
            mock_doc = Document(
                id=doc_id,
                name="test_sebi.pdf",
                file_path="/tmp/test.pdf",
                file_hash="5e8f3f88b8e05c871dfa7e3240ebcd5f7d2427a13d71bc29424c8b2111111111",
                status="processed",
                language="English",
                total_pages=3
            )
            res.scalar_one_or_none.return_value = mock_doc
            res.scalar_one.return_value = mock_doc
            res.all.return_value = [(mock_doc,)]
            res.first.return_value = mock_doc
            
        # If querying chunks
        elif "from chunks" in stmt_str:
            chunk1 = DocumentChunk(
                id=uuid.uuid4(),
                document_id=bind_uuid or uuid.uuid4(),
                text_content="All registered stock brokers shall segregate client escrow funds. Direct daily reconciliation logs must be compiled.",
                page_number=1,
                chunk_index=0
            )
            res.scalars.return_value = res
            res.all.return_value = [chunk1]
            
        # If querying regulations
        elif "from regulations" in stmt_str:
            mock_reg = Regulation(
                id=uuid.uuid4(),
                document_id=bind_uuid or uuid.uuid4(),
                title="SEBI Mandate on Client Fund Segregation and Escrow Audits",
                number="SEBI/HO/MIRSD/2026/12",
                issue_date=date(2026, 1, 15),
                effective_date=date(2026, 6, 1),
                applicability="Registered Stock Brokers"
            )
            res.scalar_one_or_none.return_value = mock_reg
            res.scalar_one.return_value = mock_reg
            res.all.return_value = [mock_reg]
            
        return res
        
    mock_db.execute = mock_execute
    
    async def _get_db():
        yield mock_db
        
    app.dependency_overrides[get_db_session] = _get_db
    yield mock_db
    app.dependency_overrides.pop(get_db_session, None)


