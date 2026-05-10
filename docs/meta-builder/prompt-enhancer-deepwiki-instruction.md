Here's how both approaches work in OpenCode, and the key constraints of each:

---

## Option A: Session Export + CLI Chaining

OpenCode has built-in `export` and `import` commands, plus `opencode run` with session continuation flags:

```bash
# Export a session to JSON on disk
opencode export ses_abc123 > /path/to/session.json

# Import it back
opencode import /path/to/session.json

# Continue that session non-interactively with a new prompt
opencode run --session ses_abc123 "Now enhance this context and delegate to crawlers"
```

The `opencode run` command supports `--session <id>` to continue an existing session and `--continue` to resume the most recent one. It also supports `--agent` to pick which agent handles the prompt, and `--command` to invoke slash commands. [1](#1-0) [2](#1-1) 

The export command dumps the full session (info + messages + parts) as JSON to stdout: [3](#1-2) 

So you **can** chain CLI runs like:

```bash
# Step 1: Scrape
opencode run --agent orchestrator --session $SID "Scrape these URLs: ..."

# Step 2: Continue same session with enhancer
opencode run --session $SID --agent prompt-enhancer "Synthesize the above results"
```

However, there is **no auto-export hook** — sessions are not automatically written to a file path after each run. You'd need to script that yourself (e.g., `opencode export $SID > output.json` after each `run`).

## Option B: Subagent Session Inheritance (Task Tool)

This is the more relevant mechanism for your architecture. When the Task tool spawns a subagent, it creates a **child session** with a `parentID` linking to the parent: [4](#1-3) 

**Critical constraint: subagents do NOT inherit the parent's message history.** Each subagent invocation starts with a **fresh context** unless you pass `task_id` to resume a prior subagent session: [5](#1-4) 

The parent agent must explicitly pass all relevant context in the `prompt` parameter. The subagent's response is returned as a single text message back to the parent — the parent then decides what to do with it. [6](#1-5) 

The `parentID` relationship is stored in the database and used for:
- Navigation (go to parent/child session in the TUI)
- Permission inheritance (auto-accept propagates from parent to child)
- Session lifecycle (deleting a parent cascades to children) [7](#1-6) [8](#1-7) 

## How Your "Prompt Enhancer" Pattern Maps

Given these constraints, here's how the two-stage flow you described would work:

```mermaid
graph TD
    "User prompt" --> "Orchestrator (primary agent)"
    "Orchestrator (primary agent)" --> "Task tool: prompt-enhancer subagent"
    "Task tool: prompt-enhancer subagent" --> "Fresh session (no parent context)"
    "Orchestrator (primary agent)" -->|"passes raw context\nin prompt param"| "Task tool: prompt-enhancer subagent"
    "Task tool: prompt-enhancer subagent" -->|"reads on-disk files\nvia read/glob/grep tools"| "On-disk files"
    "Task tool: prompt-enhancer subagent" -->|"returns synthesized\ninstructions"| "Orchestrator (primary agent)"
    "Orchestrator (primary agent)" --> "Task tool: scraper/crawler subagents"
```

The orchestrator would:
1. Receive the raw user prompt
2. Invoke the `prompt-enhancer` subagent via Task tool, passing the raw prompt + any file references in the `prompt` parameter
3. The prompt-enhancer (having `read`, `glob`, `grep` permissions) investigates on-disk files, iteratively synthesizes, and returns improved instructions as its final text response
4. The orchestrator receives that synthesized output and uses it to invoke scraper/crawler subagents

The prompt-enhancer **can** read on-disk files natively using the `read`, `glob`, `grep`, and `webfetch` tools — no export step needed. You'd configure it like:

```json
{
  "agent": {
    "prompt-enhancer": {
      "mode": "subagent",
      "hidden": true,
      "description": "Investigates on-disk files and synthesizes improved instructions from raw context",
      "permission": {
        "read": "allow",
        "glob": "allow",
        "grep": "allow",
        "list": "allow",
        "write": { "*": "ask" },
        "bash": "ask",
        "task": { "*": "ask" }
      }
    }
  }
}
```

## Summary of Gaps

| What you want | What exists | Gap |
|---|---|---|
| Auto-export session to disk path | `opencode export` exists but is manual/CLI-only | No auto-export hook; you'd script it or write a plugin |
| Subagent inherits parent context | `parentID` link exists but **no message inheritance** | Parent must serialize relevant context into the `prompt` string |
| Prompt enhancer reads on-disk files | Native `read`/`glob`/`grep` tools available to subagents | Works out of the box with correct permissions |
| Iterative synthesis loop | Subagent runs autonomously with tool calls until done | Works — the subagent can do multiple read/search iterations within its `steps` limit |
| Result flows back to orchestrator | Task tool returns final text to parent | Works — parent receives `<task_result>` text |
| `task_id` resume for multi-turn | Supported natively | Works — pass `task_id` to continue a prior subagent session |

The **second approach** (orchestrator delegates raw context via Task tool prompt → prompt-enhancer investigates files → returns synthesized output) is the native and recommended pattern. No export/import step is needed because the subagent can directly access the filesystem. [9](#1-8)

### Citations

**File:** packages/opencode/src/cli/cmd/run.ts (L221-300)
```typescript
export const RunCommand = cmd({
  command: "run [message..]",
  describe: "run opencode with a message",
  builder: (yargs: Argv) => {
    return yargs
      .positional("message", {
        describe: "message to send",
        type: "string",
        array: true,
        default: [],
      })
      .option("command", {
        describe: "the command to run, use message for args",
        type: "string",
      })
      .option("continue", {
        alias: ["c"],
        describe: "continue the last session",
        type: "boolean",
      })
      .option("session", {
        alias: ["s"],
        describe: "session id to continue",
        type: "string",
      })
      .option("fork", {
        describe: "fork the session before continuing (requires --continue or --session)",
        type: "boolean",
      })
      .option("share", {
        type: "boolean",
        describe: "share the session",
      })
      .option("model", {
        type: "string",
        alias: ["m"],
        describe: "model to use in the format of provider/model",
      })
      .option("agent", {
        type: "string",
        describe: "agent to use",
      })
      .option("format", {
        type: "string",
        choices: ["default", "json"],
        default: "default",
        describe: "format: default (formatted) or json (raw JSON events)",
      })
      .option("file", {
        alias: ["f"],
        type: "string",
        array: true,
        describe: "file(s) to attach to message",
      })
      .option("title", {
        type: "string",
        describe: "title for the session (uses truncated prompt if no value provided)",
      })
      .option("attach", {
        type: "string",
        describe: "attach to a running opencode server (e.g., http://localhost:4096)",
      })
      .option("password", {
        alias: ["p"],
        type: "string",
        describe: "basic auth password (defaults to OPENCODE_SERVER_PASSWORD)",
      })
      .option("dir", {
        type: "string",
        describe: "directory to run in, path on remote server if attaching",
      })
      .option("port", {
        type: "number",
        describe: "port for the local server (defaults to random port if no value provided)",
      })
      .option("variant", {
        type: "string",
        describe: "model variant (provider-specific reasoning effort, e.g., high, max, minimal)",
      })
      .option("thinking", {
```

**File:** packages/web/src/content/docs/cli.mdx (L312-352)
```text
### run

Run opencode in non-interactive mode by passing a prompt directly.

```bash
opencode run [message..]
```

This is useful for scripting, automation, or when you want a quick answer without launching the full TUI. For example.

```bash "opencode run"
opencode run Explain the use of context in Go
```

You can also attach to a running `opencode serve` instance to avoid MCP server cold boot times on every run:

```bash
# Start a headless server in one terminal
opencode serve

# In another terminal, run commands that attach to it
opencode run --attach http://localhost:4096 "Explain async/await in JavaScript"
```

#### Flags

| Flag         | Short | Description                                                             |
| ------------ | ----- | ----------------------------------------------------------------------- |
| `--command`  |       | The command to run, use message for args                                |
| `--continue` | `-c`  | Continue the last session                                               |
| `--session`  | `-s`  | Session ID to continue                                                  |
| `--fork`     |       | Fork the session when continuing (use with `--continue` or `--session`) |
| `--share`    |       | Share the session                                                       |
| `--model`    | `-m`  | Model to use in the form of provider/model                              |
| `--agent`    |       | Agent to use                                                            |
| `--file`     | `-f`  | File(s) to attach to message                                            |
| `--format`   |       | Format: default (formatted) or json (raw JSON events)                   |
| `--title`    |       | Title for the session (uses truncated prompt if no value provided)      |
| `--attach`   |       | Attach to a running opencode server (e.g., http://localhost:4096)       |
| `--port`     |       | Port for the local server (defaults to random port)                     |

```

**File:** packages/opencode/src/cli/cmd/export.ts (L69-82)
```typescript
      try {
        const sessionInfo = await Session.get(sessionID!)
        const messages = await Session.messages({ sessionID: sessionInfo.id })

        const exportData = {
          info: sessionInfo,
          messages: messages.map((msg) => ({
            info: msg.info,
            parts: msg.parts,
          })),
        }

        process.stdout.write(JSON.stringify(exportData, null, 2))
        process.stdout.write(EOL)
```

**File:** packages/opencode/src/tool/task.ts (L15-26)
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

**File:** packages/opencode/src/tool/task.ts (L69-104)
```typescript
      const session = await iife(async () => {
        if (params.task_id) {
          const found = await Session.get(SessionID.make(params.task_id)).catch(() => {})
          if (found) return found
        }

        return await Session.create({
          parentID: ctx.sessionID,
          title: params.description + ` (@${agent.name} subagent)`,
          permission: [
            ...(hasTodoWritePermission
              ? []
              : [
                  {
                    permission: "todowrite" as const,
                    pattern: "*" as const,
                    action: "ask" as const,
                  },
                ]),
            ...(hasTaskPermission
              ? []
              : [
                  {
                    permission: "task" as const,
                    pattern: "*" as const,
                    action: "ask" as const,
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

**File:** packages/opencode/src/tool/task.ts (L128-154)
```typescript
      const promptParts = await SessionPrompt.resolvePromptParts(params.prompt)

      const result = await SessionPrompt.prompt({
        messageID,
        sessionID: session.id,
        model: {
          modelID: model.modelID,
          providerID: model.providerID,
        },
        agent: agent.name,
        tools: {
          ...(hasTodoWritePermission ? {} : { todowrite: false }),
          ...(hasTaskPermission ? {} : { task: false }),
          ...Object.fromEntries((config.experimental?.primary_tools ?? []).map((t) => [t, false])),
        },
        parts: promptParts,
      })

      const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""

      const output = [
        `task_id: ${session.id} (for resuming to continue this task if needed)`,
        "",
        "<task_result>",
        text,
        "</task_result>",
      ].join("\n")
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

**File:** packages/opencode/src/session/session.sql.ts (L14-43)
```typescript
export const SessionTable = sqliteTable(
  "session",
  {
    id: text().$type<SessionID>().primaryKey(),
    project_id: text()
      .$type<ProjectID>()
      .notNull()
      .references(() => ProjectTable.id, { onDelete: "cascade" }),
    workspace_id: text().$type<WorkspaceID>(),
    parent_id: text().$type<SessionID>(),
    slug: text().notNull(),
    directory: text().notNull(),
    title: text().notNull(),
    version: text().notNull(),
    share_url: text(),
    summary_additions: integer(),
    summary_deletions: integer(),
    summary_files: integer(),
    summary_diffs: text({ mode: "json" }).$type<Snapshot.FileDiff[]>(),
    revert: text({ mode: "json" }).$type<{ messageID: MessageID; partID?: PartID; snapshot?: string; diff?: string }>(),
    permission: text({ mode: "json" }).$type<Permission.Ruleset>(),
    ...Timestamps,
    time_compacting: integer(),
    time_archived: integer(),
  },
  (table) => [
    index("session_project_idx").on(table.project_id),
    index("session_workspace_idx").on(table.workspace_id),
    index("session_parent_idx").on(table.parent_id),
  ],
```

**File:** packages/opencode/src/session/index.ts (L460-475)
```typescript
      const remove: (sessionID: SessionID) => Effect.Effect<void> = Effect.fnUntraced(function* (sessionID: SessionID) {
        try {
          const session = yield* get(sessionID)
          const kids = yield* children(sessionID)
          for (const child of kids) {
            yield* remove(child.id)
          }
          yield* unshare(sessionID).pipe(Effect.ignore)
          yield* Effect.sync(() => {
            SyncEvent.run(Event.Deleted, { sessionID, info: session })
            SyncEvent.remove(sessionID)
          })
        } catch (e) {
          log.error(e)
        }
      })
```
