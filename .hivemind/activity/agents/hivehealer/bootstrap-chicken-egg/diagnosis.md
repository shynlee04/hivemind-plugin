# Bootstrap Chicken-Egg Diagnosis

**Issue:** Fresh brownfield install of HiveMind plugin fails on `/hm-init` because the required `hivefiver` agent doesn't exist yet.

**Root Cause Identified:** Circular dependency between command execution and agent availability.

---

## Root Cause

### The Failure Chain

1. User installs HiveMind plugin (npm package `hivemind-context-governance`)
2. User opens OpenCode with default `build` agent
3. No `.opencode/agents/` directory exists (or only OpenCode built-ins)
4. User types `/hm-init`
5. OpenCode reads command frontmatter: `agent: hivefiver` (from `commands/hm-init.md` line 4)
6. OpenCode tries to resolve agent `hivefiver` from `.opencode/agents/hivefiver.md`
7. **Agent file doesn't exist → crash/TypeError** (per OpenCode issue #18279: `Agent.get()` returns `undefined` for unknown names, callers dereference without null checks)

### Why It's Circular

The `hm-init` command is supposed to bootstrap the HiveMind runtime, but it requires the `hivefiver` agent to exist first. The `hivefiver` agent is supposed to be projected to `.opencode/agents/hivefiver.md` during init, but init can't run without the agent.

### Evidence

| Source | File | Line | Finding |
|--------|------|------|---------|
| Command frontmatter | `commands/hm-init.md` | 4 | `agent: hivefiver` |
| Bundle registry | `src/commands/slash-command/command-bundles.ts` | 9 | `agent: 'hivefiver'` |
| Agent canonical source | `agents/hivefiver.deprecated.md` | — | Exists in package, NOT projected to `.opencode/agents/` |
| OpenCode agent resolution | Issue #18279 | — | Crashes with TypeError on unknown agent names |
| Command docs | OpenCode docs | — | "If agent not specified, defaults to your current agent" |
| `command.execute.before` hook | `src/plugin/opencode-plugin.ts` | 141-180 | Injects parts only, does NOT override agent |
| Init handler | `src/features/runtime-entry/init.handler.ts` | 55-266 | Creates `.hivemind/` state, does NOT project `.opencode/agents/` |
| Init tool | `src/tools/hivefiver-init/tools.ts` | 49-56 | Creates `.hivemind/` directories, does NOT create `.opencode/agents/` |
| Doctor tool | `src/tools/hivefiver-doctor/tools.ts` | 72-81 | Detects missing `.opencode/agents/` but does NOT create it |
| Agent registry | `src/shared/opencode-agent-registry.ts` | 40-50 | Defines 9 canonical agents, reads from `agents/*.deprecated.md` |
| `assertSlashCommandAgentBindings` | `src/shared/opencode-agent-registry.ts` | 132-146 | Validates agents exist at BUILD time (in package), NOT runtime (in `.opencode/agents/`) |
| Plugin init | `src/plugin/opencode-plugin.ts` | 52-55 | `initSkillInjection`, `initSdkContext` — no agent projection |
| `loadRuntimeBindingsSnapshot` | `src/features/runtime-entry/snapshot-loader.ts` | 21-73 | Loads `.hivemind/` state — no `.opencode/agents/` check |
| `resolveDefaultAgent` | `src/plugin/skill-exposure-map.ts` | 38-39 | Returns `'hiveminder'` (not `hivefiver`) |

---

## How OpenCode Resolves Agents

Per OpenCode SDK documentation and issue tracker:

1. Command markdown frontmatter specifies `agent: hivefiver`
2. OpenCode's `SessionPrompt.command()` calls `Agent.get('hivefiver')`
3. `Agent.get()` looks up agent from the loaded agent registry (`.opencode/agents/`)
4. If not found → returns `undefined` → **crash** (no null check at call sites)
5. There is no fallback mechanism — OpenCode does NOT fall back to `build` or default agent
6. The `command.execute.before` hook can only inject `output.parts`, NOT override the agent

### Hook Output Contract

```typescript
// command.execute.before output shape (from OpenCode docs + issues):
output = {
  parts: MessagePart[],  // CAN modify
  // NO agent field — cannot override
  // NO cancelled field yet (proposed in issue #18554)
}
```

---

## Recommended Bootstrap Sequence

### Option A: Plugin Auto-Projjection on Init (RECOMMENDED)

**Where:** `src/plugin/opencode-plugin.ts` — `HiveMindPlugin` function entry

**What:** When the plugin loads, check if `.opencode/agents/hivefiver.md` exists. If not, project it from the canonical source `agents/hivefiver.deprecated.md`.

```typescript
// In HiveMindPlugin, before initSkillInjection:
async function ensureAgentProjection(directory: string): Promise<void> {
  const { existsSync, mkdirSync, copyFileSync } = await import('node:fs')
  const { join } = await import('node:path')

  const agentsDir = join(directory, '.opencode', 'agents')
  const requiredAgents = ['hivefiver'] // minimum for hm-init

  for (const agentId of requiredAgents) {
    const targetPath = join(agentsDir, `${agentId}.md`)
    if (!existsSync(targetPath)) {
      // Read from canonical source in package
      const sourcePath = join(directory, 'node_modules', 'hivemind-context-governance', 'agents', `${agentId}.deprecated.md`)
      if (existsSync(sourcePath)) {
        mkdirSync(agentsDir, { recursive: true })
        copyFileSync(sourcePath, targetPath)
      }
    }
  }
}
```

**Pros:**
- Fixes the chicken-egg at the earliest possible point
- Plugin load happens before any command execution
- Minimal code change — ~15 lines
- No architectural compromise — `hivefiver` is still the authoritative agent for `hm-init`
- Follows existing pattern (plugin already calls `initSkillInjection` and `initSdkContext` at startup)

**Cons:**
- Plugin takes on agent management responsibility (but it already manages skill injection)
- Need to handle npm package path resolution correctly

### Option B: Hook-Level Agent Projection (SURGICAL)

**Where:** `src/plugin/opencode-plugin.ts` — `command.execute.before` hook

**What:** Before the command executes, check if the bundle's agent exists in `.opencode/agents/`. If not, project it.

**Pros:**
- Only creates agents when actually needed (lazy)
- Surgical — only touches the hook that needs it

**Cons:**
- Hook fires right before execution — may be too late if OpenCode resolves the agent before the hook
- More complex error handling (race conditions)
- Adds latency to every command execution

### Option C: hm-init Uses Default Agent (ARCHITECTURAL VIOLATION)

**Where:** `src/commands/slash-command/command-bundles.ts` line 9, `commands/hm-init.md` line 4

**What:** Change `agent: 'hivefiver'` to `agent: 'build'` (or omit it to default to current agent).

**Pros:**
- Simplest change — 2 lines
- No agent projection needed

**Cons:**
- **Violates architecture:** `build` agent doesn't have HiveMind governance context
- Command frontmatter would disagree with bundle definition
- `hm-init` command body references `hivemind_runtime_status` and `hivemind_hm_init` tools — the `build` agent may not have access to these
- Sets precedent for breaking agent-command binding contracts
- **Architects would reject this** per AGENTS.md: "Never rewrites architecture to fix a bug"

---

## Design Recommendation: Option A

Option A is the correct fix because:

1. **Smallest safe fix** — ~15 lines of code, localized to plugin init
2. **Preserves architecture** — `hivefiver` remains the authoritative agent for `hm-init`
3. **No architectural compromise** — doesn't change command-agent bindings
4. **Follows existing patterns** — plugin already manages skill injection and SDK context at startup
5. **Addresses root cause** — the missing agent file IS the root cause, not the command definition

### Implementation Note

The agent projection should be minimal — just the frontmatter and body from `agents/hivefiver.deprecated.md`. It should NOT include the `contract:` frontmatter section (that's internal). The `projectRuntimeFrontmatter` function in `opencode-agent-registry.ts` already handles this filtering for the runtime projection.

---

## What Code Changes Are Needed

### File: `src/plugin/opencode-plugin.ts`

Add `ensureAgentProjection()` call before `initSkillInjection()`:

```typescript
export const HiveMindPlugin: Plugin = async (input) => {
  const directory = input.directory
  await ensureAgentProjection(directory)  // NEW: project hivefiver.md if missing
  initSkillInjection(directory)
  initSdkContext(input)
  // ... rest unchanged
}
```

### File: `src/shared/opencode-agent-registry.ts` (optional enhancement)

Export `projectRuntimeFrontmatter` and `renderRuntimeMarkdown` so the plugin can reuse them for agent projection, instead of duplicating the logic.

---

## Regression Check

After the fix:
1. Fresh install with no `.opencode/agents/` → plugin loads → `hivefiver.md` auto-created → `/hm-init` works
2. Existing install with `.opencode/agents/hivefiver.md` → plugin loads → no-op (file already exists)
3. All existing tests should pass (no behavioral change to command execution)
4. `npx tsc --noEmit` should pass (no new type errors)

---

## Design Flaw Flag

**None.** The root cause is a missing bootstrap step, not a design flaw. The architecture correctly specifies that `hivefiver` is the agent for `hm-init`. The gap was that no code ensured the agent file existed before the command tried to use it.
