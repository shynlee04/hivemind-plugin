# Intent Gate Classification Test

## Purpose

Verify that the Intent Gate correctly classifies all 6 intent types from concrete user messages.

## Test Cases

### Test 1: Research Intent

**Input:** "Explain how the trajectory tool works"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "explain", "how" |
| 2 | Classify intent | **research** |
| 3 | Verbalize intent | "I detect a **research** request — user wants to understand an existing tool. My approach: **explore → answer**." |
| 4 | Route | Answer inline or delegate to research skill |
| 5 | Ideation needed? | **No** — research, not ideation |

### Test 2: Implementation Intent

**Input:** "Add a new handoff tool"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "add", "new" |
| 2 | Classify intent | **implementation** |
| 3 | Verbalize intent | "I detect an **implementation** request — user wants to create new functionality. My approach: **plan → execute**." |
| 4 | Route | Lightweight ideation → planning |
| 5 | Ideation needed? | **Possibly** — if scope is unclear, lightweight mode |

### Test 3: Investigation Intent

**Input:** "Check why tests are failing in src/tools/"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "check", "why", "failing" |
| 2 | Classify intent | **investigation** |
| 3 | Verbalize intent | "I detect an **investigation** request — tests are failing and user wants diagnosis. My approach: **isolate → diagnose**." |
| 4 | Route | Debug workflow (not ideation) |
| 5 | Ideation needed? | **No** — investigation/debug |

### Test 4: Evaluation Intent

**Input:** "What do you think about using CQRS for hooks?"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "what do you think", "about using" |
| 2 | Classify intent | **evaluation** |
| 3 | Verbalize intent | "I detect an **evaluation** request — user wants an architectural assessment. My approach: **clarify → evaluate**." |
| 4 | Route | Standard ideation mode |
| 5 | Ideation needed? | **Yes** — Standard mode |

### Test 5: Fix Intent

**Input:** "The build is broken after last commit"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "broken", "after last commit" |
| 2 | Classify intent | **fix** |
| 3 | Verbalize intent | "I detect a **fix** request — build is broken and needs immediate repair. My approach: **diagnose → fix**." |
| 4 | Route | Debug → fix workflow (not ideation) |
| 5 | Ideation needed? | **No** — fix/debug |

### Test 6: Open-ended Intent

**Input:** "Refactor the shared utilities"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Read message | Signal words: "refactor" |
| 2 | Classify intent | **open-ended** |
| 3 | Verbalize intent | "I detect an **open-ended** request — user wants to restructure existing code. My approach: **clarify → ideate**." |
| 4 | Route | Standard or Deep ideation |
| 5 | Ideation needed? | **Yes** — Standard (or Deep if cross-module) |

## Turn-Local Intent Reset Tests

### Test 7: Context Override

**Prior turn:** "Add a login page" (implementation)
**Current turn:** "Actually, how does JWT work?"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Turn-local reset | Ignore prior implementation intent |
| 2 | Classify current message | **research** |
| 3 | Route | Answer inline (not implementation) |

### Test 8: Continuation Detection

**Prior turn:** "Should we use REST or GraphQL?"
**Current turn:** "Continue"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Turn-local reset | Current message is "continue" — one-word response |
| 2 | Allow prior context | Prior was evaluation — continue evaluation |
| 3 | Route | Continue Standard ideation |

### Test 9: Multi-Intent Split

**Input:** "Add OAuth2 support and explain how the auth middleware works"

| Step | Action | Expected |
|------|--------|----------|
| 1 | Detect multi-intent | Two intents in one message |
| 2 | Split | Implementation (OAuth2) + Research (middleware explanation) |
| 3 | Handle research | Answer inline |
| 4 | Handle implementation | Route to ideation if scope unclear |

## Pass/Fail Criteria

| Test | Must Pass |
|------|-----------|
| All 6 intent types | Correct classification |
| Turn-local reset | Current message wins over history |
| Continuation detection | Prior context used only for one-word responses |
| Multi-intent | Split and handle separately |
| No false-positive ideation | Research/fix/investigation NOT routed to ideation |
