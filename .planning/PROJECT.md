# HiveMind Runtime Refactor and Deterministic Execution Migration

## What This Is

HiveMind is an OpenCode-native governance plugin and CLI that helps developers turn messy brownfield coding work into guided, evidence-first workflows. This project initializes a brownfield refactor and migration program for the existing HiveMind codebase so the backend, harness agents, runtime control, and OpenTUI surfaces converge on a correct, deterministic OpenCode SDK architecture.

## Core Value

At runtime, HiveMind must reliably steer OpenCode agents through deterministic, tool-using workflows that are provably aligned with the live OpenCode client/server/plugin contract.

## Requirements

### Validated

- ✓ Bootstrap, recovery, and runtime readiness flows already exist through `hm-init`, `hm-doctor`, `hm-harness`, and related control-plane wiring — existing
- ✓ The plugin already exposes live OpenCode hooks and six runtime tools (`hivemind_doc`, `hivemind_runtime_status`, `hivemind_runtime_command`, `hivemind_task`, `hivemind_trajectory`, `hivemind_handoff`) — existing
- ✓ A read-only markdown-first doc-intelligence foundation is live for skim, section read, chunked read, and search workflows — existing

### Active

- [ ] Refactor backend/runtime orchestration so programmatic execution uses the correct OpenCode SDK client-server instance patterns instead of partially detached abstractions
- [ ] Rebuild harness, agent, and meta-runtime behavior so agents consistently use tools and can control runtime flow deterministically
- [ ] Finish the hanging OpenTUI frontend by binding it to the same authoritative runtime/control-plane contract as the backend
- [ ] Migrate the system progressively layer by layer so architecture cleanup, runtime verification, and feature restoration can proceed without destabilizing the shipped package

### Out of Scope

- Broad feature re-expansion before runtime determinism is proven — restoring archived capability on unstable foundations would create more drift
- Reintroducing removed or legacy public surfaces without live OpenCode proof — documentation and runtime truth must converge first
- New speculative intelligence features beyond the currently live read-only surface — defer until the runtime and harness contract is stable

## Context

This is a brownfield TypeScript/Node.js package that already ships an OpenCode plugin, CLI binaries, runtime commands, tool surfaces, and generated runtime state. Recent governance work formalized a stricter rule: runtime behavior claims now require live OpenCode server/client/plugin verification or current official documentation, and the next high-value slice is a live probe suite that proves those contracts.

The current gap is architectural, not conceptual. The project already contains useful runtime/bootstrap flows and early doc-intelligence capability, but the backend does not yet cleanly use the intended OpenCode SDK client-server execution model, harness agents are not consistently exercising tools to control programmatic runtime, and the OpenTUI frontend remains unfinished. The user wants an end-to-end refactor/migration that stacks progressively through layers so each slice can be verified before the next one lands.

## Constraints

- **Brownfield**: Refactor the existing package rather than rewrite from scratch — preserve proven runtime assets and reduce migration risk
- **SDK Contract**: OpenCode SDK official interfaces are the authority — custom abstractions must align to the real client/server/plugin boundary
- **Verification**: Runtime claims need live probes or official docs — local mocks and health checks are supporting evidence only
- **Compatibility**: Keep shipped package surfaces coherent during migration — docs, commands, plugin behavior, and runtime outputs cannot drift apart
- **Architecture**: Migrate progressively by layer — the project should harden foundations before restoring broader capabilities

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat initialization as brownfield refactor planning | Existing code, CLI surfaces, tools, and runtime flows already exist and should inform scope | — Pending |
| Use progressive layer stacking as the migration strategy | Deterministic runtime behavior must be proven one boundary at a time to avoid broad regressions | — Pending |
| Make live OpenCode interface verification a planning and execution gate | Governance now requires official-interface evidence for runtime behavior claims | — Pending |
| Keep frontend and backend bound to one control-plane truth | The OpenTUI surface should not diverge from backend runtime semantics again | — Pending |

---
*Last updated: 2026-03-17 after initialization*
