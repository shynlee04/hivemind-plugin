# hm/delegate/child/hm-codebase-mapper/long-thorough-audit-read-9-tool-files-a@1

**Session ID:** ses_167fc9f2bffe6Dh7TF2qtjhZ6w
**Created:** 6/5/2026, 8:40:18 PM
**Updated:** 6/5/2026, 8:50:22 PM

---

## User

Long thorough audit. Read 9 tool files and write findings to .hivemind/planning/tools-audit-58-9-2026-06-05/10-comprehensive-test.md. For each: actions, args, status values, integration points, flaws. Be thorough.

Files:
1. src/tools/session/session-tracker.ts
2. src/tools/session/session-hierarchy.ts
3. src/tools/session/session-context.ts
4. src/tools/session/session-delegation-query.ts
5. src/tools/hivemind/hivemind-session-view.ts
6. src/tools/tmux-copilot.ts
7. src/tools/tmux-state-query.ts
8. src/tools/delegation/delegate-task.ts
9. src/tools/delegation/delegation-status.ts

---

## Assistant (Hm-Codebase-Mapper · MiniMax-M3 · 29.1s)

_Thinking:_

The user wants a thorough audit of 9 tool files. Let me read all of them and write comprehensive findings. I'm operating as `hm-codebase-mapper` based on the system prompt. But this task is more of an audit task. Let me proceed to read all 9 files first.

Let me first check the project root context, then read all 9 files in parallel.

I'll perform a thorough audit of these 9 tool files. Let me start by reading all of them in parallel to build a comprehensive understanding.

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/session-tracker.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/session-tracker.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-tracker tool — read-only query/export of session knowledge files.
3:  *
4:  * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
5:  * All I/O is async via node:fs/promises. Six actions:
6:  *   export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions
7:  * Read-only (CQRS read-side). No mutation authority.
8:  * @module tools/hivemind/session-tracker
9:  */
10: 
11: import { tool } from "@opencode-ai/plugin/tool"
12: import { readFile, readdir, access } from "node:fs/promises"
13: import { resolve } from "node:path"
14: import matter from "gray-matter"
15: import { SessionTrackerInputSchema, type SessionTrackerInput } from "../../schema-kernel/session-tracker.schema.js"
16: import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
17: import { isValidSessionID } from "../../features/session-tracker/types.js"
18: import { renderToolResult } from "../../shared/tool-helpers.js"
19: import { success, error } from "../../shared/tool-response.js"
20: import { resolveSessionFile } from "./session-resolver.js"
21: 
22: const MAX_QUERY_LENGTH = 1000
23: type ToolContext = { sessionID?: string }
24: 
25: export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
26:   return tool({
27:     description:
28:       "Query and export session tracker data. Actions: export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions.",
29:     args: {
30:       action: tool.schema.string(),
31:       sessionId: tool.schema.string().optional(),
32:       query: tool.schema.string().optional(),
33:       limit: tool.schema.number().optional(),
34:       format: tool.schema.enum(["markdown", "json"]).optional(),
35:       status: tool.schema.string().optional(),
36:       agentType: tool.schema.string().optional(),
37:       minDepth: tool.schema.number().optional(),
38:       maxDepth: tool.schema.number().optional(),
39:       timeRange: tool.schema.object({
40:         after: tool.schema.string().optional(),
41:         before: tool.schema.string().optional(),
42:       }).optional(),
43:     },
44:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
45:       try {
46:         const input = SessionTrackerInputSchema.parse(rawArgs) as SessionTrackerInput
47:         switch (input.action) {
48:           case "export-session": return handleExportSession(projectRoot, input.sessionId, input.format)
49:           case "get-status": return handleGetStatus(projectRoot, input.sessionId)
50:           case "get-summary": return handleGetSummary(projectRoot, input.sessionId)
51:           case "list-sessions": return handleListSessions(projectRoot, input.limit)
52:           case "search-sessions": return handleSearchSessions(projectRoot, input.query, input.limit)
53:           case "filter-sessions": return handleFilterSessions(projectRoot, input)
54:           default: return renderToolResult(error(`Unknown action`))
55:         }
56:       } catch (caughtError) {
57:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
58:         return renderToolResult(error(message))
59:       }
60:     },
61:   })
62: }
63: 
64: /** Search for query in session's child .json files, returning matches. */
65: async function searchChildJsonFiles(
66:   projectRoot: string,
67:   sessionId: string,
68:   queryLower: string,
69: ): Promise<Array<{ childId: string; field: string; snippet: string }>> {
70:   const matches: Array<{ childId: string; field: string; snippet: string }> = []
71:   try {
72:     const manifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
73:     const raw = await readFile(manifestPath, "utf-8")
74:     const manifest = JSON.parse(raw) as { children?: Record<string, { sessionID: string; childFile: string }> }
75:     const children = manifest.children ?? {}
76:     for (const [childId, childMeta] of Object.entries(children)) {
77:       const childFile = childMeta.childFile || `${childId}.json`
78:       const childPath = safeSessionPath(projectRoot, sessionId, childFile)
79:       try {
80:         const childData = JSON.parse(await readFile(childPath, "utf-8")) as Record<string, unknown>
81:         // Search target fields per D-02
82:         const fieldsToSearch: Array<{ field: string; extract: (d: Record<string, unknown>) => string | undefined }> = [
83:           { field: "lastMessage", extract: (d) => typeof d.lastMessage === "string" ? d.lastMessage : undefined },
84:           { field: "turn.content", extract: (d) => {
85:             const turns = d.turns as Array<{ content?: string }> | undefined
86:             return turns ? turns.map((t) => t.content ?? "").join("\n") : undefined
87:           }},
88:           { field: "journey[].content", extract: (d) => {
89:             const journey = d.journey as Array<{ content?: string }> | undefined
90:             return journey ? journey.map((j) => j.content ?? "").join("\n") : undefined
91:           }},
92:           { field: "delegatedBy.subagentType", extract: (d) => {
93:             const delegatedBy = d.delegatedBy as { subagentType?: string } | undefined
94:             return delegatedBy?.subagentType
95:           }},
96:         ]
97:         for (const { field, extract } of fieldsToSearch) {
98:           const value = extract(childData)
99:           if (value && value.toLowerCase().includes(queryLower)) {
100:             const truncated = value.length > 200 ? value.slice(0, 200) + "..." : value
101:             matches.push({ childId, field, snippet: truncated })
102:             break  // One match per child file
103:           }
104:         }
105:       } catch { /* skip unreadable child file */ }
106:     }
107:   } catch { /* no hierarchy manifest found */ }
108:   return matches
109: }
110: 
111: async function handleExportSession(projectRoot: string, sessionId: string, format?: "markdown" | "json") {
112:   const resolved = await resolveSessionFile(projectRoot, sessionId)
113:   if (!resolved) return renderToolResult(error(`Session not found: ${sessionId}`))
114:   try {
115:     if (resolved.type === "main") {
116:       const content = await readFile(resolved.filePath, "utf-8")
117:       if (format === "json") {
118:         const { data: frontmatter } = matter(content)
119:         return renderToolResult(success(`Session export (JSON): ${sessionId}`, {
120:           sessionId, frontmatter, filePath: resolved.filePath,
121:         }))
122:       }
123:       return renderToolResult(success(`Session export: ${sessionId}`, {
124:         sessionId, content, filePath: resolved.filePath,
125:       }))
126:     } else {
127:       const record = resolved.childRecord!
128:       if (format === "json") {
129:         return renderToolResult(success(`Session export (JSON): ${sessionId}`, {
130:           sessionId, frontmatter: {
131:             sessionID: record.sessionID,
132:             parentSessionID: record.parentSessionID,
133:             delegationDepth: record.delegationDepth,
134:             status: record.status,
135:             created: record.created,
136:             updated: record.updated,
137:           },
138:           filePath: resolved.filePath,
139:         }))
140:       }
141:       const frontmatterLines = [
142:         "---",
143:         `sessionID: ${record.sessionID}`,
144:         `created: ${record.created}`,
145:         `updated: ${record.updated}`,
146:         `parentSessionID: ${record.parentSessionID}`,
147:         `delegationDepth: ${record.delegationDepth}`,
148:         `status: ${record.status}`,
149:         "---",
150:       ]
151:       const turnsLines = record.turns.map((turn) => {
152:         const isUser = turn.role === "user" || turn.actor === "user"
153:         const header = isUser ? `## USER (turn ${turn.turn})` : `## ${turn.actor || "assistant"}`
154:         return `${header}\n\n${turn.content}`
155:       })
156:       const markdown = [...frontmatterLines, "", ...turnsLines].join("\n")
157:       return renderToolResult(success(`Session export: ${sessionId}`, {
158:         sessionId, content: markdown, filePath: resolved.filePath,
159:       }))
160:     }
161:   } catch {
162:     return renderToolResult(error(`Session not found: ${sessionId}`))
163:   }
164: }
165: 
166: async function handleGetStatus(projectRoot: string, sessionId: string) {
167:   const resolved = await resolveSessionFile(projectRoot, sessionId)
168:   if (!resolved) return renderToolResult(error(`Session status not found: ${sessionId}`))
169:   try {
170:     if (resolved.type === "main") {
171:       const raw = await readFile(resolved.continuityPath, "utf-8")
172:       const json = JSON.parse(raw) as Record<string, unknown>
173:       return renderToolResult(success(`Session status for ${sessionId}`, {
174:         sessionId,
175:         status: json.status ?? "unknown",
176:         lastUpdated: json.lastUpdated ?? null,
177:         turnCount: json.turnCount ?? 0,
178:         childCount: json.childCount ?? 0,
179:         toolSummary: json.toolSummary ?? {},
180:       }))
181:     } else {
182:       const record = resolved.childRecord!
183:       const toolSummary: Record<string, number> = {}
184:       for (const turn of record.turns) {
185:         for (const toolCall of turn.tools || []) {
186:           if (toolCall.tool) {
187:             toolSummary[toolCall.tool] = (toolSummary[toolCall.tool] ?? 0) + 1
188:           }
189:         }
190:       }
191:       return renderToolResult(success(`Session status for ${sessionId}`, {
192:         sessionId,
193:         status: record.status ?? "unknown",
194:         lastUpdated: record.updated ?? null,
195:         turnCount: record.turns.length,
196:         childCount: record.children?.length ?? 0,
197:         toolSummary,
198:       }))
199:     }
200:   } catch {
201:     return renderToolResult(error(`Session status not found: ${sessionId}`))
202:   }
203: }
204: 
205: async function handleGetSummary(projectRoot: string, sessionId: string) {
206:   const resolved = await resolveSessionFile(projectRoot, sessionId)
207:   if (!resolved) return renderToolResult(error(`Session summary not found: ${sessionId}`))
208:   try {
209:     if (resolved.type === "main") {
210:       const raw = await readFile(resolved.filePath, "utf-8")
211:       const { data: frontmatter } = matter(raw)
212:       return renderToolResult(success(`Session summary for ${sessionId}`, {
213:         sessionId, frontmatter,
214:       }))
215:     } else {
216:       const record = resolved.childRecord!
217:       const frontmatter = {
218:         sessionID: record.sessionID,
219:         parentSessionID: record.parentSessionID,
220:         delegationDepth: record.delegationDepth,
221:         status: record.status,
222:         created: record.created,
223:         updated: record.updated,
224:         delegatedBy: record.delegatedBy,
225:         mainAgent: record.mainAgent,
226:       }
227:       return renderToolResult(success(`Session summary for ${sessionId}`, {
228:         sessionId, frontmatter,
229:       }))
230:     }
231:   } catch {
232:     return renderToolResult(error(`Session summary not found: ${sessionId}`))
233:   }
234: }
235: 
236: async function handleListSessions(projectRoot: string, limit: number) {
237:   // Try project-continuity.json index first
238:   try {
239:     const indexPath = resolve(sessionTrackerRoot(projectRoot), "project-continuity.json")
240:     await access(indexPath)
241:     const raw = await readFile(indexPath, "utf-8")
242:     const index = JSON.parse(raw) as {
243:       sessions?: Record<string, unknown>
244:       chronologicalOrder?: string[]
245:       lastUpdated?: string
246:     }
247:     const allSessions = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
248:     const sessionIds = allSessions.slice(0, limit)
249:     const details = sessionIds.map((sessionId) => ({
250:       sessionId, metadata: index.sessions?.[sessionId] ?? null,
251:     }))
252:     return renderToolResult(success(`Found ${sessionIds.length} sessions`, {
253:       total: allSessions.length, sessions: details,
254:       hasMore: allSessions.length > limit, indexLastUpdated: index.lastUpdated ?? null,
255:     }))
256:   } catch {
257:     // Fall through to directory scan (GAP-06)
258:   }
259: 
260:   // GAP-06: Directory-scanning fallback when index is stale or missing
261:   try {
262:     const trackerRoot = sessionTrackerRoot(projectRoot)
263:     const entries = await readdir(trackerRoot, { withFileTypes: true })
264:     const sessionDirs = entries
265:       .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
266:       .map((e) => e.name)
267:     const sessions = sessionDirs.slice(0, limit).map((sessionId) => ({ sessionId }))
268:     return renderToolResult(success(`Found ${sessions.length} sessions (directory scan)`, {
269:       total: sessionDirs.length, sessions,
270:       hasMore: sessionDirs.length > limit, indexLastUpdated: null,
271:     }))
272:   } catch {
273:     return renderToolResult(error("No session index found. Session tracking may not be running."))
274:   }
275: }
276: 
277: async function handleSearchSessions(projectRoot: string, query: string, limit: number) {
278:   if (!query || query.length > MAX_QUERY_LENGTH) {
279:     return renderToolResult(error("Query must be between 1 and 1000 characters."))
280:   }
281:   const trackerRoot = sessionTrackerRoot(projectRoot)
282:   const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []
283:   const fileWarnings: string[] = []
284:   try {
285:     const entries = await readdir(trackerRoot, { withFileTypes: true })
286:     for (const entry of entries) {
287:       if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
288:       const sessionId = entry.name
289:       if (!isValidSessionID(sessionId)) continue
290:       const mdPath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
291:       try { await access(mdPath) } catch { continue }
292:       try {
293:         const content = await readFile(mdPath, "utf-8")
294:         const contentBytes = Buffer.byteLength(content, "utf-8")
295:         if (contentBytes > 1_000_000) {
296:           fileWarnings.push(`${sessionId}/${sessionId}.md: ${(contentBytes / 1024 / 1024).toFixed(1)}MB — large file may slow search`)
297:         }
298:         const lines = content.split("\n")
299:         const queryLower = query.toLowerCase()
300:         for (let i = 0; i < lines.length; i++) {
301:           if (lines[i].toLowerCase().includes(queryLower)) {
302:             const start = Math.max(0, i - 2)
303:             const end = Math.min(lines.length, i + 3)
304:             matches.push({
305:               sessionId, file: `${sessionId}/${sessionId}.md`,
306:               snippet: lines.slice(start, end).join("\n").trim(), matchLine: i + 1,
307:             })
308:             break
309:           }
310:         }
311:       } catch { /* skip unreadable */ }
312: 
313:       // Also search child .json files per D-02
314:       const childMatches = await searchChildJsonFiles(projectRoot, sessionId, query)
315:       for (const cm of childMatches) {
316:         matches.push({
317:           sessionId, file: `${sessionId}/${cm.childId}.json`,
318:           snippet: `[${cm.field}] ${cm.snippet}`, matchLine: 0,
319:         })
320:       }
321:     }
322:   } catch {
323:     return renderToolResult(error("Unable to scan session directory."))
324:   }
325:   const paginated = matches.slice(0, limit)
326:   return renderToolResult(success(`Found ${matches.length} matches across sessions`, {
327:     totalMatches: matches.length, sessions: paginated, hasMore: matches.length > limit,
328:     fileWarnings: fileWarnings.length > 0 ? fileWarnings : undefined,
329:   }))
330: }
331: 
332: /**
333:  * Filter sessions using per-session hierarchy-manifest.json files.
334:  *
335:  * Aggregates across all session directories, reading each session's
336:  * hierarchy-manifest.json for fast queries by status, agentType, delegation depth,
337:  * and time range. Falls back to directory scan if no manifests exist.
338:  */
339: async function handleFilterSessions(
340:   projectRoot: string,
341:   input: Record<string, unknown>,
342: ) {
343:   const trackerRoot = sessionTrackerRoot(projectRoot)
344:   const inputAny = input as { status?: string; agentType?: string; minDepth?: number; maxDepth?: number; timeRange?: { after?: string; before?: string }; limit: number }
345:   const statusLower = inputAny.status?.toLowerCase()
346:   const agentLower = inputAny.agentType?.toLowerCase()
347:   const afterDate = inputAny.timeRange?.after ? new Date(inputAny.timeRange.after).getTime() : undefined
348:   const beforeDate = inputAny.timeRange?.before ? new Date(inputAny.timeRange.before).getTime() : undefined
349:   const matches: Array<{ sessionId: string; status?: string; agentType?: string; depth?: number; lastUpdated?: string }> = []
350: 
351:   try {
352:     const entries = await readdir(trackerRoot, { withFileTypes: true })
353:     for (const entry of entries) {
354:       if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
355:       const sessionId = entry.name
356:       if (!isValidSessionID(sessionId)) continue
357:       const manifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
358:       try {
359:         await access(manifestPath)
360:         const raw = await readFile(manifestPath, "utf-8")
361:         const manifest = JSON.parse(raw) as {
362:           rootMainSessionID?: string
363:           lastUpdated?: string
364:           maxDepth?: number
365:           children?: Record<string, {
366:             sessionID?: string
367:             status?: string
368:             subagentType?: string
369:             delegationDepth?: number
370:             updatedAt?: string
371:           }>
372:         }
373:         // Add root session itself
374:         const rootId = manifest.rootMainSessionID ?? sessionId
375:         matches.push({
376:           sessionId: rootId,
377:           status: "active",
378:           depth: 0,
379:           lastUpdated: manifest.lastUpdated,
380:         })
381:         // Add children from manifest with their metadata
382:         if (manifest.children) {
383:           for (const [, childMeta] of Object.entries(manifest.children)) {
384:             if (childMeta.sessionID) {
385:               matches.push({
386:                 sessionId: childMeta.sessionID,
387:                 status: childMeta.status,
388:                 agentType: childMeta.subagentType,
389:                 depth: childMeta.delegationDepth,
390:                 lastUpdated: childMeta.updatedAt,
391:               })
392:             }
393:           }
394:         }
395:       } catch {
396:         // No manifest for this session — skip
397:       }
398:     }
399:   } catch {
400:     return renderToolResult(error("Unable to scan session directory for filtering."))
401:   }
402: 
403:   // Apply filters
404:   const filtered = matches.filter((meta) => {
405:     if (statusLower && meta.status?.toLowerCase() !== statusLower) return false
406:     if (agentLower && meta.agentType?.toLowerCase() !== agentLower) return false
407:     if (inputAny.minDepth !== undefined && (meta.depth ?? 0) < inputAny.minDepth) return false
408:     if (inputAny.maxDepth !== undefined && (meta.depth ?? 0) > inputAny.maxDepth) return false
409:     if (afterDate !== undefined || beforeDate !== undefined) {
410:       const updated = meta.lastUpdated ? new Date(meta.lastUpdated).getTime() : undefined
411:       if (updated === undefined) return false
412:       if (afterDate !== undefined && updated < afterDate) return false
413:       if (beforeDate !== undefined && updated > beforeDate) return false
414:     }
415:     return true
416:   })
417: 
418:   const paginated = filtered.slice(0, inputAny.limit)
419:   return renderToolResult(success(`Found ${paginated.length} sessions matching filters`, {
420:     totalMatches: filtered.length, sessions: paginated,
421:     hasMore: filtered.length > inputAny.limit, indexLastUpdated: null,
422:   }))
423: }

(End of file - total 423 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/session-hierarchy.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/session-hierarchy.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-hierarchy tool — read-only navigation of session delegation trees.
3:  *
4:  * Four actions: get-children, get-parent-chain, get-delegation-depth, get-manifest.
5:  * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
6:  * Read-only (CQRS read-side). No mutation authority.
7:  * @module tools/hivemind/session-hierarchy
8:  */
9: 
10: import { tool } from "@opencode-ai/plugin/tool"
11: import { readFile } from "node:fs/promises"
12: import { SessionHierarchyInputSchema, type SessionHierarchyInput } from "../../schema-kernel/session-tracker.schema.js"
13: import { isValidSessionID } from "../../features/session-tracker/types.js"
14: import { renderToolResult } from "../../shared/tool-helpers.js"
15: import { success, error } from "../../shared/tool-response.js"
16: import { resolveSessionFile } from "./session-resolver.js"
17: 
18: import type { ChildRef } from "../../features/session-tracker/types.js"
19: 
20: type ToolContext = { sessionID?: string }
21: 
22: interface ContinuityRecord {
23:   sessionID: string
24:   parentSessionID?: string | null
25:   delegationDepth?: number
26:   status?: string
27:   hierarchy?: {
28:     root?: string
29:     children?: Record<string, ChildRef & { status?: string; delegationDepth?: number; children?: Record<string, unknown> }>
30:   }
31: }
32: 
33: export function createSessionHierarchyTool(projectRoot: string): ReturnType<typeof tool> {
34:   return tool({
35:     description:
36:       "Navigate session delegation hierarchy. Actions: get-children, get-parent-chain, get-delegation-depth, get-manifest.",
37:     args: {
38:       action: tool.schema.enum(["get-children", "get-parent-chain", "get-delegation-depth", "get-manifest"]),
39:       sessionId: tool.schema.string(),
40:       includeStatus: tool.schema.boolean().optional(),
41:     },
42:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
43:       try {
44:         const input = SessionHierarchyInputSchema.parse(rawArgs) as SessionHierarchyInput
45:         switch (input.action) {
46:           case "get-children": return handleGetChildren(projectRoot, input.sessionId, input.includeStatus)
47:           case "get-parent-chain": return handleGetParentChain(projectRoot, input.sessionId)
48:           case "get-delegation-depth": return handleGetDelegationDepth(projectRoot, input.sessionId)
49:           case "get-manifest": return handleGetManifest(projectRoot, input.sessionId)
50:           default: return renderToolResult(error(`Unknown action`))
51:         }
52:       } catch (caughtError) {
53:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
54:         return renderToolResult(error(message))
55:       }
56:     },
57:   })
58: }
59: 
60: /** Recursively searches the hierarchy tree to find the entry matching targetId. */
61: function findHierarchyEntry(
62:   children: Record<string, any> | undefined,
63:   targetId: string,
64:   parentId: string | null = null,
65: ): { entry: any; parentId: string | null } | null {
66:   if (!children) return null
67:   if (children[targetId]) {
68:     return { entry: children[targetId], parentId }
69:   }
70:   for (const [childId, childEntry] of Object.entries(children)) {
71:     const found = findHierarchyEntry(childEntry.children, targetId, childId)
72:     if (found) return found
73:   }
74:   return null
75: }
76: 
77: /** Read session continuity JSON, returning parsed record or null. */
78: async function readContinuity(projectRoot: string, sessionId: string): Promise<ContinuityRecord | null> {
79:   const resolved = await resolveSessionFile(projectRoot, sessionId)
80:   if (!resolved) return null
81: 
82:   if (resolved.type === "main") {
83:     try {
84:       const raw = await readFile(resolved.continuityPath, "utf-8")
85:       return JSON.parse(raw) as ContinuityRecord
86:     } catch {
87:       return null
88:     }
89:   } else {
90:     // Child session
91:     try {
92:       const raw = await readFile(resolved.continuityPath, "utf-8")
93:       const rootContinuity = JSON.parse(raw) as ContinuityRecord
94:       const found = findHierarchyEntry(rootContinuity.hierarchy?.children, sessionId, resolved.rootSessionId)
95:       if (found) {
96:         return {
97:           sessionID: sessionId,
98:           parentSessionID: found.parentId,
99:           delegationDepth: found.entry.depth ?? found.entry.delegationDepth,
100:           status: found.entry.status,
101:           hierarchy: {
102:             root: resolved.rootSessionId,
103:             children: found.entry.children || {},
104:           },
105:         }
106:       }
107:       // Fallback to child record metadata
108:       const record = resolved.childRecord!
109:       return {
110:         sessionID: sessionId,
111:         parentSessionID: record.parentSessionID,
112:         delegationDepth: record.delegationDepth,
113:         status: record.status,
114:         hierarchy: {
115:           root: resolved.rootSessionId,
116:           children: {},
117:         },
118:       }
119:     } catch {
120:       return null
121:     }
122:   }
123: }
124: 
125: /** Normalize children to array — handles both Record<string, ...> (object) and Array formats. */
126: function normalizeChildren(
127:   children: unknown,
128: ): Array<{ sessionID: string; childFile: string; status?: string; delegationDepth?: number }> {
129:   if (!children) return []
130:   if (Array.isArray(children)) return children as Array<{ sessionID: string; childFile: string; status?: string; delegationDepth?: number }>
131:   if (typeof children === "object") {
132:     return Object.values(children).map((v) => {
133:       const entry = v as Record<string, unknown>
134:       return {
135:         sessionID: typeof entry.sessionID === "string" ? entry.sessionID : String(entry.file ?? ""),
136:         childFile: typeof entry.childFile === "string" ? entry.childFile : (typeof entry.file === "string" ? entry.file : ""),
137:         status: typeof entry.status === "string" ? entry.status : undefined,
138:         delegationDepth: typeof entry.depth === "number" ? entry.depth : undefined,
139:       }
140:     })
141:   }
142:   return []
143: }
144: 
145: /** Get children of a session. */
146: async function handleGetChildren(projectRoot: string, sessionId: string, includeStatus: boolean | undefined) {
147:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
148:   const record = await readContinuity(projectRoot, sessionId)
149:   if (!record) return renderToolResult(error(`Session not found: ${sessionId}`))
150:   const children = normalizeChildren(record.hierarchy?.children).map((c) => ({
151:     sessionId: c.sessionID,
152:     childFile: c.childFile,
153:     status: includeStatus !== false ? c.status ?? record.status : undefined,
154:     delegationDepth: c.delegationDepth ?? (record.delegationDepth ?? 0) + 1,
155:   }))
156:   return renderToolResult(success(`Children of ${sessionId}`, {
157:     sessionId, childCount: children.length, children,
158:   }))
159: }
160: 
161: /** Walk parent chain up to root. */
162: async function handleGetParentChain(projectRoot: string, sessionId: string) {
163:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
164:   const chain: Array<{ sessionId: string; status: string; depth: number }> = []
165:   let current = sessionId
166:   let depth = 0
167:   const MAX_DEPTH = 50
168:   while (current && depth < MAX_DEPTH) {
169:     const record = await readContinuity(projectRoot, current)
170:     if (!record) break
171:     chain.push({ sessionId: record.sessionID, status: record.status ?? "unknown", depth })
172:     if (!record.parentSessionID) break
173:     current = record.parentSessionID
174:     depth++
175:   }
176:   return renderToolResult(success(`Parent chain for ${sessionId}`, {
177:     sessionId, chainLength: chain.length, chain,
178:   }))
179: }
180: 
181: /** Recursively compute max delegation depth under a session. */
182: async function handleGetDelegationDepth(projectRoot: string, sessionId: string) {
183:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
184:   const depth = await computeDepth(projectRoot, sessionId, new Set())
185:   return renderToolResult(success(`Delegation depth for ${sessionId}`, {
186:     sessionId, delegationDepth: depth,
187:   }))
188: }
189: 
190: const COMPUTE_DEPTH_MAX = 100
191: 
192: async function computeDepth(projectRoot: string, sessionId: string, visited: Set<string>): Promise<number> {
193:   if (visited.has(sessionId)) return 0
194:   if (visited.size >= COMPUTE_DEPTH_MAX) return 0
195:   visited.add(sessionId)
196:   const record = await readContinuity(projectRoot, sessionId)
197:   if (!record) return 0
198:   const children = normalizeChildren(record.hierarchy?.children)
199:   if (children.length === 0) return 0
200:   let maxChildDepth = 0
201:   for (const child of children) {
202:     const childDepth = await computeDepth(projectRoot, child.sessionID, visited)
203:     maxChildDepth = Math.max(maxChildDepth, childDepth + 1)
204:   }
205:   return maxChildDepth
206: }
207: 
208: /** Read hierarchy-manifest.json for a session. */
209: async function handleGetManifest(projectRoot: string, sessionId: string) {
210:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
211:   const resolved = await resolveSessionFile(projectRoot, sessionId)
212:   if (!resolved) return renderToolResult(error(`Manifest not found for session: ${sessionId}`))
213:   try {
214:     const manifestPath = resolved.manifestPath
215:     const raw = await readFile(manifestPath, "utf-8")
216:     const manifest = JSON.parse(raw) as {
217:       version?: string
218:       rootMainSessionID?: string
219:       lastUpdated?: string
220:       totalChildren?: number
221:       maxDepth?: number
222:       children?: Record<string, {
223:         sessionID: string
224:         parentSessionID?: string
225:         rootMainSessionID?: string
226:         delegationDepth?: number
227:         delegatedBy?: string
228:         subagentType?: string
229:         status?: string
230:         turnCount?: number
231:         childFile?: string
232:         createdAt?: string
233:       }>
234:     }
235:     const childrenMap = manifest.children ?? {}
236:     const children = Object.entries(childrenMap).map(([childId, c]) => ({
237:       childSessionId: childId,
238:       status: c.status ?? "unknown",
239:       delegatedBy: c.delegatedBy ?? null,
240:       subagentType: c.subagentType ?? null,
241:       depth: c.delegationDepth ?? 0,
242:       turnCount: c.turnCount ?? 0,
243:       createdAt: c.createdAt ?? null,
244:     }))
245:     return renderToolResult(success(`Manifest for ${sessionId}`, {
246:       sessionId,
247:       rootMainSessionID: manifest.rootMainSessionID ?? resolved.rootSessionId,
248:       childCount: children.length,
249:       totalChildren: manifest.totalChildren ?? children.length,
250:       maxDepth: manifest.maxDepth ?? 0,
251:       lastUpdated: manifest.lastUpdated ?? null,
252:       children,
253:     }))
254:   } catch {
255:     // Attempt fallback: check if session has a continuity file with children
256:     try {
257:       const record = await readContinuity(projectRoot, sessionId)
258:       if (record && record.hierarchy?.children) {
259:         const children = normalizeChildren(record.hierarchy.children)
260:         if (children.length > 0) {
261:           return renderToolResult(success(`Manifest (from continuity fallback) for ${sessionId}`, {
262:             sessionId,
263:             rootMainSessionID: resolved.rootSessionId,
264:             childCount: children.length,
265:             totalChildren: children.length,
266:             maxDepth: 0,
267:             lastUpdated: null,
268:             children: children.map((c) => ({
269:               childSessionId: c.sessionID,
270:               status: c.status ?? "unknown",
271:               delegatedBy: null,
272:               subagentType: null,
273:               depth: c.delegationDepth ?? 0,
274:               turnCount: 0,
275:               createdAt: null,
276:             })),
277:           }))
278:         }
279:       }
280:     } catch { /* fallback failed too */ }
281:     return renderToolResult(error(`Manifest not found for session: ${sessionId}. Hierarchies are only tracked for root sessions that have active delegation children.`))
282:   }
283: }

(End of file - total 283 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/session-context.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/session-context.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-context tool — read-only cross-session synthesis and discovery.
3:  *
4:  * Four actions: find-related, cross-reference, synthesize-context, aggregate.
5:  * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
6:  * Read-only (CQRS read-side). No mutation authority.
7:  * @module tools/hivemind/session-context
8:  */
9: 
10: import { tool } from "@opencode-ai/plugin/tool"
11: import { readFile, readdir } from "node:fs/promises"
12: import { resolve } from "node:path"
13: import matter from "gray-matter"
14: import { SessionContextInputSchema, type SessionContextInput } from "../../schema-kernel/session-tracker.schema.js"
15: import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
16: import { isValidSessionID } from "../../features/session-tracker/types.js"
17: import { renderToolResult } from "../../shared/tool-helpers.js"
18: import { success, error } from "../../shared/tool-response.js"
19: import { resolveSessionFile } from "./session-resolver.js"
20: 
21: type ToolContext = { sessionID?: string }
22: 
23: interface ProjectIndex {
24:   sessions?: Record<string, { toolSummary?: Record<string, number>; created?: string }>
25:   chronologicalOrder?: string[]
26: }
27: 
28: interface ContinuityRecord {
29:   sessionID: string; status?: string; parentSessionID?: string | null
30:   delegationDepth?: number; turnCount?: number; childCount?: number
31:   toolSummary?: Record<string, number>; lastUpdated?: string
32:   hierarchy?: {
33:     root?: string
34:     children?: Record<string, any>
35:   }
36: }
37: 
38: const TIME_PROXIMITY_MS = 30 * 60 * 1000 // ±30 minutes
39: 
40: export function createSessionContextTool(projectRoot: string): ReturnType<typeof tool> {
41:   return tool({
42:     description:
43:       "Cross-session synthesis and discovery. Actions: find-related, cross-reference, synthesize-context, aggregate.",
44:     args: {
45:       action: tool.schema.enum(["find-related", "cross-reference", "synthesize-context", "aggregate"]),
46:       sessionId: tool.schema.string().optional(),
47:       query: tool.schema.string().optional(),
48:       maxRelated: tool.schema.number().optional(),
49:       groupBy: tool.schema.enum(["subagentType", "status"]).optional(),
50:     },
51:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
52:       try {
53:         const input = SessionContextInputSchema.parse(rawArgs) as SessionContextInput
54:         switch (input.action) {
55:           case "find-related": return handleFindRelated(projectRoot, input.sessionId, input.maxRelated)
56:           case "cross-reference": return handleCrossReference(projectRoot, input.sessionId, input.query)
57:           case "synthesize-context": return handleSynthesizeContext(projectRoot, input.sessionId)
58:           case "aggregate": return handleAggregate(projectRoot, input.groupBy)
59:           default: return renderToolResult(error(`Unknown action`))
60:         }
61:       } catch (caughtError) {
62:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
63:         return renderToolResult(error(message))
64:       }
65:     },
66:   })
67: }
68: 
69: /** Read project-continuity.json index (flat path under session-tracker root). */
70: async function readProjectIndex(projectRoot: string): Promise<ProjectIndex | null> {
71:   try {
72:     const indexPath = resolve(sessionTrackerRoot(projectRoot), "project-continuity.json")
73:     const raw = await readFile(indexPath, "utf-8")
74:     return JSON.parse(raw) as ProjectIndex
75:   } catch { return null }
76: }
77: 
78: /** Recursively searches the hierarchy tree to find the entry matching targetId. */
79: function findHierarchyEntry(
80:   children: Record<string, any> | undefined,
81:   targetId: string,
82:   parentId: string | null = null,
83: ): { entry: any; parentId: string | null } | null {
84:   if (!children) return null
85:   if (children[targetId]) {
86:     return { entry: children[targetId], parentId }
87:   }
88:   for (const [childId, childEntry] of Object.entries(children)) {
89:     const found = findHierarchyEntry(childEntry.children, targetId, childId)
90:     if (found) return found
91:   }
92:   return null
93: }
94: 
95: /** Read a session's continuity JSON or return null. */
96: async function readContinuity(projectRoot: string, sessionId: string): Promise<ContinuityRecord | null> {
97:   const resolved = await resolveSessionFile(projectRoot, sessionId)
98:   if (!resolved) return null
99: 
100:   if (resolved.type === "main") {
101:     try {
102:       const raw = await readFile(resolved.continuityPath, "utf-8")
103:       return JSON.parse(raw) as ContinuityRecord
104:     } catch {
105:       return null
106:     }
107:   } else {
108:     // Child session
109:     try {
110:       const raw = await readFile(resolved.continuityPath, "utf-8")
111:       const rootContinuity = JSON.parse(raw) as ContinuityRecord
112:       const found = findHierarchyEntry(rootContinuity.hierarchy?.children, sessionId, resolved.rootSessionId)
113:       if (found) {
114:         return {
115:           sessionID: sessionId,
116:           parentSessionID: found.parentId,
117:           delegationDepth: found.entry.depth ?? found.entry.delegationDepth,
118:           status: found.entry.status,
119:           hierarchy: {
120:             root: resolved.rootSessionId,
121:             children: found.entry.children || {},
122:           },
123:         }
124:       }
125:       // Fallback to child record metadata
126:       const record = resolved.childRecord!
127:       return {
128:         sessionID: sessionId,
129:         parentSessionID: record.parentSessionID,
130:         delegationDepth: record.delegationDepth,
131:         status: record.status,
132:         hierarchy: {
133:           root: resolved.rootSessionId,
134:           children: {},
135:         },
136:       }
137:     } catch {
138:       return null
139:     }
140:   }
141: }
142: 
143: /** Find sessions related by tool overlap and time proximity. */
144: async function handleFindRelated(projectRoot: string, sessionId: string, maxRelated: number) {
145:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
146:   const index = await readProjectIndex(projectRoot)
147:   if (!index) return renderToolResult(error("No project index found."))
148:   const sourceSessions = index.sessions ?? {}
149:   const source = sourceSessions[sessionId]
150:   if (!source) return renderToolResult(error(`Session not found in index: ${sessionId}`))
151:   const sourceTools = source.toolSummary ?? {}
152:   const sourceCreated = source.created ? new Date(source.created).getTime() : 0
153:   const related: Array<{ sessionId: string; score: number; sharedTools: string[]; timeProximity: boolean }> = []
154:   for (const [otherId, other] of Object.entries(sourceSessions)) {
155:     if (otherId === sessionId) continue
156:     const otherTools = other.toolSummary ?? {}
157:     const sharedTools = Object.keys(sourceTools).filter((t) => otherTools[t])
158:     const toolScore = sharedTools.length > 0 ? sharedTools.length : 0
159:     const otherCreated = other.created ? new Date(other.created).getTime() : 0
160:     const timeProximity = sourceCreated > 0 && Math.abs(sourceCreated - otherCreated) < TIME_PROXIMITY_MS
161:     const score = toolScore * 2 + (timeProximity ? 1 : 0)
162:     if (score > 0) related.push({ sessionId: otherId, score, sharedTools, timeProximity })
163:   }
164:   related.sort((a, b) => b.score - a.score)
165:   const paginated = related.slice(0, maxRelated)
166:   return renderToolResult(success(`Found ${related.length} related sessions`, {
167:     sessionId, totalRelated: related.length, related: paginated, hasMore: related.length > maxRelated,
168:   }))
169: }
170: 
171: /** Cross-reference sessions for a tool or agent name. */
172: async function handleCrossReference(projectRoot: string, sessionId: string, query?: string) {
173:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
174:   const trackerRoot = sessionTrackerRoot(projectRoot)
175:   // query is a tool/agent name (e.g. "bash", "delegate") — NOT a session ID
176:   // Only validate sessionId; query is a free-text search term
177:   const searchQuery = (query ?? sessionId).trim()
178:   if (!searchQuery) return renderToolResult(error("Cross-reference requires a query or sessionId."))
179:   const refs: Array<{ sessionId: string; toolMatches: string[] }> = []
180:   try {
181:     const entries = await readdir(trackerRoot, { withFileTypes: true })
182:     for (const entry of entries) {
183:       if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
184:       const otherId = entry.name
185:       if (!isValidSessionID(otherId)) continue
186:       const record = await readContinuity(projectRoot, otherId)
187:       if (!record?.toolSummary) continue
188:       const toolMatches = Object.keys(record.toolSummary).filter((t) =>
189:         t.toLowerCase().includes(searchQuery.toLowerCase()),
190:       )
191:       if (toolMatches.length > 0) refs.push({ sessionId: otherId, toolMatches: toolMatches.slice(0, 10) })
192:     }
193:   } catch { return renderToolResult(error("Unable to scan session directory.")) }
194:   return renderToolResult(success(`Cross-reference results for "${searchQuery}"`, {
195:     sessionId, query: searchQuery, totalRefs: refs.length, refs: refs.slice(0, 50),
196:   }))
197: }
198: 
199: /** Synthesize compact markdown context for a session. */
200: async function handleSynthesizeContext(projectRoot: string, sessionId: string) {
201:   if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
202:   const record = await readContinuity(projectRoot, sessionId)
203:   if (!record) return renderToolResult(error(`Session not found: ${sessionId}`))
204:   const resolved = await resolveSessionFile(projectRoot, sessionId)
205:   if (!resolved) return renderToolResult(error(`Session not found: ${sessionId}`))
206:   let frontmatter: Record<string, unknown> = {}
207:   try {
208:     if (resolved.type === "main") {
209:       const raw = await readFile(resolved.filePath, "utf-8")
210:       const parsed = matter(raw)
211:       frontmatter = parsed.data as Record<string, unknown>
212:     } else {
213:       const childRecord = resolved.childRecord!
214:       frontmatter = {
215:         sessionID: childRecord.sessionID,
216:         parentSessionID: childRecord.parentSessionID,
217:         delegationDepth: childRecord.delegationDepth,
218:         status: childRecord.status,
219:         created: childRecord.created,
220:         updated: childRecord.updated,
221:         delegatedBy: childRecord.delegatedBy,
222:         mainAgent: childRecord.mainAgent,
223:       }
224:     }
225:   } catch { /* frontmatter optional */ }
226:   const tools = record.toolSummary ?? {}
227:   const toolList = Object.entries(tools)
228:     .sort(([, a], [, b]) => (b as number) - (a as number))
229:     .slice(0, 15)
230:     .map(([name, count]) => `${name}: ${count}`)
231:     .join("\n- ")
232:   const markdown = [
233:     `# Session: ${sessionId}`,
234:     `Status: ${record.status ?? "unknown"}  `,
235:     `Turns: ${record.turnCount ?? "?"}  `,
236:     `Children: ${record.childCount ?? "?"}  `,
237:     `Depth: ${record.delegationDepth ?? "?"}  `,
238:     `Last updated: ${record.lastUpdated ?? "?"}`,
239:     ``,
240:     `## Frontmatter`,
241:     ...Object.entries(frontmatter).map(([k, v]) => `- **${k}**: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`),
242:     ``,
243:     `## Top Tools (${Object.keys(tools).length} total)`,
244:     toolList ? `- ${toolList}` : "No tool usage recorded.",
245:   ].join("\n")
246:   return renderToolResult(success(`Synthesized context for ${sessionId}`, {
247:     sessionId, context: markdown,
248:   }))
249: }
250: 
251: /** Cross-session aggregation by status or subagentType. */
252: async function handleAggregate(projectRoot: string, groupBy: "subagentType" | "status") {
253:   const index = await readProjectIndex(projectRoot)
254:   if (!index) return renderToolResult(error("No project index found. Session tracking may not be running."))
255: 
256:   const sessions = index.sessions ?? {}
257:   const counts: Record<string, number> = {}
258: 
259:   if (groupBy === "status") {
260:     // Fast path: status is in project-continuity.json index
261:     for (const [, meta] of Object.entries(sessions)) {
262:       const metaRecord = meta as Record<string, unknown>
263:       const status = typeof metaRecord.status === "string" ? metaRecord.status : "unknown"
264:       counts[status] = (counts[status] ?? 0) + 1
265:     }
266:   } else if (groupBy === "subagentType") {
267:     // Loop through all root sessions from the project index and aggregate real subagent types
268:     for (const rootId of Object.keys(sessions)) {
269:       // 1. Every root session itself is an opencode-session
270:       counts["opencode-session"] = (counts["opencode-session"] ?? 0) + 1
271: 
272:       // 2. Read its hierarchy manifest to get all child sessions and count their actual subagentType
273:       const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
274:       try {
275:         const raw = await readFile(manifestPath, "utf-8")
276:         const manifest = JSON.parse(raw) as { children?: Record<string, { subagentType?: string }> }
277:         if (manifest.children) {
278:           for (const child of Object.values(manifest.children)) {
279:             const agentType = child.subagentType || "unknown-subagent"
280:             counts[agentType] = (counts[agentType] ?? 0) + 1
281:           }
282:         }
283:       } catch {
284:         // No hierarchy manifest or unreadable, check if the directory exists
285:       }
286:     }
287:   }
288: 
289:   // Sort by count descending
290:   const sorted = Object.fromEntries(
291:     Object.entries(counts).sort(([, a], [, b]) => b - a),
292:   )
293: 
294:   const totalSessions = Object.keys(sessions).length
295:   return renderToolResult(success(`Aggregated ${totalSessions} sessions by ${groupBy}`, {
296:     groupBy,
297:     totalSessions,
298:     counts: sorted,
299:     timestamp: new Date().toISOString(),
300:   }))
301: }

(End of file - total 301 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/session-delegation-query.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/session-delegation-query.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session-delegation-query tool — progressive-disclosure read-only query
3:  * of delegation history from session-tracker data.
4:  *
5:  * Two actions:
6:  * - `list`: Paginated delegation summaries from hierarchy-manifest.json
7:  * - `get`: Full delegation detail drill-down from child .json files via resolveSessionFile()
8:  *
9:  * Reads exclusively from session-tracker files (hierarchy-manifest.json + child .json).
10:  * Does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory
11:  * delegation state (REQ-P41E-03).
12:  *
13:  * @module tools/session/session-delegation-query
14:  */
15: 
16: import { tool } from "@opencode-ai/plugin/tool"
17: import { readFile, readdir } from "node:fs/promises"
18: import { join } from "node:path"
19: 
20: import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
21: import { resolveSessionFile } from "./session-resolver.js"
22: import { isValidSessionID } from "../../features/session-tracker/types.js"
23: import { success, error } from "../../shared/tool-response.js"
24: import { renderToolResult } from "../../shared/tool-helpers.js"
25: 
26: import type { HierarchyManifest, HierarchyManifestChild, ChildSessionRecord } from "../../features/session-tracker/types.js"
27: import type { SessionDelegationQueryInput } from "../../schema-kernel/session-delegation-query.schema.js"
28: 
29: type ToolContext = { sessionID?: string }
30: 
31: // ---------------------------------------------------------------------------
32: // Public entry point
33: // ---------------------------------------------------------------------------
34: 
35: export function createSessionDelegationQueryTool(projectRoot: string): ReturnType<typeof tool> {
36:   return tool({
37:     description:
38:       "Query delegation history with progressive disclosure. Actions: list (paginated summaries with filtering), get (single delegation drill-down). Complementary to delegation-status, session-tracker, session-hierarchy, and hivemind-session-view.",
39: 
40:     args: {
41:       action: tool.schema.enum(["list", "get"]),
42:       // list action args
43:       rootSessionId: tool.schema.string().optional(),
44:       status: tool.schema.string().optional(),
45:       agentType: tool.schema.string().optional(),
46:       delegatedBy: tool.schema.string().optional(),
47:       minDepth: tool.schema.number().optional(),
48:       maxDepth: tool.schema.number().optional(),
49:       updatedAfter: tool.schema.string().optional(),
50:       updatedBefore: tool.schema.string().optional(),
51:       offset: tool.schema.number().optional(),
52:       limit: tool.schema.number().optional(),
53:       // get action args
54:       sessionId: tool.schema.string().optional(),
55:     },
56: 
57:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
58:       try {
59:         // Dynamic parse: Zod discriminatedUnion validates shape per action
60:         const { SessionDelegationQueryInputSchema } = await import("../../schema-kernel/session-delegation-query.schema.js")
61:         const input = SessionDelegationQueryInputSchema.parse(rawArgs) as SessionDelegationQueryInput
62: 
63:         switch (input.action) {
64:           case "list": return await handleList(projectRoot, input)
65:           case "get":  return await handleGet(projectRoot, input)
66:           default:     return renderToolResult(error(`Unknown action`))
67:         }
68:       } catch (caughtError) {
69:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
70:         return renderToolResult(error(message))
71:       }
72:     },
73:   })
74: }
75: 
76: // ---------------------------------------------------------------------------
77: // Delegation summary types
78: // ---------------------------------------------------------------------------
79: 
80: interface DelegationSummary {
81:   sessionID: string
82:   rootMainSessionID: string
83:   parentSessionID: string
84:   subagentType: string
85:   delegatedBy: string
86:   status: string
87:   delegationDepth: number
88:   turnCount: number
89:   createdAt: string
90:   updatedAt: string
91: }
92: 
93: // ---------------------------------------------------------------------------
94: // List action
95: // ---------------------------------------------------------------------------
96: 
97: const MAX_TOTAL_RESULTS = 1000
98: 
99: async function handleList(projectRoot: string, input: Extract<SessionDelegationQueryInput, { action: "list" }>): Promise<string> {
100:   const rootSessions = input.rootSessionId
101:     ? [input.rootSessionId]
102:     : await discoverRootSessions(projectRoot)
103: 
104:   if (rootSessions.length === 0) {
105:     return renderToolResult(success("No sessions found", {
106:       delegations: [],
107:       total: 0,
108:       offset: input.offset,
109:       limit: input.limit,
110:       hasMore: false,
111:     }))
112:   }
113: 
114:   const allDelegations: DelegationSummary[] = []
115: 
116:   for (const rootId of rootSessions) {
117:     if (!isValidSessionID(rootId)) continue
118:     if (allDelegations.length >= MAX_TOTAL_RESULTS) break
119: 
120:     try {
121:       const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
122:       const raw = await readFile(manifestPath, "utf-8")
123:       const manifest = JSON.parse(raw) as HierarchyManifest
124: 
125:       for (const [childId, child] of Object.entries(manifest.children ?? {})) {
126:         if (allDelegations.length >= MAX_TOTAL_RESULTS) break
127:         if (!matchesFilters(child, input)) continue
128: 
129:         allDelegations.push({
130:           sessionID: childId,
131:           rootMainSessionID: child.rootMainSessionID ?? rootId,
132:           parentSessionID: child.parentSessionID,
133:           subagentType: child.subagentType ?? "unknown",
134:           delegatedBy: child.delegatedBy ?? "unknown",
135:           status: child.status ?? "unknown",
136:           delegationDepth: child.delegationDepth ?? 0,
137:           turnCount: child.turnCount ?? 0,
138:           createdAt: child.createdAt ?? "",
139:           updatedAt: child.updatedAt ?? "",
140:         })
141:       }
142:     } catch {
143:       // Manifest missing or unreadable — skip this root session
144:       continue
145:     }
146:   }
147: 
148:   // Sort by updatedAt descending (most recent first)
149:   allDelegations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
150: 
151:   const total = allDelegations.length
152:   const paginated = allDelegations.slice(input.offset, input.offset + input.limit)
153: 
154:   return renderToolResult(success(`Found ${total} delegation(s)`, {
155:     delegations: paginated,
156:     total,
157:     offset: input.offset,
158:     limit: input.limit,
159:     hasMore: total > input.offset + input.limit,
160:   }))
161: }
162: 
163: // ---------------------------------------------------------------------------
164: // Get action (drill-down)
165: // ---------------------------------------------------------------------------
166: 
167: async function handleGet(projectRoot: string, input: Extract<SessionDelegationQueryInput, { action: "get" }>): Promise<string> {
168:   if (!isValidSessionID(input.sessionId)) {
169:     return renderToolResult(error(`Invalid session ID: ${input.sessionId}`))
170:   }
171: 
172:   const resolved = await resolveSessionFile(projectRoot, input.sessionId)
173:   if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
174:     return renderToolResult(
175:       error(`Session ID ${input.sessionId} not found in any hierarchy-manifest. Try "list" to discover available sessions.`),
176:     )
177:   }
178: 
179:   const record: ChildSessionRecord = resolved.childRecord
180: 
181:   // Build turn summary: aggregate tool name frequencies + first/last timestamps
182:   const toolSummary: Record<string, number> = {}
183:   let firstTurnTimestamp: string | undefined
184:   let lastTurnTimestamp: string | undefined
185: 
186:   for (const turn of record.turns ?? []) {
187:     if (!firstTurnTimestamp) firstTurnTimestamp = `turn_${turn.turn}`
188:     lastTurnTimestamp = `turn_${turn.turn}`
189: 
190:     for (const toolCall of turn.tools ?? []) {
191:       if (toolCall.tool) {
192:         toolSummary[toolCall.tool] = (toolSummary[toolCall.tool] ?? 0) + 1
193:       }
194:     }
195:   }
196: 
197:   return renderToolResult(success(`Delegation detail: ${input.sessionId}`, {
198:     sessionID: record.sessionID,
199:     parentSessionID: record.parentSessionID,
200:     delegationDepth: record.delegationDepth,
201:     delegatedBy: {
202:       agentName: record.delegatedBy?.agentName ?? "",
203:       model: record.delegatedBy?.model ?? "",
204:       tool: record.delegatedBy?.tool ?? "",
205:       description: record.delegatedBy?.description ?? "",
206:       subagentType: record.delegatedBy?.subagentType ?? "",
207:     },
208:     mainAgent: record.mainAgent
209:       ? { name: record.mainAgent.name ?? "", model: record.mainAgent.model ?? "" }
210:       : undefined,
211:     created: record.created,
212:     updated: record.updated,
213:     status: record.status,
214:     turnCount: (record.turns ?? []).length,
215:     turnSummary: {
216:       toolSummary,
217:       firstTurnAt: firstTurnTimestamp ?? null,
218:       lastTurnAt: lastTurnTimestamp ?? null,
219:     },
220:     journeyEntryCount: record.journey?.length ?? 0,
221:     lastMessage: record.lastMessage?.slice(0, 500) ?? null,
222:     children: {
223:       count: (record.children ?? []).length,
224:       ids: record.children ?? [],
225:     },
226:     // P41-B gap fields (optional — only present if defined)
227:     ...(record.queueKey !== undefined ? { queueKey: record.queueKey } : {}),
228:     ...(record.terminalKind !== undefined ? { terminalKind: record.terminalKind } : {}),
229:     ...(record.recoveryGuarantee !== undefined ? { recoveryGuarantee: record.recoveryGuarantee } : {}),
230:     ...(record.executionMode !== undefined ? { executionMode: record.executionMode } : {}),
231:     ...(record.lifecycle !== undefined ? { lifecycle: record.lifecycle } : {}),
232:     _note: "Journey entries and turns excluded — use session-tracker export-session for full content",
233:   }))
234: }
235: 
236: // ---------------------------------------------------------------------------
237: // Filter helpers
238: // ---------------------------------------------------------------------------
239: 
240: function matchesFilters(child: HierarchyManifestChild, filters: Record<string, unknown>): boolean {
241:   if (filters.status && child.status !== filters.status) return false
242:   if (filters.agentType && child.subagentType !== filters.agentType) return false
243:   if (filters.delegatedBy && child.delegatedBy !== filters.delegatedBy) return false
244: 
245:   if (filters.minDepth !== undefined && (child.delegationDepth ?? 0) < (filters.minDepth as number)) return false
246:   if (filters.maxDepth !== undefined && (child.delegationDepth ?? 0) > (filters.maxDepth as number)) return false
247: 
248:   if (filters.updatedAfter && child.updatedAt && child.updatedAt < (filters.updatedAfter as string)) return false
249:   if (filters.updatedBefore && child.updatedAt && child.updatedAt > (filters.updatedBefore as string)) return false
250: 
251:   return true
252: }
253: 
254: // ---------------------------------------------------------------------------
255: // Session discovery
256: // ---------------------------------------------------------------------------
257: 
258: /**
259:  * Discovers root sessions by reading project-continuity.json or falling back
260:  * to directory scan. Matches the established pattern in session-tracker.ts
261:  * and session-resolver.ts.
262:  */
263: async function discoverRootSessions(projectRoot: string): Promise<string[]> {
264:   const trackerRoot = sessionTrackerRoot(projectRoot)
265: 
266:   try {
267:     const projectIndexPath = join(trackerRoot, "project-continuity.json")
268:     const raw = await readFile(projectIndexPath, "utf-8")
269:     const index = JSON.parse(raw) as { chronologicalOrder?: string[]; sessions?: Record<string, unknown> }
270:     const order = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
271:     if (order.length > 0) return order
272:   } catch {
273:     // Fall through to directory scan
274:   }
275: 
276:   try {
277:     const entries = await readdir(trackerRoot, { withFileTypes: true })
278:     return entries
279:       .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
280:       .map((e) => e.name)
281:   } catch {
282:     return []
283:   }
284: }

(End of file - total 284 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-session-view.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/hivemind/hivemind-session-view.ts</path>
<type>file</type>
<content>
1: /**
2:  * Hivemind session-view tool — cross-root unified session query.
3:  *
4:  * Single action: get — reads from 3 data roots concurrently and returns
5:  * an enriched nested view per D-11.
6:  * Read-only (CQRS read-side). No mutation authority.
7:  * @module tools/hivemind/hivemind-session-view
8:  */
9: 
10: import { tool } from "@opencode-ai/plugin/tool"
11: import { readFile } from "node:fs/promises"
12: import { resolve } from "node:path"
13: import { SessionViewInputSchema, type SessionViewInput } from "../../schema-kernel/session-view.schema.js"
14: import { renderToolResult } from "../../shared/tool-helpers.js"
15: import { success, error } from "../../shared/tool-response.js"
16: import { resolveSessionFile } from "../session/session-resolver.js"
17: 
18: type ToolContext = { sessionID?: string }
19: 
20: /**
21:  * Create the cross-root session view tool.
22:  *
23:  * @param projectRoot - Trusted project root containing .hivemind/ directories.
24:  * @returns OpenCode tool instance exposing get action.
25:  */
26: export function createHivemindSessionViewTool(projectRoot: string): ReturnType<typeof tool> {
27:   return tool({
28:     description: [
29:       "Query a unified session view across 3 Hivemind data roots: session-tracker, delegations, and trajectory.",
30:       "Returns an enriched nested tree: { session: {...}, delegations: [...], trajectory: {...} }.",
31:       "Read-only — no mutation authority.",
32:       "Actions: get.",
33:     ].join("\n"),
34:     args: {
35:       action: tool.schema.enum(["get"]).describe("Action to perform (get)"),
36:       sessionId: tool.schema.string().describe("Session ID to query"),
37:     },
38:     async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
39:       try {
40:         const input = SessionViewInputSchema.parse(rawArgs) as SessionViewInput
41:         const data = await buildUnifiedView(projectRoot, input.sessionId)
42:         if (data.error) {
43:           return renderToolResult(error(`Session not found: ${input.sessionId}`, data))
44:         }
45:         return renderToolResult(success(`Unified view for ${input.sessionId}`, data))
46:       } catch (caughtError) {
47:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
48:         return renderToolResult(error(message))
49:       }
50:     },
51:   })
52: }
53: 
54: /** Read session continuity data from session-tracker. */
55: async function readSessionData(projectRoot: string, sessionId: string): Promise<Record<string, unknown> | null> {
56:   const resolved = await resolveSessionFile(projectRoot, sessionId)
57:   if (!resolved) return null
58:   if (resolved.type === "main") {
59:     try {
60:       const raw = await readFile(resolved.continuityPath, "utf-8")
61:       return JSON.parse(raw) as Record<string, unknown>
62:     } catch { return null }
63:   } else {
64:     return resolved.childRecord as unknown as Record<string, unknown>
65:   }
66: }
67: 
68: /** Read delegations for a session — tries session-tracker first, falls back to delegations.json. */
69: async function readDelegationsForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown>[]> {
70:   // Try session-tracker first
71:   try {
72:     const resolved = await resolveSessionFile(projectRoot, sessionId)
73:     if (resolved) {
74:       if (resolved.type === "main") {
75:         const raw = await readFile(resolved.manifestPath, "utf-8")
76:         const manifest = JSON.parse(raw) as { children?: Record<string, unknown> }
77:         if (manifest.children) {
78:           const childEntries = Object.entries(manifest.children)
79:             .filter(([, meta]) => (meta as Record<string, unknown>).parentSessionID === sessionId)
80:             .map(([id, meta]) => ({ id, childSessionId: id, ...(meta as Record<string, unknown>) }))
81:             .slice(0, 20)
82:           if (childEntries.length > 0) return childEntries
83:         }
84:       } else if (resolved.type === "child" && resolved.childRecord) {
85:         return [resolved.childRecord as unknown as Record<string, unknown>]
86:       }
87:     }
88:   } catch {
89:     /* fall through to legacy */
90:   }
91: 
92:   // Fallback: read from delegations.json
93:   try {
94:     const delegationsPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
95:     const raw = await readFile(delegationsPath, "utf-8")
96:     const allDelegations = JSON.parse(raw) as Array<Record<string, unknown>>
97:     // Filter by session ID — delegations may use childSessionId or parentSessionId
98:     return allDelegations.filter((d) =>
99:       d.childSessionId === sessionId || d.id === sessionId,
100:     ).slice(0, 20)
101:   } catch { return [] }
102: }
103: 
104: /** Read trajectory events for a session from state/trajectory-ledger.json. */
105: async function readTrajectoryForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown> | null> {
106:   try {
107:     const ledgerPath = resolve(projectRoot, ".hivemind", "state", "trajectory-ledger.json")
108:     const raw = await readFile(ledgerPath, "utf-8")
109:     const allRecords = JSON.parse(raw) as Array<Record<string, unknown>>
110:     const sessionRecords = allRecords.filter((r) =>
111:       (r as Record<string, unknown>).rootSessionId === sessionId ||
112:       (r as Record<string, unknown>).sessionId === sessionId,
113:     )
114:     return sessionRecords.length > 0 ? { total: sessionRecords.length, entries: sessionRecords.slice(0, 50) } : null
115:   } catch { return null }
116: }
117: 
118: /** Build a unified view from all 3 data roots. */
119: async function buildUnifiedView(projectRoot: string, sessionId: string): Promise<Record<string, unknown>> {
120:   const [session, delegations, trajectory] = await Promise.all([
121:     readSessionData(projectRoot, sessionId),
122:     readDelegationsForSession(projectRoot, sessionId),
123:     readTrajectoryForSession(projectRoot, sessionId),
124:   ])
125: 
126:   if (!session) {
127:     return {
128:       session: null, delegations: [], trajectory: null,
129:       error: `Session not found: ${sessionId}`,
130:     }
131:   }
132: 
133:   // Enrich session with basic metadata
134:   const enrichedSession: Record<string, unknown> = {
135:     sessionId: (session as Record<string, unknown>).sessionID ?? sessionId,
136:     status: (session as Record<string, unknown>).status ?? "unknown",
137:     turnCount: (session as Record<string, unknown>).turnCount ?? 0,
138:     childCount: (session as Record<string, unknown>).childCount ?? 0,
139:     delegationDepth: (session as Record<string, unknown>).delegationDepth ?? 0,
140:     parentSessionID: (session as Record<string, unknown>).parentSessionID ?? null,
141:     lastUpdated: (session as Record<string, unknown>).lastUpdated ?? null,
142:     toolSummary: (session as Record<string, unknown>).toolSummary ?? {},
143:   }
144: 
145:   return {
146:     session: enrichedSession,
147:     delegations: {
148:       total: delegations.length,
149:       active: delegations.filter((d) => d.status === "running" || d.status === "dispatched").length,
150:       entries: delegations,
151:     },
152:     trajectory,
153:     queriedAt: new Date().toISOString(),
154:   }
155: }

(End of file - total 155 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/tmux-copilot.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/tmux-copilot.ts</path>
<type>file</type>
<content>
1: /**
2:  * Hivemind tmux-copilot — co-pilot affordance for the tmux visual orchestration layer.
3:  *
4:  * Phase 43 design notes (D-43-02, REQ-04, REQ-05, REQ-06):
5:  * - 4 actions: send-keys, list-panes, compute-grid, respawn
6:  * - Discriminated union Zod schema; each branch has its own payload shape
7:  * - Permission-gated: orchestrator-tier agents may invoke any action (T-43-05)
8:  *   The OpenCode SDK `tool()` helper does NOT support a `requiresPermission`
9:  *   field — the gate is enforced at execute() runtime via context.agent.
10:  *   REQUIRES_PERMISSIONS is exported as a module const so future
11:  *   harness-level enforcement layers can consume it.
12:  * - Graceful unavailable: when the in-tree integration is not wired,
13:  *   returns {available: false, reason: "tmux-not-wired"} instead of
14:  *   throwing. This is the T-43-09 mitigation (DoS) — no exception escapes.
15:  * - All adapter calls wrapped in try/catch so tmux/in-tree failures
16:  *   produce structured error results rather than uncaught exceptions.
17:  *
18:  * Phase 51 migration: the consumer now uses `getSessionManagerAdapter`
19:  * (from `../features/tmux/types.js`) instead of the deleted
20:  * `getForkSessionManager` (from `../features/tmux/fork-bridge.js`).
21:  * The bridge pattern (module-level mutable state populated by the
22:  * integration factory at plugin-init time) is preserved.
23:  *
24:  * Phase 58.8 (P58 gap-fix S2, REQ-58-08): a second tier of callers
25:  * (`USER_SESSION` — agent name `user` / `__user__`) is permitted past
26:  * the gate, but only for a restricted action subset (D-58-22 LOCKED):
27:  * take-over, release, peek. All other actions remain orchestrator-only.
28:  * This closes the S2 symptom where a human operator had no
29:  * orchestrator-context affordance to inspect or intervene on a
30:  * delegate pane.
31:  */
32: import { tool } from "@opencode-ai/plugin/tool"
33: import { z } from "zod"
34: import {
35:   getSessionManagerAdapter,
36:   setSessionManagerAdapter,
37:   type PaneState,
38:   type PaneTreeNode,
39:   type SplitCommand,
40: } from "../features/tmux/types.js"
41: import { renderToolResult } from "../shared/tool-helpers.js"
42: import { getManualOverrideState, setManualOverrideState } from "../features/session-tracker/index.js"
43: import { resolveSessionToPaneId, getSendPrompt, getSessionMessagesFetcher, getSessionPaneRegistryEntries } from "../features/tmux/types.js"
44: 
45: // ---------------------------------------------------------------------------
46: // Permission gate (T-43-05 mitigation, P59 A1 fix)
47: // ---------------------------------------------------------------------------
48: 
49: /**
50:  * P59 (A1): Tier-based permission model — replaces the hardcoded 4-agent
51:  * whitelist with a config-based approach. Three tiers:
52:  *
53:  * - `orchestrator`: Full access (all actions). Maps to the 4 original
54:  *   orchestrator agent names + any agent with role: "orchestrator".
55:  * - `observer`: Read-only child monitoring. Any agent that dispatches a
56:  *   child session (executor, planner, debugger, etc.) is granted peek
57:  *   and list-panes on its own session tree so it can monitor child progress.
58:  * - `user`: Terminal interaction. The human operator (agent name "user"
59:  *   or "__user__") gets take-over, release, peek, and list-panes.
60:  *
61:  * P59 A1 widens the first gate: instead of rejecting all agents outside the
62:  * hardcoded 4, we let any agent through and then constrain by action per
63:  * tier. This ensures parent agents of ANY type can peek at their own child
64:  * panes.
65:  */
66: 
67: // Tier-based agent-name restrictions removed in P59 R1.
68: // Every agent (including "build", "hm-executor", gsd-debugger, etc.)
69: // has access to ALL copilot actions. The main session agent MUST be
70: // able to take-over, peek, and intervene on its own children.
71: 
72: // ---------------------------------------------------------------------------
73: // Zod schema — discriminated union of 4 actions
74: // ---------------------------------------------------------------------------
75: 
76: const PaneTreeNodeSchema: z.ZodType<PaneTreeNode> = z.lazy(() =>
77:   z.object({
78:     id: z.string().min(1),
79:     children: z.array(PaneTreeNodeSchema).optional(),
80:   }),
81: )
82: 
83: const SendKeysActionSchema = z.object({
84:   action: z.literal("send-keys"),
85:   paneId: z.string().min(1),
86:   text: z.string(),
87:   literal: z.boolean().optional(),
88: })
89: 
90: const ListPanesActionSchema = z.object({
91:   action: z.literal("list-panes"),
92:   mainPaneId: z.string().optional(),
93: })
94: 
95: const ComputeGridActionSchema = z.object({
96:   action: z.literal("compute-grid"),
97:   tree: PaneTreeNodeSchema,
98: })
99: 
100: const RespawnActionSchema = z.object({
101:   action: z.literal("respawn"),
102:   sessionId: z.string().min(1),
103: })
104: 
105: // P58 G4 (REQ-58-04): forward-prompt — main-agent-to-delegate prompt with sentinel
106: const ForwardPromptActionSchema = z.object({
107:   action: z.literal("forward-prompt"),
108:   paneId: z.string().min(1),
109:   text: z.string(),
110:   literal: z.boolean().optional(),
111: })
112: 
113: // P58 G5 (REQ-58-05): take-over — set manualOverride=true on a session
114: // P59 R2: added optional `prompt` + `promptMode` — injects structured prompt
115: // into the child session via SDK. `promptMode: "steer"` (default) uses
116: // noReply:true (child absorbs context without responding). `promptMode: "respond"`
117: // uses noReply:false (child processes and responds as a new user message).
118: const TakeOverActionSchema = z.object({
119:   action: z.literal("take-over"),
120:   sessionId: z.string().min(1),
121:   paneId: z.string().min(1),
122:   prompt: z.string().optional(),
123:   promptMode: z.enum(["steer", "respond"]).optional().default("steer"),
124: })
125: 
126: // P58 G5 (REQ-58-05): release — clear manualOverride=false on a session
127: const ReleaseActionSchema = z.object({
128:   action: z.literal("release"),
129:   sessionId: z.string().min(1),
130: })
131: 
132: // P58.8 S2 (REQ-58-08): peek — user-tier read access to capture-pane content
133: const PeekActionSchema = z.object({
134:   action: z.literal("peek"),
135:   paneId: z.string().min(1),
136:   maxBytes: z.number().int().positive().optional(),
137:   // P59 R4: format — "summary" (default) returns structured activity
138:   // summary (tool calls, assistant messages, files); "raw" returns
139:   // literal pane content as before.
140:   format: z.enum(["summary", "raw"]).optional().default("summary"),
141: })
142: 
143: // P59 A2: peek-by-session — accepts sessionId instead of paneId, resolves
144: // via the session→paneId registry. Uses the same peek logic internally.
145: const PeekBySessionActionSchema = z.object({
146:   action: z.literal("peek-by-session"),
147:   sessionId: z.string().min(1),
148:   maxBytes: z.number().int().positive().optional(),
149:   format: z.enum(["summary", "raw"]).optional().default("summary"),
150: })
151: 
152: const TmuxCopilotActionSchema = z.discriminatedUnion("action", [
153:   SendKeysActionSchema,
154:   ListPanesActionSchema,
155:   ComputeGridActionSchema,
156:   RespawnActionSchema,
157:   ForwardPromptActionSchema,  // P58 G4
158:   TakeOverActionSchema,        // P58 G5
159:   ReleaseActionSchema,         // P58 G5
160:   PeekActionSchema,            // P58.8 S2
161:   PeekBySessionActionSchema,   // P59 A2
162: ])
163: 
164: // ---------------------------------------------------------------------------
165: // Result union (exported for tests + downstream consumers)
166: // ---------------------------------------------------------------------------
167: 
168: export type TmuxCopilotResult =
169:   | { available: false; reason: "tmux-not-wired" | "tmux-not-installed" | "tmux-timeout" }
170:   | { available: false; reason: "tmux-error"; error: { message: string } }
171:   | { sent: true; paneId: string }
172:   | { sent: false; paneId: string; error: { message: string } }
173:   | { panes: PaneState[] }
174:   | { commands: SplitCommand[] }
175:   | { respawned: true; paneId: string }
176:   | { respawned: false; error: { reason: string } }
177:   | { paneId: string; deliveredAt: string; byteLength: number }  // P58 G4: forward-prompt success
178:   | { suppressed: true; reason: "manualOverride" | "session-not-found"; paneId: string; textPreview: string; evaluatedAt: string }  // P58 G5
179:   | { sessionId: string; paneId: string; takenBy: string; takenAt: string }  // P58 G5: take-over success
180:   | { sessionId: string; releasedAt: string }  // P58 G5: release success
181:   | { paneId: string; content: string; capturedAt: string; byteLength: number }  // P58.8 S2: peek success (empty content when no capture cached)
182:   | { sessionId: string; paneId: string; content: string; capturedAt: string; byteLength: number }  // P59 A2: peek-by-session success
183:   | { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
184:   | { error: { kind: "permission-denied"; agent: string } }
185: 
186: // ---------------------------------------------------------------------------
187: // Tool context — minimal shape (mirrors delegation-status.ts pattern)
188: // ---------------------------------------------------------------------------
189: 
190: type ToolContext = { sessionID?: string; agent?: string }
191: 
192: // ---------------------------------------------------------------------------
193: // Tool export
194: // ---------------------------------------------------------------------------
195: 
196: const s = tool.schema
197: 
198: export const tmuxCopilotTool: ReturnType<typeof tool> = tool({
199:   description:
200:     "Co-pilot affordance for the tmux visual orchestration layer. Sends keys, " +
201:     "lists panes, computes split grids, respawns closed-pane sessions, " +
202:     "forwards prompts to delegates, and surfaces session takeover/release/" +
203:     "peek affordances for the human operator. " +
204:     "All agents may invoke all actions. Agent-name-based denial removed in P59 R1.",
205:   // `args` is a structural hint for the framework (uses SDK-bundled
206:   // tool.schema to satisfy the type contract); we do the canonical
207:   // parse inside execute() via TmuxCopilotActionSchema.safeParse so we
208:   // can return graceful {error: {kind: "invalid-input", issues}} on
209:   // parse failure instead of relying on the framework to throw.
210:   args: {
211:     action: s.string().describe("One of: send-keys, list-panes, compute-grid, respawn, take-over, release, peek, forward-prompt"),
212:     paneId: s.string().optional().describe("(send-keys|forward-prompt|peek) target tmux pane id"),
213:     text: s.string().optional().describe("(send-keys|forward-prompt) text to send"),
214:     literal: s.boolean().optional().describe("(send-keys|forward-prompt) if true, send as literal text"),
215:     mainPaneId: s.string().optional().describe("(list-panes) optional main pane to scope listing"),
216:     tree: s.unknown().optional().describe("(compute-grid) PaneTreeNode — recursive {id, children?}"),
217:     sessionId: s.string().optional().describe("(respawn|take-over|release|peek-by-session) session id"),
218:     maxBytes: s.number().optional().describe("(peek|peek-by-session) cap the returned content length"),
219:   },
220:   async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
221:     // 1. Permission gate — every agent is allowed all actions.
222:     //    Agent-name-based denial was removed in P59 R1 because the main
223:     //    session agent (e.g. "build") MUST be able to take-over, peek,
224:     //    list-panes, and intervene on its own child sessions. The only
225:     //    invalid caller is a null/undefined agent — that is rejected.
226:     const callerAgent = context.agent
227:     if (!callerAgent) {
228:       return renderToolResult({
229:         error: { kind: "permission-denied", agent: "unknown" },
230:       })
231:     }
232: 
233:     // 2. Input validation
234:     const parsed = TmuxCopilotActionSchema.safeParse(rawArgs)
235:     if (!parsed.success) {
236:       return renderToolResult({
237:         error: { kind: "invalid-input", issues: parsed.error.issues },
238:       })
239:     }
240:     const input = parsed.data
241: 
242:     // 3. Bridge check
243:     const adapter = getSessionManagerAdapter()
244:     if (adapter === null) {
245:       return renderToolResult({ available: false, reason: "tmux-not-wired" })
246:     }
247: 
248:     // 4. Dispatch
249:     switch (input.action) {
250:       case "send-keys": {
251:         try {
252:           await adapter.sendKeys(input.paneId, input.text, input.literal ?? false)
253:           return renderToolResult({ sent: true, paneId: input.paneId })
254:         } catch (err) {
255:           return renderToolResult({
256:             sent: false,
257:             paneId: input.paneId,
258:             error: { message: err instanceof Error ? err.message : String(err) },
259:           })
260:         }
261:       }
262:       case "list-panes": {
263:         try {
264:           const panes = await adapter.listPanes(input.mainPaneId)
265:           return renderToolResult({ panes })
266:         } catch (err) {
267:           // Classify error kind so callers can distinguish installation
268:           // problems (user-fixable) from transient tmux server issues
269:           // (may be retryable) from genuine bugs.
270:           const message = err instanceof Error ? err.message : String(err)
271:           const code = (err as NodeJS.ErrnoException | null)?.code
272:           const isNotInstalled = code === "ENOENT" || /enoent/i.test(message)
273:           const isTimeout = code === "ETIMEDOUT" || /timeout/i.test(message)
274:           if (isNotInstalled) {
275:             return renderToolResult({ available: false, reason: "tmux-not-installed" })
276:           }
277:           if (isTimeout) {
278:             return renderToolResult({ available: false, reason: "tmux-timeout" })
279:           }
280:           return renderToolResult({
281:             available: false,
282:             reason: "tmux-error",
283:             error: { message },
284:           })
285:         }
286:       }
287:       case "compute-grid": {
288:         const commands = adapter.createPaneGridPlanner().computeSplitSequence(input.tree)
289:         return renderToolResult({ commands })
290:       }
291:       case "respawn": {
292:         const result = await adapter.respawnIfKnown(input.sessionId)
293:         if (result === null) {
294:           return renderToolResult({
295:             respawned: false,
296:             error: { reason: "session-not-closed" },
297:           })
298:         }
299:         return renderToolResult({ respawned: true, paneId: result.paneId })
300:       }
301:       case "forward-prompt": {
302:         // P58 G5 (REQ-58-05, D-58-12): suppression check FIRST — if manualOverride
303:         // is set, return suppressed envelope without sending keys.
304:         //
305:         // [P58.8 S2 — D-58-22 DEFER] `forward-prompt` is INTENTIONALLY
306:         // NOT in USER_SESSION_ALLOWED_ACTIONS. The human operator
307:         // takes a delegate via `take-over` (which sets manualOverride)
308:         // and then types directly into the pane via their own tmux
309:         // client. The `forward-prompt` action remains orchestrator-only
310:         // because (a) it pre-pends a `[orchestrator-forward ...]`
311:         // sentinel that contaminates the delegate's transcript with
312:         // an automation-source marker, and (b) bypassing the
313:         // suppression check would let USER_SESSION race past a
314:         // take-over the operator has not yet completed. If a future
315:         // requirement needs USER_SESSION to inject text, route it
316:         // through `send-keys` (which the operator can re-enable under
317:         // a separate D-XX LOCKED decision) — do NOT add `forward-prompt`
318:         // to USER_SESSION_ALLOWED_ACTIONS without re-validating D-58-22.
319:         const sessionId = context.sessionID
320:         const overrideState = getManualOverrideState(sessionId)
321:         if (overrideState?.manualOverride === true) {
322:           return renderToolResult({
323:             suppressed: true,
324:             reason: "manualOverride",
325:             paneId: input.paneId,
326:             textPreview: input.text.slice(0, 80),
327:             evaluatedAt: new Date().toISOString(),
328:           })
329:         }
330:         // P58 G4 (REQ-58-04, D-58-09/10): prepend sentinel, then sendKeys.
331:         const sentinel = `[orchestrator-forward ${new Date().toISOString()}]\n`
332:         const payload = sentinel + input.text
333:         const byteLength = Buffer.byteLength(payload, "utf8")
334:         try {
335:           await adapter.sendKeys(input.paneId, payload, input.literal ?? true)
336:           return renderToolResult({
337:             paneId: input.paneId,
338:             deliveredAt: new Date().toISOString(),
339:             byteLength,
340:           })
341:         } catch (err) {
342:           return renderToolResult({
343:             sent: false,
344:             paneId: input.paneId,
345:             error: { message: err instanceof Error ? err.message : String(err) },
346:           })
347:         }
348:       }
349:       case "take-over": {
350:         // P58 G5 (REQ-58-05, D-58-11): set manualOverride=true with audit fields.
351:         // P59 R2: if `prompt` is provided, inject it into the child session's
352:         // conversation via the module-level sendPrompt function (wired from
353:         // plugin.ts using client.session.prompt).
354:         setManualOverrideState(input.sessionId, {
355:           manualOverride: true,
356:           takenAt: Date.now(),
357:           takenBy: "human-operator",
358:         })
359: 
360:         let promptDelivered = false
361:         let promptError: string | undefined
362:         if (input.prompt) {
363:           const sendPrompt = getSendPrompt()
364:           if (sendPrompt) {
365:             try {
366:               await sendPrompt(input.sessionId, input.prompt, {
367:                 noReply: input.promptMode === "steer",
368:               })
369:               promptDelivered = true
370:             } catch (err) {
371:               promptError = err instanceof Error ? err.message : String(err)
372:             }
373:           } else {
374:             promptError = "sendPrompt not wired"
375:           }
376:         }
377: 
378:         return renderToolResult({
379:           sessionId: input.sessionId,
380:           paneId: input.paneId,
381:           takenBy: "human-operator",
382:           takenAt: new Date().toISOString(),
383:           ...(input.prompt ? { promptDelivered, promptMode: input.promptMode, ...(promptError ? { promptError } : {}) } : {}),
384:         })
385:       }
386:       case "release": {
387:         // P58 G5 (REQ-58-05): clear manualOverride=false.
388:         setManualOverrideState(input.sessionId, { manualOverride: false })
389:         return renderToolResult({
390:           sessionId: input.sessionId,
391:           releasedAt: new Date().toISOString(),
392:         })
393:       }
394:       case "peek": {
395:         // P59 R4: default to "summary" mode which returns structured
396:         // activity (tool calls, assistant messages, file changes) instead
397:         // of just raw pane content. Use format: "raw" to get the literal
398:         // pane content as before.
399:         if (input.format === "raw") {
400:           const capture = adapter.getLatestCapture?.(input.paneId) ?? null
401:           const content = capture?.content ?? ""
402:           const byteLength = capture?.byteLength ?? Buffer.byteLength(content, "utf8")
403:           return renderToolResult({
404:             paneId: input.paneId,
405:             format: "raw" as const,
406:             content,
407:             capturedAt: capture?.capturedAt
408:               ? new Date(capture.capturedAt).toISOString()
409:               : new Date().toISOString(),
410:             byteLength,
411:           })
412:         }
413:         // Summary mode: fetch messages via the module-level fetcher wired
414:         // from plugin.ts. Resolve paneId → sessionId via the registry,
415:         // then call the fetcher.
416:         const sessionId = getSessionPaneRegistryEntries()
417:           .find(([, pane]) => pane === input.paneId)?.[0]
418:         if (!sessionId) {
419:           return renderToolResult({
420:             paneId: input.paneId,
421:             format: "summary" as const,
422:             activity: {
423:               messageCount: 0,
424:               toolCalls: [],
425:               lastAssistantMessage: null,
426:               files: [],
427:               note: "No session registered for this paneId. Use peek-by-session if you have a sessionId.",
428:             },
429:           })
430:         }
431:         return buildSessionSummary(sessionId, input.maxBytes)
432:       }
433:       case "peek-by-session": {
434:         // P59 A2: resolve sessionId → paneId via the registry, then
435:         // delegate to the same peek logic as the regular peek action.
436:         const resolvedPaneId = resolveSessionToPaneId(input.sessionId)
437:         if (!resolvedPaneId) {
438:           return renderToolResult({
439:             error: {
440:               kind: "invalid-input" as const,
441:               issues: [{ code: "custom", message: `No paneId registered for session ${input.sessionId}`, path: ["sessionId"] } as unknown as z.ZodIssue],
442:             },
443:           })
444:         }
445:         if (input.format === "raw") {
446:           const sessionCapture = adapter.getLatestCapture?.(resolvedPaneId) ?? null
447:           const sessionContent = sessionCapture?.content ?? ""
448:           const sessionByteLength = sessionCapture?.byteLength ?? Buffer.byteLength(sessionContent, "utf8")
449:           return renderToolResult({
450:             sessionId: input.sessionId,
451:             paneId: resolvedPaneId,
452:             format: "raw" as const,
453:             content: input.maxBytes && sessionContent.length > input.maxBytes
454:               ? sessionContent.slice(-input.maxBytes)
455:               : sessionContent,
456:             capturedAt: sessionCapture?.capturedAt
457:                 ? new Date(sessionCapture.capturedAt).toISOString()
458:                 : new Date().toISOString(),
459:             byteLength: sessionByteLength,
460:           })
461:         }
462:         // Summary mode: fetch messages and build structured activity
463:         return buildSessionSummary(input.sessionId, input.maxBytes)
464:       }
465:     }
466:   },
467: })
468: 
469: // ---------------------------------------------------------------------------
470: // P59 R4: buildSessionSummary — fetches session messages and returns a
471: // structured activity summary (tool calls, last assistant message, files
472: // touched) instead of just raw pane content. This is what peek returns
473: // by default — it answers "how far has the sub session gotten" without
474: // forcing the caller to parse raw TUI text.
475: // ---------------------------------------------------------------------------
476: 
477: async function buildSessionSummary(sessionId: string, maxBytes?: number): Promise<string> {
478:   const resolvedPaneId = resolveSessionToPaneId(sessionId)
479:   const fetcher = getSessionMessagesFetcher()
480:   if (!fetcher) {
481:     return renderToolResult({
482:       sessionId,
483:       paneId: resolvedPaneId,
484:       format: "summary" as const,
485:       activity: {
486:         messageCount: 0,
487:         toolCalls: [],
488:         lastAssistantMessage: null,
489:         files: [],
490:         note: "Session messages fetcher not wired. Peek summary unavailable.",
491:       },
492:     })
493:   }
494:   const messages = await fetcher(sessionId, 50)
495:   const toolCalls = messages
496:     .filter((m) => m.toolName)
497:     .slice(-20)
498:     .map((m) => ({
499:       tool: m.toolName,
500:       args: m.toolArgs ? Object.keys(m.toolArgs).slice(0, 5) : [],
501:       timestamp: m.timestamp,
502:     }))
503:   const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
504:   const lastAssistantMessage = lastAssistant
505:     ? maxBytes && lastAssistant.content.length > maxBytes
506:       ? lastAssistant.content.slice(0, maxBytes) + "…"
507:       : lastAssistant.content
508:     : null
509:   const files = Array.from(
510:     new Set(
511:       toolCalls
512:         .map((t) => {
513:           const args = t.args
514:           const path = args.find((a) => typeof a === "string" && (a.includes("/") || a.includes(".")))
515:           return path ?? null
516:         })
517:         .filter(Boolean) as string[]
518:     ),
519:   )
520:   return renderToolResult({
521:     sessionId,
522:     paneId: resolvedPaneId,
523:     format: "summary" as const,
524:     activity: {
525:       messageCount: messages.length,
526:       toolCallCount: toolCalls.length,
527:       toolCalls: toolCalls.slice(-10),
528:       lastAssistantMessage,
529:       files,
530:     },
531:   })
532: }
533: 
534: // ---------------------------------------------------------------------------
535: // Test seam (P58 PLAN-07, Gap 3 fix)
536: // ---------------------------------------------------------------------------
537: 
538: /**
539:  * P58 PLAN-07 (Gap 3 fix): BATS-friendly test seam that injects a mock
540:  * `SessionManagerAdapter` (alias "TmuxMultiplexer") so the tool can run
541:  * without a real tmux session. Delegates to the existing
542:  * `setSessionManagerAdapter()` at `src/features/tmux/types.ts`
543:  * (already wired by the P51 migration per tmux-copilot.ts:18-22).
544:  *
545:  * BATS tests should:
546:  *   1. Construct a mock with a `sendKeys` method that captures calls
547:  *   2. Call `__setTmuxMultiplexerForTesting(mock)` before invoking the tool
548:  *   3. Invoke the tool action
549:  *   4. Assert the mock captured the expected call
550:  *   5. Restore via `__setTmuxMultiplexerForTesting(null)` in teardown
551:  *
552:  * The seam is intentionally NOT prefixed with `_` (which is the convention
553:  * for "private" in some codebases) because the leading double-underscore
554:  * `__` is the project's TEST-ONLY marker (per the
555:  * `__getDelegationsForTesting` pattern at `src/coordination/delegation/manager.ts`).
556:  *
557:  * NOT for production code. Production wiring still goes through
558:  * `src/features/tmux/integration.ts` which calls
559:  * `setSessionManagerAdapter()` directly.
560:  */
561: export function __setTmuxMultiplexerForTesting(mux: unknown): void {
562:   setSessionManagerAdapter(mux as Parameters<typeof setSessionManagerAdapter>[0])
563: }

(End of file - total 563 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/tmux-state-query.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/tmux-state-query.ts</path>
<type>file</type>
<content>
1: /**
2:  * Hivemind tmux-state-query — read-only session metadata tool for the
3:  * observability layer.
4:  *
5:  * Exposes the current tmux session tracking state (sessions, panes,
6:  * counts) without mutating any state. Permission-gated: only
7:  * orchestrator-tier agents may invoke.
8:  *
9:  * Phase 52 design (REQ-04, REQ-05):
10:  * - 3 actions: list-sessions, get-session, get-summary
11:  * - No mutation — strictly read-only
12:  * - Same permission gate pattern as tmux-copilot.ts
13:  * - Graceful unavailable: when the in-tree integration is not wired,
14:  *   returns {available: false, reason: "tmux-not-wired"} instead of
15:  *   throwing.
16:  */
17: import { tool } from "@opencode-ai/plugin/tool"
18: import { z } from "zod"
19: import { getSessionManagerAdapter } from "../features/tmux/types.js"
20: import { renderToolResult } from "../shared/tool-helpers.js"
21: 
22: // ---------------------------------------------------------------------------
23: // Permission gate (T-43-05 mitigation) — mirrors tmux-copilot.ts
24: // ---------------------------------------------------------------------------
25: 
26: // Agent-name permission gate removed in P59 R1 — all agents allowed
27: 
28: // ---------------------------------------------------------------------------
29: // Types for session summary
30: // ---------------------------------------------------------------------------
31: 
32: /**
33:  * Summary of one tracked session. Exposed as part of the query result
34:  * so observability consumers can inspect what the tmux subsystem is
35:  * currently tracking.
36:  */
37: export interface SessionSummary {
38:   sessionId: string
39:   agent: string
40:   delegationId: string
41:   paneId: string
42:   directory: string
43:   spawnTime: number
44: }
45: 
46: // ---------------------------------------------------------------------------
47: // Zod schema — discriminated union of 3 read-only actions
48: // ---------------------------------------------------------------------------
49: 
50: const ListSessionsActionSchema = z.object({
51:   action: z.literal("list-sessions"),
52: })
53: 
54: const GetSessionActionSchema = z.object({
55:   action: z.literal("get-session"),
56:   sessionId: z.string().min(1).optional(),
57: })
58: 
59: const GetSummaryActionSchema = z.object({
60:   action: z.literal("get-summary"),
61: })
62: 
63: const TmuxStateQueryActionSchema = z.discriminatedUnion("action", [
64:   ListSessionsActionSchema,
65:   GetSessionActionSchema,
66:   GetSummaryActionSchema,
67: ])
68: 
69: // ---------------------------------------------------------------------------
70: // Result union
71: // ---------------------------------------------------------------------------
72: 
73: export type TmuxStateQueryResult =
74:   | { available: false; reason: "tmux-not-wired" }
75:   | { error: { kind: "invalid-input"; issues: z.ZodIssue[] } }
76:   | { error: { kind: "permission-denied"; agent: string } }
77:   | { sessions: SessionSummary[] }
78:   | { session: SessionSummary | null }
79:   | { summary: { total: number; active: number; spawning: number } }
80: 
81: // ---------------------------------------------------------------------------
82: // Tool context
83: // ---------------------------------------------------------------------------
84: 
85: type ToolContext = { sessionID?: string; agent?: string }
86: 
87: // ---------------------------------------------------------------------------
88: // Tool name constant (exported for consumers)
89: // ---------------------------------------------------------------------------
90: 
91: export const tmuxStateQueryToolName = "tmux-state-query"
92: 
93: // ---------------------------------------------------------------------------
94: // Tool export
95: // ---------------------------------------------------------------------------
96: 
97: const s = tool.schema
98: 
99: export const tmuxStateQueryTool: ReturnType<typeof tool> = tool({
100:   description:
101:     "Read-only session metadata query for the tmux visual orchestration layer. " +
102:     "Returns tracked session information without mutating any state. " +
103:     "Actions: list-sessions, get-session, get-summary. Orchestrator-tier only.",
104:   args: {
105:     action: s
106:       .string()
107:       .describe("One of: list-sessions, get-session, get-summary"),
108:     sessionId: s
109:       .string()
110:       .optional()
111:       .describe("(get-session) session id to query"),
112:   },
113:   async execute(
114:     rawArgs: unknown,
115:     _context: ToolContext,
116:   ): Promise<string> {
117:     // 1. Permission gate — all agents allowed (P59 R1)
118: 
119:     // 2. Input validation
120:     const parsed = TmuxStateQueryActionSchema.safeParse(rawArgs)
121:     if (!parsed.success) {
122:       return renderToolResult({
123:         error: { kind: "invalid-input", issues: parsed.error.issues },
124:       })
125:     }
126:     const input = parsed.data
127: 
128:     // 3. Bridge check
129:     const adapter = getSessionManagerAdapter()
130:     if (adapter === null) {
131:       return renderToolResult({ available: false, reason: "tmux-not-wired" })
132:     }
133: 
134:     // 4. Dispatch read-only queries
135:     switch (input.action) {
136:       case "list-sessions":
137:         // We cannot enumerate sessions from the adapter surface directly
138:         // (SessionManagerAdapter exposes only onSessionCreated, sendKeys,
139:         // listPanes, etc.). Return a placeholder indicating the adapter
140:         // is wired — consumers can derive session info from the observer's
141:         // event stream.
142:         return renderToolResult({ sessions: [] })
143: 
144:       case "get-session":
145:         // Session-level queries require the internal SessionManager's
146:         // sessions map which is intentionally not exposed through the
147:         // adapter contract. For now, responds with {session: null} to
148:         // indicate the adapter is wired but session-level details are
149:         // not enumerable through the public surface.
150:         return renderToolResult({ session: null })
151: 
152:       case "get-summary":
153:         // For the summary, we return the adapter is wired but we do
154:         // not have exact session counts without access to the internal
155:         // sessions map. In a future phase, the SessionManagerAdapter
156:         // can be extended with a getSessions() method.
157:         return renderToolResult({
158:           summary: { total: 0, active: 0, spawning: 0 },
159:         })
160:     }
161:   },
162: })

(End of file - total 162 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/delegation/delegate-task.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: import { z } from "zod"
3: 
4: import { renderToolResult } from "../../shared/tool-helpers.js"
5: import { error, success } from "../../shared/tool-response.js"
6: // POLICY (P58, G1): This tool MUST route via coordinator.dispatch only.
7: //   Do NOT import the native `task` tool from "@opencode-ai/plugin" —
8: //   bypassing coordinator.dispatch skips the Hivemind delegation
9: //   lifecycle, session-tracker events, and tmux pane projection.
10: export const DelegateTaskV2Schema = z.object({
11:   agent: z.string().min(1, { error: "agent is required" }),
12:   prompt: z.string().min(1, { error: "prompt is required" }),
13:   context: z.string().optional(),
14:   stackOnSessionId: z.string().optional(),
15: })
16: 
17: interface CoordinatorLike {
18:   dispatch(params: Record<string, unknown>): Promise<unknown>
19: }
20: 
21: type ToolContext = {
22:   sessionID: string
23:   directory?: string
24:   worktree?: string
25: }
26: 
27: export function createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } }): ReturnType<typeof tool> {
28:   const s = tool.schema
29: 
30:   return tool({
31:     description:
32:       "Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (true-fire-and-forget WaiterModel (P58.3)). " +
33:       "**STACKING (PREFERRED):** Use `stackOnSessionId` to attach new work onto an existing session (completed, failed, aborted, cancelled, or even active). " +
34:       "This PRESERVES full context from the previous session. The SDK supports stacking on ANY valid session ID, both within the current delegation tree AND across independent sessions. " +
35:       "**ALWAYS prefer stacking onto existing sessions over creating new ones** — especially when retrying after failure. " +
36:       "Use `delegation-status({ action: 'find-stackable' })` to discover available sessions before dispatching. " +
37:       "Legacy context stacking: pass context as JSON `{\"parentSessionId\": \"<existing-session-id>\"}` — equivalent to stackOnSessionId. " +
38:       "Respects the config `delegation_systems.delegate_task` flag — when disabled, the tool returns a graceful error. " +
39:       "This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework.",
40:     args: {
41:       agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
42:       prompt: s.string().describe("Task prompt to send to the delegated agent"),
43:       context: s.string().optional().describe("Optional context packet. Legacy stacking: pass JSON {\"parentSessionId\": \"ses_xxx\"}. Otherwise treated as free-text prepended to prompt."),
44:       stackOnSessionId: s.string().optional().describe("Session ID to stack onto. Works for completed, failed, aborted, cancelled, and active sessions. PREFERRED over creating new sessions when retrying, resuming, or continuing work. Takes precedence over context-based parentSessionId."),
45:     },
46:     async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
47:       const parsed = DelegateTaskV2Schema.safeParse(rawArgs)
48:       if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegate-task input: ${z.prettifyError(parsed.error)}`))
49:       const args = parsed.data
50: 
51:       if (config && config.delegation_systems?.delegate_task === false) {
52:         return renderToolResult(error("[Harness] delegate-task is disabled by config `delegation_systems.delegate_task: false`. Enable it in .hivemind/configs.json to use this tool."))
53:       }
54: 
55:       let parentSessionId = context.sessionID
56:       let prompt = args.prompt
57: 
58:       // First-class stackOnSessionId takes precedence
59:       if (args.stackOnSessionId) {
60:         parentSessionId = args.stackOnSessionId
61:       } else if (args.context) {
62:         // Legacy JSON context for session stacking: {"parentSessionId": "ses_xxx"}
63:         try {
64:           const parsed = JSON.parse(args.context) as { parentSessionId?: string }
65:           if (parsed.parentSessionId && typeof parsed.parentSessionId === "string") {
66:             parentSessionId = parsed.parentSessionId
67:             const { parentSessionId: _, ...rest } = parsed
68:             const remaining = Object.keys(rest).length > 0 ? JSON.stringify(rest) : ""
69:             prompt = remaining ? `${remaining}\n\n${args.prompt}` : args.prompt
70:           } else {
71:             prompt = `${args.context}\n\n${args.prompt}`
72:           }
73:         } catch {
74:           prompt = `${args.context}\n\n${args.prompt}`
75:         }
76:       }
77: 
78:       try {
79:         const result = await coordinator.dispatch({
80:           agent: args.agent,
81:           currentDepth: 0,
82:           parentSessionId,
83:           prompt,
84:           queueKey: `agent:${args.agent}`,
85:           surface: "agent-delegation",
86:           workingDirectory: context.directory ?? context.worktree,
87:         })
88:         const resultRecord = asRecord(result)
89:         if (resultRecord.status === "error" || resultRecord.status === "timeout") {
90:           const resultMessage = typeof resultRecord.error === "string" ? resultRecord.error : `[Harness] delegate-task returned ${String(resultRecord.status)}`
91:           return renderToolResult(error(resultMessage, resultRecord))
92:         }
93:         return renderToolResult(success(
94:           `[Harness] Delegated task to ${args.agent}${args.stackOnSessionId ? ` (stacked on ${args.stackOnSessionId})` : ""}`,
95:           { ...resultRecord, agent: args.agent, stackedOn: args.stackOnSessionId ?? undefined },
96:         ))
97:       } catch (caughtError) {
98:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
99:         return renderToolResult(error(message))
100:       }
101:     },
102:   })
103: }
104: 
105: function asRecord(value: unknown): Record<string, unknown> {
106:   return value && typeof value === "object" ? value as Record<string, unknown> : { result: value }
107: }
108: 
109: export { DelegateTaskV2Schema as DelegateTaskInputSchema }
110: 

(End of file - total 110 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/delegation/delegation-status.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/delegation/delegation-status.ts</path>
<type>file</type>
<content>
1: import { tool } from "@opencode-ai/plugin/tool"
2: import { z } from "zod"
3: import { readFile } from "node:fs/promises"
4: import { dirname } from "node:path"
5: 
6: import { readPersistedDelegations } from "../../task-management/continuity/delegation-persistence.js"
7: import { redactTextSecrets } from "../../shared/security/redaction.js"
8: import { renderToolResult } from "../../shared/tool-helpers.js"
9: import { error, success } from "../../shared/tool-response.js"
10: import type { Delegation, DelegationStatus, DelegationTerminalKind } from "../../shared/types.js"
11: import { resolveSessionFile } from "../session/session-resolver.js"
12: import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
13: import type { HierarchyManifest } from "../../features/session-tracker/types.js"
14: import { findStackableSessions, findResumableSessions, getRetryRecommendation, buildStackingGuidanceBanner } from "../../coordination/delegation/session-intelligence.js"
15: import { HierarchyManifestChildSchema, type HierarchyManifestChildValidated } from "./readers/types.js"
16: 
17: // Per-invocation cache for hierarchy-manifest.json — prevents redundant parsing
18: // within a single tool execution. Keyed by `${projectRoot}::${rootSessionId}`.
19: const manifestCache = new Map<string, { data: HierarchyManifest; ts: number }>()
20: const CACHE_TTL = 5_000 // 5 seconds
21: const MAX_CACHE_ENTRIES = 10
22: 
23: /** Zod contract for delegation-status control actions. */
24: export const DelegationControlSchema = z.object({
25:   action: z.enum(["abort", "cancel", "restart", "resume", "chain", "adjust-prompt", "change-agent"]),
26:   chainParentSessionId: z.string().optional(),
27:   restartPrompt: z.string().optional(),
28:   agent: z.string().optional(),
29: }).refine((value) => (value.action === "restart" || value.action === "resume") ? !!value.restartPrompt : true, "restartPrompt is required for restart and resume")
30:   .refine((value) => value.action !== "chain" || !!value.chainParentSessionId, "chainParentSessionId is required for chain")
31:   .refine((value) => value.action !== "adjust-prompt" || !!value.restartPrompt, "restartPrompt is required for adjust-prompt")
32:   .refine((value) => value.action !== "change-agent" || !!value.agent, "agent is required for change-agent")
33: 
34: const DelegationStatusInputSchema = z.object({
35:   delegationId: z.string().min(1).optional(),
36:   status: z.string().optional(),
37:   action: z.enum(["status", "get", "list", "control", "find-stackable", "pool", "peek", "progress"]).default("status"),
38:   control: DelegationControlSchema.optional(),
39:   agentFilter: z.string().optional(),
40:   /** P58.8 S1 (REQ-58-07): paneId for the peek action. */
41:   paneId: z.string().min(1).optional(),
42:   /** P58.8 S1 (REQ-58-07): maxBytes cap for the peek action content. */
43:   maxBytes: z.number().int().positive().optional(),
44: })
45: 
46: type DelegationStatusInput = z.infer<typeof DelegationStatusInputSchema>
47: type ToolContext = { sessionID?: string }
48: type ManagerLike = {
49:   canSessionAccessDelegation: (sessionId: string | undefined, delegation: Delegation | undefined) => boolean
50:   controlDelegation?: (request: { action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"; delegationId: string; chainParentSessionId?: string; restartPrompt?: string; agent?: string }) => Promise<unknown>
51:   getAllDelegations: () => Delegation[]
52:   getStatus: (id: string) => Delegation | undefined
53:   /** P58 (G2, REQ-58-02): returns a frozen DelegationPool JSON snapshot. */
54:   getPoolSnapshot?: () => unknown
55: }
56: type StatusDeps = {
57:   coordinator?: { dispatch: (params: Record<string, unknown>) => Promise<Record<string, unknown>> }
58:   getChildMessageCount?: (sessionId: string) => Promise<number | null>
59:   getEscalationLevel?: (id: string) => string | null
60:   lifecycle?: { isTerminal: (status: string) => boolean; markAborted: (id: string) => unknown; markCancelled: (id: string) => unknown }
61:   now?: () => number
62:   readPersisted?: () => Delegation[]
63:   terminateChild?: (sessionId: string) => Promise<unknown>
64:   projectRoot?: string
65:   /** P58.8 S1 (REQ-58-07): read the latest capture-pane content for a pane id. */
66:   getPaneContent?: (paneId: string) => { content: string; capturedAt: number; byteLength: number } | null
67:   /** P58.8 S4 (REQ-58-10): read the latest event for a child session id. */
68:   getLastChildEvent?: (childSessionId: string) => { eventType: string; emittedAt: number; payload: Record<string, unknown> } | null
69: }
70: 
71: const UNSUPPORTED_REPLACEMENT_MESSAGE =
72:   "[Harness] restart/redirect is runtime-blocked: @opencode-ai/plugin ToolContext v1.15.4 does not expose a task field or verified custom-tool API for creating a replacement child session. Abort/cancel existing records remain supported; replacement dispatch requires a future verified SDK/CP-PTY path."
73: 
74: /**
75:  * Converts a delegation record into the public status-tool response shape.
76:  *
77:  * @param delegation - Delegation record from memory or persisted fallback.
78:  * @returns Serializable status metadata for tool output.
79:  */
80: function renderDelegation(delegation: Delegation): Record<string, unknown> {
81:   const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
82:   return {
83:     delegationId: delegation.id,
84:     childSessionId: delegation.childSessionId,
85:     status: delegation.status,
86:     agent: delegation.agent,
87:     result: delegation.result ? redactTextSecrets(delegation.result) : undefined,
88:     error: delegation.error ? redactTextSecrets(delegation.error) : undefined,
89:     createdAt: delegation.createdAt,
90:     completedAt: delegation.completedAt,
91:     executionMode: delegation.executionMode,
92:     surface: delegation.surface,
93:     recoveryGuarantee: delegation.recoveryGuarantee,
94:     workingDirectory: delegation.workingDirectory,
95:     ptySessionId: delegation.ptySessionId,
96:     fallbackReason: delegation.fallbackReason ? redactTextSecrets(delegation.fallbackReason) : undefined,
97:     queueKey: delegation.queueKey,
98:     terminalKind: delegation.terminalKind,
99:     terminationSignal: delegation.terminationSignal,
100:     explicitCancellation: delegation.explicitCancellation,
101:     nestingDepth: delegation.nestingDepth,
102:     gracePeriodExpiresAt: delegation.gracePeriodExpiresAt,
103:     actionCount: delegation.actionCount,
104:     evidenceLevel: delegation.evidenceLevel,
105:     executionState: delegation.executionState,
106:     finalMessageExcerpt: delegation.finalMessageExcerpt ? redactTextSecrets(delegation.finalMessageExcerpt) : undefined,
107:     firstActionAt: delegation.firstActionAt,
108:     messageCount: delegation.messageCount,
109:     resume: isTerminal ? { childSessionId: delegation.childSessionId, mode: "continue-child-session" } : undefined,
110:     signalSource: delegation.signalSource,
111:     signals: { actionCount: delegation.actionCount ?? 0, messageCount: delegation.messageCount ?? 0, toolCallCount: delegation.toolCallCount ?? 0 },
112:     toolCallCount: delegation.toolCallCount,
113:   }
114: }
115: 
116: function formatElapsed(ms: number): string {
117:   return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
118: }
119: 
120: function calculateProgressPct(delegation: Delegation, elapsedMs: number): number | null {
121:   if (delegation.status === "completed") return 100
122:   if (delegation.status === "error" || delegation.status === "timeout") return 100
123:   return Math.min(99, Math.floor((elapsedMs / 300_000) * 100))
124: }
125: 
126: async function renderDelegationV2(delegation: Delegation & { v2?: boolean; prompt?: string }, deps: StatusDeps): Promise<Record<string, unknown>> {
127:   const base = renderDelegation(delegation)
128:   if (!delegation.v2) return { ...base, prompt: delegation.prompt, elapsedMs: null, elapsedHuman: null, progressPct: null }
129:   const elapsedMs = (deps.now?.() ?? Date.now()) - delegation.createdAt
130:   const childMessageCount = await deps.getChildMessageCount?.(delegation.childSessionId)
131:   return { ...base, agent: delegation.agent, childMessageCount, elapsedHuman: formatElapsed(elapsedMs), elapsedMs, escalationLevel: deps.getEscalationLevel?.(delegation.id) ?? null, progressPct: calculateProgressPct(delegation, elapsedMs), prompt: delegation.prompt, signals: { actionCount: delegation.actionCount ?? 0, messageCount: delegation.messageCount ?? childMessageCount ?? 0, toolCallCount: delegation.toolCallCount ?? 0 } }
132: }
133: 
134: const VALID_DELEGATION_STATUSES: ReadonlySet<string> = new Set(["dispatched", "running", "completed", "error", "timeout", "aborted", "cancelled"])
135: 
136: /** Runtime validation for DelegationStatus — rejects unknown status strings. */
137: function validateDelegationStatus(raw: string): DelegationStatus {
138:   if (VALID_DELEGATION_STATUSES.has(raw)) return raw as DelegationStatus
139:   return "running" // Safe fallback: treat unknown status as running (non-terminal)
140: }
141: 
142: // Helper to construct a Delegation representation from session-tracker child data
143: async function getSessionTrackerDelegation(projectRoot: string, sessionId: string): Promise<Delegation | null> {
144:   const resolved = await resolveSessionFile(projectRoot, sessionId)
145:   if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
146:     return null
147:   }
148:   const childRecord = resolved.childRecord
149:   const toolCallCount = childRecord.turns.reduce((acc, turn) => acc + (turn.tools?.length ?? 0), 0)
150: 
151:   let result: string | undefined
152:   let error: string | undefined
153:   if (childRecord.status === "completed") {
154:     result = childRecord.lastMessage
155:   } else if (childRecord.status === "error") {
156:     error = childRecord.lastMessage
157:   }
158: 
159:   return {
160:     id: childRecord.sessionID,
161:     parentSessionId: childRecord.parentSessionID,
162:     childSessionId: childRecord.sessionID,
163:     agent: childRecord.mainAgent?.name ?? childRecord.delegatedBy?.subagentType ?? "unknown",
164:     status: validateDelegationStatus(childRecord.status),
165:     result,
166:     error,
167:     createdAt: new Date(childRecord.created).getTime(),
168:     completedAt: childRecord.status !== "active" ? new Date(childRecord.updated).getTime() : undefined,
169:     executionMode: childRecord.delegatedBy?.tool === "task" ? "sdk" : "headless",
170:     surface: "agent-delegation",
171:     recoveryGuarantee: "resumable",
172:     workingDirectory: projectRoot,
173:     ptySessionId: undefined,
174:     fallbackReason: undefined,
175:     queueKey: "",
176:     nestingDepth: childRecord.delegationDepth,
177:     terminalKind: childRecord.status !== "active" ? (childRecord.status as DelegationTerminalKind) : undefined,
178:     terminationSignal: undefined,
179:     explicitCancellation: false,
180:     messageCount: childRecord.turns.length,
181:     toolCallCount,
182:     actionCount: toolCallCount,
183:     finalMessageExcerpt: childRecord.lastMessage,
184:     lastMessageCount: childRecord.turns.length,
185:     stablePollCount: 0,
186:   }
187: }
188: 
189: // Per-invocation cache helper for hierarchy-manifest.json parsing.
190: // Returns cached data if available and within TTL; otherwise reads and caches.
191: async function readManifest(projectRoot: string, rootSessionId: string): Promise<HierarchyManifest> {
192:   const cacheKey = `${projectRoot}::${rootSessionId}`
193:   const cached = manifestCache.get(cacheKey)
194:   if (cached && Date.now() - cached.ts < CACHE_TTL) {
195:     return cached.data
196:   }
197:   const manifestPath = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
198:   const raw = await readFile(manifestPath, "utf-8")
199:   const data = JSON.parse(raw) as HierarchyManifest
200:   // Evict oldest entry if at capacity
201:   if (manifestCache.size >= MAX_CACHE_ENTRIES) {
202:     const oldest = manifestCache.entries().next().value
203:     if (oldest) manifestCache.delete(oldest[0])
204:   }
205:   manifestCache.set(cacheKey, { data, ts: Date.now() })
206:   return data
207: }
208: 
209: // Helper to find all child sessions in session-tracker for a given parent session
210: async function getSessionTrackerChildren(projectRoot: string, parentSessionId: string): Promise<Delegation[]> {
211:   try {
212:     const resolved = await resolveSessionFile(projectRoot, parentSessionId)
213:     if (!resolved) return []
214:     const rootSessionId = resolved.rootSessionId
215: 
216:     const manifest = await readManifest(projectRoot, rootSessionId)
217:     const allChildren = manifest.children ?? {}
218: 
219:     const children: Delegation[] = []
220:     for (const [childSessionId, child] of Object.entries(allChildren)) {
221:       const parsed = HierarchyManifestChildSchema.safeParse(child)
222:       if (!parsed.success) continue
223:       const childMeta = parsed.data as HierarchyManifestChildValidated
224:       if (childMeta.parentSessionID === parentSessionId) {
225:         children.push({
226:           id: childSessionId,
227:           parentSessionId: childMeta.parentSessionID,
228:           childSessionId: childSessionId,
229:           agent: childMeta.subagentType ?? "unknown",
230:           status: childMeta.status as DelegationStatus,
231:           createdAt: new Date(childMeta.createdAt).getTime(),
232:           completedAt: childMeta.status !== "active" && childMeta.updatedAt ? new Date(childMeta.updatedAt).getTime() : undefined,
233:           executionMode: "sdk",
234:           surface: "agent-delegation",
235:           recoveryGuarantee: "resumable",
236:           workingDirectory: projectRoot,
237:           ptySessionId: undefined,
238:           fallbackReason: undefined,
239:           queueKey: "",
240:           nestingDepth: childMeta.delegationDepth ?? 1,
241:           terminalKind: childMeta.status !== "active" ? (childMeta.status as DelegationTerminalKind) : undefined,
242:           terminationSignal: undefined,
243:           explicitCancellation: false,
244:           lastMessageCount: 0,
245:           stablePollCount: 0,
246:         })
247:       }
248:     }
249:     return children
250:   } catch {
251:     return []
252:   }
253: }
254: 
255: // Helper to check if caller session can access delegation lineage
256: async function canAccessDelegation(
257:   projectRoot: string,
258:   callerSessionId: string,
259:   delegation: Delegation,
260:   manager: ManagerLike,
261: ): Promise<boolean> {
262:   if (manager.canSessionAccessDelegation(callerSessionId, delegation)) {
263:     return true
264:   }
265:   try {
266:     const resolvedTarget = await resolveSessionFile(projectRoot, delegation.childSessionId)
267:     const resolvedCaller = await resolveSessionFile(projectRoot, callerSessionId)
268:     if (resolvedTarget && resolvedCaller) {
269:       return resolvedTarget.rootSessionId === resolvedCaller.rootSessionId
270:     }
271:   } catch {
272:     // ignore
273:   }
274:   return false
275: }
276: 
277: interface HierarchyContext {
278:   parentSessionId: string | null
279:   rootSessionId: string
280:   nestingDepth: number
281:   ancestors: string[]
282:   children: Array<{ sessionId: string; agent: string; status: string }>
283:   siblings: Array<{ sessionId: string; agent: string; status: string }>
284:   descendantCount: number
285:   delegationPath: string
286: }
287: 
288: // Helper to construct detailed hierarchy context
289: async function getHierarchyContext(
290:   projectRoot: string,
291:   rootSessionId: string,
292:   currentSessionId: string,
293:   parentSessionId: string | null,
294:   nestingDepth: number,
295: ): Promise<HierarchyContext | null> {
296:   try {
297:     const manifest = await readManifest(projectRoot, rootSessionId)
298:     const allChildren = manifest.children ?? {}
299: 
300:     const ancestors: string[] = []
301:     let currParent = parentSessionId
302:     while (currParent && currParent !== rootSessionId) {
303:       ancestors.push(currParent)
304:       const parentMeta = allChildren[currParent]
305:       currParent = parentMeta ? parentMeta.parentSessionID : null
306:     }
307:     if (parentSessionId) {
308:       ancestors.push(rootSessionId)
309:     }
310: 
311:     const childrenList: Array<{ sessionId: string; agent: string; status: string }> = []
312:     for (const [id, child] of Object.entries(allChildren)) {
313:       const parsed = HierarchyManifestChildSchema.safeParse(child)
314:       if (!parsed.success) continue
315:       const childMeta = parsed.data as HierarchyManifestChildValidated
316:       if (childMeta.parentSessionID === currentSessionId) {
317:         childrenList.push({
318:           sessionId: id,
319:           agent: childMeta.subagentType ?? "unknown",
320:           status: childMeta.status ?? "unknown",
321:         })
322:       }
323:     }
324: 
325:     const siblingsList: Array<{ sessionId: string; agent: string; status: string }> = []
326:     if (parentSessionId) {
327:       for (const [id, child] of Object.entries(allChildren)) {
328:         const parsed = HierarchyManifestChildSchema.safeParse(child)
329:         if (!parsed.success) continue
330:         const childMeta = parsed.data as HierarchyManifestChildValidated
331:         if (childMeta.parentSessionID === parentSessionId && id !== currentSessionId) {
332:           siblingsList.push({
333:             sessionId: id,
334:             agent: childMeta.subagentType ?? "unknown",
335:             status: childMeta.status ?? "unknown",
336:           })
337:         }
338:       }
339:     }
340: 
341:     let descendantCount = 0
342:     for (const [, child] of Object.entries(allChildren)) {
343:       const parsed = HierarchyManifestChildSchema.safeParse(child)
344:       if (!parsed.success) continue
345:       const childMeta = parsed.data as HierarchyManifestChildValidated
346:       let checkParent: string | null = childMeta.parentSessionID
347:       const visited = new Set<string>() // Cycle detection: prevents infinite loop on circular parent refs
348:       while (checkParent) {
349:         if (visited.has(checkParent)) break // Circular reference detected — stop traversal
350:         visited.add(checkParent)
351:         if (checkParent === currentSessionId) {
352:           descendantCount++
353:           break
354:         }
355:         const parentEntry: unknown = allChildren[checkParent]
356:         const parentParseResult = parentEntry ? HierarchyManifestChildSchema.safeParse(parentEntry) : undefined
357:         const parentValidated: HierarchyManifestChildValidated | undefined = parentParseResult?.success ? parentParseResult.data as HierarchyManifestChildValidated : undefined
358:         checkParent = parentValidated ? (parentValidated.parentSessionID ?? null) : null
359:       }
360:     }
361: 
362:     const pathParts = [rootSessionId, ...[...ancestors].reverse().filter(a => a !== rootSessionId)]
363:     if (currentSessionId !== rootSessionId) {
364:       pathParts.push(currentSessionId)
365:     }
366:     const delegationPath = pathParts.join(" -> ")
367: 
368:     return {
369:       parentSessionId,
370:       rootSessionId,
371:       nestingDepth,
372:       ancestors,
373:       children: childrenList,
374:       siblings: siblingsList,
375:       descendantCount,
376:       delegationPath,
377:     }
378:   } catch {
379:     const pathParts = []
380:     if (parentSessionId) {
381:       pathParts.push(rootSessionId)
382:       if (parentSessionId !== rootSessionId) {
383:         pathParts.push(parentSessionId)
384:       }
385:     }
386:     pathParts.push(currentSessionId)
387:     return {
388:       parentSessionId,
389:       rootSessionId,
390:       nestingDepth,
391:       ancestors: parentSessionId ? (parentSessionId === rootSessionId ? [rootSessionId] : [parentSessionId, rootSessionId]) : [],
392:       children: [],
393:       siblings: [],
394:       descendantCount: 0,
395:       delegationPath: pathParts.join(" -> "),
396:     }
397:   }
398: }
399: 
400: async function mergeAllDelegations(
401:   projectRoot: string,
402:   sessionID: string,
403:   manager: ManagerLike,
404:   readPersisted: () => Delegation[],
405: ): Promise<Delegation[]> {
406:   const managerDelegations = manager.getAllDelegations()
407:   const persisted = readPersisted()
408:   const trackerChildren = await getSessionTrackerChildren(projectRoot, sessionID)
409: 
410:   const byId = new Map<string, Delegation>()
411:   const allRecords = [...persisted, ...trackerChildren, ...managerDelegations]
412: 
413:   for (const record of allRecords) {
414:     const existing = byId.get(record.id)
415:     if (existing) {
416:       const isManagerRecord = managerDelegations.some((d) => d.id === record.id)
417:       byId.set(record.id, isManagerRecord ? {
418:         ...existing,
419:         ...record,
420:         messageCount: record.messageCount ?? existing.messageCount,
421:         toolCallCount: record.toolCallCount ?? existing.toolCallCount,
422:         actionCount: record.actionCount ?? existing.actionCount,
423:         finalMessageExcerpt: record.finalMessageExcerpt || existing.finalMessageExcerpt,
424:         result: record.result || existing.result,
425:         error: record.error || existing.error,
426:         completedAt: record.completedAt || existing.completedAt,
427:       } : {
428:         ...record,
429:         ...existing,
430:         messageCount: existing.messageCount ?? record.messageCount,
431:         toolCallCount: existing.toolCallCount ?? record.toolCallCount,
432:         actionCount: existing.actionCount ?? record.actionCount,
433:         finalMessageExcerpt: existing.finalMessageExcerpt || record.finalMessageExcerpt,
434:         result: existing.result || record.result,
435:         error: existing.error || record.error,
436:         completedAt: existing.completedAt || record.completedAt,
437:       })
438:     } else {
439:       byId.set(record.id, record)
440:     }
441:   }
442: 
443:   const managerActiveIds = new Set(managerDelegations.map((d) => d.id))
444:   for (const delegation of byId.values()) {
445:     if (!managerActiveIds.has(delegation.id)) {
446:       if (delegation.status === "dispatched" || delegation.status === "running") {
447:         delegation.status = "cancelled"
448:         delegation.terminalKind = "cancelled"
449:       }
450:     }
451:   }
452: 
453:   return Array.from(byId.values())
454: }
455: 
456: /**
457:  * P59 C5: Per-invocation sequence counter to add entropy to tool outputs.
458:  * Increments on every delegation-status call so that consecutive identical
459:  * queries return different-enough responses (the queryTimestamp changes),
460:  * preventing the "identical tool output" loop trap.
461:  */
462: let delegationStatusInvocationCounter = 0
463: 
464: export function createDelegationStatusTool(
465:   delegationManager: ManagerLike,
466:   deps: StatusDeps = {},
467: ): ReturnType<typeof tool> {
468:   const s = tool.schema
469:   const readPersisted = deps.readPersisted ?? (deps.lifecycle ? () => [] : readPersistedDelegations)
470:   const projectRoot = deps.projectRoot ?? (process.env.OPENCODE_HARNESS_STATE_DIR ? dirname(dirname(process.env.OPENCODE_HARNESS_STATE_DIR)) : process.cwd())
471: 
472:   return tool({
473:     description:
474:       "Check delegation status, discover stackable sessions, and retrieve results. " +
475:       "Actions: status (default), list, control, find-stackable. " +
476:       "**find-stackable**: Discovers terminal sessions available for stacking — use BEFORE creating new delegations to prefer stack-on over fresh dispatch. " +
477:       "The SDK supports stacking onto ANY valid session ID (completed, failed, timed out) both within and across delegation trees.",
478:     args: {
479:       delegationId: s.string().optional().describe("Specific delegation ID to check"),
480:       status: s.string().optional().describe("Filter by status: dispatched, running, completed, error, timeout"),
481:       action: s.string().optional().describe("status, list, control, find-stackable, pool, peek, or progress"),
482:       control: s.object({}).optional().describe("Control action payload"),
483:       agentFilter: s.string().optional().describe("Filter stackable sessions by agent name (for find-stackable action)"),
484:       paneId: s.string().optional().describe("(peek) target tmux pane id"),
485:       maxBytes: s.number().optional().describe("(peek) cap the returned content length"),
486:     },
487:     async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
488:       // P59 C5: Increment invocation counter for entropy
489:       delegationStatusInvocationCounter++
490: 
491:       // Clear per-invocation cache at start to prevent stale data across rapid tool calls
492:       manifestCache.clear()
493: 
494:       const parsed = DelegationStatusInputSchema.safeParse(rawArgs)
495:       if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegation-status input: ${z.prettifyError(parsed.error)}`))
496:       const args = parsed.data
497: 
498:       try {
499:         if (!context.sessionID) {
500:           return renderToolResult(error("[Harness] Missing caller session ID for delegation-status"))
501:         }
502:         if (args.action === "find-stackable") return await handleFindStackable(args, context.sessionID, delegationManager, readPersisted, deps)
503:         if (args.action === "list") return renderList(args, context.sessionID, delegationManager, readPersisted, deps)
504:         if (args.action === "control") return await handleControl(args, context.sessionID, delegationManager, readPersisted, deps)
505:         // P58.8 S1 (REQ-58-07): "peek" action returns the most recent
506:         // capture-pane content for a pane id (or a delegation's pane).
507:         if (args.action === "peek") return handlePeek(args, deps)
508:         // P58.8 S4 (REQ-58-10): "progress" action returns live counters
509:         // and the latest event from the in-memory child event bus.
510:         if (args.action === "progress") return handleProgress(args, context.sessionID, delegationManager, readPersisted, deps)
511:         // P58 (G2, REQ-58-02): "pool" action returns the frozen DelegationPool
512:         // JSON snapshot. The ManagerLike interface declares `getPoolSnapshot`
513:         // as optional so older managers (without G2) skip this branch gracefully.
514:         if (args.action === "pool") {
515:           if (typeof delegationManager.getPoolSnapshot !== "function") {
516:             return renderToolResult(error("[Harness] delegation-status pool action requires getPoolSnapshot() support on the manager"))
517:           }
518:           const snapshot = delegationManager.getPoolSnapshot()
519:           return renderToolResult(success(`Delegation pool snapshot: ${(snapshot as { delegations?: unknown[] }).delegations?.length ?? 0} entries`, snapshot as Record<string, unknown>))
520:         }
521: 
522:         if (args.delegationId) {
523:           let delegation = delegationManager.getStatus(args.delegationId)
524:             ?? delegationManager.getAllDelegations().find((entry) => entry.childSessionId === args.delegationId)
525:             ?? readPersisted().find((entry) => entry.id === args.delegationId || entry.childSessionId === args.delegationId)
526: 
527:           let trackerDel: Delegation | null = null
528:           try {
529:             trackerDel = await getSessionTrackerDelegation(projectRoot, delegation?.childSessionId ?? args.delegationId)
530:           } catch {
531:             // ignore
532:           }
533: 
534:           const initialDelegation = delegation
535:           if (initialDelegation && trackerDel) {
536:             const isManagerRecord = delegationManager.getStatus(initialDelegation.id) !== undefined ||
537:               delegationManager.getAllDelegations().some((d) => d.id === initialDelegation.id)
538: 
539:             delegation = isManagerRecord ? {
540:               ...trackerDel,
541:               ...initialDelegation,
542:               messageCount: initialDelegation.messageCount ?? trackerDel.messageCount,
543:               toolCallCount: initialDelegation.toolCallCount ?? trackerDel.toolCallCount,
544:               actionCount: initialDelegation.actionCount ?? trackerDel.actionCount,
545:               finalMessageExcerpt: initialDelegation.finalMessageExcerpt || trackerDel.finalMessageExcerpt,
546:               result: initialDelegation.result || trackerDel.result,
547:               error: initialDelegation.error || trackerDel.error,
548:               completedAt: initialDelegation.completedAt || trackerDel.completedAt,
549:             } : {
550:               ...initialDelegation,
551:               ...trackerDel,
552:               messageCount: trackerDel.messageCount ?? initialDelegation.messageCount,
553:               toolCallCount: trackerDel.toolCallCount ?? initialDelegation.toolCallCount,
554:               actionCount: trackerDel.actionCount ?? delegationManager.getAllDelegations().find(d => d.id === initialDelegation.id)?.actionCount ?? trackerDel.actionCount,
555:               finalMessageExcerpt: trackerDel.finalMessageExcerpt || initialDelegation.finalMessageExcerpt,
556:               result: trackerDel.result || initialDelegation.result,
557:               error: trackerDel.error || initialDelegation.error,
558:               completedAt: trackerDel.completedAt || initialDelegation.completedAt,
559:             }
560:           } else if (trackerDel) {
561:             delegation = trackerDel
562:           }
563: 
564:           if (!delegation) {
565:             return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
566:           }
567: 
568:           const isManagerActive = delegationManager.getStatus(delegation.id) !== undefined ||
569:             delegationManager.getAllDelegations().some((d) => d.id === delegation.id)
570: 
571:           if (!isManagerActive) {
572:             if (delegation.status === "dispatched" || delegation.status === "running") {
573:               delegation.status = "cancelled"
574:               delegation.terminalKind = "cancelled"
575:             }
576:           }
577: 
578:           if (!(await canAccessDelegation(projectRoot, context.sessionID, delegation, delegationManager))) {
579:             return renderToolResult(error(
580:               `[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`,
581:             ))
582:           }
583: 
584:           const terminalLabel = delegation.terminalKind ?? delegation.status
585:           const signalSuffix = delegation.terminationSignal ? ` (${delegation.terminationSignal})` : ""
586:           const message = delegation.terminalKind
587:             ? `Delegation ${delegation.id} terminal state: ${terminalLabel}${signalSuffix}`
588:             : `Delegation ${delegation.id} status: ${delegation.status}`
589: 
590:           const rendered = await renderDelegationV2(delegation as Delegation & { v2?: boolean }, deps)
591: 
592:           let rootSessionId = delegation.childSessionId
593:           let parentSessionId = delegation.parentSessionId
594:           let nestingDepth = delegation.nestingDepth ?? 1
595:           try {
596:             const resolved = await resolveSessionFile(projectRoot, delegation.childSessionId)
597:             if (resolved) {
598:               rootSessionId = resolved.rootSessionId
599:               if (resolved.type === "child" && resolved.childRecord) {
600:                 parentSessionId = resolved.childRecord.parentSessionID
601:                 nestingDepth = resolved.childRecord.delegationDepth
602:               }
603:             }
604:           } catch {
605:             // ignore
606:           }
607: 
608:           const hierarchy = await getHierarchyContext(
609:             projectRoot,
610:             rootSessionId,
611:             delegation.childSessionId,
612:             parentSessionId,
613:             nestingDepth
614:           )
615: 
616:           const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
617:           const retryRecommendation = isTerminal ? getRetryRecommendation(delegation) : null
618:           const options = {
619:             canAbort: !isTerminal,
620:             canCancel: !isTerminal,
621:             canResume: isTerminal,
622:             canChain: isTerminal,
623:             canStackOn: isTerminal,
624:             resumeCommand: isTerminal
625:               ? `task({ subagent_type: "${delegation.agent}", task_id: "${delegation.childSessionId}", prompt: "..." })`
626:               : undefined,
627:             stackCommand: isTerminal
628:               ? `delegate-task({ agent: "${delegation.agent}", prompt: "...", stackOnSessionId: "${delegation.childSessionId}" })`
629:               : undefined,
630:             retryCommand: retryRecommendation
631:               ? redactTextSecrets(retryRecommendation.taskCommand)
632:               : undefined,
633:             retryGuidance: retryRecommendation
634:               ? redactTextSecrets(retryRecommendation.guidance)
635:               : undefined,
636:           }
637: 
638:           return renderToolResult(success(message, {
639:             ...rendered,
640:             hierarchy,
641:             options,
642:           }))
643:         }
644: 
645:         return renderList(args, context.sessionID, delegationManager, readPersisted, deps)
646:       } catch (caughtError) {
647:         const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
648:         return renderToolResult(error(message))
649:       }
650:     },
651:   })
652: }
653: 
654: async function renderList(args: DelegationStatusInput, sessionID: string, manager: ManagerLike, readPersisted: () => Delegation[], deps: StatusDeps): Promise<string> {
655:   const projectRoot = deps.projectRoot ?? (process.env.OPENCODE_HARNESS_STATE_DIR ? dirname(dirname(process.env.OPENCODE_HARNESS_STATE_DIR)) : process.cwd())
656:   const all = await mergeAllDelegations(projectRoot, sessionID, manager, readPersisted)
657: 
658:   const accessible = []
659:   for (const d of all) {
660:     if (await canAccessDelegation(projectRoot, sessionID, d, manager)) {
661:       accessible.push(d)
662:     }
663:   }
664: 
665:   const filtered = args.status && args.status !== "all" ? accessible.filter((d) => d.status === args.status) : accessible
666: 
667:   // Proactively surface stackable and resumable sessions in list output
668:   const stackable = findStackableSessions(accessible)
669:   const resumable = findResumableSessions(accessible)
670:   const guidanceBanner = buildStackingGuidanceBanner(stackable.length, resumable.length)
671: 
672:   const renderedDelegations = await Promise.all(filtered.map((d) => renderDelegationV2(d as Delegation & { v2?: boolean }, deps)))
673:   return renderToolResult(success(
674:     `${filtered.length} delegation(s)${args.status ? ` with status "${args.status}"` : ""}\n${guidanceBanner}`,
675:     renderedDelegations,
676:     {
677:       total: accessible.length,
678:       stackableCount: stackable.length,
679:       resumableCount: resumable.length,
680:       stackableSessions: stackable.slice(0, 10).map(s => ({
681:         childSessionId: s.childSessionId,
682:         agent: s.agent,
683:         status: s.status,
684:         stackCommand: s.delegateTaskCommand,
685:         reason: s.reason,
686:       })),
687:       queryTimestamp: Date.now(), // P59 C5: cache-busting entropy — prevents identical tool output loop
688:       seq: delegationStatusInvocationCounter, // P59 C5: monotonic counter — ensures every response is unique even if data is identical
689:     },
690:   ))
691: }
692: 
693: async function handleControl(args: DelegationStatusInput, callerSessionId: string, manager: ManagerLike, readPersisted: () => Delegation[], deps: StatusDeps): Promise<string> {
694:   if (!args.delegationId || !args.control) return renderToolResult(error("[Harness] control action requires delegationId and control"))
695:   const projectRoot = deps.projectRoot ?? (process.env.OPENCODE_HARNESS_STATE_DIR ? dirname(dirname(process.env.OPENCODE_HARNESS_STATE_DIR)) : process.cwd())
696: 
697:   let delegation = (manager.getStatus(args.delegationId)
698:     ?? manager.getAllDelegations().find((d) => d.childSessionId === args.delegationId)
699:     ?? readPersisted().find((d) => d.id === args.delegationId || d.childSessionId === args.delegationId)) as (Delegation & { prompt?: string }) | undefined
700: 
701:   if (!delegation) {
702:     const trackerDel = await getSessionTrackerDelegation(projectRoot, args.delegationId)
703:     if (trackerDel) {
704:       delegation = trackerDel
705:     }
706:   }
707: 
708:   if (!delegation) return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
709:   if (!(await canAccessDelegation(projectRoot, callerSessionId, delegation, manager))) return renderToolResult(error(`[Harness] Access denied for delegation "${args.delegationId}": caller session is not in the recorded owner lineage`))
710: 
711:   const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
712:   if (isTerminal) {
713:     if (args.control.action === "cancel" || args.control.action === "abort") {
714:       const existsInManager = manager.getStatus(delegation.id) !== undefined
715:       if (args.control.action === "cancel") {
716:         if (existsInManager) {
717:           deps.lifecycle?.markCancelled?.(delegation.id)
718:         }
719:         return renderToolResult(success(`Delegation ${delegation.id} cancelled (was terminal: ${delegation.status})`, { delegationId: delegation.id, status: "cancelled", wasTerminal: delegation.status }))
720:       }
721:       if (args.control.action === "abort") {
722:         if (existsInManager) {
723:           deps.lifecycle?.markAborted?.(delegation.id)
724:         }
725:         await deps.terminateChild?.(delegation.childSessionId)
726:         return renderToolResult(success(`Delegation ${delegation.id} aborted (was terminal: ${delegation.status})`, { delegationId: delegation.id, status: "aborted", wasTerminal: delegation.status }))
727:       }
728:     }
729:     return renderToolResult(error("[Harness] cannot control terminal delegation"))
730:   }
731: 
732:   if (manager.controlDelegation) {
733:     const result = await manager.controlDelegation({
734:       action: args.control.action,
735:       delegationId: delegation.id,
736:       chainParentSessionId: args.control.chainParentSessionId,
737:       restartPrompt: args.control.restartPrompt,
738:       agent: args.control.agent,
739:     })
740:     if (args.control.action === "abort") await deps.terminateChild?.(delegation.childSessionId)
741:     return renderToolResult(success(`Delegation ${delegation.id} ${args.control.action}ed`, result))
742:   }
743: 
744:   const existsInManager = manager.getStatus(delegation.id) !== undefined
745:   if (args.control.action === "abort") {
746:     if (existsInManager) {
747:       deps.lifecycle?.markAborted(delegation.id)
748:     }
749:     await deps.terminateChild?.(delegation.childSessionId)
750:     return renderToolResult(success(`Delegation ${delegation.id} aborted`, { delegationId: delegation.id, status: "aborted" }))
751:   }
752:   if (args.control.action === "cancel") {
753:     if (existsInManager) {
754:       deps.lifecycle?.markCancelled(delegation.id)
755:     }
756:     return renderToolResult(success(`Delegation ${delegation.id} cancelled`, { delegationId: delegation.id, status: "cancelled" }))
757:   }
758:   return renderToolResult(error("[Harness] restart/redirect requires coordinator-backed manager control API"))
759: }
760: 
761: /**
762:  * Handles the find-stackable action: discovers terminal sessions available
763:  * for stacking new work onto, surfacing ready-to-use commands.
764:  */
765: async function handleFindStackable(
766:   args: DelegationStatusInput,
767:   sessionID: string,
768:   manager: ManagerLike,
769:   readPersisted: () => Delegation[],
770:   deps: StatusDeps,
771: ): Promise<string> {
772:   const projectRoot = deps.projectRoot ?? (process.env.OPENCODE_HARNESS_STATE_DIR ? dirname(dirname(process.env.OPENCODE_HARNESS_STATE_DIR)) : process.cwd())
773:   const all = await mergeAllDelegations(projectRoot, sessionID, manager, readPersisted)
774: 
775:   const accessible = []
776:   for (const d of all) {
777:     if (await canAccessDelegation(projectRoot, sessionID, d, manager)) {
778:       accessible.push(d)
779:     }
780:   }
781: 
782:   const stackable = findStackableSessions(accessible, args.agentFilter)
783:   const resumable = findResumableSessions(accessible)
784:   const banner = buildStackingGuidanceBanner(stackable.length, resumable.length)
785: 
786:   if (stackable.length === 0 && resumable.length === 0) {
787:     return renderToolResult(success(
788:       "No stackable or resumable sessions found — new dispatch is appropriate.",
789:       { stackable: [], resumable: [], guidance: banner, queryTimestamp: Date.now(), seq: delegationStatusInvocationCounter },
790:     ))
791:   }
792: 
793:   return renderToolResult(success(
794:     banner,
795:     {
796:       stackable: stackable.slice(0, 15).map(s => ({
797:         childSessionId: s.childSessionId,
798:         agent: s.agent,
799:         status: s.status,
800:         delegationId: s.delegationId,
801:         completedAt: s.completedAt,
802:         error: s.error,
803:         reason: s.reason,
804:         taskCommand: s.taskCommand,
805:         delegateTaskCommand: s.delegateTaskCommand,
806:         finalMessageExcerpt: s.finalMessageExcerpt,
807:       })),
808:       resumable: resumable.slice(0, 10).map(s => ({
809:         childSessionId: s.childSessionId,
810:         agent: s.agent,
811:         status: s.status,
812:         delegationId: s.delegationId,
813:         reason: s.reason,
814:         taskCommand: s.taskCommand,
815:       })),
816:       queryTimestamp: Date.now(),
817:       seq: delegationStatusInvocationCounter,
818:     },
819:   ))
820: }
821: 
822: export { DelegationStatusInputSchema }
823: export { UNSUPPORTED_REPLACEMENT_MESSAGE }
824: 
825: // ---------------------------------------------------------------------------
826: // P58.8 (S1, REQ-58-07) peek action handler
827: // ---------------------------------------------------------------------------
828: 
829: /**
830:  * Resolve the latest capture-pane record for either an explicit `paneId`
831:  * or a `delegationId`-derived pane. Returns a `renderToolResult` envelope
832:  * with `{ paneId, content, capturedAt, byteLength }`. The `maxBytes`
833:  * optional cap truncates the content from the END (most-recent).
834:  */
835: function handlePeek(args: DelegationStatusInput, deps: StatusDeps): string {
836:   const paneId = args.paneId
837:   if (!paneId && !args.delegationId) {
838:     return renderToolResult(error("[Harness] peek action requires either paneId or delegationId"))
839:   }
840:   if (typeof deps.getPaneContent !== "function") {
841:     return renderToolResult(error("[Harness] peek action requires getPaneContent() wiring on the deps"))
842:   }
843:   // When delegationId is supplied but paneId is not, we resolve paneId from
844:   // the delegation record. The peek action is a small surface; we do not
845:   // thread delegationId → paneId through the manager API yet — when paneId
846:   // is absent, callers should pass it explicitly. We still validate that
847:   // paneId is present.
848:   if (!paneId) {
849:     return renderToolResult(error("[Harness] peek action: delegationId→paneId resolution not yet wired; pass paneId explicitly"))
850:   }
851:   const capture = deps.getPaneContent(paneId)
852:   if (!capture) {
853:     return renderToolResult(error(`[Harness] No capture recorded for pane "${paneId}"; polling may not have run yet`))
854:   }
855:   const content = args.maxBytes && capture.content.length > args.maxBytes
856:     ? capture.content.slice(-args.maxBytes)
857:     : capture.content
858:   return renderToolResult(success(`Captured pane ${paneId} content (${content.length} chars)`, {
859:     paneId,
860:     content,
861:     capturedAt: capture.capturedAt,
862:     byteLength: Buffer.byteLength(content, "utf8"),
863:   }))
864: }
865: 
866: // ---------------------------------------------------------------------------
867: // P58.8 (S4, REQ-58-10) progress action handler
868: // ---------------------------------------------------------------------------
869: 
870: /**
871:  * Returns live counters and the latest event from the in-memory bus.
872:  * Counters come from the delegation record (or the manager's projection
873:  * if v2 is wired); `lastEvent` comes from `deps.getLastChildEvent(childSessionId)`.
874:  */
875: function handleProgress(
876:   args: DelegationStatusInput,
877:   callerSessionId: string,
878:   manager: ManagerLike,
879:   readPersisted: () => Delegation[],
880:   deps: StatusDeps,
881: ): string {
882:   if (!args.delegationId) {
883:     return renderToolResult(error("[Harness] progress action requires delegationId"))
884:   }
885:   const delegation = (manager.getStatus(args.delegationId)
886:     ?? manager.getAllDelegations().find((d) => d.childSessionId === args.delegationId)
887:     ?? readPersisted().find((d) => d.id === args.delegationId || d.childSessionId === args.delegationId))
888:   if (!delegation) {
889:     return renderToolResult(error(`[Harness] Delegation "${args.delegationId}" not found`))
890:   }
891:   const lastEvent = typeof deps.getLastChildEvent === "function"
892:     ? deps.getLastChildEvent(delegation.childSessionId)
893:     : null
894:   return renderToolResult(success(
895:     `Progress for delegation ${delegation.id}`,
896:     {
897:       delegationId: delegation.id,
898:       actionCount: delegation.actionCount ?? 0,
899:       messageCount: delegation.messageCount ?? 0,
900:       toolCallCount: delegation.toolCallCount ?? 0,
901:       lastEvent: lastEvent ?? null,
902:       capturedAt: Date.now(),
903:       callerSessionId,
904:     },
905:   ))
906: }

(End of file - total 906 lines)
</content>
```

---

## Assistant (Hm-Codebase-Mapper · MiniMax-M3 · 19.2s)

_Thinking:_

I have all 9 files now. Let me also check the existing planning directory structure to understand where to put the audit and what context I should reference.

Now let me check the planning directory structure and the schema referenced by these tools to better understand integration points.

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la .hivemind/planning/ 2>&1 | head -50",
  "description": "Check planning directory contents"
}
```

**Output:**
```
total 112
drwxr-xr-x@ 38 apple  staff   1216 Jun  5 18:19 .
drwxr-xr-x@ 34 apple  staff   1088 Jun  5 16:36 ..
-rw-r--r--@  1 apple  staff   1810 Jun  4 20:01 52-55-tmux-pipeline-landscape-2026-06-02.md
drwxr-xr-x@  3 apple  staff     96 Jun  5 17:43 59-session-backchannel-tmux-permission-rework
drwxr-xr-x@ 14 apple  staff    448 Jun  4 20:01 agent-steering-engine
drwxr-xr-x@ 16 apple  staff    512 Jun  4 20:01 agents-system-overhaul-2026-05-10
drwxr-xr-x@  4 apple  staff    128 Jun  5 10:28 audit-2026-06-04
-rw-r--r--@  1 apple  staff  21272 Jun  4 20:01 circuit-breaker-spec-2026-05-23.md
drwxr-xr-x@  6 apple  staff    192 Jun  4 20:01 constitutional-audit
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 cp-st-session-tracker-2026-05-10
drwxr-xr-x@  5 apple  staff    160 Jun  4 20:01 debug
-rw-r--r--@  1 apple  staff  11124 Jun  4 20:01 delegation-error-audit-2026-05-23.md
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 hm-intelligence-vision
drwxr-xr-x@  4 apple  staff    128 Jun  4 20:01 ideating
-rw-r--r--@  1 apple  staff   3631 Jun  4 20:01 live-test-delegate-task-2026-05-19.md
drwxr-xr-x@  5 apple  staff    160 Jun  4 20:01 merged-phase-24.3-commands-infrastructure-2026-05-27
drwxr-xr-x@  6 apple  staff    192 Jun  4 20:01 meta-builder-dev-skills-audit-2026-05-10
drwxr-xr-x@  8 apple  staff    256 Jun  4 20:01 phase-12-cp-st-01-remediation-2026-05-12
drwxr-xr-x@  7 apple  staff    224 Jun  4 20:01 phase-57-58-loop-2026-06-03
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 refactor
drwxr-xr-x@  4 apple  staff    128 Jun  4 20:01 refactoring
drwxr-xr-x@  4 apple  staff    128 Jun  4 20:01 research
drwxr-xr-x@  4 apple  staff    128 Jun  4 20:01 ses-p58-73-parent
drwxr-xr-x@  3 apple  staff     96 Jun  5 10:54 session-tools-audit-2026-06-05
drwxr-xr-x@  5 apple  staff    160 Jun  4 20:01 session-tracker-deep-fix-2026-05-13
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 session-tracker-gap-audit-2026-05-13
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 session-tracker-remediation-wave-0
-rw-r--r--@  1 apple  staff   3314 Jun  4 20:01 sidecar-SC03-landscape-2026-06-03.md
drwxr-xr-x@  8 apple  staff    256 Jun  4 20:01 sidecar-vision
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 skill-development
drwxr-xr-x@  6 apple  staff    192 Jun  5 19:23 source-of-truth-audit-2026-06-05
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 team-b-references
drwxr-xr-x@  3 apple  staff     96 Jun  4 20:01 tech-debt
drwxr-xr-x@  6 apple  staff    192 Jun  5 18:12 test-driven-governance-2026-06-05
drwxr-xr-x@  3 apple  staff     96 Jun  5 08:34 test-measurement-2026-06-05
-rw-r--r--@  1 apple  staff   8157 Jun  4 20:01 tmux-phases-42-43-45-status-2026-06-01.md
drwxr-xr-x@  8 apple  staff    256 Jun  5 20:22 tools-audit-58-9-2026-06-05
drwxr-xr-x@  5 apple  staff    160 Jun  4 20:01 uat

```

**Tool: glob**

**Input:**
```json
{
  "pattern": ".hivemind/planning/tools-audit-58-9-2026-06-05/**/*"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/09-long-test.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/08-long-task.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/05-real-case-test.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/03-flaw-elaboration.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/01-tools-surface.md
/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/02-schema-overlap-audit.md
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/tools/session/session-resolver.ts"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/tools/session/session-resolver.ts
```

**Tool: glob**

**Input:**
```json
{
  "pattern": "src/schema-kernel/session-tracker.schema.ts"
}
```

**Output:**
```
/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts
```

---

## Assistant (Hm-Codebase-Mapper · MiniMax-M3 · 14.2s)

_Thinking:_

Good - the directory exists and there are prior audit files in it. Let me check a few of them to understand the established format and avoid duplication, and also check the session-resolver to understand integration points.

Let me check the existing audit files to understand the established format and review a few key supporting files.

**Tool: bash**

**Input:**
```json
{
  "command": "ls -la .hivemind/planning/tools-audit-58-9-2026-06-05/ 2>&1",
  "description": "List audit files in detail"
}
```

**Output:**
```
total 448
drwxr-xr-x@  8 apple  staff    256 Jun  5 20:22 .
drwxr-xr-x@ 38 apple  staff   1216 Jun  5 18:19 ..
-rw-r--r--@  1 apple  staff  25259 Jun  5 17:18 01-tools-surface.md
-rw-r--r--@  1 apple  staff  25587 Jun  5 17:16 02-schema-overlap-audit.md
-rw-r--r--@  1 apple  staff  13449 Jun  5 17:37 03-flaw-elaboration.md
-rw-r--r--@  1 apple  staff  16049 Jun  5 19:11 05-real-case-test.md
-rw-r--r--@  1 apple  staff  72637 Jun  5 20:00 08-long-task.md
-rw-r--r--@  1 apple  staff  64022 Jun  5 20:22 09-long-test.md

```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/tools/session/session-resolver.ts"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/src/tools/session/session-resolver.ts</path>
<type>file</type>
<content>
1: import { join } from "node:path"
2: import { access, readFile, readdir } from "node:fs/promises"
3: import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
4: import { isValidSessionID } from "../../features/session-tracker/types.js"
5: import type { ChildSessionRecord, HierarchyManifest } from "../../features/session-tracker/types.js"
6: 
7: export interface ResolvedSession {
8:   type: "main" | "child"
9:   rootSessionId: string
10:   filePath: string // MD path for main session, JSON path for child session
11:   continuityPath: string // session-continuity.json of the root main session
12:   manifestPath: string // hierarchy-manifest.json of the root main session
13:   childRecord?: ChildSessionRecord
14: }
15: 
16: /**
17:  * Resolves any session ID (main or child) to its files and parent structure on disk.
18:  * Supports both root main sessions and child sessions stateless-ly.
19:  *
20:  * All functions classes and interfaces are documented.
21:  */
22: export async function resolveSessionFile(
23:   projectRoot: string,
24:   sessionId: string,
25: ): Promise<ResolvedSession | null> {
26:   if (!isValidSessionID(sessionId)) {
27:     return null
28:   }
29: 
30:   // 1. Try resolving as a main session
31:   const mainMdPath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
32:   const mainContinuityPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
33:   const mainManifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
34: 
35:   try {
36:     await access(mainMdPath)
37:     return {
38:       type: "main",
39:       rootSessionId: sessionId,
40:       filePath: mainMdPath,
41:       continuityPath: mainContinuityPath,
42:       manifestPath: mainManifestPath,
43:     }
44:   } catch {
45:     // Not a main session or files not created yet
46:   }
47: 
48:   // 2. Resolve as a child session. Scan all root main directories.
49:   const trackerRoot = sessionTrackerRoot(projectRoot)
50:   let rootDirs: string[] = []
51:   try {
52:     // Try reading project-continuity.json chronologicalOrder first
53:     const projectIndexPath = join(trackerRoot, "project-continuity.json")
54:     const raw = await readFile(projectIndexPath, "utf-8")
55:     const index = JSON.parse(raw) as { chronologicalOrder?: string[]; sessions?: Record<string, unknown> }
56:     rootDirs = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
57:   } catch {
58:     // Fall back to scanning directories starting with ses_
59:     try {
60:       const entries = await readdir(trackerRoot, { withFileTypes: true })
61:       rootDirs = entries
62:         .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
63:         .map((e) => e.name)
64:     } catch {
65:       return null
66:     }
67:   }
68: 
69:   // Search each root directory's manifest for this child session
70:   for (const rootId of rootDirs) {
71:     const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
72:     try {
73:       const raw = await readFile(manifestPath, "utf-8")
74:       const manifest = JSON.parse(raw) as HierarchyManifest
75:       if (manifest.children && manifest.children[sessionId]) {
76:         const childMeta = manifest.children[sessionId]
77:         const childFile = childMeta.childFile || `${sessionId}.json`
78:         const filePath = safeSessionPath(projectRoot, rootId, childFile)
79:         try {
80:           const childRaw = await readFile(filePath, "utf-8")
81:           const childRecord = JSON.parse(childRaw) as ChildSessionRecord
82:           return {
83:             type: "child",
84:             rootSessionId: rootId,
85:             filePath,
86:             continuityPath: safeSessionPath(projectRoot, rootId, "session-continuity.json"),
87:             manifestPath,
88:             childRecord,
89:           }
90:         } catch {
91:           // File not readable, skip
92:         }
93:       }
94:     } catch {
95:       // Manifest not found or unreadable, check if the child json file exists directly
96:       const childJsonPath = safeSessionPath(projectRoot, rootId, `${sessionId}.json`)
97:       try {
98:         await access(childJsonPath)
99:         const childRaw = await readFile(childJsonPath, "utf-8")
100:         const childRecord = JSON.parse(childRaw) as ChildSessionRecord
101:         return {
102:           type: "child",
103:           rootSessionId: rootId,
104:           filePath: childJsonPath,
105:           continuityPath: safeSessionPath(projectRoot, rootId, "session-continuity.json"),
106:           manifestPath: safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json"),
107:           childRecord,
108:         }
109:       } catch {
110:         // Not in this root directory
111:       }
112:     }
113:   }
114: 
115:   return null
116: }

(End of file - total 116 lines)
</content>
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/01-tools-surface.md"
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/01-tools-surface.md</path>
<type>file</type>
<content>
1: [LANGUAGE: Write this file in en per Language Governance.]
2: # Tools Surface Investigation — UAT Phase 58.9
3: 
4: **Date:** 2026-06-05  
5: **Subagent:** hm-codebase-mapper  
6: **Scope:** Session management, coordination, and delegation tools (22 tools)
7: 
8: ---
9: 
10: ## 1. Per-Tool Schema Table
11: 
12: ### A. Delegation Tools
13: 
14: | Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
15: |------|---------|---------------|---------------|-------------------|--------------------|
16: | `delegate-task` | execute | agent, prompt | context, stackOnSessionId | "error", "timeout" (result) | `coordinator.dispatch` at `src/tools/delegation/delegate-task.ts:79` |
17: | `delegation-status` | status, list, control, find-stackable, pool, peek, progress | (varies by action) | delegationId, status, action, control, agentFilter, paneId, maxBytes | dispatched, running, completed, error, timeout, aborted, cancelled (VALID_DELEGATION_STATUSES at `src/tools/delegation/delegation-status.ts:134`) | `delegationManager.getStatus`, `readPersistedDelegations`, `session-intelligence.ts` findStackableSessions |
18: | `DelegationManager.dispatch` | dispatch | agent, parentSessionId, prompt | currentDepth, queueKey, surface, workingDirectory | dispatched → running → (completed \| error \| timeout) | `coordinator.dispatch` or `runtime.dispatch` at `src/coordination/delegation/manager.ts:165-168` |
19: | `DelegationCoordinator.dispatch` | dispatch | agent, currentDepth, parentSessionId, prompt, queueKey | surface, workingDirectory, model | dispatched → running (transitions), error, aborted, cancelled, timeout (terminal) | `childSessionStarter.start` → SDK `createSession` + `sendPromptAsync` at `src/coordination/delegation/coordinator.ts:192-312` |
20: | `sdk-child-session-starter.start` | start | agent, delegationId, parentSessionId, prompt, validatedAgent, workingDirectory | model, onChildSessionId | — (no status; returns childSessionId) | `createSession` SDK API at `src/coordination/delegation/sdk-child-session-starter.ts:32`, `sendPromptAsync` at `:49` |
21: 
22: ### B. Session Tracking Tools
23: 
24: | Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
25: |------|---------|---------------|---------------|-------------------|--------------------|
26: | `session-tracker` | export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions | action | sessionId, query, limit, format, status, agentType, minDepth, maxDepth, timeRange | "active", "completed", "error", "aborted", "cancelled" (from child records + hierarchy manifests) | `resolveSessionFile`, `safeSessionPath`, `hierarchy-manifest.json` |
27: | `session-hierarchy` | get-children, get-parent-chain, get-delegation-depth, get-manifest | action, sessionId | includeStatus | "active", "completed", "error", "aborted", "cancelled", "unknown" | `resolveSessionFile`, `readContinuity`, `hierarchy-manifest.json` |
28: | `session-context` | find-related, cross-reference, synthesize-context, aggregate | action | sessionId, query, maxRelated, groupBy | `groupBy: "status"` aggregates "active", "completed", etc. | `project-continuity.json`, `hierarchy-manifest.json` |
29: | `session-delegation-query` | list, get | action | rootSessionId, status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore, offset, limit, sessionId | filtered by status string match | `hierarchy-manifest.json` children, `resolveSessionFile` for child records |
30: | `hivemind-session-view` | get | action, sessionId | — | "running", "dispatched" (for active delegation count) | 3 data roots: session-tracker, delegations, trajectory-ledger |
31: | `session-journal-export` | (export only) | format | sessionId, pipelineKey, pipelineKeyLabel | — (reads continuity + delegation records) | `listSessionContinuity`, `readPersistedDelegations`, `buildExecutionLineage` |
32: 
33: ### C. Hivemind Tools
34: 
35: | Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
36: |------|---------|---------------|---------------|-------------------|--------------------|
37: | `hivemind-trajectory` | inspect, traverse, attach, checkpoint, event, close, create | action | trajectoryId, rootSessionId, sessionId, parentTrajectoryId, checkpointId, eventId, eventType, summary, evidenceRef, evidenceRefs, phaseNumber, phaseName, depth | — (trajectory-based state machine) | `trajectory-ledger.json` at `.hivemind/state/trajectory-ledger.json` |
38: | `hivemind-pressure` | classify, detect, inspect_tool_catalog, attach_event | action | score, tier, toolName, trajectoryId, rootSessionId, sessionId, parentTrajectoryId, eventId, summary, evidenceRef, evidenceRefs | tier 0-9, band labels | `runtime-pressure` feature → `eventTrajectory` for attach_event |
39: | `hivemind-command-engine` | discover, analyze_contract, render_context, transform_messages, route_preview, list_commands | action | commandName, arguments, context, messages, maxCharacters, score, tier | — (read-side only) | `executeCommandEngineAction` at `src/routing/command-engine/index.ts` |
40: | `hivemind-agent-work-create` | (create contract) | ownerAgent, taskBoundary, minimumEvidenceLevel | id, ownerSessionId, ownerParentSessionId, allowedSurfaces, dependencies, nonGoals, requiredProof, verificationCommands, blockedStateRules, briefing, summary, anchors, reinjectionPayload, sourceRefs, trajectoryId | — (creates contracts, no status enum) | `createAgentWorkContract` at `src/features/agent-work-contracts/index.ts` |
41: | `hivemind-agent-work-export` | (export contract) | contractId | format | — (read-only export) | `exportAgentWorkContract` |
42: | `hivemind-sdk-supervisor` | health, heartbeat, diagnostics, readiness | action | sessionId, maxDiagnostics, score, tier | — (health check only) | `executeSdkSupervisorAction` at `src/features/sdk-supervisor/index.ts` |
43: | `hivemind-doc` | skim, skim_directory, read, chunk, search | action, path | query, maxCharacters, maxResults | — (read-only document intelligence) | `executeDocIntelligenceAction` at `src/features/doc-intelligence/index.ts` |
44: 
45: ### D. Tmux Tools
46: 
47: | Tool | Actions | Required Args | Optional Args | Status Values Used | Integration Points |
48: |------|---------|---------------|---------------|-------------------|--------------------|
49: | `tmux-copilot` | send-keys, list-panes, compute-grid, respawn, forward-prompt, take-over, release, peek | action | paneId, text, literal, mainPaneId, tree, sessionId, maxBytes | permission-denied, tmux-not-wired, tmux-not-installed, tmux-timeout, tmux-error, manualOverride, session-not-found | `getSessionManagerAdapter` at `src/features/tmux/types.ts` |
50: | `tmux-state-query` | list-sessions, get-session, get-summary | action | sessionId | permission-denied, tmux-not-wired | `getSessionManagerAdapter` |
51: 
52: ### E. Continuity & Persistence
53: 
54: | Module | Key Methods | Status Values Used | File Path |
55: |--------|-------------|-------------------|-----------|
56: | `src/features/tmux/persistence.ts` | persist, remove, restoreAll, generateId | "active", "ready", "paused", "detached", "failed" (SessionState, 5 literals) | `.hivemind/state/tmux-sessions/<id>.json` |
57: | `src/task-management/continuity/index.ts` | listSessionContinuity, getSessionContinuity, recordSessionContinuity, patchSessionContinuity, deleteSessionContinuity | "pending" (default status in normalizeContinuityRecord) | `.hivemind/state/session-continuity.json` |
58: | `src/task-management/continuity/delegation-persistence.ts` | persistDelegations, readPersistedDelegations | maps: "dispatched"\|"running" → "active", "completed" → "completed", "aborted" → "aborted", "cancelled" → "cancelled", else "error" | `.hivemind/state/delegations.json` (legacy) + session-tracker dual-write |
59: 
60: ---
61: 
62: ## 2. Status Value Audit
63: 
64: ### 2.1 Canonical DelegationStatus (Source of Truth)
65: 
66: Defined at `src/coordination/delegation/types.ts:1-9`:
67: 
68: | Status | Meaning | Terminal? |
69: |--------|---------|-----------|
70: | `dispatched` | Just dispatched, child session created and prompted | No |
71: | `running` | Child session processing, dual-signal monitoring active | No |
72: | `completed` | Dual-signal confirmed completion | Yes |
73: | `error` | Error occurred (child session deleted, SDK error, etc.) | Yes |
74: | `timeout` | Safety ceiling reached | Yes |
75: | `aborted` | Aborted by user or connection recovery failure | Yes |
76: | `cancelled` | Cancelled explicitly or because of connection drop | Yes |
77: 
78: **VALID_DELEGATION_STATUSES** at `src/tools/delegation/delegation-status.ts:134` is the runtime validation set and matches exactly: `{"dispatched", "running", "completed", "error", "timeout", "aborted", "cancelled"}`
79: 
80: ### 2.2 DelegationTerminalKind (Subset + Extensions)
81: 
82: Defined at `src/coordination/delegation/types.ts:14-23`:
83: 
84: ```
85: "completed" | "error" | "timeout" | "cancelled" | "restarted"
86: | "runtime-dispatch-unsupported" | "interrupted-by-signal"
87: | "non-resumable-after-restart"
88: ```
89: 
90: **Note:** `aborted` is NOT in the terminal kind union. The terminal kind for aborted is `"cancelled"` (see `coordinator.ts:454`: `terminalKind: "cancelled"`).
91: 
92: ### 2.3 DelegationLifecycleStatus (Pool Collapsed)
93: 
94: Defined at `src/coordination/delegation/pool-types.ts:36-43`:
95: 
96: ```
97: "queued" | "dispatched" | "running" | "completed" | "failed" | "aborted" | "paused"
98: ```
99: 
100: **Collapse mapping** from `DelegationStatus`: `error | timeout → "failed"`, `cancelled → "aborted"`. Adds `"queued"` and `"paused"` which don't exist in canonical DelegationStatus.
101: 
102: ### 2.4 SessionState (Tmux Persistence)
103: 
104: Defined at `src/features/tmux/persistence.ts:32`:
105: 
106: ```
107: "active" | "ready" | "paused" | "detached" | "failed"
108: ```
109: 
110: **None of these overlap** with `DelegationStatus`.
111: `"paused"` overlaps with `DelegationLifecycleStatus` only.
112: `"active"` is used by session-tracker child records but means "session is running" vs tmux "tmux pane is alive."
113: 
114: ### 2.5 Inconsistencies Found
115: 
116: | Issue | Location | Impact |
117: |-------|----------|--------|
118: | `aborted` missing from `DelegationTerminalKind` | `types.ts:14` | `abortDelegation` uses `terminalKind: "cancelled"` — losing signal fidelity |
119: | `DelegationLifecycleStatus` re-maps `error\|timeout → failed` | `pool-types.ts` + `manager.ts:251-258` | Downstream consumers see "failed" not "error" or "timeout" |
120: | `DelegationLifecycleStatus` re-maps `cancelled → aborted` | `manager.ts:256` | Lossy: "cancelled" and "aborted" are semantically different |
121: | SessionTracker child records use "active" for in-progress | `delegation-persistence.ts:24` | "active" is NOT in canon DelegationStatus; must be mapped FROM "dispatched"\|"running" |
122: | SessionTracker child records use "completed"\|"error"\|"aborted"\|"cancelled"\|"active" | `session-tracker.ts` passim | No "timeout" status in session-tracker; timeouts collapse to "error" |
123: | `normalizeContinuityRecord` uses "pending" as default status | `continuity/index.ts:185` | "pending" is NOT in any DelegationStatus type |
124: | Pool status "queued" has no source DelegationStatus mapping | `pool-types.ts:37` | Only reachable through `default` in the `getPoolSnapshot` switch |
125: 
126: ### 2.6 Status Value Cross-Reference Matrix
127: 
128: | Value | DelegationStatus | DelegationTerminalKind | DelegationLifecycleStatus | SessionState | SessionTracker |
129: |-------|:----------------:|:----------------------:|:-------------------------:|:------------:|:--------------:|
130: | dispatched | ✓ | | ✓ | | |
131: | running | ✓ | | ✓ | | |
132: | completed | ✓ | ✓ | ✓ | | ✓ |
133: | error | ✓ | ✓ | → failed | | ✓ |
134: | timeout | ✓ | ✓ | → failed | | |
135: | aborted | ✓ | | ✓ | | ✓ |
136: | cancelled | ✓ | ✓ | → aborted | | ✓ |
137: | restarted | | ✓ | | | |
138: | runtime-dispatch-unsupported | | ✓ | | | |
139: | interrupted-by-signal | | ✓ | | | |
140: | non-resumable-after-restart | | ✓ | | | |
141: | queued | | | ✓ | | |
142: | paused | | | ✓ | ✓ | |
143: | active | | | | ✓ | ✓ |
144: | ready | | | | ✓ | |
145: | detached | | | | ✓ | |
146: | failed | | | ✓ | ✓ | |
147: | pending | | | | | (continuity default) |
148: | unknown | | | | | (fallback) |
149: 
150: ---
151: 
152: ## 3. Overlap Matrix
153: 
154: ### 3.1 session-tracker vs session-hierarchy
155: 
156: | Dimension | session-tracker | session-hierarchy |
157: |-----------|----------------|-------------------|
158: | **list-sessions** | ✓ Reads continuity index + directory scan | — |
159: | **filter-sessions** | ✓ By status, agentType, depth range, time range | — |
160: | **get-children** | — (not exposed) | ✓ Reads hierarchy-manifest |
161: | **get-manifest** | — (not exposed) | ✓ Flattened child list |
162: | **get-parent-chain** | — | ✓ Walks parent chain |
163: | **get-delegation-depth** | — | ✓ Recursive depth compute |
164: | **Overlap:** | `filter-sessions` iterates manifests to build child list; `get-manifest` provides the same data. **PARTIAL OVERLAP** — filter-sessions aggregates across ALL root sessions; get-manifest is for ONE root session. |
165: 
166: ### 3.2 delegation-status vs session-delegation-query
167: 
168: | Dimension | delegation-status | session-delegation-query |
169: |-----------|------------------|--------------------------|
170: | **list delegations** | ✓ via `list` action — merges manager memory + persisted + session-tracker | ✓ via `list` action — reads hierarchy-manifest only |
171: | **get single delegation** | ✓ via delegationId — merges 3 sources | ✓ via sessionId — reads child .json via resolveSessionFile |
172: | **find-stackable** | ✓ via session-intelligence | — |
173: | **Need delegationId** | ✓ via `delegationId` param | ✗ via `sessionId` (child session ID) |
174: | **Status filtering** | ✓ | ✓ |
175: | **Overlap:** | **SIGNIFICANT.** Both list delegations. `delegation-status` has richer merge logic (3 sources + find-stackable). `session-delegation-query` has better filtering (agentType, delegatedBy, depth range). `delegation-status` requires delegationId; `session-delegation-query` accepts sessionId — different primary keys for the same child sessions. |
176: 
177: ### 3.3 hivemind-session-view vs session-tracker + session-delegation-query + hivemind-trajectory
178: 
179: | Dimension | hivemind-session-view | session-tracker | session-delegation-query | hivemind-trajectory |
180: |-----------|----------------------|----------------|--------------------------|---------------------|
181: | **Session data** | ✓ (from continuity) | ✓ (get-status/get-summary) | — | — |
182: | **Delegation list** | ✓ (from manifest + legacy) | — (filter-sessions shows children) | ✓ (list action) | — |
183: | **Trajectory** | ✓ (from ledger file) | — | — | ✓ (inspect action) |
184: | **Single call** | ✓ All 3 roots | — | — | — |
185: | **Overlap:** | **UNIFIED VIEWER** — wraps session-tracker data + delegation-query data + trajectory into one envelope. Does not replace them; makes them accessible in one call. |
186: 
187: ### 3.4 delegation-status (pool action) vs DelegationManager.getPoolSnapshot
188: 
189: | Dimension | delegation-status (pool) | DelegationManager.getPoolSnapshot |
190: |-----------|-------------------------|-----------------------------------|
191: | **Returns Frozen DelegationPool** | ✓ | ✓ |
192: | **Who calls it** | Agent tool | Coordinator / tmux-copilot / SSE |
193: | **Overlap:** | **IDENTICAL** — the `pool` action calls `delegationManager.getPoolSnapshot()`. This is a direct passthrough. |
194: 
195: ### 3.5 session-context vs session-tracker
196: 
197: | Dimension | session-context | session-tracker |
198: |-----------|----------------|-----------------|
199: | **find-related** | ✓ By tool overlap + time proximity | — |
200: | **cross-reference** | ✓ By tool name/term across sessions | — (search-sessions is content-based) |
201: | **aggregate (status)** | ✓ Counts per status | — (filter-sessions shows individual, not aggregate) |
202: | **aggregate (agentType)** | ✓ Counts per subagentType | — |
203: | **synthesize-context** | ✓ Compact markdown summary | — (get-summary is frontmatter only) |
204: | **Overlap:** | **COMPLEMENTARY.** session-tracker is raw data queries. session-context is derived intelligence. No direct overlap but `synthesize-context` and `get-summary` both read continuity data. |
205: 
206: ### 3.6 tmux-copilot.peek vs delegation-status.peek
207: 
208: | Dimension | tmux-copilot.peek | delegation-status.peek |
209: |-----------|-------------------|------------------------|
210: | **Pane content** | ✓ via adapter.getLatestCapture | ✓ via deps.getPaneContent |
211: | **Permission gate** | Orchestrator + USER_SESSION | (no tier gate shown) |
212: | **Overlap:** | **VERY HIGH.** Both return pane content. `delegation-status.peek` accepts delegationId (with paneId fallback); `tmux-copilot.peek` requires `paneId`. `delegation-status.peek` can also resolve from delegation records. |
213: 
214: ### 3.7 session-journal-export vs hivemind-trajectory
215: 
216: | Dimension | session-journal-export | hivemind-trajectory |
217: |-----------|----------------------|---------------------|
218: | **Lineage** | ✓ `buildExecutionLineage` from continuity + delegations | ✓ trajectory ledger with events/checkpoints |
219: | **Format** | JSON or Markdown export | Read/update actions on ledger |
220: | **Overlap:** | **PARTIAL.** Both deal with session history. session-journal-export is DERIVED (projected from continuity + delegations). hivemind-trajectory is an explicit ledger (written by events). |
221: 
222: ---
223: 
224: ## 4. Consolidation Candidates
225: 
226: ### CANDIDATE 1: Merge `session-delegation-query` into `delegation-status`
227: 
228: **Evidence:**
229: - Both list delegations (overlap matrix 3.2)
230: - `delegation-status` has richer merge logic (3 sources) + find-stackable
231: - `session-delegation-query` has better filters (agentType, delegatedBy, depth range)
232: - `session-delegation-query` uses `sessionId` as primary key; `delegation-status` uses `delegationId`
233: - They are complementary: `session-delegation-query` reads session-tracker only; `delegation-status` merges manager + persisted + tracker
234: 
235: **Recommendation:** Add `session-delegation-query`'s filter capabilities (agentType, delegatedBy, offset/limit) and `sessionId` resolution to `delegation-status`'s `list` action. Retire `session-delegation-query` as standalone tool — it is a read-side subset.
236: 
237: ### CANDIDATE 2: Merge `session-hierarchy.get-manifest` into `session-tracker.filter-sessions`
238: 
239: **Evidence:**
240: - Both read hierarchy-manifest.json (overlap matrix 3.1)
241: - `filter-sessions` iterates all manifests; `get-manifest` reads one
242: - `get-manifest` returns richer per-child data (subagentType, turnCount, createdAt)
243: - `filter-sessions` returns only status, agentType, depth, lastUpdated
244: 
245: **Recommendation:** Add `get-manifest`-level detail to `filter-sessions` response. Keep `session-hierarchy` for `get-children`, `get-parent-chain`, `get-delegation-depth` (these read continuity JSON, not manifest).
246: 
247: ### CANDIDATE 3: Normalize `tmux-copilot.peek` and `delegation-status.peek`
248: 
249: **Evidence:**
250: - Both return pane capture content (overlap matrix 3.6)
251: - `tmux-copilot.peek` requires `paneId`; `delegation-status.peek` accepts `delegationId` → `paneId` (but resolution not wired, returns error)
252: - Different permission models (tmux-copilot has user-tier; delegation-status has manager access control)
253: 
254: **Recommendation:** Delegate peek content retrieval to a shared adapter. Make `delegation-status.peek` delegate to the tmux adapter's `getLatestCapture` directly. Consider removing standalone `delegation-status.peek` — the delegation→paneId resolution is not wired and likely won't be.
255: 
256: ### CANDIDATE 4: Align status enums across all tools
257: 
258: **Evidence from Section 2:**
259: - 3 different status enums for essentially the same concept (DelegationStatus, DelegationLifecycleStatus, SessionState)
260: - Lossy collapses: `error|timeout → failed`, `cancelled → aborted`
261: - `"active"` in session-tracker means "running" in DelegationStatus
262: - `"pending"` used as default in continuity but not in DelegationStatus
263: - Pool `"queued"` has no source mapping
264: 
265: **Recommendation:** 
266: 1. Replace `DelegationLifecycleStatus` with canonical `DelegationStatus` + add `"paused"` if needed
267: 2. Fix `terminalKind: "cancelled"` in `abortDelegation` — should be `"aborted"`
268: 3. Normalize session-tracker child status: `"active"` → `"running"`
269: 4. Remove `"pending"` default in continuity; use `"dispatched"`
270: 
271: ### CANDIDATE 5: Deprecate `session-context` find-related and cross-reference
272: 
273: **Evidence:**
274: - `find-related` only uses tool overlap and time proximity — heuristic-based, low utility
275: - `cross-reference` is a simple text search across toolSummary keys — covered by `session-tracker.search-sessions` for content search
276: - `synthesize-context` and `aggregate` are genuinely useful
277: 
278: **Recommendation:** Remove `find-related` and `cross-reference` from `session-context`. Keep `synthesize-context` and `aggregate`. Add aggregation (`groupBy`) capability to `session-tracker.filter-sessions`.
279: 
280: ### CANDIDATE 6: hivemind-session-view is a proxy — keep, not merge
281: 
282: **Evidence from 3.3:**
283: - Unifies 3 data roots in one call
284: - Does not replace individual tools
285: - Returns limited detail per root
286: 
287: **Recommendation:** Keep as-is. It is a convenience proxy (fascade pattern), not a replacement.
288: 
289: ---
290: 
291: ## 5. Notable Findings
292: 
293: ### 5.1 Dead Code / Unreachable Paths
294: 
295: | File | Line(s) | Issue |
296: |------|---------|-------|
297: | `tmux-state-query.ts:157` | `list-sessions` returns `{sessions: []}` | Adapter does not expose sessions — always empty |
298: | `tmux-state-query.ts:165` | `get-session` returns `{session: null}` | Adapter does not expose session detail |
299: | `tmux-state-query.ts:173` | `get-summary` returns `{total: 0, active: 0, spawning: 0}` | Adapter does not provide counts |
300: | `delegation-status.ts:833` | `peek` with delegationId → paneId resolution error | "not yet wired" — action is half-implemented |
301: 
302: ### 5.2 Permission Gate Duplication
303: 
304: - `tmux-copilot.ts:59-64` and `tmux-state-query.ts:26-31` both define `ORCHESTRATOR_AGENTS` as separate arrays
305: - `tmux-copilot` has 4 agent entries; `tmux-state-query` has 4 (slightly different: `hf-l0-orchestrator` vs `hf-coordinator`)
306: - These will drift — they should share a single source of truth
307: 
308: ### 5.3 Data Source Duplication
309: 
310: Both `delegation-persistence.ts` and `delegation-status.ts` independently read hierarchy manifests and child JSON files. The two implementations have slightly different field mappings:
311: - `delegation-persistence.ts:139-161` (readPersistedDelegations) maps `child.status AS DelegationStatus`
312: - `delegation-status.ts:224-232` (getSessionTrackerChildren) maps `childMeta.status AS DelegationStatus`
313: 
314: This creates a maintenance risk if the child record format changes.
315: 
316: ---
317: 
318: ## 6. File:Line Reference Summary
319: 
320: | Tool | File | Key Lines |
321: |------|------|-----------|
322: | delegate-task | `src/tools/delegation/delegate-task.ts` | 10-15 (Zod schema), 79 (coordinator.dispatch) |
323: | delegation-status | `src/tools/delegation/delegation-status.ts` | 34-44 (input schema), 134 (VALID_DELEGATION_STATUSES), 456-641 (main handler) |
324: | DelegationManager | `src/coordination/delegation/manager.ts` | 82 (class def), 165 (dispatch), 246 (getPoolSnapshot) |
325: | DelegationCoordinator | `src/coordination/delegation/coordinator.ts` | 185 (class def), 192 (dispatch), 453 (abortDelegation) |
326: | SDK child starter | `src/coordination/delegation/sdk-child-session-starter.ts` | 19 (factory), 23-58 (start) |
327: | DelegationStatus type | `src/coordination/delegation/types.ts` | 1-8 (canonical status), 14-23 (terminal kind) |
328: | DelegationLifecycleStatus | `src/coordination/delegation/pool-types.ts` | 36-43 (pool status) |
329: | session-tracker | `src/tools/session/session-tracker.ts` | 25-61 (entry point), 166-203 (get-status), 236-275 (list) |
330: | session-hierarchy | `src/tools/session/session-hierarchy.ts` | 33-57 (entry point), 146-206 (actions) |
331: | session-context | `src/tools/session/session-context.ts` | 40-67 (entry point), 144-301 (actions) |
332: | session-delegation-query | `src/tools/session/session-delegation-query.ts` | 35-73 (entry), 99-161 (list), 167-234 (get) |
333: | hivemind-session-view | `src/tools/hivemind/hivemind-session-view.ts` | 26-52 (entry), 119-155 (buildUnifiedView) |
334: | session-journal-export | `src/tools/session/session-journal-export.ts` | 65-115 (entry) |
335: | hivemind-trajectory | `src/tools/hivemind/hivemind-trajectory.ts` | 29-61 (entry), 70-127 (action dispatch) |
336: | hivemind-pressure | `src/tools/hivemind/hivemind-pressure.ts` | 30-59 (entry), 68-92 (action dispatch) |
337: | hivemind-command-engine | `src/tools/hivemind/hivemind-command-engine.ts` | 25-53 (entry) |
338: | hivemind-agent-work | `src/tools/hivemind/hivemind-agent-work.ts` | 28-145 (create + export) |
339: | hivemind-sdk-supervisor | `src/tools/hivemind/hivemind-sdk-supervisor.ts` | 18-40 (entry) |
340: | hivemind-doc | `src/tools/hivemind/hivemind-doc.ts` | 21-43 (entry) |
341: | tmux-copilot | `src/tools/tmux-copilot.ts` | 59-64 (permission agents), 131-190 (schemas), 248-456 (handler) |
342: | tmux-state-query | `src/tools/tmux-state-query.ts` | 26-35 (permission agents), 108-176 (handler) |
343: | tmux persistence | `src/features/tmux/persistence.ts` | 32 (SessionState), 39-49 (PersistedSession), 254-406 (factory) |
344: | session continuity | `src/task-management/continuity/index.ts` | 38-51 (path resolution), 318-467 (public API) |
345: | delegation-persistence | `src/task-management/continuity/delegation-persistence.ts` | 11-17 (paths), 61-110 (persist), 112-236 (read) |
346: 
347: ---
348: 
349: *End of tools surface investigation document. Generated 2026-06-05 by hm-codebase-mapper for UAT phase 58.9.*

(End of file - total 349 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

</system-reminder>
```

---

## Assistant (Hm-Codebase-Mapper · MiniMax-M3 · 518.6s)

_Thinking:_

Good. I have substantial context. The directory has a series of audit files. The task is to write a NEW comprehensive test file (`10-comprehensive-test.md`) that goes deeper than the prior files - thoroughly covering each of the 9 tools with: actions, args, status values, integration points, and flaws.

I noted the system reminder from .hivemind/AGENTS.md - this is a state sector document. Since I'm writing a docs file (not a runtime change), this is L5 documentation. The audit is read-only and won't mutate state. I should:
- Not fabricate state
- Use file:line citations
- Be evidence-grounded
- The output is a planning artifact for the L0 audit work

I have all the data I need. Let me now write the comprehensive test file. The previous files were at 01, 02, 03, 05, 08, 09 - so 10 is a new file. Let me make it thorough as requested, covering each of the 9 tools with: actions, args, status values, integration points, flaws.

Looking at the established format from 01-tools-surface.md, I should follow similar conventions but go deeper on the 9 specific tools requested. I should also note this is from a subagent perspective.

Let me write a thorough audit document. Date: 2026-06-05. Filename: 10-comprehensive-test.md. Following the existing pattern.

Let me structure this:

# Comprehensive Tool Test — 9 Tools
## Metadata
## Per-tool deep dive
For each tool:
- File location
- Description
- Actions (table)
- Args (table)
- Status values
- Integration points
- Flaws / issues

## Cross-cutting concerns

I'll need to be thorough and well-organized. Let me write it now.

I have all the source files and the established format. Now I'll write the comprehensive audit document.

**Tool: write**

**Input:**
```json
{
  "content": "[LANGUAGE: Write this file in en per Language Governance.]\n[LANGUAGE: Write this file in en per Language Governance.]\n# Comprehensive Test — 9-Tool Deep Audit (UAT Phase 58.9)\n\n**Date:** 2026-06-05\n**Subagent:** hm-codebase-mapper\n**Scope:** 9 tools (3 session, 1 hivemind, 2 tmux, 2 delegation, 1 session-delegation)\n**Method:** Direct source read (lines 1-end of each file), cross-referenced with shared helpers and integration owners\n\n---\n\n## 0. Reading Convention\n\nFor every tool I report:\n1. **Actions** — discriminated union values the tool exposes, with the dispatch site (file:line).\n2. **Args** — the Zod schema in TS terms; what is required vs optional; what defaults apply.\n3. **Status values** — every status enum literal the tool can return, accept, or filter on. Includes fallback values when parsing fails.\n4. **Integration points** — every module the tool calls into, with file:line where the import or call site lives.\n5. **Flaws** — what the source actually does that is wrong, dangerous, lossy, undocumented, or contradicting the contracts of the things it depends on.\n\nAll line numbers reference the file paths I read on 2026-06-05. File totals are from the same reads.\n\n---\n\n## 1. `src/tools/session/session-tracker.ts` (423 lines)\n\n### 1.1 Tool entry point\n\n- Factory: `createSessionTrackerTool(projectRoot: string)` at `:25`.\n- Returns a `tool({...})` (OpenCode SDK) with 6 actions.\n- Zod schema source: `SessionTrackerInputSchema` from `../../schema-kernel/session-tracker.schema.js` at `:15`.\n- Path-safety helpers: `safeSessionPath`, `sessionTrackerRoot`, `isValidSessionID` at `:16-17`.\n- Result envelope: `renderToolResult(success|error(...))` at `:18-19`.\n- Resolver: `resolveSessionFile` at `:20`.\n\n### 1.2 Actions (dispatch at `:47-55`)\n\n| Action | Handler | Required args | Optional args |\n|--------|---------|---------------|---------------|\n| `export-session` | `handleExportSession` at `:111` | sessionId | format (\"markdown\"\\|\"json\") |\n| `get-status` | `handleGetStatus` at `:166` | sessionId | — |\n| `get-summary` | `handleGetSummary` at `:205` | sessionId | — |\n| `list-sessions` | `handleListSessions` at `:236` | (limit) | — |\n| `search-sessions` | `handleSearchSessions` at `:277` | query | limit |\n| `filter-sessions` | `handleFilterSessions` at `:339` | (filters) | status, agentType, minDepth, maxDepth, timeRange |\n\nNote: `limit` is declared optional in the args schema (`:33`) but the code reads `input.limit` without a fallback for `list-sessions` and `filter-sessions` — see FLAW-1.\n\n### 1.3 Args schema\n\n```ts\nargs: {\n  action: string                  // not enum — see FLAW-1.1\n  sessionId?: string\n  query?: string                  // 1..1000 chars enforced inside handler at :278\n  limit?: number\n  format?: \"markdown\" | \"json\"\n  status?: string                 // free-form, lowercased inside :345\n  agentType?: string              // free-form, lowercased inside :346\n  minDepth?: number\n  maxDepth?: number\n  timeRange?: { after?: string; before?: string }\n}\n```\n\n### 1.4 Status values (read or filter)\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"active\"` | Injected at `:377` for every root session | Hard-coded — does NOT come from any child record |\n| `\"unknown\"` | `:175, :193` | Fallback when continuity JSON omits `status` |\n| child statuses: `\"completed\"`, `\"error\"`, `\"aborted\"`, `\"cancelled\"` | Filtered via `childMeta.status` at `:386` | Read directly from `hierarchy-manifest.json` children map |\n\nThe `\"active\"` literal here is a `hivemind-tool` invention — the canonical `DelegationStatus` does not contain `\"active\"` (see `src/coordination/delegation/types.ts:1-8`). This is a lossy renaming performed silently. See FLAW-1.2.\n\n### 1.5 Integration points (file:line)\n\n| Call | Target |\n|------|--------|\n| `SessionTrackerInputSchema.parse` (`:46`) | `schema-kernel/session-tracker.schema.js` (Zod runtime) |\n| `resolveSessionFile` (`:112, :167, :206`) | `src/tools/session/session-resolver.ts` (file enumeration) |\n| `safeSessionPath` (`:290, :357`) | `src/features/session-tracker/persistence/atomic-write.js` |\n| `sessionTrackerRoot` (`:239, :262, :281, :343, :352`) | same atomic-write module |\n| `isValidSessionID` (`:289, :356`) | `src/features/session-tracker/types.js` |\n| `matter` from `gray-matter` (`:14, :118, :211`) | frontmatter parser for main `.md` files |\n| `readFile` / `readdir` / `access` from `node:fs/promises` (`:12`) | filesystem reads |\n| `resolve` from `node:path` (`:13`) | path construction for project-continuity.json at `:239` |\n| `renderToolResult`, `success`, `error` | `src/shared/tool-helpers.js`, `src/shared/tool-response.js` |\n\n### 1.6 Flaws\n\n- **FLAW-1.1 — Limit is required but typed optional.** `args.limit` at `:33` is `tool.schema.number().optional()`, and the schema at `SessionTrackerInputSchema` may also allow it to be missing. But `handleListSessions` slices with `allSessions.slice(0, limit)` (`:248`) and `handleFilterSessions` slices with `filtered.slice(0, inputAny.limit)` (`:418`) without a default. If the Zod schema ever lets `limit` through as `undefined`, both handlers will pass `undefined` to `Array.prototype.slice`, returning `[]`. The tool will silently report \"Found 0 sessions\" for valid input. The same omission exists in `handleSearchSessions` (`:325`) where `matches.slice(0, limit)` will be `[]` if `limit` is undefined.\n- **FLAW-1.2 — Hard-coded \"active\" status (line `:377`).** Every root session is reported with `status: \"active\"` regardless of whether it has children, has been completed, or has been archived. The schema at `.hivemind/state/session-continuity.json` (or the local MD's frontmatter) may carry a real status. This is fabricated data.\n- **FLAW-1.3 — `get-status` for child sessions does not use manifest data (`:181-198`).** For a child session, the handler reads `resolved.childRecord.status` but the `turnCount` and `childCount` come from the in-file child record, not the manifest. The manifest is the source of truth for cross-session aggregation; the two will diverge.\n- **FLAW-1.4 — `search-sessions` is unindexed and unbounded (`:282-330`).** It walks every `ses_*` directory, reads every `${sessionId}.md` and every child `.json` file. There is no parallelism, no short-circuit by `limit`, and the inner loop breaks at the first match per file (`:308`) but the outer loop continues until the directory is fully scanned. With many sessions and large `.md` files (the warning at `:295` is emitted but not enforced), this is O(sessions × file_size).\n- **FLAW-1.5 — `filter-sessions` timeRange may produce false positives.** `timeRange.after` and `timeRange.before` are parsed via `new Date(input).getTime()` (`:347-348`). If the strings are invalid dates, `getTime()` returns `NaN`. The comparisons `updated < afterDate` and `updated > beforeDate` will be `false` for `NaN` comparisons, but `if (updated === undefined) return false` (`:411`) will reject every match lacking a `lastUpdated` — meaning most root sessions with no `manifest.lastUpdated` will be filtered OUT. This is a silent behavior, not surfaced as a warning.\n- **FLAW-1.6 — `searchChildJsonFiles` swallows errors silently (`:105, :107`).** Both inner and outer `catch {}` blocks discard information. A user searching for content in a session whose `.json` is corrupt will see no error and no result. There is no `fileWarnings` for unreadable child files (unlike the `.md` warning at `:295`).\n- **FLAW-1.7 — `export-session` does not validate format values (`:115-160`).** If `format` is anything other than `\"json\"`, the handler returns the markdown path. The Zod schema at `tool.schema` allows only `\"markdown\" | \"json\"` (`:34`), so this is enforced at parse time. But the inner `handleExportSession` does not re-validate, and if called directly via test seams it will accept any string. This is a leaky abstraction.\n- **FLAW-1.8 — `get-summary` builds a \"frontmatter\" object that includes `delegatedBy` and `mainAgent` (`:217-226`) but the data shape is `delegatedBy: { agentName, model, tool, description, subagentType }` whereas `get-status` does NOT include these. Two sibling actions return different shapes. Consumers must special-case by action.\n\n---\n\n## 2. `src/tools/session/session-hierarchy.ts` (283 lines)\n\n### 2.1 Tool entry point\n\n- Factory: `createSessionHierarchyTool(projectRoot: string)` at `:33`.\n- 4 actions via `tool.schema.enum` (`:38`) — first tool in the audit set to use the framework enum, not a free string.\n- Schema source: `SessionHierarchyInputSchema` at `:12`.\n- Type imports: `ChildRef` from `src/features/session-tracker/types.js` at `:18`.\n\n### 2.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `get-children` | `handleGetChildren` at `:146` | sessionId | includeStatus |\n| `get-parent-chain` | `handleGetParentChain` at `:162` | sessionId | — |\n| `get-delegation-depth` | `handleGetDelegationDepth` at `:182` | sessionId | — |\n| `get-manifest` | `handleGetManifest` at `:209` | sessionId | — |\n\n### 2.3 Args schema\n\n```ts\nargs: {\n  action: enum[\"get-children\",\"get-parent-chain\",\"get-delegation-depth\",\"get-manifest\"]\n  sessionId: string  // required, validated inside each handler\n  includeStatus?: boolean  // default-false behavior at :153\n}\n```\n\n### 2.4 Status values\n\n| Status | Source | Where |\n|--------|--------|-------|\n| `\"unknown\"` | Default for missing `record.status` | `:171, :238, :273` |\n| Per-child statuses from hierarchy manifest (`status` field on `HierarchyManifestChild`) | Read at `:238` | Map output |\n| No terminal state filtering | All statuses pass through; no validation against VALID_DELEGATION_STATUSES | — |\n\nThe `includeStatus` flag (`:153`) introduces a subtle bug: when `true`, children without a status inherit `record.status` (the parent's). When `false`, status is omitted. When `undefined` (the default), `includeStatus !== false` evaluates to `true`, so status is included by default. This is consistent but non-obvious.\n\n### 2.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `SessionHierarchyInputSchema.parse` (`:44`) | `schema-kernel/session-tracker.schema.js` |\n| `isValidSessionID` (`:147, :163, :183, :210`) | `src/features/session-tracker/types.js` |\n| `resolveSessionFile` (`:79, :172, :212`) | `src/tools/session/session-resolver.ts` |\n| `readFile` from `node:fs/promises` (`:11`) | continuity JSON + manifest JSON reads |\n| `findHierarchyEntry` (`:61, :94, :112`) | Internal recursive helper, identical to the one in `session-context.ts:79` and `session-tracker.ts` (lacks a unit-test seam) |\n| `normalizeChildren` (`:126`) | Shared by all four actions; tolerates both array and object children formats |\n\n### 2.6 Flaws\n\n- **FLAW-2.1 — `handleGetChildren` `delegationDepth` calc is wrong (`:154`).** When the child entry has no `delegationDepth`, the handler computes `(record.delegationDepth ?? 0) + 1`. But `record.delegationDepth` is the depth of the session being queried, not the root. A child at depth 2 of a session at depth 1 will be reported as depth 2 (correct), but a child at depth 0 of a session at depth 0 will be reported as depth 1. This conflates \"depth of this session\" with \"depth of the child\" and silently lies when the child record is missing depth metadata. The compute-depth path at `:192-206` does this correctly; the get-children path does not.\n- **FLAW-2.2 — `computeDepth` MAX_DEPTH is per-process state, not per-call (`:190, :193-195`).** The `COMPUTE_DEPTH_MAX = 100` constant is checked against the running `visited.size` and halts. But `visited: Set<string>` is passed by reference to recursive calls. This means sibling branches share the same `visited` set and the cap is global to one call. This is the correct behavior for cycle protection, but the cap is 100 across the entire tree, not 100 per branch. A wide tree with 100 siblings will appear as \"depth 0\" because the next recursive call sees `visited.size >= 100` and returns 0 (`:194`). This is a subtle and never-noticed bug.\n- **FLAW-2.3 — `handleGetParentChain` does not include root metadata (`:165-178`).** The chain walks up via `record.parentSessionID`, but it only includes `sessionId`, `status`, `depth`. The caller cannot recover `parentSessionID` of the parent from this list. A consumer wanting to know \"is the third link in the chain a sibling of another child\" has to re-call `get-children` for each.\n- **FLAW-2.4 — `handleGetManifest` fallback path is silent (`:255-281`).** When the manifest file is missing AND the continuity record has no `hierarchy.children`, the function returns a generic `error(\"Manifest not found...\")`. The caller cannot tell whether this is \"session exists but has no children\" vs \"session does not exist.\" The function is structured to attempt a fallback (continuity-based) but the fallback's `childCount: 0` would have been a valid response, so erroring is too strong.\n- **FLAW-2.5 — `findHierarchyEntry` uses `any` (`:62, :66`).** The function signature is `Record<string, any> | undefined` and `entry: any; parentId: string | null`. This bypasses the `ChildRef` type that is imported at `:18`. The intended type safety is lost. A test seam is not provided, so the function is unit-test uncovered by the type system.\n- **FLAW-2.6 — `readContinuity` is duplicated three times (this file, `session-context.ts:96`, and `delegation-status.ts:289-398`).** Three near-identical implementations of \"read a session, find it in its root's manifest, return a normalized record.\" They drift: this file at `:95-105` does NOT use `safeSessionPath` — it uses `resolved.continuityPath`. The other two do the same. But the `findHierarchyEntry` helper inside each is independently copy-pasted. A schema change to `HierarchyManifestChild` requires editing three places.\n\n---\n\n## 3. `src/tools/session/session-context.ts` (301 lines)\n\n### 3.1 Tool entry point\n\n- Factory: `createSessionContextTool(projectRoot: string)` at `:40`.\n- 4 actions via `tool.schema.enum` (`:45`).\n- Schema source: `SessionContextInputSchema` at `:14`.\n\n### 3.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `find-related` | `handleFindRelated` at `:144` | sessionId | maxRelated |\n| `cross-reference` | `handleCrossReference` at `:172` | sessionId | query |\n| `synthesize-context` | `handleSynthesizeContext` at `:200` | sessionId | — |\n| `aggregate` | `handleAggregate` at `:252` | (groupBy) | groupBy |\n\n### 3.3 Args schema\n\n```ts\nargs: {\n  action: enum[\"find-related\",\"cross-reference\",\"synthesize-context\",\"aggregate\"]\n  sessionId?: string  // optional at the schema level — required by some handlers\n  query?: string\n  maxRelated?: number\n  groupBy?: enum[\"subagentType\",\"status\"]\n}\n```\n\n### 3.4 Status values\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"unknown\"` | `:146, :200, :264` | Default for missing fields |\n| `\"unknown-subagent\"` | `:279` | Fallback for child records with no subagentType |\n| `\"opencode-session\"` | `:270` | Hard-coded label for every root session in aggregate-by-subagentType |\n| Real child statuses (from `child.subagentType` and `metaRecord.status`) | `:264, :279` | Read from project-continuity.json index |\n\n### 3.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `SessionContextInputSchema.parse` (`:53`) | `schema-kernel/session-tracker.schema.js` |\n| `readProjectIndex` (`:70`) | Reads `project-continuity.json` index (canonical session index) |\n| `resolveSessionFile` (`:97, :204`) | `src/tools/session/session-resolver.ts` |\n| `readContinuity` (`:96`) | Local function, duplicates `session-hierarchy.ts:78` and `delegation-status.ts:289` |\n| `findHierarchyEntry` (`:79`) | Local function, duplicates `session-hierarchy.ts:61` |\n| `safeSessionPath` (`:273`) | `src/features/session-tracker/persistence/atomic-write.js` |\n| `matter` from `gray-matter` (`:13, :210`) | frontmatter parser |\n| `readFile`, `readdir` from `node:fs/promises` (`:11`) | filesystem reads |\n\n### 3.6 Flaws\n\n- **FLAW-3.1 — `find-related` is heuristic-only and low-signal (`:144-169`).** Score = `sharedTools.length * 2 + (timeProximity ? 1 : 0)`. Two sessions that share NO tools are returned with score 0 only if they were created within 30 minutes of each other. Two sessions that share 5 tools but are 2 hours apart get score 10. There is no semantic or topical scoring. The function is O(N²) over all sessions in the index; for a 10,000-session project this is 100M comparisons with a single shared-tool object intersection. No parallelism, no short-circuit.\n- **FLAW-3.2 — `cross-reference` matches by `toolSummary` keys only (`:185-196`).** The comment at `:175` says \"query is a tool/agent name (e.g. 'bash', 'delegate')\". But the implementation matches by `t.toLowerCase().includes(searchQuery.toLowerCase())` on tool names. A query like \"hm-verifier\" (an agent name) will only match if some tool name CONTAINS that string — agent names and tool names are different namespaces. The cross-reference is effectively just \"search all tool summary keys for a substring.\"\n- **FLAW-3.3 — `cross-reference` is unbounded (`:194-196`).** `refs: refs.slice(0, 50)` caps the result, but the loop reads every session directory and every continuity JSON to compute matches. There is no pagination. For a project with thousands of sessions, this is slow.\n- **FLAW-3.4 — `synthesize-context` is markdown-only with no JSON alternative (`:200-249`).** Every other action supports `format: \"json\"`. This one returns only `{ sessionId, context: markdown }`. The JSON path in `handleGetSummary` (`:205`) and `handleExportSession` is not exposed here.\n- **FLAW-3.5 — `aggregate(subagentType)` overcounts (`:268-287`).** Every root session is counted as `\"opencode-session\"` at `:270`, then for each root session, every child in its manifest is counted under its `subagentType`. But a root session that is ALSO a child of another root session (multi-root scenario) will be counted twice: once as `\"opencode-session\"` and once as its real subagentType. The `for (const rootId of Object.keys(sessions))` loop iterates ALL sessions in the index, including those that are children of other roots. This produces an inflated count.\n- **FLAW-3.6 — `TIME_PROXIMITY_MS` is 30 minutes, hard-coded (`:38`).** This is a magic number, not configurable. A 45-minute gap will not register as \"related by time\" even though the user may want it to. No env override.\n- **FLAW-3.7 — `aggregate` mutates `counts` and returns sorted object (`:289-292`).** `Object.fromEntries(Object.entries(counts).sort(...))` is fine, but the sort comparator `(a, b) => b - a` works on numeric values; if any value is `undefined` or `NaN` the sort is unspecified. Since the incrementing pattern is `(counts[k] ?? 0) + 1`, values are always numbers. This is safe but fragile.\n- **FLAW-3.8 — `findHierarchyEntry` is duplicated from `session-hierarchy.ts` (`:79-93`).** Same `any` types, same recursion, same parent tracking. Three copies across the codebase (also in `session-hierarchy.ts` and `delegation-status.ts`). The drift risk is real.\n\n---\n\n## 4. `src/tools/session/session-delegation-query.ts` (284 lines)\n\n### 4.1 Tool entry point\n\n- Factory: `createSessionDelegationQueryTool(projectRoot: string)` at `:35`.\n- 2 actions: `list` and `get`.\n- Schema source: dynamic import at `:60` — `await import(\"../../schema-kernel/session-delegation-query.schema.js\")` is loaded inside `execute()` rather than at module top. See FLAW-4.1.\n- Module-doc at `:1-14` claims \"Does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory delegation state (REQ-P41E-03).\" This is a hard contract.\n\n### 4.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `list` | `handleList` at `:99` | (filters) | rootSessionId, status, agentType, delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore, offset, limit |\n| `get` | `handleGet` at `:167` | sessionId | — |\n\n### 4.3 Args schema\n\n```ts\nargs: {\n  action: enum[\"list\",\"get\"]\n  // list filters\n  rootSessionId?: string\n  status?: string\n  agentType?: string\n  delegatedBy?: string\n  minDepth?: number\n  maxDepth?: number\n  updatedAfter?: string\n  updatedBefore?: string\n  offset?: number    // default assumed\n  limit?: number\n  // get drill-down\n  sessionId?: string\n}\n```\n\n### 4.4 Status values\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"unknown\"` | `:134, :135` | Fallback for missing `child.subagentType` and `child.status` |\n| Canonical delegation statuses (from `HierarchyManifestChild.status`) | `:135` | Read directly from manifest, not validated against VALID_DELEGATION_STATUSES |\n\nThe `matchesFilters` helper at `:240-252` does exact equality match (`child.status !== filters.status`). If a consumer passes `\"active\"` (which is NOT a valid `DelegationStatus`) they will match NO children, because the manifest stores `\"dispatched\"` or `\"running\"`, never `\"active\"`. This is a silent mismatch — see FLAW-4.2.\n\n### 4.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `await import(\"...session-delegation-query.schema\")` (`:60`) | Dynamic Zod schema import |\n| `safeSessionPath` (`:121`) | hierarchy-manifest.json path construction |\n| `resolveSessionFile` (`:172`) | child .json resolution for `get` action |\n| `isValidSessionID` (`:117, :168`) | sessionId validation |\n| `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord` types | `src/features/session-tracker/types.js` |\n| `readFile`, `readdir` from `node:fs/promises` (`:17`) | filesystem reads |\n| `join` from `node:path` (`:18`) | project-continuity.json path |\n\n### 4.6 Flaws\n\n- **FLAW-4.1 — Dynamic Zod import inside `execute()` (`:60`).** `await import(\"...schema.js\")` runs every time the tool is invoked. This adds latency to every call and makes the tool's behavior dependent on the schema module being lazy-loadable. The other 8 tools in this audit import their schemas statically at module top. The reason given (the comment says \"Dynamic parse: Zod discriminatedUnion validates shape per action\") is implementation detail, not a justification for a dynamic import. A static import is just as capable of running `discriminatedUnion.parse()` per call.\n- **FLAW-4.2 — `list` silently filters out everything when consumer uses non-canonical status (`:241`).** A consumer reading `delegation-status` output (which uses `DelegationStatus`: `dispatched, running, completed, error, timeout, aborted, cancelled`) will pass `status: \"dispatched\"`. That works. But a consumer reading `session-tracker` output (which uses `\"active\"`) will pass `status: \"active\"` and get zero results. The `list` action accepts any string and does exact match — there is no mapping layer.\n- **FLAW-4.3 — `list` has no default `offset` or `limit` (`:152`).** `allDelegations.slice(input.offset, input.offset + input.limit)` will produce `[]` if either is `undefined`. The default in the Zod schema is not visible in the file (relies on the schema module). The handler does not guard.\n- **FLAW-4.4 — `get` truncates `lastMessage` to 500 chars silently (`:221`).** `record.lastMessage?.slice(0, 500)`. There is no `truncated: true` flag in the response, so consumers cannot tell if the message was full or cut. `export-session` returns the full content; `get` returns a clipped excerpt. A consumer who wants the full message must call `export-session`.\n- **FLAW-4.5 — `get` is dependent on `resolveSessionFile` succeeding, but if the child record has been moved/archived, the tool reports \"not found in any hierarchy-manifest\" (`:174-176`).** This is a generic error that does not help the consumer distinguish \"child was never created\" from \"child was archived\" from \"manifest is corrupt.\" The error also instructs the user to \"Try 'list' to discover available sessions\" — but the user already has a sessionId, suggesting the user knows what they are looking for. The error message is unhelpful.\n- **FLAW-4.6 — Sort by `updatedAt` may fail for empty strings (`:149`).** `b.updatedAt.localeCompare(a.updatedAt)` — if `updatedAt` is `\"\"` (which is the case when `child.updatedAt` is missing per `:139`), all empty strings sort to the front (or back, locale-dependent). The sort is unstable. A `delegations.sort` after collecting all entries means a pagination request may see different orderings across calls if manifests update mid-pagination.\n- **FLAW-4.7 — Pagination is offset-based on an unbounded collection (`:151-152, :159`).** `offset: input.offset, limit: input.limit` is the interface, but the entire `allDelegations` array is materialized before slicing. There is no streaming, no cursor. For a project with thousands of delegations, every call materializes the full list. Memory is the limit, not the pagination semantics.\n- **FLAW-4.8 — `discoverRootSessions` is duplicated (`:263-284`).** Same pattern as in `session-tracker.ts:236-275` (read project-continuity.json, fall back to directory scan). The two implementations are similar enough that one is likely a refactor of the other. They should share a helper.\n- **FLAW-4.9 — `MAX_TOTAL_RESULTS = 1000` is undocumented (`:97`).** The constant is set silently. If a consumer's `offset + limit > 1000`, they will get fewer results than expected with no error or warning. The constant is internal, not surfaced in args or response.\n\n---\n\n## 5. `src/tools/hivemind/hivemind-session-view.ts` (155 lines)\n\n### 5.1 Tool entry point\n\n- Factory: `createHivemindSessionViewTool(projectRoot: string)` at `:26`.\n- Single action: `get` (via `tool.schema.enum([\"get\"])` at `:35`).\n- Schema source: `SessionViewInputSchema` at `:13`.\n- Tool-context: `{ sessionID?: string }` (note: NO `agent` field — see FLAW-5.1).\n\n### 5.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `get` | `buildUnifiedView` at `:119` | sessionId | — |\n\n### 5.3 Args schema\n\n```ts\nargs: {\n  action: enum[\"get\"]\n  sessionId: string\n}\n```\n\n### 5.4 Status values\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"unknown\"` | `:136` | Fallback for missing `session.status` |\n| `\"running\"`, `\"dispatched\"` | `:149` | Used to compute the `active` count in `delegations.active` |\n| Real child/root statuses (from `childRecord.status`, `manifest.children[*].status`) | `:74-86` | Read for delegation list |\n\n### 5.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `SessionViewInputSchema.parse` (`:40`) | `schema-kernel/session-view.schema.js` |\n| `resolveSessionFile` (`:56, :72`) | `src/tools/session/session-resolver.ts` |\n| `readFile` from `node:fs/promises` (`:11`) | manifest, continuity, delegations.json, trajectory-ledger.json reads |\n| `resolve` from `node:path` (`:12`) | `.hivemind/state/delegations.json` and `.hivemind/state/trajectory-ledger.json` (NOT under session-tracker root — see FLAW-5.2) |\n| `Promise.all` (`:120-123`) | Concurrent fetch from 3 data roots |\n\n### 5.6 Flaws\n\n- **FLAW-5.1 — `ToolContext` does not include `agent` (`:18`).** Other tools (`tmux-copilot.ts:190`, `tmux-state-query.ts:85`, `delegation-status.ts:47`) have `{ sessionID?: string; agent?: string }`. This tool only has `sessionID`. If a future revision wants to add an `agent`-based filter (e.g., \"show me all delegations from `build`\"), the type will need to be widened.\n- **FLAW-5.2 — Mixed path authority (`:94, :107`).** `delegations.json` and `trajectory-ledger.json` are read from `resolve(projectRoot, \".hivemind\", \"state\", ...)`. This is the canonical Q6 state root. The session-tracker data is read from `safeSessionPath` (via resolver). The two roots are different — there is no `safeStatePath` helper for the `.hivemind/state/` writes/reads. If `.hivemind/state/` moves (per `OPENCODE_HARNESS_STATE_DIR` env var), this tool will not respect the override, while `delegation-status.ts:470` DOES respect it. See FLAW-5.3.\n- **FLAW-5.3 — Ignores `OPENCODE_HARNESS_STATE_DIR` (`:94, :107`).** `delegation-status.ts:470` derives projectRoot from `process.env.OPENCODE_HARNESS_STATE_DIR` if set. This tool does not. So a runtime with a non-default state dir will return `{ delegations: [], trajectory: null }` even when the files exist elsewhere. This is an undocumented env-var coupling.\n- **FLAW-5.4 — `readDelegationsForSession` filters by parentSessionID only for main sessions (`:75-80`).** For main sessions, the filter is `(meta as Record<string, unknown>).parentSessionID === sessionId`. But `sessionId` for a main session IS its own root, and a root is not the parent of any of its children (children have `parentSessionID` pointing to the parent of the child, which may be the root or another child). The filter at `:79` will return children whose `parentSessionID === rootSessionId`, which is only the FIRST level of children. A root with grandchildren will report only its direct children in this view, missing the deeper tree.\n- **FLAW-5.5 — `readDelegationsForSession` uses `childSessionId` OR `id` for the legacy fallback filter (`:99`).** A delegation record in `delegations.json` uses `id` (which equals `childSessionId` in the canonical case, but may diverge in legacy records). The OR-mask is correct as a safety, but the comment at `:97-98` says \"delegations may use childSessionId or parentSessionId\" — but the code only checks `childSessionId`, not `parentSessionId`. The comment is wrong.\n- **FLAW-5.6 — `readTrajectoryForSession` filters by `rootSessionId` OR `sessionId` (`:111-112`).** A trajectory record with `rootSessionId` set to a parent root is returned for the CHILD sessionId request. This means a child query returns its root's trajectory. The semantic depends on whether the trajectory record was written for the root or the child. The contract is unclear; consumers must inspect `entries[*].rootSessionId` to disambiguate.\n- **FLAW-5.7 — `slice(0, 20)` and `slice(0, 50)` are hard-coded caps (`:81, :100, :114`).** No `limit` arg exists. A session with 200 delegations in its tree will return the first 20 with no `hasMore` flag. A trajectory with 5000 events will return the first 50. The tool looks \"complete\" but is lossy.\n- **FLAW-5.8 — `Promise.all` does not short-circuit on first error (`:120-123`).** If `readSessionData` throws (it doesn't currently, but it could), the entire `Promise.all` rejects, and the catch at `:46` returns the error message. The other two data sources (delegations, trajectory) are lost. A `Promise.allSettled` would be more graceful.\n- **FLAW-5.9 — `_note` field in `delegation-status.get` (`:232`)** — wait, that is in delegation-status, not this file. The `hivemind-session-view.get` has no analogous note. The behavior is silent truncation.\n\n---\n\n## 6. `src/tools/tmux-copilot.ts` (563 lines)\n\n### 6.1 Tool entry point\n\n- Constant export: `tmuxCopilotTool: ReturnType<typeof tool>` at `:198` — this is a constant, not a factory. Compare with `createSessionTrackerTool(projectRoot)` and `createDelegationStatusTool(manager, deps)`. The tmux tool is parameterized via the bridge (`setSessionManagerAdapter`) rather than a factory closure.\n- Zod schema: 9-action discriminated union at `:152-162`.\n- 4 actions at module top, then P58 added 4 more (forward-prompt, take-over, release, peek), then P59 added peek-by-session.\n- Module doc at `:1-31` documents the full phase history (Phase 43 → 51 → 58 → 58.8 → 59).\n\n### 6.2 Actions (full set)\n\n| Action | Schema line | Handler line | Status values returned |\n|--------|-------------|--------------|-----------------------|\n| `send-keys` | `:83-88` | `:250-261` | `{ sent: true }` / `{ sent: false, error: { message } }` |\n| `list-panes` | `:90-93` | `:262-286` | `{ panes: PaneState[] }` / `{ available: false, reason: \"tmux-not-installed\" \\| \"tmux-timeout\" \\| \"tmux-error\", error: { message } }` |\n| `compute-grid` | `:95-98` | `:287-290` | `{ commands: SplitCommand[] }` |\n| `respawn` | `:100-103` | `:291-300` | `{ respawned: true, paneId }` / `{ respawned: false, error: { reason: \"session-not-closed\" } }` |\n| `forward-prompt` | `:106-111` | `:301-348` | `{ paneId, deliveredAt, byteLength }` / `{ suppressed: true, reason: \"manualOverride\" \\| \"session-not-found\", paneId, textPreview, evaluatedAt }` / `{ sent: false, error }` |\n| `take-over` | `:118-124` | `:349-385` | `{ sessionId, paneId, takenBy, takenAt, promptDelivered, promptMode, promptError? }` |\n| `release` | `:127-130` | `:386-393` | `{ sessionId, releasedAt }` |\n| `peek` | `:133-141` | `:394-432` | `{ paneId, format, content, capturedAt, byteLength }` (raw mode) / `{ paneId, format, activity: {...} }` (summary mode) / `{ paneId, format, activity: { note: \"No session registered...\" } }` |\n| `peek-by-session` | `:145-150` | `:433-464` | Same as peek, but with `sessionId` field and `paneId` resolved internally |\n\n### 6.3 Args schema (framework-side, `:210-219`)\n\n```ts\nargs: {\n  action: string\n  paneId?: string\n  text?: string\n  literal?: boolean\n  mainPaneId?: string\n  tree?: unknown  // PaneTreeNode recursive\n  sessionId?: string\n  maxBytes?: number\n}\n```\n\nNote that this is a structural hint; the canonical Zod parse happens inside `execute()` via `TmuxCopilotActionSchema.safeParse` (`:234`).\n\n### 6.4 Permission gate (P59 R1, `:67-71, :221-231`)\n\n- **No agent-name check.** Every agent (including `build`, `hm-executor`, gsd-debugger, the `user` agent, and the `__user__` agent) can call any action.\n- The only denial is `!callerAgent` at `:227`, which returns `{ error: { kind: \"permission-denied\", agent: \"unknown\" } }`.\n- The `:67-71` comment block documents the P59 R1 decision explicitly: \"Tier-based agent-name restrictions removed in P59 R1.\"\n- This is a SECURITY-DEFINING change documented in source. The risk is that any future agent (even one running untrusted user code) can `send-keys` to a tmux pane if it has the tool loaded. See FLAW-6.1.\n\n### 6.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `getSessionManagerAdapter` (`:243`) | `src/features/tmux/types.ts` — returns null if not wired |\n| `setSessionManagerAdapter` (via `__setTmuxMultiplexerForTesting` at `:562`) | Same module — test seam |\n| `getManualOverrideState`, `setManualOverrideState` (`:42, :320, :354, :388`) | `src/features/session-tracker/index.ts` |\n| `resolveSessionToPaneId`, `getSendPrompt`, `getSessionMessagesFetcher`, `getSessionPaneRegistryEntries` (`:43, :363, :416, :436, :478`) | `src/features/tmux/types.ts` |\n| `renderToolResult` (`:41, :226, :228, :236, :244, :253, :262, :275, :278, :281, :289, :294, :299, :322, :336, :343, :378, :389, :403, :419, :440, :449, :481, :520`) | `src/shared/tool-helpers.js` |\n| `Buffer.byteLength` (`:333, :402, :448`) | Node.js stdlib |\n\n### 6.6 Flaws\n\n- **FLAW-6.1 — Permission gate is now advisory only (P59 R1).** The comment at `:67-71` declares the previous tier system \"removed.\" A null `agent` is the only failure. If the OpenCode runtime ever instantiates this tool with a `context` that lacks `agent`, the tool refuses. But ANY agent name in `context.agent` is allowed, including `\"untrusted-eval-target\"` or arbitrary user-provided strings. There is no allowlist or denylist. The export `REQUIRES_PERMISSIONS` mentioned in the module doc (`:1-31`) is no longer defined — the comment block at `:11-12` says it WAS exported but the file no longer has that export. The mitigation has been removed without a replacement.\n- **FLAW-6.2 — `forward-prompt` writes the timestamp sentinel into the pane (`:331-332`).** The `[orchestrator-forward <ISO>]` prefix is prepended to every forwarded prompt. This sentinel \"contaminates the delegate's transcript with an automation-source marker\" (per the comment at `:309-310`). There is no way to opt out. The sentinel is hard-coded.\n- **FLAW-6.3 — `take-over` always sets `takenBy: \"human-operator\"` (`:357, :381`).** The schema accepts any caller via the agent check at `:227`, and `setManualOverrideState` is called with `takenBy: \"human-operator\"` regardless of the actual caller. If an automated agent (e.g., a CI runner that happens to have this tool loaded) takes over, the audit record says \"human-operator.\" The caller identity is not recorded. The session-tracker downstream cannot tell whether a human or an agent took over.\n- **FLAW-6.4 — `take-over` injects a prompt via the module-level `sendPrompt` function (`:365-372`).** `getSendPrompt()` is wired from `plugin.ts`. If it is not wired, `promptError: \"sendPrompt not wired\"` is returned (`:374`), but `setManualOverrideState` is still set to `manualOverride: true` (`:354`). The take-over succeeds even when the prompt injection fails. The caller has to inspect `promptError` to know the prompt was lost.\n- **FLAW-6.5 — `peek` summary heuristic is fragile (`:494-519`).** \"files\" is computed by inspecting `t.args` for any string that contains `/` or `.`. This matches ANY tool argument that has a path-looking string, including false positives like a tool message that includes a URL `\"https://example.com/foo\"`. The \"files touched\" set is a heuristic, not a real file-list diff.\n- **FLAW-6.6 — `peek` returns a default-formatted note when no session is registered (`:419-429`).** The note `\"No session registered for this paneId. Use peek-by-session if you have a sessionId.\"` is included in the `activity` field. Consumers parsing `activity` programmatically will get a `note` string mixed with structured data. The `note` field is not documented in `TmuxCopilotResult` (`:168-184`).\n- **FLAW-6.7 — `peek` summary mode is async but `peek` raw mode is sync (`:399-412`).** Raw mode calls `adapter.getLatestCapture?.(input.paneId)` directly. If the adapter is async-only, this will block. The `?.` optional-chaining suggests the adapter interface is still in flux.\n- **FLAW-6.8 — `list-panes` error classification is heuristic (`:271-279`).** `code === \"ENOENT\"` and `/enoent/i.test(message)` are matched. But Node.js does not always set `code = \"ENOENT\"` for tmux installation issues — sometimes the failure is a `spawn` error without a code. The string match is a fallback. A tmux-not-installed error from a custom build of tmux with a different error message would be classified as a generic `tmux-error`.\n- **FLAW-6.9 — `respawn` returns `{respawned: false, error: {reason: \"session-not-closed\"}}` but does not surface WHY the session is not closed (`:293-298`).** The user gets a reason but no diagnostic. If the session is closed but the manifest is stale, the user has no way to know.\n- **FLAW-6.10 — `peek-by-session` resolves via `resolveSessionToPaneId` (`:436`).** If the resolution fails, the error envelope is `{error: {kind: \"invalid-input\", issues: [{code: \"custom\", message: \"...\"}]}}` at `:439-443`. But the `issues` field is typed as `z.ZodIssue[]` (`:441`), and the issue is constructed with `as unknown as z.ZodIssue` (`:442`). This is a type lie — the issue is not a real `ZodIssue`, just a structurally similar object.\n- **FLAW-6.11 — `buildSessionSummary` returns an empty `activity.toolCallCount: 0` when fetcher is unwired (`:486-491`).** The `toolCallCount` field is documented in `activity` but is missing in the unwired-fetcher branch (only `messageCount: 0, toolCalls: [], lastAssistantMessage: null, files: []` — no `toolCallCount`). Consumers expecting the same shape across wired/unwired states will get an undefined field.\n- **FLAW-6.12 — `tmuxCopilotTool` is module-level state (`:198`).** There is no factory function, so the tool is shared across all consumers that import it. If two plugins want different adapters, they conflict. Compare with `createSessionTrackerTool(projectRoot)` which produces per-call instances.\n- **FLAW-6.13 — Hard-coded text slice on forward-prompt (`:326`).** `textPreview: input.text.slice(0, 80)` is fixed at 80 chars. The schema does not allow overriding the preview length. If a consumer wants a longer or shorter preview, they cannot.\n- **FLAW-6.14 — `peek-by-session` raw mode slices `input.maxBytes` from the END (`:453-455`).** `input.maxBytes && sessionContent.length > input.maxBytes ? sessionContent.slice(-input.maxBytes) : sessionContent`. This is a \"tail\" slice, not a \"head\" slice. The peek action in `delegation-status.ts:855-857` does the same. But raw `peek` at `:399-411` does NOT slice at all — it returns the full content. Three peek implementations, three truncation semantics. Inconsistent.\n\n---\n\n## 7. `src/tools/tmux-state-query.ts` (162 lines)\n\n### 7.1 Tool entry point\n\n- Constant export: `tmuxStateQueryTool: ReturnType<typeof tool>` at `:99`.\n- 3 actions via Zod discriminated union (`:63-67`).\n- Module doc at `:1-16` describes the tool as \"read-only session metadata\" with \"permission-gated: only orchestrator-tier agents may invoke.\" But the implementation at `:26-27` says \"Agent-name permission gate removed in P59 R1 — all agents allowed.\" This is a documentation drift (FLAW-7.1).\n\n### 7.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `list-sessions` | inline at `:136-142` | — | — |\n| `get-session` | inline at `:144-150` | — | sessionId |\n| `get-summary` | inline at `:152-159` | — | — |\n\n### 7.3 Args schema\n\n```ts\nargs: {\n  action: enum[\"list-sessions\",\"get-session\",\"get-summary\"]\n  sessionId?: string\n}\n```\n\n### 7.4 Status values (none of substance)\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"tmux-not-wired\"` | `:131` | Returned when adapter is null |\n| `{error: {kind: \"invalid-input\", issues}}` | `:123` | Zod parse failure |\n| `{error: {kind: \"permission-denied\", agent}}` | declared in `TmuxStateQueryResult` at `:76` but never returned | Dead code (see FLAW-7.2) |\n| `{sessions: []}`, `{session: null}`, `{summary: {total: 0, active: 0, spawning: 0}}` | `:142, :150, :158` | All return zero/empty data — the tool is a no-op stub |\n\n### 7.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `getSessionManagerAdapter` (`:129`) | `src/features/tmux/types.ts` |\n| `renderToolResult` (`:20`) | `src/shared/tool-helpers.js` |\n\nThat is the complete integration surface. The tool is a single dependency on the adapter, which is the only way to get real session data — and the adapter does not expose session enumeration. So the tool returns empty results by design (per comments at `:137-141, :145-149, :152-156`).\n\n### 7.6 Flaws\n\n- **FLAW-7.1 — Module doc lies about permission model (`:1-16`).** Doc says \"Permission-gated: only orchestrator-tier agents may invoke.\" Code comment at `:26-27` says the gate was removed. Consumers reading the doc will assume a gate exists; the actual behavior is \"all agents allowed.\" The doc was not updated when the gate was removed in P59 R1.\n- **FLAW-7.2 — `permission-denied` is in the result union but never returned (`:76, `:99-161`).** `TmuxStateQueryResult` includes `{ error: { kind: \"permission-denied\"; agent: string } }` (`:76`). The handler at `:113-160` never constructs or returns this. The `agent` field is `_context.agent` discarded. The type union advertises a behavior the implementation does not provide.\n- **FLAW-7.3 — All three actions return empty data (`:142, :150, :158`).** The comments at `:137-141, :145-149, :152-156` admit the adapter does not expose session enumeration, list, or summary. The tool is a documented facade that returns zero data. A consumer calling `tmux-state-query` for live data is misled by the description: \"Read-only session metadata query ... Returns tracked session information.\" The information returned is `[]`, `null`, and `{total: 0, active: 0, spawning: 0}`.\n- **FLAW-7.4 — `SessionSummary` type is exported but never constructed (`:37-44, :99-161`).** The interface at `:37-44` has fields: `sessionId, agent, delegationId, paneId, directory, spawnTime`. None of the action handlers create or return a `SessionSummary`. The exported type is unused except as documentation.\n- **FLAW-7.5 — `get-session` accepts `sessionId` but the type is optional (`:54-57`).** Schema says `sessionId: z.string().min(1).optional()`. If absent, the action returns `{session: null}`. But the user provided no argument, so the meaning is unclear. A user requesting `get-session` without a `sessionId` is calling the action wrong; the action should refuse, not return `null`.\n- **FLAW-7.6 — `tmuxStateQueryToolName` export is unused (`:91`).** `export const tmuxStateQueryToolName = \"tmux-state-query\"`. There is no consumer in the file. There is a similar `tmuxCopilotTool` constant. The `ToolName` export pattern is not used by any consumer. It is a code smell.\n- **FLAW-7.7 — No factory pattern (`:99`).** Like `tmux-copilot.ts`, the tool is a module-level constant. The single `getSessionManagerAdapter()` lookup happens at execute-time, so the tool is \"late-bound\" to the adapter. This means the tool cannot be instantiated with a different adapter for testing — there is no `__setTmuxMultiplexerForTesting` equivalent. Tests must use the global adapter.\n\n---\n\n## 8. `src/tools/delegation/delegate-task.ts` (110 lines)\n\n### 8.1 Tool entry point\n\n- Factory: `createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } })` at `:27`.\n- Single action (execute).\n- Schema source: local `DelegateTaskV2Schema` at `:10-15` (NOT imported from schema-kernel — see FLAW-8.1).\n\n### 8.2 Actions\n\nSingle implicit action: `execute` — dispatch via `coordinator.dispatch` at `:79-87`.\n\n### 8.3 Args schema\n\n```ts\nargs: {\n  agent: string\n  prompt: string\n  context?: string\n  stackOnSessionId?: string\n}\n```\n\n### 8.4 Status values (result envelope)\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `\"error\"` | `:89` | coordinator returned error |\n| `\"timeout\"` | `:89` | coordinator returned timeout |\n| (other statuses from coordinator) | implicit | The result is spread into the response, so the coordinator's status flows through |\n\n### 8.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `coordinator.dispatch` (`:79-87`) | `CoordinatorLike` interface — wraps `src/coordination/delegation/coordinator.ts` (real) or test seam |\n| `config.delegation_systems.delegate_task === false` (`:51-53`) | Honor system-level disable flag |\n| `context.sessionID` (`:55`) | OpenCode framework context (caller's session) |\n| `context.directory ?? context.worktree` (`:86`) | OpenCode framework working directory |\n\n### 8.6 Flaws\n\n- **FLAW-8.1 — Local Zod schema, not from schema-kernel (`:10-15`).** The comment at `:6-9` says \"This tool MUST route via coordinator.dispatch only.\" The local schema is minimal (4 fields). Compare with `delegation-status.ts:34-44` which uses `DelegationStatusInputSchema` from a schema-kernel module. The discrepancy is consistent with this tool's relative simplicity but means a future schema-kernel refactor will need to update this file separately.\n- **FLAW-8.2 — `context` is overloaded (3 meanings) (`:62-75`).**\n  1. If `stackOnSessionId` is set, `context` is IGNORED entirely (the `else if` branch is not reached).\n  2. If `context` parses as JSON with `{parentSessionId: \"ses_xxx\"}`, the `parentSessionId` is extracted, the rest of the JSON is prepended to `prompt`, and the `parentSessionId` field is removed.\n  3. If `context` does not parse as JSON (or parses but has no `parentSessionId`), it is prepended to `prompt` as free-text.\n  \n  Three behaviors, no docs in the args schema, the `context` arg description at `:43` says \"Legacy stacking: pass JSON `{\\\"parentSessionId\\\": \\\"ses_xxx\\\"}`. Otherwise treated as free-text prepended to prompt.\" The first behavior (ignore `context` when `stackOnSessionId` is set) is NOT mentioned in the description. A user passing BOTH `stackOnSessionId` and a JSON `context` will be surprised that `context` is silently dropped.\n- **FLAW-8.3 — Coordinator interface is `any` (`:17-19`).** `interface CoordinatorLike { dispatch(params: Record<string, unknown>): Promise<unknown> }`. The real `DelegationCoordinator.dispatch` has a typed signature with `agent, currentDepth, parentSessionId, prompt, queueKey, surface, workingDirectory, model` (per `01-tools-surface.md:19`). The `Record<string, unknown>` type loses all of this. A typo in the call site at `:79-87` (e.g., `parentSessoinId` misspelled) will be silently accepted and the coordinator will see `undefined` for the real field.\n- **FLAW-8.4 — Config gate is a graceful error, not a denial (`:51-53`).** When `config.delegation_systems.delegate_task === false`, the tool returns an error envelope. But the agent (caller) does not know that the tool is disabled until they call it. There is no \"tool not exposed\" mechanism at the OpenCode plugin layer. The error is informative but late.\n- **FLAW-8.5 — `queueKey: \"agent:${args.agent}\"` (`:84`).** The queue key is hard-coded to a single string per agent name. Two concurrent delegations to the same agent with different prompts will serialize on the same queue. The tool description at `:32-39` says \"WaiterModel\" semantics (true-fire-and-forget). The queue key is a serialization point that contradicts fire-and-forget. See FLAW-8.6.\n- **FLAW-8.6 — `currentDepth: 0` is hard-coded (`:81`).** The depth is passed to the coordinator as 0. The coordinator will increment it via its own tracking. But this means a caller cannot pass an explicit depth — the tool ignores any depth that the caller's session-tracker knows. A nested delegation that already knows its depth will be reported as depth 0 to the coordinator, which then increments based on its own internal counter. There are two depth-tracking systems: the caller knows one, the coordinator knows another. They will drift if the caller's view is wrong.\n- **FLAW-8.7 — `surface: \"agent-delegation\"` is the only surface (`:85`).** This is hard-coded. There is no `args.surface` option. A consumer that wants to dispatch via a different surface (e.g., `\"code-review\"`, `\"data-analysis\"`) must not use this tool — they have to use the coordinator directly. The tool description does not mention this constraint.\n- **FLAW-8.8 — The `asRecord` helper is unsafe (`:105-107`).** `value && typeof value === \"object\" ? value as Record<string, unknown> : { result: value }`. If the coordinator returns `null`, `value && ...` short-circuits to `null`, and `asRecord(null)` is `{ result: null }`. But if the coordinator returns `0` or `\"\"` or `false`, `value && ...` short-circuits to `0`/`\"\"`/`false`, and `asRecord(0)` is `{ result: 0 }`. The result has the correct value but the wrapping `{ result: ... }` is misleading.\n- **FLAW-8.9 — The config flag is `config.delegation_systems.delegate_task`, but the type is `boolean` (`:27`).** There is no doc explaining the difference between `undefined`, `false`, and `true`. The check at `:51` is `=== false`, so `undefined` means \"enabled by default.\" This is a sensible default but undocumented.\n- **FLAW-8.10 — No `sessionId` in args, only `stackOnSessionId` (`:40-45`).** A user who wants to specify which session this delegation \"belongs to\" (for tracking purposes) must use `stackOnSessionId`. There is no separate \"track this delegation under session X\" arg. The conflation of \"stack\" and \"track\" is implicit.\n\n---\n\n## 9. `src/tools/delegation/delegation-status.ts` (906 lines)\n\n### 9.1 Tool entry point\n\n- Factory: `createDelegationStatusTool(delegationManager: ManagerLike, deps: StatusDeps = {})` at `:464`.\n- 8 actions: `status` (default), `get`, `list`, `control`, `find-stackable`, `pool`, `peek`, `progress` — declared in the Zod enum at `:37` and dispatched at `:502-520`.\n- Schema source: `DelegationStatusInputSchema` (local) at `:34-44`, plus `DelegationControlSchema` at `:24-32`.\n- Tool-context: `{ sessionID?: string }` at `:47` (no `agent` field — see FLAW-9.1).\n\n### 9.2 Actions\n\n| Action | Handler | Required | Optional |\n|--------|---------|----------|----------|\n| `status` (default) | falls through to `renderList` (`:645`) | — | delegationId, status, action (override) |\n| `get` | falls through to `renderList` if no delegationId, or the inline status branch (`:522-643`) | — | delegationId, status |\n| `list` | `renderList` at `:654` | — | status |\n| `control` | `handleControl` at `:693` | delegationId, control | — |\n| `find-stackable` | `handleFindStackable` at `:765` | — | agentFilter |\n| `pool` | inline at `:514-520` | — | — |\n| `peek` | `handlePeek` at `:835` | paneId OR delegationId | maxBytes |\n| `progress` | `handleProgress` at `:875` | delegationId | — |\n\n### 9.3 Args schema\n\n```ts\nargs: {\n  delegationId?: string\n  status?: string\n  action?: enum[\"status\",\"get\",\"list\",\"control\",\"find-stackable\",\"pool\",\"peek\",\"progress\"]  // default \"status\"\n  control?: { action: enum[...]; chainParentSessionId?, restartPrompt?, agent? }  // nested\n  agentFilter?: string\n  paneId?: string\n  maxBytes?: number\n}\n```\n\nThe `args` schema at the framework level (`:478-486`) types `control: s.object({}).optional().describe(\"Control action payload\")` — a generic `object` rather than a refined `DelegationControlSchema`. See FLAW-9.2.\n\n### 9.4 Status values\n\n| Status | Where | Notes |\n|--------|-------|-------|\n| `VALID_DELEGATION_STATUSES = {dispatched, running, completed, error, timeout, aborted, cancelled}` | `:134` | The canonical set |\n| `validateDelegationStatus` (`:137-140`) | — | Returns `\"running\"` as fallback for unknown |\n| `Delegation.terminalKind` includes `completed, error, timeout, cancelled, restarted, runtime-dispatch-unsupported, interrupted-by-signal, non-resumable-after-restart` | type import at `:10` | Read for terminal output |\n| `isTerminal = completed \\| error \\| timeout` | `:81, :616, :711` | Used for control-flow gating |\n| `lifecycle.isTerminal` (deps) | `:60` | External terminal detection |\n\n### 9.5 Integration points\n\n| Call | Target |\n|------|--------|\n| `readPersistedDelegations` (`:6, :469`) | `src/task-management/continuity/delegation-persistence.ts` |\n| `redactTextSecrets` (`:7, :87, :88, :96, :106, :631, :634`) | `src/shared/security/redaction.js` |\n| `resolveSessionFile` (`:11, :144, :212, :266, :267, :596`) | `src/tools/session/session-resolver.ts` |\n| `safeSessionPath` (`:12, :197`) | `src/features/session-tracker/persistence/atomic-write.js` |\n| `HierarchyManifest` types (`:13`) | `src/features/session-tracker/types.js` |\n| `findStackableSessions`, `findResumableSessions`, `getRetryRecommendation`, `buildStackingGuidanceBanner` (`:14, :668, :669, :670, :617, :782, :783, :784`) | `src/coordination/delegation/session-intelligence.ts` |\n| `HierarchyManifestChildSchema`, `HierarchyManifestChildValidated` (`:15, :221, :313, :328, :343, :356`) | `./readers/types.js` |\n| `delegationManager.getStatus`, `getAllDelegations`, `canSessionAccessDelegation`, `controlDelegation`, `getPoolSnapshot` (delegated through `ManagerLike`) | `src/coordination/delegation/manager.ts` |\n| `coordinator.dispatch` (deps) | `src/coordination/delegation/coordinator.ts` |\n| `deps.getChildMessageCount`, `getEscalationLevel`, `lifecycle.markAborted/markCancelled`, `terminateChild`, `getPaneContent`, `getLastChildEvent` | All injected by the plugin |\n| `process.env.OPENCODE_HARNESS_STATE_DIR` (`:470, :655, :695, :772`) | Env-var coupling for state-dir override |\n\n### 9.6 Flaws\n\n- **FLAW-9.1 — `ToolContext` does not include `agent` (`:47`).** Like `hivemind-session-view.ts`, the context is just `{ sessionID?: string }`. If the framework injects an `agent` field, this tool discards it. Permission-gating by agent (which the comment block at `:27-28` of `tmux-copilot.ts` suggests was once considered) cannot be done here without a type change.\n- **FLAW-9.2 — `args.control` is typed as a plain `object` (`:482`).** The framework-side schema is `s.object({}).optional()`. The refined Zod validation is `DelegationControlSchema` (`:24-32`) but that is applied at runtime in the execute function via... actually, no, the inner refinement is applied via `safeParse` of the whole `DelegationStatusInputSchema` (`:494`). So the framework-side `s.object({})` is a placeholder; the real validation happens via Zod. But the type info is lost. Tools that surface a JSON schema for the agent will not see the refined control structure.\n- **FLAW-9.3 — `manifestCache` is global and shared across calls (`:19-21, :200-205`).** Keyed by `${projectRoot}::${rootSessionId}`. TTL 5 seconds. Max 10 entries. The cache is per-process and is cleared at the start of every execute call at `:492`. So the cache is effectively useless — it gets cleared on every call. The author likely meant to clear at end-of-call or not at all, but the intent is unclear. The eviction policy at `:201-204` is \"oldest entry\" but Map iteration order is insertion order, so this is \"first inserted\" not \"least recently used.\" A LRU would need a different data structure.\n- **FLAW-9.4 — `validateDelegationStatus` silently maps unknown to `\"running\"` (`:137-140`).** An unknown status from a malformed child record is treated as \"non-terminal, currently running.\" This means a corrupted record with `status: \"garbage\"` will appear as a live, in-progress delegation. The user will think the agent is still working when it is actually in an undefined state. The safer default would be `\"error\"`.\n- **FLAW-9.5 — `mergeAllDelegations` re-maps active delegations to \"cancelled\" (`:443-451`).** When a delegation is found in persistence or session-tracker but not in the manager's in-memory map, its status is set to \"cancelled\" if it was \"dispatched\" or \"running.\" This is the right behavior for \"the manager doesn't know about it anymore, so it's not actually running.\" But the user has no way to distinguish a \"cancelled because manager forgot\" from a \"cancelled because user explicitly cancelled\" — the `explicitCancellation` flag is set in the manager but not in the merged record.\n- **FLAW-9.6 — `getSessionTrackerDelegation` always sets `recoveryGuarantee: \"resumable\"` (`:171`).** The session-tracker data does not carry a `recoveryGuarantee` field. The handler hard-codes it. A child session that was explicitly non-resumable (e.g., PTY session that died) will be reported as resumable if the session-tracker record exists. The truth is in `terminalKind: \"non-resumable-after-restart\"`, which IS preserved at `:177`. So the two fields can conflict.\n- **FLAW-9.7 — `renderDelegation` always sets `resume` field for terminal delegations (`:109`).** `resume: isTerminal ? { childSessionId: delegation.childSessionId, mode: \"continue-child-session\" } : undefined`. This implies ALL terminal delegations are resumable. But `terminalKind: \"non-resumable-after-restart\"` exists for a reason. The `resume` field should be `undefined` for non-resumable terminal kinds.\n- **FLAW-9.8 — `getHierarchyContext` O(N²) cycle detection (`:341-360`).** For every child in the manifest, it walks the parent chain up to the root. With M children and average depth D, this is O(M × D). The `visited: Set<string>()` per child is created fresh each iteration, so cross-child cycle protection is absent. A cycle that spans siblings would not be detected.\n- **FLAW-9.9 — `handlePeek` with `delegationId` but no `paneId` returns an error message about future wiring (`:836-850`).** This is a documented gap. A consumer who reads the tool description and tries `peek({ delegationId: \"del_123\" })` will get `\"[Harness] peek action: delegationId→paneId resolution not yet wired; pass paneId explicitly\"`. The description at `:474-477` advertises the action but does not mention the wiring gap.\n- **FLAW-9.10 — `handleProgress` does not check `canAccessDelegation` (`:875-905`).** The other status actions (`:578-582, :709`) check `canAccessDelegation`. `handleProgress` does not. A caller can request progress on a delegation they should not have access to. The action is read-only so the security impact is low (no state mutation), but it leaks the existence of other delegations.\n- **FLAW-9.11 — `managerActiveIds` is computed inside `mergeAllDelegations` (`:443`).** It calls `managerDelegations.map(d => d.id)` which is O(M) per call. The `byId` map iteration at `:444` is O(N) where N is the total record count. So `mergeAllDelegations` is O(N×M). For 10,000 delegations, this is 100M operations per status query.\n- **FLAW-9.12 — `renderDelegationV2` calls `deps.getChildMessageCount?.(...)` which is a `?.` optional call (`:130`).** If `deps.getChildMessageCount` is undefined (older managers), the field is silently `undefined` in the output. Consumers cannot distinguish \"message count is 0\" from \"message count is unknown.\" The schema should be `messageCount: number | null` for clarity.\n- **FLAW-9.13 — `handleControl` for `restart`/`resume`/`chain`/`adjust-prompt`/`change-agent` falls through to the `manager.controlDelegation` call (`:732-742`).** If `manager.controlDelegation` is not defined (older managers), the function falls through to the `if (args.control.action === \"abort\" | \"cancel\")` block at `:744-757`, which handles only those two actions. For `restart` etc., the function returns `\"[Harness] restart/redirect requires coordinator-backed manager control API\"` (`:758`). This is a graceful error but a user with an older manager will be told \"the tool can't do this\" rather than \"your manager is outdated.\"\n- **FLAW-9.14 — `UNSUPPORTED_REPLACEMENT_MESSAGE` is exported but never used (`:71-72, :823`).** The constant is defined at `:71-72` and re-exported at `:823`. No internal call site uses it. A future implementer might use it but the message is currently dead.\n- **FLAW-9.15 — `delegationStatusInvocationCounter` is a module-level mutable (`:462, :489, :688, :790, :817`).** A process-wide counter that is not thread-safe and not session-scoped. Two parallel agent runs will increment the same counter. The counter's purpose (P59 C5: cache-busting entropy) is to prevent identical-output loops. The counter does its job, but a session-scoped counter would be more correct (a parent session's status query and a child session's status query should not share entropy).\n- **FLAW-9.16 — `delegate-task.ts:81` `currentDepth: 0`** is a downstream contract for `delegation-status.ts` too. When `getSessionTrackerDelegation` reads a child record from disk, it reads `childRecord.delegationDepth` (`:176`). But the `delegate-task` tool passes `0` to the coordinator at `:81`. So the in-memory manager and the on-disk session-tracker have different depth values for the same child session. The status tool will see two different depths depending on which source it queries.\n- **FLAW-9.17 — `paneId` and `maxBytes` are in args but not validated for `peek` (`:478-486, :835-863`).** `peek` requires `paneId` (or `delegationId` per the comment). The args schema declares both as optional. The Zod refinement does not require either. The handler at `:836-838` returns an error envelope. A consumer who reads the args schema and assumes \"paneId optional\" will be surprised by the runtime error.\n- **FLAW-9.18 — `canAccessDelegation` is async but called in a loop (`:660-663, :775-779`).** The list and find-stackable paths iterate every delegation and call `canAccessDelegation` per delegation. Each call may invoke `manager.canSessionAccessDelegation` (synchronous) OR fall through to `resolveSessionFile` (async, file I/O). For a list of 100 delegations where half require file I/O, this is 50 sequential `await` calls. No `Promise.all` parallelism.\n- **FLAW-9.19 — `handleControl` abort path: `await deps.terminateChild?.(delegation.childSessionId)` (`:725, :740, :749`).** The optional chaining means if `terminateChild` is not provided, the call is silently skipped. A caller who expects the child to actually be terminated will see a successful \"aborted\" response with no guarantee the child process is gone.\n\n---\n\n## 10. Cross-Cutting Observations\n\n### 10.1 Schema-Kernel Inconsistency\n\n| Tool | Schema source |\n|------|---------------|\n| session-tracker | `schema-kernel/session-tracker.schema.js` |\n| session-hierarchy | `schema-kernel/session-tracker.schema.js` |\n| session-context | `schema-kernel/session-tracker.schema.js` |\n| session-delegation-query | dynamic import of `schema-kernel/session-delegation-query.schema.js` |\n| hivemind-session-view | `schema-kernel/session-view.schema.js` |\n| tmux-copilot | local Zod schemas (no schema-kernel) |\n| tmux-state-query | local Zod schemas (no schema-kernel) |\n| delegate-task | local Zod schema (no schema-kernel) |\n| delegation-status | local Zod schema (no schema-kernel) |\n\nThe session tools use the schema-kernel; the delegation and tmux tools do not. The schema-kernel appears to be the canonical home for input validation, but the lineage split is undocumented. The result is six distinct Zod schemas, each subject to drift.\n\n### 10.2 Read-Only vs Mutation Boundary\n\nPer the 9-surface authority in `ARCHITECTURE.md`, all 9 tools are \"read-side\" or \"read-side with optional mutation.\" The mutation authority is:\n\n| Tool | Mutations |\n|------|-----------|\n| session-tracker | None |\n| session-hierarchy | None |\n| session-context | None |\n| session-delegation-query | None |\n| hivemind-session-view | None |\n| tmux-copilot | `setManualOverrideState` (take-over, release) |\n| tmux-state-query | None |\n| delegate-task | `coordinator.dispatch` (creates a child session) |\n| delegation-status | `markAborted`, `markCancelled`, `terminateChild` (via control action) |\n\nThe mutation paths are clearly localized and gated. There is no hidden mutation in the read-side tools.\n\n### 10.3 File:Line Citation Summary\n\n| Tool | File | Critical lines |\n|------|------|----------------|\n| session-tracker | `src/tools/session/session-tracker.ts` | 25-62 (factory), 236-275 (list fallback), 339-422 (filter) |\n| session-hierarchy | `src/tools/session/session-hierarchy.ts` | 33-58 (factory), 146-206 (actions) |\n| session-context | `src/tools/session/session-context.ts` | 40-67 (factory), 144-301 (actions) |\n| session-delegation-query | `src/tools/session/session-delegation-query.ts` | 35-74 (factory), 99-234 (handlers) |\n| hivemind-session-view | `src/tools/hivemind/hivemind-session-view.ts` | 26-52 (factory), 119-155 (buildUnifiedView) |\n| tmux-copilot | `src/tools/tmux-copilot.ts` | 152-162 (schema), 198 (export), 220-466 (execute), 477-532 (buildSessionSummary) |\n| tmux-state-query | `src/tools/tmux-state-query.ts` | 63-67 (schema), 99-161 (execute) |\n| delegate-task | `src/tools/delegation/delegate-task.ts` | 10-15 (schema), 27-103 (factory) |\n| delegation-status | `src/tools/delegation/delegation-status.ts` | 24-44 (schemas), 134 (VALID set), 462-652 (execute), 654-905 (handlers) |\n\n### 10.4 Severity Triage\n\n| Severity | Flaws |\n|----------|-------|\n| **CRITICAL** (security or correctness break) | FLAW-6.1 (no permission gate), FLAW-3.5 (overcounting), FLAW-9.4 (silent fallback to \"running\"), FLAW-9.7 (always-resumable) |\n| **HIGH** (silent data loss or wrong result) | FLAW-1.1 (limit optional → empty), FLAW-1.2 (hard-coded \"active\"), FLAW-1.4 (unindexed search), FLAW-2.1 (delegation depth calc), FLAW-4.2 (status mismatch), FLAW-7.3 (empty data), FLAW-9.5 (status remap loses `explicitCancellation`), FLAW-9.18 (sequential canAccess) |\n| **MEDIUM** (subtle bugs, drift, docs) | FLAW-1.5, FLAW-1.6, FLAW-1.8, FLAW-2.2, FLAW-2.3, FLAW-2.4, FLAW-2.6, FLAW-3.1, FLAW-3.2, FLAW-3.6, FLAW-4.4, FLAW-4.7, FLAW-5.2, FLAW-5.3, FLAW-5.4, FLAW-5.6, FLAW-5.7, FLAW-6.3, FLAW-6.4, FLAW-6.6, FLAW-6.11, FLAW-8.2, FLAW-8.5, FLAW-8.6, FLAW-9.3, FLAW-9.6, FLAW-9.8, FLAW-9.10, FLAW-9.15, FLAW-9.19 |\n| **LOW** (code smell, polish) | FLAW-1.3, FLAW-1.7, FLAW-2.5, FLAW-3.4, FLAW-3.7, FLAW-4.1, FLAW-4.5, FLAW-4.6, FLAW-4.8, FLAW-4.9, FLAW-5.5, FLAW-5.8, FLAW-6.2, FLAW-6.5, FLAW-6.7, FLAW-6.8, FLAW-6.9, FLAW-6.10, FLAW-6.12, FLAW-6.13, FLAW-6.14, FLAW-7.1, FLAW-7.2, FLAW-7.4, FLAW-7.5, FLAW-7.6, FLAW-7.7, FLAW-8.1, FLAW-8.3, FLAW-8.4, FLAW-8.7, FLAW-8.8, FLAW-8.9, FLAW-8.10, FLAW-9.1, FLAW-9.2, FLAW-9.11, FLAW-9.12, FLAW-9.13, FLAW-9.14, FLAW-9.16, FLAW-9.17 |\n\n---\n\n## 11. Net Assessment\n\n**Strong points (across all 9 tools):**\n- Path-safety helpers (`safeSessionPath`, `isValidSessionID`) are consistently used in the read-side tools. No path traversal vulnerabilities found.\n- `renderToolResult` and the `success|error` envelope are used uniformly. The output shape is predictable.\n- The CQRS boundary is intact — read tools do not mutate.\n- The `redactTextSecrets` call in `delegation-status.ts` is applied to `result`, `error`, `fallbackReason`, `finalMessageExcerpt`, and the retry recommendation. Secret leak risk is mitigated.\n- The `manifestCache` in `delegation-status.ts` shows intent to optimize, even if its implementation is questionable (FLAW-9.3).\n- The `discriminatedUnion` Zod pattern in `tmux-copilot.ts` and `tmux-state-query.ts` is the most type-safe of the input-validation approaches.\n- Phase-tagged comments (P58, P58.8, P59) document the evolution of the permission model. The history is preserved in source.\n\n**Weak points:**\n- 3 copies of `readContinuity` and 3 copies of `findHierarchyEntry` (FLAW-2.6, FLAW-3.8). Every change to the child record schema requires editing 3+ files.\n- Status enums drift silently (FLAW-1.2, FLAW-4.2, FLAW-9.4). The canonical `DelegationStatus` is not enforced at the type level; runtime fallback is \"running\" which is dangerous.\n- The schema-kernel is partially used. 6 of 9 tools have local Zod schemas. There is no contract that the schema-kernel is the canonical home.\n- The \"no permission gate\" change in P59 R1 is a security regression (FLAW-6.1) that has no replacement.\n- `tmux-state-query` is a documented facade that returns empty data (FLAW-7.3). It is dead code that should either be implemented (extend the adapter) or removed.\n- The `delegate-task` tool's `currentDepth: 0` hard-code (FLAW-8.6) means the coordinator and the session-tracker disagree on depth.\n- Hard-coded magic numbers (MAX_TOTAL_RESULTS=1000, COMPUTE_DEPTH_MAX=100, TIME_PROXIMITY_MS=30min) are undocumented and unconfigurable.\n\n**Recommended follow-up actions (prioritized):**\n1. **P0 (CRITICAL):** Re-instate a permission gate in `tmux-copilot.ts` (FLAW-6.1). The P59 R1 removal is a security regression.\n2. **P0 (CRITICAL):** Fix `validateDelegationStatus` to return `\"error\"` instead of `\"running\"` for unknown statuses (FLAW-9.4). Treat unknown as bad data, not as in-progress.\n3. **P0 (CRITICAL):** Fix `aggregate(subagentType)` overcounting (FLAW-3.5). Filter to root sessions only.\n4. **P0 (CRITICAL):** Make `resume` field respect `terminalKind: \"non-resumable-after-restart\"` (FLAW-9.7).\n5. **P1 (HIGH):** Add `limit` default to `session-tracker`, `session-context`, `session-delegation-query` handlers (FLAW-1.1).\n6. **P1 (HIGH):** Map non-canonical statuses (FLAW-1.2, FLAW-4.2) at the boundary, not silently.\n7. **P1 (HIGH):** Either implement `tmux-state-query` or remove it (FLAW-7.3).\n8. **P2 (MEDIUM):** Extract `readContinuity` and `findHierarchyEntry` to a shared module (FLAW-2.6, FLAW-3.8).\n9. **P2 (MEDIUM):** Parallelize `canAccessDelegation` checks in `renderList` (FLAW-9.18).\n10. **P3 (LOW):** Add `peek` action delegationId→paneId resolution to remove the documented gap (FLAW-9.9).\n11. **P3 (LOW):** Document magic numbers in env-var-overridable constants.\n\n---\n\n*End of comprehensive test document. Generated 2026-06-05 by hm-codebase-mapper for UAT phase 58.9.*\n",
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/10-comprehensive-test.md"
}
```

**Output:**
```
Wrote file successfully.
```

---

## User

STEER: prioritize tmux-copilot.ts and tmux-state-query.ts in section 1 since they are the focus of phase 58.9 UAT.

---

## User



---

## User

RESPOND: Reply briefly: "1) what file you just read, 2) what you found, 3) next step". Then continue the audit.

---

## Assistant (Build · MiniMax-M3 · 20.0s)

_Thinking:_

The user is steering the audit to prioritize tmux-copilot.ts and tmux-state-query.ts in section 1 since they are the focus of phase 58.9 UAT. They also want a brief response with file, findings, next step.

I need to:
1. Reply briefly with: what file I just read, what I found, next step
2. Then update the audit document to prioritize tmux-copilot.ts and tmux-state-query.ts in section 1
3. Continue the audit

Let me first respond briefly, then reorder the document.

1) **File:** `.hivemind/planning/tools-audit-58-9-2026-06-05/10-comprehensive-test.md` (just written).
2) **Found:** 9-tool audit complete (1,294 LOC). Critical findings: tmux-copilot.ts P59 R1 removed all agent-tier permission gates (FLAW-6.1), tmux-state-query.ts is a documented facade returning empty data (FLAW-7.3), 3 duplicated `readContinuity`/`findHierarchyEntry` helpers across session tools, status-enum drift (active/dispatched/running mismatches), `validateDelegationStatus` silently maps unknown → "running" (FLAW-9.4).
3) **Next step:** Reorder section 1 to lead with tmux-copilot.ts and tmux-state-query.ts per phase 58.9 UAT focus, then continue.

Reordering the file now to put the two tmux tools first:

**Tool: read**

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/10-comprehensive-test.md",
  "offset": 1,
  "limit": 30
}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/tools-audit-58-9-2026-06-05/10-comprehensive-test.md</path>
<type>file</type>
<content>
1: [LANGUAGE: Write this file in en per Language Governance.]
2: [LANGUAGE: Write this file in en per Language Governance.]
3: # Comprehensive Test — 9-Tool Deep Audit (UAT Phase 58.9)
4: 
5: **Date:** 2026-06-05
6: **Subagent:** hm-codebase-mapper
7: **Scope:** 9 tools (3 session, 1 hivemind, 2 tmux, 2 delegation, 1 session-delegation)
8: **Method:** Direct source read (lines 1-end of each file), cross-referenced with shared helpers and integration owners
9: 
10: ---
11: 
12: ## 0. Reading Convention
13: 
14: For every tool I report:
15: 1. **Actions** — discriminated union values the tool exposes, with the dispatch site (file:line).
16: 2. **Args** — the Zod schema in TS terms; what is required vs optional; what defaults apply.
17: 3. **Status values** — every status enum literal the tool can return, accept, or filter on. Includes fallback values when parsing fails.
18: 4. **Integration points** — every module the tool calls into, with file:line where the import or call site lives.
19: 5. **Flaws** — what the source actually does that is wrong, dangerous, lossy, undocumented, or contradicting the contracts of the things it depends on.
20: 
21: All line numbers reference the file paths I read on 2026-06-05. File totals are from the same reads.
22: 
23: ---
24: 
25: ## 1. `src/tools/session/session-tracker.ts` (423 lines)
26: 
27: ### 1.1 Tool entry point
28: 
29: - Factory: `createSessionTrackerTool(projectRoot: string)` at `:25`.
30: - Returns a `tool({...})` (OpenCode SDK) with 6 actions.

(Showing lines 1-30 of 731. Use offset=31 to continue.)
</content>
```

---

## Assistant (Build · MiniMax-M3)

_Thinking:_

Now I need to restructure the document to put the two tmux tools first in section 1. The current order is:
1. session-tracker
2. session-hierarchy
3. session-context
4. session-delegation-query
5. hivemind-session-view
6. tmux-copilot
7. tmux-state-query
8. delegate-task
9. delegation-status

I need to make it:
1. tmux-copilot (UAT focus)
2. tmux-state-query (UAT focus)
3. session-tracker
4. session-hierarchy
5. session-context
6. session-delegation-query
7. hivemind-session-view
8. delegate-task
9. delegation-status

I'll also add a phase 58.9 priority note at the top and in the section 1 header.

The most efficient approach is to rewrite the entire file. Let me do that.

Now I'll rewrite the file with the tmux tools prioritized in section 1.

**Tool: write**

**Input:**
```json
{}
```

---

