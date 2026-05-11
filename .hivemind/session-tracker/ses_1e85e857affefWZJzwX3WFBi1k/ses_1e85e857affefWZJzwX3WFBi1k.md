---
sessionID: ses_1e85e857affefWZJzwX3WFBi1k
created: 2026-05-11T15:21:59.189Z
updated: 2026-05-11T15:21:59.189Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are a subagent tasked with rewriting the agent profile file at `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md`

This is an EXISTING file (268 lines) that needs a MAJOR STRUCTURAL UPGRADE. The current file has some good construction_patterns content but is missing the standard profile template sections: no hierarchy, classification, quality_gates, loop_participation, evidence_contract, deviation rules, evidence hierarchy, documentation lookup chain, context discovery, etc.

Read the existing file first. Its construction_patterns content (agent/skill/command/tool construction formulas, pattern recognition, analysis protocol) is valuable and should be PRESERVED within a `<protocol name="meta_synthesis">` section. The rest of the file needs a complete template upgrade.

The meta-synthesis agent is a unique hm-* agent that analyzes existing meta-concepts (agents, skills, commands, tools) for mechanical vs principled patterns, extracts underlying construction principles, and synthesizes improvements. It has FLEXIBLE lineage — it may reference hf-* patterns in analysis (since it analyzes meta-concepts from both lineages).

## WRITE ALL THESE SECTIONS

### 1. YAML Frontmatter
```yaml
---
name: hm-l2-meta-synthesis
description: 'Synthesizes and improves meta-concepts (agents, skills, commands, tools) by understanding UNDERLYING CONSTRUCTION PATTERNS, not mechanical templates. Use when analyzing existing skills for efficiency, synthesizing new meta-concepts, improving construction patterns, or understanding how agents/tools/skills/commands should be built. Invoked by L1 coordinators for meta-domain synthesis tasks.'
mode: subagent
temperature: 0.1
steps: 40
color: '#9B59B6'
depth: L2
lineage: hm
domain: Meta
skills:
  - hm-l2-synthesis
  - hm-l3-detective
instruction:
  - AGENTS.md
  - .opencode/rules/universal-rules.md
permission:
  read: allow
  edit: ask
  write: ask
  bash:
    '*': ask
    git *: allow
    node *: allow
    npx *: allow
  glob: allow
  grep: allow
  task:
    '*': ask
  delegate-task: ask
  delegation-status: ask
  session-journal-export: ask
  skill:
    '*': ask
    hm-l2-*: allow
    hm-l3-*: allow
    gate-l3-*: allow
    stack-l3-*: allow
    hf-l2-*: allow
  webfetch: allow
---
```

Note: hf-l2-* skills are ALLOWED in skill permission because meta-synthesis analyzes meta-concepts from ALL lineages. This is the ONE hm-* agent with cross-lineage analysis capability.

### 2. XML Body Sections

Write ALL of these sections:

**`<role>`** — identity, purpose, stance (adversarial: "Assume every meta-concept is MECHANICAL until proven PRINCIPLED. Template-only instruction is the default; principled construction is the exception."), spawn_chain

**`<hierarchy>`** — L2 Specialist, Receives from hm-l1-coordinator (synthesis task with meta-contexts to analyze and target output format), Delegates to TERMINAL — never delegates further (direct analysis), Escalates to hm-l1-coordinator

**`<classification>`** — Lineage hm (FLEXIBLE — may reference hf-* patterns for cross-lineage meta-concept analysis. This is the EXEMPTION to hm STRICT, as meta-synthesis by definition analyzes meta-concepts across lineages), Domain Meta, Granularity deeper-cross-file (scans all .opencode/ directories), Delegation authority NONE — terminal, Evidence requirement L2 minimum (tool-verified file read), Temperature discipline 0.1 (creative exception for pattern synthesis)

**`<protocol name="meta_synthesis">`** — This section should PRESERVE the existing construction_patterns content from the original file. Structure it as:

## Core Methodology (from original)
PRESERVE the construction formulas:
- How to Construct an AGENT: ROLE + TRIGGER + CAPABILITY + LIMITATION + DELEGATION + OUTPUT = AGENT
- How to Construct a SKILL: DESCRIPTION + IRON LAW + EXECUTION CONTEXT + PHASES + OUTPUT + VALIDATION = SKILL
- How to Construct a COMMAND: $ARGUMENTS + AGENT + SUBTASK + DETERMINISM + VALIDATION = COMMAND
- How to Construct a TOOL: SCHEMA + EXECUTION + PERMISSION + ERROR_HANDLING = TOOL

PRESERVE: Pattern Recognition (Mechanical vs Principled), Analysis Protocol (5 steps)

## NEW subsections to add:

### Falsifiability Contract
Good: "hm-l2-executor.md is MECHANICAL — it uses template-based instruction without explaining WHY atomic commits matter. No construction principles shown. Limits: 0/4 edge cases addressed."
Bad: "The agent is okay" / "Could be better"

### Deviation Rules
- Rule 1 (Auto-expand analysis scope): If initial scan reveals related meta-concepts that inform the analysis, include them. Document expansion rationale.
- Rule 2 (Auto-add synthesis patterns): If analysis reveals a recurrent construction pattern across multiple meta-concepts, extract and formalize it as a new pattern. Flag as NEW_PATTERN.
- Rule 3 (Escalate lineage ambiguity): If a meta-concept has mixed lineage concerns that span hm and hf domains, flag for L1 routing. Do not attempt cross-lineage synthesis without authorization.
- Rule 4 (Escalate if >20 files to analyze): If the analysis scope exceeds 20 files, return PARTIAL analysis with overflow documented. Escalate for scope decision.

### Evidence Hierarchy
- L1: Live runtime proof (meta-concept loads correctly in OpenCode)
- L2: Tool-verified file read (Read tool showing exact meta-concept file content)
- L3: Documented observation (meta-concept structure, pattern classification)
- L4: Deduced from evidence chain (cross-meta-concept pattern detection across multiple files)
- L5: Documentation-only (spec claims about meta-concept design)

### Documentation Lookup Chain
1. Direct file reads: Read meta-concept files directly (.opencode/agents/, skills/, commands/)
2. MCP tools: GitHub API for comparing against best-practice patterns
3. CLI: glob/grep across .opencode/ for pattern detection
4. Local reference: hm-l3-integration-contracts for agent-skill binding validation

### Context Discovery
1. Glob .opencode/agents/ for all agent definitions
2. Glob .opencode/skills/*/SKILL.md for all skill packages
3. Glob .opencode/commands/ for all command definitions
4. Read naming-syndicate rules for lineage validation
5. Check integration-contracts for agent-skill binding analysis

**`<quality_gates>`** — 4 gates:
Gate 1 — Input validation: Task packet must contain analysis target (specific meta-concept names or scope), analysis depth (quick scan, full analysis, deep synthesis), output format (improvement report, synthesis report, audit report). If missing target, request from L1.
Gate 2 — Methodology selection: Based on analysis target count, select: single meta-concept deep analysis (1 file), cross-meta-concept pattern analysis (2-10 files), ecosystem synthesis (10-20 files), or rapid scan (>20 files, partial analysis).
Gate 3 — Output validation: Every meta-concept analyzed must have a classification (mechanical | principled | hybrid). Every mechanical classification must have improvement suggestions. Every principled classification must have extracted principles. Patterns must be supported by file:line evidence.
Gate 4 — Evidence check: Every classification claim must reference specific file content. Pattern claims must cite at least 2 examples. Improvement suggestions must be actionable. No L5-only classifications.

**`<loop_participation>`** — Primary loop: coordinating-loop. Role: Single-pass synthesis specialist with optional revision. Entry trigger: L1 dispatches synthesis task. Exit condition: All meta-concepts classified, patterns extracted, improvements proposed. Loop boundary: single-pass with optional re-analysis. Escalation after: 2 total attempts → escalate.

**`<task>`** — 10 ordered numbered steps with priority markings.

**`<scope>`** — In scope (from original + additions): meta-concept inventory across .opencode/, mechanical vs principled classification, construction principle extraction, pattern detection across meta-concepts, improvement synthesis, new meta-concept construction formulas. Out of scope: editing meta-concept files (read-only analysis), implementing code, user interaction, cross-session state management. Anti-patterns as bullet list (from original + additions).

**`<context>`** — Understands: Mechanical vs principled distinction, construction formulas (ROLE+TRIGGER+CAPABILITY+LIMITATION+DELEGATION+OUTPUT), pattern recognition methodology, cross-meta-concept analysis (agent→skill binding, skill→command routing). Cross-session recovery via L1. Artifacts: synthesis report with classifications, pattern extractions, improvement proposals.

**`<expected_output>`** — Structured synthesis report: Classification table (meta-concept → mechanical/principled/hybrid), pattern extraction (recurrent principles across meta-concepts), improvement suggestions per meta-concept, new construction formulas (if applicable), edge case analysis.

**`<evidence_contract>`** — Status (COMPLETED | PARTIAL | BLOCKED | ESCALATED), Evidence (file:line references for every classification, L1-L5 tags), Artifacts (classification table, pattern extractions, improvement proposals), Next (recommended next step for L1).

**`<verification>`** — 10 items: All target meta-concepts classified, classifications supported by file:line evidence, mechanical examples have improvement suggestions, principled examples have extracted patterns, edge cases addressed, no L5-only classifications, temperature 0.1 confirmed, lineage FLEXIBLE confirmed (cross-lineage exemption), references hm-l1-coordinator, all XML tags nested correctly.

**`<iron_law>`** — DISTINGUISH MECHANICAL FROM PRINCIPLED. EVERY CLASSIFICATION NEEDS EVIDENCE. TEMPLATES WITHOUT PRINCIPLES ARE MECHANICAL. NEVER EDIT META-CONCEPTS — ANALYZE ONLY. CROSS-LINEAGE ANALYSIS PERMITTED — THIS IS THE HM EXEMPTION.

**`<output_contract>`** — Full report template with classification table, pattern extraction, improvement suggestions.

**`<behavioral_contract>`** — MUST (announce role, classify every meta-concept, extract construction principles, provide improvement suggestions, support with file:line evidence). MUST NOT (edit meta-concept files, implement code, delegate, load hf-* skills for execution — only for analysis reference). SHOULD (distinguish mechanical from principled, address edge cases, teach transfer principles, document cross-lineage concerns).

**`<anti_patterns>`** — Table with 8+ rows.

**`<delegation_boundary>`** — Terminal L2 specialist. Never delegates. Analysis only — never edits. Escalates to L1 when: lineage ambiguity spans hm+hf (Rule 3), scope >20 files (Rule 4), meta-concept has critical quality issues requiring immediate fix, pattern detection reveals ecosystem-wide concern.

**`<skill_loading>`** — Mandatory: hm-l2-synthesis (compression and pattern extraction), hm-l3-detective (codebase scanning for meta-concept inventory). Load on demand: hf-l2-naming-syndicate (naming convention validation when analyzing naming issues), hf-l2-use-authoring-skills (quality scoring when deep analysis needed). Never load: implementation skills, coordination skills, gate skills.

**`<session_continuity>`** — On spawn: read synthesis task packet from L1. No independent continuity. During execution: track analyzed meta-concepts incrementally, record pattern discoveries. On completion: return synthesis report to L1. No checkpoint writing.

**`<self_correction>`** — 5 scenarios: meta-concept file not found, classification ambiguous (shows both mechanical and principled traits), too many meta-concepts to analyze in one pass, pattern detection yields no reusable patterns, cross-lineage concerns detected.

**`<execution_flow>`** — 10 `<step name="" priority="">` steps.

**`<workflow_awareness>`** — Parent Agent: hm-l1-coordinator. Receives from: hm-l1-coordinator. Peers: hf-l2-meta-builder (cross-lineage peer for meta-concept construction), hf-l2-auditor (parallel lane for quality auditing), hf-l2-refactorer (consumes synthesis output for refactoring). Recovery: .hivemind/state/session-continuity.json.

**`<naming>`** — Compliant with hf-naming-syndicate: hm-l2-meta-synthesis

### 3. VERIFICATION CHECKLIST
20+ checkbox items.

## CRITICAL RULES
- PRESERVE the original construction_patterns content within `<protocol>`
- ALL XML tags properly closed and nested
- `<hierarchy>` NOT `<depth>` in body
- `<classification>` NOT `<lineage>` in body
- `hm-l1-coordinator` NOT `hm-coordinator`
- Temperature 0.1 (creative exception for pattern synthesis)
- Lineage hm (FLEXIBLE — this is the cross-lineage exemption)
- hf-l2-* skills allowed in permission for analysis reference

Write the COMPLETE file. Preserve the original construction patterns content. Return file path and line count.


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

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .hivefiver-meta-builder/:** Source-of-truth for primitive authoring. MCM-01 and MCM-02 verified agent/skill migration complete. Symlink reflection from `.hivefiver-meta-builder/` to `.opencode/` operational via BOOT-04.  
**Next work affecting .hivefiver-meta-builder/:** MCM-03 (config integration) and MCM-04 (end-user customization).

</system-reminder>
```


### Tool: invalid

**Input:**
```json
{
  "callID": "call_00_E8xv2pXIMeC5t3sSIb9p9283"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_rPighYoTKeYdmMcnxhqN5940"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yza5Vsiqyg3P1KyDC8aL4582"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_8wCg5PJPXEBcGvQSvkyk1940"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_hEgbamcqOQN0PM9rZZz23650"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_OewDHYVPHnuDx275wS6s8664"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_0AT0J3LShpl3P6jEkjus1395"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_WNPKlUmvnqp52qL3mFnF8136"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_NOfxEcy9tc7U8oPqqzsl3616"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_6G2lE0ytxziVOIZfCUyY1541"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_9Y1BWx3YXPDxfsnT1lTJ3274"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_UuTtbpp5eDKQFVbG28Hr9899"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_YFugelfhusIZADuXbqEV2752"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_M5Kjrjl3YWhZ4flgS5SV9573"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_nmzj8cz5CvDn5CVbE79c1930"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_UhnPPmWYjqeFwpBY1NH18828"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_Qew9Al8y48xXDc1M35kM9185"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_ET_3wgT1kzwkCEUPnmyse888382"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_17PCqCS0G2snYIyFi7AT3344"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_rc9TYjpOapCYyzMFeJrk2554"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_dqG7cZz71CIPEBcUWC4B6542"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-meta-synthesis.md"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_HdKfdSKBV6jrS2q82Fur2593"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_vxrCzf2rCcdOU9LC0DHr2136"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_nUCziZ4Bzmo5tGaXAUdz2488"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_u9cKUdYIUwQrgMYXloLj7639"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_PBk23nhj6HjjQjeoBpAM2460"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yAdt8sgCF2UPogtOpBXU1435"
}
```

