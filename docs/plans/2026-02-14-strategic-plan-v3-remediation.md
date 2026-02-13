# Strategic Plan: HiveMind v3 — Root Cause Analysis & System-Wide Remediation

**Branch:** `strategic-planning-v3`  
**Analysis Date:** 2026-02-14  
**Author:** System Architect  
**Status:** DRAFT — Pending Review  

---

## Executive Summary

This document provides a root-cause analysis of the HiveMind framework's current pain points and presents a phased remediation plan based on six core architectural principles:

1. **Control from the smallest unit** — If you can't manage sub-tasks (the atomic unit), you can't govern the system
2. **Never govern what you can't regulate at 100%** — The toast system is currently nonsensical; needs total refactor
3. **Delegation + TODO + context mapping at ALL turns** — Not optional, not conditional
4. **Smart automation, not blind obedience** — Don't expect AI to follow instructions; build mechanisms that work regardless
5. **Easy + impactful first** — Start with prompt transformation (it's wrong everywhere)
6. **Entry point must be bulletproof** — Framework cannot function without proper .hivemind hierarchy setup

---

## Part I: Root Cause Analysis

### 1.1 The Nonsensical Toast System (Priority: CRITICAL)

**Symptoms:**
- Toasts strike with "nonsensical knowledge"
- No clear escalation path (INFO→WARN→CRITICAL→DEGRADED)
- Agent ignores warnings because they're not actionable
- Context poisoning from poorly structured messages

**Root Cause:**
The current toast/throttle system in `src/lib/toast-throttle.ts` was designed as a notification layer, not a governance mechanism. It lacks:
- Semantic understanding of what triggered the warning
- Contextual relevance to the agent's current task
- Actionable guidance (what should the agent DO?)
- Memory of past warnings (same warning repeats)

**Impact:** Agents learn to ignore warnings → governance becomes noise → drift goes undetected

**Remediation:** Replace with "Signal-Driven Governance" — see Phase 1

---

### 1.2 The Broken Promise of export_cycle (Priority: CRITICAL)

**Symptoms:**
- `export_cycle` doesn't update hierarchy after modifications
- Subagent intelligence lost on compaction
- No persistent trail of decisions

**Root Cause:**
`export_cycle` in `src/tools/export-cycle.ts` was implemented as a logging tool, not a state-synchronization tool. It:
- Writes to cycle logs but doesn't update `brain.hierarchy`
- Doesn't link to hierarchy nodes
- Doesn't persist to mems brain with proper tagging

**Impact:** After subagent completes, there's no record of WHAT was done or WHY. Next compaction erases it.

**Remediation:** Reimplement as state-synchronization gateway — see Phase 1

---

### 1.3 The Corrupted Session Lifecycle (Priority: CRITICAL)

**Symptoms:**
- `declare_intent` overwrites session templates with legacy format
- Stale auto-archive doesn't reset hierarchy.json
- Session files scattered with no clear organization

**Root Cause:**
The session lifecycle in `src/lib/planning-fs.ts` and `src/tools/declare-intent.ts` has conflicting responsibilities:
- Template instantiation happens in multiple places
- No single source of truth for session format
- Auto-archive logic doesn't coordinate with hierarchy reset

**Impact:** Session files are corrupted from the start. No reliable session recovery.

**Remediation:** Centralize session lifecycle with strict format enforcement — see Phase 2

---

### 1.4 The Misunderstood compact_session (Priority: HIGH)

**Symptoms:**
- Agents misunderstand what compact does
- Context lost after compaction
- No clear "what to preserve" guidance

**Root Cause:**
The compact tool's purpose isn't clearly communicated. Agents see it as "cleanup" not "archival with preservation". The prompt doesn't explain:
- What gets preserved (mems, anchors, hierarchy)
- What gets archived (session file, full context)
- How to resume from a compacted session

**Impact:** Agents skip compacting or do it wrong → intelligence lost

**Remediation:** Transform prompt + add pre-compact checklist — see Phase 3

---

### 1.5 The Disorganized .hivemind Hierarchy (Priority: HIGH)

**Symptoms:**
- Files scattered: sessions, archive, exports all mixed
- No clear traversal path
- JSON and MD files with no linking
- Naming conventions inconsistent

**Root Cause:**
The directory structure evolved organically without a manifest-first design. Current structure:
```
.hivemind/sessions/archive/exports/  # Too deep, mixed concerns
.hivemind/sessions/archive/*.md      # Mixed with exports
.hivemind/sessions/*.md              # No organization
```

**Impact:** Agents can't find what they need. No script-friendly structure.

**Remediation:** Reorganize with manifest-first, symlink-based navigation — see Phase 4

---

### 1.6 The Absent TODO/Task Governance (Priority: CRITICAL)

**Symptoms:**
- Tasks mentioned but not tracked
- No enforcement of "complete before proceeding"
- No link between tasks and hierarchy
- Sub-tasks not delegated properly

**Root Cause:**
There's no active task tracking system. The framework mentions TODOs but:
- No `tasks.json` schema
- No task lifecycle enforcement
- No connection to `hivemind loop` or planning artifacts

**Impact:** Work proceeds without tracking → no accountability → no way to measure progress

**Remediation:** Implement atomic task governance with forced commits — see Phase 5

---

### 1.7 The Poisoned Prompt Transformation (Priority: HIGH)

**Symptoms:**
- System prompt includes wrong context
- `compact_session` misunderstood by agents
- No clear "how to use tools" guidance
- Instructions too verbose or too brief

**Root Cause:**
Prompt transformation in `src/hooks/session-lifecycle.ts` was built for Phase 1 (basic governance). It doesn't:
- Adapt to governance mode (strict vs assisted vs permissive)
- Include examples of correct tool usage
- Summarize context efficiently
- Guide the agent on what to do NEXT

**Impact:** Agents use tools wrong or not at all → governance fails

**Remediation:** Redesign prompt as actionable workflow guide — see Phase 3

---

### 1.8 The Silent First-Run Bootstrap (Priority: HIGH)

**Symptoms:**
- Silent auto-bootstrap creates .hivemind/ with defaults
- No interactive wizard on first use
- No project awareness on init

**Root Cause:**
The session-lifecycle hook auto-creates `.hivemind/` before the user runs `hivemind init`. This bypasses:
- Interactive mode selection
- Project scanning
- Framework detection
- User consent

**Impact:** Users get wrong configuration. Framework starts with wrong assumptions.

**Remediation:** Block auto-bootstrap, enforce wizard flow — see Phase 6

---

## Part II: Core Principles → Implementation Mapping

### Principle 1: Control from Smallest Unit

**What it means:**
- Sub-task = atomic unit (the "brain cell")
- If you can't manage sub-tasks with 100% reliability, you can't govern anything above
- Every sub-task must be: tracked, time-stamped, linked, committed

**Implementation:**
- Create `tasks.json` schema with sub-task hierarchy
- Every file-changing action = sub-task
- Sub-tasks delegated to sub-agents MUST export results
- Main task completes only when all sub-tasks complete

**Files to touch:**
- `src/lib/tasks.ts` (NEW)
- `src/schemas/task.ts` (NEW)
- `src/tools/export-cycle.ts` (MODIFY)
- `src/hooks/soft-governance.ts` (MODIFY)

---

### Principle 2: Never Govern What You Can't Regulate at 100%

**What it means:**
- The toast system is broken — it warns but can't enforce
- Don't rely on AI "following instructions"
- Build mechanisms that work REGARDLESS of agent behavior

**Implementation:**
- Remove toast-based warnings
- Replace with forced actions (must happen, can't skip)
- Use git commits as enforcement (atomic, irreversible)
- Use manifest updates as checkpoints (must be valid)

**Files to touch:**
- `src/lib/toast-throttle.ts` (DELETE/REPLACE)
- `src/lib/signals.ts` (NEW — signal-driven governance)
- `src/hooks/tool-gate.ts` (MODIFY — forced checkpoints)
- `src/hooks/session-lifecycle.ts` (MODIFY — forced context)

---

### Principle 3: Delegation + TODO + Context Mapping at ALL Turns

**What it means:**
- Every turn = opportunity to delegate, update TODO, map context
- Not just at session start
- Automation must trigger these, not wait for agent

**Implementation:**
- Hook on every tool call checks if delegation needed
- Hook on every tool call updates task status
- Hook on every turn checks if context stale (drift)
- Auto-trigger `map_context` when drift detected (not just warn)

**Files to touch:**
- `src/hooks/soft-governance.ts` (MODIFY)
- `src/hooks/tool-gate.ts` (MODIFY)
- `src/lib/detection.ts` (MODIFY — add auto-actions)
- `src/lib/tasks.ts` (NEW — task auto-update)

---

### Principle 4: Smart Automation, Not Blind Obedience

**What it means:**
- Don't expect AI to "do what it's told"
- Build multi-layer mechanisms (if A fails, B catches it)
- Parse and validate, don't just trust

**Implementation:**
- After subagent returns, PARSE the result (don't accept "done")
- Validate hierarchy updates (check tree integrity)
- Validate mems saved (check file written)
- Multiple signals for same condition (redundancy)

**Files to touch:**
- `src/tools/export-cycle.ts` (MODIFY — parse results)
- `src/lib/validation.ts` (NEW — result validation)
- `src/hooks/soft-governance.ts` (MODIFY — multi-signal)

---

### Principle 5: Easy + Impactful First

**What it means:**
- Prompt transformation = high impact, relatively easy
- Fix what's broken in current prompts before building new features
- Low-hanging fruit that unblocks everything else

**Implementation Priority:**
1. Fix `compact_session` prompt (clarify what it does)
2. Fix `declare_intent` prompt (clarify initialization)
3. Fix system prompt injection (make it actionable)
4. Then build new features on solid foundation

**Files to touch:**
- `src/hooks/session-lifecycle.ts` (MODIFY — prompt builder)
- `src/tools/declare-intent.ts` (MODIFY — tool description)
- `src/tools/compact-session.ts` (MODIFY — tool description)
- `templates/session.md` (MODIFY — session template)

---

### Principle 6: Entry Point Must Be Bulletproof

**What it means:**
- If `.hivemind/` isn't set up correctly, framework CAN'T work
- Detect wrong state and STOP (don't proceed with broken foundation)
- Guide user to fix it (don't guess)

**Implementation:**
- On every tool call, validate `.hivemind/` structure
- If invalid, throw clear error: "Run `hivemind init` first"
- If partial (old format), auto-migrate with user confirmation
- Never proceed with broken foundation

**Files to touch:**
- `src/lib/paths.ts` (MODIFY — validation)
- `src/lib/migrate.ts` (MODIFY — auto-migration)
- `src/tools/declare-intent.ts` (MODIFY — foundation check)
- `src/index.ts` (MODIFY — init gate)

---

## Part III: The 8-Phase Remediation Plan

### Phase 0: Foundation Validation (Prerequisite)

**Goal:** Ensure we can even begin the work

**Tasks:**
1. Run full test suite — document any failures
2. Verify `.planning/codebase/` is complete
3. Check `.hivemind/` structure in current repo
4. Document current state as baseline

**Success Criteria:**
- All tests pass (or failures documented)
- Codebase structure documented
- `.hivemind/` state captured

**Estimated Time:** 30 minutes

---

### Phase 1: Critical Bug Triage (Tier 1-3 from Wave 1)

**Goal:** Fix the 8 critical bugs that corrupt data

**Bugs to Fix:**
1. **P1-BUG-01:** `export_cycle` doesn't sync `brain.hierarchy`
2. **P1-BUG-02:** `declare_intent` overwrites session templates
3. **P1-BUG-03:** Auto-archive doesn't reset hierarchy.json
4. **P1-BUG-04:** `trackSectionUpdate()` never called
5. **P1-BUG-05:** `write_without_read_count` missing from migration
6. **P1-BUG-06:** `next_compaction_report` never cleared
7. **P1-BUG-07:** Drift score calculated before turn increment
8. **P1-BUG-08:** Drift score mutated without save

**Approach:**
- One sub-agent per bug (parallel dispatch)
- Each bug fix includes regression test
- After all fixes, run full test suite

**Success Criteria:**
- All 8 bugs fixed
- 8 new regression tests pass
- Full test suite still passes
- No new failures

**Estimated Time:** 2-3 hours (parallel)

---

### Phase 2: Session Lifecycle Centralization

**Goal:** Fix session lifecycle corruption

**Tasks:**
1. Create single `SessionLifecycleManager` class
2. Move all session creation logic into manager
3. Enforce strict template format validation
4. Ensure auto-archive coordinates with hierarchy reset
5. Add session format versioning

**Files to Modify:**
- `src/lib/planning-fs.ts` (REFACTOR)
- `src/tools/declare-intent.ts` (MODIFY)
- `src/tools/compact-session.ts` (MODIFY)
- `src/lib/session-lifecycle.ts` (NEW)

**Success Criteria:**
- Session creation happens in ONE place
- Template format enforced
- Auto-archive + hierarchy reset coordinated
- Session recovery works reliably

**Estimated Time:** 4 hours

---

### Phase 3: Prompt Transformation Overhaul

**Goal:** Fix what's broken in current prompts (high impact, relatively easy)

**Tasks:**
1. Rewrite `compact_session` tool description:
   - Clarify: archives session, preserves mems/hierarchy
   - Explain: how to resume from compacted session
   - Provide: example of when to call it

2. Rewrite `declare_intent` tool description:
   - Clarify: initializes session, sets mode/focus
   - Explain: must call before any work
   - Provide: examples for each mode

3. Rewrite system prompt injection:
   - Make it actionable (what to do NOW)
   - Include: current task, pending sub-tasks, drift status
   - Exclude: verbose explanations
   - Format: hierarchical, scannable

4. Create mode-specific prompt variants:
   - `strict`: Stronger enforcement language
   - `assisted`: Guidance with suggestions
   - `permissive`: Minimal, tracking only

**Files to Modify:**
- `src/hooks/session-lifecycle.ts` (MODIFY)
- `src/tools/declare-intent.ts` (MODIFY)
- `src/tools/compact-session.ts` (MODIFY)
- `templates/session.md` (MODIFY)
- `src/lib/prompt-builder.ts` (NEW)

**Success Criteria:**
- Prompts are actionable (agent knows what to do)
- Mode-specific variants exist
- Agents understand tool usage better
- Drift detection improved (agents call map_context more)

**Estimated Time:** 3 hours

---

### Phase 4: .hivemind Reorganization (Manifest-First)

**Goal:** Make .hivemind/ traversable, grep-friendly, scriptable

**New Structure:**
```
.hivemind/
├── INDEX.md                    # Entry point: < 30 lines, navigation links
├── manifest.json               # Root manifest with all sub-manifests linked
│
├── config.json                 # User configuration (governance mode, etc.)
│
├── state/                      # Hot state (updated every turn)
│   ├── manifest.json           # State manifest
│   ├── brain.json              # Brain state
│   ├── hierarchy.json          # Hierarchy tree
│   ├── anchors.json            # Immutable anchors
│   └── tasks.json              # Task tracking (NEW)
│
├── memory/                     # Warm state (cross-session)
│   ├── manifest.json           # Memory manifest
│   └── mems.json               # Persistent memories
│
├── sessions/                   # Session management
│   ├── manifest.json           # Session manifest
│   ├── active/                 # Symlink to current session
│   │   └── current -> ../2026-02-14-mode-slug/  # Symlink
│   ├── 2026-02-14-mode-slug/   # Named session directories
│   │   ├── session.md          # Session file
│   │   └── manifest.json       # Session-specific manifest
│   └── archive/                # Archived sessions
│       └── 2026-02-14-mode-slug.md
│
├── plans/                      # Planning artifacts
│   └── manifest.json
│
└── templates/                  # Templates
    └── session.md
```

**Tasks:**
1. Create migration script from old structure to new
2. Update `paths.ts` with new path constants
3. Create manifest generators for each directory
4. Add symlinks for navigation
5. Update all tools to use new paths

**Files to Modify:**
- `src/lib/paths.ts` (MODIFY)
- `src/lib/migrate.ts` (MODIFY)
- `src/lib/manifest.ts` (NEW)
- All tools that reference paths (UPDATE)

**Success Criteria:**
- New structure created
- Migration script works
- All tests pass with new paths
- INDEX.md auto-generated

**Estimated Time:** 6 hours

---

### Phase 5: Atomic Task Governance (The "Brain Cell" System)

**Goal:** Track sub-tasks with 100% reliability

**Schema:**
```typescript
// tasks.json
{
  "manifest": {
    "version": "1.0.0",
    "last_updated": "2026-02-14T10:30:00Z",
    "active_count": 5,
    "completed_count": 12
  },
  "main_tasks": [
    {
      "id": "task_20260214_001",
      "stamp": "1402202601",
      "title": "Fix export_cycle hierarchy sync",
      "status": "active",
      "priority": "critical",
      "linked_plan": "docs/plans/phase1.md",
      "linked_session": "sessions/2026-02-14-plan-driven-fixes/",
      "sub_tasks": ["sub_001", "sub_002"],
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T10:30:00Z"
    }
  ],
  "sub_tasks": [
    {
      "id": "sub_001",
      "parent_task": "task_20260214_001",
      "stamp": "1402202602",
      "description": "Analyze export_cycle current behavior",
      "status": "completed",
      "agent": "subagent-1",
      "tools_used": ["scan_hierarchy", "read_file"],
      "files_touched": ["src/tools/export-cycle.ts"],
      "acceptance_criteria": ["Document current behavior", "Identify sync gap"],
      "started_at": "2026-02-14T10:05:00Z",
      "completed_at": "2026-02-14T10:15:00Z",
      "git_commit": "abc123"
    }
  ]
}
```

**Tasks:**
1. Create `tasks.json` schema
2. Create TaskManager class
3. Integrate with tool hooks (auto-create task on file change)
4. Enforce: sub-task completion requires git commit
5. Enforce: main task completion requires all sub-tasks complete
6. Add task injection to system prompt

**Files to Create/Modify:**
- `src/schemas/task.ts` (NEW)
- `src/lib/tasks.ts` (NEW)
- `src/hooks/soft-governance.ts` (MODIFY)
- `src/tools/export-cycle.ts` (MODIFY)

**Success Criteria:**
- Every file change = task entry
- Sub-tasks delegated with acceptance criteria
- Git commit enforced on sub-task completion
- Task status visible in system prompt
- Main task blocks until sub-tasks done

**Estimated Time:** 8 hours

---

### Phase 6: Signal-Driven Governance (Replace Toast System)

**Goal:** Replace nonsensical toast with actionable signals

**Signal Types:**
```typescript
type Signal = {
  id: string;
  tier: "info" | "warn" | "critical" | "degraded";
  condition: string;        // What triggered it
  context: string;          // Current situation
  action: string;           // What to do
  automation?: string;      // Automated response (if any)
  persistence: "turn" | "session" | "permanent";
}
```

**Tasks:**
1. Delete `toast-throttle.ts`
2. Create `signals.ts` with signal registry
3. Define signal conditions (drift, no-intent, stale-context, etc.)
4. Implement signal compiler (turn state → signals)
5. Implement signal executor (signal → action)
6. Connect to system prompt injection

**Example Signals:**
```typescript
// Drift detected
{
  tier: "warn",
  condition: "drift_score < 50",
  context: "7 turns without map_context",
  action: "Call map_context({ level: 'action', content: '...' })",
  automation: "auto-inject reminder into system prompt"
}

// No intent declared
{
  tier: "critical",
  condition: "!session.intent_declared && turn_count > 3",
  context: "Working without declared intent",
  action: "Call declare_intent immediately",
  automation: "block tool execution until intent declared (strict mode)"
}
```

**Files to Create/Modify:**
- `src/lib/signals.ts` (NEW)
- `src/lib/toast-throttle.ts` (DELETE)
- `src/hooks/session-lifecycle.ts` (MODIFY)
- `src/hooks/soft-governance.ts` (MODIFY)

**Success Criteria:**
- Toast system removed
- Signals are actionable
- Agents understand what to do
- Automation triggers correctly
- System prompt includes relevant signals

**Estimated Time:** 6 hours

---

### Phase 7: First-Run Experience Fix

**Goal:** Block silent bootstrap, enforce wizard flow

**Current Problem:**
- Hook auto-creates `.hivemind/` before user runs `hivemind init`
- No project awareness on init
- No framework detection

**Fix:**
1. Remove auto-bootstrap from session-lifecycle hook
2. Add "not initialized" state detection
3. If not initialized:
   - Inject clear message: "Run `npx hivemind-context-governance` to initialize"
   - Block tool execution (except help)
   - Don't create any files
4. Enhance wizard with:
   - Project scanning (tech stack, structure)
   - Framework detection (.planning/ vs .spec-kit/)
   - Mode recommendation based on project type

**Files to Modify:**
- `src/hooks/session-lifecycle.ts` (MODIFY)
- `src/cli/interactive-init.ts` (MODIFY)
- `src/lib/project-scan.ts` (MODIFY)
- `src/index.ts` (MODIFY)

**Success Criteria:**
- No auto-bootstrap
- Clear message if not initialized
- Wizard runs on first use
- Project awareness on init
- Framework detected and configured

**Estimated Time:** 4 hours

---

### Phase 8: Integration & Stress Testing

**Goal:** Validate the entire mesh works together

**Tests to Add:**
1. **Mesh Integration Test:**
   - Hook fires → Session updates → Tool enriches → Mem stores → Core reflects
   - Full chain in one test

2. **10-Compaction Test:**
   - 10 compactions in sequence
   - After each: validate hierarchy, brain, mems, tasks
   - Zero data loss

3. **Subagent Delegation Test:**
   - Delegate task → Subagent works → Export cycle → Hierarchy updated
   - Verify intelligence preserved

4. **Task Enforcement Test:**
   - Create main task → Delegate sub-tasks → Complete sub-tasks → Complete main
   - Verify enforcement at each step

5. **Signal Response Test:**
   - Trigger drift condition → Signal fired → Action taken
   - Verify automation works

**Files to Create:**
- `tests/mesh-integration.test.ts` (NEW)
- `tests/compaction-stress.test.ts` (NEW)
- `tests/task-enforcement.test.ts` (NEW)
- `tests/signal-response.test.ts` (NEW)

**Success Criteria:**
- All new tests pass
- Original tests still pass
- 1000+ total assertions
- Mesh integration validated

**Estimated Time:** 6 hours

---

## Part IV: Execution Dependencies

```
Phase 0 (Foundation)
  │
  ▼
Phase 1 (Bug Triage) ───────────────────┐
  │                                       │
  ▼                                       │
Phase 2 (Session Lifecycle)               │
  │                                       │
  ▼                                       │
Phase 3 (Prompt Transform) ──────────────┤
  │                                       │ (can parallelize)
  ▼                                       │
Phase 4 (.hivemind Reorg) ───────────────┤
  │                                       │
  ▼                                       │
Phase 5 (Task Governance) ───────────────┘
  │
  ▼
Phase 6 (Signal Governance)
  │
  ▼
Phase 7 (First-Run Fix)
  │
  ▼
Phase 8 (Integration Test)
```

**Critical Path:** Phase 0 → 1 → 2 → 5 → 6 → 8  
**Parallel Track:** Phase 3 and 4 can run alongside Phase 2-5  
**Final Gate:** Phase 8 validates everything

---

## Part V: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bug fixes break existing tests | Medium | High | Run tests after each fix; fix in isolation |
| Path changes break file references | Medium | High | Comprehensive migration script; test on sample .hivemind |
| Task governance too restrictive | Medium | Medium | Start with warnings, escalate to enforcement gradually |
| Signal system still ignored | Low | High | Include in prompt with examples; track signal response rate |
| First-run block annoys users | Low | Medium | Clear messaging; one-command init |
| Scope creep (8 phases too much) | High | High | Time-box each phase; ship after Phase 3 if needed |

---

## Part VI: Success Metrics

### Phase Completion Metrics

- **Phase 0:** All tests pass, state documented
- **Phase 1:** 8 bugs fixed, 8 regression tests added
- **Phase 2:** Session creation centralized, recovery works
- **Phase 3:** Prompt clarity score (agent survey) > 8/10
- **Phase 4:** Directory structure matches spec, migration works
- **Phase 5:** Every file change = task entry, enforcement works
- **Phase 6:** Signals actionable, toast system gone
- **Phase 7:** No auto-bootstrap, wizard runs on first use
- **Phase 8:** 1000+ assertions, mesh integration passes

### Overall Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test assertions | ~700 | 1000+ |
| Drift detection accuracy | ~60% | 90%+ |
| Subagent intelligence preserved | ~30% | 95%+ |
| First-run completion rate | Unknown | 90%+ |
| Agent tool usage correctness | ~50% | 85%+ |

---

## Part VII: Immediate Next Steps

### Step 1: Review and Approve Plan

**Action:** User reviews this plan, approves or requests changes  
**Time:** 1 day  
**Output:** Approved plan with any modifications

### Step 2: Create GitHub Issues

**Action:** Create 1 issue per phase with detailed tasks  
**Time:** 2 hours  
**Output:** 8 GitHub issues with labels, assignees

### Step 3: Begin Phase 0

**Action:** Validate foundation, document current state  
**Time:** 30 minutes  
**Output:** Baseline report

### Step 4: Execute Phase 1-8

**Action:** Work through phases in order  
**Time:** 2-3 weeks (depending on parallelization)  
**Output:** Working v3 with all metrics met

---

## Appendix A: Current State Documentation

### Repository State (as of 2026-02-14)

**Branch:** `dev-v3`  
**Commit:** `6b26c8d docs(plan): add full planning artifacts and analysis corpus for v3`  
**Tests:** 52 passing, 0 failing  
**Typecheck:** Pass  
**Lint:** Pass  

### .hivemind/ State

```
.hivemind/
├── 10-commandments.md          # Project commandments
├── anchors.json                # 12 anchors
├── brain.json                  # Brain state (1624 bytes)
├── brain.json.bak              # Backup
├── config.json                 # Config (541 bytes)
├── hierarchy.json              # Hierarchy tree (1184 bytes)
├── logs/                       # Runtime logs
├── mems.json                   # Mems brain (13592 bytes)
├── sessions/                   # 17 session files
└── templates/                  # Session template
```

### Known Issues (from Wave 1 Audit)

1. `export_cycle` doesn't sync hierarchy
2. `declare_intent` overwrites templates
3. Auto-archive doesn't reset hierarchy
4. `trackSectionUpdate()` never called
5. Missing `write_without_read_count` in migration
6. `next_compaction_report` not cleared
7. Drift score calculated wrong
8. Drift score not persisted

### Architecture Compliance

- ✅ SDK boundary enforced (`src/lib/` never imports SDK)
- ✅ 14 tools implemented
- ✅ 5 hooks implemented
- ✅ 5 skills implemented
- ✅ 3 slash commands shipped

---

## Appendix B: OpenCode Ecosystem Integration

### Innate Mechanisms to Leverage

**Commands:**
- YAML header control for agent/text/command routing
- Argument parsing with bash/shell integration
- JSON/dotmd with frontmatter support

**Skills:**
- Behavioral governance (already have: hivemind-governance, session-lifecycle, etc.)
- Find-skill for discovering new capabilities
- Skill-creator for generating new governance skills

**Agents:**
- Configuration to avoid clashing with framework agents
- Hidden sub-agents for specialized tasks
- Profile-based activation via YAML headers

**Tools:**
- Innate tools at `https://opencode.ai/docs/tools/`
- Custom tools via `@opencode-ai/plugin`
- Tool schema definition for type safety

### Integration Points

1. **Commands + HiveMind:**
   - `/hivemind-scan` → uses scan_hierarchy tool
   - `/hivemind-status` → displays brain state
   - `/hivemind-compact` → triggers compact_session

2. **Skills + HiveMind:**
   - Skills teach agent HOW to use governance
   - Loaded every turn via governance checkpoint
   - Behavioral patterns, not just documentation

3. **Hooks + HiveMind:**
   - `system.transform` → inject governance context
   - `tool.execute.before` → gate tool execution
   - `tool.execute.after` → track metrics
   - `session.compacting` → preserve hierarchy

---

## Appendix C: File Inventory

### Critical Files (Must Understand)

**Entry Points:**
- `src/index.ts` — Plugin registration
- `src/cli.ts` — CLI entry

**Core Logic:**
- `src/lib/persistence.ts` — State management
- `src/lib/hierarchy-tree.ts` — Tree operations
- `src/lib/planning-fs.ts` — Session files

**Tools:**
- `src/tools/declare-intent.ts`
- `src/tools/map-context.ts`
- `src/tools/compact-session.ts`
- `src/tools/export-cycle.ts`

**Hooks:**
- `src/hooks/session-lifecycle.ts`
- `src/hooks/soft-governance.ts`
- `src/hooks/tool-gate.ts`

**Schemas:**
- `src/schemas/brain-state.ts`
- `src/schemas/hierarchy.ts`
- `src/schemas/config.ts`

### Files to Create

- `src/lib/tasks.ts` — Task management
- `src/lib/signals.ts` — Signal-driven governance
- `src/schemas/task.ts` — Task schema
- `src/lib/manifest.ts` — Manifest management
- `src/lib/prompt-builder.ts` — Prompt construction

### Files to Delete

- `src/lib/toast-throttle.ts` — Replaced by signals

---

*Document Version: 1.0.0*  
*Last Updated: 2026-02-14*  
*Status: READY FOR REVIEW*
