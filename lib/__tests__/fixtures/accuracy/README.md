# Accuracy Fixtures (A/B/C/D)

This folder contains baseline fixtures for accuracy gates.

## Files
- `group-a.json` — High confidence models (hard CI fail)
- `group-b.json` — Operational models (soft report)
- `group-c.json` — Approximate models (soft report / trend)
- `group-d.json` — Advisory models (warning-first)

## Schema
Each fixture file follows this shape:

```json
{
  "group": "A|B|C|D",
  "description": "string",
  "policy": {
    "gate": "hard-fail|soft-report|advisory",
    "maxDriftPct": 0.1,
    "warnAbovePct": 10,
    "failAbovePct": 15
  },
  "cases": [
    {
      "id": "unique-case-id",
      "metric": "human-readable metric",
      "module": "module-name",
      "function": "function-name",
      "input": { "...": "..." },
      "expected": { "value": 0, "unit": "..." },
      "tolerance": { "type": "percent|absolute", "value": 0 }
    }
  ]
}
```

## Notes
- Values are starter baselines and should be calibrated against validated references.
- Group A should remain strict with hard-fail in CI.
- Groups B/C/D are expected to use report-first rollout before strict enforcement.

## Group A Freeze Policy
- Group A fixtures represent Golden Records and are treated as frozen baselines.
- CI must fail when a Group A case drifts above case tolerance OR `policy.maxDriftPct`.
- Update Group A expected values only with explicit engineering sign-off and source references.

## Soft Gate Policy (B/C/D)
- Runner evaluates `warnAbovePct` and `failAbovePct` for non-critical groups.
- Soft gates never fail CI in current phase, but are reported as severity counters in logs.
