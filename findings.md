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

### End-to-end mixed-intent runtime proof
- Added an end-to-end plugin runtime regression in `tests/plugin-runtime.test.ts` using the exact messy prompt from the master model.
- The runtime plan already preserved the safer advisory route without additional production changes: `createPluginRuntimePlan()` keeps the prompt on `hm-research`, leaves `autoRoute` disabled, and binds the preview to `hiverd`.
- Manual QA through the built package entry (`dist/index.js`) returned `purposeClass: "research"`, `recommendedCommandId: "hm-research"`, `autoRoute: false`, `bindingKind: "workflow-command"`, `commandBindingAutoRoute: false`, `previewAgent: "hiverd"`.

### Remaining blocker ranking after completed runtime slices
- The strongest live blockers are now: plugin entry boundary blur, centralized mutation gating in the plugin, shipped truth-surface drift, incomplete command/runtime convergence outside the control plane, router-only live doc intelligence, and still-broad orchestration contracts.
- File evidence for those blockers came from `src/plugin/opencode-plugin.ts`, `src/plugin/AGENTS.md`, `src/commands/slash-command/command-runner.ts`, `src/control-plane/control-plane-handler.ts`, `src/AGENTS.md`, `commands/hivemind-scan.md`, `commands/hivemind-compact.md`, and `skills/delegation-framework/SKILL.md`.

### Plugin assembly boundary cleanup slice
- Added a new regression in `tests/plugin-assembly-smoke.test.ts` proving `src/plugin/opencode-plugin.ts` should not keep local helper implementations or managed-tool policy constants.
- Extracted synthetic message helpers into `src/hooks/prompt-transformation/synthetic-parts.ts` and tool-governance helpers into `src/hooks/runtime-loader/tool-governance.ts`, then re-exported them through the existing hook barrels.
- `src/plugin/opencode-plugin.ts` now imports those helpers instead of defining local helper logic, which makes the entry file more honestly assembly-focused without changing runtime behavior.

### First restoration slice recommendation from archive evidence
- The best first restoration slice is a standalone, markdown-first, read-only doc-intel foundation: `skim`, targeted section `read`, chunked `read`, and `search`.
- Best archived source set: `.archive/legacy-src-20260314-140720/lib/doc-intel/read-ops.ts`, `.archive/legacy-src-20260314-140720/lib/doc-intel/types.ts`, `.archive/legacy-src-20260314-140720/lib/doc-intel/safety.ts`, `.archive/legacy-src-20260314-140720/lib/doc-intel/index.ts`, and `.archive/legacy-src-20260314-140720/lib/doc-intel/formats/md.ts`.
- Keep absent in the first wave: all write paths, `.hivemind`/session/task/planning coupling, compatibility wrappers, public tool re-exposure, and heavier `xref`/`context`/`inspect` behaviors.

### First-wave doc-intel foundation landed
- `src/intelligence/doc/` now has a real standalone read foundation alongside the existing router: `types.ts`, `safety.ts`, `formats/md.ts`, and `read-ops.ts`.
- The implemented first-wave surface is intentionally markdown-first and read-only: `skimDocument`, `skimDirectory`, `readSection`, `readChunked`, and `searchDocuments`.
- The slice stays standalone: it reads plain markdown files under an arbitrary project root and does not depend on `.hivemind`, runtime attachment, session lineage, or old governance/task state.
