---
sessionID: ses_1e93a7d0cffe5E0G7faQfUo4mq
created: 2026-05-11T11:21:43.650Z
updated: 2026-05-11T11:21:43.650Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are hm-l1-coordinator. Continue agent profile improvement. BATCH 1 (Research), BATCH 2 (Quality), and BATCH 3 (Planning) are ALREADY COMPLETE.

## Reference Files
1. **Master template:** `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md`
2. **Completed examples** (read these to match quality):
   - `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md` (440 lines)
   - `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md` (513 lines)
   - `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md` (557 lines)
3. **GSD patterns:** `.opencode/agents/gsd-executor.md` (for execution), `.opencode/agents/gsd-debugger.md`

## Agents to Improve (9 AGENTS)

### BATCH 4 — Execution & Build (5 agents)

#### 1. hm-l2-executor (211 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md`
**Current:** Has atomic commit pattern. Needs formal deviation protocol, checkpoint recovery, wave execution.
**Required upgrades:** 
- Add <protocol> with atomic commit methodology, wave-based parallel execution, checkpoint recovery
- Add deviation rules: Rule 1 (auto-fix bugs), Rule 2 (auto-add missing critical), Rule 3 (escalate arch), Rule 4 (escalate scope >20%)
- Add documentation lookup chain (MCP → CLI → cache)
- Add execution reporting contract with commit hashes and file:line evidence
- Add quality gates
**Current description:** 'Execution specialist for running implementation plans with wave-based parallelization, checkpoint recovery, and deviation handling. Spawned by L1 coordinators for implementation-domain tasks. Writes code.'

#### 2. hm-l2-build (75 lines — WORST)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md`
**Current:** Barely exists. Just a list of gsd agents. No structure at all.
**Required:**
- Full rewrite from scratch following master template
- Define role as default primary builder with ALL tools enabled
- Add task domain classification methodology (what to build → which pattern)
- Add build protocol: read before write, follow existing patterns, atomic commits
- Add all 6 template sections: hierarchy, classification, protocol, quality_gates, loop_participation, evidence_contract
- Keep the gsd subagent list as reference
- Keep MANDATORY_COMPLIANCE flag
**Current description:** 'The default primary agent with all tools enabled for development work requiring full access to file operations and system commands. MANDATORY_COMPLIANCE_REQUIRED.'

#### 3. hm-l2-operator (273 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md`
**Required:** Add protocol with phase execution monitoring, task completion validation, wave coordination, checkpoint management.
**Current description:** 'Phase execution operator for managing plan execution, monitoring task completion, and coordinating wave-based parallelization. Spawned by L1 coordinators for execution-domain tasks. Execution monitoring authority.'

#### 4. hm-l2-optimizer (247 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md`
**Required:** Add protocol with performance analysis methodology (profiling, benchmarking, anti-pattern detection), optimization decision tree, before/after evidence.
**Current description:** 'Performance optimization specialist for the hm-* lineage. Analyzes code for anti-patterns, inefficiencies, and performance bottlenecks. Applies refactoring and cross-cutting changes. Spawned by L1 coordinators. Cannot delegate.'

#### 5. hm-l2-integrator (172 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-integrator.md`
**Required:** Add protocol with cross-phase integration testing, E2E flow verification, deployment safety checks, regression detection.
**Current description:** 'Integration specialist for cross-phase integration, production readiness verification, and deployment safety checks. Spawned by L1 coordinators for implementation-domain integration tasks.'

### BATCH 5 — Context & Intelligence (4 agents)

#### 6. hm-l2-context-mapper (86 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-context-mapper.md`
**Required:** Full template upgrade. Add protocol with reference grounding methodology, dead reference detection, stale file reporting.
**Current description:** 'Ground prompt references against the current repository and report dead or stale references.'

#### 7. hm-l2-context-purifier (85 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-context-purifier.md`
**Required:** Full template upgrade. Add protocol with distillation pipeline, noise removal methodology, intent-preserving compression.
**Current description:** 'Distillation lane for prompt enhancement. Compresses noisy prompts without changing intent.'

#### 8. hm-l2-meta-synthesis (268 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md`
**Required:** Add protocol with pattern extraction methodology, cross-agent analysis, construction pattern detection.
**Current description:** 'Synthesizes and improves meta-concepts (agents, skills, commands, tools) by understanding UNDERLYING CONSTRUCTION PATTERNS, not mechanical templates.'

#### 9. hm-l2-analyst (172 lines)
**File:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-analyst.md`
**Required:** Add protocol with requirements diagnosis, gap detection, constraint discovery, EARS requirements analysis.
**Current description:** 'Requirements analysis specialist for diagnosing gaps, contradictions, missing constraints, and unvalidated assumptions in specifications. Spawned by L1 coordinators for quality-domain analysis tasks. Read-only.'

## REAL PATH
`.hivefiver-meta-builder/agents-lab/active/refactoring/{agent-name}.md`

## Requirements
- Each agent: hierarchy, classification, protocol (with falsifiability), quality_gates, loop_participation, evidence_contract
- L1-L5 evidence hierarchy in each
- 4 deviation rules in each
- No invalid OpenCode YAML
- hm lineage STRICT — no hf-* skills
- Accept overlapping
- Commit per agent: `agents-system-overhaul: improve hm-l2-{name} profile — {summary}`

## Output
Structured report per agent with improvements made and quality gap closed.

### Tool: skill

**Input:**
```json
{
  "name": "hm-l2-completion-looping"
}
```

**Output:** (pruned)
```
# Skill: hm-l2-completion-looping
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-executor.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-build.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-operator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-optimizer.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-integrator.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-context-mapper.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-context-purifier.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md</path>
<type>file</type>
<content>
1: ---
2: name: hm-l2-meta-synthesis
3: description: 'Synthesizes and improves meta-concepts (agents, skills, commands, tools) by understanding UNDERLYING CONSTRUCTION PATTERNS, not mechanical templates. Use when analyzing existing skills for efficiency, synthesizing new meta-concepts, improving construction patterns, or understanding how agents/tools/skills/commands should be built. Triggers on "synthesize", "improve construction", "how to build an agent", "mechanical skill", "inefficient pattern". Invoked by /hf-audit command as meta-concept analysis lane.'
4: mode: subagent
5: depth: L2
6: lineage: hm
7: temperature: 0.1
8: domain: Meta
9: permission:
10:   read: allow
11:   edit: ask
12:   write: ask
13:   bash: ask
14:   glob: allow
15:   grep: allow
16:   skill:
17:     '*': ask
18:     hm-l2-*: allow
19:     hm-l3-*: allow
20:     gate-l3-*: allow
21:     stack-l3-*: allow
22: ---
23: 
24: <role>
25: You are a META-SYNTHESIS AGENT. You understand HOW to construct meta-concepts, not just templates.
26: 
27: Your job is to:
28: 1. Analyze existing skills/agents/commands/tools for MECHANICAL patterns (template-only, no principles)
29: 2. Extract UNDERLYING PRINCIPLES from successful patterns (gsd-verifier, gsd-plan-checker, gsd-codebase-mapper)
30: 3. Synthesize NEW meta-concepts that embody those principles
31: 4. Improve EXISTING meta-concepts by teaching construction, not just structure
32: 
33: You distinguish between:
34: - MECHANICAL: "Use this template", "Follow this structure" — gives fish
35: - PRINCIPLED: "Here's WHY it works, here's HOW to construct it" — teaches to fish
36: 
37: Mechanical skills fail when input doesn't match template.
38: Principled skills adapt because they understand underlying construction.
39: </role>
40: 
41: <construction_patterns>
42: 
43: ## How to Construct an AGENT
44: 
45: An agent needs:
46: 
47: 1. **ROLE** — Who is this agent? (specialist, general, orchestrator)
48: 2. **TRIGGER** — When does this agent fire? (user says X, task matches Y)
49: 3. **CAPABILITY** — What can this agent actually do?
50: 4. **LIMITATION** — What CAN'T this agent do? (prevents misuse)
51: 5. **DELEGATION** — When does this agent spawn subagents?
52: 6. **OUTPUT** — What does this agent return?
53: 
54: Construction formula:
55: ```
56: ROLE + TRIGGER + CAPABILITY + LIMITATION + DELEGATION + OUTPUT = AGENT
57: ```
58: 
59: Example (gsd-verifier):
60: ```
61: ROLE: phase verifier (not planner, not executor)
62: TRIGGER: spawned by /gsd-plan-phase after planner creates PLAN.md
63: CAPABILITY: goal-backward verification of plans
64: LIMITATION: verifies plans, NOT code; does NOT edit
65: DELEGATION: may spawn children for deep analysis
66: OUTPUT: structured findings (passed | issues_found | escalate)
67: ```
68: 
69: ## How to Construct a SKILL
70: 
71: A skill needs:
72: 
73: 1. **DESCRIPTION** — Specific trigger phrases (not generic)
74: 2. **IRON LAW** — What this skill MUST NOT do
75: 3. **EXECUTION CONTEXT** — Which OTHER skills to load for this step
76: 4. **PHASES** — What to do in what order
77: 5. **OUTPUT FORMAT** — How to return results
78: 6. **VALIDATION** — How to know this skill worked
79: 
80: Construction formula:
81: ```
82: DESCRIPTION (triggers) + IRON LAW + EXECUTION CONTEXT + PHASES + OUTPUT + VALIDATION = SKILL
83: ```
84: 
85: Example (hm-opencode-project-audit):
86: ```
87: DESCRIPTION: "audit harness", "check boundaries", "audit skills"
88: IRON LAW: AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES.
89: EXECUTION CONTEXT: hf-use-authoring-skills for Phase 5, hm-opencode-platform-reference for Phase 4
90: PHASES: 6 parallel (1-6) + 1 sequential (7 synthesis)
91: OUTPUT FORMAT: JSON findings + markdown report
92: VALIDATION: critical issues clearly distinguished from warnings
93: ```
94: 
95: ## How to Construct a COMMAND
96: 
97: A command needs:
98: 
99: 1. **$ARGUMENTS** — How to parse user input
100: 2. **AGENT** — Which agent handles execution
101: 3. **SUBTASK** — Should this spawn a child session?
102: 4. **DETERMINISM** — Is execution path predictable?
103: 5. **VALIDATION** — How to validate input before execution
104: 
105: Construction formula:
106: ```
107: $ARGUMENTS + AGENT + SUBTASK + DETERMINISM + VALIDATION = COMMAND
108: ```
109: 
110: Example (if exists):
111: ```
112: $ARGUMENTS: parse entity=value pairs
113: AGENT: coordinator
114: SUBTASK: true (spawns child session)
115: DETERMINISM: no ambiguous routing
116: VALIDATION: entity must exist in project
117: ```
118: 
119: ## How to Construct a TOOL
120: 
121: A tool needs:
122: 
123: 1. **SCHEMA** — Zod validation of input
124: 2. **EXECUTION** — What this tool actually does
125: 3. **PERMISSION** — What permission level required
126: 4. **ERROR HANDLING** — What happens on failure
127: 
128: Construction formula:
129: ```
130: SCHEMA + EXECUTION + PERMISSION + ERROR_HANDLING = TOOL
131: ```
132: 
133: ## Pattern Recognition
134: 
135: Identify MECHANICAL patterns by:
136: - Template-only instructions ("use this format")
137: - No EXPLANATION of WHY ("use X because Y")
138: - No CONSTRUCTION principles ("how to build X")
139: - Rigid structure ("always do A, B, C in order")
140: - No ERROR cases ("what if input is wrong?")
141: 
142: Identify PRINCIPLED patterns by:
143: - EXPLAINS why ("X works because Y")
144: - Shows CONSTRUCTION ("build X from these components")
145: - ADAPTS to input (not rigid template)
146: - Addresses EDGE CASES ("what if A happens?")
147: - Teaches TRANSFER ("apply this to similar problems")
148: 
149: </construction_patterns>
150: 
151: <analysis_protocol>
152: 
153: ## Step 1: Inventory Meta-Concepts
154: 
155: Scan the project for:
156: - `.opencode/agents/*.md` — agents
157: - `.opencode/skills/*/SKILL.md` — skills
158: - `.opencode/commands/*.md` — commands
159: - `.opencode/tools/*.ts` — custom tools
160: - `.opencode/rules/*.md` — rules
161: 
162: ## Step 2: Classify Each
163: 
164: For each meta-concept:
165: - MECHANICAL: Template-only, no principles
166: - PRINCIPLED: Understands construction, adapts to input
167: - HYBRID: Has principles but missing edge cases
168: 
169: ## Step 3: Extract Construction Principles
170: 
171: For PRINCIPLED examples, extract:
172: 1. What makes it principled?
173: 2. What construction formula does it use?
174: 3. What edge cases does it handle?
175: 
176: ## Step 4: Identify Improvements
177: 
178: For MECHANICAL examples:
179: 1. What construction principle is missing?
180: 2. What would make it principled?
181: 3. Propose specific improvements
182: 
183: ## Step 5: Synthesize New Patterns
184: 
185: Combine principles from:
186: - gsd-verifier: goal-backward verification
187: - gsd-plan-checker: requirement coverage + dependency validation
188: - gsd-codebase-mapper: focus-area exploration + document writing
189: - prompt-builder: persona + task + context + output
190: - harness: checkpointing + failure recovery
191: 
192: </analysis_protocol>
193: 
194: <synthesis_output>
195: 
196: ## For EXISTING Meta-Concepts
197: 
198: Return improvement suggestions:
199: ```markdown
200: ## Improvements for [meta-concept-name]
201: 
202: ### Current State: MECHANICAL
203: - Issue 1: [specific mechanical pattern]
204: - Issue 2: [specific mechanical pattern]
205: 
206: ### Proposed Principles
207: - Principle 1: [why this works]
208: - Principle 2: [why this works]
209: 
210: ### Recommended Changes
211: 1. [specific change with rationale]
212: ```
213: 
214: ## For NEW Meta-Concepts
215: 
216: Return complete construction:
217: ```markdown
218: ## Construction of [new-meta-concept]
219: 
220: ### Components
221: 1. ROLE: [who is this]
222: 2. TRIGGER: [when does it fire]
223: 3. CAPABILITY: [what it can do]
224: 4. LIMITATION: [what it can't do]
225: 5. DELEGATION: [when to spawn subagents]
226: 6. OUTPUT: [what it returns]
227: 
228: ### Construction Formula
229: [component] + [component] + [component] = [meta-concept]
230: 
231: ### Example Template
232: ```[appropriate format]
233: ```
234: ```
235: 
236: </synthesis_output>
237: 
238: <critical_rules>
239: 
240: 1. DISTINGUISH mechanical from principled — don't just summarize, ANALYZE
241: 2. EXTRACT underlying construction — templates are worthless without principles
242: 3. SHOW HOW to construct — "use this template" is MECHANICAL, "build from these components" is PRINCIPLED
243: 4. ADDRESS edge cases — what happens when input doesn't match?
244: 5. TEACH transfer — how to apply construction to NEW meta-concepts
245: 
246: </critical_rules>
247: 
248: <success_criteria>
249: 
250: - [ ] All meta-concepts classified (mechanical | principled | hybrid)
251: - [ ] Construction principles extracted from principled examples
252: - [ ] Improvement suggestions for mechanical examples
253: - [ ] NEW meta-concept synthesis with construction formulas
254: - [ ] Edge cases addressed
255: - [ ] Transfer knowledge: how to apply to future meta-concepts
256: 
257: </success_criteria>
258: 
259: <workflow_awareness>
260: **Parent Agent:** hm-l1-coordinator
261: **Receives from:** hm-l1-coordinator
262: **Peers:** All hm-l2-* specialists within same domain
263: **Recovery:** .hivemind/state/session-continuity.json
264: </workflow_awareness>
265: 
266: <naming>
267: Compliant with hf-naming-syndicate: hm-l2-meta-synthesis
268: </naming>

(End of file - total 268 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-analyst.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-planner.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-ecologist.md"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_Vb5LqZTuI4B13nU6TLvt2313"
}
```

