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
total_requirements: 20
traceability: bidirectional — each REQ maps to skeleton defect(s) and context finding(s)
---

# REQUIREMENTS — Agents System Overhaul

> Derived from master skeleton defect registry (Section G) and context synthesis (Section 3).
> All requirements are scoped to **shipped primitives only** (hm-*, hf-*, gate-*, stack-*).
> gsd-* agents are NOT in scope — they are developer tooling, not shipped.
> **REQ-11 through REQ-15 added 2026-05-10** from RESEARCH-gate-stack-lifecycle and AUDIT-cross-lineage findings.
> **REQ-16 through REQ-20 added 2026-05-10** from MATRIX-delegation-loops, GAPS-missing-primitives, and LIFECYCLE-command-agent-skill findings.

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

## REQ-02: All hm-*/hf-* Agent Permissions Must Use `ask` (Not `ask`)

| Field | Value |
|-------|-------|
| **ID** | REQ-02 |
| **Title** | Replace all `ask` tool permissions with `ask` for 56 shipped agents |
| **Priority** | P0 — CRITICAL |
| **Source** | Skeleton §G "MEDIUM — ask vs ask permissions (56 agents)"; Context §3 Defect #2 |

### Description

All 56 shipped agents (45 hm-* + 11 hf-*) use `ask` for tool permissions. The user has explicitly requested changing ALL `ask` to `ask` for runtime granularity — agents should be able to request tool access with user approval rather than being hard-blocked. The `permission` object is the preferred OpenCode SDK mechanism (the `tools` field is deprecated).

### Permission Semantics

| Value | Behavior |
|-------|----------|
| `allow` | Execute without asking |
| `ask` | Prompt user: approve once / always / reject |
| `ask` | Block entirely — **MUST NOT be used for shipped agents** |

### Acceptance Criteria

- [ ] Zero `ask` values in any shipped agent's `permission` block
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
- hf-L2 CANNOT delegate agents at all (task: ask all)

These rules exist in documentation but are not enforced programmatically. After the overhaul, the delegation graph and agent YAML must be audited to confirm no rule violations exist.

### Rule Matrix

| From | → hm-* | → hf-* |
|------|---------|---------|
| hm-L0 | ✅ All hm | ❌ NONE |
| hm-L1 | ✅ hm-L2, hm-L3 | ❌ NONE |
| hm-L2 | ✅ hm-L2 peers, hm-L3 | ❌ NONE |
| hf-L0 | ✅ hm-L1, hm-L2 | ✅ hf-L1, hf-L2 |
| hf-L1 | ✅ hm-L2 | ✅ hf-L2 |
| hf-L2 | ❌ task ask all | ❌ task ask all |

### Acceptance Criteria

- [ ] Cross-lineage rules from Skeleton §A are present in AGENTS.md
- [ ] No hm-* agent has `task allow` referencing an hf-* agent
- [ ] hf-L0 and hf-L1 have explicit cross-lineage `task allow` entries
- [ ] All hf-L2 agents have `task allow: ask all` (no agent delegation)
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

9 custom tools are registered in `plugin.ts`. Each tool needs a documented permission decision for every agent level and lineage. Currently permissions are ad-hoc — some agents have explicit entries, most use blanket `ask`.

### Tool Permission Matrix Template

| Tool | hm-L0 | hm-L1 | hm-L2 (delegators) | hm-L2 (terminal) | hf-L0 | hf-L1 | hf-L2 |
|------|-------|-------|---------------------|-------------------|-------|-------|-------|
| delegate-task | allow | allow | ask | ask | allow | allow | ask |
| delegation-status | allow | allow | ask | ask | allow | allow | ask |
| run-background-command | allow | allow | ask | ask | allow | allow | ask |
| prompt-skim | allow | ask | ask | ask | allow | allow | ask |
| prompt-analyze | allow | ask | ask | ask | allow | allow | ask |
| session-patch | ask | ask | ask | ask | ask | ask | ask |
| session-journal-export | allow | allow | ask | ask | allow | allow | ask |
| configure-primitive | ask | ask | ask | ask | allow | allow | ask |
| validate-restart | ask | ask | ask | ask | allow | ask | ask |

> Note: The above is a PROPOSAL — final values must be validated against actual agent role requirements.

### Acceptance Criteria

- [ ] All 9 tools have a documented permission for every agent level/lineage combination
- [ ] Permission decisions are justified by agent role (delegator vs terminal vs orchestrator)
- [ ] Write-side tools (delegate-task, configure-primitive) have stricter permissions than read-side
- [ ] Matrix is included in AGENTS.md or a referenced document
- [ ] No tool has `ask` for any shipped agent — use `ask` per REQ-02

---

## REQ-11: gate-* and stack-* Skills Must Be Classified as Project-Internal

| Field | Value |
|-------|-------|
| **ID** | REQ-11 |
| **Title** | Reclassify gate-* (3) and stack-* (6) skills as project-internal, not shipped |
| **Priority** | P1 — HIGH |
| **Source** | RESEARCH-gate-stack-lifecycle §Q1, §Q2, §Q7; SYNTHESIS §AD-01, §AD-02 |

### Description

The planning documents currently count gate-* (3) and stack-* (6) skills as "shipped primitives" (totaling 58). This is incorrect:

- **gate-\*** skills are hand-authored quality gates specific to THIS Hivemind plugin project. They reference project-specific architecture (9-surface authority, CQRS boundaries, DelegationManager) that does not exist in user projects. The gate-l3-lifecycle-integration SKILL.md explicitly states "Not for end-user shipping."
- **stack-\*** skills are curated tech stack references for THIS project's dependencies (bun-pty, json-render, nextjs, opencode, vitest, zod). User projects have different dependencies and would need different stack-* skills.

Neither category is generated by the hf-* meta-builder pipeline. Neither is installed by bootstrap/init.

### Corrected Classification

| Category | Count | Shipped? | Evidence |
|----------|-------|----------|----------|
| hm-* skills | 35 | YES | Product runtime |
| hf-* skills | 13 | YES | Meta-builder |
| opencode-config-workflow | 1 | YES | Configuration utility |
| **Core Shipped Total** | **49** | | |
| gate-* skills | 3 | **NO** | RESEARCH §Q1: hand-authored, project-specific |
| stack-* skills | 6 | **NO** | RESEARCH §Q2: project-specific dependencies |

### Acceptance Criteria

- [ ] SKELETON §C reflects shipped count of 49 (not 58)
- [ ] gate-* section marked "PROJECT-INTERNAL (NOT Shipped)"
- [ ] stack-* section marked "PROJECT-SPECIFIC REFERENCE (NOT Shipped)"
- [ ] AGENTS.md reflects corrected shipped count after PH-08
- [ ] No planning document counts gate-* or stack-* as shipped primitives

---

## REQ-12: Verify hf-l0-orchestrator YAML Integrity

| Field | Value |
|-------|-------|
| **ID** | REQ-12 |
| **Title** | Verify hf-l0-orchestrator YAML frontmatter matches SKELETON specification |
| **Priority** | P2 — MEDIUM |
| **Source** | STATE-2026-05-10.md §1 (existence confirmed); SKELETON §B hf-* L0 row |

### Description

**CORRECTED 2026-05-10:** The hf-l0-orchestrator agent file was previously reported as MISSING. This was a false claim — the file exists at `.opencode/agents/hf-l0-orchestrator.md` (19,410 bytes, modified 2026-05-09 19:48). The RESEARCH glob that returned "no files found" was likely a path resolution error.

The requirement is now downgraded from P0 CRITICAL (blocking) to P2 MEDIUM (verification). The file exists and all 7 hf-* commands resolve correctly. This requirement now covers: verify the YAML frontmatter matches the SKELETON §B specification, and confirm no missing fields.

### Acceptance Criteria

- [ ] `.opencode/agents/hf-l0-orchestrator.md` YAML frontmatter validated against SKELETON §B hf-* L0 row
- [ ] `mode: primary` confirmed
- [ ] `domain: Orchestration` confirmed
- [ ] `temperature`, `permission`, `skills` fields present and valid
- [ ] Cross-lineage `task allow` entries match SKELETON §A rules

---

## REQ-13: hf-l2-meta-builder Name Collision Must Be Resolved

| Field | Value |
|-------|-------|
| **ID** | REQ-13 |
| **Title** | Disambiguate hf-l2-meta-builder — used for both agent AND skill |
| **Priority** | P0 — CRITICAL |
| **Source** | AUDIT-cross-lineage §A1, line 46-52; SYNTHESIS §AD-04 |

### Description

The name `hf-l2-meta-builder` is used for BOTH an agent file (`.opencode/agents/hf-l2-meta-builder.md`) AND a skill file (`.opencode/skills/hf-l2-meta-builder/SKILL.md`). This creates namespace ambiguity — when `hf-l2-meta-builder` is referenced, it is unclear whether the agent or skill is intended.

Per SKELETON naming taxonomy, agent names and skill names should have disjoint namespaces.

### Resolution Options

| Option | Change | Impact |
|--------|--------|--------|
| A. Rename skill | `hf-l2-meta-builder` → `hf-l2-meta-builder-core` or `hf-l2-meta-builder-workflow` | Lower impact — no agent references to update |
| B. Rename agent | `hf-l2-meta-builder` → `hf-l2-meta-architect` | Higher impact — consumed-by references in 5+ skills must update |

**Recommendation:** Option A (rename skill). The agent name is referenced by commands and routing tables; the skill name is loaded by agent `skills` arrays.

### Acceptance Criteria

- [ ] No agent and skill share the same name in the shipped primitive set
- [ ] All agent `skills` arrays referencing the renamed skill are updated
- [ ] All `consumed-by` entries referencing the renamed skill are updated
- [ ] grep confirms zero agent-skill name collisions across `.opencode/`

---

## REQ-14: Dead `consumed-by` Entries Must Be Cleaned

| Field | Value |
|-------|-------|
| **ID** | REQ-14 |
| **Title** | Remove or update 25 stale `consumed-by` references in skills |
| **Priority** | P1 — HIGH |
| **Source** | AUDIT-cross-lineage §D3, line 256-285 |

### Description

25 `consumed-by` entries in skill SKILL.md frontmatter reference agents that do not exist in `.opencode/agents/`. These are stale references from renamed or removed agents.

### Cluster Analysis

| Skill | Dead References | Pattern |
|-------|----------------|---------|
| hf-l2-naming-syndicate | hf-meta-builder, hivefiver-skill-author, hivefiver-agent-builder, hivefiver-command-builder, hivefiver-orchestrator (5) | Old hivefiver-* prefix renamed to hf-* |
| hm-l2-gate-orchestrator | hm-production-readiness, hm-requirements-analysis, hm-roadmap-maintainability, hm-lineage-router (4) | Missing `l2` level in reference |
| hm-l2-lineage-router | hm-coordinating-loop, hm-phase-execution, hm-phase-loop, hm-subagent-delegation-patterns (4) | Missing `l2`/`l3` level in reference |
| hm-l2-production-readiness | gate-evidence-truth, hm-gate-orchestrator (2) | Missing `l3` level in reference |
| hm-l2-skill-router | hm-l2-coordinating-loop, hm-l2-phase-execution, hm-l2-subagent-delegation-patterns (3) | Incorrect skill name (should be agent name) |
| hm-l3-integration-contracts | hm-l2-skill-router, hf-l2-skill-router (2) | Skills referencing skills, not agents |
| hm-l3-tech-stack-ingest | hm-detective, hm-deep-research, hm-synthesis, hm-research-chain (4) | Missing `l3` level in reference |

### Acceptance Criteria

- [ ] All 25 dead `consumed-by` entries updated to reference existing agent names
- [ ] Zero `consumed-by` entries reference agents not in `.opencode/agents/`
- [ ] Cluster pattern documented: old hivefiver-* → hf-*, missing level prefixes → add l2/l3

---

## REQ-15: Skills with Contradicting `layer` Values Must Be Corrected

| Field | Value |
|-------|-------|
| **ID** | REQ-15 |
| **Title** | Align `layer` metadata with name prefixes for 19 mismatched skills |
| **Priority** | P1 — HIGH |
| **Source** | AUDIT-cross-lineage §B4, line 130-153 |

### Description

19 skills have a `layer` value in SKILL.md frontmatter that contradicts their name prefix. This creates confusion about the skill's position in the hierarchy and may cause routing errors.

### Affected Skills

| Group | Count | Name Prefix | Current `layer` | Required Fix |
|-------|-------|-------------|-----------------|--------------|
| gate-l3-* | 3 | l3 | 2 | Set `layer: 3` to match naming |
| hf-l2-* | 4 | l2 | 0, 3, 4 | Set `layer: 2` to match naming |
| hm-l2-* | 4 | l2 | 1, 3 | Set `layer: 2` to match naming |
| hm-l3-* | 8 | l3 | 1, 2 | Set `layer: 3` to match naming |

### Specific Skills

| Skill | Name Implies | `layer` Value | Fix To |
|-------|-------------|---------------|--------|
| gate-l3-evidence-truth | L3 | 2 | 3 |
| gate-l3-lifecycle-integration | L3 | 2 | 3 |
| gate-l3-spec-compliance | L3 | 2 | 3 |
| hf-l2-command-parser | L2 | 3 | 2 |
| hf-l2-meta-builder | L2 | 0 | 2 |
| hf-l2-skill-synthesis | L2 | 3 | 2 |
| hf-l2-use-authoring-skills | L2 | 4 | 2 |
| hm-l2-coordinating-loop | L2 | 3 | 2 |
| hm-l2-phase-execution | L2 | 1 | 2 |
| hm-l2-product-validation | L2 | 3 | 2 |
| hm-l2-user-intent-interactive-loop | L2 | 1 | 2 |
| hm-l3-deep-research | L3 | 2 | 3 |
| hm-l3-detective | L3 | 2 | 3 |
| hm-l3-opencode-project-audit | L3 | 1 | 3 |
| hm-l3-research-chain | L3 | 1 | 3 |
| hm-l3-subagent-delegation-patterns | L3 | 2 | 3 |
| hm-l3-synthesis | L3 | 2 | 3 |
| hm-l3-tech-context-compliance | L3 | 2 | 3 |
| hm-l3-tech-stack-ingest | L3 | 2 | 3 |

### Acceptance Criteria

- [ ] All 19 skills have `layer` values matching their name prefix
- [ ] grep confirms zero name-vs-layer mismatches in `.opencode/skills/*/SKILL.md`
- [ ] gate-* skills have `layer: 3`
- [ ] No skill has a non-standard `layer` value (no `0`, `1`, `4`)

---

## REQ-16: Zero-Skill Agent Remediation

| Field | Value |
|-------|-------|
| **ID** | REQ-16 |
| **Title** | Assign skills to 15 agents that currently have zero skills |
| **Priority** | P1 — HIGH |
| **Source** | GAPS-missing-primitives-2026-05-10.md; MATRIX-delegation-loops-2026-05-10.md |

### Description

15 shipped agents (27% of the fleet) have no `skills` array in their YAML frontmatter. This means they load zero skills at runtime and cannot leverage any specialist knowledge. Source: GAPS investigation found 15 agents with no skill assignments.

### Affected Agents

The 15 agents identified in GAPS as having zero skills. These overlap partially with agents from REQ-01 (broken frontmatter) and REQ-04 (missing domain).

### Acceptance Criteria

- [ ] All 56 shipped agents have at least 1 skill in their `skills` array
- [ ] Skill assignments are consistent with agent domain and role
- [ ] Zero agents have empty or missing `skills` arrays
- [ ] Cross-reference with integration-contracts skill validates agent→skill bindings

---

## REQ-17: Broken Command→Agent→Skill Chain Repair

| Field | Value |
|-------|-------|
| **ID** | REQ-17 |
| **Title** | Fix 5 commands with broken command→agent→skill chains |
| **Priority** | P1 — HIGH |
| **Source** | LIFECYCLE-command-agent-skill-2026-05-10.md |

### Description

5 commands reference agents that in turn reference skills that don't exist or are misconfigured. This breaks the full invocation chain: user types command → agent loads → skill loads → execution. Source: LIFECYCLE investigation traced all 19 command chains and found 5 with gaps.

### Acceptance Criteria

- [ ] All 19 commands have a complete chain: command→agent→skill with no gaps
- [ ] No command references an agent with a dead skill reference
- [ ] LIFECYCLE chain trace produces zero broken chains on re-run

---

## REQ-18: Missing Command Creation

| Field | Value |
|-------|-------|
| **ID** | REQ-18 |
| **Title** | Create or remove 6 referenced commands that don't exist on disk |
| **Priority** | P2 — MEDIUM |
| **Source** | LIFECYCLE-command-agent-skill-2026-05-10.md |

### Description

6 commands are referenced in skill routing tables or agent instructions but don't exist as `.opencode/commands/*.md` files. These are phantom references that will cause runtime errors if users attempt to invoke them. Source: LIFECYCLE investigation.

### Acceptance Criteria

- [ ] All command references in skill routing tables resolve to existing command files
- [ ] No phantom command references remain in agent instruction bodies
- [ ] Either command files are created or references are removed

---

## REQ-19: Delegation Loop Infrastructure

| Field | Value |
|-------|-------|
| **ID** | REQ-19 |
| **Title** | Wire completion-looping and coordinating-loop skills into the delegation chain |
| **Priority** | P1 — HIGH |
| **Source** | MATRIX-delegation-loops-2026-05-10.md; GAPS-missing-primitives-2026-05-10.md |

### Description

The MATRIX investigation found that no agents wire `hm-l2-completion-looping` or `hm-l2-coordinating-loop` into their delegation chains. These skills provide critical guardrail and loop-back capabilities. Without them, agents cannot detect incomplete work or coordinate multi-agent dispatch. The MATRIX showed 87.5% loop coverage (49/56 agents reachable from L0), indicating delegation gaps that loop infrastructure should close.

### Acceptance Criteria

- [ ] hm-l0-orchestrator and hm-l1-coordinator include completion-looping and coordinating-loop in skills
- [ ] Delegation loop coverage increases from 87.5% to ≥95%
- [ ] At least one feedback loop (completion detection) is wired end-to-end

---

## REQ-20: Delegation Reachability Gap Closure

| Field | Value |
|-------|-------|
| **ID** | REQ-20 |
| **Title** | Close 21 delegation gaps and 4 blocking agents (unreachable from L0) |
| **Priority** | P1 — HIGH |
| **Source** | MATRIX-delegation-loops-2026-05-10.md |

### Description

The MATRIX found 21 delegation gaps (agents listed in `task allow` that have no matching reverse edge) and 4 blocking agents (agents that are not reachable from hm-l0-orchestrator through any delegation path). These gaps mean some agents cannot receive work through normal delegation flows.

### Acceptance Criteria

- [ ] All 56 shipped agents are reachable from hm-l0-orchestrator through at least 1 delegation path
- [ ] Zero delegation gaps remain (every `task allow` has a matching reverse edge)
- [ ] MATRIX re-run produces 0 blocking agents and 0 gaps

---

## Traceability Matrix

| REQ | Priority | Source Sections | Defect Count | Depends On |
|-----|----------|----------------|--------------|------------|
| REQ-01 | P0 | Skeleton §G #1–15, Context §3 #1 | 15 | None |
| REQ-02 | P0 | Skeleton §G "ask vs ask", Context §3 #2 | 56 | None |
| REQ-03 | P0 | Skeleton §G "Misclassified primary", §K #1 | 3 | None |
| REQ-04 | P1 | Skeleton §G "Missing domains", §K #5, §I | 16 | REQ-01 |
| REQ-05 | P1 | Skeleton §C, Context §3 #4,#8,#9 | 19 | None |
| REQ-06 | P1 | Skeleton §F, Context §4 | Graph | REQ-01, REQ-03 |
| REQ-07 | P1 | Skeleton §D | 19 | REQ-01 |
| REQ-08 | P2 | Context §3 #7 | 3+ | ALL prior |
| REQ-09 | P2 | Skeleton §A, §K #7 | Rules | REQ-06 |
| REQ-10 | P2 | Skeleton §E, Context §5 | 9×7 matrix | REQ-02 |
| REQ-11 | P1 | RESEARCH §Q1-Q7, SYNTHESIS §AD-01/02 | 9 skills | None |
| REQ-12 | P2 | ~~RESEARCH §Q3~~ → STATE §1 | 1 agent file | None (CORRECTED — file exists) |
| REQ-13 | P0 | AUDIT §A1, SYNTHESIS §AD-04 | 1 collision | REQ-11 (naming decision) |
| REQ-14 | P1 | AUDIT §D3, line 256-285 | 25 dead refs | None |
| REQ-15 | P1 | AUDIT §B4, line 130-153 | 19 mismatches | None |
| REQ-16 | P1 | GAPS (15 zero-skill agents) | 15 agents | REQ-01, REQ-04 |
| REQ-17 | P1 | LIFECYCLE (5 broken chains) | 5 chains | REQ-05, REQ-07 |
| REQ-18 | P2 | LIFECYCLE (6 missing commands) | 6 commands | REQ-07 |
| REQ-19 | P1 | MATRIX (no loop infrastructure) | 2 skills | REQ-06, REQ-16 |
| REQ-20 | P1 | MATRIX (21 gaps, 4 blocking) | 25 delegation edges | REQ-06 |

**Total defect coverage:** 15 broken + 56 permissions + 3 mode + 16 domain + 19 skill metadata + graph edges + 19 commands + 3 doc + cross-lineage rules + 63 tool-permission slots + 9 reclassified skills + 1 missing agent + 1 name collision + 25 dead refs + 19 layer mismatches = comprehensive.
