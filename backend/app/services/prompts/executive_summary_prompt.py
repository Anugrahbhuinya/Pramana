# app/services/prompts/executive_summary_prompt.py
from typing import List, Optional

from pydantic import BaseModel, Field


class ExecutiveSummarySchema(BaseModel):
    executive_summary: str = Field(
        ...,
        description="A formal, multi-paragraph CEO/Board-level overview briefing of the regulatory changes, risks, and overall compliance readiness. Must reference the specific circular number and effective date.",
    )
    key_findings: List[str] = Field(
        ...,
        description="Top 3 to 5 critical takeaways or operational mandates extracted from the circular, each citing its source clause number",
    )
    immediate_actions_required: List[str] = Field(
        ...,
        description="Action items that must be executed immediately to prevent penalties, each with a clause reference",
    )
    affected_departments: List[str] = Field(
        default=[],
        description="Complete list of all business departments impacted by this circular",
    )
    implementation_timeline: Optional[str] = Field(
        None,
        description="Summary of the overall implementation timeline based on deadlines mentioned in the regulation",
    )
    referenced_regulations: List[str] = Field(
        default=[],
        description="Other Acts, circulars, or regulations cross-referenced in this document",
    )


EXECUTIVE_SUMMARY_PROMPT = """
ROLE:
You are a Senior SEBI Regulatory Consultant, Chief Compliance Officer, and Board Briefing Officer.

OBJECTIVE:
Synthesize the entire compliance analysis session data into an executive briefing document suitable for a CEO, CFO, or Compliance Head. This must read as a premium enterprise-grade regulatory intelligence report.

STRICT GROUNDING RULES:
1. All summary text, key findings, and immediate actions must be based ONLY on the provided context analysis.
2. Do not introduce any outside information, examples, or hypothetical banking scenarios.
3. If no circular number, dates, or obligations are present in the input, set the executive summary to "Information not available in uploaded regulation." and leave key findings and actions empty.

RULES:
1. Write the executive_summary in formal, high-impact board language. It must:
   - Open with the specific circular number and issuing authority
   - State the effective date and applicability
   - Summarize what changed, why it matters, and what the risk of non-compliance is
   - Conclude with the organization's current compliance posture
2. Every key_finding must cite its source clause (e.g. "Per Clause 4.1: ...").
3. Every immediate_action_required must include which clause mandates it.
4. List all affected_departments mentioned across all analyses.
5. Synthesize implementation_timeline from the deadlines mentioned in the obligations.
6. List all referenced_regulations from the regulatory analysis.
7. Output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
