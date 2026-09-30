---
id: OPS-REPORTS
type: catalog
as_of: 2026-09-29
authoritative_source: Company Custom Report List; BI Publisher full catalogue [CO:03 §7]
---

# Custom Reports (`REP###`) and What They Answer

| ID | Name / purpose | Platform | Module | Evidence |
|---|---|---|---|---|
| REP022 | Net book value | BIP | Fixed Assets | `[CO:03]` |
| REP023 | SLA reconciliation (FAH detail ↔ GL) | BIP | XLA/FAH | `[CO:03 §4]` |
| REP026 | Intercompany Balances by Currency Affiliate (used by INT992) | BIP | GL/IC | `[CO:03 §3.4]` |
| REP035-A | Balance sheet GAAP managerial | FCCS | Consolidation | `[CO:03 §3.6]` |
| REP036 | P&L by entity | FCCS | | same |
| REP037-A | Statement of operations comparative | FCCS | | same |
| REP040-A | Adjusted EBITDA reconciliation | FCCS | | same |
| REP042-A | Balance sheet by entity | FCCS | | same |
| REP046-A | Trended balance sheet | FCCS | | same |
| REP050 | Translated retained earnings | FCCS | | same |
| REP051-A | Trended balance sheet | FCCS | | same |
| REP053 | Trended GAAP P&L | FCCS | | same |
| REP061-A | Adjusted EBITDA trend | FCCS | | same |
| REP101 | Expense bridges | FCCS | | same |
| REP103-A/B/C/D | Consolidated trial balance by entity / cost center / sub account / intercompany | BIP | GL | `[CO:03 §3.1]` |
| REP136 | SOX report with cost-center roll-up | BIP | GL | same |
| REP144 | Balance sheet detail | BIP | GL | same |
| REP531 | GL balance report (reconciliation checks) | BIP | GL | same |
| REP577 | Journal-not-reversed alert | BIP | GL | same |
| REP605 | SOX report with cost-center roll-up | BIP | GL | same |
| REP626 | Fixed Assets approvals | BIP | FA | `[CO:03 §3.3]` |
| REP627 | Company Pending Payments Status — canonical payment-run status | BIP (`/Shared Folders/Custom/Implementation/Payables/Reports/…`) | Payables/Payments | `[CO:oracle-payment-status SKILL]` |
| REP701 | My Requisitions | BIP | SSP | `[CO:02 §4]` |
| (unnamed) | Unsuccessful Payments report | BIP | Payments | `[CO:FIN-24248]` |
| (custom TB) | Trial balance report registered as ESS job for FCCS/ARCS loads (role `Company GL Inquiry`) | BIP/ESS | GL → EPM | `[CO:03 §3.5]` |

Tooling: the `oracle-reporting` MCP server exposes `get_report_history`, `get_report_parameters`, `run_report`, `schedule_report` (oversized payload → schedule email). Prefer CSV. `[CO:oracle-payment-status SKILL]`
