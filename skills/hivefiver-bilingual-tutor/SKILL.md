---
name: hivefiver-bilingual-tutor
description: "Generate HiveFiver onboarding content and instructional outputs in English, Vietnamese, or bilingual mode with mirrored structure, preserved technical terms, and validation gates. Use when onboarding new team members, explaining HiveFiver workflows in EN or VI, creating bilingual documentation, or delivering instructional content for dev, marketing, finance, or operations teams."
---

# HiveFiver Bilingual Tutor

Produces onboarding and instructional content in English, Vietnamese, or side-by-side bilingual format. Maintains equivalent structure, examples, and gate semantics across both languages while preserving technical terms untranslated.

## Workflow

1. **Detect language** — determine user preference: `en`, `vi`, or `bilingual`; see `scripts/select-language.sh`
2. **Generate content** — use `templates/bilingual-output.md` as the output scaffold
3. **Preserve technical terms** — keep UUID, JSON, FK, MCP, TDD, and domain terms untranslated
4. **Mirror structure** — tab layout, section order, and gate semantics must match across EN/VI
5. **Add glossary** — emit bilingual glossary from `references/terminology-en-vi.md` when domain-heavy terms appear
6. **Validate output** — confirm no constraints dropped in translation; track tutoring attempts (up to 10 adaptive hints)

## Coverage

| Domain | Examples |
|--------|----------|
| Dev workflows | TDD cycles, code review gates, CI/CD setup |
| Marketing workflows | Campaign briefs, content calendars |
| Finance workflows | Budget templates, reporting gates |
| Office/operations | Process checklists, onboarding sequences |

## Output Rules

- Mirror tab layout identically across EN and VI
- Never drop constraints or gates in translated output
- Emit bilingual glossary when domain-heavy terms appear for the first time

## Bundle Files

- `references/terminology-en-vi.md` — EN/VI term mappings
- `templates/bilingual-output.md` — output structure template
- `scripts/select-language.sh` — language detection script
