---
id: MFG-OVERVIEW
type: overview
title: Manufacturing Estate Map — generic food & beverage manufacturer
as_of: 2026-10 (Oracle Fusion Cloud 26C guides)
links: [MFG-FOUNDATION, MFG-P2P, MFG-P2M, MFG-O2C, MFG-R2R, MFG-CLOSE, MFG-PROCESSES, MFG-OPEN-Q]
---

# Manufacturing Estate Map

A **generic reference map**, not a client estate. The company is a mock food and beverage manufacturer, **FBCo**, running
Oracle Fusion Cloud ERP and SCM. Every statement comes from the Oracle 26C implementation and user guides listed below,
or is tagged `[INFERRED]` where the guides provided don't cover it (see `manufacturing/open-questions.md`).

## The mock company
| Entity | Country | Ledger currency | Role |
|---|---|---|---|
| FBCo US | United States | USD | Parent. Plant (beverages and dairy), distribution centre, sales to retail and food service |
| FBCo México | Mexico | MXN | Subsidiary. Plant producing concentrates and packaged goods, sold locally and to FBCo US |

Mexico is the single non-US organisation. It shows how a **primary ledger**, a **secondary ledger** and a
**reporting currency** relate (see `manufacturing/foundation/enterprise-structure-and-ledgers.md`).

## Scope
- Finance: General Ledger, Subledger Accounting, Payables, Payments, Receivables, Cash Management, Fixed Assets, Expenses, Tax.
- Procurement: Suppliers, Self Service Procurement, Purchasing.
- Supply chain: Product Hub (items), Planning Central, Inventory, Receiving, Shipping, Manufacturing (process
  manufacturing: work definitions and work orders, lots with expiry), Cost Management (Receipt Accounting, Cost
  Accounting), Supply Chain Orchestration and Financial Orchestration.
- Warehouse management is shown thin (inventory organisations, subinventories, pick, pack and ship): the guides
  provided cover it lightly.
- Cash Management has no Fusion guide in the set (the copy provided is the E-Business Suite 12.1 table of contents).
  Its processes come from the Financials getting-started and Receivables guides; its interface table names are
  `[INFERRED]`.

## Sources (evidence keys)
| Key | Guide (Oracle Fusion Cloud 26C) |
|---|---|
| `GL` | Implementing Enterprise Structures and General Ledger |
| `SLA` | Implementing Subledger Accounting |
| `AP` | Implementing Payables Invoice to Pay |
| `AR` | Implementing Receivables Credit to Cash |
| `PRC` | Implementing Procurement |
| `TAX` | Implementing Tax |
| `EXM` | Implementing Expenses |
| `MFG` | Implementing Manufacturing and Supply Chain Materials Management |
| `SCM` | Implementing Common Features for SCM |
| `RCV` | Using Receiving |
| `SHP` | Using Shipping |
| `PLN` | Using Planning Central |
| `SCO` | Using Supply Chain Orchestration |
| `SCFO` | Using Supply Chain Financial Orchestration |
| `OM` | Implementing Order Management |
| `OMU` | Using Order Management |
| `FA` | Using Assets |
| `FAI` | Implementing Assets |
| `FIN` | Getting Started with Your Financials Implementation |

Page numbers are PDF pages. Example: `[ORA26C:GL p.301]`.

REST resources come from Oracle's published REST catalogues, fetched by `tools/rest_catalog.py`:
REST API for Oracle Fusion Cloud Financials 26C, SCM 26B and Procurement 25C (docs.oracle.com).

## Files
- `manufacturing/foundation/enterprise-structure-and-ledgers.md`: enterprise structure, chart of accounts, ledgers.
- `manufacturing/modules/key-processes.md`: key scheduled processes per module.
- `manufacturing/processes/procure-to-pay.md`, `plan-to-produce.md`, `order-to-cash.md`, `record-to-report.md`,
  `period-close.md`: each flow, its hand-offs and its journal entries (account types).
- `manufacturing/integrations/open-interfaces.yaml`: the open interface tables, each with its REST alternative.
- `manufacturing/integrations/rest-apis.json`: the REST catalogue (generated; do not edit by hand).
