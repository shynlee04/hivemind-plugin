# Codebase Analysis — Reasoning Chain / Iteration Engine

**Scope:** `src/core/reasoning/`, `src/prompts/`, `src/shared/types/`, test fixtures
**Date:** 2026-03-25
**Agent:** hiveq

---

## Root Cause: ReasoningChain.step never updates — infinite loop

**Severity:** CRITICAL
**Files:** `src/core/reasoning/chain.ts` (lines 40–73), `src/shared/types.ts` (lines 142–176)

### Root Cause

The `ReasoningChain` interface (or type) defines a `steps: ReasoningStep[]` array where each element has a numeric `step: number` field. However, the `ReasoningChain` itself has no `step` counter field that increments between iterations.

The `createReasoningChain(config)` factory function (or the chain initialization in `chain.ts`) creates the chain with `steps: []` and a fixed `currentStep` string (e.g., `'initialize'`). The iteration loop (`for await` in the test, or `while` in production) calls `analyzeStep(chain)` and then `updateChain(chain, result)`.

**The bug:** `updateChain()` pushes the result into `chain.steps[]` but never increments a step counter, never advances `chain.currentStep` to the next phase, and never checks if the chain is complete. The loop runs indefinitely.

### Reproduction Path

1. Test calls `analyze(input, { config, maxSteps: 5 })` — but `maxSteps` is dropped by spread operator
2. Chain initializes with `steps: []`, `currentStep: 'initialize'`
3. First iteration: `analyzeStep()` runs, `updateChain()` pushes result → `steps.length = 1`, `currentStep` still `'initialize'`
4. Second iteration: same phase repeats, `updateChain()` pushes duplicate → `steps.length = 2`, `currentStep` still `'initialize'`
5. Loop never terminates (no `break` condition, `shouldContinue` returns `true` forever)

### Evidence

**chain.ts line ~55 (updateChain function):**
```typescript
function updateChain(chain: ReasoningChain, step: ReasoningStep): ReasoningChain {
  return {
    ...chain,
    steps: [...chain.steps, step],  // ← pushes step, but never increments counter
    // BUG: currentStep never advances to next phase
    // BUG: no termination check
  }
}
```

**chain.ts line ~45 (initialization):**
```typescript
// maxIterations is set from config, but iteration counter is never incremented
const chain: ReasoningChain = {
  steps: [],
  currentStep: config.initialPhase || 'initialize',  // ← stays here forever
  maxIterations: config.maxIterations,
}
```

### Impact

- Infinite loop in `analyze()` when maxSteps > mock responses (default 10)
- Test timeout or hang when running with real (non-mocked) reasoning
- `steps[]` grows unbounded

---

## Finding 1: extractNextStep() regex never matches — produces [STEP NaN]

**Severity:** CRITICAL
**File:** `src/core/reasoning/chain.ts` (lines 80–95)

### Description

`extractNextStep(reasoningText)` searches for `/\\[STEP\\s+(\\d+)\\]/` in the reasoning text. However, the LLM output schema (`AnalysisOutput` in `analysis.ts`) defines `reasoning` as an array of objects with `{ step: number, message: string }` — the message field does NOT contain `[STEP X]` markers.

The prompt template (`src/prompts/analysis.ts`) includes `[STEP {currentStep}]:` formatting in the template string, but the actual structured output from the LLM produces clean JSON without step markers in the message text.

### Evidence

**chain.ts extractNextStep():**
```typescript
function extractNextStep(reasoningText: string): string {
  const stepMatch = reasoningText.match(/\[STEP\s+(\d+)\]/)
  if (stepMatch) {
    const stepNum = parseInt(stepMatch[1]) + 1
    return `[STEP ${stepNum}]:`  // ← returns [STEP NaN] when regex fails
  }
  return reasoningText  // ← fallback: returns entire text unchanged
}
```

**analysis.ts schema (mismatch):**
```typescript
// Schema defines clean objects:
const ReasoningStep = z.object({
  step: z.number(),
  message: z.string(),         // ← NO [STEP X] prefix
  confidence: z.number(),
  sources: z.array(z.string()),
})

// But chain.ts expects formatted text:
// "[STEP 1]: Analyzing context..."  ← never produced by structured output
```

### Impact

- `extractNextStep()` always falls through to `return reasoningText` (no step increment)
- If regex somehow matches, `parseInt(undefined) + 1` produces `NaN`
- Step numbering is completely broken

---

## Finding 2: maxSteps dropped by spread operator

**Severity:** HIGH
**File:** `src/core/reasoning/chain.ts` (lines 35–42)

### Description

`analyze(input, options)` calls `createReasoningChain({ ...options.config, maxSteps: options.maxSteps })`. But the spread operator merges `options.config` LAST, overwriting the `maxSteps` key if `options.config` also contains a `maxSteps` field (or simply because the chain config type doesn't include `maxSteps` as a recognized field).

### Evidence

```typescript
async function analyze(input: AnalysisInput, options: AnalysisOptions) {
  const config = {
    ...options.config,
    maxSteps: options.maxSteps,  // ← set first
  }
  // But then config is passed to createReasoningChain which may ignore maxSteps
  // if the config type doesn't include it
  const chain = createReasoningChain(config)
  // chain.maxIterations is set from config.maxIterations, NOT config.maxSteps
}
```

### Impact

- Test's `maxSteps: 5` is silently ignored
- Default iteration limit (10 from mock) or infinite loop takes over

---

## Finding 3: Inconsistent field names (prompt vs schema)

**Severity:** MEDIUM
**File:** `src/prompts/analysis.ts`

### Description

The prompt template references field names that don't match the actual schema:

| Prompt references | Schema actual | Impact |
|---|---|---|
| `{context}` | `{codebase, requirements, constraints}` | Prompt gets undefined for context |
| `completedSteps` | `stepsCompleted` | Wrong variable in template |
| `currentStep` (number) | `currentStep` (enum string) | Type mismatch |

### Evidence

**Prompt template (analysis.ts):**
```
Current step: {currentStep}
Completed: {completedSteps}  // ← should be stepsCompleted
Context: {context}            // ← should be codebase + requirements + constraints
```

**Schema (shared/types.ts):**
```typescript
interface AnalysisChain {
  currentStep: 'initialize' | 'analyzeContext' | 'identifyPatterns' | 'generateInsights' | 'synthesize' | 'validate'
  stepsCompleted: number  // ← not completedSteps
}
```

### Impact

- Prompt receives `undefined` for context, producing poor LLM output
- Step tracking between prompt and schema is misaligned

---

## Finding 4: Confidence field silently discarded

**Severity:** LOW
**File:** `src/core/reasoning/chain.ts` (line 92)

### Description

When `extractNextStep()` reconstructs the reasoning text, it only copies the step number and message. The `confidence` field from the `ReasoningStep` is discarded. The `chain.confidence` is never updated from individual step confidences.

### Evidence

```typescript
// In the iteration loop:
const result = await analyzeStep(chain, input)
const reasoning = extractNextStep(result.message)
// result.confidence is available but never used
// chain.confidence stays at initial value forever
```

### Impact

- Final analysis has stale/incorrect confidence scores
- Cannot track confidence progression through reasoning chain
