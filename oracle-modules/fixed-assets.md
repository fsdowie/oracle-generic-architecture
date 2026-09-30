---
id: MOD-FA
type: oracle-module
modules: [Fixed Assets]
workstream: R2R
as_of: 2026-09-29
release: 26C
evidence_gap: No Fixed Assets 26C guide supplied — Oracle-standard claims here are UNVERIFIED unless cited from another guide
---

# Oracle Fixed Assets

## Structural link to P2P
Additions arrive predominantly as **mass additions from Payables**: a capitalisable invoice distribution becomes a candidate asset line. `[CO:03 §3.3]` Oracle: distributions with *Track as Asset* = Y are candidates for transfer to Assets. `[ORA26C:implementing-payables-invoice-to-pay p.137, 154]`

## Books
40+ asset books across corporate (GAAP) and tax (STAT/TAX) book types. `[CO:03 §3.3]` Asset books are security-relevant (data roles generated per book). `[ORA26C:implementing-enterprise-structures-and-general-ledger p.27]`

## Processes `[CO:03 §3.3]`
Mass additions review and post → **asset addition approval workflow** (capitalised assets above threshold route for approval before posting; `REP626` approvals report) → depreciation by book → adjustments, transfers, retirements, reinstatement → parallel corporate and tax depreciation. `REP022` net book value. `INT970` asset updates integration.

## Counter-intuitive configuration
By default every segment of the depreciation expense account derives from the asset **category**. Deriving specific segments from the originating AP distribution requires **Transaction Account Builder** (transaction account definitions/types). `[CO:03 §3.3]`
Verification: the 26C guides supplied describe TAB for Purchasing and Intercompany only; FA usage of TAB could not be confirmed → `[UNVERIFIED]` Q-FA-1.

## Recent change
Asset clearing account migrated `10490` → `14550`; combinations violated CVRs at zero balance during migration. `[CO:03 §3.3]`

## Failure modes
Mass addition rejected/held in approval queue (cost stranded in clearing) · depreciation expense defaults to category when an invoice-segment override was intended · CVR violations at zero balance · SoD findings concentrated in asset setup and depreciation. `[CO:03 §3.3]`

Config record: Fixed Assets Approvals functional design and configuration workbook (in-scope book list by type). `[CO:03 §7]`
