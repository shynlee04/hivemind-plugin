# HiveFiver Phase 8 - Robustness and Fine-Tuning

## Objective
Strengthen HiveFiver for extreme users and broader domains while keeping strict governance and export determinism.

## Completed Upgrades
1. MCP stack became operationally explicit (readiness states, credentials, fallback TODOs).
2. Startup/onboarding now enforces MCQ-first regulation and persona/domain routing.
3. Research flow now includes contradiction register + confidence discipline.
4. Ralph bridge now requires TODO-to-story node mapping and deeper schema checks.
5. Skill auditing now includes non-dev inclusivity lanes and external catalog strategy.
6. Bilingual tutoring and spec distillation now include richer templates and domain-aware terms.
7. Init flow now seeds HiveFiver onboarding TODOs and runs integration audit checks.
8. Auto-realignment now handles missing/invalid user commands and routes through command+skill fallback.

## Modified Source Files Included
- `src/schemas/graph-nodes.ts`
- `src/lib/graph-io.ts`
- `src/schemas/manifest.ts`
- `src/hooks/event-handler.ts`
- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `src/lib/session-governance.ts`
- `src/lib/onboarding.ts`
- `src/schemas/config.ts`
- `src/cli/init.ts`
- `src/cli/sync-assets.ts`
- `src/lib/hivefiver-integration.ts`

## New Source-Level Contracts
- Flat-root Ralph PRD shape validator and anti-pattern detection.
- Task-manifest to Ralph userStories snapshot generation with deterministic fields.

## External Reference Links Embedded in Artifacts
- GSD command model: https://github.com/gsd-build/get-shit-done/tree/main/commands/gsd
- BMAD builder: https://github.com/bmad-code-org/bmad-builder
- BMAD method: https://github.com/bmad-code-org/BMAD-METHOD
- BMAD creative suite: https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite
- Repomix: https://github.com/yamadashy/repomix
- Repomix guide: https://repomix.com/guide/
- DeepWiki: https://deepwiki.com/
- Context7: https://context7.com/
- Tavily docs: https://docs.tavily.com/
- Exa docs: https://docs.exa.ai/
- Skill catalog reference: https://skill.sh/

## Next Hardening Target
- Optional plugin-level automation for message/system transform and noReply orchestration based on DeepWiki SDK findings.
