# Skill: hitea-mutation-testing

# Mutation Testing with StrykerJS

Use when evaluating test quality through mutation testing. Triggers on: 'mutation testing', 'test quality', 'stryker', 'mutants', 'test effectiveness'.

## What is Mutation Testing?

Mutation testing tests your **tests**. It intentionally injects bugs into your code and checks if your test suite catches them. If tests pass despite the bug, your tests are weak.

```
Original Code:    if (age >= 18) allow()
Mutant:          if (age > 18) allow()   // Boundary change
Test Result:     PASS (bad!) → Test doesn't check age === 18
```

## How It Works

1. **Generate Mutants**: Create modified versions of your code
2. **Run Tests**: Execute test suite against each mutant
3. **Score**: Calculate mutation score = killed mutants / total mutants

| Status | Meaning |
|--------|---------|
| **Killed** | Test detected the mutant (good) |
| **Survived** | Test didn't detect mutant (bad) |
| **Timeout** | Mutant caused infinite loop |
| **Compile Error** | Mutant invalid (excluded) |

## Configuration

### stryker.conf.mjs
```javascript
export default {
  // Files to mutate
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],

  // Test runner
  testRunner: 'jest',

  // Coverage analysis (speed optimization)
  coverageAnalysis: 'perTest',

  // Type checking
  checkers: ['typescript'],

  // Thresholds
  thresholds: {
    high: 80,    // Green
    low: 60,     // Yellow
    break: 70,   // Fail build if below
  },

  // Reporters
  reporters: ['clear-text', 'html', 'json'],

  // Concurrency
  concurrency: 4,
};
```

## Mutator Types

### Arithmetic Operators
```javascript
// Original
return a + b;
// Mutants: a - b, a * b, a / b, a % b, a ** b
```

### Conditional Boundaries
```javascript
// Original
if (age >= 18) allow();
// Mutants: age > 18, age <= 18, age < 18, age === 18, age !== 18
```

### Logical Operators
```javascript
// Original
if (a && b) doSomething();
// Mutants: a || b, a, b
```

### String Literals
```javascript
// Original
const message = "Hello";
// Mutants: "", "Stryker was here", lowercase, uppercase
```

### Array Declarations
```javascript
// Original
const items = [1, 2, 3];
// Mutants: [], [1], [2, 3]
```

### Function Bodies
```javascript
// Original
function add(a, b) { return a + b; }
// Mutants: function add(a, b) { return a; }
//          function add(a, b) { return b; }
//          function add(a, b) { return undefined; }
```

## Improving Mutation Score

### 1. Add Boundary Tests
```javascript
// If mutant "age > 18" survives, add:
test('allows exactly 18 years old', () => {
  expect(canVote(18)).toBe(true);
});
```

### 2. Test Edge Cases
```javascript
// If mutant "a - b" survives, add:
test('addition produces positive sum for positive inputs', () => {
  expect(add(5, 3)).toBeGreaterThan(5);
  expect(add(5, 3)).toBe(8); // Explicit check
});
```

### 3. Test Return Values Explicitly
```javascript
// Avoid generic assertions
test('returns correct sum', () => {
  const result = add(2, 3);
  expect(result).toBe(5); // NOT: expect(result).toBeTruthy()
});
```

## CI Integration

### GitHub Actions
```yaml
name: Mutation Testing
on: [pull_request]

jobs:
  mutation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx stryker run
        env:
          STRYKER_DASHBOARD_API_KEY: ${{ secrets.STRYKER_TOKEN }}
```

### Incremental Mode
```javascript
// stryker.conf.mjs
export default {
  incremental: true,
  incrementalFile: '.stryker-incremental.json',
};
```

## Best Practices

### 1. Target High-Impact Code
Focus on:
- Business logic (not boilerplate)
- Calculation functions
- Validation logic
- State transitions

### 2. Exclude Generated Code
```javascript
mutate: [
  'src/**/*.ts',
  '!src/**/*.generated.ts',
  '!src/types/**',
],
```

### 3. Use TypeScript Checker
```javascript
checkers: ['typescript'],
tsconfigFile: 'tsconfig.json',
```

### 4. Set Realistic Thresholds
- New projects: Start at 60%, increment to 80%
- Existing projects: Start at current score, increment 5% per sprint

## Scripts

### Run Mutation Tests
```bash
# Full mutation test
npx stryker run

# Specific files
npx stryker run --mutate src/utils/calculate.ts

# Incremental
npx stryker run --incremental
```

### Generate Report
```bash
# HTML report
npx stryker run --reporters html
open reports/mutation/mutation.html
```

## Templates

### stryker.conf.mjs Template
```javascript
/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
export default {
  mutate: ['src/**/*.ts', '!src/**/*.spec.ts'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  checkers: ['typescript'],
  reporters: ['clear-text', 'html'],
  thresholds: { high: 80, low: 60, break: null },
  concurrency: 4,
};
```

## References

- `references/mutator-reference.md` — All mutator types
- `references/survived-mutant-guide.md` — How to fix survived mutants
- `references/ci-integration.md` — CI/CD pipeline setup
