# Changelog

## 0.3.0 — 2026-10-05
- Estate map renamed **Travel Estate Map** and made generic: interfaces are shown by name (`INT · <name>`), never by number; clicking a node shows what it does (bullets), its interfaces, its connections and links to the pack documents. "Where it breaks", the Procure-to-Pay "Breaks" lines and evidence tags are no longer shown on the map.
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
