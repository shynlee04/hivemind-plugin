# Tool-to-Agent-to-Lifecycle Wiring Audit

**Date:** 2026-05-31
**Scope:** All 25 registered Hivemind harness tools — registration, hook coverage, agent assignment, spawner enforcement
**Depth:** Deep (cross-file analysis with call-chain tracing)

---

## Section 1: Tool Registration Inventory

**Source:** `src/plugin.ts:128-198` — 4 domain registration functions

### 1.1 Delegation Tools (3) — `registerDelegationTools()`

| # | Tool Name | Factory Function | Registration Line |
|---|-----------|-----------------|-------------------|
| 1 | `delegate-task` | `createDelegateTaskTool()` | `plugin.ts:130` |
| 2 | `delegation-status` | `createDelegationStatusTool()` | `plugin.ts:131` |
| 3 | `run-background-command` | `createRunBackgroundCommandTool()` | `plugin.ts:137` |

### 1.2 Session Tools (7) — `registerSessionTools()`

| # | Tool Name | Factory Function | Registration Line |
|---|-----------|-----------------|-------------------|
| 4 | `execute-slash-command` | `createExecuteSlashCommandTool()` | `plugin.ts:150` |
| 5 | `session-patch` | `createSessionPatchTool()` | `plugin.ts:151` |
| 6 | `session-journal-export` | `createSessionJournalExportTool()` | `plugin.ts:152` |
| 7 | `session-tracker` | `createSessionTrackerTool()` | `plugin.ts:153` |
| 8 | `session-hierarchy` | `createSessionHierarchyTool()` | `plugin.ts:154` |
| 9 | `session-context` | `createSessionContextTool()` | `plugin.ts:155` |
| 10 | `create-governance-session` | `createGovernanceSessionTool()` | `plugin.ts:156` |

### 1.3 Hivemind Tools (9) — `registerHivemindTools()`

| # | Tool Name | Factory Function | Registration Line |
|---|-----------|-----------------|-------------------|
| 11 | `hivemind-doc` | `createHivemindDocTool()` | `plugin.ts:170` |
| 12 | `hivemind-trajectory` | `createHivemindTrajectoryTool()` | `plugin.ts:171` |
| 13 | `hivemind-pressure` | `createHivemindPressureTool()` | `plugin.ts:172` |
| 14 | `hivemind-sdk-supervisor` | `createHivemindSdkSupervisorTool()` | `plugin.ts:173` |
| 15 | `hivemind-command-engine` | `createHivemindCommandEngineTool()` | `plugin.ts:174` |
| 16 | `hivemind-session-view` | `createHivemindSessionViewTool()` | `plugin.ts:175` |
| 17 | `hivemind-agent-work-create` | `createHivemindAgentWorkCreateTool()` | `plugin.ts:176` |
| 18 | `hivemind-agent-work-export` | `createHivemindAgentWorkExportTool()` | `plugin.ts:177` |
| 19 | `session-delegation-query` | `createSessionDelegationQueryTool()` | `plugin.ts:178` |

### 1.4 Config Tools (6) — `registerConfigTools()`

| # | Tool Name | Factory Function | Registration Line |
|---|-----------|-----------------|-------------------|
| 20 | `configure-primitive` | `createConfigurePrimitiveTool()` | `plugin.ts:191` |
| 21 | `validate-restart` | `createValidateRestartTool()` | `plugin.ts:192` |
| 22 | `bootstrap-init` | `createBootstrapInitTool()` | `plugin.ts:193` |
| 23 | `bootstrap-recover` | `createBootstrapRecoverTool()` | `plugin.ts:194` |
| 24 | `prompt-skim` | `createPromptSkimTool()` | `plugin.ts:195` |
| 25 | `prompt-analyze` | `createPromptAnalyzeTool()` | `plugin.ts:196` |

### 1.5 Registration Wiring Point

All 4 domain functions are invoked at `plugin.ts:631-651` inside the `HarnessControlPlane` plugin factory:

```
tool: {
  ...registerDelegationTools(...)     // line 632
  ...registerSessionTools(...)        // line 640
  ...registerHivemindTools(...)       // line 645
  ...registerConfigTools(...)         // line 648
}
```

The startup log at `plugin.ts:369` confirms: `"registering 25 custom tools"`.

### 1.6 Registration Verdict

**✅ PASS.** All 25 tools are registered through the OpenCode `tool` object via the plugin return shape. The 4 domain registration functions produce `Record<string, ReturnType<typeof tool>>` which spreads into the `tool:` key of the plugin return value.

---

## Section 2: Hook Wiring Coverage

### 2.1 Hook Chain Architecture

The plugin registers hooks in this order at `plugin.ts:560-678`:

```
1. createCoreHooks()             → session event lifecycle hooks
2. sessionReadHooks              → session read-side hooks  
3. "tool.execute.before"         → guard + discovery chain (line 589)
4. "chat.message"                → message capture (line 614)
5. "tool.execute.after"          → response + metadata + workflow (line 654)
```

### 2.2 Hook Detail: `tool.execute.before`

**Registration:** `plugin.ts:589`

**Chain (3 steps):**

| Step | Module | Purpose | Applies To |
|------|--------|---------|------------|
| 1 | `tool-guard-hooks.ts:73-183` | Circuit breaker, budget, governance, language guard | **All 25 tools** (checks `toolName` generically at line 76) |
| 2 | `tool-before-guard.ts:57-87` | Proactive child session discovery | **Only `task` and `delegate-task`** (line 60: `if (toolName === "task" || toolName === "delegate-task")`) |
| 3 | `tool-before-guard.ts:91-101` | Contract enforcement | **All 25 tools** (runs on every tool when `contractEnforcement` deps provided) |

**Evidence:**
- Generic guard: `tool-guard-hooks.ts:76` — `const toolName = asString(getNestedValue(input, ["tool"]))` — no tool-name filter, runs on all
- Task discovery: `tool-before-guard.ts:60` — `if (toolName === "task" || toolName === "delegate-task")` — selective
- Contract: `tool-before-guard.ts:91` — `if (contractHook)` — no tool filter, runs on all when enabled

### 2.3 Hook Detail: `tool.execute.after`

**Registration:** `plugin.ts:654`

**Chain (4 steps):**

| Step | Module | Purpose | Applies To |
|------|--------|---------|------------|
| 1 | `tool-after-composer.ts` (invoked at `plugin.ts:658`) | Response shaping + metadata injection | **All 25 tools** |
| 2 | `delegationManager.recordChildToolSignal()` at `plugin.ts:664` | Delegation activity tracking | **All 25 tools** (guarded by `if (childSessionId)`) |
| 3 | `sessionTracker.handleToolExecuteAfter()` at `plugin.ts:669-675` | Session knowledge capture | **All 25 tools** (wrapped in try/catch, best-effort) |
| 4 | `tool-after-workflow.ts:32-53` (invoked at `plugin.ts:677`) | Workflow turn persistence | **Only `configure-primitive`** (line 36: `if (input.tool !== "configure-primitive") return`) |

**Evidence:**
- Workflow selectivity: `tool-after-workflow.ts:36` — hard filter on `configure-primitive`
- Session tracker: `plugin.ts:669` — no tool filter, runs on all
- Delegation signal: `plugin.ts:664` — `if (childSessionId)` — runs on all delegated sessions

### 2.4 Hook Detail: `chat.message`

**Registration:** `plugin.ts:614`

**Chain (2 steps):**

| Step | Module | Purpose |
|------|--------|---------|
| 1 | `delegationManager.recordChildMessageSignal()` at `plugin.ts:616` | Records child assistant output for completion detection |
| 2 | `chat-message-capture.ts` at `plugin.ts:617-629` | Session tracker message capture |

**Evidence:** `plugin.ts:616` — `delegationManager.recordChildMessageSignal(childSessionId, extractAssistantExcerpt(input, output))`

### 2.5 Hook Detail: Session Event Observers

**Wired at:** `plugin.ts:564-583` inside `createCoreHooks()`

| Observer | Module | Listens For |
|----------|--------|-------------|
| `consumeDelegationFact` | `delegation-consumer.ts` | `session.idle`, `session.error`, `session.deleted` |
| `sessionEventObserver` | `session-hooks.ts` | Session lifecycle continuity updates |
| `consumeSessionTrackerFact` | `session-tracker-consumer.ts` | Session tracker event capture |
| `consumeSessionEntryFact` | `session-entry-consumer.ts` | Session intake classification |
| `consumeIsMainSessionFact` | `session-main-consumer.ts` | Main/child session caching |
| Tmux observer | `tmux/observers.ts` | Enriched session events (optional) |

**Evidence:** `plugin.ts:564` — event observer array passed to `createCoreHooks()`

### 2.6 Hook Coverage Summary Matrix

| Hook | Tools Covered | Selectivity |
|------|--------------|-------------|
| Circuit breaker + budget | All 25 | Generic — `tool-guard-hooks.ts:76` |
| Governance evaluation | All 25 | Generic — `tool-guard-hooks.ts:119-135` |
| Language guard | write, edit, apply_patch only | Filtered — `tool-guard-hooks.ts:146` |
| Contract enforcement | All 25 | Generic — `tool-before-guard.ts:91` |
| Child session discovery | `task`, `delegate-task` only | **Filtered** — `tool-before-guard.ts:60` |
| Response metadata injection | All 25 | Generic — `tool-guard-hooks.ts:204-229` |
| Session tracker (before) | `task`, `delegate-task` only | **Filtered** — `tool-before-guard.ts:60` |
| Session tracker (after) | All 25 | Generic — `plugin.ts:669` |
| Workflow persistence | `configure-primitive` only | **Filtered** — `tool-after-workflow.ts:36` |
| Delegation signal (tool) | All 25 (when child session) | Generic — `plugin.ts:664` |
| Delegation signal (message) | All 25 (when child session) | Generic — `plugin.ts:616` |

### 2.7 Hook Verdict

**✅ PASS with notes.** All 25 tools are covered by the generic guard chain (circuit breaker, budget, governance, contract, metadata injection, session tracking). Three hooks are selective by design:

1. **Child session discovery** (`tool-before-guard.ts:60`) — only triggers for `task`/`delegate-task` — **correct**: these are the only tools that create child sessions
2. **Workflow persistence** (`tool-after-workflow.ts:36`) — only triggers for `configure-primitive` — **correct**: this is the only workflow-aware tool
3. **Language guard** (`tool-guard-hooks.ts:146`) — only triggers for `write`/`edit`/`apply_patch` — **correct**: only these tools write file content

---

## Section 3: Agent Assignment — Permission Blocks

### 3.1 Agents WITH Permission Blocks (12)

#### hm-l0-orchestrator.md (line 8)

| Harness Tool | Permission |
|-------------|-----------|
| `session-journal-export` | allow |
| `execute-slash-command` | allow |
| `prompt-skim` | allow |
| `prompt-analyze` | allow |
| `session-patch` | allow (implied by ask) |
| `session-tracker` | allow |
| `hivemind-trajectory` | allow |
| `hivemind-pressure` | allow |
| `hivemind-doc` | allow |
| `hivemind-sdk-supervisor` | allow |
| `hivemind-command-engine` | allow |

**NOT referenced:** `delegate-task`, `delegation-status`, `run-background-command`, `session-hierarchy`, `session-context`, `create-governance-session`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `session-delegation-query`, `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`

#### hf-l0-orchestrator.md (line 8)

| Harness Tool | Permission |
|-------------|-----------|
| `delegate-task` | allow |
| `delegation-status` | allow |
| `session-journal-export` | allow |
| `prompt-skim` | allow |
| `prompt-analyze` | allow |
| `session-patch` | ask |
| `session-tracker` | allow |
| `hivemind-trajectory` | allow |
| `hivemind-pressure` | allow |
| `hivemind-doc` | allow |
| `hivemind-sdk-supervisor` | allow |
| `hivemind-command-engine` | allow |
| `execute-slash-command` | allow |
| `hivemind-agent-work-create` | allow |
| `hivemind-agent-work-export` | allow |

**NOT referenced:** `run-background-command`, `session-hierarchy`, `session-context`, `create-governance-session`, `hivemind-session-view`, `session-delegation-query`, `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`

#### hf-l1-coordinator.md (line 6)

| Harness Tool | Permission |
|-------------|-----------|
| `delegate-task` | allow |
| `delegation-status` | allow |
| `session-journal-export` | allow |
| `hivemind-command-engine` | allow |
| `prompt-skim` | ask |
| `prompt-analyze` | ask |
| `session-patch` | ask |
| `execute-slash-command` | ask |

#### hf-l2-auditor.md (line 6)

| Harness Tool | Permission |
|-------------|-----------|
| `delegate-task` | ask |
| `delegation-status` | ask |
| `session-journal-export` | ask |
| `prompt-skim` | ask |
| `prompt-analyze` | ask |
| `session-patch` | ask |

#### hf-l2-agent-builder.md, hf-l2-command-builder.md, hf-l2-meta-builder.md, hf-l2-prompter.md, hf-l2-refactorer.md, hf-l2-skill-builder.md, hf-l2-synthesizer.md (all line 6)

All 7 agents share the same pattern:

| Harness Tool | Permission |
|-------------|-----------|
| `delegate-task` | ask |
| `delegation-status` | ask |
| `session-journal-export` | ask |
| `prompt-skim` | ask |
| `prompt-analyze` | ask |
| `session-patch` | ask |

#### hf-l2-tool-builder.md (line 6)

| Harness Tool | Permission |
|-------------|-----------|
| `delegation-status` | allow |
| `session-journal-export` | ask |
| `prompt-skim` | ask |
| `prompt-analyze` | ask |
| `session-patch` | ask |

### 3.2 Tools NEVER Referenced in ANY Agent Permission Block

The following 11 registered tools appear in **zero** agent permission blocks:

| # | Tool Name | Registered At | Referenced in Agents |
|---|-----------|---------------|---------------------|
| 1 | `run-background-command` | `plugin.ts:137` | **NONE** |
| 2 | `session-hierarchy` | `plugin.ts:154` | **NONE** |
| 3 | `session-context` | `plugin.ts:155` | **NONE** |
| 4 | `create-governance-session` | `plugin.ts:156` | **NONE** |
| 5 | `hivemind-session-view` | `plugin.ts:175` | **NONE** |
| 6 | `session-delegation-query` | `plugin.ts:178` | **NONE** |
| 7 | `configure-primitive` | `plugin.ts:191` | **NONE** |
| 8 | `validate-restart` | `plugin.ts:192` | **NONE** |
| 9 | `bootstrap-init` | `plugin.ts:193` | **NONE** |
| 10 | `bootstrap-recover` | `plugin.ts:194` | **NONE** |
| 11 | `hivemind-pressure` | `plugin.ts:172` | Only in hm-l0 and hf-l0 |

### 3.3 Agents WITHOUT Permission Blocks

**19+ agents** in `.opencode/agents/` have no `permission:` block at all:

- `hm-orchestrator.md`
- `hm-synthesizer.md`
- `hm-code-reviewer.md`
- `hm-debugger.md`
- `hm-executor.md`
- `hm-planner.md`
- `hm-verifier.md`
- `hm-shipper.md`
- `hm-specifier.md`
- `hm-integration-checker.md`
- `hm-security-auditor.md`
- `hm-doc-writer.md`
- `hm-doc-verifier.md`
- `hm-codebase-mapper.md`
- `hm-pattern-mapper.md`
- `hm-ecologist.md`
- `hm-roadmapper.md`
- `hm-user-profiler.md`
- `hm-ui-auditor.md`
- `hm-ui-checker.md`
- `hm-ui-researcher.md`
- `hm-phase-researcher.md`
- `hm-debug-session-manager.md`
- `hm-intel-updater.md`
- `hm-nyquist-auditor.md`
- `hm-plan-checker.md`
- `hm-project-researcher.md`
- All 33 `gsd-*` agents (developer tooling — not shipped)

These agents rely entirely on OpenCode's default permission model (all tools available unless explicitly denied).

### 3.4 Agent Assignment Verdict

**⚠️ PARTIAL.** 12 of 42+ agents declare explicit harness tool permissions. The other 30+ agents have no permission block — their tool access is governed solely by OpenCode's default permission system, not by the harness. Additionally, 11 registered harness tools are never referenced in any agent permission block.

---

## Section 4: Spawner Enforcement — The Enforcement Gap

### 4.1 How Delegation Builds Tool Profiles

When an agent is dispatched via `delegate-task`, the following call chain executes:

```
delegate-task.ts
  → DelegationManager.dispatch()
    → DelegationCoordinator.coordinate()
      → DelegationDispatcher.dispatch()
        → AgentResolver.resolve(agentName)           // line 17-24
        → AgentResolver.buildPermissionProfile()     // line 27-32
        → resolveDelegationPermissionProfile()       // spawn-request-builder.ts:73
          → toolsFromAgentMetadata(agent)            // spawn-request-builder.ts:87
```

### 4.2 The `toolsFromAgentMetadata()` Function

**File:** `src/coordination/spawner/spawn-request-builder.ts:87-122`

```typescript
function toolsFromAgentMetadata(agent: ValidatedAgent): readonly string[] | undefined {
  let allowed: string[] = []

  if (agent.tools) {
    allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => {   // line 91
      ...
    })
  } else if (agent.permission) {
    allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => {   // line 99
      ...
    })
  } else {
    return undefined                                         // line 107
  }
  ...
}
```

**Critical constraint:** Both branches (lines 91 and 99) filter against `WRITE_CAPABLE_TOOLS`:

```typescript
const WRITE_CAPABLE_TOOLS = ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"] as const
```

**Source:** `spawn-request-builder.ts:29`

### 4.3 The `WRITE_CAPABLE_TOOLS` Set

This set contains **7 OpenCode built-in tools**. It does NOT contain any of the 25 harness-registered tools (except `execute-slash-command` which is both a built-in and a harness tool).

**Impact:** When `toolsFromAgentMetadata()` processes an agent's permission block, it only produces tool names from the `WRITE_CAPABLE_TOOLS` array. If an agent frontmatter declares `hivemind-doc: allow`, that declaration is parsed by `isPermissionAllowed()` at line 104 but the resulting tool name `"hivemind-doc"` is never added to the `allowed` array because the `.filter()` only iterates `WRITE_CAPABLE_TOOLS` entries.

### 4.4 The `READ_ONLY_TOOLS` Fallback

```typescript
const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const
```

**Source:** `spawn-request-builder.ts:28`

When `toolsFromAgentMetadata()` returns `undefined` (agent has no `tools` or `permission` block) or an empty array, the fallback at line 79 and line 121 applies:

```typescript
const tools = explicitTools ?? intentTools ?? READ_ONLY_TOOLS   // line 79
return result.length > 0 ? result : READ_ONLY_TOOLS             // line 121
```

This means agents without permission blocks get `["read", "glob", "grep"]` — and agents with permission blocks only get entries from `WRITE_CAPABLE_TOOLS` that match their frontmatter.

### 4.5 Where the Permission Profile Ends Up

The `permissionProfile` returned from `resolveDelegationPermissionProfile()` is stored in the `DelegationSpawnRequest` at `spawn-request-builder.ts:55`:

```typescript
permissionProfile: resolveDelegationPermissionProfile(params, agent),
```

This is consumed by `sdk-child-session-starter.ts` which builds the delegation prompt and includes the tool list as part of the child session's instruction context.

### 4.6 The `enrichAgentFromPrimitives()` Bridge

**File:** `src/coordination/spawner/agent-primitive-policy.ts:37-51`

This function enriches live SDK agent metadata with local `.opencode/agents/` primitive policy. It loads `permission` and `tools` from the agent's `.md` frontmatter and merges them into the `ValidatedAgent`:

```typescript
return {
  ...agent,
  description: agent.description ?? primitive.frontmatter.description,
  permission: agent.permission ?? primitive.frontmatter.permission,   // line 45
  tools: agent.tools ?? primitive.frontmatter.tools,                   // line 46
}
```

This bridge DOES correctly load the agent frontmatter permissions — but the downstream `toolsFromAgentMetadata()` only resolves names from `WRITE_CAPABLE_TOOLS`, so the harness tool declarations in the loaded `permission` map are never extracted into the final tool list.

### 4.7 Spawner Verdict

**❌ FAIL.** The spawner's `toolsFromAgentMetadata()` function at `spawn-request-builder.ts:87-122` only resolves tool names from the `WRITE_CAPABLE_TOOLS` set (`spawn-request-builder.ts:29`), which contains 7 OpenCode built-in tools. None of the 24 harness-specific tools are in this set. As a result:

1. Agent frontmatter declarations like `hivemind-doc: allow` are loaded by `enrichAgentFromPrimitives()` (`agent-primitive-policy.ts:45`) but never extracted into the child session's tool profile
2. The child session's `permissionProfile.tools` array can only contain entries from `["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"]`
3. The one harness tool that IS accessible is `execute-slash-command` (because it appears in `WRITE_CAPABLE_TOOLS`)

**This means agent frontmatter permission blocks for harness tools express intent but are not enforced at the delegation boundary.** The child session's actual harness tool access depends entirely on what OpenCode's default permission model allows, not on what the agent's frontmatter declared.

---

## Section 5: Intelligence Gap Analysis

### GAP-01: Spawner Cannot Resolve Harness Tools

**Severity:** HIGH (architectural gap — not a bug, but a design limitation)

**Evidence:**
- `spawn-request-builder.ts:29` — `WRITE_CAPABLE_TOOLS` only has 7 built-in tools
- `spawn-request-builder.ts:91` and `spawn-request-builder.ts:99` — both filter against `WRITE_CAPABLE_TOOLS`
- `agent-primitive-policy.ts:45` — loads agent `permission` from frontmatter
- `spawn-request-builder.ts:87-122` — `toolsFromAgentMetadata()` never produces harness tool names

**Fix Options:**
1. Add a `HARNESS_TOOLS` constant listing all 25 tool names and include them in the `toolsFromAgentMetadata()` resolution
2. Add a separate `resolveHarnessToolPermissions()` function that reads agent frontmatter and produces a harness-specific tool allowlist
3. Make `WRITE_CAPABLE_TOOLS` dynamic — discover registered tools from the plugin at runtime

### GAP-02: No Central Tool-Agent Registry

**Severity:** MEDIUM (maintainability risk)

**Evidence:**
- Tool registration: `plugin.ts:128-198` (4 separate functions)
- Permission declarations: 12 agent `.md` files scattered across `.opencode/agents/`
- Spawner enforcement: `spawn-request-builder.ts:28-30`
- No single file maps "tool X should be available to agents Y, Z"

**Impact:** Adding a new tool requires updating: (1) `plugin.ts` registration, (2) any agent `.md` files that should have access, (3) potentially `WRITE_CAPABLE_TOOLS` in the spawner. There's no validation that these stay in sync.

### GAP-03: 11 Tools Never Referenced in Any Agent

**Severity:** LOW (functional but undocumented)

**Evidence:** See Section 3.2 — 11 registered tools appear in zero agent permission blocks. These tools are still accessible via OpenCode's default permission model, but their intended agent consumers are not documented.

**Tools affected:** `run-background-command`, `session-hierarchy`, `session-context`, `create-governance-session`, `hivemind-session-view`, `session-delegation-query`, `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`, and partially `hivemind-pressure`

### GAP-04: Recursive Delegation Blocklist Is Hardcoded

**Severity:** LOW (fragile but functional)

**Evidence:** `agent-resolver.ts:35-37`:
```typescript
buildDisabledTools(): Record<string, boolean> {
  return { "delegate-task": false, task: false }
}
```

**Impact:** If new delegation-capable tools are added, this hardcoded blocklist must be manually updated. No discovery mechanism exists.

### GAP-05: `enrichAgentFromPrimitives()` Loads but Doesn't Use Harness Permissions

**Severity:** MEDIUM (wasted computation, false signal)

**Evidence:** `agent-primitive-policy.ts:45` loads `permission` from agent frontmatter into `ValidatedAgent.permission`. This enriched agent is passed to `toolsFromAgentMetadata()` at `spawn-request-builder.ts:87`, which DOES read `agent.permission` (line 98-105) but only resolves names from `WRITE_CAPABLE_TOOLS`. The harness tool entries in the permission map are loaded, checked via `isPermissionAllowed()`, but never added to the output because the filter predicate iterates `WRITE_CAPABLE_TOOLS`, not the permission map keys.

---

## Section 6: Verdict

### Summary Table

| Dimension | Status | Evidence |
|-----------|--------|----------|
| **Registration** | ✅ PASS | All 25 tools registered via 4 domain functions at `plugin.ts:128-198` |
| **Hook Guard Coverage** | ✅ PASS | Circuit breaker, budget, governance apply to all 25 tools generically at `tool-guard-hooks.ts:73-183` |
| **Hook Observability** | ✅ PASS | Session tracker captures all tool events at `plugin.ts:669`; metadata injected at `tool-guard-hooks.ts:204-229` |
| **Agent Permission Intent** | ⚠️ PARTIAL | 12/42+ agents declare harness tool permissions; 19+ have no `permission:` block; 11 tools never referenced |
| **Spawner Enforcement** | ❌ FAIL | `toolsFromAgentMetadata()` at `spawn-request-builder.ts:87-122` only resolves `WRITE_CAPABLE_TOOLS` (7 built-in tools) — 24 harness tools are invisible |
| **Workflow Persistence** | ⚠️ NARROW | Only `configure-primitive` gets workflow state at `tool-after-workflow.ts:36` |

### Risk Assessment

| Risk | Level | Explanation |
|------|-------|-------------|
| Security | LOW | OpenCode's own permission system is the real enforcement layer. Harness tool access is not bypassed — just not explicitly controlled by frontmatter in delegated sessions. |
| Correctness | MEDIUM | Agent frontmatter permission blocks create a false sense of control. A developer adding `my-tool: deny` to an agent frontmatter would expect it to be denied in child sessions, but it would not be. |
| Maintainability | MEDIUM | No single source-of-truth for tool-agent mappings. Adding a tool requires touching 3+ files with no validation. |
| Observability | NONE | All tools are tracked by session tracker and metadata injection regardless of permission resolution. |

### Recommended Actions

1. **[HIGH] Extend `toolsFromAgentMetadata()`** to include harness tool names in the resolution logic. Add a `HARNESS_TOOLS` constant or dynamically discover registered tools.
2. **[MEDIUM] Create a central tool-agent mapping** — either as a TypeScript constant or a schema-validated JSON file that maps tools to the agents that should have access.
3. **[LOW] Document the 11 unreferenced tools** — clarify which agents (if any) should be using `run-background-command`, `session-hierarchy`, etc.
4. **[LOW] Make the recursive delegation blocklist dynamic** — derive it from tool metadata rather than hardcoding at `agent-resolver.ts:36`.

---

_Audit completed: 2026-05-31_
_Depth: Deep (cross-file analysis with call-chain tracing)_
_Files analyzed: 15 source files + 12 agent definitions_
