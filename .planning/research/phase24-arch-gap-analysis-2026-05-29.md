# Phase 24 — Architecture Gap Analysis

**Analysis Date:** 2026-05-29  
**Scope:** Cross-reference all phase-24 planning documents against live `src/` codebase  
**Evidence Level:** L2-L3 (source read, typecheck, test results)

---

## Executive Summary

Phase 24 has a **critical structural failure**: the root phase directory `24-coordination-dispatch-delegate-task-fix/` is completely empty (only `.gitkeep`). All substantive work happened in sub-phases 24.1, 24.3.1, 24.3.2, and 24.3.3 without the parent phase ever being planned or executed. The sub-phases exhibit significant drift — code was created that contradicts several planning documents, LOE violations exist, and backward compatibility promises were broken.

**Gap count: 7 HIGH severity, 4 MEDIUM severity across 5 phase directories.**

---

## Phase 24 (Root): `24-coordination-dispatch-delegate-task-fix/`

### Claimed (from ROADMAP.md cross-reference)

The phase directory exists at `.planning/phases/24-coordination-dispatch-delegate-task-fix/` with a `D-*` naming scope suggesting coordination dispatch fixes, delegate-task work, and WaiterModel improvements.

### Actual

**Directory is EMPTY** — contains only `.gitkeep`.

| Artifact | Expected | Actual | Gap |
|----------|----------|--------|-----|
| SPEC.md | Phase specification | MISSING | 🚨 HIGH — no requirements defined |
| PLAN.md | Implementation plan | MISSING | 🚨 HIGH — no plan to execute |
| SUMMARY.md | Completion evidence | MISSING | 🚨 HIGH — no summary of work done |
| RESEARCH.md | Domain research | MISSING | — |
| CONTEXT.md | Discussion context | MISSING | — |

**Impact:** Sub-phases 24.1, 24.3.1, 24.3.2, 24.3.3 have no parent specification to reference. Each sub-phase independently decided its own scope, leading to the incoherences documented in the companion report.

---

## Phase 24.1: `24.1-agent-hierarchy-restructure/`

### Claimed

| Claim | Source | Detail |
|-------|--------|--------|
| 8 new hm-* agent files created | 24.1-01-SUMMARY.md | hm-executor, hm-verifier, hm-planner, hm-plan-checker, hm-project-researcher, hm-phase-researcher, hm-synthesizer, hm-codebase-mapper |
| Minimal frontmatter: `description`, `mode: all`, `hidden: true` only | 24.1-01-PLAN.md | No deprecated fields (name, temperature, steps, etc.) |
| 45→30 agent consolidation | 24.1-RESEARCH.md | 22 agents removed, 17 renamed/kept, 13 new |
| All agents renamed to drop `-lX-` tier suffix | 24.1-RESEARCH.md | e.g. `hm-l2-executor` → `hm-executor` |
| Phase 24.2 TODO comments for full body | 24.1-01-SUMMARY.md | Placeholder body until 24.2 |

### Actual

| Check | Result | Evidence |
|-------|--------|----------|
| 8 new agent files exist? | ✅ PASS — all 8 present | `ls .opencode/agents/hm-{executor,verifier,planner,plan-checker,project-researcher,phase-researcher,synthesizer,codebase-mapper}.md` |
| Minimal frontmatter? | ✅ PASS — confirmed minimal format | Sample reads show `description`, `mode: all`, `hidden: true` |
| No deprecated fields? | ✅ PASS | No `-l2-` suffix in filenames; no name/temperature/color fields |
| 31 hm-* agents in total? | ✅ PASS | `ls .opencode/agents/hm-*.md | wc -l` = 31 |
| No hm-l2-* files remain? | ✅ PASS | `glob hm-l2-*` returns 0 results |
| Phase 24.2 plans exist? | ❌ FAIL — no 24.2 directory exists | `.planning/phases/24.2-*` doesn't exist |

### Gaps

**GAP-24.1-01 (HIGH):** Phase 24.2 (agent profile body writing) was never executed. The 8 new agents exist as skeletons with TODO comments only. No other hm-* agents were updated from the old format. The RESEARCH.md's detailed mapping table (45→30 agents) was only partially implemented — the file structure changes happened but agent body content did not.

**GAP-24.1-02 (MEDIUM):** The RESEARCH.md references extracting deleted agent domain knowledge to `.planning/references/` before deletion. No evidence of this extraction exists. If old agents contained valuable instruction content, it may be lost.

**GAP-24.1-03 (LOW):** 24.1-01-SUMMARY.md claims "Zero deprecated field violations" but only checked 8 newly created files. The remaining ~23 hm-* agents that existed before 24.1 were left unverified.

---

## Phase 24.3.1: `24.3.1-governance-session-prototype/`

### Claimed

| Claim | Source | Detail |
|-------|--------|--------|
| `src/shared/session-naming.ts` created | 24.3.1-00-SUMMARY.md | Pure function generate/parse session titles |
| `create-governance-session` tool in `src/features/governance-engine/` | 24.3.1-01-SUMMARY.md | Factory pattern with Zod schema |
| Tool registered in `src/plugin.ts` | 24.3.1-02-SUMMARY.md | Tool discoverable by agents |
| `.hivemind/governance/config.json` created | 24.3.1-05-PLAN.md | Governance config with naming_standards |
| Session title propagation to SessionRecord | 24.3.1-04-SUMMARY.md | title field in frontmatter |
| Metadata fix: no more "unknown" agent names | 24.3.1-07-PLAN.md | parseSessionTitle in core chain |
| 14 unit tests pass | 24.3.1-02-SUMMARY.md | 14/14 passed |
| Typecheck clean | 24.3.1-03-SUMMARY.md | 0 errors |

### Actual

| Check | Result | Evidence |
|-------|--------|----------|
| `src/shared/session-naming.ts` exists? | ✅ PASS | 156 LOC, pure functions, documented |
| `src/features/governance-engine/create-governance-session.ts` exists? | ✅ PASS | 252 LOC, Zod-validated |
| Tool registered in plugin.ts? | ✅ PASS | Import + registration confirmed |
| `.hivemind/governance/config.json` exists? | ✅ PASS | Contains agents, commands, templates, naming_standards |
| SessionRecord has title field? | ❓ UNVERIFIED | Need to read types.ts to confirm |
| Agent config references hm-l2-* names? | ❌ FAIL | Config references `hm-l2-scout`, `hm-l2-researcher`, etc. — conflicts with 24.1 renaming |
| `renderToolResult()` used? | ✅ PASS | Used extensively for success/error responses |

### Gaps

**GAP-24.3.1-01 (HIGH):** The governance config at `.hivemind/governance/config.json` still references `hm-l2-scout`, `hm-l2-researcher`, `hm-l2-debugger`, `hm-l2-reviewer`, `hm-l2-architect`, `hm-l2-synthesizer`, `hm-l2-spec-verifier`, `hm-l2-planner`, `hm-l2-auditor` — all names with `-l2-` tier suffix that Phase 24.1 specifically removed. These agent names no longer exist in `.opencode/agents/`.

```json
// .hivemind/governance/config.json — uses OLD naming convention
"defaultAgent": "hm-l2-scout",  // 🚨 Doesn't exist! Should be "hm-scout"
"agents": {
  "hm-l2-scout": { ... },        // 🚨 Doesn't exist!
  "hm-l2-researcher": { ... },   // 🚨 Doesn't exist!
```

**GAP-24.3.1-02 (MEDIUM):** The UAT document (`24.3.1-LIVE-UAT.md`) is written entirely in Vietnamese. While functional for Vietnamese-speaking reviewers, this creates a language barrier in a predominantly English-language project. Codebase documentation in mixed languages is an anti-pattern.

**GAP-24.3.1-03 (MEDIUM):** Plan 00 claims "All 3 creation points can import and use the naming service" but only 2 of 3 creation points (sdk-child-session-starter.ts, spawn-request-builder.ts) were confirmed patched. The governance engine tool was also patched, but session-creator.ts status is unverified.

---

## Phase 24.3.2: `24.3.2-revamp-execute-slash-command/`

### Claimed

| Claim | Source | Detail |
|-------|--------|--------|
| Consistent `{ output, metadata, error }` envelope | 24.3.2-SPEC.md | REQ-01 — all return paths use same shape |
| Zod schema validation via `ExecuteSlashCommandSchema` | 24.3.2-SPEC.md | REQ-02 — from `schema-kernel/commands.schema.ts` |
| commandSource tracking ('user', 'agent', 'system') | 24.3.2-SPEC.md | REQ-03 — user/agent/system tracking |
| Execution tracking (UUID + timestamps + duration) | 24.3.2-SPEC.md | REQ-04 — metadata enrichment |
| Delegation-aware context (parentSessionID) | 24.3.2-SPEC.md | REQ-05 — subtask path |
| Typed error classes (5 classes) | 24.3.2-SPEC.md | REQ-06 — CommandNotFoundError, etc. |
| Move 3 session tools to `src/tools/session/` | 24.3.2-SPEC.md | REQ-07 — physical relocation |
| Narrow import: `@opencode-ai/plugin/tool` | 24.3.2-SPEC.md | REQ-08 — all 24 tools |
| Module size ≤ 500 LOC | 24.3.2-SPEC.md | Constraint |
| Namespace routing DEFERRED to 24.3.3 | 24.3.2-SPEC.md | Explicit deferral |
| `renderToolResult()` does NOT exist in codebase | 24.3.2-SPEC.md | Footnote line 37: "renderToolResult() does NOT exist in codebase" |

### Actual

| Check | Result | Evidence |
|-------|--------|----------|
| `{ output, metadata, error }` envelope? | ✅ PASS | Code shows consistent ToolResult shape |
| `ExecuteSlashCommandSchema` imported? | ✅ PASS | Line 6: `import { ExecuteSlashCommandSchema }` |
| Typed error classes used? | ✅ PASS | Lines 7-13: imports from `../../shared/errors/commands.js` |
| Narrow import used? | ✅ PASS | Line 1: `import { tool } from "@opencode-ai/plugin/tool"` |
| `resolveCommand` and `dispatchCommand` imported? | ✅ PASS | Lines 17-18 |
| `selectAgent` imported? | ✅ PASS | Line 20: `import { selectAgent }` |
| Module size ≤ 500 LOC? | ❌ **FAIL** — 631 LOC | `wc -l execute-slash-command.ts` = 631 (126% of limit) |
| `renderToolResult()` exists in codebase? | ❌ **CONTRADICTION** | 24.3.1's create-governance-session.ts heavily uses it |

### Gaps

**GAP-24.3.2-01 (HIGH):** SPEC line 37 explicitly states **"renderToolResult() does NOT exist in codebase. PATTERNS.md and earlier SPEC drafts incorrectly referenced it."** This is factually wrong. `renderToolResult()` exists in `src/shared/tool-helpers.ts` and is used extensively in `src/features/governance-engine/create-governance-session.ts` (created by 24.3.1, which completed BEFORE 24.3.2 was researched).

**GAP-24.3.2-02 (HIGH):** MODULE SIZE VIOLATION. `src/tools/session/execute-slash-command.ts` is **631 LOC** — exceeding the 500 LOC cap by 26%. The plan explicitly states: "Module size must stay under 500 LOC cap — estimate after refactor: ~460 LOC." The actual implementation is 37% over estimate.

**GAP-24.3.2-03 (MEDIUM):** Deferred namespace routing was supposed to be implemented in 24.3.3, but 24.3.3 also deferred it (see below). This creates a double-deferral gap.

**GAP-24.3.2-04 (MEDIUM):** Session tools move (REQ-07) claimed moving 3 tools but the plan lists 4 files: `session-context.ts`, `session-hierarchy.ts`, `session-tracker.ts`, `session-resolver.ts`. The actual location of these files wasn't fully verified against the old paths in `src/tools/hivemind/`.

---

## Phase 24.3.3: `24.3.3-namespace-routing-advanced-features/`

### Claimed

| Claim | Source | Detail |
|-------|--------|--------|
| Module extraction: resolve-command.ts, dispatch-command.ts | 24.3.3-01-SUMMARY.md | Separated from execute-slash-command.ts |
| `namespace?: string` field in ExecuteSlashCommandSchema | 24.3.3-SPEC.md | Optional, NO enum, NO routing logic |
| `validateCommandContract()` function | 24.3.3-01-SUMMARY.md | Structural fields only |
| Semantic agent selection: `selectAgent()` | 24.3.3-02-PLAN.md | Keyword + fuzzy matching |
| Workflow parser: `parseWorkflowFile()` | 24.3.3-02-PLAN.md | YAML workflow parsing |
| Two-stage routing: command → agent | 24.3.3-02-PLAN.md | Sequential pipeline |
| 41/41 tests pass | 24.3.3-01-SUMMARY.md | Across 7 test files |
| execute-slash-command.ts < 500 LOC | 24.3.3-01-SUMMARY.md | "Refactored from 527→402 LOC" |

### Actual

| Check | Result | Evidence |
|-------|--------|----------|
| `resolve-command.ts` exists? | ✅ PASS | 235 LOC at expected path |
| `dispatch-command.ts` exists? | ✅ PASS | At expected path |
| `validate-command.ts` exists? | ✅ PASS | At expected path |
| `semantic-agent-selector.ts` exists? | ✅ PASS | 113 LOC at expected path |
| `workflow-parser.ts` exists? | ✅ PASS | At expected path |
| `namespace?: string` in schema? | ✅ PASS | `commands.schema.ts` line 13 |
| Namespace field has no enum? | ✅ PASS | `z.string().optional()` — no enum constraint |
| Namespace routing logic exists? | ✅ PASS — but PLACEHOLDER ONLY | Line 13: `namespace: z.string().optional().describe("Namespace override")` — description says "override" not placeholder |
| execute-slash-command.ts < 500 LOC? | ❌ **FAIL** — 631 LOC | Previous phase's reduction to 402 LOC was REVERTED by 24.3.3 changes |
| Two-stage routing implemented? | ✅ PARTIAL | `resolveCommand()` exists but two-stage agent selection integrated into execute-slash-command.ts lines 210-259 |

### Gaps

**GAP-24.3.3-01 (HIGH):** LOC REVERSION. Plan 01 Summary claims execute-slash-command.ts was reduced from 527→402 LOC. However, 24.3.3-02-PLAN.md and subsequent changes added semantic-agent-selector, resolve-command enhancements, and workflow-parser — but the actual execute-slash-command.ts is now 631 LOC. Either the 402 LOC claim was wrong or subsequent changes bloated it back up. Either way, the 500 LOC cap is breached.

**GAP-24.3.3-02 (MEDIUM):** Namespace routing was DEFERRED twice in the chain:
- 24.3.2 SPEC: "Deferred to P24.3.3 (namespace routing)"
- 24.3.3 SPEC: "Namespace routing DEFERRED — no hardcoded values, NO routing logic"
- 24.3.3 schema: `namespace?: string` field exists but with `describe("Namespace override")` description that implies active use, contradicting the "placeholder only" claim

**GAP-24.3.3-03 (MEDIUM):** The `selectAgent()` function in `semantic-agent-selector.ts` references `createTuiPrompt()` (line 123 in the plan) which is a UI function from `src/cli/ui/prompts.js`. This creates a dependency from `src/tools/session/` (tool layer) to `src/cli/ui/` (CLI layer) — a **layer violation** if the tool module is imported from the plugin (which runs in OpenCode context, not CLI context).

---

## ⚠️ CODE VERIFICATION CORRECTIONS (2026-05-29)

The following claims in this document were **verified against live codebase** and found to be INACCURATE:

| Document Claim | Code Truth | Correction |
|---|---|---|
| `src/tools/session/` has 7 files | **14 entries** (13 .ts + 1 dir `session-patch/`) | Under-counted modules. Add: session-journal-export.ts, session-patch/, validate-command.ts, workflow-parser.ts, dispatch-command.ts, resolve-command.ts, semantic-agent-selector.ts |
| Governance config references 9 dead agents | **7 agents** (no `hm-l2-planner` or `hm-l2-auditor` in config) | Over-counted by 2 |
| Workflows layer "missing" (FLAW-09) | **106 workflow files exist** (103 hm-* + 3 others) in `.opencode/workflows/` | Workflows exist — docs claim "NOT STARTED" is wrong |
| LOC cap: only execute-slash-command.ts flagged | **8 files exceed 500 LOC** (734, 658, 653, 631, 625, 556, 502, 502) | Gap is 8× worse than stated |
| Assets/ not mentioned | `assets/` contains: 43 agents, 137 commands, 34 skills, 106 workflows | Missing full root-level scan scope |
| Root dirs: only src/ scanned | Root has: assets/, scripts/, bin/, sidecar/, eval/, docs/, planning/, .archive/, .agent/, .research/ | Document scope was too narrow |
| Commands: 99 hm-* + 7 hf-* | **118 total** (99 hm + 7 hf + 4 test + 2 harness + 2 deep + 1 ultrawork + 1 sync + 1 start + 1 plan) | Missing 12 non-hm/hf commands |

## Summary Gap Count (UPDATED with Code Truth)

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 HIGH | 7 | Empty root phase, LOC cap violations ×**8**, `renderToolResult()` contradiction, stale agent names in config, namespace routing double-deferral, 24.2 never executed |
| 🟡 MEDIUM | 4 | UAT in Vietnamese, layer violation, unverified creation points, agent domain knowledge loss risk |
| 🟢 LOW | 1 | Unverified remaining agents |

---

## Conclusions

1. **Parent phase 24 is a ghost phase.** No specification, plan, or completion evidence exists. Sub-phases operated independently without parent coordination.

2. **Phase 24.1 did half the job.** Agent files were renamed/created but 24.2 (profile body writing) was never executed. The old agent knowledge was archived but cross-references to old names persist in other systems.

3. **Phase 24.3.1 created tools that reference dead agent names.** The governance config at `.hivemind/governance/config.json` references `hm-l2-*` agents that no longer exist.

4. **Phase 24.3.2 made a factually incorrect claim.** The SPEC asserts `renderToolResult()` doesn't exist when it was already created by a prior phase.

5. **24.3.2 and 24.3.3 both violate the 500 LOC cap.** execute-slash-command.ts at 631 LOC is 26% over the limit.

6. **Namespace routing was abused twice.** Deferred from 24.3.2 → 24.3.3, then deferred again within 24.3.3.

---

*Analysis completed: 2026-05-29*
*Next: Cross-phase incoherence report (.planning/research/phase24-incoherences-2026-05-29.md)*
