# src/sdk-supervisor/ — Phase 1 Orchestration Control

Owns additive supervisor-side orchestration for Phase 1.

## Boundary

- This sector coordinates same-local-env OpenCode control concerns that should not live inside plugin hooks.
- It may model instance, session, workflow, health, and event supervision.
- It must not perform durable runtime mutations directly; governed tools remain the mutation gateway.

## Files

| File | Purpose |
|------|---------|
| `instance-registry.ts` | Supervisor instance registry creation and upsert helpers |
| `health.ts` | Aggregate supervisor health summaries for status/reporting seams |
| `index.ts` | Sector barrel |

## Rules

- Keep the supervisor additive-first until runtime status and CLI/control-plane paths consume it.
- Use `src/schema-kernel/` contracts for persisted and cross-session records.
- Do not re-embed plugin hook logic or tool execution logic here.
