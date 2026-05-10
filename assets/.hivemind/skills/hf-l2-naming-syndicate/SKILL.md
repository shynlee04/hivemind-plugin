---
name: hf-l2-naming-syndicate
description: >
  Formal naming convention for all Hivemind meta-concepts. Defines prefixes, lineage rules, and
  validation for hm-*, hf-*, gate-*, stack-* skills and agents. Use when creating any new skill
  or agent to ensure consistent, predictable, machine-verifiable naming. Triggers: naming convention,
  naming rules, prefix rules, how to name a skill, how to name an agent, naming validation,
  naming syndicate, check name compliance, validate skill name, validate agent name, name taxonomy,
  lineage prefix, what prefix should I use, correct prefix for, check naming convention.
  NOT for general project file naming or non-meta-concept naming.
metadata:
  layer: "2"
  role: "meta-builder-governance"
  pattern: P2
  version: "1.0.0"
  lineage: "hf-*"
  task-group: "how-to-create"
  routes-to: ["hf-*"]
  input-from: ["hm-lineage-router"]
  consumed-by:
    - "hf-meta-builder"
    - "hivefiver-skill-author"
    - "hivefiver-agent-builder"
    - "hivefiver-command-builder"
    - "hivefiver-orchestrator"
allowed-tools:
  - Read
  - Glob
  - Grep
---

## The Iron Law

```
Every meta-concept name MUST be lineaged, parseable, and machine-verifiable.
No skill or agent may straddle lineages without explicit justification.
```

# Naming Syndicate

## Overview

The Naming Syndicate defines the canonical naming convention for ALL meta-concepts in the Hivemind ecosystem: skills, agents, and their associated prefixes. It provides machine-verifiable rules so that every name is predictable, parsable, and routable by `hm-lineage-router` and `hf-meta-builder`.

**This skill does NOT create names — it validates them.** Route naming decisions through `hf-meta-builder` for creation; use this skill to verify compliance.

## On Load

1. Read `references/naming-taxonomy.md` — complete taxonomy with domain categories and function patterns
2. Identify the meta-concept type (skill or agent) and its target lineage
3. Validate the proposed name against the rules in the taxonomy
4. Return a verdict: `PASS` (compliant) or `FAIL` (violation) with specific rule references

## Trigger Phrases

- "naming convention" / "naming rules" / "naming syndicate"
- "prefix rules" / "lineage prefix" / "what prefix should I use"
- "how to name a skill" / "how to name an agent"
- "naming validation" / "check name compliance" / "validate skill name"
- "validate agent name" / "check naming convention" / "name taxonomy"
- "correct prefix for" / "verify name follows rules"

---

## Skill Naming Rules

### Prefix Lineage

| Lineage | Prefix | Example | Scope | Count (Apr 2026) |
|---------|--------|---------|-------|-------------------|
| Product development | `hm-*` | `hm-debug`, `hm-brainstorm`, `hm-phase-execution` | Product dev pipeline — shipped | 30 |
| Meta builder | `hf-*` | `hf-agent-composition`, `hf-command-dev`, `hf-skill-synthesis` | OpenCode primitives — shipped | 11 |
| Internal quality gates | `gate-*` | `gate-evidence-truth`, `gate-spec-compliance` | THIS PROJECT ONLY | 3 |
| Stack reference | `stack-*` | `stack-opencode`, `stack-zod`, `stack-vitest` | Tech stack documentation — shipped | 6 |
| Framework-agnostic | none (unprefixed) | `opencode-config-workflow` | Cross-framework — shipped | 1 |

**Total active skills:** 51 (plus 1 disabled: `donotusethis-hm-planning-with-files`)

### Domain-Function Pattern

All skills follow the pattern: `[lineage]-[domain]-[function]`

| Component | Description | Example |
|-----------|-------------|---------|
| `[lineage]` | Which ecosystem the skill belongs to | `hm`, `hf`, `gate`, `stack` |
| `[domain]` | What area of concern the skill addresses | `debug`, `phase`, `agent`, `command`, `opencode` |
| `[function]` | What the skill does within that domain | `router`, `builder`, `orchestrator`, `reference`, `detector` |

**Domain taxonomy:** See `references/naming-taxonomy.md` for the complete domain category taxonomy with all 51 skills classified.

**Function patterns:**
- `-router` — Intent classification and routing to other skills (e.g., `hm-lineage-router`)
- `-orchestrator` — Multi-phase/multi-skill coordination (e.g., `hm-gate-orchestrator`)
- `-coordinator` — Interactive delegation management (e.g., `hm-coordinating-loop`)
- `-builder` — Creates new meta-concepts (e.g., `hf-agent-composition`, `hivefiver-agent-builder`)
- `-executor` / `-execution` — Runs plans or workflows (e.g., `hm-test-driven-execution`, `hm-phase-execution`)
- `-reference` — Packed technical documentation (e.g., `hm-opencode-platform-reference`)
- `-synthesis` — Compresses research findings (e.g., `hm-synthesis`)
- `-detector` / `-detective` — Codebase investigation (e.g., `hm-detective`)
- `-debug` / `-debugger` — Systematic debugging (e.g., `hm-debug`)
- `-auditor` — Quality checking from evidence (e.g., `gate-evidence-truth` is an auditor gate)
- `-validator` — Formal requirement validation (e.g., `hm-requirements-analysis`)
- `-author` / `-authoring` — Writing or creating artifacts (e.g., `hm-spec-driven-authoring`)
- `-persistor` / `-persistence` — State management across sessions (e.g., `hm-planning-persistence`)
- `-looper` / `-looping` — Iterative loop management (e.g., `hm-completion-looping`)

### Edge Cases

1. **Single-word after prefix** — Acceptable if the word is a compound concept (e.g., `hm-brainstorm`, `hm-synthesis`). The domain and function are fused.
2. **Three-word after prefix** — Maximum allowed (e.g., `hm-test-driven-execution`, `hm-user-intent-interactive-loop`). Four or more words: split or simplify.
3. **Compound domain** — Hyphenated domain component (e.g., `cross-cutting` in `hm-cross-cutting-change`). Allow when the domain concept is inherently compound.
4. **Abbreviated elements** — Avoid unless universally recognized (e.g., `PTY` in `stack-bun-pty`, `JSON` in `stack-json-render`, `SDK` in `hm-tech-stack-ingest`).

---

## Agent Naming Rules

Agent names follow the same prefix scheme but add **layer suffixes** to indicate delegation hierarchy:

| Layer | Suffix | Role | Example |
|-------|--------|------|---------|
| **L0** | `-orchestrator` | Top-level routing and delegation brain. Receives user requests, classifies intent, delegates to specialists. | `hm-orchestrator`, `hivefiver-orchestrator` |
| **L1** | `-coordinator` | Mid-level task coordination. Manages subtask sequences, validates dependencies. | `hm-coordinator`, `hf-coordinator` |
| **L2** | domain-name (no suffix) | Specialist. Executes specific domain tasks. | `hm-researcher`, `hm-debugger`, `hm-planner`, `hivefiver-agent-builder` |

### Agent Name Constraints

1. **L0 agents:** Must end in `-orchestrator`. There is at most ONE L0 agent per lineage.
2. **L1 agents:** Must end in `-coordinator`. May have multiple per lineage for different coordination scopes.
3. **L2 agents:** Must NOT use orchestrator or coordinator suffix. Name = `[lineage]-[domain-function]`.
4. **No duplicate names** — Agent name must be unique across ALL lineages.
5. **No boundary violations** — An `hm-*` agent should primarily load `hm-*` skills. An `hf-*` agent may load `hm-*` skills when explicitly documented in the skill's `consumed-by` field.

### Edge Cases

- **`hivefiver-` prefix:** Legacy prefix for agents created during the Hivefiver v1 naming era. Equivalent to `hf-` prefix but uses the full product name. New agents MUST use `hf-` (e.g., `hf-skill-author` not `hivefiver-skill-author`). Existing `hivefiver-*` agents are grandfathered until next rename wave.
- **Unprefixed agents:** `conductor`, `coordinator`, `builder`, `critic`, `explore`, `general`, `researcher` — internal project agents that are NOT shipped. Prefixed agents are the shipped product.

---

## Validation Rules

### Machine-Verifiable Rules (Regex)

```regex
# hm-* skills: exactly hm- followed by 1-3 hyphenated words
^hm-[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,3}$

# hf-* skills: exactly hf- followed by 1-3 hyphenated words
^hf-[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,3}$

# gate-* skills: exactly gate- followed by 1-3 hyphenated words
^gate-[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,3}$

# stack-* skills: exactly stack- followed by 1-3 hyphenated words
^stack-[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,3}$

# Unprefixed: alphanumeric with hyphens, no leading prefix
^[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,5}$

# Agent: same prefix rules + optional layer suffix
^[a-z]+([a-z0-9]*)-[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,3}$
# L0/L1 agent suffixes: -(orchestrator|coordinator)$
```

### Non-Machine-Verifiable Rules (Human Review)

| Rule | Check |
|------|-------|
| **Lineage integrity** | Skill with `hm-*` prefix must appear in `hm-lineage-router` category bundles or be documented in consumed-by for hf-* agents. Skill with `hf-*` prefix must be routable by `hf-meta-builder`. |
| **No straddling** | A skill cannot serve two lineages without explicit justification and cross-lineage documentation in its frontmatter (`consumed-by` field). |
| **No ambiguous abbreviations** | Avoid `cfg`, `config` (ambiguous — config or configuration?), `mgr`, `svc`, `impl`, `util`, `helper`. Use full words. |
| **Directory name = frontmatter name** | The skill directory name (e.g., `hm-debug/`) MUST match the `name:` field in frontmatter. |
| **Agent name = file name** | The agent file name (e.g., `hm-researcher.md`) MUST match the agent's identity. |
| **No numeric suffixes** | Avoid `hm-debug2`, `hf-builder-v2`. Use semantic naming instead (e.g., `hm-systematic-debug`). |

### Glob Pattern Reference

Glob patterns used in agent permission allowlists and skill routing tables. These patterns enable machine-verifiable lineage enforcement and automatic classification at load-time.

#### Agent Allowlist Patterns

| Pattern | Scope | Example Match |
|---------|-------|---------------|
| `"hm-l0-*": allow` | All L0 hm orchestrators (front-facing) | `hm-l0-orchestrator` |
| `"hm-l1-*": allow` | All L1 hm coordinators (mid-level) | `hm-l1-coordinator` |
| `"hm-l2-*": allow` | All L2 hm specialists (execution) | `hm-l2-researcher`, `hm-l2-debugger`, `hm-l2-planner` |
| `"hf-l0-*": allow` | All L0 hf orchestrators (front-facing) | `hf-l0-orchestrator` |
| `"hf-l1-*": allow` | All L1 hf coordinators (mid-level) | `hf-l1-coordinator` |
| `"hf-l2-*": allow` | All L2 hf specialists (meta-builder) | `hf-l2-agent-builder`, `hf-l2-skill-author` |
| `"gate-l3-*": allow` | All internal quality gates (project only) | `gate-l3-evidence-truth`, `gate-l3-spec-compliance` |
| `"stack-l3-*": allow` | All stack reference docs | `stack-l3-zod`, `stack-l3-vitest` |

#### Exact-Match Patterns (for specific agents)

| Pattern | Purpose |
|---------|---------|
| `"hm-l1-coordinator": allow` | Exact match for the L1 hm coordinator |
| `"hm-l0-orchestrator": allow` | Exact match for the L0 hm orchestrator |
| `"hf-l1-coordinator": allow` | Exact match for the L1 hf coordinator |
| `"hf-l0-orchestrator": allow` | Exact match for the L0 hf orchestrator |

#### Skill Routing Patterns

| Pattern | Scope | Loaded By |
|---------|-------|-----------|
| `"hm-l2-*": allow` | All L2 execution/how-to hm skills | hm-l1-coordinator, hm-l0-orchestrator |
| `"hm-l3-*": allow` | All L3 research/reference hm skills | hm-l1-coordinator, hm-l0-orchestrator |
| `"hf-l2-*": allow` | All L2 meta-builder hf skills | hf-l1-coordinator, hf-l0-orchestrator |
| `"gate-l3-*": allow` | All internal gate skills | hm-l0-orchestrator, hm-l1-coordinator |
| `"stack-l3-*": allow` | All stack reference skills | Any lineage (cross-cutting) |

#### Glob Enforcement Rules

1. **Lineage locking:** `hm-*` agents MUST use `"hm-l*-*": allow` patterns — never `"hf-l*-*": allow` unless explicitly documented in `consumed-by`.
2. **Depth specificity:** `"hm-l2-*": allow` matches all L2 hm specialists. More specific patterns like `"hm-l2-debugger": allow` match exact agents.
3. **Cross-lineage patterns:** `"gate-l3-*": allow` and `"stack-l3-*": allow` are permitted in ANY lineage's allowlist since they are shared reference infrastructure.
4. **gsd-* exclusion:** `gsd-*` agents are internal project build tools — never included in shipped allowlists. Use `"gsd-*": ask` in public-facing agents.

### Conflict Resolution

When two proposed skills target the same domain + function:

1. **Check lineage first** — Different lineages (hm vs hf) can share domain names (e.g., `hm-router` and `hf-router` are valid because they are in different lineages)
2. **Check function differentiation** — Within the same lineage, differentiate by function: `hm-gate-orchestrator` vs `hm-gate-auditor`
3. **Merge when identical** — If domain + function are identical and lineage is the same, merge into one skill with broader scope
4. **Escalate to naming syndicate** — If conflict cannot be resolved by rules 1-3, open a naming review

---

## Rename History

### Completed Renames (SE-1, 2026-04-27)

| Old Name | New Name | Reason |
|----------|----------|--------|
| `hm-meta-builder` | `hf-meta-builder` | Corrected lineage — this is a meta-builder skill, not a product-dev skill |
| (10 total renames) | — | See SE-1-SUMMARY.md for full list |

### Disabled/Archived

| Name | Status | Reason |
|------|--------|--------|
| `hm-planning-with-files` → `donotusethis-hm-planning-with-files` | Archived (2026-04-29) | Replaced by `hm-planning-persistence`. Directory exists, no SKILL.md. |

### Known Name Anomalies (Intentionally Retained)

| Name | Anomaly | Reason |
|------|---------|--------|
| `opencode-config-workflow` | Unprefixed | Framework-agnostic config workflow — intentionally lacks lineage prefix to avoid implying it belongs to any one lineage |
| `hivefiver-orchestrator` | Uses `hivefiver-` not `hf-` | Legacy v1 name. Grandfathered. Will be reviewed in future rename wave. |
| `hivefiver-agent-builder` | Uses `hivefiver-` not `hf-` | Legacy v1 name. Grandfathered. Counterpart `hf-agent-composition` exists as hf-* skill. |
| `hivefiver-command-builder` | Uses `hivefiver-` not `hf-` | Legacy v1 name. Grandfathered. |
| `hivefiver-skill-author` | Uses `hivefiver-` not `hf-` | Legacy v1 name. Grandfathered. |
| `hivefiver-tool-builder` | Uses `hivefiver-` not `hf-` | Legacy v1 name. Grandfathered. |

---

## Cross-References

| Skill/Agent | Relationship |
|-------------|-------------|
| `hm-lineage-router` | Consumes naming rules to validate skill-to-lineage mappings in routing tables |
| `hf-meta-builder` | Primary consumer — routes naming validation requests here |
| `hf-skill-synthesis` | Uses naming rules during scaffold generation to ensure new skills are correctly prefixed |
| `hivefiver-skill-author` | Validates skill names during creation |
| `hivefiver-agent-builder` | Validates agent names during creation |
| `hm-gate-orchestrator` | Uses naming rules in gate quality audits for meta-concept integrity |

---

## Self-Correction

### When a Proposed Name Violates Rules
[Detection] Name fails regex validation, straddles lineages without justification, or matches a rename history conflict.
[Recovery] Return FAIL with specific rule reference (e.g., "Violates Rule 2.3: Max 3 words after prefix. 'hm-deep-codebase-research-analysis' has 4 words."). Suggest compliant alternatives. If the proposer insists, route to `hf-meta-builder` for exception documentation.

### When Naming Rules Themselves Need Updating
[Detection] A new lineage emerges, a prefix becomes ambiguous, or ecosystem conventions shift.
[Recovery] Document the proposed change in `references/naming-taxonomy.md`. Update this section's rules. Update SE-1 rename history. Bump version to 1.1.0. Add a dated note explaining the change. Do NOT silently change rules — every change must be traceable.

### When Validation Returns a False Positive
[Detection] A legitimate name (e.g., `stack-bun-pty`) fails regex due to an overly restrictive pattern.
[Recovery] First, verify the name truly follows the lineage prefix and domain-function pattern. If it does, update the regex pattern and document the edge case in the taxonomy. If it doesn't, mark it as an anomaly and add to the "Known Name Anomalies" table.

### When Two Skills in Different Lineages Have the Same Domain Name
[Detection] E.g., both `hm-router` and `hf-router` are proposed.
[Recovery] This is NOT a conflict — different lineages can share domain names. Validate both independently. Only flag if the skills overlap in function AND lineage, in which case the Conflict Resolution rules apply.

### When the Task Keeps Failing
[Detection] Validation returns FAIL for a name that appears correct. Regex doesn't match expected pattern but the name is well-formed.
[Recovery] STOP and verify the regex against `references/naming-taxonomy.md`. The regex may need updating. Check: (1) Is the lineage prefix correct? (2) Is the word count within bounds? (3) Are there any unexpected characters? If all pass but regex fails, the regex has a bug — fix it and document the edge case.

---

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Unprefixed Drifter** — creating a skill without any lineage prefix | Name doesn't start with hm-/hf-/gate-/stack- | Route to `hf-meta-builder` to determine correct lineage. Unprefixed is allowed ONLY for framework-agnostic skills. |
| **The Boundary Straddler** — an hm-* skill that primarily documents hf-* concepts | hm-* frontmatter with hf-* routes-to or consumed-by as the PRIMARY audience | Reclassify to correct lineage. If truly cross-lineage, document justification in frontmatter `consumed-by`. |
| **The Lazy Abbreviator** — using abbreviations like `cfg`, `mgr`, `svc` | Name contains 3-letter abbreviations | Expand to full words. `cfg` → `config`, `mgr` → `manager`. |
| **The Suffix Violator** — a L2 agent using -orchestrator suffix | L2 agent name ends in -orchestrator or -coordinator | Strip the suffix or promote to L0/L1 if the agent truly orchestrates/coordinates. |
| **The V2 Clinger** — adding numeric versions to names | Name contains numbers (e.g., `hm-debug2`, `hf-builder-v2`) | Use semantic differentiation: `hm-systematic-debug`, `hf-skill-author` instead. |

---

## Framework-Agnostic Paths

- Works across any OpenCode project regardless of language or framework
- Naming rules are about meta-concept structure, not project content
- Regex validation can be run as a standalone script (see `scripts/validate-naming.sh` in the workstream)
- Prefix rules are documented in AGENTS.md for discoverability by non-Hivemind agents
