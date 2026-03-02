---
name: hitea
description: "AI-driven testing infrastructure — Actor-Critic Arena, Property-Based Testing, Mutation Testing, Chaos Engineering, VLM-driven E2E. Use: '/hitea' for interactive mode, '/hitea init' to bootstrap, '/hitea verify' to run full suite."
agent: hitea
allowed-tools:
  - read
  - glob
  - grep
  - skill
  - todoread
  - todowrite
  - webfetch
  - websearch
  - task
  - bash
---

<enforcement>
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh .`

Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh start .`
</enforcement>

<objective>
Route testing infrastructure requests to the appropriate paradigm and coordinate testing workflows.
</objective>

<context>
User input: $ARGUMENTS

Available testing paradigms:
- **Property Testing** (`/hitea-fuzz`): fast-check, invariants, arbitraries
- **Mutation Testing** (`/hitea-mutate`): Stryker, test quality, mutants
- **Visual Regression** (`/hitea-visual`): VLM-driven E2E, self-healing
- **Chaos Engineering** (`/hitea-chaos`): fault injection, resilience
- **Actor-Critic Arena** (`/hitea-arena`): adversarial verification

Skills loaded:
- hitea-property-testing
- hitea-mutation-testing
- hitea-adversarial-arena
</context>

<process>
Step 1: Classify the testing paradigm needed.
- If user mentions "fuzz", "property", "invariant" → `/hitea-fuzz`
- If user mentions "mutation", "test quality", "stryker" → `/hitea-mutate`
- If user mentions "visual", "e2e", "playwright" → `/hitea-visual`
- If user mentions "chaos", "resilience", "fault injection" → `/hitea-chaos`
- If user mentions "adversarial", "arena", "builder adversary" → `/hitea-arena`
- If user mentions "init", "setup", "bootstrap" → Initialize testing infrastructure
- If user mentions "verify", "full suite", "all tests" → Run comprehensive verification

Step 2: Load the appropriate skill for the paradigm.

Step 3: Execute the testing workflow with evidence collection.

Step 4: Produce verdict with:
- Tests generated/modified
- Coverage metrics
- Issues found
- Recommendations

Step 5: Offer next action based on results.
</process>

<output_contract>
Return:
- paradigm_used: which testing paradigm was applied
- tests_generated: list of test files created/modified
- coverage_metrics: line/branch/mutation coverage if applicable
- issues_found: list of failing tests or violations
- recommendations: next steps for improvement
- next_command: suggested next hitea command
</output_contract>

<guided_interaction>
At every step, announce:
1. **What I'm doing**: "Analyzing testing needs for [module]..."
2. **Progress**: "✅ Paradigm selected | ⏳ Generating tests | ⬚ Pending verification"
3. **What comes next**: "After tests pass, run mutation testing to verify quality."
</guided_interaction>

<offer_next>
Based on the results:
- If property tests pass → Suggest `/hitea-mutate` for mutation testing
- If mutation score < 80% → Suggest improving tests for survived mutants
- If all tests pass → Suggest `/hitea-arena` for adversarial verification
- If arena exhausted → Suggest deployment with proven code
</offer_next>
