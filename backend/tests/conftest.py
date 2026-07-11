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
    mock_db.execute = AsyncMock()
    mock_db.commit = AsyncMock()
    mock_db.flush = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.close = AsyncMock()
    mock_db.rollback = AsyncMock()
    
    # Mock return values for common SQLAlchemy query results
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_result.scalars.return_value = mock_result
    mock_result.all.return_value = []
    mock_result.scalar.return_value = 0
    
    mock_db.execute.return_value = mock_result
    
    # Sync methods are MagicMock (which mock_db automatically spawns)
    # mock_db.add behaves like a normal sync mock function now
    
    async def _get_db():
        yield mock_db
        
    app.dependency_overrides[get_db_session] = _get_db
    yield mock_db
    app.dependency_overrides.pop(get_db_session, None)

