# Master Plan: Skill Authoring Package Rebuild

**Created:** 2026-04-03
**Status:** ACTIVE
**Last Updated:** 2026-04-03 Phase 2 Complete, Architecture Design Phase

---

## Goal

Rebuild `use-authoring-skills` into a spec-compliant, progressively-disclosed, eval-driven, cross-platform skill authoring package that serves as the meta-builder foundation for the HiveMind harness framework.

## Architecture Vision

```
use-authoring-skills/
├── SKILL.md                          # <500 lines routing hub
├── references/                       # 12 deduplicated files
├── templates/                        # Audit + eval + scaffold
├── scripts/                          # Validation tooling
└── examples/                         # 3 worked examples (P1, P2, P3)
```

---

## Phase Gate System

### Phase 1: Context Scouting ✅ COMPLETE
- [x] Read current SKILL.md, all 9 references, templates
- [x] Read user requirements (authoring-skills-improved-resources.md, essentials.md)
- [x] Read OpenCode platform reference docs (listed, not yet consumed)
- [x] Identify 4 CRITICAL, 5 HIGH, 5 MEDIUM issues
- [x] Score all 9 reference files

### Phase 2: Deep Audit ✅ COMPLETE
- [x] Per-file deep audit with best practice comparison → Wave 1 Agent A
- [x] Content overlap matrix (quantified: ~655 lines removable) → Wave 1 Agent B
- [x] Missing content inventory (42 gaps across 5 TABs, ~25% spec coverage) → Wave 1 Agent C
- [x] Cross-reference integrity check (dead links in 06, contradictions in 04) → Wave 1 Agent A
- [x] Spec compliance analysis (02 FORBIDS spec-allowed fields) → Wave 1 Agent A

### Phase 3: Architecture Design 🔄 IN PROGRESS
- [x] Wave 1 synthesis into findings
- [ ] New reference file taxonomy (12 files proposed)
- [ ] Progressive disclosure tier assignment per file
- [ ] Cross-linkage map (this package ↔ agent/tool/command authoring)
- [ ] Template + script specifications (6 templates, 5 scripts)
- [ ] Token budget allocation
- [ ] Tension resolution proposals

### Phase 4: Implementation
- [ ] P4.1: Fix CRITICAL issues (C1-C4)
- [ ] P4.2: Deduplicate (remove ~300 lines of overlap)
- [ ] P4.3: Rebuild SKILL.md as routing hub
- [ ] P4.4: Write new reference files (06, 09-12)
- [ ] P4.5: Create templates + scripts + examples
- [ ] P4.6: Improve existing reference files

### Phase 5: Validation
- [ ] Test against real skill creation scenario
- [ ] Verify progressive disclosure token budgets
- [ ] Validate cross-platform compliance
- [ ] Measure description trigger rate
- [ ] Human review checkpoint

### Phase 6: Bridging
- [ ] Create cross-package linkage spec
- [ ] Document how this connects to agent/tool/command authoring
- [ ] Establish convention for future meta-packages

---

## Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| 2026-04-03 | Retain `use-authoring-skills` naming | Preserves existing references, rename is cosmetic | Pending user confirm |
| 2026-04-03 | Deduplicate before expanding | ~300 lines of duplication must be resolved before adding new content | Active |
| 2026-04-03 | Fix contradictions before all else | C1 (frontmatter contradiction) is blocking — agents can't follow TDD correctly | Active |

## Tensions (Unresolved)

| # | Tension | Options | Resolution |
|---|---------|---------|------------|
| T1 | Concision vs spec coverage | Lean SKILL.md + deep refs vs moderate SKILL.md + shallow refs | Pending |
| T2 | HiveMind naming vs spec naming | Keep prefix vs adopt pure spec | Pending |
| T3 | Determinism vs pattern flexibility | Rigid rules vs adaptive guidance | Pending |
| T4 | Phase-gated vs iterative loop | Sequential gates vs cyclical eval | Pending |
| T5 | Single framework vs cross-platform | HiveMind-specific vs universal | Pending |

---

## Subagent Dispatch History

| Batch | Agents | Scope | Status |
|-------|--------|-------|--------|
| Wave 0 | 4 parallel | Context scouting (SKILL.md, requirements, refs 01-04, refs 05-08) | ✅ Complete |
| Wave 1 | 3 parallel | Deep audit (frontmatter+TDD, dedup+ownership, spec gaps) | ✅ Complete |

---

## Wave 1 Synthesis: Key Numbers

| Metric | Value |
|--------|-------|
| Total lines in current references | 2,468 |
| Removable duplication | ~263 lines |
| Dead duplicate (sw-04) | 392 lines |
| **Total recoverable** | **~655 lines** |
| Spec coverage (vs Agent Skills spec) | ~25% |
| Total gaps across 5 TABs | 42 |
| New reference files needed | 4-5 |
| New templates needed | 6 |
| New scripts needed | 5 |

### Critical Discovery: Spec vs HiveMind Policy Conflict
`02-frontmatter-standard.md` is MORE restrictive than the Agent Skills spec. It FORBIDS fields (`license`, `compatibility`, `metadata`, `allowed-tools`) that the spec explicitly allows. This is intentional HiveMind policy for cross-platform compatibility, but creates a compliance gap with the broader ecosystem.

**Resolution needed:** Either (A) align with spec and allow those fields, or (B) document this as deliberate HiveMind constraint with rationale.

### Ownership Model (Agreed)
| Topic | Owner File | Others Reference |
|-------|-----------|-----------------|
| File structure + naming | 01-skill-anatomy | "See 01" |
| Frontmatter schema | 02-frontmatter-spec | "See 02" |
| Pattern definitions (P1/P2/P3) | 03-skill-patterns | "See 03" |
| TDD methodology | 04-tdd-workflow | "See 04" |
| Quality evaluation + release criteria | 05-quality-matrix | "See 05" |
| Cross-platform activation | 06-cross-platform | "See 06" (NEW) |
| Iterative refinement + memory | 07-iterative-refinement | "See 07" |
| Cross-pack coordination | 08-conflict-detection | "See 08" |
| Script authoring | 09-script-authoring | "See 09" (NEW) |
| Eval-driven development | 10-eval-lifecycle | "See 10" (NEW) |
| Description optimization | 11-description-optimization | "See 11" (NEW) |
| Anti-deception + gatekeeping | 12-anti-deception | "See 12" (NEW) |

---

## Blockers

None currently.
