---
id: MFG-CLOSE
type: process
title: Period close — FBCo
links: [MFG-R2R, MFG-FOUNDATION, MFG-PROCESSES]
---

# Period close

Subledgers close first, in dependency order, then the ledgers. Supply chain closes before Payables because receipt
accruals and inventory valuation must be complete before invoices are reconciled to them `[INFERRED]` (sequence).
Each subledger's own steps are from the guides.

| Day | Step | Owner | Evidence |
|---|---|---|---|
| BD-2 | Load daily rates (MXN/USD) | Treasury | `[ORA26C:GL p.293]` |
| BD-1 | Complete receiving and inventory transactions; resolve pending transactions | Plant / warehouse | `[INFERRED]` |
| BD+1 | *Transfer Inventory Transactions to Costing*; *Create Cost Accounting Distributions*; close work orders | Cost accounting | `[ORA26C:MFG p.116, 359]` |
| BD+1 | *Create Receipt Accounting Distributions*; *Match Receipt Accruals*; *Clear Receipt Accrual Balances*; accrue uninvoiced expense receipts | Cost accounting | `[ORA26C:MFG p.341, 344]` |
| BD+1 | Close the cost accounting period (inventory organisation and cost organisation) | Cost accounting | `[ORA26C:MFG p.359]` |
| BD+2 | Payables: *Validate Payables Invoices*, approve, *Create Accounting*, close the period (sweep or resolve exceptions) | AP | `[ORA26C:AP p.13, 189]` |
| BD+2 | Receivables: *Import AutoInvoice*, *Recognize Revenue*, *Create Receivables Accounting*, close the period | AR | `[ORA26C:AR p.13, 105, 318]` |
| BD+2 | Cash Management: reconcile bank statements | Treasury | `[ORA26C:FIN p.197]` `[ORA26C:AR p.353]` |
| BD+3 | Assets: *Post Mass Additions*, *Calculate Depreciation* and close the period, *Create Accounting for Assets* (corporate and tax books) | Fixed assets | `[ORA26C:FA p.8, 10, 18]` |
| BD+3 | GL: post remaining journals, intercompany, allocations | GL | `[ORA26C:GL p.389, 559]` |
| BD+4 | *Revalue Balances* (US and MX); MX secondary ledger review; reporting currency check | GL | `[ORA26C:GL p.530]` |
| BD+4 | *Translate General Ledger Account Balances* where needed; close the periods (primary, secondary, reporting) | GL | `[ORA26C:GL p.533]` |
| BD+5 | Consolidated reports on the ledger set; hand off to FCCS | GL / consolidation | `[ORA26C:GL p.135]` |
