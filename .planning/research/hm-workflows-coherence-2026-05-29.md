# HM Workflows vs GSD Workflows: Coherence Analysis

**Date:** 2026-05-29
**Context:** Phase 24.5 — Evaluate whether HM workflows are coherently connected to commands, agents, and references.
**Method:** Read 3 GSD workflows + 3 HM workflows. Compare structure, reference coherence, path correctness.

---

## Sources Read

### GSD Workflows
| File | Lines | Role |
|------|-------|------|
| `workflows/discuss-phase.md` | 499 | Context gathering from user |
| `workflows/execute-phase.md` | 882+ | Wave-based plan execution |
| Command routing hub | `bin/lib/command-routing-hub.cjs` | SDK vs CJS dispatch |

### HM Workflows
| File | Lines | Role |
|------|-------|------|
| `workflows/hm-discuss-phase.md` | 499 | Context gathering (adapted from GSD) |
| `workflows/hm-execute-phase.md` | 882+ | Wave-based plan execution (adapted from GSD) |
| `workflows/hm-plan-phase.md` | 1800 | Plan creation (MORE detailed than GSD) |

---

## Dimension 1: Architecture & Overall Quality

**Verdict: HM workflows are structurally robust and often more detailed than GSD equivalents.** The `hm-plan-phase.md` at 1800 lines is the most detailed workflow in either system, with comprehensive phase-gate logic, agent dispatch chains, closed-phase protection, and config-driven behavior.

However, **structural quality does not guarantee coherence.** A well-written workflow that references non-existent files is dangerous — it creates a false sense of capability while silently failing at runtime.

---

## Dimension 2: ⚠️ CRITICAL — Path Coherence Gap in hm-execute-phase.md

### The Problem

`hm-execute-phase.md` references step files under paths that DO NOT EXIST:

| Broken Reference in hm-execute-phase.md | Actual File Path |
|----------------------------------------|-----------------|
| `workflows/hm-execute-phase/steps/per-plan-worktree-gate.md` | `workflows/execute-phase/steps/hm-per-plan-worktree-gate.md` |
| `workflows/hm-execute-phase/steps/post-merge-gate.md` | `workflows/execute-phase/steps/hm-post-merge-gate.md` |
| `workflows/hm-execute-phase/steps/codebase-drift-gate.md` | `workflows/execute-phase/steps/hm-codebase-drift-gate.md` |

### Root Cause

The HM workflow file was renamed to `hm-execute-phase.md`, but the subdirectory structure was NOT renamed:
```
.opencode/workflows/
├── hm-execute-phase.md            # renamed ✅ (file)
├── execute-phase/                  # NOT renamed ❌ (directory)
│   └── steps/
│       ├── hm-per-plan-worktree-gate.md
│       ├── hm-post-merge-gate.md
│       └── hm-codebase-drift-gate.md
```

The HM workflow references `workflows/hm-execute-phase/steps/...` but the actual directory is `workflows/execute-phase/steps/hm-...`. Two errors compound:
1. Wrong directory name (`hm-execute-phase/` vs `execute-phase/`)
2. Missing `hm-` prefix on file names in the references (references `per-plan-worktree-gate.md` not `hm-per-plan-worktree-gate.md`)

### Impact

If `hm-execute-phase.md` is invoked at runtime, all step-based logic fails at the first `Read and execute` instruction. The orchestrator will fail to find the step files, causing execution to halt or error.

### Fix Required

Either:
- **(A)** Rename `workflows/execute-phase/` → `workflows/hm-execute-phase/` (mirror the file rename)
- **(B)** Update all 3 references in `hm-execute-phase.md` to point to the correct existing paths

---

## Dimension 3: Discuss-Phase Path Coherence (Correct)

`hm-discuss-phase.md` references paths under `workflows/discuss-phase/...` (without the `hm-` prefix):

```markdown
| `--power` in $ARGUMENTS | `workflows/discuss-phase/modes/power.md`
| `--auto` in $ARGUMENTS  | `workflows/discuss-phase/modes/auto.md`
...
| in `write_context` step | `workflows/discuss-phase/templates/context.md`
```

The actual directory is `workflows/discuss-phase/modes/` and `workflows/discuss-phase/templates/`. **These references are correct** — the HM workflow correctly references the GSD-named subdirectory.

### Why discuss-phase is correct but execute-phase is not

Both workflows were adapted from GSD by adding `hm-` prefix to the filename. However:
- **discuss-phase** correctly continues referencing the GSD-named subdirectory (`discuss-phase/`)
- **execute-phase** was incorrectly changed to reference `hm-execute-phase/` — a path that doesn't exist

This is a simple copy-paste error during adaptation: the `hm-execute-phase.md` author changed paths without verifying the directory structure.

---

## Dimension 4: Plan-Phase Subdirectory Analysis

`hm-plan-phase.md` (1800 lines) does **not** reference any step subdirectories. No plan-phase subdirectories exist under workflows/:
```
.opencode/workflows/hm-plan-phase/        → DOES NOT EXIST
.opencode/workflows/plan-phase/            → DOES NOT EXIST
```

**Impact:** No broken references, but any future step extraction into subdirectories would be blocked by the missing directory. If plan-phase complexity grows, creating a `hm-plan-phase/steps/` or `plan-phase/steps/` directory will be needed.

---

## Dimension 5: Reference File Coherence (Good)

### GSD Reference Pattern
```
<required_reading>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/domain-probes.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/references/gates.md
...63 files total
</required_reading>
```

### HM Reference Pattern
```
<required_reading>
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-domain-probes.md
@/Users/apple/hivemind-plugin-private/.opencode/references/hm-gates.md
...70 files total
</required_reading>
```

**Verdict: References are coherent.** HM has a complete parallel reference set (70 files vs GSD's 63). All critical references have HM equivalents:

| GSD Reference | HM Equivalent | Status |
|---------------|--------------|--------|
| `domain-probes.md` | `hm-domain-probes.md` | ✅ |
| `gate-prompts.md` | `hm-gate-prompts.md` | ✅ |
| `gates.md` | `hm-gates.md` | ✅ |
| `agent-contracts.md` | `hm-agent-contracts.md` | ✅ |
| `context-budget.md` | `hm-context-budget.md` | ✅ |
| `checkpoints.md` | `hm-checkpoints.md` | ✅ |
| `tdd.md` | `hm-tdd.md` | ✅ |
| `worktree-path-safety.md` | `hm-worktree-path-safety.md` | ✅ |

**HM innovations beyond GSD:**
- `hm-session-continuity.md` — session persistence model
- `hm-coordination-contracts.md` — coordination design pattern
- `hm-dual-signal-completion.md` — dual-signal completion protocol
- `hm-gate-triad.md` — quality gate triad orchestration
- `hm-workspace-security.md` — workspace isolation security

---

## Dimension 6: Agent Binding Coherence (Good)

HM workflows correctly reference `hm-*` agent types for every GSD equivalent:

| GSD Agent | HM Agent | Status |
|-----------|----------|--------|
| `gsd-executor` | `hm-executor` | ✅ |
| `gsd-verifier` | `hm-verifier` | ✅ |
| `gsd-planner` | `hm-planner` | ✅ |
| `gsd-phase-researcher` | `hm-phase-researcher` | ✅ |
| `gsd-plan-checker` | `hm-plan-checker` | ✅ |
| `gsd-debugger` | `hm-debugger` | ✅ |
| ... | ... | All 1:1 mapped ✅ |

---

## Dimension 7: Template Coherence (Good)

HM has a complete parallel template set:

| GSD Templates | HM Templates | Status |
|--------------|-------------|--------|
| 36 entries | 40 entries | ✅ HM has more |
| `context.md` | `hm-context.md` | ✅ |
| `summary.md` | `hm-summary.md` | ✅ |
| `spec.md` | `hm-spec.md` | ✅ |
| `state.md` | `hm-state.md` | ✅ |

**HM innovations:** `hm-debug.md`, `hm-debug-reproduction.md`, `hm-debug-subagent-prompt.md`, `hm-verification.md`

---

## Summary of Findings

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Architecture quality | ✅ GOOD | HM workflows are thorough, well-structured |
| Reference coherence | ✅ GOOD | 70 HM references correctly mirror GSD's 63 |
| Agent binding | ✅ GOOD | All 1:1 hm-* equivalents |
| Template coherence | ✅ GOOD | 40 HM templates cover all GSD templates + extras |
| **Step path coherence** | **❌ CRITICAL** | **3 broken paths in hm-execute-phase.md** |
| Subdirectory naming | ⚠️ INCONSISTENT | `discuss-phase/` (correct) vs `hm-execute-phase/` (broken) |

### Critical Fix Needed

**3 broken step references in `hm-execute-phase.md` must be corrected** before this workflow can be used at runtime. All three references point to `workflows/hm-execute-phase/steps/` which doesn't exist — the actual directory is `workflows/execute-phase/steps/` with `hm-` prefixed filenames.
