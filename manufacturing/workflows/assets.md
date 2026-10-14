---
id: MFG-WF-FA
type: workflows
title: Assets workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Assets workflows

Capital purchases into assets, depreciation, the Mexican tax book and retirement.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Capital purchase to asset

A new filling line: bought on a PO charged to asset clearing, invoiced, sent to Assets as a mass addition, capitalised and depreciated.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Asset PO** — To send an asset purchase to Assets, the natural account on the PO charge account must be an asset clearing account. | Purchasing | Purchase order approval | Requisition → PO for the asset |  |  | `[ORA26C:FA p.28]` |
| 2 | **Asset invoice** — The supplier invoice is matched to the PO; its amount goes to asset clearing. | Payables | Import Payables Invoices; Validate Payables Invoices | Invoice → Accounted invoice | Asset invoice in Payables: Dr Asset clearing / Cr Supplier liability |  | `[ORA26C:FA p.30, 31]` |
| 3 | **Create Mass Additions** — Sends approved, accounted invoice lines charged to asset clearing (or CIP clearing) to Assets as mass additions (FA_MASS_ADDITIONS). | Payables | Create Mass Additions for Assets | Accounted invoice lines → Mass additions |  |  | `[ORA26C:FA p.7, 30]` [`ORA-WEB:faalm/mass-additions`](https://docs.oracle.com/en/cloud/saas/financials/26c/faalm/mass-additions.html) |
| 4 | **Post Mass Additions** — Mass additions are reviewed (merged or split) and posted as assets. | Assets | Post Mass Additions | Mass additions → Asset | Capitalisation: Dr Asset cost / Cr Asset clearing |  | `[ORA26C:FA p.12, 30]` |
| 5 | **Calculate Depreciation** — Depreciation runs each period for the corporate book. | Assets | Calculate Depreciation | Assets → Depreciation | Depreciation: Dr Depreciation expense / Cr Accumulated depreciation |  | `[ORA26C:FA p.10, 12]` |
| 6 | **Create Accounting** — Asset journals transfer to GL. | Assets | Create Accounting for Assets | Asset transactions → Asset journals |  |  | `[ORA26C:FA p.8, 18]` |
| 7 | **Post** — Journals post in the corporate ledger. | General Ledger | Post Journals | Asset journals → Balances |  |  | `[ORA26C:FA p.8]` |

Hand-offs: Asset PO → Asset invoice (matched invoice); Asset invoice → Create Mass Additions (asset clearing); Create Mass Additions → Post Mass Additions (mass additions); Post Mass Additions → Calculate Depreciation; Calculate Depreciation → Create Accounting; Create Accounting → Post (journals).

**Receipt-based assets.** Assets can also be created from receipts: estimated costs transfer from the receipt to the corporate book of the inventory organisation.

## 2. Asset transfers, tax book and retirement

After capitalisation: transfers between cost centres, the Mexican tax book kept by mass copy, and retirement with sale proceeds and cost of removal.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Transfer** — Transfers move the asset's assignment; the Transfers infotile shows old and new details. | Assets (corporate) | Transfer assets | Asset → New assignment |  |  | `[ORA26C:FA p.9]` |
| 2 | **Perform Periodic Mass Copy** — Additions, adjustments, retirements and reinstatements copy from the corporate book to the tax book each period, without skipping periods; the tax book accounts to the MX secondary ledger. | Assets (MX tax book) | Perform Periodic Mass Copy | Corporate book transactions → Tax book transactions | MX tax book addition: Dr Asset cost / Cr Asset clearing |  | `[ORA26C:FA p.32]` [`ORA-WEB:faalm/overview-of-the-perform-periodic-mass-copy-process`](https://docs.oracle.com/en/cloud/saas/financials/26c/faalm/overview-of-the-perform-periodic-mass-copy-process.html) |
| 3 | **Retire** — The asset is retired, fully or partly, by cost or by units. | Assets (corporate) | Retire Assets | Asset → Retirement |  |  | `[ORA26C:FA p.196, 197]` |
| 4 | **Sale proceeds** — The buyer's payment is recorded against proceeds of sale clearing. | Receivables | Receipt | Buyer payment → Proceeds | Proceeds of sale: Dr Bank / Cr Proceeds of sale clearing |  | `[ORA26C:FA p.196]` |
| 5 | **Cost of removal** — The removal contractor's invoice is charged to cost of removal clearing. | Payables | Invoice | Removal invoice → Cost of removal | Cost of removal: Dr Cost of removal clearing / Cr Bank |  | `[ORA26C:FA p.196]` |
| 6 | **Gain or loss** — Gain or loss = proceeds − cost of removal − net book value retired + revaluation reserve retired. Calculate Gains and Losses runs between partial retirements in a period. | Assets (corporate) | Calculate Gains and Losses; Create Accounting for Assets | Retirement, Proceeds, Removal cost → Gain or loss journal | Retirement (net gain example): Dr Accumulated depreciation, Proceeds of sale clearing / Cr Asset cost, Cost of removal clearing, Gain on retirement |  | `[ORA26C:FA p.196, 197]` [`ORA-WEB:faalm/considerations-for-retiring-assets`](https://docs.oracle.com/en/cloud/saas/financials/26c/faalm/considerations-for-retiring-assets.html) |
| 7 | **Post** — Asset journals post to the ledgers. | General Ledger | Post Journals | Journals → Balances |  |  | `[ORA26C:FA p.8]` |

Hand-offs: Transfer → Perform Periodic Mass Copy (mass copy); Transfer → Retire; Retire → Gain or loss; Sale proceeds → Gain or loss (proceeds); Cost of removal → Gain or loss (removal); Gain or loss → Post (journals); Perform Periodic Mass Copy → Post (secondary ledger).
