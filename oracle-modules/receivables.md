---
id: MOD-AR
type: oracle-module
modules: [Receivables]
workstream: O2C (minimal)
as_of: 2026-09-29
release: 26C
---

# Oracle Receivables (minimal footprint)

## Current state `[USER:2026-09-29]`
Marketplace revenue is **platform accounting in FAH** (Payments Platform, Secondary-Products Ledger, Payin/Payout, Gift Card…), not Oracle AR. Oracle Receivables is used only for a **small B2B / partner / intercompany invoicing population**.

## Oracle 26C capabilities available to that population
| Capability | Evidence |
|---|---|
| AutoInvoice import of transactions from other systems, error review/resubmit | `[ORA26C:implementing-receivables-credit-to-cash p.11]` |
| Receipts: manual, lockbox, spreadsheet, automatic; apply/unapply/reverse; remittance batches | `[ORA26C:… p.11]` |
| System options, receivables activities for default accounting | `[ORA26C:… p.12]` |
| Accounting via SLA journal entry rule sets (Receivables-specific) | `[ORA26C:implementing-receivables-credit-to-cash p.14, 23]` (Receivables predefines journal entry rule sets) |
| EPM Data Integration adapter *Oracle ERP Cloud (Receivables Transactions)* | `[ORA26C:EPM Data Integration p.61]` |

## Touchpoints documented at Company
AR and Cash Management are part of the new-legal-entity fan-out; GL touchpoints only in the 01–03 docs. `[CO:02 §5, 03 scope notes]`

## Unknowns → open questions
Q-AR-1 which customers/transaction types; Q-AR-2 import channel (manual, AutoInvoice, spreadsheet); Q-AR-3 whether intercompany invoicing uses Oracle Intercompany transactions or AR; Q-AR-4 receipt application method (lockbox/bank-statement).
