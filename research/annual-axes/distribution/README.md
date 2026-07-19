# Annual Axes distribution research

Engineering audit outputs for the V0.4 annual-delta corrective.

- `corpus-contract.json` — generation parameters (committed after first full audit).
- `baseline-*-annual-axes-audit-full-v0.4.json` — aggregate metrics only (no raw charts).
- `samples/` — tiny hand-checked excerpts if needed.

Do not commit thousands of raw chart payloads.

## Commands

```bash
npm run test:annual-axes-distribution:fast
npm run audit:annual-axes-distribution
```

Profile id `annual-axes-current` scores via the live `analyzeAnnualAxes` entry
(Nam Phái V0.3 head-centric path / Trung Châu V0.2 path). This is the
pre-V0.4 baseline the corrective prompt requires before formula work.
