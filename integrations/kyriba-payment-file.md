---
id: INT-KYR-PAYFILE
type: integration
name: Outbound payment file, Oracle Payments → Kyriba (native, no INT number), plus funds-capture / AR-refund file
source: Oracle Payments (PPR → payment file)
target: Kyriba (SFTP via a managed-service provider)
lane: Native Oracle Payments (BI Publisher e-Text + Transmission Configuration)
cadence: on PPR completion
as_of: 2026-10-05
links: [EXT-KYRIBA, MOD-PAY, PROC-PAYMENTS, INT-955]
---

# Outbound payment file — Oracle → Kyriba

Evidence tag for this file: `[CO:KYRIBA-DOC §x]` = *Kyriba at Company — Functional & Technical Documentation* (FTG, Oct 2026). It is a compiled current-state document; its own sources are the INT955 TFD v1.3, the Kyriba Oracle Cloud Setup Guide (Kyriba / the SI partner), the Kyriba File Format e-Text spec and the Kyriba implementation Q&A log.

## 1. What it is
- The one Oracle ↔ Kyriba flow that is **not an OIC integration**. Oracle Payments formats the file using a BI Publisher e-Text template and sends it through a Transmission Configuration. It has **no INT number**, so it does not appear in `PROD | ERROR | INT###` monitoring. `[CO:KYRIBA-DOC §9]`
- **One bank per file.** A file can hold many payments, and its name carries a timestamp. Files reach the bank about **5 minutes** after leaving Oracle. `[CO:KYRIBA-DOC §4.2]`
- A second, parallel file carries **funds capture**: SEPA direct debit and EFT/SEPA **AR refunds**. `[CO:KYRIBA-DOC §1.1, §14]`

## 2. Oracle configuration chain (setup order) `[CO:KYRIBA-DOC §10.1]`
| # | Object | Company setting |
|---|---|---|
| 1 | BI Publisher e-Text templates (`/Financials/Payments/Disbursement Payment File Formats`) | `TMS_Kyriba_Payment_Format.rtf` (disbursements: supplier, intercompany); `TMS_Kyriba_Payment_Format_SEPA.rtf` (funds capture / SEPA / AR refunds). The template's *Source* value is set per environment |
| 2 | Payment Formats | One disbursement format, one funds-capture format |
| 3 | Disbursement flexfield (Disbursement Payment Methods) | Segment `Intercompany`, value set `YES_NO_Value_Set`, column `ATTRIBUTE1`. This is the intercompany / Treasury-payment indicator the template reads |
| 4 | Payment Methods / Funds Capture Payment Methods | One per business scenario: domestic ACH (low value), domestic high value, domestic check, international wire, international low value, SEPA credit transfer, domestic/SEPA direct debit, intercompany domestic/international. Each maps to a Kyriba transaction code. Intercompany methods set *Intercompany = Yes* |
| 5 | Transmission Configurations | Two: one for vendor/intercompany payments, one for customer/direct debit. Protocol *Http Multiple Part Data Upload* |
| 6 | Payment System | Kyriba, with the formats above attached |
| 7 | Payment Process Profile | Payment file format, payment system and transmission configuration; processing type *Electronic* |
| 8 | Funds Capture Process Profile | Settlement file format, payment system and transmission configuration |

These are Oracle-standard setup objects, but no 26C Payments guide was supplied, so the setup order and object behaviour are `[UNVERIFIED]` against 26C.

### Transmission configuration `[CO:KYRIBA-DOC §10.1.1]`
| Parameter | Value |
|---|---|
| Protocol | Http Multiple Part Data Upload (do not modify) |
| Destination | Kyriba CaaS-ERP payment-request import endpoint (URL issued by Kyriba Support; not recorded here) |
| File name | `Kyriba_Payment_File_&DATE&TIME.txt` (disbursements); `Kyriba_Direct_Debit_Payment_File_&DATE&TIME.txt` (customer) |
| Send / receive content type | `multipart/form-data` / `application/json` |
| Authentication | A dedicated Kyriba API user and password, issued by Kyriba Support (not recorded here) |

**Production uses SFTP, not the HTTP upload.** The SFTP is run by a third-party managed-service provider, and its server is configured in Oracle. There are two: a **sandbox** server used by DEV and the **production** server. `[USER:2026-10-05]` (resolves Q-KY-2). The HTTP settings above are the Kyriba setup guide's default, kept for reference. Kyriba's SFTP doesn't support new folder structures or archiving logic, so files are told apart by **file name** only. `[CO:KYRIBA-DOC §10.1.1 note]`

## 3. File structure `[CO:KYRIBA-DOC §10.2]`
A **pipe-delimited** flat file with three record types:
- **Header / level** record (new-record marker `P`).
- **`TR`**: one per payment.
- **`IN`**: one per paid document (invoice or credit memo).

### 3.1 TR (payment) record — the derivation rules worth knowing
| Kyriba field (max len) | Oracle source / rule |
|---|---|
| Transaction Code (40) | Payment method name, except `EFT AR Refund` → `Electronic` and `SEPA AR Refund` → `SEPA` |
| Reference (20) | Payment reference number |
| Debit Account (40) | Internal bank account's **Alternate Bank Account Name**. The value is a token `<entity><bank><ccy><seq>` identifying the paying account |
| Currency (3) / Amount (15, N) / Date (8) | Payment currency; `ROUND(amount,2)`; `YYYYMMDD` |
| Reason 1 (140) | If the reason is blank **and** the payer is the Japan JPY business unit **and** the currency is USD → `/4000/: Other Service`. Otherwise, if reason and comments are both blank → `/POP:SERVICES/`. Otherwise reason code, meaning and comments joined. Field length is the FM-PAY-02 risk |
| Fee Assessment (3, N) | Bank charge bearer: Payee `000`, Payee-pays-express `001`, Payer `002`, Shared `003` |
| Name 1 (100) | For `GIRO` / `Expense Payment` with payee bank country JP, CN or SG → **Bank Account Name**; otherwise **Payee Name** (supplier name). See FIN-24573 for the name-mismatch change in flight |
| Name 2 (35) | Payee Bank Account Name |
| Identifier (20) | Payee legal-entity registration number |
| Payee address fields | Address lines, city, ZIP, state, country, email. **GB + Wire → province `ZZ`** |
| Payee bank name (35) | For `GIRO` / `Expense Payment` in JPY or CNY → **Alternate Bank Name**; otherwise Bank Name |
| Payee bank BIC (11) / identifier (20) | SWIFT code; branch number when there is no IBAN |
| Payee account ID (35) | Expense credit card → account number. **GB + Wire → branch number ‖ account number**. Otherwise IBAN, then account number, then **Secondary Bank Account Reference** (precedence by which value is blank) |
| Account nature (2) | Checking `01`, Savings `02`, Investment `03`, Other `99` |
| Correspondent fields | Intermediary bank BIC, name, country, branch, account / IBAN |
| Free text 2 | **GB + Wire → `DEP`** |
| Free text 4 / 6 / 7 | User-assigned reference code; unique remittance identifier; payee Secondary Bank Account Reference |
| Free text 5 | Bank number; **Canada → prefixed with `0`** |
| Remittance identifier / Check number / Link ID | Instruction reference; check number; payment reference number |
| UMR, mandate date, sequence type | Blank (direct-debit fields not used on disbursements) |

Example (shortened): `TR|CHK-OS|<ref>|<debit-acct-token>|USD|15000|20250502|/POP:SERVICES/|…`

### 3.2 IN (document) record
Type (`STANDARD` → 0, `CREDIT` → 1); internal and beneficiary reference = document number; invoice date and due date (`YYYYMMDD`); paid amount and billed amount (sign-normalised, 2 dp). `[CO:KYRIBA-DOC §10.2.2]`

## 4. Country-specific rules an agent should recognise
These sit in the e-Text template, so changing one is a **template change**, not a Kyriba change `[INFERRED]`:
- **GB wires**: province `ZZ`, free text 2 `DEP`, account = branch ‖ account.
- **JP / CN / SG GIRO and expense payments**: the bank-account name and the alternate bank name replace the payee name and the bank name.
- **Japan JPY BU paying USD**: default purpose `/4000/`.
- **Canada**: bank number prefixed with `0`.

## 5. Failure modes
FM-PAY-01 (stuck in Draft), FM-PAY-02 (field length), FM-PAY-08…10 (file or batch rejected before payment-level acks) in `operations/controls-and-failure-modes.md`.
