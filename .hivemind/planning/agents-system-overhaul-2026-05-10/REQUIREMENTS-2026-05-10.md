---
type: requirements
created: 2026-05-10
status: draft
master: agents-system-overhaul-2026-05-10
source_documents:
  - SKELETON-2026-05-10.md
  - CONTEXT-2026-05-10.md
philosophy_ref: HIVEMIND-PHILOSOPHY-2026-04-10
issues_ref: PROJECT-ISSUES-2026-05-05
total_requirements: 10
traceability: bidirectional — each REQ maps to skeleton defect(s) and context finding(s)
---

# REQUIREMENTS — Agents System Overhaul

> Derived from master skeleton defect registry (Section G) and context synthesis (Section 3).
> All requirements are scoped to **shipped primitives only** (hm-*, hf-*, gate-*, stack-*).
> gsd-* agents are NOT in scope — they are developer tooling, not shipped.

---

## REQ-01: Agent YAML Frontmatter Must Use Valid OpenCode SDK Fields

| Field | Value |
|-------|-------|
| **ID** | REQ-01 |
| **Title** | Fix 7 broken `instructions:` fields, 3 minimal shells, 5 incomplete agents |
| **Priority** | P0 — CRITICAL |
| **Source** | Skeleton §G Defects #1–15; Context §3 Defect #1, #10 |

### Description

7 agents use `instructions:` (plural) in YAML frontmatter — the correct OpenCode SDK field is `instruction:` (singular). These agents' system prompts are silently ignored by OpenCode at runtime, making them **dead agents** (SILENT DEAD). 3 agents have minimal shells with near-empty bodies (MINIMAL SHELL). 5 agents are missing critical fields like `domain`, `delegation-status`, or `task` blocks (INCOMPLETE / PARTIALLY BROKEN).

### Affected Agents

| Subtype | Agents | Count |
|---------|--------|-------|
| `instructions:` (plural) → must become `instruction:` | hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-critic, hm-l2-prompt-analyzer, hm-l2-prompt-repackager, hm-l2-prompt-skimmer, hm-l2-risk-assessor | 7 |
| Minimal shell (missing core fields) | hm-l2-meta-synthesis, hm-l2-general, hm-l2-test-router | 3 |
| Incomplete (missing `domain` + delegation fields) | hm-l2-build, hm-l2-conductor, hm-l2-intent-loop, hm-l2-phase-guardian, hm-l2-spec-verifier | 5 |

### Acceptance Criteria

- [ ] All 7 `instructions:` agents renamed to `instruction:` — agent bodies load at runtime
- [ ] All 3 minimal shell agents have complete frontmatter: `description`, `temperature`, `permission`, `task allow`, `instruction`
- [ ] All 5 incomplete agents have all required fields populated
- [ ] No agent uses `instructions:` (plural) anywhere in `.opencode/agents/` or `.hivefiver-meta-builder/agents-lab/`
- [ ] Spot-check: load 3 previously-broken agents in OpenCode session and confirm body renders

---

## REQ-02: All hm-*/hf-* Agent Permissions Must Use `ask` (Not `deny`)

| Field | Value |
|-------|-------|
| **ID** | REQ-02 |
| **Title** | Replace all `deny` tool permissions with `ask` for 56 shipped agents |
| **Priority** | P0 — CRITICAL |
| **Source** | Skeleton §G "MEDIUM — deny vs ask permissions (56 agents)"; Context §3 Defect #2 |

### Description

All 56 shipped agents (45 hm-* + 11 hf-*) use `deny` for tool permissions. The user has explicitly requested changing ALL `deny` to `ask` for runtime granularity — agents should be able to request tool access with user approval rather than being hard-blocked. The `permission` object is the preferred OpenCode SDK mechanism (the `tools` field is deprecated).

### Permission Semantics

| Value | Behavior |
|-------|----------|
| `allow` | Execute without asking |
| `ask` | Prompt user: approve once / always / reject |
| `deny` | Block entirely — **MUST NOT be used for shipped agents** |

### Acceptance Criteria

- [ ] Zero `deny` values in any shipped agent's `permission` block
- [ ] All 56 agents use `ask` or `allow` for every tool in their permission block
- [ ] Tool authorization follows the 9-surface authority model from ARCHITECTURE.md
- [ ] No agent uses the deprecated `tools` field — all use `permission` object
- [ ] hf-l2-prompter retains `edit: allow` and `write: allow` (intentional write access)

---

## REQ-03: All Agents Must Have Correct `mode` Field

| Field | Value |
|-------|-------|
| **ID** | REQ-03 |
| **Title** | Reclassify 3 misclassified `primary` L2 agents to `subagent` |
| **Priority** | P0 — CRITICAL |
| **Source** | Skeleton §G "HIGH — Misclassified primary mode at L2"; Skeleton §K Question #1 |

### Description

Per hierarchy rules (Skeleton §A Level Rules), only L0 agents should have `mode: primary`. L1 and L2 agents must have `mode: subagent`. Three L2 agents are currently set to `primary`, which means they appear as user-selectable agents via Tab key — this breaks the hierarchical delegation model.

### Affected Agents

| Agent | Current | Required | Reason |
|-------|---------|----------|--------|
| hm-l2-build | `primary` | `subagent` | L2 cannot be front-facing |
| hm-l2-conductor | `primary` | `subagent` | L2 cannot be front-facing |
| hm-l2-test-router | `primary` | `subagent` | L2 cannot be front-facing |

### Acceptance Criteria

- [ ] All 3 agents have `mode: subagent` in YAML frontmatter
- [ ] Only hm-l0-orchestrator and hf-l0-orchestrator have `mode: primary`
- [ ] Tab key in OpenCode no longer surfaces these 3 agents as top-level options
- [ ] Delegation from L0/L1 to these agents still works (they receive via `task`, not Tab)

---

## REQ-04: All Agents Must Have `domain` Field Assigned

| Field | Value |
|-------|-------|
| **ID** | REQ-04 |
| **Title** | Assign `domain` to all 16 agents currently missing it |
| **Priority** | P1 — HIGH |
| **Source** | Skeleton §G "HIGH — Missing domains (16 agents)"; Skeleton §K Question #5 |

### Description

16 agents are missing the `domain` field. While `domain` is currently a passthrough field (not consumed by OpenCode runtime per Context §2), it serves as documentation for routing, skill selection, and the future workflow router (f-04a). All agents must have a `domain` value consistent with their specialist role and the domain classification in Skeleton §I.

### Domain Assignment Proposal

| Agent | Proposed Domain | Justification |
|-------|----------------|---------------|
| hm-l2-build | Build | Maps to Skeleton §I "Build" category |
| hm-l2-conductor | Phase Lifecycle | Maps to Skeleton §I "Phase Lifecycle" |
| hm-l2-context-mapper | Context & Memory | Maps to Skeleton §I "Context & Memory" |
| hm-l2-context-purifier | Context & Memory | Maps to Skeleton §I "Context & Memory" |
| hm-l2-critic | Quality & Audit | Maps to Skeleton §I "Quality & Audit" |
| hm-l2-general | Meta | Maps to Skeleton §I "Meta" |
| hm-l2-intent-loop | Phase Lifecycle | Maps to Skeleton §I "Phase Lifecycle" |
| hm-l2-meta-synthesis | Meta | Maps to Skeleton §I "Meta" |
| hm-l2-phase-guardian | Phase Lifecycle | Maps to Skeleton §I "Phase Lifecycle" |
| hm-l2-prompt-analyzer | Context & Memory | Maps to Skeleton §I "Context & Memory" |
| hm-l2-prompt-repackager | Context & Memory | Maps to Skeleton §I "Context & Memory" |
| hm-l2-prompt-skimmer | Context & Memory | Maps to Skeleton §I "Context & Memory" |
| hm-l2-risk-assessor | Risk | Maps to Skeleton §I "Risk" |
| hm-l2-spec-verifier | Quality & Audit | Maps to Skeleton §I "Quality & Audit" |
| hm-l2-test-router | Test | Maps to Skeleton §I "Test" |
| hm-l2-build (dup check) | Build | — |

### Acceptance Criteria

- [ ] All 16 agents have `domain` field in YAML frontmatter
- [ ] Domain values match Skeleton §I classification
- [ ] Domain values are consistent across agents in same workflow group
- [ ] No agent has empty or `(missing)` domain

---

## REQ-05: All Skills Must Have Accurate Layer Metadata

| Field | Value |
|-------|-------|
| **ID** | REQ-05 |
| **Title** | Fix 13 gate-* layer mismatches, 3 hf-* metadata errors, validate all skill triggers |
| **Priority** | P1 — HIGH |
| **Source** | Skeleton §C; Context §3 Defects #4, #7, #8, #9 |

### Description

Skills have layer/level metadata in their SKILL.md frontmatter that must match their naming convention and actual usage depth. Current state has 13 name-vs-metadata mismatches (gate-* skills named `l3` but metadata says `l2`), plus 3 hf-* skills with invalid layer values (`4`, non-numeric).

### Affected Skills

| Group | Count | Issue | Fix |
|-------|-------|-------|-----|
| gate-l3-* | 3 | Named `l3` but metadata `layer: l2` | Set `layer: l3` to match naming |
| hm-l3-* | 12 | Name vs metadata mismatch | Verify and align `layer` to `l3` |
| hf-l2-use-authoring-skills | 1 | `layer: 4` — no L4 standard exists | Set `layer: l2` |
| hf-l2-agents-md-sync | 1 | Non-numeric layer value | Set `layer: l2` |
| hf-l2-delegation-gates | 1 | Non-numeric layer value | Set `layer: l2` |
| stack-l3-* | 6 | Missing `layer`, `role`, `lineage` metadata | Add `layer: l3`, `role: reference`, `lineage: stack` |

### Acceptance Criteria

- [ ] All 3 gate-* skills have `layer: l3` matching their naming convention
- [ ] All hm-l3-* skills have `layer: l3` in metadata
- [ ] No skill has a non-standard layer value (no `4`, no non-numeric)
- [ ] All 6 stack-* skills have complete metadata: `layer`, `role`, `lineage`
- [ ] All skill `trigger` lists are current and match actual usage patterns

---

## REQ-06: Delegation Graph Must Be Bidirectional and Complete

| Field | Value |
|-------|-------|
| **ID** | REQ-06 |
| **Title** | Verify all delegation edges, ensure bidirectional traceability |
| **Priority** | P1 — HIGH |
| **Source** | Skeleton §F Delegation Graph; Context §4 "Hierarchical Superiority" gap |

### Description

The delegation graph in Skeleton §F documents who-can-call-whom, but the actual `task allow` fields in agent YAML must match. Currently 4 L2 agents have peer delegation edges (hm-l2-planner → architect/strategist, hm-l2-executor → reviewer, hm-l2-debugger → investigator, hm-l2-researcher → synthesizer) but 16 agents have missing fields that may include delegation targets.

### Verification Requirements

1. Every edge in Skeleton §F has a matching `task allow` in the source agent's YAML
2. Every `task allow` in any agent YAML has a matching entry in the delegation graph
3. Cross-lineage edges (hf → hm) are explicitly documented
4. No orphan edges exist (edge to non-existent agent)
5. No phantom edges exist (agent claims delegation target but target doesn't exist)

### Acceptance Criteria

- [ ] Bidirectional delegation graph produced: source → target AND target ← source
- [ ] All 15 broken agents (from REQ-01) have delegation fields populated after repair
- [ ] Cross-lineage rules from Skeleton §A validated against actual YAML
- [ ] No `task allow` references a non-existent agent name
- [ ] Graph validation script or checklist can reproduce verification

---

## REQ-07: Command Argument Schemas Must Be Validated Against Actual Usage

| Field | Value |
|-------|-------|
| **ID** | REQ-07 |
| **Title** | Verify $ARGUMENTS patterns in all 19 commands |
| **Priority** | P1 — HIGH |
| **Source** | Skeleton §D Command Inventory; Context §2 OpenCode SDK compliance |

### Description

19 commands exist in `.opencode/commands/`. Each command may use `$ARGUMENTS` or `$SELECTION` patterns that must match how the command body consumes them. Invalid argument patterns cause silent failures at invocation time.

### Verification Scope

| Check | Description |
|-------|-------------|
| Schema existence | Does each command declare expected arguments? |
| Pattern validity | Are `$ARGUMENTS`, `$SELECTION` patterns syntactically correct? |
| Consumption match | Does the command body reference the declared arguments? |
| Agent routing | Does `subtask: true/false` match the target agent's capabilities? |
| Target agent exists | Does the referenced agent exist in the fleet? |

### Acceptance Criteria

- [ ] All 19 commands have valid argument patterns
- [ ] Every `$ARGUMENTS` reference in a command body has a matching schema declaration
- [ ] Every command's `subtask` field is consistent with its target agent's `mode`
- [ ] All command → agent references resolve to existing agents
- [ ] No command references a gsd-* agent (not shipped)

---

## REQ-08: AGENTS.md Counts Must Match Reality

| Field | Value |
|-------|-------|
| **ID** | REQ-08 |
| **Title** | Sync AGENTS.md fleet counts with actual filesystem state |
| **Priority** | P2 — MEDIUM |
| **Source** | Context §3 Defect #7; AGENTS.md "89 agents in `.opencode/agents/`" claim |

### Description

AGENTS.md states "59 skills" but the actual count is 58 (Context §3 Defect #7). Agent and skill counts, naming conventions, and cross-references in AGENTS.md must match the post-overhaul reality. This is a documentation sync requirement — it must be the LAST phase to avoid repeated re-syncing.

### Known Discrepancies

| Metric | AGENTS.md Claim | Actual | Delta |
|--------|----------------|--------|-------|
| Agents | 89 | 89 (33 gsd + 45 hm + 11 hf) | 0 — correct |
| Skills | 59 | 58 | -1 |
| Commands | 18 | 19 (with gsd/dev-preferences) | +1 |
| hm-* agents | 45 | 45 | 0 |
| hf-* agents | 11 | 11 | 0 |

### Acceptance Criteria

- [ ] AGENTS.md skill count matches filesystem count post-overhaul
- [ ] AGENTS.md command count includes all 19 commands
- [ ] Agent listing matches actual fleet (no phantom or missing agents)
- [ ] Cross-references (e.g., "33 GSD specialist agents") match reality
- [ ] Date stamp updated in AGENTS.md to reflect overhaul completion

---

## REQ-09: Cross-Lineage Delegation Rules Must Be Documented and Enforced

| Field | Value |
|-------|-------|
| **ID** | REQ-09 |
| **Title** | Document and enforce hm↔hf delegation boundaries |
| **Priority** | P2 — MEDIUM |
| **Source** | Skeleton §A "Cross-Lineage Delegation Rules"; Skeleton §K Question #7 |

### Description

The delegation rules in Skeleton §A define strict boundaries:
- hm-* agents CANNOT delegate to hf-* agents (ever)
- hf-* agents CAN delegate to hm-* agents (at specific levels)
- hf-L2 CANNOT delegate agents at all (task: deny all)

These rules exist in documentation but are not enforced programmatically. After the overhaul, the delegation graph and agent YAML must be audited to confirm no rule violations exist.

### Rule Matrix

| From | → hm-* | → hf-* |
|------|---------|---------|
| hm-L0 | ✅ All hm | ❌ NONE |
| hm-L1 | ✅ hm-L2, hm-L3 | ❌ NONE |
| hm-L2 | ✅ hm-L2 peers, hm-L3 | ❌ NONE |
| hf-L0 | ✅ hm-L1, hm-L2 | ✅ hf-L1, hf-L2 |
| hf-L1 | ✅ hm-L2 | ✅ hf-L2 |
| hf-L2 | ❌ task deny all | ❌ task deny all |

### Acceptance Criteria

- [ ] Cross-lineage rules from Skeleton §A are present in AGENTS.md
- [ ] No hm-* agent has `task allow` referencing an hf-* agent
- [ ] hf-L0 and hf-L1 have explicit cross-lineage `task allow` entries
- [ ] All hf-L2 agents have `task allow: deny all` (no agent delegation)
- [ ] Audit checklist produced for future validation

---

## REQ-10: Tool Authorization Matrix Must Be Complete for All 9 Custom Tools

| Field | Value |
|-------|-------|
| **ID** | REQ-10 |
| **Title** | Complete permission mapping for all 9 harness tools across all 56 shipped agents |
| **Priority** | P2 — MEDIUM |
| **Source** | Skeleton §E Custom Tools; Context §5 Constraints |

### Description

9 custom tools are registered in `plugin.ts`. Each tool needs a documented permission decision for every agent level and lineage. Currently permissions are ad-hoc — some agents have explicit entries, most use blanket `deny`.

### Tool Permission Matrix Template

| Tool | hm-L0 | hm-L1 | hm-L2 (delegators) | hm-L2 (terminal) | hf-L0 | hf-L1 | hf-L2 |
|------|-------|-------|---------------------|-------------------|-------|-------|-------|
| delegate-task | allow | allow | ask | deny | allow | allow | deny |
| delegation-status | allow | allow | ask | deny | allow | allow | deny |
| run-background-command | allow | allow | ask | deny | allow | allow | deny |
| prompt-skim | allow | ask | ask | ask | allow | allow | ask |
| prompt-analyze | allow | ask | ask | ask | allow | allow | ask |
| session-patch | ask | ask | deny | deny | ask | ask | deny |
| session-journal-export | allow | allow | ask | deny | allow | allow | deny |
| configure-primitive | ask | deny | deny | deny | allow | allow | ask |
| validate-restart | ask | deny | deny | deny | allow | ask | deny |

> Note: The above is a PROPOSAL — final values must be validated against actual agent role requirements.

### Acceptance Criteria

- [ ] All 9 tools have a documented permission for every agent level/lineage combination
- [ ] Permission decisions are justified by agent role (delegator vs terminal vs orchestrator)
- [ ] Write-side tools (delegate-task, configure-primitive) have stricter permissions than read-side
- [ ] Matrix is included in AGENTS.md or a referenced document
- [ ] No tool has `deny` for any shipped agent — use `ask` per REQ-02

---

## Traceability Matrix

| REQ | Priority | Source Sections | Defect Count | Depends On |
|-----|----------|----------------|--------------|------------|
| REQ-01 | P0 | Skeleton §G #1–15, Context §3 #1 | 15 | None |
| REQ-02 | P0 | Skeleton §G "deny vs ask", Context §3 #2 | 56 | None |
| REQ-03 | P0 | Skeleton §G "Misclassified primary", §K #1 | 3 | None |
| REQ-04 | P1 | Skeleton §G "Missing domains", §K #5, §I | 16 | REQ-01 |
| REQ-05 | P1 | Skeleton §C, Context §3 #4,#8,#9 | 19 | None |
| REQ-06 | P1 | Skeleton §F, Context §4 | Graph | REQ-01, REQ-03 |
| REQ-07 | P1 | Skeleton §D | 19 | REQ-01 |
| REQ-08 | P2 | Context §3 #7 | 3+ | ALL prior |
| REQ-09 | P2 | Skeleton §A, §K #7 | Rules | REQ-06 |
| REQ-10 | P2 | Skeleton §E, Context §5 | 9×7 matrix | REQ-02 |

**Total defect coverage:** 15 broken + 56 permissions + 3 mode + 16 domain + 19 skill metadata + graph edges + 19 commands + 3 doc + cross-lineage rules + 63 tool-permission slots = comprehensive.
