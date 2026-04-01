# HiveMind Custom Tools — Comprehensive Stress Test Plan

**Goal:** Design and implement exhaustive test coverage for all 7 HiveMind custom tools, including individual tool tests, cross-tool integration, agent workflow simulations, full-cycle end-to-end journeys, stress/load tests, and deterministic trigger verification.

**Created:** 2026-04-01
**Estimated Total Test Count:** ~280–320 tests across 12 test files
**Estimated Delegations:** 4–6 (split by test file group)

---

## 1. Test File Structure

| # | File Path | Category | Est. Tests |
|---|-----------|----------|------------|
| 1 | `tests/tools/runtime/runtime-status.test.ts` | Individual — runtime_status | 18 |
| 2 | `tests/tools/runtime/runtime-command.test.ts` | Individual — runtime_command | 25 |
| 3 | `tests/tools/doc/doc-tool.test.ts` | Individual — hivemind_doc | 28 |
| 4 | `tests/tools/task/task-tool.test.ts` | Individual — hivemind_task | 35 |
| 5 | `tests/tools/trajectory/trajectory-tool.test.ts` | Individual — hivemind_trajectory | 35 |
| 6 | `tests/tools/handoff/handoff-tool.test.ts` | Individual — hivemind_handoff | 30 |
| 7 | `tests/tools/journal/journal-tool-stress.test.ts` | Individual — hivemind_journal (stress) | 25 |
| 8 | `tests/tools/cross-tool-integration.test.ts` | Cross-tool integration | 20 |
| 9 | `tests/tools/agent-workflow-simulations.test.ts` | Agent workflow simulations | 30 |
| 10 | `tests/tools/full-cycle-journeys.test.ts` | Full cycle end-to-end | 25 |
| 11 | `tests/tools/stress-load-tests.test.ts` | Stress/load tests | 15 |
| 12 | `tests/tools/deterministic-triggers.test.ts` | Deterministic trigger tests | 15 |

**Total:** ~301 tests

---

## 2. Mock Strategy

### What to Mock

| Component | Mock Strategy | Rationale |
|-----------|--------------|-----------|
| `context.ask()` | No-op function that never throws | Tools should not require interactive permission during tests |
| `context.metadata()` | Spy function to verify metadata calls | Verify tools emit metadata correctly |
| `context.tui.showToast` | No-op async function | UI side-effects irrelevant to tool logic |
| `context.abort` | `new AbortController().signal` | Standard abort signal, never triggered |
| `context.directory` | `tmpdir()`-based temp directory | Isolated filesystem per test |
| `context.worktree` | Same as `context.directory` | Consistent test environment |
| `context.sessionID` | Fixed string `ses_test_123` | Deterministic identity |
| `context.agent` | Fixed string `test-agent` | Deterministic agent identity |
| `context.messageID` | Fixed string `msg_test_123` | Deterministic message identity |
| `client.*` APIs | No-op stubs via `createPluginInput()` | Plugin client APIs not exercised in unit tests |

### What to Use Real

| Component | Reason |
|-----------|--------|
| Tool definitions (`createHivemind*Tool()`) | Must test actual tool behavior |
| Feature handlers (`executeHivemind*Action()`) | Tool logic lives here |
| File system (via temp dirs) | Tools write to `.hivemind/` — must verify real I/O |
| Trajectory ledger | Core state authority — must be real |
| Contract store | Persistence layer — must be real |
| Runtime attachment settings | Bootstrap state — must be real |
| Schema validation (`tool.schema`) | Zod validation must run |
| `HIVEMIND_MANAGED_TOOLS` set | Authority surface for trigger tests |
| Plugin assembly (`HiveMindPlugin()`) | Integration tests need real wiring |

### Test Utilities to Create

| Utility | Location | Purpose |
|---------|----------|---------|
| `createMockContext(root)` | `tests/tools/test-helpers.ts` | Standard mock ToolContext factory |
| `bootstrapReadyRuntime(root)` | `tests/tools/test-helpers.ts` | Bootstrap runtime attachment + trajectory + kernel |
| `createPluginInput(directory)` | `tests/tools/test-helpers.ts` | Standard plugin input factory (reuse from existing tests) |
| `executeTool(tool, args, context)` | `tests/tools/test-helpers.ts` | Helper to execute tool and parse JSON result |
| `expectToolSuccess(result)` | `tests/tools/test-helpers.ts` | Assert tool returned success shape |
| `expectToolError(result)` | `tests/tools/test-helpers.ts` | Assert tool returned error shape |
| `createTempProject()` | `tests/tools/test-helpers.ts` | Create temp dir + bootstrap runtime in one call |
| `waitForFile(path, timeout)` | `tests/tools/test-helpers.ts` | Poll for file existence (stress tests) |
| `generateLargeString(bytes)` | `tests/tools/test-helpers.ts` | Generate payload of specific size |
| `createNestedTaskTree(root, depth)` | `tests/tools/test-helpers.ts` | Create deep task hierarchies |

---

## 3. Individual Tool Tests

### 3.1 hivemind_runtime_status (18 tests)

**File:** `tests/tools/runtime/runtime-status.test.ts`

#### Happy Path (6 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `returns success with empty args on bootstrapped runtime` | Tool executes with `{}` args, returns valid JSON with runtime identity |
| 2 | `exposes workflowGateState with command capabilities` | `workflowGateState.commandCapabilities` contains all hm-* commands |
| 3 | `exposes capabilityMatrix with chain actions` | `capabilityMatrix.chainActions.support` includes handoff-packet, export-messages, etc. |
| 4 | `exposes latestSessionContract when contracts exist` | Returns most recent contract by `updatedAt` timestamp |
| 5 | `exposes trajectory state when attached` | Returns active trajectory ID, workflow ID, session ID |
| 6 | `exposes availableCommands list` | `workflowGateState.availableCommands` is non-empty array |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 7 | `returns graceful state when no runtime attachment exists` | Tool doesn't crash; returns minimal payload without attachment data |
| 8 | `returns graceful state when no trajectory is attached` | Tool handles missing trajectory ledger gracefully |
| 9 | `returns graceful state when no contracts exist` | `latestSessionContract` is null/empty, not an error |
| 10 | `handles empty sessionID in context` | Tool uses context.sessionID even if empty string |
| 11 | `handles unknown agent name in context` | Tool works with any agent string, not just known agents |

#### Boundary Conditions (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 12 | `handles runtime with 50+ tasks in workflow` | Status returns correctly when workflow has many tasks |
| 13 | `handles runtime with multiple trajectories` | Returns correct active trajectory, not stale ones |
| 14 | `handles runtime with 10+ persisted contracts` | Returns latest contract correctly among many |

#### Error Handling (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 15 | `does not call context.ask() during execution` | Verify ask() is never invoked (no permission needed) |
| 16 | `returns valid JSON even when runtime is partially initialized` | Partial bootstrap (attachment but no kernel) returns parseable JSON |
| 17 | `handles corrupted trajectory ledger file` | Graceful degradation when ledger JSON is malformed |
| 18 | `handles missing .hivemind directory entirely` | Tool returns error shape, not unhandled exception |

---

### 3.2 hivemind_runtime_command (25 tests)

**File:** `tests/tools/runtime/runtime-command.test.ts`

#### Happy Path (8 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `hm-init returns identity and readiness for attached authority` | Returns `closeoutStatus: 'ready'`, `runtime_identity`, `readiness_signal` |
| 2 | `hm-doctor returns diagnostic report` | Returns structured diagnostic findings |
| 3 | `hm-settings returns current settings groups` | Returns settings dashboard data |
| 4 | `hm-init with presetId 'guided-onboarding' returns onboarding flow` | Preset triggers correct flow |
| 5 | `hm-init with requestedSettingsGroups returns targeted groups` | Settings groups filter works |
| 6 | `hm-init with intakeEvidence records evidence` | Evidence from intake is persisted |
| 7 | `hm-init with language parameter sets language preference` | Language preference is stored |
| 8 | `hm-init with governanceMode sets governance level` | Governance mode is applied |

#### Edge Cases (7 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 9 | `empty command string returns error` | `command: ''` returns error shape |
| 10 | `unknown command returns error with available commands` | `command: 'hm-unknown'` returns error listing valid commands |
| 11 | `command with only whitespace returns error` | `command: '   '` returns error |
| 12 | `command without required runtime attachment returns error` | No attachment → command fails gracefully |
| 13 | `arguments as empty string is accepted` | `arguments: ''` doesn't break execution |
| 14 | `userMessage as empty string is accepted` | `userMessage: ''` doesn't break execution |
| 15 | `all optional args provided simultaneously` | Tool handles max arg count without error |

#### Boundary Conditions (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 16 | `userMessage with 10KB string is accepted` | Large userMessage doesn't break tool |
| 17 | `arguments with 5KB string is accepted` | Large arguments string handled |
| 18 | `intakeEvidence with all enum values populated` | All optional fields in intakeEvidence work together |
| 19 | `rapid sequential hm-init calls (10x)` | Idempotent behavior — no corruption |

#### Error Handling (6 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 20 | `invalid presetId returns validation error` | `presetId: 'invalid'` fails Zod validation |
| 21 | `invalid enum in requestedSettingsGroups returns error` | Bad enum value caught by schema |
| 22 | `intakeEvidence missing required fields returns error` | Missing `source`, `questionnaireId`, etc. caught |
| 23 | `intakeEvidence with invalid source enum returns error` | `source: 'invalid'` caught by Zod |
| 24 | `command execution with corrupted runtime state` | Corrupted `.hivemind/` files handled gracefully |
| 25 | `command execution when kernel is not ready` | Returns error indicating kernel not ready |

---

### 3.3 hivemind_doc (28 tests)

**File:** `tests/tools/doc/doc-tool.test.ts`

#### Happy Path — skim (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `skim returns file outline for existing markdown file` | Returns headings, structure |
| 2 | `skim returns empty result for empty file` | Empty file → empty outline |
| 3 | `skim with heading filter returns specific section` | `heading` param narrows to section |
| 4 | `skim with non-existent heading returns partial result` | Missing heading → best match or empty |

#### Happy Path — skim_directory (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 5 | `skim_directory lists all markdown files in directory` | Returns file list with paths |
| 6 | `skim_directory with globFilter returns filtered results` | `globFilter: '.md'` filters correctly |
| 7 | `skim_directory on empty directory returns empty list` | No files → empty array |

#### Happy Path — read (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 8 | `read returns full content of existing file` | File content matches |
| 9 | `read with heading returns only that section` | Section extraction works |
| 10 | `read with maxTokens limits content size` | Content truncated at token limit |
| 11 | `read with heading + maxTokens combines both` | Section + limit work together |

#### Happy Path — chunk (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 12 | `chunk splits file into manageable pieces` | Returns array of chunks |
| 13 | `chunk with maxTokens respects size limit` | Each chunk ≤ maxTokens |
| 14 | `chunk on small file returns single chunk` | File smaller than maxTokens → 1 chunk |

#### Happy Path — search (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 15 | `search finds matching content in directory` | Returns files containing query |
| 16 | `search with globFilter limits search scope` | Only searches matching files |
| 17 | `search with no matches returns empty result` | No matches → empty array |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 18 | `action 'skim' without filePath returns error` | Required arg missing |
| 19 | `action 'read' without filePath returns error` | Required arg missing |
| 20 | `action 'skim_directory' without dirPath returns error` | Required arg missing |
| 21 | `action 'search' without dirPath returns error` | Required arg missing |
| 22 | `invalid action enum value returns error` | `action: 'delete'` caught by Zod |

#### Boundary Conditions (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 23 | `read file with 100KB content` | Large file handled without crash |
| 24 | `chunk with maxTokens=1 produces many tiny chunks` | Minimum token limit works |
| 25 | `search across 50+ files in directory` | Large directory search works |

#### Error Handling (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 26 | `read non-existent file path returns error` | File not found → error shape |
| 27 | `skim non-existent file path returns error` | File not found → error shape |
| 28 | `read file outside project root returns error` | Path traversal blocked |

---

### 3.4 hivemind_task (35 tests)

**File:** `tests/tools/task/task-tool.test.ts`

#### Happy Path — create (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `create task with minimal args (workflowId, title)` | Task created, returns success with taskId |
| 2 | `create task with all optional args` | kind, parentTaskId, dependencyIds all applied |
| 3 | `create subtask with kind='subtask'` | Subtask created with parent linkage |
| 4 | `create task with multiple dependencies` | dependencyIds comma-separated parsed correctly |
| 5 | `create multiple tasks in same workflow` | Tasks coexist, no collision |

#### Happy Path — list (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 6 | `list tasks for existing workflowId` | Returns all tasks for workflow |
| 7 | `list tasks for workflow with no tasks` | Returns empty array |
| 8 | `list tasks without workflowId returns error` | Required arg missing |

#### Happy Path — get (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 9 | `get existing task by taskId` | Returns task details |
| 10 | `get task with workflowId filter` | Returns task only if in workflow |
| 11 | `get without taskId returns error` | Required arg missing |

#### Happy Path — activate (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 12 | `activate pending task changes status to active` | Status mutation verified |
| 13 | `activate already-active task is idempotent` | No error, stays active |
| 14 | `activate non-existent task returns error` | Task not found → error |

#### Happy Path — rotate (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 15 | `rotate active task to next pending task` | Current task completed, next activated |
| 16 | `rotate with no pending tasks returns error` | No next task → error |
| 17 | `rotate with dependency chain respects order` | Dependencies completed before rotation |

#### Happy Path — verify (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 18 | `verify task with verificationContractId` | Verification recorded |
| 19 | `verify without verificationContractId returns error` | Required arg for verify action |
| 20 | `verify non-existent task returns error` | Task not found |

#### Happy Path — complete (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 21 | `complete task with evidenceRefs` | Task marked complete, evidence stored |
| 22 | `complete task without evidenceRefs` | Completion allowed without evidence |
| 23 | `complete already-completed task is idempotent` | No error on double-complete |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 24 | `create task without workflowId returns error` | Required arg missing |
| 25 | `create task without title returns error` | Required arg missing |
| 26 | `invalid action enum returns error` | `action: 'destroy'` caught by Zod |
| 27 | `create task with empty title string` | Empty string accepted or rejected consistently |
| 28 | `create task with very long title (500 chars)` | Long title handled |

#### Boundary Conditions (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 29 | `create 100 tasks in single workflow` | Bulk task creation works |
| 30 | `create task with 20 dependencies` | Many dependencies parsed correctly |
| 31 | `create 5-level deep subtask hierarchy` | Deep nesting works |
| 32 | `list tasks across 10 workflows simultaneously` | Multi-workflow listing correct |

#### Error Handling (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 33 | `get task with non-existent taskId returns error` | Not found → error |
| 34 | `activate task in different workflow returns error` | Cross-workflow activation blocked |
| 35 | `complete task with circular dependency returns error` | Circular deps detected |

---

### 3.5 hivemind_trajectory (35 tests)

**File:** `tests/tools/trajectory/trajectory-tool.test.ts`

#### Happy Path — attach (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `attach trajectory with minimal args` | Trajectory created with workflowId, sessionId |
| 2 | `attach trajectory with lineage and purposeClass` | Lineage='hivefiver', purposeClass='planning' applied |
| 3 | `attach trajectory with taskIds` | Tasks bound to trajectory |
| 4 | `attach trajectory with subtaskIds` | Subtasks bound to trajectory |
| 5 | `attach trajectory with all optional args` | All fields populated correctly |

#### Happy Path — inspect (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 6 | `inspect existing trajectory returns full state` | Returns trajectory, events, checkpoints |
| 7 | `inspect trajectory with workflowId filter` | Returns trajectory for specific workflow |
| 8 | `inspect without trajectoryId returns all trajectories` | Lists all active trajectories |
| 9 | `inspect non-existent trajectory returns empty` | No crash, empty result |

#### Happy Path — traverse (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 10 | `traverse to existing trajectory` | Traversal recorded |
| 11 | `traverse with resumeTarget sets resume flow` | Resume target stored |
| 12 | `traverse non-existent trajectory returns error` | Not found → error |

#### Happy Path — checkpoint (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 13 | `create checkpoint with summary` | Checkpoint created with summary |
| 14 | `create checkpoint with source label` | Source label stored |
| 15 | `create checkpoint with resumeTarget` | Resume target stored in checkpoint |

#### Happy Path — event (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 16 | `record event with kind='summary'` | Event recorded with summary kind |
| 17 | `record event with kind='handoff'` | Handoff event recorded |
| 18 | `record event with kind='evidence'` | Evidence event recorded |
| 19 | `record event with kind='transition'` | Transition event recorded |
| 20 | `record event with kind='note'` | Note event recorded |

#### Happy Path — close (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 21 | `close trajectory with summary` | Trajectory marked closed |
| 22 | `close trajectory with evidenceRefs` | Evidence attached on close |
| 23 | `close already-closed trajectory is idempotent` | No error on double-close |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 24 | `attach without workflowId returns error` | Required arg missing |
| 25 | `attach without sessionId returns error` | Required arg missing |
| 26 | `invalid action enum returns error` | `action: 'destroy'` caught by Zod |
| 27 | `invalid lineage enum returns error` | `lineage: 'unknown'` caught by Zod |
| 28 | `invalid purposeClass enum returns error` | `purposeClass: 'unknown'` caught by Zod |

#### Boundary Conditions (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 29 | `record 100 events on single trajectory` | Many events handled |
| 30 | `attach trajectory with 50 taskIds` | Many taskIds parsed |
| 31 | `event with 5KB summary text` | Large event content handled |
| 32 | `5 concurrent trajectories on same workflow` | Concurrent trajectories work |

#### Error Handling (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 33 | `event on non-existent trajectory returns error` | Trajectory not found |
| 34 | `checkpoint on closed trajectory returns error` | Closed trajectory rejects mutations |
| 35 | `attach with invalid kind enum returns error` | `kind: 'unknown'` caught by Zod |

---

### 3.6 hivemind_handoff (30 tests)

**File:** `tests/tools/handoff/handoff-tool.test.ts`

#### Happy Path — create (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `create handoff with minimal args` | Handoff created with source/target session |
| 2 | `create handoff with scope and constraints` | Scope and constraints stored |
| 3 | `create handoff with successMetrics` | Success metrics stored |
| 4 | `create handoff with requiredEvidence` | Evidence requirements stored |
| 5 | `create handoff with returnContract and resumeTarget` | Return contract and resume target stored |

#### Happy Path — read (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 6 | `read existing handoff by id` | Returns full handoff details |
| 7 | `read handoff with evidence attached` | Evidence records returned |
| 8 | `read non-existent handoff returns error` | Not found → error |

#### Happy Path — list (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 9 | `list all handoffs for workflow` | Returns handoffs for workflow |
| 10 | `list handoffs for workflow with none` | Returns empty array |
| 11 | `list handoffs filtered by targetAgent` | Agent filter works |

#### Happy Path — update (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 12 | `update handoff summary` | Summary updated |
| 13 | `update handoff nextSteps` | Next steps updated |
| 14 | `update handoff evidence` | Evidence records updated |

#### Happy Path — validate (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 15 | `validate complete handoff passes` | All required fields present → valid |
| 16 | `validate handoff missing requiredEvidence fails` | Missing evidence → invalid |
| 17 | `validate handoff with returnGate unsatisfied fails` | Gate not met → invalid |

#### Happy Path — close (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 18 | `close handoff with summary` | Handoff marked closed |
| 19 | `close handoff with evidence` | Evidence attached on close |
| 20 | `close already-closed handoff is idempotent` | No error on double-close |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 21 | `create handoff without sourceSessionId returns error` | Required arg missing |
| 22 | `create handoff without targetSessionId returns error` | Required arg missing |
| 23 | `invalid action enum returns error` | `action: 'destroy'` caught by Zod |
| 24 | `read without id returns error` | Required arg missing |
| 25 | `update non-existent handoff returns error` | Not found → error |

#### Boundary Conditions (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 26 | `create handoff with 10KB scope text` | Large scope handled |
| 27 | `create handoff with 20 constraints` | Many constraints parsed |
| 28 | `list 50 handoffs for single workflow` | Large list handled |
| 29 | `create handoff with all 20 optional args` | Max arg count works |

#### Error Handling (1 test)
| # | Test Name | Validates |
|---|-----------|-----------|
| 30 | `validate handoff with corrupted data returns error` | Malformed handoff data handled |

---

### 3.7 hivemind_journal — Stress (25 tests)

**File:** `tests/tools/journal/journal-tool-stress.test.ts`

#### Happy Path — All Event Types (6 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `write assistant_output event` | Event appended to journey-events markdown |
| 2 | `write user_message event` | Event appended correctly |
| 3 | `write tool_call event` | Event appended correctly |
| 4 | `write compaction event` | Event appended correctly |
| 5 | `write trajectory event` | Event appended correctly |
| 6 | `write diagnostic event to Diagnostics section` | Diagnostic goes to correct section |

#### Edge Cases (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 7 | `write event with empty sessionId returns error` | Required arg missing |
| 8 | `write event with empty timestamp returns error` | Required arg missing |
| 9 | `write event with invalid eventType returns error` | `eventType: 'unknown'` caught by Zod |
| 10 | `write event with empty payload object` | Empty payload accepted |
| 11 | `write event with partial payload (only summary)` | Partial payload accepted |

#### Boundary Conditions (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 12 | `write 100 sequential events to same session` | All events appended, file grows correctly |
| 13 | `write event with 10KB summary text` | Large content handled |
| 14 | `write events to 10 different sessions simultaneously` | Session isolation maintained |
| 15 | `write diagnostic with all payload fields populated` | Full diagnostic payload works |
| 16 | `write event with special characters in title/summary` | Markdown escaping handled |

#### Error Handling (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 17 | `write event when .hivemind/sessions dir is read-only` | Permission error handled gracefully |
| 18 | `write event with malformed payload type` | Type mismatch caught |
| 19 | `write event returns success:true and path on success` | Success shape verified |
| 20 | `write event returns success:false on failure` | Error shape verified |

#### Stress-Specific (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 21 | `50 rapid sequential writes to same session` | No data loss, all events present |
| 22 | `concurrent writes to different sessions (10 parallel)` | No file corruption |
| 23 | `write events across 5 session lifecycles` | Session isolation across lifecycles |
| 24 | `journal file grows linearly with event count` | No exponential growth or duplication |
| 25 | `read journal file after 100 writes — all events parseable` | File integrity after stress |

---

## 4. Cross-Tool Integration Tests (20 tests)

**File:** `tests/tools/cross-tool-integration.test.ts`

### Tool Chains (8 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 1 | `full tool chain: status → command → task → trajectory → handoff → journal` | All 7 tools in sequence | Each tool output feeds next tool input |
| 2 | `doc → task chain: read spec → create tasks from it` | hivemind_doc → hivemind_task | Doc content used to create tasks |
| 3 | `task → trajectory chain: create task → attach trajectory` | hivemind_task → hivemind_trajectory | Task bound to trajectory |
| 4 | `trajectory → handoff chain: attach trajectory → create handoff` | hivemind_trajectory → hivemind_handoff | Trajectory ID bound to handoff |
| 5 | `handoff → journal chain: create handoff → journal the event` | hivemind_handoff → hivemind_journal | Handoff creation journaled |
| 6 | `runtime_command → runtime_status chain: init → verify status` | hivemind_runtime_command → hivemind_runtime_status | Status reflects command result |
| 7 | `task complete → trajectory close chain` | hivemind_task → hivemind_trajectory | Task completion triggers trajectory close |
| 8 | `doc search → handoff create chain` | hivemind_doc → hivemind_handoff | Search results inform handoff scope |

### State Sharing (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 9 | `workflowId consistent across task, trajectory, handoff` | Same workflowId used by all three tools |
| 10 | `sessionId consistent across trajectory, handoff, journal` | Same sessionId used by all three tools |
| 11 | `taskId from task create used in trajectory attach` | Task output → trajectory input |
| 12 | `trajectoryId from attach used in handoff create` | Trajectory output → handoff input |
| 13 | `handoff id from create used in handoff read/validate/close` | Handoff lifecycle uses same ID |

### Concurrent Access (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 14 | `task create + trajectory attach on same workflow simultaneously` | No race condition |
| 15 | `handoff create + journal write on same session simultaneously` | No file corruption |
| 16 | `multiple trajectory events on same trajectory simultaneously` | Events not lost |
| 17 | `doc read while journal writes to same session` | Read/write isolation |

### Cross-Tool Error Propagation (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 18 | `task create fails → trajectory attach handles missing task` | Graceful degradation |
| 19 | `handoff create fails → journal still records the attempt` | Error events journaled |
| 20 | `trajectory close → subsequent task activate returns error` | Closed trajectory blocks mutations |

---

## 5. Agent Workflow Simulations (30 tests)

**File:** `tests/tools/agent-workflow-simulations.test.ts`

### Orchestrator Workflow (6 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 1 | `orchestrator: use-hivemind → runtime_status` | runtime_status | Status shows attached state |
| 2 | `orchestrator: runtime_status → task create (planning task)` | hivemind_task create | Planning task created |
| 3 | `orchestrator: task create → trajectory attach` | hivemind_trajectory attach | Trajectory attached to planning task |
| 4 | `orchestrator: trajectory attach → handoff create (delegate)` | hivemind_handoff create | Delegation packet created |
| 5 | `orchestrator: handoff create → trajectory checkpoint` | hivemind_trajectory checkpoint | Checkpoint records delegation |
| 6 | `orchestrator: verify return → task complete` | hivemind_task complete | Task marked complete after return |

### Explorer Workflow (5 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 7 | `explorer: doc skim → discover relevant files` | hivemind_doc skim | File outline returned |
| 8 | `explorer: doc search → find specific content` | hivemind_doc search | Search results returned |
| 9 | `explorer: doc read → read full section` | hivemind_doc read | Section content returned |
| 10 | `explorer: trajectory event → record findings` | hivemind_trajectory event | Findings recorded as event |
| 11 | `explorer: return findings → journal the exploration` | hivemind_journal write | Exploration journaled |

### Maker Workflow (5 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 12 | `maker: task activate → begin implementation` | hivemind_task activate | Task status changed to active |
| 13 | `maker: handoff read → understand delegated scope` | hivemind_handoff read | Scope understood |
| 14 | `maker: implement → doc read for context` | hivemind_doc read | Context retrieved |
| 15 | `maker: task complete → mark done` | hivemind_task complete | Task marked complete |
| 16 | `maker: trajectory close → close implementation trajectory` | hivemind_trajectory close | Trajectory closed |

### Verifier Workflow (5 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 17 | `verifier: task list → find tasks to verify` | hivemind_task list | Tasks listed |
| 18 | `verifier: trajectory inspect → review trajectory state` | hivemind_trajectory inspect | Trajectory state reviewed |
| 19 | `verifier: handoff validate → check handoff completeness` | hivemind_handoff validate | Validation result returned |
| 20 | `verifier: task verify → verify task completion` | hivemind_task verify | Verification recorded |
| 21 | `verifier: journal the verification result` | hivemind_journal write | Verification journaled |

### Planner Workflow (5 tests)
| # | Test Name | Sequence | Validates |
|---|-----------|----------|-----------|
| 22 | `planner: runtime_status → assess current state` | hivemind_runtime_status | Current state assessed |
| 23 | `planner: task create (multiple with deps)` | hivemind_task create × N | Tasks created with dependency chain |
| 24 | `planner: trajectory attach → bind to workflow` | hivemind_trajectory attach | Trajectory bound |
| 25 | `planner: handoff create → delegate first task` | hivemind_handoff create | First delegation created |
| 26 | `planner: journal the plan` | hivemind_journal write | Plan recorded |

### Cross-Agent State (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 27 | `orchestrator creates handoff → maker reads it → state consistent` | Handoff state shared correctly |
| 28 | `explorer records trajectory event → verifier inspects it` | Event visible to verifier |
| 29 | `maker completes task → planner sees it in task list` | Task status propagated |
| 30 | `journal records all agent actions → full audit trail` | Complete audit trail in journal |

---

## 6. Full Cycle Tests — End-to-End (25 tests)

**File:** `tests/tools/full-cycle-journeys.test.ts`

### New Session Bootstrap (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `fresh project: hm-init → runtime shows attached` | Runtime attachment created |
| 2 | `fresh project: runtime attached → task created` | First task created successfully |
| 3 | `fresh project: task created → trajectory attached` | Trajectory attached to task |
| 4 | `fresh project: full bootstrap → journal records all steps` | All bootstrap steps journaled |
| 5 | `fresh project: bootstrap → doc skim shows planning artifacts` | Planning artifacts created |

### Delegation Cycle (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 6 | `orchestrator creates handoff → subagent reads it` | Handoff readable by target agent |
| 7 | `subagent works → creates evidence` | Evidence attached to handoff |
| 8 | `subagent returns → handoff validated` | Handoff validation passes |
| 9 | `handoff closed → orchestrator notified` | Handoff closure recorded |
| 10 | `full delegation cycle → journal records all steps` | Complete delegation audit trail |

### Multi-Turn Session (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 11 | `10 tool calls across simulated turns → trajectory tracks all` | All turns recorded in trajectory |
| 12 | `10 tool calls → journal records all` | All turns journaled |
| 13 | `mixed tool types across turns → no state corruption` | State consistent across tool types |
| 14 | `turn sequence: status → task → trajectory → handoff → journal` | Full turn sequence works |
| 15 | `turn sequence with task rotation between turns` | Task rotation works across turns |

### Compaction Recovery (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 16 | `session compacts → trajectory resume works` | Trajectory can resume after compaction |
| 17 | `session compacts → context restored via doc read` | Doc read restores context |
| 18 | `session compacts → handoff state preserved` | Handoff survives compaction |
| 19 | `session compacts → task state preserved` | Tasks survive compaction |
| 20 | `session compacts → journal records compaction event` | Compaction event journaled |

### Error Recovery (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 21 | `tool fails → error handled → retry → success` | Retry after failure works |
| 22 | `task create fails → trajectory not attached → retry` | Clean retry after task failure |
| 23 | `handoff create fails → journal records failure` | Failure journaled |
| 24 | `doc read fails (missing file) → fallback to skim` | Graceful fallback |
| 25 | `runtime command fails → runtime status shows degraded` | Degraded state visible |

---

## 7. Stress/Load Tests (15 tests)

**File:** `tests/tools/stress-load-tests.test.ts`

### Rapid Sequential Calls (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `50 sequential hivemind_task create calls` | All 50 tasks created, no failures |
| 2 | `50 sequential hivemind_trajectory event calls` | All 50 events recorded |
| 3 | `50 sequential hivemind_journal write calls` | All 50 events journaled |
| 4 | `50 sequential hivemind_handoff create calls` | All 50 handoffs created |

### Large Payload Handling (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 5 | `hivemind_runtime_command with 50KB userMessage` | Large payload accepted |
| 6 | `hivemind_handoff create with 20KB scope` | Large scope accepted |
| 7 | `hivemind_journal with 10KB summary` | Large summary accepted |
| 8 | `hivemind_doc read with 500KB file` | Large file read handled |

### File System Pressure (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 9 | `100 journal writes → file system handles load` | No file descriptor exhaustion |
| 10 | `100 trajectory events → ledger handles load` | No ledger corruption |
| 11 | `50 handoff files created → directory handles load` | No directory issues |
| 12 | `concurrent writes to same journal file (10 parallel)` | No file corruption |

### Memory Pressure (3 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 13 | `hivemind_doc chunk with maxTokens on 1MB file` | Large file chunked without OOM |
| 14 | `hivemind_task list with 500 tasks` | Large task list returned |
| 15 | `hivemind_trajectory inspect with 200 events` | Large event list returned |

---

## 8. Deterministic Trigger Tests (15 tests)

**File:** `tests/tools/deterministic-triggers.test.ts`

### Auto-Allow Permission (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 1 | `hivemind_runtime_status does not trigger permission.ask` | No permission prompt for managed tool |
| 2 | `hivemind_task does not trigger permission.ask` | No permission prompt for managed tool |
| 3 | `hivemind_journal does not trigger permission.ask` | No permission prompt for managed tool |
| 4 | `all 7 tools in HIVEMIND_MANAGED_TOOLS auto-allowed` | Every managed tool skips permission |

### Event Recording (5 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 5 | `tool.execute.before hook fires for hivemind_task` | Before-hook event recorded in trajectory |
| 6 | `tool.execute.after hook fires for hivemind_task` | After-hook event recorded in trajectory |
| 7 | `tool.execute.before/after fire for all 7 tools` | All managed tools trigger hooks |
| 8 | `non-managed tool (bash) does NOT fire hivemind hooks` | Only managed tools trigger hooks |
| 9 | `hook events include correct sessionID and tool name` | Event metadata correct |

### State Persistence (4 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 10 | `hivemind_task create → task persists to .hivemind/workflow/` | Task file exists on disk |
| 11 | `hivemind_trajectory attach → trajectory persists to .hivemind/` | Trajectory file exists on disk |
| 12 | `hivemind_handoff create → handoff persists to .hivemind/handoffs/` | Handoff file exists on disk |
| 13 | `hivemind_journal write → journal persists to .hivemind/sessions/` | Journal file exists on disk |

### Hook Integration (2 tests)
| # | Test Name | Validates |
|---|-----------|-----------|
| 14 | `tool.execute.after records event only for managed tools` | Non-managed tools excluded |
| 15 | `feature-local tools (classify-intent) excluded from hooks` | Feature-local tools don't trigger hooks |

---

## 9. Dependencies Between Tests

```
Category 1: Individual Tool Tests (Files 1-7)
  └─ No inter-file dependencies
  └─ Each file depends on: test-helpers.ts, tool implementations

Category 2: Cross-Tool Integration (File 8)
  └─ Depends on: All individual tool tests passing
  └─ Depends on: test-helpers.ts

Category 3: Agent Workflow Simulations (File 9)
  └─ Depends on: Cross-tool integration tests passing
  └─ Depends on: Individual tool tests passing

Category 4: Full Cycle Tests (File 10)
  └─ Depends on: Agent workflow simulations passing
  └─ Depends on: Cross-tool integration tests passing

Category 5: Stress/Load Tests (File 11)
  └─ Depends on: Individual tool tests passing (baseline correctness)
  └─ Independent of: Integration/Workflow tests

Category 6: Deterministic Triggers (File 12)
  └─ Depends on: Individual tool tests passing
  └─ Depends on: Plugin assembly tests (runtime-tools.test.ts)
```

### Execution Order
```
Phase 1: Individual Tool Tests (Files 1-7) — can run in parallel
Phase 2: Cross-Tool Integration (File 8) — after Phase 1
Phase 3: Agent Workflow Simulations (File 9) — after Phase 2
Phase 4: Full Cycle Tests (File 10) — after Phase 3
Phase 5: Stress/Load Tests (File 11) — after Phase 1 (independent)
Phase 6: Deterministic Triggers (File 12) — after Phase 1
```

---

## 10. Test Utilities — Detailed Specification

### `tests/tools/test-helpers.ts`

```typescript
// Core helpers needed:

// 1. Mock context factory
function createMockContext(root: string): ToolContext

// 2. Runtime bootstrap
async function bootstrapReadyRuntime(projectRoot: string): Promise<void>

// 3. Plugin input factory
function createPluginInput(directory: string): PluginInput

// 4. Tool execution wrapper
async function executeTool(tool: ToolDefinition, args: Record<string, unknown>, context: ToolContext): Promise<any>

// 5. Success/error assertions
function expectToolSuccess(result: string): Record<string, unknown>
function expectToolError(result: string): Record<string, unknown>

// 6. Temp project factory
async function createTempProject(): Promise<{ root: string; context: ToolContext; cleanup: () => Promise<void> }>

// 7. File polling
async function waitForFile(path: string, timeout?: number): Promise<boolean>

// 8. Large string generator
function generateLargeString(bytes: number): string

// 9. Task tree generator
async function createNestedTaskTree(root: string, workflowId: string, depth: number): Promise<string[]>

// 10. Markdown file creator
async function createMarkdownFile(root: string, path: string, content: string): Promise<void>
```

---

## 11. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Tool implementations change during test writing | Medium | High | Write tests against current interfaces; use TypeScript for compile-time checks |
| Stress tests flaky on CI | Medium | Medium | Use generous timeouts; retry logic for file system operations |
| Temp directory cleanup failures | Low | Low | Always use try/finally with rm recursive |
| Concurrent test interference | Medium | High | Each test gets isolated temp directory |
| Zod schema changes break tests | Low | Medium | Tests validate schema behavior, not specific error messages |
| File system race conditions in stress tests | Medium | High | Use sequential writes for stress tests; parallel only for isolation tests |

---

## 12. Summary

| Category | Files | Tests | Priority |
|----------|-------|-------|----------|
| Individual Tool Tests | 7 | 196 | P0 — Must have |
| Cross-Tool Integration | 1 | 20 | P0 — Must have |
| Agent Workflow Simulations | 1 | 30 | P1 — High value |
| Full Cycle Tests | 1 | 25 | P1 — High value |
| Stress/Load Tests | 1 | 15 | P2 — Important |
| Deterministic Triggers | 1 | 15 | P1 — High value |
| **Total** | **12** | **~301** | |

### Delegation Packets for Implementation

**Packet 1: Individual Tool Tests (Files 1-4)**
- Target: hivemaker
- Scope: `tests/tools/runtime/`, `tests/tools/doc/`, `tests/tools/task/`
- Dependencies: `tests/tools/test-helpers.ts` must exist first
- Success: All tests pass, `npx tsc --noEmit` clean

**Packet 2: Individual Tool Tests (Files 5-7)**
- Target: hivemaker
- Scope: `tests/tools/trajectory/`, `tests/tools/handoff/`, `tests/tools/journal/`
- Dependencies: `tests/tools/test-helpers.ts` must exist first
- Success: All tests pass, `npx tsc --noEmit` clean

**Packet 3: Integration + Workflow Tests (Files 8-9)**
- Target: hivemaker
- Scope: `tests/tools/cross-tool-integration.test.ts`, `tests/tools/agent-workflow-simulations.test.ts`
- Dependencies: Packets 1 and 2 must pass
- Success: All tests pass, `npx t2sc --noEmit` clean

**Packet 4: Full Cycle + Stress + Triggers (Files 10-12)**
- Target: hivemaker
- Scope: `tests/tools/full-cycle-journeys.test.ts`, `tests/tools/stress-load-tests.test.ts`, `tests/tools/deterministic-triggers.test.ts`
- Dependencies: Packets 1-3 must pass
- Success: All tests pass, `npx tsc --noEmit` clean
