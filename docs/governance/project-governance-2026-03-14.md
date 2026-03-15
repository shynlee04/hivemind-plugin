# src/ — Plugin Source Code

## Purpose
OpenCode plugin implementation. Compiled to `dist/` on build.

## Responsibilities
- Plugin lifecycle hooks (`opencode-plugin.ts`)
- Custom tool handlers (5 tools)
- Context engineering (system/message transforms)
- Runtime state management (trajectory, recovery, delegation)
- Document intelligence library

## Owned Failures
- Plugin crash on OpenCode session start → broken hook registration
- Stale synthetic Parts → model receives outdated context
- State mutation outside queue → `.hivemind/` corruption

## Mutation Boundary
- **May** mutate: `.hivemind/` state (via state mutation queue only)
- **Must not** mutate: `commands/`, `agents/`, `workflows/` (shipped framework assets)
- **Must not** mutate: `.opencode/` (dev mirror — changes go to root directories)

## Contracts
- **Inbound**: OpenCode SDK events, CLI invocations, agent tool calls
- **Outbound**: synthetic Parts (context injection), `.hivemind/` state files, CLI outputs

## Rules
1. **Must** follow CQRS: tools write, hooks read
2. **Must** use Zod schemas from `src/schemas/` for all state
3. **Must** JSDoc every exported function
4. **Must** pass `npx tsc --noEmit` before commit
