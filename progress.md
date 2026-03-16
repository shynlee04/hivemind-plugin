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
