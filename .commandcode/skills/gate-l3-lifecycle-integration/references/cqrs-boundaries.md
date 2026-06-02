# CQRS Boundary Enforcement

Extracted from `SKILL.md` for reference. Defines the write/read separation between tools and hooks.

## WRITE-SIDE (Tools — `src/tools/`)

Tools implement the `tool()` factory and return from `execute()`. They:
- [ ] Call SDK mutations via `session-api.ts` wrappers (never raw `client.session.*` directly)
- [ ] May call `patchSessionContinuity()` for state persistence
- [ ] Return structured responses via `shared/tool-response.ts` envelope
- [ ] NEVER read the OpenCode event stream directly
- [ ] NEVER call hook registration functions
- [ ] Accept injected dependencies (manager instances, not global singletons)

## READ-SIDE (Hooks — `src/hooks/`)

Hooks implement hook handler functions in `plugin.ts` return object. They:
- [ ] Observe events from the OpenCode event stream
- [ ] May read continuity state (`getAllSessionContinuityRecords()`) for fact-reporting
- [ ] NEVER call `patchSessionContinuity()` directly (exception: `tool.execute.after` metadata injection)
- [ ] NEVER call `delegationManager.dispatch()`
- [ ] NEVER create SDK sessions via `client.session.create()`
- [ ] Principle: events flow from write to read, never the reverse

## BLOCK-Level Anti-Patterns

These are architecture violations that stop the gate immediately:

| ID | Severity | Pattern | Detection |
|----|----------|---------|-----------|
| AP-WRITE-FROM-READ | BLOCK | Hook calling `patchSessionContinuity()` outside `tool.execute.after` audit trail | grep for `patchSessionContinuity` in `src/hooks/` |
| AP-DIRECT-SDK-FROM-HOOK | BLOCK | Hook calling `client.session.create/prompt/abort` | grep for `client.session` in `src/hooks/` |
| AP-TOOL-DIRECT-EVENT | BLOCK | Tool reading event stream directly | grep for `event` or `observer` in `src/tools/` |
| AP-CROSS-ROOT-WRITE | BLOCK | `src/` code writing to `.opencode/` | grep for `.opencode/` path literal in `src/` |
| AP-BYPASS-MANAGER | BLOCK | Tool writing directly to `.hivemind/state/` without `continuity.ts` | grep for `.hivemind/state/` file writes in `src/tools/` |
| AP-BUSINESS-LOGIC-IN-PLUGIN | BLOCK | Non-wiring code in `src/plugin.ts` | Check LOC > 200, or any non-factory, non-registration code |
| AP-DEPTH-EXCEEDED | BLOCK | Delegation depth > `MAX_DELEGATION_DEPTH` (3) | Check delegation chain depth in `DelegationManager` |

See also: `references/anti-patterns.md` for the full anti-pattern catalog with expanded detection methods.
