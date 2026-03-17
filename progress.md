# Progress Log

## 2026-03-16

### Started
- Loaded planning and coordination skills.
- Created initial todo list for discovery, gap analysis, and roadmap design.
- Read the master model, root `AGENTS.md`, `package.json`, and the doc-intelligence modernization draft.
- Launched background exploration for current architecture, archived feature surfaces, and external branch context.

### Evidence Collected
- Master model defines explicit production-readiness and OpenCode compatibility gates.
- Root `AGENTS.md` identifies current source authority and concrete technical debt still open.
- `package.json` shows the shipped npm surface still includes commands, agents, skills, workflows, dist, and README.

### Next
- Collect background agent findings.
- Read key current implementation files around runtime routing and doc intelligence.
- Convert findings into a dependency-aware stabilization roadmap.

### Resume Recovery
- Recovered completed background work via the agent session history after disconnect; background task IDs were no longer available, but the session transcripts preserved the exploration results.

### Additional Evidence Collected
- Exploration confirmed the current stabilization spine is concentrated in plugin assembly, start-work routing, control-plane execution, runtime attachment state, and trajectory/workflow core modules.
- Exploration confirmed current doc intelligence is router-only and current code-intel is effectively absent from live `src/` while fuller implementations remain in `.archive/legacy-src-20260314-140720/`.
- External-branch research confirmed the `v-2.9-revamp-dev` lineage carried richer `doc-intel`, `hivemind-doc`, and `code-intel` implementations, along with tests and planning docs, but those capabilities were coupled to older artifact and runtime assumptions.

### Updated Next
- Draft a staged roadmap that stabilizes source/runtime/surface alignment before reintroducing archived intelligence features.
- Review that roadmap for sequencing gaps before any implementation work begins.

### Implementation Progress
- Selected the first bounded stabilization slice: host-readiness guidance in `runHarnessCommand()`.
- Wrote a failing regression test for the case where the OpenCode server is healthy but HiveMind bootstrap is still missing.
- Fixed `src/cli/harness.ts` so runtime recovery recommendations now take precedence over attach guidance when the harness bundle returns a blocked state.

### Verification Evidence
- `npx tsx --test tests/harness-command.test.ts` -> pass after fix.
- `npx tsx --test tests/control-plane-runtime-tools.test.ts tests/harness-command.test.ts tests/slash-command-stack.test.ts` -> all pass.
- `npx tsc --noEmit` -> pass.
- Manual QA via `runHarnessCommand()` on a temp project with a healthy temporary server returned: `healthy: true`, `closeoutStatus: blocked`, `nextCommand: hm-init`, `recommendedCommands: ["hm-init","hm-doctor","opencode serve"]`.

### Follow-up Coverage
- Added a damaged-state harness regression to ensure healthy OpenCode server status does not hide broken HiveMind runtime state.
- Re-ran `tests/harness-command.test.ts`, `tests/control-plane-runtime-tools.test.ts`, `tests/slash-command-stack.test.ts`, and `tests/recovery-checkpoint-spine.test.ts`; all pass.

### Mixed-Intent Routing Hardening
- Added a start-work regression covering the exact messy prompt from the master model.
- Updated the purpose classifier and start-work auto-route logic so mixed prompts now fail safer into advisory research routing instead of auto-routing into `hm-tdd`.

### Verification Evidence (Routing Slice)
- `npx tsx --test tests/start-work-router.test.ts` -> pass after fix.
- `npx tsx --test tests/start-work-router.test.ts tests/slash-command-stack.test.ts tests/control-plane-runtime-tools.test.ts` -> all pass.
- `npx tsc --noEmit` -> pass.
- Manual QA via `resolveStartWork()` on the exact master-model messy prompt returned `purposeClass: "research"`, `recommendedCommandId: "hm-research"`, `autoRoute: false`, `confidence: 0.34`.

### Documentation Truth Alignment
- Updated root and sector `AGENTS.md` files to remove stale claims about inline runtime tools, absent `tool.schema` adoption, and empty soft-governance wiring.
- Updated `README.md` so high-visibility product framing now points to the master model and no longer presents frozen tool/skill counts as the authoritative current runtime picture.

### End-to-End Runtime Routing Proof
- Added a mixed-intent advisory-routing regression to `tests/plugin-runtime.test.ts`.
- The new test passed immediately, confirming the runtime plan layer already preserves the safer start-work routing behavior.

### Verification Evidence (Plugin Runtime Slice)
- `npx tsx --test tests/plugin-runtime.test.ts` -> pass.
- `npx tsx --test tests/plugin-runtime.test.ts tests/start-work-router.test.ts tests/slash-command-stack.test.ts tests/control-plane-runtime-tools.test.ts` -> all pass.
- `npx tsc --noEmit` -> pass.
- `npm run build` -> pass.
- Manual QA via `node --input-type=module` against `dist/index.js` returned `purposeClass: "research"`, `recommendedCommandId: "hm-research"`, `autoRoute: false`, `bindingKind: "workflow-command"`, `commandBindingAutoRoute: false`, `previewAgent: "hiverd"`.

### Blocker Reassessment
- Retrieved a fresh blocker ranking after the completed runtime/routing/truth-alignment slices.
- The top remaining blocker with a bounded next step was plugin-entry boundary blur in `src/plugin/opencode-plugin.ts`, followed by centralized mutation gating and shipped truth-surface drift.
- The archive/doc-intel research completed in parallel and confirmed the first safe restoration target is a markdown-first, read-only library slice (`skim`, section `read`, chunked `read`, `search`) rather than write paths or public tool restoration.

### Plugin Assembly Boundary Cleanup
- Wrote a failing regression in `tests/plugin-assembly-smoke.test.ts` asserting that `src/plugin/opencode-plugin.ts` must not define local helper logic or managed-tool policy constants.
- Extracted prompt helper logic into `src/hooks/prompt-transformation/synthetic-parts.ts`.
- Extracted managed-tool policy and trajectory tool-event recording into `src/hooks/runtime-loader/tool-governance.ts`.
- Updated `src/plugin/opencode-plugin.ts` to import those helpers instead of defining them inline.

### Verification Evidence (Plugin Boundary Slice)
- `npx tsx --test tests/plugin-assembly-smoke.test.ts` -> fail first on local helper logic, then pass after refactor.
- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/control-plane-runtime-tools.test.ts` -> all pass.
- `npx tsc --noEmit` -> pass.
- `npm run build` -> pass.
- Manual QA via `node --input-type=module` against `dist/index.js` confirmed `permission.ask` remains registered and still auto-allows `hivemind_task` with `status: "allow"` and no toast.

### First-Wave Doc-Intel Foundation
- Added `tests/doc-intelligence-read.test.ts` as the first focused restoration target for standalone markdown-first read behavior.
- Implemented the minimal read-only library surface under `src/intelligence/doc/`: `types.ts`, `safety.ts`, `formats/md.ts`, and `read-ops.ts`.
- Updated `src/intelligence/doc/index.ts` to export the new read foundation alongside the existing router surface.

### Verification Evidence (Doc-Intel Slice)
- `npx tsx --test tests/doc-intelligence-read.test.ts` -> fail first on missing exports, then pass after implementation.
- `npx tsx --test tests/plugin-assembly-smoke.test.ts tests/plugin-runtime.test.ts tests/control-plane-runtime-tools.test.ts tests/doc-intelligence-read.test.ts` -> all pass.
- `npx tsc --noEmit` -> pass.
- `npm run build` -> pass.
- Manual QA via `node --input-type=module` against `dist/index.js` returned `skimTitle: "Manual Guide"`, `firstHeading: "Intro"`, `section: "Plugin boundary verification lives here."`, `resultCount: 1`.

### Truth-Surface Cleanup
- Rewrote the remaining stale README runtime sections so the public narrative now points at the live runtime path (`hm-*` command flow, current tool surfaces, current architecture boundaries) instead of removed lifecycle verbs and obsolete structure counts.
- Updated `src/intelligence/doc/AGENTS.md` to acknowledge that the first public read-only doc surface is already live through `hivemind_doc`.
- Corrected `src/AGENTS.md` from 5 tools to 6 tools and removed invalid phantom dependencies from `skills/registry.yaml`.
- Updated stale skill references in `skills/evidence-discipline/references/evidence-catalogue.md` and `skills/verification-methodology/SKILL.md`.

### Verification Evidence (Truth-Surface Slice)
- `grep` over `README.md` no longer finds the targeted removed verbs or obsolete architecture identifiers (`declare_intent`, `map_context`, `scan_hierarchy`, `save_mem`, `src/index.ts`, `src/lib/`, `Tools (10)`, `Commands (3)`).
- `grep` over `src/**/*.md` and `skills/**/*.md` no longer finds the targeted stale references (`hivemind-governance`, `src/lib/state-queue.ts`, `save_mem`, `recall_mems`, or the old doc-tool restoration wording).
- `npm test` still fails for pre-existing branch issues unrelated to this slice, including missing-module tests (`tests/cli-scan.test.ts`, `tests/dashboard-v2-snapshot.test.ts`, `tests/hivemind-cycle-sessionsdir-parity.test.ts`, `tests/sdk-foundation.test.ts`, `tests/string-utils.test.ts`, `tests/sync-assets.test.ts`) and existing agent-policy expectation drift in `tests/agent-boundary-policy.test.ts`.
- `lint:boundary` still passes for the touched truth surfaces, with only the pre-existing `.describe()` advisory warnings in `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`.
- `npx tsc --noEmit` -> pass.
- `npm run build` -> pass.

### Tool-Contract Metadata Cleanup
- Added `.describe()` coverage to every arg in `src/tools/handoff/tools.ts`, `src/tools/task/tools.ts`, and `src/tools/trajectory/tools.ts`.
- Kept the slice metadata-only: no behavior changes, only agent-introspection descriptions on existing `tool.schema` args.

### Verification Evidence (Describe Slice)
- Direct file reads plus a dedicated background inspection confirmed all three touched tool schemas now have `.describe()` coverage on every arg.
- `npx tsc --noEmit` -> pass.
- `npm test` -> pass (`124` tests passed, `0` failed).
- `npm run build` -> pass.
- `npm run lint:boundary` -> pass with no remaining `.describe()` advisory warnings.
- Manual QA via `git diff -- src/tools/handoff/tools.ts src/tools/task/tools.ts src/tools/trajectory/tools.ts` confirmed the slice stayed constrained to metadata-only additions.
- Manual QA via dist artifact existence checks confirmed `dist/cli.js`, `dist/index.js`, and `dist/plugin/opencode-plugin.js` were rebuilt successfully.

### README CLI Truth Cleanup
- Rewrote the remaining public CLI command documentation in `README.md` so it now matches the revamp branch's live shipped control-plane binaries and runtime guidance.
- Removed active documentation of non-shipped public CLI surfaces (`scan`, `sync-assets`, `status`, `dashboard`, `purge`) and replaced them with the current `init`/`doctor`/`harness`/`settings` path plus in-OpenCode runtime inspection guidance.
- Aligned the upgrade, brownfield, troubleshooting, and Vietnamese runtime sections to the same current public surface.

### Verification Evidence (README CLI Slice)
- `grep` over `README.md` no longer finds active command examples for `npx hivemind-context-governance scan`, `sync-assets`, `status`, `dashboard`, or `purge`.
- The only remaining matches for `scan`, `sync-assets`, and `dashboard` in `README.md` are explanatory statements that those public CLIs are not shipped in the revamp branch.
- `npx tsc --noEmit` -> pass.
- `npm test` -> pass (`124` tests passed, `0` failed).
- `npm run build` -> pass.
- Manual QA via source comparison confirmed `README.md` now matches the live CLI/control-plane inventory from `package.json`, `src/cli/command-routing.ts`, `src/control-plane/control-plane-registry.ts`, and `src/cli.ts`.

### Current Decision Point
- Oracle was launched to choose the next highest-leverage bounded stabilization slice after the verified README CLI-surface cleanup.
- Continuity artifacts were updated while waiting so the next slice starts from the current verified branch state instead of stale progress notes.

### Command-Asset Dashboard Truth Cleanup
- Rewrote `commands/hivemind-dashboard.md` so it no longer advertises a live `hivemind dashboard [options]` executable or TUI launch path.
- Reframed the asset as a blocked legacy surface notice that routes users to the current runtime inspection path: `hm-harness`, `hivemind_runtime_status`, and `hivemind_doc`.

### Verification Evidence (Dashboard Command Slice)
- `grep` over `commands/**/*.md` and `README.md` no longer finds `hivemind dashboard`, `npx hivemind-context-governance dashboard`, or the old launch phrasing.
- Direct read of `commands/hivemind-dashboard.md` confirms it now explains the surface is not shipped and points to the live runtime path instead.
- `npx tsc --noEmit` -> pass.
- `npm test` -> pass (`124` tests passed, `0` failed).
- `npm run build && test -f dist/cli.js && test -f dist/index.js && test -f dist/plugin/opencode-plugin.js` -> pass.

### Command-Asset Scan/Status Truth Cleanup
- Background inspection identified two more sibling command assets whose filenames and opening copy still implied removed public `scan` and `status` CLIs: `commands/hivemind-scan.md` and `commands/hivemind-status.md`.
- Rewrote only the description/opening lines in those two files so they explicitly read as in-OpenCode workflows rather than shipped public CLIs, while preserving their current runtime-tool guidance.

### Verification Evidence (Scan/Status Command Slice)
- `grep` over `commands/hivemind-scan.md`, `commands/hivemind-status.md`, and `commands/hivemind-dashboard.md` no longer finds executable-looking `hivemind scan`, `hivemind status`, `npx hivemind-context-governance scan`, or `npx hivemind-context-governance status` claims.
- Direct reads confirm `commands/hivemind-scan.md` and `commands/hivemind-status.md` now declare themselves in-OpenCode workflows rather than live public CLIs.
- `npx tsc --noEmit` -> pass.
- `npm test` -> pass (`124` tests passed, `0` failed).
- `npm run build && test -f dist/cli.js && test -f dist/index.js && test -f dist/plugin/opencode-plugin.js` -> pass.

### Next Decision Point
- The removed-public-CLI grep is now clean across `commands/`, so the next bounded stabilization slice should target a different contract or truth-surface gap instead of more dashboard/scan/status cleanup.

### Command Frontmatter Contract Cleanup
- Used `commands/AGENTS.md` plus Oracle and Explore review to confirm the next bounded gap was command frontmatter compliance, not more command-body truth cleanup.
- Normalized the shipped command pack so all `commands/*.md` files now have explicit, parseable `description`, `agent`, and `subtask` fields.
- Preserved the observed role pattern while normalizing:
  - top-level `hivemind-*` helpers and root `hivefiver*` entry commands use `subtask: false`
  - bounded specialist `hiveq-*`/`hiverd-*` command assets use `subtask: true`
- Kept the previously repaired truth-surface bodies in `commands/hivemind-dashboard.md`, `commands/hivemind-scan.md`, and `commands/hivemind-status.md` unchanged during the frontmatter pass.

### Verification Evidence (Command Frontmatter Slice)
- Oracle confirmed the real issue was malformed frontmatter shape, not a missing-`subtask` gap, and recommended a metadata-only normalization pass.
- `grep` over `commands/*.md` now shows every shipped command file exposing the required `description`, `agent`, and `subtask` keys with valid inline values.
- Direct reads of `commands/hiveq-verify.md`, `commands/hiverd-research.md`, `commands/hivemind-status.md`, and `commands/hivefiver.md` confirm the frontmatter is now parseable and role-consistent.
- `npx tsc --noEmit` -> pass.
- `npm test` -> pass (`124` tests passed, `0` failed).
- `npm run build && test -f dist/cli.js && test -f dist/index.js && test -f dist/plugin/opencode-plugin.js` -> pass.

### Current Decision Point
- Public command truth surfaces and command frontmatter are both now clean and verified.
- The next bounded stabilization slice should target a different remaining architecture or contract gap beyond command-surface cleanup.

## 2026-03-17

### Project Initialization Start
- Ran `gsd-tools init new-project` and confirmed the repo is not yet initialized under `.planning/`, but is detected as a brownfield codebase with git already present.
- Read the new-project workflow, questioning/reference templates, and current repo planning artifacts to initialize the project from existing context instead of treating it as a blank greenfield idea.
- Wrote and committed `.planning/PROJECT.md` and `.planning/config.json` as the first two initialization artifacts.

### Current Next
- Research the 2026 ecosystem for OpenCode-native plugin/runtime architecture, deterministic agent tooling, and terminal UI implementation.
- Convert that research into scoped brownfield requirements and a dependency-aware roadmap.

### Project Initialization Complete
- Wrote and committed `.planning/research/STACK.md`, `.planning/research/FEATURES.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, and `.planning/research/SUMMARY.md`.
- Wrote and committed `.planning/REQUIREMENTS.md`, then used a roadmapper pass to create `.planning/ROADMAP.md`, `.planning/STATE.md`, and update requirement traceability.
- The project is now initialized around an 8-phase brownfield roadmap focused on runtime authority alignment, deterministic tool use, live proof, and terminal UI stabilization.
