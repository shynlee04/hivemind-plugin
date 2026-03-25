# Refactor Checklist

## Pre-Refactor

- [ ] **Identify the smell** — Which code smell is present? (Reference: `references/code-smell-taxonomy.md`)
- [ ] **Select technique** — Which refactor technique applies? (Reference: `references/refactor-techniques.md`)
- [ ] **Assess risk level** — LOW / MEDIUM / HIGH from the technique table
- [ ] **Check test coverage** — Are the files under test? If not, write characterization tests first
- [ ] **Run existing tests** — Confirm all tests pass BEFORE any changes
- [ ] **Create branch** — `git checkout -b refactor/<smell-description>` or confirm on feature branch
- [ ] **Identify scope** — Which files/functions will be touched? List them explicitly
- [ ] **Check dependencies** — Are there callers in other modules? Other packages?
- [ ] **Plan rollback** — How to undo if something breaks? (Usually: `git revert` or `git stash`)

## During Refactor

- [ ] **Small steps** — One technique at a time. No combining multiple refactorings.
- [ ] **Run tests after each step** — `npm test` must pass before proceeding
- [ ] **Type check after each step** — `npx tsc --noEmit` must pass before proceeding
- [ ] **Preserve behavior** — Output must be identical. No functional changes.
- [ ] **Update callers** — All call sites must be updated before moving on
- [ ] **Update types** — Interfaces, generics, and type aliases must reflect the change
- [ ] **Update tests** — Tests must match the new structure (but test the same behavior)
- [ ] **Check for missed references** — Grep for old names/patterns to find stragglers
- [ ] **Document decisions** — If a choice was non-obvious, leave a comment or note

## Post-Refactor

- [ ] **Run full test suite** — `npm test` — all tests green
- [ ] **Run type check** — `npx tsc --noEmit` — zero errors
- [ ] **Run lint** — `npm run lint` — no violations
- [ ] **Run build** — `npm run build` — build succeeds
- [ ] **Review diff** — `git diff` — only intended changes present
- [ ] **Check for dead code** — Did the refactor leave behind unused imports, functions, or types?
- [ ] **Check naming** — Are all new names descriptive and consistent with codebase conventions?
- [ ] **Update documentation** — JSDoc, README, or API docs if public interfaces changed
- [ ] **Commit with conventional message** — `refactor: <description>` format
- [ ] **Code review** — Have another agent or human review the changes
- [ ] **Smoke test** — Run the application and verify the affected feature manually
