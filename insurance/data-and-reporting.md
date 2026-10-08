---
id: INS-DATA
type: data-and-reporting
title: ADW, integrations, reconciliation and reporting — Insurer
as_of: 2023-08
links: [INS-FOUNDATION, INS-P2P, INS-R2R]
---

# Data, integration and reporting

## Autonomous Data Warehouse (ADW)
- **What it is:** an **Oracle Autonomous Database** with the *Data Warehouse* workload, provisioned in OCI under Autonomous Database (listed alongside Autonomous Transaction Processing) `[CO:INS-NB p.683]`. It is Oracle's database, not Essbase.
- **Finance Transaction Data Warehouse** (one database): transaction-level data — a financial report mart of all Fusion transactional modules (live February 2021), PeopleSoft Financials history, and policy data brought over from the on-premise BIM database `[CO:INS-NB p.482, 490, 681]`. A second ADW instance served IT for ODI and APEX `[CO:INS-NB p.182, 713]`.
- **Insurance data mart** schemas: stage (daily feeds), temp (journal breakdowns) and an integrated-journal schema with tables for premium, commission, claims, case reserves, new / renewed / cancelled policies and policy counts `[CO:INS-NB p.149, 315]`.
- ADW is the source for OAC dashboards and BI Publisher reports, and the landing point for Fusion extracts `[CO:INS-NB p.681, 765]`.

## On-premise data warehouses (SQL Server)
- **EDW** — the enterprise data warehouse on SQL Server, with a Finance workgroup database `[CO:INS-NB p.401–403, 693]`.
- **BIM** — the business-information reporting database on SQL Server that holds the Exceed policy, premium and claims reporting data; legacy BIM reports (and their history archive) came from here `[CO:INS-NB p.313, 316, 403]`.
- **HDS** — a SQL Server data store; a few BIM reports were sourced from DB2 through it `[CO:INS-NB p.403, 693]`.
- A dedicated load server moved BIM data into ADW `[CO:INS-NB p.400]`; some reporting data still lived in BIM after the move `[CO:INS-NB p.695]`.
- None of these is Essbase.

## Integration VM and Data Integration
- An on-premise **integration VM** ran DataSync (BIM → ADW insurance data mart stage), **Oracle Data Gateway** (on-premise data to OAC) and **GroundRunner** (Workiva (OneCloud) agent, EPM automation) `[CO:INS-ERP p.155, 157]`. After monthly server patching the services sometimes didn't restart, stopping the daily Exceed load until restarted `[CO:INS-ERP p.155]`.
- **OCI Data Integration ("Fast Connect")** replaced DataSync for Exceed data feeding FP&A, converting the BIM reports (e.g. six-month auto policy reporting) and retiring BIM — treated as implemented `[USER:2026-10-08]` `[CO:INS-ERP p.166–168]`.
- How the dashboards use all of this: `insurance/dashboards.md`.

## Where Essbase sits
- **OAC Essbase financials cube** — loaded from Planning by Workiva (OneCloud) (plus operational metrics from ADW); the main source behind the finance dashboards `[CO:INS-NB p.681–682, 499]`.
- **Fusion GL balances cube** — the Essbase cube inside Fusion General Ledger, behind FRS, Smart View and OTBI balances `[CO:INS-NB p.454–458]`.

## How data moves
| Path | Mechanism | Evidence |
|---|---|---|
| Policy data → ADW | Exceed reporting data lands in BIM (SQL Server); a load server copies it into the ADW insurance data mart | `[CO:INS-NB p.315–316, 400, 681]` |
| Fusion → ADW (report-based) | OIC scheduled orchestration invokes a BI Publisher report through the report web service, stages the file, then inserts rows into an ADW table (delete-and-reload) | `[CO:INS-NB p.283–312]` |
| Fusion → files (bulk) | OIC uses the ERP extract-bulk-data pattern: an ESS job writes the extract, a business event triggers download to object storage or FTP | `[CO:INS-NB p.224–274]` |
| Fusion Payables → ADW | Workiva (OneCloud) chain for the invoice-imaging audit data set | `[CO:INS-NB p.763]` |
| Data Sync → ODI / OCI Data Integration | Data Sync replaced by Data Integrator / OCI Data Integration workspaces, with an API gateway for REST sources | `[CO:INS-NB p.176–182, 351]` |
| Fusion GL ↔ Planning | EPM Data Management: actuals to Planning; budget and statistical journals back to GL | `[CO:INS-NB p.499]` |
| Planning → OAC Essbase | Workiva (OneCloud) chain loads the Planning financials into the OAC Essbase reporting cube; Workiva (OneCloud) also copies EPM and Essbase backups | `[CO:INS-NB p.682, 689]` |
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
