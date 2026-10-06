---
id: INS-P2P
type: process
title: Procure to Pay — Insurer
as_of: 2023-08
links: [INS-FOUNDATION, INS-R2R, INS-DATA]
---

# Procure to Pay

## Stages
| # | Stage | What happens | Evidence |
|---|---|---|---|
| 1 | Supplier onboarding | Supplier registration (prospective and internal suppliers, with approval); Supplier Qualification Management questionnaires for business classifications (diversity), scored by qualification models; DataFox enrichment of supplier firmographics; an OIC interface updates business classifications through the Suppliers REST API | `[CO:INS-NB p.54–57, 70–113, 192–218]` |
| 2 | Requisition | Self-Service Procurement; approval tiers by amount; P-card on requisitions is limited (PO created closed for receiving, card details don't reach AP) | `[CO:INS-NB p.65–66, 620]` |
| 3 | Purchase order & contracts | Purchase orders, blanket and contract purchase agreements; supplier contracts (MSA, CSA, SOW, NDA) in Enterprise Contracts; "contracts expiring" infolet | `[CO:INS-NB p.136–137, 781]` |
| 4 | Receipt | Receipts against POs; uninvoiced receipts accrued at **period end** | `[CO:INS-NB p.558–561]` |
| 5 | Invoice | Invoices by email into Integrated Invoice Imaging (OCR), imported to Payables, matched and approved by tier | `[CO:INS-NB p.519–535, 616]` |
| 6 | Payment | Payment process requests; payment approval group; checks with Positive Pay, ACH, corporate card | `[CO:INS-NB p.160–169, 331–334, 626]` |
| 7 | Settlement | Files to and from Bank A over SFTP: ACH and control totals, Positive Pay, BAI2 statements for Cash Management | `[CO:INS-NB p.165–167, 333–334]` |
| 8 | Monitoring | Transactional KPIs (invoices processed and paid on time, PO-backed %, payment method mix, requisitions, POs by source, new contracts and suppliers); AP imaging auditability dashboard in OAC | `[CO:INS-NB p.350, 759–768]` |

## Accounting (account types)
| Stage | Debit | Credit | Evidence |
|---|---|---|---|
| Period end — receipts not yet invoiced | Expense (or asset clearing) | Uninvoiced receipts accrual (liability) | `[CO:INS-NB p.559–560]` `[ORA26C:implementing-payables-invoice-to-pay p.37]` |
| Next period opens — reversal | Accrual (liability) | Expense | same |
| Invoice | Expense or asset clearing; tax | Liability (trade payables) | `[ORA26C:… p.31, 36]` |
| Payment | Liability | Cash, or cash clearing if payments are accounted at clearing | `[ORA26C:… p.31]` — which option is configured is not documented |

The accrual process chain: *Transfer Costs to Cost Management* → *Transfer Transactions from Receiving to Costing* → *Create Uninvoiced Receipt Accruals* → report. Only receipts with received amount greater than invoiced amount accrue; POs drop off the report only when **finally closed** `[CO:INS-NB p.559–560]`.

## Bank A file set `[CO:INS-NB p.165–167, 334]`
- ACH file built in Oracle and sent straight to the bank's SFTP (no middleware), plus an ACH control-totals file.
- Positive Pay file for printed checks.
- BAI2 statements from the bank for Cash Management reconciliation.
- Test path: transmission test, then content validation by the bank (48–72 hours), then about 5 business days to move to production.
- Corporate card (Visa) transaction file loaded directly into Oracle without a decryption server `[CO:INS-NB p.332]`.
