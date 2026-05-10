# Workstream: Agent Synthesis — Hivemind Agent System

**Created:** 2026-04-27
**Updated:** 2026-04-29
**Status:** BOOTSTRAPPING (Cycle 2, Wave 3 — concrete phases defined)

## Scope

Design and implement a synthesized agent definition system for the Hivemind harness. Agents must support 2 lineages (hm-* for product dev, hf-* for meta builder), 3-level depth delegation, role-specific routing, and content-rich bodies that are superior to GSD agent definitions. GSD agents remain internal-only for building this project, NOT shipped.

**Key constraint:** Nothing is decided until research is complete within each phase.

## Locked Decisions

| ID | Decision |
|----|----------|
| D-AD-01 | GSD agents (33 in `.opencode/agents/`) are INTERNAL ONLY — not shipped |
| D-AD-02 | Shipped agents use hm-* and hf-* prefixes (matching skill lineages) |
| D-AD-03 | gsd-* agents deleted ONLY after AS-7 verification passes — transition safety |
| D-AD-04 | Agent body content uses XML tagged sections (from GSD best practice) |
| D-AD-05 | Agent YAML frontmatter must be granularly configurable by end users |
| D-AD-06 | Existing hivefiver-* agents are candidates for hf-* lineage |
| D-AD-07 | Existing core agents (coordinator, orchestrator, etc.) are candidates for hm-* lineage |

---

## Phase Status Table

| Phase | Name | Wave | Status | Depends On |
|-------|------|------|--------|-----------|
| AS-0 | Agent Inventory & Classification Audit | W1 | COMPLETE | None |
| AS-1 | Agent Architecture Synthesis | W1 | NOT STARTED | AS-0 |
| AS-2 | Lineage Classification & Schema Design | W2 | NOT STARTED | AS-1 |
| AS-3 | L0/L1 Orchestrator & Coordinator Creation | W3 | NOT STARTED | AS-2, skill-ecosystem SE-5 |
| AS-4 | L2 hm-* Specialist Agent Authoring (batch 1: 17) | W4 | NOT STARTED | AS-3 |
| AS-5 | L2 hm-* Specialist Agent Authoring (batch 2: 17) | W4 | NOT STARTED | AS-4 |
| AS-6 | L2 hf-* Meta Builder Agent Authoring | W4 | NOT STARTED | AS-3 |
| AS-7 | Capability Matrix Wiring & Integration Verification | W5 | NOT STARTED | AS-4, AS-5, AS-6, AS-9, AS-10, AS-11, skill-ecosystem SE-5.5 |
| AS-8 | Agent Body Enrichment (Superior to OMO + GSD) | W6 | NOT STARTED | AS-4, AS-5, AS-6 |
| AS-9 | Agent Tool Integration | W6 | NOT STARTED | AS-8, skill-ecosystem SE-12 |
| AS-10 | Agent Workflow Awareness | W6 | NOT STARTED | AS-8, skill-ecosystem SE-13 |
| AS-11 | Agent Naming Syndicate | W6 | NOT STARTED | AS-8, skill-ecosystem SE-11 |

## Dependency Flow

```
AS-0 (Inventory Audit)
 └── AS-1 (Architecture Synthesis)
      └── AS-2 (Classification & Schema)
           ├── AS-3 (L0/L1 Orchestrators) ─── blocked by SE-5 (gate-orchestrator + lineage-router)
           │    ├── AS-4 (hm-* batch 1: research+planning+implementation+quality)
           │    │    └── AS-5 (hm-* batch 2: domain+documentation+lifecycle+audit+intelligence)
           │    └── AS-6 (hf-* meta builders)
           │
            ├── AS-4, AS-5, AS-6 ──→ AS-8 (Body Enrichment) ─── blocked by SE-14 (skill-agent integration contracts)
           │    ├── AS-8 ──→ AS-9 (Tool Integration) ─── blocked by SE-12 (tool capability matrix)
           │    ├── AS-8 ──→ AS-10 (Workflow Awareness) ─── blocked by SE-13 (engine contracts)
           │    ├── AS-8 ──→ AS-11 (Naming Syndicate) ─── blocked by SE-11 (naming syndicate)
           │    │    ├── AS-9 ──→ AS-7 (wiring — tool half)
           │    │    ├── AS-10 ──→ AS-7 (wiring — workflow half)
           │    │    └── AS-11 ──→ AS-7 (wiring — final names)
           │    └── AS-7 (Capability Matrix & Verification) ─── blocked by SE-5.5 (gate hardening)
           │         └── requires: AS-8, AS-9, AS-10, AS-11 complete
           │
           └── Cross-workstream dependencies:
                ├── SE-11 (naming syndicate) feeds AS-11
                ├── SE-12 (tool capability matrix) feeds AS-9
                ├── SE-13 (Hivemind engine contracts) feeds AS-10
                └── SE-14 (quality baseline contracts) feeds AS-8
```

**Parallelization:** AS-4, AS-5, and AS-6 can partially overlap once AS-3 completes. AS-4 and AS-6 can run in parallel. AS-5 must follow AS-4 (batch dependency). W6 phases AS-8, AS-9, AS-10, and AS-11 all depend on AS-8 completing first, then run in parallel (AS-9, AS-10, AS-11).

---

## Known Issues (from 2026-04-29 audit)

| # | Issue | Severity | Affected Agent(s) |
|---|-------|----------|-------------------|
| KI-01 | `hf-meta-builder` name mismatch — agent file named `hf-meta-builder` but frontmatter/content references `hr-meta-builder` | HIGH | hf-meta-builder |
| KI-02 | `hf-prompter` has no `name:` field in YAML frontmatter (`hm-deep-research` appears in skill permissions/examples but is not the agent's identity) | MEDIUM | hf-prompter |
| KI-03 | `meta-synthesis-agent` missing `mode:` field in YAML frontmatter | MEDIUM | meta-synthesis-agent |
| KI-04 | `explore` agent referenced in AGENTS.md but missing from `.opencode/agents/` on disk — ghost reference | HIGH | explore (missing) |
| KI-05 | `test-router` agent present on disk but not documented in AGENTS.md inventory list | LOW | test-router |
| KI-06 | `orchestrator.md` is a 16-line stub — no execution flow, no body content | HIGH | orchestrator |
| KI-07 | `general.md` is a thin stub — minimal body content | MEDIUM | general |
| KI-08 | Agent count discrepancy: 58 on disk, 59 in AGENTS.md listing (includes ghost `explore`) | LOW | — |
| KI-09 | Zero hm-* prefixed agents exist — entire shipped agent system must be created from scratch | CRITICAL | — |

---

## Phase Details

### AS-0: Agent Inventory & Classification Audit ✅

**Wave:** W1 (research-only, no blockers)
**Status:** COMPLETE (2026-04-29)
**Artifact:** `AGENT-INVENTORY.md` (424 lines, 11 sections)
**Commits:** `af2d8b5e` (plan), `b354ae3a` (inventory)

Produced a complete inventory and classification matrix of all 59 agents (58 on disk + 1 ghost `explore`). Every agent quality-scored on frontmatter completeness, body depth, execution flow presence, and output contract clarity.

**Deliverables:**
- [x] `AGENT-INVENTORY.md` — full classification matrix (59 rows × 11 columns)
- [x] Body format catalog: XML (35), MD (20), Mixed (1), Flat (1), None (1)
- [x] Defect register (11 items: 4 resolved, 5 confirmed, 2 new)

**Key Findings:**
- 4 of 9 original defects RESOLVED (KI-02, KI-05, KI-06, KI-07)
- 1 revised: KI-01 (hf-meta-builder has no agent file — not a name mismatch)
- 2 new defects: KI-10 (13 agents missing name field), KI-11 (hf-meta-builder skill-only)
- Orchestrator and general expanded from stubs to full XML bodies
- GSD agents: all HIGH quality, 5 with explicit step tags, 28 prose-flow
- 11 recommendations for AS-1 through AS-11

**Acceptance Criteria:**
- [x] All 58 on-disk agents cataloged with frontmatter extraction
- [x] Each agent classified: gsd-* (33), hivefiver* (6), hf-* (1), core (18)
- [x] Quality score assigned per agent (HIGH/MEDIUM/LOW/NONE)
- [x] Body format cataloged: XML (35), MD (20), Mixed (1), Flat (1), None (1)
- [x] All 9 known defects confirmed or resolved (11 total)
- [x] Ghost agent `explore` documented as missing-from-disk

---

### AS-1: Agent Architecture Synthesis

**Wave:** W1 (follows AS-0 immediately)
**Status:** NOT STARTED

Compare GSD XML-tagged agent patterns against hivefiver markdown patterns and OMO architecture. Synthesize the best-of-both into a project-standard agent definition format. Resolve the body format tension (Decision D-AD-04: XML tagged sections are the standard, but some agents work well with markdown).

**Deliverables:**
- `AGENT-ARCHITECTURE-SYNTHESIS.md` — comparison matrix + synthesis recommendations
- Body format standard: XML tagged sections spec with markdown-allowed zones
- Frontmatter field mapping: what each lineage needs

**Acceptance Criteria:**
- [ ] GSD XML pattern documented with strengths/weaknesses
- [ ] Hivefiver markdown pattern documented with strengths/weaknesses
- [ ] OMO agent patterns (hook lifecycle, circuit breaker, category routing) reviewed
- [ ] Synthesis recommendation: adopt/adapt/reject/defer for each pattern
- [ ] Body format standard published (resolves D-AD-04)

---

### AS-2: Lineage Classification & Schema Design

**Wave:** W2 (follows AS-1)
**Status:** NOT STARTED

Design the 2-lineage taxonomy (hm-* and hf-*), YAML frontmatter schema extending schema-kernel, depth level definitions (L0/L1/L2), and permission model templates. This is the schema that all subsequent agent authoring phases will follow.

**Deliverables:**
- `AGENT-LINEAGE-SCHEMA.md` — lineage taxonomy + YAML frontmatter schema
- Depth level definitions: L0 (orchestrator), L1 (coordinator), L2 (specialist)
- Permission model templates per lineage and depth
- Domain classification: research, build, review, verify, debug, plan, execute, gatekeep

**Acceptance Criteria:**
- [ ] 2-lineage taxonomy defined with clear membership rules
- [ ] YAML frontmatter schema extending schema-kernel (Phase 16.5)
- [ ] Depth levels L0/L1/L2 defined with delegation rules
- [ ] Permission model templates: tool allow/ask, temperature, budget per depth
- [ ] Domain classification matrix: agent domain → authorized skills/tools

---

### AS-3: L0/L1 Orchestrator & Coordinator Creation

**Wave:** W3 (blocked by AS-2 and skill-ecosystem SE-5)
**Status:** NOT STARTED

Create the top-level orchestrator and coordinator agents for both lineages. These are the L0 and L1 agents that all L2 specialists delegate through. Must use XML body standard, correct permissions, and reference the lineage-router and gate-orchestrator from SE-5.

**Deliverables:**
- `hm-orchestrator.md` (L0) — front-facing orchestrator for hm-* lineage
- `hm-coordinator.md` (L1) — coordination layer for hm-* lineage
- `hf-orchestrator.md` (L0) — front-facing orchestrator for hf-* lineage
- `hm-phase-loop-manager.md` (L1) — iterative phase loop manager

**Acceptance Criteria:**
- [ ] 4 agent files created with full XML-tagged bodies
- [ ] YAML frontmatter includes: lineage, depth, domain, permissions, tools, skills
- [ ] Delegation rules reference lineage-router from SE-5
- [ ] Temperature, tool budget, and permission model match AS-2 schema
- [ ] Each agent has ≥100 LOC body with execution flows and output contracts

---

### AS-4: L2 hm-* Specialist Agent Authoring (batch 1: 17 agents)

**Wave:** W4 (depends on AS-3)
**Status:** NOT STARTED

Create the first batch of 17 hm-* specialist agents organized by domain cluster. These replace the 33 GSD agents with a refined set that follows the AS-2 schema and AS-3 patterns.

**Deliverables:**
Research cluster (5 agents):
- `hm-researcher.md`, `hm-detective.md`, `hm-deep-researcher.md`, `hm-synthesizer.md`, `hm-tech-stack-ingester.md`

Planning cluster (4 agents):
- `hm-planner.md`, `hm-spec-author.md`, `hm-requirements-analyst.md`, `hm-feature-ecosystem-designer.md`

Implementation cluster (3 agents):
- `hm-builder.md`, `hm-refactorer.md`, `hm-cross-cutting-changer.md`

Quality cluster (5 agents):
- `hm-code-reviewer.md`, `hm-code-fixer.md`, `hm-test-driver.md`, `hm-security-auditor.md`, `hm-production-readiness-checker.md`

**Acceptance Criteria:**
- [ ] 17 agent files created with full XML-tagged bodies
- [ ] Each agent follows AS-2 schema for frontmatter
- [ ] Each agent references correct hm-* skills via skill permissions
- [ ] Domain cluster membership is explicit in frontmatter
- [ ] No agent exceeds 400 LOC (body + frontmatter)

---

### AS-5: L2 hm-* Specialist Agent Authoring (batch 2: 17 agents)

**Wave:** W4 (depends on AS-4 — batch sequential)
**Status:** NOT STARTED

Create the second batch of 17 hm-* specialist agents. Includes domain, documentation, phase lifecycle, audit, intelligence, and debug clusters.

**Deliverables:**
Domain cluster (4 agents):
- `hm-domain-researcher.md`, `hm-product-validator.md`, `hm-roadmap-maintainer.md`, `hm-feature-ecosystem-designer.md` (if not in batch 1)

Documentation cluster (4 agents):
- `hm-doc-writer.md`, `hm-doc-verifier.md`, `hm-doc-classifier.md`, `hm-doc-synthesizer.md`

Phase lifecycle cluster (3 agents):
- `hm-phase-executor.md`, `hm-phase-loop-manager.md` (L1, may be in AS-3), `hm-planning-persister.md`

Audit cluster (4 agents):
- `hm-milestone-auditor.md`, `hm-eval-auditor.md`, `hm-nyquist-auditor.md`, `hm-ui-auditor.md`

Debug cluster (2 agents):
- `hm-debugger.md`, `hm-debug-session-manager.md`

**Acceptance Criteria:**
- [ ] 17 agent files created (or adjusted count based on batch 1 overlap)
- [ ] All hm-* agents from both batches (34 total) pass schema validation
- [ ] No duplicate agents between AS-4 and AS-5
- [ ] Each agent has XML-tagged body with execution flow
- [ ] Debug cluster integrates with session continuity system

---

### AS-6: L2 hf-* Meta Builder Agent Authoring

**Wave:** W4 (depends on AS-3, can run parallel with AS-4)
**Status:** NOT STARTED

Create 7 hf-* agents from existing hivefiver-* agent content. Apply the XML body standard from AS-1/AS-2. Migrate from hivefiver-* prefix to hf-* prefix.

**Deliverables:**
- `hf-orchestrator.md` (from `hivefiver.md` + `hivefiver-orchestrator.md`)
- `hf-agent-builder.md` (from `hivefiver-agent-builder.md`)
- `hf-command-builder.md` (from `hivefiver-command-builder.md`)
- `hf-skill-author.md` (from `hivefiver-skill-author.md`)
- `hf-tool-builder.md` (from `hivefiver-tool-builder.md`)
- `hf-agents-md-sync-agent.md` (new — extracted from hf-agents-md-sync skill)
- `hf-prompter.md` (upgrade existing, fix KI-02 missing name field)

**Acceptance Criteria:**
- [ ] 7 hf-* agent files created with full XML-tagged bodies
- [ ] Content migrated from hivefiver-* source agents (no content loss)
- [ ] All frontmatter fields present including `name:` (fixes KI-02)
- [ ] hf-prompter gets proper `name:` field
- [ ] hf-meta-builder/hf-meta-builder naming resolved (fixes KI-01)

---

### AS-7: Capability Matrix Wiring & Integration Verification

**Wave:** W5 (depends on AS-4, AS-5, AS-6, and skill-ecosystem SE-5.5)
**Status:** NOT STARTED

Wire all agent-to-skill mappings, agent-to-tool mappings, and depth delegation rules. Run the quality gate triad (lifecycle → spec → evidence) on all agents. Verify cross-references. Create AGENT-CAPABILITY-MATRIX.md. Delete gsd-* agents ONLY after verification passes (D-AD-03 transition safety).

**Deliverables:**
- `AGENT-CAPABILITY-MATRIX.md` — agent × capability × authorized skills matrix
- Quality gate triad report: lifecycle, spec compliance, evidence truth for all agents
- Migration verification: gsd-* → hm-* mapping confirmed
- `MIGRATION-COMPLETE.md` — sign-off document for gsd-* deletion

**Acceptance Criteria:**
- [ ] All 34 hm-* agents + 7 hf-* agents pass quality gate triad
- [ ] Agent-to-skill wiring verified (no broken references)
- [ ] Agent-to-tool permissions match AS-2 schema
- [ ] Depth delegation rules tested (L0→L1→L2 dispatch works)
- [ ] AGENT-CAPABILITY-MATRIX.md published
- [ ] gsd-* agents deleted (D-AD-03) — ONLY after all verifications pass
- [ ] Ghost agent `explore` resolved (created or reference removed from AGENTS.md)

---

### AS-8: Agent Body Enrichment (Superior to OMO + GSD)

**Wave:** W6 (depends on AS-4, AS-5, AS-6 — all agents created first)
**Status:** NOT STARTED

Elevate ALL hm-* and hf-* agent bodies beyond existing quality. Each agent body must include enriched XML sections beyond the standard 5-tag template.

**Deliverables:**

Enhanced XML sections per agent (10 total):
1. `<role>` — One-sentence purpose + boundary declaration
2. `<depth>` — Delegation authority and constraints
3. `<lineage>` — Skill binding scope and restrictions
4. `<task>` — Primary and secondary task definitions
5. `<scope>` — Explicit in/out boundaries
6. `<context>` — Prerequisites before starting
7. `<expected_output>` — Structured output contract
8. `<verification>` — Verifiable success criteria
9. `<behavioral_contract>` — What the agent WILL and WON'T do, with edge case handling
10. `<anti_patterns>` — Self-correction triggers and forbidden behaviors
11. `<delegation_boundary>` — L0→L1→L2 dispatch rules, known specialist mapping
12. `<skill_loading>` — Which skills to load for which task categories
13. `<session_continuity>` — How to persist/resume state across sessions

Quality baseline targets:
- Enriched bodies for all 41+ hm-* agents and all 7+ hf-* agents
- Quality equal or superior to `gsd-planner` (1248 lines, 22 steps) and `gsd-debugger` (1445 lines, 9 steps)
- Each agent body ≥ 200 LOC (body content only, excluding frontmatter)
- Behavioral contracts are machine-verifiable (deterministic rules)
- Anti-pattern detection is testable against known failure modes
- Delegation boundaries are explicit and unambiguous

**Acceptance Criteria:**
- [ ] All 48+ agents have all 10 XML sections present (AQUAL-02 extended to 10)
- [ ] Each behavioral contract has ≥ 5 explicit will/won't clauses
- [ ] Each anti-patterns section has ≥ 3 self-correction triggers
- [ ] Delegation boundaries match depth level (L2 declares zero delegation)
- [ ] Skill loading rules reference existing skill names
- [ ] Session continuity section references `.hivemind/state/` paths
- [ ] No agent body < 200 LOC (excluding frontmatter)

---

### AS-9: Agent Tool Integration

**Wave:** W6 (depends on AS-8, blocked by skill-ecosystem SE-12)
**Status:** NOT STARTED

Define formal tool capability per agent. Create `TOOL-CAPABILITY-MATRIX.md` and tool declarations in all agent `.md` files.

**Deliverables:**

`TOOL-CAPABILITY-MATRIX.md` with columns:
- Agent name, lineage, depth
- OpenCode native tools (read, write, edit, bash, glob, grep, task, skill, todowrite)
- Hivemind custom tools (delegate-task, delegation-status, run-background-command, prompt-skim, prompt-analyze, session-patch, session-journal-export, configure-primitive, validate-restart)
- MCP/external tools (tavily-*, brave-*, deepwiki-*, github-*, repomix-*)
- Permission model: `allow` array or `ask-all` + `allow-specific`

Tool permission rules:
1. No agent has blanket `"*"` allow — all permissions are explicit
2. Hivemind custom tools declared ONLY where the agent's role requires them
3. MCP tools declared ONLY where the task requires web/external access
4. L2 specialists have `write: []` (read-only) unless explicitly authorized
5. L0 orchestrators have `delegate-task` only (no other custom tools)
6. L1 coordinators have `delegate-task` + `delegation-status`

**Acceptance Criteria:**
- [ ] `TOOL-CAPABILITY-MATRIX.md` published with all 48+ agents
- [ ] Every agent `.md` file has explicit `tools:` array in YAML frontmatter
- [ ] No agent uses `tools: ["*"]` — all permissions are granular
- [ ] Hivemind custom tools declared where role-appropriate
- [ ] MCP tools match agent's domain (researcher=yes, code-reviewer=no)
- [ ] Tool permissions validated against AQUAL-05 granularity requirement

---

### AS-10: Agent Workflow Awareness

**Wave:** W6 (depends on AS-8, blocked by skill-ecosystem SE-13)
**Status:** NOT STARTED

Make ALL agents aware of the project's workflow infrastructure. Create `WORKFLOW-AWARENESS.md` reference and add `<workflow_awareness>` section to all agent bodies.

**Deliverables:**

`WORKFLOW-AWARENESS.md` covering:
1. `.planning/` structure: ROADMAP.md, STATE.md, workstreams, phases, dependency chains
2. Wave-based execution protocol (hm-phase-execution)
3. Checkpoint recovery flow (hm-phase-loop)
4. Completion loop semantics (hm-completion-looping)
5. 3-gate verification protocol (output, quality, scope)
6. Session continuity (.hivemind/state/ paths)

`<workflow_awareness>` XML section per agent:
- Which workflow artifacts the agent reads
- How the agent finds its dependencies
- How the agent self-verifies through the 3 gates
- How the agent reports completion

Permission model updates:
- All agents get `.planning/` read access (to read ROADMAP, STATE, deps)
- Coordinators (L1) get `.planning/` write access (to update STATE.md)
- Orchestrators (L0) get `.hivemind/` read access

**Acceptance Criteria:**
- [ ] `WORKFLOW-AWARENESS.md` published with all 6 awareness domains
- [ ] All 48+ agents have `<workflow_awareness>` XML section
- [ ] Agents can navigate project structure by reading ROADMAP/STATE
- [ ] Dependency chains are discoverable by agents
- [ ] 3-gate verification semantics are understood by all agents
- [ ] Permission models include `.planning/` read access for all agents
- [ ] L1 agents have `.planning/` write permission for STATE.md updates

---

### AS-11: Agent Naming Syndicate

**Wave:** W6 (depends on AS-8, blocked by skill-ecosystem SE-11)
**Status:** NOT STARTED

Rename ALL 59 agents to consistent `hm-<domain>-<role>` or `hf-<domain>-<role>` format. Delete obsolete GSD agents (transition safety: only after replacements verified). Update ALL cross-references.

**Deliverables:**

`NAMING-SYNDICATE.md` with:
- Old→new name mapping table for all 59 agents
- Naming convention spec: `hm-<domain>-<role>` and `hf-<domain>-<role>`
- Validation regex: `^(hm|hf)-[a-z]+-[a-z]+(-[a-z]+)?$`
- Deletion schedule: which gsd-* agents deleted and when

Naming patterns:
| Category | Pattern | Examples |
|----------|---------|----------|
| hm-* coordinator | `hm-*-coordinator` | `hm-phase-coordinator`, `hm-workstream-coordinator` |
| hm-* orchestrator | `hm-orchestrator` | `hm-orchestrator` (L0, single) |
| hm-* specialist | `hm-<domain>-<role>` | `hm-research-detective`, `hm-qa-critic`, `hm-phase-executor` |
| hf-* agents | `hf-<domain>-<role>` | `hf-meta-orchestrator`, `hf-agent-builder`, `hf-skill-author` |
| Internal agents | keep current names | `build`, `conductor`, `test-router` (internal-only) |

Cross-reference updates:
- AGENTS.md agent inventory section
- All 49+ skill SKILL.md files (agent references)
- All 13 command `.md` files (agent references)
- ROADMAP.md and STATE.md (agent name references)
- Per-agent `<delegation_boundary>` sections (L1 knows L2 names)

**Acceptance Criteria:**
- [ ] `NAMING-SYNDICATE.md` published with full old→new map
- [ ] All 41+ hm-* agents follow `hm-<domain>-<role>` pattern
- [ ] All 7+ hf-* agents follow `hf-<domain>-<role>` pattern
- [ ] No gsd-* agents remain (D-AD-03 satisfied)
- [ ] All cross-references in skills, commands, AGENTS.md resolve correctly
- [ ] Naming convention is machine-verifiable via regex
- [ ] `hf-meta-builder` name mismatch resolved (fixes KI-01)
