# Session Hierarchy Protocol — Behavioral Contracts for HiveFiver

> **STATUS**: FILLED — verified via Context7, Anthropic docs, and codebase investigation
> **Last synced**: 2026-03-02
> **Cross-ref**: `hivefiver-mode/references/session-delegation.md` has SDK API details.
> This file focuses on BEHAVIORAL CONTRACTS — how hivefiver should behave in each session type.

---

## 1. Session Type Detection

### Detection Signals (Reliable)

| Signal | Session Type | Confidence |
|--------|-------------|-----------|
| Human user message is first in history | **Main session** | HIGH |
| Context contains a delegation packet with `objective` + `in_scope_paths` | **Sub-session** (via Task tool) | HIGH |
| Context starts with a compaction summary (tagged `summary: true`) | **Recovery session** (post-compact) | HIGH |
| Session has `parentID` set | **Child session** (sub or continued) | MEDIUM |
| `opencode run --continue` or `--session <id>` used | **Continued session** | HIGH |

### Detection Signals (Unreliable — Do NOT rely on)

| Signal | Why Unreliable |
|--------|---------------|
| Presence of `task_id` in context | Could be stale from resumed session |
| Agent name in system prompt | Always present regardless of session type |
| Skill list visibility | Skills don't inherit — always looks fresh |
| Turn count = 0 | Could be recovery OR fresh |

### Decision Tree

```
Is there a compaction summary at context start?
  YES → RECOVERY SESSION
  NO ↓
Is there a delegation packet with structured objective?
  YES → SUB-SESSION
  NO ↓
Is there a human user message as first input?
  YES → MAIN SESSION
  NO → ASSUME MAIN SESSION (safest default)
```

---

## 2. Main Session Behavior Contract

> HiveFiver in main session = **Coordinator-fronted** (default)

### MUST Do

| Behavior | Rationale |
|----------|-----------|
| Present options with rationale before strategic decisions | Human needs to choose direction |
| Show 3 options with expert recommendation + why others are weaker | AGENTS.md mandate: "indicate your expert choice" |
| Emit structured declaration at session start | Self-orientation + human readability |
| Ask for confirmation before modifying framework assets | Irreversible changes need human gate |
| Use progressive disclosure (load skills incrementally) | Preserve context budget for human interaction |

### MUST NOT Do

| Behavior | Rationale |
|----------|-----------|
| Execute delegation packets silently | Human is watching — be transparent |
| Load 5+ skills at once | G-07: Skill avalanche |
| Skip the declaration protocol | First turn is orientation — don't skip it |
| Touch `src/**` or `tests/**` | Scope boundary — ALWAYS forbidden |
| Assume what human wants without classifying intent | Misclassification → wrong stage → wasted context |

### Output Pattern

```
HIVEFIVER DECLARATION
=====================
Session type: main
Mode: coordinator
Intent: [pending | classified as: ...]
Context: [clean | suspect | poisoned]
Skills loaded: [hivefiver-prime]
Skills queued: [hivefiver-mode, ...]
Constraints: [scope: .opencode/** .hivemind/**]
```

Then: classify intent → route to stage → load stage-specific skills → execute.

---

## 3. Sub-Session Behavior Contract

> HiveFiver in sub-session = **Executor-fronted** (delegation packet drives behavior)

### How You Get Here

Another agent (or hivefiver self-delegation) calls the Task tool:
```
Task({ description: "...", prompt: "...", subagent_type: "hivefiver" })
```

OpenCode creates a child session with:
- Own `parentID` linking to parent
- Hardcoded default permissions: `todowrite: deny`, `todoread: deny`, `task: deny`
- Fresh skill slate (nothing inherited from parent)

### MUST Do

| Behavior | Rationale |
|----------|-----------|
| Read delegation packet FIRST | Packet IS your instruction set |
| Execute the objective deterministically | Parent expects structured result, not options |
| Return structured evidence (not narrative) | Parent needs machine-parseable output |
| Stay within `in_scope_paths` from packet | Scope was pre-validated by parent |
| Load only skills needed for the task | Child session has limited context budget |

### MUST NOT Do

| Behavior | Rationale |
|----------|-----------|
| Ask for human confirmation | You're in a child session — human isn't watching |
| Present multiple options | Parent sent ONE objective — execute it |
| Spawn further sub-agents | Default: `task: deny` in child sessions |
| Use todowrite/todoread | Default: denied in child sessions |
| Load hivefiver-prime (unless packet says to) | Heavy skill for sub-tasks — load only what's needed |

### Output Pattern

```json
{
  "status": "complete | partial | failed",
  "objective": "what was requested",
  "findings": ["structured evidence items"],
  "files_touched": ["list of paths"],
  "risk": "any residual risk",
  "next_actions": ["what parent should do next"]
}
```

---

## 4. Recovery Session Behavior Contract

> HiveFiver after auto-compact = **Continuity recovery mode**

### How You Get Here

When the context window fills (~200K tokens for Claude), OpenCode triggers compaction:
1. Session history sent to compaction agent (all tools denied)
2. Summary generated with structure: Goal / Instructions / Discoveries / Accomplished / Files
3. New context window starts with summary as the handoff
4. Summary tagged `summary: true` marks the session boundary

### What Survives Compaction

| Survives | Lost |
|----------|------|
| Compaction summary (structured) | Raw tool outputs (replaced with `"[Old tool result content cleared]"`) |
| Loaded skill content (never pruned) | Detailed conversation history |
| Agent body (reloaded) | Intermediate reasoning |
| Walk-up instructions (AGENTS.md, etc.) | Prior declarations |

### What Plugin Hooks Can Preserve

The `experimental.session.compacting` hook can inject additional context:
```typescript
output.context.push(`
## HiveFiver State
Current stage: build
Completed gates: G0, G1, G2
Active TODO: Create agent profile for hiveplanner
Blockers: None
`)
```

### MUST Do

| Behavior | Rationale |
|----------|-----------|
| Detect post-compact state (summary at context start) | Don't treat recovery as fresh session |
| Read the summary for: Goal, Accomplished, Files | Reconstruct working state |
| Check STATE.md for ground truth (file survives compaction) | Summary may miss details |
| Re-load hivefiver-prime if not already loaded | Skills persist but verify |
| Emit abbreviated declaration | Re-orient without burning context |

### MUST NOT Do

| Behavior | Rationale |
|----------|-----------|
| Start from scratch | Compaction preserves intent — don't ignore it |
| Re-do work listed in "Accomplished" | Already done — verify, don't repeat |
| Assume context is clean | Compaction is lossy — treat as "suspect" quality |
| Load L3/L4 references immediately | Context budget is precious after compaction |

---

## 5. OpenCode Session API Quick Reference

### CLI Operations

| Operation | Command | Use Case |
|-----------|---------|----------|
| Fresh session | `opencode run --agent hivefiver "prompt"` | Self-delegation to fresh context |
| Continue session | `opencode run --continue` | Resume last session |
| Resume specific | `opencode run --session <id>` | Resume known session |
| Fork session | `opencode run --fork --session <id>` | Branch from checkpoint |
| List sessions | `opencode session list --format json` | Inventory |
| Export session | `opencode export <sessionID>` | Archive for analysis |

### SDK Operations

| Operation | Method | Key Params |
|-----------|--------|-----------|
| Create child | `client.session.create({ parentID, title, permission })` | Permission ruleset for isolation |
| Prompt child | `client.session.prompt({ sessionID, agent, parts })` | Parts = message content |
| Command in session | `client.session.command({ sessionID, command, arguments })` | Execute slash command |
| Subscribe events | `client.event.subscribe()` | Real-time session monitoring |

### Task Tool Resumption

The `task_id` parameter enables continuing a prior sub-session:
```
Task({ task_id: "prior_session_id", prompt: "continue from checkpoint" })
```
This preserves all prior history in the child session instead of starting fresh.

---

## 6. HiveFiver Self-Delegation Protocol

### When to Self-Delegate

| Trigger | Action |
|---------|--------|
| Context at ~80% capacity | Checkpoint → self-delegate with fresh session |
| Stage transition (e.g., spec → architect) | Self-delegate with stage context |
| Investigation needed but main session should stay clean | Delegate investigation to sub-session |

### Self-Delegation Prompt Template

```
Load hivefiver-prime and hivefiver-mode skills first.
Current stage: {stage}
Execute: /hivefiver {stage}
Prior context:
  - Completed: {list of completed items}
  - Current: {what's in progress}
  - Blockers: {any blockers}
Constraints:
  - Stay in .opencode/** and .hivemind/**
  - Do NOT touch src/** or tests/**
Quality gate: Run runtime-gate.sh post-turn before claiming completion.
Return: structured evidence with status, findings, risk, next_actions.
```
