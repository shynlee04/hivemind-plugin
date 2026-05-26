# Mock Honesty Detection

## The Rule

```
A test that passes only because of mocks is not evidence of correctness.
Every cross-cutting change must have at least one real-behavior test.
```

## Purpose

Detect and prevent deceptive test passing in cross-cutting changes. Heavy mocking — where tests replace real implementations with stubs/fakes/spies that always succeed — creates false confidence. The test suite is GREEN, but the system would break if mocks were removed. This protocol identifies these "curtain tests" and replaces them with honest verification.

Synthesized from `addyosmani/agent-skills@test-driven-development` real/fake/stub/mock preference ordering and boundary-mock policy, extended with cross-pan mock audit.

## Mock Hazard Scale

| Level | Name | Description | Risk |
|-------|------|-------------|------|
| L0 | **No mock** | Test exercises real code path | Safe — honest evidence |
| L1 | **Real dependency** | Test uses real database, real filesystem, real HTTP | Safe — integration evidence |
| L2 | **Fake** | In-memory implementation with identical behavior | Safe — if fake is correct |
| L3 | **Stub** | Returns canned responses, no behavior | Medium — only tests happy path |
| L4 | **Spy** | Records calls, delegates to real implementation | Low-medium — observe + execute |
| L5 | **Mock (behavioral)** | Mock that verifies behavior matches real expectations | Medium-high — behavior must be verified |
| L6 | **Mock (state)** | Mock that verifies call count/order, not behavior | High — call count ≠ correctness |
| L7 | **Mock (suppression)** | Mock that always succeeds, hides errors | Critical — lying evidence |

## Detection Protocol

### Step 1: Audit Test Files for Mock Usage

For each test file in the test pan, scan for mock patterns:

```bash
# TypeScript/JavaScript
grep -n "jest.mock\|vi.mock\|mockImplementation\|mockReturnValue\|mockResolvedValue" tests/**/*.test.ts

# Python
grep -n "@patch\|@mock.patch\|MagicMock\|Mock(" tests/**/*.py

# Go
grep -n "gomock\|testify/mock\|Mock\w*(func" **/*_test.go

# Rust
grep -n "#\[mockall\|mock!\(" tests/**/*.rs
```

Record every mock usage with file, line number, and mock level.

### Step 2: Classify Each Mock

For each mock found, determine its level using this decision tree:

```
Does the mock replace a real implementation?
  YES → Does the mock verify output correctness?
    YES → Does the mock match the real implementation's behavior?
      YES → L5 (behavioral mock) — medium-high risk
      NO → L6 (state mock) — high risk
    NO → Does the mock always return success?
      YES → L7 (suppression mock) — CRITICAL risk
      NO → L6 (state mock) — high risk
  NO → Is it a pure spy (records + delegates)?
    YES → L4 (spy) — low-medium risk
    NO → Does it return canned responses?
      YES → L3 (stub) — medium risk
      NO → Is it an in-memory implementation?
        YES → L2 (fake) — safe
        NO → L1 (real dependency) or L0 (no mock) — safe
```

### Step 3: Flag Deceptive Patterns

These specific patterns are **always deceptive** and must be eliminated:

#### Pattern A: Suppression Mock (L7 — CRITICAL)

```typescript
// DECEPTIVE: This mock always returns success, hiding real failures
jest.mock('./engine', () => ({
  process: jest.fn().mockResolvedValue({ status: 'ok' })
}));
```

**Why deceptive:** If the real `engine.process()` throws, the test still passes. The mock suppresses all errors. There is zero evidence that the integration works.

**Fix:** Replace with a real or fake implementation, or add at least one integration test with the real engine:

```typescript
// HONEST: Integration test with real engine
it('processes input through real engine', async () => {
  const result = await realEngine.process(validInput);
  expect(result.status).toBe('ok');
});
```

#### Pattern B: Call-Count Mock (L6 — HIGH)

```typescript
// DECEPTIVE: Verifies call count, not output correctness
const mockSave = jest.fn();
service.save = mockSave;
service.execute(input);
expect(mockSave).toHaveBeenCalledTimes(1);
```

**Why deceptive:** The code called `save()` once, but the test never verified that `save()` produced correct output. The mock could return garbage and the test would pass.

**Fix:** Verify the actual output:

```typescript
// HONEST: Verifies output
const result = service.execute(input);
expect(result.saved).toBe(true);
expect(await db.query('SELECT * FROM items')).toContainEqual(expectedItem);
```

#### Pattern C: Echo Mock (L6 — HIGH)

```typescript
// DECEPTIVE: Returns the input as output, never testing transformation
jest.mock('./transformer', () => ({
  transform: jest.fn((x) => x)
}));
```

**Why deceptive:** The mock echoes the input. If the real transformer corrupts data, the test never detects it.

**Fix:** Use real transformation or verify the mock's output matches expected transformation:

```typescript
// HONEST: Test with real transformer
it('transforms input correctly', () => {
  const result = realTransformer.transform(input);
  expect(result).toEqual(expectedOutput);
});
```

#### Pattern D: Always-Green Mock (L7 — CRITICAL)

```python
# DECEPTIVE: @patch always returns success
@patch('services.email.send')
def test_order_completion(self, mock_send):
    mock_send.return_value = True
    result = checkout_service.complete_order(order)
    assert result.status == 'completed'
```

**Why deceptive:** Email sending could fail in production, but the mock makes it always succeed. There is no test for the failure path, so error handling is untested.

**Fix:** Test both paths:

```python
# HONEST: Test success and failure paths
def test_order_completion_email_success(self):
    result = checkout_service.complete_order(order, email_sender=real_sender)
    assert result.status == 'completed'

def test_order_completion_email_failure(self):
    result = checkout_service.complete_order(order, email_sender=failing_sender)
    assert result.status == 'email_failed'
```

### Step 4: Calculate Honesty Score

For each test file, calculate the honesty score:

```
Honesty Score = (Number of L0-L2 tests) / (Total tests) × 100
```

| Score | Rating | Action |
|-------|--------|--------|
| ≥ 70% | **Honest** | Proceed |
| 40-69% | **Suspect** | Add at least 2 real-behavior tests |
| < 40% | **Deceptive** | BLOCKED — rewrite test suite with majority real tests |

### Step 5: Add Real-Behavior Tests

For every cross-cutting change, add at least one test at L0-L2 level:

- **L0:** Pure function test with real implementation, no mocks at all
- **L1:** Integration test with real database, real HTTP, real filesystem
- **L2:** Fake implementation that mirrors real behavior (e.g., in-memory database)

Preference ordering: L0 > L1 > L2. Prefer no-mock tests. Only use fakes when real dependencies are genuinely impractical.

### Step 6: Mock Removal Protocol

When a deceptive mock is detected, follow this removal sequence:

1. Identify the real dependency that was mocked
2. Determine if the real dependency can be used in tests (deterministic? fast enough?)
3. If yes → replace mock with real dependency (L1)
4. If no (external API, slow database) → create a fake (L2) that mirrors real behavior
5. If fake is impractical → keep the mock but add a contract test that verifies the mock matches real behavior
6. Record the mock removal in the honesty report

## Honesty Report

After completing the mock audit, produce this report:

```yaml
change_id: "CC-abc123"
audit_timestamp: "2026-04-28T10:30:00Z"
test_files_audited: 3
mock_instances_found: 7
mock_levels:
  L0_no_mock: 2
  L1_real_dependency: 1
  L2_fake: 0
  L3_stub: 1
  L4_spy: 1
  L5_behavioral_mock: 1
  L6_state_mock: 1
  L7_suppression_mock: 0
honesty_score: 57%  # (3 real tests) / (7 total) × 100
rating: suspect
deceptive_patterns_found:
  - file: tests/engine.test.ts
    line: 42
    pattern: call_count_mock
    risk: HIGH
    fix: "Replaced with output verification test at line 55"
real_tests_added:
  - file: tests/integration/cross-pan.test.ts
    level: L1
    description: "End-to-end test exercising real engine with test database"
honesty_gate: pass  # after adding integration test
```

## Cross-Pan Mock Detection

Cross-cutting changes have an additional hazard: mocks that are valid in one pan become deceptive when the change spans multiple pans.

**Example:** A test for the interface pan mocks the deep module correctly for its own scope. But when the deep module changes behavior, the mock becomes stale — it still returns the old behavior. The test passes because the mock returns old output, but the real integration would break.

**Detection:**
- After deep module changes, audit all interface-pan tests that mock deep modules
- Run these tests with the mock removed (real deep module) — even temporarily
- If tests pass with mock but fail with real deep module → mock is stale → must update

## Honesty Gate Checklist

Before passing Honesty Gate (G5):

- [ ] All test files audited for mock usage
- [ ] Every mock classified by level (L0-L7)
- [ ] All L7 (suppression) mocks eliminated
- [ ] All L6 (state) mocks replaced or validated
- [ ] Honesty score ≥ 40% (suspect threshold) — target ≥ 70%
- [ ] At least one L0-L2 test for the changed behavior
- [ ] At least one cross-pan test with real dependencies
- [ ] No stale cross-pan mocks (updated to match new behavior)
- [ ] Error paths tested with real failure scenarios (not mock failures)
- [ ] Honesty report produced and attached to handoff packet
