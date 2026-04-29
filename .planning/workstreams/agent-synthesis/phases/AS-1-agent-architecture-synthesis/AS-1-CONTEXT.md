---
phase: AS-1
workstream: agent-synthesis
status: NOT STARTED
depends_on:
  - AS-0
blocks:
  - AS-2
created: 2026-04-29
---

# AS-1: Agent Architecture Synthesis — Context

## Phase Goal
Compare GSD XML-tagged agent patterns against hivefiver markdown patterns and OMO architecture. Synthesize the best-of-both into a project-standard agent definition format. Resolve the body format tension (Decision D-AD-04: XML tagged sections are the standard, but some agents work well with markdown).

## Starting State
- AS-0 completed: full agent inventory, classification matrix, body format catalog, defect register
- Three competing agent architectures exist in the project:
  1. **GSD XML** — 25 agents use structured XML tags: `<role>`, `<task>`, `<scope>`, execution steps, `<context>`, `<expected_output>`, `<verification>`, `<guardrails>`, `<output_contract>`, `<behavioral_contract>`. Strengths: machine-parseable, self-documenting, execution flow clarity. Weaknesses: verbose, rigid, harder to write casually.
  2. **Hivefiver Markdown** — 6 agents use markdown sections with YAML frontmatter, `!bash` injection patterns, and category routing. Strengths: familiar to writers, flexible, good for meta-builder workflows. Weaknesses: not machine-parseable, inconsistent section naming.
  3. **OMO (oh-my-openagent)** — External reference architecture with plugin system, hook lifecycle, circuit breaker, category routing, session continuity. Strengths: proven patterns, agent delegation hierarchy. Weaknesses: external dependency, not tailored to Hivemind.
- Decision D-AD-04 already locked: "Agent body content uses XML tagged sections (from GSD best practice)"
- But the question remains: which XML tags are required, and where is markdown still appropriate?

## Deliverables
1. **`AGENT-ARCHITECTURE-SYNTHESIS.md`** — Comparison matrix + synthesis recommendations:
   - GSD XML pattern: full analysis with strengths/weaknesses, tag inventory, example bodies
   - Hivefiver Markdown pattern: full analysis with strengths/weaknesses, section inventory, example bodies
   - OMO patterns reviewed: hook lifecycle, circuit breaker, category routing, skill loader relevance
   - Synthesis recommendation per pattern: ADOPT / ADAPT / REJECT / DEFER
2. **Body Format Standard** — The canonical agent body specification:
   - XML tagged sections spec with markdown-allowed zones
   - Required tags: `<role>`, `<depth>`, `<lineage>`, `<task>`, `<scope>`, `<context>`, `<expected_output>`, `<verification>`
   - Optional tags: `<behavioral_contract>`, `<anti_patterns>`, `<delegation_boundary>`, `<skill_loading>`, `<session_continuity>`
   - Markdown-allowed zones: within `<task>`, `<scope>`, `<context>` for lists, code blocks, and emphasis
   - Maximum body size: 500 LOC (AQUAL-06)
3. **Frontmatter field mapping** — What YAML fields each lineage needs:
   - Required: name, description, mode, temperature, depth, lineage
   - Optional: tools, skills, permissions (read/write/delegate)
   - hm-* specific fields: domain category, primary skills
   - hf-* specific fields: meta-concept type (agent/command/skill/tool)

## Acceptance Criteria
- [ ] GSD XML pattern documented with strengths/weaknesses and full tag inventory
- [ ] Hivefiver Markdown pattern documented with strengths/weaknesses and section inventory
- [ ] OMO agent patterns reviewed (hook lifecycle, circuit breaker, category routing)
- [ ] Synthesis recommendation published: ADOPT/ADAPT/REJECT/DEFER for each pattern
- [ ] Body format standard published (resolves D-AD-04 implementation details)
- [ ] Frontmatter field mapping defined for both hm-* and hf-* lineages
- [ ] Markdown-allowed zones clearly defined (where XML tags contain markdown content)
- [ ] Standard includes example agent body showing all required and optional tags
- [ ] `AGENT-ARCHITECTURE-SYNTHESIS.md` published and committed

## Known Risks
- D-AD-04 is locked but implementation details are unresolved — synthesis must respect the locked decision
- Body format standard must balance GSD rigor with hivefiver flexibility — too rigid = hard to write, too flexible = hard to verify
- OMO patterns may introduce complexity that exceeds the project's needs (target ~30 hm-* agents, not hundreds)
- Synthesis recommendation must be actionable — "ADOPT but adapt X, Y, Z" vs vague "consider both"
- Frontmatter field proliferation risk: too many optional fields → agents become hard to configure

## Skills/Agents Involved
- **Creates:** `AGENT-ARCHITECTURE-SYNTHESIS.md`
- **Analyzes:** GSD agent patterns (25 agents), Hivefiver patterns (6 agents), OMO architecture
- **Output feeds:** AS-2 (schema design), AS-3 (orchestrator/coordinator creation)
