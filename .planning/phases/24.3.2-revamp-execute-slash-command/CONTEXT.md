# Phase 24.3.2 — Execute-Slash-Command Core Revamp: CONTEXT

> Generated 2026-05-26 from discuss-phase workflow (advisor mode)
> Based on 6 gray area analyses (GA-1 through GA-6) from gsd-advisor-researcher agents

## Decision Log

| GA | Area | Decision | Selected Option |
|----|------|----------|-----------------|
| GA-1 | Namespace Router Architecture | Frontmatter-Driven Namespace | Add `namespace:` field to YAML frontmatter — explicit, machine-verifiable, minimal code change |
| GA-2 | YAML Frontmatter Schema | Inline Extension | Extend existing frontmatter with `namespace` field. No sidecar files. Implicit from GA-1. |
| GA-3 | Workflow Separation | Hybrid Facade | One public tool (`execute-slash-command`), 2 internal modules (resolve + dispatch) extracted — backward compatible, independently testable |
| GA-4 | execute-slash-command Integration | Extend Command-Engine | Add `resolveCommandNamespace()` to command-engine read-side — CQRS-preserving, single resolution authority |
| GA-5 | GSD Re-validation | Contract-Based Validation | Verify each gsd-* command's frontmatter + routing resolves correctly — automated, no runtime execution |
| GA-6 | Backward Compatibility | Optional Namespace + Legacy Fallback | `namespace?: string`, zero breakage, incremental adoption, parallel phases unblocked |

## Key Design Constraints

- **Namespace field**: `namespace: gsd | hf | test | core` in YAML frontmatter of each command
- **Routing fallback**: exact match → fuzzy match → substring match (existing) when no namespace; exact match → namespace-scoped exact match → fuzzy → substring when namespace present
- **Hybrid facade**: `execute-slash-command.ts` stays as public tool (~300 LOC), `resolve-command.ts` and `dispatch-command.ts` extracted as internal modules
- **Command-engine extension**: add `resolveCommandNamespace(name, namespace?)` method — read-only, CQRS-compliant
- **Validation**: contract-based — parse frontmatter, verify resolution, no E2E execution
- **Migration**: optional field, zero commands require immediate changes

## Phase Scope (per ROADMAP.md)

- Fix 6 critical flaws: commandSource tracking, execution tracking, delegation-aware context, return envelope consistency, Zod schema, typed errors
- Add namespace routing (frontmatter field + command-engine resolution)
- Extract Hybrid facade (resolve + dispatch modules)
- Add contract validation for gsd-* commands
- Backward compatible — optional namespace, legacy fallback

## Dependencies

- P23.3 (GAP-01 notification UAT) — in progress, must complete before P24.3.2 delivery
- P24.3.1 (Governance Session Prototype) — completed, zero-dependency for command routing
- P24.3 (Parent: Commands Infrastructure) — namespace router scope shared

## References

- `src/tools/session/execute-slash-command.ts` — 372 LOC dispatch tool
- `src/routing/command-engine/index.ts` — current discovery/resolution
- `src/routing/command-engine/types.ts` — CommandBundle type (no namespace field yet)
- `.opencode/command/*.md` — 90 command files (33 gsd-*, 7 hf-*, 4 test-*, 8 core)
- `.planning/ROADMAP.md` — P24.3.2 scope definition
- `.planning/phases/24.3.1-governance-session-prototype/` — predecessor phase
