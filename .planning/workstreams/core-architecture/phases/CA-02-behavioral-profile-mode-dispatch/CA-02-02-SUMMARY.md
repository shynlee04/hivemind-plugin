# CA-02-02 Summary: Integration — Hooks, Plugin, Delegation, Category Gates

## Status: ✅ COMPLETE

## Commit
`2697b64b` — `feat(CA-02-02): wire behavioral profile into hooks, plugin, delegation, and category gates`

## What was built

### Files modified
| File | Change |
|------|--------|
| `src/hooks/types.ts` | Added `getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile` to `HookDependencies` |
| `src/hooks/create-core-hooks.ts` | Refactored `system.transform` — intake and behavioral now inject independently. Behavioral injects guardrailLevel, delegationMode, toolAccessPattern, skillFilter, language, runtime, and discuss.mode |
| `src/plugin.ts` | Wired `resolveBehavioralProfile` into deps via closure over `projectDirectory` |
| `src/lib/delegation-manager.ts` | Added `applyBehavioralGuardrail()` — strict→1, moderate/minimal→undefined (tighten-only) |
| `src/lib/category-gates.ts` | Added `checkSkillFilterAdvisory()` — advisory-only, non-blocking pure function |
| `src/lib/session-api.ts` | Added `getSessionBehavioralProfile()` SDK wrapper |

### Key design decisions applied
- D-04/D-05: Full behavioral context injected into system.transform
- D-09/D-10: getBehavioralProfile accessor on HookDependencies with lazy resolution
- D-11: Advisory-only skill filter (non-blocking)
- D-12: Guardrail overrides tighten-only — never loosen beyond workspace policy
- D-14: Discuss mode injected for reflective vs. fast-track behavior

### Refactoring note
`system.transform` was restructured to decouple intake and behavioral injection blocks. Previously, behavioral injection was gated behind intake availability (`if (!intake) return`). Now both are independent injection blocks — behavioral profile injects even when intake returns undefined.

### Test coverage
- 14 new tests:
  - 4 system.transform behavioral injection tests (full fields, backward compat, ordering, independent injection)
  - 3 DelegationManager behavioral guardrail tests (strict, moderate, minimal)
  - 3 checkSkillFilterAdvisory tests (curated advisory, all passthrough, skill name inclusion)
  - Existing 24 Wave 1 tests still passing

### Requirements satisfied
- REQ-CA02-02, REQ-CA02-05, REQ-CA02-06, REQ-CA02-07, REQ-CA02-08

### Verification
```
npm run typecheck → 0 errors
npm test → 1690 pass, 2 fail (pre-existing session-journal, unrelated)
```
