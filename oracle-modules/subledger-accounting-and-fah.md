---
id: MOD-XLA
type: oracle-module
modules: [Subledger Accounting (XLA), Accounting Hub (FAH/OAHC)]
workstream: Platform Accounting, R2R
as_of: 2026-09-29
release: 26C
links: [PROC-PLATFORM, FND-COA, MOD-GL]
---

# Subledger Accounting (XLA) and Accounting Hub (FAH)

## The rule stack (one engine for everything)
Accounting method **`CORP_GAAP_SLAM`** → subledger applications → event classes/types → **journal entry rule sets** → **journal line rules** → **account rules** → **mapping sets** → account combination. `[CO:03 §3.2]`

| Component | Oracle 26C definition | Evidence |
|---|---|---|
| Accounting attribute assignments | Create Accounting copies source values into journal entries via sources assigned to accounting attributes; FAH predefines some (e.g. Accounting Date = Transaction Date) | `[ORA26C:implementing-subledger-accounting p.7]` |
| Accounting method | Groups journal entry rule sets; Create Accounting uses the method with active JERS assignments; any change to a component sets status *Incomplete* until re-validated | `[ORA26C:… p.15–16]` |
| Journal entry rule set | Per event class; assigned to the ledger's accounting method | `[ORA26C:… p.12, 18]` |
| Journal line rule | Line-level; account rule assigned per side (incl. gain/loss) | `[ORA26C:… p.9–10]` |
| Account rule | Derives account or segment | `[ORA26C:… p.10, 18]` |
| Mapping set | Input value(s) → segment/account value; simpler than conditions in account rules | `[ORA26C:… p.31–33]` |
| Accrual reversal | Requires *Accrual Reversal Accounting Date Source*; FAH predefines no source for it | `[ORA26C:… p.8]` |

Company objects: subledger applications `PAYMENTS_PLATFORM`, `Ramp`, `Secondary-Products Ledger`, `Non-GAAP` and others; event type example `RAMP_CC_EXPENSE_APPROVAL`; mapping sets `EXP_CAT_GL_ACCT`, `SA_AIA_BANK_ACCOUNT_MAP`. `[CO:03 §3.2]`

**Diagnostic rule:** a wrong number from an XLA-derived source is a rule-configuration question (JERS → JLR → account rule → mapping set). Check whether the method went *Incomplete* after a change. `[INFERRED from ORA26C p.16]`

## Accounting Hub — Platform Accounting
Purpose: turn high-volume marketplace/operational events into detailed, auditable GL accounting; implemented for public-company readiness. `[CO:03 §3.2]`

**Flow:** event data → Event Enrichment normalisation/enrichment → S3 + OIC → FAH → Create Accounting (XLA) → GL posting → FAH fact tables back to S3 (Hive, Snowflake). `[CO:03 §3.2]`

| Source (FAH subledger) | Notes |
|---|---|
| Payments Platform | Largest, ~2M transactions/day; includes CFAR and Synthetic Cancellations |
| Ramp | Corporate card and out-of-pocket reimbursement |
| Secondary-Products Ledger | Secondary Payments Platform products, ASC 606 split |
| Non-GAAP, Payin/Payout, Gift Card, Subsidiary brand, other platform sources | |
| Intercompany | Reconciled and posted via `INT992` |
`[CO:03 §3.2]`

Related integrations: `INT162` FAH → Workday Finance; `API157` Workday Finance → FAH; `INT978` Subsidiary brand accounted detail with reversal. `[CO:03 §6]`

## Failure modes
- **Unaccounted transactions** — a missing attribute (e.g. guest currency) leaves the event unaccounted until re-run through Create Accounting; monthly exceptions review exists. `[CO:03 §3.2]` Oracle: required accounting attributes must hold values (entered currency etc.). `[ORA26C:… p.7, 9]`
- **Throughput** — rules engine and GL posting drive the ~1% delayed runs; structural because one method and one ledger. *In flight:* Hub modernisation. `[CO:01 §7]`
- **IC imbalance on 19500** requiring month-end reclass.
- **FAH-to-GL reconciliation** depends on correct journal-source filtering, found mis-documented in the warehouse. `[CO:03 §3.2]`
- Reconciliation: `REP023` SLA reconciliation between FAH detail and GL. `[CO:03 §4]`

## Evidence gap
No dedicated Accounting Hub 26C implementation guide was supplied; FAH-specific statements beyond the SLA guide are `[CO]` only.
