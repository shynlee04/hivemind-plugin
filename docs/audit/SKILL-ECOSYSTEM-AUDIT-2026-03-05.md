# Skill Ecosystem Audit Report
## Framework Asset Inventory & Consolidation Roadmap

**Document ID**: AUDIT-SE-2026-03-05  
**Version**: 1.0.0  
**Status**: Draft  
**Classification**: Meta-Builder Audit Report  
**Compliance Standard**: REQ-MBF-2026-03-04 §6.3.1  
**Last Updated**: 2026-03-05  

---

## Executive Summary

This audit analyzes **65 active skills** (87 total files) across two directories with severe fragmentation patterns. The ecosystem scores **2.4/5** on REQ-MBF-2026-03-04 compliance dimensions, with **21 duplicate pairs**, **registry drift**, and **context contamination risks**.

### Critical Findings

| Finding | Severity | Impact |
|---------|----------|--------|
| 21 duplicate skills across directories | 🔴 CRITICAL | Context fragmentation, maintenance burden |
| Registry drift (conflicting status markers) | 🔴 HIGH | Active skill conflicts, deployment risks |
| 35 Tier 2 skeletal skills (≤2/5 compliance) | 🟠 HIGH | Poor delegation, missing handoff protocols |
| Average compliance score 2.4/5 | 🟠 HIGH | Below target for production use |
| 5 hitea-* skills unregistered | 🟡 MEDIUM | Testing infrastructure gaps |

---

## 1. Audit Methodology

### 1.1 Evaluation Framework

Per **REQ-MBF-2026-03-04 §6.3.1**, skills evaluated against 5 constitutional dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **D1**: Delegation Chain Compliance | 20% | Follows Hiveminder→Hiveplanner→Hiveq chain? |
| **D2**: Format-Agnostic Handoffs | 20% | Preserves artifact format through handoffs? |
| **D3**: Constitutional Awareness | 20% | Validates against governance requirements? |
| **D4**: Lineage Separation | 20% | Maintains hiveminder/hivefiver boundary? |
| **D5**: Context Preservation | 20% | Prevents context contamination? |

### 1.2 Skill-Judge 8-Dimension Scoring (120-point scale)

Supplemental evaluation using official skill quality criteria:

| Dimension | Max Points | Description |
|-----------|------------|-------------|
| **D1**: Knowledge Delta | 20 | Expert-only content, no basic tutorials |
| **D2**: Mindset + Procedures | 15 | Thinking frameworks + domain procedures |
| **D3**: Anti-Pattern Quality | 15 | Specific NEVER lists with WHY |
| **D4**: Description Quality | 15 | WHAT+WHEN+KEYWORDS in frontmatter |
| **D5**: Progressive Disclosure | 15 | <500 lines SKILL.md, references/ on-demand |
| **D6**: Freedom Calibration | 15 | Match freedom to task fragility |
| **D7**: Pattern Recognition | 10 | Follows Mindset/Navigation/Process/Tool patterns |
| **D8**: Practical Usability | 15 | Decision trees, fallbacks, edge cases |

**Grade Scale**:
- **A (90%+)**: 108-120 points — Production-ready expert skill
- **B (80-89%)**: 96-107 points — Good, minor improvements needed
- **C (70-79%)**: 84-95 points — Adequate, clear improvement path
- **D (60-69%)**: 72-83 points — Below average, significant issues
- **F (<60%)**: <72 points — Poor, needs fundamental redesign

---

## 2. Skill Inventory by Tier

### 2.1 Tier 1: Comprehensive Skills (30 skills)

Skills with mode routers, >100 lines, compliance score ≥3/5

| Skill | Location | Lines | Router | REQ-MBF Score | Skill-Judge Est. | Bundle |
|-------|----------|-------|--------|---------------|------------------|--------|
| `hivefiver-context-enforcer` | .opencode/skills/ | 551 | ✅ | 5/5 | A (110+) | meta-core |
| `hivefiver-prime` | .opencode/skills/ | 307 | ✅ | 5/5 | A (108+) | meta-core |
| `context-integrity` | .opencode/skills/ | 267 | ✅ | 5/5 | A (105+) | governance-core |
| `hivemind-framework-auditor` | .opencode/skills/ | 193 | ✅ | 4/5 | B (98) | verification-core |
| `delegation-intelligence` | .opencode/skills/ | 150+ | ✅ | 4/5 | B (96) | governance-core |
| `session-lifecycle` | .opencode/skills/ | 140+ | ✅ | 4/5 | B (95) | governance-core |
| `verification-methodology` | .opencode/skills/ | 130+ | ✅ | 3/5 | C (88) | verification-core |
| `hivemind-governance` | .opencode/skills/ | 120+ | ✅ | 4/5 | B (94) | governance-core |
| `research-methodology` | .opencode/skills/ | 115+ | ✅ | 3/5 | C (86) | research-core |
| `systematic-debugging-hivemind` | .opencode/skills/ | 110+ | ✅ | 3/5 | C (85) | repair-core |

### 2.2 Tier 2: Skeletal Skills (35 skills)

Skills needing enhancement (<100 lines or no router, compliance ≤2/5)

| Skill | Location | Lines | Router | REQ-MBF Score | Issues |
|-------|----------|-------|--------|---------------|--------|
| `comparative-analysis` | .opencode/skills/ | 45 | ❌ | 0/5 | No delegation guidance, no handoff protocols |
| `gate-enforcement` | .opencode/skills/ | 52 | ❌ | 1/5 | Missing constitutional awareness |
| `hiveplanner-orchestration` | .opencode/skills/ | 60 | ❌ | 1/5 | No lineage separation guidance |
| `meta-builder-governance` | skills/ | 18 | ❌ | 1/5 | Skeletal, overlaps with hivemind-governance |
| `delegation-packet-contract` | skills/ | 26 | ❌ | 1/5 | Deprecated but still active in skills/ |
| `hivefiver-skill-auditor` | skills/ | 37 | ❌ | 2/5 | Missing mode router, incomplete workflow |
| `evidence-discipline` | .opencode/skills/ | 85 | ⚠️ | 2/5 | Partial anti-pattern coverage |
| `regression-detection` | .opencode/skills/ | 70 | ❌ | 2/5 | Missing format-agnostic guidance |
| `source-evaluation` | .opencode/skills/ | 65 | ❌ | 2/5 | Limited context preservation measures |

### 2.3 Tier 3: Deprecation Candidates (Merge/Archive)

| Skill | Status | Action | Rationale |
|-------|--------|--------|-----------|
| `sequential-orchestration` | merge_candidate | → delegation-intelligence | Registry confirmed, overlaps |
| `parallel-debugging-hivemind` | merge_candidate | → systematic-debugging-hivemind | Registry confirmed, subset |
| `hivefiver-gsd-compat` | merge_candidate | → meta-builder-governance | Registry confirmed, legacy |
| `context-quality-escalation` | deprecated | Archive | Superseded by context-integrity |
| `delegation-packet-contract` | deprecated | Archive | Superseded by delegation-intelligence |

---

## 3. Critical Issues Analysis

### 3.1 DUP-001: Duplicate Directory Fragmentation (CRITICAL)

**Problem**: 21 skills exist in BOTH `.opencode/skills/` AND `skills/`

**Impact**:
- Context fragmentation — agents may load wrong version
- Maintenance burden — updates must sync across directories
- Potential inconsistency — versions may diverge silently

**Evidence** (sample):
```yaml
duplicate_pairs:
  - skill: delegation-packet-contract
    opencode_status: deprecated
    skills_status: active
    conflict: HIGH
    
  - skill: comparative-analysis
    opencode_lines: 45
    skills_lines: 42
    divergence: MINOR
    
  - skill: meta-builder-governance
    opencode_version: MISSING (unregistered)
    skills_version: 18 lines
    conflict: MEDIUM
```

**Root Cause**: Historical accumulation without consolidation strategy

**Remediation**: 
1. Establish `.opencode/skills/` as single source of truth
2. Migrate unique skills from `skills/` → `.opencode/skills/`
3. Archive `skills/` directory (keep as read-only legacy)

### 3.2 REG-001: Registry Drift (HIGH)

**Problem**: `.opencode/skills/registry.yaml` is the only registry, but `skills/` has no registry. Status mismatches between overlapping skills.

**Evidence**:
```yaml
registry_gaps:
  - skill: delegation-packet-contract
    registered_location: .opencode/skills/
    registered_status: deprecated
    unregistered_location: skills/
    unregistered_status: active
    risk: Agents may use deprecated version
    
  - skill: meta-builder-governance
    registered_location: NONE
    actual_location: skills/
    risk: Unmanaged skill, no dependency tracking
```

**Remediation**:
1. Create unified registry at `.opencode/skills/registry.yaml`
2. Add ALL skills (both directories) with reconciled status
3. Add `location:` field to track directory
4. Remove `skills/` entirely after migration

### 3.3 COMPL-001: Compliance Failure (HIGH)

**Problem**: 35 Tier 2 skills score ≤2/5 on REQ-MBF-2026-03-04 dimensions

**Common Deficiencies**:

| Deficiency | Count | Example Skills |
|------------|-------|----------------|
| No delegation chain guidance | 28 | comparative-analysis, gate-enforcement, evidence-discipline |
| Missing handoff protocols | 31 | hiveplanner-orchestration, regression-detection |
| No lineage separation | 27 | meta-builder-governance, delegation-packet-contract |
| Missing anti-contamination | 29 | source-evaluation, synthesis-patterns |
| No constitutional awareness | 25 | creative-ideating-room, market-research-framework |

**Remediation**:
1. Create compliance checklist template
2. Enhance top 10 Tier 2 → Tier 1 in Phase 2
3. Add mode routers with D1-D5 guidance to all Tier 2 skills

---

## 4. Pattern Analysis

### 4.1 Bundle Distribution

Per `.opencode/skills/registry.yaml`:

| Bundle | Skills | Coverage | Gap |
|--------|--------|----------|-----|
| governance-core | 9 | ✅ Good | None |
| planning-core | 5 | ✅ Good | None |
| research-core | 6 | ✅ Good | None |
| verification-core | 5 | ✅ Good | None |
| repair-core | 3 | ✅ Good | None |
| meta-core | 4 | ✅ Good | None |
| **testing-core** | 0 | 🔴 MISSING | 5 hitea-* skills unregistered |

### 4.2 Disclosure Level Distribution

| Level | Description | Count | Issue |
|-------|-------------|-------|-------|
| L0 | Always loaded | 6 | context-integrity, session-lifecycle |
| L1 | Common workflows | 15 | hivefiver-mode, delegation-intelligence |
| L2 | Specialized | 12 | hivemind-framework-auditor |
| L3 | Experimental | 8 | creative-ideating-room |
| **Unassigned** | No level | 24 | 🔴 Most Tier 2 skills missing |

### 4.3 Pattern Type Distribution

| Pattern | Description | Skills | Issue |
|---------|-------------|--------|-------|
| Navigation | ~30 lines, routes to sub-files | 8 | ✅ Good |
| Mindset | ~50 lines, thinking frameworks | 12 | ⚠️ Some lack procedures |
| Process | ~200 lines, phased workflows | 6 | ✅ Good |
| Tool | ~300 lines, decision trees | 4 | ✅ Good |
| **Unknown/Undeclared** | No pattern | 35 | 🔴 Tier 2 skills |

---

## 5. Consolidation Roadmap

### 5.1 Phase 1: Emergency Consolidation (Week 1) — CRITICAL

**Objective**: Resolve duplicates, reconcile registries, prevent active conflicts

**Acceptance Criteria**:
- [ ] Zero duplicate skills across directories
- [ ] Unified registry with all 65 skills
- [ ] All status conflicts resolved
- [ ] `skills/` directory archived (read-only)

**Tasks**:
1. **Day 1-2**: Inventory duplicates with version comparison
2. **Day 3-4**: Merge 3 registry-confirmed pairs:
   - sequential-orchestration → delegation-intelligence
   - parallel-debugging-hivemind → systematic-debugging-hivemind
   - hivefiver-gsd-compat → meta-builder-governance
3. **Day 5**: Update unified registry with `location:` field
4. **Day 6-7**: Move unique skills from `skills/` → `.opencode/skills/`, archive `skills/`

### 5.2 Phase 2: Compliance Enhancement (Weeks 2-3) — HIGH

**Objective**: Elevate 10 high-value Tier 2 skills to Tier 1 standards

**Selection Criteria** (REQ-MBF-2026-03-04 §6 Success Criteria):
- High usage frequency
- Critical delegation paths
- Missing compliance dimension ≥3

**Target Skills**:
1. `gate-enforcement` (verification-critical)
2. `evidence-discipline` (quality-critical)
3. `hiveplanner-orchestration` (planning-critical)
4. `research-methodology` (research-critical)
5. `comparative-analysis` (synthesis-critical)
6. `source-evaluation` (evidence-critical)
7. `synthesis-patterns` (analysis-critical)
8. `regression-detection` (quality-critical)
9. `debug-orchestration` (remediation-critical)
10. `verification-methodology` (quality-critical)

**Enhancement Requirements per Skill**:
- Add mode router with decision tree
- Include D1-D5 compliance guidance
- Add "NEVER Do" list with specific reasoning
- Ensure description has WHAT+WHEN+KEYWORDS
- Move detailed content to `references/` if >300 lines
- Target skill-judge score: B (96+) or A (108+)

### 5.3 Phase 3: Registry Optimization (Weeks 4-5) — MEDIUM

**Objective**: Complete registry with bundles, dependencies, and disclosure levels

**Tasks**:
1. Create `testing-core` bundle for 5 hitea-* skills
2. Assign disclosure_level (L0-L3) to all 24 unassigned skills
3. Map `depends_on` relationships
4. Add `supersedes` fields for deprecated skills
5. Validate registry YAML schema

### 5.4 Phase 4: Validation & Gatekeeping (Week 6) — MEDIUM

**Objective**: Validate consolidation with Hiveq constitutional gates

**Validation Chain** (per REQ-MBF-2026-03-04 §4):
```
Hiveminder (Router) → Hiveplanner (Artifact Gen) → Hiveq (Quality Gate)
     │                       │                          │
Pass-through         No interpretation         Constitutional
Preserve format      Format-agnostic           Awareness Required
```

**Validation Checkpoints**:
1. **Schema Validation**: All skills pass YAML frontmatter validation
2. **Compliance Check**: All Tier 1 skills score ≥3/5 on D1-D5
3. **Dependency Resolution**: No circular `depends_on` references
4. **Bundle Completeness**: All bundles have ≥3 skills (except specialized)
5. **Registry Integrity**: Single source of truth, no duplicates

---

## 6. Skill-Judge Scoring Sample

Detailed evaluation of 5 representative skills:

### 6.1 hivefiver-prime (Reference: A-Grade)

| Dimension | Score | Max | Evidence |
|-----------|-------|-----|----------|
| D1: Knowledge Delta | 19 | 20 | Two-lineage architecture, primitive stacking patterns — pure expert knowledge |
| D2: Mindset + Procedures | 14 | 15 | Intent-to-asset routing, delegation packet schema — thinking + procedures |
| D3: Anti-Patterns | 14 | 15 | "NEVER Do" table with specific anti-patterns and how skill prevents them |
| D4: Description | 15 | 15 | Comprehensive: "OpenCode meta-builder specialist...primitive stacking patterns..." |
| D5: Progressive Disclosure | 14 | 15 | 307 lines, references/ folder with 4 files, explicit loading triggers |
| D6: Freedom Calibration | 13 | 15 | Appropriate: high freedom for classification, structured for delegation |
| D7: Pattern Recognition | 10 | 10 | Tool pattern with decision trees, code examples, low freedom for precision |
| D8: Practical Usability | 15 | 15 | Delegation packet schema, agent registry table, permission override logic |
| **TOTAL** | **114** | **120** | **95% — Grade A** |

### 6.2 comparative-analysis (Reference: F-Grade)

| Dimension | Score | Max | Evidence |
|-----------|-------|-----|----------|
| D1: Knowledge Delta | 5 | 20 | Basic comparison framework — generic knowledge |
| D2: Mindset + Procedures | 4 | 15 | No specific procedures, generic thinking |
| D3: Anti-Patterns | 2 | 15 | No NEVER list |
| D4: Description | 6 | 15 | "Framework for structured comparison" — vague, missing WHEN |
| D5: Progressive Disclosure | 8 | 15 | 45 lines, no references/, no loading triggers |
| D6: Freedom Calibration | 5 | 15 | Mismatched — vague guidance for precision task |
| D7: Pattern Recognition | 3 | 10 | No recognizable pattern |
| D8: Practical Usability | 4 | 15 | No decision trees, fallbacks, or edge cases |
| **TOTAL** | **37** | **120** | **31% — Grade F** |

### 6.3 meta-builder-governance (Reference: D-Grade)

| Dimension | Score | Max | Evidence |
|-----------|-------|-----|----------|
| D1: Knowledge Delta | 8 | 20 | 3 basic rules — skeletal |
| D2: Mindset + Procedures | 5 | 15 | No procedures, minimal thinking framework |
| D3: Anti-Patterns | 2 | 15 | No NEVER list |
| D4: Description | 8 | 15 | Has WHAT but missing WHEN trigger scenarios |
| D5: Progressive Disclosure | 5 | 15 | 18 lines, no references/, minimal content |
| D6: Freedom Calibration | 4 | 15 | Low freedom but insufficient guidance |
| D7: Pattern Recognition | 3 | 10 | No pattern, skeletal structure |
| D8: Practical Usability | 4 | 15 | No decision trees or examples |
| **TOTAL** | **39** | **120** | **33% — Grade F (borderline D)** |

---

## 7. Recommendations

### 7.1 Immediate Actions (This Session)

1. **Authorize Phase 1 Emergency Consolidation** (Week 1)
   - Risk: Without consolidation, registry drift will worsen
   - Mitigation: Maintain `skills/` as read-only archive until Phase 4

2. **Prioritize Tier 2 Enhancement Targets**
   - Select 10 skills from Section 5.2 for Phase 2
   - Delegate to hivemaker for enhancement

3. **Validate Merge Candidates**
   - Confirm 3 registry-confirmed merges with domain experts
   - Document merge strategies (content integration vs. replacement)

### 7.2 Short-Term (Next 2 Weeks)

1. Execute Phase 1 emergency consolidation
2. Begin Phase 2 compliance enhancement (first 5 skills)
3. Create compliance checklist template for future skills

### 7.3 Medium-Term (Weeks 3-6)

1. Complete Phase 2 (remaining 5 skills)
2. Execute Phase 3 registry optimization
3. Run Phase 4 validation gates
4. Produce final audit report with PASS/FAIL verdict

### 7.4 Long-Term (Ongoing)

1. Establish skill-judge evaluation as gate for new skills
2. Quarterly registry audits to prevent drift
3. Skill lifecycle management (deprecation, archival)
4. Cross-bundle dependency monitoring

---

## 8. Success Criteria Alignment

Per **REQ-MBF-2026-03-04 §6 Success Criteria**:

| Capability | Target State | Current State | Gap |
|------------|--------------|---------------|-----|
| **Workflow Granularity** | <5 min decision points | Variable | ⚠️ Medium |
| **Context Automation** | Zero manual management | Manual loading common | 🔴 High |
| **Domain-Specific Collaboration** | Specialized agents per domain | Partial | ⚠️ Medium |
| **Lineage Separation** | Zero cross-contamination | Risk present | 🔴 High |
| **Validation Protocol Integrity** | 100% gate compliance | 2.4/5 avg score | 🔴 High |
| **Maximum Complexity Handling** | 4+ concurrent domains | Untested | ⚠️ Unknown |

**Post-Consolidation Targets** (6 weeks):
- Unified registry: ✅ 1 source of truth, 0 duplicates
- Skill quality: 🎯 80% Grade B+ (≥96/120)
- Context automation: 🎯 All references have explicit triggers
- Lineage separation: 🎯 Zero contamination events
- Validation integrity: 🎯 100% Tier 1 skills pass Hiveq gates
- Progressive disclosure: 🎯 SKILL.md <300 lines, references/ on-demand

---

## 9. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Tier 1 Skill** | Comprehensive skill with mode router, >100 lines, compliance ≥3/5 |
| **Tier 2 Skill** | Skeletal skill needing enhancement, <100 lines or no router |
| **Bundle** | Functional grouping of related skills (governance-core, etc.) |
| **Disclosure Level** | L0-L3 trigger frequency (L0=always, L3=experimental) |
| **REQ-MBF-2026-03-04** | Meta-Builder Framework Requirements document |
| **Skill-Judge** | 8-dimension evaluation framework (120 points) |
| **Mode Router** | Decision tree directing agent to appropriate workflow |

### Appendix B: Reference Documents

- `REQ-MBF-2026-03-04` — Meta-Builder Framework Requirements
- `.opencode/skills/registry.yaml` — Current skill registry
- `docs/plans/SKILL-ECOSYSTEM-INVENTORY-2026-03-04.yaml` — Full investigation output
- `skill-judge` — Evaluation criteria and patterns

### Appendix C: Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-05 | Initial audit report | Hivefiver Meta-Builder |

---

**END OF AUDIT REPORT**

**HARD STOP — Phase 1 Discovery Complete**

**Next**: Authorize Phase 1 Emergency Consolidation (Week 1) or request specific skill deep-dives before proceeding.
