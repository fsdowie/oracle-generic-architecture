---
id: MFG-PROCESSES
type: reference
title: Key processes per module — FBCo
links: [MFG-OVERVIEW, MFG-P2P, MFG-P2M, MFG-O2C, MFG-R2R, MFG-CLOSE]
---

# Key processes per module

The scheduled processes and activities that matter most for each module. Names are as printed in the guides.

| Module | Key processes | Evidence |
|---|---|---|
| General Ledger | Import Journals; Post Journals; Generate Allocations; Generate Intercompany Allocations; Revalue Balances; Translate General Ledger Account Balances; Transfer Balances to Secondary Ledger; Open and Close Periods | `[ORA26C:GL p.178, 389, 530, 533, 568]` |
| Subledger Accounting | Create Accounting (and transfer to GL); accounting methods, journal entry rule sets, account rules, mapping sets | `[ORA26C:SLA p.7-13]` |
| Payables | Import Payables Invoices; Validate Payables Invoices; Initiate Invoice Approval Workflow; Create Accounting; Submit Payment Process Request | `[ORA26C:AP p.13, 75, 189, 195]` |
| Receivables | Import AutoInvoice; Recognize Revenue; Process Receipts Through Lockbox; Create Receivables Accounting | `[ORA26C:AR p.13, 105, 203, 318]` |
| Cash Management | Load the bank statement file (automated process); run the reconciliation process with reconciliation matching rules | `[ORA26C:FIN p.197]` `[ORA26C:AR p.353]` |
| Suppliers | Import Suppliers (sites, contacts, site assignments) | `[ORA26C:PRC p.915]` |
| Purchasing / Self Service Procurement | Requisition approval; PO creation from requisitions; PO approval | `[ORA26C:PRC p.201]` |
| Receiving | Receive, inspect, put away; Receiving Transaction Manager | `[ORA26C:RCV p.108]` |
| Receipt Accounting | Create Receipt Accounting Distributions; Match Receipt Accruals; Clear Receipt Accrual Balances; Create Accounting (Receipt Accounting) | `[ORA26C:MFG p.341]` |
| Inventory Management | Inventory transactions (issue, transfer, misc.); cycle counts; lot expiry; Transfer Inventory Transactions to Costing | `[ORA26C:MFG p.116, 140]` |
| Manufacturing | Import Work Orders; material, resource and operation transactions; product completion | `[ORA26C:MFG p.478, 548]` |
| Cost Accounting | Standard Cost Import; Create Cost Accounting Distributions; Calculate Overhead Absorption; close cost accounting periods; Analyze Product Gross Margins | `[ORA26C:MFG p.359, 408]` |
| Planning Central | Run plan; review and release planned orders | `[ORA26C:PLN p.13, 19]` |
| Shipping | Pick, pack, Ship Confirm | `[ORA26C:SHP p.14]` |
| Financial Orchestration | Financial orchestration flows, transfer pricing rules, intercompany invoices; Submit Financial Orchestration Events | `[ORA26C:SCFO p.3]` `[ORA26C:OMU p.70]` |
| Fixed Assets | Create Mass Additions (from Payables); Post Mass Additions; Calculate Depreciation (and close the period); Perform Periodic Mass Copy (tax book); Create Accounting for Assets | `[ORA26C:FA p.8, 10, 15, 18, 32]` |
| Order Management | Load Interface File for Import; Import Sales Orders; Plan Orchestration Processes; Update or Close Sales Orders; Import AutoInvoice (Receivables) | `[ORA26C:OM p.58-59]` |
