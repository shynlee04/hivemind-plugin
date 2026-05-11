---
sessionID: ses_1e7b63fd5ffeITUoweQVsr73Ew
created: 2026-05-11T18:25:47.068Z
updated: 2026-05-11T18:25:47.068Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

Investigate the Hivemind session tracker records to answer 5 specific open questions from the Phase 12 research. Read from the filesystem only — do NOT write anything.

READ THESE FILES IN ORDER:

1. `/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json` — Read the full JSON. Extract: total entries, lastUpdated timestamp, all status values, childCount values. Look for patterns of frozen state.

2. Pick 3 session directories that have child `.json` files (subagent sessions). For each:
   - Read `session-continuity.json` to understand hierarchy structure
   - Read any child `.json` files (files with pattern `ses_*.json`) to see turn stem format, status, mainAgent data
   - Read the main `.md` file (first 100 lines) to see the frontmatter and content format

3. Pick a session that was created most recently (check by modified time) and compare its `session-continuity.json` with an older session to see if the index writer ever updates.

4. Look at `project-continuity.json` entries carefully: count how many have `childCount: 0`, how many have `status: "active"`, and the `lastUpdated` value.

Return a concise report answering these 5 questions with EVIDENCE (file references + data):

**Q1: DEFECT-02 root cause — Why is the serial queue stuck?** 
- Is `lastUpdated` frozen (same value across time)? 
- Are new sessions being added to the index? 
- Evidence: project-continuity.json timestamps, entry counts, lastUpdated value.

**Q2: Child session lifecycle — what does OpenCode SDK provide?**
- Do child `.json` files have turns captured? 
- What does `childWriter.createChildFile()` produce? 
- What fields exist in child records (mainAgent, status, turns, created, updated)?
- Evidence: sample child .json files.

**Q3: Session ID format — what is the exact pattern?**
- Look at actual session IDs in project-continuity.json and directory names.
- What is the format? (prefix, length, character set)
- Evidence: sample IDs.

**Q4: Compaction capture — should it write to `.md` or `.json`?**
- Do any existing `.md` files have compaction markers or `## COMPACTED` sections?
- What is the existing main `.md` format structure (frontmatter + sections)?
- Evidence: sampled .md files.

**Q5: What does the `session.compacted` event payload look like?**
- Can you find any evidence of compaction events in the existing records?
- Look for COMPACTED markers, summary blocks, or compaction-related fields in .md files or .json files.
- If no evidence exists, state that clearly.

Return your findings as a structured report. Keep it concise — evidence first, analysis after.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-detective"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-detective
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/project-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e9bc0b1dffeLIeMexVP8ocRAF"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e7df6e7dffeuoHMHJggIuqMry"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1ebc5d7b3ffesswQph1WbYR866"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e97a18f0ffe4tz4GJcaLAfmC3"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e9bc0b1dffeLIeMexVP8ocRAF/session-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e9bc0b1dffeLIeMexVP8ocRAF/ses_1e9b9cb08ffeHdv8qgplK8c32n.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e7df6e7dffeuoHMHJggIuqMry/session-continuity.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e7df6e7dffeuoHMHJggIuqMry/ses_1e7bddda3ffe7s0o4F5gT24YU2.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e9bc0b1dffeLIeMexVP8ocRAF/ses_1e9bc0b1dffeLIeMexVP8ocRAF.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1ebc5d7b3ffesswQph1WbYR866/ses_1ebc5d7b3ffesswQph1WbYR866.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1ebc5d7b3ffesswQph1WbYR866/ses_1ebc5d7b3ffesswQph1WbYR866.md</path>
<type>file</type>
<content>
1: ---
2: sessionID: ses_1ebc5d7b3ffesswQph1WbYR866
3: created: 2026-05-10T23:30:16.532Z
4: updated: 2026-05-10T23:30:16.532Z
5: parentSessionID: null
6: delegationDepth: 0
7: children: []
8: continuityIndex: session-continuity.json
9: status: active
10: ---
11: 
12: ## USER (turn 1)
13: 
14: <objective>
15: Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.
16: 
17: Each mapper agent explores a focus area and **writes documents directly** to `.planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.
18: 
19: Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
20: </objective>
21: 
22: <execution_context>
23: @/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md
24: </execution_context>
25: 
26: <flags>
27: - **--fast**: Lightweight scan mode — spawns one mapper agent instead of four. Accepts an optional `--focus` value: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default). Faster and lower-context than the full map.
28: - **--query**: Codebase intelligence query mode. Sub-commands: `query <term>`, `status`, `diff`, `refresh`. Requires intel to be enabled in config (`intel.enabled: true`). Runs inline for query/status/diff; spawns an agent for refresh.
29: - **(no flag)**: Full parallel map — spawns 4 mapper agents to produce all 7 codebase documents.
30: </flags>
31: 
32: <context>
33: Arguments: 
34: 
35: Parse the first token of :
36: - If it is `--fast`: strip the flag, run the scan workflow (passing remaining args including optional --focus).
37: - If it is `--query`: strip the flag, run the intel workflow (passing remaining args as the subcommand).
38: - Otherwise: pass all of  as focus area to the map-codebase workflow.
39: 
40: **Load project state if exists:**
41: Check for .planning/STATE.md - loads context if project already initialized
42: 
43: **This command can run:**
44: - Before /gsd-new-project (brownfield codebases) - creates codebase map first
45: - After /gsd-new-project (greenfield codebases) - updates codebase map as code evolves
46: - Anytime to refresh codebase understanding
47: </context>
48: 
49: <when_to_use>
50: **Use map-codebase for:**
51: - Brownfield projects before initialization (understand existing code first)
52: - Refreshing codebase map after significant changes
53: - Onboarding to an unfamiliar codebase
54: - Before major refactoring (understand current state)
55: - When STATE.md references outdated codebase info
56: 
57: **Skip map-codebase for:**
58: - Greenfield projects with no code yet (nothing to map)
59: - Trivial codebases (<5 files)
60: </when_to_use>
61: 
62: <process>
63: 1. Check if .planning/codebase/ already exists (offer to refresh or skip)
64: 2. Create .planning/codebase/ directory structure
65: 3. Spawn 4 parallel gsd-codebase-mapper agents:
66:    - Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
67:    - Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
68:    - Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
69:    - Agent 4: concerns focus → writes CONCERNS.md
70: 4. Wait for agents to complete, collect confirmations (NOT document contents)
71: 5. Verify all 7 documents exist with line counts
72: 6. Commit codebase map
73: 7. Offer next steps (typically: /gsd-new-project or /gsd-plan-phase)
74: </process>
75: 
76: <success_criteria>
77: - [ ] .planning/codebase/ directory created
78: - [ ] All 7 codebase documents written by mapper agents
79: - [ ] Documents follow template structure
80: - [ ] Parallel agents completed without errors
81: - [ ] User knows next steps
82: </success_criteria>Called the Read tool with the following input: {"filePath":"/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md"}<path>/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/map-codebase.md</path>
83: <type>file</type>
84: <content>
85: 1: <purpose>
86: 2: Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .planning/codebase/
87: 3: 
88: 4: Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.
89: 5: 
90: 6: Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
91: 7: </purpose>
92: 8: 
93: 9: <available_agent_types>
94: 10: Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
95: 11: - gsd-codebase-mapper — Maps project structure and dependencies
96: 12: </available_agent_types>
97: 13: 
98: 14: <philosophy>
99: 15: **Why dedicated mapper agents:**
100: 16: - Fresh context per domain (no token contamination)

(Showing lines 1-100 of 683. Use offset=101 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e7b63fd5ffeITUoweQVsr73Ew"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e97a18f0ffe4tz4GJcaLAfmC3/session-continuity.json"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_00_MZJJVAk4zGnblope9oi17486"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_01_sEMQn5j7lo3v6qlyhuKR4247"
}
```


### Tool: grep

**Input:**
```json
{
  "callID": "call_02_8UcyKRfOyXHsB7pNa6dZ3045"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e7b63fd5ffeITUoweQVsr73Ew/ses_1e7b63fd5ffeITUoweQVsr73Ew.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session lifecycle event capture handler.
3:  *
4:  * Handles `session.created`, `session.idle`, `session.deleted`, and
5:  * `session.error` events from the OpenCode `event` hook. Distinguishes
6:  * root sessions from child sessions via SDK `parentID` check.
7:  *
8:  * Root sessions: creates `.hivemind/session-tracker/{sessionID}/` subdir
9:  * and `{sessionID}.md` file. Child sessions: skipped (handled by tool-capture
10:  * when `task` tool fires).
11:  *
12:  * All handlers are best-effort — errors are logged, never thrown.
13:  *
14:  * @module session-tracker/capture/event-capture
15:  */
16: 
17: import type { OpenCodeClient } from "../../../shared/session-api.js"
18: import { getSession } from "../../../shared/session-api.js"
19: import type { SessionWriter } from "../persistence/session-writer.js"
20: import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
21: import { sanitizeSessionID } from "../persistence/atomic-write.js"
22: import { isValidSessionID } from "../types.js"
23: 
24: // ---------------------------------------------------------------------------
25: // EventCapture class
26: // ---------------------------------------------------------------------------
27: 
28: /**
29:  * Handles session lifecycle events from the OpenCode `event` hook.
30:  *
31:  * Delegated by the hook pipeline. Never writes files directly — relies on
32:  * {@link SessionWriter} for all persistence operations.
33:  */
34: export class EventCapture {
35:   private client: OpenCodeClient
36:   private sessionWriter: SessionWriter
37:   private projectIndexWriter: ProjectIndexWriter | undefined
38: 
39:   /**
40:    * @param deps - Injected dependencies.
41:    * @param deps.client - The OpenCode SDK client for session queries.
42:    * @param deps.sessionWriter - The session writer for persistence.
43:    * @param deps.projectIndexWriter - Optional project index writer for session registration.
44:    */
45:   constructor(deps: {
46:     client: OpenCodeClient
47:     sessionWriter: SessionWriter
48:     projectIndexWriter?: ProjectIndexWriter
49:   }) {
50:     this.client = deps.client
51:     this.sessionWriter = deps.sessionWriter
52:     this.projectIndexWriter = deps.projectIndexWriter
53:   }
54: 
55:   /**
56:    * Handles a session lifecycle event from the `event` hook.
57:    *
58:    * @param event - Hook input containing eventType, sessionID, and raw event data.
59:    * @returns Promise that resolves when the event has been processed.
60:    *
61:    * @remarks
62:    * Supported event types:
63:    * - `session.created` — creates subdir + .md for root sessions
64:    * - `session.idle` — updates session status to "idle"
65:    * - `session.deleted` — marks session status as "completed"
66:    * - `session.error` — marks session status as "error"
67:    */
68:   async handleSessionEvent(event: {
69:     eventType: string
70:     sessionID: string
71:     event: unknown
72:   }): Promise<void> {
73:     try {
74:       if (!event?.sessionID || !isValidSessionID(event.sessionID)) {
75:         return
76:       }
77: 
78:       // Validate sessionID matches its own sanitized form — reject any
79:       // sessionID that would be altered by sanitization (path traversal guard).
80:       if (event.sessionID !== sanitizeSessionID(event.sessionID)) {
81:         console.warn(
82:           `[Harness] Session tracker: sessionID contains unsafe characters: "${event.sessionID}"`,
83:         )
84:         return
85:       }
86: 
87:       // Validate eventType is a recognized session lifecycle type.
88:       const validEventTypes = [
89:         "session.created",
90:         "session.idle",
91:         "session.deleted",
92:         "session.error",
93:         "session.status",
94:         "session.compacted",
95:         "session.updated",
96:       ]
97:       if (!validEventTypes.includes(event.eventType)) {
98:         console.warn(
99:           `[Harness] Session tracker: unexpected event type "${event.eventType}", expected one of: ${validEventTypes.join(", ")}`,
100:         )
101:         // Continue for unrecognized types — they may carry unknown but harmless events.
102:         // Don't return; log is sufficient for observability.
103:       }
104: 
105:       switch (event.eventType) {
106:         case "session.created":
107:           await this.handleSessionCreated(event.sessionID)
108:           break
109:         case "session.idle":
110:           await this.handleSessionIdle(event.sessionID)
111:           break
112:         case "session.deleted":
113:           await this.handleSessionDeleted(event.sessionID)
114:           break
115:         case "session.error":
116:           await this.handleSessionError(event.sessionID)
117:           break
118:         default:
119:           console.warn(
120:             `[Harness] Session tracker: unknown event type "${event.eventType}"`,
121:           )
122:       }
123:     } catch (err) {
124:       console.warn(
125:         "[Harness] Session tracker: event handler failed:",
126:         err,
127:       )
128:     }
129:   }
130: 
131:   /**
132:    * Handles `session.created` — creates subdir + .md for root sessions only.
133:    *
134:    * Uses `client.session.get()` (via `getSession` helper) to check `parentID`.
135:    * Root sessions (null parentID) get a new subdirectory + .md file initialized.
136:    * Child sessions (non-null parentID) are skipped — the task tool handler
137:    * will create their child .json file under the parent's subdir when the
138:    * delegation spawn event fires.
139:    */
140:   private async handleSessionCreated(sessionID: string): Promise<void> {
141:     try {
142:       const session = await getSession(this.client, sessionID)
143:       const parentID = session.parentID as string | null | undefined
144: 
145:       if (parentID === null || parentID === undefined) {
146:         // Root session — create subdirectory + .md file
147:         await this.sessionWriter.createSessionDir(sessionID)
148:         await this.sessionWriter.initializeSessionFile(sessionID, {
149:           sessionID,
150:           parentSessionID: null,
151:           delegationDepth: 0,
152:           status: "active",
153:         })
154: 
155:         // Register the session in the project-level continuity index
156:         if (this.projectIndexWriter) {
157:           await this.projectIndexWriter.addSession(
158:             sessionID,
159:             `${sessionID}/`,
160:             `${sessionID}.md`,
161:           )
162:         }
163:       }
164:       // Child sessions are handled by tool-capture when task tool fires
165:     } catch (err) {
166:       console.warn(
167:         `[Harness] Session tracker: failed to handle session.created for "${sessionID}":`,
168:         err,
169:       )
170:     }
171:   }
172: 
173:   /**
174:    * Handles `session.idle` — updates the session status to "idle".
175:    */
176:   private async handleSessionIdle(sessionID: string): Promise<void> {
177:     try {
178:       await this.sessionWriter.updateFrontmatter(sessionID, {
179:         status: "idle",
180:       } as Partial<import("../types.js").SessionRecord>)
181:     } catch (err) {
182:       console.warn(
183:         `[Harness] Session tracker: failed to handle session.idle for "${sessionID}":`,
184:         err,
185:       )
186:     }
187:   }
188: 
189:   /**
190:    * Handles `session.deleted` — marks the session status as "completed".
191:    */
192:   private async handleSessionDeleted(sessionID: string): Promise<void> {
193:     try {
194:       await this.sessionWriter.updateFrontmatter(sessionID, {
195:         status: "completed",
196:       } as Partial<import("../types.js").SessionRecord>)
197:     } catch (err) {
198:       console.warn(
199:         `[Harness] Session tracker: failed to handle session.deleted for "${sessionID}":`,
200:         err,
201:       )
202:     }
203:   }
204: 
205:   /**
206:    * Handles `session.error` — marks the session status as "error".
207:    */
208:   private async handleSessionError(sessionID: string): Promise<void> {
209:     try {
210:       await this.sessionWriter.updateFrontmatter(sessionID, {
211:         status: "error",
212:       } as Partial<import("../types.js").SessionRecord>)
213:     } catch (err) {
214:       console.warn(
215:         `[Harness] Session tracker: failed to handle session.error for "${sessionID}":`,
216:         err,
217:       )
218:     }
219:   }
220: }

(End of file - total 220 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/features/session-tracker/AGENTS.md
# Session Tracker Feature Guidance

**Parent sector:** `src/features/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — runtime-feature (read-side: session knowledge capture)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/session-tracker/` owns session knowledge capture under `.hivemind/session-tracker/`. It replaces the broken event tracker (`src/task-management/journal/event-tracker/`) with a clean, structured, hook-driven capture system. Source evidence: `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md`.

## 2. Allowed mutation authority

- SessionTracker may write session knowledge files to `.hivemind/session-tracker/` exclusively.
- SessionTracker may read `.hivemind/session-tracker/` files for recovery purposes.
- All writes use atomic rename pattern (D-03): write-to-tmp → `fs.rename()`.

## 3. Forbidden mutations / explicit no-go boundaries

- SessionTracker SHALL NOT write to `.hivemind/event-tracker/` or any legacy paths.
- SessionTracker SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- SessionTracker SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.
- SessionTracker SHALL NOT write files directly from hook callbacks (CQRS compliance per REQ-ST-11).

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Routes OpenCode lifecycle events to SessionTracker methods | Hooks observe; module owns persistence |
| `src/plugin.ts` | Instantiates SessionTracker, passes to hooks via deps injection | One instantiation line only |
| Agents (recovery) | Rebuild context from persisted .md/.json files after disconnection | Read-only consumption |
| Tests | Validate type safety, persistence correctness, and boundary compliance | Unit tests in `tests/features/session-tracker/` |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/session-tracker/`.
- Barrel export at `index.ts`.
- Types in `types.ts`.
- Persistence layer in `persistence/` subdirectory.
- Tests mirror under `tests/features/session-tracker/`.
- All field names use camelCase per REQ-ST-12.
- All writes target `.hivemind/session-tracker/` root — never elsewhere.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/features/session-tracker/`.
- Write safety requires atomic rename verification (interrupt-then-restart test).
- Path safety requires traversal rejection validation.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

## 7. Architecture compliance

- CQRS boundary: Hooks MUST NOT directly write to `.hivemind/`. Hook effects route through this module.
- 9-surface authority: `src/features/session-tracker/` owns typed capture logic; `.hivemind/session-tracker/` owns persisted state.
- Deps injection: SessionTracker receives `{ client, projectRoot }` via constructor (matches DelegationManager pattern).


Instructions from: /Users/apple/hivemind-plugin-private/src/features/AGENTS.md
# Features Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/` owns standalone runtime feature modules that are neither routing, config, coordination, task-management, nor shared leaf utilities. Features include bootstrap (primitive loading and framework detection), background-command (PTY/headless execution), doc-intelligence (markdown parsing/chunking), prompt-packet (packet creation and compaction), runtime-pressure (pressure scoring and control-plane decisions), sdk-supervisor (read-only SDK diagnostics), and agent-work-contracts (durable contract creation/export). Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`. Source-plane classification: Hard Harness — runtime features belong to `src/` (not `.opencode/`). Each feature is a dedicated npm-package module; `.opencode/` Soft Meta-Concepts configure features from outside the package boundary.

## 2. Allowed mutation authority

- Feature modules may define and export typed public interfaces consumed by tools, hooks, and coordination modules.
- Features may perform internal state computation (pressure scoring, profile resolution, document parsing) without durable writes.
- Agent-work-contracts may write durable contract records through `.hivemind/` authority surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features follow factory injection patterns ADAPTED from OMO (`.planning/research/omo-adaptation-architecture-2026-05-07.md`): typed dependencies are injected at composition time, not hidden globals.

## 3. Forbidden mutations / explicit no-go boundaries

- Features SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features SHALL NOT become hidden tool implementations; tool entrypoints live in `src/tools/`.
- Features SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Features SHALL NOT exceed the 500 LOC module cap or introduce circular imports. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Calls feature modules to perform runtime logic | Tools own CQRS mutation; features own computation |
| `src/hooks/` | Reads feature state for guard and observer decisions | Hooks must not mutate feature state directly |
| `src/plugin.ts` | Wires feature dependencies at composition time | Keeps assembly logic only |
| Tests | Validate feature behavior and public exports | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each feature lives in its own subdirectory: `src/features/{feature-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Feature types belong in `{feature-name}/types.ts`; schemas belong in `src/schema-kernel/`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions and `import type` for type-only imports. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
- Docs-only edits remain L5 evidence and must not alter readiness status.


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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/session-tracker/ses_1e97a18f0ffe4tz4GJcaLAfmC3/ses_1e853d316ffeAKivzoh50AQrSd.json"
}
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_02_1Z56Ijk8doaooD3T3sd93010"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/project-index-writer.ts"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_oEvlchS6H8Y6VDDID4ZA2434"
}
```

