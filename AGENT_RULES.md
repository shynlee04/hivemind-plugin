# HiveMind v3.0 — Relational Cognitive Engine Constitution

**Updated:** 2026-02-16 | **Version:** `v3.0.0` | **Branch:** `dev-v3`

---
*NON-NEGOTIABLE RULES:** CAN'T NOT SKIP - MOST IMPORTANT FOR FRONT FACING AGENTS - APART FROM CONTEXT REGULATING, RECORDING, RETRIVING AND GIT COMMIT - YOU ARE NOT ALLOWED TO CARRY ANY OTHER ACTIONS THAN **DELEGATION** AND **CORDINATION OF OTHER AGENTS**

1.  if you are the **front-facing-agent:** never start action/execution first -> **ALWAYS** load context, retrace past event - knowing which TODO tasks connected with, what are past plans
2. Number 1 is true not matter in-between turns, starting new or after compact
3. from 1 and 2 , never act or execute with out plan
4. never act if the plan with tasks are not connected
5. if you can't find any skill related to - you must find SKILL - do not execute any actions
6. if you can't find connected points of a demanding workloads - back to 1
7. always keep context relevant, with anchor, states and brains loaded.
YES COORDINATION, SKILLS AND SKILLS DON'T TELL ME YOU FIND NO SKILLS TO LOAD
---

```
/Users/apple/hivemind-plugin/.opencode/skills
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity
/Users/apple/hivemind-plugin/.opencode/skills/context-integrity/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence
/Users/apple/hivemind-plugin/.opencode/skills/delegation-intelligence/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline
/Users/apple/hivemind-plugin/.opencode/skills/evidence-discipline/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance
/Users/apple/hivemind-plugin/.opencode/skills/hivemind-governance/SKILL.md
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle
/Users/apple/hivemind-plugin/.opencode/skills/session-lifecycle/SKILL.md
```

## 1. BRANCH PROTECTION POLICY (CRITICAL)

| Branch | Purpose | Allowed Content |
|--------|---------|-----------------|
| **`dev-v3`** | Development, planning, tracking, internal docs | **Everything**: AGENTS.md, CHANGELOG.md, .opencode/**, docs/plans/**, prompts/**, templates/** |
| **`master`** | Public release (clean for end-users) | **Source code only**. NO secrets, NO planning docs, NO .opencode, NO "how-I-do-this" |

### Master Branch Forbidden Paths
```
AGENTS.md, CHANGELOG.md
.opencode/**, .hivemind/**
docs/plans/**, docs/reference/**
prompts/**, templates/**, agents/**
```

### Guardrail
```bash
npm run guard:public  # Run BEFORE any master push
# Override: ALLOW_SENSITIVE_PUBLIC=1 (explicit approval only)
```

---

## 2. THE ARCHITECTURAL TAXONOMY (The Biological Model)

**Core Philosophy**: Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, and the Actor Model.

### Layer Responsibilities

| Layer | Location | Role | The Rule |
|-------|----------|------|----------|
| **Tools** | `src/tools/` | **Conscious Limbs** (Write-Only) | LLM-facing API wrappers. Zod schemas + descriptions. **>100 lines = architecturally flawed.** |
| **Libraries** | `src/lib/` | **Subconscious Engine** (RAM/CPU) | Pure TypeScript logic. Never returns natural language. Returns JSON, Booleans, or dense XML. |
| **Hooks** | `src/hooks/` | **Autonomic Nervous System** (Read-Auto) | SDK event listeners. Call Libraries to compile state into purified XML → inject as `synthetic: true`. |
| **Schemas** | `src/schemas/` | **DNA** (Zod Validation Layer) | All graph nodes MUST have UUID `id` + explicit FK fields. Orphaned nodes fail validation. |

### Enforcement Paradigms

| Paradigm | Meaning |
|----------|---------|
| **CQRS** | Tools = Write-Only Commands. Hooks + Libs = Read-Only Queries. Agent writes via tools, NEVER reads its own memory via tools. |
| **Graph-RAG** | All `graph/` entities are UUID-keyed JSON with FKs. Cognitive Packer traverses deterministically. |
| **Actor Model** | Sessions are isolated containers. Sub-agent "swarms" run in headless child sessions via `client.session.create()` + `noReply: true`. |

---

## 3. THE `.hivemind` RELATIONAL STRUCTURE

```
.hivemind/
├── system/                 # CORE GOVERNANCE
│   ├── config.json         # TTS thresholds, 80% split limits
│   └── manifest.json       # Master Index (maps all active UUIDs)
│
├── graph/                  # THE RELATIONAL DATABASE
│   ├── trajectory.json     # Read-Head (active_plan_id, phase_id, task_ids[])
│   ├── plans.json          # Epics & Phases (FK: sot_doc_path)
│   ├── tasks.json          # Execution Graph (FK: parent_phase_id)
│   └── mems.json           # Multi-shelf knowledge (FK: origin_task_id)
│
├── state/                  # HOT SESSION STATE
│   ├── brain.json          # Slim: session metadata + metrics only
│   ├── anchors.json        # Immutable anchors (survive compaction)
│   └── hierarchy.json      # Legacy tree (deprecated after migration)
│
└── sessions/               # SDK CONTAINERS (Actor Model)
    ├── active/             # Main session + swarms/
    └── archive/            # Compacted + splits/
```

### Graph-RAG Topology
```
[PLAN] ─has many─▶ [PHASE] ─has many─▶ [TASK] ─generates─▶ [MEM]
  │                    │                    │                   │
  │ sot_doc_path       │ parent_plan_id(FK) │ parent_phase_id(FK)│ origin_task_id(FK)
  │ status             │ order, status      │ assigned_session   │ type: insight|false_path
  └─ phases[]          └─                   │ file_locks[]       │ staleness_stamp
                                          └─ status             └─ shelf, tags
```

---

## 4. COGNITIVE PACKER FLOW (Repomix-for-State)

```
Step 1 — WRITE-THROUGH (Tools → Graph)
  Agent calls tool → lib/graph-io.ts → Zod validates → UUID assigned → staleness_stamp computed

Step 2 — COMPILATION (lib/cognitive-packer.ts)
  Read trajectory → Traverse via FK → Time Machine (drop false_path/invalidated)
  → TTS Filter (drop stale mems unless linked) → Relevance sort

Step 3 — COMPRESSION (Lib → XML)
  <hivemind_state timestamp="..." session="..." compaction="#N">
    <trajectory intent="..." plan="..." phase="..." active_tasks="3" />
    <active_tasks>...</active_tasks>
    <relevant_mems count="5" stale_dropped="12" false_path_pruned="3">...</relevant_mems>
    <anchors>...</anchors>
    <governance drift="75" turns="12" violations="0" health="85" />
  </hivemind_state>

Step 4 — INJECTION (Hook → LLM)
  messages.transform fires → Inject TWO synthetic parts:
  1. Context Payload (XML)
  2. Pre-Stop Gate Checklist
```

---

## 5. TEAM ORCHESTRATION (V3.0)

### Two-Team Execution Model

| Team | Scope | Mode | Focus |
|------|-------|------|-------|
| **JULES** | Frontend (OpenTUI Dashboard) | Remote sequential (clone `dev-v3`) | 5 views, bilingual EN/VI, Stitch designs |
| **LOCAL** | Backend (Graph Schemas, Tools, Hooks) | Sequential or parallel sub-agents | CQRS, Graph-RAG, Actor Model |

### Integration Boundaries
- **Schema contracts**: TypeScript interfaces in `src/schemas/`
- **API boundaries**: Tool interfaces in `src/tools/`
- **Event contracts**: Hook event types in `src/hooks/`

### Quality Gates (Universal)
```bash
npm test              # All tests pass
npx tsc --noEmit      # Type check clean
```

### Quality Gates (UI Stories)
```bash
bun run dashboard     # Manual visual verification
```

---

## 6. EXECUTION PROTOCOL

### Before ANY Code Change
1. **Read PRD**: `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md`
2. **Understand scope**: Each story = one agent iteration
3. **Verify dependencies**: Schema → Backend → UI

### During Execution
```
declare_intent({ mode, focus })  — START every session
map_context({ level, content })  — UPDATE when focus changes
compact_session({ summary })     — END when done
```

### After Each Story
1. Run quality gates
2. Commit with conventional message
3. Push to `dev-v3` only

---

## 7. V3.0 PRD REFERENCE

**Location:** `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md`

### Phase Overview (50 User Stories, 7 Phases)

| Phase | Stories | Scope | God Prompt |
|-------|---------|-------|------------|
| **1** | US-001 to US-009 | Graph Schemas + Dumb Tool Diet | Foundation — everything depends on this |
| **2** | US-010 to US-016 | CQRS Read Models | Context Compiler — pure data-structuring |
| **3** | US-017 to US-023 | Graph-RAG Memory | Wire Packer into LLM cognition loop |
| **4** | US-024 to US-029 | Actor Model Orchestration | Session Swarms + 80% Split |
| **5** | US-030 to US-036 | Dead Code Cleanup + Tool Unification | Wire canonical tools, delete old |
| **6** | US-037 to US-043 | Edge Cases + Hardening | Testing & verification |
| **7** | US-044 to US-050 | OpenTUI Dashboard | 5 views, bilingual EN/VI |

### Stitch Design Screens
**Location:** `docs/stitch-screens/screen-*.html` (11 screens)

---

## 8. THE FOUR GOD PROMPTS

### God Prompt 1: Graph Database & Dumb Tool Diet
> Build `src/schemas/graph-nodes.ts` (Zod) — strict relational schemas with UUID + FK. Extract ALL business logic from tools → libs. Tools must ONLY define Zod schema + call lib + return string. **≤100 lines each.**

### God Prompt 2: The Cognitive Packer
> Build `src/lib/cognitive-packer.ts` — deterministic Context Compiler. Reads trajectory → traverses graph via FK → Time Machine prunes false_path → TTS filters stale mems → compresses to XML. **NO LLM prompts, NO tool definitions.**

### God Prompt 3: SDK Mid-Turn Injection & Pre-Stop Gate
> Wire packer output into LLM cognition via `messages.transform`. Push TWO synthetic parts: (1) XML context, (2) Pre-Stop Gate checklist. Slim `session-lifecycle.ts` from 586L → **≤200L**.

### God Prompt 4: Session Swarms & The 80% Split
> Build `src/lib/session-swarm.ts` — SDK session manipulation + Actor Model. Monitor token pressure → at 80%: `packCognitiveState()` → `client.session.create()` → `noReply` inject XML as Turn 0. Headless researchers save to graph/mems.json.

---

## 9. VERIFICATION STATE

| Check | Command | Expected |
|-------|---------|----------|
| Tests | `npm test` | All pass |
| Types | `npx tsc --noEmit` | Clean |
| Guard | `npm run guard:public` | Zero violations (master) |

---

## 10. KEY FILES

| File | Purpose |
|------|---------|
| `src/schemas/graph-nodes.ts` | Zod schemas for all graph entities |
| `src/lib/cognitive-packer.ts` | Context compiler (Phase 2) |
| `src/lib/graph-io.ts` | CRUD for graph/*.json |
| `src/lib/session-swarm.ts` | Actor Model swarms (Phase 4) |
| `src/hooks/messages-transform.ts` | Mid-turn injection |
| `scripts/guard-public-branch.sh` | Master branch protection |

---

## 11. STYLE CONVENTIONS

- **Indent:** 2 spaces
- **Quotes:** Double quotes
- **Imports:** Use `.js` extension for local imports
- **Paths:** ALWAYS use `getEffectivePaths()` from `src/lib/paths.ts`
- **Tools:** ≤100 lines each (dumb tools)

---

## 12. GLOSSARY

| Term | Definition |
|------|------------|
| **Trajectory** | The "Read-Head" — active plan/phase/task IDs |
| **Read-Head** | Current focus in the graph (trajectory.json) |
| **Time Machine** | Drops `false_path` and `invalidated` nodes from context |
| **TTS** | Time-To-Stale — filters expired mems |
| **Stamp** | Timestamp-based ID (YYMMDDHHMM + random) |
| **Anchor** | Immutable constraint (survives compaction) |
| **Mem** | Long-term memory (insight or false_path) |
| **Swarm** | Headless sub-agent session with `noReply: true` |

---

*This is the Constitution. Refer to `docs/refactored-plan.md` for architectural details and `docs/plans/prd-hivemind-v3-relational-engine-2026-02-16.md` for user stories.*
