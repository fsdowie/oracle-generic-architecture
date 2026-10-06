---
id: VAL-OPEN
type: open-questions
as_of: 2026-10-05
owner_to_answer: FTG analyst (unless noted)
usage: "Agents must cite the Q-ID instead of guessing when an answer depends on one of these."
---

# Open Questions and Conflicts

## Resolved in the build session (29 Sep 2026) `[USER]`
| ID | Question | Answer |
|---|---|---|
| R-01 | Supplier onboarding path | SRR creates the supplier; INT959 completes details from the questionnaire in Oracle; Apex not involved |
| R-02 | Release in production | 26C |
| R-03 | INT826 schedule | ~01:00 US Eastern daily |
| R-04 | Ledger design | GAAP primary; STAT and TAX secondary |
| R-05 | Expenses | Ramp + Oracle Expenses |
| R-06 | Receivables | Minimal (B2B / partner / intercompany only) |
| R-07 | Tax engine | Oracle Tax native only |

## Resolved 30 Sep 2026 `[USER]`
| ID | Question | Answer |
|---|---|---|
| R-08 (was Q-ZIP-2) | How is a new PO supplier created? | Zip → Apex portal → Oracle Fusion; only available after Apex |
| R-09 (was Q-PAY-3, partly) | What is INT955? | The Kyriba → Oracle Payments payment-acknowledgement integration |
| R-10 (was Q-KY-1) | IWI vs INTW | Use `INTW` going forward |
| R-12 (was Q-APEX-2) | Which integration creates Oracle suppliers from Apex? | **INT055A** |
| R-13 (was Q-055A-1) | INT055A field map and trigger | Answered by the INT055A Lean Spec + unit test (see `integrations/INT055A.md`) |
| R-11 (was Q-PAY-5) | Payments with no ack | The bank has not received them — transmission issue or still being sent; actionable |

## Resolved 5 Oct 2026 `[CO:KYRIBA-DOC]` `[USER:2026-10-05]`
| ID | Question | Answer |
|---|---|---|
| R-15 (was Q-KY-2) | Production transmission of the outbound payment file | **SFTP**, run by a third-party managed-service provider; server configured in Oracle; one sandbox (DEV) and one production server `[USER:2026-10-05]` |
| R-16 (was Q-KY-3, partly) | How are bank-rejected payments cancelled? | **Manually voided** in Oracle `[USER:2026-10-05]` |
| R-18 (was Q-KY-3) | What does INT955B do? | **Only updates the DFFs on the Oracle payment.** It does not cancel or void payments or bank transfers, despite its name and the Kyriba document `[USER:2026-10-05]` |
| R-17 (was Q-PAY-4) | Do `CHECK` payments carry a bank ack? | **No.** `CHECK` payments are not electronic; whether the bank accepted them is tracked **manually** `[USER:2026-10-05]`. A blank ack on a `CHECK` payment is expected, not FM-PAY-05. (Kyriba still has an outsourced-check code `CHK-OS` and passes Positive Pay files through for in-house checks `[CO:KYRIBA-DOC]`.) |
| R-21 (was Q-FA-1) | Is TAB used to derive depreciation-expense segments in Fixed Assets? | **Yes**: the Transaction Account Builder derives depreciation-expense segments from the originating AP invoice distribution, not category defaults `[CO:R2R-FEATURES]`. FA use of TAB is still not confirmable in the 26C guides supplied |
| R-20 (was Q-PAY-7) | Are payments accounted at clearing time? | **No: single step.** Create Accounting books Liability (Dr) / Cash (Cr) once, at payment issue, from the *Payment Created* event. No cash clearing account is configured, so statement reconciliation (payment → `CLEARED`) raises no *Payment Clearing* event and creates no journal entry. Bank acknowledgements are status only. `[USER:2026-10-06]` `[DATA:XLA trace of one cleared payment, 6-Oct-2026]` |
| R-19 (was Q-PAY-7 a–b) | Do expense items accrue at receipt or at period end? | **Period end** `[USER:2026-10-06]`. Receipts without invoices are accrued at period close and reversed when the next period opens; the receipt itself creates no accounting, and the invoice books the expense |
| R-14 (was Q-PAY-3) | Does INT955 use Oracle's standard disbursement-acknowledgment processing? | No. INT955 writes custom DFFs (`ATTRIBUTE1/3/4/5`) on `AP_CHECKS_ALL` through REST `payablesPayments/{CheckId}`. The standard feature is a modernisation option (see INT955.md) |

## Open — priority 1 (affect how an agent answers core questions)
| ID | Question | Why it matters | Where |
|---|---|---|---|
| Q-ZIP-1 | Integration ID and field map of the Zip → Oracle requisition import | Integration mapping doc; diagnostics | zip.md |
| Q-TAB-1 | Is category → charge account derived by **Transaction Account Builder** (TAD/mapping sets) in Oracle? Name of the TAD and mapping sets (incl. France set) | GL mapping defect triage | MOD-PROC |
| Q-SSP-1 | The `*_VAL` rules (e.g. `REQ_SINGLE_SUPP_VAL`, `BU_SPEND_CATEGORY_VAL`) block requisition submit in Oracle. How are they built — VB Studio Redwood rules, Groovy/object validations, OIC pre-check? Who owns the *RQ/PO validations inventory*? | Where to change a rule; 26C quarterly regression risk | MOD-PROC |

## Open — priority 2
| ID | Question | Where |
|---|---|---|
| Q-LED-2 | Data conversion level for STAT and TAX secondary ledgers (Balance / Journal / Subledger / Adjustment Only)? Reporting-currency levels? | FND-COA |
| Q-959-1 | INT959 trigger: event on SRR approval or scheduled poll? | INT959.md |
| Q-959-2 | Full INT959 field map (questionnaire → supplier attributes) | INT959.md |
| Q-959-3 | Does INT959 also process supplier profile *change* requests? | INT959.md |
| Q-APEX-1 | Are INT055B/C (Oracle → Apex supplier change) still the return leg to Apex? | catalog.md |
| Q-PAY-2 | Is Oracle payment approval (Review Proposed Payments stage) enabled, and for which PPR templates? | MOD-PAY |
| Q-PAY-6 | Is the `payments-status-report` extract the REP627 output, or a different report? | payment-status-reference |
| Q-AP-1 | Owner and exact procedure of the monthly invoice-tolerance recalculation | MOD-AP |
| Q-AP-2 | Invoice approval rules (who approves non-PO invoices; thresholds) | MOD-AP |
| Q-SUP-2 | Cadence/owner of supplier inactivation (offboarding) | PROC-P2P |
| Q-IC-1 | Are Oracle intercompany balancing rules configured alongside INT992? | MOD-GL |
| Q-EPM-1 | Why custom TB BIP report rather than native Oracle GL / Trial Balance adapters in Data Management? | MOD-EPM |
| Q-INT-1 | OIC/S3 integration identifier(s) for the daily FAH load | register |
| Q-INT-3 | Direction semantics for INT931/931B and INT934 (listed "Out" but named "to Oracle") | register |
| Q-EXP-1…4 | Oracle Expenses vs Ramp populations; card loading; Ramp reimbursement payment path; Expenses approval matrix | MOD-EXP |
| Q-AR-1…4 | AR customer populations; import channel; IC invoicing vs AR; receipt application | MOD-AR |
| Q-TAX-1 | WHT regimes configured in Oracle Tax vs Payables-style WHT | MOD-TAX |
| Q-TAX-2 | What is the "1099 / Vertex feed" referenced in FIN-24137 D7? | MOD-TAX |

## Zip ownership documentation gaps (need primary sources)
Roles & responsibilities (Zip roles list) · ITGC narrative (access, change, monitoring, SOC) · node-level workflow export · vendor-delivered vs custom configuration inventory. See `external-systems/zip.md`.

## Deferred — detail-level, not needed for the architecture view (per the FTG analyst, 30 Sep 2026)
These stay documented as caveats in `integrations/INT055A.md`; agents should flag them rather than resolve them.
| ID | Item |
|---|---|
| Q-055A-2 | Supplier numbering: spec says `SUP`+VR_ID, UAT shows one VR_ID mapping to an unrelated SUP number. Which rule is live? | INT055A.md |
| Q-055A-3 | Payment method: spec says Apex payment method passed as NULL, yet the process creates a payment method via `CO_PAYMENT_METHODS` (Check/EFT). Which is live? | INT055A.md |
| Q-055A-4 | What does the Mulesoft REST API connection do in INT055A? | INT055A.md |
| Q-055A-5 | Error-notification recipients: supplier-team alias vs integrations alias vs FTG integration list? | INT055A.md |
| Q-055A-6 | Are `LEGACY_ORACLE_TAX_PROFILE_MAP` (INT055A) and `LEGACY_ORACLE_TAX_PROFILE_MAPPING` (INT959 tickets) the same lookup? If yes, ER.4 consumer trace must include INT055A | INT055A.md, INT959.md |

## Superseded statements in sources (no action; recorded so agents don't repeat them)
| Source | Says | Pack position |
|---|---|---|
| CO:KYRIBA-DOC §9.1 | Oracle Fusion on release **26B** | **26C** in production (R-02, USER) |
| CO:KYRIBA-DOC §4.3, App. B | International Kyriba code `IWI` ("DOMW vs IWI") | `INTW` (R-10, USER) |
| CO:KYRIBA-DOC §13.2 | Accepted ack value `ACCP` | DFF value set is `ACPT`/`RJCT`; treat `ACCP` as the same meaning |
