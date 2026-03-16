# HiveMind Smoother Development Roadmap

## A) planning_frame

- Scope: produce a bounded, evidence-based roadmap that separates internal self-hosting refactor work from the consumer-facing HiveMind/OpenCode experience.
- Assumptions avoided: this plan does not assume current docs are accurate, that plugin assembly is already clean, that permission auto-allow is safe, or that Claude-centric skill packs can be copied into OpenCode unchanged.
- Problem being solved: future development is slowed by stale authority docs, mixed CQRS boundaries, uneven internal/consumer projection, and lack of an iterative AGENTS upkeep model that learns from real failures.
- Planning rule: sequence changes so authority sync and boundary enforcement happen before UX polish, packaging expansion, or third-party pattern adoption.

## B) critical_gaps_ranked

1. **Authority drift between docs and current implementation**  
   Evidence: `AGENTS.md:173` still lists debt items already described as completed in `CHANGELOG.md:21` and `CHANGELOG.md:33`; `docs/architecture/sdk-native-architecture.md:64` already documents runtime tools under `src/tools/runtime/` while root governance text still says they are inline.

2. **CQRS and assembly-only boundary are still materially muddy in the plugin entry**  
   Evidence: `src/plugin/opencode-plugin.ts:36`, `src/plugin/opencode-plugin.ts:52`, and `src/plugin/opencode-plugin.ts:70` keep synthetic-part creation, message parsing, and trajectory event recording in the plugin layer; `AGENTS.md:169` says plugin must be assembly only.

3. **Permission and governance flow is too permissive for a framework that claims mutation gating**  
   Evidence: `src/plugin/opencode-plugin.ts:151` auto-allows all HiveMind-managed tools; `opencode.json:391` grants wildcard `edit`, `write`, `read`, and `bash` allow permissions to `*`; this weakens the stated requirement in `AGENTS.md:127` to use `permission.ask` or `context.ask()` for mutations.

4. **Internal refactor reality and consumer-facing asset story are not yet operationally separated enough**  
   Evidence: root authority says shipped product spans `commands/`, `agents/`, `workflows/`, `skills/`, `dist/`, and `bin/` in `AGENTS.md:8`, while the user-provided evidence notes uneven runtime asset syncing and incomplete wiring across shipped assets.

5. **There is no true deep-init-style iterative upkeep loop for AGENTS and governance learnings**  
   Evidence: bootstrap is centered on `hm-init` and runtime attachment (`src/plugin/runtime-plan.ts:41`, `.hivemind/config/runtime-attachment.json:24`), but there is no documented recurring intake/upkeep loop that harvests anti-patterns and verification commands into AGENTS maintenance.

6. **Useful official SDK surfaces are underexploited, leaving maintainability and runtime control on the table**  
   Evidence: `src/plugin/AGENTS.md` marks `chat.params`, `tool.definition`, and `config` as adopt-now or adopt-later targets, while current entry wiring in `src/plugin/opencode-plugin.ts:117` mostly focuses on `chat.message`, `permission.ask`, and tool execution hooks.

## C) three_solution_strategies

### Strategy 1 - Big-Bang Architecture Completion

- Frame: resolve docs, plugin CQRS, permissions, consumer projections, deep-init upkeep, and external skill adoption in one refactor tranche.
- Pros: fastest path to a theoretically consistent end state; avoids some temporary dual-mode documentation.
- Cons: highest risk of mixing internal refactor concerns with user-facing behavior; weak rollback boundaries; likely to reintroduce stale docs during the tranche.
- Why weaker: current evidence shows contradictory authorities already exist, so a large simultaneous rewrite increases the chance of certifying the wrong truth surface.

### Strategy 2 - Governance-First Dual-Track Stabilization

- Frame: first repair authority and decision boundaries, then harden runtime/plugin contracts, then improve consumer-facing entry flows, then selectively absorb outside patterns.
- Pros: creates a trustworthy source-of-truth before implementation churn; cleanly separates internal self-hosting from consumer UX; supports incremental verification gates.
- Cons: some user-visible polish lands later; requires discipline to avoid jumping ahead to packaging or init redesign.
- Why recommended: the strongest blockers are not feature gaps but truth-surface drift and boundary ambiguity. Fixing those first reduces rework across every later stage.

### Strategy 3 - Consumer-First Experience Push

- Frame: prioritize `hm-init`, doctor flows, consumer assets, and documentation polish first; defer internal CQRS cleanup until user experience stabilizes.
- Pros: quickest visible improvement for end users; easier release messaging.
- Cons: bakes unstable internal contracts into the public surface; risks normalizing permissive mutation rules and stale architecture claims.
- Why weaker: the repo already claims a stronger architecture than it consistently enforces, so polishing the facade first would institutionalize drift.

## D) recommended_staged_roadmap

### Phase 0 - Authority Reset

- Goal: establish one current truth set for architecture, debt, and consumer/internal surface boundaries.
- Depends on: existing repo evidence only; no code changes required to start.
- Entry gate: contradictory docs are identified and listed.
- Exit gate: one dated authority packet updates root-level planning/governance statements, explicitly marking stale claims superseded.
- Verification gate: every top-level claim in the packet is backed by a file reference or validated external source.

### Phase 1 - Boundary Hardening

- Goal: define the exact write/read/plugin split and mutation-gating expectations that implementation work must follow.
- Depends on: Phase 0 authority reset.
- Entry gate: plugin-layer responsibilities are enumerated into assembly-only vs extract-needed buckets.
- Exit gate: an approved boundary map exists for plugin helpers, tool execution tracking, permission policy, and consumer/internal projection ownership.
- Verification gate: planned moves align with `AGENTS.md:42`, `AGENTS.md:43`, and `AGENTS.md:169` or explicitly amend them.

### Phase 2 - Internal vs Consumer Surface Separation

- Goal: formalize what is self-hosting scaffolding versus what npm consumers must rely on.
- Depends on: Phase 1 boundary map.
- Entry gate: all shipped surfaces and dev-only mirrors are inventoried.
- Exit gate: each asset family is tagged as authoritative, projected, generated, optional, or internal-only.
- Verification gate: no consumer-facing artifact depends on repo-local mirrors or undocumented self-hosting steps.

### Phase 3 - Iterative AGENTS Upkeep Model

- Goal: create a deep-init-inspired but HiveMind-native upkeep loop that updates AGENTS from learned failures, anti-patterns, and verification commands.
- Depends on: Phase 2 asset ownership map.
- Entry gate: upkeep inputs are defined: failed verifications, recurring manual fixes, permission exceptions, and architecture drift findings.
- Exit gate: a recurring upkeep workflow exists with intake rules, update criteria, and evidence requirements for AGENTS edits.
- Verification gate: AGENTS changes become evidence-triggered, not one-shot prompt rewrites.

### Phase 4 - Selective External Pattern Adoption

- Goal: ingest only the third-party patterns that strengthen OpenCode-native behavior without importing Claude-specific assumptions.
- Depends on: Phase 3 upkeep contract.
- Entry gate: adoption matrix approved.
- Exit gate: each external pattern is classified as ingest, adapt, or reject with an owning local artifact.
- Verification gate: no adopted pattern bypasses OpenCode SDK authority or HiveMind role contracts.

### Phase 5 - Consumer Experience Improvements

- Goal: improve `hm-init` and related entry flows after the underlying truth surfaces are stable.
- Depends on: Phases 0 through 4.
- Entry gate: consumer/internal split and upkeep model are already defined.
- Exit gate: consumer-facing docs and onboarding flows reflect the real runtime, not aspirational architecture.
- Verification gate: a new user can follow the public path without needing repo-internal knowledge.

## E) external_pattern_matrix

| Source | Pattern | Decision | Why |
|---|---|---|---|
| `different-ai/openwork@opencode-primitives` | SDK-first OpenCode primitives and current surface vocabulary | Ingest | Strong fit with the repo's SDK-first principle; use as a reference baseline for hook/tool/client terminology, not as workflow authority. |
| `softaworks/agent-toolkit@agent-md-refactor` | AGENTS/agent-doc refactor discipline | Adapt | Useful for upkeep structure and prompt hygiene, but must be translated into HiveMind contract fields and OpenCode tool permissions. |
| `wshobson/agents@architecture-patterns` | Architecture review and modular boundary heuristics | Adapt | Good design vocabulary for decomposition and boundaries, but too generic to ingest without mapping to CQRS and OpenCode hooks. |
| `igorwarzocha/opencode-workflows@agent-architect` | Agent design Q&A and capability shaping | Adapt | Valuable for refining agent roles, but needs HiveMind-specific execution/delegation constraints and should not become a second orchestration model. |
| `oh-my-openagent` deep-init lessons | Hierarchical bootstrap plus iterative upkeep from learned failures | Adapt | Best used as a model for recurring AGENTS maintenance; direct copy would import a different product architecture and feature topology. |
| `oh-my-openagent` multi-source skill loading | Project/user/global skill resolution stack | Reject for now | Interesting, but adopting loading complexity before authority cleanup risks another drift layer. Revisit only after Phase 3. |
| Claude-centric TDD/orchestration skills wholesale | Direct prompt copy into HiveMind/OpenCode | Reject | The user explicitly wants adaptation, not copying; direct ingestion would preserve wrong tool assumptions and role semantics. |

## F) first_cycle_proposal

- Cycle name: **Authority-and-Boundary Truth Pass**.
- Scope: produce only documentation/planning artifacts that reconcile current repo reality, boundary policy, and the internal-vs-consumer split.
- Tasks:
  1. Create a dated authority sync note that replaces stale debt statements in root governance docs.
  2. Produce a plugin boundary map listing what remains in `src/plugin/` that should stay, move, or be policy-gated.
  3. Produce an internal-vs-consumer asset matrix covering `agents/`, `.opencode/`, `commands/`, `skills/`, `workflows/`, `dist/`, `bin/`, and `.hivemind/`.
  4. Draft an AGENTS upkeep loop spec with evidence-triggered update rules.
- Entry gate: this roadmap is accepted as the sequencing baseline.
- Exit gate: the four artifacts above exist and agree on ownership terms.
- Out of scope: code movement, hook rewrites, permission rewrites, new init UX, or external skill installation.

## G) evidence_notes

- The recommendation is mainly driven by the contradiction between root governance claims and newer architecture/changelog evidence: `AGENTS.md:173` vs `CHANGELOG.md:21` and `CHANGELOG.md:33`.
- The second strongest driver is that the plugin entry still contains helper/business logic and direct trajectory recording despite the assembly-only rule: `src/plugin/opencode-plugin.ts:36`, `src/plugin/opencode-plugin.ts:70`, and `AGENTS.md:169`.
- The permission model raises governance risk now, not later: `src/plugin/opencode-plugin.ts:151` and `opencode.json:391` together make it too easy to bypass meaningful mutation review.
- External pattern adoption should remain selective because prior synthesis already shows useful patterns are modular, not copy-paste safe: `docs/audits/ecosystem-architecture-skeleton-2026-03-14.md:431`, `docs/audits/ecosystem-architecture-skeleton-2026-03-14.md:562`, and the user-provided external evidence about adapting Claude-centric skills rather than copying them.
