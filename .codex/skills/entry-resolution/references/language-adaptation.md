# Language Adaptation

**CONDITIONAL LOAD**: At entry-resolution Step 4, when non-English input detected OR user requests bilingual output.

> Consolidated from the bilingual tutor skill. Extensible to any language pair.

## Language Detection

Detect preferred language from user input:

| Signal | Resolution |
|--------|-----------|
| User writes in English | `language: "en"` |
| User writes in Vietnamese | `language: "vi"` |
| User writes mixed EN/VI | `language: "bilingual"` |
| User explicitly requests a language | Use requested language |
| Cannot determine | Default `"en"`, ask for confirmation |

## Bilingual Output Rules

When `language: "bilingual"` or user requests dual-language output:

1. **Mirror structure** — same headings, same gate semantics across both languages
2. **Preserve technical terms** — UUID, JSON, FK, MCP, TDD, API stay in English
3. **Short examples** — provide one example per critical instruction in both languages
4. **Glossary emission** — when domain-heavy terms appear, emit a bilingual glossary section

## Terminology Preservation

These terms are NEVER translated (they are universal technical vocabulary):

```
UUID, JSON, YAML, API, REST, GraphQL, SQL, MCP, TDD, BDD,
FK, PK, PRD, CLI, SDK, CI/CD, DevOps, Git, npm, Node.js,
TypeScript, JavaScript, HTML, CSS, HTTP, HTTPS, WebSocket
```

## Adaptive Instruction

When tutoring/instructional output is needed:

| Phase | Action |
|-------|--------|
| Detection | Identify knowledge gaps from user responses |
| Instruction | Provide step-by-step in detected language |
| Validation | Confirm understanding before proceeding |
| Retry | Up to 10 attempts with progressive hints |
| Escalation | After 10 retries, escalate to human review |

## Output Format

When bilingual mode is active, format outputs as:

```
## [Section Title EN] | [Section Title VI]

[English content]

---

[Vietnamese content]
```

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Dropping constraints in translation | VI output must have same gates as EN |
| Translating technical terms | UUID, JSON, MCP etc. stay in English |
| Language detection on every turn | Detect once, cache, re-evaluate only on explicit change |
| Assuming English only | Check first message for language signals |
