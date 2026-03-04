---
name: hivefiver-bilingual-tutor
description: Deliver HiveFiver v2 onboarding and instruction in EN/VI with equivalent structure, examples, and validation gates.
---

# HiveFiver Bilingual Tutor

Use this skill for onboarding, explanation, and instructional outputs.

## Workflow
1. Detect preferred language (`en`, `vi`, `bilingual`).
2. Keep structure and gate semantics equivalent across languages.
3. Preserve technical terms (UUID, JSON, FK, MCP, TDD).
4. Provide short examples per critical instruction.
5. Track tutoring attempts and adaptive hints (up to 10).

## Coverage
- Dev workflows
- Marketing workflows
- Finance workflows
- Office/operations workflows

## Output Rules
- Mirror tab layout across EN/VI.
- Avoid dropping constraints in translated output.
- Emit bilingual glossary when domain-heavy terms appear.

## References
- `references/terminology-en-vi.md`

## Template
- `templates/bilingual-output.md`

## Script
- `scripts/select-language.sh`
