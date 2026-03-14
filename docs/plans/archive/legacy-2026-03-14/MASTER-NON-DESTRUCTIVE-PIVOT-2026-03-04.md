# MASTER ORCHESTRATION PLAN: Non-Destructive Pivot

**Date**: 2026-03-04  
**Type**: Master Plan (orchestration guide, NOT implementation spec)  
**Owner**: hiveplanner  
**Authorization**: Each phase = 1 cycle. User must authorize before any cycle begins.  
**Scope**: See **Active-Cycle Scope Boundary (Authoritative)** below.  
**Pillars**: `PIVOTING-TO-NON-DESTRUCTIVE.md` (strategy) + `docs/OPENCODE-ADVANCED-NON-DESTRUCTIVE-META-BUILD.md` (platform mechanics)

### Active-Cycle Scope Boundary (Authoritative)

| Location | Status | Rationale |
|----------|--------|-----------|
| `.opencode/**` | **IN SCOPE** — all phases | Primary execution domain for non-destructive pivot |
| `docs/**` | **IN SCOPE** — planning + documentation only | Plans, findings, progress, reference docs |
| `agents/**` | **IN SCOPE** — read + consolidation only | Agent profile audit, canonical source resolution |
| `.hivemind/**` | **DEFERRED** — return point after `.opencode/` works | Global singleton state; touching it risks cross-session contamination. Mark as future Phase 7+ [DEFERRED:Phase7+] |
| `src/**` | **FORBIDDEN** | Product code, not framework. Delegate to hivemaker/hivehealer only |
| `tests/**` | **FORBIDDEN** | Product tests. Delegate to hitea only |
| `dist/**`, `cli/**` | **FORBIDDEN** | Build artifacts, no manual edits |

> **Rule**: Any phase that references `.hivemind/**` must mark those actions as `[DEFERRED:Phase7+]` and NOT execute them in current cycles. This prevents the scope creep that caused prior contamination.

---

## 1. Goal

Refactor the **hivefiver** module into a non-destructive, context-poison-resistant meta-builder orchestrator — using ONLY OpenCode's innate primitives (agents, skills, commands, plugins, permissions, steps budget) — so that at any session entry point, hivefiver reliably knows its identity, its team, and its governance boundaries, even after compaction, even mid-session, even across delegations, and even when shared subagents operate under the parallel hiveminder lineage.

The pivot abandons the destructive Node 1 injection-layer surgery in favor of an outside-in strategy: clean the landscape first, harden the entry point second, broaden to all agents third, integrate and validate last.

---

## 2. Three Core Design Problems (Architecture Foundation)

These solutions are the LOAD-BEARING ARCHITECTURE that all phases rest on. They are design decisions, not implementation tasks. Every phase must be evaluated against these. **Phase 0 exists solely to ratify or amend these designs.**

### 2.1 Problem 1: Mid-Turn Governance — The 4-Tier Control Plane

**The problem**: Skills are 100% reliable ONLY at T0 (session start). After T0, skill output sits in message history; the model's attention to it decays as conversation grows and tool outputs accumulate. What governs agent behavior mid-session when the skill text is still present but the model is no longer attending to it?

**The answer must use OpenCode's actual durable mechanisms** — not hope that the model re-reads old messages:

```
TIER   WHEN               MECHANISM                           DURABILITY         PLATFORM EVIDENCE
──────────────────────────────────────────────────────────────────────────────────────────────────────
T0     Session Start      Agent body loads into system         100% reliable      Agent.Info.prompt → injected
                          prompt. T0 skill strikes inject      at session init.   into system prompt every turn.
                          expertise into message history.      Skill = prune-     PRUNE_PROTECTED_TOOLS=["skill"]
                          AGENTS.md auto-injected.             protected.         (compaction.ts L50-57)

T1     Mid-Session        Agent body PERSISTS in system        Machine-enforced,  Permission: evaluate() uses
                          prompt (re-sent every turn).         never decays.      findLast() last-match-wins
                          Permissions enforce via machine                         (next.ts L236-243).
                          rules. Steps budget limits                              Steps: maxSteps check
                          agentic iterations.                                     (prompt.ts L556-560):
                                                                                 `const maxSteps = agent.steps
                                                                                 ?? Infinity`
                                                                                 `const isLastStep =
                                                                                 step >= maxSteps`

T2     Delegation         Task tool creates child session      Isolated per       Child sessions get todowrite/
                          with isolated permissions.           child session.     todoread denied + task denied
                          Prompt param carries lineage         No context leak    unless explicit permission
                          context + artifact type.             between children.  (task.ts L66-102). parentID
                                                                                 linkage (session L119-161).

T3     Post-Compaction    Compaction hook re-injects SOT.      Rebuilt from       experimental.session.compacting
                          New session starts with agent         scratch via        hook (plugin/index.ts L1687-
                          body re-loaded. Compaction            hook + agent       1690). Compaction template:
                          summary carries structured            definition.       Goal/Instructions/Discoveries/
                          handoff.                                                Accomplished/Files
                                                                                 (compaction.ts L151-178).
```

**Durability ranking** (most → least durable, with platform evidence):

| Rank | Mechanism | Where It Lives | Can Model Ignore? | Survives Compaction? | Evidence |
|------|-----------|----------------|-------------------|---------------------|----------|
| 1 | **Permissions** | Machine-enforced ruleset, evaluated by engine before model sees tool call | NO — engine blocks/asks/allows before model acts | YES — per agent definition, re-evaluated every tool call | `PermissionNext.evaluate()` uses `findLast()` (next.ts L236-243). Merge: defaults → agent → user (agent.ts L56-75) |
| 2 | **Steps budget** | Machine-enforced counter in session loop | NO — forces text-only response after N iterations, model cannot override | YES — per agent definition, re-read on session start | `agent.steps ?? Infinity` → `isLastStep = step >= maxSteps` (prompt.ts L556-560). Schema: `steps: z.number().int().positive().optional()` (agent.ts L44-45) |
| 3 | **Agent body** | System prompt (re-sent to LLM every turn as part of agent prompt) | Theoretically yes, but system prompt has highest attention weight | YES — re-loaded from `.md` file on new session | `Agent.Info.prompt` field becomes system prompt content. Persists across all turns within a session |
| 4 | **AGENTS.md** | System prompt (auto-discovered by walking directory tree, re-sent every turn) | Theoretically yes, but high attention as system context | YES — re-read from disk on new session | `instruction.ts L14-43`: discovers AGENTS.md/CLAUDE.md by walking up from cwd. `instruction.ts L168-191`: sub-directory instructions auto-inject on file reads |
| 5 | **Skill output** | Message history (prune-protected from token-based pruning) | YES — attention decays over long conversations as newer messages dominate | PARTIALLY — prune-protected within session, but NOT re-injected after compaction (must re-load) | `PRUNE_PROTECTED_TOOLS = ["skill"]` (compaction.ts L50-57). Prune pass protects last 40K tokens, skill outputs exempt from pruning |
| 6 | **Skill references** | Loaded on-demand into message history via file reads within skill | YES — attention decays rapidly, ephemeral | NO — not persisted, not prune-protected | Loaded via `Read` tool from `references/` directory. Just regular tool output |

**Design rule derived from this hierarchy**:

| What must be enforced | → Goes in Rank | Mechanism |
|----------------------|----------------|-----------|
| Path restrictions (`.opencode/` only) | 1 | Permissions: `edit: { "*": "deny", ".opencode/**": "allow" }` |
| Iteration limits (drift prevention) | 2 | Steps: `steps: 25` in agent frontmatter |
| Team routing logic (who to delegate to) | 3 | Agent body: team roster table in system prompt |
| Role identity (meta-builder, not implementor) | 3 | Agent body: role section in system prompt |
| Delegation contracts (packet schema) | 3 | Agent body: delegation section in system prompt |
| Scope boundaries (reinforcement) | 3+4 | Agent body + AGENTS.md (belt and suspenders) |
| Domain expertise (OpenCode patterns) | 5 | T0 skill (prune-protected, loaded once at session start) |
| Detailed references (checklists, templates) | 6 | Skill references/ (on-demand when needed) |

### 2.2 Problem 2: Agent Profile Design — The Layer Schema

**The problem**: Currently 3 copies of hivefiver exist with discrepancies (181-line vs 543-line copies, conflicting `recursive_delegation` settings). No clear schema for what content goes in which layer of the agent definition.

**The solution**: A definitive layer schema, grounded in how OpenCode actually processes each layer:

| Layer | What Goes Here | Why | Durability | Machine-Parsed? | Platform Evidence |
|-------|---------------|-----|------------|----------------|-------------------|
| **`opencode.json` agent config** | Permission overrides, model selection | Machine-enforced at runtime by engine. Last-wins merge with agent `.md` permissions | Permanent (config file) | YES — `PermissionNext.fromConfig()` → merged via `PermissionNext.merge(defaults, agent, user)` | agent.ts L56-75 |
| **Agent `.md` frontmatter** | `description`, `mode`, `model`, `temperature`, `steps`, `permission`, `hidden` | Parsed by `ConfigMarkdown.parse()` → fed into `Agent.Info` struct. Engine uses these fields for routing, display, model selection, iteration limits | Permanent (file) | YES — Zod schema validates. `steps: z.number().int().positive()` (agent.ts L44-45) | skill.ts L1753-1765: `Info.pick({ name, description }).safeParse(md.data)` |
| **Agent `.md` frontmatter (decorative)** | `identity`, `scope`, `delegation_policy`, `lineage` | Engine ignores unknown frontmatter fields (they pass through `safeParse` without error). LLM reads them as part of the frontmatter YAML block that opens the file | Permanent but NOT enforced | NO — only LLM reads | ConfigMarkdown.parse() extracts `.data` (frontmatter) and `.content` (body) separately |
| **Agent `.md` body** | Role definition, team roster (7 subagents with capabilities + constraints + trigger conditions + packet schema + return contracts), delegation boundaries, mid-session rules, lineage awareness | Becomes `Agent.Info.prompt` → injected into system prompt on EVERY LLM turn. This is the most critical content for mid-session governance because system prompt has highest attention weight | Durable (system prompt, re-sent every turn within session, re-loaded from disk on new session) | NO — LLM reads | Agent body = `md.content` after frontmatter extraction. Set as prompt field on Agent.Info |
| **T0 skill** | Domain expertise (OpenCode advanced patterns), decision frameworks, progressive disclosure map, context guardrails, anti-pattern registry | Injected as `<skill_content name="...">` XML block on first load. Prune-protected from token-based pruning. But: attention DECAYS over long sessions as newer messages push it out of the model's focus window | Semi-durable (prune-protected within session, NOT re-injected after compaction) | NO — LLM reads | `PRUNE_PROTECTED_TOOLS = ["skill"]` (compaction.ts L50-57). Skill output format: `<skill_content name="...">` (skill.ts L99-120) |
| **Skill `references/`** | Detailed domain knowledge: templates, checklists, validation rubrics, example configurations | Loaded on-demand via file reads. Only brought into context when explicitly needed. Keeps T0 skill lean while providing depth when required | Ephemeral (regular tool output, subject to pruning after 40K token window) | NO — LLM reads | Referenced from skill's `<skill_files>` listing. Agent reads via `Read` tool when needed |

**The canonical agent file structure**:
```
.opencode/agents/<agent-name>.md
├── YAML frontmatter ─────────────────── machine-parsed by engine
│   ├── description: "1-2 sentence capability summary"
│   ├── mode: primary | subagent
│   ├── model: provider/model-id  (optional)
│   ├── temperature: 0.0-1.0      (optional)
│   ├── steps: N                   (drift prevention budget)
│   ├── permission:                (overrides, merged last-wins)
│   │   ├── edit: { "*": "deny", ".opencode/**": "allow" }
│   │   ├── task: { "*": "allow" }
│   │   └── read: { "*": "allow" }
│   ├── hidden: false
│   ├── # ─── decorative (engine ignores, LLM reads) ───
│   ├── identity: "meta-builder orchestrator"
│   ├── lineage: hivefiver | hiveminder | shared
│   └── scope: ".opencode/**, .hivemind/**, docs/**" [DEFERRED:Phase7+]
│
└── Body ─────────────────────────────── LLM reads, becomes system prompt
    ├── ## Role & Identity
    │   └── Who you are, what you do, what you DON'T do
    ├── ## Team Roster
    │   └── 7-row table: agent | capabilities | constraints | triggers
    ├── ## Delegation Contracts
    │   ├── Packet schema: lineage, artifact_type, task, scope, return
    │   └── Return contract: what each subagent must return
    ├── ## Scope Boundaries
    │   └── Reinforces permission rules in natural language
    ├── ## Mid-Session Rules
    │   └── What to do when you notice drift, how to self-correct
    └── ## Lineage Awareness
        └── hivefiver context vs hiveminder context
```

### 2.3 Problem 3: Team Awareness — The Delegation Constitution

**The problem**: hivefiver currently does NOT know its team well enough to delegate correctly. Team routing knowledge is scattered across skills that lose the model's attention mid-session. When hivefiver forgets who its subagents are or what they do, it either delegates incorrectly or tries to do everything itself.

**The solution**: Team roster goes in the **AGENT BODY** (system prompt, Rank 3 durable — re-sent every turn), NOT in a skill. The agent body is the RIGHT place because:

1. **System prompt has highest attention weight** — models are trained to follow system instructions
2. **Re-sent every turn** — never lost within a session, even in long conversations
3. **Re-loaded on new session** — survives compaction boundaries
4. **Skills lose attention** — skill output is in message history, which the model progressively ignores as conversation grows

**Team roster format (goes in agent body)**:

```markdown
## Team Roster

| Agent | Capabilities | Constraints | When to Delegate |
|-------|-------------|-------------|-----------------|
| hivexplorer | Codebase search, file pattern matching, structure mapping, dependency tracing | READ-ONLY. No file modifications. Terminal agent (cannot re-delegate). Returns absolute paths + synthesized findings | "Find all X", "Map the structure of Y", "What files touch Z", "Trace dependencies of W" |
| hiveplanner | Phase planning, research synthesis, dependency mapping, execution knot design | No src/** edits. Plans go to docs/plans/ only. Cannot implement — only designs the roadmap | "Plan the approach for X", "Design the execution path for Y", "What order should we do Z" |
| hiverd | External research, ecosystem analysis, technology evaluation, best-practice synthesis | External knowledge only. No internal code edits. Terminal agent. Uses MCP servers (Tavily, Context7, DeepWiki) | "Research X technology", "What are best practices for Y", "Compare A vs B approaches" |
| hivemaker | Implementation, code creation, file modifications, configuration changes | src/**, tests/**, docs/** only for hiveminder lineage. .opencode/** for hivefiver lineage. NO framework assets in wrong lineage | "Build X", "Implement the plan for Y", "Create the configuration for Z" |
| hivehealer | Debugging, hardening, remediation, refactoring, regression fixing | Same path constraints as hivemaker. Focuses on fixing, not creating | "Fix X", "Debug Y", "Harden Z", "Why is W breaking" |
| hiveq | Quality gates, PASS/FAIL verdicts, artifact-type-specific validation | Read-only on code. Produces verification reports only. Validates by artifact type, not generically | "Validate this phase-plan", "Run quality gate on this agent profile", "Check this skill against D1-D8" |
| hitea | AI-driven testing infrastructure, test orchestration, mutation testing | tests/** only. Creates and runs tests, does not implement features | "Test X", "Create test suite for Y", "Run mutation testing on Z" |

### Delegation Packet Schema

Every delegation MUST include these fields in the task tool prompt:

| Field | Type | Purpose |
|-------|------|---------|
| `lineage` | "hivefiver" \| "hiveminder" | Which orchestrator tree this task belongs to. Determines state paths, artifact locations, validation constitutions |
| `artifact_type` | "skill" \| "agent" \| "command" \| "plugin" \| "plan" \| "code" \| "test" \| "config" | What kind of artifact is being worked on. Determines which validation constitution hiveq applies |
| `task_description` | string (3-5 words) | Short label for the task tool's description parameter |
| `task_prompt` | string | Detailed instructions including context, requirements, and constraints |
| `scope_boundary` | string | Allowed paths for this specific task (e.g., ".opencode/skills/**") |
| `return_contract` | string | What the response MUST contain (e.g., "Return: file paths changed, validation results, blockers found") |

### Delegation Permissions (machine-enforced at T1)

- hivefiver can delegate to: all 7 subagents (task permission: allow for *)
- Subagent recursion: denied by default (task.ts L66-102: `hasTaskPermission` check)
- Child sessions: todowrite/todoread denied (task.ts L1410-1418)
- Each child session gets isolated message history (session.ts L119-161: parentID linkage)
```

**Why this MUST be in agent body, not skill**:

The team roster is CORE IDENTITY — it's the routing table that makes hivefiver an orchestrator rather than a solo agent. If this knowledge is in a skill, it works at T0 but fades by turn 15+. An orchestrator that forgets its team mid-session is fundamentally broken. By placing it in the agent body (system prompt, Rank 3), it's re-sent to the model on every single turn, maintaining routing accuracy throughout the session.

---

## 3. Phases (Each Phase = 1 Authorization Cycle)

### Phase 0: Architecture Ratification ✦ GO/NO-GO GATE

**Deliverable**: Approved architecture (Section 2 above: 4-tier control plane, layer schema, delegation constitution)  
**Agents**: hiveplanner (produces), user (ratifies)  
**Prerequisites**: This master plan exists and is read by user  
**Decision points**:
- APPROVE → proceed to Phase 1
- AMEND → hiveplanner revises specific solutions, re-submit
- REJECT → back to requirements gathering, different approach

**Known risks**: User may want different durability assignments or disagree with what goes in agent body vs skill  
**Restart required**: NO (design document only, no file changes)

---

### Phase 1: Landscape Triage & Noise Reduction

**Deliverable**: Cleaned landscape + archive manifest + emitter classification registry  
**Agents**: hivefiver → hivexplorer (read-only audit), hiveplanner (classification synthesis)  
**Prerequisites**: Phase 0 approved  
**Decision points**:
- IF skills count > 30 after triage → batch archive in groups of 10, user approves each batch
- IF any skill has active cross-references from agent bodies → flag for Phase 1.5 assessment, do NOT archive yet
- IF commands have script bodies > 3 lines or YAML workflow dependencies → defer to Phase 2 (directive emitter territory)
- IF agent discrepancies found → document in findings, resolve in Phase 3

**Sub-steps**:

**1a. Skills audit (49 in `.opencode/skills/`)**:
- Classify each skill: `KEEP` | `ARCHIVE` | `MERGE` | `DEPRECATED` | `NARROW_EXPERTISE`
- 2 already deprecated → immediate archive
- 1 stub (no SKILL.md) → immediate archive  
- 28 minimal single-file → quick triage: check description, check if any agent/command references it, check if content belongs in agent body per Problem 2 solution
- 17 rich with references → flag as `NARROW_EXPERTISE` for Phase 1.5 assessment
- Archive targets → move to `.opencode/.archive/skills/` with manifest

**1b. Agents audit (10 total)**:
- Document each agent's frontmatter fields: which are machine-parsed vs decorative
- 3 hivefiver copies → identify canonical, document discrepancies (recursive_delegation, line counts, mode)
- hitea: only in `.opencode/agents/` — document, no action yet
- hivemaker: mode differs between `.opencode/` (subagent) and root `agents/` (all) — document

**1c. Commands opportunistic triage (44 .opencode/ + 35 root)**:
- Agents NEVER auto-invoke commands (confirmed: no auto-invoke mechanism in platform)
- Commands with < 3 lines body + no script connections + no YAML dependencies → archive candidates
- Commands with `subtask: true` or agent bindings → flag for Phase 2 investigation
- Root commands (35) → leave untouched unless user says otherwise (different scope)

**1d. False emitter identification**:
- List ALL mechanisms that inject context automatically (plugins, hooks, AGENTS.md files, skill auto-load)
- Classify: `LEGITIMATE` | `FALSE_EMITTER` | `NEEDS_INVESTIGATION`
- Turn off false emitters by renaming/moving (NOT deleting — reversible)

**Known risks**:
- Archiving a skill referenced by an agent body → breaks delegation at next session
- Missing a false emitter that Phase 2 doesn't catch
- gx-context-engine skill has active directive-emitting scripts — needs careful handling

**Restart required**: YES — after archive operations, agent skill discovery changes. Must restart to verify archived skills no longer load.

---

### Phase 1.5: Narrow Expertise Skills Assessment

**Deliverable**: Skill retention/refactor decisions for the 17 rich skills  
**Agents**: hivexplorer (dependency mapping), hiveplanner (assessment against durability hierarchy), hiverd (external research on skill-judge D1-D8 rubric)  
**Prerequisites**: Phase 1 complete, archive manifest approved  
**Decision points**:
- IF a rich skill covers content that should be in agent body per Problem 2 → extract to agent body, archive skill remainder
- IF a rich skill covers genuine on-demand domain expertise → keep as T0 skill or on-demand reference
- IF two skills overlap in domain → merge into one with `references/` for depth
- IF a hivefiver-specific skill (14+ identified) has identity/routing content → extract to agent body

**Assessment rubric** (from skill-judge 8D/120pt):
- D1: Knowledge Delta — is this expert-only content the model doesn't already know?
- D4: Description quality — is the description THE MOST CRITICAL field well-written?
- D5: Progressive disclosure — proper content layering (metadata → body → references)?
- D6: Freedom calibration — constraint level matches task fragility?

**Output**: Skill retention matrix: `[skill_name, classification, action, rationale]`

**Known risks**: Some skills have implicit dependencies not discoverable by grep (e.g., referenced in YAML workflows)  
**Restart required**: YES — if skills are moved/merged, discovery cache must refresh

---

### Phase 2: Directive Emitter Forensics

**Deliverable**: **Directive Emitter Audit Plan** (required deliverable #2)  
**Agents**: hivexplorer (investigation), hiveplanner (classification + audit plan), hiveq (validate audit completeness)  
**Prerequisites**: Phase 1 and 1.5 complete (noise reduced, landscape clean enough to see real signal)  
**Decision points**:
- IF hiveops-governance plugin hooks are `LEGITIMATE` → document, keep, constrain with permissions if needed
- IF hiveops-governance plugin hooks are `FALSE_EMITTER` → neutralize (comment out or rename file, not delete)
- IF neutralizing a hook requires `src/` code changes → OUT OF SCOPE, document as return point R1/R2
- IF the 9 YAML workflows auto-trigger hooks → classify as emitter chains, include in audit

**Scope — The Plugin Forensics**:

```
hiveops-governance plugin (885 lines, 5 hooks)
├── hook 1: ???  → determine: what reads / what emits / when fires / overlap? / verdict
├── hook 2: ???  → determine: what reads / what emits / when fires / overlap? / verdict  
├── hook 3: ???  → determine: what reads / what emits / when fires / overlap? / verdict
├── hook 4: ???  → determine: what reads / what emits / when fires / overlap? / verdict
└── hook 5: ???  → determine: what reads / what emits / when fires / overlap? / verdict
```

**For EACH hook, the audit must determine** (this becomes the Directive Emitter Audit Plan deliverable):

| Question | Why It Matters |
|----------|---------------|
| What state files does it READ? | Identifies input dependencies — if those files are stale/corrupt, the hook emits poison |
| What context does it EMIT? | Identifies what gets injected into the LLM's context — is it helpful or misleading? |
| WHEN does it fire? | Every turn? Specific events? Specific agents? Determines blast radius |
| Does it OVERLAP with another injection? | Two hooks injecting contradictory context = hallucination driver |
| VERDICT | `KEEP` (legitimate guard) / `NEUTRALIZE` (false emitter) / `SANDBOX` (useful but needs constraints) / `REWRITE` (correct idea, wrong implementation) |

**Cross-reference with known dual-injection systems** (from AGENTS.md forensics):
- System 1: `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` — reads 6 state files, prepends to messages → THIS IS IN SCOPE
- System 2a: `src/hooks/session-lifecycle.ts` — reads 5 state files → OUT OF SCOPE for modification (return point R1)
- System 2b: `src/hooks/messages-transform.ts` — prepends anchors + appends checklist → OUT OF SCOPE (return point R2)

**The audit plan output must note**: "Systems 2a/2b are in `src/` which is OUT OF SCOPE for modification. They are documented for awareness. Full remediation requires a future phase outside `.opencode/` scope."

**Known risks**:
- Plugin hooks may have side effects only visible at runtime (logging, state writes)
- Neutralizing a hook may break a workflow that depends on injected context — must test after each neutralization
- The 9 YAML workflows may be triggering hooks we haven't mapped

**Restart required**: YES — after any plugin hook changes, the plugin must re-load

---

### Phase 3: hivefiver Entry Point Hardening

**Deliverable**: Canonical hivefiver agent definition (primary contribution to deliverable #1: **Healer Refactor Blueprint**)  
**Agents**: hiveplanner (design), hivemaker (implementation in `.opencode/`), hiveq (validate agent profile against layer schema)  
**Prerequisites**: Phase 2 complete (emitters classified, false ones neutralized, landscape clean)  
**Decision points**:
- IF `hivefiver-reserved.md` (543L) is cleanest → use as base, extract into canonical structure
- IF current custom-made copy has anti-pollution defenses → extract those defenses into canonical version's mid-session rules
- IF any T0 skill content should be in agent body per Problem 2 → move it during this phase
- IF `steps` budget value unclear → start with 25, document as tuning parameter for Phase 7

**Sub-steps**:

**3a. Resolve 3 copies → 1 canonical** `.opencode/agents/hivefiver.md`:
- Diff all 3 copies: identify best role definition, best team roster, best scope boundaries
- Apply the layer schema from Problem 2: machine-parsed frontmatter + body with required sections
- Archive the 2 non-canonical copies to `.opencode/.archive/agents/`

**3b. Write canonical frontmatter** (machine-parsed fields): `[DEFERRED:Phase7+]` for `.hivemind/**` entries
```yaml
description: "Meta-builder orchestrator: diagnoses, refactors, debugs, validates, and evolves framework assets"
mode: primary
temperature: 0.3
steps: 25
permission:
  edit:
    "*": deny
    ".opencode/**": allow
    ".hivemind/**": allow  # [DEFERRED:Phase7+]
    "docs/**": allow
  task:
    "*": allow
  read:
    "*": allow
# --- decorative (engine ignores, LLM reads) ---
identity: meta-builder
lineage: hivefiver
scope: ".opencode/**, .hivemind/**, docs/**" # [DEFERRED:Phase7+]
```

**3c. Write canonical body** (becomes system prompt):
- **Role & Identity**: Meta-builder orchestrator. Builds the tools that builders use. Does NOT implement product features directly — delegates to hivemaker/hivehealer for that.
- **Team Roster**: Full 7-agent table from Problem 3 solution
- **Delegation Contracts**: Packet schema + return contracts per agent
- **Scope Boundaries**: Natural language reinforcement of permission rules
- **Mid-Session Rules**: Self-correction protocol when drift is detected
- **Lineage Awareness**: "You are hivefiver (meta-builder). Your sister orchestrator hiveminder (project) shares your team but operates on different artifacts."

**3d. Create/refine T0 skill** (ONLY domain expertise, NOT identity/routing):
- OpenCode advanced patterns (from the 85K doc: session DAG, permission merge, compaction hooks, plan mode 5-phase, etc.)
- Anti-pattern registry (context poisoning patterns, zombie logic signals)
- Progressive disclosure map (when to load references, when to delegate research)
- The skill must follow "freedom at load makes only 1" — there is exactly ONE skill hivefiver loads at T0
- Skill name: `hivefiver-meta-expertise` (or similar — clearly domain expertise, not identity)

**3e. Configure `opencode.json`** permissions:
- Machine-enforce path restrictions (Rank 1 durability)
- Machine-enforce delegation topology (Rank 1)
- These override anything in the `.md` file if they conflict (last-wins merge: defaults → agent `.md` → opencode.json user config)

**Known risks**:
- "Freedom at load makes only 1" — if the T0 skill is too broad, it loads too much context and wastes tokens. If too narrow, it misses critical domain knowledge
- Steps budget 25 may be too low for complex orchestration tasks, or too high for simple ones
- Root `agents/hivefiver.md` (543L) may be loaded by `src/` hooks — archiving it might break System 2a/2b

**Restart required**: YES — agent definition changes require session restart to take effect

---

### Phase 4: Metrics & Governance Detox

**Deliverable**: **Metrics & Governance Detox Proposal** (required deliverable #3)  
**Agents**: hivexplorer (audit existing metrics in `.opencode/`; `.hivemind/` audit [DEFERRED:Phase7+]), hiveplanner (proposal design), hiverd (research: what do good governance metrics look like?)  
**Prerequisites**: Phase 3 complete (hivefiver canonical, entry point stable, identity clear)  
**Decision points**:
- IF existing metrics are ALL zombie logic → propose clean-slate replacement in `.opencode/`
- IF some metrics are genuinely useful → keep those, prune the rest, document criteria
- IF metrics schema lives in `src/` (e.g., `src/schemas/brain-state.ts`, `src/lib/detection.ts`) → document what SHOULD change but OUT OF SCOPE; propose `.opencode/`-only alternative

**Scope**:

1. **Audit existing counters and state fields**:
   - drift/health scores that contradict observable behavior
   - "evidence_pressure", "ignored", "acknowledged: false" style counters
   - GovernanceCounters (reduced to `{drift, compaction}` per Fix 1.5B — verify this is still true)
   - tool call counts that report "perfect" while outcomes degrade

2. **Propose replacement schema** (must pass these tests):
   - **Measurable**: concrete values with units, not fuzzy scores
   - **Falsifiable**: can prove the metric wrong with a counterexample
   - **Non-recursive**: metrics cannot trigger other metrics (no metric-driven governance loops)
   - **Operator-friendly**: a human reading the state file can understand and act
   - **NOT a hallucination amplifier**: metrics that the model reads and then confirms create self-fulfilling prophecies. The metric must be computed EXTERNALLY (by tools/hooks), not by the model's self-assessment

3. **Define metric lifecycle**:
   - How computed (which tool/hook/script produces the value)
   - When reset (session boundary? manual? time-based?)
   - What actions triggered (if any — prefer NO automatic actions from metrics)
   - Where stored (`.opencode/state/` — not `.hivemind/state/` [DEFERRED:Phase7+] which is in `src/` scope)

**Known risks**: Existing code in `src/` (state-mutation-queue, detection.ts, soft-governance.ts) depends on current metric schema. Changes there are out of scope — the proposal must be implementable in `.opencode/` only.  
**Restart required**: NO (proposal document only — no implementation in this phase)

**NOTE**: Phases 4 and 5 can run in PARALLEL after Phase 3 completes.

---

### Phase 5: Subagent Broadening

**Deliverable**: All 8 subagent profiles aligned to canonical layer schema (major contribution to deliverable #1: **Healer Refactor Blueprint**)  
**Agents**: hiveplanner (design), hivemaker (write agent `.md` files), hiveq (validate each profile against layer schema)  
**Prerequisites**: Phase 3 complete (hivefiver canonical serves as template for the schema)  
**Decision points**:
- IF a subagent serves both lineages → `lineage: shared` in decorative frontmatter, body includes lineage-aware routing section
- IF a subagent is lineage-specific → `lineage: hivefiver` or `lineage: hiveminder`
- IF permission profiles should differ between lineages → the delegation prompt narrows scope; opencode.json sets the UNION

**For each of the 8 subagents**:
1. Apply layer schema (Problem 2) → write canonical `.md` with machine-parsed frontmatter + body
2. Set steps budget appropriate to role (explore: 5-10, planner: 15-20, maker: 30-40, etc.)
3. Set permissions appropriate to role (explore: read-only, maker: edit allowed in scope, etc.)
4. Write body with role, capabilities, constraints, lineage routing
5. Verify no conflicting definitions between `.opencode/agents/` and root `agents/`
6. Archive old/duplicate copies

**Cross-lineage design**:
- All 7 subagents get `lineage: shared` in decorative frontmatter
- Their agent body includes a "Lineage Routing" section: "When delegated by hivefiver, operate on `.opencode/` artifacts. When delegated by hiveminder, operate on project artifacts. The delegation packet's `lineage` field determines your operational context."
- Permission overrides in opencode.json set the UNION of both lineages' allowed paths
- The Task tool's `prompt` parameter carries the specific scope boundary per delegation
- This works because child sessions get isolated permissions (task.ts L66-102) and the delegation prompt is the primary context the subagent operates in

**Planning taxonomy integration**:
- hiveplanner must understand: phase-plan → sub-plan → atomic-plan hierarchy
- hiveq must know: which validation constitution to apply based on `artifact_type` in delegation packet
- hitea must understand: incremental integration gatekeeping for atomic plans (test after each small change, don't batch)

**Known risks**: 
- hiveminder compatibility is speculative (out of scope for implementation now)
- Root `agents/` directory may have files loaded by `src/` hooks — moving them may break things
**Restart required**: YES — agent definition changes require restart

---

### Phase 6: Atomic Execution Plan & Blueprint Finalization

**Deliverable**: **Atomic Execution Plan** (required deliverable #4) + **Healer Refactor Blueprint** finalization (required deliverable #1)  
**Agents**: hiveplanner (sequencing), hiveq (validate the plan itself for completeness and reversibility)  
**Prerequisites**: Phases 1-5 complete (or 1-3 + 4 & 5 in parallel)  
**Decision points**:
- IF any phase left return points → incorporate as future-phase items in the blueprint
- IF `src/` changes are needed for full integration → document as Phase 7+ (out of current scope)
- IF phases revealed new design decisions → update Section 2 architecture accordingly

**Sub-steps**:

1. **Sequence all file changes** from Phases 1-5 into git-atomic steps:
   - Each step: intent, exact files touched, restart required (yes/no), validation method, rollback procedure
   - No overlapping triggers between steps (two steps cannot change the same file)
   - Each step is independently revertible with `git revert`

2. **Group into execution knots** (1-5 related changes per knot):
   - Knot 1: Archive operations (skills, commands)
   - Knot 2: Plugin hook neutralizations
   - Knot 3: Canonical hivefiver profile
   - Knot 4: T0 skill creation
   - Knot 5: opencode.json permission config
   - Knot 6: Subagent profiles (may be split into sub-knots)
   - Knot 7: Metrics proposal implementation (if approved)

3. **Define verification gate per knot**:
   - After Knot 1: restart → verify archived assets don't load → verify remaining assets still function
   - After Knot 2: restart → verify neutralized hooks don't inject → verify remaining hooks still fire
   - After Knot 3: restart → new session → hivefiver identity test (knows role, team, boundaries)
   - After Knot 4: restart → T0 skill loads → domain expertise available
   - After Knot 5: restart → permission enforcement test (try editing `src/` → should be denied)
   - After Knot 6: restart → delegation test (hivefiver → subagent → correct behavior)

4. **Finalize Healer Refactor Blueprint** by consolidating:
   - Architecture decisions (3 core problems — Section 2)
   - Agent profile schema (canonical template)
   - Directory/artifact partitioning rules (`.opencode/` vs `.hivemind/` [DEFERRED:Phase7+] vs `docs/`)
   - Tooling/plugins/hooks policy (what is allowed to inject context, when, how, under what constraints)
   - Delegation contracts (packet schema, return contracts, validation constitutions)
   - Cross-lineage compatibility rules

**Known risks**: Integration surprises from interactions between knots (e.g., archived skill was secretly needed by a remaining hook)  
**Restart required**: YES — final integration requires clean session for each knot verification

---

### Phase 7: End-to-End Validation

**Deliverable**: Validation report with PASS/FAIL per criterion  
**Agents**: hiveq (quality gates), hitea (test scenarios if applicable)  
**Prerequisites**: Phase 6 complete (all atomic steps executed and individually verified)  
**Decision points**:
- IF any criterion FAILS → route back to the owning phase with specific failure evidence
- IF all criteria PASS → sign off master plan as COMPLETE
- IF some criteria PASS but with caveats → document caveats as return points

**Validation criteria** (each is a discrete test):

| # | Test | What It Validates | How to Test | PASS Condition |
|---|------|-------------------|-------------|----------------|
| V1 | Identity at entry | Phase 3: agent body loads correctly | Start new hivefiver session, ask "what is your role?" | Response identifies meta-builder role, mentions team, mentions .opencode/ scope |
| V2 | Team awareness | Problem 3: team roster in system prompt | Ask hivefiver to delegate a task; observe subagent selection | Picks correct subagent for the task type; delegation packet includes lineage + artifact_type |
| V3 | Mid-session durability | Problem 1 T1: agent body persists | After 15+ turns of work, ask "what are your scope boundaries?" | Still knows .opencode/ scope, doesn't claim src/ access |
| V4 | Permission enforcement | Problem 1 T1: machine rules | Attempt to edit a file in src/ via hivefiver | Permission system blocks or asks — does NOT allow silently |
| V5 | Steps budget | Problem 1 T1: drift prevention | Set steps=5, run a complex task requiring many tool calls | After 5 iterations, agent produces text-only response (no more tool calls) |
| V6 | Compaction survival | Problem 1 T3: SOT injection | Force compaction (fill context), check next session | New session has Goal/Instructions structure; agent re-identifies as meta-builder |
| V7 | Delegation isolation | Problem 1 T2: child session isolation | hivefiver delegates to hivexplorer → check child session permissions | Child session has todowrite/todoread denied; isolated message history |
| V8 | No-poison test | Phase 2: emitter neutralization | Run full workflow → inspect injected context via debug logging | No contradictory directives from different injection systems |
| V9 | Cross-lineage routing | Problem 3 + Phase 5 | Simulate: same subagent receives delegation packets with different lineage fields | Subagent adjusts scope/behavior based on lineage field |
| V10 | Archive silence | Phase 1: archived assets | After archive, check: are archived skills still discoverable? | Archived skills do NOT appear in `/skills` list, do NOT auto-load |

**Known risks**: Some tests require manual observation (V3 mid-session attention is hard to automate). V6 requires filling the context window, which is time-consuming.  
**Restart required**: YES — clean session for each test to avoid cross-contamination

---

## 4. Planning Taxonomy

```
MASTER PLAN (this document)
│   Validation: User authorization at each phase boundary
│   Owner: hiveplanner
│   Scope: Full pivot strategy
│   Format: Conditional routing, decision points, risk registry
│
├── PHASE PLAN (created per phase when user authorizes)
│   │   Validation: Structural review by hiveq
│   │   │   Constitution: covers phase scope? has entry/exit criteria?
│   │   │   has task dependencies? has restart markers?
│   │   Owner: hiveplanner
│   │   Scope: One phase's complete breakdown
│   │   Format: Task list with dependencies, acceptance criteria per task
│   │
│   ├── SUB-PLAN (for complex multi-part tasks within a phase)
│   │   │   Validation: Technical review by hiveq
│   │   │   │   Constitution: contracts well-defined? schemas correct?
│   │   │   │   interfaces between tasks compatible?
│   │   │   Owner: hiveplanner + domain-specific agent
│   │   │   Scope: One component of a phase
│   │   │   Format: Detailed specification with schemas, examples, edge cases
│   │   │
│   │   └── ATOMIC PLAN (for each git-atomic step)
│   │       Validation: ★ INCREMENTAL INTEGRATION GATEKEEPING ★
│   │       │   Constitution: change is reversible? doesn't break existing?
│   │       │   validated immediately after apply? restart done if required?
│   │       │   no overlapping triggers with other atomic plans?
│   │       Owner: hivemaker (implementation) + hiveq (gate)
│   │       Scope: One reversible change (one git commit)
│   │       Format: Intent + files + restart? + validation + rollback
│   │
│   └── VALIDATION PLAN (for hiveq per deliverable)
│       Validation: Meta-validation (does the validation plan cover the artifact type's constitution?)
│       Owner: hiveq
│       Scope: One deliverable's quality gate
│       Format: Criteria list + evidence collection method + PASS/FAIL per criterion
```

**Why the taxonomy matters**: When hiveminder delegates `hiveplanner` → returns a `phase-plan` → hiveminder delegates `hiveq` for validation, hiveq MUST know it's validating a phase-plan, not an atomic-plan. The delegation packet's `artifact_type` field routes hiveq to the correct constitution:

| Artifact Type | hiveq Validation Constitution |
|---------------|------------------------------|
| `phase-plan` | Structural: covers scope, has entry/exit criteria, has dependencies, has restart markers, has risk registry |
| `sub-plan` | Technical: schemas defined, interfaces compatible, edge cases addressed, no contract gaps |
| `atomic-plan` | **Incremental Integration Gatekeeping**: reversible, no overlap, validated immediately, restart marked |
| `agent-profile` | Schema compliance: machine-parsed fields valid per Zod schema, body has all required sections (role, team, delegation, scope, mid-session) |
| `skill` | Anatomy: follows one of 5 structural patterns, D1-D8 scores acceptable, proper progressive disclosure |
| `command` | Template: placeholders correct (`$N`, `$ARGUMENTS`, `@file`, `@agent`), agent binding valid, subtask flag appropriate |
| `plugin-hook` | Safety: no contradictory injection, documented trigger conditions, no zombie logic, tested in isolation |

---

## 5. Cross-Lineage Compatibility

### The Two Lineages

```
hivefiver (meta-builder lineage)              hiveminder (project lineage)
├── Purpose: Build/heal the framework          ├── Purpose: Build user projects
├── Scope: .opencode/**, .hivemind/** [DEFERRED:Phase7+],         ├── Scope: src/**, tests/**, docs/**
│          docs/**                             │
├── Artifacts: agents, skills, commands,       ├── Artifacts: features, components,
│   plugins, workflows, config                 │   tests, APIs, UIs
├── State: .opencode/state/ (proposed)         ├── State: .hivemind/state/ [DEFERRED:Phase7+]
├── Plans: docs/plans/                         ├── Plans: .hivemind/plans/ [DEFERRED:Phase7+] (proposed)
├── Validation: framework contracts            ├── Validation: product requirements
└── Status: IN SCOPE NOW                      └── Status: OUT OF SCOPE (future)
```

### How Shared Subagents Work

All 7 subagents serve both lineages. The routing mechanism:

1. **Delegation packet carries `lineage` field** → subagent reads it from the task prompt
2. **Agent body has "Lineage Routing" section** → tells subagent how to interpret lineage field
3. **Permissions set the UNION** → opencode.json allows both `.opencode/**` and `src/**`; the delegation prompt narrows to the specific lineage's paths
4. **Child session isolation** → each delegation creates a fresh child session (task.ts L66-102), so context from one lineage doesn't leak into another's delegations
5. **Validation constitution differs** → hiveq applies framework-contract checks for hivefiver artifacts, product-requirement checks for hiveminder artifacts. Routed by `artifact_type` in delegation packet

### What Phase 5 Must Produce for Cross-Lineage

Each shared subagent profile must include:
- `lineage: shared` in decorative frontmatter
- "Lineage Routing" section in body: explains that `lineage` field in delegation prompt determines operational context
- Neutral permissions that allow both lineages' paths (narrowed per-delegation by the prompt)
- No hardcoded assumptions about which orchestrator is delegating

### Future Compatibility Guarantee

When hiveminder activates (future), no agent profile rewrites should be needed. The only additions:
- New permission overrides in opencode.json for hiveminder-specific constraints
- hiveminder's own agent `.md` profile (parallel to hivefiver's)
- Possibly hiveminder-specific T0 skill (project domain expertise vs framework domain expertise)

---

## 6. Key Questions (Blocking — Need User Input)

| # | Question | Blocks | Default If No Answer |
|---|----------|--------|---------------------|
| Q1 | Which of the 3 hivefiver copies is closest to canonical? (`hivefiver-reserved.md` 543L vs current custom vs `.opencode/agents/hivefiver.md` 181L) | Phase 3 | Use `hivefiver-reserved.md` as base (most complete at 543L) |
| Q2 | What model should hivefiver use? (affects frontmatter `model` field) | Phase 3 | Leave unspecified (inherit session default) |
| Q3 | Should archived skills/commands be git-deleted or moved to `.opencode/.archive/`? | Phase 1 | Move to `.opencode/.archive/` (reversible, non-destructive) |
| Q4 | Are the 9 YAML workflows in scope for Phase 2 emitter audit? | Phase 2 | YES — they may trigger plugin hooks or inject context |
| Q5 | What `steps` budget for hivefiver? Higher = more work before forced text-only. Lower = tighter drift prevention | Phase 3 | Start with 25, tune in Phase 7 based on V5 test results |
| Q6 | Should the `experimental.session.compacting` hook be implemented in Phase 3 (for SOT injection after compaction) or deferred to Phase 6? | Phase 3/6 | Defer to Phase 6 (need stable SOT artifacts first before injecting them into compaction) |
| Q7 | Root commands (35 in project root) — archive alongside `.opencode/` commands or leave untouched? | Phase 1 | Leave untouched (different module scope, may be needed by `src/` hooks) |
| Q8 | How should hiveq know which validation constitution to apply — should it be a skill, agent body content, or command template? | Phase 5 | Agent body — hiveq's body includes the constitution registry so it's available mid-session |

---

## 7. Assumptions

| # | Assumption | Risk If Wrong | Mitigation | Evidence Status |
|---|-----------|--------------|-----------|----------------|
| A1 | `steps` budget works as documented (forces text-only after N iterations) | Mid-session governance fails at T1 tier | Verify in Phase 7 test V5 | Source confirmed: `isLastStep = step >= maxSteps` (prompt.ts L556-560) |
| A2 | Agent body content is in system prompt, re-sent every LLM turn | Agent forgets identity mid-session | Verify by inspecting prompt construction | Source confirmed: Agent.Info.prompt → system prompt |
| A3 | Permission `findLast()` is truly last-match-wins | Permission layering breaks | Verified in source | Confirmed: next.ts L236-243 `merged.findLast(...)` |
| A4 | Skill output is prune-protected but NOT re-injected after compaction | Skills need re-loading post-compaction | Compaction hook can inject skill content as context | Confirmed: `PRUNE_PROTECTED_TOOLS = ["skill"]` only affects within-session pruning |
| A5 | Child sessions have isolated message histories | Delegation context doesn't leak between subagents | Verified in source | Confirmed: task.ts L66-102 creates new session with parentID, isolated messages |
| A6 | hiveops-governance plugin is the PRIMARY context poisoner in `.opencode/` | Other `.opencode/` sources of poisoning exist | Phase 2 audit catches other sources | Needs verification — assumption from AGENTS.md forensics |
| A7 | `.opencode/` changes don't require `src/` changes to take effect for `.opencode/`-scoped behavior | Some features depend on `src/` hooks (System 2a/2b) | Document as return points R1/R2 if discovered | Partially confirmed — AGENTS.md notes dual-injection dependency |
| A8 | Decorative frontmatter fields pass through without engine errors | Engine crashes on unknown YAML fields | Test with a dummy agent with unknown frontmatter | Likely safe — `Info.pick({ name, description }).safeParse()` only validates known fields |
| A9 | `steps` counter resets per session (not cumulative across compactions) | Steps budget becomes useless after compaction | Verify in source — should reset since it's per-session-loop | High confidence — `step` variable is local to session loop |

---

## 8. Return Points (Known Gaps to Revisit Later)

| # | Gap | When to Revisit | Why Deferred | Owner |
|---|-----|----------------|-------------|-------|
| R1 | `src/hooks/session-lifecycle.ts` (System 2a) — reads 5 state files, injects context every turn | After `.opencode/` scope pivot is complete and stable | In `src/**`, out of current `.opencode/`-only scope | hivehealer (future) |
| R2 | `src/hooks/messages-transform.ts` (System 2b) — prepends anchors + appends checklist every turn | After `.opencode/` scope pivot is complete | In `src/**`, out of current scope | hivehealer (future) |
| R3 | hiveminder activation and lineage-specific permission overrides in opencode.json | When project lineage work begins | hiveminder is out of scope for implementation now | hiveplanner (future) |
| R4 | `.hivemind/state/` [DEFERRED:Phase7+] cleanup (global singleton state, used by `src/` code) | After injection layer refactoring completes | Depends on `src/` changes (Node 1 Fix 3C-D) | hivehealer (future) |
| R5 | Custom tools directory (`.opencode/tool/` doesn't exist yet) | After Phase 6, if custom guardrail tools are needed | Not required for initial pivot — permission system provides sufficient guardrails | hivemaker (future) |
| R6 | Compaction hook implementation for SOT injection | Phase 6 or post-pivot | Requires stable SOT artifacts first; premature injection would poison compaction | hivemaker (Phase 6) |
| R7 | Remote skill distribution via `config.skills.urls` | Post-pivot optimization | Not needed for single-project, single-developer operation | hiverd (future) |
| R8 | 11 failing tests from schema contract changes (Fix 1.5A/1.5B) | After `.opencode/` pivot stabilizes | Tests are in `tests/**`, out of `.opencode/` scope | hitea (future) |
| R9 | Root `agents/` directory: may be read by `src/` hooks — archiving those files might break things | Phase 5 investigation will determine if root copies are needed | Need to trace if `src/` code reads from root `agents/` | hivexplorer (Phase 5) |

---

## 9. Use Case Traceability Matrix (8/8)

Every use case from the pivot directive is mapped to specific phases, deliverables, and validation criteria.

| # | Use Case | Phase(s) | Deliverable | Validation Criterion |
|---|----------|----------|-------------|---------------------|
| UC1 | At any entry point session, agent must know it is meta-builder with ready-to-dive-in OpenCode concepts | Phase 3 (Entry Hardening) | Healer Refactor Blueprint §agent-profile | Fresh session test: agent declares role + lineage + team within first response |
| UC2 | Two lineages: hivefiver (meta-builder) vs hiveminder (project) as front-facing orchestrators | Phase 3 + Phase 5 | Blueprint §cross-lineage | Lineage field in agent frontmatter (decorative) + delegation packet carries lineage |
| UC3 | Shared subagents between lineages with different state paths and locations | Phase 5 (Delegation Contracts) | Blueprint §cross-lineage | Same agent profile works when delegated by either hivefiver or hiveminder |
| UC4 | Workflows require handoff monitoring and different validation channels | Phase 5 + Phase 6 | Atomic Execution Plan §delegation-workflow | hiveq receives artifact-type in delegation packet, routes to correct validation |
| UC5 | Phase-planning for meta-builder differs from phase-planning for project | Phase 5 (Planning Taxonomy) | Blueprint §planning-taxonomy | hiveplanner skill/instructions distinguish meta-builder vs project planning templates |
| UC6 | After phase-plan validation, handoff to indicated folders; orchestrator delegates to hiveplanner then hiveq validates AS phase-plan (not atomic) | Phase 5 + Phase 6 | Atomic Execution Plan §validation-chain | End-to-end test: hivefiver → hiveplanner → hiveq with artifact_type="phase-plan" |
| UC7 | Atomic plans follow incremental integration gatekeeping constitution | Phase 5 (Planning Taxonomy) | Blueprint §planning-taxonomy | hiveq validates atomic-plan with incremental-integration criteria, rejects if phase-plan criteria used |
| UC8 | At no point or turn should precision of which agent does what following what-step be lost | Phase 3 (Team Awareness in Body) + Phase 5 | Blueprint §team-roster | Agent body contains full team roster with trigger conditions — survives mid-session attention decay |

---

## 10. Phase Dependency Graph

```
Phase 0: Architecture Ratification  ◄── YOU ARE HERE
    │
    ▼
Phase 1: Landscape Triage & Noise Reduction
    │   (skills audit, agents audit, commands triage, false emitter ID)
    │
    ▼
Phase 1.5: Narrow Expertise Skills Assessment
    │   (17 rich skills: keep/merge/extract-to-body decisions)
    │
    ▼
Phase 2: Directive Emitter Forensics
    │   (plugin hooks audit, YAML workflows, injection classification)
    │   → produces deliverable #2: Directive Emitter Audit Plan
    │
    ▼
Phase 3: hivefiver Entry Point Hardening
    │   (3 copies → 1 canonical, frontmatter + body, T0 skill, opencode.json)
    │   → contributes to deliverable #1: Healer Refactor Blueprint
    │
    ├──────────────────┐
    ▼                  ▼
Phase 4:          Phase 5:
Metrics Detox     Subagent Broadening
(proposal only)   (8 profiles to canonical schema)
    │   → #3       │   → contributes to #1
    │              │
    └──────┬───────┘
           ▼
Phase 6: Atomic Execution Plan & Blueprint Finalization
    │   → produces deliverable #4: Atomic Execution Plan
    │   → finalizes deliverable #1: Healer Refactor Blueprint
    │
    ▼
Phase 7: End-to-End Validation
    │   (10 validation criteria, PASS/FAIL per criterion)
    │
    ▼
COMPLETE  ─── or route back to failing phase with evidence
```

**Parallel opportunity**: Phases 4 and 5 have no dependency on each other and can run in parallel after Phase 3. Both feed independently into Phase 6.

**Deliverable map**:
- #1 Healer Refactor Blueprint ← Phase 3 (primary) + Phase 5 (subagents) + Phase 6 (consolidation)
- #2 Directive Emitter Audit Plan ← Phase 2
- #3 Metrics & Governance Detox Proposal ← Phase 4
- #4 Atomic Execution Plan ← Phase 6

---

*This is a living document. Phase authorization updates PROGRESS. Architecture amendments tracked in FINDINGS. Each phase produces its own phase-plan document when authorized.*
