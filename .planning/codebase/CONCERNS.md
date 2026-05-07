# Codebase Concerns

**Analysis Date:** 2026-05-07

---

## Critical Issues

### CONCERN-C1: Primitives Bootstrap Gap — `.opencode/` + `.hivemind/` Not Git-Tracked

- **Issue:** 89 agents, 123 active skill directories (plus `.gitkeep`), and 18 commands exist on disk but **zero** are tracked by git (`git ls-files .opencode/agents/` = 0). If deleted, they are permanently lost. BOOT-02 added init/recover CLI and tool surfaces, but BOOT-03 through BOOT-07 must still prove real recovery behavior end-to-end.
- **Files:** `.opencode/agents/`, `.opencode/skills/`, `.opencode/commands/`, `src/tools/bootstrap-init.ts`, `src/tools/bootstrap-recover.ts`, `src/cli/commands/init.ts`, `src/cli/commands/recover.ts`
- **Evidence:** BOOT-02 summary evidence exists in `.planning/phases/BOOT-02-cli-framework-entry-point/BOOT-02-SUMMARY.md`; remaining risk comes from missing BOOT-03..BOOT-07 runtime proof. Audit: `.planning/audits/PRIMITIVES-AUDIT-2026-05-07.md` §B1-B4.
- **Impact:** `npm install hivemind` in a fresh repo ships only compiled `dist/` with **zero agents, skills, or commands** unless bootstrap/recovery is implemented. The harness core (tools, hooks, state) works but has no delegation routing, no quality gates, no slash commands. Effectively a broken install.
- **Fix approach:**
  1. **Immediate:** classify candidate shipped primitives with MCM doctor, then git-track the approved `.opencode/agents/`, `.opencode/skills/`, and `.opencode/commands/` set.
  2. **This week:** Ship a bootstrap/recovery path that creates the shipped agent/skill/command set after MCM doctor classifies current candidates. Add package lifecycle wiring only after Phase 0 and BOOT gates authorize it.
  3. **Longer term:** Separate GSD-TOOLING from SHIPPED primitives using the Phase 0 lineage contract to avoid packaging developer tooling for end users.

### CONCERN-C2: `conversation_language` Config Has Partial Consumers — Not Fully Wired (D-BIND-03)

- **Issue:** The `conversation_language` field is defined in `src/schema-kernel/hivemind-configs.schema.ts:267` with a Zod schema default `"en"`, but runtime consumption is sparse. It is referenced in `governance-block.ts:86` (language instruction builder) and `behavioral-profile/resolve-behavioral-profile.ts:93`, but there is **no config-compiler path** that populates this field at runtime, and no validation surface enforces it was set.
- **Files:** `src/schema-kernel/hivemind-configs.schema.ts:267`, `src/hooks/governance-block.ts:86`, `src/lib/behavioral-profile/resolve-behavioral-profile.ts:93`, `src/lib/config-subscriber.ts:59`
- **Impact:** The schema is defined, the consumers exist, but the config-subscriber only documents the field (JSDoc comment), not actively populates it. If the configs.json lacks the field, it silently falls back to Zod default `"en"` without surfacing the gap. This violates D-BIND-03 (design contract: every config field must have a verified runtime binding).
- **Fix approach:** Audit the config-subscriber lazy cache path to confirm `conversation_language` survives the round-trip (disk → JSON parse → schema validate → subscriber cache → consumer). Add a dedicated test that verifies `config.conversation_language` is accessible post-hydration.

---

## High Severity

### CONCERN-H0: Shell / PTY Control-Plane Is Cross-Cutting and Under-Specified

- **Issue:** Background command execution, interactive PTY support, headless process fallback, SDK child-session delegation, lifecycle cleanup, permission gating, and future sidecar/tmux projection are spread across multiple runtime surfaces without one explicit control-plane contract.
- **Files:** `src/tools/run-background-command.ts`, `src/lib/pty/`, `src/lib/command-delegation.ts`, `src/lib/delegation-manager.ts`, `src/lib/sdk-delegation.ts`, `src/hooks/`, `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/`.
- **Impact:** f-04 routing and future sidecar workflows may accidentally depend on ambiguous command-session semantics, especially around permissions, output flooding, cleanup, and restart recovery.
- **Fix approach:** Complete CP-PTY-00 docs/spec spike first. Do not implement CP-PTY-01 until BOOT-07 E2E proof exists or the user explicitly authorizes higher-risk runtime mutation.

### CONCERN-H1: Dead Module — `src/hooks/messages-transform.ts`

- **Issue:** 67 LOC file with `summarizeMessages()` export. Confirmed dead by both the source audit and `src/lib/AGENTS.md` documentation ("removed (dead code)" since Phase 35). Zero consumers in all 168 `src/` files. Zero test files.
- **Files:** `src/hooks/messages-transform.ts` (67 LOC)
- **Evidence:** `grep -r "import.*messages-transform" src/` = 0 matches. `src/lib/AGENTS.md` line: "messages-transform removed (dead code)". Audit: `.planning/audits/SRC-MODULE-AUDIT-2026-05-07.md` §1.
- **Impact:** Dead code creates false signals during codebase exploration (agents may try to use `summarizeMessages()`), wastes ~1.9KB disk, and violates the "no dead code" project principle.
- **Fix approach:** Delete file. One-line `rm src/hooks/messages-transform.ts`, verify `npm run typecheck && npm test`.

### CONCERN-H2: 12 Stale Modules — Exist But Not Wired to Production Path

- **Issue:** 12 source modules have zero consumers on the critical runtime path (`plugin.ts` composition graph), or have pre-built tests but are unreachable.
- **Files:**
  - `src/hooks/toggle-gates.ts` (83 LOC) — test exists, zero production consumers.
  - `src/lib/runtime-detection/index.ts` + `src/lib/runtime-detection/stack-synthesizer.ts` (194 LOC) — test exists, `synthesizeTechStack()` unimported.
  - `src/sidecar/readonly-state.ts` (120 LOC) — built for Phase 42, unreachable until Next.js sidecar app imports it.
  - `src/cli/discovery.ts` (77 LOC), `src/cli/renderer.ts` (122 LOC), `src/cli/commands/help.ts` (28 LOC) — CLI tooling, consumed by `cli/index.ts` (separate package.json entry), not runtime harness.
  - `src/schema-kernel/trajectory.schema.ts`, `sdk-supervisor.schema.ts`, `runtime-pressure.schema.ts`, `skill-metadata.schema.ts` — have consumers but zero dedicated tests.
  - `src/lib/primitive-scanners.ts` (182 LOC) — has consumer, zero test coverage.
- **Evidence:** Audit: `.planning/audits/SRC-MODULE-AUDIT-2026-05-07.md` §2-13. Cross-verified: grep import graphs across all 168 source files.
- **Impact:** Stale modules create maintenance burden (they must still compile, typecheck, and pass tests). Agents may reference them as available when they are not actually wired. The 10 schema-kernel files without tests are a test coverage gap (~800 LOC).
- **Fix approach:**
  1. **`toggle-gates.ts`**: Wire into `create-core-hooks.ts` or delete if toggle-gate feature was abandoned.
  2. **`runtime-detection/`**: Wire `synthesizeTechStack()` into `framework-detector.ts` or document as deferred.
  3. **`sidecar/readonly-state.ts`**: Keep (future Phase 42). Add TODO comment linking to Phase 42 plan.
  4. **Schema files**: Add dedicated Zod validation tests (10 files, ~4-6 hours).
  5. **`primitive-scanners.ts`**: Add test coverage (2 hours).

---

## Medium Severity

### CONCERN-M1: Module-Level `storeCache` Singleton in `continuity.ts`

- **Issue:** `src/lib/continuity.ts:24` declares `let storeCache: ContinuityStoreFile | undefined` as a module-level variable. When tests load the module, `storeCache` is shared across all test cases, preventing isolated testing. Tests must either reset the cache manually or accept cross-test pollution.
- **Files:** `src/lib/continuity.ts:24` (`let storeCache`), `src/lib/continuity.ts:240-245` (check-and-populate pattern)
- **Impact:** Tests cannot verify `loadStoreFromDisk()` behavior independently without side effects leaking between test cases. If `storeCache` holds a mutated object, subsequent tests read the mutation.
- **Fix approach:** Option A: Pass `storeCache` as a parameter to functions (functional DI). Option B: Export a `resetStoreCache()` test-only helper. Option C: Move `storeCache` into a class instance. Documented as CODE SMELL #4 in `src/lib/AGENTS.md`.

### CONCERN-M2: `asString` Duplicated in `helpers.ts` and `event-tracker/classifier.ts`

- **Issue:** `asString(value: unknown): string` is defined identically in two modules. `helpers.ts:87` exports it and 39 modules import it from there. `event-tracker/classifier.ts:99` defines a local copy rather than importing.
- **Files:** `src/lib/helpers.ts:87` (exported), `src/lib/event-tracker/classifier.ts:99` (local duplicate)
- **Impact:** Divergence risk — if the canonical helper is updated (e.g., to handle `Symbol`), `classifier.ts` keeps the old behavior. Requires syncing two implementations.
- **Note:** `src/lib/AGENTS.md` lists this as duplicated in `continuity.ts`, but the actual duplicate is in `event-tracker/classifier.ts`. The AGENTS.md claim is stale.
- **Fix approach:** Replace the local `asString` in `event-tracker/classifier.ts:99` with `import { asString } from "../helpers.js"` (already imported for other helpers 3 lines above). Single-line fix.

### CONCERN-M3: `plugin.ts` Exceeds Target (183 LOC vs. 100 LOC)

- **Issue:** `src/plugin.ts` is 183 LOC, exceeding the 100 LOC composition-root target. Contains agent defaults, tool definitions, hook registrations, circuit breaker config, and budget policies all inline.
- **Files:** `src/plugin.ts` (183 LOC)
- **Impact:** As the composition root grows, it accumulates responsibilities (config constants, agent definitions, tool registrations) that should live in dedicated modules. Harder to test the wiring separately from the config.
- **Note:** The earlier concern citing 447 LOC is outdated; `plugin.ts` was already trimmed. Current 183 LOC is 83 over target — not critical but trending toward bloat.
- **Fix approach:** Extract `AGENT_DEFAULTS`, `AGENT_TOOLS`, `CIRCUIT_BREAKER_THRESHOLD`, and `MAX_TOOL_CALLS_PER_SESSION` into `src/lib/agent-config.ts`. Extract tool registration arrays into `src/lib/tool-registry.ts`. Target: `plugin.ts` ≤ 100 LOC (pure wiring only).

### CONCERN-M4: STATE.md Claims Phase 70-71 COMPLETE Without Corresponding Git Evidence

- **Issue:** `.planning/archive/2026-05-07/workstreams/milestone/STATE.md` marks Phases 70 (Prompt Packet Compiler) and 71 (Runtime Detection Engine) as "COMPLETE" with checked boxes and gates. However, the planning audit found no git commits specifically tagged for Phase 70 or Phase 71.
- **Files:** `.planning/archive/2026-05-07/workstreams/milestone/STATE.md:128-129`, Phase 70 directory (prompt-packet), Phase 71 directory (runtime-detection)
- **Evidence:** Audit: `.planning/audits/PLANNING-AUDIT-2026-05-07.md` blocker B-05. Source code for Phase 70 (prompt-packet compiler, kernel-packet types) and Phase 71 (runtime-detection engine) DOES exist in `src/` and compiles/passes tests. However, no git commits carry `phase: 70` or `phase: 71` in the message. The code was likely committed during other phases or bulk-committed without per-phase attribution.
- **Impact:** Traceability gap — cannot confirm which commits delivered Phase 70 vs Phase 71 vs earlier work. If a regression appears in the prompt-packet or runtime-detection code, `git bisect` cannot isolate the introduction by phase.
- **Fix approach:** Cross-reference Phase 70/71 directories against `git log --oneline -- ` to identify the actual commits. Update STATE.md with the specific commit hashes. If the code was bulk-committed, document the bulk commit and note the gap.

---

## Low Severity

### CONCERN-L1: 14 Archived Milestone Phases Need Removal

- **Issue:** 14 phases in `.planning/workstreams/milestone/phases/` are marked `.archived` but remain on disk. They are superseded by later phases (18 superseded by 26, 27-30 superseded by RICH closure, etc.) and create search noise.
- **Files:** Phase directories 15, 17-24, 27-30, 51 (all have `.archived` marker or are superseded)
- **Evidence:** Audit: `.planning/audits/PLANNING-AUDIT-2026-05-07.md` §12 — 14 TRASH candidates.
- **Impact:** `grep -r` scans these directories unnecessarily. Agents loading planning context may discover stale specs and implement against superceded designs.
- **Fix approach:** Move to `.planning/archives/trash-phases/` or delete entirely. The `.archived` marker already signals "do not use" but the files shouldn't be on the search path at all.

### CONCERN-L2: 2 Empty Workstreams — `primitive-registry` and `bootstrap-cli-onboarding`

- **Issue:** Both workstreams contain only `CONTEXT.md` + `.gitkeep` files. Zero phases created, zero plans, zero artifacts. They create false expectations in ROADMAP.md, STATE.md, and PROJECT.md.
- **Files:** `.planning/workstreams/primitive-registry/`, `.planning/workstreams/bootstrap-cli-onboarding/`
- **Evidence:** Audit: `.planning/audits/PLANNING-AUDIT-2026-05-07.md` §7, §8. Both classified TRASH.
- **Impact:** Agents reading ROADMAP.md may attempt to plan work for these workstreams, leading to wasted context. The primitive-registry concept was partially implemented in Phase 61 (milestone) but this workstream itself remains untouched.
- **Fix approach:** Delete the `phases/` directories (only `.gitkeep`). Keep `CONTEXT.md` as reference if the concepts (primitive registry auto-discovery, CLI onboarding wizard) are still planned. Otherwise, merge into the milestone workstream where the actual implementation lives.

---

## Architectural Risks

### RISK-1: Delegation Hierarchy (L0 → L1 → L2) Not Enforced at Runtime

- **Problem:** The agent architecture defines a strict 3-level hierarchy (L0 orchestrators → L1 coordinators → L2 specialists) with well-defined permission boundaries and only-L1-can-delegate rules. However, there is **no runtime enforcement** of this hierarchy. Any agent can call `delegate-task` with any other agent as the target. The hierarchy exists only in agent `.md` frontmatter declarations and skill contracts — a convention, not a constraint.
- **Files:** `src/tools/delegate-task.ts` (no hierarchy gate), `src/lib/delegation-manager.ts` (no depth validation), `.opencode/agents/` (YAML frontmatter only)
- **Impact:** An L2 specialist agent could, through prompt injection or misconfig, spawn its own sub-agents, bypassing the L1 coordinator gate. This breaks the quality gate triad (lifecycle → spec → evidence) because an L2 agent's work would never pass through the coordinator's validation checkpoints.
- **Fix approach:** Add a `validateDelegationDepth()` guard in `delegation-manager.ts` that checks the caller agent's declared depth against the target agent's depth. Reject L2→L2 or L2→L1 delegations. This requires access to the caller's agent metadata at delegation time (available via SDK `session.info.agent` or config resolution).

### RISK-2: No E2E Tests — All Tests Are Unit Tests

- **Problem:** The test suite has 1,659 passing tests at 90.49% statement coverage, but every single one is a unit test. There are zero E2E tests, zero integration tests that spawn real child sessions, and zero tests that verify the full delegation pipeline end-to-end.
- **Files:** All `tests/` directories (119 test files, all unit/mock-based)
- **Evidence:** `find tests/ -name "*.e2e*" -o -name "*.integration*"` = 0 results. Phase 48 runtime integration proof is DEGRADED (REM-RUNTIME-04/05: dynamic tool execution, non-empty provider completion remain unproven). Phase 52 end-user acceptance is BLOCKED/PARTIAL.
- **Impact:** Cannot prove the harness works as a complete system. The delegation chain (tool → manager → SDK → child session → completion → notification) has never been verified with a real OpenCode runtime. Mock-only tests can pass while the actual SDK integration is broken.
- **Fix approach:** Create a smoke-test suite that runs against a real OpenCode instance (or a prerecorded SDK fixture). Minimum viable: spawn a child session via `delegate-task`, verify the child produces output, verify `delegation-status` polls correctly, verify terminal notification fires. Document this as Phase 52 deliverable.

### RISK-3: `.hivemind/` Git-Tracking Contradicts `.gitignore`

- **Problem:** `.gitignore` lines 39-51 explicitly ignore `.hivemind/state/`, `.hivemind/event-tracker/`, `.hivemind/journal/`, and 8 other `.hivemind/` subdirectories. However, `git ls-files .hivemind/` shows 20+ files tracked in git, including `event-tracker/*.json`, `state/delegations.json`, and `configs.json`. Some of these tracked files are already deleted from the working tree but remain in the git index.
- **Files:** `.gitignore:39-51`, `.hivemind/configs.json` (tracked but deleted: `D` status), `.hivemind/event-tracker/` (14 files `D`, 2 exist)
- **Evidence:** `git ls-files .hivemind/` = 20+ tracked files. `.gitignore` says they should be ignored. Audit: `.planning/audits/PRIMITIVES-AUDIT-2026-05-07.md` §B5-B6.
- **Impact:** Inconsistent git tracking causes:
  - `git status` shows stale deleted files as "deleted" every run.
  - New team members who clone the repo get stale `.hivemind/state/` files from an old state, which may contain runtime data (session IDs, delegation records) from a different machine.
  - Per Q6 decision, `.hivemind/` is the internal state root and should NOT be committed. The current git index violates this architectural decision.
- **Fix approach:** `git rm --cached -r .hivemind/state/ .hivemind/event-tracker/ .hivemind/configs.json` to clean the git index while preserving the working tree. Then `git status` to verify only intended files remain tracked (root-level structure markers like `.hivemind/.gitkeep` if desired).

---

## Feature Gaps

### GAP-1: No Auto-Routing / Intent Classification / Workflow Router (f-04 Missing)

- **Problem:** `src/lib/AGENTS.md` (the module documentation, not the agent definition file) and `AGENTS.md` (root project doc) reference 4 feature paths: f-01 (delegation), f-02 (tool guard hooks), f-03 (lifecycle CQRS), and f-04 (auto-routing + intent classification + workflow routing). Features f-01 through f-03 are implemented and code-verified. **f-04 has zero implementation** — no intent classifier, no workflow router, no auto-routing engine in `src/`.
- **Files:** None (feature not implemented)
- **Evidence:** `grep -rl "intent.*classif\|workflow.*rout\|auto.*rout" src/` returns only skill-router files (agent skill loading bundles), not a runtime intent classifier. The `hm-l2-lineage-router` and `hm-l2-skill-router` skills exist as agent guidance (soft meta-concepts), but the harness has no runtime engine that classifies user intent and routes to the correct agent.
- **Impact:** User prompts go to whatever agent was loaded at session start. There is no "smart dispatch" where the harness detects intent and selects the optimal specialist. Multi-step workflows (brainstorm → spec → plan → execute) require manual agent selection by the user or orchestrator.
- **Fix approach:** Design an intent-classification module (`src/lib/intent-classifier.ts`) that analyzes the first user message and classifies it into a task domain (brainstorm, research, plan, execute, debug, review). Wire into the session entry intake pipeline (`src/lib/session-entry/` already has purpose-classification for sessions — extend to task routing). This is a post-MVP feature but unblocks orchestration quality.

---

## Audit References

| Document | Lines | Scope |
|----------|-------|-------|
| `.planning/audits/PRIMITIVES-AUDIT-2026-05-07.md` | 459 | Agents, skills, commands, rules, `.hivemind/` state, bootstrap gap |
| `.planning/audits/SRC-MODULE-AUDIT-2026-05-07.md` | 458 | 168 source files — alive/stale/dead classification |
| `.planning/audits/PLANNING-AUDIT-2026-05-07.md` | 555 | 8 workstreams, ~100 phases, STATE.md truth, git evidence |
| `src/lib/AGENTS.md` | ~100 | Code smells: storeCache, asString, module LOC targets |

---

*Concerns audit: 2026-05-07; CP-PTY concern added 2026-05-08*
