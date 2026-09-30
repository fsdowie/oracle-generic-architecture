---
id: OPS-RHYTHM
type: schedule
as_of: 2026-09-29
note: times as documented; INT826 corrected per USER
---

# Operating Rhythm (the architecture's clock)

| Cadence | Time | Job | Owner | Evidence |
|---|---|---|---|---|
| Continuous | — | Zip intake/workflow; approved reqs → Oracle via OIC | Zip / OIC | `[CO:01 §6]` |
| Continuous | — | INT828A/B observability | BizTech | `[CO:02 §6]` |
| Hourly | — | INT955 Kyriba acks/rejections; daily rejection summary email | OIC | `[CO:01 §6]` |
| Daily | 00:00 UTC | INT992 IC balancing (19500) | FTG | `[CO:03 §5]` |
| Daily | ~01:00 US Eastern | INT826 payment-terms exceptions | OIC | `[USER:2026-09-29]` `[DATA]` |
| Daily | 5–7 h window | Platform accounting run | FTG | `[CO:03 §5]` |
| Daily | 06:00 PT | `gaap_reval_upload_to_arcs` | FTG | `[CO:03 §5]` |
| Daily | — | INT819/INT820 bank statements; INT156 rates `[INFERRED daily]` | OIC | `[CO:02 §6]` |
| Monthly | 1st | Invoice tolerance recalculation from 1st-of-month corporate rate | FTG `[UNVERIFIED owner]` | `[CO:02 §5]` |
| Monthly | 4th | ReconArt bank balances → ARCS | Automated | `[CO:03 §5]` |
| Monthly | ~6th | ReconArt unmatched → ARCS | On request | same |
| Monthly | Day 0–1 | ARCS unmapped-accounts cycle | FTG + business | same |
| Monthly | 25th | Open FCCS periods; create SOX/close task templates | FTG | same |
| Monthly | 26th → 1st | FCCS load DAG; rates DAG 17:00 UTC | FTG | same |
| Monthly | Post-Opex close | DAG pause → ad hoc loads → Consolidate/Translate → close | Consolidation + FTG | same |
| Monthly | Last Friday | Sprint end (sprints named `Month YYYY`) | FTG | `[CO:bnz-ticket SKILL]` |
| Monthly | — | FAH unaccounted exceptions review | FTG | `[CO:03 §3.2]` |
| Quarterly | — | ARCS/FCCS user access reviews | FTG + business | `[CO:03 §5]` |
| Quarterly | — | TP / split-statistic revisions | Tax/TP + FTG | same |
| Quarterly | — | Oracle release uptake (26A/26B/26C…) assessed per feature (applicability, owner, timing) | FTG | `[CO:01 §6]` |
| Annual | — | SOX risk assessment → ARCS rules document | FTG + SOX | `[CO:03 §3.5]` |
| Semi-annual | — | Initiative planning (Level 1) | Leadership | `[CO:bnz-ticket SKILL]` |
