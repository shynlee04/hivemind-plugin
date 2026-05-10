# CP-ST-01: Session Tracker Revamp — Formal Specification

**Date:** 2026-05-11
**Status:** SPEC-LOCKED
**Supersedes:** `.hivemind/planning/cp-st-session-tracker-2026-05-10/SPEC.md` (draft baseline)
**Depends on:** WS-SR (COMPLETE), Flaw Register (`.hivemind/audit/flaw-register-2026-05-10.json`)
**Architecture refs:** `.planning/codebase/ARCHITECTURE.md`, Q1-Q6 decisions

---

## 1. Problem Statement

The current event tracker (`src/task-management/journal/event-tracker/`) produces broken, noisy output with 12 documented flaws (F1-F12). It cross-contaminates session files, never populates semantic fields, contains dead code (classifier, dual-persistence), never executed the Q6 migration, and is gated by a `commit_docs` toggle. The session tracker revamp replaces this with a clean, structured, hook-driven capture system that produces hierarchical, searchable, agent-reconsumable session knowledge files.

### Source Evidence
- Flaw register: `.hivemind/audit/flaw-register-2026-05-10.json` (12 flaws with file:line evidence)
- State audit: `.hivemind/audit/state-persistence-audit-2026-05-10.md`
- Reference export: `session-ses_1ed9.md` (7321 lines showing expected capture format)
- User spec: `.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md`

---

## 2. Scope

### In Scope
- New session tracker module under `src/features/session-tracker/` (owning typed module)
- Hook integration via existing `createCoreHooks()` observer pipeline
- File structure: `.hivemind/session-tracker/{main-session-id}/` with MD + JSON outputs
- Session continuity index: `.hivemind/session-tracker/session-continuity.json`
- Recovery/reconsumption via OpenCode SDK REST API (`client.session.*`)
- Up to 3 levels of delegation depth, up to 6 concurrent sessions
- Conservative cleanup of contaminated `.hivemind/event-tracker/` state files

### Out of Scope
- Sidecar dashboard integration (Q2, separate project)
- SSE-based real-time streaming (plugin receives events directly via hooks)
- Changes to delegation manager, concurrency queue, or completion detector
- Changes to `.opencode/` primitives
- Removal of old event-tracker module code (kept as safety net)

---

## 3. Architecture Decision: Hybrid Hooks + REST Recovery

### Data Collection Strategy

| Mechanism | Role | When Used |
|-----------|------|-----------|
| **Plugin hooks** (primary) | Real-time event capture | `event`, `chat.message`, `tool.execute.after` fire as events happen |
| **REST API** (recovery) | Reconsumption after disconnection | `client.session.get()`, `client.session.messages()`, `client.session.children()` |
| **SSE** (not used) | — | Plugin runs inside runtime; receives events directly, not via HTTP |

### Rationale
The harness plugin runs INSIDE the OpenCode runtime. It receives events directly through hooks, not through SSE (which is for external clients). Hooks provide zero-latency capture. REST API provides reconsumption when agents disconnect and need to rebuild context from persisted tracker files.

### Hook Mapping

| Hook | SDK Signature | Captures | Persistence Target |
|------|--------------|----------|-------------------|
| `event` | `hook("event", { eventType, sessionID, event })` | Session lifecycle: created, updated, idle, deleted, error, status, compacted | Main session .md frontmatter updates |
| `chat.message` | `hook("chat.message", { sessionID, agent?, model?, messageID?, variant? }) => { message, parts }` | User prompts (##USER), assistant metadata (agent name, model, duration), message parts | Main session .md content sections |
| `tool.execute.after` | `hook("tool.execute.after", { tool, sessionID, callID, args }) => { title, output, metadata }` | Tool metadata: skill names, read paths, task delegations, tool errors | Main session .md tool blocks + child session spawn |

---

## 4. Target Directory Structure

```
.hivemind/
├── session-tracker/                              # NEW root
│   ├── session-continuity.json                    # Index/manifest of all sessions
│   └── ses_1ed9df1adffe2hbJudz3sK60y3/           # One subdir per main session
│       ├── ses_1ed9df1adffe2hbJudz3sK60y3.md     # Primary knowledge capture (YAML + MD)
│       ├── ses_1ed9c5c20ffePWOXce5JQpS5Yk.json   # Child session (delegation level 1)
│       └── ses_1ed9bffbcffesN10Er8Pd91tW7.json   # Child session (delegation level 1)
├── state/
│   ├── session-continuity.json                    # EXISTING — harness delegation state
│   └── delegations.json                           # EXISTING — delegation records
└── event-tracker/                                 # LEGACY — kept as safety net, state files cleaned
```

**Key rule:** Subdirectories are created ONLY when a user starts a new main session (not before). Child session files are written under the parent's subdir.

---

## 5. File Format Specifications

### 5.1 Main Session File (`.md` with YAML frontmatter)

```yaml
---
session_id: "ses_1ed9df1adffe2hbJudz3sK60y3"
created: "2026-05-10T21:54:36Z"
updated: "2026-05-10T22:08:04Z"
parent_session_id: null                    # null for root sessions
delegation_depth: 0                        # 0 = root, 1 = child, 2 = grandchild
children:
  - session_id: "ses_1ed9c5c20ffePWOXce5JQpS5Yk"
    child_file: "ses_1ed9c5c20ffePWOXce5JQpS5Yk.json"
  - session_id: "ses_1ed9bffbcffesN10Er8Pd91tW7"
    child_file: "ses_1ed9bffbcffesN10Er8Pd91tW7.json"
status: "active"                           # active | idle | completed | error
---

## USER (turn 1)

Map source architecture for state modules (@hm-l2-architect subagent)...

## main_l0_agent

**name:** Hm-L0-Orchestrator
**model:** DeepSeek V4 Pro
**thinking_duration:** 19.7s

### Tool: skill

**Input:**
```json
{ "name": "hm-l2-coordinating-loop" }
```

**Output:** (pruned — first line only)
```
# Skill: hm-l2-coordinating-loop
```

### Tool: read

**Input:**
```json
{ "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json" }
```

**Error:** File not found

### Tool: read

**Input:**
```json
{ "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json" }
```

**Output:** (success — path only)
```
/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json
```

### Tool: task

**Input:**
```json
{ "description": "Investigate event tracker bugs", "subagent_type": "hm-l2-investigator" }
```

**Output:**
```
task_id: ses_1ed9c5c20ffePWOXce5JQpS5Yk
```

## USER (turn 2)

Continue if you have next steps...
```

### Capture Rules
| Element | Capture | Skip |
|---------|---------|------|
| User message (`##USER`) | Full text, turn counter | — |
| Assistant block | Transform to `main_l0_agent` with name, model, thinking_duration | Thinking blocks |
| Tool: skill | Input `{name}`, first line of output only | Full skill content |
| Tool: read | Input `{filePath}`, error if any | File content on success |
| Tool: task | Input `{description, subagent_type}`, output `task_id` | Full delegation prompt |
| Other tools | Input metadata only | Verbose output |

### 5.2 Child Session File (`.json`)

```json
{
  "session_id": "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
  "parent_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
  "delegation_depth": 1,
  "delegated_by": {
    "agent_name": "Hm-L0-Orchestrator",
    "tool": "task",
    "description": "Investigate event tracker bugs",
    "subagent_type": "hm-l2-investigator"
  },
  "created": "2026-05-10T21:56:44Z",
  "updated": "2026-05-10T22:04:47Z",
  "status": "completed",
  "main_agent": {
    "name": "Hm-L2-Investigator",
    "model": "DeepSeek V4 Pro"
  },
  "turns": [
    {
      "turn": 1,
      "actor": "main_l0_agent",
      "actor_transformed_from": "user",
      "content": "You are the subagent hm-l2-investigator...",
      "tools": [
        {
          "tool": "skill",
          "input": { "name": "hm-l3-detective" },
          "output_pruned": "# Skill: hm-l3-detective"
        },
        {
          "tool": "read",
          "input": { "filePath": "/path/to/file.ts" },
          "status": "success"
        }
      ]
    }
  ],
  "children": []
}
```

**Critical transformation:** In child sessions, the `##USER` block is NOT a human user — it's the parent agent delegating. The session tracker must recognize this (by checking `session.parentID` via SDK) and transform `##USER` into `main_l0_agent` with the parent's agent name and model.

### 5.3 Session Continuity Index (`session-continuity.json`)

```json
{
  "version": "2.0",
  "last_updated": "2026-05-10T22:08:04Z",
  "sessions": {
    "ses_1ed9df1adffe2hbJudz3sK60y3": {
      "path": "ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9df1adffe2hbJudz3sK60y3.md",
      "parent_session_id": null,
      "delegation_depth": 0,
      "status": "active",
      "created": "2026-05-10T21:54:36Z",
      "updated": "2026-05-10T22:08:04Z",
      "children": ["ses_1ed9c5c20ffePWOXce5JQpS5Yk", "ses_1ed9bffbcffesN10Er8Pd91tW7"],
      "child_files": {
        "ses_1ed9c5c20ffePWOXce5JQpS5Yk": "ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9c5c20ffePWOXce5JQpS5Yk.json",
        "ses_1edbffbcffesN10Er8Pd91tW7": "ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9bffbcffesN10Er8Pd91tW7.json"
      }
    },
    "ses_1ed9c5c20ffePWOXce5JQpS5Yk": {
      "path": "ses_1ed9df1adffe2hbJudz3sK60y3/ses_1ed9c5c20ffePWOXce5JQpS5Yk.json",
      "parent_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
      "delegation_depth": 1,
      "status": "completed",
      "children": []
    }
  }
}
```

---

## 6. SDK API Surface Used

### Real-Time Capture (Hooks)
| Hook | Input Shape | Output Shape | Used For |
|------|------------|--------------|----------|
| `event` | `{ eventType, sessionID, event }` | void | Session lifecycle tracking |
| `chat.message` | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message: UserMessage, parts: Part[] }` | User/assistant turn capture |
| `tool.execute.after` | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` | Tool metadata capture |

### Recovery/Reconsumption (REST)
| Method | Endpoint | Used For |
|--------|----------|----------|
| `client.session.list()` | GET `/session` | Find all active sessions on startup |
| `client.session.get({path:{id}})` | GET `/session/{id}` | Get session metadata including `parentID` |
| `client.session.children({path:{id}})` | GET `/session/{id}/children` | Discover child/delegation sessions |
| `client.session.messages({path:{id}})` | GET `/session/{id}/message` | Rebuild missed message content |
| `client.session.status()` | GET `/session/status` | Check status of all sessions |

### Key SDK Types
- `Session` — `{ id, parentID, title, time: { created, updated } }`
- `UserMessage` — `{ id, role: "user", agent, model }`
- `AssistantMessage` — `{ id, role: "assistant", modelID, providerID, cost, tokens, time }`
- `Part` — discriminated union: TextPart, ToolPart, StepStartPart, etc.
- `ToolPart` — `{ callID, tool, state: ToolState, metadata }`
- `SessionStatus` — `{ type: "idle" | "busy" | "retry" }`

---

## 7. Requirements

### REQ-ST-01: Session Directory Manifestation
**Source:** User spec line 18, "Move the location... under .hivemind/session-tracker/subdirs"
**Condition:** When a user starts a new root session (session with no `parentID`), the session tracker creates `.hivemind/session-tracker/{session-id}/` and the main `.md` file.
**Acceptance Criteria:**
- Given no subdir exists for a new root session, when `session.created` event fires with `parentID === undefined`, then directory `{session-id}/` and file `{session-id}.md` are created.
- Given a session is a child (has `parentID`), no new subdir is created; the child `.json` file is written under the parent's subdir.
- Given no session has started, the `session-tracker/` directory contains only `session-continuity.json`.
**Verification:** Unit test + integration test with mock session events.
**Integration Notes:** Triggers on `event` hook with `session.created`. Must check `parentID` via `client.session.get()` to distinguish root vs child.

---

### REQ-ST-02: User Message Capture
**Source:** User spec line 36, "Capturing and append writer to ##USER"
**Condition:** Each user message in a session is captured as a numbered turn with full text content.
**Acceptance Criteria:**
- Given a `chat.message` hook fires with role "user", when the session tracker processes it, then `## USER (turn N)` section is appended to the main session `.md` with the full message text.
- Given the same session receives multiple user messages, the turn counter increments sequentially.
**Verification:** Unit test verifying MD output contains correct turn numbering and text.

---

### REQ-ST-03: Agent Metadata Transform
**Source:** User spec line 38, "transform these into internal managed field as main_l0_agent"
**Condition:** Assistant response metadata is transformed into structured `main_l0_agent` fields.
**Acceptance Criteria:**
- Given a `chat.message` hook fires with role "assistant" and metadata `{ agent: "Hm-L0-Orchestrator", model: { providerID: "...", modelID: "DeepSeek V4 Pro" } }`, when processed, the output contains `main_l0_agent` section with `name`, `model`, and `thinking_duration`.
- Given a thinking block is present in the response, it is NOT captured.
**Verification:** Unit test verifying transform produces correct structured fields.

---

### REQ-ST-04: Tool Capture — Skill
**Source:** User spec line 42, "Tool: skill — as the example from line 58th to 70th"
**Condition:** Skill tool invocations are captured with only the skill name (input) and first header line of output.
**Acceptance Criteria:**
- Given `tool.execute.after` fires with `tool === "skill"`, when processed, the output captures `{ name: "skill-name" }` input and first `#` header line of output only.
- Given the skill output is 500+ lines, only the first header line is captured.
**Verification:** Unit test verifying pruned output length ≤ 1 header line.

---

### REQ-ST-05: Tool Capture — Read
**Source:** User spec line 59, "Tool: read — I do not capture the output but only the path of file"
**Condition:** Read tool invocations are captured with only the file path and success/error status.
**Acceptance Criteria:**
- Given `tool.execute.after` fires with `tool === "read"`, when processed, the output captures `{ filePath: "..." }` input only.
- Given the read returned an error, the error message is captured.
- Given the read succeeded, the file content is NOT captured — only the path.
**Verification:** Unit test verifying no file content appears in output.

---

### REQ-ST-06: Tool Capture — Task (Delegation)
**Source:** User spec line 94, "Tool: task — this is the one that will help with organization of session-continuity"
**Condition:** Task tool invocations (delegations) are captured with description, subagent type, and resulting child session ID. This triggers child session file creation.
**Acceptance Criteria:**
- Given `tool.execute.after` fires with `tool === "task"`, when processed, captures `{ description, subagent_type }` from input and `task_id` from output.
- Given the `task_id` is a new session ID, a `{child-session-id}.json` file is created under the parent's subdir.
- Given the `task_id` exists, the session-continuity.json index is updated with the parent→child relationship.
**Verification:** Integration test verifying child .json creation and index update.

---

### REQ-ST-07: Child Session Recognition and Transformation
**Source:** User spec line 114, "have you noticed this one although it belongs to the main session... when forming the session under OpenCode SDK it looks like it was the main session"
**Condition:** Child sessions (created via `task` tool) appear as separate sessions in the SDK but must be recognized as delegation children. The `##USER` block in child sessions must be transformed to `main_l0_agent`.
**Acceptance Criteria:**
- Given a `session.created` event fires, when `client.session.get()` returns `parentID !== null`, the session is recognized as a child.
- Given a child session's first message has role "user", it is transformed to `main_l0_agent` with the parent agent's name and model (from delegation metadata, not from the child's own metadata).
- Given up to 3 levels of delegation, grandchild sessions are correctly nested under the root session's subdir.
**Verification:** Integration test with 3-level delegation simulation.

---

### REQ-ST-08: Session Continuity Index
**Source:** User spec line 34, "the session-continuity.json — like the index and manifestation"
**Condition:** A JSON index file at `.hivemind/session-tracker/session-continuity.json` maintains the complete session hierarchy with jump links.
**Acceptance Criteria:**
- Given any session file is created or updated, the index is updated atomically.
- Given the index is read by a recovery workflow, all session relationships are navigable without scanning the filesystem.
- Given concurrent sessions, the index update is serialized (no corruption).
**Verification:** Unit test verifying index integrity after 6 concurrent session simulations.

---

### REQ-ST-09: Concurrent Session Isolation
**Source:** User message: "expected to have up to 6 concurrent running of parent and children sessions"
**Condition:** Up to 6 sessions may write concurrently. Each session's writes must be isolated.
**Acceptance Criteria:**
- Given 6 sessions writing simultaneously, no file corruption or cross-contamination occurs.
- Given a parent and child session write in the same tick, the child file and parent file are updated independently.
- Given the session-continuity.json index is updated by multiple sessions, a write lock or atomic append prevents data loss.
**Verification:** Concurrency test with 6 parallel write simulations.

---

### REQ-ST-10: Disconnection Recovery
**Source:** User message: "agents only need to reconsume these as they get disconnected from the sessions"
**Condition:** When an agent disconnects and reconnects, it can rebuild context from the persisted tracker files plus SDK REST API calls.
**Acceptance Criteria:**
- Given an agent reconnects, when it reads its session's `.md` or `.json` file, it can reconstruct the conversation history (user turns, agent actions, tool calls, delegation results).
- Given the tracker file is incomplete (mid-write crash), the file remains parseable (no truncated JSON/MD).
- Given messages were missed during disconnection, `client.session.messages()` can fill the gap.
**Verification:** Recovery test simulating disconnection and reconsumption.

---

### REQ-ST-11: Hook-to-Persistence Architecture Compliance
**Source:** `.hivemind/AGENTS.md` section 2, ARCHITECTURE.md:339-353
**Condition:** Hooks must NOT directly write to `.hivemind/`. Hook effects must route through the typed owning module `src/features/session-tracker/`.
**Acceptance Criteria:**
- Given the `event` hook fires, it calls the session tracker module's method (e.g., `sessionTracker.handleSessionEvent()`), NOT `fs.writeFileSync()` directly.
- Given the session tracker module writes files, it owns the persistence logic and error handling.
- Given a write fails, the hook returns gracefully (best-effort, does not block the OpenCode runtime).
**Verification:** Code review verifying no direct filesystem writes in hook callbacks.

---

### REQ-ST-12: Schema Consistency
**Source:** User spec line 12, "my naming of schema fields are inconsistent and messy please revise"
**Condition:** All field names follow consistent camelCase convention with meaningful prefixes.
**Acceptance Criteria:**
- Given the session tracker writes JSON/MD output, all field names use camelCase.
- Given the schema defines actor types, they use consistent naming: `main_l0_agent`, not mixed `mainAgent`/`main_l0_agent`/`orchestrator`.
- Given SDK type field names (snake_case in some places), they are transformed to camelCase on write.
**Verification:** Lint check on all output schemas.

---

### REQ-ST-13: Legacy Cleanup
**Source:** Flaw register F8, F12 — test data contamination in state files
**Condition:** The 6 contaminated state files in `.hivemind/event-tracker/` are removed. Old module code remains as safety net.
**Acceptance Criteria:**
- Given the session tracker module initializes, it removes stale `.hivemind/event-tracker/*.json` and `.hivemind/event-tracker/*.md` files.
- Given the old event-tracker module code exists, it is NOT deleted (safety net).
- Given the new session tracker starts writing to `.hivemind/session-tracker/`, the old `.hivemind/event-tracker/` directory receives no new files.
**Verification:** Cleanup test verifying state file removal and module code preservation.

---

## 8. Acceptance Test Matrix

| REQ ID | Source | Positive | Negative | Boundary | Integration | Verification |
|--------|--------|----------|----------|----------|-------------|-------------|
| REQ-ST-01 | User spec line 18 | Root session creates subdir + .md | Child session creates no subdir | Session with null parentID vs empty string parentID | Hook event triggers file creation | `ls .hivemind/session-tracker/{id}/` |
| REQ-ST-02 | User spec line 36 | User message captured with turn counter | No user message → no turn entry | Empty user message | Multiple rapid messages | `grep "## USER (turn" file.md` |
| REQ-ST-03 | User spec line 38 | Agent metadata transformed correctly | Missing model → null field | Model with special chars | Multiple agents in same session | JQ check on output |
| REQ-ST-04 | User spec line 42 | Skill name + 1 header captured | Skill with no output header | Skill output with no `#` lines | 5 skills in sequence | `grep -c "Tool: skill" file.md` |
| REQ-ST-05 | User spec line 59 | Read path captured, no content | Read error captured | Read of binary file | 20 reads in sequence | No file content in output |
| REQ-ST-06 | User spec line 94 | Task delegation spawns child .json | Task with no session ID output | Task delegation to same session | 3-level delegation chain | Child file exists + index updated |
| REQ-ST-07 | User spec line 114 | Child ##USER → main_l0_agent | Root ##USER stays as ##USER | Session with parentID but no parent data | SDK parentID check | Transform verified in .json |
| REQ-ST-08 | User spec line 34 | Index updated on every write | Index survives crash mid-update | 100 sessions in index | Concurrent index writes | JSON.parse(session-continuity.json) |
| REQ-ST-09 | User requirement | 6 concurrent sessions, no corruption | Write conflict detected | 6 sessions same parent | Parent-child concurrent writes | File integrity check |
| REQ-ST-10 | User requirement | Reconsumption from .md/.json files | Incomplete file parses | Missing child file | SDK + file hybrid recovery | Agent rebuilds context |
| REQ-ST-11 | ARCHITECTURE.md:339 | Hook routes through module | Direct write attempted → blocked | Module throws during write | Hook chain continues on failure | Code review + test |
| REQ-ST-12 | User spec line 12 | All fields camelCase | Mixed case input → camelCase output | SDK snake_case fields | All output files validated | Lint check |
| REQ-ST-13 | F8, F12 | Old state files removed | Old module code preserved | Missing event-tracker dir | New writes go to session-tracker/ | File existence check |

---

## 9. Module Placement

```
src/features/session-tracker/
├── index.ts                    # Public API: SessionTracker class
├── capture/
│   ├── event-capture.ts        # Session lifecycle event handler
│   ├── message-capture.ts      # User/assistant message capture + transform
│   └── tool-capture.ts         # Tool metadata capture (skill, read, task, other)
├── persistence/
│   ├── session-writer.ts       # MD + YAML frontmatter writer
│   ├── child-writer.ts         # JSON child session writer
│   └── index-writer.ts         # session-continuity.json index writer
├── transform/
│   ├── agent-transform.ts      # ##USER → main_l0_agent for child sessions
│   └── schema-normalizer.ts    # camelCase normalization
└── recovery/
    └── session-recovery.ts     # REST API reconsumption after disconnection
```

**Dependency direction:** `src/hooks/` → `src/features/session-tracker/` → `fs.writeFileSync(.hivemind/session-tracker/)`

---

## 10. Flaw Coverage

| Flaw | Description | Resolved By |
|------|-------------|-------------|
| F1 | Cross-contamination between sessions | REQ-ST-01: One subdir per root session |
| F2 | Cross-contamination between sessions | REQ-ST-09: Concurrent session isolation |
| F3 | Semantic fields never populated | REQ-ST-03, ST-04, ST-05, ST-06: Structured capture |
| F4 | Semantic fields never populated | REQ-ST-08: Index with all relationships |
| F5 | Dead code: classifier.ts | Out of scope (kept as safety net) |
| F6 | Dead code: delegation-evidence.ts | Out of scope (kept as safety net) |
| F7 | Q6 migration never executed | REQ-ST-01: Writes to `.hivemind/session-tracker/` (Q6 root) |
| F8 | Test data in state files | REQ-ST-13: Cleanup |
| F9 | — | (Does not apply to new module) |
| F10 | Semantic fields never populated | REQ-ST-06: Delegation capture |
| F11 | Persistence gated by toggle | REQ-ST-11: Always-on hook routing |
| F12 | Test data in state files | REQ-ST-13: Cleanup |
