---
id: MFG-P2M
type: process
title: Plan to Produce — FBCo (process manufacturing and costing)
links: [MFG-OVERVIEW, MFG-P2P, MFG-O2C, MFG-PROCESSES]
---

# Plan to Produce

FBCo makes beverages, dairy and concentrates with **process manufacturing**:
- Work definitions (the formula or recipe: ingredients in, primary output and co-products out) and process work orders.
- Ingredients and finished goods are lot-controlled with expiry dates.
- Costing uses standard cost in the US and perpetual average cost in Mexico. Cost Management supports Standard,
  Actual and Perpetual Average cost methods `[ORA26C:MFG p.102]`; the split per country is a design choice for the mock company.
- Backflushed ingredient lots can be defaulted first-expiry, first-out (*Lot Selection During Backflush* = Lot FEFO) `[ORA26C:MFG p.490]`.

The guide lists Plan to Produce as Discrete Manufacturing, Process Manufacturing (work definitions and work orders),
Contract Manufacturing and Outside Processing `[ORA26C:MFG p.122]`. Process manufacturing is enabled per plant
(*Enable Process Manufacturing* plant parameter) `[ORA26C:MFG p.482]`.

On the map, this flow is drawn as scenario workflows: see `manufacturing/workflows/make-and-inventory.md`.

## Stages and hand-offs
| # | Stage | Module | Hand-off | Evidence |
|---|---|---|---|---|
| 1 | Item, work definition, standard cost | Product Hub, Manufacturing, Cost Accounting | Items and the work definition (recipe) feed planning and work orders; standard costs are loaded into the cost book | `[ORA26C:SCM p.526]` `[ORA26C:MFG p.359]` |
| 2 | Plan | Planning Central | Demand (forecast and sales orders) → planned orders → **released** as work orders (make) or requisitions (buy) | `[ORA26C:PLN p.13, 19]` |
| 3 | Work order | Manufacturing | Released work order; Supply Chain Orchestration creates and tracks it when supply is requested | `[ORA26C:MFG p.548]` `[ORA26C:SCO p.3]` |
| 4 | Material issue | Manufacturing → Inventory | Ingredient lots issued (push or backflush) → **Cost Accounting** | `[ORA26C:MFG p.478]` |
| 5 | Resource and overhead | Manufacturing → Cost Accounting | Resource transactions (labour, machine hours) and overhead absorption rules charge the work order | `[ORA26C:MFG p.408, 448]` |
| 6 | Product completion | Manufacturing → Inventory | Finished-good lots (with expiry dates) completed into the completion subinventory | `[ORA26C:MFG p.140, 482]` |
| 7 | Close the work order | Cost Accounting | Remaining WIP balance goes to variances | `[ORA26C:MFG p.359]` |
| 8 | Cost accounting | Cost Accounting → SLA → GL | *Create Cost Accounting Distributions* then *Create Accounting* (Cost Management) to the ledgers. Transfers from the US plant to the distribution centre cross profit centre BUs: an intracompany financial orchestration flow, with trade distributions instead of invoices | `[ORA26C:MFG p.359, 585, 591]` |
| 9 | Recall and expiry | Inventory | Product Recall Management traces lots; expired lots are scrapped | `[ORA26C:MFG p.771]` |

## Journal entries (account types)
| Event | Debit | Credit | Evidence |
|---|---|---|---|
| Material issue to the work order | Work in process (WIP) valuation | Inventory valuation (ingredients, packaging) | `[ORA26C:MFG p.359, 448]` |
| Resource charge | WIP valuation | Resource absorption | `[ORA26C:MFG p.448]` |
| Overhead absorption | WIP valuation | Overhead absorption | `[ORA26C:MFG p.408-409]` |
| Product completion | Inventory valuation (finished goods) | WIP valuation | `[ORA26C:MFG p.359]` |
| Work order close | WIP variance (usage, efficiency) | WIP valuation (or the reverse when favourable) | `[ORA26C:MFG p.359]` |
| Scrap or expired lot | Scrap / inventory adjustment expense | Inventory valuation | `[INFERRED]` |
| Cycle count or physical inventory adjustment | Inventory adjustment expense (or inventory) | Inventory valuation (or expense) | `[INFERRED]` |

## Open interfaces
`EGP_SYSTEM_ITEMS_INTERFACE` `[INFERRED]`, `CST_INTERFACE_STD_COSTS` `[INFERRED]`, `WIE_WORK_ORDERS_INT` `[INFERRED]`,
`WIE_OPERATION_TRANSACTIONS`, `WIE_RESOURCE_TRANSACTIONS`, `INV_TRANSACTIONS_INTERFACE` `[INFERRED]`, `INV_TRANSACTION_LOTS_INTERFACE`.
