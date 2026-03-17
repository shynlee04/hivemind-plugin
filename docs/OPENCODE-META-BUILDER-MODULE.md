# OpenCode: Meta-Builder Agent Orchestration — A Deep Architectural Analysis

Below is a precise, source-grounded breakdown of all five dimensions you asked about. Every claim is tied directly to code.

---

## 1. Agent Discovery, Routing, and Capability Matching

### The Agent Registry

The canonical registry of all agents is built lazily per-project instance inside `Agent.state()`. Each agent is typed by an `Agent.Info` schema that carries the critical routing discriminator: a `mode` field with values `"subagent"`, `"primary"`, or `"all"`. [1](#4-0) 

Native built-in agents (`build`, `plan`, `general`, `explore`, `compaction`, `title`, `summary`) form the baseline. User-defined agents are merged in from config, and their `mode` can be explicitly overridden. [2](#4-1) 

`Agent.list()` sorts agents so the configured `default_agent` (or `"build"`) appears first — this is the primary routing signal for the UI and CLI. [3](#4-2) 

`Agent.defaultAgent()` enforces guard rails: it refuses to route to a `subagent`-mode or `hidden` agent as the primary: [4](#4-3) 

### The TaskTool — The Routing Engine

The actual orchestration router is `TaskTool`. When a primary agent needs to delegate work it:

1. Calls `Agent.list()` and **filters out `"primary"` mode agents** — subagents only.
2. Further filters by **permission evaluation**: `PermissionNext.evaluate("task", a.name, caller.permission)` — if the caller's ruleset denies a subagent by name, it's invisible. [5](#4-4) 

This means the **tool description itself is dynamically generated** with only accessible agents listed, preventing the LLM from even knowing about agents it cannot invoke. The `subagent_type` parameter guides the LLM to select from this filtered list. [6](#4-5) 

### Capability Matching via `@agent` Mention Parts

For user-driven routing, an `AgentPart` is embedded in the message. `resolvePromptParts()` parses `@name` tokens: if the name matches an `Agent.get(name)`, it creates an `AgentPart`; otherwise it falls back to file lookup. [7](#4-6) 

Inside `createUserMessage()`, `AgentPart` is converted into a synthetic text instruction: `"Use the above message and context to generate a prompt and call the task tool with subagent: <name>"`, and the `bypassAgentCheck` flag is set to `true`, bypassing the user-facing permission prompt. [8](#4-7) 

### Tool Registry — Per-Model Capability Filtering

`ToolRegistry.tools()` further adapts the toolset to the active model and agent. For instance, `apply_patch` is provided instead of `edit`/`write` for specific GPT models, and `codesearch`/`websearch` are gated behind provider and feature flags. [9](#4-8) 

### AI-Assisted Agent Generation

For truly heterogeneous inputs, `Agent.generate()` uses an LLM to synthesize a new agent config (identifier, `whenToUse`, `systemPrompt`) from a natural-language description, with existing agent names excluded from the output: [10](#4-9) 

---

## 2. Persisting Investigation Artifacts and Context Across Session Boundaries

### The Parent–Child Session Graph

The core persistence structure is the **session graph**. Every subagent spawned by `TaskTool` lives in its own child session linked by `parentID`: [11](#4-10) 

The SQLite schema enforces this with an index on `parent_id`: [12](#4-11) 

### Task Resumption via `task_id`

The most critical mechanism for cross-boundary persistence is the `task_id` parameter. When a subagent produces a `task_id` in its output, the orchestrating agent can pass it back in a future call to **resume the exact same child session**, preserving all message history and tool outputs: [13](#4-12) 

The task output always surfaces the `task_id`: [14](#4-13) 

This is the primary mechanism for cross-session research graph continuity. The task description in `task.txt` makes it explicit: [15](#4-14) 

### Snapshot-Based Filesystem State Persistence

Every agentic step records a git tree hash snapshot using a **shadow git repository** in the data directory. This captures the filesystem state at each step boundary: [16](#4-15) 

`PatchPart` records which files changed between steps, enabling full revert of any agentic action: [17](#4-16) 

### Large Output Artifacts via `Truncate`

When tool output exceeds 2000 lines or 50 KB, `Truncate.output()` writes the full content to `$DATA/tool-output/` (7-day retention) and injects a path reference. Orchestrator agents with `task` permission receive a hint to **delegate reading to an `explore` subagent** rather than loading it into their own context: [18](#4-17) 

### `Todo` as a Persistent In-Session State Graph

The `Todo` namespace provides a structured, database-backed task list per session. This is a lightweight "context graph" for compound workflows — agents write their plan as todos and update status as they proceed: [19](#4-18) 

Importantly, `todowrite` and `todoread` are **denied in subagent sessions** by default (the orchestrator owns the todo list): [20](#4-19) 

### Instruction Files as Cross-Session Context Graphs

`InstructionPrompt` loads `AGENTS.md` / `CLAUDE.md` files walking up the directory tree, injecting them into every session's system prompt. This is the mechanism for project-level persistent context that survives all session boundaries: [21](#4-20) 

---

## 3. Maintaining STATE and Avoiding Context Rot in Compound Workflows

### The Main Loop — Cycle Nesting with Guarded Iteration

The `SessionPrompt.loop()` function is the atomic cycle engine. It is a `while(true)` loop that at each iteration:

1. Reads `MessageV2.filterCompacted()` — skips compacted (summarized) historical messages.
2. Checks for pending `SubtaskPart` — executes inline task cycles before resuming normal processing.
3. Checks for pending `CompactionPart` — runs the compaction cycle before resuming.
4. Checks for context overflow — creates a compaction if needed.
5. Proceeds to normal LLM processing. [22](#4-21) 

This loop design ensures that **compaction and subtask cycles are nested atomically** — they always resolve before the outer loop advances.

### Automatic Context Compaction

`SessionCompaction.isOverflow()` computes whether the current token count (with a configurable buffer, defaulting to `min(20000, maxOutputTokens)`) has exceeded the usable context window: [23](#4-22) 

When overflow is detected mid-step (inside `SessionProcessor`), `needsCompaction` is set and the processor returns `"compact"`, causing the loop to create a `CompactionPart` and restart: [24](#4-23) 

### Compaction as Research Synthesis

`SessionCompaction.process()` invokes a dedicated `"compaction"` agent (with all tools denied) to write a structured summary template covering: **Goal, Instructions, Discoveries, Accomplished, Relevant files**: [25](#4-24) 

Plugins can inject additional context or entirely replace the compaction prompt via `experimental.session.compacting`: [26](#4-25) 

### Output Pruning to Prevent Stale Context

`SessionCompaction.prune()` walks backwards through message history and **erases the `output` field** from old completed tool calls that exceed a 40,000-token "protect" window, replacing them with a `compacted` timestamp. The `"skill"` tool output is explicitly protected from pruning: [27](#4-26) 

### Step Reminders to Combat Context Drift

When `step > 1` and there are queued user messages (messages sent while the agent was mid-loop), the loop **ephemerally wraps** those messages in a `<system-reminder>` tag instructing the agent to address them and continue, without permanently modifying the stored message: [28](#4-27) 

### Max-Steps Guard and Agent Step Budget

Each agent can declare a `steps` limit. When `step >= maxSteps`, the loop injects a synthetic assistant prefix (`MAX_STEPS` text) to force the model to conclude rather than continue looping: [29](#4-28) [30](#4-29) 

---

## 4. Anti-Patterns to Avoid in Higher-Order Orchestration Agents

### Anti-Pattern 1: Doom Loops (Repetitive Identical Tool Calls)

`SessionProcessor` tracks a `DOOM_LOOP_THRESHOLD = 3`. If the last three tool parts in an assistant message share the same tool name and identical input, the `"doom_loop"` permission is triggered — which defaults to `"ask"` for all agents: [31](#4-30) [32](#4-31) 

The default ruleset sets `doom_loop: "ask"` explicitly: [33](#4-32) 

### Anti-Pattern 2: Unbounded Recursive Task Delegation

By default, `TaskTool` creates child sessions with `task: "deny"` unless the spawned agent's permission ruleset explicitly contains a `task` rule. This prevents uncontrolled recursive agent trees: [34](#4-33) 

### Anti-Pattern 3: Subagents Owning the Todo List

`todowrite` and `todoread` are denied in all subagent-spawned sessions. The orchestrator (primary agent) is the sole owner of the workflow task graph: [35](#4-34) 

### Anti-Pattern 4: Subagents Used as Primary Agents (and Vice Versa)

`Agent.defaultAgent()` throws if the configured default is a `subagent` or `hidden` agent. `TaskTool` filters out `"primary"` mode agents. This hard boundary prevents misuse at both ends of the delegation chain: [4](#4-3) [36](#4-35) 

### Anti-Pattern 5: Blocking the Orchestrator on Concurrent Subagents

`SessionPrompt.assertNotBusy()` and `Session.BusyError` prevent a session from being prompted while it's already in a loop. The correct pattern (confirmed by the task description) is to **launch multiple subagents concurrently using multiple tool calls in a single message**, not sequential calls: [37](#4-36) [38](#4-37) 

### Anti-Pattern 6: Disabling Compaction (Context Overflow Neglect)

`compaction.auto === false` opts out of auto-compaction. Given that OpenCode's architecture explicitly tracks `isOverflow()` against model context limits, disabling this for orchestration agents managing long compound workflows will result in API errors when the context window fills: [39](#4-38) 

### Anti-Pattern 7: Reading Large Files Directly in Orchestrator Context

`Truncate.output()` specifically instructs orchestrator agents (those with `task` permission) to **delegate reading of large truncated files to an `explore` subagent** via the `hasTaskTool()` check: [40](#4-39) [41](#4-40) 

---

## 5. Skill Ecosystem Integration, Command-Workflow Chaining, and Progressive Disclosure

### The Skill Discovery Pipeline

`Skill.state()` constructs the available skill set from multiple layered sources — each overrides the previous, creating precedence-based capability merging:

1. Global home directory: `~/.claude/skills/`, `~/.agents/skills/`
2. Project walk-up: `.claude/skills/`, `.agents/skills/` up to worktree root
3. `.opencode/skill/` directories
4. Config `skills.paths` (explicit paths)
5. Config `skills.urls` (remote, via `Discovery.pull()`) [42](#4-41) 

Remote skill discovery via `Discovery.pull()` fetches an `index.json`, downloads individual skill files into a cache directory, and returns the local paths: [43](#4-42) 

### Progressive Disclosure via `SkillTool`

`SkillTool` is the key progressive-disclosure mechanism. The tool description is **dynamically built** from `<available_skills>` XML listing only the `name` and `description` of accessible skills (filtered by `PermissionNext.evaluate("skill", skill.name, agent.permission)`). The **full skill content is not loaded into context** until the agent explicitly calls `skill("name")`: [44](#4-43) 

When invoked, the skill injects a `<skill_content>` block with full instructions, the base directory URL, and a sample file listing — giving the agent everything needed to use bundled scripts/references: [45](#4-44) 

The `"skill"` tool output is explicitly **protected from context pruning** in `SessionCompaction.prune()`: [46](#4-45) 

This means once a skill is loaded, it persists in context despite pruning of other tool outputs — the skill content is treated as "durable knowledge".

### Skill-to-Command Chaining

`Command` namespace unifies skills, MCP prompts, and user-defined commands under a single invocation interface. Skills are registered as commands with their name and description, but only if no command with that name already exists: [47](#4-46) 

The `Command.Info` schema includes a `subtask: boolean` flag. When `true`, the command is executed as a **subagent task** rather than inline in the primary session. The built-in `review` command uses this pattern: [48](#4-47) 

### Shell Command Integration — Workflow Chain Entry Points

`SessionPrompt.shell()` creates a complete assistant-tool-result message pair for a user-executed shell command, then **optionally resumes the session loop** if callbacks are queued. This bridges external tooling into the agent workflow without breaking the message structure: [49](#4-48) 

The `task.txt` description instructs the LLM: when a slash command is invoked, use `TaskTool` with the slash command invocation as the entire prompt — this is the workflow-chaining bridge between the command interface and the subagent system: [50](#4-49) 

### Plan Mode — The Ultimate Progressive Disclosure Pattern

The plan mode (`OPENCODE_EXPERIMENTAL_PLAN_MODE`) implements a structured 5-phase progressive disclosure workflow injected as a `<system-reminder>` into the user message. It explicitly gates each phase:

- **Phase 1**: Up to 3 parallel `explore` subagents, read-only
- **Phase 2**: Up to 1 `general` design agent
- **Phase 3**: Human review checkpoint via `question` tool
- **Phase 4**: Write final plan to a single permitted markdown file
- **Phase 5**: Call `plan_exit` tool to signal completion [51](#4-50) 

This enforces context isolation: each phase operates on a bounded scope, with context pollution prevented by funneling agent outputs through the plan file as the shared artifact, not through shared message history.

---

## Architecture Summary Diagram

```mermaid
graph TD
  "User Input" --> "SessionPrompt.loop()"
  "SessionPrompt.loop()" --> "Agent.defaultAgent()"
  "Agent.defaultAgent()" --> "Primary Agent (build/plan)"
  "Primary Agent (build/plan)" --> "ToolRegistry.tools()"
  "ToolRegistry.tools()" --> "TaskTool"
  "TaskTool" --> "Agent.list() filtered by mode + permission"
  "TaskTool" --> "Session.create(parentID)"
  "Session.create(parentID)" --> "Child Session (subagent)"
  "Child Session (subagent)" --> "SessionPrompt.loop() nested"
  "SessionPrompt.loop() nested" --> "SkillTool (lazy content)"
  "SessionPrompt.loop() nested" --> "Truncate outputs to files"
  "SessionPrompt.loop() nested" --> "task_id returned"
  "task_id returned" --> "TaskTool resume path"
  "SessionCompaction.isOverflow()" --> "CompactionPart queued"
  "CompactionPart queued" --> "SessionCompaction.process() summary"
  "SessionCompaction.process() summary" --> "SessionPrompt.loop() continues"
  "SessionCompaction.prune()" --> "Old tool outputs erased except skill"
  "Command.list()" --> "skill as command"
  "Command.list()" --> "subtask flag"
  "subtask flag" --> "TaskTool dispatch"
```

---

## Notes

1. **The mode field is the load-bearing routing primitive.** Any custom meta-builder agent should use `mode: "all"` if it needs to be invocable both as a primary agent and as a subagent, or `mode: "subagent"` to prevent accidental promotion to primary.

2. **`task_id` resumption is the only cross-session state bridge** for subagent sessions. There is no automatic cross-session memory propagation — the orchestrator must explicitly pass `task_id` to continue a prior subagent thread.

3. **Context pollution is architecturally prevented** by the fact that subagent sessions are isolated in their own `SessionTable` rows and only the final text output (not the full message history) is returned to the orchestrator. The orchestrator never sees the subagent's intermediate tool calls.

4. **The `"skill"` tool output is the one exception to context pruning** — it is explicitly in `PRUNE_PROTECTED_TOOLS`, making it the correct mechanism for injecting durable, domain-specific instructions that must survive long compound workflows.

5. **Compaction is not optional for multi-agent workflows.** Since child sessions inherit the parent model's context limits, long-running subagent sessions will hit overflow. The auto-compaction cycle is the proven mechanism for maintaining continuity.

### Citations

**File:** packages/opencode/src/agent/agent.ts (L24-49)
```typescript
  export const Info = z
    .object({
      name: z.string(),
      description: z.string().optional(),
      mode: z.enum(["subagent", "primary", "all"]),
      native: z.boolean().optional(),
      hidden: z.boolean().optional(),
      topP: z.number().optional(),
      temperature: z.number().optional(),
      color: z.string().optional(),
      permission: PermissionNext.Ruleset,
      model: z
        .object({
          modelID: z.string(),
          providerID: z.string(),
        })
        .optional(),
      variant: z.string().optional(),
      prompt: z.string().optional(),
      options: z.record(z.string(), z.any()),
      steps: z.number().int().positive().optional(),
    })
    .meta({
      ref: "Agent",
    })
  export type Info = z.infer<typeof Info>
```

**File:** packages/opencode/src/agent/agent.ts (L55-60)
```typescript
    const defaults = PermissionNext.fromConfig({
      "*": "allow",
      doom_loop: "ask",
      external_directory: {
        "*": "ask",
        [Truncate.GLOB]: "allow",
```

**File:** packages/opencode/src/agent/agent.ts (L117-129)
```typescript
        description: `General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.`,
        permission: PermissionNext.merge(
          defaults,
          PermissionNext.fromConfig({
            todoread: "deny",
            todowrite: "deny",
          }),
          user,
        ),
        options: {},
        mode: "subagent",
        native: true,
      },
```

**File:** packages/opencode/src/agent/agent.ts (L204-231)
```typescript
    for (const [key, value] of Object.entries(cfg.agent ?? {})) {
      if (value.disable) {
        delete result[key]
        continue
      }
      let item = result[key]
      if (!item)
        item = result[key] = {
          name: key,
          mode: "all",
          permission: PermissionNext.merge(defaults, user),
          options: {},
          native: false,
        }
      if (value.model) item.model = Provider.parseModel(value.model)
      item.variant = value.variant ?? item.variant
      item.prompt = value.prompt ?? item.prompt
      item.description = value.description ?? item.description
      item.temperature = value.temperature ?? item.temperature
      item.topP = value.top_p ?? item.topP
      item.mode = value.mode ?? item.mode
      item.color = value.color ?? item.color
      item.hidden = value.hidden ?? item.hidden
      item.name = value.name ?? item.name
      item.steps = value.steps ?? item.steps
      item.options = mergeDeep(item.options, value.options ?? {})
      item.permission = PermissionNext.merge(item.permission, PermissionNext.fromConfig(value.permission ?? {}))
    }
```

**File:** packages/opencode/src/agent/agent.ts (L256-263)
```typescript
  export async function list() {
    const cfg = await Config.get()
    return pipe(
      await state(),
      values(),
      sortBy([(x) => (cfg.default_agent ? x.name === cfg.default_agent : x.name === "build"), "desc"]),
    )
  }
```

**File:** packages/opencode/src/agent/agent.ts (L265-280)
```typescript
  export async function defaultAgent() {
    const cfg = await Config.get()
    const agents = await state()

    if (cfg.default_agent) {
      const agent = agents[cfg.default_agent]
      if (!agent) throw new Error(`default agent "${cfg.default_agent}" not found`)
      if (agent.mode === "subagent") throw new Error(`default agent "${cfg.default_agent}" is a subagent`)
      if (agent.hidden === true) throw new Error(`default agent "${cfg.default_agent}" is hidden`)
      return agent.name
    }

    const primaryVisible = Object.values(agents).find((a) => a.mode !== "subagent" && a.hidden !== true)
    if (!primaryVisible) throw new Error("no primary visible agent found")
    return primaryVisible.name
  }
```

**File:** packages/opencode/src/agent/agent.ts (L282-337)
```typescript
  export async function generate(input: { description: string; model?: { providerID: string; modelID: string } }) {
    const cfg = await Config.get()
    const defaultModel = input.model ?? (await Provider.defaultModel())
    const model = await Provider.getModel(defaultModel.providerID, defaultModel.modelID)
    const language = await Provider.getLanguage(model)

    const system = [PROMPT_GENERATE]
    await Plugin.trigger("experimental.chat.system.transform", { model }, { system })
    const existing = await list()

    const params = {
      experimental_telemetry: {
        isEnabled: cfg.experimental?.openTelemetry,
        metadata: {
          userId: cfg.username ?? "unknown",
        },
      },
      temperature: 0.3,
      messages: [
        ...system.map(
          (item): ModelMessage => ({
            role: "system",
            content: item,
          }),
        ),
        {
          role: "user",
          content: `Create an agent configuration based on this request: \"${input.description}\".\n\nIMPORTANT: The following identifiers already exist and must NOT be used: ${existing.map((i) => i.name).join(", ")}\n  Return ONLY the JSON object, no other text, do not wrap in backticks`,
        },
      ],
      model: language,
      schema: z.object({
        identifier: z.string(),
        whenToUse: z.string(),
        systemPrompt: z.string(),
      }),
    } satisfies Parameters<typeof generateObject>[0]

    if (defaultModel.providerID === "openai" && (await Auth.get(defaultModel.providerID))?.type === "oauth") {
      const result = streamObject({
        ...params,
        providerOptions: ProviderTransform.providerOptions(model, {
          instructions: SystemPrompt.instructions(),
          store: false,
        }),
        onError: () => {},
      })
      for await (const part of result.fullStream) {
        if (part.type === "error") throw part.error
      }
      return result.object
    }

    const result = await generateObject(params)
    return result.object
  }
```

**File:** packages/opencode/src/tool/task.ts (L14-25)
```typescript
const parameters = z.object({
  description: z.string().describe("A short (3-5 words) description of the task"),
  prompt: z.string().describe("The task for the agent to perform"),
  subagent_type: z.string().describe("The type of specialized agent to use for this task"),
  task_id: z
    .string()
    .describe(
      "This should only be set if you mean to resume a previous task (you can pass a prior task_id and the task will continue the same subagent session as before instead of creating a fresh one)",
    )
    .optional(),
  command: z.string().describe("The command that triggered this task").optional(),
})
```

**File:** packages/opencode/src/tool/task.ts (L27-41)
```typescript
export const TaskTool = Tool.define("task", async (ctx) => {
  const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

  // Filter agents by permissions if agent provided
  const caller = ctx?.agent
  const accessibleAgents = caller
    ? agents.filter((a) => PermissionNext.evaluate("task", a.name, caller.permission).action !== "deny")
    : agents

  const description = DESCRIPTION.replace(
    "{agents}",
    accessibleAgents
      .map((a) => `- ${a.name}: ${a.description ?? "This subagent should only be called manually by the user."}`)
      .join("\n"),
  )
```

**File:** packages/opencode/src/tool/task.ts (L64-102)
```typescript
      const hasTaskPermission = agent.permission.some((rule) => rule.permission === "task")

      const session = await iife(async () => {
        if (params.task_id) {
          const found = await Session.get(params.task_id).catch(() => {})
          if (found) return found
        }

        return await Session.create({
          parentID: ctx.sessionID,
          title: params.description + ` (@${agent.name} subagent)`,
          permission: [
            {
              permission: "todowrite",
              pattern: "*",
              action: "deny",
            },
            {
              permission: "todoread",
              pattern: "*",
              action: "deny",
            },
            ...(hasTaskPermission
              ? []
              : [
                  {
                    permission: "task" as const,
                    pattern: "*" as const,
                    action: "deny" as const,
                  },
                ]),
            ...(config.experimental?.primary_tools?.map((t) => ({
              pattern: "*",
              action: "allow" as const,
              permission: t,
            })) ?? []),
          ],
        })
      })
```

**File:** packages/opencode/src/tool/task.ts (L146-163)
```typescript

      const output = [
        `task_id: ${session.id} (for resuming to continue this task if needed)`,
        "",
        "<task_result>",
        text,
        "</task_result>",
      ].join("\n")

      return {
        title: params.description,
        metadata: {
          sessionId: session.id,
          model,
        },
        output,
      }
    },
```

**File:** packages/opencode/src/session/prompt.ts (L86-89)
```typescript
  export function assertNotBusy(sessionID: string) {
    const match = state()[sessionID]
    if (match) throw new Session.BusyError(sessionID)
  }
```

**File:** packages/opencode/src/session/prompt.ts (L187-236)
```typescript
  export async function resolvePromptParts(template: string): Promise<PromptInput["parts"]> {
    const parts: PromptInput["parts"] = [
      {
        type: "text",
        text: template,
      },
    ]
    const files = ConfigMarkdown.files(template)
    const seen = new Set<string>()
    await Promise.all(
      files.map(async (match) => {
        const name = match[1]
        if (seen.has(name)) return
        seen.add(name)
        const filepath = name.startsWith("~/")
          ? path.join(os.homedir(), name.slice(2))
          : path.resolve(Instance, name)

        const stats = await fs.stat(filepath).catch(() => undefined)
        if (!stats) {
          const agent = await Agent.get(name)
          if (agent) {
            parts.push({
              type: "agent",
              name: agent.name,
            })
          }
          return
        }

        if (stats.isDirectory()) {
          parts.push({
            type: "file",
            url: pathToFileURL(filepath).href,
            filename: name,
            mime: "application/x-directory",
          })
          return
        }

        parts.push({
          type: "file",
          url: pathToFileURL(filepath).href,
          filename: name,
          mime: "text/plain",
        })
      }),
    )
    return parts
  }
```

**File:** packages/opencode/src/session/prompt.ts (L294-356)
```typescript
    while (true) {
      SessionStatus.set(sessionID, { type: "busy" })
      log.info("loop", { step, sessionID })
      if (abort.aborted) break
      let msgs = await MessageV2.filterCompacted(MessageV2.stream(sessionID))

      let lastUser: MessageV2.User | undefined
      let lastAssistant: MessageV2.Assistant | undefined
      let lastFinished: MessageV2.Assistant | undefined
      let tasks: (MessageV2.CompactionPart | MessageV2.SubtaskPart)[] = []
      for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i]
        if (!lastUser && msg.info.role === "user") lastUser = msg.info as MessageV2.User
        if (!lastAssistant && msg.info.role === "assistant") lastAssistant = msg.info as MessageV2.Assistant
        if (!lastFinished && msg.info.role === "assistant" && msg.info.finish)
          lastFinished = msg.info as MessageV2.Assistant
        if (lastUser && lastFinished) break
        const task = msg.parts.filter((part) => part.type === "compaction" || part.type === "subtask")
        if (task && !lastFinished) {
          tasks.push(...task)
        }
      }

      if (!lastUser) throw new Error("No user message found in stream. This should never happen.")
      if (
        lastAssistant?.finish &&
        !["tool-calls", "unknown"].includes(lastAssistant.finish) &&
        lastUser.id < lastAssistant.id
      ) {
        log.info("exiting loop", { sessionID })
        break
      }

      step++
      if (step === 1)
        ensureTitle({
          session,
          modelID: lastUser.model.modelID,
          providerID: lastUser.model.providerID,
          history: msgs,
        })

      const model = await Provider.getModel(lastUser.model.providerID, lastUser.model.modelID).catch((e) => {
        if (Provider.ModelNotFoundError.isInstance(e)) {
          const hint = e.data.suggestions?.length ? ` Did you mean: ${e.data.suggestions.join(", ")}?` : ""
          Bus.publish(Session.Event.Error, {
            sessionID,
            error: new NamedError.Unknown({
              message: `Model not found: ${e.data.providerID}/${e.data.modelID}.${hint}`,
            }).toObject(),
          })
        }
        throw e
      })
      const task = tasks.pop()

      // pending subtask
      // TODO: centralize "invoke tool" logic
      if (task?.type === "subtask") {
        const taskTool = await TaskTool.init()
        const taskModel = task.model ? await Provider.getModel(task.model.providerID, task.model.modelID) : model
        const assistantMessage = (await Session.updateMessage({
          id: Identifier.ascending("message"),
```

**File:** packages/opencode/src/session/prompt.ts (L557-560)
```typescript
      const agent = await Agent.get(lastUser.agent)
      const maxSteps = agent.steps ?? Infinity
      const isLastStep = step >= maxSteps
      msgs = await insertReminders({
```

**File:** packages/opencode/src/session/prompt.ts (L631-648)
```typescript
      // Ephemerally wrap queued user messages with a reminder to stay on track
      if (step > 1 && lastFinished) {
        for (const msg of sessionMessages) {
          if (msg.info.role !== "user" || msg.info.id <= lastFinished.id) continue
          for (const part of msg.parts) {
            if (part.type !== "text" || part.ignored || part.synthetic) continue
            if (!part.text.trim()) continue
            part.text = [
              "<system-reminder>",
              "The user sent the following message:",
              part.text,
              "",
              "Please address this message and continue with your tasks.",
              "</system-reminder>",
            ].join("\n")
          }
        }
      }
```

**File:** packages/opencode/src/session/prompt.ts (L1260-1283)
```typescript
        if (part.type === "agent") {
          // Check if this agent would be denied by task permission
          const perm = PermissionNext.evaluate("task", part.name, agent.permission)
          const hint = perm.action === "deny" ? " . Invoked by user; guaranteed to exist." : ""
          return [
            {
              ...part,
              messageID: info.id,
              sessionID: input.sessionID,
            },
            {
              messageID: info.id,
              sessionID: input.sessionID,
              type: "text",
              synthetic: true,
              // An extra space is added here. Otherwise the 'Use' gets appended
              // to user's last word; making a combined word
              text:
                " Use the above message and context to generate a prompt and call the task tool with subagent: " +
                part.name +
                hint,
            },
          ]
        }
```

**File:** packages/opencode/src/session/prompt.ts (L1374-1458)
```typescript
    if (input.agent.name === "plan" && assistantMessage?.info.agent !== "plan") {
      const plan = Session.plan(input.session)
      const exists = await Bun.file(plan).exists()
      if (!exists) await fs.mkdir(path.dirname(plan), { recursive: true })
      const part = await Session.updatePart({
        id: Identifier.ascending("part"),
        messageID: userMessage.info.id,
        sessionID: userMessage.info.sessionID,
        type: "text",
        text: `<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits (with the exception of the plan file mentioned below), run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supersedes any other instructions you have received.

## Plan File Info:
${exists ? `A plan file already exists at ${plan}. You can read it and make incremental edits using the edit tool.` : `No plan file exists yet. You should create your plan at ${plan} using the write tool.`}
You should build your plan incrementally by writing to or editing this file. NOTE that this is the only file you are allowed to edit - other than this you are only allowed to take READ-ONLY actions.

## Plan Workflow

### Phase 1: Initial Understanding
Goal: Gain a comprehensive understanding of the user's request by reading through code and asking them questions. Critical: In this phase you should only use the explore subagent type.

1. Focus on understanding the user's request and the code associated with their request

2. **Launch up to 3 explore agents IN PARALLEL** (single message, multiple tool calls) to efficiently explore the codebase.
   - Use 1 agent when the task is isolated to known files, the user provided specific file paths, or you're making a small targeted change.
   - Use multiple agents when: the scope is uncertain, multiple areas of the codebase are involved, or you need to understand existing patterns before planning.
   - Quality over quantity - 3 agents maximum, but you should try to use the minimum number of agents necessary (usually just 1)
   - If using multiple agents: Provide each agent with a specific search focus or area to explore. Example: One agent searches for existing implementations, another explores related components, a third investigates testing patterns

3. After exploring the code, use the question tool to clarify ambiguities in the user request up front.

### Phase 2: Design
Goal: Design an implementation approach.

Launch general agent(s) to design the implementation based on the user's intent and your exploration results from Phase 1.

You can launch up to 1 agent(s) in parallel.

**Guidelines:**
- **Default**: Launch at least 1 Plan agent for most tasks - it helps validate your understanding and consider alternatives
- **Skip agents**: Only for truly trivial tasks (typo fixes, single-line changes, simple renames)

Examples of when to use multiple agents:
- The task touches multiple parts of the codebase
- It's a large refactor or architectural change
- There are many edge cases to consider
- You'd benefit from exploring different approaches

Example perspectives by task type:
- New feature: simplicity vs performance vs maintainability
- Bug fix: root cause vs workaround vs prevention
- Refactoring: minimal change vs clean architecture

In the agent prompt:
- Provide comprehensive background context from Phase 1 exploration including filenames and code path traces
- Describe requirements and constraints
- Request a detailed implementation plan

### Phase 3: Review
Goal: Review the plan(s) from Phase 2 and ensure alignment with the user's intentions.
1. Read the critical files identified by agents to deepen your understanding
2. Ensure that the plans align with the user's original request
3. Use question tool to clarify any remaining questions with the user

### Phase 4: Final Plan
Goal: Write your final plan to the plan file (the only file you can edit).
- Include only your recommended approach, not all alternatives
- Ensure that the plan file is concise enough to scan quickly, but detailed enough to execute effectively
- Include the paths of critical files to be modified
- Include a verification section describing how to test the changes end-to-end (run the code, use MCP tools, run tests)

### Phase 5: Call plan_exit tool
At the very end of your turn, once you have asked the user questions and are happy with your final plan file - you should always call plan_exit to indicate to the user that you are done planning.
This is critical - your turn should only end with either asking the user a question or calling plan_exit. Do not stop unless it's for these 2 reasons.

**Important:** Use question tool to clarify requirements/approach, use plan_exit to request plan approval. Do NOT use question tool to ask "Is this plan okay?" - that's what plan_exit does.

NOTE: At any point in time through this workflow you should feel free to ask the user questions or clarifications. Don't make large assumptions about user intent. The goal is to present a well researched plan to the user, and tie any loose ends before implementation begins.
</system-reminder>`,
        synthetic: true,
      })
      userMessage.parts.push(part)
      return input.messages
    }
    return input.messages
```

**File:** packages/opencode/src/session/prompt.ts (L1473-1491)
```typescript
  export async function shell(input: ShellInput) {
    const abort = start(input.sessionID)
    if (!abort) {
      throw new Session.BusyError(input.sessionID)
    }

    using _ = defer(() => {
      // If no queued callbacks, cancel (the default)
      const callbacks = state()[input.sessionID]?.callbacks ?? []
      if (callbacks.length === 0) {
        cancel(input.sessionID)
      } else {
        // Otherwise, trigger the session loop to process queued items
        loop({ sessionID: input.sessionID, resume_existing: true }).catch((error) => {
          log.error("session loop failed to resume after shell command", { sessionID: input.sessionID, error })
        })
      }
    })

```

**File:** packages/opencode/src/tool/registry.ts (L127-168)
```typescript
  export async function tools(
    model: {
      providerID: string
      modelID: string
    },
    agent?: Agent.Info,
  ) {
    const tools = await all()
    const result = await Promise.all(
      tools
        .filter((t) => {
          // Enable websearch/codesearch for zen users OR via enable flag
          if (t.id === "codesearch" || t.id === "websearch") {
            return model.providerID === "opencode" || Flag.OPENCODE_ENABLE_EXA
          }

          // use apply tool in same format as codex
          const usePatch =
            model.modelID.includes("gpt-") && !model.modelID.includes("oss") && !model.modelID.includes("gpt-4")
          if (t.id === "apply_patch") return usePatch
          if (t.id === "edit" || t.id === "write") return !usePatch

          return true
        })
        .map(async (t) => {
          using _ = log.time(t.id)
          const tool = await t.init({ agent })
          const output = {
            description: tool.description,
            parameters: tool.parameters,
          }
          await Plugin.trigger("tool.definition", { toolID: t.id }, output)
          return {
            id: t.id,
            ...tool,
            description: output.description,
            parameters: output.parameters,
          }
        }),
    )
    return result
  }
```

**File:** packages/opencode/src/session/index.ts (L114-155)
```typescript
  export const Info = z
    .object({
      id: Identifier.schema("session"),
      slug: z.string(),
      projectID: z.string(),
      directory: z.string(),
      parentID: Identifier.schema("session").optional(),
      summary: z
        .object({
          additions: z.number(),
          deletions: z.number(),
          files: z.number(),
          diffs: Snapshot.FileDiff.array().optional(),
        })
        .optional(),
      share: z
        .object({
          url: z.string(),
        })
        .optional(),
      title: z.string(),
      version: z.string(),
      time: z.object({
        created: z.number(),
        updated: z.number(),
        compacting: z.number().optional(),
        archived: z.number().optional(),
      }),
      permission: PermissionNext.Ruleset.optional(),
      revert: z
        .object({
          messageID: z.string(),
          partID: z.string().optional(),
          snapshot: z.string().optional(),
          diff: z.string().optional(),
        })
        .optional(),
    })
    .meta({
      ref: "Session",
    })
  export type Info = z.output<typeof Info>
```

**File:** packages/opencode/src/session/session.sql.ts (L11-35)
```typescript
export const SessionTable = sqliteTable(
  "session",
  {
    id: text().primaryKey(),
    project_id: text()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    parent_id: text(),
    slug: text().notNull(),
    directory: text().notNull(),
    title: text().notNull(),
    version: text().notNull(),
    share_url: text(),
    summary_additions: integer(),
    summary_deletions: integer(),
    summary_files: integer(),
    summary_diffs: text({ mode: "json" }).$type<Snapshot.FileDiff[]>(),
    revert: text({ mode: "json" }).$type<{ messageID: string; partID?: string; snapshot?: string; diff?: string }>(),
    permission: text({ mode: "json" }).$type<PermissionNext.Ruleset>(),
    ...Timestamps,
    time_compacting: integer(),
    time_archived: integer(),
  },
  (table) => [index("session_project_idx").on(table.project_id), index("session_parent_idx").on(table.parent_id)],
)
```

**File:** packages/opencode/src/tool/task.txt (L8-10)
```text
When to use the Task tool:
- When you are instructed to execute custom slash commands. Use the Task tool with the slash command invocation as the entire prompt. The slash command can take arguments. For example: Task(description="Check the file", prompt="/check-file path/to/file.py")

```

**File:** packages/opencode/src/tool/task.txt (L19-24)
```text
1. Launch multiple agents concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the agent is done, it will return a single message back to you. The result returned by the agent is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result. The output includes a task_id you can reuse later to continue the same subagent session.
3. Each agent invocation starts with a fresh context unless you provide task_id to resume the same subagent session (which continues with its previous messages and tool outputs). When starting fresh, your prompt should contain a highly detailed task description for the agent to perform autonomously and you should specify exactly what information the agent should return back to you in its final and only message to you.
4. The agent's outputs should generally be trusted
5. Clearly tell the agent whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent. Tell it how to verify its work if possible (e.g., relevant test commands).
6. If the agent description mentions that it should be used proactively, then you should try your best to use it without the user having to ask for it first. Use your judgement.
```

**File:** packages/opencode/src/snapshot/index.ts (L51-77)
```typescript
  export async function track() {
    if (Instance.project.vcs !== "git" || Flag.OPENCODE_CLIENT === "acp") return
    const cfg = await Config.get()
    if (cfg.snapshot === false) return
    const git = gitdir()
    if (await fs.mkdir(git, { recursive: true })) {
      await $`git init`
        .env({
          ...process.env,
          GIT_DIR: git,
          GIT_WORK_TREE: Instance,
        })
        .quiet()
        .nothrow()
      // Configure git to not convert line endings on Windows
      await $`git --git-dir ${git} config core.autocrlf false`.quiet().nothrow()
      log.info("initialized")
    }
    await $`git --git-dir ${git} --work-tree ${Instance} add .`.quiet().cwd(Instance.directory).nothrow()
    const hash = await $`git --git-dir ${git} --work-tree ${Instance} write-tree`
      .quiet()
      .cwd(Instance.directory)
      .nothrow()
      .text()
    log.info("tracking", { hash, cwd: Instance.directory, git })
    return hash.trim()
  }
```

**File:** packages/opencode/src/session/message-v2.ts (L90-97)
```typescript
  export const PatchPart = PartBase.extend({
    type: z.literal("patch"),
    hash: z.string(),
    files: z.string().array(),
  }).meta({
    ref: "PatchPart",
  })
  export type PatchPart = z.infer<typeof PatchPart>
```

**File:** packages/opencode/src/tool/truncation.ts (L44-48)
```typescript
  function hasTaskTool(agent?: Agent.Info): boolean {
    if (!agent?.permission) return false
    const rule = PermissionNext.evaluate("task", "*", agent.permission)
    return rule.action !== "deny"
  }
```

**File:** packages/opencode/src/tool/truncation.ts (L50-105)
```typescript
  export async function output(text: string, options: Options = {}, agent?: Agent.Info): Promise<Result> {
    const maxLines = options.maxLines ?? MAX_LINES
    const maxBytes = options.maxBytes ?? MAX_BYTES
    const direction = options.direction ?? "head"
    const lines = text.split("\n")
    const totalBytes = Buffer.byteLength(text, "utf-8")

    if (lines.length <= maxLines && totalBytes <= maxBytes) {
      return { content: text, truncated: false }
    }

    const out: string[] = []
    let i = 0
    let bytes = 0
    let hitBytes = false

    if (direction === "head") {
      for (i = 0; i < lines.length && i < maxLines; i++) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (i > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.push(lines[i])
        bytes += size
      }
    } else {
      for (i = lines.length - 1; i >= 0 && out.length < maxLines; i--) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (out.length > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.unshift(lines[i])
        bytes += size
      }
    }

    const removed = hitBytes ? totalBytes - bytes : lines.length - out.length
    const unit = hitBytes ? "bytes" : "lines"
    const preview = out.join("\n")

    const id = Identifier.ascending("tool")
    const filepath = path.join(DIR, id)
    await Bun.write(Bun.file(filepath), text)

    const hint = hasTaskTool(agent)
      ? `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse the Task tool to have explore agent process this file with Grep and Read (with offset/limit). Do NOT read the full file yourself - delegate to save context.`
      : `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse Grep to search the full content or Read with offset/limit to view specific sections.`
    const message =
      direction === "head"
        ? `${preview}\n\n...${removed} ${unit} truncated...\n\n${hint}`
        : `...${removed} ${unit} truncated...\n\n${hint}\n\n${preview}`

    return { content: message, truncated: true, outputPath: filepath }
  }
```

**File:** packages/opencode/src/session/todo.ts (L1-55)
```typescript
import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import z from "zod"
import { Database, eq, asc } from "../storage/db"
import { TodoTable } from "./session.sql"

export namespace Todo {
  export const Info = z
    .object({
      content: z.string().describe("Brief description of the task"),
      status: z.string().describe("Current status of the task: pending, in_progress, completed, cancelled"),
      priority: z.string().describe("Priority level of the task: high, medium, low"),
    })
    .meta({ ref: "Todo" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Updated: BusEvent.define(
      "todo.updated",
      z.object({
        sessionID: z.string(),
        todos: z.array(Info),
      }),
    ),
  }

  export function update(input: { sessionID: string; todos: Info[] }) {
    Database.transaction((db) => {
      db.delete(TodoTable).where(eq(TodoTable.session_id, input.sessionID)).run()
      if (input.todos.length === 0) return
      db.insert(TodoTable)
        .values(
          input.todos.map((todo, position) => ({
            session_id: input.sessionID,
            content: todo.content,
            status: todo.status,
            priority: todo.priority,
            position,
          })),
        )
        .run()
    })
    Bus.publish(Event.Updated, input)
  }

  export function get(sessionID: string) {
    const rows = Database.use((db) =>
      db.select().from(TodoTable).where(eq(TodoTable.session_id, sessionID)).orderBy(asc(TodoTable.position)).all(),
    )
    return rows.map((row) => ({
      content: row.content,
      status: row.status,
      priority: row.priority,
    }))
  }
```

**File:** packages/opencode/src/session/instruction.ts (L71-116)
```typescript
  export async function systemPaths() {
    const config = await Config.get()
    const paths = new Set<string>()

    if (!Flag.OPENCODE_DISABLE_PROJECT_CONFIG) {
      for (const file of FILES) {
        const matches = await Filesystem.findUp(file, Instance.directory, Instance)
        if (matches.length > 0) {
          matches.forEach((p) => {
            paths.add(path.resolve(p))
          })
          break
        }
      }
    }

    for (const file of globalFiles()) {
      if (await Bun.file(file).exists()) {
        paths.add(path.resolve(file))
        break
      }
    }

    if (config.instructions) {
      for (let instruction of config.instructions) {
        if (instruction.startsWith("https://") || instruction.startsWith("http://")) continue
        if (instruction.startsWith("~/")) {
          instruction = path.join(os.homedir(), instruction.slice(2))
        }
        const matches = path.isAbsolute(instruction)
          ? await Array.fromAsync(
              new Bun.Glob(path.basename(instruction)).scan({
                cwd: path.dirname(instruction),
                absolute: true,
                onlyFiles: true,
              }),
            ).catch(() => [])
          : await resolveRelative(instruction)
        matches.forEach((p) => {
          paths.add(path.resolve(p))
        })
      }
    }

    return paths
  }
```

**File:** packages/opencode/src/session/compaction.ts (L32-48)
```typescript
  export async function isOverflow(input: { tokens: MessageV2.Assistant["tokens"]; model: Provider.Model }) {
    const config = await Config.get()
    if (config.compaction?.auto === false) return false
    const context = input.model.limit.context
    if (context === 0) return false

    const count =
      input.tokens.total ||
      input.tokens.input + input.tokens.output + input.tokens.cache.read + input.tokens.cache.write

    const reserved =
      config.compaction?.reserved ?? Math.min(COMPACTION_BUFFER, ProviderTransform.maxOutputTokens(input.model))
    const usable = input.model.limit.input
      ? input.model.limit.input - reserved
      : context - ProviderTransform.maxOutputTokens(input.model)
    return count >= usable
  }
```

**File:** packages/opencode/src/session/compaction.ts (L50-99)
```typescript
  export const PRUNE_MINIMUM = 20_000
  export const PRUNE_PROTECT = 40_000

  const PRUNE_PROTECTED_TOOLS = ["skill"]

  // goes backwards through parts until there are 40_000 tokens worth of tool
  // calls. then erases output of previous tool calls. idea is to throw away old
  // tool calls that are no longer relevant.
  export async function prune(input: { sessionID: string }) {
    const config = await Config.get()
    if (config.compaction?.prune === false) return
    log.info("pruning")
    const msgs = await Session.messages({ sessionID: input.sessionID })
    let total = 0
    let pruned = 0
    const toPrune = []
    let turns = 0

    loop: for (let msgIndex = msgs.length - 1; msgIndex >= 0; msgIndex--) {
      const msg = msgs[msgIndex]
      if (msg.info.role === "user") turns++
      if (turns < 2) continue
      if (msg.info.role === "assistant" && msg.info.summary) break loop
      for (let partIndex = msg.parts.length - 1; partIndex >= 0; partIndex--) {
        const part = msg.parts[partIndex]
        if (part.type === "tool")
          if (part.state.status === "completed") {
            if (PRUNE_PROTECTED_TOOLS.includes(part.tool)) continue

            if (part.state.time.compacted) break loop
            const estimate = Token.estimate(part.state.output)
            total += estimate
            if (total > PRUNE_PROTECT) {
              pruned += estimate
              toPrune.push(part)
            }
          }
      }
    }
    log.info("found", { pruned, total })
    if (pruned > PRUNE_MINIMUM) {
      for (const part of toPrune) {
        if (part.state.status === "completed") {
          part.state.time.compacted = Date.now()
          await Session.updatePart(part)
        }
      }
      log.info("pruned", { count: toPrune.length })
    }
  }
```

**File:** packages/opencode/src/session/compaction.ts (L146-150)
```typescript
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
```

**File:** packages/opencode/src/session/compaction.ts (L151-178)
```typescript
    const defaultPrompt = `Provide a detailed prompt for continuing our conversation above.
Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next.
The summary that you construct will be used so that another agent can read it and continue the work.

When constructing the summary, try to stick to this template:
---
## Goal

[What goal(s) is the user trying to accomplish?]

## Instructions

- [What important instructions did the user give you that are relevant]
- [If there is a plan or spec, include information about it so next agent can continue using it]

## Discoveries

[What notable things were learned during this conversation that would be useful for the next agent to know when continuing the work]

## Accomplished

[What work has been completed, what work is still in progress, and what work is left?]

## Relevant files / directories

[Construct a structured list of relevant files that have been read, edited, or created that pertain to the task at hand. If all the files in a directory are relevant, include the path to the directory.]
---`

```

**File:** packages/opencode/src/session/processor.ts (L20-21)
```typescript
  const DOOM_LOOP_THRESHOLD = 3
  const log = Log.create({ service: "session.processor" })
```

**File:** packages/opencode/src/session/processor.ts (L151-178)
```typescript
                    const parts = await MessageV2.parts(input.assistantMessage.id)
                    const lastThree = parts.slice(-DOOM_LOOP_THRESHOLD)

                    if (
                      lastThree.length === DOOM_LOOP_THRESHOLD &&
                      lastThree.every(
                        (p) =>
                          p.type === "tool" &&
                          p.tool === value.toolName &&
                          p.state.status !== "pending" &&
                          JSON.stringify(p.state.input) === JSON.stringify(value.input),
                      )
                    ) {
                      const agent = await Agent.get(input.assistantMessage.agent)
                      await PermissionNext.ask({
                        permission: "doom_loop",
                        patterns: [value.toolName],
                        sessionID: input.assistantMessage.sessionID,
                        metadata: {
                          tool: value.toolName,
                          input: value.input,
                        },
                        always: [value.toolName],
                        ruleset: agent.permission,
                      })
                    }
                  }
                  break
```

**File:** packages/opencode/src/session/processor.ts (L281-285)
```typescript
                  })
                  if (await SessionCompaction.isOverflow({ tokens: usage.tokens, model: input.model })) {
                    needsCompaction = true
                  }
                  break
```

**File:** packages/opencode/src/skill/skill.ts (L52-175)
```typescript
  export const state = Instance.state(async () => {
    const skills: Record<string, Info> = {}
    const dirs = new Set<string>()

    const addSkill = async (match: string) => {
      const md = await ConfigMarkdown.parse(match).catch((err) => {
        const message = ConfigMarkdown.FrontmatterError.isInstance(err)
          ? err.data.message
          : `Failed to parse skill ${match}`
        Bus.publish(Session.Event.Error, { error: new NamedError.Unknown({ message }).toObject() })
        log.error("failed to load skill", { skill: match, err })
        return undefined
      })

      if (!md) return

      const parsed = Info.pick({ name: true, description: true }).safeParse(md.data)
      if (!parsed.success) return

      // Warn on duplicate skill names
      if (skills[parsed.data.name]) {
        log.warn("duplicate skill name", {
          name: parsed.data.name,
          existing: skills[parsed.data.name].location,
          duplicate: match,
        })
      }

      dirs.add(path.dirname(match))

      skills[parsed.data.name] = {
        name: parsed.data.name,
        description: parsed.data.description,
        location: match,
        content: md.content,
      }
    }

    const scanExternal = async (root: string, scope: "global" | "project") => {
      return Array.fromAsync(
        EXTERNAL_SKILL_GLOB.scan({
          cwd: root,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
          dot: true,
        }),
      )
        .then((matches) => Promise.all(matches.map(addSkill)))
        .catch((error) => {
          log.error(`failed to scan ${scope} skills`, { dir: root, error })
        })
    }

    // Scan external skill directories (.claude/skills/, .agents/skills/, etc.)
    // Load global (home) first, then project-level (so project-level overwrites)
    if (!Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS) {
      for (const dir of EXTERNAL_DIRS) {
        const root = path.join(Global.Path.home, dir)
        if (!(await Filesystem.isDir(root))) continue
        await scanExternal(root, "global")
      }

      for await (const root of Filesystem.up({
        targets: EXTERNAL_DIRS,
        start: Instance.directory,
        stop: Instance,
      })) {
        await scanExternal(root, "project")
      }
    }

    // Scan .opencode/skill/ directories
    for (const dir of await Config.directories()) {
      for await (const match of OPENCODE_SKILL_GLOB.scan({
        cwd: dir,
        absolute: true,
        onlyFiles: true,
        followSymlinks: true,
      })) {
        await addSkill(match)
      }
    }

    // Scan additional skill paths from config
    const config = await Config.get()
    for (const skillPath of config.skills?.paths ?? []) {
      const expanded = skillPath.startsWith("~/") ? path.join(os.homedir(), skillPath.slice(2)) : skillPath
      const resolved = path.isAbsolute(expanded) ? expanded : path.join(Instance.directory, expanded)
      if (!(await Filesystem.isDir(resolved))) {
        log.warn("skill path not found", { path: resolved })
        continue
      }
      for await (const match of SKILL_GLOB.scan({
        cwd: resolved,
        absolute: true,
        onlyFiles: true,
        followSymlinks: true,
      })) {
        await addSkill(match)
      }
    }

    // Download and load skills from URLs
    for (const url of config.skills?.urls ?? []) {
      const list = await Discovery.pull(url)
      for (const dir of list) {
        dirs.add(dir)
        for await (const match of SKILL_GLOB.scan({
          cwd: dir,
          absolute: true,
          onlyFiles: true,
          followSymlinks: true,
        })) {
          await addSkill(match)
        }
      }
    }

    return {
      skills,
      dirs: Array.from(dirs),
    }
  })
```

**File:** packages/opencode/src/skill/discovery.ts (L38-96)
```typescript
  export async function pull(url: string): Promise<string[]> {
    const result: string[] = []
    const base = url.endsWith("/") ? url : `${url}/`
    const index = new URL("index.json", base).href
    const cache = dir()
    const host = base.slice(0, -1)

    log.info("fetching index", { url: index })
    const data = await fetch(index)
      .then(async (response) => {
        if (!response.ok) {
          log.error("failed to fetch index", { url: index, status: response.status })
          return undefined
        }
        return response
          .json()
          .then((json) => json as Index)
          .catch((err) => {
            log.error("failed to parse index", { url: index, err })
            return undefined
          })
      })
      .catch((err) => {
        log.error("failed to fetch index", { url: index, err })
        return undefined
      })

    if (!data?.skills || !Array.isArray(data.skills)) {
      log.warn("invalid index format", { url: index })
      return result
    }

    const list = data.skills.filter((skill) => {
      if (!skill?.name || !Array.isArray(skill.files)) {
        log.warn("invalid skill entry", { url: index, skill })
        return false
      }
      return true
    })

    await Promise.all(
      list.map(async (skill) => {
        const root = path.join(cache, skill.name)
        await Promise.all(
          skill.files.map(async (file) => {
            const link = new URL(file, `${host}/${skill.name}/`).href
            const dest = path.join(root, file)
            await mkdir(path.dirname(dest), { recursive: true })
            await get(link, dest)
          }),
        )

        const md = path.join(root, "SKILL.md")
        if (await Bun.file(md).exists()) result.push(root)
      }),
    )

    return result
  }
```

**File:** packages/opencode/src/tool/skill.ts (L10-46)
```typescript
export const SkillTool = Tool.define("skill", async (ctx) => {
  const skills = await Skill.all()

  // Filter skills by agent permissions if agent provided
  const agent = ctx?.agent
  const accessibleSkills = agent
    ? skills.filter((skill) => {
        const rule = PermissionNext.evaluate("skill", skill.name, agent.permission)
        return rule.action !== "deny"
      })
    : skills

  const description =
    accessibleSkills.length === 0
      ? "Load a specialized skill that provides domain-specific instructions and workflows. No skills are currently available."
      : [
          "Load a specialized skill that provides domain-specific instructions and workflows.",
          "",
          "When you recognize that a task matches one of the available skills listed below, use this tool to load the full skill instructions.",
          "",
          "The skill will inject detailed instructions, workflows, and access to bundled resources (scripts, references, templates) into the conversation context.",
          "",
          'Tool output includes a `<skill_content name="...">` block with the loaded content.',
          "",
          "The following skills provide specialized sets of instructions for particular tasks",
          "Invoke this tool to load a skill when a task matches one of the available skills listed below:",
          "",
          "<available_skills>",
          ...accessibleSkills.flatMap((skill) => [
            `  <skill>`,
            `    <name>${skill.name}</name>`,
            `    <description>${skill.description}</description>`,
            `    <location>${pathToFileURL(skill.location).href}</location>`,
            `  </skill>`,
          ]),
          "</available_skills>",
        ].join("\n")
```

**File:** packages/opencode/src/tool/skill.ts (L99-120)
```typescript
      return {
        title: `Loaded skill: ${skill.name}`,
        output: [
          `<skill_content name="${skill.name}">`,
          `# Skill: ${skill.name}`,
          "",
          skill.content.trim(),
          "",
          `Base directory for this skill: ${base}`,
          "Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.",
          "Note: file list is sampled.",
          "",
          "<skill_files>",
          files,
          "</skill_files>",
          "</skill_content>",
        ].join("\n"),
        metadata: {
          name: skill.name,
          dir,
        },
      }
```

**File:** packages/opencode/src/command/index.ts (L62-81)
```typescript
    const result: Record<string, Info> = {
      [Default.INIT]: {
        name: Default.INIT,
        description: "create/update AGENTS.md",
        source: "command",
        get template() {
          return PROMPT_INITIALIZE.replace("${path}", Instance)
        },
        hints: hints(PROMPT_INITIALIZE),
      },
      [Default.REVIEW]: {
        name: Default.REVIEW,
        description: "review changes [commit|branch|pr], defaults to uncommitted",
        source: "command",
        get template() {
          return PROMPT_REVIEW.replace("${path}", Instance)
        },
        subtask: true,
        hints: hints(PROMPT_REVIEW),
      },
```

**File:** packages/opencode/src/command/index.ts (L125-138)
```typescript
    // Add skills as invokable commands
    for (const skill of await Skill.all()) {
      // Skip if a command with this name already exists
      if (result[skill.name]) continue
      result[skill.name] = {
        name: skill.name,
        description: skill.description,
        source: "skill",
        get template() {
          return skill.content
        },
        hints: [],
      }
    }
```
