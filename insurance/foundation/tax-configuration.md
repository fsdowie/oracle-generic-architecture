---
id: INS-TAX
type: foundation
title: US sales and use tax in Oracle Tax — as built and gaps
as_of: 2021-01
links: [INS-OVERVIEW, INS-FOUNDATION, INS-P2P, INS-SECURITY]
---

# Tax configuration

The map's **Taxes** tab draws this. Native Oracle Tax only: no Vertex, Avalara or other tax partner `[CO:INS-TAX p.3]`.

## Ownership and subscription
- Tax content is owned by the **global configuration owner** `[CO:INS-TAX p.3]`.
- The **Mutual BU** and **Agency BU** subscribe from 01/01/2016 with *common configuration with party overrides*: they use the shared content and may keep BU-specific exceptions `[CO:INS-TAX p.3]` `[ORA26C:TAX p.71]`.
- The Foundation isn't subscribed.

## Regime and taxes
| Object | Setup | Evidence |
|---|---|---|
| Regime | `US_SALES_USE_TAX`, country level (US), from 01/01/2016. USD, minimum accountable unit 0.01, rounding Nearest, standard non-inclusive handling. Multiple jurisdictions, exceptions and exemptions allowed. **Tax recovery off**, cross-regime compounding off | `[CO:INS-TAX p.3]` |
| Taxes | `STATE_SALES_TAX`, `LOCAL_SALES_TAX`, `KING_LOCAL_TAX` (geography City, parent County = King). Tax point basis Invoice; manual lines, override of calculated lines and rounding override allowed; not used for withholding | `[CO:INS-TAX p.4]` |
| Jurisdictions | State (e.g. `OR_STATE`) and city (e.g. `SEATTLE_KING`). City jurisdictions are *inner-city*, precedence 300, one marked as default | `[CO:INS-TAX p.5, 19]` |
| Statuses | `APPLICABLE`, `EXEMPT`; both allow exceptions, exemptions and rate override | `[CO:INS-TAX p.6]` |
| Rates | Percentage. WA state 6.5% (default). OR state 0% to 12/31/2020 then 10% from 01/01/2021. City rates named *location code + city* (e.g. `1715-KENT`, `1706-BOTHELL`); county cities `…-KING RATE`. Exempt rates under `EXEMPT`. Ad hoc rate allowed. Classification code set assigned to Order to Cash, Procure to Pay and Expenses | `[CO:INS-TAX p.7, 12-15]` |

## Determination
- Determining factor sets `SHIP TO CITY` (Geography · Ship to · City) and `SHIP TO STATE` `[CO:INS-TAX p.9]`.
- One condition set per city or state value (e.g. `SHIP TO CITY KENT`) `[CO:INS-TAX p.10, 25]`.
- Three **Tax Rate rules** from 01/01/2020: `SHIP TO CITY` on the local tax (about 39 ordered conditions), `SHIP TO STATE` on the state tax, `SHIP TO CITY KING` on the county tax `[CO:INS-TAX p.11, 27-30]`.
- Oracle evaluates rules in order; the ship-to location type is set on the rule `[ORA26C:TAX p.173, 195-197]`.

## Accounting
With recovery off, sales tax paid is non-recoverable and charged with the invoice distribution (expense or asset) or to the tax expense account `[ORA26C:TAX p.85]`.

## Runbooks
- **Rate change:** Manage Tax Rates and Tax Recovery Rates → edit → end-date the current rate → add the new rate, set as default if the old one was `[CO:INS-TAX p.12-15]`.
- **New location:** Manage Tax Jurisdictions (local or state tax, inner-city flag) → Manage Tax Rates (ad hoc allowed) → Manage Tax Condition Sets → Manage Tax Rules (add the condition and result, enable, submit) `[CO:INS-TAX p.16-30]`.
- Rates are kept by a business user who holds the custom financial-structures administrator role; internal audit rated that broader than needed (see the security doc) `[CO:INS-SEC]`.

## Gaps
| Gap | What to add | Evidence |
|---|---|---|
| Use tax not self-assessed although the regime is "Sales & Use" | First-party registration with *Set as self-assessment (reverse charge)* and a registration rule for unregistered suppliers | `[ORA26C:TAX p.97-98]` |
| Rates keyed by hand | Rapid setup spreadsheets or tax content upload | `[ORA26C:TAX p.17, 29]` |
| No tax reporting types or codes | Reporting codes for state returns | `[CO:INS-TAX p.3]` |
| Rate maintenance needs a broad admin role | A tax-rate maintainer role with the tax duty only | `[CO:INS-SEC]` |
