# Handoff Payload Reference

> Cross-session state transfer protocol for HiveFiver V2 auto-continuation.
> Last updated: 2026-03-01

---

## Purpose

HiveFiver uses `STATE.md` as the cross-session state bus. When context overflows
or the user requests a fresh session, `session-continue.sh` writes a **handoff
payload** and composes a self-contained prompt for the new session.

The new session has **zero memory** of the previous session. The handoff payload
+ STATE.md must be sufficient to continue without any prior conversation.

---

## Handoff File Location

```
.hivemind/hive-modules/hivefiver-v2/handoffs/
  handoff-YYYYMMDD-HHMMSS.md   ← timestamped per session
  handoff-20260301-143022.md
  handoff-20260301-151847.md
  ...
```

The most recent file is used by `session-continue.sh` as prior context.

---

## Handoff File Format

```markdown
# HiveFiver Handoff Payload

**Created**: 2026-03-01T14:30:22Z
**Stage**: build
**Completed**: audit,architect
**Target**: Audit+improve research/synthesis ecosystem
**Last Gate**: Phase 3→4: PASS
**Session Title**: hivefiver:auto:build:2026-03-01T14:30:22Z

## Summary

[What was accomplished in the ending session — 3-5 sentences max]

## Blockers (if any)

[Any unresolved blockers the new session must handle first]

## Evidence Collected

[Key evidence from this session: script outputs, file paths, gate results]

## Next Steps Written to New Session

[The Phase-specific instructions passed in the auto-prompt]
```

---

## What the New Session Prompt MUST Contain

The composed prompt from `session-continue.sh` is self-contained. It must include:

| Section | Required | Purpose |
|---------|----------|---------|
| Skill loading directives | ✅ | Load hivefiver-mode + hivefiver-coordination first |
| Current stage | ✅ | What stage we're in |
| Completed stages | ✅ | What is already done (don't redo) |
| Pipeline target | ✅ | What we're building overall |
| Last gate result | ✅ | Whether prior work passed quality gates |
| Phase continuation instructions | ✅ | Exactly what to build/do next |
| Prior handoff context | ✅ | Latest handoff file content |
| Scope boundaries | ✅ | What is/isn't allowed to touch |
| Quality gate requirement | ✅ | What to verify before claiming done |

Missing any of these = context-incomplete session = drift risk.

---

## Session Lifecycle with Auto-Continue

```
Session 1 (manual start)
  └─ User: /hivefiver build
  └─ HiveFiver executes build work
  └─ Context approaching limit
  └─ HiveFiver runs: session-continue.sh --exec .
        ↓ writes handoff-TIMESTAMP.md
        ↓ composes self-contained prompt
        ↓ runs: opencode run --agent hivefiver --title "hivefiver:auto:build:..." "..."
              ↓
Session 2 (auto-created)
  └─ Loads: hivefiver-mode + hivefiver-coordination
  └─ Reads: STATE.md (current_stage=build)
  └─ Reads: latest handoff file
  └─ Continues: Phase 4 build from exact next step
  └─ Context approaching limit again
  └─ HiveFiver runs: session-continue.sh --exec .
              ↓
Session 3 (auto-created)
  └─ [continues...]
```

---

## When to Trigger Auto-Continue

HiveFiver SHOULD auto-create a new session when ANY of these are true:

| Trigger | Check | Action |
|---------|-------|--------|
| Context > 70% | Heuristic: more than ~40 turns | session-continue.sh --exec |
| Stage transition | State changes from X to Y | session-continue.sh --exec |
| User says "continue" | Intent classification | /hivefiver-continue --exec |
| User says "new session" | Intent classification | /hivefiver-continue --exec |
| Build phase complete | pipeline_active = false | session-continue.sh (new target) |

---

## Handoff Anti-Patterns

| Anti-Pattern | Why Bad | Fix |
|--------------|---------|-----|
| Prompt references prior conversation | New session has no history | Make prompt fully self-contained |
| Handoff missing completed stages | New session redoes work | Always include completed_stages |
| No scope boundaries in prompt | New session may touch src/** | Always include scope section |
| No quality gate in prompt | New session claims done without checking | Always include gate requirement |
| Prompt > 4000 tokens | Eats context budget | Summarize, link to STATE.md |

---

## CLI Usage

```bash
# Output the opencode run command (review before running)
bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh .

# Execute immediately (spawn new session now)
bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --exec .

# Inspect the composed prompt only
bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --prompt .

# Machine-parseable JSON output
bash .opencode/skills/hivefiver-coordination/scripts/session-continue.sh --json .
```

---

## Integration Points

| Component | Integration |
|-----------|-------------|
| `session-continue.sh` | Script that reads state, writes handoff, composes prompt |
| `state-update.sh` | Provides read interface to Pipeline State |
| `route-stage.sh` | Maps current_stage to correct command |
| `/hivefiver-continue` | Command entry point (user-facing) |
| `hivefiver.md` (router) | Auto-offers continue when context is near limit |
| `hivefiver-build.md` | Should call session-continue.sh at build completion |

---

## State Machine

```
pipeline_active=true  → session-continue.sh outputs run command
pipeline_active=false → session-continue.sh reports "no active pipeline"
                        user must /hivefiver start to begin new target
```
