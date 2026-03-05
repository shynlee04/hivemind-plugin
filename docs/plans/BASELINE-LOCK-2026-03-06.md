# Baseline Lock (Phase 0)

## Snapshot

- Date: 2026-03-06
- Git commit (HEAD at lock capture): `6810a9f`
- Scope: Long-haul remediation replay + hardening for critical conflict set

## Verification Commands

- `npx tsc --noEmit` -> PASS
- `npm test` -> PASS (`245` passed, `0` failed)

## Tracked Artifacts

- `docs/plans/CONFLICT-LEDGER-2026-03-06.md`
- `docs/plans/EVIDENCE-REPLAY-MATRIX-2026-03-06.md`
- `docs/framework/ownership-policy.json`

## Guardrail Baseline

- `npm run lint:boundary` includes:
  - `check-sdk-boundary.sh`
  - `check-agent-registry-parity.sh`
  - `check-state-write-boundary.sh`
  - `check-docs-ownership-boundary.sh`
