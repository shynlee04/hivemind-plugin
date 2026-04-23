# Coverage Verification

## Valid Claim Format

"Coverage: X% (verified by `<command>` at commit `<hash>`)"

## Verification Steps

1. Run coverage command: `npm run test:coverage`
2. Copy exact output line
3. Include commit hash
4. Do not round or estimate

## Anti-Patterns

- "~90%" — no evidence
- "High coverage" — not measurable
- Outdated claim — always verify in current message
