---
artifact_group: roadmap
created: 2026-05-08
evidence_level: L5
---

# Shell / PTY Control-Plane Route

## Route

```text
BOOT-02R governance reconciliation
  -> BOOT-03..BOOT-07 bootstrap/recovery/E2E proof
  -> CP-PTY-00 shell/PTY control-plane spike (parallel docs/spec)
  -> CP-PTY-01 background shell control-plane MVP
  -> f-04 routing foundation if routing invokes command lanes
  -> SC-PTY-01 read-only terminal projection if Q2 sidecar is reaffirmed
```

## Dependency Rules

- CP-PTY-00 may run in parallel with BOOT continuation because it is docs/spec only.
- CP-PTY-01 is blocked on BOOT-07 unless explicitly authorized earlier.
- f-04 routing must not depend on undocumented command lanes.
- Sidecar projection must not mutate canonical state.
