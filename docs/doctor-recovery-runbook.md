# Doctor Recovery Runbook

## Purpose
Repair broken `.hivemind` lineage safely when session/brain/graph state diverges.

## Symptoms
- `.hivemind/sessions/manifest.json` empty while session files exist.
- `sessions/active.md` blank while brain has active session.
- `brain.session.id` and `graph/trajectory.session_id` mismatch.
- Runtime starts with stale or disconnected session state.

## Modes
- `report`
  - Diagnose only. No state mutation.
- `repair`
  - Build report, snapshot forensics, rebuild canonical session manifest, realign active lineage.

## Commands
- Report only:
  - `npx hivemind-context-governance doctor --doctor-mode report`
- Repair:
  - `npx hivemind-context-governance doctor --doctor-mode repair`
- Repair preview (no writes):
  - `npx hivemind-context-governance doctor --doctor-mode repair --dry-run`
- Repair with hard reset behavior:
  - `npx hivemind-context-governance doctor --doctor-mode repair --hard-reset`

## Repair Sequence
1. Emit doctor report (`.hivemind/recovery/doctor-report.json`).
2. Snapshot forensic artifacts into `.hivemind/recovery/forensics-<timestamp>/`.
3. Rebuild `sessions/manifest.json` from `sessions/active/` and `sessions/archive/`.
4. Rebuild `sessions/active.md` from canonical selected session.
5. Realign:
  - `brain.session.id`
  - `graph/trajectory.session_id`
6. Emit lineage artifact (`.hivemind/recovery/lineage-repair.json`).

## Precedence Rules
1. Active session file IDs are preferred for active lineage.
2. If hard reset and no active file is available, newest session artifact is selected.
3. Brain and trajectory session IDs are rewritten to selected lineage ID.

## Rollback
- Use files in `.hivemind/recovery/forensics-<timestamp>/` to restore pre-repair state.
- Re-run report mode to confirm mismatch signatures are cleared.

## Verification
- `bash scripts/validate-framework.sh`
- `npx tsc --noEmit`
- `npm test`
