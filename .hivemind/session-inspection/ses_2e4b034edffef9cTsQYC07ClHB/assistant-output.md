# Session Inspection Export

- ses_id: `ses_2e4b034edffef9cTsQYC07ClHB`
- prepared_at: `2026-03-23T15:30:24.147Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Full content retrieval of 4 requested files
**Question:** Return complete contents with line numbers

### File 1: `src/shared/paths.ts` (89 lines)

```
1: /**
2:  * Path utilities for HiveMind
3:  * Centralizes all path constants and helpers
4:  */
5: 
6: import path from 'path'
7: 
8: // Root directory names
9: export const HIVEMIND_DIR = '.hivemind'
10: export const STATE_DIR = 'state'
11: export const SESSIONS_DIR = 'sessions'
12: export const GRAPH_DIR = 'graph'
13: export const CONFIG_DIR = 'config'
14: export const ARTIFACTS_DIR = 'artifacts'
15: export const CHECKPOINTS_DIR = 'checkpoints'
16: 
17: // State files
18: export const STATE_FILES = {
19:   hiveneuron: 'hiveneuron.json',
20:   hivebrain: 'hivebrain.md',
21:   brain: 'brain.json',
22:   anchors: 'anchors.json',
23: } as const
24: 
25: // Path builders
26: export function getHivemindPath(projectRoot: string): string {
27:   return path.join(projectRoot, HIVEMIND_DIR)
28: }
29: 
30: export function getStatePath(projectRoot: string, filename: string): string {
31:   return path.join(projectRoot, HIVEMIND_DIR, STATE_DIR, filename)
32: }
33: 
34: export function getSessionPath(projectRoot: string, sessionId: string): string {
35:   return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
36: }
37: 
38: export function getSessionInspectionPath(projectRoot: string, sessionId: string): string {
39:   return path.join(projectRoot, HIVEMIND_DIR, 'session-inspection', sessionId)
40: }
41: 
42: export function getErrorLogPath(projectRoot: string): string {
43:   return path.join(projectRoot, HIVEMIND_DIR, 'error-log')
44: }
45: 
46: export function getConfigPath(projectRoot: string, configName: string): string {
47:   return path.join(projectRoot, HIVEMIND_DIR, CONFIG_DIR, configName)
48: }
49: 
50: // Path predicates
51: export function isHivemindPath(filePath: string): boolean {
52:   return filePath.includes(HIVEMIND_DIR)
53: }
54: 
55: export function isSessionFile(filePath: string): boolean {
56:   return filePath.includes(SESSIONS_DIR)
57: }
58: 
59: /**
60:  * Canonical path authority: derives all runtime paths from a single project root.
61:  * All modules should use this instead of building paths ad-hoc.
62:  */
63: export function getEffectivePaths(projectRoot: string) {
64:   const root = path.join(projectRoot, HIVEMIND_DIR)
65:   const stateDir = path.join(root, STATE_DIR)
66:   const configDir = path.join(root, CONFIG_DIR)
67:   const graphDir = path.join(root, GRAPH_DIR)
68:   const sessionsDir = path.join(root, SESSIONS_DIR)
69:   const sessionInspectionDir = path.join(root, 'session-inspection')
70:   const projectPlanningDir = path.join(root, 'project', 'planning')
71:   const handoffsDir = path.join(root, 'handoffs')
72:   const errorLogDir = path.join(root, 'error-log')
73: 
74:   return {
75:     root,
76:     stateDir,
77:     configDir,
78:     graphDir,
79:     sessionsDir,
80:     sessionInspectionDir,
81:     projectPlanningDir,
82:     handoffsDir,
83:     errorLogDir,
84:     runtimeAttachmentSettings: path.join(configDir, 'runtime-attachment.json'),
85:     workflowTasksState: path.join(stateDir, 'tasks.json'),
86:     workflowTasksGraph: path.join(graphDir, 'tasks.json'),
87:     trajectoryLedger: path.join(stateDir, 'trajectory-ledger.json'),
88:   }
89: }
```

### File 2: `src/sdk-supervisor/diagnostic-log.ts` (104 lines)

```
1: /**
2:  * Diagnostic Log — Writes diagnostic summaries to .hivemind/error-log/
3:  * after each agent completes its flow (assistant message sent).
4:  */
5: 
6: import * as fs from 'node:fs/promises'
7: import * as path from 'node:path'
8: 
9: import { getErrorLogPath } from '../shared/paths.js'
10: 
11: export interface DiagnosticLogEntry {
12:   sessionId: string
13:   timestamp: string
14:   assistantText: string
15:   purpose?: string
16:   sessionState?: string
17:   trajectory?: string
18:   workflow?: string
19:   agent?: string
20:   // Injection payload from messages.transform
21:   injection?: {
22:     purposeClass: string
23:     sessionState: string
24:     agent: string
25:     variant: string
26:     sessionRole: string
27:     skillBundle: { name: string; description: string }[]
28:     skillFocusBlock: string
29:     turnHierarchyBlock: string
30:     contextBlock: string
31:     routeHintBlock?: string
32:   }
33: }
34: 
35: function renderDiagnosticEntry(entry: DiagnosticLogEntry): string {
36:   const lines: string[] = [
37:     '---',
38:     `session_id: ${entry.sessionId}`,
39:     `timestamp: ${entry.timestamp}`,
40:     `purpose: ${entry.purpose ?? 'unknown'}`,
41:     `session_state: ${entry.sessionState ?? 'unknown'}`,
42:     `trajectory: ${entry.trajectory ?? 'none'}`,
43:     `workflow: ${entry.workflow ?? 'none'}`,
44:     `agent: ${entry.agent ?? 'unknown'}`,
45:     `---`,
46:     '',
47:   ]
48: 
49:   // Injection payload section
50:   if (entry.injection) {
51:     lines.push('## Injection Payload (from messages.transform)')
52:     lines.push('')
53:     lines.push(`- purpose_class: ${entry.injection.purposeClass}`)
54:     lines.push(`- session_state: ${entry.injection.sessionState}`)
55:     lines.push(`- agent: ${entry.injection.agent}`)
56:     lines.push(`- variant: ${entry.injection.variant}`)
57:     lines.push(`- session_role: ${entry.injection.sessionRole}`)
58:     lines.push('')
59:     lines.push('### Skill Bundle')
60:     for (const skill of entry.injection.skillBundle) {
61:       lines.push(`- ${skill.name}: ${skill.description}`)
62:     }
63:     lines.push('')
64:     lines.push('### Skill Focus Block')
65:     lines.push(entry.injection.skillFocusBlock || '(none)')
66:     lines.push('')
67:     lines.push('### Turn Hierarchy Block')
68:     lines.push(entry.injection.turnHierarchyBlock || '(none)')
69:     lines.push('')
70:     lines.push('### Context Block')
71:     lines.push(entry.injection.contextBlock || '(none)')
72:     if (entry.injection.routeHintBlock) {
73:       lines.push('')
74:       lines.push('### Route Hint Block')
75:       lines.push(entry.injection.routeHintBlock)
76:     }
77:     lines.push('')
78:   }
79: 
80:   lines.push('## Assistant Output')
81:   lines.push('')
82:   lines.push(entry.assistantText.slice(0, 5000))
83:   lines.push('')
84: 
85:   return lines.join('\n')
86: }
87: 
88: /**
89:  * Write a diagnostic log entry to .hivemind/error-log/
90:  * Each entry is named by session and timestamp for easy inspection.
91:  */
92: export async function writeDiagnosticLog(
93:   projectRoot: string,
94:   entry: DiagnosticLogEntry,
95: ): Promise<string> {
96:   const errorLogDir = getErrorLogPath(projectRoot)
97:   await fs.mkdir(errorLogDir, { recursive: true })
98: 
99:   const filename = `${entry.sessionId}-${Date.now()}.md`
100:   const filePath = path.join(errorLogDir, filename)
101: 
102:   await fs.writeFile(filePath, renderDiagnosticEntry(entry))
103:   return filePath
104: }
```

### File 3: `src/sdk-supervisor/session-inspection.ts` (106 lines)

```
1: import * as fs from 'node:fs/promises'
2: import * as path from 'node:path'
3: 
4: import { getSessionInspectionPath } from '../shared/paths.js'
5: 
6: const SESSION_INSPECTION_MARKDOWN_FILE = 'assistant-output.md'
7: const SESSION_INSPECTION_COMMAND_FILE = 'purification-command.json'
8: 
9: export interface PreparedPurificationCommand {
10:   version: 'v1'
11:   kind: 'session-inspection-purification'
12:   status: 'prepared'
13:   ses_id: string
14:   markdown_path: string
15:   tool_hints: ['grep', 'read']
16:   instruction: string
17:   prepared_at: string
18: }
19: 
20: export interface SessionInspectionExportResult {
21:   sessionId: string
22:   directoryPath: string
23:   markdownPath: string
24:   commandPath: string
25: }
26: 
27: function renderSessionInspectionMarkdown(input: {
28:   sessionId: string
29:   assistantText: string
30:   preparedAt: string
31: }): string {
32:   return [
33:     '# Session Inspection Export',
34:     '',
35:     `- ses_id: \`${input.sessionId}\``,
36:     `- prepared_at: \`${input.preparedAt}\``,
37:     '',
38:     '## Assistant Output',
39:     '',
40:     input.assistantText,
41:   ].join('\n')
42: }
43: 
44: /**
45:  * Build the internal async purification command artifact for a saved inspection export.
46:  *
47:  * @param input Session identifier and saved markdown path.
48:  * @returns Prepared command payload for later async processing.
49:  */
50: export function createPreparedPurificationCommand(input: {
51:   sessionId: string
52:   markdownPath: string
53:   preparedAt?: string
54: }): PreparedPurificationCommand {
55:   const preparedAt = input.preparedAt ?? new Date().toISOString()
56: 
57:   return {
58:     version: 'v1',
59:     kind: 'session-inspection-purification',
60:     status: 'prepared',
61:     ses_id: input.sessionId,
62:     markdown_path: input.markdownPath,
63:     tool_hints: ['grep', 'read'],
64:     instruction: 'Read the saved markdown_path from disk and use ses_id as the purification target.',
65:     prepared_at: preparedAt,
66:   }
67: }
68: 
69: /**
70:  * Upsert the per-session inspection export and paired async purification command.
71:  *
72:  * @param projectRoot Workspace root used for `.hivemind` path resolution.
73:  * @param input Completed assistant text and session identity.
74:  * @returns Stable artifact paths for the updated session inspection export.
75:  */
76: export async function upsertSessionInspectionExport(
77:   projectRoot: string,
78:   input: {
79:     sessionId: string
80:     assistantText: string
81:   },
82: ): Promise<SessionInspectionExportResult> {
83:   const directoryPath = getSessionInspectionPath(projectRoot, input.sessionId)
84:   const markdownPath = path.join(directoryPath, SESSION_INSPECTION_MARKDOWN_FILE)
85:   const commandPath = path.join(directoryPath, SESSION_INSPECTION_COMMAND_FILE)
86:   const preparedAt = new Date().toISOString()
87: 
88:   await fs.mkdir(directoryPath, { recursive: true })
89:   await fs.writeFile(markdownPath, renderSessionInspectionMarkdown({
90:     sessionId: input.sessionId,
91:     assistantText: input.assistantText,
92:     preparedAt,
93:   }))
94:   await fs.writeFile(commandPath, JSON.stringify(createPreparedPurificationCommand({
95:     sessionId: input.sessionId,
96:     markdownPath,
97:     preparedAt,
98:   }), null, 2))
99: 
100:   return {
101:     sessionId: input.sessionId,
102:     directoryPath,
103:     markdownPath,
104:     commandPath,
105:   }
106: }
```

### File 4: `src/plugin/opencode-plugin.ts` (212 lines)

```
1: /**
2:  * Real OpenCode plugin entry for the revamp lane.
3:  *
4:  * Assembly-only: imports hooks and tools, registers them, exports Plugin.
5:  * No business logic. No tool definitions. No event processing beyond delegation.
6:  */
7: 
8: import { type Plugin } from '@opencode-ai/plugin'
9: 
10: import { findSlashCommandBundle } from '../commands/slash-command/index.js'
11: import { initSdkContext, resetSdkContext } from '../hooks/sdk-context.js'
12: import { createEventHandler } from '../hooks/event-handler.js'
13: import { showGovernanceToast } from '../hooks/soft-governance.js'
14: 
15: import {
16:   createAgentWorkCreateContractTool,
17:   createAgentWorkExportContractTool,
18: } from '../features/agent-work-contract/tools/index.js'
19: import { isHivemindManagedTool, recordToolEvent } from '../hooks/runtime-loader/index.js'
20: import { createHivemindDocTool } from '../tools/doc/index.js'
21: import { createHivemindHandoffTool } from '../tools/handoff/index.js'
22: import {
23:   createHivemindRuntimeStatusTool,
24:   createHivemindRuntimeCommandTool,
25: } from '../tools/runtime/index.js'
26: import { createHivemindTaskTool as createTaskTool } from '../tools/task/index.js'
27: import { createHivemindTrajectoryTool as createTrajectoryTool } from '../tools/trajectory/index.js'
28: import { renderToolPrecedence } from './context-renderer.js'
29: import { createTurnSnapshotLoader } from './runtime-snapshot.js'
30: import { createSyntheticPart } from './synthetic-parts.js'
31: import { createMessagesTransformHandler } from './messages-transform-adapter.js'
32: import { getAndClearInjectionPayload } from './injection-store.js'
33: import { createCompactionHandler } from './compaction-adapter.js'
34: import { upsertSessionInspectionExport, writeDiagnosticLog } from '../sdk-supervisor/index.js'
35: 
36: /**
37:  * Real OpenCode plugin entry for the revamp lane.
38:  *
39:  * Assembly-only: imports hooks and tools, registers them, exports Plugin.
40:  * No business logic. No tool definitions. No event processing beyond delegation.
41:  */
42: export const HiveMindPlugin: Plugin = async (input) => {
43:   const directory = input.directory
44:   initSdkContext(input)
45:   const eventHandler = createEventHandler(directory)
46:   const turnSnapshot = createTurnSnapshotLoader(directory)
47:   const nlFirstDispatchKeys = new Set<string>()
48: 
49:   // Create isolated hook adapters
50:   const messagesTransform = createMessagesTransformHandler({
51:     directory,
52:     turnSnapshot,
53:     nlFirstDispatchKeys,
54:   })
55: 
56:   const compactionHandler = createCompactionHandler({
57:     directory,
58:     turnSnapshot,
59:   })
60: 
61:   return {
62:     event: async (eventInput) => {
63:       await eventHandler(eventInput)
64:     },
65:     tool: {
66:       hivemind_runtime_status: createHivemindRuntimeStatusTool(directory),
67:       hivemind_runtime_command: createHivemindRuntimeCommandTool(directory),
68:       hivemind_agent_work_create_contract: createAgentWorkCreateContractTool(directory),
69:       hivemind_agent_work_export_contract: createAgentWorkExportContractTool(directory),
70:       hivemind_doc: createHivemindDocTool(directory),
71:       hivemind_task: createTaskTool(directory),
72:       hivemind_trajectory: createTrajectoryTool(directory),
73:       hivemind_handoff: createHivemindHandoffTool(directory),
74:     },
75:     'chat.message': async (_messageInput, _output) => {
76:       turnSnapshot.resetTurnSnapshot()
77:       const snapshot = await turnSnapshot.getSnapshot()
78: 
79:       // Show degraded mode warning if HiveMind exists but isn't healthy
80:       if (snapshot.hasHivemind && !snapshot.hivemindHealthy) {
81:         await showGovernanceToast(
82:           'degraded-mode',
83:           'Running in degraded mode. HiveMind initialized with minimal state. Run `hm-init` for full capabilities and expert-level configuration.',
84:           'warning'
85:         )
86:       }
87:     },
88:     'permission.ask': async (permissionInput, output) => {
89:       // Auto-allow HiveMind managed tool calls (they have their own governance)
90:       if (permissionInput.metadata) {
91:         const toolName = (permissionInput.metadata as Record<string, unknown>).tool as string | undefined
92:         if (isHivemindManagedTool(toolName)) {
93:           output.status = 'allow'
94:           return
95:         }
96:       }
97: 
98:       // For state mutations, surface a governance toast
99:       if (permissionInput.type === 'write') {
100:         await showGovernanceToast(
101:           'mutation-gate',
102:           `HiveMind: Permission requested for ${permissionInput.type} operation`,
103:         )
104:       }
105:     },
106:     'tool.execute.before': async (toolInput, _output) => {
107:       // Record tool execution intent for trajectory tracking
108:       if (isHivemindManagedTool(toolInput.tool)) {
109:         await recordToolEvent(directory, toolInput.sessionID, `${toolInput.tool}:pre`)
110:       }
111:     },
112:     'shell.env': async (_input, output) => {
113:       const snapshot = await turnSnapshot.getSnapshot()
114:       output.env.HIVEMIND_RUNTIME_ATTACHED = '1'
115:       output.env.HIVEMIND_ATTACHMENT_MODE = snapshot.attachmentMode
116:       if (snapshot.trajectoryId) output.env.HIVEMIND_ACTIVE_TRAJECTORY = snapshot.trajectoryId
117:       if (snapshot.workflowId) output.env.HIVEMIND_ACTIVE_WORKFLOW = snapshot.workflowId
118:     },
119:     'command.execute.before': async (commandInput, output) => {
120:       const bundle = findSlashCommandBundle(commandInput.command)
121:       if (!bundle) {
122:         return
123:       }
124: 
125:       const snapshot = await turnSnapshot.getSnapshot()
126: 
127:       // Build tool precedence chain for bundle execution
128:       const toolPrecedenceChain = {
129:         chain: [
130:           {
131:             tool: 'hivemind_runtime_command',
132:             action: 'execute',
133:             args: { bundleId: bundle.id },
134:           },
135:         ],
136:         mandatory_reads: [
137:           { path: '.hivemind/session.json', reason: 'active_session_state' },
138:           ...(snapshot.trajectoryId ? [{ path: `.hivemind/trajectory/${snapshot.trajectoryId}.json`, reason: 'trajectory_state' }] : []),
139:           ...(snapshot.workflowId ? [{ path: `.hivemind/workflow/${snapshot.workflowId}.json`, reason: 'workflow_state' }] : []),
140:         ],
141:       }
142: 
143:       const toolPrecedenceJson = renderToolPrecedence(toolPrecedenceChain)
144: 
145:       output.parts.unshift(createSyntheticPart(
146:         commandInput.sessionID,
147:         commandInput.sessionID,
148:         [
149:           '<hivemind-command-context>',
150:           `command=${bundle.id}`,
151:           `trajectory=${snapshot.trajectoryId ?? 'none'}`,
152:           `workflow=${snapshot.workflowId ?? 'none'}`,
153:           `task_ids=${snapshot.taskIds.join(',')}`,
154:           `tool_precedence=${toolPrecedenceJson}`,
155:           'mutation_rule=do-not-hand-write-hivemind-state-files',
156:           '</hivemind-command-context>',
157:         ].join('\n'),
158:       ))
159:     },
160:     'tool.execute.after': async (toolInput) => {
161:       if (isHivemindManagedTool(toolInput.tool)) {
162:         await recordToolEvent(directory, toolInput.sessionID, toolInput.tool)
163:       }
164:     },
165:     'experimental.text.complete': async (input, output) => {
166:       const sessionId = input.sessionID
167:       const assistantText = typeof output.text === 'string' ? output.text : ''
168: 
169:       if (!sessionId || assistantText.length === 0) {
170:         return
171:       }
172: 
173:       void upsertSessionInspectionExport(directory, {
174:         sessionId,
175:         assistantText,
176:       }).catch(() => undefined)
177: 
178:       const snapshot = await turnSnapshot.getSnapshot()
179:       const injection = getAndClearInjectionPayload(sessionId)
180:       void writeDiagnosticLog(directory, {
181:         sessionId,
182:         timestamp: new Date().toISOString(),
183:         assistantText,
184:         purpose: snapshot.defaultPurposeClass,
185:         sessionState: snapshot.entryState,
186:         trajectory: snapshot.trajectoryId ?? 'none',
187:         workflow: snapshot.workflowId ?? 'none',
188:         agent: snapshot.preferredUserName ?? 'hivefiver',
189:         injection: injection ? {
190:           purposeClass: injection.purposeClass,
191:           sessionState: injection.sessionState,
192:           agent: injection.agent,
193:           variant: injection.variant,
194:           sessionRole: injection.sessionRole,
195:           skillBundle: injection.skillBundle,
196:           skillFocusBlock: injection.skillFocusBlock,
197:           turnHierarchyBlock: injection.turnHierarchyBlock,
198:           contextBlock: injection.contextBlock,
199:           routeHintBlock: injection.routeHintBlock,
200:         } : undefined,
201:       }).catch(() => undefined)
202:     },
203:     'experimental.chat.messages.transform': messagesTransform,
204:     'experimental.session.compacting': compactionHandler,
205:   }
206: }
207: 
208: export default HiveMindPlugin
209: 
210: process.on('exit', () => {
211:   resetSdkContext()
212: })
```

---

All 4 files retrieved in full. Total: **89 + 104 + 106 + 212 = 511 lines** across the 4 files.