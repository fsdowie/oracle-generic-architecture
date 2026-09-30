---
id: KP-GLOSSARY
type: glossary
as_of: 2026-09-29
---

# Glossary, ID Conventions and Naming Patterns

## Organisations and teams

| Term | Meaning |
|---|---|
| FTG | Finance Technology Group (Finance Systems). Owns Oracle Fusion functional configuration, EPM, Airflow loads; owns *delivery*, not business outcomes. |
| BizTech Finance Integrations / ETG Integrations | Team that builds and changes OIC integrations (e.g. INT959 change FIN-24752). |
| the implementation project (FIN) | Jira project for Finance Systems work and the auto-raised `PROD \| ERROR \| INT###` monitoring tickets. Components mirror the estate: Intake, Requisition-to-PO, Invoice-to-Pay, Suppliers, GL Accounting, Consol & Close, InterCo & TP. |
| FSYS | Finance Systems Jira project (used alongside FIN). |
| ITE | Jira project holding Level-1 Initiatives. |
| Procurement Ops | Procurement operations team handling most PO change orders from Jira tickets. |
| Treasury Operations | Releases urgent/one-time payments manually in Kyriba; owns bank relationships. |
| the payment-factory consultant | Kyriba-side consulting partner (bank formats, payment-code configuration). |
| the SI partner BR100 | Configuration workbooks (Purchasing, Payables, GL, FCCS, ARCS) — authoritative configuration records. |
| Consolidation team | Runs Consolidate/Translate in FCCS and drives the tail of the close. |
| Sprint leads | the P2P sprint lead (PTP), the R2R sprint lead (RTR), the reconciliation sprint leads (ReconArt). |

## Company programme / platform names

| Term | Meaning |
|---|---|
| Payments Platform | Company payments platform; largest FAH source (~2M transactions/day). |
| Event Enrichment | Event normalisation/enrichment layer in front of FAH. |
| Secondary-Products Ledger | FAH source for secondary Payments Platform products, split out for ASC 606. |
| Hub modernisation | In-flight Accounting-Hub-as-a-service modernisation (not current state). |
| Finance Warehouse | Finance data warehouse (with FinBI, Snowflake). |
| internal BI / Superset / Tableau | Reporting/BI tools over the warehouse. |
| Treasury Immediate Payments | Treasury programme that extended the Oracle supplier registration form to urgent/ad hoc payees. |
| Urgent Payment Tool | Oracle-side tool (Company-built) for urgent, one-time, penny-test, legal-settlement and political-contribution payments; manually released by Treasury in Kyriba. `[UNVERIFIED — mechanism not documented]` |

## Oracle terms (26C) as used at Company

| Oracle term | Company usage | Evidence |
|---|---|---|
| Supplier Registration Request (internal) | How ad hoc / non-PO / Treasury suppliers are created; approved via *Manage Internal Supplier Registration Approvals* | `[ORA26C:implementing-procurement p.343]` `[USER:2026-09-29]` |
| Configure Supplier Registration | Setup task controlling registration form sections/requiredness | `[ORA26C:implementing-procurement p.347]` |
| VB Studio express mode business rules | Used to make registration attributes required/hidden/read-only (ER.1 address rule) | `[ORA26C:implementing-procurement p.733]` |
| Transaction Account Builder (TAB) | Derives default accounts for Purchasing (requisition/PO charge accounts) and Intercompany before accounting | `[ORA26C:implementing-procurement p.648–651]` |
| Accounting method | `CORP_GAAP_SLAM`; groups journal entry rule sets per subledger/event class | `[ORA26C:implementing-subledger-accounting p.15–16]` |
| Mapping set | Input value → segment/account value table (e.g. `EXP_CAT_GL_ACCT`, `SA_AIA_BANK_ACCOUNT_MAP`) | `[ORA26C:implementing-subledger-accounting p.31–33]` |
| Cross-validation rule (CVR) | Blocks illegal segment combinations (e.g. `CVR209`, `CVR241`) | `[ORA26C:implementing-enterprise-structures-and-general-ledger p.201, 204]` |
| Secondary ledger | STAT and TAX ledgers (GAAP is primary) | `[ORA26C:…general-ledger p.301]` `[USER:2026-09-29]` |
| Ledger set | Groups ledgers sharing COA/calendar for period open/close and reporting | `[ORA26C:…general-ledger p.411]` |
| Payment Process Request (PPR) / PPR template | Payment run selecting validated invoices; templates by LE / pay group / bank account (stored in `AP_PAYMENT_TEMPLATES`) | `[ORA26C:implementing-payables-invoice-to-pay p.168, 173]` |
| Payment process profile | Controls payment file format/transmission per payment method and bank account | `[ORA26C:implementing-payables-invoice-to-pay p.170, 193]` |
| Disbursement acknowledgment | Oracle Payments standard acknowledgement processing, incl. an *Automatic Voiding Option* for rejected payments | `[ORA26C:implementing-payables-invoice-to-pay p.220]` |
| Invoice tolerances | Quantity- and amount-based tolerance sets that drive matching holds | `[ORA26C:implementing-payables-invoice-to-pay p.92–93]` |
| Approval Unit (FCCS) | Process-management unit locked at period close | `[ORA26C:EPM FCCS p.68]` |
| Task Manager (FCCS) | Close checklist (`FPC07`, `FPC08`…) | `[ORA26C:EPM FCCS p.21 TOC, ch.27]` |
| Profile / Profile segment (ARCS) | Reconciliation unit keyed by account-ID segments | `[ORA26C:ARCS Admin p.47]` |
| Unmapped Accounts (ARCS) | Oracle's term for what FTG calls *invalid mappings* — balances with no profile | `[ORA26C:ARCS Admin p.254]` |
| Auto-Reconciliation Methods (ARCS) | Conditions under which a reconciliation auto-closes | `[ORA26C:ARCS Admin p.155–156]` |

## ID conventions

| Pattern | Meaning | Example |
|---|---|---|
| `INT###[A-Z]` | OIC / integration identifier as used in production monitoring | `INT955B`, `INT110AA` |
| `API###` | API-style integration | `API157` Workday Finance → FAH |
| `REP###[-X]` | Custom BI Publisher / FCCS report | `REP627`, `REP103-A` |
| `CVR###` | Cross-validation rule | `CVR209` |
| `SC####` | Sub-account (segment 5) value; also the spend-category key in Zip lookups | `SC0013` |
| `FIN-#####` / `FSYS-#####` | Jira keys | `FIN-24137` |
| `ER.n` | Enhancement/business requirement row within an Epic register | `ER.1` |
| `FPC##` | FCCS period-close task | `FPC07` |
| `*_VAL` | Company requisition validation rule names | `BU_SPEND_CATEGORY_VAL` |
| `PO` + 10 digits | Valid Oracle PO number | `PO1100005406` (first 4 digits = company) |
| `REQ` + 10 digits | Requisition number (not valid where a PO is expected) | `REQ1100007646` |

## Observed naming patterns in operational data `[DATA:payments-status/*.xlsx, int826 logs]`

| Object | Pattern | Examples |
|---|---|---|
| PPR name | `AP RUN CO<LE> <DDMONYY> <suffix> (<method>)` | `AP RUN CO1100 03JUL26 INC (CHECK)` |
| PPR name (country runs) | `<CC> <method> Payment <DDMMYY>` | `BR TED Payment 170726`, `MX Payment 170726` |
| PPR name (Treasury) | `TRS <bank-acct-code> EFT-<DD-MM-YYYY HH:MM:SS>` | `TRS <bank-acct-code> EFT-16-07-2026 15:20:09` |
| PPR name (supplier country) | `SUP-PMT-PPT-<CCY>-<LE>_<DDMONYY>` | `SUP-PMT-PPT-PHP-3313_10JUN26` |
| Kyriba batch ID | `<3-char prefix><Kyriba code><6-digit seq>` | `508TED001721`, `401DOMW000921`, `260INTW000132`, `CO3INTW000012` |
| Internal bank account name | `<LE> - <Bank> - <CCY> - Operating (<last4>)` | `Company, Inc. - Bank A - USD - Operating (xxxx)` |
| Supplier pay site | `<CC>-<CITY5>-[PO-]PAY` (INT055A rule; address name uses full city) | `US-OAKLA-PO-PAY`, `US-ATLAN-PO-PAY` |
| Apex VR_ID | Apex vendor record ID; stored in supplier Alias and entity DFFs | `12345` |
| Company code | Workday/Apex `CO<nnn>` → Oracle LE code via `XXCO_ENTERPRISE_STRUCTURE` | `CO100`→`1100` |
| Supplier type | `SUPPLIER`, `ADHOC`, `TREASURY` | |
| Ack date | `DDMMYYYY` | `02062026` |
