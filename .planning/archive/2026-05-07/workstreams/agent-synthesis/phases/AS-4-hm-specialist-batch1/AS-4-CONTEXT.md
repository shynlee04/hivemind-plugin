---
phase: AS-4
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-3
blocks:
  - AS-5
  - AS-8
created: 2026-04-29
---

# AS-4: L2 hm-* Specialist Agent Authoring (Batch 1: 17 Agents) — Context

## Phase Goal
Create the first batch of 17 hm-* L2 specialist agents organized by domain cluster. These replace the first 17 of 33 GSD specialists with Hivemind-native agents that follow the AS-2 schema and AS-3 patterns. Domain clusters: Research (5), Planning (4), Implementation (3), Quality (5).

## Starting State
- AS-3 completed: hm-orchestrator (L0), hm-coordinator (L1), hf-orchestrator (L0), hm-phase-loop-manager (L1) exist
- AS-2 schema defines all frontmatter fields, depth rules, and permission templates
- 33 GSD specialist agents exist at `.opencode/agents/` — NOT deleted yet (D-AD-03 transition safety)
- Zero hm-* L2 agents exist — all must be created from scratch
- Relevant hm-* skills exist (from skill-ecosystem workstream) for agents to reference

## Deliverables — 17 Agents Across 4 Clusters

### Research Cluster (5 agents)
1. **`hm-researcher.md`** — Terminal repository investigator. Read-only. Skills: hm-detective, hm-deep-research, hm-synthesis. Tools: Read, Glob, Grep, Bash, Tavily/Brave (MCP).
2. **`hm-detective.md`** — Codebase investigator with SCAN/READ/DEEP modes. Skills: hm-detective. Tools: Read, Glob, Grep.
3. **`hm-deep-researcher.md`** — Multi-source deep research with citations. Skills: hm-deep-research. Tools: Read, WebFetch, Tavily, Brave, Context7.
4. **`hm-synthesizer.md`** — Compress research findings into artifacts. Skills: hm-synthesis. Tools: Read, Write.
5. **`hm-tech-stack-ingester.md`** — Download and cache third-party repos/docs. Skills: hm-tech-stack-ingest. Tools: Repomix, DeepWiki, Bash.

### Planning Cluster (4 agents)
6. **`hm-planner.md`** — Creates executable phase plans with task breakdown. Skills: hm-planning-persistence. Tools: Read, Write, Glob, Grep.
7. **`hm-spec-author.md`** — Spec-locking and requirement extraction. Skills: hm-spec-driven-authoring. Tools: Read, Write.
8. **`hm-requirements-analyst.md`** — Requirements gap detection and diagnosis. Skills: hm-requirements-analysis. Tools: Read, Write, Grep.
9. **`hm-feature-ecosystem-designer.md`** — Cross-feature dependency design. Skills: hm-feature-ecosystem. Tools: Read, Write, Glob.

### Implementation Cluster (3 agents)
10. **`hm-builder.md`** — Code writing and feature development. Skills: hm-test-driven-execution, hm-cross-cutting-change. Tools: Read, Write, Edit, Bash.
11. **`hm-refactorer.md`** — Surgical vs structural refactoring. Skills: hm-refactor. Tools: Read, Write, Edit, Glob, Grep.
12. **`hm-cross-cutting-changer.md`** — Cross-pane modifications with lifecycle governance. Skills: hm-cross-cutting-change. Tools: Read, Write, Edit, Glob, Grep.

### Quality Cluster (5 agents)
13. **`hm-code-reviewer.md`** — Security, performance, bug review. Skills: hm-spec-driven-authoring (for compliance check). Tools: Read, Glob, Grep, Bash.
14. **`hm-code-fixer.md`** — Apply fixes from review findings. Skills: hm-debug. Tools: Read, Write, Edit.
15. **`hm-test-driver.md`** — RED/GREEN/REFACTOR TDD execution. Skills: hm-test-driven-execution. Tools: Read, Write, Edit, Bash.
16. **`hm-security-auditor.md`** — STRIDE threat modeling audit. Skills: (reads security patterns). Tools: Read, Glob, Grep.
17. **`hm-production-readiness-checker.md`** — Deployment verification and evidence collection. Skills: hm-production-readiness, gate-evidence-truth. Tools: Read, Glob, Grep, Bash.

## Acceptance Criteria
- [ ] 17 agent files created with full XML-tagged bodies per AS-1 body format standard
- [ ] Each agent follows AS-2 schema for YAML frontmatter (all required fields present)
- [ ] Each agent references correct hm-* skills via `skills:` array in frontmatter
- [ ] Domain cluster membership is explicit in frontmatter (`domain:` field)
- [ ] No agent exceeds 500 LOC (body + frontmatter, AQUAL-06)
- [ ] All 17 agents pass AQUAL-01 through AQUAL-08 quality contract
- [ ] L2 depth rules enforced: temperature 0.0-0.15, no delegation tools, no subagent dispatch
- [ ] Permission scope is domain-specific: write access only to relevant directories
- [ ] All agents registered with `.gitkeep` in the agent directory

## Known Risks
- 17 agents is a large batch — risk of quality inconsistency across agents
- Research cluster agents need MCP tool access (Tavily, Brave, Context7) — tool availability varies by environment
- Quality cluster agents (code-reviewer, code-fixer) may overlap in function — clear boundary definition needed
- Builder agent must coordinate with test-driver agent — TDD flow requires both
- gsd-* counterparts still exist — must not create naming collisions or duplicate functionality

## Skills/Agents Involved
- **Creates:** 17 L2 hm-* agent files
- **References:** hm-* skills from skill-ecosystem workstream
- **Output feeds:** AS-5 (batch 2), AS-8 (body enrichment)
