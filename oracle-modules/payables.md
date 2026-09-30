---
id: MOD-AP
type: oracle-module
modules: [Payables]
workstream: P2P
as_of: 2026-09-29
release: 26C
links: [PROC-P2P, PROC-PAYMENTS, INT-826, OPS-FM]
---

# Oracle Payables

**Owns:** invoices, matching, invoice distributions, holds, accruals, prepayments, withholding tax, 1099 reporting. `[CO:02 §2]`

## Invoice intake channels
| Channel | Path | Evidence |
|---|---|---|
| AP service desk | Invoices arrive via **Jira** (not connected to Oracle) → keyed/imported into Oracle | `[CO:02 §4 Stage 06]` |
| SimpleLegal | `INT301A` invoices in; `INT301B` status out | same |
| Generali | `INT062A` ad hoc payment inbound | same |
| Oracle Expenses | Approved expense reports → Payables invoices via *Process Expense Reimbursements* | `[ORA26C:implementing-expenses p.41–42]` `[USER:2026-09-29 Oracle Expenses in use]` |
| Treasury urgent/ad hoc | Urgent Payment Tool / one-time payees | `[CO:02 §4 Stage 07]` |

## Matching, tolerances and holds
- Oracle 26C: invoice tolerances decide whether matching holds are placed for variances vs the matched document; defined as **quantity-based or amount-based** sets (e.g. Ordered Percentage); invoice validation checks them; held invoices can't be paid until released. `[ORA26C:implementing-payables-invoice-to-pay p.92–93]` Default tolerance sets come from invoice options, including supplier-site defaults. `[ORA26C:… p.42]`
- Company policy: **5,000 USD-equivalent** threshold, held per BU **in local currency**; recalculated **monthly** from the corporate rate of the 1st — manual, recognised **audit risk**. `[CO:02 §5]` Owner of the monthly task not documented → Q-AP-1.
- `INT960` AP non-PO invoice above 5K extension, driven by cumulative amount per invoice line (creates the non-PO >5K hold). `[CO:02 §4 Stage 06]`

### Hold reality (rolling 12 months to mid-Sep 2026) `[CO:02 §4 Stage 06]`
| Measure | Value |
|---|---|
| Holds placed | 23,722 on 15,309 invoices, 3,569 suppliers |
| Open at measurement | 681 |
| Self-clearing (<1 hour) | 52% |
| Median / mean time to release (genuinely held) | 6.31 / 17.01 days |
| Slowest families | Supplier-level block on all unvalidated invoices (mean 35.6d, median 18.7d); non-PO >5K (mean 34.6d, median 20.8d); bank-reported rejections on ack file `ORA_AP_BANK_ACK_RJCT` |

`ORA_AP_BANK_ACK_RJCT` is the return path from settlement landing in Payables. Its exact object type (hold code vs status) is not in the 26C guides → `[UNVERIFIED]`.

## Payment terms
- Default terms can be set in Payables options and on supplier setup. `[ORA26C:implementing-payables-invoice-to-pay p.41, 43]`
- Terms observed in use: `On Receipt` (dominant), `Net 10`, `Net 15`, `Net 30`, `Net 45`. `[DATA:int826 logs]` Treasury scope requires Immediate terms. `[CO:FIN-24137 register]`
- Exceptions: Zip-approved terms exceptions are applied by **INT826** at supplier-site, PO or invoice level. See `integrations/INT826.md`.

## Approval
Oracle invoice approval workflow determines whether an invoice needs approval and routes it. `[ORA26C:implementing-payables-invoice-to-pay p.43]` Company invoice approval rule detail is not in the sources → Q-AP-2.

## Withholding and 1099
- Withholding can be configured in Payables or Oracle Tax; WHT options per BU via *Manage Tax Reporting and Withholding Tax Options*; WHT can be applied at invoice validation or at payment. `[ORA26C:implementing-payables-invoice-to-pay p.77, 79]` `[ORA26C:implementing-tax p.49]`
- 1099: income tax type/region on distributions; Combined Federal/State Filing option. `[ORA26C:implementing-payables-invoice-to-pay p.52, 81]`
- Company: jurisdiction-specific WHT codes added as entities are built; tax approver routing for TOT, VAT, tax-authority approvals separate from spend approval. `[CO:02 §5]`

## Assets hand-off
Invoice distributions flagged **Track as Asset** (`ASSETS_TRACKING_FLAG = Y`) become candidates for transfer to Assets (mass additions). `[ORA26C:implementing-payables-invoice-to-pay p.137, 154]` See `oracle-modules/fixed-assets.md`.

## Accounting
Payables accounting entries include liability, expense, nonrecoverable tax, withholding; payment entries include cash/cash clearing. `[ORA26C:implementing-payables-invoice-to-pay p.31]` All through XLA under `CORP_GAAP_SLAM`; SLA account rules maintained in *Manage Account Rules*. `[CO:02 §7]`

## Configuration records
*Company Payables Configuration (production)*; tolerance sheets; hold definitions and release authority; non-PO threshold controls. `[CO:02 §2, §7]`
