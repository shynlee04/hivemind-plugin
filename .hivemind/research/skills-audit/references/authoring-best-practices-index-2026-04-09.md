# Skill Authoring Best Practices — Linked Reference Index

> **Source:** `.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/users-prompting-workspace-resources/2026-04-02/authoring-skills-improved-resources.md`
> **Lines:** 1492 | **Do NOT inline this file.** Read sections on demand only.

## Section Map (read ONLY what you need)

| Tab | Section | Lines | When to Read |
|-----|---------|-------|-------------|
| TAB 1 | Skill-authoring phases & granular steps | 1–8 | Before creating any skill |
| TAB 2 | Specification: SKILL.md format, frontmatter, anatomy | 9–292 | When writing SKILL.md frontmatter or validating structure |
| TAB 3 | Using scripts in skills: one-off, self-contained, agentic design | 293–638 | When adding scripts/ to a skill |
| TAB 4 | Evaluating skills: test cases, grading, iteration loop | 639–947 | When creating evals/ or iterating on skill quality |
| TAB 5 | Optimizing descriptions: trigger testing, train/validation split | 948–1151 | When rewriting skill descriptions for pick-rate |
| TAB 6 | Adding skill support to your agent | 1152–1492 | When integrating skills into an agent platform |

## Key Principles (extracted for quick reference)

### Description Quality (from TAB 5)
- Use imperative phrasing: "Use this skill when..." not "This skill does..."
- Focus on user intent, not implementation
- Err on the side of being pushy — explicitly list contexts
- Keep under 1024 characters
- Test with 20 queries (10 should-trigger, 10 should-not-trigger, near-misses)
- Use train/validation split (60/40) to avoid overfitting

### Skill Anatomy (from TAB 2)
- `name`: 1-64 chars, lowercase + hyphens only, must match directory name
- `description`: 1-1024 chars, must say WHAT and WHEN
- Body: keep SKILL.md under 500 lines, push detail to references/
- Progressive disclosure: metadata (~100 tokens) → body (<5000 tokens) → resources (as needed)

### Script Design (from TAB 3)
- NO interactive prompts — agents run in non-interactive shells
- Document with `-help` output
- Use structured output (JSON/CSV) to stdout, diagnostics to stderr
- Idempotent, safe defaults, meaningful exit codes
- Pin versions for one-off commands

### Eval Loop (from TAB 4)
- Start with 2-3 test cases, expand after first results
- Assertions: programmatically verifiable, not vague
- Run with-skill and without-skill for baseline comparison
- Grade with concrete evidence, not opinions
- Iterate: improve skill → rerun → compare → repeat

## Full File Path

```
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/users-prompting-workspace-resources/2026-04-02/authoring-skills-improved-resources.md
```

Read with offset for specific sections. Example: `Read(filePath, offset=293, limit=350)` for TAB 3 scripts.
