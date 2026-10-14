---
id: MFG-P2P
type: process
title: Procure to Pay — FBCo (ingredients, packaging, MRO and services)
links: [MFG-OVERVIEW, MFG-P2M, MFG-R2R, MFG-PROCESSES]
---

# Procure to Pay

FBCo buys two kinds of things, and each is accrued differently:
- **Inventory items** (ingredients, packaging) are accrued **at receipt**, which is mandatory for inventory purchases.
- **Expense items** (MRO, services) may be accrued **at period end** `[ORA26C:MFG p.344]`.

On the map, this flow is drawn as scenario workflows: see `manufacturing/workflows/procure-to-pay.md`.

## Stages and hand-offs
| # | Stage | Module | Hand-off to the next stage | Evidence |
|---|---|---|---|---|
| 1 | Supplier onboarding | Suppliers | Supplier, sites and site assignments are available to the procurement BU (US Manufacturing BU in the US, the Procurement Services BU for US Distribution BU; MX BU in Mexico) and the Payables (invoicing) BUs | `[ORA26C:PRC p.915]` `[ORA26C:PRC p.203-205]` |
| 2 | Requisition | Self Service Procurement / Planning Central | Approved requisition line, or a planned order released by planning → **PO line** | `[ORA26C:PRC p.201]` `[ORA26C:PLN p.13, 19]` |
| 3 | Purchase order | Purchasing | Approved PO schedule → **expected receipt** in Receiving | `[ORA26C:PRC p.5]` |
| 4 | Receipt and inspection | Receiving | Receipt → **Receipt Accounting** (accrual) and, after delivery, **Inventory** (on hand, lots with expiry dates) | `[ORA26C:RCV p.108]` `[ORA26C:MFG p.341]` |
| 5 | Deliver to inventory | Inventory → Cost Accounting | Delivery → *Transfer Inventory Transactions to Costing* → **inventory valuation** | `[ORA26C:MFG p.55, 116]` |
| 6 | Supplier invoice | Payables | Invoice matched to PO (2-way) or receipt (3-way); validation calculates price and rate variances | `[ORA26C:AP p.39, 75]` |
| 7 | Accrual matching and clearing | Receipt Accounting | *Match Receipt Accruals* pairs invoices with receipt accruals; *Clear Receipt Accrual Balances* clears them by rule | `[ORA26C:MFG p.341]` |
| 8 | Payment | Payables / Payments | Payment process request → payment file to the bank → bank statement in Cash Management | `[ORA26C:AP p.195]` |

## Journal entries (account types)
| Event | Debit | Credit | Evidence |
|---|---|---|---|
| Receipt into receiving inspection (accrue at receipt) | Receiving inspection (asset) | Uninvoiced receipts accrual (liability) | `[ORA26C:MFG p.341, 344]` |
| Delivery to inventory (standard cost) | Inventory valuation (asset); PPV if PO price ≠ standard | Receiving inspection (asset) | `[ORA26C:MFG p.383, 394]` |
| Supplier invoice matched to the PO | Uninvoiced receipts accrual; invoice price variance; recoverable tax | Supplier liability (trade payables) | `[ORA26C:AP p.39]` `[ORA26C:MFG p.394]` |
| Expense PO not yet invoiced (accrue at period end) | Expense | Uninvoiced receipts accrual (reversed next period) | `[ORA26C:MFG p.344]` |
| Payment | Supplier liability | Cash (or cash clearing when payments are accounted at clearing) | `[ORA26C:AP p.39]` |

## Open interfaces
`POZ_SUPPLIERS_INT`, `POZ_SUPPLIER_SITES_INT`, `POR_REQ_HEADERS_INTERFACE_ALL` `[INFERRED]`, `PO_HEADERS_INTERFACE` `[INFERRED]`,
`RCV_HEADERS_INTERFACE`, `RCV_TRANSACTIONS_INTERFACE`, `AP_INVOICES_INTERFACE`, `AP_INVOICE_LINES_INTERFACE`.
See `manufacturing/integrations/open-interfaces.yaml`.
