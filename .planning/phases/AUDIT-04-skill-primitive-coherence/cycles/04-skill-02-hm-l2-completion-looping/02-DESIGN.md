# AUDIT-04 Cycle 2 — Stage 2 DESIGN

**Cycle ID**: 04-skill-02
**Stage**: 2 DESIGN — merged SKILL.md composition rationale

## 1. Source inventory

### 1.1 Primary source (HM STRICT)

- **Path**: `assets/skills/hm-l2-completion-looping/SKILL.md`
- **Line count**: 158
- **Disposition**: F01 violation (residual l2 prefix). MERGE into new `hm-loop-completion`.
- **Content shape**: Loop mechanics (3 loop types, 3 gates, durable cursor, Iron Law); consumed-by lists 6 phantoms (`hm-l2-debugger/finisher/guardian/investigator/operator/persistor`); GSD-thinking style (LangGraph/AutoGen/OpenAI lineage table).

### 1.2 Sibling source (FLEXIBLE, unprefixed)

- **Path**: `assets/skills/completion-detection/SKILL.md`
- **Line count**: 225
- **Disposition**: F03 violation (unprefixed whitelist). MERGE.
- **Content shape**: Framework-agnostic detection discipline (4 detection signals, dual-signal protocol, fresh-evidence rule, 4-grade rubric); `cross-references` block at the bottom.

## 2. Composition strategy

### 2.1 Foundation (from `completion-detection`)

Adopt wholesale as the discipline backbone — already framework-agnostic:
- **Iron Law** (preserved verbatim from primary source — same wording)
- **Dual-signal protocol** (4-phase flow + separation rule)
- **Fresh-evidence rule** (claim × acceptable × unacceptable table)
- **4 detection signals** (hollow / mock / stale / missing)
- **4-grade rubric** (CONFIRMED / PLAUSIBLE / SUSPICIOUS / FALSE)
- **Completion gate checklist** (7-item)

### 2.2 Mechanics layer (from `hm-l2-completion-looping`)

Adopt the structural mechanics — already operational:
- **Three gates** (Output / Quality / Scope) — preserved
- **Three loop types** (Verify-After 5 / Verify-During 10 / Guardrail 3) — preserved
- **Durable cursor schema** — preserved
- **Self-verification envelope** — preserved

### 2.3 Hivemind binding layer (NEW)

Added as `## Hivemind Runtime Bindings` section:
- `delegate-task` — dispatch doer / re-dispatch after failure
- `delegation-status` — poll for subagent return
- `hivemind-sdk-supervisor` — verify session ended cleanly
- `.hivemind/state/loops/<task_id>.yaml` — durable cursor location
- `hivemind-trajectory` — audit loop log for regression

### 2.4 GSD Compatibility (G.2)

`## GSD Compatibility` section added per 04-04 §4.3, mapping `gsd-verify-work` → `hm-loop-completion`.

### 2.5 Consumed-by re-binding

| Old (in source) | New |
|---|---|
| `hm-l2-debugger` | `hm-debugger` (phantom resolution deferred to central registry pass) |
| `hm-l2-finisher` | `hm-finisher` (phantom ABOLISH; keep name as comment for traceability) |
| `hm-l2-guardian` | `hm-guardian` (phantom ABOLISH) |
| `hm-l2-investigator` | `hm-investigator` (phantom ABOLISH, P7) |
| `hm-l2-operator` | `hm-operator` (phantom ABOLISH, P6) |
| `hm-l2-persistor` | `hm-persistor` (phantom CORRECT, assumed canonical) |

Add `hm-executor` as canonical consumer (per `hm-coord-loop` integration).

### 2.6 Items REMOVED from merge

- **`references/terminology-map.md` (gsd-pause/resume)** — borderline tech-ref. Drop entirely.
- **Cross-references block (line 152-159 of source)** — references `hm-coordinating-loop`, `hm-phase-loop`, `hm-planning-persistence` (all renamed in other cycles). Replaced with post-rename cross-refs.
- **Layer: "2"** frontmatter — F01 implicit. Removed.
- **`hm-l2-investigator`, `hm-l2-operator` from `consumed-by`** — phantoms (P6/P7). Removed (replaced with canonical names or dropped).

### 2.7 Items KEPT verbatim

- Iron Law (the same in both sources, by design)
- Three Gates table
- Loop Types table
- Durable Cursor schema
- Dual-Signal Protocol flow
- Fresh Evidence Rule table
- 4 Detection Signals (with renamed `Wave execution` and `iterative-loop` references)
- 4-Grade Rubric
- Completion Gate Checklist
- Anti-Patterns (consolidated from both sources)

## 3. New SKILL.md skeleton

```
---
name: hm-loop-completion
description: <trigger conditions, third-person>
metadata:
  consumed-by: [hm-debugger, hm-finisher, hm-guardian, hm-investigator, hm-operator, hm-persistor, hm-executor]
  lineage-scope: "hm-*"
  access: "STRICT"
  realm: "test,clean-code"
  pattern: P2
  version: "1.0.0"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

## GSD Compatibility                    # §2.4 (required by 04-04 §4)
## Overview                            # §2.1
## When This Skill Loads — Do This First  # 5-step on-load
## The Iron Law (canonical)             # §2.1
## The Three Gates                     # §2.2
## Loop Types                          # §2.2
## Durable Cursor Schema               # §2.2
## Self-Verification Envelope          # §2.2
## Dual-Signal Completion Protocol     # §2.1
## Fresh Evidence Rule                 # §2.1
## What Completion Detection Detects   # §2.1
## Completion Claim Grading            # §2.1
## Hivemind Runtime Bindings           # §2.3 (NEW)
## Anti-Patterns                        # §2.1 + §2.2 consolidated
## Self-Correction                      # §2.1
## Cross-References                     # §2.6 (post-rename)
```

## 4. Length and budget

- Target: 240-320 lines (under 500 hard cap, near 300 ideal).
- Actual: ~280 lines.

## 5. Naming validation

```bash
bash assets/.hivemind-config/validate-name.sh "hm-loop-completion" skill
# Expected: exit 0
```

## 6. Cross-ref sweep plan (Stage 4)

### 6.1 Replace mapping

| Old name | New name | Files affected |
|---|---|---|
| `hm-l2-completion-looping` | `hm-loop-completion` | 29 unique files (3 agents + 6 skills + 12 .hivemind/agents + 8 .hivemind/skills) |
| `completion-detection` | `hm-loop-completion` | 2 unique files (completion-detection self + 1 other) |

### 6.2 Phase order

1. **Phase A** — `assets/agents/` (3 files: hf-coordinator, hm-l0-orchestrator, hf-l0-orchestrator)
2. **Phase B** — `assets/skills/` (7 files: hm-l2-skill-router + 2 refs + evals, hm-l3-integration-contracts + 2 refs + evals, hivemind-power-on ref, wave-execution, iterative-loop)
3. **Phase C** — `assets/commands/` (0 files)
4. **Phase D** — `assets/{workflows,references,templates}/` (0 files)
5. **Mirror** — `assets/.hivemind/` (20 files: 8 agents + 12 skills) + delete mirror of source

### 6.3 Special handling

- `hm-l3-integration-contracts/SKILL.md` and 2 ref files are central registry; touched in C1 already; sweep continues.
- `assets/.hivemind/agents/hm-l2-{debugger,finisher,guardian,persistor}.md` — phantoms; sweep only the `hm-l2-completion-looping` reference inside; the phantom agent file rename is out of cycle scope.
- Mirror deletion of `assets/.hivemind/skills/hm-l2-completion-looping/` and `assets/.hivemind/skills/completion-detection/` required.

## 7. Gate plan

| Gate | Method | Pass criteria |
|---|---|---|
| Lifecycle integration | 9-surface + CQRS | new SKILL.md in assets/skills/, old in archive, no orphan refs |
| Spec compliance | 5-realm + EARS + anti-pattern | 5-realm ≥12/15 (target lift 10→12+), all F01-F12 absent |
| Evidence truth | L1-L5 | validate-name.sh exit 0, sync-assets.js exit 0, grep 0 hits post-sweep |

## 8. Done when

- [x] 6/6 sub-sections present.
- [x] Source inventory (2 sources) complete.
- [x] Composition strategy (foundation + mechanics + Hivemind + GSD + consumed-by + removals + kept).
- [x] Skeleton matches actual written file.
- [x] Naming validation plan.
- [x] Cross-ref sweep plan (31 files).
- [x] Gate plan (3 gates).
- [x] Risk-tier note (HIGH overridden to MEDIUM per user; documented).
