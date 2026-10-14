---
id: MFG-WF-R2R
type: workflows
title: Record to Report workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Record to Report workflows

The month-end sequence to the balance sheet and P&L, then each GL process in detail: boundary journals, intercompany, allocations, FX, consolidation and reconciliation.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Month-end sequence

The order the close runs in, from opening the period to reporting the balance sheet and P&L. Each bubble has its own scenario tab where there is more to show.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Open the period** — The accounting period is opened in each ledger (and reporting currency) before journals are created or imported; MXN/USD daily rates are loaded. | General Ledger | Open and Close Periods; Import Daily Rates | Calendar → Open period |  |  | `[ORA26C:GL p.320]` `[ORA26C:GL p.293]` |
| 2 | **Close subledgers in order** — Supply chain closes first (inventory and receipt accounting), then Payables, Receivables, Cash Management and Assets. See Period close for the day-by-day calendar. | Subledgers | Close cost accounting periods; Close Payables and Receivables periods; Calculate Depreciation | Subledger transactions → Closed subledger periods |  |  | `[ORA26C:MFG p.359]` `[ORA26C:AP p.189]` `[ORA26C:AR p.318]` `[ORA26C:FA p.10]` `[INFERRED]` |
| 3 | **Create Accounting** — Each subledger's Create Accounting applies the accounting method and transfers journals to GL; for Mexico it writes primary and secondary journals together. | Subledgers | Create Accounting | Accounting events → Subledger journals in GL |  |  | `[ORA26C:SLA p.7, 13]` `[ORA26C:GL p.301]` |
| 4 | **Payroll and treasury journals** — The external payroll provider and treasury send journal files (see Boundary journals). | Boundary systems |  | Journal file |  |  | `[ORA26C:GL p.568]` |
| 5 | **Import and post journals** — Feeder and spreadsheet journals come through GL_INTERFACE; journals are approved and posted. | General Ledger | Import Journals; Journal approval; Post Journals | Subledger and feeder journals → Posted journals |  |  | `[ORA26C:GL p.568]` |
| 6 | **Intercompany** — Intercompany balancing adds due-to and due-from lines between FBCo US and FBCo México, and balances journals across companies 101 and 102 inside the US ledger through the clearing company; intercompany allocations and transactions are completed (see Intercompany). | General Ledger | Generate Intercompany Allocations | Posted journals → Balanced intercompany |  |  | `[ORA26C:GL p.373, 374, 389]` |
| 7 | **Allocations** — Plant overhead and shared services are allocated (see Allocations). | General Ledger | Generate General Ledger Allocations | Pools → Allocation journals |  |  | `[ORA26C:GL p.389, 559]` |
| 8 | **Revalue** — Foreign-currency balances are revalued at the period-end rate (see FX). | General Ledger | Revalue Balances | Foreign-currency balances → Unrealised gain or loss |  |  | `[ORA26C:GL p.530]` |
| 9 | **Secondary and reporting** — The MX secondary ledger and the USD reporting currency are complete once the primary ledger's journals and revaluation post. | MX secondary · reporting | Review the secondary ledger and reporting currency | MX primary journals → Statutory and USD views |  |  | `[ORA26C:GL p.301, 302, 533]` |
| 10 | **Translate** — Balance-level translation where a translated view is needed. | General Ledger | Translate General Ledger Account Balances | MX balances → Translated balances, CTA |  |  | `[ORA26C:GL p.533]` |
| 11 | **Close the periods** — The ledgers' periods are closed. | General Ledger | Open and Close Periods | Final balances → Closed period |  |  | `[ORA26C:GL p.320]` `[INFERRED]` |
| 12 | **Load FCCS** — GL balances are loaded into FCCS (see Consolidation). | EPM (FCCS · ARCS) | Run Integration | Trial balances → FCCS data |  |  | `[ORA26C:EPMDI p.434, 435]` |
| 13 | **Consolidate** — FCCS translates and eliminates intercompany and produces consolidated results. | EPM (FCCS · ARCS) | Consolidate | Entity data → Consolidated BS and P&L |  |  | `[ORA26C:FCCS p.585, 591]` |
| 14 | **Reconcile accounts** — Balance-sheet reconciliations are prepared and reviewed (see Account reconciliation). | EPM (FCCS · ARCS) | Reconciliation Compliance | Balances → Reviewed reconciliations |  |  | `[ORA26C:ARCS p.69]` |
| 15 | **Report BS and P&L** — Consolidated statements from FCCS; ledger-level statements from Financial Reporting on the USD ledger set, and by company (101, 102, 201) for each business unit. Data access sets by primary balancing segment value let each US business unit's accountants work on their own company. | EPM (FCCS · ARCS) | Financial reports | Consolidated results → Balance sheet, P&L |  |  | `[ORA26C:GL p.135, 136]` `[ORA26C:FCCS p.585]` |

Hand-offs: Open the period → Close subledgers in order; Close subledgers in order → Create Accounting; Create Accounting → Import and post journals (subledger journals); Payroll and treasury journals → Import and post journals (GL_INTERFACE); Import and post journals → Intercompany; Intercompany → Allocations; Allocations → Revalue; Revalue → Secondary and reporting (propagate); Secondary and reporting → Translate; Translate → Close the periods; Close the periods → Load FCCS (balances); Load FCCS → Consolidate; Consolidate → Reconcile accounts; Reconcile accounts → Report BS and P&L.

## 2. Boundary journals

Journals from outside Oracle: the external payroll provider, and treasury (deals and bank interest). They arrive as files in the Journal Import format.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Payroll journal file** — The payroll provider sends summarised journals per pay run (HCM is out of scope). | Payroll · treasury |  | Journal file (Journal Import template) |  |  | `[ORA26C:GL p.568]` `[INFERRED]` |
| 2 | **Treasury journals** — Treasury sends journals for deals and interest not created in Cash Management. | Payroll · treasury |  | Journal file |  |  | `[ORA26C:GL p.568]` `[INFERRED]` |
| 3 | **Load to GL_INTERFACE** — The file is uploaded to UCM and loaded into GL_INTERFACE, by hand or through the ERP Integrations REST resource (importBulkData). | ERP integration | Load Interface File for Import | Journal file → GL_INTERFACE rows |  |  | `[ORA26C:GL p.568]` |
| 4 | **Import Journals** — Import Journals validates and creates the journal batches. | General Ledger | Import Journals | GL_INTERFACE rows → Journal batches |  |  | `[ORA26C:GL p.568]` |
| 5 | **Approve and post** — Journals are approved and posted. | General Ledger | Journal approval; Post Journals | Journal batches → Posted balances | Payroll journal: Dr Salaries and wages expense / Cr Payroll liabilities, Cash (net pay) |  | `[ORA26C:GL p.568]` `[INFERRED]` |

Hand-offs: Payroll journal file → Load to GL_INTERFACE (file); Treasury journals → Load to GL_INTERFACE (file); Load to GL_INTERFACE → Import Journals; Import Journals → Approve and post.

**Bank fees and interest.** Fees and interest that appear on the bank statement are created in Cash Management as external transactions and accounted there (see Treasury › Bank statement to reconciliation).

## 3. Intercompany

Charges between FBCo US and FBCo México that are not trade (for example management fees): an intercompany transaction, invoices or journals in both entities, and reconciliation.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Enter transaction** — The provider enters an intercompany batch with a transaction type; batches are numbered automatically or manually. | Provider (US) | Create intercompany batch | Charge to the receiver → Intercompany transaction |  |  | `[ORA26C:GL p.367, 368]` |
| 2 | **Receiver approves** — The receiver is notified and approves the transaction. | Intercompany | Intercompany transaction approval | Transaction → Approved transaction |  |  | `[ORA26C:GL p.464]` |
| 3 | **Provider invoice** — Where the transaction type requires invoicing, it is transferred to Receivables (memo line per transaction type). | Receivables (provider) | Transfer Intercompany Transactions to Receivables | Approved transaction → Intercompany invoice | Provider: Dr Intercompany receivable / Cr Intercompany revenue (management fee) |  | `[ORA26C:GL p.371, 372]` `[INFERRED]` |
| 4 | **Receiver invoice** — The matching payable is created in the receiver. | Payables (receiver) | Transfer Intercompany Transactions to Payables | Approved transaction → Intercompany payable | Receiver: Dr Management fee expense / Cr Intercompany payable |  | `[ORA26C:GL p.370]` `[INFERRED]` |
| 5 | **Or journals only** — Types that don't need invoices are transferred to GL as journals; intercompany balancing rules add the due-to and due-from lines. | General Ledger | Transfer Intercompany Transactions to General Ledger | Approved transaction → Journals in both ledgers | Journal across companies: Dr Intercompany receivable (due from) / Cr Intercompany payable (due to) |  | `[ORA26C:GL p.370, 373]` |
| 6 | **Reconcile** — Intercompany receivables and payables are agreed between the two ledgers before close. | General Ledger | Intercompany reconciliation reports | Balances → Agreed balances |  |  | `[ORA26C:GL p.373]` `[INFERRED]` |
| 7 | **Eliminate** — FCCS eliminates the intercompany balances through plug accounts. | FCCS | Consolidate | Intercompany balances → Eliminated |  |  | `[ORA26C:FCCS p.591]` |

Hand-offs: Enter transaction → Receiver approves (batch); Receiver approves → Provider invoice (invoice type); Receiver approves → Receiver invoice (invoice type); Receiver approves → Or journals only (journal type); Provider invoice → Reconcile; Receiver invoice → Reconcile; Or journals only → Reconcile; Reconcile → Eliminate (balances).

**Within FBCo US.** Charges between US Manufacturing BU (101) and US Distribution BU (102) are journals in one ledger. The same balancing rules apply; set the clearing company option (use the clearing company for intracompany journals) so many-to-many journals don't error. No invoices and no consolidation elimination are needed.

**Rule levels.** Balancing rules are defined by primary balancing segment value, legal entity, ledger or chart of accounts, in that order of precedence.

## 4. Allocations

Plant overhead spread to product lines by production volume, and shared services (procurement and finance in US Manufacturing BU) spread by headcount: to US Distribution BU within the US ledger, and to FBCo México across legal entities.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Allocation rule** — Rules define the pool, the basis and the target accounts. | Calculation Manager | Define allocation rules | Pools and bases → Rule set |  |  | `[ORA26C:GL p.559, 578]` |
| 2 | **Generate allocations** — Calculates the allocation and, if Post Allocations is selected, books it through Journal Import. An allocation from company 101 to 102 stays in the US ledger: balancing adds the intracompany lines through the clearing company. | General Ledger | Generate General Ledger Allocations | Rule set, Balances → Allocation journals | Allocate plant overhead: Dr Product-line expense / Cr Overhead pool (allocation offset)<br>Shared services 101 → 102 (INFERRED accounts): Dr Shared services expense (102), Intracompany receivable (101) / Cr Shared services pool (101), Intracompany payable (102) |  | `[ORA26C:GL p.374, 389, 390]` |
| 3 | **Cross-entity allocations** — Allocations across legal entities create intercompany transactions: one batch per provider, one transaction per receiver. | Intercompany | Generate Intercompany Allocations | Rule set → Intercompany transactions |  |  | `[ORA26C:GL p.389, 390]` |
| 4 | **Post** — Allocation journals post to the ledger. | General Ledger | Post Journals | Journals → Allocated balances |  |  | `[ORA26C:GL p.389]` |

Hand-offs: Allocation rule → Generate allocations (rule set); Allocation rule → Cross-entity allocations (cross-entity); Generate allocations → Post (journals); Cross-entity allocations → Post (intercompany).

## 5. FX: revaluation and translation

Mexico buys some ingredients in USD and the US holds MXN intercompany balances: revaluation at period end, reporting currency conversion and translation.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Daily and period rates** — Rates are loaded daily and at period end. | Rates source | Import Daily Rates | Rates |  |  | `[ORA26C:GL p.293]` |
| 2 | **Revalue Balances** — Foreign-currency balances (USD payables in Mexico, MXN intercompany in the US) are revalued; the result is unrealised gain or loss. | General Ledger | Revalue Balances | Foreign-currency balances, Period-end rate → Revaluation journal | Revaluation loss: Dr Unrealized loss / Cr Payable (ledger-currency adjustment)<br>Revaluation gain: Dr Receivable (ledger-currency adjustment) / Cr Unrealized gain |  | `[ORA26C:GL p.530]` |
| 3 | **Reporting currency** — MX journals are converted to USD as they post into the reporting currency. | MX reporting currency | Post Journals | MX journals → USD journals |  |  | `[ORA26C:GL p.533]` |
| 4 | **Translate** — Balances are translated at period-end and average rates; equity uses historical rates; the difference goes to the cumulative translation adjustment. | General Ledger | Translate General Ledger Account Balances | MX balances, Historical rates → Translated balances | Translation difference: Dr Translated balances (net) / Cr Cumulative translation adjustment (equity) |  | `[ORA26C:GL p.530, 533]` |

Hand-offs: Daily and period rates → Revalue Balances (rates); Revalue Balances → Reporting currency (converted); Daily and period rates → Translate (rates); Revalue Balances → Translate.

## 6. Consolidation in FCCS

GL trial balances go to FCCS through Data Integration; FCCS consolidates from local currency through translation to eliminations.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Closed trial balances** — Final balances after the ledger close. | General Ledger | Close periods | Posted journals → Trial balances |  |  | `[ORA26C:GL p.135]` |
| 2 | **Source and mappings** — The ERP connection and the GL application are registered; segments map to FCCS dimensions and members. | Data Integration | Register source; Map dimensions; Map members | Chart of accounts → Integration definition |  |  | `[ORA26C:EPMDI p.434]` |
| 3 | **Run integration** — The integration extracts the GL balances and loads them into FCCS, with filters and adjustment periods. | Data Integration | Run Integration | Trial balances → Entity data in FCCS |  |  | `[ORA26C:EPMDI p.435]` |
| 4 | **Local currency** — Opening balances carry forward; movements are calculated; the balance sheet is balanced; local-currency rules run. | FCCS | Consolidate (local currency) | Entity data → Local-currency results |  |  | `[ORA26C:FCCS p.585, 586]` |
| 5 | **Translate** — Entity data is translated to the parent currency; differences go to the CTA account. | FCCS | Translation | MXN results → USD results, CTA |  |  | `[ORA26C:FCCS p.594, 51]` |
| 6 | **Eliminate and consolidate** — Intercompany balances are eliminated through plug accounts, and configurable consolidation rules run. | FCCS | Consolidate | Translated data → Consolidated results |  |  | `[ORA26C:FCCS p.591, 585]` |
| 7 | **Reports** — Consolidated balance sheet and P&L. | FCCS | Financial reports | Consolidated results → Statements |  |  | `[ORA26C:FCCS p.585]` |

Hand-offs: Closed trial balances → Run integration (balances); Source and mappings → Run integration (mappings); Run integration → Local currency (load); Local currency → Translate; Translate → Eliminate and consolidate; Eliminate and consolidate → Reports.

## 7. Account reconciliation (ARCS)

Reconciliation Compliance runs a six-step process each period for balance-sheet accounts.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Balances** — GL and subsystem balances are available. | General Ledger |  | Balances |  |  | `[ORA26C:ARCS p.69]` |
| 2 | **Load data** — Balances load from a file or through Data Integration or Data Management. | ARCS | Load data | Balances → Reconciliations with balances |  |  | `[ORA26C:ARCS p.69]` |
| 3 | **Auto reconcile** — Reconciliations for zero-balance accounts, or where source and subsystem balances match, complete automatically. | ARCS | Auto reconciliation; Auto Match | Balances → Auto-reconciled |  |  | `[ORA26C:ARCS p.69]` |
| 4 | **Notify and prepare** — Preparers are notified and justify the balance with reconciling items, explanations and attachments. | ARCS | Prepare | Open reconciliations → Prepared reconciliations |  |  | `[ORA26C:ARCS p.69, 70]` |
| 5 | **Review** — Reviewers approve, monthly, quarterly or when risk conditions are detected. | ARCS | Review | Prepared reconciliations → Approved reconciliations |  |  | `[ORA26C:ARCS p.69, 70]` |
| 6 | **Monitor** — Dashboards show progress and late work. | ARCS | Monitor | Status → Close sign-off |  |  | `[ORA26C:ARCS p.69]` |

Hand-offs: Balances → Load data (balances); Load data → Auto reconcile; Auto reconcile → Notify and prepare (exceptions); Notify and prepare → Review (submitted); Review → Monitor.
