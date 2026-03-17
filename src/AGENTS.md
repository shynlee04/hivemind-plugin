# src/ — Plugin Source Code

Source root for the OpenCode plugin. TypeScript, compiled to `dist/`.

## Boundary

Everything under `src/` ships as the npm package `hivemind-context-governance`.
The plugin entry is `plugin/opencode-plugin.ts` → registers hooks, tools, and event handlers.
Install/bootstrap authority lives in `cli/` + `control-plane/`; root markdown assets may describe that path but must not own it.
Stable governance and SOT paths should stay non-date-stamped. Compatibility aliases should point back to stable authority paths rather than become parallel authorities.

## Architecture

```
src/
├── plugin/          Assembly + enforcement wiring (NO business logic)
├── hooks/           Read-side/intercept — inject context and enforce in-band guards
├── tools/           Write-side — 6 structured agent-callable tools
├── sdk-supervisor/  Additive Phase 1 orchestration control (new sector)
├── schema-kernel/   Additive Phase 1 contract authority (new sector)
├── plugin-handlers/ Decision routing — command, tool, session resolution
├── core/            State — trajectory and workflow authority
├── commands/        Slash-command bundle registry, projection, and execution
├── context/         Prompt packet compilation and rendering
├── control-plane/   Gate/intake system for CLI commands
├── delegation/      Handoff packet creation and store
├── recovery/        State assessment, checkpoint, repair
├── governance/      Planning projection (minimal)
├── intelligence/    Doc surface routing + markdown-first read foundation
├── shared/          Utilities — paths, logging, runtime helpers
├── cli/             CLI entrypoint and command routing
└── cli.ts           CLI binary entrypoint
```

## SDK Usage Rules (Programmatic Governance)

The `src/` directory is strictly bound by the **Dual-Plane SDK Architecture**. Confusing these two API surfaces is the most fatal error in this codebase.

**1. The Control Plane (`@opencode-ai/sdk`)**
Code in `src/cli/` and `src/control-plane/` **MUST ONLY** import from `@opencode-ai/sdk`. This plane operates *outside* the agent loop. It is responsible for:
- Spawning local servers (`createOpencodeServer`)
- Initializing sessions (`client.session.create`)
- Managing high-level state.
*Never* use plugin hooks here.

**2. The Execution Plane (`@opencode-ai/plugin`)**
Code in `src/plugin/`, `src/hooks/`, and `src/tools/` **MUST ONLY** import from `@opencode-ai/plugin`. This plane operates *inside* the agent loop. It is responsible for:
- Registering custom native tools (`tool()`)
- Intercepting behavior (`system.transform`)
- Enforcing rules (`permission.ask`)
*Never* use the Client SDK here (it will cause infinite server recursion).

All code must use native SDK primitives:
- `tool.schema` (Zod) for tool argument validation inside plugins
- `permission.ask` interceptors instead of LLM system prompts for hard governance
- `tool.execute.after` to validate subagent returns (Zero-Trust Delegation)

## Verification Authority

- Behavioral claims about `src/` must prefer live OpenCode proof over local approximation.
- A real OpenCode server plus official client/plugin surfaces is the authoritative verification boundary for runtime determinism, session behavior, event flow, and hook behavior.
- Local bundle execution, direct tool instantiation, mock `PluginInput`, and ad hoc health fetches remain useful slice diagnostics, but they must not be presented as equivalent to live OpenCode verification.

## Phase 1 Direction

- `src/shared/` currently carries the live entry/runtime/turn contract seam.
- New durable contract ownership should move into `src/schema-kernel/` in additive slices instead of growing `src/shared/`.
- New orchestration behavior that coordinates sessions/workflows across turns should land in `src/sdk-supervisor/`, not in plugin hooks or oversized control-plane handlers.
- `src/tools/runtime/` is now the live reporting seam where schema-kernel runtime records and sdk-supervisor health summaries surface through `hivemind_runtime_status`; keep future reporting slices additive and inspection-first there instead of rebuilding ad hoc status logic elsewhere.

## Runtime Direction

- Prefer TS-owned feature behavior over markdown-only runtime logic.
- Keep root `commands/*.md` as thin OpenCode-facing projections; the source authority remains the registries and handlers under `src/`.
- Keep first-run and repair entry flows as the only writers of user-local `.opencode/**` runtime projection.
- Treat runtime diagnostics and live contract proof as separate evidence classes in tests, docs, and progress artifacts.

## Deprecated Modules (Audit 2026-03-15)

| Module | Issue | Action |
|--------|-------|--------|
| `core/session/` | Removed in L1 cutover; do not recreate | Keep session lifecycle in `hooks/start-work/` |
| `shared/event-bus.ts` | Removed in L1 cutover; do not recreate | Use SDK `event` hook |
| `hooks/soft-governance.ts` | Live toast-throttling helper | Keep using `client.tui.showToast()` |
