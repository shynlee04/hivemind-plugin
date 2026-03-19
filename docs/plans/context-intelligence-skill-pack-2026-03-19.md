# Context-Intelligence Skill Pack — Implementation Plan

**Status:** IN PROGRESS — Phase 1 Complete
**Date:** 2026-03-19
**Last Updated:** 2026-03-19
**Unblocked:** Context pollution audit complete

---

## Executive Summary

Create a Context-Intelligence Skill Pack that provides:
1. Must-load at all entry points defense against context rot, pollution, and poisoning
2. Entry state detection for various granular entry types
3. Workflow hierarchy awareness
4. Delegation scope tracking with boundaries
5. External plan detection with deterministic mechanisms
6. Context rot defense with severity grades

**CRITICAL:** Must identify and resolve existing context pollution BEFORE creating new skills.

---

## Phase 0: Context Pollution Audit ✅ COMPLETE

### Completed

1. **Map existing skills** ✅ - Identified all skills across platforms:
   - `skills/` - 8 skills (7 active + _deprecated_hive/)
   - `.opencode/skills/` - 1 skill (duplicate)
   - `.codex/skills/` - 50+ skills (all duplicates)
   - `.qwen/skills/` - 7 skills (3 unique)
   - `.roo/skills/` - 3 skills (all duplicates)
   - `.github/skills/` - 38 skills (GSD primary source)

2. **Identify conflicts** ✅ - Found:
   - ~55% duplication rate
   - 7 deprecated skills still accessible in `.codex/skills/`
   - Trigger conflicts between `context-integrity` and planned skill

3. **Categorize pollution sources** ✅ - Classified:
   - LEGITIMATE: GSD skills (`.github/skills/`), unique skills
   - OVERLAPPING: Root skills duplicated in `.codex/skills/`
   - CONFLICTING: `context-integrity` vs `context-intelligence-entry`
   - DEPRECATED: 7 skills in `_deprecated_hive/` but duplicated

4. **Document hierarchy** ✅ - Established:
   - `.github/skills/gsd-*` is PRIMARY for GSD
   - `skills/` is PRIMARY for HiveMind-specific skills
   - `_deprecated_hive/` should be inaccessible

### Output ✅
- `docs/plans/context-pollution-audit-2026-03-19.md` ✅ CREATED
- Pollution severity: HIGH (~55% duplication)

---

## Phase 1: Core Entry Pack ✅ COMPLETE

### 1.1 Main Entry Skill ✅ CREATED

**File:** `skills/context-intelligence-entry/SKILL.md` ✅

**Purpose:** Always-activated defense for agentic IDE workflows.

**Core Principles:**
1. Skeptical Reading — Trust but verify all inherited context
2. Hierarchy Awareness — Know your authority scope at all times
3. Entry State Awareness — Recognize where you are in session lifecycle
4. Delegation Clarity — Understand inherited vs. own scope
5. Rot Detection — Watch for context degradation signals

**Created:** ✅ `skills/context-intelligence-entry/SKILL.md`

### 1.2 Entry State Matrix

| State | Indicators | Required Action |
|-------|------------|-----------------|
| NEW SESSION | First message, fresh context | Full context map |
| RESUMED | Mid-session continuation | Verify prior state |
| DEGRADED | Pruned context, gaps | Assess damage |
| DELEGATED | Subagent context | Verify scope |
| INTERRUPTED | Post-cancellation, partial state | Re-establish truth |

### 1.3 Context Rot Defense Model

| Level | Name | Detection | Response |
|-------|------|----------|----------|
| 0 | CLEAN | All signals consistent | Continue normal ops |
| 1 | SUSPECT | Minor inconsistencies | Note, verify before critical actions |
| 2 | DEGRADED | Significant drift | Pause, assess, recover |
| 3 | POLLUTED | Major conflicts | Stop, isolate, rebuild |
| 4 | POISONED | Dangerous/malicious | Emergency isolation, user alert |

### 1.4 Detection Dimensions

- D1: Governance Integrity (files exist, references current, authority legitimate)
- D2: Temporal Consistency (timestamps align, no future-dated artifacts)
- D3: Delegation Scope (chain traceable, boundaries explicit, no scope creep)
- D4: Workflow Integrity (P→I→V→D flow intact, no orphaned artifacts)
- D5: Platform Surface (paths correct, cross-platform awareness accurate)

---

## Phase 2: Detection Script ✅ COMPLETE

**File:** `skills/context-intelligence-entry/scripts/context-harness-init.js` ✅ CREATED

**Capabilities:**
- Detects session type (NEW, RESUMED, DEGRADED, DELEGATED, INTERRUPTED)
- Calculates rot level (CLEAN, SUSPECT, DEGRADED, POLLUTED, POISONED)
- Trust score calculation (0.0 - 1.0)
- Authority chain detection
- Platform directory detection
- Git status verification
- Structured JSON output

**Created:** ✅ `skills/context-intelligence-entry/scripts/context-harness-init.js`

---

## Phase 3: Reference Files ✅ COMPLETE

### 3.1 Context Rot Taxonomy ✅ CREATED

**File:** `skills/context-intelligence-entry/references/context-rot-taxonomy.md` ✅

**Content:**
- Severity level definitions (CLEAN through POISONED)
- Detection checklists per dimension (D1-D5)
- Response protocols per level
- Trust scoring methodology

### 3.2 Entry State Matrix ✅ CREATED

**File:** `skills/context-intelligence-entry/references/entry-state-matrix.md` ✅

**Content:**
- Session lifecycle state definitions
- Required actions per state
- State transition rules
- Recovery patterns

### 3.3 Delegation Scope ✅ CREATED

**File:** `skills/context-intelligence-entry/references/delegation-scope.md` ✅

**Content:**
- Scope inheritance matrix (what to inherit)
- Scope declaration protocol
- Chain of command rules
- Anti-patterns (scope bleed, creep, abandonment)

### 3.4 Trust Matrix ✅ CREATED

**File:** `skills/context-intelligence-entry/references/trust-matrix.md` ✅

**Content:**
- Signal trust weights
- Effective trust calculation
- Confirmation thresholds per action
- Evidence types and weights

### 3.5 Platform Surface ✅ CREATED

**File:** `skills/context-intelligence-entry/references/platform-surface.md` ✅

**Content:**
- Cross-platform directory mappings
- Framework-specific paths
- Symlink resolution rules
- Path pattern matching

---

## Phase 4: Branching Skills

### 4.1 Delegation Boundary

**Purpose:** When delegating to subagents or receiving delegated scope.

**Trigger:** Delegation detected or required.

### 4.2 Workflow Hierarchy

**Purpose:** When executing granular, relational, hierarchical workflows.

**Trigger:** Workflow invoked.

### 4.3 Context Rot Defense

**Purpose:** When context degradation, pollution, or poisoning suspected.

**Trigger:** Drift signals detected.

### 4.4 Artifact Authority

**Purpose:** Determine authoritative sources for artifacts and governance.

**Trigger:** Authority conflict detected.

---

## Phase 5: Meta-Builder Skill

**File:** `skills/hivemind-meta-builder/SKILL.md`

**Purpose:** Framework for creating HiveMind-specific skills.

**Will Bundle:**
- Context-intelligence frame
- Skill-writing guidance
- Audit methodology
- Hivemind packaging patterns

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Context rot detection rate | > 90% |
| Trust scoring accuracy | > 85% |
| Non-breaking integration | 100% |
| Workflow speed | No degradation |
| User verification gate compliance | > 95% |
| Multi-framework situational awareness | > 90% |

---

## Non-Breaking Criteria

| Criterion | Validation |
|-----------|------------|
| No ceremony added to workflows | User confirms no ritual overhead |
| Existing test suite passes | `npm test` clean |
| Build succeeds | `npm run build` clean |
| Context rot defense doesn't block | Direct action test passes |
| Verification gates user-controlled | Gates at user points, not ritual |
| No framework dogma | Multiple framework awareness works |

---

## Dependencies

- OpenCode SDK available (for `client.*` APIs)
- Skills system functional
- Available frameworks (multiple, situational selection)

---

## Constraints

- Must not break existing mechanisms
- Must not add ceremony to workflows
- Must not force single-framework dogma
- Verification gates must be user-controlled, not ritual
- Framework selection must follow situation, not naming conventions

---

## History

| Date | Action |
|------|--------|
| 2026-03-19 | Plan created |
| 2026-03-19 | Phase 0 complete: Context pollution audit ✅ |
| 2026-03-19 | Phase 1 complete: Core entry skill ✅ |
| 2026-03-19 | Phase 2 complete: Detection script ✅ |
| 2026-03-19 | Phase 3 complete: All reference files ✅ |
| 2026-03-19 | **Audit:** Isolated agent verification (52/100 score) |
| 2026-03-19 | **Fix:** Implemented ALL 24 rot dimension checks (was stubbed) |
| 2026-03-19 | **Fix:** Added context flood detection (docs/plans flood) |
| 2026-03-19 | **Fix:** Created Zod schema for output contract |
| 2026-03-19 | **Fix:** Added action_gate to JSON output |
| 2026-03-19 | **Code Review:** Isolated agent verification (PASSED) |
| 2026-03-19 | **Fix:** ESM/CommonJS - renamed to .cjs |

---

## Code Review Results (2026-03-19)

**Status: ✅ PASSED**

### Verified:
- ✅ ALL 24 rot dimension checks implemented (28 checks across 5 dimensions)
- ✅ Zod schema complete with matching JSON output
- ✅ Context flood detection working (5 metrics)
- ✅ Action gates correctly calculated from trust + rot level
- ✅ Scoring aligned (0-20 scale → 0-4 levels)
- ✅ Reference files complete (1,067 lines)
- ✅ SKILL.md structure correct

### Fixed:
- ESM/CommonJS incompatibility → Renamed to `.cjs`

---

## Audit Findings (2026-03-19)

**Authenticity Score: 52/100**

### Critical Issues Fixed:
1. ✅ 21/23 rot checks were hardcoded TRUE → Now implemented
2. ✅ No Zod schema → Created `schemas/output.schema.ts`
3. ✅ No action_gate output → Added to JSON output
4. ✅ No context flood detection → Added document flood checks

### Issues Found by Isolated Agent:
- Document flood: 394 .md files, 188 plan-related files, 23 dot directories
- Scoring mismatch: Taxonomy 0-20 vs Script 0-4 → Aligned
- Dimensions not in output → Added to result

---

## Next Actions

1. ~~Complete context pollution audit~~ ✅ DONE
2. ~~Create core entry skill~~ ✅ DONE
3. ~~Create detection script~~ ✅ DONE (Fixed)
4. ~~Create reference files~~ ✅ DONE
5. ~~Create Zod schema~~ ✅ DONE
6. ~~Implement ALL rot checks~~ ✅ DONE
7. ~~Add context flood detection~~ ✅ DONE
8. **Phase 4:** Create branching skills (delegation-boundary, workflow-hierarchy, context-rot-defense, artifact-authority)
9. **Phase 5:** Create meta-builder skill
10. **Testing:** Verify skill loading and detection works