---
name: hitea-fuzz
description: "Property-based testing with fast-check — define invariants, generate thousands of random inputs, find edge cases automatically. Use: '/hitea-fuzz <module>' to generate property tests."
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
Generate property-based tests using fast-check for the specified module or function.
</objective>

<context>
User input: $ARGUMENTS

Skill: hitea-property-testing

Property-based testing defines **invariants** that must hold for ALL inputs, then generates thousands of random test cases to find violations.
</context>

<process>
Step 1: Load the hitea-property-testing skill.

Step 2: Analyze the target module:
- Identify pure functions (good candidates for property tests)
- Identify mathematical properties (commutativity, associativity, identity)
- Identify business rules (invariants, constraints)
- Identify data transformations (round-trip, idempotency)

Step 3: Identify invariants:
- Mathematical invariants (e.g., `add(a, b) === add(b, a)`)
- Business invariants (e.g., `balance >= 0` always)
- Data invariants (e.g., `decode(encode(x)) === x`)

Step 4: Generate property tests:
```javascript
import fc from 'fast-check';

describe('Property Tests: [module]', () => {
  it('should satisfy [invariant name]', () => {
    fc.assert(
      fc.property(
        // Arbitraries for inputs
        fc.integer(),
        // Predicate (invariant)
        (input) => {
          // Test the invariant
          return true; // Replace with actual invariant check
        }
      ),
      { numRuns: 1000 }
    );
  });
});
```

Step 5: Run the tests and capture:
- Shrinking results (minimal failing case)
- Coverage of input space
- Edge cases discovered

Step 6: Report findings:
- Invariants defined
- Tests generated
- Issues found
- Recommendations
</process>

<output_contract>
Return:
- invariants_identified: list of invariants found in code
- tests_generated: list of property test files created
- test_results: pass/fail for each property
- edge_cases_found: any edge cases discovered
- coverage_score: estimated input space coverage
- next_steps: recommendations for improvement
</output_contract>

<offer_next>
- If property tests pass → `/hitea-mutate` for mutation testing
- If edge cases found → Fix implementation and re-run
- If coverage low → Add more arbitraries or invariants
</offer_next>
