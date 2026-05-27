# AI Feature Spec — [Feature Name]

## 1. Goal Description
Detail the objective of the AI feature, the problem it solves, and the target user experience.

## 2. Model Configuration
Specify the model details and runtime constraints:
- **Model**: `[e.g., claude-3-5-sonnet, gemini-1.5-pro]`
- **Temperature**: `[e.g., 0.0 - 0.7]`
- **Max Tokens**: `[e.g., 4096]`
- **Budget Threshold**: `[Max API cost or token count per request/session]`

## 3. Context & Input Structure
Define the schemas or variables required to hydrate the model prompt:
- **System Instructions**: `[Path to instructions.md]`
- **User Prompt Variables**:
  - `[Variable 1]`: `[Type & Description]`
  - `[Variable 2]`: `[Type & Description]`

## 4. Constraint Boundaries & Security Guardrails
Specify forbidden actions, system policies, and output restrictions:
- Must not leak internal project credentials.
- Must restrict edits to the scoped target files.
- Must reject unverified network requests.

## 5. Output Contract (JSON / Markdown Schema)
Describe the expected structured output:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "analysis": { "type": "string" },
    "changes": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success", "analysis"]
}
```

## 6. Evaluation & Evals Plan
Detail how the prompt output stability, accuracy, and latency are evaluated:
- **Test Dataset**: `[Path to test dataset JSON]`
- **Evaluation Criteria**: `[Describe target metrics]`
