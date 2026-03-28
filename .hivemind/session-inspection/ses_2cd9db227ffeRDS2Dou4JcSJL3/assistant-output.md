# Session Inspection Export

- ses_id: `ses_2cd9db227ffeRDS2Dou4JcSJL3`
- prepared_at: `2026-03-28T03:16:22.045Z`

## Assistant Output

Output written and verified. Let me now deliver the compiled findings in the structured report.

---

## Codebase Investigation Report

**Scope:** All 7 `hivemind-*` depth skills in `.developing-skills/refactored-skills/`
**Question:** Extract YAML frontmatter, references/templates/tests counts, TOC presence, bundled resources, cross-references for each skill
**Investigation Commit:** `28663df`

### Findings

| # | Skill | yaml_name | desc_len | refs | templates | tests | TOC | Bundled Resources | Sibling Skills | Lines |
|---|-------|----------|----------|-----|-----------|------|-----|-------------------|----------------|-------|
| 1 | hivemind-atomic-commit | hivemind-atomic-commit | 437 | 5 | 4 | 1 | ❌ | ✅ | ✅ (3 skills) | 183 |
| 2 | hivemind-codemap | hivemind-codemap | 167 | 6 | 5 | 1 | ❌ | ✅ | ❌ (none) | 185 |
| 3 | hivemind-gatekeeping | hivemind-gatekeeping | 160 | 5 | 2 | 2 | ❌ | ✅ | ❌ (none) | 303 |
| 4 | hivemind-patterns | hivemind-patterns | 128 | 2 | 1 | 0 | ❌ | ✅ | ❌ (none) | 201 |
| 5 | hivemind-refactor | hivemind-refactor | 136 | 5 | 2 | 1 | ❌ | ✅ | ✅ (4 skills) | 284 |
| 6 | hivemind-spec-driven | hivemind-spec-driven | 215 | 3 | 1 | 1 | ❌ | ✅ | ✅ (3 skills) | 201 |
| 7 | hivemind-system-debug | hivemind-system-debug | 167 | 2 | 0 | 1 | ❌ | ✅ | ❌ (none) | 77 |

### Cross-Reference Map

```
hivemind-atomic-commit ──→ use-hivemind-git-memory, use-hivemind-delegation, hivemind-codemap
hivemind-codemap ────────→ use-hivemind-delegation, use-hivemind
hivemind-gatekeeping ──────→ use-hivemind-delegation
hivemind-patterns ──────────→ (none — pure reference skill)
hivemind-refactor ────────→ use-hivemind-delegation, use-hivemind-tdd, hivemind-codemap, hivemind-patterns, hivemind-gatekeeping
hivemind-spec-driven ──────→ use-hivemind-planning, use-hivemind-tdd, use-hivemind-delegation, hivemind-refactor
hivemind-system-debug ───→ use-hivemind, use-hivemind-context
```

### Gaps

- **hivemind-patterns has ZERO tests** — the only skill among the 7 with no test coverage
- **hivemind-system-debug has ZERO templates** — the only skill with no templates
- **None of the 7 skills have a TOC** section
- **None of the 7 skills have a dedicated "Cross-references" section** — cross-references appear in `Sibling Skills` sections or inline text
- **Shared reference file** `verification-before-completion.md` appears in 3 skills: hivemind-refactor, hivemind-spec-driven, hivemind-system-debug

### Summary Statistics
- **Total reference files:** 28
- **Total template files:** 15
- **Total test files:** 7
- **Average lines per SKILL.md:** 204.9
- **Longest:** hivemind-gatekeeping (303 lines)
- **Shortest:** hivemind-system-debug (77 lines)
- **All 7 skills have a Bundled Resources section**

### Output
- **Written to:** `.hivemind/activity/codescan/wave-1b/depth-skills.json`
- **Format:** Valid JSON with `_meta` block
- **Evidence:** File listing `find` + `Read` of all 7 SKILL.md files + `wc -l` line counts