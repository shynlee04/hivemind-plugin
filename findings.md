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

### Truth-surface cleanup after public doc-tool exposure
- `README.md` was still the highest-risk stale surface after the doc-tool landed: it taught removed verbs such as `declare_intent`, `map_context`, `scan_hierarchy`, and `save_mem` as active behavior, and its architecture overview still named `src/index.ts`, `src/lib/`, and outdated tool/command counts.
- `src/intelligence/doc/AGENTS.md` still claimed public doc-tool exposure had to be rebuilt even though `hivemind_doc` is already live.
- `src/AGENTS.md` still undercounted the tool inventory, saying `src/tools/` had 5 tools instead of 6.
- `skills/registry.yaml` had invalid `depends_on: [hivemind-governance]` entries even though no root `skills/hivemind-governance/` exists, violating the registry's own no-phantom rule.
- `skills/evidence-discipline/references/evidence-catalogue.md` and `skills/verification-methodology/SKILL.md` still taught pre-revamp references (`save_mem`/`recall_mems`, `src/lib/state-queue.ts`) and were aligned to current runtime surfaces.

### Tool-schema metadata cleanup
- `src/tools/AGENTS.md` requires every tool arg to carry `.describe()` for agent introspection.
- The remaining advisory boundary warnings were isolated to `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`, where arg schemas were using `tool.schema` but still lacked descriptions.
- The current bounded fix was metadata-only: add `.describe(...)` to every arg in those three files without changing behavior or contracts.
- Post-fix verification showed the three files now have full arg-description coverage and no remaining `.describe()` gaps were found by direct inspection.

### README CLI surface drift after the earlier narrative cleanup
- `package.json` currently ships only six CLI binaries: `hivemind-context-governance`, `hivemind`, `hm-init`, `hm-doctor`, `hm-settings`, and `hm-harness`.
- `src/cli/command-routing.ts`, `src/control-plane/control-plane-registry.ts`, and `src/cli.ts` confirm the live public control-plane commands are only `init`, `doctor`, `harness`, `settings`, and `help`.
- `README.md` still documented removed public CLI surfaces in multiple sections, including `scan`, `sync-assets`, `status`, `dashboard`, and `purge`, even though those revamp-era public entrypoints are not shipped by current source.
- The bounded truth fix is therefore to align README command, upgrade, brownfield, and troubleshooting guidance to the live runtime path (`init`, `doctor`, `harness`, `settings`, in-OpenCode `hivemind_runtime_status`/`hivemind_doc`, and `hm-*` workflow commands) instead of documenting removed CLIs.

### Remaining command-asset dashboard drift
- After the README CLI cleanup, `commands/hivemind-dashboard.md` was still the standout shipped command asset contradicting the live runtime.
- That file explicitly advertised `hivemind dashboard [options]` and described a live TUI dashboard even though `package.json`, `src/cli.ts`, and `src/cli/command-routing.ts` ship no such public CLI surface.
- Sibling command assets `commands/hivemind-status.md` and `commands/hivemind-scan.md` are already aligned to the current runtime because they call `hivemind_runtime_status`/`hivemind_runtime_command` and avoid removed public CLI syntax.
- The bounded repair is therefore command-asset-only: rewrite `commands/hivemind-dashboard.md` as a blocked legacy surface notice that routes users to `hm-harness`, `hivemind_runtime_status`, and `hivemind_doc` instead of implying an executable dashboard.

### Remaining `hivemind-*` command-asset naming drift
- After the dashboard correction, a focused command-asset follow-up showed `commands/hivemind-scan.md` and `commands/hivemind-status.md` still read like live public `scan`/`status` surfaces because of their filenames and opening text, even without explicit CLI code blocks.
- Both files were already using the live runtime tools correctly (`hivemind_runtime_status`, `hivemind_runtime_command`), so the issue was naming and opening-copy implication rather than behavioral guidance.
- The bounded repair is wording-only: explicitly mark both files as in-OpenCode workflows, not shipped public CLIs, while preserving their source-backed runtime steps.
- After those edits, the removed-public-CLI grep across `commands/` is clean for `dashboard`, `scan`, `status`, `sync-assets`, and `purge` phrasing.

### Command frontmatter contract normalization
- `commands/AGENTS.md` requires every command file to declare machine-parseable `description`, `agent`, and `subtask` frontmatter.
- The next real gap after truth-surface cleanup was not missing descriptions or agents; it was malformed command frontmatter across 25 files, where `agent` and `subtask` had become split or implied inconsistently.
- Oracle review confirmed the correct bounded slice: keep command body text unchanged, normalize only the frontmatter shape, and preserve the role-based `subtask` split already evidenced in the repo.
- Observed role pattern now made explicit across the full command pack:
  - top-level/root/orchestration helper commands use `subtask: false`
  - bounded specialist/stage commands use `subtask: true`
- After normalization, all shipped command assets under `commands/*.md` expose valid `description`, `agent`, and `subtask` headers, and representative files from the `hivemind-*`, `hiveq-*`, `hiverd-*`, and `hivefiver*` families now match that contract cleanly.

## 2026-03-17

### Brownfield initialization baseline
- `node /Users/apple/.config/opencode/get-shit-done/bin/gsd-tools.js init new-project` reports `project_exists: false`, `planning_exists: false`, `is_brownfield: true`, `needs_codebase_map: true`, and default planning models of `sonnet`.
- Even though the generic auto workflow assumes greenfield, the actual repo context is brownfield: existing CLI/runtime surfaces, tests, and planning artifacts prove this should be initialized as a refactor/migration project rather than a net-new product.
- The initialization framing should center on four active outcomes: correct OpenCode SDK client/server usage, deterministic tool-using agents and harnesses, OpenTUI completion, and progressive layer-by-layer migration.

### Research and roadmap outcome
- The research synthesis recommends a contract-first modular monolith with a hard dual-plane split: `@opencode-ai/sdk` for control-plane orchestration, `@opencode-ai/plugin` for execution-plane hooks/tools, `Zod 4` as the single schema layer, and `Ink` as the conservative shipped TUI path while OpenTUI remains experimental.
- The resulting roadmap maps all 24 v1 requirements across 8 phases in dependency order: runtime authority -> unified operations -> tool-governed mutation -> deterministic receipts -> continuity/recovery -> inspection/evidence separation -> live proof -> TUI stabilization.
- The most important strategic deferment is broad feature restoration; live official-boundary verification and backend truth now explicitly gate replay, policy packs, richer OpenTUI, and broader intelligence work.
