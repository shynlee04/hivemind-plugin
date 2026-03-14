# Ecosystem Workstream Control Matrix

Date: 2026-03-07
Status: active-matrix
Type: control-matrix

| Workstream | Focus | Primary Surfaces | Owner Pattern | Current Status | Current Gate | Red Entry | Green Exit | Stop Condition |
|---|---|---|---|---|---|---|---|---|
| A | source authority and projection | `src/cli/init.ts`, `src/cli/sync-assets.ts`, root asset folders | planner + explorer | planned | ecosystem umbrella | packet freeze only | `git diff --check` | no runtime-hook expansion |
| B | runtime context consolidation | `src/lib/injection-orchestrator.ts`, `src/lib/plugin-fallback-context.ts`, `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` | explorer -> hitea -> maker -> hiveq | consolidation-active | `01-34-PLAN.md` | `01-32-PLAN.md` chose consolidation after a green harness packet in `01-31-PLAN.md` | `npm test` + `npx tsc --noEmit` + `git diff --check` | no governance or lifecycle file activation |
| C | governance and delegation consolidation | `src/hooks/tool-gate.ts`, `src/hooks/soft-governance.ts`, plugin delegation hook | planner only | closed-implementation | ecosystem umbrella | not allowed | not allowed | blocked until promotion |
| D | lifecycle and event consolidation | `src/hooks/event-handler.ts`, plugin events/compaction/entry guard | planner only | closed-implementation | ecosystem umbrella | not allowed | not allowed | blocked until promotion |
| E | planning-root and continuity governance | `.hivemind/project/planning/**`, checkpoints, handoffs | planner + explorer | active-planning | ecosystem umbrella | planning update approved | `git diff --check` | no implementation packet opened |
| F | lineage and operator surface alignment | `AGENTS.md`, lineage docs, agent profiles | planner + explorer | active-planning | ecosystem umbrella | planning update approved | `git diff --check` | no runtime precedence drift |
