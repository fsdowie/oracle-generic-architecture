---
id: PROC-PAYMENTS
type: process
name: Payment execution, settlement, returns, and standing up a new payment method
owner_business: Treasury, AP, GL
owner_systems: FTG, Kyriba/the payment-factory consultant, BizTech Integrations
as_of: 2026-10-05
links: [MOD-PAY, EXT-KYRIBA, INT-955, INT-KYR-PAYFILE, OPS-PAYSTATUS]
---

# Payments: Execution, Settlement, Returns

## A. Standard execution
1. Validated invoices selected into a **PPR** using a template per LE + bank account (`AP_PAYMENT_TEMPLATES`). `[ORA26C:implementing-payables-invoice-to-pay p.168]`
2. Payment process profile builds the file (ISO where applicable). `[ORA26C:… p.193]`
3. Approval control sits in Oracle; Kyriba auto-approves standard AP payments. `[CO:02 §4 Stage 07]`
4. Oracle sends the file to Kyriba through the native e-Text format and transmission configuration (`integrations/kyriba-payment-file.md`). Kyriba maps the codes (Oracle code → Kyriba code; code × bank × issuing country → bank file) and transmits H2H. The file reaches the bank about **5 minutes** after leaving Oracle. `[CO:KYRIBA-DOC §4.2]`
5. INT955 (hourly) returns acks; INT955B voids Oracle payments on rejection; daily rejection email to AP + Treasury.
6. INT246 posts Kyriba accounting to GL; INT819/820 statements into Cash Management; ReconArt reconciles.

## B. Status checking (canonical method)
Use BI Publisher **REP627 Company Pending Payments Status** — path `/Shared Folders/Custom/Implementation/Payables/Reports/REP627 Company Pending Payments Status/REP627 Company Pending Payments Status.xdo`; parameters `CREATED_FROM_DATE`, `CREATED_TO_DATE` (`YYYY-MM-DD`, default today ±10 days, on payment creation date). Preferred over procurement MCP, warehouse or Kyriba for run-status questions. Read-only. `[CO:oracle-payment-status SKILL]` Field reference in `operations/payment-status-reference.md`.

## C. Returned / unsuccessful payments (FIN-24248 epic) `[CO:FIN-24248 review, FIN-24250]`
- Baseline: **86 payments** not successfully received (suppliers or tax authorities) 1-Dec-2025 → 22-May-2026, based on voided payments; **48% RETURNED**.
- Failure states in scope: **RETURNED** (after bank acceptance), **REJECTED**, **NOT SENT**. Scope limited to electronic payments Oracle → Kyriba → bank; manual payments excluded (no Kyriba status detail).
- Current tracking: GL and P2P teams record returns manually in the **AP Transition spreadsheet**; no analysable reason capture.
- Oracle has **no native void-reason field** → fallback is after-the-fact upload of reasons. `[CO:FIN-24248]` `[UNVERIFIED in 26C guide]`
- Unsuccessful Payments report exists (moved toward Production Aug 2026); Oracle Enhancement Request raised (number not recorded).
- Known root-cause families → see rejection taxonomy in `operations/payment-status-reference.md` (name mismatch, invalid account, tax ID missing, currency mismatch, invalid characters, compliance screening values).
- **Name-mismatch fix in flight** (FIN-24573): swap Name 1/Name 2 so Bank Account Name is primary for Bank A non-US, Bank B, Bank C templates; prerequisite: Procurement/Tax populate Account Name on active suppliers. Evidence case: a large INR supplier payment returned "Name missing or invalid".

## D. Standing up a new payment method / bank / country / currency (10 steps) `[CO:02 §5]`
1. Confirm genuinely new: same bank, same branch + issuing country, same Oracle payment method, same domestic/cross-border, same currency, same FX treatment → if all six match an active payment, no setup.
2. Prerequisites: bank account exists in Kyriba and Oracle; Treasury confirms H2H + method enabled at bank for that account.
3. Raise FIN tracking ticket (method, cross-border, FX, expected monthly volume).
4. Consulting partner (the payment-factory consultant) assessment: existing Kyriba config covers it, or specify fields/format/cutoffs/changes.
5. Oracle-side assessment: not net-new → Request; net-new → backlog Story.
6. Configure Oracle (PPR template), test invoice per payment type, process, review file. Rejecting a prod payment and re-paying is the simplest real-bank test.
7. Test payment: Oracle Dev → Kyriba Sandbox, or low-value prod payment via Urgent Payment Tool (banks often assign a tech resource only after the first file).
8. Verify in Kyriba the file was consumed and payment created.
9. Monitor the return path — ack and any return file consumed end-to-end (**the real success test**).
10. Sign-off: Treasury + Oracle engineer + original requester.

## Failure modes
FM-PAY-01 stuck in Draft (Kyriba code × bank × country missing; silent) · FM-PAY-02 file not integrated (field length, e.g. payment reason) · FM-PAY-03 bank rejects (BIC vs ABA, branch/routing/convenio, tax ID, name) · FM-PAY-04 account not H2H-enabled · FM-PAY-05 missing statements · FM-PAY-06 reprocess without rejecting original → duplicate risk · FM-PAY-07 wrong GL cash account for LE · FM-PAY-08…10 file or batch rejected by Kyriba or the bank, so no payment-level acks.
