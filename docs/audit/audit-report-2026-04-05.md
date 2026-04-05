# Harness Audit Report — 2026-04-05

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Health** | ⚠️ WARNING |
| **Critical Issues** | 8 |
| **Warnings** | 14 |
| **Informational** | 12 |
| **Claims Verified** | 42 total: 22 MATCH, 11 GAP, 2 HALLUCINATION, 0 ORPHAN, 7 OUTDATED |

The HiveMind V3 harness is **functional but significantly diverged from its documented architecture**. The most severe issues are: (1) `coordinator.md` has corrupt YAML that would cause unpredictable behavior, (2) `plugin.ts` contains business logic instead of being a thin wiring layer, (3) three commands reference hardcoded absolute paths to external worktrees, and (4) multiple agent definitions are near-duplicates creating ambiguous routing.

---

## Critical Issues (Must Fix)

### C1: `coordinator.md` — Corrupt Agent Definition
- **Location:** `.opencode/agents/coordinator.md`
- **Description:** Malformed YAML with duplicate `permission:` key (lines 6 and 19). Second block overrides first. Contains broken template literal syntax (`${todoHookNote}`), garbled JavaScript-like return statements, and duplicated todo management sections (lines 49-108 and 111-162 are near-identical). Has non-standard `doom_loop: ask` permission.
- **Impact:** Agent definition would fail YAML parsing or produce unpredictable behavior. Any command routed to this agent would behave erratically.
- **Phase:** 3 (Governance)

### C2: `plugin.ts` — Business Logic in Composition Root
- **Location:** `src/plugin.ts` (447 LOC)
- **Description:** Stated target is <100 LOC with "no business logic." Actual: 447 LOC containing AGENT_DEFAULTS config, AGENT_TOOLS restrictions, `getPermissionRulesForAgent()` with full permission arrays, `isValidAgent()`/`normalizeCategory()` validation, circuit breaker enforcement, tool call budget enforcement, delegation depth checking, root session resolution, and prompt building. Uses `any` type cast (line 52) violating "no any types" rule.
- **Impact:** Violates core architecture principle. Composition root should be thin wiring; all business logic should live in `src/lib/` modules.
- **Phase:** 1, 2 (Inventory, Claim-vs-Reality)

### C3: `hf-audit.md`, `hf-create.md`, `hf-stack.md` — Hardcoded External Worktree Paths
- **Location:** `.opencode/commands/hf-audit.md:14`, `hf-create.md:14`, `hf-stack.md:14`
- **Description:** All three commands reference `@/Users/apple/hivemind-plugin/.worktrees/hivefiver-v2/.opencode/hivefiver/workflows/{audit,create,stack}.md` — absolute macOS paths to a different worktree. If that worktree doesn't exist or is stale, these commands break silently.
- **Impact:** Commands are non-portable and fragile. Will fail on any machine other than the developer's.
- **Phase:** 3, 4 (Governance, Cross-Platform)

### C4: `researcher.md` / `explore.md` — Near-Identical Agent Bodies
- **Location:** `.opencode/agents/researcher.md` (411 lines), `.opencode/agents/explore.md` (410 lines)
- **Description:** Both agents share the same "Hivexplorer — Repository Investigator" title, identical operating principles, and the same 410-line tool taxonomy sections. Both have duplicate `todoread`/`todowrite` permission entries.
- **Impact:** Ambiguous routing. Conductor delegates to "researcher" but "explore" exists as a functional duplicate. Wastes context and creates confusion.
- **Phase:** 3 (Governance)

### C5: Four Primary Orchestrator Agents with Overlapping Responsibilities
- **Location:** `.opencode/agents/{conductor,coordinator,hivefiver,hivefiver-orchestrator}.md`
- **Description:** Four agents all serve as "primary orchestrator" with overlapping responsibilities. `conductor` and `coordinator` have identical descriptions but different delegation mechanisms (`delegate-task` vs `task`). `hivefiver` is not assigned to any command (orphan agent). `hivefiver-orchestrator` references `hivefiver-tool-builder` agent which does not exist.
- **Impact:** No clear boundary between orchestrators. Commands may route to wrong orchestrator. `hivefiver-orchestrator` will fail when trying to delegate to non-existent agent.
- **Phase:** 3 (Governance)

### C6: `src/lib/AGENTS.md` — Governance File in Hard Harness
- **Location:** `src/lib/AGENTS.md` (79 LOC)
- **Description:** A governance/documentation file inside the hard harness `src/lib/` directory. Hard harness should contain only `.ts` code. This file belongs in `.opencode/` or root `AGENTS.md`.
- **Impact:** Violates the hard/soft separation principle. This file gets compiled into `dist/` and published to npm.
- **Phase:** 1 (Inventory)

### C7: `package.json` Publishes `.opencode/` to npm
- **Location:** `package.json` `files` array
- **Description:** The `files` array includes `.opencode`, meaning soft meta-concepts (skills, agents, commands, rules) are published to npm alongside the hard harness. This also includes `.opencode/node_modules/`, `.opencode/trashskills/`, and other non-essential content.
- **Impact:** Violates separation principle. npm package bloat. Exposes internal tooling artifacts to consumers.
- **Phase:** 1 (Inventory)

### C8: `types.ts` Is Not a Leaf Module
- **Location:** `src/lib/types.ts:1`
- **Description:** AGENTS.md claims "types.ts is leaf — depends on nothing." Reality: `types.ts` line 1 imports `TaskStatus` from `./task-status.js`. The entire dependency graph documentation is based on an incorrect premise.
- **Impact:** Dependency chain depth is 3 levels (lifecycle-manager → helpers → types → task-status), not 2 as documented. Any reasoning about ripple effects from `types.ts` changes is partially incorrect.
- **Phase:** 2 (Claim-vs-Reality)

---

## Warnings (Should Fix)

### W1: Module Size Exceeds 500 LOC Limit
- **Location:** `src/lib/continuity.ts` (638 LOC, +28%), `src/lib/lifecycle-manager.ts` (705 LOC, +41%)
- **Description:** AGENTS.md states "Max module size: 500 LOC." Two modules significantly exceed this. `continuity.ts` contains three separable concerns (normalization, cloning, CRUD).
- **Impact:** Modules are harder to maintain and test. Violates stated architecture constraint.

### W2: `oh-my-openagent-reference copy` — Duplicate Skill with Space in Directory Name
- **Location:** `.opencode/skills/oh-my-openagent-reference copy/`
- **Description:** Identical content to `oh-my-openagent-reference/`. Directory name contains a space, which breaks glob patterns, bash scripts, and skill loading mechanisms. Both skills have no trigger phrases (invisible to auto-loading).
- **Impact:** Wastes context. Space in path causes tooling failures.

### W3: `repomix-exploration-guide` / `repomix-explorer` — Content Duplication
- **Location:** `.opencode/skills/repomix-exploration-guide/`, `.opencode/skills/repomix-explorer/`
- **Description:** Both skills cover repomix usage (pack_codebase, grep_repomix_output, read_repomix_output, generate_skill). `repomix-exploration-guide` has no trigger phrases; `repomix-explorer` has explicit triggers. `repomix-exploration-guide` contains hardcoded placeholder paths and citation markers from auto-generated content.
- **Impact:** One of these should be removed or merged. Loading both wastes context with duplicated content.

### W4: `meta-builder` Trigger Overlaps with All Specialist Skills
- **Location:** `.opencode/skills/meta-builder/SKILL.md`
- **Description:** `meta-builder` acts as a router but its triggers directly overlap with all specialist skills it routes to: `use-authoring-skills`, `agents-and-subagents-dev`, `command-dev`, `custom-tools-dev`, `skill-synthesis`. Non-deterministic loading order dependency.
- **Impact:** If `meta-builder` is not loaded first, specialist skills fire directly, bypassing the routing layer.

### W5: `continuity.ts` Mixed Concerns
- **Location:** `src/lib/continuity.ts`
- **Description:** Contains normalization functions (lines 122-488), clone functions (lines 490-555), and CRUD functions (lines 557-638). Three distinct concerns in one file. Module-level `storeCache` singleton prevents isolated unit testing.
- **Impact:** Harder to test and maintain. Could be split into 2-3 modules.

### W6: `asString` Duplication
- **Location:** `src/lib/helpers.ts:33`, `src/lib/continuity.ts:110`
- **Description:** Identical `asString` function exists in both files. The `continuity.ts` version is local (not exported).
- **Impact:** Code duplication. Changes to one won't propagate to the other.

### W7: Missing CLI Substrate
- **Location:** No `bin/` directory exists
- **Description:** AGENTS.md claims "CLI substrate (~500 LOC)" as part of target architecture. No CLI files exist.
- **Impact:** Missing planned feature. No command-line interface for the harness.

### W8: Only 1 of 5 Planned Tools Implemented
- **Location:** `src/plugin.ts`
- **Description:** Target architecture claims "5 tools (~500 LOC total)." Only `delegate-task` tool exists.
- **Impact:** 80% of planned tool surface is missing.

### W9: `hivefiver-orchestrator` References Non-Existent Agent
- **Location:** `.opencode/agents/hivefiver-orchestrator.md`
- **Description:** Routing table references `hivefiver-tool-builder` agent. This agent does not exist in `.opencode/agents/`.
- **Impact:** Delegation to tool-building tasks will fail silently or route incorrectly.

### W10: Undocumented Environment Variable
- **Location:** `src/lib/lifecycle-manager.ts:133`
- **Description:** `OPENCODE_HARNESS_CONCURRENCY_LIMIT` is read but not documented in AGENTS.md.
- **Impact:** Users cannot configure concurrency limit without reading source code.

### W11: Auto-Loop/Ralph-Loop Not Implemented
- **Location:** `src/` (absent)
- **Description:** AGENTS.md claims "Background agents, auto-loop/ralph-loop" as runtime features. No auto-loop logic found in `src/`.
- **Impact:** Claimed feature does not exist.

### W12: Skill References Missing Scripts/References
- **Location:** Multiple skills
- **Description:** `coordinating-loop`, `use-authoring-skills`, `skill-synthesis`, `user-intent-interactive-loop` all reference bash scripts (`scripts/*.sh`) and reference files that do not exist in their directories.
- **Impact:** Skills reference non-existent resources. Gate enforcement and validation scripts are non-functional.

### W13: `plan.md` / `ultrawork.md` Contradictory Behavior
- **Location:** `.opencode/commands/plan.md`, `ultrawork.md`
- **Description:** `plan.md` requires user approval before execution and tells user to run `/start-work`. `ultrawork.md` says "Do not ask for clarification. Classify the intent and act." Both assigned to conductor.
- **Impact:** Contradictory instructions for similar use cases.

### W14: `deep-init.md` / `deep-research-synthesis-repomix.md` — Not Valid Commands
- **Location:** `.opencode/commands/deep-init.md` (303 lines), `deep-research-synthesis-repomix.md` (620 lines)
- **Description:** Neither file has YAML frontmatter. `deep-research-synthesis-repomix.md` is a 620-line reference document with citation markers, not an executable command. `deep-init.md` has dynamic agent spawning logic — non-deterministic.
- **Impact:** These are reference documents mislabeled as commands. Will not execute as expected.

---

## Informational

### I1: `agent-registry.ts` and `notification-handler.ts` Not Re-Exported
- **Location:** `src/index.ts`
- **Description:** Only 11 of 13 `src/lib/` modules are re-exported from `index.ts`.
- **Impact:** These modules are internal-only. Intentional or oversight?

### I2: `task-status.ts` Much Smaller Than Documented
- **Location:** `src/lib/task-status.ts` (21 lines)
- **Description:** `src/lib/AGENTS.md` estimates "~100 LOC." Actual is 21 lines.
- **Impact:** Minor documentation inaccuracy.

### I3: `runtime.ts` Grown Beyond Documented Estimate
- **Location:** `src/lib/runtime.ts` (69 lines)
- **Description:** `src/lib/AGENTS.md` estimates "~43 LOC." Actual is 69 lines (+60%).
- **Impact:** Minor documentation inaccuracy.

### I4: `.opencode/trashskills/` Directory
- **Location:** `.opencode/trashskills/`
- **Description:** Contains 4 discarded skill SKILL.md files. Not excluded from npm package `files` array.
- **Impact:** Minor bloat. Should be `.gitignore`d or excluded from package.

### I5: `.opencode/node_modules/` in Repository
- **Location:** `.opencode/node_modules/`
- **Description:** Contains `@kilocode/plugin`, `@kilocode/sdk`, `@opencode-ai/plugin`, `@opencode-ai/sdk`, and `zod`. Not excluded from npm package.
- **Impact:** Repo bloat. Should be in root `node_modules/` or excluded from package.

### I6: Inconsistent Path Prefixes in Agent Definitions
- **Location:** `.opencode/agents/{builder,critic}.md`
- **Description:** References mix `.opencode/rules/` and `opencode/rules/` (with and without leading dot).
- **Impact:** May cause file resolution failures depending on platform.

### I7: `researcher.md` / `explore.md` Permission Inconsistency
- **Location:** `.opencode/agents/{researcher,explore}.md`
- **Description:** Description says "Never mutates files" but permissions allow `edit`/`write` for `*.json`, `*.md`, `**/.opencode/**`, `**/docs/**`.
- **Impact:** Permissions are broader than stated role.

### I8: `coordinating-loop` References External Skill
- **Location:** `.opencode/skills/coordinating-loop/SKILL.md`
- **Description:** Cross-references `dispatching-parallel-agents` skill which is NOT in this project's `.opencode/skills/` directory (exists globally at `~/.cache/opencode/node_modules/superpowers/skills/`).
- **Impact:** Works if superpowers is installed, but not self-contained.

### I9: `skill-synthesis` Network Dependency
- **Location:** `.opencode/skills/skill-synthesis/SKILL.md`
- **Description:** Fetches `https://agentskills.io/llms.txt` at runtime.
- **Impact:** Requires network access. Fails offline.

### I10: `continuity.ts` Module-Level Singleton
- **Location:** `src/lib/continuity.ts:26`
- **Description:** `let storeCache: ContinuityStoreFile | undefined` — module-level mutable singleton.
- **Impact:** Prevents isolated unit testing. Confirmed code smell in `src/lib/AGENTS.md`.

### I11: AGENTS.md Documentation Outdated
- **Location:** `AGENTS.md` lines 128-130
- **Description:** Claims "6 agents," "5 skills," "6 commands." Reality: 11 agents, 16 skills, 10 commands.
- **Impact:** Documentation significantly lags behind actual project state.

### I12: Codebase Under Target Size
- **Location:** `src/` total: 2,810 LOC
- **Description:** AGENTS.md targets "~4,000-5,000 LOC." Current is 29-44% below lower bound.
- **Impact:** Missing CLI substrate, 4 of 5 tools, and separate hook modules account for the gap.

---

## Claim vs Reality Table

| Claim | Source | Status | Evidence |
|-------|--------|--------|----------|
| Max module size: 500 LOC | AGENTS.md:70,109 | GAP | continuity.ts=638, lifecycle-manager.ts=705 |
| types.ts is leaf | AGENTS.md:47,66 | HALLUCINATION | Imports TaskStatus from task-status.js |
| helpers/concurrency/completion-detector leaf | AGENTS.md:67 | MATCH | concurrency/completion-detector=0 imports, helpers=1 |
| lifecycle-manager deepest chain: 2 levels | AGENTS.md:68 | GAP | Actual chain is 3 levels (→helpers→types→task-status) |
| No circular dependencies | AGENTS.md:69 | MATCH | Full import graph traced, no cycles |
| plugin.ts target <100 LOC | AGENTS.md:44 | GAP | Actual: 447 LOC (4.47x over) |
| continuity.ts ~635 LOC | AGENTS.md:52 | MATCH | Actual: 638 (within 0.5%) |
| lifecycle-manager.ts ~500 LOC | AGENTS.md:57 | OUTDATED | Actual: 705 (+41%) |
| 5 tools (~500 LOC) | AGENTS.md:147 | HALLUCINATION | Only 1 tool exists (delegate-task) |
| hooks (~800 LOC) | AGENTS.md:147 | GAP | ~190 LOC embedded in plugin.ts |
| lifecycle (~400 LOC) | AGENTS.md:147 | GAP | lifecycle-manager.ts=705 |
| delegation (~400 LOC) | AGENTS.md:147 | GAP | No standalone module; ~333 LOC split across files |
| continuity (~400 LOC) | AGENTS.md:147 | GAP | continuity.ts=638 |
| CLI substrate (~500 LOC) | AGENTS.md:147 | HALLUCINATION | No bin/ directory exists |
| control-plane (~400 LOC) | AGENTS.md:147 | MATCH | plugin.ts=447 ≈ 400 |
| shared (~800 LOC) | AGENTS.md:147 | MATCH | 887 LOC across 9 modules |
| Total ~4,000-5,000 LOC | AGENTS.md:143 | GAP | Actual: 2,810 |
| Target ~20 SKILL.md files | AGENTS.md:144 | GAP | 16 skills (incl. 1 duplicate) |
| 6 agents defined | AGENTS.md:128 | OUTDATED | 11 agents exist |
| 5 skills defined | AGENTS.md:129 | OUTDATED | 16 skills exist |
| 6 commands defined | AGENTS.md:130 | OUTDATED | 10 commands exist |
| Node.js >= 20.0.0 | AGENTS.md:33 | MATCH | package.json engines field |
| Peer dep: @opencode-ai/plugin >= 1.1.0 | AGENTS.md:34 | MATCH | package.json peerDependencies |
| No env vars for build/test | AGENTS.md:35 | MATCH | Verified in package.json scripts |
| Runtime state overrides documented | AGENTS.md:36 | GAP | OPENCODE_HARNESS_CONCURRENCY_LIMIT undocumented |
| Runtime state path | AGENTS.md:120 | MATCH | continuity.ts confirms |
| Deep-clone-on-read | AGENTS.md:105 | MATCH | continuity.ts clone* functions |
| [Harness] error prefix | AGENTS.md:106 | MATCH | All thrown errors use prefix |
| Dual-layer state | AGENTS.md:107 | MATCH | JSON file + in-memory Maps |
| Background agents | AGENTS.md:18 | GAP | observeBackgroundCompletion exists |
| Auto-loop/ralph-loop | AGENTS.md:18 | GAP | Not implemented in src/ |
| Delegation chain with persistence | AGENTS.md:18 | MATCH | plugin.ts + continuity.ts |
| Task queuing | AGENTS.md:18 | MATCH | concurrency.ts DelegationConcurrencyQueue |
| Category system | AGENTS.md:18 | MATCH | types.ts VALID_DELEGATION_CATEGORIES |
| Session recovery | AGENTS.md:18 | MATCH | lifecycle-manager.ts hydrateFromContinuity |
| Plugin thin wrapper | AGENTS.md:126 | MATCH | .opencode/plugins/ exists |
| asString duplicated | src/lib/AGENTS.md | MATCH | helpers.ts:33 + continuity.ts:110 |
| continuity.ts storeCache singleton | src/lib/AGENTS.md | MATCH | Module-level mutable singleton |
| continuity.ts mixed concerns | src/lib/AGENTS.md | MATCH | Normalization + clone + CRUD |
| task-status.ts ~100 LOC | src/lib/AGENTS.md | OUTDATED | Actual: 21 lines |
| runtime.ts ~43 LOC | src/lib/AGENTS.md | OUTDATED | Actual: 69 lines |
| routing.ts deleted | src/lib/AGENTS.md | MATCH | No routing.ts exists |
| session-completion-tracker.ts deleted | src/lib/AGENTS.md | MATCH | Replaced by CompletionDetector |

---

## Context Poisoning Map

| Artifacts | Overlap Type | Risk | Description |
|-----------|-------------|------|-------------|
| meta-builder ↔ use-authoring-skills | Trigger Overlap | HIGH | Both fire on "create a skill" / "audit this skill" |
| meta-builder ↔ agents-and-subagents-dev | Trigger Overlap | HIGH | Both fire on "create an agent" / "build an agent" |
| repomix-exploration-guide ↔ repomix-explorer | Trigger Overlap | HIGH | Both cover repomix usage; one has no triggers |
| oh-my-openagent-reference ↔ oh-my-openagent-reference copy | Trigger Overlap | HIGH | Identical content; copy has space in directory name |
| conductor ↔ coordinator | Instruction Conflict | HIGH | Identical descriptions, different delegation mechanisms |
| researcher ↔ explore | Instruction Conflict | HIGH | Near-identical bodies (same title, same 410-line taxonomy) |
| conductor ↔ hivefiver ↔ coordinator ↔ hivefiver-orchestrator | Instruction Conflict | HIGH | Four primary orchestrators with overlapping responsibilities |
| coordinator.md (self) | Instruction Conflict | HIGH | Malformed YAML, broken template literals, garbled content |
| meta-builder ↔ command-dev | Trigger Overlap | MEDIUM | Both share "agent:" and "subtask:" triggers |
| meta-builder ↔ custom-tools-dev | Trigger Overlap | MEDIUM | Both trigger on plugin/tool creation |
| meta-builder ↔ skill-synthesis | Trigger Overlap | MEDIUM | Both handle skill-related meta-concept requests |
| coordinating-loop ↔ user-intent-interactive-loop | Trigger Overlap | MEDIUM | Both handle multi-agent workflow orchestration |
| command-dev ↔ opencode-non-interactive-shell | Trigger Overlap | MEDIUM | Both cover non-interactive shell mandates |
| plan.md ↔ ultrawork.md | Ambiguous Routing | MEDIUM | Contradictory: one requires approval, one says "act" |
| hf-audit.md ↔ harness-audit.md | Ambiguous Routing | MEDIUM | Both respond to "audit skills" with different scopes |
| hf-audit/hf-create/hf-stack | Ambiguous Routing | MEDIUM | All reference external worktree paths |

---

## Cross-Platform Matrix

| Factor | macOS | Linux | Windows |
|--------|-------|-------|---------|
| **Unix commands (find, wc, awk, sed, sort)** | ✅ Native | ✅ Native | ❌ Requires WSL/Git Bash |
| **HOMEBREW_NO_AUTO_UPDATE** | ✅ Relevant | ⚠️ No effect | ❌ No effect |
| **DEBIAN_FRONTEND** | ⚠️ No effect | ⚠️ Debian/Ubuntu only | ❌ No effect |
| **timeout command** | ❌ Needs gtimeout | ✅ Native | ❌ No equivalent |
| **/tmp/ paths** | ✅ Works | ✅ Works | ❌ Uses %TEMP% |
| **bash scripts (.sh)** | ✅ Native | ✅ Native | ❌ Not executable |
| **yes \| pipe** | ✅ Native | ✅ Native | ❌ No yes command |
| **Hardcoded /Users/apple/ paths** | ⚠️ User-specific | ❌ Wrong path | ❌ Wrong path |
| **Forward-slash paths in Node.js** | ✅ Native | ✅ Native | ⚠️ Works via normalization |
| **git worktree** | ✅ Native | ✅ Native | ⚠️ Works, syntax differs |

### Undeclared Tool Dependencies

| Tool | Assumed | Declared | Platform-Specific |
|------|---------|----------|-------------------|
| find, wc, awk, sed, sort, uniq, head | ✅ | ❌ | ✅ Unix-only |
| bash | ✅ | ❌ | ✅ Unix-only |
| timeout, rm, yes | ✅ | ❌ | ✅ Unix-only |
| jq, repomix, npx, git, curl, wget, tar, unzip | ✅ | ❌ | ❌ Cross-platform |
| madge, llm | ✅ | ❌ | ❌ Cross-platform |

---

## Recommendations (Prioritized)

### P0 — Immediate (Blocks Correct Operation)
1. **Fix `coordinator.md`** — Repair YAML, remove duplicate permission blocks, fix template literals, or remove the agent entirely if redundant with `conductor.md`.
2. **Remove or fix `hivefiver-tool-builder` reference** — Either create the missing agent or update `hivefiver-orchestrator.md` routing table.
3. **Fix hardcoded worktree paths** in `hf-audit.md`, `hf-create.md`, `hf-stack.md` — Use relative paths or `$ARGUMENTS` for workflow file locations.

### P1 — High Priority (Architecture Violations)
4. **Refactor `plugin.ts`** — Extract business logic into `src/lib/` modules. Target: <100 LOC wiring layer.
5. **Remove `src/lib/AGENTS.md`** — Move governance content to root `AGENTS.md` or `.opencode/`.
6. **Fix `package.json` `files` array** — Exclude `.opencode/node_modules/`, `.opencode/trashskills/`, and consider whether `.opencode/` should be published at all.
7. **Merge or remove duplicate agents** — `researcher.md`/`explore.md` are near-identical. `conductor.md`/`coordinator.md` have identical descriptions.
8. **Fix `types.ts` import** — Either make it truly leaf (inline TaskStatus) or update AGENTS.md documentation.

### P2 — Medium Priority (Quality of Life)
9. **Split `continuity.ts`** — Separate normalization, cloning, and CRUD into distinct modules.
10. **Deduplicate `asString`** — Single source of truth in `helpers.ts`.
11. **Remove `oh-my-openagent-reference copy`** — Delete the duplicate skill directory.
12. **Merge `repomix-exploration-guide` into `repomix-explorer`** — One skill with triggers and full reference content.
13. **Document `OPENCODE_HARNESS_CONCURRENCY_LIMIT`** — Add to AGENTS.md env var section.
14. **Fix `meta-builder` trigger overlaps** — Either make it the exclusive router (disable specialist triggers) or remove the routing layer.

### P3 — Low Priority (Documentation Hygiene)
15. **Update AGENTS.md counts** — Agents: 11, Skills: 16, Commands: 10.
16. **Update module LOC estimates** in `src/lib/AGENTS.md`.
17. **Add missing scripts** referenced by skills or remove the references.
18. **Resolve `plan.md`/`ultrawork.md` contradiction** — Clarify when each applies.
19. **Reclassify `deep-init.md`/`deep-research-synthesis-repomix.md`** — Move to `docs/` or add proper YAML frontmatter.

---

## Mandate Gate Assessment

| Gate Condition | Status | Details |
|---------------|--------|---------|
| Hard harness contains soft meta-concepts | ❌ FAIL | `src/lib/AGENTS.md` is governance in hard harness |
| Circular dependencies in delegation chains | ✅ PASS | No circular dependencies found |
| Claims of 100% completion mismatch reality | ❌ FAIL | 11 GAP + 2 HALLUCINATION + 7 OUTDATED claims |
| Context poisoning causing workflow failures | ❌ FAIL | 4 HIGH-risk overlaps, 1 corrupt agent definition |
| OS-specific assumptions breaking other platforms | ❌ FAIL | 3 commands with hardcoded macOS paths, extensive Unix-only commands |
| Skills editing files directly instead of delegating | ✅ PASS | Skills follow delegation patterns |
| Commands with ambiguous/non-deterministic execution | ❌ FAIL | `deep-init.md` non-deterministic, `plan.md`/`ultrawork.md` contradictory |

**Mandate Gate: FAILED** — 5 of 7 gates failed. This audit reports facts only. Remediation requires separate implementation work.

---

*Report generated: 2026-04-05*
*Audit phases: 4 parallel subagents (Source Inventory, Claim-vs-Reality, Governance Coherence, Cross-Platform)*
*Total claims verified: 42*
*Total issues found: 34 (8 Critical, 14 Warning, 12 Informational)*
