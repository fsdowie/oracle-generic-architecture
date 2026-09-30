---
id: MOD-EPM
type: oracle-module
modules: [FCCS, ARCS (Reconciliation Compliance, Transaction Matching), EPM Data Management / Data Integration]
workstream: R2R close
as_of: 2026-09-29
links: [PROC-CLOSE, OPS-RHYTHM]
---

# Oracle EPM: FCCS, ARCS and the data path from ERP

## The shared data path (ERP → EPM) `[CO:03 §3.5–3.6]`
A **custom trial-balance BI Publisher report** in Oracle ERP is registered as an **ESS job**, assigned to role `Company GL Inquiry`, and consumed by EPM **Data Management data load rules**. Airflow triggers the runs.
- ARCS target: `GL YTD Functional Balances` (separate functional and reporting load rules).
- FCCS target: `ERP GL PTD Balances` via data load rule `DLR_CloudERP_BIP`; business rule `GL Balances Load - Oracle ERP` can be launched manually for a period/year.

Oracle 26C basis: EPM Data Integration supports *Integrating Oracle Cloud ERP Data Using a Custom Query* and *Registering a BI Publisher Report as an ESS Job* (ERP data integration chapter, report parameters incl. `$START_PERIODKEY$` for single-period loads); source adapters include *Oracle ERP Cloud (Custom)* and *(Trial Balance)*. `[ORA26C:EPM Data Integration p.11 (TOC), p.61, ~p.465]` Data Management also offers a native Oracle General Ledger source connection. `[ORA26C:EPM Data Management p.5–6 (TOC)]` → Q-EPM-1 why custom BIP rather than native GL adapter (likely reporting-currency/YTD shape) `[INFERRED]`.

## FCCS — `CORPCONS`
| Setting | Company | Oracle 26C basis |
|---|---|---|
| Periods | 12-period year, HYTD enabled | HYTD members optional at app creation `[ORA26C:EPM FCCS p.49]` |
| Currency | Multi-currency | |
| Balance sheet approach | Traditional (Total Assets vs Total Liabilities & Equity) | `[ORA26C:EPM FCCS p.52, 54]` |
| CTA | Carried on balance sheet | |
| Multi-GAAP | Enabled, with manual adjustments | Multi-GAAP Reporting option tracks local GAAP and IFRS/other `[ORA26C:EPM FCCS p.51]` |
| Consolidation journals | With workflow | |
| Custom dimension | Custom1 | |
| Multi-source data input tracking | Enabled | `[ORA26C:EPM FCCS p.54]` |
| Security | Groups `CORP_Read`, `CORP_Write` under role assignments | |
| Approval units | Opened on the 25th; locked at close | Approval unit hierarchies; locking an AU of a shared entity locks all instances unless Enhanced Organization by Period `[ORA26C:EPM FCCS p.19 TOC, p.68]` |
| Close checklist | **Task Manager** (`FPC07` confirm no DM mapping exceptions; `FPC08` create IC profit elimination journals), each with owner/assignee/backup/approver | Task Manager chapter `[ORA26C:EPM FCCS p.21 TOC]` |
| Consolidation | Consolidate + Translate run by Consolidation team | Consolidation process flow, IC eliminations, translation `[ORA26C:EPM FCCS p.15 TOC, p.585]` |
| Consolidation journal periods | Opened/closed by FTG | Requires *Consolidation Journals – Manage Periods* granular role + Admin/Power User `[ORA26C:EPM FCCS p.574]` |
`[CO:03 §3.6]`

**Reports:** `REP035-A`, `REP042-A`, `REP036`, `REP037-A`, `REP040-A`, `REP061-A`, `REP046-A`, `REP051-A`, `REP053`, `REP050`, `REP101`; Financial Reporting Studio with bursting. FR Studio reports can't be invoked by web service or delivered to SFTP (logged product limitation). `[CO:03 §3.6]`

**Failure modes:** maintenance-window collisions (consol+translate overrun → manual force-consolidation; mitigation = move the window) · DM mapping exceptions (hence FPC07) · load DAG running during tie-out (hence the pause). `[CO:03 §3.6]`

## ARCS
Two modules in use: **Reconciliation Compliance** (certification workflow) and **Transaction Matching** (item-level). `[CO:03 §3.5]` `[ORA26C:ARCS Admin p.3 TOC]`

| Configuration surface | Company | Oracle 26C |
|---|---|---|
| Profiles & profile segments | Per account or account group; grouped profiles use sub-segments | Profile segments = components of the Account ID that uniquely identify profiles `[ORA26C:ARCS Admin p.47]` |
| Formats | Workflow, attachment requirements, attributes | |
| Risk rating | Balance/activity-driven; drives due dates and frequency | Reporting by risk rating supported `[ORA26C:ARCS Admin p.10]` |
| Frequencies, processes, teams, org units, calendar | India-specific calendar | |
| **Auto-certification rule** | Auto-submit + auto-approve when source balance (reporting ccy) within ±5,000 USD, **or** unexplained difference (functional) = 0 **and** period activity (functional) = 0; runs at reconciliation creation; read-only on profile; separate FTG dev/prod sign-off; anchored to annual SOX risk assessment | *Auto-Reconciliation Methods* define conditions (e.g. zero balance, no activity); on success status = Closed `[ORA26C:ARCS Admin p.86, 155–156]` |
| Invalid mappings | Recurring monthly correction cycle | Oracle calls these **Unmapped Accounts** (completeness error: balances in source not mapped to a profile); *Invalid Profiles* report `[ORA26C:ARCS Admin p.254, 313]` |
`[CO:03 §3.5]`

**Feeds:** `arcs_gaap_integrations_pipeline`, `arcs_stat_integrations_pipeline`, `gaap_reval_upload_to_arcs` (daily 06:00 PT), ReconArt bank balances (4th, automatic), ReconArt unmatched (~6th, on request), `INT071A/B` to ReconArt. `[CO:03 §3.5]`

**Failure modes:** invalid mappings; DM mapping exceptions; reopening a prior period generating new invalid transactions in intermediate periods; quarterly UAR over several hundred users. `[CO:03 §3.5]`

Config records: FCCS Consolidation & Close Configuration Workbook (BR100); ARCS Configuration Workbook (BR100); annual ARCS rules document; FCCS/ARCS DAG documentation. `[CO:03 §7]`
