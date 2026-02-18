# COMPREHENSIVE MASTER PLAN: HiveMind v3 Remediation

**Version:** 2.0.0 (Validated & Unified)  
**Created:** 2026-02-14  
**Branches:** `strategic-planning-v3` + `dev-v3`  
**Status:** READY FOR EXECUTION  

---

## EXECUTIVE SUMMARY

This unified plan synthesizes findings from:
- **Wave 1-4 User Feedback** — Core pain points and symptoms
- **Strategic Analysis** — 6 architectural principles → 8 phases  
- **Concrete Evidence-Based Analysis** — File-level root causes
- **Cross-Team Root Cause Analysis** — Code-level evidence

**The Unified Insight:**
The framework doesn't prevent or auto-correct manual mistakes. Every symptom traces to one root cause: **lack of validation and auto-fix at every boundary**.

---

## PART I: UNIFIED ROOT CAUSE ANALYSIS

### 1.1 The REAL Root Cause (All Symptoms Lead Here)

| What Happened | Why It Happened | The Fix |
|---------------|-----------------|---------|
| Files created manually with wrong names | No validation that enforces naming convention | **Startup validation** → detect → auto-fix |
| Mixed old + new session formats | No format version check on access | **Auto-migration** → detect version → normalize |
| No YAML frontmatter on sessions | Framework doesn't inject on first access | **Auto-inject** → add frontmatter on read |
| Documents scattered everywhere | No startup scan for misplaced files | **Scattered doc detector** → find → offer move |
| Nonsensical toasts poisoning context | Static strings with no context relevance | **Dynamic signal→action mapping** |
| CLI works but `/` commands don't | Missing `name:` field in command YAML | **Fix command metadata** |
| export_cycle rarely called | No auto-trigger after subagent work | **Hook-based auto-capture** |
| First turn starts blind | No forced context pull on turn 0 | **Turn 0 context injection** |

**Root Cause Statement:**
> The framework trusts agents and users to "do the right thing" instead of enforcing validation and auto-correction at every boundary. This creates a "garbage in, garbage out" system where manual mistakes compound into chaos.

---

### 1.2 Evidence-Based Symptom Mapping

#### Symptom 1: "Toasts are poisoning the AI with nonsensical knowledge"

**Evidence Locations:**
| File | Line | Issue |
|------|------|-------|
| `src/lib/detection.ts` | 259 | `formatIgnoredEvidence` outputs `[SEQ] [PLAN] [HIER]` — technical jargon |
| `src/hooks/soft-governance.ts` | 294-305 | Static toast: "Tool ${tool} used before prerequisites" |
| `src/hooks/soft-governance.ts` | 324-335 | "Evidence pressure active" — no actionable context |
| `src/hooks/soft-governance.ts` | 356-369 | IGNORED tier: "Reason: IGNORED tier: X unacknowledged cycles" — incomprehensible |
| `src/lib/toast-throttle.ts` | 48-80 | Only limits RATE (cooldown/quota), never validates RELEVANCE |

**Root Cause:** Toast content is **hardcoded static strings** disconnected from brain state. They describe WHAT triggered but not WHAT TO DO.

---

#### Symptom 2: ".hivemind is a mess - no one can trace anything"

**Evidence Locations:**
| File | Evidence |
|------|----------|
| `.hivemind/sessions/manifest.json` | Only has `stamp`, `file`, `status`, `created` — NO trajectory links |
| `.hivemind/sessions/*.md` | Files like `011313022026.md` have NO YAML frontmatter (except active.md) |
| `.hivemind/hierarchy.json` | Tree exists but has NO session linkage — orphaned |
| `.hivemind/` root | No `INDEX.md` entry point for traversal |
| `src/lib/session-export.ts` | Naming not enforced — accepts any pattern |

**Root Cause:** No **manifest-driven hierarchy**. Files are flat, unlinked, untraversable. No schema enforces session → hierarchy → artifact relationships.

---

#### Symptom 3: "No entry point enforcement - agents start blind"

**Evidence Locations:**
| File | Evidence |
|------|----------|
| `src/hooks/session-lifecycle.ts` | 500-506: Only checks if `config.json` exists — NO check for scattered artifacts |
| `src/index.ts` | No pre-flight gate before tool execution |
| `src/tools/scan-hierarchy.ts` | Has `analyze/recommend/orchestrate` actions but NOT ENFORCED |
| `README.md` | Line 32-76: Emphasizes CLI (`npx hivemind`) but OpenCode users need `/` |

**Root Cause:** No **entry condition enforcement**. Framework trusts agents to call right tools instead of forcing validation gate.

---

#### Symptom 4: "CLI commands don't match OpenCode reality"

**Evidence Locations:**
| File | Evidence |
|------|----------|
| `.opencode/commands/hivemind-scan.md` | Line 1-3: Has `description:` but NO `name:` field |
| `.opencode/commands/hivemind-status.md` | Line 1-3: Has `description:` but NO `name:` field |
| `.opencode/commands/hivemind-compact.md` | Line 1-3: Has `description:` but NO `name:` field |
| `README.md` | Line 244-254: Lists CLI commands first, slash commands buried |

**Root Cause:** Commands missing required `name:` field in YAML frontmatter. OpenCode can't discover/register them.

---

#### Symptom 5: "No 100% hit rate automation"

**Evidence Locations:**
| File | Evidence |
|------|----------|
| `src/hooks/soft-governance.ts` | 404-413: `export_cycle` auto-capture on Task tool — but NOT FORCED |
| `src/hooks/` | No TODO→hierarchy linking |
| `src/hooks/session-lifecycle.ts` | No forced re-read checkpoint |
| `src/hooks/tool-gate.ts` | 213-231: Drift score calculated but NOT connected to forced action |

**Root Cause:** Automation is **advisory** not **enforced**. No "sure hit mechanism" — things fire by convention, not protocol.

---

#### Symptom 6: "Agents don't understand compact_session"

**Evidence Locations:**
| File | Evidence |
|------|----------|
| `src/tools/compact-session.ts` | Tool description doesn't explain WHAT is preserved vs archived |
| `src/hooks/compaction.ts` | No post-compact context injection |
| `src/tools/declare-intent.ts` | No "resuming from compact" guidance |
| User feedback | "Compact misunderstood" — agents think it's cleanup, not archival |

**Root Cause:** Poor documentation + no post-compact context = agents lose track of what survived.

---

### 1.3 The Six Core Principles → Concrete Requirements

| Principle | Requirement | Evidence | Solution |
|-----------|-------------|----------|----------|
| **1. Control smallest unit** | Every sub-task must be tracked, time-stamped, committed | No `tasks.json` schema exists | Create atomic task governance (Phase 5) |
| **2. Never govern <100%** | No advisory-only mechanisms | Toast system is advisory | Replace with forced actions + signals (Phase 6) |
| **3. Every turn enforcement** | Delegation + TODO + context at ALL turns | No auto-trigger for export_cycle | Hook-based automation (Phase 8) |
| **4. Smart automation** | Parse and validate, don't trust | export_cycle doesn't parse results | Result validation layer (Phase 1) |
| **5. Easy + impactful first** | Start with prompt transformation | compact misunderstood | Fix tool descriptions (Phase 4) |
| **6. Entry point bulletproof** | Framework can't work without validation | No startup validation | Entry gate enforcement (Phase 1) |

---

## PART II: THE 8-PHASE UNIFIED EXECUTION PLAN

### PHASE 0: Foundation Validation (PREREQUISITE)

**Goal:** Establish baseline before any changes

| Task | Verification | Time |
|------|--------------|------|
| Run full test suite | Document any failures | 5 min |
| Verify `.planning/codebase/` complete | All 6 files present | 2 min |
| Check `.hivemind/` structure | Document current state | 3 min |
| Validate all 3 slash commands | Test `/hivemind-scan`, `/status`, `/compact` | 5 min |
| Review CHANGELOG.md | Understand recent changes | 5 min |

**Exit Criteria:**
- [ ] All 52 tests pass (or failures documented)
- [ ] Codebase structure documented
- [ ] `.hivemind/` state captured
- [ ] Slash command issues documented

**Estimated Time:** 20 minutes

---

### PHASE 1: Entry Gate Enforcement + Critical Bug Triage (CRITICAL PATH)

**Goal:** Framework catches mess on startup AND fixes 8 critical bugs

#### 1.1 Entry Gate Hook (NEW)

**Files to Create/Modify:**
- `src/hooks/entry-gate.ts` (NEW)
- `src/index.ts` (MODIFY — wire entry gate)

**Implementation:**
```typescript
// Before ANY tool executes:
function validateEntryConditions(): ValidationResult {
  const checks = [
    { name: "config_exists", test: () => exists(".hivemind/config.json") },
    { name: "structure_valid", test: () => validateHivemindStructure() },
    { name: "no_scattered_docs", test: () => !detectScatteredDocuments() },
    { name: "planning_codebase", test: () => exists(".planning/codebase/STRUCTURE.md") }
  ]
  
  // If ANY fail → BLOCK with guidance
  // Don't proceed with broken foundation
}
```

#### 1.2 Critical Bug Fixes (8 Bugs)

| Bug | File | Fix | Test |
|-----|------|-----|------|
| export_cycle doesn't sync hierarchy | `src/tools/export-cycle.ts` | Update brain.hierarchy after modifications | `export-cycle-hierarchy-sync.test.ts` |
| declare_intent overwrites templates | `src/tools/declare-intent.ts` | Preserve per-session template format | `declare-intent-template.test.ts` |
| Auto-archive doesn't reset hierarchy | `src/lib/planning-fs.ts` | Reset hierarchy.json on new session | `auto-archive-reset.test.ts` |
| trackSectionUpdate() never called | `src/hooks/soft-governance.ts` | Wire section repetition detection | `section-tracking.test.ts` |
| Missing write_without_read_count | `src/lib/persistence.ts` | Add to migration | `migration-fields.test.ts` |
| next_compaction_report not cleared | `src/hooks/compaction.ts` | Clear after consumption | `compaction-cleanup.test.ts` |
| Drift score before turn increment | `src/hooks/tool-gate.ts` | Calculate AFTER increment | `drift-calculation.test.ts` |
| Drift score not persisted | `src/hooks/tool-gate.ts` | Save after mutation | `drift-persistence.test.ts` |

#### 1.3 Migration Detector + Auto-Fix

**Files:**
- `src/lib/migrate.ts` (MODIFY)

**Features:**
- Detect old-format files (timestamp-only names)
- Detect missing frontmatter
- Detect scattered documents
- Offer auto-fix on startup
- Create migration report

**Exit Criteria:**
- [ ] Entry gate blocks execution if conditions fail
- [ ] All 8 bugs fixed with regression tests
- [ ] Migration detector finds old formats
- [ ] Auto-fix offers to repair
- [ ] Framework STARTUP detects chaos → offers fix

**Estimated Time:** 6 hours (parallel sub-agents)

---

### PHASE 2: Auto-Organization System (HIGH PRIORITY)

**Goal:** Framework maintains consistency automatically

#### 2.1 Frontmatter Auto-Injector

**Files:**
- `src/tools/declare-intent.ts` (MODIFY)

**Behavior:**
- On first session access, check for frontmatter
- If missing, inject YAML frontmatter with:
  ```yaml
  ---
  id: session_2026-02-14_mode_slug
  stamp: "1402202601"
  type: session
  mode: plan_driven
  governance: assisted
  trajectory: "Build authentication system"
  tactic: "Implement JWT validation"
  status: active
  created: "2026-02-14T10:00:00Z"
  last_activity: "2026-02-14T10:30:00Z"
  turns: 15
  drift: 75
  linked_plans: ["docs/plans/phase1.md"]
  ---
  ```

#### 2.2 INDEX.md Auto-Regeneration

**Files:**
- `src/hooks/session-lifecycle.ts` (MODIFY)
- `src/lib/index-generator.ts` (NEW)

**Behavior:**
- Regenerate `.hivemind/INDEX.md` on every declare/compact
- < 30 lines
- Navigation links to all key files
- Current state recap inline

**Template:**
```markdown
# HiveMind Index

**Session:** 2026-02-14 | **Mode:** assisted | **Drift:** 75/100

## Quick Navigation
- [Current Session](sessions/active/current)
- [Hierarchy Tree](state/hierarchy.json)
- [Mems Brain](memory/mems.json)
- [Configuration](config.json)

## Active Context
**Trajectory:** Build authentication system  
**Tactic:** Implement JWT validation  
**Action:** Write middleware tests  

_Last updated: 2026-02-14T10:30:00Z_
```

#### 2.3 Manifest System at Every Level

**New Structure:**
```
.hivemind/
├── manifest.json              # Root manifest
├── INDEX.md                   # Entry point
├── config.json
│
├── state/
│   ├── manifest.json          # State manifest
│   ├── brain.json
│   ├── hierarchy.json
│   ├── anchors.json
│   └── tasks.json             # NEW
│
├── memory/
│   ├── manifest.json          # Memory manifest
│   └── mems.json
│
└── sessions/
    ├── manifest.json          # Session registry
    ├── active/
    │   └── current -> ../2026-02-14-mode-slug/  # Symlink
    └── archive/
```

**Files:**
- `src/lib/manifest.ts` (NEW)
- `src/lib/paths.ts` (MODIFY)

#### 2.4 Naming Enforcer

**Files:**
- `src/lib/session-export.ts` (MODIFY)

**Enforced Pattern:**
```
 sessions/2026-02-14-mode-slug/session.md
 archive/2026-02-14-mode-slug.md
```

**Exit Criteria:**
- [ ] All sessions have YAML frontmatter
- [ ] INDEX.md auto-regenerated
- [ ] Manifests at every level
- [ ] Naming consistent
- [ ] Framework AUTO-MAINTAINS organization

**Estimated Time:** 5 hours

---

### PHASE 3: Toast/S Governance Message Rewrite (CRITICAL)

**Goal:** Messages that actually help the agent

#### 3.1 Replace Jargon Output

**File:** `src/lib/detection.ts` line 259

**Before:**
```typescript
return `[SEQ] [PLAN] [HIER] Detection: ${counters.seq}/${counters.plan}/${counters.hier}`
```

**After:**
```typescript
return formatSignal({
  tier: "warn",
  context: `You've worked ${turns} turns without updating context`,
  condition: "Sequence detected: rapid tool use without map_context",
  action: "Call map_context({ level: 'action', content: '...' }) to reset drift"
})
```

#### 3.2 Signal-to-Action Mapping

**File:** `src/lib/signals.ts` (NEW)

**Schema:**
```typescript
interface Signal {
  id: string
  tier: "info" | "warn" | "critical" | "degraded"
  condition: string      // What triggered it
  context: string        // Current situation  
  action: string         // SPECIFIC command to run
  automation?: string    // What system does automatically
}

// Example signals:
const DRIFT_WARNING: Signal = {
  id: "drift-high",
  tier: "warn", 
  condition: "drift_score < 50",
  context: "7 turns without map_context",
  action: "Call map_context({ level: 'action', content: '...' })",
  automation: "Inject reminder into system prompt"
}

const NO_INTENT: Signal = {
  id: "no-intent-declared",
  tier: "critical",
  condition: "!intent_declared && turns > 3",
  context: "Working without declared intent",
  action: "Call declare_intent({ mode: '...', focus: '...' })",
  automation: "Block tool execution (strict mode)"
}
```

#### 3.3 Add "What To Do Next"

**File:** `src/hooks/soft-governance.ts`

**Every toast/governance message MUST include:**
1. **What triggered it** (condition)
2. **Current situation** (context)
3. **Specific action** (exact command)
4. **What happens if ignored** (consequence)

**Example:**
```
⚠️  Drift Detected

Context: You've worked 7 turns on "JWT middleware" without checkpointing.
Condition: 7 turns since last map_context call.

ACTION REQUIRED:
Call: map_context({ 
  level: "action", 
  content: "Completed JWT validation, starting refresh token logic" 
})

If ignored: Drift will compound. After 10 turns, context will be flagged as stale.
```

#### 3.4 Fix Tone Labels

**File:** `src/lib/detection.ts` lines 211-228

**Remove:** Any offensive or unprofessional labels
**Replace with:** Professional, descriptive terms

#### 3.5 Localization (VI)

**File:** `src/hooks/soft-governance.ts` lines 53-59

**Ensure VI messages:**
- Not just translations
- Culturally appropriate examples
- Same level of detail as EN

**Exit Criteria:**
- [ ] No jargon in toasts
- [ ] Every signal has action mapping
- [ ] Every toast includes "what to do next"
- [ ] Professional tone throughout
- [ ] Agent reads toast → knows EXACTLY what to do

**Estimated Time:** 4 hours

---

### PHASE 4: Prompt Transformation Points (MEDIUM)

**Goal:** Key moments inject correct context automatically

#### 4.1 Fix Tool Descriptions

**Files:**
- `src/tools/compact-session.ts` (MODIFY description)
- `src/tools/declare-intent.ts` (MODIFY description)

**compact_session description:**
```typescript
description: `
Archive the current session while preserving intelligence.

WHAT GETS PRESERVED (survives across sessions):
- Hierarchy tree position
- Mems (persistent memory)
- Anchors (immutable facts)
- Tasks (if task governance enabled)

WHAT GETS ARCHIVED (session-specific):
- Full conversation context
- Tool call history
- Session file (moved to archive/)

WHEN TO CALL:
- When completing a unit of work
- When context feels too heavy
- When switching to unrelated work
- At natural breakpoints (end of day, task complete)

HOW TO RESUME:
After compacting, call declare_intent with your new focus.
Prior context will be available via think_back and recall_mems.

Example:
compact_session({ 
  summary: "Completed JWT middleware with token validation and refresh logic" 
})
// → Session archived, intelligence preserved, ready for next session
`
```

#### 4.2 Post-Compact Context Injection

**File:** `src/hooks/compaction.ts` (MODIFY)

**After compaction, inject:**
```
Session archived successfully.

PRESERVED (available via tools):
- Hierarchy: [current trajectory → tactic]
- Mems: [count] memories saved
- Anchors: [count] immutable facts
- Tasks: [count] active tasks

ARCHIVED:
- Session file: .hivemind/sessions/archive/2026-02-14-mode-slug.md

NEXT:
Call declare_intent when ready to start new work.
```

#### 4.3 Post-Declare Context

**File:** `src/tools/declare-intent.ts` (MODIFY)

**After declare_intent, inject:**
```
Session initialized: [focus]

TRAJECTORY: [focus]
MODE: [mode]
GOVERNANCE: [strict|assisted|permissive]

Your next steps:
1. Call map_context({ level: "tactic", content: "..." }) to set approach
2. Begin work
3. Call map_context every 3-5 turns to prevent drift
```

#### 4.4 Forced Re-Read Checkpoints

**File:** `src/hooks/session-lifecycle.ts` (MODIFY)

**Auto-trigger re-read at:**
- Every 5 turns (configurable)
- After task completion
- After phase transition
- After compaction

**Action:** Inject hierarchy + active tasks + recent mems into prompt

#### 4.5 Documentation

**Files:**
- `src/tools/compact-session.ts` — Add comprehensive JSDoc
- `README.md` — Add "Understanding Compaction" section

**Exit Criteria:**
- [ ] Tool descriptions explain what they do
- [ ] Post-compact context shows what survived
- [ ] Post-declare context guides next steps
- [ ] Forced re-read at checkpoints
- [ ] Hard to lose context — it's ALWAYS in prompt

**Estimated Time:** 3 hours

---

### PHASE 5: CLI/Slash Command Alignment (MEDIUM)

**Goal:** `/` commands work as documented

#### 5.1 Fix Command Metadata

**Files to Modify:**
- `.opencode/commands/hivemind-scan.md`
- `.opencode/commands/hivemind-status.md`
- `.opencode/commands/hivemind-compact.md`

**Add `name:` field to YAML frontmatter:**

```markdown
---
name: hivemind-scan
description: "Scan the project codebase and build a HiveMind backbone. Run this on first use or when switching projects."
---
```

```markdown
---
name: hivemind-status
description: "Show current HiveMind governance state, session health, and recent activity."
---
```

```markdown
---
name: hivemind-compact
description: "Archive the current session, preserve context, and prepare for the next session."
---
```

#### 5.2 Update README Documentation

**File:** `README.md`

**Restructure:**
1. Quick Start — Show `/` commands first (OpenCode native)
2. CLI Reference — Secondary section
3. Clear mapping: `/hivemind-scan` = `npx hivemind scan`

#### 5.3 Add Command Validation Test

**File:** `tests/commands.test.ts` (NEW)

**Test:**
```typescript
// Verify all commands have required fields
test("hivemind-scan has name field", () => {
  const cmd = loadCommand("hivemind-scan")
  assert(cmd.name === "hivemind-scan", "has correct name")
  assert(cmd.description.length > 0, "has description")
})
```

**Exit Criteria:**
- [ ] All 3 commands have `name:` field
- [ ] README shows `/` commands first
- [ ] CLI ↔ slash mapping documented
- [ ] Validation tests pass
- [ ] User can type any documented command with / and it WORKS

**Estimated Time:** 2 hours

---

### PHASE 6: Brownfield Detection Automation (HIGH)

**Goal:** First-turn always scans unless greenfield — AUTOMATICALLY

#### 6.1 Auto-Scan on First Turn

**File:** `src/hooks/session-lifecycle.ts` (MODIFY)

**Implementation:**
```typescript
// On turn 0:
if (turnCount === 0 && !session.hasRunInitialScan) {
  const scanResult = await detectProjectType()
  
  if (scanResult.type === "brownfield") {
    // Auto-trigger scan_hierarchy analyze
    return {
      ...context,
      guidance: "Auto-detected brownfield project. Running scan...",
      autoActions: ["scan_hierarchy({ action: 'analyze', json: true })"]
    }
  }
}
```

#### 6.2 Greenfield vs Brownfield Detection

**File:** `src/lib/project-scan.ts` (MODIFY)

**Detection Logic:**
```typescript
function detectProjectType(): ProjectType {
  const hasExistingCode = checkForSourceFiles()
  const hasArtifacts = checkForPlanningArtifacts()
  const hasHivemind = checkForHivemindState()
  
  if (!hasExistingCode && !hasArtifacts && !hasHivemind) {
    return { type: "greenfield", confidence: 0.95 }
  }
  
  if (hasArtifacts || hasHivemind) {
    return { type: "brownfield", confidence: 0.9 }
  }
  
  return { type: "ambiguous", confidence: 0.5 }
}
```

#### 6.3 Auto-Orchestrate Flow

**File:** `src/hooks/session-lifecycle.ts` (MODIFY)

**Flow:**
```
Turn 0 → detectProjectType()
  ├─ greenfield → guide to declare_intent
  └─ brownfield → auto-run:
      1. scan_hierarchy({ action: "analyze", json: true })
      2. scan_hierarchy({ action: "recommend" })
      3. scan_hierarchy({ action: "orchestrate", json: true })
      4. declare_intent + map_context
```

#### 6.4 Framework Conflict Detection

**File:** `src/hooks/tool-gate.ts` (MODIFY)

**Detection:**
```typescript
function detectFrameworkConflict(): boolean {
  const hasPlanning = exists(".planning/")
  const hasSpecKit = exists(".spec-kit/")
  
  if (hasPlanning && hasSpecKit) {
    return true // Conflict detected
  }
  return false
}
```

**Action:** Block tool execution until conflict resolved

**Exit Criteria:**
- [ ] Turn 0 auto-detects project type
- [ ] Brownfield → auto-scan runs
- [ ] Greenfield → guided to declare_intent
- [ ] Framework conflicts detected
- [ ] New session on existing project → Agent AUTOMATICALLY scans and reports

**Estimated Time:** 4 hours

---

### PHASE 7: First-Turn Context Pull (HIGH)

**Goal:** Turn 0 never starts blind — ALWAYS has prior context

#### 7.1 Context Pull Implementation

**File:** `src/hooks/session-lifecycle.ts` (MODIFY)

**Turn 0 Context Injection:**
```typescript
function compileFirstTurnContext(): ContextBlock {
  return {
    // Anchors (must not forget)
    anchors: loadAnchors().slice(0, 3).map(a => `• ${a.content}`).join("\n"),
    
    // Mems (past learnings)
    mems: {
      count: memsCount,
      recent: recallMems({ limit: 2 }).map(m => `• ${m.content.substring(0, 100)}...`)
    },
    
    // Prior Session
    priorSession: {
      stamp: lastSession?.stamp,
      summary: lastSession?.summary?.substring(0, 200),
      filesTouched: lastSession?.filesTouched?.slice(0, 5)
    },
    
    // Hierarchy
    hierarchy: {
      trajectory: currentTrajectory,
      tactic: currentTactic,
      depth: hierarchyDepth
    },
    
    // Budget management
    budget: {
      used: estimateTokens(context),
      max: 1500,
      status: estimateTokens(context) < 1500 ? "OK" : "TRUNCATED"
    }
  }
}
```

#### 7.2 Context Budget Management

**File:** `src/lib/complexity.ts` (MODIFY)

**Budget Rules:**
- Total context budget: 1500 tokens
- Anchors: ≤300 chars
- Mems: ≤200 chars (last 2)
- Prior session: ≤200 chars
- Hierarchy: ≤100 chars
- Remaining: for current task

#### 7.3 Context Format

**Injected into system prompt:**
```
<hivemind-context>
## Prior Context

### Anchors (Must Not Forget)
• Use JWT tokens for auth (not sessions)
• Port 3000 for dev, 8080 for prod

### Recent Learnings (2 of 15 mems)
• Authentication uses jose library... (truncated)
• Database schema v3 has users table...

### Prior Session
Stamp: 1402202601 | Files: 5 touched
Summary: Completed JWT middleware with validation...

### Current Position
Trajectory: Build authentication system
└─ Tactic: Implement JWT validation

Budget: 890/1500 tokens (59%)
</hivemind-context>
```

**Exit Criteria:**
- [ ] Turn 0 loads anchors
- [ ] Turn 0 loads recent mems
- [ ] Turn 0 loads prior session
- [ ] Turn 0 loads hierarchy
- [ ] Budget management prevents overflow
- [ ] First message from agent shows awareness of PRIOR context

**Estimated Time:** 4 hours

---

### PHASE 8: Delegation + TODO Enforcement (HIGH)

**Goal:** Subagent work NEVER lost — ALWAYS captured

#### 8.1 Task System Schema

**File:** `src/schemas/task.ts` (NEW)

```typescript
interface TaskSystem {
  manifest: {
    version: string
    lastUpdated: string
    activeCount: number
    completedCount: number
  }
  
  mainTasks: MainTask[]
  subTasks: SubTask[]
}

interface MainTask {
  id: string
  stamp: string
  title: string
  status: "pending" | "active" | "complete" | "blocked"
  priority: "low" | "medium" | "high" | "critical"
  linkedPlan?: string
  linkedSession?: string
  subTasks: string[] // SubTask IDs
  acceptanceCriteria: string[]
  createdAt: string
  updatedAt: string
}

interface SubTask {
  id: string
  parentTask: string
  stamp: string
  description: string
  status: "pending" | "active" | "complete" | "blocked"
  agent?: string
  toolsUsed: string[]
  filesTouched: string[]
  acceptanceCriteria: string[]
  startedAt?: string
  completedAt?: string
  gitCommit?: string
  outcome?: "success" | "partial" | "failure"
  findings?: string
}
```

#### 8.2 Task Manager

**File:** `src/lib/tasks.ts` (NEW)

**Responsibilities:**
- Create task on file-changing action
- Link sub-tasks to parent
- Enforce: sub-task completion requires git commit
- Enforce: main task completion requires all sub-tasks done
- Auto-update on tool calls

#### 8.3 Auto-Export on Subagent Completion

**File:** `src/hooks/event-handler.ts` (MODIFY)

**Hook on Task completion:**
```typescript
// When subagent task completes:
onTaskComplete: async (task) => {
  // Auto-trigger export_cycle
  await exportCycle({
    outcome: task.outcome,
    findings: task.findings,
    linkedTask: task.id
  })
  
  // Update hierarchy
  await updateHierarchyFromTask(task)
  
  // Save to mems
  await saveMem({
    shelf: "cycle-intel",
    content: task.findings,
    tags: ["subagent", task.parentTask]
  })
}
```

#### 8.4 TODO→Hierarchy Link

**File:** `src/tools/index.ts` (MODIFY)

**Integration:**
- When TODO created → create main task
- When TODO updated → update task status
- When TODO completed → mark task complete
- Link task to hierarchy node

#### 8.5 Atomic Git Commit Enforcement

**File:** `src/hooks/soft-governance.ts` (MODIFY)

**Enforcement:**
```typescript
// After file-changing tool:
if (toolChangedFiles(tool)) {
  // Check if git commit exists
  if (!hasRecentCommit(5 minutes)) {
    // Warn/prompt for commit
    addSignal({
      tier: "warn",
      condition: "File changes without recent commit",
      context: `Modified ${files.length} files without committing`,
      action: "Commit your changes with a descriptive message"
    })
  }
}
```

#### 8.6 Cross-Session Task Continuity

**File:** `src/lib/persistence.ts` (MODIFY)

**Persistence:**
- Tasks saved to `tasks.json` (hot state)
- Tasks survive compaction
- Tasks reload on session resume
- Export/import for cross-session handoff

**Exit Criteria:**
- [ ] Every file change = task entry
- [ ] Sub-tasks delegated with acceptance criteria
- [ ] Auto-export triggers on subagent completion
- [ ] Git commit tracked
- [ ] Tasks survive compaction
- [ ] Subagent completes → results CAPTURED AUTOMATICALLY

**Estimated Time:** 8 hours

---

### PHASE 9: Signal-Driven Governance System (REPLACES TOAST)

**Goal:** Replace nonsensical toast with actionable signals

#### 9.1 Delete Toast System

**Files to Delete:**
- `src/lib/toast-throttle.ts`

#### 9.2 Create Signal System

**File:** `src/lib/signals.ts` (NEW)

**Core Implementation:**
```typescript
export interface Signal {
  id: string
  tier: SignalTier
  condition: string      // Machine-readable trigger
  context: string        // Human-readable situation
  action: string         // SPECIFIC command to run
  automation?: string    // What system does automatically
  persistence: "turn" | "session" | "permanent"
  timestamp: string
  acknowledged?: boolean
}

export type SignalTier = "info" | "warn" | "critical" | "degraded"

export class SignalRegistry {
  private signals: Map<string, Signal> = new Map()
  
  register(signal: Omit<Signal, "timestamp">): void {
    this.signals.set(signal.id, {
      ...signal,
      timestamp: new Date().toISOString()
    })
  }
  
  evaluate(state: BrainState): Signal[] {
    // Check all conditions against current state
    // Return active signals
  }
  
  compileToPrompt(signals: Signal[]): string {
    // Format signals for system prompt injection
  }
}
```

#### 9.3 Define Signal Catalog

```typescript
const SIGNAL_CATALOG: SignalDefinition[] = [
  {
    id: "drift-high",
    tier: "warn",
    condition: (state) => state.driftScore < 50,
    context: (state) => `You've worked ${state.turnsSinceUpdate} turns without updating context`,
    action: "Call map_context({ level: 'action', content: '...' })",
    automation: "Inject drift reminder into prompt"
  },
  {
    id: "no-intent",
    tier: "critical", 
    condition: (state) => !state.intentDeclared && state.turnCount > 3,
    context: "Working without declared intent",
    action: "Call declare_intent({ mode: '...', focus: '...' })",
    automation: "Block tool execution (strict mode)"
  },
  {
    id: "export-missing",
    tier: "warn",
    condition: (state) => state.subagentCompleted && !state.exportCycleCalled,
    context: "Subagent completed but results not exported",
    action: "Call export_cycle({ outcome: '...', findings: '...' })",
    automation: "Auto-capture if task tool detected"
  },
  {
    id: "files-uncommitted",
    tier: "warn", 
    condition: (state) => state.filesChanged && !state.recentCommit,
    context: "File changes without recent git commit",
    action: "Commit changes with descriptive message",
    automation: "Prompt for commit before next file change"
  }
]
```

#### 9.4 Signal Compiler

**File:** `src/lib/signal-compiler.ts` (NEW)

**Responsibilities:**
- Evaluate all signal conditions against current state
- Filter to active signals only
- Sort by tier (critical > warn > info)
- Compile to prompt-ready format

#### 9.5 Signal Executor

**File:** `src/lib/signal-executor.ts` (NEW)

**Responsibilities:**
- Execute `automation` for each active signal
- Inject signals into system prompt
- Track acknowledgments
- Escalate if ignored

#### 9.6 Wire Into Hooks

**Files:**
- `src/hooks/session-lifecycle.ts` — Evaluate signals on every turn
- `src/hooks/soft-governance.ts` — Replace toast with signal system
- `src/hooks/tool-gate.ts` — Block on critical signals

**Exit Criteria:**
- [ ] Toast system deleted
- [ ] Signal system operational
- [ ] All conditions mapped to signals
- [ ] Actions are specific and actionable
- [ ] Automation triggers correctly
- [ ] Agents understand what to do from signals

**Estimated Time:** 6 hours

---

### PHASE 10: Integration & Stress Testing

**Goal:** Validate entire mesh works together

#### 10.1 Mesh Integration Test

**File:** `tests/mesh-integration.test.ts` (NEW)

**Test Chain:**
```typescript
// Full chain: hook → session → tool → mems → core
test("mesh integration", async () => {
  // 1. Hook fires
  await sessionLifecycleHook({ turn: 0 })
  
  // 2. Session updates
  const session = await getSession()
  assert(session.turnCount === 1)
  
  // 3. Tool enriches
  await declareIntent({ mode: "plan_driven", focus: "Test" })
  
  // 4. Mem stores
  await saveMem({ shelf: "test", content: "Test mem" })
  
  // 5. Core reflects
  const hierarchy = await loadHierarchy()
  assert(hierarchy.root.children.length > 0)
  
  // 6. Signals fired
  const signals = await evaluateSignals()
  assert(signals.length >= 0)
})
```

#### 10.2 10-Compaction Stress Test

**File:** `tests/compaction-stress.test.ts` (NEW)

**Test:**
```typescript
test("10 compaction cycles", async () => {
  for (let i = 0; i < 10; i++) {
    // Work
    await mapContext({ level: "action", content: `Turn ${i}` })
    await saveMem({ shelf: "stress", content: `Mem ${i}` })
    
    // Compact
    await compactSession({ summary: `Cycle ${i}` })
    
    // Verify
    const hierarchy = await loadHierarchy()
    const mems = await loadMems()
    
    assert(hierarchy.valid, `Hierarchy valid after cycle ${i}`)
    assert(mems.length >= i, `Mems preserved after cycle ${i}`)
  }
})
```

#### 10.3 Subagent Delegation Test

**File:** `tests/subagent-delegation.test.ts` (NEW)

**Test:**
```typescript
test("subagent intelligence preserved", async () => {
  // Delegate task
  const task = await createTask({ description: "Test subagent" })
  
  // Simulate subagent completion
  await completeTask(task.id, {
    outcome: "success",
    findings: "Subagent completed successfully"
  })
  
  // Verify export_cycle auto-triggered
  const exports = await loadExports()
  assert(exports.length === 1)
  assert(exports[0].outcome === "success")
  
  // Verify hierarchy updated
  const hierarchy = await loadHierarchy()
  assert(hierarchyHasNode(hierarchy, task.stamp))
  
  // Verify mem saved
  const mems = await recallMems({ query: "subagent" })
  assert(mems.length > 0)
})
```

#### 10.4 Task Enforcement Test

**File:** `tests/task-enforcement.test.ts` (NEW)

**Test:**
```typescript
test("task enforcement", async () => {
  // Create main task
  const main = await createMainTask({ title: "Main task" })
  
  // Delegate sub-tasks
  const sub1 = await createSubTask({ parent: main.id, description: "Sub 1" })
  const sub2 = await createSubTask({ parent: main.id, description: "Sub 2" })
  
  // Try to complete main (should fail)
  const failResult = await completeMainTask(main.id)
  assert(failResult.error === "Sub-tasks incomplete")
  
  // Complete sub-tasks
  await completeSubTask(sub1.id, { outcome: "success", gitCommit: "abc123" })
  await completeSubTask(sub2.id, { outcome: "success", gitCommit: "def456" })
  
  // Now complete main (should succeed)
  const successResult = await completeMainTask(main.id)
  assert(successResult.success)
})
```

#### 10.5 Signal Response Test

**File:** `tests/signal-response.test.ts` (NEW)

**Test:**
```typescript
test("signal automation triggers", async () => {
  // Trigger drift condition
  await simulateTurns(10)
  
  // Evaluate signals
  const signals = await evaluateSignals()
  
  // Verify drift signal active
  const driftSignal = signals.find(s => s.id === "drift-high")
  assert(driftSignal)
  assert(driftSignal.tier === "warn")
  
  // Verify automation triggered
  const prompt = await getSystemPrompt()
  assert(prompt.includes("drift"))
  assert(prompt.includes("map_context"))
})
```

#### 10.6 Full Automation Cycle Test

**File:** `tests/full-cycle.test.ts` (NEW)

**Test:**
```typescript
test("full automation cycle", async () => {
  // Init
  await initializeProject()
  
  // Auto-scan (brownfield detection)
  const scanResult = await autoDetectProject()
  assert(scanResult.autoScanTriggered)
  
  // Declare
  await declareIntent({ mode: "plan_driven", focus: "Test feature" })
  
  // Work with drift warning
  await simulateWork(5)
  const driftSignal = await getActiveSignals()
  assert(driftSignal.some(s => s.id === "drift-high"))
  
  // Map context (reset drift)
  await mapContext({ level: "tactic", content: "Test tactic" })
  
  // Delegate subagent
  const task = await createTask({ description: "Subagent task" })
  await simulateSubagentCompletion(task.id)
  
  // Verify auto-export
  const exports = await loadExports()
  assert(exports.length === 1)
  
  // Compact
  await compactSession({ summary: "Test complete" })
  
  // Resume
  await declareIntent({ mode: "plan_driven", focus: "Continue test" })
  
  // Verify prior context available
  const priorContext = await getPriorContext()
  assert(priorContext.summary.includes("Test complete"))
})
```

#### 10.7 Test Suite Requirements

| Test File | Assertions | Purpose |
|-----------|------------|---------|
| mesh-integration.test.ts | 20 | Full chain validation |
| compaction-stress.test.ts | 50 | 10 cycles, 5 validations each |
| subagent-delegation.test.ts | 15 | Intelligence preservation |
| task-enforcement.test.ts | 20 | Sub-task governance |
| signal-response.test.ts | 15 | Signal automation |
| full-cycle.test.ts | 30 | End-to-end workflow |

**Total New Assertions:** 150  
**Target Total:** 850+ assertions

**Exit Criteria:**
- [ ] All new tests pass
- [ ] Original tests still pass
- [ ] 850+ total assertions
- [ ] Mesh integration validated
- [ ] 10+ compaction cycles with zero data loss

**Estimated Time:** 6 hours

---

## PART III: EXECUTION DEPENDENCIES

```
PHASE 0 (Foundation)
  │
  ▼
PHASE 1 (Entry Gate + Bugs) ──────────────────┐
  │                                            │
  ▼                                            │
PHASE 5 (Commands) ────────────────────────────┤ (can parallel)
  │                                            │
  ▼                                            │
PHASE 6 (Auto-Scan) ───────────────────────────┤ (can parallel)
  │                                            │
  ▼                                            │
PHASE 2 (Auto-Organization) ───────────────────┤ (can parallel)
  │                                            │
  ▼                                            │
PHASE 3 (Toast→Signals) ───────────────────────┤
  │                                            │
  ▼                                            │
PHASE 4 (Prompt Transform) ────────────────────┤
  │                                            │
  ▼                                            │
PHASE 7 (First-Turn Context) ──────────────────┤
  │                                            │
  ▼                                            │
PHASE 8 (Task Governance) ─────────────────────┘
  │
  ▼
PHASE 9 (Signal System) — Replaces Phase 3 outputs
  │
  ▼
PHASE 10 (Integration Test)
```

**Critical Path:** 0 → 1 → 2 → 8 → 9 → 10  
**Parallel Track:** 1 → (5, 6, 3, 4, 7) → 8  
**Duration:** 2-3 weeks (with parallelization)

---

## PART IV: FILE INVENTORY

### Files to Create (13)

1. `src/hooks/entry-gate.ts` — Entry validation hook
2. `src/lib/signals.ts` — Signal system
3. `src/lib/signal-compiler.ts` — Signal evaluation
4. `src/lib/signal-executor.ts` — Signal automation
5. `src/lib/index-generator.ts` — INDEX.md auto-gen
6. `src/lib/manifest.ts` — Manifest management
7. `src/schemas/task.ts` — Task schema
8. `src/lib/tasks.ts` — Task manager
9. `tests/mesh-integration.test.ts`
10. `tests/compaction-stress.test.ts`
11. `tests/subagent-delegation.test.ts`
12. `tests/task-enforcement.test.ts`
13. `tests/signal-response.test.ts`

### Files to Modify (18)

1. `src/index.ts` — Wire entry gate
2. `src/hooks/session-lifecycle.ts` — First-turn context, auto-scan
3. `src/hooks/soft-governance.ts` — Signal integration
4. `src/hooks/tool-gate.ts` — Drift calculation fix
5. `src/hooks/compaction.ts` — Post-compact context
6. `src/hooks/event-handler.ts` — Task completion hooks
7. `src/tools/export-cycle.ts` — Hierarchy sync fix
8. `src/tools/declare-intent.ts` — Frontmatter injection
9. `src/tools/compact-session.ts` — Better description
10. `src/tools/map-context.ts` — Context refresh
11. `src/lib/migrate.ts` — Auto-fix capability
12. `src/lib/detection.ts` — Remove jargon
13. `src/lib/persistence.ts` — Migration fields
14. `src/lib/planning-fs.ts` — Auto-archive fix
15. `src/lib/project-scan.ts` — Greenfield detection
16. `src/lib/complexity.ts` — Budget management
17. `.opencode/commands/*.md` — Add name field
18. `README.md` — Documentation

### Files to Delete (1)

1. `src/lib/toast-throttle.ts` — Replaced by signals

---

## PART V: SUCCESS METRICS

### Phase Completion Metrics

| Phase | Success Criteria |
|-------|-----------------|
| 0 | All tests pass, state documented |
| 1 | Entry gate blocks on invalid state, 8 bugs fixed |
| 2 | Auto-organization maintains consistency |
| 3 | No jargon, every message actionable |
| 4 | Prompt clarity > 8/10 (agent survey) |
| 5 | All /commands work |
| 6 | Auto-scan on brownfield, guided on greenfield |
| 7 | First-turn context always present |
| 8 | Subagent results auto-captured |
| 9 | Signal system replaces toast |
| 10 | 850+ assertions, mesh validated |

### Overall Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test assertions | ~700 | 850+ |
| Entry validation | 0% | 100% |
| Auto-organization | Manual | Automatic |
| Toast clarity | 3/10 | 9/10 |
| Slash command coverage | 0% | 100% |
| First-turn context | 20% | 95%+ |
| Subagent preservation | 30% | 95%+ |
| Signal automation | 0% | 100% |

---

## PART VI: RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Bug fixes break tests | Run tests after each fix; fix in isolation |
| Path changes break refs | Comprehensive migration script |
| Task governance too strict | Gradual escalation (warn → enforce) |
| Signal system ignored | Include examples; track response rate |
| Scope creep | Time-box phases; ship after Phase 7 if needed |

---

## PART VII: IMMEDIATE NEXT STEPS

### Step 1: Validate This Plan (1 day)
- [ ] Review by user/stakeholder
- [ ] Approve or request changes
- [ ] Lock scope

### Step 2: Create GitHub Issues (2 hours)
- [ ] Create 1 issue per phase
- [ ] Add labels: `phase-1`, `critical`, etc.
- [ ] Link to this plan

### Step 3: Begin Phase 0 (20 minutes)
- [ ] Run full test suite
- [ ] Document baseline
- [ ] Verify slash commands broken

### Step 4: Execute Phase 1 (6 hours, parallel)
- [ ] Dispatch sub-agents for each bug fix
- [ ] Entry gate implementation
- [ ] Migration detector

### Step 5: Continue Through Phases
- [ ] Weekly checkpoint
- [ ] Progress updates
- [ ] Course corrections as needed

---

## APPENDIX A: Evidence Trail

### Wave 1 Audit (Tier 1-3 Bugs)
1. export_cycle doesn't sync hierarchy
2. declare_intent overwrites templates
3. Auto-archive doesn't reset hierarchy
4. trackSectionUpdate() never called
5. write_without_read_count missing from migration
6. next_compaction_report not cleared
7. Drift score before turn increment
8. Drift score not persisted

### Wave 2 Feedback (.hivemind Chaos)
- Files scattered: sessions, archive, exports mixed
- No YAML frontmatter on most sessions
- No INDEX.md entry point
- Naming inconsistent (timestamps vs semantic)

### Wave 3 Feedback (Missing Enforcement)
- No 100% hit rate automation
- Delegation not enforced
- TODO not linked to hierarchy
- No forced re-read checkpoints

### Wave 4 Feedback (User Pain)
- No interactive installation
- Dashboard unclear
- No immediate "wow" actions
- Inferior README (not actionable)

### Cross-Team Analysis (Code Evidence)
- detection.ts line 259: `[SEQ] [PLAN] [HIER]` jargon
- soft-governance.ts 294-369: Static toast strings
- toast-throttle.ts 48-80: Only rate limiting, no relevance
- commands/*.md: Missing `name:` field
- session-lifecycle.ts 500-506: No scattered doc check

---

## APPENDIX B: OpenCode Ecosystem Integration

### Commands (Fixed)
```yaml
---
name: hivemind-scan
description: "Scan the project codebase and build a HiveMind backbone"
---
```

### Skills (Already Present)
- `hivemind-governance` — Bootstrap checkpoint
- `session-lifecycle` — Session management
- `evidence-discipline` — Prove before claiming
- `context-integrity` — Detect and repair drift
- `delegation-intelligence` — Subagent patterns

### Hooks (Enhanced)
- `system.transform` — Inject signals + context
- `tool.execute.before` — Entry gate validation
- `tool.execute.after` — Signal evaluation
- `session.compacting` — Context preservation

---

*Document Version: 2.0.0*  
*Unified from: Strategic Plan v1.0 + Concrete Plan + Cross-Team Analysis*  
*Status: READY FOR EXECUTION*  
*Estimated Duration: 2-3 weeks*  
*Target: HiveMind v3.0.0*
