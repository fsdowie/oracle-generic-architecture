---
id: OPS-FM
type: failure-mode-catalog
as_of: 2026-09-29
usage: "Match the symptom column; follow locus → first diagnostic → fix owner. Never skip the lane check (01-principles R4)."
---

# Controls and Failure-Mode Catalogue

| Code | Symptom | Locus | Lane | First diagnostic | Fix owner | Signal | Evidence |
|---|---|---|---|---|---|---|---|
| FM-SUP-01 | Supplier created but can't be paid / INT959 fails | Registration with no address | OIC | Check SRR addresses & site purposes | FTG (ER.1) | Manual correction | `[CO:FIN-25032]` |
| FM-SUP-02 | Supplier creation fails | Payment terms not matching Oracle value | OIC | INT959 error vs terms LOV | FTG/BizTech | OIC error | `[CO:FIN-24137]` |
| FM-SUP-03 | Supplier can't be paid by other method | INT959 end-dated non-selected methods | OIC | Supplier site payment methods | BizTech (FIN-24752) | Manual reopen | same |
| FM-SUP-04 | Bank file rejects/structured address fails | Missing/invalid city | — | Supplier address | AP/FTG | Bank reject | `[CO:02 §4]` |
| FM-SUP-05 | Matching/sourcing degraded | Duplicate suppliers, no parent-child | — | Supplier dedupe | Procurement | — | same |
| FM-055A-01 | Apex supplier not in Oracle / no site for an entity | Missing crosswalk row, missing lookup value (terms, tax type, bank group, classification), invalid sub-entity | OIC | Apex event log; INT055A error email; OCI error file | FTG + Apex team | Error email | `[CO:INT055A-spec]` |
| FM-ZIP-01 | Requisition never arrives in Oracle | Spend category inactive/absent in Oracle | OIC | Compare Zip SC with Oracle sub-account | FTG + Zip admin | OIC error | `[CO:02 §4]` |
| FM-ZIP-02 | PO under wrong LE/CC | Intake selection | — | Zip request | Requester → cancel & restart | — | same |
| FM-SSP-01 | Req rejected though Zip showed valid | CVR / Redwood validation | — | Which `*_VAL`/CVR fired | FTG | UI error | `[CO:02 §3–4]` |
| FM-SSP-02 | Approval stalled | Approver on leave/terminated; needs manual re-trigger | — | Approval history | FTG (Request) | Ticket | same |
| FM-GLMAP-01 | Cost posted to wrong account | Zip lookup **or** Oracle TAB/mapping set | — | Compare Zip-sent vs Oracle-stored | Zip admin or FTG | — | `[CO:02 §3]` |
| FM-PO-01 | Hundreds of duplicate change-order notifications | PO change workflow | — | — | FTG | — | `[CO:02 §4]` |
| FM-PO-02 | Invoice approval/payment blocked | Stale PO requester | — | PO requester | Procurement Ops/FTG | — | same |
| FM-BICC-01 | Warehouse shows no/old PO data | Blank BICC extract | BICC | File size/row count checks | FTG/Data | **Silent** | `[CO:01 §7]` |
| FM-ACC-01 | Duplicate accrual journals | INT026F | OIC | Journal source/batch | FTG | Recon report | `[CO:02 §4]` |
| FM-ACC-02 | Accrual not reversed | Reversal setup | — | REP577 | FTG | Alert | same |
| FM-AP-01 | Invoice on matching hold | Tolerance exceeded (local-ccy tolerance drift) | — | Tolerance vs current rate | AP / FTG | Hold | `[CO:02 §4–5]` `[ORA26C:payables p.92]` |
| FM-AP-02 | All supplier's invoices blocked | Supplier-level hold on unvalidated invoices | — | Supplier site hold flags | AP | Hold (mean 35.6d) | `[CO:02 §4]` |
| FM-AP-03 | Non-PO invoice held | INT960 >5K cumulative per line | OIC | Line cumulative amount | AP / business | Hold (mean 34.6d) | same |
| FM-826-01 | Terms exception not applied — "No record found in Fusion" | Zip user entry (REQ vs PO, format, notes) | OIC | Validate `^PO\d{10}$`, single invoice no. | Requester / Zip | Log | `[DATA]` |
| FM-826-02 | "Not Updated" (not approved/validated, pending CO, finally closed) | Timing/status | OIC | Invoice/PO status | None/AP/Procurement Ops | Log | `[DATA]` |
| FM-826-03 | 401 errors | Service credentials | OIC | OIC connection | BizTech | PROD ERROR ticket | `[DATA]` |
| FM-PAY-01 | Payment never releases | Kyriba code × bank × issuing country missing | Kyriba | Kyriba Draft queue | Treasury/the payment-factory consultant | **Silent in Oracle** | `[CO:02 §4]` |
| FM-PAY-02 | File not in Kyriba | Oracle field length (payment reason) | — | Payment file | FTG | — | same |
| FM-PAY-03 | Bank reject (RJCT) | Beneficiary data (see taxonomy) | INT955 | REP627 bank-msg | AP/Procurement/Tax | ORA_AP_BANK_ACK_RJCT | `[DATA]` |
| FM-PAY-04 | Bank never processes | Account not H2H-enabled | — | Treasury with bank | Treasury | — | `[CO:02 §5]` |
| FM-PAY-05 | **Electronic** `NEGOTIABLE` payment with **no ack** (`CHECK` excluded: checks never get an ack; tracked manually `[USER:2026-10-05]`) | **Bank has not received it** — transmission failure (Oracle→Kyriba→bank) or still in transit `[USER:2026-09-30]` | INT955 | REP627 ack-status/ack-date blank; age since payment-date; check Kyriba file/transmission status | FTG + Treasury (Kyriba) | Silent unless monitored | `[DATA]` `[USER:2026-09-30]` |
| FM-PAY-06 | Returned after acceptance | Name mismatch etc. | — | Returned payments tracker | AP/GL | Manual sheet | `[CO:FIN-24248, 24573]` |
| FM-PAY-08 | Whole file rejected by Kyriba; **no acks for any payment in it** | File integrity / format | Native payment file (no INT#) | Kyriba UI (the reason usually appears only there) | FTG + payment-factory consultant | Kyriba integrity-alert mailbox; no OIC ticket | `[CO:KYRIBA-DOC §13.1]` |
| FM-PAY-09 | Batch stuck in **Remitted**, no payment acks | Wrong payment method + currency + bank combination (e.g. CAD in a US ACH file) | Kyriba | Kyriba Batch Status report | Treasury / FTG | Kyriba batch-status alert | same |
| FM-PAY-10 | Batch stuck in **Remitted**, no payment acks | The bank rejected the whole file or batch (e.g. special characters) | Bank | Kyriba Batch Status report; Kyriba UI | Treasury (Kyriba) / AP for data | Kyriba batch-status alert | same |
| FM-CM-01 | Cash recon gaps | Missing bank statements INT819/820 | OIC | Statement import | FTG/Treasury | — | `[CO:02 §4]` |
| FM-XLA-01 | Transactions unaccounted | Missing attribute (e.g. guest currency) | FAH | Create Accounting report | FTG | Monthly review | `[CO:03 §3.2]` |
| FM-XLA-02 | Platform run late | Rules engine / GL post throughput | FAH | Run timing | FTG | ~1% of runs | same |
| FM-XLA-03 | Accounting method *Incomplete* after rule change | Rule change not re-validated | — | Method status | FTG | Create Accounting uses active only | `[ORA26C:subledger p.16]` |
| FM-GL-01 | Journal import rejected | CVR (incl. zero-balance combos) | FBDI/OIC | Import errors | FTG | Interface report | `[CO:03 §3.1]` |
| FM-GL-02 | Duplicate journals | Feeder re-send | OIC | Batch/source | FTG | Recon | same |
| FM-IC-01 | IC out of balance at month-end | 19500 imbalance | OIC | REP026 | FTG/Accounting | Manual reclass | `[CO:03 §3.4]` |
| FM-IC-02 | Spend unallocated | Allocation rule missing new CC | — | Allocation CC hierarchy | FTG/TP | — | same |
| FM-IC-03 | Correction blocked | Allocations category frozen | — | Journal approval rule | FTG | — | same |
| FM-FA-01 | Cost stuck in clearing | Mass addition held/rejected in approval queue | — | REP626 | Fixed Assets | — | `[CO:03 §3.3]` |
| FM-FA-02 | Depreciation expense wrong segments | Category default vs intended invoice override | — | Account derivation | FTG | — | same |
| FM-ARCS-01 | Balances without profile | Unmapped accounts | Airflow/DM | Invalid mappings export | FTG + business | Monthly cycle | `[CO:03 §3.5]` `[ORA26C:ARCS p.254]` |
| FM-ARCS-02 | New invalid transactions after reopen | Reopen side effect | — | Compare to pre-reopen export | FTG | — | same |
| FM-FCCS-01 | Consolidation incomplete | Maintenance-window collision | — | Job console | FTG/Consolidation | Manual force-consolidate | `[CO:03 §3.6]` |
| FM-FCCS-02 | Load mapping exceptions | DM mappings | Airflow | FPC07 | FTG | Task Manager | same |
| FM-FCCS-03 | Numbers moving during tie-out | DAG not paused | Airflow | DAG state | FTG | — | same |
| FM-WH-01 | Oracle ≠ warehouse | BICC journal path, source filtering | BICC | Journal-source filter | Unowned | Slow resolution | `[CO:03 §4]` |

## Named controls (SOX-relevant)
Oracle re-derivation + CVRs at requisition · spend approval matrix · invoice tolerances and holds · non-PO >5K hold · payment approval in Oracle (Kyriba auto-approve) · Treasury manual release for urgent payments · three-party sign-off for new payment methods · journal approval by category, frozen Allocations, posting-locked accounts · ARCS auto-certification rule (±5,000 USD or zero-diff + zero-activity) · ARCS unmapped-accounts cycle · FCCS Task Manager (FPC07/FPC08), approval unit locking · FCCS job console export for SOX evidence · quarterly UARs · SoD analysis · reopen procedure. `[CO:02, 03]`
