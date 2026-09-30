---
id: INT-055A
type: integration
name: INT055A — Apex Portal suppliers to Oracle (create and update), bidirectional
design_name: INT055a_FIN_Apex_Portal_Suppliers_Load_Bidirectional
oic_integrations: ["INT055A APEX Suppliers to Oracle Inbound Scheduler", "INT055A APEX Suppliers to Oracle Inbound Main", "INT055A Sync APEX Supp Key ATP Interface"]
source: Apex Portal (REST API + SFTP for attachments)
target: Oracle Fusion Suppliers (REST APIs, Address FBDI), plus feedback to Apex
lane: OIC (scheduled)
schedule: every 30 minutes
population: PO suppliers (Zip → Apex → Oracle)
spec: "the implementation project INT055A Supplier Creation and Update Inbound OIC Integration Lean Specification (the SI partner TFD, v2.1 Final May-2023; history to v2.2 Apr-2025; incremental changes to FIN-22640)"
unit_test: "Unit Testing – INT055A Apex Suppliers To Oracle Inbound (UAT run 18-Jul-2025)"
as_of: 2026-09-30
links: [PROC-ONBOARD, MOD-PROC, MOD-TAX, EXT-CATALOG, INT-959]
---

# INT055A — Apex → Oracle supplier creation and update

Evidence tag for this file: `[CO:INT055A-spec §x]` = the Lean Specification; `[CO:INT055A-UT]` = unit test evidence; `[USER:2026-09-30]` = the FTG analyst.

## 1. Purpose and scope
- Creates and updates Oracle suppliers from the **Apex Portal** extract; the Oracle path for **PO suppliers**. `[USER:2026-09-30]` `[CO:INT055A-spec §1]`
- **Create vs update is decided per entity by the ERP Unique ID**: blank → create; populated → update. Create takes only **Active** suppliers; update takes Active and Inactive. `[§2.2, §2.5 #4, BR1–2]`
- Entities in scope: profile (header), addresses, sites, site assignments, business classifications, bank accounts (and banks/branches), tax registrations, products & services, attachments. `[§2.2]`
- Design assumption from 2022: "suppliers will not be created in Oracle manually". **Superseded** for the non-PO population, which is created via the Oracle Supplier Registration Request + INT959. `[§2.7]` `[USER:2026-09-29]`

## 2. Runtime characteristics `[§2.1, §3.1, §3.3, §4.1]`
| Attribute | Value |
|---|---|
| Trigger | OIC **scheduled** integration, **every 30 minutes** |
| Retrieval | Pull from Apex REST API (JSON, `GET Vendors Registration`-style payload); attachments from Apex SFTP |
| Selection | Records with Apex status **'Pending ERP'** (changes only) |
| Design volume | ~10 suppliers per run (2022 estimate) |
| Mode | Asynchronous, batch, sequential per supplier |
| Integration user | `erp_integation` |
| Connections | `XXCO_APEX_REST_CONNECTION`, `XXCO ERP REST CONNECTION` (Oracle SaaS REST), `ERP_CLOUD_HOST_IMPL` (ERP Cloud adapter), `ERPReportService` (SOAP BIP), `ATP DB Conn`, `OCI_OS_Native_Conn`, `APEX SFTP` |
| Common services | `INT000 Common Log and Notify`, `INT000 Common File Movement Inbound`; Dpulse activity row in `DGTL_PLS.XX_IMD_INTEGRATION_ACTIVITY_T` |
| Files (OCI bucket) | `Implementation/Inbound/PO/INT055A/{Process,Archive/YYYY-MM-DD,Error/YYYY-MM-DD}/RUN-ID_Filename_YYYYMMDD_hhmmss.json` |
| Also listed | Mulesoft REST API as a source/output service — role not described → Q-055A-4 |

## 3. Processing sequence `[§3.1 Process Description, Transformation Logic]`
1. **Scheduler** calls the Apex REST API; if count > 0, writes the JSON to OCI and invokes **Main**.
2. **Main** reads the JSON and enriches it with custom BI reports and ATP tables (static data and existing supplier keys).
3. **Banks/branches**: for each bank account, `GET Bank` / `GET Bank Branch`; create them if missing. Bank data from Apex is treated as always correct, and bank names are standardised at source.
4. **Create-or-update decision**: search the Oracle supplier number and the Apex **VR_ID** in the ATP key tables.
5. The supplier REST sequence runs per supplier: Header → Products & Services → Addresses → Sites + Site Assignments (per company code) → Bank Accounts → **Instrument Assignment** (each account to all sites) → Payment method → Remittance email → Business Classifications → Tax Registrations → Attachments.
6. After all suppliers, the **Address FBDI** update runs (e.g. tax values into address attribute DFF).
7. Recon reports are written to OCI.
8. **Feedback to Apex (the bidirectional leg)**:
   - Successes go back through the **Batch Update API**, returning Oracle IDs as the ERP Unique ID per VR_ID and sub-entity.
   - Failures go back through the **Log Event API** and appear in the Apex supplier's event log.
9. **`INT055A Sync APEX Supp Key ATP Interface`** syncs keys into the ATP reference tables. `[CO:INT055A-UT step 3]`
10. The notification carries control totals: processed, failed pre-validation, failed in standard interface, imported. `[CO:INT055A-UT step 6]`

## 4. Key mapping rules `[§2.5, §2.5.2]`
| Rule | Mapping |
|---|---|
| Supplier number | `SUP` + Apex VR_ID (e.g. `SUP12345`); VR_ID also stored in **Alias**. ⚠ The UAT evidence shows a VR_ID mapping to an unrelated `SUP` number, which doesn't fit the rule → Q-055A-2 |
| Names | Apex `CompanyNameDBA` → Oracle **Supplier Name** (used on transactions); Apex `Registered Name` → **Alternate Name** (searchable on requisitions) |
| Business relationship | Always `SPEND_AUTHORIZED` |
| Supplier type | Apex suppliers → `SUPPLIER` (matches the supplier-type values seen in payment data) |
| Address name | `<CC>-<City>-<PO\|PAY>` e.g. `US-ATLANTA-PO-PAY`; purpose flags come from `CONTRACTNUMBER1` = Ordering and `CONTRACTNUMBER2` = Remit to |
| Site name | `<CC>-<first 5 chars of city>-<PO\|PAY>` e.g. `US-ATLAN-PO-PAY` — the source of the pay-site names seen in INT826 logs (`US-OAKLA-PO-PAY`) |
| Sites / site assignments | Created from the **enterprise-structure crosswalk**: Apex/Workday company code (`COxxx`) → Oracle LE, ledger, procurement BU, client (REQ) BU, bill-to BU, ship-to location. No crosswalk row means no site. Table `XXCO_ENTERPRISE_STRUCTURE` (Appendix 6.1) |
| Payment terms | Apex term name is matched through the payment-term DFF `ATTRIBUTE1` and set at **site** level |
| Payment method | ⚠ Conflict inside the spec: §2.5 #14 says the Apex payment method is **not captured (NULL)**, but the process includes "Create payment method" and Appendix 6.4 maps Apex `Check`→`CHECK`, `EFT`→`EFT` via lookup `CO_PAYMENT_METHODS` → Q-055A-3 |
| Remittance / PO email | At site level |
| Bank accounts | Bank and branch derived by country group (`CO_PAYMENT_BANK_COUNTRIES_1..6`): 1 bank+branch ID (BR, CA, JP, SG); 2 branch ID (AU, CN, IN, US, ZA); 3 IBAN offsets (most of Europe, GB, AE, SA…); 4 CLABE/CBU (MX, AR, PE); 5 bank or branch code (CL, CO, HK, PH, TH…); 6 query-based (TW, NZ) |
| State/province | Trimmed after the last hyphen (`USA-IL` → `IL`) |
| Tax flags | *Allow Tax Applicability* and *Allow Offset Taxes* = Y on every header and address |
| Tax registrations | Lookup **`LEGACY_ORACLE_TAX_PROFILE_MAP`** (Apex tax type + country → Oracle location: profile line, address regime, or **address DFF** attribute 6). Examples: `USA-EIN` → address DFF; `GBR-VATREGNO` → address regime; `BRA-CNPJ` → address DFF |
| Products & services | Level-2 Apex categories mapped through an Oracle lookup |
| Certifications | Apex CertificationGroup/Type/Number → Oracle business classification / certifying agency / certificate (`POZ_BUSINESS_CLASSIFICATIONS`) |
| VR IDs | Stored in DFFs on supplier entities except sites and site assignments. Company-code linkage is kept in ATP |

## 5. Incremental changes after go-live `[§7]`
| Ticket | Change |
|---|---|
| FIN-11546 (Apr-2025) | **Brazil CNPJ**: income-tax country BR; taxpayer ID with special characters stripped; tax reporting name; Use Withholding = Y; address tax DFF = `TaxType-Number` |
| FIN-18939 | **US 1099 auto-flag**: for a US supplier, if Category = Legal Services **or** entity type is Individual / Candidate Reimbursement / Sole Proprietorship / Partnership / Estate / Trust / Disregarded Entity / Partnership Entity, then Federal Reportable = Yes and Federal Income Tax Type = `MISC3` |
| FIN-22558 | 1099 addendum: US LLC with tax classification P or DE is flagged 1099 |
| FIN-21779 / FIN-20536 | Diversity redesign: Certified / No / Self-Certified; new `SELF-CERTIFIED …` agencies; existing classifications end-dated via REST DELETE (fetched with `REP006`); one-time restage of all suppliers |
| FIN-22640 (epic FIN-22623) | New SimpleLegal field flows Zip → Apex → Oracle supplier DFF to flag **legal suppliers** at onboarding |
Spec review tickets: FIN-5603, FIN-7934, FIN-761. `[Document control]`

## 6. Objects `[§3.2]`
- **BI reports** (under `/Custom/Company/Implementation/PO/Interfaces/INT055A/`): Address Mandatory Fields, Get Party Site Number, Lookup Data (e.g. `CO_EMPLOYEE_PAYMENT_COUNTRY`), Payment Terms.
- **SaaS lookups**: `CO_PAYMENT_METHODS`, `CO_PAYMENT_BANK_COUNTRIES_1..6`, `LEGACY_ORACLE_TAX_PROFILE_MAP`, `POZ_BUSINESS_CLASSIFICATIONS`.
- **OIC lookup**: `XXCO_COMMON_BI_REPORT_DETAILS_LKP`.
- **ATP (schema `CORP_IMPL`)**:
  - Tables: `XXCO_INT_METADATA_TBL`, `XXCO_ENTERPRISE_STRUCTURE`, and the `XXCO_APEX_SUPP_*_REF_TBL` family (header, address/site, banking, site-assign, cert, person, tax, site-bank, attachment).
  - Package: `XXCO_APEX_TO_ORCL_SUPP_KEY_PKG.GET_EXISTING_SUPPLIER_KEY`.

## 7. Error handling and reprocessing `[§2.6, §3.2.8, §4.3–4.4]`
- **No data** → the run is logged and ignored.
- **All records fail validation** → the flow aborts, and the notification attaches the failed records.
- **Partial success** → valid records continue; the notification includes control totals, import results and the error attachment.
- **Invalid sub-entity** (e.g. 1 of 3 addresses) → that record errors, and the supplier status is not updated in Apex through the feedback.
- **Reprocessing**:
  - Apex re-sends in the next run (the record stays *Pending ERP*).
  - Alternatively, re-upload the file from the OCI error path through the **Integration Launchpad**. The unit test uses this route: run *Main* with `ApexData.json`. `[CO:INT055A-UT]`
- **Recipients** — the sources disagree:
  - The functional section says errors go to `<team-alias>`.
  - The technical section names `<team-alias>`.
  - The UAT email went to `ftg-impl-int-uat`.
  → Q-055A-5.
- **Lookup LOVs** (payment terms, tax types, bank groups, classifications) are maintained manually; a missing value makes the record fail. `[§5 open items 7/29/2022]`

> Q-055A-2…6 are **deferred** — detail-level inconsistencies that don't change the architecture view `[USER:2026-09-30]`. Treat the ⚠ items above as caveats; don't assert either side.

## 8. Relationships an agent must know
- **INT055A (PO suppliers) and INT959 (non-PO SRR suppliers) are separate creation paths** into the same supplier master. `[USER:2026-09-29/30]`
- **Shared tax lookup:** INT959 tickets name `LEGACY_ORACLE_TAX_PROFILE_MAPPING`, while INT055A uses `LEGACY_ORACLE_TAX_PROFILE_MAP`.
  - Likely the same lookup, which would mean the ER.4 Tax Type consumer trace must include INT055A. `[INFERRED]` → Q-055A-6
- **1099 flags:** INT055A already derives 1099 flags automatically (FIN-18939/22558). That is relevant to the ER.6 TRN/DUNS conditional-requiredness debate on the SRR path.
- **Return legs:** INT055B/C send Oracle supplier changes back to Apex. `[CO:01–02]`
- **Name mapping:** Supplier Name = DBA name. This matters for the payee-name mismatch problem (FIN-24573), because banks validate against the account holder's registered name. `[INFERRED]`
