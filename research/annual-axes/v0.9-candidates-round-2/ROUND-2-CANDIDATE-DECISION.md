# Annual Axes V0.9 Round-2 Candidate Decision

## A. Base and foundation

- Base master SHA: `41b3c1cbb32069814599aad91813857d5f0175a4`
- Foundation readiness: `READY_FOR_V0_9_CANDIDATE`
- Authorized shape: `SHAPE-AAV09-THIEN-MA-MOVEMENT`
- Authorized star: `Lưu Thiên Mã`
- Production safety: Nam Phái remains Engine 0.8.0; Trung Châu remains 0.2.0; no production route added.

## B. Control verification

- Engine: `0.8.0`
- Formula: `v0.8-annual-palace-weighted-score`
- Score equality: `true`
- Routing equality: `true`
- Fixture equality: `true`

## C. Candidate registry

| Candidate | Domain binding | Point magnitude | Polarity mode | Selectable |
| --------- | -------------- | --------------: | ------------- | ---------: |
| CONTROL-V08 | control | — | — | no |
| V09-TM-CAREER | career | 1 | positive-activation | no |
| V09-TM-CAREER-SOCIAL | career+social | 1 | positive-activation | no |
| V09-TM-PALACE-CONTEXT | career+social | 1 | contextual-activation | no |
| V09-TM-SOCIAL | social | 1 | positive-activation | no |

## D. Corpus split

- Training charts: 80
- Holdout charts: 20
- Years per chart: 12
- Split method: `stable-chart-index-mod` seed 20260719
- Overlap: 0
- Freeze registry hash: `55d98ba44366de7426cdbf92ea81e8acaa9330840f9ec1bc6ed3c2ca38649753`

## E. Training results

### CONTROL-V08
- Failed gates: 8
- Thiên Mã matches: 0
- Mean intra-year SD: 5.918748108756626

### V09-TM-CAREER
- Failed gates: 9
- Thiên Mã matches: 252
- Mean intra-year SD: 5.9244371182453

### V09-TM-CAREER-SOCIAL
- Failed gates: 10
- Thiên Mã matches: 408
- Mean intra-year SD: 5.9338565821561575

### V09-TM-PALACE-CONTEXT
- Failed gates: 10
- Thiên Mã matches: 408
- Mean intra-year SD: 5.9338565821561575

### V09-TM-SOCIAL
- Failed gates: 8
- Thiên Mã matches: 156
- Mean intra-year SD: 5.929084779345222

## F. Holdout results

| Candidate | Mandatory absolute | Failed gates | Selectable |
| --------- | -----------------: | ------------ | ---------: |
| CONTROL-V08 | false | 8 | no |
| V09-TM-CAREER | false | 8 | no |
| V09-TM-CAREER-SOCIAL | false | 8 | no |
| V09-TM-PALACE-CONTEXT | false | 8 | no |
| V09-TM-SOCIAL | false | 8 | no |

## G. Full-corpus gate evaluation

- CONTROL-V08: passed 19, failed 9, improved 0, degraded 0
- V09-TM-CAREER: passed 19, failed 9, improved 0, degraded 0
- V09-TM-CAREER-SOCIAL: passed 18, failed 10, improved 0, degraded 1
- V09-TM-PALACE-CONTEXT: passed 18, failed 10, improved 0, degraded 1
- V09-TM-SOCIAL: passed 19, failed 9, improved 0, degraded 0

## H. Product sanity

- CONTROL-V08: ok=true L1=0 rangeDelta=0 uniformUplift=false issues=none
- V09-TM-CAREER: ok=true L1=0 rangeDelta=0 uniformUplift=false issues=none
- V09-TM-CAREER-SOCIAL: ok=true L1=0 rangeDelta=0 uniformUplift=false issues=none
- V09-TM-PALACE-CONTEXT: ok=true L1=0 rangeDelta=0 uniformUplift=false issues=none
- V09-TM-SOCIAL: ok=true L1=0 rangeDelta=0 uniformUplift=false issues=none

## I. Sensitivity

- Stable parameters: none
- Fragile parameters: pointMagnitude
- Gate reversals: V09-TM-CAREER: failedGateCount 8 vs 9; V09-TM-CAREER-SOCIAL: failedGateCount 8 vs 9; V09-TM-PALACE-CONTEXT: failedGateCount 8 vs 9; V09-TM-SOCIAL: failedGateCount 8 vs 9

## J. Candidate selection

```
selectedCandidateId: null
```

## K. Production decision

```
KEEP_V0_8_PRODUCTION
```

## L. Residual risks

- doctrinal: Thiên Mã numeric magnitude remains engineering-hypothesis
- doctrinal: other 11 emitted annual stars remain interpretive-only
- engineering: absolute 28/28 hard-gate bar is stringent relative to V0.8 baseline failures
- distribution: V0.8 control itself fails multiple spread gates
- holdout: experimental absolute-pass requirement not met by Thiên Mã-only increment
- product: no production routing change in this PR
- technical: Finding 6 scoreState epsilon remains a separate engineering follow-up

## M. Next task

Close Round-2 candidate evaluation and retain V0.8 production
