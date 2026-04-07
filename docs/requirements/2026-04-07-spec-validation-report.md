# HiveMind Checkpoint Harness — Updated Spec Validation Report

**Date:** 2026-04-07
**Source:** OpenCode official documentation (mintlify.com) + local reference files
**Spec:** `docs/superpowers/specs/2026-04-07-hivemind-checkpoint-harness-design.md`
**Previous Report:** `docs/requirements/2026-04-07-spec-validation-report.md`

---

## Executive Summary

The original spec assumed 3 non-existent APIs (`Session.setPermission()`, `PermissionNext.disabled()`, `PRUNE_PROTECTED_TOOLS`). After auditing the actual OpenCode primitives, we found that **the same user-facing behavior can be achieved using native OpenCode features** — no plugin hacks needed. The architecture shifts from "plugin-driven dynamic permissions" to "configuration-driven multi-state profiles + command orchestration."

**VERDICT: UNBLOCKED — All 3 critical gaps have native OpenCode equivalents.**

---

## Gap Resolution: Native OpenCode Primitives

### Gap 1: `Session.setPermission()` → Multi-State Agent Profiles + `permission.ask` Hook

**What was assumed:** A dynamic API to change permissions mid-session.

**What actually exists (TWO native approaches):**

#### Approach A: Multi-State Agent Profiles (Configuration-Based)

OpenCode natively supports defining multiple agents with different permission profiles. Users switch between them via Tab key or programmatically:

```json
{
  "agent": {
    "harness-phase-0": {
      "description": "Discovery phase. Only read, question, and skill tools.",
      "mode": "primary",
      "permission": {
        "edit": "deny",
        "bash": { "*": "deny", "git status*": "allow" },
        "task": { "*": "deny", "explore": "allow" }
      }
    },
    "harness-phase-1": {
      "description": "Implementation phase 1. Edit allowed in src/types/ only.",
      "mode": "primary",
      "permission": {
        "edit": { "*": "deny", "src/types/**": "allow" },
        "bash": { "*": "ask", "bun test*": "allow" },
        "task": { "*": "deny", "phase-worker": "allow", "code-critic": "allow" }
      }
    },
    "harness-phase-2": {
      "description": "Implementation phase 2. Edit allowed in src/handlers/ only.",
      "mode": "primary",
      "permission": {
        "edit": { "*": "deny", "src/handlers/**": "allow" },
        "bash": { "*": "ask", "bun test*": "allow" }
      }
    },
    "harness-review": {
      "description": "Review/audit phase. Read-only with bash for tests.",
      "mode": "primary",
      "permission": {
        "edit": "deny",
        "bash": { "*": "ask", "bun test*": "allow", "git diff*": "allow" }
      }
    }
  }
}
```

**How it works for the harness:**
1. `harness init` generates all phase agent profiles
2. Orchestrator instructs user (or auto-switches) to the correct phase agent
3. Each agent has pre-configured permissions matching its phase scope
4. No dynamic permission changes needed — the agent definition IS the gate

#### Approach B: `permission.ask` Hook (Plugin-Based)

The plugin intercepts permission requests and auto-approves/denies based on gate state:

```typescript
'permission.ask': async (permission, output) => {
  const state = await loadGateState(ctx.directory)
  if (isPermissionAllowed(permission, state)) {
    output.status = 'allow'
  } else {
    output.status = 'deny'
    output.message = `Permission denied. Current phase: ${state.currentPhase}.`
  }
}
```

**Recommendation:** Use Approach A for the MVP (zero plugin complexity, fully native). Approach B is an enhancement for users who want dynamic gating without switching agents.

---

### Gap 2: `PermissionNext.disabled()` → Command + Agent Tool Restrictions

**What was assumed:** A programmatic way to hide tools from the LLM.

**What actually exists:**

#### Native Tool Restrictions per Agent

```json
{
  "agent": {
    "harness-phase-0": {
      "tools": {
        "write": false,
        "edit": false,
        "bash": false,
        "read": true,
        "grep": true,
        "glob": true,
        "skill": true
      }
    }
  }
}
```

When `tools.write: false`, the write tool is completely removed from the LLM's tool list. This is the native equivalent of `PermissionNext.disabled()`.

#### Command-Based Tool Gating

Commands can target specific agents, and agents have tool restrictions. The harness can use commands to route work to the right agent profile:

```json
{
  "command": {
    "harness-execute": {
      "template": "Execute the current phase task. Load the phase skill via the skill tool first.",
      "agent": "harness-phase-1",
      "subtask": true
    },
    "harness-review": {
      "template": "Review the work completed in the last phase. Check against requirements.",
      "agent": "harness-review",
      "subtask": true
    }
  }
}
```

---

### Gap 3: `PRUNE_PROTECTED_TOOLS` → `experimental.session.compacting` Hook

**What was assumed:** A platform constant protecting specific tools from pruning.

**What actually exists:**

The `experimental.session.compacting` hook lets plugins inject context that survives compaction:

```typescript
'experimental.session.compacting': async (input, output) => {
  const state = await loadGateState(ctx.directory)
  output.context.push(
    `HARNESS STATE: Phase ${state.currentPhase}, Task ${state.currentTask}. ` +
    `Unlocked: ${state.unlocked.join(', ')}. ` +
    `Gate retries: ${JSON.stringify(state.gateRetries)}. ` +
    `After compaction: 1) Read .hivemind/session-agents-trackpad/ for your pad. ` +
    `2) Read .hivemind/requirements.lock.json. 3) Reload skill tool.`
  )
}
```

Additionally, the orchestrator agent's self-setup protocol reads state from `.hivemind/` files on every turn, making compaction recovery automatic regardless of what's pruned.

---

## Native OpenCode Primitives Inventory

| Feature Needed | Native Primitive | How It Works |
|---|---|---|
| **Phase-gated tool access** | Multi-state agent profiles + `permission` | Each phase agent has scoped permissions |
| **Hidden tools per phase** | Agent `tools` config (deprecated but works) or `permission` | `"edit": "deny"` removes edit from tool list |
| **Phase-specific instructions** | Commands with `$ARGUMENTS` + Skills | `/harness-execute phase-1` loads skill |
| **Template injection** | Commands with `!bash` + `@file` | Shell output and file refs in prompts |
| **Review/validation subagent** | `subtask: true` on commands | Forces subagent invocation in child session |
| **Cross-dependency validation** | `permission.task` + hidden agents | Orchestrator controls which subagents are available |
| **Compaction resilience** | `experimental.session.compacting` hook | Injects state into compaction prompt |
| **Dynamic permission gating** | `permission.ask` plugin hook | Intercepts and auto-approves/denies |
| **File-based state** | `.hivemind/` directory | JSON files read by orchestrator on every turn |
| **User-to-agent dialogue** | `question` permission | `permission.question: "allow"` enables question tool |
| **LSP gate validation** | LSP tool (experimental) | Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true` |

---

## Revised Architecture: Native-First Approach

### Package Structure (Unchanged)

```
packages/
├── kernel/         Pure state engine (Zod v4 schemas, gate evaluation, pad store)
├── cli/            Build-time validation + runtime management (4 commands)
└── assets/         .opencode/ templates (agents, commands, skills)
```

**Note:** The `plugin/` package is now OPTIONAL. The core harness works entirely through native OpenCode configuration. The plugin is an enhancement for users who want dynamic `permission.ask` gating and `experimental.session.compacting` injection.

### What `harness init` Generates

```
.hivemind/
├── session-agents-trackpad/   # Pad JSON files (max 3)
├── reviews/                   # Review verdict JSON files
├── templates/                 # Phase prompt templates
├── plans/
│   └── pipeline.md            # Human-readable pipeline state
└── requirements.lock.json     # Locked requirements (Phase 0 output)

.opencode/
├── agents/
│   ├── harness-phase-0.md     # Discovery: read + question only
│   ├── harness-phase-1.md     # Implementation: edit src/types/
│   ├── harness-phase-2.md     # Implementation: edit src/handlers/
│   ├── harness-phase-3.md     # Testing: edit tests/
│   ├── harness-review.md      # Review: read-only + bash tests
│   └── harness-audit.md       # Audit: read-only + full bash
├── commands/
│   ├── harness-execute.md     # Execute current phase task
│   ├── harness-review.md      # Review completed work
│   ├── harness-next.md        # Advance to next phase
│   └── harness-status.md      # Show current state
└── skills/
    ├── gate-review/           # Review protocol
    ├── onboarding/            # Tool usage + conventions
    ├── api-types/             # Example: type definitions
    ├── http-handlers/         # Example: handlers
    └── testing/               # Example: test patterns
```

### Checkpoint-Gate-Unlock Loop (Native)

```
User runs: /harness-execute phase-1

1. Command routes to harness-phase-1 agent (pre-configured permissions)
2. Agent loads phase-1 skill via skill tool
3. Agent executes task within permission scope (edit src/types/ only)
4. User runs: /harness-review
5. Command routes to harness-review agent (subtask: true)
6. Review agent validates work, writes .hivemind/reviews/phase-1-1.json
7. If approved: user switches to harness-phase-1 (Tab key) for next task
8. If rejected: user stays on harness-phase-1, agent fixes issues
9. After all phase-1 tasks pass: user switches to harness-phase-2 (Tab key)
```

### Plugin Enhancement (Optional)

For users who want fully automated gating without manual agent switching:

```typescript
// .opencode/plugins/harness-gate.ts
import { Plugin } from '@opencode-ai/plugin'

export const HarnessGatePlugin: Plugin = async (ctx) => {
  return {
    // Auto-gate permissions based on current phase state
    'permission.ask': async (permission, output) => {
      const state = await loadGateState(ctx.directory)
      if (isAllowedForPhase(permission, state)) {
        output.status = 'allow'
      }
    },

    // Preserve state during compaction
    'experimental.session.compacting': async (input, output) => {
      const state = await loadGateState(ctx.directory)
      output.context.push(buildCompactionContext(state))
    },

    // Custom gate-check tool
    tool: {
      gate_check: tool({
        description: 'Validate current phase/task against gate conditions',
        args: { phase: tool.schema.string(), task: tool.schema.string() },
        async execute(args, ctx) {
          return evaluateGate(args.phase, args.task, ctx.directory)
        },
      }),
    },
  }
}
```

---

## What Changes from the Original Spec

| Original Spec | Revised (Native-First) | Impact |
|---|---|---|
| `Session.setPermission()` API | Multi-state agent profiles in `opencode.json` | Simpler, no plugin needed |
| `PermissionNext.disabled()` | Agent `tools` config + `permission` deny | Native, documented |
| `PRUNE_PROTECTED_TOOLS` constant | `experimental.session.compacting` hook | Works, documented |
| Plugin is REQUIRED | Plugin is OPTIONAL enhancement | Smaller MVP surface |
| Dynamic permission changes | Static agent profiles + Tab switching | User-visible, explicit |
| `permission.ask` as workaround | `permission.ask` as optional enhancement | Same hook, different role |

---

## What the Spec Got Right (Confirmed)

1. ✅ **Plugin hook architecture** — `tool.execute.after`, `tool.definition`, `event`, `experimental.chat.system.transform`, `experimental.session.compacting` all exist
2. ✅ **Task delegation with permissions** — `permission.task` for subagent control is fully supported
3. ✅ **File-based state persistence** — `.hivemind/` JSON files are the right approach
4. ✅ **Prompt injection via system.transform** — `output.system.push()` is the correct API
5. ✅ **Custom tools via `tool()` helper** — Fully supported, any language for implementation
6. ✅ **Agent definitions with permissions** — Per-agent permission configuration is fully supported
7. ✅ **Commands with $ARGUMENTS** — Positional params ($1, $2, $3) and $ARGUMENTS work
8. ✅ **Commands with !bash** — Shell output injection into prompts works
9. ✅ **Commands with @file** — File reference inclusion works
10. ✅ **Commands with subtask: true** — Forces subagent invocation in child session
11. ✅ **Skill loading with permissions** — Per-agent skill permissions via `permission.skill`
12. ✅ **Hidden agents** — `hidden: true` for internal subagents
13. ✅ **Compaction config** — `compaction.auto`, `compaction.prune`, `compaction.reserved`

---

## Updated Plugin Hook Inventory

| Hook | Status | Purpose in Harness |
|---|---|---|
| `tool.execute.after` | ✅ | Detect review completion, log audit trail |
| `tool.definition` | ✅ | Augment tool descriptions with phase context |
| `event` | ✅ | Monitor session events for audit trail |
| `experimental.chat.system.transform` | ✅ | Inject `<harness_context>` with current phase state |
| `experimental.session.compacting` | ✅ | Preserve harness state during compaction |
| `permission.ask` | ✅ | **Optional** — Dynamic permission gating |
| `tool` (custom) | ✅ | Register `gate-check` tool |

---

## Conclusion

The harness can be built entirely using **native OpenCode primitives** — agents, commands, skills, permissions, and compaction config. The plugin layer is an **optional enhancement** for users who want dynamic gating and automated state injection.

**MVP scope:** Kernel (schemas + gate evaluation) + CLI (init/validate/status/reset) + Assets (agents/commands/skills). No plugin required.

**Enhancement scope:** Plugin with `permission.ask` hook + `experimental.session.compacting` + custom `gate-check` tool.

This is significantly simpler than the original spec and has zero dependency on non-existent APIs.
