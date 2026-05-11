---
sessionID: ses_1ebc494a4ffe28VByY8t3Bfa9o
created: 2026-05-10T23:31:38.993Z
updated: 2026-05-10T23:31:38.993Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: quality
Today's date: 2026-05-11

Analyze this codebase for coding conventions and testing patterns.

Write these documents to .planning/codebase/:
- CONVENTIONS.md - Code style, naming, patterns, error handling
- TESTING.md - Framework, structure, mocking, coverage

IMPORTANT: Use 2026-05-11 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo scan.

Explore thoroughly. Use Glob, Grep, Read tools to inspect source files, test files, configuration, lint rules. Write documents directly using the standard GSD codebase document templates. Include actual file paths formatted with backticks.

Return confirmation only with file paths and line counts of documents written.

### Tool: glob

**Input:**
```json
{
  "callID": "call_00_HXIplgPGkwEh5gEFao4u4006"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_3bOfIZdQHlqxwLBnUhzY6517"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_fY7RKQoY4WFjFZDLGIap7561"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_2gsv5UqLFtKfg4Hzw5Zx5831"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_QoAvoSv9x63TVUtKy0Yu2012"
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
  "filePath": "/Users/apple/hivemind-plugin-private/tsconfig.json"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_QUigpOvHZo19JKc7Lbie3737"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_57LULrlUw40zi1Fpayve4342"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_jnU8OGrN6L9dX6QqtMyn8434"
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
41:     if (!Array.isArray(errors) || errors.length === 0) {
42:       continue
43:     }
44: 
45:     const messages = errors
46:       .map((e) => {
47:         if (!isObject(e)) return JSON.stringify(e)
48:         return (
49:           (typeof e.message === "string" && e.message) ||
50:           (typeof e.reason === "string" && e.reason) ||
51:           JSON.stringify(e)
52:         )
53:       })
54:       .filter(Boolean)
55:     if (messages.length > 0) {
56:       return messages.join("; ")
57:     }
58:   }
59: 
60:   // Shape 3: Direct message at top level (rare but possible)
61:   const topLevelMessage = getNestedValue(error, ["message"])
62:   if (typeof topLevelMessage === "string" && topLevelMessage.length > 0) {
63:     return topLevelMessage
64:   }
65: 
66:   // Fallback: include error name if available
67:   const name = getNestedValue(error, ["name"])
68:   if (typeof name === "string" && name.length > 0) {
69:     return `${name}: ${JSON.stringify(error)}`
70:   }
71: 
72:   return `Unknown SDK error: ${JSON.stringify(error).slice(0, 200)}`
73: }
74: 
75: export function unwrapData<T = unknown>(response: unknown): T {
76:   if (isObject(response) && "error" in response && response.error) {
77:     const error = response.error
78:     const message = extractSdkErrorMessage(error)
79:     throw new Error(`[Harness] ${message}`)
80:   }
81:   if (isObject(response) && "data" in response && response.data !== undefined) {
82:     return response.data as T
83:   }
84:   return response as T
85: }
86: 
87: export function asString(value: unknown): string | undefined {
88:   return typeof value === "string" && value.length > 0 ? value : undefined
89: }
90: 
91: /**
92:  * Extract the text content of the last assistant message from an array of
93:  * session messages.
94:  *
95:  * Searches backward from the end of the array. The first message whose role
96:  * is `"assistant"` (checked at `info.role` first, then top-level `role`) is
97:  * selected. Only parts with `type === "text"` are included; their `text`
98:  * values are concatenated with an empty separator and trimmed.
99:  *
100:  * Returns `""` when no assistant message is found or the message has no text
101:  * parts.
102:  */
103: export function extractAssistantText(messages: unknown[]): string {
104:   for (let index = messages.length - 1; index >= 0; index -= 1) {
105:     const message = messages[index]
106:     const role =
107:       asString(getNestedValue(message, ["info", "role"])) ??
108:       asString(getNestedValue(message, ["role"]))
109: 
110:     if (role !== "assistant") {
111:       continue
112:     }
113: 
114:     const parts = getNestedValue(message, ["parts"])
115:     if (!Array.isArray(parts)) {
116:       return ""
117:     }
118: 
119:     return parts
120:       .filter((part) => getNestedValue(part, ["type"]) === "text")
121:       .map((part) => asString(getNestedValue(part, ["text"])) ?? "")
122:       .join("")
123:       .trim()
124:   }
125: 
126:   return ""
127: }
128: 
129: export function getPromptToolCompatibility(
130:   permissionRules: PermissionRule[]
131: ): Record<string, boolean> | undefined {
132:   const tools: Record<string, boolean> = {}
133: 
134:   for (const rule of permissionRules) {
135:     if (rule.action !== "ask") {
136:       continue
137:     }
138:     tools[rule.permission] = false
139:   }
140: 
141:   return Object.keys(tools).length > 0 ? tools : undefined
142: }
143: 
144: export function stableStringify(value: unknown): string {
145:   if (value === null || typeof value !== "object") {
146:     return JSON.stringify(value)
147:   }
148:   if (Array.isArray(value)) {
149:     return `[${value.map((item) => stableStringify(item)).join(",")}]`
150:   }
151:   const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
152:   return `{${entries
153:     .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
154:     .join(",")}}`
155: }
156: 
157: export function makeToolSignature(toolName: string, args: unknown): string {
158:   try {
159:     return `${toolName}:${stableStringify(args)}`
160:   } catch {
161:     return `${toolName}:<unserializable>`
162:   }
163: }
164: 
165: export function buildPromptText(args: {
166:   description: string
167:   prompt: string
168:   category?: string
169:   scope?: string
170:   constraints?: string[]
171:   guidanceText?: string
172:   agent?: string
173:   requiredTools?: string[]
174:   mustNotDo?: string[]
175:   sessionContext?: string
176: }): string {
177:   const agent = args.agent ?? "builder"
178:   const requiredTools = args.requiredTools ?? []
179:   const mustNotTools = args.mustNotDo ?? []
180: 
181:   const task = `TASK: ${args.description.trim()}\n${args.prompt.trim()}`
182: 
183:   const expectedOutcome = args.guidanceText?.trim()
184:     ? `EXPECTED OUTCOME: ${args.guidanceText.trim()}`
185:     : "EXPECTED OUTCOME: Complete the task as described"
186: 
187:   const requiredToolsSection = `REQUIRED TOOLS: ${requiredTools.join(", ")}`
188: 
189:   const mustDo =
190:     args.constraints && args.constraints.length > 0
191:       ? `MUST DO:\n${args.constraints.map((c) => `- ${c}`).join("\n")}`
192:       : "MUST DO: Follow the task instructions precisely"
193: 
194:   const mustNotDo =
195:     mustNotTools.length > 0
196:       ? `MUST NOT DO:\n${mustNotTools.map((m) => `- ${m}`).join("\n")}`
197:       : "MUST NOT DO: None specified"
198: 
199:   const contextParts: string[] = []
200:   if (args.scope?.trim()) contextParts.push(`scope: ${args.scope.trim()}`)
201:   if (args.category?.trim()) contextParts.push(`category: ${args.category.trim()}`)
202:   contextParts.push(`agent: ${agent}`)
203:   const context =
204:     contextParts.length > 0
205:       ? `CONTEXT: ${contextParts.join(", ")}`
206:       : "CONTEXT: No additional context"
207: 
208:   const sessionSection = args.sessionContext?.trim()
209:     ? `\n---\n## Session Context\n${args.sessionContext.trim()}`
210:     : ""
211: 
212:   return [task, expectedOutcome, requiredToolsSection, mustDo, mustNotDo, context].join("\n---\n") + sessionSection
213: }
214: 
215: /**
216:  * Extract text content from ALL assistant messages in an array, joined with newline.
217:  *
218:  * Unlike {@link extractAssistantText} which returns only the LAST assistant message,
219:  * this collects text from every assistant message — suitable for delegation result
220:  * extraction where the full assistant output is needed.
221:  */
222: export function extractAllAssistantText(messages: unknown[]): string {
223:   const textParts: string[] = []
224: 
225:   for (const message of messages) {
226:     const role =
227:       asString(getNestedValue(message, ["info", "role"])) ??
228:       asString(getNestedValue(message, ["role"]))
229: 
230:     if (role !== "assistant") {
231:       continue
232:     }
233: 
234:     const parts = getNestedValue(message, ["parts"])
235:     if (!Array.isArray(parts)) {
236:       continue
237:     }
238: 
239:     for (const part of parts) {
240:       if (getNestedValue(part, ["type"]) === "text") {
241:         const text = getNestedValue(part, ["text"])
242:         if (typeof text === "string") {
243:           textParts.push(text)
244:         }
245:       }
246:     }
247:   }
248: 
249:   return textParts.join("\n")
250: }
251: 
252: /**
253:  * Check whether assistant messages contain tool-use or other non-text work evidence.
254:  *
255:  * Used by delegation finalization to avoid erroring on "empty text" when the
256:  * assistant has been actively calling tools (tool_use, tool_result, or other
257:  * non-text part types indicate productive work even if no text was emitted).
258:  *
259:  * @param messages - Array of session messages (same shape as extractAllAssistantText).
260:  * @returns `true` if any assistant message contains at least one non-text part,
261:  *          indicating tool-use or other work evidence.
262:  */
263: export function hasAssistantWorkEvidence(messages: unknown[]): boolean {
264:   for (const message of messages) {
265:     const role =
266:       asString(getNestedValue(message, ["info", "role"])) ??
267:       asString(getNestedValue(message, ["role"]))
268: 
269:     if (role !== "assistant") {
270:       continue
271:     }
272: 
273:     const parts = getNestedValue(message, ["parts"])
274:     if (!Array.isArray(parts)) {
275:       continue
276:     }
277: 
278:     for (const part of parts) {
279:       const partType = getNestedValue(part, ["type"])
280:       // Any non-text part (tool_use, tool_result, etc.) indicates active work
281:       if (typeof partType === "string" && partType !== "text") {
282:         return true
283:       }
284:     }
285:   }
286: 
287:   return false
288: }
289: 
290: /**
291:  * Convert an unknown error value to a human-readable string message.
292:  */
293: export function describeError(error: unknown): string {
294:   return error instanceof Error ? error.message : String(error)
295: }

(End of file - total 295 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/helpers.test.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/tests/lib/helpers.test.ts</path>
<type>file</type>
<content>
1: import { describe, it, expect } from "vitest"
2: import {
3:   isObject,
4:   getNestedValue,
5:   asString,
6:   unwrapData,
7:   stableStringify,
8:   makeToolSignature,
9:   getPromptToolCompatibility,
10:   buildPromptText,
11:   extractAssistantText,
12: } from "../../src/shared/helpers.js"
13: import type { PermissionRule } from "../../src/shared/types.js"
14: 
15: describe("isObject", () => {
16:   it("returns true for plain objects", () => {
17:     expect(isObject({})).toBe(true)
18:     expect(isObject({ a: 1 })).toBe(true)
19:     expect(isObject(new Date())).toBe(true)
20:   })
21: 
22:   it("returns false for null", () => {
23:     expect(isObject(null)).toBe(false)
24:   })
25: 
26:   it("returns false for arrays", () => {
27:     expect(isObject([])).toBe(false)
28:     expect(isObject([1, 2])).toBe(false)
29:   })
30: 
31:   it("returns false for strings", () => {
32:     expect(isObject("hello")).toBe(false)
33:     expect(isObject("")).toBe(false)
34:   })
35: 
36:   it("returns false for numbers and booleans", () => {
37:     expect(isObject(42)).toBe(false)
38:     expect(isObject(true)).toBe(false)
39:     expect(isObject(undefined)).toBe(false)
40:   })
41: })
42: 
43: describe("getNestedValue", () => {
44:   it("returns nested value for valid path", () => {
45:     const obj = { a: { b: { c: 42 } } }
46:     expect(getNestedValue(obj, ["a", "b", "c"])).toBe(42)
47:   })
48: 
49:   it("returns value at single-level path", () => {
50:     const obj = { name: "test" }
51:     expect(getNestedValue(obj, ["name"])).toBe("test")
52:   })
53: 
54:   it("returns undefined for missing path", () => {
55:     const obj = { a: { b: 1 } }
56:     expect(getNestedValue(obj, ["a", "c"])).toBeUndefined()
57:   })
58: 
59:   it("returns undefined for deeply missing path", () => {
60:     const obj = { a: 1 }
61:     expect(getNestedValue(obj, ["x", "y", "z"])).toBeUndefined()
62:   })
63: 
64:   it("returns undefined when intermediate value is not an object", () => {
65:     const obj = { a: 5 }
66:     expect(getNestedValue(obj, ["a", "b"])).toBeUndefined()
67:   })
68: 
69:   it("returns the input itself for empty path", () => {
70:     const obj = { a: 1 }
71:     expect(getNestedValue(obj, [])).toEqual({ a: 1 })
72:   })
73: 
74:   it("returns undefined for non-object input", () => {
75:     expect(getNestedValue(null, ["a"])).toBeUndefined()
76:     expect(getNestedValue("str", ["a"])).toBeUndefined()
77:   })
78: })
79: 
80: describe("asString", () => {
81:   it("returns string for string input", () => {
82:     expect(asString("hello")).toBe("hello")
83:   })
84: 
85:   it("returns undefined for non-string input", () => {
86:     expect(asString(42)).toBeUndefined()
87:     expect(asString(null)).toBeUndefined()
88:     expect(asString(undefined)).toBeUndefined()
89:     expect(asString(true)).toBeUndefined()
90:     expect(asString({})).toBeUndefined()
91:     expect(asString([])).toBeUndefined()
92:   })
93: 
94:   it("returns undefined for empty string", () => {
95:     expect(asString("")).toBeUndefined()
96:   })
97: })
98: 
99: describe("unwrapData", () => {
100:   it("unwraps data property from response", () => {
101:     expect(unwrapData({ data: { id: 1 } })).toEqual({ id: 1 })
102:     expect(unwrapData({ data: "value" })).toBe("value")
103:     expect(unwrapData({ data: 42 })).toBe(42)
104:   })
105: 
106:   it("throws on error property with string message", () => {
107:     expect(() => unwrapData({ error: "Something went wrong" })).toThrow(
108:       "[Harness] Something went wrong"
109:     )
110:   })
111: 
112:   it("throws on error property with object message at top level", () => {
113:     expect(() =>
114:       unwrapData({ error: { message: "Detailed error" } })
115:     ).toThrow("[Harness] Detailed error")
116:   })
117: 
118:   it("extracts message from named error shape (data.message)", () => {
119:     expect(() =>
120:       unwrapData({ error: { name: "UnknownError", data: { message: "Session not found" } } })
121:     ).toThrow("[Harness] Session not found")
122:   })
123: 
124:   it("extracts message from MessageAbortedError shape", () => {
125:     expect(() =>
126:       unwrapData({ error: { name: "MessageAbortedError", data: { message: "Request aborted" } } })
127:     ).toThrow("[Harness] Request aborted")
128:   })
129: 
130:   it("extracts messages from BadRequestError errors array", () => {
131:     expect(() =>
132:       unwrapData({
133:         error: {
134:           errors: [
135:             { message: "Field required" },
136:             { reason: "Invalid format" },
137:           ],
138:         },
139:       })
140:     ).toThrow("[Harness] Field required; Invalid format")
141:   })
142: 
143:   it("extracts messages from SDK payloads that use the singular error array key", () => {
144:     expect(() =>
145:       unwrapData({
146:         error: {
147:           error: [
148:             { message: "Invalid session id" },
149:             { reason: "Expected value to start with 'ses'" },
150:           ],
151:         },
152:       })
153:     ).toThrow("[Harness] Invalid session id; Expected value to start with 'ses'")
154:   })
155: 
156:   it("falls back to error name + JSON for unrecognizable error shape", () => {
157:     expect(() => unwrapData({ error: { code: 500 } })).toThrow(
158:       "[Harness] Unknown SDK error: "
159:     )
160:   })
161: 
162:   it("returns response as-is when no data or error", () => {
163:     const response = { result: "ok" }
164:     expect(unwrapData(response)).toEqual({ result: "ok" })
165:   })
166: 
167:   it("returns data even if it is falsy but defined", () => {
168:     expect(unwrapData({ data: 0 })).toBe(0)
169:     expect(unwrapData({ data: false })).toBe(false)
170:     expect(unwrapData({ data: "" })).toBe("")
171:   })
172: 
173:   it("error takes precedence over data when both present", () => {
174:     expect(() =>
175:       unwrapData({ data: "ok", error: "fail" })
176:     ).toThrow("[Harness] fail")
177:   })
178: })
179: 
180: describe("stableStringify", () => {
181:   it("stringifies primitives", () => {
182:     expect(stableStringify(null)).toBe("null")
183:     expect(stableStringify(42)).toBe("42")
184:     expect(stableStringify("hello")).toBe('"hello"')
185:     expect(stableStringify(true)).toBe("true")
186:   })
187: 
188:   it("stringifies arrays preserving order", () => {
189:     expect(stableStringify([3, 1, 2])).toBe("[3,1,2]")
190:     expect(stableStringify([])).toBe("[]")
191:   })
192: 
193:   it("sorts object keys deterministically", () => {
194:     const obj = { z: 1, a: 2, m: 3 }
195:     expect(stableStringify(obj)).toBe('{"a":2,"m":3,"z":1}')
196:   })
197: 
198:   it("handles nested objects with sorted keys", () => {
199:     const obj = { b: { y: 1, x: 2 }, a: 3 }
200:     expect(stableStringify(obj)).toBe('{"a":3,"b":{"x":2,"y":1}}')
201:   })
202: 
203:   it("produces same output regardless of insertion order", () => {
204:     const obj1 = { z: 1, a: 2 }
205:     const obj2 = { a: 2, z: 1 }
206:     expect(stableStringify(obj1)).toBe(stableStringify(obj2))
207:   })
208: 
209:   it("handles arrays of objects", () => {
210:     const arr = [{ b: 1, a: 2 }, { d: 3, c: 4 }]
211:     expect(stableStringify(arr)).toBe('[{"a":2,"b":1},{"c":4,"d":3}]')
212:   })
213: })
214: 
215: describe("makeToolSignature", () => {
216:   it("produces consistent signature string", () => {
217:     const sig = makeToolSignature("read", { path: "/tmp/file.txt" })
218:     expect(sig).toBe('read:{"path":"/tmp/file.txt"}')
219:   })
220: 
221:   it("is deterministic regardless of arg key order", () => {
222:     const sig1 = makeToolSignature("edit", { b: 2, a: 1 })
223:     const sig2 = makeToolSignature("edit", { a: 1, b: 2 })
224:     expect(sig1).toBe(sig2)
225:   })
226: 
227:   it("handles unserializable args gracefully", () => {
228:     const circular: Record<string, unknown> = {}
229:     circular.self = circular
230:     const sig = makeToolSignature("bash", circular)
231:     expect(sig).toBe("bash:<unserializable>")
232:   })
233: 
234:   it("handles null args", () => {
235:     expect(makeToolSignature("read", null)).toBe("read:null")
236:   })
237: 
238:   it("handles undefined args", () => {
239:     expect(makeToolSignature("read", undefined)).toBe("read:undefined")
240:   })
241: })
242: 
243: describe("getPromptToolCompatibility", () => {
244:   it("maps ask rules to {permission: false}", () => {
245:     const rules: PermissionRule[] = [
246:       { permission: "edit", pattern: "*", action: "ask" },
247:       { permission: "write", pattern: "*", action: "ask" },
248:     ]
249:     const result = getPromptToolCompatibility(rules)
250:     expect(result).toEqual({ edit: false, write: false })
251:   })
252: 
253:   it("ignores allow rules", () => {
254:     const rules: PermissionRule[] = [
255:       { permission: "read", pattern: "*", action: "allow" },
256:       { permission: "edit", pattern: "*", action: "ask" },
257:     ]
258:     const result = getPromptToolCompatibility(rules)
259:     expect(result).toEqual({ edit: false })
260:   })
261: 
262:   it("returns undefined when no ask rules exist", () => {
263:     const rules: PermissionRule[] = [
264:       { permission: "read", pattern: "*", action: "allow" },
265:     ]
266:     expect(getPromptToolCompatibility(rules)).toBeUndefined()
267:   })
268: 
269:   it("returns undefined for empty rules array", () => {
270:     expect(getPromptToolCompatibility([])).toBeUndefined()
271:   })
272: })
273: 
274: describe("buildPromptText", () => {
275:   const baseArgs = {
276:     description: "Fix the bug",
277:     prompt: "Update the handler to validate input",
278:   }
279: 
280:   it("produces structured prompt with all sections", () => {
281:     const result = buildPromptText(baseArgs)
282:     expect(result).toContain("TASK: Fix the bug")
283:     expect(result).toContain("Update the handler to validate input")
284:     expect(result).toContain("EXPECTED OUTCOME:")
285:     expect(result).toContain("REQUIRED TOOLS:")
286:     expect(result).toContain("MUST DO:")
287:     expect(result).toContain("MUST NOT DO:")
288:     expect(result).toContain("CONTEXT:")
289:   })
290: 
291:   it("uses default expected outcome when guidanceText not provided", () => {
292:     const result = buildPromptText(baseArgs)
293:     expect(result).toContain(
294:       "EXPECTED OUTCOME: Complete the task as described"
295:     )
296:   })
297: 
298:   it("uses custom guidanceText when provided", () => {
299:     const result = buildPromptText({
300:       ...baseArgs,
301:       guidanceText: "All tests must pass",
302:     })
303:     expect(result).toContain("EXPECTED OUTCOME: All tests must pass")
304:   })
305: 
306:   it("includes requiredTools when provided", () => {
307:     const result = buildPromptText({
308:       ...baseArgs,
309:       requiredTools: ["read", "glob", "grep"],
310:     })
311:     expect(result).toContain("REQUIRED TOOLS: read, glob, grep")
312:   })
313: 
314:   it("defaults requiredTools to empty when not provided", () => {
315:     const result = buildPromptText(baseArgs)
316:     expect(result).toContain("REQUIRED TOOLS: ")
317:   })
318: 
319:   it("includes mustNotDo items when provided", () => {
320:     const result = buildPromptText({
321:       ...baseArgs,
322:       mustNotDo: ["edit", "write"],
323:     })
324:     expect(result).toContain("MUST NOT DO:")
325:     expect(result).toContain("- edit")
326:     expect(result).toContain("- write")
327:   })
328: 
329:   it("shows 'None specified' when mustNotDo is empty", () => {
330:     const result = buildPromptText({
331:       ...baseArgs,
332:       mustNotDo: [],
333:     })
334:     expect(result).toContain("MUST NOT DO: None specified")
335:   })
336: 
337:   it("includes constraints in MUST DO section", () => {
338:     const result = buildPromptText({
339:       ...baseArgs,
340:       constraints: ["Use TypeScript strict mode", "Add error handling"],
341:     })
342:     expect(result).toContain("MUST DO:")
343:     expect(result).toContain("- Use TypeScript strict mode")
344:     expect(result).toContain("- Add error handling")
345:   })
346: 
347:   it("uses default MUST DO when no constraints provided", () => {
348:     const result = buildPromptText(baseArgs)
349:     expect(result).toContain(
350:       "MUST DO: Follow the task instructions precisely"
351:     )
352:   })
353: 
354:   it("includes scope and category in context", () => {
355:     const result = buildPromptText({
356:       ...baseArgs,
357:       scope: "src/lib/",
358:       category: "implementation",
359:     })
360:     expect(result).toContain("CONTEXT:")
361:     expect(result).toContain("scope: src/lib/")
362:     expect(result).toContain("category: implementation")
363:   })
364: 
365:   it("includes agent in context", () => {
366:     const result = buildPromptText({
367:       ...baseArgs,
368:       agent: "researcher",
369:     })
370:     expect(result).toContain("agent: researcher")
371:   })
372: 
373:   it("defaults agent to builder when not provided", () => {
374:     const result = buildPromptText(baseArgs)
375:     expect(result).toContain("agent: builder")
376:   })
377: 
378:   it("sections are separated by ---", () => {
379:     const result = buildPromptText(baseArgs)
380:     const parts = result.split("\n---\n")
381:     expect(parts.length).toBe(6)
382:   })
383: })
384: 
385: describe("buildPromptText with session context", () => {
386:   it("appends session context section when provided", () => {
387:     const result = buildPromptText({
388:       description: "Test task",
389:       prompt: "Do the thing",
390:       sessionContext: "## What Happened\nSession started.",
391:     })
392: 
393:     expect(result).toContain("## Session Context")
394:     expect(result).toContain("## What Happened")
395:     expect(result).toContain("Session started.")
396:   })
397: 
398:   it("omits session context section when not provided", () => {
399:     const result = buildPromptText({
400:       description: "Test task",
401:       prompt: "Do the thing",
402:     })
403: 
404:     expect(result).not.toContain("## Session Context")
405:   })
406: 
407:   it("places session context after all other sections", () => {
408:     const result = buildPromptText({
409:       description: "Task",
410:       prompt: "Do it",
411:       scope: "src/",
412:       sessionContext: "## Session State\nActive",
413:     })
414: 
415:     const sessionIndex = result.indexOf("## Session Context")
416:     const contextIndex = result.indexOf("CONTEXT:")
417:     expect(sessionIndex).toBeGreaterThan(contextIndex)
418:   })
419: 
420:   it("passes session content through constraints", () => {
421:     const result = buildPromptText({
422:       description: "Patch session",
423:       prompt: "Update the file",
424:       constraints: [
425:         "session context: ## What Happened\nSession initialized.\n## Risks\nNone yet.",
426:       ],
427:     })
428: 
429:     expect(result).toContain("MUST DO:")
430:     expect(result).toContain("session context:")
431:     expect(result).toContain("## What Happened")
432:     expect(result).toContain("Session initialized.")
433:   })
434: 
435:   it("combines sessionContext param with other constraints", () => {
436:     const result = buildPromptText({
437:       description: "Lane analysis",
438:       prompt: "Analyze the prompt",
439:       constraints: ["Read-only analysis", "No file writes"],
440:       sessionContext: "## What Happened\nSkim complete.",
441:     })
442: 
443:     expect(result).toContain("Read-only analysis")
444:     expect(result).toContain("No file writes")
445:     expect(result).toContain("## Session Context")
446:     expect(result).toContain("Skim complete.")
447: 
448:     // Verify ordering: constraints in MUST DO, session context at end
449:     const mustDoIndex = result.indexOf("MUST DO:")
450:     const sessionIndex = result.indexOf("## Session Context")
451:     expect(sessionIndex).toBeGreaterThan(mustDoIndex)
452:   })
453: })
454: 
455: describe("extractAssistantText", () => {
456:   it("returns the last assistant message text when info.role === 'assistant'", () => {
457:     const messages = [
458:       { role: "user", parts: [{ type: "text", text: "hello" }] },
459:       { info: { role: "assistant" }, parts: [{ type: "text", text: "first response" }] },
460:       { info: { role: "assistant" }, parts: [{ type: "text", text: "last response" }] },
461:     ]
462:     expect(extractAssistantText(messages)).toBe("last response")
463:   })
464: 
465:   it("falls back to top-level role when info.role is missing", () => {
466:     const messages = [
467:       { role: "user", parts: [{ type: "text", text: "hello" }] },
468:       { role: "assistant", parts: [{ type: "text", text: "fallback response" }] },
469:     ]
470:     expect(extractAssistantText(messages)).toBe("fallback response")
471:   })
472: 
473:   it("joins only type=text parts and trims the final string", () => {
474:     const messages = [
475:       {
476:         info: { role: "assistant" },
477:         parts: [
478:           { type: "text", text: "hello " },
479:           { type: "tool-use", text: "ignored" },
480:           { type: "text", text: " world " },
481:         ],
482:       },
483:     ]
484:     expect(extractAssistantText(messages)).toBe("hello  world")
485:   })
486: 
487:   it("returns an empty string when no assistant message exists", () => {
488:     const messages = [
489:       { role: "user", parts: [{ type: "text", text: "hello" }] },
490:       { role: "system", parts: [{ type: "text", text: "system msg" }] },
491:     ]
492:     expect(extractAssistantText(messages)).toBe("")
493:   })
494: 
495:   it("returns empty string for empty messages array", () => {
496:     expect(extractAssistantText([])).toBe("")
497:   })
498: 
499:   it("returns empty string when assistant message has no parts array", () => {
500:     const messages = [
501:       { info: { role: "assistant" } },
502:     ]
503:     expect(extractAssistantText(messages)).toBe("")
504:   })
505: })

(End of file - total 505 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/tests/AGENTS.md
# Tests and Verification Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`tests/` is the Tests/Verification sector for Vitest unit, schema, hook, tool, CLI, sidecar, plugin, and integration tests that mirror the `src/` Hard Harness structure. Source evidence: `.planning/codebase/STRUCTURE.md:53-62`, `.planning/codebase/STRUCTURE.md:141-145`, `.planning/codebase/TESTING.md:50-75`.

## 2. Allowed mutation authority

- Test files may be added or updated to mirror source changes under `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`, `tests/cli/`, `tests/plugins/`, `tests/sidecar/`, and `tests/integration/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Tests may use Vitest globals, mocks, spies, fixtures, and factories to prove behavior of source contracts. Evidence: `.planning/codebase/TESTING.md:76-213`.
- Coverage configuration and thresholds are verification policy surfaces and require explicit audit amendments before lowering. Evidence: `.planning/codebase/TESTING.md:12-40`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tests SHALL NOT be used to mutate runtime state outside controlled fixtures/temp directories.
- Mocked/unit-only evidence SHALL NOT be claimed as integration or runtime readiness proof. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:30-37`, `.planning/ROADMAP.md:47-49`.
- Do not lower coverage thresholds without an explicit audit amendment. Evidence: `.planning/codebase/TESTING.md:36-40`.
- Do not add tests that assert implementation details while bypassing public contracts unless the tested module is explicitly internal and the test names that boundary.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Builders/fixers | Prove behavior after source changes | Must run relevant tests before completion claims |
| Reviewers/gates | Assess regression and evidence sufficiency | Must classify evidence level honestly |
| Runtime/source sectors | Receive mirrored test coverage | Tests do not own production behavior |
| Human reviewers | Decide whether evidence is enough for readiness | Integration readiness requires non-mocked integration/live proof |

## 5. Naming and placement conventions

- Test files mirror source names with `.test.ts` suffix. Evidence: `.planning/codebase/TESTING.md:66-69`, `.planning/codebase/STRUCTURE.md:186-195`.
- Test directories mirror source sectors: `tests/lib/` → `src/` runtime modules, `tests/tools/` → `src/tools/`, `tests/hooks/` → `src/hooks/`, `tests/schema-kernel/` → `src/schema-kernel/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Use descriptive lowercase `it()` names and one behavior per test. Evidence: `.planning/codebase/TESTING.md:104-110`.

## 6. Quality gates and evidence expectations

- Standard commands: `npm test`, `npm run test:coverage`, single-file `npx vitest run tests/...`, and name-filtered `npx vitest run -t "<test name>"`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Current testing baseline and failures must be reported honestly; as of the source map, 1,765/1,767 tests pass with 2 known session-journal taxonomy failures. Evidence: `.planning/codebase/TESTING.md:70-75`.
- Runtime readiness requires L1-L3 evidence beyond docs-only or mocked unit proof; tests alone must be classified by level and scope.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/tools/delegate-task.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/completion-detector.test.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/tests/lib/completion-detector.test.ts</path>
<type>file</type>
<content>
1: import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
2: import { CompletionDetector } from "../../src/coordination/completion/detector.js"
3: import type { CompletionResult } from "../../src/coordination/completion/detector.js"
4: 
5: describe("CompletionDetector", () => {
6:   let detector: CompletionDetector
7: 
8:   beforeEach(() => {
9:     vi.useFakeTimers()
10:     detector = new CompletionDetector(100)
11:   })
12: 
13:   afterEach(() => {
14:     vi.useRealTimers()
15:   })
16: 
17:   // --- feed → watch ---
18:   describe("feed + watch", () => {
19:     it("resolves with idle when session.idle is fed", async () => {
20:       const resultPromise = detector.watch("ses_1", 5000)
21:       detector.feed("session.idle", "ses_1")
22: 
23:       await expect(resultPromise).resolves.toEqual({
24:         signal: "idle",
25:         sessionID: "ses_1",
26:       })
27:     })
28: 
29:     it("does not accept reversed feed arguments that hide call-site ordering bugs", async () => {
30:       const resultPromise = detector.watch("ses_real", 50)
31:       detector.feed("ses_real", "session.idle")
32:       vi.advanceTimersByTime(60)
33: 
34:       await expect(resultPromise).resolves.toEqual({
35:         signal: "timeout",
36:         sessionID: "ses_real",
37:       })
38:     })
39: 
40:     it("resolves with error when session.error is fed", async () => {
41:       const resultPromise = detector.watch("ses_1", 5000)
42:       detector.feed("session.error", "ses_1", "oops")
43: 
44:       await expect(resultPromise).resolves.toEqual({
45:         signal: "error",
46:         sessionID: "ses_1",
47:         error: "oops",
48:       })
49:     })
50: 
51:     it("resolves with deleted when session.deleted is fed", async () => {
52:       const resultPromise = detector.watch("ses_1", 5000)
53:       detector.feed("session.deleted", "ses_1")
54: 
55:       await expect(resultPromise).resolves.toEqual({
56:         signal: "deleted",
57:         sessionID: "ses_1",
58:       })
59:     })
60:   })
61: 
62:   // --- cache before watch ---
63:   describe("cache before watch", () => {
64:     it("does not cache external idle events before a watcher exists", async () => {
65:       detector.feed("session.idle", "ses_1")
66: 
67:       const resultPromise = detector.watch("ses_1", 50)
68:       vi.advanceTimersByTime(60)
69: 
70:       await expect(resultPromise).resolves.toEqual({
71:         signal: "timeout",
72:         sessionID: "ses_1",
73:       })
74:     })
75: 
76:     it("returns cached error result when feed arrives before watch", async () => {
77:       detector.feed("session.error", "ses_1", "crash")
78: 
79:       const result = await detector.watch("ses_1", 5000)
80:       expect(result).toEqual({
81:         signal: "error",
82:         sessionID: "ses_1",
83:         error: "crash",
84:       })
85:     })
86: 
87:     it("still caches idle results produced by the internal stability timer", async () => {
88:       detector.feedMessageCount("ses_2", 5)
89:       vi.advanceTimersByTime(100)
90: 
91:       const result = await detector.watch("ses_2", 5000)
92:       expect(result).toEqual({
93:         signal: "idle",
94:         sessionID: "ses_2",
95:       })
96:     })
97:   })
98: 
99:   // --- timeout ---
100:   describe("timeout", () => {

(Showing lines 1-100 of 337. Use offset=101 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: import { z } from "zod"
3: 
4: import type { DelegationManager } from "../../coordination/delegation/manager.js"
5: import { renderToolResult } from "../../shared/tool-helpers.js"
6: import { error, success } from "../../shared/tool-response.js"
7: 
8: const DelegateTaskInputSchema = z.object({
9:   agent: z.string().min(1, "agent is required").describe("Agent name to delegate to"),
10:   prompt: z.string().min(1, "prompt is required").describe("The task prompt to send to the delegated agent"),
11:   title: z.string().min(1).optional().describe("Optional title for the child session"),
12:   safetyCeilingMs: z.number().min(60000).max(3600000).optional().describe("Safety ceiling in milliseconds (max runtime, 1-60 min)"),
13: })
14: 
15: type DelegateTaskInput = z.infer<typeof DelegateTaskInputSchema>
16: 
17: /** @internal Runtime context injected by the OpenCode plugin framework. NOT available in non-OpenCode environments. */
18: type ToolContext = {
19:   sessionID?: string
20:   directory?: string
21:   worktree?: string
22: }
23: 
24: function isOpenCodeRuntimeAvailable(): boolean {
25:   return !!(process.env.OPENCODE_SESSION_ID || process.env.OPENCODE_HARNESS_STATE_DIR)
26: }
27: 
28: export function createDelegateTaskTool(
29:   delegationManager: DelegationManager,
30: ): ReturnType<typeof tool> {
31:   const s = tool.schema
32: 
33:   return tool({
34:     description:
35:       "[REQUIRES OpenCode RUNTIME] Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (always-background WaiterModel). This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework. In non-OpenCode environments, use the native task/subagent dispatch mechanism instead.",
36:     args: {
37:       agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
38:       prompt: s.string().describe("Task prompt to send to the delegated agent"),
39:       title: s.string().optional().describe("Optional title for the child session"),
40:       safetyCeilingMs: s.number().optional().describe("Safety ceiling in milliseconds (max runtime)"),
41:     },
42:     async execute(rawArgs: DelegateTaskInput, context: ToolContext): Promise<string> {
43:       const args = DelegateTaskInputSchema.parse(rawArgs)
44: 
45:       // R-RUNTIME-01: Honest runtime detection — this tool requires OpenCode plugin context
46:       const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID
47:       if (!parentSessionId) {
48:         const hasOpenCodeEnv = isOpenCodeRuntimeAvailable()
49:         const message = hasOpenCodeEnv
50:           ? "[Harness] Missing parent session ID for delegate-task. Context.sessionID and OPENCODE_SESSION_ID are both unavailable. This indicates a framework-level context injection failure."
51:           : "[Harness] delegate-task requires an OpenCode plugin runtime environment. sessionID context injection and OPENCODE_SESSION_ID are unavailable. In non-OpenCode environments, use the native task/subagent tool for delegation instead."
52:         return renderToolResult(error(message))
53:       }
54: 
55:       try {
56:         const result = await delegationManager.dispatch({
57:           parentSessionId,
58:           agent: args.agent,
59:           prompt: args.prompt,
60:           title: args.title,
61:           safetyCeilingMs: args.safetyCeilingMs,
62:           workingDirectory: context.directory,
63:           worktree: context.worktree,
64:         })
65: 
66:         return renderToolResult(success(`Delegation dispatched to ${args.agent}`, result))
67:       } catch (caughtError) {
68:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
69:         return renderToolResult(error(message))
70:       }
71:     },
72:   })
73: }
74: 
75: export { DelegateTaskInputSchema }

(End of file - total 75 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/tools/delegation/AGENTS.md
# Delegation Tools Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/tools/delegation/` owns write-side OpenCode tool entrypoints for session/task delegation. `delegate-task.ts` dispatches delegated work through the coordination layer. `delegation-status.ts` polls delegation state for completion signals. Validation lives at the tool boundary; orchestration logic lives in `src/coordination/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:87-113`, `.planning/codebase/STRUCTURE.md:104-108`.

Delegation uses `DelegationManager` (WaiterModel dispatch + dual-signal completion) from `src/coordination/delegation/manager.ts`. Architecture: `.planning/codebase/ARCHITECTURE.md:87-113`. Classification: Hard Harness — write-side tools calling coordination layer. `.opencode/` agents trigger delegation via these tools but never own delegation logic.

## 2. Allowed mutation authority

- Tools may parse input via Zod schemas and render standardized responses with `src/shared/`.
- Tools may call delegation managers and SDK wrappers when the tool contract requires it.
- Tools may write delegation records through approved coordination state owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tools SHALL NOT bypass schema validation for agent-provided input.
- Tools SHALL NOT write internal runtime state into `.opencode/`; state writes go through `.hivemind/` owners. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Tools SHALL NOT duplicate orchestration logic that belongs in `src/coordination/`.
- Tools SHALL NOT register themselves; `src/plugin.ts` owns registration. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Agents and commands | Invoke delegation tools during workflows | Must pass schema-valid inputs |
| `src/coordination/delegation/` | Owns delegation manager logic | Tools call coordination; tools do not duplicate logic |
| `src/shared/` | Provides response envelope rendering | Shared stays leaf |
| Tests | Validate delegation dispatch and status polling | Integration claims require integration evidence |

## 5. Naming and placement conventions

- Tool files use `kebab-case.ts`: `delegate-task.ts`, `delegation-status.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:221-224`.
- Schemas belong in `src/schema-kernel/` when validation is needed.
- Tests live under `tests/tools/delegation/`. Source evidence: `.planning/codebase/TESTING.md:52-64`.

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
  "filePath": "/Users/apple/hivemind-plugin-private/src/schema-kernel/agent-frontmatter.schema.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/schema-kernel/agent-frontmatter.schema.ts</path>
<type>file</type>
<content>
1: import { z } from "zod"
2: 
3: export const AGENT_FRONTMATTER_SCHEMA_VERSION = "1.0.0"
4: 
5: // ---------------------------------------------------------------------------
6: // 1. Agent Name Validation
7: // ---------------------------------------------------------------------------
8: 
9: /**
10:  * Validates an OpenCode agent file name: 1–64 chars, lowercase alphanumeric
11:  * with single hyphen separators. No leading/trailing hyphens, no consecutive
12:  * hyphens. Matches: my-agent, researcher, gsd-code-fixer.
13:  */
14: export const AgentNameSchema = z
15:   .string()
16:   .min(1)
17:   .max(64)
18:   .regex(
19:     /^[a-z0-9]+(-[a-z0-9]+)*$/,
20:     "Agent name must be lowercase alphanumeric with single hyphen separators, no leading/trailing/consecutive hyphens",
21:   )
22: 
23: export type AgentName = z.infer<typeof AgentNameSchema>
24: 
25: // ---------------------------------------------------------------------------
26: // 2. Agent Mode
27: // ---------------------------------------------------------------------------
28: 
29: /**
30:  * Determines when the agent is available:
31:  * - "primary" → top-level conversations only
32:  * - "subagent" → delegated sub-sessions only
33:  * - "all" → both (default)
34:  */
35: export const AgentModeEnum = z.enum(["primary", "subagent", "all"])
36: 
37: export type AgentMode = z.infer<typeof AgentModeEnum>
38: 
39: // ---------------------------------------------------------------------------
40: // 3. Agent Frontmatter — YAML frontmatter of an agent .md file
41: // ---------------------------------------------------------------------------
42: 
43: /**
44:  * Known theme color names accepted by the OpenCode color field.
45:  * Agents may use these named colors instead of hex codes.
46:  */
47: const THEME_COLOR_NAMES = [
48:   "blue",
49:   "green",
50:   "red",
51:   "yellow",
52:   "purple",
53:   "cyan",
54:   "magenta",
55:   "orange",
56:   "pink",
57:   "teal",
58: ] as const
59: 
60: /**
61:  * Validates a color value: either a hex color code (#RGB or #RRGGBB) or
62:  * a known theme color name.
63:  */
64: const ColorSchema = z.string().refine(
65:   (val) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val) ||
66:     THEME_COLOR_NAMES.includes(val as (typeof THEME_COLOR_NAMES)[number]),
67:   {
68:     message: `Must be a hex color (#RGB or #RRGGBB) or a theme color name (${THEME_COLOR_NAMES.join(", ")})`,
69:   },
70: )
71: 
72: /**
73:  * OpenCode agent YAML frontmatter schema. Only `description` is strictly
74:  * required. Includes backward-compatible deprecated fields (tools, maxSteps)
75:  * with deprecation-tracking refines that always pass validation.
76:  */
77: export const AgentFrontmatterSchema = z
78:   .object({
79:     /** Human-readable agent description (triggers @ autocomplete) */
80:     description: z.string().min(1),

(Showing lines 1-80 of 168. Use offset=81 to continue.)
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

(Showing lines 1-80 of 267. Use offset=81 to continue.)
</content>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_vD1YuU1UNLmZmu6V8S0p7150"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/tool-helpers.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/state.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_x9YhCOMbRFmm1fE2HloO6431"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/helpers/in-memory-client.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/tests/lib/helpers/in-memory-client.ts</path>
<type>file</type>
<content>
1: import { vi } from "vitest"
2: 
3: import type { OpenCodeClient } from "../../../src/shared/session-api.js"
4: 
5: type SessionRecord = { id: string; status?: { type?: string } } & Record<string, unknown>
6: 
7: type InMemoryClient = OpenCodeClient & {
8:   _sessions: Map<string, SessionRecord>
9:   _messages: Map<string, unknown[]>
10:   _setStatus: (sessionID: string, type: string) => void
11:   _addMessage: (sessionID: string, message: unknown) => void
12:   _setGetSessionError: (error: Error | undefined) => void
13: }
14: 
15: export function createInMemoryClient(): InMemoryClient {
16:   const sessions = new Map<string, SessionRecord>()
17:   const messages = new Map<string, unknown[]>()
18:   let getSessionError: Error | undefined
19:   let nextID = 1
20:   const client = {
21:     session: {
22:       get: vi.fn(async ({ path }: { path: { id: string } }) => {
23:         if (getSessionError) throw getSessionError
24:         const session = sessions.get(path.id)
25:         if (!session) throw new Error(`[Harness] Session ${path.id} not found`)
26:         return { data: session }
27:       }),
28:       create: vi.fn(async ({ body }: { body: Record<string, unknown> }) => {
29:         const id = `ses_${nextID++}`
30:         const session = { id, status: { type: "idle" }, ...body }
31:         sessions.set(id, session)
32:         return { data: session }
33:       }),
34:       messages: vi.fn(async ({ path }: { path: { id: string } }) => ({ data: messages.get(path.id) ?? [] })),
35:       status: vi.fn(async () => ({
36:         data: Object.fromEntries(Array.from(sessions.entries()).map(([id, session]) => [id, { type: session.status?.type ?? "unknown" }])),
37:       })),
38:       prompt: vi.fn(async () => ({ data: {} })),
39:       promptAsync: vi.fn(async () => ({ status: 204 })),
40:       abort: vi.fn(async () => ({ data: {} })),
41:     },
42:     tui: { showToast: vi.fn() },
43:     _sessions: sessions,
44:     _messages: messages,
45:     _setStatus(sessionID: string, type: string) {
46:       const session = sessions.get(sessionID)
47:       if (session) session.status = { type }
48:     },
49:     _addMessage(sessionID: string, message: unknown) {
50:       messages.set(sessionID, [...(messages.get(sessionID) ?? []), message])
51:     },
52:     _setGetSessionError(error: Error | undefined) {
53:       getSessionError = error
54:     },
55:   }
56: 
57:   return client as InMemoryClient
58: }

(End of file - total 58 lines)
</content>
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_zy80E1Zryv5Ayxa0ffsv9999"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_bNGGynwaMg8AE1B8P9Fd1100"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/notification-handler.test.ts"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_9bH3b6FCbtwu2fs4Yiwi9811"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-doc.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-doc.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: 
3: import { executeDocIntelligenceAction } from "../../features/doc-intelligence/index.js"
4: import { DocIntelligenceInputSchema, type DocIntelligenceSchemaInput } from "../../schema-kernel/doc-intelligence.schema.js"
5: import { renderToolResult } from "../../shared/tool-helpers.js"
6: import { error, success } from "../../shared/tool-response.js"
7: 
8: type ToolContext = { sessionID?: string }
9: 
10: /**
11:  * Create the read-only document intelligence tool.
12:  *
13:  * @param projectRoot - Trusted project root used to scope every document path.
14:  * @returns OpenCode tool instance exposing skim, skim_directory, read, chunk, and search actions.
15:  *
16:  * @example
17:  * ```typescript
18:  * const hivemindDoc = createHivemindDocTool(process.cwd())
19:  * ```
20:  */
21: export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
22:   const s = tool.schema
23: 
24:   return tool({
25:     description: "Read-only document intelligence for Markdown skim, directory skim, read, chunk, and search actions.",
26:     args: {
27:       action: s.string().describe("Action: skim, skim_directory, read, chunk, or search"),
28:       path: s.string().describe("Project-root-relative Markdown file or directory path"),
29:       query: s.string().optional().describe("Search query for the search action"),
30:       maxCharacters: s.number().optional().describe("Maximum characters for read/chunk sizing"),
31:       maxResults: s.number().optional().describe("Maximum matches for search actions"),
32:     },
33:     async execute(rawArgs: DocIntelligenceSchemaInput, _context: ToolContext): Promise<string> {
34:       try {
35:         const args = DocIntelligenceInputSchema.parse(rawArgs)
36:         return renderToolResult(success("Doc intelligence action completed", executeDocIntelligenceAction(projectRoot, args)))
37:       } catch (caughtError) {
38:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
39:         return renderToolResult(error(message))
40:       }
41:     },
42:   })
43: }
44: 
45: export { DocIntelligenceInputSchema }

(End of file - total 45 lines)
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

</system-reminder>
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_yp1BGmRUNKgzPta01R7K1225"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/state.test.ts"
}
```

