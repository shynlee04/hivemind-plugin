# src/control-plane/ — CLI Command Gate & Intake

Manages the 4 CLI primitives (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`) and their intake/gate flows.

## Boundary

The control plane decides whether a CLI command can proceed (gate), collects required user profile fields (intake), and dispatches to the handler.
It is also the authority for first-run and repair entry flows that write user-local runtime projection under `.opencode/**`; these writes require user consent via `permission.ask` or `context.ask()` before mutation.
In Phase 1, this sector should trend toward thin intake/command adaptation while longer-lived orchestration authority moves into `src/sdk-supervisor/`.

## Files

| File | Purpose |
|------|---------|
| `control-plane-handler.ts` | Routes commands to init/doctor/harness/settings handlers |
| `control-plane-intake.ts` | Resolves profile input, detects language, checks missing fields |
| `control-plane-registry.ts` | Registers primitives and resolves gate decisions |
| `control-plane-types.ts` | `ControlPlanePrimitive`, gate results, intake evidence types |

## Design Notes

- Gate system is `detect()` pattern — each primitive probes user input for activation keywords
- Intake resolves required profile fields before allowing execution
- Non-interactive mode requires `--preset` or explicit CLI flags
- First-run (`hm-init`) and repair (`hm-doctor`) entry flows write user-local runtime projection under `.opencode/plugins/` only after obtaining user consent (e.g., via `permission.ask` hook or explicit CLI flag confirmation); all other control-plane paths are read-only
- All 4 commands ultimately execute through `executeSlashCommandBundle()`
- `hm-harness` is currently a readiness and diagnostic surface, not authoritative proof of live OpenCode behavior
- Future control-plane verification should exercise real OpenCode server/client flows rather than only raw health fetches or local bundle execution
- Avoid growing `control-plane-handler.ts` into a supervisor substitute; extract future orchestration state into dedicated supervisor and schema-kernel modules
- Runtime status reporting now consumes supervisor/kernel evidence through `hivemind_runtime_status`; this sector may influence the underlying state, but it should not grow a parallel status-report assembler.
