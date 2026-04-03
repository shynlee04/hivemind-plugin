# Project Trinity: Deep Research & Architecture Audit
**Date**: 2026-04-03  
**Scope**: Main branch + harness-experiment + product-detox  
**Research Type**: Comprehensive codebase investigation + assumption validation  
**Authority**: Evidence-based synthesis from 4 parallel subagent investigations

---

## Executive Summary

Three entities form the HiveMind project ecosystem: the **main branch** (published npm package v2.9.5, ~25K LOC), **harness-experiment** (clean architecture prototype, ~2.5K LOC), and **product-detox** (the bloated target for migration, ~15K LOC). The research validates the user's architectural assumption: **scripts embedded in SKILL.md files must be pure helpers only — no governance, no state checking, no absolute paths.**

### Key Findings at a Glance

| Entity | LOC | Modules | Tools | Skills | Status |
|--------|-----|---------|-------|--------|--------|
| **Main branch** | ~25,384 | 55+ dirs | 12 | 5 deployed | Published npm v2.9.5 |
| **harness-experiment** | ~2,547 | 13 files | 1 | 5 core + 7 domain | Clean architecture prototype |
| **product-detox** | ~15,000 | 50+ dirs | 12 | 19 shipped + 235 total | Bloated, needs migration |

---

## 1. Entity Analysis

### 1.1 Main Branch (`/Users/apple/hivemind-plugin/`)

**Published**: `hivemind-context-governance@2.9.5` on npm  
**Entry**: `dist/plugin/opencode-plugin.js` + 6 CLI binaries  
**Architecture**: CQRS with tools (write), hooks (read), plugin (assembly)

**Module breakdown** (src/):
```
src/plugin/          23 files — Plugin assembly (257 LOC entry)
src/tools/           12 tool groups — Write-side (CQRS)
src/hooks/           14 files — Read-side event handlers
src/features/        10 subdirectories — THE BIGGEST BLOAT AREA
  ├── agent-work-contract/  35 files (engine/hooks/schema/tools)
  ├── runtime-entry/        25 files
  ├── event-tracker/        15 files
  ├── session-entry/        13 files
  └── ...6 more subfeatures
src/shared/          30 files — Utilities (some bloat)
src/core/            trajectory + workflow-management
src/schema-kernel/   7 files — Contract authority
src/sdk-supervisor/  7 files — Orchestration control
src/cli/             5 files — CLI commands
src/delegation/      4 files — Delegation logic
src/intelligence/    6 files — Doc surface
src/control-plane/   6 files — Control primitives
src/recovery/        3 files — Recovery engine
```

**Critical bloat signals**:
- `features/agent-work-contract/` — 30 files for one concept (contract management)
- `features/runtime-entry/` — 20 files for session initialization
- Context renderer decomposed into 6 files
- Status/State abstraction proliferation: 3 competing "runtime-status" modules
- Agent definition triplication (root `agents/` + `.opencode/agents0/` + `.opencode/agents-test-eval/`)

**Skills deployed** (`.opencode/skills/`):
- `meta-builder` — Skill routing/dispatch
- `user-intent-interactive-loop` — Intent clarification
- `planning-with-files` — Persistent planning memory
- `coordinating-loop` — Multi-agent coordination
- `use-authoring-skills` — Skill creation/auditing

### 1.2 Harness-Experiment (`/Users/apple/hivemind-plugin/.worktrees/harness-experiment/`)

**Purpose**: Clean architecture prototype — the **target** for migration  
**Package**: `opencode-harness@0.1.0` (standalone, not published)  
**Architecture**: Clean delegation with session lifecycle management

**Module breakdown** (src/):
```
src/index.ts           13 lines — barrel re-export
src/plugin.ts         447 lines — HarnessControlPlane Plugin definition
src/lib/
  ├── types.ts               157 lines — shared types (leaf)
  ├── helpers.ts             116 lines — pure utilities
  ├── task-status.ts          21 lines — state machine (7 states)
  ├── runtime.ts              69 lines — event→status mapping
  ├── concurrency.ts          98 lines — keyed semaphore
  ├── notification-handler.ts 85 lines — task notifications
  ├── session-api.ts         120 lines — typed SDK wrappers
  ├── state.ts               106 lines — in-memory Maps
  ├── completion-detector.ts 123 lines — two-signal completion
  ├── agent-registry.ts      112 lines — YAML frontmatter parser
  ├── continuity.ts          638 lines — durable JSON persistence
  └── lifecycle-manager.ts   705 lines — orchestrator class
```

**What's clean here**:
- Single `plugin.ts` as composition root
- Clear module boundaries (no circular deps)
- `tool.schema` (Zod) for all tool args
- Context from `ToolContext` (sessionID, agent, directory, worktree, abort)
- 3 specialist agents with explicit permission profiles
- State machine for task transitions (7 states, validated transitions)
- Concurrency control via keyed semaphore

**Skills ecosystem** (`.skills-lab/refactoring-skills/`):
- 8 skill packs with LAYER 0-4 hierarchy enforcement
- Eval harness with 14 fixture directories
- These are **designed to replace** the 19+ `hivemind-*`/`use-hivemind-*` skills from product-detox

### 1.3 Product-Detox (`/Users/apple/hivemind-plugin/.worktrees/product-detox/`)

**Purpose**: The bloated codebase being migrated FROM  
**Package**: `hivemind-context-governance@2.9.5` (same as main branch)

**Skill proliferation**: 235 SKILL.md files across 7+ directories:
| Location | Count | Purpose |
|----------|-------|---------|
| `skills/` | 20 dirs | Shipped (10 `hivemind-*` + 9 `use-hivemind-*` + 1 `use-hivemind`) |
| `.github/skills/` | 38 | GSD framework skills |
| `.codexdisabled/skills/` | 44 | Disabled Codex skills |
| `.developing-skills/` | 19 dirs | Dev mirror (exact script copies, divergent SKILL.md) |
| `.qwen/skills/` | 19 | Qwen platform |
| `.roo/skills/` | 12 | Roo platform |
| `.opencode/skills/` | 12 | OpenCode-specific |

**Banned scripts found**:
1. `use-hivemind-context/scripts/hm-verify.cjs` (1,014 LOC) — Full governance suite
2. `use-hivemind-context/scripts/context-harness-init.cjs` (514 LOC) — State management + rot scorer
3. `use-hivemind/scripts/hm-entry-gate.cjs` (193 LOC, dev-only) — Universal project validity gate

**15 OK scripts** (pure helpers): scoring, validation, classification, scanning, formatting — no governance, no state writes, no absolute paths.

---

## 2. Assumption Validation: Scripts in Skills

### 2.1 The User's Assumption

> "Scripts in skills must ONLY be helpers for tracing, pathing, counting, finding. BLOCK and BAN anything using scripts for governance, state checking, nor scripting in SKILLS that dictate paths as absolute paths."

### 2.2 Why This Is Architecturally Correct — 5 Evidence-Based Reasons

#### Reason 1: Skills Are Location-Agnostic

**Fact**: Skills can be installed:
- Locally in a project (`.opencode/skills/`, `.claude/skills/`, etc.)
- Globally (`$HOME/.config/opencode/skills/`, `$HOME/.agents/skills/`)
- Via `npx skills add https://github.com/owner/repo --skill name`
- Via npm plugins (`npm install -g hivemind-context-governance`)
- Via `skills.sh` across 50+ platforms
- Flat files (just SKILL.md + optional scripts/)

**Implication**: Any script that hardcodes `.opencode/state/`, `$HOME/.config/opencode/skills/`, or `.skills-lab/refactoring-skills/` **breaks** when the user installs differently. The user decides WHERE at install time. Scripts that assume paths are making decisions that belong to the user.

**Evidence**: The audit found 12 absolute path instances across `verify-hierarchy.sh` (5 copies), `register-skill.sh` (5 copies), `preflight.sh`, `route-check.sh`, `stack-validate.sh`, `intent-verify.sh`, and `first-action.sh`. All check paths like:
- `$PROJECT_ROOT/.kilo/skills/$skill`
- `$PROJECT_ROOT/.skills-lab/refactoring-skills/`
- `$HOME/.config/opencode/skills`
- `$HOME/.agents/skills`
- `.opencode/state/loaded-skills.json`

**These paths may not exist.** The `.skills-lab/` directory doesn't exist on the main branch. The `.kilo/` directory is platform-specific. These are ghosts.

#### Reason 2: Governance Scripts Create Hallucination for AI

**Fact**: When a script exits 1 with "BLOCKED" or "ACTION: Update X before stopping", the AI agent treats this as a hard constraint. But the script's judgment may be wrong for the current context.

**Evidence**: `check-gate.sh` in coordinating-loop has 5 gates (G1-G5). G5 checks "acceptance criteria unmet." But what if the user wants to iterate? What if acceptance criteria changed? The script can't know — it's making a judgment call that should belong to the agent's reasoning.

**Evidence**: `preflight.sh` in meta-builder contains a GROUP scoring algorithm (g1_score, g2_score) that computes routing decisions. This is **agent reasoning encoded as bash**. The agent should read the SKILL.md guidance and decide, not be overridden by a script's formula.

#### Reason 3: Scripts That Dictate State Are Wrong Layer

**Fact**: `register-skill.sh` writes to `.opencode/state/loaded-skills.json`. `context-harness-init.cjs` writes to `.hivemind/context-check.json`. `intent-verify.sh` writes to `.opencode/state/intent.json`. These are state mutations from scripts — violating CQRS.

**Evidence**: OpenCode has native state management via `client.session`, `client.app.log()`, the event hook system, and the plugin's state persistence. Skills writing state files creates a shadow state system that competes with OpenCode's runtime truth.

**The correct pattern**: State management belongs in tools (write-side, CQRS) or the plugin's hook system, not in skill scripts.

#### Reason 4: In Larger Environments, Governance Scripts Are Disastrous

**Fact**: In a single-user, single-project setup, governance scripts are annoying but survivable. In multi-agent, multi-project, multi-platform environments (which is HiveMind's target), they cascade into failure.

**Evidence**: The harness-experiment's eval harness (14 fixture directories) found that hierarchy enforcement scripts ("if exit 1 → BLOCKED") cause **3rd failure** — "Scripts exist, AI ignores them." The AI either blindly follows (wrong context) or ignores entirely (defeating the purpose). Neither outcome is desirable.

#### Reason 5: Skills Are Packaged, Scripts Are Installed Separately

**Fact**: When someone runs `npx skills add owner/repo --skill name`, they get the SKILL.md + scripts/. When they install via npm plugin, they get everything. The script's behavior MUST work in BOTH contexts without modification.

**Evidence**: The product-detox has `skills/` (shipped, 18 scripts) and `.developing-skills/` (dev mirror, 19 scripts). The scripts are byte-for-byte identical — but the SKILL.md files diverge. This separation shows the natural boundary: scripts are stable helpers, SKILL.md is the evolving instruction surface.

### 2.3 Classification Matrix

| Category | Count | Examples | Verdict |
|----------|-------|----------|---------|
| **GOVERNANCE** (BAN) | 22 scripts + 18 SKILL.md blocks | `verify-hierarchy.sh`, `check-gate.sh`, `preflight.sh`, `intent-verify.sh`, `gate-enforce.sh`, `hm-verify.cjs`, `context-harness-init.cjs` | **REMOVE or FUNDAMENTALLY CONVERT** |
| **ABSOLUTE_PATH** (BAN) | 12 instances | All `verify-hierarchy.sh` copies, `register-skill.sh`, `preflight.sh`, `route-check.sh` | **REMOVE hardcoded paths** |
| **STATE_MUTATION** (BAN) | 3 script types | `register-skill.sh`, `context-harness-init.cjs`, `first-action.sh` | **REMOVE — state belongs to tools** |
| **HELPER** (OK) | 15 scripts + 6 SKILL.md blocks | `init-session.sh`, `loop-status.sh`, `session-checkpoint.sh`, `score-confidence.sh`, `hm-codescan.sh` | **KEEP** |

### 2.4 What SHOULD Exist as Scripts in Skills

| Function | Example | Why It's OK |
|----------|---------|-------------|
| **File creation** | `init-session.sh` creates skeleton planning files | No judgment, pure scaffolding |
| **Status reporting** | `loop-status.sh` reports phase/gate/child status | Always exits 0, information only |
| **Validation reporting** | `validate-skill.sh` reports frontmatter issues | Reports errors, doesn't block |
| **Scoring/analysis** | `score-confidence.sh` computes from inputs | Pure computation, no I/O judgment |
| **Code scanning** | `hm-codescan.sh` reads and reports structure | Read-only, outputs findings |
| **Checkpointing** | `session-checkpoint.sh` saves state snapshot | Information gathering |

**The rule**: A script should **report facts** and **leave judgment to the agent**.

---

## 3. Replacement Mapping: harness-experiment → product-detox

### 3.1 Skills Replacement

The 5 harness-experiment skills (LAYER 0-4) are designed to **replace** the 19+ product-detox skills:

| Harness-Experiment Skill | Layer | Replaces (product-detox) | What Changes |
|--------------------------|-------|--------------------------|--------------|
| `meta-builder` | LAYER 0 (Router) | `use-hivemind`, `hivemind-meta-builder`, routing logic in all `use-hivemind-*` | Single router replaces scattered routing. Scripts → report-only helpers. |
| `user-intent-interactive-loop` | LAYER 1 (Front) | `use-hivemind-ideating`, `use-hivemind-planning`, intent logic | Intent clarification without `intent-verify.sh` blocking gates. Agent reads conditions. |
| `planning-with-files` | LAYER 2 (Memory) | `use-hivemind-planning`, planning logic in all skills | File-based planning without `check-complete.sh` blocking. `init-session.sh` kept. |
| `coordinating-loop` | LAYER 3 (Coordination) | `use-hivemind-delegation`, coordination logic | Multi-agent dispatch without `check-gate.sh` G1-G5 blocking. Ralph loop reports. |
| `use-authoring-skills` | LAYER 4 (Execution) | `hivemind-synthesis`, `hivemind-refactor`, `hivemind-codemap`, `hivemind-atomic-commit` | Skill CRUD without `gate-enforce.sh` scoring. Validation reports. |

### 3.2 Scripts Remediation

| Script (harness-experiment) | Copies | Current Behavior | Target Behavior |
|-----------------------------|--------|------------------|-----------------|
| `verify-hierarchy.sh` | 5 identical | Exits 1 to block, 10 hardcoded paths | **SINGLE copy**, report-only (exit 0), env-var configurable paths |
| `register-skill.sh` | 5 identical | Writes state, hardcoded `.opencode/state/` | **REMOVE** — orchestrator concern |
| `check-gate.sh` | 1 | 5 blocking gates (G1-G5) | **REMOVE** — agent reads SKILL.md for gate conditions |
| `coordination-check.sh` | 1 | Pre-dispatch blocking | **REMOVE** — agent decides readiness |
| `preflight.sh` | 1 | GROUP scoring algorithm, routing decisions | **REMOVE** — scoring belongs in SKILL.md guidance |
| `route-check.sh` | 1 | Route validation with hardcoded paths | **REMOVE** — routing is agent reasoning |
| `stack-validate.sh` | 1 | Skill stacking validation | **REMOVE** — stacking is agent reasoning |
| `intent-verify.sh` | 1 | 11 blocking conditions | **REMOVE** — conditions in SKILL.md |
| `gate-enforce.sh` | 1 | Quality scoring gate (grading.json ≤ 2) | **REMOVE** — quality is agent judgment |
| `validate-gate.sh` | 1 | Multi-gate preflight + state creation | **REMOVE** — preflight is agent reasoning |
| `check-complete.sh` | 2 | Exit 1 on incomplete phases | **KEEP** but change to exit 0, report-only |
| `session-catchup.py` | 1 | Exit 1 on drift detection | **KEEP** but change to exit 0, report-only |
| `init-session.sh` | 3 | Creates skeleton files | **KEEP** — pure helper |
| `loop-status.sh` | 1 | Reports status, always exits 0 | **KEEP** — pure helper |
| `session-checkpoint.sh` | 1 | Saves state snapshot | **KEEP** — pure helper |

### 3.3 Product-Detox Scripts to Ban

| Script | LOC | Issue | Action |
|--------|-----|-------|--------|
| `hm-verify.cjs` | 1,014 | Full governance suite: npm ls, tsc, test, git, planning validation | **BAN** — replace with SKILL.md instructions for agent to run these manually |
| `context-harness-init.cjs` | 514 | State management + rot scoring + permission gates | **BAN** — replace with tool-based state management |
| `hm-entry-gate.cjs` | 193 | Universal project validity gate (dev-only) | **BAN** — confirm not shipped, gate in `.developing-skills/` only |

---

## 4. Architecture Comparison

### 4.1 Current State (Product-Detox) vs Target (Harness-Experiment)

| Dimension | Product-Detox (Current) | Harness-Experiment (Target) |
|-----------|------------------------|----------------------------|
| **LOC** | ~15,000 (315 files) | ~2,547 (13 files) |
| **Modules** | 55+ directories | 13 files in 1 directory |
| **Tools** | 12 registered | 1 (`delegate-task`) |
| **Plugin Entry** | 257 LOC | 447 LOC (but single composition root) |
| **Skills** | 235 SKILL.md files | 5 core + 7 domain |
| **Scripts** | 36 scripts (3 banned) | 31 scripts (22 need remediation) |
| **State** | 3 competing systems | Single `continuity.ts` store |
| **Agents** | 13 root + 14+14+16 copies | 6 defined with permission profiles |
| **Boundaries** | 11 lint:boundary scripts | Enforced via module structure |

### 4.2 GSD vs HiveMind vs Industry

| Dimension | GSD (`get-shit-done`) | HiveMind V3 (Target) | Industry Best Practice |
|-----------|----------------------|----------------------|----------------------|
| **CLI Architecture** | 19 domain `.cjs` modules, central router | `bin/hivemind-tools.cjs` (proposed) | Centralized CLI (Yo, Nx) |
| **Distribution** | `npx get-shit-done-cc@latest` | npm package + skills.sh | `npx install -g` |
| **Skill Definition** | SKILL.md frontmatter + agents + skills/ | SKILL.md + YAML metadata + scripts/ | `package.json` keywords + config |
| **State Management** | `STATE.md` + `.planning/` | `task_plan.md` + `progress.md` | `STATE.md` backed by git |
| **Context Windows** | Fresh per subagent | Clean per skill execution | Clean per skill via SKILL.md |
| **Eval Harness** | N/A | Python eval_runner.py + 14 fixtures | Fixture-based recommended |

---

## 5. Bloat Analysis

### 5.1 Feature Bloat (Product-Detox)

| Feature | Current | Target | Reduction | Action |
|---------|---------|--------|-----------|--------|
| `agent-work-contract/` | 30 files, 3K LOC | 3 files, 400 LOC | 87% | **SIMPLIFY** → delegation/ |
| `runtime-entry/` | 20 files, 2K LOC | 5 files, 400 LOC | 80% | **SIMPLIFY** → hooks/start-work/ |
| `session-entry/` | 15 files, 1.5K LOC | 3 files, 400 LOC | 73% | **KEEP** → lifecycle/ |
| `runtime-observability/` | 10 files, 1K LOC | 2 files, 300 LOC | 70% | **KEEP** → tools/runtime/ |
| `event-tracker/` | 15 files, 1.2K LOC | 2 files, 200 LOC | 83% | **CONSOLIDATE** |
| `doc-intelligence/` | 10 files, 1K LOC | 0 files | 100% | **ELIMINATE** |
| Context Renderer | 6 files | 2 files | 67% | **CONSOLIDATE** |

### 5.2 Skill Bloat (Product-Detox)

| Category | Count | Action |
|----------|-------|--------|
| Canonical shipped (`skills/`) | 20 | Keep 5 core, replace 15 with harness-experiment 5 |
| Dev mirror (`.developing-skills/`) | 19 | **DELETE** — exact script copies, divergent SKILL.md |
| GSD (`.github/skills/`) | 38 | Review — some overlap with harness-experiment |
| Disabled Codex (`.codexdisabled/`) | 44 | **DELETE** — duplicates GSD |
| Platform copies (qwen/roo/opencode) | 43 | **DELETE** — platform adapters, not canonical |
| **Total** | **235** | **Target: ~20** (91% reduction) |

### 5.3 Agent Bloat (Product-Detox)

| Location | Count | Action |
|----------|-------|--------|
| `agents/` (root, canonical) | 13 | Keep as authoring surface |
| `.opencode/agents0/` | 14 | **DELETE** — runtime projection of root |
| `.opencode/agents-test-eval/` | 14 | **DELETE** — test copy |
| `.opencode/agents-disabled/` | 16 | **DELETE** — disabled agents |
| **Total** | **57** | **Target: 13** (77% reduction) |

---

## 6. Recommendations

### 6.1 Immediate (This Session)

1. **Ban the 3 governance scripts** in product-detox:
   - `hm-verify.cjs` → Replace with SKILL.md instructions
   - `context-harness-init.cjs` → Replace with tool-based state
   - `hm-entry-gate.cjs` → Confirm not shipped, gate in dev-only

2. **Remediate harness-experiment scripts**:
   - Deduplicate `verify-hierarchy.sh` from 5 copies to 1
   - Remove all `register-skill.sh` copies
   - Convert all blocking scripts to report-only (exit 0)
   - Remove hardcoded paths, use env vars

3. **Delete bloat directories**:
   - `.developing-skills/` (19 duplicate skills)
   - `.codexdisabled/` (44 disabled skills)
   - `.opencode/agents0/`, `agents-test-eval/`, `agents-disabled/`

### 6.2 Short-Term (Week 1-2)

4. **Port harness-experiment core** to main branch:
   - `src/lib/lifecycle-manager.ts` → `src/lifecycle/`
   - `src/lib/continuity.ts` → `src/continuity/`
   - `src/lib/concurrency.ts` → keep in shared
   - `src/lib/completion-detector.ts` → keep in lifecycle

5. **Consolidate product-detox features**:
   - `features/agent-work-contract/` (30 files → 3)
   - `features/runtime-entry/` (20 files → 5)
   - Delete `features/doc-intelligence/`

### 6.3 Medium-Term (Week 3-4)

6. **Simplify plugin** to <100 LOC assembly-only
7. **Merge tools** from 12 to 5
8. **Enforce boundaries** with automated scripts
9. **Publish v3.0.0** at ~4,300 LOC

---

## 7. Evidence Trail

### 7.1 Research Sources

| Source | Type | Key Finding |
|--------|------|-------------|
| Main branch `src/` | Code analysis | 25,384 LOC, 315 files, 55+ directories |
| Harness-experiment `src/` | Code analysis | 2,547 LOC, 13 files, clean module structure |
| Product-detox `src/` | Code analysis | 15,000 LOC, 315 files, 3 competing status systems |
| Product-detox `skills/` | Script audit | 18 scripts, 2 banned (governance), 15 OK |
| `.developing-skills/` | Script audit | 19 scripts, 1 additional banned (dev-only) |
| Harness-experiment `.skills-lab/` | Skill audit | 8 skill packs, 31 scripts, 22 need remediation |
| `docs/plans/refactor/` | Architecture docs | Clean blueprint + migration strategy + file matrix |
| AGENTS.md (root) | Governance | CQRS, SDK-first, interface decomposition rules |
| AGENTS.md (harness-experiment) | Governance | THE LOOP (9 steps), coordinator mandate, anti-patterns |

### 7.2 Previous Session Research

- **Interaction ID**: `trun_ce9a95e2e6c5494d911fa1b86fc53ae1`
- **7 research tasks** completed covering GSD CLI architecture, OpenCode skill discovery, npm plugin best practices, Claude Code/Cursor/Cursor skill ecosystems, MCP/LSP integration patterns
- **Key recommendation**: Meta-Builder pattern with dual packaging (full SDK + lightweight git installs)

---

## Appendix A: Script Classification Quick Reference

### ✅ OK — Pure Helpers (KEEP)

| Script | Function |
|--------|----------|
| `init-session.sh` | Creates skeleton files |
| `loop-status.sh` | Reports status (exit 0) |
| `session-checkpoint.sh` | Saves state snapshot |
| `score-confidence.sh` | Pure scoring computation |
| `hm-codescan.sh` | Read-only code scanning |
| `hm-artifact-create.sh` | Creates empty file with naming |
| `hm-artifact-validate.sh` | Validates filename + structure |
| `hm-packet-validate.sh` | Validates packet schema |
| `extract-requirements.sh` | Reads + categorizes text |
| `hm-synthesis-validate.sh` | Validates report structure |
| `hm-refactor-verify.sh` | Runs build/test/lint |
| `hm-activity-classify.sh` | Classifies file paths |
| `hm-atomic-commit.sh` | Stages + commits |
| `check-mcp-readiness.mjs` | Checks MCP availability |
| `check-research-readiness.mjs` | Checks MCP tool availability |
| `hm-ideating-validate.sh` | Validates artifact structure |

### ❌ BAN — Governance/State/Paths (REMOVE)

| Script | Reason |
|--------|--------|
| `verify-hierarchy.sh` (×5) | Blocking gates + 10 hardcoded paths |
| `register-skill.sh` (×5) | State mutation + hardcoded paths |
| `check-gate.sh` | 5 blocking gates (G1-G5) |
| `coordination-check.sh` | Pre-dispatch blocking |
| `preflight.sh` | GROUP scoring algorithm |
| `route-check.sh` | Route validation + hardcoded paths |
| `stack-validate.sh` | Stacking validation + hardcoded paths |
| `intent-verify.sh` | 11 blocking conditions |
| `gate-enforce.sh` | Quality scoring gate |
| `validate-gate.sh` | Multi-gate preflight + state creation |
| `hm-verify.cjs` | Full governance suite (1,014 LOC) |
| `context-harness-init.cjs` | State + rot scoring + permission gates |
| `hm-entry-gate.cjs` | Universal project validity gate |

---

**Status**: ✅ Research Complete  
**Validation**: User assumption CONFIRMED with evidence  
**Next**: Proceed with script remediation and skill replacement mapping
