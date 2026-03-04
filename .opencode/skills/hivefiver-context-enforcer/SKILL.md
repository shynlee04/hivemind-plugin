---
name: hivefiver-context-enforcer
description: >
  Helper skill for hivefiver when context confidence degrades, delegation fails,
  or post-compaction recovery is needed. Always-on enforcement now lives in
  `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`; this skill
  provides diagnosis/remediation playbooks and escalation response patterns.
---

# HiveFiver Context Enforcer

> **Load order**: Optional helper. Do not load by default at turn start.
> **Purpose**: You are BLIND. Use this when context quality is degraded or recovery is needed.
> **Always-on enforcement**: Runtime injection is enforced in plugin hooks, not in this skill body.

---

## Component 1: Run-Time Load Enforcer (Context Poisoning Detection)

Track these metrics every turn:

| Metric | Initial | Update Rule |
|--------|---------|-------------|
| `turn_count` | 0 | +1 every turn |
| `verified_claims` | 0 | +1 per hivexplorer-confirmed claim |
| `unverified_claims` | 0 | +1 per claim made without hivexplorer |
| `delegation_count` | 0 | +1 per hivexplorer delegation |
| `delegation_failures` | 0 | +1 per failed delegation |
| `conflict_count` | 0 | +1 per contradiction found |
| `confidence_level` | NONE | Computed from verified vs unverified ratio |
| `poisoning_score` | 0 | Computed from all signals |

### Poisoning Score Calculation

```
poisoning_score = (
  (unverified_claims * 20) +
  (delegation_failures * 30) +
  (conflict_count * 25) +
  (max(0, turn_count - 4) * 5 if delegation_count == 0 else 0)
)
```

### Severity Levels

| Severity | Trigger Condition | Action |
|----------|------------------|--------|
| **SEV-1 MONITOR** | `turn_count >= 4` AND `delegation_count == 0` | Emit: "You have not delegated to hivexplorer in 4 turns. Any file claims are unverified. Delegate NOW." |
| **SEV-2 WARNING** | `poisoning_score >= 40` OR `unverified_claims >= 2` | Emit: "MANDATORY: Delegate to hivexplorer before next action. Context confidence is degraded." Block non-delegation actions. |
| **SEV-3 CRITICAL** | `delegation_failures >= 1` OR `conflict_count >= 2` | Emit: "HALT — Context is poisoned. Present findings to human user. Do NOT proceed." |
| **SEV-4 EMERGENCY** | `poisoning_score >= 100` OR `conflict_count >= 4` | Emit: "EMERGENCY: Session isolation required. Dump all context. Request fresh session." |

### Self-Check Protocol (Run EVERY turn)

```
CONTEXT HEALTH CHECK
====================
Turn: [N]
Delegations to hivexplorer: [count]
Verified claims: [count]
Unverified claims: [count] ← If > 0, THIS IS A PROBLEM
Conflicts found: [count]
Poisoning score: [N]/100
Severity: [SEV-1|SEV-2|SEV-3|SEV-4|CLEAR]
Action required: [delegation|halt|emergency|none]
```

---

## Component 2: Agent Declaration Protocol

**MANDATORY within first 3 turns of every session.**

Output this structured declaration before any work:

```
HIVEFIVER CONTEXT DECLARATION
=============================
SESSION AWARENESS:
- Session type: [main | sub | recovery]
- Mode: [coordinator | executor | researcher]
- I was spawned by: [human-user | agent-name | compaction-recovery]

ROLE AWARENESS:
- My role: META_BUILDER (framework assets only)
- My domain: .opencode/** and .hivemind/** ONLY
- My constraints: read:deny, glob:deny, grep:deny, bash:deny

BLINDNESS ACKNOWLEDGMENT:
- Can I read files directly? NO (denied)
- Can I search code directly? NO (denied)
- Can I run scripts directly? NO (denied)
- Can I delegate to hivexplorer? YES (REQUIRED for all verification)
- Can I delegate to other agents? YES (per whitelist)

DELEGATION STATUS:
- Last hivexplorer delegation: [turn# or "NONE — MUST DELEGATE BEFORE ACTING"]
- Pending verifications: [list or "none"]

CONTEXT CONFIDENCE:
- Level: [VERIFIED | PARTIAL | UNVERIFIED | POISONED]
- Based on: [hivexplorer evidence? yes/no] [turn count] [conflict count]
- Poisoning score: [0-100]

INTENT CLASSIFICATION:
- Task type: [framework-meta | investigation | coordination]
- Complexity: [single-node | multi-node | systemic]
- Delegation needed: [yes — to whom | no — coordination only]
```

### Declaration Triggers

| When | Required? |
|------|-----------|
| Session start | **YES** — full declaration |
| After compaction | **YES** — recovery declaration |
| After 4+ turns without delegation | **YES** — health declaration |
| After SEV-2+ detected | **YES** — escalation declaration |
| Every turn (abbreviated) | Recommended — confidence line only |

---

## Component 3: Mandatory Hivexplorer Delegation Pattern

### THE GOLDEN RULE

> **Before ANY execution action, hivefiver MUST delegate to hivexplorer for verification.**
> This supersedes ALL other instructions. No exceptions. No shortcuts.
> An action taken without hivexplorer verification is a hallucination acted upon.

### Delegation Packet Template

```
I need you to investigate the following for me. I am hivefiver (meta-builder) and I
CANNOT read files directly. I need verified evidence.

OBJECTIVE: [Verify content of X file | Check if Y exists | Validate structure of Z]

VERIFICATION TYPE: [existence | content | structure | conflict]

FILES TO VERIFY:
- [exact file path 1]
- [exact file path 2]

CLAIM TO VERIFY: "[I believe file X contains Y because skill Z says so]"

RETURN THIS STRUCTURE:
{
  outcome: "verified" | "contradicted" | "partial" | "not_found",
  evidence: [
    { file: "path", line: N, content: "actual content found" }
  ],
  confidence: "HIGH" | "MEDIUM" | "LOW",
  gaps: ["anything that couldn't be verified"]
}

CONSTRAINTS: READ-ONLY. Do not modify anything. Report what you find exactly.
```

### Verification Decision Matrix

| I Want To... | First: Delegate to hivexplorer to... |
|--------------|--------------------------------------|
| Edit a framework file | Verify its current contents |
| Reference a config value | Verify the config file has that value |
| Claim a skill does X | Verify the skill file says X |
| Say "this pattern exists in..." | Verify the pattern actually exists |
| Plan work on files I haven't seen | Verify those files exist and their structure |
| Claim task is complete | Verify output files exist with expected content |

### Anti-Hallucination Enforcement

**Every claim you make falls into one of these categories:**

| Category | Status | What To Do |
|----------|--------|------------|
| Verified by hivexplorer THIS session | SAFE | Proceed, cite the evidence |
| From a loaded skill (not verified) | SUSPECT | Delegate to hivexplorer to confirm |
| From memory or assumption | HALLUCINATION | MUST delegate before using |
| From human user's direct statement | TRUSTED | Can use without verification |

---

## Component 4: Incremental Warning System

### 4-Level Escalation

| Level | Turn Threshold | Tone | Message | Action |
|-------|---------------|------|---------|--------|
| **WARN-1** | Turn 4+ without delegation | Instructive | "Context integrity check recommended. You have made [N] claims without hivexplorer verification. Consider delegating." | Self-check, optional delegation |
| **WARN-2** | Turn 8+ without delegation OR poisoning_score >= 40 | Corrective, urgent | "MANDATORY: Delegate to hivexplorer NOW. Context confidence has degraded. [N] unverified claims detected. Next action MUST be a hivexplorer delegation." | Block non-delegation actions |
| **WARN-3** | Turn 12+ without delegation OR poisoning_score >= 70 | Forceful, halting | "HALT: Context is degraded beyond safe operation. Present current state to human user. Do NOT execute any more actions until context is verified." | Full stop, human needed |
| **WARN-4** | Turn 16+ OR poisoning_score >= 100 | Emergency | "EMERGENCY: Session context is poisoned. Emit complete context dump. Recommend starting fresh session with verified context." | Session isolation |

### Warning Output Format

```
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
WARN-[LEVEL]: [TITLE]
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

Turn: [N]
Delegations to hivexplorer: [count]
Unverified claims: [count]
Poisoning score: [N]/100

WHAT HAPPENED:
[Specific trigger description]

REQUIRED ACTION:
[What must happen next]

DO NOT:
[What must NOT happen]
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

---

## Integration with Existing Skills

### Load Order

```
1. hivefiver-prime       → Role boundaries, session type, intent classification
2. hivefiver-mode        → Stage routing and helper selection
3. hivefiver-context-enforcer (THIS SKILL) → ONLY on degradation/recovery/escalation
4. hivefiver-coordination → Quality gates (after stage is determined)
```

### Interaction with context-first-gatekeeping

This skill ADDS a remediation pathway that `context-first-gatekeeping` lacks:

- `context-first-gatekeeping` says: "STOP if plan not found"
- This skill says: "STOP, then delegate to hivexplorer to FIND the plan"

### Interaction with delegation-intelligence

This skill makes hivexplorer delegation MANDATORY for hivefiver:

- `delegation-intelligence` provides delegation patterns (generic)
- This skill REQUIRES delegation for every unverified claim (hivefiver-specific)

### Interaction with context-integrity

This skill provides a concrete remediation for drift:

- `context-integrity` detects drift via hooks and metrics
- This skill says: when drift detected, delegate to hivexplorer to re-verify state

---

## Component 5: Runtime Situation Router

Situations emerge at runtime. Each requires a specific delegation target, skill load sequence, and flow. Hivefiver MUST classify before acting.

### Situation Detection Decision Tree

```
USER REQUEST arrives
    |
    v
1. Is it about FILE CONTENTS or CODEBASE STATE?
   YES -> INVESTIGATION situation
   |
2. Is it about EXTERNAL KNOWLEDGE (stack, ecosystem, patterns)?
   YES -> RESEARCH situation
   |
3. Is it about SEQUENCING WORK or BREAKING DOWN TASKS?
   YES -> PLANNING situation
   |
4. Is it about BUILDING/MODIFYING framework assets?
   YES -> EXECUTION situation
   |
5. Is it about FIXING BROKEN things?
   YES -> REMEDIATION situation
   |
6. Is it about VERIFYING QUALITY or COMPLIANCE?
   YES -> VERIFICATION situation
   |
7. None of the above -> Ask the human for clarification
```

### Situation -> Delegation + Skill Routing Table

#### INVESTIGATION — "What exists? What does file X contain?"

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | You need codebase facts, not assumptions |
| 2 | Load skill | `delegation-intelligence` (if not loaded) |
| 3 | Delegate to | `hivexplorer` (READ-ONLY investigator) |
| 4 | Packet must include | Exact file paths, specific claims to verify |
| 5 | Await return | `{ outcome, evidence[], confidence, gaps }` |
| 6 | Confidence gate | VERIFIED -> proceed; CONTRADICTED -> reassess; PARTIAL -> note gaps |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> `delegation-intelligence`
**Delegation target**: `hivexplorer` (terminal, no sub-delegation)
**When**: BEFORE any action that references file contents

```
Packet template:
  Task: Investigate [specific files/patterns]
  Type: [existence | content | structure | conflict]
  Files: [exact paths]
  Claim: "[what I believe to be true]"
  Return: { outcome, evidence[], confidence, gaps }
  Constraints: READ-ONLY
```

---

#### RESEARCH — "How does X technology work? What are best practices for Y?"

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | External knowledge needed, NOT in codebase |
| 2 | Load skill | `hivefiver-mcp-research-loop` (MCP retry + fallback governance) |
| 3 | Sub-classify the research type | See research sub-routing below |
| 4 | Delegate to | `hiverd` (external research specialist) |
| 5 | Packet must include | Specific questions, stack context, expected format |
| 6 | Await return | Synthesized knowledge with source citations |
| 7 | If synthesis needed | Load `synthesis-patterns` skill, iterate over findings |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> `hivefiver-mcp-research-loop`
**Delegation target**: `hiverd` (terminal)

##### Research Sub-Routing (delegate to hiverd with these instructions)

| Research Type | Tools hiverd Should Use | Retry Strategy |
|---------------|------------------------|----------------|
| Single-stack deep dive (e.g., "OpenCode plugin API") | Context7 first, Deepwiki fallback | Sequential, 3 retries, 5s delay |
| Semantic question about a repo | Deepwiki first, Context7 fallback | Sequential, 3 retries, 5s delay |
| Pattern/best-practice lookup | Context7 for official docs, then Tavily for community | Sequential |
| Multi-stack combo (e.g., "Zod + OpenCode plugin") | Context7 per stack, then combine | Sequential per stack, then synthesize |
| General market/ecosystem research | Tavily search, then Tavily extract on best results | Parallel-safe (different URLs) |
| Find a skill for a specific stack | `find-skills` skill, then validate via Context7 | Sequential |

**CRITICAL MCP rules for hiverd delegation packet:**
- Context7 and Deepwiki: NEVER call in parallel (timeout-sensitive)
- Retry up to 3 times with 5-second delays
- Web tools (Tavily, WebFetch) are fallbacks only
- ALL research MUST return with source citations

```
Packet template:
  Task: Research [specific question]
  Type: [single-stack | semantic | pattern | multi-stack | market | skill-find]
  Stack context: [what technologies are involved]
  Questions: [numbered list of specific questions]
  Return: { findings[], sources[], confidence, gaps }
  Constraints: External knowledge only. Cite sources.
```

---

#### PLANNING — "How should we sequence this? Break this down."

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | Work needs sequencing, dependency analysis, or phase design |
| 2 | Verify context first | Delegate to `hivexplorer` to confirm current project state |
| 3 | Load skill | `hiveplanner-orchestration` (phase/task design methodology) |
| 4 | Delegate to | `hiveplanner` (planning specialist) |
| 5 | Packet must include | Goal, current state (from hivexplorer), constraints, dependencies |
| 6 | Await return | Plan with phases, tasks, acceptance criteria, dependency graph |
| 7 | Store plan | Ensure plan is written to `.hivemind/plans/` as SOT |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> `delegation-intelligence` -> (hivexplorer first) -> `hiveplanner-orchestration`
**Delegation target**: `hiveplanner` (needs hivexplorer evidence as input)

**CRITICAL**: Never plan without first verifying current state via hivexplorer. Plans built on hallucinated state are worse than no plan.

```
Packet template:
  Task: Create plan for [specific goal]
  Current state: [attach hivexplorer evidence]
  Constraints: [scope, dependencies, blocked paths]
  Output to: .hivemind/plans/[PLAN-NAME].md
  Return: { plan_path, phases[], task_count, dependencies[], risks[] }
  Constraints: Plans to docs/ only. NO src/** edits.
```

---

#### EXECUTION — "Build this agent/skill/command"

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | Framework asset needs to be created or modified |
| 2 | Verify target first | Delegate to `hivexplorer` — does target exist? What's current content? |
| 3 | Verify plan exists | Is there a plan in `.hivemind/plans/` for this work? |
| 4 | Load skill | `hivefiver-mode` first, then stage helper (`hivefiver-coordination` when quality gates are required) |
| 5 | If framework asset | Self-delegate via `hivefiver` (you are the builder) |
| 6 | If product code needed | Delegate to `hivemaker` (NEVER touch src/ yourself) |
| 7 | Quality gate | Load `evidence-discipline`, run quality check before claiming done |
| 8 | Verify output | Delegate to `hivexplorer` to confirm output files exist and match contract |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> (hivexplorer verify) -> `hivefiver-mode` -> `hivefiver-coordination` -> `evidence-discipline`
**Delegation targets**:
- Framework assets -> `hivefiver` (self-delegate with clean context)
- Product code -> `hivemaker` (NEVER your domain)
- Quality check -> `hiveq` (pass/fail verdict)

```
Packet template (self-delegation):
  Task: Build [asset type]: [name]
  Stage: [build | architect]
  Verified state: [attach hivexplorer evidence of current state]
  Plan reference: [.hivemind/plans/X.md]
  Quality gate: Run quality-check before claiming done
  Return: { files_created[], files_modified[], evidence, quality_result }
  Constraints: .opencode/** and .hivemind/** only. NO src/**
```

---

#### REMEDIATION — "This is broken, fix it"

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | Something is broken and needs debugging/fixing |
| 2 | Investigate first | Delegate to `hivexplorer` — what exactly is broken? Gather symptoms |
| 3 | If framework issue | Load `hivefiver-mode` (doctor route), self-delegate |
| 4 | If product code issue | Delegate to `hivehealer` (debugging specialist) |
| 5 | If multi-domain | Sequential: hivexplorer (symptoms) -> hiveplanner (fix plan) -> hivehealer/hivefiver (execute) |
| 6 | Verify fix | Delegate to `hivexplorer` again to confirm fix worked |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> (hivexplorer investigate) -> `hivefiver-mode` (doctor route) OR delegate to `hivehealer`
**Delegation targets**:
- Investigate -> `hivexplorer` (symptoms)
- Framework fix -> `hivefiver` (self, doctor mode)
- Product fix -> `hivehealer`
- Verify fix -> `hivexplorer` (confirmation)

```
Packet template:
  Task: Investigate and diagnose [broken thing]
  Symptoms: [what appears wrong]
  Files to check: [suspected locations]
  Return: { root_cause, evidence[], affected_files[], fix_recommendation }
  Constraints: READ-ONLY investigation. Do NOT fix yet.
```

---

#### VERIFICATION — "Is this correct? Does this meet standards?"

| Step | Action | Details |
|------|--------|---------|
| 1 | Classify | Quality check, compliance audit, or pass/fail needed |
| 2 | Gather evidence first | Delegate to `hivexplorer` — collect actual state |
| 3 | Load skill | `verification-methodology` (goal-backward analysis) |
| 4 | Delegate to | `hiveq` (quality/verification specialist) |
| 5 | Packet must include | Acceptance criteria, evidence from hivexplorer, what to verify |
| 6 | Await return | PASS/FAIL verdict with evidence |

**Skill sequence**: `hivefiver-prime` -> `hivefiver-context-enforcer` -> (hivexplorer gather) -> `verification-methodology`
**Delegation target**: `hiveq` (read-only, produces verdicts)

```
Packet template:
  Task: Verify [specific asset/output] against [criteria]
  Evidence: [attach hivexplorer findings]
  Acceptance criteria: [specific pass/fail conditions]
  Return: { verdict: "PASS"|"FAIL", evidence[], gaps[], recommendations[] }
  Constraints: READ-ONLY. Verdict only, no modifications.
```

---

### Situation Chaining (When Multiple Situations Apply)

Real tasks often chain situations. Always follow this order:

```
INVESTIGATE (always first)
    |
    v
RESEARCH (if external knowledge gaps found)
    |
    v
PLAN (if multi-step work identified)
    |
    v
EXECUTE (one step at a time)
    |
    v
VERIFY (after each execution)
    |
    v
REMEDIATE (only if verification fails)
    |
    v
VERIFY again (confirm remediation worked)
```

**Never skip INVESTIGATE.** It is always step 1.

### Runtime Skill Budget

To prevent skill avalanche (anti-pattern G-07):

| Max skills loaded | When |
|-------------------|------|
| 3 | Normal operation (prime + enforcer + 1 situation skill) |
| 4 | Complex multi-situation (prime + enforcer + 2 situation skills) |
| 5 | ABSOLUTE MAXIMUM — triggers warning |
| 6+ | BLOCKED — self-delegate with fresh context instead |

When you need a 6th skill, checkpoint your state and self-delegate:
```
1. Emit checkpoint (what's done, what's pending, evidence collected)
2. Self-delegate to hivefiver with clean context
3. New session loads only the skills needed for remaining work
```

---

## Quick Reference Card

```
+------------------------------------------------------------+
|  HIVEFIVER CONTEXT ENFORCER — QUICK REFERENCE              |
+------------------------------------------------------------+
|                                                             |
|  YOU ARE BLIND.                                             |
|  read:deny  glob:deny  grep:deny  bash:deny                |
|                                                             |
|  BEFORE ANY ACTION:                                         |
|  1. DECLARE: Output context declaration (first 3 turns)     |
|  2. VERIFY: Delegate to hivexplorer for file verification   |
|  3. PROCEED: Only after verified evidence returned          |
|                                                             |
|  WARNING ESCALATION:                                        |
|  WARN-1 (Turn 4+)  -> Self-check prompt                    |
|  WARN-2 (Turn 8+)  -> MANDATORY hivexplorer delegation     |
|  WARN-3 (Turn 12+) -> HALT - Human confirmation required   |
|  WARN-4 (Turn 16+) -> EMERGENCY - Session isolation        |
|                                                             |
|  CONFIDENCE LEVELS:                                         |
|  VERIFIED     = hivexplorer confirmed this session          |
|  PARTIAL      = some claims verified, gaps remain           |
|  UNVERIFIED   = no delegation performed (DEFAULT START)     |
|  POISONED     = contradictions or failures detected         |
|                                                             |
|  REMEMBER: EVERY claim must be verified through             |
|            hivexplorer. Unverified = hallucinated.           |
+------------------------------------------------------------+
```
