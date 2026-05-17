# PTY / Background Command System — Structured Analysis

**Analysis Date:** 2026-05-18
**Scope:** Cluster B — PTY, Background Command, Command-Process Delegation
**Evidence Level:** L5 (source-code reading, no runtime proof)

---

## A. Source File Documentation

### A1. `src/features/background-command/pty/pty-types.ts`

**Purpose:** Canonical type definitions for the PTY subsystem.

**Exports:**
- `PtyExecutionMode` — `"interactive"` | `"detached"`
- `PtySpawnRequest` — `{ command: string; args?: string[]; cwd?: string; env?: Record<string, string>; executionMode: PtyExecutionMode; terminalKind?: string }`
- `PtySessionRecord` — `{ id: string; spawnRequest: PtySpawnRequest; createdAt: number; exitCode: number | null; exitedAt: number | null }`
- `PtyReadResult` — `{ content: string; nextOffset: number; truncated: boolean }`
- `PtyReadAllResult` — `{ content: string; nextOffset: number; truncated: boolean }`
- `PtyListEntry` — `{ id: string; command: string; exitCode: number | null; createdAt: number }`

**Imports:** None (leaf type module).

**Dependencies:** Consumed by `pty-manager.ts`, `run-background-command.ts`, `command-delegation/handler.ts`.

---

### A2. `src/features/background-command/pty/pty-manager.ts`

**Purpose:** Core PTY session lifecycle manager. Wraps `bun-pty`'s `spawn()` to create, read, write to, and terminate pseudo-terminal sessions.

**Class: `PtyManager`**

| Method | Signature | Purpose |
|--------|-----------|---------|
| `isSupported()` | `() => boolean` | Checks `typeof spawn === "function" && "Bun" in globalThis` |
| `spawn()` | `(request: PtySpawnRequest) => PtySessionRecord` | Creates a new PTY process via `bun-pty`'s `spawn()`, stores in `sessions` Map, subscribes to `onData`/`onExit` events |
| `read()` | `(sessionId: string, sinceOffset?: number) => PtyReadResult \| null` | Reads from the session's ring buffer since `sinceOffset` |
| `readAll()` | `(sessionId: string) => PtyReadAllResult \| null` | Reads full buffer snapshot |
| `write()` | `(sessionId: string, data: string) => boolean` | Writes stdin to the PTY process |
| `terminate()` | `(sessionId: string) => boolean` | Calls `ptyProcess.kill()` on the underlying PTY |
| `listSessions()` | `() => PtyListEntry[]` | Lists all tracked sessions |
| `getSession()` | `(sessionId: string) => PtySessionRecord \| null` | Returns session metadata |
| `isSessionAlive()` | `(sessionId: string) => boolean` | Checks `exitCode === null` |

**State:** `Map<string, { record: PtySessionRecord; process: IPty; buffer: PtyBuffer }>` — `sessions`.

**Event handling:** `onData` appends to `PtyBuffer`; `onExit` sets `exitCode` and `exitedAt` on `PtySessionRecord`.

**Error handling:** All public methods catch and return `null`/`false` on errors. Spawn throws `[Harness] PTY spawn failed` on `spawn()` failure.

**Imports:** `bun-pty` (dynamic via `pty-runtime.ts`), `pty-buffer.ts`, `pty-types.ts`.

---

### A3. `src/features/background-command/pty/pty-buffer.ts`

**Purpose:** Ring buffer for PTY output. Provides offset-based incremental reads with truncation tracking.

**Factory: `createPtyBuffer(maxChars: number = 20000)`**

Returns object with:
- `append(text: string): void` — Appends text, truncates from front if over `maxChars`.
- `readSince(sinceOffset: number): PtyReadResult` — Returns content since the given offset, plus `truncated` flag.
- `snapshot(): PtyReadAllResult` — Returns full buffer content with truncation info.
- `getNextOffset(): number` — Returns the current write offset.

**Behavior:**
- `append("")` is a no-op.
- `readSince(offset)` where `offset > nextOffset` returns empty content with the current `nextOffset`.
- Truncation sets `truncated: true` when old content was discarded.

**LOC:** ~50 lines. Leaf utility with no imports beyond types.

---

### A4. `src/features/background-command/pty/pty-runtime.ts`

**Purpose:** Factory function that attempts to create a `PtyManager` and returns `null` on failure.

**Export: `createPtyManagerIfSupported(): Promise<PtyManager | null>`**

**Behavior:**
1. Dynamically imports `bun-pty`.
2. Creates a new `PtyManager`.
3. Calls `manager.isSupported()`.
4. If supported, returns the manager; otherwise returns `null`.
5. On any error (import failure, exception), catches and returns `null`.

**Used by:** `src/plugin.ts` line 69 — `const ptyManager = await createPtyManagerIfSupported()`.

---

### A5. `src/features/background-command/pty/bun-pty.d.ts`

**Purpose:** Ambient TypeScript declarations for the optional `bun-pty` package so `npm run typecheck` passes without the package installed.

**Declarations:**
- `export function spawn(file: string, args: string[], options: IPtySpawnOptions): IPty`
- `export interface IPtySpawnOptions` — cols, rows, cwd, env
- `export interface IPty` — pid, write(), kill(), onData(), onExit()

---

### A6. `src/tools/hivemind/run-background-command.ts`

**Purpose:** OpenCode tool entry point for the `run-background-command` tool. Implements a 5-action discriminated union schema.

**Schema (Zod discriminated union on `action`):**

| Action | Key Fields | Behavior |
|--------|------------|----------|
| `run` | `command`, `args?`, `cwd?`, `env?`, `title?`, `executionMode?`, `delegationId?` | Spawns a process; routes through `DelegationManager.dispatchCommand()` if delegation-tracked, otherwise direct `PtyManager.spawn()` |
| `output` | `sessionId`, `sinceOffset?` | Reads from PTY buffer via `PtyManager.read()` |
| `input` | `sessionId`, `data` | Writes to PTY stdin via `PtyManager.write()` |
| `list` | _(none)_ | Returns all active sessions via `PtyManager.listSessions()` |
| `terminate` | `sessionId` | Terminates PTY session; marks delegation cancellation if tracked |

**Key integration points:**
- `DelegationManager.dispatchCommand()` for delegation-tracked commands.
- `DelegationManager.markCommandCancellationForPtySession()` on terminate.
- `DelegationManager.findByPtySession()` to check delegation status.
- Direct `PtyManager` methods for non-delegated commands.
- `CommandDelegationHandler` manages the actual process lifecycle.

**Error strategy:** All errors wrapped in `[Harness]` prefixed messages. Returns `{ status: "error", error: "..." }`.

**LOC:** ~200+ lines.

---

### A7. `src/coordination/command-delegation/handler.ts`

**Purpose:** Manages command-process delegation lifecycle for both PTY and headless modes.

**Class: `CommandDelegationHandler`**

| Method | Purpose |
|--------|---------|
| `dispatchCommand()` | Routes to PTY or headless based on `executionMode` and `PtyManager` availability |
| `pollCommandStatus()` | Checks process completion via PTY buffer or headless process state |
| `getCommandOutput()` | Reads accumulated output from PTY buffer or headless stdout |
| `cancelCommand()` | Terminates the process (PTY kill or headless SIGTERM) |

**Headless path:** Uses `node:child_process.spawn()` directly — no PTY, no interactive terminal.

**PTY fallback logic:** If `executionMode === "pty"` but `PtyManager` is null, falls back to headless with `fallbackReason: "pty-unavailable-bun-required"`.

---

### A8. `src/coordination/delegation/state-machine.ts`

**Purpose:** Delegation state machine with PTY-aware transitions.

**PTY-specific methods:**
- `markCommandCancellationForPtySession(ptySessionId)` — Finds delegation by `ptySessionId`, marks `explicitCancellation: true` and `terminalKind: "cancelled"`.
- `findByPtySession(ptySessionId)` — Reverse lookup from PTY session to delegation record.

**PTY recovery guarantees (line 79-87):**
- `sdk` → `"resumable"` — parent can poll OpenCode session after restart
- `pty` → `"best-effort"` — PTY survives only while harness is alive
- `headless` → `"non-resumable-after-restart"` — OS process does not survive parent restart

**PTY surface derivation (line 68-70):**
- `sdk` → `"agent-delegation"`
- `pty`/`headless` → `"command-process"`

---

## B. Tool Analysis

### B1. Tool Registration

**Registered in:** `src/plugin.ts` — `createRunBackgroundCommandTool(ptyManager, delegationManager)` passed to `plugin.registerTool()`.

**Tool name:** `run-background-command`

**Schema:** Zod discriminated union on `action` field with 5 variants.

### B2. Action Dispatch Table

```
run       → dispatchCommand() via DelegationManager OR direct PtyManager.spawn()
output    → PtyManager.read(sessionId, sinceOffset)
input     → PtyManager.write(sessionId, data)
list      → PtyManager.listSessions()
terminate → PtyManager.terminate(sessionId) + markCommandCancellationForPtySession()
```

### B3. Delegation Integration

- `run` with `delegationId` → `DelegationManager.dispatchCommand()` creates a `Delegation` record with `executionMode: "pty" | "headless"`, `ptySessionId`, `surface: "command-process"`, and appropriate `recoveryGuarantee`.
- `terminate` → `DelegationStateMachine.markCommandCancellationForPtySession()` sets `explicitCancellation: true`, `terminalKind: "cancelled"`.
- Non-delegated `run` → direct `PtyManager.spawn()`, no delegation record created.

### B4. Response Envelope

All actions return `{ status: "success" | "error", ...actionSpecificFields }`.

- `run` returns: `{ status, sessionId, exitCode?, message }`
- `output` returns: `{ status, content, nextOffset, truncated }`
- `input` returns: `{ status, message }`
- `list` returns: `{ status, sessions: PtyListEntry[] }`
- `terminate` returns: `{ status, message, delegationResult? }`

---

## C. PTY Architecture

### C1. Component Graph

```
plugin.ts
  ├─ createPtyManagerIfSupported()  →  pty-runtime.ts  →  pty-manager.ts
  │                                                              ├─ pty-buffer.ts (ring buffer)
  │                                                              └─ bun-pty (optional dep)
  ├─ DelegationManager
  │     ├─ DelegationStateMachine (state-machine.ts)
  │     │     ├─ markCommandCancellationForPtySession()
  │     │     └─ findByPtySession()
  │     └─ CommandDelegationHandler (handler.ts)
  │           ├─ PTY path → PtyManager
  │           └─ Headless path → node:child_process
  └─ createRunBackgroundCommandTool(ptyManager, delegationManager)
        └─ run-background-command.ts (5-action tool)
```

### C2. Data Flow: PTY Spawn

1. Agent calls `run-background-command` tool with `action: "run"`.
2. Tool handler checks for `delegationId` parameter.
3. **If delegated:** `DelegationManager.dispatchCommand()` → `CommandDelegationHandler.dispatchCommand()` → checks `executionMode` and `PtyManager` availability.
4. **PTY available + requested:** `PtyManager.spawn(request)` → `bun-pty.spawn()` → stores session in Map → subscribes to `onData`/`onExit`.
5. **PTY unavailable:** Falls back to headless `node:child_process.spawn()` with `fallbackReason`.
6. **If not delegated:** Direct `PtyManager.spawn()` call, no delegation record.

### C3. Data Flow: Output Read

1. Agent calls with `action: "output"`, `sessionId`, optional `sinceOffset`.
2. Tool handler calls `PtyManager.read(sessionId, sinceOffset)`.
3. `PtyManager` delegates to `PtyBuffer.readSince(offset)`.
4. Returns `{ content, nextOffset, truncated }`.

### C4. Ring Buffer Mechanics

- `createPtyBuffer(maxChars=20000)` — default 20KB cap.
- `append(text)` — concatenates; if total exceeds `maxChars`, slices from front.
- `readSince(offset)` — returns content written since `offset`; if `offset < discardedCount`, returns truncated slice.
- Offset tracking: monotonically increasing counter, never resets.

### C5. PTY Detection and Graceful Degradation

```
createPtyManagerIfSupported()
  → try { dynamic import("bun-pty") }
  → new PtyManager()
  → manager.isSupported()?
     → typeof spawn === "function" && "Bun" in globalThis
  → true: return manager
  → false / error: return null
```

When `null`:
- `run-background-command` tool falls back to headless for all PTY requests.
- `DelegationResult.fallbackReason = "pty-unavailable-bun-required"`.
- Tool still functions — just without interactive terminal features.

---

## D. Gap Analysis

### D1. Spec-to-Implementation Alignment

| Spec Requirement (CP-PTY-00) | Implementation Status | Gap |
|------------------------------|----------------------|-----|
| SDK and command-process are separate delegation lanes | ✅ Implemented — `DelegationSurface: "agent-delegation" | "command-process"` | None |
| PTY is optional capability adapter | ✅ Implemented — `optionalDependencies` + graceful null fallback | None |
| Output reads must be bounded | ✅ Implemented — `PtyBuffer` with 20KB default cap | None |
| Permission gates before spawn | ⚠️ Partial — category gates exist in `category-gates.ts` but no explicit permission gate before PTY spawn | Needs verification for CP-PTY-01 |
| Restart semantics must be honest | ✅ Implemented — `deriveRecoveryGuarantee()` returns `"best-effort"` for PTY, `"non-resumable-after-restart"` for headless | None |
| Sidecar/tmux projection is read-only | ⬜ Not implemented — deferred to SC-PTY-01 | Expected — out of scope |

### D2. Test Coverage Assessment

| Module | Test File | Tests | Coverage |
|--------|-----------|-------|----------|
| `pty-buffer.ts` | `tests/lib/pty/pty-buffer.test.ts` | 7 tests | Full — append, truncate, edge cases, empty operations |
| `pty-manager.ts` | `tests/lib/pty/pty-manager.test.ts` | ~8 tests | Unit-level with mocked `bun-pty` — spawn, read, write, terminate, list, isSupported |
| `pty-runtime.ts` | `tests/lib/pty/pty-runtime.test.ts` | 3 tests | supported, unsupported, exception cases |
| `run-background-command.ts` | `tests/tools/run-background-command.test.ts` | ~15+ tests | All 5 actions with stubbed PtyManager + DelegationManager |
| `command-delegation/handler.ts` | _(inline in delegation tests)_ | Unknown | Needs verification |

### D3. Known Limitations

1. **Bun-only PTY:** `bun-pty` is a native addon that only works on Bun runtime. Node.js users always get headless fallback.
2. **No tmux integration:** The spec mentions tmux as a potential adapter; not implemented.
3. **No SIGWINCH handling:** PTY sessions use default dimensions from `bun-pty` spawn; no dynamic resize.
4. **Buffer truncation is lossy:** Once content is truncated from the ring buffer, it is permanently lost. Consumers must poll frequently or accept data loss.
5. **No flow control on stdin writes:** `PtyManager.write()` does not check if the child process is still reading.

---

## E. OpenCode Integration

### E1. Plugin Wiring

**File:** `src/plugin.ts`

```
Line 29:  import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
Line 69:  const ptyManager = await createPtyManagerIfSupported()
Line 71:  passed to DelegationManager constructor
Line 219: createRunBackgroundCommandTool(ptyManager, delegationManager)
```

### E2. Tool Schema Contract

The tool uses Zod's `z.discriminatedUnion("action", [...])` with 5 variants. Each variant has its own schema with required and optional fields.

### E3. Delegation Type Integration

**File:** `src/coordination/delegation/types.ts`

The `Delegation` interface includes PTY-specific fields:
- `executionMode: "sdk" | "pty" | "headless"` — discriminated execution path
- `ptySessionId?: string` — links delegation record to PTY session
- `fallbackReason?: string` — set when PTY requested but headless used instead
- `terminalKind?: DelegationTerminalKind` — includes `"cancelled"`, `"interrupted-by-signal"`, `"non-resumable-after-restart"`
- `terminationSignal?: string` — OS signal name (e.g., "SIGTERM")
- `explicitCancellation?: boolean` — set when user calls `terminate`

### E4. State Machine PTY Awareness

**File:** `src/coordination/delegation/state-machine.ts`

- `deriveDelegationSurface()`: maps `pty`/`headless` → `"command-process"`
- `deriveRecoveryGuarantee()`: maps `pty` → `"best-effort"`, `headless` → `"non-resumable-after-restart"`
- `markCommandCancellationForPtySession()`: reverse lookup + cancellation
- `findByPtySession()`: reverse lookup for status queries

### E5. Ambient Type Declarations

**File:** `src/features/background-command/pty/bun-pty.d.ts`

Provides `IPty`, `IPtySpawnOptions`, and `spawn()` type signatures so TypeScript compilation succeeds without the optional `bun-pty` package installed.

---

## F. File Reference Index

| File | LOC | Role |
|------|-----|------|
| `src/features/background-command/pty/pty-types.ts` | ~40 | Type definitions |
| `src/features/background-command/pty/pty-manager.ts` | ~120 | Session lifecycle |
| `src/features/background-command/pty/pty-buffer.ts` | ~50 | Ring buffer |
| `src/features/background-command/pty/pty-runtime.ts` | ~25 | Factory with fallback |
| `src/features/background-command/pty/bun-pty.d.ts` | ~25 | Ambient types |
| `src/features/background-command/pty/.gitkeep` | 0 | Directory registration |
| `src/tools/hivemind/run-background-command.ts` | ~200+ | Tool entry point |
| `src/coordination/command-delegation/handler.ts` | ~250+ | Command delegation lifecycle |
| `src/coordination/delegation/state-machine.ts` | ~430 | Delegation state machine |
| `src/coordination/delegation/types.ts` | ~140 | Delegation type contracts |
| `src/plugin.ts` | ~300+ | Plugin composition root |
| `tests/lib/pty/pty-buffer.test.ts` | ~102 | Buffer unit tests |
| `tests/lib/pty/pty-manager.test.ts` | ~100+ | Manager unit tests |
| `tests/lib/pty/pty-runtime.test.ts` | ~38 | Runtime factory tests |
| `tests/tools/run-background-command.test.ts` | ~300+ | Tool integration tests |

---

*Analysis date: 2026-05-18 — L5 evidence (source reading, no runtime proof)*
