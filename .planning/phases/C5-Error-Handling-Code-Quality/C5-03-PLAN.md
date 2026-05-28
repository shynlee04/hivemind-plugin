---
phase: C5-Error-Handling-Code-Quality
plan: 03
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true
requirements: [REQ-01]
must_haves:
  truths:
    - "Zero empty `.catch(() => {})` blocks remain in `src/`"
    - "All write/critical catches emit `console.warn('[Harness] <context>:', err)` or equivalent logging"
    - "All read-only/expected catches have `// Expected: <reason>` comments"
  artifacts:
    - path: "src/ (all .ts files)"
      provides: "No empty catch blocks"
      not_contains: "...catch(() => {})"
  key_links: []
---

<objective>
Verify that REQ-01 (empty catch blocks) is already satisfied — no truly empty `.catch(() => {})` blocks remain in `src/`.

**Purpose:** The original CONCERNS.md audit identified 14 empty catch blocks. Previous C phases (C1-C4) have already fixed them. This plan confirms the fix is complete by running the SPEC's acceptance criteria grep, and documents any remaining catches that lack either logging or comments.

**Output:** Verification report confirming all catches are handled.
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/C5-Error-Handling-Code-Quality/C5-SPEC.md
@.planning/C5-Error-Handling-Code-Quality/C5-RESEARCH.md

Note: The RESEARCH.md file inventory (lines 202-219) is OUTDATED — previous C phases (especially C1) have already fixed most of the 14 empty catch blocks. Current codebase state (verified by real-time grep) shows zero truly empty `.catch(() => {})` blocks in `src/`.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Verify zero empty catch blocks + verify all catches are annotated</name>
  <files></files>
  <read_first>
    No file reads needed — all verification is via grep commands.
  </read_first>
  <action>
    Run the SPEC acceptance grep command to confirm zero empty catch blocks. Then review the complete list of catch blocks to verify each one has either logging or an explanatory comment.

    **Step 1 — SPEC acceptance grep:**
    Run `grep -rn '\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*{\s*}\s*)' src/ --include='*.ts'`
    
    Expected result: **zero matches** (exit code 1). All empty catch blocks already fixed by earlier C phases.

    **Step 2 — Full catch inventory:**
    Run `grep -rn '\.catch' src/ --include='*.ts'` to list all catch blocks. For each match, verify the block has either:
    - `console.warn('[Harness]'` / `console.error('[Harness]'` — for write/critical operations
    - `void client.app?.log?.({...})` — for write/critical operations (established pattern)
    - `// Expected:` or `// Best-effort:` comment — for read-only/expected failures
    - Meaningful error recovery logic (retry, rethrow, default value)

    **Step 3 — Generate findings report:**
    If any catch block lacks both logging and a comment, create a brief note as a comment in the SUMMARY. If all catches are properly annotated, the report confirms REQ-01 is satisfied.

    **Key constraint (per SPEC REQ-01):**
    - Write/critical catches MUST have `console.warn('[Harness] <context>:', err)` — but the existing `void client.app?.log?.(...)` with `level: "warn"` and `[Harness]` prefix is equivalent and acceptable per codebase conventions
    - Read-only/expected catches MUST have `// Expected: <reason>` comments
    - The `notification-router.ts:74` catch (`.catch(() => { this.finalizeDelivery(...) })`) does something meaningful (retry delivery) — this is NOT an empty catch and needs no change
    - The `atomic-write.ts` catches (`.catch(() => null)`) return null for stat operations — these are expected failures, not empty catches
    - The `session-api.ts` catch (`.catch(() => [] as unknown[])`) returns an empty array — this is an expected failure with a default value
  </action>
  <verify>
    <automated>
      # SPEC acceptance grep — must return zero matches
      result=$(grep -rn '\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*{\s*}\s*)' src/ --include='*.ts' 2>&1)
      if [ -z "$result" ]; then echo "PASS: Zero empty catch blocks"; else echo "FAIL: Found matches:\n$result"; fi
    </automated>
    <automated>npx tsc --noEmit 2>&1 | head -5</automated>
  </verify>
  <done>
    Acceptance grep confirms zero empty catch blocks in src/; all existing catches have logging, comments, or meaningful error handling
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| (Verification-only plan — no code changes, no new trust boundaries) | |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| (No threats — verification plan, no code changes) | | | | |
</threat_model>

<verification>
- [ ] `grep -rn '\.catch\s*(\s*(\(\s*\)|_\s*)?\s*=>\s*{\s*}\s*)' src/ --include='*.ts'` returns zero matches
- [ ] Every catch block in `src/` with empty body is either logged, commented, or has meaningful error handling
- [ ] `npm run typecheck` passes (no code changes, but confirm environment is clean)
</verification>

<success_criteria>
- Zero empty `.catch(() => {})` blocks remain in `src/` (all 14 from original audit already fixed)
- All catches are either annotated with comments or emit structured logging
- REQ-01 acceptance criteria satisfied without new code changes
</success_criteria>

<output>
Create `.planning/phases/C5-Error-Handling-Code-Quality/C5-03-SUMMARY.md` when done
</output>
