---
id: INS-R2R
type: process
title: Record to Report — Insurer
as_of: 2023-08
links: [INS-FOUNDATION, INS-P2P, INS-DATA]
---

# Record to Report

## Journals in
- **Policy administration (Exceed) daily journal:** premium and commission, claims, and change in case reserves come from the on-premise BIM database (SQL Server), land in the insurance data mart in ADW (stage and temp schemas), are mapped by a Financial Integrator, and post to GL in three journal categories — **Premium, Loss, Claims**. Feeds run in arrears: premium and commission one day, case reserves two days. A back-load chain reruns a missed load date `[CO:INS-NB p.315, 337, 796]`.
- **Payroll (ADP):** GL file from ADP, mapped to Oracle accounts. Target design ADP → SFTP → OIC → GL; legacy was a manual spreadsheet upload `[CO:INS-NB p.339–341]`.
- **Investments (Clearwater)** and **tax (Sovos)** were planned interfaces `[CO:INS-NB p.331]`.
- **Expenses** integrate with HCM for employee data `[CO:INS-NB p.331, 342]`.

## Intercompany `[CO:INS-NB p.30–31]`
Oracle Intercompany with transaction types, intercompany organisations and balancing rules. Example: the monthly **shared-services billing** from Mutual to Agency.
| Step | Entity | Debit | Credit |
|---|---|---|---|
| Outbound (Mutual bills Agency) | Mutual | Intercompany receivable | Shared-service reimbursement (expense credit) |
| Inbound (Agency records payable) | Agency | Shared-service reimbursement (expense) | Intercompany payable |
| Settlement | Agency | Intercompany payable | Cash |
| Settlement | Mutual | Cash | Intercompany receivable |
Batches are approved by the receiving organisation and transferred to GL.

## Allocations `[CO:INS-NB p.49–53]`
Calculation Manager rule sets: **source** (balances to allocate), **target** (receiving accounts), **range**, **basis** (driver formula), **offset** (balancing account) and a fixed point of view. Results post to the allocation companies 81–89. Entry: debit target expense, credit offset `[ORA26C:implementing-enterprise-structures-and-general-ledger p.566]`.

## Close calendar `[CO:INS-NB p.676–677]`
| Business day | Module |
|---|---|
| 1 | Payables and expense reports |
| 2 | Cash Management (new with Fusion) |
| 3 | Procurement and Payables close |
| 3–4 | Fixed Assets |
| 6 | General Ledger (may reopen for late statutory entries; closed for monetary journals) |
The close is run from the EPM **close task manager** (calendar, owners, sign-off), used since before the Fusion move. Account Reconciliation went live in September 2021 `[CO:INS-NB p.677, 408]`.

## Year end `[CO:INS-NB p.678]`
Opening the first period of the new year moves revenue and expense balances into the retained earnings account for each balancing segment, without a journal. Optional *Income Statement Closing Journals* and *Balance Sheet Closing Journals* exist where a closing journal is required.

## EPM `[CO:INS-NB p.390, 396, 499]`
| Application | Use |
|---|---|
| Financial Consolidation and Close | Close task manager (and consolidation capability) |
| Planning | Budgets and forecasts; GL actuals loaded from Fusion; budget journals and statistical journals exported to GL budget balances |
| Narrative Reporting | Report packages with author, review and sign-off phases; books distributed by bursting |
| Account Reconciliation | Account reconciliations |
| Tax Reporting, Enterprise Data Management, Profitability and Cost Management, Freeform | Provisioned in the Enterprise bundle |
GL budget balances load through *Load Interface File for Import* → *Validate and Upload Budgets*, with a corrections worksheet for errors `[CO:INS-NB p.424–426]`.

## Typical insurance entries (illustrative, not from the sources)
Premium written: debit premiums receivable, credit written premium; unearned premium reserve adjusts each period. Losses: debit losses incurred, credit loss reserves (case reserves), then claims paid from cash. These arrive as journals from the policy administration feed `[INFERRED]`.
