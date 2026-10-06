---
id: INS-FOUNDATION
type: foundation
title: Chart of accounts, hierarchies, mappings, SLA rules and approval workflows
as_of: 2023-08
links: [INS-OVERVIEW, INS-P2P, INS-R2R, INS-DATA]
---

# Foundation and controls

## Enterprise structure `[CO:INS-NB p.133–134]`
- One data set with two primary ledgers: **Mutual** (company 10) and **Agency** (company 20). The **Foundation** (company 90) reports separately as a not-for-profit. Business units follow the company (e.g. BU 10000 for Mutual, BU 20000 for Agency) `[CO:INS-NB p.499]`.
- Company values 80 (statutory compliance) and **81–89 (allocation companies)** hold statutory adjustments and allocation results.

## Chart of accounts (8 segments) `[CO:INS-NB p.133–134]`
| Segment | Purpose | Examples |
|---|---|---|
| Company | Balancing segment (legal entity) | 10 Mutual, 20 Agency, 80 Statutory, 81–89 Allocations, 90 Foundation |
| Department | Cost center | 0000 none, IT ERP, Foundation |
| Account | Natural account | 110100 cash, 112100 bonds, 122100 intercompany receivable, 220100 intercompany payable, 310100 retained earnings, 745100 shared-service reimbursement |
| Product | Line of business | 310 Auto, 410 Home, 000 none |
| State | Regulatory state | 48 WA, 00 none |
| Class | Expense class | 90 investment expense, 00 none |
| Project | Project | 000000 none |
| Intercompany | Counterparty company | 00 default |

Product and State exist because statutory and management reporting is by **line of business and state**.

## Hierarchies and the balances cube
- Account (and other segment) hierarchies are maintained as trees, audited, flattened (row and column) and **published to the GL balances cube** (Essbase), which feeds Financial Reporting Studio, Smart View and OTBI GL balances `[CO:INS-NB p.447–448, 464, 468]`.
- New segment values must reach the cube through *Update Balances Cubes Chart of Accounts Dimension Members and Hierarchies*; posting runs it automatically if a journal uses a new value first `[CO:INS-NB p.454]`.
- Bulk changes use the *Import Segment Values and Hierarchies* spreadsheet (interface tables `GL_SEGMENT_VALUES_INTERFACE`, `GL_SEGMENT_HIER_INTERFACE`), then *Load Interface File for Import* and *Import Segment Values and Hierarchies* `[CO:INS-NB p.449]`.
- Alternate hierarchies exist for reporting (e.g. product by sales channel; a statistical-account hierarchy) `[CO:INS-NB p.445]`. Budget scenarios are values of the Accounting Scenario value set, published with *Create Scenario Dimension Members* `[CO:INS-NB p.455]`.

## Security and validation `[CO:INS-NB p.44–48]`
- **Segment value security** on cost center and account: one role per secured value set, conditions and policies in *Manage Segment Value Security Rules*, roles assigned in the Security Console.
- **Data access sets** per ledger; business-unit data access for subledgers (*Manage Data Access for Users*) `[CO:INS-NB p.652, 670]`.
- **Cross-validation rules** (condition and validation filters) and **cross-validation combination sets** (up to five segments) decide which combinations can be created from the UI, processes or REST.
- Custom roles copy seeded job roles and trim them (e.g. an AP inquiry role for approvers, an employee role without expenses) `[CO:INS-NB p.650–666]`.

## Mappings
- **Subledger Accounting rules** (journal entry rule sets, account rules, mapping sets) derive accounts for Payables, Purchasing receipts, Payments and Assets `[ORA26C:implementing-subledger-accounting p.9–18]`.
- **Policy-administration mapping:** a Financial Integrator maps premium, loss and claims activity from the insurance data mart to GL accounts before the daily journal load `[CO:INS-NB p.337]`.
- **Payroll mapping:** ADP pay codes map to GL accounts in the payroll journal file `[CO:INS-NB p.340–341]`.
- **EPM mappings:** Data Management maps GL balances into Planning and the close application; Planning budgets map back to GL budget balances `[CO:INS-NB p.499, 424–426]`.

## Approval workflows (BPM) `[CO:INS-NB p.611–634]`
| Document | Rule design |
|---|---|
| Requisitions | Tiers by amount: up to 5K (level 3), 5K–50K (level 4), 50K–100K (levels 5–6), 100K–250K (level 7), over 250K (level 9); supervisory-hierarchy based with named exceptions |
| AP invoices | Same amount tiers; over 250K routed to an approval group; recurring invoices and PO-matched invoices auto-approve; credit memos and one-time payments have their own rules |
| Purchase orders / blanket agreements | *Manage Purchasing Document Approvals*; agreement change orders can auto-approve |
| Payments | Payment approval by approval group |
| Suppliers | Registration approval; prospective and internal suppliers; spend-authorisation approval with an auto-reject rule |
| GL journals | Journal approval by approval group |
| Expenses | Expense approval, with an override-approver privilege |
The *Workflow Rules Report* lists configured rules for invoices, expenses and journals `[CO:INS-NB p.613]`.

## Journal rules
- Auto-reverse by journal category (e.g. Accrual, Adjustment) to the first day of the next period via a journal reversal criteria set and the AutoReverse process `[CO:INS-NB p.58–62]`.
- Statutory point: an insurer's statutory balance sheet shows **surplus**, not retained earnings, so the Mutual and Agency balance sheets differ; Oracle still needs a retained earnings account per balancing segment for the year-end roll-forward `[CO:INS-NB p.503, 678]`.
