---
id: INS-SECURITY
type: foundation
title: Role-based access, SOX/ITGC findings and target security model
as_of: 2023-01
links: [INS-OVERVIEW, INS-FOUNDATION, INS-P2P, INS-TAX]
---

# Security and controls

The map's **Security** tab draws this. Evidence `[CO:INS-SEC]` is the security and controls working folder: role
matrices (2020–2022), privilege extracts, the internal audit report on Purchasing, AP and Expenses, the external ITGC
observation log and management responses (2023), and audit-report runbooks.

## As built (2020–2023)
- **Users:** about 540, most outside finance. Role matrix (12/2022): 200 role codes, **143 seeded `ORA_*`** and 57 custom or data roles `[CO:INS-SEC]`.
- **Auto-provisioned to everyone:** Employee (seeded abstract), INS Employee Requester, INS Financials View Only. Managers also get INS Requisition View All (~100 users) `[CO:INS-SEC]`.
- **Seeded job roles assigned directly** to finance and procurement users (AP Manager 359 privileges, AP Specialist 98, General Accountant 252, Cash Manager 342; Financial Application Administrator 1,093; Application Implementation Consultant 3,490) `[CO:INS-SEC]`.
- **Custom overlay (~40 roles)** built from seeded duties, e.g. `INS_AP_INQUIRY_JOB` = Payables balance analysis, invoice inquiry, transaction review, image and document view, supplier profile inquiry duties, with data security on BU, ledger and subledger. Others: View All (controllers), AP Invoice View, Supplier View All, Audit Report View, Period Close Management, Requisition View All, ESS monitor, integration and REST roles `[CO:INS-SEC]`.
- **Privileged:** at go-live every initial user held Application Implementation Consultant and IT Security Manager; later 3 users each. Four business users held `INS_FIN_APP_ADMIN_FIN_STRUCTURES` (~900 privileges, incl. ~125 tax) to maintain tax rates, COA values, asset categories and calendars, and delegations `[CO:INS-SEC]`.
- **Data access:** BU access loaded by spreadsheet (Mutual, Agency); data access set per ledger; segment value security (see `INS-FOUNDATION`); procurement agents per procurement BU with all actions for admin agents `[CO:INS-SEC]`.
- **SoD through approvals, not roles:** requisition limits by job level (L3 ≤ $5K, L4 ≤ $50K, L5–L6 ≤ $100K, L7 ≤ $250K, L9 above); POs from approved requisitions auto-approved; payment process requests approved by the Controller; supplier and bank changes approved by workflow; journal approval per ledger. No SoD ruleset or tool `[CO:INS-SEC]`.
- **Logging:** OPSS audit policy at Low; audit reports on role membership and permission events; User Role Membership Report; role matrix snapshots at CRP, go-live, for auditors and yearly `[CO:INS-SEC]`.

## Findings
| Ref | Source | Finding | Action |
|---|---|---|---|
| IA-1 (medium) | Internal audit, Purchasing/AP/Expenses | Business users hold the structures admin role and can change IT configuration; their changes aren't tracked | Least-privilege roles; setup snapshots to compare; audit trail where performance allows |
| IA-2 | Internal audit walkthrough | Financials View Only (all employees, ~550) also allows invoice approval; only approval limits restrict it | Separate approver role |
| S-3 (medium) | External ITGC | Access review not formally documented; business owners not involved | Annual review with extract, role matrix and manager approvals kept |
| CO-2 (low) | External ITGC | No annual review of scheduled jobs | Annual job review |
| CO-9 (medium) | External ITGC | SOC 1/2 reports not reviewed; CUECs not mapped | Annual SOC review with CUEC mapping |

## Target
- **No seeded roles on users.** Every business role a custom copy; monthly check that no user holds `ORA_%`. Job roles copied with *Copy top role*, SoD-breaking duties copied with inherited roles and trimmed [`ORA-WEB:faser/guidelines-for-copying-erp-roles`](https://docs.oracle.com/en/cloud/saas/applications-common/24c/faser/guidelines-for-copying-erp-roles.html).
- **Naming:** `INS_<module>_<function>_JOB / _DUTY / _ABSTRACT`.
- **Split the structures admin role** into tax-rate, COA and asset-setup maintainer roles; separate approver and view-only roles.
- **SoD ruleset** (supplier vs invoice vs payment; requisition vs PO vs receipt; journal entry vs approval and close; bank maintenance vs payments; admin vs transactions), checked preventively and monthly.
- **Lifecycle:** auto-provision only low-risk abstract roles; job roles by approved ticket; termination through HCM and the daily Send Pending LDAP Requests; access review quarterly for privileged and financial roles.
- **Privileged access and change:** break-glass accounts for AIC and IT Security Manager; audit policies on key setups; annual job and SOC reviews; quarterly update role regression.
