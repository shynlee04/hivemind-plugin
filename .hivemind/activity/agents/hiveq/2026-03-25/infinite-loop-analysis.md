# Infinite Loop Root Cause — Deep Dive

**Date:** 2026-03-25
**Agent:** hiveq
**File:** `src/core/reasoning/chain.ts`

---

## The Loop That Never Terminates

### Execution trace

```
1. analyze(input, { config, maxSteps: 5 })
   → createReasoningChain({ ...config, maxSteps: 5 })
   → chain = { steps: [], currentStep: 'initialize', maxIterations: config.maxIterations || 10 }

2. for await (const step of generateSteps(chain)) {
     // iteration 1
     const result = await analyzeStep(chain, input)
     // result = { step: 1, message: "Analyzing...", confidence: 0.8, sources: [...] }
     
     chain = updateChain(chain, result)
     // chain.steps = [{ step: 1, ... }]
     // chain.currentStep = 'initialize'  ← NEVER CHANGES
     
     const reasoning = extractNextStep(result.message)
     // regex /\[STEP\s+(\d+)\]/ doesn't match "Analyzing..."
     // returns "Analyzing..." (unchanged)
     
     // NO BREAK CONDITION — loop continues
   }

3. // iteration 2
   // chain.currentStep is STILL 'initialize'
   // analyzeStep() runs 'initialize' phase AGAIN
   // Same output, same reasoning, no progress
   
4. // iteration 3... N
   // Infinite loop until:
   //   - maxIterations reached (but never checked in loop body)
   //   - LLM rate limit / timeout
   //   - process killed
```

### Why `shouldContinue()` doesn't help

```typescript
function shouldContinue(chain: ReasoningChain): boolean {
  // These checks exist but are never used as loop break conditions:
  if (chain.steps.length >= chain.maxIterations) return false  // ← never checked
  if (chain.currentStep === 'complete') return false           // ← never reached
  return true  // ← always returns true
}
```

The `shouldContinue()` function exists but is never called in the loop body. The `for await` loop has no termination condition.

### The actual loop structure (reconstructed from test behavior)

```typescript
// What the code DOES:
for await (const step of generateSteps(chain)) {
  const result = await analyzeStep(chain, input)
  chain = updateChain(chain, result)
  // ← no break, no shouldContinue() check
  // ← no step advancement
}

// What it SHOULD do:
for await (const step of generateSteps(chain)) {
  const result = await analyzeStep(chain, input)
  chain = updateChain(chain, result)
  
  if (!shouldContinue(chain)) break  // ← missing
  
  chain = advanceStep(chain)  // ← missing
}
```

---

## Why the Test Doesn't Hang

The test uses mocked reasoning with exactly 2 mock responses. The mock generator runs out of responses after 2 iterations, causing the `for await` loop to naturally end (generator exhausted). With real LLM calls, the generator would never exhaust, and the loop would run forever.

**This is a test-masking-bug scenario:** the mock hides the infinite loop.

---

## Fix Requirements

For the chain to terminate correctly:

1. **Add step counter to ReasoningChain** — `iteration: number` that increments each loop
2. **Call shouldContinue() in loop body** — break when it returns false
3. **Advance currentStep** — move to next phase after each step completes
4. **Wire maxSteps through** — ensure options.maxSteps reaches chain.maxIterations
5. **Fix extractNextStep()** — either remove step markers from schema or add them to output

Minimum viable fix (3 lines):

```typescript
// In the iteration loop:
chain = { ...chain, iteration: (chain.iteration || 0) + 1 }
if (!shouldContinue(chain)) break
chain = advanceToNextPhase(chain)
```
