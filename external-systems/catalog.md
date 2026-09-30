---
id: EXT-CATALOG
type: external-system-catalog
as_of: 2026-09-29
---

# Catalogue of Satellite Systems

| System | Role | Direction with Oracle | Integrations | Authority | Evidence |
|---|---|---|---|---|---|
| Zip | Intake & workflow | In (requisitions, terms exceptions) | OIC req import, INT826 | Advisory | see `zip.md` |
| Kyriba | Payment factory | Out (files) / In (acks, GL) | INT955, INT955B, INT246 | Payment codes | see `kyriba.md` |
| Apex Portal | Supplier-facing onboarding portal for **PO suppliers** (questionnaires, risk, diversity, bank detail); Zip → Apex → Oracle | In (supplier creation, INT055A) / Out (supplier changes, INT055B/C) | INT055A in (every 30 min, bidirectional feedback of ERP IDs); INT055B/C out | Supplier data proposed; Oracle authoritative | `[CO:02]` `[USER:2026-09-30]` |
| SimpleLegal | Legal spend / e-billing | In invoices / Out status | INT301A, INT301B; supplier sync is a known gap | — | `[CO:02]` |
| Salesforce, Ironclad | Legal contracting | Out | INT270 requisition steps | — | `[CO:02]` |
| Mulesoft | Requisition outbound consumer | Out | INT101 | — | `[CO:02]` |
| Ramp | Corporate card + reimbursement; FAH subledger | In (FAH) | via FAH `Ramp` source | — | `[CO:03]` |
| Magnit, Upwork | Contingent workforce | Master data consumers (COA, approvers) | — | — | `[CO:01–02]` |
| Concur | T&E — sunset in flight | — | — | — | `[CO:02]` |
| Payments Platform | Payments platform (marketplace events) | In (FAH) | via Event Enrichment, S3, OIC | — | `[CO:03]` |
| Event Enrichment | Event enrichment | In (FAH) | S3/OIC | — | `[CO:03]` |
| Workday (HCM/Finance) | HR, payroll journals, worker data; Workday Finance ↔ FAH | In/Out | INT028/INT274, INT026H, INT931/931B, INT210 (EIB), INT934, INT162, API157, INT304 | — | `[CO:01, 03]` |
| CloudPay | Payroll | In | INT221 | — | `[CO:01]` |
| ReconArt | Cash reconciliation | In/Out | INT072 (→GL), INT071A/B (←Oracle), feeds ARCS | — | `[CO:03]` |
| Clearwater | Investments | In | INT305 | — | `[CO:01]` |
| Spacebase | Real estate / lease | In | INT236 | — | `[CO:01]` |
| Generali | Ad hoc payments | In | INT062A | — | `[CO:02]` |
| Anaplan, EPBCS | Planning | Out | INT110AA/AB/C/D/F, INT029 | — | `[CO:01]` |
| Snowflake, Finance Warehouse, Box | Warehouse / archive | Out | INT239, INT091A/B, BICC extracts | — | `[CO:01, 03]` |
| Alteryx | Analytics consumer of COA | Master data | — | — | `[CO:01]` |
| Airflow | Orchestration for EPM loads | — | `fccs_integrations_pipeline`, `arcs_gaap/stat_integrations_pipeline`, `epm_load_month_end_and_average_rates_to_fccs`, `gaap_reval_upload_to_arcs` | — | `[CO:03 §6]` |
| OIC | Integration platform | — | all `INT###` | — | `[CO:01]` |
| Jira (FIN/FSYS, AP service desk) | Work intake + AP invoice intake + monitoring tickets | not connected to Oracle for invoices | — | — | `[CO:01 §7]` |
