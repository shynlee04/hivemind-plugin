# Gate Evidence Scorecard — hm-spec-authoring

**Date:** 2026-06-08
**Cycle:** BATCH 1
**Pattern:** 3 (Process)
**Realm coverage:** spec, test, doc, arch, clean-code

## Gate 1: Lifecycle Integration

| Check | Result | Evidence |
|---|---|---|
| 9-surface mutation authority respected | PASS | SKILL.md is L5; `templates/SPEC-template.md` produces L5 docs; `validate-spec-falsifiability.sh` is L7 executable |
| CQRS write/read boundaries | PASS | Skill READS source artifacts, WRITES SPEC.md only |
| Event-driven wiring | N/A | No event emission |
| Classification fit | PASS | Skill in `assets/skills/`, no cross-surface |
| OpenCode SDK surface compliance | PASS | Kebab-case, no reserved prefixes |
| 22-category prefix | PASS | `hm-spec-authoring` matches `hm-spec-` allowed prefix |
| Tech-agnostic principle | PASS | No framework/language in name or body |
| Forbidden-name regex (F01-F12) | PASS | Run `validate-name.sh hm-spec-authoring skill` → exit 0 |
| `.planning/` scope | PASS | This scorecard is L5 |

## Gate 2: Spec Compliance

| Check | Result | Evidence |
|---|---|---|
| Bidirectional traceability | PASS | SPEC template has 8 sections; each REQ row cites source-ref |
| EARS acceptance criteria | PASS | 5 evals, all with falsifiable assertions |
| Spec-to-code gap | PASS | All 5 EARS patterns covered in `ears-notation.md` |
| Anti-patterns | PASS | 8 anti-patterns listed with WHY + fix |
| GSD compatibility pointer | N/A | New skill, no `gsd-*` counterpart |
| 5-realm coverage | PASS | spec (REQ derivation), test (acceptance matrix), doc (SPEC template), arch (spec-vs-design), clean-code (anti-patterns) |
| Risk tier assignment | N/A | First cycle; no inbound refs |
| Migration sequencing | N/A | First cycle |

## Gate 3: Evidence Truth

| Check | Result | Evidence |
|---|---|---|
| Evidence hierarchy | L5 (documentation-summary) | Skill is documentation; L1 would require running 5 EARS test cases against real PRDs |
| Coverage state | PASS | All 5 evals have falsifiable assertions |
| Fresh evidence | PASS | Captured in this session, 2026-06-08 |
| Dual-signal completion | PASS | Builder + this scorecard agree |
| Mock-only detection | N/A | No mock claims |

## Verdict: PASS

Skill is ready for deployment after cross-ref updates.
