---
id: MFG-FOUNDATION
type: foundation
title: Enterprise structure and ledgers — FBCo
links: [MFG-OVERVIEW, MFG-R2R, MFG-CLOSE]
---

# Enterprise structure and ledgers

## Structure
| Object | FBCo US | FBCo México | Evidence |
|---|---|---|---|
| Legal entity | FBCo US Inc. | FBCo México S.A. de C.V. | `[ORA26C:GL p.290]` |
| Business unit (Payables, Receivables, Procurement, profit centre) | US BU | MX BU | `[ORA26C:GL p.290]` |
| Inventory organisations | US plant, US distribution centre | MX plant | `[ORA26C:MFG p.364]` |
| Cost organisation and cost book | US cost org (primary cost book, standard cost) | MX cost org (primary cost book) | `[ORA26C:MFG p.364]` |
| Chart of accounts | Corporate chart: Company, Cost centre, Account, Product line, Intercompany, Future | same corporate chart | `[ORA26C:GL p.290]` |

## Ledgers
| Ledger | Currency | Chart of accounts | Accounting method | How it gets its data | Evidence |
|---|---|---|---|---|---|
| US primary ledger | USD | Corporate | Standard Accrual (US GAAP) | Subledgers through Create Accounting; journals | `[ORA26C:GL p.301]` |
| MX primary ledger | MXN | Corporate | Standard Accrual (US GAAP policies) | Subledgers through Create Accounting; journals | `[ORA26C:GL p.301]` |
| MX secondary ledger | MXN | Mexican statutory chart (SAT grouping code), through a chart of accounts mapping | Local (Mexican Financial Reporting Standards) | **Subledger level**: Create Accounting writes journals to the primary and the secondary ledger at the same time; GL journals are copied when posted | `[ORA26C:GL p.301-302]` |
| MX reporting currency | USD | Corporate (same as its source ledger) | Same as the MX primary ledger | **Journal level**: each posted MX primary journal is converted to USD as it posts | `[ORA26C:GL p.302, 533]` |

The guide's conversion levels:
- **Secondary ledger.** The data conversion level is Balance, Journal, Subledger or Adjustment Only.
  - Subledger level creates subledger journals for both ledgers when Create Accounting runs.
  - Journal level copies journals when they post.
  - Balance level transfers balances through *Transfer Balances to Secondary Ledger*.
  
  `[ORA26C:GL p.301]`
- **Reporting currency.** The currency conversion level is Balance, Journal or Subledger. At Balance level,
  *Translate General Ledger Account Balances* restates balances into the reporting currency `[ORA26C:GL p.533]`.
- **Same currency.** The guide recommends using the same currency for the primary and secondary ledger, and producing
  other currency views through reporting currencies or translation `[ORA26C:GL p.302]`. That is why the MX secondary
  ledger stays in MXN.
- **Subledger level added mid-stream.** If a subledger-level secondary ledger is added while transactions are in
  flight, some of them may never be accounted in it. The guide suggests journal level unless subledger level is
  required `[ORA26C:GL p.301-302]`. FBCo needs it here because the statutory accounting method differs.

## Chart of accounts mapping
- The corporate chart maps to the Mexican statutory chart through **segment rules and account rules**
  (*Manage Chart of Accounts Mapping*).
- Segment rules can be loaded with the Chart of Accounts Mapping Rules Import (`GL_COA_MAP_SEGMENT_RULES_INT`) `[ORA26C:GL p.108-111]`.

## Consolidation views
- **Ledger set.** A ledger set groups the US primary ledger and the MX reporting currency (both USD), so close
  processes and reports run once across both `[ORA26C:GL p.135, 302]`.
- **Translation.** Translation and revaluation post differences to the **cumulative translation adjustment**
  (equity) or to unrealized gain/loss accounts `[ORA26C:GL p.530, 533]`.
- **Group consolidation** (eliminations, ownership) can run in FCCS. EPM is out of scope for this map `[INFERRED]`.

## Intercompany
- Intercompany balancing rules generate the due-to/due-from lines when a journal crosses balancing segment values
  `[ORA26C:GL p.373-397]`.
- Supply Chain Financial Orchestration covers trade between FBCo México and FBCo US. It applies transfer pricing and
  creates the intercompany receivable and payable invoices, separate from the physical movement of goods
  `[ORA26C:SCFO p.3]` `[ORA26C:MFG p.585]`.
