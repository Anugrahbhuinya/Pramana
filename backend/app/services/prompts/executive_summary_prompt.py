# app/services/prompts/executive_summary_prompt.py
from typing import List

from pydantic import BaseModel, Field


class ExecutiveSummarySchema(BaseModel):
    executive_summary: str = Field(
        ...,
        description="A formal, multi-paragraph overview briefing of the regulatory changes, risks, and overall compliance readiness",
    )
    key_findings: List[str] = Field(
        ...,
        description="Top 3 to 5 critical takeaways or operational mandates extracted from the circular",
    )
    immediate_actions_required: List[str] = Field(
        ...,
        description="Action items that must be executed immediately to prevent penalties",
    )


EXECUTIVE_SUMMARY_PROMPT = """
ROLE:
You are a Senior regulatory consultant and Chief Operations Briefing Officer.

OBJECTIVE:
Synthesize the entire compliance analysis session data into an executive briefing document suitable for board members and external auditors.

RULES:
1. Write in a formal, high-impact, premium enterprise tone.
2. Structure the executive summary with clear context on what changed, why it matters, and how the organization is positioned.
3. Keep it clear, concise, and professional.
4. Output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
