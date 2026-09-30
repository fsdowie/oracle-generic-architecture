---
id: MOD-PAY
type: oracle-module
modules: [Payments, Cash Management]
workstream: P2P (settlement), R2R (cash)
as_of: 2026-09-29
release: 26C
links: [PROC-PAYMENTS, EXT-KYRIBA, INT-955, OPS-PAYSTATUS]
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
| Acknowledgements | `INT955` = Kyriba → Oracle Payments acknowledgement integration (hourly) `[USER:2026-09-30]`; `INT955B` = rejections cancel Oracle bank transfers and payments | Oracle Payments standard disbursement acknowledgment processing incl. *Automatic Voiding Option* `[ORA26C:… p.220]` (relationship to INT955: Q-PAY-3, low priority) |
| Escheatment | Checks stay *Negotiable* until the validity window passes | `[ORA26C:… p.37]` |
`[CO:02 §2, §4 Stage 07, §7]`

### Payment channels
1. **Standard AP PPR** → payment file → Kyriba → bank. Auto-approved in Kyriba.
2. **Urgent / one-time** via the Oracle **Urgent Payment Tool** (penny tests, legal settlements, political contributions, one-time payees) → **manually released by Treasury Operations in Kyriba**. `[CO:02 §4 Stage 07]`
3. **Checks** — `CHECK` method PPRs (e.g. political contributions, US tax authorities) observed with no acknowledgement status. `[DATA:payments (negotiable and voided) with no ACK status.xlsx]` Whether checks route through Kyriba at all is not documented → Q-PAY-4.
4. **Treasury PPRs** — `TRS …` naming, supplier type `TREASURY`. `[DATA]`
5. **Intercompany settlement** — intercompany PPR templates. `[CO:03 §3.4]`

### Payee name mapping (bank file)
Oracle sends Supplier Name as Name 1 and Bank Account Name as Name 2 (only when different). Bank A formats accept one name (India, Japan, Korea, Thailand non-US accounts); Bank B no second name; Bank C two names but only one populated. Proposal FIN-24573: swap so Bank Account Name → Name 1. Supplier Type is not exposed as a tag in the payment XML. `[CO:FIN-24573 draft]` *Change in flight.*

## Cash Management
- Bank accounts and external identifiers; statements import `INT819` / `INT820`; ad hoc bank transactions `INT234`. `[CO:02 §2]`
- ReconArt performs cash reconciliation and feeds ARCS (bank balances day 4, unmatched ~day 6); `INT072` ReconArt → GL; `INT071A/B` Oracle → ReconArt. `[CO:03 §3.5]`
- No Cash Management 26C guide was supplied → Oracle-standard statements here are `[UNVERIFIED]`.

## Failure modes
FM-PAY-01…07 in `operations/controls-and-failure-modes.md` (wrong GL account for entity; reprocess requires rejecting original; urgent desk failures; void/method changes manual; stuck in Draft in Kyriba; field-length limit; bank rejections).
