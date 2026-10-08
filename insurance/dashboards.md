---
id: INS-DASH
type: process
title: Finance dashboards — Essbase and transactional (state as of 2022–2023)
as_of: 2023-09
links: [INS-DATA, INS-R2R, INS-OVERVIEW]
---

# How the finance dashboards are produced

Evidence: `[CO:INS-ERP p.N]` = the ERP / corporate-IT notebook (2021–2023); `[CO:INS-NB p.N]` = the finance-technology notebook. "Workiva (OneCloud)" is the third-party integration platform previously called OneCloud (acquired by Workiva) `[USER:2026-10-08]`.

## Two families of reporting `[CO:INS-ERP p.144, 157]`
| | Dynamic reporting (Oracle Analytics Cloud) | Static reporting |
|---|---|---|
| What | BI dashboards, Data Visualization analytics, Smart View analytics | Narrative Reporting (management and narrative packages) and BI Publisher reports |
| Data | Planning, OAC Essbase, Oracle Financials (OTBI) and insurance operations data (ADW) | Narrative Reporting on Essbase; BI Publisher for non-Essbase data, written directly against ADW and the on-premise data warehouse (DWM) |

## 1. Essbase dashboards (the bulk of the financial dashboards)
1. **Fusion GL** keeps balances in the GL balances cubes ("OFC cubes"). Workiva (OneCloud) moves **trial balances and actuals/budget** into **Planning** `[CO:INS-ERP p.157]`.
2. **Planning (EPM)** holds three Essbase cubes: **Financials BSO** (current and prior year), **Workforce BSO** (current-year budget cycle; fed from Core HR through EPM Data Management) and **Reporting ASO** (2010 onward). Capital Planning and Strategic Planning are separate BSO cubes owned by FP&A `[CO:INS-ERP p.144, 157]`.
3. FP&A loads actuals into Planning **once or twice a day** during close and checks that the P&Ls tie `[CO:INS-ERP p.46]`.
4. Workiva (OneCloud) pushes **actuals, budget and forecast** from Planning into the **OAC Essbase** cubes: **Financials**, **Revenue Planning**, **Analytics** and **Foundation** `[CO:INS-ERP p.157]`.
5. OAC BI dashboards and Smart View read the OAC Essbase cubes. After close, FP&A **publishes** the dashboards and financial reports and announces them; users reach them through the Oracle Finance Systems landing page `[CO:INS-ERP p.46, 165]`.
6. Return flows: **allocations and statistical allocation rates** go back from OAC Essbase to the GL; the **budget** is loaded to the on-premise EDW for the Finance workgroup's Tableau reports `[CO:INS-ERP p.157]`.

## 2. Transactional dashboards (from ERP OTBI via OAC and ADW)
1. **OTBI subject areas** in Fusion are exposed to OAC as datasets (an OTBI catalog connection); some dashboards use Fusion Financials directly as a data source `[CO:INS-ERP p.38, 47]`.
2. A daily run starts as an **OTBI transactional report**, lands in **Data Visualization** as a **data flow**, and is massaged and mapped into datasets for the dashboards `[CO:INS-ERP p.47]`.
3. **OTBI-based data sources** also land in **ADW** (finance data warehouse and the ORAFINANCIALS schema) for history and joins with insurance data `[CO:INS-ERP p.157]`.
4. Examples: procurement and contracts dashboards (about 3 in Fusion), the AP imaging auditability dashboard, and the "Daily FI status" dashboard that shows the daily policy-feed load `[CO:INS-ERP p.36, 210]` `[CO:INS-NB p.759–768]`.
5. Dashboards seeded from Fusion show data only after the dataset is seeded; dataset connections can be created per user (Finance analysts are self-sufficient) `[CO:INS-ERP p.38, 47]`.

## 3. Insurance operations data
- Exceed policy, premium, claims and reserve data sits in the on-premise SQL Server warehouse (EDW, BIM, HDS; "DWM": quarterly loss reserves, premium (GWP, EP, UEP), claims and losses, subrogation and salvage, policy) `[CO:INS-ERP p.144, 157]`.
- **Legacy path:** an integration VM ran **DataSync** (BIM → ADW insurance data mart stage), **Oracle Data Gateway** (on-premise data to OAC) and **GroundRunner** (Workiva agent) `[CO:INS-ERP p.155, 157]`.
- **OCI Data Integration ("Fast Connect")** replaces DataSync for Exceed data — assumed implemented `[USER:2026-10-08]`; the project converted the BIM reports (e.g. six-month auto policy reporting) and retired BIM `[CO:INS-ERP p.166–168]`.
- From the ADW insurance data mart (daily, monthly and stage schemas): **OIC** creates the daily and monthly policy journals in GL, and Workiva (OneCloud) publishes report outputs to the **Financials Doc Cloud** (Oracle Content Cloud) for Accounting `[CO:INS-ERP p.150, 157]`.

## Operating the dashboards
- Two jobs ran the daily: a Workiva (OneCloud) job for reports and OIC for the journals; DI was to trigger both `[CO:INS-ERP p.35]`.
- When reports didn't refresh, the daily JE reports were regenerated (future: trigger-based); the integration VM needed a manual check after monthly server patching `[CO:INS-ERP p.35, 155]`.
- OAC user adds and removals, OTBI dataset support, and quarterly-upgrade regression of OTBI reports used by dashboards `[CO:INS-ERP p.38, 50]`.
- OAC Essbase upgrade (2022–23): the embedded Essbase version went out of support; new Essbase instances and certificates were set up `[CO:INS-ERP p.29–31, 171–172]`.
- Workiva (OneCloud) connectors in use: Content and Experience, OTBI, EPM utilities, JSON, IBM Db2, SQL Server, MySQL, Postgres, JDBC, Oracle RDBMS / ADW, Financials Cloud, ARCS, OAC, Planning, SFTP. A review planned to replace them with Data Integration and OIC `[CO:INS-ERP p.35]`.
