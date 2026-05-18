# Wave B.1 completion detector impl (@hm-l2-build subagent)

**Session ID:** ses_1c3874453ffeGRBhy3A7VG9DFa
**Created:** 5/19/2026, 2:03:25 AM
**Updated:** 5/19/2026, 2:06:34 AM

---

## User

You are a subagent **hm-l2-build**, tasked with implementing Wave B.1 of the CP-DT-01-08 surgical remediation plan.

## YOUR TASK

Create TWO files:
1. `src/coordination/delegation/completion-detector.ts` — Semantic completion detector
2. `tests/lib/coordination/delegation/completion-detector.test.ts` — Comprehensive tests

## CONTEXT

There is already an event-based completion detector at `src/coordination/completion/detector.ts` — that one watches `session.idle`/`session.error`/`session.deleted` events with dual-signal watchers. DO NOT modify that file.

Your NEW file `src/coordination/delegation/completion-detector.ts` is a **semantic polling checker** — it inspects session messages and evaluates 3 specific conditions to determine if a delegated session has semantically completed its work. It is called by the delegation monitor during progressive polling cycles.

## WHAT TO BUILD

### File 1: `src/coordination/delegation/completion-detector.ts`

A pure-function module (no SDK dependency, no state) that evaluates 3 conditions from session message arrays:

**Condition 1 — Tool Activity Stall:** No tool_use parts in messages for >60 seconds. You track this by finding the timestamp of the last tool_use part and comparing to `now`. If the gap exceeds the threshold, tool activity is considered stalled.

**Condition 2 — Assistant Last Message Exists:** The last message in the array has role "assistant" with usable parts (non-empty parts array).

**Condition 3 — File Changes Detected:** At least one tool_result part in messages contains indicators of file mutation — look for patterns in text content like file paths (strings containing `/` with extensions), or tool names like `write`, `edit`, `create_file`, `bash` with file operations. Use heuristics that detect common file-change signatures in tool results.

**Completion = all 3 conditions are true.**

Export interface:
```typescript
export interface SemanticCompletionResult {
  toolActivityStalled: boolean
  hasAssistantMessage: boolean
  hasFileChanges: boolean
  isComplete: boolean
  lastToolActivityAt: number | null
  secondsSinceLastToolActivity: number | null
}

export interface SemanticCompletionOptions {
  toolIdleThresholdMs?: number  // default 60_000 (60s)
  now?: number                  // injectable for testing
}
```

Export these pure functions:
- `checkSemanticCompletion(messages: unknown[], options?: SemanticCompletionOptions): SemanticCompletionResult`
- `findLastToolActivity(messages: unknown[]): number | null` — returns timestamp of last tool_use part
- `hasAssistantLastMessage(messages: unknown[]): boolean`
- `hasFileChangeIndicators(messages: unknown[]): boolean`
- `getMessageRole(message: unknown): string | undefined` — re-export pattern from session-api
- `getMessageParts(message: unknown): unknown[]`

Use these helper patterns from `src/shared/session-api.ts` (copy the patterns, don't import — session-api imports SDK types):
- `getNestedValue(obj, path)` — access nested properties safely
- `asString(val)` — cast to string | undefined

Import these from `src/shared/helpers.ts`:
```typescript
import { asString, getNestedValue } from "../../shared/helpers.js"
```

Message shape (OpenCode SDK):
```
{
  info?: { role: "user" | "assistant" | "system" },
  role?: string,
  parts?: Array<{
    type: "text" | "tool_use" | "tool_result" | ...,
    text?: string,
    name?: string,       // tool name for tool_use
    input?: Record<string, unknown>,  // tool_use args
    output?: string,     // tool_result output
    timestamp?: number,  // optional timestamp
  }>,
  timestamp?: number,
}
```

JSDoc every exported function with description, params, return, and example. Keep the file under 250 LOC.

### File 2: `tests/lib/coordination/delegation/completion-detector.test.ts`

Test with vitest globals (no imports needed for describe/it/expect). Cover:
1. Empty messages → all conditions false
2. User-only messages → no assistant, no tools, no file changes
3. Assistant last message but no tools → hasAssistant=true, others false
4. Tool use but no stall (recent timestamp) → toolActivityStalled=false
5. Tool use stalled (old timestamp) → toolActivityStalled=true
6. File change indicators in tool_result → hasFileChanges=true
7. All 3 conditions met → isComplete=true
8. Custom toolIdleThresholdMs → respects override
9. Custom now injection → test time-dependent logic
10. Mixed message sequence with multiple tool_use and tool_result parts

Use helper to build mock messages:
```typescript
function mockMessage(role: string, parts: unknown[], timestamp?: number): Record<string, unknown>
function mockToolUse(name: string, input: Record<string, unknown>, timestamp?: number): Record<string, unknown>
function mockToolResult(output: string, timestamp?: number): Record<string, unknown>
function mockTextPart(text: string): Record<string, unknown>
```

## CONSTRAINTS
- TypeScript strict mode, no `any` types
- ESM imports with `.js` extensions
- `import type` for type-only imports
- No comments in code (clean code style)
- Max 250 LOC for source, max 200 LOC for tests
- Do NOT import from `src/shared/session-api.ts` (it has SDK types) — import helpers from `src/shared/helpers.ts` only
- Do NOT modify any existing files
- Keep functions pure — no SDK calls, no side effects, no state

## SUCCESS METRICS
1. `npm run typecheck` passes with the new file
2. `npx vitest run tests/lib/coordination/delegation/completion-detector.test.ts` — all tests pass
3. File under 250 LOC
4. All exported functions have JSDoc
5. No `any` types

## VERIFICATION
After creating both files, run:
```bash
npm run typecheck
npx vitest run tests/lib/coordination/delegation/completion-detector.test.ts
```

Report back: file paths, LOC count, typecheck result, test results (pass/fail count).

---

## Assistant (Hm-L2-Build · GLM-5.1 · 14.2s)

_Thinking:_

Let me understand the task clearly. I'm a subagent (hm-l2-build) tasked with creating two files for a semantic completion detector. Let me first check the existing codebase to understand the patterns and helpers available.

I am **subagent hm-l2-build**, implementing Wave B.1 of CP-DT-01-08. I must create the semantic completion detector and its tests. Let me first examine the existing helpers and patterns.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/helpers.ts"
}
```

**Output:**
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

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/completion/detector.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/coordination/completion/detector.ts</path>
<type>file</type>
<content>
1: import type { DelegationResult, DelegationStatus } from "../delegation/types.js"
2: 
3: export type CompletionSignal = "idle" | "error" | "deleted" | "timeout" | "cancelled"
4: 
5: export type CompletionResult = {
6:   signal: CompletionSignal
7:   sessionID: string
8:   error?: string
9: }
10: 
11: type Watcher = {
12:   resolve: (result: CompletionResult) => void
13:   timeoutId: ReturnType<typeof setTimeout>
14: }
15: 
16: type DualSignalWatcher = {
17:   callback: (result: DelegationResult) => void
18:   completionResult?: DelegationResult
19:   fired: boolean
20:   gotCompletionEvent: boolean
21:   terminalStatus?: DelegationStatus
22: }
23: 
24: const TERMINAL_EVENTS: Record<string, CompletionSignal> = {
25:   "session.idle": "idle",
26:   "session.error": "error",
27:   "session.deleted": "deleted",
28: }
29: 
30: export class CompletionDetector {
31:   private watchers = new Map<string, Watcher>()
32:   private cachedResults = new Map<string, CompletionResult>()
33:   private dualSignalWatchers = new Map<string, DualSignalWatcher>()
34:   private messageCounts = new Map<string, number>()
35:   private stabilityTimers = new Map<string, ReturnType<typeof setTimeout>>()
36: 
37:   constructor(private readonly stabilityTimeoutMs: number = 30000) {}
38: 
39:   feed(eventType: string, sessionID: string | undefined, error?: string): void {
40:     if (!sessionID) {
41:       return
42:     }
43: 
44:     const signal = TERMINAL_EVENTS[eventType]
45:     if (!signal) {
46:       return
47:     }
48: 
49:     const result: CompletionResult = { signal, sessionID }
50:     if (signal === "error" && error) {
51:       result.error = error
52:     }
53: 
54:     this.clearStabilityTimer(sessionID)
55: 
56:     const watcher = this.watchers.get(sessionID)
57:     if (watcher) {
58:       clearTimeout(watcher.timeoutId)
59:       this.watchers.delete(sessionID)
60:       watcher.resolve(result)
61:     } else {
62:       if (signal !== "idle") {
63:         this.cachedResults.set(sessionID, result)
64:       }
65:     }
66:   }
67: 
68:   async watch(sessionID: string, timeoutMs: number): Promise<CompletionResult> {
69:     const cached = this.cachedResults.get(sessionID)
70:     if (cached) {
71:       this.cachedResults.delete(sessionID)
72:       return cached
73:     }
74: 
75:     return new Promise<CompletionResult>((resolve) => {
76:       const timeoutId = setTimeout(() => {
77:         this.watchers.delete(sessionID)
78:         resolve({ signal: "timeout", sessionID })
79:       }, timeoutMs)
80: 
81:       this.watchers.set(sessionID, { resolve, timeoutId })
82:     })
83:   }
84: 
85:   /**
86:    * Watches a WaiterModel delegation until both native completion and terminal status signals arrive.
87:    *
88:    * @param delegationId - Delegation record identifier used by the coordination layer
89:    * @param childSessionId - Child session associated with the delegated native Task execution
90:    * @param callback - Callback invoked exactly once after both completion signals are present
91:    */
92:   watchDualSignal(delegationId: string, _childSessionId: string, callback: (result: DelegationResult) => void): void {
93:     this.dualSignalWatchers.set(delegationId, {
94:       callback,
95:       fired: false,
96:       gotCompletionEvent: false,
97:     })
98:   }
99: 
100:   /** Marks that native Task completion was observed for a delegation. */
101:   signalCompletionEvent(delegationId: string, result?: DelegationResult): void {
102:     const watcher = this.dualSignalWatchers.get(delegationId)
103:     if (!watcher) return
104:     watcher.gotCompletionEvent = true
105:     watcher.completionResult = this.mergeCompletionResult(watcher.completionResult, result)
106:     this.fireDualSignalIfReady(delegationId, watcher)
107:   }
108: 
109:   /** Marks the latest lifecycle status for a delegation, completing only for terminal statuses. */
110:   signalTerminalStatus(delegationId: string, status: DelegationStatus): void {
111:     const watcher = this.dualSignalWatchers.get(delegationId)
112:     if (!watcher || !this.isTerminalStatus(status)) return
113:     watcher.terminalStatus = status
114:     this.fireDualSignalIfReady(delegationId, watcher)
115:   }
116: 
117:   /** Clears standard and WaiterModel completion state for the provided watcher key. */
118:   unwatch(key: string): void {
119:     const watcher = this.watchers.get(key)
120:     if (watcher) {
121:       clearTimeout(watcher.timeoutId)
122:       this.watchers.delete(key)
123:     }
124:     this.dualSignalWatchers.delete(key)
125:   }
126: 
127:   /**
128:    * Non-destructively peeks at a cached terminal signal without consuming it.
129:    *
130:    * Used by the SDK polling loop (Phase 36.1 re-wiring) so a poll cycle can
131:    * look ahead without losing the cached result if it decides not to act.
132:    *
133:    * @param sessionID - Child session ID being polled.
134:    * @returns The cached `CompletionResult`, or `undefined` if none is cached.
135:    */
136:   peekCachedResult(sessionID: string): CompletionResult | undefined {
137:     return this.cachedResults.get(sessionID)
138:   }
139: 
140:   /**
141:    * Consumes (reads + clears) a cached terminal signal for the given session.
142:    *
143:    * Used by the SDK polling loop (Phase 36.1 re-wiring) when a cached signal
144:    * has been acted on and should not fire a second time. Idempotent: returns
145:    * `undefined` if there is no cached result, or if a previous call already
146:    * consumed it.
147:    *
148:    * @param sessionID - Child session ID being polled.
149:    * @returns The previously cached `CompletionResult`, or `undefined`.
150:    */
151:   consumeCachedResult(sessionID: string): CompletionResult | undefined {
152:     const cached = this.cachedResults.get(sessionID)
153:     if (!cached) return undefined
154:     this.cachedResults.delete(sessionID)
155:     return cached
156:   }
157: 
158:   cancel(sessionID: string): void {
159:     this.clearStabilityTimer(sessionID)
160: 
161:     const watcher = this.watchers.get(sessionID)
162:     if (watcher) {
163:       clearTimeout(watcher.timeoutId)
164:       this.watchers.delete(sessionID)
165:       watcher.resolve({ signal: "cancelled", sessionID })
166:     } else {
167:       this.cachedResults.set(sessionID, { signal: "cancelled", sessionID })
168:     }
169:   }
170: 
171:   feedMessageCount(sessionID: string, count: number): void {
172:     if (count == null || !Number.isFinite(count) || count < 0) return  // Bug F3: graceful no-op
173:     const prev = this.messageCounts.get(sessionID)
174:     this.messageCounts.set(sessionID, count)
175: 
176:     if (prev === undefined) {
177:       this.startStabilityTimer(sessionID)
178:     } else if (prev !== count) {
179:       this.clearStabilityTimer(sessionID)
180:       this.startStabilityTimer(sessionID)
181:     }
182:   }
183: 
184:   private startStabilityTimer(sessionID: string): void {
185:     const timerId = setTimeout(() => {
186:       this.stabilityTimers.delete(sessionID)
187:       this.messageCounts.delete(sessionID)
188: 
189:       const watcher = this.watchers.get(sessionID)
190:       if (watcher) {
191:         clearTimeout(watcher.timeoutId)
192:         this.watchers.delete(sessionID)
193:         watcher.resolve({ signal: "idle", sessionID })
194:       } else {
195:         this.cachedResults.set(sessionID, { signal: "idle", sessionID })
196:       }
197:     }, this.stabilityTimeoutMs)
198: 
199:     this.stabilityTimers.set(sessionID, timerId)
200:   }
201: 
202:   private clearStabilityTimer(sessionID: string): void {
203:     const timerId = this.stabilityTimers.get(sessionID)
204:     if (timerId) {
205:       clearTimeout(timerId)
206:       this.stabilityTimers.delete(sessionID)
207:     }
208:     this.messageCounts.delete(sessionID)
209:   }
210: 
211:   private fireDualSignalIfReady(delegationId: string, watcher: DualSignalWatcher): void {
212:     if (watcher.fired || !watcher.gotCompletionEvent || !watcher.terminalStatus) return
213:     watcher.fired = true
214:     watcher.callback({ ...watcher.completionResult, delegationId, status: watcher.terminalStatus })
215:   }
216: 
217:   private mergeCompletionResult(previous: DelegationResult | undefined, next: DelegationResult | undefined): DelegationResult | undefined {
218:     if (!previous) return next
219:     if (!next) return previous
220:     return { ...previous, ...next }
221:   }
222: 
223:   private isTerminalStatus(status: DelegationStatus): boolean {
224:     return status === "completed" || status === "error" || status === "timeout"
225:   }
226: }

(End of file - total 226 lines)
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

---

## Assistant (Hm-L2-Build · GLM-5.1 · 13.6s)

_Thinking:_

Good. I now have the context I need. Let me check existing delegation directory to understand placement, and look at the delegation types for reference.

Now let me check the delegation directory structure and the delegation types file:

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/coordination/delegation/*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/coordination/delegation/sdk-child-session-starter.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/agent-resolver.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager-runtime.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/state-machine.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/types.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/manager.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/coordinator.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/dispatcher.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/monitor.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/notification-router.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/escalation-timer.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/slot-manager.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/survival-kit.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/retry-handler.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/resume-resolver.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/lifecycle.ts
/Users/apple/hivemind-plugin-private/src/coordination/delegation/AGENTS.md
/Users/apple/hivemind-plugin-private/src/coordination/delegation/.gitkeep
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/coordination/delegation</path>
<type>directory</type>
<entries>
.gitkeep
agent-resolver.ts
AGENTS.md
coordinator.ts
dispatcher.ts
escalation-timer.ts
lifecycle.ts
manager-runtime.ts
manager.ts
monitor.ts
notification-router.ts
resume-resolver.ts
retry-handler.ts
sdk-child-session-starter.ts
slot-manager.ts
state-machine.ts
survival-kit.ts
types.ts

(18 entries)
</entries>
```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 9.2s)

Good. The delegation directory exists. Let me also check the test directory exists and the tsconfig for import style:

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la /Users/apple/hivemind-plugin-private/tests/lib/coordination/delegation/ 2>/dev/null || echo \"DIR_NOT_FOUND\"",
  "description": "Check test directory exists"
}
```

**Output:**
```
total 104
drwxr-xr-x  10 apple  staff    320 May 18 21:50 .
drwxr-xr-x   4 apple  staff    128 May 18 04:57 ..
-rw-r--r--   1 apple  staff   1552 May 18 21:50 agent-resolver.test.ts
-rw-r--r--   1 apple  staff  13450 May 18 22:28 coordinator.test.ts
-rw-r--r--   1 apple  staff   3640 May 18 21:50 dispatcher.test.ts
-rw-r--r--   1 apple  staff   3131 May 18 21:50 escalation-timer.test.ts
-rw-r--r--   1 apple  staff   7745 May 18 22:52 full-pipeline.test.ts
-rw-r--r--   1 apple  staff   2914 May 18 21:50 manager-decomposition.test.ts
-rw-r--r--   1 apple  staff   6947 May 18 22:53 notification-router.test.ts
-rw-r--r--   1 apple  staff   2894 May 18 22:26 slot-manager.test.ts

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tsconfig.json"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/tsconfig.json</path>
<type>file</type>
<content>
1: {
2:   "compilerOptions": {
3:     "target": "ES2022",
4:     "module": "NodeNext",
5:     "moduleResolution": "NodeNext",
6:     "lib": ["ES2022"],
7:     "outDir": "./dist",
8:     "rootDir": "./src",
9:     "declaration": true,
10:     "declarationMap": true,
11:     "sourceMap": true,
12:     "strict": true,
13:     "noUnusedLocals": true,
14:     "noUnusedParameters": true,
15:     "noImplicitReturns": true,
16:     "noFallthroughCasesInSwitch": true,
17:     "verbatimModuleSyntax": true,
18:     "skipLibCheck": true
19:   },
20:   "include": ["src/**/*"],
21:   "exclude": ["node_modules", "dist", "tests"]
22: }

(End of file - total 22 lines)
</content>
```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 53.9s)

_Thinking:_

Good, I have all the context. Now let me create both files. Let me note:

1. `verbatimModuleSyntax: true` — I must use `import type` for type-only imports
2. ESM with `.js` extensions in imports
3. `strict: true` — no `any` types
4. Import `asString` and `getNestedValue` from `../../shared/helpers.js`

Let me create the source file first, then the test file.

For the source file, I need:
- `SemanticCompletionResult` interface
- `SemanticCompletionOptions` interface
- `checkSemanticCompletion` - main function evaluating all 3 conditions
- `findLastToolActivity` - finds timestamp of last tool_use part
- `hasAssistantLastMessage` - checks last message is assistant with usable parts
- `hasFileChangeIndicators` - looks for file mutation indicators in tool_result parts
- `getMessageRole` - extracts role from message
- `getMessageParts` - extracts parts array from message

For file change detection heuristics:
- Tool names: `write`, `edit`, `create_file`, `bash` 
- File path patterns: strings containing `/` with extensions like `.ts`, `.js`, `.json`, etc.
- Look in tool_result parts' output text

Let me also think about the `findLastToolActivity` function. It needs to find the last `tool_use` part and return its timestamp. The message has `parts` array with parts that can have `type: "tool_use"` and a `timestamp`.

For `hasAssistantLastMessage`, I need to check if the last message has role "assistant" and non-empty parts.

For `hasFileChangeIndicators`, I need to scan all messages for `tool_result` parts that contain file mutation indicators.

Let me create the files now.

I have all the context needed. Now creating both files:

**Tool: write**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/coordination/delegation/completion-detector.ts",
  "content": "import { asString, getNestedValue } from \"../../shared/helpers.js\"\n\nexport interface SemanticCompletionResult {\n  toolActivityStalled: boolean\n  hasAssistantMessage: boolean\n  hasFileChanges: boolean\n  isComplete: boolean\n  lastToolActivityAt: number | null\n  secondsSinceLastToolActivity: number | null\n}\n\nexport interface SemanticCompletionOptions {\n  toolIdleThresholdMs?: number\n  now?: number\n}\n\nconst DEFAULT_TOOL_IDLE_MS = 60_000\n\nconst FILE_CHANGE_TOOL_NAMES = new Set([\n  \"write\",\n  \"edit\",\n  \"create_file\",\n  \"create_or_update_file\",\n  \"bash\",\n])\n\nconst FILE_PATH_PATTERN = /(?:^|[\\s\"'`])(?:\\/[\\w.\\-]+){2,}\\.\\w{1,10}(?:$|[\\s\"'`])/m\n\n/**\n * Extract the role from an OpenCode session message object.\n *\n * Checks `info.role` first (canonical SDK location), then falls back to\n * top-level `role`. Returns `undefined` when no role can be determined.\n *\n * @param message - Session message object of unknown shape.\n * @returns The role string (\"user\" | \"assistant\" | \"system\") or undefined.\n *\n * @example\n * getMessageRole({ info: { role: \"assistant\" }, parts: [] })\n * // \"assistant\"\n */\nexport function getMessageRole(message: unknown): string | undefined {\n  return (\n    asString(getNestedValue(message, [\"info\", \"role\"])) ??\n    asString(getNestedValue(message, [\"role\"]))\n  )\n}\n\n/**\n * Extract the parts array from an OpenCode session message object.\n *\n * @param message - Session message object of unknown shape.\n * @returns The parts array, or an empty array if not present or not an array.\n *\n * @example\n * getMessageParts({ parts: [{ type: \"text\", text: \"hi\" }] })\n * // [{ type: \"text\", text: \"hi\" }]\n */\nexport function getMessageParts(message: unknown): unknown[] {\n  const parts = getNestedValue(message, [\"parts\"])\n  return Array.isArray(parts) ? parts : []\n}\n\n/**\n * Find the timestamp of the last `tool_use` part across all messages.\n *\n * Iterates through all messages and their parts in order, returning the\n * `timestamp` field of the last part with `type === \"tool_use\"`. Falls back\n * to the parent message `timestamp` if the part itself lacks one.\n *\n * @param messages - Array of session message objects.\n * @returns Unix timestamp (ms) of the last tool_use, or null if none found.\n *\n * @example\n * findLastToolActivity([{ role: \"assistant\", parts: [\n *   { type: \"tool_use\", name: \"bash\", timestamp: 1000 }\n * ]}])\n * // 1000\n */\nexport function findLastToolActivity(messages: unknown[]): number | null {\n  let lastTimestamp: number | null = null\n  for (const message of messages) {\n    const parts = getMessageParts(message)\n    for (const part of parts) {\n      if (getNestedValue(part, [\"type\"]) !== \"tool_use\") {\n        continue\n      }\n      const partTs = getNestedValue(part, [\"timestamp\"])\n      const msgTs = getNestedValue(message, [\"timestamp\"])\n      const ts = typeof partTs === \"number\" ? partTs : typeof msgTs === \"number\" ? msgTs : null\n      if (ts !== null) {\n        lastTimestamp = ts\n      }\n    }\n  }\n  return lastTimestamp\n}\n\n/**\n * Check whether the last message in the array is from the assistant with usable parts.\n *\n * A usable message has role \"assistant\" and a non-empty parts array containing\n * at least one part with a truthy `text`, `type`, or `output` field.\n *\n * @param messages - Array of session message objects.\n * @returns true if the last message is a usable assistant message.\n *\n * @example\n * hasAssistantLastMessage([{ role: \"assistant\", parts: [{ type: \"text\" }] }])\n * // true\n */\nexport function hasAssistantLastMessage(messages: unknown[]): boolean {\n  if (messages.length === 0) return false\n  const last = messages[messages.length - 1]\n  if (getMessageRole(last) !== \"assistant\") return false\n  const parts = getMessageParts(last)\n  if (parts.length === 0) return false\n  return parts.some((p) => {\n    const text = getNestedValue(p, [\"text\"])\n    const type = getNestedValue(p, [\"type\"])\n    const output = getNestedValue(p, [\"output\"])\n    return (typeof text === \"string\" && text.length > 0) || typeof type === \"string\" || typeof output === \"string\"\n  })\n}\n\n/**\n * Detect file-change indicators in `tool_result` parts across all messages.\n *\n * Looks for two signals:\n * 1. Tool names associated with file mutation (`write`, `edit`, `bash`, etc.)\n *    found in tool_use parts that precede tool_result parts.\n * 2. File-path patterns (strings containing path separators and extensions)\n *    in the text content of tool_result parts.\n *\n * @param messages - Array of session message objects.\n * @returns true if at least one file-change indicator is detected.\n *\n * @example\n * hasFileChangeIndicators([{ role: \"assistant\", parts: [\n *   { type: \"tool_use\", name: \"write\", input: { filePath: \"/src/a.ts\" } },\n *   { type: \"tool_result\", output: \"Wrote /src/a.ts\" }\n * ]}])\n * // true\n */\nexport function hasFileChangeIndicators(messages: unknown[]): boolean {\n  const toolUseNames: string[] = []\n  for (const message of messages) {\n    const parts = getMessageParts(message)\n    for (const part of parts) {\n      const partType = getNestedValue(part, [\"type\"])\n      if (partType === \"tool_use\") {\n        const name = asString(getNestedValue(part, [\"name\"]))\n        if (name) toolUseNames.push(name)\n      }\n      if (partType === \"tool_result\") {\n        if (hasFileChangeInToolResult(part)) return true\n      }\n    }\n  }\n  return toolUseNames.some((name) => FILE_CHANGE_TOOL_NAMES.has(name))\n}\n\nfunction hasFileChangeInToolResult(part: unknown): boolean {\n  const output = asString(getNestedValue(part, [\"output\"]))\n  if (output && FILE_PATH_PATTERN.test(output)) return true\n  const text = asString(getNestedValue(part, [\"text\"]))\n  if (text && FILE_PATH_PATTERN.test(text)) return true\n  const content = asString(getNestedValue(part, [\"content\"]))\n  if (content && FILE_PATH_PATTERN.test(content)) return true\n  return false\n}\n\n/**\n * Evaluate whether a delegated session has semantically completed its work.\n *\n * Checks three independent conditions and returns a structured result:\n * 1. **Tool Activity Stall** — no tool_use parts for > threshold milliseconds\n * 2. **Assistant Last Message** — last message is from assistant with usable parts\n * 3. **File Changes Detected** — tool_result content suggests file mutations\n *\n * Completion is declared when all three conditions are true.\n *\n * @param messages - Array of session message objects (OpenCode SDK shape).\n * @param options - Optional configuration for idle threshold and time injection.\n * @returns Structured result with individual condition flags and aggregate `isComplete`.\n *\n * @example\n * checkSemanticCompletion(messages, { now: Date.now() })\n * // { toolActivityStalled: true, hasAssistantMessage: true, hasFileChanges: true, isComplete: true, ... }\n */\nexport function checkSemanticCompletion(\n  messages: unknown[],\n  options?: SemanticCompletionOptions\n): SemanticCompletionResult {\n  const now = options?.now ?? Date.now()\n  const threshold = options?.toolIdleThresholdMs ?? DEFAULT_TOOL_IDLE_MS\n  const lastToolActivityAt = findLastToolActivity(messages)\n  const secondsSinceLastToolActivity =\n    lastToolActivityAt !== null ? (now - lastToolActivityAt) / 1000 : null\n  const toolActivityStalled =\n    lastToolActivityAt !== null && now - lastToolActivityAt > threshold\n  const hasAssistantMessage = hasAssistantLastMessage(messages)\n  const hasFileChanges = hasFileChangeIndicators(messages)\n  const isComplete = toolActivityStalled && hasAssistantMessage && hasFileChanges\n  return {\n    toolActivityStalled,\n    hasAssistantMessage,\n    hasFileChanges,\n    isComplete,\n    lastToolActivityAt,\n    secondsSinceLastToolActivity,\n  }\n}\n"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 44.9s)

Now the test file:

**Tool: write**

**Input:**
```json
{
  "content": "function mockMessage(role: string, parts: unknown[], timestamp?: number): Record<string, unknown> {\n  const msg: Record<string, unknown> = { info: { role }, parts }\n  if (timestamp !== undefined) msg.timestamp = timestamp\n  return msg\n}\n\nfunction mockToolUse(name: string, input: Record<string, unknown>, timestamp?: number): Record<string, unknown> {\n  const part: Record<string, unknown> = { type: \"tool_use\", name, input }\n  if (timestamp !== undefined) part.timestamp = timestamp\n  return part\n}\n\nfunction mockToolResult(output: string, timestamp?: number): Record<string, unknown> {\n  const part: Record<string, unknown> = { type: \"tool_result\", output }\n  if (timestamp !== undefined) part.timestamp = timestamp\n  return part\n}\n\nfunction mockTextPart(text: string): Record<string, unknown> {\n  return { type: \"text\", text }\n}\n\ndescribe(\"completion-detector\", () => {\n  const NOW = 1_000_000\n\n  describe(\"checkSemanticCompletion\", () => {\n    it(\"returns all false for empty messages\", () => {\n      const result = checkSemanticCompletion([])\n      expect(result.toolActivityStalled).toBe(false)\n      expect(result.hasAssistantMessage).toBe(false)\n      expect(result.hasFileChanges).toBe(false)\n      expect(result.isComplete).toBe(false)\n      expect(result.lastToolActivityAt).toBeNull()\n      expect(result.secondsSinceLastToolActivity).toBeNull()\n    })\n\n    it(\"returns false for user-only messages\", () => {\n      const messages = [mockMessage(\"user\", [mockTextPart(\"hello\")])]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.hasAssistantMessage).toBe(false)\n      expect(result.hasFileChanges).toBe(false)\n      expect(result.isComplete).toBe(false)\n    })\n\n    it(\"detects assistant last message but no tools\", () => {\n      const messages = [\n        mockMessage(\"user\", [mockTextPart(\"do stuff\")]),\n        mockMessage(\"assistant\", [mockTextPart(\"done\")]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.hasAssistantMessage).toBe(true)\n      expect(result.toolActivityStalled).toBe(false)\n      expect(result.hasFileChanges).toBe(false)\n      expect(result.isComplete).toBe(false)\n    })\n\n    it(\"detects recent tool activity as not stalled\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"bash\", { command: \"ls\" }, NOW - 1000),\n          mockToolResult(\"file.ts\\nfile2.ts\", NOW - 500),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"listed files\")]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.toolActivityStalled).toBe(false)\n      expect(result.lastToolActivityAt).toBe(NOW - 1000)\n    })\n\n    it(\"detects stalled tool activity with old timestamp\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"bash\", { command: \"ls\" }, NOW - 120_000),\n          mockToolResult(\"output\", NOW - 119_000),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"done\")]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.toolActivityStalled).toBe(true)\n      expect(result.secondsSinceLastToolActivity).toBe(120)\n    })\n\n    it(\"detects file change indicators in tool_result\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"write\", { path: \"/src/index.ts\" }, NOW - 5000),\n          mockToolResult(\"Wrote /src/index.ts successfully\", NOW - 4000),\n        ]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.hasFileChanges).toBe(true)\n    })\n\n    it(\"detects file change by tool name\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"edit\", { filePath: \"/foo.ts\" }, NOW - 5000),\n        ]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.hasFileChanges).toBe(true)\n    })\n\n    it(\"isComplete is true when all three conditions met\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"write\", { path: \"/src/a.ts\" }, NOW - 120_000),\n          mockToolResult(\"Wrote /src/a.ts\", NOW - 119_000),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"file written\")]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.toolActivityStalled).toBe(true)\n      expect(result.hasAssistantMessage).toBe(true)\n      expect(result.hasFileChanges).toBe(true)\n      expect(result.isComplete).toBe(true)\n    })\n\n    it(\"respects custom toolIdleThresholdMs\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"bash\", { cmd: \"ls\" }, NOW - 5000),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"done\")]),\n      ]\n      const defaultResult = checkSemanticCompletion(messages, { now: NOW })\n      expect(defaultResult.toolActivityStalled).toBe(false)\n\n      const shortResult = checkSemanticCompletion(messages, {\n        now: NOW,\n        toolIdleThresholdMs: 3000,\n      })\n      expect(shortResult.toolActivityStalled).toBe(true)\n    })\n\n    it(\"uses custom now injection for time-dependent logic\", () => {\n      const toolTime = 1_000_000\n      const messages = [\n        mockMessage(\"assistant\", [\n          mockToolUse(\"write\", { path: \"/src/x.ts\" }, toolTime),\n          mockToolResult(\"Wrote /src/x.ts\", toolTime + 100),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"done\")]),\n      ]\n      const beforeStall = checkSemanticCompletion(messages, {\n        now: toolTime + 30_000,\n      })\n      expect(beforeStall.toolActivityStalled).toBe(false)\n\n      const afterStall = checkSemanticCompletion(messages, {\n        now: toolTime + 90_000,\n      })\n      expect(afterStall.toolActivityStalled).toBe(true)\n      expect(afterStall.isComplete).toBe(true)\n    })\n\n    it(\"handles mixed message sequence with multiple tools\", () => {\n      const messages = [\n        mockMessage(\"user\", [mockTextPart(\"build the feature\")]),\n        mockMessage(\"assistant\", [\n          mockToolUse(\"bash\", { command: \"mkdir src\" }, NOW - 200_000),\n          mockToolResult(\"created directory\", NOW - 199_000),\n        ]),\n        mockMessage(\"assistant\", [\n          mockToolUse(\"write\", { path: \"/src/feature.ts\" }, NOW - 150_000),\n          mockToolResult(\"Wrote /src/feature.ts\", NOW - 149_000),\n        ]),\n        mockMessage(\"assistant\", [\n          mockToolUse(\"bash\", { command: \"npm test\" }, NOW - 80_000),\n          mockToolResult(\"3 tests passed\", NOW - 79_000),\n        ]),\n        mockMessage(\"assistant\", [mockTextPart(\"feature complete\")]),\n      ]\n      const result = checkSemanticCompletion(messages, { now: NOW })\n      expect(result.hasAssistantMessage).toBe(true)\n      expect(result.hasFileChanges).toBe(true)\n      expect(result.lastToolActivityAt).toBe(NOW - 80_000)\n      expect(result.toolActivityStalled).toBe(true)\n      expect(result.isComplete).toBe(true)\n    })\n  })\n\n  describe(\"findLastToolActivity\", () => {\n    it(\"returns null for no tool_use parts\", () => {\n      expect(findLastToolActivity([])).toBeNull()\n      expect(findLastToolActivity([mockMessage(\"user\", [mockTextPart(\"hi\")])])).toBeNull()\n    })\n\n    it(\"returns the last tool_use timestamp\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [mockToolUse(\"bash\", {}, 1000)]),\n        mockMessage(\"assistant\", [mockToolUse(\"write\", {}, 2000)]),\n      ]\n      expect(findLastToolActivity(messages)).toBe(2000)\n    })\n\n    it(\"falls back to message timestamp when part lacks one\", () => {\n      const messages = [\n        mockMessage(\"assistant\", [mockToolUse(\"bash\", {})], 5000),\n      ]\n      expect(findLastToolActivity(messages)).toBe(5000)\n    })\n  })\n\n  describe(\"hasAssistantLastMessage\", () => {\n    it(\"returns false for empty array\", () => {\n      expect(hasAssistantLastMessage([])).toBe(false)\n    })\n\n    it(\"returns false when last message is user\", () => {\n      expect(\n        hasAssistantLastMessage([mockMessage(\"user\", [mockTextPart(\"hi\")])])\n      ).toBe(false)\n    })\n\n    it(\"returns false for assistant with empty parts\", () => {\n      expect(hasAssistantLastMessage([mockMessage(\"assistant\", [])])).toBe(false)\n    })\n\n    it(\"returns true for assistant with text parts\", () => {\n      expect(\n        hasAssistantLastMessage([mockMessage(\"assistant\", [mockTextPart(\"ok\")])])\n      ).toBe(true)\n    })\n  })\n\n  describe(\"hasFileChangeIndicators\", () => {\n    it(\"returns false for no tool results or file tools\", () => {\n      expect(hasFileChangeIndicators([])).toBe(false)\n      expect(\n        hasFileChangeIndicators([mockMessage(\"assistant\", [mockTextPart(\"nope\")])])\n      ).toBe(false)\n    })\n\n    it(\"returns true for tool_result with file path\", () => {\n      expect(\n        hasFileChangeIndicators([\n          mockMessage(\"assistant\", [\n            mockToolResult(\"Created file at /src/new-file.ts\"),\n          ]),\n        ])\n      ).toBe(true)\n    })\n\n    it(\"returns false for tool_result without file indicators\", () => {\n      expect(\n        hasFileChangeIndicators([\n          mockMessage(\"assistant\", [mockToolResult(\"command completed\")]),\n        ])\n      ).toBe(false)\n    })\n\n    it(\"returns true for known file tool names\", () => {\n      expect(\n        hasFileChangeIndicators([\n          mockMessage(\"assistant\", [mockToolUse(\"create_file\", { path: \"f\" })]),\n        ])\n      ).toBe(true)\n    })\n  })\n})\n",
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/coordination/delegation/completion-detector.test.ts"
}
```

**Output:**
```
Wrote file successfully.
```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 14.0s)

Now let's verify — typecheck and test run:

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Users/apple/hivemind-plugin-private && npm run typecheck 2>&1",
  "description": "Run typecheck on project",
  "timeout": 60000
}
```

**Output:**
```

> hivemind@0.1.0 typecheck
> tsc --noEmit


```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 15.7s)

Typecheck passes clean. Now run the tests:

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Users/apple/hivemind-plugin-private && npx vitest run tests/lib/coordination/delegation/completion-detector.test.ts 2>&1",
  "description": "Run completion-detector tests",
  "timeout": 60000
}
```

**Output:**
```

 RUN  v4.1.6 /Users/apple/hivemind-plugin-private

 ❯ tests/lib/coordination/delegation/completion-detector.test.ts (22 tests | 22 failed) 14ms
       × returns all false for empty messages 6ms
       × returns false for user-only messages 1ms
       × detects assistant last message but no tools 0ms
       × detects recent tool activity as not stalled 0ms
       × detects stalled tool activity with old timestamp 0ms
       × detects file change indicators in tool_result 0ms
       × detects file change by tool name 0ms
       × isComplete is true when all three conditions met 0ms
       × respects custom toolIdleThresholdMs 0ms
       × uses custom now injection for time-dependent logic 0ms
       × handles mixed message sequence with multiple tools 0ms
       × returns null for no tool_use parts 0ms
       × returns the last tool_use timestamp 0ms
       × falls back to message timestamp when part lacks one 0ms
       × returns false for empty array 0ms
       × returns false when last message is user 0ms
       × returns false for assistant with empty parts 0ms
       × returns true for assistant with text parts 0ms
       × returns false for no tool results or file tools 0ms
       × returns true for tool_result with file path 0ms
       × returns false for tool_result without file indicators 0ms
       × returns true for known file tool names 0ms

⎯⎯⎯⎯⎯⎯ Failed Tests 22 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > returns all false for empty messages
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:28:22
     26|   describe("checkSemanticCompletion", () => {
     27|     it("returns all false for empty messages", () => {
     28|       const result = checkSemanticCompletion([])
       |                      ^
     29|       expect(result.toolActivityStalled).toBe(false)
     30|       expect(result.hasAssistantMessage).toBe(false)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > returns false for user-only messages
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:39:22
     37|     it("returns false for user-only messages", () => {
     38|       const messages = [mockMessage("user", [mockTextPart("hello")])]
     39|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
     40|       expect(result.hasAssistantMessage).toBe(false)
     41|       expect(result.hasFileChanges).toBe(false)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > detects assistant last message but no tools
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:50:22
     48|         mockMessage("assistant", [mockTextPart("done")]),
     49|       ]
     50|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
     51|       expect(result.hasAssistantMessage).toBe(true)
     52|       expect(result.toolActivityStalled).toBe(false)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > detects recent tool activity as not stalled
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:65:22
     63|         mockMessage("assistant", [mockTextPart("listed files")]),
     64|       ]
     65|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
     66|       expect(result.toolActivityStalled).toBe(false)
     67|       expect(result.lastToolActivityAt).toBe(NOW - 1000)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > detects stalled tool activity with old timestamp
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:78:22
     76|         mockMessage("assistant", [mockTextPart("done")]),
     77|       ]
     78|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
     79|       expect(result.toolActivityStalled).toBe(true)
     80|       expect(result.secondsSinceLastToolActivity).toBe(120)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > detects file change indicators in tool_result
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:90:22
     88|         ]),
     89|       ]
     90|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
     91|       expect(result.hasFileChanges).toBe(true)
     92|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > detects file change by tool name
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:100:22
     98|         ]),
     99|       ]
    100|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
    101|       expect(result.hasFileChanges).toBe(true)
    102|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > isComplete is true when all three conditions met
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:112:22
    110|         mockMessage("assistant", [mockTextPart("file written")]),
    111|       ]
    112|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
    113|       expect(result.toolActivityStalled).toBe(true)
    114|       expect(result.hasAssistantMessage).toBe(true)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > respects custom toolIdleThresholdMs
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:126:29
    124|         mockMessage("assistant", [mockTextPart("done")]),
    125|       ]
    126|       const defaultResult = checkSemanticCompletion(messages, { now: N…
       |                             ^
    127|       expect(defaultResult.toolActivityStalled).toBe(false)
    128|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > uses custom now injection for time-dependent logic
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:145:27
    143|         mockMessage("assistant", [mockTextPart("done")]),
    144|       ]
    145|       const beforeStall = checkSemanticCompletion(messages, {
       |                           ^
    146|         now: toolTime + 30_000,
    147|       })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > checkSemanticCompletion > handles mixed message sequence with multiple tools
ReferenceError: checkSemanticCompletion is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:174:22
    172|         mockMessage("assistant", [mockTextPart("feature complete")]),
    173|       ]
    174|       const result = checkSemanticCompletion(messages, { now: NOW })
       |                      ^
    175|       expect(result.hasAssistantMessage).toBe(true)
    176|       expect(result.hasFileChanges).toBe(true)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > findLastToolActivity > returns null for no tool_use parts
ReferenceError: findLastToolActivity is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:185:7
    183|   describe("findLastToolActivity", () => {
    184|     it("returns null for no tool_use parts", () => {
    185|       expect(findLastToolActivity([])).toBeNull()
       |       ^
    186|       expect(findLastToolActivity([mockMessage("user", [mockTextPart("…
    187|     })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > findLastToolActivity > returns the last tool_use timestamp
ReferenceError: findLastToolActivity is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:194:7
    192|         mockMessage("assistant", [mockToolUse("write", {}, 2000)]),
    193|       ]
    194|       expect(findLastToolActivity(messages)).toBe(2000)
       |       ^
    195|     })
    196|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > findLastToolActivity > falls back to message timestamp when part lacks one
ReferenceError: findLastToolActivity is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:201:7
    199|         mockMessage("assistant", [mockToolUse("bash", {})], 5000),
    200|       ]
    201|       expect(findLastToolActivity(messages)).toBe(5000)
       |       ^
    202|     })
    203|   })

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasAssistantLastMessage > returns false for empty array
ReferenceError: hasAssistantLastMessage is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:207:7
    205|   describe("hasAssistantLastMessage", () => {
    206|     it("returns false for empty array", () => {
    207|       expect(hasAssistantLastMessage([])).toBe(false)
       |       ^
    208|     })
    209|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasAssistantLastMessage > returns false when last message is user
ReferenceError: hasAssistantLastMessage is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:211:7
    209|
    210|     it("returns false when last message is user", () => {
    211|       expect(
       |       ^
    212|         hasAssistantLastMessage([mockMessage("user", [mockTextPart("hi…
    213|       ).toBe(false)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasAssistantLastMessage > returns false for assistant with empty parts
ReferenceError: hasAssistantLastMessage is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:217:7
    215|
    216|     it("returns false for assistant with empty parts", () => {
    217|       expect(hasAssistantLastMessage([mockMessage("assistant", [])])).…
       |       ^
    218|     })
    219|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasAssistantLastMessage > returns true for assistant with text parts
ReferenceError: hasAssistantLastMessage is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:221:7
    219|
    220|     it("returns true for assistant with text parts", () => {
    221|       expect(
       |       ^
    222|         hasAssistantLastMessage([mockMessage("assistant", [mockTextPar…
    223|       ).toBe(true)

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasFileChangeIndicators > returns false for no tool results or file tools
ReferenceError: hasFileChangeIndicators is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:229:7
    227|   describe("hasFileChangeIndicators", () => {
    228|     it("returns false for no tool results or file tools", () => {
    229|       expect(hasFileChangeIndicators([])).toBe(false)
       |       ^
    230|       expect(
    231|         hasFileChangeIndicators([mockMessage("assistant", [mockTextPar…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasFileChangeIndicators > returns true for tool_result with file path
ReferenceError: hasFileChangeIndicators is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:236:7
    234|
    235|     it("returns true for tool_result with file path", () => {
    236|       expect(
       |       ^
    237|         hasFileChangeIndicators([
    238|           mockMessage("assistant", [

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasFileChangeIndicators > returns false for tool_result without file indicators
ReferenceError: hasFileChangeIndicators is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:246:7
    244|
    245|     it("returns false for tool_result without file indicators", () => {
    246|       expect(
       |       ^
    247|         hasFileChangeIndicators([
    248|           mockMessage("assistant", [mockToolResult("command completed"…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/22]⎯

 FAIL  tests/lib/coordination/delegation/completion-detector.test.ts > completion-detector > hasFileChangeIndicators > returns true for known file tool names
ReferenceError: hasFileChangeIndicators is not defined
 ❯ tests/lib/coordination/delegation/completion-detector.test.ts:254:7
    252|
    253|     it("returns true for known file tool names", () => {
    254|       expect(
       |       ^
    255|         hasFileChangeIndicators([
    256|           mockMessage("assistant", [mockToolUse("create_file", { path:…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/22]⎯


 Test Files  1 failed (1)
      Tests  22 failed (22)
   Start at  02:06:10
   Duration  422ms (transform 32ms, setup 0ms, import 43ms, tests 14ms, environment 0ms)


```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 11.1s)

Tests need the import. The task says "vitest globals (no imports needed for describe/it/expect)" — but I still need to import the functions under test. Let me add the import:

**Tool: edit**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/coordination/delegation/completion-detector.test.ts",
  "oldString": "function mockMessage(role: string, parts: unknown[], timestamp?: number): Record<string, unknown> {",
  "newString": "import {\n  checkSemanticCompletion,\n  findLastToolActivity,\n  hasAssistantLastMessage,\n  hasFileChangeIndicators,\n} from \"../../../../src/coordination/delegation/completion-detector.js\"\n\nfunction mockMessage(role: string, parts: unknown[], timestamp?: number): Record<string, unknown> {"
}
```

**Output:**
```
Edit applied successfully.
```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 11.6s)

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Users/apple/hivemind-plugin-private && npx vitest run tests/lib/coordination/delegation/completion-detector.test.ts 2>&1",
  "description": "Run completion-detector tests after import fix",
  "timeout": 60000
}
```

**Output:**
```

 RUN  v4.1.6 /Users/apple/hivemind-plugin-private


 Test Files  1 passed (1)
      Tests  22 passed (22)
   Start at  02:06:33
   Duration  337ms (transform 49ms, setup 0ms, import 63ms, tests 9ms, environment 0ms)


```

---

## Assistant (Hm-L2-Build · GLM-5.1 · 348.4s)

---

