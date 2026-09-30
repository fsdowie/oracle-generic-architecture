---
id: GOV-FRAMEWORK
type: governance
name: Finance Systems Planning Framework — how change enters the architecture
author_of_framework: the FTG Director (Director, Finance Technology Group)
jira_projects: [ITE (initiatives), FIN (the implementation project), FSYS (Finance Systems)]
as_of: 2026-09-29
source: finance-system-planning-framework/_portable (bnz-ticket skill, memory rules), FIN-24137 / 24248 / 25032 / 24573 artefacts
---

# Delivery Governance Layer

The architecture changes only through this framework. An agent reasoning about "how would we change X" must route through it.

## Hierarchy `[CO:bnz-ticket SKILL §Framework reference]`
| Level | Jira type | Created | Represents |
|---|---|---|---|
| 1 | Initiative (ITE) | Semi-annual planning | Business goal + high-level plan |
| 2 | Epic | Initiative kickoff | A project delivering on ≥1 initiative (standalone allowed with full Business Case) |
| 3 | Story | Sprint/project planning | A capability/deliverable; projects use the **ARD** (Analysis, Requirements & Design) + **BTD** (Build, Test & Deploy) pair, both created at kickoff |
| 4 | Bug / Request | As received | KTLO — email to `<team-alias>` / `<team-alias>`, medium priority by default, L1 triage |

## Required sections
- **Epic:** header (Linked Initiative, Project Lead, Target Delivery, Status ∈ Planning/In Progress/On Hold/Complete), Project Overview, Business Case, Scope (in/out), Objectives & Success Criteria, Approach, Milestones (Kickoff, Phase Gate, UAT Start, Go-Live, Hypercare End), Project Team (Finance Systems / Business / External), Dependencies, Risks & Assumptions.
- **Story:** header (Linked Epic, Story Type, Assignee, Target Sprint, Status), Description, Acceptance Criteria, Dependencies, Partner Team Intakes, Closure Summary (What was delivered + Deliverable Links).
- ARD default AC: requirements signed off by business; process design approved; technical design documented; UAT plan drafted; no open design decisions. BTD default AC: build per design; unit test; UAT signed off; deployed to prod; hypercare plan; documentation updated.
- Native FIN Epic fields: Planned Start `customfield_27101`, Planned End `customfield_27102`, Quarter `customfield_27103`, Project RAG `customfield_26628`, Module `customfield_42405`, Size `customfield_27000`, Team `customfield_11700`, Current Status `customfield_27310`. `[CO:FIN-24137 review]`

## Lifecycle rules
- On assignment: comment to reporter confirming start, their involvement, timing.
- During: progress comments titled **"Update for this ticket"**; no long silences.
- Closure: ARD closes on sign-off of all deliverables; BTD closes on **production deploy**; post-go-live issues become bugs/requests.
- Partner intakes (e.g. BizTech Integrations for OIC changes) raised **early**, before detailed specs, with ticket and status recorded.

## Sprint, KTLO and capacity
Monthly sprints ending last Friday, named `Month YYYY`; one sprint lead each for P2P, R2R and ReconArt. Grooming decides *in sprint* vs *committed to close*; incomplete stories carry forward. Priority: critical/high bugs & requests → committed stories. Capacity ≈ 20% overhead, 20% KTLO, 15% planned non-initiative, **45% initiative delivery**; unplanned work needs a swap or partner funding.

## Accountability split
Finance Systems does **not operate** what it builds. Business partners own outcome OKRs for business-outcome initiatives; Finance Systems owns platform-initiative outcomes and delivery OKRs always.

## Content bar (reviewer of record: the FTG Director) — six tests
1. Explicit definition of done. 2. Deliverables are physical artefacts (functional spec, query, signed design, config change, test evidence). 3. Quantified problem with a baseline (and a kill criterion if the gain is marginal). 4. External business sign-off; reporter = business approver (FTG-only closure is not sign-off). 5. Evidence and a visible trail (pick-up test). 6. Analysis before solution, in sequence (ARD signed off before BTD planned).

## Requirements-register pattern (FIN-24137 exemplar)
Epic holds outcome and scope boundary; a register holds per-ER business requirement, baseline, requester, per-team dated sign-off (AP, Tax, Treasury), disposition; a *Parked & Out of Scope* tab with revisit triggers; two-stage sign-off (requirement, then design on the Story); conflicting answers are **not averaged** — joint decision recorded.

## Architecture-relevant consequence
Every change to an integration (INT###) is a **partner dependency** on BizTech Finance Integrations; every Oracle configuration change needs business sign-off before production; every "Oracle can't do X" must be release-stamped (e.g. "as of 26C") and, where material, confirmed via Oracle Support.
