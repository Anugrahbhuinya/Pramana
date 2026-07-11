// src/shared/utils/report-exporter.ts

interface ExporterMeta {
  title: string;
  number: string;
  issueDate?: string;
  effectiveDate?: string;
  applicability?: string;
}

const printWindowTemplate = (title: string, subtitle: string, meta: ExporterMeta, contentHtml: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocker active. Please allow popups to export compliance reports.");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,400&family=Fira+Code:wght@400;500&display=swap');
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #0f172a;
            padding: 40px;
            max-width: 850px;
            margin: 0 auto;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand-title {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #0f172a;
          }
          .brand-subtitle {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #10b981;
            font-weight: 700;
            margin-top: 2px;
          }
          .doc-meta {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .meta-val {
            font-weight: 600;
            color: #334155;
          }
          .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 16px;
            font-weight: 700;
          }
          .serif-block {
            font-family: 'Playfair Display', serif;
            font-size: 15px;
            background: #f8fafc;
            border-left: 3px solid #10b981;
            padding: 20px;
            border-radius: 0 6px 6px 0;
            margin-bottom: 25px;
            line-height: 1.6;
            color: #334155;
            font-style: italic;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          th, td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          th {
            background: #f1f5f9;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.05em;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            font-family: 'Inter', sans-serif;
          }
          .badge-compliant { background: #dcfce7 !important; color: #15803d !important; }
          .badge-pending { background: #fef3c7 !important; color: #b45309 !important; }
          .badge-critical { background: #fee2e2 !important; color: #b91c1c !important; }
          .badge-high { background: #ffedd5 !important; color: #c2410c !important; }
          .badge-medium { background: #f1f5f9 !important; color: #475569 !important; }
          
          .timeline-node {
            border-left: 2px solid #e2e8f0;
            padding-left: 20px;
            position: relative;
            margin-bottom: 25px;
          }
          .timeline-bullet {
            position: absolute;
            left: -7px;
            top: 4px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid #fff;
          }
          .timeline-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .timeline-text {
            font-size: 11px;
            color: #475569;
          }
          
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">PRAMANA</div>
            <div class="brand-subtitle">${subtitle}</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b; font-weight: 500;">
            <div>Report Generated: ${new Date().toLocaleDateString()}</div>
            <div>Pramana Compliance Registry Office</div>
          </div>
        </div>

        <div class="doc-meta">
          <div class="meta-item">
            <span class="meta-label">Regulation Title</span>
            <span class="meta-val">${meta.title}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Reference Number</span>
            <span class="meta-val">${meta.number}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Issue Date</span>
            <span class="meta-val">${meta.issueDate || "N/A"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Effective Date</span>
            <span class="meta-val">${meta.effectiveDate || "N/A"}</span>
          </div>
        </div>

        ${contentHtml}

        <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
          <span>Confidential — Internal Regulatory Intelligence Package</span>
          <span>Verified via Pramana Integrity Engine</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const exportExecutiveSummary = (session: any, summary: any) => {
  const meta: ExporterMeta = {
    title: session.regulation_title || "Regulatory Circular",
    number: session.regulation_number || "SEBI/Circular",
    issueDate: session.issue_date || "2026-01-15",
    effectiveDate: session.effective_date || "2026-06-01"
  };

  const actionsHtml = (summary.recommended_actions || [])
    .map((act: string, idx: number) => `
      <div style="margin-bottom: 12px; display: flex; font-size: 11px;">
        <span style="font-weight: 700; width: 24px; color: #10b981;">[${idx + 1}]</span>
        <span>${act}</span>
      </div>
    `).join("");

  const content = `
    <div class="section">
      <div class="section-title">Boardroom Synthesis Summary</div>
      <div class="serif-block">
        "${summary.executive_summary || "No executive summary parsed."}"
      </div>
    </div>

    <div class="section">
      <div class="section-title">Required Remediations</div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        ${actionsHtml || "<p style='font-size: 11px;'>No actions required.</p>"}
      </div>
    </div>
  `;

  printWindowTemplate(
    "Pramana Executive Summary Report",
    "Executive Compliance Summary",
    meta,
    content
  );
};

export const exportComplianceReport = (session: any, tasks: any[]) => {
  const meta: ExporterMeta = {
    title: session.regulation_title || "Regulatory Circular",
    number: session.regulation_number || "SEBI/Circular",
    issueDate: "2026-01-15",
    effectiveDate: "2026-06-01"
  };

  const rows = tasks.map(t => {
    const badgeClass = t.status === "compliant" ? "badge-compliant" : "badge-pending";
    const priorityClass = t.priority === "critical" ? "badge-critical" : t.priority === "high" ? "badge-high" : "badge-medium";
    return `
      <tr>
        <td style="font-weight: 600;">${t.task}</td>
        <td>${t.owner}</td>
        <td><span class="badge ${priorityClass}">${t.priority}</span></td>
        <td><span class="badge ${badgeClass}">${t.status}</span></td>
        <td>${t.dueDate || "Immediate"}</td>
      </tr>
    `;
  }).join("");

  const content = `
    <div class="section">
      <div class="section-title">Compliance Posture Overview</div>
      <p style="font-size: 12px; margin-bottom: 20px;">
        This document represents the official compliance status package compiled by the Pramana Platform.
      </p>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Control Checklist Action</th>
            <th>Owner Unit</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  printWindowTemplate(
    "Pramana Compliance Posture Audit Report",
    "Compliance Posture Report",
    meta,
    content
  );
};

export const exportExecutionBlueprint = (session: any, tasks: any[]) => {
  const meta: ExporterMeta = {
    title: session.regulation_title || "Regulatory Circular",
    number: session.regulation_number || "SEBI/Circular"
  };

  const rows = tasks.map(t => `
    <div style="border-bottom: 1px solid #e2e8f0; padding: 15px 0; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
        <span style="font-size: 12px; font-weight: 700; color: #0f172a;">${t.task}</span>
        <span class="badge ${t.status === "compliant" ? "badge-compliant" : "badge-pending"}">${t.status}</span>
      </div>
      <div style="display: grid; grid-template-cols: repeat(4, 1fr); gap: 10px; font-size: 10px; color: #64748b;">
        <div><strong>Owner Unit:</strong> ${t.owner}</div>
        <div><strong>Priority:</strong> ${t.priority}</div>
        <div><strong>Deadline:</strong> ${t.dueDate || "N/A"}</div>
        <div><strong>Dependencies:</strong> ${t.dependencies || "None"}</div>
      </div>
      <div style="margin-top: 8px; font-size: 10px; background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0;">
        <strong>Audit Evidence Required:</strong> ${t.evidence}
      </div>
    </div>
  `).join("");

  const content = `
    <div class="section">
      <div class="section-title">Execution Blueprint Task Checklist</div>
      <div style="margin-top: 10px;">
        ${rows}
      </div>
    </div>
  `;

  printWindowTemplate(
    "Pramana Execution Blueprint Report",
    "Execution Blueprint Plan",
    meta,
    content
  );
};

export const exportDecisionTraceability = (session: any, traces: any[]) => {
  const meta: ExporterMeta = {
    title: session.regulation_title || "Regulatory Circular",
    number: session.regulation_number || "SEBI/Circular"
  };

  const nodesHtml = traces.map((tr, idx) => `
    <div class="section" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #f8fafc; margin-bottom: 25px;">
      <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
        <span>Trace Point #${idx + 1}: ${tr.source_clause}</span>
        <span class="badge badge-compliant">${Math.round(tr.confidence * 100)}% Confidence Match</span>
      </div>
      
      <div class="timeline-node">
        <span class="timeline-bullet" style="background: #3b82f6;"></span>
        <div class="timeline-title">1. Regulatory Clause Node</div>
        <div class="timeline-text" style="font-family: 'Fira Code', monospace; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 10px; margin-top: 4px;">
          "${tr.supporting_context || tr.source_clause}"
        </div>
      </div>

      <div class="timeline-node">
        <span class="timeline-bullet" style="background: #f59e0b;"></span>
        <div class="timeline-title">2. AI Reasoning Path</div>
        <div class="timeline-text">${tr.reason}</div>
      </div>

      <div class="timeline-node">
        <span class="timeline-bullet" style="background: #a855f7;"></span>
        <div class="timeline-title">3. Evidentiary Audit Requirement</div>
        <div class="timeline-text" style="font-style: italic;">"${tr.evidence_required}"</div>
      </div>

      <div class="timeline-node" style="margin-bottom: 0;">
        <span class="timeline-bullet" style="background: #10b981;"></span>
        <div class="timeline-title">4. Assigned Operational Owner</div>
        <div class="timeline-text">Target Department: <strong>${tr.affected_entity}</strong></div>
      </div>
    </div>
  `).join("");

  const content = `
    <div class="section">
      <div class="section-title">Decision Traceability Matrix</div>
      <p style="font-size: 11px; color: #64748b; margin-bottom: 20px;">
        Linear lineage mapping parsed SEBI circular clauses directly to AI reasoning pathways, confidence metrics, and internal audit points.
      </p>
      ${nodesHtml}
    </div>
  `;

  printWindowTemplate(
    "Pramana Decision Traceability Report",
    "Decision Traceability Journey",
    meta,
    content
  );
};
