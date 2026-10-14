# Changelog

## 0.10.0 — 2026-10-14
- Manufacturing map: new **Enterprise structure** tab (second, after Estate), adapted from Oracle's InFusion example: enterprise, US and Mexico divisions, legal entities with their primary ledgers, the MX secondary ledger, USD reporting currency and USD ledger set, business units, balancing segment values, inventory and cost organisations, and the item master.
- FBCo US now has **two business units**: US Manufacturing BU (US plant, company 101; Procurement Services BU for the US) and US Distribution BU (distribution centre and US sales, company 102). Mexico keeps one BU (201). Values are mock (INFERRED, M-9 to M-11).
  - Make & Inventory › Plant to DC transfer is now an intracompany financial orchestration flow: transfer price from the financial route, trade distributions in two cost organisations, no invoices.
  - Record to Report: intracompany balancing through the clearing company (101 ↔ 102); shared-services allocation from 101 to 102; reporting and data access sets by company.
  - Estate nodes, Ledgers tab, Procure to Pay and Order to Cash wording follow the new structure; `foundation/enterprise-structure-and-ledgers.md` gains divisions, business units and balancing segment values.

## 0.9.0 — 2026-10-13
- Manufacturing map: **business workflows** replace the four stage chains. Six workstream tabs, each with scenario sub-tabs drawn as swimlanes (modules as columns, process bubbles, labelled arrows for the documents, goods, accounting and cash passed between them). Selecting a bubble shows the process, what goes in and out, the Dr/Cr entries, the inventory, cost, accrual and cash impact, its open interface and REST resources.
  - Procure to Pay: goods requisition to payment, services and expense items, supplier return, supplier-consigned inventory, employee expenses.
  - Make & Inventory: plan to produce, co-packer (outside processing), plant to DC transfer, cycle count and physical inventory, lot expiry, holds and recall, standard cost update.
  - Order to Cash: standard order to cash, customer return, drop ship, intercompany sale MX → US.
  - Record to Report: month-end sequence (each bubble opens its deep-dive), boundary journals (external payroll, treasury), intercompany, allocations, FX, consolidation in FCCS, account reconciliation in ARCS.
  - Treasury: payments to bank (accounted at issue and clearing), bank statement to reconciliation.
  - Assets: capital purchase to asset, transfers, MX tax book and retirement.
- Evidence: the Data Integration, FCCS, ARCS and Using Subledger Accounting guides are added; gaps are cited from Oracle's 26C web documentation (`ORA-WEB`). New `manufacturing/workflows/*.md`, generated with the model; INFERRED lines listed in `open-questions.md` (W-1 to W-12).
- Site: new view kind `workflows`; the build validates it.

## 0.8.0 — 2026-10-13
- Manufacturing map: REST APIs from Oracle's REST catalogues (Financials 26C, SCM 26B, Procurement 25C).
  - New **REST APIs** tab: all 822 top-level resources with the module on the map, path, methods, custom actions and a link to Oracle's page; search and filter by module or guide.
  - Each module lists its key REST resources (e.g. Payables: invoices with validateInvoice; Order Management: salesOrdersForOrderHub with applyHold).
  - New **Integration endpoints** node: ERP Integrations (importBulkData, exportBulkData and the other FBDI operations), ERP Data Integrations, ERP Business Events, ERP Processes; bulk-load connections to GL, Payables, Receivables, Order Management, Inventory and Suppliers.
  - Open interfaces: each row shows its REST alternative, or that only the FBDI file through ERP Integrations applies.
- `tools/rest_catalog.py` rebuilds `manufacturing/integrations/rest-apis.json`; the build expands node `rest` lists and fills `table` views.

## 0.7.1 — 2026-10-13
- Manufacturing map: evidence from the Order Management, Assets and Financials getting-started guides.
  - Order to Cash: the orchestration task services (Create Shipping / Wait for Shipment, Create Billing Lines / Wait for Billing), order import through `DOO_ORDER_HEADERS_ALL_INT` or the Sales Orders for Order Hub REST API, and the Direct Sales Order Issue and COGS Recognition templates.
  - Fixed Assets: Create Mass Additions, Post Mass Additions, Calculate Depreciation, Create Accounting for Assets; asset entries now cited. Ledgers tab gains **Asset books**: the corporate book feeds the MX primary ledger and the MX tax book feeds the MX secondary ledger (Perform Periodic Mass Copy).
  - Cash Management processes cited from the Financials guide; table names stay INFERRED (the PDF provided is the E-Business Suite 12.1 table of contents).
  - `manufacturing/open-questions.md` shows each item's status (M-3, M-4 and M-6a resolved).

## 0.7.0 — 2026-10-13
- **Manufacturing Estate Map** (generic reference, no client data): a mock food & beverage manufacturer (FBCo) with a US parent and one Mexican subsidiary, built from the Oracle 26C finance and supply chain guides. New `manufacturing/` pack:
  - Estate diagram separating enterprise structure and master data from transactions; each module shows what it does, its key processes, its open interfaces and its Dr/Cr entries; connections are labelled with the hand-off (requisition → PO line, receipt → 3-way match, fulfilled line → AutoInvoice …).
  - Flow tabs: Procure to Pay, Plan to Produce (process manufacturing, WIP costing), Order to Cash (deferred COGS, intercompany via Financial Orchestration), Record to Report; Ledgers tab (US primary, MX primary, MX secondary at subledger level with the statutory chart, MX USD reporting currency at journal level); Key processes; Period close; Open interfaces (28 tables).
  - Items not printed in the guides provided are tagged INFERRED and listed in `manufacturing/open-questions.md`.
- Site: maps can declare extra tabs (`views`, chain or diagram); detail panel shows key processes, journal entries and labelled connections; register table headings come from the map.
- Fixes: "Add comment" on Procure to Pay, Record to Report and Foundation stage cards failed (missing tab id); an Insurance register row had its target cut short by an unquoted comma.

## 0.6.0 — 2026-10-08
- Users and admin: self-registration with admin approval (status pending/active/disabled), per-user map access in `profiles`, admin role; login page explains the maps and the internal-use policy.
- Comments: "Add comment" on every clickable map item and stage card; stored in `comments` and emailed to the admin (Reply-To the viewer) by the `estate-comment` function.
- Admin tab: users (status, maps, admin, delete), add user by invite or with a password, comments (accept / reject), live log of registrations, sign-ins, map opens and comments (Supabase Realtime).
- Supabase: migration `003-users-admin-comments.sql`; Edge Functions `estate-admin`, `estate-comment`, `estate-signup-notify`; setup in `site/SETUP-ADMIN.md`.

## 0.5.0 — 2026-10-08
- Insurance map, from the ERP / corporate-IT notebook (2021–2023; anonymised):
  - **Dashboards** tab: clickable diagram of how the Essbase dashboards (GL cubes → Workiva (OneCloud) → Planning → OAC Essbase) and transactional dashboards (OTBI → DV data flows / ADW) are produced, plus static reporting (Narrative Reporting, BI Publisher) and insurance data feeds; path chips; `insurance/dashboards.md`.
  - **Close process** tab replaces the close calendar: clickable process map from the finance schedule (daily, month end, after close) with the calendar below; `insurance/processes/close-process.md`.
  - Estate: Workiva (OneCloud) naming; OCI Data Integration (treated as implemented) and the integration VM; DocuSign; OCI usage and cost; OCR → IDR on invoices; modules in use (ERP, EPM; HCM out of scope).
  - Register: 44 interfaces (daily and monthly policy journals, allocations, EPM and dashboard flows, card, contracts, DocuSign).
- Site: reusable diagram component (estate, dashboards, close process); detail panel shows facts such as timing.

## 0.4.1 — 2026-10-07
- Insurance map: ADW described as an Oracle Autonomous Database (Data Warehouse workload) holding transaction-level data, the Finance Transaction Data Warehouse; new node for the on-premise SQL Server warehouses (EDW, BIM, HDS); policy data routed Exceed → BIM → ADW → GL; note on where Essbase sits (OAC cube and Fusion GL balances cube).

## 0.4.0 — 2026-10-07
- **Insurance Estate Map** (state as of 2023, historical): new `insurance/` pack from the finance-technology notebook 2020–2023, anonymised (Insurer, Mutual, Agency, Bank A; no people, hosts or credentials). Covers COA and hierarchies, mappings, SLA rules, BPM approvals, P2P and R2R with account types, ADW and integrations, reconciliation, OTBI / BIP / FRS / Smart View / OAC.
- One site, several maps: map picker after sign-in; per-map access through `map_viewers.maps` and `public.can_read_map` (migration `supabase/migrations/002-per-map-access.sql`). Maps stored as `travel/map.json` and `insurance/map.json`.
- Page is map-driven: tab labels, workstream chips, legend and lane filters come from each map; new Foundation & controls tab.
- `tools/build_map_data.py --map travel|insurance|all`; validator checks the Insurance register and no longer fails on Windows paths.

## 0.3.0 — 2026-10-05
- Estate map renamed **Travel Estate Map** and made generic: interfaces are shown by name (`INT · <name>`), never by number; clicking a node shows what it does (bullets), its interfaces, its connections and links to the pack documents. "Where it breaks", the Procure-to-Pay "Breaks" lines and evidence tags are no longer shown on the map.
- Procure-to-Pay cards: at least three process bullets each, and debit/credit account types for the accounting stages (receipt, invoice, payment, settlement). New "Accounting by stage" table in `processes/p2p-end-to-end.md`; Q-PAY-7 added.
- New source CO:ACCRUALS-DOC: receipt-accrual mechanism, variable accrual, reports REP077 and REP536. Q-PAY-7 stays open (the source says the accrual timing is unconfirmed and does not cover payment clearing); a `[CONFLICT]` on accrual reversal is recorded.
- FTG answer 6-Oct-2026: expense items accrue at **period end** (R-19). The receipt creates no accounting; uninvoiced receipts are accrued at close and reversed next period; the invoice books the expense. Conflict resolved; Q-PAY-7 narrowed to payment clearing. Map Receipt and Invoice cards, Purchasing node and close timeline updated.
- New **Record to Report** tab on the map: eight stage cards with process bullets and debit/credit account types (intercompany, allocations, fixed assets, accrual, revaluation, eliminations), interfaces by name. Source CO:R2R-FEATURES plus the 26C GL and FCCS guides. `processes/r2r-close.md` gains an accounting-by-stage table; Q-FA-1 resolved (R-21).
- FTG answer + XLA trace 6-Oct-2026: payments are accounted in one step at issue (Liability / Cash); no cash clearing account; reconciliation creates no journal entry (R-20, closes Q-PAY-7). Map: Payment card credits Cash; Settlement card shows no accounting.
- Map: removed the holds and acknowledgement notes from the Procure-to-Pay tab; map.json is uploaded with `cache-control: no-cache` so viewers always get the latest data after a deploy (Supabase defaulted to a 1-hour browser cache).
- `tools/build_map_data.py` turns register IDs into names, builds document links from `docs_base`, and fails the build if an interface number would be shown.
- New source CO:KYRIBA-DOC (Kyriba functional & technical documentation, Oct 2026).
- New `integrations/kyriba-payment-file.md`: native Oracle → Kyriba payment file and funds-capture file, setup chain, transmission configuration, TR/IN field mapping, country rules.
- `integrations/INT955.md`: technical design (DFF columns, check-id derivation, bank-transfer rule, objects, errors, reprocessing). Q-PAY-3 resolved (R-14).
- `external-systems/kyriba.md` rewritten: flows table, payment types, Positive Pay, funds capture, status progression, bank-account identifiers, monitoring channels.
- Register: KYR-PAYFILE, KYR-FUNDSCAP, KYR-POSPAY added; INT955/955B/234/819/820 enriched.
- Failure modes FM-PAY-08…10 (file or batch rejected, so no payment acks); payment-level monitoring criteria in `operations/payment-status-reference.md`.
- Open questions: Q-PAY-4 partly answered; superseded source statements (26B, IWI, ACCP) recorded.
- FTG analyst answers 5-Oct-2026: payment files go over SFTP run by a managed-service provider (R-15); bank-rejected payments are voided manually, not by INT955B (R-16). Q-KY-3 narrowed to INT955B's remaining scope. `CHECK` payments are not electronic and carry no ack; acceptance is tracked manually (R-17, closes Q-PAY-4). FM-PAY-05 and the no-ack sample now exclude checks. INT955B only updates payment DFFs; it cancels nothing (R-18, closes Q-KY-3); renamed in register and index.

## 0.2.0 — 2026-09-30
- Estate map moved to private hosting: login page on Vercel (`site/public/`), map data in a private Supabase Storage bucket readable only by allow-listed users (`supabase/setup.sql`).
- Map content separated into `site/model/map-model.json`; `tools/build_map_data.py` merges it with the integration register.
- New workflow `.github/workflows/deploy-map.yml` (validate → build → upload → deploy). Setup guide: `site/SETUP-MAP.md`.
- Removed the self-contained `site/index.html` (it embedded all content).

## 0.1.0 — 2026-09-30
Initial import of the knowledge pack.
- 35 typed files across foundation, Oracle modules, external systems, integrations, processes, operations, governance and validation.
- Integration register with 66 entries; deep dives for INT055A, INT826, INT955/955B, INT959.
- 45 claims checked against the Oracle 26C implementation guides (`validation/oracle-26c-validation-log.md`).
- Corrections from the build sessions of 29–30 Sep 2026: release 26C, two supplier onboarding paths (INT055A for PO suppliers, SRR + INT959 for non-PO), INT826 schedule, ledger design, Kyriba `INTW`, meaning of missing acknowledgements.
- Interactive estate map in `site/index.html`.
