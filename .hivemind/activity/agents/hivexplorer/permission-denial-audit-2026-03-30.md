# HiveMind Plugin — Permission Denial & Tool Blocking Hook Audit

**Investigation Date:** 2026-03-30  
**Scope:** `src/hooks/`, `src/plugin/`, `src/tools/`, full `src/` grep for permission/denial patterns  
**Question:** Find EXISTING hooks that intercept permission denials or tool execution blocking, particularly those returning customized error messages to agents.

---

## Executive Summary

**NO EXISTING hook intercepts permission denials or returns customized error messages per-agent.** The codebase has:

1. **`permission.ask` hook** — only auto-allows HiveMind-managed tools; shows toast for write ops but does NOT deny/block
2. **`tool.execute.before` hook** — only records trajectory events, does NOT block
3. **`context.ask()` in tools** — requests permission WITHIN tools for specific file operations, not a denial handler
4. **Routing-level "blocked" states** — these are routing/decisions about which commands to run, not tool execution blocking

**Gap:** There is no hook that:
- Returns `output.status = 'deny'` to block tool execution
- Customizes denial messages based on agent identity/mandate/role
- Intercepts and modifies permission denial responses

---

## Detailed Findings

### Finding 1 — `permission.ask` Hook (Plugin Entry Point)

| Field | Value |
|-------|-------|
| **File** | `src/plugin/opencode-plugin.ts` |
| **Lines** | 154–171 |
| **Hook Type** | `permission.ask` |

**Code:**
```typescript
'permission.ask': async (permissionInput, output) => {
  // Auto-allow HiveMind managed tool calls (they have their own governance)
  if (permissionInput.metadata) {
    const toolName = (permissionInput.metadata as Record<string, unknown>).tool as string | undefined
    if (isHivemindManagedTool(toolName)) {
      output.status = 'allow'
      return
    }
  }

  // For state mutations, surface a governance toast
  if (permissionInput.type === 'write') {
    await showGovernanceToast(
      'mutation-gate',
      `HiveMind: Permission requested for ${permissionInput.type} operation`,
    )
  }
},
```

**Behavior:**
- ✅ Intercepts `permission.ask` hook
- ✅ Auto-allows HiveMind-managed tools (sets `output.status = 'allow'`)
- ⚠️ For write operations, shows a toast BUT does NOT set `output.status = 'deny'` — the permission request proceeds
- ❌ Does NOT customize messages per-agent identity
- ❌ Does NOT reference agent mandates or roles
- ❌ Does NOT block non-HiveMind tools

**Evidence of non-denial:** Line 159 sets `output.status = 'allow'` only. There is no `output.status = 'deny'` anywhere in the hook. The write-operation toast is informational only.

---

### Finding 2 — `tool.execute.before` Hook

| Field | Value |
|-------|-------|
| **File** | `src/plugin/opencode-plugin.ts` |
| **Lines** | 172–177 |
| **Hook Type** | `tool.execute.before` |

**Code:**
```typescript
'tool.execute.before': async (toolInput, _output) => {
  // Record tool execution intent for trajectory tracking
  if (isHivemindManagedTool(toolInput.tool)) {
    await recordToolEvent(directory, toolInput.sessionID, `${toolInput.tool}:pre`)
  }
},
```

**Behavior:**
- ✅ Intercepts `tool.execute.before` hook
- ❌ Does NOT block or deny — only records trajectory events
- ❌ No custom error messages returned

---

### Finding 3 — `context.ask()` in Tool Handlers

| Field | Value |
|-------|-------|
| **File** | `src/features/agent-work-contract/tools/create-contract-tool.helpers.ts` |
| **Lines** | 60–79 |

**Code:**
```typescript
export async function askToEditContract(
  context: ToolContext,
  action: 'create' | 'update',
  contractId: string,
): Promise<void> {
  await context.ask({
    permission: 'edit',
    patterns: [`.hivemind/agent-work-contract/${contractId}.json`],
    always: ['*'],
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      action,
      contractId,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  })
}
```

**Other tools using `context.ask`:**
| File | Line | Purpose |
|------|------|---------|
| `src/tools/hivefiver-setting/tools.ts` | 5, 72 | Documents `context.ask()` requirement |
| `src/tools/hivefiver-init/tools.ts` | 22 | Documents `context.ask()` requirement |
| `src/tools/hivefiver-doctor/tools.ts` | 6 | Documents `context.ask()` requirement |

**Behavior:**
- This is a tool-INTERNAL permission request for editing contract files
- NOT a hook that intercepts/blocks tool execution based on agent identity
- Captures `context.agent` in metadata but only for audit trail
- Does NOT return denial messages to the calling agent

---

### Finding 4 — Start-Work Routing "Blocked" State

| Field | Value |
|-------|-------|
| **File** | `src/hooks/start-work/start-work-router-helpers.ts` |
| **Lines** | 20–44 |

**Code:**
```typescript
export function resolveRiskLevel(
  input: StartWorkInput,
  requiredControlPlaneId: StartWorkDecision['requiredControlPlaneId'],
  continuityAlerts: string[],
  wrongAgent: boolean,
  trajectoryAction?: TrajectoryAssessmentAction,
): RuntimeRiskLevel {
  if (trajectoryAction === 'refuse-conflict') {
    return 'blocked'
  }

  if (requiredControlPlaneId === 'hm-init' || requiredControlPlaneId === 'hm-doctor') {
    return 'blocked'
  }

  if (wrongAgent || continuityAlerts.length > 0) {
    return 'gated'
  }
  // ...
}
```

**Behavior:**
- `'blocked'` and `'gated'` are routing risk levels, NOT tool execution blocking
- Used to decide which command to recommend (e.g., `hm-init`, `hm-doctor`)
- Not a hook that returns denial messages to agents
- No `output.status = 'deny'` or custom error messages

---

### Finding 5 — Soft Governance (Toast-Only)

| Field | Value |
|-------|-------|
| **File** | `src/hooks/soft-governance.ts` |
| **Lines** | 26–45 |

**Code:**
```typescript
export async function showGovernanceToast(
  category: string,
  message: string,
  variant?: 'info' | 'warning' | 'error'
): Promise<void> {
  // ... throttling logic ...
  await withClient(async (client) => {
    await client.tui.showToast({
      body: { message, variant: variant ?? 'info' },
    })
  })
}
```

**Behavior:**
- Non-blocking governance signal via SDK toast
- No denial returned to agent
- Not a permission denial interceptor

---

### Finding 6 — Tool Execution Handler (Event Recording Only)

| Field | Value |
|-------|-------|
| **File** | `src/hooks/tool-execution-handler.ts` |
| **Lines** | 31–85 |

**Behavior:**
- Only records tool execution events to session journal
- No blocking or denial logic

---

## Pattern Search Results

| Pattern | Matches | Relevant |
|---------|---------|----------|
| `permission` | 18 in src/ | Only 3 are actual hook usage (opencode-plugin.ts) |
| `denied\|deny` | 0 | None found |
| `block\|blocked` | 209 | All are internal state/status values, not hook-based denial |
| `context.ask` | 5 | Tool-internal usage only, not denial interception |
| `tool.execute.before` | 1 | opencode-plugin.ts:172 — only records events |
| `agent.*mandate\|mandate` | 0 | No agent mandate references |
| `role.*check\|role.*enforce` | 0 | No role enforcement hooks |
| `output.status` | 3 | Only `output.status = 'allow'` at line 159, no denial |

---

## Gaps Confirmed

The following do NOT exist in the codebase:

1. **No hook that sets `output.status = 'deny'`** — The only `output.status` assignment is `output.status = 'allow'` for HiveMind-managed tools.

2. **No per-agent customized denial messages** — The `permission.ask` hook does not check `permissionInput.agent`, only `permissionInput.metadata.tool`.

3. **No agent mandate/role-based blocking** — No references to `agent.*mandate`, `role.*check`, or `role.*enforce` patterns.

4. **No `tool.execute.before` blocking** — The hook only records trajectory events, does not block.

5. **`context.ask` is tool-internal, not hook-level** — Used for specific file editing permissions within tools, not general tool execution denial.

---

## Git Context

- **Latest commit:** `93c5a0b5 docs: add dashboard/sidecar plans, verification prompt, session artifacts, and activity outputs`
- **Investigated at:** Git commit hash `93c5a0b5`
- **Hook files status:** No uncommitted changes to `src/hooks/` or `src/plugin/opencode-plugin.ts`

---

## Conclusion

**The HiveMind plugin does NOT have any existing hook that intercepts permission denials or tool execution blocking with customized error messages.** The `permission.ask` hook only auto-allows HiveMind-managed tools and shows informational toasts for write operations. The "blocked" states in start-work routing are decision-making about which commands to run, not tool execution denial.

If the requirement is to implement per-agent customized denial messages, a new hook implementation would need to be added.
