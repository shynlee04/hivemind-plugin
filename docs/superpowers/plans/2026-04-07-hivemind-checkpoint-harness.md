# HiveMind Checkpoint Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready npm package (`opencode-harness`) providing turn-based checkpoint validation, incremental skill unlocking, compaction-resilient state, soft-harness discovery, and cross-dependency validation for OpenCode multi-agent workflows.

**Architecture:** Single npm package with three internal module directories (`src/kernel/`, `src/plugin/`, `src/cli/`). Kernel is pure TypeScript with zero external dependencies (Zod v4 only). Plugin adapts kernel to OpenCode hooks. CLI handles initialization, validation, and state management. Assets directory provides `.opencode/` templates loaded at runtime.

**Tech Stack:** TypeScript (strict mode), Zod v4, vitest, Node.js >= 20.0.0, @opencode-ai/plugin

---

## Spec Coverage

| Spec Section | Implementation Location | Task |
|-------------|------------------------|------|
| §2.1 Package structure | `package.json`, `src/kernel/`, `src/plugin/`, `src/cli/` | Task 1 |
| §2.2 Dependency graph | `src/kernel/index.ts`, `src/plugin/index.ts`, `src/cli/index.ts` | Tasks 7, 8, 12 |
| §3.1 Kernel files | `src/kernel/schemas.ts`, `gate.ts`, `pad-store.ts`, `lock-store.ts`, `state-recovery.ts`, `permission-gate.ts` | Tasks 2-6 |
| §3.2 Zod schemas | `src/kernel/schemas.ts` | Task 2 |
| §3.3 Gate evaluation | `src/kernel/gate.ts` | Task 3 |
| §3.4 Pad store | `src/kernel/pad-store.ts` | Task 4 |
| §3.5 Lock store | `src/kernel/lock-store.ts` | Task 5 |
| §3.6 State recovery | `src/kernel/state-recovery.ts` | Task 6 |
| §4.1 Plugin files | `src/plugin/index.ts`, `hooks/`, `tools/` | Tasks 8-11 |
| §4.3 Permission gate | `src/kernel/permission-gate.ts`, `src/plugin/hooks/permission-gate.ts` | Task 3 + 8 |
| §4.4 Prompt inject | `src/plugin/hooks/prompt-inject.ts` | Task 9 |
| §4.5 Tool descriptor | `src/plugin/hooks/tool-descriptor.ts` | Task 10 |
| §4.6 Gate check tool | `src/plugin/tools/gate-check.ts` | Task 11 |
| §5 CLI | `src/cli/index.ts` | Task 12 |
| §6 Assets | `assets/.opencode/` | Task 13 |

**Spec gaps identified:** None — all sections have corresponding tasks.

---

## File Structure

```
opencode-harness/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── kernel/
│   │   ├── index.ts              # Barrel: exports all kernel public APIs
│   │   ├── schemas.ts            # All Zod schemas (~120 LOC)
│   │   ├── gate.ts               # evaluateGate() pure function (~80 LOC)
│   │   ├── permission-gate.ts    # isToolAllowedForPhase() + helpers (~80 LOC)
│   │   ├── pad-store.ts          # Session pad CRUD (~100 LOC)
│   │   ├── lock-store.ts         # Requirements lock CRUD (~80 LOC)
│   │   └── state-recovery.ts     # reconstructState() (~60 LOC)
│   ├── plugin/
│   │   ├── index.ts              # Plugin entry — composes hooks (~40 LOC)
│   │   ├── hooks/
│   │   │   ├── permission-gate.ts  # permission.ask hook adapter (~100 LOC)
│   │   │   ├── prompt-inject.ts    # experimental.chat.system.transform (~80 LOC)
│   │   │   └── tool-descriptor.ts   # tool.definition hook (~40 LOC)
│   │   └── tools/
│   │       └── gate-check.ts     # Custom gate-check tool (~80 LOC)
│   └── cli/
│       └── index.ts              # CLI: init, validate, status, reset (~120 LOC)
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
    └── kernel/
        ├── schemas.test.ts
        ├── gate.test.ts
        ├── permission-gate.test.ts
        ├── pad-store.test.ts
        ├── lock-store.test.ts
        └── state-recovery.test.ts
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
Task 8 (Plugin Index + Permission Gate Hook)
    ↓
Task 9 (Plugin Prompt Inject)
    ↓
Task 10 (Plugin Tool Descriptor)
    ↓
Task 11 (Plugin Gate Check Tool)
    ↓
Task 12 (CLI)
    ↓
Task 13 (Assets)
```

Kernel tasks (2-7) must be complete before plugin tasks (8-11). CLI (12) and Assets (13) are independent after Task 7.

---

## Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/kernel/.gitkeep`
- Create: `src/plugin/.gitkeep`
- Create: `src/cli/.gitkeep`
- Create: `assets/.opencode/agents/.gitkeep`
- Create: `assets/.opencode/commands/.gitkeep`
- Create: `assets/.opencode/skills/.gitkeep`
- Create: `tests/kernel/.gitkeep`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "opencode-harness",
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
      "import": "./dist/plugin/index.js",
      "types": "./dist/plugin/index.d.ts"
    },
    "./cli": {
      "import": "./dist/cli/index.js",
      "types": "./dist/cli/index.d.ts"
    },
    "./kernel": {
      "import": "./dist/kernel/index.js",
      "types": "./dist/kernel/index.d.ts"
    }
  },
  "bin": {
    "harness": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
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
mkdir -p src/kernel src/plugin/hooks src/plugin/tools src/cli
mkdir -p assets/.opencode/agents assets/.opencode/commands assets/.opencode/skills
mkdir -p tests/kernel
touch src/kernel/.gitkeep src/plugin/.gitkeep src/cli/.gitkeep
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
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema, GateResultSchema, PermissionRequestSchema } from '../src/kernel/schemas.js'

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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
  lockedAt: z.string().datetime(),
  phases: z.array(PhaseSchema),
})

export type RequirementsLock = z.infer<typeof RequirementsLockSchema>

// ReviewVerdict — Written by code-critic after review
export const ReviewVerdictSchema = z.object({
  phase: z.string(),
  task: z.string(),
  reviewer: z.literal('code-critic'),
  timestamp: z.string().datetime(),
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
import { evaluateGate } from '../src/kernel/gate.js'
import type { RequirementsLock, ReviewVerdict } from '../src/kernel/schemas.js'

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
import { isToolAllowedForPhase, getPhaseEditPaths, getAllowedTestCommands, matchesGlob } from '../src/kernel/permission-gate.js'
import type { GateResult, RequirementsLock, PermissionRequest } from '../src/kernel/schemas.js'

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

  // Pre-evaluation: Sort phases lexicographically
  const sortedPhases = [...phases].sort((a, b) => a.id.localeCompare(b.id))

  // Pre-evaluation: Build global task ID set
  const allTaskIds = new Set<string>()
  for (const phase of sortedPhases) {
    for (const task of phase.tasks) {
      allTaskIds.add(task.id)
    }
  }

  // Pre-evaluation: Task ID integrity check
  for (const phase of sortedPhases) {
    for (const task of phase.tasks) {
      for (const dep of task.dependsOn) {
        if (!allTaskIds.has(dep)) {
          return {
            currentPhase: sortedPhases[0].id,
            currentTask: sortedPhases[0].tasks[0]?.id ?? '',
            unlocked: [],
            gateStatus: 'blocked',
            blockers: [`dependsOn references non-existent task: ${dep}`],
          }
        }
      }
    }
  }

  // Pre-evaluation: Cycle detection (topological sort)
  const visited = new Set<string>()
  const inStack = new Set<string>()

  const detectCycle = (taskId: string, path: string[]): string | null => {
    if (inStack.has(taskId)) return [...path, taskId].join(' → ')
    if (visited.has(taskId)) return null
    visited.add(taskId)
    inStack.add(taskId)

    const task = sortedPhases.flatMap(p => p.tasks).find(t => t.id === taskId)
    if (task) {
      for (const dep of task.dependsOn) {
        const cycle = detectCycle(dep, [...path, taskId])
        if (cycle) return cycle
      }
    }

    inStack.delete(taskId)
    return null
  }

  for (const phase of sortedPhases) {
    for (const task of phase.tasks) {
      visited.clear()
      inStack.clear()
      const cycle = detectCycle(task.id, [])
      if (cycle) {
        return {
          currentPhase: sortedPhases[0].id,
          currentTask: sortedPhases[0].tasks[0]?.id ?? '',
          unlocked: [],
          gateStatus: 'blocked',
          blockers: [`circular dependsOn detected: ${cycle}`],
        }
      }
    }
  }

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
import { readPad, writePad, listPads, acquirePad, releasePad, incrementRetry, resetRetry } from '../src/kernel/pad-store.js'
import type { SessionPad } from '../src/kernel/schemas.js'
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/harness-test-pads'

beforeEach(() => {
  if (existsSync(TEST_DIR)) {
    for (const f of fs.readdirSync(TEST_DIR)) {
      unlinkSync(join(TEST_DIR, f))
    }
  } else {
    mkdirSync(TEST_DIR, { recursive: true })
  }
})

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    for (const f of fs.readdirSync(TEST_DIR)) {
      unlinkSync(join(TEST_DIR, f))
    }
    rmdirSync(TEST_DIR)
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
  if (!existsSync(file)) throw `${Harness} Pad not found: ${id}`
  const content = readFileSync(file, 'utf-8')
  if (!content.trim()) throw `${Harness} Pad file empty: ${id}`
  try {
    return SessionPadSchema.parse(JSON.parse(content))
  } catch (e) {
    throw `${Harness} Pad validation failed: ${id}`
  }
}

export function writePad(dir: string, pad: SessionPad): void {
  const file = padPath(dir, pad.id)
  const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : null
  if (current && pad.version !== current.version) {
    throw `${Harness} Pad version conflict: ${pad.id} (expected ${current.version}, got ${pad.version})`
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
  if (released.length === 0) throw `${Harness} All pads active`
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
import { readLock, writeLock, lockField, isLocked } from '../src/kernel/lock-store.js'
import type { RequirementsLock } from '../src/kernel/schemas.js'
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
  if (existsSync(TEST_DIR)) {
    unlinkSync(join(TEST_DIR, 'requirements.lock.json')).catch?.(() => {})
    try { rmdirSync(TEST_DIR) } catch {}
  }
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
import { evaluateGate } from './gate.js'
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
        throw `${Harness} Lock validation failed: duplicate task ID: ${task.id}`
      }
      allTaskIds.add(task.id)
    }
  }

  // Check dependsOn references
  for (const phase of lock.phases) {
    for (const task of phase.tasks) {
      for (const dep of task.dependsOn) {
        if (!allTaskIds.has(dep)) {
          throw `${Harness} Lock validation failed: dependsOn references non-existent task: ${dep}`
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
        throw `${Harness} Lock validation failed: circular dependsOn detected: ${cycle}`
      }
    }
  }
}

export function readLock(dir: string): RequirementsLock {
  const file = lockPath(dir)
  if (!existsSync(file)) throw `${Harness} Requirements lock not found`
  const content = readFileSync(file, 'utf-8')
  if (!content.trim()) throw `${Harness} Requirements lock empty`
  try {
    return RequirementsLockSchema.parse(JSON.parse(content))
  } catch {
    throw `${Harness} Requirements lock validation failed`
  }
}

export function writeLock(dir: string, lock: RequirementsLock): void {
  const file = lockPath(dir)
  if (existsSync(file)) throw `${Harness} Requirements lock already exists`
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  validateLock(lock)
  try {
    RequirementsLockSchema.parse(lock)
  } catch (e) {
    throw `${Harness} Lock validation failed: ${e}`
  }
  atomicWrite(file, JSON.stringify(lock, null, 2))
}

export function lockField(dir: string, phaseId: string, requirementId: string): void {
  const lock = readLock(dir)
  const phase = lock.phases.find(p => p.id === phaseId)
  if (!phase) throw `${Harness} Requirement not found: ${phaseId}/${requirementId}`
  const req = phase.requirements.find(r => r.id === requirementId)
  if (!req) throw `${Harness} Requirement not found: ${phaseId}/${requirementId}`
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
import { reconstructState } from '../src/kernel/state-recovery.js'
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync, existsSync } from 'fs'
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
        for (const f of require('fs').readdirSync(d)) {
          unlinkSync(join(d, f))
        }
        rmdirSync(d)
      }
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
      join(TEST_DIR, 'session-agents-trackpad'),
      join(TEST_DIR, 'plans', 'pipeline.md'),
      join(TEST_DIR, 'requirements.lock.json'),
      join(TEST_DIR, 'reviews'),
    )

    expect(state.pad.id).toBe('pad-001')
    expect(state.pad.currentPhase).toBe('phase-1')
    expect(state.require.phases).toHaveLength(1)
    expect(state.plan).toBe('# Pipeline')
    expect(state.gateResult.unlocked).toContain('phase-1-1')
  })

  it('throws on missing pad file', () => {
    expect(() => reconstructState(
      join(TEST_DIR, 'session-agents-trackpad', 'nonexistent.json'),
      join(TEST_DIR, 'plans', 'pipeline.md'),
      join(TEST_DIR, 'requirements.lock.json'),
      join(TEST_DIR, 'reviews'),
    )).toThrow('[Harness] Pad file not found')
  })

  it('returns empty plan when plan file missing', () => {
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
      phases: [],
    }))

    const state = reconstructState(
      join(TEST_DIR, 'session-agents-trackpad'),
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
      join(TEST_DIR, 'session-agents-trackpad'),
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
import { join, dirname } from 'path'
import { SessionPadSchema, RequirementsLockSchema, ReviewVerdictSchema } from './schemas.js'
import { evaluateGate } from './gate.js'
import type { SessionPad, RequirementsLock, ReviewVerdict, GateResult } from './schemas.js'

const [Harness] = ['[Harness]']

export function reconstructState(
  padDir: string,
  planPath: string,
  lockPath: string,
  reviewDir: string,
): { pad: SessionPad; plan: string; requirements: RequirementsLock; gateResult: GateResult } {
  // Read pad — find the active/released pad file in directory
  let padFile: string | null = null
  if (existsSync(padDir)) {
    const files = readdirSync(padDir).filter(f => f.endsWith('.json') && !f.endsWith('.tmp.json'))
    if (files.length > 0) {
      padFile = join(padDir, files[0])
    }
  }
  if (!padFile || !existsSync(padFile)) throw `${Harness} Pad file not found: ${padFile ?? padDir}`
  const padContent = readFileSync(padFile, 'utf-8')
  if (!padContent.trim()) throw `${Harness} Pad file empty: ${padFile}`
  let pad: SessionPad
  try {
    pad = SessionPadSchema.parse(JSON.parse(padContent))
  } catch (e) {
    throw `${Harness} Pad validation failed: ${padFile}`
  }

  // Read plan (optional)
  let plan = ''
  if (existsSync(planPath)) {
    try {
      plan = readFileSync(planPath, 'utf-8')
    } catch {
      throw `${Harness} Plan file unreadable: ${planPath}`
    }
  }

  // Read lock
  if (!existsSync(lockPath)) throw `${Harness} Requirements lock not found: ${lockPath}`
  const lockContent = readFileSync(lockPath, 'utf-8')
  if (!lockContent.trim()) throw `${Harness} Requirements lock empty: ${lockPath}`
  let requirements: RequirementsLock
  try {
    requirements = RequirementsLockSchema.parse(JSON.parse(lockContent))
  } catch {
    throw `${Harness} Requirements lock validation failed: ${lockPath}`
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
export type { SessionPad, RequirementsLock, ReviewVerdict, GateResult, PermissionRequest, Task, Phase } from './schemas.js'

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

## Task 8: Plugin Index + Permission Gate Hook

**Files:**
- Create: `src/plugin/index.ts`
- Create: `src/plugin/hooks/permission-gate.ts`
- Create: `tests/plugin/permission-gate.test.ts` (placeholder — kernel functions are pure and mockable)

- [ ] **Step 1: Write plugin index.ts**

```typescript
import type { Plugin } from '@opencode-ai/plugin'
import { createPermissionGate } from './hooks/permission-gate.js'
import { createPromptInject } from './hooks/prompt-inject.js'
import { createToolDescriptor } from './hooks/tool-descriptor.js'
import { registerGateCheckTool } from './tools/gate-check.js'

export function createPlugin(directory: string): Plugin {
  return {
    name: 'opencode-harness',
    hooks: {
      'permission.ask': createPermissionGate(directory),
      'experimental.chat.system.transform': createPromptInject(directory),
      'tool.definition': createToolDescriptor(directory),
    },
    tools: (register) => {
      registerGateCheckTool(register, directory)
    },
  }
}
```

- [ ] **Step 2: Write hooks/permission-gate.ts**

```typescript
import type { PermissionRequest, PermissionOutput } from '../../kernel/schemas.js'
import { reconstructState, isToolAllowedForPhase } from '../../kernel/index.js'

interface NativePermission {
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

function adaptPermission(native: NativePermission): PermissionRequest {
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

export function createPermissionGate(directory: string) {
  return async (nativePermission: unknown, output: PermissionOutput) => {
    const native = nativePermission as NativePermission
    const request = adaptPermission(native)
    const phase = extractPhase(request)

    try {
      const { gateResult, requirements } = await reconstructState(
        `${directory}/session-agents-trackpad/`,
        `${directory}/plans/pipeline.md`,
        `${directory}/requirements.lock.json`,
        `${directory}/reviews/`,
      )

      const effectivePhase = phase ?? gateResult.currentPhase

      if (isToolAllowedForPhase(request, effectivePhase, gateResult, requirements)) {
        output.status = 'allow'
      } else {
        output.status = 'deny'
      }
    } catch {
      output.status = 'deny'
    }
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/plugin/index.ts src/plugin/hooks/permission-gate.ts
git commit -m "feat(plugin): add plugin entry with permission.ask hook adapter"
```

---

## Task 9: Plugin Prompt Inject Hook

**Files:**
- Create: `src/plugin/hooks/prompt-inject.ts`

- [ ] **Step 1: Write prompt-inject.ts**

```typescript
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { reconstructState } from '../../kernel/index.js'

interface SystemTransformOutput {
  system: string[]
}

function resolveTemplatePath(phaseId: string, templatesDir: string): string {
  return join(templatesDir, `${phaseId}.txt`)
}

function formatPrerequisites(requirements: { requirements: { id: string; description: string }[] }): string {
  if (!requirements.requirements || requirements.requirements.length === 0) return ''
  return requirements.requirements
    .filter(r => r.locked)
    .map(r => `  - ${r.id}: ${r.description}`)
    .join('\n')
}

export function createPromptInject(directory: string) {
  return async (_input: unknown, output: SystemTransformOutput) => {
    try {
      const { pad, requirements, gateResult } = await reconstructState(
        `${directory}/session-agents-trackpad/`,
        `${directory}/plans/pipeline.md`,
        `${directory}/requirements.lock.json`,
        `${directory}/reviews/`,
      )

      const currentPhase = pad.currentPhase
      const templatesDir = join(directory, 'templates')
      const templatePath = resolveTemplatePath(currentPhase, templatesDir)
      let phaseInstructions = ''
      if (existsSync(templatePath)) {
        phaseInstructions = readFileSync(templatePath, 'utf-8')
      } else {
        console.warn(`[Harness] No template found for phase: ${currentPhase}`)
      }

      const prerequisites = requirements.phases.find(p => p.id === currentPhase)
      const prerequisitesText = prerequisites ? formatPrerequisites(prerequisites) : ''

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
      // State unavailable — inject minimal error context
      output.system.push(`<harness_context>
[Harness] State unavailable. Run 'harness init' to initialize.
</harness_context>`)
    }
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/plugin/hooks/prompt-inject.ts
git commit -m "feat(plugin): add experimental.chat.system.transform hook for phase context injection"
```

---

## Task 10: Plugin Tool Descriptor Hook

**Files:**
- Create: `src/plugin/hooks/tool-descriptor.ts`

- [ ] **Step 1: Write tool-descriptor.ts**

```typescript
import { reconstructState } from '../../kernel/index.js'

interface ToolDefinitionOutput {
  description: string
  parameters: unknown
}

export function createToolDescriptor(directory: string) {
  return async (input: { toolID: string }, output: ToolDefinitionOutput) => {
    try {
      const { gateResult, requirements } = await reconstructState(
        `${directory}/session-agents-trackpad/`,
        `${directory}/plans/pipeline.md`,
        `${directory}/requirements.lock.json`,
        `${directory}/reviews/`,
      )

      const currentPhase = gateResult.currentPhase
      const isLocked = !gateResult.unlocked.some(id => id.startsWith(currentPhase))

      if (input.toolID === 'skill') {
        const phase = requirements.phases.find(p => p.id === currentPhase)
        if (phase && phase.tasks.length > 0) {
          const skill = phase.tasks[0].skill
          if (skill) {
            output.description += `\n\nCurrent harness phase: ${currentPhase}. Load the ${skill} skill for instructions.`
          }
        }
      } else if (isLocked && gateResult.gateStatus === 'locked') {
        output.description += `\n\n⚠️ LOCKED: This tool is not available until phase ${currentPhase} passes gate validation. Complete all tasks and pass code-critic review to unlock.`
      }
    } catch {
      // State unavailable — do not modify description
    }
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/plugin/hooks/tool-descriptor.ts
git commit -m "feat(plugin): add tool.definition hook for lock warnings"
```

---

## Task 11: Plugin Gate Check Tool

**Files:**
- Create: `src/plugin/tools/gate-check.ts`

- [ ] **Step 1: Write gate-check.ts**

```typescript
import { spawn } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { readLock } from '../../kernel/index.js'

interface GateCheckArguments {
  phase: string
  task: string
}

interface GateCheckResult {
  phase: string
  task: string
  status: 'PASSED' | 'BLOCKED'
  checks: Record<string, string>
}

export function registerGateCheckTool(register: (name: string, schema: unknown, handler: (args: GateCheckArguments) => Promise<string>) => void, directory: string) {
  register('gate-check', {
    type: 'object',
    properties: {
      phase: { type: 'string', description: 'Phase ID (e.g., "phase-1")' },
      task: { type: 'string', description: 'Task ID (e.g., "phase-1-1")' },
    },
    required: ['phase', 'task'],
  }, async (args: GateCheckArguments) => {
    return runGateCheck(args.phase, args.task, directory)
  })
}

async function runGateCheck(phase: string, task: string, directory: string): Promise<string> {
  const checks: Record<string, string> = {}
  let blocked = false

  // Check requirements lock
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

  // Run test command (default: bun test)
  const testCmd = 'bun test'
  try {
    const result = await runCommand(testCmd, 120_000)
    checks['tests'] = result.passed ? `PASS: ${result.count} tests passed` : `FAIL: tests failed`
    if (!result.passed) blocked = true
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    checks['tests'] = `FAIL: ${msg}`
    blocked = true
  }

  // Check dependencies
  try {
    const lock = readLock(directory)
    const phaseData = lock.phases.find(p => p.id === phase)
    const taskData = phaseData?.tasks.find(t => t.id === task)
    if (taskData?.dependsOn) {
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
    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error(`Timed out after ${timeoutMs}ms (command: ${cmd})`))
    }, timeoutMs)

    const proc = spawn(cmd, [], { shell: true })
    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (d) => { stdout += d.toString() })
    proc.stderr?.on('data', (d) => { stderr += d.toString() })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        const match = stdout.match(/(\d+)\s+passing/)
        resolve({ passed: true, count: match ? parseInt(match[1]) : 0 })
      } else {
        reject(new Error(stderr || stdout || `Exit code ${code}`))
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
git add src/plugin/tools/gate-check.ts
git commit -m "feat(plugin): add gate-check custom tool for phase/task validation"
```

---

## Task 12: CLI

**Files:**
- Create: `src/cli/index.ts`

- [ ] **Step 1: Write CLI**

```typescript
#!/usr/bin/env node

import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
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
permissions:
  edit:
    "*": "deny"
    ".hivemind/reviews/*.json": "allow"
  bash:
    "*": "deny"
    "bun test *": "allow"
    "npm test *": "allow"
  question: "deny"
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
