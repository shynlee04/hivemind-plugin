# Context Map: context-entry-verify

## Package Inventory

| Asset | Size | Role |
|-------|------|------|
| `SKILL.md` | 70 lines | Entry/activation contract |
| `scripts/hm-verify.cjs` | 1012 lines | Standalone verification CLI |
| `references/gate-definitions.md` | 43 lines | Gate specification |
| `references/gate-chain-order.md` | 41 lines | Execution order rationale |

## Independence Blockers

1. **False auto-run enforcement** — "Runs `hm-verify.cjs gate-chain --raw` BEFORE any work execution" is prose-only; no `src/**` runtime backs this claim.
2. **Sibling comparison language** — "Different from context-intelligence-entry" directly couples identity to a sibling package.
3. **False planning gate assumptions** — Layer 2 gates require `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and phase directories. These are project-specific HiveMind conventions, not universal verification.
4. **Script is the real value** — `hm-verify.cjs` (1012 lines, zero npm deps) is genuinely useful, but SKILL.md frames it as a mandatory gating enforcer rather than an optional verification tool.
5. **No projection for scripts** — Current sync projection does not mirror scripts to `.opencode/skills/`, so the auto-run claim is doubly false for projected contexts.

## Refactor Actions

1. Remove auto-run enforcement language — frame as "use when you want to verify project state"
2. Remove sibling comparison — describe what this skill IS, not what it ISN'T
3. Keep Layer 1 (project reality) and Layer 3 (git) gates as universal
4. Mark Layer 2 (planning) gates as project-specific/optional
5. Keep `hm-verify.cjs` as a bundled script resource (it works and has value)
6. Add independence rules section matching `spec-distillation` pattern
7. Add `tests/direct-invocation.md` for standalone validation
