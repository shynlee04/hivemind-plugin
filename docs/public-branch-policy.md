# Public Branch Policy

`master` is treated as a public branch.

These paths are `dev-v3` only and must not be merged/pushed to `master`:

- `AGENT_RULES.md` — Master SOT for AI agents (internal)
- `AGENTS.md` — Agent configuration (internal)
- `CHANGELOG.md` — Development history (internal)
- `.opencode/**` — Skills, commands, agents (internal)
- `.hivemind/**` — Session state, memory, hierarchy (user-local, never tracked)
- `docs/plans/**` — Implementation plans, audits (internal)
- `docs/reference/**` — Research artifacts (internal)
- `references/**` — Code references (internal)
- `prompts/**` — Prompt templates (internal)
- `templates/**` — File templates (internal)
- `agents/**` — Agent definitions (internal)

## Why This Matters

- **master** = Public distribution (npm, GitHub releases)
- **dev-v3** = Internal development (plans, audits, research)

Leaking internal docs to master:
- Exposes development strategy to public
- Confuses users with internal-only documentation
- May contain sensitive implementation details

## Enforcement

- Local check:
  - `npm run guard:public`
- CI check on `master` PR/push:
  - `.github/workflows/ci.yml` runs `scripts/guard-public-branch.sh`

## Emergency Override

Only for explicitly approved exceptions:

```bash
ALLOW_SENSITIVE_PUBLIC=1 bash scripts/guard-public-branch.sh <base-ref> <head-ref>
```
