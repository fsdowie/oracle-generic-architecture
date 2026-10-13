---
id: MFG-OPEN-Q
type: open-questions
title: Manufacturing map — items not in the guides provided
links: [MFG-OVERVIEW]
---

# Items tagged INFERRED

These are standard Oracle Fusion behaviour or object names that the guides provided don't print. Check them against
the matching guide when it's available.

| # | Item | Where | Guide that would confirm it |
|---|---|---|---|
| M-1 | Interface tables `POR_REQ_HEADERS_INTERFACE_ALL`, `PO_HEADERS_INTERFACE` (Import Requisitions, Import Orders) | P2P | Using Procurement / FBDI for Procurement |
| M-2 | `EGP_SYSTEM_ITEMS_INTERFACE`, `CST_INTERFACE_STD_COSTS`, `WIE_WORK_ORDERS_INT`, `INV_TRANSACTIONS_INTERFACE` | Plan to Produce | FBDI for SCM |
| M-3 | Order Management steps and `DOO_ORDER_HEADERS_ALL_INT` | Order to Cash | Implementing Order Management |
| M-4 | Account names for deferred COGS and the intercompany trade lines | Order to Cash | Using Cost Accounting |
| M-5 | FEFO picking for lot-controlled food items | Order to Cash | Using Inventory Management |
| M-6 | Fixed Assets (`FA_MASS_ADDITIONS`, depreciation) and Cash Management (`CE_STATEMENT_HEADERS_INT`) | R2R, close | Implementing Assets; Implementing Cash Management |
| M-7 | Costing method per country (US standard, MX perpetual average) | Plan to Produce | Design choice for the mock company |
| M-8 | Subledger close order (supply chain before Payables) | Period close | Oracle close guidance |
