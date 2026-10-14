---
id: MFG-WF-TRE
type: workflows
title: Treasury workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Treasury workflows

Payments out to the bank and bank statements back in, reconciled in Cash Management.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Payments to bank

The weekly supplier payment run: installments selected, validated and reviewed, payments built and formatted, the file transmitted to the bank with a positive pay file, then cleared from the statement.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Select installments** — A payment process request (or template) selects validated, approved installments by due date, pay group and currency. | Payables | Submit Payment Process Request | Validated installments → Selected installments |  |  | [`ORA-WEB:fappp/how-payment-process-requests-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-payment-process-requests-are-processed.html) `[ORA26C:AP p.195]` |
| 2 | **Review and validate** — Stages: installment selection, document validation, payment validation; proposed payments can be reviewed and approved. | Payables | Review installments; Review proposed payments | Selected installments → Approved payments |  |  | [`ORA-WEB:fappp/how-payment-process-requests-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-payment-process-requests-are-processed.html) |
| 3 | **Build and format** — Payments assigns the bank account and payment process profile, creates payments and the payment file, then extracts and formats it. | Payments | Create payments; Create payment file; Format Payment Files | Approved payments → Payment file | Payment (accounted at issue): Dr Supplier liability / Cr Cash clearing | Cash: cash clearing credited at issue | [`ORA-WEB:fappp/how-disbursements-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-disbursements-are-processed.html) |
| 4 | **Transmit** — The file is transmitted to the bank (or checks are printed); payments are confirmed at formatting or transmission. | Payments | Transmit payment file | Payment file → File at the bank |  |  | [`ORA-WEB:fappp/how-disbursements-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-disbursements-are-processed.html) |
| 5 | **Positive pay** — A positive pay file of issued checks goes to the bank to block fraud. | Payments | Create Positive Pay File | Issued checks → Positive pay file |  |  | [`ORA-WEB:fappp/how-a-positive-pay-file-is-generated`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-a-positive-pay-file-is-generated.html) `[ORA26C:AP p.199]` |
| 6 | **Bank pays** — The bank pays suppliers and reports the debits on the statement. | Bank |  | Payment file, Positive pay file → Bank statement |  |  | [`ORA-WEB:fappp/how-disbursements-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-disbursements-are-processed.html) |
| 7 | **Reconcile and clear** — Reconciliation matches the statement lines to the payments and clears them (event class Reconciled Payments: Payment Cleared). | Cash Management | Autoreconciliation; Create Accounting (Payables) | Bank statement → Cleared payments | Payment cleared (accounted at clearing): Dr Cash clearing / Cr Cash | Cash: cash credited when the bank pays | [`ORA-WEB:fappp/how-invoices-and-payments-are-accounted`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-invoices-and-payments-are-accounted.html) [`ORA-WEB:fappp/automatic-reconciliation`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/automatic-reconciliation.html) |

Hand-offs: Select installments → Review and validate; Review and validate → Build and format (approved); Build and format → Transmit (file); Transmit → Bank pays (payment file); Transmit → Positive pay; Positive pay → Bank pays (positive pay); Bank pays → Reconcile and clear (statement).

**Accounting option.** FBCo accounts payments at issue and at clearing: issue credits cash clearing; clearing moves cash clearing to cash. That keeps cash equal to the bank.

## 2. Bank statement to reconciliation

Each morning the banks' statements load, reconcile automatically to receipts, payments and journals, and bank fees and interest are created and accounted in Cash Management.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Statement file** — The bank publishes the previous-day statement (and intraday statements). | Bank |  | Bank statement file |  |  | [`ORA-WEB:fappp/how-you-process-electronic-bank-statements`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-you-process-electronic-bank-statements.html) |
| 2 | **Load and import** — The scheduled process retrieves the file and loads and imports it; a manual route loads a file from UCM with Load and Import Bank Statement, and spreadsheets use the FBDI template. | Cash Management | Process Electronic Bank Statements; Load and Import Bank Statement; Import Bank Statements from a Spreadsheet | Statement file → Bank statement |  |  | [`ORA-WEB:fappp/how-you-process-electronic-bank-statements`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-you-process-electronic-bank-statements.html) |
| 3 | **Autoreconciliation** — Matching and tolerance rules match statement lines to payments, receipts, journals and external transactions. | Cash Management | Autoreconciliation | Bank statement → Reconciled lines, Exceptions |  | Cash: payments and receipts cleared | [`ORA-WEB:fappp/automatic-reconciliation`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/automatic-reconciliation.html) |
| 4 | **Exceptions and manual** — Ambiguous, date and amount exceptions are reviewed; manual reconciliation handles 1:1, 1:M, M:1 and M:M matches. | Cash Management | Review Exception; Manual reconciliation | Exceptions → Reconciled lines |  |  | [`ORA-WEB:fappp/overview-of-reconciliation-exceptions`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/overview-of-reconciliation-exceptions.html) [`ORA-WEB:fappp/how-you-manually-reconcile-a-bank-statement`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-you-manually-reconcile-a-bank-statement.html) |
| 5 | **Fees and interest** — Transaction creation rules turn unreconciled first-notice lines (bank charges, fees, interest) into external transactions, which are then reconciled. | Cash Management | Create Bank Statement Transactions | Unreconciled lines → External transactions |  |  | [`ORA-WEB:faipp/overview-of-bank-statement-transaction-creation-rules`](https://docs.oracle.com/en/cloud/saas/financials/26c/faipp/overview-of-bank-statement-transaction-creation-rules.html) [`ORA-WEB:fappp/overview-of-external-cash-transactions`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/overview-of-external-cash-transactions.html) |
| 6 | **Create Accounting** — Reconciled external transactions are accounted with their cash and offset accounts and transferred to GL. | Subledger Accounting · GL | Create Accounting (Cash Management) | External transactions → Cash journals | Bank fee: Dr Bank charges expense (offset) / Cr Cash<br>Interest received: Dr Cash / Cr Interest income (offset) | Cash: ledger cash agrees with the bank | [`ORA-WEB:fappp/overview-of-external-cash-transactions`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/overview-of-external-cash-transactions.html) `[INFERRED]` |

Hand-offs: Statement file → Load and import (statement); Load and import → Autoreconciliation; Autoreconciliation → Exceptions and manual (exceptions); Autoreconciliation → Fees and interest (unmatched); Fees and interest → Create Accounting (external txns).

**Transfers between accounts.** Manage Bank Account Transfers creates an outflow and an inflow external transaction, accounted by Create Accounting.

**Interface tables.** The spreadsheet route loads CE_STATEMENT_HEADERS_INT, CE_STATEMENT_LINES_INT and related balance tables.
