# Redesign: delegations.json + session-metadata.json

**Date:** 2026-05-31
**Status:** Design proposal

## 1. The Problem

Both files contain ZERO real data (all test artifacts). Their data models lack:
- Source tracking (how was the session created?)
- Linkage to session-tracker (no child folder path)
- Consistent field naming aligned with SDK types
- Programmatic writers that agents use in their workflow

## 2. Design Principles

1. **Every field must be written by production code, not tests**
2. **Every field must use real SDK session IDs (`ses_xxx`)**
3. **Every field must link to session-tracker where applicable**
4. **Files must be useful in runtime AND development workflow**
5. **Must support 3 dispatch sources: task tool, delegate-task, slash-command**

## 3. New `delegations.json` Data Model

### Current (broken)
```
35 records, all test artifacts
parentSessionId: "parent-1" (FAKE)
childSessionId: "child-e2e" (FAKE)
No source tracking
No session-tracker link
```

### New Design

```typescript
interface DelegationRecord {
  // Identity
  id: string;                    // crypto.randomUUID()
  parentSessionId: string;       // REAL SDK ses_xxx ID
  childSessionId: string;        // REAL SDK ses_xxx ID

  // Source classification (NEW — how was this delegation created?)
  source: "task-tool" | "delegate-task" | "slash-command" | "programmatic";

  // Agent context
  agent: string;                 // agent name (e.g., "gsd-executor")
  status: DelegationStatus;      // dispatched | running | completed | error | timeout

  // Operation metadata
  executionMode: "sdk" | "pty" | "headless";
  surface: DelegationSurface;
  recoveryGuarantee: DelegationRecoveryGuarantee;
  queueKey: string;
  nestingDepth: number;

  // Session-tracker linkage (NEW)
  sessionTrackerChildPath: string | null;  // relative path to session-tracker child folder

  // Timelines
  createdAt: number;
  completedAt: number | null;

  // Polling state
  lastMessageCount: number;
  stablePollCount: number;
  lastMessageCountChangeAt: number;

  // Terminal
  error?: string;
  terminalKind?: string;
  explicitCancellation?: boolean;
}
```

### Writers

| Writer | When | Field Changes |
|--------|------|---------------|
| `DelegationStateMachine.registerDelegation()` | On dispatch | All fields initially |
| `DelegationStateMachine.transition()` | Status change | Updated status |
| `DelegationStateMachine.transitionToTerminal()` | Terminal | Status + completedAt + terminalKind |
| `manager-runtime.dispatch()` | After spawn | Sets childSessionId from SDK createSession |
| Session-tracker tool-delegation | After delegation | Sets sessionTrackerChildPath |
| `recoverPending()` | On startup | Reads + re-hydrates |

### Readers

| Reader | When | Purpose |
|--------|------|---------|
| `recoverPending()` | Plugin startup | Find delegations to resume |
| `DelegationManager.pollDelegations()` | Polling loop | Check delegation status |
| `delegation-status` tool | Agent request | Report delegation state |
| Session-tracker delegation integration | Lookup | Link delegation to session data |

## 4. New `session-metadata.json` (renamed)

### Current (broken)
```
18 sessions, all test artifacts
File name collision with session-tracker's per-session "session-continuity.json"
Zero real data
```

### New Design

```typescript
interface SessionMetadataStore {
  version: 1;
  updatedAt: number;
  sessions: {
    [sessionId: string]: {       // REAL SDK ses_xxx ID
      status: SessionStatus;
      description: string;
      source: "task-tool" | "delegate-task" | "slash-command" | "programmatic";

      // Notification queue (survives restarts)
      pendingNotifications: Array<{
        id: string;
        type: string;
        message: string;
        delegationId?: string;
        createdAt: number;
      }>;

      // Lifecycle tracking
      lifecycle: {
        phase: string;
        compacted: boolean;
        lastActivityAt: number;
      };

      // Governance evaluation state
      governance?: {
        ruleEvaluations: Array<{
          rule: string;
          action: "block" | "warn" | "escalate";
          result: boolean;
        }>;
      };

      // Delegation context (if created by delegation)
      delegationPacket: {
        agent: string;
        prompt: string;
        delegationId: string;
      } | null;

      // Link to session-tracker (NEW)
      sessionTrackerPath: string;
    }
  }
}
```

### Writers

| Writer | When |
|--------|------|
| `recordSessionMetadata()` lifecycle hook | Session created/updated |
| `patchSessionMetadata()` lifecycle hook | Session state change |
| `persistPendingNotifications()` | Delegation terminal |
| Governance evaluator | After tool execution |
| `flushAllStores()` | Shutdown |

### Readers

| Reader | When |
|--------|------|
| `hydrateFromMetadata()` | Session restart |
| Governance hooks | Tool execution guard |

## 5. Cross-File Data Flow

```
              ┌─────────────────────────────────────────────┐
              │                OpenCode SDK                  │
              │  context.sessionID = "ses_xxx" (REAL)       │
              │  createSession() = "ses_yyy" (REAL)         │
              └──────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────────────────────┐
              │           Dispatch Router                   │
              │  task tool → delegate-task → slash-command  │
              └──────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────────────────────┐
              │       DelegationStateMachine                │
              │  registerDelegation()                       │
              │    → writes delegations.json                │
              │    → source = detectDispatchSource()        │
              │    → real parentSessionId from context      │
              │    → real childSessionId from createSession │
              └──────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────────────────────┐
              │       Session Lifecycle Hooks               │
              │  session.created → recordSessionMetadata()  │
              │    → writes session-metadata.json           │
              │    → real ses_ ID from SDK                  │
              │    → pendingNotifications for replay        │
              └──────────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────────────────────┐
              │       Session Tracker                       │
              │  117 real ses_xxx IDs (CANONICAL)           │
              │  Per-session child files + hierarchy        │
              │  delegations.json.sessionTrackerChildPath   │
              │    → links to session-tracker folder        │
              └─────────────────────────────────────────────┘
```

## 6. Implementation Plan

### Step 1: Add `source` field to Delegation type
- Add to `src/shared/types.ts`
- Update `manager-runtime.ts` to set source

### Step 2: Add `sessionTrackerChildPath` to Delegation type
- Set after session-tracker creates child folder

### Step 3: Rename continuity file
- `session-continuity.json` → `session-metadata.json`
- Update all references in code

### Step 4: Add source tracking to dispatch
- Detect: `task` tool, `delegate-task` tool, slash-command, programmatic
- Store in delegation record

### Step 5: Clean up test pollution
- Delete current polluted data
- Fix test isolation (OPENCODE_HARNESS_STATE_DIR)

### Step 6: Verify with real workflow
- Typecheck + tests + manual verification
