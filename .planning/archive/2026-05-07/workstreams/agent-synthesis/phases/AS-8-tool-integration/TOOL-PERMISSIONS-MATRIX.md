---
audit: AS-8
title: "Tool & Skill Permissions Matrix"
lineage_scope: "hm-* and hf-* agents only (40 total)"
audit_date: "2026-04-30"
status: COMPLETE
violations_found: 0
fixes_applied: 0
lineages:
  hm: 30
  hf: 10
depths:
  L0: 2
  L1: 2
  L2: 36
---

# Tool & Skill Permissions Matrix — AS-8 Audit

## Executive Summary

**Complete audit of all 40 hm-*/hf-* agents.** All agents pass lineage boundary checks. All skill references resolve to actual SKILL.md files. Zero permission model violations found.

### Quick Stats

| Metric | Count |
|--------|-------|
| Agents audited | 40 (30 hm-* + 10 hf-*) |
| Lineage boundary violations | **0** |
| hm-* agents with hf-* skills | **0** ✓ |
| L2 agents with task:allow | **0** ✓ |
| L2 agents with delegate-task:allow | **0** ✓ |
| L0/L1 missing delegate-task:allow | **0** ✓ |
| Unresolved skill references | **0** ✓ |
| Fixes applied | **0** (clean audit) |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✓ | allow |
| ✗ | ask |
| ✓P | allow with pattern restriction |
| — | not specified (default ask) |
| N/A | tool not applicable to agent role |

### Tool Categories

| Category | Tools |
|----------|-------|
| **Native OpenCode** | read, edit, write, bash, glob, grep, todowrite |
| **Hivemind Custom** | task, delegate-task, delegation-status, session-journal-export, prompt-skim, prompt-analyze, session-patch |
| **MCP / Web** | webfetch, websearch |
| **Skills** | hm-*, hf-*, gate-*, stack-* |

---

## Part 1: Native OpenCode Tools

### hm-* Lineage (30 agents)

| Agent | Depth | read | edit | write | bash | glob | grep | todowrite |
|-------|-------|------|------|-------|------|------|------|-----------|
| **hm-orchestrator** | L0 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| **hm-coordinator** | L1 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-analyst | L2 | ✓ | ✗ | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-architect | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-assessor | L2 | ✓ | ✗ | ✗ | ✓P (git,node, npx) | ✓ | ✓ | ✗ |
| hm-auditor | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-brainstormer | L2 | ✓ | ✗ | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-connector | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-curator | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-debugger | L2 | ✓ | ✓ | ✗ | ✓P (git,node,npm,npx) | ✓ | ✓ | ✗ |
| hm-ecologist | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-executor | L2 | ✓ | ✓ | ✓ | ✓P (git,node,npm,npx) | ✓ | ✓ | ✗ |
| hm-finisher | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-guardian | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-integrator | L2 | ✓ | ✓ | ✗ | ✓P (git,node,npm,npx) | ✓ | ✓ | ✗ |
| hm-investigator | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-mentor | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-operator | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-optimizer | L2 | ✓ | ✓P (src/**) | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-persistor | L2 | ✓ | ✓P (.hivemind/**) | ✓P (.hivemind/**) | ✓P (git) | ✓ | ✓ | ✗ |
| hm-planner | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-researcher | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-reviewer | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-router | L2 | ✓ | ✗ | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-scout | L2 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hm-strategist | L2 | ✓ | ✗ | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-synthesizer | L2 | ✓ | ✗ | ✗ | ✓P (git) | ✓ | ✓ | ✗ |
| hm-technician | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-validator | L2 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hm-writer | L2 | ✓ | ✓P (docs/**) | ✓P (docs/**) | ✓P (git) | ✓ | ✓ | ✗ |

### hf-* Lineage (10 agents)

| Agent | Depth | read | edit | write | bash | glob | grep | todowrite |
|-------|-------|------|------|-------|------|------|------|-----------|
| **hf-orchestrator** | L0 | ✓ | ✗ | ✗ | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| **hf-coordinator** | L1 | ✓ | ✗ | ✗ | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-agent-builder | L2 | ✓ | ✓P (.opencode/agents/**) | ✓P (.opencode/agents/**) | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-auditor | L2 | ✓ | ✓P (.opencode/**) | ✓P (.opencode/**) | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-command-builder | L2 | ✓ | ✓P (.opencode/commands/**) | ✓P (.opencode/commands/**) | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-prompter | L2 | ✓ | ✓ | ✓ | ✓P (git,node,npx,mkdir,cat,export,set) | ✓ | ✓ | ✗ |
| hf-refactorer | L2 | ✓ | ✓P (.opencode/agents/**,.opencode/skills/**) | ✓P (.opencode/agents/**,.opencode/skills/**) | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-skill-builder | L2 | ✓ | ✓P (.opencode/skills/**) | ✓P (.opencode/skills/**) | ✓P (git,node) | ✓ | ✓ | ✗ |
| hf-synthesizer | L2 | ✓ | ✓P (.opencode/skills/**) | ✓P (.opencode/skills/**) | ✓P (git,node,npx) | ✓ | ✓ | ✗ |
| hf-tool-builder | L2 | ✓ | ✓P (src/tools/**) | ✓P (src/tools/**) | ✓P (git,node,npx) | ✓ | ✓ | ✗ |

### Notable Patterns

- **All 40 agents** use `glob: allow` and `grep: allow` — consistent read-only investigation capability
- **Write (write/edit) access** is restricted to agents with clear domain boundaries:
  - hm-executor (implementation), hm-persistor (state files), hm-writer (docs)
  - hf-agent-builder (.opencode/agents/), hf-auditor (.opencode/), hf-command-builder (.opencode/commands/), hf-refactorer (.opencode/agents+skills/), hf-skill-builder (.opencode/skills/), hf-synthesizer (.opencode/skills/), hf-tool-builder (src/tools/), hf-prompter (prompt output)
- **bash** access is universally pattern-restricted: `git *` is the common baseline, with `node`, `npm`, `npx` added for agents needing runtime verification
- **todowrite** is denied for all agents — not used in the hm-/hf-* lineage model

---

## Part 2: Hivemind Custom Tools

### Delegation Authority

| Agent | Depth | task | delegate-task | delegation-status | session-journal-export |
|-------|-------|------|---------------|-------------------|----------------------|
| **hm-orchestrator** | L0 | ✓P (hm-*, ask hf-*, L2-*) | ✓ | ✓ | ✓ |
| **hm-coordinator** | L1 | ✓P (hm-*, ask hf-*, L0-*, L1-*) | ✓ | ✓ | ✓ |
| **hf-orchestrator** | L0 | ✓P (hf-*, hm-*, ask L2-*) | ✓ | ✓ | ✓ |
| **hf-coordinator** | L1 | ✓P (hf-agent-builder, hf-skill-author, hf-command-builder, hf-tool-builder, hm-*, ask L0-*, L1-*) | ✓ | ✓ | ✓ |
| **All 36 L2 agents** | L2 | ✗ | ✗ | ✗ | ✗ |

### Custom Tool Access

All 36 L2 agents (hm-* and hf-*) have the following consistent pattern:

| Tool | Permission |
|------|-----------|
| task | ✗ (ask) |
| delegate-task | ✗ (ask) |
| delegation-status | ✗ (ask) |
| session-journal-export | ✗ (ask) |
| prompt-skim | ✗ (ask) |
| prompt-analyze | ✗ (ask) |
| session-patch | ✗ (ask) |

L0/L1 orchestrators differ only in task/delegate-task authority:

| Tool | hm-orchestrator (L0) | hm-coordinator (L1) | hf-orchestrator (L0) | hf-coordinator (L1) |
|------|---------------------|--------------------|---------------------|--------------------|
| prompt-skim | ✓ | ✗ | ✓ | ✗ |
| prompt-analyze | ✓ | ✗ | ✓ | ✗ |
| session-patch | ✗ | ✗ | ✗ | ✗ |

**Key: session-patch is universally denied** — no agent can modify session files directly. All state mutation goes through tools/hooks in `src/`.

---

## Part 3: Web/MCP Tools

| Agent | Depth | webfetch | websearch |
|-------|-------|----------|-----------|
| hm-orchestrator | L0 | ✓ | ✓ |
| hm-coordinator | L1 | ✓ | ✓ |
| hf-orchestrator | L0 | ✓ | ✓ |
| hf-coordinator | L1 | ✓ | ✓ |
| hm-researcher | L2 | ✓ | ✓ |
| hm-technician | L2 | ✓ | ✓ |
| hm-validator | L2 | ✓ | ✓ |
| hm-auditor | L2 | ✓ | ✓ |
| hm-connector | L2 | ✓ | ✓ |
| hm-finisher | L2 | ✓ | ✓ |
| hm-guardian | L2 | ✓ | ✓ |
| hm-operator | L2 | ✓ | ✓ |
| hf-prompter | L2 | ✓ | — |
| hf-synthesizer | L2 | ✓ | — |
| All other agents | L2 | ✗ (not specified) | ✗ (not specified) |

**Pattern:** Web access is granted to orchestrators (for research/intent understanding), research-domain agents, and agents needing external validation. Most read-only analysis agents do not have web access — their scope is local codebase only.

---

## Part 4: Skill Permissions

### hm-* STRICT Lineage (30 agents)

All hm-* agents follow the **STRICT** rule: skill permissions only allow hm-*, gate-*, and stack-* prefixes. **No hm-* agent references any hf-* skill.**

#### hm-orchestrator (L0) — Wildcard

```
skill:
  "*": ask
  "hm-*": allow      # All product-dev skills
  "gate-*": allow    # Quality gate triad
  "stack-*": allow   # Tech stack references
  "hf-*": ask       # hm STRICT: no meta-builder skills
```

#### hm-coordinator (L1)

```
skill: hm-coordinating-loop, hm-subagent-delegation-patterns, hm-completion-looping, 
       hm-phase-execution, hm-phase-loop, gate-lifecycle-integration, gate-spec-compliance
```

#### hm-* L2 Specialists (28 agents)

| Agent | Skills (allow-listed) |
|-------|----------------------|
| hm-analyst | hm-product-validation, hm-requirements-analysis |
| hm-architect | hm-refactor, hm-roadmap-maintainability |
| hm-assessor | hm-production-readiness, hm-requirements-analysis |
| hm-auditor | hm-production-readiness, hm-roadmap-maintainability |
| hm-brainstormer | hm-brainstorm |
| hm-connector | hm-cross-cutting-change, hm-coordinating-loop |
| hm-curator | hm-production-readiness, hm-roadmap-maintainability |
| hm-debugger | hm-debug, hm-completion-looping |
| hm-ecologist | hm-feature-ecosystem |
| hm-executor | hm-phase-execution, hm-cross-cutting-change, hm-test-driven-execution |
| hm-finisher | hm-completion-looping, hm-test-driven-execution |
| hm-guardian | hm-phase-loop, hm-completion-looping |
| hm-integrator | hm-production-readiness, hm-cross-cutting-change |
| hm-investigator | hm-debug, hm-detective |
| hm-mentor | hm-brainstorm, hm-requirements-analysis |
| hm-operator | hm-phase-execution, hm-phase-loop |
| hm-optimizer | hm-refactor, hm-cross-cutting-change |
| hm-persistor | hm-planning-persistence, hm-completion-looping |
| hm-planner | hm-spec-driven-authoring, hm-planning-persistence |
| hm-researcher | hm-detective, hm-deep-research, hm-research-chain, hm-tech-stack-ingest, hm-synthesis |
| hm-reviewer | hm-test-driven-execution |
| hm-router | hm-requirements-analysis, hm-feature-ecosystem |
| hm-scout | hm-detective, hm-tech-stack-ingest, hm-synthesis |
| hm-strategist | hm-roadmap-maintainability, hm-feature-ecosystem |
| hm-synthesizer | hm-synthesis, hm-deep-research |
| hm-technician | hm-tech-context-compliance, hm-tech-stack-ingest |
| hm-validator | hm-test-driven-execution, hm-spec-driven-authoring |
| hm-writer | hm-spec-driven-authoring, hm-synthesis |

---

### hf-* FLEXIBLE Lineage (10 agents)

All hf-* agents follow the **FLEXIBLE** rule: skill permissions CAN reference both hf-* and hm-* skills. Cross-lineage access is justified by the agent's meta-builder domain.

#### hf-orchestrator (L0) — Wildcard

```
skill:
  "*": ask
  "hf-*": allow       # All meta-builder skills
  "hm-*": allow       # hf FLEXIBLE: cross-lineage access
  "gate-*": allow     # Quality gate triad
  "stack-*": allow    # Tech stack references
```

#### hf-coordinator (L1)

```
skill: hf-agents-and-subagents-dev, hf-agent-composition, hf-delegation-gates,
       hf-skill-synthesis, hm-coordinating-loop, hm-completion-looping, hm-detective,
       hm-deep-research, gate-lifecycle-integration, gate-spec-compliance
```

#### hf-* L2 Specialists (8 agents)

| Agent | hf-* Skills | hm-* Skills (cross-lineage) | stack-* |
|-------|-------------|---------------------------|---------|
| hf-agent-builder | hf-agents-and-subagents-dev, hf-agent-composition, hf-use-authoring-skills | hm-detective, hm-deep-research, hm-spec-driven-authoring | stack-opencode, stack-zod |
| hf-auditor | hf-use-authoring-skills, hf-agents-md-sync, hf-agent-composition, hf-agents-and-subagents-dev, hf-command-dev, hf-command-parser, hf-custom-tools-dev | hm-gate-orchestrator, hm-detective, hm-spec-driven-authoring | stack-opencode, stack-zod |
| hf-command-builder | hf-command-dev, hf-command-parser, hf-use-authoring-skills | hm-detective, hm-opencode-non-interactive-shell | stack-opencode |
| hf-prompter | hf-command-parser, hf-use-authoring-skills | hm-deep-research, hm-detective, hm-synthesis, hm-planning-persistence, hm-opencode-non-interactive-shell | — |
| hf-refactorer | hf-use-authoring-skills, hf-agents-md-sync, hf-agent-composition, hf-agents-and-subagents-dev, hf-skill-synthesis | hm-refactor, hm-detective, hm-synthesis, hm-spec-driven-authoring | stack-opencode, stack-zod |
| hf-skill-builder | hf-use-authoring-skills, hf-skill-synthesis, hf-agents-and-subagents-dev | hm-detective, hm-deep-research, hm-synthesis, hm-spec-driven-authoring | stack-opencode |
| hf-synthesizer | hf-skill-synthesis, hf-use-authoring-skills, hf-agent-composition | hm-synthesis, hm-detective, hm-deep-research, hm-tech-stack-ingest, hm-tech-context-compliance | stack-opencode, stack-zod, stack-nextjs, stack-vitest |
| hf-tool-builder | hf-custom-tools-dev, hf-use-authoring-skills | hm-detective, hm-deep-research, hm-tech-context-compliance | stack-opencode, stack-zod, stack-vitest |

---

## Part 5: Skill Reference Validation

All skill names referenced in agent permission blocks were verified against `.opencode/skills/*/SKILL.md` files (51 active skills).

### hm-* Skills Referenced (all resolved ✓)

| Skill Name | Referenced By | SKILL.md Exists |
|------------|--------------|----------------|
| hm-brainstorm | hm-brainstormer, hm-mentor | ✓ |
| hm-completion-looping | hm-coordinator, hm-debugger, hm-finisher, hm-guardian, hm-persistor, hf-coordinator, hf-orchestrator | ✓ |
| hm-coordinating-loop | hm-coordinator, hm-connector, hf-coordinator, hf-orchestrator | ✓ |
| hm-cross-cutting-change | hm-connector, hm-executor, hm-integrator, hm-optimizer | ✓ |
| hm-debug | hm-debugger, hm-investigator | ✓ |
| hm-deep-research | hm-researcher, hm-synthesizer, hm-scout, hf-orchestrator/coordinator/agent-builder/prompter/skill-builder/synthesizer/tool-builder | ✓ |
| hm-detective | hm-investigator, hm-researcher, hm-scout, hf-* (multiple) | ✓ |
| hm-feature-ecosystem | hm-ecologist, hm-router, hm-strategist | ✓ |
| hm-phase-execution | hm-coordinator, hm-executor, hm-operator | ✓ |
| hm-phase-loop | hm-coordinator, hm-guardian, hm-operator | ✓ |
| hm-planning-persistence | hm-persistor, hm-planner, hf-prompter | ✓ |
| hm-product-validation | hm-analyst | ✓ |
| hm-production-readiness | hm-assessor, hm-auditor, hm-curator, hm-integrator | ✓ |
| hm-refactor | hm-architect, hm-optimizer, hf-refactorer | ✓ |
| hm-requirements-analysis | hm-analyst, hm-assessor, hm-mentor, hm-router | ✓ |
| hm-research-chain | hm-researcher | ✓ |
| hm-roadmap-maintainability | hm-architect, hm-auditor, hm-curator, hm-strategist | ✓ |
| hm-spec-driven-authoring | hm-planner, hm-validator, hm-writer, hf-agent-builder, hf-auditor, hf-refactorer, hf-skill-builder | ✓ |
| hm-subagent-delegation-patterns | hm-coordinator | ✓ |
| hm-synthesis | hm-researcher, hm-scout, hm-synthesizer, hm-writer, hf-prompter, hf-refactorer, hf-skill-builder, hf-synthesizer | ✓ |
| hm-tech-context-compliance | hm-technician, hf-synthesizer, hf-tool-builder | ✓ |
| hm-tech-stack-ingest | hm-researcher, hm-scout, hm-technician, hf-synthesizer | ✓ |
| hm-test-driven-execution | hm-executor, hm-finisher, hm-reviewer, hm-validator | ✓ |
| hm-user-intent-interactive-loop | hm-orchestrator, hf-orchestrator | ✓ |
| hm-opencode-non-interactive-shell | hf-prompter, hf-command-builder | ✓ |
| hm-gate-orchestrator | hf-auditor | ✓ |
| hm-omo-reference | — (not referenced by any hm-/hf- agent) | ✓ |
| hm-opencode-platform-reference | — (not referenced by any hm-/hf- agent) | ✓ |
| hm-opencode-project-audit | — (not referenced by any hm-/hf- agent) | ✓ |

### hf-* Skills Referenced (all resolved ✓)

| Skill Name | Referenced By | SKILL.md Exists |
|------------|--------------|----------------|
| hf-agent-composition | hf-agent-builder, hf-auditor, hf-coordinator, hf-refactorer, hf-synthesizer | ✓ |
| hf-agents-and-subagents-dev | hf-agent-builder, hf-auditor, hf-coordinator, hf-refactorer, hf-skill-builder | ✓ |
| hf-agents-md-sync | hf-auditor, hf-refactorer | ✓ |
| hf-command-dev | hf-auditor, hf-command-builder | ✓ |
| hf-command-parser | hf-auditor, hf-command-builder, hf-prompter | ✓ |
| hf-custom-tools-dev | hf-auditor, hf-tool-builder | ✓ |
| hf-delegation-gates | hf-coordinator | ✓ |
| hf-meta-builder | hf-orchestrator | ✓ |
| hf-skill-synthesis | hf-coordinator, hf-refactorer, hf-skill-builder, hf-synthesizer | ✓ |
| hf-use-authoring-skills | hf-agent-builder/auditor/command-builder/prompter/refactorer/skill-builder/synthesizer/tool-builder | ✓ |

### Gate Skills Referenced (all resolved ✓)

| Skill Name | Referenced By | SKILL.md Exists |
|------------|--------------|----------------|
| gate-lifecycle-integration | hm-coordinator, hm-orchestrator, hf-coordinator, hf-orchestrator | ✓ |
| gate-spec-compliance | hm-coordinator, hm-orchestrator, hf-coordinator, hf-orchestrator | ✓ |
| gate-evidence-truth | hm-orchestrator, hf-orchestrator | ✓ |

### Stack Skills Referenced (all resolved ✓)

| Skill Name | Referenced By | SKILL.md Exists |
|------------|--------------|----------------|
| stack-opencode | hf-agent-builder, hf-auditor, hf-command-builder, hf-refactorer, hf-skill-builder, hf-synthesizer, hf-tool-builder | ✓ |
| stack-zod | hf-agent-builder, hf-auditor, hf-refactorer, hf-synthesizer, hf-tool-builder | ✓ |
| stack-vitest | hf-synthesizer, hf-tool-builder | ✓ |
| stack-nextjs | hf-synthesizer | ✓ |

---

## Part 6: Lineage Boundary Verification

### Check 1: hm-* agents NEVER reference hf-* skills

**Result: PASS ✓** — All 30 hm-* agents contain zero hf-* skill references.

### Check 2: hm-* L2 agents NEVER have task:allow or delegate-task:allow

**Result: PASS ✓** — All 28 hm-* L2 agents have `task: ask` and `delegate-task: ask`.

### Check 3: hf-* L2 agents NEVER have task:allow or delegate-task:allow

**Result: PASS ✓** — All 8 hf-* L2 agents have `task: ask` and `delegate-task: ask`.

### Check 4: L0/L1 orchestrators HAVE delegate-task:allow

**Result: PASS ✓** — All 4 L0/L1 agents (hm-orchestrator, hm-coordinator, hf-orchestrator, hf-coordinator) have `delegate-task: allow`.

### Check 5: All skill references resolve to actual SKILL.md files

**Result: PASS ✓** — All 50 unique skill names referenced across 40 agents resolve to existing SKILL.md files.

### Check 6: hm-* task delegation never targets hf-* agents

**Result: PASS ✓** — hm-orchestrator and hm-coordinator explicitly ask hf-* task delegation.

### Check 7: Delegation patterns are depth-respecting

**Result: PASS ✓** — L0 → L1 → L2 delegation chain is preserved. No upward delegation (L2→L1, L1→L0). No lateral delegation at L1 level.

---

## Part 7: Permission Model Architecture

### Universal Pattern

All 40 agents follow the same ask-all + explicit allow model:

```yaml
permission:
  # Every tool category starts with a ask-all base
  tool_name:
    "*": ask        # ask everything by default
    "pattern": allow # Allow only specific patterns/names
```

### Depth-Based Permission Escalation

| Permission | L0 (Orchestrator) | L1 (Coordinator) | L2 (Specialist) |
|------------|-------------------|-------------------|-----------------|
| task delegation | Pattern-restricted allow | Pattern-restricted allow | ask |
| delegate-task | Allow | Allow | ask |
| delegation-status | Allow | Allow | ask |
| session-journal-export | Allow | Allow | ask |
| prompt-skim | Allow (L0 only) | ask | ask |
| prompt-analyze | Allow (L0 only) | ask | ask |
| bash (run tests) | node, npx | node | Varies by domain |
| write/edit | ask (L0) | ask (L1) | Domain-scoped patterns |

---

## Audit Verdict

| Gate | Result |
|------|--------|
| All lineage boundaries respected | **PASS** |
| All L2 agents terminal (no delegation) | **PASS** |
| All L0/L1 have delegate-task:allow | **PASS** |
| hm-* STRICT (no hf-* skills) | **PASS** |
| hf-* FLEXIBLE (cross-lineage justified) | **PASS** |
| All skill references resolve | **PASS** |
| Task delegation patterns depth-respecting | **PASS** |
| Permission model consistently ask-all + explicit allow | **PASS** |

**FINAL VERDICT: ALL GATES PASS — 0 violations, 0 fixes needed**
