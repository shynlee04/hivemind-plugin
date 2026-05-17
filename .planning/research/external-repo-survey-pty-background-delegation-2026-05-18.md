# External Repository Survey: PTY, Background Agents & Delegation Patterns

**Researched:** 2026-05-18
**Domain:** OpenCode plugin ecosystem — PTY, background execution, delegation, session management
**Confidence:** HIGH (Deepwiki + GitHub verification)

## Summary

This report surveys three external repositories and OpenCode's native capabilities to inform the design of CP-PTY-01 through CP-PTY-04 phases. The two most directly relevant repos are `shekohex/opencode-pty` (PTY management) and `kdcokenny/opencode-background-agents` (async delegation). Both implement patterns that Hivemind's harness either already uses (WaiterModel) or should incorporate (PTY session lifecycle). The ecosystem survey reveals 10+ competing plugins in the delegation/background space, confirming this is an active design surface.

**Primary recommendation:** Hivemind's existing WaiterModel delegation (from `opencode-background-agents` patterns) is sound. The PTY layer should follow `opencode-pty`'s architecture (PTYManager + RingBuffer + bun-pty) but with Hivemind-specific adaptations: CQRS write-side tools, queue-key concurrency, and `.hivemind/` state persistence.

---

## 1. shekohex/opencode-pty (v0.3.4)

**Repo:** https://github.com/shekohex/opencode-pty
**License:** MIT
**SDK dependency:** `@opencode-ai/plugin` ^1.3.13, `bun-pty` ^0.4.8
**Engine:** opencode >=1.3.13

### Core Features

1. **Background process execution** — Spawns processes that run independently, unlike OpenCode's blocking `bash` tool
2. **5 registered tools** — `pty_spawn`, `pty_write`, `pty_read`, `pty_list`, `pty_kill`
3. **Interactive input** — `pty_write` sends keystrokes, control chars (Ctrl+C = `\x03`), escape sequences
4. **Output buffer with pagination** — `pty_read` supports offset/limit pagination + regex filtering via `RingBuffer`
5. **Exit notifications** — `notifyOnExit` parameter sends XML notification to agent when process exits (no polling needed)
6. **Multiple concurrent sessions** — `PTYManager` maintains list of active sessions, each with own buffer and process
7. **Session persistence** — Sessions persist after exit for output inspection and exit code retrieval
8. **Web UI** — React-based web interface via WebSockets for real-time terminal monitoring
9. **Permission integration** — Respects `permission.bash` and `permission.external_directory` from OpenCode config
10. **Session cleanup** — Listens for `session.deleted` event to clean up PTY sessions

### Architecture Overview

```
┌─────────────────────────────────────────┐
│           PTY Tools Layer               │
│  pty_spawn / pty_write / pty_read /     │
│  pty_list / pty_kill                    │
├─────────────────────────────────────────┤
│           PTYManager (singleton)        │
│  ┌──────────────────┬────────────────┐  │
│  │ SessionLifecycle │ OutputManager  │  │
│  │ Manager          │ (RingBuffer)   │  │
│  ├──────────────────┼────────────────┤  │
│  │ NotificationMgr  │ PermissionChk  │  │
│  └──────────────────┴────────────────┘  │
├─────────────────────────────────────────┤
│           bun-pty (IPty)                │
└─────────────────────────────────────────┘
```

- **PTYManager**: Singleton orchestrator delegating to sub-managers
- **SessionLifecycleManager**: Creates, tracks state, cleans up PTY processes
- **OutputManager**: Manages `RingBuffer` — fixed-size circular buffer (default 50K lines, configurable via `PTY_MAX_BUFFER_LINES`)
- **NotificationManager**: Sends XML exit notifications to OpenCode SDK
- **RingBuffer**: Fixed-size circular buffer, line-by-line storage, prevents unbounded memory growth. Supports paginated reads + regex search
- **bun-pty integration**: `Terminal` class from `bun-pty` spawns actual processes. Includes monkey-patch for `_startReadLoop` race condition

### Session Lifecycle States

| State | Trigger |
|-------|---------|
| `"running"` | `pty_spawn` creates session |
| `"exited"` | Process terminates (onExit callback) |
| `"killed"` | Explicit `pty_kill` (sends SIGTERM) |
| (removed) | `kill(cleanup=true)` or `session.deleted` event |

### Known Limitations

1. **"ask" permissions treated as "deny"** — Cannot trigger OpenCode's interactive permission UI from plugin context
2. **"external_directory" with "ask" treated as "allow"** — Must explicitly set to "deny" to block
3. **Bun-only** — Requires `bun-pty` which only works in Bun runtime
4. **No built-in retry/recovery** — Sessions don't survive parent restart
5. **No queue/concurrency control** — No limit on concurrent sessions
6. **No persistence to disk** — Session state is in-memory only

### Relevance to Hivemind

| Pattern | Hivemind Adoption |
|---------|-------------------|
| PTYManager singleton | Adapt to CQRS write-side tool in `src/features/` |
| RingBuffer output | Reuse pattern for background command output buffering |
| notifyOnExit XML | Adapt to WaiterModel dual-signal completion |
| bun-pty dependency | Already in Hivemind as optional dependency |
| Session lifecycle events | Mirror in `src/task-management/lifecycle/` |
| Permission integration | Extend for harness-specific permission model |
| Web UI WebSocket | Phase CP-PTY-03+ for sidecar dashboard |

---

## 2. kdcokenny/opencode-background-agents

**Repo:** https://github.com/kdcokenny/opencode-background-agents
**License:** Not verified (repo exists, last pushed 2026-05-12)
**Description:** "Claude Code-style background agents for OpenCode – async delegation with context persistence"

### Core Features

1. **WaiterModel delegation** — Async "order → continue → notification → retrieval" pattern
2. **3 registered tools** — `delegate`, `delegation_read`, `delegation_list`
3. **Isolated sub-sessions** — Each delegation creates isolated OpenCode session with parent reference
4. **Human-readable IDs** — e.g., "swift-amber-falcon" for delegation tracking
5. **15-minute timeout** — `MAX_RUN_TIME_MS` prevents runaway delegations
6. **Read-only agent enforcement** — Write-capable agents forbidden from `delegate` (prevents undo/branching conflicts)
7. **Context compaction hook** — `experimental.session.compacting` injects delegation summary during compaction
8. **System prompt injection** — `experimental.chat.system.transform` injects `DELEGATION_RULES`
9. **Disk persistence** — Results saved to `~/.local/share/opencode/delegations/` as Markdown
10. **Batched notifications** — Individual completion with `noReply: true`, final notification when ALL pending delegations complete

### Architecture Overview

```
┌───────────────────────────────────────────────┐
│              Plugin Export                     │
│         BackgroundAgentsPlugin                │
├───────────────┬───────────────────────────────┤
│   Tools       │   Hooks                       │
│  delegate     │   tool.execute.before         │
│  delegation_  │   chat.system.transform       │
│  read/list    │   session.compacting          │
├───────────────┴───────────────────────────────┤
│          DelegationManager                    │
│  ┌────────────┬────────────┬──────────────┐   │
│  │ Session    │ Timeout    │ Notification │   │
│  │ Creation   │ Handler    │ Manager      │   │
│  ├────────────┼────────────┼──────────────┤   │
│  │ State      │ Output     │ Parent       │   │
│  │ Tracker    │ Persistor  │ Notifier     │   │
│  └────────────┴────────────┴──────────────┘   │
├───────────────────────────────────────────────┤
│          OpenCode SDK                         │
│  session.create() / session.prompt()          │
│  session.idle event / message.updated event   │
└───────────────────────────────────────────────┘
```

### Delegation State Machine

```
"running" ──→ "complete"    (session.idle event)
         ──→ "timeout"     (15-min MAX_RUN_TIME_MS)
         ──→ "cancelled"   (explicit deleteDelegation)
         ──→ "error"       (unhandled exception)
```

### WaiterModel Pattern Detail

```
1. DELEGATION:  delegate(prompt, agent) → creates isolated session → returns ID
2. NON-BLOCKING: orchestrator continues other work immediately
3. NOTIFICATION: session.idle → handleSessionIdle → notifyParent (XML <task-notification>)
4. RETRIEVAL:   delegation_read(id) → blocks until complete → returns Markdown result
```

### Integration Hooks

| Hook | Purpose |
|------|---------|
| `tool.execute.before` | Enforces read-only agents use `delegate`, write agents use `task` |
| `experimental.chat.system.transform` | Injects `DELEGATION_RULES` into system prompt |
| `experimental.session.compacting` | Injects running/completed delegation summary into compacted context |
| `session.idle` event | Triggers completion detection |
| `message.updated` event | Tracks progress |

### Known Limitations

1. **Read-only agent restriction** — Cannot delegate write-capable work without using native `task` tool
2. **Single-level delegation** — Nested delegations are disabled in sub-sessions
3. **Fixed 15-minute timeout** — Not configurable per-delegation
4. **Markdown-only output** — Results persisted as flat Markdown files
5. **No queue/concurrency control** — No limit on concurrent delegations
6. **No retry/recovery** — Failed delegations require manual re-initiation

### Relevance to Hivemind

| Pattern | Hivemind Status |
|---------|-----------------|
| WaiterModel delegation | **Already implemented** in `src/coordination/delegation/manager.ts` |
| Dual-signal completion | **Already implemented** — session.idle + explicit status check |
| Context compaction hook | **Already implemented** — delegation summary injection |
| Human-readable IDs | **Already implemented** — delegation ID generation |
| Disk persistence | **Already implemented** — `delegation-persistence.ts` with `.hivemind/` storage |
| Read-only enforcement | **Adapted** — Hivemind uses capability-based tool restrictions instead |
| Timeout handling | **Already implemented** — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |
| Queue/concurrency | **Hivemind enhancement** — `src/coordination/concurrency/queue.ts` with queue-key validation |

---

## 3. awesome-opencode Ecosystem Survey

**Repo:** https://github.com/awesome-opencode/awesome-opencode

### PTY / Terminal Plugins

| Plugin | Author | Description | Relevance |
|--------|--------|-------------|-----------|
| **opencode-pty** | shekohex | Full PTY management with Web UI | HIGH — direct reference for CP-PTY-01 |
| **Opencode Canvas** | — | Interactive terminal canvases in tmux splits | MEDIUM — alternative terminal approach |
| **Agent of Empires** | — | TUI for managing multiple sessions in tmux + git worktree + Docker | MEDIUM — multi-session management |
| **GoTTY** | — | Turns CLI tools into web apps | LOW — web terminal approach |

### Background / Delegation Plugins

| Plugin | Author | Description | Relevance |
|--------|--------|-------------|-----------|
| **opencode-background-agents** | kdcokenny | Async delegation with context persistence | HIGH — direct reference for WaiterModel |
| **Background** | — | General background process management | MEDIUM — simpler alternative |
| **Subtask2** | — | Orchestration system with granular flow control | MEDIUM — orchestration patterns |
| **Swarm Plugin** | — | Swarm-based agent coordination | MEDIUM — parallel agent patterns |
| **Pocket Universe** | — | Closed-loop async agents, blocking main thread | MEDIUM — alternative async model |
| **oh-my-opencode** | toel1234 | Batteries-included plugin with parallel background agents | HIGH — OMO reference, already ingested |
| **opencode-background-tasks** | AutomatorAlex | Fan-out complex work across parallel agents | MEDIUM — parallel delegation |
| **opencode-delegate-agent** | jeremiepas | Simple background sub-agent runner | LOW — minimal implementation |

### Session Management Plugins

| Plugin | Author | Description | Relevance |
|--------|--------|-------------|-----------|
| **Opencode Sessions** | — | Session management with multi-agent collaboration | MEDIUM |
| **Opencode Session Manager** | — | View/manage sessions, detect orphans | MEDIUM — orphan detection relevant |
| **Handoff** | — | Focused handoff prompts for session continuity | MEDIUM — relevant to session recovery |
| **Opencode Worktree** | — | Zero-friction git worktrees with auto-terminal spawning | LOW |

### Skills / Orchestration Plugins

| Plugin | Author | Description | Relevance |
|--------|--------|-------------|-----------|
| **Agent Skills (JDT)** | — | Dynamic skills loader | LOW |
| **Beads Plugin** | — | Issue tracker integration with `/bd-*` commands | LOW |
| **Micode** | — | Structured workflow with continuity, worktree isolation, AST tools | MEDIUM |
| **Pilot** | — | Automation daemon polling GitHub issues/Linear | LOW |

---

## 4. OpenCode Native Capabilities

**Source:** Deepwiki analysis of anomalyco/opencode

### Built-in Bash Execution

- **`bash` tool** — Synchronous execution, blocks until completion
- **Permission model** — `allow`, `ask`, `deny` patterns for commands
- **`external_directory`** — Controls working directory access
- **Limitation:** No native background execution — this is WHY plugins like opencode-pty exist

### Built-in Task Delegation

- **`Task` tool** — Central mechanism for delegating subtasks to subagent instances
- **`subagent_type` parameter** — Selects agent type for specialization
- **Concurrent launch** — Multiple agents can run concurrently via `Task` tool
- **Fresh context** — Each invocation starts fresh unless `task_id` provided for resume
- **`handleSubtask`** — In `packages/opencode/src/session/prompt.ts`, creates assistant message + tool part

### Session Management

- **`session.create()`** — Create new sessions programmatically
- **`session.prompt()`** — Send prompts to sessions
- **`session.wait()`** — Wait for session task completion
- **`subscribe()`** — Listen for session events
- **Session navigation** — Keybindings: `session_child_first`, `session_child_cycle`, `session_parent`
- **Session hierarchy** — Child sessions track parent reference

### Plugin SDK

| Capability | API | Usage |
|-----------|-----|-------|
| Tool registration | `opencode.tool.add()` | Add custom tools to agent context |
| Hook subscription | `tool.execute.before`, `chat.system.transform`, `session.compacting` | Intercept and modify behavior |
| Session creation | `client.session.create()`, `client.session.prompt()` | Create and interact with sub-sessions |
| Event listening | `session.idle`, `session.deleted`, `message.updated` | React to lifecycle events |
| Plugin function | Receives `project`, `client`, `directory`, `worktree`, Bun shell `$` | Context injection |

### Slash Commands

- Executed via `Task` tool (e.g., `/check-file path/to/file.py` passed as prompt)
- Custom commands defined in `.opencode/commands/` with YAML frontmatter

### What OpenCode LACKS Natively

1. **Background process execution** — `bash` tool is synchronous/blocking only
2. **PTY management** — No pseudo-terminal support in core
3. **Completion polling** — No built-in mechanism to check long-running task status
4. **Queue/concurrency control** — No built-in rate limiting or queue management
5. **Cross-session state persistence** — Sessions are ephemeral unless plugin persists
6. **Retry/recovery** — No automatic retry for failed subagent tasks

---

## 5. Synthesis: Pattern Comparison Matrix

| Capability | OpenCode Native | opencode-pty | opencode-background-agents | Hivemind (current) |
|-----------|----------------|--------------|---------------------------|---------------------|
| Background execution | ❌ (blocking bash) | ✅ PTY spawn | ✅ Sub-session | ✅ Delegation + PTY (planned) |
| Interactive input | ❌ | ✅ pty_write | ❌ | ❌ (CP-PTY-01 target) |
| Output buffering | ❌ | ✅ RingBuffer 50K | ❌ (markdown only) | ✅ Retry queue |
| Exit notification | ❌ | ✅ XML notifyOnExit | ✅ session.idle | ✅ Dual-signal |
| Multiple sessions | ✅ (Task tool) | ✅ PTY list | ✅ Delegation list | ✅ Delegation tracker |
| Concurrency control | ❌ | ❌ | ❌ | ✅ Queue-key validation |
| Context compaction | ✅ (native) | ❌ | ✅ Hook injection | ✅ Hook injection |
| Disk persistence | ❌ | ❌ (memory only) | ✅ Markdown files | ✅ `.hivemind/` JSON |
| Permission integration | ✅ | ✅ (with gaps) | ✅ (read-only enforcement) | ✅ Capability-based |
| Timeout handling | ❌ | ❌ | ✅ 15-min fixed | ✅ Configurable |
| Recovery/resume | ✅ (task_id) | ❌ | ❌ | ✅ Session recovery |

---

## 6. Key Takeaways for CP-PTY-01 Through CP-PTY-04

### CP-PTY-01 (Background Shell Control-Plane MVP)
- **Follow opencode-pty's PTYManager pattern** — singleton manager with sub-managers for lifecycle, output, notifications
- **Use RingBuffer for output** — fixed-size circular buffer prevents unbounded memory growth
- **Integrate bun-pty** — already optional dependency in Hivemind
- **Add CQRS write-side tools** — `run-background-command`, etc. as tools not direct bash

### CP-PTY-02 (SDK Session Delegation Integration)
- **Hivemind already implements WaiterModel** from opencode-background-agents patterns
- **Enhancement needed:** Wire PTY sessions into delegation lifecycle (running → exited → complete)
- **Context compaction:** Already handles delegation summary injection

### CP-PTY-03 (Agent/Subagent Background Task Coordination)
- **Queue-key concurrency** already exists — extend to PTY session management
- **Read-only vs write-capable agent split** is too rigid for Hivemind's general-purpose harness
- **Better:** Capability-based tool restrictions per agent (already implemented)

### CP-PTY-04 (Cross-Cutting Shell Integration)
- **Web UI pattern** from opencode-pty (React + WebSocket) relevant for sidecar dashboard
- **Permission model** needs adaptation — "ask as deny" is a known limitation to document

---

## Sources

### Primary (HIGH confidence)
- **DeepWiki:** shekohex/opencode-pty — PTYManager architecture, RingBuffer, bun-pty integration, notification system
- **DeepWiki:** kdcokenny/opencode-background-agents — WaiterModel pattern, DelegationManager, completion detection, context compaction hooks
- **DeepWiki:** awesome-opencode/awesome-opencode — Ecosystem plugin survey
- **DeepWiki:** anomalyco/opencode — Native capabilities, plugin SDK, session management, Task tool
- **GitHub:** shekohex/opencode-pty package.json — v0.3.4, @opencode-ai/plugin ^1.3.13, bun-pty ^0.4.8
- **GitHub search:** Verified kdcokenny/opencode-background-agents exists, last pushed 2026-05-12

### Secondary (MEDIUM confidence)
- Ecosystem plugin descriptions from awesome-opencode catalog — feature claims not independently verified

### Tertiary (LOW confidence)
- Plugin descriptions for opencode-background-tasks, Pocket Universe, Subtask2 — catalog entries only

## Metadata

**Confidence breakdown:**
- opencode-pty architecture: HIGH — Deepwiki + package.json verified
- opencode-background-agents patterns: HIGH — Deepwiki detailed, repo verified on GitHub
- Ecosystem survey: MEDIUM — catalog entries, not all repos independently verified
- OpenCode native capabilities: HIGH — Deepwiki from anomalyco/opencode source

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable ecosystem, 30-day validity)
