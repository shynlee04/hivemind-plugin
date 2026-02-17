# OpenCode Automation & HiveMind Paradigm — Master Directive (OMAD-01)

> **Status**: ACTIVE | **Version**: 1.0 | **Date**: 2026-02-17
> **Philosophy**: Trinity Architecture (Commands ↔ Skills ↔ Agents)
> **Tolerance**: ZERO for shallow thinking, overlapping responsibilities, context amnesia

---

## I. DOCUMENT PURPOSE & SCOPE

This document serves as the **definitive Meta-Prompt** for designing, generating, and integrating **Agents**, **Skills**, and **Commands** within the HiveMind Context Governance ecosystem.

**Who This Is For:**
- AI Agents building features for this project
- Developers extending the ecosystem with new capabilities
- Systems integrating OpenCode SDK hooks and event automation

**Why This Exists:**
- Prevents spaghetti architecture and overlapping scopes
- Ensures deterministic, traceable execution
- Maintains context integrity across sessions and compactions

---

## II. THE CONCEPTUAL TRIAD (Strict Boundaries & Taxonomy)

### II.A. COMMANDS — The "What" / Actuators

**Definition:** Atomic, stateless, deterministic execution interfaces (e.g., TypeScript/Node tools like `hivemind_session`, `hivemind_debug_trigger`).

**Role:** The "hands" of the system. They interface with the OS, file system, or relational graph state.

**Constraint [HC5 Compliance]:**
- Commands **SHALL DO ZERO COGNITIVE THINKING**
- They take deterministic JSON arguments
- They MUST return deterministic JSON outputs for Foreign Key (FK) chaining

**Required Output Format:**
```typescript
// ✅ VALID (HC5 Compliant)
{
  "status": "success" | "error",
  "message": "Human-readable status message",
  "entity_id": "uuid-string",
  "data": { /* structured output */ }
}

// ❌ INVALID
"Error: Something went wrong"  // Raw string - forbidden
{ "error": "Failed" }           // Missing required fields
{ "ok": true }                  // Non-standard field names
```

**Examples in This Project:**
- `hivemind_debug_trigger` - Creates debug session, returns session_id
- `hivemind_debug_verify` - Runs verification, returns pass/fail status
- `hivemind_session` - Manages lifecycle, returns state JSON
- `hivemind_memory` - Saves/recalls, returns memory entries

---

### II.B. SKILLS — The "How" / Cognitive Frameworks

**Definition:** Modular, declarative reasoning packages (Prompts / YAML / Logic Templates).

**Role:** The "methodology." They inject specific psychological profiles, workflows, and checklists into an Agent's context window.

**Constraint:**
- Skills **SHALL DO ZERO DIRECT EXECUTION**
- A Skill like `systematic-debugging-hivemind` does NOT run code
- It instructs the Agent on WHICH Commands to use and in WHAT strict sequence

**Skill Structure:**
```markdown
# Skill: [name]

## Overview
[What this skill does - methodology, NOT execution]

## When to Load
[Trigger conditions - when should an agent use this?]

## Workflow
[Step-by-step instructions using Commands]

## Constraints
[What this skill MUST NOT do]

## Related Skills
[Links to complementary skills]
```

**Examples in This Project:**
- `systematic-debugging-hivemind` - Single-hypothesis methodology
- `parallel-debugging-hivemind` - Multi-hypothesis methodology
- `debug-orchestration` - High-level workflow coordination
- `hivemind-governance` - Session and context management

---

### II.C. AGENTS & SWARMS — The "Who" / Orchestrators

**Definition:** Autonomous, stateful, goal-oriented loops (Main Agent or Headless Swarms).

**Role:** The "will." Agents ingest **Skills**, maintain the `Trajectory → Tactic → Action` hierarchy in `brain.json`, and orchestrate **Commands**.

**Constraint:**
- Agents **SHALL NOT** implement low-level data parsing or raw bash executions directly
- They MUST delegate to atomic Commands
- They must continuously update their state via `hivemind_session(update)` to prevent context degradation

**Agent Structure:**
```markdown
# Agent: [name]

## Identity
[Who this agent is - specialized role]

## Core Directives
[Key behavioral rules]

## Mandatory First Steps
[What MUST happen before ANY action]

## Strategy Selection
[How to choose between different approaches]

## Skills to Load
[Which skills to inject based on situation]

## Commands to Use
[Which commands to delegate to]

## Constraints
[What this agent MUST NOT do]
```

**Examples in This Project:**
- `debug` - Debug workflow orchestrator
- `build` - Full-stack development engine
- `scanner` - Deep investigation agent

---

## III. BLUEPRINT: EVENT-DRIVEN DEBUG AUTOMATION

When designing automation that reacts to the environment (e.g., a Systematic Debugger striking when an error occurs), you MUST follow this precise **Event-to-Resolution Pipeline**:

### III.A. The Strike (Event Hook)

The system does not wait for the user. It listens to OpenCode SDK `event` hook:

```typescript
// In src/hooks/event-handler.ts
"event": async (event) => {
  if (event.type === "lsp.diagnostics.publish") {
    // Extract diagnostic info
    const { uri, diagnostics } = event.data
    const errors = diagnostics.filter(d => d.severity === 1)
    
    if (errors.length > 0) {
      await triggerDebugOrchestration(errors)
    }
  }
}
```

### III.B. The Router (Command)

The Event Handler catches the failure, creates session via Command:

```typescript
// Using hivemind-debug-trigger command
await executeCommand("hivemind-debug-trigger", {
  source: "lsp",
  errors: errors.map(e => ({
    message: e.message,
    file: e.uri,
    line: e.range.start.line,
    severity: "error"
  }))
})
```

### III.C. The Skill Injection

The agent wakes up, injecting appropriate Skills:

```typescript
// Inject systematic-debugging-hivemind for single errors
// Inject parallel-debugging-hivemind for multiple hypotheses
// Inject debug-orchestration for complex workflows
```

### III.D. The Execution Loop (Agent + Commands)

```
1. Isolate: Agent calls hivemind_session({ action: "start", ... })
2. Gather: Agent calls read, grep, glob
3. Hypothesize: Agent states hypothesis clearly
4. Test: Agent applies minimal fix
5. Verify: Agent calls hivemind_debug_verify
```

### III.E. Context Preservation (Memory)

The Agent verifies fix, saves solution:

```typescript
hivemind_memory({
  action: "save",
  shelf: "solutions",
  content: `Root Cause: ${rootCause}\nFix: ${fix}\nVerification: ${verificationResult}`,
  tags: "debug,resolved,[category]"
})

hivemind_cycle({ action: "export" }) // Return structured diff
```

---

## IV. REQUIRED ARCHITECTURAL PATTERNS

### IV.A. Safe Concurrency & State Management

Agents do not rely on ephemeral LLM context windows. They rely on disk-backed state (`.hivemind/state/`).

**File Locking:**
- When multiple Swarm agents edit the same project simultaneously
- MUST use `withFileLock()` (proper-lockfile)
- Use atomic write-rename operations to prevent TOCTOU (Time-of-Check to Time-of-Use) race conditions

**Path Resolution:**
- NEVER hardcode paths
- ALWAYS use `getEffectivePaths(projectRoot)`

### IV.B. Amnesia Prevention & Compaction Survival

Infinite context windows degrade reasoning. Design for aggressive auto-compaction.

- If feature requires long-term memory → MUST save to `graph/mems.json` via `hivemind_memory`
- If feature has immutable constraint → MUST be anchored via `hivemind_anchor`

### IV.C. Soft Governance & Interception

Do not crash the system for minor Agent misbehavior. Guide it.

- Use `tool.execute.before` (Tool Gate) to inspect intent, log advisories
- Use `tool.execute.after` (Soft Governance) to increment tracking (e.g., `write_without_read_count`, `consecutive_failures`, `drift_score`)
- Use `experimental.chat.messages.transform` to append invisible Pre-Stop Checklists

---

## V. ANTI-PATTERNS (ZERO TOLERANCE OFFENSES)

If you generate code or workflows containing any of the following, your architecture is INVALID:

### V.1. The "Blind Cowboy" Write

**Bad:**
```typescript
// Agent attempts write without investigation
write({ filePath: "src/utils.ts", content: "..." })
```

**Correction:** Governance layer flags as `out_of_order` violation. Always investigate first.

### V.2. Monolithic "God" Tools

**Bad:**
```typescript
// Single function that does everything
function fixAllTheThings() {
  const content = readFile(...)
  const fixed = parseAndFix(content)
  writeFile(...)
  gitCommit(...)
}
```

**Correction:** Break into `read_file` → `apply_patch` → `git_commit` Commands, orchestrated by Agent.

### V.3. State Hijacking

**Bad:**
```typescript
// Writing directly to brain.json using raw fs
fs.writeFileSync(".hivemind/state/brain.json", JSON.stringify(newState))
```

**Correction:** Use exported `createStateManager().withState()` or `graph-io.ts` functions.

### V.4. Subagent Ghosting

**Bad:**
```typescript
// Ignoring pending_failure_ack from headless Swarm
const result = await subagent.run(...)
// No check, no export_cycle
```

**Correction:** MUST call `hivemind_cycle({ action: "export" })` to acknowledge before proceeding.

### V.5. Context Pollution

**Bad:**
```typescript
// Dumping raw 10k-line LSP logs into Agent prompt
system: "Here is the error: " + massiveLogOutput
```

**Correction:** Use Command to filter/summarize payload, or delegate to headless Swarm.

---

## VI. THE "NO SHALLOW THINKING" PRE-FLIGHT CHECKLIST

Before outputting ANY code, architecture, or JSON schemas for this project, the AI MUST silently verify:

### VI.A. Boundary Check

- [ ] Is this a Command (trigger/actuator), a Skill (methodology), or an Agent (workflow)?
- [ ] Did I blur the lines between them?

### VI.B. HC5 Compliance (for Commands)

- [ ] Does it return `{ status: "success" | "error" }`?
- [ ] Does it include required fields (`message`, `entity_id`, `data`)?
- [ ] Is output deterministic (no random/undefined values)?

### VI.C. State Safety

- [ ] Did I use `withFileLock` for concurrent file access?
- [ ] Did I use atomic write-rename operations?
- [ ] Did I use `getEffectivePaths()` instead of hardcoded paths?

### VI.D. Traceability

- [ ] Did I pass the `session_id` or `origin_task_id` into graph nodes?
- [ ] Is every state change traceable via `hivemind_inspect`?

### VI.E. Cross-Compatibility

- [ ] Does this logic apply safely regardless of project language (TS/Python/Rust)?
- [ ] Does it rely on LSP and standard streams, not language-specific ASTs?

### VI.F. Memory & Anchors

- [ ] If long-term memory needed → using `hivemind_memory`?
- [ ] If immutable constraint → using `hivemind_anchor`?

---

## VII. FILE STRUCTURE CONVENTIONS

### VII.A. Skills Directory

```
skills/
├── systematic-debugging-hivemind/
│   └── SKILL.md
├── parallel-debugging-hivemind/
│   └── SKILL.md
├── debug-orchestration/
│   └── SKILL.md
├── hivemind-governance/
│   └── SKILL.md
├── session-lifecycle/
│   └── SKILL.md
├── context-integrity/
│   └── SKILL.md
├── delegation-intelligence/
│   └── SKILL.md
├── evidence-discipline/
│   └── SKILL.md
└── requirements-clarity/
    └── SKILL.md
```

### VII.B. Commands Directory (.kilocode)

```
.kilocode/commands/
├── hivemind-debug-trigger.md
├── hivemind-debug-verify.md
├── hivemind-session-start.md
├── hivemind-session-update.md
├── hivemind-session-close.md
├── hivemind-memory-save.md
├── hivemind-memory-recall.md
├── hivemind-anchor-save.md
├── hivemind-anchor-list.md
├── hivemind-scan.md
├── hivemind-delegate.md
└── hivemind-pre-stop.md
```

### VII.C. Agents Directory (.kilocode)

```
.kilocode/agents/
├── debug.md
├── build.md
├── code-review.md
├── scanner.md
├── explore.md
└── hivemind-brownfield-orchestrator.md
```

---

## VIII. NAMING CONVENTIONS

### VIII.A. Skills

- **Format:** `[domain]-[methodology]-hivemind` or `[concept]-orchestration`
- **Examples:** `systematic-debugging-hivemind`, `parallel-debugging-hivemind`, `debug-orchestration`

### VIII.B. Commands

- **Format:** `hivemind-[action]-[object]` or `[action]-[object]`
- **Examples:** `hivemind-debug-trigger`, `hivemind-debug-verify`, `hivemind-session-start`

### VIII.C. Agents

- **Format:** `[role]` or `[role]-[specialty]`
- **Examples:** `debug`, `build`, `scanner`, `explore`, `code-review`

---

## IX. DOCUMENTATION STANDARDS

### IX.A. SKILL.md Template

```markdown
# Skill: [name]

## Overview
[One paragraph - what this skill provides]

## When to Load
[Specific trigger conditions]

## [Phase/Step Names]
[Detailed workflow with Commands to use]

## Constraints
[What this MUST NOT do]

## Related Skills
[Links to complementary skills]

## File References
[Paths to related code]
```

### IX.B. Command .md Template

```markdown
---
name: "[command-name]"
description: "[what this command does]"
---

# [Command Name]

[What this command does - NOT how to think, just input/output contract]

## Input Schema
[JSON schema for arguments]

## Execution Steps
[Sequential steps - MUST be deterministic]

## Output Contract
[JSON output format - success and error cases]

## Examples
[Input → Output examples]

## Constraints
[What this command MUST NOT do]
```

### IX.C. Agent .md Template

```markdown
# [Agent Name] Agent - [Project] [Role]

## Identity
[Who this agent is - specialized role description]

## Core Directives
[Key behavioral rules - numbered list]

## [Section Name]
[Detailed workflow/constraints]
```

---

## X. OPENCODE SDK REFERENCE

### X.A. Key Hooks for Debugging

| Hook | Fires When | Blocking | Use Case |
|------|-----------|----------|----------|
| `experimental.chat.messages.transform` | Before LLM call | ❌ | Inject debug context |
| `tool.execute.before` | Before any tool | ✅ | Block dangerous commands |
| `tool.execute.after` | After any tool | ❌ | Log, classify |
| `experimental.session.compacting` | Before compaction | ❌ | Modify context |
| `event` | Any event | ❌ | React to LSP, tests |

### X.B. SDK Key Methods

```typescript
// Create headless session
await client.session.create({ projectId, model, systemPrompt })

// Inject context without response
await client.session.prompt(sessionId, { message, noReply: true })

// Get response
await client.session.prompt(sessionId, { message })

// Execute command
await client.session.command(sessionId, { command: "npm test" })
```

---

## XI. QUICK REFERENCE

### XI.A. Required Tools Per Task

| Task | Skills | Commands | Agents |
|------|--------|----------|--------|
| Debug single error | systematic-debugging-hivemind | hivemind-debug-trigger, hivemind-debug-verify | debug |
| Debug multiple hypotheses | parallel-debugging-hivemind | hivemind-debug-trigger, hivemind-debug-verify | debug |
| Event-driven debug | debug-orchestration | hivemind-debug-trigger, hivemind-debug-verify | debug |
| Session management | session-lifecycle | hivemind-session-* | Any |
| Context integrity | context-integrity | hivemind-scan | Any |
| Delegation | delegation-intelligence | hivemind-delegate | Any |
| Verification | evidence-discipline | (verification commands) | build |

### XI.B. Command Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `success` | Operation completed | Continue workflow |
| `error` | Operation failed | Check message, fix issue |
| `blocked` | Waiting on dependency | Resolve dependency |
| `pending` | In progress | Wait for completion |

---

## XII. COMPLIANCE VERIFICATION

Before any deliverable, verify:

1. **Trinity Architecture** - No blurred lines between Command/Skill/Agent
2. **HC5 Compliance** - All commands return deterministic JSON
3. **State Safety** - File locking, atomic operations
4. **Traceability** - session_id tracked through graph
5. **Cross-Compatibility** - LSP-based, not language-specific
6. **Memory Anchors** - Long-term data uses hivemind_memory
7. **Immutable Constraints** - Uses hivemind_anchor

---

## XIII. ACKNOWLEDGMENT

```
BY PROCEEDING, YOU ACKNOWLEDGE THAT:
- You have read and understood the Trinity Architecture
- You will NOT blur boundaries between Command/Skill/Agent
- You will use HC5-compliant JSON for all command outputs
- You will preserve state safety with file locking
- You will ensure traceability via session_id tracking
- You will use memory/anchors for persistence
- You will NOT engage in shallow thinking

FROM THIS POINT FORWARD, ALL ARCHITECTURE, CODE GENERATION,
AND REFACTORING WILL ADHERE STRICTLY TO THIS PARADIGM.
```

---

## XIV. RELATED DOCUMENTS

| Document | Purpose |
|----------|---------|
| `docs/DEBUG-ECOSYSTEM-GUIDE-2026-02-17.md` | Debug ecosystem implementation |
| `docs/OPENCODE-SDK-DEBUG-INTEGRATION-2026-02-17.md` | SDK deep dive |
| `AGENTS.md` | Agent configuration |
| `AGENT_RULES.md` | Architectural philosophy |
| `src/hooks/event-handler.ts` | Event hook registration |
| `src/lib/session-swarm.ts` | Swarm orchestration |

---

**END OF MASTER DIRECTIVE (OMAD-01)**
