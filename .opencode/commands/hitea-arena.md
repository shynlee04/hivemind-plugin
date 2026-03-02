---
name: hitea-arena
description: "Actor-Critic Arena — Builder vs Adversary battle until code is proven. The Holy Grail of testing. Use: '/hitea-arena <invariants.yaml>' to run adversarial verification."
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
  - task
---

<enforcement>
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`
</enforcement>

<objective>
Run the Actor-Critic Arena: adversarial verification where Builder and Adversary agents battle until invariants are mathematically proven.
</objective>

<context>
User input: $ARGUMENTS

Skill: hitea-adversarial-arena

The Actor-Critic Arena is the ultimate testing paradigm:
1. Human defines **Invariants** (laws of physics)
2. **Builder Agent** writes code to satisfy laws
3. **Adversary Agent** tries to destroy Builder's work
4. Loop until Adversary exhausts all attack vectors

This is NOT example-based testing — this is mathematical proof by exhaustion.
</context>

<process>
Step 1: Load the hitea-adversarial-arena skill.

Step 2: Load or generate invariants:
- If user provided `invariants.yaml`, load it
- Otherwise, extract invariants from code comments or specification

Step 3: Initialize the Arena:
```javascript
const arena = new AdversarialArena({
  invariants: loadInvariants('./invariants.yaml'),
  maxRounds: 100,
  exhaustionThreshold: 0.95,
});
```

Step 4: Run the Battle Loop:
```
Round 1: Builder generates implementation → Adversary attacks → Judge evaluates
Round 2: Builder patches vulnerabilities → Adversary finds new attacks
...
Round N: Adversary exhausted → Code is PROVEN
```

Step 5: Track:
- Violations found and patched
- Attack strategies exhausted
- Residual risk (attack vectors not explored)

Step 6: Produce Final Verdict:
- Status: PROVEN / INCONCLUSIVE
- Confidence score
- Invariants verified
- Residual risk assessment
</process>

<output_contract>
Return:
- status: PROVEN | INCONCLUSIVE | FAILED
- rounds_completed: number
- invariants_verified: list with status
- attacks_attempted: total count
- attacks_successful: count (lower is better)
- exhaustion_score: 0-1 (higher is better)
- confidence_score: 0-1
- residual_risk: description of unexplored attack vectors
- final_implementation: code that survived the arena
</output_contract>

<offer_next>
- If status === PROVEN → Code is ready for deployment
- If status === INCONCLUSIVE → Increase maxRounds or add more attack strategies
- If status === FAILED → Review invariant violations and fix
</offer_next>
