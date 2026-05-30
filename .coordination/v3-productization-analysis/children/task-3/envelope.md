## Task
Inspect Hivefiver meta-builder lab assets and determine which agents, commands, skills, workflows, references, and reusable patterns already support guided setup/config generation versus what meta-concepts are missing.

## Scope
- Include: .hivefiver-meta-builder/AGENTS.md; .hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md; .hivefiver-meta-builder/agents-lab/**; .hivefiver-meta-builder/commands-lab/**; .hivefiver-meta-builder/skills-lab/**; .hivefiver-meta-builder/workflows-lab/**; .hivefiver-meta-builder/references-lab/**
- Exclude: src/** runtime implementation except when a lab asset references it directly

## Context
We need a Hivefiver readiness package for public-facing productization work. The focus is what can be reused now versus what must be authored: agents, commands, skills, workflows, references, and schema/tests/contracts for config generation.

## Expected Output
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- Inventory of reusable meta-builder assets relevant to guided setup/config productization
- Gap list of missing meta-concepts needed to make this real
- Suggested likely lab locations and reasons

## Verification
- Ground every reuse/gap claim in actual files under the included lab directories
- Distinguish clearly between already-present artifacts and inferred future needs
