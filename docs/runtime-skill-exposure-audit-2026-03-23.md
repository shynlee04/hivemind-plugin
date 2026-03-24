# Runtime Skill Exposure Audit — 2026-03-23

## Executive Summary

This audit establishes the **minimal, non-destructive mechanism** for exposing a selective set of skills (6-7) to agents at runtime based on:
- Task type
- Active workflow
- Session state (main vs sub-session)
- Mid-session updates

---

## 1. Deterministic Injection Paths That Work

### Primary Working Mechanism: `messages.transform` Hook

| File (Source) | File (Dist) | Hook | Purpose |
|---------------|-------------|------|---------|
| `src/plugin/messages-transform-adapter.ts` | `dist/plugin/messages-transform-adapter.js` | `experimental.chat.messages.transform` | **PRIMARY** — Injects `<hivemind>` context packet + `<hivemind-turn-hierarchy>` as synthetic parts on last user message |

**How it works:**
1. Finds the last user message in the turn
2. Prepends synthetic parts containing:
   - `<hivemind-turn-hierarchy>` — turn depth, type (root/delegation/handoff/correction), sibling count, trajectory path
   - `<hivemind context_version="v1">` — session_id, lineage, trajectory, workflow, task_ids, entry_state, purpose, risk, route_command, governance_mode, language
3. Conditionally injects `<hivemind-route-hint>` only when NOT already dispatched

**Why this is the cleanest path:**
- Executes BEFORE user message is sent to model
- Silent, non-blocking — no governance hooks
- Conditional based on `startWork.requiredCommandId` and dispatch state
- Uses synthetic parts that become part of the message without explicit markers

### Secondary Working Mechanisms

| # | File | Hook | Purpose |
|---|------|------|---------|
| 2 | `src/plugin/compaction-adapter.ts` | `session.compacting` | Injects context into compaction |
| 3 | `src/plugin/opencode-plugin.ts:117-157` | `command.execute.before` | Pre-command context (only for slash commands) |
| 4 | `src/plugin/opencode-plugin.ts:110-116` | `shell.env` | Env vars injection (HIVEMIND_RUNTIME_ATTACHED, etc.) |
| 5 | `src/hooks/event-handler.ts` | `event` | Records lifecycle events (read-only) |
| 6 | `src/plugin/opencode-plugin.ts:73-85` | `chat.message` | Governance toasts |
| 7 | `src/plugin/opencode-plugin.ts:86-103` | `permission.ask` | Mutation gating (non-blocking toasts) |

### NOT Working / Removed Mechanisms

| Mechanism | Status | Reason |
|-----------|--------|--------|
| `system.transform` | **Removed** | Phase 11 removed duplicate emitter |
| `chat.params` | **Not adopted** | Per-agent temperature control deferred |
| `tool.definition` | **Not adopted** | Dynamic tool description enrichment deferred |
| `config` | **Not adopted** | React to config changes deferred |
| `chat.headers` | **Rejected** | No custom auth headers needed |
| `auth` | **Rejected** | Not a provider plugin |
| `text.complete` | **Rejected** | No streaming text injection use case |
| `core/session/` | **Removed** | Replaced by `hooks/start-work/` |
| `shared/event-bus.ts` | **Removed** | Replaced by SDK `event` hook |

---

## 2. Build Trace: Source → Dist

### Entry Points Verified

| Entry Point | Source | Dist |
|-------------|--------|------|
| Plugin | `src/plugin/opencode-plugin.ts` | `dist/plugin/opencode-plugin.js` |
| CLI | `src/cli.ts` | `dist/cli.js` |
| Main | `src/index.ts` | `dist/index.js` |

### Working Source → Dist Paths

| Source Directory | Dist Output | Working? |
|-----------------|-------------|----------|
| `src/plugin/` | `dist/plugin/` | ✅ Yes |
| `src/hooks/` | `dist/hooks/` | ✅ Yes |
| `src/sdk-supervisor/` | `dist/sdk-supervisor/` | ✅ Yes |
| `src/tools/` | `dist/tools/` | ✅ Yes |
| `src/core/` | `dist/core/` | ✅ Yes |
| `src/shared/` | `dist/shared/` | ✅ Yes |
| `src/schema-kernel/` | `dist/schema-kernel/` | ✅ Yes |

---

## 3. Agent → Workflow → Skill Bundle Mapping

### Consolidated Matrix

```json
{
  "hiveminder": {
    "skills": ["use-hivemind-delegation", "hivemind-gatekeeping-delegation", "context-entry-verify", "hivemind-research", "context-intelligence-entry", "git-continuity-memory"],
    "count": 6,
    "context": "Primary orchestrator. Always delegation skills first. NEVER domain skills."
  },
  "architect": {
    "skills": ["use-hivemind-delegation", "course-correction-delegation", "hivemind-codemap", "hivemind-research-framework", "spec-distillation", "hivemind-gatekeeping-delegation"],
    "count": 6,
    "context": "Design-only subagent. Can delegate to code-skeptic, hiveq, hivexplorer."
  },
  "code-skeptic": {
    "skills": ["use-hivemind-delegation", "course-correction-delegation", "hivemind-codemap", "systematic-debugging", "hivemind-research-tools"],
    "count": 5,
    "context": "Read-only critique subagent. Demands evidence for every claim."
  },
  "handoff": {
    "skills": ["use-hivemind-delegation", "hivemind-gatekeeping-delegation", "git-continuity-memory", "hivemind-codemap", "context-intelligence-entry", "hivemind-atomic-commit", "course-correction-delegation"],
    "count": 7,
    "context": "Phase conductor for 3+ phase workflows. Manages gatekeeper validation."
  },
  "hitea": {
    "skills": ["use-hivemind-delegation", "tdd-delegation", "qa-test-planner", "test-driven-development", "hivemind-research-tools"],
    "count": 5,
    "context": "Terminal testing subagent. May touch product code only to wire tests."
  },
  "hivehealer": {
    "skills": ["use-hivemind-delegation", "course-correction-delegation", "systematic-debugging", "hivemind-system-debug", "hivemind-codemap"],
    "count": 5,
    "context": "Terminal remediation subagent. Diagnoses before fixing."
  },
  "hivemaker": {
    "skills": ["use-hivemind-delegation", "tdd-delegation", "clean-code", "refactor", "hivemind-codemap"],
    "count": 5,
    "context": "Terminal implementation subagent. Implements what architect designs."
  },
  "hiveplanner": {
    "skills": ["use-hivemind-delegation", "writing-plans", "breakdown-plan", "hivemind-research-framework", "hivemind-gatekeeping-delegation"],
    "count": 5,
    "context": "Terminal planning subagent. Plans work, doesn't execute."
  },
  "hiveq": {
    "skills": ["use-hivemind-delegation", "tdd-delegation", "verification-before-completion", "hivemind-research-tools", "course-correction-delegation"],
    "count": 5,
    "context": "Read-only verification subagent. Evidence before assertions."
  },
  "hiverd": {
    "skills": ["use-hivemind-delegation", "research-delegation", "hivemind-research", "hivemind-research-framework", "hivemind-research-tools", "deep-research"],
    "count": 6,
    "context": "Terminal external research subagent. NEVER delegates."
  },
  "hivexplorer": {
    "skills": ["use-hivemind-delegation", "research-delegation", "context-map", "hivemind-codemap", "hivemind-research-tools"],
    "count": 5,
    "context": "Terminal codebase investigation subagent. Read-only."
  }
}
```

### Universal Skill

**`use-hivemind-delegation`** is loaded by ALL 11 agents — the universal foundation.

---

## 4. Session & Turn Awareness

### Detection Mechanism

The `messages-transform-adapter.ts` detects:

1. **User turns**: `findLastUserMessage()` — finds the last message with role=user
2. **Turn hierarchy**: Injects `<hivemind-turn-hierarchy>` with:
   - `turn_depth`: nesting level
   - `turn_type`: `root` | `delegation` | `handoff` | `correction`
   - `sibling_count`: parallel agents
   - `trajectory_path`: [trajectoryId, workflowId, checkpointId, ...taskIds]

3. **Dispatch state**: 
   - `alreadyDispatched`: prior dispatch in this turn
   - `dispatchedNow`: current dispatch just happened
   - Controls route hint injection

### Sub-Session Detection

When `turn_type` is `delegation` or `handoff`, the receiving agent knows it is acting as a sub-agent via the `trajectory_path` which includes parent trajectory IDs.

---

## 5. Noise / Legacy Inventory

### Assets to Detach

| Category | Count | Action |
|----------|-------|--------|
| Unregistered commands | 33 | Detach — violate registry rules |
| Noise workflows (YAML) | 22 | Detach — reference non-existent tools |
| Legacy agent sources | 9 | Keep via registry only |
| Unknown agents | 3 | Verify — handoff, code-skeptic, architect |

### AGENTS.md Files Created/Updated

| Location | Action |
|----------|--------|
| `agents/AGENTS.md` | CREATED |
| `commands/AGENTS.md` | UPDATED |
| `workflows/AGENTS.md` | CREATED |
| `.opencode/agents/AGENTS.md` | CREATED |

---

## 6. Final Proposal: Cleanest Conditional Prompt Injection

### Recommendation

Use **`messages-transform-adapter.ts`** with conditional skill bundle injection.

### Implementation Pattern

1. **Extend the context packet** to include skill reminders when:
   - `turn_type` indicates sub-session (delegation/handoff)
   - Workflow has changed mid-session
   - New session detected

2. **Skill reminder format** (natural, non-system):
   
   ```xml
   <hivemind-skills-reminder>
   For this task, consider: skill-name-1, skill-name-2, skill-name-3
   Current workflow: workflow-name
   </hivemind-skills-reminder>
   ```

3. **Conditional injection gates**:
   - Always: turn hierarchy + hivemind context packet
   - On sub-session: add "You are acting as a sub-agent" reminder + top skills
   - On workflow change: add workflow context reminder
   - On new session: add full skill bundle reminder

### Key Files to Modify

| File | Change |
|------|--------|
| `src/plugin/context-renderer.ts` | Add `renderSkillsReminder()` function |
| `src/plugin/messages-transform-adapter.ts` | Gate skill injection on turn_type and session state |
| `src/hooks/start-work/start-work-router.ts` | Export workflow/skill context for injection |

### Non-Destructive Constraints

1. **No blocking hooks** — only silent injection
2. **No governance enforcement** — only contextual reminders
3. **No explicit role labels** — natural language reminders only
4. **No schema changes** — uses existing 2-field registry pattern only

---

## 7. Working vs Non-Working Mechanisms Summary

### ✅ CONFIRMED WORKING

| Mechanism | File | Dist | Purpose |
|-----------|------|------|---------|
| messages.transform | `src/plugin/messages-transform-adapter.ts` | `dist/plugin/` | Primary injection point |
| session.compacting | `src/plugin/compaction-adapter.ts` | `dist/plugin/` | Compaction context |
| command.execute.before | `src/plugin/opencode-plugin.ts` | `dist/plugin/` | Pre-command (slash only) |
| shell.env | `src/plugin/opencode-plugin.ts` | `dist/plugin/` | Env injection |
| event | `src/hooks/event-handler.ts` | `dist/hooks/` | Lifecycle recording |
| chat.message | `src/plugin/opencode-plugin.ts` | `dist/plugin/` | Governance toasts |
| permission.ask | `src/plugin/opencode-plugin.ts` | `dist/plugin/` | Mutation toasts |
| tool.execute.before/after | `src/plugin/opencode-plugin.ts` | `dist/plugin/` | Trajectory recording |

### ❌ NOT WORKING / LEGACY

| Mechanism | Reason |
|-----------|--------|
| `system.transform` | Removed in Phase 11 |
| `chat.params` | Not adopted |
| `tool.definition` | Not adopted |
| `config` | Not adopted |
| `chat.headers` | Rejected |
| `auth` | Rejected |
| `text.complete` | Rejected |
| `core/session/` | Removed |
| `shared/event-bus.ts` | Removed |
| All `root/commands/*.md` unregistered | Noise |
| All `root/workflows/*.yaml` | Noise |

---

## 8. Registry Minimal Usage

The system uses only 2 fields from the registry (as required):

1. `agent_name` — identifies the agent
2. `skills` — array of skill names

No broader schema dependencies introduced.

---

*End of audit — 2026-03-23*
