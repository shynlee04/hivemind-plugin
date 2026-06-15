# Refactor Checklist

## Pre-refactor
- [ ] Behavior-preserving test suite exists (or write one via hm-test-driven)
- [ ] All tests green at baseline
- [ ] Refactor target documented (new module structure, renames, deletes)

## During refactor
- [ ] One atomic commit per logical change
- [ ] Tests run after each commit
- [ ] No behavior changes (if tests break, revert and re-plan)
- [ ] No "while I'm here" changes (separate commit)

## Post-refactor
- [ ] Full test suite green
- [ ] Coverage report captured (PASS / PARTIAL)
- [ ] Cross-references updated (agents, commands, workflows)
- [ ] Documentation reflects new structure
