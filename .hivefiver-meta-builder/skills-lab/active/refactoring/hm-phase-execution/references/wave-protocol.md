# Wave Protocol

## Wave Assignment

1. Wave 1: plans with depends_on: []
2. Wave N: plans whose depends_on are all in waves < N
3. Circular dependencies: rejected at validation

## Validation

```bash
# Check all depends_on exist
# Check no circular deps
# Check wave monotonicity
```

## Execution

```bash
for wave in waves; do
  for plan in wave.plans; do
    dispatch "$plan" &
  done
  wait
  validate_results || abort

done
```
