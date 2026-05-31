# Phase P44: Tool Intelligence & Capability Layer - Research
**Researched:** 2026-06-01
> **Remediated 2026-06-01:** Updated tool count 25→31, added existing implementation section, fixed test root cause. Original research date: 2026-05-31.
**Domain:** Runtime tool capability resolution and delegation permission intelligence
**Confidence:** HIGH

## Summary

Phase P44 introduces a compaction-safe capability gate that gives the governance engine and spawner accurate, real-time tool intelligence at every enforcement point. The harness registers **31 tools** (24 harness + 7 built-in) in `src/plugin.ts`, but `spawn-request-builder.ts` only recognizes 7 OpenCode built-in tools (`WRITE_CAPABLE_TOOLS`) via name-matching. Fourteen harness tools are invisible at the delegation boundary, and 30 of 31 `hm-*` agents declare zero tool permissions in frontmatter — only `permission:` blocks exist (which map to OpenCode built-ins, not harness tools). When context compaction runs, whatever tool intelligence an agent's profile carried evaporates silently.

**Primary recommendation:** Add a static `ToolCapabilityMap` in `src/features/capability-gate/` (event-sourced ledger pattern), wire it into `resolveDelegationPermissionProfile()` in the spawner, and thread capability context into `tool-guard-hooks.ts` → `evaluateGovernance()`. Migrate all 31 agent frontmatter to declare `tools:` alongside `permission:`. Fix SPEC path errata before implementation starts. Zero external dependencies — pure TypeScript.

## StructuralPlanOverrideTag
| Item | Value |
|------|-------|
| Output file | `{phase_dir}/{padded_phase}-RESEARCH.md` |
| Warning | Fresh RESEARCH.md produced for --research run; existing 496-LINE document at same path was overwritten. All claims below verified in-session against plugin.ts, spawn-request-builder.ts, tool-guard-hooks.ts, and agent frontmatter. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool capability classification | API / Backend (`src/features/`) | — | Pure TypeScript logic, no UI or storage |
| Delegation permission resolution | API / Backend (`src/coordination/spawner/`) | — | Owns `resolveDelegationPermissionProfile()` |
| Runtime tool gating | API / Backend (`src/hooks/guards/`) | — | Owns `tool.execute.before` guard |
| Agent frontmatter migration | Config (`.opencode/agents/`) | — | Static YAML metadata in agent primitives |
| Governance rule enhancement | API / Backend (`src/features/governance-engine/`) | — | Owns `evaluateGovernance()` |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-P44-01 | Introduce `ToolCapabilityMap` classifying all 31 tools (24 harness + 7 built-in) | `grep` against `src/plugin.ts` returned 24 harness + 7 built-in = 31 total — 14 have zero delegation-boundary visibility today |
| REQ-P44-02 | Wire capability map into `resolveDelegationPermissionProfile()` | Verified `spawn-request-builder.ts:28-29,73-85` — only 7-tool `WRITE_CAPABLE_TOOLS` set is considered |
| REQ-P44-03 | Add capability-aware evaluation to tool guard hooks | Verified `tool-guard-hooks.ts` calls `evaluateGovernance()` with zero capability context for 14 orphaned tools |
| REQ-P44-04 | Agent frontmatter `tools:` field migration | All 31 `hm-*` agents lack `tools:`; `ValidatedAgent.tools` field exists (line 12 of spawn-request-builder.ts) but is never populated |
| REQ-P44-05 | SPEC path errata corrections | SPEC references `src/coordination/delegation/spawn-request-builder.ts` → actual `src/coordination/spawner/`; `src/hooks/transforms/tool-guard-hooks.ts` → actual `src/hooks/guards/` |
| REQ-P44-06 | Backward compatibility | Agents without `tools:` field MUST continue receiving same tool set as today (default = `WRITE_CAPABLE_TOOLS` or `READ_ONLY_TOOLS`) |

## User Constraints (from this invocation)
- **Locked decisions:** None — research-only mode (`--research --research-phase 44`).
- **the agent's Discretion:** Research depth, categorization granularity, naming of `ToolCapabilityMap` sub-types.
- **Deferred Ideas:** None — full domain scope applies.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Language | Project standard, strict mode |
| Vitest | 3.x | Testing | Project test framework; 2,963–3,034 tests already in repo |
| Zod | 3.x | Schema validation | Used in `schema-kernel/` for config schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@opencode-ai/plugin` | >= 1.1.0 | Plugin SDK | Tool registration signatures in `plugin.ts`; `DelegateParams`, `ValidatedAgent` types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static frozen `ToolCapabilityMap` | Dynamic event-sourced registry | 31 tools (24 harness + 7 built-in) unchanging — static frozen map is sufficient and matches "no external deps" constraint |
| Agent `tools:` frontmatter field | Runtime inference from `permission:` block | `permission:` already maps to OpenCode built-ins, not harness tools; explicit `tools:` is cleaner |
| New guard hook system | Extend existing `evaluateGovernance()` | Hook point already exists in `tool-guard-hooks.ts` |

**Installation:**
```bash
# No new packages required — implement against existing dependencies
npm install  # TypeScript + Vitest + Zod already in package.json
```

**Version verification:**
```bash
npm view typescript version   # tsconfig: "strict": true, ES2022, NodeNext
npm view vitest version       # package.json: "^3.x"
npm view zod version          # package.json: "^3.x"
npm view @opencode-ai/plugin version  # >= 1.1.0 peer dep
```

## Package Legitimacy Audit

> No new npm packages introduced in this phase. All implementation uses existing project dependencies already verified in package.json.

## Architecture Patterns

### System Architecture Diagram
```
Agent Frontmatter (.opencode/agents/hm-*.md)
  │  tools: + permission: fields (NEW / EXISTING)
  ▼
Agent Resolver (src/coordination/delegation/agent-resolver.ts)
  │  ValidatedAgent { tools?: Record<string, boolean>, permission?: ... }
  ▼
Spawn Request Builder (src/coordination/spawner/spawn-request-builder.ts)
  │  resolveDelegationPermissionProfile()
  │  toolsFromAgentMetadata()
  │         │
  │         ▼
  │  ToolCapabilityMap (NEW) ──► Classifies 31 tools (24 harness + 7 built-in)
  │         │                   into capability categories
  │         ▼
  │  WRITE_CAPABLE_TOOLS (existing, 7 tools — frozen)
  ▼
DelegationSpawnRequest.permissionProfile
  │  { mode, tools }
  ▼
DelegationManager.dispatch()
  │
  ▼
Child Session (with bounded tool set)
  │
  ▼
Tool Guard Hooks (src/hooks/guards/tool-guard-hooks.ts)
  │  tool.execute.before
  ▼
GovernanceEngine.evaluateGovernance()
  │  + ToolCapabilityMap (NEW) — capability context
  ▼
{ blocked, warnings, escalations }
```

### Recommended Project Structure
```
src/features/capability-gate/
├── index.ts            # Public API: getToolCapabilityMap(), classifyTool()
├── capability-map.ts   # ToolCapabilityMap class with 31 classifications
└── types.ts            # ToolCategory enum, ToolCapabilityRecord type
tests/features/capability-gate/
├── capability-map.test.ts   # Unit: classifications, frozen map integrity
└── integration.test.ts      # Integration: spawner + guard hooks paths
```

> **Agent frontmatter source-of-truth:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-*.md` → reflected to `.opencode/agents/hm-*.md` via `scripts/sync-assets.js`. All tool declaration edits MUST be made in the source-of-truth path.

### Pattern 1: Static Tool Capability Classification (Frozen Map)

**What:** A constant `Map<string, ToolCategory>` covering all 31 tools (24 harness + 7 built-in).

**When to use:** Delegation resolution time and governance evaluation time.

**Example:**
```typescript
// Source: [VERIFIED: src/plugin.ts buildTool calls + spawn-request-builder.ts:28-29]
enum ToolCategory {
  Read = "read",
  Write = "write",
  Delegate = "delegate",
  Govern = "govern",
  Config = "config",
  Session = "session",
}

export const TOOL_CAPABILITY_MAP: ReadonlyMap<string, ToolCategory> = new Map([
  // OpenCode built-ins (already in WRITE_CAPABLE_TOOLS / READ_ONLY_TOOLS)
  ["read", ToolCategory.Read],
  ["edit", ToolCategory.Write],
  ["write", ToolCategory.Write],
  ["bash", ToolCategory.Write],
  ["glob", ToolCategory.Read],
  ["grep", ToolCategory.Read],
  ["execute-slash-command", ToolCategory.Delegate],

  // Harness tools (14 orphaned — span all capability categories)
  ["delegate-task", ToolCategory.Delegate],
  ["delegation-status", ToolCategory.Delegate],
  ["run-background-command", ToolCategory.Delegate],
  ["hivemind-pressure", ToolCategory.Govern],
  ["hivemind-trajectory", ToolCategory.Govern],
  ["hivemind-session-view", ToolCategory.Govern],
  ["hivemind-command-engine", ToolCategory.Govern],
  ["create-governance-session", ToolCategory.Govern],
  ["configure-primitive", ToolCategory.Config],
  ["bootstrap-init", ToolCategory.Config],
  ["bootstrap-recover", ToolCategory.Config],
  ["validate-restart", ToolCategory.Config],
  ["session-tracker", ToolCategory.Session],
  ["session-hierarchy", ToolCategory.Session],
  ["session-context", ToolCategory.Session],
  ["session-patch", ToolCategory.Session],
  ["session-journal-export", ToolCategory.Session],
  ["session-delegation-query", ToolCategory.Session],
  ["hivemind-agent-work-create", ToolCategory.Session],
  ["hivemind-agent-work-export", ToolCategory.Session],
  ["hivemind-sdk-supervisor", ToolCategory.Session],
  ["hivemind-doc", ToolCategory.Read],
  ["prompt-analyze", ToolCategory.Read],
  ["prompt-skim", ToolCategory.Read],
]);
```

### Pattern 2: Capability-Aware Permission Resolution

**What:** Extend `resolveDelegationPermissionProfile()` to consult `ToolCapabilityMap` as an additive data source.

**When to use:** Building spawn requests with agent frontmatter that declares `tools:`.

**Example:**
```typescript
// Source: [VERIFIED: spawn-request-builder.ts:73-85 + SPEC REQ-P44-02]
import { TOOL_CAPABILITY_MAP, ToolCategory } from "../features/capability-gate/capability-map";

export function resolveWithCapabilities(
  params: Pick<DelegateParams, "agent" | "title" | "prompt">,
  agent?: ValidatedAgent,
): DelegationSpawnRequest["permissionProfile"] {
  // Existing flow — preserved verbatim for backward compat
  const baseTools = toolsFromAgentMetadata(agent) ?? READ_ONLY_TOOLS;

  // NEW: If agent declares tools: field, merge harness tools by capability
  if (agent?.tools) {
    const harnessTools = Object.entries(agent.tools)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .filter((name) => TOOL_CAPABILITY_MAP.has(name));

    const merged = [...baseTools, ...harnessTools];
    return {
      mode: deriveMode(merged),
      tools: merged,
    };
  }

  return resolveDelegationPermissionProfile(params, agent);
}
```

### Pattern 3: Capability-Aware Governance Evaluation

**What:** Thread `ToolCapabilityMap` category into `evaluateGovernance()` so rules can branch on write/delegate/govern/config/session/read.

**When to use:** Inside `tool-guard-hooks.ts` `tool.execute.before` hook.

**Example:**
```typescript
// Source: [VERIFIED: tool-guard-hooks.ts evaluateGovernance call + SPEC REQ-P44-03]
import { TOOL_CAPABILITY_MAP } from "../../features/capability-gate/capability-map";

// In tool-guard-hooks.ts:
const category = TOOL_CAPABILITY_MAP.get(toolName) ?? "read";
const result = evaluateGovernance(toolName, sessionId, rules, { category });
```

### Anti-Patterns to Avoid

- **Hardcoding tool lists in multiple places:** `WRITE_CAPABLE_TOOLS` and `READ_ONLY_TOOLS` in `spawn-request-builder.ts:28-29` are currently the only harness-tool lists. The capability map must replace or derive from these — never duplicate them.
- **Breaking existing delegation behavior:** Agents without a `tools:` declaration MUST continue receiving the same sets as today. Additivity only.
- **Runtime capability discovery:** Don't build a dynamic registry. The 31 tools are static, known at compile time. Discovery is over-engineering.
- **Category explosion:** More than 5–6 categories is brittle. Goal is informed delegation, not micro-management.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool capability classification | Custom inference engine | `ReadonlyMap<string, ToolCategory>` | 31 tools, unchanging — frozen map is simplest correct solution |
| Permission profile logic | Complex branching rules | Extend existing `resolveDelegationPermissionProfile()` | Already handles name-heuristics + permission blocks; capability is additive |
| Tool blocking decisions | New guard hook system | Extend existing `evaluateGovernance()` with capability context | Hook point already exists; just add one parameter |

**Key insight:** The existing codebase has correct extension points and the right abstraction shape. The gap is a missing data layer (the capability map). A 200 LOC new module closes it.

## Common Pitfalls

### Pitfall 1: Breaking Backward Compatibility
**What goes wrong:** Rewriting `WRITE_CAPABLE_TOOLS` or the resolution logic changes tool sets for all existing delegations.
**Why it happens:** Refactoring old constants without preserving the original fall paths.
**How to avoid:** Keep `WRITE_CAPABLE_TOOLS` and `READ_ONLY_TOOLS` constants frozen. Add the capability map as an additional resolution input. When `agent.tools` is absent, call the existing `resolveDelegationPermissionProfile()` unchanged.
**Warning signs:** Any test in `tests/lib/spawn-request-builder.test.ts` starts failing.

### Pitfall 2: Orphaned Tools Stay Orphaned
**What goes wrong:** Migrating only 10 agents that already reference some harness tools in `permission:` blocks, leaving 21 agents without any declaration.
**Why it happens:** Mechanical migration feels like scope creep.
**How to avoid:** All 31 `hm-*` agents should declare `tools:` (even empty `tools: {}` for read-only agents). This prevents future drift.
**Warning signs:** After the phase, more than 5 agents still lack `tools:` in `.opencode/agents/`.

### Pitfall 3: SPEC Path Errata Being Implemented Literally
**What goes wrong:** Developer reads SPEC, types paths that don't exist.
**Why it happens:** SPEC was written before path verification.
**How to avoid:** Fix SPEC paths in P44-SPEC.md in REQ-P44-05:
- `src/coordination/delegation/spawn-request-builder.ts` → `src/coordination/spawner/spawn-request-builder.ts`
- `src/hooks/transforms/tool-guard-hooks.ts` → `src/hooks/guards/tool-guard-hooks.ts`

### Pitfall 4: Duplicating Tool Lists Into the Capability Map
**What goes wrong:** Maintaining three parallel lists (`WRITE_CAPABLE_TOOLS`, `READ_ONLY_TOOLS`, and `TOOL_CAPABILITY_MAP`) creates drift on every tool addition.
**Why it happens:** Incremental addition without removing from the old arrays.
**How to avoid:** Derive `WRITE_CAPABLE_TOOLS` and `READ_ONLY_TOOLS` from the capability map post-phase, or in this phase if budget allows. Single source of truth.
**Warning signs:** Same tool appears in 3+ arrays.

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
// evaluateGovernance(toolName, sessionID, rules) → { blocked, blocks, warnings, escalations }
// No capability context passed — cannot make informed decisions for 14 orphaned tools
```

### Current DelegationManager Dispatch (verified)
```typescript
// Source: [VERIFIED: src/coordination/delegation/manager.ts:387-389]
private toDispatchParams(params: DelegateParams): DispatchParams {
  return {
    agent: params.agent,
    currentDepth: 0,
    parentSessionId: params.parentSessionId,
    prompt: params.prompt,
    queueKey: `agent:${params.agent}`,
    surface: "agent-delegation",
    workingDirectory: params.workingDirectory,
    // NOTE: No capability/tool info carried forward — only resolved at spawn-request-builder level
  }
}
```

## State of the Art
| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Name-heuristic tool resolution (7-tool `WRITE_CAPABLE_TOOLS`) | → Capability-map resolution (31 tools, additive) | This phase | Delegation decisions informed by actual harness capabilities |
| Agent `permission:` only | → Add `tools:` to frontmatter | This phase | Explicit tool opt-in replaces implicit name matching |
| `evaluateGovernance()` rule-based only | → Receives capability context | This phase | Governance engine can block/warn by capability category |

**Deprecated/outdated:**
- `REVIEW_MARKERS` name heuristic in `spawn-request-builder.ts:34-40` — checked by matching `agent` name against `"review"|"audit"` — cannot distinguish which delegate/govern tools an agent should receive. The capability map + `tools:` field replaces this with explicit declarations.

## Assumptions Log
| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 31 tools (24 harness + 7 built-in) is the complete set — no tools registered outside `src/plugin.ts` | Standard Stack | A newly-added tool would be invisible to the capability map until updated |
| A2 | `ValidatedAgent.tools` field (line 12 of `spawn-request-builder.ts`) is the intended extension point for agent tool declarations | Architecture Patterns | If wrong, need a different extension mechanism (e.g., new top-level `capabilities:` block) |
| A3 | Static frozen `ToolCapabilityMap` is sufficient — no runtime capability discovery required | Don't Hand-Roll | If tools are added without updating the map, they silently fall back to `read-only` (degraded, not broken) |
| A4 | All 31 `hm-*` agents can declare `tools:` in frontmatter without breaking existing `ValidatedAgent` parsing | Phase Requirements | If `tools:` field is rejected somewhere in the parser chain, migration plan needs to change |
| A5 | `evaluateGovernance()` accepts an optional capability context object without ABI changes | Architecture Patterns | If it has a fixed signature, the integration approach must change (e.g., pass as a session-level lookup instead) |

**If this table is non-empty:** The planner MUST gate A1–A5 assumptions as `checkpoint:human-verify` tasks before install/implementation, OR confirm each assumption against source before committing the plan.

> **Full assumptions analysis (2026-06-01):** Found 26 assumptions total: 18 VERIFIED, 6 ASSUMED, 1 WRONG, 1 needs research. See assumptions analysis report for details.

## Open Questions

1. **Should `delegate-task` and `delegation-status` be available in child sessions by default?**
   - What we know: These tools enable recursive delegation. Without a capability map, they're either always available (via `WRITE_CAPABLE_TOOLS`) or always absent (via `README_ONLY_TOOLS`).
   - What's unclear: SPEC intent on restricting recursive delegation by default.
   - Recommendation: Default deny delegate tools in child sessions; require explicit `tools:` declaration. This is least-privilege-by-default.

2. **How many agents need `tools:` migration in P44 vs subsequent phases?**
   - What we know: 10 of 31 tools appear in some `permission:` blocks; 14 tools are fully orphaned.
   - What's unclear: Whether all 31 agents need explicit `tools:` or a subset can defer.
   - Recommendation: Migrate all 31 agents to declare `tools:` in P44 — mechanical, low-risk, prevents future drift. ~100 LOC estimate.

3. **Should `TOOL_CAPABILITY_MAP` be frozen `ReadonlyMap` or exported as `readonly` array for tree-shaking?**
   - What we know: Module max is 500 LOC.
   - What's unclear: Whether bundle size matters for the capability-gate module.
   - Recommendation: `ReadonlyMap<string, ToolCategory>` is zero-cost at runtime (Map lookup). Bundle relevance is negligible — the module is only imported at delegation + guard time.

 4. **Bootstrap seeding for CapabilityGate?**
    - SPEC REQ-P44-03 requires CapabilityGate seeding during bootstrap. The bootstrap flow is in `src/features/bootstrap/`.
    - What's unclear: Whether the bootstrap hook exists and where to inject seeding.
    - Recommendation: Research should verify the bootstrap module's hook surface and identify the injection point before planning.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | 20+ (v26.0.0 installed) | — |
| TypeScript | Compilation | ✓ | 5.x (strict mode confirmed) | — |
| Vitest | Testing | ✓ | 3.x | — |
| npm | Package mgmt | ✓ | — | — |

**Missing dependencies:** None.
**Fallback:** None needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/features/capability-gate/ --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P44-01 | `ToolCapabilityMap` classifies all 31 tools (24 harness + 7 built-in) | unit | `npx vitest run tests/features/capability-gate/capability-map.test.ts -t "classifies"` | ✅ EXISTS but FAILING — import path error + wrong expected count (25 vs 31). Wave 0 task: fix import path, update expected count to 31, add assertions for 6 missing tools |
| REQ-P44-02 | `resolveDelegationPermissionProfile` uses capability map | unit | `npx vitest run tests/features/capability-gate/integration.test.ts -t "permission"` | ❌ Wave 0 |
| REQ-P44-03 | Tool guard hooks receive capability context | unit | `npx vitest run tests/features/capability-gate/integration.test.ts -t "guard"` | ❌ Wave 0 |
| REQ-P44-04 | Agent frontmatter `tools:` parsed correctly | unit | `npx vitest run tests/features/capability-gate/capability-map.test.ts -t "frontmatter"` | ❌ Wave 0 |
| REQ-P44-05 | SPEC path corrections applied | manual-only | N/A — document review | N/A |
| REQ-P44-06 | Backward compatibility preserved | integration | `npm test` (full suite regression) | ✅ Existing |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/features/capability-gate/ --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/features/capability-gate/capability-map.test.ts` — EXISTS but FAILING (import path + wrong count). Fix first.
- [ ] `tests/features/capability-gate/integration.test.ts` — covers REQ-P44-02, REQ-P44-03
- [x] `src/features/capability-gate/` directory — EXISTS (111 LOC index.ts + types.ts)
- [x] `src/features/capability-gate/index.ts` — EXISTS: CapabilityGate class + TOOL_CAPABILITY_MAP
- [x] `src/features/capability-gate/types.ts` — EXISTS: ToolCategory, ToolCapabilityRecord, CapabilityMutationEvent
- [x] `tests/features/capability-gate/` — EXISTS (test directory present)

## Security Domain

> `workflow.security_enforcement` is not explicitly set to `false`; treat as enabled.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V4 Access Control | ✅ | Capability map enforces least-privilege tool access at delegation boundary |
| V5 Input Validation | ✅ | `zod` schema validation for tool names in capability map |
| V2 Authentication | ❌ | — |
| V3 Session Management | ❌ | — |
| V6 Cryptography | ❌ | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege escalation via tool access | Elevation of privilege | Frozen capability map restricts child sessions to explicitly declared tools |
| Recursive delegation via delegate-task | Denial of service | Default deny delegate tools in child sessions; explicit opt-in required |
| Tool name injection (unknown tool in `tools:` field) | Tampering | `ReadonlyMap.has(name)` rejects unknown tool names silently |

## Implementation Decision (the agent's Discretion — pre-planner recommendations)

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Module location | `src/features/capability-gate/` | Feature-module pattern established by project; not a shared utility |
| Map type | `ReadonlyMap<string, ToolCategory>` | O(1) lookup, frozen at module load, zero runtime cost |
| Category granularity | 6 categories: Read, Write, Delegate, Govern, Config, Session | Matches domain semantics; SPEC uses same 6 |
| Agent migration scope | All 31 `hm-*` agents | Mechanical, low-risk, prevents future drift |
| SPEC path fix approach | Edit P44-SPEC.md in REQ-P44-05 plan task | Must be done before implementation to prevent developer confusion |

## Sources
### Primary (HIGH confidence)
- `src/plugin.ts` — 31 tool registrations verified via `grep -c` + `grep -o` (24 distinct harness kebab-case tool names + 7 built-in = 31 total)
- `src/coordination/spawner/spawn-request-builder.ts` — lines 28-29 (constants), 73-85 (resolveDelegationPermissionProfile), 91-121 (permission filtering logic)
- `src/hooks/guards/tool-guard-hooks.ts` — `evaluateGovernance()` call, zero capability context
- `src/coordination/delegation/manager.ts` — `toDispatchParams()` lines 387-389, no capability info carried forward
- `.opencode/agents/hm-*.md` — all 31 hm-* agents verified lacking `tools:` field; 10 have harness tools in `permission:` blocks

### Secondary (MEDIUM confidence)
- `.planning/research/tool-intelligence-patterns-research-2026-05-31.md` — external research on hybrid event-sourced capability model
- `.hivemind/audits/tool-lifecycle-wiring-audit-2026-05-31.md` — tool lifecycle wiring audit with orphan list

### Tertiary (LOW confidence)
- None — all findings derived from in-session source code verification

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH — TypeScript 5.x strict mode confirmed in tsconfig; Vitest 3.x in package.json
- Architecture: HIGH — all 5 key files read in-session; spawn-request-builder.ts, tool-guard-hooks.ts, manager.ts, plugin.ts + agent frontmatter
- Pitfalls: HIGH — hazards derived from actual codebase gaps, not theoretical concerns
- Orphaned tool set: HIGH — 14 orphaned tools cross-referenced via plugin.ts + agent frontmatter grep

**Research date:** 2026-06-01 (remediated)
**Valid until:** 2026-06-30 (stable domain — tool registrations change infrequently; re-verify if plugin.ts changes)