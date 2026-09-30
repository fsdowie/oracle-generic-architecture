---
id: MOD-GL
type: oracle-module
modules: [General Ledger, Intercompany, Allocations]
workstream: R2R
as_of: 2026-09-29
release: 26C
links: [FND-COA, PROC-CLOSE, MOD-XLA]
---

# General Ledger, Intercompany, Allocations & Transfer Pricing

## General Ledger
Single system of record for balances. Receives XLA-derived journals from all Oracle subledgers and FAH, and pre-accounted journals from ~19 external/adjustment feeders. `[CO:03 §3.1]`

**Core processes:** journal capture/approval/posting; manual and statutory journals (incl. ADFDI spreadsheet); allocations and cost-plus TP; revaluation and translation; period open/close/reopen; balances cube. `[CO:03 §3.1]`
Oracle basis: allocations via *Create Allocation Rules* / Calculation Manager `[ORA26C:implementing-enterprise-structures-and-general-ledger p.25–26]`; translation requires a fiscal year start before the first translated period `[ORA26C:… p.78]`; reporting-currency and secondary-ledger conversion `[ORA26C:… p.301–303]`.

### Key reports `[CO:03 §3.1]`
`REP531` GL balance (recon checks) · `REP577` journal-not-reversed alert · `REP103-A/B/C/D` consolidated TB by entity / cost center / sub account / intercompany · `REP144` balance sheet detail · `REP605`, `REP136` SOX reports with CC roll-up · `INT267` ledger account balance validation.

### Journal feeders (import, bypass XLA)
See `integrations/integration-register.yaml` group `gl-feeders`: INT026A/B/F/H/J, INT028/INT274, INT072, INT221, INT236, INT246, INT305, INT824, INT931/931B, INT210, INT156.

### Failure modes
CVR rejections on import (even zero-balance combos) · duplicate journals from a feeder · reconciliation report discrepancies · payments landing in wrong account for an LE · UI report runtimes pushing users to the warehouse. `[CO:03 §3.1]`

## Intercompany, allocations and transfer pricing
Most rule-dense area; encodes tax/legal positions that move quarterly. `[CO:03 §3.4]`

| Rule family | Change cadence |
|---|---|
| Cost-plus rules per entity (source formulas, splits) | As positions change |
| Platform service fees, administrative fees between entity pairs | As needed |
| Royalty formulas (country variants) | As needed |
| Allocation cost-center hierarchies | When new CCs appear |
| Benefits cost allocation | |
| Split statistics | Quarterly |
| Pillar 2 source formula revisions | As needed |

### Automation `[CO:03 §3.4]`
| ID | What | When |
|---|---|---|
| INT992 | Runs `REP026` Intercompany Balances by Currency Affiliate, detects imbalance on account **19500**, posts balancing journals via FBDI (source `Boomerangs`) | Daily 00:00 UTC + ad hoc |
| INT977 | Cash redenomination | |
| INT985 | Brazil IC redenomination | |
| INT988 | Global IC redenomination, with ledger amount mismatch threshold | |
| IC PPR templates | Cash settlement of IC balances | |

Oracle basis: **Intercompany balancing rules** generate the IC receivable/payable accounts needed to balance journals out of balance by LE or primary balancing segment; clearing-company options handle second/third balancing segments. `[ORA26C:… p.373–374]` Whether Company uses Oracle IC balancing rules *in addition to* INT992 is not documented → Q-IC-1.
TAB also derives default accounts for the Common Module: Intercompany. `[ORA26C:implementing-subledger-accounting TAB section; implementing-procurement p.648]`

### Failure modes
IC imbalance persisting to month-end → manual reclass through clearing accounts · allocations missing new CCs → unallocated spend · redenomination mismatch breaching tolerance · Allocations category frozen, blocking a correction. `[CO:03 §3.4]`
