---
name: hivemind-power-on
description: >-
  When start, resume, continue the session. TRhis is the core and must load at all runtime under Hivemind framework.MUST-LOAD governance for L0/L1 agents. Routes hm/hf lineage, 
  manages session lifecycle, enforces quality gates, optimizes context. 
  Load FIRST. Triggers: session start, resume, disconnect, compact.
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

# Hivemind Power-On — Session Governance

## 7 IRON LAWS

You are asked to start continue resume session, continue the session, no matter what you acknowledge, start sub/child session right under your level no matter what, tracking under `.hivemind/sessions-tracker/`
```

- the session aborted -> you must start at the EXACT same id to continue it the context is preserved  you do not thinking  just resume as long as you detected your there are last sub sessions with id 

- if completed - you also must resume the EXACT SAME ID 

- the session cancelled -> you can continue it or create new session with same id
1. NEVER start new session when aborted exists → use EXACT task_id
2. NEVER repeat prompt when resuming → context is preserved  
3. NEVER L0→L2 dispatch → always L0→L1→L2
4. NEVER skip quality gate triad → lifecycle→spec→evidence in order
5. NEVER load >3 skills at once → context budget is shared
6. NEVER read full files when grep/offset works → line-aware reading
7. ALWAYS use session-tracker to find aborted sessions before starting fresh
```

## ROUTING TABLE

| Signal | Route To | Depth |
|--------|----------|-------|
| `/hf-create`, `/hf-audit`, `/hf-stack`, agent/skill/command creation | → hf-lineage, `hf-l1-coordinator` | [ref-01 §2] |
| `/plan`, `/ultrawork`, `/gsd-*`, feature/bug/architecture work | → hm-lineage, `hm-l1-coordinator` | [ref-01 §3] |
| Disconnect recovery, session resume | → RESUME protocol | [ref-02 §1] |
| Context compact/purge recovery | → SURVIVAL protocol | [ref-03 §1] |
| L0→L1→L2 delegation chain dispatch | → DELEGATION protocol | [ref-04 §1] |
| Quality gate needed on child output | → GATE TRIAD | [ref-05 §1] |
| Ambiguous hm-vs-hf lineage | → `hm-l2-user-intent-interactive-loop` | [ref-01 §4] |

## QUICK REFERENCE — Session-Tracker Cheat Sheet

```
find all sessions:     session-tracker({action:"list-sessions"})
export one session:    session-tracker({action:"export-session", sessionId:"ses_xxx"})
search aborts:         session-tracker({action:"search-sessions", query:"aborted|cancelled"})
read hierarchy:        read(".hivemind/session-tracker/<id>/session-continuity.json")
read project index:    read(".hivemind/session-tracker/project-continuity.json")
grep last user turn:   grep(pattern:"## USER \\(turn", path:".hivemind/session-tracker/<id>/")
```

Full tool API reference: [ref-06 §1]

## REFERENCE MAP

```
references/01-lineage-routing.md        — hm vs hf decision tree, command routing, cross-lineage rules, domain maps
references/02-session-resume-protocol.md — disconnect recovery, resume cascade, health dashboard, worked example
references/03-compact-survival.md       — context purge recovery, optimization rules, state reconstruction
references/04-delegation-chain.md       — L0→L1→L2 dispatch, task_id tracking, depth limits, anti-patterns
references/05-quality-gates.md          — lifecycle→spec→evidence triad, enforcement, HMQUAL compliance
references/06-session-tracker-manual.md — .hivemind/ structure, JSON schemas, navigation patterns, tool API
```

## ASSET BUNDLES

| Agent Type | Load | Why |
|------------|------|-----|
| **L0 (orchestrator)** | ref-01 + ref-02 + ref-04 + ref-06 | route + resume + delegate + track |
| **L1 (coordinator)** | ref-04 + ref-05 + ref-06 | delegate + gates + track |
| **L2/L3 (specialist)** | ref-05 only | gates only (coordinator handles routing) |
| **Post-disconnect (any)** | ref-02 + ref-06 | resume + track |
| **Post-compact (any)** | ref-03 + ref-06 | survive + track |
| **Lineage ambiguous** | ref-01 | routing decision tree |

## ESCALATION RULES

```
- 3 consecutive gate failures → escalate to user with full gap report
- Ambiguous hm-vs-hf → load hm-l2-user-intent-interactive-loop
- session-tracker not responding → direct read .hivemind/session-tracker/project-continuity.json
- task_id expired (session not found) → export .md, extract prompt, create NEW dispatch with same params
```

## LIFECYCLE SUMMARY

```
POWER-ON → classify lineage → load lineage router → domain work → quality gates → report
DISCONNECT → RESUME protocol [ref-02] → resume deepest active child → continue
COMPACT → SURVIVAL protocol [ref-03] → reconstruct from disk → confirm with user
L2/L3 SPECIALIST → load ref-05 (gates only) → complete work → return to coordinator
```

## CRITICAL LOADING ORDER

```
hivemind-power-on (FIRST — this skill) → lineage router → domain skill (max 3 total loaded)
```

> **L2/L3 specialists:** Do NOT load this skill. Your coordinator loaded it for you.
> **Context budget:** Every line of this file costs context. See [ref-03 §2] for optimization rules.
