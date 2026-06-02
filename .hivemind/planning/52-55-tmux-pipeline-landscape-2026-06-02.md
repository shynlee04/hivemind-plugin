[LANGUAGE: Write this file in en per Language Governance.]
# Tmux Integration Pipeline: Phases 52-55 Landscape

**Date:** 2026-06-02
**Orchestrator:** hm-l0-orchestrator
**Pipeline:** Sequential (each phase depends on previous)

## Phase Dependency Chain

```
P51 [COMPLETE] → P52 → P53 → P54 → P55
```

## Phase Breakdown

| Phase | Goal | Domain | Specialist | Artifacts Expected |
|-------|------|--------|------------|-------------------|
| **P52** | Wire tmux-copilot + State Query API | Implementation (tmux) | hm-executor | src/tools/tmux-state-query.ts, observer expansion, plugin.ts registration |
| **P53** | Live Pane Monitoring Hook + Journal | Implementation (hooks) | hm-executor | src/hooks/pane-monitor.ts, journal integration, backoff logic |
| **P54** | Session Persistence + Restart-Recovery | Implementation (persistence) | hm-executor | src/features/tmux/persistence.ts, UUIDv7, state transitions |
| **P55** | E2E UAT testing | Quality/Verification | hm-verifier | 4 BATS scenarios, manual screenshots |

## Routing Decision

- **Path:** Coordinated-path (sequential pipeline, each phase depends on previous)
- **Wave pattern:** Pipeline — P52 → verify → P53 → verify → P54 → verify → P55 → verify
- **Delegation tool:** execute-slash-command with `/gsd-autonomous --from N --to N` per phase
- **Reason:** Strict sequential chain; each phase consumes previous phase's output

## Success Metrics
- P52: tsc clean, tmux-state-query tool registered, 5+ vitest + 3 BATS pass
- P53: pane-monitor hook writes journal entries, backoff/cap verified
- P54: persistence module restores sessions on restart
- P55: 3/4 BATS criteria pass minimum

## Quality Gates
- After each phase: verify all tests pass + typecheck clean
- Final gate: E2E UAT (P55) — 3/4 PASS to advance
