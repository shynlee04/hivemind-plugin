# Prompt Packet Feature Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/prompt-packet/` owns prompt packet creation and compaction-preservation helpers. `delegation-packet.ts` creates delegation packets for subagent dispatch. `kernel-packet.ts` creates kernel packets for system prompts. `compaction-preservation.ts` preserves critical context across compaction events. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Prompt-packet may create and format packet structures for delegation and kernel use.
- Prompt-packet may preserve context across compaction events.
- All operations produce structured output; no durable state mutation.

## 3. Forbidden mutations / explicit no-go boundaries

- Prompt-packet SHALL NOT perform durable writes or filesystem mutations.
- Prompt-packet SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Prompt-packet SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/` | Consumes delegation packets for subagent dispatch | Coordination owns dispatch; feature owns packet creation |
| `src/plugin.ts` | May wire packet dependencies | Keeps assembly logic only |
| Tests | Validate packet format stability | Must test public exports |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/prompt-packet/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/features/prompt-packet/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Packet format changes must verify backward compatibility.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
