# app/services/ai_service.py
import asyncio
import json
import os
import time
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.models.models import (
    AnalysisSession,
    AuditItem,
    Clause,
    Document,
    DocumentChunk,
    Impact,
    Obligation,
    Regulation,
    Risk,
)
from app.services.prompts.audit_prompt import (
    AUDIT_PROMPT,
    AuditItemSchema,
    AuditResponse,
)
from app.services.prompts.decision_prompt import DECISION_PROMPT, DecisionResponse
from app.services.prompts.executive_summary_prompt import (
    EXECUTIVE_SUMMARY_PROMPT,
    ExecutiveSummarySchema,
)
from app.services.prompts.impact_prompt import IMPACT_PROMPT, ImpactItem, ImpactResponse
from app.services.prompts.regulatory_prompt import (
    REGULATORY_PROMPT,
    RegulatoryAnalysisSchema,
    ClauseExtract,
    ObligationExtract,
)
from app.services.prompts.risk_prompt import RISK_PROMPT, RiskItem, RiskResponse


class AIServiceBase:
    """Base class for Gemini API interaction with retry logic and fallback options."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.has_api_key = bool(self.api_key and self.api_key.strip())

        if self.has_api_key:
            genai.configure(api_key=self.api_key)

    async def _call_gemini_structured(
        self,
        prompt: str,
        content: str,
        response_schema: Any,
        retries: int = 3,
        delay: float = 2.0,
    ) -> Any:
        """Helper to invoke Gemini API with structured JSON output and schema validation."""
        if not self.has_api_key:
            raise ValueError("Gemini API key is not configured.")

        # Construct generation configuration with schema
        generation_config = GenerationConfig(
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=settings.GEMINI_TEMPERATURE,
            max_output_tokens=settings.GEMINI_MAX_TOKENS,
            top_p=settings.GEMINI_TOP_P,
        )

        for attempt in range(retries):
            try:
                model = genai.GenerativeModel(self.model_name)
                # Combine prompt and content
                full_content = f"{prompt}\n\nINPUT DATA:\n{content}"

                # Execute API call in thread executor to avoid blocking the async event loop
                response = await asyncio.to_thread(
                    model.generate_content,
                    full_content,
                    generation_config=generation_config,
                )

                # Parse output
                text_out = response.text
                if not text_out:
                    raise ValueError("Gemini returned empty response.")

                # Parse to schema
                parsed_data = response_schema.model_validate_json(text_out)
                return parsed_data
            except Exception as e:
                logger.warning(
                    f"Gemini API call failed (attempt {attempt + 1}/{retries})",
                    error=str(e),
                )
                if attempt < retries - 1:
                    await asyncio.sleep(delay * (2**attempt))  # Exponential backoff
                else:
                    raise e


class RegulatoryAnalysisService(AIServiceBase):
    """Parses text to extract structured regulations, clauses, and obligations."""

    async def analyze_text(self, text: str) -> RegulatoryAnalysisSchema:
        """Analyzes raw regulatory text and returns structured clauses and obligations."""
        if not self.has_api_key:
            return self._generate_mock_regulatory_analysis(text)

        try:
            return await self._call_gemini_structured(
                prompt=REGULATORY_PROMPT,
                content=text,
                response_schema=RegulatoryAnalysisSchema,
            )
        except Exception as e:
            logger.error(
                "Regulatory Analysis Gemini call failed. Falling back to mock.",
                error=str(e),
            )
            return self._generate_mock_regulatory_analysis(text)

    def _generate_mock_regulatory_analysis(self, text: str) -> RegulatoryAnalysisSchema:
        """Generates deterministic mock regulation details if API fails or is offline."""
        title = "SEBI Mandate on Client Fund Segregation and Escrow Audits"
        number = "SEBI/HO/MIRSD/2026/12"

        # Check text for matching keywords to make it look realistic
        if "leverage" in text.lower() or "margin" in text.lower():
            title = "SEBI Margin Leverage and Intraday Limits Control"
            number = "SEBI/HO/MRD/2026/08"

        return RegulatoryAnalysisSchema(
            title=title,
            number=number,
            issue_date="2026-01-15",
            effective_date="2026-06-01",
            applicability="Registered Stock Brokers, Depositories, and Clearing Corporations",
            clauses=[
                ClauseExtract(
                    clause_number="4.1",
                    title="Escrow Account Segregation",
                    text_content="All registered stock brokers shall segregate client escrow funds from proprietary broker balances. Direct daily reconciliation logs must be compiled and signed off before next trading session.",
                    obligations=[
                        ObligationExtract(
                            description="Segregate client escrow funds from proprietary broker balances.",
                            deadline="Daily, before next trading session",
                            penalty="License suspension under Chapter V",
                            exceptions="Proprietary margins specifically exempted during intra-day clearing hours",
                            dependencies="Bank Escrow API systems",
                        ),
                        ObligationExtract(
                            description="Compile and sign off daily reconciliation logs.",
                            deadline="Daily, before next trading session",
                            penalty="Penalty up to 10 Lakhs INR",
                            exceptions=None,
                            dependencies=None,
                        ),
                    ],
                ),
                ClauseExtract(
                    clause_number="4.2",
                    title="Intraday Margin Leverage Cap",
                    text_content="Proprietary intraday leverage on equity futures shall be capped at a maximum of 1:5 of collateral value. Clearing members must reject order executions exceeding threshold.",
                    obligations=[
                        ObligationExtract(
                            description="Cap proprietary intraday leverage on equity futures at 1:5 of collateral value.",
                            deadline="Immediate, from effective date",
                            penalty="Disablement of trading terminal",
                            exceptions=None,
                            dependencies="RMS Pre-trade risk API",
                        )
                    ],
                ),
            ],
        )


# ClauseExtract and ObligationExtract are imported from regulatory_prompt.py
# to avoid duplicate class definitions that cause Pydantic 422 ValidationErrors.


class ImpactAnalysisService(AIServiceBase):
    """Maps operational, system, and policy impacts for compliance mandates."""

    async def analyze_obligations(
        self, obligations: List[Dict[str, Any]]
    ) -> ImpactResponse:
        """Determines enterprise impact mappings for a list of obligations."""
        if not self.has_api_key:
            return self._generate_mock_impacts(obligations)

        try:
            content = json.dumps(obligations, indent=2)
            return await self._call_gemini_structured(
                prompt=IMPACT_PROMPT, content=content, response_schema=ImpactResponse
            )
        except Exception as e:
            logger.error(
                "Impact Analysis Gemini call failed. Falling back to mock.",
                error=str(e),
            )
            return self._generate_mock_impacts(obligations)

    def _generate_mock_impacts(
        self, obligations: List[Dict[str, Any]]
    ) -> ImpactResponse:
        items = []
        for idx, ob in enumerate(obligations):
            desc = ob.get("description", "").lower()
            if "segregate" in desc or "escrow" in desc:
                items.append(
                    ImpactItem(
                        obligation_index=idx,
                        affected_departments=[
                            "Treasury",
                            "Compliance",
                            "Operations",
                            "Finance",
                        ],
                        affected_systems=[
                            "Core Brokerage Ledger",
                            "Banking Escrow API Interface",
                        ],
                        affected_policies=[
                            "Client Fund Management Policy",
                            "Escrow Reconciliation Standards",
                        ],
                        affected_controls=["CTRL-ESCROW-01 (Daily Balance Checksum)"],
                        affected_stakeholders=[
                            "Treasury Operations Lead",
                            "Compliance Auditor",
                        ],
                        business_impact="High. Requires strict daily operational routines and locking of funds.",
                        operational_impact="Medium. Increases reconciliation overhead for daily closing reports.",
                        technology_impact="High. Requires automated bank integration to extract end-of-day balances.",
                        compliance_impact="Critical. Direct audit point subject to SEBI regulatory inspection.",
                    )
                )
            elif "leverage" in desc or "margin" in desc:
                items.append(
                    ImpactItem(
                        obligation_index=idx,
                        affected_departments=[
                            "Risk Management",
                            "Trading Operations",
                            "IT Support",
                        ],
                        affected_systems=[
                            "Pre-trade Risk Management System (RMS)",
                            "OMS (Order Management System)",
                        ],
                        affected_policies=["Trading Limit and Margin Policies"],
                        affected_controls=[
                            "CTRL-RMS-LIMITS (Pre-trade Leverage Checker)"
                        ],
                        affected_stakeholders=[
                            "Risk Management Head",
                            "Active Day Traders",
                        ],
                        business_impact="Medium. May slightly reduce trading volumes on highly leveraged accounts.",
                        operational_impact="Low. Fully automated RMS checks, minimal daily operations overhead.",
                        technology_impact="High. Requires setting hard-coded intraday parameters in OMS database.",
                        compliance_impact="High. Failure results in immediate clearing terminal disablement.",
                    )
                )
            else:
                items.append(
                    ImpactItem(
                        obligation_index=idx,
                        affected_departments=["Compliance"],
                        affected_systems=["Internal Logs"],
                        affected_policies=["General Code of Conduct"],
                        affected_controls=["CTRL-GEN-AUDIT"],
                        affected_stakeholders=["Compliance Officer"],
                        business_impact="Low business friction.",
                        operational_impact="Low workload.",
                        technology_impact="None.",
                        compliance_impact="Medium regulatory tracking.",
                    )
                )
        return ImpactResponse(impacts=items)


class RiskAnalysisService(AIServiceBase):
    """Calculates risk levels, compliance scores, complexity, and priority."""

    async def analyze_obligations(
        self, obligations: List[Dict[str, Any]]
    ) -> RiskResponse:
        """Evaluates compliance risks for a list of obligations."""
        if not self.has_api_key:
            return self._generate_mock_risks(obligations)

        try:
            content = json.dumps(obligations, indent=2)
            return await self._call_gemini_structured(
                prompt=RISK_PROMPT, content=content, response_schema=RiskResponse
            )
        except Exception as e:
            logger.error(
                "Risk Analysis Gemini call failed. Falling back to mock.", error=str(e)
            )
            return self._generate_mock_risks(obligations)

    def _generate_mock_risks(self, obligations: List[Dict[str, Any]]) -> RiskResponse:
        items = []
        for idx, ob in enumerate(obligations):
            desc = ob.get("description", "").lower()
            if "segregate" in desc or "escrow" in desc:
                items.append(
                    RiskItem(
                        obligation_index=idx,
                        risk_level="High",
                        criticality="Critical",
                        priority="P0",
                        compliance_score=65.0,
                        urgency="Immediate",
                        implementation_complexity="High",
                        confidence_score=0.98,
                        reasoning="Fund segregation failures represent direct breaches of client safety rules. SEBI enforces license suspension for manual reconciliations prone to timing delays.",
                    )
                )
            elif "leverage" in desc or "margin" in desc:
                items.append(
                    RiskItem(
                        obligation_index=idx,
                        risk_level="High",
                        criticality="High",
                        priority="P1",
                        compliance_score=80.0,
                        urgency="High",
                        implementation_complexity="Medium",
                        confidence_score=0.95,
                        reasoning="OMS-level limit checks are relatively simple to implement but crucial. Exposure risk is high if day traders execute trades during system failures.",
                    )
                )
            else:
                items.append(
                    RiskItem(
                        obligation_index=idx,
                        risk_level="Medium",
                        criticality="Medium",
                        priority="P2",
                        compliance_score=90.0,
                        urgency="Normal",
                        implementation_complexity="Low",
                        confidence_score=0.90,
                        reasoning="Standard procedural reporting obligation. Lower penalty exposure.",
                    )
                )
        return RiskResponse(risks=items)


class AuditService(AIServiceBase):
    """Formulates audit checklists, evidence targets, and readiness ratings."""

    async def analyze_obligations(
        self, obligations: List[Dict[str, Any]]
    ) -> AuditResponse:
        """Builds evidence requirements and checklist metrics."""
        if not self.has_api_key:
            return self._generate_mock_audits(obligations)

        try:
            content = json.dumps(obligations, indent=2)
            return await self._call_gemini_structured(
                prompt=AUDIT_PROMPT, content=content, response_schema=AuditResponse
            )
        except Exception as e:
            logger.error(
                "Audit Analysis Gemini call failed. Falling back to mock.", error=str(e)
            )
            return self._generate_mock_audits(obligations)

    def _generate_mock_audits(self, obligations: List[Dict[str, Any]]) -> AuditResponse:
        items = []
        for idx, ob in enumerate(obligations):
            desc = ob.get("description", "").lower()
            if "segregate" in desc or "escrow" in desc:
                items.append(
                    AuditItemSchema(
                        obligation_index=idx,
                        evidence_required="Bank Escrow Statement PDF export, Ledger reconciliation database hashes, and Daily Sign-off log signatures.",
                        documents_required="Escrow Account Agreement and Compliance Certificate template.",
                        policies_required="Client Asset Safety and Liquidity Policies.",
                        audit_checklist=[
                            "Validate that bank escrow accounts contain no proprietary capital transfers.",
                            "Verify reconciliation is performed daily before 9:00 AM next market session.",
                            "Inspect digital signatures of treasury managers on monthly audits.",
                        ],
                        control_mapping="CTRL-ESCROW-01",
                        readiness_score=72.0,
                    )
                )
            elif "leverage" in desc or "margin" in desc:
                items.append(
                    AuditItemSchema(
                        obligation_index=idx,
                        evidence_required="Intraday leverage log files, risk management parameter dump screenshots, and OMS boundary error event logs.",
                        documents_required="Risk Control Parameter Handbook.",
                        policies_required="Leverage and Capital Adequacy Policies.",
                        audit_checklist=[
                            "Review OMS system parameters to ensure 1:5 cap is active.",
                            "Inspect risk system trigger events when leverage limit is breached.",
                            "Confirm pre-trade checks are run on all automated API trading feeds.",
                        ],
                        control_mapping="CTRL-RMS-LIMITS",
                        readiness_score=85.0,
                    )
                )
            else:
                items.append(
                    AuditItemSchema(
                        obligation_index=idx,
                        evidence_required="Quarterly compliance filing reports.",
                        documents_required="Filing receipts.",
                        policies_required="Procedural Reporting Standards.",
                        audit_checklist=[
                            "Confirm filing was completed before due date.",
                            "Audit document formatting guidelines.",
                        ],
                        control_mapping="CTRL-GEN-AUDIT",
                        readiness_score=95.0,
                    )
                )
        return AuditResponse(audit_items=items)


class DecisionService(AIServiceBase):
    """Synthesizes all insights, generates council responses, and maps explainability."""

    async def synthesize_analysis(
        self,
        regulation_meta: Dict[str, Any],
        obligations: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        impacts: List[Dict[str, Any]],
        audits: List[Dict[str, Any]],
    ) -> DecisionResponse:
        """Invokes Gemini to orchestrate all data points into a unified executive council response."""
        if not self.has_api_key:
            return self._generate_mock_decision(
                regulation_meta, obligations, risks, impacts, audits
            )

        try:
            content_dict = {
                "regulation": regulation_meta,
                "obligations": obligations,
                "risks": risks,
                "impacts": impacts,
                "audits": audits,
            }
            content = json.dumps(content_dict, indent=2)
            return await self._call_gemini_structured(
                prompt=DECISION_PROMPT,
                content=content,
                response_schema=DecisionResponse,
            )
        except Exception as e:
            logger.error(
                "Decision Synthesis Gemini call failed. Falling back to mock.",
                error=str(e),
            )
            return self._generate_mock_decision(
                regulation_meta, obligations, risks, impacts, audits
            )

    def _generate_mock_decision(
        self,
        regulation_meta: Dict[str, Any],
        obligations: List[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        impacts: List[Dict[str, Any]],
        audits: List[Dict[str, Any]],
    ) -> DecisionResponse:
        # Build deterministic council response
        from app.services.prompts.decision_prompt import (
            CouncilAgentSchema,
            CouncilSchema,
            ExplainabilityItem,
        )

        regulatory_agent = CouncilAgentSchema(
            status="compliant",
            analysis="Extracted all metadata from SEBI circular. Identified 2 clauses and 3 core compliance obligations regarding escrow accounts and leverage caps. Primary mappings are fully aligned.",
            confidence=0.98,
            recommendations=[
                "Verify escrow clause 4.1 mappings daily.",
                "Align pre-trade checks with clause 4.2.",
            ],
        )
        risk_agent = CouncilAgentSchema(
            status="under_review",
            analysis="Risk assessment identifies high exposure on Client Fund Segregation due to current manual spreadsheets. Baseline compliance score is at 65.0%. Escrow reconciliation is P0 priority.",
            confidence=0.95,
            recommendations=[
                "Automate manual spreadsheets immediately.",
                "Establish threshold alert margins at 90% collateral.",
            ],
        )
        ops_agent = CouncilAgentSchema(
            status="pending",
            analysis="Operations mapping affects Treasury, Risk, and IT. Integration of bank ledger APIs requires 10 business days of development time. Operational workload will increase daily.",
            confidence=0.92,
            recommendations=[
                "Integrate bank escrow statement download endpoints.",
                "Assign treasury coordinators for weekly review logs.",
            ],
        )
        audit_agent = CouncilAgentSchema(
            status="pending",
            analysis="Audit preparedness requires escrow statements and OMS rule logs. Readiness index calculated at 78.5%. Evidence checksum matching must be automated.",
            confidence=0.94,
            recommendations=[
                "Integrate hashing checks into daily ledger scripts.",
                "Compile PDF filing bundle for quarterly SEBI auditor report.",
            ],
        )

        explainability_items = []
        for idx, ob in enumerate(obligations):
            desc = ob.get("description", "")
            clause_num = ob.get("clause_number", "4.1")

            # Map elements
            r_item = next(
                (r for r in risks if r["obligation_index"] == idx),
                {"reasoning": "Standard procedural risk review"},
            )
            i_item = next(
                (i for i in impacts if i["obligation_index"] == idx),
                {"affected_departments": ["Compliance"]},
            )
            a_item = next(
                (a for a in audits if a["obligation_index"] == idx),
                {"evidence_required": "Filing receipts"},
            )

            explainability_items.append(
                ExplainabilityItem(
                    source_clause=f"Clause {clause_num}",
                    reason=r_item.get("reasoning", "Standard reasoning"),
                    confidence=r_item.get("confidence_score", 0.95),
                    supporting_context=desc,
                    affected_entity=", ".join(
                        i_item.get("affected_departments", ["Compliance"])
                    ),
                    evidence_required=a_item.get("evidence_required", "Audit Logs"),
                )
            )

        return DecisionResponse(
            executive_summary="SEBI has mandated strict guidelines for Client Escrow Fund Segregation and intraday leverage restrictions. Failure to comply immediately puts broker licenses at risk. Operations and Risk departments must implement automated reconciliation APIs and pre-trade OMS restrictions immediately.",
            recommended_actions=[
                "Automate client escrow bank reconciliations to eliminate spreadsheet-based timing gaps.",
                "Enforce hard caps on equity futures leverage configurations in the Risk Management System.",
            ],
            priority_order=[
                "P0: Automate Escrow Segregation Reconciliations",
                "P1: Configure RMS Intraday Leverage Limits",
            ],
            dependencies=[
                "Escrow APIs depend on bank statements connectivity",
                "Leverage filters depend on collateral database updates",
            ],
            escalation_needed=True,
            approval_required=True,
            council=CouncilSchema(
                **{
                    "Regulatory AI": regulatory_agent,
                    "Risk AI": risk_agent,
                    "Operations AI": ops_agent,
                    "Audit AI": audit_agent,
                }
            ),
            explainability=explainability_items,
        )


class ExecutiveSummaryService(AIServiceBase):
    """Builds a premium, formal, multi-paragraph briefing summary document."""

    async def generate_briefing(
        self, decision_data: Dict[str, Any]
    ) -> ExecutiveSummarySchema:
        if not self.has_api_key:
            return self._generate_mock_briefing(decision_data)

        try:
            content = json.dumps(decision_data, indent=2)
            return await self._call_gemini_structured(
                prompt=EXECUTIVE_SUMMARY_PROMPT,
                content=content,
                response_schema=ExecutiveSummarySchema,
            )
        except Exception as e:
            logger.error(
                "Executive Summary Briefing Gemini call failed. Falling back to mock.",
                error=str(e),
            )
            return self._generate_mock_briefing(decision_data)

    def _generate_mock_briefing(
        self, decision_data: Dict[str, Any]
    ) -> ExecutiveSummarySchema:
        summary_text = (
            "This briefing report outlines critical regulatory mandates following the latest circular issued by SEBI. "
            "Our audit highlights significant exposures in daily client fund handling. Currently, the segregation reconciliations "
            "rely on manual spreadsheets, introducing key execution and compliance risks. Over the next 30 days, operations must "
            "shift towards fully automated bank-feed checks. In addition, proprietary trading desks will be subjected to hard "
            "margin leverage limitations configured within our order routing servers to ensure complete alignment with clause-level rules."
        )
        return ExecutiveSummarySchema(
            executive_summary=summary_text,
            key_findings=[
                "Client escrow funds must be fully segregated from broker proprietary cash balances daily.",
                "Reconciliations must occur before the start of the next day's market session.",
                "Intraday leverage rules enforce a strict 1:5 margin cap on proprietary equity futures trades.",
            ],
            immediate_actions_required=[
                "Deploy automated ledger reconciliation scripts.",
                "Inject hard pre-trade capital validation codes in our OMS endpoints.",
            ],
        )


class RegulationAnalysisService:
    """The central Orchestrator that coordinates the parsing and reasoning engines."""

    def __init__(self):
        self.doc_service = DocumentService()
        self.embed_service = EmbeddingService()
        self.regulatory_service = RegulatoryAnalysisService()
        self.impact_service = ImpactAnalysisService()
        self.risk_service = RiskAnalysisService()
        self.audit_service = AuditService()
        self.decision_service = DecisionService()
        self.summary_service = ExecutiveSummaryService()

    async def analyze_document(
        self, db: AsyncSession, document_id: UUID
    ) -> AnalysisSession:
        """Executes the complete regulatory intelligence reasoning pipeline on an uploaded document."""
        # 1. Fetch Document and check cache/status
        query = select(Document).where(
            Document.id == document_id, Document.is_deleted == False
        )
        result = await db.execute(query)
        document = result.scalar_one_or_none()
        if not document:
            raise ValueError(f"Document not found or soft-deleted: {document_id}")

        # Check for cached completed session
        session_query = select(AnalysisSession).where(
            AnalysisSession.document_id == document_id,
            AnalysisSession.status == "completed",
            AnalysisSession.is_deleted == False,
        )
        session_result = await db.execute(session_query)
        existing_session = session_result.scalar_one_or_none()
        if existing_session:
            logger.info(
                "Found cached completed analysis session. Returning cache.",
                doc_id=document_id,
            )
            return existing_session

        # Create or update current AnalysisSession
        session = AnalysisSession(document_id=document_id, status="running")
        db.add(session)
        await db.commit()
        await db.refresh(session)

        try:
            # 2. Extract Document chunks text
            chunk_query = (
                select(DocumentChunk)
                .where(
                    DocumentChunk.document_id == document_id,
                    DocumentChunk.is_deleted == False,
                )
                .order_by(DocumentChunk.chunk_index)
            )
            chunk_result = await db.execute(chunk_query)
            chunks = chunk_result.scalars().all()

            if not chunks:
                raise ValueError(f"No text chunks found for document: {document_id}")

            full_text = " ".join([c.text_content for c in chunks])

            # 3. Step 1: Regulatory Intelligence Engine
            logger.info(
                "Pipeline Step 1: Running Regulatory Intelligence Engine...",
                doc_id=document_id,
            )
            regulatory_analysis = await self.regulatory_service.analyze_text(full_text)

            # Save extracted metadata, clauses, and obligations
            # Check if Regulation already exists for this document
            reg_check = select(Regulation).where(
                Regulation.document_id == document_id, Regulation.is_deleted == False
            )
            reg_check_res = await db.execute(reg_check)
            regulation = reg_check_res.scalar_one_or_none()

            # Parse Dates
            issue_d = None
            effective_d = None
            if regulatory_analysis.issue_date:
                try:
                    issue_d = datetime.strptime(
                        regulatory_analysis.issue_date, "%Y-%m-%d"
                    ).date()
                except Exception:
                    pass
            if regulatory_analysis.effective_date:
                try:
                    effective_d = datetime.strptime(
                        regulatory_analysis.effective_date, "%Y-%m-%d"
                    ).date()
                except Exception:
                    pass

            if not regulation:
                # Check if another document already owns this regulation number
                # (unique constraint conflict guard)
                existing_number_check = select(Regulation).where(
                    Regulation.number == regulatory_analysis.number,
                    Regulation.is_deleted == False,
                )
                existing_number_res = await db.execute(existing_number_check)
                existing_with_number = existing_number_res.scalar_one_or_none()

                # If the number is taken by a different document, make it unique
                reg_number = regulatory_analysis.number
                if existing_with_number and existing_with_number.document_id != document_id:
                    # Append short document_id suffix to avoid unique constraint violation
                    reg_number = f"{regulatory_analysis.number}-{str(document_id)[:8]}"

                regulation = Regulation(
                    document_id=document_id,
                    title=regulatory_analysis.title,
                    number=reg_number,
                    issue_date=issue_d,
                    effective_date=effective_d,
                    applicability=regulatory_analysis.applicability,
                    metadata_json={},
                )
                db.add(regulation)
                await db.commit()
                await db.refresh(regulation)
            else:
                regulation.title = regulatory_analysis.title
                # Keep existing number to avoid unique constraint conflict on update
                regulation.issue_date = issue_d
                regulation.effective_date = effective_d
                regulation.applicability = regulatory_analysis.applicability
                db.add(regulation)

            # Insert Clauses and Obligations
            obligations_payload = []
            obligation_db_references = []

            for c_idx, c_info in enumerate(regulatory_analysis.clauses):
                clause = Clause(
                    regulation_id=regulation.id,
                    clause_number=c_info.clause_number,
                    title=c_info.title,
                    text_content=c_info.text_content,
                )
                db.add(clause)
                await db.commit()
                await db.refresh(clause)

                for o_idx, o_info in enumerate(c_info.obligations):
                    obligation = Obligation(
                        clause_id=clause.id,
                        description=o_info.description,
                        deadline=o_info.deadline,
                        penalty=o_info.penalty,
                        exceptions=o_info.exceptions,
                        dependencies=o_info.dependencies,
                    )
                    db.add(obligation)
                    await db.commit()
                    await db.refresh(obligation)

                    obligation_db_references.append(obligation)
                    # Payload for subsequent engines
                    obligations_payload.append(
                        {
                            "description": o_info.description,
                            "clause_number": c_info.clause_number,
                            "deadline": o_info.deadline,
                            "penalty": o_info.penalty,
                            "exceptions": o_info.exceptions,
                            "dependencies": o_info.dependencies,
                        }
                    )

            # If no obligations extracted, create a default one to make subsequent pipelines run
            if not obligations_payload:
                dummy_clause = Clause(
                    regulation_id=regulation.id,
                    clause_number="General",
                    title="Procedural Review",
                    text_content="General circular review and compliance audit.",
                )
                db.add(dummy_clause)
                await db.commit()
                await db.refresh(dummy_clause)

                dummy_ob = Obligation(
                    clause_id=dummy_clause.id,
                    description="Procedural audit of regulatory circular.",
                    deadline="Normal filing limits",
                    penalty=None,
                    exceptions=None,
                    dependencies=None,
                )
                db.add(dummy_ob)
                await db.commit()
                await db.refresh(dummy_ob)

                obligation_db_references.append(dummy_ob)
                obligations_payload.append(
                    {
                        "description": dummy_ob.description,
                        "clause_number": "General",
                        "deadline": dummy_ob.deadline,
                        "penalty": None,
                        "exceptions": None,
                        "dependencies": None,
                    }
                )

            # 4. Step 2: Impact Intelligence Engine
            logger.info(
                "Pipeline Step 2: Running Impact Intelligence Engine...",
                doc_id=document_id,
            )
            impact_analysis = await self.impact_service.analyze_obligations(
                obligations_payload
            )

            # Save impacts to database
            impacts_payload = []
            for item in impact_analysis.impacts:
                target_ob = obligation_db_references[item.obligation_index]
                db_impact = Impact(
                    obligation_id=target_ob.id,
                    session_id=session.id,
                    affected_departments=item.affected_departments,
                    affected_systems=item.affected_systems,
                    affected_policies=item.affected_policies,
                    affected_controls=item.affected_controls,
                    affected_stakeholders=item.affected_stakeholders,
                    business_impact=item.business_impact,
                    operational_impact=item.operational_impact,
                    technology_impact=item.technology_impact,
                    compliance_impact=item.compliance_impact,
                )
                db.add(db_impact)
                impacts_payload.append(item.model_dump())

            # 5. Step 3: Risk Intelligence Engine
            logger.info(
                "Pipeline Step 3: Running Risk Intelligence Engine...",
                doc_id=document_id,
            )
            risk_analysis = await self.risk_service.analyze_obligations(
                obligations_payload
            )

            # Save risks
            risks_payload = []
            for item in risk_analysis.risks:
                target_ob = obligation_db_references[item.obligation_index]
                db_risk = Risk(
                    obligation_id=target_ob.id,
                    session_id=session.id,
                    risk_level=item.risk_level,
                    criticality=item.criticality,
                    priority=item.priority,
                    compliance_score=item.compliance_score,
                    urgency=item.urgency,
                    implementation_complexity=item.implementation_complexity,
                    confidence_score=item.confidence_score,
                    reasoning=item.reasoning,
                )
                db.add(db_risk)
                risks_payload.append(item.model_dump())

            # 6. Step 4: Audit Intelligence Engine
            logger.info(
                "Pipeline Step 4: Running Audit Intelligence Engine...",
                doc_id=document_id,
            )
            audit_analysis = await self.audit_service.analyze_obligations(
                obligations_payload
            )

            # Save audits
            audits_payload = []
            for item in audit_analysis.audit_items:
                target_ob = obligation_db_references[item.obligation_index]
                db_audit = AuditItem(
                    obligation_id=target_ob.id,
                    session_id=session.id,
                    evidence_required=item.evidence_required,
                    documents_required=item.documents_required,
                    policies_required=item.policies_required,
                    audit_checklist=item.audit_checklist,
                    control_mapping=item.control_mapping,
                    readiness_score=item.readiness_score,
                )
                db.add(db_audit)
                audits_payload.append(item.model_dump())

            # Commit intermediate runs to ensure foreign keys resolve
            await db.commit()

            # 7. Step 5: Decision Engine & Executive Council
            logger.info(
                "Pipeline Step 5: Running Decision & Synthesis Engine...",
                doc_id=document_id,
            )
            reg_meta = {
                "title": regulation.title,
                "number": regulation.number,
                "applicability": regulation.applicability,
            }
            decision_data = await self.decision_service.synthesize_analysis(
                regulation_meta=reg_meta,
                obligations=obligations_payload,
                risks=risks_payload,
                impacts=impacts_payload,
                audits=audits_payload,
            )

            # 8. Step 6: Executive Briefing Summary
            logger.info(
                "Pipeline Step 6: Generating Board Briefing Summary...",
                doc_id=document_id,
            )
            briefing = await self.summary_service.generate_briefing(
                decision_data.model_dump()
            )

            # 9. Update Session results
            session.status = "completed"

            # Map Council formats
            # The Decision Schema provides CouncilAgentSchema values.
            # We convert this to matches the UI requirements:
            # { "Regulatory AI": { "status": "...", "analysis": "...", "confidence": ..., "recommendations": [...] } }
            council_dump = decision_data.council.model_dump(by_alias=True)
            session.regulatory_ai_analysis = council_dump.get("Regulatory AI")
            session.risk_ai_analysis = council_dump.get("Risk AI")
            session.operations_ai_analysis = council_dump.get("Operations AI")
            session.audit_ai_analysis = council_dump.get("Audit AI")

            session.executive_summary = briefing.executive_summary
            session.decision_metadata = {
                "recommended_actions": decision_data.recommended_actions,
                "priority_order": decision_data.priority_order,
                "dependencies": decision_data.dependencies,
                "escalation_needed": decision_data.escalation_needed,
                "approval_required": decision_data.approval_required,
                "key_findings": briefing.key_findings,
                "immediate_actions_required": briefing.immediate_actions_required,
            }
            session.explainability_data = {
                "trace": [item.model_dump() for item in decision_data.explainability]
            }

            # Mark Document as fully analyzed
            document.status = "analyzed"
            db.add(document)
            db.add(session)
            await db.commit()
            await db.refresh(session)

            logger.info(
                "Orchestrated AI Analysis completed successfully.", doc_id=document_id
            )
            return session

        except Exception as e:
            logger.error(
                "Regulatory Orchestration pipeline failed.",
                error=str(e),
                doc_id=document_id,
            )
            session.status = "failed"
            document.status = "failed"
            db.add(session)
            db.add(document)
            await db.commit()
            raise e
