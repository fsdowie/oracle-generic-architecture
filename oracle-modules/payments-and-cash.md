---
id: MOD-PAY
type: oracle-module
modules: [Payments, Cash Management]
workstream: P2P (settlement), R2R (cash)
as_of: 2026-10-05
release: 26C
links: [PROC-PAYMENTS, EXT-KYRIBA, INT-955, INT-KYR-PAYFILE, OPS-PAYSTATUS]
---

# Oracle Payments and Cash Management

## Payments — what it owns
Payment process requests (PPRs), payment documents, payment files, payment status. `[CO:02 §2]`

| Object | Company configuration | Oracle 26C basis |
|---|---|---|
| PPR template | Per legal entity and bank account; bank account enabled for electronic processing and linked to the Kyriba payment template | Stored in `AP_PAYMENT_TEMPLATES`; LE and pay-group selections in `AP_LE_GROUP` / `AP_PAY_GROUP` `[ORA26C:implementing-payables-invoice-to-pay p.168, 173]` |
| Payment process profile | Payment formats per method/bank | `PAYMENT_PROFILE_ID`; ISO payment process profile creation is part of the electronic payment flow `[ORA26C:… p.170, 193]` |
| Payment methods | ~36 historically offered on registration; being reduced to methods used in last 24 months; Treasury needs Electronic + Manual. Observed: `EFT`, `TED`, `BOLETO`, `CHECK`, `SEPA` | Payment method defaulting rules and supplier-specific defaults `[ORA26C:… p.207, 210]` |
| Payment approval | "Payment approval workflow rules" exist; **standard AP payments auto-approve in Kyriba** because approval happens upstream in Oracle | When payment approval is enabled the PPR stops at *Review Proposed Payments* for approvers `[ORA26C:… p.204, 206]` |
| Acknowledgements | `INT955` = Kyriba → Oracle Payments acknowledgement integration (hourly) `[USER:2026-09-30]`. It writes custom DFFs on `AP_CHECKS_ALL` through REST and **does not** use Oracle's standard ack processing `[CO:KYRIBA-DOC §11]`. `INT955B` = the bank-rejection integration, which **only updates the payment DFFs**; **rejected payments are voided manually** `[USER:2026-10-05]` | Oracle Payments standard disbursement acknowledgment processing, incl. *Automatic Voiding Option* `[ORA26C:… p.220]`. Not used today, so it's a modernisation option |
| Escheatment | Checks stay *Negotiable* until the validity window passes | `[ORA26C:… p.37]` |
`[CO:02 §2, §4 Stage 07, §7]`

### Payment channels
1. **Standard AP PPR** → payment file → Kyriba → bank. Auto-approved in Kyriba.
2. **Urgent / one-time** via the Oracle **Urgent Payment Tool** (penny tests, legal settlements, political contributions, one-time payees) → **manually released by Treasury Operations in Kyriba**. `[CO:02 §4 Stage 07]`
3. **Checks**: there are two check routes `[CO:KYRIBA-DOC §4.3, §14]`:
   - **Outsourced checks** use Kyriba code `CHK-OS`, so the bank prints them.
   - **In-house checks** are printed by Company. Kyriba only passes their **Positive Pay** files through to two US banks (SFTP + PGP).

   `CHECK` PPRs (e.g. political contributions, US tax authorities) show no acknowledgement status `[DATA:payments (negotiable and voided) with no ACK status.xlsx]`. That is expected: **`CHECK` payments are not electronic, so no bank ack comes back, and acceptance is tracked manually** `[USER:2026-10-05]` (R-17).
4. **Treasury PPRs** — `TRS …` naming, supplier type `TREASURY`. `[DATA]`
5. **Intercompany settlement**: intercompany PPR templates `[CO:03 §3.4]`. Intercompany payment methods set the disbursement flexfield *Intercompany = Yes* (`ATTRIBUTE1`), and Kyriba treats those payments as Treasury payments. `[CO:KYRIBA-DOC §10.1]`
6. **Funds capture / AR refunds** (SEPA, EFT) use their own setup: e-Text template `TMS_Kyriba_Payment_Format_SEPA.rtf`, a funds-capture process profile and a customer transmission configuration. `[CO:KYRIBA-DOC §14]`

The whole Oracle → Kyriba setup chain (formats, payment methods, transmission configuration, payment system, profiles) and the file's field mapping are in `integrations/kyriba-payment-file.md`.

### Payee name mapping (bank file)
Oracle sends Supplier Name as Name 1 and Bank Account Name as Name 2 (only when different). Bank A formats accept one name (India, Japan, Korea, Thailand non-US accounts); Bank B no second name; Bank C two names but only one populated. Proposal FIN-24573: swap so Bank Account Name → Name 1. Supplier Type is not exposed as a tag in the payment XML. `[CO:FIN-24573 draft]` *Change in flight.*

## Cash Management
- Bank accounts and external identifiers; statements import `INT819` / `INT820`; ad hoc bank transactions `INT234`. `[CO:02 §2]`
- `INT819`/`INT820` load the **BAI2** statements Kyriba retrieves, once a day. Statement reconciliation moves a payment from `NEGOTIABLE` to `CLEARED` and is how returns are identified. Lookup extract `FN_LOOKUP_VL_Extract_Report_csv_INT819_INT820` supports their configuration. `[CO:KYRIBA-DOC §7, §12.2]`
- **Each internal bank account has three identifiers:**
  - **Account Number** = the number on the statement.
  - **Alternate Bank Account Name** = the outbound file's Debit Account.
  - **Secondary Bank Account Reference** = the Kyriba code.

  See `external-systems/kyriba.md`. `[CO:KYRIBA-DOC §7.2]`
- **Returns** show up as credits on the statement, sometimes for a different amount (bank fees deducted) and with inconsistent references. A Kyriba report of the most-used return BAI codes helps spot them. `[CO:KYRIBA-DOC §7.3, §13.3]`
- ReconArt performs cash reconciliation and feeds ARCS (bank balances day 4, unmatched ~day 6); `INT072` ReconArt → GL; `INT071A/B` Oracle → ReconArt. `[CO:03 §3.5]`
- No Cash Management 26C guide was supplied → Oracle-standard statements here are `[UNVERIFIED]`.

## Failure modes
FM-PAY-01…07 in `operations/controls-and-failure-modes.md` (wrong GL account for entity; reprocess requires rejecting original; urgent desk failures; void/method changes manual; stuck in Draft in Kyriba; field-length limit; bank rejections).
