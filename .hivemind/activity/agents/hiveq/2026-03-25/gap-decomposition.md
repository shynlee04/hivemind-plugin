# Gap Decomposition — Parallel Fix Plan

**Date:** 2026-03-25
**Agent:** hiveq
**Methodology:** Granularity > God

---

## Fix Scope: 4 Independent Slices

The 4 critical+high findings decompose into **independent file-level slices** with zero cross-dependency during implementation. Verification must happen sequentially after all slices land.

---

## Slice A: Chain Termination (chain.ts)

**Owner:** hivemaker (chain-fixer)
**Files:** `src/core/reasoning/chain.ts`
**Lines:** 35–73
**Independence:** Self-contained — no other file changes needed

### What to fix

1. Add `iteration: number` field to chain initialization (line ~42)
2. Add `shouldContinue(chain)` check with `break` in iteration loop (line ~55)
3. Add `advanceStep(chain)` function that increments iteration counter and advances `currentStep` to next phase
4. Ensure loop terminates when `chain.iteration >= chain.maxIterations`

### Acceptance criteria

- [ ] `analyze()` returns after `maxSteps` iterations (not infinite)
- [ ] `chain.steps.length === maxSteps` when limited by maxSteps
- [ ] `chain.currentStep` advances through phases: initialize → analyzeContext → identifyPatterns → ...
- [ ] `shouldContinue()` returns false when `stepsCompleted >= maxIterations`
- [ ] No infinite loop with real (non-mocked) reasoning

### No cross-file changes required

This slice only touches `chain.ts`. The interface changes are internal to the module.

---

## Slice B: extractNextStep() Fix (chain.ts)

**Owner:** hivemaker (extract-fixer)
**Files:** `src/core/reasoning/chain.ts`
**Lines:** 80–95
**Independence:** Self-contained — same file as Slice A but different function

### What to fix

1. Remove regex dependency on `[STEP X]` markers
2. Accept `ReasoningStep` object directly (not formatted text)
3. Return next phase name based on current phase progression
4. Or: add `[STEP X]` markers to the output schema (coordinated with Slice C)

### Acceptance criteria

- [ ] `extractNextStep()` returns a valid phase name, not `[STEP NaN]`
- [ ] Works with structured JSON output from LLM (not text markers)
- [ ] Step numbering is deterministic (1, 2, 3, ...)

### Coordination with Slice C

If Slice B decides to use step markers, Slice C must add them to the prompt template. Otherwise, slices are independent.

---

## Slice C: Prompt Template Alignment (prompts/analysis.ts)

**Owner:** hivemaker (prompt-fixer)
**Files:** `src/prompts/analysis.ts`
**Independence:** Fully independent — no chain.ts changes needed

### What to fix

1. Replace `{context}` with explicit `{codebase}`, `{requirements}`, `{constraints}` variables
2. Replace `completedSteps` with `stepsCompleted` (match schema)
3. Ensure `currentStep` type matches schema enum (string, not number)
4. Add step marker format to prompt if Slice B chooses that approach

### Acceptance criteria

- [ ] Prompt template variable names match actual schema field names
- [ ] No `undefined` values injected into prompt
- [ ] Template renders correctly with all variable substitutions

---

## Slice D: maxSteps Wiring (chain.ts)

**Owner:** hivemaker (config-fixer)
**Files:** `src/core/reasoning/chain.ts`
**Lines:** 35–42
**Independence:** Self-contained — same file as Slice A but different section

### What to fix

1. Ensure `options.maxSteps` is correctly passed to `createReasoningChain`
2. Map `maxSteps` → `maxIterations` in chain config
3. Remove duplicate spread that overwrites `maxSteps`

### Acceptance criteria

- [ ] `analyze(input, { maxSteps: 5 })` creates chain with `maxIterations: 5`
- [ ] Test's `maxSteps: 3` limits iterations to 3
- [ ] Default maxIterations is reasonable (10) when not specified

---

## Merge Order

```
Slice C (prompts) ─────────────────────┐
Slice B (extractNextStep) ─────────────┤──→ Verification Gate
Slice A (chain termination) ───────────┤
Slice D (maxSteps wiring) ─────────────┘
```

All 4 slices can be implemented in parallel. Merge to verification gate after all 4 land.

---

## Verification Gate (Post-Merge)

After all 4 slices are implemented:

1. Run `npx tsx --test src/core/reasoning/chain.test.ts` — must pass
2. Run `npx tsc --noEmit` — must compile
3. Manual check: `analyze()` with `maxSteps: 5` returns exactly 5 steps
4. Manual check: no infinite loop with 10+ iterations
5. Manual check: `chain.currentStep` advances through all phases

If any check fails → return to hiveminder for re-planning.
