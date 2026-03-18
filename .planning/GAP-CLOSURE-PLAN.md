## Gap Closure Plan

**Milestone:** v1.0 (Post-Audit User Directives)
**Gaps to close:** 3 integration/architecture gaps, 1 E2E flow

### Proposed Phases

**Phase 2.1: Feature Architecture Migration (INSERTED)**
Closes:
- Architecture Gap: Discoverability issues, harness/runtime behavior spread across codebase.
Tasks: 3
- Migrate to hybrid structure (`src/features/*`, `src/tools/`, `src/hooks/`, `src/commands/`, `src/plugin/`).
- Establish `src/shared/contracts/` boundary.
- Consolidate runtime-entry, session-entry, workflow, trajectory, and handoff into `features/`.

**Phase 2.2: TUI End-to-End Server Connection (INSERTED)**
Closes:
- Integration Gap: TUI is an orphan spike, fails to run under Node (OpenTUI is Bun-exclusive).
- Flow Gap: Client and server not connected end-to-end for innate OpenCode capabilities.
Tasks: 3
- Extract dashboard fully into `apps/opentui` Bun app boundary.
- Wire TUI to the OpenCode server and shared runtime-status contracts.
- Prove innate OpenCode work functions without problems between client and server.

---

Create these 2 phases? (yes / adjust / defer all optional)
