---
sessionID: ses_1e7dd4883ffeCukWarRx36syB2
created: 2026-05-11T17:43:08.934Z
updated: 2026-05-11T17:43:08.934Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Focus: quality
Today's date: 2026-05-12

Analyze this codebase for coding conventions and testing patterns.

Write these documents to .planning/codebase/:
- CONVENTIONS.md - Code style, naming, patterns, error handling
- TESTING.md - Framework, structure, mocking, coverage

IMPORTANT: Use 2026-05-12 for all [YYYY-MM-DD] date placeholders in documents.

Scope: full repo — perform a complete codebase scan.

Explore thoroughly. Write documents directly using templates. Return confirmation only with file paths and line counts when done.

CRITICAL RULES:
1. Use `read`, `write`, `glob`, `grep`, `bash` tools to explore the codebase - do NOT use browser_subagent or Explore agents.
2. Write documents directly to .planning/codebase/CONVENTIONS.md and .planning/codebase/TESTING.md
3. Return ONLY a confirmation with document paths and line counts.
4. Include actual file paths formatted with backticks in documents.

Project: Hivemind - TypeScript strict mode. 149 test files, 1978 test cases (all unit, zero integration/E2E). Vitest framework. Tests in tests/lib/ and tests/tools/. Max module size 500 LOC. JSDoc required on all functions. No `any` types on new code.

### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_jYWbV6OKmSW0nnLDZJY20350"
}
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
  "callID": "call_01_cHZ1xKG83bE18BTbgYjk6511"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_GH40kVNWPiWyHVveKQoY9207"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_y5TrZwAINFDOnOuSSEWn3768"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_04_O4qxCro46uJiiFl3CvS94535"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_05_7JvYbtt81bHB6qZryyPX0965"
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
  "callID": "call_03_05x0EZdGKFpcULP7mdIl4515"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_hu8QejTHDdWulfWHmNB23929"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_bTs4YfIRuIWGuJpzVBAw8613"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_cJpo6iOa0G5icO96hL7A3003"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_qfHejTN8bKw3vW47DlGI4021"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_8gp8U4F4EVlnxjjAxYx21389"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_00_KycqvxfRLPTico7dXr1R6474"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_01_TuvdHfvoKnC03KOIn4rH6194"
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

(Showing lines 1-80 of 415. Use offset=81 to continue.)
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
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/plugin.ts"
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
- Current testing baseline and failures must be reported honestly; live evidence at 149 test files, 1979 test cases (2 known failures/skips). Evidence: `.planning/codebase/TESTING.md:70-75`.
- Runtime readiness requires L1-L3 evidence beyond docs-only or mocked unit proof; tests alone must be classified by level and scope.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for tests/:** Test counts verified at 149 test files, 2010 tests (2008 pass + 2 skip). Vitest + TypeScript strict mode unchanged.  
**Next work affecting tests/:** CP-PTY-01 and CP-ST-01 will add new test files for shell/PTY and session tracker features.

</system-reminder>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_te5qJYjEjbEAtKCM4Fa45397"
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/state.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/task-status.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/task-status.ts</path>
<type>file</type>
<content>
1: import type { TaskStatus } from "./types.js"
2: 
3: export const VALID_TASK_STATUSES: TaskStatus[] = ["pending", "queued", "running", "completed", "failed", "error", "cancelled", "interrupt"]
4: 
5: export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
6:   pending:    ["queued", "cancelled"],
7:   queued:     ["running", "failed", "cancelled"],
8:   running:    ["completed", "failed", "error", "cancelled", "interrupt"],
9:   completed:  [],
10:   failed:     [],
11:   error:      [],
12:   cancelled:  [],
13:   interrupt:  ["running", "queued"],
14: }
15: 
16: export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
17:   return VALID_TRANSITIONS[from].includes(to)
18: }
19: 
20: export function isTerminal(status: TaskStatus): boolean {
21:   return status === "completed" || status === "failed" || status === "error" || status === "cancelled"
22: }

(End of file - total 22 lines)
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

(Showing lines 1-80 of 500. Use offset=81 to continue.)
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
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/delegation-manager.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/shared/runtime.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/shared/runtime.ts</path>
<type>file</type>
<content>
1: import { asString, getNestedValue } from "./helpers.js"
2: import type { SessionContinuityMetadata } from "./types.js"
3: 
4: function getStatusSignal(event: unknown): string | undefined {
5:   const paths = [
6:     ["properties", "status", "type"],
7:     ["properties", "status"],
8:     ["properties", "info", "status", "type"],
9:     ["properties", "info", "status"],
10:     ["properties", "info", "state"],
11:     ["status", "type"],
12:     ["status"],
13:     ["state"],
14:   ]
15: 
16:   for (const path of paths) {
17:     const signal = asString(getNestedValue(event, path))
18:     if (signal) {
19:       return signal.trim().toLowerCase()
20:     }
21:   }
22: 
23:   return undefined
24: }
25: 
26: /**
27:  * Infer a continuity status from an incoming transport event.
28:  *
29:  * NOTE: The `"running"` inference for transport "busy" signals (busy, retry,
30:  * running, queued, working, streaming) is **transport-derived**, not
31:  * evidence-confirmed. For delegate-task children, the background observer
32:  * gates these with a start-evidence check before promoting to running.
33:  *
34:  * When `requireEvidence` is true, the function will only return `"running"`
35:  * from transport signals if `existingLastToolActivityAt` is already set
36:  * (i.e., real tool activity has been observed previously).
37:  */
38: export function inferContinuityStatusFromEvent(args: {
39:   event: unknown
40:   eventType: string
41:   currentStatus?: SessionContinuityMetadata["status"]
42:   /** When true, "running" from transport signals requires prior tool activity. */
43:   requireEvidence?: boolean
44:   /** The record's current lastToolActivityAt, used only when requireEvidence is true. */
45:   existingLastToolActivityAt?: number
46: }): SessionContinuityMetadata["status"] | undefined {
47:   const statusSignal = getStatusSignal(args.event)
48: 
49:   if (
50:     statusSignal &&
51:     (args.currentStatus === "failed" || args.currentStatus === "error" || args.currentStatus === "completed")
52:   ) {
53:     return args.currentStatus
54:   }
55: 
56:   switch (statusSignal) {
57:     case "failed":
58:     case "error":
59:     case "errored":
60:     case "cancelled":

(Showing lines 1-60 of 95. Use offset=61 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/helpers.test.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/continuity.test.ts"
}
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
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/prompt/prompt-skim/index.ts"
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


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/hooks/create-core-hooks.test.ts"
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

(Showing lines 1-50 of 337. Use offset=51 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/prompt-packet/delegation-packet.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/doc-intelligence/chunker.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/config/subscriber.ts"
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
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/runtime-pressure"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/tests/lib/event-tracker/writer.test.ts"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_TKiYB9kchLMGHfxlOd3C4504"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_TcMAZsEbyaK3JZMszz799797"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_PZ1sFE33aGpgRlggzrm85954"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_koDl8MjVtat4m7U3GJoE7060"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Er0MXl65b4wRjO5JLRtg1738"
}
```

