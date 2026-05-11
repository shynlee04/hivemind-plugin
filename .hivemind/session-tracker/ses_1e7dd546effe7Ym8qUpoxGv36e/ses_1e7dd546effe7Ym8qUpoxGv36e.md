---
sessionID: ses_1e7dd546effe7Ym8qUpoxGv36e
created: 2026-05-11T17:43:05.882Z
updated: 2026-05-11T17:43:05.882Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: arch
Today's date: 2026-05-12

Analyze this codebase architecture and directory structure.

Write these documents to .planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions

IMPORTANT: Use 2026-05-12 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo — perform a complete codebase scan.

Explore thoroughly. Write documents directly using templates. Return confirmation only with file paths and line counts when done.

CRITICAL RULES:
1. Use `read`, `write`, `glob`, `grep`, `bash` tools to explore the codebase - do NOT use browser_subagent or Explore agents.
2. Write documents directly to .planning/codebase/ARCHITECTURE.md and .planning/codebase/STRUCTURE.md
3. Return ONLY a confirmation with document paths and line counts.
4. Include actual file paths formatted with backticks in documents.

Project: Hivemind - a runtime composition engine for OpenCode. TypeScript plugin. Key src/ directories: src/shared/, src/task-management/, src/coordination/, src/features/, src/config/, src/routing/, src/hooks/, src/tools/, src/plugin.ts. CQRS architecture with 9-surface model. L0→L1→L2→L3 agent hierarchy across hm-* and hf-* lineages. .opencode/ has 89 agent files, 125 skill directories, 19 commands.

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_eCs26ElTNuJaenXMdCnY8742"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_RDnHsoVfngLMLqEdX6KA2693"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_8UujZZGmvOyt5PwCaCnx0060"
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

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01).  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for src/:** All claims about source structure, module counts, and file locations have been verified against the live `src/` tree. References to `src/lib/` (removed in SR-10) have been updated to current plane paths (shared/, task-management/, coordination/, features/, config/, routing/, hooks/, tools/). `plugin.ts` is at 242 LOC.  
**SR restructuring complete:** SR-0 through SR-10 delivered. The target structure in `.planning/codebase/STRUCTURE.md` is the canonical layout.  
**Next work affecting src/:** CP-PTY-01 (Background Shell Control-Plane MVP) will add/modify `src/features/` and `src/coordination/`. CP-ST-01 (Session Tracker Revamp) will add `src/features/session-tracker/`.

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
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/kernel"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/sidecar"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/lifecycle"
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
81:     if (Number.isNaN(this.concurrencyLimit) || this.concurrencyLimit < 1) {
82:       this.concurrencyLimit = 3
83:     }
84:   }
85: 
86:   getConcurrencyLimit(): number {
87:     return this.concurrencyLimit
88:   }
89: 
90:   /**
91:    * Returns the lifecycle-owned `CompletionDetector` instance.
92:    *
93:    * Phase 36.1 wiring: the SDK delegation polling path consumes cached
94:    * terminal signals (`session.error` / `session.deleted`) and feeds
95:    * message counts back into this detector so message-stability is
96:    * mirrored across both state machines. Exposing the instance — rather
97:    * than a façade — keeps test ergonomics simple: tests can construct
98:    * a real detector, feed it directly, and assert on resulting state
99:    * transitions in the SDK handler.
100:    *
101:    * @returns The lifecycle-owned `CompletionDetector`.
102:    */
103:   getCompletionDetector(): CompletionDetector {
104:     return this.completionDetector
105:   }
106: 
107:   hydrateFromContinuity(): void {
108:     for (const record of listSessionContinuity()) {
109:       if (record.metadata.delegation) {
110:         hydrateDelegationState(record.sessionID, record.metadata.delegation)
111:       }
112:     }
113:   }
114: 
115:   getLifecycleSnapshot(sessionID: string): SessionLifecycleState | undefined {
116:     return getSessionContinuity(sessionID)?.metadata.lifecycle
117:   }
118: 
119:   noteObservedActivity(sessionID: string, source: string): void {
120:     const now = Date.now()
121:     const current = getSessionContinuity(sessionID)
122:     const currentLifecycle = current?.metadata.lifecycle
123:     patchSessionContinuity(sessionID, {
124:       lifecycle: {
125:         phase: currentLifecycle?.phase ?? "running",
126:         ...currentLifecycle,
127:         observation: { source, observedAt: now, detail: `activity noted by ${source}` },
128:       },
129:       lastToolActivityAt: now,
130:     })
131:   }
132: 
133:   handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
134:     const { eventType, sessionID } = args
135:     const properties = (args.event as { properties?: { status?: { type?: string }; error?: unknown } } | undefined)?.properties
136:     const statusSignal = typeof properties?.status?.type === "string" ? properties.status.type : ""
137: 
138:     if (statusSignal === "idle" || eventType === "session.idle") {
139:       this.completionDetector.feed("session.idle", sessionID)
140:     }
141: 
142:     // Phase 36.1 R-COMPLETION-DETECTOR-04: feed every terminal session event
143:     // into the detector, not just `session.idle`. Until this wiring landed,
144:     // the detector cached only idle signals while error/deleted events were
145:     // observed by `delegation-event-observer.ts` and dispatched directly to
146:     // the delegation manager — meaning the detector's "did this session
147:     // terminate?" answer was incomplete. Now any consumer (including the
148:     // SDK polling loop) can drain the cached result and react truthfully.
149:     if (statusSignal === "error" || eventType === "session.error") {
150:       const errorMessage = typeof properties?.error === "string"
151:         ? properties.error
152:         : properties?.error instanceof Error
153:           ? properties.error.message
154:           : undefined
155:       this.completionDetector.feed("session.error", sessionID, errorMessage)
156:     }
157: 
158:     if (eventType === "session.deleted") {
159:       this.completionDetector.feed("session.deleted", sessionID)
160:     }
161:   }
162: 
163:   /**
164:    * Replays queued parent-session notifications from the explicit write-side manager boundary.
165:    *
166:    * @param sessionID - Parent session observed by an OpenCode lifecycle event.
167:    * @param eventType - OpenCode event type that may authorize replay.
168:    */
169:   async replayPendingNotificationsForEvent(sessionID: string, eventType: string): Promise<void> {
170:     const continuity = getSessionContinuity(sessionID)
171:     const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
172:     if (pendingNotifications.length === 0) {
173:       return
174:     }
175: 
176:     const shouldReplay =
177:       (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
178:       eventType === "session.updated"
179: 
180:     if (!shouldReplay) {
181:       return
182:     }
183: 
184:     try {
185:       const delivered = await replayPendingNotifications(this.client, sessionID, pendingNotifications)
186:       if (delivered) {
187:         patchSessionContinuity(sessionID, { pendingNotifications: [] })
188:       }
189:     } catch {
190:       // Best-effort replay: keep queued notifications for the next parent event.
191:     }
192:   }
193: 
194:   async cancelDelegatedSession(sessionID: string): Promise<void> {
195:     try {
196:       await abortSession(this.client, sessionID)
197:     } catch {
198:       // Abort best-effort
199:     }
200: 
201:     this.completionDetector.cancel(sessionID)
202:     patchSessionContinuity(sessionID, {
203:       lifecycle: {
204:         phase: "failed",
205:         error: "Session cancelled by user",
206:       },
207:     })
208:   }
209: 
210:   async requestAutoLoopRetry(args: { sessionID: string; promptText: string }): Promise<void> {
211:     await sendPrompt(this.client, args.sessionID, {
212:       parts: [{ type: "text", text: args.promptText }],
213:     })
214:   }
215: 
216:   recordCompactionCheckpoint(sessionID: string, checkpoint: CheckpointData): void {
217:     patchSessionContinuity(sessionID, { compactionCheckpoint: checkpoint })
218:     taskState.resetStats(sessionID)
219:   }
220: 
221:   async launchDelegatedSession(args: LaunchDelegatedSessionArgs): Promise<string> {
222:     if (!this.delegationManager) {
223:       throw new Error("[Harness] DelegationManager is required for launchDelegatedSession facade")
224:     }
225: 
226:     const result = await this.delegationManager.dispatch({
227:       parentSessionId: args.parentSessionID ?? args.sessionID,
228:       agent: args.agent,
229:       prompt: args.promptText,
230:       title: args.description,
231:       category: args.category,
232:       model: args.model,
233:     })
234: 
235:     return result.delegationId
236:   }
237: }
238: 
239: export function createHarnessLifecycleManager(
240:   options: HarnessLifecycleManagerOptions,
241: ): HarnessLifecycleManager {
242:   return new HarnessLifecycleManager(options)
243: }

(End of file - total 243 lines)
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
51:  * Build the OpenCode prompt-time tool map for delegated sessions.
52:  *
53:  * @param allowedTools - Tool IDs inherited from the resolved spawn policy.
54:  * @returns A prompt-compatible tool allow/ask map with recursive delegation disabled.
55:  */
56: function buildDelegationPromptTools(allowedTools: readonly string[]): Record<string, boolean> {
57:   return {
58:     ...Object.fromEntries(allowedTools.map((toolName) => [toolName, true])),
59:     "delegate-task": false,
60:     task: false,
61:   }
62: }
63: 
64: /**
65:  * Public dispatch + concurrency entry point for SDK and command delegations.
66:  *
67:  * In-memory storage, terminal-state transitions, timer machinery, and pruning
68:  * live in {@link DelegationStateMachine} (see `delegation-state-machine.ts`).
69:  * `DelegationManager` composes one instance and forwards reads/writes through
70:  * it, keeping this module focused on dispatch, concurrency, agent validation,
71:  * and recovery wiring.
72:  */
73: export class DelegationManager {
74:   private readonly state: DelegationStateMachine
75:   private readonly semaphore = new DelegationConcurrencyQueue()
76:   private readonly commandHandler: CommandDelegationHandler
77:   private readonly sdkHandler: SdkDelegationHandler
78:   private readonly runtimePolicy: RuntimePolicy
79:   private completionDetector: CompletionDetector | undefined
80: 
81:   constructor(
82:     private readonly client: OpenCodeClient,
83:     options: { ptyManager?: PtyManager | null; runtimePolicy?: RuntimePolicy } = {},
84:   ) {
85:     this.runtimePolicy = options.runtimePolicy ?? DEFAULT_MANAGER_RUNTIME_POLICY
86:     this.state = new DelegationStateMachine({
87:       client,
88:       clearExternalTimers: (id) => {
89:         this.sdkHandler.clearTimers(id)
90:         this.commandHandler.clearTimers(id)
91:       },
92:     })
93:     const dm = this
94:     this.commandHandler = new CommandDelegationHandler(options.ptyManager ?? null, {
95:       getDelegation: (id) => dm.state.get(id),
96:       registerDelegation: (d, s) => dm.state.registerDelegation(d, s),
97:       persistAllDelegations: () => dm.state.persistAll(),
98:       buildResult: (d) => buildDelegationResult(d),
99:       cleanupTracking: (id, sid) => dm.state.cleanupTracking(id, sid),
100:       onTerminal: (id, terminalState, err, terminalDetail) => dm.state.transitionToTerminal(id, terminalState, err, terminalDetail),
101:     })
102:     this.sdkHandler = new SdkDelegationHandler(client, {
103:       getDelegation: (id) => dm.state.get(id),
104:       persistAllDelegations: () => dm.state.persistAll(),
105:       cleanupTracking: (id, sid) => dm.state.cleanupTracking(id, sid),
106:       scheduleSafetyCeiling: (d) => dm.state.scheduleSafetyCeiling(d),
107:       onSessionIdle: (sid) => dm.handleSessionIdle(sid),
108:       onTerminal: (id, terminalState, err) => dm.state.transitionToTerminal(id, terminalState, err),
109:       // Phase 36.1 R-COMPLETION-DETECTOR-05: lazy accessor avoids the
110:       // circular construction order in plugin.ts (lifecycle manager is
111:       // built *after* DelegationManager and *takes* DelegationManager as
112:       // an arg). The plugin sets the detector via setCompletionDetector()
113:       // once the lifecycle manager exists.
114:       getCompletionDetector: () => dm.completionDetector,
115:     })
116:   }
117: 
118:   /**
119:    * Wires the lifecycle-owned `CompletionDetector` after construction.
120:    *
121:    * Phase 36.1: invoked from the plugin composition root once the
122:    * lifecycle manager has been instantiated, completing the dual-signal
123:    * completion path. Idempotent — later calls overwrite the previous
124:    * reference, which is safe because the detector is treated as a
125:    * lifelong singleton owned by the lifecycle manager.
126:    *
127:    * @param detector - The lifecycle-owned detector instance.
128:    */
129:   setCompletionDetector(detector: CompletionDetector): void {
130:     this.completionDetector = detector
131:   }
132: 
133:   /**
134:    * Applies behavioral profile guardrail to concurrency.
135:    * Only TIGHTENS — never loosens beyond workspace runtime policy.
136:    *
137:    * **API surface for Phase WS-4** (auto-intent/workflow router): This method
138:    * is intentionally NOT called from `dispatch()` yet. The WS-4 phase will wire
139:    * the resolved behavioral profile into the dispatch path, calling this method
140:    * to adjust concurrency limits before `semaphore.acquire()`. Until then, the
141:    * method is exposed so the integration surface exists and is tested.
142:    *
143:    * @param guardrailLevel - The behavioral guardrail level from the resolved profile
144:    * @returns Adjusted concurrency limit (undefined = no adjustment)
145:    * @see D-12 in CA-02-CONTEXT.md
146:    */
147:   applyBehavioralGuardrail(guardrailLevel: BehavioralOverrides["guardrailLevel"]): number | undefined {
148:     if (guardrailLevel === "strict") {
149:       // strict: cap concurrent delegations to 1
150:       return 1
151:     }
152:     // moderate, minimal: no adjustment — respect runtime policy as-is
153:     return undefined
154:   }
155: 
156:   private resolveNestingDepth(parentSessionId: string): number {
157:     const parentDelegationId = this.state.getDelegationIdForSession(parentSessionId)
158:     if (!parentDelegationId) return 1
159:     const parentDelegation = this.state.get(parentDelegationId)
160:     return (parentDelegation?.nestingDepth ?? 0) + 1
161:   }
162: 
163:   async dispatch(params: DelegateParams): Promise<DelegationResult> {
164:     // CA-03: parallelization toggle gate (D-14)
165:     // When false, delegations are sequential — concurrency limit clamped to 1.
166:     const config = getCachedConfig()
167:     const parallelizationEnabled = config.parallelization
168: 
169:     const nestingDepth = this.resolveNestingDepth(params.parentSessionId)
170:     if (nestingDepth > MAX_DELEGATION_DEPTH) {
171:       throw new Error(
172:         `[Harness] Maximum delegation nesting depth (${MAX_DELEGATION_DEPTH}) exceeded. ` +
173:         `Current depth: ${nestingDepth}. Use result retrieval pattern instead of further delegation.`,
174:       )
175:     }
176:     const workingDirectory = resolveParentWorkingDirectory({
177:       contextDirectory: params.workingDirectory,
178:       worktree: params.worktree,
179:     })
180:     const agent = await this.validateAgent(params.agent, workingDirectory)
181:     const permissionProfile = resolveDelegationPermissionProfile(params, agent)
182:     const requestedCategory = params.category ?? agent.category
183:     const categoryDecision = resolveCategoryGateDecision({
184:       category: requestedCategory,
185:       surface: "agent-delegation",
186:       toolProfileMode: permissionProfile.mode,
187:       policy: this.runtimePolicy.categoryGate,
188:     })
189:     if (!categoryDecision.allowed) {
190:       recordCategoryGateask({
191:         callerSessionId: params.parentSessionId,
192:         requestedAgent: agent.name,
193:         requestedCategory,
194:         surface: "agent-delegation",
195:         askReason: categoryDecision.reason,
196:       })
197:       throw new Error(`[Harness] Category gate denied: ${categoryDecision.reason}`)
198:     }
199:     const canonicalContext = this.buildCanonicalQueueContext(agent, params)
200:     const acquireQueueKey = buildDelegationQueueKey(canonicalContext)
201:     const spawnQueueKey = resolveDelegationConcurrencyKey(canonicalContext)
202:     if (spawnQueueKey !== acquireQueueKey) {
203:       throw new Error("[Harness] Canonical delegation queue-key drift detected.")
204:     }
205:     const concurrency = resolveAcquireArgs(this.runtimePolicy, acquireQueueKey)
206:     // CA-03 (D-14): When parallelization is false, force sequential dispatch
207:     const effectiveLimit = parallelizationEnabled ? concurrency.limit : 1
208:     const release = await this.semaphore.acquire(acquireQueueKey, effectiveLimit, concurrency.acquireTimeoutMs)
209:     try {
210:       const child = await spawnDelegatedSession({
211:         client: this.client as never,
212:         request: buildSdkSpawnRequest(params, agent, workingDirectory),
213:       })
214: 
215:       const delegation: Delegation = {
216:         id: crypto.randomUUID(),
217:         parentSessionId: params.parentSessionId,
218:         childSessionId: child.childSessionId,
219:         agent: agent.name,
220:         status: "dispatched",
221:         createdAt: Date.now(),
222:         safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
223:         lastMessageCount: 0,
224:         stablePollCount: 0,
225:         lastMessageCountChangeAt: Date.now(),
226:         nestingDepth,
227:         executionMode: "sdk",
228:         workingDirectory,
229:         queueKey: acquireQueueKey,
230:       }
231:       this.state.registerDelegation(delegation, true)
232:       this.state.persistAll()
233:       try {
234:         const promptBody = {
235:           parts: [{ type: "text", text: params.prompt }],
236:           agent: agent.name,
237:           tools: buildDelegationPromptTools(child.allowedTools),
238:         }
239:         // Phase 46.1 R-ALWAYS-ASYNC-01..03 (audit 2026-04-30, Finding 3
240:         // VALIDATED): always dispatch the child via sendPromptAsync. The
241:         // previous code branched on
242:         //   this.runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions
243:         // and silently downgraded to the synchronous sendPrompt path when
244:         // the flag was false — including the *default* policy case. That
245:         // turned every "background" delegation into a foreground call that
246:         // blocked the parent until the child responded, which is the
247:         // opposite of what `run_in_background: true` is supposed to mean.
248:         // The legacy flag is kept on RuntimePolicy for backwards-compat
249:         // with on-disk policy YAML, but is no longer consulted here.
250:         await sendPromptAsync(this.client, delegation.childSessionId, promptBody)
251:         this.state.transition(delegation.id, "running")
252:       } catch {
253:         this.state.transitionToTerminal(delegation.id, "error", "Failed to send prompt to child session")
254:         return buildDelegationResult(this.state.get(delegation.id) ?? delegation)
255:       }
256:       return buildDelegationResult(this.state.get(delegation.id) ?? delegation)
257:     } finally {
258:       release()
259:     }
260:   }
261: 
262:   async dispatchCommand(params: CommandDelegationParams): Promise<DelegationResult> {
263:     const nestingDepth = this.resolveNestingDepth(params.parentSessionId)
264:     if (nestingDepth > MAX_DELEGATION_DEPTH) {
265:       throw new Error(
266:         `[Harness] Maximum delegation nesting depth (${MAX_DELEGATION_DEPTH}) exceeded. ` +
267:         `Current depth: ${nestingDepth}. Use result retrieval pattern instead of further delegation.`,
268:       )
269:     }
270:     const queueContext = this.buildCommandQueueContext(params)
271:     const categoryDecision = resolveCategoryGateDecision({
272:       category: "command",
273:       surface: "command-process",
274:       toolProfileMode: "write-capable",
275:       policy: this.runtimePolicy.categoryGate,
276:     })
277:     if (!categoryDecision.allowed) {
278:       recordCategoryGateask({
279:         callerSessionId: params.parentSessionId,
280:         requestedAgent: queueContext.agent,
281:         requestedCategory: "command",
282:         surface: "command-process",
283:         askReason: categoryDecision.reason,
284:       })
285:       throw new Error(`[Harness] Category gate denied: ${categoryDecision.reason}`)
286:     }
287:     const queueKey = buildDelegationQueueKey(queueContext)
288:     const concurrency = resolveAcquireArgs(this.runtimePolicy, queueKey)
289:     const release = await this.semaphore.acquire(queueKey, concurrency.limit, concurrency.acquireTimeoutMs)
290:     try {
291:       return await this.commandHandler.dispatchCommand(params, queueKey, nestingDepth)
292:     } finally {
293:       release()
294:     }
295:   }
296: 
297:   handleSessionIdle(sessionId: string): void {
298:     const delegationId = this.state.getDelegationIdForSession(sessionId)
299:     if (!delegationId) return
300:     const delegation = this.state.get(delegationId)
301:     if (!delegation || delegation.executionMode !== "sdk") return
302:     if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") return
303:     if (delegation.status === "dispatched") {
304:       this.state.transition(delegationId, "running")
305:     }
306:     if (!this.sdkHandler.isPolling(delegationId)) {
307:       this.sdkHandler.scheduleStabilityPoll(delegationId)
308:     }
309:   }
310: 
311:   handleSessionDeleted(sessionId: string): void {
312:     const delegationId = this.state.getDelegationIdForSession(sessionId)
313:     if (!delegationId) return
314:     const delegation = this.state.get(delegationId)
315:     if (!delegation) {
316:       this.state.cleanupTracking(delegationId, sessionId)
317:       return
318:     }
319:     this.state.transitionToTerminal(delegationId, "error", "Delegated session deleted before completion")
320:   }
321: 
322:   async recoverPending(): Promise<void> {
323:     for (const persistedDelegation of readPersistedDelegations()) {
324:       const delegation = { ...persistedDelegation }
325:       this.state.hydrateFromPersistence(delegation)
326:       if (delegation.status !== "running" && delegation.status !== "dispatched") continue
327:       if (delegation.executionMode === "sdk") {
328:         this.state.trackSession(delegation.childSessionId, delegation.id)
329:         await this.sdkHandler.recoverSdkDelegation(delegation)
330:         continue
331:       }
332:       if (delegation.executionMode === "pty" && delegation.ptySessionId) {
333:         this.commandHandler.recoverPtyDelegation(delegation)
334:         continue
335:       }
336:       this.state.transitionToTerminal(
337:         delegation.id,
338:         "error",
339:         "[Harness] Headless command delegation cannot be recovered after restart",
340:         {
341:           terminalKind: "non-resumable-after-restart",
342:           explicitCancellation: false,
343:         },
344:       )
345:     }
346:   }
347: 
348:   getStatus(delegationId: string): Delegation | undefined {
349:     return this.state.get(delegationId)
350:   }
351: 
352:   getAllDelegations(): Delegation[] {
353:     return this.state.getAll()
354:   }
355: 
356:   /**
357:    * Check whether a caller session is in the recorded owner lineage for a delegation.
358:    *
359:    * @param callerSessionId - Session ID from the current OpenCode tool context.
360:    * @param delegation - Target delegation record from memory or persisted storage.
361:    * @returns True only for direct owners or explicitly recorded parent/child lineage.
362:    */
363:   canSessionAccessDelegation(callerSessionId: string | undefined, delegation: Delegation | undefined): boolean {
364:     if (!callerSessionId || !delegation) {
365:       return false
366:     }
367:     if (delegation.parentSessionId === callerSessionId) {
368:       return true
369:     }
370: 
371:     const recordedDelegationId = this.state.getDelegationIdForSession(callerSessionId)
372:     if (!recordedDelegationId) {
373:       return false
374:     }
375:     if (recordedDelegationId === delegation.id) {
376:       return true
377:     }
378: 
379:     const recordedDelegation = this.state.get(recordedDelegationId)
380:     if (!recordedDelegation) {
381:       return false
382:     }
383: 
384:     return recordedDelegation.parentSessionId === delegation.childSessionId
385:       || recordedDelegation.childSessionId === delegation.parentSessionId
386:   }
387: 
388:   /**
389:    * Return only active delegations visible to the caller's recorded lineage.
390:    *
391:    * @param callerSessionId - Session ID from the current OpenCode tool context.
392:    * @returns In-memory delegation records visible to that caller.
393:    */
394:   getVisibleDelegationsForSession(callerSessionId: string): Delegation[] {
395:     return this.state.getAll().filter((delegation) => this.canSessionAccessDelegation(callerSessionId, delegation))
396:   }
397: 
398:   /**
399:    * Find the active delegation that owns a PTY session ID.
400:    *
401:    * @param ptySessionId - PTY session ID from `run-background-command` input.
402:    * @returns The backing delegation when the PTY session is recorded.
403:    */
404:   getDelegationForPtySession(ptySessionId: string): Delegation | undefined {
405:     return this.state.findByPtySession(ptySessionId)
406:   }
407: 
408:   /**
409:    * Mark a delegation as user-cancelled via its PTY session id and return its
410:    * resulting {@link DelegationResult}, or `undefined` when the PTY session is
411:    * not recognised.
412:    */
413:   markCommandCancellationForPtySession(ptySessionId: string): DelegationResult | undefined {
414:     return this.state.markCommandCancellationForPtySession(ptySessionId)
415:   }
416: 
417:   /**
418:    * Remove terminal delegations older than `maxAgeMs` from the in-memory store
419:    * and re-persist. Forwarded to {@link DelegationStateMachine.pruneCompletedDelegations}.
420:    */
421:   pruneCompletedDelegations(maxAgeMs?: number): number {
422:     return this.state.pruneCompletedDelegations(maxAgeMs)
423:   }
424: 
425:   private async validateAgent(agent: string, projectRoot: string): Promise<ValidatedAgent> {
426:     let agents: Array<Record<string, unknown>> | undefined
427: 
428:     try {
429:       agents = (await getAppAgents(this.client)).filter(
430:         (entry): entry is Record<string, unknown> => !!entry && typeof entry === "object" && !Array.isArray(entry),
431:       )
432:     } catch (error) {
433:       // R-AGENT-01: OpenCode server's /agent endpoint occasionally returns agents
434:       // with missing required string fields, causing SDK Zod validation errors
435:       // ("expected string, received undefined"). We gracefully degrade to
436:       // unvalidated agent acceptance rather than blocking all delegation.
437:       const message = error instanceof Error ? error.message : String(error)
438:       if (message.includes("expected string, received undefined")) {
439:         console.warn(
440:           `[Harness] Agent list validation skipped — server returned agents with missing fields. Proceeding with unvalidated agent "${agent}".`,
441:         )
442:         return enrichAgentFromPrimitives({ name: agent }, projectRoot)
443:       }
444:       throw error
445:     }
446: 
447:     const validAgents = (agents ?? []).map((e) => ({
448:       name: typeof e.name === "string" ? e.name : "",
449:       provider: typeof e.provider === "string" ? e.provider : undefined,
450:       model: typeof e.model === "string" ? e.model : undefined,
451:       category: typeof e.category === "string" ? e.category : undefined,
452:       description: typeof e.description === "string" ? e.description : undefined,
453:       permission: parsePermissionRecord(e.permission),
454:       tools: parseToolBooleans(e.tools),
455:     })).filter((e) => e.name.length > 0)
456:     const names = validAgents.map((e) => e.name)
457:     if (!names.includes(agent)) {
458:       throw new Error(`[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
459:     }
460:     return enrichAgentFromPrimitives(validAgents.find((e) => e.name === agent) ?? { name: agent }, projectRoot)
461:   }
462: 
463:   private buildCanonicalQueueContext(agent: ValidatedAgent, params: DelegateParams): QueueContext {
464:     return {
465:       provider: params.provider ?? agent.provider,
466:       model: params.model ?? agent.model,
467:       agent: agent.name,
468:       category: params.category ?? agent.category,
469:     }
470:   }
471: 
472:   private buildCommandQueueContext(params: CommandDelegationParams): QueueContext {
473:     return {
474:       provider: params.queueContext?.provider,
475:       model: params.queueContext?.model,
476:       agent: params.queueContext?.agent,
477:       category: params.queueContext?.category ?? "command",
478:     }
479:   }
480: 
481:   /** @internal Test compatibility — proxies to SdkDelegationHandler's timer map */
482:   get stabilityTimers(): Map<string, NodeJS.Timeout> {
483:     return this.sdkHandler.getTimerMap()
484:   }
485: 
486:   /** @internal Test compatibility — proxies to the underlying state machine's delegation map */
487:   get delegations(): Map<string, Delegation> {
488:     return this.state.delegations
489:   }
490: 
491:   /** @internal Test compatibility — proxies to the underlying state machine's session map */
492:   get delegationsBySession(): Map<string, string> {
493:     return this.state.delegationsBySession
494:   }
495: 
496:   /** @internal Test compatibility — proxies to the underlying state machine's safety timer map */
497:   get safetyTimers(): Map<string, NodeJS.Timeout> {
498:     return this.state.safetyTimers
499:   }
500: }

(End of file - total 500 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/hooks/lifecycle/core-hooks.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/completion"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/concurrency"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/spawner"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/sdk-delegation"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/command-delegation"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/continuity"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/journal"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/trajectory"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/task-management/recovery"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/bootstrap"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/doc-intelligence"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/runtime-pressure"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/sdk-supervisor"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/agent-work-contracts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/background-command"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/config/workflow"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/cli"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_QkRILARGZNOOaKZbM5FG2880"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/state.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/state.ts</path>
<type>file</type>
<content>
1: import type { DelegationMeta, RootBudget, SessionStats } from "./types.js"
2: 
3: // ---------------------------------------------------------------------------
4: // TaskStateManager — encapsulates all in-process session/budget state.
5: // New for V3: also tracks the subagent registry (OMO Pattern 10).
6: // ---------------------------------------------------------------------------
7: 
8: export class TaskStateManager {
9:   private readonly rootBudgets = new Map<string, RootBudget>()
10:   private readonly sessionToRoot = new Map<string, string>()
11:   private readonly sessionStats = new Map<string, SessionStats>()
12:   private readonly sessionDelegationMeta = new Map<string, DelegationMeta>()
13:   private readonly subagentSessions = new Map<string, Set<string>>()
14: 
15:   // -------------------------------------------------------------------------
16:   // Session stats
17:   // -------------------------------------------------------------------------
18: 
19:   ensureStats(sessionID: string): SessionStats {
20:     let stats = this.sessionStats.get(sessionID)
21:     if (!stats) {
22:       stats = {
23:         total: 0,
24:         byTool: {},
25:         loop: { signature: "", count: 0 },
26:         warnings: [],
27:       }
28:       this.sessionStats.set(sessionID, stats)
29:     }
30:     return stats
31:   }
32: 
33:   getStats(sessionID: string): SessionStats | undefined {
34:     return this.sessionStats.get(sessionID)
35:   }
36: 
37:   addWarning(sessionID: string, warning: string): void {
38:     const stats = this.ensureStats(sessionID)
39:     if (stats.warnings.length < 25) {
40:       stats.warnings.push(warning)
41:     }
42:   }
43: 
44:   resetStats(sessionID: string): SessionStats {
45:     const stats = this.ensureStats(sessionID)
46:     stats.total = 0
47:     stats.byTool = {}
48:     stats.loop = { signature: "", count: 0 }
49:     stats.warnings = []
50:     return stats
51:   }
52: 
53:   // -------------------------------------------------------------------------
54:   // Root budget tracking
55:   // -------------------------------------------------------------------------
56: 
57:   private ensureRootBudget(rootID: string): RootBudget {
58:     let budget = this.rootBudgets.get(rootID)
59:     if (!budget) {
60:       budget = {
61:         descendants: new Set<string>(),
62:         reserved: 0,
63:       }
64:       this.rootBudgets.set(rootID, budget)
65:     }
66:     return budget
67:   }
68: 
69:   getRootBudget(rootID: string): RootBudget | undefined {
70:     return this.rootBudgets.get(rootID)
71:   }
72: 
73:   reserveDescendant(rootID: string, maxDescendantsPerRoot: number): number {
74:     const budget = this.ensureRootBudget(rootID)
75:     const total = budget.descendants.size + budget.reserved
76:     if (total >= maxDescendantsPerRoot) {
77:       throw new Error(
78:         `[Harness] Root session ${rootID} exceeded descendant budget (${maxDescendantsPerRoot})`
79:       )
80:     }
81:     budget.reserved += 1
82:     return total + 1
83:   }
84: 
85:   commitDescendant(rootID: string, sessionID: string): number {
86:     const budget = this.ensureRootBudget(rootID)
87:     budget.reserved = Math.max(0, budget.reserved - 1)
88:     budget.descendants.add(sessionID)
89:     this.sessionToRoot.set(sessionID, rootID)
90:     return budget.descendants.size + budget.reserved
91:   }
92: 
93:   rollbackReservation(rootID: string): void {
94:     const budget = this.rootBudgets.get(rootID)
95:     if (!budget) {
96:       return
97:     }
98:     budget.reserved = Math.max(0, budget.reserved - 1)
99:   }
100: 
101:   // -------------------------------------------------------------------------
102:   // Session-to-root mapping
103:   // -------------------------------------------------------------------------
104: 
105:   setSessionRoot(sessionID: string, rootID: string): void {
106:     this.sessionToRoot.set(sessionID, rootID)
107:   }
108: 
109:   getSessionRoot(sessionID: string): string | undefined {
110:     return this.sessionToRoot.get(sessionID)
111:   }
112: 
113:   inheritRootFromParent(sessionID: string, parentID: string): void {
114:     const rootID = this.sessionToRoot.get(parentID) ?? parentID
115:     this.sessionToRoot.set(sessionID, rootID)
116:   }
117: 
118:   // -------------------------------------------------------------------------
119:   // Delegation metadata
120:   // -------------------------------------------------------------------------
121: 
122:   getDelegationMeta(sessionID: string): DelegationMeta | undefined {
123:     return this.sessionDelegationMeta.get(sessionID)
124:   }
125: 
126:   setDelegationMeta(sessionID: string, meta: DelegationMeta): void {
127:     this.sessionDelegationMeta.set(sessionID, meta)
128:   }
129: 
130:   hydrateDelegationState(sessionID: string, meta: DelegationMeta): void {
131:     this.sessionDelegationMeta.set(sessionID, meta)
132:     this.sessionToRoot.set(sessionID, meta.rootID)
133:     const budget = this.ensureRootBudget(meta.rootID)
134:     budget.descendants.add(sessionID)
135:   }
136: 
137:   // -------------------------------------------------------------------------
138:   // Subagent registry (OMO Pattern 10)
139:   // -------------------------------------------------------------------------
140: 
141:   registerSubagent(parentID: string, childID: string): void {
142:     let children = this.subagentSessions.get(parentID)
143:     if (!children) {
144:       children = new Set<string>()
145:       this.subagentSessions.set(parentID, children)
146:     }
147:     children.add(childID)
148:   }
149: 
150:   getSubagents(parentID: string): Set<string> {
151:     return this.subagentSessions.get(parentID) ?? new Set<string>()
152:   }
153: 
154:   // -------------------------------------------------------------------------
155:   // Cleanup
156:   // -------------------------------------------------------------------------
157: 
158:   forgetSession(sessionID: string): void {
159:     this.sessionStats.delete(sessionID)
160:     this.sessionDelegationMeta.delete(sessionID)
161:     const rootID = this.sessionToRoot.get(sessionID)
162:     if (rootID) {
163:       const budget = this.rootBudgets.get(rootID)
164:       if (budget) {
165:         budget.descendants.delete(sessionID)
166:         if (budget.descendants.size === 0 && budget.reserved === 0) {
167:           this.rootBudgets.delete(rootID)
168:         }
169:       }
170:     }
171:     this.sessionToRoot.delete(sessionID)
172:     this.subagentSessions.delete(sessionID)
173:   }
174: 
175:   clear(): void {
176:     this.rootBudgets.clear()
177:     this.sessionToRoot.clear()
178:     this.sessionStats.clear()
179:     this.sessionDelegationMeta.clear()
180:     this.subagentSessions.clear()
181:   }
182: }
183: 
184: // ---------------------------------------------------------------------------
185: // Singleton — shared process-wide state store
186: // ---------------------------------------------------------------------------
187: 
188: export const taskState = new TaskStateManager()
189: 
190: // ---------------------------------------------------------------------------
191: // Backward-compatible wrapper functions (thin delegation to singleton)
192: // All existing callers continue to work unchanged.
193: // ---------------------------------------------------------------------------
194: 
195: export function ensureSessionStats(sessionID: string): SessionStats {
196:   return taskState.ensureStats(sessionID)
197: }
198: 
199: export function getSessionStats(sessionID: string): SessionStats | undefined {
200:   return taskState.getStats(sessionID)
201: }
202: 
203: export function addWarning(sessionID: string, warning: string): void {
204:   taskState.addWarning(sessionID, warning)
205: }
206: 
207: export function reserveDescendant(
208:   rootID: string,
209:   maxDescendantsPerRoot: number
210: ): number {
211:   return taskState.reserveDescendant(rootID, maxDescendantsPerRoot)
212: }
213: 
214: export function commitDescendant(rootID: string, sessionID: string): number {
215:   return taskState.commitDescendant(rootID, sessionID)
216: }
217: 
218: export function rollbackReservation(rootID: string): void {
219:   taskState.rollbackReservation(rootID)
220: }
221: 
222: export function forgetSession(sessionID: string): void {
223:   taskState.forgetSession(sessionID)
224: }
225: 
226: export function getDelegationMeta(
227:   sessionID: string
228: ): DelegationMeta | undefined {
229:   return taskState.getDelegationMeta(sessionID)
230: }
231: 
232: export function setDelegationMeta(
233:   sessionID: string,
234:   meta: DelegationMeta
235: ): void {
236:   taskState.setDelegationMeta(sessionID, meta)
237: }
238: 
239: export function hydrateDelegationState(
240:   sessionID: string,
241:   meta: DelegationMeta
242: ): void {
243:   taskState.hydrateDelegationState(sessionID, meta)
244: }
245: 
246: export function inheritRootFromParent(
247:   sessionID: string,
248:   parentID: string
249: ): void {
250:   taskState.inheritRootFromParent(sessionID, parentID)
251: }

(End of file - total 251 lines)
</content>
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/runtime-policy.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/runtime-policy.ts</path>
<type>file</type>
<content>
1: /**
2:  * Runtime policy module — single seam for Phase 02 runtime configuration.
3:  *
4:  * Provides:
5:  *  - DEFAULT_RUNTIME_POLICY: hardcoded defaults matching current production
6:  *  - loadRuntimePolicy: validate and merge workspace-level policy
7:  *  - getRuntimePolicyForSession: resolve per-session overrides
8:  *
9:  * RESEARCH D-16 (built-in-first):
10:  * OpenCode already provides hook/session surfaces for tool budgets, loop
11:  * detection, and retry resolution. This policy layer ONLY supplements the
12:  * missing per-key concurrency and per-session threshold behavior. It does
13:  * NOT replace or duplicate OpenCode-native enforcement.
14:  */
15: import type {
16:   BudgetPolicy,
17:   CategoryGatePolicy,
18:   ConcurrencyPolicy,
19:   ResolvedBudgetPolicy,
20:   RuntimePolicy,
21:   SessionPolicyOverride,
22:   TrustedRuntimePolicy,
23: } from "./types.js"
24: import { DEFAULT_CATEGORY_GATE_POLICY } from "../coordination/delegation/category-gates.js"
25: 
26: // ---------------------------------------------------------------------------
27: // Default policy — mirrors current production constants
28: // ---------------------------------------------------------------------------
29: 
30: export const DEFAULT_RUNTIME_POLICY: RuntimePolicy = {
31:   concurrency: {
32:     globalLimit: 3,
33:   },
34:   budget: {
35:     maxToolCallsPerSession: 400,
36:     repeatedSignatureThreshold: 16,
37:     warningCap: 25,
38:     resetOnCompact: true,
39:   },
40:   trustedRuntime: {
41:     builtinAsyncBackgroundChildSessions: false,
42:   },
43:   categoryGate: DEFAULT_CATEGORY_GATE_POLICY,
44: }
45: 
46: // ---------------------------------------------------------------------------
47: // Validation helpers
48: // ---------------------------------------------------------------------------
49: 
50: function validateConcurrencyPolicy(policy: ConcurrencyPolicy): void {
51:   if (policy.globalLimit <= 0) {
52:     throw new Error(
53:       `[Harness] Invalid concurrency policy: globalLimit must be positive, got ${policy.globalLimit}.`,
54:     )
55:   }
56:   if (policy.perKey) {
57:     for (const [key, perKey] of Object.entries(policy.perKey)) {
58:       if (perKey.limit <= 0) {
59:         throw new Error(
60:           `[Harness] Invalid concurrency policy: per-key limit for "${key}" must be positive, got ${perKey.limit}.`,
61:         )
62:       }
63:       if (perKey.acquireTimeoutMs !== undefined && perKey.acquireTimeoutMs < 0) {
64:         throw new Error(
65:           `[Harness] Invalid concurrency policy: per-key acquireTimeoutMs for "${key}" must be non-negative, got ${perKey.acquireTimeoutMs}.`,
66:         )
67:       }
68:     }
69:   }
70: }
71: 
72: function validateBudgetPolicy(policy: BudgetPolicy): void {
73:   if (policy.maxToolCallsPerSession <= 0) {
74:     throw new Error(
75:       `[Harness] Invalid budget policy: maxToolCallsPerSession must be positive, got ${policy.maxToolCallsPerSession}.`,
76:     )
77:   }
78:   if (policy.repeatedSignatureThreshold <= 0) {
79:     throw new Error(
80:       `[Harness] Invalid budget policy: repeatedSignatureThreshold must be positive, got ${policy.repeatedSignatureThreshold}.`,
81:     )
82:   }
83:   if (policy.warningCap <= 0) {
84:     throw new Error(
85:       `[Harness] Invalid budget policy: warningCap must be positive, got ${policy.warningCap}.`,
86:     )
87:   }
88: }
89: 
90: function validateTrustedRuntimePolicy(_policy: TrustedRuntimePolicy): void {
91:   // Boolean-only policy today; shape validation happens through typing/merge.
92: }
93: 
94: function validateCategoryGatePolicy(policy: CategoryGatePolicy): void {
95:   if (!Array.isArray(policy.readonlyCategories)) {
96:     throw new Error("[Harness] Invalid category gate policy: readonlyCategories must be an array.")
97:   }
98:   if (typeof policy.commandCategory !== "string" || policy.commandCategory.length === 0) {
99:     throw new Error("[Harness] Invalid category gate policy: commandCategory must be a non-empty string.")
100:   }
101: }
102: 
103: // ---------------------------------------------------------------------------
104: // Policy loaders
105: // ---------------------------------------------------------------------------
106: 
107: /**
108:  * Load and validate a workspace-level runtime policy.
109:  *
110:  * @param workspacePolicy - Optional workspace-level policy. When omitted or
111:  *   empty, returns DEFAULT_RUNTIME_POLICY.
112:  * @returns A fully-resolved RuntimePolicy with all fields populated.
113:  * @throws [Harness]-prefixed Error when limits are out of valid range.
114:  */
115: export function loadRuntimePolicy(
116:   workspacePolicy?: Partial<RuntimePolicy>,
117: ): RuntimePolicy {
118:   const concurrency: ConcurrencyPolicy = {
119:     globalLimit:
120:       workspacePolicy?.concurrency?.globalLimit ??
121:       DEFAULT_RUNTIME_POLICY.concurrency.globalLimit,
122:     perKey: workspacePolicy?.concurrency?.perKey,
123:   }
124: 
125:   const budget: BudgetPolicy = {
126:     maxToolCallsPerSession:
127:       workspacePolicy?.budget?.maxToolCallsPerSession ??
128:       DEFAULT_RUNTIME_POLICY.budget.maxToolCallsPerSession,
129:     repeatedSignatureThreshold:
130:       workspacePolicy?.budget?.repeatedSignatureThreshold ??
131:       DEFAULT_RUNTIME_POLICY.budget.repeatedSignatureThreshold,
132:     warningCap:
133:       workspacePolicy?.budget?.warningCap ??
134:       DEFAULT_RUNTIME_POLICY.budget.warningCap,
135:     resetOnCompact:
136:       workspacePolicy?.budget?.resetOnCompact ??
137:       DEFAULT_RUNTIME_POLICY.budget.resetOnCompact,
138:   }
139: 
140:   const trustedRuntime: TrustedRuntimePolicy = {
141:     builtinAsyncBackgroundChildSessions:
142:       workspacePolicy?.trustedRuntime?.builtinAsyncBackgroundChildSessions ??
143:       DEFAULT_RUNTIME_POLICY.trustedRuntime.builtinAsyncBackgroundChildSessions,
144:   }
145: 
146:   const categoryGate: CategoryGatePolicy = {
147:     askUnknownCategories:
148:       workspacePolicy?.categoryGate?.askUnknownCategories ??
149:       DEFAULT_RUNTIME_POLICY.categoryGate?.askUnknownCategories ??
150:       DEFAULT_CATEGORY_GATE_POLICY.askUnknownCategories,
151:     readonlyCategories:
152:       workspacePolicy?.categoryGate?.readonlyCategories ??
153:       DEFAULT_RUNTIME_POLICY.categoryGate?.readonlyCategories ??
154:       DEFAULT_CATEGORY_GATE_POLICY.readonlyCategories,
155:     commandCategory:
156:       workspacePolicy?.categoryGate?.commandCategory ??
157:       DEFAULT_RUNTIME_POLICY.categoryGate?.commandCategory ??
158:       DEFAULT_CATEGORY_GATE_POLICY.commandCategory,
159:   }
160: 
161:   validateConcurrencyPolicy(concurrency)
162:   validateBudgetPolicy(budget)
163:   validateTrustedRuntimePolicy(trustedRuntime)
164:   validateCategoryGatePolicy(categoryGate)
165: 
166:   return { concurrency, budget, trustedRuntime, categoryGate }
167: }
168: 
169: /**
170:  * Resolve the effective runtime policy for a specific session.
171:  *
172:  * Per-session overrides take precedence over workspace-level defaults.
173:  * Both the workspace policy and the session override are validated before
174:  * being applied — out-of-range values throw [Harness] errors.
175:  *
176:  * RESEARCH D-16: Session overrides come from trusted continuity/delegation
177:  * metadata only (not arbitrary tool args). This prevents silent limit
178:  * escalation from untrusted sources (threat T-02-03).
179:  *
180:  * @param workspacePolicy - Workspace-level policy (already validated or default).
181:  * @param sessionOverride - Optional per-session overrides from delegation metadata.
182:  * @returns Fully-resolved policy for this session.
183:  * @throws [Harness]-prefixed Error when session override values are invalid.
184:  */
185: export function getRuntimePolicyForSession(
186:   workspacePolicy: RuntimePolicy,
187:   sessionOverride?: SessionPolicyOverride,
188: ): RuntimePolicy {
189:   const resolvedWorkspacePolicy = loadRuntimePolicy(workspacePolicy)
190: 
191:   if (!sessionOverride) {
192:     return resolvedWorkspacePolicy
193:   }
194: 
195:   // Merge concurrency overrides
196:   const concurrency: ConcurrencyPolicy = {
197:     globalLimit:
198:       sessionOverride.concurrency?.globalLimit ??
199:       resolvedWorkspacePolicy.concurrency.globalLimit,
200:     perKey:
201:       sessionOverride.concurrency?.perKey ??
202:       resolvedWorkspacePolicy.concurrency.perKey,
203:   }
204: 
205:   // Merge budget overrides (partial override wins per-field)
206:   const budget: BudgetPolicy = {
207:     maxToolCallsPerSession:
208:       sessionOverride.budget?.maxToolCallsPerSession ??
209:       resolvedWorkspacePolicy.budget.maxToolCallsPerSession,
210:     repeatedSignatureThreshold:
211:       sessionOverride.budget?.repeatedSignatureThreshold ??
212:       resolvedWorkspacePolicy.budget.repeatedSignatureThreshold,
213:     warningCap:
214:       sessionOverride.budget?.warningCap ??
215:       resolvedWorkspacePolicy.budget.warningCap,
216:     resetOnCompact:
217:       sessionOverride.budget?.resetOnCompact ??
218:       resolvedWorkspacePolicy.budget.resetOnCompact,
219:   }
220: 
221:   const trustedRuntime: TrustedRuntimePolicy = {
222:     builtinAsyncBackgroundChildSessions:
223:       sessionOverride.trustedRuntime?.builtinAsyncBackgroundChildSessions ??
224:       resolvedWorkspacePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions,
225:   }
226:   const categoryGate = resolvedWorkspacePolicy.categoryGate ?? DEFAULT_CATEGORY_GATE_POLICY
227: 
228:   // Validate the merged result
229:   validateConcurrencyPolicy(concurrency)
230:   validateBudgetPolicy(budget)
231:   validateTrustedRuntimePolicy(trustedRuntime)
232:   validateCategoryGatePolicy(categoryGate)
233: 
234:   return { concurrency, budget, trustedRuntime, categoryGate }
235: }
236: 
237: // ---------------------------------------------------------------------------
238: // Convenience resolvers for hook consumers
239: // ---------------------------------------------------------------------------
240: 
241: /**
242:  * Resolve the effective per-key concurrency policy for a given lane key.
243:  *
244:  * Falls back to the global limit when no per-key override exists.
245:  */
246: export function resolveConcurrencyForKey(
247:   policy: RuntimePolicy,
248:   key: string,
249: ): { limit: number; acquireTimeoutMs?: number } {
250:   const perKey = policy.concurrency.perKey?.[key]
251:   return {
252:     limit: perKey?.limit ?? policy.concurrency.globalLimit,
253:     acquireTimeoutMs: perKey?.acquireTimeoutMs,
254:   }
255: }
256: 
257: /**
258:  * Resolve the effective budget policy for a session.
259:  *
260:  * This is the budget analogue of resolveConcurrencyForKey — it returns
261:  * the full budget policy for use by the tool guard hooks.
262:  */
263: export function resolveBudgetForSession(
264:   policy: RuntimePolicy,
265: ): ResolvedBudgetPolicy {
266:   return { ...policy.budget }
267: }

(End of file - total 267 lines)
</content>
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

(Showing lines 1-60 of 285. Use offset=61 to continue.)
</content>
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
  "filePath": "/Users/apple/hivemind-plugin-private/vitest.config.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/runtime.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_Uxgx1ycP0xiZNh2S81HH9781"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_o3vQ26xVvJheQezEMDIe4116"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_R5YPHfVvdT0JvaVTByKX7726"
}
```

