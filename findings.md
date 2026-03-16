# Findings

## 2026-03-16

### Target stability model
- `docs/architecture/2026-03-16-hivemind-master-model.md` is the current main reference for product definition, OpenCode fit, and production-readiness gates.
- The model requires HiveMind to act as a plugin-native guidance layer that untangles messy work, preserves continuity, and demands evidence before completion claims.
- Major release gates include: source/docs/surfaces alignment, conservative mixed-intent routing, deterministic runtime behavior behind commands, `tool.schema` alignment, and verification via `npx tsc --noEmit`, `npm test`, and key end-to-end checks.

### Current repo authority and debt
- Root `AGENTS.md` defines source authority: `src/` for implementation, root `agents/**` for agent contracts, `.opencode/` as mirror, `.hivemind/` as runtime output.
- Root `AGENTS.md` also records known debt blocking stability, including inline runtime tools in `src/plugin/opencode-plugin.ts`, missing `tool.schema` adoption, empty `hooks/soft-governance.ts`, and a stubbed `src/intelligence/doc/` surface.

### Public narrative mismatch
- `README.md` still presents a much broader and more mature product story than the master model says is currently proven.
- The master model explicitly flags `README.md` and older docs as partially misleading relative to current source reality.

### Archived-feature signal
- `docs/planning-draft/modernize-doc-intelligence-layer.md` describes a major standalone-first redesign for `hivemind-doc`, `hivemind-handoff`, and `hivemind-inspect`, implying document/code intelligence work is blocked on tool-boundary and stability cleanup first.

### Current architecture seams from repo exploration
- The active stabilization spine is `src/plugin/` + `src/hooks/start-work/` + `src/control-plane/` + `src/shared/runtime-attachment.ts` + `src/core/{trajectory,workflow-management}`.
- `src/plugin/opencode-plugin.ts` is the highest-leverage integration seam because it assembles hooks, runtime tools, command context injection, permission behavior, and compaction behavior.
- `src/hooks/start-work/start-work-router.ts` is the real session-entry orchestrator and combines lineage, readiness, continuity, trajectory, and command routing.
- `src/hooks/start-work/purpose-classifier.ts` is still keyword-driven, which the master model already identifies as an ambiguity-handling weakness.

### Archived and dormant intelligence surfaces
- Current live doc intelligence is only a router: `src/intelligence/doc/doc-surface-router.ts`; `src/intelligence/doc/AGENTS.md` explicitly says the implementation was gutted.
- Current `src/intelligence/code/` is present as a directory but appears empty of TypeScript implementation files.
- Archived full implementations live under `.archive/legacy-src-20260314-140720/`, including `tools/hivemind-doc.ts`, `lib/doc-intel.ts`, `lib/doc-intel/*`, and `lib/code-intel/*`.
- Archived tool inventory also includes prior code-intel-facing tools such as `hivemind_codemap`, `hivemind_read_skeleton`, `hivemind_precision_patch`, and `hivemind_mesh_pull`.

### Reactivation prerequisites supported by evidence
- Archived planning and audit docs repeatedly say feature restoration is blocked first on schema/state/governance/tool-boundary stabilization, not only on missing feature code.
- `docs/planning-draft/raw-version-refactor-for-v-29.md` and archived v29 domain audits tie code-intel/doc-intel work to broader refactoring of hooks, state, contracts, and runtime foundations.
- The lowest-risk reintroduction path is library-first and standalone-first: rebuild or restore doc/code-intel libraries so they do not depend on unstable `.hivemind`, session engines, or volatile prompt/runtime coupling.

### Surface consistency risk
- The repo has strong boundary scripts and tests, but public surfaces can still overclaim: the master model explicitly flags README and older docs as ahead of current source reality.
- Stabilization therefore requires both runtime hardening and surface-truth alignment before archived features should be revived.

### First implemented stabilization fix
- `src/cli/harness.ts` previously derived `recommendedCommands` only from OpenCode server health, which could produce misleading attach guidance even when the runtime control-plane result was blocked and explicitly required `hm-init` or `hm-doctor`.
- Added a regression test in `tests/harness-command.test.ts` for the healthy-server + missing-bootstrap case and changed `runHarnessCommand()` to prioritize blocked runtime recovery guidance over attach guidance.
- Verified by targeted tests, related runtime tests, `npx tsc --noEmit`, and end-to-end manual QA of `runHarnessCommand()` on an unbootstrapped temp project.

### Readiness-truth slice coverage after follow-up
- Added a second harness regression in `tests/harness-command.test.ts` for the damaged-runtime-state + healthy-server case.
- That second test passed immediately, which confirms current control-plane and harness behavior already prefer `hm-doctor` for damaged state; the gap was missing regression coverage rather than broken runtime logic.

### Mixed-intent routing slice
- The exact messy prompt from the master model previously resolved to `purposeClass: "tdd"`, `recommendedCommandId: "hm-tdd"`, and `autoRoute: true`, which contradicted the model's requirement to avoid flattening mixed intent into blind execution.
- `src/hooks/start-work/purpose-classifier.ts` now applies a bounded evidence-first fallback: when safe discovery purposes and execution purposes both match, it marks the prompt as `mixed-intent`, lowers confidence, and prefers the safer research/planning-style path.
- `src/hooks/start-work/start-work-router.ts` now suppresses auto-routing when classification is mixed-intent or below the confidence threshold.
- Manual QA on the exact master-model prompt now returns `purposeClass: "research"`, `recommendedCommandId: "hm-research"`, `autoRoute: false`, `confidence: 0.34`.

### Authority and README truth alignment
- `src/plugin/AGENTS.md`, `src/tools/AGENTS.md`, and root `AGENTS.md` had stale debt notes claiming inline runtime tools and missing `tool.schema` adoption even though the current source already has extracted runtime tools and `tool.schema` args.
- Those authority docs now reflect the current state: runtime tools live in `src/tools/runtime/`, current tool args use `tool.schema`, and `hooks/soft-governance.ts` is no longer an empty placeholder.
- `README.md` now points readers to the master model as the authoritative product definition, replaces the frozen snapshot counts with current generic runtime-surface language, and marks older workflow/tool terminology as legacy vocabulary rather than current runtime contract.
