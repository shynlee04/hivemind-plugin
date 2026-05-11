---
sessionID: ses_1e7dd61dfffe5zWKhWlIOesPr8
created: 2026-05-11T17:43:02.452Z
updated: 2026-05-11T17:43:02.452Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: tech
Today's date: 2026-05-12

Analyze this codebase for technology stack and external integrations.

Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

IMPORTANT: Use 2026-05-12 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo — perform a complete codebase scan.

Explore thoroughly. Write documents directly using templates. Return confirmation only with file paths and line counts when done.

CRITICAL RULES:
1. Use `read`, `write`, `glob`, `grep`, `bash` tools to explore the codebase - do NOT use browser_subagent or Explore agents.
2. Write documents directly to .planning/codebase/STACK.md and .planning/codebase/INTEGRATIONS.md
3. Return ONLY a confirmation with document paths and line counts.
4. Include actual file paths formatted with backticks in documents.

Project: Hivemind - a runtime composition engine for OpenCode. TypeScript plugin. package.json names package as "hivemind". Peer dependency: @opencode-ai/plugin ^1.14.41. src/ contains the hard harness source.

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
  "filePath": "/Users/apple/hivemind-plugin-private/package.json"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_9HuHJMlbNNK9gMx8GEMG4938"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_q4ITIpANZlEQeAUGPh6W4935"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_bhjdL1fLtlkdrvy23uMP5019"
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


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_1CBs2UON5A5vDCAxjOTN1060"
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
  "callID": "call_04_IZINJiulq4nHWXJjhv3c5256"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_05_eDbDvoKK1dZpozc8zg5F3059"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_IHGwud1E3w6mPQ9IeN6R3671"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_j97gQmZY5sxXpz2A7Bzv8463"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/cli/index.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/cli/index.ts</path>
<type>file</type>
<content>
1: /**
2:  * CLI substrate entry point (Phase 40 / PH40-01).
3:  *
4:  * This module is the runtime entry point used by `bin/hivemind-tools.cjs`.
5:  * It wires the built-in command sources into a router and exposes a
6:  * single `runCli(argv, io?)` function that:
7:  *   - Parses argv (stripped of `node` and the script name).
8:  *   - Dispatches to the matching command via {@link createRouter}.
9:  *   - Writes the handler's `output` to stdout (when present).
10:  *   - Writes any `error` to stderr (always `[Harness]`-prefixed).
11:  *   - Resolves the handler's exit code (default 0).
12:  *
13:  * The substrate is dependency-free except for the harness's own modules;
14:  * see `src/cli/router.ts` for the rationale.
15:  *
16:  * @example
17:  * ```ts
18:  * // Subpath import resolved by the package's "exports" field.
19:  * import { runCli } from "<package>/cli"
20:  * const exitCode = await runCli(process.argv.slice(2))
21:  * process.exit(exitCode)
22:  * ```
23:  */
24: 
25: import { createHelpCommand } from "./commands/help.js"
26: import { initCmd } from "./commands/init.js"
27: import { doctorCmd } from "./commands/doctor.js"
28: import { recoverCmd } from "./commands/recover.js"
29: import { versionCmd } from "./commands/version.js"
30: import { discoverCommands } from "./discovery.js"
31: import { renderError } from "./renderer.js"
32: import {
33:   createRouter,
34:   type CliCommand,
35:   type CliRouter,
36:   type CliRouterResult,
37: } from "./router.js"
38: 
39: export type CliIO = {
40:   stdout: (chunk: string) => void
41:   stderr: (chunk: string) => void
42: }
43: 
44: const defaultIO: CliIO = {
45:   stdout: (chunk) => process.stdout.write(chunk),
46:   stderr: (chunk) => process.stderr.write(chunk),
47: }
48: 
49: /**
50:  * Build the canonical CLI router with the harness's built-in commands.
51:  *
52:  * Exposed as a separate factory so tests can introspect the registry
53:  * without going through `runCli`.
54:  */
55: export function buildHarnessCli(
56:   extraCommands: readonly CliCommand[] = [],
57: ): CliRouter {
58:   // `commands` is rebound after the help command is built so its closure
59:   // can see itself in the listing.
60:   let commands: readonly CliCommand[] = []
61:   const help = createHelpCommand(() => commands)
62: 
63:   commands = discoverCommands([
64:     { name: "core", commands: [help, initCmd, doctorCmd, recoverCmd, versionCmd] },
65:     { name: "extras", commands: extraCommands },
66:   ])
67: 
68:   return createRouter({ commands })
69: }
70: 
71: /**
72:  * Top-level CLI entrypoint. Dispatches argv to the matching command,
73:  * pipes its output through the supplied IO interface, and returns the
74:  * handler's exit code (or 64 for usage errors / 70 for handler crashes
75:  * per the router's policy).
76:  */
77: export async function runCli(
78:   argv: readonly string[],
79:   io: CliIO = defaultIO,
80: ): Promise<number> {
81:   const router = buildHarnessCli()
82:   const result: CliRouterResult = await router.run(argv)
83: 
84:   if (result.output !== undefined && result.output.length > 0) {
85:     io.stdout(`${result.output}\n`)
86:   }
87:   if (result.error !== undefined && result.error.length > 0) {
88:     io.stderr(`${renderError(result.error)}\n`)
89:   }
90:   return result.exitCode
91: }
92: 
93: export type { CliCommand, CliRouter, CliRouterResult } from "./router.js"
94: export { createRouter, parseArgs } from "./router.js"
95: export { discoverCommands, validateCommand } from "./discovery.js"
96: export { renderError, renderHelp, renderJson, renderTable } from "./renderer.js"

(End of file - total 96 lines)
</content>
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

(Showing lines 1-60 of 415. Use offset=61 to continue.)
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/mcp-server.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/mcp-server.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const MCP_SERVER_SCHEMA_VERSION = "1.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. MCP Server Type — discriminated union tag
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Discriminator for MCP server transport: local process or remote HTTP.
11:  */
12: export const MCPServerTypeSchema = z.enum(["local", "remote"])
13: 
14: export type MCPServerType = z.infer<typeof MCPServerTypeSchema>
15: 
16: // ---------------------------------------------------------------------------
17: // 2. Local MCP Server — spawned as a child process
18: // ---------------------------------------------------------------------------
19: 
20: /**
21:  * Configuration for a locally-running MCP server. The `command` array is
22:  * executed as a child process (e.g. `["npx", "-y", "pkg"]`).
23:  */
24: export const LocalMCPServerSchema = z
25:   .object({
26:     type: z.literal("local"),
27:     command: z.array(z.string().min(1)).min(1),
28:     environment: z.record(z.string(), z.string()).optional(),
29:     enabled: z.boolean().optional().default(true),
30:     timeout: z.number().int().positive().optional(),
31:   })
32:   .strict()
33: 
34: export type LocalMCPServer = z.infer<typeof LocalMCPServerSchema>
35: 
36: /** Lenient variant that strips unknown fields instead of rejecting them. */
37: export const LocalMCPServerSchemaLenient = LocalMCPServerSchema.strip()
38: 
39: export type LocalMCPServerLenient = z.infer<typeof LocalMCPServerSchemaLenient>
40: 
41: // ---------------------------------------------------------------------------
42: // 3. Remote MCP Server — HTTP/HTTPS endpoint
43: // ---------------------------------------------------------------------------
44: 
45: /**
46:  * OAuth credentials for a remote MCP server.
47:  */
48: const MCPOAuthSchema = z
49:   .object({
50:     clientId: z.string().min(1),
51:     scope: z.string().optional(),
52:   })
53:   .strict()
54: 
55: const MCPOAuthSchemaLenient = MCPOAuthSchema.strip()
56: 
57: /**
58:  * Configuration for a remote MCP server accessed via HTTP. The `url`
59:  * must be a valid HTTP(S) endpoint.
60:  */
61: export const RemoteMCPServerSchema = z
62:   .object({
63:     type: z.literal("remote"),
64:     url: z.string().url(),
65:     headers: z.record(z.string(), z.string()).optional(),
66:     oauth: MCPOAuthSchema.optional(),
67:     enabled: z.boolean().optional().default(true),
68:     timeout: z.number().int().positive().optional(),
69:   })
70:   .strict()
71: 
72: export type RemoteMCPServer = z.infer<typeof RemoteMCPServerSchema>
73: 
74: /** Lenient variant that strips unknown fields instead of rejecting them. */
75: export const RemoteMCPServerSchemaLenient = z
76:   .object({
77:     type: z.literal("remote"),
78:     url: z.string().url(),
79:     headers: z.record(z.string(), z.string()).optional(),
80:     oauth: MCPOAuthSchemaLenient.optional(),
81:     enabled: z.boolean().optional().default(true),
82:     timeout: z.number().int().positive().optional(),
83:   })
84:   .strip()
85: 
86: export type RemoteMCPServerLenient = z.infer<typeof RemoteMCPServerSchemaLenient>
87: 
88: // ---------------------------------------------------------------------------
89: // 4. MCP Server Config — discriminated union
90: // ---------------------------------------------------------------------------
91: 
92: /**
93:  * A single MCP server entry: either a local process or remote endpoint.
94:  * Discriminated on the `type` field.
95:  */
96: export const MCPServerConfigSchema = z.discriminatedUnion("type", [
97:   LocalMCPServerSchema,
98:   RemoteMCPServerSchema,
99: ])
100: 
101: export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>
102: 
103: /** Lenient variant that strips unknown fields instead of rejecting them. */
104: export const MCPServerConfigSchemaLenient = z.discriminatedUnion("type", [
105:   LocalMCPServerSchemaLenient,
106:   RemoteMCPServerSchemaLenient,
107: ])
108: 
109: export type MCPServerConfigLenient = z.infer<typeof MCPServerConfigSchemaLenient>
110: 
111: // ---------------------------------------------------------------------------
112: // 5. MCP Server Registry — named collection in opencode.json
113: // ---------------------------------------------------------------------------
114: 
115: /**
116:  * The `mcp` section of opencode.json: a mapping of server names to their
117:  * configurations.
118:  */
119: export const MCPServerRegistrySchema = z.record(
120:   z.string().min(1),
121:   MCPServerConfigSchema,
122: )
123: 
124: export type MCPServerRegistry = z.infer<typeof MCPServerRegistrySchema>

(End of file - total 124 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/hivemind-configs.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/hivemind-configs.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. Supported languages — shared enum for conversation and document output
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Supported language codes for agent conversation output and artifact generation.
11:  *
12:  * @example
13:  * ```typescript
14:  * const result = SupportedLanguageSchema.safeParse("en")
15:  * // result.success === true
16:  * ```
17:  */
18: export const SupportedLanguageSchema = z.enum([
19:   "en",
20:   "vi",
21:   "zh",
22:   "fr",
23:   "ja",
24:   "ko",
25:   "de",
26:   "es",
27:   "th",
28:   "id",
29: ])
30: 
31: export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>
32: 
33: // ---------------------------------------------------------------------------
34: // 2. Mode — guardrail intensity level
35: // ---------------------------------------------------------------------------
36: 
37: /**
38:  * Hivemind operation mode controlling guardrail intensity.
39:  *
40:  * - `expert-advisor`: Agent-led with TDD, spec-driven, research-first, systematic planning.
41:  * - `hivemind-powered`: Stricter guardrails, hierarchical tracking, cross-context persistence.
42:  * - `free-style`: Features only available if child control-panes are active or explicitly requested.
43:  *
44:  * @example
45:  * ```typescript
46:  * const result = HivemindModeSchema.safeParse("expert-advisor")
47:  * // result.success === true
48:  * ```
49:  */
50: export const HivemindModeSchema = z.enum([
51:   "expert-advisor",
52:   "hivemind-powered",
53:   "free-style",
54: ])
55: 
56: export type HivemindMode = z.infer<typeof HivemindModeSchema>
57: 
58: // ---------------------------------------------------------------------------
59: // 3. User expert level — output style adaptation
60: // ---------------------------------------------------------------------------
61: 
62: /**
63:  * User proficiency level affecting agent output style, jargon level, and elaboration depth.
64:  *
65:  * @example
66:  * ```typescript
67:  * const result = UserExpertLevelSchema.safeParse("architecture-driven")
68:  * // result.success === true
69:  * ```
70:  */
71: export const UserExpertLevelSchema = z.enum([
72:   "clumsy-vibecoder",
73:   "beginner-friendly",
74:   "intermediate-high-level",
75:   "architecture-driven",
76:   "absolute-expert",
77: ])
78: 
79: export type UserExpertLevel = z.infer<typeof UserExpertLevelSchema>
80: 
81: // ---------------------------------------------------------------------------
82: // 4. Discuss mode — GSD discuss-phase mode selection
83: // ---------------------------------------------------------------------------
84: 
85: /**
86:  * Phase discussion intensity controlling how the discuss-phase skill operates.
87:  *
88:  * - `sufficient-phase-discussion`: Gather enough context, then move on.
89:  * - `intensive-phase-discussion`: Deep exploration before planning.
90:  * - `skip-phase-discussion`: Skip discussion, go straight to planning.
91:  *
92:  * @example
93:  * ```typescript
94:  * const result = DiscussModeSchema.safeParse("sufficient-phase-discussion")
95:  * // result.success === true
96:  * ```
97:  */
98: export const DiscussModeSchema = z.enum([
99:   "sufficient-phase-discussion",
100:   "intensive-phase-discussion",
101:   "skip-phase-discussion",
102: ])
103: 
104: export type DiscussMode = z.infer<typeof DiscussModeSchema>
105: 
106: // ---------------------------------------------------------------------------
107: // 5. Workflow config — runtime feature toggles
108: // ---------------------------------------------------------------------------
109: 
110: /**
111:  * Workflow configuration controlling runtime feature toggles.
112:  * Each toggle controls a separate runtime feature — implemented as OpenCode primitives,
113:  * custom tools, engines, or event-hook injections.
114:  *
115:  * @example
116:  * ```typescript
117:  * const result = WorkflowConfigSchema.safeParse({
118:  *   research: true,
119:  *   plan_check: true,
120:  *   discuss_mode: "sufficient-phase-discussion",
121:  * })
122:  * // result.success === true
123:  * ```
124:  */
125: /**
126:  * Internal workflow config object schema (without outer default).
127:  * Used to generate a fully-resolved default value for the outer schema.
128:  *
129:  * @internal
130:  */
131: const WorkflowConfigInnerSchema = z.object({
132:   research: z.boolean().default(true),
133:   /** @future-consumer lifecycle-manager.ts — CA-04 */
134:   cross_session_tasks_dependencies_validation: z.boolean().default(false),
135:   /** @future-consumer hivemind-trajectory tool — CA-04 */
136:   trajectory_control: z.boolean().default(false),
137:   /** @future-consumer continuity.ts — CA-04 */
138:   advanced_continuity_validation: z.boolean().default(false),
139:   /** @future-consumer task-status.ts — CA-04 */
140:   task_plus_enabled: z.boolean().default(false),
141:   plan_check: z.boolean().default(true),
142:   verifier: z.boolean().default(true),
143:   /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
144:   ui_phase: z.boolean().default(false),
145:   /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
146:   ui_safety_gate: z.boolean().default(false),
147:   /** @future-consumer WS-4 workstream — Future */
148:   ai_integration_phase: z.boolean().default(false),
149:   research_before_questions: z.boolean().default(true),
150:   discuss_mode: DiscussModeSchema.default("sufficient-phase-discussion"),
151:   use_worktrees: z.boolean().default(false),
152: })
153: 
154: /**
155:  * Workflow config schema with a factory default that produces
156:  * fully-resolved values (satisfies Zod v4 `.default()` type requirements).
157:  */
158: export const WorkflowConfigSchema = WorkflowConfigInnerSchema.default(
159:   () => WorkflowConfigInnerSchema.parse({}),
160: )
161: 
162: export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>
163: 
164: // ---------------------------------------------------------------------------
165: // 6. Delegation systems — enabled delegation modes
166: // ---------------------------------------------------------------------------
167: 
168: /**
169:  * Toggles for available delegation mechanisms.
170:  *
171:  * - `native_task`: OpenCode innate task tool (always available).
172:  * - `delegate_task`: Custom delegation via harness (f-06).
173:  * - `background_delegation`: Background/async delegation (f-06 advanced).
174:  *
175:  * @example
176:  * ```typescript
177:  * const result = DelegationSystemsSchema.safeParse({
178:  *   native_task: true,
179:  *   delegate_task: true,
180:  *   background_delegation: false,
181:  * })
182:  * // result.success === true
183:  * ```
184:  */
185: export const DelegationSystemsSchema = z
186:   .object({
187:     native_task: z.boolean().default(true),
188:     delegate_task: z.boolean().default(true),
189:     background_delegation: z.boolean().default(true),
190:   })
191:   .default({
192:     native_task: true,
193:     delegate_task: true,
194:     background_delegation: true,
195:   })
196: 
197: export type DelegationSystems = z.infer<typeof DelegationSystemsSchema>
198: 
199: // ---------------------------------------------------------------------------
200: // 7. Legacy key migration — camelCase → snake_case
201: // ---------------------------------------------------------------------------
202: 
203: /**
204:  * Maps legacy camelCase JSON keys to canonical snake_case keys.
205:  * Applied during `readConfigs()` to support backward-compatible config files.
206:  *
207:  * @example
208:  * ```typescript
209:  * // Input: { "conversationLanguage": "en" }
210:  * // After migration: { "conversation_language": "en" }
211:  * ```
212:  */
213: export const LEGACY_KEY_MAP: Record<string, string> = {
214:   conversationLanguage: "conversation_language",
215:   documentsLanguage: "documents_and_artifacts_language",
216:   userExpertLevel: "user_expert_level",
217:   delegationSystems: "delegation_systems",
218: } as const
219: 
220: /**
221:  * Applies legacy camelCase → snake_case key migration to a raw config object.
222:  * Mutates the input object in-place for efficiency.
223:  *
224:  * @param raw - The raw parsed JSON object from configs.json.
225:  * @returns The same object with legacy keys renamed to snake_case.
226:  */
227: export function migrateKeys(raw: Record<string, unknown>): Record<string, unknown> {
228:   for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
229:     if (oldKey in raw && !(newKey in raw)) {
230:       raw[newKey] = raw[oldKey]
231:       delete raw[oldKey]
232:     }
233:   }
234:   return raw
235: }
236: 
237: // ---------------------------------------------------------------------------
238: // 8. Hivemind configs — top-level .hivemind/configs.json schema
239: // ---------------------------------------------------------------------------
240: 
241: /**
242:  * Schema for `.hivemind/configs.json` — the full skeleton v2 §9.1 runtime configuration.
243:  * Loaded at every front-facing session start and reloaded after each user prompt.
244:  *
245:  * Unknown fields are stripped (lenient parsing) to support forward-compatible
246:  * configs from future versions without rejecting the entire file.
247:  *
248:  * @see SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2 §9.1 for the full schema specification.
249:  *
250:  * @example
251:  * ```typescript
252:  * import { HivemindConfigsSchema, readConfigs } from "./configs.js"
253:  *
254:  * // Validate a config object
255:  * const result = HivemindConfigsSchema.safeParse({
256:  *   conversation_language: "en",
257:  *   mode: "expert-advisor",
258:  *   workflow: { research: true, plan_check: true },
259:  * })
260:  *
261:  * // Read from disk
262:  * const configs = readConfigs("/path/to/project")
263:  * ```
264:  */
265: export const HivemindConfigsSchema = z
266:   .object({
267:     conversation_language: SupportedLanguageSchema.default("en"),
268:     documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
269:     mode: HivemindModeSchema.default("expert-advisor"),
270:     user_expert_level: UserExpertLevelSchema.default("intermediate-high-level"),
271:     delegation_systems: DelegationSystemsSchema,
272:     parallelization: z.boolean().default(true),
273:     atomic_commit: z.boolean().default(true),
274:     commit_docs: z.boolean().default(true),
275:     workflow: WorkflowConfigSchema,
276:   })
277:   .strip()
278: 
279: export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>
280: 
281: // ---------------------------------------------------------------------------
282: // 9. Defaults helper
283: // ---------------------------------------------------------------------------
284: 
285: /**
286:  * Returns the default Hivemind configuration object.
287:  * Equivalent to `HivemindConfigsSchema.parse({})`.
288:  *
289:  * @returns Default configuration with all fields set to their default values.
290:  *
291:  * @example
292:  * ```typescript
293:  * const defaults = getDefaultConfigs()
294:  * // defaults.conversationLanguage === "en"
295:  * // defaults.mode === "expert-advisor"
296:  * ```
297:  */
298: export function getDefaultConfigs(): HivemindConfigs {
299:   return HivemindConfigsSchema.parse({})
300: }
301: 
302: // ---------------------------------------------------------------------------
303: // 10. Read/write helpers
304: // ---------------------------------------------------------------------------
305: 
306: import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
307: import { dirname, resolve } from "node:path"
308: 
309: /**
310:  * Resolves the canonical path to `.hivemind/configs.json` for a given project root.
311:  *
312:  * @param projectRoot - Absolute path to the project root directory.
313:  * @returns Absolute path to `.hivemind/configs.json`.
314:  */
315: export function getConfigsPath(projectRoot: string): string {
316:   return resolve(projectRoot, ".hivemind", "configs.json")
317: }
318: 
319: /**
320:  * Reads and validates `.hivemind/configs.json` from disk. Returns defaults if
321:  * the file is missing or contains invalid JSON. Unknown fields are silently
322:  * stripped.
323:  *
324:  * @param projectRoot - Absolute path to the project root directory.
325:  * @returns Validated Hivemind configuration object.
326:  *
327:  * @example
328:  * ```typescript
329:  * const configs = readConfigs("/path/to/project")
330:  * console.log(configs.mode) // "expert-advisor"
331:  * ```
332:  */
333: export function readConfigs(projectRoot: string): HivemindConfigs {
334:   const configPath = getConfigsPath(projectRoot)
335: 
336:   if (!existsSync(configPath)) {
337:     return getDefaultConfigs()
338:   }
339: 
340:   try {
341:     const raw = readFileSync(configPath, "utf8")
342:     const parsed = JSON.parse(raw) as Record<string, unknown>
343: 
344:     // Apply legacy camelCase → snake_case key migration
345:     migrateKeys(parsed)
346: 
347:     const result = HivemindConfigsSchema.safeParse(parsed)
348: 
349:     if (result.success) {
350:       return result.data
351:     }
352: 
353:     // Invalid schema — return defaults rather than crashing
354:     return getDefaultConfigs()
355:   } catch {
356:     // Corrupt JSON or read error — return defaults
357:     return getDefaultConfigs()
358:   }
359: }
360: 
361: export type ConfigFileValidationResult =
362:   | { success: true; data: HivemindConfigs }
363:   | { success: false; error: string }
364: 
365: /**
366:  * Validate `.hivemind/configs.json` without silently falling back to defaults.
367:  *
368:  * This helper is intended for diagnostics such as `hivemind doctor`, where the
369:  * caller needs a precise success/failure result instead of the lenient runtime
370:  * fallback behavior used by {@link readConfigs}.
371:  *
372:  * @param projectRoot - Absolute path to the project root directory.
373:  * @returns Explicit validation success or a human-readable failure message.
374:  *
375:  * @example
376:  * ```typescript
377:  * const result = validateConfigsFile("/path/to/project")
378:  * if (!result.success) console.error(result.error)
379:  * ```
380:  */
381: export function validateConfigsFile(projectRoot: string): ConfigFileValidationResult {
382:   const configPath = getConfigsPath(projectRoot)
383: 
384:   if (!existsSync(configPath)) {
385:     return { success: false, error: `Missing ${configPath}` }
386:   }
387: 
388:   try {
389:     const raw = readFileSync(configPath, "utf8")
390:     const parsed = JSON.parse(raw) as Record<string, unknown>
391:     migrateKeys(parsed)
392:     const result = HivemindConfigsSchema.safeParse(parsed)
393:     if (!result.success) {
394:       return {
395:         success: false,
396:         error: result.error.issues
397:           .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
398:           .join("; "),
399:       }
400:     }
401:     return { success: true, data: result.data }
402:   } catch (cause) {
403:     return { success: false, error: cause instanceof Error ? cause.message : String(cause) }
404:   }
405: }
406: 
407: /**
408:  * Validates and writes a Hivemind configuration object to `.hivemind/configs.json`.
409:  * Creates the parent directory if it does not exist.
410:  *
411:  * @param projectRoot - Absolute path to the project root directory.
412:  * @param config - Configuration object to validate and persist.
413:  * @returns The validated configuration that was written.
414:  * @throws {Error} If the config object fails Zod validation.
415:  *
416:  * @example
417:  * ```typescript
418:  * const written = writeConfigs("/path/to/project", {
419:  *   conversationLanguage: "vi",
420:  *   documentsLanguage: "en",
421:  *   mode: "hivemind-powered",
422:  *   userExpertLevel: "architecture-driven",
423:  *   delegationSystems: {
424:  *     native_task: true,
425:  *     delegate_task: true,
426:  *     background_delegation: true,
427:  *   },
428:  * })
429:  * ```
430:  */
431: export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs {
432:   const validated = HivemindConfigsSchema.parse(config)
433:   const configPath = getConfigsPath(projectRoot)
434:   mkdirSync(dirname(configPath), { recursive: true })
435:   // Always write canonical snake_case JSON keys (schema already uses snake_case)
436:   writeFileSync(configPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
437:   return validated
438: }

(End of file - total 438 lines)
</content>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_BXLFZWyXJeRYZMjGSTgp6881"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_3gtFZqCeUOasNOxj16bG8805"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/run-background-command.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/run-background-command.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: import { z } from "zod"
3: 
4: import type { DelegationManager } from "../../coordination/delegation/manager.js"
5: import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
6: import type { Delegation } from "../../shared/types.js"
7: import { getCachedConfig } from "../../config/subscriber.js"
8: import { renderToolResult } from "../../shared/tool-helpers.js"
9: import { error, success } from "../../shared/tool-response.js"
10: 
11: const RunActionSchema = z.object({
12:   action: z.literal("run"),
13:   command: z.string().min(1),
14:   args: z.array(z.string()).optional(),
15:   cwd: z.string().optional(),
16:   env: z.record(z.string(), z.string()).optional(),
17: })
18: 
19: const OutputActionSchema = z.object({
20:   action: z.literal("output"),
21:   sessionId: z.string().min(1),
22:   offset: z.number().int().min(0).optional(),
23: })
24: 
25: const InputActionSchema = z.object({
26:   action: z.literal("input"),
27:   sessionId: z.string().min(1),
28:   input: z.string(),
29: })
30: 
31: const ListActionSchema = z.object({
32:   action: z.literal("list"),
33: })
34: 
35: const TerminateActionSchema = z.object({
36:   action: z.literal("terminate"),
37:   sessionId: z.string().min(1),
38: })
39: 
40: const RunBackgroundCommandInputSchema = z.discriminatedUnion("action", [
41:   RunActionSchema,
42:   OutputActionSchema,
43:   InputActionSchema,
44:   ListActionSchema,
45:   TerminateActionSchema,
46: ])
47: 
48: const ACTION_GUIDANCE = "Valid actions are: run, output, input, list, terminate. Use run instead of start and output instead of read."
49: const SHELL_META_RE = /(?:&&|\|\||;|`|\$\(|>|<|\n)/
50: const SHELL_COMMAND_RE = /^(?:bash|sh|zsh)\s+-[lc]\s+/u
51: 
52: type RunBackgroundCommandInput = z.infer<typeof RunBackgroundCommandInputSchema>
53: 
54: type ToolContext = {
55:   sessionID?: string
56:   directory?: string
57: }
58: 
59: /**
60:  * Resolve the caller identity from the OpenCode tool context only.
61:  *
62:  * @param context - Tool execution context supplied by OpenCode.
63:  * @param action - Current run-background-command action for diagnostics.
64:  * @returns Caller session ID when present.
65:  * @throws {Error} When the context has no session ID.
66:  */
67: function requireCallerSessionId(context: ToolContext, action: RunBackgroundCommandInput["action"]): string {
68:   if (!context.sessionID) {
69:     throw new Error(`[Harness] Missing caller session ID for run-background-command ${action}`)
70:   }
71:   return context.sessionID
72: }
73: 
74: /**
75:  * Assert that a PTY session is owned by a caller-visible delegation.
76:  *
77:  * @param delegationManager - Delegation manager containing PTY ownership records.
78:  * @param callerSessionId - Current caller session from tool context.
79:  * @param sessionId - PTY session ID requested by the caller.
80:  * @returns The delegation that owns the PTY session.
81:  * @throws {Error} When no caller-visible delegation owns the PTY session.
82:  */
83: function requireVisiblePtyDelegation(
84:   delegationManager: DelegationManager,
85:   callerSessionId: string,
86:   sessionId: string,
87: ): Delegation {
88:   const delegation = delegationManager.getDelegationForPtySession(sessionId)
89:   if (!delegation || !delegationManager.canSessionAccessDelegation(callerSessionId, delegation)) {
90:     throw new Error(`[Harness] Access denied for PTY session "${sessionId}": no caller-visible delegation owns this session`)
91:   }
92:   return delegation
93: }
94: 
95: /**
96:  * Parse raw tool input into the supported command contract with actionable errors.
97:  *
98:  * @param rawArgs - Untrusted OpenCode tool arguments.
99:  * @returns Validated run-background-command input.
100:  * @throws {Error} When the action is unsupported or the Zod contract fails.
101:  * @example
102:  * parseRunBackgroundCommandInput({ action: "run", command: "bash", args: ["-lc", "echo ok"] })
103:  */
104: function parseRunBackgroundCommandInput(rawArgs: unknown): RunBackgroundCommandInput {
105:   const rawAction = typeof rawArgs === "object" && rawArgs !== null && "action" in rawArgs
106:     ? String((rawArgs as { action?: unknown }).action)
107:     : ""
108:   if (rawAction === "start" || rawAction === "read") {
109:     throw new Error(`[Harness] Unsupported run-background-command action "${rawAction}". ${ACTION_GUIDANCE}`)
110:   }
111: 
112:   const parsed = RunBackgroundCommandInputSchema.safeParse(rawArgs)
113:   if (!parsed.success) {
114:     throw new Error(`[Harness] Invalid run-background-command input. ${ACTION_GUIDANCE}`)
115:   }
116:   return parsed.data
117: }
118: 
119: /**
120:  * Reject implicit shell strings before dispatching a local process.
121:  *
122:  * @param command - Executable name supplied to the command tool.
123:  * @param commandArgs - Optional executable arguments supplied separately.
124:  * @throws {Error} When the command looks like an accidental shell string.
125:  * @example
126:  * assertExecutableCommandShape("bash", ["-lc", "echo ok"])
127:  */
128: function assertExecutableCommandShape(command: string, commandArgs: string[] | undefined): void {
129:   if (commandArgs && commandArgs.length > 0) return
130:   const trimmed = command.trim()
131:   if (SHELL_META_RE.test(trimmed) || SHELL_COMMAND_RE.test(trimmed)) {
132:     throw new Error(
133:       `[Harness] run-background-command expects an executable plus args. Use command: "bash", args: ["-lc", "<shell command>"] for shell syntax.`,
134:     )
135:   }
136: }
137: 
138: export function createRunBackgroundCommandTool(args: {
139:   delegationManager: DelegationManager
140:   ptyManager: PtyManager | null
141: }): ReturnType<typeof tool> {
142:   const s = tool.schema
143: 
144:   return tool({
145:     description:
146:       "Run CLI commands in shared background PTY sessions with queue-governed dispatch, output reads, interactive input, session listing, and termination.",
147:     args: {
148:       action: s.string().describe("run, output, input, list, or terminate"),
149:       command: s.string().optional(),
150:       args: s.array(s.string()).optional(),
151:       cwd: s.string().optional(),
152:       env: s.record(s.string(), s.string()).optional(),
153:       sessionId: s.string().optional(),
154:       offset: s.number().optional(),
155:       input: s.string().optional(),
156:     },
157:     async execute(rawArgs: RunBackgroundCommandInput, context: ToolContext): Promise<string> {
158:       try {
159:         const config = getCachedConfig()
160:         if (!config.delegation_systems.background_delegation) {
161:           return renderToolResult(error(
162:             `[Harness] Background delegation is disabled. Set delegation_systems.background_delegation to true in .hivemind/configs.json to enable run-background-command.`,
163:           ))
164:         }
165: 
166:         const parsed = parseRunBackgroundCommandInput(rawArgs)
167:         if (parsed.action === "run") {
168:           assertExecutableCommandShape(parsed.command, parsed.args)
169:           const parentSessionId = requireCallerSessionId(context, parsed.action)
170: 
171:           const result = await args.delegationManager.dispatchCommand({
172:             parentSessionId,
173:             command: parsed.command,
174:             args: parsed.args,
175:             cwd: parsed.cwd ?? context.directory,
176:             env: parsed.env,
177:             title: `Background command: ${parsed.command}`,
178:             queueContext: {
179:               agent: undefined,
180:               category: "command",
181:             },
182:           })
183: 
184:           return renderToolResult(success(`Background command started: ${parsed.command}`, result))
185:         }
186: 
187:         if (!args.ptyManager) {
188:           return renderToolResult(error(`[Harness] PTY not available in current environment for run-background-command ${parsed.action}`))
189:         }
190: 
191:         if (parsed.action === "output") {
192:           const callerSessionId = requireCallerSessionId(context, parsed.action)
193:           requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
194:           return renderToolResult(success(`Output for ${parsed.sessionId}`, args.ptyManager.read(parsed.sessionId, parsed.offset ?? 0)))
195:         }
196: 
197:         if (parsed.action === "input") {
198:           const callerSessionId = requireCallerSessionId(context, parsed.action)
199:           requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
200:           args.ptyManager.write(parsed.sessionId, parsed.input)
201:           return renderToolResult(success(`Input sent to ${parsed.sessionId}`))
202:         }
203: 
204:         if (parsed.action === "terminate") {
205:           const callerSessionId = requireCallerSessionId(context, parsed.action)
206:           requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
207:           const cancellation = await args.delegationManager.markCommandCancellationForPtySession(parsed.sessionId)
208:           await args.ptyManager.terminate(parsed.sessionId)
209:           return renderToolResult(success(
210:             `Cancellation requested for ${parsed.sessionId}`,
211:             cancellation ?? { sessionId: parsed.sessionId, explicitCancellation: true },
212:           ))
213:         }
214: 
215:         const callerSessionId = requireCallerSessionId(context, parsed.action)
216:         const visibleSessions = args.ptyManager.listSessions().filter((session) => {
217:           const delegation = args.delegationManager.getDelegationForPtySession(session.id)
218:           return args.delegationManager.canSessionAccessDelegation(callerSessionId, delegation)
219:         })
220:         return renderToolResult(success("Shared PTY sessions", visibleSessions))
221:       } catch (caughtError) {
222:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
223:         return renderToolResult(error(message))
224:       }
225:     },
226:   })
227: }
228: 
229: export { RunBackgroundCommandInputSchema }

(End of file - total 229 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/hivemind/AGENTS.md
# Hivemind Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/hivemind/` owns runtime control-plane and evidence-query tool entrypoints. Tools include: `hivemind-doc.ts` (document intelligence queries), `hivemind-agent-work.ts` (durable work contract create/export), `hivemind-trajectory.ts` (trajectory ledger inspection), `hivemind-pressure.ts` (pressure classification and evidence), `hivemind-sdk-supervisor.ts` (SDK wrapper health checks), `hivemind-command-engine.ts` (command discovery and routing preview), and `run-background-command.ts` (background PTY/headless command execution). Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side tools calling feature modules. Classification: Hard Harness. These tools consume `.opencode/` Soft Meta-Concepts as inputs but never store logic in `.opencode/`. Internal state persists to `.hivemind/`.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call feature modules (runtime-pressure, sdk-supervisor, agent-work-contracts, doc-intelligence, background-command) and task-management modules.
- Tools may write through approved `.hivemind/` state owners when the contract requires it. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT duplicate deep logic that belongs in feature modules.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke hivemind tools during workflows | Must pass schema-valid inputs |
| `src/features/` | Owns runtime feature logic | Tools call features; tools do not duplicate logic |
| `src/task-management/` | Owns trajectory and state persistence | Tools call task-management; tools do not own state |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate tool contracts and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts` with `hivemind-` prefix: `hivemind-doc.ts`, `hivemind-trajectory.ts`, etc. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- `run-background-command.ts` is the exception (no prefix).
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/hivemind/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.


Instructions from: /Users/apple/hivemind-plugin-private/src/tools/AGENTS.md
# Tools Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/` is the Hard Harness write-side sector. Tool implementations expose validated OpenCode tool commands for delegation, status polling, background commands, prompt enhancement, primitive configuration, trajectory, pressure, SDK supervision, command engine, and agent work contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Source architecture: `.planning/codebase/ARCHITECTURE.md:87-113` — CQRS write-side mutation authority. Tools call `src/task-management/`, `src/coordination/`, `src/features/` for durable operations. Soft Meta-Concepts (`.opencode/`) configure tool behavior via agent/command/skill primitives; `.opencode/` NEVER owns tool business logic or runtime state.

## 2. Allowed mutation authority

- Tools are the CQRS mutation authority for runtime operations and may write through approved library state owners. Evidence: `.planning/codebase/ARCHITECTURE.md:72-80`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/ARCHITECTURE.md:295-300`.
- Tools may call OpenCode SDK wrappers, delegation managers, state owners, config workflow, and schema validators when the tool contract explicitly requires it. Evidence: `.planning/codebase/ARCHITECTURE.md:273-285`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for external or agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Tools SHALL NOT register themselves directly in arbitrary files; `src/plugin.ts` owns registration. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Tools SHALL NOT claim completion, integration, or runtime readiness from mocked/unit-only proof when the claim is about OpenCode integration.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke tool contracts during workflows | Must pass schema-valid inputs |
| `src/plugin.ts` | Registers tool definitions with OpenCode | Does not embed tool business logic |
| `src/task-management/`, `src/coordination/`, `src/features/` owners | Perform durable state, lifecycle, SDK, and orchestration logic | Tools call them; tools do not duplicate deep logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests/gates | Verify validation, outputs, and side effects | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Single-file tools live at `src/tools/{tool-name}.ts`; multi-file tools live at `src/tools/{tool-name}/index.ts`. Evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Add or update schemas in `src/schema-kernel/{tool-name}.schema.ts` when validation is needed. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/STRUCTURE.md:237-240`.
- Tool tests live under `tests/tools/{tool-name}.test.ts` and mirror the source contract. Evidence: `.planning/codebase/STRUCTURE.md:221-224`, `.planning/codebase/TESTING.md:52-64`.
- Tool output must use the shared envelope rather than bespoke response shapes. Evidence: `.planning/codebase/ARCHITECTURE.md:334-337`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tool tests; run broader `npm test` when touching shared contracts or state owners. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Mutation claims require evidence of the intended state surface and proof that `.opencode/` was not used for internal state.
- Docs-only edits to this file are L5 evidence and must not be used to claim runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

</system-reminder>
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
  "filePath": "/Users/apple/hivemind-plugin-private/mcp.json"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/config"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/sdk-supervisor/index.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_hSgSo644UOQveeMLaPcY9163"
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


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_xGqWCcMyIQuTHi2tQJwk9042"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_t0oEnHqMEQPQS6GSy0zG3066"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_KQjhgVkbe0DurrxnCyR29145"
}
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
61:   return response.kind === "success"
62: }
63: 
64: /**
65:  * Type guard: true if response is an error.
66:  */
67: export function isError(
68:   response: ToolResponse,
69: ): response is ToolResponse & { kind: "error" } {
70:   return response.kind === "error"
71: }

(End of file - total 71 lines)
</content>
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

(Showing lines 1-20 of 295. Use offset=21 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.github/workflows/ci.yml"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/config/subscriber.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_VguDZMhv4x2P5TX0ITz78675"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_9AzPzqqzbc2Fo0Utx1m77779"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_GDdmGVUIxBDICSC7BpMu7744"
}
```

