# HiveMind Stabilization and Feature Re-emergence Roadmap

Date: 2026-03-16
Status: Draft roadmap for sequencing stabilization before restoring archived intelligence capabilities

## Goal

Make the current `ecosystem-revamp` branch stable enough to satisfy the HiveMind master model and then restore archived capabilities like document intelligence and code intelligence without reintroducing legacy architectural fragility.

## What the evidence says

- The current repo already has a viable stabilization spine: `src/plugin/`, `src/hooks/start-work/`, `src/control-plane/`, `src/shared/runtime-attachment.ts`, and `src/core/{trajectory,workflow-management}`.
- The current repo does not have live document intelligence beyond `src/intelligence/doc/doc-surface-router.ts`, and current `src/intelligence/code/` appears effectively empty.
- Archived implementations exist in `.archive/legacy-src-20260314-140720/`, including `lib/doc-intel.ts`, `lib/doc-intel/*`, `lib/code-intel/*`, and `tools/hivemind-doc.ts`.
- Archived planning docs explicitly say restoration should be standalone-first and should not depend on unstable `.hivemind` lineage, session engines, or governance-heavy runtime assumptions.
- The master model says the project is not production-ready until runtime behavior, shipped surfaces, and public docs all describe the same product truth.

## Recommended strategy

### Option A - Stabilization first, then restore libraries, then tools (recommended)

Why this is best:
- It matches the master model's release gates and the archived modernization brief's standalone-first requirement.
- It reduces the chance of reviving `doc-intel` or `code-intel` on top of unstable routing, inconsistent command/runtime behavior, or misleading product surfaces.
- It lets restored intelligence features target the current plugin-native architecture instead of dragging legacy session/pathing assumptions back into `src/`.

Tradeoff:
- Slower feature revival in the short term, but lowest rework and regression risk.

### Option B - Restore archived intelligence libraries immediately and adapt stability later

Why this is weaker:
- Faster visible progress, but it risks coupling new work to old state models, archived path conventions, and outdated command/runtime assumptions.
- Likely to create a second migration later when stabilization work reaches the same boundaries.

### Option C - Rewrite intelligence features from scratch after stabilization

Why this is weaker:
- Cleanest end-state in theory, but throws away proven archived behavior, tests, and design insights.
- Highest effort and most likely to delay useful capability return.

## Workstreams

### 1. Source-of-truth alignment

Outcome:
- The repo has one honest product story across `README.md`, `docs/architecture/2026-03-16-hivemind-master-model.md`, `package.json`, shipped commands, and current runtime-backed source.

Primary targets:
- `README.md`
- `package.json`
- `commands/**`
- `skills/**`
- `docs/**` that still overclaim relative to current `src/`

Gate:
- No shipped surface claims a capability that is only archived or only stubbed.

QA scenario:
- Compare shipped surfaces against the current live tool/runtime inventory in `src/tools/index.ts`, `src/plugin/opencode-plugin.ts`, and `docs/architecture/2026-03-16-hivemind-master-model.md`.
- Run a shipped-surface grep over `README.md`, `package.json`, `commands/**`, and `skills/**` for archived-only tool names such as `hivemind_codemap`, `hivemind_read_skeleton`, `hivemind_precision_patch`, `hivemind_mesh_pull`, and legacy `hivemind_doc` claims.
- Expected pass result: no active shipped surface overclaims archived-only capabilities, and any historical references are clearly marked archival or obsolete.

### 2. Entry, bootstrap, and recovery hardening

Outcome:
- The host can initialize, assess damage, repair runtime state, and validate harness readiness before deeper feature work resumes.

Primary targets:
- `src/cli/init.ts`
- `src/cli/doctor.ts`
- `src/cli/harness.ts`
- `src/recovery/**`
- `tests/control-plane-runtime-tools.test.ts`

Gate:
- Fresh init, broken-state doctor flow, and harness readiness all have named pass conditions and executable checks.

QA scenario:
- Run the runtime bootstrap and recovery checks in an isolated temp project.
- Verify `hm-init` gates correctly when intake is incomplete, `hivemind_runtime_status` reports incomplete bootstrap state honestly, and `hm-harness` reports actionable next commands.

### 3. Entry and routing hardening

Outcome:
- Mixed-intent prompt handling is more conservative and less keyword-fragile.

Primary targets:
- `src/hooks/start-work/purpose-classifier.ts`
- `src/hooks/start-work/start-work-router.ts`
- `tests/start-work-router.test.ts`

Gate:
- Routing behavior handles messy multi-intent prompts closer to the master model's expected user journey.

QA scenario:
- Run routing tests and direct mixed-intent fixtures against `tests/start-work-router.test.ts`.
- Verify multi-intent prompts do not collapse blindly into a single implementation route and that attach/resume/defer behavior stays conservative.

### 4. Runtime and tool-contract hardening

Outcome:
- Plugin assembly, runtime tools, and shared runtime state honor the current CQRS and SDK-first rules consistently.

Primary targets:
- `src/plugin/opencode-plugin.ts`
- `src/tools/**`
- `src/shared/runtime-attachment.ts`
- `src/shared/logging.ts`
- `src/hooks/soft-governance.ts`

Gate:
- Runtime tools and shared state surfaces are internally consistent, `tool.schema` migration is complete where still pending, and remaining debt called out in root `AGENTS.md` is materially reduced.

QA scenario:
- Run focused typecheck and tool-contract tests after any contract change.
- Verify runtime tools, shared runtime state, and plugin assembly still honor current CQRS and SDK-first boundaries without reintroducing stale debt.

### 5. Command/runtime convergence

Outcome:
- Shipped command bundles map clearly to deterministic runtime behavior where required.

Primary targets:
- `src/commands/slash-command/**`
- `src/control-plane/**`
- `commands/**`

Gate:
- Commands that imply deterministic behavior are backed by real runtime handlers or explicitly documented as prompt-only guidance.

QA scenario:
- Run the authoritative runtime-path checks for `hm-init`, `hm-doctor`, and `hm-harness` using `npx tsx --test tests/control-plane-runtime-tools.test.ts` plus the plugin/runtime contract tests that cover command-backed runtime behavior.
- Expected pass result: the canonical runtime commands route through source-owned handlers, question-gate behavior remains explicit where required, and prompt-only command surfaces are documented as non-deterministic guidance.

### 6. Intelligence foundation restoration

Outcome:
- A standalone-first internal library foundation exists for `hivemind-doc`, `hivemind-handoff`, and `hivemind-inspect`, adapted from archived implementations where useful.

Primary source candidates:
- `.archive/legacy-src-20260314-140720/lib/doc-intel.ts`
- `.archive/legacy-src-20260314-140720/lib/doc-intel/*`
- `.archive/legacy-src-20260314-140720/lib/code-intel/*`
- `.archive/legacy-src-20260314-140720/tools/hivemind-doc.ts`
- `docs/planning-draft/modernize-doc-intelligence-layer.md`

Gate:
- Intelligence libraries operate without hard dependency on unstable session lineage, old `.hivemind` artifact expectations, or legacy plugin coupling.

QA scenario:
- The first fixed restoration slice is read-only `hivemind-doc` foundation behavior adapted from archived `doc-intel` read paths: outline/skim, targeted section read, chunked read, and search.
- Add and run a focused test target for that exact slice, with pass conditions covering standalone execution, chunk discipline, and no dependency on live `.hivemind` lineage or old session-engine state.

### 7. Feature re-emergence and verification

Outcome:
- Archived intelligence capabilities reappear as current, tested, source-backed surfaces.

Gate:
- `npx tsc --noEmit` passes.
- `npm test` passes.
- Fresh init succeeds in a clean project.
- Broken-state doctor flow produces repair-oriented output instead of silent failure.
- Harness readiness check produces health artifacts and recommended commands.
- Mixed-intent start-work routing remains conservative and reproducible.
- Runtime command execution works through the current control-plane path.
- Compaction-safe continuity remains covered by tests or direct reproducible checks.
- Restored intelligence surfaces have focused tests and are reflected honestly in shipped docs and command/skill surfaces.

QA scenario:
- Run the named host-readiness scenarios before calling the branch stable enough for archived feature return: fresh init, doctor on damaged state, harness readiness, mixed-intent routing, runtime command execution, and continuity/compaction checks.
- Then expose only the same fixed first-wave restored surface: read-only `hivemind-doc` actions backed by the restored foundation slice, and run its focused tool-facing verification target before any write-capable or code-intel-facing actions are introduced.

## Dependency order

1. Source-of-truth alignment
2. Entry, bootstrap, and recovery hardening
3. Entry and routing hardening
4. Runtime and tool-contract hardening
5. Command/runtime convergence
6. Intelligence foundation restoration
7. Feature re-emergence and verification

Reasoning:
- Steps 1-5 reduce ambiguity, contract drift, bootstrap risk, and runtime inconsistency.
- Step 6 becomes safer once the host architecture is stable, recoverable, and truthful.
- Step 7 should only happen after the restored foundations fit the new system, not the archived one.

## Suggested execution model

- Treat stabilization and feature restoration as separate milestones.
- Use the master model as the release gate for stabilization.
- Use the modernization draft as the design brief for intelligence restoration.
- Restore libraries before public-facing tool surfaces.
- Prefer adaptation of archived implementations over blind copy-forward.

## Immediate next phase

The next useful execution phase is not restoring `code-intel` yet. It is producing a concrete gap matrix for the active runtime spine and then selecting a bounded stabilization slice that removes the highest architectural blockers first.
