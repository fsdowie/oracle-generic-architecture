---
id: INS-ALLOC
type: process
title: Statutory allocations (class, state, product, channel) — Insurer
as_of: 2022-02
links: [INS-CLOSE, INS-R2R, INS-DASH]
---

# Statutory allocations

The map's **Allocations** tab draws this. It shows how the Mutual's management P&L becomes a statutory P&L by class, state, line of business and sales channel. Most of the work runs in the **Financials Essbase cube**, after the GL close.

Evidence:
- `[CO:INS-ALLOC]` the allocation methodology (dated 5.1.2021, file 1.1.2022).
- `[CO:INS-ALLOC-CALC]` the class, state, product and channel calc scripts (FY22 February copies).
- `[CO:INS-ALLOC-RATES]` the rate calc, push and check workbooks (2021–2022).
- `[CO:INS-FIN-CUBE]` the Financials cube application workbook.
- `[CO:INS-ALLOC-PL]` the 2021 allocated vs unallocated P&L.

## The four stages
| Stage | What happens | Where | Evidence |
|---|---|---|---|
| 1 Direct coding | Premium, losses, commissions and some expenses (for example reports & surveys) are coded with product, state or channel at entry, in Payables or in Exceed journals through the financial integrator | AP, Exceed → GL | `[CO:INS-ALLOC]` |
| 2 Accounting | Variable expenses without state, product or channel are re-coded with GWP allocation journals: WA premium taxes, OR business taxes, direct agent commissions (from payroll, coded at the accrual from the new & renewal commissions and GWP by channel report), contingent commissions | Fusion GL, month end | `[CO:INS-ALLOC]` |
| 3 Financial system allocation | Whatever still has no class, state, product or channel after the close is allocated in the cube: class by time study and direct accounts; state and product by current-month GWP; channel by new & renewal GWP | Financials cube | `[CO:INS-ALLOC]` `[CO:INS-ALLOC-CALC]` |
| 4 Premium and loss channel | Premium and losses get a channel when they load into Planning: contract-type rates from Exceed premium reporting, losses incurred % by contract type from the monthly claims statistics | Planning load | `[CO:INS-ALLOC]` |

The GL's own Calculation Manager allocations are a separate, smaller set: payroll by state and shared-services billing (see the close-process doc). The statutory dimensions are kept in the cube only.

## The cube
- BSO cube with a unique outline. Missing values aggregate, and blocks are created on equations. Time and Account are dense; View, Department, Product, State, Class, Years, Scenario and Version are sparse `[CO:INS-FIN-CUBE]`.
- **View** holds the allocations. `BU10000` is the Management View and `BU20000` is the Agency; each step writes its own member, `ALLOC` to `ALLOC10`, plus `AllocAdj`, `AllocAdj2` and `Rounding` `[CO:INS-FIN-CUBE]`.
- Subtotals chain the steps `[CO:INS-FIN-CUBE]`:
  - `Statutory 1` = BU10000 + ALLOC
  - `Statutory 2` = + ALLOC2
  - `Statutory 3` = + ALLOC3 + ALLOC4
  - `Statutory 4` = + ALLOC5
  - `Statutory (Allocated) View` = everything
- Holding members: `No Class`, `No State`, `No Product`, `NO_DEPT`, and the `No Sales Channel Specific` roll-up `[CO:INS-FIN-CUBE]`.
- Class members: `Class_60` LAE, `Class_70` acquisition, `Class_80` underwriting, `Class_90` investment `[CO:INS-FIN-CUBE]`.
- Rate accounts: Class, Product, State, Sales Channel, Marketing to Direct/Digital, and CSD to Community Agent allocation rates; the premium and loss allocation rates; and the to-be-allocated (`TBAlloc`) premium and loss accounts `[CO:INS-FIN-CUBE]`.
- In December 2021 (year to date), 75% of other insurance expense sat on No Product before allocation. The underwriting result is the same before and after, to within $2 of rounding `[CO:INS-ALLOC-PL]`.

## Calc scripts (run in this order)
Every script has the fixed point of view `Actual · FY22 · Feb · Final` and acts on other insurance expense `[CO:INS-ALLOC-CALC]`.

1. **Class, ALLOC.** These accounts go 100% to `Class_80`, offset on No Class, for the underwriting departments:
   - advertising 730100–730450
   - reports & surveys 740100
   - political and sponsorship 750100–750300
   - boards & bureaus 761150
   - regulatory fees 616150
   - licenses, interest and taxes 770100–770300
2. **Class, ALLOC2.** `Statutory 1 → No Class × Class Allocation Rates` (on BU10000 · No Product · No State), offset on No Class.
3. **State, ALLOC3 and ALLOC4.** `Statutory 2 → No State × State Allocation Rates` goes to WA, OR, ID and SC; ALLOC4 reverses No State. Directly coded items are left out:
   - commissions on D1420 and D1440
   - 616100 and 616150 on D9998
   - 740100 on D1110, D1210 and D1220
   - 749150 on D3120
   - 770250 and 770255 on D9998
4. **Product, ALLOC5.** `Statutory 3 → No Product × Product Allocation Rates`, offset on No Product on the same member. The exclusions are the same as for state.
5. **Channel, ALLOC6 to ALLOC10.**
   - ALLOC6 reverses Statutory 4 out of every underwriting department except D1420, D1430, D1440, D1510, D1410, D1520, D1530, D3350 and D1310, which builds the overhead pool.
   - ALLOC7 = `(ALLOC6 → Total Underwriting) × Sales Channel Rates × −1` spreads the pool to the channel departments.
   - ALLOC8 sends marketing (D1310) to direct and digital by the GWP split, reversed on D1310.
   - ALLOC9 sends customer service × the CSD rate (25%) to the community agents (D1440).
   - ALLOC10 credits the same amount to D1510.

## Rates
| Rate | Basis | 2021 example | Evidence |
|---|---|---|---|
| Class | Department time study, flat all year | IT 13/38/49 (LAE/ACQ/UDW); claims 100 LAE; sales and marketing 100 ACQ; customer service 19/1/80; accounting and FP&A 14/8/78; pricing 28/12/60; executive, HR, legal, audit and facilities 42/26/32; investments 100 INV | `[CO:INS-ALLOC-RATES]` |
| State | State GWP ÷ product GWP; Washington = 1 − the others | January: auto WA 88.6 / OR 11.4; home WA 92.4 / OR 7.6; ID and SC 0 | `[CO:INS-ALLOC-RATES]` |
| Product | Product GWP ÷ total GWP, by state and in total | January: auto 70.2, home 23.3, dwelling 2.4, umbrella 2.1 | `[CO:INS-ALLOC-RATES]` |
| Sales channel | New & renewal GWP by channel, by product and state; house support = 1 − the others | January, WA auto: house support 56, community agents about 39, direct agents 2.5, digital 2.6 | `[CO:INS-ALLOC-RATES]` |
| Marketing | Direct vs digital GWP | WA about 96/4; OR about 85/15 | `[CO:INS-ALLOC-RATES]` |
| CSD to community agent | Fixed share for work done for the community agents | 25% | `[CO:INS-ALLOC]` |

Rates are worked out in Smart View calc sheets from cube GWP and submitted with push sheets. A master check workbook lists every View member by month `[CO:INS-ALLOC-RATES]`.

## Channels
- There are four sales channels: community agents (D1440), direct agents (D1420 and D1430, plus sales management), house support (customer service) and digital (D2410) `[CO:INS-FIN-CUBE]`.
- Direct agents + house support = the direct channel; adding digital gives the total direct channel `[CO:INS-ALLOC]`.
- Sales channels keep their own expense and receive a share of the overhead pool. Digital doesn't keep IT department costs and receives only its pool share `[CO:INS-ALLOC]`.
- The overhead departments are IT, finance, HR, enterprise services, facilities, product, underwriting, claims, customer experience, legal, internal audit, government affairs, and the corporate and executive departments `[CO:INS-ALLOC]`.

## Findings
- **Fixed period in every script.** The scripts have to be edited every month `[CO:INS-ALLOC-CALC]`.
- **Rates built by hand.** They are calculated in Excel and pushed back to the cube, with no recorded sign-off. Months not yet closed show #DIV/0! `[CO:INS-ALLOC-RATES]`.
- **No CLEARDATA before writing.** Values written by a previous run stay on combinations that no longer have a source `[INFERRED]`.
- **Possible defect in the state script.** The saved copy multiplies by `"State Allocation Rates"-"BU10000"`, a minus where `->` is expected. Confirm against the deployed rule `[CO:INS-ALLOC-CALC]`.
- **Customer-service credit on one department.** The methodology says D1510, D1530 and D1410 give 25%; the script books the whole credit on D1510. Channel totals are right, department detail isn't `[CO:INS-ALLOC]` `[CO:INS-ALLOC-CALC]`.
- **Methodology out of date.** It still describes loading PeopleSoft financials, although Fusion GL went live in January 2021, and the class time study isn't dated `[CO:INS-ALLOC]`.

## Target
All `[INFERRED]`.
- Take the period from substitution variables or runtime prompts, and run the four scripts as one ordered ruleset.
- Calculate the GWP rates in the cube from the new & renewal GWP accounts. Keep the workbook as a signed-off review.
- Run one job: clear, allocate, then the zero-sum check as a validation report. Keep the job log as evidence.
- Fix the two script defects. Put the scripts, rate sources and time study under change control, with the run date and approver each month.
- Refresh the methodology every year. Decide whether the statutory dimensions stay in the cube or also post to a statutory ledger. Planning business rules (Calculation Manager) with runtime prompts are one option.
