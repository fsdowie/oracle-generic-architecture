---
id: MOD-PROC
type: oracle-module
modules: [Suppliers, Self-Service Procurement, Purchasing]
workstream: P2P
as_of: 2026-09-29
release: 26C
links: [PROC-ONBOARD, PROC-P2P, INT-959, EXT-ZIP, FND-COA]
---

# Oracle Suppliers, Self-Service Procurement (SSP), Purchasing

## Suppliers
**Owns:** supplier master, sites (addresses with purposes), bank accounts, payment methods, tax and income-tax reporting attributes, parent–child relationships. `[CO:02 §2]`

**Supplier creation paths (current state):** (1) **PO suppliers:** Zip → **Apex portal** → Oracle Fusion; only available for POs after Apex `[USER:2026-09-30]`. (2) **Non-PO / ad hoc / Treasury:** Oracle **internal Supplier Registration Request (SRR)** creates the supplier and **INT959** completes details from the questionnaire; Apex not involved `[USER:2026-09-29]`. → `processes/supplier-onboarding.md`.

| Configuration FTG maintains | Evidence |
|---|---|
| Supplier registration form (Redwood) and questionnaires, question-to-field mapping via INT959 | `[CO:FIN-24137 register]` |
| Supplier types (`SUPPLIER`, `ADHOC`, `TREASURY` observed) | `[DATA:payments-status]` |
| Default payment method; INT959 behaviour since Jan-2025 (FIN-18320) end-dates all non-selected methods — change in flight (ER.3 / FIN-25021 / FIN-24752) to keep others active | `[CO:FIN-24137 register ER.3]` |
| Income-tax federal-reportable flag and income-tax reporting site (xxxx) | `[CO:02 §4 Stage 01]` `[ORA26C:implementing-payables-invoice-to-pay p.81]` |
| Address rules: city mandatory, structured addresses for banking; ER.1 makes ≥1 address required at submission | `[CO:02, FIN-25032]` |
| One-time supplier portal (historically lacked bank detail → create-payee-then-invoice two-step) | `[CO:02 §4]` |

**Oracle 26C facts that bound what can be changed** (all `as of Release 26C`):
- Separate approval tasks exist for external vs internal registration: *Manage Supplier Registration Approvals* and *Manage Internal Supplier Registration Approvals*, each predefined with two stages. `[ORA26C:implementing-procurement p.343]`
- Registration approval rules can test attributes such as *Bank Account Entered* / bank country. `[ORA26C:implementing-procurement p.323, 352]`
- Registration form attributes can be made required/hidden/read-only with **VB Studio express-mode business rules**. `[ORA26C:implementing-procurement p.733]`
- Where registration form and questionnaire share DFFs mapped to questions, values are synchronised with questionnaire responses. `[ORA26C:implementing-procurement p.948]`
- Company-documented limitations (confirmation from Oracle Support pending, D5): questionnaire responses can't render as dropdown; registration step order (e.g. moving Bank Accounts earlier) is not configurable; mandatory attachments only for supplier self-service registration, not internal SRR (ER.2 declared not feasible). `[CO:FIN-24137 register, FIN-25032]` `[UNVERIFIED in 26C guide text]`

## Self-Service Procurement (Requisitions)
**Owns:** requisitions, lines and distributions, requester experience, spend approval routing. `[CO:02 §2]`

- Zip-approved requisitions arrive via OIC requisition import carrying defaulted COA segments; Oracle re-derives the charge account. First point in SOX scope. `[CO:02 §4 Stage 03]`
- **Named Company validations (real-time at submit):** `ATTACHMENTS_VAL` (supporting documents required), `SPEND_CAT_GOODS_VAL` / `SPEND_CAT_SERVICESV_VAL` (goods vs service categories can't mix), `REQ_SINGLE_SUPP_VAL` (one supplier per requisition), `REQ_UOM_VAL` (UOM = Each), `INTERNAL_MEMO_LEGAL_VAL` (legal notes, conditional on category), `LEGAL_CCTR_VAL`, `BOD_CAT_VAL`, `PUB_PIOLICY_PROJ_VAL` (department-specific), `BU_SPEND_CATEGORY_VAL`, `CATEGORY_CCTR_VAL`, `BU_CATEGORY_CCTR_VAL` (BU / category / cost-center combinations). Named in the 02 P2P doc and tracked in the *Oracle RQ/PO validations inventory* (which also assesses whether each could move to Zip). `[CO:02 §3–4, §7]` The 26C procurement guide describes no standard feature with these names, so they are Company-built; the build mechanism (e.g. VB Studio Redwood page rules, Groovy/object validation, or an OIC pre-check) is not documented → Q-SSP-1 (owner: whoever maintains the validations inventory).
- Spend approval matrix by cost center, sometimes sub-SBU. Oracle 26C supports requisition approval routing on **any segment or combination of segments of the charge account** (regex on the charge account string). `[ORA26C:implementing-procurement p.294–295]`
- Reports/integrations: `REP701` My Requisitions; `INT101` requisition → Mulesoft; `INT270` requisition steps → Salesforce. `[CO:02 §4]`
- A standing analysis tracks which Oracle validations could move to Zip (some native in Zip, some field-requirement changes, some conditional on spend category; those needing Oracle master data can't move). `[CO:02 §3]`

## Purchasing
**Owns:** POs, distributions, change orders, receipts, PO ownership. Buyer review currently in Oracle (move to Zip is in flight). `[CO:02 §2, §4]`

### Charge-account derivation — corrected model
Company docs describe "purchasing category → charge account mapping sets (separate France set) + SLA account rules on `po_distributions_all` deriving `code_combination_id`". `[CO:02 §3]`
Oracle 26C: the **Transaction Account Builder (TAB)** derives default accounts for Purchasing transactions (requisitions, POs) *before* they are accounted; TAB uses transaction account definitions → transaction account types → account rules / segment rules → mapping sets, fed by sources such as item category. Definitions are assigned at ledger and subledger level. `[ORA26C:implementing-procurement p.648–651]`
→ The Company mapping sets for category → account most likely sit **inside TAB**, not in the SLA journal-entry rule stack. `[INFERRED]` Q-TAB-1.

| Mechanism | Evidence |
|---|---|
| PO update by FBDI for bulk change | `[CO:02 §4 Stage 04]` |
| PO close and requisition tooling on Visual Builder | same |
| PO-line BICC extract → procurement data warehouse (has shipped blank files undetected) | same |
| Change orders mostly handled by Procurement Ops from Jira tickets | same |

Configuration records: *Company Purchasing Configuration BR100 (production)*; setup *Manage Mapping Sets* / *Manage Transaction Account Definitions*. `[CO:02 §7]`

### Receipts and accrual
Receipt is the first accounting event (accrual) and the third leg of three-way match; variable consumption uses `INT026F` variable accrual; reversals checked by `REP577`. `[CO:02 §4 Stage 05]` Oracle: period-end expense accruals are created for receipts without invoices and reversed when the next period opens. `[ORA26C:implementing-payables-invoice-to-pay p.37]`
- **Mechanism:** the receipt debits expense and credits the accrual / uninvoiced-receipts liability through the same Subledger Accounting rule stack (`CORP_GAAP_SLAM`) that later accounts the invoice and payment; the invoice then clears the accrual. `[CO:ACCRUALS-DOC]`
- **Variable accrual:** where spend is consumption-based rather than receipt-based, the variable-accrual integration posts an estimate instead of a receipt accrual. `[CO:ACCRUALS-DOC]`
- **Reports:** `REP077` Accrual Sync (accruals syncing), `REP536` Accrual FX Variation (FX revaluation on open accruals), `REP577` journal-not-reversed alert. `[CO:ACCRUALS-DOC]`
- **Not confirmed:** whether expense items accrue *at receipt* or *at period end* (*Accrue Expense Items* on Manage Common Options for Payables and Procurement). The source says so explicitly; the answer is in the Purchasing / Payables configuration workbooks → Q-PAY-7.

## Failure modes (module-local)
See `operations/controls-and-failure-modes.md` codes FM-SUP-*, FM-SSP-*, FM-PO-*.
