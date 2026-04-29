---
phase: SE-3.6
workstream: skill-ecosystem
status: PLANNED
depends_on:
  - SE-3
blocks:
  - SE-5 (gate orchestration needs product validation routing)
  - SE-9 (final verification includes product validation)
created: 2026-04-29
---

# SE-3.6: Product Validation Skill Hardening — Context

## Phase Goal
Harden the already-created `hm-product-validation` skill (20KB on disk) through full RICH-1 through RICH-8 audit, trigger tuning, and quality gate alignment. This skill provides the product-lens methodology for validating technical decisions against user impact, product vision, and business value.

## Starting State
- `hm-product-validation` SKILL.md exists on disk (~20KB)
- Pre-gate skills (hm-brainstorm, hm-requirements-analysis, hm-cross-cutting-change, hm-tech-context-compliance) are hardened in SE-3
- hm-gate-orchestrator does NOT yet exist (SE-5 delivers it)
- Skill has never been through a dedicated RICH audit

## Deliverables
- Hardened `hm-product-validation` SKILL.md passing RICH-1 through RICH-8
- Verified handoff from hm-brainstorm → hm-product-validation → hm-requirements-analysis
- Verified alignment with hm-production-readiness for deployment-readiness handoff
- Updated trigger description covering RICE score, product validation, anti-solution-check

## Acceptance Criteria
- [ ] hm-product-validation passes RICH-1 through RICH-8 audit
- [ ] Trigger description mentions: RICE score, product validation, anti-solution-check, feature prioritization
- [ ] Handoff to hm-requirements-analysis documented in routing section
- [ ] Handoff from hm-brainstorm documented in prerequisites
- [ ] No dead references to non-existent skills
- [ ] Description follows V.7 template format established in SE-H5

## Known Risks
- hm-gate-orchestrator does not exist yet — product-validation references to gate triad must use forward-compatible patterns
- Depends on SE-3 completion; if pre-gate skills change routing patterns, product-validation may need re-alignment

## Skills Needed
- `hm-product-validation` — primary target skill
- `hm-brainstorm` — upstream handoff verification (hardened in SE-3)
- `hm-requirements-analysis` — downstream handoff verification (hardened in SE-3)
- `hm-production-readiness` — cross-reference alignment (hardened in SE-3.5)
