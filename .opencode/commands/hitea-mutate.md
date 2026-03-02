---
name: hitea-mutate
description: "Mutation testing with Stryker — inject bugs, test your tests, improve mutation score. Use: '/hitea-mutate <files>' to run mutation testing on specific files."
agent: hitea
allowed-tools:
  - read
  - glob
  - grep
  - skill
  - todoread
  - todowrite
  - bash
  - edit
---

<enforcement>
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`
</enforcement>

<objective>
Run mutation testing to evaluate test quality and identify weak spots in test coverage.
</objective>

<context>
User input: $ARGUMENTS

Skill: hitea-mutation-testing

Mutation testing tests your **tests** by injecting bugs and checking if tests catch them.
- **Killed**: Test detected the mutant (good)
- **Survived**: Test didn't detect mutant (bad — fix tests)
- **Mutation Score**: Killed / Total (target: >= 80%)
</context>

<process>
Step 1: Load the hitea-mutation-testing skill.

Step 2: Check if Stryker is configured:
- Look for `stryker.conf.mjs` or `stryker.conf.json`
- If not found, generate configuration

Step 3: Run mutation testing:
```bash
npx stryker run --mutate $ARGUMENTS
```

Step 4: Analyze results:
- Identify survived mutants
- Categorize by mutator type
- Prioritize by severity

Step 5: Generate test improvements:
For each survived mutant:
```javascript
// Survived mutant: age >= 18 → age > 18
// Fix: Add explicit boundary test
test('allows exactly 18 years old', () => {
  expect(canVote(18)).toBe(true);
});
```

Step 6: Report findings:
- Mutation score
- Survived mutants list
- Suggested test improvements
- Priority order
</process>

<output_contract>
Return:
- mutation_score: percentage (0-100)
- mutants_killed: count
- mutants_survived: count with details
- mutants_timeout: count
- test_improvements: list of suggested tests to add
- priority_order: which mutants to fix first
</output_contract>

<offer_next>
- If mutation score >= 80% → `/hitea-arena` for adversarial verification
- If mutation score < 80% → Apply test improvements and re-run
- If many timeouts → Optimize test performance
</offer_next>
