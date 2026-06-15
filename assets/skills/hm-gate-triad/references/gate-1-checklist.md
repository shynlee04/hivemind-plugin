# Gate 1: Lifecycle Integration Checklist

9 sub-checks for the lifecycle-integration gate.

1. **9-surface mutation authority**: Does the change touch only its intended surface?
2. **CQRS write/read boundaries**: Are reads/writes in the correct layer?
3. **Event-driven wiring**: Are events emitted and consumed in the right order?
4. **Classification fit**: Is the artifact in the correct surface (skill/agent/command/etc.)?
5. **OpenCode SDK surface compliance**: Kebab-case? No reserved prefixes?
6. **22-category prefix match**: Does the new name fit one of the 22 allowed prefixes?
7. **Tech-agnostic principle**: No specific framework/language in name or body?
8. **Forbidden-name regex (F01-F12)**: Does the validator exit 0?
9. **`.planning/` scope**: Is L5 documentation only (no runtime code)?

## Verdict
- All 9 PASS → Gate 1 PASS
- Any FAIL → Gate 1 FAIL with file:line for each issue
