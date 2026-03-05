# Implementation Docs Ownership

This directory is owned by project implementation lineages.

## Scope
- Runtime implementation design notes
- Debugging guides and test plans
- Migration and remediation records tied to `src/**` and `tests/**`

## Write Policy
- Allowed writers: `hivemaker`, `hivehealer`, `hitea`, `hiveq`
- Disallowed writers: `hivefiver` unless explicitly delegated for cross-domain integration

## Guardrails
- Keep docs actionable and test-linked.
- Link code changes to verification evidence (`npx tsc --noEmit`, `npm test`).
