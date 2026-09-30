---
id: PROC-ONBOARD
type: process
name: Supplier onboarding — PO path (Zip → Apex → Oracle) and non-PO path (Oracle SRR + INT959)
owner_business: AP (the AP lead), Tax (the Tax lead / the Tax analyst), Treasury (the Treasury lead, the Treasury manager)
owner_systems: FTG (config), BizTech Finance Integrations (INT959)
as_of: 2026-09-29
release: 26C
links: [MOD-PROC, INT-959, MOD-TAX, MOD-PAY]
---

# Supplier Onboarding

## Two onboarding paths
| Path | Population | Flow | Evidence |
|---|---|---|---|
| **PO path** | Suppliers needed for purchase orders | Zip intake → **Apex portal** (supplier-facing onboarding: questionnaires, risk, bank detail) → Oracle Fusion supplier via **INT055A**; available for POs only after Apex | `[USER:2026-09-30]` `[CO:02 §4 Stage 01]` |
| **Non-PO path** | Ad hoc, one-time, Treasury Immediate Payments payees | Oracle internal SRR → approval → supplier created → INT959 completes details | `[USER:2026-09-29]` `[CO:FIN-25032]` |
The Apex → Oracle supplier creation for the PO path is **INT055A** `[USER:2026-09-30]` — scheduled every 30 min, pulls Apex records in *Pending ERP*, creates or updates by ERP Unique ID, builds sites per company code from the enterprise-structure crosswalk, and feeds Oracle IDs back to Apex `[CO:INT055A-spec]`. Full design: `integrations/INT055A.md`. Oracle → Apex changes return on INT055B/C. The detail below describes the **non-PO (SRR) path**.

## Current-state flow `[USER:2026-09-29]`
```mermaid
sequenceDiagram
  participant R as Requester (AP / Treasury / business)
  participant SRR as Oracle Supplier Registration Request (Redwood)
  participant APR as Internal SRR approval (AMX)
  participant SUP as Oracle Suppliers
  participant I959 as INT959 (OIC)
  R->>SRR: Complete form + questionnaire (6 pages; Bank Accounts on page 5)
  SRR->>APR: Submit (VB Studio business rules validate)
  APR-->>R: Reject / send back (e.g. no attachment auto-reject rule)
  APR->>SUP: Approve → supplier created
  SUP->>I959: Trigger
  I959->>SUP: Complete profile, site, payment methods, tax flags from questionnaire
```
- Populations: non-PO / ad hoc suppliers, Treasury Immediate Payments payees, AP and Tax use. `[CO:FIN-25032, FIN-24137]`
- **Apex Portal is not part of the SRR path.** `[USER:2026-09-29]` PO suppliers use a separate path: Zip request → **Apex portal** → Oracle Fusion; a PO supplier is only available after going through Apex. `[USER:2026-09-30]` Apex → Oracle creation runs on **INT055A** `[USER:2026-09-30]`; see `integrations/INT055A.md`.
- External (supplier self-service) registration flow exists in Oracle but is unchanged by current work. `[CO:FIN-24137 assumptions]`

## Oracle 26C levers and limits
| Lever | Evidence |
|---|---|
| *Configure Supplier Registration* (sections, requiredness) | `[ORA26C:implementing-procurement p.21, 347]` |
| Separate internal vs external approval tasks, two predefined stages | `[ORA26C:implementing-procurement p.343]` |
| Approval conditions on attributes like *Bank Account Entered*, bank country | `[ORA26C:implementing-procurement p.323, 352]` |
| VB Studio express-mode business rules: make attributes required/hidden/read-only | `[ORA26C:implementing-procurement p.733]` |
| Questionnaire ↔ DFF synchronisation | `[ORA26C:implementing-procurement p.948]` |
| FAQ: validate tax registration number on registration requests | `[ORA26C:implementing-procurement p.911 (TOC)]` |

**Stated 26C limits (Company analysis; Oracle Support confirmation D5 pending)** `[CO:FIN-24137 register]` `[UNVERIFIED]`
- Questionnaire responses can't render as dropdown (36 payment-method buttons).
- Registration step order not configurable (Bank Accounts stays on page 5 of 6).
- Mandatory attachments available only for supplier self-service registration; VB Studio *Company Details* rule list has no Attachments field → ER.2 not feasible; approvers enforce. `[CO:FIN-25032]`

## Enhancement programme — FIN-24137 (current state of decisions, Sep 2026) `[CO:FIN-24137 register, FIN-25032 update]`
| ER | Requirement | Story | Disposition |
|---|---|---|---|
| ER.1 | Prevent submission without an address | FIN-25032 | Build: Addresses section Required; configured DEV1 7-Aug-2026; open defect: DEV1 requires both *Receive Purchase Orders* and *Receive Payments* purposes, contradicting "Ordering not mandatory" |
| ER.2 | ≥1 attachment before submission | FIN-25032 | Not feasible in 26C; approvers enforce; decide fate of existing no-attachment auto-reject rule |
| ER.3 | Default selected payment method, keep others active | FIN-25021 + FIN-24752 (INT959) | In progress; also LOV reduced to methods used in 24 months; new Treasury question restricted to Electronic/Manual |
| ER.4 | Tax Type requiredness | FIN-25268 (ARD) | Analysis; kill criterion = No Change is valid |
| ER.5 | Contact section usage | FIN-25032 | Analysis → decision |
| ER.6 | TRN / DUNS conditionally required (US 1099) | FIN-25032 | **Disputed** — AP/Treasury sign-off outstanding |
Parked/out of scope: dropdown rendering; free-text payment terms (must match Oracle value, Immediate for Treasury); Bank Accounts step order; external bank validation; remediation of existing suppliers.

## Failure modes
FM-SUP-01 no address → no Remit-to site · FM-SUP-02 unmatched payment terms → creation fails · FM-SUP-03 non-selected payment methods end-dated · FM-SUP-04 missing city blocks structured-address formats · FM-SUP-05 duplicates / missing parent-child · FM-SUP-06 late discovery of missing bank on page 5 delays urgent payments.
