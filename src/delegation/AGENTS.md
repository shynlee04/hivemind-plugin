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
- Zero-trust delegation receipt verification remains a pending Phase 1 enforcement slice; keep receipt authority additive around `src/schema-kernel/` and plugin/runtime enforcement rather than embedding verification state in packet storage.
