# HiveMind Tool Diagnostic Report — 2026-04-01

## Session Context
- Session: ses_2ba7 (audit), evidence from ses_2baf (architecture overhaul)
- Evidence Base: 6 specialist agents, 125K+ lines of session logs, 32 source files audited
- Project: hivemind-context-governance v2.9.5
- Worktree: product-detox

---

## RAW FINDINGS FROM 6 AUDIT AGENTS

### Agent 1: Tool Description Quality Audit (code-skeptic)

| Tool | Description Quality | Shadowing Risk | LLM Decidability | Key Issue |
|------|-------------------|----------------|-----------------|-----------|
| hivemind_runtime_status | WARN | LOW | WARN | No "Use this WHEN..." trigger. Jargon: "runtime attachment", "trajectory" |
| hivemind_runtime_command | WARN | MEDIUM | FAIL | Circular: references hm-* tools that ARE other tools. 13 undocumented optional args |
| hivemind_agent_work_create_contract | FAIL | HIGH | FAIL | Describes implementation ("feature contract store"), not purpose. Shadows task + trajectory |
| hivemind_agent_work_export_contract | WARN | MEDIUM | WARN | Negative description ("without duplicating..."). "compaction-safe" is jargon |
| hivemind_doc | PASS | MEDIUM | WARN | Best description. But doesn't communicate superiority over Read/Grep |
| hivemind_task | WARN | HIGH | WARN | "Canonical authority" = architecture-speak. Shadows create_contract. "execution nodes" ≠ "tasks" |
| hivemind_trajectory | WARN | MEDIUM | FAIL | "Runtime story" = meaningless jargon. Undefined concept for uninformed LLM |
| hivemind_handoff | WARN | LOW | WARN | 23 args = overwhelming. "bounded sub-session work" unclear |
| hivemind_journal | WARN | LOW | WARN | Says what NOT to do ("sole write-side entry point"). No WHEN trigger |
| hivemind_hm_init | PASS | MEDIUM | PASS | Good description but PLACEHOLDER implementation |
| hivemind_hm_doctor | PASS | LOW | PASS | Good description but PLACEHOLDER implementation |
| hivemind_hm_setting | PASS | LOW | PASS | Clear and well-scoped. Hidden dashboard behavior |

**Critical Shadowing Pairs:**
1. runtime_command ↔ hm_init/hm_doctor/hm_setting — HIGH (same operations, two entry points)
2. agent_work_create_contract ↔ task — HIGH (both manage tasks, same fields)
3. agent_work_create_contract ↔ trajectory — MEDIUM (both record state transitions)
4. journal(trajectory event) ↔ trajectory(event action) — MEDIUM (both record "trajectory" events)

### Agent 2: Tool Frequency Audit (explore)

| Tool | Call Count | Unique Actions | Unique Agents | Status | Utility |
|------|-----------|----------------|--------------|--------|---------|
| hivemind_task | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_trajectory | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_handoff | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_doc | ~6 | 3 (skim, skim_directory, read) | 1 (Hiveminder) | LOW/FAILING | NARROW |
| hivemind_runtime_status | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_runtime_command | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_agent_work_create_contract | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_agent_work_export_contract | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_journal | 0 (auto-hook) | 0 | N/A | AUTO-ONLY | HYBRID |
| hivemind_hm_init | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_hm_doctor | 0 | 0 | 0 | NEVER INVOKED | DEAD |
| hivemind_hm_setting | 0 | 0 | 0 | NEVER INVOKED | DEAD |

**Root Causes for Non-Usage:**
1. Description confusion — Agents don't understand when to use which tool
2. Parameter complexity — Required params not intuitive (heading for doc read, dirPath for search)
3. Overlapping functionality — No clear distinction between trajectory/handoff/task
4. Hooks auto-handle it — Journal, events handled automatically
5. Agents default to innate tools (Read, Grep, Bash) which are familiar

### Agent 3: Tool Conflicts Audit (code-skeptic)

**CRITICAL: Task Status Schema Conflict**
- hivemind_task: `{pending, in_progress, blocked, invalidated, verifying, complete}`
- agent_work_create_contract: `{pending, active, delegated, verifying, complete}`
- "in_progress" ≠ "active". No translation layer exists.

**Conflict Matrix:**
| Tool A | Tool B | Overlap Type | Evidence |
|--------|--------|-------------|----------|
| task | create_contract | CONFLICTING | Incompatible status enums |
| task | trajectory | STATE-SHARED | Both read/write .hivemind/state/tasks.json |
| handoff | trajectory | FUNCTIONAL-OVERLAP | Handoff silently calls recordTrajectoryEvent on every action |
| handoff | create_contract | STATE-SHARED | Handoff reads/writes ContractStore via chain-executor |
| runtime_command | hm_init/hm_doctor | FUNCTIONAL-OVERLAP | Same operations, two entry points |
| runtime_status | hm_setting (dashboard) | FUNCTIONAL-OVERLAP | Both call buildRuntimeStatusSnapshot |

**Tool vs Innate Tool Value:**
| HiveMind Tool | Innate Replacement | Value |
|---------------|-------------------|-------|
| doc (skim/read/chunk) | Read | SUPERIOR — heading extraction, token estimation, outline parsing |
| doc (search) | Grep | EQUIVALENT — targeted Grep with .md filter |
| runtime_status | Bash (5+ commands) | SUPERIOR — aggregates 5+ data sources |
| journal (assistant_output, diagnostic) | Write | SUPERIOR — structured markdown rendering |
| journal (user_message, tool_call, compaction) | Write | INFERIOR — hooks already auto-write these |
| task | JSON Read/Write | MARGINAL — thin wrapper with sync I/O |
| trajectory | JSON Read/Write | MARGINAL — thin wrapper |
| hm_init | Bash existsSync | DEAD — placeholder |
| hm_doctor | Bash existsSync | DEAD — placeholder |

**Precondition Complexity:**
- hivemind_handoff: CUMBERSOME (5+ layers, hidden trajectory+contract+workflow writes per action)
- hivemind_runtime_command: CUMBERSOME (4+ layers, 21 args)
- hivemind_hm_setting (dashboard): CUMBERSOME (reads 4 subsystems)
- All others: SIMPLE to MODERATE

### Agent 4: Framework Coherence Audit (architect)

| Tool | Hierarchy | Relationship | Context | Mid-Run | Overall |
|------|-----------|-------------|---------|---------|---------|
| runtime_status | PASS | PASS | WARN | ALWAYS | GOOD |
| runtime_command | PASS | PASS | WARN | ALWAYS | GOOD |
| doc | WARN | PASS | FAIL | ALWAYS | BLOATED (no search limit) |
| task | FAIL | WARN | WARN | PHASE-LIMITED | BROKEN |
| trajectory | FAIL | PASS | WARN | PHASE-LIMITED | FRAGILE |
| handoff | FAIL | PASS | PASS | PHASE-LIMITED | FRAGILE |
| create_contract | FAIL | WARN | PASS | ALWAYS | BROKEN |
| export_contract | WARN | PASS | PASS | ALWAYS | ADEQUATE |
| journal | WARN | PASS | PASS | ALWAYS | ADEQUATE |
| hm_init | PASS | PASS | PASS | PHASE-LIMITED | PLACEHOLDER |
| hm_doctor | PASS | PASS | PASS | ALWAYS | PLACEHOLDER |
| hm_setting | WARN | PASS | PASS | ALWAYS | ADEQUATE |

**7 Cross-Cutting Findings:**
1. ZERO agent role validation across all 12 tools
2. Tool results NOT injected back into agent context (lost after compaction)
3. hivemind_doc search has NO result limit (can consume entire context window)
4. 4/5 write-side stores have NO file locking (concurrent agent corruption risk)
5. Contract-Task-Workflow chain is broken (no contractId on tasks, no workflowId required)
6. Task status schema incompatible between tools
7. AGENTS.md documents 7 tools; codebase has 12

### Agent 5: Granularity & Composability Audit (architect)

| Tool | Granularity | Score (1-10) | Key Issue |
|------|------------|-------------|-----------|
| runtime_status | JUST-RIGHT | 8 | Clean zero-arg probe |
| runtime_command | TOO-COARSE | 3 | **21 args** — 9 profile fields should auto-read from bindings |
| doc | JUST-RIGHT | 9 | Clean action routing |
| task | JUST-RIGHT | 9 | Good CRUD lifecycle |
| trajectory | BORDERLINE | 7 | 13 args at upper limit |
| handoff | BORDERLINE | 6 | 22 args but well-decomposed into 6 interfaces |
| journal | JUST-RIGHT | 8 | 4 args, good CQRS |
| create_contract | TOO-COARSE | 5 | Workflow task graph too complex for single-shot LLM |
| export_contract | JUST-RIGHT | 9 | Minimal, clean read-side |
| hm_init | JUST-RIGHT | 9 | Simple bootstrap |
| hm_doctor | JUST-RIGHT | 9 | Simple diagnostics |
| hm_setting | BORDERLINE | 6 | Dashboard mode = CQRS violation |

**Composability Strength:** ID chain (sessionId→trajectoryId→workflowId→taskId→handoffId) is well-designed
**Composability Gap:** workflowId is NOT produced by any tool — external authority only

### Agent 6: Superiority & Harm Audit (code-skeptic)

| Tool | Innate Replaceable | Context Strip | Harm (1-10) | Weight | Verdict |
|------|-------------------|---------------|-------------|--------|---------|
| doc | NO (150 LOC logic) | YES | 2 | USEFUL | KEEP |
| task | YES (JSON read/write) | NO | 4 | MARGINAL | REFACTOR |
| trajectory | YES (JSON read/write) | NO | 3 | MARGINAL | REFACTOR |
| handoff | NO (multi-file orchestration) | NO | 5 | USEFUL/HARMFUL | REFACTOR |
| journal | YES (file Write) | PARTIAL | 3 | MARGINAL | REPLACE-WITH-INNATE |
| runtime_status | NO (5-source aggregation) | PARTIAL | 2 | USEFUL | KEEP |
| runtime_command | NO (routing + param mapping) | NO | 4 | USEFUL/DEAD | KEEP (simplify) |
| hm_init | YES (4 existsSync) | YES | 6 | DEAD | REMOVE/IMPLEMENT |
| hm_doctor | YES (4 existsSync) | YES | 7 | DEAD | REMOVE/IMPLEMENT |
| hm_setting | PARTIAL (validation+dashboard) | PARTIAL | 3 | USEFUL | KEEP |
| create_contract | NO (Zod validation + store) | NO | 4 | MARGINAL | REFACTOR |
| export_contract | YES (JSON Read) | NO | 2 | MARGINAL | REPLACE-WITH-INNATE |

**5 Critical Harm Findings:**
1. hm_init + hm_doctor = DEAD PLACEHOLDERS (source says "placeholder, no writes")
2. Sync file I/O in async tool execution (task-lifecycle.ts uses readFileSync/writeFileSync)
3. Unexplained double-write (tasks.json written to state/ AND graph/ — no reader for graph/)
4. No-op functions "for API compatibility" (addEvent/addDiagnostic in consolidated-writer.ts)
5. PressureContract metadata in 135 locations — noise for LLM, not actionable

---

## TOOL INTERFACE SPECIFICATIONS (Complete)

### hivemind_task
- **Actions:** create | list | get | activate | rotate | verify | complete
- **Key Args:** workflowId, taskId, title, kind (task|subtask), parentTaskId, dependencyIds, verificationContractId, evidenceRefs
- **Disk Authority:** .hivemind/state/tasks.json, .hivemind/graph/tasks.json
- **Pressure Contracts:** create/activate/rotate/verify/complete → task-mutation; list/get → steady-state

### hivemind_trajectory
- **Actions:** inspect | traverse | attach | checkpoint | event | close
- **Key Args:** trajectoryId, workflowId, sessionId, lineage (hivefiver|hiveminder), purposeClass, taskIds, subtaskIds, summary, source, resumeTarget, kind, evidenceRefs
- **Disk Authority:** .hivemind/state/trajectory-ledger.json
- **Pressure Contracts:** inspect → steady-state; attach → trajectory-continuation; others → trajectory-control

### hivemind_handoff
- **Actions:** create | read | list | update | validate | close
- **Key Args:** 22 args including id, sourceSessionId, targetSessionId, sourceAgent, targetAgent, trajectoryId, workflowId, taskIds, subtaskIds, scope, constraints, memoryScope, successMetrics, requiredEvidence, summary, nextSteps, evidence, returnContract, evidenceContractId, returnGate, resumeTarget
- **Disk Authority:** .hivemind/handoffs/*.json
- **Hidden Side Effects:** Every action writes to trajectory ledger, contract store, AND workflow continuity

### hivemind_doc
- **Actions:** skim | skim_directory | read | chunk | search
- **Key Args:** filePath, dirPath, heading, maxTokens, query, globFilter
- **Disk Authority:** NONE (read-only)
- **Note:** read requires heading param; search requires dirPath param — agents frequently confuse these

### hivemind_runtime_status
- **Actions:** NONE (zero args, inspect-only)
- **Returns:** capabilityMatrix, runtimeState, kernelState, supervisorState, latestSessionContract, workflowGateState

### hivemind_runtime_command
- **Actions:** command execution
- **Key Args:** 21 args — command, arguments, userMessage, preferredUserName, language, artifactLanguage, governanceMode, automationLevel, expertLevel, outputStyle, presetId, requestedSettingsGroups, intakeEvidence (with sub-fields)

### hivemind_journal
- **Event Types:** assistant_output | user_message | tool_call | compaction | trajectory | diagnostic
- **Key Args:** sessionId, eventType, payload (actor/title/summary/details OR level/source/message), timestamp
- **Note:** 3 of 6 event types are auto-written by hooks (user_message, tool_call, compaction)

### hivemind_hm_init
- **Args:** mode (greenfield|brownfield|auto), force (boolean)
- **Status:** PLACEHOLDER — detects state, proposes changes, NEVER writes

### hivemind_hm_doctor
- **Args:** scope (all|skills|agents|config|paths), fix (boolean)
- **Status:** PLACEHOLDER — runs 4 existsSync checks, proposes findings, NEVER writes

### hivemind_hm_setting
- **Args:** group (language|expertise|governance|operation-mode|all), key, value, locale, renderMode (json|tui), dashboard (boolean)
- **Note:** Dashboard mode reads 4 subsystems. Has real validation logic.

### hivemind_agent_work_create_contract
- **Args:** action (create|update), contractId, sessionId, rawIntent, responseMode, workflow (with tasks array, chainActions, briefing, anchors)
- **Note:** Over-engineered across 4 files. Shadows task + trajectory tools.

### hivemind_agent_work_export_contract
- **Args:** contractId (required), format (contract|summary)
- **Note:** Simple read + optional compaction summary transformation.

---

## AGENT PERMISSION MATRIX (14 Agents × 12 Tools)

| Tool | hiveminder | hivefiver | hivemaker | hivexplorer | hiveq | hiveplanner | architect | code-skeptic | hitea | hivehealer | hiverd | general | explore | explore-small |
|------|-----------|-----------|-----------|-------------|-------|------------|-----------|-------------|-------|-----------|--------|---------|---------|--------------|
| task | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| trajectory | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| handoff | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| doc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| runtime_status | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| runtime_command | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| create_contract | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| export_contract | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| journal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| hm_init | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| hm_doctor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| hm_setting | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 7 RUNTIME LIFECYCLES (Where Tools Fit)

1. **Plugin Load** → Static Registry (13 tools registered, 11 hooks wired)
2. **Session Created** → Hook-Subscribed → Programmatic Writer (V3 session JSON, trajectory bootstrapped)
3. **Message Turn** → Hook → Writer + Runtime Injection (dual chain: chat.message + messages.transform)
4. **Tool Execution** → Agent-Deterministic Tool → Feature → Core/Disk → tool.execute.after writes journal
5. **Session Compacted** → Hook → Writer + Runtime Injection (recovery checkpoint, compaction prompt)
6. **Session Idle** → Hook → Store (trajectory event, session resolved)
7. **Session Deleted** → Hook → Writer (status changed, file preserved)

## 5 ACTOR TYPES

1. **Agent-Deterministic Tool** — Agent explicitly calls (trajectory, task, handoff, doc, etc.)
2. **Hook-Subscribed Handler** — OpenCode fires event, plugin intercepts (event-handler, chat-message, etc.)
3. **Programmatic Store/Writer** — Called by hooks/tools to read/write disk (consolidated-writer, task-lifecycle)
4. **Runtime Injection** — Injects context into agent's message stream (messages-transform, system-transform)
5. **Static Registry** — Composed once at plugin load, never changes (tool-registry, hook-registry)

## 7 USE CASE GROUPS

1. **Session Navigation** — trajectory, runtime_status ("Where am I?")
2. **Work Management** — task, create_contract, export_contract ("What work exists?")
3. **Delegation** — handoff ("Hand off work to another agent")
4. **Intelligence** — doc ("Understand the codebase/documents")
5. **Runtime Control** — runtime_command ("Execute system commands")
6. **Project Admin** — hm_init, hm_doctor, hm_setting ("Setup/diagnose/configure")
7. **Event Journaling** — journal ("Record an event")

## KNOWN BUGS

1. addEvent()/addDiagnostic() are no-op stubs (V3 migration broke event tracking)
2. readHandoffFile() returns null for both 'not found' and 'corrupted JSON'
3. Task status schema incompatible between task tool and contract tool
4. Sync file I/O in async tool execution (task-lifecycle.ts)
5. Double-write to state/ and graph/ with no documented reason
6. hivemind_doc read requires heading param — agents pass filePath instead
7. hivemind_doc search requires dirPath param — agents pass filePath instead
8. hivemind_doc search has no result limit — can consume entire context window
9. hm_init and hm_doctor are explicit placeholders ("no writes")
10. Handoff tool silently writes to trajectory + contracts + workflow on every action
11. Journal tool 50% redundant (hooks auto-write 3/6 event types)
12. PressureContract metadata in 135 locations — noise for LLM consumers
13. AGENTS.md documents 7 tools; codebase has 12
14. classify-intent-tool exists but is not registered in agentToolCatalog
