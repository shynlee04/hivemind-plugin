# DeepWiki Q&A with Code Context for Repository: anomalyco/opencode
## Q1
by using the SDK can we manipulate insert the conditional and contextual prompts (this is programmatic and event hooks) -> to the before last output assistant message (to play as reminder and the expectation based on workflow and development phases - for example including filetree updated, symlinks to research artifacts, committing gits or PR for. And that may change the decision of the stop WHILE the output style using prompt transformation to LLMs (the format and style of what it outputs before the next) can still maintain? If not are there any workaround. And what LLM reads and focus on as a whole context after the last output message and start of new turn of users' message? Are there method to transform the user's prompt in mid-turn making it more connected showing turn and anchor with context transformation of the next in-turn users' prompts?
### Answer
Short answer
- You cannot directly inject a prompt immediately before the last assistant message via the SDK. However, you can approximate this by using plugin hooks to transform messages or inject context, and by sending noReply prompts via the SDK to add context without triggering a response opencode:272-280 . The prompt loop already wraps queued user messages after the last assistant with a system-reminder to address them and continue tasks opencode:591-608 .
- The LLM reads the assembled system prompts plus the full message list after any plugin transformations. Specifically, experimental.chat.messages.transform can modify the messages array before it’s sent to the LLM opencode:197-205 , and experimental.chat.system.transform can modify the system array opencode:206-211 . The LLM stream receives these via processor.process with the transformed messages and system opencode:617-629 .
- There is no explicit mid-turn hook to transform an in-flight user prompt. Workarounds include using experimental.chat.messages.transform to rewrite messages before the LLM call or injecting synthetic context parts via noReply prompts. Compaction also provides a hook to inject context or replace the compaction prompt opencode:136-144 , documented in plugins.mdx opencode:341-383 .

Detailed answer
### Injecting conditional/contextual prompts before the last assistant message
- Direct SDK injection immediately before the last assistant message is not supported. The closest built-in behavior is the prompt loop’s system-reminder wrapper for queued user messages after the last finished assistant, which prompts the LLM to address them and continue opencode:591-608 .
- Via plugins: Use experimental.chat.messages.transform to inject or prepend synthetic reminder parts into the messages array before LLM calls opencode:197-205 . This hook is invoked in the prompt loop opencode:610-610 .
- Via SDK: Send a noReply prompt to inject context (e.g., filetree updates, symlinks, git/PR status) without triggering an assistant response, then let the next user turn proceed opencode:272-280 .
- Compaction hook: When sessions are compacted, experimental.session.compacting can inject context or replace the compaction prompt, which influences the continuation prompt opencode:136-144 ; see usage examples in plugins.mdx opencode:341-383 .

### Preserving output style while influencing stop decisions
- The experimental.chat.messages.transform hook can rewrite or annotate messages to influence stop/continue decisions without necessarily changing the output style, because style is typically controlled by agent prompts and system instructions. You can add metadata or reminder parts that the agent can interpret to decide whether to stop opencode:197-205 .
- System prompt transformation via experimental.chat.system.transform can adjust instructions that affect behavior (including stopping) while keeping the core output format opencode:206-211 .

### What the LLM reads as context after the last assistant message and before the next user turn
- The LLM receives:
  - System prompts (agent prompt, provider prompt, custom system, and any user.system) assembled in LLM.stream opencode:67-80 .
  - The full messages list after experimental.chat.messages.transform opencode:617-629 .
  - Tools and other parameters.
- Therefore, any context you inject via the above hooks or noReply prompts becomes part of the LLM’s input context for the next turn.

### Transforming the user’s prompt mid-turn for continuity
- There is no dedicated mid-turn user prompt transformation hook. The available intervention points are:
  - experimental.chat.messages.transform: modify the entire messages array before the LLM call, which can include rewriting the latest user message opencode:197-205 .
  - experimental.chat.system.transform: adjust system prompts to frame the next turn opencode:206-211 .
  - SDK noReply prompts: inject synthetic context or “anchor” messages between turns to improve continuity opencode:272-280 .

### Summary of workarounds
- Use plugins (experimental.chat.messages.transform and experimental.chat.system.transform) to inject or rewrite context before LLM calls.
- Use SDK noReply prompts to add context without responses.
- Use compaction hooks to persist context across compactions.
- There is no true mid-turn user prompt rewrite; transformations happen before the LLM call within the same turn.

## Notes
- The system-reminder wrapper in the prompt loop is a built-in way to ensure queued user messages are addressed opencode:591-608 .
- Plugin hooks are the primary extensibility point for prompt/context manipulation; see the Hooks interface for all available hooks opencode:148-227 .
- The SDK’s noReply option is useful for programmatic context injection without triggering assistant responses opencode:272-280 .

Wiki pages you might want to explore:
- [Client-Server Model (anomalyco/opencode)](/wiki/anomalyco/opencode#2.2)
### Citations
**File:** packages/web/src/content/docs/sdk.mdx (L272-280)
```text
// Inject context without triggering AI response (useful for plugins)
await client.session.prompt({
  path: { id: session.id },
  body: {
    noReply: true,
    parts: [{ type: "text", text: "You are a helpful assistant." }],
  },
})
```
```
**File:** packages/opencode/src/session/prompt.ts (L591-608)
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
**File:** packages/opencode/src/session/prompt.ts (L610-610)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
**File:** packages/opencode/src/session/prompt.ts (L617-629)
```typescript
        system: [...(await SystemPrompt.environment(model)), ...(await InstructionPrompt.system())],
        messages: [
          ...MessageV2.toModelMessages(sessionMessages, model),
          ...(isLastStep
            ? [
                {
                  role: "assistant" as const,
                  content: MAX_STEPS,
                },
              ]
            : []),
        ],
        tools,
```
**File:** packages/plugin/src/index.ts (L148-227)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: {
    [key: string]: ToolDefinition
  }
  auth?: AuthHook
  /**
   * Called when a new message is received
   */
  "chat.message"?: (
    input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      messageID?: string
      variant?: string
    },
    output: { message: UserMessage; parts: Part[] },
  ) => Promise<void>
  /**
   * Modify parameters sent to LLM
   */
  "chat.params"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { temperature: number; topP: number; topK: number; options: Record<string, any> },
  ) => Promise<void>
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "shell.env"?: (input: { cwd: string }, output: { env: Record<string, string> }) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: {
      title: string
      output: string
      metadata: any
    },
  ) => Promise<void>
  "experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
  "experimental.chat.system.transform"?: (
    input: { sessionID?: string; model: Model },
    output: {
      system: string[]
    },
  ) => Promise<void>
  /**
   * Called before session compaction starts. Allows plugins to customize
   * the compaction prompt.
   *
   * - `context`: Additional context strings appended to the default prompt
   * - `prompt`: If set, replaces the default compaction prompt entirely
   */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>
}
```
**File:** packages/opencode/src/session/compaction.ts (L136-144)
```typescript
    // Allow plugins to inject context or replace compaction prompt
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
    const defaultPrompt =
      "Provide a detailed prompt for continuing our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next considering new session will not have access to our conversation."
    const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
```
**File:** packages/web/src/content/docs/plugins.mdx (L341-383)
```text
export const CompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Inject additional context into the compaction prompt
      output.context.push(`
## Custom Context

Include any state that should persist across compaction:
- Current task status
- Important decisions made
- Files being actively worked on
`)
    },
  }
}
```

The `experimental.session.compacting` hook fires before the LLM generates a continuation summary. Use it to inject domain-specific context that the default compaction prompt would miss.

You can also replace the compaction prompt entirely by setting `output.prompt`:

```ts title=".opencode/plugins/custom-compaction.ts"
import type { Plugin } from "@opencode-ai/plugin"

export const CustomCompactionPlugin: Plugin = async (ctx) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      // Replace the entire compaction prompt
      output.prompt = `
You are generating a continuation prompt for a multi-agent swarm session.

Summarize:
1. The current task and its status
2. Which files are being modified and by whom
3. Any blockers or dependencies between agents
4. The next steps to complete the work

Format as a structured prompt that a new agent can use to resume work.
`
    },
  }
}
```
```
**File:** packages/opencode/src/session/llm.ts (L67-80)
```typescript
    const system = []
    system.push(
      [
        // use agent prompt otherwise provider prompt
        // For Codex sessions, skip SystemPrompt.provider() since it's sent via options.instructions
        ...(input.agent.prompt ? [input.agent.prompt] : isCodex ? [] : SystemPrompt.provider(input.model)),
        // any custom prompt passed into this call
        ...input.system,
        // any custom prompt from last user message
        ...(input.user.system ? [input.user.system] : []),
      ]
        .filter((x) => x)
        .join("\n"),
    )
```
## Q2
by using the SDK can we manipulate insert the conditional and contextual prompts (this is programmatic and event hooks) -> to the before last output assistant message (to play as reminder and the expectation based on workflow and development phases - for example including filetree updated, symlinks to research artifacts, committing gits or PR for. And that may change the decision of the stop WHILE the output style using prompt transformation to LLMs (the format and style of what it outputs before the next) can still maintain? If not are there any workaround. And what LLM reads and focus on as a whole context after the last output message and start of new turn of users' message? Are there method to transform the user's prompt in mid-turn making it more connected showing turn and anchor with context transformation of the next in-turn users' prompts?
## OpenCode Prompt Manipulation and Message Flow
This codemap traces how OpenCode handles programmatic prompt manipulation, message transformation, and context injection through the SDK and plugin system. Key locations include the SDK's noReply functionality [1d], the prompt loop's message transformation [3e], system prompt assembly [4e], and plugin hooks for context injection [5c].
### 1. SDK Prompt Injection with noReply
How the SDK allows injecting context without triggering AI responses
### 1a. SDK noReply prompt example (`sdk.mdx:272`)
Documentation showing how to inject context without response
```text
await client.session.prompt({
```
### 1b. noReply parameter definition (`prompt.ts:93`)
Schema definition for noReply option in PromptInput
```text
noReply: z.boolean().optional(),
```
### 1c. Early return for noReply (`prompt.ts:173`)
Logic that returns user message without triggering LLM
```text
if (input.noReply === true) {
```
### 1d. Return without processing (`prompt.ts:174`)
Exits prompt flow early for context-only messages
```text
return message
```
### 2. Message Transformation Pipeline
How messages are transformed before being sent to the LLM
### 2a. Plugin hook definition (`index.ts:197`)
Interface for message transformation plugin hook
```text
"experimental.chat.messages.transform"?: (
```
### 2b. System reminder injection (`prompt.ts:591`)
Built-in logic to wrap user messages with reminders
```text
Ephemerally wrap queued user messages with a reminder to stay on track
```
### 2c. Message text wrapping (`prompt.ts:598`)
Actual transformation of message text with system reminder
```text
part.text = [
```
### 2d. Plugin transformation trigger (`prompt.ts:610`)
Invokes plugin hooks to transform messages
```text
await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
### 2e. Message conversion for LLM (`prompt.ts:618`)
Converts transformed messages to LLM format
```text
messages: [...MessageV2.toModelMessages(sessionMessages, model),
```
### 3. System Prompt Assembly and Transformation
How system prompts are constructed and can be modified
### 3a. System transform hook (`index.ts:206`)
Interface for system prompt transformation plugin
```text
"experimental.chat.system.transform"?: (
```
### 3b. System prompt assembly (`prompt.ts:617`)
Combines environment and instruction prompts
```text
system: [...(await SystemPrompt.environment(model)), ...(await InstructionPrompt.system())],
```
### 3c. System array initialization (`llm.ts:67`)
Starts building system prompt array in LLM module
```text
const system = []
```
### 3d. System transform execution (`llm.ts:85`)
Triggers plugin hooks to transform system prompts
```text
await Plugin.trigger("experimental.chat.system.transform",
```
### 3e. Final message assembly (`llm.ts:235`)
Combines system and user messages for LLM
```text
messages: [...system.map((x): ModelMessage => ({ role: "system", content: x, })), ...input.messages],
```
### 4. Session Compaction Context Injection
How context can be injected during session compaction
### 4a. Compaction hook interface (`index.ts:219`)
Plugin hook for customizing compaction prompts
```text
"experimental.session.compacting"?: (
```
### 4b. Compaction trigger (`compaction.ts:137`)
Invokes plugin hooks before compaction
```text
const compacting = await Plugin.trigger(
```
### 4c. Context injection example (`plugins.mdx:345`)
Documentation showing how to inject custom context
```text
output.context.push(`
```
### 4d. Prompt construction (`compaction.ts:144`)
Builds final compaction prompt with injected context
```text
const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
```
### 4e. Prompt usage (`compaction.ts:159`)
Uses constructed prompt in compaction message
```text
text: promptText,
```
### 5. Plan Mode and Reminder Injection
How specialized prompts are injected for different workflow phases
### 5a. Reminder insertion call (`prompt.ts:530`)
Injects phase-specific reminders into messages
```text
msgs = await insertReminders({
```
### 5b. Plan mode reminder (`prompt.ts:1289`)
System reminder for plan mode restrictions
```text
Plan mode is active. The user indicated that they do not want you to execute yet
```
### 5c. Reminder injection (`prompt.ts:1274`)
Adds synthetic reminder parts to user messages
```text
userMessage.parts.push(part)
```
### 5d. Reminder format (`prompt.ts:599`)
Standard format for system reminders
```text
text: `<system-reminder>
```
### 5e. Reminder content (`prompt.ts:603`)
Standard reminder text for queued messages
```text
Please address this message and continue with your tasks.
```
## Q3
are there ways to automatically hook and create new session without disrupt the main flow of users and agents?
### Answer
Short answer
Yes. You can programmatically create new sessions at any time via the SDK or HTTP API without disrupting the current user/agent flow. Sessions are isolated, so creating a new one doesn’t interrupt an existing session’s prompt loop. There isn’t a dedicated “auto-create session” hook, but you can:
- Call `client.session.create()` from a plugin or external script opencode:970-1002 .
- React to events like `session.created` via the plugin `event` hook to trigger background actions opencode:148-150 .
- Use `Session.createNext()` in backend code to spawn a new session programmatically opencode:206-247 .
These approaches don’t affect the main flow because sessions run independently and the server routes are non-blocking opencode:203-209 .

Detailed answer
### Programmatic session creation options
- Via SDK: Use `client.session.create()` in a plugin or external process. This creates a session and returns its ID without altering any existing session opencode:970-1002 . Example in ACP session manager opencode:20-45 .
- Via backend: Call `Session.createNext()` to create a session with optional parent/permission metadata opencode:206-247 .
- Via HTTP: POST `/session` with directory/body; the server handler is non-blocking opencode:203-209 .

### Hooking into session lifecycle
- Use the plugin `event` hook to listen for `session.created` and then spawn additional sessions or perform background tasks opencode:148-150 . Example in plugins.mdx opencode:222-233 .
- No explicit “auto-create” trigger exists, but you can implement logic in any plugin hook (e.g., `chat.message`) to create sessions when certain conditions are met.

### Non-disruptive nature
- Sessions are isolated by directory and ID; creating a new session doesn’t affect the prompt loop of the current session opencode:477-654 .
- The server handles session creation concurrently; other sessions continue processing opencode:54-67 .
- Subagents can create child sessions as part of their workflow, but that’s agent-driven and visible to the user; it’s not a silent background spawn.

### Example: Auto-create from a plugin
```ts
// .opencode/plugins/auto-session.ts
import type { Plugin } from "@opencode-ai/plugin"

export const AutoSessionPlugin: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created" && event.properties.info.title.includes("trigger")) {
        await client.session.create({
          directory: event.properties.info.directory,
          body: { title: "Auto-spawned session" },
        })
      }
    },
  }
}
```

## Notes
- Session creation is fast and non-blocking, but avoid spamming; each session consumes resources.
- Use `parentID` if you want the new session to be a child of the current one for navigation purposes opencode:219-221 .
- There is no built-in “auto-create without any hook” mechanism; you must initiate creation via SDK/API or a plugin.

Wiki pages you might want to explore:
- [Client-Server Model (anomalyco/opencode)](/wiki/anomalyco/opencode#2.2)
### Citations
**File:** packages/sdk/js/src/v2/gen/sdk.gen.ts (L970-1002)
```typescript
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      parentID?: string
      title?: string
      permission?: PermissionRuleset
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "body", key: "parentID" },
            { in: "body", key: "title" },
            { in: "body", key: "permission" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionCreateResponses, SessionCreateErrors, ThrowOnError>({
      url: "/session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
```
**File:** packages/plugin/src/index.ts (L148-150)
```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
```
**File:** packages/opencode/src/session/index.ts (L206-247)
```typescript
  export async function createNext(input: {
    id?: string
    title?: string
    parentID?: string
    directory: string
    permission?: PermissionNext.Ruleset
  }) {
    const result: Info = {
      id: Identifier.descending("session", input.id),
      slug: Slug.create(),
      version: Installation.VERSION,
      projectID: Instance.project.id,
      directory: input.directory,
      parentID: input.parentID,
      title: input.title ?? createDefaultTitle(!!input.parentID),
      permission: input.permission,
      time: {
        created: Date.now(),
        updated: Date.now(),
      },
    }
    log.info("created", result)
    await Storage.write(["session", Instance.project.id, result.id], result)
    Bus.publish(Event.Created, {
      info: result,
    })
    const cfg = await Config.get()
    if (!result.parentID && (Flag.OPENCODE_AUTO_SHARE || cfg.share === "auto"))
      share(result.id)
        .then((share) => {
          update(result.id, (draft) => {
            draft.share = share
          })
        })
        .catch(() => {
          // Silently ignore sharing errors during session creation
        })
    Bus.publish(Event.Updated, {
      info: result,
    })
    return result
  }
```
**File:** packages/opencode/src/server/routes/session.ts (L54-67)
```typescript
      async (c) => {
        const query = c.req.valid("query")
        const term = query.search?.toLowerCase()
        const sessions: Session.Info[] = []
        for await (const session of Session.list()) {
          if (query.directory !== undefined && session.directory !== query.directory) continue
          if (query.roots && session.parentID) continue
          if (query.start !== undefined && session.time.updated < query.start) continue
          if (term !== undefined && !session.title.toLowerCase().includes(term)) continue
          sessions.push(session)
          if (query.limit !== undefined && sessions.length >= query.limit) break
        }
        return c.json(sessions)
      },
```
**File:** packages/opencode/src/server/routes/session.ts (L203-209)
```typescript
      validator("json", Session.create.schema.optional()),
      async (c) => {
        const body = c.req.valid("json") ?? {}
        const session = await Session.create(body)
        return c.json(session)
      },
    )
```
**File:** packages/opencode/src/acp/session.ts (L20-45)
```typescript
  async create(cwd: string, mcpServers: McpServer[], model?: ACPSessionState["model"]): Promise<ACPSessionState> {
    const session = await this.sdk.session
      .create(
        {
          title: `ACP Session ${crypto.randomUUID()}`,
          directory: cwd,
        },
        { throwOnError: true },
      )
      .then((x) => x.data!)

    const sessionId = session.id
    const resolvedModel = model

    const state: ACPSessionState = {
      id: sessionId,
      cwd,
      mcpServers,
      createdAt: new Date(),
      model: resolvedModel,
    }
    log.info("creating_session", { state })

    this.sessions.set(sessionId, state)
    return state
  }
```
**File:** packages/web/src/content/docs/plugins.mdx (L222-233)
```text
```js title=".opencode/plugins/notification.js"
export const NotificationPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    event: async ({ event }) => {
      // Send notification on session completion
      if (event.type === "session.idle") {
        await $`osascript -e 'display notification "Session completed!" with title "opencode"'`
      }
    },
  }
}
```
```
**File:** packages/opencode/src/session/prompt.ts (L477-654)
```typescript
            role: "user",
            time: {
              created: Date.now(),
            },
            agent: lastUser.agent,
            model: lastUser.model,
          }
          await Session.updateMessage(summaryUserMsg)
          await Session.updatePart({
            id: Identifier.ascending("part"),
            messageID: summaryUserMsg.id,
            sessionID,
            type: "text",
            text: "Summarize the task tool output above and continue with your task.",
            synthetic: true,
          } satisfies MessageV2.TextPart)
        }

        continue
      }

      // pending compaction
      if (task?.type === "compaction") {
        const result = await SessionCompaction.process({
          messages: msgs,
          parentID: lastUser.id,
          abort,
          sessionID,
          auto: task.auto,
        })
        if (result === "stop") break
        continue
      }

      // context overflow, needs compaction
      if (
        lastFinished &&
        lastFinished.summary !== true &&
        (await SessionCompaction.isOverflow({ tokens: lastFinished.tokens, model }))
      ) {
        await SessionCompaction.create({
          sessionID,
          agent: lastUser.agent,
          model: lastUser.model,
          auto: true,
        })
        continue
      }

      // normal processing
      const agent = await Agent.get(lastUser.agent)
      const maxSteps = agent.steps ?? Infinity
      const isLastStep = step >= maxSteps
      msgs = await insertReminders({
        messages: msgs,
        agent,
        session,
      })

      const processor = SessionProcessor.create({
        assistantMessage: (await Session.updateMessage({
          id: Identifier.ascending("message"),
          parentID: lastUser.id,
          role: "assistant",
          mode: agent.name,
          agent: agent.name,
          variant: lastUser.variant,
          path: {
            cwd: Instance.directory,
            root: Instance.worktree,
          },
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
          modelID: model.id,
          providerID: model.providerID,
          time: {
            created: Date.now(),
          },
          sessionID,
        })) as MessageV2.Assistant,
        sessionID: sessionID,
        model,
        abort,
      })
      using _ = defer(() => InstructionPrompt.clear(processor.message.id))

      // Check if user explicitly invoked an agent via @ in this turn
      const lastUserMsg = msgs.findLast((m) => m.info.role === "user")
      const bypassAgentCheck = lastUserMsg?.parts.some((p) => p.type === "agent") ?? false

      const tools = await resolveTools({
        agent,
        session,
        model,
        tools: lastUser.tools,
        processor,
        bypassAgentCheck,
        messages: msgs,
      })

      if (step === 1) {
        SessionSummary.summarize({
          sessionID: sessionID,
          messageID: lastUser.id,
        })
      }

      const sessionMessages = clone(msgs)

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

      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })

      const result = await processor.process({
        user: lastUser,
        agent,
        abort,
        sessionID,
        system: [...(await SystemPrompt.environment(model)), ...(await InstructionPrompt.system())],
        messages: [
          ...MessageV2.toModelMessages(sessionMessages, model),
          ...(isLastStep
            ? [
                {
                  role: "assistant" as const,
                  content: MAX_STEPS,
                },
              ]
            : []),
        ],
        tools,
        model,
      })
      if (result === "stop") break
      if (result === "compact") {
        await SessionCompaction.create({
          sessionID,
          agent: lastUser.agent,
          model: lastUser.model,
          auto: true,
        })
      }
      continue
    }
    SessionCompaction.prune({ sessionID })
    for await (const item of MessageV2.stream(sessionID)) {
      if (item.info.role === "user") continue
      const queued = state()[sessionID]?.callbacks ?? []
      for (const q of queued) {
        q.resolve(item)
      }
      return item
    }
    throw new Error("Impossible")
  })

```
## Q4
are there ways to automatically hook and create new session without disrupt the main flow of users and agents?
## OpenCode Automatic Session Creation
This codemap traces how OpenCode enables automatic session creation without disrupting the main flow. Key locations include the session creation endpoint [1d], the core session creation logic [2c], event publishing for hooks [3a], and plugin event handling [4b].
### 1. HTTP API Session Creation
How the server handles session creation requests via REST API
### 1a. POST /session endpoint (`session.ts:186`)
Defines the HTTP route for creating new sessions
```text
.post("/
```
### 1b. Request body validation (`session.ts:203`)
Validates optional JSON parameters for session creation
```text
validator("json", Session.create.schema.optional()),
```
### 1c. Extract request body (`session.ts:205`)
Gets validated parameters from request
```text
const body = c.req.valid("json") ?? {}
```
### 1d. Create session (`session.ts:206`)
Calls core session creation logic
```text
const session = await Session.create(body)
```
### 2. Core Session Creation Logic
The internal implementation that creates and persists sessions
### 2a. Public create function (`index.ts:140`)
Entry point for session creation with validation
```text
export const create = fn(
```
### 2b. Delegate to createNext (`index.ts:149`)
Forwards to the actual implementation
```text
return createNext({
```
### 2c. Build session object (`index.ts:213`)
Creates the session data structure with metadata
```text
const result: Info = {
```
### 2d. Persist session (`index.ts:228`)
Saves session to storage
```text
await Storage.write(["session", Instance.project.id, result.id], result)
```
### 3. Event Publishing for Hooks
How session creation triggers events for plugin hooks
### 3a. Publish created event (`index.ts:229`)
Emits session.created event for plugins
```text
Bus.publish(Event.Created, {
```
### 3b. Event definition (`index.ts:107`)
Defines the session.created event schema
```text
Created: BusEvent.define(
```
### 3c. Plugin event hook (`index.ts:149`)
Interface for plugins to handle events
```text
event?: (input: { event: Event }) => Promise<void>
```
### 4. SDK Session Creation
How external programs can create sessions via the SDK
### 4a. SDK create method (`sdk.gen.ts:970`)
SDK method for creating sessions
```text
public create<ThrowOnError extends boolean = false>(
```
### 4b. SDK usage example (`session.ts:21`)
ACP manager using SDK to create sessions
```text
const session = await this.sdk.session
```
### 4c. Extract session data (`session.ts:29`)
Gets session info from SDK response
```text
.then((x) => x.data!)
```
### 5. Plugin Auto-Creation Example
How plugins can automatically create sessions based on events
### 5a. Event handler (`plugins.mdx:225`)
Plugin hook to handle session events
```text
event: async ({ event }) => {
```
### 5b. Event condition (`plugins.mdx:227`)
Checks for specific session events
```text
if (event.type === "session.idle") {
```
### 5c. Action execution (`plugins.mdx:228`)
Performs action when event occurs
```text
await $`osascript -e 'display notification
```
## Q5
As I am thinking about more manipulation of context shaping, fast tracking (using different kinds of search techniques, vs main sessions and sub sessions (extracting more meaningful context through connections and relationships); particularly the files, paths, session’s parts of the SDK to activate more automation through precisions and concise context injection, making steering of graph-rag-like features when users prompt in main sessions → prompts are transformed - parsed with graph-nodes and extracted with inserted context - to either inject silently (no response) for sub sessions flow (by main session agent) or direct to main; the same kind of thoughts are for mimicking the not-not-allow-stop-hook until requirements met. I also wonder techniques linked to “time-machine”, “revalidated-thoughts” when agents nowadays are caped with long-haul agentic run (of turn-base tools executions, of very long interleaved thoughts → the more insightful schematic kinds of intelligence that auto parsed - forming networks of who-did-what ; of-what-cycles and what-false-thoughts-that-drive-such-contaminated-actions can become much easier to handle when things get tangle.
### Answer
Based on my investigation of the OpenCode codebase, I can provide detailed answers to your questions about these architectural patterns:

## Graph-Based Context Extraction and Relationship Mapping

OpenCode uses a **hierarchical relationship model** rather than a traditional graph database. The relationships are maintained through a strict storage hierarchy:

**Storage Structure**: `project` → `session` → `message` → `part` opencode:76-116 

Each level references its parent through ID fields (`projectID`, `sessionID`, `messageID`), creating a tree structure where parts reference messages, messages reference sessions, and sessions reference projects.

The message system defines these relationships through discriminated union types: opencode:39-43 opencode:332-350 

## Parsing User Prompts into Structured Nodes

Yes, OpenCode parses prompts into structured "nodes" (discriminated union types). There are multiple parsing mechanisms:

**Frontend Web Parsing**: The `parseFromDOM()` function extracts structured parts from the contenteditable DOM: opencode:586-626 

**Backend Template Parsing**: The `resolvePromptParts()` function parses `@filename` references from markdown-style templates: opencode:180-229 

These parsing functions create typed part objects (TextPart, FilePart, AgentPart, SubtaskPart) that form the structured representation: opencode:83-146 

## Silent Context Injection and Prompt Transformation

Yes, OpenCode provides **multiple mechanisms** for injecting context silently and transforming prompts:

**1. Compaction Hook for Silent Context Injection**: opencode:136-144 

Plugins can inject additional context arrays or completely replace the compaction prompt: opencode:213-222 

**2. Synthetic Parts** (not shown to user): opencode:471-493 

**3. Message Transform Hook**: opencode:610-610 opencode:197-205 

**4. System Prompt Transform Hook**: opencode:82-97 

## Sub-Session Context Handling

Sub-sessions are created through SubtaskPart and TaskTool execution: opencode:327-376 

## Preventing Session/Agent Stopping

**Currently, there is NO mechanism** to prevent session stopping based on requirements. The `cancel()` function immediately aborts without checking conditions: opencode:249-261 

To implement requirement-based stopping prevention, you would need to add hooks similar to the existing plugin system, potentially checking tool states before allowing cancellation: opencode:379-395 

## Long-Running Agentic Workflows

OpenCode handles long-running workflows through several mechanisms:

**1. Step-Based Loop System**: opencode:267-313 

**2. Cycle Detection (Doom Loop Detection)**: opencode:20-20 opencode:143-168 

The system detects when the last 3 tool calls are identical (same tool name and input) and triggers a permission check.

**3. Thought Tracking (Reasoning)**: opencode:62-100 

Reasoning is tracked through `ReasoningPart` objects that capture the model's internal thinking process.

## Notes

**Important clarifications**:

1. **"Graph nodes"** in OpenCode are actually discriminated union types (Part types) with positional and relational metadata, not graph database nodes.

2. **"False-thought identification"** does not exist in the codebase. The system tracks reasoning but doesn't validate or identify "false thoughts."

3. **Context extraction** is primarily file-based through the resolvePromptParts mechanism, not semantic graph-based extraction.

4. **Relationship mapping** is hierarchical (tree-based) rather than graph-based, maintained through ID references in the storage layer.

5. The plugin system provides the primary extension mechanism for custom context injection, prompt transformation, and workflow management through the Hooks interface.
### Citations
**File:** packages/opencode/src/storage/storage.ts (L76-116)
```typescript
          log.info(`migrating sessions for project ${projectID}`)
          for await (const sessionFile of new Bun.Glob("storage/session/info/*.json").scan({
            cwd: fullProjectDir,
            absolute: true,
          })) {
            const dest = path.join(dir, "session", projectID, path.basename(sessionFile))
            log.info("copying", {
              sessionFile,
              dest,
            })
            const session = await Bun.file(sessionFile).json()
            await Bun.write(dest, JSON.stringify(session))
            log.info(`migrating messages for session ${session.id}`)
            for await (const msgFile of new Bun.Glob(`storage/session/message/${session.id}/*.json`).scan({
              cwd: fullProjectDir,
              absolute: true,
            })) {
              const dest = path.join(dir, "message", session.id, path.basename(msgFile))
              log.info("copying", {
                msgFile,
                dest,
              })
              const message = await Bun.file(msgFile).json()
              await Bun.write(dest, JSON.stringify(message))

              log.info(`migrating parts for message ${message.id}`)
              for await (const partFile of new Bun.Glob(`storage/session/part/${session.id}/${message.id}/*.json`).scan(
                {
                  cwd: fullProjectDir,
                  absolute: true,
                },
              )) {
                const dest = path.join(dir, "part", message.id, path.basename(partFile))
                const part = await Bun.file(partFile).json()
                log.info("copying", {
                  partFile,
                  dest,
                })
                await Bun.write(dest, JSON.stringify(part))
              }
            }
```
**File:** packages/opencode/src/session/message-v2.ts (L39-43)
```typescript
  const PartBase = z.object({
    id: z.string(),
    sessionID: z.string(),
    messageID: z.string(),
  })
```
**File:** packages/opencode/src/session/message-v2.ts (L332-350)
```typescript
  export const Part = z
    .discriminatedUnion("type", [
      TextPart,
      SubtaskPart,
      ReasoningPart,
      FilePart,
      ToolPart,
      StepStartPart,
      StepFinishPart,
      SnapshotPart,
      PatchPart,
      AgentPart,
      RetryPart,
      CompactionPart,
    ])
    .meta({
      ref: "Part",
    })
  export type Part = z.infer<typeof Part>
```
**File:** packages/app/src/components/prompt-input.tsx (L586-626)
```typescript
    const visit = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        buffer += node.textContent ?? ""
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return

      const el = node as HTMLElement
      if (el.dataset.type === "file") {
        flushText()
        pushFile(el)
        return
      }
      if (el.dataset.type === "agent") {
        flushText()
        pushAgent(el)
        return
      }
      if (el.tagName === "BR") {
        buffer += "\n"
        return
      }

      for (const child of Array.from(el.childNodes)) {
        visit(child)
      }
    }

    const children = Array.from(editorRef.childNodes)
    children.forEach((child, index) => {
      const isBlock = child.nodeType === Node.ELEMENT_NODE && ["DIV", "P"].includes((child as HTMLElement).tagName)
      visit(child)
      if (isBlock && index < children.length - 1) {
        buffer += "\n"
      }
    })

    flushText()

    if (parts.length === 0) parts.push(...DEFAULT_PROMPT)
    return parts
```
**File:** packages/opencode/src/session/prompt.ts (L83-146)
```typescript
  export const PromptInput = z.object({
    sessionID: Identifier.schema("session"),
    messageID: Identifier.schema("message").optional(),
    model: z
      .object({
        providerID: z.string(),
        modelID: z.string(),
      })
      .optional(),
    agent: z.string().optional(),
    noReply: z.boolean().optional(),
    tools: z
      .record(z.string(), z.boolean())
      .optional()
      .describe(
        "@deprecated tools and permissions have been merged, you can set permissions on the session itself now",
      ),
    system: z.string().optional(),
    variant: z.string().optional(),
    parts: z.array(
      z.discriminatedUnion("type", [
        MessageV2.TextPart.omit({
          messageID: true,
          sessionID: true,
        })
          .partial({
            id: true,
          })
          .meta({
            ref: "TextPartInput",
          }),
        MessageV2.FilePart.omit({
          messageID: true,
          sessionID: true,
        })
          .partial({
            id: true,
          })
          .meta({
            ref: "FilePartInput",
          }),
        MessageV2.AgentPart.omit({
          messageID: true,
          sessionID: true,
        })
          .partial({
            id: true,
          })
          .meta({
            ref: "AgentPartInput",
          }),
        MessageV2.SubtaskPart.omit({
          messageID: true,
          sessionID: true,
        })
          .partial({
            id: true,
          })
          .meta({
            ref: "SubtaskPartInput",
          }),
      ]),
    ),
  })
```
**File:** packages/opencode/src/session/prompt.ts (L180-229)
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
          : path.resolve(Instance.worktree, name)

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
**File:** packages/opencode/src/session/prompt.ts (L249-261)
```typescript
  export function cancel(sessionID: string) {
    log.info("cancel", { sessionID })
    const s = state()
    const match = s[sessionID]
    if (!match) {
      SessionStatus.set(sessionID, { type: "idle" })
      return
    }
    match.abort.abort()
    delete s[sessionID]
    SessionStatus.set(sessionID, { type: "idle" })
    return
  }
```
**File:** packages/opencode/src/session/prompt.ts (L267-313)
```typescript
  export const loop = fn(LoopInput, async (input) => {
    const { sessionID, resume_existing } = input

    const abort = resume_existing ? resume(sessionID) : start(sessionID)
    if (!abort) {
      return new Promise<MessageV2.WithParts>((resolve, reject) => {
        const callbacks = state()[sessionID].callbacks
        callbacks.push({ resolve, reject })
      })
    }

    using _ = defer(() => cancel(sessionID))

    let step = 0
    const session = await Session.get(sessionID)
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
```
**File:** packages/opencode/src/session/prompt.ts (L327-376)
```typescript
      // pending subtask
      // TODO: centralize "invoke tool" logic
      if (task?.type === "subtask") {
        const taskTool = await TaskTool.init()
        const taskModel = task.model ? await Provider.getModel(task.model.providerID, task.model.modelID) : model
        const assistantMessage = (await Session.updateMessage({
          id: Identifier.ascending("message"),
          role: "assistant",
          parentID: lastUser.id,
          sessionID,
          mode: task.agent,
          agent: task.agent,
          variant: lastUser.variant,
          path: {
            cwd: Instance.directory,
            root: Instance.worktree,
          },
          cost: 0,
          tokens: {
            input: 0,
            output: 0,
            reasoning: 0,
            cache: { read: 0, write: 0 },
          },
          modelID: taskModel.id,
          providerID: taskModel.providerID,
          time: {
            created: Date.now(),
          },
        })) as MessageV2.Assistant
        let part = (await Session.updatePart({
          id: Identifier.ascending("part"),
          messageID: assistantMessage.id,
          sessionID: assistantMessage.sessionID,
          type: "tool",
          callID: ulid(),
          tool: TaskTool.id,
          state: {
            status: "running",
            input: {
              prompt: task.prompt,
              description: task.description,
              subagent_type: task.agent,
              command: task.command,
            },
            time: {
              start: Date.now(),
            },
          },
        })) as MessageV2.ToolPart
```
**File:** packages/opencode/src/session/prompt.ts (L471-493)
```typescript
          // Add synthetic user message to prevent certain reasoning models from erroring
          // If we create assistant messages w/ out user ones following mid loop thinking signatures
          // will be missing and it can cause errors for models like gemini for example
          const summaryUserMsg: MessageV2.User = {
            id: Identifier.ascending("message"),
            sessionID,
            role: "user",
            time: {
              created: Date.now(),
            },
            agent: lastUser.agent,
            model: lastUser.model,
          }
          await Session.updateMessage(summaryUserMsg)
          await Session.updatePart({
            id: Identifier.ascending("part"),
            messageID: summaryUserMsg.id,
            sessionID,
            type: "text",
            text: "Summarize the task tool output above and continue with your task.",
            synthetic: true,
          } satisfies MessageV2.TextPart)
        }
```
**File:** packages/opencode/src/session/prompt.ts (L610-610)
```typescript
      await Plugin.trigger("experimental.chat.messages.transform", {}, { messages: sessionMessages })
```
**File:** packages/opencode/src/session/compaction.ts (L136-144)
```typescript
    // Allow plugins to inject context or replace compaction prompt
    const compacting = await Plugin.trigger(
      "experimental.session.compacting",
      { sessionID: input.sessionID },
      { context: [], prompt: undefined },
    )
    const defaultPrompt =
      "Provide a detailed prompt for continuing our conversation above. Focus on information that would be helpful for continuing the conversation, including what we did, what we're doing, which files we're working on, and what we're going to do next considering new session will not have access to our conversation."
    const promptText = compacting.prompt ?? [defaultPrompt, ...compacting.context].join("\n\n")
```
**File:** packages/plugin/src/index.ts (L197-205)
```typescript
  "experimental.chat.messages.transform"?: (
    input: {},
    output: {
      messages: {
        info: Message
        parts: Part[]
      }[]
    },
  ) => Promise<void>
```
**File:** packages/plugin/src/index.ts (L213-222)
```typescript
   * Called before session compaction starts. Allows plugins to customize
   * the compaction prompt.
   *
   * - `context`: Additional context strings appended to the default prompt
   * - `prompt`: If set, replaces the default compaction prompt entirely
   */
  "experimental.session.compacting"?: (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ) => Promise<void>
```
**File:** packages/opencode/src/session/llm.ts (L82-97)
```typescript
    const header = system[0]
    const original = clone(system)
    await Plugin.trigger(
      "experimental.chat.system.transform",
      { sessionID: input.sessionID, model: input.model },
      { system },
    )
    if (system.length === 0) {
      system.push(...original)
    }
    // rejoin to maintain 2-part structure for caching if header unchanged
    if (system.length > 2 && system[0] === header) {
      const rest = system.slice(1)
      system.length = 0
      system.push(header, rest.join("\n"))
    }
```
**File:** packages/opencode/src/session/processor.ts (L20-20)
```typescript
  const DOOM_LOOP_THRESHOLD = 3
```
**File:** packages/opencode/src/session/processor.ts (L62-100)
```typescript
                case "reasoning-start":
                  if (value.id in reasoningMap) {
                    continue
                  }
                  reasoningMap[value.id] = {
                    id: Identifier.ascending("part"),
                    messageID: input.assistantMessage.id,
                    sessionID: input.assistantMessage.sessionID,
                    type: "reasoning",
                    text: "",
                    time: {
                      start: Date.now(),
                    },
                    metadata: value.providerMetadata,
                  }
                  break

                case "reasoning-delta":
                  if (value.id in reasoningMap) {
                    const part = reasoningMap[value.id]
                    part.text += value.text
                    if (value.providerMetadata) part.metadata = value.providerMetadata
                    if (part.text) await Session.updatePart({ part, delta: value.text })
                  }
                  break

                case "reasoning-end":
                  if (value.id in reasoningMap) {
                    const part = reasoningMap[value.id]
                    part.text = part.text.trimEnd()

                    part.time = {
                      ...part.time,
                      end: Date.now(),
                    }
                    if (value.providerMetadata) part.metadata = value.providerMetadata
                    await Session.updatePart(part)
                    delete reasoningMap[value.id]
                  }
```
**File:** packages/opencode/src/session/processor.ts (L143-168)
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
```
**File:** packages/opencode/src/session/processor.ts (L379-395)
```typescript
          const p = await MessageV2.parts(input.assistantMessage.id)
          for (const part of p) {
            if (part.type === "tool" && part.state.status !== "completed" && part.state.status !== "error") {
              await Session.updatePart({
                ...part,
                state: {
                  ...part.state,
                  status: "error",
                  error: "Tool execution aborted",
                  time: {
                    start: Date.now(),
                    end: Date.now(),
                  },
                },
              })
            }
          }
```