# Test Design Techniques

ISTQB test design techniques adapted for HiveMind TDD workflows. Use these to generate systematic test cases beyond "happy path + one error."

## Equivalence Partitioning

**Definition:** Divide input domains into classes where all values in a class are expected to behave identically. Test one representative per class.

**When to use:** Input validation, configuration parsing, tool argument handling.

**Example:**
```
Input: Zod schema with age field (number, min 0, max 150)

Partitions:
  Valid:   [1, 75, 149]     → test age=75 (one representative)
  Invalid: [-1, 151, "abc"] → test age=-1 (one representative)
  Boundary: handled by BVA separately
```

**HiveMind guidance:**
- Tool arg validation with `tool.schema` (Zod) → partition on schema constraints
- Each `.refine()`, `.min()`, `.max()`, `.optional()` creates a partition boundary
- Test one value per valid partition, one per invalid partition
- Skip redundant values within the same partition

## Boundary Value Analysis

**Definition:** Test at the edges of equivalence partitions. Bugs cluster at boundaries.

**When to use:** Numeric ranges, string length limits, array size constraints, pagination.

**Example:**
```
Input: page size (min 1, max 100)

Test values: 0, 1, 2, 99, 100, 101
             ↑   ↑   ↑    ↑    ↑    ↑
           below min+1  max-1  max  above
```

**HiveMind guidance:**
- `tool.schema.number().min(1).max(100)` → test 0, 1, 2, 99, 100, 101
- Array slicing: test empty array, single element, exactly-at-limit, one-over-limit
- String fields: test empty string, single char, max length, max+1 length
- Pagination: test page 0, page 1, last page, last page + 1

## Decision Tables

**Definition:** Map combinations of conditions to expected actions in a table. Each column becomes a test case.

**When to use:** Complex conditional logic, feature flags, permission checks, workflow state machines.

**Example:**
```
Conditions          | R1  | R2  | R3  | R4
--------------------|-----|-----|-----|-----
User authenticated? | Y   | Y   | N   | N
Has permission?     | Y   | N   | Y   | N
--------------------|-----|-----|-----|-----
Expected action     | Allow| Deny| Deny| Deny
```

**HiveMind governance guidance:**
- Permission system: authenticated × has_permission = 4 rules
- `permission.ask` hook: consent_granted × file_in_scope = test matrix
- Tool execution: valid_args × session_active × agent_authorized = rule set
- One test per column. Unreachable combinations → mark and skip.

## State Transition

**Definition:** Model the system as a state machine. Test valid transitions, invalid transitions, and edge transitions.

**When to use:** Session lifecycle, workflow phases, TDD cycle enforcement, build pipelines.

**Example:**
```
States: [Idle] → [Active] → [Completing] → [Done]
                ↘ [Error] ↗

Valid tests:
  Idle → Active (start)
  Active → Completing (trigger)
  Completing → Done (finish)
  Active → Error (failure)

Invalid tests:
  Idle → Done (skip)
  Done → Active (restart without reset)
  Error → Completing (recover without handler)
```

**HiveMind guidance:**
- Session lifecycle: `init → active → compacting → archived`
- TDD cycle: `red → green → refactor → transition` (each is a state)
- Trajectory states: `discovery → planning → implementation → gatekeeping`
- Test each valid transition. Test each invalid transition raises error.
- Test that entering a state with preconditions unmet raises an error.

## Combining Techniques

Don't use one technique in isolation. Layer them:

| Component | Primary Technique | Secondary Technique |
|-----------|------------------|---------------------|
| Tool args (Zod) | Equivalence Partitioning | Boundary Value Analysis |
| Permission logic | Decision Tables | State Transition |
| Workflow lifecycle | State Transition | Decision Tables |
| Pagination/ranges | Boundary Value Analysis | Equivalence Partitioning |
| Config parsing | Equivalence Partitioning | Decision Tables |

## Technique Selection Flow

```
Is it input validation?
  → Yes: Equivalence Partitioning + Boundary Value Analysis
  → No ↓

Is it conditional logic?
  → Yes: Decision Tables
  → No ↓

Is it a lifecycle/workflow?
  → Yes: State Transition
  → No ↓

Default: Equivalence Partitioning for inputs, exploratory for rest
```
