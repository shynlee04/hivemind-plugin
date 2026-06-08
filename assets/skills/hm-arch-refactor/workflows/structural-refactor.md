# Structural Refactor Workflow

The 5-step protocol for refactoring without changing behavior.

## Step 1: Establish Baseline

Capture the current behavior as tests. Without a behavior-preserving
test suite, refactor is blind.

```bash
npm test -- <affected-pattern> > evidence/baseline.txt
```

## Step 2: Plan the Refactor

Document target structure:
- New module names
- What moves where
- What gets renamed
- What gets deleted
- What cross-references need updating

Save to `templates/refactor-plan.md` (TODO if not yet created).

## Step 3: Refactor Incrementally

One atomic commit per logical change. Run tests after each.

```bash
# Make small change
npm test -- <pattern>
# If green, commit
git commit -m "refactor(<module>): <description>"
# If red, revert and re-plan
```

## Step 4: Verify Behavior Preserved

After all refactor commits:
```bash
npm test -- <pattern> > evidence/post-refactor.txt
bash assets/skills/hm-arch-refactor/scripts/check-refactor-safety.sh \
  evidence/baseline.txt evidence/post-refactor.txt
```

## Step 5: Update Cross-References

Apply 4-phase strategy (per `hm-cross-change`):
- Phase A: agents
- Phase B: skills
- Phase C: commands
- Phase D: workflows + references + templates

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| Big-bang refactor | Atomic commits |
| Refactor without tests | Establish baseline first |
| Renaming during refactor | Separate rename from move |
| Refactor + feature in one commit | Separate |
| Skip verification step | Always run check-refactor-safety.sh |
