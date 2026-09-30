---
id: PROC-CLOSE
type: process
name: Record to Report — period close, consolidation, reconciliation, reopen
owner_business: Accounting, Consolidation team, Tax, TP
owner_systems: FTG
as_of: 2026-09-29
links: [MOD-GL, MOD-EPM, MOD-XLA, OPS-RHYTHM]
---

# Record to Report Close

**Shape:** a funnel (19+ feeders → one ledger) followed by a fan-out (FCCS, ARCS, planning, warehouse), each on its own clock. The **period calendar is the real coordination mechanism**; most apparent system dependencies are sequencing dependencies. `[CO:03 Purpose]`

## Monthly sequence `[CO:03 §5]`
| When | Owner | Step |
|---|---|---|
| Daily 00:00 UTC | FTG | INT992 IC imbalance check (19500) + balancing journals |
| Daily (5–7h) | FTG | Platform accounting run (Event Enrichment → FAH → Create Accounting → GL → S3) |
| Daily 06:00 PT | FTG | `gaap_reval_upload_to_arcs` |
| Day 4 | Automated | ReconArt bank balances → ARCS |
| ~Day 6 | On request | ReconArt unmatched items → ARCS |
| Day 0–1 of cycle | FTG + business | ARCS invalid-mapping (unmapped accounts) correction cycle |
| 25th | FTG | Open FCCS periods (Manage Periods + approval unit); create scheduled SOX and period-close task templates |
| 26th → 1st | FTG | `fccs_integrations_pipeline` runs; rates DAG daily 17:00 UTC |
| After Opex close | Consolidation | Requests FTG **pause** FCCS load DAG |
| Post-pause | FTG | Ad hoc loads after tax and TP entries |
| Post-load | Consolidation | Consolidate + Translate |
| After tie-out | Consolidation → FTG | Close Manage Periods; lock approval units |
| Quarterly | FTG + business | ARCS/FCCS UAR; TP and split-statistic revisions; Oracle release assessment |

In flight (not current state): a single FCCS business rule chaining *load → consolidate → translate* so Consolidation drives the tail; rate load from manual to scheduled.

## ARCS invalid-mapping correction cycle (a control, not a defect queue) `[CO:03 §3.5]`
- Day 0: FTG creates tracking ticket; clones invalid-profile tracking spreadsheet.
- Day 1 AM: FTG exports invalid mappings for current period to template; reviews pivot; asks business for preparer, reviewer, key/non-key.
- Day 1 midday: business completes fields.
- Day 1+: profiles created; mappings resolve; ticket = audit trail.
Oracle term: *Unmapped Accounts* completeness error. `[ORA26C:ARCS Admin p.254]`

## How the books are proved (tie-out edges) `[CO:03 §4]`
| Edge | Control / artefact |
|---|---|
| FAH detail ↔ GL | SLA reconciliation `REP023`; journal-source filtering |
| GL ↔ FCCS | GL balances load at month-end rates; FPC07 no DM mapping exceptions |
| GL ↔ ARCS | TB functional + reporting loads; profile-by-profile certification |
| ARCS ↔ ReconArt | Bank balances (4th), unmatched (6th) |
| GL ↔ Warehouse | BICC journal detail — **no single owner**; slowest differences to resolve |

## Prior-period reopen (governed) `[CO:03 §2]`
Prerequisites in all three apps: pause Airflow load DAGs → snapshot FCCS and ARCS Data Management artefacts → export existing ARCS invalid transactions for comparison → unlock (incl. manual-posting-locked accounts such as 75000) → reopen **backwards**. Reference: Reopen Prior Periods process document; ARCS reopen-period test procedure.

## GL period mechanics (Oracle)
Ledger sets can open/close periods and run processes across ledgers sharing COA/calendar. `[ORA26C:implementing-enterprise-structures-and-general-ledger p.411]` FCCS consolidation journal periods require the *Consolidation Journals – Manage Periods* role. `[ORA26C:EPM FCCS p.574]`
