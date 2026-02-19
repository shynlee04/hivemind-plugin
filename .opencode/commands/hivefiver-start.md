---
name: "hivefiver-start"
description: "Bootstrap HiveFiver with strict governance: detect greenfield/brownfield, regulate codebase posture, route persona/domain, and lock execution gates."
---

# HiveFiver Start

Run this before any HiveFiver workflow.

## Core Promise
- Always guide users with controlled, multiple-choice onboarding.
- Support both extremes: `vibecoder` and `enterprise-messy`.
- Never continue without a connected lifecycle graph.

## Step 0: Mandatory Governance Load
```ts
scan_hierarchy({ action: "analyze", json: true })
recall_mems({ query: "hivefiver onboarding decisions" })
save_anchor({ mode: "list" })
```

## Step 1: Codebase Regulation Pass
Classify environment and lock regulation mode.

1. Detect project type:
- `greenfield`: no meaningful production code yet.
- `brownfield`: existing app/services, tests, or active runtime.

2. Detect operational strictness:
- `assisted`: tutorial-forward, hidden guardrails.
- `strict`: hard evidence gates and anti-drift checks.

3. Enforce startup controls:
- No implementation before intake and specforge.
- No research confidence above `partial` if MCP stack is incomplete.
- No execution handoff until plan graph lineage is connected.

## Step 2: Persona + Domain Routing (MCQ-first)
Use controlled intake prompts (no free-form drift) for these dimensions:
- Persona: `vibecoder` / `enterprise`
- Domain: `dev`, `marketing`, `finance`, `office-ops`, `hybrid`
- Delivery target: `prototype`, `internal-tool`, `saas`, `enterprise-rollout`
- Language: `en`, `vi`, `bilingual`

## Step 3: Workflow Lane Selection
- `vibecoder` -> `/hivefiver-intake` (guided tutoring, hidden TDD scaffolding)
- `enterprise` -> `/hivefiver-intake` (strict distillation + ambiguity blockade)

## Step 4: Lifecycle Lock
```ts
declare_intent({ mode: "plan_driven", focus: "HiveFiver governed onboarding" })
map_context({ level: "tactic", content: "Persona, domain, and governance lock" })
```

## Output Contract
Return:
1. `persona_lane`: `vibecoder` | `enterprise`
2. `project_type`: `greenfield` | `brownfield`
3. `domain_lane`: `dev` | `marketing` | `finance` | `office-ops` | `hybrid`
4. `governance_mode`: `assisted` | `strict`
5. `framework_mode`: `gsd` | `spec-kit` | `both` | `none`
6. `required_gates`: ordered list of gates that must pass
7. `next_command`: `/hivefiver-intake`
8. `artifact_path`: `docs/plans/<date>-hivefiver-onboarding-start.md`
