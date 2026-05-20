# Phase 17: Sync boundary definition + src/ audit - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit src/ for dead code, noise, and context rot across ALL modules. Produce a structured findings report that classifies each issue, records technical debt, and feeds into Phase 18 for cleanup action.

**This phase is DISCOVERY ONLY.** No file deletion, no refactoring. Findings are documented for execution in Phase 18.

</domain>

<decisions>
## Implementation Decisions

### src/ Triage Criteria
- **D-01:** Dead code = exported symbol/function/file with zero imports across src/. Detected via manual review.
- **D-02:** Noise = stub files, empty re-exports, files with no real logic.
- **D-03:** Context rot = working code that violates current architecture patterns (CQRS, 9-surface, dependency rules).
- **D-04:** Test coverage gap = module with no unit tests → flag for investigation.

### src/ Modules to Audit (all modules, sequential)
- **D-05:** src/shared/ — leaf utilities, types (start here, least risk)
- **D-06:** src/features/ — runtime features (largest, most potential rot)
- **D-07:** src/harness/ vs src/kernel/ — identical git tree SHA (duplication to resolve)
- **D-08:** src/cli/ — CLI substrate
- **D-09:** src/config/, src/coordination/, src/hooks/, src/routing/, src/schema-kernel/, src/task-management/, src/tools/ — remaining modules
- **D-10:** Audit method = manual review per module, reading actual source files

### Actions Per Category
- **D-11:** Dead code → DELETE (git rm, commit, update references)
- **D-12:** Noise → DELETE or MERGE into parent file
- **D-13:** Context rot → REFACTOR to current patterns (flag if too large for this cleanup wave)
- **D-14:** All findings → record in structured findings report with file:line, category, severity

### Sync Boundary Decisions (for Phase 18)
- **D-15:** Sync manifest format = Hybrid: JSON whitelist (sync-manifest.json) + .syncignore exclude patterns
- **D-16:** .opencode/ NOT synced as directory; primitives inside are PACKAGED for distribution via hivemind init CLI
- **D-17:** Community repo receives: whitelisted dirs from manifest; .github/workflows/ for CI; cleaned src/

### Phase Structure (SPIDR split from original Phase 17)
- **D-18:** Phase 17 = src/ audit only (discovery)
- **D-19:** Phase 18 = root cleanup + sync boundary + sync manifest
- **D-20:** Phase 19 = fix sync-oss.yml workflow implementation
- **D-21:** Phase 20 = package .opencode/ primitives for distribution

### the agent's Discretion
- Choice of specific investigation tooling (knip, ts-prune, grep-based)
- Structure of findings report format
- Per-module audit ordering within each major group

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph, dependency rules, 500-LOC limit
- `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, folder registration, naming
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract
- `src/index.ts` — Public API (what consumers see)
- `src/plugin.ts` — Composition root (447 LOC, needs reduction per PROJECT.md)

### Requirements & State
- `.planning/REQUIREMENTS.md` — All feature requirements (f-01 through f-12)
- `.planning/PROJECT.md` — Active items: dead code removal, stale modules, plugin.ts LOC reduction
- `.planning/STATE.md` — Current phase state and roadmap evolution

### Sync Workflow
- `.github/workflows/sync-oss.yml` — Current sync workflow (needs fixing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Known Issues (pre-identified)
- `src/harness/` and `src/kernel/` have identical git tree SHA — confirmed duplication
- `src/plugin.ts` at 447 LOC exceeds the 100 LOC target per PROJECT.md
- `messages-transform.ts` (67 LOC) confirmed dead per Phase 35 audit
- `src/shared/` contains stale modules per PROJECT.md: toggle-gates.ts, runtime-detection/
- 16 tools registered in plugin.ts but no unified registry (f-03c PARTIAL)

### Established Patterns
- CQRS: tools = write-side (mutate state), hooks = read-side (query state)
- All errors prefixed with `[Harness]`
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Max module size: 500 LOC
- Zod schemas for all tool inputs

</code_context>

<specifics>
## Specific Ideas

- Audit must be manual file-by-file reading (not tool-based auto-detection)
- Each finding recorded with: file path, line numbers, category (dead/noise/rot/gap), severity (HIGH/MEDIUM/LOW), recommendation
- Findings in `src/harness/` vs `src/kernel/` duplication should note which one to keep
- Track accumulated tech debt in a way that can be referenced in Phase 18

</specifics>

<deferred>
## Deferred Ideas

- **Phase 18:** Root cleanup + sync boundary implementation — execute on findings from Phase 17
- **Phase 19:** Fix sync-oss.yml workflow — implement sync-manifest.json parsing in GitHub Actions
- **Phase 20:** Package .opencode/ primitives for distribution — filter gsd-* development tooling, package hm-*/hf-*/gate-*/stack-* for hivemind init CLI
- Resolve src/harness=kernel duplication (moved to Phase 18 as cleanup action)
- CLI hivemind init implementation (deferred to Phase 20+)

</deferred>

---

*Phase: 17-Sync-boundary-definition-src-audit-and-cleanup*
*Context gathered: 2026-05-20*
