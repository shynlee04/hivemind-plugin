# TDD Cycle Card

One card per TDD cycle. Filled during the cycle, archived at completion.

```markdown
# TDD Cycle Card: REQ-NNN

**REQ:** <REQ-NNN>
**Spec ref:** <SPEC.md path>
**Cycle started:** <ISO timestamp>
**Iteration budget:** 3 (max 5)

## Stage 1: RED
- [ ] Test written: <test file path>
- [ ] Test fails: `<exact error output>`
- [ ] Failure is the asserted behavior, not unrelated

## Stage 2: GREEN
- [ ] Minimum impl: <changed files>
- [ ] Test passes: `npm test -- <pattern>` exits 0
- [ ] No "while I'm here" changes (no refactor, no extra features)

## Stage 3: Coverage
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm test` → green
- [ ] `npm run test:coverage` → PASS / PARTIAL / MISSING / BLOCKED

## Stage 4: Cross-ref (if multi-file)
- [ ] Inbound refs to old name updated
- [ ] Per 4-phase strategy (agents → skills → commands → workflows/refs/templates)

## Stage 5: REFACTOR (skip if clean)
- [ ] Refactor done
- [ ] Test still green
- [ ] No behavior change

## Cycle Complete
- [ ] Atomic commit: `test(REQ-NNN): <description>`
- [ ] Evidence: test output, typecheck output, coverage report
- [ ] Cursor updated: `.hivemind/state/loops/<loop-id>/cursor.yaml`
```

## Storage

Save as `cycles/04-skill-XX-<name>/<REQ-NNN>-cycle-card.md`. Archive
when the cycle completes.

## Why a Card per Cycle

- Traceability: 1 card per REQ = clear history
- Iteration budget visible at a glance
- Evidence co-located with the cycle
- No context loss across disconnects (card persists)
