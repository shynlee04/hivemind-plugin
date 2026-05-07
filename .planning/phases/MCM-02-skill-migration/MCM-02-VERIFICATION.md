# MCM-02: Skill Migration to .opencode/ — Verification

**Date:** 2026-05-08
**Status:** passed

---

## Skill Inventory

| Lineage | Count | Ship Status | Notes |
|---------|-------|-------------|-------|
| `hm-*` | 35 | Shipped | Product-development skills (brainstorm, spec-driven, test-driven, debug, etc.) |
| `hf-*` | 13 | Shipped | Meta-authoring skills (agent-composition, skill-synthesis, command-dev, etc.) |
| `gate-*` | 3 | Internal | Quality gate triad (lifecycle-integration, spec-compliance, evidence-truth) |
| `stack-*` | 6 | Reference | Framework references (bun-pty, json-render, nextjs, opencode, vitest, zod) |
| `gsd-*` | 65 | Dev-only | NEVER shipped — internal GSD workflow tooling |
| unprefixed | 1 | Case-by-case | `opencode-config-workflow` — framework-agnostic config workflow |
| **Total** | **123** | 48 shipped, 9 internal ref, 65 dev-only, 1 case-by-case | |

## SKILL.md Validation

| Check | Result |
|-------|--------|
| All 123 skills have SKILL.md | ✅ 123/123 |
| SKILL.md files have frontmatter | ✅ (spot-checked) |

## Lineage Compliance

| Rule | Status |
|------|--------|
| Every skill has a lineage prefix (or is case-by-case evaluated) | ✅ |
| `gsd-*` excluded from shipped count | ✅ |
| hm-* skills follow product-development domain | ✅ |
| hf-* skills follow meta-authoring domain | ✅ |
| gate-* skills are internal quality gates | ✅ |
| stack-* skills are reference-only | ✅ |

## Discoverability

| Check | Result |
|-------|--------|
| `.opencode/skills/` exists | ✅ |
| All 123 skill directories present | ✅ |
| Each directory contains SKILL.md | ✅ |
| BOOT-04 symlinks operational | ✅ |

## Issues Found

None — all skills are properly classified and discoverable.

## Checklist

- [x] Skill lineage classification complete (35 hm-* + 13 hf-* shipped, 3 gate-* internal, 6 stack-* reference, 65 gsd-* dev-only)
- [x] SKILL.md validation for all 123 skills
- [x] All shipped skills discoverable in `.opencode/skills/`
- [x] No gsd-* skills in shipped set
- [x] BOOT-08 skill constitution rules verified against actual skills
- [x] BOOT-04 symlinks operational
- [x] Unprefixed skill (opencode-config-workflow) evaluated as case-by-case legitimate

## Verdict

MCM-02 verification passed. 48 shipped skills are classified and discoverable. 9 internal reference skills, 65 dev-only skills, and 1 case-by-case unprefixed skill are properly categorized.
