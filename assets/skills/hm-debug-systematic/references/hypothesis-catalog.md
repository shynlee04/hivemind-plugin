# Hypothesis Catalog

Common bug categories. When debugging, walk through this list before
hypothesizing from scratch.

## State
- Stale data (cache, old snapshot)
- Race condition (concurrent access)
- Missing initialization (uninitialized variable)
- Incorrect state transition

## Boundary
- Off-by-one (loop bounds, slice indices)
- Null vs. empty (database returns null, code expects [])
- Integer overflow (large number arithmetic)
- Floating point (== comparison)

## Type
- Implicit conversion (string + number)
- Missing type guard (passing wrong type to function)
- Union misuse (treating two distinct types as one)
- Null/undefined access

## API
- Contract mismatch (caller expects X, callee returns Y)
- Version drift (caller and callee on different versions)
- Deprecated signature (using old API)
- Missing optional parameter

## Env
- Missing env var
- Wrong cwd
- File permissions
- Network unreachable
- DNS misconfigured

## Config
- Stale config (cached value)
- Default value changed
- Env override not loaded
- Config file in wrong location

## Build
- Wrong branch checked out
- Stale build artifacts
- Mismatched dependencies
- Wrong tool version

## Test
- Test depends on real time
- Test depends on global state
- Test cleanup didn't run
- Test fixture data changed
