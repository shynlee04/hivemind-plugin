# Synthesis Gate Result

<!-- _meta: { "created_at": "2026-03-24T00:00:00Z", "updated_at": "2026-03-24T00:00:00Z" } -->

```json
{
  "gate_id": "",
  "loop_id": "",
  "iteration": 0,
  "status": "pass | fail | conditional",
  "checks": {
    "carry_forward_populated": true,
    "coverage_status_updated": true,
    "no_contradictions": true,
    "output_written": true
  },
  "contradictions": [],
  "recommendation": "continue | pause | abort",
  "reason": ""
}
```

## Field Descriptions

| Field | Description |
|-------|------------|
| `gate_id` | Unique identifier for this gate check |
| `loop_id` | The loop this gate belongs to |
| `iteration` | Which iteration this gate evaluated |
| `status` | Gate result: pass, fail, or conditional |
| `checks` | Individual check results |
| `contradictions` | List of contradictions found between iterations |
| `recommendation` | Suggested next action |
| `reason` | Explanation of the recommendation |
