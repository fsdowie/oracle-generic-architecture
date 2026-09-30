---
id: PROC-PLATFORM
type: process
name: Platform accounting daily run (Accounting Hub)
owner_systems: FTG (FAH rules), Engineering (Payments Platform/Event Enrichment)
as_of: 2026-09-29
links: [MOD-XLA]
---

# Platform Accounting — Daily Run

| Step | What | Evidence |
|---|---|---|
| 1 | Marketplace/operational events emitted (Payments Platform ~2M tx/day and other sources) | `[CO:03 §3.2]` |
| 2 | Event Enrichment normalises and enriches | same |
| 3 | Delivered via S3 + OIC into FAH (10–12M events/day → ~11M headers, ~40M lines) | same |
| 4 | **Create Accounting** applies `CORP_GAAP_SLAM` rule stack | same; `[ORA26C:implementing-subledger-accounting p.7, 16]` |
| 5 | Journals post to GL (~700K headers, ~3.5M lines, ~80K batches; source per subledger e.g. `FAH-Ramp`) | same |
| 6 | FAH fact tables extracted to S3 → Hive/Snowflake for reporting and reconciliation | same |
| 7 | INT992 (00:00 UTC) balances intercompany on 19500 | `[CO:03 §3.4]` |

Window 5–7 hours; ~99% success; residual = rules engine + GL posting throughput. `[CO:03 §3.2]`

## Exceptions handling
- Unaccounted events (missing attribute) → fix data → re-run Create Accounting; **monthly exceptions review**.
- Throughput delays → structural (one method, one ledger); Hub modernisation is the in-flight response.

## Questions an agent can answer from here
"Why is revenue from X not in GL yet?" → check (a) event arrived in FAH, (b) accounted vs unaccounted, (c) posted to GL, (d) run window overrun that day.
