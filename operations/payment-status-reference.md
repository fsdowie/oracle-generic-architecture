---
id: OPS-PAYSTATUS
type: reference
as_of: 2026-09-29
sources: [payments-status/payments-status-report with parameters to check against Claude.xlsx, payments-status/payments (negotiable and voided) with no ACK status.xlsx]
---

# Payment Status Reference

## Report layout (`payments-status-report`) `[DATA]`
| Column | Meaning / values |
|---|---|
| LE | Legal entity name (e.g. Company Brazil OpCo, Company Mexico OpCo) |
| payment-date | ISO timestamp |
| supplier | Payee name |
| supplier-type | `SUPPLIER`, `ADHOC`, `TREASURY` |
| payment-amount | In payment currency |
| payment-status | Oracle payment status: `NEGOTIABLE`, `VOIDED` observed |
| payment-number | Oracle payment/check number |
| bank-account-name | Internal disbursement bank account |
| payment-method | `EFT`, `TED` (BR), `BOLETO` (BR), `CHECK`, `SEPA` |
| ppr | Payment process request name (see naming patterns in glossary) |
| batch-id | Kyriba batch (`<prefix><code><seq>`: TED, DOMW, INTW) |
| ack-status | `RJCT` observed (blank = no ack received) |
| ack-date | `DDMMYYYY` |
| bank-msg | Bank reason text/codes |
Relationship to REP627 is `[INFERRED]` (same subject, parameters "to check against Claude") → Q-PAY-6.

## Status semantics
- `NEGOTIABLE` = issued and not voided/cleared (Oracle; checks remain negotiable until escheat window). `[ORA26C:implementing-payables-invoice-to-pay p.37]`
- `VOIDED` after `RJCT` = the payment was **voided manually** after the bank rejected it `[USER:2026-10-05]` `[DATA]`.
- Rejected ≠ returned: RJCT arrives on ack; RETURNED happens after bank acceptance (tracked manually). `[CO:FIN-24248]`
- **Ack fields** are the `AP_CHECKS_ALL` DFFs that INT955 writes: `ATTRIBUTE1` Kyriba batch ID, `ATTRIBUTE3` placeholder reason (Kyriba emails the real reason separately), `ATTRIBUTE4` status `ACPT`/`RJCT`, `ATTRIBUTE5` ack date. The monitoring deck spells accepted as `ACCP`; the DFF value set (`ACPT`) is authoritative. `[CO:KYRIBA-DOC §5.2, §11.8]`
- **Kyriba batch status:** Draft → Remitted → Acknowledged. Draft = configuration missing (FM-PAY-01). Remitted for too long = file or batch failure (FM-PAY-08…10). `[CO:KYRIBA-DOC §4.2, §13.1]`

## Exception-monitoring criteria (payment level) `[CO:KYRIBA-DOC §13.2]`
"3rd party" excludes supplier types `EMPLOYEE` and intercompany. All criteria apply to `NEGOTIABLE` payments.
| Use case | Ack fields | Supplier type | Age since creation |
|---|---|---|---|
| Held by Kyriba, not transmitted (3rd party) | blank | ≠ EMPLOYEE / Interco | > 2 days |
| Held by Kyriba, not transmitted (employee) | blank | = EMPLOYEE | > 2 days |
| Rejected by bank (3rd party) | `RJCT` | ≠ EMPLOYEE / Interco | — |
| Rejected by bank (employee) | `RJCT` | = EMPLOYEE | — |
| Accepted but never cleared (3rd party) | `ACCP`/`ACPT` | ≠ EMPLOYEE / Interco | > 5 days |
| Accepted but never cleared (employee) | `ACCP`/`ACPT` | = EMPLOYEE | > 5 days |

The ">2 days, blank ack" rows match FM-PAY-05: the bank hasn't received the payment. Exclude the `CHECK` method from those rows, because checks never get an ack `[USER:2026-10-05]`. The ">5 days, accepted, not cleared" rows point to statement reconciliation (FM-CM-01) or a return.

## Bank rejection taxonomy (Jun–Jul 2026 sample, 17 payments) `[DATA]`
| Family | Example bank message | Bank / LE | Fix owner |
|---|---|---|---|
| Invalid account number | `/99999999/CB RejectedInvalid Account Number (R04 in US-ACH) (LA_84)` (×4) | Bank B BR | Supplier bank data (AP/Procurement) |
| Invalid individual ID | `…Invalid Individual ID Number (LA_22)` (×2) | Bank B BR | Tax ID data |
| Missing beneficiary tax ID | `/RULE_875/Please enter the Beneficiary Tax ID./RR04/Regulatory Reason` | Bank B BR | Supplier tax data (see ER.6) |
| Account in another currency | `/21/CB ReturnAccount in another currency (BNMX_RET_4)/SBST/Returned at clearing system` (×2) | Bank B MX | Supplier bank currency |
| Boleto amount mismatch | `…Unable to pay / Payment amount missmatch…(LA_0296)` | Bank B BR | AP (invoice vs boleto) |
| Invalid characters in name | `/CHARRULE_1/Beneficiary Name is not valid…` | Bank B PH | Supplier name data |
| Compliance screening on address / non-Latin text | `Due to a message compliance error… Value: <street address>` / `<street address>` / Japanese company name | Bank C (IE, DE, Global Services, Beyond) | Supplier address/name transliteration |
| Field length | `Value length of STP field X_CDTR_ACCT_ID is less then defined minimum length 24` | — | Bank account format (IBAN-length) |
| Invalid beneficiary bank | `/RULE_3192/Invalid Beneficiary Bank Number/MD14/IncorrectAgent` | — | Bank routing data |

**Pattern:** rejections are dominated by **supplier master data quality** (bank, tax ID, name/address characters), concentrated in Bank B Brazil (8 of 17). `[DATA]` `[INFERRED]`

## No-ack sample (Jul 2026, 40 payments) — meaning: bank has NOT received these payments `[USER:2026-09-30]`
38 `NEGOTIABLE` + 2 `VOIDED` with blank ack fields: 21 Bank B BR (TED/Boleto), 9 Bank A USD (CHECK, incl. political contributions), 6 Bank B MX, 2 Bank A Payments Inc (CHECK), 1 Bank D SAR, 1 Bank E ZAR. **The 11 `CHECK` payments are expected to have no ack:** checks are not electronic, so whether the bank accepted them is tracked manually `[USER:2026-10-05]`. For the other **29** (all electronic), a blank ack means the bank has not received the payment, either through a transmission issue or because it's still being sent. Triage those: confirm the file status in Kyriba, then the transmission to the bank.
