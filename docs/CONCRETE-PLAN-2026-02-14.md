# CONCRETE PLAN: HiveMind Plugin Stabilization & Enhancement

**Created**: 2026-02-14  
**Author**: Analysis based on Wave 1-4 feedback  
**Purpose**: Systematic fix for all identified symptoms with root cause evidence

---

## Executive Summary

This plan addresses the REAL root cause: **the framework doesn't prevent or auto-correct manual mistakes**. The chaos you created manually should have been detected and fixed automatically by the framework.

---

## PART I: CORRECTED ROOT CAUSE ANALYSIS

### The Misunderstanding in Original Analysis

| What You Did | Original Analysis (WRONG) | Correct Root Cause |
|--------------|--------------------------|-------------------|
| Created files manually with timestamp names | Code exports wrong format | Framework should VALIDATE and AUTO-FIX on startup |
| Mixed old + new session formats | Export code uses different format | Framework should AUTO-DETECT and normalize |
| No YAML frontmatter | Code doesn't add frontmatter | Framework should INJECT on first access |
| Documents scattered everywhere | Code doesn't organize them | Framework should DETECT and offer migration |

**THE BUG IS NOT "code creates bad files" — THE BUG IS "framework doesn't prevent/correct manual mistakes"**

---

### Symptom Category 1: Entry Point Problems
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| ".hivemind has not set up as hierarchy they suppose to be" | No startup validation that required structure exists | `src/hooks/session-lifecycle.ts` - missing bootstrap validation |
| First turn starts without context | No forced pull of brain+hierarchy+anchors+mems on turn 0 | `src/hooks/session-lifecycle.ts` line ~200 |

### Symptom Category 2: Artifact Organization Chaos
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| Sessions named `011313022026.md` AND `session_2026-02-12_...` | Framework doesn't validate/consistency on startup | Need validation in `src/hooks/session-lifecycle.ts` |
| No YAML frontmatter on sessions | Framework doesn't inject frontmatter on first access | Need auto-inject in `src/tools/declare-intent.ts` |
| No INDEX.md traversable entry | Framework doesn't auto-generate index | Need auto-regen in `src/ifecycle.ts` |
| Documents inhooks/session-l wrong places | No startup scan to detect misplaced files | Need detection in `src/lib/migrate.ts` |

### Symptom Category 3: Nonsensical Toasts (Poisoning Context)
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| Toasts with technical jargon | `formatIgnoredEvidence` outputs `[SEQ] [PLAN] [HIER]` | `src/lib/detection.ts` line 259 |
| Messages don't help agent | Detection signals not transformed to actionable guidance | `src/hooks/soft-governance.ts` |
| No "what to do next" in toasts | Raw counters passed, no action mapping | Need evidence→action mapping in `src/lib/detection.ts` |

### Symptom Category 4: Prompt Transformation Missing
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| Compact misunderstood | No documentation + no post-compact context | Need docs + post-compact injection |
| Context lost between turns | No forced re-read at checkpoints | Need forced re-read hooks |

### Symptom Category 5: CLI vs Slash Command Confusion
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| CLI commands exist but "/" doesn't work | Missing `name` field in command YAML frontmatter | `.opencode/commands/hivemind-scan.md` - needs `name:` field |

### Symptom Category 6: Brownfield Detection Not Working
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| scan_hierarchy action=analyze exists but never runs | Not wired to first-turn flow | Need auto-trigger in `src/hooks/session-lifecycle.ts` |

### Symptom Category 7: Delegation + TODO Not Enforced
| What You See | Root Cause | Evidence Location |
|--------------|------------|-------------------|
| export_cycle rarely called | No auto-trigger after subagent completion | Need hook in `src/hooks/event-handler.ts` |
| Subagent results lost | No enforcement that results are captured | Need enforcement layer |

---

## PART II: CONCRETE EXECUTION PHASES

### PHASE 1: Startup Validation & Auto-Fix (CRITICAL)
**Target**: Framework detects mess on startup and offers to fix it

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 1.1 Add startup structure validation | `src/hooks/session-lifecycle.ts` | On load, verify all required files exist | Detects missing/wrong files |
| 1.2 Add migration detector | `src/lib/migrate.ts` | Detect old formats (timestamp names, missing frontmatter) | Finds messy sessions |
| 1.3 Add auto-fix capability | `src/lib/migrate.ts` | Auto-convert old → new format | Runs migration on startup |
| 1.4 Add first-turn context pull | `src/hooks/session-lifecycle.ts` | Turn 0 always pulls anchors+mems+prior | Context always present |

**Exit Criteria**: Framework STARTUP detects chaos → offers to fix (not silent failure)

---

### PHASE 2: Artifact Auto-Organization (HIGH)
**Target**: Framework maintains consistency, auto-injects frontmatter

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 2.1 Add frontmatter injector | `src/tools/declare-intent.ts` | On first session access, inject YAML frontmatter | All sessions have frontmatter |
| 2.2 Add index auto-regen | `src/hooks/session-lifecycle.ts` | INDEX.md regenerated on declare/compact | Index always current |
| 2.3 Add manifest validator | `src/lib/manifest.ts` | Each folder has valid manifest.json | Manifests at every level |
| 2.4 Add naming enforcer | `src/lib/session-export.ts` | Validate exports match `session_YYYY-MM-DD_*.md` | Consistent naming |
| 2.5 Add scattered doc detector | `src/lib/migrate.ts` | Scan for docs outside .hivemind/ hierarchy | Detects misplaced files |

**Exit Criteria**: Framework AUTO-MAINTANS organization (not depends on human doing it right)

---

### PHASE 3: Toast/Governance Message Rewrite (CRITICAL)
**Target**: Messages that actually help the agent, not poison context

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 3.1 Replace jargon output | `src/lib/detection.ts` line 259 | Replace `[SEQ] [PLAN] [HIER]` with plain English | No jargon in toasts |
| 3.2 Add action mapping | `src/lib/detection.ts` | Each detection signal → specific fix command | Agent knows what to do |
| 3.3 Add "what to do next" | `src/hooks/soft-governance.ts` | Every toast includes actionable command | Clear next step |
| 3.4 Fix tone labels | `src/lib/detection.ts` line 211-228 | No offensive labels, use professional terms | Proper tone |
| 3.5 Add localization | `src/hooks/soft-governance.ts` line 53-59 | VI messages not just translations | Helpful in both languages |

**Exit Criteria**: Agent reads toast → knows EXACTLY what to do next (not confused)

---

### PHASE 4: Prompt Transformation Points (MEDIUM)
**Target**: Key moments inject correct context automatically

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 4.1 Add post-compact injection | `src/hooks/compaction.ts` | After compaction, include "what survived" | Context preserved |
| 4.2 Add declare_intent context | `src/tools/declare-intent.ts` | After declare, system knows trajectory | Trajectory in prompt |
| 4.3 Add map_context refresh | `src/tools/map-context.ts` | After map_context, context refreshed | Focus clear |
| 4.4 Add forced re-read at checkpoints | `src/hooks/session-lifecycle.ts` | At task/phase transitions, force re-read | Never lose context |
| 4.5 Document transformation behavior | `src/tools/compact-session.ts` | Write docs explaining what compact does | Clear documentation |

**Exit Criteria**: Hard to lose context - it's ALWAYS in the prompt

---

### PHASE 5: CLI/Slash Command Alignment (MEDIUM)
**Target**: What works in CLI works with /

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 5.1 Add name field to commands | `.opencode/commands/hivemind-scan.md` | Add `name: hivemind-scan` to YAML frontmatter | Slash command works |
| 5.2 Add name to all commands | `.opencode/commands/*.md` | Add name field to all 3 commands | All slash commands work |
| 5.3 Document CLI ↔ slash mapping | `README.md` | Document which CLI = which slash | Clear mapping |
| 5.4 Add validation test | `tests/cli.test.ts` | Test all documented commands | Verified working |
| 5.5 Fix hivemind-status command | `.opencode/commands/hivemind-status.md` | Add name field | /hivemind-status works |
| 5.6 Fix hivemind-compact command | `.opencode/commands/hivemind-compact.md` | Add name field | /hivemind-compact works |

**Exit Criteria**: User can type any documented command with / and it WORKS

---

### PHASE 6: Brownfield Detection Automation (HIGH)
**Target**: First-turn always scans unless greenfield - AUTOMATICALLY

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 6.1 Wire auto-scan to first-turn | `src/hooks/session-lifecycle.ts` | Turn 0 triggers project scan automatically | Auto-scan runs |
| 6.2 Add greenfield detection | `src/lib/project-scan.ts` | Detect greenfield = no existing artifacts | Correct classification |
| 6.3 Add brownfield detection | `src/lib/project-scan.ts` | Detect brownfield = has messy artifacts | Correct classification |
| 6.4 Add auto-orchestrate flow | `src/hooks/session-lifecycle.ts` | analyze → recommend → orchestrate auto-runs | Full flow automatic |
| 6.5 Add framework conflict detection | `src/hooks/tool-gate.ts` line 62 | Detect .planning AND .spec-kit | Conflict detected |

**Exit Criteria**: New session on existing project → Agent AUTOMATICALLY scans and reports (no manual trigger needed)

---

### PHASE 7: First-Turn Context Pull (HIGH)
**Target**: Turn 0 never starts blind - ALWAYS has prior context

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 7.1 Add anchors pull | `src/hooks/session-lifecycle.ts` | Turn 0 loads anchors ("must not forget") | Anchors visible |
| 7.2 Add mems pull | `src/hooks/session-lifecycle.ts` | Turn 0 loads mems ("past learnings") | Mems visible |
| 7.3 Add prior session pull | `src/hooks/session-lifecycle.ts` | Turn 0 loads last session context | Prior session visible |
| 7.4 Add hierarchy pull | `src/hooks/session-lifecycle.ts` | Turn 0 loads tree position | Tree visible |
| 7.5 Add budget management | `src/lib/complexity.ts` | Context fits in prompt budget | No overflow |

**Exit Criteria**: First message from agent shows awareness of PRIOR context (not "what should I do?")

---

### PHASE 8: Delegation + TODO Enforcement (HIGH)
**Target**: Subagent work NEVER lost - ALWAYS captured

| Task | File to Modify | What It Does | Verification |
|------|---------------|--------------|--------------|
| 8.1 Add task-complete hook | `src/hooks/event-handler.ts` | Task completion triggers export_cycle automatically | Results captured |
| 8.2 Verify export_cycle | `src/tools/export-cycle.ts` | Subagent results → hierarchy + mems | Verified working |
| 8.3 Add TODO↔hierarchy link | `src/tools/index.ts` | TODOs linked to tree nodes | Traceable |
| 8.4 Add atomic commit enforcement | `src/hooks/session-lifecycle.ts` | Every file-changing sub-task → git commit | Tracked |
| 8.5 Add cross-session continuity | `src/lib/persistence.ts` | Tasks survive compaction | Persistent |

**Exit Criteria**: Subagent completes → results CAPTURED AUTOMATICALLY (not lost)

---

## PART III: VERIFICATION COMMANDS

After each phase, run these to verify:

```bash
# Phase 1: Validation catches mess
rm -rf .hivemind && npx hivemind-context-governance init
# → Should detect old-style files if present

# Phase 2: Auto-organization
ls .hivemind/sessions/*.md
# → Should show consistent naming + frontmatter

# Phase 3: Toasts readable
# Trigger drift → toast should say "Run map_context to reset drift" not "[SEQ]..."

# Phase 4: Context preserved
# Compact → re-read → should see "what survived"

# Phase 5: Slash commands work
/hivemind-scan
# → Should execute

# Phase 6: Auto-scan runs
# Start new session on brownfield → auto-scan runs

# Phase 7: First-turn context
# New session → agent knows prior context

# Phase 8: Delegation enforced
# Run subagent → check .hivemind/sessions/archive/exports/
```

---

## PART IV: PRIORITY ORDER (One-Knot-to-Another)

Based on your core keys:

```
1. SMALLEST UNIT → Phase 8 (Delegation enforcement) + Phase 2 (Auto-org)
2. 100% COVERAGE → Phase 1 (Validation catches ALL issues) + Phase 3 (Clear toasts)
3. EVERY TURN → Phase 7 (First-turn context) + Phase 4 (Prompt transform)
4. EASY IMPACT → Phase 3 (Toast rewrite - quick fix line 259)
5. ENTRY POINT → Phase 1 MUST come first (framework can't work without validation)
6. BROWNFIELD → Phase 6 works with Phase 1 (validation detects brownfield)
```

---

## SUMMARY: 8 PHASES, 40 TASKS

| Phase | Focus | Tasks | Priority | Key Change |
|-------|-------|-------|----------|------------|
| P1 | Startup Validation + Auto-Fix | 4 | CRITICAL | Framework catches mess, offers fix |
| P2 | Auto-Organization | 5 | HIGH | Framework maintains consistency |
| P3 | Toast Rewrite | 5 | CRITICAL | Plain English, actionable |
| P4 | Prompt Transform | 5 | MEDIUM | Context always in prompt |
| P5 | CLI/Slash Alignment | 6 | MEDIUM | Add name field to commands |
| P6 | Auto-Brownfield Scan | 5 | HIGH | Auto-trigger on first-turn |
| P7 | First-Turn Context | 5 | HIGH | Never start blind |
| P8 | Delegation Enforcement | 5 | HIGH | Auto-capture subagent results |

**Total: 40 tasks across 8 phases**

---

## APPENDIX: Key Files to Modify

### Primary Hooks (Where validation lives)
- `src/hooks/session-lifecycle.ts` - Startup validation, auto-fix, first-turn context
- `src/hooks/soft-governance.ts` - Toast generation
- `src/hooks/event-handler.ts` - Task completion hooks
- `src/hooks/compaction.ts` - Post-compact context

### Core Libraries (Where auto-fix lives)
- `src/lib/migrate.ts` - Migration detector + auto-fix
- `src/lib/detection.ts` - Jargon → action mapping (line 259)
- `src/lib/persistence.ts` - State management

### Tools (Where auto-inject lives)
- `src/tools/declare-intent.ts` - Frontmatter injection
- `src/tools/scan-hierarchy.ts` - Auto-scan trigger
- `src/tools/export-cycle.ts` - Auto-capture subagent results

### Commands (Need name field)
- `.opencode/commands/hivemind-scan.md` - Add `name: hivemind-scan`
- `.opencode/commands/hivemind-status.md` - Add `name: hivemind-status`
- `.opencode/commands/hivemind-compact.md` - Add `name: hivemind-compact`
