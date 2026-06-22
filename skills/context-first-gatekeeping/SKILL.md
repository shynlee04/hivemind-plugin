---
name: context-first-gatekeeping
description: "Enforce mandatory pre-implementation checks in HiveMind sessions — verify trajectory exists via scan_hierarchy, retrieve plans from recall_mems, validate domain boundaries, and check drift before allowing any code changes. Use when starting a new task, resuming interrupted work, after context compaction, or before any implementation action in a HiveMind session."
---

# Context-First Gatekeeping

Blocks implementation until all context gates pass. Runs `scan_hierarchy`, `recall_mems`, `list_anchors`, and `think_back` to confirm the agent has verified planning, an unbroken hierarchy chain, acceptable drift, and valid domain boundaries.

## Gatekeeping Checklist

Run before ANY implementation action — if any check fails, stop and fix before proceeding:

1. **Trajectory exists?** — `scan_hierarchy({ action: "status" })` → if missing, run `declare_intent`
2. **Tactic defined?** — hierarchy must have Level 2 → if missing, run `map_context({ level: "tactic" })`
3. **Plan retrieved?** — `recall_mems({ query: "plan trajectory tactic" })` → must return results, never assume
4. **Anchors loaded?** — `list_anchors()` → load constraints
5. **Chain unbroken?** — `scan_hierarchy` confirms Trajectory → Tactic → Action chain
6. **Drift acceptable?** — `think_back({ mode: "check" })` → must be < 60
7. **Domain boundaries OK?** — files stay within allowed paths for their domain
8. **No pending failures?** — `brain.metrics.failures` is clear

## Domain Boundaries

| Domain | Allowed Paths | Forbidden Paths |
|--------|--------------|-----------------|
| Backend | `src/lib/`, `src/tools/`, `src/schemas/`, `src/hooks/` | `src/dashboard/`, `src/views/` |
| Frontend | `src/dashboard/`, `src/views/`, `src/components/` | `src/lib/`, `src/tools/`, `src/schemas/` |
| Shared | `src/types/`, `src/utils/`, `tests/` | None (can cross) |

Cross-domain changes require explicit user approval.

## Failure Escalation

| Level | Condition | Action |
|-------|-----------|--------|
| Auto-recoverable | Missing tactic, high drift | `map_context` or `think_back({ mode: "full" })` |
| User guidance | No plan found, domain violation | Ask user to confirm plan or approve cross-domain |
| Critical — stop | No trajectory, broken chain | Must `declare_intent` or manually repair hierarchy |

## After Context Compaction

Never trust memory after compaction. Reload everything:

```typescript
think_back({ mode: "full" })
recall_mems({ query: "recent" })
list_anchors()
// Then re-validate hierarchy
```

## Red Flags — Immediate Stop

| Signal | Meaning | Action |
|--------|---------|--------|
| "I think..." | Unverified assumption | Verify with `recall_mems` |
| "Let me just..." | Bypassing gates | Run full checklist |
| "Probably works" | No verification | Run quality gates |
| "I'll fix later" | Broken chain left open | Fix now |

## Integration

This skill runs **first** in the sequential-orchestration pipeline: gatekeeping → sequential-orchestration → export_cycle → map_context.