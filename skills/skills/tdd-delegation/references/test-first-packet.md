# Test-First Packet Specification

## Purpose

Define the TDD-specific extension to standard delegation packets.

## Base Packet Extension

TDD delegation extends the standard `use-hivemind-delegation` packet with these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tdd_phase` | `red \| green \| refactor` | Yes | Current TDD phase |
| `test_gate_command` | string | Yes | Command to verify phase completion |
| `test_files` | string[] | Yes | Test files this phase touches |
| `implementation_files` | string[] | Yes | Implementation files this phase touches |
| `build_verify_command` | string | Green/Refactor | Build verification command |
| `expected_behavior` | string | Red | What the tests should verify |
| `refactor_scope` | string | Refactor | What aspects to improve |

## Phase-Specific Requirements

### Red Phase Packet

Must include:
- `tdd_phase: "red"`
- `test_files` — at least one test file
- `test_gate_command` — must produce failures
- `expected_behavior` — clear description of what tests verify

Must NOT include:
- `implementation_files` — implementation comes in green phase
- `build_verify_command` — no build needed for failing tests

### Green Phase Packet

Must include:
- `tdd_phase: "green"`
- `implementation_files` — at least one implementation file
- `test_files` — same test files from red phase
- `test_gate_command` — must show all tests pass
- `build_verify_command` — type check + build

### Refactor Phase Packet

Must include:
- `tdd_phase: "refactor"`
- `implementation_files` — files to refactor
- `test_files` — same test files (behavior unchanged)
- `test_gate_command` — must still show all tests pass
- `build_verify_command` — type check + build
- `refactor_scope` — what to improve

## Return Contract Extension

TDD returns extend the standard return with:

| Field | Type | Description |
|-------|------|-------------|
| `gate_result` | object | Test gate execution result |
| `build_verify_result` | object | Build verification result (green/refactor) |
| `tests_written` | number | Tests written in this phase |
| `tests_passing` | number | Currently passing tests |
| `tests_failing` | number | Currently failing tests |
