---
id: MFG-R2R
type: process
title: Record to Report — FBCo (US and Mexico ledgers)
links: [MFG-OVERVIEW, MFG-FOUNDATION, MFG-CLOSE, MFG-PROCESSES]
---

# Record to Report

On the map, this flow is drawn as scenario workflows: see `manufacturing/workflows/record-to-report.md`.

## Stages
| # | Stage | What happens | Evidence |
|---|---|---|---|
| 1 | Subledger accounting | Each subledger raises accounting events; *Create Accounting* applies the ledger's accounting method (journal entry rule sets, account rules, mapping sets) and transfers to GL. For the MX ledgers it writes primary and secondary journals together | `[ORA26C:SLA p.7-13]` `[ORA26C:GL p.301]` |
| 2 | Journals | Manual, spreadsheet (ADFdi) and feeder journals through `GL_INTERFACE` → *Import Journals* → approval → *Post Journals* | `[ORA26C:GL p.568]` |
| 3 | Intercompany | Intercompany balancing rules add due-to/due-from lines between FBCo US and FBCo México; journals across US companies 101 and 102 balance through the clearing company (intracompany); *Generate Intercompany Allocations* | `[ORA26C:GL p.373-375, 389]` |
| 4 | Allocations | *Generate Allocations* (Calculation Manager rules) spread plant overheads and shared services; US Manufacturing BU's shared services go to US Distribution BU (102) within the US ledger | `[ORA26C:GL p.559, 578]` |
| 5 | Secondary ledger | MX statutory ledger receives subledger journals at Create Accounting and GL journals at posting (journal conversion rules) | `[ORA26C:GL p.301-302]` |
| 6 | Revaluation | *Revalue Balances* on foreign-currency balances (USD payables in the MX ledger, MXN receivables in the US ledger) | `[ORA26C:GL p.530]` |
| 7 | Reporting currency and translation | MX journals convert to USD as they post (journal-level reporting currency); *Translate General Ledger Account Balances* for balance-level views | `[ORA26C:GL p.533]` |
| 8 | Consolidated reporting | A ledger set across the USD views, then Financial Reporting and Smart View. Group consolidation in FCCS | `[ORA26C:GL p.135]` `[INFERRED]` FCCS |

## Journal entries (account types)
| Event | Debit | Credit | Evidence |
|---|---|---|---|
| Revaluation: currency strengthened against the ledger currency (foreign-currency receivable) | Receivable (ledger-currency adjustment) | Unrealized gain | `[ORA26C:GL p.530]` |
| Revaluation: foreign-currency payable grew in ledger currency | Unrealized loss | Payable (ledger-currency adjustment) | `[ORA26C:GL p.530]` |
| Translation of the MX ledger to USD | Translated balances; difference to the cumulative translation adjustment (equity) | — | `[ORA26C:GL p.530, 533]` |
| Intercompany journal crossing companies | Intercompany receivable (due from) | Intercompany payable (due to) | `[ORA26C:GL p.373]` |
| Allocation of plant overhead | Cost centre / product-line expense | Overhead pool (allocation offset) | `[ORA26C:GL p.559]` |
| Asset invoice in Payables | Asset clearing | Supplier liability | `[ORA26C:FA p.31]` |
| Asset capitalisation (Post Mass Additions) | Asset cost | Asset clearing | `[ORA26C:FA p.12, 30]` |
| Depreciation (Calculate Depreciation) | Depreciation expense | Accumulated depreciation | `[ORA26C:FA p.12]` |
| MX tax book addition (secondary ledger, Perform Periodic Mass Copy) | Asset cost | Asset clearing | `[ORA26C:FA p.32]` |

## Open interfaces
`GL_INTERFACE`, `GL_DAILY_RATES_INTERFACE`, `GL_HISTORICAL_RATES_INT`, `GL_BUDGET_INTERFACE`, `FA_MASS_ADDITIONS` `[ORA26C:FA p.15, 18]`,
`CE_STATEMENT_HEADERS_INT` `[INFERRED]`.
