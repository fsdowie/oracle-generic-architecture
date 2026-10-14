---
id: MFG-OPEN-Q
type: open-questions
title: Manufacturing map — items not in the guides provided
links: [MFG-OVERVIEW]
---

# Items tagged INFERRED

These are standard Oracle Fusion behaviour or object names that the guides provided don't print. Check them against
the matching guide when it's available.

| # | Item | Where | Status |
|---|---|---|---|
| M-1 | Interface tables `POR_REQ_HEADERS_INTERFACE_ALL`, `PO_HEADERS_INTERFACE` (Import Requisitions, Import Orders) | P2P | Open: needs Using Procurement or the FBDI for Procurement guide |
| M-2 | `EGP_SYSTEM_ITEMS_INTERFACE`, `CST_INTERFACE_STD_COSTS`, `WIE_WORK_ORDERS_INT`, `INV_TRANSACTIONS_INTERFACE` | Plan to Produce | Open: needs the FBDI for SCM guide (no Inventory Management guide was in the folder) |
| M-3 | Order Management steps and `DOO_ORDER_HEADERS_ALL_INT` | Order to Cash | **Resolved** 2026-10-13: `[ORA26C:OM p.58, 63, 266]` |
| M-4 | Account names for deferred COGS | Order to Cash | **Resolved** 2026-10-13: Direct Sales Order Issue and COGS Recognition templates `[ORA26C:OMU p.69-70]`. Intercompany trade line accounts stay open (Using Cost Accounting) |
| M-5 | FEFO picking at shipment for lot-controlled food items | Order to Cash | Partly resolved: FEFO lot defaulting is in the guide for backflush `[ORA26C:MFG p.490]`; picking at shipment still needs Using Inventory Management |
| M-6a | Fixed Assets (`FA_MASS_ADDITIONS`, depreciation, tax book in the secondary ledger) | R2R, close | **Resolved** 2026-10-13: `[ORA26C:FA p.8-32]` `[ORA26C:FAI p.22]` |
| M-6b | Cash Management table names (`CE_STATEMENT_HEADERS_INT`, `CE_STATEMENT_LINES_INT`) | R2R, close | **Resolved** 2026-10-13: Oracle 26C web docs, Using Payables Invoice to Pay, "How Bank Statements Import Data is Processed" |
| M-7 | Costing method per country (US standard, MX perpetual average) | Plan to Produce | Design choice; the methods themselves are confirmed `[ORA26C:MFG p.102]` |
| M-8 | Subledger close order (supply chain before Payables) | Period close | Open: Oracle close guidance |

## Workflow journal lines and steps tagged INFERRED (2026-10-13)
Agreed: show standard account types on these steps, tagged INFERRED, until a source prints them. Details are in
`manufacturing/workflows/*.md`.

| # | Workflow › step | What is inferred | Status |
|---|---|---|---|
| W-1 | Procure to Pay › Supplier return › Reverse receipt accounting; Net in next payment | Reversal lines; debit memo netted in the next payment run | Open: Using Supply Chain Cost Management (return events) |
| W-2 | Make & Inventory › Plant to DC transfer › In-transit and DC value | In-transit inventory account lines | Open: Using Supply Chain Cost Management (transfer order events) |
| W-3 | Make & Inventory › Cycle count › Cost the adjustments | The overage entry (the shortage entry is cited) | Open |
| W-4 | Order to Cash › Standard › Pick, pack, ship | FEFO picking at shipment (same as M-5) | Open |
| W-5 | Order to Cash › Customer return › Credit memo and Cost of the return | Credit memo and COGS reversal lines | Open: Using Receivables, Using Cost Management (RMA events) |
| W-6 | Order to Cash › Drop ship › Bill the customer | Invoice account lines | Open |
| W-7 | Order to Cash › Intercompany sale MX → US | Intercompany AR, AP and cost lines (same as M-4 remainder) | Open |
| W-8 | Record to Report › Month-end › subledger close order; period close | Order of subledger close (same as M-8) | Open |
| W-9 | Record to Report › Boundary journals | Payroll and treasury journal accounts; file cadence | Open: depends on the payroll provider |
| W-10 | Record to Report › Intercompany › Provider and receiver invoices; Reconcile | Account lines; the reconciliation report name | Open |
| W-11 | Treasury › Bank statement › Create Accounting | Bank fee and interest lines (the docs give only cash and offset accounts) | Open |
| W-12 | Make & Inventory › Lot expiry, holds and recall | Customer (outbound) recall isn't in Product Recall Management, so it isn't drawn | Design note |

