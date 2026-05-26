This file is a merged representation of a subset of the codebase, containing specifically included files, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: packages/plugin/src/**, packages/sdk/js/src/**, packages/opencode/src/acp/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
packages/
  opencode/
    src/
      acp/
        agent.ts
        README.md
        session.ts
        types.ts
  plugin/
    src/
      example-workspace.ts
      example.ts
      index.ts
      shell.ts
      tool.ts
      tui.ts
  sdk/
    js/
      src/
        gen/
          client/
            client.gen.ts
            index.ts
            types.gen.ts
            utils.gen.ts
          core/
            auth.gen.ts
            bodySerializer.gen.ts
            params.gen.ts
            pathSerializer.gen.ts
            queryKeySerializer.gen.ts
            serverSentEvents.gen.ts
            types.gen.ts
            utils.gen.ts
          client.gen.ts
          sdk.gen.ts
          types.gen.ts
        v2/
          gen/
            client/
              client.gen.ts
              index.ts
              types.gen.ts
              utils.gen.ts
            core/
              auth.gen.ts
              bodySerializer.gen.ts
              params.gen.ts
              pathSerializer.gen.ts
              queryKeySerializer.gen.ts
              serverSentEvents.gen.ts
              types.gen.ts
              utils.gen.ts
            client.gen.ts
            sdk.gen.ts
            types.gen.ts
          client.ts
          data.ts
          index.ts
          server.ts
        client.ts
        index.ts
        process.ts
        server.ts
```

# Files

## File: packages/opencode/src/acp/agent.ts
````typescript
import {
  RequestError,
  type Agent as ACPAgent,
  type AgentSideConnection,
  type AuthenticateRequest,
  type AuthMethod,
  type CancelNotification,
  type CloseSessionRequest,
  type CloseSessionResponse,
  type ForkSessionRequest,
  type ForkSessionResponse,
  type InitializeRequest,
  type InitializeResponse,
  type ListSessionsRequest,
  type ListSessionsResponse,
  type LoadSessionRequest,
  type NewSessionRequest,
  type PermissionOption,
  type PlanEntry,
  type PromptRequest,
  type ResumeSessionRequest,
  type ResumeSessionResponse,
  type Role,
  type SessionInfo,
  type SetSessionModelRequest,
  type SessionConfigOption,
  type SetSessionConfigOptionRequest,
  type SetSessionConfigOptionResponse,
  type SetSessionModeRequest,
  type SetSessionModeResponse,
  type ToolCallContent,
  type ToolKind,
  type Usage,
} from "@agentclientprotocol/sdk"

import * as Log from "@opencode-ai/core/util/log"
import { pathToFileURL } from "url"
import { Filesystem } from "@/util/filesystem"
import { Hash } from "@opencode-ai/core/util/hash"
import { ACPSessionManager } from "./session"
import type { ACPConfig } from "./types"
import { Provider } from "@/provider/provider"
import { ModelID, ProviderID } from "../provider/schema"
import { Agent as AgentModule } from "../agent/agent"
import { AppRuntime } from "@/effect/app-runtime"
import { Installation } from "@/installation"
import { MessageV2 } from "@/session/message-v2"
import { Config } from "@/config/config"
import { ConfigMCP } from "@/config/mcp"
import { Todo } from "@/session/todo"
import { Result, Schema } from "effect"
import { LoadAPIKeyError } from "ai"
import type { AssistantMessage, Event, OpencodeClient, SessionMessageResponse, ToolPart } from "@opencode-ai/sdk/v2"
import { applyPatch } from "diff"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import { ShellID } from "@/tool/shell/id"

type ModeOption = { id: string; name: string; description?: string }
type ModelOption = { modelId: string; name: string }
const decodeTodos = Schema.decodeUnknownResult(Schema.fromJsonString(Schema.Array(Todo.Info)))

const DEFAULT_VARIANT_VALUE = "default"

const log = Log.create({ service: "acp-agent" })

async function getContextLimit(
  sdk: OpencodeClient,
  providerID: ProviderID,
  modelID: ModelID,
  directory: string,
): Promise<number | null> {
  const providers = await sdk.config
    .providers({ directory })
    .then((x) => x.data?.providers ?? [])
    .catch((error) => {
      log.error("failed to get providers for context limit", { error })
      return []
    })

  const provider = providers.find((p) => p.id === providerID)
  const model = provider?.models[modelID]
  return model?.limit.context ?? null
}

async function sendUsageUpdate(
  connection: AgentSideConnection,
  sdk: OpencodeClient,
  sessionID: string,
  directory: string,
): Promise<void> {
  const messages = await sdk.session
    .messages({ sessionID, directory }, { throwOnError: true })
    .then((x) => x.data)
    .catch((error) => {
      log.error("failed to fetch messages for usage update", { error })
      return undefined
    })

  if (!messages) return

  const assistantMessages = messages.filter(
    (m): m is { info: AssistantMessage; parts: SessionMessageResponse["parts"] } => m.info.role === "assistant",
  )

  const lastAssistant = assistantMessages[assistantMessages.length - 1]
  if (!lastAssistant) return

  const msg = lastAssistant.info
  if (!msg.providerID || !msg.modelID) return
  const size = await getContextLimit(sdk, ProviderID.make(msg.providerID), ModelID.make(msg.modelID), directory)

  if (!size) {
    // Cannot calculate usage without known context size
    return
  }

  const used = msg.tokens.input + (msg.tokens.cache?.read ?? 0)
  const totalCost = assistantMessages.reduce((sum, m) => sum + m.info.cost, 0)

  await connection
    .sessionUpdate({
      sessionId: sessionID,
      update: {
        sessionUpdate: "usage_update",
        used,
        size,
        cost: { amount: totalCost, currency: "USD" },
      },
    })
    .catch((error) => {
      log.error("failed to send usage update", { error })
    })
}

export function init({ sdk: _sdk }: { sdk: OpencodeClient }) {
  return {
    create: (connection: AgentSideConnection, fullConfig: ACPConfig) => {
      return new Agent(connection, fullConfig)
    },
  }
}

export class Agent implements ACPAgent {
  private connection: AgentSideConnection
  private config: ACPConfig
  private sdk: OpencodeClient
  private sessionManager: ACPSessionManager
  private eventAbort = new AbortController()
  private eventStarted = false
  private shellSnapshots = new Map<string, string>()
  private toolStarts = new Set<string>()
  private permissionQueues = new Map<string, Promise<void>>()
  private permissionOptions: PermissionOption[] = [
    { optionId: "once", kind: "allow_once", name: "Allow once" },
    { optionId: "always", kind: "allow_always", name: "Always allow" },
    { optionId: "reject", kind: "reject_once", name: "Reject" },
  ]

  constructor(connection: AgentSideConnection, config: ACPConfig) {
    this.connection = connection
    this.config = config
    this.sdk = config.sdk
    this.sessionManager = new ACPSessionManager(this.sdk)
    this.startEventSubscription()
  }

  private startEventSubscription() {
    if (this.eventStarted) return
    this.eventStarted = true
    this.runEventSubscription().catch((error) => {
      if (this.eventAbort.signal.aborted) return
      log.error("event subscription failed", { error })
    })
  }

  private async runEventSubscription() {
    while (true) {
      if (this.eventAbort.signal.aborted) return
      const events = await this.sdk.global.event({
        signal: this.eventAbort.signal,
      })
      for await (const event of events.stream) {
        if (this.eventAbort.signal.aborted) return
        const payload = event?.payload
        if (!payload) continue
        await this.handleEvent(payload as Event).catch((error) => {
          log.error("failed to handle event", { error, type: payload.type })
        })
      }
    }
  }

  private async handleEvent(event: Event) {
    switch (event.type) {
      case "permission.asked": {
        const permission = event.properties
        const session = this.sessionManager.tryGet(permission.sessionID)
        if (!session) return

        const prev = this.permissionQueues.get(permission.sessionID) ?? Promise.resolve()
        const next = prev
          .then(async () => {
            const directory = session.cwd

            const res = await this.connection
              .requestPermission({
                sessionId: permission.sessionID,
                toolCall: {
                  toolCallId: permission.tool?.callID ?? permission.id,
                  status: "pending",
                  title: permission.permission,
                  rawInput: permission.metadata,
                  kind: toToolKind(permission.permission),
                  locations: toLocations(permission.permission, permission.metadata),
                },
                options: this.permissionOptions,
              })
              .catch(async (error) => {
                log.error("failed to request permission from ACP", {
                  error,
                  permissionID: permission.id,
                  sessionID: permission.sessionID,
                })
                await this.sdk.permission.reply({
                  requestID: permission.id,
                  reply: "reject",
                  directory,
                })
                return undefined
              })

            if (!res) return
            if (res.outcome.outcome !== "selected") {
              await this.sdk.permission.reply({
                requestID: permission.id,
                reply: "reject",
                directory,
              })
              return
            }

            if (res.outcome.optionId !== "reject" && permission.permission == "edit") {
              const metadata = permission.metadata || {}
              const filepath = typeof metadata["filepath"] === "string" ? metadata["filepath"] : ""
              const diff = typeof metadata["diff"] === "string" ? metadata["diff"] : ""
              const content = (await Filesystem.exists(filepath)) ? await Filesystem.readText(filepath) : ""
              const newContent = getNewContent(content, diff)

              if (newContent) {
                void this.connection.writeTextFile({
                  sessionId: session.id,
                  path: filepath,
                  content: newContent,
                })
              }
            }

            await this.sdk.permission.reply({
              requestID: permission.id,
              reply: res.outcome.optionId as "once" | "always" | "reject",
              directory,
            })
          })
          .catch((error) => {
            log.error("failed to handle permission", { error, permissionID: permission.id })
          })
          .finally(() => {
            if (this.permissionQueues.get(permission.sessionID) === next) {
              this.permissionQueues.delete(permission.sessionID)
            }
          })
        this.permissionQueues.set(permission.sessionID, next)
        return
      }

      case "message.part.updated": {
        log.info("message part updated", { event: event.properties })
        const props = event.properties
        const part = props.part
        const session = this.sessionManager.tryGet(part.sessionID)
        if (!session) return
        const sessionId = session.id

        if (part.type === "tool") {
          await this.toolStart(sessionId, part)

          switch (part.state.status) {
            case "pending":
              this.shellSnapshots.delete(part.callID)
              return

            case "running":
              const output = this.shellOutput(part)
              const content: ToolCallContent[] = []
              if (output) {
                const hash = Hash.fast(output)
                if (part.tool === ShellID.ToolID) {
                  if (this.shellSnapshots.get(part.callID) === hash) {
                    await this.connection
                      .sessionUpdate({
                        sessionId,
                        update: {
                          sessionUpdate: "tool_call_update",
                          toolCallId: part.callID,
                          status: "in_progress",
                          kind: toToolKind(part.tool),
                          title: part.tool,
                          locations: toLocations(part.tool, part.state.input),
                          rawInput: part.state.input,
                        },
                      })
                      .catch((error) => {
                        log.error("failed to send tool in_progress to ACP", { error })
                      })
                    return
                  }
                  this.shellSnapshots.set(part.callID, hash)
                }
                content.push({
                  type: "content",
                  content: {
                    type: "text",
                    text: output,
                  },
                })
              }
              await this.connection
                .sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: "tool_call_update",
                    toolCallId: part.callID,
                    status: "in_progress",
                    kind: toToolKind(part.tool),
                    title: part.tool,
                    locations: toLocations(part.tool, part.state.input),
                    rawInput: part.state.input,
                    ...(content.length > 0 && { content }),
                  },
                })
                .catch((error) => {
                  log.error("failed to send tool in_progress to ACP", { error })
                })
              return

            case "completed": {
              this.toolStarts.delete(part.callID)
              this.shellSnapshots.delete(part.callID)
              const kind = toToolKind(part.tool)
              const content = completedToolContent(part, kind)

              if (part.tool === "todowrite") {
                const parsedTodos = decodeTodos(part.state.output)
                if (Result.isSuccess(parsedTodos)) {
                  await this.connection
                    .sessionUpdate({
                      sessionId,
                      update: {
                        sessionUpdate: "plan",
                        entries: parsedTodos.success.map((todo) => {
                          const status: PlanEntry["status"] =
                            todo.status === "cancelled" ? "completed" : (todo.status as PlanEntry["status"])
                          return {
                            priority: "medium",
                            status,
                            content: todo.content,
                          }
                        }),
                      },
                    })
                    .catch((error) => {
                      log.error("failed to send session update for todo", { error })
                    })
                } else {
                  log.error("failed to parse todo output", { error: parsedTodos.failure })
                }
              }

              await this.connection
                .sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: "tool_call_update",
                    toolCallId: part.callID,
                    status: "completed",
                    kind,
                    content,
                    title: part.state.title,
                    rawInput: part.state.input,
                    rawOutput: completedToolRawOutput(part),
                  },
                })
                .catch((error) => {
                  log.error("failed to send tool completed to ACP", { error })
                })
              return
            }
            case "error":
              this.toolStarts.delete(part.callID)
              this.shellSnapshots.delete(part.callID)
              await this.connection
                .sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: "tool_call_update",
                    toolCallId: part.callID,
                    status: "failed",
                    kind: toToolKind(part.tool),
                    title: part.tool,
                    rawInput: part.state.input,
                    content: [
                      {
                        type: "content",
                        content: {
                          type: "text",
                          text: part.state.error,
                        },
                      },
                    ],
                    rawOutput: {
                      error: part.state.error,
                      metadata: part.state.metadata,
                    },
                  },
                })
                .catch((error) => {
                  log.error("failed to send tool error to ACP", { error })
                })
              return
          }
        }

        // ACP clients already know the prompt they just submitted, so replaying
        // live user parts duplicates the message. We still replay user history in
        // loadSession() and forkSession() via processMessage().
        if (part.type !== "text" && part.type !== "file") return

        return
      }

      case "message.part.delta": {
        const props = event.properties
        const session = this.sessionManager.tryGet(props.sessionID)
        if (!session) return
        const sessionId = session.id

        const message = await this.sdk.session
          .message(
            {
              sessionID: props.sessionID,
              messageID: props.messageID,
              directory: session.cwd,
            },
            { throwOnError: true },
          )
          .then((x) => x.data)
          .catch((error) => {
            log.error("unexpected error when fetching message", { error })
            return undefined
          })

        if (!message || message.info.role !== "assistant") return

        const part = message.parts.find((p) => p.id === props.partID)
        if (!part) return

        if (part.type === "text" && props.field === "text" && part.ignored !== true) {
          await this.connection
            .sessionUpdate({
              sessionId,
              update: {
                sessionUpdate: "agent_message_chunk",
                messageId: props.messageID,
                content: {
                  type: "text",
                  text: props.delta,
                },
              },
            })
            .catch((error) => {
              log.error("failed to send text delta to ACP", { error })
            })
          return
        }

        if (part.type === "reasoning" && props.field === "text") {
          await this.connection
            .sessionUpdate({
              sessionId,
              update: {
                sessionUpdate: "agent_thought_chunk",
                messageId: props.messageID,
                content: {
                  type: "text",
                  text: props.delta,
                },
              },
            })
            .catch((error) => {
              log.error("failed to send reasoning delta to ACP", { error })
            })
        }
        return
      }
    }
  }

  async initialize(params: InitializeRequest): Promise<InitializeResponse> {
    log.info("initialize", { protocolVersion: params.protocolVersion })

    const authMethod: AuthMethod = {
      description: "Run `opencode auth login` in the terminal",
      name: "Login with opencode",
      id: "opencode-login",
    }

    // If client supports terminal-auth capability, use that instead.
    if (params.clientCapabilities?._meta?.["terminal-auth"] === true) {
      authMethod._meta = {
        "terminal-auth": {
          command: "opencode",
          args: ["auth", "login"],
          label: "OpenCode Login",
        },
      }
    }

    return {
      protocolVersion: 1,
      agentCapabilities: {
        loadSession: true,
        mcpCapabilities: {
          http: true,
          sse: true,
        },
        promptCapabilities: {
          embeddedContext: true,
          image: true,
        },
        sessionCapabilities: {
          close: {},
          fork: {},
          list: {},
          resume: {},
        },
      },
      authMethods: [authMethod],
      agentInfo: {
        name: "OpenCode",
        version: InstallationVersion,
      },
    }
  }

  async authenticate(_params: AuthenticateRequest) {
    throw new Error("Authentication not implemented")
  }

  async newSession(params: NewSessionRequest) {
    const directory = params.cwd
    try {
      const model = await defaultModel(this.config, directory)

      // Store ACP session state
      const state = await this.sessionManager.create(params.cwd, params.mcpServers, model)
      const sessionId = state.id

      log.info("creating_session", { sessionId, mcpServers: params.mcpServers.length })

      const load = await this.loadSessionMode({
        cwd: directory,
        mcpServers: params.mcpServers,
        sessionId,
      })

      return {
        sessionId,
        configOptions: load.configOptions,
        models: load.models,
        modes: load.modes,
        _meta: load._meta,
      }
    } catch (e) {
      const error = MessageV2.fromError(e, {
        providerID: ProviderID.make(this.config.defaultModel?.providerID ?? "unknown"),
      })
      if (LoadAPIKeyError.isInstance(error)) {
        throw RequestError.authRequired()
      }
      throw e
    }
  }

  async loadSession(params: LoadSessionRequest) {
    const directory = params.cwd
    const sessionId = params.sessionId

    try {
      const model = await defaultModel(this.config, directory)

      // Store ACP session state
      await this.sessionManager.load(sessionId, params.cwd, params.mcpServers, model)

      const messages = await this.loadSessionMessages(directory, sessionId)
      this.restoreSessionStateFromMessages(sessionId, messages)

      log.info("load_session", { sessionId, mcpServers: params.mcpServers.length })

      const result = await this.loadSessionMode({
        cwd: directory,
        mcpServers: params.mcpServers,
        sessionId,
      })

      for (const msg of messages ?? []) {
        log.debug("replay message", msg)
        await this.processMessage(msg)
      }

      await sendUsageUpdate(this.connection, this.sdk, sessionId, directory)

      return result
    } catch (e) {
      const error = MessageV2.fromError(e, {
        providerID: ProviderID.make(this.config.defaultModel?.providerID ?? "unknown"),
      })
      if (LoadAPIKeyError.isInstance(error)) {
        throw RequestError.authRequired()
      }
      throw e
    }
  }

  async listSessions(params: ListSessionsRequest): Promise<ListSessionsResponse> {
    try {
      const cursor = params.cursor ? Number(params.cursor) : undefined
      const limit = 100

      const sessions = await this.sdk.session
        .list(
          {
            directory: params.cwd ?? undefined,
            roots: true,
          },
          { throwOnError: true },
        )
        .then((x) => x.data ?? [])

      const sorted = sessions.toSorted((a, b) => b.time.updated - a.time.updated)
      const filtered = cursor ? sorted.filter((s) => s.time.updated < cursor) : sorted
      const page = filtered.slice(0, limit)

      const entries: SessionInfo[] = page.map((session) => ({
        sessionId: session.id,
        cwd: session.directory,
        title: session.title,
        updatedAt: new Date(session.time.updated).toISOString(),
      }))

      const last = page[page.length - 1]
      const next = filtered.length > limit && last ? String(last.time.updated) : undefined

      const response: ListSessionsResponse = {
        sessions: entries,
      }
      if (next) response.nextCursor = next
      return response
    } catch (e) {
      const error = MessageV2.fromError(e, {
        providerID: ProviderID.make(this.config.defaultModel?.providerID ?? "unknown"),
      })
      if (LoadAPIKeyError.isInstance(error)) {
        throw RequestError.authRequired()
      }
      throw e
    }
  }

  async unstable_forkSession(params: ForkSessionRequest): Promise<ForkSessionResponse> {
    const directory = params.cwd
    const mcpServers = params.mcpServers ?? []

    try {
      const model = await defaultModel(this.config, directory)

      const forked = await this.sdk.session
        .fork(
          {
            sessionID: params.sessionId,
            directory,
          },
          { throwOnError: true },
        )
        .then((x) => x.data)

      if (!forked) {
        throw new Error("Fork session returned no data")
      }

      const sessionId = forked.id
      await this.sessionManager.load(sessionId, directory, mcpServers, model)

      const messages = await this.loadSessionMessages(directory, sessionId)
      this.restoreSessionStateFromMessages(sessionId, messages)

      log.info("fork_session", { sessionId, mcpServers: mcpServers.length })

      const mode = await this.loadSessionMode({
        cwd: directory,
        mcpServers,
        sessionId,
      })

      for (const msg of messages ?? []) {
        log.debug("replay message", msg)
        await this.processMessage(msg)
      }

      await sendUsageUpdate(this.connection, this.sdk, sessionId, directory)

      return mode
    } catch (e) {
      const error = MessageV2.fromError(e, {
        providerID: ProviderID.make(this.config.defaultModel?.providerID ?? "unknown"),
      })
      if (LoadAPIKeyError.isInstance(error)) {
        throw RequestError.authRequired()
      }
      throw e
    }
  }

  async resumeSession(params: ResumeSessionRequest): Promise<ResumeSessionResponse> {
    const directory = params.cwd
    const sessionId = params.sessionId
    const mcpServers = params.mcpServers ?? []

    try {
      const model = await defaultModel(this.config, directory)
      await this.sessionManager.load(sessionId, directory, mcpServers, model)

      const messages = await this.loadSessionMessages(directory, sessionId, 20)
      this.restoreSessionStateFromMessages(sessionId, messages)

      log.info("resume_session", { sessionId, mcpServers: mcpServers.length })

      const result = await this.loadSessionMode({
        cwd: directory,
        mcpServers,
        sessionId,
      })

      await sendUsageUpdate(this.connection, this.sdk, sessionId, directory)

      return result
    } catch (e) {
      const error = MessageV2.fromError(e, {
        providerID: ProviderID.make(this.config.defaultModel?.providerID ?? "unknown"),
      })
      if (LoadAPIKeyError.isInstance(error)) {
        throw RequestError.authRequired()
      }
      throw e
    }
  }

  async closeSession(params: CloseSessionRequest): Promise<CloseSessionResponse> {
    const session = this.sessionManager.remove(params.sessionId)
    if (!session) return {}

    await this.sdk.session
      .abort(
        {
          sessionID: params.sessionId,
          directory: session.cwd,
        },
        { throwOnError: true },
      )
      .catch((error) => {
        log.error("failed to abort session while closing ACP session", { error, sessionID: params.sessionId })
      })

    this.permissionQueues.delete(params.sessionId)
    log.info("close_session", { sessionId: params.sessionId })
    return {}
  }

  private async processMessage(message: SessionMessageResponse) {
    log.debug("process message", message)
    if (message.info.role !== "assistant" && message.info.role !== "user") return
    const sessionId = message.info.sessionID

    for (const part of message.parts) {
      if (part.type === "tool") {
        await this.toolStart(sessionId, part)
        switch (part.state.status) {
          case "pending":
            this.shellSnapshots.delete(part.callID)
            break
          case "running":
            const output = this.shellOutput(part)
            const runningContent: ToolCallContent[] = []
            if (output) {
              runningContent.push({
                type: "content",
                content: {
                  type: "text",
                  text: output,
                },
              })
            }
            await this.connection
              .sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: "tool_call_update",
                  toolCallId: part.callID,
                  status: "in_progress",
                  kind: toToolKind(part.tool),
                  title: part.tool,
                  locations: toLocations(part.tool, part.state.input),
                  rawInput: part.state.input,
                  ...(runningContent.length > 0 && { content: runningContent }),
                },
              })
              .catch((err) => {
                log.error("failed to send tool in_progress to ACP", { error: err })
              })
            break
          case "completed":
            this.toolStarts.delete(part.callID)
            this.shellSnapshots.delete(part.callID)
            const kind = toToolKind(part.tool)
            const content = completedToolContent(part, kind)

            if (part.tool === "todowrite") {
              const parsedTodos = decodeTodos(part.state.output)
              if (Result.isSuccess(parsedTodos)) {
                await this.connection
                  .sessionUpdate({
                    sessionId,
                    update: {
                      sessionUpdate: "plan",
                      entries: parsedTodos.success.map((todo) => {
                        const status: PlanEntry["status"] =
                          todo.status === "cancelled" ? "completed" : (todo.status as PlanEntry["status"])
                        return {
                          priority: "medium",
                          status,
                          content: todo.content,
                        }
                      }),
                    },
                  })
                  .catch((err) => {
                    log.error("failed to send session update for todo", { error: err })
                  })
              } else {
                log.error("failed to parse todo output", { error: parsedTodos.failure })
              }
            }

            await this.connection
              .sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: "tool_call_update",
                  toolCallId: part.callID,
                  status: "completed",
                  kind,
                  content,
                  title: part.state.title,
                  rawInput: part.state.input,
                  rawOutput: completedToolRawOutput(part),
                },
              })
              .catch((err) => {
                log.error("failed to send tool completed to ACP", { error: err })
              })
            break
          case "error":
            this.toolStarts.delete(part.callID)
            this.shellSnapshots.delete(part.callID)
            await this.connection
              .sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: "tool_call_update",
                  toolCallId: part.callID,
                  status: "failed",
                  kind: toToolKind(part.tool),
                  title: part.tool,
                  rawInput: part.state.input,
                  content: [
                    {
                      type: "content",
                      content: {
                        type: "text",
                        text: part.state.error,
                      },
                    },
                  ],
                  rawOutput: {
                    error: part.state.error,
                    metadata: part.state.metadata,
                  },
                },
              })
              .catch((err) => {
                log.error("failed to send tool error to ACP", { error: err })
              })
            break
        }
      } else if (part.type === "text") {
        if (part.text) {
          const audience: Role[] | undefined = part.synthetic ? ["assistant"] : part.ignored ? ["user"] : undefined
          await this.connection
            .sessionUpdate({
              sessionId,
              update: {
                sessionUpdate: message.info.role === "user" ? "user_message_chunk" : "agent_message_chunk",
                messageId: message.info.id,
                content: {
                  type: "text",
                  text: part.text,
                  ...(audience && { annotations: { audience } }),
                },
              },
            })
            .catch((err) => {
              log.error("failed to send text to ACP", { error: err })
            })
        }
      } else if (part.type === "file") {
        // Replay file attachments as appropriate ACP content blocks.
        // OpenCode stores files internally as { type: "file", url, filename, mime }.
        // We convert these back to ACP blocks based on the URL scheme and MIME type:
        // - file:// URLs → resource_link
        // - data: URLs with image/* → image block
        // - data: URLs with text/* or application/json → resource with text
        // - data: URLs with other types → resource with blob
        const url = part.url
        const filename = part.filename ?? "file"
        const mime = part.mime || "application/octet-stream"
        const messageChunk = message.info.role === "user" ? "user_message_chunk" : "agent_message_chunk"

        if (url.startsWith("file://")) {
          // Local file reference - send as resource_link
          await this.connection
            .sessionUpdate({
              sessionId,
              update: {
                sessionUpdate: messageChunk,
                messageId: message.info.id,
                content: { type: "resource_link", uri: url, name: filename, mimeType: mime },
              },
            })
            .catch((err) => {
              log.error("failed to send resource_link to ACP", { error: err })
            })
        } else if (url.startsWith("data:")) {
          // Embedded content - parse data URL and send as appropriate block type
          const base64Match = url.match(/^data:([^;]+);base64,(.*)$/)
          const dataMime = base64Match?.[1]
          const base64Data = base64Match?.[2] ?? ""

          const effectiveMime = dataMime || mime

          if (effectiveMime.startsWith("image/")) {
            // Image - send as image block
            await this.connection
              .sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: messageChunk,
                  messageId: message.info.id,
                  content: {
                    type: "image",
                    mimeType: effectiveMime,
                    data: base64Data,
                    uri: pathToFileURL(filename).href,
                  },
                },
              })
              .catch((err) => {
                log.error("failed to send image to ACP", { error: err })
              })
          } else {
            // Non-image: text types get decoded, binary types stay as blob
            const isText = effectiveMime.startsWith("text/") || effectiveMime === "application/json"
            const fileUri = pathToFileURL(filename).href
            const resource = isText
              ? {
                  uri: fileUri,
                  mimeType: effectiveMime,
                  text: Buffer.from(base64Data, "base64").toString("utf-8"),
                }
              : { uri: fileUri, mimeType: effectiveMime, blob: base64Data }

            await this.connection
              .sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: messageChunk,
                  messageId: message.info.id,
                  content: { type: "resource", resource },
                },
              })
              .catch((err) => {
                log.error("failed to send resource to ACP", { error: err })
              })
          }
        }
        // URLs that don't match file:// or data: are skipped (unsupported)
      } else if (part.type === "reasoning") {
        if (part.text) {
          await this.connection
            .sessionUpdate({
              sessionId,
              update: {
                sessionUpdate: "agent_thought_chunk",
                messageId: message.info.id,
                content: {
                  type: "text",
                  text: part.text,
                },
              },
            })
            .catch((err) => {
              log.error("failed to send reasoning to ACP", { error: err })
            })
        }
      }
    }
  }

  private shellOutput(part: ToolPart) {
    if (part.tool !== ShellID.ToolID) return
    if (!("metadata" in part.state) || !part.state.metadata || typeof part.state.metadata !== "object") return
    const output = part.state.metadata["output"]
    if (typeof output !== "string") return
    return output
  }

  private async toolStart(sessionId: string, part: ToolPart) {
    if (this.toolStarts.has(part.callID)) return
    this.toolStarts.add(part.callID)
    await this.connection
      .sessionUpdate({
        sessionId,
        update: {
          sessionUpdate: "tool_call",
          toolCallId: part.callID,
          title: part.tool,
          kind: toToolKind(part.tool),
          status: "pending",
          locations: [],
          rawInput: {},
        },
      })
      .catch((error) => {
        log.error("failed to send tool pending to ACP", { error })
      })
  }

  private async loadAvailableModes(directory: string): Promise<ModeOption[]> {
    const agents = await this.config.sdk.app
      .agents(
        {
          directory,
        },
        { throwOnError: true },
      )
      .then((resp) => resp.data!)

    return agents
      .filter((agent) => agent.mode !== "subagent" && !agent.hidden)
      .map((agent) => ({
        id: agent.name,
        name: agent.name,
        description: agent.description,
      }))
  }

  private async resolveModeState(
    directory: string,
    sessionId: string,
  ): Promise<{ availableModes: ModeOption[]; currentModeId?: string }> {
    const availableModes = await this.loadAvailableModes(directory)
    const storedModeId = this.sessionManager.get(sessionId).modeId
    if (storedModeId && availableModes.some((mode) => mode.id === storedModeId)) {
      return { availableModes, currentModeId: storedModeId }
    }

    const currentModeId = await (async () => {
      if (!availableModes.length) return undefined
      const defaultAgentName = await AppRuntime.runPromise(AgentModule.Service.use((svc) => svc.defaultAgent()))
      const resolvedModeId = availableModes.find((mode) => mode.name === defaultAgentName)?.id ?? availableModes[0].id
      this.sessionManager.setMode(sessionId, resolvedModeId)
      return resolvedModeId
    })()

    return { availableModes, currentModeId }
  }

  private async loadSessionMode(params: LoadSessionRequest) {
    const directory = params.cwd
    const sessionId = params.sessionId
    const model = this.sessionManager.get(sessionId).model ?? (await defaultModel(this.config, directory))

    const providers = await this.sdk.config.providers({ directory }).then((x) => x.data!.providers)
    const entries = sortProvidersByName(providers)
    const availableVariants = modelVariantsFromProviders(entries, model)
    const currentVariant = this.sessionManager.getVariant(sessionId)
    if (currentVariant && !availableVariants.includes(currentVariant)) {
      this.sessionManager.setVariant(sessionId, undefined)
    }
    const availableModels = buildAvailableModels(entries)
    const modeState = await this.resolveModeState(directory, sessionId)
    const currentModeId = modeState.currentModeId
    const modes = currentModeId
      ? {
          availableModes: modeState.availableModes,
          currentModeId,
        }
      : undefined

    const commands = await this.config.sdk.command
      .list(
        {
          directory,
        },
        { throwOnError: true },
      )
      .then((resp) => resp.data!)

    const availableCommands = commands.map((command) => ({
      name: command.name,
      description: command.description ?? "",
    }))
    const names = new Set(availableCommands.map((c) => c.name))
    if (!names.has("compact"))
      availableCommands.push({
        name: "compact",
        description: "compact the session",
      })

    const mcpServers: Record<string, ConfigMCP.Info> = {}
    for (const server of params.mcpServers) {
      if ("type" in server) {
        mcpServers[server.name] = {
          url: server.url,
          headers: server.headers.reduce<Record<string, string>>((acc, { name, value }) => {
            acc[name] = value
            return acc
          }, {}),
          type: "remote",
        }
      } else {
        mcpServers[server.name] = {
          type: "local",
          command: [server.command, ...server.args],
          environment: server.env.reduce<Record<string, string>>((acc, { name, value }) => {
            acc[name] = value
            return acc
          }, {}),
        }
      }
    }

    await Promise.all(
      Object.entries(mcpServers).map(async ([key, mcp]) => {
        await this.sdk.mcp
          .add(
            {
              directory,
              name: key,
              config: mcp,
            },
            { throwOnError: true },
          )
          .catch((error) => {
            log.error("failed to add mcp server", { name: key, error })
          })
      }),
    )

    setTimeout(() => {
      void this.connection.sessionUpdate({
        sessionId,
        update: {
          sessionUpdate: "available_commands_update",
          availableCommands,
        },
      })
    }, 0)

    return {
      sessionId,
      models: {
        currentModelId: formatModelIdWithVariant(model, currentVariant, availableVariants, false),
        availableModels,
      },
      modes,
      configOptions: buildConfigOptions({
        currentModelId: formatModelIdWithVariant(model, currentVariant, availableVariants, false),
        availableModels,
        currentVariant,
        availableVariants,
        modes,
      }),
      _meta: buildVariantMeta({
        model,
        variant: this.sessionManager.getVariant(sessionId),
        availableVariants,
      }),
    }
  }

  async unstable_setSessionModel(params: SetSessionModelRequest) {
    const session = this.sessionManager.get(params.sessionId)
    const providers = await this.sdk.config
      .providers({ directory: session.cwd }, { throwOnError: true })
      .then((x) => x.data!.providers)

    const selection = parseModelSelection(params.modelId, providers)
    this.sessionManager.setModel(session.id, selection.model)
    this.sessionManager.setVariant(session.id, selection.variant)

    const entries = sortProvidersByName(providers)
    const availableVariants = modelVariantsFromProviders(entries, selection.model)
    const modeState = await this.resolveModeState(session.cwd, session.id)
    const modes = modeState.currentModeId
      ? { availableModes: modeState.availableModes, currentModeId: modeState.currentModeId }
      : undefined

    await this.connection.sessionUpdate({
      sessionId: session.id,
      update: {
        sessionUpdate: "config_option_update",
        configOptions: buildConfigOptions({
          currentModelId: formatModelIdWithVariant(selection.model, selection.variant, availableVariants, false),
          availableModels: buildAvailableModels(entries),
          currentVariant: selection.variant,
          availableVariants,
          modes,
        }),
      },
    })

    return {
      _meta: buildVariantMeta({
        model: selection.model,
        variant: selection.variant,
        availableVariants,
      }),
    }
  }

  async setSessionMode(params: SetSessionModeRequest): Promise<SetSessionModeResponse | void> {
    const session = this.sessionManager.get(params.sessionId)
    const availableModes = await this.loadAvailableModes(session.cwd)
    if (!availableModes.some((mode) => mode.id === params.modeId)) {
      throw new Error(`Agent not found: ${params.modeId}`)
    }
    this.sessionManager.setMode(params.sessionId, params.modeId)
  }

  async setSessionConfigOption(params: SetSessionConfigOptionRequest): Promise<SetSessionConfigOptionResponse> {
    const session = this.sessionManager.get(params.sessionId)
    const providers = await this.sdk.config
      .providers({ directory: session.cwd }, { throwOnError: true })
      .then((x) => x.data!.providers)
    const entries = sortProvidersByName(providers)

    if (params.configId === "model") {
      if (typeof params.value !== "string") throw RequestError.invalidParams("model value must be a string")
      const selection = parseModelSelection(params.value, providers)
      this.sessionManager.setModel(session.id, selection.model)
      this.sessionManager.setVariant(session.id, selection.variant)
    } else if (params.configId === "effort") {
      if (typeof params.value !== "string") throw RequestError.invalidParams("effort value must be a string")
      const current = session.model ?? (await defaultModel(this.config, session.cwd))
      const availableVariants = modelVariantsFromProviders(entries, current)
      if (!availableVariants.includes(params.value)) {
        throw RequestError.invalidParams(JSON.stringify({ error: `Effort not found: ${params.value}` }))
      }
      this.sessionManager.setVariant(session.id, params.value)
    } else if (params.configId === "mode") {
      if (typeof params.value !== "string") throw RequestError.invalidParams("mode value must be a string")
      const availableModes = await this.loadAvailableModes(session.cwd)
      if (!availableModes.some((mode) => mode.id === params.value)) {
        throw RequestError.invalidParams(JSON.stringify({ error: `Mode not found: ${params.value}` }))
      }
      this.sessionManager.setMode(session.id, params.value)
    } else {
      throw RequestError.invalidParams(JSON.stringify({ error: `Unknown config option: ${params.configId}` }))
    }

    const updatedSession = this.sessionManager.get(session.id)
    const model = updatedSession.model ?? (await defaultModel(this.config, session.cwd))
    const availableVariants = modelVariantsFromProviders(entries, model)
    const currentModelId = formatModelIdWithVariant(model, updatedSession.variant, availableVariants, false)
    const availableModels = buildAvailableModels(entries)
    const modeState = await this.resolveModeState(session.cwd, session.id)
    const modes = modeState.currentModeId
      ? { availableModes: modeState.availableModes, currentModeId: modeState.currentModeId }
      : undefined

    return {
      configOptions: buildConfigOptions({
        currentModelId,
        availableModels,
        currentVariant: updatedSession.variant,
        availableVariants,
        modes,
      }),
    }
  }

  async prompt(params: PromptRequest) {
    const sessionID = params.sessionId
    const session = this.sessionManager.get(sessionID)
    const directory = session.cwd

    const current = session.model
    const model = current ?? (await defaultModel(this.config, directory))
    if (!current) {
      this.sessionManager.setModel(session.id, model)
    }
    const agent = session.modeId ?? (await AppRuntime.runPromise(AgentModule.Service.use((svc) => svc.defaultAgent())))

    const parts: Array<
      | { type: "text"; text: string; synthetic?: boolean; ignored?: boolean }
      | { type: "file"; url: string; filename: string; mime: string }
    > = []
    for (const part of params.prompt) {
      switch (part.type) {
        case "text":
          const audience = part.annotations?.audience
          const forAssistant = audience?.length === 1 && audience[0] === "assistant"
          const forUser = audience?.length === 1 && audience[0] === "user"
          parts.push({
            type: "text" as const,
            text: part.text,
            ...(forAssistant && { synthetic: true }),
            ...(forUser && { ignored: true }),
          })
          break
        case "image": {
          const parsed = parseUri(part.uri ?? "")
          const filename = parsed.type === "file" ? parsed.filename : "image"
          if (part.data) {
            parts.push({
              type: "file",
              url: `data:${part.mimeType};base64,${part.data}`,
              filename,
              mime: part.mimeType,
            })
          } else if (part.uri && part.uri.startsWith("http:")) {
            parts.push({
              type: "file",
              url: part.uri,
              filename,
              mime: part.mimeType,
            })
          }
          break
        }

        case "resource_link":
          const parsed = parseUri(part.uri)
          // Use the name from resource_link if available
          if (part.name && parsed.type === "file") {
            parsed.filename = part.name
          }
          parts.push(parsed)

          break

        case "resource": {
          const resource = part.resource
          if ("text" in resource && resource.text) {
            parts.push({
              type: "text",
              text: resource.text,
            })
          } else if ("blob" in resource && resource.blob && resource.mimeType) {
            // Binary resource (PDFs, etc.): store as file part with data URL
            const parsed = parseUri(resource.uri ?? "")
            const filename = parsed.type === "file" ? parsed.filename : "file"
            parts.push({
              type: "file",
              url: `data:${resource.mimeType};base64,${resource.blob}`,
              filename,
              mime: resource.mimeType,
            })
          }
          break
        }

        default:
          break
      }
    }

    log.info("parts", { parts })

    const cmd = (() => {
      const text = parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
        .trim()

      if (!text.startsWith("/")) return

      const [name, ...rest] = text.slice(1).split(/\s+/)
      return { name, args: rest.join(" ").trim() }
    })()

    const buildUsage = (msg: AssistantMessage): Usage => ({
      totalTokens:
        msg.tokens.input +
        msg.tokens.output +
        msg.tokens.reasoning +
        (msg.tokens.cache?.read ?? 0) +
        (msg.tokens.cache?.write ?? 0),
      inputTokens: msg.tokens.input,
      outputTokens: msg.tokens.output,
      thoughtTokens: msg.tokens.reasoning || undefined,
      cachedReadTokens: msg.tokens.cache?.read || undefined,
      cachedWriteTokens: msg.tokens.cache?.write || undefined,
    })

    if (!cmd) {
      const response = await this.sdk.session.prompt({
        sessionID,
        model: {
          providerID: model.providerID,
          modelID: model.modelID,
        },
        variant: this.sessionManager.getVariant(sessionID),
        parts,
        agent,
        directory,
      })
      const msg = response.data?.info

      await sendUsageUpdate(this.connection, this.sdk, sessionID, directory)

      return {
        stopReason: "end_turn" as const,
        usage: msg ? buildUsage(msg) : undefined,
        _meta: {},
      }
    }

    const command = await this.config.sdk.command
      .list({ directory }, { throwOnError: true })
      .then((x) => x.data!.find((c) => c.name === cmd.name))
    if (command) {
      const response = await this.sdk.session.command({
        sessionID,
        command: command.name,
        arguments: cmd.args,
        model: model.providerID + "/" + model.modelID,
        agent,
        directory,
      })
      const msg = response.data?.info

      await sendUsageUpdate(this.connection, this.sdk, sessionID, directory)

      return {
        stopReason: "end_turn" as const,
        usage: msg ? buildUsage(msg) : undefined,
        _meta: {},
      }
    }

    switch (cmd.name) {
      case "compact":
        await this.config.sdk.session.summarize(
          {
            sessionID,
            directory,
            providerID: model.providerID,
            modelID: model.modelID,
          },
          { throwOnError: true },
        )
        break
    }

    await sendUsageUpdate(this.connection, this.sdk, sessionID, directory)

    return {
      stopReason: "end_turn" as const,
      _meta: {},
    }
  }

  async cancel(params: CancelNotification) {
    const session = this.sessionManager.get(params.sessionId)
    await this.config.sdk.session.abort(
      {
        sessionID: params.sessionId,
        directory: session.cwd,
      },
      { throwOnError: true },
    )
  }

  private async loadSessionMessages(directory: string, sessionId: string, limit?: number) {
    return this.sdk.session
      .messages(
        {
          sessionID: sessionId,
          directory,
          limit,
        },
        { throwOnError: true },
      )
      .then((x) => x.data)
      .catch((error) => {
        log.error("unexpected error when fetching message", { error })
        return undefined
      })
  }

  private restoreSessionStateFromMessages(sessionId: string, messages: SessionMessageResponse[] | undefined) {
    const lastUser = messages?.findLast((message) => message.info.role === "user")?.info
    if (lastUser?.role !== "user") return

    this.sessionManager.setModel(sessionId, {
      providerID: ProviderID.make(lastUser.model.providerID),
      modelID: ModelID.make(lastUser.model.modelID),
    })
    this.sessionManager.setVariant(sessionId, lastUser.model.variant)
    if (lastUser.agent) {
      this.sessionManager.setMode(sessionId, lastUser.agent)
    }
  }
}

function toToolKind(toolName: string): ToolKind {
  const tool = toolName.toLocaleLowerCase()

  switch (tool) {
    case ShellID.ToolID:
      return "execute"

    case "webfetch":
      return "fetch"

    case "edit":
    case "patch":
    case "write":
      return "edit"

    case "grep":
    case "glob":
    case "repo_clone":
    case "repo_overview":
    case "context7_resolve_library_id":
    case "context7_get_library_docs":
      return "search"

    case "read":
      return "read"

    default:
      return "other"
  }
}

function toLocations(toolName: string, input: Record<string, any>): { path: string }[] {
  const tool = toolName.toLocaleLowerCase()

  switch (tool) {
    case "read":
    case "edit":
    case "write":
      return input["filePath"] ? [{ path: input["filePath"] }] : []
    case "glob":
    case "grep":
      return input["path"] ? [{ path: input["path"] }] : []
    case "repo_clone":
      return input["path"] ? [{ path: input["path"] }] : []
    case "repo_overview":
      return input["path"] ? [{ path: input["path"] }] : []
    case ShellID.ToolID:
      return []
    default:
      return []
  }
}

function completedToolContent(part: ToolPart, kind: ToolKind): ToolCallContent[] {
  if (part.state.status !== "completed") return []

  const content: ToolCallContent[] = [
    {
      type: "content",
      content: {
        type: "text",
        text: part.state.output,
      },
    },
  ]

  if (kind === "edit") {
    const input = part.state.input
    const filePath = typeof input["filePath"] === "string" ? input["filePath"] : ""
    const oldText = typeof input["oldString"] === "string" ? input["oldString"] : ""
    const newText =
      typeof input["newString"] === "string"
        ? input["newString"]
        : typeof input["content"] === "string"
          ? input["content"]
          : ""
    content.push({
      type: "diff",
      path: filePath,
      oldText,
      newText,
    })
  }

  content.push(...imageContents(part.state.attachments ?? []))
  return content
}

function completedToolRawOutput(part: ToolPart) {
  if (part.state.status !== "completed") return {}
  return {
    output: part.state.output,
    metadata: part.state.metadata,
    ...(part.state.attachments?.length ? { attachments: part.state.attachments } : {}),
  }
}

function imageContents(attachments: Array<{ mime: string; url: string }>): ToolCallContent[] {
  return attachments.flatMap((attachment): ToolCallContent[] => {
    const match = attachment.url.match(/^data:([^;,]+)(?:;[^,]*)*;base64,(.*)$/)
    const mime = match?.[1] ?? attachment.mime
    if (!mime.startsWith("image/")) return []
    const data = match?.[2]
    if (data === undefined) return []
    return [
      {
        type: "content" as const,
        content: {
          type: "image" as const,
          mimeType: mime,
          data,
        },
      },
    ]
  })
}

async function defaultModel(config: ACPConfig, cwd?: string): Promise<{ providerID: ProviderID; modelID: ModelID }> {
  const sdk = config.sdk
  const configured = config.defaultModel
  if (configured) return configured

  const directory = cwd ?? process.cwd()

  const specified = await sdk.config
    .get({ directory }, { throwOnError: true })
    .then((resp) => {
      const cfg = resp.data
      if (!cfg || !cfg.model) return undefined
      return Provider.parseModel(cfg.model)
    })
    .catch((error) => {
      log.error("failed to load user config for default model", { error })
      return undefined
    })

  const providers = await sdk.config
    .providers({ directory }, { throwOnError: true })
    .then((x) => x.data?.providers ?? [])
    .catch((error) => {
      log.error("failed to list providers for default model", { error })
      return []
    })

  if (specified && providers.length) {
    const provider = providers.find((p) => p.id === specified.providerID)
    if (provider && provider.models[specified.modelID]) return specified
  }

  if (specified && !providers.length) return specified

  const lastUsed = await lastUsedModel(sdk, directory, providers)
  if (lastUsed) return lastUsed

  const opencodeProvider = providers.find((p) => p.id === "opencode")
  if (opencodeProvider) {
    const [best] = Provider.sort(Object.values(opencodeProvider.models))
    if (best) {
      return {
        providerID: ProviderID.make(best.providerID),
        modelID: ModelID.make(best.id),
      }
    }
  }

  const models = providers.flatMap((p) => Object.values(p.models))
  const [best] = Provider.sort(models)
  if (best) {
    return {
      providerID: ProviderID.make(best.providerID),
      modelID: ModelID.make(best.id),
    }
  }

  if (specified) return specified
  throw new Error("No models available")
}

async function lastUsedModel(
  sdk: OpencodeClient,
  directory: string,
  providers: Array<{ id: string; models: Record<string, unknown> }>,
): Promise<{ providerID: ProviderID; modelID: ModelID } | undefined> {
  const session = await sdk.session
    .list({ directory, roots: true, limit: 1 }, { throwOnError: true })
    .then((x) => x.data?.[0])
    .catch((error) => {
      log.error("failed to list sessions for default model", { error })
      return undefined
    })
  if (!session) return

  const lastUser = await sdk.session
    .messages({ sessionID: session.id, directory, limit: 20 }, { throwOnError: true })
    .then((x) => x.data?.findLast((message) => message.info.role === "user")?.info)
    .catch((error) => {
      log.error("failed to load session messages for default model", { error, sessionID: session.id })
      return undefined
    })
  if (lastUser?.role !== "user") return

  const provider = providers.find((entry) => entry.id === lastUser.model.providerID)
  if (!provider?.models[lastUser.model.modelID]) return
  return {
    providerID: ProviderID.make(lastUser.model.providerID),
    modelID: ModelID.make(lastUser.model.modelID),
  }
}

function parseUri(
  uri: string,
): { type: "file"; url: string; filename: string; mime: string } | { type: "text"; text: string } {
  try {
    if (uri.startsWith("file://")) {
      const path = uri.slice(7)
      const name = path.split("/").pop() || path
      return {
        type: "file",
        url: uri,
        filename: name,
        mime: "text/plain",
      }
    }
    if (uri.startsWith("zed://")) {
      const url = new URL(uri)
      const path = url.searchParams.get("path")
      if (path) {
        const name = path.split("/").pop() || path
        return {
          type: "file",
          url: pathToFileURL(path).href,
          filename: name,
          mime: "text/plain",
        }
      }
    }
    return {
      type: "text",
      text: uri,
    }
  } catch {
    return {
      type: "text",
      text: uri,
    }
  }
}

function getNewContent(fileOriginal: string, unifiedDiff: string): string | undefined {
  const result = applyPatch(fileOriginal, unifiedDiff)
  if (result === false) {
    log.error("Failed to apply unified diff (context mismatch)")
    return undefined
  }
  return result
}

function sortProvidersByName<T extends { name: string }>(providers: T[]): T[] {
  return [...providers].sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1
    return 0
  })
}

function modelVariantsFromProviders(
  providers: Array<{ id: string; models: Record<string, { variants?: Record<string, any> }> }>,
  model: { providerID: ProviderID; modelID: ModelID },
): string[] {
  const provider = providers.find((entry) => entry.id === model.providerID)
  if (!provider) return []
  const modelInfo = provider.models[model.modelID]
  if (!modelInfo?.variants) return []
  return Object.keys(modelInfo.variants)
}

function buildAvailableModels(
  providers: Array<{ id: string; name: string; models: Record<string, any> }>,
  options: { includeVariants?: boolean } = {},
): ModelOption[] {
  const includeVariants = options.includeVariants ?? false
  return providers.flatMap((provider) => {
    const unsorted: Array<{ id: string; name: string; variants?: Record<string, any> }> = Object.values(provider.models)
    const models = Provider.sort(unsorted)
    return models.flatMap((model) => {
      const base: ModelOption = {
        modelId: `${provider.id}/${model.id}`,
        name: `${provider.name}/${model.name}`,
      }
      if (!includeVariants || !model.variants) return [base]
      const variants = Object.keys(model.variants).filter((variant) => variant !== DEFAULT_VARIANT_VALUE)
      const variantOptions = variants.map((variant) => ({
        modelId: `${provider.id}/${model.id}/${variant}`,
        name: `${provider.name}/${model.name} (${variant})`,
      }))
      return [base, ...variantOptions]
    })
  })
}

function formatModelIdWithVariant(
  model: { providerID: ProviderID; modelID: ModelID },
  variant: string | undefined,
  availableVariants: string[],
  includeVariant: boolean,
) {
  const base = `${model.providerID}/${model.modelID}`
  if (!includeVariant || availableVariants.length === 0) return base
  const selectedVariant =
    variant && availableVariants.includes(variant)
      ? variant
      : availableVariants.includes(DEFAULT_VARIANT_VALUE)
        ? DEFAULT_VARIANT_VALUE
        : availableVariants[0]
  return `${base}/${selectedVariant}`
}

function buildVariantMeta(input: {
  model: { providerID: ProviderID; modelID: ModelID }
  variant?: string
  availableVariants: string[]
}) {
  return {
    opencode: {
      modelId: `${input.model.providerID}/${input.model.modelID}`,
      variant: input.variant ?? null,
      availableVariants: input.availableVariants,
    },
  }
}

function parseModelSelection(
  modelId: string,
  providers: Array<{ id: string; models: Record<string, { variants?: Record<string, any> }> }>,
): { model: { providerID: ProviderID; modelID: ModelID }; variant?: string } {
  const parsed = Provider.parseModel(modelId)
  const provider = providers.find((p) => p.id === parsed.providerID)
  if (!provider) {
    return { model: parsed, variant: undefined }
  }

  // Check if modelID exists directly
  if (provider.models[parsed.modelID]) {
    return { model: parsed, variant: undefined }
  }

  // Try to extract variant from end of modelID (e.g., "claude-sonnet-4/high" -> model: "claude-sonnet-4", variant: "high")
  const segments = parsed.modelID.split("/")
  if (segments.length > 1) {
    const candidateVariant = segments[segments.length - 1]
    const baseModelId = segments.slice(0, -1).join("/")
    const baseModelInfo = provider.models[baseModelId]
    if (baseModelInfo?.variants && candidateVariant in baseModelInfo.variants) {
      return {
        model: { providerID: parsed.providerID, modelID: ModelID.make(baseModelId) },
        variant: candidateVariant,
      }
    }
  }

  return { model: parsed, variant: undefined }
}

function buildConfigOptions(input: {
  currentModelId: string
  availableModels: ModelOption[]
  currentVariant?: string
  availableVariants?: string[]
  modes?: { availableModes: ModeOption[]; currentModeId: string } | undefined
}): SessionConfigOption[] {
  const options: SessionConfigOption[] = [
    {
      id: "model",
      name: "Model",
      category: "model",
      type: "select",
      currentValue: input.currentModelId,
      options: input.availableModels.map((m) => ({ value: m.modelId, name: m.name })),
    },
  ]
  if (input.availableVariants?.length) {
    options.push({
      id: "effort",
      name: "Effort",
      description: "Available effort levels for this model",
      category: "thought_level",
      type: "select",
      currentValue:
        input.currentVariant && input.availableVariants.includes(input.currentVariant)
          ? input.currentVariant
          : input.availableVariants.includes(DEFAULT_VARIANT_VALUE)
            ? DEFAULT_VARIANT_VALUE
            : input.availableVariants[0],
      options: input.availableVariants.map((variant) => ({ value: variant, name: formatVariantName(variant) })),
    })
  }
  if (input.modes) {
    options.push({
      id: "mode",
      name: "Session Mode",
      category: "mode",
      type: "select",
      currentValue: input.modes.currentModeId,
      options: input.modes.availableModes.map((m) => ({
        value: m.id,
        name: m.name,
        ...(m.description ? { description: m.description } : {}),
      })),
    })
  }
  return options
}

function formatVariantName(variant: string) {
  return variant
    .split(/[_-]/)
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ")
}

export * as ACP from "./agent"
````

## File: packages/opencode/src/acp/README.md
````markdown
# ACP (Agent Client Protocol) Implementation

This directory contains a clean, protocol-compliant implementation of the [Agent Client Protocol](https://agentclientprotocol.com/) for opencode.

## Architecture

The implementation follows a clean separation of concerns:

### Core Components

- **`agent.ts`** - Implements the `Agent` interface from `@agentclientprotocol/sdk`
  - Handles initialization and capability negotiation
  - Manages session lifecycle (`session/new`, `session/load`)
  - Processes prompts and returns responses
  - Properly implements ACP protocol v1

- **`client.ts`** - Implements the `Client` interface for client-side capabilities
  - File operations (`readTextFile`, `writeTextFile`)
  - Permission requests (auto-approves for now)
  - Terminal support (stub implementation)

- **`session.ts`** - Session state management
  - Creates and tracks ACP sessions
  - Maps ACP sessions to internal opencode sessions
  - Maintains working directory context
  - Handles MCP server configurations

- **`server.ts`** - ACP server startup and lifecycle
  - Sets up JSON-RPC over stdio using the official library
  - Manages graceful shutdown on SIGTERM/SIGINT
  - Provides Instance context for the agent

- **`types.ts`** - Type definitions for internal use

## Usage

### Command Line

```bash
# Start the ACP server in the current directory
opencode acp

# Start in a specific directory
opencode acp --cwd /path/to/project
```

### Question Tool Opt-In

ACP excludes `QuestionTool` by default.

```bash
OPENCODE_ENABLE_QUESTION_TOOL=1 opencode acp
```

Enable this only for ACP clients that support interactive question prompts.

### Programmatic

```typescript
import { ACPServer } from "./acp/server"

await ACPServer.start()
```

### Integration with Zed

Add to your Zed configuration (`~/.config/zed/settings.json`):

```json
{
  "agent_servers": {
    "OpenCode": {
      "command": "opencode",
      "args": ["acp"]
    }
  }
}
```

## Protocol Compliance

This implementation follows the ACP specification v1:

✅ **Initialization**

- Proper `initialize` request/response with protocol version negotiation
- Capability advertisement (`agentCapabilities`)
- Authentication support (stub)

✅ **Session Management**

- `session/new` - Create new conversation sessions
- `session/load` - Resume existing sessions (basic support)
- Working directory context (`cwd`)
- MCP server configuration support

✅ **Prompting**

- `session/prompt` - Process user messages
- Content block handling (text, resources)
- Response with stop reasons

✅ **Client Capabilities**

- File read/write operations
- Permission requests
- Terminal support (stub for future)

## Current Limitations

### Not Yet Implemented

1. **Streaming Responses** - Currently returns complete responses instead of streaming via `session/update` notifications
2. **Tool Call Reporting** - Doesn't report tool execution progress
3. **Session Modes** - No mode switching support yet
4. **Authentication** - No actual auth implementation
5. **Terminal Support** - Placeholder only
6. **Session Persistence** - `session/load` doesn't restore actual conversation history

### Future Enhancements

- **Real-time Streaming**: Implement `session/update` notifications for progressive responses
- **Tool Call Visibility**: Report tool executions as they happen
- **Session Persistence**: Save and restore full conversation history
- **Mode Support**: Implement different operational modes (ask, code, etc.)
- **Enhanced Permissions**: More sophisticated permission handling
- **Terminal Integration**: Full terminal support via opencode's bash tool

## Testing

```bash
# Run ACP tests
bun test test/acp.test.ts

# Test manually with stdio
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1}}' | opencode acp
```

## Design Decisions

### Why the Official Library?

We use `@agentclientprotocol/sdk` instead of implementing JSON-RPC ourselves because:

- Ensures protocol compliance
- Handles edge cases and future protocol versions
- Reduces maintenance burden
- Works with other ACP clients automatically

### Clean Architecture

Each component has a single responsibility:

- **Agent** = Protocol interface
- **Client** = Client-side operations
- **Session** = State management
- **Server** = Lifecycle and I/O

This makes the codebase maintainable and testable.

### Mapping to OpenCode

ACP sessions map cleanly to opencode's internal session model:

- ACP `session/new` → creates internal Session
- ACP `session/prompt` → uses SessionPrompt.prompt()
- Working directory context preserved per-session
- Tool execution uses existing ToolRegistry

## References

- [ACP Specification](https://agentclientprotocol.com/)
- [TypeScript Library](https://github.com/agentclientprotocol/typescript-sdk)
- [Protocol Examples](https://github.com/agentclientprotocol/typescript-sdk/tree/main/src/examples)
````

## File: packages/opencode/src/acp/session.ts
````typescript
import { RequestError, type McpServer } from "@agentclientprotocol/sdk"
import type { ACPSessionState } from "./types"
import * as Log from "@opencode-ai/core/util/log"
import type { OpencodeClient } from "@opencode-ai/sdk/v2"

const log = Log.create({ service: "acp-session-manager" })

export class ACPSessionManager {
  private sessions = new Map<string, ACPSessionState>()
  private sdk: OpencodeClient

  constructor(sdk: OpencodeClient) {
    this.sdk = sdk
  }

  tryGet(sessionId: string): ACPSessionState | undefined {
    return this.sessions.get(sessionId)
  }

  async create(cwd: string, mcpServers: McpServer[], model?: ACPSessionState["model"]): Promise<ACPSessionState> {
    const session = await this.sdk.session
      .create(
        {
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

  async load(
    sessionId: string,
    cwd: string,
    mcpServers: McpServer[],
    model?: ACPSessionState["model"],
  ): Promise<ACPSessionState> {
    const session = await this.sdk.session
      .get(
        {
          sessionID: sessionId,
          directory: cwd,
        },
        { throwOnError: true },
      )
      .then((x) => x.data!)

    const resolvedModel = model

    const state: ACPSessionState = {
      id: sessionId,
      cwd,
      mcpServers,
      createdAt: new Date(session.time.created),
      model: resolvedModel,
    }
    log.info("loading_session", { state })

    this.sessions.set(sessionId, state)
    return state
  }

  get(sessionId: string): ACPSessionState {
    const session = this.sessions.get(sessionId)
    if (!session) {
      log.error("session not found", { sessionId })
      throw RequestError.invalidParams(JSON.stringify({ error: `Session not found: ${sessionId}` }))
    }
    return session
  }

  getModel(sessionId: string) {
    const session = this.get(sessionId)
    return session.model
  }

  setModel(sessionId: string, model: ACPSessionState["model"]) {
    const session = this.get(sessionId)
    session.model = model
    this.sessions.set(sessionId, session)
    return session
  }

  getVariant(sessionId: string) {
    const session = this.get(sessionId)
    return session.variant
  }

  setVariant(sessionId: string, variant?: string) {
    const session = this.get(sessionId)
    session.variant = variant
    this.sessions.set(sessionId, session)
    return session
  }

  setMode(sessionId: string, modeId: string) {
    const session = this.get(sessionId)
    session.modeId = modeId
    this.sessions.set(sessionId, session)
    return session
  }

  remove(sessionId: string): ACPSessionState | undefined {
    const session = this.sessions.get(sessionId)
    this.sessions.delete(sessionId)
    return session
  }
}
````

## File: packages/opencode/src/acp/types.ts
````typescript
import type { McpServer } from "@agentclientprotocol/sdk"
import type { OpencodeClient } from "@opencode-ai/sdk/v2"
import type { ProviderID, ModelID } from "../provider/schema"

export interface ACPSessionState {
  id: string
  cwd: string
  mcpServers: McpServer[]
  createdAt: Date
  model?: {
    providerID: ProviderID
    modelID: ModelID
  }
  variant?: string
  modeId?: string
}

export interface ACPConfig {
  sdk: OpencodeClient
  defaultModel?: {
    providerID: ProviderID
    modelID: ModelID
  }
}
````

## File: packages/plugin/src/example-workspace.ts
````typescript
import type { Plugin } from "@opencode-ai/plugin"
import { mkdir, rm } from "node:fs/promises"

export const FolderWorkspacePlugin: Plugin = async ({ experimental_workspace }) => {
  experimental_workspace.register("folder", {
    name: "Folder",
    description: "Create a blank folder",
    configure(config) {
      const rand = "" + Math.random()

      return {
        ...config,
        directory: `/tmp/folder/folder-${rand}`,
      }
    },
    async create(config) {
      if (!config.directory) return
      await mkdir(config.directory, { recursive: true })
    },
    async remove(config) {
      await rm(config.directory!, { recursive: true, force: true })
    },
    target(config) {
      return {
        type: "local",
        directory: config.directory!,
      }
    },
  })

  return {}
}

export default FolderWorkspacePlugin
````

## File: packages/plugin/src/example.ts
````typescript
import { Plugin } from "./index.js"
import { tool } from "./tool.js"

export const ExamplePlugin: Plugin = async (_ctx) => {
  return {
    tool: {
      mytool: tool({
        description: "This is a custom tool",
        args: {
          foo: tool.schema.string().describe("foo"),
        },
        async execute(args) {
          return `Hello ${args.foo}!`
        },
      }),
    },
  }
}
````

## File: packages/plugin/src/index.ts
````typescript
import type {
  Event,
  createOpencodeClient,
  Project,
  Model,
  Provider,
  Permission,
  UserMessage,
  Message,
  Part,
  Auth,
  Config as SDKConfig,
} from "@opencode-ai/sdk"
import type { Provider as ProviderV2, Model as ModelV2 } from "@opencode-ai/sdk/v2"

import type { BunShell } from "./shell.js"
import { type ToolDefinition } from "./tool.js"

export * from "./tool.js"

export type ProviderContext = {
  source: "env" | "config" | "custom" | "api"
  info: Provider
  options: Record<string, any>
}

export type WorkspaceInfo = {
  id: string
  type: string
  name: string
  branch: string | null
  directory: string | null
  extra: unknown | null
  projectID: string
}

export type WorkspaceTarget =
  | {
      type: "local"
      directory: string
    }
  | {
      type: "remote"
      url: string | URL
      headers?: HeadersInit
    }

export type WorkspaceAdapter = {
  name: string
  description: string
  configure(config: WorkspaceInfo): WorkspaceInfo | Promise<WorkspaceInfo>
  create(config: WorkspaceInfo, env: Record<string, string | undefined>, from?: WorkspaceInfo): Promise<void>
  remove(config: WorkspaceInfo): Promise<void>
  target(config: WorkspaceInfo): WorkspaceTarget | Promise<WorkspaceTarget>
}

export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  experimental_workspace: {
    register(type: string, adapter: WorkspaceAdapter): void
  }
  serverUrl: URL
  $: BunShell
}

export type PluginOptions = Record<string, unknown>

export type Config = Omit<SDKConfig, "plugin"> & {
  plugin?: Array<string | [string, PluginOptions]>
}

export type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>

export type PluginModule = {
  id?: string
  server: Plugin
  tui?: never
}

type Rule = {
  key: string
  op: "eq" | "neq"
  value: string
}

export type AuthHook = {
  provider: string
  loader?: (auth: () => Promise<Auth>, provider: Provider) => Promise<Record<string, any>>
  methods: (
    | {
        type: "oauth"
        label: string
        prompts?: Array<
          | {
              type: "text"
              key: string
              message: string
              placeholder?: string
              validate?: (value: string) => string | undefined
              /** @deprecated Use `when` instead */
              condition?: (inputs: Record<string, string>) => boolean
              when?: Rule
            }
          | {
              type: "select"
              key: string
              message: string
              options: Array<{
                label: string
                value: string
                hint?: string
              }>
              /** @deprecated Use `when` instead */
              condition?: (inputs: Record<string, string>) => boolean
              when?: Rule
            }
        >
        authorize(inputs?: Record<string, string>): Promise<AuthOAuthResult>
      }
    | {
        type: "api"
        label: string
        prompts?: Array<
          | {
              type: "text"
              key: string
              message: string
              placeholder?: string
              validate?: (value: string) => string | undefined
              /** @deprecated Use `when` instead */
              condition?: (inputs: Record<string, string>) => boolean
              when?: Rule
            }
          | {
              type: "select"
              key: string
              message: string
              options: Array<{
                label: string
                value: string
                hint?: string
              }>
              /** @deprecated Use `when` instead */
              condition?: (inputs: Record<string, string>) => boolean
              when?: Rule
            }
        >
        authorize?(inputs?: Record<string, string>): Promise<
          | {
              type: "success"
              key: string
              provider?: string
            }
          | {
              type: "failed"
            }
        >
      }
  )[]
}

export type AuthOAuthResult = { url: string; instructions: string } & (
  | {
      method: "auto"
      callback(): Promise<
        | ({
            type: "success"
            provider?: string
          } & (
            | {
                refresh: string
                access: string
                expires: number
                accountId?: string
                enterpriseUrl?: string
              }
            | { key: string }
          ))
        | {
            type: "failed"
          }
      >
    }
  | {
      method: "code"
      callback(code: string): Promise<
        | ({
            type: "success"
            provider?: string
          } & (
            | {
                refresh: string
                access: string
                expires: number
                accountId?: string
                enterpriseUrl?: string
              }
            | { key: string }
          ))
        | {
            type: "failed"
          }
      >
    }
)

export type ProviderHookContext = {
  auth?: Auth
}

export type ProviderHook = {
  id: string
  models?: (provider: ProviderV2, ctx: ProviderHookContext) => Promise<Record<string, ModelV2>>
}

/** @deprecated Use AuthOAuthResult instead. */
export type AuthOuathResult = AuthOAuthResult

export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: {
    [key: string]: ToolDefinition
  }
  auth?: AuthHook
  provider?: ProviderHook
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
    output: {
      temperature: number
      topP: number
      topK: number
      maxOutputTokens: number | undefined
      options: Record<string, any>
    },
  ) => Promise<void>
  "chat.headers"?: (
    input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
    output: { headers: Record<string, string> },
  ) => Promise<void>
  "permission.ask"?: (input: Permission, output: { status: "ask" | "ask" | "allow" }) => Promise<void>
  "command.execute.before"?: (
    input: { command: string; sessionID: string; arguments: string },
    output: { parts: Part[] },
  ) => Promise<void>
  "tool.execute.before"?: (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: any },
  ) => Promise<void>
  "shell.env"?: (
    input: { cwd: string; sessionID?: string; callID?: string },
    output: { env: Record<string, string> },
  ) => Promise<void>
  "tool.execute.after"?: (
    input: { tool: string; sessionID: string; callID: string; args: any },
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
  /**
   * Called after compaction succeeds and before a synthetic user
   * auto-continue message is added.
   *
   * - `enabled`: Defaults to `true`. Set to `false` to skip the synthetic
   *   user "continue" turn.
   */
  "experimental.compaction.autocontinue"?: (
    input: {
      sessionID: string
      agent: string
      model: Model
      provider: ProviderContext
      message: UserMessage
      overflow: boolean
    },
    output: { enabled: boolean },
  ) => Promise<void>
  "experimental.text.complete"?: (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ) => Promise<void>
  /**
   * Modify tool definitions (description and parameters) sent to LLM
   */
  "tool.definition"?: (input: { toolID: string }, output: { description: string; parameters: any }) => Promise<void>
}
````

## File: packages/plugin/src/shell.ts
````typescript
export type ShellFunction = (input: Uint8Array) => Uint8Array

export type ShellExpression =
  | { toString(): string }
  | Array<ShellExpression>
  | string
  | { raw: string }
  | ReadableStream

export interface BunShell {
  (strings: TemplateStringsArray, ...expressions: ShellExpression[]): BunShellPromise

  /**
   * Perform bash-like brace expansion on the given pattern.
   * @param pattern - Brace pattern to expand
   */
  braces(pattern: string): string[]

  /**
   * Escape strings for input into shell commands.
   */
  escape(input: string): string

  /**
   * Change the default environment variables for shells created by this instance.
   */
  env(newEnv?: Record<string, string | undefined>): BunShell

  /**
   * Default working directory to use for shells created by this instance.
   */
  cwd(newCwd?: string): BunShell

  /**
   * Configure the shell to not throw an exception on non-zero exit codes.
   */
  nothrow(): BunShell

  /**
   * Configure whether or not the shell should throw an exception on non-zero exit codes.
   */
  throws(shouldThrow: boolean): BunShell
}

export interface BunShellPromise extends Promise<BunShellOutput> {
  readonly stdin: WritableStream

  /**
   * Change the current working directory of the shell.
   */
  cwd(newCwd: string): this

  /**
   * Set environment variables for the shell.
   */
  env(newEnv: Record<string, string> | undefined): this

  /**
   * By default, the shell will write to the current process's stdout and stderr, as well as buffering that output.
   * This configures the shell to only buffer the output.
   */
  quiet(): this

  /**
   * Read from stdout as a string, line by line
   * Automatically calls quiet() to disable echoing to stdout.
   */
  lines(): AsyncIterable<string>

  /**
   * Read from stdout as a string.
   * Automatically calls quiet() to disable echoing to stdout.
   */
  text(encoding?: BufferEncoding): Promise<string>

  /**
   * Read from stdout as a JSON object
   * Automatically calls quiet()
   */
  json(): Promise<any>

  /**
   * Read from stdout as an ArrayBuffer
   * Automatically calls quiet()
   */
  arrayBuffer(): Promise<ArrayBuffer>

  /**
   * Read from stdout as a Blob
   * Automatically calls quiet()
   */
  blob(): Promise<Blob>

  /**
   * Configure the shell to not throw an exception on non-zero exit codes.
   */
  nothrow(): this

  /**
   * Configure whether or not the shell should throw an exception on non-zero exit codes.
   */
  throws(shouldThrow: boolean): this
}

export interface BunShellOutput {
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly exitCode: number

  /**
   * Read from stdout as a string
   */
  text(encoding?: BufferEncoding): string

  /**
   * Read from stdout as a JSON object
   */
  json(): any

  /**
   * Read from stdout as an ArrayBuffer
   */
  arrayBuffer(): ArrayBuffer

  /**
   * Read from stdout as an Uint8Array
   */
  bytes(): Uint8Array

  /**
   * Read from stdout as a Blob
   */
  blob(): Blob
}

export type BunShellError = Error & BunShellOutput
````

## File: packages/plugin/src/tool.ts
````typescript
import { z } from "zod"
import { Effect } from "effect"

export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  /**
   * Current project directory for this session.
   * Prefer this over process.cwd() when resolving relative paths.
   */
  directory: string
  /**
   * Project worktree root for this session.
   * Useful for generating stable relative paths (e.g. path.relative(worktree, absPath)).
   */
  worktree: string
  abort: AbortSignal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Effect.Effect<void>
}

type AskInput = {
  permission: string
  patterns: string[]
  always: string[]
  metadata: { [key: string]: any }
}

export type ToolResult = string | { output: string; metadata?: { [key: string]: any } }

export function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>
}) {
  return input
}
tool.schema = z

export type ToolDefinition = ReturnType<typeof tool>
````

## File: packages/plugin/src/tui.ts
````typescript
import type {
  AgentPart,
  OpencodeClient,
  Event,
  FilePart,
  LspStatus,
  McpStatus,
  Todo,
  Message,
  Part,
  Provider,
  PermissionRequest,
  QuestionRequest,
  SessionStatus,
  TextPart,
  Config as SdkConfig,
} from "@opencode-ai/sdk/v2"
import type { CliRenderer, KeyEvent, RGBA, Renderable, SlotMode } from "@opentui/core"
import type { Binding, Keymap } from "@opentui/keymap"
import {
  createBindingLookup as createKeymapBindingLookup,
  type BindingConfig,
  type CreateBindingLookupOptions,
  type KeySequenceFormatPart,
  type SequenceBindingLike,
} from "@opentui/keymap/extras"
import type { JSX, SolidPlugin } from "@opentui/solid"
import type { Config as PluginConfig, PluginOptions } from "./index.js"

export type { CliRenderer, KeyEvent, Renderable, SlotMode } from "@opentui/core"
export { stringifyKeySequence, stringifyKeyStroke } from "@opentui/keymap"
export type { Binding, KeyLike, KeySequencePart, KeyStringifyInput, StringifyOptions } from "@opentui/keymap"
export { formatCommandBindings, formatKeySequence } from "@opentui/keymap/extras"
export type {
  BindingConfig,
  BindingLookup,
  BindingValue,
  CreateBindingLookupOptions,
  FormatCommandBindingsOptions,
  FormatKeySequenceOptions,
  KeySequenceFormatPart,
  SequenceBindingLike,
} from "@opentui/keymap/extras"

export function createBindingLookup(
  config: BindingConfig<Renderable, KeyEvent> | undefined,
  options?: CreateBindingLookupOptions<Renderable, KeyEvent>,
) {
  return createKeymapBindingLookup<Renderable, KeyEvent>(config ?? {}, options)
}

export type TuiRouteCurrent =
  | {
      name: "home"
    }
  | {
      name: "session"
      params: {
        sessionID: string
        prompt?: unknown
      }
    }
  | {
      name: string
      params?: Record<string, unknown>
    }

export type TuiRouteDefinition = {
  name: string
  render: (input: { params?: Record<string, unknown> }) => JSX.Element
}

export type TuiKeys = {
  formatSequence: (parts: readonly KeySequenceFormatPart[] | undefined) => string
  formatBindings: (bindings: readonly SequenceBindingLike[] | undefined) => string | undefined
}

export type TuiKeymap = Keymap<Renderable, KeyEvent>

/**
 * Legacy `api.command` shape kept so v1 plugins can initialize. Remove in v2.
 *
 * @deprecated Use `api.keymap.registerLayer({ commands, bindings })` instead.
 */
export type TuiCommand = {
  title: string
  value: string
  description?: string
  category?: string
  keybind?: string
  suggested?: boolean
  hidden?: boolean
  enabled?: boolean
  slash?: {
    name: string
    aliases?: string[]
  }
  onSelect?: (dialog?: TuiDialogStack) => void | Promise<void>
}

/**
 * Legacy `api.command` API kept so v1 plugins can initialize. Remove in v2.
 *
 * @deprecated Use `api.keymap.registerLayer`, `api.keymap.dispatchCommand`, and
 * `api.keymap.dispatchCommand("command.palette.show")` instead.
 */
export type TuiCommandApi = {
  /** @deprecated Use `api.keymap.registerLayer({ commands, bindings })` instead. */
  register: (cb: () => TuiCommand[]) => () => void
  /** @deprecated Use `api.keymap.dispatchCommand(name)` instead. */
  trigger: (value: string) => void
  /** @deprecated Use `api.keymap.dispatchCommand("command.palette.show")` instead. */
  show: () => void
}

export type TuiDialogProps = {
  size?: "medium" | "large" | "xlarge"
  onClose: () => void
  children?: JSX.Element
}

export type TuiDialogStack = {
  replace: (render: () => JSX.Element, onClose?: () => void) => void
  clear: () => void
  setSize: (size: "medium" | "large" | "xlarge") => void
  readonly size: "medium" | "large" | "xlarge"
  readonly depth: number
  readonly open: boolean
}

export type TuiDialogAlertProps = {
  title: string
  message: string
  onConfirm?: () => void
}

export type TuiDialogConfirmProps = {
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
}

export type TuiDialogPromptProps = {
  title: string
  description?: () => JSX.Element
  placeholder?: string
  value?: string
  busy?: boolean
  busyText?: string
  onConfirm?: (value: string) => void
  onCancel?: () => void
}

export type TuiDialogSelectOption<Value = unknown> = {
  title: string
  value: Value
  description?: string
  footer?: JSX.Element | string
  category?: string
  disabled?: boolean
  onSelect?: () => void
}

export type TuiDialogSelectProps<Value = unknown> = {
  title: string
  placeholder?: string
  options: TuiDialogSelectOption<Value>[]
  flat?: boolean
  onMove?: (option: TuiDialogSelectOption<Value>) => void
  onFilter?: (query: string) => void
  onSelect?: (option: TuiDialogSelectOption<Value>) => void
  skipFilter?: boolean
  current?: Value
}

export type TuiPromptInfo = {
  input: string
  mode?: "normal" | "shell"
  parts: (
    | Omit<FilePart, "id" | "messageID" | "sessionID">
    | Omit<AgentPart, "id" | "messageID" | "sessionID">
    | (Omit<TextPart, "id" | "messageID" | "sessionID"> & {
        source?: {
          text: {
            start: number
            end: number
            value: string
          }
        }
      })
  )[]
}

export type TuiPromptRef = {
  focused: boolean
  current: TuiPromptInfo
  set(prompt: TuiPromptInfo): void
  reset(): void
  blur(): void
  focus(): void
  submit(): void
}

export type TuiPromptProps = {
  sessionID?: string
  workspaceID?: string
  visible?: boolean
  disabled?: boolean
  onSubmit?: () => void
  ref?: (ref: TuiPromptRef | undefined) => void
  hint?: JSX.Element
  right?: JSX.Element
  showPlaceholder?: boolean
  placeholders?: {
    normal?: string[]
    shell?: string[]
  }
}

export type TuiToast = {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  message: string
  duration?: number
}

export type TuiThemeCurrent = {
  readonly primary: RGBA
  readonly secondary: RGBA
  readonly accent: RGBA
  readonly error: RGBA
  readonly warning: RGBA
  readonly success: RGBA
  readonly info: RGBA
  readonly text: RGBA
  readonly textMuted: RGBA
  readonly selectedListItemText: RGBA
  readonly background: RGBA
  readonly backgroundPanel: RGBA
  readonly backgroundElement: RGBA
  readonly backgroundMenu: RGBA
  readonly border: RGBA
  readonly borderActive: RGBA
  readonly borderSubtle: RGBA
  readonly diffAdded: RGBA
  readonly diffRemoved: RGBA
  readonly diffContext: RGBA
  readonly diffHunkHeader: RGBA
  readonly diffHighlightAdded: RGBA
  readonly diffHighlightRemoved: RGBA
  readonly diffAddedBg: RGBA
  readonly diffRemovedBg: RGBA
  readonly diffContextBg: RGBA
  readonly diffLineNumber: RGBA
  readonly diffAddedLineNumberBg: RGBA
  readonly diffRemovedLineNumberBg: RGBA
  readonly markdownText: RGBA
  readonly markdownHeading: RGBA
  readonly markdownLink: RGBA
  readonly markdownLinkText: RGBA
  readonly markdownCode: RGBA
  readonly markdownBlockQuote: RGBA
  readonly markdownEmph: RGBA
  readonly markdownStrong: RGBA
  readonly markdownHorizontalRule: RGBA
  readonly markdownListItem: RGBA
  readonly markdownListEnumeration: RGBA
  readonly markdownImage: RGBA
  readonly markdownImageText: RGBA
  readonly markdownCodeBlock: RGBA
  readonly syntaxComment: RGBA
  readonly syntaxKeyword: RGBA
  readonly syntaxFunction: RGBA
  readonly syntaxVariable: RGBA
  readonly syntaxString: RGBA
  readonly syntaxNumber: RGBA
  readonly syntaxType: RGBA
  readonly syntaxOperator: RGBA
  readonly syntaxPunctuation: RGBA
  readonly thinkingOpacity: number
}

export type TuiTheme = {
  readonly current: TuiThemeCurrent
  readonly selected: string
  has: (name: string) => boolean
  set: (name: string) => boolean
  install: (jsonPath: string) => Promise<void>
  mode: () => "dark" | "light"
  readonly ready: boolean
}

export type TuiKV = {
  get: <Value = unknown>(key: string, fallback?: Value) => Value
  set: (key: string, value: unknown) => void
  readonly ready: boolean
}

export type TuiState = {
  readonly ready: boolean
  readonly config: SdkConfig
  readonly provider: ReadonlyArray<Provider>
  readonly path: {
    state: string
    config: string
    worktree: string
    directory: string
  }
  readonly vcs: { branch?: string } | undefined
  session: {
    count: () => number
    diff: (sessionID: string) => ReadonlyArray<TuiSidebarFileItem>
    todo: (sessionID: string) => ReadonlyArray<TuiSidebarTodoItem>
    messages: (sessionID: string) => ReadonlyArray<Message>
    status: (sessionID: string) => SessionStatus | undefined
    permission: (sessionID: string) => ReadonlyArray<PermissionRequest>
    question: (sessionID: string) => ReadonlyArray<QuestionRequest>
  }
  part: (messageID: string) => ReadonlyArray<Part>
  lsp: () => ReadonlyArray<TuiSidebarLspItem>
  mcp: () => ReadonlyArray<TuiSidebarMcpItem>
}

type TuiBindingLookupView = {
  readonly bindings: ReadonlyArray<Binding<Renderable, KeyEvent>>
  get: (command: string) => ReadonlyArray<Binding<Renderable, KeyEvent>>
  has: (command: string) => boolean
  gather: (name: string, commands: readonly string[]) => ReadonlyArray<Binding<Renderable, KeyEvent>>
  pick: (name: string, commands: readonly string[]) => Binding<Renderable, KeyEvent>[]
  omit: (name: string, commands: readonly string[]) => Binding<Renderable, KeyEvent>[]
}

type TuiConfigView = Pick<PluginConfig, "$schema" | "theme" | "plugin"> &
  NonNullable<PluginConfig["tui"]> & {
    leader_timeout: number
    plugin_enabled?: Record<string, boolean>
    keybinds: TuiBindingLookupView
  }

export type TuiApp = {
  readonly version: string
}

type Frozen<Value> = Value extends (...args: never[]) => unknown
  ? Value
  : Value extends ReadonlyArray<infer Item>
    ? ReadonlyArray<Frozen<Item>>
    : Value extends object
      ? { readonly [Key in keyof Value]: Frozen<Value[Key]> }
      : Value

export type TuiSidebarMcpItem = {
  name: string
  status: McpStatus["status"]
  error?: string
}

export type TuiSidebarLspItem = Pick<LspStatus, "id" | "root" | "status">

export type TuiSidebarTodoItem = Pick<Todo, "content" | "status">

export type TuiSidebarFileItem = {
  file: string
  additions: number
  deletions: number
}

export type TuiHostSlotMap = {
  app: {}
  app_bottom: {}
  home_logo: {}
  home_prompt: {
    workspace_id?: string
    ref?: (ref: TuiPromptRef | undefined) => void
  }
  home_prompt_right: {
    workspace_id?: string
  }
  session_prompt: {
    session_id: string
    visible?: boolean
    disabled?: boolean
    on_submit?: () => void
    ref?: (ref: TuiPromptRef | undefined) => void
  }
  session_prompt_right: {
    session_id: string
  }
  home_bottom: {}
  home_footer: {}
  sidebar_title: {
    session_id: string
    title: string
    share_url?: string
  }
  sidebar_content: {
    session_id: string
  }
  sidebar_footer: {
    session_id: string
  }
}

export type TuiSlotMap<Slots extends Record<string, object> = {}> = TuiHostSlotMap & Slots

type TuiSlotShape<Name extends string, Slots extends Record<string, object>> = Name extends keyof TuiHostSlotMap
  ? TuiHostSlotMap[Name]
  : Name extends keyof Slots
    ? Slots[Name]
    : Record<string, unknown>

export type TuiSlotProps<Name extends string = string, Slots extends Record<string, object> = {}> = {
  name: Name
  mode?: SlotMode
  children?: JSX.Element
} & TuiSlotShape<Name, Slots>

export type TuiSlotContext = {
  theme: TuiTheme
}

type SlotCore<Slots extends Record<string, object> = {}> = SolidPlugin<TuiSlotMap<Slots>, TuiSlotContext>

export type TuiSlotPlugin<Slots extends Record<string, object> = {}> = Omit<SlotCore<Slots>, "id"> & {
  id?: never
}

export type TuiSlots = {
  register: {
    (plugin: TuiSlotPlugin): string
    <Slots extends Record<string, object>>(plugin: TuiSlotPlugin<Slots>): string
  }
}

export type TuiEventBus = {
  on: <Type extends Event["type"]>(type: Type, handler: (event: Extract<Event, { type: Type }>) => void) => () => void
}

export type TuiDispose = () => void | Promise<void>

export type TuiLifecycle = {
  readonly signal: AbortSignal
  onDispose: (fn: TuiDispose) => () => void
}

export type TuiPluginState = "first" | "updated" | "same"

export type TuiPluginEntry = {
  id: string
  source: "file" | "npm" | "internal"
  spec: string
  target: string
  requested?: string
  version?: string
  modified?: number
  first_time: number
  last_time: number
  time_changed: number
  load_count: number
  fingerprint: string
}

export type TuiPluginMeta = TuiPluginEntry & {
  state: TuiPluginState
}

export type TuiPluginStatus = {
  id: string
  source: TuiPluginEntry["source"]
  spec: string
  target: string
  enabled: boolean
  active: boolean
}

export type TuiPluginInstallOptions = {
  global?: boolean
}

export type TuiPluginInstallResult =
  | {
      ok: true
      dir: string
      tui: boolean
    }
  | {
      ok: false
      message: string
      missing?: boolean
    }

export type TuiWorkspace = {
  current: () => string | undefined
  set: (workspaceID?: string) => void
}

export type TuiPluginApi = {
  app: TuiApp
  /**
   * Legacy `api.command` API kept so v1 plugins can initialize. Remove in v2.
   *
   * @deprecated Use `api.keymap.registerLayer`, `api.keymap.dispatchCommand`, and
   * `api.keymap.dispatchCommand("command.palette.show")` instead.
   */
  command?: TuiCommandApi
  keys: TuiKeys
  keymap: TuiKeymap
  route: {
    register: (routes: TuiRouteDefinition[]) => () => void
    navigate: (name: string, params?: Record<string, unknown>) => void
    readonly current: TuiRouteCurrent
  }
  ui: {
    Dialog: (props: TuiDialogProps) => JSX.Element
    DialogAlert: (props: TuiDialogAlertProps) => JSX.Element
    DialogConfirm: (props: TuiDialogConfirmProps) => JSX.Element
    DialogPrompt: (props: TuiDialogPromptProps) => JSX.Element
    DialogSelect: <Value = unknown>(props: TuiDialogSelectProps<Value>) => JSX.Element
    Slot: <Name extends string>(props: TuiSlotProps<Name>) => JSX.Element | null
    Prompt: (props: TuiPromptProps) => JSX.Element
    toast: (input: TuiToast) => void
    dialog: TuiDialogStack
  }
  readonly tuiConfig: Frozen<TuiConfigView>
  kv: TuiKV
  state: TuiState
  theme: TuiTheme
  client: OpencodeClient
  event: TuiEventBus
  renderer: CliRenderer
  slots: TuiSlots
  plugins: {
    list: () => ReadonlyArray<TuiPluginStatus>
    activate: (id: string) => Promise<boolean>
    deactivate: (id: string) => Promise<boolean>
    add: (spec: string) => Promise<boolean>
    install: (spec: string, options?: TuiPluginInstallOptions) => Promise<TuiPluginInstallResult>
  }
  lifecycle: TuiLifecycle
}

export type TuiPlugin = (api: TuiPluginApi, options: PluginOptions | undefined, meta: TuiPluginMeta) => Promise<void>

export type TuiPluginModule = {
  id?: string
  tui: TuiPlugin
  server?: never
}
````

## File: packages/sdk/js/src/gen/client/client.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { createSseClient } from "../core/serverSentEvents.gen.js"
import type { Client, Config, RequestOptions, ResolvedRequestOptions } from "./types.gen.js"
import {
  buildUrl,
  createConfig,
  createInterceptors,
  getParseAs,
  mergeConfigs,
  mergeHeaders,
  setAuthParams,
} from "./utils.gen.js"

type ReqInit = Omit<RequestInit, "body" | "headers"> & {
  body?: any
  headers: ReturnType<typeof mergeHeaders>
}

export const createClient = (config: Config = {}): Client => {
  let _config = mergeConfigs(createConfig(), config)

  const getConfig = (): Config => ({ ..._config })

  const setConfig = (config: Config): Config => {
    _config = mergeConfigs(_config, config)
    return getConfig()
  }

  const interceptors = createInterceptors<Request, Response, unknown, ResolvedRequestOptions>()

  const beforeRequest = async (options: RequestOptions) => {
    const opts = {
      ..._config,
      ...options,
      fetch: options.fetch ?? _config.fetch ?? globalThis.fetch,
      headers: mergeHeaders(_config.headers, options.headers),
      serializedBody: undefined,
    }

    if (opts.security) {
      await setAuthParams({
        ...opts,
        security: opts.security,
      })
    }

    if (opts.requestValidator) {
      await opts.requestValidator(opts)
    }

    if (opts.body && opts.bodySerializer) {
      opts.serializedBody = opts.bodySerializer(opts.body)
    }

    // remove Content-Type header if body is empty to avoid sending invalid requests
    if (opts.serializedBody === undefined || opts.serializedBody === "") {
      opts.headers.delete("Content-Type")
    }

    const url = buildUrl(opts)

    return { opts, url }
  }

  const request: Client["request"] = async (options) => {
    // @ts-expect-error
    const { opts, url } = await beforeRequest(options)
    const requestInit: ReqInit = {
      redirect: "follow",
      ...opts,
      body: opts.serializedBody,
    }

    let request = new Request(url, requestInit)

    for (const fn of interceptors.request._fns) {
      if (fn) {
        request = await fn(request, opts)
      }
    }

    // fetch must be assigned here, otherwise it would throw the error:
    // TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation
    const _fetch = opts.fetch!
    let response = await _fetch(request)

    for (const fn of interceptors.response._fns) {
      if (fn) {
        response = await fn(response, request, opts)
      }
    }

    const result = {
      request,
      response,
    }

    if (response.ok) {
      if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return opts.responseStyle === "data"
          ? {}
          : {
              data: {},
              ...result,
            }
      }

      const parseAs =
        (opts.parseAs === "auto" ? getParseAs(response.headers.get("Content-Type")) : opts.parseAs) ?? "json"

      let data: any
      switch (parseAs) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          data = await response[parseAs]()
          break
        case "stream":
          return opts.responseStyle === "data"
            ? response.body
            : {
                data: response.body,
                ...result,
              }
      }

      if (parseAs === "json") {
        if (opts.responseValidator) {
          await opts.responseValidator(data)
        }

        if (opts.responseTransformer) {
          data = await opts.responseTransformer(data)
        }
      }

      return opts.responseStyle === "data"
        ? data
        : {
            data,
            ...result,
          }
    }

    const textError = await response.text()
    let jsonError: unknown

    try {
      jsonError = JSON.parse(textError)
    } catch {
      // noop
    }

    const error = jsonError ?? textError
    let finalError = error

    for (const fn of interceptors.error._fns) {
      if (fn) {
        finalError = (await fn(error, response, request, opts)) as string
      }
    }

    finalError = finalError || ({} as string)

    if (opts.throwOnError) {
      throw finalError
    }

    // TODO: we probably want to return error and improve types
    return opts.responseStyle === "data"
      ? undefined
      : {
          error: finalError,
          ...result,
        }
  }

  const makeMethod = (method: Required<Config>["method"]) => {
    const fn = (options: RequestOptions) => request({ ...options, method })
    fn.sse = async (options: RequestOptions) => {
      const { opts, url } = await beforeRequest(options)
      return createSseClient({
        ...opts,
        body: opts.body as BodyInit | null | undefined,
        headers: opts.headers as unknown as Record<string, string>,
        method,
        url,
      })
    }
    return fn
  }

  return {
    buildUrl,
    connect: makeMethod("CONNECT"),
    delete: makeMethod("DELETE"),
    get: makeMethod("GET"),
    getConfig,
    head: makeMethod("HEAD"),
    interceptors,
    options: makeMethod("OPTIONS"),
    patch: makeMethod("PATCH"),
    post: makeMethod("POST"),
    put: makeMethod("PUT"),
    request,
    setConfig,
    trace: makeMethod("TRACE"),
  } as Client
}
````

## File: packages/sdk/js/src/gen/client/index.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type { Auth } from "../core/auth.gen.js"
export type { QuerySerializerOptions } from "../core/bodySerializer.gen.js"
export {
  formDataBodySerializer,
  jsonBodySerializer,
  urlSearchParamsBodySerializer,
} from "../core/bodySerializer.gen.js"
export { buildClientParams } from "../core/params.gen.js"
export { createClient } from "./client.gen.js"
export type {
  Client,
  ClientOptions,
  Config,
  CreateClientConfig,
  Options,
  OptionsLegacyParser,
  RequestOptions,
  RequestResult,
  ResolvedRequestOptions,
  ResponseStyle,
  TDataShape,
} from "./types.gen.js"
export { createConfig, mergeHeaders } from "./utils.gen.js"
````

## File: packages/sdk/js/src/gen/client/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Auth } from "../core/auth.gen.js"
import type { ServerSentEventsOptions, ServerSentEventsResult } from "../core/serverSentEvents.gen.js"
import type { Client as CoreClient, Config as CoreConfig } from "../core/types.gen.js"
import type { Middleware } from "./utils.gen.js"

export type ResponseStyle = "data" | "fields"

export interface Config<T extends ClientOptions = ClientOptions>
  extends Omit<RequestInit, "body" | "headers" | "method">,
    CoreConfig {
  /**
   * Base URL for all requests made by this client.
   */
  baseUrl?: T["baseUrl"]
  /**
   * Fetch API implementation. You can use this option to provide a custom
   * fetch instance.
   *
   * @default globalThis.fetch
   */
  fetch?: (request: Request) => ReturnType<typeof fetch>
  /**
   * Please don't use the Fetch client for Next.js applications. The `next`
   * options won't have any effect.
   *
   * Install {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`} instead.
   */
  next?: never
  /**
   * Return the response data parsed in a specified format. By default, `auto`
   * will infer the appropriate method from the `Content-Type` response header.
   * You can override this behavior with any of the {@link Body} methods.
   * Select `stream` if you don't want to parse response data at all.
   *
   * @default 'auto'
   */
  parseAs?: "arrayBuffer" | "auto" | "blob" | "formData" | "json" | "stream" | "text"
  /**
   * Should we return only data or multiple fields (data, error, response, etc.)?
   *
   * @default 'fields'
   */
  responseStyle?: ResponseStyle
  /**
   * Throw an error instead of returning it in the response?
   *
   * @default false
   */
  throwOnError?: T["throwOnError"]
}

export interface RequestOptions<
  TData = unknown,
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends Config<{
      responseStyle: TResponseStyle
      throwOnError: ThrowOnError
    }>,
    Pick<
      ServerSentEventsOptions<TData>,
      "onSseError" | "onSseEvent" | "sseDefaultRetryDelay" | "sseMaxRetryAttempts" | "sseMaxRetryDelay"
    > {
  /**
   * Any body that you want to add to your request.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#body}
   */
  body?: unknown
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  /**
   * Security mechanism(s) to use for the request.
   */
  security?: ReadonlyArray<Auth>
  url: Url
}

export interface ResolvedRequestOptions<
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends RequestOptions<unknown, TResponseStyle, ThrowOnError, Url> {
  serializedBody?: string
}

export type RequestResult<
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = boolean,
  TResponseStyle extends ResponseStyle = "fields",
> = ThrowOnError extends true
  ? Promise<
      TResponseStyle extends "data"
        ? TData extends Record<string, unknown>
          ? TData[keyof TData]
          : TData
        : {
            data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
            request: Request
            response: Response
          }
    >
  : Promise<
      TResponseStyle extends "data"
        ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined
        : (
            | {
                data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
                error: undefined
              }
            | {
                data: undefined
                error: TError extends Record<string, unknown> ? TError[keyof TError] : TError
              }
          ) & {
            request: Request
            response: Response
          }
    >

export interface ClientOptions {
  baseUrl?: string
  responseStyle?: ResponseStyle
  throwOnError?: boolean
}

type MethodFnBase = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type MethodFnServerSentEvents = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => Promise<ServerSentEventsResult<TData, TError>>

type MethodFn = MethodFnBase & {
  sse: MethodFnServerSentEvents
}

type RequestFn = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method"> &
    Pick<Required<RequestOptions<TData, TResponseStyle, ThrowOnError>>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type BuildUrlFn = <
  TData extends {
    body?: unknown
    path?: Record<string, unknown>
    query?: Record<string, unknown>
    url: string
  },
>(
  options: Pick<TData, "url"> & Options<TData>,
) => string

export type Client = CoreClient<RequestFn, Config, MethodFn, BuildUrlFn> & {
  interceptors: Middleware<Request, Response, unknown, ResolvedRequestOptions>
}

/**
 * The `createClientConfig()` function will be called on client initialization
 * and the returned object will become the client's initial configuration.
 *
 * You may want to initialize your client this way instead of calling
 * `setConfig()`. This is useful for example if you're using Next.js
 * to ensure your client always has the correct values.
 */
export type CreateClientConfig<T extends ClientOptions = ClientOptions> = (
  override?: Config<ClientOptions & T>,
) => Config<Required<ClientOptions> & T>

export interface TDataShape {
  body?: unknown
  headers?: unknown
  path?: unknown
  query?: unknown
  url: string
}

type OmitKeys<T, K> = Pick<T, Exclude<keyof T, K>>

export type Options<
  TData extends TDataShape = TDataShape,
  ThrowOnError extends boolean = boolean,
  TResponse = unknown,
  TResponseStyle extends ResponseStyle = "fields",
> = OmitKeys<RequestOptions<TResponse, TResponseStyle, ThrowOnError>, "body" | "path" | "query" | "url"> &
  Omit<TData, "url">

export type OptionsLegacyParser<
  TData = unknown,
  ThrowOnError extends boolean = boolean,
  TResponseStyle extends ResponseStyle = "fields",
> = TData extends { body?: any }
  ? TData extends { headers?: any }
    ? OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body" | "headers" | "url"> & TData
    : OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body" | "url"> &
        TData &
        Pick<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "headers">
  : TData extends { headers?: any }
    ? OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "headers" | "url"> &
        TData &
        Pick<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "body">
    : OmitKeys<RequestOptions<unknown, TResponseStyle, ThrowOnError>, "url"> & TData
````

## File: packages/sdk/js/src/gen/client/utils.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { getAuthToken } from "../core/auth.gen.js"
import type { QuerySerializerOptions } from "../core/bodySerializer.gen.js"
import { jsonBodySerializer } from "../core/bodySerializer.gen.js"
import { serializeArrayParam, serializeObjectParam, serializePrimitiveParam } from "../core/pathSerializer.gen.js"
import { getUrl } from "../core/utils.gen.js"
import type { Client, ClientOptions, Config, RequestOptions } from "./types.gen.js"

export const createQuerySerializer = <T = unknown>({ allowReserved, array, object }: QuerySerializerOptions = {}) => {
  const querySerializer = (queryParams: T) => {
    const search: string[] = []
    if (queryParams && typeof queryParams === "object") {
      for (const name in queryParams) {
        const value = queryParams[name]

        if (value === undefined || value === null) {
          continue
        }

        if (Array.isArray(value)) {
          const serializedArray = serializeArrayParam({
            allowReserved,
            explode: true,
            name,
            style: "form",
            value,
            ...array,
          })
          if (serializedArray) search.push(serializedArray)
        } else if (typeof value === "object") {
          const serializedObject = serializeObjectParam({
            allowReserved,
            explode: true,
            name,
            style: "deepObject",
            value: value as Record<string, unknown>,
            ...object,
          })
          if (serializedObject) search.push(serializedObject)
        } else {
          const serializedPrimitive = serializePrimitiveParam({
            allowReserved,
            name,
            value: value as string,
          })
          if (serializedPrimitive) search.push(serializedPrimitive)
        }
      }
    }
    return search.join("&")
  }
  return querySerializer
}

/**
 * Infers parseAs value from provided Content-Type header.
 */
export const getParseAs = (contentType: string | null): Exclude<Config["parseAs"], "auto"> => {
  if (!contentType) {
    // If no Content-Type header is provided, the best we can do is return the raw response body,
    // which is effectively the same as the 'stream' option.
    return "stream"
  }

  const cleanContent = contentType.split(";")[0]?.trim()

  if (!cleanContent) {
    return
  }

  if (cleanContent.startsWith("application/json") || cleanContent.endsWith("+json")) {
    return "json"
  }

  if (cleanContent === "multipart/form-data") {
    return "formData"
  }

  if (["application/", "audio/", "image/", "video/"].some((type) => cleanContent.startsWith(type))) {
    return "blob"
  }

  if (cleanContent.startsWith("text/")) {
    return "text"
  }

  return
}

const checkForExistence = (
  options: Pick<RequestOptions, "auth" | "query"> & {
    headers: Headers
  },
  name?: string,
): boolean => {
  if (!name) {
    return false
  }
  if (options.headers.has(name) || options.query?.[name] || options.headers.get("Cookie")?.includes(`${name}=`)) {
    return true
  }
  return false
}

export const setAuthParams = async ({
  security,
  ...options
}: Pick<Required<RequestOptions>, "security"> &
  Pick<RequestOptions, "auth" | "query"> & {
    headers: Headers
  }) => {
  for (const auth of security) {
    if (checkForExistence(options, auth.name)) {
      continue
    }

    const token = await getAuthToken(auth, options.auth)

    if (!token) {
      continue
    }

    const name = auth.name ?? "Authorization"

    switch (auth.in) {
      case "query":
        if (!options.query) {
          options.query = {}
        }
        options.query[name] = token
        break
      case "cookie":
        options.headers.append("Cookie", `${name}=${token}`)
        break
      case "header":
      default:
        options.headers.set(name, token)
        break
    }
  }
}

export const buildUrl: Client["buildUrl"] = (options) =>
  getUrl({
    baseUrl: options.baseUrl as string,
    path: options.path,
    query: options.query,
    querySerializer:
      typeof options.querySerializer === "function"
        ? options.querySerializer
        : createQuerySerializer(options.querySerializer),
    url: options.url,
  })

export const mergeConfigs = (a: Config, b: Config): Config => {
  const config = { ...a, ...b }
  if (config.baseUrl?.endsWith("/")) {
    config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1)
  }
  config.headers = mergeHeaders(a.headers, b.headers)
  return config
}

export const mergeHeaders = (...headers: Array<Required<Config>["headers"] | undefined>): Headers => {
  const mergedHeaders = new Headers()
  for (const header of headers) {
    if (!header || typeof header !== "object") {
      continue
    }

    const iterator = header instanceof Headers ? header.entries() : Object.entries(header)

    for (const [key, value] of iterator) {
      if (value === null) {
        mergedHeaders.delete(key)
      } else if (Array.isArray(value)) {
        for (const v of value) {
          mergedHeaders.append(key, v as string)
        }
      } else if (value !== undefined) {
        // assume object headers are meant to be JSON stringified, i.e. their
        // content value in OpenAPI specification is 'application/json'
        mergedHeaders.set(key, typeof value === "object" ? JSON.stringify(value) : (value as string))
      }
    }
  }
  return mergedHeaders
}

type ErrInterceptor<Err, Res, Req, Options> = (
  error: Err,
  response: Res,
  request: Req,
  options: Options,
) => Err | Promise<Err>

type ReqInterceptor<Req, Options> = (request: Req, options: Options) => Req | Promise<Req>

type ResInterceptor<Res, Req, Options> = (response: Res, request: Req, options: Options) => Res | Promise<Res>

class Interceptors<Interceptor> {
  _fns: (Interceptor | null)[]

  constructor() {
    this._fns = []
  }

  clear() {
    this._fns = []
  }

  getInterceptorIndex(id: number | Interceptor): number {
    if (typeof id === "number") {
      return this._fns[id] ? id : -1
    } else {
      return this._fns.indexOf(id)
    }
  }
  exists(id: number | Interceptor) {
    const index = this.getInterceptorIndex(id)
    return !!this._fns[index]
  }

  eject(id: number | Interceptor) {
    const index = this.getInterceptorIndex(id)
    if (this._fns[index]) {
      this._fns[index] = null
    }
  }

  update(id: number | Interceptor, fn: Interceptor) {
    const index = this.getInterceptorIndex(id)
    if (this._fns[index]) {
      this._fns[index] = fn
      return id
    } else {
      return false
    }
  }

  use(fn: Interceptor) {
    this._fns = [...this._fns, fn]
    return this._fns.length - 1
  }
}

// `createInterceptors()` response, meant for external use as it does not
// expose internals
export interface Middleware<Req, Res, Err, Options> {
  error: Pick<Interceptors<ErrInterceptor<Err, Res, Req, Options>>, "eject" | "use">
  request: Pick<Interceptors<ReqInterceptor<Req, Options>>, "eject" | "use">
  response: Pick<Interceptors<ResInterceptor<Res, Req, Options>>, "eject" | "use">
}

// do not add `Middleware` as return type so we can use _fns internally
export const createInterceptors = <Req, Res, Err, Options>() => ({
  error: new Interceptors<ErrInterceptor<Err, Res, Req, Options>>(),
  request: new Interceptors<ReqInterceptor<Req, Options>>(),
  response: new Interceptors<ResInterceptor<Res, Req, Options>>(),
})

const defaultQuerySerializer = createQuerySerializer({
  allowReserved: false,
  array: {
    explode: true,
    style: "form",
  },
  object: {
    explode: true,
    style: "deepObject",
  },
})

const defaultHeaders = {
  "Content-Type": "application/json",
}

export const createConfig = <T extends ClientOptions = ClientOptions>(
  override: Config<Omit<ClientOptions, keyof T> & T> = {},
): Config<Omit<ClientOptions, keyof T> & T> => ({
  ...jsonBodySerializer,
  headers: defaultHeaders,
  parseAs: "auto",
  querySerializer: defaultQuerySerializer,
  ...override,
})
````

## File: packages/sdk/js/src/gen/core/auth.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type AuthToken = string | undefined

export interface Auth {
  /**
   * Which part of the request do we use to send the auth?
   *
   * @default 'header'
   */
  in?: "header" | "query" | "cookie"
  /**
   * Header or query parameter name.
   *
   * @default 'Authorization'
   */
  name?: string
  scheme?: "basic" | "bearer"
  type: "apiKey" | "http"
}

export const getAuthToken = async (
  auth: Auth,
  callback: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken,
): Promise<string | undefined> => {
  const token = typeof callback === "function" ? await callback(auth) : callback

  if (!token) {
    return
  }

  if (auth.scheme === "bearer") {
    return `Bearer ${token}`
  }

  if (auth.scheme === "basic") {
    return `Basic ${btoa(token)}`
  }

  return token
}
````

## File: packages/sdk/js/src/gen/core/bodySerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { ArrayStyle, ObjectStyle, SerializerOptions } from "./pathSerializer.gen.js"

export type QuerySerializer = (query: Record<string, unknown>) => string

export type BodySerializer = (body: any) => any

export interface QuerySerializerOptions {
  allowReserved?: boolean
  array?: SerializerOptions<ArrayStyle>
  object?: SerializerOptions<ObjectStyle>
}

const serializeFormDataPair = (data: FormData, key: string, value: unknown): void => {
  if (typeof value === "string" || value instanceof Blob) {
    data.append(key, value)
  } else if (value instanceof Date) {
    data.append(key, value.toISOString())
  } else {
    data.append(key, JSON.stringify(value))
  }
}

const serializeUrlSearchParamsPair = (data: URLSearchParams, key: string, value: unknown): void => {
  if (typeof value === "string") {
    data.append(key, value)
  } else {
    data.append(key, JSON.stringify(value))
  }
}

export const formDataBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T): FormData => {
    const data = new FormData()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      if (Array.isArray(value)) {
        value.forEach((v) => serializeFormDataPair(data, key, v))
      } else {
        serializeFormDataPair(data, key, value)
      }
    })

    return data
  },
}

export const jsonBodySerializer = {
  bodySerializer: <T>(body: T): string =>
    JSON.stringify(body, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
}

export const urlSearchParamsBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T): string => {
    const data = new URLSearchParams()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      if (Array.isArray(value)) {
        value.forEach((v) => serializeUrlSearchParamsPair(data, key, v))
      } else {
        serializeUrlSearchParamsPair(data, key, value)
      }
    })

    return data.toString()
  },
}
````

## File: packages/sdk/js/src/gen/core/params.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

type Slot = "body" | "headers" | "path" | "query"

export type Field =
  | {
      in: Exclude<Slot, "body">
      /**
       * Field name. This is the name we want the user to see and use.
       */
      key: string
      /**
       * Field mapped name. This is the name we want to use in the request.
       * If omitted, we use the same value as `key`.
       */
      map?: string
    }
  | {
      in: Extract<Slot, "body">
      /**
       * Key isn't required for bodies.
       */
      key?: string
      map?: string
    }

export interface Fields {
  allowExtra?: Partial<Record<Slot, boolean>>
  args?: ReadonlyArray<Field>
}

export type FieldsConfig = ReadonlyArray<Field | Fields>

const extraPrefixesMap: Record<string, Slot> = {
  $body_: "body",
  $headers_: "headers",
  $path_: "path",
  $query_: "query",
}
const extraPrefixes = Object.entries(extraPrefixesMap)

type KeyMap = Map<
  string,
  {
    in: Slot
    map?: string
  }
>

const buildKeyMap = (fields: FieldsConfig, map?: KeyMap): KeyMap => {
  if (!map) {
    map = new Map()
  }

  for (const config of fields) {
    if ("in" in config) {
      if (config.key) {
        map.set(config.key, {
          in: config.in,
          map: config.map,
        })
      }
    } else if (config.args) {
      buildKeyMap(config.args, map)
    }
  }

  return map
}

interface Params {
  body: unknown
  headers: Record<string, unknown>
  path: Record<string, unknown>
  query: Record<string, unknown>
}

const stripEmptySlots = (params: Params) => {
  for (const [slot, value] of Object.entries(params)) {
    if (value && typeof value === "object" && !Object.keys(value).length) {
      delete params[slot as Slot]
    }
  }
}

export const buildClientParams = (args: ReadonlyArray<unknown>, fields: FieldsConfig) => {
  const params: Params = {
    body: {},
    headers: {},
    path: {},
    query: {},
  }

  const map = buildKeyMap(fields)

  let config: FieldsConfig[number] | undefined

  for (const [index, arg] of args.entries()) {
    if (fields[index]) {
      config = fields[index]
    }

    if (!config) {
      continue
    }

    if ("in" in config) {
      if (config.key) {
        const field = map.get(config.key)!
        const name = field.map || config.key
        ;(params[field.in] as Record<string, unknown>)[name] = arg
      } else {
        params.body = arg
      }
    } else {
      for (const [key, value] of Object.entries(arg ?? {})) {
        const field = map.get(key)

        if (field) {
          const name = field.map || key
          ;(params[field.in] as Record<string, unknown>)[name] = value
        } else {
          const extra = extraPrefixes.find(([prefix]) => key.startsWith(prefix))

          if (extra) {
            const [prefix, slot] = extra
            ;(params[slot] as Record<string, unknown>)[key.slice(prefix.length)] = value
          } else {
            for (const [slot, allowed] of Object.entries(config.allowExtra ?? {})) {
              if (allowed) {
                ;(params[slot as Slot] as Record<string, unknown>)[key] = value
                break
              }
            }
          }
        }
      }
    }
  }

  stripEmptySlots(params)

  return params
}
````

## File: packages/sdk/js/src/gen/core/pathSerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

interface SerializeOptions<T> extends SerializePrimitiveOptions, SerializerOptions<T> {}

interface SerializePrimitiveOptions {
  allowReserved?: boolean
  name: string
}

export interface SerializerOptions<T> {
  /**
   * @default true
   */
  explode: boolean
  style: T
}

export type ArrayStyle = "form" | "spaceDelimited" | "pipeDelimited"
export type ArraySeparatorStyle = ArrayStyle | MatrixStyle
type MatrixStyle = "label" | "matrix" | "simple"
export type ObjectStyle = "form" | "deepObject"
type ObjectSeparatorStyle = ObjectStyle | MatrixStyle

interface SerializePrimitiveParam extends SerializePrimitiveOptions {
  value: string
}

export const separatorArrayExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const separatorArrayNoExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "form":
      return ","
    case "pipeDelimited":
      return "|"
    case "spaceDelimited":
      return "%20"
    default:
      return ","
  }
}

export const separatorObjectExplode = (style: ObjectSeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const serializeArrayParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[]
}) => {
  if (!explode) {
    const joinedValues = (allowReserved ? value : value.map((v) => encodeURIComponent(v as string))).join(
      separatorArrayNoExplode(style),
    )
    switch (style) {
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      case "simple":
        return joinedValues
      default:
        return `${name}=${joinedValues}`
    }
  }

  const separator = separatorArrayExplode(style)
  const joinedValues = value
    .map((v) => {
      if (style === "label" || style === "simple") {
        return allowReserved ? v : encodeURIComponent(v as string)
      }

      return serializePrimitiveParam({
        allowReserved,
        name,
        value: v as string,
      })
    })
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}

export const serializePrimitiveParam = ({ allowReserved, name, value }: SerializePrimitiveParam) => {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "object") {
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.",
    )
  }

  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`
}

export const serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown> | Date
  valueOnly?: boolean
}) => {
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`
  }

  if (style !== "deepObject" && !explode) {
    let values: string[] = []
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? (v as string) : encodeURIComponent(v as string)]
    })
    const joinedValues = values.join(",")
    switch (style) {
      case "form":
        return `${name}=${joinedValues}`
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      default:
        return joinedValues
    }
  }

  const separator = separatorObjectExplode(style)
  const joinedValues = Object.entries(value)
    .map(([key, v]) =>
      serializePrimitiveParam({
        allowReserved,
        name: style === "deepObject" ? `${name}[${key}]` : key,
        value: v as string,
      }),
    )
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}
````

## File: packages/sdk/js/src/gen/core/queryKeySerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

/**
 * JSON-friendly union that mirrors what Pinia Colada can hash.
 */
export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }

/**
 * Replacer that converts non-JSON values (bigint, Date, etc.) to safe substitutes.
 */
export const queryKeyJsonReplacer = (_key: string, value: unknown) => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

/**
 * Safely stringifies a value and parses it back into a JsonValue.
 */
export const stringifyToJsonValue = (input: unknown): JsonValue | undefined => {
  try {
    const json = JSON.stringify(input, queryKeyJsonReplacer)
    if (json === undefined) {
      return undefined
    }
    return JSON.parse(json) as JsonValue
  } catch {
    return undefined
  }
}

/**
 * Detects plain objects (including objects with a null prototype).
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") {
    return false
  }
  const prototype = Object.getPrototypeOf(value as object)
  return prototype === Object.prototype || prototype === null
}

/**
 * Turns URLSearchParams into a sorted JSON object for deterministic keys.
 */
const serializeSearchParams = (params: URLSearchParams): JsonValue => {
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const result: Record<string, JsonValue> = {}

  for (const [key, value] of entries) {
    const existing = result[key]
    if (existing === undefined) {
      result[key] = value
      continue
    }

    if (Array.isArray(existing)) {
      ;(existing as string[]).push(value)
    } else {
      result[key] = [existing, value]
    }
  }

  return result
}

/**
 * Normalizes any accepted value into a JSON-friendly shape for query keys.
 */
export const serializeQueryKeyValue = (value: unknown): JsonValue | undefined => {
  if (value === null) {
    return null
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return stringifyToJsonValue(value)
  }

  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return serializeSearchParams(value)
  }

  if (isPlainObject(value)) {
    return stringifyToJsonValue(value)
  }

  return undefined
}
````

## File: packages/sdk/js/src/gen/core/serverSentEvents.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Config } from "./types.gen.js"

export type ServerSentEventsOptions<TData = unknown> = Omit<RequestInit, "method"> &
  Pick<Config, "method" | "responseTransformer" | "responseValidator"> & {
    /**
     * Callback invoked when a network or parsing error occurs during streaming.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param error The error that occurred.
     */
    onSseError?: (error: unknown) => void
    /**
     * Callback invoked when an event is streamed from the server.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param event Event streamed from the server.
     * @returns Nothing (void).
     */
    onSseEvent?: (event: StreamEvent<TData>) => void
    /**
     * Default retry delay in milliseconds.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 3000
     */
    sseDefaultRetryDelay?: number
    /**
     * Maximum number of retry attempts before giving up.
     */
    sseMaxRetryAttempts?: number
    /**
     * Maximum retry delay in milliseconds.
     *
     * Applies only when exponential backoff is used.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 30000
     */
    sseMaxRetryDelay?: number
    /**
     * Optional sleep function for retry backoff.
     *
     * Defaults to using `setTimeout`.
     */
    sseSleepFn?: (ms: number) => Promise<void>
    url: string
  }

export interface StreamEvent<TData = unknown> {
  data: TData
  event?: string
  id?: string
  retry?: number
}

export type ServerSentEventsResult<TData = unknown, TReturn = void, TNext = unknown> = {
  stream: AsyncGenerator<TData extends Record<string, unknown> ? TData[keyof TData] : TData, TReturn, TNext>
}

export const createSseClient = <TData = unknown>({
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}: ServerSentEventsOptions): ServerSentEventsResult<TData> => {
  let lastEventId: string | undefined

  const sleep = sseSleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))

  const createStream = async function* () {
    let retryDelay: number = sseDefaultRetryDelay ?? 3000
    let attempt = 0
    const signal = options.signal ?? new AbortController().signal

    while (true) {
      if (signal.aborted) break

      attempt++

      const headers =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers as Record<string, string> | undefined)

      if (lastEventId !== undefined) {
        headers.set("Last-Event-ID", lastEventId)
      }

      try {
        const response = await fetch(url, { ...options, headers, signal })

        if (!response.ok) throw new Error(`SSE failed: ${response.status} ${response.statusText}`)

        if (!response.body) throw new Error("No body in SSE response")

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()

        let buffer = ""

        const abortHandler = () => {
          try {
            void reader.cancel()
          } catch {
            // noop
          }
        }

        signal.addEventListener("abort", abortHandler)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += value

            const chunks = buffer.split("\n\n")
            buffer = chunks.pop() ?? ""

            for (const chunk of chunks) {
              const lines = chunk.split("\n")
              const dataLines: Array<string> = []
              let eventName: string | undefined

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  dataLines.push(line.replace(/^data:\s*/, ""))
                } else if (line.startsWith("event:")) {
                  eventName = line.replace(/^event:\s*/, "")
                } else if (line.startsWith("id:")) {
                  lastEventId = line.replace(/^id:\s*/, "")
                } else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10)
                  if (!Number.isNaN(parsed)) {
                    retryDelay = parsed
                  }
                }
              }

              let data: unknown
              let parsedJson = false

              if (dataLines.length) {
                const rawData = dataLines.join("\n")
                try {
                  data = JSON.parse(rawData)
                  parsedJson = true
                } catch {
                  data = rawData
                }
              }

              if (parsedJson) {
                if (responseValidator) {
                  await responseValidator(data)
                }

                if (responseTransformer) {
                  data = await responseTransformer(data)
                }
              }

              onSseEvent?.({
                data,
                event: eventName,
                id: lastEventId,
                retry: retryDelay,
              })

              if (dataLines.length) {
                yield data as any
              }
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler)
          reader.releaseLock()
        }

        break // exit loop on normal completion
      } catch (error) {
        // connection failed or aborted; retry after delay
        onSseError?.(error)

        if (sseMaxRetryAttempts !== undefined && attempt >= sseMaxRetryAttempts) {
          break // stop after firing error
        }

        // exponential backoff: double retry each attempt, cap at 30s
        const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 30000)
        await sleep(backoff)
      }
    }
  }

  const stream = createStream()

  return { stream }
}
````

## File: packages/sdk/js/src/gen/core/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Auth, AuthToken } from "./auth.gen.js"
import type { BodySerializer, QuerySerializer, QuerySerializerOptions } from "./bodySerializer.gen.js"

export interface Client<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never> {
  /**
   * Returns the final request URL.
   */
  buildUrl: BuildUrlFn
  connect: MethodFn
  delete: MethodFn
  get: MethodFn
  getConfig: () => Config
  head: MethodFn
  options: MethodFn
  patch: MethodFn
  post: MethodFn
  put: MethodFn
  request: RequestFn
  setConfig: (config: Config) => Config
  trace: MethodFn
}

export interface Config {
  /**
   * Auth token or a function returning auth token. The resolved value will be
   * added to the request payload as defined by its `security` array.
   */
  auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken
  /**
   * A function for serializing request body parameter. By default,
   * {@link JSON.stringify()} will be used.
   */
  bodySerializer?: BodySerializer | null
  /**
   * An object containing any HTTP headers that you want to pre-populate your
   * `Headers` object with.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init See more}
   */
  headers?:
    | RequestInit["headers"]
    | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined | unknown>
  /**
   * The request method.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#method See more}
   */
  method?: "CONNECT" | "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | "TRACE"
  /**
   * A function for serializing request query parameters. By default, arrays
   * will be exploded in form style, objects will be exploded in deepObject
   * style, and reserved characters are percent-encoded.
   *
   * This method will have no effect if the native `paramsSerializer()` Axios
   * API function is used.
   *
   * {@link https://swagger.io/docs/specification/serialization/#query View examples}
   */
  querySerializer?: QuerySerializer | QuerySerializerOptions
  /**
   * A function validating request data. This is useful if you want to ensure
   * the request conforms to the desired shape, so it can be safely sent to
   * the server.
   */
  requestValidator?: (data: unknown) => Promise<unknown>
  /**
   * A function transforming response data before it's returned. This is useful
   * for post-processing data, e.g. converting ISO strings into Date objects.
   */
  responseTransformer?: (data: unknown) => Promise<unknown>
  /**
   * A function validating response data. This is useful if you want to ensure
   * the response conforms to the desired shape, so it can be safely passed to
   * the transformers and returned to the user.
   */
  responseValidator?: (data: unknown) => Promise<unknown>
}

type IsExactlyNeverOrNeverUndefined<T> = [T] extends [never]
  ? true
  : [T] extends [never | undefined]
    ? [undefined] extends [T]
      ? false
      : true
    : false

export type OmitNever<T extends Record<string, unknown>> = {
  [K in keyof T as IsExactlyNeverOrNeverUndefined<T[K]> extends true ? never : K]: T[K]
}
````

## File: packages/sdk/js/src/gen/core/utils.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { QuerySerializer } from "./bodySerializer.gen.js"
import {
  type ArraySeparatorStyle,
  serializeArrayParam,
  serializeObjectParam,
  serializePrimitiveParam,
} from "./pathSerializer.gen.js"

export interface PathSerializer {
  path: Record<string, unknown>
  url: string
}

export const PATH_PARAM_RE = /\{[^{}]+\}/g

export const defaultPathSerializer = ({ path, url: _url }: PathSerializer) => {
  let url = _url
  const matches = _url.match(PATH_PARAM_RE)
  if (matches) {
    for (const match of matches) {
      let explode = false
      let name = match.substring(1, match.length - 1)
      let style: ArraySeparatorStyle = "simple"

      if (name.endsWith("*")) {
        explode = true
        name = name.substring(0, name.length - 1)
      }

      if (name.startsWith(".")) {
        name = name.substring(1)
        style = "label"
      } else if (name.startsWith(";")) {
        name = name.substring(1)
        style = "matrix"
      }

      const value = path[name]

      if (value === undefined || value === null) {
        continue
      }

      if (Array.isArray(value)) {
        url = url.replace(match, serializeArrayParam({ explode, name, style, value }))
        continue
      }

      if (typeof value === "object") {
        url = url.replace(
          match,
          serializeObjectParam({
            explode,
            name,
            style,
            value: value as Record<string, unknown>,
            valueOnly: true,
          }),
        )
        continue
      }

      if (style === "matrix") {
        url = url.replace(
          match,
          `;${serializePrimitiveParam({
            name,
            value: value as string,
          })}`,
        )
        continue
      }

      const replaceValue = encodeURIComponent(style === "label" ? `.${value as string}` : (value as string))
      url = url.replace(match, replaceValue)
    }
  }
  return url
}

export const getUrl = ({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url,
}: {
  baseUrl?: string
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  querySerializer: QuerySerializer
  url: string
}) => {
  const pathUrl = _url.startsWith("/") ? _url : `/${_url}`
  let url = (baseUrl ?? "") + pathUrl
  if (path) {
    url = defaultPathSerializer({ path, url })
  }
  let search = query ? querySerializer(query) : ""
  if (search.startsWith("?")) {
    search = search.substring(1)
  }
  if (search) {
    url += `?${search}`
  }
  return url
}
````

## File: packages/sdk/js/src/gen/client.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { ClientOptions } from "./types.gen.js"
import { type Config, type ClientOptions as DefaultClientOptions, createClient, createConfig } from "./client/index.js"

/**
 * The `createClientConfig()` function will be called on client initialization
 * and the returned object will become the client's initial configuration.
 *
 * You may want to initialize your client this way instead of calling
 * `setConfig()`. This is useful for example if you're using Next.js
 * to ensure your client always has the correct values.
 */
export type CreateClientConfig<T extends DefaultClientOptions = ClientOptions> = (
  override?: Config<DefaultClientOptions & T>,
) => Config<Required<DefaultClientOptions> & T>

export const client = createClient(
  createConfig<ClientOptions>({
    baseUrl: "http://localhost:4096",
  }),
)
````

## File: packages/sdk/js/src/gen/sdk.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Options as ClientOptions, TDataShape, Client } from "./client/index.js"
import type {
  GlobalEventData,
  GlobalEventResponses,
  ProjectListData,
  ProjectListResponses,
  ProjectCurrentData,
  ProjectCurrentResponses,
  PtyListData,
  PtyListResponses,
  PtyCreateData,
  PtyCreateResponses,
  PtyCreateErrors,
  PtyRemoveData,
  PtyRemoveResponses,
  PtyRemoveErrors,
  PtyGetData,
  PtyGetResponses,
  PtyGetErrors,
  PtyUpdateData,
  PtyUpdateResponses,
  PtyUpdateErrors,
  PtyConnectData,
  PtyConnectResponses,
  PtyConnectErrors,
  ConfigGetData,
  ConfigGetResponses,
  ConfigUpdateData,
  ConfigUpdateResponses,
  ConfigUpdateErrors,
  ToolIdsData,
  ToolIdsResponses,
  ToolIdsErrors,
  ToolListData,
  ToolListResponses,
  ToolListErrors,
  InstanceDisposeData,
  InstanceDisposeResponses,
  PathGetData,
  PathGetResponses,
  VcsGetData,
  VcsGetResponses,
  SessionListData,
  SessionListResponses,
  SessionCreateData,
  SessionCreateResponses,
  SessionCreateErrors,
  SessionStatusData,
  SessionStatusResponses,
  SessionStatusErrors,
  SessionDeleteData,
  SessionDeleteResponses,
  SessionDeleteErrors,
  SessionGetData,
  SessionGetResponses,
  SessionGetErrors,
  SessionUpdateData,
  SessionUpdateResponses,
  SessionUpdateErrors,
  SessionChildrenData,
  SessionChildrenResponses,
  SessionChildrenErrors,
  SessionTodoData,
  SessionTodoResponses,
  SessionTodoErrors,
  SessionInitData,
  SessionInitResponses,
  SessionInitErrors,
  SessionForkData,
  SessionForkResponses,
  SessionAbortData,
  SessionAbortResponses,
  SessionAbortErrors,
  SessionUnshareData,
  SessionUnshareResponses,
  SessionUnshareErrors,
  SessionShareData,
  SessionShareResponses,
  SessionShareErrors,
  SessionDiffData,
  SessionDiffResponses,
  SessionDiffErrors,
  SessionSummarizeData,
  SessionSummarizeResponses,
  SessionSummarizeErrors,
  SessionMessagesData,
  SessionMessagesResponses,
  SessionMessagesErrors,
  SessionPromptData,
  SessionPromptResponses,
  SessionPromptErrors,
  SessionMessageData,
  SessionMessageResponses,
  SessionMessageErrors,
  SessionPromptAsyncData,
  SessionPromptAsyncResponses,
  SessionPromptAsyncErrors,
  SessionCommandData,
  SessionCommandResponses,
  SessionCommandErrors,
  SessionShellData,
  SessionShellResponses,
  SessionShellErrors,
  SessionRevertData,
  SessionRevertResponses,
  SessionRevertErrors,
  SessionUnrevertData,
  SessionUnrevertResponses,
  SessionUnrevertErrors,
  PostSessionIdPermissionsPermissionIdData,
  PostSessionIdPermissionsPermissionIdResponses,
  PostSessionIdPermissionsPermissionIdErrors,
  CommandListData,
  CommandListResponses,
  ConfigProvidersData,
  ConfigProvidersResponses,
  ProviderListData,
  ProviderListResponses,
  ProviderAuthData,
  ProviderAuthResponses,
  ProviderOauthAuthorizeData,
  ProviderOauthAuthorizeResponses,
  ProviderOauthAuthorizeErrors,
  ProviderOauthCallbackData,
  ProviderOauthCallbackResponses,
  ProviderOauthCallbackErrors,
  FindTextData,
  FindTextResponses,
  FindFilesData,
  FindFilesResponses,
  FindSymbolsData,
  FindSymbolsResponses,
  FileListData,
  FileListResponses,
  FileReadData,
  FileReadResponses,
  FileStatusData,
  FileStatusResponses,
  AppLogData,
  AppLogResponses,
  AppLogErrors,
  AppAgentsData,
  AppAgentsResponses,
  McpStatusData,
  McpStatusResponses,
  McpAddData,
  McpAddResponses,
  McpAddErrors,
  McpAuthRemoveData,
  McpAuthRemoveResponses,
  McpAuthRemoveErrors,
  McpAuthStartData,
  McpAuthStartResponses,
  McpAuthStartErrors,
  McpAuthCallbackData,
  McpAuthCallbackResponses,
  McpAuthCallbackErrors,
  McpAuthAuthenticateData,
  McpAuthAuthenticateResponses,
  McpAuthAuthenticateErrors,
  McpConnectData,
  McpConnectResponses,
  McpDisconnectData,
  McpDisconnectResponses,
  LspStatusData,
  LspStatusResponses,
  FormatterStatusData,
  FormatterStatusResponses,
  TuiAppendPromptData,
  TuiAppendPromptResponses,
  TuiAppendPromptErrors,
  TuiOpenHelpData,
  TuiOpenHelpResponses,
  TuiOpenSessionsData,
  TuiOpenSessionsResponses,
  TuiOpenThemesData,
  TuiOpenThemesResponses,
  TuiOpenModelsData,
  TuiOpenModelsResponses,
  TuiSubmitPromptData,
  TuiSubmitPromptResponses,
  TuiClearPromptData,
  TuiClearPromptResponses,
  TuiExecuteCommandData,
  TuiExecuteCommandResponses,
  TuiExecuteCommandErrors,
  TuiShowToastData,
  TuiShowToastResponses,
  TuiPublishData,
  TuiPublishResponses,
  TuiPublishErrors,
  TuiControlNextData,
  TuiControlNextResponses,
  TuiControlResponseData,
  TuiControlResponseResponses,
  AuthSetData,
  AuthSetResponses,
  AuthSetErrors,
  EventSubscribeData,
  EventSubscribeResponses,
} from "./types.gen.js"
import { client as _heyApiClient } from "./client.gen.js"

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<
  TData,
  ThrowOnError
> & {
  /**
   * You can provide a client instance returned by `createClient()` instead of
   * individual options. This might be also useful if you want to implement a
   * custom client.
   */
  client?: Client
  /**
   * You can pass arbitrary values through the `meta` object. This can be
   * used to access values that aren't defined as part of the SDK function.
   */
  meta?: Record<string, unknown>
}

class _HeyApiClient {
  protected _client: Client = _heyApiClient

  constructor(args?: { client?: Client }) {
    if (args?.client) {
      this._client = args.client
    }
  }
}

class Global extends _HeyApiClient {
  /**
   * Get events
   */
  public event<ThrowOnError extends boolean = false>(options?: Options<GlobalEventData, ThrowOnError>) {
    return (options?.client ?? this._client).get.sse<GlobalEventResponses, unknown, ThrowOnError>({
      url: "/global/event",
      ...options,
    })
  }
}

class Project extends _HeyApiClient {
  /**
   * List all projects
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<ProjectListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProjectListResponses, unknown, ThrowOnError>({
      url: "/project",
      ...options,
    })
  }

  /**
   * Get the current project
   */
  public current<ThrowOnError extends boolean = false>(options?: Options<ProjectCurrentData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProjectCurrentResponses, unknown, ThrowOnError>({
      url: "/project/current",
      ...options,
    })
  }
}

class Pty extends _HeyApiClient {
  /**
   * List all PTY sessions
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<PtyListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<PtyListResponses, unknown, ThrowOnError>({
      url: "/pty",
      ...options,
    })
  }

  /**
   * Create a new PTY session
   */
  public create<ThrowOnError extends boolean = false>(options?: Options<PtyCreateData, ThrowOnError>) {
    return (options?.client ?? this._client).post<PtyCreateResponses, PtyCreateErrors, ThrowOnError>({
      url: "/pty",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Remove a PTY session
   */
  public remove<ThrowOnError extends boolean = false>(options: Options<PtyRemoveData, ThrowOnError>) {
    return (options.client ?? this._client).delete<PtyRemoveResponses, PtyRemoveErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
    })
  }

  /**
   * Get PTY session info
   */
  public get<ThrowOnError extends boolean = false>(options: Options<PtyGetData, ThrowOnError>) {
    return (options.client ?? this._client).get<PtyGetResponses, PtyGetErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
    })
  }

  /**
   * Update PTY session
   */
  public update<ThrowOnError extends boolean = false>(options: Options<PtyUpdateData, ThrowOnError>) {
    return (options.client ?? this._client).put<PtyUpdateResponses, PtyUpdateErrors, ThrowOnError>({
      url: "/pty/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Connect to a PTY session
   */
  public connect<ThrowOnError extends boolean = false>(options: Options<PtyConnectData, ThrowOnError>) {
    return (options.client ?? this._client).get<PtyConnectResponses, PtyConnectErrors, ThrowOnError>({
      url: "/pty/{id}/connect",
      ...options,
    })
  }
}

class Config extends _HeyApiClient {
  /**
   * Get config info
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<ConfigGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ConfigGetResponses, unknown, ThrowOnError>({
      url: "/config",
      ...options,
    })
  }

  /**
   * Update config
   */
  public update<ThrowOnError extends boolean = false>(options?: Options<ConfigUpdateData, ThrowOnError>) {
    return (options?.client ?? this._client).patch<ConfigUpdateResponses, ConfigUpdateErrors, ThrowOnError>({
      url: "/config",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * List all providers
   */
  public providers<ThrowOnError extends boolean = false>(options?: Options<ConfigProvidersData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ConfigProvidersResponses, unknown, ThrowOnError>({
      url: "/config/providers",
      ...options,
    })
  }
}

class Tool extends _HeyApiClient {
  /**
   * List all tool IDs (including built-in and dynamically registered)
   */
  public ids<ThrowOnError extends boolean = false>(options?: Options<ToolIdsData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ToolIdsResponses, ToolIdsErrors, ThrowOnError>({
      url: "/experimental/tool/ids",
      ...options,
    })
  }

  /**
   * List tools with JSON schema parameters for a provider/model
   */
  public list<ThrowOnError extends boolean = false>(options: Options<ToolListData, ThrowOnError>) {
    return (options.client ?? this._client).get<ToolListResponses, ToolListErrors, ThrowOnError>({
      url: "/experimental/tool",
      ...options,
    })
  }
}

class Instance extends _HeyApiClient {
  /**
   * Dispose the current instance
   */
  public dispose<ThrowOnError extends boolean = false>(options?: Options<InstanceDisposeData, ThrowOnError>) {
    return (options?.client ?? this._client).post<InstanceDisposeResponses, unknown, ThrowOnError>({
      url: "/instance/dispose",
      ...options,
    })
  }
}

class Path extends _HeyApiClient {
  /**
   * Get the current path
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<PathGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<PathGetResponses, unknown, ThrowOnError>({
      url: "/path",
      ...options,
    })
  }
}

class Vcs extends _HeyApiClient {
  /**
   * Get VCS info for the current instance
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<VcsGetData, ThrowOnError>) {
    return (options?.client ?? this._client).get<VcsGetResponses, unknown, ThrowOnError>({
      url: "/vcs",
      ...options,
    })
  }
}

class Session extends _HeyApiClient {
  /**
   * List all sessions
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<SessionListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionListResponses, unknown, ThrowOnError>({
      url: "/session",
      ...options,
    })
  }

  /**
   * Create a new session
   */
  public create<ThrowOnError extends boolean = false>(options?: Options<SessionCreateData, ThrowOnError>) {
    return (options?.client ?? this._client).post<SessionCreateResponses, SessionCreateErrors, ThrowOnError>({
      url: "/session",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Get session status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<SessionStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<SessionStatusResponses, SessionStatusErrors, ThrowOnError>({
      url: "/session/status",
      ...options,
    })
  }

  /**
   * Delete a session and all its data
   */
  public delete<ThrowOnError extends boolean = false>(options: Options<SessionDeleteData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * Get session
   */
  public get<ThrowOnError extends boolean = false>(options: Options<SessionGetData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionGetResponses, SessionGetErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
    })
  }

  /**
   * Update session properties
   */
  public update<ThrowOnError extends boolean = false>(options: Options<SessionUpdateData, ThrowOnError>) {
    return (options.client ?? this._client).patch<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError>({
      url: "/session/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Get a session's children
   */
  public children<ThrowOnError extends boolean = false>(options: Options<SessionChildrenData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError>({
      url: "/session/{id}/children",
      ...options,
    })
  }

  /**
   * Get the todo list for a session
   */
  public todo<ThrowOnError extends boolean = false>(options: Options<SessionTodoData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionTodoResponses, SessionTodoErrors, ThrowOnError>({
      url: "/session/{id}/todo",
      ...options,
    })
  }

  /**
   * Analyze the app and create an AGENTS.md file
   */
  public init<ThrowOnError extends boolean = false>(options: Options<SessionInitData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionInitResponses, SessionInitErrors, ThrowOnError>({
      url: "/session/{id}/init",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Fork an existing session at a specific message
   */
  public fork<ThrowOnError extends boolean = false>(options: Options<SessionForkData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionForkResponses, unknown, ThrowOnError>({
      url: "/session/{id}/fork",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Abort a session
   */
  public abort<ThrowOnError extends boolean = false>(options: Options<SessionAbortData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionAbortResponses, SessionAbortErrors, ThrowOnError>({
      url: "/session/{id}/abort",
      ...options,
    })
  }

  /**
   * Unshare the session
   */
  public unshare<ThrowOnError extends boolean = false>(options: Options<SessionUnshareData, ThrowOnError>) {
    return (options.client ?? this._client).delete<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * Share a session
   */
  public share<ThrowOnError extends boolean = false>(options: Options<SessionShareData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShareResponses, SessionShareErrors, ThrowOnError>({
      url: "/session/{id}/share",
      ...options,
    })
  }

  /**
   * Get the diff for this session
   */
  public diff<ThrowOnError extends boolean = false>(options: Options<SessionDiffData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionDiffResponses, SessionDiffErrors, ThrowOnError>({
      url: "/session/{id}/diff",
      ...options,
    })
  }

  /**
   * Summarize the session
   */
  public summarize<ThrowOnError extends boolean = false>(options: Options<SessionSummarizeData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError>({
      url: "/session/{id}/summarize",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * List messages for a session
   */
  public messages<ThrowOnError extends boolean = false>(options: Options<SessionMessagesData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
    })
  }

  /**
   * Create and send a new message to a session
   */
  public prompt<ThrowOnError extends boolean = false>(options: Options<SessionPromptData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptResponses, SessionPromptErrors, ThrowOnError>({
      url: "/session/{id}/message",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Get a message from a session
   */
  public message<ThrowOnError extends boolean = false>(options: Options<SessionMessageData, ThrowOnError>) {
    return (options.client ?? this._client).get<SessionMessageResponses, SessionMessageErrors, ThrowOnError>({
      url: "/session/{id}/message/{messageID}",
      ...options,
    })
  }

  /**
   * Create and send a new message to a session, start if needed and return immediately
   */
  public promptAsync<ThrowOnError extends boolean = false>(options: Options<SessionPromptAsyncData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError>({
      url: "/session/{id}/prompt_async",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Send a new command to a session
   */
  public command<ThrowOnError extends boolean = false>(options: Options<SessionCommandData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionCommandResponses, SessionCommandErrors, ThrowOnError>({
      url: "/session/{id}/command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Run a shell command
   */
  public shell<ThrowOnError extends boolean = false>(options: Options<SessionShellData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionShellResponses, SessionShellErrors, ThrowOnError>({
      url: "/session/{id}/shell",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Revert a message
   */
  public revert<ThrowOnError extends boolean = false>(options: Options<SessionRevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionRevertResponses, SessionRevertErrors, ThrowOnError>({
      url: "/session/{id}/revert",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Restore all reverted messages
   */
  public unrevert<ThrowOnError extends boolean = false>(options: Options<SessionUnrevertData, ThrowOnError>) {
    return (options.client ?? this._client).post<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError>({
      url: "/session/{id}/unrevert",
      ...options,
    })
  }
}

class Command extends _HeyApiClient {
  /**
   * List all commands
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<CommandListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<CommandListResponses, unknown, ThrowOnError>({
      url: "/command",
      ...options,
    })
  }
}

class Oauth extends _HeyApiClient {
  /**
   * Authorize a provider using OAuth
   */
  public authorize<ThrowOnError extends boolean = false>(options: Options<ProviderOauthAuthorizeData, ThrowOnError>) {
    return (options.client ?? this._client).post<
      ProviderOauthAuthorizeResponses,
      ProviderOauthAuthorizeErrors,
      ThrowOnError
    >({
      url: "/provider/{id}/oauth/authorize",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Handle OAuth callback for a provider
   */
  public callback<ThrowOnError extends boolean = false>(options: Options<ProviderOauthCallbackData, ThrowOnError>) {
    return (options.client ?? this._client).post<
      ProviderOauthCallbackResponses,
      ProviderOauthCallbackErrors,
      ThrowOnError
    >({
      url: "/provider/{id}/oauth/callback",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
}

class Provider extends _HeyApiClient {
  /**
   * List all providers
   */
  public list<ThrowOnError extends boolean = false>(options?: Options<ProviderListData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProviderListResponses, unknown, ThrowOnError>({
      url: "/provider",
      ...options,
    })
  }

  /**
   * Get provider authentication methods
   */
  public auth<ThrowOnError extends boolean = false>(options?: Options<ProviderAuthData, ThrowOnError>) {
    return (options?.client ?? this._client).get<ProviderAuthResponses, unknown, ThrowOnError>({
      url: "/provider/auth",
      ...options,
    })
  }
  oauth = new Oauth({ client: this._client })
}

class Find extends _HeyApiClient {
  /**
   * Find text in files
   */
  public text<ThrowOnError extends boolean = false>(options: Options<FindTextData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindTextResponses, unknown, ThrowOnError>({
      url: "/find",
      ...options,
    })
  }

  /**
   * Find files
   */
  public files<ThrowOnError extends boolean = false>(options: Options<FindFilesData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindFilesResponses, unknown, ThrowOnError>({
      url: "/find/file",
      ...options,
    })
  }

  /**
   * Find workspace symbols
   */
  public symbols<ThrowOnError extends boolean = false>(options: Options<FindSymbolsData, ThrowOnError>) {
    return (options.client ?? this._client).get<FindSymbolsResponses, unknown, ThrowOnError>({
      url: "/find/symbol",
      ...options,
    })
  }
}

class File extends _HeyApiClient {
  /**
   * List files and directories
   */
  public list<ThrowOnError extends boolean = false>(options: Options<FileListData, ThrowOnError>) {
    return (options.client ?? this._client).get<FileListResponses, unknown, ThrowOnError>({
      url: "/file",
      ...options,
    })
  }

  /**
   * Read a file
   */
  public read<ThrowOnError extends boolean = false>(options: Options<FileReadData, ThrowOnError>) {
    return (options.client ?? this._client).get<FileReadResponses, unknown, ThrowOnError>({
      url: "/file/content",
      ...options,
    })
  }

  /**
   * Get file status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<FileStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<FileStatusResponses, unknown, ThrowOnError>({
      url: "/file/status",
      ...options,
    })
  }
}

class App extends _HeyApiClient {
  /**
   * Write a log entry to the server logs
   */
  public log<ThrowOnError extends boolean = false>(options?: Options<AppLogData, ThrowOnError>) {
    return (options?.client ?? this._client).post<AppLogResponses, AppLogErrors, ThrowOnError>({
      url: "/log",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * List all agents
   */
  public agents<ThrowOnError extends boolean = false>(options?: Options<AppAgentsData, ThrowOnError>) {
    return (options?.client ?? this._client).get<AppAgentsResponses, unknown, ThrowOnError>({
      url: "/agent",
      ...options,
    })
  }
}

class Auth extends _HeyApiClient {
  /**
   * Remove OAuth credentials for an MCP server
   */
  public remove<ThrowOnError extends boolean = false>(options: Options<McpAuthRemoveData, ThrowOnError>) {
    return (options.client ?? this._client).delete<McpAuthRemoveResponses, McpAuthRemoveErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
    })
  }

  /**
   * Start OAuth authentication flow for an MCP server
   */
  public start<ThrowOnError extends boolean = false>(options: Options<McpAuthStartData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthStartResponses, McpAuthStartErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
    })
  }

  /**
   * Complete OAuth authentication with authorization code
   */
  public callback<ThrowOnError extends boolean = false>(options: Options<McpAuthCallbackData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthCallbackResponses, McpAuthCallbackErrors, ThrowOnError>({
      url: "/mcp/{name}/auth/callback",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }

  /**
   * Start OAuth flow and wait for callback (opens browser)
   */
  public authenticate<ThrowOnError extends boolean = false>(options: Options<McpAuthAuthenticateData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpAuthAuthenticateResponses, McpAuthAuthenticateErrors, ThrowOnError>(
      {
        url: "/mcp/{name}/auth/authenticate",
        ...options,
      },
    )
  }

  /**
   * Set authentication credentials
   */
  public set<ThrowOnError extends boolean = false>(options: Options<AuthSetData, ThrowOnError>) {
    return (options.client ?? this._client).put<AuthSetResponses, AuthSetErrors, ThrowOnError>({
      url: "/auth/{id}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
}

class Mcp extends _HeyApiClient {
  /**
   * Get MCP server status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<McpStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<McpStatusResponses, unknown, ThrowOnError>({
      url: "/mcp",
      ...options,
    })
  }

  /**
   * Add MCP server dynamically
   */
  public add<ThrowOnError extends boolean = false>(options?: Options<McpAddData, ThrowOnError>) {
    return (options?.client ?? this._client).post<McpAddResponses, McpAddErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Connect an MCP server
   */
  public connect<ThrowOnError extends boolean = false>(options: Options<McpConnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpConnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/connect",
      ...options,
    })
  }

  /**
   * Disconnect an MCP server
   */
  public disconnect<ThrowOnError extends boolean = false>(options: Options<McpDisconnectData, ThrowOnError>) {
    return (options.client ?? this._client).post<McpDisconnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/disconnect",
      ...options,
    })
  }

  auth = new Auth({ client: this._client })
}

class Lsp extends _HeyApiClient {
  /**
   * Get LSP server status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<LspStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<LspStatusResponses, unknown, ThrowOnError>({
      url: "/lsp",
      ...options,
    })
  }
}

class Formatter extends _HeyApiClient {
  /**
   * Get formatter status
   */
  public status<ThrowOnError extends boolean = false>(options?: Options<FormatterStatusData, ThrowOnError>) {
    return (options?.client ?? this._client).get<FormatterStatusResponses, unknown, ThrowOnError>({
      url: "/formatter",
      ...options,
    })
  }
}

class Control extends _HeyApiClient {
  /**
   * Get the next TUI request from the queue
   */
  public next<ThrowOnError extends boolean = false>(options?: Options<TuiControlNextData, ThrowOnError>) {
    return (options?.client ?? this._client).get<TuiControlNextResponses, unknown, ThrowOnError>({
      url: "/tui/control/next",
      ...options,
    })
  }

  /**
   * Submit a response to the TUI request queue
   */
  public response<ThrowOnError extends boolean = false>(options?: Options<TuiControlResponseData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiControlResponseResponses, unknown, ThrowOnError>({
      url: "/tui/control/response",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }
}

class Tui extends _HeyApiClient {
  /**
   * Append prompt to the TUI
   */
  public appendPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiAppendPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError>({
      url: "/tui/append-prompt",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Open the help dialog
   */
  public openHelp<ThrowOnError extends boolean = false>(options?: Options<TuiOpenHelpData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenHelpResponses, unknown, ThrowOnError>({
      url: "/tui/open-help",
      ...options,
    })
  }

  /**
   * Open the session dialog
   */
  public openSessions<ThrowOnError extends boolean = false>(options?: Options<TuiOpenSessionsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenSessionsResponses, unknown, ThrowOnError>({
      url: "/tui/open-sessions",
      ...options,
    })
  }

  /**
   * Open the theme dialog
   */
  public openThemes<ThrowOnError extends boolean = false>(options?: Options<TuiOpenThemesData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenThemesResponses, unknown, ThrowOnError>({
      url: "/tui/open-themes",
      ...options,
    })
  }

  /**
   * Open the model dialog
   */
  public openModels<ThrowOnError extends boolean = false>(options?: Options<TuiOpenModelsData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiOpenModelsResponses, unknown, ThrowOnError>({
      url: "/tui/open-models",
      ...options,
    })
  }

  /**
   * Submit the prompt
   */
  public submitPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiSubmitPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiSubmitPromptResponses, unknown, ThrowOnError>({
      url: "/tui/submit-prompt",
      ...options,
    })
  }

  /**
   * Clear the prompt
   */
  public clearPrompt<ThrowOnError extends boolean = false>(options?: Options<TuiClearPromptData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiClearPromptResponses, unknown, ThrowOnError>({
      url: "/tui/clear-prompt",
      ...options,
    })
  }

  /**
   * Execute a TUI command (e.g. agent_cycle)
   */
  public executeCommand<ThrowOnError extends boolean = false>(options?: Options<TuiExecuteCommandData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError>({
      url: "/tui/execute-command",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Show a toast notification in the TUI
   */
  public showToast<ThrowOnError extends boolean = false>(options?: Options<TuiShowToastData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiShowToastResponses, unknown, ThrowOnError>({
      url: "/tui/show-toast",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }

  /**
   * Publish a TUI event
   */
  public publish<ThrowOnError extends boolean = false>(options?: Options<TuiPublishData, ThrowOnError>) {
    return (options?.client ?? this._client).post<TuiPublishResponses, TuiPublishErrors, ThrowOnError>({
      url: "/tui/publish",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })
  }
  control = new Control({ client: this._client })
}

class Event extends _HeyApiClient {
  /**
   * Get events
   */
  public subscribe<ThrowOnError extends boolean = false>(options?: Options<EventSubscribeData, ThrowOnError>) {
    return (options?.client ?? this._client).get.sse<EventSubscribeResponses, unknown, ThrowOnError>({
      url: "/event",
      ...options,
    })
  }
}

export class OpencodeClient extends _HeyApiClient {
  /**
   * Respond to a permission request
   */
  public postSessionIdPermissionsPermissionId<ThrowOnError extends boolean = false>(
    options: Options<PostSessionIdPermissionsPermissionIdData, ThrowOnError>,
  ) {
    return (options.client ?? this._client).post<
      PostSessionIdPermissionsPermissionIdResponses,
      PostSessionIdPermissionsPermissionIdErrors,
      ThrowOnError
    >({
      url: "/session/{id}/permissions/{permissionID}",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })
  }
  global = new Global({ client: this._client })
  project = new Project({ client: this._client })
  pty = new Pty({ client: this._client })
  config = new Config({ client: this._client })
  tool = new Tool({ client: this._client })
  instance = new Instance({ client: this._client })
  path = new Path({ client: this._client })
  vcs = new Vcs({ client: this._client })
  session = new Session({ client: this._client })
  command = new Command({ client: this._client })
  provider = new Provider({ client: this._client })
  find = new Find({ client: this._client })
  file = new File({ client: this._client })
  app = new App({ client: this._client })
  mcp = new Mcp({ client: this._client })
  lsp = new Lsp({ client: this._client })
  formatter = new Formatter({ client: this._client })
  tui = new Tui({ client: this._client })
  auth = new Auth({ client: this._client })
  event = new Event({ client: this._client })
}
````

## File: packages/sdk/js/src/gen/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type EventServerInstanceDisposed = {
  type: "server.instance.disposed"
  properties: {
    directory: string
  }
}

export type EventInstallationUpdated = {
  type: "installation.updated"
  properties: {
    version: string
  }
}

export type EventInstallationUpdateAvailable = {
  type: "installation.update-available"
  properties: {
    version: string
  }
}

export type EventLspClientDiagnostics = {
  type: "lsp.client.diagnostics"
  properties: {
    serverID: string
    path: string
  }
}

export type EventLspUpdated = {
  type: "lsp.updated"
  properties: {
    [key: string]: unknown
  }
}

export type FileDiff = {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: {
    created: number
  }
  summary?: {
    title?: string
    body?: string
    diffs: Array<FileDiff>
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
  system?: string
  tools?: {
    [key: string]: boolean
  }
}

export type ProviderAuthError = {
  name: "ProviderAuthError"
  data: {
    providerID: string
    message: string
  }
}

export type UnknownError = {
  name: "UnknownError"
  data: {
    message: string
  }
}

export type MessageOutputLengthError = {
  name: "MessageOutputLengthError"
  data: {
    [key: string]: unknown
  }
}

export type MessageAbortedError = {
  name: "MessageAbortedError"
  data: {
    message: string
  }
}

export type ApiError = {
  name: "APIError"
  data: {
    message: string
    statusCode?: number
    isRetryable: boolean
    responseHeaders?: {
      [key: string]: string
    }
    responseBody?: string
  }
}

export type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number
  }
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  parentID: string
  modelID: string
  providerID: string
  mode: string
  path: {
    cwd: string
    root: string
  }
  summary?: boolean
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  finish?: string
}

export type Message = UserMessage | AssistantMessage

export type EventMessageUpdated = {
  type: "message.updated"
  properties: {
    info: Message
  }
}

export type EventMessageRemoved = {
  type: "message.removed"
  properties: {
    sessionID: string
    messageID: string
  }
}

export type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"
  text: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end?: number
  }
}

export type FilePartSourceText = {
  value: string
  start: number
  end: number
}

export type FileSource = {
  text: FilePartSourceText
  type: "file"
  path: string
}

export type Range = {
  start: {
    line: number
    character: number
  }
  end: {
    line: number
    character: number
  }
}

export type SymbolSource = {
  text: FilePartSourceText
  type: "symbol"
  path: string
  range: Range
  name: string
  kind: number
}

export type FilePartSource = FileSource | SymbolSource

export type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type ToolStatePending = {
  status: "pending"
  input: {
    [key: string]: unknown
  }
  raw: string
}

export type ToolStateRunning = {
  status: "running"
  input: {
    [key: string]: unknown
  }
  title?: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
  }
}

export type ToolStateCompleted = {
  status: "completed"
  input: {
    [key: string]: unknown
  }
  output: string
  title: string
  metadata: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
    compacted?: number
  }
  attachments?: Array<FilePart>
}

export type ToolStateError = {
  status: "error"
  input: {
    [key: string]: unknown
  }
  error: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
  }
}

export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError

export type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: "tool"
  callID: string
  tool: string
  state: ToolState
  metadata?: {
    [key: string]: unknown
  }
}

export type StepStartPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-start"
  snapshot?: string
}

export type StepFinishPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-finish"
  reason: string
  snapshot?: string
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}

export type SnapshotPart = {
  id: string
  sessionID: string
  messageID: string
  type: "snapshot"
  snapshot: string
}

export type PatchPart = {
  id: string
  sessionID: string
  messageID: string
  type: "patch"
  hash: string
  files: Array<string>
}

export type AgentPart = {
  id: string
  sessionID: string
  messageID: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type RetryPart = {
  id: string
  sessionID: string
  messageID: string
  type: "retry"
  attempt: number
  error: ApiError
  time: {
    created: number
  }
}

export type CompactionPart = {
  id: string
  sessionID: string
  messageID: string
  type: "compaction"
  auto: boolean
}

export type Part =
  | TextPart
  | {
      id: string
      sessionID: string
      messageID: string
      type: "subtask"
      prompt: string
      description: string
      agent: string
    }
  | ReasoningPart
  | FilePart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart

export type EventMessagePartUpdated = {
  type: "message.part.updated"
  properties: {
    part: Part
    delta?: string
  }
}

export type EventMessagePartRemoved = {
  type: "message.part.removed"
  properties: {
    sessionID: string
    messageID: string
    partID: string
  }
}

export type Permission = {
  id: string
  type: string
  pattern?: string | Array<string>
  sessionID: string
  messageID: string
  callID?: string
  title: string
  metadata: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
}

export type EventPermissionUpdated = {
  type: "permission.updated"
  properties: Permission
}

export type EventPermissionReplied = {
  type: "permission.replied"
  properties: {
    sessionID: string
    permissionID: string
    response: string
  }
}

export type SessionStatus =
  | {
      type: "idle"
    }
  | {
      type: "retry"
      attempt: number
      message: string
      next: number
    }
  | {
      type: "busy"
    }

export type EventSessionStatus = {
  type: "session.status"
  properties: {
    sessionID: string
    status: SessionStatus
  }
}

export type EventSessionIdle = {
  type: "session.idle"
  properties: {
    sessionID: string
  }
}

export type EventSessionCompacted = {
  type: "session.compacted"
  properties: {
    sessionID: string
  }
}

export type EventFileEdited = {
  type: "file.edited"
  properties: {
    file: string
  }
}

export type Todo = {
  /**
   * Brief description of the task
   */
  content: string
  /**
   * Current status of the task: pending, in_progress, completed, cancelled
   */
  status: string
  /**
   * Priority level of the task: high, medium, low
   */
  priority: string
  /**
   * Unique identifier for the todo item
   */
  id: string
}

export type EventTodoUpdated = {
  type: "todo.updated"
  properties: {
    sessionID: string
    todos: Array<Todo>
  }
}

export type EventCommandExecuted = {
  type: "command.executed"
  properties: {
    name: string
    sessionID: string
    arguments: string
    messageID: string
  }
}

export type Session = {
  id: string
  projectID: string
  directory: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: Array<FileDiff>
  }
  share?: {
    url: string
  }
  title: string
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
  }
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}

export type EventSessionCreated = {
  type: "session.created"
  properties: {
    info: Session
  }
}

export type EventSessionUpdated = {
  type: "session.updated"
  properties: {
    info: Session
  }
}

export type EventSessionDeleted = {
  type: "session.deleted"
  properties: {
    info: Session
  }
}

export type EventSessionDiff = {
  type: "session.diff"
  properties: {
    sessionID: string
    diff: Array<FileDiff>
  }
}

export type EventSessionError = {
  type: "session.error"
  properties: {
    sessionID?: string
    error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  }
}

export type EventFileWatcherUpdated = {
  type: "file.watcher.updated"
  properties: {
    file: string
    event: "add" | "change" | "unlink"
  }
}

export type EventVcsBranchUpdated = {
  type: "vcs.branch.updated"
  properties: {
    branch?: string
  }
}

export type EventTuiPromptAppend = {
  type: "tui.prompt.append"
  properties: {
    text: string
  }
}

export type EventTuiCommandExecute = {
  type: "tui.command.execute"
  properties: {
    command:
      | (
          | "session.list"
          | "session.new"
          | "session.share"
          | "session.interrupt"
          | "session.compact"
          | "session.page.up"
          | "session.page.down"
          | "session.half.page.up"
          | "session.half.page.down"
          | "session.first"
          | "session.last"
          | "prompt.clear"
          | "prompt.submit"
          | "agent.cycle"
        )
      | string
  }
}

export type EventTuiToastShow = {
  type: "tui.toast.show"
  properties: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    /**
     * Duration in milliseconds
     */
    duration?: number
  }
}

export type Pty = {
  id: string
  title: string
  command: string
  args: Array<string>
  cwd: string
  status: "running" | "exited"
  pid: number
}

export type EventPtyCreated = {
  type: "pty.created"
  properties: {
    info: Pty
  }
}

export type EventPtyUpdated = {
  type: "pty.updated"
  properties: {
    info: Pty
  }
}

export type EventPtyExited = {
  type: "pty.exited"
  properties: {
    id: string
    exitCode: number
  }
}

export type EventPtyDeleted = {
  type: "pty.deleted"
  properties: {
    id: string
  }
}

export type EventServerConnected = {
  type: "server.connected"
  properties: {
    [key: string]: unknown
  }
}

export type Event =
  | EventServerInstanceDisposed
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessageUpdated
  | EventMessageRemoved
  | EventMessagePartUpdated
  | EventMessagePartRemoved
  | EventPermissionUpdated
  | EventPermissionReplied
  | EventSessionStatus
  | EventSessionIdle
  | EventSessionCompacted
  | EventFileEdited
  | EventTodoUpdated
  | EventCommandExecuted
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionDiff
  | EventSessionError
  | EventFileWatcherUpdated
  | EventVcsBranchUpdated
  | EventTuiPromptAppend
  | EventTuiCommandExecute
  | EventTuiToastShow
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventServerConnected

export type GlobalEvent = {
  directory: string
  payload: Event
}

export type Project = {
  id: string
  worktree: string
  vcsDir?: string
  vcs?: "git"
  time: {
    created: number
    initialized?: number
  }
}

export type BadRequestError = {
  data: unknown
  errors: Array<{
    [key: string]: unknown
  }>
  success: false
}

export type NotFoundError = {
  name: "NotFoundError"
  data: {
    message: string
  }
}

/**
 * Custom keybind configurations
 */
export type KeybindsConfig = {
  /**
   * Leader key for keybind combinations
   */
  leader?: string
  /**
   * Exit the application
   */
  app_exit?: string
  /**
   * Open external editor
   */
  editor_open?: string
  /**
   * List available themes
   */
  theme_list?: string
  /**
   * Toggle sidebar
   */
  sidebar_toggle?: string
  /**
   * Toggle session scrollbar
   */
  scrollbar_toggle?: string
  /**
   * Toggle username visibility
   */
  username_toggle?: string
  /**
   * View status
   */
  status_view?: string
  /**
   * Export session to editor
   */
  session_export?: string
  /**
   * Create a new session
   */
  session_new?: string
  /**
   * List all sessions
   */
  session_list?: string
  /**
   * Show session timeline
   */
  session_timeline?: string
  /**
   * Share current session
   */
  session_share?: string
  /**
   * Unshare current session
   */
  session_unshare?: string
  /**
   * Interrupt current session
   */
  session_interrupt?: string
  /**
   * Compact the session
   */
  session_compact?: string
  /**
   * Scroll messages up by one page
   */
  messages_page_up?: string
  /**
   * Scroll messages down by one page
   */
  messages_page_down?: string
  /**
   * Scroll messages up by one line
   */
  messages_line_up?: string
  /**
   * Scroll messages down by one line
   */
  messages_line_down?: string
  /**
   * Scroll messages up by half page
   */
  messages_half_page_up?: string
  /**
   * Scroll messages down by half page
   */
  messages_half_page_down?: string
  /**
   * Navigate to first message
   */
  messages_first?: string
  /**
   * Navigate to last message
   */
  messages_last?: string
  /**
   * Navigate to next message
   */
  messages_next?: string
  /**
   * Navigate to previous message
   */
  messages_previous?: string
  /**
   * Navigate to last user message
   */
  messages_last_user?: string
  /**
   * Copy message
   */
  messages_copy?: string
  /**
   * Undo message
   */
  messages_undo?: string
  /**
   * Redo message
   */
  messages_redo?: string
  /**
   * Toggle code block concealment in messages
   */
  messages_toggle_conceal?: string
  /**
   * Toggle tool details visibility
   */
  tool_details?: string
  /**
   * List available models
   */
  model_list?: string
  /**
   * Next recently used model
   */
  model_cycle_recent?: string
  /**
   * Previous recently used model
   */
  model_cycle_recent_reverse?: string
  /**
   * List available commands
   */
  command_list?: string
  /**
   * List agents
   */
  agent_list?: string
  /**
   * Next agent
   */
  agent_cycle?: string
  /**
   * Previous agent
   */
  agent_cycle_reverse?: string
  /**
   * Clear input field
   */
  input_clear?: string
  /**
   * Forward delete
   */
  input_forward_delete?: string
  /**
   * Paste from clipboard
   */
  input_paste?: string
  /**
   * Submit input
   */
  input_submit?: string
  /**
   * Insert newline in input
   */
  input_newline?: string
  /**
   * Previous history item
   */
  history_previous?: string
  /**
   * Next history item
   */
  history_next?: string
  /**
   * Next child session
   */
  session_child_cycle?: string
  /**
   * Previous child session
   */
  session_child_cycle_reverse?: string
  /**
   * Suspend terminal
   */
  terminal_suspend?: string
  /**
   * Toggle terminal title
   */
  terminal_title_toggle?: string
}

export type AgentConfig = {
  model?: string
  temperature?: number
  top_p?: number
  prompt?: string
  tools?: {
    [key: string]: boolean
  }
  disable?: boolean
  /**
   * Description of when to use the agent
   */
  description?: string
  mode?: "subagent" | "primary" | "all"
  /**
   * Hex color code for the agent (e.g., #FF5733)
   */
  color?: string
  /**
   * Maximum number of agentic iterations before forcing text-only response
   */
  maxSteps?: number
  permission?: {
    edit?: "ask" | "allow" | "ask"
    bash?:
      | ("ask" | "allow" | "ask")
      | {
          [key: string]: "ask" | "allow" | "ask"
        }
    webfetch?: "ask" | "allow" | "ask"
    doom_loop?: "ask" | "allow" | "ask"
    external_directory?: "ask" | "allow" | "ask"
  }
  [key: string]:
    | unknown
    | string
    | number
    | {
        [key: string]: boolean
      }
    | boolean
    | ("subagent" | "primary" | "all")
    | number
    | {
        edit?: "ask" | "allow" | "ask"
        bash?:
          | ("ask" | "allow" | "ask")
          | {
              [key: string]: "ask" | "allow" | "ask"
            }
        webfetch?: "ask" | "allow" | "ask"
        doom_loop?: "ask" | "allow" | "ask"
        external_directory?: "ask" | "allow" | "ask"
      }
    | undefined
}

export type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>
  id?: string
  npm?: string
  models?: {
    [key: string]: {
      id?: string
      name?: string
      release_date?: string
      attachment?: boolean
      reasoning?: boolean
      temperature?: boolean
      tool_call?: boolean
      cost?: {
        input: number
        output: number
        cache_read?: number
        cache_write?: number
        context_over_200k?: {
          input: number
          output: number
          cache_read?: number
          cache_write?: number
        }
      }
      limit?: {
        context: number
        output: number
      }
      modalities?: {
        input: Array<"text" | "audio" | "image" | "video" | "pdf">
        output: Array<"text" | "audio" | "image" | "video" | "pdf">
      }
      experimental?: boolean
      status?: "alpha" | "beta" | "deprecated"
      options?: {
        [key: string]: unknown
      }
      headers?: {
        [key: string]: string
      }
      provider?: {
        npm: string
      }
    }
  }
  whitelist?: Array<string>
  blacklist?: Array<string>
  options?: {
    apiKey?: string
    baseURL?: string
    /**
     * GitHub Enterprise URL for copilot authentication
     */
    enterpriseUrl?: string
    /**
     * Enable promptCacheKey for this provider (default false)
     */
    setCacheKey?: boolean
    /**
     * Timeout in milliseconds for requests to this provider. Default is 300000 (5 minutes). Set to false to disable timeout.
     */
    timeout?: number | false
    [key: string]: unknown | string | boolean | (number | false) | undefined
  }
}

export type McpLocalConfig = {
  /**
   * Type of MCP server connection
   */
  type: "local"
  /**
   * Command and arguments to run the MCP server
   */
  command: Array<string>
  /**
   * Environment variables to set when running the MCP server
   */
  environment?: {
    [key: string]: string
  }
  /**
   * Enable or disable the MCP server on startup
   */
  enabled?: boolean
  /**
   * Timeout in ms for fetching tools from the MCP server. Defaults to 5000 (5 seconds) if not specified.
   */
  timeout?: number
}

export type McpOAuthConfig = {
  /**
   * OAuth client ID. If not provided, dynamic client registration (RFC 7591) will be attempted.
   */
  clientId?: string
  /**
   * OAuth client secret (if required by the authorization server)
   */
  clientSecret?: string
  /**
   * OAuth scopes to request during authorization
   */
  scope?: string
}

export type McpRemoteConfig = {
  /**
   * Type of MCP server connection
   */
  type: "remote"
  /**
   * URL of the remote MCP server
   */
  url: string
  /**
   * Enable or disable the MCP server on startup
   */
  enabled?: boolean
  /**
   * Headers to send with the request
   */
  headers?: {
    [key: string]: string
  }
  /**
   * OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection.
   */
  oauth?: McpOAuthConfig | false
  /**
   * Timeout in ms for fetching tools from the MCP server. Defaults to 5000 (5 seconds) if not specified.
   */
  timeout?: number
}

/**
 * @deprecated Always uses stretch layout.
 */
export type LayoutConfig = "auto" | "stretch"

export type Config = {
  /**
   * JSON schema reference for configuration validation
   */
  $schema?: string
  /**
   * Theme name to use for the interface
   */
  theme?: string
  keybinds?: KeybindsConfig
  /**
   * Log level
   */
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  /**
   * TUI specific settings
   */
  tui?: {
    /**
     * TUI scroll speed
     */
    scroll_speed?: number
    /**
     * Scroll acceleration settings
     */
    scroll_acceleration?: {
      /**
       * Enable scroll acceleration
       */
      enabled: boolean
    }
    /**
     * Control diff rendering style: 'auto' adapts to terminal width, 'stacked' always shows single column
     */
    diff_style?: "auto" | "stacked"
  }
  /**
   * Command configuration, see https://opencode.ai/docs/commands
   */
  command?: {
    [key: string]: {
      template: string
      description?: string
      agent?: string
      model?: string
      subtask?: boolean
    }
  }
  watcher?: {
    ignore?: Array<string>
  }
  plugin?: Array<string>
  snapshot?: boolean
  /**
   * Control sharing behavior:'manual' allows manual sharing via commands, 'auto' enables automatic sharing, 'disabled' disables all sharing
   */
  share?: "manual" | "auto" | "disabled"
  /**
   * @deprecated Use 'share' field instead. Share newly created sessions automatically
   */
  autoshare?: boolean
  /**
   * Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications
   */
  autoupdate?: boolean | "notify"
  /**
   * Disable providers that are loaded automatically
   */
  disabled_providers?: Array<string>
  /**
   * When set, ONLY these providers will be enabled. All other providers will be ignored
   */
  enabled_providers?: Array<string>
  /**
   * Model to use in the format of provider/model, eg anthropic/claude-2
   */
  model?: string
  /**
   * Small model to use for tasks like title generation in the format of provider/model
   */
  small_model?: string
  /**
   * Custom username to display in conversations instead of system username
   */
  username?: string
  /**
   * @deprecated Use `agent` field instead.
   */
  mode?: {
    build?: AgentConfig
    plan?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  /**
   * Agent configuration, see https://opencode.ai/docs/agent
   */
  agent?: {
    plan?: AgentConfig
    build?: AgentConfig
    general?: AgentConfig
    explore?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  /**
   * Custom provider configurations and model overrides
   */
  provider?: {
    [key: string]: ProviderConfig
  }
  /**
   * MCP (Model Context Protocol) server configurations
   */
  mcp?: {
    [key: string]: McpLocalConfig | McpRemoteConfig
  }
  formatter?:
    | false
    | {
        [key: string]: {
          disabled?: boolean
          command?: Array<string>
          environment?: {
            [key: string]: string
          }
          extensions?: Array<string>
        }
      }
  lsp?:
    | false
    | {
        [key: string]:
          | {
              disabled: true
            }
          | {
              command: Array<string>
              extensions?: Array<string>
              disabled?: boolean
              env?: {
                [key: string]: string
              }
              initialization?: {
                [key: string]: unknown
              }
            }
      }
  /**
   * Additional instruction files or patterns to include
   */
  instructions?: Array<string>
  layout?: LayoutConfig
  permission?: {
    edit?: "ask" | "allow" | "ask"
    bash?:
      | ("ask" | "allow" | "ask")
      | {
          [key: string]: "ask" | "allow" | "ask"
        }
    webfetch?: "ask" | "allow" | "ask"
    doom_loop?: "ask" | "allow" | "ask"
    external_directory?: "ask" | "allow" | "ask"
  }
  tools?: {
    [key: string]: boolean
  }
  enterprise?: {
    /**
     * Enterprise URL
     */
    url?: string
  }
  experimental?: {
    hook?: {
      file_edited?: {
        [key: string]: Array<{
          command: Array<string>
          environment?: {
            [key: string]: string
          }
        }>
      }
      session_completed?: Array<{
        command: Array<string>
        environment?: {
          [key: string]: string
        }
      }>
    }
    /**
     * Number of retries for chat completions on failure
     */
    chatMaxRetries?: number
    disable_paste_summary?: boolean
    /**
     * Enable the batch tool
     */
    batch_tool?: boolean
    /**
     * Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)
     */
    openTelemetry?: boolean
    /**
     * Tools that should only be available to primary agents.
     */
    primary_tools?: Array<string>
  }
}

export type ToolIds = Array<string>

export type ToolListItem = {
  id: string
  description: string
  parameters: unknown
}

export type ToolList = Array<ToolListItem>

export type Path = {
  state: string
  config: string
  worktree: string
  directory: string
}

export type VcsInfo = {
  branch: string
}

export type TextPartInput = {
  id?: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type FilePartInput = {
  id?: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type AgentPartInput = {
  id?: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type SubtaskPartInput = {
  id?: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
}

export type Command = {
  name: string
  description?: string
  agent?: string
  model?: string
  template: string
  subtask?: boolean
}

export type Model = {
  id: string
  providerID: string
  api: {
    id: string
    url: string
    npm: string
  }
  name: string
  capabilities: {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
    output: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
  }
  cost: {
    input: number
    output: number
    cache: {
      read: number
      write: number
    }
    experimentalOver200K?: {
      input: number
      output: number
      cache: {
        read: number
        write: number
      }
    }
  }
  limit: {
    context: number
    output: number
  }
  status: "alpha" | "beta" | "deprecated" | "active"
  options: {
    [key: string]: unknown
  }
  headers: {
    [key: string]: string
  }
}

export type Provider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: Array<string>
  key?: string
  options: {
    [key: string]: unknown
  }
  models: {
    [key: string]: Model
  }
}

export type ProviderAuthMethod = {
  type: "oauth" | "api"
  label: string
}

export type ProviderAuthAuthorization = {
  url: string
  method: "auto" | "code"
  instructions: string
}

export type Symbol = {
  name: string
  kind: number
  location: {
    uri: string
    range: Range
  }
}

export type FileNode = {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored: boolean
}

export type FileContent = {
  type: "text" | "binary"
  content: string
  diff?: string
  patch?: {
    oldFileName: string
    newFileName: string
    oldHeader?: string
    newHeader?: string
    hunks: Array<{
      oldStart: number
      oldLines: number
      newStart: number
      newLines: number
      lines: Array<string>
    }>
    index?: string
  }
  encoding?: "base64"
  mimeType?: string
}

export type File = {
  path: string
  added: number
  removed: number
  status: "added" | "deleted" | "modified"
}

export type Agent = {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  builtIn: boolean
  topP?: number
  temperature?: number
  color?: string
  permission: {
    edit: "ask" | "allow" | "ask"
    bash: {
      [key: string]: "ask" | "allow" | "ask"
    }
    webfetch?: "ask" | "allow" | "ask"
    doom_loop?: "ask" | "allow" | "ask"
    external_directory?: "ask" | "allow" | "ask"
  }
  model?: {
    modelID: string
    providerID: string
  }
  prompt?: string
  tools: {
    [key: string]: boolean
  }
  options: {
    [key: string]: unknown
  }
  maxSteps?: number
}

export type McpStatusConnected = {
  status: "connected"
}

export type McpStatusDisabled = {
  status: "disabled"
}

export type McpStatusFailed = {
  status: "failed"
  error: string
}

export type McpStatusNeedsAuth = {
  status: "needs_auth"
}

export type McpStatusNeedsClientRegistration = {
  status: "needs_client_registration"
  error: string
}

export type McpStatus =
  | McpStatusConnected
  | McpStatusDisabled
  | McpStatusFailed
  | McpStatusNeedsAuth
  | McpStatusNeedsClientRegistration

export type LspStatus = {
  id: string
  name: string
  root: string
  status: "connected" | "error"
}

export type FormatterStatus = {
  name: string
  extensions: Array<string>
  enabled: boolean
}

export type OAuth = {
  type: "oauth"
  refresh: string
  access: string
  expires: number
  enterpriseUrl?: string
}

export type ApiAuth = {
  type: "api"
  key: string
}

export type WellKnownAuth = {
  type: "wellknown"
  key: string
  token: string
}

export type Auth = OAuth | ApiAuth | WellKnownAuth

export type GlobalEventData = {
  body?: never
  path?: never
  query?: never
  url: "/global/event"
}

export type GlobalEventResponses = {
  /**
   * Event stream
   */
  200: GlobalEvent
}

export type GlobalEventResponse = GlobalEventResponses[keyof GlobalEventResponses]

export type ProjectListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/project"
}

export type ProjectListResponses = {
  /**
   * List of projects
   */
  200: Array<Project>
}

export type ProjectListResponse = ProjectListResponses[keyof ProjectListResponses]

export type ProjectCurrentData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/project/current"
}

export type ProjectCurrentResponses = {
  /**
   * Current project
   */
  200: Project
}

export type ProjectCurrentResponse = ProjectCurrentResponses[keyof ProjectCurrentResponses]

export type PtyListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/pty"
}

export type PtyListResponses = {
  /**
   * List of sessions
   */
  200: Array<Pty>
}

export type PtyListResponse = PtyListResponses[keyof PtyListResponses]

export type PtyCreateData = {
  body?: {
    command?: string
    args?: Array<string>
    cwd?: string
    title?: string
    env?: {
      [key: string]: string
    }
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/pty"
}

export type PtyCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type PtyCreateError = PtyCreateErrors[keyof PtyCreateErrors]

export type PtyCreateResponses = {
  /**
   * Created session
   */
  200: Pty
}

export type PtyCreateResponse = PtyCreateResponses[keyof PtyCreateResponses]

export type PtyRemoveData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyRemoveErrors = {
  /**
   * Not found
   */
  404: NotFoundError
}

export type PtyRemoveError = PtyRemoveErrors[keyof PtyRemoveErrors]

export type PtyRemoveResponses = {
  /**
   * Session removed
   */
  200: boolean
}

export type PtyRemoveResponse = PtyRemoveResponses[keyof PtyRemoveResponses]

export type PtyGetData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyGetErrors = {
  /**
   * Not found
   */
  404: NotFoundError
}

export type PtyGetError = PtyGetErrors[keyof PtyGetErrors]

export type PtyGetResponses = {
  /**
   * Session info
   */
  200: Pty
}

export type PtyGetResponse = PtyGetResponses[keyof PtyGetResponses]

export type PtyUpdateData = {
  body?: {
    title?: string
    size?: {
      rows: number
      cols: number
    }
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}"
}

export type PtyUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type PtyUpdateError = PtyUpdateErrors[keyof PtyUpdateErrors]

export type PtyUpdateResponses = {
  /**
   * Updated session
   */
  200: Pty
}

export type PtyUpdateResponse = PtyUpdateResponses[keyof PtyUpdateResponses]

export type PtyConnectData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/pty/{id}/connect"
}

export type PtyConnectErrors = {
  /**
   * Not found
   */
  404: NotFoundError
}

export type PtyConnectError = PtyConnectErrors[keyof PtyConnectErrors]

export type PtyConnectResponses = {
  /**
   * Connected session
   */
  200: boolean
}

export type PtyConnectResponse = PtyConnectResponses[keyof PtyConnectResponses]

export type ConfigGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/config"
}

export type ConfigGetResponses = {
  /**
   * Get config info
   */
  200: Config
}

export type ConfigGetResponse = ConfigGetResponses[keyof ConfigGetResponses]

export type ConfigUpdateData = {
  body?: Config
  path?: never
  query?: {
    directory?: string
  }
  url: "/config"
}

export type ConfigUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ConfigUpdateError = ConfigUpdateErrors[keyof ConfigUpdateErrors]

export type ConfigUpdateResponses = {
  /**
   * Successfully updated config
   */
  200: Config
}

export type ConfigUpdateResponse = ConfigUpdateResponses[keyof ConfigUpdateResponses]

export type ToolIdsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/experimental/tool/ids"
}

export type ToolIdsErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ToolIdsError = ToolIdsErrors[keyof ToolIdsErrors]

export type ToolIdsResponses = {
  /**
   * Tool IDs
   */
  200: ToolIds
}

export type ToolIdsResponse = ToolIdsResponses[keyof ToolIdsResponses]

export type ToolListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    provider: string
    model: string
  }
  url: "/experimental/tool"
}

export type ToolListErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ToolListError = ToolListErrors[keyof ToolListErrors]

export type ToolListResponses = {
  /**
   * Tools
   */
  200: ToolList
}

export type ToolListResponse = ToolListResponses[keyof ToolListResponses]

export type InstanceDisposeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/instance/dispose"
}

export type InstanceDisposeResponses = {
  /**
   * Instance disposed
   */
  200: boolean
}

export type InstanceDisposeResponse = InstanceDisposeResponses[keyof InstanceDisposeResponses]

export type PathGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/path"
}

export type PathGetResponses = {
  /**
   * Path
   */
  200: Path
}

export type PathGetResponse = PathGetResponses[keyof PathGetResponses]

export type VcsGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/vcs"
}

export type VcsGetResponses = {
  /**
   * VCS info
   */
  200: VcsInfo
}

export type VcsGetResponse = VcsGetResponses[keyof VcsGetResponses]

export type SessionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/session"
}

export type SessionListResponses = {
  /**
   * List of sessions
   */
  200: Array<Session>
}

export type SessionListResponse = SessionListResponses[keyof SessionListResponses]

export type SessionCreateData = {
  body?: {
    parentID?: string
    title?: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/session"
}

export type SessionCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SessionCreateError = SessionCreateErrors[keyof SessionCreateErrors]

export type SessionCreateResponses = {
  /**
   * Successfully created session
   */
  200: Session
}

export type SessionCreateResponse = SessionCreateResponses[keyof SessionCreateResponses]

export type SessionStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/session/status"
}

export type SessionStatusErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SessionStatusError = SessionStatusErrors[keyof SessionStatusErrors]

export type SessionStatusResponses = {
  /**
   * Get session status
   */
  200: {
    [key: string]: SessionStatus
  }
}

export type SessionStatusResponse = SessionStatusResponses[keyof SessionStatusResponses]

export type SessionDeleteData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionDeleteErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionDeleteError = SessionDeleteErrors[keyof SessionDeleteErrors]

export type SessionDeleteResponses = {
  /**
   * Successfully deleted session
   */
  200: boolean
}

export type SessionDeleteResponse = SessionDeleteResponses[keyof SessionDeleteResponses]

export type SessionGetData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionGetErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionGetError = SessionGetErrors[keyof SessionGetErrors]

export type SessionGetResponses = {
  /**
   * Get session
   */
  200: Session
}

export type SessionGetResponse = SessionGetResponses[keyof SessionGetResponses]

export type SessionUpdateData = {
  body?: {
    title?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}"
}

export type SessionUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionUpdateError = SessionUpdateErrors[keyof SessionUpdateErrors]

export type SessionUpdateResponses = {
  /**
   * Successfully updated session
   */
  200: Session
}

export type SessionUpdateResponse = SessionUpdateResponses[keyof SessionUpdateResponses]

export type SessionChildrenData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/children"
}

export type SessionChildrenErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionChildrenError = SessionChildrenErrors[keyof SessionChildrenErrors]

export type SessionChildrenResponses = {
  /**
   * List of children
   */
  200: Array<Session>
}

export type SessionChildrenResponse = SessionChildrenResponses[keyof SessionChildrenResponses]

export type SessionTodoData = {
  body?: never
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/todo"
}

export type SessionTodoErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionTodoError = SessionTodoErrors[keyof SessionTodoErrors]

export type SessionTodoResponses = {
  /**
   * Todo list
   */
  200: Array<Todo>
}

export type SessionTodoResponse = SessionTodoResponses[keyof SessionTodoResponses]

export type SessionInitData = {
  body?: {
    modelID: string
    providerID: string
    messageID: string
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/init"
}

export type SessionInitErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionInitError = SessionInitErrors[keyof SessionInitErrors]

export type SessionInitResponses = {
  /**
   * 200
   */
  200: boolean
}

export type SessionInitResponse = SessionInitResponses[keyof SessionInitResponses]

export type SessionForkData = {
  body?: {
    messageID?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/fork"
}

export type SessionForkResponses = {
  /**
   * 200
   */
  200: Session
}

export type SessionForkResponse = SessionForkResponses[keyof SessionForkResponses]

export type SessionAbortData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/abort"
}

export type SessionAbortErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionAbortError = SessionAbortErrors[keyof SessionAbortErrors]

export type SessionAbortResponses = {
  /**
   * Aborted session
   */
  200: boolean
}

export type SessionAbortResponse = SessionAbortResponses[keyof SessionAbortResponses]

export type SessionUnshareData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/share"
}

export type SessionUnshareErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionUnshareError = SessionUnshareErrors[keyof SessionUnshareErrors]

export type SessionUnshareResponses = {
  /**
   * Successfully unshared session
   */
  200: Session
}

export type SessionUnshareResponse = SessionUnshareResponses[keyof SessionUnshareResponses]

export type SessionShareData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/share"
}

export type SessionShareErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionShareError = SessionShareErrors[keyof SessionShareErrors]

export type SessionShareResponses = {
  /**
   * Successfully shared session
   */
  200: Session
}

export type SessionShareResponse = SessionShareResponses[keyof SessionShareResponses]

export type SessionDiffData = {
  body?: never
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
    messageID?: string
  }
  url: "/session/{id}/diff"
}

export type SessionDiffErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionDiffError = SessionDiffErrors[keyof SessionDiffErrors]

export type SessionDiffResponses = {
  /**
   * List of diffs
   */
  200: Array<FileDiff>
}

export type SessionDiffResponse = SessionDiffResponses[keyof SessionDiffResponses]

export type SessionSummarizeData = {
  body?: {
    providerID: string
    modelID: string
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/summarize"
}

export type SessionSummarizeErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionSummarizeError = SessionSummarizeErrors[keyof SessionSummarizeErrors]

export type SessionSummarizeResponses = {
  /**
   * Summarized session
   */
  200: boolean
}

export type SessionSummarizeResponse = SessionSummarizeResponses[keyof SessionSummarizeResponses]

export type SessionMessagesData = {
  body?: never
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
    limit?: number
  }
  url: "/session/{id}/message"
}

export type SessionMessagesErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionMessagesError = SessionMessagesErrors[keyof SessionMessagesErrors]

export type SessionMessagesResponses = {
  /**
   * List of messages
   */
  200: Array<{
    info: Message
    parts: Array<Part>
  }>
}

export type SessionMessagesResponse = SessionMessagesResponses[keyof SessionMessagesResponses]

export type SessionPromptData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    system?: string
    tools?: {
      [key: string]: boolean
    }
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/message"
}

export type SessionPromptErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionPromptError = SessionPromptErrors[keyof SessionPromptErrors]

export type SessionPromptResponses = {
  /**
   * Created message
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionPromptResponse = SessionPromptResponses[keyof SessionPromptResponses]

export type SessionMessageData = {
  body?: never
  path: {
    /**
     * Session ID
     */
    id: string
    /**
     * Message ID
     */
    messageID: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/message/{messageID}"
}

export type SessionMessageErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionMessageError = SessionMessageErrors[keyof SessionMessageErrors]

export type SessionMessageResponses = {
  /**
   * Message
   */
  200: {
    info: Message
    parts: Array<Part>
  }
}

export type SessionMessageResponse = SessionMessageResponses[keyof SessionMessageResponses]

export type SessionPromptAsyncData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    system?: string
    tools?: {
      [key: string]: boolean
    }
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/prompt_async"
}

export type SessionPromptAsyncErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionPromptAsyncError = SessionPromptAsyncErrors[keyof SessionPromptAsyncErrors]

export type SessionPromptAsyncResponses = {
  /**
   * Prompt accepted
   */
  204: void
}

export type SessionPromptAsyncResponse = SessionPromptAsyncResponses[keyof SessionPromptAsyncResponses]

export type SessionCommandData = {
  body?: {
    messageID?: string
    agent?: string
    model?: string
    arguments: string
    command: string
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/command"
}

export type SessionCommandErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionCommandError = SessionCommandErrors[keyof SessionCommandErrors]

export type SessionCommandResponses = {
  /**
   * Created message
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionCommandResponse = SessionCommandResponses[keyof SessionCommandResponses]

export type SessionShellData = {
  body?: {
    agent: string
    model?: {
      providerID: string
      modelID: string
    }
    command: string
  }
  path: {
    /**
     * Session ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/shell"
}

export type SessionShellErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionShellError = SessionShellErrors[keyof SessionShellErrors]

export type SessionShellResponses = {
  /**
   * Created message
   */
  200: AssistantMessage
}

export type SessionShellResponse = SessionShellResponses[keyof SessionShellResponses]

export type SessionRevertData = {
  body?: {
    messageID: string
    partID?: string
  }
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/revert"
}

export type SessionRevertErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionRevertError = SessionRevertErrors[keyof SessionRevertErrors]

export type SessionRevertResponses = {
  /**
   * Updated session
   */
  200: Session
}

export type SessionRevertResponse = SessionRevertResponses[keyof SessionRevertResponses]

export type SessionUnrevertData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/unrevert"
}

export type SessionUnrevertErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionUnrevertError = SessionUnrevertErrors[keyof SessionUnrevertErrors]

export type SessionUnrevertResponses = {
  /**
   * Updated session
   */
  200: Session
}

export type SessionUnrevertResponse = SessionUnrevertResponses[keyof SessionUnrevertResponses]

export type PostSessionIdPermissionsPermissionIdData = {
  body?: {
    response: "once" | "always" | "reject"
  }
  path: {
    id: string
    permissionID: string
  }
  query?: {
    directory?: string
  }
  url: "/session/{id}/permissions/{permissionID}"
}

export type PostSessionIdPermissionsPermissionIdErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type PostSessionIdPermissionsPermissionIdError =
  PostSessionIdPermissionsPermissionIdErrors[keyof PostSessionIdPermissionsPermissionIdErrors]

export type PostSessionIdPermissionsPermissionIdResponses = {
  /**
   * Permission processed successfully
   */
  200: boolean
}

export type PostSessionIdPermissionsPermissionIdResponse =
  PostSessionIdPermissionsPermissionIdResponses[keyof PostSessionIdPermissionsPermissionIdResponses]

export type CommandListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/command"
}

export type CommandListResponses = {
  /**
   * List of commands
   */
  200: Array<Command>
}

export type CommandListResponse = CommandListResponses[keyof CommandListResponses]

export type ConfigProvidersData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/config/providers"
}

export type ConfigProvidersResponses = {
  /**
   * List of providers
   */
  200: {
    providers: Array<Provider>
    default: {
      [key: string]: string
    }
  }
}

export type ConfigProvidersResponse = ConfigProvidersResponses[keyof ConfigProvidersResponses]

export type ProviderListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/provider"
}

export type ProviderListResponses = {
  /**
   * List of providers
   */
  200: {
    all: Array<{
      api?: string
      name: string
      env: Array<string>
      id: string
      npm?: string
      models: {
        [key: string]: {
          id: string
          name: string
          release_date: string
          attachment: boolean
          reasoning: boolean
          temperature: boolean
          tool_call: boolean
          cost?: {
            input: number
            output: number
            cache_read?: number
            cache_write?: number
            context_over_200k?: {
              input: number
              output: number
              cache_read?: number
              cache_write?: number
            }
          }
          limit: {
            context: number
            output: number
          }
          modalities?: {
            input: Array<"text" | "audio" | "image" | "video" | "pdf">
            output: Array<"text" | "audio" | "image" | "video" | "pdf">
          }
          experimental?: boolean
          status?: "alpha" | "beta" | "deprecated"
          options: {
            [key: string]: unknown
          }
          headers?: {
            [key: string]: string
          }
          provider?: {
            npm: string
          }
        }
      }
    }>
    default: {
      [key: string]: string
    }
    connected: Array<string>
  }
}

export type ProviderListResponse = ProviderListResponses[keyof ProviderListResponses]

export type ProviderAuthData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/provider/auth"
}

export type ProviderAuthResponses = {
  /**
   * Provider auth methods
   */
  200: {
    [key: string]: Array<ProviderAuthMethod>
  }
}

export type ProviderAuthResponse = ProviderAuthResponses[keyof ProviderAuthResponses]

export type ProviderOauthAuthorizeData = {
  body?: {
    /**
     * Auth method index
     */
    method: number
  }
  path: {
    /**
     * Provider ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/provider/{id}/oauth/authorize"
}

export type ProviderOauthAuthorizeErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ProviderOauthAuthorizeError = ProviderOauthAuthorizeErrors[keyof ProviderOauthAuthorizeErrors]

export type ProviderOauthAuthorizeResponses = {
  /**
   * Authorization URL and method
   */
  200: ProviderAuthAuthorization
}

export type ProviderOauthAuthorizeResponse = ProviderOauthAuthorizeResponses[keyof ProviderOauthAuthorizeResponses]

export type ProviderOauthCallbackData = {
  body?: {
    /**
     * Auth method index
     */
    method: number
    /**
     * OAuth authorization code
     */
    code?: string
  }
  path: {
    /**
     * Provider ID
     */
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/provider/{id}/oauth/callback"
}

export type ProviderOauthCallbackErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ProviderOauthCallbackError = ProviderOauthCallbackErrors[keyof ProviderOauthCallbackErrors]

export type ProviderOauthCallbackResponses = {
  /**
   * OAuth callback processed successfully
   */
  200: boolean
}

export type ProviderOauthCallbackResponse = ProviderOauthCallbackResponses[keyof ProviderOauthCallbackResponses]

export type FindTextData = {
  body?: never
  path?: never
  query: {
    directory?: string
    pattern: string
  }
  url: "/find"
}

export type FindTextResponses = {
  /**
   * Matches
   */
  200: Array<{
    path: {
      text: string
    }
    lines: {
      text: string
    }
    line_number: number
    absolute_offset: number
    submatches: Array<{
      match: {
        text: string
      }
      start: number
      end: number
    }>
  }>
}

export type FindTextResponse = FindTextResponses[keyof FindTextResponses]

export type FindFilesData = {
  body?: never
  path?: never
  query: {
    directory?: string
    query: string
    dirs?: "true" | "false"
  }
  url: "/find/file"
}

export type FindFilesResponses = {
  /**
   * File paths
   */
  200: Array<string>
}

export type FindFilesResponse = FindFilesResponses[keyof FindFilesResponses]

export type FindSymbolsData = {
  body?: never
  path?: never
  query: {
    directory?: string
    query: string
  }
  url: "/find/symbol"
}

export type FindSymbolsResponses = {
  /**
   * Symbols
   */
  200: Array<Symbol>
}

export type FindSymbolsResponse = FindSymbolsResponses[keyof FindSymbolsResponses]

export type FileListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    path: string
  }
  url: "/file"
}

export type FileListResponses = {
  /**
   * Files and directories
   */
  200: Array<FileNode>
}

export type FileListResponse = FileListResponses[keyof FileListResponses]

export type FileReadData = {
  body?: never
  path?: never
  query: {
    directory?: string
    path: string
  }
  url: "/file/content"
}

export type FileReadResponses = {
  /**
   * File content
   */
  200: FileContent
}

export type FileReadResponse = FileReadResponses[keyof FileReadResponses]

export type FileStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/file/status"
}

export type FileStatusResponses = {
  /**
   * File status
   */
  200: Array<File>
}

export type FileStatusResponse = FileStatusResponses[keyof FileStatusResponses]

export type AppLogData = {
  body?: {
    /**
     * Service name for the log entry
     */
    service: string
    /**
     * Log level
     */
    level: "debug" | "info" | "error" | "warn"
    /**
     * Log message
     */
    message: string
    /**
     * Additional metadata for the log entry
     */
    extra?: {
      [key: string]: unknown
    }
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/log"
}

export type AppLogErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type AppLogError = AppLogErrors[keyof AppLogErrors]

export type AppLogResponses = {
  /**
   * Log entry written successfully
   */
  200: boolean
}

export type AppLogResponse = AppLogResponses[keyof AppLogResponses]

export type AppAgentsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/agent"
}

export type AppAgentsResponses = {
  /**
   * List of agents
   */
  200: Array<Agent>
}

export type AppAgentsResponse = AppAgentsResponses[keyof AppAgentsResponses]

export type McpStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/mcp"
}

export type McpStatusResponses = {
  /**
   * MCP server status
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpStatusResponse = McpStatusResponses[keyof McpStatusResponses]

export type McpAddData = {
  body?: {
    name: string
    config: McpLocalConfig | McpRemoteConfig
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/mcp"
}

export type McpAddErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type McpAddError = McpAddErrors[keyof McpAddErrors]

export type McpAddResponses = {
  /**
   * MCP server added successfully
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpAddResponse = McpAddResponses[keyof McpAddResponses]

export type McpAuthRemoveData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthRemoveErrors = {
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthRemoveError = McpAuthRemoveErrors[keyof McpAuthRemoveErrors]

export type McpAuthRemoveResponses = {
  /**
   * OAuth credentials removed
   */
  200: {
    success: true
  }
}

export type McpAuthRemoveResponse = McpAuthRemoveResponses[keyof McpAuthRemoveResponses]

export type McpAuthStartData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthStartErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthStartError = McpAuthStartErrors[keyof McpAuthStartErrors]

export type McpAuthStartResponses = {
  /**
   * OAuth flow started
   */
  200: {
    /**
     * URL to open in browser for authorization
     */
    authorizationUrl: string
  }
}

export type McpAuthStartResponse = McpAuthStartResponses[keyof McpAuthStartResponses]

export type McpAuthCallbackData = {
  body?: {
    /**
     * Authorization code from OAuth callback
     */
    code: string
  }
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth/callback"
}

export type McpAuthCallbackErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthCallbackError = McpAuthCallbackErrors[keyof McpAuthCallbackErrors]

export type McpAuthCallbackResponses = {
  /**
   * OAuth authentication completed
   */
  200: McpStatus
}

export type McpAuthCallbackResponse = McpAuthCallbackResponses[keyof McpAuthCallbackResponses]

export type McpAuthAuthenticateData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/auth/authenticate"
}

export type McpAuthAuthenticateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthAuthenticateError = McpAuthAuthenticateErrors[keyof McpAuthAuthenticateErrors]

export type McpAuthAuthenticateResponses = {
  /**
   * OAuth authentication completed
   */
  200: McpStatus
}

export type McpAuthAuthenticateResponse = McpAuthAuthenticateResponses[keyof McpAuthAuthenticateResponses]

export type McpConnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/connect"
}

export type McpConnectResponses = {
  /**
   * MCP server connected successfully
   */
  200: boolean
}

export type McpConnectResponse = McpConnectResponses[keyof McpConnectResponses]

export type McpDisconnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
  }
  url: "/mcp/{name}/disconnect"
}

export type McpDisconnectResponses = {
  /**
   * MCP server disconnected successfully
   */
  200: boolean
}

export type McpDisconnectResponse = McpDisconnectResponses[keyof McpDisconnectResponses]

export type LspStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/lsp"
}

export type LspStatusResponses = {
  /**
   * LSP server status
   */
  200: Array<LspStatus>
}

export type LspStatusResponse = LspStatusResponses[keyof LspStatusResponses]

export type FormatterStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/formatter"
}

export type FormatterStatusResponses = {
  /**
   * Formatter status
   */
  200: Array<FormatterStatus>
}

export type FormatterStatusResponse = FormatterStatusResponses[keyof FormatterStatusResponses]

export type TuiAppendPromptData = {
  body?: {
    text: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/append-prompt"
}

export type TuiAppendPromptErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiAppendPromptError = TuiAppendPromptErrors[keyof TuiAppendPromptErrors]

export type TuiAppendPromptResponses = {
  /**
   * Prompt processed successfully
   */
  200: boolean
}

export type TuiAppendPromptResponse = TuiAppendPromptResponses[keyof TuiAppendPromptResponses]

export type TuiOpenHelpData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-help"
}

export type TuiOpenHelpResponses = {
  /**
   * Help dialog opened successfully
   */
  200: boolean
}

export type TuiOpenHelpResponse = TuiOpenHelpResponses[keyof TuiOpenHelpResponses]

export type TuiOpenSessionsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-sessions"
}

export type TuiOpenSessionsResponses = {
  /**
   * Session dialog opened successfully
   */
  200: boolean
}

export type TuiOpenSessionsResponse = TuiOpenSessionsResponses[keyof TuiOpenSessionsResponses]

export type TuiOpenThemesData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-themes"
}

export type TuiOpenThemesResponses = {
  /**
   * Theme dialog opened successfully
   */
  200: boolean
}

export type TuiOpenThemesResponse = TuiOpenThemesResponses[keyof TuiOpenThemesResponses]

export type TuiOpenModelsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/open-models"
}

export type TuiOpenModelsResponses = {
  /**
   * Model dialog opened successfully
   */
  200: boolean
}

export type TuiOpenModelsResponse = TuiOpenModelsResponses[keyof TuiOpenModelsResponses]

export type TuiSubmitPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/submit-prompt"
}

export type TuiSubmitPromptResponses = {
  /**
   * Prompt submitted successfully
   */
  200: boolean
}

export type TuiSubmitPromptResponse = TuiSubmitPromptResponses[keyof TuiSubmitPromptResponses]

export type TuiClearPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/clear-prompt"
}

export type TuiClearPromptResponses = {
  /**
   * Prompt cleared successfully
   */
  200: boolean
}

export type TuiClearPromptResponse = TuiClearPromptResponses[keyof TuiClearPromptResponses]

export type TuiExecuteCommandData = {
  body?: {
    command: string
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/execute-command"
}

export type TuiExecuteCommandErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiExecuteCommandError = TuiExecuteCommandErrors[keyof TuiExecuteCommandErrors]

export type TuiExecuteCommandResponses = {
  /**
   * Command executed successfully
   */
  200: boolean
}

export type TuiExecuteCommandResponse = TuiExecuteCommandResponses[keyof TuiExecuteCommandResponses]

export type TuiShowToastData = {
  body?: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    /**
     * Duration in milliseconds
     */
    duration?: number
  }
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/show-toast"
}

export type TuiShowToastResponses = {
  /**
   * Toast notification shown successfully
   */
  200: boolean
}

export type TuiShowToastResponse = TuiShowToastResponses[keyof TuiShowToastResponses]

export type TuiPublishData = {
  body?: EventTuiPromptAppend | EventTuiCommandExecute | EventTuiToastShow
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/publish"
}

export type TuiPublishErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiPublishError = TuiPublishErrors[keyof TuiPublishErrors]

export type TuiPublishResponses = {
  /**
   * Event published successfully
   */
  200: boolean
}

export type TuiPublishResponse = TuiPublishResponses[keyof TuiPublishResponses]

export type TuiControlNextData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/control/next"
}

export type TuiControlNextResponses = {
  /**
   * Next TUI request
   */
  200: {
    path: string
    body: unknown
  }
}

export type TuiControlNextResponse = TuiControlNextResponses[keyof TuiControlNextResponses]

export type TuiControlResponseData = {
  body?: unknown
  path?: never
  query?: {
    directory?: string
  }
  url: "/tui/control/response"
}

export type TuiControlResponseResponses = {
  /**
   * Response submitted successfully
   */
  200: boolean
}

export type TuiControlResponseResponse = TuiControlResponseResponses[keyof TuiControlResponseResponses]

export type AuthSetData = {
  body?: Auth
  path: {
    id: string
  }
  query?: {
    directory?: string
  }
  url: "/auth/{id}"
}

export type AuthSetErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type AuthSetError = AuthSetErrors[keyof AuthSetErrors]

export type AuthSetResponses = {
  /**
   * Successfully set authentication credentials
   */
  200: boolean
}

export type AuthSetResponse = AuthSetResponses[keyof AuthSetResponses]

export type EventSubscribeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
  }
  url: "/event"
}

export type EventSubscribeResponses = {
  /**
   * Event stream
   */
  200: Event
}

export type EventSubscribeResponse = EventSubscribeResponses[keyof EventSubscribeResponses]

export type ClientOptions = {
  baseUrl: `${string}://${string}` | (string & {})
}
````

## File: packages/sdk/js/src/v2/gen/client/client.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { createSseClient } from "../core/serverSentEvents.gen.js"
import type { HttpMethod } from "../core/types.gen.js"
import { getValidRequestBody } from "../core/utils.gen.js"
import type { Client, Config, RequestOptions, ResolvedRequestOptions } from "./types.gen.js"
import {
  buildUrl,
  createConfig,
  createInterceptors,
  getParseAs,
  mergeConfigs,
  mergeHeaders,
  setAuthParams,
} from "./utils.gen.js"

type ReqInit = Omit<RequestInit, "body" | "headers"> & {
  body?: any
  headers: ReturnType<typeof mergeHeaders>
}

export const createClient = (config: Config = {}): Client => {
  let _config = mergeConfigs(createConfig(), config)

  const getConfig = (): Config => ({ ..._config })

  const setConfig = (config: Config): Config => {
    _config = mergeConfigs(_config, config)
    return getConfig()
  }

  const interceptors = createInterceptors<Request, Response, unknown, ResolvedRequestOptions>()

  const beforeRequest = async (options: RequestOptions) => {
    const opts = {
      ..._config,
      ...options,
      fetch: options.fetch ?? _config.fetch ?? globalThis.fetch,
      headers: mergeHeaders(_config.headers, options.headers),
      serializedBody: undefined,
    }

    if (opts.security) {
      await setAuthParams({
        ...opts,
        security: opts.security,
      })
    }

    if (opts.requestValidator) {
      await opts.requestValidator(opts)
    }

    if (opts.body !== undefined && opts.bodySerializer) {
      opts.serializedBody = opts.bodySerializer(opts.body)
    }

    // remove Content-Type header if body is empty to avoid sending invalid requests
    if (opts.body === undefined || opts.serializedBody === "") {
      opts.headers.delete("Content-Type")
    }

    const url = buildUrl(opts)

    return { opts, url }
  }

  const request: Client["request"] = async (options) => {
    // @ts-expect-error
    const { opts, url } = await beforeRequest(options)
    const requestInit: ReqInit = {
      redirect: "follow",
      ...opts,
      body: getValidRequestBody(opts),
    }

    let request = new Request(url, requestInit)

    for (const fn of interceptors.request.fns) {
      if (fn) {
        request = await fn(request, opts)
      }
    }

    // fetch must be assigned here, otherwise it would throw the error:
    // TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation
    const _fetch = opts.fetch!
    let response: Response

    try {
      response = await _fetch(request)
    } catch (error) {
      // Handle fetch exceptions (AbortError, network errors, etc.)
      let finalError = error

      for (const fn of interceptors.error.fns) {
        if (fn) {
          finalError = (await fn(error, undefined as any, request, opts)) as unknown
        }
      }

      finalError = finalError || ({} as unknown)

      if (opts.throwOnError) {
        throw finalError
      }

      // Return error response
      return opts.responseStyle === "data"
        ? undefined
        : {
            error: finalError,
            request,
            response: undefined as any,
          }
    }

    for (const fn of interceptors.response.fns) {
      if (fn) {
        response = await fn(response, request, opts)
      }
    }

    const result = {
      request,
      response,
    }

    if (response.ok) {
      const parseAs =
        (opts.parseAs === "auto" ? getParseAs(response.headers.get("Content-Type")) : opts.parseAs) ?? "json"

      if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        let emptyData: any
        switch (parseAs) {
          case "arrayBuffer":
          case "blob":
          case "text":
            emptyData = await response[parseAs]()
            break
          case "formData":
            emptyData = new FormData()
            break
          case "stream":
            emptyData = response.body
            break
          case "json":
          default:
            emptyData = {}
            break
        }
        return opts.responseStyle === "data"
          ? emptyData
          : {
              data: emptyData,
              ...result,
            }
      }

      let data: any
      switch (parseAs) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "text":
          data = await response[parseAs]()
          break
        case "json": {
          // Some servers return 200 with no Content-Length and empty body.
          // response.json() would throw; read as text and parse if non-empty.
          const text = await response.text()
          data = text ? JSON.parse(text) : {}
          break
        }
        case "stream":
          return opts.responseStyle === "data"
            ? response.body
            : {
                data: response.body,
                ...result,
              }
      }

      if (parseAs === "json") {
        if (opts.responseValidator) {
          await opts.responseValidator(data)
        }

        if (opts.responseTransformer) {
          data = await opts.responseTransformer(data)
        }
      }

      return opts.responseStyle === "data"
        ? data
        : {
            data,
            ...result,
          }
    }

    const textError = await response.text()
    let jsonError: unknown

    try {
      jsonError = JSON.parse(textError)
    } catch {
      // noop
    }

    const error = jsonError ?? textError
    let finalError = error

    for (const fn of interceptors.error.fns) {
      if (fn) {
        finalError = (await fn(error, response, request, opts)) as string
      }
    }

    finalError = finalError || ({} as string)

    if (opts.throwOnError) {
      throw finalError
    }

    // TODO: we probably want to return error and improve types
    return opts.responseStyle === "data"
      ? undefined
      : {
          error: finalError,
          ...result,
        }
  }

  const makeMethodFn = (method: Uppercase<HttpMethod>) => (options: RequestOptions) => request({ ...options, method })

  const makeSseFn = (method: Uppercase<HttpMethod>) => async (options: RequestOptions) => {
    const { opts, url } = await beforeRequest(options)
    return createSseClient({
      ...opts,
      body: opts.body as BodyInit | null | undefined,
      headers: opts.headers as unknown as Record<string, string>,
      method,
      onRequest: async (url, init) => {
        let request = new Request(url, init)
        for (const fn of interceptors.request.fns) {
          if (fn) {
            request = await fn(request, opts)
          }
        }
        return request
      },
      serializedBody: getValidRequestBody(opts) as BodyInit | null | undefined,
      url,
    })
  }

  return {
    buildUrl,
    connect: makeMethodFn("CONNECT"),
    delete: makeMethodFn("DELETE"),
    get: makeMethodFn("GET"),
    getConfig,
    head: makeMethodFn("HEAD"),
    interceptors,
    options: makeMethodFn("OPTIONS"),
    patch: makeMethodFn("PATCH"),
    post: makeMethodFn("POST"),
    put: makeMethodFn("PUT"),
    request,
    setConfig,
    sse: {
      connect: makeSseFn("CONNECT"),
      delete: makeSseFn("DELETE"),
      get: makeSseFn("GET"),
      head: makeSseFn("HEAD"),
      options: makeSseFn("OPTIONS"),
      patch: makeSseFn("PATCH"),
      post: makeSseFn("POST"),
      put: makeSseFn("PUT"),
      trace: makeSseFn("TRACE"),
    },
    trace: makeMethodFn("TRACE"),
  } as Client
}
````

## File: packages/sdk/js/src/v2/gen/client/index.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type { Auth } from "../core/auth.gen.js"
export type { QuerySerializerOptions } from "../core/bodySerializer.gen.js"
export {
  formDataBodySerializer,
  jsonBodySerializer,
  urlSearchParamsBodySerializer,
} from "../core/bodySerializer.gen.js"
export { buildClientParams } from "../core/params.gen.js"
export { serializeQueryKeyValue } from "../core/queryKeySerializer.gen.js"
export { createClient } from "./client.gen.js"
export type {
  Client,
  ClientOptions,
  Config,
  CreateClientConfig,
  Options,
  RequestOptions,
  RequestResult,
  ResolvedRequestOptions,
  ResponseStyle,
  TDataShape,
} from "./types.gen.js"
export { createConfig, mergeHeaders } from "./utils.gen.js"
````

## File: packages/sdk/js/src/v2/gen/client/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Auth } from "../core/auth.gen.js"
import type { ServerSentEventsOptions, ServerSentEventsResult } from "../core/serverSentEvents.gen.js"
import type { Client as CoreClient, Config as CoreConfig } from "../core/types.gen.js"
import type { Middleware } from "./utils.gen.js"

export type ResponseStyle = "data" | "fields"

export interface Config<T extends ClientOptions = ClientOptions>
  extends Omit<RequestInit, "body" | "headers" | "method">,
    CoreConfig {
  /**
   * Base URL for all requests made by this client.
   */
  baseUrl?: T["baseUrl"]
  /**
   * Fetch API implementation. You can use this option to provide a custom
   * fetch instance.
   *
   * @default globalThis.fetch
   */
  fetch?: typeof fetch
  /**
   * Please don't use the Fetch client for Next.js applications. The `next`
   * options won't have any effect.
   *
   * Install {@link https://www.npmjs.com/package/@hey-api/client-next `@hey-api/client-next`} instead.
   */
  next?: never
  /**
   * Return the response data parsed in a specified format. By default, `auto`
   * will infer the appropriate method from the `Content-Type` response header.
   * You can override this behavior with any of the {@link Body} methods.
   * Select `stream` if you don't want to parse response data at all.
   *
   * @default 'auto'
   */
  parseAs?: "arrayBuffer" | "auto" | "blob" | "formData" | "json" | "stream" | "text"
  /**
   * Should we return only data or multiple fields (data, error, response, etc.)?
   *
   * @default 'fields'
   */
  responseStyle?: ResponseStyle
  /**
   * Throw an error instead of returning it in the response?
   *
   * @default false
   */
  throwOnError?: T["throwOnError"]
}

export interface RequestOptions<
  TData = unknown,
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends Config<{
      responseStyle: TResponseStyle
      throwOnError: ThrowOnError
    }>,
    Pick<
      ServerSentEventsOptions<TData>,
      "onSseError" | "onSseEvent" | "sseDefaultRetryDelay" | "sseMaxRetryAttempts" | "sseMaxRetryDelay"
    > {
  /**
   * Any body that you want to add to your request.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#body}
   */
  body?: unknown
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  /**
   * Security mechanism(s) to use for the request.
   */
  security?: ReadonlyArray<Auth>
  url: Url
}

export interface ResolvedRequestOptions<
  TResponseStyle extends ResponseStyle = "fields",
  ThrowOnError extends boolean = boolean,
  Url extends string = string,
> extends RequestOptions<unknown, TResponseStyle, ThrowOnError, Url> {
  serializedBody?: string
}

export type RequestResult<
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = boolean,
  TResponseStyle extends ResponseStyle = "fields",
> = ThrowOnError extends true
  ? Promise<
      TResponseStyle extends "data"
        ? TData extends Record<string, unknown>
          ? TData[keyof TData]
          : TData
        : {
            data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
            request: Request
            response: Response
          }
    >
  : Promise<
      TResponseStyle extends "data"
        ? (TData extends Record<string, unknown> ? TData[keyof TData] : TData) | undefined
        : (
            | {
                data: TData extends Record<string, unknown> ? TData[keyof TData] : TData
                error: undefined
              }
            | {
                data: undefined
                error: TError extends Record<string, unknown> ? TError[keyof TError] : TError
              }
          ) & {
            request: Request
            response: Response
          }
    >

export interface ClientOptions {
  baseUrl?: string
  responseStyle?: ResponseStyle
  throwOnError?: boolean
}

type MethodFn = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type SseFn = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method">,
) => Promise<ServerSentEventsResult<TData, TError>>

type RequestFn = <
  TData = unknown,
  TError = unknown,
  ThrowOnError extends boolean = false,
  TResponseStyle extends ResponseStyle = "fields",
>(
  options: Omit<RequestOptions<TData, TResponseStyle, ThrowOnError>, "method"> &
    Pick<Required<RequestOptions<TData, TResponseStyle, ThrowOnError>>, "method">,
) => RequestResult<TData, TError, ThrowOnError, TResponseStyle>

type BuildUrlFn = <
  TData extends {
    body?: unknown
    path?: Record<string, unknown>
    query?: Record<string, unknown>
    url: string
  },
>(
  options: TData & Options<TData>,
) => string

export type Client = CoreClient<RequestFn, Config, MethodFn, BuildUrlFn, SseFn> & {
  interceptors: Middleware<Request, Response, unknown, ResolvedRequestOptions>
}

/**
 * The `createClientConfig()` function will be called on client initialization
 * and the returned object will become the client's initial configuration.
 *
 * You may want to initialize your client this way instead of calling
 * `setConfig()`. This is useful for example if you're using Next.js
 * to ensure your client always has the correct values.
 */
export type CreateClientConfig<T extends ClientOptions = ClientOptions> = (
  override?: Config<ClientOptions & T>,
) => Config<Required<ClientOptions> & T>

export interface TDataShape {
  body?: unknown
  headers?: unknown
  path?: unknown
  query?: unknown
  url: string
}

type OmitKeys<T, K> = Pick<T, Exclude<keyof T, K>>

export type Options<
  TData extends TDataShape = TDataShape,
  ThrowOnError extends boolean = boolean,
  TResponse = unknown,
  TResponseStyle extends ResponseStyle = "fields",
> = OmitKeys<RequestOptions<TResponse, TResponseStyle, ThrowOnError>, "body" | "path" | "query" | "url"> &
  ([TData] extends [never] ? unknown : Omit<TData, "url">)
````

## File: packages/sdk/js/src/v2/gen/client/utils.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { getAuthToken } from "../core/auth.gen.js"
import type { QuerySerializerOptions } from "../core/bodySerializer.gen.js"
import { jsonBodySerializer } from "../core/bodySerializer.gen.js"
import { serializeArrayParam, serializeObjectParam, serializePrimitiveParam } from "../core/pathSerializer.gen.js"
import { getUrl } from "../core/utils.gen.js"
import type { Client, ClientOptions, Config, RequestOptions } from "./types.gen.js"

export const createQuerySerializer = <T = unknown>({ parameters = {}, ...args }: QuerySerializerOptions = {}) => {
  const querySerializer = (queryParams: T) => {
    const search: string[] = []
    if (queryParams && typeof queryParams === "object") {
      for (const name in queryParams) {
        const value = queryParams[name]

        if (value === undefined || value === null) {
          continue
        }

        const options = parameters[name] || args

        if (Array.isArray(value)) {
          const serializedArray = serializeArrayParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "form",
            value,
            ...options.array,
          })
          if (serializedArray) search.push(serializedArray)
        } else if (typeof value === "object") {
          const serializedObject = serializeObjectParam({
            allowReserved: options.allowReserved,
            explode: true,
            name,
            style: "deepObject",
            value: value as Record<string, unknown>,
            ...options.object,
          })
          if (serializedObject) search.push(serializedObject)
        } else {
          const serializedPrimitive = serializePrimitiveParam({
            allowReserved: options.allowReserved,
            name,
            value: value as string,
          })
          if (serializedPrimitive) search.push(serializedPrimitive)
        }
      }
    }
    return search.join("&")
  }
  return querySerializer
}

/**
 * Infers parseAs value from provided Content-Type header.
 */
export const getParseAs = (contentType: string | null): Exclude<Config["parseAs"], "auto"> => {
  if (!contentType) {
    // If no Content-Type header is provided, the best we can do is return the raw response body,
    // which is effectively the same as the 'stream' option.
    return "stream"
  }

  const cleanContent = contentType.split(";")[0]?.trim()

  if (!cleanContent) {
    return
  }

  if (cleanContent.startsWith("application/json") || cleanContent.endsWith("+json")) {
    return "json"
  }

  if (cleanContent === "multipart/form-data") {
    return "formData"
  }

  if (["application/", "audio/", "image/", "video/"].some((type) => cleanContent.startsWith(type))) {
    return "blob"
  }

  if (cleanContent.startsWith("text/")) {
    return "text"
  }

  return
}

const checkForExistence = (
  options: Pick<RequestOptions, "auth" | "query"> & {
    headers: Headers
  },
  name?: string,
): boolean => {
  if (!name) {
    return false
  }
  if (options.headers.has(name) || options.query?.[name] || options.headers.get("Cookie")?.includes(`${name}=`)) {
    return true
  }
  return false
}

export const setAuthParams = async ({
  security,
  ...options
}: Pick<Required<RequestOptions>, "security"> &
  Pick<RequestOptions, "auth" | "query"> & {
    headers: Headers
  }) => {
  for (const auth of security) {
    if (checkForExistence(options, auth.name)) {
      continue
    }

    const token = await getAuthToken(auth, options.auth)

    if (!token) {
      continue
    }

    const name = auth.name ?? "Authorization"

    switch (auth.in) {
      case "query":
        if (!options.query) {
          options.query = {}
        }
        options.query[name] = token
        break
      case "cookie":
        options.headers.append("Cookie", `${name}=${token}`)
        break
      case "header":
      default:
        options.headers.set(name, token)
        break
    }
  }
}

export const buildUrl: Client["buildUrl"] = (options) =>
  getUrl({
    baseUrl: options.baseUrl as string,
    path: options.path,
    query: options.query,
    querySerializer:
      typeof options.querySerializer === "function"
        ? options.querySerializer
        : createQuerySerializer(options.querySerializer),
    url: options.url,
  })

export const mergeConfigs = (a: Config, b: Config): Config => {
  const config = { ...a, ...b }
  if (config.baseUrl?.endsWith("/")) {
    config.baseUrl = config.baseUrl.substring(0, config.baseUrl.length - 1)
  }
  config.headers = mergeHeaders(a.headers, b.headers)
  return config
}

const headersEntries = (headers: Headers): Array<[string, string]> => {
  const entries: Array<[string, string]> = []
  headers.forEach((value, key) => {
    entries.push([key, value])
  })
  return entries
}

export const mergeHeaders = (...headers: Array<Required<Config>["headers"] | undefined>): Headers => {
  const mergedHeaders = new Headers()
  for (const header of headers) {
    if (!header) {
      continue
    }

    const iterator = header instanceof Headers ? headersEntries(header) : Object.entries(header)

    for (const [key, value] of iterator) {
      if (value === null) {
        mergedHeaders.delete(key)
      } else if (Array.isArray(value)) {
        for (const v of value) {
          mergedHeaders.append(key, v as string)
        }
      } else if (value !== undefined) {
        // assume object headers are meant to be JSON stringified, i.e. their
        // content value in OpenAPI specification is 'application/json'
        mergedHeaders.set(key, typeof value === "object" ? JSON.stringify(value) : (value as string))
      }
    }
  }
  return mergedHeaders
}

type ErrInterceptor<Err, Res, Req, Options> = (
  error: Err,
  response: Res,
  request: Req,
  options: Options,
) => Err | Promise<Err>

type ReqInterceptor<Req, Options> = (request: Req, options: Options) => Req | Promise<Req>

type ResInterceptor<Res, Req, Options> = (response: Res, request: Req, options: Options) => Res | Promise<Res>

class Interceptors<Interceptor> {
  fns: Array<Interceptor | null> = []

  clear(): void {
    this.fns = []
  }

  eject(id: number | Interceptor): void {
    const index = this.getInterceptorIndex(id)
    if (this.fns[index]) {
      this.fns[index] = null
    }
  }

  exists(id: number | Interceptor): boolean {
    const index = this.getInterceptorIndex(id)
    return Boolean(this.fns[index])
  }

  getInterceptorIndex(id: number | Interceptor): number {
    if (typeof id === "number") {
      return this.fns[id] ? id : -1
    }
    return this.fns.indexOf(id)
  }

  update(id: number | Interceptor, fn: Interceptor): number | Interceptor | false {
    const index = this.getInterceptorIndex(id)
    if (this.fns[index]) {
      this.fns[index] = fn
      return id
    }
    return false
  }

  use(fn: Interceptor): number {
    this.fns.push(fn)
    return this.fns.length - 1
  }
}

export interface Middleware<Req, Res, Err, Options> {
  error: Interceptors<ErrInterceptor<Err, Res, Req, Options>>
  request: Interceptors<ReqInterceptor<Req, Options>>
  response: Interceptors<ResInterceptor<Res, Req, Options>>
}

export const createInterceptors = <Req, Res, Err, Options>(): Middleware<Req, Res, Err, Options> => ({
  error: new Interceptors<ErrInterceptor<Err, Res, Req, Options>>(),
  request: new Interceptors<ReqInterceptor<Req, Options>>(),
  response: new Interceptors<ResInterceptor<Res, Req, Options>>(),
})

const defaultQuerySerializer = createQuerySerializer({
  allowReserved: false,
  array: {
    explode: true,
    style: "form",
  },
  object: {
    explode: true,
    style: "deepObject",
  },
})

const defaultHeaders = {
  "Content-Type": "application/json",
}

export const createConfig = <T extends ClientOptions = ClientOptions>(
  override: Config<Omit<ClientOptions, keyof T> & T> = {},
): Config<Omit<ClientOptions, keyof T> & T> => ({
  ...jsonBodySerializer,
  headers: defaultHeaders,
  parseAs: "auto",
  querySerializer: defaultQuerySerializer,
  ...override,
})
````

## File: packages/sdk/js/src/v2/gen/core/auth.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type AuthToken = string | undefined

export interface Auth {
  /**
   * Which part of the request do we use to send the auth?
   *
   * @default 'header'
   */
  in?: "header" | "query" | "cookie"
  /**
   * Header or query parameter name.
   *
   * @default 'Authorization'
   */
  name?: string
  scheme?: "basic" | "bearer"
  type: "apiKey" | "http"
}

export const getAuthToken = async (
  auth: Auth,
  callback: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken,
): Promise<string | undefined> => {
  const token = typeof callback === "function" ? await callback(auth) : callback

  if (!token) {
    return
  }

  if (auth.scheme === "bearer") {
    return `Bearer ${token}`
  }

  if (auth.scheme === "basic") {
    return `Basic ${btoa(token)}`
  }

  return token
}
````

## File: packages/sdk/js/src/v2/gen/core/bodySerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { ArrayStyle, ObjectStyle, SerializerOptions } from "./pathSerializer.gen.js"

export type QuerySerializer = (query: Record<string, unknown>) => string

export type BodySerializer = (body: any) => any

type QuerySerializerOptionsObject = {
  allowReserved?: boolean
  array?: Partial<SerializerOptions<ArrayStyle>>
  object?: Partial<SerializerOptions<ObjectStyle>>
}

export type QuerySerializerOptions = QuerySerializerOptionsObject & {
  /**
   * Per-parameter serialization overrides. When provided, these settings
   * override the global array/object settings for specific parameter names.
   */
  parameters?: Record<string, QuerySerializerOptionsObject>
}

const serializeFormDataPair = (data: FormData, key: string, value: unknown): void => {
  if (typeof value === "string" || value instanceof Blob) {
    data.append(key, value)
  } else if (value instanceof Date) {
    data.append(key, value.toISOString())
  } else {
    data.append(key, JSON.stringify(value))
  }
}

const serializeUrlSearchParamsPair = (data: URLSearchParams, key: string, value: unknown): void => {
  if (typeof value === "string") {
    data.append(key, value)
  } else {
    data.append(key, JSON.stringify(value))
  }
}

export const formDataBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T): FormData => {
    const data = new FormData()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      if (Array.isArray(value)) {
        value.forEach((v) => serializeFormDataPair(data, key, v))
      } else {
        serializeFormDataPair(data, key, value)
      }
    })

    return data
  },
}

export const jsonBodySerializer = {
  bodySerializer: <T>(body: T): string =>
    JSON.stringify(body, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
}

export const urlSearchParamsBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T): string => {
    const data = new URLSearchParams()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      if (Array.isArray(value)) {
        value.forEach((v) => serializeUrlSearchParamsPair(data, key, v))
      } else {
        serializeUrlSearchParamsPair(data, key, value)
      }
    })

    return data.toString()
  },
}
````

## File: packages/sdk/js/src/v2/gen/core/params.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

type Slot = "body" | "headers" | "path" | "query"

export type Field =
  | {
      in: Exclude<Slot, "body">
      /**
       * Field name. This is the name we want the user to see and use.
       */
      key: string
      /**
       * Field mapped name. This is the name we want to use in the request.
       * If omitted, we use the same value as `key`.
       */
      map?: string
    }
  | {
      in: Extract<Slot, "body">
      /**
       * Key isn't required for bodies.
       */
      key?: string
      map?: string
    }
  | {
      /**
       * Field name. This is the name we want the user to see and use.
       */
      key: string
      /**
       * Field mapped name. This is the name we want to use in the request.
       * If `in` is omitted, `map` aliases `key` to the transport layer.
       */
      map: Slot
    }

export interface Fields {
  allowExtra?: Partial<Record<Slot, boolean>>
  args?: ReadonlyArray<Field>
}

export type FieldsConfig = ReadonlyArray<Field | Fields>

const extraPrefixesMap: Record<string, Slot> = {
  $body_: "body",
  $headers_: "headers",
  $path_: "path",
  $query_: "query",
}
const extraPrefixes = Object.entries(extraPrefixesMap)

type KeyMap = Map<
  string,
  | {
      in: Slot
      map?: string
    }
  | {
      in?: never
      map: Slot
    }
>

const buildKeyMap = (fields: FieldsConfig, map?: KeyMap): KeyMap => {
  if (!map) {
    map = new Map()
  }

  for (const config of fields) {
    if ("in" in config) {
      if (config.key) {
        map.set(config.key, {
          in: config.in,
          map: config.map,
        })
      }
    } else if ("key" in config) {
      map.set(config.key, {
        map: config.map,
      })
    } else if (config.args) {
      buildKeyMap(config.args, map)
    }
  }

  return map
}

interface Params {
  body: unknown
  headers: Record<string, unknown>
  path: Record<string, unknown>
  query: Record<string, unknown>
}

const stripEmptySlots = (params: Params) => {
  for (const [slot, value] of Object.entries(params)) {
    if (value && typeof value === "object" && !Object.keys(value).length) {
      delete params[slot as Slot]
    }
  }
}

export const buildClientParams = (args: ReadonlyArray<unknown>, fields: FieldsConfig) => {
  const params: Params = {
    body: {},
    headers: {},
    path: {},
    query: {},
  }

  const map = buildKeyMap(fields)

  let config: FieldsConfig[number] | undefined

  for (const [index, arg] of args.entries()) {
    if (fields[index]) {
      config = fields[index]
    }

    if (!config) {
      continue
    }

    if ("in" in config) {
      if (config.key) {
        const field = map.get(config.key)!
        const name = field.map || config.key
        if (field.in) {
          ;(params[field.in] as Record<string, unknown>)[name] = arg
        }
      } else {
        params.body = arg
      }
    } else {
      for (const [key, value] of Object.entries(arg ?? {})) {
        const field = map.get(key)

        if (field) {
          if (field.in) {
            const name = field.map || key
            ;(params[field.in] as Record<string, unknown>)[name] = value
          } else {
            params[field.map] = value
          }
        } else {
          const extra = extraPrefixes.find(([prefix]) => key.startsWith(prefix))

          if (extra) {
            const [prefix, slot] = extra
            ;(params[slot] as Record<string, unknown>)[key.slice(prefix.length)] = value
          } else if ("allowExtra" in config && config.allowExtra) {
            for (const [slot, allowed] of Object.entries(config.allowExtra)) {
              if (allowed) {
                ;(params[slot as Slot] as Record<string, unknown>)[key] = value
                break
              }
            }
          }
        }
      }
    }
  }

  stripEmptySlots(params)

  return params
}
````

## File: packages/sdk/js/src/v2/gen/core/pathSerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

interface SerializeOptions<T> extends SerializePrimitiveOptions, SerializerOptions<T> {}

interface SerializePrimitiveOptions {
  allowReserved?: boolean
  name: string
}

export interface SerializerOptions<T> {
  /**
   * @default true
   */
  explode: boolean
  style: T
}

export type ArrayStyle = "form" | "spaceDelimited" | "pipeDelimited"
export type ArraySeparatorStyle = ArrayStyle | MatrixStyle
type MatrixStyle = "label" | "matrix" | "simple"
export type ObjectStyle = "form" | "deepObject"
type ObjectSeparatorStyle = ObjectStyle | MatrixStyle

interface SerializePrimitiveParam extends SerializePrimitiveOptions {
  value: string
}

export const separatorArrayExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const separatorArrayNoExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case "form":
      return ","
    case "pipeDelimited":
      return "|"
    case "spaceDelimited":
      return "%20"
    default:
      return ","
  }
}

export const separatorObjectExplode = (style: ObjectSeparatorStyle) => {
  switch (style) {
    case "label":
      return "."
    case "matrix":
      return ";"
    case "simple":
      return ","
    default:
      return "&"
  }
}

export const serializeArrayParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[]
}) => {
  if (!explode) {
    const joinedValues = (allowReserved ? value : value.map((v) => encodeURIComponent(v as string))).join(
      separatorArrayNoExplode(style),
    )
    switch (style) {
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      case "simple":
        return joinedValues
      default:
        return `${name}=${joinedValues}`
    }
  }

  const separator = separatorArrayExplode(style)
  const joinedValues = value
    .map((v) => {
      if (style === "label" || style === "simple") {
        return allowReserved ? v : encodeURIComponent(v as string)
      }

      return serializePrimitiveParam({
        allowReserved,
        name,
        value: v as string,
      })
    })
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}

export const serializePrimitiveParam = ({ allowReserved, name, value }: SerializePrimitiveParam) => {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "object") {
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.",
    )
  }

  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`
}

export const serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown> | Date
  valueOnly?: boolean
}) => {
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`
  }

  if (style !== "deepObject" && !explode) {
    let values: string[] = []
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? (v as string) : encodeURIComponent(v as string)]
    })
    const joinedValues = values.join(",")
    switch (style) {
      case "form":
        return `${name}=${joinedValues}`
      case "label":
        return `.${joinedValues}`
      case "matrix":
        return `;${name}=${joinedValues}`
      default:
        return joinedValues
    }
  }

  const separator = separatorObjectExplode(style)
  const joinedValues = Object.entries(value)
    .map(([key, v]) =>
      serializePrimitiveParam({
        allowReserved,
        name: style === "deepObject" ? `${name}[${key}]` : key,
        value: v as string,
      }),
    )
    .join(separator)
  return style === "label" || style === "matrix" ? separator + joinedValues : joinedValues
}
````

## File: packages/sdk/js/src/v2/gen/core/queryKeySerializer.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

/**
 * JSON-friendly union that mirrors what Pinia Colada can hash.
 */
export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }

/**
 * Replacer that converts non-JSON values (bigint, Date, etc.) to safe substitutes.
 */
export const queryKeyJsonReplacer = (_key: string, value: unknown) => {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }
  if (typeof value === "bigint") {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

/**
 * Safely stringifies a value and parses it back into a JsonValue.
 */
export const stringifyToJsonValue = (input: unknown): JsonValue | undefined => {
  try {
    const json = JSON.stringify(input, queryKeyJsonReplacer)
    if (json === undefined) {
      return undefined
    }
    return JSON.parse(json) as JsonValue
  } catch {
    return undefined
  }
}

/**
 * Detects plain objects (including objects with a null prototype).
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") {
    return false
  }
  const prototype = Object.getPrototypeOf(value as object)
  return prototype === Object.prototype || prototype === null
}

/**
 * Turns URLSearchParams into a sorted JSON object for deterministic keys.
 */
const serializeSearchParams = (params: URLSearchParams): JsonValue => {
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
  const result: Record<string, JsonValue> = {}

  for (const [key, value] of entries) {
    const existing = result[key]
    if (existing === undefined) {
      result[key] = value
      continue
    }

    if (Array.isArray(existing)) {
      ;(existing as string[]).push(value)
    } else {
      result[key] = [existing, value]
    }
  }

  return result
}

/**
 * Normalizes any accepted value into a JSON-friendly shape for query keys.
 */
export const serializeQueryKeyValue = (value: unknown): JsonValue | undefined => {
  if (value === null) {
    return null
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined
  }

  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return stringifyToJsonValue(value)
  }

  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    return serializeSearchParams(value)
  }

  if (isPlainObject(value)) {
    return stringifyToJsonValue(value)
  }

  return undefined
}
````

## File: packages/sdk/js/src/v2/gen/core/serverSentEvents.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Config } from "./types.gen.js"

export type ServerSentEventsOptions<TData = unknown> = Omit<RequestInit, "method"> &
  Pick<Config, "method" | "responseTransformer" | "responseValidator"> & {
    /**
     * Fetch API implementation. You can use this option to provide a custom
     * fetch instance.
     *
     * @default globalThis.fetch
     */
    fetch?: typeof fetch
    /**
     * Implementing clients can call request interceptors inside this hook.
     */
    onRequest?: (url: string, init: RequestInit) => Promise<Request>
    /**
     * Callback invoked when a network or parsing error occurs during streaming.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param error The error that occurred.
     */
    onSseError?: (error: unknown) => void
    /**
     * Callback invoked when an event is streamed from the server.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @param event Event streamed from the server.
     * @returns Nothing (void).
     */
    onSseEvent?: (event: StreamEvent<TData>) => void
    serializedBody?: RequestInit["body"]
    /**
     * Default retry delay in milliseconds.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 3000
     */
    sseDefaultRetryDelay?: number
    /**
     * Maximum number of retry attempts before giving up.
     */
    sseMaxRetryAttempts?: number
    /**
     * Maximum retry delay in milliseconds.
     *
     * Applies only when exponential backoff is used.
     *
     * This option applies only if the endpoint returns a stream of events.
     *
     * @default 30000
     */
    sseMaxRetryDelay?: number
    /**
     * Optional sleep function for retry backoff.
     *
     * Defaults to using `setTimeout`.
     */
    sseSleepFn?: (ms: number) => Promise<void>
    url: string
  }

export interface StreamEvent<TData = unknown> {
  data: TData
  event?: string
  id?: string
  retry?: number
}

export type ServerSentEventsResult<TData = unknown, TReturn = void, TNext = unknown> = {
  stream: AsyncGenerator<TData extends Record<string, unknown> ? TData[keyof TData] : TData, TReturn, TNext>
}

export const createSseClient = <TData = unknown>({
  onRequest,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}: ServerSentEventsOptions): ServerSentEventsResult<TData> => {
  let lastEventId: string | undefined

  const sleep = sseSleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))

  const createStream = async function* () {
    let retryDelay: number = sseDefaultRetryDelay ?? 3000
    let attempt = 0
    const signal = options.signal ?? new AbortController().signal

    while (true) {
      if (signal.aborted) break

      attempt++

      const headers =
        options.headers instanceof Headers
          ? options.headers
          : new Headers(options.headers as Record<string, string> | undefined)

      if (lastEventId !== undefined) {
        headers.set("Last-Event-ID", lastEventId)
      }

      try {
        const requestInit: RequestInit = {
          redirect: "follow",
          ...options,
          body: options.serializedBody,
          headers,
          signal,
        }
        let request = new Request(url, requestInit)
        if (onRequest) {
          request = await onRequest(url, requestInit)
        }
        // fetch must be assigned here, otherwise it would throw the error:
        // TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation
        const _fetch = options.fetch ?? globalThis.fetch
        const response = await _fetch(request)

        if (!response.ok) throw new Error(`SSE failed: ${response.status} ${response.statusText}`)

        if (!response.body) throw new Error("No body in SSE response")

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()

        let buffer = ""

        const abortHandler = () => {
          try {
            reader.cancel()
          } catch {
            // noop
          }
        }

        signal.addEventListener("abort", abortHandler)

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += value
            // Normalize line endings: CRLF -> LF, then CR -> LF
            buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

            const chunks = buffer.split("\n\n")
            buffer = chunks.pop() ?? ""

            for (const chunk of chunks) {
              const lines = chunk.split("\n")
              const dataLines: Array<string> = []
              let eventName: string | undefined

              for (const line of lines) {
                if (line.startsWith("data:")) {
                  dataLines.push(line.replace(/^data:\s*/, ""))
                } else if (line.startsWith("event:")) {
                  eventName = line.replace(/^event:\s*/, "")
                } else if (line.startsWith("id:")) {
                  lastEventId = line.replace(/^id:\s*/, "")
                } else if (line.startsWith("retry:")) {
                  const parsed = Number.parseInt(line.replace(/^retry:\s*/, ""), 10)
                  if (!Number.isNaN(parsed)) {
                    retryDelay = parsed
                  }
                }
              }

              let data: unknown
              let parsedJson = false

              if (dataLines.length) {
                const rawData = dataLines.join("\n")
                try {
                  data = JSON.parse(rawData)
                  parsedJson = true
                } catch {
                  data = rawData
                }
              }

              if (parsedJson) {
                if (responseValidator) {
                  await responseValidator(data)
                }

                if (responseTransformer) {
                  data = await responseTransformer(data)
                }
              }

              onSseEvent?.({
                data,
                event: eventName,
                id: lastEventId,
                retry: retryDelay,
              })

              if (dataLines.length) {
                yield data as any
              }
            }
          }
        } finally {
          signal.removeEventListener("abort", abortHandler)
          reader.releaseLock()
        }

        break // exit loop on normal completion
      } catch (error) {
        // connection failed or aborted; retry after delay
        onSseError?.(error)

        if (sseMaxRetryAttempts !== undefined && attempt >= sseMaxRetryAttempts) {
          break // stop after firing error
        }

        // exponential backoff: double retry each attempt, cap at 30s
        const backoff = Math.min(retryDelay * 2 ** (attempt - 1), sseMaxRetryDelay ?? 30000)
        await sleep(backoff)
      }
    }
  }

  const stream = createStream()

  return { stream }
}
````

## File: packages/sdk/js/src/v2/gen/core/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { Auth, AuthToken } from "./auth.gen.js"
import type { BodySerializer, QuerySerializer, QuerySerializerOptions } from "./bodySerializer.gen.js"

export type HttpMethod = "connect" | "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace"

export type Client<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never, SseFn = never> = {
  /**
   * Returns the final request URL.
   */
  buildUrl: BuildUrlFn
  getConfig: () => Config
  request: RequestFn
  setConfig: (config: Config) => Config
} & {
  [K in HttpMethod]: MethodFn
} & ([SseFn] extends [never] ? { sse?: never } : { sse: { [K in HttpMethod]: SseFn } })

export interface Config {
  /**
   * Auth token or a function returning auth token. The resolved value will be
   * added to the request payload as defined by its `security` array.
   */
  auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken
  /**
   * A function for serializing request body parameter. By default,
   * {@link JSON.stringify()} will be used.
   */
  bodySerializer?: BodySerializer | null
  /**
   * An object containing any HTTP headers that you want to pre-populate your
   * `Headers` object with.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/Headers/Headers#init See more}
   */
  headers?:
    | RequestInit["headers"]
    | Record<string, string | number | boolean | (string | number | boolean)[] | null | undefined | unknown>
  /**
   * The request method.
   *
   * {@link https://developer.mozilla.org/docs/Web/API/fetch#method See more}
   */
  method?: Uppercase<HttpMethod>
  /**
   * A function for serializing request query parameters. By default, arrays
   * will be exploded in form style, objects will be exploded in deepObject
   * style, and reserved characters are percent-encoded.
   *
   * This method will have no effect if the native `paramsSerializer()` Axios
   * API function is used.
   *
   * {@link https://swagger.io/docs/specification/serialization/#query View examples}
   */
  querySerializer?: QuerySerializer | QuerySerializerOptions
  /**
   * A function validating request data. This is useful if you want to ensure
   * the request conforms to the desired shape, so it can be safely sent to
   * the server.
   */
  requestValidator?: (data: unknown) => Promise<unknown>
  /**
   * A function transforming response data before it's returned. This is useful
   * for post-processing data, e.g. converting ISO strings into Date objects.
   */
  responseTransformer?: (data: unknown) => Promise<unknown>
  /**
   * A function validating response data. This is useful if you want to ensure
   * the response conforms to the desired shape, so it can be safely passed to
   * the transformers and returned to the user.
   */
  responseValidator?: (data: unknown) => Promise<unknown>
}

type IsExactlyNeverOrNeverUndefined<T> = [T] extends [never]
  ? true
  : [T] extends [never | undefined]
    ? [undefined] extends [T]
      ? false
      : true
    : false

export type OmitNever<T extends Record<string, unknown>> = {
  [K in keyof T as IsExactlyNeverOrNeverUndefined<T[K]> extends true ? never : K]: T[K]
}
````

## File: packages/sdk/js/src/v2/gen/core/utils.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import type { BodySerializer, QuerySerializer } from "./bodySerializer.gen.js"
import {
  type ArraySeparatorStyle,
  serializeArrayParam,
  serializeObjectParam,
  serializePrimitiveParam,
} from "./pathSerializer.gen.js"

export interface PathSerializer {
  path: Record<string, unknown>
  url: string
}

export const PATH_PARAM_RE = /\{[^{}]+\}/g

export const defaultPathSerializer = ({ path, url: _url }: PathSerializer) => {
  let url = _url
  const matches = _url.match(PATH_PARAM_RE)
  if (matches) {
    for (const match of matches) {
      let explode = false
      let name = match.substring(1, match.length - 1)
      let style: ArraySeparatorStyle = "simple"

      if (name.endsWith("*")) {
        explode = true
        name = name.substring(0, name.length - 1)
      }

      if (name.startsWith(".")) {
        name = name.substring(1)
        style = "label"
      } else if (name.startsWith(";")) {
        name = name.substring(1)
        style = "matrix"
      }

      const value = path[name]

      if (value === undefined || value === null) {
        continue
      }

      if (Array.isArray(value)) {
        url = url.replace(match, serializeArrayParam({ explode, name, style, value }))
        continue
      }

      if (typeof value === "object") {
        url = url.replace(
          match,
          serializeObjectParam({
            explode,
            name,
            style,
            value: value as Record<string, unknown>,
            valueOnly: true,
          }),
        )
        continue
      }

      if (style === "matrix") {
        url = url.replace(
          match,
          `;${serializePrimitiveParam({
            name,
            value: value as string,
          })}`,
        )
        continue
      }

      const replaceValue = encodeURIComponent(style === "label" ? `.${value as string}` : (value as string))
      url = url.replace(match, replaceValue)
    }
  }
  return url
}

export const getUrl = ({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url,
}: {
  baseUrl?: string
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  querySerializer: QuerySerializer
  url: string
}) => {
  const pathUrl = _url.startsWith("/") ? _url : `/${_url}`
  let url = (baseUrl ?? "") + pathUrl
  if (path) {
    url = defaultPathSerializer({ path, url })
  }
  let search = query ? querySerializer(query) : ""
  if (search.startsWith("?")) {
    search = search.substring(1)
  }
  if (search) {
    url += `?${search}`
  }
  return url
}

export function getValidRequestBody(options: {
  body?: unknown
  bodySerializer?: BodySerializer | null
  serializedBody?: unknown
}) {
  const hasBody = options.body !== undefined
  const isSerializedBody = hasBody && options.bodySerializer

  if (isSerializedBody) {
    if ("serializedBody" in options) {
      const hasSerializedBody = options.serializedBody !== undefined && options.serializedBody !== ""

      return hasSerializedBody ? options.serializedBody : null
    }

    // not all clients implement a serializedBody property (i.e. client-axios)
    return options.body !== "" ? options.body : null
  }

  // plain/text body
  if (hasBody) {
    return options.body
  }

  // no body was provided
  return undefined
}
````

## File: packages/sdk/js/src/v2/gen/client.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { type ClientOptions, type Config, createClient, createConfig } from "./client/index.js"
import type { ClientOptions as ClientOptions2 } from "./types.gen.js"

/**
 * The `createClientConfig()` function will be called on client initialization
 * and the returned object will become the client's initial configuration.
 *
 * You may want to initialize your client this way instead of calling
 * `setConfig()`. This is useful for example if you're using Next.js
 * to ensure your client always has the correct values.
 */
export type CreateClientConfig<T extends ClientOptions = ClientOptions2> = (
  override?: Config<ClientOptions & T>,
) => Config<Required<ClientOptions> & T>

export const client = createClient(createConfig<ClientOptions2>({ baseUrl: "http://localhost:4096" }))
````

## File: packages/sdk/js/src/v2/gen/sdk.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

import { client } from "./client.gen.js"
import { buildClientParams, type Client, type Options as Options2, type TDataShape } from "./client/index.js"
import type {
  AgentPartInput,
  AppAgentsResponses,
  AppLogErrors,
  AppLogResponses,
  AppSkillsResponses,
  Auth as Auth3,
  AuthRemoveErrors,
  AuthRemoveResponses,
  AuthSetErrors,
  AuthSetResponses,
  CommandListResponses,
  Config as Config3,
  ConfigGetResponses,
  ConfigProvidersResponses,
  ConfigUpdateErrors,
  ConfigUpdateResponses,
  EventSubscribeResponses,
  EventTuiCommandExecute2,
  EventTuiPromptAppend2,
  EventTuiSessionSelect2,
  EventTuiToastShow2,
  ExperimentalConsoleGetErrors,
  ExperimentalConsoleGetResponses,
  ExperimentalConsoleListOrgsErrors,
  ExperimentalConsoleListOrgsResponses,
  ExperimentalConsoleSwitchOrgResponses,
  ExperimentalResourceListResponses,
  ExperimentalSessionListResponses,
  ExperimentalWorkspaceAdapterListResponses,
  ExperimentalWorkspaceCreateErrors,
  ExperimentalWorkspaceCreateResponses,
  ExperimentalWorkspaceListResponses,
  ExperimentalWorkspaceRemoveErrors,
  ExperimentalWorkspaceRemoveResponses,
  ExperimentalWorkspaceStatusResponses,
  ExperimentalWorkspaceSyncListResponses,
  ExperimentalWorkspaceWarpErrors,
  ExperimentalWorkspaceWarpResponses,
  FileListResponses,
  FilePartInput,
  FilePartSource,
  FileReadResponses,
  FileStatusResponses,
  FindFilesResponses,
  FindSymbolsResponses,
  FindTextResponses,
  FormatterStatusResponses,
  GlobalConfigGetResponses,
  GlobalConfigUpdateErrors,
  GlobalConfigUpdateResponses,
  GlobalDisposeResponses,
  GlobalEventResponses,
  GlobalHealthResponses,
  GlobalUpgradeErrors,
  GlobalUpgradeResponses,
  InstanceDisposeResponses,
  LspStatusResponses,
  McpAddErrors,
  McpAddResponses,
  McpAuthAuthenticateErrors,
  McpAuthAuthenticateResponses,
  McpAuthCallbackErrors,
  McpAuthCallbackResponses,
  McpAuthRemoveErrors,
  McpAuthRemoveResponses,
  McpAuthStartErrors,
  McpAuthStartResponses,
  McpConnectResponses,
  McpDisconnectResponses,
  McpLocalConfig,
  McpRemoteConfig,
  McpStatusResponses,
  OutputFormat,
  Part as Part2,
  PartDeleteErrors,
  PartDeleteResponses,
  PartUpdateErrors,
  PartUpdateResponses,
  PathGetResponses,
  PermissionListResponses,
  PermissionReplyErrors,
  PermissionReplyResponses,
  PermissionRespondErrors,
  PermissionRespondResponses,
  PermissionRuleset,
  ProjectCurrentResponses,
  ProjectInitGitResponses,
  ProjectListResponses,
  ProjectUpdateErrors,
  ProjectUpdateResponses,
  Prompt,
  ProviderAuthResponses,
  ProviderListResponses,
  ProviderOauthAuthorizeErrors,
  ProviderOauthAuthorizeResponses,
  ProviderOauthCallbackErrors,
  ProviderOauthCallbackResponses,
  PtyConnectErrors,
  PtyConnectResponses,
  PtyConnectTokenErrors,
  PtyConnectTokenResponses,
  PtyCreateErrors,
  PtyCreateResponses,
  PtyGetErrors,
  PtyGetResponses,
  PtyListResponses,
  PtyRemoveErrors,
  PtyRemoveResponses,
  PtyShellsResponses,
  PtyUpdateErrors,
  PtyUpdateResponses,
  QuestionAnswer,
  QuestionListResponses,
  QuestionRejectErrors,
  QuestionRejectResponses,
  QuestionReplyErrors,
  QuestionReplyResponses,
  SessionAbortErrors,
  SessionAbortResponses,
  SessionChildrenErrors,
  SessionChildrenResponses,
  SessionCommandErrors,
  SessionCommandResponses,
  SessionCreateErrors,
  SessionCreateResponses,
  SessionDeleteErrors,
  SessionDeleteMessageErrors,
  SessionDeleteMessageResponses,
  SessionDeleteResponses,
  SessionDelivery,
  SessionDiffResponses,
  SessionForkErrors,
  SessionForkResponses,
  SessionGetErrors,
  SessionGetResponses,
  SessionInitErrors,
  SessionInitResponses,
  SessionListResponses,
  SessionMessageErrors,
  SessionMessageResponses,
  SessionMessagesErrors,
  SessionMessagesResponses,
  SessionPromptAsyncErrors,
  SessionPromptAsyncResponses,
  SessionPromptErrors,
  SessionPromptResponses,
  SessionRevertErrors,
  SessionRevertResponses,
  SessionShareErrors,
  SessionShareResponses,
  SessionShellErrors,
  SessionShellResponses,
  SessionStatusErrors,
  SessionStatusResponses,
  SessionSummarizeErrors,
  SessionSummarizeResponses,
  SessionTodoErrors,
  SessionTodoResponses,
  SessionUnrevertErrors,
  SessionUnrevertResponses,
  SessionUnshareErrors,
  SessionUnshareResponses,
  SessionUpdateErrors,
  SessionUpdateResponses,
  SubtaskPartInput,
  SyncHistoryListErrors,
  SyncHistoryListResponses,
  SyncReplayErrors,
  SyncReplayResponses,
  SyncStartResponses,
  SyncStealErrors,
  SyncStealResponses,
  TextPartInput,
  ToolIdsErrors,
  ToolIdsResponses,
  ToolListErrors,
  ToolListResponses,
  TuiAppendPromptErrors,
  TuiAppendPromptResponses,
  TuiClearPromptResponses,
  TuiControlNextResponses,
  TuiControlResponseResponses,
  TuiExecuteCommandErrors,
  TuiExecuteCommandResponses,
  TuiOpenHelpResponses,
  TuiOpenModelsResponses,
  TuiOpenSessionsResponses,
  TuiOpenThemesResponses,
  TuiPublishErrors,
  TuiPublishResponses,
  TuiSelectSessionErrors,
  TuiSelectSessionResponses,
  TuiShowToastResponses,
  TuiSubmitPromptResponses,
  V2SessionCompactResponses,
  V2SessionContextResponses,
  V2SessionListErrors,
  V2SessionListResponses,
  V2SessionMessagesErrors,
  V2SessionMessagesResponses,
  V2SessionPromptResponses,
  V2SessionWaitResponses,
  VcsApplyErrors,
  VcsApplyResponses,
  VcsDiffRawResponses,
  VcsDiffResponses,
  VcsGetResponses,
  VcsStatusResponses,
  WorktreeCreateErrors,
  WorktreeCreateInput,
  WorktreeCreateResponses,
  WorktreeListResponses,
  WorktreeRemoveErrors,
  WorktreeRemoveInput,
  WorktreeRemoveResponses,
  WorktreeResetErrors,
  WorktreeResetInput,
  WorktreeResetResponses,
} from "./types.gen.js"

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = Options2<
  TData,
  ThrowOnError
> & {
  /**
   * You can provide a client instance returned by `createClient()` instead of
   * individual options. This might be also useful if you want to implement a
   * custom client.
   */
  client?: Client
  /**
   * You can pass arbitrary values through the `meta` object. This can be
   * used to access values that aren't defined as part of the SDK function.
   */
  meta?: Record<string, unknown>
}

class HeyApiClient {
  protected client: Client

  constructor(args?: { client?: Client }) {
    this.client = args?.client ?? client
  }
}

class HeyApiRegistry<T> {
  private readonly defaultKey = "default"

  private readonly instances: Map<string, T> = new Map()

  get(key?: string): T {
    const instance = this.instances.get(key ?? this.defaultKey)
    if (!instance) {
      throw new Error(`No SDK client found. Create one with "new OpencodeClient()" to fix this error.`)
    }
    return instance
  }

  set(value: T, key?: string): void {
    this.instances.set(key ?? this.defaultKey, value)
  }
}

export class Auth extends HeyApiClient {
  /**
   * Remove auth credentials
   *
   * Remove authentication credentials
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "path", key: "providerID" }] }])
    return (options?.client ?? this.client).delete<AuthRemoveResponses, AuthRemoveErrors, ThrowOnError>({
      url: "/auth/{providerID}",
      ...options,
      ...params,
    })
  }

  /**
   * Set auth credentials
   *
   * Set authentication credentials
   */
  public set<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      auth?: Auth3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { key: "auth", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put<AuthSetResponses, AuthSetErrors, ThrowOnError>({
      url: "/auth/{providerID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class App extends HeyApiClient {
  /**
   * Write log
   *
   * Write a log entry to the server logs with specified level and metadata.
   */
  public log<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      service?: string
      level?: "debug" | "info" | "error" | "warn"
      message?: string
      extra?: {
        [key: string]: unknown
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "service" },
            { in: "body", key: "level" },
            { in: "body", key: "message" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<AppLogResponses, AppLogErrors, ThrowOnError>({
      url: "/log",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * List agents
   *
   * Get a list of all available AI agents in the OpenCode system.
   */
  public agents<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<AppAgentsResponses, unknown, ThrowOnError>({
      url: "/agent",
      ...options,
      ...params,
    })
  }

  /**
   * List skills
   *
   * Get a list of all available skills in the OpenCode system.
   */
  public skills<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<AppSkillsResponses, unknown, ThrowOnError>({
      url: "/skill",
      ...options,
      ...params,
    })
  }
}

export class Config extends HeyApiClient {
  /**
   * Get global configuration
   *
   * Retrieve the current global OpenCode configuration settings and preferences.
   */
  public get<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<GlobalConfigGetResponses, unknown, ThrowOnError>({
      url: "/global/config",
      ...options,
    })
  }

  /**
   * Update global configuration
   *
   * Update global OpenCode configuration settings and preferences.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters?: {
      config?: Config3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ key: "config", map: "body" }] }])
    return (options?.client ?? this.client).patch<GlobalConfigUpdateResponses, GlobalConfigUpdateErrors, ThrowOnError>({
      url: "/global/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Global extends HeyApiClient {
  /**
   * Get health
   *
   * Get health information about the OpenCode server.
   */
  public health<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).get<GlobalHealthResponses, unknown, ThrowOnError>({
      url: "/global/health",
      ...options,
    })
  }

  /**
   * Get global events
   *
   * Subscribe to global events from the OpenCode system using server-sent events.
   */
  public event<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).sse.get<GlobalEventResponses, unknown, ThrowOnError>({
      url: "/global/event",
      ...options,
    })
  }

  /**
   * Dispose instance
   *
   * Clean up and dispose all OpenCode instances, releasing all resources.
   */
  public dispose<ThrowOnError extends boolean = false>(options?: Options<never, ThrowOnError>) {
    return (options?.client ?? this.client).post<GlobalDisposeResponses, unknown, ThrowOnError>({
      url: "/global/dispose",
      ...options,
    })
  }

  /**
   * Upgrade opencode
   *
   * Upgrade opencode to the specified version or latest if not specified.
   */
  public upgrade<ThrowOnError extends boolean = false>(
    parameters?: {
      target?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams([parameters], [{ args: [{ in: "body", key: "target" }] }])
    return (options?.client ?? this.client).post<GlobalUpgradeResponses, GlobalUpgradeErrors, ThrowOnError>({
      url: "/global/upgrade",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _config?: Config
  get config(): Config {
    return (this._config ??= new Config({ client: this.client }))
  }
}

export class Event extends HeyApiClient {
  /**
   * Subscribe to events
   *
   * Get events
   */
  public subscribe<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).sse.get<EventSubscribeResponses, unknown, ThrowOnError>({
      url: "/event",
      ...options,
      ...params,
    })
  }
}

export class Config2 extends HeyApiClient {
  /**
   * Get configuration
   *
   * Retrieve the current OpenCode configuration settings and preferences.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ConfigGetResponses, unknown, ThrowOnError>({
      url: "/config",
      ...options,
      ...params,
    })
  }

  /**
   * Update configuration
   *
   * Update OpenCode configuration settings and preferences.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      config?: Config3
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "config", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<ConfigUpdateResponses, ConfigUpdateErrors, ThrowOnError>({
      url: "/config",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * List config providers
   *
   * Get a list of all configured AI providers and their default models.
   */
  public providers<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ConfigProvidersResponses, unknown, ThrowOnError>({
      url: "/config/providers",
      ...options,
      ...params,
    })
  }
}

export class Console extends HeyApiClient {
  /**
   * Get active Console provider metadata
   *
   * Get the active Console org name and the set of provider IDs managed by that Console org.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalConsoleGetResponses,
      ExperimentalConsoleGetErrors,
      ThrowOnError
    >({
      url: "/experimental/console",
      ...options,
      ...params,
    })
  }

  /**
   * List switchable Console orgs
   *
   * Get the available Console orgs across logged-in accounts, including the current active org.
   */
  public listOrgs<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<
      ExperimentalConsoleListOrgsResponses,
      ExperimentalConsoleListOrgsErrors,
      ThrowOnError
    >({
      url: "/experimental/console/orgs",
      ...options,
      ...params,
    })
  }

  /**
   * Switch active Console org
   *
   * Persist a new active Console account/org selection for the current local OpenCode state.
   */
  public switchOrg<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      accountID?: string
      orgID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "accountID" },
            { in: "body", key: "orgID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<ExperimentalConsoleSwitchOrgResponses, unknown, ThrowOnError>({
      url: "/experimental/console/switch",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Session extends HeyApiClient {
  /**
   * List sessions
   *
   * Get a list of all OpenCode sessions across projects, sorted by most recently updated. Archived sessions are excluded by default.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      roots?: boolean | "true" | "false"
      start?: number
      cursor?: number
      search?: string
      limit?: number
      archived?: boolean | "true" | "false"
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "cursor" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
            { in: "query", key: "archived" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ExperimentalSessionListResponses, unknown, ThrowOnError>({
      url: "/experimental/session",
      ...options,
      ...params,
    })
  }
}

export class Resource extends HeyApiClient {
  /**
   * Get MCP resources
   *
   * Get all available MCP resources from connected servers. Optionally filter by name.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ExperimentalResourceListResponses, unknown, ThrowOnError>({
      url: "/experimental/resource",
      ...options,
      ...params,
    })
  }
}

export class Adapter extends HeyApiClient {
  /**
   * List workspace adapters
   *
   * List all available workspace adapters for the current project.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ExperimentalWorkspaceAdapterListResponses, unknown, ThrowOnError>({
      url: "/experimental/workspace/adapter",
      ...options,
      ...params,
    })
  }
}

export class Workspace extends HeyApiClient {
  /**
   * List workspaces
   *
   * List all workspaces.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ExperimentalWorkspaceListResponses, unknown, ThrowOnError>({
      url: "/experimental/workspace",
      ...options,
      ...params,
    })
  }

  /**
   * Create workspace
   *
   * Create a workspace for the current project.
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      id?: string
      type?: string
      branch?: string | null
      extra?: unknown | null
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "id" },
            { in: "body", key: "type" },
            { in: "body", key: "branch" },
            { in: "body", key: "extra" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalWorkspaceCreateResponses,
      ExperimentalWorkspaceCreateErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Sync workspace list
   *
   * Register missing workspaces returned by workspace adapters.
   */
  public syncList<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<ExperimentalWorkspaceSyncListResponses, unknown, ThrowOnError>({
      url: "/experimental/workspace/sync-list",
      ...options,
      ...params,
    })
  }

  /**
   * Workspace status
   *
   * Get connection status for workspaces in the current project.
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ExperimentalWorkspaceStatusResponses, unknown, ThrowOnError>({
      url: "/experimental/workspace/status",
      ...options,
      ...params,
    })
  }

  /**
   * Remove workspace
   *
   * Remove an existing workspace.
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      id: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "id" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      ExperimentalWorkspaceRemoveResponses,
      ExperimentalWorkspaceRemoveErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/{id}",
      ...options,
      ...params,
    })
  }

  /**
   * Warp session into workspace
   *
   * Move a session's sync history into the target workspace, or detach it to the local project.
   */
  public warp<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      id?: string | null
      sessionID?: string
      copyChanges?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "id" },
            { in: "body", key: "sessionID" },
            { in: "body", key: "copyChanges" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ExperimentalWorkspaceWarpResponses,
      ExperimentalWorkspaceWarpErrors,
      ThrowOnError
    >({
      url: "/experimental/workspace/warp",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _adapter?: Adapter
  get adapter(): Adapter {
    return (this._adapter ??= new Adapter({ client: this.client }))
  }
}

export class Experimental extends HeyApiClient {
  private _console?: Console
  get console(): Console {
    return (this._console ??= new Console({ client: this.client }))
  }

  private _session?: Session
  get session(): Session {
    return (this._session ??= new Session({ client: this.client }))
  }

  private _resource?: Resource
  get resource(): Resource {
    return (this._resource ??= new Resource({ client: this.client }))
  }

  private _workspace?: Workspace
  get workspace(): Workspace {
    return (this._workspace ??= new Workspace({ client: this.client }))
  }
}

export class Tool extends HeyApiClient {
  /**
   * List tools
   *
   * Get a list of available tools with their JSON schema parameters for a specific provider and model combination.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      provider: string
      model: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "provider" },
            { in: "query", key: "model" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ToolListResponses, ToolListErrors, ThrowOnError>({
      url: "/experimental/tool",
      ...options,
      ...params,
    })
  }

  /**
   * List tool IDs
   *
   * Get a list of all available tool IDs, including both built-in tools and dynamically registered tools.
   */
  public ids<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ToolIdsResponses, ToolIdsErrors, ThrowOnError>({
      url: "/experimental/tool/ids",
      ...options,
      ...params,
    })
  }
}

export class Worktree extends HeyApiClient {
  /**
   * Remove worktree
   *
   * Remove a git worktree and delete its branch.
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeRemoveInput?: WorktreeRemoveInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeRemoveInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<WorktreeRemoveResponses, WorktreeRemoveErrors, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * List worktrees
   *
   * List all sandbox worktrees for the current project.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<WorktreeListResponses, unknown, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
    })
  }

  /**
   * Create worktree
   *
   * Create a new git worktree for the current project and run any configured startup scripts.
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeCreateInput?: WorktreeCreateInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeCreateInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<WorktreeCreateResponses, WorktreeCreateErrors, ThrowOnError>({
      url: "/experimental/worktree",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Reset worktree
   *
   * Reset a worktree branch to the primary default branch.
   */
  public reset<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      worktreeResetInput?: WorktreeResetInput
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "worktreeResetInput", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<WorktreeResetResponses, WorktreeResetErrors, ThrowOnError>({
      url: "/experimental/worktree/reset",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Find extends HeyApiClient {
  /**
   * Find text
   *
   * Search for text patterns across files in the project using ripgrep.
   */
  public text<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      pattern: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "pattern" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindTextResponses, unknown, ThrowOnError>({
      url: "/find",
      ...options,
      ...params,
    })
  }

  /**
   * Find files
   *
   * Search for files or directories by name or pattern in the project directory.
   */
  public files<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      query: string
      dirs?: "true" | "false"
      type?: "file" | "directory"
      limit?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
            { in: "query", key: "dirs" },
            { in: "query", key: "type" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindFilesResponses, unknown, ThrowOnError>({
      url: "/find/file",
      ...options,
      ...params,
    })
  }

  /**
   * Find symbols
   *
   * Search for workspace symbols like functions, classes, and variables using LSP.
   */
  public symbols<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      query: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "query" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FindSymbolsResponses, unknown, ThrowOnError>({
      url: "/find/symbol",
      ...options,
      ...params,
    })
  }
}

export class File extends HeyApiClient {
  /**
   * List files
   *
   * List files and directories in a specified path.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      path: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileListResponses, unknown, ThrowOnError>({
      url: "/file",
      ...options,
      ...params,
    })
  }

  /**
   * Read file
   *
   * Read the content of a specified file.
   */
  public read<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      path: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "path" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileReadResponses, unknown, ThrowOnError>({
      url: "/file/content",
      ...options,
      ...params,
    })
  }

  /**
   * Get file status
   *
   * Get the git status of all files in the project.
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FileStatusResponses, unknown, ThrowOnError>({
      url: "/file/status",
      ...options,
      ...params,
    })
  }
}

export class Instance extends HeyApiClient {
  /**
   * Dispose instance
   *
   * Clean up and dispose the current OpenCode instance, releasing all resources.
   */
  public dispose<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<InstanceDisposeResponses, unknown, ThrowOnError>({
      url: "/instance/dispose",
      ...options,
      ...params,
    })
  }
}

export class Path extends HeyApiClient {
  /**
   * Get paths
   *
   * Retrieve the current working directory and related path information for the OpenCode instance.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PathGetResponses, unknown, ThrowOnError>({
      url: "/path",
      ...options,
      ...params,
    })
  }
}

export class Diff extends HeyApiClient {
  /**
   * Get raw VCS diff
   *
   * Retrieve a raw patch for current uncommitted changes.
   */
  public raw<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsDiffRawResponses, unknown, ThrowOnError>({
      url: "/vcs/diff/raw",
      ...options,
      ...params,
    })
  }
}

export class Vcs extends HeyApiClient {
  /**
   * Get VCS info
   *
   * Retrieve version control system (VCS) information for the current project, such as git branch.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsGetResponses, unknown, ThrowOnError>({
      url: "/vcs",
      ...options,
      ...params,
    })
  }

  /**
   * Get VCS status
   *
   * Retrieve changed files in the current working tree without patches.
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsStatusResponses, unknown, ThrowOnError>({
      url: "/vcs/status",
      ...options,
      ...params,
    })
  }

  /**
   * Get VCS diff
   *
   * Retrieve the current git diff for the working tree or against the default branch.
   */
  public diff<ThrowOnError extends boolean = false>(
    parameters: {
      directory?: string
      workspace?: string
      mode: "git" | "branch"
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "mode" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<VcsDiffResponses, unknown, ThrowOnError>({
      url: "/vcs/diff",
      ...options,
      ...params,
    })
  }

  /**
   * Apply VCS patch
   *
   * Apply a raw patch to the current working tree.
   */
  public apply<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      patch?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "patch" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<VcsApplyResponses, VcsApplyErrors, ThrowOnError>({
      url: "/vcs/apply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _diff?: Diff
  get diff2(): Diff {
    return (this._diff ??= new Diff({ client: this.client }))
  }
}

export class Command extends HeyApiClient {
  /**
   * List commands
   *
   * Get a list of all available commands in the OpenCode system.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<CommandListResponses, unknown, ThrowOnError>({
      url: "/command",
      ...options,
      ...params,
    })
  }
}

export class Lsp extends HeyApiClient {
  /**
   * Get LSP status
   *
   * Get LSP server status
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<LspStatusResponses, unknown, ThrowOnError>({
      url: "/lsp",
      ...options,
      ...params,
    })
  }
}

export class Formatter extends HeyApiClient {
  /**
   * Get formatter status
   *
   * Get formatter status
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<FormatterStatusResponses, unknown, ThrowOnError>({
      url: "/formatter",
      ...options,
      ...params,
    })
  }
}

export class Auth2 extends HeyApiClient {
  /**
   * Remove MCP OAuth
   *
   * Remove OAuth credentials for an MCP server.
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<McpAuthRemoveResponses, McpAuthRemoveErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }

  /**
   * Start MCP OAuth
   *
   * Start OAuth authentication flow for a Model Context Protocol (MCP) server.
   */
  public start<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthStartResponses, McpAuthStartErrors, ThrowOnError>({
      url: "/mcp/{name}/auth",
      ...options,
      ...params,
    })
  }

  /**
   * Complete MCP OAuth
   *
   * Complete OAuth authentication for a Model Context Protocol (MCP) server using the authorization code.
   */
  public callback<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
      code?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthCallbackResponses, McpAuthCallbackErrors, ThrowOnError>({
      url: "/mcp/{name}/auth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Authenticate MCP OAuth
   *
   * Start OAuth flow and wait for callback (opens browser).
   */
  public authenticate<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAuthAuthenticateResponses, McpAuthAuthenticateErrors, ThrowOnError>(
      {
        url: "/mcp/{name}/auth/authenticate",
        ...options,
        ...params,
      },
    )
  }
}

export class Mcp extends HeyApiClient {
  /**
   * Get MCP status
   *
   * Get the status of all Model Context Protocol (MCP) servers.
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<McpStatusResponses, unknown, ThrowOnError>({
      url: "/mcp",
      ...options,
      ...params,
    })
  }

  /**
   * Add MCP server
   *
   * Dynamically add a new Model Context Protocol (MCP) server to the system.
   */
  public add<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      name?: string
      config?: McpLocalConfig | McpRemoteConfig
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "config" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpAddResponses, McpAddErrors, ThrowOnError>({
      url: "/mcp",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Connect an MCP server.
   */
  public connect<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpConnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/connect",
      ...options,
      ...params,
    })
  }

  /**
   * Disconnect an MCP server.
   */
  public disconnect<ThrowOnError extends boolean = false>(
    parameters: {
      name: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "name" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<McpDisconnectResponses, unknown, ThrowOnError>({
      url: "/mcp/{name}/disconnect",
      ...options,
      ...params,
    })
  }

  private _auth?: Auth2
  get auth(): Auth2 {
    return (this._auth ??= new Auth2({ client: this.client }))
  }
}

export class Project extends HeyApiClient {
  /**
   * List all projects
   *
   * Get a list of projects that have been opened with OpenCode.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProjectListResponses, unknown, ThrowOnError>({
      url: "/project",
      ...options,
      ...params,
    })
  }

  /**
   * Get current project
   *
   * Retrieve the currently active project that OpenCode is working with.
   */
  public current<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProjectCurrentResponses, unknown, ThrowOnError>({
      url: "/project/current",
      ...options,
      ...params,
    })
  }

  /**
   * Initialize git repository
   *
   * Create a git repository for the current project and return the refreshed project info.
   */
  public initGit<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<ProjectInitGitResponses, unknown, ThrowOnError>({
      url: "/project/git/init",
      ...options,
      ...params,
    })
  }

  /**
   * Update project
   *
   * Update project properties such as name, icon, and commands.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      projectID: string
      directory?: string
      workspace?: string
      name?: string
      icon?: {
        url?: string
        override?: string
        color?: string
      }
      commands?: {
        /**
         * Startup script to run when creating a new workspace (worktree)
         */
        start?: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "projectID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "name" },
            { in: "body", key: "icon" },
            { in: "body", key: "commands" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<ProjectUpdateResponses, ProjectUpdateErrors, ThrowOnError>({
      url: "/project/{projectID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Pty extends HeyApiClient {
  /**
   * List available shells
   *
   * Get a list of available shells on the system.
   */
  public shells<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyShellsResponses, unknown, ThrowOnError>({
      url: "/pty/shells",
      ...options,
      ...params,
    })
  }

  /**
   * List PTY sessions
   *
   * Get a list of all active pseudo-terminal (PTY) sessions managed by OpenCode.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyListResponses, unknown, ThrowOnError>({
      url: "/pty",
      ...options,
      ...params,
    })
  }

  /**
   * Create PTY session
   *
   * Create a new pseudo-terminal (PTY) session for running shell commands and processes.
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      command?: string
      args?: Array<string>
      cwd?: string
      title?: string
      env?: {
        [key: string]: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
            { in: "body", key: "args" },
            { in: "body", key: "cwd" },
            { in: "body", key: "title" },
            { in: "body", key: "env" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PtyCreateResponses, PtyCreateErrors, ThrowOnError>({
      url: "/pty",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Remove PTY session
   *
   * Remove and terminate a specific pseudo-terminal (PTY) session.
   */
  public remove<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<PtyRemoveResponses, PtyRemoveErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * Get PTY session
   *
   * Retrieve detailed information about a specific pseudo-terminal (PTY) session.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyGetResponses, PtyGetErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
    })
  }

  /**
   * Update PTY session
   *
   * Update properties of an existing pseudo-terminal (PTY) session.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
      title?: string
      size?: {
        rows: number
        cols: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "size" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).put<PtyUpdateResponses, PtyUpdateErrors, ThrowOnError>({
      url: "/pty/{ptyID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Create PTY WebSocket token
   *
   * Create a short-lived ticket for opening a PTY WebSocket connection.
   */
  public connectToken<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PtyConnectTokenResponses, PtyConnectTokenErrors, ThrowOnError>({
      url: "/pty/{ptyID}/connect-token",
      ...options,
      ...params,
    })
  }

  /**
   * Connect to PTY session
   *
   * Establish a WebSocket connection to interact with a pseudo-terminal (PTY) session in real-time.
   */
  public connect<ThrowOnError extends boolean = false>(
    parameters: {
      ptyID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "ptyID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PtyConnectResponses, PtyConnectErrors, ThrowOnError>({
      url: "/pty/{ptyID}/connect",
      ...options,
      ...params,
    })
  }
}

export class Question extends HeyApiClient {
  /**
   * List pending questions
   *
   * Get all pending question requests across all sessions.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<QuestionListResponses, unknown, ThrowOnError>({
      url: "/question",
      ...options,
      ...params,
    })
  }

  /**
   * Reply to question request
   *
   * Provide answers to a question request from the AI assistant.
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
      answers?: Array<QuestionAnswer>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "answers" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<QuestionReplyResponses, QuestionReplyErrors, ThrowOnError>({
      url: "/question/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Reject question request
   *
   * Reject a question request from the AI assistant.
   */
  public reject<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<QuestionRejectResponses, QuestionRejectErrors, ThrowOnError>({
      url: "/question/{requestID}/reject",
      ...options,
      ...params,
    })
  }
}

export class Permission extends HeyApiClient {
  /**
   * List pending permissions
   *
   * Get all pending permission requests across all sessions.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<PermissionListResponses, unknown, ThrowOnError>({
      url: "/permission",
      ...options,
      ...params,
    })
  }

  /**
   * Respond to permission request
   *
   * Approve or ask a permission request from the AI assistant.
   */
  public reply<ThrowOnError extends boolean = false>(
    parameters: {
      requestID: string
      directory?: string
      workspace?: string
      reply?: "once" | "always" | "reject"
      message?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "requestID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "reply" },
            { in: "body", key: "message" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PermissionReplyResponses, PermissionReplyErrors, ThrowOnError>({
      url: "/permission/{requestID}/reply",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Respond to permission
   *
   * Approve or ask a permission request from the AI assistant.
   *
   * @deprecated
   */
  public respond<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      permissionID: string
      directory?: string
      workspace?: string
      response?: "once" | "always" | "reject"
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "permissionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "response" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<PermissionRespondResponses, PermissionRespondErrors, ThrowOnError>({
      url: "/session/{sessionID}/permissions/{permissionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Oauth extends HeyApiClient {
  /**
   * Start OAuth authorization
   *
   * Start the OAuth authorization flow for a provider.
   */
  public authorize<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      directory?: string
      workspace?: string
      method?: number
      inputs?: {
        [key: string]: string
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
            { in: "body", key: "inputs" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ProviderOauthAuthorizeResponses,
      ProviderOauthAuthorizeErrors,
      ThrowOnError
    >({
      url: "/provider/{providerID}/oauth/authorize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Handle OAuth callback
   *
   * Handle the OAuth callback from a provider after user authorization.
   */
  public callback<ThrowOnError extends boolean = false>(
    parameters: {
      providerID: string
      directory?: string
      workspace?: string
      method?: number
      code?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "providerID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "method" },
            { in: "body", key: "code" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<
      ProviderOauthCallbackResponses,
      ProviderOauthCallbackErrors,
      ThrowOnError
    >({
      url: "/provider/{providerID}/oauth/callback",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Provider extends HeyApiClient {
  /**
   * List providers
   *
   * Get a list of all available AI providers, including both available and connected ones.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProviderListResponses, unknown, ThrowOnError>({
      url: "/provider",
      ...options,
      ...params,
    })
  }

  /**
   * Get provider auth methods
   *
   * Retrieve available authentication methods for all AI providers.
   */
  public auth<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<ProviderAuthResponses, unknown, ThrowOnError>({
      url: "/provider/auth",
      ...options,
      ...params,
    })
  }

  private _oauth?: Oauth
  get oauth(): Oauth {
    return (this._oauth ??= new Oauth({ client: this.client }))
  }
}

export class Session2 extends HeyApiClient {
  /**
   * List sessions
   *
   * Get a list of all OpenCode sessions, sorted by most recently updated.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      scope?: "project"
      path?: string
      roots?: boolean | "true" | "false"
      start?: number
      search?: string
      limit?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "scope" },
            { in: "query", key: "path" },
            { in: "query", key: "roots" },
            { in: "query", key: "start" },
            { in: "query", key: "search" },
            { in: "query", key: "limit" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionListResponses, unknown, ThrowOnError>({
      url: "/session",
      ...options,
      ...params,
    })
  }

  /**
   * Create session
   *
   * Create a new OpenCode session for interacting with AI assistants and managing conversations.
   */
  public create<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      parentID?: string
      title?: string
      agent?: string
      model?: {
        id: string
        providerID: string
        variant?: string
      }
      permission?: PermissionRuleset
      workspaceID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "parentID" },
            { in: "body", key: "title" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "permission" },
            { in: "body", key: "workspaceID" },
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

  /**
   * Get session status
   *
   * Retrieve the current status of all sessions, including active, idle, and completed states.
   */
  public status<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionStatusResponses, SessionStatusErrors, ThrowOnError>({
      url: "/session/status",
      ...options,
      ...params,
    })
  }

  /**
   * Delete session
   *
   * Delete a session and permanently remove all associated data, including messages and history.
   */
  public delete<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<SessionDeleteResponses, SessionDeleteErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }

  /**
   * Get session
   *
   * Retrieve detailed information about a specific OpenCode session.
   */
  public get<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionGetResponses, SessionGetErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
    })
  }

  /**
   * Update session
   *
   * Update properties of an existing session, such as title or other metadata.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      title?: string
      permission?: PermissionRuleset
      time?: {
        archived?: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "permission" },
            { in: "body", key: "time" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<SessionUpdateResponses, SessionUpdateErrors, ThrowOnError>({
      url: "/session/{sessionID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Get session children
   *
   * Retrieve all child sessions that were forked from the specified parent session.
   */
  public children<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionChildrenResponses, SessionChildrenErrors, ThrowOnError>({
      url: "/session/{sessionID}/children",
      ...options,
      ...params,
    })
  }

  /**
   * Get session todos
   *
   * Retrieve the todo list associated with a specific session, showing tasks and action items.
   */
  public todo<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionTodoResponses, SessionTodoErrors, ThrowOnError>({
      url: "/session/{sessionID}/todo",
      ...options,
      ...params,
    })
  }

  /**
   * Get message diff
   *
   * Get the file changes (diff) that resulted from a specific user message in the session.
   */
  public diff<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionDiffResponses, unknown, ThrowOnError>({
      url: "/session/{sessionID}/diff",
      ...options,
      ...params,
    })
  }

  /**
   * Get session messages
   *
   * Retrieve all messages in a session, including user prompts and AI responses.
   */
  public messages<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      limit?: number
      before?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "query", key: "limit" },
            { in: "query", key: "before" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionMessagesResponses, SessionMessagesErrors, ThrowOnError>({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
    })
  }

  /**
   * Send message
   *
   * Create and send a new message to a session, streaming the AI response.
   */
  public prompt<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      model?: {
        providerID: string
        modelID: string
      }
      agent?: string
      noReply?: boolean
      tools?: {
        [key: string]: boolean
      }
      format?: OutputFormat
      system?: string
      variant?: string
      parts?: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionPromptResponses, SessionPromptErrors, ThrowOnError>({
      url: "/session/{sessionID}/message",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Delete message
   *
   * Permanently delete a specific message and all of its parts from a session without reverting file changes.
   */
  public deleteMessage<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<
      SessionDeleteMessageResponses,
      SessionDeleteMessageErrors,
      ThrowOnError
    >({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }

  /**
   * Get message
   *
   * Retrieve a specific message from a session by its message ID.
   */
  public message<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<SessionMessageResponses, SessionMessageErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}",
      ...options,
      ...params,
    })
  }

  /**
   * Fork session
   *
   * Create a new session by forking an existing session at a specific message point.
   */
  public fork<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionForkResponses, SessionForkErrors, ThrowOnError>({
      url: "/session/{sessionID}/fork",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Abort session
   *
   * Abort an active session and stop any ongoing AI processing or command execution.
   */
  public abort<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionAbortResponses, SessionAbortErrors, ThrowOnError>({
      url: "/session/{sessionID}/abort",
      ...options,
      ...params,
    })
  }

  /**
   * Initialize session
   *
   * Analyze the current application and create an AGENTS.md file with project-specific agent configurations.
   */
  public init<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      modelID?: string
      providerID?: string
      messageID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "modelID" },
            { in: "body", key: "providerID" },
            { in: "body", key: "messageID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionInitResponses, SessionInitErrors, ThrowOnError>({
      url: "/session/{sessionID}/init",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Unshare session
   *
   * Remove the shareable link for a session, making it private again.
   */
  public unshare<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<SessionUnshareResponses, SessionUnshareErrors, ThrowOnError>({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }

  /**
   * Share session
   *
   * Create a shareable link for a session, allowing others to view the conversation.
   */
  public share<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionShareResponses, SessionShareErrors, ThrowOnError>({
      url: "/session/{sessionID}/share",
      ...options,
      ...params,
    })
  }

  /**
   * Summarize session
   *
   * Generate a concise summary of the session using AI compaction to preserve key information.
   */
  public summarize<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      providerID?: string
      modelID?: string
      auto?: boolean
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "providerID" },
            { in: "body", key: "modelID" },
            { in: "body", key: "auto" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionSummarizeResponses, SessionSummarizeErrors, ThrowOnError>({
      url: "/session/{sessionID}/summarize",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Send async message
   *
   * Create and send a new message to a session asynchronously, starting the session if needed and returning immediately.
   */
  public promptAsync<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      model?: {
        providerID: string
        modelID: string
      }
      agent?: string
      noReply?: boolean
      tools?: {
        [key: string]: boolean
      }
      format?: OutputFormat
      system?: string
      variant?: string
      parts?: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "model" },
            { in: "body", key: "agent" },
            { in: "body", key: "noReply" },
            { in: "body", key: "tools" },
            { in: "body", key: "format" },
            { in: "body", key: "system" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionPromptAsyncResponses, SessionPromptAsyncErrors, ThrowOnError>({
      url: "/session/{sessionID}/prompt_async",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Send command
   *
   * Send a new command to a session for execution by the AI assistant.
   */
  public command<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      agent?: string
      model?: string
      arguments?: string
      command?: string
      variant?: string
      parts?: Array<{
        id?: string
        type: "file"
        mime: string
        filename?: string
        url: string
        source?: FilePartSource
      }>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "arguments" },
            { in: "body", key: "command" },
            { in: "body", key: "variant" },
            { in: "body", key: "parts" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionCommandResponses, SessionCommandErrors, ThrowOnError>({
      url: "/session/{sessionID}/command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Run shell command
   *
   * Execute a shell command within the session context and return the AI's response.
   */
  public shell<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      agent?: string
      model?: {
        providerID: string
        modelID: string
      }
      command?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "agent" },
            { in: "body", key: "model" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionShellResponses, SessionShellErrors, ThrowOnError>({
      url: "/session/{sessionID}/shell",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Revert message
   *
   * Revert a specific message in a session, undoing its effects and restoring the previous state.
   */
  public revert<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      messageID?: string
      partID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "messageID" },
            { in: "body", key: "partID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionRevertResponses, SessionRevertErrors, ThrowOnError>({
      url: "/session/{sessionID}/revert",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Restore reverted messages
   *
   * Restore all previously reverted messages in a session.
   */
  public unrevert<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SessionUnrevertResponses, SessionUnrevertErrors, ThrowOnError>({
      url: "/session/{sessionID}/unrevert",
      ...options,
      ...params,
    })
  }
}

export class Part extends HeyApiClient {
  /**
   * Delete a part from a message.
   */
  public delete<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      partID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).delete<PartDeleteResponses, PartDeleteErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
    })
  }

  /**
   * Update a part in a message.
   */
  public update<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      messageID: string
      partID: string
      directory?: string
      workspace?: string
      part?: Part2
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "path", key: "messageID" },
            { in: "path", key: "partID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "part", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).patch<PartUpdateResponses, PartUpdateErrors, ThrowOnError>({
      url: "/session/{sessionID}/message/{messageID}/part/{partID}",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class History extends HeyApiClient {
  /**
   * List sync events
   *
   * List sync events for all aggregates. Keys are aggregate IDs the client already knows about, values are the last known sequence ID. Events with seq > value are returned for those aggregates. Aggregates not listed in the input get their full history.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: {
        [key: string]: number
      }
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncHistoryListResponses, SyncHistoryListErrors, ThrowOnError>({
      url: "/sync/history",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Sync extends HeyApiClient {
  /**
   * Start workspace sync
   *
   * Start sync loops for workspaces in the current project that have active sessions.
   */
  public start<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncStartResponses, unknown, ThrowOnError>({
      url: "/sync/start",
      ...options,
      ...params,
    })
  }

  /**
   * Replay sync events
   *
   * Validate and replay a complete sync event history.
   */
  public replay<ThrowOnError extends boolean = false>(
    parameters?: {
      query_directory?: string
      workspace?: string
      body_directory?: string
      events?: Array<{
        id: string
        aggregateID: string
        seq: number
        type: string
        data: {
          [key: string]: unknown
        }
      }>
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            {
              in: "query",
              key: "query_directory",
              map: "directory",
            },
            { in: "query", key: "workspace" },
            {
              in: "body",
              key: "body_directory",
              map: "directory",
            },
            { in: "body", key: "events" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncReplayResponses, SyncReplayErrors, ThrowOnError>({
      url: "/sync/replay",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Steal session into workspace
   *
   * Update a session to belong to the current workspace through the sync event system.
   */
  public steal<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      sessionID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "sessionID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<SyncStealResponses, SyncStealErrors, ThrowOnError>({
      url: "/sync/steal",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _history?: History
  get history(): History {
    return (this._history ??= new History({ client: this.client }))
  }
}

export class Session3 extends HeyApiClient {
  /**
   * List v2 sessions
   *
   * Retrieve sessions in the requested order. Items keep that order across pages; use cursor.next or cursor.previous to move through the ordered list.
   */
  public list<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionListResponses, V2SessionListErrors, ThrowOnError>({
      url: "/api/session",
      ...options,
      ...params,
    })
  }

  /**
   * Send v2 message
   *
   * Create a v2 session message and queue it for the agent loop.
   */
  public prompt<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
      prompt?: Prompt
      delivery?: SessionDelivery
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "prompt" },
            { in: "body", key: "delivery" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2SessionPromptResponses, unknown, ThrowOnError>({
      url: "/api/session/{sessionID}/prompt",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Compact v2 session
   *
   * Compact a v2 session conversation.
   */
  public compact<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2SessionCompactResponses, unknown, ThrowOnError>({
      url: "/api/session/{sessionID}/compact",
      ...options,
      ...params,
    })
  }

  /**
   * Wait for v2 session
   *
   * Wait for a v2 session agent loop to become idle.
   */
  public wait<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<V2SessionWaitResponses, unknown, ThrowOnError>({
      url: "/api/session/{sessionID}/wait",
      ...options,
      ...params,
    })
  }

  /**
   * Get v2 session context
   *
   * Retrieve the active context messages for a v2 session (all messages after the last compaction).
   */
  public context<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionContextResponses, unknown, ThrowOnError>({
      url: "/api/session/{sessionID}/context",
      ...options,
      ...params,
    })
  }

  /**
   * Get v2 session messages
   *
   * Retrieve projected v2 messages for a session. Items keep the requested order across pages; use cursor.next or cursor.previous to move through the ordered timeline.
   */
  public messages<ThrowOnError extends boolean = false>(
    parameters: {
      sessionID: string
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "path", key: "sessionID" },
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<V2SessionMessagesResponses, V2SessionMessagesErrors, ThrowOnError>({
      url: "/api/session/{sessionID}/message",
      ...options,
      ...params,
    })
  }
}

export class V2 extends HeyApiClient {
  private _session?: Session3
  get session(): Session3 {
    return (this._session ??= new Session3({ client: this.client }))
  }
}

export class Control extends HeyApiClient {
  /**
   * Get next TUI request
   *
   * Retrieve the next TUI request from the queue for processing.
   */
  public next<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).get<TuiControlNextResponses, unknown, ThrowOnError>({
      url: "/tui/control/next",
      ...options,
      ...params,
    })
  }

  /**
   * Submit TUI response
   *
   * Submit a response to the TUI request queue to complete a pending request.
   */
  public response<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: unknown
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiControlResponseResponses, unknown, ThrowOnError>({
      url: "/tui/control/response",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }
}

export class Tui extends HeyApiClient {
  /**
   * Append TUI prompt
   *
   * Append prompt to the TUI.
   */
  public appendPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      text?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "text" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiAppendPromptResponses, TuiAppendPromptErrors, ThrowOnError>({
      url: "/tui/append-prompt",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Open help dialog
   *
   * Open the help dialog in the TUI to display user assistance information.
   */
  public openHelp<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenHelpResponses, unknown, ThrowOnError>({
      url: "/tui/open-help",
      ...options,
      ...params,
    })
  }

  /**
   * Open sessions dialog
   *
   * Open the session dialog.
   */
  public openSessions<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenSessionsResponses, unknown, ThrowOnError>({
      url: "/tui/open-sessions",
      ...options,
      ...params,
    })
  }

  /**
   * Open themes dialog
   *
   * Open the theme dialog.
   */
  public openThemes<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenThemesResponses, unknown, ThrowOnError>({
      url: "/tui/open-themes",
      ...options,
      ...params,
    })
  }

  /**
   * Open models dialog
   *
   * Open the model dialog.
   */
  public openModels<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiOpenModelsResponses, unknown, ThrowOnError>({
      url: "/tui/open-models",
      ...options,
      ...params,
    })
  }

  /**
   * Submit TUI prompt
   *
   * Submit the prompt.
   */
  public submitPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiSubmitPromptResponses, unknown, ThrowOnError>({
      url: "/tui/submit-prompt",
      ...options,
      ...params,
    })
  }

  /**
   * Clear TUI prompt
   *
   * Clear the prompt.
   */
  public clearPrompt<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiClearPromptResponses, unknown, ThrowOnError>({
      url: "/tui/clear-prompt",
      ...options,
      ...params,
    })
  }

  /**
   * Execute TUI command
   *
   * Execute a TUI command.
   */
  public executeCommand<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      command?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "command" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiExecuteCommandResponses, TuiExecuteCommandErrors, ThrowOnError>({
      url: "/tui/execute-command",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Show TUI toast
   *
   * Show a toast notification in the TUI.
   */
  public showToast<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      title?: string
      message?: string
      variant?: "info" | "success" | "warning" | "error"
      duration?: number
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "title" },
            { in: "body", key: "message" },
            { in: "body", key: "variant" },
            { in: "body", key: "duration" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiShowToastResponses, unknown, ThrowOnError>({
      url: "/tui/show-toast",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Publish TUI event
   *
   * Publish a TUI event.
   */
  public publish<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      body?: EventTuiPromptAppend2 | EventTuiCommandExecute2 | EventTuiToastShow2 | EventTuiSessionSelect2
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { key: "body", map: "body" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiPublishResponses, TuiPublishErrors, ThrowOnError>({
      url: "/tui/publish",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  /**
   * Select session
   *
   * Navigate the TUI to display the specified session.
   */
  public selectSession<ThrowOnError extends boolean = false>(
    parameters?: {
      directory?: string
      workspace?: string
      sessionID?: string
    },
    options?: Options<never, ThrowOnError>,
  ) {
    const params = buildClientParams(
      [parameters],
      [
        {
          args: [
            { in: "query", key: "directory" },
            { in: "query", key: "workspace" },
            { in: "body", key: "sessionID" },
          ],
        },
      ],
    )
    return (options?.client ?? this.client).post<TuiSelectSessionResponses, TuiSelectSessionErrors, ThrowOnError>({
      url: "/tui/select-session",
      ...options,
      ...params,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        ...params.headers,
      },
    })
  }

  private _control?: Control
  get control(): Control {
    return (this._control ??= new Control({ client: this.client }))
  }
}

export class OpencodeClient extends HeyApiClient {
  public static readonly __registry = new HeyApiRegistry<OpencodeClient>()

  constructor(args?: { client?: Client; key?: string }) {
    super(args)
    OpencodeClient.__registry.set(this, args?.key)
  }

  private _auth?: Auth
  get auth(): Auth {
    return (this._auth ??= new Auth({ client: this.client }))
  }

  private _app?: App
  get app(): App {
    return (this._app ??= new App({ client: this.client }))
  }

  private _global?: Global
  get global(): Global {
    return (this._global ??= new Global({ client: this.client }))
  }

  private _event?: Event
  get event(): Event {
    return (this._event ??= new Event({ client: this.client }))
  }

  private _config?: Config2
  get config(): Config2 {
    return (this._config ??= new Config2({ client: this.client }))
  }

  private _experimental?: Experimental
  get experimental(): Experimental {
    return (this._experimental ??= new Experimental({ client: this.client }))
  }

  private _tool?: Tool
  get tool(): Tool {
    return (this._tool ??= new Tool({ client: this.client }))
  }

  private _worktree?: Worktree
  get worktree(): Worktree {
    return (this._worktree ??= new Worktree({ client: this.client }))
  }

  private _find?: Find
  get find(): Find {
    return (this._find ??= new Find({ client: this.client }))
  }

  private _file?: File
  get file(): File {
    return (this._file ??= new File({ client: this.client }))
  }

  private _instance?: Instance
  get instance(): Instance {
    return (this._instance ??= new Instance({ client: this.client }))
  }

  private _path?: Path
  get path(): Path {
    return (this._path ??= new Path({ client: this.client }))
  }

  private _vcs?: Vcs
  get vcs(): Vcs {
    return (this._vcs ??= new Vcs({ client: this.client }))
  }

  private _command?: Command
  get command(): Command {
    return (this._command ??= new Command({ client: this.client }))
  }

  private _lsp?: Lsp
  get lsp(): Lsp {
    return (this._lsp ??= new Lsp({ client: this.client }))
  }

  private _formatter?: Formatter
  get formatter(): Formatter {
    return (this._formatter ??= new Formatter({ client: this.client }))
  }

  private _mcp?: Mcp
  get mcp(): Mcp {
    return (this._mcp ??= new Mcp({ client: this.client }))
  }

  private _project?: Project
  get project(): Project {
    return (this._project ??= new Project({ client: this.client }))
  }

  private _pty?: Pty
  get pty(): Pty {
    return (this._pty ??= new Pty({ client: this.client }))
  }

  private _question?: Question
  get question(): Question {
    return (this._question ??= new Question({ client: this.client }))
  }

  private _permission?: Permission
  get permission(): Permission {
    return (this._permission ??= new Permission({ client: this.client }))
  }

  private _provider?: Provider
  get provider(): Provider {
    return (this._provider ??= new Provider({ client: this.client }))
  }

  private _session?: Session2
  get session(): Session2 {
    return (this._session ??= new Session2({ client: this.client }))
  }

  private _part?: Part
  get part(): Part {
    return (this._part ??= new Part({ client: this.client }))
  }

  private _sync?: Sync
  get sync(): Sync {
    return (this._sync ??= new Sync({ client: this.client }))
  }

  private _v2?: V2
  get v2(): V2 {
    return (this._v2 ??= new V2({ client: this.client }))
  }

  private _tui?: Tui
  get tui(): Tui {
    return (this._tui ??= new Tui({ client: this.client }))
  }
}
````

## File: packages/sdk/js/src/v2/gen/types.gen.ts
````typescript
// This file is auto-generated by @hey-api/openapi-ts

export type ClientOptions = {
  baseUrl: `${string}://${string}` | (string & {})
}

export type Event =
  | EventServerInstanceDisposed
  | EventFileEdited
  | EventFileWatcherUpdated
  | EventLspClientDiagnostics
  | EventLspUpdated
  | EventMessagePartDelta
  | EventPermissionAsked
  | EventPermissionReplied
  | EventSessionDiff
  | EventSessionError
  | EventInstallationUpdated
  | EventInstallationUpdateAvailable
  | EventQuestionAsked
  | EventQuestionReplied
  | EventQuestionRejected
  | EventTodoUpdated
  | EventSessionStatus
  | EventSessionIdle
  | EventSessionCompacted
  | EventTuiPromptAppend
  | EventTuiCommandExecute
  | EventTuiToastShow1
  | EventTuiSessionSelect
  | EventMcpToolsChanged
  | EventMcpBrowserOpenFailed
  | EventCommandExecuted
  | EventProjectUpdated
  | EventVcsBranchUpdated
  | EventWorkspaceReady
  | EventWorkspaceFailed
  | EventWorkspaceStatus
  | EventWorktreeReady
  | EventWorktreeFailed
  | EventPtyCreated
  | EventPtyUpdated
  | EventPtyExited
  | EventPtyDeleted
  | EventMessageUpdated
  | EventMessageRemoved
  | EventMessagePartUpdated
  | EventMessagePartRemoved
  | EventSessionCreated
  | EventSessionUpdated
  | EventSessionDeleted
  | EventSessionNextAgentSwitched
  | EventSessionNextModelSwitched
  | EventSessionNextPrompted
  | EventSessionNextSynthetic
  | EventSessionNextShellStarted
  | EventSessionNextShellEnded
  | EventSessionNextStepStarted
  | EventSessionNextStepEnded
  | EventSessionNextStepFailed
  | EventSessionNextTextStarted
  | EventSessionNextTextDelta
  | EventSessionNextTextEnded
  | EventSessionNextReasoningStarted
  | EventSessionNextReasoningDelta
  | EventSessionNextReasoningEnded
  | EventSessionNextToolInputStarted
  | EventSessionNextToolInputDelta
  | EventSessionNextToolInputEnded
  | EventSessionNextToolCalled
  | EventSessionNextToolProgress
  | EventSessionNextToolSuccess
  | EventSessionNextToolFailed
  | EventSessionNextRetried
  | EventSessionNextCompactionStarted
  | EventSessionNextCompactionDelta
  | EventSessionNextCompactionEnded
  | EventServerConnected
  | EventGlobalDisposed

export type OAuth = {
  type: "oauth"
  refresh: string
  access: string
  expires: number
  accountId?: string
  enterpriseUrl?: string
}

export type ApiAuth = {
  type: "api"
  key: string
  metadata?: {
    [key: string]: string
  }
}

export type WellKnownAuth = {
  type: "wellknown"
  key: string
  token: string
}

export type Auth = OAuth | ApiAuth | WellKnownAuth

export type PermissionRequest = {
  id: string
  sessionID: string
  permission: string
  patterns: Array<string>
  metadata: {
    [key: string]: unknown
  }
  always: Array<string>
  tool?: {
    messageID: string
    callID: string
  }
}

export type SnapshotFileDiff = {
  file?: string
  patch?: string
  additions: number
  deletions: number
  status?: "added" | "deleted" | "modified"
}

export type ProviderAuthError = {
  name: "ProviderAuthError"
  data: {
    providerID: string
    message: string
  }
}

export type UnknownError = {
  name: "UnknownError"
  data: {
    message: string
  }
}

export type MessageOutputLengthError = {
  name: "MessageOutputLengthError"
  data: {
    [key: string]: unknown
  }
}

export type MessageAbortedError = {
  name: "MessageAbortedError"
  data: {
    message: string
  }
}

export type StructuredOutputError = {
  name: "StructuredOutputError"
  data: {
    message: string
    retries: number
  }
}

export type ContextOverflowError = {
  name: "ContextOverflowError"
  data: {
    message: string
    responseBody?: string
  }
}

export type ApiError = {
  name: "APIError"
  data: {
    message: string
    statusCode?: number
    isRetryable: boolean
    responseHeaders?: {
      [key: string]: string
    }
    responseBody?: string
    metadata?: {
      [key: string]: string
    }
  }
}

export type QuestionOption = {
  /**
   * Display text (1-5 words, concise)
   */
  label: string
  /**
   * Explanation of choice
   */
  description: string
}

export type QuestionInfo = {
  /**
   * Complete question
   */
  question: string
  /**
   * Very short label (max 30 chars)
   */
  header: string
  /**
   * Available choices
   */
  options: Array<QuestionOption>
  multiple?: boolean
  custom?: boolean
}

export type QuestionTool = {
  messageID: string
  callID: string
}

export type QuestionRequest = {
  id: string
  sessionID: string
  /**
   * Questions to ask
   */
  questions: Array<QuestionInfo>
  tool?: QuestionTool
}

export type QuestionAnswer = Array<string>

export type QuestionReplied = {
  sessionID: string
  requestID: string
  answers: Array<QuestionAnswer>
}

export type QuestionRejected = {
  sessionID: string
  requestID: string
}

export type Todo = {
  /**
   * Brief description of the task
   */
  content: string
  /**
   * Current status of the task: pending, in_progress, completed, cancelled
   */
  status: string
  /**
   * Priority level of the task: high, medium, low
   */
  priority: string
}

export type SessionStatus =
  | {
      type: "idle"
    }
  | {
      type: "retry"
      attempt: number
      message: string
      action?: {
        reason: string
        provider: string
        title: string
        message: string
        label: string
        link?: string
      }
      next: number
    }
  | {
      type: "busy"
    }

export type EventTuiPromptAppend = {
  id: string
  type: "tui.prompt.append"
  properties: {
    text: string
  }
}

export type EventTuiCommandExecute = {
  id: string
  type: "tui.command.execute"
  properties: {
    command:
      | "session.list"
      | "session.new"
      | "session.share"
      | "session.interrupt"
      | "session.compact"
      | "session.page.up"
      | "session.page.down"
      | "session.line.up"
      | "session.line.down"
      | "session.half.page.up"
      | "session.half.page.down"
      | "session.first"
      | "session.last"
      | "prompt.clear"
      | "prompt.submit"
      | "agent.cycle"
      | string
  }
}

export type EventTuiToastShow = {
  id: string
  type: "tui.toast.show"
  properties: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    duration?: number
  }
}

export type EventTuiSessionSelect = {
  id: string
  type: "tui.session.select"
  properties: {
    /**
     * Session ID to navigate to
     */
    sessionID: string
  }
}

export type Project = {
  id: string
  worktree: string
  vcs?: "git"
  name?: string
  icon?: {
    url?: string
    override?: string
    color?: string
  }
  commands?: {
    /**
     * Startup script to run when creating a new workspace (worktree)
     */
    start?: string
  }
  time: {
    created: number
    updated: number
    initialized?: number
  }
  sandboxes: Array<string>
}

export type Pty = {
  id: string
  title: string
  command: string
  args: Array<string>
  cwd: string
  status: "running" | "exited"
  pid: number
}

export type OutputFormatText = {
  type: "text"
}

export type JsonSchema = {
  [key: string]: unknown
}

export type OutputFormatJsonSchema = {
  type: "json_schema"
  schema: JsonSchema
  retryCount?: number
}

export type OutputFormat = OutputFormatText | OutputFormatJsonSchema

export type UserMessage = {
  id: string
  sessionID: string
  role: "user"
  time: {
    created: number
  }
  format?: OutputFormat
  summary?: {
    title?: string
    body?: string
    diffs: Array<SnapshotFileDiff>
  }
  agent: string
  model: {
    providerID: string
    modelID: string
    variant?: string
  }
  system?: string
  tools?: {
    [key: string]: boolean
  }
}

export type AssistantMessage = {
  id: string
  sessionID: string
  role: "assistant"
  time: {
    created: number
    completed?: number
  }
  error?:
    | ProviderAuthError
    | UnknownError
    | MessageOutputLengthError
    | MessageAbortedError
    | StructuredOutputError
    | ContextOverflowError
    | ApiError
  parentID: string
  modelID: string
  providerID: string
  mode: string
  agent: string
  path: {
    cwd: string
    root: string
  }
  summary?: boolean
  cost: number
  tokens: {
    total?: number
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  structured?: unknown
  variant?: string
  finish?: string
}

export type Message = UserMessage | AssistantMessage

export type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type SubtaskPart = {
  id: string
  sessionID: string
  messageID: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
  model?: {
    providerID: string
    modelID: string
  }
  command?: string
}

export type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"
  text: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end?: number
  }
}

export type FilePartSourceText = {
  value: string
  start: number
  end: number
}

export type FileSource = {
  text: FilePartSourceText
  type: "file"
  path: string
}

export type Range = {
  start: {
    line: number
    character: number
  }
  end: {
    line: number
    character: number
  }
}

export type SymbolSource = {
  text: FilePartSourceText
  type: "symbol"
  path: string
  range: Range
  name: string
  kind: number
}

export type ResourceSource = {
  text: FilePartSourceText
  type: "resource"
  clientName: string
  uri: string
}

export type FilePartSource = FileSource | SymbolSource | ResourceSource

export type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type ToolStatePending = {
  status: "pending"
  input: {
    [key: string]: unknown
  }
  raw: string
}

export type ToolStateRunning = {
  status: "running"
  input: {
    [key: string]: unknown
  }
  title?: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
  }
}

export type ToolStateCompleted = {
  status: "completed"
  input: {
    [key: string]: unknown
  }
  output: string
  title: string
  metadata: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
    compacted?: number
  }
  attachments?: Array<FilePart>
}

export type ToolStateError = {
  status: "error"
  input: {
    [key: string]: unknown
  }
  error: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    start: number
    end: number
  }
}

export type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError

export type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: "tool"
  callID: string
  tool: string
  state: ToolState
  metadata?: {
    [key: string]: unknown
  }
}

export type StepStartPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-start"
  snapshot?: string
}

export type StepFinishPart = {
  id: string
  sessionID: string
  messageID: string
  type: "step-finish"
  reason: string
  snapshot?: string
  cost: number
  tokens: {
    total?: number
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}

export type SnapshotPart = {
  id: string
  sessionID: string
  messageID: string
  type: "snapshot"
  snapshot: string
}

export type PatchPart = {
  id: string
  sessionID: string
  messageID: string
  type: "patch"
  hash: string
  files: Array<string>
}

export type AgentPart = {
  id: string
  sessionID: string
  messageID: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type RetryPart = {
  id: string
  sessionID: string
  messageID: string
  type: "retry"
  attempt: number
  error: ApiError
  time: {
    created: number
  }
}

export type CompactionPart = {
  id: string
  sessionID: string
  messageID: string
  type: "compaction"
  auto: boolean
  overflow?: boolean
  tail_start_id?: string
}

export type Part =
  | TextPart
  | SubtaskPart
  | ReasoningPart
  | FilePart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart

export type PermissionAction = "allow" | "ask" | "ask"

export type PermissionRule = {
  permission: string
  pattern: string
  action: PermissionAction
}

export type PermissionRuleset = Array<PermissionRule>

export type Session = {
  id: string
  slug: string
  projectID: string
  workspaceID?: string
  directory: string
  path?: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: Array<SnapshotFileDiff>
  }
  share?: {
    url: string
  }
  title: string
  agent?: string
  model?: {
    id: string
    providerID: string
    variant?: string
  }
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  permission?: PermissionRuleset
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
}

export type Prompt = {
  text: string
  files?: Array<PromptFileAttachment>
  agents?: Array<PromptAgentAttachment>
}

export type GlobalEvent = {
  directory: string
  project?: string
  workspace?: string
  payload:
    | EventServerInstanceDisposed
    | EventFileEdited
    | EventFileWatcherUpdated
    | EventLspClientDiagnostics
    | EventLspUpdated
    | EventMessagePartDelta
    | EventPermissionAsked
    | EventPermissionReplied
    | EventSessionDiff
    | EventSessionError
    | EventInstallationUpdated
    | EventInstallationUpdateAvailable
    | EventQuestionAsked
    | EventQuestionReplied
    | EventQuestionRejected
    | EventTodoUpdated
    | EventSessionStatus
    | EventSessionIdle
    | EventSessionCompacted
    | EventTuiPromptAppend
    | EventTuiCommandExecute
    | EventTuiToastShow
    | EventTuiSessionSelect
    | EventMcpToolsChanged
    | EventMcpBrowserOpenFailed
    | EventCommandExecuted
    | EventProjectUpdated
    | EventVcsBranchUpdated
    | EventWorkspaceReady
    | EventWorkspaceFailed
    | EventWorkspaceStatus
    | EventWorktreeReady
    | EventWorktreeFailed
    | EventPtyCreated
    | EventPtyUpdated
    | EventPtyExited
    | EventPtyDeleted
    | EventMessageUpdated
    | EventMessageRemoved
    | EventMessagePartUpdated
    | EventMessagePartRemoved
    | EventSessionCreated
    | EventSessionUpdated
    | EventSessionDeleted
    | EventSessionNextAgentSwitched
    | EventSessionNextModelSwitched
    | EventSessionNextPrompted
    | EventSessionNextSynthetic
    | EventSessionNextShellStarted
    | EventSessionNextShellEnded
    | EventSessionNextStepStarted
    | EventSessionNextStepEnded
    | EventSessionNextStepFailed
    | EventSessionNextTextStarted
    | EventSessionNextTextDelta
    | EventSessionNextTextEnded
    | EventSessionNextReasoningStarted
    | EventSessionNextReasoningDelta
    | EventSessionNextReasoningEnded
    | EventSessionNextToolInputStarted
    | EventSessionNextToolInputDelta
    | EventSessionNextToolInputEnded
    | EventSessionNextToolCalled
    | EventSessionNextToolProgress
    | EventSessionNextToolSuccess
    | EventSessionNextToolFailed
    | EventSessionNextRetried
    | EventSessionNextCompactionStarted
    | EventSessionNextCompactionDelta
    | EventSessionNextCompactionEnded
    | EventServerConnected
    | EventGlobalDisposed
    | SyncEventMessageUpdated
    | SyncEventMessageRemoved
    | SyncEventMessagePartUpdated
    | SyncEventMessagePartRemoved
    | SyncEventSessionCreated
    | SyncEventSessionUpdated
    | SyncEventSessionDeleted
    | SyncEventSessionNextAgentSwitched
    | SyncEventSessionNextModelSwitched
    | SyncEventSessionNextPrompted
    | SyncEventSessionNextSynthetic
    | SyncEventSessionNextShellStarted
    | SyncEventSessionNextShellEnded
    | SyncEventSessionNextStepStarted
    | SyncEventSessionNextStepEnded
    | SyncEventSessionNextStepFailed
    | SyncEventSessionNextTextStarted
    | SyncEventSessionNextTextDelta
    | SyncEventSessionNextTextEnded
    | SyncEventSessionNextReasoningStarted
    | SyncEventSessionNextReasoningDelta
    | SyncEventSessionNextReasoningEnded
    | SyncEventSessionNextToolInputStarted
    | SyncEventSessionNextToolInputDelta
    | SyncEventSessionNextToolInputEnded
    | SyncEventSessionNextToolCalled
    | SyncEventSessionNextToolProgress
    | SyncEventSessionNextToolSuccess
    | SyncEventSessionNextToolFailed
    | SyncEventSessionNextRetried
    | SyncEventSessionNextCompactionStarted
    | SyncEventSessionNextCompactionDelta
    | SyncEventSessionNextCompactionEnded
}

/**
 * Log level
 */
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

/**
 * Server configuration for opencode serve and web commands
 */
export type ServerConfig = {
  port?: number
  hostname?: string
  mdns?: boolean
  mdnsDomain?: string
  cors?: Array<string>
}

export type ReferenceConfigEntry =
  | string
  | {
      /**
       * Git repository URL, host/path reference, or GitHub owner/repo shorthand
       */
      repository: string
      branch?: string
    }
  | {
      /**
       * Absolute path, ~/ path, or workspace-relative path to a local reference directory
       */
      path: string
    }

export type ReferenceConfig = {
  [key: string]: ReferenceConfigEntry
}

export type PermissionActionConfig = "ask" | "allow" | "ask"

export type PermissionObjectConfig = {
  [key: string]: PermissionActionConfig
}

export type PermissionRuleConfig = PermissionActionConfig | PermissionObjectConfig

export type PermissionConfig =
  | PermissionActionConfig
  | {
      read?: PermissionRuleConfig
      edit?: PermissionRuleConfig
      glob?: PermissionRuleConfig
      grep?: PermissionRuleConfig
      list?: PermissionRuleConfig
      bash?: PermissionRuleConfig
      task?: PermissionRuleConfig
      external_directory?: PermissionRuleConfig
      todowrite?: PermissionActionConfig
      question?: PermissionActionConfig
      webfetch?: PermissionActionConfig
      websearch?: PermissionActionConfig
      codesearch?: PermissionActionConfig
      repo_clone?: PermissionRuleConfig
      repo_overview?: PermissionRuleConfig
      lsp?: PermissionRuleConfig
      doom_loop?: PermissionActionConfig
      skill?: PermissionRuleConfig
      [key: string]: PermissionRuleConfig | PermissionActionConfig | undefined
    }

export type AgentConfig = {
  model?: string
  variant?: string
  temperature?: number
  top_p?: number
  prompt?: string
  tools?: {
    [key: string]: boolean
  }
  disable?: boolean
  description?: string
  mode?: "subagent" | "primary" | "all"
  hidden?: boolean
  options?: {
    [key: string]: unknown
  }
  /**
   * Hex color code (e.g., #FF5733) or theme color (e.g., primary)
   */
  color?: string | "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "info"
  steps?: number
  maxSteps?: number
  permission?: PermissionConfig
  [key: string]:
    | unknown
    | string
    | number
    | {
        [key: string]: boolean
      }
    | boolean
    | "subagent"
    | "primary"
    | "all"
    | {
        [key: string]: unknown
      }
    | string
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | number
    | PermissionConfig
    | undefined
}

export type ProviderConfig = {
  api?: string
  name?: string
  env?: Array<string>
  id?: string
  npm?: string
  whitelist?: Array<string>
  blacklist?: Array<string>
  options?: {
    apiKey?: string
    baseURL?: string
    enterpriseUrl?: string
    setCacheKey?: boolean
    /**
     * Timeout in milliseconds for requests to this provider. Default is 300000 (5 minutes). Set to false to disable timeout.
     */
    timeout?: number | false
    chunkTimeout?: number
    [key: string]: unknown | string | boolean | number | false | number | undefined
  }
  models?: {
    [key: string]: {
      id?: string
      name?: string
      family?: string
      release_date?: string
      attachment?: boolean
      reasoning?: boolean
      temperature?: boolean
      tool_call?: boolean
      interleaved?:
        | true
        | {
            field: "reasoning_content" | "reasoning_details"
          }
      cost?: {
        input: number
        output: number
        cache_read?: number
        cache_write?: number
        context_over_200k?: {
          input: number
          output: number
          cache_read?: number
          cache_write?: number
        }
      }
      limit?: {
        context: number
        input?: number
        output: number
      }
      modalities?: {
        input: Array<"text" | "audio" | "image" | "video" | "pdf">
        output: Array<"text" | "audio" | "image" | "video" | "pdf">
      }
      experimental?: boolean
      status?: "alpha" | "beta" | "deprecated"
      provider?: {
        npm?: string
        api?: string
      }
      options?: {
        [key: string]: unknown
      }
      headers?: {
        [key: string]: string
      }
      /**
       * Variant-specific configuration
       */
      variants?: {
        [key: string]: {
          disabled?: boolean
          [key: string]: unknown | boolean | undefined
        }
      }
    }
  }
}

export type McpLocalConfig = {
  /**
   * Type of MCP server connection
   */
  type: "local"
  /**
   * Command and arguments to run the MCP server
   */
  command: Array<string>
  environment?: {
    [key: string]: string
  }
  enabled?: boolean
  timeout?: number
}

export type McpOAuthConfig = {
  clientId?: string
  clientSecret?: string
  scope?: string
  redirectUri?: string
}

export type McpRemoteConfig = {
  /**
   * Type of MCP server connection
   */
  type: "remote"
  /**
   * URL of the remote MCP server
   */
  url: string
  enabled?: boolean
  headers?: {
    [key: string]: string
  }
  /**
   * OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection.
   */
  oauth?: McpOAuthConfig | false
  timeout?: number
}

/**
 * @deprecated Always uses stretch layout.
 */
export type LayoutConfig = "auto" | "stretch"

export type Config = {
  $schema?: string
  shell?: string
  logLevel?: LogLevel
  server?: ServerConfig
  command?: {
    [key: string]: {
      template: string
      description?: string
      agent?: string
      model?: string
      subtask?: boolean
    }
  }
  skills?: {
    paths?: Array<string>
    urls?: Array<string>
  }
  reference?: ReferenceConfig
  watcher?: {
    ignore?: Array<string>
  }
  snapshot?: boolean
  plugin?: Array<
    | string
    | [
        string,
        {
          [key: string]: unknown
        },
      ]
  >
  share?: "manual" | "auto" | "disabled"
  autoshare?: boolean
  /**
   * Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications
   */
  autoupdate?: boolean | "notify"
  disabled_providers?: Array<string>
  enabled_providers?: Array<string>
  model?: string
  small_model?: string
  default_agent?: string
  username?: string
  mode?: {
    build?: AgentConfig
    plan?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  agent?: {
    plan?: AgentConfig
    build?: AgentConfig
    general?: AgentConfig
    explore?: AgentConfig
    scout?: AgentConfig
    title?: AgentConfig
    summary?: AgentConfig
    compaction?: AgentConfig
    [key: string]: AgentConfig | undefined
  }
  provider?: {
    [key: string]: ProviderConfig
  }
  mcp?: {
    [key: string]:
      | McpLocalConfig
      | McpRemoteConfig
      | {
          enabled: boolean
        }
  }
  /**
   * Enable or configure formatters. Omit or set to false to disable, true to enable built-ins, or an object to enable built-ins with overrides.
   */
  formatter?:
    | boolean
    | {
        [key: string]: {
          disabled?: boolean
          command?: Array<string>
          environment?: {
            [key: string]: string
          }
          extensions?: Array<string>
        }
      }
  /**
   * Enable or configure LSP servers. Omit or set to false to disable, true to enable built-ins, or an object to enable built-ins with overrides.
   */
  lsp?:
    | boolean
    | {
        [key: string]:
          | {
              disabled: true
            }
          | {
              command: Array<string>
              extensions?: Array<string>
              disabled?: boolean
              env?: {
                [key: string]: string
              }
              initialization?: {
                [key: string]: unknown
              }
            }
      }
  instructions?: Array<string>
  layout?: LayoutConfig
  permission?: PermissionConfig
  tools?: {
    [key: string]: boolean
  }
  enterprise?: {
    url?: string
  }
  tool_output?: {
    max_lines?: number
    max_bytes?: number
  }
  compaction?: {
    auto?: boolean
    prune?: boolean
    tail_turns?: number
    preserve_recent_tokens?: number
    reserved?: number
  }
  experimental?: {
    disable_paste_summary?: boolean
    batch_tool?: boolean
    openTelemetry?: boolean
    primary_tools?: Array<string>
    continue_loop_on_ask?: boolean
    mcp_timeout?: number
  }
}

export type Model = {
  id: string
  providerID: string
  api: {
    id: string
    url: string
    npm: string
  }
  name: string
  family?: string
  capabilities: {
    temperature: boolean
    reasoning: boolean
    attachment: boolean
    toolcall: boolean
    input: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
    output: {
      text: boolean
      audio: boolean
      image: boolean
      video: boolean
      pdf: boolean
    }
    interleaved:
      | boolean
      | {
          field: "reasoning_content" | "reasoning_details"
        }
  }
  cost: {
    input: number
    output: number
    cache: {
      read: number
      write: number
    }
    experimentalOver200K?: {
      input: number
      output: number
      cache: {
        read: number
        write: number
      }
    }
  }
  limit: {
    context: number
    input?: number
    output: number
  }
  status: "alpha" | "beta" | "deprecated" | "active"
  options: {
    [key: string]: unknown
  }
  headers: {
    [key: string]: string
  }
  release_date: string
  variants?: {
    [key: string]: {
      [key: string]: unknown
    }
  }
}

export type Provider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: Array<string>
  key?: string
  options: {
    [key: string]: unknown
  }
  models: {
    [key: string]: Model
  }
}

export type ConsoleState = {
  consoleManagedProviders: Array<string>
  activeOrgName?: string
  switchableOrgCount: number
}

export type EffectHttpApiErrorInternalServerError = {
  _tag: "InternalServerError"
}

export type ToolListItem = {
  id: string
  description: string
  parameters: unknown
}

export type ToolList = Array<ToolListItem>

export type ToolIds = Array<string>

export type WorktreeCreateInput = {
  name?: string
  /**
   * Additional startup script to run after the project's start command
   */
  startCommand?: string
}

export type Worktree = {
  name: string
  branch: string
  directory: string
}

export type WorktreeRemoveInput = {
  directory: string
}

export type WorktreeResetInput = {
  directory: string
}

export type ProjectSummary = {
  id: string
  name?: string
  worktree: string
}

export type GlobalSession = {
  id: string
  slug: string
  projectID: string
  workspaceID?: string
  directory: string
  path?: string
  parentID?: string
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: Array<SnapshotFileDiff>
  }
  share?: {
    url: string
  }
  title: string
  agent?: string
  model?: {
    id: string
    providerID: string
    variant?: string
  }
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  permission?: PermissionRuleset
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
  project: ProjectSummary | null
}

export type McpResource = {
  name: string
  uri: string
  description?: string
  mimeType?: string
  client: string
}

export type Symbol = {
  name: string
  kind: number
  location: {
    uri: string
    range: Range
  }
}

export type FileNode = {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored: boolean
}

export type FileContent = {
  type: "text" | "binary"
  content: string
  diff?: string
  patch?: {
    oldFileName: string
    newFileName: string
    oldHeader?: string
    newHeader?: string
    hunks: Array<{
      oldStart: number
      oldLines: number
      newStart: number
      newLines: number
      lines: Array<string>
    }>
    index?: string
  }
  encoding?: "base64"
  mimeType?: string
}

export type File = {
  path: string
  added: number
  removed: number
  status: "added" | "deleted" | "modified"
}

export type Path = {
  home: string
  state: string
  config: string
  worktree: string
  directory: string
}

export type VcsInfo = {
  branch?: string
  default_branch?: string
}

export type VcsFileStatus = {
  file: string
  additions: number
  deletions: number
  status: "added" | "deleted" | "modified"
}

export type VcsFileDiff = {
  file: string
  patch?: string
  additions: number
  deletions: number
  status?: "added" | "deleted" | "modified"
}

export type VcsApplyError = {
  name: "VcsApplyError"
  data: {
    message: string
    reason: "non-git" | "not-clean"
  }
}

export type Command = {
  name: string
  description?: string
  agent?: string
  model?: string
  source?: "command" | "mcp" | "skill"
  template: string
  subtask?: boolean
  hints: Array<string>
}

export type Agent = {
  name: string
  description?: string
  mode: "subagent" | "primary" | "all"
  native?: boolean
  hidden?: boolean
  topP?: number
  temperature?: number
  color?: string
  permission: PermissionRuleset
  model?: {
    modelID: string
    providerID: string
  }
  variant?: string
  prompt?: string
  options: {
    [key: string]: unknown
  }
  steps?: number
}

export type LspStatus = {
  id: string
  name: string
  root: string
  status: "connected" | "error"
}

export type FormatterStatus = {
  name: string
  extensions: Array<string>
  enabled: boolean
}

export type McpStatusConnected = {
  status: "connected"
}

export type McpStatusDisabled = {
  status: "disabled"
}

export type McpStatusFailed = {
  status: "failed"
  error: string
}

export type McpStatusNeedsAuth = {
  status: "needs_auth"
}

export type McpStatusNeedsClientRegistration = {
  status: "needs_client_registration"
  error: string
}

export type McpStatus =
  | McpStatusConnected
  | McpStatusDisabled
  | McpStatusFailed
  | McpStatusNeedsAuth
  | McpStatusNeedsClientRegistration

export type McpUnsupportedOAuthError = {
  error: string
}

export type NotFoundError = {
  name: "NotFoundError"
  data: {
    message: string
  }
}

export type EffectHttpApiErrorForbidden = {
  _tag: "Forbidden"
}

export type ProviderAuthMethod = {
  type: "oauth" | "api"
  label: string
  prompts?: Array<
    | {
        type: "text"
        key: string
        message: string
        placeholder?: string
        when?: {
          key: string
          op: "eq" | "neq"
          value: string
        }
      }
    | {
        type: "select"
        key: string
        message: string
        options: Array<{
          label: string
          value: string
          hint?: string
        }>
        when?: {
          key: string
          op: "eq" | "neq"
          value: string
        }
      }
  >
}

export type ProviderAuthAuthorization = {
  url: string
  method: "auto" | "code"
  instructions: string
}

export type TextPartInput = {
  id?: string
  type: "text"
  text: string
  synthetic?: boolean
  ignored?: boolean
  time?: {
    start: number
    end?: number
  }
  metadata?: {
    [key: string]: unknown
  }
}

export type FilePartInput = {
  id?: string
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FilePartSource
}

export type AgentPartInput = {
  id?: string
  type: "agent"
  name: string
  source?: {
    value: string
    start: number
    end: number
  }
}

export type SubtaskPartInput = {
  id?: string
  type: "subtask"
  prompt: string
  description: string
  agent: string
  model?: {
    providerID: string
    modelID: string
  }
  command?: string
}

export type V2SessionsResponse = {
  items: Array<SessionInfo>
  cursor: {
    previous?: string
    next?: string
  }
}

export type V2SessionMessagesResponse = {
  items: Array<SessionMessage>
  cursor: {
    previous?: string
    next?: string
  }
}

export type EventTuiPromptAppend2 = {
  type: "tui.prompt.append"
  properties: {
    text: string
  }
}

export type EventTuiCommandExecute2 = {
  type: "tui.command.execute"
  properties: {
    command:
      | "session.list"
      | "session.new"
      | "session.share"
      | "session.interrupt"
      | "session.compact"
      | "session.page.up"
      | "session.page.down"
      | "session.line.up"
      | "session.line.down"
      | "session.half.page.up"
      | "session.half.page.down"
      | "session.first"
      | "session.last"
      | "prompt.clear"
      | "prompt.submit"
      | "agent.cycle"
      | string
  }
}

export type EventTuiToastShow2 = {
  type: "tui.toast.show"
  properties: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    duration?: number
  }
}

export type EventTuiSessionSelect2 = {
  type: "tui.session.select"
  properties: {
    /**
     * Session ID to navigate to
     */
    sessionID: string
  }
}

export type Workspace = {
  id: string
  type: string
  name: string
  branch: string | null
  directory: string | null
  extra: unknown | null
  projectID: string
  timeUsed: number | "NaN" | "Infinity" | "-Infinity" | "Infinity" | "-Infinity" | "NaN"
}

export type WorkspaceWarpError = {
  name: "WorkspaceWarpError"
  data: {
    message: string
  }
}

export type SyncEventMessageUpdated = {
  type: "sync"
  name: "message.updated.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    info: Message
  }
}

export type SyncEventMessageRemoved = {
  type: "sync"
  name: "message.removed.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    messageID: string
  }
}

export type SyncEventMessagePartUpdated = {
  type: "sync"
  name: "message.part.updated.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    part: Part
    time: number
  }
}

export type SyncEventMessagePartRemoved = {
  type: "sync"
  name: "message.part.removed.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    messageID: string
    partID: string
  }
}

export type SyncEventSessionCreated = {
  type: "sync"
  name: "session.created.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    info: Session
  }
}

export type SyncEventSessionUpdated = {
  type: "sync"
  name: "session.updated.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    info: {
      id?: string | null
      slug?: string | null
      projectID?: string | null
      workspaceID?: string | null
      directory?: string | null
      path?: string | null
      parentID?: string | null
      summary?: {
        additions: number
        deletions: number
        files: number
        diffs?: Array<SnapshotFileDiff>
      } | null
      share?: {
        url?: string | null
      }
      title?: string | null
      agent?: string | null
      model?: {
        id: string
        providerID: string
        variant?: string
      } | null
      version?: string | null
      time?: {
        created?: number | null
        updated?: number | null
        compacting?: number | null
        archived?: number | null
      }
      permission?: PermissionRuleset | null
      revert?: {
        messageID: string
        partID?: string
        snapshot?: string
        diff?: string
      } | null
    }
  }
}

export type SyncEventSessionDeleted = {
  type: "sync"
  name: "session.deleted.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    sessionID: string
    info: Session
  }
}

export type SyncEventSessionNextAgentSwitched = {
  type: "sync"
  name: "session.next.agent.switched.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    agent: string
  }
}

export type SyncEventSessionNextModelSwitched = {
  type: "sync"
  name: "session.next.model.switched.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    model: {
      id: string
      providerID: string
      variant: string
    }
  }
}

export type SyncEventSessionNextPrompted = {
  type: "sync"
  name: "session.next.prompted.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    prompt: Prompt
  }
}

export type SyncEventSessionNextSynthetic = {
  type: "sync"
  name: "session.next.synthetic.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type SyncEventSessionNextShellStarted = {
  type: "sync"
  name: "session.next.shell.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    command: string
  }
}

export type SyncEventSessionNextShellEnded = {
  type: "sync"
  name: "session.next.shell.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    output: string
  }
}

export type SyncEventSessionNextStepStarted = {
  type: "sync"
  name: "session.next.step.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    agent: string
    model: {
      id: string
      providerID: string
      variant: string
    }
    snapshot?: string
  }
}

export type SyncEventSessionNextStepEnded = {
  type: "sync"
  name: "session.next.step.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    finish: string
    cost: number
    tokens: {
      input: number
      output: number
      reasoning: number
      cache: {
        read: number
        write: number
      }
    }
    snapshot?: string
  }
}

export type SyncEventSessionNextStepFailed = {
  type: "sync"
  name: "session.next.step.failed.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    error: SessionErrorUnknown
  }
}

export type SyncEventSessionNextTextStarted = {
  type: "sync"
  name: "session.next.text.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
  }
}

export type SyncEventSessionNextTextDelta = {
  type: "sync"
  name: "session.next.text.delta.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    delta: string
  }
}

export type SyncEventSessionNextTextEnded = {
  type: "sync"
  name: "session.next.text.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type SyncEventSessionNextReasoningStarted = {
  type: "sync"
  name: "session.next.reasoning.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    reasoningID: string
  }
}

export type SyncEventSessionNextReasoningDelta = {
  type: "sync"
  name: "session.next.reasoning.delta.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    reasoningID: string
    delta: string
  }
}

export type SyncEventSessionNextReasoningEnded = {
  type: "sync"
  name: "session.next.reasoning.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    reasoningID: string
    text: string
  }
}

export type SyncEventSessionNextToolInputStarted = {
  type: "sync"
  name: "session.next.tool.input.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    name: string
  }
}

export type SyncEventSessionNextToolInputDelta = {
  type: "sync"
  name: "session.next.tool.input.delta.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    delta: string
  }
}

export type SyncEventSessionNextToolInputEnded = {
  type: "sync"
  name: "session.next.tool.input.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    text: string
  }
}

export type SyncEventSessionNextToolCalled = {
  type: "sync"
  name: "session.next.tool.called.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    tool: string
    input: {
      [key: string]: unknown
    }
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type SyncEventSessionNextToolProgress = {
  type: "sync"
  name: "session.next.tool.progress.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    structured: {
      [key: string]: unknown
    }
    content: Array<ToolTextContent | ToolFileContent>
  }
}

export type SyncEventSessionNextToolSuccess = {
  type: "sync"
  name: "session.next.tool.success.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    structured: {
      [key: string]: unknown
    }
    content: Array<ToolTextContent | ToolFileContent>
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type SyncEventSessionNextToolFailed = {
  type: "sync"
  name: "session.next.tool.failed.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    callID: string
    error: SessionErrorUnknown
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type SyncEventSessionNextRetried = {
  type: "sync"
  name: "session.next.retried.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    attempt: number
    error: SessionNextRetryError
  }
}

export type SyncEventSessionNextCompactionStarted = {
  type: "sync"
  name: "session.next.compaction.started.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    reason: "auto" | "manual"
  }
}

export type SyncEventSessionNextCompactionDelta = {
  type: "sync"
  name: "session.next.compaction.delta.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type SyncEventSessionNextCompactionEnded = {
  type: "sync"
  name: "session.next.compaction.ended.1"
  id: string
  seq: number
  aggregateID: "sessionID"
  data: {
    timestamp: number
    sessionID: string
    text: string
    include?: string
  }
}

export type EventServerInstanceDisposed = {
  id: string
  type: "server.instance.disposed"
  properties: {
    directory: string
  }
}

export type EventFileEdited = {
  id: string
  type: "file.edited"
  properties: {
    file: string
  }
}

export type EventFileWatcherUpdated = {
  id: string
  type: "file.watcher.updated"
  properties: {
    file: string
    event: "add" | "change" | "unlink"
  }
}

export type EventLspClientDiagnostics = {
  id: string
  type: "lsp.client.diagnostics"
  properties: {
    serverID: string
    path: string
  }
}

export type EventLspUpdated = {
  id: string
  type: "lsp.updated"
  properties: {
    [key: string]: unknown
  }
}

export type EventMessagePartDelta = {
  id: string
  type: "message.part.delta"
  properties: {
    sessionID: string
    messageID: string
    partID: string
    field: string
    delta: string
  }
}

export type EventPermissionAsked = {
  id: string
  type: "permission.asked"
  properties: PermissionRequest
}

export type EventPermissionReplied = {
  id: string
  type: "permission.replied"
  properties: {
    sessionID: string
    requestID: string
    reply: "once" | "always" | "reject"
  }
}

export type EventSessionDiff = {
  id: string
  type: "session.diff"
  properties: {
    sessionID: string
    diff: Array<SnapshotFileDiff>
  }
}

export type EventSessionError = {
  id: string
  type: "session.error"
  properties: {
    sessionID?: string
    error?:
      | ProviderAuthError
      | UnknownError
      | MessageOutputLengthError
      | MessageAbortedError
      | StructuredOutputError
      | ContextOverflowError
      | ApiError
  }
}

export type EventInstallationUpdated = {
  id: string
  type: "installation.updated"
  properties: {
    version: string
  }
}

export type EventInstallationUpdateAvailable = {
  id: string
  type: "installation.update-available"
  properties: {
    version: string
  }
}

export type EventQuestionAsked = {
  id: string
  type: "question.asked"
  properties: QuestionRequest
}

export type EventQuestionReplied = {
  id: string
  type: "question.replied"
  properties: QuestionReplied
}

export type EventQuestionRejected = {
  id: string
  type: "question.rejected"
  properties: QuestionRejected
}

export type EventTodoUpdated = {
  id: string
  type: "todo.updated"
  properties: {
    sessionID: string
    todos: Array<Todo>
  }
}

export type EventSessionStatus = {
  id: string
  type: "session.status"
  properties: {
    sessionID: string
    status: SessionStatus
  }
}

export type EventSessionIdle = {
  id: string
  type: "session.idle"
  properties: {
    sessionID: string
  }
}

export type EventSessionCompacted = {
  id: string
  type: "session.compacted"
  properties: {
    sessionID: string
  }
}

export type EventMcpToolsChanged = {
  id: string
  type: "mcp.tools.changed"
  properties: {
    server: string
  }
}

export type EventMcpBrowserOpenFailed = {
  id: string
  type: "mcp.browser.open.failed"
  properties: {
    mcpName: string
    url: string
  }
}

export type EventCommandExecuted = {
  id: string
  type: "command.executed"
  properties: {
    name: string
    sessionID: string
    arguments: string
    messageID: string
  }
}

export type EventProjectUpdated = {
  id: string
  type: "project.updated"
  properties: Project
}

export type EventVcsBranchUpdated = {
  id: string
  type: "vcs.branch.updated"
  properties: {
    branch?: string
  }
}

export type EventWorkspaceReady = {
  id: string
  type: "workspace.ready"
  properties: {
    name: string
  }
}

export type EventWorkspaceFailed = {
  id: string
  type: "workspace.failed"
  properties: {
    message: string
  }
}

export type EventWorkspaceStatus = {
  id: string
  type: "workspace.status"
  properties: {
    workspaceID: string
    status: "connected" | "connecting" | "disconnected" | "error"
  }
}

export type EventWorktreeReady = {
  id: string
  type: "worktree.ready"
  properties: {
    name: string
    branch: string
  }
}

export type EventWorktreeFailed = {
  id: string
  type: "worktree.failed"
  properties: {
    message: string
  }
}

export type EventPtyCreated = {
  id: string
  type: "pty.created"
  properties: {
    info: Pty
  }
}

export type EventPtyUpdated = {
  id: string
  type: "pty.updated"
  properties: {
    info: Pty
  }
}

export type EventPtyExited = {
  id: string
  type: "pty.exited"
  properties: {
    id: string
    exitCode: number
  }
}

export type EventPtyDeleted = {
  id: string
  type: "pty.deleted"
  properties: {
    id: string
  }
}

export type EventMessageUpdated = {
  id: string
  type: "message.updated"
  properties: {
    sessionID: string
    info: Message
  }
}

export type EventMessageRemoved = {
  id: string
  type: "message.removed"
  properties: {
    sessionID: string
    messageID: string
  }
}

export type EventMessagePartUpdated = {
  id: string
  type: "message.part.updated"
  properties: {
    sessionID: string
    part: Part
    time: number
  }
}

export type EventMessagePartRemoved = {
  id: string
  type: "message.part.removed"
  properties: {
    sessionID: string
    messageID: string
    partID: string
  }
}

export type EventSessionCreated = {
  id: string
  type: "session.created"
  properties: {
    sessionID: string
    info: Session
  }
}

export type EventSessionUpdated = {
  id: string
  type: "session.updated"
  properties: {
    sessionID: string
    info: Session
  }
}

export type EventSessionDeleted = {
  id: string
  type: "session.deleted"
  properties: {
    sessionID: string
    info: Session
  }
}

export type EventSessionNextAgentSwitched = {
  id: string
  type: "session.next.agent.switched"
  properties: {
    timestamp: number
    sessionID: string
    agent: string
  }
}

export type EventSessionNextModelSwitched = {
  id: string
  type: "session.next.model.switched"
  properties: {
    timestamp: number
    sessionID: string
    model: {
      id: string
      providerID: string
      variant: string
    }
  }
}

export type PromptSource = {
  start: number
  end: number
  text: string
}

export type PromptFileAttachment = {
  uri: string
  mime: string
  name?: string
  description?: string
  source?: PromptSource
}

export type PromptAgentAttachment = {
  name: string
  source?: PromptSource
}

export type EventSessionNextPrompted = {
  id: string
  type: "session.next.prompted"
  properties: {
    timestamp: number
    sessionID: string
    prompt: Prompt
  }
}

export type EventSessionNextSynthetic = {
  id: string
  type: "session.next.synthetic"
  properties: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type EventSessionNextShellStarted = {
  id: string
  type: "session.next.shell.started"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    command: string
  }
}

export type EventSessionNextShellEnded = {
  id: string
  type: "session.next.shell.ended"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    output: string
  }
}

export type EventSessionNextStepStarted = {
  id: string
  type: "session.next.step.started"
  properties: {
    timestamp: number
    sessionID: string
    agent: string
    model: {
      id: string
      providerID: string
      variant: string
    }
    snapshot?: string
  }
}

export type EventSessionNextStepEnded = {
  id: string
  type: "session.next.step.ended"
  properties: {
    timestamp: number
    sessionID: string
    finish: string
    cost: number
    tokens: {
      input: number
      output: number
      reasoning: number
      cache: {
        read: number
        write: number
      }
    }
    snapshot?: string
  }
}

export type SessionErrorUnknown = {
  type: "unknown"
  message: string
}

export type EventSessionNextStepFailed = {
  id: string
  type: "session.next.step.failed"
  properties: {
    timestamp: number
    sessionID: string
    error: SessionErrorUnknown
  }
}

export type EventSessionNextTextStarted = {
  id: string
  type: "session.next.text.started"
  properties: {
    timestamp: number
    sessionID: string
  }
}

export type EventSessionNextTextDelta = {
  id: string
  type: "session.next.text.delta"
  properties: {
    timestamp: number
    sessionID: string
    delta: string
  }
}

export type EventSessionNextTextEnded = {
  id: string
  type: "session.next.text.ended"
  properties: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type EventSessionNextReasoningStarted = {
  id: string
  type: "session.next.reasoning.started"
  properties: {
    timestamp: number
    sessionID: string
    reasoningID: string
  }
}

export type EventSessionNextReasoningDelta = {
  id: string
  type: "session.next.reasoning.delta"
  properties: {
    timestamp: number
    sessionID: string
    reasoningID: string
    delta: string
  }
}

export type EventSessionNextReasoningEnded = {
  id: string
  type: "session.next.reasoning.ended"
  properties: {
    timestamp: number
    sessionID: string
    reasoningID: string
    text: string
  }
}

export type EventSessionNextToolInputStarted = {
  id: string
  type: "session.next.tool.input.started"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    name: string
  }
}

export type EventSessionNextToolInputDelta = {
  id: string
  type: "session.next.tool.input.delta"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    delta: string
  }
}

export type EventSessionNextToolInputEnded = {
  id: string
  type: "session.next.tool.input.ended"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    text: string
  }
}

export type EventSessionNextToolCalled = {
  id: string
  type: "session.next.tool.called"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    tool: string
    input: {
      [key: string]: unknown
    }
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type ToolTextContent = {
  type: "text"
  text: string
}

export type ToolFileContent = {
  type: "file"
  uri: string
  mime: string
  name?: string
}

export type EventSessionNextToolProgress = {
  id: string
  type: "session.next.tool.progress"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    structured: {
      [key: string]: unknown
    }
    content: Array<ToolTextContent | ToolFileContent>
  }
}

export type EventSessionNextToolSuccess = {
  id: string
  type: "session.next.tool.success"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    structured: {
      [key: string]: unknown
    }
    content: Array<ToolTextContent | ToolFileContent>
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type EventSessionNextToolFailed = {
  id: string
  type: "session.next.tool.failed"
  properties: {
    timestamp: number
    sessionID: string
    callID: string
    error: SessionErrorUnknown
    provider: {
      executed: boolean
      metadata?: {
        [key: string]: unknown
      }
    }
  }
}

export type SessionNextRetryError = {
  message: string
  statusCode?: number
  isRetryable: boolean
  responseHeaders?: {
    [key: string]: string
  }
  responseBody?: string
  metadata?: {
    [key: string]: string
  }
}

export type EventSessionNextRetried = {
  id: string
  type: "session.next.retried"
  properties: {
    timestamp: number
    sessionID: string
    attempt: number
    error: SessionNextRetryError
  }
}

export type EventSessionNextCompactionStarted = {
  id: string
  type: "session.next.compaction.started"
  properties: {
    timestamp: number
    sessionID: string
    reason: "auto" | "manual"
  }
}

export type EventSessionNextCompactionDelta = {
  id: string
  type: "session.next.compaction.delta"
  properties: {
    timestamp: number
    sessionID: string
    text: string
  }
}

export type EventSessionNextCompactionEnded = {
  id: string
  type: "session.next.compaction.ended"
  properties: {
    timestamp: number
    sessionID: string
    text: string
    include?: string
  }
}

export type EventServerConnected = {
  id: string
  type: "server.connected"
  properties: {
    [key: string]: unknown
  }
}

export type EventGlobalDisposed = {
  id: string
  type: "global.disposed"
  properties: {
    [key: string]: unknown
  }
}

export type SessionInfo = {
  id: string
  parentID?: string
  projectID: string
  workspaceID?: string
  path?: string
  agent?: string
  model?: {
    id: string
    providerID: string
    variant: string
  }
  time: {
    created: number
    updated: number
    archived?: number
  }
  title: string
}

export type SessionDelivery = "immediate" | "deferred"

export type SessionMessageAgentSwitched = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
  type: "agent-switched"
  agent: string
}

export type SessionMessageModelSwitched = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
  type: "model-switched"
  model: {
    id: string
    providerID: string
    variant: string
  }
}

export type SessionMessageUser = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
  text: string
  files?: Array<PromptFileAttachment>
  agents?: Array<PromptAgentAttachment>
  type: "user"
}

export type SessionMessageSynthetic = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
  sessionID: string
  text: string
  type: "synthetic"
}

export type SessionMessageShell = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
    completed?: number
  }
  type: "shell"
  callID: string
  command: string
  output: string
}

export type SessionMessageAssistantText = {
  type: "text"
  text: string
}

export type SessionMessageAssistantReasoning = {
  type: "reasoning"
  id: string
  text: string
}

export type SessionMessageToolStatePending = {
  status: "pending"
  input: string
}

export type SessionMessageToolStateRunning = {
  status: "running"
  input: {
    [key: string]: unknown
  }
  structured: {
    [key: string]: unknown
  }
  content: Array<ToolTextContent | ToolFileContent>
}

export type SessionMessageToolStateCompleted = {
  status: "completed"
  input: {
    [key: string]: unknown
  }
  attachments?: Array<PromptFileAttachment>
  content: Array<ToolTextContent | ToolFileContent>
  structured: {
    [key: string]: unknown
  }
}

export type SessionMessageToolStateError = {
  status: "error"
  input: {
    [key: string]: unknown
  }
  content: Array<ToolTextContent | ToolFileContent>
  structured: {
    [key: string]: unknown
  }
  error: SessionErrorUnknown
}

export type SessionMessageAssistantTool = {
  type: "tool"
  id: string
  name: string
  provider?: {
    executed: boolean
    metadata?: {
      [key: string]: unknown
    }
  }
  state:
    | SessionMessageToolStatePending
    | SessionMessageToolStateRunning
    | SessionMessageToolStateCompleted
    | SessionMessageToolStateError
  time: {
    created: number
    ran?: number
    completed?: number
    pruned?: number
  }
}

export type SessionMessageAssistant = {
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
    completed?: number
  }
  type: "assistant"
  agent: string
  model: {
    id: string
    providerID: string
    variant: string
  }
  content: Array<SessionMessageAssistantText | SessionMessageAssistantReasoning | SessionMessageAssistantTool>
  snapshot?: {
    start?: string
    end?: string
  }
  finish?: string
  cost?: number
  tokens?: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
  error?: SessionErrorUnknown
}

export type SessionMessageCompaction = {
  type: "compaction"
  reason: "auto" | "manual"
  summary: string
  include?: string
  id: string
  metadata?: {
    [key: string]: unknown
  }
  time: {
    created: number
  }
}

export type SessionMessage =
  | SessionMessageAgentSwitched
  | SessionMessageModelSwitched
  | SessionMessageUser
  | SessionMessageSynthetic
  | SessionMessageShell
  | SessionMessageAssistant
  | SessionMessageCompaction

export type EventTuiToastShow1 = {
  id: string
  type: "tui.toast.show"
  properties: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    duration?: number
  }
}

export type BadRequestError = {
  data: unknown
  errors: Array<{
    [key: string]: unknown
  }>
  success: false
}

export type AuthRemoveData = {
  body?: never
  path: {
    providerID: string
  }
  query?: never
  url: "/auth/{providerID}"
}

export type AuthRemoveErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type AuthRemoveError = AuthRemoveErrors[keyof AuthRemoveErrors]

export type AuthRemoveResponses = {
  /**
   * Successfully removed authentication credentials
   */
  200: boolean
}

export type AuthRemoveResponse = AuthRemoveResponses[keyof AuthRemoveResponses]

export type AuthSetData = {
  body?: Auth
  path: {
    providerID: string
  }
  query?: never
  url: "/auth/{providerID}"
}

export type AuthSetErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type AuthSetError = AuthSetErrors[keyof AuthSetErrors]

export type AuthSetResponses = {
  /**
   * Successfully set authentication credentials
   */
  200: boolean
}

export type AuthSetResponse = AuthSetResponses[keyof AuthSetResponses]

export type AppLogData = {
  body?: {
    /**
     * Service name for the log entry
     */
    service: string
    /**
     * Log level
     */
    level: "debug" | "info" | "error" | "warn"
    /**
     * Log message
     */
    message: string
    extra?: {
      [key: string]: unknown
    }
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/log"
}

export type AppLogErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type AppLogError = AppLogErrors[keyof AppLogErrors]

export type AppLogResponses = {
  /**
   * Log entry written successfully
   */
  200: boolean
}

export type AppLogResponse = AppLogResponses[keyof AppLogResponses]

export type GlobalHealthData = {
  body?: never
  path?: never
  query?: never
  url: "/global/health"
}

export type GlobalHealthResponses = {
  /**
   * Health information
   */
  200: {
    healthy: true
    version: string
  }
}

export type GlobalHealthResponse = GlobalHealthResponses[keyof GlobalHealthResponses]

export type GlobalEventData = {
  body?: never
  path?: never
  query?: never
  url: "/global/event"
}

export type GlobalEventResponses = {
  /**
   * Event stream
   */
  200: GlobalEvent
}

export type GlobalEventResponse = GlobalEventResponses[keyof GlobalEventResponses]

export type GlobalConfigGetData = {
  body?: never
  path?: never
  query?: never
  url: "/global/config"
}

export type GlobalConfigGetResponses = {
  /**
   * Get global config info
   */
  200: Config
}

export type GlobalConfigGetResponse = GlobalConfigGetResponses[keyof GlobalConfigGetResponses]

export type GlobalConfigUpdateData = {
  body?: Config
  path?: never
  query?: never
  url: "/global/config"
}

export type GlobalConfigUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type GlobalConfigUpdateError = GlobalConfigUpdateErrors[keyof GlobalConfigUpdateErrors]

export type GlobalConfigUpdateResponses = {
  /**
   * Successfully updated global config
   */
  200: Config
}

export type GlobalConfigUpdateResponse = GlobalConfigUpdateResponses[keyof GlobalConfigUpdateResponses]

export type GlobalDisposeData = {
  body?: never
  path?: never
  query?: never
  url: "/global/dispose"
}

export type GlobalDisposeResponses = {
  /**
   * Global disposed
   */
  200: boolean
}

export type GlobalDisposeResponse = GlobalDisposeResponses[keyof GlobalDisposeResponses]

export type GlobalUpgradeData = {
  body?: {
    target?: string
  }
  path?: never
  query?: never
  url: "/global/upgrade"
}

export type GlobalUpgradeErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type GlobalUpgradeError = GlobalUpgradeErrors[keyof GlobalUpgradeErrors]

export type GlobalUpgradeResponses = {
  /**
   * Upgrade result
   */
  200:
    | {
        success: true
        version: string
      }
    | {
        success: false
        error: string
      }
}

export type GlobalUpgradeResponse = GlobalUpgradeResponses[keyof GlobalUpgradeResponses]

export type EventSubscribeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/event"
}

export type EventSubscribeResponses = {
  /**
   * Event stream
   */
  200: Event
}

export type EventSubscribeResponse = EventSubscribeResponses[keyof EventSubscribeResponses]

export type ConfigGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/config"
}

export type ConfigGetResponses = {
  /**
   * Get config info
   */
  200: Config
}

export type ConfigGetResponse = ConfigGetResponses[keyof ConfigGetResponses]

export type ConfigUpdateData = {
  body?: Config
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/config"
}

export type ConfigUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ConfigUpdateError = ConfigUpdateErrors[keyof ConfigUpdateErrors]

export type ConfigUpdateResponses = {
  /**
   * Successfully updated config
   */
  200: Config
}

export type ConfigUpdateResponse = ConfigUpdateResponses[keyof ConfigUpdateResponses]

export type ConfigProvidersData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/config/providers"
}

export type ConfigProvidersResponses = {
  /**
   * List of providers
   */
  200: {
    providers: Array<Provider>
    default: {
      [key: string]: string
    }
  }
}

export type ConfigProvidersResponse = ConfigProvidersResponses[keyof ConfigProvidersResponses]

export type ExperimentalConsoleGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/console"
}

export type ExperimentalConsoleGetErrors = {
  /**
   * InternalServerError
   */
  500: EffectHttpApiErrorInternalServerError
}

export type ExperimentalConsoleGetError = ExperimentalConsoleGetErrors[keyof ExperimentalConsoleGetErrors]

export type ExperimentalConsoleGetResponses = {
  /**
   * Active Console provider metadata
   */
  200: ConsoleState
}

export type ExperimentalConsoleGetResponse = ExperimentalConsoleGetResponses[keyof ExperimentalConsoleGetResponses]

export type ExperimentalConsoleListOrgsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/console/orgs"
}

export type ExperimentalConsoleListOrgsErrors = {
  /**
   * InternalServerError
   */
  500: EffectHttpApiErrorInternalServerError
}

export type ExperimentalConsoleListOrgsError =
  ExperimentalConsoleListOrgsErrors[keyof ExperimentalConsoleListOrgsErrors]

export type ExperimentalConsoleListOrgsResponses = {
  /**
   * Switchable Console orgs
   */
  200: {
    orgs: Array<{
      accountID: string
      accountEmail: string
      accountUrl: string
      orgID: string
      orgName: string
      active: boolean
    }>
  }
}

export type ExperimentalConsoleListOrgsResponse =
  ExperimentalConsoleListOrgsResponses[keyof ExperimentalConsoleListOrgsResponses]

export type ExperimentalConsoleSwitchOrgData = {
  body?: {
    accountID: string
    orgID: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/console/switch"
}

export type ExperimentalConsoleSwitchOrgResponses = {
  /**
   * Switch success
   */
  200: boolean
}

export type ExperimentalConsoleSwitchOrgResponse =
  ExperimentalConsoleSwitchOrgResponses[keyof ExperimentalConsoleSwitchOrgResponses]

export type ToolListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    provider: string
    model: string
  }
  url: "/experimental/tool"
}

export type ToolListErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ToolListError = ToolListErrors[keyof ToolListErrors]

export type ToolListResponses = {
  /**
   * Tools
   */
  200: ToolList
}

export type ToolListResponse = ToolListResponses[keyof ToolListResponses]

export type ToolIdsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/tool/ids"
}

export type ToolIdsErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ToolIdsError = ToolIdsErrors[keyof ToolIdsErrors]

export type ToolIdsResponses = {
  /**
   * Tool IDs
   */
  200: ToolIds
}

export type ToolIdsResponse = ToolIdsResponses[keyof ToolIdsResponses]

export type WorktreeRemoveData = {
  body?: WorktreeRemoveInput
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/worktree"
}

export type WorktreeRemoveErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type WorktreeRemoveError = WorktreeRemoveErrors[keyof WorktreeRemoveErrors]

export type WorktreeRemoveResponses = {
  /**
   * Worktree removed
   */
  200: boolean
}

export type WorktreeRemoveResponse = WorktreeRemoveResponses[keyof WorktreeRemoveResponses]

export type WorktreeListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/worktree"
}

export type WorktreeListResponses = {
  /**
   * List of worktree directories
   */
  200: Array<string>
}

export type WorktreeListResponse = WorktreeListResponses[keyof WorktreeListResponses]

export type WorktreeCreateData = {
  body?: WorktreeCreateInput
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/worktree"
}

export type WorktreeCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type WorktreeCreateError = WorktreeCreateErrors[keyof WorktreeCreateErrors]

export type WorktreeCreateResponses = {
  /**
   * Worktree created
   */
  200: Worktree
}

export type WorktreeCreateResponse = WorktreeCreateResponses[keyof WorktreeCreateResponses]

export type WorktreeResetData = {
  body?: WorktreeResetInput
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/worktree/reset"
}

export type WorktreeResetErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type WorktreeResetError = WorktreeResetErrors[keyof WorktreeResetErrors]

export type WorktreeResetResponses = {
  /**
   * Worktree reset
   */
  200: boolean
}

export type WorktreeResetResponse = WorktreeResetResponses[keyof WorktreeResetResponses]

export type ExperimentalSessionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
    roots?: boolean | "true" | "false"
    start?: number
    cursor?: number
    search?: string
    limit?: number
    archived?: boolean | "true" | "false"
  }
  url: "/experimental/session"
}

export type ExperimentalSessionListResponses = {
  /**
   * List of sessions
   */
  200: Array<GlobalSession>
}

export type ExperimentalSessionListResponse = ExperimentalSessionListResponses[keyof ExperimentalSessionListResponses]

export type ExperimentalResourceListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/resource"
}

export type ExperimentalResourceListResponses = {
  /**
   * MCP resources
   */
  200: {
    [key: string]: McpResource
  }
}

export type ExperimentalResourceListResponse =
  ExperimentalResourceListResponses[keyof ExperimentalResourceListResponses]

export type FindTextData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    pattern: string
  }
  url: "/find"
}

export type FindTextResponses = {
  /**
   * Matches
   */
  200: Array<{
    path: {
      text: string
    }
    lines: {
      text: string
    }
    line_number: number
    absolute_offset: number
    submatches: Array<{
      match: {
        text: string
      }
      start: number
      end: number
    }>
  }>
}

export type FindTextResponse = FindTextResponses[keyof FindTextResponses]

export type FindFilesData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    query: string
    dirs?: "true" | "false"
    type?: "file" | "directory"
    limit?: number
  }
  url: "/find/file"
}

export type FindFilesResponses = {
  /**
   * File paths
   */
  200: Array<string>
}

export type FindFilesResponse = FindFilesResponses[keyof FindFilesResponses]

export type FindSymbolsData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    query: string
  }
  url: "/find/symbol"
}

export type FindSymbolsResponses = {
  /**
   * Symbols
   */
  200: Array<Symbol>
}

export type FindSymbolsResponse = FindSymbolsResponses[keyof FindSymbolsResponses]

export type FileListData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    path: string
  }
  url: "/file"
}

export type FileListResponses = {
  /**
   * Files and directories
   */
  200: Array<FileNode>
}

export type FileListResponse = FileListResponses[keyof FileListResponses]

export type FileReadData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    path: string
  }
  url: "/file/content"
}

export type FileReadResponses = {
  /**
   * File content
   */
  200: FileContent
}

export type FileReadResponse = FileReadResponses[keyof FileReadResponses]

export type FileStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/file/status"
}

export type FileStatusResponses = {
  /**
   * File status
   */
  200: Array<File>
}

export type FileStatusResponse = FileStatusResponses[keyof FileStatusResponses]

export type InstanceDisposeData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/instance/dispose"
}

export type InstanceDisposeResponses = {
  /**
   * Instance disposed
   */
  200: boolean
}

export type InstanceDisposeResponse = InstanceDisposeResponses[keyof InstanceDisposeResponses]

export type PathGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/path"
}

export type PathGetResponses = {
  /**
   * Path
   */
  200: Path
}

export type PathGetResponse = PathGetResponses[keyof PathGetResponses]

export type VcsGetData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/vcs"
}

export type VcsGetResponses = {
  /**
   * VCS info
   */
  200: VcsInfo
}

export type VcsGetResponse = VcsGetResponses[keyof VcsGetResponses]

export type VcsStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/vcs/status"
}

export type VcsStatusResponses = {
  /**
   * VCS status
   */
  200: Array<VcsFileStatus>
}

export type VcsStatusResponse = VcsStatusResponses[keyof VcsStatusResponses]

export type VcsDiffData = {
  body?: never
  path?: never
  query: {
    directory?: string
    workspace?: string
    mode: "git" | "branch"
  }
  url: "/vcs/diff"
}

export type VcsDiffResponses = {
  /**
   * VCS diff
   */
  200: Array<VcsFileDiff>
}

export type VcsDiffResponse = VcsDiffResponses[keyof VcsDiffResponses]

export type VcsDiffRawData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/vcs/diff/raw"
}

export type VcsDiffRawResponses = {
  /**
   * Raw VCS diff
   */
  200: string
}

export type VcsDiffRawResponse = VcsDiffRawResponses[keyof VcsDiffRawResponses]

export type VcsApplyData = {
  body?: {
    patch: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/vcs/apply"
}

export type VcsApplyErrors = {
  /**
   * VcsApplyError
   */
  400: VcsApplyError
}

export type VcsApplyError2 = VcsApplyErrors[keyof VcsApplyErrors]

export type VcsApplyResponses = {
  /**
   * VCS patch applied
   */
  200: {
    applied: boolean
  }
}

export type VcsApplyResponse = VcsApplyResponses[keyof VcsApplyResponses]

export type CommandListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/command"
}

export type CommandListResponses = {
  /**
   * List of commands
   */
  200: Array<Command>
}

export type CommandListResponse = CommandListResponses[keyof CommandListResponses]

export type AppAgentsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/agent"
}

export type AppAgentsResponses = {
  /**
   * List of agents
   */
  200: Array<Agent>
}

export type AppAgentsResponse = AppAgentsResponses[keyof AppAgentsResponses]

export type AppSkillsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/skill"
}

export type AppSkillsResponses = {
  /**
   * List of skills
   */
  200: Array<{
    name: string
    description?: string
    location: string
    content: string
  }>
}

export type AppSkillsResponse = AppSkillsResponses[keyof AppSkillsResponses]

export type LspStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/lsp"
}

export type LspStatusResponses = {
  /**
   * LSP server status
   */
  200: Array<LspStatus>
}

export type LspStatusResponse = LspStatusResponses[keyof LspStatusResponses]

export type FormatterStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/formatter"
}

export type FormatterStatusResponses = {
  /**
   * Formatter status
   */
  200: Array<FormatterStatus>
}

export type FormatterStatusResponse = FormatterStatusResponses[keyof FormatterStatusResponses]

export type McpStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp"
}

export type McpStatusResponses = {
  /**
   * MCP server status
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpStatusResponse = McpStatusResponses[keyof McpStatusResponses]

export type McpAddData = {
  body?: {
    name: string
    config: McpLocalConfig | McpRemoteConfig
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp"
}

export type McpAddErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type McpAddError = McpAddErrors[keyof McpAddErrors]

export type McpAddResponses = {
  /**
   * MCP server added successfully
   */
  200: {
    [key: string]: McpStatus
  }
}

export type McpAddResponse = McpAddResponses[keyof McpAddResponses]

export type McpAuthRemoveData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthRemoveErrors = {
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthRemoveError = McpAuthRemoveErrors[keyof McpAuthRemoveErrors]

export type McpAuthRemoveResponses = {
  /**
   * OAuth credentials removed
   */
  200: {
    success: true
  }
}

export type McpAuthRemoveResponse = McpAuthRemoveResponses[keyof McpAuthRemoveResponses]

export type McpAuthStartData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/auth"
}

export type McpAuthStartErrors = {
  /**
   * McpUnsupportedOAuthError
   */
  400: McpUnsupportedOAuthError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthStartError = McpAuthStartErrors[keyof McpAuthStartErrors]

export type McpAuthStartResponses = {
  /**
   * OAuth flow started
   */
  200: {
    authorizationUrl: string
    oauthState: string
  }
}

export type McpAuthStartResponse = McpAuthStartResponses[keyof McpAuthStartResponses]

export type McpAuthCallbackData = {
  body?: {
    code: string
  }
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/auth/callback"
}

export type McpAuthCallbackErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthCallbackError = McpAuthCallbackErrors[keyof McpAuthCallbackErrors]

export type McpAuthCallbackResponses = {
  /**
   * OAuth authentication completed
   */
  200: McpStatus
}

export type McpAuthCallbackResponse = McpAuthCallbackResponses[keyof McpAuthCallbackResponses]

export type McpAuthAuthenticateData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/auth/authenticate"
}

export type McpAuthAuthenticateErrors = {
  /**
   * McpUnsupportedOAuthError
   */
  400: McpUnsupportedOAuthError
  /**
   * Not found
   */
  404: NotFoundError
}

export type McpAuthAuthenticateError = McpAuthAuthenticateErrors[keyof McpAuthAuthenticateErrors]

export type McpAuthAuthenticateResponses = {
  /**
   * OAuth authentication completed
   */
  200: McpStatus
}

export type McpAuthAuthenticateResponse = McpAuthAuthenticateResponses[keyof McpAuthAuthenticateResponses]

export type McpConnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/connect"
}

export type McpConnectResponses = {
  /**
   * MCP server connected successfully
   */
  200: boolean
}

export type McpConnectResponse = McpConnectResponses[keyof McpConnectResponses]

export type McpDisconnectData = {
  body?: never
  path: {
    name: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/mcp/{name}/disconnect"
}

export type McpDisconnectResponses = {
  /**
   * MCP server disconnected successfully
   */
  200: boolean
}

export type McpDisconnectResponse = McpDisconnectResponses[keyof McpDisconnectResponses]

export type ProjectListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/project"
}

export type ProjectListResponses = {
  /**
   * List of projects
   */
  200: Array<Project>
}

export type ProjectListResponse = ProjectListResponses[keyof ProjectListResponses]

export type ProjectCurrentData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/project/current"
}

export type ProjectCurrentResponses = {
  /**
   * Current project information
   */
  200: Project
}

export type ProjectCurrentResponse = ProjectCurrentResponses[keyof ProjectCurrentResponses]

export type ProjectInitGitData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/project/git/init"
}

export type ProjectInitGitResponses = {
  /**
   * Project information after git initialization
   */
  200: Project
}

export type ProjectInitGitResponse = ProjectInitGitResponses[keyof ProjectInitGitResponses]

export type ProjectUpdateData = {
  body?: {
    name?: string
    icon?: {
      url?: string
      override?: string
      color?: string
    }
    commands?: {
      /**
       * Startup script to run when creating a new workspace (worktree)
       */
      start?: string
    }
  }
  path: {
    projectID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/project/{projectID}"
}

export type ProjectUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type ProjectUpdateError = ProjectUpdateErrors[keyof ProjectUpdateErrors]

export type ProjectUpdateResponses = {
  /**
   * Updated project information
   */
  200: Project
}

export type ProjectUpdateResponse = ProjectUpdateResponses[keyof ProjectUpdateResponses]

export type PtyShellsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/shells"
}

export type PtyShellsResponses = {
  /**
   * List of shells
   */
  200: Array<{
    path: string
    name: string
    acceptable: boolean
  }>
}

export type PtyShellsResponse = PtyShellsResponses[keyof PtyShellsResponses]

export type PtyListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty"
}

export type PtyListResponses = {
  /**
   * List of sessions
   */
  200: Array<Pty>
}

export type PtyListResponse = PtyListResponses[keyof PtyListResponses]

export type PtyCreateData = {
  body?: {
    command?: string
    args?: Array<string>
    cwd?: string
    title?: string
    env?: {
      [key: string]: string
    }
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty"
}

export type PtyCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type PtyCreateError = PtyCreateErrors[keyof PtyCreateErrors]

export type PtyCreateResponses = {
  /**
   * Created session
   */
  200: Pty
}

export type PtyCreateResponse = PtyCreateResponses[keyof PtyCreateResponses]

export type PtyRemoveData = {
  body?: never
  path: {
    ptyID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/{ptyID}"
}

export type PtyRemoveErrors = {
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type PtyRemoveError = PtyRemoveErrors[keyof PtyRemoveErrors]

export type PtyRemoveResponses = {
  /**
   * Session removed
   */
  200: boolean
}

export type PtyRemoveResponse = PtyRemoveResponses[keyof PtyRemoveResponses]

export type PtyGetData = {
  body?: never
  path: {
    ptyID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/{ptyID}"
}

export type PtyGetErrors = {
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type PtyGetError = PtyGetErrors[keyof PtyGetErrors]

export type PtyGetResponses = {
  /**
   * Session info
   */
  200: Pty
}

export type PtyGetResponse = PtyGetResponses[keyof PtyGetResponses]

export type PtyUpdateData = {
  body?: {
    title?: string
    size?: {
      rows: number
      cols: number
    }
  }
  path: {
    ptyID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/{ptyID}"
}

export type PtyUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type PtyUpdateError = PtyUpdateErrors[keyof PtyUpdateErrors]

export type PtyUpdateResponses = {
  /**
   * Updated session
   */
  200: Pty
}

export type PtyUpdateResponse = PtyUpdateResponses[keyof PtyUpdateResponses]

export type PtyConnectTokenData = {
  body?: never
  path: {
    ptyID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/{ptyID}/connect-token"
}

export type PtyConnectTokenErrors = {
  /**
   * Forbidden
   */
  403: EffectHttpApiErrorForbidden
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type PtyConnectTokenError = PtyConnectTokenErrors[keyof PtyConnectTokenErrors]

export type PtyConnectTokenResponses = {
  /**
   * WebSocket connect token
   */
  200: {
    ticket: string
    expires_in: number
  }
}

export type PtyConnectTokenResponse = PtyConnectTokenResponses[keyof PtyConnectTokenResponses]

export type QuestionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/question"
}

export type QuestionListResponses = {
  /**
   * List of pending questions
   */
  200: Array<QuestionRequest>
}

export type QuestionListResponse = QuestionListResponses[keyof QuestionListResponses]

export type QuestionReplyData = {
  body?: {
    /**
     * User answers in order of questions (each answer is an array of selected labels)
     */
    answers: Array<QuestionAnswer>
  }
  path: {
    requestID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/question/{requestID}/reply"
}

export type QuestionReplyErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type QuestionReplyError = QuestionReplyErrors[keyof QuestionReplyErrors]

export type QuestionReplyResponses = {
  /**
   * Question answered successfully
   */
  200: boolean
}

export type QuestionReplyResponse = QuestionReplyResponses[keyof QuestionReplyResponses]

export type QuestionRejectData = {
  body?: never
  path: {
    requestID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/question/{requestID}/reject"
}

export type QuestionRejectErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type QuestionRejectError = QuestionRejectErrors[keyof QuestionRejectErrors]

export type QuestionRejectResponses = {
  /**
   * Question rejected successfully
   */
  200: boolean
}

export type QuestionRejectResponse = QuestionRejectResponses[keyof QuestionRejectResponses]

export type PermissionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/permission"
}

export type PermissionListResponses = {
  /**
   * List of pending permissions
   */
  200: Array<PermissionRequest>
}

export type PermissionListResponse = PermissionListResponses[keyof PermissionListResponses]

export type PermissionReplyData = {
  body?: {
    reply: "once" | "always" | "reject"
    message?: string
  }
  path: {
    requestID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/permission/{requestID}/reply"
}

export type PermissionReplyErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type PermissionReplyError = PermissionReplyErrors[keyof PermissionReplyErrors]

export type PermissionReplyResponses = {
  /**
   * Permission processed successfully
   */
  200: boolean
}

export type PermissionReplyResponse = PermissionReplyResponses[keyof PermissionReplyResponses]

export type ProviderListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/provider"
}

export type ProviderListResponses = {
  /**
   * List of providers
   */
  200: {
    all: Array<Provider>
    default: {
      [key: string]: string
    }
    connected: Array<string>
  }
}

export type ProviderListResponse = ProviderListResponses[keyof ProviderListResponses]

export type ProviderAuthData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/provider/auth"
}

export type ProviderAuthResponses = {
  /**
   * Provider auth methods
   */
  200: {
    [key: string]: Array<ProviderAuthMethod>
  }
}

export type ProviderAuthResponse = ProviderAuthResponses[keyof ProviderAuthResponses]

export type ProviderOauthAuthorizeData = {
  body?: {
    /**
     * Auth method index
     */
    method: number
    inputs?: {
      [key: string]: string
    }
  }
  path: {
    providerID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/provider/{providerID}/oauth/authorize"
}

export type ProviderOauthAuthorizeErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ProviderOauthAuthorizeError = ProviderOauthAuthorizeErrors[keyof ProviderOauthAuthorizeErrors]

export type ProviderOauthAuthorizeResponses = {
  /**
   * Authorization URL and method
   */
  200: ProviderAuthAuthorization
}

export type ProviderOauthAuthorizeResponse = ProviderOauthAuthorizeResponses[keyof ProviderOauthAuthorizeResponses]

export type ProviderOauthCallbackData = {
  body?: {
    /**
     * Auth method index
     */
    method: number
    code?: string
  }
  path: {
    providerID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/provider/{providerID}/oauth/callback"
}

export type ProviderOauthCallbackErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ProviderOauthCallbackError = ProviderOauthCallbackErrors[keyof ProviderOauthCallbackErrors]

export type ProviderOauthCallbackResponses = {
  /**
   * OAuth callback processed successfully
   */
  200: boolean
}

export type ProviderOauthCallbackResponse = ProviderOauthCallbackResponses[keyof ProviderOauthCallbackResponses]

export type SessionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
    scope?: "project"
    path?: string
    roots?: boolean | "true" | "false"
    start?: number
    search?: string
    limit?: number
  }
  url: "/session"
}

export type SessionListResponses = {
  /**
   * List of sessions
   */
  200: Array<Session>
}

export type SessionListResponse = SessionListResponses[keyof SessionListResponses]

export type SessionCreateData = {
  body?: {
    parentID?: string
    title?: string
    agent?: string
    model?: {
      id: string
      providerID: string
      variant?: string
    }
    permission?: PermissionRuleset
    workspaceID?: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session"
}

export type SessionCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SessionCreateError = SessionCreateErrors[keyof SessionCreateErrors]

export type SessionCreateResponses = {
  /**
   * Successfully created session
   */
  200: Session
}

export type SessionCreateResponse = SessionCreateResponses[keyof SessionCreateResponses]

export type SessionStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/status"
}

export type SessionStatusErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SessionStatusError = SessionStatusErrors[keyof SessionStatusErrors]

export type SessionStatusResponses = {
  /**
   * Get session status
   */
  200: {
    [key: string]: SessionStatus
  }
}

export type SessionStatusResponse = SessionStatusResponses[keyof SessionStatusResponses]

export type SessionDeleteData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}"
}

export type SessionDeleteErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionDeleteError = SessionDeleteErrors[keyof SessionDeleteErrors]

export type SessionDeleteResponses = {
  /**
   * Successfully deleted session
   */
  200: boolean
}

export type SessionDeleteResponse = SessionDeleteResponses[keyof SessionDeleteResponses]

export type SessionGetData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}"
}

export type SessionGetErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionGetError = SessionGetErrors[keyof SessionGetErrors]

export type SessionGetResponses = {
  /**
   * Get session
   */
  200: Session
}

export type SessionGetResponse = SessionGetResponses[keyof SessionGetResponses]

export type SessionUpdateData = {
  body?: {
    title?: string
    permission?: PermissionRuleset
    time?: {
      archived?: number
    }
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}"
}

export type SessionUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionUpdateError = SessionUpdateErrors[keyof SessionUpdateErrors]

export type SessionUpdateResponses = {
  /**
   * Successfully updated session
   */
  200: Session
}

export type SessionUpdateResponse = SessionUpdateResponses[keyof SessionUpdateResponses]

export type SessionChildrenData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/children"
}

export type SessionChildrenErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionChildrenError = SessionChildrenErrors[keyof SessionChildrenErrors]

export type SessionChildrenResponses = {
  /**
   * List of children
   */
  200: Array<Session>
}

export type SessionChildrenResponse = SessionChildrenResponses[keyof SessionChildrenResponses]

export type SessionTodoData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/todo"
}

export type SessionTodoErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionTodoError = SessionTodoErrors[keyof SessionTodoErrors]

export type SessionTodoResponses = {
  /**
   * Todo list
   */
  200: Array<Todo>
}

export type SessionTodoResponse = SessionTodoResponses[keyof SessionTodoResponses]

export type SessionDiffData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
    messageID?: string
  }
  url: "/session/{sessionID}/diff"
}

export type SessionDiffResponses = {
  /**
   * Successfully retrieved diff
   */
  200: Array<SnapshotFileDiff>
}

export type SessionDiffResponse = SessionDiffResponses[keyof SessionDiffResponses]

export type SessionMessagesData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
    limit?: number
    before?: string
  }
  url: "/session/{sessionID}/message"
}

export type SessionMessagesErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionMessagesError = SessionMessagesErrors[keyof SessionMessagesErrors]

export type SessionMessagesResponses = {
  /**
   * List of messages
   */
  200: Array<{
    info: Message
    parts: Array<Part>
  }>
}

export type SessionMessagesResponse = SessionMessagesResponses[keyof SessionMessagesResponses]

export type SessionPromptData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    tools?: {
      [key: string]: boolean
    }
    format?: OutputFormat
    system?: string
    variant?: string
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/message"
}

export type SessionPromptErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionPromptError = SessionPromptErrors[keyof SessionPromptErrors]

export type SessionPromptResponses = {
  /**
   * Created message
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionPromptResponse = SessionPromptResponses[keyof SessionPromptResponses]

export type SessionDeleteMessageData = {
  body?: never
  path: {
    sessionID: string
    messageID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/message/{messageID}"
}

export type SessionDeleteMessageErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionDeleteMessageError = SessionDeleteMessageErrors[keyof SessionDeleteMessageErrors]

export type SessionDeleteMessageResponses = {
  /**
   * Successfully deleted message
   */
  200: boolean
}

export type SessionDeleteMessageResponse = SessionDeleteMessageResponses[keyof SessionDeleteMessageResponses]

export type SessionMessageData = {
  body?: never
  path: {
    sessionID: string
    messageID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/message/{messageID}"
}

export type SessionMessageErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionMessageError = SessionMessageErrors[keyof SessionMessageErrors]

export type SessionMessageResponses = {
  /**
   * Message
   */
  200: {
    info: Message
    parts: Array<Part>
  }
}

export type SessionMessageResponse = SessionMessageResponses[keyof SessionMessageResponses]

export type SessionForkData = {
  body?: {
    messageID?: string
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/fork"
}

export type SessionForkErrors = {
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionForkError = SessionForkErrors[keyof SessionForkErrors]

export type SessionForkResponses = {
  /**
   * 200
   */
  200: Session
}

export type SessionForkResponse = SessionForkResponses[keyof SessionForkResponses]

export type SessionAbortData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/abort"
}

export type SessionAbortErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionAbortError = SessionAbortErrors[keyof SessionAbortErrors]

export type SessionAbortResponses = {
  /**
   * Aborted session
   */
  200: boolean
}

export type SessionAbortResponse = SessionAbortResponses[keyof SessionAbortResponses]

export type SessionInitData = {
  body?: {
    modelID: string
    providerID: string
    messageID: string
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/init"
}

export type SessionInitErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionInitError = SessionInitErrors[keyof SessionInitErrors]

export type SessionInitResponses = {
  /**
   * 200
   */
  200: boolean
}

export type SessionInitResponse = SessionInitResponses[keyof SessionInitResponses]

export type SessionUnshareData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/share"
}

export type SessionUnshareErrors = {
  /**
   * NotFoundError
   */
  404: NotFoundError
  /**
   * InternalServerError
   */
  500: EffectHttpApiErrorInternalServerError
}

export type SessionUnshareError = SessionUnshareErrors[keyof SessionUnshareErrors]

export type SessionUnshareResponses = {
  /**
   * Successfully unshared session
   */
  200: Session
}

export type SessionUnshareResponse = SessionUnshareResponses[keyof SessionUnshareResponses]

export type SessionShareData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/share"
}

export type SessionShareErrors = {
  /**
   * NotFoundError
   */
  404: NotFoundError
  /**
   * InternalServerError
   */
  500: EffectHttpApiErrorInternalServerError
}

export type SessionShareError = SessionShareErrors[keyof SessionShareErrors]

export type SessionShareResponses = {
  /**
   * Successfully shared session
   */
  200: Session
}

export type SessionShareResponse = SessionShareResponses[keyof SessionShareResponses]

export type SessionSummarizeData = {
  body?: {
    providerID: string
    modelID: string
    auto?: boolean
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/summarize"
}

export type SessionSummarizeErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type SessionSummarizeError = SessionSummarizeErrors[keyof SessionSummarizeErrors]

export type SessionSummarizeResponses = {
  /**
   * Summarized session
   */
  200: boolean
}

export type SessionSummarizeResponse = SessionSummarizeResponses[keyof SessionSummarizeResponses]

export type SessionPromptAsyncData = {
  body?: {
    messageID?: string
    model?: {
      providerID: string
      modelID: string
    }
    agent?: string
    noReply?: boolean
    tools?: {
      [key: string]: boolean
    }
    format?: OutputFormat
    system?: string
    variant?: string
    parts: Array<TextPartInput | FilePartInput | AgentPartInput | SubtaskPartInput>
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/prompt_async"
}

export type SessionPromptAsyncErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionPromptAsyncError = SessionPromptAsyncErrors[keyof SessionPromptAsyncErrors]

export type SessionPromptAsyncResponses = {
  /**
   * Prompt accepted
   */
  204: void
}

export type SessionPromptAsyncResponse = SessionPromptAsyncResponses[keyof SessionPromptAsyncResponses]

export type SessionCommandData = {
  body?: {
    messageID?: string
    agent?: string
    model?: string
    arguments: string
    command: string
    variant?: string
    parts?: Array<{
      id?: string
      type: "file"
      mime: string
      filename?: string
      url: string
      source?: FilePartSource
    }>
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/command"
}

export type SessionCommandErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionCommandError = SessionCommandErrors[keyof SessionCommandErrors]

export type SessionCommandResponses = {
  /**
   * Created message
   */
  200: {
    info: AssistantMessage
    parts: Array<Part>
  }
}

export type SessionCommandResponse = SessionCommandResponses[keyof SessionCommandResponses]

export type SessionShellData = {
  body?: {
    messageID?: string
    agent: string
    model?: {
      providerID: string
      modelID: string
    }
    command: string
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/shell"
}

export type SessionShellErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionShellError = SessionShellErrors[keyof SessionShellErrors]

export type SessionShellResponses = {
  /**
   * Created message
   */
  200: {
    info: Message
    parts: Array<Part>
  }
}

export type SessionShellResponse = SessionShellResponses[keyof SessionShellResponses]

export type SessionRevertData = {
  body?: {
    messageID: string
    partID?: string
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/revert"
}

export type SessionRevertErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionRevertError = SessionRevertErrors[keyof SessionRevertErrors]

export type SessionRevertResponses = {
  /**
   * Updated session
   */
  200: Session
}

export type SessionRevertResponse = SessionRevertResponses[keyof SessionRevertResponses]

export type SessionUnrevertData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/unrevert"
}

export type SessionUnrevertErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type SessionUnrevertError = SessionUnrevertErrors[keyof SessionUnrevertErrors]

export type SessionUnrevertResponses = {
  /**
   * Updated session
   */
  200: Session
}

export type SessionUnrevertResponse = SessionUnrevertResponses[keyof SessionUnrevertResponses]

export type PermissionRespondData = {
  body?: {
    response: "once" | "always" | "reject"
  }
  path: {
    sessionID: string
    permissionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/permissions/{permissionID}"
}

export type PermissionRespondErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type PermissionRespondError = PermissionRespondErrors[keyof PermissionRespondErrors]

export type PermissionRespondResponses = {
  /**
   * Permission processed successfully
   */
  200: boolean
}

export type PermissionRespondResponse = PermissionRespondResponses[keyof PermissionRespondResponses]

export type PartDeleteData = {
  body?: never
  path: {
    sessionID: string
    messageID: string
    partID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/message/{messageID}/part/{partID}"
}

export type PartDeleteErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type PartDeleteError = PartDeleteErrors[keyof PartDeleteErrors]

export type PartDeleteResponses = {
  /**
   * Successfully deleted part
   */
  200: boolean
}

export type PartDeleteResponse = PartDeleteResponses[keyof PartDeleteResponses]

export type PartUpdateData = {
  body?: Part
  path: {
    sessionID: string
    messageID: string
    partID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/session/{sessionID}/message/{messageID}/part/{partID}"
}

export type PartUpdateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * Not found
   */
  404: NotFoundError
}

export type PartUpdateError = PartUpdateErrors[keyof PartUpdateErrors]

export type PartUpdateResponses = {
  /**
   * Successfully updated part
   */
  200: Part
}

export type PartUpdateResponse = PartUpdateResponses[keyof PartUpdateResponses]

export type SyncStartData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/sync/start"
}

export type SyncStartResponses = {
  /**
   * Workspace sync started
   */
  200: boolean
}

export type SyncStartResponse = SyncStartResponses[keyof SyncStartResponses]

export type SyncReplayData = {
  body?: {
    directory: string
    events: Array<{
      id: string
      aggregateID: string
      seq: number
      type: string
      data: {
        [key: string]: unknown
      }
    }>
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/sync/replay"
}

export type SyncReplayErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SyncReplayError = SyncReplayErrors[keyof SyncReplayErrors]

export type SyncReplayResponses = {
  /**
   * Replayed sync events
   */
  200: {
    sessionID: string
  }
}

export type SyncReplayResponse = SyncReplayResponses[keyof SyncReplayResponses]

export type SyncStealData = {
  body?: {
    sessionID: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/sync/steal"
}

export type SyncStealErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SyncStealError = SyncStealErrors[keyof SyncStealErrors]

export type SyncStealResponses = {
  /**
   * Session stolen into workspace
   */
  200: {
    sessionID: string
  }
}

export type SyncStealResponse = SyncStealResponses[keyof SyncStealResponses]

export type SyncHistoryListData = {
  body?: {
    [key: string]: number
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/sync/history"
}

export type SyncHistoryListErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type SyncHistoryListError = SyncHistoryListErrors[keyof SyncHistoryListErrors]

export type SyncHistoryListResponses = {
  /**
   * Sync events
   */
  200: Array<{
    id: string
    aggregate_id: string
    seq: number
    type: string
    data: {
      [key: string]: unknown
    }
  }>
}

export type SyncHistoryListResponse = SyncHistoryListResponses[keyof SyncHistoryListResponses]

export type V2SessionListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session"
}

export type V2SessionListErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type V2SessionListError = V2SessionListErrors[keyof V2SessionListErrors]

export type V2SessionListResponses = {
  /**
   * V2SessionsResponse
   */
  200: V2SessionsResponse
}

export type V2SessionListResponse = V2SessionListResponses[keyof V2SessionListResponses]

export type V2SessionPromptData = {
  body?: {
    prompt: Prompt
    delivery?: SessionDelivery
  }
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session/{sessionID}/prompt"
}

export type V2SessionPromptResponses = {
  /**
   * Session.Message
   */
  200: SessionMessage
}

export type V2SessionPromptResponse = V2SessionPromptResponses[keyof V2SessionPromptResponses]

export type V2SessionCompactData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session/{sessionID}/compact"
}

export type V2SessionCompactResponses = {
  /**
   * <No Content>
   */
  204: void
}

export type V2SessionCompactResponse = V2SessionCompactResponses[keyof V2SessionCompactResponses]

export type V2SessionWaitData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session/{sessionID}/wait"
}

export type V2SessionWaitResponses = {
  /**
   * <No Content>
   */
  204: void
}

export type V2SessionWaitResponse = V2SessionWaitResponses[keyof V2SessionWaitResponses]

export type V2SessionContextData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session/{sessionID}/context"
}

export type V2SessionContextResponses = {
  /**
   * Success
   */
  200: Array<SessionMessage>
}

export type V2SessionContextResponse = V2SessionContextResponses[keyof V2SessionContextResponses]

export type V2SessionMessagesData = {
  body?: never
  path: {
    sessionID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/api/session/{sessionID}/message"
}

export type V2SessionMessagesErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type V2SessionMessagesError = V2SessionMessagesErrors[keyof V2SessionMessagesErrors]

export type V2SessionMessagesResponses = {
  /**
   * V2SessionMessagesResponse
   */
  200: V2SessionMessagesResponse
}

export type V2SessionMessagesResponse2 = V2SessionMessagesResponses[keyof V2SessionMessagesResponses]

export type TuiAppendPromptData = {
  body?: {
    text: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/append-prompt"
}

export type TuiAppendPromptErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiAppendPromptError = TuiAppendPromptErrors[keyof TuiAppendPromptErrors]

export type TuiAppendPromptResponses = {
  /**
   * Prompt processed successfully
   */
  200: boolean
}

export type TuiAppendPromptResponse = TuiAppendPromptResponses[keyof TuiAppendPromptResponses]

export type TuiOpenHelpData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/open-help"
}

export type TuiOpenHelpResponses = {
  /**
   * Help dialog opened successfully
   */
  200: boolean
}

export type TuiOpenHelpResponse = TuiOpenHelpResponses[keyof TuiOpenHelpResponses]

export type TuiOpenSessionsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/open-sessions"
}

export type TuiOpenSessionsResponses = {
  /**
   * Session dialog opened successfully
   */
  200: boolean
}

export type TuiOpenSessionsResponse = TuiOpenSessionsResponses[keyof TuiOpenSessionsResponses]

export type TuiOpenThemesData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/open-themes"
}

export type TuiOpenThemesResponses = {
  /**
   * Theme dialog opened successfully
   */
  200: boolean
}

export type TuiOpenThemesResponse = TuiOpenThemesResponses[keyof TuiOpenThemesResponses]

export type TuiOpenModelsData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/open-models"
}

export type TuiOpenModelsResponses = {
  /**
   * Model dialog opened successfully
   */
  200: boolean
}

export type TuiOpenModelsResponse = TuiOpenModelsResponses[keyof TuiOpenModelsResponses]

export type TuiSubmitPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/submit-prompt"
}

export type TuiSubmitPromptResponses = {
  /**
   * Prompt submitted successfully
   */
  200: boolean
}

export type TuiSubmitPromptResponse = TuiSubmitPromptResponses[keyof TuiSubmitPromptResponses]

export type TuiClearPromptData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/clear-prompt"
}

export type TuiClearPromptResponses = {
  /**
   * Prompt cleared successfully
   */
  200: boolean
}

export type TuiClearPromptResponse = TuiClearPromptResponses[keyof TuiClearPromptResponses]

export type TuiExecuteCommandData = {
  body?: {
    command: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/execute-command"
}

export type TuiExecuteCommandErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiExecuteCommandError = TuiExecuteCommandErrors[keyof TuiExecuteCommandErrors]

export type TuiExecuteCommandResponses = {
  /**
   * Command executed successfully
   */
  200: boolean
}

export type TuiExecuteCommandResponse = TuiExecuteCommandResponses[keyof TuiExecuteCommandResponses]

export type TuiShowToastData = {
  body?: {
    title?: string
    message: string
    variant: "info" | "success" | "warning" | "error"
    duration?: number
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/show-toast"
}

export type TuiShowToastResponses = {
  /**
   * Toast notification shown successfully
   */
  200: boolean
}

export type TuiShowToastResponse = TuiShowToastResponses[keyof TuiShowToastResponses]

export type TuiPublishData = {
  body?: EventTuiPromptAppend2 | EventTuiCommandExecute2 | EventTuiToastShow2 | EventTuiSessionSelect2
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/publish"
}

export type TuiPublishErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type TuiPublishError = TuiPublishErrors[keyof TuiPublishErrors]

export type TuiPublishResponses = {
  /**
   * Event published successfully
   */
  200: boolean
}

export type TuiPublishResponse = TuiPublishResponses[keyof TuiPublishResponses]

export type TuiSelectSessionData = {
  body?: {
    /**
     * Session ID to navigate to
     */
    sessionID: string
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/select-session"
}

export type TuiSelectSessionErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
  /**
   * NotFoundError
   */
  404: NotFoundError
}

export type TuiSelectSessionError = TuiSelectSessionErrors[keyof TuiSelectSessionErrors]

export type TuiSelectSessionResponses = {
  /**
   * Session selected successfully
   */
  200: boolean
}

export type TuiSelectSessionResponse = TuiSelectSessionResponses[keyof TuiSelectSessionResponses]

export type TuiControlNextData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/control/next"
}

export type TuiControlNextResponses = {
  /**
   * Next TUI request
   */
  200: {
    path: string
    body: unknown
  }
}

export type TuiControlNextResponse = TuiControlNextResponses[keyof TuiControlNextResponses]

export type TuiControlResponseData = {
  body?: unknown
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/tui/control/response"
}

export type TuiControlResponseResponses = {
  /**
   * Response submitted successfully
   */
  200: boolean
}

export type TuiControlResponseResponse = TuiControlResponseResponses[keyof TuiControlResponseResponses]

export type ExperimentalWorkspaceAdapterListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace/adapter"
}

export type ExperimentalWorkspaceAdapterListResponses = {
  /**
   * Workspace adapters
   */
  200: Array<{
    type: string
    name: string
    description: string
  }>
}

export type ExperimentalWorkspaceAdapterListResponse =
  ExperimentalWorkspaceAdapterListResponses[keyof ExperimentalWorkspaceAdapterListResponses]

export type ExperimentalWorkspaceListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace"
}

export type ExperimentalWorkspaceListResponses = {
  /**
   * Workspaces
   */
  200: Array<Workspace>
}

export type ExperimentalWorkspaceListResponse =
  ExperimentalWorkspaceListResponses[keyof ExperimentalWorkspaceListResponses]

export type ExperimentalWorkspaceCreateData = {
  body?: {
    id?: string
    type: string
    branch: string | null
    extra?: unknown | null
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace"
}

export type ExperimentalWorkspaceCreateErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ExperimentalWorkspaceCreateError =
  ExperimentalWorkspaceCreateErrors[keyof ExperimentalWorkspaceCreateErrors]

export type ExperimentalWorkspaceCreateResponses = {
  /**
   * Workspace created
   */
  200: Workspace
}

export type ExperimentalWorkspaceCreateResponse =
  ExperimentalWorkspaceCreateResponses[keyof ExperimentalWorkspaceCreateResponses]

export type ExperimentalWorkspaceSyncListData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace/sync-list"
}

export type ExperimentalWorkspaceSyncListResponses = {
  /**
   * Workspace list synced
   */
  204: void
}

export type ExperimentalWorkspaceSyncListResponse =
  ExperimentalWorkspaceSyncListResponses[keyof ExperimentalWorkspaceSyncListResponses]

export type ExperimentalWorkspaceStatusData = {
  body?: never
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace/status"
}

export type ExperimentalWorkspaceStatusResponses = {
  /**
   * Workspace status
   */
  200: Array<{
    workspaceID: string
    status: "connected" | "connecting" | "disconnected" | "error"
  }>
}

export type ExperimentalWorkspaceStatusResponse =
  ExperimentalWorkspaceStatusResponses[keyof ExperimentalWorkspaceStatusResponses]

export type ExperimentalWorkspaceRemoveData = {
  body?: never
  path: {
    id: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace/{id}"
}

export type ExperimentalWorkspaceRemoveErrors = {
  /**
   * Bad request
   */
  400: BadRequestError
}

export type ExperimentalWorkspaceRemoveError =
  ExperimentalWorkspaceRemoveErrors[keyof ExperimentalWorkspaceRemoveErrors]

export type ExperimentalWorkspaceRemoveResponses = {
  /**
   * Workspace removed
   */
  200: Workspace
}

export type ExperimentalWorkspaceRemoveResponse =
  ExperimentalWorkspaceRemoveResponses[keyof ExperimentalWorkspaceRemoveResponses]

export type ExperimentalWorkspaceWarpData = {
  body?: {
    id: string | null
    sessionID: string
    copyChanges?: boolean
  }
  path?: never
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/experimental/workspace/warp"
}

export type ExperimentalWorkspaceWarpErrors = {
  /**
   * WorkspaceWarpError | VcsApplyError
   */
  400: WorkspaceWarpError | VcsApplyError
}

export type ExperimentalWorkspaceWarpError = ExperimentalWorkspaceWarpErrors[keyof ExperimentalWorkspaceWarpErrors]

export type ExperimentalWorkspaceWarpResponses = {
  /**
   * Session warped
   */
  204: void
}

export type ExperimentalWorkspaceWarpResponse =
  ExperimentalWorkspaceWarpResponses[keyof ExperimentalWorkspaceWarpResponses]

export type PtyConnectData = {
  body?: never
  path: {
    ptyID: string
  }
  query?: {
    directory?: string
    workspace?: string
  }
  url: "/pty/{ptyID}/connect"
}

export type PtyConnectErrors = {
  /**
   * Forbidden
   */
  403: EffectHttpApiErrorForbidden
  /**
   * Not found
   */
  404: NotFoundError
}

export type PtyConnectError = PtyConnectErrors[keyof PtyConnectErrors]

export type PtyConnectResponses = {
  /**
   * Connected session
   */
  200: boolean
}

export type PtyConnectResponse = PtyConnectResponses[keyof PtyConnectResponses]
````

## File: packages/sdk/js/src/v2/client.ts
````typescript
export * from "./gen/types.gen.js"

import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { OpencodeClient } from "./gen/sdk.gen.js"
export { type Config as OpencodeClientConfig, OpencodeClient }

function pick(value: string | null, fallback?: string, encode?: (value: string) => string) {
  if (!value) return
  if (!fallback) return value
  if (value === fallback) return fallback
  if (encode && value === encode(fallback)) return fallback
  return value
}

function rewrite(request: Request, values: { directory?: string; workspace?: string }) {
  if (request.method !== "GET" && request.method !== "HEAD") return request

  const url = new URL(request.url)
  let changed = false

  for (const [name, key] of [
    ["x-opencode-directory", "directory"],
    ["x-opencode-workspace", "workspace"],
  ] as const) {
    const value = pick(
      request.headers.get(name),
      key === "directory" ? values.directory : values.workspace,
      key === "directory" ? encodeURIComponent : undefined,
    )
    if (!value) continue
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value)
    }
    changed = true
  }

  if (!changed) return request

  const next = new Request(url, request)
  next.headers.delete("x-opencode-directory")
  next.headers.delete("x-opencode-workspace")
  return next
}

export function createOpencodeClient(config?: Config & { directory?: string; experimental_workspaceID?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    config.headers = {
      ...config.headers,
      "x-opencode-directory": encodeURIComponent(config.directory),
    }
  }

  if (config?.experimental_workspaceID) {
    config.headers = {
      ...config.headers,
      "x-opencode-workspace": config.experimental_workspaceID,
    }
  }

  const client = createClient(config)
  client.interceptors.request.use((request) =>
    rewrite(request, {
      directory: config?.directory,
      workspace: config?.experimental_workspaceID,
    }),
  )
  client.interceptors.response.use((response) => {
    const contentType = response.headers.get("content-type")
    if (contentType === "text/html")
      throw new Error("Request is not supported by this version of OpenCode Server (Server responded with text/html)")

    return response
  })
  // The generated client falls back to throwing a literal `{}` when the server
  // responds with an empty / unparseable error body, which surfaces as a bare
  // `{}` in TUI / CLI error output. Wrap ONLY that case in a real Error so
  // downstream formatters get a useful message — but pass through any parsed
  // JSON error body unchanged so existing consumers can still inspect fields.
  client.interceptors.error.use((error, response, request) => {
    const isEmpty =
      error === undefined ||
      error === null ||
      error === "" ||
      (typeof error === "object" && !(error instanceof Error) && Object.keys(error).length === 0)
    if (!isEmpty) return error
    const method = request?.method ?? "?"
    const url = request?.url ?? "?"
    if (!response) return new Error(`opencode server ${method} ${url}: network error (no response)`)
    const status = response.status
    const statusText = response.statusText ? " " + response.statusText : ""
    return new Error(`opencode server ${method} ${url} → ${status}${statusText}: (empty response body)`)
  })
  return new OpencodeClient({ client })
}
````

## File: packages/sdk/js/src/v2/data.ts
````typescript
import type { Part, UserMessage } from "./client.js"

export const message = {
  user(input: Omit<UserMessage, "role" | "time" | "id"> & { parts: Omit<Part, "id" | "sessionID" | "messageID">[] }): {
    info: UserMessage
    parts: Part[]
  } {
    const { parts: _parts, ...rest } = input

    const info: UserMessage = {
      ...rest,
      id: "asdasd",
      time: {
        created: Date.now(),
      },
      role: "user",
    }

    return {
      info,
      parts: input.parts.map(
        (part) =>
          ({
            ...part,
            id: "asdasd",
            messageID: info.id,
            sessionID: info.sessionID,
          }) as Part,
      ),
    }
  },
}
````

## File: packages/sdk/js/src/v2/index.ts
````typescript
export * from "./client.js"
export * from "./server.js"

import { createOpencodeClient } from "./client.js"
import { createOpencodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createOpencode(options?: ServerOptions) {
  const server = await createOpencodeServer({
    ...options,
  })

  const client = createOpencodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
````

## File: packages/sdk/js/src/v2/server.ts
````typescript
import launch from "cross-spawn"
import { type Config } from "./gen/types.gen.js"
import { stop, bindAbort } from "../process.js"

export type ServerOptions = {
  hostname?: string
  port?: number
  signal?: AbortSignal
  timeout?: number
  config?: Config
}

export type TuiOptions = {
  project?: string
  model?: string
  session?: string
  agent?: string
  signal?: AbortSignal
  config?: Config
}

export async function createOpencodeServer(options?: ServerOptions) {
  options = Object.assign(
    {
      hostname: "127.0.0.1",
      port: 4096,
      timeout: 5000,
    },
    options ?? {},
  )

  const args = [`serve`, `--hostname=${options.hostname}`, `--port=${options.port}`]
  if (options.config?.logLevel) args.push(`--log-level=${options.config.logLevel}`)

  const proc = launch(`opencode`, args, {
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options.config ?? {}),
    },
  })
  let clear = () => {}

  const url = await new Promise<string>((resolve, reject) => {
    const id = setTimeout(() => {
      clear()
      stop(proc)
      reject(new Error(`Timeout waiting for server to start after ${options.timeout}ms`))
    }, options.timeout)
    let output = ""
    let resolved = false
    proc.stdout?.on("data", (chunk) => {
      if (resolved) return
      output += chunk.toString()
      const lines = output.split("\n")
      for (const line of lines) {
        if (line.startsWith("opencode server listening")) {
          const match = line.match(/on\s+(https?:\/\/[^\s]+)/)
          if (!match) {
            clear()
            stop(proc)
            clearTimeout(id)
            reject(new Error(`Failed to parse server url from output: ${line}`))
            return
          }
          clearTimeout(id)
          resolved = true
          resolve(match[1]!)
          return
        }
      }
    })
    proc.stderr?.on("data", (chunk) => {
      output += chunk.toString()
    })
    proc.on("exit", (code) => {
      clearTimeout(id)
      let msg = `Server exited with code ${code}`
      if (output.trim()) {
        msg += `\nServer output: ${output}`
      }
      reject(new Error(msg))
    })
    proc.on("error", (error) => {
      clearTimeout(id)
      reject(error)
    })
    clear = bindAbort(proc, options.signal, () => {
      clearTimeout(id)
      reject(options.signal?.reason)
    })
  })

  return {
    url,
    close() {
      clear()
      stop(proc)
    },
  }
}

export function createOpencodeTui(options?: TuiOptions) {
  const args = []

  if (options?.project) {
    args.push(`--project=${options.project}`)
  }
  if (options?.model) {
    args.push(`--model=${options.model}`)
  }
  if (options?.session) {
    args.push(`--session=${options.session}`)
  }
  if (options?.agent) {
    args.push(`--agent=${options.agent}`)
  }

  const proc = launch(`opencode`, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options?.config ?? {}),
    },
  })

  const clear = bindAbort(proc, options?.signal)

  return {
    close() {
      clear()
      stop(proc)
    },
  }
}
````

## File: packages/sdk/js/src/client.ts
````typescript
export * from "./gen/types.gen.js"

import { createClient } from "./gen/client/client.gen.js"
import { type Config } from "./gen/client/types.gen.js"
import { OpencodeClient } from "./gen/sdk.gen.js"
export { type Config as OpencodeClientConfig, OpencodeClient }

function pick(value: string | null, fallback?: string) {
  if (!value) return
  if (!fallback) return value
  if (value === fallback) return fallback
  if (value === encodeURIComponent(fallback)) return fallback
  return value
}

function rewrite(request: Request, directory?: string) {
  if (request.method !== "GET" && request.method !== "HEAD") return request

  const value = pick(request.headers.get("x-opencode-directory"), directory)
  if (!value) return request

  const url = new URL(request.url)
  if (!url.searchParams.has("directory")) {
    url.searchParams.set("directory", value)
  }

  const next = new Request(url, request)
  next.headers.delete("x-opencode-directory")
  return next
}

export function createOpencodeClient(config?: Config & { directory?: string }) {
  if (!config?.fetch) {
    const customFetch: any = (req: any) => {
      // @ts-ignore
      req.timeout = false
      return fetch(req)
    }
    config = {
      ...config,
      fetch: customFetch,
    }
  }

  if (config?.directory) {
    config.headers = {
      ...config.headers,
      "x-opencode-directory": encodeURIComponent(config.directory),
    }
  }

  const client = createClient(config)
  client.interceptors.request.use((request) => rewrite(request, config?.directory))
  return new OpencodeClient({ client })
}
````

## File: packages/sdk/js/src/index.ts
````typescript
export * from "./client.js"
export * from "./server.js"

import { createOpencodeClient } from "./client.js"
import { createOpencodeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createOpencode(options?: ServerOptions) {
  const server = await createOpencodeServer({
    ...options,
  })

  const client = createOpencodeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
````

## File: packages/sdk/js/src/process.ts
````typescript
import { type ChildProcess, spawnSync } from "node:child_process"

// Duplicated from `packages/opencode/src/util/process.ts` because the SDK cannot
// import `opencode` without creating a cycle (`opencode` depends on `@opencode-ai/sdk`).
export function stop(proc: ChildProcess) {
  if (proc.exitCode !== null || proc.signalCode !== null) return
  if (process.platform === "win32" && proc.pid) {
    const out = spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { windowsHide: true })
    if (!out.error && out.status === 0) return
  }
  proc.kill()
}

export function bindAbort(proc: ChildProcess, signal?: AbortSignal, onAbort?: () => void) {
  if (!signal) return () => {}
  const abort = () => {
    clear()
    stop(proc)
    onAbort?.()
  }
  const clear = () => {
    signal.removeEventListener("abort", abort)
    proc.off("exit", clear)
    proc.off("error", clear)
  }
  signal.addEventListener("abort", abort, { once: true })
  proc.on("exit", clear)
  proc.on("error", clear)
  if (signal.aborted) abort()
  return clear
}
````

## File: packages/sdk/js/src/server.ts
````typescript
import launch from "cross-spawn"
import { type Config } from "./gen/types.gen.js"
import { stop, bindAbort } from "./process.js"

export type ServerOptions = {
  hostname?: string
  port?: number
  signal?: AbortSignal
  timeout?: number
  config?: Config
}

export type TuiOptions = {
  project?: string
  model?: string
  session?: string
  agent?: string
  signal?: AbortSignal
  config?: Config
}

export async function createOpencodeServer(options?: ServerOptions) {
  options = Object.assign(
    {
      hostname: "127.0.0.1",
      port: 4096,
      timeout: 5000,
    },
    options ?? {},
  )

  const args = [`serve`, `--hostname=${options.hostname}`, `--port=${options.port}`]
  if (options.config?.logLevel) args.push(`--log-level=${options.config.logLevel}`)

  const proc = launch(`opencode`, args, {
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options.config ?? {}),
    },
  })
  let clear = () => {}

  const url = await new Promise<string>((resolve, reject) => {
    const id = setTimeout(() => {
      clear()
      stop(proc)
      reject(new Error(`Timeout waiting for server to start after ${options.timeout}ms`))
    }, options.timeout)
    let output = ""
    let resolved = false
    proc.stdout?.on("data", (chunk) => {
      if (resolved) return
      output += chunk.toString()
      const lines = output.split("\n")
      for (const line of lines) {
        if (line.startsWith("opencode server listening")) {
          const match = line.match(/on\s+(https?:\/\/[^\s]+)/)
          if (!match) {
            clear()
            stop(proc)
            clearTimeout(id)
            reject(new Error(`Failed to parse server url from output: ${line}`))
            return
          }
          clearTimeout(id)
          resolved = true
          resolve(match[1]!)
          return
        }
      }
    })
    proc.stderr?.on("data", (chunk) => {
      output += chunk.toString()
    })
    proc.on("exit", (code) => {
      clearTimeout(id)
      let msg = `Server exited with code ${code}`
      if (output.trim()) {
        msg += `\nServer output: ${output}`
      }
      reject(new Error(msg))
    })
    proc.on("error", (error) => {
      clearTimeout(id)
      reject(error)
    })
    clear = bindAbort(proc, options.signal, () => {
      clearTimeout(id)
      reject(options.signal?.reason)
    })
  })

  return {
    url,
    close() {
      clear()
      stop(proc)
    },
  }
}

export function createOpencodeTui(options?: TuiOptions) {
  const args = []

  if (options?.project) {
    args.push(`--project=${options.project}`)
  }
  if (options?.model) {
    args.push(`--model=${options.model}`)
  }
  if (options?.session) {
    args.push(`--session=${options.session}`)
  }
  if (options?.agent) {
    args.push(`--agent=${options.agent}`)
  }

  const proc = launch(`opencode`, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      OPENCODE_CONFIG_CONTENT: JSON.stringify(options?.config ?? {}),
    },
  })

  const clear = bindAbort(proc, options?.signal)

  return {
    close() {
      clear()
      stop(proc)
    },
  }
}
````
