---
id: EXT-KYRIBA
type: external-system
aliases: [Kyriba, payment factory]
role: Payment factory — bank-format translation, host-to-host transmission, acknowledgements
authority: Source of truth for payment-code mapping (exception to R1)
partner: the payment-factory consultant
as_of: 2026-09-29
links: [MOD-PAY, PROC-PAYMENTS, INT-955, OPS-PAYSTATUS]
---

# Kyriba

## Responsibilities `[CO:02 §2, §4 Stage 08]`
1. Consume Oracle payment file.
2. Derive bank-specific payment code.
3. Translate to bank format; transmit host-to-host (H2H).
4. Return acknowledgements/rejections to Oracle hourly (`INT955`, `INT955B`); daily rejection summary email to AP and Treasury.
5. Post to Oracle GL (`INT246`).

## The two mappings (both owned in Kyriba)
| # | Mapping | Notes |
|---|---|---|
| 1 | Oracle payment code → Kyriba code | Kyriba chooses domestic (`DOMW`) vs international (`INTW`) by issuing vs beneficiary country. ~99% reuse existing mapping |
| 2 | Kyriba code per bank + issuing country | Usually the bulk of new-method work; outbound bank file config stored against code+bank+country |
The FTG reference sheet is an offline, possibly stale copy. `[CO:02 §7]`

**International code = `INTW`** (use going forward; the `IWI` value in older docs is superseded) `[USER:2026-09-30]`. Observed codes in batch IDs: `DOMW` (domestic), `INTW` (international), `TED` (Brazil). `[DATA:payments-status-report]`

## Approval model
Standard AP payments **auto-approve** in Kyriba (control is in Oracle). Urgent/one-time payments from the Urgent Payment Tool are **manually released** by Treasury Operations. `[CO:02 §4 Stage 07]`

## Banks observed `[DATA:payments-status]`
Bank A/Bank A (US, India, Japan, Korea, Thailand accounts), Bank B (BR, MX, PH), Bank C (IE, DE, Global Services, Beyond), Bank D (Saudi Arabia), Bank E (South Africa). Format constraints: Bank A single payee name; Bank B no second name; Bank C two names. `[CO:FIN-24573]`

## Silent failure to remember
**Stuck in Draft** — payment code not configured for bank+issuing country → never releases, **no Oracle-side signal**. `[CO:02 §4 Stage 08]`
