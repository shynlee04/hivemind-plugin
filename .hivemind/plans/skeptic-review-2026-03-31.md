# Skeptic Review — Investigation Findings — 2026-03-31

**Reviewed by:** code-skeptic
**Date:** 2026-03-31
**Reports Reviewed:**
1. `runtime-event-wiring-investigation-2026-03-31.md` (274 lines)
2. `plugins-vs-tools-architecture-audit-2026-03-31.md` (360 lines)
3. `tool-functionality-verification-2026-03-31.md` (285 lines)

---

## Executive Summary

The three investigation reports are thorough in scope but suffer from three systemic problems: (1) they treat SDK documentation as ground truth while the actual running code may use different hook names — a classic "docs vs reality" inversion, (2) they use trajectory (the simplest tool) as the "canonical" baseline for all complexity judgments, which is like measuring a sedan's fuel economy against a bicycle, and (3) they flag placeholder tools as "problems" when the source code explicitly documents them as intentional phased rollouts. The reports correctly identify dead code (`dashboard-v2/`), the tool count discrepancy (12 vs AGENTS.md's 7), and the journal test path mismatch. But they overstate the severity of hook name "mismatches," misclassify intentional design decisions as bugs, and propose decomposition strategies that would increase total complexity rather than reduce it.

---

## False Assumptions Found

| Claim | Why It's Wrong | Evidence | Severity |
|-------|----------------|----------|----------|
| "`addEvent()` and `addDiagnostic()` no-ops = data loss gap" (Report 1, Finding #4) | The source comment explicitly states: "V3 does not store events in-session; events go to separate files." This is an intentional migration artifact, not a bug. The investigators assumed no-op = broken without verifying where V3 events actually route. | `consolidated-writer.ts:325-348` — comment explains the design. Report admits `addTurn()` and `incrementCounter()` still work. | Medium |
| "`permission.ask` vs `permission.asked` = name mismatch may cause silent failure" (Report 1, Critical Gap #2) | AGENTS.md explicitly lists `permission.ask` as **Active** in the Plugin Hooks table. The investigators trusted `.sdk-lib/opencode/opencode-plugins.md` documentation over the project's own verified authority file. If this hook didn't fire, the auto-allow behavior for HiveMind tools would be broken — and someone would have noticed. | `AGENTS.md` Plugin Hooks table: `permission.ask` → Active. `opencode-plugin.ts:154-171` — wired and functional. | High |
| "`command.execute.before` vs `command.executed` = name mismatch may cause silent failure" (Report 1, Critical Gap #3) | Same error as above. AGENTS.md lists `command.execute.before` as **Active**. OpenCode's SDK may expose both `command.executed` (event) and `command.execute.before` (hook) — they serve different purposes. The investigators conflated event names with hook names. | `AGENTS.md` Plugin Hooks table: `command.execute.before` → Active. `opencode-plugin.ts:185-225` — wired and functional. | High |
| "`chat.message` hook — Not in OpenCode's official event list. May silently fail" (Report 1, Critical Gap #1) | The report itself shows the hook is wired at `opencode-plugin.ts:136-153` and performs real work (resets turn snapshot, shows degraded-mode toast). If it silently failed, the toast would never appear and turn snapshots would never reset. The fact that the code path exists and does work suggests the hook fires. "May silently fail" is speculation without runtime evidence. | `opencode-plugin.ts:136-153` — real logic, not a stub. Report 2 confirms it as Active. | Medium |
| "12 of 13 tools are fully functional" (Report 3, Summary) | Report 3 itself documents that `hivemind_hm_init` AND `hivemind_hm_doctor` are placeholders. That's 2 of 13 not fully functional, not 1. The summary contradicts the detailed findings. | Report 3, Per-Tool sections for init and doctor — both explicitly marked PLACEHOLDER. | Low |
| "These are test bugs, not tool bugs" (Report 3, re: journal failures) | The journal tool truncates session IDs to 8 characters. The test uses full IDs. This IS a tool design issue — why does the implementation truncate? If truncation is intentional for filesystem compatibility, the test is wrong. If truncation is a bug, the tool is wrong. Dismissing it as "just a test bug" without verifying the truncation rationale is premature. | `src/features/event-tracker/paths.ts:84` — `truncateSessionId()`. Report identifies mismatch but doesn't explain WHY truncation exists. | Medium |
| "trajectory is the canonical pattern" (Report 2, LOC Ratio section) | Trajectory has 6 simple actions on a single data type. Using it as the baseline for ALL tools is like using a CRUD endpoint as the baseline for an entire API. `agent-work-contract` manages contracts with schema validation, intent classification, chain execution, and persistence — it's a different order of complexity entirely. | Report 2, LOC Ratio table — trajectory used as 1.0× baseline for everything. | High |

---

## Over-Engineering Risks

| Proposal | Why It's Over-Engineered | Simpler Alternative |
|----------|--------------------------|---------------------|
| Decompose `event-tracker` into `event-classifier/`, `event-writer/`, `event-parser/` (Report 2) | Splitting a 2,601 LOC module into 3 sub-modules of ~800 LOC each doesn't reduce complexity — it adds 3 new import boundaries, 3 new barrel files, and cross-module dependencies. The current 3-subdirectory structure (`classifier/`, `parser/`, `writers/`) already provides logical separation. The recommendation is reorganizing for the sake of reorganizing. | Keep current structure. Focus on reducing the 3 god files (>300 LOC) by extracting helper functions, not by creating new module boundaries. |
| Decompose `runtime-entry` into `bootstrap/`, `attachment/`, `command-routing/`, `continuity/` (Report 2) | A 3,301 LOC, 25-file module split into 4 sub-modules would create ~6-8 files each with new cross-imports. `runtime-entry` is the bootstrap/init/harness/command-routing layer — it's inherently cross-cutting by nature. Splitting it creates artificial boundaries between tightly coupled concerns (bootstrap needs attachment, attachment needs command routing). | Identify the 2-3 largest files within `runtime-entry` and extract pure functions. Don't create new module boundaries for concerns that are inherently coupled. |
| Split `hivefiver-setting` into `hivemind_hm_setting` + `hivemind_hm_dashboard` (Report 2) | Creating a new tool just for dashboard rendering adds a new tool registration, new tool schema, new tool tests, and a new entry in the plugin. The dashboard is a mode flag on the existing tool — it's already conditionally loaded. Splitting creates two tools where one mode flag suffices. | Keep as single tool. Extract dashboard rendering into a separate file within the same tool directory. The upward dependency violations are the real issue, not the tool count. |
| Move `agent-work-contract` embedded tools to `src/tools/agent-work/` (Report 2) | These tools are feature-local by design — they operate exclusively on `agent-work-contract` state and use its internal schema. Moving them to `src/tools/` would create a new tool directory for 2 tools, adding registration overhead and import complexity. The CQRS boundary is about write vs read, not about physical file location. | Document why these tools live in features/. If the concern is discoverability, add a re-export barrel in `src/tools/` that points to the feature-local tools. |
| Make `@json-render/*` and `ink` optional dependencies (Report 2) | Optional dependencies in npm packages are a maintenance nightmare. They create "works on my machine" scenarios where the dashboard works for some users and silently fails for others. The current approach (always installed, conditionally used) is simpler. | Keep as required dependencies. If bundle size is the concern, use dynamic imports to lazy-load dashboard code. |
| Enforce ≤300 LOC/file as a hard limit (Report 2, implied throughout) | The 300 LOC limit is stated in AGENTS.md but the reports treat it as a universal law. A 442 LOC file that does one thing (write events to files) is simpler than 3 files of 150 LOC each with cross-imports. File size is a smell, not a rule. | Use cognitive complexity and single-responsibility as metrics, not LOC. A 400 LOC file with one clear purpose is better than 3 files of 133 LOC with tangled imports. |

---

## Hidden Costs

| Change | Hidden Cost | Mitigation |
|--------|-------------|------------|
| Renaming `hivefiver-*` directories to `hm-*` (implied by Report 2's consistent use of `hm_` prefix) | Every import path, every test file, every reference in AGENTS.md, every runtime path resolution, and every `.hivemind/` data file that references tool names would need updating. This is a rename across 200+ files minimum. Risk of missed references causing runtime errors. | If renaming is desired, do it as a single atomic commit with `git mv` for all files. Run `npx tsc --noEmit` and full test suite after. |
| Fixing upward dependency violations in `hivefiver-setting` | The tool imports from `sdk-supervisor/`, `control-plane/`, and `session-entry/` because it needs runtime status, command primitives, and intake gates. Removing these imports requires either (a) creating a new shared abstraction layer (more code) or (b) duplicating logic (worse). The "fix" may cost more than the problem. | Document the violations as intentional cross-cutting reads. The tool is a settings inspector — it needs to read from multiple layers. That's its job. |
| Adding tests for 4 untested tools (trajectory, task, handoff, doc) | These tools interact with filesystem state, core trajectory ledgers, workflow authority, and document intelligence. Writing meaningful tests requires mocking the entire state layer or creating integration test fixtures. Estimated effort: 2-3 days per tool. | Start with smoke tests: verify tool factory returns valid tool objects, verify each action handler exists. Add integration tests incrementally. |
| Decomposing god files (>300 LOC) | Extracting functions from `consolidated-writer.ts` (442 LOC) and `markdown-writer.ts` (434 LOC) risks breaking the file-locking logic (`proper-lockfile`) that wraps write operations. If extracted functions don't share the same lock context, race conditions are introduced. | Extract pure helper functions first (formatting, path construction). Leave locked write operations intact. Verify with existing tests after each extraction. |
| Changing tool schemas (if any refactoring affects args) | Existing `.hivemind/` data files may reference tool names or action names. If tool schemas change, old data may become incompatible. The `agentToolCatalog` in `src/tools/index.ts` ties tool metadata to specific action names. | Audit all `.hivemind/` JSON schemas before changing tool interfaces. Version the schemas if changes are needed. |

---

## Missing Context

| What Wasn't Checked | Why It Matters | How to Verify |
|---------------------|----------------|---------------|
| Whether `permission.ask`, `command.execute.before`, and `chat.message` hooks actually fire at runtime | The reports flag these as "may silently fail" based on SDK doc mismatches. If they don't fire, HiveMind's permission gating, command context injection, and message handling are all broken. This is the highest-risk unknown. | Run OpenCode with HiveMind plugin loaded. Trigger a permission prompt, execute a slash command, send a chat message. Check if the hooks fire via log output or TUI toasts. |
| Whether `addEvent()` no-op actually causes data loss in production | Report 1 calls this a "critical finding" but doesn't verify what happens to events in V3. If events route to separate files through a different code path, this is a non-issue. | Trace the event flow from `event-handler.ts` through to disk. Follow the `addTurn()` and `incrementCounter()` paths that DO work. Compare to the `addEvent()` path. |
| Whether `experimental.*` hook names are stable or will break in next OpenCode version | 4 of 12 active hooks use `experimental.*` prefix. If OpenCode removes or renames these, HiveMind loses 33% of its hook coverage overnight. | Check OpenCode's changelog, GitHub issues, or SDK source for deprecation notices on experimental hooks. |
| Whether `@z_ai/coding-helper` is actually used or is a dead dependency | Report 2 flags this as an open question but doesn't investigate. Dead dependencies increase install time, bundle size, and supply chain risk. | Run `grep -r "@z_ai/coding-helper" src/` across the entire codebase. If no imports found, it's dead. |
| Whether the journal test path mismatch is a tool bug or test bug | Report 3 dismisses this as a test bug. But `truncateSessionId()` to 8 characters is an unusual design choice. If the truncation causes collisions (two sessions with same 8-char prefix), data corruption occurs. | Check if `truncateSessionId()` includes collision handling. Verify the truncation length is sufficient for the expected session ID entropy. |
| Whether the plugin actually loads and runs in a real OpenCode instance | All three reports analyze code statically. None verify the plugin loads, hooks register, tools execute, and data persists in a running OpenCode environment. | `npm run build` → load plugin in OpenCode → verify tools appear → execute `hivemind_runtime_status` → verify output. |
| Whether `nlFirstDispatchKeys` Set is populated or always empty | Report 1 flags this as an open question. If it's always empty, the messages transform may be doing unnecessary work. | Search for `.add()` or `.set()` calls on `nlFirstDispatchKeys` across the codebase. |

---

## Priority Re-Ranking

The investigators presented findings without clear priority ordering. Here's the actual risk-based ranking:

### P0 — Verify or Fix Immediately (Could Be Production-Breaking)
1. **Runtime verification of hook names** — Do `permission.ask`, `command.execute.before`, and `chat.message` actually fire? If not, HiveMind's core interception layer is dead. This is the single highest-risk unknown.
2. **Journal truncation collision risk** — Does `truncateSessionId()` to 8 chars cause data collisions? If two sessions share a prefix, their journal entries merge.

### P1 — Fix Before Next Release (Confirmed Issues)
3. **Journal test path mismatch** — 3 failing tests indicate a real design inconsistency. Fix the test OR fix the truncation logic.
4. **Dead code removal** — `dashboard-v2/` (dead stub), standalone exported-but-unused handlers (`handleCompaction`, `handleTextComplete`, `handleSessionIdleEvent`). These are free wins.
5. **`@z_ai/coding-helper` dead dependency** — If unused, remove it. Reduces supply chain risk.

### P2 — Improve When Convenient (Maintenance Debt)
6. **God file decomposition** — Extract pure helpers from `consolidated-writer.ts` and `markdown-writer.ts`. Don't restructure modules; just reduce file size.
7. **Add smoke tests for untested tools** — trajectory, task, handoff, doc. Start with factory tests, not integration tests.
8. **AGENTS.md tool count update** — Change "7 custom tools" to "12 custom tools." Free documentation fix.

### P3 — Nice to Have (Low Value / High Effort)
9. **`hivefiver-setting` upward dependency cleanup** — Document as intentional. The cost of "fixing" exceeds the benefit.
10. **Module decomposition** (`event-tracker`, `runtime-entry`, `agent-work-contract`) — Reorganizing for the sake of reorganizing. Do this only if a specific bug or feature requires it.
11. **Split `hivefiver-setting` into multiple tools** — Creates more complexity, not less.
12. **Make dashboard dependencies optional** — Creates "works on my machine" scenarios.

---

## What NOT to Touch

| Item | Why It Should Be Left Alone |
|------|---------------------------|
| `permission.ask` hook name | It's wired, it's active in AGENTS.md, and it performs real work (auto-allowing HiveMind tools). Renaming it to match SDK docs would break functionality if the SDK docs are wrong. |
| `command.execute.before` hook name | Same as above. The pre-execution hook serves a different purpose than the post-execution `command.executed` event. They're not interchangeable. |
| `agent-work-contract` embedded tools | Moving them to `src/tools/` creates a new tool directory for 2 tools that only operate on one feature's state. The current location is architecturally honest — they're feature-local tools. |
| `event-tracker` module structure | Already has logical subdirectories (`classifier/`, `parser/`, `writers/`). Further decomposition adds import boundaries without reducing cognitive load. |
| `runtime-entry` module structure | Bootstrap, attachment, command routing, and continuity are inherently cross-cutting. Splitting them creates artificial boundaries between tightly coupled concerns. |
| `@json-render/*` and `ink` as required dependencies | Making them optional creates installation variability. The dashboard either works or it doesn't — half-working is worse than not working. |
| `hivemind_hm_init` and `hivemind_hm_doctor` placeholder status | They're explicitly documented as phased rollouts. "Fixing" them means implementing full bootstrap and diagnostic logic — a multi-day effort for tools that currently provide useful (if limited) functionality. |
| The ≤300 LOC/file rule as a hard limit | LOC is a proxy metric. A 442 LOC file with one responsibility is cleaner than 3 files of 150 LOC with cross-imports. Use cognitive complexity, not line counts. |

---

## Verified Concerns

The investigators got these RIGHT — with evidence:

| Concern | Evidence | Why It's Valid |
|---------|----------|----------------|
| **AGENTS.md claims 7 tools but 12 are registered** | Report 1, Tool Registration Audit — 12 tools listed in `opencode-plugin.ts:122-135`. AGENTS.md "Custom Tools" table lists 7. | Documentation is stale. This misleads anyone reading AGENTS.md for the actual tool surface. |
| **`dashboard-v2/` is dead code** | Report 1 — directory only contains `package-lock.json`, no source files, no imports from `src/`. | Dead code increases cognitive load and may confuse future developers. Safe to remove. |
| **`hivefiver-setting` has upward dependency violations** | Report 2 — imports from `sdk-supervisor/`, `control-plane/`, `session-entry/` at `tools.ts:25-28`. | This tool knows about too many layers. It's a god-tool that violates the stated architecture. Should be documented at minimum. |
| **4 tools have zero test coverage** | Report 3 — trajectory, task, handoff, doc have no dedicated test files. | These are core tools managing trajectory, tasks, delegation, and documents. Zero tests means regressions go undetected. |
| **Journal test failures are real** | Report 3 — 3 of 11 journal tests fail due to truncated vs full session ID mismatch. | Even if the tool works, failing tests indicate a design inconsistency that should be resolved. |
| **`classify-intent-tool` is exported but not registered** | Report 1 — exported from barrel at `src/features/agent-work-contract/tools/index.ts:15` but not in plugin tool map. | Either it's dead code (remove the export) or it's intended for future use (document it). Current state is ambiguous. |
| **Build passes cleanly** | Report 3 — `npm run build` and `npx tsc --noEmit` both succeed. | This is important context. The codebase compiles. Any refactoring should maintain this property. |
| **No circular dependencies** | Report 2 — verified by grep across all tool→feature and feature→feature imports. | The dependency graph is a DAG. This is a good property that refactoring should preserve. |

---

## Final Verdict

### **Go with Conditions**

The investigation reports are valuable as a map of the codebase but should NOT be used as a refactoring checklist. The reports conflate three categories:

1. **Real problems** (dead code, stale docs, missing tests, test failures) — fix these.
2. **Intentional design decisions** (placeholder tools, hook names, module structure) — document these, don't change them.
3. **Speculative risks** (hooks "may" silently fail, no-ops "may" cause data loss) — verify these before acting.

### Conditions for proceeding with any refactoring:

1. **Runtime verification first.** Before touching any hook names or module structures, verify that the plugin loads and hooks fire in a real OpenCode instance. Static analysis cannot confirm runtime behavior.
2. **Fix tests before refactoring.** The 3 failing journal tests and 1-2 failing setting tests must pass before any structural changes. Failing tests make it impossible to verify that refactoring didn't break anything.
3. **No module decomposition without a specific bug or feature driving it.** Reorganizing `event-tracker`, `runtime-entry`, or `agent-work-contract` for the sake of "cleaner structure" is churn, not improvement.
4. **Preserve the build.** Any change must pass `npx tsc --noEmit` and `npm run build`. The current clean build state is an asset — don't trade it for uncertain structural improvements.
5. **Document the hook names.** Instead of renaming `permission.ask` to match SDK docs, add a comment in `opencode-plugin.ts` explaining why the name differs and how it was verified to work.

### What to do this week (minimum viable improvement):
- Remove `dashboard-v2/` dead stub
- Update AGENTS.md tool count from 7 to 12
- Fix journal test path mismatch (truncate test session IDs to match implementation)
- Remove `@z_ai/coding-helper` if unused (verify with grep first)
- Add smoke tests for trajectory, task, handoff, doc tools (factory tests only)

### What to defer:
- All module decomposition proposals
- All tool splitting proposals
- All hook name changes
- All dependency optionality changes
