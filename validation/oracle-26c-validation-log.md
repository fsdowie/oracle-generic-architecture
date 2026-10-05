---
id: VAL-LOG
type: validation
method: "Full-text search of the 11 supplied Oracle 26C PDFs (converted with pdftotext -layout); page = physical PDF page"
guides: [implementing-enterprise-structures-and-general-ledger, implementing-subledger-accounting, implementing-procurement, implementing-payables-invoice-to-pay, implementing-expenses, implementing-receivables-credit-to-cash, implementing-tax, EPM FCCS, ARCS Admin, EPM Data Integration, EPM Data Management]
not_supplied: [Fixed Assets, Cash Management, Accounting Hub (dedicated), Oracle Integration Cloud, BICC/OTBI]
as_of: 2026-09-29
---

# Validation Log — Company claims vs Oracle 26C guides

Verdicts: **CONFIRMED** (guide supports) · **REFINED** (supported, but Company doc wording is imprecise; pack uses Oracle term) · **CORRECTED** (source was wrong; fixed) · **UNVERIFIED** (no supplied guide covers it) · **CONFLICT** (sources disagree).

| # | Claim (source) | Verdict | Oracle 26C evidence | Pack treatment |
|---|---|---|---|---|
| V01 | CVRs block illegal segment combinations at entry/import (01, 02) | CONFIRMED | EGL p.201, 204 | as stated |
| V02 | Parallel GAAP/STAT/TAX ledgers (01, 03) | REFINED | Secondary ledgers w/ conversion levels EGL p.301–302 | GAAP primary, STAT/TAX secondary `[USER]`; conversion level open Q-LED-2 |
| V03 | Ledger sets for consolidated reporting (01) | CONFIRMED | EGL p.411 (period open/close, reports across ledgers) | as stated |
| V04 | XLA stack: method → JERS → JLR → account rules → mapping sets (01, 03) | CONFIRMED | SLA p.9–18, 31–33 | as stated |
| V05 | Accounting method status behaviour | ADDED | SLA p.16 (Incomplete after change) | FM-XLA-03 |
| V06 | Category → charge account via "mapping sets + SLA account rules on po_distributions" (02 §3) | REFINED | TAB derives Purchasing default accounts before accounting; TAD/TAT/account rules/mapping sets; PROC p.648–651 | Described as TAB; Q-TAB-1 to confirm |
| V07 | FA depreciation-expense segments via TAB (03 §3.3) | UNVERIFIED | Supplied guides show TAB only for Purchasing and Intercompany; no FA guide | Q-FA-1 |
| V08 | "Payment processing templates per LE + bank account" (02) | REFINED | Oracle object = Payment Process Request Templates (`AP_PAYMENT_TEMPLATES`, LE/pay-group selections) PAY p.168, 173 | Renamed to PPR template |
| V09 | Invoice tolerances per BU, drive holds (02) | CONFIRMED | PAY p.92–93 (quantity/amount sets), p.42 | Local-currency recalculation is Company practice |
| V10 | INT955/955B for acks and rejection voids (02) | CLARIFIED | Oracle standard disbursement acknowledgment incl. *Automatic Voiding Option* PAY p.220 | INT955 = Kyriba→Oracle Payments ack integration `[USER:2026-09-30]`; Q-PAY-3 low priority |
| V11 | Payment approval lives in Oracle (02) | CONFIRMED (capability) | PPR stops at Review Proposed Payments when payment approval enabled PAY p.204–206 | Whether Company enables Oracle payment approval: Q-PAY-2 |
| V12 | Payment-method defaulting at supplier site (02, FIN-24137) | CONFIRMED | PAY p.99, 207, 210 | as stated |
| V13 | Track as Asset → FA mass additions (03) | CONFIRMED | PAY p.137, 154 | as stated |
| V14 | Accrual at receipt, reversed next period (02) | CORRECTED | PAY p.37 | Oracle's two options are At Receipt (no reversal; invoice clears) or Period End (reversed next period). Company uses **Period End** `[USER:2026-10-06]` |
| V15 | Separate internal vs external supplier registration approvals | CONFIRMED | PROC p.343 | as stated |
| V16 | Registration attribute requiredness via VB Studio business rules (FIN-25032) | CONFIRMED | PROC p.733 | as stated |
| V17 | Questionnaire dropdown rendering / step order / mandatory attachments not supported for internal SRR (FIN-24137/25032) | UNVERIFIED | No guide text found either way | Oracle Support D5; stated "as of 26C" |
| V18 | Supplier onboarding via Apex + INT959 (01, 02) | CORRECTED | — | Two paths: PO suppliers Zip→Apex→Oracle via INT055A `[USER:2026-09-30]`; non-PO SRR + INT959, no Apex `[USER:2026-09-29]` |
| V19 | Requisition approval by charge-account segments (02) | CONFIRMED | PROC p.294–295 | as stated |
| V20 | "Redwood requisition validations" `*_VAL` (02) | UNVERIFIED | No matching feature text in PROC guide | Q-SSP-1 |
| V21 | Intercompany balancing (INT992 on 19500) (03) | CONFIRMED (Oracle capability exists) | IC balancing rules / clearing company EGL p.373–374 | INT992 is custom; relationship Q-IC-1 |
| V22 | Allocations via rules (03) | CONFIRMED | EGL p.25–26 (Allocation rules / Calculation Manager) | as stated |
| V23 | Balances cube / Essbase (01) | CONFIRMED | EGL p.75, 81 | as stated |
| V24 | Journal approval rules by source/category (03) | CONFIRMED (capability) | EGL p.23, 177 | Company rule detail from 03 |
| V25 | FCCS: traditional BS approach, multi-GAAP, HYTD, multi-source tracking (03) | CONFIRMED | FCCS p.49, 51, 52, 54 | as stated |
| V26 | FCCS approval units, Task Manager (03) | CONFIRMED | FCCS p.19, 21 (TOC), 68 | as stated |
| V27 | FCCS consolidation/translation/IC eliminations (03) | CONFIRMED | FCCS p.15 (TOC), 585 | as stated |
| V28 | FCCS consolidation journal period management role (03) | ADDED | FCCS p.574 | as stated |
| V29 | ARCS Reconciliation Compliance + Transaction Matching (03) | CONFIRMED | ARCS p.3 | as stated |
| V30 | ARCS profile segments (03) | CONFIRMED | ARCS p.47 | as stated |
| V31 | ARCS auto-certification rule (03) | CONFIRMED (mechanism) | Auto-Reconciliation Methods ARCS p.86, 155–156 | ±5,000 USD thresholds are Company config |
| V32 | "Invalid mappings" (03) | REFINED | Oracle term *Unmapped Accounts*; *Invalid Profiles* report ARCS p.254, 313 | both terms kept |
| V33 | ERP→EPM via custom BIP TB report as ESS job (03) | CONFIRMED | EPM DI p.11 (TOC), p.61, ~p.465 | as stated; Q-EPM-1 native adapter |
| V34 | Oracle Expenses → Payables reimbursement | CONFIRMED | EXP p.41–42 | `[USER]` Oracle Expenses in use |
| V35 | Corporate card upload to Expenses | CONFIRMED (capability) | EXP p.41–42 | Company usage Q-EXP-2 |
| V36 | AR AutoInvoice/receipts | CONFIRMED (capability) | AR p.11–12 | minimal usage `[USER]` |
| V37 | Oracle Tax native, WHT in Tax or Payables | CONFIRMED | TAX p.9, 49; PAY p.77, 79 | `[USER]` native only |
| V38 | 1099 reporting fields | CONFIRMED | PAY p.52, 81 | as stated |
| V39 | Supplier tax registration by regime | CONFIRMED | TAX p.97 | as stated |
| V40 | Escheatment / checks remain Negotiable | CONFIRMED | PAY p.37 | used for status semantics |
| V41 | Oracle has no native void-reason field (FIN-24248) | UNVERIFIED | Not found in PAY guide | stated as Company finding |
| V42 | Release in production = 26B (01–03) | CORRECTED | — | 26C `[USER]` |
| V43 | INT826 at 04:00 UTC (01, 02) | CORRECTED | — | ~01:00 US Eastern `[USER]` `[DATA]` |
| V44 | Kyriba codes DOMW vs IWI (02) | CORRECTED | Data shows DOMW, INTW, TED | `INTW` adopted `[USER:2026-09-30]` |
| V45 | Cash Management statements, H2H, Urgent Payment Tool, OIC, BICC | UNVERIFIED | No guide supplied | tagged in files |

Abbreviations: EGL = implementing-enterprise-structures-and-general-ledger · SLA = implementing-subledger-accounting · PROC = implementing-procurement · PAY = implementing-payables-invoice-to-pay · EXP = implementing-expenses · AR = implementing-receivables-credit-to-cash · TAX = implementing-tax · DI = EPM Data Integration.
