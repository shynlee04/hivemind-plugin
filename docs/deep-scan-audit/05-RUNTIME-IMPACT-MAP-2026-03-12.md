# Runtime Impact Map

**Generated**: 2026-03-12
**Scope**: Entry → Mid-Session → Exit flow with file paths and data dependencies
**Purpose**: Understand runtime execution order for safe modification

---

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SESSION LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        ENTRY SEQUENCE                                 │   │
│  │                                                                       │   │
│  │  session.created                                                      │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [1] src/hooks/event-handler.ts                                       │   │
│  │      → Creates: .hivemind/sessions/active/<id>/profile.json           │   │
│  │      → Sets: agent:"unresolved"                                       │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [2] src/lib/session-intent-classifier.ts                             │   │
│  │      → Classifies: 6 intent categories                                │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [3] src/lib/onboarding.ts                                            │   │
│  │      → detectBrownfield(), isCleanSession()                           │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [4] skills/entry-resolution/SKILL.md                                 │   │
│  │      → 6-step entry protocol                                          │   │
│  │      → Routes to appropriate lineage                                  │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      MID-SESSION FLOW (EVERY TURN)                    │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │ System 2a: session-lifecycle.ts                              │     │   │
│  │  │                                                              │     │   │
│  │  │  Reads:                         Outputs:                     │     │   │
│  │  │  - brain.json                   HIVE-MASTER block            │     │   │
│  │  │  - config.json                  → output.system              │     │   │
│  │  │  - anchors.json                                              │     │   │
│  │  │  - mems.json                     Calls:                      │     │   │
│  │  │  - tasks.json                    - compileDefaultGovernance() │     │   │
│  │  │                                  - generateEscalationBlock()  │     │   │
│  │  │                                                              │     │   │
│  │  │  Constraint: child-session suppression                       │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │ System 2b: messages-transform.ts                             │     │   │
│  │  │                                                              │     │   │
│  │  │  Reads:                         Outputs:                     │     │   │
│  │  │  - brain.json                   <hivemind_state> XML         │     │   │
│  │  │  - tasks.json                   → output.messages            │     │   │
│  │  │  - anchors.json                                              │     │   │
│  │  │  - mems.json                     Calls:                      │     │   │
│  │  │                                  - packCognitiveState()       │     │   │
│  │  │                                                              │     │   │
│  │  │  Constraint: child-session minimization                      │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │ Tool Execution Layer                                         │     │   │
│  │  │                                                              │     │   │
│  │  │  [A] src/hooks/tool-gate.ts                                  │     │   │
│  │  │      → tool.execute.before (advisory only)                   │     │   │
│  │  │                                                              │     │   │
│  │  │  [B] Tool execution                                          │     │   │
│  │  │      → CQRS: tools write, hooks read                         │     │   │
│  │  │                                                              │     │   │
│  │  │  [C] src/hooks/soft-governance.ts                            │     │   │
│  │  │      → tool.execute.after                                    │     │   │
│  │  │      → Counter updates, CQRS flush                           │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          EXIT SEQUENCE                                │   │
│  │                                                                       │   │
│  │  [1] src/lib/compaction-engine.ts                                     │   │
│  │      → generateNextCompactionReport()                                 │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [2] src/tools/hivemind-cycle.ts                                      │   │
│  │      → export: archives session                                       │   │
│  │       │                                                               │   │
│  │       ▼                                                               │   │
│  │  [3] src/lib/session-export.ts                                        │   │
│  │      → JSON/Markdown exports                                          │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Entry Sequence Details

### 1. Session Bootstrap

**File**: `src/hooks/event-handler.ts`
**Trigger**: `session.created` event
**Action**: Creates session directory structure

```
.hivemind/sessions/active/<session-id>/
├── profile.json      # { agent: "unresolved", ... }
├── brain.json        # Session-local brain state
└── tasks.json        # Session-local task list
```

**Critical**: This is the ONLY place that creates new session directories.

---

### 2. Intent Classification

**File**: `src/lib/session-intent-classifier.ts`
**Purpose**: Classify user intent into 6 categories

| Category | Description |
|----------|-------------|
| `implementation` | Code changes, feature work |
| `investigation` | Research, exploration |
| `planning` | Roadmap, specification |
| `debugging` | Bug fixes, diagnostics |
| `verification` | Testing, validation |
| `orchestration` | Delegation, coordination |

---

### 3. Environment Detection

**File**: `src/lib/onboarding.ts`
**Functions**:
- `detectBrownfield()` — Check for existing project state
- `isCleanSession()` — Determine if fresh start needed

---

### 4. Entry Resolution

**File**: `skills/entry-resolution/SKILL.md`
**Protocol**: 6-step entry sequence

1. Detect session state
2. Resolve lineage
3. Classify intent
4. Assess clarity
5. Route to agent/workflow
6. Gate with prerequisites

---

## Mid-Session Flow Details

### System 2a: session-lifecycle.ts

**Frequency**: EVERY TURN
**Output Target**: `output.system`

#### Data Flow

```
┌─────────────────┐
│   brain.json    │────┐
├─────────────────┤    │
│   config.json   │────┤
├─────────────────┤    │     ┌──────────────────────────┐
│  anchors.json   │────┼────▶│ compileDefaultGovernance │
├─────────────────┤    │     └──────────────────────────┘
│    mems.json    │────┤              │
├─────────────────┤    │              ▼
│   tasks.json    │────┘     ┌──────────────────────────┐
└─────────────────┘          │ generateEscalationBlock  │
                             └──────────────────────────┘
                                        │
                                        ▼
                             ┌──────────────────────────┐
                             │    HIVE-MASTER block     │
                             │    → output.system       │
                             └──────────────────────────┘
```

#### Child-Session Suppression

```typescript
if (isChildSession()) {
  // Reduced governance injection
  // Prevents context amplification in sub-sessions
}
```

---

### System 2b: messages-transform.ts

**Frequency**: EVERY TURN
**Output Target**: `output.messages`

#### Data Flow

```
┌─────────────────┐
│   brain.json    │────┐
├─────────────────┤    │
│   tasks.json    │────┤     ┌──────────────────────┐
├─────────────────┤    ├────▶│  packCognitiveState  │
│  anchors.json   │────┤     └──────────────────────┘
├─────────────────┤    │              │
│    mems.json    │────┘              ▼
└─────────────────┘          ┌──────────────────────┐
                              │ <hivemind_state> XML │
                              │ → output.messages    │
                              └──────────────────────┘
```

#### Child-Session Minimization

```typescript
if (isChildSession()) {
  // Minimal cognitive state
  // Checklist suppression
}
```

---

### Tool Execution Layer

#### Pre-Execution: tool-gate.ts

**Hook**: `tool.execute.before`
**Type**: Advisory only (cannot block)
**Purpose**: Log tool usage, check permissions

#### Execution: CQRS Pattern

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│    Hooks     │────▶│   StateMutationQueue │────▶│  .hivemind/     │
│  (READ ONLY) │     │    (WRITE ONLY)      │     │    state/       │
└──────────────┘     └──────────────────────┘     └─────────────────┘
       ▲                                                   │
       │                                                   │
       └───────────────────────────────────────────────────┘
                          Read after write
```

#### Post-Execution: soft-governance.ts

**Hook**: `tool.execute.after`
**Actions**:
- Update governance counters
- Flush CQRS queue
- Track evidence pressure

---

## Sub-Session Spawning

### Trigger Detection

**File**: `src/lib/session-split.ts`
**Detection**: `AUTO_SPLIT_TRIGGER_TOOLS` constant

```typescript
const AUTO_SPLIT_TRIGGER_TOOLS = [
  'hivemind_delegate',
  'export_cycle',
  // ...
];
```

### Spawn Execution

**File**: `src/hooks/swarm-executor.ts`
**Mechanism**: OpenCode SDK-backed spawning

### Role Detection

**File**: `src/lib/session-role.ts`
**Function**: `isChildSession()`

```typescript
export function isChildSession(): boolean {
  // Check for parent session ID
  // Check for delegation context
}
```

---

## Exit Sequence Details

### 1. Compaction Report

**File**: `src/lib/compaction-engine.ts`
**Function**: `generateNextCompactionReport()`
**Output**: Recommendations for context cleanup

### 2. Session Export

**File**: `src/tools/hivemind-cycle.ts`
**Action**: `export` archives session

```
.hivemind/sessions/active/<id>/
        │
        ▼ (archive)
.hivemind/sessions/archive/<id>-<timestamp>.json
```

### 3. Format Export

**File**: `src/lib/session-export.ts`
**Formats**: JSON, Markdown

---

## Injection Pipeline Dependencies

```
budget.ts
    │
    ▼
injection-orchestrator.ts
    │
    ├──▶ governance-instruction.ts ──▶ session-lifecycle.ts (System 2a)
    │
    └──▶ cognitive-packer.ts ───────▶ messages-transform.ts (System 2b)
              │
              └──▶ session-governance.ts (both systems)
```

---

## State File Access Map

| State File | Readers | Writers |
|------------|---------|---------|
| `brain.json` | session-lifecycle, messages-transform, persistence | StateMutationQueue |
| `hierarchy.json` | hierarchy-tree, chain-analysis | StateMutationQueue |
| `anchors.json` | session-lifecycle, messages-transform | hivemind_anchor tool |
| `mems.json` | session-lifecycle, messages-transform | hivemind_memory tool |
| `tasks.json` | session-lifecycle, messages-transform | hiveops_todo tool |
| `config.json` | session-lifecycle | CLI init only |
| `profile.json` | event-handler (create), tools (read) | StateMutationQueue |

---

## Critical Path Summary

| Phase | Critical Files | Risk if Modified |
|-------|----------------|------------------|
| Entry | `event-handler.ts` | Session bootstrap failure |
| Mid-Session | `session-lifecycle.ts`, `messages-transform.ts` | Context poisoning |
| Tool Execution | `state-mutation-queue.ts` | State corruption |
| Exit | `compaction-engine.ts`, `session-export.ts` | Session loss |

---

## Modification Guidelines

### Before Modifying Injection Files

1. Run ownership coverage tests
2. Verify child-session handling
3. Check budget constraints
4. Test with fresh session

### Before Modifying State Files

1. Ensure CQRS compliance
2. Use StateMutationQueue
3. Verify flush order
4. Test persistence layer

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
