---
name: hivemind-power-on
description: >-
  MUST-LOAD governance skill for ALL Hivemind L0 and L1 agents. Routes workflows
  across hm-* and hf-* lineages, manages session lifecycle (start/resume/compact-survival),
  orchestrates delegation chains, enforces quality gates, and optimizes context usage.
  Load FIRST before any domain-specific skills. Triggers on: "session start", "resume session",
  "disconnect recovery", "recover from disconnect", "context compaction", "compact context",
  "lineage routing needed", "which lineage", "what workflow should I use",
  "power on", "/hivemind-power-on", "restart session", "continue work".
  NOT a domain skill — loads before hm-* or hf-* routing. Max 3 skills concurrent.
version: 1.0.0
lineage: hivemind
load_priority: 1
consumed-by:
  - hm-l0-orchestrator
  - hf-l0-orchestrator
  - hm-l1-coordinator
  - hf-l1-coordinator
  - hm-l2-conductor
  - hf-l2-meta-builder
allowed-tools:
  - skill
  - read
  - grep
  - glob
  - bash
  - task
  - todowrite
  - session-tracker
  - prompt-skim
  - prompt-analyze
  - hivemind-doc
---

# THE IRON LAWS

```
1. NEVER start a new session when aborted delegations exist. Use EXACT task_id.
2. NEVER repeat the prompt when resuming. Context is preserved in the session file.
3. NEVER dispatch directly to L2 (L0→L1→L2 always, unless user explicitly overrides).
4. NEVER skip the quality gate triad (lifecycle → spec → evidence).
5. NEVER load >3 skills concurrently.
6. NEVER read full files when grep + offset yields the answer.
7. ALWAYS use session-tracker to find aborted sessions before starting fresh.
```

# Hivemind Power-On — Session Governance Protocol

## 1. Role & When To Load

This skill governs ALL Hivemind agent sessions from power-on through shutdown. It is the first skill every agent loads. It does not execute domain work — it routes to the correct lineage, manages session lifecycle, and enforces delegation discipline.

### MUST load at:
| Trigger | Action |
|---------|--------|
| Session start (fresh) | Load first → classify lineage → load lineage router |
| Session resume after disconnect | Load first → run RESUME protocol → load lineage router |
| Context compaction / purge survival | Load first → run COMPACT SURVIVAL protocol |
| Workflow routing needed | Load first → classify lineage → load lineage router |
| Delegation chain establishment | Verify L0→L1→L2 chain, enforce gates |

### Loaded by:
- **Mandatory:** hm-l0-orchestrator, hf-l0-orchestrator, hm-l1-coordinator, hf-l1-coordinator
- **Conditional:** hm-l2-conductor, hf-l2-meta-builder (when receiving delegation task)
- **L2/L3 specialists:** Do NOT load this — your coordinator loaded it for you

### Loading order:
```
hivemind-power-on (FIRST) → lineage router → domain skills
```

---

## 2. Lineage Classification (Pattern 1)

Before any domain work, classify the task into the correct lineage:

```
Is the task about CREATING / AUDITING / REPAIRING meta-concepts?
  ├─ YES: agents, skills, commands, tools → hf-* lineage
  └─ NO:  features, bugs, architecture, implementation → hm-* lineage

Does the command start with /hf-*?
  └─ YES → hf-* lineage

Does the command start with /plan, /ultrawork, /gsd-*?
  └─ YES → hm-* lineage

Still ambiguous?
  └─ Read 1 user turn via session-tracker → grep "## USER" → classify intent
```

### Cross-lineage rules:
| Lineage | Rule |
|---------|------|
| **hf-*** (FLEXIBLE) | May load hm-* skills for codebase investigation. Document reason. |
| **hm-*** (STRICT) | No hf-* loading unless explicitly routed by hf-orchestrator. |
| **gate-*** (INTERNAL) | Project-only quality gate triad. |
| **stack-*** (REFERENCE) | Read-only tech stack documentation. Any lineage may load. |

---

## 3. Session Lifecycle Protocol (Pattern 3 — CRITICAL)

### 3.1 FRESH START — No Active Sessions

When you KNOW no prior sessions exist (first ever start; user explicitly says "new session"):

```
1. Announce: "[Agent] powered on. Classifying workflow…"
2. Run lineage classification (Section 2 above)
3. Load the lineage router for the classified lineage
4. Proceed with domain work
```

### 3.2 RESUME AFTER DISCONNECT — THE CRITICAL PROTOCOL

This is the #1 session-recovery fix. Follow EXACTLY. Do not skip steps.

```
STEP 1 — FIND ACTIVE SESSIONS
  Read project-continuity.json:
    read(".hivemind/session-tracker/project-continuity.json")
  Filter: sessions with status === "active", sorted by updated descending.
  If none → FRESH START (Section 3.1).

STEP 2 — FIND ABORTED DELEGATIONS
  For EACH active session (starting with most recently updated):
    Read its session-continuity.json:
      read(".hivemind/session-tracker/<sessionId>/session-continuity.json")
    Check hierarchy.children → find any child with status === "active".

STEP 3 — IDENTIFY DEEPEST ACTIVE DELEGATION
  Among all active children across all active sessions:
    Pick the child with the HIGHEST depth value.
    If multiple at same depth → pick the most recently updated.

  Record:
    - rootSessionId: the parent session ID
    - targetChildId: the aborted delegation child ID (task_id)
    - agentType: the delegatedBy field from child metadata

STEP 4 — EXPORT THE ROOT SESSION
  session-tracker(action: "export-session", sessionId: "<rootSessionId>")
  This returns the full .md capture file with all turns, tool calls, and context.

STEP 5 — RECOVER LAST USER INTENT
  grep(pattern: "## USER \\(turn", include: "*.md") on the exported content,
    OR read with offset to find the most recent user turn.
  Read the last ## USER turn to understand what was requested.

STEP 6 — RESUME WITH EXACT task_id
  The child's session ID IS the task_id. Resume using:
    task(description="resume", subagent_type="<SAME agent_type>",
         task_id="<targetChildId>")

STEP 7 — CASCADE TO CHILD
  When the resumed L1 agent spawns, it checks ITS session-continuity.json
  for aborted L2 children and resumes them with EXACT task_id too.

CRITICAL:
  - DO NOT create a new session ID.
  - DO NOT repeat the original prompt — context is preserved.
  - The resumed agent sees its prior conversation state.
```

### 3.3 COMPACT / PURGE SURVIVAL

When context is compacted (OpenCode auto-compacts at 70%) or purged:

```
1. Export current session BEFORE compaction hits:
   session-tracker(action: "export-session", sessionId: "<current>")

2. Read project-continuity.json → find current session metadata

3. Read session-continuity.json → map active delegation tree

4. From exported .md, grep "## USER (turn" for most recent user request

5. Reconstruct from disk:
   - Last user intent → from ## USER turn in .md
   - Active delegations → from session-continuity.json hierarchy.children
   - task_ids → from child session IDs
   - Agent types → from delegatedBy field

6. Present reconstruction to user before proceeding:
   "Recovered from compaction. Last request: [intent]. Resume?"
```

### 3.4 Session Health Dashboard (L0 Only)

L0 agents should run this on power-on to get an overview:

```
1. List all sessions:
   session-tracker(action: "list-sessions", limit: 50)

2. Count:
   - Active sessions (status === "active")
   - Sessions with active children (childCount > 0)
   - Sessions with totalDelegationDepth > 0

3. Warn if:
   - >5 active sessions exist (leakage)
   - Any session has depth >= 3 (max delegation depth)
   - Any session has been active >24h (stale lock)
```

---

## 4. Session-Tracker Tool Cheat Sheet

All tool invocations use EXACT parameter names from the validated API:

| Goal | Invocation |
|------|-----------|
| List all sessions | `session-tracker(action: "list-sessions", limit: 20)` |
| Export session | `session-tracker(action: "export-session", sessionId: "ses_xxx")` |
| Search for aborts | `session-tracker(action: "search-sessions", query: "aborted\|active\|cancelled")` |
| Read project index | `read(".hivemind/session-tracker/project-continuity.json")` |
| Read session hierarchy | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
| Find last user turn | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read specific section | `read(filePath, offset=N, limit=M)` — NEVER read full file |

### session-tracker tool API (validated against src/tools/hivemind/session-tracker.ts):

| Parameter | Type | Required For |
|-----------|------|-------------|
| `action` | `"export-session" \| "list-sessions" \| "search-sessions"` | All |
| `sessionId` | `string` | `export-session` |
| `query` | `string` | `search-sessions` |
| `limit` | `number` (1-100, default 20) | `list-sessions`, `search-sessions` |

### Response shapes:
- **list-sessions:** `{ total, sessions: [{ sessionId, metadata }], hasMore, indexLastUpdated }`
- **export-session:** `{ sessionId, content, filePath }`
- **search-sessions:** `{ totalMatches, sessions: [{ sessionId, file, snippet, matchLine }], hasMore }`

Full reference: `references/01-session-tracker-anatomy.md`

---

## 5. Delegation Chain Protocol

### Hierarchy (non-negotiable):
```
L0 (Orchestrator) → L1 (Coordinator) → L2 (Specialist) → [L3 conditional]
```

### Dispatch rules:
| From | To | Allowed | When |
|------|----|---------|------|
| L0 | L1 | ALWAYS | All complex tasks |
| L0 | L2 | NEVER | Except explicit user override |
| L1 | L2 | ALWAYS | Domain-specific work |
| L2 | L3 | CONDITIONAL | Deep research, synthesis, stack reference |

### Delegation records — verify before dispatch:
```
1. For each delegation, check session-continuity.json:
   - Is there already an active child for this domain?
   - If yes → RESUME, don't create new.

2. After dispatch, the session-tracker hook captures:
   - task_id (= child session ID)
   - agent_type (= delegatedBy)
   - depth (= parent depth + 1)

3. When child returns, status updates to "completed" or "error"
```

### Resume discipline:
```
DISCONNECTED? → Read project-continuity.json → find active → resume with task_id
NEVER: "Let me start a new delegation for this."
ALWAYS: "Let me check if there's an aborted delegation to resume."
```

---

## 6. Quality Gate Integration

Every delegation must pass the quality gate triad. L0/L1 agents enforce this:

```
DELEGATION → lifecycle gate → spec gate → evidence gate → ACCEPT
                                                          ↓
                                                     FAIL → return gaps
                                                              ↓
                                                    Max 3 retries → escalate to user
```

### Gate skills to load:
| Gate | Skill | Check |
|------|-------|-------|
| Lifecycle | `gate-l3-lifecycle-integration` | CQRS boundaries, surface authority, actor hierarchy |
| Spec | `gate-l3-spec-compliance` | Bidirectional traceability, gap detection, EARS acceptance |
| Evidence | `gate-l3-evidence-truth` | L1-L5 evidence hierarchy, no mock-only proof |

### Gate enforcement:
```
1. Before accepting child output: run lifecycle gate
2. If lifecycle PASSES: run spec compliance gate  
3. If spec PASSES: run evidence truth gate
4. If ALL PASS: accept child output
5. If ANY FAIL: return gap report to child, max 3 fix cycles
6. After 3rd failure: escalate to user with full gap report
```

---

## 7. Context Optimization Rules

Agents load this skill at session start — every word costs context. Follow these rules:

### Reading strategy:
| Situation | Tool | Example |
|-----------|------|---------|
| Find active sessions | read (small JSON) | `read(".hivemind/session-tracker/project-continuity.json")` |
| Find aborted delegations | read (small JSON) | `read(".hivemind/.../session-continuity.json")` |
| Find last user turn | grep + offset | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read .md turn content | read with offset | `read(filePath, offset=200, limit=40)` |
| Classify large prompts | prompt-skim | `prompt-skim(content: "<prompt>", workspaceRoot: "<root>")` |

### NEVER:
- Read full AGENTS.md files — use frontmatter via read(limit=30)
- Read full .md session files — use grep + offset (NEVER read all 7000 lines)
- Load >3 skills at once — cascade: router → primary domain skill → tool skill
- Read the same file twice within the same conversation turn

### At 70% context:
```
1. Export session: session-tracker(action: "export-session", sessionId: current)
2. Checkpoint: write current state to disk
3. Continue with compacted context from session-tracker output
4. Announce: "Context budget heavy. Checkpointed. Continuing from compacted state."
```

---

## 8. Cross-Lineage Bridge Protocols

### When to bridge (hf-* → hm-*):
| Need | Bridge To | Justification |
|------|-----------|---------------|
| Codebase investigation | hm-l3-detective | Pattern detection, structure mapping |
| Deep research | hm-l3-deep-research | Version-matched evidence gathering |
| Synthesis | hm-l3-synthesis | Compression, artifact creation |
| Spec validation | hm-l2-spec-driven-authoring | Requirements against implementation |
| Refactoring methodology | hm-l2-refactor | Surgical vs structural decisions |

### When to bridge (hm-* → hf-*):
Only when explicitly routed by hf-l0-orchestrator. Never autonomously.

### Documentation requirement:
Every cross-lineage skill load MUST be logged with justification in the return report. Format:
```
Cross-Lineage Access: [skill-name] — [justification]
```

---

## 9. Quick Reference: Decision Matrix

| Situation | Action |
|-----------|--------|
| First turn, fresh session | Classify lineage → load lineage router |
| Disconnected, mid-delegation | RESUME protocol (Section 3.2) |
| Context compacted | COMPACT SURVIVAL (Section 3.3) |
| Receiving task, unsure lineage | Lineage Classification (Section 2) |
| About to dispatch to L2 | Verify L1 exists between L0 and L2 |
| Child agent returns | Quality gate triad (Section 6) |
| Nearing context limit | Export → checkpoint → compact |
| Cross-lineage skill needed | Document justification |
| >3 skills being considered | Reduce to max 3 |

---

## 10. Worked Example: Disconnect Recovery

**Scenario:** L0-orchestrator was deep in a multi-child delegation when the user disconnected. Session `ses_1ebe832c5ffeeYuFbS1kqleZnD` has active children.

**Recovery:**
```
1. read(".hivemind/session-tracker/project-continuity.json")
   → Found ses_1ebe832c5ffeeYuFbS1kqleZnD: status=active

2. read(".hivemind/session-tracker/ses_1ebe832c5ffeeYuFbS1kqleZnD/session-continuity.json")
   → hierarchy.children.ses_1ebe39941ffecHehSRcc13IqeD: depth=1, status=active
   → hierarchy.children.ses_1ebd373b1ffeDa7AJ7KJIPShVE: depth=1, status=active

3. Both at depth=1. Pick most recently updated child.

4. session-tracker(action: "export-session", sessionId: "ses_1ebe832c5ffeeYuFbS1kqleZnD")
   → .md content returned

5. grep "## USER (turn" on exported content → found last user intent
   "audit the session-tracker module and report all flaws"

6. task(description="resume", subagent_type="hm-l2-auditor",
        task_id="ses_1ebe39941ffecHehSRcc13IqeD")

→ Resumed L2 auditor continues from where it left off.
→ NO new session created. NO prompt repeated.
```

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fresh Starter** — creates new session when aborted exists | New session ID appears while active children exist | Check project-continuity.json before every new session |
| **The Prompt Repeater** — repeats original prompt on resume | Child agent receives duplicate user text | Use task_id resume — context is preserved, no prompt needed |
| **The Layer Skipper** — L0 dispatches directly to L2 | No L1 in delegation chain | Insert L1 coordinator |
| **The Gate Skipper** — accepts child output without quality gates | No gate skill loaded before accepting | Load gate triad (Section 6) |
| **The Context Hog** — reads full 7000-line session .md | Full read on .md file >1000 lines | grep + offset only |
| **The Multi-Loader** — loads 5+ skills at once | >3 Load Skill calls in one turn | Cascade loading: router first, then domain |
| **The Silent Crosser** — loads hm-* skills without documenting | hm-* skill loaded by hf-* agent without justification | Add to Cross-Lineage Access log |

---

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥10 | 14 trigger phrases in description |
| HMQUAL-02 | Self-correction with 7 anti-patterns | Fresh Starter, Prompt Repeater, Layer Skipper, Gate Skipper, Context Hog, Multi-Loader, Silent Crosser |
| HMQUAL-03 | Cross-references to related skills | 12 cross-referenced skills across hm/hf/gate lineages |
| HMQUAL-04 | Progressive disclosure | SKILL.md + 6 references/ files |
| HMQUAL-05 | Worked example with real session IDs | Disconnect recovery example with ses_1ebe832c5ffeeYuFbS1kqleZnD |
| HMQUAL-06 | IRON LAWS enforcement | 7 iron laws in prominent block at top |
| HMQUAL-07 | Tool API validated against source | session-tracker params validated against session-tracker.ts:57-65 |

---

## Reference Map

| File | Content |
|------|---------|
| `references/01-session-tracker-anatomy.md` | Directory structure, JSON schemas, navigation patterns |
| `references/02-task-tool-resume.md` | OpenCode task tool resume parameters, session ID as task_id |
| `references/03-lineage-routing-tree.md` | Complete hm-vs-hf decision tree with examples |
| `references/04-project-phase-routing.md` | Phase-to-specialist mapping for both hm and hf lineages |
| `references/05-continuity-navigation.md` | How to traverse project-continuity.json and session-continuity.json |
| `references/06-delegation-depth-recovery.md` | Multi-level recovery cascade with worked examples |
