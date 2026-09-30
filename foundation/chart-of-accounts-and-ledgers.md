---
id: FND-COA
type: foundation
aliases: [Corp_COA_Structure, COA, ledgers, ledger sets, CVR, calendar, exchange rates]
as_of: 2026-09-29
blast_radius: highest — changes here fan out to every workstream
---

# Shared Foundation: Chart of Accounts, Ledgers, Calendars, Rates

## Chart of accounts — `Corp_COA_Structure` `[CO:01 §4, 03 §2]`

| # | Segment | Example | Example meaning | Notes |
|---|---|---|---|---|
| 1 | Legal Entity | `1100` | Company, Inc. | Primary balancing segment `[INFERRED]`; others: `3300` Company Australia, `8800` Foundation entity |
| 2 | Sub Business Unit | `1001` | Central Functions | Used in spend approval matrix (some rules by sub-SBU) |
| 3 | Cost Center | `700214` | CC02-14 | Approval routing, allocations, ARCS/FCCS |
| 4 | Account | `65000` | Expensed Software and Equipment | Natural account, 5 digits |
| 5 | Sub Account | `SC0013` | Software Services & Subscriptions | Also the key of Zip spend-category mapping |
| 6 | Intercompany | `0000` | No counterparty | |
| 7 | Geo | `61` | Office — USA — San Francisco | |
| 8 | Project | `000000` | Unassigned | |
| 9 | Future | `000000` | Reserved | |

- Country-specific chart instances exist where statutory needs require (e.g. `CO_COA_INSTANCE_FR`). `[CO:03 §2]`
- Consumers of the COA: Zip lookups, T&E apps, Magnit/Upwork, Planning, FCCS, ARCS, Alteryx, Salesforce/Ironclad, Finance Warehouse. `[CO:01 §4]`
- Oracle basis: segment value hierarchies are used for chart-of-accounts mappings, revaluations, data access sets, CVRs, segment value security, balances cube, Smart View and allocations. `[ORA26C:implementing-enterprise-structures-and-general-ledger p.81]` Every change to the structure instance requires recompile. `[ORA26C:… p.276]`

## Cross-validation rules
- Block illegal combinations at source; examples `CVR209` (restricts SC0230), `CVR241` (restricts SC0430) to specific natural accounts. `[CO:02 §3]`
- Enforced at: requisition entry, invoice distribution, journal import, FBDI loads. `[CO:01 §4]`
- Oracle 26C: CVRs prevent creation of combinations with values that can't coexist; they apply to *new* combinations created dynamically via UI, processes or REST; based on condition and validation filters; cross-validation combination sets support up to five segments. `[ORA26C:… p.201, 204]`
- Operational gotcha: journal imports can reject combinations that violate a CVR **even at zero ending balance** (seen during asset clearing migration 10490 → 14550). `[CO:03 §3.1, §3.3]`
- Authoritative record: General Ledger configuration workbook (production). Setup: *Manage Cross Validation Rules*. `[CO:02 §7]`

## Ledgers
| Object | Company | Evidence |
|---|---|---|
| Primary ledger | US GAAP | `[USER:2026-09-29]` |
| Secondary ledgers | STAT and TAX | `[USER:2026-09-29]` |
| Secondary data conversion level | **Unknown** (Oracle options: Balance, Journal, Subledger, Adjustment Only) | `[ORA26C:… p.301–302]` → Q-LED-2 |
| Reporting currencies | Present (reporting-currency balances loaded to ARCS/FCCS) — conversion level unknown | `[CO:03 §3.5]` `[ORA26C:… p.303]` |
| Ledger sets | e.g. `Company CSL GAAP USD LS` for consolidated reporting | `[CO:01 §4]`; Oracle: ledger sets manage period open/close and run reports/processes across ledgers sharing COA, calendar and period type `[ORA26C:… p.411]` |
| Balances cube | Essbase GL balances cube per COA/calendar combination; used for reporting | `[ORA26C:… p.75]` |

## Journal sources, categories and posting locks `[CO:03 §2]`
- **Sources** identify provenance: `Manual`, `Spreadsheet`, `AutoCopy`, `EIB Journals`, `FBDI Journals`, `Boomerangs` (intercompany balancing), one per FAH subledger (e.g. `FAH-Ramp`).
- **Categories** drive approval. `Allocations` is normally frozen against manual entry; reopening requires extending the journal approval rule to additional sources (deliberate, documented act).
- Some accounts are **locked against manual posting** (documented example: `75000`); unlocking is part of the prior-period reopen procedure.
- Oracle basis: journal approval rules are set up via *Manage Journal Approval Rules* `[ORA26C:… p.23]`; secondary ledger journal conversion rules operate by source/category `[ORA26C:… p.301]`.

## Business units
Procurement and Payables BUs carry their own invoice tolerances and approval configuration. `[CO:01 §4]` Oracle: tolerances are set per BU through invoice options and supplier-site defaults (quantity- and amount-based). `[ORA26C:implementing-payables-invoice-to-pay p.42, 92–93]`

## Enterprise-structure crosswalk (company codes) `[CO:INT055A-spec App. 6.1]`
Table `XXCO_ENTERPRISE_STRUCTURE` (ATP) maps Workday/Apex company code `CO<nnn>` → Oracle LE identifier, ledger, procurement BU, requisitioning (client) BU, bill-to (Payables) BU, ship-to location. Patterns:
- LE identifier = first digit block + company number, e.g. `CO100`→`1100` Company, Inc.; `CO300`→`3300` Company Australia; `CO508`→`5508` Company Plataforma Digital; `CO800`→`8800` Foundation entity.
- Ledger naming `<ISO3> Primary <CCY>` (e.g. `USA Primary USD`, `BRA Primary BRL`); payments entities have their own (e.g. `IND Primary USD Payments`).
- Procurement BU is **`Global Proc CO BU`** for all entities; bill-to BU `<ISO3> <CCY> CO BU`; requisitioning BU = LE name.
- PPR names use `CO`+Oracle LE code (e.g. `AP RUN CO1100 …`, `AP RUN CO5501 …`). `[DATA]`
No crosswalk row ⇒ INT055A cannot create a supplier site for that entity — part of new-LE fan-out.

## Legal entities
- Company segment values; new-entity build-out is a standing workstream that fans out to GL, P2P, Zip, T&E, Magnit/Upwork, AR/Cash/Tax, FCCS, Planning, Alteryx, platform extracts. See `processes/master-data-fanout.md`.
- 31 LEs had AP invoice activity in the 12 months to mid-Sep 2026. `[CO:02 §4 Stage 06]`

## Accounting method
`CORP_GAAP_SLAM`, applied across all subledger applications including every FAH source. `[CO:01 §4]` Oracle: Create Accounting uses the accounting method with active journal entry rule set assignments; modifying any component makes the method *Incomplete* until reactivated. `[ORA26C:implementing-subledger-accounting p.16]`

## Calendars
- Twelve-month fiscal calendar (monthly). India-specific calendar carried in ARCS. FCCS periods opened on the 25th. `[CO:01 §4]`
- FCCS has a twelve-period year with HYTD enabled. `[CO:03 §3.6]` `[ORA26C:EPM FCCS p.49]`

## Exchange rates
- Corporate, spot, month-end and average rates; loaded via `INT156`. `[CO:01 §4]`
- `epm_load_month_end_and_average_rates_to_fccs` runs daily 17:00 UTC from the 26th to the 1st so FCCS and ERP reporting-currency balances agree. `[CO:03 §3.6]`
- Consumers: revaluation, translation, **invoice tolerances** (manual monthly recalculation — audit risk), FCCS CTA.
