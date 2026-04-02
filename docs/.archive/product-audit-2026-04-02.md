# OpenCode Harness — Product Audit & Rebuild Blueprint

**Document:** product-audit-2026-04-02.md
**Date:** 2026-04-02
**Type:** Product Assessment + Rebuild Blueprint
**Status:** Final

---

## 1. Executive Verdict

**The current harness delivers almost zero value beyond what OpenCode provides natively.**

Every "feature" the harness claims is either:
- A thin wrapper around OpenCode's existing capability
- An agent instruction that could live in a `.md` file
- A broken implementation that doesn't work as specified

**The harness needs a complete rebuild focused on capabilities that OpenCode cannot provide through configuration alone.**

---

## 2. OpenCode Native Capabilities (What Users Already Have)

### 2.1 Multi-Agent System — Native

OpenCode provides a complete multi-agent system out of the box:

| Capability | How OpenCode Does It | Harness "Adds" |
|---|---|---|
| Agent definitions | `.opencode/agents/*.md` with frontmatter | Same format, no improvement |
| Agent modes | `primary`, `subagent`, `all` | Same |
| Permission isolation | `permission` field with glob patterns | Same permissions, different format |
| Temperature/model per agent | `temperature`, `model` in frontmatter | Hardcoded in `plugin.ts` instead |
| Subagent spawning | `task` tool (built-in) | `delegate-task` wrapper |
| Agent switching | Tab key for primary, `@mention` for subagents | Same |
| Max steps | `steps` in frontmatter | Same |
| Hidden agents | `hidden: true` | Same |

**Verdict:** The harness adds nothing here. Users get identical capability through native agent configuration.

### 2.2 Session Lifecycle — Native

| Capability | How OpenCode Does It | Harness "Adds" |
|---|---|---|
| Session creation | `client.session.create()` | Wraps it |
| Session prompting | `client.session.prompt()` | Wraps it |
| Session abort | `client.session.abort()` | Wraps it |
| Child sessions | Subagents create them automatically | Tracks them in JSON file |
| Session events | SSE stream via `client.event.subscribe()` | Routes to internal tracker |
| Session history | Built-in message storage | Duplicates in continuity JSON |

**Verdict:** The harness wraps SDK calls without adding meaningful behavior.

### 2.3 Commands — Native

| Capability | How OpenCode Does It | Harness "Adds" |
|---|---|---|
| Custom commands | `.opencode/commands/*.md` | Same files |
| Arguments | `$ARGUMENTS`, `$1`-`$9` | Same |
| Shell injection | `!command` | Same |
| File references | `@filename` | Same |
| Agent targeting | `agent:` frontmatter | Same |
| Subtask mode | `subtask: true` | Same |

**Verdict:** Commands work identically. The harness provides no command infrastructure beyond what OpenCode handles.

### 2.4 Custom Tools — Native

| Capability | How OpenCode Does It | Harness "Adds" |
|---|---|---|
| Tool definition | `.opencode/tools/*.ts` with `tool()` helper | Plugin-registered via `tool()` |
| Zod schemas | `tool.schema.string()` etc. | Same |
| Context access | `{ agent, sessionID, messageID, directory, worktree }` | Same |
| Multiple tools per file | Named exports | Same |
| Any language | Python, bash, etc. via Bun.$ | Same |

**Verdict:** The harness registers `delegate-task` as a plugin tool, but this is a marginal difference from a standalone tool file.

### 2.5 Plugin Hooks — Native

| Hook | What It Does | Harness Usage |
|---|---|---|
| `tool.execute.before` | Mutate args before tool runs | Circuit breaker + budget counting |
| `tool.execute.after` | Mutate output after tool runs | `_harness` metadata injection |
| `event` | Subscribe to platform events | Route to lifecycle manager |
| `shell.env` | Set environment variables | CI=true, TERM=dumb, etc. |
| `experimental.session.compacting` | Inject context before compaction | Harness state snapshot |

**Verdict:** These are the ONLY places the harness does something OpenCode can't do through config. But the implementations are weak (see Section 3).

---

## 3. What the Harness Actually Delivers (Honest Assessment)

### 3.1 `delegate-task` Tool — BROKEN

**What it claims:** Orchestrated delegation with depth limiting, budget tracking, concurrency control.

**What it actually does:**
- Creates a child session via `client.session.create()`
- Sends a prompt via `client.session.prompt()`
- Returns text (sync) or metadata (async)

**Why it's trash:**
1. OpenCode's built-in `task` tool already spawns subagents with proper permission inheritance
2. The "depth limit" of 3 is arbitrary and can be set via agent `permission.task` globs
3. The "budget tracking" of 10 descendants is meaningless — OpenCode handles session trees natively
4. The tool parameters don't match the spec (`description`+`prompt` instead of `task`, no `temperature` param)
5. No actual orchestration — it's a glorified session.create() wrapper

**What it should be:** A genuine orchestration tool that:
- Analyzes task complexity and auto-selects the right agent pipeline
- Manages parallel execution with dependency resolution
- Provides structured result aggregation from multiple specialists
- Handles retry logic with different agents on failure

### 3.2 Circuit Breaker — WEAK

**What it claims:** Detects 16 consecutive semantically similar tool calls and aborts.

**Why it's trash:**
1. OpenCode's `doom_loop` already catches 3 identical calls
2. Threshold of 16 is absurd — by then the agent has wasted significant tokens
3. "Semantic similarity" is just stable stringification of args — not actual semantic analysis
4. No custom tools exist that would benefit from this protection
5. The circuit breaker trips on legitimate patterns (e.g., reading multiple files with `read`)

**What it should be:** Either removed entirely or replaced with:
- Real semantic analysis of tool call patterns
- Adaptive thresholds based on tool type
- Integration with agent instructions to prevent loops before they start

### 3.3 Continuity Store — REDUNDANT

**What it claims:** Persists session state to disk for cross-session continuity.

**Why it's trash:**
1. OpenCode sessions already persist — they survive restarts
2. The continuity JSON duplicates information OpenCode already stores
3. No agent actually reads from this file programmatically
4. No deterministic use case — it's a data graveyard
5. The deep-clone-on-read pattern is good engineering but solves no real problem

**What it should be:** Either removed or repurposed as:
- A genuine cross-session state sharing mechanism
- A structured task queue that persists across restarts
- A real checkpoint system that agents can restore from

### 3.4 Concurrency Queues — MISPLACED

**What it claims:** Per-lane async concurrency limiting with FIFO queuing.

**Why it's trash:**
1. OpenCode handles concurrency natively — it doesn't need a harness to limit it
2. The queues are keyed by model/agent/category but there's no automatic queuing of user prompts
3. No one is waiting in these queues — they're empty most of the time
4. The concurrency limit of 3 is arbitrary and doesn't match any real API constraint

**What it should be:** Either removed or repurposed as:
- A genuine task queue that automatically dispatches work based on available capacity
- A priority system that queues high-value tasks when resources are constrained
- Integration with OpenCode's session management to prevent overload

### 3.5 Metadata Injection — USELESS

**What it claims:** Injects `_harness` metadata into every tool output.

**Why it's trash:**
1. The metadata is verbose but provides no actionable information
2. Agents don't use this metadata to make decisions
3. It adds noise to every tool response without delivering value
4. The "primary mechanism" (before-hook argument injection) isn't implemented
5. No actor tracking — you can't tell which agent did what from the metadata

**What it should be:** Either removed or repurposed as:
- Structured telemetry that feeds into real monitoring
- Decision-support data that agents actually use
- Cross-session state that enables genuine coordination

---

## 4. What OpenCode CANNOT Do (The Real Opportunity)

These are capabilities that require plugin-level intervention and cannot be achieved through configuration:

### 4.1 Cross-Session Orchestration

OpenCode sessions are isolated. A plugin can:
- Coordinate work across multiple sessions
- Share state between sessions
- Manage complex dependency graphs
- Provide unified progress tracking

**This is what a harness should deliver.**

### 4.2 Intelligent Task Decomposition

OpenCode's `task` tool spawns a subagent with a prompt. A plugin can:
- Analyze task complexity and break it into subtasks
- Determine which agents are needed for each subtask
- Manage execution order and dependencies
- Aggregate results into a coherent output

### 4.3 Adaptive Agent Selection

OpenCode uses static agent configuration. A plugin can:
- Select agents based on task characteristics
- Switch models dynamically based on progress
- Adjust temperature and parameters in real-time
- Retry with different agents on failure

### 4.4 Structured Result Aggregation

OpenCode returns text from subagents. A plugin can:
- Parse and structure results from multiple agents
- Resolve conflicts between specialist outputs
- Generate unified reports with evidence
- Track quality metrics across delegations

### 4.5 Real-Time Progress Tracking

OpenCode has session events but no unified progress view. A plugin can:
- Track progress across all sessions in a task
- Provide real-time status updates
- Estimate completion times
- Surface blockers and dependencies

---

## 5. Rebuild Blueprint

### 5.1 What to Keep

| Component | Keep? | Reason |
|---|---|---|
| Plugin hook infrastructure | ✅ | Only way to extend OpenCode |
| SDK client usage | ✅ | Necessary for session management |
| Type definitions | ✅ | Good engineering practice |
| Test framework | ✅ | 152 tests pass, good foundation |

### 5.2 What to Delete

| Component | Delete? | Reason |
|---|---|---|
| `delegate-task` tool | ✅ | Replace with genuine orchestration |
| Circuit breaker | ✅ | OpenCode handles this natively |
| Continuity store | ✅ | Replace with real cross-session state |
| Concurrency queues | ✅ | Replace with real task queue |
| Metadata injection | ✅ | Replace with useful telemetry |
| `routing.ts` (already deleted) | ✅ | Was redundant |
| Agent temperature defaults | ✅ | Should come from agent config |

### 5.3 What to Build

#### Phase 1: Core Orchestration Engine

**Task Decomposition Service**
- Analyzes user input for complexity
- Breaks tasks into subtasks with dependencies
- Determines required agents for each subtask
- Returns structured task graph

**Execution Manager**
- Dispatches subtasks to appropriate agents
- Manages execution order (parallel where possible)
- Handles retries with different agents
- Tracks progress across all subtasks

**Result Aggregator**
- Collects results from all subtasks
- Resolves conflicts between outputs
- Generates unified report
- Provides evidence and citations

#### Phase 2: Intelligent Features

**Adaptive Agent Selection**
- Learns which agents perform best for which tasks
- Adjusts parameters based on task characteristics
- Retries with different agents on failure
- Provides recommendations for agent configuration

**Cross-Session State Sharing**
- Shares context between related sessions
- Maintains task state across restarts
- Provides checkpoint/restore functionality
- Enables genuine multi-session workflows

**Real-Time Progress Dashboard**
- Unified view of all active tasks
- Progress tracking across sessions
- Blocker identification and resolution
- Completion time estimation

#### Phase 3: Advanced Capabilities

**Quality Gates**
- Automated review of agent outputs
- Quality metrics and scoring
- Continuous improvement feedback loop
- Integration with testing frameworks

**Workflow Templates**
- Pre-built workflows for common tasks
- Customizable pipeline definitions
- Reusable orchestration patterns
- Community workflow sharing

**Analytics and Insights**
- Task completion metrics
- Agent performance analytics
- Cost tracking and optimization
- Usage pattern analysis

---

## 6. Implementation Priority

### Immediate (Week 1-2)
1. Delete all redundant components
2. Build Task Decomposition Service
3. Build Execution Manager
4. Build Result Aggregator
5. Create new `delegate-task` tool that uses the orchestration engine

### Short-term (Week 3-4)
6. Implement Adaptive Agent Selection
7. Build Cross-Session State Sharing
8. Create Real-Time Progress Dashboard
9. Add Quality Gates

### Medium-term (Week 5-8)
10. Build Workflow Templates
11. Add Analytics and Insights
12. Create Community Workflow Sharing
13. Optimize Performance

---

## 7. Success Metrics

The rebuilt harness should be judged on:

1. **Task Completion Rate** — % of tasks completed successfully vs. native OpenCode
2. **Time to Completion** — Average time saved through orchestration
3. **Quality of Output** — Measured by review scores and user satisfaction
4. **Resource Efficiency** — Token usage and cost per task
5. **User Adoption** — Number of projects using the harness
6. **Community Contribution** — Number of shared workflows and templates

---

## 8. Conclusion

The current harness is a solution looking for a problem. It wraps OpenCode's native capabilities in unnecessary abstraction layers without delivering meaningful value.

**The rebuild should focus on capabilities that OpenCode cannot provide through configuration:**
- Intelligent task decomposition
- Cross-session orchestration
- Adaptive agent selection
- Structured result aggregation
- Real-time progress tracking

**Delete everything that duplicates OpenCode's native functionality. Build only what genuinely extends the platform's capabilities.**

The harness should be a force multiplier for OpenCode, not a redundant wrapper.
