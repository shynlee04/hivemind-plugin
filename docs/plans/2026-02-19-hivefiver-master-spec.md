# HiveFiver v1 Master Spec

Date: 2026-02-19
Status: Active
Scope: Layered assets (commands, skills, agents, workflows, templates, docs)

## Mission
HiveFiver is the meta builder and instructor layer for HiveMind. It handles two extreme user patterns:
1. Vibecoder (low technical background, high app ambition)
2. Enterprise messy-intent engineer (large, mixed, high-risk requirement dumps)

HiveFiver also supports cross-domain delivery beyond software engineering:
- marketing workflows
- finance/reporting workflows
- office operations and documentation workflows

## Guarantees
HiveFiver provides a process guarantee only when all gates pass:
- context integrity
- evidence completeness
- lineage and traceability
- export schema validity

HiveFiver does not promise unconditional build outcomes.

## Architecture
- Canonical assets live in root: `commands/`, `skills/`, `agents/`, `workflows/`, `templates/`, `references/`.
- `.opencode/*` is synchronized output via `sync-assets`.
- Runtime plugin APIs remain unchanged in v1.

## Persona State Machine
Idea -> Intake -> SpecForge -> Research -> SkillForge -> Bridge (GSD/Ralph) -> Verification

Lane switch rules:
- Vibecoder lane: guided tutoring and hidden guardrails.
- Enterprise lane: strict ambiguity and evidence handling.

All lanes are MCQ-first and gate-driven before free-form execution.

## MCP Strategy
Providers: Context7, DeepWiki, Tavily, Repomix, Exa.

Fallback policy:
- continue with available providers
- degrade confidence to `partial` or `low`
- emit TODO setup instructions

Research loops must maintain contradiction registers and provider readiness states.

## Context Shaping Policy
Based on DeepWiki SDK findings:
- use transformed message/system context to preserve output style with stricter guidance,
- use silent context injection when needed for continuity,
- keep TODO tracking explicit for unresolved items before handoff.

## Tasking and Export Policy
- TODO/task state must be convertible into flat-root `tasks/prd.json`.
- Exports must preserve lineage from source task IDs to user stories.
- Schema anti-patterns block release.

## Deliverables
- 8 HiveFiver command contracts
- 7 HiveFiver skill packages
- 1 HiveFiver primary agent and workflow suite
- MCP setup playbooks (EN/VI friendly)
- GSD and Ralph compatibility mappings
- Source-level helpers for lifecycle and Ralph export determinism

## External References
- GSD: https://github.com/gsd-build/get-shit-done/tree/main/commands/gsd
- BMAD Builder: https://github.com/bmad-code-org/bmad-builder
- BMAD Method: https://github.com/bmad-code-org/BMAD-METHOD
- BMAD Creative Suite: https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite
- Repomix: https://github.com/yamadashy/repomix
- Repomix Guide: https://repomix.com/guide/
- Context7: https://context7.com/
- DeepWiki: https://deepwiki.com/
- Tavily Docs: https://docs.tavily.com/
- Exa Docs: https://docs.exa.ai/
- Skill.sh: https://skill.sh/
