---
id: MFG-WF-P2P
type: workflows
title: Procure to Pay workflows — FBCo
links: [MFG-OVERVIEW, MFG-PROCESSES]
generated: from the map generator; edit the generator, not this file
---

# Procure to Pay workflows

From need to payment: goods, services, returns, consigned stock and employee expenses, with the accrual, inventory and cost effect of each step.

Each scenario is a swimlane on the map: lanes are modules, steps are processes, arrows are the documents or
transactions passed between them. Evidence keys are listed in `manufacturing/00-overview.md`; `ORA-WEB` links
point to Oracle's 26C web documentation; `[INFERRED]` marks lines no source states (see `manufacturing/open-questions.md`).

## 1. Goods: requisition to payment

Ingredients and packaging: from a planned or requested need to a reconciled payment. Inventory items accrue at receipt; the receipt, the delivery, the invoice and the payment each create accounting.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Requisition** — Planning Central releases planned buy orders as requisitions; employees raise catalogue or non-catalogue requests. Approval runs by amount and category. | Planning · requisitions | Release planned orders; Requisition approval; Import Requisitions | Planned buy order or employee request → Approved requisition line |  |  | `[ORA26C:PLN p.13, 19]` `[ORA26C:PRC p.201]` |
| 2 | **Purchase order** — The buyer (or automatic document creation) turns approved requisition lines into PO lines, priced from agreements. The approved PO schedule becomes an expected receipt. | Purchasing | Process Requisitions; Purchase order approval; Import Orders | Approved requisition line → Approved PO, communicated to the supplier, PO schedule = expected receipt |  |  | `[ORA26C:PRC p.745]` `[ORA26C:PRC p.5]` |
| 3 | **Supplier ships** — The supplier ships the goods. An advance shipment notice (ASN) from the Supplier Portal or EDI lets Receiving receive against it. | Supplier · bank |  | Purchase order → Goods, ASN |  |  | `[ORA26C:RCV p.21]` |
| 4 | **Receive and inspect** — Goods are received against the PO schedule or ASN and inspected for food safety. Lot numbers and expiry dates are captured at receipt. | Receiving | Receive Expected Shipments; Inspect Receipts; Receiving Transaction Manager | Goods and ASN, PO schedule → Receipt (in receiving inspection) |  | Accrual: inventory purchases accrue at receipt: the uninvoiced receipt is a liability from this point | `[ORA26C:RCV p.108]` `[ORA26C:MFG p.341]` |
| 5 | **Receipt accrual** — Receipt Accounting books the receipt into inspection against the uninvoiced receipts accrual. | Cost Management | Create Receipt Accounting Distributions; Create Accounting (Receipt Accounting) | Receipt → Receipt accrual journal | Receipt into inspection: Dr Receiving inspection (asset) / Cr Uninvoiced receipts accrual (liability) | Accrual: uninvoiced receipts accrual raised | `[ORA26C:MFG p.341, 344]` |
| 6 | **Put away to stock** — Delivery moves the lots from receiving into the ingredient or packaging subinventory. On-hand increases by lot and expiry date. | Inventory | Put Away Receipts; Transfer Inventory Transactions to Costing | Receipt → On-hand lots, Inventory transaction to costing |  | Inventory: on-hand quantity increases by lot, with its expiry date | `[ORA26C:MFG p.55, 116]` |
| 7 | **Inventory valuation** — Cost Accounting values the delivery. Under standard cost (US plant) the difference between PO price and standard cost is purchase price variance. | Cost Management | Create Cost Accounting Distributions; Create Accounting (Cost Management) | Inventory transaction → Cost accounting journal | Delivery to inventory: Dr Inventory valuation, Purchase price variance (standard cost) / Cr Receiving inspection | Cost: PPV = (PO price − standard cost) × quantity under standard cost | `[ORA26C:MFG p.383, 394]` `[ORA26C:MFG p.102]` |
| 8 | **Supplier invoices** — The supplier sends the invoice for the PO. | Supplier · bank |  | Shipment → Supplier invoice |  |  | `[ORA26C:AP p.13]` |
| 9 | **Import and match** — The invoice is imported (AP_INVOICES_INTERFACE) or keyed, then matched to the PO (2-way) or to the receipt (3-way). | Payables | Import Payables Invoices; Match to purchase order or receipt | Supplier invoice, PO and receipt → Matched invoice |  |  | `[ORA26C:AP p.39, 75]` `[ORA26C:AP p.13]` |
| 10 | **Validate and approve** — Validation checks matching tolerances and places holds; it calculates tax and price variances. The approval workflow routes the invoice; Create Accounting books it. | Payables | Validate Payables Invoices; Initiate Invoice Approval Workflow; Create Accounting (Payables) | Matched invoice → Validated, approved invoice, Invoice journal | Invoice matched to the PO: Dr Uninvoiced receipts accrual, Invoice price variance, Recoverable tax / Cr Supplier liability | Accrual: the invoice relieves the uninvoiced receipts accrual<br>Cost: invoice price variance when the invoice price differs from the PO | `[ORA26C:AP p.13, 189]` `[ORA26C:AP p.39]` |
| 11 | **Match receipt accruals** — Receipt Accounting pairs the invoice with the receipt accrual; Clear Receipt Accrual Balances clears what remains by rule. | Cost Management | Match Receipt Accruals; Clear Receipt Accrual Balances | Invoice accounting, Receipt accrual → Matched (cleared) accrual |  | Accrual: accrual balance cleared; residuals cleared by rule | `[ORA26C:MFG p.341]` |
| 12 | **Pay** — A payment process request selects due installments, builds and formats payments and transmits the file (see Treasury › Payments to bank). FBCo accounts payments at issue and at clearing. | Payables | Submit Payment Process Request; Create Accounting (Payables) | Approved invoices → Payment file, Payment journal | Payment (accounted at issue): Dr Supplier liability / Cr Cash clearing | Cash: cash clearing credited at issue | `[ORA26C:AP p.195, 199]` `[ORA26C:AP p.39, 76]` [`ORA-WEB:faipp/guidelines-for-payment-accounting-options`](https://docs.oracle.com/en/cloud/saas/financials/26c/faipp/guidelines-for-payment-accounting-options.html) |
| 13 | **Bank pays supplier** — The bank executes the payments and reports them on the statement. | Supplier · bank |  | Payment file → Bank statement |  |  | `[ORA26C:AP p.199]` |
| 14 | **Reconcile** — The statement line is matched to the payment. Reconciliation clears the payment, which accounts the move from cash clearing to cash. | Cash Management | Process Electronic Bank Statements; Autoreconciliation; Create Accounting (Payables) | Bank statement, Payments → Reconciled, cleared payment | Payment cleared (accounted at clearing): Dr Cash clearing / Cr Cash | Cash: payment cleared at the bank | `[ORA26C:FIN p.197]` `[ORA26C:AR p.353]` `[ORA26C:AP p.76]` [`ORA-WEB:fappp/how-invoices-and-payments-are-accounted`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/how-invoices-and-payments-are-accounted.html) |

Hand-offs: Requisition → Purchase order (requisition line); Purchase order → Supplier ships (PO); Supplier ships → Receive and inspect (goods + ASN); Receive and inspect → Receipt accrual (receipt); Receive and inspect → Put away to stock (deliver); Put away to stock → Inventory valuation (inventory txn); Supplier invoices → Import and match (invoice); Receive and inspect → Import and match (3-way match); Import and match → Validate and approve (matched); Receipt accrual → Match receipt accruals (accrual); Validate and approve → Match receipt accruals (invoice); Validate and approve → Pay (approved); Pay → Bank pays supplier (payment file); Bank pays supplier → Reconcile (statement).

**Accrual policy.** Inventory purchases must accrue at receipt; expense purchases may accrue at period end (see Services and expense items).

**Mexico.** FBCo México uses perpetual average cost: the receipt updates the item's average cost instead of creating a purchase price variance.

**Two US business units.** US Manufacturing BU is the Procurement Services BU for US Distribution BU: DC requisitions become POs there, supplier sites are assigned to both US invoicing BUs, and the DC's receipts and invoices are accounted in company 102.

## 2. Services and expense items

MRO, maintenance and professional services: amount-based or expense lines that never enter inventory. They can be matched to a work confirmation or receipt, or paid on 2-way match, and accrue at period end.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Requisition** — A requester orders a service (Fixed Price Services line type: category, description, total amount) or a non-stock item charged to an expense account. | Requisitions | Requisition approval | Request → Approved requisition line |  |  | `[ORA26C:PRC p.737]` `[ORA26C:PRC p.201]` |
| 2 | **Purchase order** — The PO line carries the amount and the expense charge account. Fixed price services are received and matched by amount. | Purchasing | Process Requisitions; Purchase order approval | Requisition line → Approved PO |  |  | `[ORA26C:PRC p.737]` |
| 3 | **Service performed** — The supplier performs the service and may submit a work confirmation in the Supplier Portal. | Supplier |  | PO → Work confirmation or service delivered |  |  | `[ORA26C:PRC p.737]` |
| 4 | **Receive by amount** — The requester confirms delivery by amount (or quantity for expense items). No inventory is created. | Receiving | Receive Expected Shipments | Work confirmation → Receipt (expense destination) |  |  | `[ORA26C:PRC p.737]` `[ORA26C:RCV p.108]` |
| 5 | **Period-end accrual** — Received but uninvoiced expense lines are accrued at period end and reversed in the next period. | Receipt Accounting | Create Receipt Accounting Distributions (period-end accrual); Create Accounting (Receipt Accounting) | Uninvoiced receipts at period end → Accrual journal, reversed next period | Period-end accrual (expense PO): Dr Expense / Cr Uninvoiced receipts accrual | Accrual: accrued at period end, reversed next period | `[ORA26C:MFG p.344]` |
| 6 | **Supplier invoices** — The supplier invoices the service. | Supplier |  | Service → Invoice |  |  | `[ORA26C:AP p.13]` |
| 7 | **Match and validate** — The invoice is matched to the PO (2-way) or to the receipt; validation checks tolerances. Without an accrual, the invoice books the expense directly. | Payables | Import Payables Invoices; Validate Payables Invoices; Initiate Invoice Approval Workflow | Invoice, PO or receipt → Approved invoice | Invoice (accrue at period end): Dr Expense, Recoverable tax / Cr Supplier liability |  | `[ORA26C:AP p.39, 75]` `[ORA26C:AP p.13]` |
| 8 | **Pay** — Paid in the same payment run as goods invoices (see Treasury). | Payables | Submit Payment Process Request | Approved invoice → Payment | Payment (accounted at issue): Dr Supplier liability / Cr Cash clearing | Cash: cash clearing credited at issue | `[ORA26C:AP p.195]` |

Hand-offs: Requisition → Purchase order (requisition line); Purchase order → Service performed (PO); Service performed → Receive by amount (confirmation); Receive by amount → Period-end accrual (uninvoiced at month end); Supplier invoices → Match and validate (invoice); Receive by amount → Match and validate (match to receipt); Match and validate → Pay (approved).

**Two policies.** Accrue at receipt credits the accrual when goods arrive; accrue at period end credits Payables when the invoice is processed, and Receipt Accounting accrues uninvoiced receipts at period end.

## 3. Supplier return

A lot fails inspection or is damaged: it goes back to the supplier, the PO reopens for the returned quantity and a debit memo reduces what FBCo owes.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Inspection fails** — The lot is rejected in inspection, or found damaged after delivery. A return needs a valid receipt and a PO that isn't canceled or final closed. | Receiving | Inspect Receipts | Receipt → Rejected quantity |  |  | `[ORA26C:RCV p.61]` |
| 2 | **Return to supplier** — Receiving creates a Return to Receiving and a Return to Supplier transaction and reopens the PO for the returned quantity. Lot numbers are entered on the return. | Receiving | Return Receipts | Rejected or delivered lots → Return transaction, PO reopened for the quantity |  | Inventory: on hand reduced when the return is from stock (lot entered) | `[ORA26C:RCV p.62]` `[ORA26C:RCV p.61]` |
| 3 | **Goods back to supplier** — The supplier takes the goods back and issues a credit, or replaces them. | Supplier |  | Returned goods → Credit or replacement |  |  | `[ORA26C:RCV p.62]` |
| 4 | **Reverse receipt accounting** — The return reverses the receipt accrual (and inventory valuation if delivered). | Cost Management | Create Receipt Accounting Distributions; Create Cost Accounting Distributions | Return transaction → Reversing journals | Return of a delivered lot: Dr Uninvoiced receipts accrual (or receiving inspection) / Cr Inventory valuation | Accrual: receipt accrual reduced<br>Inventory: inventory valuation reduced | `[ORA26C:RCV p.62]` `[INFERRED]` |
| 5 | **Debit memo** — Depending on the supplier site setting, a debit memo is created automatically for the return; otherwise Payables creates it manually. It isn't automatic for consigned items. | Payables | Create debit memo from the return; Validate Payables Invoices | Return transaction → Debit memo | Debit memo: Dr Supplier liability / Cr Uninvoiced receipts accrual (or the original charge) |  | `[ORA26C:RCV p.62]` |
| 6 | **Net in next payment** — The negative debit memo is selected with the supplier's other due invoices in the next payment run. | Payables | Submit Payment Process Request | Debit memo, Due invoices → Lower payment |  | Cash: lower payment to the supplier | `[ORA26C:AP p.195]` `[INFERRED]` |

Hand-offs: Inspection fails → Return to supplier (rejected); Return to supplier → Goods back to supplier (return); Return to supplier → Reverse receipt accounting (return txn); Return to supplier → Debit memo (debit memo); Debit memo → Net in next payment (applied).

**Credit vs replacement.** If the supplier replaces the goods instead of issuing credit, the PO reopened by the return is received again and no debit memo is needed.

## 4. Supplier-consigned inventory

Packaging held at the plant but owned by the supplier until FBCo uses it. Consumption transfers ownership; a periodic consumption advice is the basis for the invoice.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Consignment agreement** — A consignment agreement with the supplier sets the price used when stock is consumed. | Purchasing | Purchase agreement with consignment terms | Consignment agreement |  |  | `[ORA26C:MFG p.191]` |
| 2 | **Supplier ships** — The supplier ships against a consignment order. | Supplier |  | Consignment order → Goods |  |  | `[ORA26C:MFG p.190]` |
| 3 | **Receive as consigned** — Received goods are held as consigned stock: in FBCo's possession, owned by the supplier. They are accounted in consigned clearing and accrual accounts, not owned inventory. | Receiving | Receive Expected Shipments; Create Receipt Accounting Distributions | Goods → Consigned on-hand | Consigned receipt: Dr Consigned clearing / Cr Consigned accrual<br>Consigned delivery: Dr Consigned inventory / Cr Consigned clearing | Inventory: on hand increases, owning party = supplier | `[ORA26C:MFG p.190]` [`ORA-WEB:fapma/example-of-consigned-inventory-accounting-in-a-simple-purchase`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/example-of-consigned-inventory-accounting-in-a-simple-purchase.html) |
| 4 | **Consume** — Using the stock (for example a material issue) triggers consumption under the consumption rules: a Transfer to Owned transaction, then the movement itself. | Inventory | Consumption rules (implicit); Create Transfer to Owned Transaction (explicit) | Material issue → Transfer to Owned + movement |  | Inventory: ownership moves to FBCo at consumption | `[ORA26C:MFG p.190, 191]` `[ORA26C:RCV p.10]` |
| 5 | **Value owned stock** — The transfer to owned is priced from the consignment agreement at the consumption date; the consigned entries reverse and a normal owned receipt follows. | Cost Management | Create Receipt Accounting Distributions; Create Cost Accounting Distributions | Transfer to Owned → Cost journals | Transfer to Owned issue: Dr Consigned inventory offset / Cr Consigned inventory<br>Consigned receipt consumption: Dr Consigned accrual / Cr Consigned clearing<br>Trade receipt accrual: Dr Trade clearing / Cr Uninvoiced receipts accrual | Accrual: liability to the supplier recognised at consumption<br>Cost: priced from the consignment agreement | `[ORA26C:MFG p.191]` [`ORA-WEB:fapma/example-of-consigned-inventory-accounting-in-a-simple-purchase`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/fapma/example-of-consigned-inventory-accounting-in-a-simple-purchase.html) |
| 6 | **Consumption advice** — Create Consumption Advice summarises consumption for the supplier (by supplier and site) and sends it by print, email or the Supplier Portal. It is the document for financial settlement. | Inventory | Create Consumption Advice; Review Consumption Advices | Consumption transactions → Consumption advice |  |  | `[ORA26C:MFG p.191, 190]` `[ORA26C:RCV p.10]` [`ORA-WEB:famml/considerations-for-the-create-consumption-advice-process`](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26c/famml/considerations-for-the-create-consumption-advice-process.html) |
| 7 | **Invoice matched to advice** — The supplier invoice is matched one-to-one to the consumption advice; with Pay on Use on the agreement, Create Consumption Advice creates a self-billed invoice. | Payables | Import Payables Invoices (consumption advice matching); Validate Payables Invoices | Invoice, Consumption advice → Approved invoice | Invoice: Dr Uninvoiced receipts accrual / Cr Supplier liability |  | `[ORA26C:AP p.41, 93, 138]` `[ORA26C:MFG p.190]` [`ORA-WEB:fappp/what-s-a-self-billed-invoice`](https://docs.oracle.com/en/cloud/saas/financials/26c/fappp/what-s-a-self-billed-invoice.html) |

Hand-offs: Consignment agreement → Supplier ships (consignment order); Supplier ships → Receive as consigned (goods); Receive as consigned → Consume (consigned stock); Consume → Value owned stock (transfer to owned); Consume → Consumption advice (consumption); Consumption advice → Invoice matched to advice (advice); Consignment agreement → Value owned stock (price).

## 5. Employee expenses

Travel and plant-visit expenses: corporate card transactions and cash expenses on an expense report, approved, audited and reimbursed through Payables.

| # | Step | Module | Process or task | In → Out | Dr / Cr | Impact | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | **Card transactions file** — The corporate card issuer sends transaction files; Upload Corporate Card Transactions loads and validates them, and valid transactions become expense items. | Card issuer · employee | Upload Corporate Card Transactions | Card transaction file |  |  | `[ORA26C:EXM p.39]` [`ORA-WEB:fawde/how-corporate-card-transaction-files-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fawde/how-corporate-card-transaction-files-are-processed.html) |
| 2 | **Expense report** — The employee picks card transactions and adds cash expenses, marking card items business or personal, then submits. | Expenses | Create and submit expense report | Card transactions, Receipts → Submitted report |  |  | `[ORA26C:EXM p.41]` |
| 3 | **Approve and audit** — The manager approves; the auditor then checks receipts and policy on Audit Expense Report (complete, reject, request information, short pay, adjust accounting). Status becomes Ready for payment processing. | Expenses | Expense report approval; Audit Expense Report | Submitted report → Audited report |  |  | `[ORA26C:EXM p.41]` `[ORA26C:EXM p.5]` [`ORA-WEB:fawde/overview-of-the-audit-expense-report`](https://docs.oracle.com/en/cloud/saas/financials/26c/fawde/overview-of-the-audit-expense-report.html) |
| 4 | **Create the invoice** — Process Expense Reimbursements and Cash Advances fills the Payables open interface and runs Import Payables Invoices, creating employee (and card issuer) payment requests. | Payables | Process Expense Reimbursements and Cash Advances | Audited report → Payables invoice | Expense report (Individual Pay): Dr Expenses / Cr Employee liability |  | `[ORA26C:EXM p.41]` [`ORA-WEB:fawde/how-expense-report-payment-requests-are-processed`](https://docs.oracle.com/en/cloud/saas/financials/26c/fawde/how-expense-report-payment-requests-are-processed.html) |
| 5 | **Reimburse** — The employee is paid by the payment run (electronic or check). | Payables | Submit Payment Process Request | Invoice → Reimbursement | Reimbursement: Dr Employee liability / Cr Cash | Cash: employee reimbursed | `[ORA26C:EXM p.41]` `[ORA26C:AP p.195]` |

Hand-offs: Card transactions file → Expense report (card items); Expense report → Approve and audit (submitted); Approve and audit → Create the invoice (approved); Create the invoice → Reimburse (invoice).

**Payment options.** Individual Pay: the employee pays the card issuer. Company Pay: FBCo pays the issuer for all transactions. Both Pay: FBCo pays business items and the employee pays personal ones.
