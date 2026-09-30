---
id: PROC-FANOUT
type: process
name: Master data fan-out (new cost center, sub account, spend category, legal entity, approver)
as_of: 2026-09-29
links: [FND-COA, EXT-ZIP]
---

# Master Data Fan-out

Completeness today is **procedural** (parallel Jira tickets per target), not architectural; a missed target surfaces later as an invalid mapping or failed requisition. `[CO:01 §7]`

| Change | Targets (one ticket each under a parent) | Failure if missed | Evidence |
|---|---|---|---|
| New cost center / sub account | Oracle GL values (+ hierarchies, CVRs), Zip lookups, T&E apps (Ramp, Oracle Expenses), Magnit/Upwork, Oracle Planning, FCCS, ARCS profiles, Alteryx, Salesforce/Ironclad, warehouse, allocation CC hierarchies | Zip req doesn't arrive; ARCS unmapped accounts; unallocated spend | `[CO:01 §2, §7; 03 §3.4]` |
| New spend category | Zip lookup (SC → sub-account → account) + Oracle sub-account value + possibly CVR revision + TAB mapping set | Req not sent to Oracle; CVR rejection; mis-posting | `[CO:02 §3]` |
| New legal entity | `XXCO_ENTERPRISE_STRUCTURE` crosswalk row (else INT055A can't create sites), Oracle GL (ledger/BSV/secondary ledgers), requisitions/purchasing/payables, Zip, T&E, Magnit/Upwork, AR, Cash Mgmt, Tax (WHT codes), FA books, bank accounts + PPR templates, INT055C-type integration extensions, FCCS, Planning, Alteryx, platform extract layer | Partial go-live | `[CO:02 §5]` |
| Approver change / delegation | Oracle, Zip, Ramp, Magnit, Upwork (each has its own matrix) | Stalled approvals | `[CO:02 §5]` |
| Exchange rate | INT156 → GL; rates DAG → FCCS; monthly tolerance recalculation | Tolerance drift; FCCS/ERP mismatch | `[CO:01 §4, 02 §5]` |

Ticket families: recurring *New Cost Center* and *New Sub Account*. `[CO:01 §2]`
