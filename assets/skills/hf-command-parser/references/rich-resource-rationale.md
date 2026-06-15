# RICH Resource Rationale — hf-command-parser

## Scope

This package owns mental parsing of OpenCode command argument strings (`$ARGUMENTS`, flags, named values, quoted values, and propositional expressions). It does not execute shell commands and must remain independent of this repository.

## Third-Party / External Source Scorecard

| Source | Discovery method | Reviewed material | Bundled-resource result | Decision |
|---|---|---|---|---|
| OpenCode command documentation | Official OpenCode documentation / local `hm-opencode-platform-reference` corpus | Command arguments, `$ARGUMENTS`, `$1`, file references, shell-output command patterns | Official docs provide concepts but no separate skill bundle; counted as authoritative API/resource source, not a third-party bundled-skill diff. | ADAPT |
| `different-ai/openwork@opencode-primitives` | `npx skills find "opencode command agent skill"` / skills.sh metadata | Primitive definitions and command structure metadata | Public package evidence is metadata/snippet-level in this closure pass; no verified bundled resources available locally. | DEFER |
| `tumf/skills@opencode-command-creator` | skills.sh/GitHub search lineage | Command-authoring examples and argument handling patterns | Package is command-authoring-oriented; no local bundled-resource crawl available in this pass. | ADAPT WITH CAUTION |

## Pattern Alternatives

1. **Token-stream parser** — split into tokens while preserving quoted segments. Good for implementation, but too code-specific for a workflow skill.
2. **Structured parse table** — map raw phrase → flags → named values → positional payload → ambiguities. Adopted because it is tool-agnostic and agent-readable.
3. **Shell execution probe** — run command snippets to observe expansion. Rejected because this skill must parse mentally and avoid execution side effects.

## Bundled Resources

- `references/parsing-rules.md` — command parsing grammar and ambiguity rules.
- `references/rich-resource-rationale.md` — this scorecard and external-source rationale.
- `evals/evals.json` — trigger and parsing pressure scenarios.
- `scripts/validate-skill.sh` — local static validator for required resources and JSON parseability.

## Independence Audit

PASS. The skill is usable in arbitrary OpenCode projects because it only needs the command string supplied by the user or command runtime. It does not require `.planning/`, GSD, BMAD, repository-local paths, or executing shell commands.

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS WITH RATIONALE | Top sources selected; official docs inspected; unavailable third-party bundle crawls explicitly scored. |
| RICH-5 | PASS | Domain-specific parsing rules, evals, and validator now bundled. |
| RICH-8 | PASS | D1-D8 + RICH closure is represented in this scorecard and cross-phase closure artifact. |
