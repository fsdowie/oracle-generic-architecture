---
id: MFG-FOUNDATION
type: foundation
title: Enterprise structure and ledgers — FBCo
links: [MFG-OVERVIEW, MFG-R2R, MFG-CLOSE]
---

# Enterprise structure and ledgers

## Structure
The map's **Enterprise structure** tab draws this, adapted from Oracle's InFusion example (two divisions, legal
entities with their ledgers, business units with a shared-services BU, balancing segment values, inventory
organisations and a common item master) `[ORA26C:GL p.18-19]`.

| Object | FBCo US | FBCo México | Evidence |
|---|---|---|---|
| Enterprise | FBCo: corporate chart, calendar, common reference data set, one item master | (shared) | `[ORA26C:GL p.34-36, 40]` |
| Division (management structure) | FBCo US Division | FBCo México Division | `[ORA26C:GL p.11, 13]` |
| Legal entity | FBCo US Inc. | FBCo México S.A. de C.V. | `[ORA26C:GL p.290]` |
| Business units (profit centres) | **US Manufacturing BU** (US plant; Procurement Services BU for the US) and **US Distribution BU** (distribution centre, US sales) | MX BU | `[ORA26C:GL p.628-630]` `[ORA26C:PRC p.203-205]` |
| Balancing segment values (Company) | 101 (US plant), 102 (US distribution) | 201 | `[ORA26C:GL p.59]` `[INFERRED]` values |
| Inventory organisations | US plant, US distribution centre | MX plant | `[ORA26C:MFG p.364]` |
| Cost organisation and cost book | US plant cost org and US DC cost org (primary cost book, standard cost) | MX cost org (primary cost book, perpetual average) | `[ORA26C:MFG p.364, 367]` |
| Item master | One item organisation (no on-hand, no financial transactions) for all three inventory organisations | (shared) | `[ORA26C:SCM p.260, 273-274]` |
| Chart of accounts | Corporate chart: Company, Cost centre, Account, Product line, Intercompany, Future | same corporate chart | `[ORA26C:GL p.290]` |

### Divisions
Divisions are part of the management structure, "implemented using divisions and business units as well as being
reflected in the chart of accounts" `[ORA26C:GL p.13]`. There is no division object in the ledger: FBCo US Division is
represented by the two US business units and company values 101 and 102, and FBCo México Division by the MX BU and 201.

### Business units
- Each business unit posts to a single primary ledger and has a default legal entity `[ORA26C:GL p.629]`. Both US BUs post
  to the US primary ledger; the MX BU posts to the MX primary ledger.
- An inventory organisation is managed by a single business unit and belongs to one legal entity `[ORA26C:GL p.59]`.
- **Procurement Services.** US Manufacturing BU "processes requisitions and negotiates supplier terms for client
  business units". US Distribution BU is its client for requisitioning and Payables invoicing `[ORA26C:PRC p.203-205]`.
  Supplier sites are assigned to both US invoicing BUs `[ORA26C:PRC p.82]`. This is FBCo's counterpart of BU 4 in the
  InFusion example.
- **Reference data.** The common set holds shared setup such as payment terms. Customer sites need BU-specific sets
  `[ORA26C:GL p.34-36]` `[ORA26C:AR p.28]`. A customer payments servicing BU is possible only within one ledger
  `[ORA26C:AR p.161]`.
- **Cost organisations.** The inventory organisations in a cost organisation must all belong to the same profit centre
  BU, so the US plant and the distribution centre are valued by separate cost organisations `[ORA26C:MFG p.364, 367]`.

### Balancing segment values
| Company value | Business unit | Legal entity | Ledger |
|---|---|---|---|
| 101 | US Manufacturing BU | FBCo US Inc. | US primary |
| 102 | US Distribution BU | FBCo US Inc. | US primary |
| 201 | MX BU | FBCo México S.A. de C.V. | MX primary (and its secondary ledger and reporting currency) |

The values are mock values `[INFERRED]`. A legal entity can be mapped to one or more balancing segment values, and
"once you assign one balancing segment value in a ledger, then all your balancing segment values must be assigned"
`[ORA26C:GL p.59]`. Data access sets can grant access by primary balancing segment value, so each US BU's accountants
work on their own company `[ORA26C:GL p.135-136]`. The guides don't describe a default balancing segment value for a
business unit; FBCo's derivation of 101 or 102 from the BU is `[INFERRED]` (for example, through SLA account rules).

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

- **Asset books.** Each primary ledger has a corporate asset book. A tax book is copied from its corporate book and
  can be assigned to a secondary ledger of that book's ledger, so FBCo México keeps its statutory asset values in the
  MX secondary ledger `[ORA26C:FAI p.22]`. *Perform Periodic Mass Copy* copies additions into the tax book, and
  Payables and Assets use the same conversion rate so asset clearing clears in both ledgers `[ORA26C:FA p.30-32]`.

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

## Intercompany and intracompany
- Intercompany balancing rules generate the due-to/due-from lines when a journal crosses balancing segment values
  `[ORA26C:GL p.373-397]`.
- **Intracompany (101 ↔ 102).** Transactions that cross balancing segments don't necessarily cross legal entities
  `[ORA26C:GL p.60]`. Journals across 101 and 102 are balanced by the same rules (levels: primary balancing segment value,
  legal entity, ledger, chart of accounts). FBCo sets the clearing company option "use clearing company only for
  intracompany journals"; the default, "error out if many-to-many journal", would reject them `[ORA26C:GL p.373-375, 381]`.
- **Plant to distribution centre.** The US plant and the DC are profit centres of one legal entity, so a transfer
  between them is an *intracompany* financial orchestration flow `[ORA26C:MFG p.585]` `[ORA26C:SCFO p.7]`. The transfer
  price comes from the transfer pricing rules for the financial route `[ORA26C:MFG p.46]`. "An intracompany trade ...
  might not require an intercompany invoice ... a trade distribution in cost accounting handles the accounting for the
  receivables and payable balances" `[ORA26C:MFG p.591]`. The account names in the workflow are `[INFERRED]`.
- Supply Chain Financial Orchestration covers trade between FBCo México and FBCo US. It applies transfer pricing and
  creates the intercompany receivable and payable invoices, separate from the physical movement of goods
  `[ORA26C:SCFO p.3]` `[ORA26C:MFG p.585]`.
