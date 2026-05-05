---
id: WS1-01
type: spec
created: 2026-05-06
updated: 2026-05-06
status: locked
lineage: shared
path: P3
dependencies: [HER-0]
related: [WS-3, WS-2, WS-7]
---

# WS1-01: .hivemind/ State Architecture Specification

> **Purpose:** Lock the canonical `.hivemind/` directory structure, `configs.json` schema, file format conventions, and state root hardening rules. This spec is the authoritative reference for all future workstreams writing to `.hivemind/`.

## 1. Canonical Directory Tree

All Hivemind internal state writes to `.hivemind/` at project root (Q6 decision, locked 2026-04-25).

```
.hivemind/
├── configs.json                    # Core runtime config (§3)
├── manifests/                      # System manifests (future: WS-3)
│   └── .gitkeep
├── hm-brain/                       # hm-* lineage runtime state (future: WS-6)
│   └── .gitkeep
├── hf-brain/                       # hf-* lineage config state (future: WS-2)
│   └── .gitkeep
├── delegation-managements/         # Per-session delegation records (future: WS-5)
│   └── .gitkeep
├── task-managements/               # Cross-session task state (future: WS-6)
│   └── .gitkeep
├── registries/                     # Primitive registries (future: WS-3)
│   └── .gitkeep
├── runtime/                        # Runtime pressure/control state
│   └── .gitkeep
├── artifacts/                      # Generated artifacts
│   └── .gitkeep
├── sidecar/                        # Sidecar state (future: WS-8)
│   └── .gitkeep
├── onboarding/                     # Onboarding session records (future: WS-2)
│   └── .gitkeep
├── logs/                           # System logs
│   └── .gitkeep
├── daily-notes/                    # Session daily notes [EXISTS]
├── event-tracker/                  # Session event journals [EXISTS]
├── journal/                        # Session journal [EXISTS]
├── lineage/                        # Execution lineage [EXISTS]
├── poor-prompts/                   # Historical prompt dumps [EXISTS]
├── state/                          # Core state persistence [EXISTS, CANONICAL]
│   ├── session-continuity.json     # Cross-session state
│   ├── delegations.json            # Delegation records
│   ├── config-workflows.json       # Workflow config state
│   ├── trajectory-ledger.json      # Trajectory nodes
│   ├── agent-work-contracts.json   # Agent work contracts
│   └── session-context-prompt.md   # Session context
└── uat/                            # UAT results [EXISTS]
```

## 2. Directory Purpose Annotations

| Directory | Owner | Lineage | Purpose | Git Policy |
|-----------|-------|---------|---------|------------|
| `configs.json` | WS-1 | shared | Core runtime config loaded at session start | COMMITTED |
| `manifests/` | WS-3 | hf | System primitive manifests | COMMITTED |
| `hm-brain/` | WS-6 | hm | Task graph, trajectory, advanced task state | GITIGNORED |
| `hf-brain/` | WS-2 | hf | Health, primitive manifests, doctor records | COMMITTED |
| `delegation-managements/` | WS-5 | hm | Per-session delegation records & reports | GITIGNORED |
| `task-managements/` | WS-6 | hm | Cross-session task registry & dependencies | GITIGNORED |
| `registries/` | WS-3 | hf | Primitive registries (agents, skills, commands, tools, hooks) | COMMITTED |
| `runtime/` | harness | hm | Runtime pressure state, control plane state | GITIGNORED |
| `artifacts/` | harness | shared | Generated artifacts from agents | GITIGNORED |
| `sidecar/` | WS-8 | hf | Sidecar read-only state model | GITIGNORED |
| `onboarding/` | WS-2 | hf | Onboarding session records | COMMITTED |
| `logs/` | harness | shared | System operational logs | GITIGNORED |
| `daily-notes/` | harness | hm | Daily session notes | GITIGNORED |
| `event-tracker/` | harness | hm | Session event JSON + MD | GITIGNORED |
| `journal/` | harness | hm | Append-only session journal | GITIGNORED |
| `lineage/` | harness | hm | Execution lineage records | GITIGNORED |
| `state/` | harness | shared | Core state persistence (canonical) | GITIGNORED |

## 3. `configs.json` Schema (5-Field Minimal)

### 3.1 Schema Definition

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `conversationLanguage` | enum | `"en"` | Agent conversation output language |
| `documentsLanguage` | enum | `"en"` | Artifact/governance document language |
| `mode` | enum | `"expert-advisor"` | Guardrail intensity mode |
| `userExpertLevel` | enum | `"intermediate-high-level"` | User proficiency level |
| `delegationSystems` | object | see below | Enabled delegation modes |

### 3.2 Enum Values

**Language:** `"en"` | `"vi"` | `"zh"` | `"fr"` | `"ja"` | `"ko"` | `"de"` | `"es"` | `"th"` | `"id"`

**Mode:**
- `"expert-advisor"` — Agent-led with TDD, spec-driven, research-first, systematic planning
- `"hivemind-powered"` — Stricter guardrails, hierarchical tracking, cross-context persistence
- `"free-style"` — Features only available if child control-panes are active

**User Expert Level:**
- `"clumsy-vibecoder"` | `"beginner-friendly"` | `"intermediate-high-level"` | `"architecture-driven"` | `"absolute-expert"`

### 3.3 Delegation Systems Object

```json
{
  "native_task": true,
  "delegate_task": true,
  "background_delegation": false
}
```

### 3.4 Loading Rules

- Loaded at every front-facing session start
- Reloaded after each user prompt (main session only)
- Missing file → defaults apply (no error)
- Invalid JSON → warning logged, defaults apply
- Unknown fields → stripped (lenient parsing)

## 4. File Format Conventions

| Format | Use Case | Requirements |
|--------|----------|-------------|
| `.json` | Machine-queryable state, configs, registries | Strict schema validation via Zod |
| `.md` | Human-readable documents, reports, governance | YAML frontmatter (§5) + body |
| `.gitkeep` | Directory registration | Empty files for git tracking |

## 5. Frontmatter Schema (for `.hivemind/*.md` files)

All `.md` files under `.hivemind/` SHOULD include:

```yaml
---
id: unique-identifier
type: {journal|report|state|config|audit}
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: {draft|active|complete|deprecated}
lineage: {hm|hf|shared|internal}
---
```

Required fields: `id`, `type`, `created`, `status`.
Optional fields: `updated`, `lineage`, `dependencies`, `related`, `path`.

## 6. State Root Hardening Rules

1. All writes to `.hivemind/` MUST go through tool-mediated access (not direct agent file writes)
2. `assertPathWithinRoot()` enforces path containment for all state writes
3. Gatekeeper policy blocks direct writes to `.hivemind/state/` (Q6: `manualStateWritesForbidden`)
4. Legacy `.opencode/state/opencode-harness/` is read-only for backward compatibility
5. Migration direction: `.opencode/state/` → `.hivemind/state/` (one-way, no dual-write)

## 7. `.gitignore` Policy

### Committed (tracked by git)
- `configs.json` — project-level settings, shareable across team
- `manifests/` — system manifests
- `hf-brain/` — hf lineage config health
- `registries/` — primitive registries
- `onboarding/` — onboarding records
- All `.gitkeep` files — directory structure tracking
- All `README.md` files — directory documentation

### Gitignored (per-session runtime state)
- `state/` — all runtime state files
- `event-tracker/` — session event journals
- `journal/` — session journals
- `lineage/` — execution lineage
- `daily-notes/` — daily session notes
- `hm-brain/` — task/trajectory runtime state
- `delegation-managements/` — delegation records
- `task-managements/` — task state
- `runtime/` — runtime pressure state
- `artifacts/` — generated artifacts
- `sidecar/` — sidecar state
- `logs/` — system logs

## 8. Falsifiable Requirements

| REQ ID | Condition | Verification |
|--------|-----------|-------------|
| REQ-WS1-01 | `.hivemind/` directory tree contains all 18 directories (7 existing + 11 new) | `find .hivemind -type d \| sort` matches spec |
| REQ-WS1-02 | `configs.json` validates against Zod schema with all 5 required fields | `ConfigsSchema.safeParse()` returns success |
| REQ-WS1-03 | `configs.json` with invalid values is rejected by Zod schema | `ConfigsSchema.safeParse({mode:"invalid"})` returns error |
| REQ-WS1-04 | `.gitignore` prevents runtime state from being tracked | `git check-ignore .hivemind/state/session-continuity.json` exits 0 |
| REQ-WS1-05 | Existing runtime state remains functional after scaffolding | `npm test` passes with 0 regressions |
| REQ-WS1-06 | `getCanonicalStateDir()` resolves to `.hivemind/state` | Existing unit tests pass unchanged |
| REQ-WS1-07 | All 11 new directories contain `.gitkeep` files | `find .hivemind -name .gitkeep \| wc -l` ≥ 11 |

---

*Spec locked: 2026-05-06*
*Authority: Q6 Validation Decision (2026-04-25), MASTER-PROJECT-SKELETON §8*
*Consumed by: WS-3 (registries/), WS-2 (configs.json, onboarding/), WS-6 (hm-brain/, task-managements/)*
