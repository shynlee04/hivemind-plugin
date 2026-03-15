# src/context/prompt-packet/ — Prompt Compilation

Compiles session state into system and message packets for main and sub-sessions.

## Boundary

| File | Purpose |
|------|---------|
| `prompt-compiler.ts` | `compilePromptPacket()` — main entry, scope-aware |
| `prompt-packet-normalize.ts` | Normalizes 24+ `PromptPacketState` fields with fallbacks |
| `prompt-packet-renderers.ts` | 4 renderers: main system, main message, sub system, sub message |
| `prompt-packet-types.ts` | `SessionScope`, `KernelLineage`, `PromptPacketState`, `CompiledPromptPacket` |

## Audit Note

> [!WARNING]
> **`PromptPacketState` has 24+ optional fields.** This creates a massive payload that every prompt compilation must normalize. Consider splitting into core state (8 fields) + extension groups.
