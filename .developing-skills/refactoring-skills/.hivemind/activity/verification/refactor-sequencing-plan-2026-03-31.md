# Managing-Layer Tool Refactor Sequencing Plan

**Date:** 2026-03-31  
**Planner:** hiveplanner  
**Evidence Base:**
- `.hivemind/activity/verification/code-skeptic-managing-tools-2026-03-31.md`
- `.hivemind/activity/verification/journal-tool-verification-2026-03-31.md`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/verification/trajectory-tool-verification-2026-03-31.md`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/verification/task-tool-verification-2026-03-31.md`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/verification/handoff-tool-verification-2026-03-31.md`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/verification/agent-work-tool-verification-2026-03-31.md`
- `/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/orchestration/synthesis-runtime-tools-architecture-2026-03-31.md`

## Evidence Normalization Note

The code-skeptic report was correct for **this worktree-local** `.hivemind/activity/verification/` directory: only the journal verification report existed locally when skepticism ran. The other four reports were found in the **workspace-root** `.hivemind/activity/verification/`. That means the skepticism about a verification gap remains useful, but the stronger conclusion is: **evidence is split across artifact roots and was gathered on mixed snapshots**. Sequencing must therefore start with a baseline gate, not blind refactor work.

## Tool-by-Tool Recommendations

| Tool | Refactor Option | Rationale | Effort | Impact on Orchestrator |
|---|---|---|---|---|
| `hivemind_journal` | **SUPERSEDE** | Registered but not used by hooks; duplicates `markdown-writer`; divergent path/format; failing write tests; highest phantom-tool risk | MEDIUM | HIGH |
| `hivemind_trajectory` | **FIX** | Real persistence exists, but execute path is unproven and critical actions are untested; also has upward import violation | MEDIUM | HIGH |
| `hivemind_handoff` | **FIX** | Complex coupling hub; tests exist but runtime path usage is thin/no live handoffs; naming/path ambiguity and multi-system dependency risk | HIGH | HIGH |
| `hivemind_task` | **KEEP AS-IS** | Best-verified chain; correct CQRS direction; only minor hygiene gaps; not worth destabilizing early | LOW | MEDIUM |
| `hivemind_agent_work_*` | **KEEP AS-IS** | Create/export are fully verified with real persisted contracts; latest verification says `classify-intent` is intentionally feature-local, so earlier “orphan” conclusion is stale | LOW | HIGH |

### Per-Tool Sequencing, Risks, and Rollback

#### 1. `hivemind_journal` — SUPERSEDE
- **Do first?** Yes. This is the highest conceptual-risk tool and the safest to isolate.
- **Why:** It is a duplicate write path for the same concept, and the real system already writes via hooks + `markdown-writer`.
- **Before touching it:**
  - Confirm the authoritative journaling path is the hook/event-tracker writer.
  - Confirm no external consumer depends on `hivemind_journal` output format.
- **Risk if changed:** Silent loss of assistant/compaction journaling if the wrong writer is removed.
- **Rollback:** Restore plugin/catalog registration and previous file, keep hook writer untouched, and re-run journal write smoke checks.

#### 2. `hivemind_trajectory` — FIX
- **When:** After journal authority is settled.
- **Why:** Handoff records trajectory events; trajectory must be trustworthy before handoff refactors.
- **Before touching it:**
  - Add/refresh execute-level smoke coverage for `inspect`, `attach`, `traverse`, `checkpoint`, `event`, `close`.
  - Snapshot `.hivemind/state/trajectory-ledger.json`.
- **Risk if changed:** Resume/checkpoint history corruption; broken active/closed trajectory transitions.
- **Rollback:** Restore pre-change ledger-compatible code and replay smoke tests against the saved ledger snapshot.

#### 3. `hivemind_handoff` — FIX
- **When:** After trajectory has green execute coverage.
- **Why:** Handoff depends on trajectory events and agent-work chain execution; it is the main cascading-failure hub.
- **Before touching it:**
  - Freeze `hivemind_task` and `hivemind_agent_work_*` contracts.
  - Add/refresh a runtime smoke path that proves `.hivemind/handoffs/` creation and lifecycle persistence.
- **Risk if changed:** Broken delegation continuity, invalid handoff records, partial chain-action dispatch.
- **Rollback:** Restore tool/feature/store trio together and preserve any generated `.hivemind/handoffs/*.json` as rollback evidence.

#### 4. `hivemind_task` — KEEP AS-IS
- **When:** Do not refactor in early phases.
- **Why:** It is already trustworthy enough to serve as the stable task authority while adjacent tools are repaired.
- **Allowed scope now:** Only additive smoke coverage or shared-type migration if required by a broader systemic cleanup.
- **Risk if changed:** Dual-write task state/graph divergence; loss of current task authority baseline.
- **Rollback:** Revert any incidental edits and compare `.hivemind/state/tasks.json` vs `.hivemind/graph/tasks.json` for parity.

#### 5. `hivemind_agent_work_*` — KEEP AS-IS
- **When:** Freeze until journal/trajectory/handoff are stable.
- **Why:** It is central to orchestration continuity and already verified. Current evidence does **not** justify merging it with `hivemind_task` yet.
- **Allowed scope now:** Compatibility verification only; no merge, no supersede, no plugin-surface expansion.
- **Risk if changed:** Broken contract creation/export flows and handoff chain-action regressions.
- **Rollback:** Revert tool files only; preserve existing `.hivemind/agent-work-contract/*.json` records untouched.

## Dependency Graph

### Required Order

1. **Baseline Gate first**
   - Reconcile artifact locations and mixed commit provenance.
   - Capture one authoritative “current state” snapshot before code changes.

2. **Journal authority decision before any journal refactor**
   - Decide whether hooks + `markdown-writer` remain the only writer.
   - Do **not** touch plugin registration until authority is explicit.

3. **Trajectory verification before handoff refactor**
   - Handoff emits trajectory events.
   - Therefore trajectory execute coverage must be green before handoff logic is changed.

4. **Handoff stabilization before any task/agent-work boundary work**
   - Handoff already touches delegation, trajectory, workflow continuity, and agent-work chain execution.
   - Do not widen the blast radius by changing orchestration authorities first.

5. **Task and agent-work boundary review last**
   - Keep both stable while repairing higher-risk dependencies.
   - Any merge/supersede decision here requires an architecture gate, not a refactor-first move.

### Parallel-Safe Work

- **Parallel-safe in Phase 1:**
  - Evidence normalization/documentation
  - Journal consumer audit
  - Trajectory smoke-test design
  - Handoff smoke-test design

- **Not parallel-safe:**
  - Trajectory structural fixes and handoff logic fixes
  - Any changes touching plugin registration/catalog + shared type locations
  - Any task/agent-work authority changes

### Phase Gates

| Gate | Must Pass Before Moving On |
|---|---|
| **Baseline Gate** | One reconciled evidence set exists; current behavior snapshot captured; no open ambiguity about where the truth artifacts live |
| **Journal Gate** | One authoritative journaling path chosen; no dual-write path remains active or planned |
| **Trajectory Gate** | Execute-path coverage proves ledger read/write lifecycle for critical actions without schema drift |
| **Handoff Gate** | Runtime smoke path proves create → validate → close lifecycle and durable `.hivemind/handoffs/` persistence |
| **Architecture Gate** | Explicit decision on whether task and agent-work remain separate authorities |

## Phase 1: Quick Wins (1-2 days)

### Objectives
1. **Normalize the evidence set**
   - Consolidate/cross-reference the split root/worktree verification artifacts.
   - Record that the skeptic gap was a pathing problem plus mixed-snapshot problem.

2. **Freeze authority boundaries**
   - Mark `hivemind_task` and `hivemind_agent_work_*` as “no structural changes” for this cycle.
   - Reject premature merge proposals until later architecture review.

3. **Decide journal authority**
   - Default recommendation: hooks + `markdown-writer` stay authoritative.
   - `hivemind_journal` moves to deprecation/supersede path, not repair-first path.

4. **Add safety nets before surgery**
   - Define execute-level smoke tests for trajectory and handoff.
   - Capture current ledger/handoff directory behavior before changing logic.

### Gate
- Baseline Gate + Journal Gate both pass.

## Phase 2: Critical Fixes (1 week)

### Objectives
1. **Supersede `hivemind_journal`**
   - Remove ambiguity: either de-register it or convert it into a thin adapter to the authoritative writer.
   - Do not keep two competing journey-event formats.

2. **Fix `hivemind_trajectory`**
   - Close execute-path coverage gaps.
   - Repair upward-import/shared-type ownership without changing ledger semantics.

3. **Fix `hivemind_handoff`**
   - Add/verify runtime lifecycle persistence.
   - Reduce path/name ambiguity and harden failure handling around cross-system dependencies.

4. **Protect stable authorities**
   - Keep `hivemind_task` and `hivemind_agent_work_*` untouched except for compatibility verification.

### Gate
- Journal supersession complete.
- Trajectory Gate green.
- Handoff Gate green.
- No regressions in stable task/contract flows.

## Phase 3: Nice to Have (when time permits)

### Objectives
1. **Systemic hygiene cleanup**
   - Apply shared-type/upward-import cleanup to `hivemind_task` only if the pattern is already proven safe in trajectory/handoff.
   - Remove low-value issues such as redundant `async` only after higher-risk work is done.

2. **Architecture review: task vs agent-work**
   - Decide whether they remain separate authorities or need explicit boundaries documented.
   - Current recommendation: **keep separate unless an ADR proves overlap is harmful in production**.

3. **Artifact path cleanup**
   - Prevent future “missing report” skepticism caused by root/worktree artifact splits.

### Gate
- Architecture Gate passes.
- No new authority overlap introduced.

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Split verification artifacts create false planning inputs | HIGH | HIGH | Baseline Gate before any refactor |
| Journal supersession removes the wrong writer | MEDIUM | HIGH | Authority decision first; keep hook writer unchanged until verified |
| Trajectory fix corrupts ledger/resume flow | MEDIUM | HIGH | Snapshot ledger, test against real ledger behavior, keep schema stable |
| Handoff fix causes cascading delegation/trajectory/contract failures | MEDIUM | HIGH | Sequence after trajectory; preserve agent-work/task as frozen authorities |
| Task/agent-work merge is attempted too early | MEDIUM | HIGH | Architecture Gate required; no merge work in Phases 1-2 |
| Mixed dirty workspace hides true regressions | HIGH | MEDIUM | Use one bounded change set per tool family and verify after each gate |

## Rollback Protocols

1. **One tool family per change slice**
   - Never refactor journal, trajectory, and handoff in one batch.

2. **Snapshot durable state before each critical phase**
   - Save copies of:
     - `.hivemind/state/trajectory-ledger.json`
     - `.hivemind/state/tasks.json`
     - `.hivemind/graph/tasks.json`
     - `.hivemind/handoffs/` (if created during testing)
     - `.hivemind/agent-work-contract/` (do not mutate during this cycle)

3. **Journal rollback**
   - If supersession breaks event output, restore prior plugin/catalog registration and rely on hook writer as the recovery path.

4. **Trajectory rollback**
   - Revert code first, then validate the saved ledger can still be read and extended.

5. **Handoff rollback**
   - Revert tool + feature + delegation-store changes as a unit.
   - Re-run create → validate → close smoke verification on the restored implementation.

6. **Stable-authority rollback rule**
   - If `hivemind_task` or `hivemind_agent_work_*` are touched incidentally and regress, revert immediately and remove them from the active refactor slice.

## Bottom-Line Priority Order

1. **Journal authority + supersession**
2. **Trajectory verification + fix**
3. **Handoff verification + fix**
4. **Task stays stable**
5. **Agent-work stays stable**
6. **Task vs agent-work architecture review last**

This order minimizes blast radius while repairing the tools most likely to create silent orchestrator failure.
