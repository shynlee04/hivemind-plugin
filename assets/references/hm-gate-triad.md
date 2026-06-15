# Reference — Quality Gate Triad (L3)

This reference defines the structured quality gate triad that governs all Hivemind deliveries before phase closeout or deployment.

## The Triad Sequence

Every delivery must pass through three distinct quality gates in sequence:

```
┌─────────────────────────────┐
│  1. Lifecycle Integration   │  -> Verifies structure, CQRS, and SDK signatures
└──────────────┬──────────────┘
               │ (PASS)
               ▼
┌─────────────────────────────┐
│    2. Spec Compliance       │  -> Verifies trace mapping, criteria, and gaps
└──────────────┬──────────────┘
               │ (PASS)
               ▼
┌─────────────────────────────┐
│     3. Evidence Truth       │  -> Audits actual runtime evidence (L1-L5)
└─────────────────────────────┘
```

## 1. Lifecycle Integration Gate
- **Purpose**: Verifies that the implementation obeys Harness architectural boundaries.
- **Key Checks**:
  - **Q6 Roots**: File matches its target classification (`src/` hard harness, `.opencode/` meta-concepts, `.hivemind/` state).
  - **CQRS Boundaries**: Tool (read-side) does not perform direct DB state mutations; Hook does not execute write side-effects.
  - **SDK Signatures**: Uses correct `@opencode-ai/plugin` tool/hook signatures.

## 2. Spec Compliance Gate
- **Purpose**: Verifies that all acceptance criteria are trace-mapped and fully covered.
- **Key Checks**:
  - **Traceability**: All requirements mapped to test behavior.
  - **Gap Detection**: Scans for unimplemented or stubbed code (e.g. `TODO`, `FIXME`, or console logs serving as placeholders).
  - **EARS Acceptance**: Acceptance criteria follow the Easy Approach to Requirements Syntax (EARS).

## 3. Evidence Truth Gate
- **Purpose**: Audits the validity of verification evidence.
- **Key Checks**:
  - **Verification Sizing**: Checks that automated tests run successfully.
  - **Mock Detection**: Rejects stubs/mocks where integration testing was promised.
  - **Truth Hierarchy validation**: Verifies that evidence meets the target level (L1/L2 preferred).
