# Naming Taxonomy

## Prefix Lineage

| Lineage | Prefix | Example | Scope | Count |
|---------|--------|---------|-------|-------|
| Product development | `hm-*` | `hm-debug`, `hm-brainstorm` | Product dev pipeline — shipped | 30 |
| Meta builder | `hf-*` | `hf-agent-composition`, `hf-command-dev` | OpenCode primitives — shipped | 11 |
| Internal quality gates | `gate-*` | `gate-evidence-truth`, `gate-spec-compliance` | THIS PROJECT ONLY | 3 |
| Stack reference | `stack-*` | `stack-opencode`, `stack-zod` | Tech stack documentation — shipped | 6 |
| Framework-agnostic | none (unprefixed) | `opencode-config-workflow` | Cross-framework — shipped | 1 |

## Domain-Function Pattern

Pattern: `[lineage]-[domain]-[function]`

| Component | Description | Example |
|-----------|-------------|---------|
| `[lineage]` | Which ecosystem | `hm`, `hf`, `gate`, `stack` |
| `[domain]` | Area of concern | `debug`, `phase`, `agent`, `command` |
| `[function]` | What it does | `router`, `builder`, `orchestrator` |

### Function Suffixes

- `-router` — Intent classification and routing
- `-orchestrator` — Multi-phase/multi-skill coordination
- `-coordinator` — Interactive delegation management
- `-builder` — Creates new meta-concepts
- `-executor` / `-execution` — Runs plans or workflows
- `-reference` — Packed technical documentation
- `-synthesis` — Compresses research findings
- `-detector` / `-detective` — Codebase investigation
- `-debug` / `-debugger` — Systematic debugging
- `-author` / `-authoring` — Writing or creating artifacts
- `-persistor` / `-persistence` — State management across sessions
- `-looper` / `-looping` — Iterative loop management

## Glob Patterns for Agent Allowlists

| Pattern | Scope | Example Match |
|---------|-------|---------------|
| `"hm-*": allow` | All hm agents | `hm-orchestrator`, `hm-coordinator`, `hm-researcher` |
| `"hf-*": allow` | All hf agents | `hf-coordinator`, `hf-agent-builder` |
| `"gate-*": allow` | Internal quality gates | `gate-evidence-truth` |
| `"stack-*": allow` | Stack reference docs | `stack-zod`, `stack-vitest` |

**Cross-lineage:** `gate-*` and `stack-*` are permitted in ANY lineage's allowlist. `gsd-*` agents are internal — never included in shipped allowlists.
