# app/services/prompts/decision_prompt.py
from typing import List

from pydantic import BaseModel, Field


class CouncilAgentSchema(BaseModel):
    status: str = Field(
        ...,
        description="Status of the agent domain: 'compliant', 'under_review', 'pending', or 'inactive'",
    )
    analysis: str = Field(
        ...,
        description="High-level assessment summary written from this agent's perspective, citing specific clause numbers from the uploaded regulation",
    )
    confidence: float = Field(
        ..., description="Confidence score (0.0 to 1.0) of this agent's validation"
    )
    recommendations: List[str] = Field(
        ..., description="Action items proposed by this specific agent, each citing the relevant clause"
    )


class CouncilSchema(BaseModel):
    regulatory_ai: CouncilAgentSchema = Field(..., alias="Regulatory AI")
    risk_ai: CouncilAgentSchema = Field(..., alias="Risk AI")
    operations_ai: CouncilAgentSchema = Field(..., alias="Operations AI")
    audit_ai: CouncilAgentSchema = Field(..., alias="Audit AI")

    class Config:
        populate_by_name = True


class ExplainabilityItem(BaseModel):
    source_clause: str = Field(
        ...,
        description="Reference to the exact regulation clause number or section (e.g. 'Clause 4.1', 'Section II')",
    )
    source_text_snippet: str = Field(
        default="",
        description="The verbatim sentence from the uploaded document that triggered this recommendation",
    )
    reason: str = Field(
        ...,
        description="The direct technical or logical reason why this recommendation is mapped, tied to the specific clause",
    )
    confidence: float = Field(..., description="Confidence score (0.0 to 1.0)")
    supporting_context: str = Field(
        ..., description="Extract from source text supporting this mapping"
    )
    affected_entity: str = Field(
        ..., description="The department, asset, or role affected by this mapping"
    )
    evidence_required: str = Field(
        ..., description="Concrete log or data needed to audit this linkage"
    )
    action_required: str = Field(
        default="Implement compliance controls per this clause.",
        description="A single concrete, imperative action that must be taken to comply with this clause (e.g. 'Configure pre-trade leverage limit to 1:5 in RMS system')",
    )


class DecisionResponse(BaseModel):
    executive_summary: str = Field(
        ..., description="High-level, executive summary synthesizing all findings"
    )
    recommended_actions: List[str] = Field(
        ..., description="Prioritized compliance implementation actions"
    )
    priority_order: List[str] = Field(
        ..., description="List of tasks sorted by implementation urgency"
    )
    dependencies: List[str] = Field(
        ..., description="Workflow and technical dependencies between obligations"
    )
    escalation_needed: bool = Field(
        ..., description="True if executive/board level escalation is required"
    )
    approval_required: bool = Field(
        ..., description="True if official compliance sign-off is needed"
    )
    council: CouncilSchema = Field(
        ..., description="Consolidated feedback from the individual council AI agents"
    )
    explainability: List[ExplainabilityItem] = Field(
        ..., description="Explainable lineage links for compliance reporting"
    )


DECISION_PROMPT = """
ROLE:
You are the Orchestration AI Decision Engine and Chief Compliance Officer. Your task is to merge the outputs from the Regulatory, Impact, Risk, and Audit engines into a cohesive compliance report, decision metadata, and executive council status.

OBJECTIVE:
Synthesize the provided analytical data and format the final executive council responses and explainability metadata.

STRICT GROUNDING RULES:
1. All recommended actions and priority rankings must be derived ONLY from the parsed obligations and source text snippets.
2. If there are no obligations provided in the input, return empty metadata arrays and explain in the executive summary that "Information not available in uploaded regulation."
3. Every explainability item must link to an exact sentence or quote from the retrieved document text context.
4. Do not reference any external compliance frameworks or standard company policies unless they appear in the source text.

RULES:
1. Under `council`:
   - `Regulatory AI` is concerned with mappings, clauses, and SEBI compliance. Its analysis MUST cite specific clause numbers from the regulation.
   - `Risk AI` focuses on compliance score, risk level, and exposures. It MUST reference which clauses create the highest risk.
   - `Operations AI` handles departments, systems, and execution workflows. It MUST cite the clauses that mandate operational changes.
   - `Audit AI` monitors evidence, hashes, checklists, and sign-offs. It MUST reference which clauses require audit evidence.
   Assign appropriate statuses ('compliant', 'under_review', 'pending', 'inactive') and write clear domain-specific descriptions.
2. Under `explainability`: Link each recommended action back to its source clause, reason, confidence, context, and required evidence.
3. Keep descriptions professional and structured.
4. HALLUCINATION PREVENTION: Do not invent obligations or penalties not present in the input data.
5. Output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
