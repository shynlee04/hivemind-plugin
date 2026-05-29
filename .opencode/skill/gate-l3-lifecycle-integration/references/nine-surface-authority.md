# 9-Surface Mutation Authority

Extracted from `SKILL.md` for reference. Source: `.planning/codebase/ARCHITECTURE.md` § "9-Surface Mutation Authority".

The architecture defines exactly nine surfaces with write authority over canonical state. For each artifact under review, verify it conforms to its surface's authority boundaries.

## Write-Side Surfaces (may mutate state)

| Surface | What It Does | Key Constraint |
|---------|-------------|----------------|
| `continuity.ts` | CRUD on `session-continuity.json` | Deep-clone-on-read, atomic writes |
| `delegation-persistence.ts` | Delegation record I/O to `.hivemind/state/delegations.json` | Normalizes older records |
| `session-journal.ts` | Append-only event timeline per session | No updates or deletes |
| `DelegationManager` | Orchestration dispatch | Routes through canonical stores only |

## Read-Side Surfaces (observe, never mutate)

| Surface | What It Does | Key Constraint |
|---------|-------------|----------------|
| Hook factories (`src/hooks/`) | Observe events, suppress, inject metadata | Never call `patchSessionContinuity()` directly |
| Tool factories (`src/tools/`) | Return structured responses | State changes via managers, never direct file I/O |
| Sidecar (future) | Read `.hivemind/` and `.planning/` artifacts | Read-only; write enforcement test required |

## Assembly Surface

| Surface | What It Does | Key Constraint |
|---------|-------------|----------------|
| `plugin.ts` | Composition root — wires hooks + tools, instantiates managers | No business logic — wiring only |

## BLOCK Findings

BLOCK findings for surface authority violations:
- Hook calling `delegationManager.dispatch()` → read-side attempting write
- Tool writing directly to `.hivemind/` without going through `continuity.ts` → bypass
- Any cross-surface boundary crossing that violates the write/read/assembly classification
