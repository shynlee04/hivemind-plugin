---
sessionID: ses_1e8e89cf3ffeuq87qQGNdZcyDa
created: 2026-05-11T12:51:09.260Z
updated: 2026-05-11T12:51:09.260Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hf-l2-skill-builder. You are refining the `hivemind-power-on` governance skill. Your task is to make the SKILL.md body RADICALLY thinner because this skill loads at EVERY agent startup — every word costs context budget.

## CONTEXT

The current SKILL.md at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md` is ~448 lines. This is far too heavy for a skill loaded at EVERY session start, resume, and compact survival event. The body must be a thin routing table + iron laws. All depth goes in references.

## REQUIRED STRUCTURE (target: 100-150 lines MAX)

### SKILL.md Body (thin leadership governance):

**Frontmatter** — keep same but shorten description to <200 chars:
```yaml
---
name: hivemind-power-on
description: >-
  MUST-LOAD governance for L0/L1 agents. Routes hm/hf lineage, 
  manages session lifecycle, enforces quality gates, optimizes context. 
  Load FIRST. Triggers: session start, resume, disconnect, compact.
version: 1.0.0
lineage: hivemind
---
```

**Section: 7 IRON LAWS** (prominent, at top — these are non-negotiable):
```
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

**Section: ROUTING TABLE** (the core — agents check this every turn):
| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, agent/skill/command creation | → hf-lineage, hf-l1-coordinator | [ref-01 §2] |
| `/plan`, `/deep-init`, feature/bug/architecture work | → hm-lineage, hm-l1-coordinator | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02] |
| Context compact/purge | → SURVIVAL protocol | [ref-03] |
| Delegation to specialist | → DELEGATION protocol | [ref-04] |
| Quality gate needed | → GATE TRIAD | [ref-05] |
| Ambiguous intent | → hm-l2-user-intent-interactive-loop | [ref-01 §4] |

**Section: QUICK REFERENCE — Session-Tracker Cheat Sheet** (5 lines max):
```
find all sessions:        session-tracker({action:"list-sessions"})
read one session:         session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:            session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:           read("<session>/session-continuity.json")
grep last user:           grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

**Section: REFERENCE MAP** (inline jump links):
```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, domain maps
references/02-session-resume-protocol.md — step-by-step disconnect recovery, L0→L1 cascade
references/03-compact-survival.md       — context purge recovery, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits
references/05-quality-gates.md          — lifecycle→spec→evidence triad, retry/escalation
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns
```

**Section: ASSET BUNDLES** (which references to load per agent type):
```
L0 (orchestrator load):       ref-01 + ref-02 + ref-04 + ref-06  (route + resume + delegate + track)
L1 (coordinator load):        ref-04 + ref-05 + ref-06  (delegate + gates + track)
L2/L3 (specialist load):      ref-05 only  (gates only)
Post-disconnect (any agent):  ref-02 + ref-06  (resume + track)
Post-compact (any agent):     ref-03 + ref-06  (survive + track)
```

**Section: ESCALATION RULES** (3 lines):
```
- 3 consecutive gate failures → escalate to user with full evidence
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- Session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
```

## RULES FOR THIS REFACTOR

1. Read the CURRENT SKILL.md first — at `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md`
2. Preserve ALL content but MOVE it to the appropriate reference file
3. The body becomes a routing table ONLY — no explanations, no worked examples
4. Every section in the body has a jump link like `[ref-XX §Y]`
5. The 7 Iron Laws stay in the body — they are non-negotiable
6. The Session-Tracker Cheat Sheet stays in the body — it's used every turn
7. The Asset Bundle table stays in the body — it controls what to load
8. Target: 100-150 lines in SKILL.md body (currently ~448)
9. Update the 6 reference files to absorb content moved from body
10. Add inline TOC sections to each reference file for the jump links to be precise

## AFTER REFACTORING

1. Verify SKILL.md is ≤150 lines
2. Verify all content from original SKILL.md is preserved somewhere (body or references)
3. Verify every `[ref-XX §Y]` jump link resolves to a real section in the reference file
4. Verify asset bundle table makes sense (L0 needs the most, L3 needs the least)
5. Return: new SKILL.md line count, list of modified files, and confirmation that all jump links resolve

### Tool: skill

**Input:**
```json
{
  "name": "hf-l2-use-authoring-skills"
}
```

**Output:** (pruned)
```
# Skill: hf-l2-use-authoring-skills
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md</path>
<type>file</type>
<content>
1: ---
2: name: hivemind-power-on
3: description: >-
4:   MUST-LOAD governance skill for ALL Hivemind L0 and L1 agents. Routes workflows
5:   across hm-* and hf-* lineages, manages session lifecycle (start/resume/compact-survival),
6:   orchestrates delegation chains, enforces quality gates, and optimizes context usage.
7:   Load FIRST before any domain-specific skills. Triggers on: "session start", "resume session",
8:   "disconnect recovery", "recover from disconnect", "context compaction", "compact context",
9:   "lineage routing needed", "which lineage", "what workflow should I use",
10:   "power on", "/hivemind-power-on", "restart session", "continue work".
11:   NOT a domain skill — loads before hm-* or hf-* routing. Max 3 skills concurrent.
12: version: 1.0.0
13: lineage: hivemind
14: load_priority: 1
15: consumed-by:
16:   - hm-l0-orchestrator
17:   - hf-l0-orchestrator
18:   - hm-l1-coordinator
19:   - hf-l1-coordinator
20:   - hm-l2-conductor
21:   - hf-l2-meta-builder
22: allowed-tools:
23:   - skill
24:   - read
25:   - grep
26:   - glob
27:   - bash
28:   - task
29:   - todowrite
30:   - session-tracker
31:   - prompt-skim
32:   - prompt-analyze
33:   - hivemind-doc
34: ---
35: 
36: # THE IRON LAWS
37: 
38: ```
39: 1. NEVER start a new session when aborted delegations exist. Use EXACT task_id.
40: 2. NEVER repeat the prompt when resuming. Context is preserved in the session file.
41: 3. NEVER dispatch directly to L2 (L0→L1→L2 always, unless user explicitly overrides).
42: 4. NEVER skip the quality gate triad (lifecycle → spec → evidence).
43: 5. NEVER load >3 skills concurrently.
44: 6. NEVER read full files when grep + offset yields the answer.
45: 7. ALWAYS use session-tracker to find aborted sessions before starting fresh.
46: ```
47: 
48: # Hivemind Power-On — Session Governance Protocol
49: 
50: ## 1. Role & When To Load
51: 
52: This skill governs ALL Hivemind agent sessions from power-on through shutdown. It is the first skill every agent loads. It does not execute domain work — it routes to the correct lineage, manages session lifecycle, and enforces delegation discipline.
53: 
54: ### MUST load at:
55: | Trigger | Action |
56: |---------|--------|
57: | Session start (fresh) | Load first → classify lineage → load lineage router |
58: | Session resume after disconnect | Load first → run RESUME protocol → load lineage router |
59: | Context compaction / purge survival | Load first → run COMPACT SURVIVAL protocol |
60: | Workflow routing needed | Load first → classify lineage → load lineage router |
61: | Delegation chain establishment | Verify L0→L1→L2 chain, enforce gates |
62: 
63: ### Loaded by:
64: - **Mandatory:** hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator
65: - **Conditional:** hm-l2-conductor, hf-l2-meta-builder (when receiving delegation task)
66: - **L2/L3 specialists:** Do NOT load this — your coordinator loaded it for you
67: 
68: ### Loading order:
69: ```
70: hivemind-power-on (FIRST) → lineage router → domain skills
71: ```
72: 
73: ---
74: 
75: ## 2. Lineage Classification (Pattern 1)
76: 
77: Before any domain work, classify the task into the correct lineage:
78: 
79: ```
80: Is the task about CREATING / AUDITING / REPAIRING meta-concepts?
81:   ├─ YES: agents, skills, commands, tools → hf-* lineage
82:   └─ NO:  features, bugs, architecture, implementation → hm-* lineage
83: 
84: Does the command start with /hf-*?
85:   └─ YES → hf-* lineage
86: 
87: Does the command start with /plan, /ultrawork, /gsd-*?
88:   └─ YES → hm-* lineage
89: 
90: Still ambiguous?
91:   └─ Read 1 user turn via session-tracker → grep "## USER" → classify intent
92: ```
93: 
94: ### Cross-lineage rules:
95: | Lineage | Rule |
96: |---------|------|
97: | **hf-*** (FLEXIBLE) | May load hm-* skills for codebase investigation. Document reason. |
98: | **hm-*** (STRICT) | No hf-* loading unless explicitly routed by hf-orchestrator. |
99: | **gate-*** (INTERNAL) | Project-only quality gate triad. |
100: | **stack-*** (REFERENCE) | Read-only tech stack documentation. Any lineage may load. |
101: 
102: ---
103: 
104: ## 3. Session Lifecycle Protocol (Pattern 3 — CRITICAL)
105: 
106: ### 3.1 FRESH START — No Active Sessions
107: 
108: When you KNOW no prior sessions exist (first ever start; user explicitly says "new session"):
109: 
110: ```
111: 1. Announce: "[Agent] powered on. Classifying workflow…"
112: 2. Run lineage classification (Section 2 above)
113: 3. Load the lineage router for the classified lineage
114: 4. Proceed with domain work
115: ```
116: 
117: ### 3.2 RESUME AFTER DISCONNECT — THE CRITICAL PROTOCOL
118: 
119: This is the #1 session-recovery fix. Follow EXACTLY. Do not skip steps.
120: 
121: ```
122: STEP 1 — FIND ACTIVE SESSIONS
123:   Read project-continuity.json:
124:     read(".hivemind/session-tracker/project-continuity.json")
125:   Filter: sessions with status === "active", sorted by updated descending.
126:   If none → FRESH START (Section 3.1).
127: 
128: STEP 2 — FIND ABORTED DELEGATIONS
129:   For EACH active session (starting with most recently updated):
130:     Read its session-continuity.json:
131:       read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
132:     Check hierarchy.children → find any child with status === "active".
133: 
134: STEP 3 — IDENTIFY DEEPEST ACTIVE DELEGATION
135:   Among all active children across all active sessions:
136:     Pick the child with the HIGHEST depth value.
137:     If multiple at same depth → pick the most recently updated.
138: 
139:   Record:
140:     - rootSessionId: the parent session ID
141:     - targetChildId: the aborted delegation child ID (task_id)
142:     - agentType: the delegatedBy field from child metadata
143: 
144: STEP 4 — EXPORT THE ROOT SESSION
145:   session-tracker(action: "export-session", sessionId: "<rootSessionId>")
146:   This returns the full .md capture file with all turns, tool calls, and context.
147: 
148: STEP 5 — RECOVER LAST USER INTENT
149:   grep(pattern: "## USER \\(turn", include: "*.md") on the exported content,
150:     OR read with offset to find the most recent user turn.
151:   Read the last ## USER turn to understand what was requested.
152: 
153: STEP 6 — RESUME WITH EXACT task_id
154:   The child's session ID IS the task_id. Resume using:
155:     task(description="resume", subagent_type="<SAME agent_type>",
156:          task_id="<targetChildId>")
157: 
158: STEP 7 — CASCADE TO CHILD
159:   When the resumed L1 agent spawns, it checks ITS session-continuity.json
160:   for aborted L2 children and resumes them with EXACT task_id too.
161: 
162: CRITICAL:
163:   - DO NOT create a new session ID.
164:   - DO NOT repeat the original prompt — context is preserved.
165:   - The resumed agent sees its prior conversation state.
166: ```
167: 
168: ### 3.3 COMPACT / PURGE SURVIVAL
169: 
170: When context is compacted (OpenCode auto-compacts at 70%) or purged:
171: 
172: ```
173: 1. Export current session BEFORE compaction hits:
174:    session-tracker(action: "export-session", sessionId: "<current>")
175: 
176: 2. Read project-continuity.json → find current session metadata
177: 
178: 3. Read session-continuity.json → map active delegation tree
179: 
180: 4. From exported .md, grep "## USER (turn" for most recent user request
181: 
182: 5. Reconstruct from disk:
183:    - Last user intent → from ## USER turn in .md
184:    - Active delegations → from session-continuity.json hierarchy.children
185:    - task_ids → from child session IDs
186:    - Agent types → from delegatedBy field
187: 
188: 6. Present reconstruction to user before proceeding:
189:    "Recovered from compaction. Last request: [intent]. Resume?"
190: ```
191: 
192: ### 3.4 Session Health Dashboard (L0 Only)
193: 
194: L0 agents should run this on power-on to get an overview:
195: 
196: ```
197: 1. List all sessions:
198:    session-tracker(action: "list-sessions", limit: 50)
199: 
200: 2. Count:
201:    - Active sessions (status === "active")
202:    - Sessions with active children (childCount > 0)
203:    - Sessions with totalDelegationDepth > 0
204: 
205: 3. Warn if:
206:    - >5 active sessions exist (leakage)
207:    - Any session has depth >= 3 (max delegation depth)
208:    - Any session has been active >24h (stale lock)
209: ```
210: 
211: ---
212: 
213: ## 4. Session-Tracker Tool Cheat Sheet
214: 
215: All tool invocations use EXACT parameter names from the validated API:
216: 
217: | Goal | Invocation |
218: |------|-----------|
219: | List all sessions | `session-tracker(action: "list-sessions", limit: 20)` |
220: | Export session | `session-tracker(action: "export-session", sessionId: "ses_xxx")` |
221: | Search for aborts | `session-tracker(action: "search-sessions", query: "aborted\|active\|cancelled")` |
222: | Read project index | `read(".hivemind/session-tracker/project-continuity.json")` |
223: | Read session hierarchy | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
224: | Find last user turn | `grep(pattern: "## USER \\(turn", include: "*.md")` |
225: | Read specific section | `read(filePath, offset=N, limit=M)` — NEVER read full file |
226: 
227: ### session-tracker tool API (validated against src/tools/hivemind/session-tracker.ts):
228: 
229: | Parameter | Type | Required For |
230: |-----------|------|-------------|
231: | `action` | `"export-session" \| "list-sessions" \| "search-sessions"` | All |
232: | `sessionId` | `string` | `export-session` |
233: | `query` | `string` | `search-sessions` |
234: | `limit` | `number` (1-100, default 20) | `list-sessions`, `search-sessions` |
235: 
236: ### Response shapes:
237: - **list-sessions:** `{ total, sessions: [{ sessionId, metadata }], hasMore, indexLastUpdated }`
238: - **export-session:** `{ sessionId, content, filePath }`
239: - **search-sessions:** `{ totalMatches, sessions: [{ sessionId, file, snippet, matchLine }], hasMore }`
240: 
241: Full reference: `references/01-session-tracker-anatomy.md`
242: 
243: ---
244: 
245: ## 5. Delegation Chain Protocol
246: 
247: ### Hierarchy (non-negotiable):
248: ```
249: L0 (Orchestrator) → L1 (Coordinator) → L2 (Specialist) → [L3 conditional]
250: ```
251: 
252: ### Dispatch rules:
253: | From | To | Allowed | When |
254: |------|----|---------|------|
255: | L0 | L1 | ALWAYS | All complex tasks |
256: | L0 | L2 | NEVER | Except explicit user override |
257: | L1 | L2 | ALWAYS | Domain-specific work |
258: | L2 | L3 | CONDITIONAL | Deep research, synthesis, stack reference |
259: 
260: ### Delegation records — verify before dispatch:
261: ```
262: 1. For each delegation, check session-continuity.json:
263:    - Is there already an active child for this domain?
264:    - If yes → RESUME, don't create new.
265: 
266: 2. After dispatch, the session-tracker hook captures:
267:    - task_id (= child session ID)
268:    - agent_type (= delegatedBy)
269:    - depth (= parent depth + 1)
270: 
271: 3. When child returns, status updates to "completed" or "error"
272: ```
273: 
274: ### Resume discipline:
275: ```
276: DISCONNECTED? → Read project-continuity.json → find active → resume with task_id
277: NEVER: "Let me start a new delegation for this."
278: ALWAYS: "Let me check if there's an aborted delegation to resume."
279: ```
280: 
281: ---
282: 
283: ## 6. Quality Gate Integration
284: 
285: Every delegation must pass the quality gate triad. L0/L1 agents enforce this:
286: 
287: ```
288: DELEGATION → lifecycle gate → spec gate → evidence gate → ACCEPT
289:                                                           ↓
290:                                                      FAIL → return gaps
291:                                                               ↓
292:                                                     Max 3 retries → escalate to user
293: ```
294: 
295: ### Gate skills to load:
296: | Gate | Skill | Check |
297: |------|-------|-------|
298: | Lifecycle | `gate-l3-lifecycle-integration` | CQRS boundaries, surface authority, actor hierarchy |
299: | Spec | `gate-l3-spec-compliance` | Bidirectional traceability, gap detection, EARS acceptance |
300: | Evidence | `gate-l3-evidence-truth` | L1-L5 evidence hierarchy, no mock-only proof |
301: 
302: ### Gate enforcement:
303: ```
304: 1. Before accepting child output: run lifecycle gate
305: 2. If lifecycle PASSES: run spec compliance gate  
306: 3. If spec PASSES: run evidence truth gate
307: 4. If ALL PASS: accept child output
308: 5. If ANY FAIL: return gap report to child, max 3 fix cycles
309: 6. After 3rd failure: escalate to user with full gap report
310: ```
311: 
312: ---
313: 
314: ## 7. Context Optimization Rules
315: 
316: Agents load this skill at session start — every word costs context. Follow these rules:
317: 
318: ### Reading strategy:
319: | Situation | Tool | Example |
320: |-----------|------|---------|
321: | Find active sessions | read (small JSON) | `read(".hivemind/session-tracker/project-continuity.json")` |
322: | Find aborted delegations | read (small JSON) | `read(".hivemind/.../session-continuity.json")` |
323: | Find last user turn | grep + offset | `grep(pattern: "## USER \\(turn", include: "*.md")` |
324: | Read .md turn content | read with offset | `read(filePath, offset=200, limit=40)` |
325: | Classify large prompts | prompt-skim | `prompt-skim(content: "<prompt>", workspaceRoot: "<root>")` |
326: 
327: ### NEVER:
328: - Read full AGENTS.md files — use frontmatter via read(limit=30)
329: - Read full .md session files — use grep + offset (NEVER read all 7000 lines)
330: - Load >3 skills at once — cascade: router → primary domain skill → tool skill
331: - Read the same file twice within the same conversation turn
332: 
333: ### At 70% context:
334: ```
335: 1. Export session: session-tracker(action: "export-session", sessionId: current)
336: 2. Checkpoint: write current state to disk
337: 3. Continue with compacted context from session-tracker output
338: 4. Announce: "Context budget heavy. Checkpointed. Continuing from compacted state."
339: ```
340: 
341: ---
342: 
343: ## 8. Cross-Lineage Bridge Protocols
344: 
345: ### When to bridge (hf-* → hm-*):
346: | Need | Bridge To | Justification |
347: |------|-----------|---------------|
348: | Codebase investigation | hm-l3-detective | Pattern detection, structure mapping |
349: | Deep research | hm-l3-deep-research | Version-matched evidence gathering |
350: | Synthesis | hm-l3-synthesis | Compression, artifact creation |
351: | Spec validation | hm-l2-spec-driven-authoring | Requirements against implementation |
352: | Refactoring methodology | hm-l2-refactor | Surgical vs structural decisions |
353: 
354: ### When to bridge (hm-* → hf-*):
355: Only when explicitly routed by hf-l0-orchestrator. Never autonomously.
356: 
357: ### Documentation requirement:
358: Every cross-lineage skill load MUST be logged with justification in the return report. Format:
359: ```
360: Cross-Lineage Access: [skill-name] — [justification]
361: ```
362: 
363: ---
364: 
365: ## 9. Quick Reference: Decision Matrix
366: 
367: | Situation | Action |
368: |-----------|--------|
369: | First turn, fresh session | Classify lineage → load lineage router |
370: | Disconnected, mid-delegation | RESUME protocol (Section 3.2) |
371: | Context compacted | COMPACT SURVIVAL (Section 3.3) |
372: | Receiving task, unsure lineage | Lineage Classification (Section 2) |
373: | About to dispatch to L2 | Verify L1 exists between L0 and L2 |
374: | Child agent returns | Quality gate triad (Section 6) |
375: | Nearing context limit | Export → checkpoint → compact |
376: | Cross-lineage skill needed | Document justification |
377: | >3 skills being considered | Reduce to max 3 |
378: 
379: ---
380: 
381: ## 10. Worked Example: Disconnect Recovery
382: 
383: **Scenario:** L0-orchestrator was deep in a multi-child delegation when the user disconnected. Session `ses_1ebe832c5ffeeYuFbS1kqleZnD` has active children.
384: 
385: **Recovery:**
386: ```
387: 1. read(".hivemind/session-tracker/project-continuity.json")
388:    → Found ses_1ebe832c5ffeeYuFbS1kqleZnD: status=active
389: 
390: 2. read(".hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json")
391:    → hierarchy.children.ses_1ebe39941ffecHehSRcc13IqeD: depth=1, status=active
392:    → hierarchy.children.ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, status=active
393: 
394: 3. Both at depth=1. Pick most recently updated child.
395: 
396: 4. session-tracker(action: "export-session", sessionId: "ses_1ebe832c5ffeeYuFbS1kqleZnD")
397:    → .md content returned
398: 
399: 5. grep "## USER (turn" on exported content → found last user intent
400:    "audit the session-tracker module and report all flaws"
401: 
402: 6. task(description="resume", subagent_type="hm-l2-auditor",
403:         task_id="ses_1ebe39941ffecHehSRcc13IqeD")
404: 
405: → Resumed L2 auditor continues from where it left off.
406: → NO new session created. NO prompt repeated.
407: ```
408: 
409: ---
410: 
411: ## Anti-Patterns
412: 
413: | Anti-Pattern | Detection | Correction |
414: |-------------|-----------|------------|
415: | **The Fresh Starter** — creates new session when aborted exists | New session ID appears while active children exist | Check project-continuity.json before every new session |
416: | **The Prompt Repeater** — repeats original prompt on resume | Child agent receives duplicate user text | Use task_id resume — context is preserved, no prompt needed |
417: | **The Layer Skipper** — L0 dispatches directly to L2 | No L1 in delegation chain | Insert L1 coordinator |
418: | **The Gate Skipper** — accepts child output without quality gates | No gate skill loaded before accepting | Load gate triad (Section 6) |
419: | **The Context Hog** — reads full 7000-line session .md | Full read on .md file >1000 lines | grep + offset only |
420: | **The Multi-Loader** — loads 5+ skills at once | >3 Load Skill calls in one turn | Cascade loading: router first, then domain |
421: | **The Silent Crosser** — loads hm-* skills without documenting | hm-* skill loaded by hf-* agent without justification | Add to Cross-Lineage Access log |
422: 
423: ---
424: 
425: ## Quality Contract (HMQUAL Compliance)
426: 
427: | HMQUAL | Compliance | Evidence |
428: |--------|-----------|----------|
429: | HMQUAL-01 | Trigger phrases ≥10 | 14 trigger phrases in description |
430: | HMQUAL-02 | Self-correction with 7 anti-patterns | Fresh Starter, Prompt Repeater, Layer Skipper, Gate Skipper, Context Hog, Multi-Loader, Silent Crosser |
431: | HMQUAL-03 | Cross-references to related skills | 12 cross-referenced skills across hm/hf/gate lineages |
432: | HMQUAL-04 | Progressive disclosure | SKILL.md + 6 references/ files |
433: | HMQUAL-05 | Worked example with real session IDs | Disconnect recovery example with ses_1ebe832c5ffeeYuFbS1kqleZnD |
434: | HMQUAL-06 | IRON LAWS enforcement | 7 iron laws in prominent block at top |
435: | HMQUAL-07 | Tool API validated against source | session-tracker params validated against session-tracker.ts:57-65 |
436: 
437: ---
438: 
439: ## Reference Map
440: 
441: | File | Content |
442: |------|---------|
443: | `references/01-session-tracker-anatomy.md` | Directory structure, JSON schemas, navigation patterns |
444: | `references/02-task-tool-resume.md` | OpenCode task tool resume parameters, session ID as task_id |
445: | `references/03-lineage-routing-tree.md` | Complete hm-vs-hf decision tree with examples |
446: | `references/04-project-phase-routing.md` | Phase-to-specialist mapping for both hm and hf lineages |
447: | `references/05-continuity-navigation.md` | How to traverse project-continuity.json and session-continuity.json |
448: | `references/06-delegation-depth-recovery.md` | Multi-level recovery cascade with worked examples |

(End of file - total 448 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/AGENTS.md
# AGENTS.md — Hivefiver Meta-Builder Module

## Project Overview

Hivefiver is the **hm-meta-builder module** of the HiveMind Framework. It creates, audits, stacks, and extends OpenCode soft concepts: skills, agents, commands, tools, workflows, and references.

**This is NOT a project-builder.** That's Hiveminder's domain. Hivefiver builds the building blocks.

### The Three Entities

| Entity | Role | Boundary |
|--------|------|----------|
| **OpenCode** | Agent coding harness CLI — the platform/OS | Native capabilities: agents, commands, skills, tools, plugins |
| **HiveMind** | Parent framework wrapping OpenCode | Houses both Hivefiver + Hiveminder |
| **Hivefiver** | Meta-builder module | Creates/audits/stacks OpenCode concepts. Tests in labs, ships as TS runtime |
| **Hiveminder** | Project-builder agent lineage | Handles "let's build a NextJS app" — DO NOT TOUCH |

### What Hivefiver Delivers

- **Agent definitions** (`.md` files with YAML frontmatter, permissions, execution flows)
- **Command definitions** (thin shells referencing workflow files)
- **Skill packages** (SKILL.md + references/ + scripts/ + templates/)
- **Workflow files** (procedural logic executed by agents)
- **Reference files** (platform docs, patterns, best practices)

### Testing → Shipping Pipeline

```
.hivefiver-meta-builder/**-lab/  ← Source of truth (edit here)
        ↓ symlinks
.opencode/{agents,commands,skills}/  ← Live testing (OpenCode reads here)
        ↓ when validated
TS runtime builder (opencode-harness npm package)  ← Final shipping format
```

---

## Lab Structure

```
.hivefiver-meta-builder/
├── agents-lab/active/refactoring/     ← Agent definitions (source of truth)
├── commands-lab/active/refactoring/   ← Command definitions (source of truth)
├── skills-lab/active/refactoring/     ← Skill packages (source of truth)
├── workflows-lab/active/refactoring/  ← Workflow files (procedural logic)
├── references-lab/active/refactoring/ ← Reference docs (platform patterns)
├── plans/                             ← Implementation plans
└── orchestrator/                      ← Coordinator definitions
```

### Lab → `.opencode/` Sync

The `.opencode/` directories (`agents/`, `commands/`, `skills/`) are **standalone directories** — they contain real files, not symlinks. Changes in labs must be copied/synced to `.opencode/` for live testing.

| `.opencode/` path | Source in lab |
|---|---|
| `.opencode/agents/` | `.hivefiver-meta-builder/agents-lab/active/refactoring/` |
| `.opencode/commands/` | `.hivefiver-meta-builder/commands-lab/active/refactoring/` |
| `.opencode/skills/` | `.hivefiver-meta-builder/skills-lab/active/refactoring/` |

**Edit in labs → sync to `.opencode/` for live testing.**

---

## Agent Team

### Tier 1: Primary Agents (user interacts directly via Tab key)

| Agent | File | Role |
|-------|------|------|
| **hf-l0-orchestrator** | `.opencode/agents/hf-l0-orchestrator.md` | Meta-builder routing brain. Receives requests → classifies intent → delegates to specialists → two-stage review → reports. |
| **hf-l1-coordinator** | `.opencode/agents/hf-l1-coordinator.md` | Interactive orchestrator. Task management, delegation, parallel execution. |
| **hm-l2-conductor** | `.opencode/agents/hm-l2-conductor.md` | Command execution workhorse. Intent classification, wisdom system, delegate-task routing. |

### Tier 2: Specialist Subagents (dispatched by primaries)

| Agent | File | Role |
|-------|------|------|
| **hf-l2-skill-builder** | `.opencode/agents/hf-l2-skill-builder.md` | Creates/audits/repairs skills. Enforces agentskills.io principles. |
| **hf-l2-agent-builder** | `.opencode/agents/hf-l2-agent-builder.md` | Creates/audits/repairs agent definitions. Explicit permissions, execution flows. |
| **hf-l2-command-builder** | `.opencode/agents/hf-l2-command-builder.md` | Creates/audits/repairs commands. Non-interactive shell safety, $ARGUMENTS, !bash. |
| **hm-l2-executor** | `.opencode/agents/hm-l2-executor.md` | Atomic code implementation. Reads before writes, follows patterns. |
| **hm-l2-critic** | `.opencode/agents/hm-l2-critic.md` | Quality verification. Ruthless review, correctness validation. |
| **hm-l2-researcher** | `.opencode/agents/hm-l2-researcher.md` | Deep investigation. Evidence collection, pattern discovery. |

### Tier 3: Fast Subagents

| Agent | File | Role |
|-------|------|------|
| **explore** | ⚠️ MISSING from filesystem | Fast codebase scan. Lightweight, high-throughput. **Note:** No `explore.md` exists in `.opencode/agents/`. May need to be created or this row removed. |

### Tier 4: Prompt-Enhance Lane Agents

| Agent | File | Role |
|-------|------|------|
| **hm-l2-prompt-skimmer** | `.opencode/agents/hm-l2-prompt-skimmer.md` | Phase 0 skim for prompt-enhancement routing. |
| **hm-l2-prompt-analyzer** | `.opencode/agents/hm-l2-prompt-analyzer.md` | Deep text-quality lane for prompts. |
| **hm-l2-context-mapper** | `.opencode/agents/hm-l2-context-mapper.md` | Grounds prompt references in repo reality. |
| **hm-l2-risk-assessor** | `.opencode/agents/hm-l2-risk-assessor.md` | Flags destructive, security, and scope risks. |
| **hm-l2-context-purifier** | `.opencode/agents/hm-l2-context-purifier.md` | Distills noisy prompts without changing intent. |
| **hm-l2-prompt-repackager** | `.opencode/agents/hm-l2-prompt-repackager.md` | Produces the final YAML+XML enhanced prompt payload. |

---

## Command Set

### Hivefiver Commands (hf-*)

| Command | Agent | Purpose |
|---------|-------|---------|
| `/hf-create` | hf-l0-orchestrator | Create skill/agent/command/tool via specialist routing |
| `/hf-audit` | hf-l0-orchestrator | Audit meta-concepts for quality, overlaps, dead refs |
| `/hf-stack` | hf-l0-orchestrator | Stack 2-3 skills with loading order validation |
| `/hf-prompt-enhance` | hf-l0-orchestrator | Enhance, audit, or repack prompts via skim → bridge → lanes → assembly |

### Existing Commands (updated)

| Command | Agent | Status |
|---------|-------|--------|
| `/start-work` | hm-l2-conductor | Updated with $ARGUMENTS, bash injection, skill loading |
| `/plan` | hm-l1-coordinator | Updated with $ARGUMENTS, bash injection |
| `/ultrawork` | hm-l2-conductor | Updated with bash injection, skill loading |
| `/deep-init` | hm-l1-coordinator | Keep as-is |
| `/harness-doctor` | hm-l1-coordinator | Keep as-is |

---

## Delegation Protocol

### The Dispatch Envelope

```
Task tool (<specialist>):
  description: "Task N: [name]"
  prompt: |
    You are [role]. Your task: [FULL TASK TEXT]

    ## Context
    [Scene-setting — where this fits, why it matters]

    ## Scope
    - Include: [specific files/paths]
    - Exclude: [what NOT to touch]

    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - [Specific output requirements]
```

**NEVER pass session history to subagents. Construct exact context.**

### Status Protocol

| Status | Meaning | Action |
|--------|---------|--------|
| DONE | Complete, verified | Proceed |
| DONE_WITH_CONCERNS | Complete but doubts | Read concerns → address if correctness, note if observation |
| NEEDS_CONTEXT | Knowledge gap | Provide context → re-dispatch |
| BLOCKED | Cannot proceed | Assess: context? model? size? plan? → escalate if needed |

### Two-Stage Review

1. **Stage 1: Spec Compliance** — Does output match requirements? Nothing extra? Nothing missing?
2. **Stage 2: Code Quality** — Well-built? Clean? Following patterns?

**Stage 1 MUST pass before Stage 2.**

---

## Iron Laws

1. **NO DIRECT CREATION WITHOUT DELEGATION** — Route to specialists. Never create skills/agents/commands directly.
2. **NO STACK WITHOUT A REASON** — Max 3 skills per stack. Explain why each is needed.
3. **NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT** — Full task text, scene-setting, scope. Never session history.
4. **NO SKILL WITHOUT TRIGGER PHRASES** — Description is the only thing agents see. Must contain specific user phrases.
5. **EVERY COMMAND SURVIVES CI=true** — No TTY-dependent operations. Non-interactive shell safety.

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — creating directly | Writing SKILL.md or agent files yourself | STOP. Delegate to specialist. |
| **The Hoarder** — loading 4+ skills | Context blown, skills ignored | Max 3. Explain why each is needed. |
| **The Improviser** — ignoring routing table | Routed wrong, task failed | Trust the table. Fix the table if wrong. |
| **The Context Polluter** — passing session history | Subagent prompt includes "earlier in conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path | Paste full task text into the prompt. Always. |
| **The Hallucinator** — inventing architecture | Making assumptions without evidence | Ground in lineage. Read session exports. Verify with grep. |

---

## Worktree Strategy

| Worktree | Branch | Purpose |
|----------|--------|---------|
| `harness-experiment` | `harness-experiment` | Main development worktree. Labs + symlinks live here. |
| `hivefiver-v2` | `feature/hivefiver-agent-command-v2` | Agent+command package development. |
| `hivefiver-packs` | `feature/hivefiver-agent-command-packs` | Alternative package worktree. |

**Each worktree can have its own lab state.** Symlinks point to local labs within that worktree.

---

## Testing Workflow

1. **Edit in labs** — `.hivefiver-meta-builder/**-lab/active/refactoring/`
2. **Test via sync** — `.opencode/` directories contain live copies
3. **Validate** — Run OpenCode commands, verify agents load, check skill triggers
4. **Commit** — Changes in labs are committed to git
5. **Ship** — When validated, pack into TS runtime builder

---

## Session Recovery

If interrupted:
1. `git worktree list` — find your worktrees
2. `cd` to the right worktree
3. `git status` — see what was in progress
4. `git log --oneline -5` — see recent commits
5. Read `.hivefiver-meta-builder/plans/` for current plans
6. Resume from where you left off

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/01-session-tracker-anatomy.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/01-session-tracker-anatomy.md</path>
<type>file</type>
<content>
1: # Reference 01: Session-Tracker Anatomy
2: 
3: ## Directory Structure
4: 
5: ```
6: .hivemind/session-tracker/
7: ├── project-continuity.json              # Cross-session index
8: └── ses_<24-char-id>/                    # One per main session
9:     ├── ses_<24-char-id>.md              # Full session capture (YAML + MD)
10:     ├── session-continuity.json          # Intra-session delegation hierarchy
11:     ├── ses_<child-id>.json              # Child session (delegation level 1)
12:     └── ses_<grandchild-id>.json         # Grandchild (delegation level 2)
13: ```
14: 
15: ## project-continuity.json Schema
16: 
17: ```json
18: {
19:   "version": "2.0",
20:   "projectRoot": "<absolute-path>",
21:   "lastUpdated": "<ISO-8601>",
22:   "sessions": {
23:     "<sessionId>": {
24:       "dir": "<sessionId>/",
25:       "mainFile": "<sessionId>.md",
26:       "continuityIndex": "<sessionId>/session-continuity.json",
27:       "created": "<ISO-8601>",
28:       "updated": "<ISO-8601>",
29:       "status": "active" | "idle" | "completed" | "error",
30:       "childCount": <number>,
31:       "totalDelegationDepth": <number>
32:     }
33:   },
34:   "chronologicalOrder": ["<sessionId>", ...]
35: }
36: ```
37: 
38: ### Field Meanings
39: 
40: | Field | Meaning | Used For |
41: |-------|---------|----------|
42: | `status: "active"` | Session is running or aborted mid-delegation | Finding aborted sessions to resume |
43: | `status: "idle"` | Session alive but no active delegations | Skip in resume protocol |
44: | `status: "completed"` | Session finished cleanly | Skip in resume protocol |
45: | `status: "error"` | Session terminated with error | Skip in resume protocol |
46: | `childCount` | Number of children (delegations) | Filter for sessions with active children |
47: | `totalDelegationDepth` | Deepest delegation level | 0=no delegations, 3=max depth |
48: | `updated` | Last write timestamp | Sort to find most recent active |
49: 
50: ### Navigation Pattern — Find Aborted Sessions
51: 
52: ```
53: 1. Read project-continuity.json
54: 2. Filter: sessions with status === "active" AND childCount > 0
55: 3. Sort: by updated descending (most recent first)
56: 4. For each match: read its session-continuity.json
57: 5. Look at hierarchy.children for children with status === "active"
58: 6. The child with highest depth is the deepest aborted delegation
59: ```
60: 
61: ## session-continuity.json Schema
62: 
63: ```json
64: {
65:   "version": "2.0",
66:   "sessionID": "<sessionId>",
67:   "lastUpdated": "<ISO-8601>",
68:   "hierarchy": {
69:     "root": "<same sessionId>",
70:     "children": {
71:       "<childSessionId>": {
72:         "file": "<childSessionId>.json",
73:         "depth": <1|2>,
74:         "status": "active" | "completed" | "error",
75:         "delegatedBy": "<agent_type>",
76:         "children": {
77:           "<grandchildSessionId>": {
78:             "file": "<grandchildSessionId>.json",
79:             "depth": <2>,
80:             "status": "active" | "completed" | "error",
81:             "delegatedBy": "<agent_type>",
82:             "children": {}
83:           }
84:         }
85:       }
86:     }
87:   },
88:   "turnCount": <number>,
89:   "toolSummary": {}
90: }
91: ```
92: 
93: ### Field Meanings
94: 
95: | Field | Meaning | Used For |
96: |-------|---------|----------|
97: | `depth: 1` | Child of root (L1-level delegation) | Filter: depth=1 = L1 aborted |
98: | `depth: 2` | Grandchild (L2-level delegation) | Filter: depth=2 = L2 aborted (deeper!) |
99: | `delegatedBy` | The agent type that was dispatched | Use EXACT SAME type for resume |
100: | `status: "active"` | Child is still running / aborted | **This is what you resume** |
101: | `children` | Nested children of this child | Check for depth=2 active children |
102: 
103: ## How to Filter for the DEEPEST Active Delegation
104: 
105: ```
106: Algorithm:
107:   1. Collect all active children from ALL active sessions
108:   2. For each active child, check if it has active grand-children
109:   3. Pick:
110:      a. Highest depth first (depth=2 > depth=1)
111:      b. Most recently updated parent session (tiebreaker)
112:   4. Use the child session ID AS the task_id for resume
113: 
114: Example:
115:   session ses_A has children:
116:     child_X: depth=1, status="active" (no grandchildren)
117:     child_Y: depth=1, status="active" (has grandchild_Z: depth=2, status="active")
118:   
119:   → grandchild_Z at depth=2 is the DEEPEST active.
120:   → Resume grandchild_Z first: task(..., task_id="<grandchild_Z>")
121: ```
122: 
123: ## Session .md File Format
124: 
125: ```yaml
126: ---
127: session_id: "ses_xxxx"
128: created: "<ISO-8601>"
129: updated: "<ISO-8601>"
130: parent_session_id: null              # null = root, or parent ID
131: delegation_depth: 0                  # 0=root, 1=child, 2=grandchild
132: children:
133:   - session_id: "ses_child"
134:     child_file: "ses_child.json"
135: continuity_index: "session-continuity.json"
136: status: "active"
137: ---
138: 
139: ## USER (turn 1)
140: 
141: <user prompt content>
142: 
143: ## ASSISTANT (turn 1) — <agent_name> (<model>)
144: 
145: <assistant response>
146: 
147: ## TOOL: task(tool_id=N, description="...", subagent_type="<type>")
148: 
149: {
150:   "task_id": "ses_child_id_here"
151: }
152: ```
153: 
154: ### Key extraction points:
155: 
156: | What to find | How |
157: |-------------|-----|
158: | Last user intent | grep `"## USER \\(turn"` on .md → read last match |
159: | Last task dispatch | grep `"## TOOL: task"` on .md → read last match |
160: | Agent type for resume | From task tool call: `subagent_type` field |
161: | Task ID for resume | From task tool output: `task_id` field |
162: 
163: ## Efficient Reading Patterns
164: 
165: | Goal | Command |
166: |------|---------|
167: | Find last user turn in .md | `grep(pattern: "## USER \\(turn", include: "*.md")` |
168: | Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
169: | Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
170: | Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
171: | Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |
172: 
173: ## Anti-Pattern: Reading Full .md Files
174: 
175: **NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)
176: 
177: **ALWAYS:** Use grep to find the line number, then read with offset and limit.

(End of file - total 177 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-task-tool-resume.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/03-lineage-routing-tree.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/03-lineage-routing-tree.md</path>
<type>file</type>
<content>
1: # Reference 03: Lineage Routing Tree
2: 
3: ## Complete Decision Tree
4: 
5: ```
6: USER REQUEST RECEIVED
7:     │
8:     ├── Starts with /hf-* command?
9:     │   └── YES → hf-* lineage → load hf-l2-skill-router
10:     │
11:     ├── Starts with /plan, /ultrawork, /gsd-*?
12:     │   └── YES → hm-* lineage → load hm-l2-lineage-router
13:     │
14:     ├── About agents, skills, commands, tools?
15:     │   │
16:     │   ├── "create an agent", "add agent", "build agent"
17:     │   │   └── hf-* lineage → Agent Building domain
18:     │   │
19:     │   ├── "create a skill", "write SKILL.md", "audit skill"
20:     │   │   └── hf-* lineage → Skill Authoring domain
21:     │   │
22:     │   ├── "create a command", "add slash command"
23:     │   │   └── hf-* lineage → Command Dev domain
24:     │   │
25:     │   ├── "build a custom tool", "create OpenCode plugin"
26:     │   │   └── hf-* lineage → Tool Building domain
27:     │   │
28:     │   └── "audit skills/agents", "check drift", "refactor meta"
29:     │       └── hf-* lineage → Audit/Refactor domain
30:     │
31:     ├── About features, bugs, architecture, implementation?
32:     │   │
33:     │   ├── "research", "investigate", "find out", "explore"
34:     │   │   └── hm-* lineage → Research workflow
35:     │   │
36:     │   ├── "plan", "spec", "requirements", "design", "architect"
37:     │   │   └── hm-* lineage → Planning workflow
38:     │   │
39:     │   ├── "implement", "build", "execute", "run phase", "code"
40:     │   │   └── hm-* lineage → Execution workflow
41:     │   │
42:     │   ├── "test", "verify", "quality", "TDD", "validate"
43:     │   │   └── hm-* lineage → Quality workflow
44:     │   │
45:     │   ├── "debug", "fix", "broken", "failing", "error"
46:     │   │   └── hm-* lineage → Debug workflow
47:     │   │
48:     │   └── "review", "audit", "readiness", "deploy check"
49:     │       └── hm-* lineage → Review workflow
50:     │
51:     └── Ambiguous — can't classify?
52:         └── Use session-tracker to read last user turn
53:             └── Still ambiguous? → hm-* as default (product dev is primary)
54: ```
55: 
56: ## Decision Matrix: Action Verb → Lineage
57: 
58: | Action Verb | Lineage | Domain Bundle |
59: |-------------|---------|---------------|
60: | create, add, build (agent) | hf-* | Agent Building |
61: | create, write, audit (skill) | hf-* | Skill Authoring |
62: | create, add (command) | hf-* | Command Dev |
63: | build, create (tool/plugin) | hf-* | Tool Building |
64: | audit, drift, refactor (meta) | hf-* | Audit/Refactor |
65: | synthesize, extract (patterns) | hf-* | Synthesis |
66: | research, investigate, find | hm-* | Research |
67: | plan, spec, design, architect | hm-* | Planning |
68: | implement, build, execute, run | hm-* | Execution |
69: | test, verify, validate, TDD | hm-* | Quality |
70: | debug, fix, broken | hm-* | Debug |
71: | review, audit (code), readiness | hm-* | Review |
72: | configure, set up | hf-* or hm-* | Check subject matter |
73: 
74: ## Cross-Lineage Rules
75: 
76: ```
77: hm-* agents (STRICT):
78:   └── May load: hm-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
79:   └── May NOT load: hf-* skills (unless explicitly routed by hf-l0-orchestrator with justification)
80: 
81: hf-* agents (FLEXIBLE):
82:   └── May load: hf-* skills (always), gate-* skills (for quality), stack-* skills (for reference)
83:   └── May load: hm-* skills for codebase investigation (hm-detective, hm-deep-research, hm-synthesis)
84:                  Must document justification in return report.
85: 
86: gate-* skills (INTERNAL):
87:   └── May load: stack-* skills (for reference)
88:   └── May load: hm-* skills for inspection
89:   └── May NOT load: hf-* skills (gate skills don't create meta-concepts)
90: 
91: stack-* skills (REFERENCE):
92:   └── May load: other stack-* skills (cross-reference)
93:   └── May NOT load: hm-* or hf-* skills (stack is read-only reference)
94: ```
95: 
96: ## Command Prefix Routing
97: 
98: | Prefix | Lineage | Load |
99: |--------|---------|------|
100: | `/hf-create` | hf-* | `hf-l2-skill-router` |
101: | `/hf-audit` | hf-* | `hf-l2-skill-router` |
102: | `/hf-stack` | hf-* | `hf-l2-skill-router` |
103: | `/hf-configure` | hf-* | `hf-l2-skill-router` |
104: | `/plan` | hm-* | `hm-l2-lineage-router` |
105: | `/ultrawork` | hm-* | `hm-l2-lineage-router` |
106: | `/gsd-*` | hm-* (via GSD) | `hm-l2-lineage-router` |
107: | No prefix | Classify by intent | See decision tree above |
108: 
109: ## Examples
110: 
111: ### Example 1: "Create a skill for deep research that uses repomix"
112: - Action: "create" (meta-concept creation)
113: - Subject: "skill" (meta-concept)
114: - Verdict: **hf-* lineage → Skill Authoring domain**
115: - Load: `hf-l2-skill-router` → bundle: `hf-l2-use-authoring-skills` + `hf-l2-skill-synthesis`
116: 
117: ### Example 2: "Debug the session-tracker module — tests are failing"
118: - Action: "debug" (product dev)
119: - Subject: "session-tracker module" (source code)
120: - Verdict: **hm-* lineage → Debug domain**
121: - Load: `hm-l2-lineage-router` → bundle: `hm-l2-debug` + `hm-l2-completion-looping`
122: 
123: ### Example 3: "Audit all skills in the project for trigger phrase compliance"
124: - Action: "audit" (quality inspection)
125: - Subject: "skills" (meta-concepts)
126: - Verdict: **hf-* lineage → Audit domain**
127: - Load: `hf-l2-skill-router` → bundle: `hf-l2-use-authoring-skills` + `hf-l2-agents-md-sync` + `gate-l3-evidence-truth`
128: 
129: ### Example 4: "/hf-audit"
130: - Command prefix: `/hf-audit`
131: - Verdict: **hf-* lineage (command-driven)**
132: - Load: `hf-l2-skill-router` immediately
133: 
134: ### Example 5: "I'm not sure what workflow to use — I have a new feature idea"
135: - Action: ambiguous
136: - Subject: "feature idea" (product dev)
137: - Verdict: **hm-* lineage → Brainstorm/Panning domain**
138: - Load: `hm-l2-lineage-router` → `hm-l2-brainstorm` first
139: - If still unclear: use session-tracker to read last user turn
140: 
141: ## Edge Cases
142: 
143: ### Case 1: Meta-concept + Product-dev hybrid request
144: Example: "Build an agent that debugs the session-tracker module"
145: 
146: - Primary: "Build an agent" → hf-* (Agent Building)
147: - Secondary: "debugs session-tracker" → hm-* (Debug)
148: - Verdict: **hf-* primary** (agent creation is the meta-concept action)
149: - Load: hf-bundle first, then document hm-* cross-lineage access
150: 
151: ### Case 2: User provides a command prefix but topic is ambiguous
152: Example: "/plan create a new skill"
153: 
154: - `/plan` → hm-* lineage
155: - But "create a skill" is meta-concept → hf-* lineage
156: - Verdict: **Command prefix takes precedence** → hm-* lineage
157: - Result: hm-orchestrator will route to hm-planner, which will detect the meta-concept topic and escalate to hf lineage if needed via cross-lineage bridge
158: 
159: ### Case 3: User addresses an L2 agent directly
160: Example: "@hm-l2-auditor audit the session-tracker"
161: 
162: - Direct L2 mention: user is explicitly routing to hm-*
163: - Verdict: **hm-* lineage** (user-directed)
164: - Note: L0 should still intercept and delegate properly through L1

(End of file - total 164 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/04-project-phase-routing.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/05-continuity-navigation.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/05-continuity-navigation.md</path>
<type>file</type>
<content>
1: # Reference 05: Continuity Navigation
2: 
3: ## File Purpose Summary
4: 
5: | File | Location | Contains |
6: |------|----------|----------|
7: | `project-continuity.json` | `.hivemind/session-tracker/` | Index of ALL main sessions in the project |
8: | `session-continuity.json` | `.hivemind/session-tracker/<sessionId>/` | Delegation hierarchy WITHIN one session |
9: | `<sessionId>.md` | `.hivemind/session-tracker/<sessionId>/` | Full capture of session content (turns, tool calls) |
10: | `<childId>.json` | `.hivemind/session-tracker/<parentId>/` | Child session details |
11: 
12: ## project-continuity.json — Navigation
13: 
14: ### Read it:
15: ```json
16: {
17:   "version": "2.0",
18:   "projectRoot": "/absolute/path/to/project",
19:   "lastUpdated": "2026-05-11T12:36:32.353Z",
20:   "sessions": {
21:     "<sessionId>": {
22:       "dir": "<sessionId>/",
23:       "mainFile": "<sessionId>.md",
24:       "continuityIndex": "<sessionId>/session-continuity.json",
25:       "created": "2026-05-10T23:30:16.540Z",
26:       "updated": "2026-05-10T23:30:16.540Z",
27:       "status": "active",
28:       "childCount": 0,
29:       "totalDelegationDepth": 0
30:     }
31:   },
32:   "chronologicalOrder": ["<sessionId1>", "<sessionId2>", ...]
33: }
34: ```
35: 
36: ### How to use it:
37: ```
38: 1. Read once at power-on — small JSON, ~500 lines even with 50 sessions
39: 
40: 2. Filter active sessions:
41:    sessions where .status === "active"
42: 
43: 3. Find sessions with aborted delegations:
44:    active sessions where .childCount > 0
45: 
46: 4. Sort by recency:
47:    Sort active sessions by .updated descending
48: 
49: 5. For each candidate, read its session-continuity.json
50: ```
51: 
52: ### Status field explainer:
53: - **"active"** — Session was started but never terminated. May have aborted delegations. **CHECK FIRST.**
54: - **"idle"** — Session is alive but has no active delegations. Safe to skip.
55: - **"completed"** — Session finished successfully. Skip.
56: - **"error"** — Session failed. Skip for auto-resume. May need manual inspection.
57: 
58: ### childCount and totalDelegationDepth:
59: - `childCount: 0` → No delegations were made. Safe to skip.
60: - `childCount: >0` → Delegations exist. Check if any are still "active".
61: - `totalDelegationDepth: 0` → Root session only, no delegation tree.
62: - `totalDelegationDepth: 1` → L1 children exist.
63: - `totalDelegationDepth: 2` → L2 grandchildren exist (deepest possible).
64: 
65: ## session-continuity.json — Navigation
66: 
67: ### Read it:
68: ```json
69: {
70:   "version": "2.0",
71:   "sessionID": "<this session ID>",
72:   "lastUpdated": "2026-05-11T09:41:51.487Z",
73:   "hierarchy": {
74:     "root": "<this session ID>",
75:     "children": {
76:       "<childSessionId>": {
77:         "file": "<childSessionId>.json",
78:         "depth": 1,
79:         "status": "active",
80:         "delegatedBy": "<agent_type>",
81:         "children": {
82:           "<grandchildSessionId>": {
83:             "file": "<grandchildSessionId>.json",
84:             "depth": 2,
85:             "status": "active",
86:             "delegatedBy": "<agent_type>",
87:             "children": {}
88:           }
89:         }
90:       }
91:     }
92:   },
93:   "turnCount": 5,
94:   "toolSummary": {}
95: }
96: ```
97: 
98: ### How to traverse children:
99: ```
100: 1. hierarchy.children → map of childId → childInfo
101: 2. For each child, check .status
102: 3. Active children → need resume
103: 4. For each active child, check .children for grandchildren
104: 5. Grandchildren → deeper delegation, resume deepest first
105: ```
106: 
107: ### Find deepest active:
108: ```
109: function getDeepestActive(hierarchy):
110:   deepest = null
111:   maxDepth = -1
112: 
113:   for each child in hierarchy.children:
114:     if child.status === "active":
115:       if child.depth > maxDepth:
116:         deepest = child
117:         maxDepth = child.depth
118:       // Check grandchildren recursively
119:       for each grandchild in child.children:
120:         if grandchild.status === "active" and grandchild.depth > maxDepth:
121:           deepest = grandchild
122:           maxDepth = grandchild.depth
123: 
124:   return deepest  // { sessionId, depth, delegatedBy }
125: ```
126: 
127: ## Parent → Child Chain Tracing
128: 
129: ### Trace from root to deepest active:
130: ```
131: 1. Read project-continuity.json → find active parent sessions
132: 2. Read parent's session-continuity.json → find active children
133: 3. For each active child → check if child has its own session-continuity.json
134: 4. If child has active grandchildren → trace to grandchildren
135: 5. Deepest active = resume target
136: 
137: Example chain:
138:   ses_1ebe832c5ffeeYuFbS1kqleZnD (root, L0)
139:     ├── ses_1ebe39941ffecHehSRcc13IqeD (L1 child, depth=1, active, delegatedBy=hm-l2-auditor)
140:     └── ses_1ebd373b1ffeDa7AJ7KJIPShVE (L1 child, depth=1, active, delegatedBy=hm-l2-researcher)
141: 
142:   → Two active L1 children. Both need resume.
143:   → Resume ses_1ebe39941ffecHehSRcc13IqeD first (only one needs to run at a time for sequential dispatch)
144: ```
145: 
146: ## Real Example Walkthrough
147: 
148: ### Step 1: Read project-continuity.json
149: ```
150: read(".hivemind/session-tracker/project-continuity.json")
151: → 47 sessions, most recent: ses_1e8f5fe2fffeaOjWuQ8dOk7Z8i
152: → Most have childCount=0, status="active"
153: ```
154: 
155: ### Step 2: Filter for sessions with active children
156: ```
157: Filter: sessions with childCount > 0 AND status === "active"
158: Results (from real data):
159:   - ses_1ebe832c5ffeeYuFbS1kqleZnD: childCount=2, depth=1
160:   - ses_1e9a6ecf5ffev5trgNwpy4CjOf: childCount=5, depth=1
161:   - ses_1e97a18f0ffe4tz4GJcaLAfmC3: childCount=4, depth=1
162:   - ses_1e903ee6effet2MD0kFjZUNzug: childCount=1, depth=1
163: ```
164: 
165: ### Step 3: Check children for active status
166: ```
167: Read: ses_1e9a6ecf5ffev5trgNwpy4CjOf/session-continuity.json
168: → 5 children, ALL active, ALL depth=1
169:   - ses_1e99c28bbffek55k6UCs0G7d4N delegatedBy=main_l0_agent
170:   - ses_1e99ac4e3ffeSa0QV5dg96628Q delegatedBy=main_l0_agent
171:   - ses_1e99bd468ffetJO2iV7K2XEqmc delegatedBy=main_l0_agent
172:   - ses_1e99b195affetbGfs42YyehaEO delegatedBy=main_l0_agent
173:   - ses_1e99b6d51ffePAxZJNXXFiOv24 delegatedBy=main_l0_agent
174: 
175: → None have grandchildren. All depth=1.
176: ```
177: 
178: ### Step 4: Identify resume target
179: ```
180: No grandchildren exist. Pick the most recently updated parent session:
181:   ses_1e97a18f0ffe4tz4GJcaLAfmC3 (updated: 2026-05-11T11:24:39.541Z)
182:   → First active child: ses_1e9734971ffewoLT5pzVTcvXJk (delegatedBy=main_l0_agent)
183:   → Resume: task(description="resume", subagent_type="main_l0_agent",
184:                    task_id="ses_1e9734971ffewoLT5pzVTcvXJk")
185: ```
186: 
187: ## Field Meaning Summary
188: 
189: | Field | In File | Meaning |
190: |-------|---------|---------|
191: | `sessionId` (root key) | project-continuity.json | Main session identifier |
192: | `status` | Both files | Session state: active/idle/completed/error |
193: | `childCount` | project-continuity.json | Number of child sessions created |
194: | `totalDelegationDepth` | project-continuity.json | Max delegation depth |
195: | `hierarchy.root` | session-continuity.json | Self-reference to root session |
196: | `hierarchy.children.<id>.depth` | session-continuity.json | 1=L1 child, 2=L2 grandchild |
197: | `hierarchy.children.<id>.status` | session-continuity.json | Child state |
198: | `hierarchy.children.<id>.delegatedBy` | session-continuity.json | Agent type dispatched |
199: | `hierarchy.children.<id>.children` | session-continuity.json | Grandchildren (recursive) |
200: | `turnCount` | session-continuity.json | Number of turns in parent session |
201: | `chronologicalOrder` | project-continuity.json | All session IDs in creation order |

(End of file - total 201 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-delegation-depth-recovery.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-delegation-depth-recovery.md</path>
<type>file</type>
<content>
1: # Reference 06: Delegation Depth Recovery
2: 
3: ## Multi-Level Recovery Cascade
4: 
5: When a session disconnects mid-delegation, the recovery cascades through all levels.
6: 
7: ```
8: LEVEL 0 (L0 Orchestrator)
9:   │
10:   ├── Disconnected while L1 was running?
11:   │   └── RESUME L0 → L0 resumes L1 with task_id
12:   │
13:   └── Disconnected while L2 was running?
14:       └── RESUME L0 → L0 resumes L1 → L1 resumes L2 with task_id
15: 
16: LEVEL 1 (L1 Coordinator)
17:   │
18:   ├── Disconnected while L2 was running?
19:   │   └── RESUME L1 → L1 resumes L2 with task_id
20:   │
21:   └── Disconnected while multiple L2s were running?
22:       └── RESUME L1 → L1 resumes each L2 sequentially (one at a time)
23: 
24: LEVEL 2 (L2 Specialist)
25:   │
26:   └── L2 does NOT spawn further delegations.
27:       L2 either completes work or returns with errors.
28: ```
29: 
30: ## Cascade Protocol
31: 
32: ### For L0 Orchestrators:
33: 
34: ```
35: 1. ON POWER-ON:
36:    Read project-continuity.json
37:    Filter: sessions with status="active" AND (childCount > 0 OR totalDelegationDepth > 0)
38: 
39: 2. IF active sessions found:
40:    For each (starting with most recently updated):
41:      a. Read session-continuity.json
42:      b. Find deepest active child (highest depth with status="active")
43:      c. Record: rootSessionId, targetChildId, delegatedBy
44: 
45: 3. RESUME THE PARENT:
46:    task(description="resume", subagent_type="<your agent type>",
47:         task_id="<rootSessionId>")
48: 
49: 4. INSTRUCT THE PARENT:
50:    "You are resuming a session. Your session-continuity.json is at:
51:     .hivemind/session-tracker/<rootSessionId>/session-continuity.json
52:     Check for aborted children with status='active'.
53:     Resume them with EXACT task_id. DO NOT create new children.
54:     DO NOT repeat the prompt. Context is preserved."
55: 
56: 5. PARENT (L1) then resumes its children:
57:    task(description="resume", subagent_type="<delegatedBy>",
58:         task_id="<childSessionId>")
59: ```
60: 
61: ### For L1 Coordinators:
62: 
63: ```
64: 1. ON RESUME:
65:    Read YOUR session-continuity.json:
66:      read(".hivemind/session-tracker/<your_session_id>/session-continuity.json")
67: 
68: 2. Check hierarchy.children:
69:    For each child with status="active":
70:      a. Record: childSessionId, depth, delegatedBy
71:      b. Check if child has grandchildren with status="active"
72: 
73: 3. IF grandchildren exist (depth=2):
74:    Resume the child first → child resumes its grandchildren
75: 
76: 4. IF no grandchildren:
77:    Resume child directly:
78:      task(description="resume", subagent_type="<delegatedBy>",
79:           task_id="<childSessionId>")
80: 
81: 5. IF multiple active children (parallel dispatch):
82:    Resume them SEQUENTIALLY (one at a time)
83:    After each completes, move to next
84:    Do NOT re-parallelize on resume
85: ```
86: 
87: ## Real-World Cascade Example
88: 
89: ### Scenario: L0 dispatched L1, L1 dispatched L2. Power loss.
90: 
91: ```
92: Session tree:
93:   ses_A (L0 orchestrator, status=active)
94:     └── ses_B (L1 coordinator, status=active)
95:           └── ses_C (L2 specialist, status=active, depth=2)
96: ```
97: 
98: ### Recovery sequence:
99: 
100: ```
101: TURN 1 — User reconnects, L0 powers on:
102:   L0: Reads project-continuity.json → ses_A: status=active, depth=2
103:   L0: Reads ses_A/session-continuity.json → ses_B: depth=1, active
104:   L0: Resumes ses_A:
105:       task(description="resume", subagent_type="hm-l0-orchestrator",
106:            task_id="ses_A")
107: 
108: TURN 2 — L0 resumes in context:
109:   L0 (resumed): Instructs L1 resume
110:       "L1 coordinator — check session-continuity.json for aborted children."
111: 
112: TURN 3 — L1 checks continuity:
113:   L1: Reads ses_A/session-continuity.json → ses_B: depth=1, active
114:   L1: Reads ses_B/session-continuity.json → ses_C: depth=2, active
115:   L1: Resumes ses_B:
116:       task(description="resume", subagent_type="hm-l1-coordinator",
117:            task_id="ses_B")
118: 
119: TURN 4 — L1 resumes in context:
120:   L1 (resumed): Reads ses_B/session-continuity.json → ses_C: depth=2, active
121:   L1: Resumes L2:
122:       task(description="resume", subagent_type="hm-l2-auditor",
123:            task_id="ses_C")
124: 
125: TURN 5 — L2 resumes in context:
126:   L2 (resumed): Continues from where it left off
127:   L2: Completes work, reports to L1
128:   L1: Gate checks → accepts
129:   L1: Reports to L0
130:   L0: Reports to user
131: 
132: → 5 turns total. NO new sessions created. NO prompts repeated.
133: ```
134: 
135: ## Multi-Child Recovery Example (from real data)
136: 
137: ### Session: `ses_1ebe832c5ffeeYuFbS1kqleZnD`
138: ```
139: session-continuity.json:
140:   children:
141:     ses_1ebe39941ffecHehSRcc13IqeD: depth=1, active, delegatedBy=main_l0_agent
142:     ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, active, delegatedBy=main_l0_agent
143: ```
144: 
145: ### Recovery:
146: ```
147: 1. L0 resumes ses_1ebe832c5ffeeYuFbS1kqleZnD
148: 2. L0 checks: 2 active children at depth=1
149: 3. L0 resumes first child:
150:    task(description="resume", subagent_type="main_l0_agent",
151:         task_id="ses_1ebe39941ffecHehSRcc13IqeD")
152: 4. Child completes → L0 accepts with gates
153: 5. L0 resumes second child:
154:    task(description="resume", subagent_type="main_l0_agent",
155:         task_id="ses_1ebd373b1ffeDa7AJ7KJIPShVE")
156: 6. Child completes → L0 accepts with gates
157: 7. L0: session complete
158: 
159: → Sequential resume of parallel children. Both completed.
160: ```
161: 
162: ## Failure Modes
163: 
164: | Failure | Detection | Resolution |
165: |---------|-----------|------------|
166: | task_id expired | `task()` returns "session not found" | Export session .md, extract original prompt, create NEW dispatch with same prompt and agent type |
167: | Child session has no .json | session-continuity.json missing or empty | Search for child's .md file; if missing, treat as lost — re-dispatch |
168: | Double-resume (resumed, but child already running elsewhere) | Child returns immediately with status "already completed" | Accept the result. Do not re-dispatch. |
169: | delegatedBy is "main_l0_agent" (ambiguous) | Can't determine exact agent type | Read parent .md → find task dispatch → subagent_type field |
170: | Deep tree (depth=2 with grandchild) | Multiple levels of active children | Resume parent → parent resumes child → child resumes grandchild. Always bottom-up. |
171: 
172: ## Resume Command — Final Form
173: 
174: ```json
175: {
176:   "description": "resume",
177:   "subagent_type": "<EXACT delegatedBy from session-continuity.json>",
178:   "task_id": "<EXACT child session ID>"
179: }
180: ```
181: 
182: The `prompt` field is **intentionally omitted**. When present, it should contain only `"Resume session."` or be completely absent.
183: 
184: ## Verification Checklist After Resume
185: 
186: After a successful resume chain, verify:
187: - [ ] All active children transitioned to "completed" or "error"
188: - [ ] No new session IDs were created during resume
189: - [ ] Each child's depth matches its position in the hierarchy tree
190: - [ ] Quality gate triad was run on each child output
191: - [ ] User was informed of recovery state on return

(End of file - total 191 lines)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_IwTbDy1SLqJ8KMwp1cso2627"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_GvgNbUOVN6FgMZSNPk5t6218"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_iw2wj8IHI3HoqlETXttT3599"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_01_jbm4s8xxsEd3hknSpYIe0550"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_02_hWMyhP6de5OdqHmUXNqm4729"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_03_HCR5gUloLtpRVb9T9hOG9376"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_04_sOHzNSHFVJ5nadAXwb063788"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_o2zPdKqyYsI0nD0ZgpeR1217"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zYQ5lBHKVa2leDNQaOHR1082"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_vFeZFqkeQhIc0jtApB7p2778"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_DLVXLmMnkaJnyictQoAm2879"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_zomyZn1hERbOBn4DbcX50676"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_JT5bxJTfmK1d2H5PqPsL8319"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_Ot1DuAPh67slhKQ1JhRu6371"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_ytpOJw6GHbMxRfR2gBRl7475"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_zbegeJwW981NWfAWYChO7607"
}
```

