# opencode-pty Findings — PTY-Based Background Process Execution

**Date**: 2026-04-08
**Sources**: tmux source tree (C), opencode-pty v0.3.2 (TypeScript/Bun), HiveMind V3 architecture docs
**Purpose**: Research PTY execution patterns for HiveMind V3 background agent execution

---

## 1. PTY Execution Model

### 1.1 Two PTY Paradigms Found

There are two distinct PTY execution models in the ecosystem:

**Model A: tmux (C, forkpty-based)** — `tmux/spawn.c:382`, `tmux/job.c:116`
- Uses `fdforkpty(ptm_fd, &master_fd, tty_name, termios, winsize)` to fork a child process attached to a pseudo-terminal
- `ptm_fd` is a global PTY master file descriptor opened once at server startup via `getptmfd()` (`tmux/tmux.c:453`)
- The child process gets a real TTY (stdin/stdout/stderr all point to the slave side)
- Parent keeps the master fd for reading output and writing input
- Platform compatibility: `fdforkpty` wraps `forkpty` on most systems, with fallbacks in `compat/` for AIX, Haiku, HP-UX, SunOS

**Model B: opencode-pty (TypeScript/Bun, node-pty-based)** — `opencode-pty/src/plugin/pty/session-lifecycle.ts:48-58`
- Uses `bun-pty` library (`spawn(command, args, { name, cols, rows, cwd, env })`) which wraps `node-pty`
- Returns an `IPty` object with `.onData()`, `.onExit()`, `.write()`, `.kill()` methods
- No manual fork — the library handles PTY creation internally
- Cross-platform (macOS, Linux, Windows via node-pty's native bindings)

### 1.2 Key PTY Lifecycle Steps (tmux model)

1. **Open PTY master**: `ptm_fd = getptmfd()` — opens `/dev/ptmx` or platform equivalent (`tmux/tmux.c:453`)
2. **Fork with PTY**: `pid = fdforkpty(ptm_fd, &master, tty, &termios, &winsize)` — atomically forks and creates PTY pair (`tmux/spawn.c:382`)
3. **Child setup**: In child, set termios, push environment, exec the command (`tmux/spawn.c:428-479`)
4. **Parent setup**: Set non-blocking I/O on master fd, attach event loop (`tmux/job.c:223-229`)
5. **Signal blocking**: `sigprocmask(SIG_BLOCK, &set, &oldset)` around fork to prevent race conditions (`tmux/spawn.c:360-361`)

### 1.3 Key PTY Lifecycle Steps (opencode-pty model)

1. **Create session object**: `createSessionObject(opts)` generates ID, sets defaults (`session-lifecycle.ts:16-38`)
2. **Spawn process**: `spawn(command, args, { name: 'xterm-256color', cols, rows, cwd, env })` (`session-lifecycle.ts:48-58`)
3. **Attach event handlers**: `onData()` appends to ring buffer, `onExit()` updates status (`session-lifecycle.ts:60-78`)
4. **Store in Map**: `sessions.set(session.id, session)` (`session-lifecycle.ts:85`)

### 1.4 Window Size Management

- **tmux**: Sets `winsize` struct with `ws_col`, `ws_row`, `ws_xpixel`, `ws_ypixel` before fork (`tmux/spawn.c:353-357`). Resizes via `ioctl(fd, TIOCSWINSZ, &ws)` (`tmux/job.c:291-304`)
- **opencode-pty**: Sets `cols` and `rows` in spawn options, defaults to `DEFAULT_TERMINAL_COLS`/`DEFAULT_TERMINAL_ROWS` (`session-lifecycle.ts:52-53`). No runtime resize implemented.

---

## 2. Background Process Management

### 2.1 tmux: Job System (`tmux/job.c`)

**Architecture**: Global linked list of jobs (`LIST_HEAD(joblist, job) all_jobs`)

**Job states**: `JOB_RUNNING` → `JOB_DEAD` → `JOB_CLOSED` (`tmux/job.c:44-48`)

**Key mechanisms**:
- `job_run()` — spawns process, returns `struct job*` with fd, pid, callbacks (`tmux/job.c:71-239`)
- Two I/O modes: PTY (`JOB_PTY` flag) or socketpair (`tmux/job.c:112-121`)
- Uses libevent `bufferevent` for async I/O: `bufferevent_new(fd, read_cb, write_cb, error_cb, data)` (`tmux/job.c:225-226`)
- Non-blocking fd: `setblocking(job->fd, 0)` (`tmux/job.c:223`)
- Callbacks: `updatecb` (data available), `completecb` (job finished), `freecb` (cleanup user data) (`tmux/job.c:59-62`)
- `job_check_died(pid, status)` — called by SIGCHLD handler to match dead PIDs to jobs (`tmux/job.c:357-386`)
- `job_still_running()` — checks if any non-NOWAIT jobs remain (`tmux/job.c:422-432`)
- `job_kill_all()` — SIGTERM all running jobs (`tmux/job.c:410-419`)
- `job_transfer()` — hands off fd to another subsystem (e.g., pane takeover) (`tmux/job.c:242-265`)

**Flags**:
- `JOB_NOWAIT` (0x1) — don't wait for completion
- `JOB_KEEPWRITE` (0x2) — don't auto-shutdown write side
- `JOB_PTY` (0x4) — use PTY instead of socketpair
- `JOB_DEFAULTSHELL` (0x8) — use session's default-shell
- `JOB_SHOWSTDERR` (0x10) — merge stderr with stdout

### 2.2 opencode-pty: PTYManager Class

**Architecture**: Singleton `PTYManager` with three sub-managers (`manager.ts:73-130`)

**Sub-managers**:
- `SessionLifecycleManager` — process lifecycle, Map of sessions
- `OutputManager` — read/write/search operations on buffers
- `NotificationManager` — exit notifications via OpenCode SDK

**Key mechanisms**:
- `manager.spawn(opts)` — creates session, spawns process, attaches handlers, returns `PTYSessionInfo` (`manager.ts:84-96`)
- `manager.write(id, data)` — sends input to PTY (`manager.ts:98-104`)
- `manager.read(id, offset, limit)` — paginated buffer read (`manager.ts:106-112`)
- `manager.search(id, pattern, offset, limit)` — regex-filtered buffer read (`manager.ts:114-120`)
- `manager.kill(id, cleanup)` — terminates process, optionally removes from Map (`manager.ts:128-130`)
- `manager.list()` — returns all session info (`manager.ts:122-124`)

**Event system**: Callback arrays for session updates and raw output (`manager.ts:28-68`)
- `sessionUpdateCallbacks[]` — notified on spawn and exit
- `rawOutputCallbacks[]` — notified on every data chunk

### 2.3 HiveMind V3: Current Background Model (`src/lib/lifecycle-manager.ts:385-401`)

**Architecture**: Uses OpenCode's `sendPrompt()` API to launch child sessions asynchronously

**Key mechanisms**:
- `sendPrompt(client, childSessionID, body)` — fires and forgets, catches errors (`lifecycle-manager.ts:387-399`)
- `observeBackgroundCompletion()` — polls for completion via `CompletionDetector` (`lifecycle-manager.ts:401`)
- Concurrency control via keyed semaphore (`concurrency.ts`)
- Dual-layer state: durable JSON (`continuity.ts`) + in-memory Maps (`state.ts`)

**Gap**: This model runs OpenCode sessions (full LLM interactions), not arbitrary shell processes. It cannot run `npm run dev`, database servers, or interactive REPLs.

---

## 3. Interactive Input Handling

### 3.1 tmux: Pane Input (`tmux/window.c:40-44`)

**Model**: Input data received as key codes, written directly via `input_key`
- Panes have two buffers: input and output
- Output from PTY received in screen format, translated via `input_parse()` (`input.c`)
- Input from user received as key codes, written to PTY master fd
- No explicit `write()` function in job.c — input flows through pane infrastructure

### 3.2 opencode-pty: Direct PTY Write

**Model**: `session.process?.write(data)` sends raw bytes to PTY slave (`output-manager.ts:4-9`)

**Key features**:
- Accepts escape sequences: `\x03` for Ctrl+C, `\x04` for Ctrl+D, `\r` for Enter
- Write is non-blocking — library handles buffering
- Graceful error handling: `try/catch` allows writes to exited processes (for tests)
- No input validation — raw passthrough to PTY

**Tool interface** (`pty_write`):
```
args: { id: string, data: string }
returns: boolean
```

### 3.3 Escape Sequence Handling

opencode-pty README documents common escape sequences:
- `\x03` — Ctrl+C (SIGINT)
- `\x04` — Ctrl+D (EOF)
- `\r` — Enter/Return
- Arrow keys and other special keys supported via terminal escape sequences

---

## 4. Process Lifecycle (start, monitor, terminate)

### 4.1 State Machines

**tmux job states** (`tmux/job.c:44-48`):
```
JOB_RUNNING → JOB_DEAD → (freed)
JOB_RUNNING → JOB_CLOSED → (freed)
```

**opencode-pty session states** (`types.ts:4`):
```
running → exited (natural exit)
running → killing → killed (explicit kill)
```

**HiveMind V3 task states** (`types.ts` / `task-status.ts`):
```
pending → queued → running → completed
                          → error
                          → cancelled
```

### 4.2 Exit Detection

**tmux**: SIGCHLD handler calls `job_check_died(pid, status)` which:
1. Matches PID to job in linked list
2. Handles SIGTTIN/SIGTTOU (stopped jobs) with SIGCONT
3. Sets `job->status` and transitions to `JOB_DEAD`
4. Fires `completecb` if job was `JOB_CLOSED` (write side already shut down)
5. Otherwise waits for write side to close before firing callback (`tmux/job.c:357-386`)

**opencode-pty**: `bun-pty` provides `onExit(({ exitCode, signal }) => {...})` callback:
1. Called automatically when process terminates
2. Sets `session.status` to 'killed' or 'exited'
3. Stores `exitCode` and `exitSignal`
4. Triggers notification if `notifyOnExit` was set (`session-lifecycle.ts:68-78`)

**HiveMind V3**: `CompletionDetector` uses two-signal detection:
1. `session.idle` event from OpenCode
2. Stability timer (no new messages for N seconds)
3. Falls back to polling if needed (`completion-detector.ts`)

### 4.3 Buffer Management

**tmux**: No ring buffer — output flows through `bufferevent` to update callback, which feeds into screen/grid system. No persistent output storage after display.

**opencode-pty**: `RingBuffer` class (`buffer.ts`):
- String-based buffer with configurable max size (default 1MB via `PTY_MAX_BUFFER_SIZE`)
- `append(data)` — concatenates, trims from start if over limit
- `read(offset, limit)` — paginated line access
- `search(pattern: RegExp)` — regex matching with line numbers
- `clear()` — frees buffer
- `byteLength` — current buffer size in characters

**HiveMind V3**: No output buffer — relies on OpenCode session messages, retrieved via `getSessionMessages()` API.

### 4.4 Cleanup Strategies

**opencode-pty** (`session-lifecycle.ts:93-108`):
- `kill(id, cleanup=false)` — sends SIGTERM, keeps session in Map for log access
- `kill(id, cleanup=true)` — sends SIGTERM, clears buffer, removes from Map
- `cleanupBySession(parentSessionId)` — bulk kills all children of a parent session
- Auto-cleanup on OpenCode session deletion via `event: session.deleted` hook (`plugin.ts:44-47`)

**tmux** (`tmux/job.c:268-287`):
- `job_free(job)` — SIGTERM + free bufferevent + close fd + free struct
- `job_kill_all()` — SIGTERM all running jobs
- `job_transfer()` — hand off fd without killing (for pane adoption)

---

## 5. Integration Patterns with OpenCode

### 5.1 opencode-pty Plugin Architecture

**Plugin entry point** (`plugin.ts`):
```typescript
export const PTYPlugin = async ({ client, directory }: PluginContext): Promise<PluginResult> => {
  initPermissions(client, directory)
  initManager(client)
  return {
    tool: { pty_spawn, pty_write, pty_read, pty_list, pty_kill },
    event: async ({ event }) => { /* session.deleted → cleanup */ },
    config: async (input) => { /* register slash commands */ },
    'command.execute.before': async (input) => { /* web UI */ },
  }
}
```

**Key integration points**:
1. **Tools** — 5 tools registered via `tool:` key, using `@opencode-ai/plugin`'s `tool()` helper
2. **Events** — Listens to `session.deleted` for cleanup
3. **Permissions** — Respects OpenCode's `permission.bash` config (`permissions.ts`)
4. **Notifications** — Uses `client.session.promptAsync()` to send exit notifications to parent session
5. **Config** — Registers slash commands (`/pty-open-background-spy`, `/pty-show-server-url`)

### 5.2 Permission Model (`permissions.ts`)

- Checks command against `permission.bash` patterns (glob matching)
- "ask" permissions treated as "ask" (plugins can't trigger UI prompts)
- `external_directory` with "ask" treated as "allow"
- Workdir permission checked separately

### 5.3 Web UI Server

- Optional React-based web interface for monitoring PTY sessions
- WebSocket server for real-time output streaming
- REST API for session management
- Started lazily on first slash command invocation

---

## 6. Applicability to HiveMind V3

### 6.1 What HiveMind V3 Currently Has (Gap Analysis)

| Capability | HiveMind V3 | opencode-pty | tmux |
|---|---|---|---|
| Run arbitrary shell processes | No (OpenCode sessions only) | Yes | Yes |
| Interactive input (Ctrl+C, etc.) | No | Yes | Yes |
| Output buffer with pagination | No (session messages) | Yes (RingBuffer) | No (screen buffer) |
| Regex output filtering | No | Yes | No |
| Exit notifications | Yes (CompletionDetector) | Yes (notifyOnExit) | Yes (SIGCHLD) |
| Multiple concurrent processes | Yes (keyed semaphore) | Yes (Map) | Yes (linked list) |
| Parent-child tracking | Yes (continuity) | Yes (parentSessionId) | Yes (session/window/pane) |
| Permission checking | No | Yes (bash perms) | No |
| Web monitoring UI | No | Yes | No (terminal UI) |

### 6.2 What Can Be Adopted

**Direct adoption candidates** (minimal adaptation):

1. **RingBuffer pattern** (`buffer.ts`) — Pure TypeScript, zero dependencies. Can be copied into `src/lib/pty-buffer.ts` for storing process output. The string-based approach with offset/limit pagination is ideal for agent consumption.

2. **Session lifecycle state machine** (`types.ts: PTYStatus`) — The `running → exited/killed` model is simpler than HiveMind's 7-state task model and appropriate for process-level tracking.

3. **Exit notification pattern** (`notification-manager.ts`) — Uses `client.session.promptAsync()` which HiveMind already has access to. The `<pty_exited>` XML tag format is clean and parseable.

4. **Permission checking** (`permissions.ts`) — The glob-based command permission model can be adapted for HiveMind's tool permission system.

**Requires adaptation**:

1. **PTY spawning** — opencode-pty uses `bun-pty` (Bun runtime). HiveMind V3 targets Node.js. Options:
   - `node-pty` — the underlying library, works on Node.js (used by VS Code terminal)
   - `bun-pty` — only works on Bun runtime
   - Native `forkpty` via `node:child_process` with `stdio: 'pipe'` — no true PTY, no interactive programs
   - **Recommendation**: `node-pty` for true PTY support, or `child_process.spawn` with `pty: true` option (Node.js 20+)

2. **Manager architecture** — opencode-pty's singleton PTYManager could be merged into HiveMind's existing `LifecycleManager` or kept as a separate `PtyManager` module.

3. **Web UI** — Not needed for HiveMind V3. Agents consume output via tools, not browsers.

### 6.3 Proposed Integration Architecture

```
HiveMind V3 Plugin (src/plugin.ts)
├── Existing: delegation tools (delegate, status, cancel)
├── Existing: lifecycle-manager.ts (OpenCode session management)
├── NEW: pty-manager.ts (process management)
│   ├── pty-spawner.ts (node-pty wrapper)
│   ├── pty-buffer.ts (RingBuffer from opencode-pty)
│   ├── pty-permissions.ts (command permission checks)
│   └── pty-notifier.ts (exit notifications via promptAsync)
└── Existing: continuity.ts, state.ts, concurrency.ts
```

**New tools to add**:
- `pty_spawn` — start a background process (command, args, workdir, env, title, notifyOnExit)
- `pty_write` — send input to a running process
- `pty_read` — read output buffer with pagination and regex filtering
- `pty_list` — list all active PTY sessions
- `pty_kill` — terminate a process

**Key design decisions**:
1. PTY sessions should be tracked separately from OpenCode delegation sessions (different lifecycle, different state model)
2. PTY output buffer should persist in continuity store for cross-session recovery
3. PTY permission model should reuse HiveMind's existing permission infrastructure
4. Exit notifications should use the same `promptAsync` pattern as delegation completion

### 6.4 Risks and Constraints

1. **node-pty native bindings** — Requires compilation on install. May fail on some platforms. Alternative: `child_process.spawn({ stdio: ['pipe', 'pipe', 'pipe'] })` for non-interactive processes.

2. **Buffer memory** — RingBuffer defaults to 1MB per session. With many concurrent sessions, memory could grow. Need configurable limits and eviction policy.

3. **Security** — PTY processes run with full shell access. Permission model is critical. "ask" permissions can't be implemented in plugin context (no UI).

4. **Cross-platform** — `node-pty` supports macOS, Linux, Windows. `forkpty` is Unix-only. HiveMind should abstract the PTY layer for portability.

5. **Bun dependency** — opencode-pty is Bun-specific. HiveMind V3 targets Node.js. All PTY logic must use Node-compatible libraries.

---

## Appendix: Source References

| Finding | Source |
|---|---|
| tmux PTY fork | `tmux/spawn.c:382` — `fdforkpty(ptm_fd, &new_wp->fd, new_wp->tty, NULL, &ws)` |
| tmux job system | `tmux/job.c:71-239` — `job_run()` with PTY/socketpair modes |
| tmux job states | `tmux/job.c:44-48` — JOB_RUNNING/JOB_DEAD/JOB_CLOSED |
| tmux SIGCHLD handler | `tmux/job.c:357-386` — `job_check_died()` |
| tmux PTY master init | `tmux/tmux.c:453` — `ptm_fd = getptmfd()` |
| opencode-pty plugin | `src/plugin.ts` — PTYPlugin entry point |
| opencode-pty manager | `src/plugin/pty/manager.ts` — PTYManager class |
| opencode-pty lifecycle | `src/plugin/pty/session-lifecycle.ts` — SessionLifecycleManager |
| opencode-pty buffer | `src/plugin/pty/buffer.ts` — RingBuffer class |
| opencode-pty spawn tool | `src/plugin/pty/tools/spawn.ts` — ptySpawn tool |
| opencode-pty kill tool | `src/plugin/pty/tools/kill.ts` — ptyKill tool |
| opencode-pty notifications | `src/plugin/pty/notification-manager.ts` — NotificationManager |
| opencode-pty types | `src/plugin/pty/types.ts` — PTYStatus, PTYSession, SpawnOptions |
| opencode-pty permissions | `src/plugin/pty/permissions.ts` — checkCommandPermission |
| HiveMind lifecycle | `src/lib/lifecycle-manager.ts:385-401` — background dispatch |
| HiveMind completion | `src/lib/completion-detector.ts` — two-signal detection |
| HiveMind architecture | `docs/draft/architecture-proposal-hivemind-v3.md` — V3 target features |
