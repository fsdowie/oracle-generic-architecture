---
id: EXT-KYRIBA
type: external-system
aliases: [Kyriba, payment factory, TMS, Payment Accelerator]
role: Treasury management system and payment factory — bank-format translation, host-to-host transmission, acknowledgements, bank statements
authority: Source of truth for payment-code mapping (exception to R1)
partner: the payment-factory consultant
as_of: 2026-10-05
links: [MOD-PAY, PROC-PAYMENTS, INT-955, INT-KYR-PAYFILE, OPS-PAYSTATUS]
---

# Kyriba

`[CO:KYRIBA-DOC §x]` = *Kyriba at Company — Functional & Technical Documentation* (FTG, Oct 2026).

## Role
Kyriba is Company's treasury management system. Company uses its **Payments (Payment Accelerator)** capability as the **single rail** for every Oracle-originated payment to every bank. **FTG never deals with the banks directly; everything goes through Kyriba.** `[CO:KYRIBA-DOC §1, §3]`

Kyriba does four jobs:
1. **Formatting:** turns Oracle's one generic file into each bank's own format and payment code (ACH, wire, SEPA, local clearing, checks).
2. **Connectivity:** transmits host-to-host (H2H) and is the only contact point with the banks.
3. **Acknowledgements:** collects file/batch-level and payment-level accept/reject results and returns them to Oracle.
4. **Statements and cash visibility:** retrieves BAI2 statements for Oracle Cash Management, and provides cash positioning, **Bank Account Management (BAM)** and **Bank Fee Analysis**.

## Flows with Oracle `[CO:KYRIBA-DOC §1.1, App. A]`
| Flow | Direction | Mechanism | Cadence | Stage |
|---|---|---|---|---|
| Outbound payment file (disbursements) | Oracle → Kyriba | Native Oracle Payments e-Text, sent over **SFTP** (run by a managed-service provider; sandbox + production servers) `[USER:2026-10-05]`; no INT number (`integrations/kyriba-payment-file.md`) | On PPR | 07→08 |
| Funds capture / AR refunds (SEPA, EFT) | Oracle → Kyriba | Native, separate SEPA template and funds-capture profile | On PPR | 07→08 |
| Payment acknowledgements | Kyriba → Oracle | OIC `INT955` | Hourly | 08→06 |
| Bank rejections | Kyriba → Oracle | OIC `INT955B`. **Rejected payments are voided manually** `[USER:2026-10-05]`; INT955B's automatic scope is Q-KY-3 | Event | 08→07 |
| BAI2 bank statements | Kyriba → Oracle CM | OIC `INT819` / `INT820` | Daily | 08 |
| Ad hoc bank transactions | Kyriba → Oracle CM | OIC `INT234` | Scheduled | 08 |
| Kyriba entries to GL | Kyriba → Oracle GL | OIC `INT246` | Scheduled | 08 |
| Positive Pay (in-house checks) | Oracle → Kyriba → bank | SFTP + PGP pass-through | On run | 07→08 |

The OIC flows raise `PROD | ERROR | INT###` and `PROD | WARNING | INT###` tickets in the FIN project. The native outbound file has no INT number, so these tickets don't cover it. `[CO:KYRIBA-DOC §9]`

## Payment types carried `[CO:KYRIBA-DOC §4.4]`
- Standard AP supplier payments (auto-approved in Kyriba).
- Employee expense reimbursements (supplier type `EMPLOYEE`).
- Intercompany / Treasury payments: disbursement-flexfield *Intercompany = Yes*, shown as "Treasury payments" in Kyriba. Internal account-to-account transfers were scoped as a later phase.
- Urgent / one-time payments from the Urgent Payment Tool (released manually).
- Customer refunds / funds capture.
- Positive Pay files for checks Company prints in-house. Kyriba only passes these through, without reformatting. They are PGP-encrypted, dropped in the Kyriba SFTP root (no subfolders allowed), named `<CO>_<BANK>_POSPAY_YYMMDD_hhmmss.pgp`, and sent for **two US banks**. `[CO:KYRIBA-DOC §14]`

Remittance advices to suppliers are sent by **Oracle** at the end of a payment run, **not by Kyriba**. `[CO:KYRIBA-DOC §14]`

## The two mappings (both owned in Kyriba) `[CO:02 §7]` `[CO:KYRIBA-DOC §4.3]`
| # | Mapping | Notes |
|---|---|---|
| 1 | Oracle payment method (≤10 chars) → Kyriba transaction code (≤4 chars) | Codes seen in production files: `Electronic`, `SEPA`, `CHK-OS` (outsourced check), `DAC-CTX` and `DAC` (PPD / personal ACH), `MTS` (USD wire), plus the international wire code. ~99% of payments reuse an existing mapping |
| 2 | Kyriba code per bank + issuing country | Kyriba chooses domestic (`DOMW`) or international from whether the issuing and beneficiary countries match. The outbound bank-file configuration is stored per code + bank + country. This is usually the bulk of new-method work |

The FTG reference sheet is an offline, possibly stale copy. `[CO:02 §7]`

**International code = `INTW`** (use going forward) `[USER:2026-09-30]`. The Oct-2026 Kyriba document still shows `IWI` in its examples and in "DOMW vs IWI". Those are older source files; the USER answer wins (R-10). Codes seen in batch IDs: `DOMW`, `INTW`, `TED` (Brazil). `[DATA:payments-status-report]`

## Approval model
Standard AP payments **auto-approve** in Kyriba, because approval happens in Oracle. Urgent and one-time payments from the Urgent Payment Tool are **released manually** by Treasury Operations. `[CO:02 §4 Stage 07]` `[CO:KYRIBA-DOC §4.1]`

## Status progression `[CO:KYRIBA-DOC §4.2]`
- Oracle payment: `NEGOTIABLE` → `CLEARED` (on statement reconciliation), or `VOIDED`.
- Kyriba batch: **Draft → Remitted → Acknowledged**.
- A batch stuck in **Draft** means the configuration is missing (FM-PAY-01). A batch sitting too long in **Remitted** means the file or batch failed (FM-PAY-09/10).

## Bank-account identifiers (three per account) `[CO:KYRIBA-DOC §7.2]`
| Oracle bank-account field | Holds |
|---|---|
| Account Number | The number shown on the bank statement (BAI2). Inbound statements match on it |
| Alternate Bank Account Name | The external account token used as the **Debit Account** in the outbound file |
| Secondary Bank Account Reference | The account's **Kyriba code** (its external ID in Kyriba) |

Outbound files and inbound statements refer to the **same account differently**. A mismatch shows up as a file rejection on the outbound side, or as an unmatched statement on the inbound side `[INFERRED]`.

## Banks
- Four primary banks were configured and tested at go-live, each with one domestic USD scenario and one international multi-currency scenario. Later build-outs included India, UAE, Saudi Arabia and Belgium accounts. One primary bank requires **100% scenario testing**, where the others accept a sample. One primary bank's traffic is mostly **tax payments**. `[CO:KYRIBA-DOC §3.2]`
- Seen in payment data: Bank A (US, India, Japan, Korea, Thailand accounts), Bank B (BR, MX, PH), Bank C (IE, DE, Global Services, Beyond), Bank D (Saudi Arabia), Bank E (South Africa). Name limits by bank format: Bank A allows one payee name; Bank B has no second name; Bank C has two names. `[DATA:payments-status]` `[CO:FIN-24573]`
- No mapping is recorded between the go-live banks and the letters A–E. Don't combine the two lists.

## Monitoring channels `[CO:KYRIBA-DOC §13.1]`
- Two Kyriba alert mailboxes, Company aliases not recorded here: one for **file integrity/format rejections**, one for **Draft and batch-status alerts**.
- The **Kyriba Batch Status report** lists batches with no payment acknowledgement.
- The reason a whole file was rejected is usually visible **only in the Kyriba UI**.

## Silent failure to remember
A payment **stuck in Draft** never releases, and **Oracle shows no sign of it**. The cause is a payment code not configured for the bank + issuing country. `[CO:02 §4 Stage 08]` `[CO:KYRIBA-DOC §4.3]`
