---
id: MOD-EXP
type: oracle-module
modules: [Expenses]
workstream: T&E (P2P-adjacent)
as_of: 2026-09-29
release: 26C
links: [MOD-AP, MOD-XLA, EXT-CATALOG]
---

# Expenses / Travel & Expense

## Current-state topology `[USER:2026-09-29]`
T&E runs on **Ramp and Oracle Fusion Expenses**. 

| Path | Flow | Evidence |
|---|---|---|
| Ramp (corporate card + out-of-pocket) | Ramp → FAH subledger `Ramp` (event type e.g. `RAMP_CC_EXPENSE_APPROVAL`, mapping set `EXP_CAT_GL_ACCT`) → Create Accounting → GL (source `FAH-Ramp`) | `[CO:03 §3.2, §2]` |
| Oracle Expenses | Employee expense report → approval/audit → *Process Expense Reimbursements* creates a Payables invoice for the amount due → Payments | `[ORA26C:implementing-expenses p.41–42]` |
| Concur | Sunset in flight — not current architecture | `[CO:02 scope notes]` |

## Oracle 26C mechanics relevant to Company
- Corporate card transaction files are uploaded and validated into Expenses; users select card transactions into reports; personal expenses shown to managers. `[ORA26C:implementing-expenses p.41–42]`
- Expansion to a new country requires expense policies/rules, expense templates and corporate card programs for the new BU. `[ORA26C:implementing-expenses p.35]`
- Scheduled processes run by corporate card administrator, expense auditor or travel administrator roles. `[ORA26C:implementing-expenses p.9]`
- Expense digest / auto-submission and matching options. `[ORA26C:implementing-expenses p.16]`

## Unknowns (must not be assumed) → `validation/open-questions.md`
- Q-EXP-1: Which populations use Oracle Expenses vs Ramp (by entity, country or expense type)?
- Q-EXP-2: Are corporate cards loaded into Oracle Expenses, or is card exclusively Ramp?
- Q-EXP-3: How are Ramp reimbursements paid — Ramp-native, or Oracle Payables?
- Q-EXP-4: Approval matrix location for Oracle Expenses (approval continuity requests list Ramp but not Oracle Expenses).

## Cross-cutting
Approver reassignment/delegation requests arrive separately for Oracle, Zip, Ramp, Magnit, Upwork because each keeps its own approval matrix. `[CO:02 §5]`
