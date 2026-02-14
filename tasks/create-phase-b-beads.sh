#!/bin/bash
# Phase B — Session Lifecycle & Task Governance
# Beads creation commands for ralph-tui execution
# Execute in order to create epic + child beads with dependencies

# ============================================================
# STEP 1: Create Epic (no dependencies)
# ============================================================

EPIC_ID=$(bd create --type=epic \
  --title="Phase B — Session Lifecycle & Task Governance" \
  --description="$(cat <<'EOF'
Enhance HiveMind's context governance with four major features:

1. **Messages Transform Hook** — Inject stop-decision checklists before LLM stops, augment user messages with anchor context
2. **Session Boundary Management** — Proactively create new sessions before context poisoning occurs
3. **Task Manifest Persistence** — Wire todo.updated event to tasks.json for cross-session resumption
4. **Auto-Commit Integration** — Automatic atomic commits for file-changing operations

Quality Gates:
- npm test — All tests passing
- npm run typecheck — No TypeScript errors
- Run requesting-code-review skill for peer review

Parallel Execution Tracks:
- Track A (US-001 to US-003-A): Messages Transform Hook
- Track B (US-004, US-005): Task Manifest
- Track C (US-006, US-007): Auto-Commit
- Track D (US-008 to US-011): Session Boundary (depends on US-003-A)

Tracks A, B, C can run in parallel. Track D starts after US-003 completes.
EOF
)" \
  --external-ref="prd:./tasks/prd-phase-b.json")

# Extract epic ID for child beads
echo "Epic created: $EPIC_ID"

# ============================================================
# STEP 2: Create Child Beads (Tracks A, B, C first - parallel)
# ============================================================

# Track A: Messages Transform Hook (US-001, US-002, US-003, US-003-A)
RALPH_TUI_001=$(bd create --parent="$EPIC_ID" \
  --title="US-001: Create Messages Transform Hook Core" \
  --description="$(cat <<'EOF'
As a HiveMind developer, I want to implement the experimental.chat.messages.transform hook so that I can inject stop-decision checklists before the LLM decides to stop.

## Acceptance Criteria
- [ ] Create file src/hooks/messages-transform.ts with createMessagesTransformHook factory function
- [ ] Hook signature matches OpenCode SDK: (input: {}, output: { messages: MessageV2[] }) => Promise<void>
- [ ] Hook reads brain state and config to determine checklist items
- [ ] Checklist injection budget capped at 300 characters
- [ ] P3 error handling — never break message flow
- [ ] Create test file tests/hooks/messages-transform-001-[date]-[time].test.ts
- [ ] Integration test verifies synthetic message injection
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/messages-transform.ts
- tests/hooks/messages-transform-001-[date]-[time].test.ts
EOF
)" \
  --priority=1)

RALPH_TUI_002=$(bd create --parent="$EPIC_ID" \
  --title="US-002: Implement Stop-Decision Checklist Injection" \
  --description="$(cat <<'EOF'
As an AI agent using HiveMind, I want a checklist injected before I stop so that I verify all required work is complete.

## Acceptance Criteria
- [ ] Checklist items dynamically generated from brain state: Hierarchy cursor check (action level missing?)
- [ ] map_context called this session?
- [ ] Subagent failure acknowledgment (pending_failure_ack)
- [ ] Git commit needed for file changes
- [ ] Injected as synthetic <system-reminder> part with synthetic: true flag
- [ ] Checklist format: <system-reminder>\nCHECKLIST BEFORE STOPPING:\n- [ ] item\n...\n</system-reminder>
- [ ] Skipped if governance_mode === 'permissive'
- [ ] Test verifies checklist appears in messages array when conditions met
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/messages-transform.ts
EOF
)" \
  --priority=2)

RALPH_TUI_003=$(bd create --parent="$EPIC_ID" \
  --title="US-003: Implement User Message Continuity Transformation" \
  --description="$(cat <<'EOF'
As an AI agent continuing work, I want my user messages augmented with anchor context so that I maintain continuity across turns.

## Acceptance Criteria
- [ ] Find latest non-synthetic user message in messages array
- [ ] Load anchors from .hivemind/state/anchors.json
- [ ] Load hierarchy cursor path from tree
- [ ] Prepend <anchor-context> block with top 3 anchors
- [ ] Prepend <focus> element with cursor ancestry path
- [ ] Prepend as synthetic part (doesn't modify user's actual text)
- [ ] Budget capped at 200 characters for anchor context
- [ ] Test verifies user message augmented when anchors exist
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/messages-transform.ts
- tests/hooks/messages-transform-001-[date]-[time].test.ts
EOF
)" \
  --priority=3)

RALPH_TUI_003A=$(bd create --parent="$EPIC_ID" \
  --title="US-003-A: Register Messages Transform Hook in Plugin" \
  --description="$(cat <<'EOF'
As a HiveMind user, I want the messages-transform hook registered so that it activates on every LLM call.

## Acceptance Criteria
- [ ] Import createMessagesTransformHook in src/index.ts
- [ ] Add to hooks object: 'experimental.chat.messages.transform': createMessagesTransformHook(log, effectiveDir)
- [ ] Run npm test — all existing tests still pass
- [ ] Run npm run typecheck — no errors
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/index.ts
EOF
)" \
  --priority=4)

# Track B: Task Manifest (US-004, US-005)
RALPH_TUI_004=$(bd create --parent="$EPIC_ID" \
  --title="US-004: Handle todo.updated Event" \
  --description="$(cat <<'EOF'
As a HiveMind user, I want my TODOs persisted to tasks.json so that they survive across sessions.

## Acceptance Criteria
- [ ] Add case 'todo.updated': to src/hooks/event-handler.ts
- [ ] Extract sessionID and todos array from event properties
- [ ] Load current brain state to get session context
- [ ] Write to .hivemind/state/tasks.json with structure: { session_id, updated_at, tasks[] }
- [ ] Create test file tests/hooks/event-handler-todo-[date]-[time].test.ts
- [ ] Test verifies tasks.json created with correct content
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/event-handler.ts
- tests/hooks/event-handler-todo-[date]-[time].test.ts
EOF
)" \
  --priority=1)

RALPH_TUI_005=$(bd create --parent="$EPIC_ID" \
  --title="US-005: Create Task Manifest Schema and Helpers" \
  --description="$(cat <<'EOF'
As a HiveMind developer, I want a typed schema for tasks.json so that I have type safety when working with task data.

## Acceptance Criteria
- [ ] Add TaskManifest interface to src/schemas/manifest.ts (or create if needed)
- [ ] Interface includes: session_id, updated_at, tasks[] with TaskItem type
- [ ] Add loadTasks(directory) helper in src/lib/manifest.ts or new file
- [ ] Add saveTasks(directory, manifest) helper
- [ ] Ensure .hivemind/state/tasks.json path uses getEffectivePaths()
- [ ] Unit tests for load/save helpers
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/schemas/manifest.ts
- src/lib/manifest.ts
- tests/lib/manifest-tasks-[date]-[time].test.ts
EOF
)" \
  --priority=2)

# Track C: Auto-Commit (US-006, US-007)
RALPH_TUI_006=$(bd create --parent="$EPIC_ID" \
  --title="US-006: Create Auto-Commit Logic Module" \
  --description="$(cat <<'EOF'
As a HiveMind developer, I want a dedicated module for auto-commit logic so that it's testable and reusable.

## Acceptance Criteria
- [ ] Create src/lib/auto-commit.ts
- [ ] Export shouldAutoCommit(tool: string): boolean — returns true for write, edit, bash
- [ ] Export generateCommitMessage(ctx: AutoCommitContext): string — conventional format
- [ ] Export executeAutoCommit(ctx: AutoCommitContext): Promise<{ success, message }>
- [ ] Use Bun's $ for git commands: git add, git commit
- [ ] Create test file tests/lib/auto-commit-[date]-[time].test.ts
- [ ] Tests for shouldAutoCommit, generateCommitMessage
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/lib/auto-commit.ts
- tests/lib/auto-commit-[date]-[time].test.ts
EOF
)" \
  --priority=1)

RALPH_TUI_007=$(bd create --parent="$EPIC_ID" \
  --title="US-007: Integrate Auto-Commit into tool.execute.after Hook" \
  --description="$(cat <<'EOF'
As a HiveMind user, I want file changes automatically committed so that I have an audit trail of modifications.

## Acceptance Criteria
- [ ] Import auto-commit functions in src/hooks/soft-governance.ts
- [ ] Check config.auto_commit flag (add to config schema if needed)
- [ ] After detection tracking, call executeAutoCommit if conditions met: shouldAutoCommit(toolName) returns true and Files were modified (extract from output.metadata or state)
- [ ] Log success/failure at debug level
- [ ] Don't block execution on commit failure — just log
- [ ] Integration test verifies commit triggered on file write
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/soft-governance.ts
- src/schemas/config.ts
- tests/hooks/soft-governance-[date]-[time].test.ts
EOF
)" \
  --priority=2)

# Track D: Session Boundary (US-008, US-009, US-010, US-011)
RALPH_TUI_008=$(bd create --parent="$EPIC_ID" \
  --title="US-008: Create Session Boundary Manager Module" \
  --description="$(cat <<'EOF'
As a HiveMind developer, I want logic to determine when to create a new session so that context doesn't become poisoned.

## Acceptance Criteria
- [ ] Create src/lib/session-boundary.ts
- [ ] Export SessionBoundaryState interface with turnCount, contextPercent, hierarchyComplete, isMainSession, hasDelegations
- [ ] Export shouldCreateNewSession(state): SessionBoundaryRecommendation
- [ ] Rules implemented: Only main session (delegation excluded), Context must be <80%, Natural boundaries: completed phase/epic, turn threshold (30+)
- [ ] Export estimateContextPercent(turnCount, compactThreshold): number
- [ ] Create test file tests/lib/session-boundary-[date]-[time].test.ts
- [ ] Tests for each rule
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/lib/session-boundary.ts
- tests/lib/session-boundary-[date]-[time].test.ts
EOF
)" \
  --priority=1)

RALPH_TUI_009=$(bd create --parent="$EPIC_ID" \
  --title="US-009: Integrate Boundary Detection into Session Lifecycle" \
  --description="$(cat <<'EOF'
As a HiveMind user, I want to see recommendations for creating fresh sessions when appropriate.

## Acceptance Criteria
- [ ] Import session-boundary functions in src/hooks/session-lifecycle.ts
- [ ] Call estimateContextPercent with turn count and auto_compact_on_turns
- [ ] Call shouldCreateNewSession with current state
- [ ] If recommended, add to warningLines: 🔄 [reason] and → Run /hivemind-compact to archive and start fresh
- [ ] Integration test verifies warning appears when conditions met
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/session-lifecycle.ts
- tests/hooks/session-lifecycle-[date]-[time].test.ts
EOF
)" \
  --priority=2)

RALPH_TUI_010=$(bd create --parent="$EPIC_ID" \
  --title="US-010: Inject Boundary Recommendation via Messages Transform" \
  --description="$(cat <<'EOF'
As an AI agent, I want session boundary recommendations injected before I stop so I can decide whether to compact.

## Acceptance Criteria
- [ ] In src/hooks/messages-transform.ts, load session-boundary module
- [ ] If shouldCreateNewSession returns recommended: true, add to checklist: - [ ] Session boundary reached: [reason]
- [ ] Include in stop-decision checklist injection
- [ ] Test verifies boundary item appears in checklist when threshold met
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/hooks/messages-transform.ts
- tests/hooks/messages-transform-001-[date]-[time].test.ts
EOF
)" \
  --priority=3)

RALPH_TUI_011=$(bd create --parent="$EPIC_ID" \
  --title="US-011: Create New SDK Session after Compact" \
  --description="$(cat <<'EOF'
As a HiveMind user, I want a new OpenCode session created automatically after compacting so that I get a clean context.

## Acceptance Criteria
- [ ] In src/tools/compact-session.ts, after successful archival:
- [ ] Get SDK client via getClient() from src/hooks/sdk-context.ts
- [ ] Call client.session.create() with: directory (current project directory), title: HiveMind: ${newSessionId}, parentID: previous session ID (for navigation)
- [ ] Log new session ID at info level
- [ ] Non-fatal if session creation fails (archival already succeeded)
- [ ] Integration test verifies new session created
- [ ] npm test passes
- [ ] npm run typecheck passes
- [ ] Run requesting-code-review skill for peer review

## Files
- src/tools/compact-session.ts
EOF
)" \
  --priority=4)

# ============================================================
# STEP 3: Add Dependencies (Sequential chains within each track)
# ============================================================

# Track A dependencies (US-001 -> US-002 -> US-003 -> US-003-A)
bd dep add "$RALPH_TUI_002" "$RALPH_TUI_001"
bd dep add "$RALPH_TUI_003" "$RALPH_TUI_002"
bd dep add "$RALPH_TUI_003A" "$RALPH_TUI_003"

# Track B dependencies (US-004 -> US-005)
bd dep add "$RALPH_TUI_005" "$RALPH_TUI_004"

# Track C dependencies (US-006 -> US-007)
bd dep add "$RALPH_TUI_007" "$RALPH_TUI_006"

# Track D dependencies (US-008 -> US-009 -> US-010 -> US-011)
bd dep add "$RALPH_TUI_009" "$RALPH_TUI_008"
bd dep add "$RALPH_TUI_010" "$RALPH_TUI_003A"  # Cross-track: needs messages-transform
echo "Cross-track dependency: US-010 depends on US-003-A"
bd dep add "$RALPH_TUI_010" "$RALPH_TUI_009"
bd dep add "$RALPH_TUI_011" "$RALPH_TUI_009"

echo ""
echo "========================================="
echo "Phase B Beads Created Successfully!"
echo "========================================="
echo "Epic ID: $EPIC_ID"
echo ""
echo "To run ralph-tui on this epic:"
echo "  ralph-tui run --tracker beads --epic $EPIC_ID"
echo ""
echo "Tracks (parallel execution possible):"
echo "  Track A: US-001 -> US-002 -> US-003 -> US-003-A (Messages Transform)"
echo "  Track B: US-004 -> US-005 (Task Manifest)"
echo "  Track C: US-006 -> US-007 (Auto-Commit)"
echo "  Track D: US-008 -> US-009 -> US-010 -> US-011 (Session Boundary, depends on Track A)"
