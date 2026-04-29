---
gsd_state_version: 1.0
workstream: agent-synthesis
status: BOOTSTRAPPING
phase_count: 8
current_phase: AS-0
last_updated: "2026-04-29T00:00:00Z"
progress:
  total_phases: 8
  completed_phases: 0
  authorized_phases: 0
  plans_written: 0
---

# STATE: Agent Synthesis Workstream

## Current Position

- **Phase:** AS-0 — Agent Inventory & Classification Audit
- **Status:** NOT STARTED
- **Next Action:** Deep-read all 58 on-disk agents + 1 ghost agent, produce AGENT-INVENTORY.md

## Progress Table

| Metric | Count |
|--------|-------|
| Total phases | 8 |
| Completed | 0 |
| Authorized | 0 |
| Plans written | 0 |
| Plans executed | 0 |

## Agent Inventory (2026-04-29)

**Total: 59 agents** (58 on disk + 1 ghost)

| Category | Count | Prefix | Files | Shipped? |
|----------|-------|--------|-------|----------|
| GSD specialist | 33 | `gsd-*` | `gsd-advisor-researcher.md` through `gsd-verifier.md` | No (internal only) |
| Hivefiver meta | 6 | `hivefiver-*` | `hivefiver.md`, `hivefiver-agent-builder.md`, `hivefiver-command-builder.md`, `hivefiver-orchestrator.md`, `hivefiver-skill-author.md`, `hivefiver-tool-builder.md` | Candidate for hf-* |
| Hivemind core (hf) | 1 | `hf-*` | `hf-prompter.md` | Yes |
| Core (unprefixed) | 18 | various | `build.md`, `conductor.md`, `context-mapper.md`, `context-purifier.md`, `coordinator.md`, `critic.md`, `general.md`, `intent-loop.md`, `meta-synthesis-agent.md`, `orchestrator.md`, `phase-guardian.md`, `prompt-analyzer.md`, `prompt-repackager.md`, `prompt-skimmer.md`, `researcher.md`, `risk-assessor.md`, `spec-verifier.md`, `test-router.md` | Candidate for hm-* |
| Ghost (missing) | 1 | — | `explore` (referenced in AGENTS.md, not on disk) | TBD |

### Quality Distribution

| Quality | Count | Agents |
|---------|-------|--------|
| HIGH | 15 | GSD agents with full XML bodies (25+ LOC body, execution flows) |
| MEDIUM | 8 | hivefiver-* agents (structured markdown, 100-360 LOC) |
| LOW | 3 | hf-prompter (defective), meta-synthesis-agent (missing mode), stubs |
| NONE | 1 | explore (missing from disk entirely) |

### Body Format Split

| Format | Count | Description |
|--------|-------|-------------|
| GSD XML | 25 | XML-tagged sections (`<task>`, `<scope>`, `<context>`, `<output>`, `<verification>`) |
| Markdown | 6 | hivefiver-* agents using markdown sections |
| Mixed | 4 | Partial XML + markdown hybrids |
| Flat | 24 | Minimal or no structured body (stubs, thin descriptions) |

## Known Defects (9 items)

| # | Defect | Severity | Fix Target |
|---|--------|----------|-----------|
| KI-01 | `hf-meta-builder` name mismatch — file is `hf-meta-builder` but references `hr-meta-builder` | HIGH | AS-6 |
| KI-02 | `hf-prompter` missing `name:` field in YAML frontmatter | MEDIUM | AS-6 |
| KI-03 | `meta-synthesis-agent` missing `mode:` field | MEDIUM | AS-4/AS-5 |
| KI-04 | `explore` agent ghost reference in AGENTS.md — not on disk | HIGH | AS-7 |
| KI-05 | `test-router` not documented in AGENTS.md inventory | LOW | AS-0 |
| KI-06 | `orchestrator.md` is a 16-line stub | HIGH | AS-3 |
| KI-07 | `general.md` is a thin stub | MEDIUM | AS-4/AS-5 |
| KI-08 | Agent count 58→59 discrepancy (ghost explore) | LOW | AS-0 |
| KI-09 | Zero hm-* agents exist — entire shipped system must be built | CRITICAL | AS-3 through AS-5 |

## Dependencies

### Blocked By
- **skill-ecosystem SE-5** (gate-orchestrator + lineage-router): Required before AS-3 can create L0/L1 agents with correct routing
- **skill-ecosystem SE-5.5** (gate hardening): Required before AS-7 can run quality gate triad

### Feeds Into
- **skill-ecosystem SE-6** (hf-agent-synthesizer skill): Consumes agent-synthesis output — agent-synthesis does NOT depend on SE-6

### Internal Dependency Chain
```
AS-0 → AS-1 → AS-2 → AS-3 → AS-4 → AS-5
                          ↘ AS-6 ↗
                          AS-7 (requires AS-4 + AS-5 + AS-6)
```

## Session Continuity Notes

- **Cycle 1** (2026-04-27): Initial ROADMAP with thin-frame phases AS-0 through AS-7
- **Cycle 2, Wave 3** (2026-04-29): ROADMAP rewritten with concrete phases, dependency chains, known issues. STATE updated with actual inventory (58 on-disk + 1 ghost = 59).
- Next session should begin AS-0 execution: deep-read all agents, produce AGENT-INVENTORY.md
