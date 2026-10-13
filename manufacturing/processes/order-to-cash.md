---
id: MFG-O2C
type: process
title: Order to Cash — FBCo (retail and food-service customers)
links: [MFG-OVERVIEW, MFG-P2M, MFG-R2R, MFG-PROCESSES]
---

# Order to Cash

## Stages and hand-offs
| # | Stage | Module | Hand-off | Evidence |
|---|---|---|---|---|
| 1 | Customer and credit | Receivables (customers) | Customer account, sites, profile, credit limit | `[ORA26C:AR p.140, 285]` |
| 2 | Sales order | Order Management | EDI or portal order → orchestrated fulfilment lines → **shipment request** | `[INFERRED]` `[ORA26C:SCO p.3]` |
| 3 | Pick, pack, ship | Inventory / Shipping | Lots picked FEFO (first expiry, first out); *Ship Confirm* issues inventory → **Cost Accounting** (deferred COGS) | `[ORA26C:SHP p.14, 69]` `[INFERRED]` FEFO |
| 4 | Invoice | Receivables | Fulfilled lines → `RA_INTERFACE_LINES_ALL` → *Import AutoInvoice* | `[ORA26C:AR p.80, 105]` |
| 5 | Revenue and COGS | Receivables, Cost Accounting | *Recognize Revenue*; Cost Accounting recognises COGS in step with revenue (ship-only lines can use the order-line close date) | `[ORA26C:AR p.318]` `[ORA26C:MFG p.379]` |
| 6 | Receipt | Receivables | Lockbox file → `AR_PAYMENTS_INTERFACE_ALL` → *Process Receipts Through Lockbox*; applied to invoices | `[ORA26C:AR p.174, 203]` |
| 7 | Bank reconciliation | Cash Management | Bank statement lines reconciled against receipts | `[ORA26C:AR p.353]` |
| 8 | Intercompany sale (MX → US) | Financial Orchestration | Physical shipment from the MX plant; intercompany AR invoice in MX and AP invoice in US at the transfer price | `[ORA26C:SCFO p.3]` |

## Journal entries (account types)
| Event | Debit | Credit | Evidence |
|---|---|---|---|
| Shipment (sales order issue) | Deferred COGS | Inventory valuation (finished goods) | `[ORA26C:MFG p.379]` `[INFERRED]` account names |
| Customer invoice (AutoInvoice) | Receivable | Revenue (or unearned revenue); tax payable | `[ORA26C:AR p.80, 318]` |
| Revenue recognised | Unearned revenue (when deferred) | Revenue | `[ORA26C:AR p.318]` |
| COGS recognised in step with revenue | COGS | Deferred COGS | `[ORA26C:MFG p.379]` |
| Customer receipt | Cash (or remitted / confirmed cash) | Receivable | `[ORA26C:AR p.203]` |
| Intercompany sale: seller (MX) | Intercompany receivable | Intercompany revenue; then intercompany COGS / inventory | `[ORA26C:SCFO p.3]` `[INFERRED]` lines |
| Intercompany purchase: buyer (US) | Inventory (at transfer price) | Intercompany payable | `[ORA26C:SCFO p.3]` `[INFERRED]` lines |

## Open interfaces
`RA_CUSTOMER_PROFILES_INT_ALL`, `DOO_ORDER_HEADERS_ALL_INT` `[INFERRED]`, `WSH_DEL_DETAILS_INTERFACE`, `INV_RESERVATION_INTERFACE`,
`RA_INTERFACE_LINES_ALL`, `RA_INTERFACE_DISTRIBUTIONS_ALL`, `AR_PAYMENTS_INTERFACE_ALL`.
