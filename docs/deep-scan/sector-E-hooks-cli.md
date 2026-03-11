# Sector E: Hooks & CLI

## File Inventory

| Filename | LOC | Primary Responsibility |
|----------|-----|------------------------|
| `src/hooks/event-handler.ts` | 514 | OpenCode session event processing (session.created, session.idle, session.compacted, file.edited, session.diff, todo.updated) |
| `src/hooks/index.ts` | 21 | Barrel exports for all hooks |
| `src/hooks/session_coherence/index.ts` | 7 | Barrel export for session coherence hooks |
| `src/hooks/session_coherence/main_session_start.ts` | 189 | First-turn prompt transformation with last session context |
| `src/hooks/soft-governance.ts` | 870 | Counter/detection engine - fires after every tool call |
| `src/hooks/tool-gate.ts` | 458 | Advisory tool gate - governance enforcement before tool execution |
| `src/hooks/compaction.ts` | 240 | Compaction hook - preserves hierarchy context across LLM compaction |
| `src/hooks/session-lifecycle.ts` | 391 | Prompt compilation engine - system prompt injection every turn |
| `src/hooks/messages-transform.ts` | 826 | Message transformation - first-turn coherence, cognitive context, checklist |
| `src/hooks/sdk-context.ts` | 107 | SDK context management - client, shell, serverUrl, project refs |
| `src/cli/init.ts` | 906 | Project initialization - creates .hivemind structure and config |
| `src/cli/interactive-init.ts` | 376 | Interactive setup wizard using @clack/prompts |
| `src/cli/sync-assets.ts` | 723 | Asset synchronization - copies OpenCode assets to project/global |
| `src/cli/scan.ts` | 39 | CLI scan command wrapper around hivemind_inspect tool |
| `src/index.ts` | 190 | Plugin entry point - registers tools and hooks with OpenCode SDK |

---

## Hook System Architecture

### Hook Types and Registration

The HiveMind plugin registers **6 hooks** with the OpenCode SDK via `src/index.ts`:

```typescript
return {
  event: createEventHandler(log, effectiveDir),
  tool: { /* 16 canonical tools */ },
  "experimental.chat.system.transform": createSessionLifecycleHook(...),
  "experimental.chat.messages.transform": createMessagesTransformHook(...),
  "tool.execute.after": createSoftGovernanceHook(...),
  "tool.execute.before": createToolGateHook(...),
  "experimental.session.compacting": createCompactionHook(...),
}
```

### Hook Trigger Matrix

| Hook | Trigger | Purpose |
|------|---------|---------|
| `event` | OpenCode runtime events | Session lifecycle tracking, TODO sync, staleness detection |
| `experimental.chat.system.transform` | Every LLM turn | Governance instruction injection, status blocks |
| `experimental.chat.messages.transform` | Every LLM turn | Cognitive context, first-turn coherence, pre-stop checklist |
| `tool.execute.before` | Before every tool call | Advisory governance checks (never blocks - HC1 compliance) |
| `tool.execute.after` | After every tool call | Counter/detection engine, metrics tracking, violations |
| `experimental.session.compacting` | Context compaction | Preserve hierarchy/context across compaction boundary |

---

## Event Handler Flow

### Event Types Handled (`src/hooks/event-handler.ts`)

1. **session.created**
   - Logs new session ID
   - Calls `ensureSessionCreatedBootstrap()`:
     - Creates/initializes brain.json if missing
     - Classifies lineage scope (framework-meta, product-impl, research)
     - Creates hierarchy tree if missing
     - Creates session profile file

2. **session.idle**
   - Increments `user_turn_count` (V3.0 feature)
   - Runs staleness check via `getStalenessInfo()`
   - If stale: registers "drift" governance signal
   - **CQRS**: Queues mutation via `queueStateMutation()` (no direct save)

3. **session.compacted**
   - Registers "compaction" governance signal
   - **CQRS**: Queues mutation (hooks are read-only)

4. **file.edited**
   - Debug logging only

5. **session.diff**
   - Debug logging only

6. **todo.updated**
   - Parses raw todos from event
   - Detects auto-realignment signals
   - Transforms to HiveMind task schema with:
     - Related entities (session_id, plan_id, phase_id, etc.)
     - Menu step tracking
     - Auto-initiate flags
   - Queues task manifest mutation
   - Detects terminal tasks → queues `pending_purge` flag

### CQRS Compliance

All event handlers use `queueStateMutation()` and `queueTaskManifestMutation()` instead of direct saves. This ensures:
- Hooks remain read-only
- Mutations are applied atomically at tool boundaries
- No race conditions between hooks and tools

---

## Session Coherence Hook

### Purpose (`src/hooks/session_coherence/main_session_start.ts`)

Injects last session context into **first turn** of a new session to maintain continuity across sessions.

### Flow

1. **Detect First Turn**: `detectFirstTurn(state)` checks if turn_count === 0
2. **Find User Message**: Locates last non-synthetic user message
3. **Load Last Session Context**: From archive via `loadLastSessionContext(directory)`
4. **Build Transformed Prompt**: Merges user message with context:
   - maxTasks: 5
   - maxMems: 3
   - maxTodos: 10
   - includeAnchors: true
   - budget: 2500 chars
5. **Prepend Synthetic Part**: Injects as hidden synthetic message part

### Message Format Support

Supports both V2 (parts array) and legacy (content array) message formats:
- `MessageWithParts`: `{ info: Message, parts: Part[] }`
- `LegacyMessage`: `{ role, content, synthetic }`

---

## CLI Commands

### 1. `init.ts` - Project Initialization

**Command**: `npx hivemind-context-governance --mode assisted`

**Creates**:
```
.hivemind/
├── INDEX.md             (root state entry point)
├── state/               (brain, hierarchy, anchors, tasks)
├── memory/              (mems + manifest)
├── sessions/
│   ├── active/          (current session file)
│   ├── manifest.json    (session registry)
│   └── archive/         (completed sessions)
├── plans/               (plan registry)
├── project/
│   └── planning/        (canonical readable planning root)
├── codemap/             (SOT manifest)
├── codewiki/            (SOT manifest)
├── docs/                (10-commandments.md)
├── templates/
│   └── session.md       (session template)
├── logs/                (runtime logs)
└── config.json          (governance settings)
```

**Profile Presets**:
- `beginner`: Maximum guidance, asks before acting
- `intermediate`: Balanced automation (recommended)
- `advanced`: Permissive, outline responses, full control
- `expert`: Minimal guidance, terse responses
- `coach`: Strict governance, skeptical, maximum guidance

**Key Functions**:
- `registerPluginInConfig()`: Auto-registers in opencode.json
- `injectAgentsDocs()`: Appends HiveMind section to AGENTS.md/CLAUDE.md
- `applyProfilePreset()`: Generates config from preset
- `ensureHiveFiverDefaultsInOpencode()`: Adds HiveFiver v2 defaults

### 2. `interactive-init.ts` - Guided Setup Wizard

**Uses**: `@clack/prompts` for interactive CLI

**Prompts**:
1. Profile selection (beginner/intermediate/advanced/expert/coach)
2. Governance mode (assisted/strict/permissive)
3. Language (English/Tiếng Việt)
4. Automation level (manual/guided/assisted/full/coach)
5. Expert level (beginner/intermediate/advanced/expert)
6. Output style (explanatory/outline/skeptical/architecture/minimal)
7. Additional constraints (code review, TDD)
8. Asset sync target (project/global/both)
9. Asset sync mode (none/core/balanced/full)

**Returns**: `InitOptions` object for `initProject()`

### 3. `sync-assets.ts` - Asset Synchronization

**Asset Groups**:
- `commands`: Markdown files with frontmatter
- `skills`: SKILL.md files, registry.yaml
- `agents`: Markdown files with permission schema
- `workflows`: YAML/JSON workflow definitions
- `templates`: Reusable templates
- `prompts`: Prompt templates
- `references`: Reference documentation

**Profiles**:
- `core`: commands, skills, agents, workflows
- `balanced`: core + templates, references
- `full`: balanced + prompts
- `legacy-compat`: full + legacy assets

**Features**:
- Smart frontmatter merging (preserves user-customized fields)
- Validation for each asset type
- Parity checking (source vs target)
- Pruning orphaned files
- Backup on overwrite

### 4. `scan.ts` - CLI Scan Command

**Actions**:
- `status` → `hivemind_inspect` action: "scan"
- `analyze` → `hivemind_inspect` action: "deep"
- `recommend` → `hivemind_inspect` action: "scan"
- `orchestrate` → `hivemind_inspect` action: "scan"

Thin wrapper around the `hivemind_inspect` tool.

---

## Init Flow

### Initialization Sequence

```
npx hivemind-context-governance --mode assisted
                    │
                    ▼
        ┌─────────────────────┐
        │  interactive-init.ts │ (if no flags)
        │  @clack/prompts      │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │     init.ts         │
        │   initProject()     │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌─────────────┐
│ Config │  │ Brain    │  │ Planning    │
│ Create │  │ State    │  │ Directory   │
└────────┘  └──────────┘  └─────────────┘
    │              │              │
    └──────────────┼──────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌─────────────┐
│ Plugin │  │ Agents   │  │ Asset Sync  │
│ Regis- │  │ Docs     │  │ .opencode/  │
│ ter    │  │ Inject   │  │             │
└────────┘  └──────────┘  └─────────────┘
```

### Profile vs Manual Path

1. **Profile Path** (when `--profile` is provided):
   - Uses `applyProfilePreset()` to generate config
   - Applies preset permissions to opencode.json
   - Simplified, opinionated setup

2. **Manual Path** (when flags are provided individually):
   - Validates each option individually
   - Creates config via `createConfig()`
   - More granular control

---

## Auto-Init Logic

### Bootstrap Gate (from `src/index.ts`)

When config.json is NOT found:

1. `session-lifecycle.ts` checks `existsSync(configPath)`
2. If missing, injects setup guidance block:
   ```typescript
   output.system.push(await generateSetupGuidanceBlock(directory))
   output.system.push(STATE_BOOTSTRAP_STOP_DIRECTIVE)
   ```
3. Returns early without initializing brain state

### Auto-Init Trigger Points

1. **CLI Command**: `npx hivemind-context-governance --mode assisted`
2. **Bootstrap Tool**: `hivemind_bootstrap` tool (manual fallback)
3. **Governance Denial**: When brain state is missing, tools receive denial message

### First-Run Detection

```typescript
// In session-lifecycle.ts
if (!existsSync(configPath)) {
  output.system.length = 0
  output.system.push(await generateSetupGuidanceBlock(directory))
  output.system.push(STATE_BOOTSTRAP_STOP_DIRECTIVE)
  return
}
```

---

## Plugin Bootstrap

### Entry Point (`src/index.ts`)

```typescript
export const HiveMindPlugin: Plugin = async ({
  directory,
  worktree,
  client,
  $: shell,
  serverUrl,
  project,
}) => {
  const effectiveDir = worktree || directory

  // 1. Store SDK refs in module singleton
  initSdkContext({ client, $: shell, serverUrl, project })

  // 2. Create logger
  const log = await createLogger(logDir, "HiveMind")

  // 3. Load config for logging only (hooks re-read each invocation)
  const initConfig = await loadConfig(effectiveDir)

  // 4. Regenerate manifests
  await regenerateManifests(effectiveDir)

  // 5. Wire file watcher to event bus
  fileWatcher.on("event", (event) => eventBus.emitEvent(event))
  fileWatcher.watchDirectory(effectiveDir)

  // 6. Return hooks + tools
  return {
    event: createEventHandler(log, effectiveDir),
    tool: { /* 16 tools */ },
    "experimental.chat.system.transform": createSessionLifecycleHook(...),
    "experimental.chat.messages.transform": createMessagesTransformHook(...),
    "tool.execute.after": createSoftGovernanceHook(...),
    "tool.execute.before": createToolGateHook(...),
    "experimental.session.compacting": createCompactionHook(...),
  }
}
```

### Tool Registration (16 Canonical Tools)

```typescript
tool: {
  hivemind_session: createHivemindSessionTool(effectiveDir),
  hivemind_inspect: createHivemindInspectTool(effectiveDir),
  hivemind_memory: createHivemindMemoryTool(effectiveDir),
  hivemind_anchor: createHivemindAnchorTool(effectiveDir),
  hivemind_hierarchy: createHivemindHierarchyTool(effectiveDir),
  hivemind_cycle: createHivemindCycleTool(effectiveDir),
  hivemind_context: createHivemindContextTool(effectiveDir),
  hivemind_session_memory: createHivemindSessionMemoryTool(effectiveDir),
  hivemind_codemap: createHivemindCodemapTool(effectiveDir),
  hivemind_ideate: createHivemindIdeateTool(effectiveDir),
  hivemind_read_skeleton: createHivemindReadSkeletonTool(effectiveDir),
  hivemind_precision_patch: createHivemindPrecisionPatchTool(effectiveDir),
  hivemind_mesh_pull: createHivemindMeshPullTool(effectiveDir),
  hivemind_doc_weaver: createHivemindDocWeaverTool(effectiveDir),
  hivemind_plan: createHivemindPlanTool(effectiveDir),
  hivemind_bootstrap: createHivemindBootstrapTool(effectiveDir),
}
```

---

## Cross-Sector Dependencies

### Dependencies on Other Sectors

| Sector | Dependencies |
|--------|--------------|
| **Session** | `brain-state.ts`, `persistence.ts`, `staleness.ts` |
| **Planning** | `planning-fs.ts`, `plan-fs.ts`, `graph-io.ts` |
| **Detection** | `detection.ts`, `chain-analysis.ts`, `long-session.ts` |
| **Hierarchy** | `hierarchy-tree.ts`, `graph-io.ts` |
| **Governance** | `governance-instruction.ts`, `gatekeeper.ts`, `entity-checklist.ts` |
| **Memory** | `anchors.ts`, `graph-io.ts` (mems) |
| **Budget** | `budget.ts`, `injection-orchestrator.ts` |

### Hooks → Tools Communication

1. **CQRS Pattern**: Hooks queue mutations, tools flush them
2. **State Queue**: `queueStateMutation()` → `flushMutations()`
3. **Shared State**: Hooks read brain.json, tools write brain.json

### SDK Context Sharing

```typescript
// hooks/sdk-context.ts stores refs at plugin init
initSdkContext({ client, $: shell, serverUrl, project })

// Other hooks access via getters
const client = getClient()
const shell = getShell()
const project = getProject()
```

---

## Knowledge Gaps

### After Deep Scan

1. **Tool Implementation Details**: The `src/tools/` directory was not scanned. Need to understand:
   - How tools implement CQRS flush
   - Tool schema definitions
   - Error handling patterns

2. **Lib Directory**: Key utilities not fully explored:
   - `detection.ts` - Governance counter logic
   - `injection-orchestrator.ts` - Budget management
   - `cognitive-packer.ts` - Context packing
   - `session_coherence.ts` - Last session loading

3. **Auto-Commit Flow**: `soft-governance.ts` references auto-commit:
   - `shouldAutoCommit()` logic
   - `executeAutoCommit()` implementation
   - Git integration details

4. **File Watcher**: `fileWatcher` is wired but implementation unclear:
   - What events trigger?
   - How does event bus work?

5. **Toast Throttling**: `toast-throttle.ts` is imported but not scanned:
   - How are toasts throttled per event type?
   - Cooldown logic

6. **Framework Context**: `framework-context.ts` detects conflicts:
   - How does `detectFrameworkContext()` work?
   - What frameworks are detected?

7. **Runtime Session Lineage**: Child session detection:
   - `resolveRuntimeSessionLineage()` implementation
   - How are child sessions created?

---

## Summary

The **Hooks & CLI sector** is the **nervous system** of HiveMind:

- **6 Hooks** intercept every turn, tool call, and session event
- **4 CLI commands** provide project initialization and asset management
- **CQRS compliance** ensures hooks remain read-only
- **Budget management** prevents context explosion
- **Profile presets** simplify onboarding for different user types

The architecture follows **single responsibility**: each hook has a specific job, mutations are queued (never direct), and the SDK context is safely shared via module singletons.
