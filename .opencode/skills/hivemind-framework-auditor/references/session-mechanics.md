# OpenCode Session Mechanics — How Agents "See" the World

> Load this reference in Mode 3 (INTEGRATE) and Mode 4 (IMPROVE) when session-related.
> Understanding these mechanics is CRITICAL for designing assets that survive session boundaries.

---

## Table of Contents

1. [Session Lifecycle](#1-session-lifecycle)
2. [What Survives vs What Dies](#2-what-survives-vs-what-dies)
3. [The Delegation Problem](#3-the-delegation-problem)
4. [Agent Cognitive Limitations](#4-agent-cognitive-limitations)
5. [Design Implications](#5-design-implications-for-framework-assets)

---

## 1. Session Lifecycle

```
SESSION START
│
├── 1. opencode.json loaded
│   ├── Agent defined? → load agent .md frontmatter (YAML fields ACTIVE)
│   └── MD body → loaded BUT volatile (degrades mid-session)
│
├── 2. AGENTS.md → loaded into system prompt
│   └── This is the ONLY persistent body text ALL agents see EVERY turn
│
├── 3. Skills → NOT loaded yet
│   ├── Only metadata (name + description) is in context (~100 tokens each)
│   ├── Body loads ONLY when skill triggers
│   └── References/scripts load ONLY when skill explicitly reads them
│
├── 4. Commands → DISCOVERED by filename in commands/
│   ├── Frontmatter parsed when user invokes command
│   └── Body (prompt) injected into THAT turn's context only
│
├── 5. Workflows → NOT loaded
│   └── Only accessed when command's execution_context fires
│
└── 6. Prompts/References → NOT loaded
    └── Only pulled in when skill/command/workflow explicitly asks
```

**Key insight**: At session start, agents see AGENTS.md + skill metadata + their own YAML frontmatter. Everything else is demand-loaded. Design assets assuming they start invisible.

## 2. What Survives vs What Dies

| Entity | Survives Session? | Survives Compact? | Where It Lives |
|---|---|---|---|
| Agent YAML frontmatter | Always | Always | `.opencode/agents/*.md` header |
| Agent MD body | Volatile (degrades) | Lost | `.opencode/agents/*.md` body |
| AGENTS.md | Always | Always | Project root |
| Skill metadata | Always | Always | `skills/*/SKILL.md` header |
| Skill body | On trigger only | Lost | `skills/*/SKILL.md` body |
| Command frontmatter | On invoke only | Always | `commands/*.md` header |
| Command body | On invoke only | Lost after turn | `commands/*.md` body |
| Conversation history | In session | Lost on compact | OpenCode runtime memory |
| `.hivemind/` state | Always | Always | Filesystem (Sector-1) |
| Anchors | Always | Always | `.hivemind/state/` |
| Memories (mems) | Always | Always | `.hivemind/state/` |

**Critical implications**:
- Anything that must persist across compaction MUST be in filesystem (.hivemind/, anchors, mems)
- Agent MD body is unreliable mid-session — put critical instructions in AGENTS.md or skills
- Skill bodies are ephemeral — don't rely on them being "already loaded" from earlier turns

## 3. The Delegation Problem

When `hiveminder` delegates to (say) `hivemaker` via Task():

```
hiveminder context (FULL — accumulated over session)
├── Full conversation history up to this point
├── Its own agent YAML (mode/tools/permissions)
├── AGENTS.md content
├── Whatever skills triggered during conversation
└── Session memory, anchors, trajectory state

       │ Task() delegation
       ▼

hivemaker context (FRESH — 200K tokens clean)
├── ONLY the Task() prompt text
├── Its own agent YAML (mode/tools/permissions)
├── AGENTS.md content
└── NOTHING ELSE:
    ✗ No parent history
    ✗ No loaded skills from parent
    ✗ No memory of previous turns
    ✗ No understanding of current project state
    ✗ No awareness it was delegated (unless told)
```

**The contract**: Everything the sub-agent needs must be IN the delegation packet or DISCOVERABLE via file reads. The sub-agent does NOT inherit parent context.

**What this means for framework design**:
- Delegation packets must be self-contained
- Include specific file paths to read, not "check the project"
- Set `delegation_source: agent` so sub-agent knows it's not talking to a human
- Set `delegation_depth` so sub-agent knows its place in the chain
- Define `return_schema` so parent can parse the result without re-investigation

## 4. Agent Cognitive Limitations

| Limitation | Impact on Framework | Mitigation |
|---|---|---|
| No deductive traversal | Agents don't naturally explore dependency chains — they stop at first match | Provide explicit `scope_paths` and `related_files` in every delegation |
| Context rot (15-20 turns) | Early decisions degrade; agent may contradict itself | Auto-trigger `scan_hierarchy` every 10 turns; use `think_back` for recovery |
| Happy-path bias | Agents skip edge cases unless explicitly told to check | Include `failure_policy` and edge case lists in delegation packets |
| No cross-session memory | Each session starts blank — previous decisions are invisible | Persist via `save_mem` + `save_anchor`; read `STATE.md` at session start |
| Token ceiling (200K) | Context fills fast with skill loading + conversation + file reads | Progressive disclosure L0→L3; token budgets per workflow step |
| No delegation-depth awareness | Sub-agents don't know they're sub-agents | `is_delegated: true` + `delegation_depth: N` in every packet |

## 5. Design Implications for Framework Assets

### For Commands
- Frontmatter MUST be complete — it's the ONLY part that's always discoverable
- Body is ephemeral (one turn only) — make it self-contained for that turn
- Include deterministic bash checks in `<context>` blocks — don't rely on agent "remembering"

### For Workflows
- Steps must be independently verifiable — agent may start mid-workflow after compaction
- `entry_criteria` for each step must check filesystem state, not conversation state
- `skill_bundles` per step prevents D-02 (avalanche) — load only what this step needs

### For Skills
- Description is the ONLY thing always visible — write it for trigger accuracy
- Body loads once per trigger — make it immediately actionable, not "background reading"
- References load on-demand — include explicit "READ THIS WHEN" guidance with "DO NOT LOAD" counterpart

### For Delegation Packets
- Self-contained — sub-agent has zero parent context
- Explicit scope — exact files, not "the project"
- Structured returns — parent must parse without re-investigation
- Depth-aware — sub-agent knows it's delegated, not user-facing

### For Persistence
- Decisions → `save_anchor` (immutable, survives everything)
- Research findings → `save_mem` (searchable, survives sessions)
- Session state → `map_context` (survives within session only)
- Planning state → `STATE.md` or `.hivemind/` filesystem (survives everything)

---

## 6. Context Engineering — Budget, Disclosure, and Coherence

> Understanding these mechanics is essential for designing assets that remain effective
> under token pressure, survive compaction, and don't degrade agent reasoning.

### 6.1 Turn-Level Context Budget

Every agent turn has a finite context window (~200K tokens). Budget is consumed by:

```
CONTEXT BUDGET BREAKDOWN (approximate per turn)
│
├── System prompt (AGENTS.md + agent YAML)     ~2K-5K tokens (FIXED)
├── Conversation history                       ~10K-100K tokens (GROWS)
├── Loaded skills (per trigger)                ~1K-8K per skill (DEMAND)
├── File reads (grep/glob/read results)        ~500-5K per read (DEMAND)
├── Tool call results                          ~200-2K per call (DEMAND)
├── HiveMind state injection (hook)            ~1K-3K tokens (FIXED per turn)
└── REMAINING for reasoning                    Whatever is left
```

**Key rules**:
- Agent reasoning quality degrades as remaining budget shrinks
- After ~15-20 turns, conversation history alone can consume 60-80% of budget
- This is why `compact_session` exists — it resets history while preserving anchors/mems
- Framework assets should target minimal token footprint: prefer 200-line references over 500-line monoliths
- Skill loading should be surgical — D-02 (skill avalanche) can consume 40K+ tokens in one step

**Design implication**: Every reference file, skill body, and template should have a known token cost. If a single skill + its references exceeds 15K tokens, it MUST use progressive disclosure.

### 6.2 Progressive Disclosure Verification (L0 → L3)

Assets should layer information so agents load only what they need:

| Level | What Loads | When | Token Cost |
|---|---|---|---|
| **L0 — Discovery** | Skill name + description (metadata only) | Always (session start) | ~100 tokens/skill |
| **L1 — Triage** | SKILL.md body (mode router, workflow steps) | On skill trigger | ~500-2K tokens |
| **L2 — Domain** | Specific reference file (e.g., `audit-criteria.md`) | On explicit read within skill | ~1K-5K tokens |
| **L3 — Deep** | Multiple references + scripts + assets | Only for REFACTOR or full AUDIT modes | ~5K-15K tokens |

**Verification checklist** (for any skill pack):
- [ ] L0: Description answers WHAT + WHEN + KEYWORDS in < 100 words
- [ ] L1: SKILL.md body has mode router or decision tree that gates L2 loading
- [ ] L1: SKILL.md explicitly says "Do NOT load" for irrelevant references per mode
- [ ] L2: Each reference file is self-contained (doesn't require loading another reference to be useful)
- [ ] L3: Full-load scenario is documented with approximate token cost
- [ ] Anti-D-02: No mode loads more than 3 reference files simultaneously

**Failure mode**: If a skill loads all references on trigger (L1 → L3 in one step), it creates a context avalanche. The mode router exists specifically to prevent this.

### 6.3 Session Coherence Checks

Session coherence means the agent's understanding of project state stays accurate across turns and compaction events. Three mechanisms maintain coherence:

**1. Anchors (immutable cross-session)**
```
save_anchor("wave-1-completion", "WAVE 1 COMPLETE. Gate: 1386 PASS...")
```
- Survive compaction, session restart, and context clear
- Injected into every turn via session-lifecycle hook
- Limited to ~5-10 active anchors (more = budget pressure)
- **Coherence check**: After compaction, verify anchors reflect current state (not stale decisions)

**2. Memories (searchable cross-session)**
```
save_mem({ shelf: "decisions", content: "Chose HYBRID-A+B approach..." })
```
- Survive sessions but are NOT auto-injected — must be explicitly recalled
- **Coherence check**: `recall_mems({ query: "current approach" })` should return consistent results
- Stale mems can cause contradictory guidance — prune regularly

**3. Hierarchy tree (session-scoped)**
```
trajectory → tactic → action
```
- Represents current work focus — survives within session only
- Lost on compaction (must be re-established via `declare_intent`)
- **Coherence check**: `scan_hierarchy` drift_score should stay > 60
- If drift_score drops below 40: STOP, re-establish trajectory, do not continue

**Coherence failure indicators**:
- Agent contradicts an earlier decision within same session → context rot (B-04)
- Agent re-does work that was already completed → missing anchor or mem
- Agent loads wrong skill for current phase → hierarchy drift
- Agent produces output inconsistent with active trajectory → drift_score < 40

### 6.4 Deterministic Scripts vs Agent-Generated Scripts

A critical distinction for framework asset quality:

| Aspect | Deterministic Script | Agent-Generated Script |
|---|---|---|
| **Location** | `scripts/*.sh` (committed to repo) | Generated inline during session |
| **Behavior** | Same input → same output, every time | Varies by agent reasoning, context, model |
| **Survives session** | Yes (filesystem) | No (lost on compaction) |
| **Auditable** | Yes (diffable, reviewable) | No (ephemeral) |
| **Trust level** | High — tested and verified | Low — may hallucinate commands |
| **Use case** | Structural checks, validation gates | Ad-hoc exploration, one-off fixes |

**Framework design rule**: All recurring validation checks MUST be deterministic scripts, not agent-generated. An agent should _run_ `scripts/structural-audit.sh`, never _rewrite_ its checks inline.

**Why this matters**:
- Agent-generated bash can hallucinate file paths, use wrong grep flags, or skip edge cases
- Deterministic scripts have been tested against the actual project structure
- When an audit needs a new check, add it to the script (version-controlled) — don't ask the agent to "also check X" inline
- The `structural-audit.sh` and `anti-pattern-detector.sh` in this skill pack are deterministic scripts — their results are reproducible and trustworthy

**Anti-pattern**: An agent that runs `grep -r "execution_context" commands/` inline instead of running `structural-audit.sh` is exhibiting D-03 (redundant research) — the script already does this check with proper edge-case handling.
