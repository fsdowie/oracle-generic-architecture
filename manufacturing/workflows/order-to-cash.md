---
id: MFG-WF-O2C
type: workflows
title: Order to Cash workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Order to Cash workflows

From customer order to cash in the bank, plus returns, drop shipments and the intercompany sale from Mexico.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Standard order to cash

A retail order by EDI: credit-checked, scheduled and reserved, picked first-expiry first-out, shipped, invoiced, recognised, paid by lockbox and reconciled.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Customer PO** — Retail purchase orders arrive by EDI; smaller customers use a portal. | Customer · bank |  | Customer purchase order |  |  | `[ORA26C:OM p.72]` |
| 2 | **Sales order** — The order is imported through DOO_ORDER_HEADERS_ALL_INT or the Sales Orders for Order Hub REST API; an orchestration process runs each fulfilment line. | Order Management | Load Interface File for Import; Import Sales Orders | Customer PO → Sales order |  |  | `[ORA26C:OM p.58, 63, 266]` |
| 3 | **Credit check** — Credit check runs first, then approval. A failing order goes to Credit Review Pending; Receivables Credit Management opens a credit case folder and the analyst releases the hold or raises the limit. | Order Management | Credit check; Credit case folder (Credit Checking Failure); Release Holds | Sales order → Approved order (or credit hold) |  |  | `[ORA26C:OMU p.30]` `[ORA26C:AR p.285]` [`ORA-WEB:fauom/manage-credit-check`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fauom/manage-credit-check.html) |
| 4 | **Schedule and reserve** — Global Order Promising schedules the line and reserves supply until shipment. | Order Management | Plan Orchestration Processes | Approved line → Shipment request (Create Shipping) |  |  | `[ORA26C:OM p.43, 58]` |
| 5 | **Pick, pack, ship** — Lots are picked first-expiry, first-out, packed and ship-confirmed; ship confirm issues inventory (Direct Sales Order Issue). | Shipping · inventory | Pick Wave; Ship Confirm | Shipment request → Shipment, Ship notice to the customer |  | Inventory: finished-good lots leave stock | `[ORA26C:SHP p.14, 69]` `[ORA26C:OMU p.68, 69]` `[INFERRED]` |
| 6 | **Deferred COGS** — The sales order issue is costed into deferred COGS until revenue is recognised. | Cost Management | Create Cost Accounting Distributions | Shipment → Cost journal | Ship confirm: Dr Deferred COGS / Cr Inventory valuation (finished goods) | Cost: cost held in deferred COGS | `[ORA26C:OMU p.69]` `[ORA26C:MFG p.379]` |
| 7 | **Invoice** — Create Billing Lines sends the line to RA_INTERFACE_LINES_ALL; Import AutoInvoice creates the invoice with tax (US sales tax, MX VAT). | Receivables | Create Billing Lines; Import AutoInvoice; Create Receivables Accounting | Shipped line → Customer invoice | Customer invoice: Dr Receivable / Cr Revenue (or unearned revenue), Tax payable |  | `[ORA26C:OM p.58, 63]` `[ORA26C:AR p.80, 105]` |
| 8 | **Recognise revenue** — Deferred revenue is recognised when its contingencies are met. | Receivables | Recognize Revenue | Invoice → Revenue recognised | Revenue recognised: Dr Unearned revenue / Cr Revenue |  | `[ORA26C:AR p.318]` |
| 9 | **Recognise COGS** — Cost Accounting moves deferred COGS to COGS in proportion to recognised revenue; ship-only lines can use the order-line close date. | Cost Management | Create Cost Accounting Distributions | Revenue recognition → COGS journal | COGS recognition: Dr COGS / Cr Deferred COGS | Cost: COGS matched to revenue | `[ORA26C:OMU p.69, 70]` `[ORA26C:MFG p.379]` |
| 10 | **Customer pays** — The customer pays to FBCo's lockbox; the bank sends the lockbox file. | Customer · bank |  | Invoice → Lockbox file |  |  | `[ORA26C:AR p.174]` |
| 11 | **Lockbox receipt** — Process Receipts Through Lockbox imports the file into AR_PAYMENTS_INTERFACE_ALL, validates it and posts the receipts; Apply Receipts Using AutoMatch applies what is left. | Receivables | Process Receipts Through Lockbox; Apply Receipts Using AutoMatch | Lockbox file → Applied receipts | Customer receipt: Dr Cash (or remitted / confirmed cash) / Cr Receivable | Cash: cash received | `[ORA26C:AR p.174, 203]` [`ORA-WEB:faofc/lockbox-standard-receipt-import-process`](https://docs.oracle.com/en/cloud/saas/financials/26c/faofc/lockbox-standard-receipt-import-process.html) |
| 12 | **Reconcile** — The statement line is matched to the receipt by reconciliation rules. | Cash Management | Load bank statement; Autoreconciliation | Bank statement, Receipts → Reconciled receipt |  | Cash: cash confirmed in the bank | `[ORA26C:FIN p.197]` `[ORA26C:AR p.353]` |

Hand-offs: Customer PO → Sales order (EDI 850); Sales order → Credit check; Credit check → Schedule and reserve (approved); Schedule and reserve → Pick, pack, ship (shipment request); Pick, pack, ship → Deferred COGS (SO issue); Pick, pack, ship → Invoice (billing lines); Invoice → Recognise revenue; Recognise revenue → Recognise COGS (revenue %); Invoice → Customer pays (invoice); Customer pays → Lockbox receipt (lockbox); Lockbox receipt → Reconcile (deposit).

## 2. Customer return

A retailer returns a damaged pallet: a return order (RMA), receipt back into the warehouse, a credit memo and the cost reversal.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Customer returns** — The customer asks to return goods from a fulfilled or closed order line. | Customer |  | Return request |  |  | `[ORA26C:OMU p.142]` |
| 2 | **Return order (RMA)** — The return references the original line (returnable quantity = ordered minus prior returns) and sets the warehouse that receives it. Return for Credit gives credit without the goods. | Order Management | Create return; Submit | Original order line → Return order |  |  | `[ORA26C:OMU p.141, 142]` |
| 3 | **Receive the return** — The warehouse receives against the RMA and puts the goods away (or into a quarantine subinventory). | Receiving · inventory | Receive Expected Shipments; Put Away Receipts | Returned goods → RMA receipt |  | Inventory: returned lots back on hand | `[ORA26C:OMU p.150]` `[ORA26C:RCV p.62]` |
| 4 | **Receipt confirmation** — The scheduled process imports the receiving status into Order Management. | Order Management | Send Receipt Confirmation | RMA receipt → Line ready for billing |  |  | `[ORA26C:OMU p.151]` |
| 5 | **Credit memo** — Billing sends the return line to AutoInvoice, which creates a credit memo (the transaction type is Credit Memo for return lines). | Receivables | Import AutoInvoice | Return line → Credit memo | Credit memo: Dr Revenue, Tax payable / Cr Receivable |  | `[ORA26C:OMU p.89]` `[ORA26C:AR p.80]` `[INFERRED]` |
| 6 | **Cost of the return** — The return receipt is costed back into inventory, reversing COGS. | Cost Management | Create Cost Accounting Distributions | RMA receipt → Cost journal | Return to stock: Dr Inventory valuation / Cr COGS | Cost: COGS reversed | `[INFERRED]` |

Hand-offs: Customer returns → Return order (RMA) (return request); Return order (RMA) → Receive the return (expected receipt); Receive the return → Receipt confirmation (received); Receive the return → Cost of the return (receipt); Receipt confirmation → Credit memo (billing).

**Damaged goods.** Returned lots that can't be resold are put away to a quarantine subinventory and scrapped (see Make & Inventory › Lot expiry, holds and recall).

## 3. Drop ship

A food-service customer orders an item FBCo doesn't stock: the supplier ships straight to the customer and FBCo bills it.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Sales order** — The supplier ships the order directly to the customer, bypassing FBCo's plants and warehouses. | Order Management | Import Sales Orders | Customer order → Drop ship line |  |  | `[ORA26C:OM p.43]` |
| 2 | **Requisition and PO** — Supply Chain Orchestration creates a purchase requisition for each drop ship line; Purchasing turns it into a drop ship PO. | Orchestration · purchasing | Requisition creation; Purchase order creation | Drop ship line → Drop ship PO |  |  | `[ORA26C:OM p.855, 827]` |
| 3 | **Supplier ships to customer** — The supplier ships and either sends an ASN or just invoices FBCo. | Supplier |  | Drop ship PO → Goods to the customer, ASN or invoice |  |  | `[ORA26C:RCV p.79, 80]` |
| 4 | **Customer receives** — The goods arrive at the customer's site. | Customer |  | Goods |  |  | `[ORA26C:RCV p.79]` |
| 5 | **Drop ship receipt** — The ASN, or the AP invoice, generates a drop ship receipt and delivery, which starts costing and billing. | Receiving | Transfer Invoice Details to Supply Chain Financial Flow Orchestration; Transfer Ownership Change Events to Receiving; Manage Receiving Transactions | ASN or AP invoice → Drop ship receipt and delivery |  | Cost: costed as a receipt and an immediate sales issue; no on-hand change | `[ORA26C:RCV p.80]` |
| 6 | **Supplier invoice** — Payables matches the supplier's invoice to the PO. | Payables | Import Payables Invoices; Validate Payables Invoices | Invoice → Approved invoice | Invoice matched to the PO: Dr Uninvoiced receipts accrual, Invoice price variance, Recoverable tax / Cr Supplier liability |  | `[ORA26C:RCV p.80]` |
| 7 | **Bill the customer** — The shipment record releases billing; AutoInvoice creates the customer invoice. | Receivables | Create Billing Lines; Import AutoInvoice | Shipped line → Customer invoice | Customer invoice: Dr Receivable / Cr Revenue, Tax payable |  | `[ORA26C:RCV p.80]` `[ORA26C:OM p.58]` `[INFERRED]` |

Hand-offs: Sales order → Requisition and PO (drop ship line); Requisition and PO → Supplier ships to customer (PO); Supplier ships to customer → Customer receives (goods); Supplier ships to customer → Drop ship receipt (ASN / invoice); Drop ship receipt → Supplier invoice; Drop ship receipt → Bill the customer (billing).

**Returns.** A drop shipment can't be returned straight to the supplier: it comes back into a warehouse first, then goes to the supplier.

## 4. Intercompany sale MX → US

The Mexican plant ships concentrates to the US distribution centre. The goods move once; Financial Orchestration creates the intercompany sale in Mexico and the purchase in the US at a transfer price.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Transfer request** — Planning or min-max at the US DC requests supply from the MX plant. | US DC (buyer) | Create Supply Request | Demand → Transfer order |  |  | `[ORA26C:MFG p.37]` |
| 2 | **Ship from MX** — The MX plant ships the lots; the physical shipment starts the financial flow. | MX plant shipping | Ship Confirm | Transfer order → Shipment |  | Inventory: MX on hand reduced | `[ORA26C:SCFO p.3]` `[ORA26C:MFG p.44]` |
| 3 | **Financial orchestration** — Processes the shipment event and prices it with the transfer pricing rules (cost plus a markup). | Financial Orchestration | Submit Financial Orchestration Events | Shipment event → Intercompany trade documents |  | Cost: transfer price = cost + markup | `[ORA26C:SCFO p.3]` `[ORA26C:OMU p.70]` |
| 4 | **Intercompany AR invoice** — Mexico invoices the US entity at the transfer price. | MX Receivables | Import AutoInvoice | Trade document → Intercompany invoice | Seller (MX): Dr Intercompany receivable / Cr Intercompany revenue |  | `[ORA26C:SCFO p.3]` `[INFERRED]` |
| 5 | **Intercompany AP invoice** — The US entity records the payable. | US Payables | Import Payables Invoices | Trade document → Intercompany payable | Buyer (US): Dr Inventory (at transfer price) / Cr Intercompany payable |  | `[ORA26C:SCFO p.3]` `[INFERRED]` |
| 6 | **Receive at the US DC** — The DC receives and puts the lots away. | US DC (buyer) | Receive Expected Shipments | Goods in transit → Receipt |  | Inventory: US on hand increases at transfer price | `[ORA26C:MFG p.44]` |
| 7 | **Cost both sides** — Mexico relieves inventory to intercompany COGS; the US values the receipt at the transfer price. | Cost Management | Create Cost Accounting Distributions | Shipment and receipt → Cost journals | Seller cost (MX): Dr Intercompany COGS / Cr Inventory valuation |  | `[ORA26C:SCFO p.3]` `[INFERRED]` |

Hand-offs: Transfer request → Ship from MX (transfer order); Ship from MX → Financial orchestration (shipment event); Financial orchestration → Intercompany AR invoice (sale); Financial orchestration → Intercompany AP invoice (purchase); Ship from MX → Receive at the US DC (in transit); Ship from MX → Cost both sides.

**Eliminations.** Intercompany revenue, COGS and the margin left in US inventory are eliminated in consolidation (Record to Report › Consolidation).
