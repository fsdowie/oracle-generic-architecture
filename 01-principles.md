---
id: KP-PRINCIPLES
type: rules
applies_to: all
as_of: 2026-09-29
---

# Governing Principles and Agent Answering Rules

## Part A — Five architecture rules that govern the estate

These are decisions already built into the estate. Most design arguments in FTG resolve by appeal to one of them. `[CO:01-oracle-finance-spine §2]`

### R1 — Oracle is authoritative; satellites are advisory
- Satellites (Zip, Kyriba, Ramp, SimpleLegal…) **propose**; Oracle **decides**.
- Example: Zip defaults COA segments at intake, but Oracle re-derives the charge account server-side on requisition submit and validates it against cross-validation rules. `[CO:02-procure-to-pay-chain §3]`
- Purpose: keep SOX scope inside Oracle while the orchestration layer owns user experience.
- Exception to know: **Kyriba is the source of truth for payment-code mapping** (Oracle payment code → Kyriba code → bank/country file config). `[CO:02 §4 Stage 08, §7]`
- Supplier creation has **two paths**: (a) **PO suppliers** requested through Zip go through the **Apex portal and then Oracle Fusion via INT055A** — a supplier is only available for POs after passing through Apex `[USER:2026-09-30]`; (b) **non-PO / ad hoc / Treasury suppliers** are created by the Oracle Supplier Registration Request (SRR), with INT959 completing details from the questionnaire — Apex is not involved in this path `[USER:2026-09-29]`.

### R2 — The chart of accounts is the integration contract
- `Corp_COA_Structure`, 9 segments: Legal Entity · Sub Business Unit · Cost Center · Account · Sub Account · Intercompany · Geo · Project · Future. `[CO:01 §2]`
- A new cost center or sub account is never a single-system change: it fans out to Oracle GL, Zip, T&E apps, Magnit/Upwork, Oracle Planning, FCCS, Alteryx, Salesforce/Ironclad, and the warehouse. See `processes/master-data-fanout.md`.

### R3 — Everything reaches the ledger through Subledger Accounting (or Import Journals)
- Oracle subledgers (Payables, Payments/Cash, Fixed Assets, Receivables, Purchasing receipt accrual) and all Accounting Hub sources produce accounting through one XLA rule stack under accounting method `CORP_GAAP_SLAM`. `[CO:01 §2, 03 §3.2]`
- External and manual feeds arrive **pre-accounted** through Import Journals and **bypass XLA**. `[CO:03 §1]`
- Consequence: a wrong number from an XLA source is a *rule-configuration* question; a wrong number from an imported feed is a *source-data or mapping* question.

### R4 — Integration is a rail, not a mesh (four lanes)
| Lane | Used for | Failure surfaces as | Owner signal |
|---|---|---|---|
| Oracle Integration Cloud (`INT###`) | Transactional, near-real-time flows | `PROD \| ERROR \| INT###` / `PROD \| WARNING \| INT###` tickets auto-raised in the implementation project (FIN) | BizTech Finance Integrations builds; FTG functional |
| Airflow DAGs | Period-driven bulk movement into EPM (FCCS, ARCS) | Airflow UI; pausing a DAG during close is normal, not an incident | FTG |
| FBDI / ADFDI / Workday EIB | Bulk loads | Import-process errors inside Oracle / interface error reports | FTG |
| BICC / BI Publisher extracts | Warehouse and downstream extracts | **Silent**: blank files, missing extracts — needs purpose-built checks | FTG / Data |
`[CO:01 §2 R4, §5]`

### R5 — Statutory vs management reporting is separated by ledger, not by report
- **GAAP is the primary ledger; STAT and TAX are secondary ledgers.** `[USER:2026-09-29]`
- Ledger sets (e.g. `Company CSL GAAP USD LS`) group ledgers for consolidated reporting. `[CO:01 §4]`
- Fixed Assets mirrors the split at book level (40+ corporate and tax books); ARCS runs separate GAAP and STAT pipelines; FCCS carries multi-GAAP natively. `[CO:03 §2]`
- Oracle 26C basis: secondary ledgers carry an alternative accounting representation, with a data conversion level of Balance, Journal, Subledger or Adjustment Only. `[ORA26C:implementing-enterprise-structures-and-general-ledger p.301–302]` The conversion level used for Company STAT/TAX secondaries is **not documented** → `validation/open-questions.md` Q-LED-2.

### The key structural property
Many systems originate, many Oracle modules record, but there is **exactly one accounting engine and one ledger family**. That narrowing makes the close reconcilable — and is the throughput bottleneck platform-accounting volume presses against. `[CO:01 §1]`

---

## Part B — Rules for an agent answering from this pack

1. **Name the lane before diagnosing.** For any "why didn't X arrive" question, first identify which of the four lanes the flow uses; the lane dictates where the error is visible.
2. **Two homes for every GL mapping defect in P2P.** Compare what Zip sent with what Oracle stored. Wrong sub-account from Zip → fix Zip lookup. Wrong natural account from a correct sub-account → fix Oracle Transaction Account Builder rule / mapping set. `[CO:02 §3]` `[ORA26C:implementing-procurement p.648–651]`
3. **Payments: success ≠ money arrived.** A payment the beneficiary bank *returns* but whose acknowledgement is consumed correctly is a **systems success**. Distinguish pipeline failures (Draft in Kyriba, file not integrated) from bank outcomes (RJCT, returns). `[CO:02 §4 Stage 08]`
4. **Do not assign business outcomes to Finance Systems.** FTG owns delivery; business partners own outcome OKRs. `[CO:bnz-ticket SKILL §Accountability split]`
5. **Current state only.** In-flight work (Hub modernisation/FAH-as-a-service, buyer review to Zip, invoice automation, AI invoice-to-PO matching, e-invoicing/XML VAT, Concur sunset, chained FCCS business rule) must be labelled "in flight", never described as architecture.
6. **Release-bound statements.** "Oracle can't do X" must cite 26C and be phrased "as of Release 26C". Several scope decisions depend on that (see `processes/supplier-onboarding.md`).
7. **When evidence is `[CONFLICT]` or `[UNVERIFIED]`, say so** and quote the open-question ID.
8. **Never include personal or HR material** from source folders in answers.
