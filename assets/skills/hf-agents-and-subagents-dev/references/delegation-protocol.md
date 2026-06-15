# Delegation Protocol — Subagent Dispatch Pattern

## The Dispatch Envelope

```
Task tool (builder/researcher/critic):
  description: "Task N: [name]"
  prompt: |
    You are [role]. Your task: [FULL TASK TEXT]
    
    ## Context
    [Scene-setting — where this fits, why it matters]
    
    ## Scope
    - Include: [specific files/paths]
    - Exclude: [what NOT to touch]
    
    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - [Specific output requirements]
```

## The Full Cycle

### 1. Before Dispatch
- Ensure task_plan.md has the subagent's scope as a phase
- Extract full task text (not file path)
- Construct context: where this fits, dependencies, what to look for

### 2. Dispatch
Use the envelope template above. Fill in:
- **role**: builder, researcher, critic, or explore
- **FULL TASK TEXT**: Paste the entire task description, not a file reference
- **Context**: 2-3 sentences of scene-setting
- **Scope**: Specific files/paths to include and exclude
- **Output Format**: Status + specific requirements

### 3. After Return
Check status and handle:
- **DONE** → Proceed to spec review
- **DONE_WITH_CONCERNS** → Read concerns. If about correctness → address before review. If observation → note and proceed.
- **NEEDS_CONTEXT** → Provide missing context. Re-dispatch.
- **BLOCKED** → Assess: context gap? needs stronger model? task too big? plan wrong?

### 4. Two-Stage Review
- **Stage 1: Spec Compliance** — Does the implementation match requirements? Nothing extra? Nothing missing?
- **Stage 2: Code Quality** — Is it well-built? Clean? Tested? Following patterns?
- **Stage 1 MUST pass before Stage 2**

## Worked Example

```
You: I'm dispatching Task 2: Add verification function

[Get Task 2 text from plan]
[Construct context: "This fits after the core implementation. The function needs to verify conversation index integrity."]

Task tool (builder):
  description: "Task 2: Add verification function"
  prompt: |
    You are implementing Task 2: Add verification function

    ## Task Description
    Add a verifyIndex() function that checks conversation index integrity.
    It should detect: missing entries, duplicate entries, out-of-order entries.
    Return a report of all issues found.

    ## Context
    This fits after the core repair functions from Task 1. The verifyIndex()
    function is the read-side counterpart to repairIndex().

    ## Scope
    - Include: src/lib/conversation-index.ts, tests/lib/conversation-index.test.ts
    - Exclude: src/plugin.ts, src/lib/state.ts

    ## Output Format
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - What you implemented
    - What you tested and results
    - Files changed (file:line format)
    - Self-review findings (if any)

[Implementer returns: DONE, added verifyIndex() with 4 issue types, 8/8 tests passing]

[Dispatch spec reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Dispatch code quality reviewer]
Code reviewer: Strengths: Clean architecture, real tests. Issues: None. Approved.

[Mark Task 2 complete]
```

## Status Handling Details

### DONE_WITH_CONCERNS
The implementer completed the work but flagged doubts. Before proceeding to review:
1. Read the concerns carefully
2. If concerns are about correctness or scope → address them first (provide more context, clarify requirements)
3. If concerns are observations (e.g., "this file is getting large") → note them and proceed to review

### NEEDS_CONTEXT
The implementer hit a knowledge gap. Action:
1. Identify what information was missing
2. Provide the missing context (file contents, architectural decisions, etc.)
3. Re-dispatch with the same task + new context

### BLOCKED
The implementer cannot proceed. Assess the blocker:
1. **Context problem** → Provide more context, re-dispatch with same model
2. **Reasoning problem** → Re-dispatch with a more capable model
3. **Size problem** → Break task into smaller pieces
4. **Plan problem** → The plan itself may be wrong → escalate to human

**Never** force the same model to retry without changes.
