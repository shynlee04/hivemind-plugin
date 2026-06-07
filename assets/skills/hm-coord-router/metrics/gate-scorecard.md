# Gate Evidence Scorecard — hm-coord-router

**Date:** 2026-06-08
**Cycle:** BATCH 1
**Pattern:** 2 (Navigation)
**Realm coverage:** spec, arch, clean-code

## Gate 1: Lifecycle Integration

| Check | Result | Evidence |
|---|---|---|
| 9-surface mutation authority respected | PASS | Routing tables reference agents/commands/workflows only; no src/, tests/, .opencode/, .hivemind/ writes |
| CQRS write/read boundaries | PASS | SKILL.md is L5 documentation; dispatch via delegate-task is L7 runtime |
| Event-driven wiring | N/A | No event emission in this skill (consumes events from `hivemind-trajectory`) |
| Classification fit | PASS | Skill lives in `assets/skills/`; no cross-surface movement |
| OpenCode SDK surface compliance | PASS | Kebab-case, no reserved prefixes |
| 22-category prefix | PASS | `hm-coord-router` matches `hm-coord-` allowed prefix |
| Tech-agnostic principle | PASS | No specific framework/language in name or body |
| Forbidden-name regex (F01-F12) | PASS | Run `validate-name.sh hm-coord-router skill` → exit 0 |
| `.planning/` scope | PASS | This scorecard is L5 only |

## Gate 2: Spec Compliance

| Check | Result | Evidence |
|---|---|---|
| Bidirectional traceability | PASS | Routing tables cite exact paths in `assets/agents/`, `assets/commands/`, `assets/workflows/` |
| EARS acceptance criteria | PASS | 5 evals in `evals/evals.json` with falsifiable assertions |
| Spec-to-code gap (Missing/Phantom/Contradictory/Underspecified) | PASS | All 10 intent classes have a command + agent entry; no orphans |
| Anti-patterns | PASS | 6 anti-patterns listed with WHY + fix |
| GSD compatibility pointer | N/A | No `gsd-*` counterpart (this is a new skill, not a rename) |
| 5-realm coverage | PASS | spec (intent classification), arch (routing), clean-code (no anti-patterns in code) |
| Risk tier assignment | N/A | First cycle; no inbound refs yet |
| Migration sequencing | N/A | First cycle |

## Gate 3: Evidence Truth

| Check | Result | Evidence |
|---|---|---|
| Evidence hierarchy | L5 (documentation-summary) | This is a planning doc; L1 would require a live runtime test of intent classification |
| Coverage state | PASS | All 5 evals have falsifiable assertions |
| Fresh evidence | PASS | Captured in this session, 2026-06-08 |
| Dual-signal completion | PASS | Builder (L0 build) + this scorecard agree |
| Mock-only detection | N/A | No mock claims |

## Verdict: PASS

Skill is ready for deployment after cross-ref updates (Phase A: agents, Phase C: commands).
