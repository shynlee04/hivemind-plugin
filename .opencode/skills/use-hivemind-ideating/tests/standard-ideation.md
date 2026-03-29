# Standard Ideation Test

## Scenario: "I need to redesign the authentication flow to support OAuth2 + SAML."

A multi-concern feature that needs validation and architectural consideration.

### Setup

- User message: "I need to redesign the authentication flow to support OAuth2 + SAML."
- Current stack: Express.js + JWT sessions (known)
- Scope: Multi-concern, security-critical, needs validation

### Validation Table

| Step | Action | Expected | Pass/Fail Criteria |
|------|--------|----------|-------------------|
| 1 | Intent classification | `open-ended` — redesign implies exploring approaches | Intent = open-ended |
| 2 | Scope classification | `Standard` — multi-concern, needs validation | Scope = Standard |
| 3 | Questions asked | 3-5 targeted questions about users, security reqs, migration | 3-5 questions, one at a time |
| 4 | Approaches generated | 2-3 approaches with pros/cons | ≥2 approaches |
| 5 | Understanding Lock | Agent confirms understanding before research | Lock triggered and confirmed |
| 6 | Cross-stack research | Context7 for OAuth2/SAML libs + 1 web source | ≥2 sources |
| 7 | Reviewer dispatch | Skeptic dispatched (Standard scope) | 1 reviewer |
| 8 | Creep check | Full 5-question framework | All 5 answered |
| 9 | 10x scoring | 6 criteria scored | All 6 scored |
| 10 | Decision log | Populated with key decisions | ≥3 decisions |
| 11 | Documentation | Requirements doc + Decision Log + 10x Analysis | All 3 artifacts |

### Expected Output Artifacts

| Artifact | Must Contain |
|----------|-------------|
| Requirements doc | ≥3 requirements with stable IDs (R1, R2, R3) |
| Decision log | ≥3 decisions with alternatives and rationale |
| 10x analysis | All 6 criteria scored |
| Session tracking | All phases 0-7 tracked |

### Anti-Pattern Checks

| Anti-Pattern | Must NOT Happen |
|-------------|-----------------|
| Skipping Intent Gate | Intent classified before any work |
| Batching questions | Agent asks only 1 question per turn |
| Skipping research | External evidence gathered before review |
| Skipping reviewer | At least Skeptic reviews the approach |
| Single-source decisions | ≥2 sources for key claims |
| Proceeding without Lock | Understanding Lock explicitly confirmed |

### Timing Target

- Total turns: 3-5
- Total tool calls: ≤5
- Duration: 15-30 minutes
