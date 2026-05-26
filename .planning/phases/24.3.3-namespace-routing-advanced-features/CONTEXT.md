# Phase 24.3.3 — Execute-Slash-Command Advanced Features: CONTEXT

> Generated 2026-05-27 from plan-phase workflow
> Builds on GA-1 through GA-6 decisions from P24.3.2 discuss-phase

## Phase Scope (per ROADMAP.md:84)

Fix 4 high/medium flaws: natural language intent, fuzzy discovery+cache, dynamic agent/subtask resolver, agent switch+restore, sub session context.

**Deferred from P24.3.2 (SPEC.md:119-123):**
- Namespace routing via frontmatter `namespace:` field
- Module extraction (`resolve-command.ts`, `dispatch-command.ts`)
- Contract validation for gsd-* commands
- `resolveCommandNamespace()` read-side method

**Out of scope items now in scope (SPEC.md:125-133):**
- Natural language intent parsing
- Fuzzy discovery and caching
- Dynamic agent/subtask resolver
- Full agent switch + restore
- Full sub session context implementation
- Command auto-append via natural language
- Shell command integration with slash commands
- Workflow file parsing in slash commands

## Inherited Design Decisions (from P24.3.2 GA-1 through GA-6)

| GA | Area | Decision | Selected Option |
|----|------|----------|-----------------|
| GA-1 | Namespace Router Architecture | Frontmatter-Driven Namespace | Add `namespace:` field to YAML frontmatter |
| GA-2 | YAML Frontmatter Schema | Inline Extension | Extend existing frontmatter with `namespace` field |
| GA-3 | Workflow Separation | Hybrid Facade | One public tool + 2 internal modules (resolve + dispatch) |
| GA-4 | Command-Engine Integration | Extend Command-Engine | Add `resolveCommandNamespace()` read-side method |
| GA-5 | GSD Re-validation | Contract-Based Validation | Verify frontmatter + routing resolution |
| GA-6 | Backward Compatibility | Optional Namespace + Legacy Fallback | `namespace?: string`, zero breakage |

## Key Design Constraints

- **Namespace field**: `namespace: gsd | hf | test | core` in YAML frontmatter
- **Routing fallback**: exact → fuzzy → substring when no namespace; exact → namespace-scoped exact → fuzzy → substring with namespace
- **Hybrid facade**: `execute-slash-command.ts` stays as public tool (target ~300 LOC after extraction), `resolve-command.ts` and `dispatch-command.ts` extracted
- **Module extraction mandatory**: `execute-slash-command.ts` is 527 LOC (>500 cap), must extract before adding new features
- **Command-engine extension**: `resolveCommandNamespace(name, namespace?)` — read-only, CQRS-compliant
- **Validation**: contract-based parse of frontmatter, verify resolution, no E2E execution
- **Migration**: optional field, zero commands require immediate changes
- **NL intent**: separate module `intent-resolver.ts`, command-engine routing only after intent resolved
- **Fuzzy discovery**: add cache layer to command-engine, TTK (time-to-kiasu) budget < 50ms per fuzzy lookup
- **Agent switch/restore**: one-shot (subtask:false + agent) synthetic parent prompt path exists per P21.2; P24.3.3 wires it into command routing
- **Sub session context**: `parentSessionID` packet injection already in execute-slash-command per P24.3.2

## Dependencies

- P24.3.2 — must be closed out (1 remaining wide import, 527 LOC cap) before P24.3.3 delivery
- P21.2 — Front-Agent Switch One-Shot Agent Override prototype (subtask:false + agent path exists, L1 UAT pending)
- P24.3 (Parent: Commands Infrastructure) — scope shared

## Current State of `execute-slash-command.ts`

- 527 LOC (15+ existing tests pass)
- 1 remaining wide import (`@opencode-ai/plugin` via `PluginInput`)
- 4 session tools moved to `src/tools/session/`
- `src/schema-kernel/commands.schema.ts` + `src/shared/errors/commands.ts` created
- Return envelope consistent (ToolResponse)
- Typed error classes (5 classes)
- commandSource + execution tracking fields exist
- Delegation-aware context (parentSessionID) exists

## References

- `src/tools/session/execute-slash-command.ts` — 527 LOC, needs extraction
- `src/routing/command-engine/index.ts` — current discovery/resolution
- `src/routing/command-engine/types.ts` — CommandBundle type (no namespace field yet)
- `.opencode/commands/*.md` — 90 command files
- `.planning/ROADMAP.md:84` — P24.3.3 scope
- `.planning/phases/24.3.2-revamp-execute-slash-command/24.3.2-SPEC.md` — deferred items + out of scope items
- `.planning/phases/24.3.2-revamp-execute-slash-command/CONTEXT.md` — GA-1 through GA-6 decisions
- `src/tools/session/` — session tool group (4 tools)
- `src/schema-kernel/commands.schema.ts` — commands schema module
- `src/shared/errors/commands.ts` — typed error classes
