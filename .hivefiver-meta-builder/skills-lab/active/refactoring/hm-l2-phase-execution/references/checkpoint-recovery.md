# Checkpoint Recovery

## State File

`.planning/phases/${PHASE}/STATE.md`:

```yaml
---
phase: <name>
status: [running | paused | completed]
completed_plans:
  - <plan-id>
incomplete_plans:
  - <plan-id>
last_wave: <number>
---
```

## Recovery

1. Read STATE.md
2. Skip completed plans
3. Re-execute incomplete plans from last_wave
