# Cycle 1 Aggregate — Bundle Deep Scan Findings (2026-04-09)

> **Source files:** 4 bundle-scan reports (A, B, C, D) totaling 1,707 lines
> **Scope:** 20 skills, all scripts/, references/, assets/ directories
> **Status:** CYCLE 1 COMPLETE

---

## 1. Bundle Completeness by Skill

| Skill | Scripts | Refs | Assets | Evals | Bundle Grade |
|-------|---------|------|--------|-------|-------------|
| coordinating-loop | 8 | 4 | 0 | 2 | **A** — Full bundle |
| user-intent-interactive-loop | 5 | 5 | 0 | 2 | **A** — Full bundle |
| meta-builder | 6 | 8 | 3 | 2 | **B+** — Rich but 4 stubs, 4 orphan scripts |
| use-authoring-skills | 5 | 12 | 0 | 2 | **B** — Rich scripts/refs, 2 orphan scripts |
| harness-audit | 2 | 1 | 7 | 0 | **B-** — Rich assets, no evals, thin refs |
| skill-synthesis | 4 | 7 | 0 | 2 | **C+** — Has bug (validate-gate.sh), 3 identical-copy scripts |
| hm-deep-research | 0 | 9 | 0 | 0 | **C+** — Reference-only, no scripts/evals |
| harness-delegation-inspection | 0 | 5 | 0 | 0 | **C** — Heavy on-load cost (1,217 lines), no progressive disclosure |
| agent-authorization | 2 | 6 | 0 | 0 | **C** — Scripts exist but never called from SKILL.md |
| phase-loop | 0 | 1 | 0 | 0 | **D** — Minimal bundle, no enforcement |
| opencode-platform-reference | 0 | 20 | 0 | 0 | **C+** — Massive reference pack (1.46M lines), by design no scripts |
| oh-my-openagent-reference | 0 | 4 | 0 | 0 | **D** — 1 phantom ref, 1 empty file, no topic extraction |
| planning-with-files | 0 | 0 | 0 | 0 | **D** — Zero bundle (276L SKILL.md only) |
| opencode-non-interactive-shell | 0 | 0 | 0 | 0 | **C** — Self-contained (237L), no bundle needed |
| command-dev | 0 | 0 | 0 | 0 | **D** — Zero bundle (80L SKILL.md only) |
| custom-tools-dev | 0 | 0 | 0 | 0 | **D** — Zero bundle (86L SKILL.md only) |
| agents-and-subagents-dev | 0 | 0 | 0 | 0 | **D** — Zero bundle (177L SKILL.md only) |
| command-parser | 0 | 1 | 0 | 0 | **C** — 1 stale orphan (task_plan.md), minimal |
| eval-harness | 0 | 0 | 0 | 0 | **F** — Bare SKILL.md (270L), unimplemented /eval commands |
| session-context-manager | — | — | — | — | **REMOVED** — failed audit, pending merge into planning-with-files |

---

## 2. Quantitative Bundle Health

### Scripts
| Metric | Value |
|--------|-------|
| Total scripts across all skills | 32 |
| Scripts with clear purpose | 32 (100%) |
| Scripts called from SKILL.md | 21 (66%) |
| **Orphan scripts** (exist but not called) | **11 (34%)** |
| Scripts with external dependencies | 14 (44%) |
| **Functional bugs** | **1** (skill-synthesis validate-gate.sh) |

### References
| Metric | Value |
|--------|-------|
| Total reference files | 77 |
| Total reference lines | ~58,500+ (excluding repomix packs) |
| Repomix pack lines (not counted above) | ~2.01M |
| **Stub references** (placeholder content) | **4** (all in meta-builder) |
| **Phantom references** (SKILL.md → non-existent file) | **1** (oh-my-openagent-reference tech-stack.md) |
| **Empty references** (nearly zero content) | **1** (oh-my-openagent-reference project-structure.md, 4 lines) |
| Overlapping coverage pairs | 3 |

### Assets
| Metric | Value |
|--------|-------|
| Skills with assets/ | 2 (meta-builder, harness-audit) |
| Total asset files | 10 |
| Total asset lines | 1,540 |

### Evals
| Metric | Value |
|--------|-------|
| Skills with evals/ | 4 (coordinating-loop, user-intent-interactive-loop, meta-builder, use-authoring-skills, skill-synthesis) |
| Skills without evals | 15 |
| Eval coverage | 25% |

---

## 3. Critical Issues (Must Fix Before Stable)

### CRITICAL-1: Functional Bug — skill-synthesis validate-gate.sh
- **What:** SKILL.md calls `bash scripts/validate-gate.sh synthesize` but script only accepts `create|edit|audit`
- **Impact:** Guaranteed runtime failure when agent reaches synthesis stage
- **Fix:** Add `synthesize` action to script OR change SKILL.md call

### CRITICAL-2: 4 Stub References — meta-builder
- **What:** `depth-built-in-tools.md` (17L), `depth-repo-analysis.md` (13L), `depth-github-stacks.md` (12L), `depth-skill-synthesis.md` (13L)
- **Impact:** SKILL.md claims these contain detailed guidance but agents find "Content to be filled in"
- **Fix:** Write real content or remove references from SKILL.md

### CRITICAL-3: Phantom Reference — oh-my-openagent-reference
- **What:** `references/summary.md` lists `tech-stack.md` in its file table — file does not exist
- **Impact:** Agent following summary.md guidance will fail
- **Fix:** Generate the file or remove the row from summary.md

### CRITICAL-4: Empty Reference — oh-my-openagent-reference
- **What:** `references/project-structure.md` is only 4 lines showing repomix filename, not actual OMO repo tree
- **Impact:** Agents cannot navigate OMO codebase; must search 276K-line files.md blindly
- **Fix:** Regenerate with actual directory tree from the OMO repo

---

## 4. High-Impact Gaps (Should Fix)

| Gap | Skills Affected | Impact |
|-----|----------------|--------|
| **No scripts/evals** | command-dev, custom-tools-dev, agents-and-subagents-dev, planning-with-files, phase-loop | Cannot validate structure or test trigger accuracy programmatically |
| **11 orphan scripts** | meta-builder (4), user-intent-interactive-loop (2), agent-authorization (2), coordinating-loop (1), use-authoring-skills (2) | Scripts exist but agents never instructed to run them — dead code |
| **Byte-identical script duplication** | verify-hierarchy.sh (295L × 2), register-skill.sh (122L × 2) between coordinating-loop and user-intent-interactive-loop | 834 lines of pure duplication; bug fix divergence risk |
| **3 identical-copy scripts** | validate-skill.sh, check-overlaps.sh, validate-gate.sh between use-authoring-skills and skill-synthesis | 508 lines duplicated; must be synced manually |
| **eval-harness bare minimum** | eval-harness | 270L SKILL.md, zero bundle, unimplemented /eval commands |
| **No progressive disclosure** | harness-delegation-inspection | 1,217 lines loaded upfront on every invocation |

---

## 5. Conflict Pairs (Cross-Skill)

| Script/Ref | Skill A | Skill B | Conflict Type |
|------------|---------|---------|---------------|
| verify-hierarchy.sh (295L) | coordinating-loop | user-intent-interactive-loop | Byte-identical duplicate |
| register-skill.sh (122L) | coordinating-loop | user-intent-interactive-loop | Byte-identical duplicate |
| validate-skill.sh (187L) | use-authoring-skills | skill-synthesis | Identical copy |
| check-overlaps.sh (203L) | use-authoring-skills | skill-synthesis | Identical copy |
| validate-gate.sh (118L) | use-authoring-skills | skill-synthesis | Identical copy |
| register-skill.sh | meta-builder (24L) | use-authoring-skills (122L) | Different implementations, same name |
| validate-skill.sh | use-authoring-skills (187L) | agent-authorization (150L) | Different implementations, same name |
| non-interactive-shell.md | command-dev refs | opencode-non-interactive-shell skill | Topic overlap |
| task_plan.md / findings.md | planning-with-files | coordinating-loop | Naming collision (different dirs) |

---

## 6. Location Sanity

| Finding | Detail |
|---------|--------|
| **All 20 skills found in `.claude/skills/`** | Primary location |
| **Zero skills found in `.opencode/skills/`** | Despite environment header referencing `.opencode/skills/` paths |
| **1 skill in `.agents/skills/`** | eval-harness — inconsistent location |
| **Previous audit found `.opencode/` duplicates** | 5+ skills had diverging copies — now resolved or files moved |

---

## 7. Cycle 1 Success Criteria Check

| Criterion | Status |
|-----------|--------|
| Every file in every scripts/, references/, assets/ cataloged | ✅ 32 scripts, 77 refs, 10 assets |
| Every discrepancy between SKILL.md claims and disk reality documented | ✅ 1 phantom, 4 stubs, 1 empty, 11 orphans |
| Cross-skill script conflict pairs identified | ✅ 9 conflict pairs |
| Gap list produced for Cycle 2 | ✅ 6 high-impact gaps + numerous low-impact |

**CYCLE 1: COMPLETE ✅**

---

_Generated: 2026-04-09_
_Sources: bundle-scan-meta-concepts (550L), bundle-scan-orchestration (441L), bundle-scan-platform (321L), bundle-scan-remaining (395L)_
