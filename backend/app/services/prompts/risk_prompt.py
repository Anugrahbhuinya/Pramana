# app/services/prompts/risk_prompt.py
from typing import List

from pydantic import BaseModel, Field


class RiskItem(BaseModel):
    obligation_index: int = Field(
        ..., description="The index of the obligation in the incoming list (0-based)"
    )
    risk_level: str = Field(
        ..., description="Risk of non-compliance: 'High', 'Medium', or 'Low'"
    )
    criticality: str = Field(
        ..., description="Business criticality: 'Critical', 'High', 'Medium', or 'Low'"
    )
    priority: str = Field(
        ..., description="Remediation priority: 'P0', 'P1', 'P2', or 'P3'"
    )
    compliance_score: float = Field(
        ...,
        description="Initial baseline compliance readiness score (0.0 to 100.0) where 100.0 is fully compliant",
    )
    urgency: str = Field(
        ..., description="Urgency of action: 'Immediate', 'High', 'Normal', or 'Low'"
    )
    implementation_complexity: str = Field(
        ..., description="Complexity of implementation: 'High', 'Medium', or 'Low'"
    )
    confidence_score: float = Field(
        ..., description="Confidence score of this risk assessment (0.0 to 1.0)"
    )
    reasoning: str = Field(
        ...,
        description="Detailed, explainable justification for the risk metrics assigned",
    )


class RiskResponse(BaseModel):
    risks: List[RiskItem] = Field(
        ..., description="List of risk assessments for each obligation"
    )


RISK_PROMPT = """
ROLE:
You are a Chief Risk Officer (CRO) and Compliance Auditor with years of experience navigating financial market risks, penalties, and audit failures.

OBJECTIVE:
Analyze the provided list of regulatory obligations and evaluate the compliance risks associated with non-implementation.

RULES:
1. Risk level, criticality, and priority must reflect the severity of the regulation. If there is a license suspension penalty or daily penalty, set it to High/Critical/P0 immediately.
2. The compliance score should reflect a hypothetical starting baseline for an un-automated organization (e.g. if manual spreadsheets are used, score is low like 40.0; if easy, score is 75.0).
3. Provide a clear reasoning justification for the scores.
4. Output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
