---
id: MFG-WF-MAKE
type: workflows
title: Make and inventory workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Make and inventory workflows

Production, co-packing, transfers, counts, lot control and costing for the plants and the distribution centre.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Plan to produce

Process manufacturing: plan, release and run a work order from the recipe (work definition), then cost it through work in process to finished-good lots and variances.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Run plan** — Forecasts and sales orders are netted against on-hand and open supply; planned make orders are recommended. | Planning | Run plan | Forecast, Sales orders, On hand → Planned make orders |  |  | `[ORA26C:PLN p.13, 19]` |
| 2 | **Release planned order** — The planner releases planned make orders; Supply Chain Orchestration receives them as supply requests. | Planning | Release planned orders | Planned order → Supply request |  |  | `[ORA26C:PLN p.19]` `[ORA26C:SCO p.3]` |
| 3 | **Supply request** — Orchestration creates the work order and tracks it, raising exceptions when supply changes. | Supply Chain Orchestration | Supply request processing | Supply request → Work order |  |  | `[ORA26C:SCO p.3]` `[ORA26C:MFG p.548]` |
| 4 | **Process work order** — The work order copies the recipe: ingredients in, primary output and co-products out. Work orders from other systems come in through the open interface. | Manufacturing | Release work order; Import Work Orders | Work order, Work definition → Released work order |  |  | `[ORA26C:MFG p.548]` `[ORA26C:MFG p.482]` |
| 5 | **Issue ingredients** — Ingredient lots are issued to the work order, pushed or backflushed; backflush can default lots first-expiry, first-out. | Manufacturing | Material transactions; Backflush | Ingredient lots → Material issue | Material issue: Dr WIP valuation / Cr Inventory valuation (ingredients, packaging) | Inventory: ingredient lots consumed; genealogy recorded<br>Cost: WIP charged with material | `[ORA26C:MFG p.478, 490]` |
| 6 | **Ingredient lots out** — On-hand ingredient lots fall as they are issued. | Inventory |  | Material issue → Lower on hand |  | Inventory: on hand reduced by lot | `[ORA26C:MFG p.478]` |
| 7 | **Resources and overhead** — Resource transactions charge labour and machine hours; overhead absorption rules add overhead. | Manufacturing | Resource transactions; Calculate Overhead Absorption | Hours → Resource charges | Resource charge: Dr WIP valuation / Cr Resource absorption<br>Overhead: Dr WIP valuation / Cr Overhead absorption | Cost: WIP charged with resources and overhead | `[ORA26C:MFG p.408, 448]` |
| 8 | **Complete product** — Finished-good and co-product lots are completed with expiry dates into the completion subinventory. | Manufacturing | Product completion; Operation transactions | Work order → Finished-good lots | Completion: Dr Inventory valuation (finished goods) / Cr WIP valuation | Inventory: finished-good lots added | `[ORA26C:MFG p.140, 482]` |
| 9 | **Finished goods on hand** — Completed lots are on hand and available to Order Management. | Inventory | Transfer Inventory Transactions to Costing | Completion → Available finished goods |  | Inventory: finished goods available to ship | `[ORA26C:MFG p.140]` |
| 10 | **Cost the work order** — Cost Accounting values issues, resources and completions; Create Accounting sends them to the ledgers. | Cost Management | Create Cost Accounting Distributions; Create Accounting (Cost Management) | Work order transactions → Cost journals |  | Cost: standard cost (US) or perpetual average cost (MX) | `[ORA26C:MFG p.359]` |
| 11 | **Close work order** — The work order is closed once production is complete. | Manufacturing | Close work order | Completed work order → Closed work order |  |  | `[ORA26C:MFG p.359]` |
| 12 | **Variances** — The remaining WIP balance goes to usage and efficiency variances; gross margins can then be analysed by product. | Cost Management | Create Cost Accounting Distributions; Analyze Product Gross Margins | Closed work order → Variance journal | Work order close (unfavourable): Dr WIP variance (usage, efficiency) / Cr WIP valuation | Cost: variances to the P&L | `[ORA26C:MFG p.359]` |

Hand-offs: Run plan → Release planned order (planned order); Release planned order → Supply request (supply request); Supply request → Process work order (work order); Process work order → Issue ingredients (pick list); Ingredient lots out → Issue ingredients (lots); Issue ingredients → Resources and overhead; Resources and overhead → Complete product; Complete product → Finished goods on hand (FG lots); Complete product → Cost the work order (WO txns); Complete product → Close work order; Close work order → Variances (close).

**Costing methods.** Cost Management supports standard, actual and perpetual average cost. The mock company uses standard cost in the two US cost organisations (plant and distribution centre) and perpetual average cost in Mexico.

## 2. Co-packer (outside processing)

A step of the recipe, for example bottling or packing, is done by a co-packer as a supplier operation on the process work order. FBCo keeps ownership of the goods throughout.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Work order with supplier operation** — The work order includes a supplier operation. Outside processing is supported for both discrete and process manufacturing. | Manufacturing | Release work order | Work definition with a supplier operation → Released work order |  |  | `[ORA26C:MFG p.87, 89, 90]` |
| 2 | **Supply order** — On release (or prior operation completion, per plant parameter) Manufacturing asks Orchestration to create a purchase requisition. | Orchestration | Purchase Requisition Trigger plant parameter | Work order → Requisition request |  |  | `[ORA26C:MFG p.90, 91]` |
| 3 | **OSP purchase order** — Self Service Procurement creates the requisition; Purchasing creates the outside processing PO from the blanket agreement for the OSP service item. | Procurement | Requisition creation; Purchase order creation | Requisition → OSP purchase order (Manufacturing destination) |  |  | `[ORA26C:MFG p.89, 91]` |
| 4 | **Complete prior operation** — Quantities are reported complete at the operation before the supplier operation. | Manufacturing | Operation transactions | Work order → Shipment line request |  |  | `[ORA26C:MFG p.89]` |
| 5 | **Ship to the co-packer** — Orchestration creates an Outside Processing shipment line; the shipment is confirmed and closed, printing packing slip and bill of lading. | Shipping | Ship confirm | Shipment line → Goods sent (still owned by FBCo) |  |  | `[ORA26C:MFG p.89, 91, 92]` |
| 6 | **Co-packer processes** — The co-packer performs the operation and returns the goods, with an ASN where needed. | Co-packer |  | Goods, OSP PO → Processed goods, ASN |  |  | `[ORA26C:MFG p.87, 89]` |
| 7 | **Receive into the work order** — Receiving receives and delivers to the work order; for nonserialized operations the supplier operation is completed automatically. | Receiving | Receive Expected Shipments; Deliver | Processed goods → Operation completion |  |  | `[ORA26C:MFG p.92]` |
| 8 | **Continue the work order** — Production continues with the next operation; quantities can be completed, scrapped or rejected, and returned to the supplier. | Manufacturing | Manage Supplier Operations | Received quantities → Next operation |  |  | `[ORA26C:MFG p.92, 93]` |
| 9 | **OSP cost to WIP** — Receipt Accounting accounts for the receipt of the OSP item; Cost Accounting charges WIP when it is delivered to Manufacturing (purchase cost for average or actual, standard cost for standard items). | Cost Management | Create Receipt Accounting Distributions; Create Cost Accounting Distributions | Receipt and delivery → Cost journals | Receipt into inspection: Dr Receiving inspection (asset) / Cr Uninvoiced receipts accrual (liability)<br>PO receipt into Manufacturing: Dr WIP valuation, Purchase price variance (standard cost) / Cr Receiving inspection | Accrual: receipt accrual, as for any receipt<br>Cost: OSP service cost included in WIP | `[ORA26C:MFG p.93]` [`ORA-WEB:fapma/cost-accounting-for-outside-processing`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/cost-accounting-for-outside-processing.html) [`ORA-WEB:fapma/outside-processing-events`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/outside-processing-events.html) |
| 10 | **Co-packer invoice** — The co-packer invoices the service; it is matched to the OSP PO and receipt like any PO invoice. | Payables | Import Payables Invoices; Validate Payables Invoices | Invoice → Approved invoice | Invoice matched to the PO: Dr Uninvoiced receipts accrual, Invoice price variance, Recoverable tax / Cr Supplier liability |  | `[ORA26C:MFG p.87]` `[ORA26C:AP p.39]` |

Hand-offs: Work order with supplier operation → Supply order (requisition request); Supply order → OSP purchase order (requisition); Work order with supplier operation → Complete prior operation; Complete prior operation → Ship to the co-packer (shipment line); Ship to the co-packer → Co-packer processes (goods out); OSP purchase order → Co-packer processes (OSP PO); Co-packer processes → Receive into the work order (goods back); Receive into the work order → Continue the work order (completed op); Receive into the work order → OSP cost to WIP (receipt); Co-packer processes → Co-packer invoice (invoice).

**Full outsourcing.** Oracle's contract manufacturing flow (the whole product made by a contract manufacturer against a sales order) is supported only for discrete manufacturing, so a process manufacturer outsources steps as supplier operations.

## 3. Plant to DC transfer

Finished goods move from the US plant (US Manufacturing BU, company 101) to the US distribution centre (US Distribution BU, company 102) on a transfer order. The two are profit centres of one legal entity, so an intracompany financial orchestration flow prices the transfer and Cost Accounting books both sides; no invoices are raised.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Transfer request** — Transfer requests come from planning, min-max, requisition lines, spreadsheets or the supply order service; Orchestration decides transfer order or PO. | Orchestration | Create Supply Request | Demand at the DC → Transfer order request |  |  | `[ORA26C:MFG p.37, 38]` |
| 2 | **Transfer order** — The transfer order represents demand and supply in one document, to an inventory or expense destination. | Inventory (plant) | Create transfer order | Request → Transfer order |  |  | `[ORA26C:MFG p.37, 38]` |
| 3 | **Intracompany flow** — The transfer crosses profit centre business units in the same legal entity, so an intracompany financial orchestration flow applies. The transfer price comes from the transfer pricing rules for the financial route (here cost-based, at the plant's standard cost; a markup is possible). | Financial Orchestration | Financial orchestration flows; Transfer pricing rules | Transfer order (US plant → US DC) → Financial route, transfer price |  |  | `[ORA26C:MFG p.46, 585]` `[ORA26C:SCFO p.7]` `[INFERRED]` |
| 4 | **Pick, pack, ship** — Shipping picks and ships the lots; with the in-transit transfer type the goods are in transit until received. | Shipping | Pick, pack, Ship Confirm | Transfer order → Transfer Order Shipment |  | Inventory: plant on hand reduced; quantity in transit | `[ORA26C:MFG p.38, 44, 47]` |
| 5 | **Trade distributions** — Cost Management costs the shipment in the plant cost organisation and creates trade distributions for the receivable and payable between the two business units: an intracompany trade may not need an invoice. Intercompany balancing adds no lines because the entry already balances by company. | Cost Management | Create Cost Accounting Distributions | Shipment, Transfer price → Cost journals in companies 101 and 102 | Plant (101): shipment: Dr Intracompany receivable / Cr Inventory valuation (plant)<br>DC (102): goods in transit: Dr In-transit inventory / Cr Intracompany payable |  | `[ORA26C:MFG p.38, 591]` `[INFERRED]` |
| 6 | **Receive at the DC** — The DC receives against the transfer order using the receipt routing set for in-transit transfers, then puts away. | Receiving (DC) | Receive Expected Shipments; Put Away Receipts | Goods in transit → Transfer Order Receipt |  | Inventory: DC on hand increases | `[ORA26C:MFG p.44, 47]` |
| 7 | **DC inventory value** — The receipt moves value from in transit into the DC cost organisation at the transfer price. | Cost Management | Create Cost Accounting Distributions | Receipt → Cost journal (company 102) | DC (102): transfer order receipt: Dr Inventory valuation (DC) / Cr In-transit inventory |  | `[ORA26C:MFG p.38]` `[INFERRED]` |

Hand-offs: Transfer request → Transfer order (transfer order); Transfer order → Intracompany flow (crosses business units); Transfer order → Pick, pack, ship (ship request); Intracompany flow → Trade distributions (transfer price); Pick, pack, ship → Trade distributions (shipment); Pick, pack, ship → Receive at the DC (in transit); Receive at the DC → DC inventory value (receipt).

**Two cost organisations.** Inventory organisations in one cost organisation must belong to the same profit centre business unit, so the plant and the DC are valued by separate cost organisations (both standard cost).

**Within one legal entity.** The intracompany receivable and payable sit in companies 101 and 102 of the same ledger; they net to zero for FBCo US and need no consolidation elimination. Account names are INFERRED.

**Mexico to US.** A transfer between FBCo México and FBCo US crosses legal entities: Financial Orchestration prices it and raises intercompany invoices (see Order to Cash › Intercompany sale).

## 4. Cycle count and physical inventory

Ingredients and packaging are cycle counted by ABC class; a full physical inventory runs at year end. Approved differences adjust on-hand and are expensed.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Cycle count definition** — Counts are defined by ABC class or category, with count frequency and approval tolerances; A items are counted more often than B items. | Inventory: cycle count | Create Cycle Counts | ABC classes → Cycle count |  |  | `[ORA26C:MFG p.156, 162]` [`ORA-WEB:famml/cycle-count-criteria`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/cycle-count-criteria.html) |
| 2 | **Schedules and sequences** — The scheduled processes pick the items due and create one count sequence per item, lot, subinventory and locator with on hand; a listing report prints them. | Inventory: cycle count | Generate Count Schedules; Generate Count Sequences; Cycle Count Listing Report | Cycle count → Count sequences |  |  | [`ORA-WEB:famml/how-cycle-count-schedules-are-generated`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/how-cycle-count-schedules-are-generated.html) [`ORA-WEB:famml/how-cycle-count-sequences-are-generated`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/how-cycle-count-sequences-are-generated.html) |
| 3 | **Record and approve** — Counters record quantities; differences beyond tolerance go for approval. Sequences with reservations can't be approved. | Inventory: cycle count | Record Count Sequences; Approve Count Sequences | Counts → Cycle count adjustment |  | Inventory: on hand adjusted to the count | [`ORA-WEB:famml/how-cycle-count-sequences-are-generated`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/how-cycle-count-sequences-are-generated.html) |
| 4 | **Physical inventory** — Transactions stop; a snapshot freezes on-hand quantities (no reservations should exist). | Inventory: physical inventory | Manage Physical Inventories; Generate Physical Inventory Snapshot | On hand → Snapshot |  |  | [`ORA-WEB:famml/physical-inventory-snapshots`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/physical-inventory-snapshots.html) |
| 5 | **Tags and counts** — Tags are generated and printed; counters record them (dynamic or blank tags for stock found). | Inventory: physical inventory | Generate Physical Inventory Tags; Print Physical Inventory Tags Report; Record Physical Inventory Tags | Snapshot → Counted tags |  |  | [`ORA-WEB:famml/physical-inventory-tags`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/physical-inventory-tags.html) |
| 6 | **Approve and post** — Adjustments are approved, rejected or reset, then posted as material transactions against the adjustment account. | Inventory: physical inventory | Approve Physical Inventory Adjustments; Post Physical Inventory Adjustments | Counted tags → Adjustment transactions |  | Inventory: on hand adjusted to the count | [`ORA-WEB:famml/posts-for-physical-inventory-adjustments`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/posts-for-physical-inventory-adjustments.html) |
| 7 | **Cost the adjustments** — Count adjustments are miscellaneous transactions: a shortage credits inventory valuation against the offset (adjustment) account. | Cost Management | Create Cost Accounting Distributions; Create Accounting (Cost Management) | Adjustments → Cost journals | Count shortage: Dr Offset (inventory adjustment expense) / Cr Inventory valuation<br>Count overage (INFERRED: mirror image): Dr Inventory valuation / Cr Offset (inventory adjustment expense) | Cost: shrinkage to the P&L | [`ORA-WEB:fapma/miscellaneous-transaction-events`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/miscellaneous-transaction-events.html) `[INFERRED]` |

Hand-offs: Cycle count definition → Schedules and sequences; Schedules and sequences → Record and approve (sequences); Record and approve → Cost the adjustments (adjustment); Physical inventory → Tags and counts; Tags and counts → Approve and post (counts); Approve and post → Cost the adjustments (adjustment).

## 5. Lot expiry, holds and recall

Food safety: lots are held by material status, expired lots are actioned and scrapped, and a recall traces lots by genealogy and contains them.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Inspect at receipt** — Receipts are inspected; lots can be graded (for example excellent, average, poor) for quality control. | Receiving | Inspect Receipts | Receipt → Accepted or rejected lots |  |  | `[ORA26C:MFG p.174]` `[ORA26C:RCV p.108]` |
| 2 | **Material status hold** — Material statuses restrict what can be done with a lot, for example blocking shipment of chilled goods after a refrigeration failure. Quality inspection action rules can change the status automatically. | Inventory | Update material status (Manage Lots); Quality action rule: Change Material Status | Lot → Lot on hold |  | Inventory: lot not available to issue or ship | `[ORA26C:MFG p.174]` [`ORA-WEB:fauqm/manage-action-rules`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fauqm/manage-action-rules.html) |
| 3 | **Lot expires** — Lots of shelf-life items carry an expiry date; the expiration action (from the item, the lot or the transaction) says what to do when it expires. | Inventory | Manage Lot Expiration Actions | Expiry date reached → Action: scrap, hold or rework |  |  | `[ORA26C:MFG p.174]` |
| 4 | **Scrap** — The expired or rejected lot is issued to a scrap account. Expired lots can't be reserved but can still be transacted, so scrapping is a deliberate step. | Inventory | Miscellaneous issue | Expired lot → Scrap transaction |  | Inventory: lot removed from stock | `[ORA26C:MFG p.174]` [`ORA-WEB:famml/lot-and-serial-numbers`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/lot-and-serial-numbers.html) |
| 5 | **Scrap cost** — The scrap is valued and expensed to the offset account on the transaction. | Cost Management | Create Cost Accounting Distributions | Scrap transaction → Cost journal | Scrap expired lot: Dr Offset (scrap expense) / Cr Inventory valuation | Cost: scrap to the P&L | [`ORA-WEB:fapma/miscellaneous-transaction-events`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/miscellaneous-transaction-events.html) |
| 6 | **Recall notice** — A supplier letter or regulator notice recalls an ingredient FBCo received; Product Recall Management captures it as a recall notice and resolves duplicates. | Supplier · regulator | Capture recall notice | Recall notice |  |  | `[ORA26C:MFG p.771]` [`ORA-WEB:fampr/overview-of-recall-notices`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fampr/overview-of-recall-notices.html) |
| 7 | **Locate recalled parts** — Locate Recalled Parts traces the recalled lots across on hand, in transit and open purchase orders. | Inventory | Locate Recalled Parts | Recall notice → Affected stock and orders |  |  | [`ORA-WEB:fampr/locate-recalled-parts`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fampr/locate-recalled-parts.html) |
| 8 | **Count, quarantine, dispose** — Tasks: Perform Physical Count and Quarantine Recalled Parts, then Perform Scrap or Return to Supplier. The notice line closes when its tasks are done. | Inventory | Perform Physical Count and Quarantine Recalled Parts; Perform Scrap or Return to Supplier for Recalled Parts | Affected stock → Quarantined, then scrapped or returned |  | Inventory: affected lots quarantined and removed | `[ORA26C:MFG p.771]` [`ORA-WEB:fampr/closure-of-recall-notice`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fampr/closure-of-recall-notice.html) |
| 9 | **Debit memo to supplier** — A debit memo recovers the cost of recalled parts from the supplier. | Supplier · regulator | Raise Debit Memo Against Disposition for Recalled Parts | Disposition → Debit memo |  |  | [`ORA-WEB:fampr/closure-of-recall-notice`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fampr/closure-of-recall-notice.html) |

Hand-offs: Inspect at receipt → Material status hold (rejected → hold); Material status hold → Lot expires; Lot expires → Scrap (action); Scrap → Scrap cost (scrap txn); Recall notice → Locate recalled parts (notice); Locate recalled parts → Count, quarantine, dispose (tasks); Count, quarantine, dispose → Debit memo to supplier (disposition).

**Customer recalls.** Oracle Product Recall Management handles inbound recalls (parts FBCo received). A recall of FBCo's own products from customers runs outside it: lot genealogy, customer returns (Order to Cash › Customer return) and credit memos.

## 6. Standard cost update

Once a year (and for new items) the US cost organisations (plant and distribution centre) set new standard costs in a cost scenario, rolls them up through the recipes and publishes them; on-hand and open work orders are revalued.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **New costs** — Ingredient and packaging standards, resource and overhead rates are loaded or entered. | Cost source | Standard Cost Import | Standard costs |  |  | `[ORA26C:MFG p.102]` `[ORA26C:MFG p.359]` |
| 2 | **Cost scenario** — A cost scenario holds the new standard costs, resource rates and overhead rates, effective from a date. State: New. | Cost Accounting | Manage Cost Scenarios | Standard costs, Rates → Cost scenario |  |  | [`ORA-WEB:fapma/state-and-status-of-cost-scenario`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/state-and-status-of-cost-scenario.html) |
| 3 | **Roll up costs** — Rollup builds finished-good costs from the work definitions: ingredients, resources, overhead and any outside processing cost. State: Costs Rolled Up. | Cost Accounting | Roll up Costs | Cost scenario, Work definitions → Rolled-up costs |  |  | [`ORA-WEB:fapma/publish-costs`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/publish-costs.html) `[ORA26C:MFG p.93]` |
| 4 | **Publish** — Publishing makes the costs effective on the scenario date (state Costs Published). Undo Cost Update works only before the costs are used. | Cost Accounting | Update Standard Costs; Undo Cost Update | Rolled-up costs → Published standard costs |  |  | [`ORA-WEB:fapma/publish-costs`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/publish-costs.html) |
| 5 | **Revalue on hand and WIP** — On hand is revalued by (new − current standard) × quantity; open work orders get a WIP standard cost adjustment. | Inventory · WIP | Create Cost Accounting Distributions; Review Cost Accounting Distributions | Published costs, On hand, Open work orders → Standard cost adjustments | Standard cost increase: Dr Inventory valuation / Cr Standard cost adjustment | Inventory: on-hand value changes, quantity doesn't<br>Cost: new standards drive future PPV and variances | [`ORA-WEB:fapma/standard-cost-method`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/standard-cost-method.html) |

Hand-offs: New costs → Cost scenario (costs); Cost scenario → Roll up costs; Roll up costs → Publish; Publish → Revalue on hand and WIP (revaluation).

**Mexico.** FBCo México uses perpetual average cost, so it has no standard cost update; its costs move with each receipt, and the Create Cost Adjustments page corrects them when needed.
