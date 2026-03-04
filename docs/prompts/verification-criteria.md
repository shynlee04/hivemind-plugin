# Verification Criteria

When extracting acceptance criteria from planning artifacts for verification, follow these rules to ensure complete and testable criterion sets.

## Extraction Rules

1. **Source priority**: Phase plan > PRD > task definition > commit message. Use the most authoritative source.

2. **Criterion types**:
   - **Functional**: "Feature X works as specified" → Test with command execution
   - **Structural**: "File Y exists with Z content" → Test with file read + grep
   - **Quality**: "All tests pass, no type errors" → Test with gate commands
   - **Compliance**: "Naming follows conventions" → Test with pattern matching
   - **Performance**: "Response time < N ms" → Test with benchmarking

3. **Testability requirement**: If a criterion cannot be verified with a command, file read, or grep, flag it as "requires manual review" — do not auto-PASS it.

4. **Completeness check**: After extraction, verify that criteria cover:
   - Happy path (does it work correctly?)
   - Error cases (does it fail gracefully?)
   - Integration (does it work with existing systems?)
   - Compliance (does it follow conventions?)

## Verdict Standards

- **PASS**: Evidence directly and unambiguously confirms the criterion
- **FAIL**: Evidence directly contradicts the criterion (include the contradicting evidence)
- **INCONCLUSIVE**: Insufficient evidence to determine — always explain what additional evidence is needed

## Never Do

- Never mark PASS without running the verification command
- Never mark PASS based on "the code looks correct"
- Never skip a criterion because "it's obvious"
- Never infer test results from code structure — execute the tests
