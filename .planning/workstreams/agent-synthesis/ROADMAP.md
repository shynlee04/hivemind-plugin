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
| AS-0 | Agent Inventory & Classification Audit | W1 | NOT STARTED | None |
| AS-1 | Agent Architecture Synthesis | W1 | NOT STARTED | AS-0 |
| AS-2 | Lineage Classification & Schema Design | W2 | NOT STARTED | AS-1 |
| AS-3 | L0/L1 Orchestrator & Coordinator Creation | W3 | NOT STARTED | AS-2, skill-ecosystem SE-5 |
| AS-4 | L2 hm-* Specialist Agent Authoring (batch 1: 17) | W4 | NOT STARTED | AS-3 |
| AS-5 | L2 hm-* Specialist Agent Authoring (batch 2: 17) | W4 | NOT STARTED | AS-4 |
| AS-6 | L2 hf-* Meta Builder Agent Authoring | W4 | NOT STARTED | AS-3 |
| AS-7 | Capability Matrix Wiring & Integration Verification | W5 | NOT STARTED | AS-4, AS-5, AS-6, skill-ecosystem SE-5.5 |

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
           └── AS-7 (Capability Matrix & Verification) ─── blocked by SE-5.5 (gate hardening)
                └── requires: AS-4, AS-5, AS-6 complete
```

**Parallelization:** AS-4, AS-5, and AS-6 can partially overlap once AS-3 completes. AS-4 and AS-6 can run in parallel. AS-5 must follow AS-4 (batch dependency).

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

### AS-0: Agent Inventory & Classification Audit

**Wave:** W1 (research-only, no blockers)
**Status:** NOT STARTED

Produce a complete inventory and classification matrix of all 58 agents on disk plus 1 ghost agent (`explore`). Every agent gets quality-scored on frontmatter completeness, body depth, execution flow presence, and output contract clarity.

**Deliverables:**
- `AGENT-INVENTORY.md` — full classification matrix (agent × quality dimensions)
- `AGENT-BODY-CATALOG.md` — body format catalog (XML tagged vs markdown vs flat)
- Defect register (9 known issues + any new ones discovered)

**Acceptance Criteria:**
- [ ] All 58 on-disk agents cataloged with frontmatter extraction
- [ ] Each agent classified: gsd-* (33), hivefiver-* (6), hf-* (1), core (18)
- [ ] Quality score assigned per agent (HIGH/MEDIUM/LOW/NONE)
- [ ] Body format cataloged: GSD XML (25), Markdown (6), Mixed (4), Flat (24)
- [ ] All 9 known defects confirmed or resolved
- [ ] Ghost agent `explore` documented as missing-from-disk

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
- [ ] Permission model templates: tool allow/deny, temperature, budget per depth
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
