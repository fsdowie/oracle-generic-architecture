---
id: INS-CLOSE
type: process
title: Close process and scheduled processes — Insurer
as_of: 2023-09
links: [INS-R2R, INS-P2P, INS-DASH]
---

# Close process

The finance schedule set at go-live (January 2021) and revised in January 2022 (Create Accounting rescheduled) `[CO:INS-ERP p.149–151]`. Times are Pacific.

## Scheduled processes (daily rhythm)
| Process | Module | Frequency / time | Notes |
|---|---|---|---|
| Import Payables Invoices (source: Invoice Image) | Payables & OCR | Hourly from 01:00, per business unit; plus daily 22:15 | Imaging feeds the open interface |
| Validate Payables Invoices | Payables | Every 15 minutes per ledger | Put on hold for Mutual and Agency in January 2022 until OCR accuracy improved; AP validates manually; Foundation unaffected (no POs) `[CO:INS-ERP p.153]` |
| Initiate Invoice Approval Workflow | Payables | Daily, per business unit (04:25 / 04:30) | |
| Create Mass Additions | Payables → Assets | Daily 05:00 | Post Mass Additions as needed |
| Create Accounting | All subledgers | Every 4 hours from 02:00; per-subledger runs 15 minutes apart | |
| Create Multiperiod Accounting | Payables | Hourly, after Create Accounting | |
| AutoPost Journals | General Ledger | Every 8 hours from 02:00 | |
| Transfer GL balances to balances cube | General Ledger → Smart View | Daily 05:45 | Feeds Smart View, FRS and the Planning loads |
| Process Electronic Bank Statements / BAI2 | Cash Management | Daily 07:00 | Bank A BAI2 |
| Autoreconcile Bank Statements | Cash Management | Daily 10:00, per bank account | |
| Upload and validate corporate card file (OIC) | Expenses | Daily 08:00 | |
| Process Expense Reimbursements and Cash Advances | Expenses | Every 12 hours from 06:00 | |
| Policy journals — daily premium & commissions, claims, change in case reserves (OIC) | General Ledger | Daily 10:00 | From the ADW insurance data mart |
| Policy journals — monthly policy count & average written, advanced premiums, written vs prior written premium (OIC) | General Ledger | Monthly, first 5 days, 10:00 | |
| Payroll journal (ADP → GL, OIC) | General Ledger | Bi-weekly (Wednesday) | |
| ACH / Positive Pay | Payables | Automatic with each payment run | |
| Contract expiration and renewal notifications; contract status | Contracts | Daily / nightly | |
| Security sync (LDAP), notifications sync | Security | Hourly / every 30 minutes | |

## Month end
1. **Receiving → costing:** *Transfer Transactions from Receiving to Costing* → *Create Uninvoiced Receipt Accruals* (per bill-to BU) → *Uninvoiced Receipt Accrual Report* → *Create Accounting* (Receipt Accounting, final, transfer and post) — one job set, in order `[CO:INS-ERP p.150–151]`.
2. **Subledger close by business day:** AP and expense reports (BD1), Cash Management (BD2), Procurement and Payables (BD3), Fixed Assets (BD3–4) `[CO:INS-NB p.676–677]`.
3. **Allocations:** about six Calculation Manager allocation rules run monthly (validate and deploy); payroll and payroll-accrual allocations post by **state** `[CO:INS-ERP p.35, 41–42]`.
4. **GL close:** business day 6 (may reopen for late statutory entries) `[CO:INS-NB p.677]`.
5. **Close management:** the EPM close task manager (FCCS) holds the calendar, owners and sign-off; Account Reconciliation certifies balance-sheet accounts `[CO:INS-ERP p.144]`.
6. **After close:** FP&A loads actuals into Planning (once or twice a day until the P&Ls tie), pushes them to OAC Essbase, publishes dashboards and financial reports, and announces that the month is closed `[CO:INS-ERP p.46, 165]`.

## Quarterly
Oracle updates follow a quarterly patch cycle: non-production refresh, DEV patched first, TEST covers production support during the blackout, then TEST and PROD as final cutover; integrations, OTBI reports used by dashboards, and the trial balance are regression-tested each time `[CO:INS-ERP p.6, 33, 38]`.
