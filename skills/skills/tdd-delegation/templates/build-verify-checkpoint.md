# Build-Verify Checkpoint

```json
{
  "_meta": {
    "created_at": "",
    "updated_at": ""
  },
  "packet_id": "",
  "tdd_phase": "green | refactor",
  "tests_written": 0,
  "tests_passing": 0,
  "tests_failing": 0,
  "build_output": {
    "tsc": {
      "exit_code": 0,
      "errors": 0,
      "warnings": 0
    },
    "test": {
      "exit_code": 0,
      "passed": 0,
      "failed": 0,
      "skipped": 0
    },
    "build": {
      "exit_code": 0,
      "duration_ms": 0
    }
  },
  "gate_passed": true,
  "evidence_paths": []
}
```

## Field Descriptions

| Field | Description |
|-------|------------|
| `tests_written` | Total tests written across all phases |
| `tests_passing` | Currently passing tests |
| `tests_failing` | Currently failing tests |
| `build_output.tsc` | TypeScript compiler result |
| `build_output.test` | Test suite result |
| `build_output.build` | Build command result |
| `gate_passed` | Whether the test gate passed |
| `evidence_paths` | Paths to detailed output files |
