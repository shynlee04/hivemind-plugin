# Spike Conventions

Patterns and stack choices established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- **Language:** Node.js ESM (matches project `package.json` `"type": "module"`)
- **Parsing:** `gray-matter` for YAML frontmatter (project dependency)
- **Runtime:** `node` directly for spike scripts (no build step needed for simple scripts)
- **Data format:** JSON for structured output between spikes

## Structure

- `.planning/spikes/NNN-descriptive-name/` — per-spike directory
- `discover-*.js` or `*.js` — runnable scripts
- `README.md` — spike results with YAML frontmatter
- `catalog.json` or intermediate artifacts — shared between spikes

## Patterns

- **Resilient parsing:** Always provide regex fallback for malformed YAML frontmatter. Real command files in this project have parsing errors (2/96).
- **Source classification:** `.opencode/command/` = builtin (GSD workflows), `.opencode/commands/` = custom (harness commands). Use `root.replace(/\/$/, '').endsWith('commands')` for detection.
- **Tokenization:** Lowercase, remove punctuation, filter stopwords, split on whitespace. Include command name tokens (dash-split) for matching.
- **Field extraction:** Description is always present; triggers are rare (6%); agents are sparse (15%); objective/process blocks carry semantic weight.

## Tools & Libraries

- `gray-matter` — YAML frontmatter parsing (with regex fallback)
- `node:fs`, `node:path` — file system operations
- No additional dependencies needed for simple text-based spikes
