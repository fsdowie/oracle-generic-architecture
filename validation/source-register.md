---
id: VAL-SOURCES
type: source-register
root: "C:\\Users\\fsdow\\Claude\\oracle\\company\\Claude Cowork - Company\\Claude Cowork"
as_of: 2026-09-29
---

# Source Register

| Tag used | File | Date | Contributed |
|---|---|---|---|
| CO:01 | ftg-oracle-architecture/01-oracle-finance-spine.md | 28-Sep-2026 | Layers, five rules, foundation, integration catalogue, rhythm, seams |
| CO:02 | ftg-oracle-architecture/02-procure-to-pay-chain.md | 28-Sep-2026 | P2P stages, derivation layers, holds data, payments, new-method runbook |
| CO:03 | ftg-oracle-architecture/03-record-to-report-close.md | 28-Sep-2026 | GL, FAH, FA, IC/TP, ARCS, FCCS, tie-out, close calendar |
| CO:FIN-24137 register | finance-system-planning-framework/FIN-24137_Business_Requirements_Register.xlsx, One Pager, Approval Sheet, dependencies/risks, Objectives markup, review | Aug–Sep 2026 | Supplier registration ERs, INT959 behaviours, 26C limitations |
| CO:FIN-25032 | finance-system-planning-framework/FIN-25032-jira-update.txt | 25-Sep-2026 | ER.1/2/5 decisions, DEV1 findings |
| CO:ER4 story | finance-system-planning-framework/ER4-tax-type-story-jira-markup.txt | Aug 2026 | Tax Type, `LEGACY_ORACLE_TAX_PROFILE_MAPPING` |
| CO:FIN-24573 | finance-system-planning-framework/FIN-24573-story-draft.md | Sep 2026 | Payee name mapping, bank format constraints |
| CO:FIN-24248 review | finance-system-planning-framework/FIN-24248-review.docx | 18-Aug-2026 | Returned payments baseline and scope |
| CO:bnz-ticket SKILL | finance-system-planning-framework/_portable/skills/bnz-ticket/SKILL.md | 7-Sep-2026 snapshot | Framework hierarchy, sprint/KTLO/capacity, content bar |
| CO:oracle-payment-status SKILL | finance-system-planning-framework/_portable/skills/oracle-payment-status/SKILL.md | 7-Sep-2026 | REP627 path, parameters, procedure |
| CO:stories-description | stories-description/FIN-24137-description-review.docx, FIN-24250-description-review.docx | 28-Jul-2026 | Early problem statements (superseded by later framework reviews) |
| DATA:payments-status | payments-status/*.xlsx (2 files) | Jun–Jul 2026 | Status/ack fields, rejection taxonomy, naming patterns |
| DATA:int826 logs | int826-log-analysis/logs/*.csv (15 runs) | 6-Apr → 26-May-2026 | Schema, outcome taxonomy, schedule evidence |
| CO:INT826_error_analysis.html | int826-log-analysis/int826-log-analysis/INT826_error_analysis.html | 30-May-2026 | User-entry anomaly analysis |
| CO:INT055A-spec | the implementation project INT055A Supplier Creation and Update Inbound OIC Integration Lean Specification (PDF, 80 pp; the SI partner TFD v2.1 May-2023, changes to Apr-2025+) | 2022–2025 | INT055A design, mappings, crosswalk, bank/tax lookups, 1099/CNPJ/diversity changes |
| CO:INT055A-UT | Unit Testing – INT055A Apex Suppliers To Oracle Inbound (PDF, 4 pp) | 18-Jul-2025 (UAT) | Runtime evidence: Main + Sync Supp Key, OCI files, notification |
| ORA26C:* | 26c guides/*.pdf (11 guides) | Release 26C | Oracle-standard behaviour (see validation log) |
| USER | Build-session answers | 29-Sep-2026 | Corrections R-01…R-07 |

## Excluded deliberately
- `_portable/memory/*` and `jk-tone` skill — reviewer-tone guidance; only the content-bar rules were used, in `governance/`.
- `finance-systems-planning-framework.md` — empty file (0 bytes).
- `.claude/settings.local.json` — tool configuration only.
