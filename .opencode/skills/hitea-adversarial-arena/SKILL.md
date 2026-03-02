# Skill: hitea-adversarial-arena

# Actor-Critic Arena: Adversarial Invariant Verification

Use when building the ultimate testing paradigm — adversarial verification where AI agents battle until code is mathematically proven. Triggers on: 'actor-critic', 'adversarial testing', 'builder adversary', 'invariant verification', 'proof by exhaustion'.

## The Holy Grail of Testing

In the true end-game, humans stop writing tests. Your only job is to define **Invariants** (Laws of Physics). AI agents battle in a loop:

1. **Human**: Define Invariants
2. **Builder Agent**: Writes code to satisfy laws
3. **Adversary Agent**: Tries to destroy Builder's work
4. **Loop**: Until Adversary exhausts all attack vectors

```
┌─────────────────────────────────────────────────────────┐
│                    ACTOR-CRITIC ARENA                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────┐    Attack     ┌────────────┐             │
│   │  BUILDER │ ◄───────────── │ ADVERSARY  │             │
│   │  Agent   │ ────────────► │   Agent    │             │
│   └────┬─────┘   Defense     └─────┬──────┘             │
│        │                           │                     │
│        │                           │                     │
│        ▼                           ▼                     │
│   ┌─────────────────────────────────────┐               │
│   │           INVARIANT JUDGE            │               │
│   │   "Does this satisfy the laws?"      │               │
│   └─────────────────────────────────────┘               │
│                    │                                     │
│                    ▼                                     │
│         ┌─────────────────────┐                         │
│         │    EXHAUSTION?      │                         │
│         │  (No more attacks?) │                         │
│         └─────────┬───────────┘                         │
│                   │                                      │
│           YES     │     NO                               │
│           ▼       │     ▼                               │
│      ┌────────┐   │  ┌─────────┐                        │
│      │ DONE!  │   │  │ CONTINUE│                        │
│      │ Code   │   │  │ Loop    │                        │
│      │ Proven │   │  └─────────┘                        │
│      └────────┘   │                                     │
└─────────────────────────────────────────────────────────┘
```

## Invariant Definition Language

### Basic Invariants
```yaml
invariants:
  - id: INV-001
    name: "Balance never negative"
    expression: "balance >= 0"
    scope: "Account.balance"
    severity: critical

  - id: INV-002
    name: "Cart total matches items"
    expression: "cart.total === sum(cart.items.price * cart.items.qty)"
    scope: "Cart"
    severity: critical

  - id: INV-003
    name: "Admin can access all resources"
    expression: "user.role === 'admin' implies canAccess(user, resource)"
    scope: "Authorization"
    severity: high
```

### Temporal Invariants
```yaml
invariants:
  - id: INV-004
    name: "Balance never decreases without withdrawal"
    expression: |
      forall event e:
        balance_after(e) < balance_before(e)
        implies e.type === 'withdrawal'
    scope: "Account.events"
```

## Agent Roles

### Builder Agent
**Goal**: Write code that satisfies all invariants

```javascript
// Builder receives invariants and generates implementation
async function builderRound(invariants, previousAttacks) {
  const implementation = await generateImplementation({
    invariants,
    lessonsLearned: previousAttacks.filter(a => a.succeeded),
    constraints: getSystemConstraints(),
  });

  return implementation;
}
```

### Adversary Agent
**Goal**: Find inputs that violate invariants

```javascript
// Adversary generates attacks
async function adversaryRound(implementation, invariants) {
  const attacks = [];

  // Strategy 1: Boundary attacks
  attacks.push(...generateBoundaryAttacks(invariants));

  // Strategy 2: Race condition attacks
  attacks.push(...generateConcurrencyAttacks(invariants));

  // Strategy 3: State manipulation attacks
  attacks.push(...generateStateAttacks(invariants));

  // Strategy 4: Malformed input attacks
  attacks.push(...generateMalformedInputAttacks(invariants));

  // Strategy 5: Adversarial ML attacks (if AI system)
  attacks.push(...generateAdversarialMLAttacks(invariants));

  return attacks;
}
```

### Invariant Judge
**Goal**: Verify invariants hold after each round

```javascript
async function judgeRound(implementation, attack, invariants) {
  const results = await Promise.all(
    invariants.map(inv => verifyInvariant(inv, implementation, attack))
  );

  return {
    allPassed: results.every(r => r.passed),
    violations: results.filter(r => !r.passed),
    exhaustionScore: calculateExhaustion(results),
  };
}
```

## Attack Strategies

### 1. Boundary Attacks
Target edge cases in numeric comparisons:
```javascript
// Invariant: age >= 18
const boundaryAttacks = [
  { age: 17 },      // Just below
  { age: 18 },      // Exactly at
  { age: 18.001 },  // Slightly above
  { age: -0 },      // Negative zero
  { age: Infinity }, // Infinity
  { age: NaN },     // Not a number
];
```

### 2. Concurrency Attacks
Target race conditions:
```javascript
// Invariant: balance >= 0
const concurrencyAttacks = [
  // Simultaneous withdrawals
  async () => {
    await Promise.all([
      account.withdraw(100),
      account.withdraw(100),
    ]); // Balance might go negative
  },
];
```

### 3. State Machine Attacks
Target invalid state transitions:
```javascript
// Invariant: Order cannot be delivered before shipped
const stateAttacks = [
  { from: 'created', to: 'delivered' }, // Invalid transition
  { from: 'shipped', to: 'pending' },   // Backward transition
];
```

### 4. Adversarial Input Attacks
Target parsing/validation edge cases:
```javascript
const inputAttacks = [
  { email: "a@b.c" },              // Minimal valid
  { email: "user+tag@domain.co.uk" }, // Complex valid
  { email: "user@domain".repeat(1000) }, // Buffer overflow attempt
  { email: "user@domain\u0000.com" }, // Null byte injection
  { email: "" },                   // Empty
  { email: null },                 // Null
  { email: undefined },            // Undefined
];
```

## Arena Protocol

### Phase 1: Setup
```javascript
const arena = new AdversarialArena({
  invariants: loadInvariants('./invariants.yaml'),
  maxRounds: 100,
  exhaustionThreshold: 0.95, // Stop when 95% attack space exhausted
});

await arena.initialize();
```

### Phase 2: Battle Loop
```javascript
while (!arena.isExhausted() && arena.round < arena.maxRounds) {
  console.log(`=== Round ${arena.round} ===`);

  // Builder creates/patches implementation
  const implementation = await arena.builderRound();

  // Adversary generates attacks
  const attacks = await arena.adversaryRound(implementation);

  // Judge evaluates
  for (const attack of attacks) {
    const verdict = await arena.judgeRound(implementation, attack);

    if (!verdict.allPassed) {
      arena.recordViolation(verdict.violations);
      arena.builderLearn(attack, verdict);
    } else {
      arena.recordDefense(attack);
    }
  }

  arena.round++;
}
```

### Phase 3: Verdict
```javascript
const finalVerdict = arena.produceVerdict();

console.log({
  status: finalVerdict.exhausted ? 'PROVEN' : 'INCONCLUSIVE',
  rounds: arena.round,
  invariantsHeld: finalVerdict.invariantsHeld,
  attackSpaceExhausted: finalVerdict.exhaustionScore,
  confidence: finalVerdict.confidenceScore,
  residualRisk: finalVerdict.residualRisk,
});
```

## Scripts

### Run Arena
```bash
# Full adversarial verification
./scripts/run-arena.sh --invariants ./invariants.yaml --max-rounds 100

# Quick verification
./scripts/run-arena.sh --quick
```

### Generate Attack Report
```bash
./scripts/generate-attack-report.sh ./arena-results/
```

## Templates

### invariants.yaml Template
```yaml
metadata:
  module: Cart
  version: 1.0.0

invariants:
  - id: INV-001
    name: "Cart total equals sum of items"
    expression: |
      cart.total === cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
      )
    severity: critical
    testStrategy: property

  - id: INV-002
    name: "Discount never makes total negative"
    expression: "cart.total >= 0"
    severity: critical
    testStrategy: boundary

  - id: INV-003
    name: "Guest cannot checkout with empty cart"
    expression: |
      user.role === 'guest' && cart.items.length === 0
      implies !canCheckout(user, cart)
    severity: high
    testStrategy: state
```

## References

- `references/attack-strategies.md` — Complete attack strategy library
- `references/invariant-patterns.md` — Domain-specific invariant templates
- `references/arena-configuration.md` — Advanced arena configuration
