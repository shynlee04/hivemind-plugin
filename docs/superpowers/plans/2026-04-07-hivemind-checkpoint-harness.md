# HiveMind Checkpoint Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready npm package (`hivemind`) providing turn-based checkpoint validation, incremental skill unlocking, compaction-resilient state, soft-harness discovery, and cross-dependency validation for OpenCode multi-agent workflows.

**Architecture:** Single npm package with three internal module directories (`src/kernel/`, `src/harness/`, `src/cli/`). Kernel is pure TypeScript with zero external dependencies (Zod v4 only). Harness adapts kernel to OpenCode hooks. CLI handles initialization, validation, and state management. Assets directory provides `.opencode/` templates loaded at runtime.

**Tech Stack:** TypeScript (strict mode), Zod v4, vitest, Node.js >= 20.0.0, @opencode-ai/plugin

---

## Spec Coverage

| Spec Section | Implementation Location | Task |
|-------------|------------------------|------|
| §2.1 Package structure | `package.json`, `src/kernel/`, `src/harness/`, `src/cli/` | Task 1 |
| §2.2 Dependency graph | `src/kernel/index.ts`, `src/harness/index.ts`, `src/cli/index.ts` | Tasks 7, 8, 12 |
| §3.1 Kernel files | `src/kernel/schemas.ts`, `gate.ts`, `pad-store.ts`, `lock-store.ts`, `state-recovery.ts`, `permission-gate.ts` | Tasks 2-6 |
| §3.2 Zod schemas | `src/kernel/schemas.ts` | Task 2 |
| §3.3 Gate evaluation | `src/kernel/gate.ts` | Task 3 |
| §3.4 Pad store | `src/kernel/pad-store.ts` | Task 4 |
| §3.5 Lock store | `src/kernel/lock-store.ts` | Task 5 |
| §3.6 State recovery | `src/kernel/state-recovery.ts` | Task 6 |
| §4.1 Plugin files | `src/harness/index.ts`, `hooks/`, `tools/` | Tasks 8-11 |
| §4.3 Permission gate | `src/kernel/permission-gate.ts`, `src/harness/hooks/permission-gate.ts` | Task 3 + 8 |
| §4.4 Prompt inject | `src/harness/hooks/prompt-inject.ts` | Task 9 |
| §4.5 Tool descriptor | `src/harness/hooks/tool-descriptor.ts` | Task 10 |
| §4.6 Gate check tool | `src/harness/tools/gate-check.ts` | Task 11 |
| §5 CLI | `src/cli/index.ts` | Task 12 |
| §6 Assets | `assets/.opencode/` | Task 13 |
| §9.3 CLI tests | `tests/cli/` | Task 15 |
| §9.4 Integration tests | `tests/integration/` | Task 14 |

**Spec gaps identified:** None — all sections have corresponding tasks.

---

## File Structure

```
hivemind/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── kernel/
│   │   ├── index.ts              # Barrel: exports all kernel public APIs
│   │   ├── schemas.ts            # All Zod schemas + types (~140 LOC)
│   │   ├── gate.ts               # evaluateGate() pure function (~60 LOC)
│   │   ├── permission-gate.ts    # isToolAllowedForPhase() + helpers (~80 LOC)
│   │   ├── pad-store.ts          # Session pad CRUD (~100 LOC)
│   │   ├── lock-store.ts         # Requirements lock CRUD + cycle detection (~100 LOC)
│   │   └── state-recovery.ts     # reconstructState() (~60 LOC)
│   ├── harness/                  # Renamed from plugin/ to avoid macOS conflict with src/plugin.ts
│   │   ├── index.ts              # CheckpointHarness Plugin entry — async function (~80 LOC)
│   │   ├── hooks/
│   │   │   ├── permission-gate.ts  # permission.ask handler (~90 LOC)
│   │   │   ├── prompt-inject.ts    # experimental.chat.system.transform handler (~80 LOC)
│   │   │   └── tool-descriptor.ts   # tool.definition handler (~40 LOC)
│   │   └── tools/
│   │       └── gate-check.ts     # gate-check tool via tool() helper (~100 LOC)
│   └── cli/
│       └── index.ts              # CLI: init, validate, status, reset (~160 LOC)
├── assets/
│   └── .opencode/
│       ├── agents/
│       │   ├── orchestrator.md
│       │   ├── phase-worker.md
│       │   ├── code-critic.md
│       │   ├── explore.md
│       │   └── researcher.md
│       ├── commands/
│       │   ├── harness-execute.md
│       │   ├── harness-review.md
│       │   ├── harness-doctor.md
│       │   └── harness-status.md
│       └── skills/
│           ├── gate-review/
│           │   └── SKILL.md
│           ├── onboarding/
│           │   └── SKILL.md
│           ├── api-types/
│           │   └── SKILL.md
│           ├── http-handlers/
│           │   └── SKILL.md
│           └── testing/
│               └── SKILL.md
└── tests/
    ├── kernel/
    │   ├── schemas.test.ts
    │   ├── gate.test.ts
    │   ├── permission-gate.test.ts
    │   ├── pad-store.test.ts
    │   ├── lock-store.test.ts
    │   └── state-recovery.test.ts
    ├── cli/
    │   └── cli.test.ts
    └── integration/
        └── end-to-end.test.ts
```

---

## Dependency Order

```
Task 1 (Project Foundation)
    ↓
Task 2 (Kernel Schemas)
    ↓
Task 3 (Kernel Gate + Permission Gate)
    ↓
Task 4 (Kernel Pad Store)
    ↓
Task 5 (Kernel Lock Store)
    ↓
Task 6 (Kernel State Recovery)
    ↓
Task 7 (Kernel Index)
    ↓
Task 8 (Harness Plugin Entry + Permission Gate Hook)
    ↓
Task 9 (Harness Prompt Inject Hook)
    ↓
Task 10 (Harness Tool Descriptor Hook)
    ↓
Task 11 (Harness Gate Check Tool)
    ↓
Task 12 (CLI)
    ↓
Task 13 (Assets)
    ↓
Task 14 (Integration Tests)
    ↓
Task 15 (CLI Tests)
```

Kernel tasks (2-7) must be complete before harness tasks (8-11). CLI (12) and Assets (13) depend on Task 7. Integration tests (14) and CLI tests (15) depend on all previous tasks.

---

## Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/kernel/.gitkeep`
- Create: `src/harness/.gitkeep`
- Create: `src/cli/.gitkeep`
- Create: `assets/.opencode/agents/.gitkeep`
- Create: `assets/.opencode/commands/.gitkeep`
- Create: `assets/.opencode/skills/.gitkeep`
- Create: `tests/kernel/.gitkeep`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "hivemind",
  "version": "0.1.0",
  "description": "Multi-agent checkpoint orchestration framework for OpenCode",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./plugin": {
      "import": "./dist/harness/index.js",
      "types": "./dist/harness/index.d.ts"
    }
  },
  "bin": {
    "harness": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc && node ./dist/cli/index.js validate",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "prepack": "npm run build"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": ">=1.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      reporter: ['text', 'lcov'],
    },
  },
})
```

- [ ] **Step 4: Create placeholder directories**

Run:
```bash
mkdir -p src/kernel src/harness/hooks src/harness/tools src/cli
mkdir -p assets/.opencode/agents assets/.opencode/commands assets/.opencode/skills
mkdir -p tests/kernel
touch src/kernel/.gitkeep src/harness/.gitkeep src/cli/.gitkeep
touch assets/.opencode/agents/.gitkeep assets/.opencode/commands/.gitkeep assets/.opencode/skills/.gitkeep
touch tests/kernel/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts
git add src/ assets/ tests/
git commit -m "feat: scaffold project foundation — package.json, tsconfig, vitest, directory structure"
```

---

## Task 2: Kernel Schemas

**Files:**
- Create: `src/kernel/schemas.ts`
- Create: `tests/kernel/schemas.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest'
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema, GateResultSchema, PermissionRequestSchema } from '../../src/kernel/schemas.js'

describe('SessionPadSchema', () => {
  it('parses valid minimal pad', () => {
    const pad = {
      id: 'pad-001',
      sessionId: null,
      status: 'released',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-0',
      currentTask: 'phase-0-1',
      checkpointStatus: {},
      gateRetries: {},
    }
    const result = SessionPadSchema.parse(pad)
    expect(result.id).toBe('pad-001')
    expect(result.status).toBe('released')
  })

  it('rejects invalid status', () => {
    const pad = {
      id: 'pad-001',
      sessionId: null,
      status: 'invalid',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-0',
      currentTask: 'phase-0-1',
      checkpointStatus: {},
      gateRetries: {},
    }
    expect(() => SessionPadSchema.parse(pad)).toThrow()
  })

  it('applies defaults', () => {
    const pad = {
      id: 'pad-001',
      sessionId: null,
      status: 'active',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-0',
      currentTask: 'phase-0-1',
    }
    const result = SessionPadSchema.parse(pad)
    expect(result.checkpointStatus).toEqual({})
    expect(result.gateRetries).toEqual({})
  })
})

describe('GateResultSchema', () => {
  it('parses locked result', () => {
    const result = {
      currentPhase: 'phase-1',
      currentTask: 'phase-1-1',
      unlocked: [],
      gateStatus: 'locked',
    }
    const parsed = GateResultSchema.parse(result)
    expect(parsed.gateStatus).toBe('locked')
    expect(parsed.blockers).toBeUndefined()
  })

  it('parses blocked result with blockers', () => {
    const result = {
      currentPhase: 'phase-1',
      currentTask: 'phase-1-1',
      unlocked: [],
      gateStatus: 'blocked',
      blockers: ['dependsOn references non-existent task: phase-99'],
    }
    const parsed = GateResultSchema.parse(result)
    expect(parsed.gateStatus).toBe('blocked')
    expect(parsed.blockers).toHaveLength(1)
  })
})

describe('RequirementsLockSchema', () => {
  it('parses valid lock with phases and tasks', () => {
    const lock = {
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-0',
          name: 'Discovery',
          locked: true,
          requirements: [],
          tasks: [
            { id: 'phase-0-1', command: 'negotiate requirements', skill: '', gate: '', dependsOn: [], editScope: [] },
          ],
        },
      ],
    }
    const parsed = RequirementsLockSchema.parse(lock)
    expect(parsed.phases).toHaveLength(1)
    expect(parsed.phases[0].tasks).toHaveLength(1)
  })
})

describe('PermissionRequestSchema', () => {
  it('parses read permission', () => {
    const req = {
      type: 'read',
      sessionID: 'session-123',
    }
    const parsed = PermissionRequestSchema.parse(req)
    expect(parsed.type).toBe('read')
    expect(parsed.pattern).toBeUndefined()
  })

  it('parses edit permission with pattern', () => {
    const req = {
      type: 'edit',
      pattern: 'src/**/*.ts',
      sessionID: 'session-123',
    }
    const parsed = PermissionRequestSchema.parse(req)
    expect(parsed.type).toBe('edit')
    expect(parsed.pattern).toBe('src/**/*.ts')
  })

  it('accepts string array pattern', () => {
    const req = {
      type: 'bash',
      pattern: ['bun test'],
      sessionID: 'session-123',
    }
    const parsed = PermissionRequestSchema.parse(req)
    expect(Array.isArray(parsed.pattern)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/kernel/schemas.test.ts`
Expected: FAIL — "schemas.ts not found"

- [ ] **Step 3: Write minimal schemas implementation**

```typescript
import { z } from 'zod'

// SessionPad — The orchestrator's durable working state per session
export const SessionPadSchema = z.object({
  id: z.string(),
  sessionId: z.string().nullable(),
  status: z.enum(['active', 'released']),
  version: z.number().default(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  pipelinePath: z.string(),
  currentPhase: z.string(),
  currentTask: z.string(),
  checkpointStatus: z.record(z.string(), z.enum([
    'pending', 'in_progress', 'completed', 'blocked', 'failed'
  ])).default({}),
  gateRetries: z.record(z.string(), z.number()).default({}),
})

export type SessionPad = z.infer<typeof SessionPadSchema>

// Task within a phase
const TaskSchema = z.object({
  id: z.string(),
  command: z.string(),
  skill: z.string(),
  gate: z.string(),
  dependsOn: z.array(z.string()).default([]),
  editScope: z.array(z.string()).default([]),
})

export type Task = z.infer<typeof TaskSchema>

// Phase within requirements lock
const PhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  locked: z.boolean(),
  requirements: z.array(z.object({
    id: z.string(),
    description: z.string(),
    locked: z.boolean(),
  })),
  tasks: z.array(TaskSchema),
})

export type Phase = z.infer<typeof PhaseSchema>

// RequirementsLock — Written after Phase 0 negotiation
export const RequirementsLockSchema = z.object({
  version: z.number(),
  lockedAt: z.iso.datetime(),
  phases: z.array(PhaseSchema),
})

export type RequirementsLock = z.infer<typeof RequirementsLockSchema>

// ReviewVerdict — Written by code-critic after review
export const ReviewVerdictSchema = z.object({
  phase: z.string(),
  task: z.string(),
  reviewer: z.literal('code-critic'),
  timestamp: z.iso.datetime(),
  verdict: z.enum(['approved', 'rejected']),
  checks: z.object({
    lspErrors: z.number(),
    testsPassed: z.boolean(),
    requirementsLocked: z.boolean(),
    crossDepsValid: z.boolean(),
  }),
  notes: z.string().optional(),
})

export type ReviewVerdict = z.infer<typeof ReviewVerdictSchema>

// GateResult — Interface between kernel and plugin
export const GateResultSchema = z.object({
  currentPhase: z.string(),
  currentTask: z.string(),
  unlocked: z.array(z.string()),
  gateStatus: z.enum(['locked', 'unlocked', 'blocked']),
  blockers: z.array(z.string()).optional(),
})

export type GateResult = z.infer<typeof GateResultSchema>

// PermissionRequest — Adapted from OpenCode's real Permission type
export const PermissionRequestSchema = z.object({
  type: z.string(),
  pattern: z.union([z.string(), z.array(z.string())]).optional(),
  sessionID: z.string(),
  metadata: z.record(z.unknown()).optional(),
  title: z.string().optional(),
})

export type PermissionRequest = z.infer<typeof PermissionRequestSchema>

export type PermissionOutput = { status: 'ask' | 'ask' | 'allow' }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/kernel/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/kernel/schemas.ts tests/kernel/schemas.test.ts
git commit -m "feat(kernel): add Zod schemas for all state types — SessionPad, RequirementsLock, ReviewVerdict, GateResult, PermissionRequest"
```

---

## Task 3: Kernel Gate + Permission Gate

**Files:**
- Create: `src/kernel/gate.ts`
- Create: `src/kernel/permission-gate.ts`
- Create: `tests/kernel/gate.test.ts`
- Create: `tests/kernel/permission-gate.test.ts`

- [ ] **Step 1: Write failing test for gate.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { evaluateGate } from '../../src/kernel/gate.js'
import type { RequirementsLock, ReviewVerdict } from '../../src/kernel/schemas.js'

describe('evaluateGate', () => {
  const makeLock = (phases: RequirementsLock['phases']): RequirementsLock => ({
    version: 1,
    lockedAt: new Date().toISOString(),
    phases,
  })

  const makeVerdict = (taskId: string, verdict: 'approved' | 'rejected'): ReviewVerdict => ({
    phase: 'phase-1',
    task: taskId,
    reviewer: 'code-critic',
    timestamp: new Date().toISOString(),
    verdict,
    checks: { lspErrors: 0, testsPassed: true, requirementsLocked: true, crossDepsValid: true },
  })

  it('returns locked when no reviews exist', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [{ id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] }],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>()
    const result = evaluateGate(reviews, lock)
    expect(result.gateStatus).toBe('locked')
    expect(result.blockers).toContain('no reviews submitted yet')
  })

  it('returns blocked when dependsOn references non-existent task', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: ['phase-99'], editScope: [] },
        ],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>()
    const result = evaluateGate(reviews, lock)
    expect(result.gateStatus).toBe('blocked')
    expect(result.blockers![0]).toContain('dependsOn references non-existent task')
  })

  it('returns approved when all tasks in all phases are approved', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] },
        ],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>([
      ['phase-1-1', makeVerdict('phase-1-1', 'approved')],
    ])
    const result = evaluateGate(reviews, lock)
    expect(result.gateStatus).toBe('unlocked')
    expect(result.unlocked).toContain('phase-1-1')
  })

  it('returns first unapproved phase as current', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] },
          { id: 'phase-1-2', command: '', skill: '', gate: '', dependsOn: [], editScope: [] },
        ],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>([
      ['phase-1-1', makeVerdict('phase-1-1', 'approved')],
      // phase-1-2 is not approved
    ])
    const result = evaluateGate(reviews, lock)
    expect(result.gateStatus).toBe('locked')
    expect(result.currentTask).toBe('phase-1-2')
    expect(result.unlocked).toContain('phase-1-1')
  })

  it('returns blocked when dependency is rejected', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] },
          { id: 'phase-1-2', command: '', skill: '', gate: '', dependsOn: ['phase-1-1'], editScope: [] },
        ],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>([
      ['phase-1-1', makeVerdict('phase-1-1', 'rejected')],
    ])
    const result = evaluateGate(reviews, lock)
    expect(result.gateStatus).toBe('blocked')
    expect(result.blockers![0]).toContain('phase-1-1: dependency not approved')
  })

  it('iterates phases in lexicographic order', () => {
    const lock = makeLock([
      {
        id: 'phase-2',
        name: 'Phase 2',
        locked: true,
        requirements: [],
        tasks: [{ id: 'phase-2-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] }],
      },
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [{ id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] }],
      },
    ])
    const reviews = new Map<string, ReviewVerdict>([
      ['phase-1-1', makeVerdict('phase-1-1', 'approved')],
    ])
    const result = evaluateGate(reviews, lock)
    // phase-1 comes first lexicographically
    expect(result.currentPhase).toBe('phase-1')
    expect(result.unlocked).toContain('phase-1-1')
  })
})
```

- [ ] **Step 2: Write failing test for permission-gate.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { isToolAllowedForPhase, getPhaseEditPaths, getAllowedTestCommands, matchesGlob } from '../../src/kernel/permission-gate.js'
import type { GateResult, RequirementsLock, PermissionRequest } from '../../src/kernel/schemas.js'

describe('matchesGlob', () => {
  it('matches simple file patterns', () => {
    expect(matchesGlob('src/types/foo.ts', 'src/types/*.ts')).toBe(true)
    expect(matchesGlob('src/types/foo.ts', 'src/types/bar.ts')).toBe(false)
  })

  it('matches nested paths with **', () => {
    expect(matchesGlob('src/deep/nested/file.ts', 'src/**/*.ts')).toBe(true)
    expect(matchesGlob('src/file.ts', 'src/**/*.ts')).toBe(true)
  })

  it('matches glob patterns with **.ext', () => {
    expect(matchesGlob('src/types/foo.ts', '**.ts')).toBe(true)
    expect(matchesGlob('foo.ts', '**.ts')).toBe(true)
  })
})

describe('getPhaseEditPaths', () => {
  it('returns empty array for unknown phase', () => {
    const lock = makeLock([])
    const paths = getPhaseEditPaths('phase-99', lock)
    expect(paths).toEqual([])
  })

  it('collects editScope from all tasks in phase', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: 'bun test', dependsOn: [], editScope: ['src/types/**'] },
          { id: 'phase-1-2', command: '', skill: '', gate: 'bun test', dependsOn: [], editScope: ['src/schemas/**'] },
        ],
      },
    ])
    const paths = getPhaseEditPaths('phase-1', lock)
    expect(paths).toContain('src/types/**')
    expect(paths).toContain('src/schemas/**')
    expect(paths).toHaveLength(2)
  })

  it('deduplicates paths', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: ['src/**'] },
          { id: 'phase-1-2', command: '', skill: '', gate: '', dependsOn: [], editScope: ['src/**'] },
        ],
      },
    ])
    const paths = getPhaseEditPaths('phase-1', lock)
    expect(paths).toEqual(['src/**'])
  })
})

describe('getAllowedTestCommands', () => {
  it('returns gate conditions as allowed commands', () => {
    const lock = makeLock([
      {
        id: 'phase-1',
        name: 'Phase 1',
        locked: true,
        requirements: [],
        tasks: [
          { id: 'phase-1-1', command: '', skill: '', gate: 'bun test', dependsOn: [], editScope: [] },
          { id: 'phase-1-2', command: '', skill: '', gate: 'npm test', dependsOn: [], editScope: [] },
        ],
      },
    ])
    const commands = getAllowedTestCommands('phase-1', lock)
    expect(commands).toContain('bun test')
    expect(commands).toContain('npm test')
  })
})

describe('isToolAllowedForPhase', () => {
  const lock = makeLock([
    {
      id: 'phase-1',
      name: 'Phase 1',
      locked: true,
      requirements: [],
      tasks: [
        { id: 'phase-1-1', command: '', skill: 'onboarding', gate: 'bun test', dependsOn: [], editScope: ['src/types/**'] },
      ],
    },
  ])

  const unlockedResult: GateResult = {
    currentPhase: 'phase-1',
    currentTask: 'phase-1-1',
    unlocked: ['phase-1-1'],
    gateStatus: 'unlocked',
  }

  it('phase-0 allows read, question, glob, grep, list', () => {
    const phase0Result = { ...unlockedResult, currentPhase: 'phase-0' }
    const readPerm = { type: 'read', sessionID: 's1' }
    const questionPerm = { type: 'question', sessionID: 's1' }
    const skillPerm = { type: 'skill', sessionID: 's1' }

    expect(isToolAllowedForPhase(readPerm, 'phase-0', phase0Result, lock)).toBe(true)
    expect(isToolAllowedForPhase(questionPerm, 'phase-0', phase0Result, lock)).toBe(true)
    expect(isToolAllowedForPhase(skillPerm, 'phase-0', phase0Result, lock)).toBe(false) // skill NOT allowed in phase-0
  })

  it('edit requires matching phase editScope', () => {
    const editAllowed = { type: 'edit', pattern: 'src/types/foo.ts', sessionID: 's1' }
    const editDenied = { type: 'edit', pattern: 'src/handlers/foo.ts', sessionID: 's1' }

    expect(isToolAllowedForPhase(editAllowed, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(editDenied, 'phase-1', unlockedResult, lock)).toBe(false)
  })

  it('skill requires phase task gate condition', () => {
    const skillAllowed = { type: 'skill', pattern: 'onboarding', sessionID: 's1' }
    const skillDenied = { type: 'skill', pattern: 'nonexistent-skill', sessionID: 's1' }

    expect(isToolAllowedForPhase(skillAllowed, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(skillDenied, 'phase-1', unlockedResult, lock)).toBe(false)
  })

  it('read operations always allowed', () => {
    const readPerm = { type: 'read', sessionID: 's1' }
    const globPerm = { type: 'glob', pattern: '**/*.ts', sessionID: 's1' }
    const grepPerm = { type: 'grep', pattern: 'TODO', sessionID: 's1' }

    expect(isToolAllowedForPhase(readPerm, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(globPerm, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(grepPerm, 'phase-1', unlockedResult, lock)).toBe(true)
  })

  it('bash data-driven from lock gate conditions', () => {
    const bashAllowed = { type: 'bash', pattern: 'bun test', sessionID: 's1' }
    const bashDenied = { type: 'bash', pattern: 'rm -rf /', sessionID: 's1' }
    const bashWithFlag = { type: 'bash', pattern: 'bun test --coverage', sessionID: 's1' }

    expect(isToolAllowedForPhase(bashAllowed, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(bashWithFlag, 'phase-1', unlockedResult, lock)).toBe(true) // flags allowed
    expect(isToolAllowedForPhase(bashDenied, 'phase-1', unlockedResult, lock)).toBe(false)
  })

  it('bash blocks command injection', () => {
    const bashInjection = { type: 'bash', pattern: 'bun test && rm -rf /', sessionID: 's1' }
    expect(isToolAllowedForPhase(bashInjection, 'phase-1', unlockedResult, lock)).toBe(false)
  })

  it('task restricts to allowed subagents', () => {
    const taskAllowed = { type: 'task', pattern: 'phase-worker', sessionID: 's1' }
    const taskDenied = { type: 'task', pattern: 'arbitrary-agent', sessionID: 's1' }

    expect(isToolAllowedForPhase(taskAllowed, 'phase-1', unlockedResult, lock)).toBe(true)
    expect(isToolAllowedForPhase(taskDenied, 'phase-1', unlockedResult, lock)).toBe(false)
  })
})

// Helper
function makeLock(phases: RequirementsLock['phases']): RequirementsLock {
  return {
    version: 1,
    lockedAt: new Date().toISOString(),
    phases,
  }
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- tests/kernel/gate.test.ts tests/kernel/permission-gate.test.ts`
Expected: FAIL — gate.ts and permission-gate.ts not found

- [ ] **Step 4: Write gate.ts implementation**

```typescript
import type { GateResult, RequirementsLock, ReviewVerdict } from './schemas.js'

export function evaluateGate(
  reviews: Map<string, ReviewVerdict>,
  requirements: RequirementsLock,
): GateResult {
  const { phases } = requirements

  const sortedPhases = [...phases].sort((a, b) => a.id.localeCompare(b.id))

  // Empty reviews case
  if (reviews.size === 0) {
    return {
      currentPhase: sortedPhases[0]?.id ?? '',
      currentTask: sortedPhases[0]?.tasks[0]?.id ?? '',
      unlocked: [],
      gateStatus: 'locked',
      blockers: ['no reviews submitted yet'],
    }
  }

  // Evaluate gate
  const unlocked: string[] = []

  for (const phase of sortedPhases) {
    let allApproved = true

    for (const task of phase.tasks) {
      const verdict = reviews.get(task.id)

      // Check dependencies first
      if (task.dependsOn.length > 0) {
        for (const dep of task.dependsOn) {
          const depVerdict = reviews.get(dep)
          if (!depVerdict || depVerdict.verdict !== 'approved') {
            allApproved = false
          }
        }
      }

      if (!verdict || verdict.verdict !== 'approved') {
        allApproved = false
        // Return first blocked task as current
        return {
          currentPhase: phase.id,
          currentTask: task.id,
          unlocked,
          gateStatus: 'locked',
          blockers: verdict
            ? [`${task.id}: dependency not approved`]
            : ['no reviews submitted yet'],
        }
      }
    }

    if (allApproved) {
      for (const task of phase.tasks) {
        unlocked.push(task.id)
      }
    }
  }

  return {
    currentPhase: sortedPhases[0]?.id ?? '',
    currentTask: sortedPhases[0]?.tasks[0]?.id ?? '',
    unlocked,
    gateStatus: 'unlocked',
  }
}
```

- [ ] **Step 5: Write permission-gate.ts implementation**

```typescript
import type { GateResult, PermissionRequest, RequirementsLock } from './schemas.js'

export function matchesGlob(filePath: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' + pattern
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__DOUBLESTAR__/g, '.*')
      .replace(/\?/g, '.') + '$'
  )
  return regex.test(filePath)
}

export function getPhaseEditPaths(currentPhase: string, requirements: RequirementsLock): string[] {
  const phase = requirements.phases.find(p => p.id === currentPhase)
  if (!phase) return []
  return [...new Set(phase.tasks.flatMap(t => t.editScope ?? []))]
}

export function getAllowedTestCommands(currentPhase: string, requirements: RequirementsLock): string[] {
  const phase = requirements.phases.find(p => p.id === currentPhase)
  if (!phase) return []
  return [...new Set(phase.tasks.map(t => t.gate).filter(Boolean))]
}

export function isToolAllowedForPhase(
  permission: PermissionRequest,
  currentPhase: string,
  state: GateResult,
  requirements: RequirementsLock,
): boolean {
  const pattern = Array.isArray(permission.pattern)
    ? permission.pattern[0]
    : (permission.pattern ?? '')

  // Phase 0 (discovery): only read, question, glob, grep, list
  if (currentPhase === 'phase-0') {
    return ['read', 'question', 'glob', 'grep', 'list'].includes(permission.type)
  }

  // Skill: allowed only for the current phase's designated skill
  if (permission.type === 'skill') {
    const phase = requirements.phases.find(p => p.id === currentPhase)
    if (!phase) return false
    const allowedSkills = phase.tasks.map(t => t.skill).filter(Boolean)
    return allowedSkills.includes(pattern)
  }

  // Edit: allowed only in phase-scoped paths
  if (permission.type === 'edit') {
    const allowedPaths = getPhaseEditPaths(currentPhase, requirements)
    return allowedPaths.some(p => matchesGlob(pattern, p))
  }

  // Bash: data-driven from lock file gate conditions
  if (permission.type === 'bash') {
    const allowedCommands = getAllowedTestCommands(currentPhase, requirements)
    const cmd = pattern.trim()

    return allowedCommands.some(allowed => {
      const escaped = allowed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^${escaped}(\\s+\\S+)*$`)
      return regex.test(cmd) && !cmd.includes('&&') && !cmd.includes('|') && !cmd.includes(';')
    })
  }

  // Task: only allow phase-worker and code-critic
  if (permission.type === 'task') {
    return ['phase-worker', 'code-critic', 'explore', 'researcher'].includes(pattern)
  }

  // Read operations: always allowed
  if (['read', 'glob', 'grep', 'list'].includes(permission.type)) {
    return true
  }

  // Everything else: denied by default
  return false
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- tests/kernel/gate.test.ts tests/kernel/permission-gate.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/kernel/gate.ts src/kernel/permission-gate.ts
git add tests/kernel/gate.test.ts tests/kernel/permission-gate.test.ts
git commit -m "feat(kernel): add evaluateGate() and isToolAllowedForPhase() with phase-scoped permission gating and data-driven bash allowlist"
```

---

## Task 4: Kernel Pad Store

**Files:**
- Create: `src/kernel/pad-store.ts`
- Create: `tests/kernel/pad-store.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readPad, writePad, listPads, acquirePad, releasePad, incrementRetry, resetRetry } from '../../src/kernel/pad-store.js'
import type { SessionPad } from '../../src/kernel/schemas.js'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/harness-test-pads'

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    for (const f of readdirSync(TEST_DIR)) {
      unlinkSync(join(TEST_DIR, f))
    }
  } else {
    mkdirSync(TEST_DIR, { recursive: true })
  }
})

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    for (const f of readdirSync(TEST_DIR)) {
      unlinkSync(join(TEST_DIR, f))
    }
    rmSync(TEST_DIR, { recursive: true, force: true })
  }
})

const makePad = (id: string, overrides: Partial<SessionPad> = {}): SessionPad => ({
  id,
  sessionId: null,
  status: 'released',
  version: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pipelinePath: 'plans/pipeline.md',
  currentPhase: 'phase-0',
  currentTask: 'phase-0-1',
  checkpointStatus: {},
  gateRetries: {},
  ...overrides,
})

describe('readPad', () => {
  it('reads existing pad', () => {
    const pad = makePad('pad-001')
    writePad(TEST_DIR, pad)
    const read = readPad(TEST_DIR, 'pad-001')
    expect(read.id).toBe('pad-001')
    expect(read.version).toBe(0)
  })

  it('throws if pad not found', () => {
    expect(() => readPad(TEST_DIR, 'nonexistent')).toThrow('[Harness] Pad not found: nonexistent')
  })

  it('throws on invalid JSON', () => {
    writeFileSync(join(TEST_DIR, 'pad-002.json'), 'not json')
    expect(() => readPad(TEST_DIR, 'pad-002')).toThrow('[Harness] Pad validation failed')
  })
})

describe('writePad', () => {
  it('writes pad with incremented version', () => {
    const pad = makePad('pad-001')
    writePad(TEST_DIR, pad)
    const pad2 = { ...pad, version: pad.version + 1 }
    writePad(TEST_DIR, pad2)
    const read = readPad(TEST_DIR, 'pad-001')
    expect(read.version).toBe(1)
  })

  it('atomic write uses tmp + rename', () => {
    const pad = makePad('pad-001')
    writePad(TEST_DIR, pad)
    expect(existsSync(join(TEST_DIR, 'pad-001.json'))).toBe(true)
    expect(existsSync(join(TEST_DIR, 'pad-001.tmp'))).toBe(false)
  })
})

describe('listPads', () => {
  it('returns all pads deep cloned', () => {
    writePad(TEST_DIR, makePad('pad-001'))
    writePad(TEST_DIR, makePad('pad-002'))
    const pads = listPads(TEST_DIR)
    expect(pads).toHaveLength(2)
  })
})

describe('acquirePad', () => {
  it('acquires first released pad', () => {
    writePad(TEST_DIR, makePad('pad-001', { status: 'released', sessionId: null }))
    writePad(TEST_DIR, makePad('pad-002', { status: 'released', sessionId: null }))
    writePad(TEST_DIR, makePad('pad-003', { status: 'active', sessionId: 'other' }))
    const acquired = acquirePad(TEST_DIR, 'my-session')
    expect(acquired.id).toBe('pad-001')
    expect(acquired.status).toBe('active')
    expect(acquired.sessionId).toBe('my-session')
  })

  it('throws when all pads active', () => {
    writePad(TEST_DIR, makePad('pad-001', { status: 'active', sessionId: 's1' }))
    writePad(TEST_DIR, makePad('pad-002', { status: 'active', sessionId: 's2' }))
    writePad(TEST_DIR, makePad('pad-003', { status: 'active', sessionId: 's3' }))
    expect(() => acquirePad(TEST_DIR, 'my-session')).toThrow('[Harness] All pads active')
  })
})

describe('incrementRetry / resetRetry', () => {
  it('increments retry count', () => {
    const pad = makePad('pad-001')
    writePad(TEST_DIR, pad)
    incrementRetry(TEST_DIR, 'pad-001', 'phase-1-1')
    const read = readPad(TEST_DIR, 'pad-001')
    expect(read.gateRetries['phase-1-1']).toBe(1)
  })

  it('resets retry count', () => {
    const pad = makePad('pad-001', { gateRetries: { 'phase-1-1': 3 } })
    writePad(TEST_DIR, pad)
    resetRetry(TEST_DIR, 'pad-001', 'phase-1-1')
    const read = readPad(TEST_DIR, 'pad-001')
    expect(read.gateRetries['phase-1-1']).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/kernel/pad-store.test.ts`
Expected: FAIL — pad-store.ts not found

- [ ] **Step 3: Write minimal implementation**

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'
import { SessionPadSchema } from './schemas.js'
import type { SessionPad } from './schemas.js'

const [Harness] = ['[Harness]']

function padPath(dir: string, id: string): string {
  return join(dir, `${id}.json`)
}

function atomicWrite(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`
  writeFileSync(tmp, data, 'utf-8')
  renameSync(tmp, filePath)
}

export function readPad(dir: string, id: string): SessionPad {
  const file = padPath(dir, id)
  if (!existsSync(file)) throw new Error(`${Harness} Pad not found: ${id}`)
  const content = readFileSync(file, 'utf-8')
  if (!content.trim()) throw new Error(`${Harness} Pad file empty: ${id}`)
  try {
    const parsed = SessionPadSchema.parse(JSON.parse(content))
    return JSON.parse(JSON.stringify(parsed)) as SessionPad
  } catch (e) {
    throw new Error(`${Harness} Pad validation failed: ${id}: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export function writePad(dir: string, pad: SessionPad): void {
  const file = padPath(dir, pad.id)
  const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : null
  if (current && pad.version !== current.version) {
    throw new Error(`${Harness} Pad version conflict: ${pad.id} (expected ${current.version}, got ${pad.version})`)
  }
  pad.version++
  pad.updatedAt = new Date().toISOString()
  atomicWrite(file, JSON.stringify(pad, null, 2))
}

export function listPads(dir: string): SessionPad[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
    .map(f => {
      try { return readPad(dir, f.replace('.json', '')) } catch { return null }
    })
    .filter((p): p is SessionPad => p !== null)
}

export function acquirePad(dir: string, sessionId: string): SessionPad {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const released = listPads(dir).filter(p => p.status === 'released')
  if (released.length === 0) throw new Error(`${Harness} All pads active`)
  const pad = released[0]
  pad.sessionId = sessionId
  pad.status = 'active'
  writePad(dir, pad)
  return pad
}

export function releasePad(dir: string, id: string): void {
  const pad = readPad(dir, id)
  pad.status = 'released'
  pad.sessionId = null
  writePad(dir, pad)
}

export function incrementRetry(dir: string, padId: string, checkpointId: string): void {
  const pad = readPad(dir, padId)
  const current = pad.gateRetries[checkpointId] ?? 0
  pad.gateRetries[checkpointId] = current + 1
  writePad(dir, pad)
}

export function resetRetry(dir: string, padId: string, checkpointId: string): void {
  const pad = readPad(dir, padId)
  pad.gateRetries[checkpointId] = 0
  writePad(dir, pad)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/kernel/pad-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/kernel/pad-store.ts tests/kernel/pad-store.test.ts
git commit -m "feat(kernel): add pad-store with atomic writes, optimistic concurrency, and retry tracking"
```

---

## Task 5: Kernel Lock Store

**Files:**
- Create: `src/kernel/lock-store.ts`
- Create: `tests/kernel/lock-store.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readLock, writeLock, lockField, isLocked } from '../../src/kernel/lock-store.js'
import type { RequirementsLock } from '../../src/kernel/schemas.js'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/harness-test-lock'

beforeEach(() => {
  cleanup()
  mkdirSync(TEST_DIR, { recursive: true })
})

afterEach(() => {
  cleanup()
})

function cleanup() {
  try {
    const lockFile = join(TEST_DIR, 'requirements.lock.json')
    if (existsSync(lockFile)) unlinkSync(lockFile)
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
  } catch {}
}

const makeLock = (): RequirementsLock => ({
  version: 1,
  lockedAt: new Date().toISOString(),
  phases: [
    {
      id: 'phase-0',
      name: 'Discovery',
      locked: true,
      requirements: [
        { id: 'req-1', description: 'Need auth', locked: true },
      ],
      tasks: [
        { id: 'phase-0-1', command: 'negotiate', skill: '', gate: '', dependsOn: [], editScope: [] },
      ],
    },
  ],
})

describe('readLock', () => {
  it('reads existing lock', () => {
    const lock = makeLock()
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify(lock))
    const read = readLock(TEST_DIR)
    expect(read.phases).toHaveLength(1)
  })

  it('throws if lock not found', () => {
    expect(() => readLock(TEST_DIR)).toThrow('[Harness] Requirements lock not found')
  })
})

describe('writeLock', () => {
  it('writes lock atomically', () => {
    const lock = makeLock()
    writeLock(TEST_DIR, lock)
    expect(existsSync(join(TEST_DIR, 'requirements.lock.json'))).toBe(true)
  })

  it('throws if lock already exists', () => {
    const lock = makeLock()
    writeLock(TEST_DIR, lock)
    expect(() => writeLock(TEST_DIR, lock)).toThrow('[Harness] Requirements lock already exists')
  })

  it('throws on circular dependsOn', () => {
    const cyclicLock: RequirementsLock = {
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          locked: true,
          requirements: [],
          tasks: [
            { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: ['phase-1-2'], editScope: [] },
            { id: 'phase-1-2', command: '', skill: '', gate: '', dependsOn: ['phase-1-1'], editScope: [] },
          ],
        },
      ],
    }
    expect(() => writeLock(TEST_DIR, cyclicLock)).toThrow('[Harness] Lock validation failed')
    expect(() => writeLock(TEST_DIR, cyclicLock)).toThrow('circular')
  })

  it('throws on non-existent dependsOn', () => {
    const badLock: RequirementsLock = {
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          locked: true,
          requirements: [],
          tasks: [
            { id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: ['phase-99'], editScope: [] },
          ],
        },
      ],
    }
    expect(() => writeLock(TEST_DIR, badLock)).toThrow('[Harness] Lock validation failed')
  })
})

describe('lockField', () => {
  it('marks requirement as locked', () => {
    const lock = makeLock()
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify(lock))
    lockField(TEST_DIR, 'phase-0', 'req-1')
    const read = readLock(TEST_DIR)
    expect(read.phases[0].requirements[0].locked).toBe(true)
  })

  it('throws if requirement not found', () => {
    const lock = makeLock()
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify(lock))
    expect(() => lockField(TEST_DIR, 'phase-99', 'req-99')).toThrow('[Harness] Requirement not found')
  })
})

describe('isLocked', () => {
  it('returns false if lock file does not exist', () => {
    expect(isLocked(TEST_DIR, 'phase-0', 'req-1')).toBe(false)
  })

  it('returns true if requirement is locked', () => {
    const lock = makeLock()
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify(lock))
    expect(isLocked(TEST_DIR, 'phase-0', 'req-1')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/kernel/lock-store.test.ts`
Expected: FAIL — lock-store.ts not found

- [ ] **Step 3: Write implementation**

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join } from 'path'
import { RequirementsLockSchema } from './schemas.js'
import type { RequirementsLock } from './schemas.js'

const [Harness] = ['[Harness]']

const LOCK_FILE = 'requirements.lock.json'

function lockPath(dir: string): string {
  return join(dir, LOCK_FILE)
}

function atomicWrite(filePath: string, data: string): void {
  const tmp = `${filePath}.tmp`
  writeFileSync(tmp, data, 'utf-8')
  renameSync(tmp, filePath)
}

function validateLock(lock: RequirementsLock): void {
  // Collect all task IDs
  const allTaskIds = new Set<string>()
  for (const phase of lock.phases) {
    for (const task of phase.tasks) {
      if (allTaskIds.has(task.id)) {
        throw new Error(`${Harness} Lock validation failed: duplicate task ID: ${task.id}`)
      }
      allTaskIds.add(task.id)
    }
  }

  // Check dependsOn references
  for (const phase of lock.phases) {
    for (const task of phase.tasks) {
      for (const dep of task.dependsOn) {
        if (!allTaskIds.has(dep)) {
          throw new Error(`${Harness} Lock validation failed: dependsOn references non-existent task: ${dep}`)
        }
      }
    }
  }

  // Cycle detection
  const visited = new Set<string>()
  const inStack = new Set<string>()

  const detectCycle = (taskId: string, path: string[]): string | null => {
    if (inStack.has(taskId)) return [...path, taskId].join(' → ')
    if (visited.has(taskId)) return null
    visited.add(taskId)
    inStack.add(taskId)
    const task = lock.phases.flatMap(p => p.tasks).find(t => t.id === taskId)
    if (task) {
      for (const dep of task.dependsOn) {
        const cycle = detectCycle(dep, [...path, taskId])
        if (cycle) return cycle
      }
    }
    inStack.delete(taskId)
    return null
  }

  for (const phase of lock.phases) {
    for (const task of phase.tasks) {
      visited.clear()
      inStack.clear()
      const cycle = detectCycle(task.id, [])
      if (cycle) {
        throw new Error(`${Harness} Lock validation failed: circular dependsOn detected: ${cycle}`)
      }
    }
  }
}

export function readLock(dir: string): RequirementsLock {
  const file = lockPath(dir)
  if (!existsSync(file)) throw new Error(`${Harness} Requirements lock not found`)
  const content = readFileSync(file, 'utf-8')
  if (!content.trim()) throw new Error(`${Harness} Requirements lock empty`)
  try {
    return RequirementsLockSchema.parse(JSON.parse(content))
  } catch {
    throw new Error(`${Harness} Requirements lock validation failed`)
  }
}

export function writeLock(dir: string, lock: RequirementsLock): void {
  const file = lockPath(dir)
  if (existsSync(file)) throw new Error(`${Harness} Requirements lock already exists`)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  validateLock(lock)
  try {
    RequirementsLockSchema.parse(lock)
  } catch (e) {
    throw new Error(`${Harness} Lock validation failed: ${e instanceof Error ? e.message : String(e)}`)
  }
  atomicWrite(file, JSON.stringify(lock, null, 2))
}

export function lockField(dir: string, phaseId: string, requirementId: string): void {
  const lock = readLock(dir)
  const phase = lock.phases.find(p => p.id === phaseId)
  if (!phase) throw new Error(`${Harness} Phase not found: ${phaseId}`)
  const req = phase.requirements.find(r => r.id === requirementId)
  if (!req) throw new Error(`${Harness} Requirement not found: ${phaseId}/${requirementId}`)
  req.locked = true
  const file = lockPath(dir)
  atomicWrite(file, JSON.stringify(lock, null, 2))
}

export function isLocked(dir: string, phaseId: string, requirementId: string): boolean {
  if (!existsSync(lockPath(dir))) return false
  try {
    const lock = readLock(dir)
    const phase = lock.phases.find(p => p.id === phaseId)
    if (!phase) return false
    const req = phase.requirements.find(r => r.id === requirementId)
    return req?.locked ?? false
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/kernel/lock-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/kernel/lock-store.ts tests/kernel/lock-store.test.ts
git commit -m "feat(kernel): add lock-store with cycle detection, task ID validation, and atomic writes"
```

---

## Task 6: Kernel State Recovery

**Files:**
- Create: `src/kernel/state-recovery.ts`
- Create: `tests/kernel/state-recovery.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { reconstructState } from '../../src/kernel/state-recovery.js'
import { writeFileSync, mkdirSync, unlinkSync, existsSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/harness-test-recovery'

beforeEach(() => {
  cleanup()
  mkdirSync(join(TEST_DIR, 'session-agents-trackpad'), { recursive: true })
  mkdirSync(join(TEST_DIR, 'reviews'), { recursive: true })
  mkdirSync(join(TEST_DIR, 'plans'), { recursive: true })
})

afterEach(() => { cleanup() })

function cleanup() {
  try {
    const dirs = [
      join(TEST_DIR, 'session-agents-trackpad'),
      join(TEST_DIR, 'reviews'),
      join(TEST_DIR, 'plans'),
    ]
    for (const d of dirs) {
      if (existsSync(d)) {
        for (const f of readdirSync(d)) {
          unlinkSync(join(d, f))
        }
        rmSync(d, { recursive: true, force: true })
      }
    }
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true })
    }
  } catch {}
}

describe('reconstructState', () => {
  it('returns reconstructed state from all files', () => {
    // Write pad
    writeFileSync(join(TEST_DIR, 'session-agents-trackpad', 'pad-001.json'), JSON.stringify({
      id: 'pad-001',
      sessionId: 's1',
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-1',
      currentTask: 'phase-1-1',
      checkpointStatus: { 'phase-1-1': 'completed' },
      gateRetries: {},
    }))
    // Write lock
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify({
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          locked: true,
          requirements: [],
          tasks: [
            { id: 'phase-1-1', command: '', skill: '', gate: 'bun test', dependsOn: [], editScope: [] },
          ],
        },
      ],
    }))
    // Write review
    writeFileSync(join(TEST_DIR, 'reviews', 'phase-1-1.json'), JSON.stringify({
      phase: 'phase-1',
      task: 'phase-1-1',
      reviewer: 'code-critic',
      timestamp: new Date().toISOString(),
      verdict: 'approved',
      checks: { lspErrors: 0, testsPassed: true, requirementsLocked: true, crossDepsValid: true },
    }))
    // Write plan
    writeFileSync(join(TEST_DIR, 'plans', 'pipeline.md'), '# Pipeline')

    const state = reconstructState(
      join(TEST_DIR, 'session-agents-trackpad', 'pad-001.json'),
      join(TEST_DIR, 'plans', 'nonexistent.md'),
      join(TEST_DIR, 'requirements.lock.json'),
      join(TEST_DIR, 'reviews'),
    )
    expect(state.plan).toBe('')
  })

  it('skips invalid review files with warning', () => {
    writeFileSync(join(TEST_DIR, 'session-agents-trackpad', 'pad-001.json'), JSON.stringify({
      id: 'pad-001',
      sessionId: 's1',
      status: 'active',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-1',
      currentTask: 'phase-1-1',
      checkpointStatus: {},
      gateRetries: {},
    }))
    writeFileSync(join(TEST_DIR, 'requirements.lock.json'), JSON.stringify({
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          locked: true,
          requirements: [],
          tasks: [{ id: 'phase-1-1', command: '', skill: '', gate: '', dependsOn: [], editScope: [] }],
        },
      ],
    }))
    writeFileSync(join(TEST_DIR, 'reviews', 'invalid.json'), 'not json')
    writeFileSync(join(TEST_DIR, 'reviews', 'phase-1-1.json'), JSON.stringify({
      phase: 'phase-1',
      task: 'phase-1-1',
      reviewer: 'code-critic',
      timestamp: new Date().toISOString(),
      verdict: 'approved',
      checks: { lspErrors: 0, testsPassed: true, requirementsLocked: true, crossDepsValid: true },
    }))

    const state = reconstructState(
      join(TEST_DIR, 'session-agents-trackpad', 'pad-001.json'),
      join(TEST_DIR, 'plans', 'pipeline.md'),
      join(TEST_DIR, 'requirements.lock.json'),
      join(TEST_DIR, 'reviews'),
    )
    expect(state.gateResult.unlocked).toContain('phase-1-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/kernel/state-recovery.test.ts`
Expected: FAIL — state-recovery.ts not found

- [ ] **Step 3: Write implementation**

```typescript
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema } from './schemas.js'
import { evaluateGate } from './gate.js'
import type { SessionPad, RequirementsLock, ReviewVerdict, GateResult } from './schemas.js'

const [Harness] = ['[Harness]']

export function reconstructState(
  padPath: string,
  planPath: string,
  lockPath: string,
  reviewDir: string,
): { pad: SessionPad; plan: string; requirements: RequirementsLock; gateResult: GateResult } {
  // Read pad — padPath is a direct file path
  if (!existsSync(padPath)) throw new Error(`${Harness} Pad file not found: ${padPath}`)
  const padContent = readFileSync(padPath, 'utf-8')
  if (!padContent.trim()) throw new Error(`${Harness} Pad file empty: ${padPath}`)
  let pad: SessionPad
  try {
    pad = SessionPadSchema.parse(JSON.parse(padContent))
  } catch (e) {
    throw new Error(`${Harness} Pad validation failed: ${padPath}: ${e instanceof Error ? e.message : String(e)}`)
  }

  // Read plan (optional)
  let plan = ''
  if (existsSync(planPath)) {
    try {
      plan = readFileSync(planPath, 'utf-8')
    } catch {
      throw new Error(`${Harness} Plan file unreadable: ${planPath}`)
    }
  }

  // Read lock
  if (!existsSync(lockPath)) throw new Error(`${Harness} Requirements lock not found: ${lockPath}`)
  const lockContent = readFileSync(lockPath, 'utf-8')
  if (!lockContent.trim()) throw new Error(`${Harness} Requirements lock empty: ${lockPath}`)
  let requirements: RequirementsLock
  try {
    requirements = RequirementsLockSchema.parse(JSON.parse(lockContent))
  } catch {
    throw new Error(`${Harness} Requirements lock validation failed: ${lockPath}`)
  }

  // Read reviews
  const reviews = new Map<string, ReviewVerdict>()
  if (existsSync(reviewDir)) {
    const reviewFiles = readdirSync(reviewDir).filter(f => f.endsWith('.json') && !f.startsWith('.') && !f.includes('.v'))
    for (const f of reviewFiles) {
      try {
        const content = readFileSync(join(reviewDir, f), 'utf-8')
        const verdict = ReviewVerdictSchema.parse(JSON.parse(content))
        reviews.set(verdict.task, verdict)
      } catch {
        console.warn(`${Harness} Skipping invalid review: ${f}`)
      }
    }
  }

  const gateResult = evaluateGate(reviews, requirements)

  return { pad, plan, requirements, gateResult }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/kernel/state-recovery.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/kernel/state-recovery.ts tests/kernel/state-recovery.test.ts
git commit -m "feat(kernel): add reconstructState() for compaction recovery with review loading and gate evaluation"
```

---

## Task 7: Kernel Index (Barrel Export)

**Files:**
- Create: `src/kernel/index.ts`

- [ ] **Step 1: Write barrel export**

```typescript
export { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema, GateResultSchema, PermissionRequestSchema } from './schemas.js'
export type { SessionPad, RequirementsLock, ReviewVerdict, GateResult, PermissionRequest, PermissionOutput, Task, Phase } from './schemas.js'

export { evaluateGate } from './gate.js'
export { isToolAllowedForPhase, matchesGlob, getPhaseEditPaths, getAllowedTestCommands } from './permission-gate.js'

export { readPad, writePad, listPads, acquirePad, releasePad, incrementRetry, resetRetry } from './pad-store.js'
export { readLock, writeLock, lockField, isLocked } from './lock-store.js'
export { reconstructState } from './state-recovery.js'
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS with no errors

- [ ] **Step 3: Commit**

```bash
git add src/kernel/index.ts
git commit -m "feat(kernel): add barrel export for all kernel public APIs"
```

---

## Task 8: Harness Plugin Entry + Permission Gate Hook

**NOTE:** `src/plugin/` is renamed to `src/harness/` to avoid macOS case-insensitive filesystem conflict with existing `src/plugin.ts`.

**Files:**
- Create: `src/harness/index.ts`
- Create: `src/harness/hooks/permission-gate.ts`

- [ ] **Step 1: Write harness/index.ts (plugin entry — uses real Plugin type: async function returning Hooks)**

The real OpenCode Plugin API is: `type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>`

Hooks is a flat object with hook names as keys. Tools use the `tool()` helper from `@opencode-ai/plugin`.

```typescript
import type { Plugin } from '@opencode-ai/plugin'
import * as OpenCodePlugin from '@opencode-ai/plugin'

const pluginTool = (OpenCodePlugin as unknown as { tool?: <T>(def: T) => T }).tool

export const CheckpointHarness: Plugin = async ({ client }) => {
  const directory = process.cwd() + '/.hivemind'

  return {
    'permission.ask': async (input: PermissionInput, output: { status: 'ask' | 'ask' | 'allow' }) => {
      const { handlePermissionAsk } = await import('./hooks/permission-gate.js')
      return handlePermissionAsk(input, output, directory)
    },

    'experimental.chat.system.transform': async (_input: unknown, output: { system: string[] }) => {
      const { handleSystemTransform } = await import('./hooks/prompt-inject.js')
      return handleSystemTransform(output, directory)
    },

    'tool.definition': async (input: { toolID: string }, output: { description: string; parameters: unknown }) => {
      const { handleToolDefinition } = await import('./hooks/tool-descriptor.js')
      return handleToolDefinition(input, output, directory)
    },

    tool: {
      'gate-check': pluginTool({
        description: 'Run gate validation checks for a phase/task checkpoint',
        parameters: {
          type: 'object' as const,
          properties: {
            phase: { type: 'string', description: 'Phase ID (e.g., "phase-1")' },
            task: { type: 'string', description: 'Task ID (e.g., "phase-1-1")' },
          },
          required: ['phase', 'task'],
        },
        execute: async (args: { phase: string; task: string }) => {
          const { runGateCheck } = await import('./tools/gate-check.js')
          return runGateCheck(args.phase, args.task, directory)
        },
      }),
    },
  }
}

export default CheckpointHarness

interface PermissionInput {
  id: string
  type: string
  pattern?: string | string[]
  sessionID: string
  messageID: string
  callID?: string
  title?: string
  metadata?: Record<string, unknown>
  time?: string
}
```

- [ ] **Step 2: Write hooks/permission-gate.ts**

```typescript
import { join } from 'path'
import type { PermissionRequest } from '../../kernel/schemas.js'
import { reconstructState, isToolAllowedForPhase } from '../../kernel/index.js'

interface PermissionInput {
  id: string
  type: string
  pattern?: string | string[]
  sessionID: string
  messageID: string
  callID?: string
  title?: string
  metadata?: Record<string, unknown>
  time?: string
}

function adaptPermission(native: PermissionInput): PermissionRequest {
  return {
    type: native.type,
    pattern: native.pattern,
    sessionID: native.sessionID,
    metadata: native.metadata,
    title: native.title,
  }
}

function extractPhase(request: PermissionRequest): string | null {
  if (request.metadata?.phase) return String(request.metadata.phase)
  if (request.title?.includes('phase-')) {
    const match = request.title.match(/(phase-\d+)/)
    return match ? match[1] : null
  }
  return null
}

export function handlePermissionAsk(
  nativeInput: PermissionInput,
  output: { status: 'ask' | 'ask' | 'allow' },
  directory: string,
): void {
  const request = adaptPermission(nativeInput)
  const phase = extractPhase(request)

  try {
    const padPath = findActivePad(join(directory, 'session-agents-trackpad'))
    const planPath = join(directory, 'plans', 'pipeline.md')
    const lockPath = join(directory, 'requirements.lock.json')
    const reviewDir = join(directory, 'reviews')

    const { gateResult, requirements } = reconstructState(padPath, planPath, lockPath, reviewDir)
    const effectivePhase = phase ?? gateResult.currentPhase

    if (isToolAllowedForPhase(request, effectivePhase, gateResult, requirements)) {
      output.status = 'allow'
    } else {
      output.status = 'ask'
    }
  } catch {
    output.status = 'ask'
  }
}

function findActivePad(padDir: string): string {
  const { readdirSync, existsSync } = require('fs') as typeof import('fs')
  if (!existsSync(padDir)) throw new Error('[Harness] Pad directory not found')
  const files = readdirSync(padDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
  if (files.length === 0) throw new Error('[Harness] No pad files found')
  return join(padDir, files[0])
}
```

**Wait — `require()` violates ESM.** Replace with top-level `import { readdirSync, existsSync } from 'fs'`:

```typescript
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { PermissionRequest } from '../../kernel/schemas.js'
import { reconstructState, isToolAllowedForPhase } from '../../kernel/index.js'

interface PermissionInput {
  id: string
  type: string
  pattern?: string | string[]
  sessionID: string
  messageID: string
  callID?: string
  title?: string
  metadata?: Record<string, unknown>
  time?: string
}

function adaptPermission(native: PermissionInput): PermissionRequest {
  return {
    type: native.type,
    pattern: native.pattern,
    sessionID: native.sessionID,
    metadata: native.metadata,
    title: native.title,
  }
}

function extractPhase(request: PermissionRequest): string | null {
  if (request.metadata?.phase) return String(request.metadata.phase)
  if (request.title?.includes('phase-')) {
    const match = request.title.match(/(phase-\d+)/)
    return match ? match[1] : null
  }
  return null
}

function findActivePad(padDir: string): string {
  if (!existsSync(padDir)) throw new Error('[Harness] Pad directory not found')
  const files = readdirSync(padDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
  if (files.length === 0) throw new Error('[Harness] No pad files found')
  return join(padDir, files[0])
}

export function handlePermissionAsk(
  nativeInput: PermissionInput,
  output: { status: 'ask' | 'ask' | 'allow' },
  directory: string,
): void {
  const request = adaptPermission(nativeInput)
  const phase = extractPhase(request)

  try {
    const padPath = findActivePad(join(directory, 'session-agents-trackpad'))
    const planPath = join(directory, 'plans', 'pipeline.md')
    const lockPath = join(directory, 'requirements.lock.json')
    const reviewDir = join(directory, 'reviews')

    const { gateResult, requirements } = reconstructState(padPath, planPath, lockPath, reviewDir)
    const effectivePhase = phase ?? gateResult.currentPhase

    if (isToolAllowedForPhase(request, effectivePhase, gateResult, requirements)) {
      output.status = 'allow'
    } else {
      output.status = 'ask'
    }
  } catch {
    output.status = 'ask'
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/harness/index.ts src/harness/hooks/permission-gate.ts
git commit -m "feat(harness): add plugin entry with async function pattern + permission.ask hook"
```

---

## Task 9: Harness Prompt Inject Hook

**Files:**
- Create: `src/harness/hooks/prompt-inject.ts`

- [ ] **Step 1: Write prompt-inject.ts**

```typescript
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { reconstructState } from '../../kernel/index.js'

function findActivePad(padDir: string): string {
  if (!existsSync(padDir)) throw new Error('[Harness] Pad directory not found')
  const files = readdirSync(padDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
  if (files.length === 0) throw new Error('[Harness] No pad files found')
  return join(padDir, files[0])
}

export function handleSystemTransform(
  output: { system: string[] },
  directory: string,
): void {
  try {
    const padPath = findActivePad(join(directory, 'session-agents-trackpad'))
    const planPath = join(directory, 'plans', 'pipeline.md')
    const lockPath = join(directory, 'requirements.lock.json')
    const reviewDir = join(directory, 'reviews')

    const { pad, requirements, gateResult } = reconstructState(padPath, planPath, lockPath, reviewDir)

    const currentPhase = pad.currentPhase
    const templatesDir = join(directory, 'templates')
    const templatePath = join(templatesDir, `${currentPhase}.txt`)
    let phaseInstructions = ''
    if (existsSync(templatePath)) {
      phaseInstructions = readFileSync(templatePath, 'utf-8')
    } else {
      console.warn(`[Harness] No template found for phase: ${currentPhase}`)
    }

    const phaseData = requirements.phases.find(p => p.id === currentPhase)
    const prerequisitesText = phaseData?.requirements
      ?.filter(r => r.locked)
      ?.map(r => `  - ${r.id}: ${r.description}`)
      ?.join('\n') ?? ''

    const retries = Object.entries(pad.gateRetries)
      .map(([k, v]) => `    ${k}: ${v} (of max 3)`)
      .join('\n')

    const context = `
<harness_context>
Session: ${pad.id}
Current phase: ${gateResult.currentPhase}, Task: ${gateResult.currentTask}
Unlocked checkpoints: ${gateResult.unlocked.join(', ') || 'none'}
Gate retries:
${retries || '  (none)'}

<phase_instructions>
${phaseInstructions}
</phase_instructions>

<prerequisites_reminder>
Before proceeding, ensure:
${prerequisitesText || '  (none)'}
</prerequisites_reminder>

<stop_conditions>
Stop if: gate fails 3x on same checkpoint, user sends "pause"/"stop", all checkpoints complete
</stop_conditions>
</harness_context>
`.trim()

    output.system.push(context)
  } catch {
    output.system.push(`<harness_context>
[Harness] State unavailable. Run 'harness init' to initialize.
</harness_context>`)
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/harness/hooks/prompt-inject.ts
git commit -m "feat(harness): add experimental.chat.system.transform hook for phase context injection"
```

---

## Task 10: Harness Tool Descriptor Hook

**Files:**
- Create: `src/harness/hooks/tool-descriptor.ts`

- [ ] **Step 1: Write tool-descriptor.ts**

```typescript
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { reconstructState } from '../../kernel/index.js'

function findActivePad(padDir: string): string {
  if (!existsSync(padDir)) throw new Error('[Harness] Pad directory not found')
  const files = readdirSync(padDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
  if (files.length === 0) throw new Error('[Harness] No pad files found')
  return join(padDir, files[0])
}

export function handleToolDefinition(
  input: { toolID: string },
  output: { description: string; parameters: unknown },
  directory: string,
): void {
  try {
    const padPath = findActivePad(join(directory, 'session-agents-trackpad'))
    const planPath = join(directory, 'plans', 'pipeline.md')
    const lockPath = join(directory, 'requirements.lock.json')
    const reviewDir = join(directory, 'reviews')

    const { gateResult, requirements } = reconstructState(padPath, planPath, lockPath, reviewDir)

    const currentPhase = gateResult.currentPhase
    const phaseLocked = !gateResult.unlocked.some(id => id.startsWith(currentPhase))

    if (input.toolID === 'skill') {
      const phase = requirements.phases.find(p => p.id === currentPhase)
      if (phase && phase.tasks.length > 0) {
        const skill = phase.tasks[0].skill
        if (skill) {
          output.description += `\n\nCurrent harness phase: ${currentPhase}. Load the ${skill} skill for instructions.`
        }
      }
    } else if (phaseLocked && gateResult.gateStatus === 'locked') {
      output.description += `\n\n[Harness] LOCKED: This tool is not available until phase ${currentPhase} passes gate validation. Complete all tasks and pass code-critic review to unlock.`
    }
  } catch {
    // State unavailable — do not modify description
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/harness/hooks/tool-descriptor.ts
git commit -m "feat(harness): add tool.definition hook for lock warnings"
```

---

## Task 11: Harness Gate Check Tool

**Files:**
- Create: `src/harness/tools/gate-check.ts`

- [ ] **Step 1: Write gate-check.ts**

```typescript
import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { readLock } from '../../kernel/index.js'

export async function runGateCheck(phase: string, task: string, directory: string): Promise<string> {
  const checks: Record<string, string> = {}
  let blocked = false

  try {
    const lock = readLock(directory)
    const phaseData = lock.phases.find(p => p.id === phase)
    if (!phaseData) {
      checks['requirements_locked'] = 'FAIL: phase not found'
      blocked = true
    } else {
      const taskData = phaseData.tasks.find(t => t.id === task)
      if (!taskData) {
        checks['requirements_locked'] = 'FAIL: task not found'
        blocked = true
      } else {
        checks['requirements_locked'] = 'PASS: all locked fields intact'
      }
    }
  } catch {
    checks['requirements_locked'] = 'FAIL: requirements.lock.json not found or invalid'
    blocked = true
  }

  let testCmd = 'vitest run'
  try {
    const lock = readLock(directory)
    const phaseData = lock.phases.find(p => p.id === phase)
    const taskData = phaseData?.tasks.find(t => t.id === task)
    if (taskData?.gate) {
      testCmd = taskData.gate
    }
  } catch {
    // Lock file error already reported above
  }

  try {
    const result = await runCommand(testCmd, 120_000)
    checks['tests'] = result.passed ? `PASS: ${result.count} tests passed` : `FAIL: tests failed`
    if (!result.passed) blocked = true
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    checks['tests'] = `FAIL: ${msg}`
    blocked = true
  }

  try {
    const lock = readLock(directory)
    const phaseData = lock.phases.find(p => p.id === phase)
    const taskData = phaseData?.tasks.find(t => t.id === task)
    if (taskData?.dependsOn && taskData.dependsOn.length > 0) {
      for (const dep of taskData.dependsOn) {
        const reviewFile = join(directory, 'reviews', `${dep}.json`)
        if (existsSync(reviewFile)) {
          try {
            const review = JSON.parse(readFileSync(reviewFile, 'utf-8'))
            checks[`dep:${dep}`] = review.verdict === 'approved'
              ? `PASS: Dependency approved`
              : `FAIL: Dependency not approved`
            if (review.verdict !== 'approved') blocked = true
          } catch {
            checks[`dep:${dep}`] = `FAIL: Could not read dependency review`
            blocked = true
          }
        } else {
          checks[`dep:${dep}`] = `FAIL: No dependency review found`
          blocked = true
        }
      }
    }
  } catch {
    // Lock file error already reported above
  }

  const status = blocked ? 'BLOCKED' : 'PASSED'
  const lines = [`Gate check for ${phase}/${task}: ${status}`, '']
  for (const [k, v] of Object.entries(checks)) {
    lines.push(`${v.includes('PASS') ? 'PASS' : 'FAIL'} ${k}: ${v.split(': ')[1] ?? v}`)
  }

  return lines.join('\n')
}

function runCommand(cmd: string, timeoutMs: number): Promise<{ passed: boolean; count: number }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [], { shell: true })
    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error(`Timed out after ${timeoutMs}ms (command: ${cmd})`))
    }, timeoutMs)

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        const match = stdout.match(/(\d+)\s+passing/)
        resolve({ passed: true, count: match ? parseInt(match[1]) : 0 })
      } else {
        reject(new Error(stderr || stdout || `Exit code ${String(code)}`))
      }
    })
    proc.on('error', (e) => {
      clearTimeout(timer)
      reject(e)
    })
  })
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/harness/tools/gate-check.ts
git commit -m "feat(harness): add gate-check tool with test execution, dependency checks, and lock validation"
```

---

## Task 12: CLI
- Create: `src/cli/index.ts`

- [ ] **Step 1: Write CLI**

```typescript
#!/usr/bin/env node

import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync, renameSync, cpSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema } from '../kernel/schemas.js'
import { readLock, readPad, listPads } from '../kernel/index.js'

type Command = 'init' | 'validate' | 'status' | 'reset'

const [cmd, ...args] = process.argv.slice(2)
const command = cmd as Command

const HIVEMIND_DIR = '.hivemind'
const HIVEMIND_SUBDIRS = ['session-agents-trackpad', 'reviews', 'templates', 'plans']
const HIVEMIND_FILES = ['requirements.lock.json']
const PADS = ['pad-001.json', 'pad-002.json', 'pad-003.json']

async function main() {
  switch (command) {
    case 'init':
      await cmdInit()
      break
    case 'validate':
      await cmdValidate()
      break
    case 'status':
      await cmdStatus()
      break
    case 'reset':
      await cmdReset(args.includes('--force'))
      break
    default:
      console.error('Usage: harness <init|validate|status|reset> [--force]')
      process.exit(1)
  }
}

async function cmdInit() {
  console.log('Initializing HiveMind harness...')
  
  if (existsSync(HIVEMIND_DIR)) {
    console.error(`[Harness] ${HIVEMIND_DIR}/ already exists. Run 'harness reset --force' to wipe.`)
    process.exit(1)
  }

  mkdirSync(HIVEMIND_DIR, { recursive: true })
  for (const subdir of HIVEMIND_SUBDIRS) {
    mkdirSync(join(HIVEMIND_DIR, subdir), { recursive: true })
  }

  // Create pad files (released state)
  for (const padFile of PADS) {
    const pad = {
      id: padFile.replace('.json', ''),
      sessionId: null,
      status: 'released',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-0',
      currentTask: 'phase-0-1',
      checkpointStatus: {},
      gateRetries: {},
    }
    writeFileSync(join(HIVEMIND_DIR, 'session-agents-trackpad', padFile), JSON.stringify(pad, null, 2))
  }

  // Create default templates
  const defaultTemplates = {
    'phase-0.txt': `# Phase 0: Discovery

You are in the discovery phase. Use the question tool to negotiate requirements with the user.

Ask one question at a time. Build a picture of:
1. The project structure
2. The target output / success criteria
3. Key technical decisions

Compile your findings into a RequirementsLock and save to .hivemind/requirements.lock.json.`,
    'phase-1.txt': `# Phase 1: Implementation

You are in Phase 1. Execute your assigned tasks.
Only edit files within your designated editScope.
Run tests using the gate-check tool before marking complete.`,
  }
  for (const [filename, content] of Object.entries(defaultTemplates)) {
    writeFileSync(join(HIVEMIND_DIR, 'templates', filename), content)
  }

  // Create pipeline template
  writeFileSync(join(HIVEMIND_DIR, 'plans', 'pipeline.md'), `# Pipeline

## Current Status
Phase: phase-0
Task: phase-0-1

## Phases
1. phase-0: Discovery (requirements negotiation)
2. phase-1: Implementation
3. phase-N: ...
`)

  // Scaffold .opencode/ assets from package assets/ directory
  const assetsDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', '.opencode'))
  if (existsSync(assetsDir)) {
    cpSync(assetsDir, '.opencode', { recursive: true })
    console.log('✓ Scaffolded .opencode/ agents, commands, and skills')
  }

  console.log(`✓ Created ${HIVEMIND_DIR}/ with subdirectories`)
  console.log(`✓ Created ${PADS.length} session pads`)
  console.log(`✓ Run 'harness status' to see current state`)
}

async function cmdValidate() {
  let errors: string[] = []

  // Validate pad files
  const padsDir = join(HIVEMIND_DIR, 'session-agents-trackpad')
  if (existsSync(padsDir)) {
    for (const f of readdirSync(padsDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))) {
      try {
        const content = readFileSync(join(padsDir, f), 'utf-8')
        SessionPadSchema.parse(JSON.parse(content))
      } catch (e) {
        errors.push(`Pad ${f}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  // Validate lock file
  const lockFile = join(HIVEMIND_DIR, 'requirements.lock.json')
  if (existsSync(lockFile)) {
    try {
      const content = readFileSync(lockFile, 'utf-8')
      RequirementsLockSchema.parse(JSON.parse(content))
    } catch (e) {
      errors.push(`Lock: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Validate review files
  const reviewsDir = join(HIVEMIND_DIR, 'reviews')
  if (existsSync(reviewsDir)) {
    for (const f of readdirSync(reviewsDir).filter(f => f.endsWith('.json'))) {
      try {
        const content = readFileSync(join(reviewsDir, f), 'utf-8')
        ReviewVerdictSchema.parse(JSON.parse(content))
      } catch (e) {
        errors.push(`Review ${f}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  if (errors.length === 0) {
    console.log('✓ All .hivemind/ files are valid')
    process.exit(0)
  } else {
    console.error('[Harness] Validation errors:')
    for (const err of errors) {
      console.error(`  - ${err}`)
    }
    process.exit(1)
  }
}

async function cmdStatus() {
  if (!existsSync(HIVEMIND_DIR)) {
    console.log('[Harness] Not initialized. Run "harness init" first.')
    return
  }

  try {
    const pads = listPads(join(HIVEMIND_DIR, 'session-agents-trackpad'))
    const activePads = pads.filter(p => p.status === 'active')
    
    console.log('=== HiveMind Status ===\n')
    console.log(`Pads: ${pads.length} total, ${activePads.length} active`)
    
    for (const pad of activePads) {
      console.log(`\nSession: ${pad.sessionId} (${pad.id})`)
      console.log(`  Phase: ${pad.currentPhase}`)
      console.log(`  Task: ${pad.currentTask}`)
      console.log(`  Version: ${pad.version}`)
    }

    const lockFile = join(HIVEMIND_DIR, 'requirements.lock.json')
    if (existsSync(lockFile)) {
      const lock = readLock(HIVEMIND_DIR)
      console.log(`\nRequirements: ${lock.phases.length} phases, ${lock.phases.reduce((acc, p) => acc + p.tasks.length, 0)} tasks`)
    } else {
      console.log('\nRequirements: not yet created (Phase 0 not complete)')
    }
  } catch (e) {
    console.error(`[Harness] Status error: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  }
}

async function cmdReset(force: boolean) {
  if (!force) {
    console.error('[Harness] Reset requires --force flag: harness reset --force')
    process.exit(1)
  }
  if (existsSync(HIVEMIND_DIR)) {
    rmSync(HIVEMIND_DIR, { recursive: true, force: true })
    console.log(`✓ Wiped ${HIVEMIND_DIR}/`)
  }
}

export function archiveReview(directory: string, taskId: string): void {
  const reviewFile = join(directory, 'reviews', `${taskId}.json`)
  if (!existsSync(reviewFile)) return

  const reviewContent = readFileSync(reviewFile, 'utf-8')
  const review = JSON.parse(reviewContent)
  let version = 1

  // Find next available version number
  while (existsSync(join(directory, 'reviews', `${taskId}.v${version}.json`))) {
    version++
  }

  // Archive the old review
  renameSync(reviewFile, join(directory, 'reviews', `${taskId}.v${version}.json`))
  console.log(`✓ Archived review: ${taskId}.v${version}.json`)
}

main()
```

- [ ] **Step 2: Make CLI executable and run typecheck**

Run: `chmod +x src/cli/index.ts && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/cli/index.ts
git commit -m "feat(cli): add harness init/validate/status/reset commands"
```

---

## Task 13: Assets

**Files:**
- Create: `assets/.opencode/agents/orchestrator.md`
- Create: `assets/.opencode/agents/phase-worker.md`
- Create: `assets/.opencode/agents/code-critic.md`
- Create: `assets/.opencode/agents/explore.md`
- Create: `assets/.opencode/agents/researcher.md`
- Create: `assets/.opencode/commands/harness-execute.md`
- Create: `assets/.opencode/commands/harness-review.md`
- Create: `assets/.opencode/commands/harness-doctor.md`
- Create: `assets/.opencode/commands/harness-status.md`
- Create: `assets/.opencode/skills/gate-review/SKILL.md`
- Create: `assets/.opencode/skills/onboarding/SKILL.md`
- Create: `assets/.opencode/skills/api-types/SKILL.md`
- Create: `assets/.opencode/skills/http-handlers/SKILL.md`
- Create: `assets/.opencode/skills/testing/SKILL.md`

**Note:** This task produces all the `.opencode/` asset files. Each file follows the OpenCode agent/command/skill format.

- [ ] **Step 1: Create all asset files**

(Asset files are markdown with YAML frontmatter per OpenCode conventions)

**Example: orchestrator.md:**
```markdown
---
name: orchestrator
description: Primary macro-level coordinator for HiveMind checkpoint harness
mode: primary
---

## On Every Turn
1. Read your session pad from .hivemind/session-agents-trackpad/
2. Read .hivemind/plans/pipeline.md for strategic context
3. Read .hivemind/requirements.lock.json for locked requirements
4. Check todowrite for checkpoint state

## Checkpoint Execution
For each pending checkpoint:
1. Dispatch phase-worker via TaskTool with checkpoint command + skill name
2. Dispatch code-critic via TaskTool for validation
3. Gate pass → update todowrite, advance
4. Gate fail → resume phase-worker (pass task_id) with fix instructions

## Permission Model
All agents receive broad static permissions in their agent definitions.
The permission.ask hook performs the real runtime gating based on:
- Current phase state (from SessionPad)
- Phase-scoped edit paths (from RequirementsLock task.editScope)
- Data-driven bash allowlists (from RequirementsLock task.gate conditions)

No dynamic permission injection or agent file generation is needed.

## Stop Conditions
- All checkpoints completed
- Gate fails 3 consecutive times on same checkpoint → escalate to human
- User sends "pause" or "stop"
```

**Example: code-critic.md:**
```markdown
---
name: code-critic
description: Read-only reviewer that validates checkpoint work against locked requirements
mode: subagent
permission:
  edit:
    "*": "ask"
    ".hivemind/reviews/*.json": "allow"
  bash:
    "*": "ask"
    "bun test *": "allow"
    "npm test *": "allow"
  question: "ask"
  skill: "allow"
  read: "allow"
  grep: "allow"
---

## Review Protocol
1. Load gate-review skill via skill tool
2. Run gate-check tool for current phase/task
3. Validate LSP diagnostics show zero errors
4. Verify all requirements from requirements.lock.json are met
5. Write verdict to .hivemind/reviews/{taskId}.json
6. If approved: mark checkpoint complete in todowrite
7. If rejected: incrementRetry in pad, report issues to orchestrator
```

**Example: harness-execute.md:**
```markdown
---
description: Execute a harness phase task
agent: phase-worker
subtask: true
---

Execute the current harness checkpoint.

Phase: $ARGUMENTS

Load the appropriate skill via the skill tool first, then execute the task.
Work only within the scope defined by the current phase's permission profile.
```

**Example: gate-review skill SKILL.md:**
```markdown
# Gate Review Skill

## Purpose
Protocol for code-critic to validate checkpoint work against locked requirements.

## Review Steps
1. Read .hivemind/requirements.lock.json to understand locked requirements
2. Run gate-check tool for the current phase/task
3. Verify: zero LSP errors, all tests pass, requirements met
4. Write verdict: approved or rejected with specific feedback

## Verdict Format
Write to .hivemind/reviews/{taskId}.json:
{
  "phase": "phase-N",
  "task": "phase-N-N",
  "reviewer": "code-critic",
  "timestamp": "ISO datetime",
  "verdict": "approved" | "rejected",
  "checks": {
    "lspErrors": number,
    "testsPassed": boolean,
    "requirementsLocked": boolean,
    "crossDepsValid": boolean
  },
  "notes": "optional feedback"
}
```

- [ ] **Step 2: Commit all assets**

```bash
git add assets/
git commit -m "feat(assets): add .opencode agents, commands, and skills"
```

---

## Task 14: Integration Tests

**Files:**
- Create: `tests/integration/end-to-end.test.ts`

- [ ] **Step 1: Write integration test — full lifecycle: init → lock → gate → review → advance**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { reconstructState, writePad, readPad, acquirePad, releasePad, incrementRetry } from '../../src/kernel/index.js'
import { writeLock, readLock, lockField } from '../../src/kernel/index.js'
import { evaluateGate } from '../../src/kernel/gate.js'
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema } from '../../src/kernel/schemas.js'
import { archiveReview } from '../../src/cli/index.js'

const TEST_DIR = join(process.cwd(), '.test-harness-integration')

describe('End-to-End Harness Lifecycle', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(join(TEST_DIR, '.hivemind', 'session-agents-trackpad'), { recursive: true })
    mkdirSync(join(TEST_DIR, '.hivemind', 'reviews'), { recursive: true })
    mkdirSync(join(TEST_DIR, '.hivemind', 'plans'), { recursive: true })
    mkdirSync(join(TEST_DIR, '.hivemind', 'templates'), { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('runs full lifecycle: create pad → write lock → gate check → review → advance', () => {
    const padDir = join(TEST_DIR, '.hivemind', 'session-agents-trackpad')
    const lockDir = join(TEST_DIR, '.hivemind')
    const reviewDir = join(TEST_DIR, '.hivemind', 'reviews')

    // 1. Create and acquire pad
    writePad(padDir, {
      id: 'pad-001',
      sessionId: null,
      status: 'released',
      version: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md',
      currentPhase: 'phase-0',
      currentTask: 'phase-0-1',
      checkpointStatus: {},
      gateRetries: {},
    })
    const pad = acquirePad(padDir, 'session-001')
    expect(pad.status).toBe('active')

    // 2. Write requirements lock (simulating Phase 0 completion)
    writeLock(lockDir, {
      version: 1,
      lockedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-1',
          name: 'Implementation',
          locked: true,
          requirements: [{ id: 'req-1', description: 'All modules typed', locked: true }],
          tasks: [
            { id: 'phase-1-1', command: 'implement types', skill: 'api-types', gate: 'vitest run', dependsOn: [], editScope: ['src/types/'] },
            { id: 'phase-1-2', command: 'implement handlers', skill: 'http-handlers', gate: 'vitest run', dependsOn: ['phase-1-1'], editScope: ['src/handlers/'] },
          ],
        },
      ],
    })

    // 3. Evaluate gate — no reviews yet, should be locked
    const lock = readLock(lockDir)
    const emptyReviews = new Map()
    const gateResult = evaluateGate(emptyReviews, lock)
    expect(gateResult.gateStatus).toBe('locked')
    expect(gateResult.currentPhase).toBe('phase-1')
    expect(gateResult.currentTask).toBe('phase-1-1')

    // 4. Write an approved review for phase-1-1
    const review = {
      phase: 'phase-1',
      task: 'phase-1-1',
      reviewer: 'code-critic',
      timestamp: new Date().toISOString(),
      verdict: 'approved',
      checks: { lspErrors: 0, testsPassed: true, requirementsLocked: true, crossDepsValid: true },
    }
    writeFileSync(join(reviewDir, 'phase-1-1.json'), JSON.stringify(review))

    // 5. Re-evaluate gate — phase-1-1 should be unlocked
    const reviews = new Map<string, typeof review>()
    reviews.set('phase-1-1', review)
    const gateResult2 = evaluateGate(reviews, lock)
    expect(gateResult2.unlocked).toContain('phase-1-1')

    // 6. Reconstruct full state
    const padPath = join(padDir, 'pad-001.json')
    const planPath = join(TEST_DIR, '.hivemind', 'plans', 'pipeline.md')
    writeFileSync(planPath, '# Pipeline\n\nPhase: phase-1')
    const lockPath = join(lockDir, 'requirements.lock.json')

    const state = reconstructState(padPath, planPath, lockPath, reviewDir)
    expect(state.pad.id).toBe('pad-001')
    expect(state.gateResult.unlocked).toContain('phase-1-1')
    expect(state.requirements.phases[0].requirements[0].locked).toBe(true)

    // 7. Release pad
    releasePad(padDir, 'pad-001')
    const releasedPad = readPad(padDir, 'pad-001')
    expect(releasedPad.status).toBe('released')
  })

  it('handles review rejection and retry with archiving', () => {
    const padDir = join(TEST_DIR, '.hivemind', 'session-agents-trackpad')
    const lockDir = join(TEST_DIR, '.hivemind')
    const reviewDir = join(TEST_DIR, '.hivemind', 'reviews')

    // Setup
    writePad(padDir, {
      id: 'pad-001', sessionId: 's1', status: 'active', version: 1,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      pipelinePath: 'plans/pipeline.md', currentPhase: 'phase-1', currentTask: 'phase-1-1',
      checkpointStatus: {}, gateRetries: {},
    })
    writeLock(lockDir, {
      version: 1, lockedAt: new Date().toISOString(),
      phases: [{ id: 'phase-1', name: 'Phase 1', locked: true, requirements: [], tasks: [
        { id: 'phase-1-1', command: '', skill: '', gate: 'vitest run', dependsOn: [], editScope: [] },
      ]}],
    })

    // Write a rejected review
    const rejected = {
      phase: 'phase-1', task: 'phase-1-1', reviewer: 'code-critic',
      timestamp: new Date().toISOString(), verdict: 'rejected',
      checks: { lspErrors: 2, testsPassed: false, requirementsLocked: true, crossDepsValid: true },
      notes: 'Type errors in handlers',
    }
    writeFileSync(join(reviewDir, 'phase-1-1.json'), JSON.stringify(rejected))

    // Archive the rejected review before retry
    archiveReview(TEST_DIR, 'phase-1-1')

    // Verify archive was created
    expect(existsSync(join(reviewDir, 'phase-1-1.v1.json'))).toBe(true)
    expect(existsSync(join(reviewDir, 'phase-1-1.json'))).toBe(false)

    // Increment retry on pad
    incrementRetry(padDir, 'pad-001', 'phase-1-1')
    const pad = readPad(padDir, 'pad-001')
    expect(pad.gateRetries['phase-1-1']).toBe(1)

    // Write a new approved review
    const approved = {
      phase: 'phase-1', task: 'phase-1-1', reviewer: 'code-critic',
      timestamp: new Date().toISOString(), verdict: 'approved',
      checks: { lspErrors: 0, testsPassed: true, requirementsLocked: true, crossDepsValid: true },
    }
    writeFileSync(join(reviewDir, 'phase-1-1.json'), JSON.stringify(approved))

    // Now gate should show unlocked
    const lock = readLock(lockDir)
    const reviews = new Map([['phase-1-1', approved]])
    const gateResult = evaluateGate(reviews, lock)
    expect(gateResult.unlocked).toContain('phase-1-1')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test -- tests/integration/end-to-end.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/integration/end-to-end.test.ts
git commit -m "test(integration): add end-to-end lifecycle test — init→lock→gate→review→archive→advance"
```

---

## Task 15: CLI Tests

**Files:**
- Create: `tests/cli/cli.test.ts`

- [ ] **Step 1: Write CLI unit tests**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, readFileSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const TEST_DIR = join(process.cwd(), '.test-harness-cli')
const CLI = `node --loader tsx ${join(process.cwd(), 'src', 'cli', 'index.ts')}`

describe('harness CLI', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('init', () => {
    it('creates .hivemind/ directory structure', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        expect(existsSync('.hivemind')).toBe(true)
        expect(existsSync('.hivemind/session-agents-trackpad')).toBe(true)
        expect(existsSync('.hivemind/reviews')).toBe(true)
        expect(existsSync('.hivemind/plans')).toBe(true)
        expect(existsSync('.hivemind/templates')).toBe(true)
      } finally {
        process.chdir(origDir)
      }
    })

    it('creates 3 session pad files', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        const pads = readdirSync('.hivemind/session-agents-trackpad').filter(f => f.endsWith('.json'))
        expect(pads).toHaveLength(3)
        for (const p of pads) {
          const pad = JSON.parse(readFileSync(join('.hivemind', 'session-agents-trackpad', p), 'utf-8'))
          expect(pad.status).toBe('released')
        }
      } finally {
        process.chdir(origDir)
      }
    })

    it('refuses to init when .hivemind already exists', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        expect(() => execSync(CLI + ' init', { encoding: 'utf-8' })).toThrow()
      } finally {
        process.chdir(origDir)
      }
    })
  })

  describe('validate', () => {
    it('passes for valid state after init', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        // validate should exit 0
        execSync(CLI + ' validate', { encoding: 'utf-8' })
      } finally {
        process.chdir(origDir)
      }
    })

    it('reports errors for invalid pad files', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        // Corrupt a pad file
        const { writeFileSync } = require('fs') as typeof import('fs')
        writeFileSync('.hivemind/session-agents-trackpad/pad-001.json', '{invalid')
        expect(() => execSync(CLI + ' validate', { encoding: 'utf-8' })).toThrow()
      } finally {
        process.chdir(origDir)
      }
    })
  })

  describe('status', () => {
    it('reports status after init', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        const output = execSync(CLI + ' status', { encoding: 'utf-8' })
        expect(output).toContain('HiveMind Status')
      } finally {
        process.chdir(origDir)
      }
    })

    it('warns when not initialized', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        const output = execSync(CLI + ' status', { encoding: 'utf-8' })
        expect(output).toContain('Not initialized')
      } finally {
        process.chdir(origDir)
      }
    })
  })

  describe('reset', () => {
    it('requires --force flag', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        expect(() => execSync(CLI + ' reset', { encoding: 'utf-8' })).toThrow()
        expect(existsSync('.hivemind')).toBe(true)
      } finally {
        process.chdir(origDir)
      }
    })

    it('removes .hivemind/ with --force', () => {
      const origDir = process.cwd()
      try {
        process.chdir(TEST_DIR)
        execSync(CLI + ' init', { encoding: 'utf-8' })
        execSync(CLI + ' reset --force', { encoding: 'utf-8' })
        expect(existsSync('.hivemind')).toBe(false)
      } finally {
        process.chdir(origDir)
      }
    })
  })
})
```

**Note:** The CLI tests use `execSync` to invoke the CLI as a subprocess. For ESM TypeScript execution, use `tsx` as the loader. Alternatively, export CLI functions as testable units and test them directly (preferred approach for unit tests):

```typescript
// Alternative: test exported functions directly
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'

const TEST_DIR = join(process.cwd(), '.test-harness-cli')

// These exports will exist after Task 12 is implemented
// import { cmdInit, cmdValidate, cmdStatus, cmdReset, archiveReview } from '../../src/cli/index.js'
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm run test -- tests/cli/cli.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/cli/cli.test.ts
git commit -m "test(cli): add CLI unit tests for init, validate, status, reset, and review archiving"
```

---

## Post-Implementation: Build Verification

After all tasks complete, run:

```bash
npm run build && npm run typecheck && npm run test
```

Expected: clean build, zero type errors, all tests pass.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-07-hivemind-checkpoint-harness.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
