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
| M-6b | Cash Management table names (`CE_STATEMENT_HEADERS_INT`, `CE_STATEMENT_LINES_INT`) | R2R, close | Open: the Cash Management PDF provided is the E-Business Suite 12.1 table of contents, not the Fusion guide. Processes are confirmed from `[ORA26C:FIN p.197]` |
| M-7 | Costing method per country (US standard, MX perpetual average) | Plan to Produce | Design choice; the methods themselves are confirmed `[ORA26C:MFG p.102]` |
| M-8 | Subledger close order (supply chain before Payables) | Period close | Open: Oracle close guidance |
