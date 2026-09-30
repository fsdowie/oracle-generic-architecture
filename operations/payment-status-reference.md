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
- `VOIDED` after `RJCT` = INT955B cancellation path. `[CO:02]` `[DATA]`
- Rejected ≠ returned: RJCT arrives on ack; RETURNED happens after bank acceptance (tracked manually). `[CO:FIN-24248]`

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
38 `NEGOTIABLE` + 2 `VOIDED` with blank ack fields: 21 Bank B BR (TED/Boleto), 9 Bank A USD (CHECK, incl. political contributions), 6 Bank B MX, 2 Bank A Payments Inc (CHECK), 1 Bank D SAR, 1 Bank E ZAR. A blank ack means the bank has not received the payment — either a transmission issue or still being sent. Triage: confirm file status in Kyriba, then transmission to bank. Whether CHECK payments are expected to carry an ack is still Q-PAY-4.
