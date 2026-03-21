# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**[P0 Critical | Test harness blind spot in shipped test command]:**
- Issue: `npm test` executes only `tests/*.test.ts` and skips 12 co-located `src/**/*.test.ts` suites, including agent-work contract engine and hook tests.
- Files: `package.json`, `src/features/agent-work-contract/engine/contract-store.test.ts`, `src/features/agent-work-contract/hooks/compaction-preservation.test.ts`, `src/hooks/start-work/start-work-router.test.ts`, `src/plugin/context-renderer.test.ts`.
- Impact chain: Narrow CI command scope -> core contract/hook regressions can pass CI -> runtime behavior drifts from governance expectations.
- Fix approach: Expand test command to include both `tests/*.test.ts` and `src/**/*.test.ts`, then add a fast/slow split instead of omission.

**[P0 Critical | Simulated evidence validators give false assurance]:**
- Issue: runtime validators are simulation-oriented and not wired to real runtime probing; comments show "Simulate" paths and mocked outcomes.
- Files: `src/tools/runtime/runtime-status-validator.ts`, `src/tools/runtime/runtime-command-validator.ts`.
- Impact chain: simulated pass states -> planning/docs can overstate verification confidence -> release decisions made without official-interface proof.
- Fix approach: Convert validators into executable probes that run actual `hivemind_runtime_status`/`hivemind_runtime_command` calls against live OpenCode sessions.

**[P1 High | Schema authority split between active and archived paths]:**
- Issue: root governance states `src/schema-kernel/` is authority, but implementation exports from archived path with deprecation banner.
- Files: `AGENTS.md`, `src/schema-kernel/index.ts`, `src/archive/schema-kernel/index.ts`.
- Impact chain: authority mismatch -> contributors choose different contract ownership paths -> contract evolution and audits become inconsistent.
- Fix approach: choose one authority path, then collapse the other to compatibility alias with explicit lifecycle policy.

**[P1 High | Governance instruction conflicts for delegated agents]:**
- Issue: root governance includes "Do not Read/Write/Execute/Plan" and also requires deep delegation + execution outcomes, creating contradictory operator contracts.
- Files: `AGENTS.md`, `.opencode/get-shit-done/workflows/execute-phase.md`.
- Impact chain: conflicting instructions -> agent behavior variability -> unpredictable orchestration outcomes across sessions.
- Fix approach: publish one delegated-agent contract with explicit allowed actions per role.

---

## Known Bugs

**[Silent null exits in runtime command routing]:**
- Symptoms: command auto-recovery returns `null` on multiple branches without diagnostic metadata.
- Files: `src/features/runtime-entry/command.ts`.
- Trigger: missing `projectRoot`, runtime commands excluded from recovery, non-recoverable entry state, or missing recovery bundle.
- Workaround: none in return payload; only caller-side branching by truthiness.

**[Continuity reader tolerates malformed JSON by dropping records]:**
- Symptoms: transaction listing swallows JSON errors and filters bad entries out silently.
- Files: `src/features/runtime-entry/workflow-continuity.ts`.
- Trigger: malformed continuity JSON under `.hivemind/project/runtime-continuity/`.
- Workaround: manual filesystem cleanup and rerun.

---

## Security Considerations

**[Destructive runtime mirror sync can remove user-local assets]:**
- Risk: sync removes unmanaged files/dirs in `.opencode/commands`, `.opencode/agents`, and `.opencode/skills`.
- Files: `src/features/runtime-observability/sync.ts`.
- Current mitigation: deterministic managed set; no backup/versioned rollback in sync step.
- Recommendations: add dry-run + backup mode, and a protected allowlist for user-owned assets.

**[File-backed delegation state trusts JSON shape at read time]:**
- Risk: delegation records are parsed and cast directly; malformed shape can propagate until later checks.
- Files: `src/delegation/delegation-store.ts`.
- Current mitigation: parse failure returns `null`.
- Recommendations: add runtime schema validation and emit explicit corruption diagnostics.

---

## Performance Bottlenecks

**[Continuity lookup scales with full directory scan fallback]:**
- Problem: fallback path reads and parses every continuity JSON for session-linked lookup.
- Files: `src/features/runtime-entry/workflow-continuity.ts`.
- Cause: `findSessionLinkedContinuityTransaction()` calls `listWorkflowContinuityTransactions()` and sorts all matches.
- Improvement path: maintain indexed key map (`session -> continuityId`) and bounded history scan.

**[Heavy single-file suites increase maintenance and review latency]:**
- Problem: test concentration in very large files (e.g. 956-line plugin runtime suite).
- Files: `tests/plugin-runtime.test.ts`, `src/features/agent-work-contract/hooks/compaction-preservation.test.ts`, `tests/runtime-entry-contract.test.ts`.
- Cause: broad integration scenarios accumulated in monolithic files.
- Improvement path: split by scenario family (authority, continuity, delegation, route-hint, tool-governance).

---

## Fragile Areas

**[Global mutable SDK context singleton]:**
- Files: `src/hooks/sdk-context.ts`, `src/plugin/opencode-plugin.ts`.
- Why fragile: module-level mutable references (`clientRef`, `shellRef`, `serverUrlRef`) are shared across plugin lifetime.
- Safe modification: introduce scoped context instances keyed by plugin/session lifecycle.
- Test coverage: indirect only; no explicit multi-instance contamination test.

**[Harness health verdict combines local checks with shallow remote health]:**
- Files: `src/features/runtime-entry/harness.ts`.
- Why fragile: readiness is inferred from a single `/global/health` fetch plus local command result.
- Safe modification: add multi-step probe (session creation, command execution, tool invocation, teardown).
- Test coverage: no dedicated test file for `runHarnessCommand`; assertions focus on command/bundle outputs.

**[Agent registry pinned to `.deprecated.md` source naming]:**
- Files: `src/shared/opencode-agent-registry.ts`.
- Why fragile: source loading and registry projection depend on fixed deprecated filename convention.
- Safe modification: support canonical `.md` with explicit deprecation map.
- Test coverage: parity checks exist indirectly via runtime surface sync tests.

---

## Scaling Limits

**[File-based continuity and handoff stores]:**
- Current capacity: JSON files per record under `.hivemind/project/runtime-continuity/` and `.hivemind/handoffs/`.
- Limit: lookup and integrity checks become I/O-heavy with large session/delegation counts.
- Scaling path: append-only ledger + index files, batched compaction, and corruption quarantine folder.

**[Runtime surface mirroring rewrites all managed artifacts]:**
- Current capacity: full rewrite of projected command/agent/skill mirrors each sync.
- Limit: higher sync cost and elevated churn in large skill sets.
- Scaling path: content-hash diff sync and changed-file-only writes.

---

## Dependencies at Risk

**[@opencode-ai/plugin and @opencode-ai/sdk runtime contract coupling]:**
- Risk: hook key changes or runtime API shifts can break plugin assembly and control-plane runtime bridging.
- Impact: `HiveMindPlugin` hook registration and runtime status/command tools can degrade together.
- Migration plan: keep versioned compatibility matrix and add canary tests that execute against current SDK versions.

**[`yaml` frontmatter parsing as hard dependency for command/agent/skill projection]:**
- Risk: malformed or evolving frontmatter shapes break runtime projections at sync/load time.
- Impact: command/agent/skill mirrors fail to generate or produce partial runtime surface.
- Migration plan: strict schema validation with actionable error reporting per file.

---

## Missing Critical Features

**[End-to-end official-interface harness verification]:**
- Problem: current harness and validators rely heavily on local simulation/mocked pathways.
- Blocks: strong confidence claims for AI-agent runtime behavior in production-like environments.

**[Unified concern severity contract in workflow tooling]:**
- Problem: workflow docs include many fallback/skip branches but no machine-readable severity gate.
- Blocks: deterministic escalation from warning -> blocking failure in orchestration runs.

---

## Test Coverage Gaps

**[Live OpenCode boundary tests are sparse and narrow]:**
- What's not tested: multi-turn, multi-agent, failure-injection behavior through real server/client/plugin lifecycle.
- Files: `tests/runtime-authority-live-sanity.test.ts`, `src/features/runtime-entry/harness.ts`, `src/tools/runtime/runtime-status-validator.ts`, `src/tools/runtime/runtime-command-validator.ts`.
- Risk: regressions can pass local mocked tests while failing in real runtime orchestration.
- Priority: High.

**[Workflow markdown contract parsing edge cases]:**
- What's not tested: malformed frontmatter, multiline edge cases, unusual fenced content in command markdown.
- Files: `src/features/runtime-entry/instruction-loader.ts`, `commands/*.md`.
- Risk: command contract extraction silently degrades to defaults and weakens runtime gating.
- Priority: High.

**[Cross-surface drift checks for authority docs vs runtime behavior]:**
- What's not tested: consistency between governance claims and executable behavior (authority path, verification policy, command ownership).
- Files: `AGENTS.md`, `src/schema-kernel/index.ts`, `src/features/runtime-observability/status.ts`, `.opencode/get-shit-done/workflows/*.md`.
- Risk: context-engineering policy drift that is discovered only during incident or release review.
- Priority: Medium.

---

*Concerns audit: 2026-03-21*
