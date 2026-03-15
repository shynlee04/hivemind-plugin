# src/control-plane/ — CLI Command Gate & Intake

Manages the 4 CLI primitives (`hm-init`, `hm-doctor`, `hm-harness`, `hm-settings`) and their intake/gate flows.

## Boundary

The control plane decides whether a CLI command can proceed (gate), collects required user profile fields (intake), and dispatches to the handler.

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
- All 4 commands ultimately execute through `executeSlashCommandBundle()`
