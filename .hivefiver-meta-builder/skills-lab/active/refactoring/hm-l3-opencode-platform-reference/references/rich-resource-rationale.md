# RICH Resource Rationale — hm-opencode-platform-reference

## Scope

This package is a reference-heavy OpenCode platform corpus for agents, commands, plugins, tools, SDK, permissions, MCP, models, configs, rules, and source confirmation. Its primary bundled resource is curated documentation plus repomix-packed source.

## Third-Party / External Source Scorecard

| Source | Discovery method | Reviewed material | Bundled-resource result | Decision |
|---|---|---|---|---|
| Official OpenCode documentation | Direct documentation/source capture | Agents, commands, plugins, tools, SDK, permissions, MCP, config, rules, models | Fully represented by per-topic `references/opencode-*.md` files. | ADOPT |
| OpenCode source pack | Local repomix package | `repomix-opencode.md` and `repomix-opencode.xml` | Bundled source corpus is present for exact source lookup; use incremental search/attach rather than reading wholesale. | ADOPT |
| GitHub agent skill resource model | Official/industry skill package conventions | Resource indexing and progressive disclosure | Adapted as the resource map: SKILL.md points to detailed references. | ADAPT |

## Pattern Alternatives

1. **Inline everything in SKILL.md** — rejected due context cost and poor progressive disclosure.
2. **Topic-indexed reference corpus** — adopted; fast routing to relevant platform files.
3. **Live web lookup only** — rejected because agents need stable local fallback; live docs may still be used for freshness.

## Bundled Resources

- `references/opencode-*.md` — topic-specific official documentation captures.
- `references/repomix-opencode.md` and `.xml` — packed OpenCode source evidence.
- `references/rich-resource-rationale.md` — source scorecard and RICH closure evidence.
- `evals/evals.json` — reference-routing pressure scenarios.
- `scripts/validate-skill.sh` — static package validator.

## Independence Audit

PASS. The package has no GSD/BMAD requirement. It can be copied into any OpenCode project as a local documentation/reference skill. Live internet validation remains recommended when APIs change.

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS | Official docs and local source pack are bundled and indexed. |
| RICH-5 | PASS | Large topic-specific reference corpus and source pack are bundled. |
| RICH-8 | PASS | Local scorecard/evals/validator close prior validator-eval gap. |
