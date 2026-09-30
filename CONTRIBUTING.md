# Contributing and validating

This repository is the source of truth for the Company Oracle Finance knowledge pack. Agents read it and people validate it. Every change goes through a pull request.

## Who reviews what

`CODEOWNERS` routes each folder to the team that can confirm it. Replace the placeholder handles with real Company GitHub teams before the first merge.

| Area | Folders | Validating team |
|---|---|---|
| Procure to Pay | `processes/p2p-*`, `processes/supplier-onboarding.md`, `oracle-modules/suppliers-*`, `oracle-modules/payables.md`, `external-systems/zip.md` | FTG P2P + Procurement / AP |
| Payments and Treasury | `oracle-modules/payments-and-cash.md`, `processes/payments-*`, `external-systems/kyriba.md`, `integrations/INT955.md`, `operations/payment-status-reference.md` | FTG P2P + Treasury |
| Record to Report | `oracle-modules/general-ledger-*`, `oracle-modules/fixed-assets.md`, `oracle-modules/epm-fccs-arcs.md`, `processes/r2r-close.md` | FTG RTR + Accounting / Consolidation |
| Platform accounting | `oracle-modules/subledger-accounting-and-fah.md`, `processes/platform-accounting-daily-run.md` | FTG Platform |
| Tax | `oracle-modules/tax.md` | Tax |
| Integrations | `integrations/` | BizTech Finance Integrations |
| Foundation and governance | `foundation/`, `governance/`, `01-principles.md` | FTG leads |

## Rules for every change

1. **Tag every material statement** with its evidence: `[CO:<source>]`, `[ORA26C:<guide> p.<n>]`, `[USER:<date>]`, `[DATA:<file>]`, `[INFERRED]`, `[UNVERIFIED]` or `[CONFLICT]`. See `README.md`.
2. **Oracle-standard behaviour needs a 26C citation** with guide name and PDF page. "Oracle can't do X" is always written "as of Release 26C".
3. **Current state only.** In-flight work is labelled "in flight" and never described as architecture.
4. **Don't guess.** If you don't know, add a row to `validation/open-questions.md` with an ID and cite that ID where the gap is.
5. **Keep IDs stable.** File `id`s, integration IDs and question IDs are referenced across the pack; rename only with a search-and-replace in the same PR.
6. **No personal data, credentials, environment URLs or HR material.**
7. When you add a source document, add it to `validation/source-register.md`.

## How to validate a claim

- **Confirm:** approve the PR, or comment "Confirmed" on the line.
- **Correct:** suggest the change on the line and cite your source. The author re-tags it as `[CO:<doc>]` or `[USER:<date>, <team>]`.
- **Unsure:** comment with the question. The author moves it into `validation/open-questions.md`.

Answering an open question: move its row to the "Resolved" table with the answer and date, update every file that cites the ID, and remove `[CONFLICT]`/`[UNVERIFIED]` tags that the answer settles.

## Run the checks locally

```bash
pip install pyyaml
python tools/validate_pack.py
```

CI runs the same script on every pull request (`.github/workflows/validate.yml`).

## Rebuilding the map

`site/index.html` is the interactive estate map. It is a static snapshot. When the register or the estate changes, regenerate it or edit its data arrays (`N`, `E`, `INTS`) in the script block.
