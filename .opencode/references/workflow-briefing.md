# **Workflow Diagrams**

## **Full Project Lifecycle - Greenfield**

```markdown
  ┌──────────────────────────────────────────────────┐
  │                   NEW PROJECT                    │
  │  /gsd:new-project                                │
  │  Questions -> Research -> Requirements -> Roadmap│
  └─────────────────────────┬────────────────────────┘
                            │
             ┌──────────────▼─────────────┐
             │      FOR EACH PHASE:       │
             │                            │
             │  ┌────────────────────┐    │
             │  │ /gsd:discuss-phase │    │  <- Lock in preferences
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:plan-phase    │    │  <- Research + Plan + Verify
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:execute-phase │    │  <- Parallel execution
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /gsd:verify-work   │    │  <- Manual UAT
             │  └──────────┬─────────┘    │
             │             │              │
             │     Next Phase?────────────┘
             │             │ No
             └─────────────┼──────────────┘
                            │
            ┌───────────────▼──────────────┐
            │  /gsd:audit-milestone        │
            │  /gsd:complete-milestone     │
            └───────────────┬──────────────┘
                            │
                   Another milestone?
                       │          │
                      Yes         No -> Done!
                       │
               ┌───────▼──────────────┐
               │  /gsd:new-milestone  │
               └──────────────────────┘
```

## Compositions of a phase (take example of greenfield → level-4 complexity project) → full-scale phase with validation and research → you can expect these compositions

- research BMAD for more definition of 4-level of complexity https://github.com/bmad-code-org/BMAD-METHOD/blob/d43663e3af76ff4a0b635b938195446fb3ab8663/src/bmm/workflows/2-plan-workflows/create-prd/data/domain-complexity.csv#L4 ;  https://github.com/bmad-code-org/BMAD-METHOD/blob/d43663e3af76ff4a0b635b938195446fb3ab8663/src/bmm/workflows/3-solutioning/create-architecture/data/domain-complexity.csv#L4

```markdown
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE EXECUTION                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WAVE 1 (parallel)          WAVE 2 (parallel)          WAVE 3       │
│  ┌─────────┐ ┌─────────┐    ┌─────────┐ ┌─────────┐    ┌─────────┐ │
│  │ Plan 01 │ │ Plan 02 │ →  │ Plan 03 │ │ Plan 04 │ →  │ Plan 05 │ │
│  │         │ │         │    │         │ │         │    │         │ │
│  │ User    │ │ Product │    │ Orders  │ │ Cart    │    │ Checkout│ │
│  │ Model   │ │ Model   │    │ API     │ │ API     │    │ UI      │ │
│  └─────────┘ └─────────┘    └─────────┘ └─────────┘    └─────────┘ │
│       │           │              ↑           ↑              ↑       │
│       └───────────┴──────────────┴───────────┘              │       │
│              Dependencies: Plan 03 needs Plan 01            │       │
│                          Plan 04 needs Plan 02              │       │
│                          Plan 05 needs Plans 03 + 04        │       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## From Project → Phase → Phase Discussions → Research (if needed)→ Synthesis  → Context gathering + phase-planning → → Plan Validation + TDD → Phase Execution with atomic phase-plans (following the graph) + Validation + Integration  gatekeeping, making sure test incrementally passed → Strict review to detect gaps/drifts → gaps Planning → Repeat iterative loops → Update/Audit milestone

The above is a very brief and abstract flow of how this should be executed as a frameworks - obviously there must a comprehensive sets of `concepts` (agents, commands, scripts, references, workflows, tools, libs, automation, guardrails, robust hierarchy and relationships) please learn from the two frameworks

```markdown
### OpenCode Git Repo https://github.com/anomalyco/opencode

to lessen the confusions when having to both acts as a framework and wrapping others with intricate path finding, document formats and packages updates etc → I decide to invent us own an amplified spec-driven framework → the framework is inspired, enhanced, modified, combined by the `GSD` and `BMAD` → Please use repomix mcp to download these as full pack for investigating + ingesting + selectively synthesize (without having to every time access them online) - **I PROHIBIT EXACT COPY/PLAGIARIZE THESE WORKS - I NEED YOU TO SERIOUSLY MAKE THE KNOWLEDGE INGESTED AND SYNTHESIZED TO FIT OUR PHILOSOPHY**

1. GSD: https://github.com/gsd-build/get-shit-done/
2. BMAD - DOWNLOAD ALL THESE MODULES
    1. BMad Method (BMM)	Core framework with 34+ workflows - https://github.com/bmad-code-org/BMAD-METHOD
    2. BMad Builder (BMB)	Create custom BMad agents and workflows (to build custom agents, workflows, commands etc) - https://github.com/bmad-code-org/bmad-builder
    3. Game Dev Studio (BMGD)	Game development workflows (Unity, Unreal, Godot) (POST MVP) - https://github.com/bmad-code-org/bmad-module-game-dev-studio
    4. Creative Intelligence Suite (CIS)	Innovation, brainstorming, design thinking (SOME Brainstorming, and Problem solving modules can be very helpful) - https://github.com/bmad-code-org/bmad-module-creative-intelligence-suite
```