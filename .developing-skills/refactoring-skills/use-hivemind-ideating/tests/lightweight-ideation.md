# Lightweight Ideation Test

## Scenario: "I want to add dark mode to my app."

A user requests a single-concern feature in a known area.

### Setup

- User message: "I want to add dark mode to my app."
- Current stack: React + Tailwind (known)
- Scope: Single UI concern

### Validation Table

| Step | Action | Expected | Pass/Fail Criteria |
|------|--------|----------|-------------------|
| 1 | Intent classification | `implementation` — user wants to build something | Intent verbalized as implementation |
| 2 | Scope classification | `Lightweight` — single concern, known area (CSS theming) | Scope = Lightweight |
| 3 | Questions asked | 1-2 targeted questions (e.g., "Toggle or system-preference?") | ≤2 questions |
| 4 | Understanding Lock | Agent presents understanding + approach, asks for confirmation | Lock triggered, user confirms |
| 5 | Research | Minimal — Context7 for Tailwind dark mode pattern | ≤1 tool call |
| 6 | Requirements doc | Generated with stable IDs (R1, R2...) | R-prefix IDs present |
| 7 | Creep check | Quick 5-question pass | All 5 answered |
| 8 | Exit criteria | All criteria checked | Lightweight exit criteria met |

### Expected Output Artifacts

| Artifact | Must Contain |
|----------|-------------|
| Requirements doc | ≥1 requirement with R-prefixed stable ID |
| Decision log | ≥1 decision (dark mode approach) |
| Session tracking | Phase statuses recorded |

### Anti-Pattern Checks

| Anti-Pattern | Must NOT Happen |
|-------------|-----------------|
| Batching questions | Agent asks only 1 question per turn |
| Skipping Understanding Lock | Agent explicitly asks for confirmation |
| Over-researching | No multi-tool chaining for a known pattern |
| Skipping creep check | 5-question check completed even for "simple" feature |

### Timing Target

- Total turns: 1-2
- Total tool calls: ≤2
- Duration: <5 minutes
