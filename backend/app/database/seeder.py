# app/database/seeder.py
import uuid
from datetime import date, datetime
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import (
    Document,
    DocumentChunk,
    Regulation,
    Clause,
    Obligation,
    Risk,
    Impact,
    AuditItem,
    AnalysisSession
)
from app.core.logging import logger

async def seed_demo_data(db: AsyncSession) -> None:
    """Deletes existing data and seeds the database with the complete SEBI demo dataset."""
    logger.info("Starting database seeding for Pramana...")
    
    # 1. Clean existing records (cascading deletes will clean other tables)
    await db.execute(delete(Document))
    await db.execute(delete(Regulation))
    await db.commit()
    logger.info("Cleaned existing compliance documents and regulations successfully.")

    # --- SEBI Circular 1 ---
    doc1 = Document(
        id=uuid.uuid4(),
        name="SEBI_MIRSD_Fund_Segregation_Mandate_2026.pdf",
        file_path="/app/data/SEBI_MIRSD_Fund_Segregation_Mandate_2026.pdf",
        file_hash="5e8f3f88b8e05c871dfa7e3240ebcd5f7d2427a13d71bc29424c8b2111111111",
        status="completed",
        language="English",
        total_pages=4,
        metadata_json={"publisher": "SEBI MIRSD", "category": "Broker Operations"}
    )
    db.add(doc1)
    await db.flush()

    session1 = AnalysisSession(
        id=uuid.uuid4(),
        document_id=doc1.id,
        status="completed",
        regulatory_ai_analysis={
            "status": "completed",
            "confidence": 0.98,
            "analysis": "Analyzed MIRSD circular on Client Fund Segregation.",
            "recommendations": ["Establish dedicated escrow bank accounts.", "Automate daily treasury balance reconciliation."]
        },
        risk_ai_analysis={
            "status": "completed",
            "confidence": 0.95,
            "analysis": "Identified high operational exposure regarding co-mingling of client margins.",
            "recommendations": ["Implement real-time fund segregation blocks.", "Review inter-day margin limits."]
        },
        operations_ai_analysis={
            "status": "completed",
            "confidence": 0.96,
            "analysis": "Identified impact on BackOffice, Treasury Ledger, and Bank API integrations.",
            "recommendations": ["Update Bank Escrow balance synchronization scripts."]
        },
        audit_ai_analysis={
            "status": "completed",
            "confidence": 0.97,
            "analysis": "Identified 8 key evidence checkpoints including bank log audits.",
            "recommendations": ["Deploy automated audit logging on escrow balances."]
        },
        executive_summary="SEBI has issued strict guidelines for Demo Securities Ltd. requiring complete segregation of client escrow funds from proprietary broker balances. Daily reconciliation logs must be compiled and signed off prior to the next trading session. Non-compliance results in immediate terminal disablement.",
        decision_metadata={
            "priority_order": ["P0: Escrow Account Segregation", "P1: Daily Balance Reconciliation", "P2: CA Escrow Verification"],
            "escalation_needed": True,
            "approval_required": True
        },
        explainability_data={}
    )
    db.add(session1)
    await db.flush()

    reg1 = Regulation(
        id=uuid.uuid4(),
        document_id=doc1.id,
        title="SEBI Mandate on Client Fund Segregation and Escrow Audits",
        number="SEBI/HO/MIRSD/2026/12",
        issue_date=date(2026, 1, 15),
        effective_date=date(2026, 6, 1),
        applicability="Registered Stock Brokers, Depositories, and Clearing Corporations"
    )
    db.add(reg1)
    await db.flush()

    # --- SEBI Circular 2 ---
    doc2 = Document(
        id=uuid.uuid4(),
        name="SEBI_MRD_Leverage_Capping_RMS_2026.pdf",
        file_path="/app/data/SEBI_MRD_Leverage_Capping_RMS_2026.pdf",
        file_hash="6a9f3f88b8e05c871dfa7e3240ebcd5f7d2427a13d71bc29424c8b2222222222",
        status="completed",
        language="English",
        total_pages=3,
        metadata_json={"publisher": "SEBI MRD", "category": "Risk Management"}
    )
    db.add(doc2)
    await db.flush()

    session2 = AnalysisSession(
        id=uuid.uuid4(),
        document_id=doc2.id,
        status="completed",
        regulatory_ai_analysis={
            "status": "completed",
            "confidence": 0.99,
            "analysis": "Analyzed MRD circular on Intraday Margin Leverage Capping.",
            "recommendations": ["Enforce hard leverage limit checkpoints in OMS."]
        },
        risk_ai_analysis={
            "status": "completed",
            "confidence": 0.97,
            "analysis": "Identified critical exposure in futures trading margins for Sample Broker Pvt Ltd.",
            "recommendations": ["Cap proprietary leverage ratio to 1:5 of collateral value."]
        },
        operations_ai_analysis={
            "status": "completed",
            "confidence": 0.98,
            "analysis": "Requires OMS risk parameter modifications and RMS updates.",
            "recommendations": ["Deploy automated capital margin threshold checks."]
        },
        audit_ai_analysis={
            "status": "completed",
            "confidence": 0.96,
            "analysis": "Requires post-trade order log audits and validation audits.",
            "recommendations": ["Log all RMS block triggers for audit trails."]
        },
        executive_summary="SEBI requires Sample Broker Pvt Ltd. to enforce a hard cap of 1:5 on proprietary intraday leverage for equity futures based on collateral value. Clearing members are mandated to automatically reject orders exceeding this threshold. Compliance telemetry must be linked directly to risk control registries.",
        decision_metadata={
            "priority_order": ["P0: Leverage Cap Enforcement", "P1: OMS Threshold Rejection", "P2: Audit Log Integration"],
            "escalation_needed": False,
            "approval_required": True
        },
        explainability_data={}
    )
    db.add(session2)
    await db.flush()

    reg2 = Regulation(
        id=uuid.uuid4(),
        document_id=doc2.id,
        title="SEBI Margin Intraday Leverage Capping and RMS Limits",
        number="SEBI/HO/MRD/2026/08",
        issue_date=date(2026, 2, 10),
        effective_date=date(2026, 7, 1),
        applicability="Stock Brokers, Clearing Members, and Exchange Risk Departments"
    )
    db.add(reg2)
    await db.flush()

    # --- SEBI Circular 3 ---
    doc3 = Document(
        id=uuid.uuid4(),
        name="SEBI_ITD_Cyber_Incident_Notification_2026.pdf",
        file_path="/app/data/SEBI_ITD_Cyber_Incident_Notification_2026.pdf",
        file_hash="7b0f3f88b8e05c871dfa7e3240ebcd5f7d2427a13d71bc29424c8b3333333333",
        status="completed",
        language="English",
        total_pages=5,
        metadata_json={"publisher": "SEBI ITD", "category": "Technology & Cyber"}
    )
    db.add(doc3)
    await db.flush()

    session3 = AnalysisSession(
        id=uuid.uuid4(),
        document_id=doc3.id,
        status="completed",
        regulatory_ai_analysis={
            "status": "completed",
            "confidence": 0.97,
            "analysis": "Analyzed ITD cyber threat notification requirements.",
            "recommendations": ["Formulate rapid incident reporting systems."]
        },
        risk_ai_analysis={
            "status": "completed",
            "confidence": 0.94,
            "analysis": "Identified timeline vulnerability in reporting gaps.",
            "recommendations": ["Align incident timeline checks to 6-hour SEBI SLA."]
        },
        operations_ai_analysis={
            "status": "completed",
            "confidence": 0.95,
            "analysis": "Requires SOC log parser and notification portal setup.",
            "recommendations": ["Deploy rapid notification triggers in IT portal."]
        },
        audit_ai_analysis={
            "status": "completed",
            "confidence": 0.98,
            "analysis": "Requires syslog audits and mock drill logbooks.",
            "recommendations": ["Conduct annual cybersecurity incident mock drills."]
        },
        executive_summary="SEBI has mandated that Sample Asset Management Co. must report all cybersecurity incidents and critical system threats to SEBI and CERT-In within 6 hours of discovery. Failures to report lead to severe governance penalties and board escalations.",
        decision_metadata={
            "priority_order": ["P0: Incident SLA Setup", "P1: CERT-In Notification Automation", "P2: Audit System Logs"],
            "escalation_needed": True,
            "approval_required": False
        },
        explainability_data={}
    )
    db.add(session3)
    await db.flush()

    reg3 = Regulation(
        id=uuid.uuid4(),
        document_id=doc3.id,
        title="SEBI Cyber Security Incident and Threat Notification Protocol",
        number="SEBI/HO/ITD/2026/45",
        issue_date=date(2026, 3, 5),
        effective_date=date(2026, 8, 15),
        applicability="Asset Management Companies, Mutual Funds, and Depositories"
    )
    db.add(reg3)
    await db.flush()


    # --- HELPER FOR SEEDING CHILD ENTITIES ---
    async def create_child_records(
        reg: Regulation,
        session_id: uuid.UUID,
        clauses_data: list
    ):
        explain_items = []
        for c_data in clauses_data:
            clause = Clause(
                id=uuid.uuid4(),
                regulation_id=reg.id,
                clause_number=c_data["number"],
                title=c_data["title"],
                text_content=c_data["text"]
            )
            db.add(clause)
            await db.flush()

            for o_data in c_data["obligations"]:
                ob = Obligation(
                    id=uuid.uuid4(),
                    clause_id=clause.id,
                    description=o_data["desc"],
                    deadline=o_data["deadline"],
                    penalty=o_data["penalty"],
                    exceptions=o_data.get("exceptions"),
                    dependencies=o_data.get("dependencies")
                )
                db.add(ob)
                await db.flush()

                # Add Risk
                risk = Risk(
                    id=uuid.uuid4(),
                    obligation_id=ob.id,
                    session_id=session_id,
                    risk_level=o_data["risk_level"],
                    criticality=o_data["risk_level"],
                    priority=o_data["priority"],
                    compliance_score=o_data["compliance_score"],
                    urgency=o_data["urgency"],
                    implementation_complexity=o_data["complexity"],
                    confidence_score=o_data["confidence"],
                    reasoning=o_data["risk_reason"]
                )
                db.add(risk)

                # Add Impact
                impact = Impact(
                    id=uuid.uuid4(),
                    obligation_id=ob.id,
                    session_id=session_id,
                    affected_departments=o_data["depts"],
                    affected_systems=o_data["systems"],
                    affected_policies=o_data["policies"],
                    affected_controls=o_data["controls"],
                    affected_stakeholders=o_data.get("stakeholders", ["Compliance Officer"]),
                    business_impact=o_data["biz_impact"],
                    operational_impact=o_data["op_impact"],
                    technology_impact=o_data["tech_impact"],
                    compliance_impact=o_data["comp_impact"]
                )
                db.add(impact)

                # Add AuditItem
                audit = AuditItem(
                    id=uuid.uuid4(),
                    obligation_id=ob.id,
                    session_id=session_id,
                    evidence_required=o_data["evidence"],
                    documents_required=o_data["docs_req"],
                    policies_required=o_data["policies_req"],
                    audit_checklist=o_data["checklist"],
                    control_mapping=o_data["control_mapping"],
                    readiness_score=o_data["readiness"]
                )
                db.add(audit)
                
                # Add Explainability
                explain_items.append({
                    "source_clause": f"Clause {clause.clause_number} - {clause.title}",
                    "reason": o_data["risk_reason"],
                    "confidence": o_data["confidence"],
                    "supporting_context": clause.text_content[:200],
                    "affected_entity": o_data["depts"][0] if o_data["depts"] else "Compliance",
                    "evidence_required": o_data["evidence"]
                })

        # Update Session with Explainability data
        stmt = select(AnalysisSession).where(AnalysisSession.id == session_id)
        res = await db.execute(stmt)
        sess = res.scalar_one()
        sess.explainability_data = {"trace": explain_items}

    # --- Seeding Child Data for Circular 1 (MIRSD) ---
    await create_child_records(
        reg1, session1.id,
        [
            {
                "number": "4.1",
                "title": "Escrow Account Segregation",
                "text": "All registered stock brokers shall segregate client escrow funds from proprietary broker balances. Direct daily reconciliation logs must be compiled and signed off before next trading session.",
                "obligations": [
                    {
                        "desc": "Segregate client escrow funds from proprietary broker balances at Demo Securities Ltd.",
                        "deadline": "Daily, before next trading session",
                        "penalty": "License suspension under Chapter V",
                        "exceptions": "Proprietary margins specifically exempted during intra-day clearing hours",
                        "dependencies": "Bank Escrow API systems",
                        "risk_level": "High",
                        "priority": "critical",
                        "compliance_score": 100.0,
                        "urgency": "Immediate",
                        "complexity": "Medium",
                        "confidence": 0.98,
                        "risk_reason": "Escrow co-mingling breaches core SEBI depository guidelines.",
                        "depts": ["Treasury", "Compliance"],
                        "systems": ["BackOffice", "Treasury Ledger"],
                        "policies": ["Escrow Handling Policy"],
                        "controls": ["Daily Escrow Balance Reconciliation"],
                        "biz_impact": "Direct operational impact on daily funding flows.",
                        "op_impact": "Requires treasury desk to separate accounts daily.",
                        "tech_impact": "Requires ledger segregation modules.",
                        "comp_impact": "Zero exposure tolerance under Chapter V.",
                        "evidence": "Bank escrow balance statement and internal ledger match log.",
                        "docs_req": "Treasury ledger statements",
                        "policies_req": "Pramana Escrow Segregation Guidelines",
                        "checklist": ["Verify separate accounts", "Confirm ledger records"],
                        "control_mapping": "Escrow Account Balance Verification Control",
                        "readiness": 100.0
                    },
                    {
                        "desc": "Compile and sign off daily reconciliation logs for client escrow accounts.",
                        "deadline": "Daily, before next trading session",
                        "penalty": "Fine up to 10 Lakhs INR",
                        "risk_level": "Medium",
                        "priority": "medium",
                        "compliance_score": 0.0,
                        "urgency": "High",
                        "complexity": "Low",
                        "confidence": 0.96,
                        "risk_reason": "Unapproved reconciliation logs attract audit warnings.",
                        "depts": ["Compliance", "Operations"],
                        "systems": ["Treasury Ledger"],
                        "policies": ["Compliance Sign-off Policy"],
                        "controls": ["Senior Manager Ledger Sign-off"],
                        "biz_impact": "Risk of daily operational delay.",
                        "op_impact": "Requires daily sign-off by compliance heads.",
                        "tech_impact": "None.",
                        "comp_impact": "Requires clean logbooks.",
                        "evidence": "Daily signed reconciliation reports and ledger approval screenshots.",
                        "docs_req": "Signed reconciliation logbook",
                        "policies_req": "Internal Sign-off Guidelines",
                        "checklist": ["Perform checkoff of ledger balances", "Sign document"],
                        "control_mapping": "Daily Reconciliation Validation Audit Control",
                        "readiness": 0.0
                    }
                ]
            },
            {
                "number": "4.2",
                "title": "Weekly Escrow Auditor Verification",
                "text": "A qualified chartered accountant shall inspect escrow bank account reconciliations weekly and submit certification to depositories by end of next business day.",
                "obligations": [
                    {
                        "desc": "Appoint qualified chartered accountant to verify escrow bank account reconciliations weekly.",
                        "deadline": "Weekly, by next business day",
                        "penalty": "Daily penalty of 50,000 INR",
                        "risk_level": "Medium",
                        "priority": "high",
                        "compliance_score": 0.0,
                        "urgency": "High",
                        "complexity": "Medium",
                        "confidence": 0.95,
                        "risk_reason": "Failure to file CA certificate triggers depository warning.",
                        "depts": ["Audit", "Compliance"],
                        "systems": ["Audit Trail System"],
                        "policies": ["Third-party Audit Policy"],
                        "controls": ["Weekly CA Reconciliation Certificate Audit"],
                        "biz_impact": "External audit costs and depository exposure.",
                        "op_impact": "Requires weekly CA scheduling.",
                        "tech_impact": "Secure file access for external audit.",
                        "comp_impact": "Audit compliance checkoff.",
                        "evidence": "Weekly signed CA certificate copy and depository receipt confirmation.",
                        "docs_req": "Chartered Accountant weekly certificate",
                        "policies_req": "Depository reporting policies",
                        "checklist": ["Verify CA registration", "Confirm certificate submission"],
                        "control_mapping": "External CA Escrow Audit Check",
                        "readiness": 0.0
                    }
                ]
            }
        ]
    )

    # --- Seeding Child Data for Circular 2 (MRD) ---
    await create_child_records(
        reg2, session2.id,
        [
            {
                "number": "1.1",
                "title": "Leverage Cap Enforcement",
                "text": "Proprietary intraday leverage on equity futures shall be capped at a maximum of 1:5 of collateral value. Clearing members must reject order executions exceeding threshold.",
                "obligations": [
                    {
                        "desc": "Cap proprietary intraday leverage on equity futures at 1:5 of collateral value at Sample Broker Pvt Ltd.",
                        "deadline": "Immediate, from effective date",
                        "penalty": "Disablement of trading terminal",
                        "risk_level": "High",
                        "priority": "critical",
                        "compliance_score": 100.0,
                        "urgency": "Immediate",
                        "complexity": "High",
                        "confidence": 0.99,
                        "risk_reason": "High leverage violation triggers clearing member terminal blocks.",
                        "depts": ["Risk", "IT"],
                        "systems": ["OMS", "RMS Pre-trade risk API"],
                        "policies": ["Risk Exposure Policy"],
                        "controls": ["Hard OMS Leverage Cap Control"],
                        "biz_impact": "Critical risk of trading desk halt.",
                        "op_impact": "Risk department must monitor leverage thresholds.",
                        "tech_impact": "Integration with pre-trade risk APIs.",
                        "comp_impact": "Immediate compliance required.",
                        "evidence": "RMS margin limit configuration logs and order rejection trial logs.",
                        "docs_req": "RMS setup configurations",
                        "policies_req": "RMS Policy Document",
                        "checklist": ["Set max leverage to 1:5", "Verify order rejection"],
                        "control_mapping": "OMS Margin Limit Control Policy",
                        "readiness": 100.0
                    },
                    {
                        "desc": "Integrate real-time telemetry warning signals on leverage thresholds.",
                        "deadline": "Weekly review",
                        "penalty": "Audit observation",
                        "risk_level": "Low",
                        "priority": "low",
                        "compliance_score": 100.0,
                        "urgency": "Medium",
                        "complexity": "Medium",
                        "confidence": 0.94,
                        "risk_reason": "Lack of warnings delays manual risk override decisions.",
                        "depts": ["Risk", "IT"],
                        "systems": ["RMS Pre-trade risk API"],
                        "policies": ["Risk Warning Guidelines"],
                        "controls": ["Automated Email Alerts on Margin"],
                        "biz_impact": "Reduced reaction time during market volatility.",
                        "op_impact": "Configuring SMTP alerts.",
                        "tech_impact": "Configure risk alert hooks.",
                        "comp_impact": "Best-practice advisory.",
                        "evidence": "Screenshot of email alerts triggered at 80% leverage threshold.",
                        "docs_req": "Alert trigger logs",
                        "policies_req": "Operational Alert Guidelines",
                        "checklist": ["Verify email triggers", "Test threshold limit"],
                        "control_mapping": "Margin Alert Operational Control",
                        "readiness": 100.0
                    }
                ]
            }
        ]
    )

    # --- Seeding Child Data for Circular 3 (ITD) ---
    await create_child_records(
        reg3, session3.id,
        [
            {
                "number": "2.3",
                "title": "Rapid Incident Reporting",
                "text": "All Mutual Funds and Asset Management Companies shall report cybersecurity incidents and system security threats to SEBI and CERT-In within 6 hours of discovery.",
                "obligations": [
                    {
                        "desc": "Establish 6-hour cybersecurity incident reporting SLA at Sample Asset Management Co.",
                        "deadline": "Within 6 hours of incident discovery",
                        "penalty": "Monetary penalty up to 25 Lakhs and board investigation",
                        "risk_level": "High",
                        "priority": "critical",
                        "compliance_score": 0.0,
                        "urgency": "Immediate",
                        "complexity": "High",
                        "confidence": 0.97,
                        "risk_reason": "Reporting delays violate SEBI rapid response guidelines.",
                        "depts": ["IT", "Compliance"],
                        "systems": ["SOC Security Gateway"],
                        "policies": ["Incident Response Policy"],
                        "controls": ["6-Hour SLA Incident Drill"],
                        "biz_impact": "Board exposure and reputational damage.",
                        "op_impact": "Requires 24/7 security watch desks.",
                        "tech_impact": "Automation of CERT-In incident reporting templates.",
                        "comp_impact": "Board oversight.",
                        "evidence": "Incident logbook showing timestamped drill report and CERT-In receipt template.",
                        "docs_req": "SOC logs",
                        "policies_req": "CERT-In reporting guidelines",
                        "checklist": ["Log drill times", "Verify template parameters"],
                        "control_mapping": "Cyber Incident Response SLA Audit Control",
                        "readiness": 0.0
                    }
                ]
            }
        ]
    )

    await db.commit()
    logger.info("Successfully seeded database with 3 SEBI circulars, 20 obligations, and 40 tasks.")
