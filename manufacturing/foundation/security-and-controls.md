---
id: MFG-SECURITY
type: foundation
title: Role-based access, SoD and ITGC for FBCo
links: [MFG-OVERVIEW, MFG-FOUNDATION, MFG-EBTAX]
---

# Security and controls

The map's **Security** tab draws this. It is a generic design for a SOX-scoped Oracle Fusion estate. Role codes
(`FBC_…`) show the convention, not a delivered catalogue `[INFERRED]`.

## Principle: no seeded roles on users
- Predefined roles (`ORA_` codes) can be copied but not edited. A copy drops the `ORA_` prefix and gets a configurable prefix or suffix [`ORA-WEB:faser/guidelines-for-copying-erp-roles`](https://docs.oracle.com/en/cloud/saas/applications-common/24c/faser/guidelines-for-copying-erp-roles.html).
- *Copy top role* keeps links to Oracle's inherited roles, so their quarterly changes flow in. *Copy top role and inherited roles* copies the hierarchy and insulates it from those changes.
- Pattern: shallow-copy job roles, deep-copy and trim only the duty roles that break an SoD rule `[INFERRED]`.
- Oracle asks customers to carry seeded-role changes from each release into their custom roles [`ORA-WEB:fasor/required-security-update`](https://docs.oracle.com/en/cloud/saas/risk-management-and-compliance/25b/fasor/required-security-update.html).
- Monthly check that no user holds a role like `ORA_%` (User Role Membership Report) `[INFERRED]`.

## Provisioning
- Role provisioning rules auto-provision only abstract roles (Employee, Line Manager). Job roles are requested and approved, with a preventive SoD check [`ORA-WEB:facsa/autoprovisioning`](https://docs.oracle.com/en/cloud/saas/applications-common/25a/facsa/autoprovisioning.html).
- *Send Pending LDAP Requests* runs daily so future-dated hires and terminations take effect.

## Role catalogue (by process)
| Process | Roles |
|---|---|
| Procure to Pay | Requester, Buyer, Receiving Agent, Supplier Manager, AP Invoice Specialist, AP Payment Specialist, AP Manager (no supplier bank maintenance) |
| Make & Inventory | Planner, Production Supervisor, Inventory Manager, Cost Accountant, Product Data Steward |
| Order to Cash | Order Manager, Shipping Manager, Billing Specialist, Cash Specialist, Customer Data Steward, Credit Manager |
| Record to Report | GL Accountant, GL Controller (approval, close), Intercompany Accountant, GL Reporting (abstract), MX Statutory Accountant |
| Treasury & Assets | Bank Admin, Cash Manager, Asset Accountant, Asset Manager |
| Admin | Security Admin, Financial Setup Admin, Tax Admin US, Tax Admin MX, ESS Scheduler, Auditor (read-only); break-glass AIC and IT Security Manager |

## Data access
Roles say what; data access says where. Assignments through *Manage Data Access for Users*
[`ORA-WEB:faser/data-access`](https://docs.oracle.com/en/cloud/saas/applications-common/25d/faser/data-access.html):

| Context | FBCo US | FBCo México |
|---|---|---|
| Business unit (AP, AR, Procurement, Expenses, OM) | US Manufacturing BU, US Distribution BU | MX BU |
| Data access set (GL) | US primary, by company 101 / 102 | MX primary (201); MX secondary for the statutory accountant only; MX reporting currency and USD ledger set read-only |
| Inventory and cost organisation | US plant, US DC | MX plant |
| Asset book | US corporate | MX corporate, MX tax book |

## SoD ruleset
1. Supplier and supplier bank maintenance vs AP invoice entry
2. Supplier maintenance vs payments
3. AP invoice entry vs payment
4. Requisition vs requisition approval or PO
5. PO vs receipt
6. PO vs AP invoice entry or matching
7. Bank account maintenance vs payments or bank reconciliation
8. Journal entry vs journal approval or posting
9. COA, calendar and ledger setup vs journal entry
10. Customer maintenance vs receipts or credit memos
11. AR receipts vs bank reconciliation or write-off approval
12. Asset additions vs retirements or depreciation
13. Security or setup administration (incl. tax setup) vs any transaction role

Oracle's own examples include bank account management vs supplier payments, and supplier bank update vs invoice
approval [`ORA-WEB:e20376/F753155AN264A4`](https://docs.oracle.com/cd/E29597_01/fusionapps.1111/e20376/F753155AN264A4.htm).
Checks run in Advanced Access Controls, preventively at role design and at each request, and detectively each month
[`ORA-WEB:faacm/overview-of-oracle-advanced-controls`](https://docs.oracle.com/en/cloud/saas/risk-management-and-compliance/26c/faacm/overview-of-oracle-advanced-controls.html).

## ITGC
| Domain | Control |
|---|---|
| Provisioning / deprovisioning | Ticket, manager and role-owner approval, SoD check; termination through HCM same day; monthly reconciliation of terminations |
| Access review | Quarterly for privileged and financial roles, semi-annual for the rest; population from the User Role Membership Report plus data access, run parameters kept |
| Privileged access | Few named holders who don't transact; break-glass ticketed and reviewed within two business days |
| Change management | Change in test, promote by setup export/import or configuration set migration; audit policies on key setups (incl. tax); quarterly update regression and role review |
| Jobs and logs | Scheduled job inventory reviewed annually; OPSS audit at Low, reported in *Security – Audit Real Time* [`ORA-WEB:ochus/enable-audit-for-oracle-platform-security-services`](https://docs.oracle.com/en/cloud/saas/human-resources/25a/ochus/enable-audit-for-oracle-platform-security-services.html) |
| SOC | Oracle Cloud SOC 1 Type II reviewed annually, CUECs mapped, bridge letter to year end |

## Mexico specifics
- MX tax setup (IVA, retentions, RFC registrations) only through the MX tax admin role, under change control (see `MFG-EBTAX`).
- Statutory chart mapping and MX secondary-ledger adjustments only by the MX statutory accountant.
- RFC, CURP and bank details of MX suppliers and employees restricted under Mexico's personal data law `[INFERRED]`.
