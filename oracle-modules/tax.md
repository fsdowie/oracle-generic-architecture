---
id: MOD-TAX
type: oracle-module
modules: [Oracle Fusion Tax (transaction + withholding), Payables 1099]
as_of: 2026-09-29
release: 26C
---

# Tax

## Engine `[USER:2026-09-29]`
**Oracle Tax native only** — no external tax engine determines transaction tax on P2P invoices.
Note: tickets mention a "1099 / Vertex feed" as a possible consumer of supplier tax fields (FIN-24137 D7). That is a downstream consumer question, not a tax-determination engine. `[CO:FIN-24137 dependencies]` → Q-TAX-2.

## Oracle 26C model
| Element | Evidence |
|---|---|
| Single solution for transaction **and** withholding tax; *Define Tax Configuration* (basic) and *Define Advanced Tax Configuration* (exceptions) | `[ORA26C:implementing-tax p.9]` |
| Regime → tax → jurisdiction → status → rate → recovery rate → rules; scope values | `[ORA26C:implementing-tax p.10, 12]` |
| Tax determination uses tax rules and rule defaults (e.g. Determine Tax Registration default = ship-from party) | `[ORA26C:implementing-tax p.15–16]` |
| Party tax profiles; supplier and supplier-site tax registrations, optionally per regime | `[ORA26C:implementing-tax p.13, 29, 97]` |
| Withholding can be set up in Payables or Oracle Tax depending on requirements | `[ORA26C:implementing-tax p.49]` |
| WHT options per BU; applied at invoice validation or payment | `[ORA26C:implementing-payables-invoice-to-pay p.77, 79]` |
| US 1099: income tax type/region, combined federal/state filing | `[ORA26C:implementing-payables-invoice-to-pay p.52, 81]` |

## Company specifics
- WHT codes by jurisdiction added as entities are built out; tax approver routing for **TOT, VAT and tax-authority approvals** maintained separately from spend approval. `[CO:02 §5]`
- Supplier registration tax fields: **Tax Type** (mandatory, 100+ options — ER.4 analysis), **Taxpayer ID / Tax Registration Number / D-U-N-S** (at least one required — ER.6 disputed). INT959 maps Tax Type via lookup `LEGACY_ORACLE_TAX_PROFILE_MAPPING`. AP states Taxpayer ID/TRN is needed for US 1099 and Brazilian electronic payment files and used for duplicate validation. `[CO:FIN-24137 register, ER4 story]`
- Bank rejection evidence that tax IDs matter in payment files: Bank B BR `/RULE_875/Please enter the Beneficiary Tax ID./RR04`. `[DATA:payments-status-report]`
- In flight (not current state): e-invoicing and XML VAT reporting. `[CO:02 scope notes]`

## Supplier tax data on the PO path (INT055A) `[CO:INT055A-spec]`
- Tax registrations are placed at profile line, address regime or address DFF by `LEGACY_ORACLE_TAX_PROFILE_MAP` (e.g. `USA-EIN`→address DFF, `GBR-VATREGNO`/`FRA-NOTVA`/`IRE-VATNO`→address regime, `BRA-CNPJ`→address DFF, `KOR-TIN`→profile line).
- *Allow Tax Applicability* and *Allow Offset Taxes* = Y on all Apex suppliers and addresses.
- **US 1099 auto-flag** (FIN-18939, FIN-22558): Legal Services category or 1099 entity types (Individual, Sole Prop, Partnership, Trust, Estate, Disregarded Entity, LLC P/DE…) → Federal Reportable = Yes, Income Tax Type `MISC3`.
- **Brazil CNPJ** (FIN-11546): income-tax country/taxpayer ID/reporting name set; Use Withholding = Y.

## Unknowns
Q-TAX-1 which WHT regimes are configured in Oracle Tax vs Payables-style WHT; Q-TAX-2 what the "Vertex feed" is.
