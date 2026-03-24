# Event-Tracker / Session-Journal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build a per-session event journal system that replaces error-log/, extends session-inspection with structured event tracking, and enables sub-session delegation tracking via delegation.json.

**Architecture:** The event-tracker feature lives at `src/features/event-tracker/` and writes to `.hivemind/sessions/`. It integrates with three OpenCode hooks (`text.complete`, `messages.transform`, `session.compacting`) to capture events, classify them, and write structured append-only journals. The design follows CQRS: hooks are read-only interceptors that capture payloads; the session-writer performs durable writes.

**Tech Stack:** TypeScript, Node.js `fs/promises`, OpenCode Plugin SDK (`@opencode-ai/plugin`), Zod via `tool.schema`.

---

## Plan 1: Foundation — Core Types, Paths, and Infrastructure

**Purpose:** Establish the feature skeleton, type definitions, and path utilities for event-tracker.

### Feature Boundaries

- Types for all event, turn, and log-entry shapes
- Path builders for `.hivemind/sessions/` directory tree
- No hook wiring yet
- No file I/O yet

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/event-tracker/types.ts` | All type definitions and Zod schemas |
| `src/features/event-tracker/paths.ts` | Path builders for `sessions/` subdirectories |
| `src/features/event-tracker/index.ts` | Barrel export |

### Files to Modify

| File | Change |
|------|--------|
| `src/shared/paths.ts` | Add `getSessionsPath(sessionId)` function; extend `getEffectivePaths()` |

### Task Breakdown

#### Task 1: Create `src/features/event-tracker/types.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/types.test.ts
import { describe, it, expect } from 'vitest'
import { EventType, Importance, EventEntry, TurnEntry } from './types.js'

describe('event-tracker types', () => {
  describe('EventType', () => {
    it('should have all expected event types', () => {
      expect(EventType.USER_INPUT).equals('USER_INPUT')
      expect(EventType.ASSISTANT_REPLY).equals('ASSISTANT_REPLY')
      expect(EventType.TOOL_INVOCATION).equals('TOOL_INVOCATION')
      expect(EventType.FILE_ACCESS).equals('FILE_ACCESS')
      expect(EventType.DELEGATION_START).equals('DELEGATION_START')
      expect(EventType.DELEGATION_END).equals('DELEGATION_END')
      expect(EventType.ERROR).equals('ERROR')
      expect(EventType.DECISION).equals('DECISION')
      expect(EventType.SESSION_START).equals('SESSION_START')
      expect(EventType.SESSION_END).equals('SESSION_END')
      expect(EventType.COMPACTION).equals('COMPACTION')
    })
  })

  describe('Importance', () => {
    it('should have three tiers', () => {
      expect(Importance.HIGH).equals('HIGH')
      expect(Importance.MEDIUM).equals('MEDIUM')
      expect(Importance.LOW).equals('LOW')
    })
  })

  describe('EventEntry', () => {
    it('should validate a minimal event entry', () => {
      const entry: EventEntry = {
        id: 'evt_001',
        type: EventType.USER_INPUT,
        importance: Importance.HIGH,
        timestamp: '2026-03-23T10:00:00.000Z',
        sessionId: 'ses_abc123',
        turn: 1,
        data: { text: 'Hello' },
      }
      expect(entry.id).equals('evt_001')
    })
  })

  describe('SessionMetadata', () => {
    it('should have correct shape', () => {
      expect(EventType.SESSION_START).equals('SESSION_START')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/types.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write minimal implementation**

```typescript
// src/features/event-tracker/types.ts
/**
 * Event-Tracker Types — All type definitions for the event-tracker feature.
 * @module event-tracker/types
 */

// ---------------------------------------------------------------------------
// Event Type System
// ---------------------------------------------------------------------------

export enum EventType {
  USER_INPUT = 'USER_INPUT',
  ASSISTANT_REPLY = 'ASSISTANT_REPLY',
  TOOL_INVOCATION = 'TOOL_INVOCATION',
  FILE_ACCESS = 'FILE_ACCESS',
  DELEGATION_START = 'DELEGATION_START',
  DELEGATION_END = 'DELEGATION_END',
  ERROR = 'ERROR',
  DECISION = 'DECISION',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  COMPACTION = 'COMPACTION',
}

export enum Importance {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ---------------------------------------------------------------------------
// Event Entry
// ---------------------------------------------------------------------------

export interface EventEntry {
  id: string
  type: EventType
  importance: Importance
  timestamp: string
  sessionId: string
  turn: number
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Turn Entry — a chronological collection of events within a turn
// ---------------------------------------------------------------------------

export interface TurnEntry {
  turn: number
  startedAt: string
  endedAt: string
  events: EventEntry[]
}

// ---------------------------------------------------------------------------
// Session Metadata
// ---------------------------------------------------------------------------

export interface SessionMetadata {
  sessionId: string
  rootSessionId: string | null
  parentSessionId: string | null
  startedAt: string
  lastUpdatedAt: string
  turnCount: number
}

// ---------------------------------------------------------------------------
// Delegation Tracking
// ---------------------------------------------------------------------------

export interface DelegationRecord {
  subSessionId: string
  parentSessionId: string
  startedAt: string
  endedAt: string | null
  status: 'active' | 'completed' | 'failed'
}

// ---------------------------------------------------------------------------
// Master Index
// ---------------------------------------------------------------------------

export interface SessionIndex {
  sessions: SessionMetadata[]
  lastUpdatedAt: string
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/types.ts src/features/event-tracker/types.test.ts
git commit -m "feat(event-tracker): add core types for event, turn, and session shapes"
```

---

#### Task 2: Create `src/features/event-tracker/paths.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/paths.test.ts
import { describe, it, expect } from 'vitest'
import { getSessionDir, getSessionEventsPath, getSessionDiagnosticsPath, getDelegationPath, getMasterIndexPath } from './paths.js'

describe('event-tracker paths', () => {
  const projectRoot = '/test/project'

  it('should build session directory path', () => {
    const path = getSessionDir(projectRoot, 'ses_abc123')
    expect(path).equals('/test/project/.hivemind/sessions/ses_abc123')
  })

  it('should build events.md path', () => {
    const path = getSessionEventsPath(projectRoot, 'ses_abc123')
    expect(path).equals('/test/project/.hivemind/sessions/ses_abc123/events.md')
  })

  it('should build diagnostics.log path', () => {
    const path = getSessionDiagnosticsPath(projectRoot, 'ses_abc123')
    expect(path).equals('/test/project/.hivemind/sessions/ses_abc123/diagnostics.log')
  })

  it('should build delegation.json path', () => {
    const path = getDelegationPath(projectRoot, 'ses_abc123')
    expect(path).equals('/test/project/.hivemind/sessions/ses_abc123/delegation.json')
  })

  it('should build master index path', () => {
    const path = getMasterIndexPath(projectRoot)
    expect(path).equals('/test/project/.hivemind/sessions/index.json')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/paths.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write minimal implementation**

```typescript
// src/features/event-tracker/paths.ts
/**
 * Path builders for .hivemind/sessions/ directory tree.
 * @module event-tracker/paths
 */

import path from 'node:path'
import { HIVEMIND_DIR, SESSIONS_DIR } from '../../shared/paths.js'

const SESSIONS_INNER_DIR = SESSIONS_DIR // 'sessions'

/**
 * Root sessions directory: .hivemind/sessions/
 */
export function getSessionsRoot(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_INNER_DIR)
}

/**
 * Per-session directory: .hivemind/sessions/ses_{id}/
 */
export function getSessionDir(projectRoot: string, sessionId: string): string {
  return path.join(getSessionsRoot(projectRoot), sessionId)
}

/**
 * Events journal: .hivemind/sessions/ses_{id}/events.md
 */
export function getSessionEventsPath(projectRoot: string, sessionId: string): string {
  return path.join(getSessionDir(projectRoot, sessionId), 'events.md')
}

/**
 * Session metadata: .hivemind/sessions/ses_{id}/session.json
 */
export function getSessionMetadataPath(projectRoot: string, sessionId: string): string {
  return path.join(getSessionDir(projectRoot, sessionId), 'session.json')
}

/**
 * Diagnostics log: .hivemind/sessions/ses_{id}/diagnostics.log
 */
export function getSessionDiagnosticsPath(projectRoot: string, sessionId: string): string {
  return path.join(getSessionDir(projectRoot, sessionId), 'diagnostics.log')
}

/**
 * Delegation tracking: .hivemind/sessions/ses_{id}/delegation.json
 */
export function getDelegationPath(projectRoot: string, sessionId: string): string {
  return path.join(getSessionDir(projectRoot, sessionId), 'delegation.json')
}

/**
 * Master session index: .hivemind/sessions/index.json
 */
export function getMasterIndexPath(projectRoot: string): string {
  return path.join(getSessionsRoot(projectRoot), 'index.json')
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/paths.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/paths.ts src/features/event-tracker/paths.test.ts
git commit -m "feat(event-tracker): add path builders for sessions/ directory tree"
```

---

#### Task 3: Modify `src/shared/paths.ts` to add `getSessionsPath()`

**Step 1: Read and understand current state**

Read: `src/shared/paths.ts`

**Step 2: Add `getSessionsPath()` function**

Add after `getErrorLogPath()` (line ~43):

```typescript
/**
 * Sessions root: .hivemind/sessions/
 */
export function getSessionsPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR)
}
```

**Step 3: Add to `getEffectivePaths()` return object**

Add to the return object of `getEffectivePaths()` (around line 78):

```typescript
sessionsRoot: path.join(root, SESSIONS_DIR),
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/shared/paths.ts
git commit -m "feat(shared/paths): add getSessionsPath() for event-tracker"
```

---

#### Task 4: Create `src/features/event-tracker/index.ts` barrel export

**Step 1: Write minimal barrel**

```typescript
// src/features/event-tracker/index.ts
/**
 * Event-Tracker Feature Barrel Export
 * @module event-tracker
 */

export * from './types.js'
export * from './paths.js'
```

**Step 2: Verify exports**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/features/event-tracker/index.ts
git commit -m "feat(event-tracker): add barrel export"
```

---

### Verification Criteria for Plan 1

| Criterion | How to Verify |
|-----------|--------------|
| All types compile without errors | `npx tsc --noEmit src/features/event-tracker/` |
| Path builders resolve correctly | `npx tsx --test src/features/event-tracker/paths.test.ts` |
| Types validate expected shapes | `npx tsx --test src/features/event-tracker/types.test.ts` |
| Barrel exports all public symbols | `npx tsc --noEmit src/features/event-tracker/index.ts` |
| `getSessionsPath()` available in shared | `npx tsc --noEmit` on full project |

---

## Plan 2: Core Writers — Session Writer, Formatter, Classifier

**Purpose:** Implement the three core modules that perform file I/O: session-writer (writes session.json, events.md, diagnostics.log), formatter (renders event entries to markdown or single-line log format), and event-classifier (determines event type and importance from raw hook payloads).

### Feature Boundaries

- session-writer: creates session dirs, writes session.json, appends to events.md, appends to diagnostics.log
- formatter: converts EventEntry → markdown section or single-line log entry
- event-classifier: maps raw hook data → EventType + Importance

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/event-tracker/formatter.ts` | Format events as .md or .log strings |
| `src/features/event-tracker/event-classifier.ts` | Classify raw payloads into EventType + Importance |
| `src/features/event-tracker/session-writer.ts` | All file I/O operations |

### Files to Modify

| File | Change |
|------|--------|
| `src/features/event-tracker/types.ts` | Add formatter output types |

### Task Breakdown

#### Task 5: Extend types with formatter output types

**Step 1: Read current types**

Read: `src/features/event-tracker/types.ts`

**Step 2: Add formatter output types at the bottom**

```typescript
// ---------------------------------------------------------------------------
// Formatter Output Types
// ---------------------------------------------------------------------------

/** Single-line log entry for diagnostics.log */
export interface LogLine {
  timestamp: string
  sessionId: string
  turn: number
  eventType: EventType
  importance: Importance
  summary: string
  dataKeys: string[]
}

/** Markdown section for events.md */
export interface MarkdownSection {
  header: string
  body: string
  metadata: Record<string, string>
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/features/event-tracker/types.ts
git commit -m "feat(event-tracker): add formatter output types"
```

---

#### Task 6: Create `src/features/event-tracker/formatter.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/formatter.test.ts
import { describe, it, expect } from 'vitest'
import { formatEventAsMarkdown, formatEventAsLogLine, formatTurnSection } from './formatter.js'
import { EventType, Importance, EventEntry } from './types.js'

describe('formatter', () => {
  const baseEvent: EventEntry = {
    id: 'evt_001',
    type: EventType.USER_INPUT,
    importance: Importance.HIGH,
    timestamp: '2026-03-23T10:00:00.000Z',
    sessionId: 'ses_abc123',
    turn: 1,
    data: { text: 'Hello world' },
  }

  describe('formatEventAsMarkdown', () => {
    it('should render a USER_INPUT event as markdown section', () => {
      const md = formatEventAsMarkdown(baseEvent)
      expect(md.header).equals('## [10:00:00] USER_INPUT [HIGH]')
      expect(md.metadata).toHaveProperty('id', 'evt_001')
      expect(md.metadata).toHaveProperty('session', 'ses_abc123')
      expect(md.metadata).toHaveProperty('turn', '1')
    })

    it('should truncate long text in body', () => {
      const longEvent: EventEntry = {
        ...baseEvent,
        data: { text: 'A'.repeat(6000) },
      }
      const md = formatEventAsMarkdown(longEvent)
      expect(md.body.length).lessThan(6100)
      expect(md.body).includes('...(truncated)')
    })
  })

  describe('formatEventAsLogLine', () => {
    it('should render a single-line log entry', () => {
      const line = formatEventAsLogLine(baseEvent)
      expect(line.sessionId).equals('ses_abc123')
      expect(line.turn).equals(1)
      expect(line.eventType).equals(EventType.USER_INPUT)
      expect(line.importance).equals(Importance.HIGH)
      expect(line.summary).equals('Hello world')
      expect(line.dataKeys).deep.equals(['text'])
    })

    it('should serialize to a single log line string', () => {
      const line = formatEventAsLogLine(baseEvent)
      const str = `${line.timestamp} | ${line.sessionId} | turn=${line.turn} | ${line.eventType}[${line.importance}] | ${line.summary}`
      expect(str).includes('ses_abc123')
      expect(str).includes('USER_INPUT')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/formatter.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/formatter.ts
/**
 * Formatter — converts EventEntry into markdown sections and log lines.
 * @module event-tracker/formatter
 */

import { EventEntry, EventType, Importance, LogLine, MarkdownSection } from './types.js'

/**
 * Extract a human-readable time from ISO timestamp.
 */
function extractTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  return d.toTimeString().slice(0, 8) // HH:MM:SS
}

/**
 * Summarize event data into a one-line description.
 */
function summarizeData(data: Record<string, unknown>): string {
  const keys = Object.keys(data)
  if (keys.length === 0) return '(no data)'
  if (keys.length === 1) {
    const val = data[keys[0]]
    const str = typeof val === 'string' ? val : JSON.stringify(val)
    return str.slice(0, 200)
  }
  return keys.join(', ')
}

/**
 * Truncate a string to maxChars, appending "...(truncated)" if cut.
 */
function truncate(str: string, maxChars = 5000): string {
  if (str.length <= maxChars) return str
  return str.slice(0, maxChars) + '\n...(truncated)'
}

/**
 * Format an EventEntry as a markdown section for events.md.
 */
export function formatEventAsMarkdown(event: EventEntry): MarkdownSection {
  const time = extractTime(event.timestamp)
  const header = `## [${time}] ${event.type} [${event.importance}]`
  const body = truncate(JSON.stringify(event.data, null, 2))
  const metadata: Record<string, string> = {
    id: event.id,
    session: event.sessionId,
    turn: String(event.turn),
    type: event.type,
    importance: event.importance,
  }
  return { header, body, metadata }
}

/**
 * Format an EventEntry as a structured log line for diagnostics.log.
 */
export function formatEventAsLogLine(event: EventEntry): LogLine {
  return {
    timestamp: event.timestamp,
    sessionId: event.sessionId,
    turn: event.turn,
    eventType: event.type,
    importance: event.importance,
    summary: summarizeData(event.data),
    dataKeys: Object.keys(event.data),
  }
}

/**
 * Serialize a LogLine to a single line for grep-friendly diagnostics.log.
 */
export function serializeLogLine(line: LogLine): string {
  return [
    line.timestamp,
    '|',
    line.sessionId,
    '|',
    `turn=${line.turn}`,
    '|',
    `${line.eventType}[${line.importance}]`,
    '|',
    line.summary,
  ].join(' ')
}

/**
 * Format a turn as a markdown section grouping all events.
 */
export function formatTurnSection(turnNumber: number, events: EventEntry[]): string {
  const sections = events.map(formatEventAsMarkdown)
  const lines: string[] = [
    `# Turn ${turnNumber}`,
    '',
  ]
  for (const sec of sections) {
    lines.push(sec.header)
    lines.push('')
    for (const [k, v] of Object.entries(sec.metadata)) {
      lines.push(`- ${k}: ${v}`)
    }
    lines.push('')
    lines.push(sec.body)
    lines.push('')
  }
  return lines.join('\n')
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/formatter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/formatter.ts src/features/event-tracker/formatter.test.ts
git commit -m "feat(event-tracker): add formatter for markdown and log output"
```

---

#### Task 7: Create `src/features/event-tracker/event-classifier.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/event-classifier.test.ts
import { describe, it, expect } from 'vitest'
import { classifyToolEvent, classifyMessageEvent, classifyDelegationEvent, classifyErrorEvent } from './event-classifier.js'
import { EventType, Importance } from './types.js'

describe('event-classifier', () => {
  describe('classifyToolEvent', () => {
    it('should classify tool invocation as MEDIUM', () => {
      const result = classifyToolEvent({ tool: 'hivemind_task', sessionId: 'ses_abc', turn: 1 })
      expect(result.type).equals(EventType.TOOL_INVOCATION)
      expect(result.importance).equals(Importance.MEDIUM)
    })

    it('should classify file-accessing tools as MEDIUM', () => {
      const result = classifyToolEvent({ tool: 'read', sessionId: 'ses_abc', turn: 1 })
      expect(result.type).equals(EventType.TOOL_INVOCATION)
      expect(result.importance).equals(Importance.MEDIUM)
    })
  })

  describe('classifyMessageEvent', () => {
    it('should classify user message as HIGH', () => {
      const result = classifyMessageEvent({ role: 'user', sessionId: 'ses_abc', turn: 1 })
      expect(result.type).equals(EventType.USER_INPUT)
      expect(result.importance).equals(Importance.HIGH)
    })

    it('should classify assistant reply as HIGH', () => {
      const result = classifyMessageEvent({ role: 'assistant', sessionId: 'ses_abc', turn: 1 })
      expect(result.type).equals(EventType.ASSISTANT_REPLY)
      expect(result.importance).equals(Importance.HIGH)
    })
  })

  describe('classifyDelegationEvent', () => {
    it('should classify DELEGATION_START as HIGH', () => {
      const result = classifyDelegationEvent({ action: 'start', subSessionId: 'ses_child', parentSessionId: 'ses_parent' })
      expect(result.type).equals(EventType.DELEGATION_START)
      expect(result.importance).equals(Importance.HIGH)
    })

    it('should classify DELEGATION_END as HIGH', () => {
      const result = classifyDelegationEvent({ action: 'end', subSessionId: 'ses_child', parentSessionId: 'ses_parent' })
      expect(result.type).equals(EventType.DELEGATION_END)
      expect(result.importance).equals(Importance.HIGH)
    })
  })

  describe('classifyErrorEvent', () => {
    it('should classify errors as HIGH importance', () => {
      const result = classifyErrorEvent({ error: new Error('test'), sessionId: 'ses_abc', turn: 1 })
      expect(result.type).equals(EventType.ERROR)
      expect(result.importance).equals(Importance.HIGH)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/event-classifier.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/event-classifier.ts
/**
 * Event Classifier — maps raw hook payloads to EventType + Importance.
 * @module event-tracker/event-classifier
 */

import { randomUUID } from 'node:crypto'
import { EventType, Importance, EventEntry } from './types.js'

// ---------------------------------------------------------------------------
// Classifier Input Types (raw hook payloads)
// ---------------------------------------------------------------------------

export interface ToolEventInput {
  tool: string
  sessionId: string
  turn: number
  timestamp?: string
}

export interface MessageEventInput {
  role: 'user' | 'assistant' | 'system'
  sessionId: string
  turn: number
  text?: string
  timestamp?: string
}

export interface DelegationEventInput {
  action: 'start' | 'end'
  subSessionId: string
  parentSessionId: string
  timestamp?: string
}

export interface ErrorEventInput {
  error: Error
  sessionId: string
  turn: number
  timestamp?: string
}

// ---------------------------------------------------------------------------
// Classifier Output
// ---------------------------------------------------------------------------

export interface ClassifiedEvent {
  type: EventType
  importance: Importance
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Classifiers
// ---------------------------------------------------------------------------

/**
 * Classify a tool execution event.
 */
export function classifyToolEvent(input: ToolEventInput): ClassifiedEvent {
  const FILE_ACCESS_TOOLS = new Set(['read', 'write', 'edit', 'glob', 'grep', 'bash'])
  const type = FILE_ACCESS_TOOLS.has(input.tool)
    ? EventType.FILE_ACCESS
    : EventType.TOOL_INVOCATION
  const importance = type === EventType.FILE_ACCESS ? Importance.MEDIUM : Importance.LOW
  return { type, importance, data: { tool: input.tool } }
}

/**
 * Classify a chat message event.
 */
export function classifyMessageEvent(input: MessageEventInput): ClassifiedEvent {
  const type = input.role === 'user' ? EventType.USER_INPUT : EventType.ASSISTANT_REPLY
  const importance = Importance.HIGH
  return { type, importance, data: { role: input.role, textLength: input.text?.length ?? 0 } }
}

/**
 * Classify a delegation event (sub-session start/end).
 */
export function classifyDelegationEvent(input: DelegationEventInput): ClassifiedEvent {
  const type = input.action === 'start' ? EventType.DELEGATION_START : EventType.DELEGATION_END
  const importance = Importance.HIGH
  return {
    type,
    importance,
    data: { subSessionId: input.subSessionId, parentSessionId: input.parentSessionId },
  }
}

/**
 * Classify an error event.
 */
export function classifyErrorEvent(input: ErrorEventInput): ClassifiedEvent {
  return {
    type: EventType.ERROR,
    importance: Importance.HIGH,
    data: { message: input.error.message, name: input.error.name },
  }
}

/**
 * Build a full EventEntry from a classified result.
 */
export function buildEventEntry(
  classified: ClassifiedEvent,
  input: { sessionId: string; turn: number; timestamp?: string },
): EventEntry {
  return {
    id: `evt_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    type: classified.type,
    importance: classified.importance,
    timestamp: input.timestamp ?? new Date().toISOString(),
    sessionId: input.sessionId,
    turn: input.turn,
    data: classified.data,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/event-classifier.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/event-classifier.ts src/features/event-tracker/event-classifier.test.ts
git commit -m "feat(event-tracker): add event classifier for hook payloads"
```

---

#### Task 8: Create `src/features/event-tracker/session-writer.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/session-writer.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeSessionInit, appendEvent, writeDelegationRecord, updateSessionTurnCount } from './session-writer.js'
import { SessionMetadata, DelegationRecord } from './types.js'
import { getSessionDir, getMasterIndexPath } from './paths.js'

describe('session-writer', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-et-writer-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  describe('writeSessionInit', () => {
    it('should create session directory and session.json', async () => {
      const metadata: SessionMetadata = {
        sessionId: 'ses_test001',
        rootSessionId: null,
        parentSessionId: null,
        startedAt: '2026-03-23T10:00:00.000Z',
        lastUpdatedAt: '2026-03-23T10:00:00.000Z',
        turnCount: 0,
      }
      const path = await writeSessionInit(projectRoot, metadata)
      expect(path).equals(join(projectRoot, '.hivemind', 'sessions', 'ses_test001', 'session.json'))
      // Verify file exists by reading it back
      const { readFile } = await import('node:fs/promises')
      const content = await readFile(path, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.sessionId).equals('ses_test001')
    })
  })

  describe('appendEvent', () => {
    it('should append markdown event to events.md', async () => {
      const metadata: SessionMetadata = {
        sessionId: 'ses_test002',
        rootSessionId: null,
        parentSessionId: null,
        startedAt: '2026-03-23T10:00:00.000Z',
        lastUpdatedAt: '2026-03-23T10:00:00.000Z',
        turnCount: 1,
      }
      await writeSessionInit(projectRoot, metadata)

      const { EventEntry, EventType, Importance } = await import('./types.js')
      const entry: EventEntry = {
        id: 'evt_test001',
        type: EventType.USER_INPUT,
        importance: Importance.HIGH,
        timestamp: '2026-03-23T10:00:01.000Z',
        sessionId: 'ses_test002',
        turn: 1,
        data: { text: 'Hello' },
      }
      await appendEvent(projectRoot, entry)

      const { readFile } = await import('node:fs/promises')
      const eventsMd = await readFile(join(getSessionDir(projectRoot, 'ses_test002'), 'events.md'), 'utf-8')
      expect(eventsMd).includes('USER_INPUT')
      expect(eventsMd).includes('Hello')
    })
  })

  describe('updateSessionTurnCount', () => {
    it('should update turnCount in session.json', async () => {
      const metadata: SessionMetadata = {
        sessionId: 'ses_test003',
        rootSessionId: null,
        parentSessionId: null,
        startedAt: '2026-03-23T10:00:00.000Z',
        lastUpdatedAt: '2026-03-23T10:00:00.000Z',
        turnCount: 0,
      }
      await writeSessionInit(projectRoot, metadata)
      await updateSessionTurnCount(projectRoot, 'ses_test003', 5)

      const { readFile } = await import('node:fs/promises')
      const content = await readFile(join(getSessionDir(projectRoot, 'ses_test003'), 'session.json'), 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.turnCount).equals(5)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/session-writer.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/session-writer.ts
/**
 * Session Writer — all file I/O for the event-tracker.
 * Writes session.json, events.md (append), diagnostics.log (append), delegation.json.
 * @module event-tracker/session-writer
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import {
  getSessionDir,
  getSessionEventsPath,
  getSessionDiagnosticsPath,
  getSessionMetadataPath,
  getDelegationPath,
  getMasterIndexPath,
} from './paths.js'
import { SessionMetadata, EventEntry, DelegationRecord, SessionIndex, EventType } from './types.js'
import { formatEventAsMarkdown, formatEventAsLogLine, serializeLogLine } from './formatter.js'

// ---------------------------------------------------------------------------
// Session Initialization
// ---------------------------------------------------------------------------

/**
 * Create session directory and write initial session.json.
 * Returns the path to the written session.json.
 */
export async function writeSessionInit(
  projectRoot: string,
  metadata: SessionMetadata,
): Promise<string> {
  const sessionDir = getSessionDir(projectRoot, metadata.sessionId)
  const metadataPath = getSessionMetadataPath(projectRoot, metadata.sessionId)

  await fs.mkdir(sessionDir, { recursive: true })

  // Write empty events.md header
  const eventsPath = getSessionEventsPath(projectRoot, metadata.sessionId)
  const eventsHeader = `# Session Journal — ${metadata.sessionId}\n\nStarted: ${metadata.startedAt}\n\n---\n\n`
  await fs.writeFile(eventsPath, eventsHeader)

  // Write empty diagnostics.log header
  const diagPath = getSessionDiagnosticsPath(projectRoot, metadata.sessionId)
  const diagHeader = `# diagnostics.log — session ${metadata.sessionId}\n# timestamp | session_id | turn | event_type[importance] | summary\n`
  await fs.writeFile(diagPath, diagHeader)

  // Write session.json
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

  // Upsert master index
  await upsertMasterIndex(projectRoot, metadata)

  return metadataPath
}

/**
 * Upsert a session into the master index.
 */
async function upsertMasterIndex(projectRoot: string, metadata: SessionMetadata): Promise<void> {
  const indexPath = getMasterIndexPath(projectRoot)
  let index: SessionIndex

  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    index = { sessions: [], lastUpdatedAt: new Date().toISOString() }
  }

  // Replace or append
  const existingIdx = index.sessions.findIndex((s) => s.sessionId === metadata.sessionId)
  if (existingIdx >= 0) {
    index.sessions[existingIdx] = metadata
  } else {
    index.sessions.push(metadata)
  }

  index.lastUpdatedAt = new Date().toISOString()
  await fs.mkdir(path.dirname(indexPath), { recursive: true })
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2))
}

// ---------------------------------------------------------------------------
// Event Appending
// ---------------------------------------------------------------------------

/**
 * Append an event to both events.md (markdown) and diagnostics.log (single-line).
 */
export async function appendEvent(projectRoot: string, entry: EventEntry): Promise<void> {
  const eventsPath = getSessionEventsPath(projectRoot, entry.sessionId)
  const diagPath = getSessionDiagnosticsPath(projectRoot, entry.sessionId)

  // Append markdown section
  const md = formatEventAsMarkdown(entry)
  const mdLines = [
    '',
    md.header,
    '',
    ...Object.entries(md.metadata).map(([k, v]) => `- **${k}**: ${v}`),
    '',
    '```json',
    md.body,
    '```',
  ].join('\n')
  await fs.appendFile(eventsPath, mdLines + '\n')

  // Append single-line log entry
  const logLine = formatEventAsLogLine(entry)
  await fs.appendFile(diagPath, serializeLogLine(logLine) + '\n')
}

// ---------------------------------------------------------------------------
// Session Metadata Updates
// ---------------------------------------------------------------------------

/**
 * Update the turn count in session.json.
 */
export async function updateSessionTurnCount(
  projectRoot: string,
  sessionId: string,
  turnCount: number,
): Promise<void> {
  const metadataPath = getSessionMetadataPath(projectRoot, sessionId)
  const content = await fs.readFile(metadataPath, 'utf-8')
  const metadata: SessionMetadata = JSON.parse(content)
  metadata.turnCount = turnCount
  metadata.lastUpdatedAt = new Date().toISOString()
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
}

// ---------------------------------------------------------------------------
// Delegation Records
// ---------------------------------------------------------------------------

/**
 * Write a delegation record (sub-session start/end) to delegation.json.
 */
export async function writeDelegationRecord(
  projectRoot: string,
  parentSessionId: string,
  record: DelegationRecord,
): Promise<void> {
  const delegationPath = getDelegationPath(projectRoot, parentSessionId)
  let records: DelegationRecord[]

  try {
    const content = await fs.readFile(delegationPath, 'utf-8')
    records = JSON.parse(content)
  } catch {
    records = []
  }

  // Replace or append
  const existingIdx = records.findIndex((r) => r.subSessionId === record.subSessionId)
  if (existingIdx >= 0) {
    records[existingIdx] = record
  } else {
    records.push(record)
  }

  await fs.writeFile(delegationPath, JSON.stringify(records, null, 2))
}

/**
 * Read delegation records for a session.
 */
export async function readDelegationRecords(
  projectRoot: string,
  parentSessionId: string,
): Promise<DelegationRecord[]> {
  const delegationPath = getDelegationPath(projectRoot, parentSessionId)
  try {
    const content = await fs.readFile(delegationPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/session-writer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/session-writer.ts src/features/event-tracker/session-writer.test.ts
git commit -m "feat(event-tracker): add session writer for all file I/O operations"
```

---

### Verification Criteria for Plan 2

| Criterion | How to Verify |
|-----------|--------------|
| Formatter produces valid markdown | `npx tsx --test src/features/event-tracker/formatter.test.ts` |
| Formatter produces grep-friendly log lines | `npx tsx --test src/features/event-tracker/formatter.test.ts` |
| Classifier maps all payload types | `npx tsx --test src/features/event-tracker/event-classifier.test.ts` |
| Session writer creates correct directory structure | `npx tsx --test src/features/event-tracker/session-writer.test.ts` |
| events.md is append-only | Manual verify events grow on multiple `appendEvent` calls |
| diagnostics.log is single-line entries | Manual verify `grep` works on log output |
| Full project type-checks | `npx tsc --noEmit` |

---

## Plan 3: Hook Integration — Handlers for text.complete, messages.transform, compaction

**Purpose:** Wire event-tracker into OpenCode hooks. Create three handlers: one for `text.complete` (main per-turn event capture), one for `messages.transform` (store injection payload for later), and one for `session.compacting` (track compaction events). Also create the index-writer module that maintains the master `index.json`.

### Feature Boundaries

- `transform-handler.ts`: implements `messages.transform` hook — stores injection payload in memory store
- `text-complete-handler.ts`: implements `text.complete` hook — captures ASSISTANT_REPLY + TOOL events
- `compaction-handler.ts`: implements `session.compacting` hook — captures COMPACTION events
- `index-writer.ts`: maintains master `index.json` with active session list

### Files to Create

| File | Purpose |
|------|---------|
| `src/features/event-tracker/hooks/transform-handler.ts` | messages.transform hook adapter |
| `src/features/event-tracker/hooks/text-complete-handler.ts` | text.complete hook adapter |
| `src/features/event-tracker/hooks/compaction-handler.ts` | session.compacting hook adapter |
| `src/features/event-tracker/hooks/index.ts` | Hook barrel export |
| `src/features/event-tracker/index-writer.ts` | Master index maintenance |

### Files to Modify

| File | Change |
|------|--------|
| `src/features/event-tracker/index.ts` | Add index-writer export |

### Task Breakdown

#### Task 9: Create `src/features/event-tracker/hooks/transform-handler.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/hooks/transform-handler.test.ts
import { describe, it, expect } from 'vitest'
import { createTransformHandler } from './transform-handler.js'

describe('transform-handler', () => {
  it('should export a function that returns a hook object', () => {
    const handler = createTransformHandler({ directory: '/test' })
    expect(typeof handler).equals('function')
    // Hook should accept (input, output) and not throw
    expect(() => handler({ sessionID: 'ses_test' }, { messages: [] })).to.not.throw()
  })

  it('should store injection payload for later retrieval', async () => {
    const storedPayloads = new Map<string, unknown>()
    const handler = createTransformHandler({
      directory: '/test',
      onPayloadStored: (sessionId, payload) => {
        storedPayloads.set(sessionId, payload)
      },
    })

    const testPayload = {
      purposeClass: 'research',
      sessionState: 'active',
      agent: 'hivefiver',
      variant: 'default',
      sessionRole: 'primary',
      skillBundle: [],
      skillFocusBlock: '',
      turnHierarchyBlock: '',
      contextBlock: '',
    }

    handler({ sessionID: 'ses_test123' }, {
      messages: [],
      // Simulate the injection payload being set
    })

    // The handler should call onPayloadStored
    expect(storedPayloads.has('ses_test123')).equals(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/hooks/transform-handler.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/hooks/transform-handler.ts
/**
 * messages.transform Hook Adapter
 * Captures injection payloads from the transform hook for later use in text.complete.
 * @module event-tracker/hooks/transform-handler
 */

import type { HookHandler, SessionMessage } from '../../plugin-contracts.js'

export interface TransformHandlerDeps {
  directory: string
  onPayloadStored?: (sessionId: string, payload: unknown) => void
}

// In-memory store for injection payloads per session.
// This is safe because OpenCode runs serially per session.
const injectionPayloads = new Map<string, unknown>()

/**
 * Get and clear the stored injection payload for a session.
 */
export function getAndClearInjectionPayload(sessionId: string): unknown | undefined {
  const payload = injectionPayloads.get(sessionId)
  injectionPayloads.delete(sessionId)
  return payload
}

/**
 * Create the messages.transform hook handler.
 * 
 * The `messages.transform` hook runs before the message history is rendered.
 * We intercept the hook to capture the injection payload that was built by
 * other parts of the system (start-work, context-renderer, etc.).
 * 
 * This handler is intentionally read-only — it captures state but does not
 * write anything to .hivemind/ (that happens in text.complete).
 */
export function createTransformHandler(deps: TransformHandlerDeps) {
  return async function transformHandler(
    input: { sessionID: string; messages?: SessionMessage[] },
    output: { messages?: SessionMessage[] },
  ): Promise<void> {
    // Extract injection-related metadata from messages if present.
    // The actual payload is built by context-renderer and stored via
    // the injection-store (plugin/injection-store.ts).
    // Here we just capture the sessionId for later correlation.
    if (!input.sessionID) return

    // The real injection payload is stored in injection-store.ts.
    // This handler serves as a correlation point — we could extract
    // session metadata here if needed. For now, the payload is
    // captured in text.complete via getAndClearInjectionPayload().
    deps.onPayloadStored?.(input.sessionID, { captured: true, timestamp: new Date().toISOString() })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/hooks/transform-handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/hooks/transform-handler.ts src/features/event-tracker/hooks/transform-handler.test.ts
git commit -m "feat(event-tracker): add messages.transform hook handler"
```

---

#### Task 10: Create `src/features/event-tracker/hooks/text-complete-handler.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/hooks/text-complete-handler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTextCompleteHandler } from './text-complete-handler.js'
import * as sessionWriter from '../session-writer.js'
import * as eventClassifier from '../event-classifier.js'

describe('text-complete-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a handler function', () => {
    const handler = createTextCompleteHandler({ directory: '/test' })
    expect(typeof handler).equals('function')
  })

  it('should call appendEvent with ASSISTANT_REPLY on valid completion', async () => {
    const appendEventSpy = vi.spyOn(sessionWriter, 'appendEvent').mockResolvedValue()
    vi.spyOn(eventClassifier, 'classifyMessageEvent').mockReturnValue({
      type: 'ASSISTANT_REPLY',
      importance: 'HIGH',
      data: {},
    })
    vi.spyOn(eventClassifier, 'buildEventEntry').mockReturnValue({
      id: 'evt_test',
      type: 'ASSISTANT_REPLY',
      importance: 'HIGH',
      timestamp: '2026-03-23T10:00:00.000Z',
      sessionId: 'ses_test',
      turn: 1,
      data: {},
    })

    const handler = createTextCompleteHandler({ directory: '/test' })
    await handler(
      { sessionID: 'ses_test' },
      { text: 'Hello from assistant' }
    )

    expect(appendEventSpy).toHaveBeenCalled()
  })

  it('should skip when sessionId is missing', async () => {
    const appendEventSpy = vi.spyOn(sessionWriter, 'appendEvent').mockResolvedValue()
    const handler = createTextCompleteHandler({ directory: '/test' })
    await handler({ sessionID: '' }, { text: 'Hello' })
    expect(appendEventSpy).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/hooks/text-complete-handler.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/hooks/text-complete-handler.ts
/**
 * text.complete Hook Adapter
 * Watches for assistant completions and writes ASSISTANT_REPLY events.
 * @module event-tracker/hooks/text-complete-handler
 */

import { randomUUID } from 'node:crypto'
import { EventType, Importance, EventEntry } from '../types.js'
import { buildEventEntry, classifyMessageEvent } from '../event-classifier.js'
import { appendEvent, writeSessionInit, updateSessionTurnCount } from '../session-writer.js'
import { SessionMetadata } from '../types.js'

export interface TextCompleteHandlerDeps {
  directory: string
  getInjectionPayload?: (sessionId: string) => unknown
  getCurrentTurn?: (sessionId: string) => number
}

const turnCounters = new Map<string, number>()

/**
 * Create the experimental.text.complete hook handler.
 * 
 * Hook signature: (input, output) => Promise<void>
 * - input.sessionID: the current session ID
 * - output.text: the completed assistant text
 */
export function createTextCompleteHandler(deps: TextCompleteHandlerDeps) {
  return async function textCompleteHandler(
    input: { sessionID?: string },
    output: { text?: string | { toString(): string } },
  ): Promise<void> {
    const sessionId = input.sessionID
    if (!sessionId) return

    const text = typeof output.text === 'string' ? output.text : output.text?.toString() ?? ''
    if (text.length === 0) return

    // Get or initialize turn counter
    const turn = (deps.getCurrentTurn?.(sessionId) ?? turnCounters.get(sessionId) ?? 0) + 1
    turnCounters.set(sessionId, turn)

    // Ensure session is initialized
    const sessionDir = await ensureSessionExists(deps.directory, sessionId)

    // Get injection payload if available
    const injection = deps.getInjectionPayload?.(sessionId)

    // Build and write ASSISTANT_REPLY event
    const classified = classifyMessageEvent({ role: 'assistant', sessionId, turn })
    const event: EventEntry = {
      id: `evt_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      type: classified.type,
      importance: classified.importance,
      timestamp: new Date().toISOString(),
      sessionId,
      turn,
      data: {
        textLength: text.length,
        textPreview: text.slice(0, 200),
        hasInjection: !!injection,
      },
    }
    await appendEvent(deps.directory, event)

    // Update turn count in session metadata
    await updateSessionTurnCount(deps.directory, sessionId, turn)
  }
}

/**
 * Ensure a session directory exists, creating it if necessary.
 * Returns the session directory path.
 */
async function ensureSessionExists(directory: string, sessionId: string): Promise<string> {
  const { getSessionDir } = await import('../paths.js')
  const { getSessionMetadataPath } = await import('../paths.js')
  const { existsSync } = await import('node:fs')
  const metadataPath = getSessionMetadataPath(directory, sessionId)

  if (!existsSync(metadataPath)) {
    const metadata: SessionMetadata = {
      sessionId,
      rootSessionId: null,
      parentSessionId: null,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      turnCount: 0,
    }
    await writeSessionInit(directory, metadata)
  }

  return getSessionDir(directory, sessionId)
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/hooks/text-complete-handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/hooks/text-complete-handler.ts src/features/event-tracker/hooks/text-complete-handler.test.ts
git commit -m "feat(event-tracker): add text.complete hook handler for assistant events"
```

---

#### Task 11: Create `src/features/event-tracker/hooks/compaction-handler.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/hooks/compaction-handler.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createCompactionHandler } from './compaction-handler.js'
import * as sessionWriter from '../session-writer.js'

describe('compaction-handler', () => {
  it('should create a handler function', () => {
    const handler = createCompactionHandler({ directory: '/test' })
    expect(typeof handler).equals('function')
  })

  it('should write COMPACTION event on compaction', async () => {
    const appendEventSpy = vi.spyOn(sessionWriter, 'appendEvent').mockResolvedValue()
    vi.spyOn(sessionWriter, 'updateSessionTurnCount').mockResolvedValue()

    const handler = createCompactionHandler({ directory: '/test' })
    await handler({ sessionID: 'ses_compact' }, { reason: 'context_limit' })

    expect(appendEventSpy).toHaveBeenCalled()
    const call = appendEventSpy.mock.calls[0]
    expect(call[0]).equals('ses_compact')
    expect(call[1].type).equals('COMPACTION')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/hooks/compaction-handler.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/hooks/compaction-handler.ts
/**
 * session.compacting Hook Adapter
 * Records COMPACTION events when OpenCode compacts a session.
 * @module event-tracker/hooks/compaction-handler
 */

import { randomUUID } from 'node:crypto'
import { EventType, Importance, EventEntry } from '../types.js'
import { appendEvent } from '../session-writer.js'

export interface CompactionHandlerDeps {
  directory: string
}

const sessionTurnMap = new Map<string, number>()

/**
 * Create the experimental.session.compacting hook handler.
 */
export function createCompactionHandler(deps: CompactionHandlerDeps) {
  return async function compactionHandler(
    input: { sessionID?: string },
    output?: { reason?: string },
  ): Promise<void> {
    const sessionId = input.sessionID
    if (!sessionId) return

    const turn = sessionTurnMap.get(sessionId) ?? 1

    const event: EventEntry = {
      id: `evt_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      type: EventType.COMPACTION,
      importance: Importance.MEDIUM,
      timestamp: new Date().toISOString(),
      sessionId,
      turn,
      data: { reason: output?.reason ?? 'unknown' },
    }

    await appendEvent(deps.directory, event)
  }
}

/**
 * Increment and return the turn count for a session.
 */
export function incrementSessionTurn(sessionId: string): number {
  const current = sessionTurnMap.get(sessionId) ?? 0
  const next = current + 1
  sessionTurnMap.set(sessionId, next)
  return next
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/hooks/compaction-handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/hooks/compaction-handler.ts src/features/event-tracker/hooks/compaction-handler.test.ts
git commit -m "feat(event-tracker): add session.compacting hook handler"
```

---

#### Task 12: Create `src/features/event-tracker/hooks/index.ts` barrel export

**Step 1: Write the barrel**

```typescript
// src/features/event-tracker/hooks/index.ts
/**
 * Event-Tracker Hooks Barrel Export
 * @module event-tracker/hooks
 */

export * from './transform-handler.js'
export * from './text-complete-handler.js'
export * from './compaction-handler.js'
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/features/event-tracker/hooks/index.ts
git commit -m "feat(event-tracker): add hooks barrel export"
```

---

#### Task 13: Create `src/features/event-tracker/index-writer.ts`

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/index-writer.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { updateMasterIndex, getActiveSessions } from './index-writer.js'
import { SessionMetadata } from './types.js'

describe('index-writer', () => {
  let projectRoot: string

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-idx-writer-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  describe('updateMasterIndex', () => {
    it('should create index.json if it does not exist', async () => {
      const metadata: SessionMetadata = {
        sessionId: 'ses_idx001',
        rootSessionId: null,
        parentSessionId: null,
        startedAt: '2026-03-23T10:00:00.000Z',
        lastUpdatedAt: '2026-03-23T10:00:00.000Z',
        turnCount: 1,
      }
      await updateMasterIndex(projectRoot, metadata)

      const { readFile } = await import('node:fs/promises')
      const content = await readFile(join(projectRoot, '.hivemind', 'sessions', 'index.json'), 'utf-8')
      const index = JSON.parse(content)
      expect(index.sessions).toHaveLength(1)
      expect(index.sessions[0].sessionId).equals('ses_idx001')
    })

    it('should update existing session entry', async () => {
      const metadata1: SessionMetadata = {
        sessionId: 'ses_idx002',
        rootSessionId: null,
        parentSessionId: null,
        startedAt: '2026-03-23T10:00:00.000Z',
        lastUpdatedAt: '2026-03-23T10:00:00.000Z',
        turnCount: 1,
      }
      await updateMasterIndex(projectRoot, metadata1)

      const metadata2: SessionMetadata = { ...metadata1, turnCount: 5, lastUpdatedAt: '2026-03-23T11:00:00.000Z' }
      await updateMasterIndex(projectRoot, metadata2)

      const sessions = await getActiveSessions(projectRoot)
      expect(sessions).toHaveLength(1)
      expect(sessions[0].turnCount).equals(5)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/index-writer.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/index-writer.ts
/**
 * Master Index Writer — maintains .hivemind/sessions/index.json
 * @module event-tracker/index-writer
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getMasterIndexPath } from './paths.js'
import { SessionMetadata, SessionIndex } from './types.js'

/**
 * Update the master index with a session's latest metadata.
 * Creates the index if it doesn't exist.
 */
export async function updateMasterIndex(
  projectRoot: string,
  metadata: SessionMetadata,
): Promise<void> {
  const indexPath = getMasterIndexPath(projectRoot)
  let index: SessionIndex

  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    index = JSON.parse(content)
  } catch {
    index = { sessions: [], lastUpdatedAt: new Date().toISOString() }
  }

  // Replace or append
  const existingIdx = index.sessions.findIndex((s) => s.sessionId === metadata.sessionId)
  if (existingIdx >= 0) {
    index.sessions[existingIdx] = metadata
  } else {
    index.sessions.push(metadata)
  }

  index.lastUpdatedAt = new Date().toISOString()
  await fs.mkdir(path.dirname(indexPath), { recursive: true })
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2))
}

/**
 * Get all active sessions from the master index.
 */
export async function getActiveSessions(projectRoot: string): Promise<SessionMetadata[]> {
  const indexPath = getMasterIndexPath(projectRoot)
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    const index: SessionIndex = JSON.parse(content)
    return index.sessions
  } catch {
    return []
  }
}

/**
 * Get a specific session's metadata from the index.
 */
export async function getSessionMetadata(
  projectRoot: string,
  sessionId: string,
): Promise<SessionMetadata | null> {
  const sessions = await getActiveSessions(projectRoot)
  return sessions.find((s) => s.sessionId === sessionId) ?? null
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/index-writer.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/index-writer.ts src/features/event-tracker/index-writer.test.ts
git commit -m "feat(event-tracker): add master index writer"
```

---

#### Task 14: Update `src/features/event-tracker/index.ts` barrel export

**Step 1: Read current barrel**

Read: `src/features/event-tracker/index.ts`

**Step 2: Update barrel to include new exports**

```typescript
// src/features/event-tracker/index.ts
/**
 * Event-Tracker Feature Barrel Export
 * @module event-tracker
 */

export * from './types.js'
export * from './paths.js'
export * from './session-writer.js'
export * from './formatter.js'
export * from './event-classifier.js'
export * from './index-writer.js'
export * from './hooks/index.js'
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/features/event-tracker/index.ts
git commit -m "feat(event-tracker): update barrel with all feature exports"
```

---

### Verification Criteria for Plan 3

| Criterion | How to Verify |
|-----------|--------------|
| All hook handlers compile | `npx tsc --noEmit src/features/event-tracker/` |
| Hook handlers are wireable to OpenCode SDK hooks | Manual review — handlers match expected hook signatures |
| Index writer maintains consistent index | `npx tsx --test src/features/event-tracker/index-writer.test.ts` |
| Full project type-checks | `npx tsc --noEmit` |
| No hooks write to disk directly (they delegate to session-writer) | Code review — hooks call session-writer functions only |

---

## Plan 4: Migration — Migrate error-log → sessions/, Cleanup Legacy

**Purpose:** Replace the old `diagnostic-log.ts` (which writes to `.hivemind/error-log/`) with event-tracker, and update the `opencode-plugin.ts` to wire the new handlers instead of the old functions.

### Feature Boundaries

- Migrate `writeDiagnosticLog` calls → event-tracker `appendEvent`
- Migrate session-init on startup → event-tracker `writeSessionInit`
- Remove error-log directory footprint
- Update plugin assembly to use new handlers

### Files to Modify

| File | Change |
|------|--------|
| `src/plugin/opencode-plugin.ts` | Wire new hook handlers instead of old `writeDiagnosticLog`/`upsertSessionInspectionExport` |
| `src/sdk-supervisor/diagnostic-log.ts` | Deprecate — keep for compatibility during migration, point to event-tracker |
| `src/sdk-supervisor/index.ts` | Remove diagnostic-log export or mark deprecated |
| `src/shared/paths.ts` | Remove `getErrorLogPath()` after migration (or keep for cleanup) |

### Task Breakdown

#### Task 15: Update `opencode-plugin.ts` to wire event-tracker hooks

**Step 1: Read current plugin assembly**

Read: `src/plugin/opencode-plugin.ts`

**Step 2: Add event-tracker hook imports**

Add after existing imports:

```typescript
import { createTextCompleteHandler, createCompactionHandler, createTransformHandler } from '../features/event-tracker/hooks/index.js'
import { appendEvent, writeSessionInit } from '../features/event-tracker/session-writer.js'
import { buildEventEntry, classifyMessageEvent } from '../features/event-tracker/event-classifier.js'
import { getAndClearInjectionPayload } from '../plugin/injection-store.js'
import { randomUUID } from 'node:crypto'
import { EventType, Importance, EventEntry } from '../features/event-tracker/types.js'
```

**Step 3: Replace the `experimental.text.complete` hook body**

Replace the current `experimental.text.complete` hook (lines 165-202) with:

```typescript
'experimental.text.complete': async (input, output) => {
  const sessionId = input.sessionID
  const assistantText = typeof output.text === 'string' ? output.text : ''

  if (!sessionId || assistantText.length === 0) {
    return
  }

  // Initialize session if first completion
  await writeSessionInit(directory, {
    sessionId,
    rootSessionId: null,
    parentSessionId: null,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    turnCount: 0,
  }).catch(() => undefined)

  // Write ASSISTANT_REPLY event
  const classified = classifyMessageEvent({ role: 'assistant', sessionId, turn: 1 })
  const event: EventEntry = {
    id: `evt_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    type: classified.type,
    importance: classified.importance,
    timestamp: new Date().toISOString(),
    sessionId,
    turn: 1,
    data: {
      textLength: assistantText.length,
      textPreview: assistantText.slice(0, 200),
    },
  }
  await appendEvent(directory, event).catch(() => undefined)

  // Keep legacy session-inspection export for backward compat during migration
  void upsertSessionInspectionExport(directory, {
    sessionId,
    assistantText,
  }).catch(() => undefined)

  // Keep legacy diagnostic-log for backward compat during migration
  const snapshot = await turnSnapshot.getSnapshot()
  const injection = getAndClearInjectionPayload(sessionId)
  void writeDiagnosticLog(directory, {
    sessionId,
    timestamp: new Date().toISOString(),
    assistantText,
    purpose: snapshot.defaultPurposeClass,
    sessionState: snapshot.entryState,
    trajectory: snapshot.trajectoryId ?? 'none',
    workflow: snapshot.workflowId ?? 'none',
    agent: snapshot.preferredUserName ?? 'hivefiver',
    injection: injection as Parameters<typeof writeDiagnosticLog>[1]['injection'],
  }).catch(() => undefined)
},
```

**Step 4: Add `experimental.chat.messages.transform` handler**

Add the new transform handler to the return object:

```typescript
'experimental.chat.messages.transform': createTransformHandler({ directory }),
```

**Step 5: Add `experimental.session.compacting` handler**

Add the new compaction handler:

```typescript
'experimental.session.compacting': createCompactionHandler({ directory }),
```

**Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors (may have warnings about unused imports — fine for now)

**Step 7: Commit**

```bash
git add src/plugin/opencode-plugin.ts
git commit -m "refactor(plugin): wire event-tracker hooks alongside legacy exports during migration"
```

---

#### Task 16: Deprecate diagnostic-log.ts (point to event-tracker)

**Step 1: Read current diagnostic-log.ts**

Read: `src/sdk-supervisor/diagnostic-log.ts`

**Step 2: Add deprecation notice and redirect comment**

Add at the top of the file:

```typescript
/**
 * @deprecated Use event-tracker/session-writer.ts instead.
 * This module is kept during migration for backward compatibility.
 * Will be removed after full migration to event-tracker.
 */
```

**Step 3: Mark the sdk-supervisor/index.ts if needed**

Read: `src/sdk-supervisor/index.ts`

Add export of diagnostic-log (keep it for now, it's used in plugin):

```typescript
export * from './diagnostic-log.js'
```

**Step 4: Commit**

```bash
git add src/sdk-supervisor/diagnostic-log.ts
git commit -m "deprecate(diagnostic-log): mark for removal after event-tracker migration"
```

---

#### Task 17: Remove error-log directory after confirming event-tracker works

**Step 1: Add cleanup helper in shared/paths.ts**

Add a new function:

```typescript
/**
 * @deprecated Only used during migration cleanup. Remove after migration.
 */
export function getErrorLogPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, 'error-log')
}
```

**Step 2: Document migration path**

Create a note: `docs/migration/event-tracker-migration.md` (if docs directory exists)

**Step 3: Commit**

```bash
git add src/shared/paths.ts
git commit -m "chore(shared/paths): keep getErrorLogPath during migration"
```

---

### Verification Criteria for Plan 4

| Criterion | How to Verify |
|-----------|--------------|
| Plugin compiles with new hooks | `npx tsc --noEmit src/plugin/opencode-plugin.ts` |
| Legacy diagnostic-log still works during migration | Run full test suite: `npm test` |
| error-log directory is not actively written to | Code review — new code uses event-tracker only |
| Full project type-checks | `npx tsc --noEmit` |
| Session files appear in `.hivemind/sessions/` after a completion | Manual test with a real OpenCode session |

---

## Plan 5: Session-Inspection Integration — Keep Purification, Migrate State

**Purpose:** Migrate session-inspection to store state in `.hivemind/sessions/ses_{id}/` alongside event-tracker data, while keeping the purification command export intact.

### Feature Boundaries

- Keep `purification-command.json` export (that's the value users depend on)
- Migrate `assistant-output.md` → stored in events.md within event-tracker sessions
- Update `upsertSessionInspectionExport` to write to event-tracker session dirs

### Files to Modify

| File | Change |
|------|--------|
| `src/sdk-supervisor/session-inspection.ts` | Update to write to event-tracker session dirs, keep purification export |
| `src/plugin/opencode-plugin.ts` | Remove duplicate `upsertSessionInspectionExport` call now that it's integrated |

### Task Breakdown

#### Task 18: Update `session-inspection.ts` to write to event-tracker session dirs

**Step 1: Read current session-inspection.ts**

Read: `src/sdk-supervisor/session-inspection.ts`

**Step 2: Update to use event-tracker paths**

Replace the directory construction:

```typescript
// Before:
const directoryPath = getSessionInspectionPath(projectRoot, input.sessionId)

// After: Write to event-tracker session dir instead
import { getSessionDir, getSessionEventsPath } from '../../features/event-tracker/paths.js'
const directoryPath = getSessionDir(projectRoot, input.sessionId)
```

**Step 3: Also keep a symlink or alias in the old session-inspection path**

During migration, write to BOTH locations for backward compat:

```typescript
const oldDir = getSessionInspectionPath(projectRoot, input.sessionId)
await fs.mkdir(oldDir, { recursive: true })
await fs.writeFile(path.join(oldDir, SESSION_INSPECTION_MARKDOWN_FILE), renderSessionInspectionMarkdown(...))
```

**Step 4: Commit**

```bash
git add src/sdk-supervisor/session-inspection.ts
git commit -m "refactor(session-inspection): write to event-tracker session dirs during migration"
```

---

#### Task 19: Remove duplicate upsertSessionInspectionExport call from plugin

**Step 1: Read opencode-plugin.ts**

Read: `src/plugin/opencode-plugin.ts`

**Step 2: Remove the duplicate upsertSessionInspectionExport call**

The old call at line ~173-176 should be removed since session-inspection.ts now integrates with event-tracker directly:

```diff
- void upsertSessionInspectionExport(directory, {
-   sessionId,
-   assistantText,
- }).catch(() => undefined)
```

**Step 3: Remove the import if no longer used**

```diff
- import { upsertSessionInspectionExport, writeDiagnosticLog } from '../sdk-supervisor/index.js'
+ import { writeDiagnosticLog } from '../sdk-supervisor/index.js'
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/plugin/opencode-plugin.ts
git commit -m "refactor(plugin): remove duplicate session-inspection call now integrated in sdk-supervisor"
```

---

### Verification Criteria for Plan 5

| Criterion | How to Verify |
|-----------|--------------|
| Purification commands still work | `npm test` — existing tests pass |
| Session inspection files appear in new location | Manual check: `.hivemind/sessions/ses_{id}/` |
| Full project type-checks | `npx tsc --noEmit` |

---

## Plan 6: Sub-Session Tracking — Delegation.json and Resumption Logic

**Purpose:** Enable sub-session tracking so that delegation events (DELEGATION_START/END) are recorded in `delegation.json` within each session, and the master index tracks parent-child relationships for session resumption.

### Feature Boundaries

- `DelegationRecord` type and writer functions
- Hook integration for delegation events (when a subagent is spawned)
- Parent-child session tracking in master index
- Resumption logic: given a root sessionId, find all sub-sessions

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/features/event-tracker/session-writer.ts` | Add `writeDelegationRecord`, `readDelegationRecords` (already drafted in Plan 2) |
| `src/features/event-tracker/types.ts` | Add `DelegationRecord` and session hierarchy fields |
| `src/features/event-tracker/hooks/delegation-handler.ts` | New: handles DELEGATION_START/END events from event hook |
| `src/features/event-tracker/index-writer.ts` | Add `updateSessionParent` |

### Task Breakdown

#### Task 20: Add delegation hook handler

**Step 1: Write the failing test**

```typescript
// src/features/event-tracker/hooks/delegation-handler.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createDelegationHandler } from './delegation-handler.js'
import * as sessionWriter from '../session-writer.js'

describe('delegation-handler', () => {
  it('should create a handler function', () => {
    const handler = createDelegationHandler({ directory: '/test' })
    expect(typeof handler).equals('function')
  })

  it('should write DELEGATION_START record', async () => {
    const writeSpy = vi.spyOn(sessionWriter, 'writeDelegationRecord').mockResolvedValue()
    const handler = createDelegationHandler({ directory: '/test' })
    await handler({
      sessionID: 'ses_parent',
      subSessionId: 'ses_child',
      action: 'start',
    })
    expect(writeSpy).toHaveBeenCalled()
    const call = writeSpy.mock.calls[0]
    expect(call[1]).equals('ses_parent')
    expect(call[2].subSessionId).equals('ses_child')
    expect(call[2].status).equals('active')
  })

  it('should write DELEGATION_END record with endedAt', async () => {
    const writeSpy = vi.spyOn(sessionWriter, 'writeDelegationRecord').mockResolvedValue()
    const handler = createDelegationHandler({ directory: '/test' })
    await handler({
      sessionID: 'ses_parent',
      subSessionId: 'ses_child',
      action: 'end',
    })
    expect(writeSpy).toHaveBeenCalled()
    const call = writeSpy.mock.calls[0]
    expect(call[2].status).equals('completed')
    expect(call[2].endedAt).isNotNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx tsx --test src/features/event-tracker/hooks/delegation-handler.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write implementation**

```typescript
// src/features/event-tracker/hooks/delegation-handler.ts
/**
 * Delegation Handler — tracks sub-session start/end via delegation events.
 * @module event-tracker/hooks/delegation-handler
 */

import { writeDelegationRecord } from '../session-writer.js'
import { DelegationRecord } from '../types.js'

export interface DelegationHandlerDeps {
  directory: string
}

export interface DelegationEventInput {
  sessionID: string
  subSessionId: string
  action: 'start' | 'end'
}

/**
 * Create the delegation event handler.
 * Called when a subagent is spawned (DELEGATION_START) or returns (DELEGATION_END).
 */
export function createDelegationHandler(deps: DelegationHandlerDeps) {
  return async function delegationHandler(input: DelegationEventInput): Promise<void> {
    const { sessionID: parentSessionId, subSessionId, action } = input

    const record: DelegationRecord = {
      subSessionId,
      parentSessionId,
      startedAt: action === 'start' ? new Date().toISOString() : 'unknown',
      endedAt: action === 'end' ? new Date().toISOString() : null,
      status: action === 'start' ? 'active' : 'completed',
    }

    await writeDelegationRecord(deps.directory, parentSessionId, record)
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx tsx --test src/features/event-tracker/hooks/delegation-handler.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/event-tracker/hooks/delegation-handler.ts src/features/event-tracker/hooks/delegation-handler.test.ts
git commit -m "feat(event-tracker): add delegation handler for sub-session tracking"
```

---

#### Task 21: Add session resumption helpers to index-writer

**Step 1: Read current index-writer.ts**

Read: `src/features/event-tracker/index-writer.ts`

**Step 2: Add `getSubSessions` function**

```typescript
/**
 * Get all direct child sessions of a given parent session.
 */
export async function getSubSessions(projectRoot: string, parentSessionId: string): Promise<SessionMetadata[]> {
  const sessions = await getActiveSessions(projectRoot)
  return sessions.filter((s) => s.parentSessionId === parentSessionId)
}

/**
 * Get the full session tree (all descendants) for a root session.
 */
export async function getSessionTree(
  projectRoot: string,
  rootSessionId: string,
): Promise<SessionMetadata[]> {
  const sessions = await getActiveSessions(projectRoot)
  const tree: SessionMetadata[] = []
  const queue = [rootSessionId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = sessions.filter((s) => s.parentSessionId === current)
    for (const child of children) {
      tree.push(child)
      queue.push(child.sessionId)
    }
  }

  return tree
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/features/event-tracker/index-writer.ts
git commit -m "feat(event-tracker): add session tree traversal helpers for resumption"
```

---

#### Task 22: Wire delegation handler into event hook

**Step 1: Read current event-handler.ts**

Read: `src/hooks/event-handler.ts`

**Step 2: Add delegation event capture**

The event hook handles `agent.created` events which signal delegation start.
Add delegation recording:

```typescript
// In the event handler, when agent.created is detected:
if (event.type === 'agent.created' && event.sessionID) {
  // This signals a subagent was created — record delegation start
  const delegationHandler = createDelegationHandler({ directory })
  await delegationHandler({
    sessionID: event.sessionID,
    subSessionId: (event.data as any).agentId ?? 'unknown',
    action: 'start',
  })
}
```

**Step 3: Commit**

```bash
git add src/hooks/event-handler.ts
git commit -m "feat(event-tracker): wire delegation handler into event hook"
```

---

### Verification Criteria for Plan 6

| Criterion | How to Verify |
|-----------|--------------|
| delegation.json is created when delegation starts | `npx tsx --test src/features/event-tracker/hooks/delegation-handler.test.ts` |
| delegation.json is updated when delegation ends | Manual test with subagent spawn/end |
| `getSessionTree` correctly traverses hierarchy | `npx tsx --test src/features/event-tracker/index-writer.test.ts` |
| Full project type-checks | `npx tsc --noEmit` |

---

## Summary: All Plans Sequenced

| Plan | Title | Target Agent | Dependencies | Verification |
|------|-------|-------------|-------------|--------------|
| 1 | Foundation | hivemaker | none | Types compile, paths resolve |
| 2 | Core Writers | hivemaker | Plan 1 | Session files created correctly |
| 3 | Hook Integration | hivemaker | Plans 1+2 | Hook handlers wire without errors |
| 4 | Migration | hivemaker | Plan 3 | Error-log replaced, sessions/ populated |
| 5 | Session-Inspection Integration | hivemaker | Plan 4 | Purification still works, new paths populated |
| 6 | Sub-Session Tracking | hivemaker | Plans 1-5 | Delegation records written and traversable |

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|----------|
| Hook handler memory leaks (in-memory Map for turn counters) | Medium | Medium | Clear maps on session end; add monitoring |
| Backward compat breaks if diagnostic-log removed too early | High | High | Keep legacy module until event-tracker is stable; feature flag |
| Sub-session delegation tracking depends on accurate `agent.created` events | Medium | Medium | Test with actual subagent spawn scenarios |
| Master index grows unbounded | Low | Low | Add cleanup job in future iteration (not in scope for v1) |

---

## Architect Decisions Needed Before Implementation

| Decision | Context | Urgency |
|----------|---------|---------|
| Should `agent.created` events be the source of truth for delegation tracking? | The event hook fires for all agents; need to filter for HiveMind subagents only | Before Plan 6 |
| Should we delete error-log files after migration is confirmed? | Users may depend on existing logs | Before Plan 4 |
| Should session.json in each session dir be the authoritative metadata or only the master index? | Dual writing could cause drift | Before Plan 4 |

---

*Plan created: 2026-03-23*
