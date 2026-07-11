# backend/tests/test_grounding.py
import pytest
from app.services.ai_service import calculate_grounded_confidence

def test_calculate_grounded_confidence():
    """Verify that calculate_grounded_confidence returns a grounded score between 0 and 1."""
    # Perfect score scenario
    score_perfect = calculate_grounded_confidence(
        retrieval_results=[{"similarity": 0.98}, {"similarity": 0.96}],
        clauses=["Clause 1.1", "Clause 2.1"],
        validation_attempts=1
    )
    assert 0.0 <= score_perfect <= 1.0
    assert score_perfect > 0.90

    # Low retrieval match
    score_low_retrieval = calculate_grounded_confidence(
        retrieval_results=[{"similarity": 0.60}],
        clauses=["Clause 1.1"],
        validation_attempts=1
    )
    assert score_low_retrieval < score_perfect

    # High validation retry attempts should decrease confidence
    score_many_retries = calculate_grounded_confidence(
        retrieval_results=[{"similarity": 0.98}, {"similarity": 0.96}],
        clauses=["Clause 1.1", "Clause 2.1"],
        validation_attempts=3
    )
    assert score_many_retries < score_perfect
