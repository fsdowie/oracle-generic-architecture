---
id: INS-OVERVIEW
type: index
title: Insurer Finance & Technology Architecture on Oracle — overview
as_of: 2023-08 (source notebook spans 2020–2023)
links: [INS-FOUNDATION, INS-P2P, INS-R2R, INS-DATA]
---

# Insurer — Oracle Finance estate (overview)

> **Historical: state as of 2023, not the current state.** Everything in this folder describes the estate as documented between 2020 and 2023.
>
> **Anonymised.** "Insurer" is a property & casualty mutual insurer. Entities are shown as *Mutual* (the insurance company), *Agency* (the insurance agency) and *Foundation* (a not-for-profit). People, hostnames, URLs and credentials are excluded. Vendor application names are kept.

Evidence tag for this folder: `[CO:INS-NB p.N]` = the finance-technology working notebook (2020–2023), page N. Oracle-standard behaviour: `[ORA26C:<guide> p.N]`.

## Shape of the estate
| Layer | What |
|---|---|
| Origination | Policy administration (Exceed: premium, commission, claims, case reserves), payroll (ADP), corporate card (Visa), investments (Clearwater, planned), suppliers (supplier portal, DataFox enrichment) `[CO:INS-NB p.331, 337, 680]` |
| Integration | Oracle Integration Cloud (OIC), OneCloud (third-party scheduler and data mover), EPM Data Management, FBDI / spreadsheet loaders, REST `[CO:INS-NB p.331, 499, 682]` |
| Oracle transactional | Suppliers & Supplier Qualification, Self-Service Procurement, Purchasing & Contracts, Payables (with invoice imaging), Payments, Cash Management, Expenses, Fixed Assets, Intercompany `[CO:INS-NB p.126, 135]` |
| Accounting engine | Subledger Accounting (SLA) |
| General Ledger | One chart of accounts (8 segments), Mutual and Agency ledgers in one data set, GL balances cube (Essbase) `[CO:INS-NB p.133]` |
| Close, report, analyse | Enterprise EPM (close task manager, consolidation, planning, narrative reporting, account reconciliation, tax reporting, data management), **Autonomous Data Warehouse (ADW)**, Oracle Analytics Cloud (BI, Essbase, Data Visualization), OTBI, BI Publisher, Financial Reporting Studio, Smart View `[CO:INS-NB p.396, 490, 681]` |

## History that explains the design
- Started on PeopleSoft Financials and HR, on-premise OBIEE and Hyperion; moved Hyperion to EPM Cloud, OBIEE to OAC, HR to HCM Cloud, then **Financials to Fusion Cloud (go-live 1 Jan 2021)** `[CO:INS-NB p.688, 167]`.
- Conversions at go-live: 5 years of GL balances, all suppliers (active and inactive, with 18 months of AP history and 1099 flags), assets with net book value, open POs, and procurement contracts (MSA, CSA, SOW, NDA) with signed PDFs `[CO:INS-NB p.135–136]`.
- Legacy EPM services were migrated to the Enterprise EPM bundle in 2022 by the EPM partner `[CO:INS-NB p.390, 396]`.
- Quarterly Oracle updates (Mar, Jun, Sep, Dec) with a regression list of integrations, OTBI subject areas, Essbase and OneCloud chains to retest `[CO:INS-NB p.572–577, 595]`.

## Files
- `insurance/foundation/coa-hierarchies-controls.md` — chart of accounts, hierarchies, security, cross-validation, SLA, approval workflows
- `insurance/processes/procure-to-pay.md` — suppliers to payment, with account types
- `insurance/processes/record-to-report.md` — journals, intercompany, allocations, close, EPM
- `insurance/data-and-reporting.md` — ADW, integrations, reconciliation, OTBI / BIP / FRS / Smart View / OAC
- `insurance/integrations/integration-register.yaml` — interfaces by name
