---
id: INS-DATA
type: data-and-reporting
title: ADW, integrations, reconciliation and reporting — Insurer
as_of: 2023-08
links: [INS-FOUNDATION, INS-P2P, INS-R2R]
---

# Data, integration and reporting

## Autonomous Data Warehouse (ADW)
- **Finance transaction data warehouse** on ADW: a financial report mart of all transactional modules (live February 2021), plus PeopleSoft history and policy-administration data `[CO:INS-NB p.482, 490, 681]`.
- **Insurance data mart** schemas: stage (daily feeds), temp (journal breakdowns) and an integrated-journal schema with tables for premium, commission, claims, case reserves, new / renewed / cancelled policies and policy counts `[CO:INS-NB p.149, 315]`.
- ADW is the source for OAC dashboards and BI Publisher reports, and the landing point for Fusion extracts `[CO:INS-NB p.681, 765]`.

## How data moves
| Path | Mechanism | Evidence |
|---|---|---|
| Fusion → ADW (report-based) | OIC scheduled orchestration invokes a BI Publisher report through the report web service, stages the file, then inserts rows into an ADW table (delete-and-reload) | `[CO:INS-NB p.283–312]` |
| Fusion → files (bulk) | OIC uses the ERP extract-bulk-data pattern: an ESS job writes the extract, a business event triggers download to object storage or FTP | `[CO:INS-NB p.224–274]` |
| Fusion Payables → ADW | OneCloud chain for the invoice-imaging audit data set | `[CO:INS-NB p.763]` |
| Data Sync → ODI / OCI Data Integration | Data Sync replaced by Data Integrator / OCI Data Integration workspaces, with an API gateway for REST sources | `[CO:INS-NB p.176–182, 351]` |
| Fusion GL ↔ Planning | EPM Data Management: actuals to Planning; budget and statistical journals back to GL | `[CO:INS-NB p.499]` |
| Planning → OAC Essbase | OneCloud chain loads the Planning financials into the OAC Essbase reporting cube; OneCloud also copies EPM and Essbase backups | `[CO:INS-NB p.682, 689]` |
| ADW → OAC Essbase | Operational metrics into the financials cube | `[CO:INS-NB p.499]` |

## Reconciliation
- **Account Reconciliation (EPM)** for balance sheet reconciliations `[CO:INS-NB p.408]`.
- **OTBI reconciliation subject areas:** Payables to Ledger and Receivables to Ledger reconciliation, alongside GL Balances and GL Journals real-time `[CO:INS-NB p.512]`.
- **Policy feed checks:** SQL against the stage tables by load date and transaction code to tie the daily journal back to source `[CO:INS-NB p.315]`.
- **Extract checks:** before/after spot checks of Fusion report output against the ADW table `[CO:INS-NB p.185]`.
- **Invoice imaging audit:** SQL views in ADW for "imported but not validated", "deleted after import" and "not imported", shown in an OAC dashboard `[CO:INS-NB p.762, 767]`.

## Reporting tools
| Tool | Use at the Insurer | Evidence |
|---|---|---|
| **OTBI** | Real-time analyses on Finance and Procurement subject areas; roles per subject area; GL cube settings for balances | `[CO:INS-NB p.411, 512, 790–793]` |
| **BI Publisher** | Custom reports and data models (e.g. COA segment extract used by integrations); scheduled outputs delivered to a content-cloud folder for Accounting. Replaced about 130 legacy Business Objects reports, consolidated to about 50 | `[CO:INS-NB p.292, 495, 695]` |
| **Financial Reporting Studio** | About 20 financial statements on the GL balances cube: statutory balance sheet, P&L trends (5-year, MTD/YTD vs prior year, quarterly), unallocated P&L by product, investment P&L, other insurance expenses, statement of surplus, statutory income statement by line of business, cash flow; Foundation not-for-profit statements; Agency statements | `[CO:INS-NB p.486, 503–504]` |
| **Smart View** | Ad hoc analysis on the GL balances cube and on OAC Essbase | `[CO:INS-NB p.385, 494]` |
| **OAC** | BI dashboards (semantic model with physical, logical and presentation layers), Essbase financials cube, Data Visualization with data flows and data sets | `[CO:INS-NB p.413–416, 681, 783–789]` |
| **Infolets** | Fusion home-page tiles, e.g. contracts expiring this week | `[CO:INS-NB p.779–781]` |
Financial-report design rules: period activity for income-statement accounts, ending balance for balance-sheet accounts, YTD for equity, and conditional formatting so revenue shows positive `[CO:INS-NB p.470–471]`.

## Four types of finance reporting (the target model) `[CO:INS-NB p.774]`
Operational (ERP: OTBI, BI Publisher) · Management (EPM, Essbase) · Enterprise analytics (OAC on ADW) · Regulatory (statutory statements).
