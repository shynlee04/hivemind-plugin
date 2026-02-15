# Public Branch Policy

`master` is treated as a public branch.

These paths are `dev-v3` only and must not be merged/pushed to `master`:

- `AGENTS.md`
- `CHANGELOG.md`
- `.opencode/**`
- `docs/plans/**`
- `docs/reference/**`
- `references/**`
- `prompts/**`
- `templates/**`
- `agents/**`

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
