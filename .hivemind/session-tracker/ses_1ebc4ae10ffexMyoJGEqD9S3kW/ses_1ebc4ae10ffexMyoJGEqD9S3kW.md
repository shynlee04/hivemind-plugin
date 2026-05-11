---
sessionID: ses_1ebc4ae10ffexMyoJGEqD9S3kW
created: 2026-05-10T23:31:32.482Z
updated: 2026-05-10T23:31:32.482Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: arch
Today's date: 2026-05-11

Analyze this codebase architecture and directory structure.

Write these documents to .planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions

IMPORTANT: Use 2026-05-11 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo scan.

Explore thoroughly. Use Glob, Grep, Read tools to inspect directory structure, entry points, module boundaries, source files. Write documents directly using the standard GSD codebase document templates. Include actual file paths formatted with backticks.

Return confirmation only with file paths and line counts of documents written.

### Tool: skill

**Input:**
```json
{
  "name": "gsd-map-codebase"
}
```

**Output:** (pruned)
```
# Skill: gsd-map-codebase
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_yC5vQeLlH7psTCQcky073809"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_4MphhScbC1ikePQB1J2A5009"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/index.ts"
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
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_hxTTVxooMHtsVvF9JO0J2098"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/types.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/types.ts</path>
<type>file</type>
<content>
1: import type { DelegationRecoveryGuarantee, DelegationStatus } from "../coordination/delegation/types.js"
2: 
3: export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"
4: 
5: export type TaskNotification = {
6:   sessionID: string
7:   description: string
8:   agent: string
9:   status: "started" | "completed" | "failed" | "cancelled"
10:   error?: string
11:   resultPreview?: string
12:   briefSummary?: string
13:   outputLink?: string
14:   duration?: number
15:   artifacts?: string[]
16:   commits?: string[]
17:   metadata?: {
18:     delegationId: string
19:     terminalState: DelegationStatus
20:     recoveryGuarantee?: DelegationRecoveryGuarantee
21:     summaryPreview?: string
22:   }
23: }
24: 
25: export type PendingNotification = TaskNotification & {
26:   createdAt: number
27:   delivered: boolean
28: }
29: 
30: export const MAX_DESCENDANTS_PER_ROOT = 10
31: export const VALID_DELEGATION_CATEGORIES = [
32:   "research",
33:   "implementation",
34:   "review",
35:   "visual-engineering",
36:   "deep",
37:   "quick",
38: ] as const
39: 
40: export type SpecialistAgent = string
41: export type DelegationCategory = (typeof VALID_DELEGATION_CATEGORIES)[number]
42: export type PermissionAction = "allow" | "ask" | "ask"
43: 
44: export type PermissionRule = {
45:   permission: string
46:   pattern: string
47:   action: PermissionAction
48: }
49: 
50: export type SessionStatusType = "idle" | "busy" | "retry" | string
51: 
52: export type SessionStatus = {
53:   type: SessionStatusType
54:   [key: string]: unknown
55: }
56: 
57: export type RootBudget = {
58:   descendants: Set<string>
59:   reserved: number
60: }
61: 
62: export type LoopWindow = {
63:   signature: string
64:   count: number
65: }
66: 
67: export type ToolCallSummary = {
68:   tool: string
69:   args?: string
70:   output?: string
71:   status?: string
72: }
73: 
74: export type CapturedResult = {
75:   resultText: string
76:   artifactPaths: string[]
77:   gitCommits: string[]
78:   toolCallSummary: ToolCallSummary[]
79:   messageCount: number
80:   capturedAt: number
81:   partial?: boolean
82: }
83: 
84: export type SessionStats = {
85:   total: number
86:   byTool: Record<string, number>
87:   loop: LoopWindow
88:   warnings: string[]
89: }
90: 
91: export type DelegationMeta = {
92:   rootID: string
93:   depth: number
94:   budgetUsed: number
95:   agent: SpecialistAgent
96:   category?: DelegationCategory
97:   model?: string
98:   queueKey: string
99:   /** Per-session runtime-policy override from trusted continuity/delegation metadata. */
100:   runtimePolicyOverride?: SessionPolicyOverride
101: }
102: 
103: export type CompactionCheckpointData = {
104:   agent: string | null
105:   model: string | null
106:   tools: string[]
107:   delegationMeta: DelegationMeta | null
108:   warnings: string[]
109:   sessionStats: {
110:     total: number
111:     byTool: Record<string, number>
112:     loop: {
113:       signature: string
114:       count: number
115:     }
116:   }
117:   capturedAt: number
118: }
119: 
120: // ---------------------------------------------------------------------------
121: // Unified lifecycle status model
122: // ---------------------------------------------------------------------------
123: // Three overlapping status types exist. HarnessStatus is the canonical superset.
124: //
125: // MAPPING TABLE:
126: // ┌─────────────┬────────────────────────┬──────────────────────────┐
127: // │ HarnessStatus│ SessionLifecyclePhase  │ DelegationPacketStatus   │
128: // ├─────────────┼────────────────────────┼──────────────────────────┤
129: // │ pending     │ created                │ pending                  │
130: // │ queued      │ queued                 │ pending                  │
131: // │ dispatching │ dispatching            │ pending                  │
132: // │ running     │ running                │ running                  │
133: // │ completed   │ completed              │ completed                │
134: // │ failed      │ failed                 │ failed                   │
135: // │ error       │ failed                 │ failed                   │
136: // │ cancelled   │ failed                 │ failed                   │
137: // │ interrupt   │ (preserves previous)   │ (preserves previous)     │
138: // └─────────────┴────────────────────────┴──────────────────────────┘
139: //
140: // TaskStatus (8 values, no dispatching) is the continuity-store status.
141: // SessionLifecyclePhase (6 values, adds dispatching, no interrupt/cancelled).
142: // DelegationPacketStatus (4 values) is a coarse-grained packet view.
143: // ---------------------------------------------------------------------------
144: 
145: export type HarnessStatus =
146:   | "pending"
147:   | "queued"
148:   | "dispatching"
149:   | "running"
150:   | "completed"
151:   | "error"
152:   | "cancelled"
153:   | "interrupt"
154:   | "failed"
155: 
156: export type DelegationPacketStatus = "pending" | "running" | "completed" | "failed"
157: 
158: export const HARNESS_STATUS_TO_LIFECYCLE_PHASE: Record<
159:   Exclude<HarnessStatus, "interrupt">,
160:   "created" | "queued" | "dispatching" | "running" | "completed" | "failed"
161: > = {
162:   pending: "created",
163:   queued: "queued",
164:   dispatching: "dispatching",
165:   running: "running",
166:   completed: "completed",
167:   error: "failed",
168:   cancelled: "failed",
169:   failed: "failed",
170: } as const
171: 
172: // ---------------------------------------------------------------------------
173: // Runtime policy types (RESEARCH D-16: supplements OpenCode built-ins only)
174: // ---------------------------------------------------------------------------
175: 
176: export type PerKeyConcurrencyPolicy = {
177:   limit: number
178:   acquireTimeoutMs?: number
179: }
180: 
181: export type ConcurrencyPolicy = {
182:   globalLimit: number
183:   perKey?: Record<string, PerKeyConcurrencyPolicy>
184: }
185: 
186: export type BudgetPolicy = {
187:   maxToolCallsPerSession: number
188:   repeatedSignatureThreshold: number
189:   warningCap: number
190:   resetOnCompact: boolean
191: }
192: 
193: export type TrustedRuntimePolicy = {
194:   /**
195:    * @deprecated Phase 46.1 (audit 2026-04-30, Finding 3): the harness now
196:    * always uses async dispatch for SDK-mode delegations. This flag is kept
197:    * on the policy schema only for backwards-compat with on-disk YAML and is
198:    * no longer consulted by the dispatch path. Removing it from a policy
199:    * file is safe; setting it to `false` no longer downgrades to sync.
200:    */
201:   builtinAsyncBackgroundChildSessions: boolean
202: }
203: 
204: export type RuntimePolicy = {
205:   concurrency: ConcurrencyPolicy
206:   budget: BudgetPolicy
207:   trustedRuntime: TrustedRuntimePolicy
208:   categoryGate?: CategoryGatePolicy
209:   /** Maximum delegation nesting depth (default: 3) */
210:   maxDelegationDepth?: number
211: }
212: 
213: export type CategoryGateSurface = "agent-delegation" | "command-process"
214: 
215: /** Narrowing-only delegation category gate policy. */
216: export type CategoryGatePolicy = {
217:   askUnknownCategories: boolean
218:   readonlyCategories: readonly string[]
219:   commandCategory: string
220: }
221: 
222: /** Auditable category gate allow/ask decision. */
223: export type CategoryGateDecision = {
224:   allowed: boolean
225:   reason: string
226:   category?: string
227:   audit: {
228:     gate: "category"
229:     askReason?: string
230:   }
231: }
232: 
233: export type SessionBudgetOverride = Partial<BudgetPolicy>
234: 
235: export type SessionConcurrencyOverride = {
236:   globalLimit?: number
237:   perKey?: Record<string, PerKeyConcurrencyPolicy>
238: }
239: 
240: export type SessionPolicyOverride = {
241:   concurrency?: SessionConcurrencyOverride
242:   budget?: SessionBudgetOverride
243:   trustedRuntime?: Partial<TrustedRuntimePolicy>
244:   /** Override for max delegation nesting depth */
245:   maxDelegationDepth?: number
246: }
247: 
248: export type ResolvedConcurrencyPolicy = {
249:   limit: number
250:   acquireTimeoutMs?: number
251: }
252: 
253: export type ResolvedBudgetPolicy = BudgetPolicy
254: 
255: // ---------------------------------------------------------------------------
256: // Lifecycle state types
257: // ---------------------------------------------------------------------------
258: 
259: export type SessionLifecyclePhase =
260:   | "created"
261:   | "queued"
262:   | "dispatching"
263:   | "running"
264:   | "completed"
265:   | "failed"
266: 
267: export type SessionLifecycleState = {
268:   phase: SessionLifecyclePhase
269:   launchedAt?: number
270:   completedAt?: number
271:   runMode?: string
272:   queue?: { active: number; limit: number; pending: number }
273:   observation?: { source: string; observedAt: number; detail: string }
274:   error?: string
275: }
276: 
277: // ---------------------------------------------------------------------------
278: // Continuity store types
279: // ---------------------------------------------------------------------------
280: 
281: export type SessionPromptParams = {
282:   agent?: string
283:   category?: string
284:   tools?: string[]
285:   [key: string]: unknown
286: }
287: 
288: export type SessionToolProfile = {
289:   allowed?: string[]
290:   denied?: string[]
291:   [key: string]: unknown
292: }
293: 
294: export type DelegationPacket = {
295:   id: string
296:   createdAt: number
297:   spec: string
298:   plan?: string
299:   artifacts: string[]
300:   commits: string[]
301:   parentChain: string[]
302:   status: DelegationPacketStatus
303:   updatedAt: number
304: }
305: 
306: export type SessionContinuityMetadata = {
307:   status: TaskStatus
308:   description: string
309:   delegation: DelegationMeta | null
310:   category?: string
311:   constraints: string[]
312:   lifecycle?: SessionLifecycleState
313:   pendingNotifications: PendingNotification[]
314:   resultCapture?: CapturedResult
315:   compactionCheckpoint?: CompactionCheckpointData
316:   delegationPacket?: DelegationPacket
317:   route?: string
318:   lastToolActivityAt?: number
319:   updatedAt: number
320: }
321: 
322: export type SessionContinuityRecord = {
323:   sessionID: string
324:   promptParams: SessionPromptParams
325:   toolProfile?: SessionToolProfile
326:   metadata: SessionContinuityMetadata
327: }
328: 
329: // ---------------------------------------------------------------------------
330: // Governance persistence types
331: // ---------------------------------------------------------------------------
332: 
333: export type GovernanceRule = {
334:   id: string
335:   condition: { toolNames?: string[]; sessionIDs?: string[];[key: string]: unknown }
336:   action: { type: string; escalation?: Record<string, unknown>;[key: string]: unknown }
337:   enabled: boolean
338: }
339: 
340: export type GovernanceViolation = {
341:   ruleId: string
342:   sessionID: string
343:   timestamp: number
344:   detail: string
345:   escalation?: Record<string, unknown>
346: }
347: 
348: export type GovernancePersistenceState = {
349:   rules: GovernanceRule[]
350:   violations: GovernanceViolation[]
351:   updatedAt: number
352: }
353: 
354: export type ContinuityStoreFile = {
355:   version: number
356:   updatedAt: number
357:   sessions: Record<string, SessionContinuityRecord>
358:   governance: GovernancePersistenceState
359: }
360: 
361: // ---------------------------------------------------------------------------
362: // Checkpoint data type (for compaction lifecycle)
363: // ---------------------------------------------------------------------------
364: 
365: export type CheckpointData = CompactionCheckpointData
366: 
367: // ---------------------------------------------------------------------------
368: // Delegation types (Phase 14) — WaiterModel + Dual-Signal Architecture
369: // Extracted to delegation-types.ts to maintain 500 LOC limit.
370: // Re-exported here for backward compatibility — existing imports unchanged.
371: // ---------------------------------------------------------------------------
372: 
373: export type {
374:   DelegationStatus,
375:   DelegationSurface,
376:   DelegationRecoveryGuarantee,
377:   DelegationTerminalKind,
378:   Delegation,
379:   DelegationResult,
380:   CommandDelegationParams,
381: } from "../coordination/delegation/types.js"
382: 
383: export {
384:   DEFAULT_SAFETY_CEILING_MS,
385:   MAX_DELEGATION_DEPTH,
386:   TASK_CLEANUP_DELAY_MS,
387:   MAX_DELEGATIONS_BEFORE_PRUNE,
388:   DEFAULT_PRUNE_MAX_AGE_MS,
389:   POLL_INTERVAL_ACTIVE_MS,
390:   POLL_INTERVAL_BASE_MS,
391:   POLL_INTERVAL_IDLE_MS,
392:   POLL_INTERVAL_DEEP_IDLE_MS,
393:   MIN_IDLE_TIME_MS,
394:   DEFAULT_STALE_TIMEOUT_MS,
395:   MIN_STABILITY_TIME_MS,
396:   STABLE_POLLS_REQUIRED,
397:   STABILITY_THRESHOLD,
398:   STABILITY_POLL_INTERVAL_MS,
399: } from "../coordination/delegation/types.js"
400: 
401: // ---------------------------------------------------------------------------
402: // Config workflow state machine types (Phase 16.5 fix)
403: // Extracted to config-workflow/workflow-types.ts to maintain 500 LOC limit.
404: // Re-exported here for backward compatibility — existing imports unchanged.
405: // ---------------------------------------------------------------------------
406: 
407: export type {
408:   ConfigWorkflowState,
409:   WorkflowTurn,
410:   WorkflowTurnRecord,
411:   WorkflowTurnStatus,
412:   WorkflowResumeResult,
413: } from "../config/workflow/workflow-types.js"
414: 
415: export { WORKFLOW_TURNS } from "../config/workflow/workflow-types.js"

(End of file - total 415 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/features"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/routing"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/types.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/composition/cqrs-boundary.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/hooks/composition/cqrs-boundary.ts</path>
<type>file</type>
<content>
1: export type HookEffectKind = "observation" | "response-shaping" | "guard-decision"
2: export type HookOperation = HookEffectKind | "durable-write"
3: 
4: export type HookEffectClassification = {
5:   hook: string
6:   kind: HookEffectKind
7:   durableWriteAllowed: false
8: }
9: 
10: /**
11:  * Classifies known OpenCode hook effects according to the harness CQRS boundary.
12:  *
13:  * @param hook - OpenCode hook identifier.
14:  * @returns The hook effect classification used by tests and hook comments.
15:  */
16: export function classifyHookEffect(hook: string): HookEffectClassification {
17:   if (hook === "messages.transform" || hook === "shell.env" || hook === "tool.execute.after") {
18:     return { hook, kind: "response-shaping", durableWriteAllowed: false }
19:   }
20:   if (hook === "tool.execute.before") {
21:     return { hook, kind: "guard-decision", durableWriteAllowed: false }
22:   }
23:   return { hook, kind: "observation", durableWriteAllowed: false }
24: }
25: 
26: /**
27:  * Rejects hidden durable writes from hook execution contexts.
28:  *
29:  * @param input - Hook and attempted operation.
30:  * @throws A `[Harness]` error when a hook attempts a durable write.
31:  */
32: export function assertHookWriteBoundary(input: { hook: string; operation: HookOperation }): void {
33:   if (input.operation === "durable-write") {
34:     throw new Error(`[Harness] Hook ${input.hook} cannot perform durable-write operations.`)
35:   }
36: }

(End of file - total 36 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/hooks/composition/AGENTS.md
# Hook Composition Guidance

**Parent sector:** `src/hooks/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — read-side (CQRS boundary enforcement, factory wiring)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/hooks/composition/` wires hook factories and CQRS boundaries. `cqrs-boundary.ts` defines and enforces the write-boundary assertion that prevents hooks from performing durable writes. This layer is dependency-light and exists to compose hook behavior at plugin assembly time. Source evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/STRUCTURE.md:99-103`.

## 2. Allowed mutation authority

- Composition utilities may wire hook factories into the plugin composition root.
- `cqrs-boundary.ts` may assert and enforce write boundaries. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Composition SHALL NOT embed business logic; it wires, not acts.
- Composition SHALL NOT perform durable writes; it defines the boundary that prevents them.
- Composition SHALL NOT depend on deep runtime modules; keep dependency-light. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/plugin.ts` | Uses composition to wire hooks | Keeps assembly logic only |
| All hook files | Depend on CQRS boundary assertions | Must respect boundary enforcement |
| Tests | Validate boundary enforcement | Must not treat mocked calls as integration proof |

## 5. Naming and placement conventions

- Composition files use `kebab-case.ts` in `src/hooks/composition/`. Source evidence: `.planning/codebase/STRUCTURE.md:226-230`.
- Tests mirror under `tests/hooks/composition/`.

## 6. Quality gates and evidence expectations

- Changes must verify CQRS boundary enforcement still holds.
- Required: `npm run typecheck` and scoped `npx vitest run tests/hooks/...`. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/types.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/coordination/delegation/types.ts</path>
<type>file</type>
<content>
1: // ---------------------------------------------------------------------------
2: // Delegation types (Phase 14) — WaiterModel + Dual-Signal Architecture
3: // ---------------------------------------------------------------------------
4: // Extracted from types.ts to maintain the 500 LOC module limit.
5: // Re-exported from types.ts for backward compatibility — existing imports unchanged.
6: //
7: // Architecture: D-02 (always-background WaiterModel), D-04 (dual-signal completion),
8: // D-13 (no fixed timeouts, safety ceiling only), D-14 (separate status tool)
9: // ---------------------------------------------------------------------------
10: 
11: export type DelegationStatus =
12:   | "dispatched"  // Just dispatched, child session created and prompted
13:   | "running"     // Child session processing, dual-signal monitoring active
14:   | "completed"   // Dual-signal confirmed completion, result extracted
15:   | "error"       // Error occurred (child session deleted, SDK error, etc.)
16:   | "timeout"     // Safety ceiling reached (MAX runtime, not a deadline)
17: 
18: export type DelegationSurface = "agent-delegation" | "command-process"
19: 
20: export type DelegationRecoveryGuarantee = "resumable" | "best-effort" | "non-resumable-after-restart"
21: 
22: export type DelegationTerminalKind =
23:   | "completed"
24:   | "error"
25:   | "timeout"
26:   | "cancelled"
27:   | "interrupted-by-signal"
28:   | "non-resumable-after-restart"
29: 
30: export interface Delegation {
31:   id: string
32:   parentSessionId: string
33:   childSessionId: string
34:   agent: string
35:   status: DelegationStatus
36:   result?: string
37:   resultTruncated?: boolean
38:   error?: string
39:   createdAt: number
40:   completedAt?: number
41:   /** Optional max runtime ceiling — NOT a deadline. Tasks run until dual-signal confirms completion. */
42:   safetyCeilingMs?: number
43:   /** Last known message count from child session (for stability tracking) */
44:   lastMessageCount: number
45:   /** Number of consecutive stable polls (message count unchanged) */
46:   stablePollCount: number
47:   /** Nesting depth of this delegation (1 = top-level) */
48:   nestingDepth: number
49:   /** Timestamp when grace period cleanup is scheduled (terminal states only) */
50:   gracePeriodExpiresAt?: number
51:   /** Timestamp of last observed message count change (for adaptive polling) */
52:   lastMessageCountChangeAt?: number
53:   executionMode: "sdk" | "pty" | "headless"
54:   surface?: DelegationSurface
55:   recoveryGuarantee?: DelegationRecoveryGuarantee
56:   workingDirectory: string
57:   ptySessionId?: string
58:   fallbackReason?: string
59:   queueKey: string
60:   terminalKind?: DelegationTerminalKind
61:   terminationSignal?: string
62:   explicitCancellation?: boolean
63: }
64: 
65: export interface DelegationResult {
66:   status: DelegationStatus
67:   result?: string
68:   resultTruncated?: boolean
69:   error?: string
70:   delegationId: string
71:   executionMode?: "sdk" | "pty" | "headless"
72:   surface?: DelegationSurface
73:   recoveryGuarantee?: DelegationRecoveryGuarantee
74:   workingDirectory?: string
75:   ptySessionId?: string
76:   fallbackReason?: string
77:   queueKey?: string
78:   terminalKind?: DelegationTerminalKind
79:   terminationSignal?: string
80:   explicitCancellation?: boolean
81:   /** Timestamp when grace period cleanup is scheduled (terminal states only) */
82:   gracePeriodExpiresAt?: number
83:   /** Total count of matching delegations (for status tool responses) */
84:   total?: number
85: }
86: 
87: export type CommandDelegationParams = {
88:   parentSessionId: string
89:   command: string
90:   args?: string[]
91:   cwd?: string
92:   env?: Record<string, string>
93:   title?: string
94:   queueContext?: {
95:     provider?: string
96:     model?: string
97:     agent?: string
98:     category?: string
99:   }
100:   /** Advisory watchdog threshold only — not a fixed completion timeout. */
101:   safetyCeilingMs?: number
102: }
103: 
104: /** Safety ceiling — MAX runtime, not a deadline. Tasks may complete faster. */
105: export const DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000 // 30 minutes
106: /** Maximum delegation nesting depth (default: 3, overridable via RuntimePolicy) */
107: export const MAX_DELEGATION_DEPTH = 3
108: 
109: // ---------------------------------------------------------------------------
110: // Phase 16.2: Grace period, adaptive polling, and nesting depth constants
111: // ---------------------------------------------------------------------------
112: 
113: /** Grace period before in-memory cleanup of terminal delegations (10 minutes) */
114: export const TASK_CLEANUP_DELAY_MS = 10 * 60 * 1000
115: /** Maximum delegations before batch pruning kicks in */
116: export const MAX_DELEGATIONS_BEFORE_PRUNE = 50
117: /** Max age for batch pruning of terminal delegations (30 minutes) */
118: export const DEFAULT_PRUNE_MAX_AGE_MS = 30 * 60 * 1000
119: 
120: /** Adaptive polling: interval when child is actively producing messages */
121: export const POLL_INTERVAL_ACTIVE_MS = 2000
122: /** Adaptive polling: interval when child is stable for < 30s */
123: export const POLL_INTERVAL_BASE_MS = 5000
124: /** Adaptive polling: interval when child is idle for 30s–5min */
125: export const POLL_INTERVAL_IDLE_MS = 10000
126: /** Adaptive polling: interval when child is deeply idle (> 5min) */
127: export const POLL_INTERVAL_DEEP_IDLE_MS = 30000
128: 
129: /** Minimum time a delegation must run before fast-completion deferral expires */
130: export const MIN_IDLE_TIME_MS = 5000
131: /** Activity-based stale timeout (45 minutes) — NOT a fixed deadline */
132: export const DEFAULT_STALE_TIMEOUT_MS = 45 * 60 * 1000
133: /** Minimum elapsed time since last message change before stability is declared */
134: export const MIN_STABILITY_TIME_MS = 10000
135: /** Number of consecutive stable polls required to confirm completion */
136: export const STABLE_POLLS_REQUIRED = 3
137: /** @deprecated Use STABLE_POLLS_REQUIRED instead */
138: export const STABILITY_THRESHOLD = STABLE_POLLS_REQUIRED
139: /** @deprecated Use adaptive interval calculation instead */
140: export const STABILITY_POLL_INTERVAL_MS = POLL_INTERVAL_BASE_MS

(End of file - total 140 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/lifecycle/index.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/task-management/lifecycle/index.ts</path>
<type>file</type>
<content>
1: /**
2:  * Harness lifecycle manager — session lifecycle state machine.
3:  *
4:  * Provides transition guards, activity tracking, and event routing
5:  * for delegated session lifecycle management.
6:  */
7: import { CompletionDetector } from "../../coordination/completion/detector.js"
8: import { getSessionContinuity, listSessionContinuity, patchSessionContinuity } from "../continuity/index.js"
9: import { replayPendingNotifications } from "../../coordination/completion/notification-handler.js"
10: import type { DelegationManager } from "../../coordination/delegation/manager.js"
11: import { abortSession, sendPrompt, type OpenCodeClient } from "../../shared/session-api.js"
12: import { hydrateDelegationState, taskState } from "../../shared/state.js"
13: import type {
14:   CheckpointData,
15:   RuntimePolicy,
16:   SessionLifecyclePhase,
17:   SessionLifecycleState,
18: } from "../../shared/types.js"
19: 
20: type HarnessLifecycleManagerOptions = {
21:   client: OpenCodeClient
22:   pollTimeoutMs: number
23:   runtimePolicy?: RuntimePolicy
24:   backgroundManager?: unknown
25:   delegationManager?: DelegationManager
26: }
27: 
28: export type LaunchDelegatedSessionArgs = {
29:   sessionID: string
30:   description: string
31:   agent: string
32:   category?: string
33:   model?: string
34:   constraints?: string[]
35:   promptText: string
36:   parentSessionID?: string
37:   [key: string]: unknown
38: }
39: 
40: /**
41:  * Valid lifecycle phase transitions.
42:  *
43:  * ┌─────────────┬──────────────────────────────────────────────┐
44:  * │ From         │ To                                           │
45:  * ├─────────────┼──────────────────────────────────────────────┤
46:  * │ created     │ queued, dispatching, running, failed         │
47:  * │ queued      │ dispatching, running, failed                 │
48:  * │ dispatching │ running, completed, failed                   │
49:  * │ running     │ completed, failed                            │
50:  * │ completed   │ (terminal)                                   │
51:  * │ failed      │ (terminal)                                   │
52:  * └─────────────┴──────────────────────────────────────────────┘
53:  */
54: const VALID_LIFECYCLE_TRANSITIONS: Record<SessionLifecyclePhase, SessionLifecyclePhase[]> = {
55:   created:     ["queued", "dispatching", "running", "failed"],
56:   queued:      ["dispatching", "running", "failed"],
57:   dispatching: ["running", "completed", "failed"],
58:   running:     ["completed", "failed"],
59:   completed:   [],
60:   failed:      [],
61: }
62: 
63: export function isValidTransition(from: SessionLifecyclePhase, to: SessionLifecyclePhase): boolean {
64:   return VALID_LIFECYCLE_TRANSITIONS[from].includes(to)
65: }
66: 
67: export function isTerminalPhase(phase: SessionLifecyclePhase): boolean {
68:   return phase === "completed" || phase === "failed"
69: }
70: 
71: export class HarnessLifecycleManager {
72:   private readonly concurrencyLimit: number
73:   private readonly completionDetector = new CompletionDetector()
74:   private readonly client: OpenCodeClient
75:   private readonly delegationManager?: DelegationManager
76: 
77:   constructor(options: HarnessLifecycleManagerOptions) {
78:     this.client = options.client
79:     this.delegationManager = options.delegationManager
80:     this.concurrencyLimit = parseInt(process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3", 10)

(Showing lines 1-80 of 243. Use offset=81 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/task-management/lifecycle/AGENTS.md
# Lifecycle Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/lifecycle/` owns the HarnessLifecycleManager (`index.ts`, ~243 LOC) — the session lifecycle state machine for delegated child sessions. It enforces validated phase transitions (created→queued→dispatching→running→completed/failed), routes lifecycle events from hooks to runtime state, coordinates with CompletionDetector for dual-signal completion, integrates with DelegationManager for dispatch, and replays pending notifications on recovery. Source evidence: `.planning/codebase/ARCHITECTURE.md:192-193`, `.planning/codebase/ARCHITECTURE.md:258`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- HarnessLifecycleManager may transition session lifecycle phases through validated transitions (`isValidTransition()` guards). Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- May handle `session.idle`, `session.error`, `session.deleted` events, feeding them to CompletionDetector and transitioning phase state.
- May recover pending delegations at startup via `recoverPending()`, re-polling child sessions not yet terminal.
- May replay undelivered `pendingNotifications` via notification-handler for parent session events.

## 3. Forbidden mutations / explicit no-go boundaries

- Lifecycle SHALL NOT dispatch sessions directly; it calls DelegationManager for dispatch orchestration. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Lifecycle SHALL NOT register tools or hooks; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Lifecycle SHALL NOT store state in `.opencode/`; durability belongs to `continuity/`. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.
- Lifecycle SHALL NOT observe OpenCode events directly; hooks route events via factory injection.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Routes `session.*` events to lifecycle manager | Hooks observe; lifecycle transitions |
| `src/coordination/delegation/` | Provides DelegationManager for child session dispatch | DelegationManager owns dispatch; lifecycle orchestrates |
| `src/coordination/completion/` | Provides CompletionDetector for dual-signal integration | CompletionDetector owns signal detection |
| `src/task-management/continuity/` | Reads/patches session continuity for phase transitions | Continuity owns storage; lifecycle owns state machine |
| `src/plugin.ts` | Wires HarnessLifecycleManager at composition time | Composition root only |

## 5. Naming and placement conventions

- `index.ts` — HarnessLifecycleManager class with `handleSessionCreated()`, `handleSessionIdle()`, `handleSessionDeleted()`, `transitionPhase()`, `recoverPending()`.
- Options type `HarnessLifecycleManagerOptions` defines injected dependencies. `LaunchDelegatedSessionArgs` for session launch.
- Tests mirror under `tests/lib/task-management/lifecycle/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/task-management/lifecycle/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Phase transition changes must verify all valid paths and terminal state reachability.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/task-management/AGENTS.md
# Task Management Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/task-management/` is the Hard Harness durable state and lifecycle sector. It owns session continuity (dual-layer: in-memory + `.hivemind/state/` JSON), delegation record persistence, append-only event journals, the session lifecycle state machine (created→queued→dispatching→running→completed/failed), execution trajectory, and session recovery. Source evidence: `.planning/codebase/ARCHITECTURE.md:54`, `.planning/codebase/ARCHITECTURE.md:108`, `.planning/codebase/STRUCTURE.md:93-94`.

## 2. Allowed mutation authority

- ContinuityStoreFile may persist session state, delegation records, and lineage to `.hivemind/state/` durable JSON files. Evidence: `.planning/codebase/ARCHITECTURE.md:76`, `.planning/codebase/ARCHITECTURE.md:181`.
- HarnessLifecycleManager may transition session lifecycle phases with validated state machine transitions. Evidence: `.planning/codebase/ARCHITECTURE.md:192-193`.
- Journal and EventTracker may append events to append-only timelines and project audit events to `.hivemind/event-tracker/`. Evidence: `.planning/codebase/ARCHITECTURE.md:288`.
- Trajectory may record execution lineage (session parent/child trees). Evidence: `.planning/codebase/ARCHITECTURE.md:288`.
- Recovery modules may reconstruct session state from durable continuity files at startup.

## 3. Forbidden mutations / explicit no-go boundaries

- Task management SHALL NOT dispatch or spawn sessions; that is `src/coordination/`'s role. Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Task management SHALL NOT observe OpenCode lifecycle events directly; hooks route facts to lifecycle manager via dependency injection. Evidence: `.planning/codebase/ARCHITECTURE.md:258`.
- Task management SHALL NOT register tools or hooks; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Task management SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:268-270`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/` | Persists delegation records via delegation-persistence | Coordination dispatches; task-management persists |
| `src/hooks/` | Routes lifecycle events to HarnessLifecycleManager | Hooks observe; task-management transitions state |
| `src/tools/` | Reads continuity state for tool responses | Tools own behavior; task-management owns state |
| `src/plugin.ts` | Wires lifecycle manager and continuity store | Composition root only, no business logic |
| Tests | Validate persistence, lifecycle transitions, journal append | Must not treat unit mocks as integration proof |

## 5. Naming and placement conventions

- Subdirectories: `continuity/`, `journal/`, `lifecycle/`, `recovery/`, `trajectory/`. Evidence: `.planning/codebase/STRUCTURE.md:93-94`.
- Continuity files use `ContinuityStoreFile` pattern; lifecycle uses `HarnessLifecycleManager`. Evidence: `.planning/codebase/ARCHITECTURE.md:54`.
- State files write to `.hivemind/state/` (canonical per Q6 decision). Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tests mirror this sector under `tests/lib/` matching source module paths. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Keep files below the 500 LOC cap. Evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/...` for affected modules. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Continuity format changes require migration evidence and broader regression testing across delegation and lifecycle.
- Runtime readiness cannot be claimed from unit tests alone; integration evidence requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/tool-response.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/tool-response.ts</path>
<type>file</type>
<content>
1: /**
2:  * Standard tool-response envelope. All prompt-enhance tools return this
3:  * shape so that the pipeline can uniformly detect success, error, and
4:  * pending states.
5:  */
6: export type ToolResponse<T = unknown> = {
7:   kind: "success" | "error" | "pending"
8:   message: string
9:   data?: T
10:   metadata?: Record<string, unknown>
11: }
12: 
13: /**
14:  * Create a success response.
15:  * @param message - Human-readable status message
16:  * @param data - Optional payload data
17:  * @param metadata - Optional diagnostic metadata
18:  */
19: export function success<T>(
20:   message: string,
21:   data?: T,
22:   metadata?: Record<string, unknown>,
23: ): ToolResponse<T> {
24:   return { kind: "success", message, data, metadata }
25: }
26: 
27: /**
28:  * Create an error response.
29:  * @param message - Human-readable error message
30:  * @param data - Optional payload data (e.g. partial results)
31:  * @param metadata - Optional diagnostic metadata
32:  */
33: export function error<T>(
34:   message: string,
35:   data?: T,
36:   metadata?: Record<string, unknown>,
37: ): ToolResponse<T> {
38:   return { kind: "error", message, data, metadata }
39: }
40: 
41: /**
42:  * Create a pending response (operation in progress).
43:  * @param message - Human-readable status message
44:  * @param data - Optional payload data
45:  * @param metadata - Optional diagnostic metadata
46:  */
47: export function pending<T>(
48:   message: string,
49:   data?: T,
50:   metadata?: Record<string, unknown>,
51: ): ToolResponse<T> {
52:   return { kind: "pending", message, data, metadata }
53: }
54: 
55: /**
56:  * Type guard: true if response is a success.
57:  */
58: export function isSuccess(
59:   response: ToolResponse,
60: ): response is ToolResponse & { kind: "success" } {

(Showing lines 1-60 of 71. Use offset=61 to continue.)
</content>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_LEz1jgc63FEH8ZFMUkS11699"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_1ZjhFvRd1AtbyXLf2cEL9484"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_PGajFMtIqK6oF1b6F8w97357"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/codebase/ARCHITECTURE.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/codebase/ARCHITECTURE.md</path>
<type>file</type>
<content>
1: <!-- generated-by: gsd-doc-writer -->
2: <!-- refreshed: 2026-05-06 -->
3: # Architecture
4: 
5: **Analysis Date:** 2026-04-28
6: **Updated:** 2026-05-06
7: 
8: ## System Overview
9: 
10: ```
11: ┌──────────────────────────────────────────────────────────────────────────┐
12: │                        Hard Harness (npm package)                         │
13: │                             `src/`                                        │
14: ├──────────────────┬──────────────────────┬────────────────────────────────┤
15: │   Tools (Write)  │   Hooks (Read)       │   Kernel (Shared)              │
16: │  `src/tools/`    │  `src/hooks/`        │  `src/lib/`                    │
17: │  CQRS: mutation  │  CQRS: observation   │  types, state, concurrency,    │
18: │  authority only  │  only (no durable    │  continuity, lifecycle,        │
19: │                  │   writes allowed)    │  delegation, session-api       │
20: ├──────────────────┼──────────────────────┼────────────────────────────────┤
21: │            Plugin Composition Root (`src/plugin.ts`)                      │
22: │            Wires deps → instantiates hooks → registers 16 tools          │
23: └────────┬─────────┴──────────────────────┴───────────┬────────────────────┘
24:          │                                              │
25:          ▼                                              ▼
26: ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
27: │   Soft Meta-Concepts (configurable)  │  │   Deep Module State (internal)        │
28: │   `.opencode/`                       │  │   `.hivemind/`                        │
29: │                                      │  │                                       │
30: │   • 89 agents                        │  │   • Session continuity JSON            │
31: │   • 123 skills                       │  │   • Delegation records                │
32: │   • 18 commands                      │  │   • Execution lineage                 │
33: │   • Permission rules                 │  │   • Event tracker artifacts           │
34: │   • Plugin loader                    │  │   • Session journals                  │
35: └──────────────────────────────────────┘  └──────────────────────────────────────┘
36: ```
37: 
38: ## Two Halves (never confuse them)
39: 
40: | Half | What | Where |
41: |------|------|-------|
42: | **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
43: | **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |
44: | **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state | `.hivemind/` |
45: 
46: ## Component Responsibilities
47: 
48: | Component | Responsibility | File |
49: |-----------|----------------|------|
50: | `HarnessControlPlane` | Composition root — instantiates deps, wires hooks, registers tools | `src/plugin.ts` |
51: | `DelegationManager` | Core delegation orchestrator — WaiterModel dispatch, concurrency, status polling, recovery | `src/lib/delegation-manager.ts` |
52: | `HarnessLifecycleManager` | Session lifecycle state machine — transition guards, activity tracking, event routing | `src/lib/lifecycle-manager.ts` |
53: | `CompletionDetector` | Two-signal completion detection (session.idle + stability timer) | `src/lib/completion-detector.ts` |
54: | `TaskStateManager` | In-memory Maps for sessionStats, rootBudgets, sessionToRoot, delegationMeta | `src/lib/state.ts` |
55: | `DelegationConcurrencyQueue` | Keyed semaphore (FIFO per model+agent+category) | `src/lib/concurrency.ts` |
56: | `NotificationHandler` | Terminal-state delegation notifications — fire-and-forget with durable pending queue (re-activated Phase 16.2) | `src/lib/notification-handler.ts` |
57: | Continuity Store | Durable JSON persistence with deep-clone, normalization, quarantine | `src/lib/continuity.ts` |
58: | Session API | Typed OpenCode SDK wrappers (create, get, abort, messages, prompt, walkParentChain) | `src/lib/session-api.ts` |
59: | Runtime Policy | Policy loading, validation, per-session overrides (concurrency, budget, category gates) | `src/lib/runtime-policy.ts` |
60: | Session Journal | Append-only event timeline — independent of continuity.ts (Q3 decision) | `src/lib/session-journal.ts` |
61: | Execution Lineage | Derived projection combining continuity + delegations + journal entries | `src/lib/execution-lineage.ts` |
62: | Event Tracker | Hook-driven audit trail — parses events, writes artifacts to `.hivemind/event-tracker/` | `src/lib/event-tracker/` |
63: | Schema Kernel | Zod schemas for agent/command/skill frontmatter, permissions, MCP servers, prompt-enhance pipeline | `src/schema-kernel/` |
64: | Spawner | Agent primitive policy, concurrency key resolution, parent directory, session creation, request building | `src/lib/spawner/` |
65: | PTY Manager | bun-pty pseudo-terminal integration for background command execution | `src/lib/pty/` |
66: | Config Workflow | Turn-based workflow state persistence for configure-primitive | `src/lib/config-workflow/` |
67: | Security | Path-scope validation (`assertPathWithinRoot`) and boundary-field redaction | `src/lib/security/` |
68: 
69: ## Pattern Overview
70: 
71: **Overall:** CQRS Plugin Architecture with WaiterModel Delegation
72: 
73: **Key Characteristics:**
74: - **CQRS separation**: Tools are the only write-side mutation surface; hooks are read-side observers — enforced by `hook-cqrs-boundary.ts` (`assertHookWriteBoundary`)
75: - **WaiterModel delegation**: `delegate-task` tool returns immediately with delegation ID; polling via `delegation-status` tool; dual-signal completion detection (session.idle + stability timer)
76: - **Dual-layer state**: Durable JSON file (`continuity.ts`) for persistence across restarts + in-memory Maps (`state.ts`) for hot runtime access, hydrated on startup
77: - **Keyed semaphore concurrency**: `DelegationConcurrencyQueue` with per-key (provider:model, agent:category) FIFO lanes, high/normal priority queuing
78: - **Trusted runtime policy**: Configurable concurrency limits, tool budgets, category gates loaded from `.hivemind/runtime-policy.json` (workspace-level) with per-session overrides via delegation metadata
79: - **Hybrid delegation**: SDK child-session dispatch (resumable) + PTY command-process dispatch (best-effort) + headless process dispatch (non-resumable) — unified under `DelegationManager`
80: - **Zero business logic in plugin layer**: `plugin.ts` is a thin composition root (~142 LOC); all logic lives in individual hook factories and tool implementations
81: - **`[Harness]` error prefix**: All thrown errors use this prefix for flow control identification
82: 
83: ## Layers
84: 
85: ### Tools Layer (Write-Side / CQRS Command)
86: - Purpose: Expose mutation operations to agents via OpenCode tool system — delegation dispatch, status polling, background commands, prompt enhancement, configuration, validation, journal export
87: - Location: `src/tools/`
88: - Contains: 16 tool implementations, each wrapping a Zod schema and `execute()` function
89: - Depends on: `src/lib/` (types, delegation-manager, continuity), `@opencode-ai/plugin/tool`, `src/shared/`
90: - Used by: OpenCode runtime — agents invoke tools via plugin tool registry
91: 
92: **Tools registered:**
93: | Tool | Purpose | File |
94: |------|---------|------|
95: | `delegate-task` | Dispatch work to specialist agents via SDK child-session (WaiterModel) | `src/tools/delegate-task.ts` |
96: | `delegation-status` | Poll delegation status by ID or list all (optionally filtered by status) | `src/tools/delegation-status.ts` |
97: | `run-background-command` | Run CLI commands in shared PTY sessions with queue-governed dispatch | `src/tools/run-background-command.ts` |
98: | `prompt-skim` | Fast scan of prompt content (words/lines/tokens, URLs, file paths, complexity score) | `src/tools/prompt-skim/` |
99: | `prompt-analyze` | Deep analysis for contradictions, vagueness, missing scope, clarity signals | `src/tools/prompt-analyze/` |
100: | `session-patch` | Patch specific sections in session files with backup | `src/tools/session-patch/` |

(Showing lines 1-100 of 328. Use offset=101 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/codebase/STRUCTURE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/codebase/ARCHITECTURE.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/codebase/ARCHITECTURE.md</path>
<type>file</type>
<content>
100: | `session-patch` | Patch specific sections in session files with backup | `src/tools/session-patch/` |
101: | `session-journal-export` | Export session journal and execution lineage as JSON or Markdown | `src/tools/session-journal-export.ts` |
102: | `configure-primitive` | Configure, read, list, or inspect OpenCode primitives (agent, command, skill) | `src/tools/configure-primitive.ts` |
103: | `validate-restart` | Validate compiled primitives are discoverable after restart | `src/tools/validate-restart.ts` |
104: | `hivemind-doc` | Search and retrieve Hivemind documentation artifacts | `src/tools/hivemind-doc.ts` |
105: | `hivemind-trajectory` | Track and export execution trajectory for audit | `src/tools/hivemind-trajectory.ts` |
106: | `hivemind-pressure` | Runtime pressure classification and authority matrix | `src/tools/hivemind-pressure.ts` |
107: | `hivemind-sdk-supervisor` | SDK supervision and health monitoring | `src/tools/hivemind-sdk-supervisor.ts` |
108: | `hivemind-command-engine` | Command execution engine with queue governance | `src/tools/hivemind-command-engine.ts` |
109: | `hivemind-agent-work-create` | Create agent work contracts | `src/tools/hivemind-agent-work-create.ts` |
110: | `hivemind-agent-work-export` | Export agent work contracts for audit | `src/tools/hivemind-agent-work-export.ts` |
111: 
112: ### Hooks Layer (Read-Side / CQRS Query)
113: - Purpose: Observe and react to OpenCode lifecycle events — event routing, auto-loop, session compaction, tool guarding, shell env injection
114: - Location: `src/hooks/`
115: - Contains: 7 hook factory modules organized by concern
116: - Depends on: `src/lib/` (session-api, lifecycle-manager, continuity, types)
117: - Used by: `plugin.ts` composition root — spread-merged into plugin return object
118: 
119: **Hook factories:**
120: | Factory | Produces | File |
121: |---------|----------|------|
122: | `createCoreHooks` | `event`, `messages.transform`, `system.transform`, `experimental.chat.system.transform`, `shell.env` | `src/hooks/create-core-hooks.ts` |
123: | `createSessionHooks` | `event` (auto-loop), `experimental.session.compacting` | `src/hooks/create-session-hooks.ts` |
124: | `createToolGuardHooks` | `tool.execute.before` (guard), `tool.execute.after` (audit) | `src/hooks/create-tool-guard-hooks.ts` |
125: | Plugin Event Observers | `event` observers for delegation lifecycle and session journey tracking | `src/hooks/plugin-event-observers.ts` |
126: | `createToolExecuteAfterHook` | `tool.execute.after` composer that chains tool-guard after-hook with output summarization | `src/hooks/tool-after-composer.ts` |
127: | CQRS Boundary | `classifyHookEffect()`, `assertHookWriteBoundary()` — classifies hooks as observation/response-shaping/guard-decision | `src/hooks/hook-cqrs-boundary.ts` |
128: 
129: ### Library Layer (Deep Modules / Shared Kernel)
130: - Purpose: All business logic — types, state, concurrency, persistence, lifecycle, delegation, SDK wrappers, completion detection, runtime policy, session journal, execution lineage, event tracking, spawner, PTY, security
131: - Location: `src/lib/`
132: - Contains: 34 modules organized into flat files and 6 subdirectories (spawner, pty, event-tracker, security, config-workflow)
133: - Depends on: `zod`, `@opencode-ai/sdk`, `bun-pty`, `gray-matter`, `yaml`, Node.js built-ins (fs, crypto, path, child_process)
134: - Used by: `plugin.ts` composition root, all tools, all hooks
135: 
136: **Dependency graph (simplified):**
137: ```
138: types.ts (leaf — no imports)
139: ├── task-status.ts → types.ts
140: ├── state.ts → types.ts
141: ├── helpers.ts → types.ts
142: ├── concurrency.ts (self-contained)
143: ├── completion-detector.ts (self-contained)
144: ├── continuity.ts → types.ts + security/
145: ├── delegation-persistence.ts → types.ts + continuity.ts
146: ├── session-api.ts → helpers.ts
147: ├── runtime.ts → helpers.ts + types.ts
148: ├── notification-handler.ts → helpers.ts
149: ├── category-gates.ts → types.ts
150: ├── category-gate-audit.ts → types.ts
151: ├── runtime-policy.ts → types.ts + category-gates.ts
152: ├── workspace-runtime-policy.ts → (fs-based config loading)
153: ├── session-journal.ts → security/
154: ├── execution-lineage.ts → types.ts + session-journal.ts
155: ├── event-tracker/ → types.ts + writers
156: ├── spawner/ → session-api.ts + concurrency.ts + helpers.ts
157: ├── pty/ → (bun-pty optional)
158: ├── command-delegation.ts → pty/ + helpers.ts
159: ├── sdk-delegation.ts → session-api.ts + helpers.ts
160: ├── app-api.ts → session-api.ts + helpers.ts
161: ├── lifecycle-manager.ts → concurrency + continuity + helpers + session-api + state + types + completion-detector + notification-handler
162: └── delegation-manager.ts → concurrency + delegation-persistence + notification-handler + command-delegation + sdk-delegation + category-gates + category-gate-audit + session-api + runtime-policy + spawner/ + app-api + types
163: ```
164: 
165: **Max chain depth:** 2 levels. `types.ts` changes ripple to most modules.
166: 
167: ### Shared Layer (Cross-Cutting Tool Utilities)
168: - Purpose: Standard tool response envelope and rendering for consistent tool output
169: - Location: `src/shared/`
170: - Files: `tool-response.ts` (success/error/pending envelope with type guards), `tool-helpers.ts` (JSON rendering)
171: - Depends on: Nothing (leaf modules)
172: - Used by: All tool implementations
173: 
174: ### Schema Kernel Layer
175: - Purpose: Zod validation schemas for OpenCode meta-concept validation — agent/command/skill frontmatter, permissions, MCP server configs, prompt-enhance pipeline, config precedence
176: - Location: `src/schema-kernel/`
177: - Files: 9 `.schema.ts` files + `index.ts` barrel
178: - Depends on: `zod` (zod v4)
179: - Used by: `configure-primitive` tool, `validate-restart` tool, config-workflow
180: 
181: ### Soft Meta-Concepts Layer
182: - Purpose: User-configurable OpenCode primitives — agents, skills, commands, rules — compose the runtime behavior from outside the npm package
183: - Location: `.opencode/`
184: - Contains: 89 agents, 123 skills, 18 commands, permission rules, plugin loader
185: - Relationship: Loaded at OpenCode startup; harness tools reference these primitives at runtime
186: 
187: ### Deep Module State Layer (Q6)
188: - Purpose: Internal runtime state persistence — session continuity, delegation records, execution lineage, event tracker artifacts, session journals, state planning
189: - Location: `.hivemind/`
190: - Contains: `state/` (session-continuity.json, delegations.json, config-workflows.json), `event-tracker/`, `journal/`, `lineage/`, `research/`, `archive/`, `cycle2/`, `daily-notes/`
191: - Relationship: Written by `continuity.ts`, `delegation-persistence.ts`, `event-tracker/`, `session-journal.ts`; read at hydration time
192: 
193: ### Entry Points
194: | Entry Point | Location | Triggers | Responsibilities |
195: |-------------|----------|----------|------------------|
196: | Plugin Composition | `src/plugin.ts` | OpenCode plugin loading | Instantiate deps, wire hooks, register 16 tools, load runtime policy, recover pending delegations |
197: | Public API | `src/index.ts` | `import "opencode-harness"` | Re-export `HarnessControlPlane` + entire lib surface |
198: | Plugin subpath | `dist/plugin.js` (via `./plugin` export) | `opencode.json` `"plugin": ["./dist/plugin.js"]` | Thin re-export of `HarnessControlPlane` |
199: 
200: ## Data Flow
201: 
202: ### Primary Request Path: Delegation (WaiterModel)
203: 
204: 1. **Agent invokes `delegate-task` tool** — passes agent name, prompt, title, safetyCeilingMs (`src/tools/delegate-task.ts:42-56`)
205: 2. **Schema validation** — `DelegateTaskInputSchema.parse()` via Zod (`src/tools/delegate-task.ts:43`)
206: 3. **Runtime detection** — checks `context.sessionID` / `OPENCODE_SESSION_ID` for OpenCode context (`src/tools/delegate-task.ts:46-53`)
207: 4. **DelegationManager.dispatch()** — validates agent, resolves category gate, checks depth limit, acquires concurrency slot, builds spawn request (`src/lib/delegation-manager.ts`)
208: 5. **Spawner resolves agent policy** — loads agent `.md` frontmatter, resolves permissions, tools, temperature from primitives (`src/lib/spawner/spawn-request-builder.ts`, `src/lib/spawner/agent-primitive-policy.ts`)
209: 6. **Session creation** — SDK `client.session.create()` with parentID, agent, model, tools, permissions (`src/lib/spawner/session-creator.ts`, `src/lib/session-api.ts:39`)
210: 7. **Prompt dispatch** — SDK `sendPrompt()` sends task prompt to child session (`src/lib/session-api.ts:141`)
211: 8. **Concurrency release** — release queue slot, persist delegation record (`src/lib/delegation-manager.ts`)
212: 9. **Status polling** — agent periodically calls `delegation-status` tool to check completion (`src/tools/delegation-status.ts`)
213: 10. **Completion detection** — `CompletionDetector` watches for `session.idle` events + stability timer (`src/lib/completion-detector.ts`)
214: 11. **Result capture** — messages retrieved via `getSessionMessages()`, result returned as JSON tool response (`src/lib/sdk-delegation.ts`, `src/tools/delegation-status.ts`)
215: 
216: ### Secondary Flow: Background Command Execution (PTY)
217: 
218: 1. Agent invokes `run-background-command` tool with `action: "run"` (`src/tools/run-background-command.ts`)
219: 2. Tool routes to `DelegationManager` → `CommandDelegationHandler` (`src/lib/command-delegation.ts`)
220: 3. PTY session spawned via `PtyManager` (lazy-loaded bun-pty with graceful fallback) (`src/lib/pty/pty-runtime.ts`, `src/lib/pty/pty-manager.ts`)
221: 4. Output polled via `action: "output"`, input sent via `action: "input"`, terminated via `action: "terminate"`
222: 5. Queue-governed dispatch with key-based concurrency
223: 
224: ### Tertiary Flow: Prompt Enhancement Pipeline
225: 
226: 1. Agent invokes `prompt-skim` → fast scan (words, lines, tokens, URLs, file paths, complexity) (`src/tools/prompt-skim/`)
227: 2. Agent invokes `prompt-analyze` → deep analysis (contradictions, vagueness, clarity) (`src/tools/prompt-analyze/`)
228: 3. Agent invokes `session-patch` → apply fixes to session files (`src/tools/session-patch/`)
229: 4. All use shared `ToolResponse<T>` envelope (`success`/`error`/`pending`) from `src/shared/tool-response.ts`
230: 
231: ### Event Observation Flow (Hook Side)
232: 
233: 1. OpenCode emits session lifecycle events (start, idle, error, deleted, compacting, message)
234: 2. `createCoreHooks` → `event` handler routes to `lifecycleManager.handleEvent()` (`src/hooks/create-core-hooks.ts:52-60`)
235: 3. `createSessionHooks` → `event` handler drives auto-loop behavior on `session.idle` (`src/hooks/create-session-hooks.ts`)
236: 4. `createToolGuardHooks` → `tool.execute.before` guards tool calls against budget/tool restrictions; `tool.execute.after` records audit events (`src/hooks/create-tool-guard-hooks.ts`)
237: 5. Plugin event observers → delegation lifecycle tracking (`delegation-session-idle`, `delegation-session-deleted`) and session journey tracking (`src/hooks/plugin-event-observers.ts`)
238: 6. Event tracker → parses hook events, writes artifacts to `.hivemind/event-tracker/` (`src/lib/event-tracker/hook-event.ts`, `src/lib/event-tracker/artifact-writer.ts`)
239: 
240: **State Management:**
241: - Durable state: `continuity.ts` writes `session-continuity.json` to `.hivemind/state/` (canonical per Q6); deep-clone-on-read, normalize-on-write, quarantine-on-corruption
242: - In-memory state: `state.ts` `TaskStateManager` with 4 Maps (rootBudgets, sessionToRoot, sessionStats, sessionDelegationMeta + subagentSessions)
243: - Delegation state: `delegation-persistence.ts` writes `delegations.json` to `.hivemind/state/`
244: - Hydration: `lifecycleManager.hydrateFromContinuity()` at startup
245: 
246: ## Key Abstractions
247: 
248: **RuntimePolicy:**
249: - Purpose: Configurable concurrency limits, tool budgets, category gates — loaded from workspace-level JSON or defaults

(Showing lines 100-249 of 328. Use offset=250 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md"
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

(Showing lines 1-50 of 285. Use offset=51 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/state.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/config"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/cli"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/index.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/index.ts</path>
<type>file</type>
<content>
1: /**
2:  * Schema kernel barrel — re-exports all Zod schemas and inferred types
3:  * for OpenCode meta-concept validation: prompt-enhance pipeline, agent
4:  * frontmatter, command frontmatter, permission rulesets, and skill metadata.
5:  */
6: 
7: import { z } from "zod"
8: 
9: // ---------------------------------------------------------------------------
10: // validateWithFallback — strict-first with graceful unknown-field stripping
11: // ---------------------------------------------------------------------------
12: 
13: /**
14:  * Validates data against a strict schema first. If validation fails ONLY
15:  * due to unrecognized keys, strips them via the lenient schema and returns
16:  * the sanitized data with a warning. Never crashes.
17:  */
18: export function validateWithFallback<T>(
19:   strictSchema: z.ZodSchema<T>,
20:   lenientSchema: z.ZodSchema<T>,
21:   data: unknown,
22:   context: string,
23: ): { success: true; data: T; warnings: string[] } | { success: false; error: z.ZodError } {
24:   const strictResult = strictSchema.safeParse(data)
25:   if (strictResult.success) {
26:     return { success: true, data: strictResult.data, warnings: [] }
27:   }
28: 
29:   // Check if error is ONLY due to unrecognized keys
30:   const issues = strictResult.error.issues
31:   const hasOnlyUnrecognizedKeys = issues.every((issue) =>
32:     issue.message.includes("Unrecognized key") ||
33:     issue.code === "unrecognized_keys",
34:   )
35: 
36:   if (hasOnlyUnrecognizedKeys) {
37:     const lenientResult = lenientSchema.safeParse(data)
38:     if (lenientResult.success) {
39:       const strippedKeys = issues.map((issue) =>
40:         issue.path.join("."),

(Showing lines 1-40 of 377. Use offset=41 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/schema-kernel/AGENTS.md
# Schema Kernel Sector Guidance

**Parent sector:** `src/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — validation-leaf (Zod v4 contracts, no durable writes)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/schema-kernel/` is the Hard Harness validation-contract sector. It owns Zod v4 schemas for OpenCode meta-concepts, permissions, MCP servers, prompt enhancement, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, and trajectory surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/codebase/STRUCTURE.md:114-118`.

## 2. Allowed mutation authority

- Schema files may define and export validation contracts, typed parse results, fallback validation helpers, and barrel exports.
- Schema changes may support tools, config workflow, validation/restart checks, and primitive configuration when paired with consumers. Evidence: `.planning/codebase/ARCHITECTURE.md:195-200`, `.planning/REQUIREMENTS.md:42-56`.
- Schema changes may reject, strip, or warn on invalid structures according to the owning tool or config workflow contract. Evidence: `.planning/codebase/ARCHITECTURE.md:397-401`.

## 3. Forbidden mutations / explicit no-go boundaries

- Schemas SHALL NOT perform durable writes, SDK calls, filesystem state mutation, or command execution.
- Schemas SHALL NOT become hidden runtime feature implementations; they define contracts consumed by tools/lib modules.
- Schemas SHALL NOT introduce `any` on new code or bypass TypeScript strictness. Evidence: `.planning/codebase/CONVENTIONS.md:70-75`.
- Schemas SHALL NOT claim registry/config completeness when consumers are partial or missing. Evidence: `.planning/REQUIREMENTS.md:42-56`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/configure-primitive.ts` and `validate-restart` | Validate primitive and restart contracts | Must handle schema errors through tool responses |
| Config workflow and runtime policy modules | Parse and validate workspace/config contracts | Must own side effects outside the schema |
| Tests | Validate accepted/rejected shapes | Schema tests do not prove runtime integration |
| `.opencode/` primitives | Are validated by schemas where supported | Schema existence is not registry enforcement by itself |

## 5. Naming and placement conventions

- Schema files use `kebab-case.schema.ts`; barrel exports live in `src/schema-kernel/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tests live under `tests/schema-kernel/` and validate real Zod behavior. Evidence: `.planning/codebase/TESTING.md:52-64`, `.planning/codebase/TESTING.md:208-213`.
- Use named exports and ESM `.js` import conventions where imports are needed. Evidence: `.planning/codebase/CONVENTIONS.md:80-98`, `.planning/codebase/CONVENTIONS.md:169-181`.

## 6. Quality gates and evidence expectations

- Schema changes require `npm run typecheck` and scoped `npx vitest run tests/schema-kernel/...` evidence.
- If a schema change claims runtime enforcement, provide consumer evidence from the owning tool/lib module; schema-only proof is insufficient.
- Docs-only edits remain L5 evidence and must not alter readiness status. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/completion/detector.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/coordination/completion/detector.ts</path>
<type>file</type>
<content>
1: export type CompletionSignal = "idle" | "error" | "deleted" | "timeout" | "cancelled"
2: 
3: export type CompletionResult = {
4:   signal: CompletionSignal
5:   sessionID: string
6:   error?: string
7: }
8: 
9: type Watcher = {
10:   resolve: (result: CompletionResult) => void
11:   timeoutId: ReturnType<typeof setTimeout>
12: }
13: 
14: const TERMINAL_EVENTS: Record<string, CompletionSignal> = {
15:   "session.idle": "idle",
16:   "session.error": "error",
17:   "session.deleted": "deleted",
18: }
19: 
20: export class CompletionDetector {
21:   private watchers = new Map<string, Watcher>()
22:   private cachedResults = new Map<string, CompletionResult>()
23:   private messageCounts = new Map<string, number>()
24:   private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()
25: 
26:   constructor(private readonly stabilityTimeoutMs: number = 30000) {}
27: 
28:   feed(eventType: string, sessionID: string | undefined, error?: string): void {
29:     if (!sessionID) {
30:       return
31:     }
32: 
33:     const signal = TERMINAL_EVENTS[eventType]
34:     if (!signal) {
35:       return
36:     }
37: 
38:     const result: CompletionResult = { signal, sessionID }
39:     if (signal === "error" && error) {
40:       result.error = error

(Showing lines 1-40 of 157. Use offset=41 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/coordination/completion/AGENTS.md
# Completion Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/completion/` owns completion detection for delegated child sessions. `detector.ts` provides the CompletionDetector class — it watches session lifecycle events (idle, error, deleted), implements dual-signal completion (message count stability + idle signal), caches terminal results for late watchers, and enforces safety ceiling timeouts. `notification-handler.ts` replays pending parent-session notifications. Source evidence: `.planning/codebase/ARCHITECTURE.md:164-168`, `.planning/codebase/ARCHITECTURE.md:198`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- CompletionDetector may feed events (`session.idle`, `session.error`, `session.deleted`) and resolve watcher promises with `CompletionResult` (signal + sessionID + optional error). Evidence: `.planning/codebase/ARCHITECTURE.md:164-168`.
- CompletionDetector may cache terminal error/deleted results for late watchers. Idle signals are not cached (only delivered to active watchers).
- NotificationHandler may replay undelivered `pendingNotifications` for parent sessions upon `session.created` or `session.updated` events.

## 3. Forbidden mutations / explicit no-go boundaries

- Completion SHALL NOT persist delegation state; that belongs to `src/task-management/continuity/delegation-persistence.ts`.
- Completion SHALL NOT dispatch sessions or manage concurrency; those are DelegationManager responsibilities.
- Completion SHALL NOT register tools or observe lifecycle events directly; hooks route events through injected dependency paths.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/coordination/delegation/` | Awaits completion signals for dispatched sessions | DelegationManager dispatches; CompletionDetector signals finish |
| `src/task-management/lifecycle/` | Injects CompletionDetector for lifecycle-driven detection | Lifecycle manager owns event routing |
| `src/hooks/` | Routes `session.idle/error/deleted` events via lifecycle manager | Hooks observe; detector receives through dependency chain |
| `src/plugin.ts` | Wires CompletionDetector at composition time | Composition root only |

## 5. Naming and placement conventions

- `detector.ts` — CompletionDetector class with `feed()`, `watch()`, `dealias()`, `cleanup()` methods.
- `notification-handler.ts` — pending notification replay logic.
- Tests mirror under `tests/lib/coordination/completion/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/completion/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Completion detection changes must verify dual-signal logic: message stability + idle signal.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/concurrency/queue.ts"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_05_Vdsg6mfOo98SjH0KyUo84754"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/runtime-policy.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/helpers.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/helpers.ts</path>
<type>file</type>
<content>
1: import type { PermissionRule } from "./types.js"
2: 
3: export function isObject(value: unknown): value is Record<string, unknown> {
4:   return !!value && typeof value === "object" && !Array.isArray(value)
5: }
6: 
7: export function getNestedValue(value: unknown, path: string[]): unknown {
8:   let current: unknown = value
9:   for (const key of path) {
10:     if (!isObject(current) || !(key in current)) {
11:       return undefined
12:     }
13:     current = current[key]
14:   }
15:   return current
16: }
17: 
18: /**
19:  * Extract a human-readable error message from OpenCode SDK error objects.
20:  *
21:  * SDK error structures vary — this function checks all known shapes:
22:  *   - String error: used as-is
23:  *   - Named errors (UnknownError, MessageAbortedError): `error.data.message`
24:  *   - BadRequestError: `error.errors[]` array with `.message` or `.reason`
25:  *   - Fallback: includes error name if available
26:  */
27: function extractSdkErrorMessage(error: unknown): string {
28:   if (typeof error === "string") return error
29: 
30:   if (!isObject(error)) return "Unknown SDK error"
31: 
32:   // Shape 1: Named errors — { name: "UnknownError", data: { message: "..." } }
33:   const dataMessage = getNestedValue(error, ["data", "message"])
34:   if (typeof dataMessage === "string" && dataMessage.length > 0) {
35:     return dataMessage
36:   }
37: 
38:   // Shape 2: Validation arrays — { errors: [...] } or { error: [...] }
39:   const validationErrors = [getNestedValue(error, ["errors"]), getNestedValue(error, ["error"])]
40:   for (const errors of validationErrors) {

(Showing lines 1-40 of 295. Use offset=41 to continue.)
</content>
```

