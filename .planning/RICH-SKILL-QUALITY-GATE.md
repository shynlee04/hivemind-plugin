# Rich Skill Quality Gate

**Created:** 2026-04-25  
**Status:** ACTIVE — supersedes any Phase 27 PASS/PARTIAL language that did not evaluate this gate.  
**Applies to:** every `hm-*` skill and every `hivefiver-*` skill that provides how-to-implement behavior, specialist behavior, or end-user-project-development lineage.

## Rich Skill Classification Rule

Classify a skill as a **RICH SKILL** when any of these are true:

1. It tells an agent how to implement, execute, debug, refactor, research, plan, validate, configure, inspect, or compose work.
2. It behaves as a specialist capability for a domain, toolchain, project workflow, or meta-concept.
3. It is intended for use inside arbitrary end-user OpenCode projects under the HiveMind harness.

Default stance: all current `hm-*` skills are RICH unless a future audit proves the package is a pure static reference with no workflow behavior. Reference-heavy packages still require the independence and bundled-resource portions of this gate.

## RICH Gate Requirements

The D1-D8 score from `26-PLAYBOOK.md` is no longer sufficient for RICH SKILL completion. A RICH SKILL must pass D1-D8 **and** this added gate:

| Gate | Requirement | PASS Evidence | FAIL Condition |
|------|-------------|---------------|----------------|
| RICH-1 | Third-party synthesis | Evidence that `npx skills find` / skills.sh / GitHub search selected the top 3 relevant third-party skills or repositories for the exact skill domain, then reviewed SKILL.md plus bundled assets/references/examples/templates/workflows/scripts. | Search result names only; no repo crawl; no evidence of bundled files reviewed. |
| RICH-2 | Transform-improve-adopt decision | Documented Pattern 1, Pattern 2, and/or Pattern 3 alternatives, with an explicit decision about what to adopt, reject, or defer. | One copied pattern, one generic recommendation, or no decision record. |
| RICH-3 | Horizontal integration | Domain/ecosystem map showing adjacent skills, agents, commands, tools, hooks, runtime state, and external ecosystems that affect the skill. | Skill is evaluated in isolation. |
| RICH-4 | Routing integration | Explicit routing across how-to-process and hierarchy skill groups, including when the skill should hand off or refuse work. | No sibling/parent/child workflow routing. |
| RICH-5 | Professional bundled resources | Non-generic assets/references/samples/guidelines/templates/metrics/workflows/scripts that are tied to the skill's domain and are not placeholder AI slop. | Empty/no resources, generic checklist-only resources, or resources with no load instructions. |
| RICH-6 | Independence audit | Proof the skill can run in end-user OpenCode projects without depending on GSD, BMAD, OMO, Spec-kit, or this repository's local paths/state. | Local-only paths or assumed project frameworks without adapter notes. |
| RICH-7 | Gap documentation | Missing skills, meta concepts, agents/subagents/workflows/commands/CLI/tools, and hard-harness plugins/OpenCode SDK engines are documented without interrupting the user. | Unknown gaps hidden behind PASS wording. |
| RICH-8 | Scoring integration | `skill-judge` report includes D1-D8 plus this RICH gate; any missing third-party-source evidence or bundled-resource evidence fails the RICH gate. | D1-D8-only report claims PASS. |

## Required Evidence Packet

Each RICH SKILL evidence record must include:

```yaml
skill: hm-example
rich_classification: RICH
third_party_sources:
  - source: owner/repo@skill-or-repo
    discovery_method: "npx skills find ... | skills.sh | GitHub search"
    reviewed_materials: [SKILL.md, references, assets, scripts, examples, templates, metrics, workflows]
    adoption_decision: adopt | adapt | reject | defer
    evidence_path_or_url: "..."
pattern_alternatives:
  pattern_1: "..."
  pattern_2: "..."
  pattern_3: "..."
horizontal_integration:
  adjacent_skills: []
  agents: []
  commands: []
  tools: []
  hooks: []
  runtime_state: []
bundled_resources:
  references: []
  assets: []
  examples: []
  templates: []
  scripts: []
  metrics: []
  workflows: []
independence_audit:
  opencode_project_ready: PASS | FAIL | BLOCKED
  local_only_assumptions: []
gap_documentation:
  missing_skills: []
  missing_meta_concepts: []
  missing_hard_harness_tools: []
score:
  D1: PASS | FAIL | BLOCKED
  D2: PASS | FAIL | BLOCKED
  D3: PASS | FAIL | BLOCKED
  D4: PASS | FAIL | BLOCKED
  D5: PASS | FAIL | BLOCKED
  D6: PASS | FAIL | BLOCKED
  D7: PASS | FAIL | BLOCKED
  D8: PASS | FAIL | BLOCKED
  RICH: PASS | FAIL | BLOCKED
exit_decision: PASS | FAIL | BLOCKED
```

## Current External Discovery Evidence

This is discovery evidence only, not completion evidence. It proves the runtime can reach skills.sh/GitHub sources, but it does **not** satisfy RICH-1 until the selected repositories are crawled and their bundled resources are reviewed.

| Domain | Discovery command/source | Top evidence captured |
|--------|--------------------------|-----------------------|
| Skill package standards | `officialskills.sh/about`, `anthropics/skills`, `vercel-labs/skills`, `VoltAgent/awesome-agent-skills` | Skills are self-contained packages with `SKILL.md`; skills.sh indexes public repos; officialskills.sh prioritizes maintained/reputable sources; `npx skills find` is the discovery mechanism. |
| General advanced skill packages | `npx --yes skills find "agent skills skill package references scripts assets"` | `alirezarezvani/claude-skills@engineering-advanced-skills`, `forcedotcom/afv-library@developing-agentforce`, `webmaxru/agent-skills@agent-package-manager`. |
| Test-driven execution | `npx --yes skills find "test driven development agent skill"` | `addyosmani/agent-skills@test-driven-development`, `bobmatnyc/claude-mpm-skills@test-driven-development`, `izyanrajwani/agent-skills-library@test-driven-development`. |
| Research lineage | `npx --yes skills find "deep research agent skill"` | `parallel-web/parallel-agent-skills@parallel-deep-research`, `skills.volces.com@deep-research`, `qodex-ai/ai-agent-skills@deep-research-agent`. |
| Execution/refactor/debug lineage | `npx --yes skills find "debugging refactoring execution planning agent skill"` | `github/awesome-copilot@refactor-plan`, `dimillian/skills@orchestrate-batch-refactor`, `first-fluke/oh-my-ag@debug-agent`. |
| Guardrail/delegation lineage | `npx --yes skills find "subagent delegation loop completion guardrail skill"` | `practicalswan/agent-skills@subagent-delegation`, `winsorllc/upgraded-carnival@delegate-task`, `zpankz/mcp-skillset@delegate-router`; search quality is weak and needs follow-up. |
| OpenCode/meta lineage | `npx --yes skills find "opencode command agent skill"` | `s-hiraoku/synapse-a2a@opencode-expert`, `sundial-org/awesome-openclaw-skills@opencode-controller`, `smithery.ai@opencode-expert`. |

## Enforcement Rule

Any RICH SKILL that lacks third-party-source evidence **and** bundled-resource evidence is `FAIL` for RICH, even if D1-D8 are otherwise strong. Completion reports must say `BLOCKED` or `FAIL`, never `PASS`, until the RICH evidence packet is complete.
