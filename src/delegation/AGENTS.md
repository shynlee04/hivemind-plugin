# src/delegation/ — Handoff Context Packaging

Creates, stores, and manages delegation handoff records for sub-session workflows.

## Boundary

| File | Purpose |
|------|---------|
| `delegation-packet.ts` | `createDelegationPacket()` — structured handoff context |
| `delegation-store.ts` | CRUD for `DelegationHandoffRecord` with file persistence |

## Design

- Delegation packets capture source/target sessions, evidence requirements, return contracts
- Handoff records persist in `.hivemind/state/handoffs/` as JSON files
- Lifecycle: `create → update → validate → close`
- Exposed to agents via `hivemind_handoff` tool in `src/tools/handoff/`
