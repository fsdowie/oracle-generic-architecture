# Changelog

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
