# Harness Audit Report — 2026-04-07

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Health** | **CRITICAL** |
| Critical Issues | 7 |
| Warnings | 12 |
| Informational | 8 |
| Claims Verified | 29 total: 8 MATCH, 15 GAP, 3 HALLUCINATION, 1 ORPHAN, 2 OUTDATED |
| Commands | 11 total: 7 usable, 4 unusable |
| Skills | 19 total: ~15 usable, 4 with significant issues |
| Agents | 21 total: ~14 usable, 7 with role overlap/duplication |

**Verdict:** The codebase has drifted significantly from its documented architecture. The hard harness (src/) contains business logic that should be elsewhere, distribution exports are broken, and governance artifacts have substantial overlap and cross-worktree dependencies.

---

## Critical Issues (Must Fix)

### C1: Broken Package Export — `./plugin` maps to non-existent file
- **Location:** `package.json` → `exports["./plugin"]` → `"./dist/harness/index.js"`
- **Reality:** No `dist/harness/` directory exists. Compiled output is `dist/plugin.js`.
- **Impact:** Any consumer importing `opencode-harness/plugin` will get a runtime MODULE_NOT_FOUND error.
- **Severity:** CRITICAL

### C2: CLI Binary points to empty directory
- **Location:** `package.json` → `bin.harness` → `"./dist/cli/index.js"`
- **Reality:** `src/cli/` contains only `.gitkeep`. No CLI implementation exists.
- **Impact:** `npx harness` or global install will fail.
- **Severity:** CRITICAL

### C3: plugin.ts violates "zero business logic" principle
- **Location:** `src/plugin.ts` — 467 LOC (target: <100)
- **Reality:** Contains permission rule generation, agent validation, circuit breaker logic, delegation routing, tool call budget enforcement, category normalization.
- **Impact:** The plugin layer is doing governance work that should be in dedicated modules. 4.67× over budget.
- **Severity:** CRITICAL

### C4: Two commands have zero YAML frontmatter
- **Location:** `.opencode/commands/deep-init.md` (303 LOC), `.opencode/commands/deep-research-synthesis-repomix.md` (620 LOC)
- **Reality:** No `---` YAML header. No `agent:` field. No `subtask:` field.
- **Impact:** OpenCode cannot route these commands to agents. They are effectively dead as commands — they function only as reference documents.
- **Severity:** CRITICAL

### C5: Three commands reference external worktree paths
- **Location:** `.opencode/commands/hf-audit.md`, `hf-create.md`, `hf-stack.md`
- **Reality:** All three contain hardcoded `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/...` paths.
- **Impact:** Commands will fail if the `hivefiver-v2` worktree doesn't exist on the executing machine. Not portable, not self-contained.
- **Severity:** CRITICAL

### C6: Duplicate agent definitions
- **Location:** `.opencode/agents/conductor.md` ↔ `coordinator.md` — identical descriptions ("Primary orchestrator")
- **Location:** `.opencode/agents/explore.md` ↔ `researcher.md` — identical descriptions ("Terminal repository investigator")
- **Impact:** Ambiguous routing. Two agents with the same purpose waste context and create confusion about which to use.
- **Severity:** CRITICAL

### C7: types.ts is NOT a leaf module (contradicts architecture)
- **Location:** `src/lib/types.ts` line 1: `import type { TaskStatus } from "./task-status.js"`
- **Reality:** AGENTS.md claims "types.ts is leaf — depends on nothing." It depends on task-status.ts.
- **Impact:** The documented dependency graph is wrong. Any analysis based on "types.ts is leaf" is invalid.
- **Severity:** CRITICAL

---

## Warnings (Should Fix)

### W1: Module size violations
| Module | Actual | Limit | Over |
|--------|--------|-------|------|
| `lifecycle-manager.ts` | 705 LOC | 500 | +41% |
| `continuity.ts` | 638 LOC | 500 | +28% |
| `plugin.ts` | 467 LOC | 100 | +367% |

### W2: ~40% of compiled modules not re-exported
- `src/index.ts` only re-exports from `lib/` and `plugin.js`.
- Missing: `src/tools/` (3 packages, ~415 LOC), `src/plugins/` (103 LOC), `src/shared/` (80 LOC), `src/schema-kernel/` (193 LOC), `src/hooks/` (92 LOC).
- Impact: Consumers of the main package entrypoint cannot access these modules.

### W3: Architecture drift — 5 undocumented source directories
- `src/tools/` — 3 tool packages (prompt-skim, prompt-analyze, session-patch)
- `src/plugins/` — prompt-enhance.ts
- `src/shared/` — tool-response.ts, tool-helpers.ts
- `src/schema-kernel/` — Zod schemas for prompt enhancement
- `src/hooks/` — messages-transform.ts
- None are mentioned in AGENTS.md's documented project structure.

### W4: 3 empty placeholder directories
- `src/harness/`, `src/kernel/`, `src/cli/` — contain only `.gitkeep` files.
- `src/harness/` is referenced in package.json exports but has no implementation.

### W5: AGENTS.md inside src/lib/
- `src/lib/AGENTS.md` (79 lines) — documentation file inside library source.
- Should be at project root or in `.opencode/`.

### W6: Skill trigger collisions (9 overlaps detected)
| Collision | Skills | Risk |
|-----------|--------|------|
| "create a skill" | meta-builder ↔ skill-synthesis ↔ use-authoring-skills | HIGH |
| "audit skill(s)" | meta-builder ↔ harness-audit ↔ use-authoring-skills | HIGH |
| "create/build an agent" | meta-builder ↔ agents-and-subagents-dev ↔ agent-authorization | HIGH |
| "dispatching subagents" | agents-and-subagents-dev ↔ coordinating-loop ↔ planning-with-files | MEDIUM |
| "explore/analyze repo" | repomix-explorer ↔ repomix-exploration-guide | MEDIUM |
| "persist context/loops" | session-context-manager ↔ phase-loop | MEDIUM |
| "subtask:/agent:" mentions | agents-and-subagents-dev ↔ command-dev | MEDIUM |
| "configure OpenCode" | meta-builder ↔ opencode-platform-reference | LOW |
| "plan this/break down" | planning-with-files ↔ coordinating-loop | LOW |

### W7: Four orchestrator agents
- `conductor`, `coordinator`, `hivefiver`, `hivefiver-orchestrator` — all claim orchestrator roles.
- Distinctions between them are unclear from descriptions alone.

### W8: `any` type in plugin.ts
- Line 56: `(OpenCodePlugin as { tool?: any }).tool as any`
- Violates "No any types on new code" rule.

### W9: Undocumented environment variable
- `OPENCODE_HARNESS_CONCURRENCY_LIMIT` is used but not documented in AGENTS.md.
- `OPENCODE_HARNESS_STATE_DIR` and `OPENCODE_HARNESS_CONTINUITY_FILE` are documented.

### W10: Skill/command/agent proliferation beyond documented counts
| Artifact | Documented | Actual | Delta |
|----------|-----------|--------|-------|
| Skills | 5 | 19 | +14 |
| Agents | 6 | 21 | +15 |
| Commands | 6 | 11 | +5 |

### W11: 9 of 19 skills are OpenCode-locked
- `agent-authorization`, `agents-and-subagents-dev`, `command-dev`, `command-parser`, `custom-tools-dev`, `harness-audit`, `meta-builder`, `oh-my-openagent-reference`, `opencode-non-interactive-shell`, `opencode-platform-reference`
- These reference OpenCode-specific concepts and cannot be used on agentskills.io or other platforms.

### W12: POSIX shell scripts in skills (Windows incompatible)
- 19 shell command instances across skill scripts/references using `mkdir -p`, `rm -f`, `cp -r`, `mv`, `chmod`.
- Skills affected: `skill-synthesis`, `coordinating-loop`, `harness-audit`, `use-authoring-skills`, `session-context-manager`, `repomix-explorer`.
- Will not execute natively on Windows without WSL or Git Bash.

---

## Informational

### I1: No circular dependencies detected
- Verified via import graph analysis. No circular imports in `src/lib/`.

### I2: `[Harness]` error prefix consistent
- All Error throws in `plugin.ts` use `[Harness]` prefix. Matches AGENTS.md claim.

### I3: Dual-layer state architecture intact
- `continuity.ts` (638 LOC) handles file persistence, `state.ts` (106 LOC) handles in-memory Maps. Both serve stated purposes.

### I4: Deep-clone-on-read implemented
- `continuity.ts` implements deep-clone-on-read as claimed.

### I5: Node.js compatibility clean
- Declared: `>=20.0.0`. Actual usage stays within Node 20 feature set. No Node 22+ features detected.

### I6: Total LOC within target
- `src/` total: ~2,821 LOC. Project total: ~3,717 LOC. Within the 4,000-5,000 target range.

### I7: Skill count within ~20 target
- 19 skills exist, within the "~20 SKILL.md files" target from AGENTS.md.

### I8: No OS-specific code in TypeScript
- Zero `process.platform` or OS-specific checks in `src/`. TypeScript code is OS-agnostic.

---

## Claim vs Reality Table

| Claim | Source | Status | Evidence |
|-------|--------|--------|----------|
| Max 500 LOC per module | AGENTS.md:70 | GAP | lifecycle-manager=705, continuity=638, plugin=467 |
| plugin.ts target <100 LOC | AGENTS.md:44 | GAP | Actual: 467 LOC (4.67× over) |
| types.ts is leaf | AGENTS.md:47 | GAP | Imports TaskStatus from task-status.ts |
| No circular dependencies | AGENTS.md:69 | MATCH | Verified via import graph |
| helpers.ts near-leaf | AGENTS.md:67 | GAP | Imports from types.ts (which isn't leaf) |
| 5 tools (~500 LOC) | AGENTS.md:147 | GAP | Only 4 tools registered; ~415 LOC in src/tools/ |
| hooks (~800 LOC) | AGENTS.md:147 | HALLUCINATION | 1 file, ~70 LOC. No dedicated hooks module. |
| lifecycle (~400 LOC) | AGENTS.md:147 | GAP | lifecycle-manager.ts is 705 LOC |
| continuity (~400 LOC) | AGENTS.md:147 | GAP | continuity.ts is 638 LOC |
| delegation (~400 LOC) | AGENTS.md:147 | HALLUCINATION | No dedicated delegation module exists |
| CLI substrate (~500 LOC) | AGENTS.md:147 | HALLUCINATION | No bin/ directory. No CLI implementation. |
| control-plane (~400 LOC) | AGENTS.md:147 | GAP | plugin.ts is 467 LOC |
| shared (~800 LOC) | AGENTS.md:147 | GAP | ~1,011 LOC across shared modules |
| Total ~4,000-5,000 LOC | AGENTS.md:143 | MATCH | ~3,717 LOC total |
| Zero business logic in plugin | AGENTS.md:7 | GAP | Contains permission rules, validation, routing, circuit breaker |
| 6 agents defined | AGENTS.md:128 | GAP | 21 agents exist, not 6 |
| 5 skills defined | AGENTS.md:129 | GAP | 19 skills exist, not 5 |
| 6 commands defined | AGENTS.md:130 | GAP | 11 commands exist, not 6 |
| ~20 SKILL.md target | AGENTS.md:144 | MATCH | 19 skills exist |
| Plugin via .opencode/plugins/ | AGENTS.md:126 | ORPHAN | No .opencode/plugins/ directory exists |
| continuity.ts ~635 LOC | AGENTS.md:52 | MATCH | 638 LOC — within rounding |
| lifecycle-manager.ts ~500 LOC | AGENTS.md:57 | GAP | 705 LOC — 41% over |
| Deep-clone-on-read | AGENTS.md:105 | MATCH | Implemented in continuity.ts |
| [Harness] error prefix | AGENTS.md:106 | MATCH | Consistent in plugin.ts |
| Dual-layer state | AGENTS.md:107 | MATCH | continuity.ts + state.ts |
| No any types | AGENTS.md:108 | GAP | `any` found in plugin.ts line 56 |
| lifecycle-manager deepest chain | AGENTS.md:68 | MATCH | Imports from multiple lib modules |
| Runtime features (agents, loops, etc.) | AGENTS.md:18 | GAP | Delegation/continuity exist; auto-loop/task-queuing lack dedicated modules |
| Target: 5 tools | AGENTS.md:147 | GAP | Only 4 tools registered |

---

## Context Poisoning Map

| Artifacts | Overlap Type | Risk | Description |
|-----------|-------------|------|-------------|
| meta-builder ↔ skill-synthesis ↔ use-authoring-skills | Trigger collision | HIGH | All three fire on "create a skill" — router, synthesizer, and author compete |
| meta-builder ↔ harness-audit ↔ use-authoring-skills | Trigger collision | HIGH | All three fire on "audit skill" |
| meta-builder ↔ agents-and-subagents-dev ↔ agent-authorization | Trigger collision | HIGH | All three fire on "create an agent" |
| conductor ↔ coordinator | Role duplication | HIGH | Identical descriptions as "Primary orchestrator" |
| explore ↔ researcher | Role duplication | HIGH | Identical descriptions as "Terminal repository investigator" |
| agents-and-subagents-dev ↔ coordinating-loop ↔ planning-with-files | Trigger collision | MEDIUM | All three fire on "dispatching subagents" |
| repomix-explorer ↔ repomix-exploration-guide | Trigger collision | MEDIUM | Nearly identical trigger semantics |
| session-context-manager ↔ phase-loop | Trigger collision | MEDIUM | Both fire on loop-related context persistence |
| hivefiver ↔ hivefiver-orchestrator ↔ conductor ↔ coordinator | Role overlap | MEDIUM | Four agents claim orchestrator roles |
| meta-synthesis-agent ↔ hivefiver-orchestrator | Role overlap | MEDIUM | Both handle meta-concept synthesis |
| hf-audit/hf-create/hf-stack | Cross-worktree dependency | HIGH | Hardcoded paths to `hivefiver-v2` worktree |

---

## Cross-Platform Matrix

| Factor | macOS | Linux | Windows |
|--------|-------|-------|---------|
| TypeScript src/ | ✅ Clean | ✅ Clean | ✅ Clean |
| Shell scripts in skills | ✅ Works | ✅ Works | ❌ POSIX-only (mkdir, rm, cp, mv, chmod) |
| Hardcoded paths | ⚠️ 1 dev path in .md | ✅ None | ✅ None |
| Env vars | ✅ 3 vars, 2 documented | ✅ Same | ✅ Same |
| Node.js >=20 | ✅ Compatible | ✅ Compatible | ✅ Compatible |
| Skill portability | ⚠️ 10/19 OpenCode-locked | ⚠️ Same | ⚠️ Same |

---

## Usability Summary

### Commands (11 total)
| Status | Count | Details |
|--------|-------|---------|
| ✅ Usable | 7 | harness-audit, harness-doctor, plan, start-work, ultrawork, hf-prompt-enhance |
| ❌ Unusable | 2 | deep-init, deep-research-synthesis-repomix (no frontmatter) |
| ⚠️ Conditional | 2 | hf-audit, hf-create, hf-stack (require hivefiver-v2 worktree) |

### Skills (19 total)
| Status | Count | Details |
|--------|-------|---------|
| ✅ Usable | 10 | coordinating-loop, phase-loop, planning-with-files, repomix-exploration-guide, repomix-explorer, session-context-manager, skill-synthesis, use-authoring-skills, user-intent-interactive-loop |
| ⚠️ OpenCode-locked | 9 | agent-authorization, agents-and-subagents-dev, command-dev, command-parser, custom-tools-dev, harness-audit, meta-builder, oh-my-openagent-reference, opencode-non-interactive-shell, opencode-platform-reference |
| ❌ Issues | 0 | All have valid frontmatter |

### Agents (21 total)
| Status | Count | Details |
|--------|-------|---------|
| ✅ Usable | 14 | builder, critic, intent-loop, phase-guardian, prompt-analyzer, prompt-repackager, prompt-skimmer, risk-assessor, spec-verifier, context-mapper, context-purifier, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-skill-author |
| ⚠️ Role overlap | 7 | conductor↔coordinator (duplicate), explore↔researcher (duplicate), hivefiver↔hivefiver-orchestrator (unclear distinction), meta-synthesis-agent↔hivefiver-orchestrator (overlapping domain) |

---

## Recommendations (Prioritized)

### Immediate (P0)
1. **Fix package.json exports** — `./plugin` should map to `./dist/plugin.js`, not `./dist/harness/index.js`
2. **Remove or implement CLI binary** — Either delete `bin.harness` from package.json or implement the CLI
3. **Add YAML frontmatter to deep-init.md and deep-research-synthesis-repomix.md** — Or reclassify them as reference docs, not commands
4. **Remove cross-worktree hardcoded paths** from hf-audit.md, hf-create.md, hf-stack.md — Use relative paths or document the dependency
5. **Merge duplicate agents** — conductor/coordinator and explore/researcher are functionally identical

### Short-term (P1)
6. **Refactor plugin.ts** — Extract business logic (permission rules, validation, circuit breaker) into dedicated modules. Target: <100 LOC.
7. **Split lifecycle-manager.ts** — 705 LOC exceeds 500 limit. Extract sub-responsibilities.
8. **Update AGENTS.md** — Document actual architecture (tools/, plugins/, shared/, schema-kernel/, hooks/ directories) and correct all claim numbers
9. **Resolve skill trigger collisions** — Clarify boundaries between meta-builder (router), skill-synthesis (GitHub-sourced), and use-authoring-skills (authoring craft)
10. **Re-export missing modules** from src/index.ts or document them as internal

### Medium-term (P2)
11. **Split continuity.ts** — 638 LOC exceeds 500 limit
12. **Remove `any` types** from plugin.ts
13. **Document OPENCODE_HARNESS_CONCURRENCY_LIMIT** environment variable
14. **Add platform adaptation notes** to OpenCode-locked skills or accept they are platform-specific
15. **Clean up empty directories** — Remove src/harness/, src/kernel/, src/cli/ or implement them

---

## Mandate Gate Results

| Gate Condition | Status | Details |
|----------------|--------|---------|
| Hard harness contains soft meta-concepts | ⚠️ WARNING | src/lib/AGENTS.md (79 lines) — documentation in source |
| Circular dependencies in delegation | ✅ PASS | No circular imports detected |
| 100% completion claims vs reality | ❌ FAIL | 3 HALLUCINATION claims (hooks, delegation, CLI substrate don't exist as documented) |
| Context poisoning causing workflow failures | ❌ FAIL | 9 trigger overlaps, 2 duplicate agents, 3 cross-worktree command dependencies |
| OS-specific assumptions breaking other platforms | ⚠️ WARNING | POSIX shell scripts in skills break Windows; TypeScript is clean |
| Skills that edit files instead of delegating | ✅ PASS | Skills are instructional, not executable |
| Commands with ambiguous execution paths | ❌ FAIL | 2 commands have no frontmatter (unroutable), 3 have external worktree dependencies |

**Gate Result: FAIL** — 3 of 7 mandate gates failed. The project is not in a healthy state for further development without addressing critical issues first.
