# TDD Loop Reference

## RED Phase
Write a test that describes desired behavior.
- Test MUST fail when run
- If test passes immediately → it's trivially true. DELETE it.
- Show: failing command output

## GREEN Phase
Implement minimum code to make test pass.
- All tests MUST pass
- No extra features beyond what test requires
- Show: passing command output

## REFACTOR Phase
Clean up code without changing behavior.
- All tests still pass
- Improve structure, naming, readability
- Show: passing command output after cleanup

## Gate Commands
```bash
npx tsc --noEmit    # Type check
npm test            # Test suite
npm run build       # Build check
```
