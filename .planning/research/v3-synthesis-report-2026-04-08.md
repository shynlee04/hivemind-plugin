# HiveMind V3 — Research Synthesis Report

**Date**: 2026-04-08
**Phase**: 1 (Research & Synthesis)
**Sources**: OMO (oh-my-openagent), opencode-pty, opencode-conductor
**Status**: COMPLETE — ready for Phase 2

---

## Executive Summary

Three external codebases were investigated to inform HiveMind V3's runtime architecture. The key finding is that **OMO provides the most directly applicable patterns** for our core needs: background agent management, session continuity, and hook-based orchestration. opencode-pty fills the gap for arbitrary shell process execution (which HiveMind currently lacks). opencode-conductor contributes lifecycle artifact structure and verification protocols but is fundamentally single-track and sequential — not applicable to our concurrency/delegation model.

The 10 actionable patterns from OMO (TaskStateManager, spawn reservations, dual-signal completion, compaction checkpoints, hook factories, structured notifications, circuit breaker, ralph-loop-as-hook, subagent registry, model fallback chains) form the backbone of Phases 3-5 implementation.

---

## Key Findings

### 1. Background Agent Architecture (from OMO)

**Claim**: OMO's `BackgroundManager` is the single source of truth for all background task state, consolidating what HiveMind currently splits across `state.ts`, `continuity.ts`, and `lifecycle-manager.ts`.

**Evidence**: Direct — source code at `src/features/background-agent/manager.ts`
**Confidence**: High

**Implication**: Refactor `state.ts` to add a `TaskStateManager` class that owns all task-related Maps. This is a Phase 3 task.

### 2. Spawn Reservation System (from OMO)

**Claim**: OMO uses atomic reserve/rollback to prevent race conditions when multiple agents spawn subagents simultaneously.

**Evidence**: Direct — `src/features/background-agent/subagent-spawn-limits.ts`
**Confidence**: High

**Implication**: Add `reserveSubagentSpawn(parentSessionID)` to `concurrency.ts`. Low effort, high impact. Phase 3.

### 3. Dual-Signal Completion Detection (from OMO)

**Claim**: OMO requires BOTH session idle event AND stability window (message count unchanged for 10s across 3+ polls at 3s intervals) before marking complete.

**Evidence**: Direct — `src/features/background-agent/constants.ts`, `AGENTS.md`
**Confidence**: High

**Implication**: HiveMind's `completion-detector.ts` already does two-signal detection. Verify it matches OMO's approach and add stability window if missing. Phase 3.

### 4. Compaction Checkpoint System (from OMO)

**Claim**: OMO checkpoints agent/model/tools config BEFORE context compaction and re-injects it AFTER via a hook. This prevents lost agent metadata.

**Evidence**: Direct — `src/shared/compaction-agent-config-checkpoint.ts`
**Confidence**: High

**Implication**: Add `compaction-checkpoint.ts` module + hook in `plugin.ts`. Phase 4 (session recovery feature).

### 5. Hook Factory Pattern (from OMO)

**Claim**: OMO organizes hooks into three factory functions: `createCoreHooks()`, `createSessionHooks()`, `createToolGuardHooks()`, each conditionally enabled via `isHookEnabled` predicate.

**Evidence**: Direct — `src/plugin/hooks/create-core-hooks.ts`, `create-session-hooks.ts`
**Confidence**: High

**Implication**: Refactor `plugin.ts` to use factory pattern. 25+ hooks in OMO vs. our current inline registration. Phase 3.

### 6. PTY-Based Process Execution (from opencode-pty)

**Claim**: HiveMind currently only manages OpenCode sessions (LLM interactions), not arbitrary shell processes. opencode-pty provides a complete PTY execution model with RingBuffer, exit notifications, and permission checking.

**Evidence**: Direct — opencode-pty source code, tmux source for comparison
**Confidence**: High

**Implication**: For Phase 4a (Background Agents), we have two paths:
- **Path A**: Use `node-pty` for true PTY support (interactive programs, Ctrl+C, etc.)
- **Path B**: Use `child_process.spawn` with `stdio: 'pipe'` for non-interactive processes (simpler, no native deps)

**Recommendation**: Start with Path B (non-interactive) for Phase 4a. Add Path A later if interactive process support is needed. The `@tmux/` directory referenced in the original plan does NOT exist — the `./tmux/` directory is the tmux source repo, not a project-specific background execution directory.

### 7. Lifecycle Artifact Structure (from opencode-conductor)

**Claim**: Conductor's track system (spec → plan → implement → verify → checkpoint) provides a durable wire format for delegation packets.

**Evidence**: Direct — Conductor's `tracks/<id>/` directory structure
**Confidence**: High

**Implication**: HiveMind's delegation packets could adopt Conductor's artifact structure (`spec.md`, `plan.md`, `metadata.json`) as the wire format, making delegation durable across session restarts. This maps to our `continuity.ts` JSON store. Phase 4d (task queuing).

### 8. Workflow-as-Configuration (from opencode-conductor)

**Claim**: Conductor reads `workflow.md` at runtime to determine execution behavior (TDD vs. non-TDD, commit frequency, checkpoint protocols). This externalizes lifecycle behavior from code.

**Evidence**: Direct — `implement.toml` delegates to `workflow.md`
**Confidence**: High

**Implication**: Aligns with HiveMind's "zero business logic in the plugin layer" principle. The plugin should orchestrate, not implement. Phase 4b (auto-loop).

### 9. Circuit Breaker — Consecutive Tool-Use Detection (from OMO)

**Claim**: OMO's loop detector tracks tool call signatures (`toolName::JSON(sortedInput)`) and triggers when the same tool+input is called N times consecutively. This is smarter than HiveMind's simple `MAX_TOOL_CALLS_PER_SESSION` counter.

**Evidence**: Direct — `src/features/background-agent/loop-detector.ts`
**Confidence**: High

**Implication**: Replace current circuit breaker with signature-based detection. Phase 3.

### 10. Model Resolution with Fallback Chains (from OMO)

**Claim**: Each agent type has model requirements with fallback chains (agent override → category fallback → default chain). This ensures delegation works even when the primary model is unavailable.

**Evidence**: Direct — `src/tools/call-omo-agent/tools.ts`, `src/shared/model-requirements.ts`
**Confidence**: High

**Implication**: Add model requirements per category to `types.ts`. Phase 4e (category system).

---

## Contradictions & Resolutions

| Contradiction | Resolution |
|---------------|------------|
| Plan says `@tmux/` directory is "ready" | **Does not exist**. `./tmux/` is the tmux source repo (C code, logos). Background execution needs alternative approach (node-pty or child_process). |
| Plan says 5 pre-existing typecheck errors | **0 errors** after `npm install`. The nested SDK version conflict was resolved by dependency update. |
| Plan says "background agents don't exist yet" | **Partially true**. HiveMind has `sendPrompt()`-based background session spawning but no PTY-based process execution. OMO's BackgroundManager is the model to follow. |
| Plan says "context persistence already implemented" | **True**. `continuity.ts` exists with durable JSON persistence. What's missing is compaction checkpointing and session recovery for edge cases. |

---

## Gaps

| Gap | Reason | Impact |
|-----|--------|--------|
| opencode-background-agents not researched | No standalone repo found — patterns covered by OMO | Low |
| opencode-supermemory not researched | Lower priority (MEDIUM) | Low |
| opencode-dynamic-context-pruning not researched | Lower priority (MEDIUM) | Low |
| opencode-workspace not researched | Lower priority (MEDIUM) | Low |
| micode not researched | Lower priority (MEDIUM) | Low |

These can be researched later if needed during Phase 4 implementation.

---

## Recommendations — Phase-by-Phase

### Phase 2 (Cleanup) — Proceed as planned
- Delete zombie modules (`agent-registry.ts`, `prompt-enhance.ts`)
- Remove ghost directories (`src/cli/`, `src/kernel/`, `src/harness/hooks/`, `src/harness/tools/`)
- Fix broken package exports (`./plugin` path, `bin.harness`)
- Wire Bug F1 (transition guard) and Bug F3 (feedMessageCount fallback)

### Phase 3 (Core Architecture Fixes) — Enhanced by research
- Add `TaskStateManager` class to `state.ts` (OMO Pattern 6.1)
- Add spawn reservation system to `concurrency.ts` (OMO Pattern 6.2)
- Verify/enhance dual-signal completion detection (OMO Pattern 6.3)
- Replace circuit breaker with signature-based loop detector (OMO Pattern 6.7)
- Refactor `plugin.ts` to use hook factory pattern (OMO Pattern 6.5)
- Add `subagentSessions: Set<string>` to `state.ts` (OMO Pattern 6.9)
- Write tests for all 5 untested core modules

### Phase 4 (Runtime Features) — Informed by research
- **4a. Background Agents**: Use OMO's BackgroundManager pattern. For shell processes, start with `child_process.spawn` (Path B), not PTY.
- **4b. Auto-Loop**: Implement as session-tier hook (OMO Pattern 6.8), not standalone module. Use `<promise>DONE</promise>` completion signal.
- **4c. Delegation Chain**: Adopt Conductor's artifact structure as wire format for delegation packets.
- **4d. Task Queuing**: Use OMO's per-key FIFO queue pattern with spawn reservations.
- **4e. Category System**: Add model requirements with fallback chains per category (OMO Pattern 6.10).
- **4f. Session Recovery**: Implement compaction checkpoint system (OMO Pattern 6.4).

### Phase 5 (Integration) — As planned
- End-to-end integration tests
- Plugin verification in OpenCode
- Documentation updates

---

## Source Index

| Source | Type | Key Sections |
|--------|------|--------------|
| `.planning/research/omo-findings.md` | Research | 6 sections, 18 findings, 10 actionable patterns |
| `.planning/research/opencode-pty-findings.md` | Research | 6 sections, 77 source references |
| `.planning/research/opencode-conductor-findings.md` | Research | 6 sections, 280 lines |
| `docs/draft/architecture-proposal-hivemind-v3.md` | Internal | V3 target architecture |
| `AGENTS.md` | Internal | Project rules and structure |
| `src/lib/*.ts` | Internal | Current codebase state |
