---
phase: "{{phase_id}}"
plan: "{{plan_num}}"
type: execute
wave: "{{wave_num}}"
depends_on: []
files_modified: []
autonomous: true
requirements: []
user_setup: []
must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
Describe what this plan accomplishes, why it matters, and what artifacts are created.
</objective>

<execution_context>
@.opencode/workflows/hm-execute.md
</execution_context>

<context>
# Required files to read before implementation
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Description of task</name>
  <files>path/to/file.ts</files>
  <behavior>
    - Test 1: Expected behavior
    - Test 2: Edge case behavior
  </behavior>
  <action>
    Detailed instruction of the changes to make. No markdown code blocks inside action tags.
  </action>
  <verify>
    <automated>npm run test -- path/to/file.test.ts</automated>
  </verify>
  <done>Measurable completion criteria</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| boundary | detail |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-{{phase}}-01 | category | component | mitigate | mitigation strategy |
</threat_model>

<verification>
List validation check steps to run.
</verification>

<success_criteria>
- Observable outcome 1
- Observable outcome 2
</success_criteria>

<output>
Create .planning/phases/{{phase_id}}/{{padded_phase}}-{{plan_num}}-SUMMARY.md when done
</output>
