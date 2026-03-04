# Skill Classification Manifest — 2026-03-04

Scope: `.opencode/skills/`

Baseline inventory:
- 48 skill directories
- 1 metadata file (`registry.yaml`)
- Total entries: 49

Target outcome:
- Keep 32 active skills
- Archive 16 skills (non-destructive move)

## Classification Table

| Entry | Type | Lines | Bucket | Reason |
|---|---:|---:|---|---|
| `agent-role-boundary` | dir | 20 | ARCHIVE — Redundant/Overlapping | Minimal role-boundary content; better enforced in agent definitions/governance stack. |
| `comparative-analysis` | dir | 69 | KEEP — Narrow Expertise | Useful structured comparison method, no direct overlap with retained core entry chain. |
| `compliance-checking` | dir | 73 | KEEP — Narrow Expertise | Focused convention and integrity checks useful for audits and asset validation. |
| `context-first-gatekeeping` | dir | 264 | ARCHIVE — Redundant/Overlapping | Overlaps with `context-integrity` + `evidence-discipline`; duplicate governance posture. |
| `context-integrity` | dir | 268 | KEEP — Core Operational | Primary drift detection/escalation and repair flow for context reliability. |
| `context-quality-escalation` | dir | 205 | ARCHIVE — Deprecated | Frontmatter marks deprecated and merged into `context-integrity` (2026-03-03). |
| `creative-ideating-room` | dir | 84 | KEEP — Narrow Expertise | Optional ideation transformer for messy requirements; not entry-critical but useful. |
| `debug-orchestration` | dir | 310 | KEEP — Core Operational | High-level debugging orchestration used as operational framework skill. |
| `delegation-intelligence` | dir | 331 | KEEP — Core Operational | Canonical delegation strategy and dispatch guidance for current governance model. |
| `delegation-packet-contract` | dir | 32 | ARCHIVE — Deprecated | Superseded by `delegation-intelligence` typed delegation workflow. |
| `ecosystem-diagnostic` | dir | 0 | ARCHIVE — Stub | No `SKILL.md`; empty/non-operational skill stub. |
| `evidence-discipline` | dir | 123 | KEEP — Core Operational | Enforces proof-before-claim discipline and verification behavior. |
| `gate-enforcement` | dir | 71 | KEEP — Core Operational | Defines gate pass/fail logic for quality control checkpoints. |
| `gx-context-engine` | dir | 188 | KEEP — Core Operational | Context continuity and recovery engine relevant to healer refactor operations. |
| `hitea-adversarial-arena` | dir | 315 | KEEP — Testing Domain | Hitea testing lineage skill; retained unchanged per phase rules. |
| `hitea-chaos-engineering` | dir | 199 | KEEP — Testing Domain | Hitea testing lineage skill; retained unchanged per phase rules. |
| `hitea-mutation-testing` | dir | 245 | KEEP — Testing Domain | Hitea testing lineage skill; retained unchanged per phase rules. |
| `hitea-property-testing` | dir | 230 | KEEP — Testing Domain | Hitea testing lineage skill; retained unchanged per phase rules. |
| `hitea-visual-regression` | dir | 150 | KEEP — Testing Domain | Hitea testing lineage skill; retained unchanged per phase rules. |
| `hivefiver-bilingual-tutor` | dir | 36 | ARCHIVE — Not Needed Now | EN/VI tutoring not required for current healer refactor scope. |
| `hivefiver-context-enforcer` | dir | 552 | KEEP — Core Operational | Primary enforcement/remediation playbooks for degraded context scenarios. |
| `hivefiver-coordination` | dir | 213 | KEEP — Core Operational | Active helper for quality gates, routing constraints, and completion checks. |
| `hivefiver-domain-pack-router` | dir | 37 | ARCHIVE — Not Needed Now | Domain-pack routing is out of scope for current non-destructive pivot phase. |
| `hivefiver-gsd-compat` | dir | 29 | ARCHIVE — Not Needed Now | GSD compatibility mapping not required in current refactor execution path. |
| `hivefiver-guided-discovery` | dir | 162 | KEEP — Core Operational | Discovery/clarification workflow remains useful during framework refactor cycles. |
| `hivefiver-mcp-research-loop` | dir | 53 | KEEP — Core Operational | MCP-backed iterative research loop supports evidence-first implementation decisions. |
| `hivefiver-mode` | dir | 163 | KEEP — T0-Critical | Entry-chain stage router; must remain as direct hivefiver entry skill. |
| `hivefiver-orchestrator` | dir | 41 | ARCHIVE — Redundant/Overlapping | Self-declared deferral to `hivefiver-mode` + `hivefiver-coordination`; duplicate wrapper. |
| `hivefiver-persona-routing` | dir | 177 | ARCHIVE — Not Needed Now | Persona lane routing not required for this healer-focused refactor slice. |
| `hivefiver-prime` | dir | 231 | KEEP — T0-Critical | Mandatory first-load entry skill for role boundaries and session initialization. |
| `hivefiver-ralph-tasking` | dir | 43 | ARCHIVE — Not Needed Now | Ralph PRD/beads conversion not required in current phase scope. |
| `hivefiver-skill-auditor` | dir | 38 | ARCHIVE — Not Needed Now | Meta-skill auditing workflow is non-essential for immediate healer refactor execution. |
| `hivefiver-spec-distillation` | dir | 38 | KEEP — Core Operational | Lightweight requirement distillation remains useful for controlled refinement. |
| `hivemind-architect-strategist` | dir | 317 | KEEP — Core Operational | Strategic architecture synthesis support for orchestrator decision quality. |
| `hivemind-framework-auditor` | dir | 194 | KEEP — Core Operational | Core framework health audit entry point aligned to Sector-2 integrity checks. |
| `hivemind-governance` | dir | 179 | ARCHIVE — Redundant/Overlapping | "Load every turn" bootstrap pattern duplicates emitter behavior and inflates context. |
| `hiveplanner-orchestration` | dir | 41 | KEEP — Core Operational | Planner methodology bridge retained for plan-driven coordination compatibility. |
| `market-research-framework` | dir | 249 | KEEP — Narrow Expertise | Domain research methodology retained as optional specialist capability. |
| `meta-builder-governance` | dir | 19 | ARCHIVE — Redundant/Overlapping | Ultra-small governance fragment better absorbed by retained coordination/governance skills. |
| `parallel-debugging-hivemind` | dir | 209 | KEEP — Narrow Expertise | Specialized parallel debugging playbook useful for complex failure analysis. |
| `registry.yaml` | file | 413 | KEEP — Metadata (Non-Skill) | Registry artifact, not a skill directory; retained in place for index integrity. |
| `regression-detection` | dir | 61 | KEEP — Narrow Expertise | Focused regression delta analysis adds targeted verification value. |
| `research-methodology` | dir | 60 | KEEP — Narrow Expertise | Generic research methodology complements MCP research loop without direct conflict. |
| `sequential-orchestration` | dir | 285 | ARCHIVE — Redundant/Overlapping | Sequential delegation mechanics overlap with `delegation-intelligence` canonical guidance. |
| `session-lifecycle` | dir | 186 | ARCHIVE — Redundant/Overlapping | Lifecycle flow overlaps with entry-chain behavior in `hivefiver-prime`. |
| `source-evaluation` | dir | 64 | KEEP — Narrow Expertise | Source reliability rubric remains useful for evidence quality scoring. |
| `synthesis-patterns` | dir | 55 | KEEP — Narrow Expertise | Source synthesis pattern library remains useful for multi-source consolidation. |
| `systematic-debugging-hivemind` | dir | 228 | KEEP — Core Operational | Core systematic debugging methodology for HiveMind-specific incident handling. |
| `verification-methodology` | dir | 62 | KEEP — Core Operational | Goal-backward verification supports acceptance-criteria traceability. |

## Planned Archive Set (16)

1. `agent-role-boundary`
2. `context-first-gatekeeping`
3. `context-quality-escalation`
4. `delegation-packet-contract`
5. `ecosystem-diagnostic`
6. `hivefiver-bilingual-tutor`
7. `hivefiver-domain-pack-router`
8. `hivefiver-gsd-compat`
9. `hivefiver-orchestrator`
10. `hivefiver-persona-routing`
11. `hivefiver-ralph-tasking`
12. `hivefiver-skill-auditor`
13. `hivemind-governance`
14. `meta-builder-governance`
15. `sequential-orchestration`
16. `session-lifecycle`
