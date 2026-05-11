---
sessionID: ses_1ebc4ccf2ffeiMfXjMfXiO8mma
created: 2026-05-10T23:31:24.578Z
updated: 2026-05-10T23:31:24.578Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: tech
Today's date: 2026-05-11

Analyze this codebase for technology stack and external integrations.

Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

IMPORTANT: Use 2026-05-11 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo scan.

Explore thoroughly. Use Glob, Grep, Read tools to inspect package.json, tsconfig.json, source files, config files, etc. Write documents directly using the standard GSD codebase document templates. Include actual file paths formatted with backticks.

Return confirmation only with file paths and line counts of documents written.

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_sNGHI3TljPpKOFKZWnJN1712"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_bmvomIUwYpchuETNLmMQ7645"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tsconfig.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/vitest.config.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/opencode.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/mcp.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/CHANGELOG.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/bin"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_56qsi60VZVVNszZgDJei0935"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/plugin.ts</path>
<type>file</type>
<content>
1: /**
2:  * HiveMind V3 Harness Control Plane — composition root.
3:  *
4:  * This file is intentionally thin: it instantiates shared dependencies,
5:  * wires hook factories, and registers tools. All logic lives in the
6:  * individual hook factory modules and tool implementations.
7:  */
8: import type { Plugin } from "@opencode-ai/plugin"
9: 
10: import { createHarnessLifecycleManager } from "./task-management/lifecycle/index.js"
11: import { DelegationManager } from "./coordination/delegation/manager.js"
12: import { taskState } from "./shared/state.js"
13: import { createCoreHooks } from "./hooks/lifecycle/core-hooks.js"
14: import { createSessionHooks } from "./hooks/lifecycle/session-hooks.js"
15: import { createToolGuardHooks } from "./hooks/guards/tool-guard-hooks.js"
16: import { createDelegationEventObserver, createSessionEntryEventObserver, createSessionJourneyEventObserver } from "./hooks/observers/event-observers.js"
17: import { createToolExecuteAfterHook } from "./hooks/transforms/tool-after-composer.js"
18: import { summarizePluginToolOutput } from "./shared/plugin-tool-output-summary.js"
19: import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
20: import { createPromptSkimTool } from "./tools/prompt/prompt-skim/index.js"
21: import { createPromptAnalyzeTool } from "./tools/prompt/prompt-analyze/index.js"
22: import { createSessionPatchTool } from "./tools/session/session-patch/index.js"
23: import { createExecuteSlashCommandTool } from "./tools/session/execute-slash-command.js"
24: import { createDelegateTaskTool } from "./tools/delegation/delegate-task.js"
25: import { createDelegationStatusTool } from "./tools/delegation/delegation-status.js"
26: import { createRunBackgroundCommandTool } from "./tools/hivemind/run-background-command.js"
27: import { createConfigurePrimitiveTool } from "./tools/config/configure-primitive.js"
28: import { createValidateRestartTool } from "./tools/config/validate-restart.js"
29: import { createBootstrapInitTool } from "./tools/config/bootstrap-init.js"
30: import { createBootstrapRecoverTool } from "./tools/config/bootstrap-recover.js"
31: import { createSessionJournalExportTool } from "./tools/session/session-journal-export.js"
32: import { createHivemindDocTool } from "./tools/hivemind/hivemind-doc.js"
33: import { createHivemindTrajectoryTool } from "./tools/hivemind/hivemind-trajectory.js"
34: import { createHivemindPressureTool } from "./tools/hivemind/hivemind-pressure.js"
35: import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind/hivemind-agent-work.js"
36: import { createHivemindSdkSupervisorTool } from "./tools/hivemind/hivemind-sdk-supervisor.js"
37: import { createHivemindCommandEngineTool } from "./tools/hivemind/hivemind-command-engine.js"
38: import { createSessionTrackerTool } from "./tools/hivemind/session-tracker.js"
39: import { loadRuntimePolicy } from "./shared/runtime-policy.js"
40: import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
41: import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
42: import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
43: // Legacy event-tracker code preserved at src/task-management/journal/event-tracker/ (REQ-ST-13).
44: // Deprecated: event-tracker wiring is kept for backward compatibility with existing tests.
45: // New capture goes through SessionTracker → .hivemind/session-tracker/.
46: import {
47:   createEventTrackerArtifactsFromHook,
48:   shouldTrackEventTrackerEvent,
49: } from "./task-management/journal/event-tracker/index.js"
50: import { SessionTracker } from "./features/session-tracker/index.js"
51: 
52: import { getConfig } from "./config/subscriber.js"
53: import { resolveBehavioralProfile } from "./routing/behavioral-profile/resolve-behavioral-profile.js"
54: import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"
55: 
56: const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min
57: 
58: export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
59:   const projectDirectory = directory ?? process.cwd()
60:   // Load workspace-level runtime policy once at startup.
61:   const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
62:   // Load Hivemind configs — lazy-cached for downstream consumers.
63:   // Failure gracefully falls back to defaults (never crashes plugin init).
64:   const hivemindConfig: HivemindConfigs = getConfig(projectDirectory)
65:   const ptyManager = await createPtyManagerIfSupported()
66: 
67:   const delegationManager = new DelegationManager(client, { ptyManager, runtimePolicy })
68:   // Recovery runs asynchronously — must not block plugin init.
69:   // If a second OpenCode instance starts, recoverPending() would await SDK calls
70:   // for sessions that belong to the first instance, causing a hang.
71:   void delegationManager.recoverPending()
72: 
73:   // Session tracker: typed owning module for session knowledge capture.
74:   // Wired via deps injection (D-01) — matches DelegationManager instantiation pattern.
75:   const sessionTracker = new SessionTracker({ client, projectRoot: projectDirectory })
76: 
77:   const lifecycleManager = createHarnessLifecycleManager({
78:     client,
79:     pollTimeoutMs: WATCH_TIMEOUT_MS,
80:     runtimePolicy,
81:     delegationManager,
82:   })
83:   lifecycleManager.hydrateFromContinuity()
84: 
85:   // Phase 36.1 R-COMPLETION-DETECTOR-05: complete the dual-signal completion
86:   // wiring. The lifecycle manager *owns* the CompletionDetector (it receives
87:   // session.idle/error/deleted events from handleEvent), and the SDK
88:   // delegation polling loop *consumes* cached terminal signals + feeds
89:   // message counts back in. This setter call closes the dependency loop
90:   // without forcing the constructor order to change (DelegationManager must
91:   // exist before the lifecycle manager because the latter takes the former
92:   // as an arg).
93:   delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())
94: 
95:   // Initialize session tracker (reads project-continuity.json, creates writers).
96:   // Fire-and-forget: must not block plugin init.
97:   void sessionTracker.initialize()
98: 
99:   const sessionEntryObserverFactory = createSessionEntryEventObserver()
100: 
101:   const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: sessionEntryObserverFactory.getIntake, hivemindConfig, getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory) }
102:   const sessionHooks = createSessionHooks(deps)
103:   const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks
104:   const delegationEventObserver = createDelegationEventObserver()
105:   const sessionJourneyEventObserver = createSessionJourneyEventObserver(shouldTrackEventTrackerEvent)
106:   const consumeSessionEntryFact = async ({ event }: { event?: unknown }) => {
107:     try {
108:       await sessionEntryObserverFactory.observer({ event })
109:     } catch {
110:       // Best-effort intake classification: never block canonical event handling.
111:     }
112:   }
113:   const consumeDelegationFact = async ({ event }: { event?: unknown }) => {
114:     const fact = await delegationEventObserver({ event })
115:     if (fact.kind === "delegation-session-idle") {
116:       delegationManager.handleSessionIdle(fact.sessionId)
117:     }
118:     if (fact.kind === "delegation-session-deleted") {
119:       delegationManager.handleSessionDeleted(fact.sessionId)
120:     }
121:   }
122:   // Replaced: session tracker now handles capture via SessionTracker module.
123:   // Old event-tracker wiring kept for backward compatibility (REQ-ST-13).
124:   // Deprecated — will be removed after session-tracker integration tests are updated.
125:   const consumeJourneyFact = async ({ event }: { event?: unknown }) => {
126:     try {
127:       const fact = await sessionJourneyEventObserver({ event })
128:       if (fact.kind === "session-journey-event") {
129:         createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event: fact.event, source: fact.source } })
130:       }
131:     } catch {
132:       // Best-effort audit projection: never block canonical OpenCode event handling.
133:     }
134:   }
135:   const consumeSessionTrackerFact = async ({ event }: { event?: unknown }) => {
136:     try {
137:       const ev = event as Record<string, unknown> | undefined
138:       const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
139:       const sessionID = (ev?.sessionID as string) || ""
140:       if (sessionID) {
141:         await sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
142:       }
143:     } catch (err) {
144:       console.warn("[Harness] Session tracker event observer failed:", err)
145:     }
146:   }
147: 
148:   const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })
149: 
150:   return {
151:     ...createCoreHooks({
152:       ...deps,
153:       eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, consumeSessionTrackerFact, consumeSessionEntryFact],
154:     }),
155:     ...sessionReadHooks,
156:     ...toolGuardHooks,
157:     // chat.message: session tracker captures user/assistant messages.
158:     // Best-effort — never blocks the OpenCode runtime.
159:     "chat.message": async (input, output) => {
160:       try {
161:         await sessionTracker.handleChatMessage(
162:           input as Parameters<typeof sessionTracker.handleChatMessage>[0],
163:           output as Parameters<typeof sessionTracker.handleChatMessage>[1],
164:         )
165:       } catch (err) {
166:         console.warn("[Harness] Session tracker chat.message failed:", err)
167:       }
168:     },
169:     tool: {
170:       "delegate-task": createDelegateTaskTool(delegationManager),
171:       "delegation-status": createDelegationStatusTool(delegationManager),
172:       "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
173:       "prompt-skim": createPromptSkimTool(projectDirectory),
174:       "prompt-analyze": createPromptAnalyzeTool(projectDirectory),
175:       "session-patch": createSessionPatchTool(projectDirectory),
176:       "execute-slash-command": createExecuteSlashCommandTool(client),
177:       "session-journal-export": createSessionJournalExportTool(),
178:       "hivemind-doc": createHivemindDocTool(projectDirectory),
179:       "hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),
180:       "hivemind-pressure": createHivemindPressureTool(projectDirectory),
181:       "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
182:       "hivemind-command-engine": createHivemindCommandEngineTool(projectDirectory),
183:       "session-tracker": createSessionTrackerTool(projectDirectory),
184:       "hivemind-agent-work-create": createHivemindAgentWorkCreateTool(projectDirectory),
185:       "hivemind-agent-work-export": createHivemindAgentWorkExportTool(projectDirectory),
186:       "configure-primitive": createConfigurePrimitiveTool(),
187:       "validate-restart": createValidateRestartTool(),
188:       "bootstrap-init": createBootstrapInitTool(),
189:       "bootstrap-recover": createBootstrapRecoverTool(),
190:     },
191:     // Auto-persist workflow state after configure-primitive calls with workflow params.
192:     // Best-effort: failures are silently ignored — does not affect the tool call result.
193:     "tool.execute.after": async (
194:       input: { tool: string; args?: Record<string, unknown> },
195:       _output?: { metadata?: unknown; [key: string]: unknown } | string,
196:     ): Promise<void> => {
197:       const fact = await createToolExecuteAfterHook({
198:         toolGuardAfterHook: toolGuardHooks["tool.execute.after"],
199:         summarizeOutput: summarizePluginToolOutput,
200:       })(input, _output)
201:       void fact // consumed by guard hooks above; session tracker uses raw input
202:       // Deprecated: old event-tracker wiring kept for backward compatibility.
203:       try {
204:         if (fact.kind === "tool-execute-after" && shouldTrackEventTrackerEvent(fact.event)) {
205:           createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event: fact.event, source: fact.source } })
206:         }
207:       } catch {
208:         // Best-effort audit projection: never fail the tool call result.
209:       }
210:       try {
211:         // Session tracker: capture tool metadata (skill, read, task, etc.)
212:         // Uses raw hook input/output for accurate metadata, not the projected fact.
213:         await sessionTracker.handleToolExecuteAfter(
214:           input as Parameters<typeof sessionTracker.handleToolExecuteAfter>[0],
215:           (_output ?? {}) as Parameters<typeof sessionTracker.handleToolExecuteAfter>[1],
216:         )
217:       } catch {
218:         // Best-effort: never fail the tool call.
219:       }
220: 
221:       if (input.tool !== "configure-primitive") return
222:       const args = input.args
223:       if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return
224: 
225:       try {
226:         const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
227:           await import("./config/workflow/index.js")
228:         const workflow = readWorkflow(args.workflowId)
229:         if (!workflow) return
230: 
231:         const advanced = advanceTurn(workflow, args.workflowTurn as number)
232:         const output = typeof _output === "string" ? _output.substring(0, 500) : "completed"
233:         const completed = completeCurrentTurn(advanced, { toolOutput: output })
234:         persistWorkflow(completed)
235:       } catch {
236:         // Best-effort persistence — never fail the tool call
237:       }
238:     },
239:   }
240: }
241: 
242: export default HarnessControlPlane

(End of file - total 242 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/index.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/session-api.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/session-api.ts</path>
<type>file</type>
<content>
1: import type { createOpencodeClient } from "@opencode-ai/sdk"
2: 
3: import { asString, getNestedValue, unwrapData } from "./helpers.js"
4: import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
5: import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"
6: 
7: export type OpenCodeClient = ReturnType<typeof createOpencodeClient>
8: 
9: type SessionRecord = Record<string, unknown>
10: type SessionCreateRequest = Parameters<OpenCodeClient["session"]["create"]>[0]
11: type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]
12: type SessionMessagesRequest = Parameters<OpenCodeClient["session"]["messages"]>[0]
13: 
14: type CreateSessionOptions = {
15:   parentID?: string
16:   title: string
17:   directory?: string
18: }
19: 
20: type GetSessionMessagesOptions = {
21:   limit?: number
22: }
23: 
24: const SYNC_PROMPT_FALLBACK_TIMEOUT_MS = 30_000
25: const SYNC_PROMPT_FALLBACK_POLL_MS = 1_000
26: 
27: function assertValidSessionID(sessionID: string, label = "session ID"): string {
28:   const trimmed = sessionID.trim()
29:   if (process.env.NODE_ENV === "test" && /^(child|parent)-/.test(trimmed)) {
30:     return trimmed
31:   }
32:   if (!trimmed.startsWith("ses")) {
33:     throw new Error(
34:       `[Harness] Invalid ${label} '${sessionID}'. Expected an OpenCode session ID starting with 'ses'.`,
35:     )
36:   }
37: 
38:   return trimmed
39: }
40: 
41: export async function createSession(client: OpenCodeClient, opts: CreateSessionOptions): Promise<SessionRecord> {
42:   const { directory, ...body } = opts
43:   const request: SessionCreateRequest = {
44:     body: {
45:       ...body,
46:       ...(body.parentID ? { parentID: assertValidSessionID(body.parentID, "parent session ID") } : {}),
47:     },
48:     ...(directory ? { query: { directory } } : {}),
49:   }
50: 
51:   return unwrapData(await client.session.create(request))
52: }
53: 
54: export async function getSession(client: OpenCodeClient, sessionID: string): Promise<SessionRecord> {
55:   const validSessionID = assertValidSessionID(sessionID)
56:   return unwrapData(await client.session.get({ path: { id: validSessionID } }))
57: }
58: 
59: /**
60:  * Get the status map for all sessions.
61:  * Returns a map of sessionID -> { type: "idle" | "busy" | "retry" }
62:  */
63: export async function getSessionStatusMap(client: OpenCodeClient): Promise<Record<string, { type: string }>> {
64:   const response = await client.session.status()
65:   const data = unwrapData(response)
66:   // The response is { data: { [sessionID: string]: SessionStatus } }
67:   // SessionStatus has shape { type: "idle" | "busy" | "retry" }
68:   return (data as Record<string, unknown>) as Record<string, { type: string }>
69: }
70: 
71: export async function abortSession(client: OpenCodeClient, sessionID: string): Promise<unknown> {
72:   const validSessionID = assertValidSessionID(sessionID)
73:   return unwrapData(await client.session.abort({ path: { id: validSessionID } }))
74: }
75: 
76: export async function getSessionMessages(
77:   client: OpenCodeClient,
78:   sessionID: string,
79:   opts?: GetSessionMessagesOptions
80: ): Promise<unknown[]> {
81:   const validSessionID = assertValidSessionID(sessionID)
82:   const request: SessionMessagesRequest = {
83:     path: { id: validSessionID },
84:     ...(opts?.limit !== undefined ? { query: { limit: opts.limit } } : {}),
85:   }
86: 
87:   const response = unwrapData(await client.session.messages(request))
88: 
89:   return Array.isArray(response) ? response : []
90: }
91: 
92: export async function getSessionMessageCount(
93:   client: OpenCodeClient,
94:   sessionID: string,
95: ): Promise<number | null> {
96:   try {
97:     const messages = await getSessionMessages(client, sessionID)
98:     return messages.length
99:   } catch {
100:     return null
101:   }
102: }
103: 
104: function getMessageRole(message: unknown): string | undefined {
105:   return (
106:     asString(getNestedValue(message, ["info", "role"])) ??
107:     asString(getNestedValue(message, ["role"]))
108:   )
109: }
110: 
111: function hasUsableAssistantParts(message: unknown): boolean {
112:   const parts = getNestedValue(message, ["parts"])
113:   return Array.isArray(parts) && parts.length > 0
114: }
115: 
116: async function waitForAssistantResponse(
117:   client: OpenCodeClient,
118:   sessionID: string,
119:   baselineMessageCount: number,
120: ): Promise<unknown> {
121:   const deadline = Date.now() + SYNC_PROMPT_FALLBACK_TIMEOUT_MS
122: 
123:   while (Date.now() < deadline) {
124:     const messages = await getSessionMessages(client, sessionID)
125:     const newMessages = messages.slice(baselineMessageCount)
126:     const assistantMessage = newMessages.find(
127:       (message) => getMessageRole(message) === "assistant" && hasUsableAssistantParts(message),
128:     )
129:     if (assistantMessage) {
130:       return assistantMessage
131:     }
132: 
133:     await new Promise((resolve) => setTimeout(resolve, SYNC_PROMPT_FALLBACK_POLL_MS))
134:   }
135: 
136:   throw new Error(
137:     `[Harness] session.prompt returned an empty response and no assistant output was captured within ${SYNC_PROMPT_FALLBACK_TIMEOUT_MS}ms.`,
138:   )
139: }
140: 
141: type SessionPromptAsyncRequest = Parameters<OpenCodeClient["session"]["promptAsync"]>[0]
142: 
143: export async function sendPrompt(
144:   client: OpenCodeClient,
145:   sessionID: string,
146:   body: unknown
147: ): Promise<unknown> {
148:   const validSessionID = assertValidSessionID(sessionID)
149:   const baselineMessageCount = (await getSessionMessages(client, validSessionID).catch(() => [] as unknown[])).length
150:   const request: SessionPromptRequest = {
151:     path: { id: validSessionID },
152:     body: body as SessionPromptRequest["body"],
153:   }
154: 
155:   const response = unwrapData(await client.session.prompt(request))
156:   if (typeof response !== "string") {
157:     return response
158:   }
159: 
160:   const trimmed = response.trim()
161:   if (!trimmed) {
162:     return waitForAssistantResponse(client, validSessionID, baselineMessageCount)
163:   }
164: 
165:   try {
166:     return JSON.parse(trimmed) as unknown
167:   } catch {
168:     return {
169:       parts: [{ type: "text", text: trimmed }],
170:     }
171:   }
172: }
173: 
174: /**
175:  * Prompt a session asynchronously — returns 204 immediately.
176:  *
177:  * Use this for background/background delegation tasks where the caller
178:  * should not wait for the assistant's response. Harness must only use this
179:  * path when a trusted runtime policy explicitly says the host is durable.
180:  */
181: export async function sendPromptAsync(
182:   client: OpenCodeClient,
183:   sessionID: string,
184:   body: unknown
185: ): Promise<void> {
186:   const validSessionID = assertValidSessionID(sessionID)
187:   const request: SessionPromptAsyncRequest = {
188:     path: { id: validSessionID },
189:     body: body as SessionPromptAsyncRequest["body"],
190:   }
191: 
192:   await client.session.promptAsync(request)
193: }
194: 
195: export function getSessionID(session: unknown): string | undefined {
196:   return (
197:     asString(getNestedValue(session, ["id"])) ??
198:     asString(getNestedValue(session, ["sessionID"])) ??
199:     asString(getNestedValue(session, ["info", "id"])) ??
200:     asString(getNestedValue(session, ["info", "sessionID"]))
201:   )
202: }
203: 
204: export function getParentID(session: unknown): string | undefined {
205:   return (
206:     asString(getNestedValue(session, ["parentID"])) ??
207:     asString(getNestedValue(session, ["parentId"])) ??
208:     asString(getNestedValue(session, ["info", "parentID"])) ??
209:     asString(getNestedValue(session, ["info", "parentId"]))
210:   )
211: }
212: 
213: function getEventSessionInfo(event: unknown): unknown {
214:   return getNestedValue(event, ["properties", "info"])
215: }
216: 
217: function getEventType(event: unknown): string | undefined {
218:   return asString(getNestedValue(event, ["type"]))
219: }
220: 
221: function isMessageScopedEvent(event: unknown): boolean {
222:   return getEventType(event)?.startsWith("message.") ?? false
223: }
224: 
225: function getExplicitEventSessionID(event: unknown): string | undefined {
226:   return (
227:     asString(getNestedValue(event, ["properties", "sessionID"])) ??
228:     asString(getNestedValue(event, ["properties", "sessionId"])) ??
229:     asString(getNestedValue(event, ["sessionID"])) ??
230:     asString(getNestedValue(event, ["sessionId"]))
231:   )
232: }
233: 
234: export function getEventSessionID(event: unknown): string | undefined {
235:   const explicitSessionID = getExplicitEventSessionID(event)
236:   if (isMessageScopedEvent(event)) {
237:     return explicitSessionID
238:   }
239: 
240:   return (
241:     getSessionID(getEventSessionInfo(event)) ??
242:     explicitSessionID
243:   )
244: }
245: 
246: export function getEventParentID(event: unknown): string | undefined {
247:   return getParentID(getEventSessionInfo(event))
248: }
249: 
250: export async function walkParentChain(client: OpenCodeClient, sessionID: string): Promise<SessionRecord[]> {
251:   const chain: SessionRecord[] = []
252:   const visited = new Set<string>()
253: 
254:   let currentID: string | undefined = assertValidSessionID(sessionID)
255:   while (currentID) {
256:     if (visited.has(currentID)) {
257:       throw new Error(`[Harness] Detected cyclic session parent chain at ${currentID}`)
258:     }
259: 
260:     visited.add(currentID)
261:     const session = await getSession(client, currentID)
262:     chain.push(session)
263:     currentID = getParentID(session)
264:   }
265: 
266:   return chain
267: }
268: 
269: /**
270:  * Retrieves the resolved behavioral profile for a session.
271:  * Delegates to resolveBehavioralProfile with lazy caching.
272:  *
273:  * @param sessionId - The session ID to resolve profile for
274:  * @param projectRoot - Absolute path to project root
275:  * @param sessionContext - Optional session context for runtime profile detection
276:  * @returns The resolved behavioral profile
277:  * @see D-10 in CA-02-CONTEXT.md
278:  */
279: export function getSessionBehavioralProfile(
280:   sessionId: string,
281:   projectRoot: string,
282:   sessionContext?: Record<string, unknown>,
283: ): ResolvedBehavioralProfile {
284:   return resolveBehavioralProfile(sessionId, projectRoot, sessionContext)
285: }

(End of file - total 285 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/shared/AGENTS.md
# Shared Utilities Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/shared/` is the Hard Harness leaf utility sector for cross-cutting tool response helpers. It provides the standardized tool response envelope and rendering utilities consumed by tool implementations. Source evidence: `.planning/codebase/ARCHITECTURE.md:188-193`, `.planning/codebase/STRUCTURE.md:109-113`.

**Leaf-like constraint:** `src/shared/` MUST remain a leaf dependency — it never imports from `src/tools/`, `src/hooks/`, `src/features/`, `src/config/`, `src/routing/`, `src/task-management/`, or `src/coordination/`. This sector is consumed by all others but consumes none. Soft Meta-Concepts (`.opencode/`) never depend on shared; shared is a Hard Harness internal leaf.

## 2. Allowed mutation authority

- Shared utilities may define pure response envelope types, constructors, type guards, and rendering helpers.
- Shared utilities may be consumed by any tool that needs consistent `success`, `error`, or `pending` output. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.
- Shared changes may adjust response contracts only with corresponding tool/test updates.

## 3. Forbidden mutations / explicit no-go boundaries

- Shared utilities SHALL NOT import from tools, hooks, plugin, or deep state owners; this sector must remain leaf-like.
- Shared utilities SHALL NOT perform durable writes, SDK calls, event handling, command execution, or runtime policy loading.
- Shared utilities SHALL NOT become a dumping ground for feature logic; put business logic in `src/task-management/`, `src/coordination/`, `src/features/`, or the owning tool.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Standardized result rendering | Tools own behavior and side effects |
| Tests | Validate envelope behavior through direct or tool-level tests | Shared tests do not prove tool integration alone |
| OpenCode runtime | Receives rendered tool output indirectly | Runtime behavior still requires tool/plugin evidence |

## 5. Naming and placement conventions

- Keep files small and focused; current files are `tool-response.ts` and `tool-helpers.ts`. Evidence: `.planning/codebase/STRUCTURE.md:109-113`.
- Use named exports, strict TypeScript, and relative ESM imports with `.js` extensions when needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.
- Tests should live under `tests/` in the closest matching contract area; shared behavior may be covered directly or through tool tests.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and tests for every affected tool response behavior.
- Because this sector is cross-cutting, response-shape changes require broader tool regression evidence, not just one consumer.
- Docs-only edits remain L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.gitignore"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/bin/hivemind.cjs"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/bin/hivemind.cjs</path>
<type>file</type>
<content>
1: #!/usr/bin/env node
2: /**
3:  * `hivemind-tools` CLI entrypoint (Phase 40 / PH40-01).
4:  *
5:  * This shim is intentionally CommonJS so that npm's `bin` resolution
6:  * works on every supported Node major without depending on
7:  * `package.json` `type: module` semantics. All real logic lives in the
8:  * compiled ESM module at `dist/cli/index.js`; this file only exists to
9:  * forward argv into `runCli()` and propagate its exit code.
10:  *
11:  * Failure modes:
12:  *   - `dist/cli/index.js` missing  → exit 70 (`EX_SOFTWARE`) with a
13:  *     `[Harness]` message instructing the caller to run `npm run build`.
14:  *   - Uncaught error inside `runCli`  → exit 70 with the `[Harness]`-
15:  *     prefixed message.
16:  */
17: 
18: "use strict"
19: 
20: const path = require("node:path")
21: const { pathToFileURL } = require("node:url")
22: 
23: const compiledEntry = path.join(__dirname, "..", "dist", "cli", "index.js")
24: 
25: import(pathToFileURL(compiledEntry).href)
26:   .then(async (mod) => {
27:     if (typeof mod.runCli !== "function") {
28:       process.stderr.write(
29:         "[Harness] CLI entry dist/cli/index.js does not export runCli — run `npm run build`.\n",
30:       )
31:       process.exit(70)
32:     }
33:     const argv = process.argv.slice(2)
34:     const exitCode = await mod.runCli(argv)
35:     process.exit(typeof exitCode === "number" ? exitCode : 0)
36:   })
37:   .catch((error) => {
38:     const message = error instanceof Error ? error.message : String(error)
39:     process.stderr.write(`[Harness] CLI startup failed: ${message}\n`)
40:     process.exit(70)
41:   })

(End of file - total 41 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts</path>
<type>file</type>
<content>
1: import { CommandDelegationHandler } from "../command-delegation/handler.js"
2: import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "../concurrency/queue.js"
3: import type { CompletionDetector } from "../completion/detector.js"
4: import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
5: import {
6:   buildDelegationResult,
7:   DelegationStateMachine,
8: } from "./state-machine.js"
9: import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
10: import { SdkDelegationHandler } from "../sdk-delegation/handler.js"
11: import { resolveCategoryGateDecision } from "./category-gates.js"
12: import { recordCategoryGateask } from "./category-gate-audit.js"
13: import { getAppAgents } from "../../shared/app-api.js"
14: import { sendPromptAsync, type OpenCodeClient } from "../../shared/session-api.js"
15: import { DEFAULT_RUNTIME_POLICY, resolveConcurrencyForKey } from "../../shared/runtime-policy.js"
16: import { getCachedConfig } from "../../config/subscriber.js"
17: import { enrichAgentFromPrimitives, parsePermissionRecord, parseToolBooleans } from "../spawner/agent-primitive-policy.js"
18: import { resolveDelegationConcurrencyKey } from "../spawner/concurrency-key.js"
19: import { resolveParentWorkingDirectory } from "../spawner/parent-directory.js"
20: import { spawnDelegatedSession } from "../spawner/session-creator.js"
21: import { buildSdkSpawnRequest, resolveDelegationPermissionProfile, type DelegateParams, type ValidatedAgent } from "../spawner/spawn-request-builder.js"
22: import {
23:   DEFAULT_SAFETY_CEILING_MS,
24:   type CommandDelegationParams,
25:   type Delegation,
26:   type DelegationResult,
27:   type RuntimePolicy,
28:   MAX_DELEGATION_DEPTH,
29: } from "../../shared/types.js"
30: import type { BehavioralOverrides } from "../../routing/behavioral-profile/types.js"
31: 
32: type QueueContext = { provider?: string; model?: string; agent?: string; category?: string }
33: 
34: const DEFAULT_MANAGER_RUNTIME_POLICY: RuntimePolicy = {
35:   ...DEFAULT_RUNTIME_POLICY,
36:   trustedRuntime: {
37:     ...DEFAULT_RUNTIME_POLICY.trustedRuntime,
38:     builtinAsyncBackgroundChildSessions: true,
39:   },
40: }
41: 
42: function resolveAcquireArgs(policy: RuntimePolicy, queueKey: string): { limit?: number; acquireTimeoutMs?: number } {
43:   const concurrency = resolveConcurrencyForKey(policy, queueKey)
44:   return {
45:     limit: concurrency.limit === DEFAULT_RUNTIME_POLICY.concurrency.globalLimit ? undefined : concurrency.limit,
46:     acquireTimeoutMs: concurrency.acquireTimeoutMs,
47:   }
48: }
49: 
50: /**

(Showing lines 1-50 of 500. Use offset=51 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/coordination/delegation/AGENTS.md
# Delegation Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/delegation/` owns the DelegationManager — the WaiterModel dispatch orchestrator for delegated child sessions. It evaluates category gates, acquires per-key concurrency slots, dispatches via SDK or command execution mode, and recovers pending delegations at harness startup. Contains: `manager.ts` (DelegationManager, ~500 LOC), `types.ts` (delegation contracts), `state-machine.ts` (transition logic), `category-gates.ts` (category evaluation), `category-gate-audit.ts` (ask audit). Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:153-158`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- DelegationManager may dispatch child sessions via `SdkDelegationHandler` or `CommandDelegationHandler`, acquire concurrency slots through `DelegationConcurrencyQueue`, and evaluate category gates. Evidence: `.planning/codebase/ARCHITECTURE.md:187-190`.
- DelegationStateMachine may validate and enforce delegation status transitions (dispatched→running→completed/error/timeout). Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Category gates may resolve allow/ask decisions for agent-category dispatch pairings.

## 3. Forbidden mutations / explicit no-go boundaries

- Delegation SHALL NOT perform durable state writes directly; delegation record persistence belongs to `src/task-management/continuity/delegation-persistence.ts`. Evidence: `.planning/codebase/ARCHITECTURE.md:159`.
- Delegation SHALL NOT register tools or hooks; `src/plugin.ts` owns tool registration and hook composition.
- Delegation SHALL NOT observe OpenCode lifecycle events directly; hooks route events through the lifecycle manager injected as dependency.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/delegation/` | Dispatches delegations via DelegationManager | Tools own input validation and response shaping |
| `src/coordination/completion/` | Receives completion signals for dispatched sessions | CompletionDetector owns signal detection |
| `src/coordination/concurrency/` | Provides per-key concurrency gating | Owns queue; delegation acquires slots |
| `src/task-management/continuity/` | Persists delegation records | Owns durable state; delegation dispatches |
| `src/plugin.ts` | Wires DelegationManager at composition time | Composition root only, no business logic |

## 5. Naming and placement conventions

- `manager.ts` — DelegationManager class (~500 LOC, reference module). Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- `types.ts` — shared delegation contracts. `state-machine.ts` — DelegationStateMachine. `category-gates.ts` — gate evaluation. `category-gate-audit.ts` — ask audit trail.
- Tests mirror under `tests/lib/coordination/delegation/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/delegation/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Dispatch changes require regression evidence across completion detection and concurrency gating.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/coordination/AGENTS.md
# Coordination Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/` is the Hard Harness orchestration sector. It owns delegation dispatch (WaiterModel pattern), completion detection (dual-signal idle + message threshold), per-key concurrency gating, SDK/command delegation, and session spawning. This sector coordinates child session lifecycles without owning durable persistence. Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:105-109`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- DelegationManager may dispatch child sessions, acquire concurrency slots, evaluate category gates, and recover pending delegations at startup. Evidence: `.planning/codebase/ARCHITECTURE.md:187-190`, `.planning/codebase/ARCHITECTURE.md:153-158`.
- CompletionDetector may detect delegated session lifecycle transitions (idle, error, deleted events) and signal dual-signal completion. Evidence: `.planning/codebase/ARCHITECTURE.md:198`, `.planning/codebase/ARCHITECTURE.md:164-168`.
- DelegationConcurrencyQueue may acquire and release per-key concurrency gates. Evidence: `.planning/codebase/ARCHITECTURE.md:57`.
- Spawner may build spawn requests and create child sessions via `spawnDelegatedSession()`. Evidence: `.planning/codebase/ARCHITECTURE.md:157-158`.

## 3. Forbidden mutations / explicit no-go boundaries

- Coordination SHALL NOT perform durable state writes directly; delegation record persistence belongs to `src/task-management/continuity/delegation-persistence.ts`. Evidence: `.planning/codebase/ARCHITECTURE.md:159`.
- Coordination SHALL NOT register tools or hooks; `src/plugin.ts` owns tool registration and hook composition. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Coordination SHALL NOT observe OpenCode lifecycle events directly; that is the hooks sector's role. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`.
- Coordination SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/delegation/` | Dispatches delegations via DelegationManager | Tools own input validation and response shaping |
| `src/task-management/` | Receives delegation records for persistence | Owns durable state, not dispatch logic |
| `src/hooks/` | Routes session events to CompletionDetector | Hooks observe; coordination acts |
| `src/plugin.ts` | Wires DelegationManager, CompletionDetector, ConcurrencyQueue | Composition root only, no business logic |
| Tests | Validate dispatch, completion, concurrency behavior | Must not treat unit mocks as integration proof |

## 5. Naming and placement conventions

- Manager classes use `PascalCase` in `src/coordination/{domain}/manager.ts` or `detector.ts`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Subdirectories: `delegation/`, `completion/`, `concurrency/`, `sdk-delegation/`, `command-delegation/`, `spawner/`. Evidence: `.planning/codebase/STRUCTURE.md:95-97`.
- Tests mirror this sector under `tests/lib/` matching source module paths. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Keep files below the 500 LOC cap; DelegationManager is the reference at ~500 lines. Evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/...` for affected coordination modules. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Delegation dispatch changes require regression evidence across completion detection and concurrency gating.
- Runtime readiness cannot be claimed from unit tests alone; integration evidence requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/app-api.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/background-command/pty"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_VDSvLwOOenf2G8SBreFe3107"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_hu0pAal8616dx8PNslf71910"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_ipjCP7FOHVAdJOqEJt0n2514"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/background-command/pty/pty-runtime.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/steering-engine"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/cli/commands"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/config"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/harness"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/sidecar"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/sidecar/package.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/codebase"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/security"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/doc-intelligence"
}
```

