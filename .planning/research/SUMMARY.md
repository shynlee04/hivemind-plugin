# Project Research Summary

**Project:** HiveMind Runtime Refactor and Deterministic Execution Migration
**Domain:** OpenCode-native governance plugin/CLI refactor for deterministic runtime execution, SDK-correct orchestration, and terminal UI completion
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

HiveMind is not being repositioned as a new AI platform; it is being corrected into a native OpenCode governance layer. The research consistently points to the same conclusion: experts build this kind of product by using OpenCode's official server, SDK, plugin hooks, tools, permissions, and event streams as the authority, then layering deterministic policy, recovery, and observability on top. The brownfield failure mode is architectural drift - detached runtime abstractions, prompt-only orchestration, split ownership of state, and UI surfaces that look authoritative without being backed by the real runtime.

The recommended approach is a contract-first modular monolith with a hard separation between control plane and execution plane. Keep `@opencode-ai/sdk` in CLI/control-plane orchestration, keep `@opencode-ai/plugin` in hooks/tools/plugin assembly, standardize contracts on Zod 4, move verification to Vitest with a dedicated live OpenCode proof lane, and stabilize the shipped TUI on Ink before attempting a full OpenTUI-first renderer migration. This yields the safest brownfield path: converge on one runtime truth, one mutation gateway, one schema system, and one inspection seam before restoring higher-level capability.

The main risk is proving determinism too early or in the wrong way. The research is unambiguous that mocked tests, synthetic runtime JSON, and prompt conventions are not enough. The migration must first establish authoritative contracts, tool-backed mutation, permission enforcement, and live official-boundary verification. Only after those are stable should the roadmap expand into continuation UX, replay/audit surfaces, and deeper OpenTUI operations work.

## Key Findings

### Recommended Stack

The stack recommendation is conservative on runtime and aggressive on contract discipline. Keep the product on `Node 20 LTS` + `TypeScript 5.9.x` with `@opencode-ai/sdk` and `@opencode-ai/plugin` as the only legitimate runtime boundaries. Standardize validation on `Zod 4`, generate JSON Schema from Zod where needed, and move testing into `Vitest 4` with a separate live verification project that boots real OpenCode instances and exercises the actual plugin boundary.

For UI, the research favors finishing the current terminal experience on `Ink 6` + `React 19` rather than forcing an immediate OpenTUI rewrite. OpenTUI remains strategically relevant, but current docs still make it an experimental track for this Node-shipped package. File-backed state remains the right persistence model for this milestone, with locking added where deterministic local writes matter.

**Core technologies:**
- `@opencode-ai/sdk` - control-plane runtime authority; use it for server/client orchestration and live proof instead of custom runtime wrappers.
- `@opencode-ai/plugin` - execution-plane authority; use it for hooks, tools, permissions, and metadata at the actual OpenCode boundary.
- `TypeScript 5.9.x` - single strict implementation language across CLI, plugin, harness, and TUI to reduce brownfield drift.
- `Zod 4` - single schema layer for tool args, internal contracts, and structured-output assertions.
- `Vitest 4` - primary runner for unit, integration, and live-opencode suites with explicit proof lanes.
- `Ink 6` + `React 19` - safest production TUI path while backend truth is stabilized; defer default OpenTUI adoption.

### Expected Features

The research frames this milestone as a stabilization program, not a feature grab. Table stakes are all about correctness: SDK-backed control plane, deterministic agent execution guardrails, permission-aware mutation governance, coherent bootstrap/doctor/recovery, session continuity through compaction/resume flows, minimal TUI-visible operational feedback, and read-only runtime/doc inspection. If those are missing, HiveMind does not feel native to OpenCode.

Differentiators exist, but they are second-order. The strongest are a live official-boundary certification harness, deterministic replay/audit receipts, governance policy packs, safe parallel/worktree orchestration, and a richer OpenTUI operations console. Those should follow - not lead - the migration. The research also clearly rejects anti-features: shadow runtimes, broad legacy surface restoration, speculative intelligence work, hosted-platform expansion, and PTY-heavy execution as a core dependency.

**Must have (table stakes):**
- SDK-backed runtime control plane - the foundation for every other migration slice.
- Deterministic agent execution guardrails - make routing, steps, tool use, and metadata reproducible.
- Permission-aware mutation governance - enforce safety in hooks and permissions, not only in prompts.
- Bootstrap, doctor, and recovery coherence - preserve existing brownfield recovery value while aligning it to the real runtime.
- Session continuity and compaction survivability - keep execution state usable across resume, attach, fork, and compact flows.
- Minimal TUI-visible operational feedback - expose approvals, status, and recovery hints where operators already work.

**Should have (competitive):**
- Live official-boundary certification harness - strongest evidence-based differentiator for a governance product.
- Deterministic replay and audit timeline - turns receipts and traces into explainable governance value.
- Governance policy packs - makes brownfield-safe and recovery-safe modes easy to adopt.
- Safe parallel/worktree orchestration - valuable once single-session determinism is proven.

**Defer (v2+):**
- Full OpenTUI operations console as the default experience.
- Broad feature restoration beyond bootstrap, recovery, and inspection.
- Speculative intelligence/RAG-style expansion.
- Hosted dashboard or SaaS surfaces.

### Architecture Approach

The architecture recommendation is a contract-first modular monolith with a hard dual-plane split: control plane for SDK orchestration, execution plane for plugin hooks and tools, schema-kernel as the only durable contract owner, supervisor as the read-model and health owner, and TUI surfaces as consumers of read models rather than authorities. This is intentionally not a microservices problem. The right move is to shrink `src/shared/`, move durable contracts into `src/schema-kernel/`, move orchestration read models into `src/sdk-supervisor/`, make tools the only write gateway, and expose runtime inspection through one coherent seam instead of filesystem archaeology.

**Major components:**
1. `src/cli/` + `src/control-plane/` - bootstrap, repair, command routing, and SDK-owned external orchestration.
2. `src/plugin/` + `src/hooks/` + `src/tools/` - plugin assembly, read-side interception, and all managed mutation paths.
3. `src/schema-kernel/` - authoritative persisted and cross-session record contracts.
4. `src/sdk-supervisor/` - health, orchestration read models, and runtime aggregation.
5. `src/tui/` - read-model consumer over SDK events and runtime-status snapshots, never a second runtime.

### Critical Pitfalls

1. **Control-plane/execution-plane collapse** - avoid mixing `@opencode-ai/sdk` and `@opencode-ai/plugin` responsibilities; one misplaced runtime owner creates split-brain sessions fast.
2. **Claiming determinism from mocks** - avoid calling unit tests or health checks proof; require at least one live OpenCode boundary verification path per major runtime claim.
3. **Toolless agents and prompt-only orchestration** - avoid relying on markdown and prompts for control; put critical writes and runtime actions behind registered tools with `tool.schema` and hook assertions.
4. **Fragmented runtime truth** - avoid letting CLI, plugin, TUI, and generated artifacts each invent their own session/status models; map every user-visible state field back to one authority.
5. **State loss across compact/resume/attach** - avoid storing critical continuation state only in prompts or memory; persist the minimum deterministic record set and test recovery flows end to end.

## Implications for Roadmap

Based on the research, suggested phase structure:

### Phase 1: Runtime Authority Alignment
**Rationale:** The migration fails if HiveMind still has multiple runtime truths or blurred SDK/plugin ownership.
**Delivers:** Frozen authority map, dual-plane boundary cleanup, source-of-truth cleanup, clean config-scope baseline, and contract ownership rules.
**Addresses:** SDK-backed runtime control plane, bootstrap/doctor/recovery coherence.
**Avoids:** Control-plane/execution-plane collapse, configuration scope blindness, projection artifacts mistaken for source.

### Phase 2: Contract and Tool Gateway Consolidation
**Rationale:** Determinism cannot be enforced until writes, contracts, and status all flow through one governed path.
**Delivers:** Schema-kernel extraction, `hivemind_runtime_status` as the additive inspection seam, managed tool-only mutation, permission-aware guardrails, and removal of hidden mutations.
**Uses:** `Zod 4`, `tool.schema`, file-backed state with locks.
**Implements:** Schema kernel, managed tool mutation gateway, supervisor-ready read models.

### Phase 3: Live Proof and Deterministic Continuation
**Rationale:** Once authorities and write paths are stable, the next job is proving runtime behavior under real OpenCode conditions, including recovery flows.
**Delivers:** Vitest live-opencode suite, official-boundary certification harness, compaction/resume/fork/attach verification, and deterministic receipt baselines.
**Addresses:** Deterministic agent execution guardrails, session continuity and compaction survivability.
**Avoids:** Mock-only verification, state loss across continuation flows.

### Phase 4: TUI Binding and Operator UX Stabilization
**Rationale:** UI should land only after backend truth exists, otherwise the TUI becomes another unstable authority surface.
**Delivers:** Read-model adapter layer, Ink-based operational views, runtime-status snapshots plus event-stream rendering, approval/status/recovery UX, and server-backed TUI actions.
**Addresses:** Minimal TUI-visible operational feedback, read-only runtime inspection.
**Avoids:** TUI/backend split-brain, filesystem-driven UI state, local-only UI assumptions.

### Phase 5: Feature Restoration and Strategic Differentiators
**Rationale:** Only after the system is provably deterministic should the roadmap restore higher-surface capability or add differentiators.
**Delivers:** Replay/audit timeline, policy packs, safe parallel/worktree orchestration, selective legacy restoration, and an experimental OpenTUI adapter track if backend contracts remain stable.
**Addresses:** Competitive differentiators from the feature research.
**Avoids:** Restoring features before runtime determinism exists, premature OpenTUI-first migration, speculative platform sprawl.

### Phase Ordering Rationale

- Phase 1 must come first because the biggest brownfield risk is unclear authority, not missing UI or missing features.
- Phase 2 follows because contract ownership and tool-backed mutation are the minimum structure required before meaningful proof or recovery work can be trusted.
- Phase 3 comes before deeper UI because the roadmap needs live evidence of determinism and continuation integrity before investing in presentation richness.
- Phase 4 intentionally stays read-model-first so the frontend inherits a stable backend contract instead of inventing one.
- Phase 5 is last because differentiators like replay, policy packs, and safe parallelism depend on the earlier phases' contracts, receipts, and proof lanes.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** live proof harness details, especially how far official OpenCode APIs expose deterministic evidence for tool interception, event capture, and continuation assertions.
- **Phase 4:** longer-term TUI renderer strategy, particularly when to keep Ink, when to introduce an adapter, and what official OpenTUI Node readiness means for this package.
- **Phase 5:** deterministic replay retention format and safe parallel/worktree orchestration design; both are strategically strong but still product-specific.

Phases with standard patterns (skip research-phase):
- **Phase 1:** boundary cleanup and authority mapping are already strongly grounded in official OpenCode docs plus repo governance.
- **Phase 2:** Zod-first contracts, tool-schema mutation gateways, and file-backed state are well-supported and do not need another round of exploratory research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official OpenCode docs, Zod, Vitest, and current ecosystem evidence align strongly on the recommended stack and verification posture. |
| Features | HIGH | Table stakes are tightly grounded in current OpenCode capabilities and in the repo's actual brownfield problem shape. |
| Architecture | HIGH | The dual-plane modular-monolith recommendation is supported by both official docs and repo governance authorities. |
| Pitfalls | HIGH | The highest-risk failure modes are explicit in both official runtime behavior and current repo governance constraints. |

**Overall confidence:** HIGH

### Gaps to Address

- **Continuation record shape:** the need for persisted deterministic state is clear, but the exact minimum record set for compact/resume/fork/attach must be validated during planning and early implementation.
- **Live proof artifact design:** the requirement for official-boundary evidence is clear, but the exact artifact format, storage, and review workflow still need product decisions.
- **OpenTUI migration trigger:** the recommendation to defer OpenTUI-first shipping is strong, but the concrete conditions for promoting the adapter from experimental to default need an explicit gate.
- **Replay/audit scope:** replay is a strong differentiator, but how much detail to retain, surface, and expose to operators remains a roadmap decision rather than a settled research fact.

## Sources

### Primary (HIGH confidence)
- `https://opencode.ai/docs/sdk/` - SDK runtime control, server/client lifecycle, and live verification boundary.
- `https://opencode.ai/docs/plugins/` - plugin hooks, load order, execution-plane constraints.
- `https://opencode.ai/docs/custom-tools/` - managed tools, `tool()` contracts, and tool-surface behavior.
- `https://opencode.ai/docs/permissions/` - permission model and enforcement surfaces.
- `https://opencode.ai/docs/tui/` - TUI capabilities, attachment model, and server-backed operator surfaces.
- `.planning/research/STACK.md` - authoritative stack recommendation for this project.
- `.planning/research/FEATURES.md` - table stakes, differentiators, anti-features, and MVP ordering.
- `.planning/research/ARCHITECTURE.md` - boundary model, build order, and component responsibilities.
- `.planning/research/PITFALLS.md` - migration risks, phase-specific warnings, and prevention patterns.

### Secondary (MEDIUM confidence)
- `https://opentui.com/docs/getting-started` - OpenTUI maturity and current runtime constraints.
- `https://opentui.com/docs/bindings/react` - future-facing renderer strategy context.
- `https://raw.githubusercontent.com/vadimdemedes/ink/master/readme.md` - Ink production path and current testing posture.
- Repo-local synthesis docs under `docs/synthesis/` - helpful framing, but subordinate to official docs and current research outputs.

### Tertiary (LOW confidence)
- None used for the core recommendations; unresolved areas were left as explicit gaps instead of being upgraded from weak evidence.

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
