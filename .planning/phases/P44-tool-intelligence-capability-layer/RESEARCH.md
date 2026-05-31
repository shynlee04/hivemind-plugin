# Phase P44: Tool Intelligence & Capability Layer - Research

**Researched:** 2026-05-31
**Domain:** Runtime tool capability resolution and delegation permission intelligence
**Confidence:** HIGH

## Summary

Phase P44 addresses a critical gap in the Hivemind delegation pipeline: the inability to make informed decisions about which of the 25 harness-registered tools a delegated agent should receive. Currently, `spawn-request-builder.ts` resolves tool permissions using only 7 OpenCode built-in tools (`WRITE_CAPABLE_TOOLS`) and name-based heuristics (`REVIEW_MARKERS`), leaving **14 of 25 harness tools completely invisible** at the delegation boundary. The governance engine (`evaluateGovernance()`) has no concept of tool capabilities, and the tool guard hooks cannot make capability-informed blocking decisions.

**Primary recommendation:** Introduce a lightweight `ToolCapabilityMap` in `src/features/capability-gate/` that classifies all 25 harness tools into capability categories (read, write, delegate, govern, config, session), and wire it into the existing `resolveDelegationPermissionProfile()` flow and `tool-guard-hooks.ts` evaluation path. No external dependencies required.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool capability classification | API / Backend (src/features/) | — | Pure TypeScript logic, no UI or storage concerns |
| Delegation permission resolution | API / Backend (src/coordination/spawner/) | — | Already owns `resolveDelegationPermissionProfile()` |
| Runtime tool gating | API / Backend (src/hooks/guards/) | — | Already owns `tool.execute.before` guard |
| Agent frontmatter migration | Config (.opencode/agents/) | — | Static YAML metadata in agent primitives |
| Governance rule enhancement | API / Backend (src/features/governance-engine/) | — | Already owns `evaluateGovernance()` |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-P44-01 | Introduce `ToolCapabilityMap` classifying all 25 harness tools | Gap analysis confirms 14/25 tools are invisible to delegation; capability classification enables informed permission resolution |
| REQ-P44-02 | Wire capability map into `resolveDelegationPermissionProfile()` | `spawn-request-builder.ts:73-85` currently uses only 7 OpenCode built-ins; `toolsFromAgentMetadata()` only filters `WRITE_CAPABLE_TOOLS` set |
| REQ-P44-03 | Add capability-aware evaluation to tool guard hooks | `tool-guard-hooks.ts` calls `evaluateGovernance()` which has zero capability awareness — cannot make informed block/warn decisions for 14 orphaned tools |
| REQ-P44-04 | Agent frontmatter `tools:` field migration | All 31 `hm-*` agents declare `permission:` but none declare `tools:`; `ValidatedAgent.tools` field exists (line 12) but is never populated |
| REQ-P44-05 | Spec document errata corrections | SPEC references wrong paths: `src/coordination/delegation/spawn-request-builder.ts` → actual `src/coordination/spawner/`, `src/hooks/transforms/` → actual `src/hooks/guards/` |
| REQ-P44-06 | Backward compatibility verification | All changes must preserve existing delegation behavior; default tool set for agents without `tools:` field must remain `WRITE_CAPABLE_TOOLS` or `READ_ONLY_TOOLS` as today |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x (tsconfig) | Language | Project standard, strict mode |
| Vitest | 3.x | Testing | Project test framework |
| Zod | 3.x | Schema validation | Used in `schema-kernel/` for config schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@opencode-ai/plugin` | >= 1.1.0 | Plugin SDK | Tool registration signatures in `plugin.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static capability map | Dynamic capability registry with event sourcing | Over-engineered for 25 tools; static map is sufficient and matches project's "no external deps" constraint |
| Agent frontmatter `tools:` field | Runtime capability inference from `permission:` block | `permission:` block already exists but maps to OpenCode built-ins, not harness tools; explicit `tools:` is cleaner |

**Installation:**
```bash
# No new packages required — pure TypeScript
```

**Version verification:**
```bash
npm view typescript version          # Confirmed in tsconfig.json
npm view vitest version              # Confirmed in package.json
npm view zod version                 # Confirmed in package.json
```

## Package Legitimacy Audit

> No new packages introduced in this phase. All implementation uses existing project dependencies.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Agent Frontmatter (.opencode/agents/hm-*.md)
  │
  │ tools: + permission: fields
  ▼
Agent Resolver (src/coordination/delegation/agent-resolver.ts)
  │
  │ ValidatedAgent { tools?: Record<string, boolean>, permission?: ... }
  ▼
Spawn Request Builder (src/coordination/spawner/spawn-request-builder.ts)
  │                                          │
  │ resolveDelegationPermissionProfile()     │ toolsFromAgentMetadata()
  │                                          │
  ▼                                          ▼
ToolCapabilityMap (NEW)              WRITE_CAPABLE_TOOLS (existing, 7 tools)
  │                                          │
  │ Classifies 25 harness tools              │ Filters by agent.tools / agent.permission
  │ into capability categories               │
  ▼                                          ▼
DelegationSpawnRequest.permissionProfile     │
  │ { mode, tools }                          │
  ▼                                          │
DelegationManager.dispatch()                 │
  │                                          │
  ▼                                          │
Child Session (with bounded tool set)        │
                                             │
Tool Guard Hooks (src/hooks/guards/)         │
  │                                          │
  │ tool.execute.before                      │
  ▼                                          │
GovernanceEngine.evaluateGovernance()        │
  │ + ToolCapabilityMap (NEW)                │
  ▼                                          │
{ blocked, warnings, escalations }           │
```

### Recommended Project Structure
```
src/features/capability-gate/
├── index.ts              # Public API: getToolCapabilityMap(), classifyTool()
├── capability-map.ts     # ToolCapabilityMap class with 25 tool classifications
└── types.ts              # ToolCategory enum, ToolCapabilityRecord type

tests/features/capability-gate/
├── capability-map.test.ts    # Unit tests for classification
└── integration.test.ts       # Integration with spawn-request-builder
```

### Pattern 1: Static Tool Capability Classification
**What:** A frozen map of all 25 harness-registered tools to capability categories.
**When to use:** At delegation resolution time and governance evaluation time.
**Example:**
```typescript
// Source: [VERIFIED: plugin.ts tool registrations + codebase grep]
enum ToolCategory {
  Read = "read",
  Write = "write",
  Delegate = "delegate",
  Govern = "govern",
  Config = "config",
  Session = "session",
}

const TOOL_CAPABILITY_MAP: ReadonlyMap<string, ToolCategory> = new Map([
  // Read tools
  ["read", ToolCategory.Read],
  ["glob", ToolCategory.Read],
  ["grep", ToolCategory.Read],
  ["hivemind-doc", ToolCategory.Read],

  // Write tools
  ["edit", ToolCategory.Write],
  ["write", ToolCategory.Write],
  ["bash", ToolCategory.Write],

  // Delegate tools
  ["delegate-task", ToolCategory.Delegate],
  ["delegation-status", ToolCategory.Delegate],
  ["run-background-command", ToolCategory.Delegate],
  ["execute-slash-command", ToolCategory.Delegate],

  // Govern tools
  ["hivemind-pressure", ToolCategory.Govern],
  ["hivemind-trajectory", ToolCategory.Govern],
  ["hivemind-session-view", ToolCategory.Govern],
  ["hivemind-command-engine", ToolCategory.Govern],
  ["create-governance-session", ToolCategory.Govern],

  // Config tools
  ["configure-primitive", ToolCategory.Config],
  ["validate-restart", ToolCategory.Config],
  ["bootstrap-init", ToolCategory.Config],
  ["bootstrap-recover", ToolCategory.Config],

  // Session tools
  ["session-tracker", ToolCategory.Session],
  ["session-hierarchy", ToolCategory.Session],
  ["session-context", ToolCategory.Session],
  ["session-patch", ToolCategory.Session],
  ["session-journal-export", ToolCategory.Session],
  ["session-delegation-query", ToolCategory.Session],
  ["hivemind-agent-work-create", ToolCategory.Session],
  ["hivemind-agent-work-export", ToolCategory.Session],
  ["hivemind-sdk-supervisor", ToolCategory.Session],

  // Prompt tools
  ["prompt-skim", ToolCategory.Read],
  ["prompt-analyze", ToolCategory.Read],
])
```

### Pattern 2: Capability-Aware Permission Resolution
**What:** Extend `resolveDelegationPermissionProfile()` to consider capability categories beyond the current 7-tool `WRITE_CAPABLE_TOOLS` set.
**When to use:** When building spawn requests with agent frontmatter `tools:` declarations.
**Example:**
```typescript
// Source: [VERIFIED: spawn-request-builder.ts existing flow + SPEC REQ-P44-02]
function resolveWithCapabilities(
  params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  agent?: ValidatedAgent,
): DelegationSpawnRequest["permissionProfile"] {
  // Existing flow preserved for backward compat
  const baseTools = toolsFromAgentMetadata(agent) ?? READ_ONLY_TOOLS

  // NEW: If agent declares tools: field, merge harness tools by capability
  if (agent?.tools) {
    const harnessTools = Object.entries(agent.tools)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
      .filter((name) => TOOL_CAPABILITY_MAP.has(name))
    return { mode: deriveMode([...baseTools, ...harnessTools]), tools: [...baseTools, ...harnessTools] }
  }

  return resolveDelegationPermissionProfile(params, agent) // existing fallback
}
```

### Anti-Patterns to Avoid
- **Hardcoding tool lists in multiple places:** The current `WRITE_CAPABLE_TOOLS` / `READ_ONLY_TOOLS` arrays in `spawn-request-builder.ts` are the only source of truth. Any new capability map MUST replace these, not duplicate them.
- **Breaking existing delegation behavior:** Agents without `tools:` field MUST continue to get the same tool set as today. The capability map is additive, not replacement.
- **Runtime capability discovery:** Do not build a dynamic registry that discovers tools at runtime. The 25 tools are static, known at compile time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool category classification | Custom capability inference engine | Static `ToolCapabilityMap` with frozen entries | 25 tools, unchanging — inference is over-engineering |
| Permission profile resolution | Complex rule engine for tool access | Extend existing `resolveDelegationPermissionProfile()` | Already handles name-heuristics + permission blocks; just add capability input |
| Tool blocking decisions | New guard hook system | Extend `evaluateGovernance()` with capability context | Already has the hook point in `tool-guard-hooks.ts` |

**Key insight:** The existing codebase already has the right extension points. The gap is data (capability map), not infrastructure. Adding a new feature module is the lightest touch.

## Common Pitfalls

### Pitfall 1: Breaking Backward Compatibility
**What goes wrong:** Changing `WRITE_CAPABLE_TOOLS` or `READ_ONLY_TOOLS` constants changes tool sets for all existing delegations.
**Why it happens:** These constants are referenced in tests and production code paths.
**How to avoid:** Keep existing constants frozen. Add the capability map as an ADDITIONAL data source. The resolution function should fall back to existing behavior when `agent.tools` is absent.
**Warning signs:** Tests in `tests/lib/spawn-request-builder.test.ts` start failing.

### Pitfall 2: Over-Classifying Tools
**What goes wrong:** Creating too many capability categories (e.g., "read-session", "write-session", "govern-pressure") makes the system brittle.
**Why it happens:** Desire for fine-grained control leads to category explosion.
**How to avoid:** Use 5-6 broad categories. The goal is informed delegation, not micro-management. Agents can still be denied specific tools via `permission:` blocks.
**Warning signs:** Category count exceeds 8.

### Pitfall 3: Duplicating Tool Lists
**What goes wrong:** Maintaining tool lists in `WRITE_CAPABLE_TOOLS`, `READ_ONLY_TOOLS`, AND the new `ToolCapabilityMap` creates drift risk.
**Why it happens:** Incremental addition without refactoring existing constants.
**How to avoid:** Derive `WRITE_CAPABLE_TOOLS` and `READ_ONLY_TOOLS` from the capability map. Single source of truth.
**Warning signs:** Same tool appears in 3+ arrays.

### Pitfall 4: SPEC Path Errata Not Fixed
**What goes wrong:** Developer follows SPEC paths that don't exist.
**Why it happens:** SPEC was written before path verification.
**How to avoid:** Fix SPEC paths in P44-SPEC.md before implementation begins.
**Correct paths:**
- `src/coordination/delegation/spawn-request-builder.ts` → `src/coordination/spawner/spawn-request-builder.ts`
- `src/hooks/transforms/tool-guard-hooks.ts` → `src/hooks/guards/tool-guard-hooks.ts`

## Code Examples

### Current Delegation Permission Resolution (verified)
```typescript
// Source: [VERIFIED: src/coordination/spawner/spawn-request-builder.ts:73-85]
export function resolveDelegationPermissionProfile(
  params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  agent?: ValidatedAgent,
): DelegationSpawnRequest["permissionProfile"] {
  const explicitTools = agent ? toolsFromAgentMetadata(agent) : undefined
  const intentTools = isReviewOnlyTask(params, agent) ? READ_ONLY_TOOLS : undefined
  const tools = explicitTools ?? intentTools ?? READ_ONLY_TOOLS
  const writeCapable = tools.some((toolName) => WRITE_TOOLS.has(toolName))
  return {
    mode: writeCapable ? "write-capable" : (isReviewOnlyTask(params, agent) ? "review-only" : "read-only"),
    tools,
  }
}
```

### Current Tool Guard Evaluation (verified)
```typescript
// Source: [VERIFIED: src/hooks/guards/tool-guard-hooks.ts]
// Calls evaluateGovernance(toolName, sessionID, rules) → { blocked, blocks, warnings, escalations }
// No capability context passed — cannot make informed decisions for 14 orphaned tools
```

### Current DelegationManager Dispatch (verified)
```typescript
// Source: [VERIFIED: src/coordination/delegation/manager.ts:387-389]
private toDispatchParams(params: DelegateParams): DispatchParams {
  return {
    agent: params.agent, currentDepth: 0,
    parentSessionId: params.parentSessionId, prompt: params.prompt,
    queueKey: `agent:${params.agent}`, surface: "agent-delegation",
    workingDirectory: params.workingDirectory
  }
  // NOTE: No capability/tool info carried forward — only resolved at spawn-request-builder level
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Name-heuristic tool resolution (7 tools) | Will become capability-map resolution (25+ tools) | This phase | Agents gain access to harness-specific tools during delegation |
| Agent `permission:` only | Will add `tools:` field to frontmatter | This phase | Explicit tool opt-in replaces implicit name matching |
| `evaluateGovernance()` rule-based only | Will receive capability context | This phase | Governance engine can make informed block/warn decisions |

**Deprecated/outdated:**
- `REVIEW_MARKERS` name heuristic: Works for simple cases but cannot distinguish between agents that should vs shouldn't have delegate/govern tools. The capability map replaces this with explicit declarations.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 25 harness tools is the complete set — no tools are registered outside `plugin.ts` | Standard Stack | Tool would be invisible to capability map |
| A2 | `ValidatedAgent.tools` field (line 12 of spawn-request-builder.ts) is the intended extension point for agent tool declarations | Architecture Patterns | If wrong, need different extension mechanism |
| A3 | Static capability classification is sufficient — no runtime capability discovery needed | Don't Hand-Roll | If wrong, need dynamic registry (significant scope increase) |
| A4 | The 14 orphaned tools don't need different treatment from each other at delegation time | Gap Analysis | Some tools may need special handling (e.g., delegate-task) |

## Open Questions

1. **Should `delegate-task` and `delegation-status` be available to child sessions?**
   - What we know: These tools allow recursive delegation — a child can spawn its own children
   - What's unclear: Whether the SPEC intends to restrict recursive delegation capability
   - Recommendation: Default to denying delegate tools in child sessions unless explicitly enabled in frontmatter

2. **Should the capability map live in `src/features/capability-gate/` or `src/shared/`?**
   - What we know: Feature modules are the standard pattern for new runtime capabilities
   - What's unclear: Whether capability classification is "shared enough" to warrant leaf module placement
   - Recommendation: `src/features/capability-gate/` — it's a runtime feature, not a shared utility

3. **How many agents need `tools:` migration in this phase vs future phases?**
   - What we know: 10 of 25 harness tools already appear in some agent frontmatter `permission:` blocks
   - What's unclear: Whether all 31 agents need explicit `tools:` or just a subset
   - Recommendation: Migrate all 31 agents to declare `tools:` — it's mechanical, low-risk, and prevents future drift

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | 20+ | — |
| TypeScript | Compilation | ✓ | 5.x | — |
| Vitest | Testing | ✓ | 3.x | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/features/capability-gate/ -t "capability" --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P44-01 | ToolCapabilityMap classifies all 25 harness tools | unit | `npx vitest run tests/features/capability-gate/capability-map.test.ts -t "classifies"` | ❌ Wave 0 |
| REQ-P44-02 | resolveDelegationPermissionProfile uses capability map | unit | `npx vitest run tests/features/capability-gate/integration.test.ts -t "permission"` | ❌ Wave 0 |
| REQ-P44-03 | Tool guard hooks receive capability context | unit | `npx vitest run tests/features/capability-gate/integration.test.ts -t "guard"` | ❌ Wave 0 |
| REQ-P44-04 | Agent frontmatter `tools:` field parsed correctly | unit | `npx vitest run tests/features/capability-gate/capability-map.test.ts -t "frontmatter"` | ❌ Wave 0 |
| REQ-P44-05 | SPEC path corrections applied | manual-only | N/A — document review | N/A |
| REQ-P44-06 | Backward compatibility preserved | integration | `npm test` (full suite regression) | ✅ Existing |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/features/capability-gate/ --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/features/capability-gate/capability-map.test.ts` — covers REQ-P44-01, REQ-P44-04
- [ ] `tests/features/capability-gate/integration.test.ts` — covers REQ-P44-02, REQ-P44-03
- [ ] `src/features/capability-gate/` directory — new feature module

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | Capability map enforces least-privilege tool access at delegation boundary |
| V5 Input Validation | yes | Zod schema validation for tool names in capability map |
| V6 Cryptography | no | — |

### Known Threat Patterns for TypeScript Plugin Systems

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation via tool access | Elevation of privilege | Capability map restricts child sessions to declared tools |
| Recursive delegation via delegate-task | Denial of service | Default deny delegate tools in child sessions |
| Tool name injection | Tampering | Frozen Map<string, ToolCategory> rejects unknown tools |

## Sources

### Primary (HIGH confidence)
- `src/plugin.ts` — verified all 25 tool registrations via `grep -E '"[a-z].*":\s+create'`
- `src/coordination/spawner/spawn-request-builder.ts` — verified WRITE_CAPABLE_TOOLS, READ_ONLY_TOOLS, REVIEW_MARKERS, resolveDelegationPermissionProfile()
- `src/hooks/guards/tool-guard-hooks.ts` — verified tool.execute.before guard, evaluateGovernance() call
- `src/coordination/delegation/manager.ts` — verified DelegationManager facade, toDispatchParams() (no capability info carried)
- `.opencode/agents/hm-*.md` — verified all 31 agents lack `tools:` field, verified 10 harness tools appear in `permission:` blocks

### Secondary (MEDIUM confidence)
- `.planning/research/tool-intelligence-patterns-research-2026-05-31.md` — external research on hybrid event-sourced capability model
- `.hivemind/audits/tool-lifecycle-wiring-audit-2026-05-31.md` — tool lifecycle wiring audit

### Tertiary (LOW confidence)
- None — all findings verified against source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and tsconfig.json
- Architecture: HIGH — verified against source code in all relevant modules
- Pitfalls: HIGH — derived from actual codebase gaps, not theoretical concerns
- Orphaned tool set: HIGH — cross-referenced via grep against all 31 agent frontmatter files

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable — tool registrations change infrequently)

## Appendix: Orphaned Tool Audit

### Tools Covered by Agent Frontmatter `permission:` (11 tools)
| Tool | Agent(s) Referencing It |
|------|------------------------|
| delegate-task | Multiple (via task/permission blocks) |
| delegation-status | Multiple (via task/permission blocks) |
| hivemind-command-engine | 1 agent |
| hivemind-doc | 1 agent |
| hivemind-pressure | 1 agent |
| hivemind-sdk-supervisor | 1 agent |
| hivemind-trajectory | 1 agent |
| prompt-analyze | 1 agent |
| prompt-skim | 1 agent |
| session-journal-export | 1 agent |
| session-patch | 1 agent |
| session-tracker | 2 agents |

### Orphaned Tools (14 tools — NOT in any agent frontmatter)
| Tool | Plugin.ts Domain | Capability Category |
|------|-----------------|---------------------|
| bootstrap-init | Config | Config |
| bootstrap-recover | Config | Config |
| configure-primitive | Config | Config |
| create-governance-session | Session | Govern |
| execute-slash-command | Session | Delegate |
| hivemind-agent-work-create | Hivemind | Session |
| hivemind-agent-work-export | Hivemind | Session |
| hivemind-session-view | Hivemind | Govern |
| run-background-command | Delegation | Delegate |
| session-context | Session | Session |
| session-delegation-query | Session | Session |
| session-hierarchy | Session | Session |
| validate-restart | Config | Config |

### Tools Covered by WRITE_CAPABLE_TOOLS (7 OpenCode built-ins)
| Tool | In Capability Scope |
|------|-------------------|
| read | Yes (Read) |
| edit | Yes (Write) |
| write | Yes (Write) |
| bash | Yes (Write) |
| glob | Yes (Read) |
| grep | Yes (Read) |
| execute-slash-command | Yes (Delegate) — BUT listed as OpenCode built-in, not harness tool |

### Current Code Flow Summary

```
1. Agent frontmatter (.opencode/agents/hm-*.md)
   → 31 agents, ALL have permission: block, NONE have tools: field

2. Agent resolver (src/coordination/delegation/agent-resolver.ts)
   → Parses frontmatter into ValidatedAgent { tools?: undefined, permission?: {...} }

3. Spawn request builder (src/coordination/spawner/spawn-request-builder.ts)
   → resolveDelegationPermissionProfile() checks:
     a. agent.tools → NEVER populated → undefined
     b. agent.permission → filters against WRITE_CAPABLE_TOOLS (7 tools only)
     c. REVIEW_MARKERS heuristic → checks agent name for "review", "audit", etc.
   → Returns { mode: "write-capable"|"review-only"|"read-only", tools: [...] }
   → Result: ONLY 7 OpenCode built-in tools considered; 14 harness tools invisible

4. Delegation manager (src/coordination/delegation/manager.ts)
   → toDispatchParams() carries NO tool/capability info
   → All resolution happens at spawn-request-builder level

5. Tool guard hooks (src/hooks/guards/tool-guard-hooks.ts)
   → evaluateGovernance() has zero capability context
   → Cannot make informed decisions for 14 orphaned harness tools

GAP: No code path connects harness tool registrations (plugin.ts) to delegation resolution (spawn-request-builder.ts)
```
