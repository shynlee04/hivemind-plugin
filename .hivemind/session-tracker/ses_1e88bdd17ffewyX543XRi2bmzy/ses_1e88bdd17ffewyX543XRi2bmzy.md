---
sessionID: ses_1e88bdd17ffewyX543XRi2bmzy
created: 2026-05-11T14:32:27.638Z
updated: 2026-05-11T14:32:27.638Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hf-l2-skill-builder. You are refining the `hivemind-power-on` governance skill with two improvements.

## IMPROVEMENT 1: ALWAYS RESUME — Remove "active-only" filter from ref-02

**Problem:** The current ref-02 protocol filters for children with `status: "active"`. Overthinking models see a child with `status: "completed"` or no status field and rationalize: "this is done, skip it." This is WRONG because:
- Session context is ALWAYS preserved on disk regardless of status
- If the child is truly completed, `task(task_id="<id>")` returns the result immediately (no harm)
- If the child is in any other state, resuming continues from where it left off
- The agent CANNOT determine completion state from the JSON — only the runtime knows

**Change required:** Update ref-02 (§1 STEP 1) to remove the "active" filter. The rule becomes:
```
ALL children in hierarchy.children → resume them all.
Completed ones return instantly. Non-completed ones continue.
```

Update the phrasing from:
```
Find child with status: "active"
```
To:
```
Find ALL children. Do NOT filter by status. Resume every child.
If a child is truly completed, task(task_id) returns immediately.
If a child is in any other state, it continues from where it left off.
The agent CANNOT determine completion from JSON — only the runtime.
```

Also update the iron laws in SKILL.md and the cascade protocol in ref-02 §3.

## IMPROVEMENT 2: Session-Tracker Tool Fallback Strategies

**Problem:** The `session-tracker` tool may not work as expected, may use wrong tools, or may extract too much context. Agents need fallback strategies using bash, grep, glob, regex.

**Change required:** 
1. Append a new §7 to `references/06-session-tracker-manual.md` called "§7 — Tool Fallback Strategies"
2. Update the routing table in SKILL.md if needed to reference it

The new §7 must cover these fallback approaches, each with exact bash/grep/glob/regex commands:

```
FALLBACK 1: Direct bash navigation (when session-tracker tool broken)
  List sessions:   bash("ls .hivemind/session-tracker/")
  Read index:      bash("cat .hivemind/session-tracker/project-continuity.json")
  Read hierarchy:  bash("cat .hivemind/session-tracker/<id>/session-continuity.json")
  Search JSON:     grep(pattern: '"status":\\s*"active"', path: ".hivemind/session-tracker/", include: "*.json")
  List children:   glob(pattern: "*.json", path: ".hivemind/session-tracker/<id>/")

FALLBACK 2: Grep-based search (when session-tracker search-sessions broken)
  Find aborted:    grep(pattern: "status.*active|cancelled|aborted", include:"session-continuity.json", path:".hivemind/session-tracker/")
  Find user turns: grep(pattern: "## USER \\\\(turn", include:"*.md", path:".hivemind/session-tracker/<id>/")
  Find task_ids:   grep(pattern: "task_id:", include:"*.md", path:".hivemind/session-tracker/<id>/")

FALLBACK 3: Efficient reading (when session-tracker export-session is too heavy)
  NEVER read full .md files — use offset/limit:
    read(filePath, offset=1, limit=30) — read frontmatter only
    grep for "## USER" → get line number → read(filePath, offset=N, limit=30)
  Read JSON files fully (they are small ~20-50 lines):
    read(filePath) — full JSON is fine, MD is not

FALLBACK 4: Python one-liner (for complex JSON filtering)
  bash("node -e \"const j=require('./.hivemind/session-tracker/project-continuity.json'); Object.entries(j.sessions).filter(([k,v])=>v.status==='active').forEach(([k])=>console.log(k))\"")
  bash("node -e \"const j=require('./.hivemind/session-tracker/<id>/session-continuity.json'); Object.entries(j.hierarchy.children||{}).forEach(([k,v])=>console.log(k, v.status, v.depth))\"")
```

**Edge cases covered:**
- Forked sessions: session ID doesn't match directory name → use `ls` to verify
- Incorrect indexing: project-continuity.json has stale entries → verify dir exists: `bash("test -d .hivemind/session-tracker/<id> && echo EXISTS")`
- Missing session-continuity.json: directory exists but no index → read child .json files directly
- Wrong tool extracting too much context: use `session-tracker` with export → trim output with grep instead of full read

**Also add a new §X (quick reference) to the SKILL.md cheat sheet:**

```
FALLBACK (when session-tracker tool fails):
  list sessions:          bash("ls .hivemind/session-tracker/")
  read index:             read(".hivemind/session-tracker/project-continuity.json")
  find active children:   grep(pattern: '"status".*"active"', path: ".hivemind/session-tracker/<id>/", include: "session-continuity.json")
  node filter:            bash("node -e \"require('./.hivemind/session-tracker/<id>/session-continuity.json').hierarchy.children\"")
```

## EXECUTION

1. Read the current `.hivefiver-meta-builder/skills-lab/hivemind-power-on/SKILL.md`
2. Read the current `.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-session-resume-protocol.md`
3. Read the current `.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-session-tracker-manual.md`
4. Make the changes described above
5. Keep SKILL.md under 140 lines
6. Do NOT change the symlink — it auto-propagates
7. Return: lines changed, files modified, confirmation that all jump links still resolve

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
4:   MUST-LOAD governance for L0/L1 agents. Routes hm/hf lineage, 
5:   manages session lifecycle, enforces quality gates, optimizes context. 
6:   Load FIRST. Triggers: session start, resume, disconnect, compact.
7: version: 1.0.0
8: lineage: hivemind
9: load_priority: 1
10: consumed-by:
11:   - hm-l0-orchestrator
12:   - hf-l0-orchestrator
13:   - hm-l1-coordinator
14:   - hf-l1-coordinator
15:   - hm-l2-conductor
16:   - hf-l2-meta-builder
17: allowed-tools:
18:   - skill
19:   - read
20:   - grep
21:   - glob
22:   - bash
23:   - task
24:   - todowrite
25:   - session-tracker
26:   - prompt-skim
27:   - prompt-analyze
28:   - hivemind-doc
29: ---
30: 
31: # Hivemind Power-On — Session Governance
32: 
33: ## IRON LAWS — READ BEFORE YOU THINK
34: 
35: **ABORTED ≠ CANCELLED. ABORTED = DISCONNECTED. CONTEXT IS INTACT ON DISK. RESUME WITH EXACT ID.**
36: 
37: ```
38: 1. IF session-tracker shows ANY active/aborted child delegation → RESUME IT.
39:    DO NOT THINK. DO NOT DECIDE. DO NOT CREATE NEW. task(task_id="<EXISTING ID>")
40: 2. NEVER repeat prompt when resuming → context is preserved on disk
41: 3. NEVER L0→L2 dispatch → always L0→L1→L2
42: 4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
43: 5. NEVER load >3 skills at once → context budget is shared
44: 6. NEVER read full files when grep/offset works → line-aware reading
45: 7. L0 resumes L1 → L1 resumes L2 → L2 continues. Cascade ALWAYS flows down.
46: ```
47: 
48: **The session-tracker IS the authority. If it says a delegation exists, the delegation exists. Its ID is the ONLY valid task_id.**
49: 
50: ## ROUTING TABLE
51: 
52: | Signal | Route To | Depth |
53: |--------|----------|-------|
54: | `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
55: | `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
56: | Disconnect recovery, session resume (ABORTED ≠ CANCELLED) | → MECHANICAL RESUME — no thinking, just execute | [ref-02 §1] |
57: | Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
58: | L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
59: | Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
60: | Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |
61: 
62: ## QUICK REFERENCE — Session-Tracker Cheat Sheet
63: 
64: ```
65: find all sessions:     session-tracker({action:"list-sessions"})
66: export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
67: search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
68: read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
69: read project index:    read(".hivemind/session-tracker/project-continuity.json")
70: grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
71: ```
72: 
73: Full tool API reference: [ref-06 §1]
74: 
75: ## REFERENCE MAP
76: 
77: ```
78: references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
79: references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
80: references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
81: references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
82: references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
83: references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
84: ```
85: 
86: ## ASSET BUNDLES
87: 
88: | Agent Type | Load | Why |
89: |------------|------|-----|
90: | **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
91: | **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
92: | **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
93: | **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
94: | **Post-compact (any)** | ref-03 + ref-06 | survive + track |
95: | **Lineage ambiguous** | ref-01 | routing decision tree |
96: 
97: ## ESCALATION RULES
98: 
99: ```
100: - 3 consecutive gate failures → escalate to user with full gap report
101: - Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
102: - session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
103: - task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
104: ```
105: 
106: ## LIFECYCLE SUMMARY
107: 
108: ```
109: POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
110: DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
111: COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
112: L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
113: ```
114: 
115: ## CRITICAL LOADING ORDER
116: 
117: ```
118: hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
119: ```
120: 
121: > **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
122: > **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.

(End of file - total 122 lines)
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
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-session-resume-protocol.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-session-resume-protocol.md</path>
<type>file</type>
<content>
1: # Reference 02: Session Resume Protocol
2: 
3: > **Jump targets:** [ref-02 §1]–[ref-02 §5]
4: 
5: ## ⚠️ STOP. READ THIS BEFORE ANYTHING ELSE.
6: 
7: **"Aborted" status in session-tracker DOES NOT mean the user cancelled the task. It means the CONNECTION was lost. The subagent's ENTIRE state — prompt, turns, tool calls, files — is PRESERVED on disk. The task_id IS the session ID. Resuming with task_id restores EVERYTHING. There is NO scenario where you "start fresh" when an active/aborted delegation exists.**
8: 
9: If you see "aborted" and your first thought is "start a new task," you are WRONG.
10: The session-tracker data is the TRUTH. The .json says the session exists → you resume it. Period.
11: 
12: ## §1 — MECHANICAL RESUME (No decisions. No thinking. Execute.)
13: 
14: **Trigger:** You see a session-tracker child with `status: "active"`. Or the user just reconnected.
15: 
16: ```
17: STEP 0 — READ THE INDEX
18:   read(".hivemind/session-tracker/project-continuity.json")
19:   → Find the most recently updated session.
20:   → If none with status "active" → go to §2 (fresh start).
21: 
22: STEP 1 — READ THE HIERARCHY  
23:   read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
24:   → Look at hierarchy.children
25:   → Find child with status: "active"
26:   → Record: childId = that child's key
27:   → Record: delegatedBy = that child's delegatedBy field
28: 
29: STEP 2 — RESUME (the ONLY valid action)
30:   task(
31:     description = "resume",
32:     subagent_type = "<EXACT delegatedBy value>",
33:     task_id = "<childId>"
34:   )
35:   
36:   That's it. No other parameters. No "prompt" field. No thinking.
37: ```
38: 
39: **If you create a NEW task(task_id="<new>") instead of the above, you have FAILED the protocol.**
40: 
41: ## §2 — THE TASK TOOL: EXACT PARAMETERS
42: 
43: The `task` tool resumes an existing session when `task_id` matches. The agent SEES its prior conversation. NO prompt needed.
44: 
45: ```
46: task(
47:   description = "resume",          // REQUIRED. Use "resume" literally.
48:   subagent_type = "<delegatedBy>",  // REQUIRED. Copy exactly from session-continuity.json.
49:   task_id = "<sessionId>"           // REQUIRED. The child's session ID from the .json key.
50: )
51: ```
52: 
53: **DO NOT include `prompt`. DO NOT include "args". DO NOT include anything else.**
54: 
55: If the platform forces a non-empty prompt: use the literal string `"Resume session."` — nothing more.
56: 
57: ### Where to find delegatedBy
58: 
59: Read the child entry in `session-continuity.json`:
60: 
61: ```json
62: {
63:   "hierarchy": {
64:     "children": {
65:       "ses_1ebe39941ffecHehSRcc13IqeD": {
66:         "file": "ses_1ebe39941ffecHehSRcc13IqeD.json",
67:         "depth": 1,
68:         "status": "active",
69:         "delegatedBy": "hm-l2-auditor",
70:         "children": {}
71:       }
72:     }
73:   }
74: }
75: ```
76: 
77: → `subagent_type = "hm-l2-auditor"` (the exact string from delegatedBy)
78: → `task_id = "ses_1ebe39941ffecHehSRcc13IqeD"` (the child's session ID key)
79: 
80: If `delegatedBy` is `"main_l0_agent"` (ambiguous), read the child's `.json` file to find `delegated_by.agent_name` or `delegated_by.subagent_type`.
81: 
82: ## §3 — THE CASCADE: L0→L1→L2 MUST FLOW
83: 
84: When you resume a parent session, you MUST also instruct it to resume ITS children.
85: 
86: ### L0 orchestrator power-on sequence:
87: 
88: ```
89: 1. Read project-continuity.json → find your session
90: 2. Read your session-continuity.json → find active L1 child
91: 3. Resume L1: task(task_id="<L1_childId>", subagent_type="<delegatedBy>")
92: 4. IN YOUR RESUME PROMPT to L1, include this exact instruction:
93: 
94:    "You are resuming as L1 coordinator. On spawn:
95:     1. Read YOUR session-continuity.json at 
96:        .hivemind/session-tracker/<your-session-id>/session-continuity.json
97:     2. Find ALL children with status='active'
98:     3. Resume each with EXACT task_id:
99:        task(description='resume', subagent_type='<delegatedBy>', task_id='<childId>')
100:     4. DO NOT create new delegations for work already dispatched."
101: ```
102: 
103: ### L1 coordinator resume sequence:
104: 
105: ```
106: 1. Read your session-continuity.json
107: 2. Find ALL children with status="active"
108: 3. For each, extract: { sessionId, delegatedBy }
109: 4. Resume sequentially (NOT parallel):
110:    task(description="resume", subagent_type="<delegatedBy>", task_id="<sessionId>")
111: 5. Collect results from each
112: 6. Run quality gates on each result
113: 7. Return consolidated results to L0
114: ```
115: 
116: ### REAL cascade with REAL IDs:
117: 
118: ```
119: Session tree on disk:
120:   ses_1ebe832c5ffeeYuFbS1kqleZnD (L0 orchestrator, active)
121:     ├── ses_1ebe39941ffecHehSRcc13IqeD (L1, depth=1, active, delegatedBy=main_l0_agent)
122:     │     └── ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2, depth=2, active)
123:     └── ses_1ebd373b1ffeDa7AJ7KJIPShVE (L1, depth=1, active, delegatedBy=main_l0_agent)
124: 
125: Execution (5 turns):
126:   T1: L0 resumes ses_1ebe39941ffecHehSRcc13IqeD with instruction cascade
127:   T2: L1 spawns, reads its session-continuity → finds ses_1ebe28c52ffeIoXFCcAZnCj0IC active
128:   T3: L1 resumes ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2)
129:   T4: L2 completes work → returns to L1
130:   T5: L1 resumes ses_1ebd373b1ffeDa7AJ7KJIPShVE (second child) → completes → returns to L0
131: ```
132: 
133: **NO new session IS EVER created. NO prompt IS EVER repeated.**
134: 
135: ## §4 — VERIFICATION: DID YOU DO IT RIGHT?
136: 
137: After resume, verify:
138: 
139: | Check | How | Pass If |
140: |-------|-----|---------|
141: | No new sessions created | Compare session-count before/after | Same count as before resume |
142: | Correct agent type used | Check delegatedBy → subagent_type | Exact match |
143: | Prompt NOT repeated | Check task args for "prompt" field | Absent or "Resume session." |
144: | Correct task_id used | Check task_id matches child session ID | Exact match |
145: | Cascade flowed | L1 resumed its L2 children too | All children completed |
146: 
147: ## §5 — FAILURE: WHAT TO DO IF RESUME FAILS
148: 
149: | Problem | Cause | Fix |
150: |---------|-------|-----|
151: | task() returns "session not found" | task_id expired from OpenCode's session store | Export the session .md via session-tracker → extract original prompt → create NEW dispatch with SAME agent type and SAME prompt |
152: | delegatedBy is "main_l0_agent" | Auto-captured value, not actual agent type | Read child's .json file → delegated_by.subagent_type or delegated_by.agent_name |
153: | Child already "completed" | Previous resume already succeeded | ACCEPT the result. Do not re-dispatch. |
154: | session-continuity.json missing | Session directory was never created | Read project-continuity.json to find the session dir → read child .json directly |
155: | Multiple active at same depth | Parallel dispatch was running | Resume sequentially. First complete, then next. Never re-parallelize. |
156: 
157: ### CRITICAL: task_id expired fallback
158: 
159: Only if `task_id` is genuinely expired (session store purged):
160: 
161: ```
162: 1. session-tracker({action:"export-session", sessionId: "<parentId>"})
163: 2. grep "## USER (turn" on the result → find the original user intent
164: 3. Read the original task dispatch (Tool: task block) to get:
165:    - Original subagent_type
166:    - Original description
167:    - Original arguments
168: 4. Create NEW dispatch with the SAME subagent_type + SAME prompt
169:    task(description="<original desc>", subagent_type="<original>", 
170:         prompt="<original prompt from .md>")
171: 5. Document: "task_id expired, re-dispatched from session-tracker evidence"
172: ```
173: 
174: **This is the ONLY case where you create a new task_id. Any other case = protocol violation.**

(End of file - total 174 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-session-tracker-manual.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-session-tracker-manual.md</path>
<type>file</type>
<content>
1: # Reference 06: Session-Tracker Manual
2: 
3: > **Jump targets:** [ref-06 §1]–[ref-06 §7]
4: 
5: ## §1 — Tool API Reference
6: 
7: ### session-tracker Tool API (validated against src/tools/hivemind/session-tracker.ts)
8: 
9: | Parameter | Type | Required For |
10: |-----------|------|-------------|
11: | `action` | `"export-session" \| "list-sessions" \| "search-sessions"` | All |
12: | `sessionId` | `string` | `export-session` |
13: | `query` | `string` | `search-sessions` |
14: | `limit` | `number` (1-100, default 20) | `list-sessions`, `search-sessions` |
15: 
16: ### Response Shapes
17: 
18: - **list-sessions:** `{ total, sessions: [{ sessionId, metadata }], hasMore, indexLastUpdated }`
19: - **export-session:** `{ sessionId, content, filePath }`
20: - **search-sessions:** `{ totalMatches, sessions: [{ sessionId, file, snippet, matchLine }], hasMore }`
21: 
22: ### Quick Invocation Reference
23: 
24: | Goal | Invocation |
25: |------|-----------|
26: | List all sessions | `session-tracker(action: "list-sessions", limit: 20)` |
27: | Export specific session | `session-tracker(action: "export-session", sessionId: "ses_xxx")` |
28: | Search for aborts | `session-tracker(action: "search-sessions", query: "aborted\|active\|cancelled")` |
29: | Read project index | `read(".hivemind/session-tracker/project-continuity.json")` |
30: | Read session hierarchy | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
31: | Find last user turn | `grep(pattern: "## USER \\(turn", include: "*.md")` |
32: | Read specific section | `read(filePath, offset=N, limit=M)` — NEVER read full file |
33: 
34: ## §2 — Directory Structure
35: 
36: ```
37: .hivemind/session-tracker/
38: ├── project-continuity.json              # Cross-session index
39: └── ses_<24-char-id>/                    # One per main session
40:     ├── ses_<24-char-id>.md              # Full session capture (YAML + MD)
41:     ├── session-continuity.json          # Intra-session delegation hierarchy
42:     ├── ses_<child-id>.json              # Child session (delegation level 1)
43:     └── ses_<grandchild-id>.json         # Grandchild (delegation level 2)
44: ```
45: 
46: ### File Purpose Summary
47: 
48: | File | Contains |
49: |------|----------|
50: | `project-continuity.json` | Index of ALL main sessions in the project |
51: | `session-continuity.json` | Delegation hierarchy WITHIN one session |
52: | `<sessionId>.md` | Full capture of session content (turns, tool calls) |
53: | `<childId>.json` | Child session details |
54: 
55: ## §3 — project-continuity.json Schema
56: 
57: ```json
58: {
59:   "version": "2.0",
60:   "projectRoot": "<absolute-path>",
61:   "lastUpdated": "<ISO-8601>",
62:   "sessions": {
63:     "<sessionId>": {
64:       "dir": "<sessionId>/",
65:       "mainFile": "<sessionId>.md",
66:       "continuityIndex": "<sessionId>/session-continuity.json",
67:       "created": "<ISO-8601>",
68:       "updated": "<ISO-8601>",
69:       "status": "active" | "idle" | "completed" | "error",
70:       "childCount": <number>,
71:       "totalDelegationDepth": <number>
72:     }
73:   },
74:   "chronologicalOrder": ["<sessionId>", ...]
75: }
76: ```
77: 
78: ### Field Meanings
79: 
80: | Field | Meaning | Used For |
81: |-------|---------|----------|
82: | `status: "active"` | Session running or aborted mid-delegation | Finding aborted sessions to resume |
83: | `status: "idle"` | Session alive but no active delegations | Skip in resume protocol |
84: | `status: "completed"` | Session finished cleanly | Skip |
85: | `status: "error"` | Session terminated with error | Skip for auto-resume |
86: | `childCount` | Number of children (delegations) | Filter for sessions with active children |
87: | `totalDelegationDepth` | Deepest delegation level | 0=no delegations, 3=max depth |
88: | `updated` | Last write timestamp | Sort to find most recent active |
89: 
90: ### Navigation: How to Use
91: 
92: ```
93: 1. Read once at power-on — small JSON, ~500 lines even with 50 sessions
94: 2. Filter active sessions: sessions where .status === "active"
95: 3. Find aborted delegations: active sessions where .childCount > 0
96: 4. Sort by recency: Sort active sessions by .updated descending
97: 5. For each candidate, read its session-continuity.json
98: ```
99: 
100: ## §4 — session-continuity.json Schema
101: 
102: ```json
103: {
104:   "version": "2.0",
105:   "sessionID": "<sessionId>",
106:   "lastUpdated": "<ISO-8601>",
107:   "hierarchy": {
108:     "root": "<same sessionId>",
109:     "children": {
110:       "<childSessionId>": {
111:         "file": "<childSessionId>.json",
112:         "depth": <1|2>,
113:         "status": "active" | "completed" | "error",
114:         "delegatedBy": "<agent_type>",
115:         "children": {
116:           "<grandchildSessionId>": {
117:             "file": "<grandchildSessionId>.json",
118:             "depth": <2>,
119:             "status": "active" | "completed" | "error",
120:             "delegatedBy": "<agent_type>",
121:             "children": {}
122:           }
123:         }
124:       }
125:     }
126:   },
127:   "turnCount": <number>,
128:   "toolSummary": {}
129: }
130: ```
131: 
132: ### Field Meanings
133: 
134: | Field | Meaning | Used For |
135: |-------|---------|----------|
136: | `depth: 1` | Child of root (L1-level delegation) | Filter: depth=1 = L1 aborted |
137: | `depth: 2` | Grandchild (L2-level delegation) | Filter: depth=2 = L2 aborted (deeper!) |
138: | `delegatedBy` | The agent type that was dispatched | Use EXACT SAME type for resume |
139: | `status: "active"` | Child is still running / aborted | **This is what you resume** |
140: | `children` | Nested children of this child | Check for depth=2 active children |
141: 
142: ### How to Traverse Children
143: 
144: ```
145: 1. hierarchy.children → map of childId → childInfo
146: 2. For each child, check .status
147: 3. Active children → need resume
148: 4. For each active child, check .children for grandchildren
149: 5. Grandchildren → deeper delegation, resume deepest first
150: ```
151: 
152: ### Find Deepest Active Algorithm
153: 
154: ```
155: function getDeepestActive(hierarchy):
156:   deepest = null, maxDepth = -1
157:   for each child in hierarchy.children:
158:     if child.status === "active" and child.depth > maxDepth:
159:       deepest = child; maxDepth = child.depth
160:     for each grandchild in child.children:
161:       if grandchild.status === "active" and grandchild.depth > maxDepth:
162:         deepest = grandchild; maxDepth = grandchild.depth
163:   return deepest  // { sessionId, depth, delegatedBy }
164: ```
165: 
166: ### Cross-File Field Summary
167: 
168: | Field | In File | Meaning |
169: |-------|---------|---------|
170: | `sessionId` (root key) | project-continuity.json | Main session identifier |
171: | `status` | Both files | Session state: active/idle/completed/error |
172: | `childCount` | project-continuity.json | Number of child sessions created |
173: | `totalDelegationDepth` | project-continuity.json | Max delegation depth |
174: | `hierarchy.children.<id>.depth` | session-continuity.json | 1=L1 child, 2=L2 grandchild |
175: | `hierarchy.children.<id>.delegatedBy` | session-continuity.json | Agent type dispatched |
176: | `hierarchy.children.<id>.children` | session-continuity.json | Grandchildren (recursive) |
177: | `chronologicalOrder` | project-continuity.json | All session IDs in creation order |
178: 
179: ## §5 — Navigation Patterns
180: 
181: ### Find Aborted Sessions
182: 
183: ```
184: 1. Read project-continuity.json
185: 2. Filter: sessions with status === "active" AND childCount > 0
186: 3. Sort: by updated descending (most recent first)
187: 4. For each match: read its session-continuity.json
188: 5. Look at hierarchy.children for children with status === "active"
189: 6. The child with highest depth is the deepest aborted delegation
190: ```
191: 
192: ### Deepest Active Delegation
193: 
194: ```
195: Example:
196:   session ses_A has children:
197:     child_X: depth=1, status="active" (no grandchildren)
198:     child_Y: depth=1, status="active" (has grandchild_Z: depth=2, status="active")
199: 
200:   → grandchild_Z at depth=2 is the DEEPEST active.
201:   → Resume grandchild_Z first: task(..., task_id="<grandchild_Z>")
202: ```
203: 
204: ### Parent → Child Chain Tracing
205: 
206: ```
207: Example chain:
208:   ses_A (root, L0)
209:     ├── ses_B (L1 child, depth=1, active, delegatedBy=hm-l2-auditor)
210:     └── ses_C (L1 child, depth=1, active, delegatedBy=hm-l2-researcher)
211: 
212:   → Two active L1 children. Resume sequentially.
213: ```
214: 
215: ## §6 — Session .md File Format
216: 
217: ```yaml
218: ---
219: session_id: "ses_xxxx"
220: created: "<ISO-8601>"
221: updated: "<ISO-8601>"
222: parent_session_id: null              # null = root, or parent ID
223: delegation_depth: 0                  # 0=root, 1=child, 2=grandchild
224: children:
225:   - session_id: "ses_child"
226:     child_file: "ses_child.json"
227: continuity_index: "session-continuity.json"
228: status: "active"
229: ---
230: 
231: ## USER (turn 1)
232: 
233: <user prompt content>
234: 
235: ## ASSISTANT (turn 1) — <agent_name> (<model>)
236: 
237: <assistant response>
238: 
239: ## TOOL: task(tool_id=N, description="...", subagent_type="<type>")
240: 
241: {
242:   "task_id": "ses_child_id_here"
243: }
244: ```
245: 
246: ### Key Extraction Points
247: 
248: | What to find | How |
249: |-------------|-----|
250: | Last user intent | grep `"## USER \\(turn"` on .md → read last match |
251: | Last task dispatch | grep `"## TOOL: task"` on .md → read last match |
252: | Agent type for resume | From task tool call: `subagent_type` field |
253: | Task ID for resume | From task tool output: `task_id` field |
254: 
255: ## §7 — Efficient Reading Patterns
256: 
257: | Goal | Command |
258: |------|---------|
259: | Find last user turn in .md | `grep(pattern: "## USER \\(turn", include: "*.md")` |
260: | Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
261: | Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
262: | Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
263: | Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |
264: 
265: ### Anti-Pattern: Full File Reads
266: 
267: **NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)
268: 
269: **ALWAYS:** Use grep to find the line number, then read with offset and limit.

(End of file - total 269 lines)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_7FjaRcky3eqZN5YU2Loi0462"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_uanEEBCldsQryF2JSDzg6157"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_qSweTl3YiaNvN2QU8dzm7543"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_XRAM1tHhfXdfNlbBza3f3589"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_jbtWQCFQArYtovy0d0SL6033"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_cucVNTUAbTw78iewapia7827"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_SiVtzl7ZZvpj5efpoYLo0519"
}
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_ET_zwRtcJdgk5cy95ZsbuD55363"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_7XE7HcnWxe5ZpvF7AITh3579"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_VHejJZrQVyBOjOmfPEMC6802"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_3Ss3BS0scu8Ab6m6CNgX6749"
}
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
4:   MUST-LOAD governance for L0/L1 agents. Routes hm/hf lineage, 
5:   manages session lifecycle, enforces quality gates, optimizes context. 
6:   Load FIRST. Triggers: session start, resume, disconnect, compact.
7: version: 1.0.0
8: lineage: hivemind
9: load_priority: 1
10: consumed-by:
11:   - hm-l0-orchestrator
12:   - hf-l0-orchestrator
13:   - hm-l1-coordinator
14:   - hf-l1-coordinator
15:   - hm-l2-conductor
16:   - hf-l2-meta-builder
17: allowed-tools:
18:   - skill
19:   - read
20:   - grep
21:   - glob
22:   - bash
23:   - task
24:   - todowrite
25:   - session-tracker
26:   - prompt-skim
27:   - prompt-analyze
28:   - hivemind-doc
29: ---
30: 
31: # Hivemind Power-On — Session Governance
32: 
33: ## IRON LAWS — READ BEFORE YOU THINK
34: 
35: **ABORTED ≠ CANCELLED. ABORTED = DISCONNECTED. CONTEXT IS INTACT ON DISK. RESUME WITH EXACT ID.**
36: 
37: ```
38: 1. IF session-tracker shows ANY child delegation → RESUME IT. Do NOT filter by status.
39:    Completed ones return instantly. Others continue. Agent CANNOT determine from JSON.
40:    DO NOT THINK. DO NOT DECIDE. DO NOT CREATE NEW. task(task_id="<EXISTING ID>")
41: 2. NEVER repeat prompt when resuming → context is preserved on disk
42: 3. NEVER L0→L2 dispatch → always L0→L1→L2
43: 4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
44: 5. NEVER load >3 skills at once → context budget is shared
45: 6. NEVER read full files when grep/offset works → line-aware reading
46: 7. L0 resumes L1 → L1 resumes L2 → L2 continues. Cascade ALWAYS flows down.
47: ```
48: 
49: **The session-tracker IS the authority. If it says a delegation exists, the delegation exists. Its ID is the ONLY valid task_id.**
50: 
51: ## ROUTING TABLE
52: 
53: | Signal | Route To | Depth |
54: |--------|----------|-------|
55: | `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
56: | `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
57: | Disconnect recovery, session resume (ABORTED ≠ CANCELLED) | → MECHANICAL RESUME — no filter, no thinking, all children | [ref-02 §1] |
58: | Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
59: | L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
60: | Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
61: | Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |
62: 
63: ## QUICK REFERENCE — Session-Tracker Cheat Sheet
64: 
65: ```
66: find all sessions:     session-tracker({action:"list-sessions"})
67: export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
68: search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
69: read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
70: read project index:    read(".hivemind/session-tracker/project-continuity.json")
71: grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
72: ```
73: 
74: Full tool API reference: [ref-06 §1]
75: Fallback strategies (when tool fails): [ref-06 §8]
76: 
77: FALLBACK (when session-tracker tool fails):
78: ```
79:   list sessions:          bash("ls .hivemind/session-tracker/")
80:   read index:             read(".hivemind/session-tracker/project-continuity.json")
81:   find children:          grep(pattern: '"status"', path: ".hivemind/session-tracker/<id>/", include: "session-continuity.json")
82:   list with node:         bash("node -e \"const j=require('./.hivemind/session-tracker/<id>/session-continuity.json'); Object.entries(j.hierarchy.children||{}).forEach(([k,v])=>console.log(k, v.status, v.depth))\"")
83: ```
84: 
85: ## REFERENCE MAP
86: 
87: ```
88: references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
89: references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
90: references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
91: references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
92: references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
93: references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
94: ```
95: 
96: ## ASSET BUNDLES
97: 
98: | Agent Type | Load | Why |
99: |------------|------|-----|
100: | **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
101: | **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
102: | **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
103: | **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
104: | **Post-compact (any)** | ref-03 + ref-06 | survive + track |
105: | **Lineage ambiguous** | ref-01 | routing decision tree |
106: 
107: ## ESCALATION RULES
108: 
109: ```
110: - 3 consecutive gate failures → escalate to user with full gap report
111: - Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
112: - session-tracker not responding → use FALLBACK strategies below or [ref-06 §8]
113: - task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
114: ```
115: 
116: ## LIFECYCLE SUMMARY
117: 
118: ```
119: POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
120: DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
121: COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
122: L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
123: ```
124: 
125: ## CRITICAL LOADING ORDER
126: 
127: ```
128: hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
129: ```
130: 
131: > **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
132: > **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.

(End of file - total 132 lines)
</content>
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_Rr8YPmrThW9R36XxKrPZ7232"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_BQMoyMRT9A01yKlnUlqi1080"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-session-resume-protocol.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/02-session-resume-protocol.md</path>
<type>file</type>
<content>
1: # Reference 02: Session Resume Protocol
2: 
3: > **Jump targets:** [ref-02 §1]–[ref-02 §5]
4: 
5: ## ⚠️ STOP. READ THIS BEFORE ANYTHING ELSE.
6: 
7: **"Aborted" status in session-tracker DOES NOT mean the user cancelled the task. It means the CONNECTION was lost. The subagent's ENTIRE state — prompt, turns, tool calls, files — is PRESERVED on disk. The task_id IS the session ID. Resuming with task_id restores EVERYTHING. There is NO scenario where you "start fresh" when an active/aborted delegation exists.**
8: 
9: If you see "aborted" and your first thought is "start a new task," you are WRONG.
10: The session-tracker data is the TRUTH. The .json says the session exists → you resume it. Period.
11: 
12: ## §1 — MECHANICAL RESUME (No decisions. No thinking. Execute.)
13: 
14: **Trigger:** You see a session-tracker child with ANY status. Or the user just reconnected.
15: 
16: ```
17: STEP 0 — READ THE INDEX
18:   read(".hivemind/session-tracker/project-continuity.json")
19:   → Find the most recently updated session.
20:   → If no sessions exist at all → go to §2 (fresh start).
21:   → If sessions exist, proceed to STEP 1 regardless of status.
22: 
23: STEP 1 — READ THE HIERARCHY  
24:   read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
25:   → Look at hierarchy.children
26:   → Find ALL children. Do NOT filter by status. Resume every child.
27:   → For each child:
28:     - Record: childId = that child's key
29:     - Record: delegatedBy = that child's delegatedBy field
30:   → If a child is truly completed, task(task_id) returns immediately (no harm).
31:   → If a child is in any other state, it continues from where it left off.
32:   → The agent CANNOT determine completion from JSON — only the runtime.
33: 
34: STEP 2 — RESUME (the ONLY valid action)
35:   For EACH child found in STEP 1:
36:     task(
37:       description = "resume",
38:       subagent_type = "<EXACT delegatedBy value>",
39:       task_id = "<childId>"
40:     )
41:     That's it. No other parameters. No "prompt" field. No thinking.
42:   Resume sequentially (NOT parallel): complete first child, then next.
43: ```
44: 
45: **If you create a NEW task(task_id="<new>") instead of the above, you have FAILED the protocol.**
46: 
47: ## §2 — THE TASK TOOL: EXACT PARAMETERS
48: 
49: The `task` tool resumes an existing session when `task_id` matches. The agent SEES its prior conversation. NO prompt needed.
50: 
51: ```
52: task(
53:   description = "resume",          // REQUIRED. Use "resume" literally.
54:   subagent_type = "<delegatedBy>",  // REQUIRED. Copy exactly from session-continuity.json.
55:   task_id = "<sessionId>"           // REQUIRED. The child's session ID from the .json key.
56: )
57: ```
58: 
59: **DO NOT include `prompt`. DO NOT include "args". DO NOT include anything else.**
60: 
61: If the platform forces a non-empty prompt: use the literal string `"Resume session."` — nothing more.
62: 
63: ### Where to find delegatedBy
64: 
65: Read the child entry in `session-continuity.json`:
66: 
67: ```json
68: {
69:   "hierarchy": {
70:     "children": {
71:       "ses_1ebe39941ffecHehSRcc13IqeD": {
72:         "file": "ses_1ebe39941ffecHehSRcc13IqeD.json",
73:         "depth": 1,
74:         "status": "active",
75:         "delegatedBy": "hm-l2-auditor",
76:         "children": {}
77:       }
78:     }
79:   }
80: }
81: ```
82: 
83: → `subagent_type = "hm-l2-auditor"` (the exact string from delegatedBy)
84: → `task_id = "ses_1ebe39941ffecHehSRcc13IqeD"` (the child's session ID key)
85: 
86: If `delegatedBy` is `"main_l0_agent"` (ambiguous), read the child's `.json` file to find `delegated_by.agent_name` or `delegated_by.subagent_type`.
87: 
88: ## §3 — THE CASCADE: L0→L1→L2 MUST FLOW
89: 
90: When you resume a parent session, you MUST also instruct it to resume ITS children.
91: 
92: ### L0 orchestrator power-on sequence:
93: 
94: ```
95: 1. Read project-continuity.json → find your session
96: 2. Read your session-continuity.json → find active L1 child
97: 3. Resume L1: task(task_id="<L1_childId>", subagent_type="<delegatedBy>")
98: 4. IN YOUR RESUME PROMPT to L1, include this exact instruction:
99: 
100:    "You are resuming as L1 coordinator. On spawn:
101:     1. Read YOUR session-continuity.json at 
102:        .hivemind/session-tracker/<your-session-id>/session-continuity.json
103:     2. Find ALL children (do NOT filter by status — resume every child).
104:        Completed ones return instantly. Others continue.
105:        The agent CANNOT determine completion from JSON — only the runtime.
106:     3. Resume each with EXACT task_id:
107:        task(description='resume', subagent_type='<delegatedBy>', task_id='<childId>')
108:     4. DO NOT create new delegations for work already dispatched."
109: ```
110: 
111: ### L1 coordinator resume sequence:
112: 
113: ```
114: 1. Read your session-continuity.json
115: 2. Find ALL children (do NOT filter by status — resume EVERY child)
116: 3. For each, extract: { sessionId, delegatedBy }
117: 4. Resume sequentially (NOT parallel):
118:    task(description="resume", subagent_type="<delegatedBy>", task_id="<sessionId>")
119: 5. Collect results from each
120: 6. Run quality gates on each result
121: 7. Return consolidated results to L0
122: ```
123: 
124: ### REAL cascade with REAL IDs:
125: 
126: ```
127: Session tree on disk:
128:   ses_1ebe832c5ffeeYuFbS1kqleZnD (L0 orchestrator, active)
129:     ├── ses_1ebe39941ffecHehSRcc13IqeD (L1, depth=1, active, delegatedBy=main_l0_agent)
130:     │     └── ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2, depth=2, active)
131:     └── ses_1ebd373b1ffeDa7AJ7KJIPShVE (L1, depth=1, active, delegatedBy=main_l0_agent)
132: 
133: Execution (5 turns):
134:   T1: L0 resumes ses_1ebe39941ffecHehSRcc13IqeD with instruction cascade
135:   T2: L1 spawns, reads its session-continuity → finds ses_1ebe28c52ffeIoXFCcAZnCj0IC active
136:   T3: L1 resumes ses_1ebe28c52ffeIoXFCcAZnCj0IC (L2)
137:   T4: L2 completes work → returns to L1
138:   T5: L1 resumes ses_1ebd373b1ffeDa7AJ7KJIPShVE (second child) → completes → returns to L0
139: ```
140: 
141: **NO new session IS EVER created. NO prompt IS EVER repeated.**
142: 
143: ## §4 — VERIFICATION: DID YOU DO IT RIGHT?
144: 
145: After resume, verify:
146: 
147: | Check | How | Pass If |
148: |-------|-----|---------|
149: | No new sessions created | Compare session-count before/after | Same count as before resume |
150: | Correct agent type used | Check delegatedBy → subagent_type | Exact match |
151: | Prompt NOT repeated | Check task args for "prompt" field | Absent or "Resume session." |
152: | Correct task_id used | Check task_id matches child session ID | Exact match |
153: | Cascade flowed | L1 resumed its L2 children too | All children completed |
154: 
155: ## §5 — FAILURE: WHAT TO DO IF RESUME FAILS
156: 
157: | Problem | Cause | Fix |
158: |---------|-------|-----|
159: | task() returns "session not found" | task_id expired from OpenCode's session store | Export the session .md via session-tracker → extract original prompt → create NEW dispatch with SAME agent type and SAME prompt |
160: | delegatedBy is "main_l0_agent" | Auto-captured value, not actual agent type | Read child's .json file → delegated_by.subagent_type or delegated_by.agent_name |
161: | Child already "completed" | Previous resume already succeeded | ACCEPT the result. Do not re-dispatch. |
162: | session-continuity.json missing | Session directory was never created | Read project-continuity.json to find the session dir → read child .json directly |
163: | Multiple active at same depth | Parallel dispatch was running | Resume sequentially. First complete, then next. Never re-parallelize. |
164: 
165: ### CRITICAL: task_id expired fallback
166: 
167: Only if `task_id` is genuinely expired (session store purged):
168: 
169: ```
170: 1. session-tracker({action:"export-session", sessionId: "<parentId>"})
171: 2. grep "## USER (turn" on the result → find the original user intent
172: 3. Read the original task dispatch (Tool: task block) to get:
173:    - Original subagent_type
174:    - Original description
175:    - Original arguments
176: 4. Create NEW dispatch with the SAME subagent_type + SAME prompt
177:    task(description="<original desc>", subagent_type="<original>", 
178:         prompt="<original prompt from .md>")
179: 5. Document: "task_id expired, re-dispatched from session-tracker evidence"
180: ```
181: 
182: **This is the ONLY case where you create a new task_id. Any other case = protocol violation.**

(End of file - total 182 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-session-tracker-manual.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/skills-lab/hivemind-power-on/references/06-session-tracker-manual.md</path>
<type>file</type>
<content>
260: | Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
261: | Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
262: | Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
263: | Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |
264: 
265: ### Anti-Pattern: Full File Reads
266: 
267: **NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)
268: 
269: **ALWAYS:** Use grep to find the line number, then read with offset and limit.
270: 
271: ## §8 — Tool Fallback Strategies
272: 
273: > **When:** session-tracker tool fails, returns wrong data, or extracts too much context.
274: 
275: ### FALLBACK 1: Direct bash navigation
276: ```
277:   List sessions:   bash("ls .hivemind/session-tracker/")
278:   Read index:      bash("cat .hivemind/session-tracker/project-continuity.json")
279:   Read hierarchy:  bash("cat .hivemind/session-tracker/<id>/session-continuity.json")
280:   Search JSON:     grep(pattern: '"status"\\s*:\\s*"active"', path: ".hivemind/session-tracker/", include: "*.json")
281:   List children:   glob(pattern: "*.json", path: ".hivemind/session-tracker/<id>/")
282: ```
283: 
284: ### FALLBACK 2: Grep-based search
285: ```
286:   Find active:    grep(pattern: "status.*active|cancelled|aborted", include: "session-continuity.json", path: ".hivemind/session-tracker/")
287:   Find user turns: grep(pattern: "## USER \\\\(turn", include: "*.md", path: ".hivemind/session-tracker/<id>/")
288:   Find task_ids:   grep(pattern: "task_id:", include: "*.md", path: ".hivemind/session-tracker/<id>/")
289: ```
290: 
291: ### FALLBACK 3: Efficient reading (when export is too heavy)
292: ```
293:   NEVER read full .md files — use offset/limit:
294:     read(filePath, offset=1, limit=30) — frontmatter only
295:     grep for "## USER" → get line number → read(filePath, offset=N, limit=30)
296:   JSON files are small (~20-50 lines): read(filePath) — full JSON is fine, MD is not
297: ```
298: 
299: ### FALLBACK 4: Node.js one-liner (for complex JSON filtering)
300: ```
301:   Filter sessions:  bash("node -e \"const j=require('./.hivemind/session-tracker/project-continuity.json'); Object.entries(j.sessions).forEach(([k,v])=>console.log(k, v.status))\"")
302:   List children:    bash("node -e \"const j=require('./.hivemind/session-tracker/<id>/session-continuity.json'); Object.entries(j.hierarchy.children||{}).forEach(([k,v])=>console.log(k, v.status, v.depth))\"")
303: ```
304: 
305: ### Edge Cases Covered
306: 
307: | Problem | Symptom | Fix |
308: |---------|---------|-----|
309: | **Forked sessions** | session ID ≠ directory name | Use `ls` to verify directory exists before reading |
310: | **Stale index entries** | project-continuity.json has non-existent directories | Verify: `bash("test -d .hivemind/session-tracker/<id> && echo EXISTS")` |
311: | **Missing session-continuity.json** | Directory exists but no index file | Read child `.json` files directly: `glob(".hivemind/session-tracker/<id>/*.json")` |
312: | **Wrong tool extracting too much** | session-tracker export returns huge .md | Use grep to find line numbers, then `read(offset=N, limit=30)` instead |
313: | **JSON parse errors** | Corrupted JSON file | Use bash `cat` to inspect raw content, then grep for specific fields |

(End of file - total 313 lines)
</content>
```


### Tool: todowrite

**Input:**
```json
{
  "callID": "call_00_OQyf2TtqAYS3xjqFNviu3675"
}
```

