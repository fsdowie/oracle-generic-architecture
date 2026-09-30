---
id: KP-README
type: index
title: Company Finance & Technology Architecture on Oracle — LLM Knowledge Pack
version: 0.1-draft
as_of: 2026-09-29
oracle_release_in_production: 26C
owner: FTG analyst (FTG)
---

# Company Finance & Technology Architecture on Oracle — LLM Knowledge Pack

> **Anonymised review copy.** Company, people, supplier, bank and internal platform names have been replaced with neutral placeholders (e.g. *Company*, *the Treasury lead*, *Bank A*, *Payments Platform*, `FIN-` ticket keys, `CO:` evidence tags). Oracle-standard content, vendor application names and the architecture itself are unchanged. Do not re-identify before moving this into the company's own repository.


## What this is

A **retrieval-first** description of Company's Oracle Fusion Cloud finance estate: systems, Oracle modules,
integrations, end-to-end processes, controls, failure modes, and the delivery governance that changes them.

It is written for an LLM agent (Claude Code agent, MCP-backed assistant, skill) to *ground* answers, not for
a human to read cover to cover. Every file is small, typed, self-contained and cross-linked by stable IDs so
that one retrieved chunk is enough to answer one question correctly.

## How an agent should use this pack

1. **Resolve the entity first.** Look the term up in `00-index.yaml` (IDs, aliases, file). Integration IDs
   (`INT###`), report IDs (`REP###`), Jira keys (`FIN-#####`), CVRs and Airflow DAG names all resolve there.
2. **Read the entity file, then its linked process file.** Systems describe *what owns what*; processes
   describe *what happens in which order*; `controls-and-failure-modes.md` describes *what breaks and where to look*.
3. **Respect the evidence tags** (below). Never upgrade an `[UNVERIFIED]` or `[INFERRED]` statement to a fact
   in an answer. If the question hinges on one, say so and point to `validation/open-questions.md`.
4. **Apply the governing rules** in `01-principles.md` before reasoning about a design question
   (e.g. "Oracle is authoritative; satellites are advisory").
5. **Oracle-standard behaviour** must be backed by a `[ORA26C: …]` citation. If no citation exists,
   treat it as unverified Oracle behaviour, even if it sounds right.

## Evidence tags (used on every material statement)

| Tag | Meaning | Trust |
|---|---|---|
| `[CO:<source>]` | Stated in an Company/FTG source file in the Claude Cowork folder (see Source register) | High for current state as of the source date |
| `[ORA26C:<guide> p.<n>]` | Confirmed in the Oracle 26C implementation guide supplied (`26c guides`), PDF page number | High for Oracle-standard behaviour |
| `[USER:2026-09-29]` | Confirmed by the FTG analyst in the build session on 29 Sep 2026 | High; overrides conflicting sources |
| `[DATA:<file>]` | Derived by analysing an operational extract (logs, report output) | High for the sample window only |
| `[INFERRED]` | Reasoned from sources; not stated anywhere | Medium; do not present as fact |
| `[UNVERIFIED]` | Stated in an Company source but not confirmable in the 26C guides provided, or no guide covers it | Use with caveat |
| `[CONFLICT]` | Sources disagree; see `validation/open-questions.md` | Do not answer definitively |

**Precedence when sources disagree:** `USER` > `DATA` (for the window it covers) > `CO` (newest first) > `ORA26C` (for Company-specific configuration) — but `ORA26C` > `CO` for *what Oracle can or cannot do* in release 26C.

## File map

| Path | Content |
|---|---|
| `00-index.yaml` | Machine-readable registry of every entity: id, type, aliases, file |
| `01-principles.md` | The five governing architecture rules + agent answering rules |
| `02-glossary.md` | Company and Oracle vocabulary, ID conventions, naming patterns |
| `03-estate-layers.md` | Six-layer model of the estate and the narrowing to one engine / one ledger |
| `foundation/chart-of-accounts-and-ledgers.md` | COA, ledgers (primary/secondary), ledger sets, CVRs, calendars, rates |
| `oracle-modules/*.md` | One file per Oracle module family (P2P, Payments, SLA/FAH, GL, IC, FA, Expenses, AR, Tax, EPM) |
| `external-systems/*.md` | Zip (full ownership structure), Kyriba, and a catalogue of other satellites |
| `integrations/integration-register.yaml` | Every known integration as structured records |
| `integrations/INT826.md`, `INT959.md`, `INT955.md` | Deep dives with operational data |
| `processes/*.md` | End-to-end process maps (P2P stages, supplier onboarding, payments & returns, close, platform accounting, etc.) |
| `operations/operating-rhythm.md` | The clock: hourly / daily / monthly / quarterly |
| `operations/controls-and-failure-modes.md` | Symptom → locus → diagnostic → owner catalogue |
| `operations/reports-catalog.md` | `REP###` custom reports and what they answer |
| `operations/payment-status-reference.md` | Payment statuses, acknowledgement codes, bank rejection taxonomy, PPR / batch naming |
| `governance/delivery-framework.md` | How change happens: Initiative/Epic/Story, sprints, KTLO, sign-off rules |
| `validation/oracle-26c-validation-log.md` | Each Oracle-standard claim checked against the 26C guides, with verdict and page |
| `validation/open-questions.md` | Gaps and conflicts that need an answer from a human |
| `validation/source-register.md` | Every source file used, date, and what it contributed |

## Using this repository

- **Validate:** see `CONTRIBUTING.md`. Every change is a pull request reviewed by the owning team in `.github/CODEOWNERS`.
- **Check:** `python tools/validate_pack.py` (runs in CI on every PR).
- **Browse:** open `site/index.html` for the interactive estate map.
- **Feed an agent:** point retrieval at the repository root; start from `00-index.yaml` and `01-principles.md`.

## Scope

In: Procure-to-Pay, Record-to-Report, Platform Accounting (FAH), Expenses/T&E, Receivables (minimal), Tax,
EPM (FCCS, ARCS, Data Integration), integrations and orchestration, delivery governance.

Out: Payroll internals, tax provision (TRCS/AirTP), planning model internals (EPBCS/Anaplan), Foundation entity
variants, the engineering side of Payments Platform/Event Enrichment. Excluded by scope, not by absence.

## Known limits of this draft

- The integration register is a strong sample assembled from monitoring names and design docs, not a certified register.
- No 26C guide was supplied for Fixed Assets, Cash Management, Payments-only topics beyond the Payables guide, Accounting Hub (beyond the SLA guide), or Oracle Integration Cloud. Claims in those areas are tagged `[UNVERIFIED]` unless another guide covers them.
