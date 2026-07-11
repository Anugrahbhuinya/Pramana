# app/services/prompts/__init__.py
from app.services.prompts.audit_prompt import AUDIT_PROMPT, AuditResponse
from app.services.prompts.decision_prompt import DECISION_PROMPT, DecisionResponse
from app.services.prompts.executive_summary_prompt import (
    EXECUTIVE_SUMMARY_PROMPT,
    ExecutiveSummarySchema,
)
from app.services.prompts.impact_prompt import IMPACT_PROMPT, ImpactResponse
from app.services.prompts.regulatory_prompt import (
    REGULATORY_PROMPT,
    RegulatoryAnalysisSchema,
)
from app.services.prompts.risk_prompt import RISK_PROMPT, RiskResponse
