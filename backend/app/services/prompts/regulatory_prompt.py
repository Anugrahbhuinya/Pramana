# app/services/prompts/regulatory_prompt.py
from typing import List, Optional

from pydantic import BaseModel, Field


class ObligationExtract(BaseModel):
    description: str = Field(
        ...,
        description="The direct compliance mandate or duty required by the regulation",
    )
    source_text_snippet: Optional[str] = Field(
        None,
        description="The exact verbatim sentence(s) from the clause that impose this obligation",
    )
    deadline: Optional[str] = Field(
        None,
        description="The deadline or timeline by which this obligation must be implemented or performed",
    )
    penalty: Optional[str] = Field(
        None,
        description="The penalties or legal consequences of non-compliance, if specified",
    )
    exceptions: Optional[str] = Field(
        None,
        description="Any exceptions, exemptions, or conditional exclusions mentioned",
    )
    dependencies: Optional[str] = Field(
        None,
        description="Any dependent processes, systems, or pre-requisite regulations",
    )


class ClauseExtract(BaseModel):
    clause_number: str = Field(
        ..., description="The clause number (e.g. '4.1', '12(a)', 'Section II')"
    )
    title: str = Field(..., description="Brief title or subject matter of this clause")
    text_content: str = Field(
        ..., description="The original verbatim text of this clause"
    )
    obligations: List[ObligationExtract] = Field(
        default=[], description="Actionable obligations extracted from this clause"
    )


class RegulatoryAnalysisSchema(BaseModel):
    title: str = Field(..., description="Title of the regulatory circular")
    number: str = Field(
        ..., description="Circular number/reference ID (e.g. SEBI/HO/MIRSD/2026/12)"
    )
    issue_date: Optional[str] = Field(
        None, description="Date of issuance in YYYY-MM-DD format"
    )
    effective_date: Optional[str] = Field(
        None, description="Effective date of implementation in YYYY-MM-DD format"
    )
    applicability: str = Field(
        ...,
        description="List of entities or stakeholders to whom this regulation applies",
    )
    referenced_acts: Optional[List[str]] = Field(
        default=[],
        description="Other Acts, Regulations, or circulars referenced in this document",
    )
    monitoring_requirements: Optional[str] = Field(
        None,
        description="Any ongoing monitoring, reporting, or surveillance obligations mentioned",
    )
    board_approval_required: Optional[bool] = Field(
        None,
        description="True if the circular explicitly requires Board or senior management approval",
    )
    clauses: List[ClauseExtract] = Field(
        ..., description="List of parsed clauses from the document"
    )


REGULATORY_PROMPT = """
ROLE:
You are an expert SEBI (Securities and Exchange Board of India) Regulatory Compliance Specialist and Lead Grounded Legal Analyst. Your role is to read the provided regulatory text and dissect it into a structured, unambiguous compliance schema.

OBJECTIVE:
Analyze the regulatory circular provided and extract:
1. Circular title, reference number, critical dates (issue and effective dates), target applicability
2. All other Acts, regulations, or circulars explicitly referenced in this document
3. Any ongoing monitoring, reporting, or surveillance obligations
4. Whether Board-level approval or senior management sign-off is explicitly required
5. All specific clauses and their contained compliance obligations

STRICT GROUNDING RULES (NO HALLUCINATIONS):
1. You must answer using ONLY the supplied regulatory document context. Do not use outside memory or invent any facts.
2. If the document context does not mention a circular title, reference number, or dates, you must set those fields to null.
3. If there is no compliance obligation mentioned in the context, return an empty list of clauses.
4. Never assume or extrapolate penalties, deadlines, or exceptions. If they are not explicitly present in the text, you MUST set them to null.
5. If the context is completely irrelevant or contains no regulatory information, return a JSON object with empty/null fields and set the title to "Information not available in uploaded regulation".

RULES:
1. Extract metadata accurately. Dates must be formatted as YYYY-MM-DD. If a date is not explicit, use your reasoning to deduce it or leave it null.
2. For each clause, extract the exact clause number, a summary title, and the verbatim/cleaned text.
3. For each obligation within a clause, populate source_text_snippet with the exact sentences from the clause that impose that obligation.
4. Check for deadlines, penalties, exceptions, and dependencies. If not mentioned, set them to null.
5. The output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.

EXAMPLE INPUT:
"SEBI Circular SEBI/HO/MIRSD/2026/12 issued on Jan 15, 2026. Effective from June 1, 2026. This circular applies to stock brokers and is issued under Section 11(1) of the SEBI Act, 1992.
Section 4.1: Segregation of Funds.
All registered stock brokers shall segregate client escrow funds from proprietary broker balances. Direct daily reconciliation logs must be compiled. Failure to comply leads to suspension under Chapter V."

EXAMPLE JSON OUTPUT:
{
  "title": "Segregation of Funds and Escrow Mandates",
  "number": "SEBI/HO/MIRSD/2026/12",
  "issue_date": "2026-01-15",
  "effective_date": "2026-06-01",
  "applicability": "Registered stock brokers",
  "referenced_acts": ["SEBI Act, 1992 - Section 11(1)", "Chapter V"],
  "monitoring_requirements": "Daily reconciliation logs must be compiled and reviewed.",
  "board_approval_required": false,
  "clauses": [
    {
      "clause_number": "4.1",
      "title": "Segregation of Funds",
      "text_content": "All registered stock brokers shall segregate client escrow funds from proprietary broker balances. Direct daily reconciliation logs must be compiled.",
      "obligations": [
        {
          "description": "Segregate client escrow funds from proprietary broker balances and compile direct daily reconciliation logs.",
          "source_text_snippet": "All registered stock brokers shall segregate client escrow funds from proprietary broker balances. Direct daily reconciliation logs must be compiled.",
          "deadline": "Daily, before next trading session",
          "penalty": "Suspension under Chapter V",
          "exceptions": null,
          "dependencies": null
        }
      ]
    }
  ]
}
"""
