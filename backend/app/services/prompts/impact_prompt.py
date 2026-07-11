# app/services/prompts/impact_prompt.py
from typing import List

from pydantic import BaseModel, Field


class ImpactItem(BaseModel):
    obligation_index: int = Field(
        ..., description="The index of the obligation in the incoming list (0-based)"
    )
    affected_departments: List[str] = Field(
        ...,
        description="Departments affected (e.g. Risk, Compliance, Operations, Treasury, IT)",
    )
    affected_systems: List[str] = Field(
        ..., description="IT / Database / Core Banking systems impacted"
    )
    affected_policies: List[str] = Field(
        ..., description="Internal corporate compliance policies requiring updates"
    )
    affected_controls: List[str] = Field(
        ...,
        description="Internal checkpoints, validations, or system parameters that need changing",
    )
    affected_stakeholders: List[str] = Field(
        ...,
        description="Stakeholder groups impacted (e.g. Clients, Board, Operations Leads)",
    )
    business_impact: str = Field(
        ..., description="Deductive analysis of business impact"
    )
    operational_impact: str = Field(
        ...,
        description="Deductive analysis of operational workload and workflow changes",
    )
    technology_impact: str = Field(
        ..., description="Deductive analysis of changes to systems, APIs, or databases"
    )
    compliance_impact: str = Field(
        ..., description="Deductive analysis of the regulatory compliance burden"
    )


class ImpactResponse(BaseModel):
    impacts: List[ImpactItem] = Field(
        ..., description="List of impact analyses for each obligation"
    )


IMPACT_PROMPT = """
ROLE:
You are a Principal Enterprise Architect and Grounded Operations Consultant specializing in financial institution workflows and systems mapping.

OBJECTIVE:
Analyze the provided list of regulatory obligations and evaluate the enterprise-level impacts. For each obligation, map out departments, systems, policies, controls, stakeholders, and write detailed impact reports (business, operational, technology, and compliance).

STRICT GROUNDING RULES:
1. Identify affected departments, systems, and stakeholders based ONLY on the applicability text, target entities, and workflow descriptions present in the retrieved context.
2. Do not assume systems or departments that are not logically related to the text. For example, if the text only mentions Mutual Funds, do not map it to Stock Brokerage Treasury operations.
3. If the context is completely empty or insufficient to determine operational details, set the impacts to "Information not available in uploaded regulation."

RULES:
1. Make realistic enterprise assessments. For example, client fund segregation affects Treasury, Risk, Core Databases, Escrow APIs, and Operations.
2. The `obligation_index` must match the 0-based index of the obligation passed in.
3. Be specific with policies (e.g., "Treasury Handling Policy", "Information Security Policy") and controls (e.g., "End-of-day bank balance reconciliation checkpoint").
4. The output must conform strictly to the JSON schema provided. Return only the JSON object. Do not include markdown wraps or conversational preambles.
"""
