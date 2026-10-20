---
id: MFG-EBTAX
type: foundation
title: Transaction tax (EB-Tax) for FBCo US and FBCo México
links: [MFG-OVERVIEW, MFG-FOUNDATION, MFG-P2P, MFG-O2C, MFG-SECURITY]
---

# EB-Tax for US and Mexico

The map's **EB-Tax** tab draws this. Native Oracle Tax for both countries; no tax partner engine. Scope: US sales and
use tax, Mexican IVA on a cash basis, Mexican IVA and ISR withholding. CFDI e-invoicing and IEPS are out of scope.
Oracle publishes no Fusion Mexico tax template, so the Mexico design applies generic Oracle Tax features `[INFERRED]`.

## Parties
| Object | FBCo US | FBCo México | Evidence |
|---|---|---|---|
| Configuration owner | Global; US Manufacturing BU and US Distribution BU subscribe (common configuration with party overrides) | Global; MX BU subscribes | `[ORA26C:TAX p.71]` |
| First-party registration | Legal reporting unit registrations in nexus states; one set as self-assessment (reverse charge) | RFC under MX IVA, company format (12 characters, `ORA_MX_RFC:COMPANY`); withholding registration on the legal reporting unit | `[ORA26C:TAX p.52, 98, 328]` |
| Third parties | Supplier registration status (Registered / Not Registered); customer exemptions | RFC (individuals 13 characters, `ORA_MX_RFC:INDIVIDUAL`; foreign `ORA_MX_RFC:FOREIGN`); fiscal classification PF / PF RESICO / PM | `[ORA26C:TAX p.328-331]` `[INFERRED]` codes |

## Regimes, rates and rules
| Regime | Setup | Evidence |
|---|---|---|
| US SALES AND USE TAX | Country level; STATE, COUNTY, CITY taxes on the US geography; tax point basis Invoice; built with the Tax Configuration Workbook and kept current by rate upload; no recovery | `[ORA26C:TAX p.17, 29]` |
| MX IVA | Statuses STANDARD 16% (default), BORDER 8%, ZERO 0%, EXEMPT. **Tax point basis Payment** on the tax. Interim tax account on the tax and each rate. Recovery rates MX IVA REC 100 and REC 0 | `[ORA26C:TAX p.43, 85, 259]` |
| MX IVA RET / MX ISR RET | Regime type Withholding tax, country level; calculation point **Payment**; regime determination set WHTTAXREGIME; tax authority (SAT) set up as a supplier; withholding buckets at legal entity level | `[ORA26C:TAX p.49-52, 207-208]` |

Withholding rates: IVA 10.6667% (two thirds of 16%) on fees and leasing from individuals; IVA 4% on land freight;
ISR 10% on fees and rent from individuals; ISR 1.25% on payments to RESICO individuals (before IVA). The 6% IVA
retention on personnel services was repealed in 2021 and isn't set up `[INFERRED]` (Mexican law, not an Oracle source).

The border 8% rate applies to sales by sellers registered in the northern or southern border region. The decree runs to
31 December 2025; confirm the renewal before relying on it `[UNVERIFIED]`.

**Rules.**
- US: place of supply = ship to (use bill to if not found) `[ORA26C:TAX p.195-197]`. A Determine Tax Registration rule uses the first-party registration when the supplier is Not Registered, which triggers self-assessment `[ORA26C:TAX p.97-98]`.
- MX IVA: a determining factor set on ship-from and ship-to geography, product fiscal classification and intended use. Status rules: export → ZERO; zero-rated food → ZERO; border-registered seller → BORDER. Recovery rule: non-deductible intended use → REC 0 `[ORA26C:TAX p.173]` `[INFERRED]` rule content.
- MX withholding: supplier person type × intended use (fees, rent, freight) `[INFERRED]`.

## Cash basis and journal entries
With tax point basis Payment, "the recoverable tax is debited to an interim account on invoice accounting. On
accounting for the corresponding payment, a proportionate tax amount is recovered and the same is reported as of that
payment date. The approach is the same for the tax liability on a sales invoice" `[ORA26C:TAX p.259]`. Once an interim
account is set on a rate, its recovery settlement can't be changed to Immediate `[ORA26C:TAX p.43]`.

| Event | Dr | Cr |
|---|---|---|
| MX supplier invoice, MXN 100,000 fees from a PF + 16% IVA | Expense 100,000; IVA acreditable pendiente (interim) 16,000 | Payables 116,000 |
| Payment (withholding at payment) | Payables 116,000; IVA acreditable pagado 16,000 | Cash 95,333.33; IVA retenido por pagar 10,666.67; ISR retenido por pagar 10,000; IVA acreditable pendiente 16,000 |
| MX customer invoice | Receivable | Revenue; IVA trasladado no cobrado (interim) |
| Receipt applied | Cash; IVA trasladado no cobrado | Receivable; IVA trasladado cobrado |
| US supplier invoice, use tax self-assessed | Expense or inventory (incl. use tax) | Payables (net of tax); use tax liability |
| US customer invoice | Receivable | Revenue; sales tax liability |

Account names for the MX IVA accounts are illustrative `[INFERRED]`. Self-assessed tax credits the tax liability account
instead of Payables. Use a separate use tax liability account so it can be reported `[INFERRED]`.

MX entries are created in the MX primary ledger and, at subledger level, in the MX secondary ledger in the same Create
Accounting run (see `MFG-FOUNDATION`). Retentions are paid to SAT by the 17th of the following month; withholding
certificates (CFDI de retenciones) are prepared outside Oracle `[INFERRED]`.

## To verify
- Border-region decree renewal after 2025.
- Partial-payment behaviour when withholding at payment combines with cash-basis IVA (test environment).
- Payables withholding vs Oracle Tax withholding: Oracle recommends Oracle Tax for rate schedules and thresholds `[ORA26C:TAX p.49-50]`.
