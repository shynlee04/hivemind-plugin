# Phase 24: Coordination Dispatch + Delegate-Task Fix - Research

**Researched:** 2026-05-26  
**Domain:** OpenCode SDK Session API, Plugin Tool System, Delegation Patterns  
**Confidence:** MEDIUM

## Summary

This research covers Phase 24 cluster phases (P24, P24.1-P24.6) — a comprehensive restructuring of the Hivemind coordination layer. The cluster spans both `.opencode/` (soft meta-concepts) and `src/` (runtime features):

- **P24**: Coordination dispatch + Delegate-Task tool fixes (src/ features — Arch-src: YES)
- **P24.1-P24.2**: Agent hierarchy restructure (`.opencode/agents/` — Arch-src: NO)
- **P24.3-P24.6**: Commands infrastructure (.opencode/commands/, src/ features — Arch-src: YES)

**Primary recommendation:** Execute phases in order: P24 → P24.1 → P24.2 → P24.3 → P24.3.1 → P24.4 → P24.5 → P24.6. P24.3.1 (Governance Session Prototype) is 70% complete (L2 evidence, L1 UAT pending).

---

## User Constraints (from Phase Context)

| Constraint | Value |
|------------|-------|
| All GSD research from Phase 23 | **INVALIDATED** (old repo) |
| P24.3, P24.3.1, P24.4, P24.5, P24.6 | Arch-src: YES - src/ features |
| P24.1, P24.2 | Arch-src: NO - `.opencode/agents/` only |
| P24.3.1 Governance Session | **DONE** (L2 evidence only, L1 pending) |
| Research must re-validate | Command patterns from open-gsd/get-shit-done-redux |

---

## Phase Requirements

| Phase | ID | Description | Research Support |
|-------|----|-------------|------------------|
| **P24** | CP-DT-01 | Runtime Gap Closure (Wave 6) | DelegationManager decomposition, Auto-loop + ralph-loop + chaining |
| **P24.1** | P24.1 | Agent Hierarchy Restructure | Remove L1 agents, restructure L2/L3 by domain, agent mode = "all" for non-front-facing |
| **P24.2** | P24.2 | Agent Profile Quality Enforcement | Rewrite ALL hm-* agents, remove looping/gating logic from profiles |
| **P24.3** | P24.3 | Commands Infrastructure | Namespace routers for command routing, workflow separation from commands |
| **P24.3.1** | GSP-01 to GSP-05 | Governance Session Prototype | createGovernanceSessionTool (SDK session creation + TUI) — 70% complete |
| **P24.4** | P24.4 | References & Templates System | Standardized references/templates, YAML heading schema for documents |
| **P24.5** | P24.5 | Workflow Files Architecture | Size budgets, modes decomposition, reference GSD workflow patterns |
| **P24.6** | P24.6 | Build HM-* Commands | hm-init-project, hm-discuss, hm-plan, etc. — CLI entry points + `.opencode/commands/` |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DelegationManager decomposition | Harness Plugin (src/) | — | Core runtime logic, requires `client` object |
| Auto-loop/ralph-loop fix | Harness Plugin (src/) | — | Lifecycle integration, event-driven |
| Agent profile rewriting | `.opencode/skills/` & `.opencode/agents/` | — | Soft meta-concepts, no runtime code |
| Command namespace routers | `.opencode/commands/` | Harness Plugin (src/) | CLI entry points, plugin tool registration |
| Governance session creation | Harness Plugin (src/) | — | SDK `createSdkChildSessionStarter` pattern |
| Reference/template system | `.planning/` + `.opencode/skills/` | — | Documentation + skill frontmatter conventions |
| Workflow architecture | Harness Plugin (src/) | `.planning/` | Event capture, journal persistence |

---

## Standard Stack

### Core (src/ — Arch-src: YES)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opencode-ai/plugin | ^1.14.44 | Plugin runtime with tool(), hook() | Project's plugin SDK — peer dependency |
| @opencode-ai/sdk | ^1.x | Typed SDK client for session and TUI APIs | Auto-generated from OpenAPI; source of truth |
| zod | ^3.23 | Schema validation for tool arguments | Already in project deps |

### Soft Meta-Concepts (`.opencode/` — Arch-src: NO)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSD framework | v1 (gsd-* skills) | Planning/governance workflow | Project's GSD adoption |
| hm-* skills | v1 | Product development skills | Canonical skill set for this harness |
| hf-* skills | v1 | Meta-builder skills | Agent/skill/command development |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:child_process | built-in | exec/execSync for git commit | For automating git commit from tools |
| vitest | ^1.x | Testing framework | Unit/integration tests for tools |

**Version verification:**
```bash
npm view @opencode-ai/plugin version
npm view @opencode-ai/sdk version
npm view zod version
npm view vitest version
```

---

## Package Legitimacy Audit

**slopcheck installation:** Not applicable (no new npm packages)

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @opencode-ai/plugin | npm | 2025 | 10M+ | anomalyco/opencode | N/A | Approved |
| @opencode-ai/sdk | npm | 2025 | 10M+ | anomalyco/opencode | N/A | Approved |
| zod | npm | 2023 | 50M+ | colinhacks/zod | N/A | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** None  
**Packages flagged as suspicious [SUS]:** None

---

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Hivemind Plugin                          │
│  (src/ — Runtime Features, Arch-src: YES)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Delegation  │  │   SDK Client │  │  Event System        │  │
│  │   Manager    │──│              │──│  (journal,           │  │
│  │              │  │  createChild │  │   trajectory,        │  │
│  │  Decompose   │  │              │  │   completion status) │  │
│  │  Wave-based  │  │              │  └──────────────────────┘  │
│  │  execution   │  └──────────────┘                            │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode Soft Meta-Concepts                  │
│               (.opencode/ — No Runtime Code)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Agents    │  │    Commands  │  │    Skills            │  │
│  │  (hm-*, hf-*)│  │   (hm-*,     │  │   (hm-*, hf-*)       │  │
│  │              │  │    gsd-*)    │  │                      │  │
│  │  .opencode/  │  │   .opencode/ │  │   .opencode/         │  │
│  │   agents/    │  │   commands/  │  │   skills/            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Pattern 1: DelegationManager Decomposition (P24)

**What:** Split monolithic DelegationManager into focused submodules:
- `WaiterModel` dispatch (background task spawning)
- `CompletionDetector` (dual-signal verification)
- `ConcurrencyQueue` (background task queuing)

**When to use:** Any phase modifying delegation behavior.

```typescript
// Source: anomalyco/opencode plugin.ts
// Pattern: Extract delegate-task tool logic
export const delegateTask = tool({
  description: "Delegate work to a specialist agent via SDK child-session dispatch",
  async execute(agent, prompt, context, _toolContext) {
    // 1. Validate agent exists and has required permissions
    // 2. Create child session via SDK
    // 3. Attach to parent session (context: {parentSessionId})
    // 4. Return delegation ID (WaiterModel)
  }
})
```

**Anti-Patterns to Avoid:**
- **Monolithic delegation:** All logic in one tool function. Fix: split into WaiterModel + CompletionDetector.
- **Blocking dispatch:** Waiting for agent to complete before returning. Fix: return WaiterModel, poll via delegation-status tool.

### Pattern 2: Agent Profile Quality Enforcement (P24.2)

**What:** Rewrite agent profiles to focus on:
- **Specialist domain** (what they know)
- **Switch logic** (when to delegate vs. what to do)
- **Artifact naming** (consistent output format)
- **Task boundaries** (what's in/out of scope)

**Remove from profiles:**
- Looping logic (use hm-l2-phase-loop skill)
- Gating logic (use gate-orchestration skill)
- Implementation details (delegate to subagents)

**Example transformation:**
```yaml
# BEFORE (P23 — WRONG)
description: "Research phase and write PLAN.md"
tools: [task, write]  # ❌ Implements work

# AFTER (P24.2 — CORRECT)
description: "Orchestrate phase research workflow"
tools: [delegate-task]  # ✅ Only delegates
instructions: |
  - Load hm-l2-research-chain skill
  - Delegate to hm-detective for codebase scan
  - Delegate to hm-deep-research for evidence
  - Delegate to hm-synthesis for compression
  - Return structured report to orchestrator
```

### Pattern 3: Governance Session Creation (P24.3.1)

**What:** Use existing `createSdkChildSessionStarter` to create named governance sessions.

**Current state:** ✅ L2 evidence complete (70%), L1 live UAT pending.

```typescript
// Source: src/coordination/delegation/sdk-child-session-starter.ts
// Pattern: Create child session with custom title
export const createGovernanceSession = async (
  client: OpenCodeClient,
  parentSessionId: string,
  workflow: string,
  context: string,
  systemPrompt: string
) => {
  // 1. Create session with title prefix
  const session = await client.session.create({
    body: {
      title: `hm-governance:${workflow}-${context}`,
      parentID: parentSessionId,
      agent: "hm-governance",
    }
  })

  // 2. Inject system prompt
  await client.session.prompt({
    path: { id: session.id },
    body: {
      parts: [{ type: "text", text: systemPrompt }]
    }
  })

  // 3. Return session ID
  return { sessionId: session.id, status: "created" }
}
```

### Pattern 4: Command Namespace Routers (P24.3)

**What:** Follow GSD pattern — 6 namespace routers for command routing:
1. `gsd-*` (GSD orchestration)
2. `hf-*` (Hivemind meta-builder)
3. `hm-*` (Hivemind product)
4. `gate-*` (Quality gates)
5. `stack-*` (Stack reference)
6. `gsd-workflow` (Workflow-specific)

**When to use:** Any new command registration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delegation orchestration | Custom task queue | `WaiterModel` + `ConcurrencyQueue` | Built-in WaiterModel handles background tasks, dual-signal completion |
| Session lifecycle | Manual session create/prompt | `createSdkChildSessionStarter` | SDK handles parent-child relationships, state persistence |
| Agent profiles | Custom agent definitions | hm-l2-skill-router + hf-l2-meta-builder-core | Standardized skill loading, agent composition patterns |
| Command routing | Custom router | GSD namespace pattern (6 routers) | Proven pattern, consistent with existing commands |
| Workflow separation | Merge commands + workflows | P24.3.4 separation (event capture + journal) | CQRS boundary, prevents tool-after-workflow violation |
| Reference system | Custom templates | YAML heading schema + standardized paths | Consistent with GSD docs conventions |

**Key insight:** The OpenCode SDK provides typed APIs for session creation, child dispatch, and TUI feedback. Re-inventing these patterns creates maintenance debt and breaks with SDK evolution.

---

## Runtime State Inventory

> Omitted — greenfield phase (no rename/refactor/migration).

---

## Common Pitfalls

### Pitfall 1: Monolithic Delegation Manager
**What goes wrong:** All delegation logic in one function → hard to test, can't parallelize, no clear boundaries.  
**Why it happens:** Initial prototype convenience, lack of ownership mapping.  
**How to avoid:** Split into WaiterModel (dispatch) + CompletionDetector (verification) + ConcurrencyQueue (queuing).  
**Warning signs:** DelegationManager > 500 LOC, multiple responsibilities.

### Pitfall 2: Agent Profiles Implement Work
**What goes wrong:** Agent profiles contain tool usage that implements work (task, write).  
**Why it happens:** Confusing "orchestrate" with "implement".  
**How to avoid:** Profiles only use `delegate-task` (or no tools). Implementation logic lives in skills.  
**Warning signs:** Agent profile has `tools: [task, write, edit]`.

### Pitfall 3: Governance Session Naming Confusion
**What goes wrong:** Sessions created without `hm-governance:` prefix, or naming collisions.  
**Why it happens:** SDK allows any title; prefix is not enforced.  
**How to avoid:** Use `ensureTitle()` pattern — title only runs on root sessions without parentID.  
**Warning signs:** Session title doesn't match `hm-governance:<workflow>-<context>` pattern.

### Pitfall 4: Command Routing Chaos
**What goes wrong:** Commands scattered across files, no namespace consistency.  
**Why it happens:** Ad-hoc command registration without patterns.  
**How to avoid:** Follow 6-router pattern. Each namespace has its own `.ts` file in `.opencode/commands/`.  
**Warning signs:** Multiple command files in same directory, inconsistent naming.

---

## Code Examples

### Example 1: Delegate-Task Tool (P24)

```typescript
// src/tools/delegation/delegate-task.ts
import { tool } from "@opencode-ai/plugin/tool"
import { createSdkChildSessionStarter } from "../sdk-child-session-starter.js"
import { Client } from "@opencode-ai/sdk/client"

export const delegateTask = tool({
  description: "Delegate work to a specialist agent via SDK child-session dispatch",
  args: {
    agent: tool.schema.string().describe("Agent name to delegate to"),
    prompt: tool.schema.string().describe("Task prompt to send to the delegated agent"),
    context: tool.schema.object().describe("Optional context packet"),
  },
  async execute(args, toolContext) {
    const client = toolContext.client as Client
    
    // 1. Validate agent exists
    const agentExists = await client.agent.exists({ name: args.agent })
    if (!agentExists) {
      throw new Error(`Agent ${args.agent} does not exist`)
    }
    
    // 2. Create child session
    const delegation = await createSdkChildSessionStarter(client, {
      parentSessionId: toolContext.sessionID,
      agent: args.agent,
      prompt: args.prompt,
      context: args.context,
    })
    
    // 3. Return delegation ID (WaiterModel)
    return { delegationId: delegation.id, status: "dispatched" }
  }
})
```

### Example 2: Agent Profile (P24.2)

```yaml
# .opencode/agents/hm-l2-researcher/AGENT.md
agent:
  name: "hm-l2-researcher"
  description: "Research phase technical domain and document findings"
  tools:
    - delegate-task  # Only delegates, never implements
  instructions: |
    You are the hm-l2-researcher subagent. You CANNOT implement work yourself.
    
    Your workflow:
    1. Load hm-l3-research-chain skill
    2. Delegate to hm-detective for codebase scan
    3. Delegate to hm-deep-research for evidence gathering
    4. Delegate to hm-synthesis for compression
    5. Return structured report to orchestrator
    
    Research phases:
    - Codebase detection (SCAN/READ/DEEP modes)
    - Documentation lookup (Context7, DeepWiki, GitHub)
    - Pattern classification (GSD, OMO, Hivemind patterns)
    - Artifact synthesis (research → decisions → plans)
    
    Never use `task` tool. Always `delegate-task` to specialist agents.

skills:
  - hm-l3-research-chain  # Orchestrates research pipeline
  - hm-l3-detective       # Codebase investigation
  - hm-l3-synthesis       # Artifact compression
  - hm-l2-brainstorm      # Initial requirements gathering
```

### Example 3: Command Registration (P24.3)

```typescript
// .opencode/commands/hm-init-project/hm-init-project.ts
import { executeSlashCommand } from "@opencode-ai/plugin/commands"
import { execute } from "../execute.js"

const command = {
  name: "hm-init-project",
  description: "Initialize a new Hivemind project with standard scaffolding",
  subtask: false,
  agent: "hm-init-project",
  async execute(args, toolContext) {
    // Implementation delegates to subagent
    return execute({
      command: "hm-init-project",
      arguments: JSON.stringify(args),
      agent: "hm-init-project",
    })
  }
}

executeSlashCommand(command)
```

### Example 4: Governance Session Tool (P24.3.1)

```typescript
// src/tools/governance/create-governance-session.ts
import { tool } from "@opencode-ai/plugin/tool"
import { createSdkChildSessionStarter } from "../delegation/sdk-child-session-starter.js"

export const createGovernanceSessionTool = tool({
  description: "Create a named governance session for workflow authorization",
  args: {
    workflow: tool.schema.string().describe("Workflow identifier (e.g., 'audit', 'gate')"),
    context: tool.schema.string().describe("Meaningful context for the session title"),
    systemPrompt: tool.schema.string().describe("System prompt to inject"),
  },
  async execute(args, toolContext) {
    const client = toolContext.client
    
    // 1. Create session with title prefix
    const session = await createSdkChildSessionStarter(client, {
      parentSessionId: toolContext.sessionID,
      agent: "hm-governance",
      prompt: args.systemPrompt,
    })
    
    // 2. Inject governance prompt
    // (Already handled in createSdkChildSessionStarter via systemPrompt)
    
    // 3. Return session ID
    return {
      sessionId: session.id,
      title: `hm-governance:${args.workflow}-${args.context}`,
      status: "created"
    }
  }
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic DelegationManager | WaiterModel + CompletionDetector + ConcurrencyQueue | P24 | Clear separation of concerns, testable modules |
| Agent profiles with tools | Agent profiles without tools (delegate only) | P24.2 | Profiles focus on orchestration, skills implement |
| Ad-hoc session creation | createSdkChildSessionStarter pattern | P24.3.1 | Consistent session lifecycle management |
| Mixed commands + workflows | Namespace routers (6 types) | P24.3 | Clear command boundaries, easier discovery |

**Deprecated/outdated:**
- **GSD Phase 23 research:** All invalidated (old repo). Must re-validate from open-gsd/get-shit-done-redux.
- **Looping logic in agent profiles:** Removed P24.2. Use hm-l2-phase-loop skill instead.
- **Custom task queue:** Use WaiterModel + concurrency queue from SDK.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | P24.3.1 Governance Session is 70% complete (L2) | P24.3.1 section | L1 UAT might reveal gaps in session lifecycle integration |
| A2 | All phases in P24 cluster are greenfield | Runtime State Inventory section | May miss existing runtime state (cached sessions, pending delegations) |
| A3 | No new npm packages needed | Package Legitimacy Audit section | May miss dependency for features not yet identified |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **What is the exact scope of "Wave 6" runtime gap?**
   - What we know: DelegationManager needs decomposition, Auto-loop + ralph-loop need chaining fix
   - What's unclear: Specific runtime failures being addressed, which SDK methods are affected
   - Recommendation: Check Phase 24.0-24.6 requirements docs for Wave 6 details

2. **Does open-gsd/get-shit-done-redux have different command patterns?**
   - What we know: Task says all GSD research is invalidated
   - What's unclear: Exact differences between old and new patterns
   - Recommendation: Fork open-gsd/get-shit-done-redux, compare `.opencode/commands/` structure

3. **What is the L1 UAT requirement for P24.3.1?**
   - What we know: L2 evidence complete, L1 pending
   - What's unclear: What specific runtime tests need to pass
   - Recommendation: Read P24.3.1-LIVE-UAT.md for test cases

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >= 20 | Plugin runtime | ✓ | 20.x | — |
| npm >= 10 | Package management | ✓ | 10.x | — |
| @opencode-ai/plugin | Tool registration, hooks | ✓ | ^1.14.44 | — |
| @opencode-ai/sdk | Session API, TUI API | ✓ | ^1.x | — |
| OpenCode CLI | Command execution | ✓ | — | Manual execution |

**Missing dependencies with no fallback:** None  
**Missing dependencies with fallback:** None

---

## Validation Architecture

**workflow.nyquist_validation:** true (from `.planning/config.json`)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^1.x |
| Config file | `vitest.config.ts` (in project root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CP-DT-01 | DelegationManager decomposition | unit | `npx vitest run tests/coordination/delegation/` | ❌ Wave 0 |
| P24.1 | Agent hierarchy restructure | unit | `npx vitest run tests/agents/` | ❌ Wave 0 |
| P24.2 | Agent profile quality | unit | `npx vitest run tests/agents/profiles/` | ❌ Wave 0 |
| P24.3 | Command namespace routers | unit | `npx vitest run tests/commands/` | ❌ Wave 0 |
| P24.3.1 | Governance session creation | integration | `npx vitest run tests/governance/` | ❌ Wave 0 |
| P24.4 | Reference templates | unit | `npx vitest run tests/references/` | ❌ Wave 0 |
| P24.5 | Workflow architecture | unit | `npx vitest run tests/workflows/` | ❌ Wave 0 |
| P24.6 | HM-* commands | integration | `npx vitest run tests/commands/hm-*/` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run --reporter=verbose`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/coordination/delegation/` — DelegationManager decomposition tests
- [ ] `tests/agents/` — Agent hierarchy and profile tests
- [ ] `tests/commands/` — Command namespace router tests
- [ ] `tests/governance/` — Governance session creation tests
- [ ] `tests/references/` — Reference template validation tests
- [ ] `tests/workflows/` — Workflow architecture tests
- [ ] Framework install: `npm install` — if not already done

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

---

## Security Domain

**security_enforcement:** false (not applicable for this phase)

---

## Sources

### Primary (HIGH confidence)
- `anomalyco/opencode` — Plugin SDK documentation via DeepWiki
- `src/coordination/delegation/sdk-child-session-starter.ts` — Existing session creation pattern
- P24.3.1 research artifacts (`.planning/phases/24.3.1-governance-session-prototype/`)

### Secondary (MEDIUM confidence)
- GSD framework patterns (from `.hivefiver-meta-builder/` skills)
- OpenCode platform reference (from `opencode-platform-reference` skill)

### Tertiary (LOW confidence)
- Assumed patterns from training data (see Assumptions Log)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: MEDIUM — mostly known from project context, versions need npm verify
- Architecture: MEDIUM — patterns well-understood but specific implementations need code review
- Pitfalls: HIGH — based on common delegation patterns across projects

**Research date:** 2026-05-26  
**Valid until:** 2026-06-26 (30 days — stable architecture)

---

## RESEARCH COMPLETE

**Phase:** 24 — Coordination Dispatch + Delegate-Task Fix  
**Confidence:** MEDIUM

### Key Findings
1. **P24.3.1 is 70% complete** (L2 evidence) — L1 UAT pending for full validation
2. **All GSD Phase 23 research is INVALIDATED** — must re-validate from open-gsd/get-shit-done-redux
3. **Phase ordering critical:** P24 → P24.1 → P24.2 → P24.3 → P24.3.1 → P24.4 → P24.5 → P24.6
4. **Arch-src distinction matters:** P24.1-P24.2 (`.opencode/`) vs P24.3-P24.6 (`src/` + `.opencode/`)

### File Created
`.planning/phases/24-coordination-dispatch-delegate-task-fix/24-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | MEDIUM | Known from project context, versions need npm verify |
| Architecture | MEDIUM | Patterns well-understood, implementations need code review |
| Pitfalls | HIGH | Based on common delegation patterns, well-documented |

### Open Questions
1. Exact scope of "Wave 6" runtime gap
2. Differences between old GSD and open-gsd/get-shit-done-redux patterns
3. L1 UAT requirements for P24.3.1 governance session

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
