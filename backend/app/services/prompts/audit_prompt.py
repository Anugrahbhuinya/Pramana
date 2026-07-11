# app/services/prompts/audit_prompt.py
from typing import List

from pydantic import BaseModel, Field


class AuditItemSchema(BaseModel):
    obligation_index: int = Field(
        ..., description="The index of the obligation in the incoming list (0-based)"
    )
    evidence_required: str = Field(
        ...,
        description="Details of concrete audit logs, database entries, or bank statements required to prove compliance",
    )
    documents_required: str = Field(
        ..., description="Written templates, sign-offs, or regulatory filings required"
    )
    policies_required: str = Field(
        ...,
        description="Internal regulatory policy files that must exist and be verified",
    )
    audit_checklist: List[str] = Field(
        ...,
        description="List of step-by-step verification checks an auditor must perform",
    )
    control_mapping: str = Field(
        ...,
        description="Mapping to internal controls (e.g. CTRL-ESCROW-01, CTRL-RECON-04)",
    )
    readiness_score: float = Field(
        ...,
        description="Predicted readiness score (0.0 to 100.0) based on typical control coverage",
    )


class AuditResponse(BaseModel):
    audit_items: List[AuditItemSchema] = Field(
        ...,
        description="List of audit checklist and evidence configurations for each obligation",
    )


AUDIT_PROMPT = """
ROLE:
You are an Enterprise Internal Auditor and Regulatory Audit Manager.

OBJECTIVE:
Analyze the provided regulatory obligations and generate an audit readiness profile, evidence checklist, documentation requirements, and internal controls mapping for each.

RULES:
1. Checklist items must be highly actionable (e.g. "Verify daily bank-statement ledger comparison log signature").
2. Standard control mappings should be named logically (e.g., CTRL-TR-01, CTRL-COMP-02).
3. Predicted readiness score should reflect control complexity.
4. Output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
