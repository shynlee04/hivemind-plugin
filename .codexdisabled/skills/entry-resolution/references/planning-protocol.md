# Planning Protocol

**MANDATORY LOAD**: When intent is classified as complex (dependent tasks, unknown scope, multi-phase work).

## Complexity Classification

| Signal | Classification | Action |
|--------|---------------|--------|
| Single file change, clear scope | **Simple** | Skip planning, execute directly |
| Multiple files, clear dependencies | **Moderate** | Lightweight plan: list steps + acceptance criteria |
| Unknown scope, dependent tasks, multi-phase | **Complex** | Full planning protocol below |
| Research required before action | **Investigative** | Research phase → re-classify → plan |

## Full Planning Protocol

### Step 1: Scope Boundary

Before ANY work:
1. State what IS in scope (explicit list)
2. State what is NOT in scope (explicit exclusions)
3. Identify unknowns that need investigation first

### Step 2: Dependency Graph

Map task dependencies:
```
Independent tasks → can parallel
Dependent chains  → must sequence
Blocking unknowns → investigate FIRST
```

### Step 3: Acceptance Criteria

For EACH deliverable, define:
- What evidence proves it's done (command output, file existence, test pass)
- What evidence proves it's NOT done (failure signals)
- Edge cases that must be covered

### Step 4: Phase Boundaries

Break work into phases where each phase:
1. Has a clear entry gate (prerequisites met)
2. Has a clear exit gate (acceptance criteria verified)
3. Can be verified independently
4. Produces artifacts that survive session boundaries

### Step 5: Risk Assessment

| Risk | Mitigation |
|------|------------|
| Scope creep | Explicit NOT-in-scope list enforced |
| Wrong approach | Research phase before commitment |
| Context loss | Phase boundaries with checkpoint artifacts |
| Regression | Verification at each phase exit gate |

## Anti-Patterns

- **Planning without scope boundary** → scope creep guaranteed
- **No acceptance criteria** → "done" is subjective
- **Monolithic plan** → no checkpoints, no recovery points
- **Planning as procrastination** → simple tasks don't need full protocol
