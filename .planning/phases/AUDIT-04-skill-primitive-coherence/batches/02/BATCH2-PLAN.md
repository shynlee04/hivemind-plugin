# BATCH 2 — Aggressive Reduction: archive 39, add 8 specialists

**Date:** 2026-06-08
**Worktree:** `.worktree/` on branch `audit-04-batch1`
**Goal:** Per user direction "TARGETING l2 and l3 skills are down to no more than 25 skills" + "lessen the number of SKILLS but make SKILL more routing and conditional loading". Bring l2+l3 to 0. Replace with 8 specialist skills.

## Archive (39 skills → `assets/.archive/dev-tooling/skills/`)

### hm-l[0-3]-* (F01 violation, 30 skills)
- All 15 hm-l2-* (brainstorm, debug, feature-ecosystem, gate-orchestrator, governance-config, phase-execution, planning-persistence, product-validation, production-readiness, refactor, requirements-analysis, roadmap-maintainability, skill-router, test-driven-execution, user-intent-interactive-loop)
- All 15 hm-l3-* (deep-research, detective, hivemind-engine-contracts, hivemind-state-reference, integration-contracts, omo-reference, opencode-non-interactive-shell, opencode-platform-reference, opencode-project-audit, research-chain, subagent-delegation-patterns, synthesis, tech-context-compliance, tech-stack-ingest, tool-capability-matrix)

### gate-* (F05, 3 skills)
- gate-evidence-truth, gate-lifecycle-integration, gate-spec-compliance

### stack-* (F06, 6 skills)
- stack-bun-pty, stack-json-render, stack-nextjs, stack-opencode, stack-vitest, stack-zod

## Add 8 specialist skills (replace archived functionality)

| # | Skill | Pattern | Replaces |
|---|---|---|---|
| 1 | `hm-test-driven` | 3 Process | hm-l2-test-driven-execution |
| 2 | `hm-debug-systematic` | 3 Process | hm-l2-debug |
| 3 | `hm-arch-refactor` | 3 Process | hm-l2-refactor |
| 4 | `hm-ship-readiness` | 3 Process | hm-l2-production-readiness |
| 5 | `hm-product-validation` | 1 Mindset | hm-l2-product-validation, hm-l2-feature-ecosystem, hm-l2-roadmap-maintainability |
| 6 | `hm-gate-triad` | 3 Process | 3 gate-* (evidence-truth, lifecycle-integration, spec-compliance) |
| 7 | `hm-stack-authoring` | 1 Mindset | 6 stack-* (helps users author their own stack-* post-install) |
| 8 | `hm-platform-references` | 2 Navigation | 15 hm-l3-* (deep-research, detective, engine-contracts, state-reference, integration-contracts, omo-reference, non-interactive-shell, platform-reference, project-audit, research-chain, subagent-patterns, synthesis, tech-compliance, tech-ingest, tool-capability-matrix) |

## After BATCH 2: shipped count

| Category | Before | After |
|---|---|---|
| hm-l[0-3]-* | 30 | 0 |
| gate-* | 3 | 0 |
| stack-* | 6 | 0 |
| hm-* (new) | 6 | 14 |
| hf-* | 12 | 12 (unchanged) |
| hivemind-* | 1 | 1 (unchanged) |
| unprefixed whitelisted | 7 | 7 (unchanged) |
| **Total** | **65** | **34** |

Aggressive: down from 65 → 34 shipped. l2+l3 = 0 (under the ≤25 budget).

## Commit strategy

1. `archive(batch2): move 39 skills (30 hm-l[0-3]-*, 3 gate-*, 6 stack-*) to .archive/dev-tooling/skills/`
2. `feat(batch2): add 8 specialist skills with full bundles (hm-test-driven, hm-debug-systematic, hm-arch-refactor, hm-ship-readiness, hm-product-validation, hm-gate-triad, hm-stack-authoring, hm-platform-references)`
3. `chore(batch2): update cross-refs in agents/commands/workflows/references to point to new names`
4. `chore(batch2): validation — validate-name.sh, npm typecheck, npm test`

## Out of scope (deferred)

- `hm-l2-build.md` → `build-orchestrator-handbook.md` rewrite (master plan §4.3 wave 3.4)
- src/** + tests/** gsd-* references (out of scope per `src/AGENTS.md`)
- `.hivemind/` runtime state (deep module, not primitive)
- Cross-lineage hf-* consolidation (separate work; hf-* is FLEXIBLE per validator)
