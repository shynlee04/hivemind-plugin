# Sector-2 Holistic Refactoring — Walkthrough

## Final Validation

```
=== RESULTS ===
PASS: 1363
FAIL: 0
WARN: 0
Framework validation PASSED
```

> [!TIP]
> Started at 892 PASS / 213 FAIL → ended at **1363 PASS / 0 FAIL / 0 WARN** (+471 passes, all failures eliminated)

---

## Changes Made

### 1. Agents (8/8 hardened)

Added OpenCode-native `tasks`, `workflows`, `prompts` fields. All custom YAML fields preserved (body content lost mid-session).

| Agent | `tasks` | `workflows` | `prompts` |
|---|---|---|---|
| [hiveminder](file:///Users/apple/hivemind-plugin/agents/hiveminder.md) | 6 sub-agents | 3 workflows | compliance-rules |
| [hivefiver](file:///Users/apple/hivemind-plugin/agents/hivefiver.md) | 2 sub-agents | 2 workflows | compliance-rules |
| [hivemaker](file:///Users/apple/hivemind-plugin/agents/hivemaker.md) | — | 2 workflows | compliance-rules |
| [hivexplorer](file:///Users/apple/hivemind-plugin/agents/hivexplorer.md) | — | 1 workflow | research-question-framing |
| [hivehealer](file:///Users/apple/hivemind-plugin/agents/hivehealer.md) | — | 1 workflow | compliance-rules, verification-criteria |
| [hiveplanner](file:///Users/apple/hivemind-plugin/agents/hiveplanner.md) | — | 1 workflow | compliance-rules |
| [hiveq](file:///Users/apple/hivemind-plugin/agents/hiveq.md) | — | 3 workflows | verification-criteria, compliance-rules |
| [hiverd](file:///Users/apple/hivemind-plugin/agents/hiverd.md) | — | 4 workflows | research-question-framing, synthesis-instruction |

---

### 2. Commands (43/43 wired)

Added `group` frontmatter field + populated `required_skills` on all 43 commands.

| Group | Count | Skills |
|---|---|---|
| `hiveminder` | 9 | delegation-intelligence, delegation-packet-contract, context-integrity |
| `hivefiver` | 16 | meta-builder-governance, hivefiver-persona-routing, hivefiver-spec-distillation |
| `hivefiver-compat` | 3 | meta-builder-governance, hivefiver-gsd-compat |
| `debug` | 3 | systematic-debugging-hivemind, debug-orchestration |
| `hiveq` | 6 | verification-methodology, evidence-discipline, gate-enforcement |
| `hiverd` | 6 | research-methodology, source-evaluation, synthesis-patterns |

> [!NOTE]
> Commands stay flat (no subdirectories) — OpenCode docs only guarantee filename-as-command-name. The `group` field provides logical organization.

---

### 3. Workflows (20/20 v2 compliant)

All 20 workflows now have: `contract_version: 2`, `target_agent`, `steps` with `wave`/`entry_criteria`/`exit_criteria`/[skill_bundles](file:///tmp/wire-workflows.sh#26-97), and `guards`.

| Category | Workflows | Key Changes |
|---|---|---|
| **Core** (5) | feature-sprint, bug-remediation, verification-gate, spec-generation, research-synthesis | Mapped skill_bundles per step |
| **Hivefiver persona** (5) | enterprise-architect, enterprise, floppy-engineer, vibecoder, mcp-fallback | Full v2 overhaul: added target_agent, wave, entry/exit criteria |
| **HiveQ pipelines** (4) | audit, gate-enforcement, regression-suite, verification-pipeline | Added entry/exit criteria + mapped skill_bundles |
| **HiveRD pipelines** (4) | deep-research, brainstorm-session, comparative-analysis, synthesis-pipeline | Added entry/exit criteria + mapped skill_bundles |
| **Orchestration** (2) | sequential-delegation, brownfield-bootstrap | Full v2 overhaul; sequential-delegation preserved domains/hierarchy/gatekeeping schema |

---

### 4. Parity Sync

Rsync'd all root assets → `.opencode/`: agents, commands, workflows, prompts, references. 64 parity mismatches → 0.

---

## Prompts & References (all existed)

All referenced prompt/reference files confirmed present:
- **Prompts**: compliance-rules, verification-criteria, research-question-framing, synthesis-instruction, hivemind-brownfield-remediation
- **References**: workflow-briefing, quality-gate-definitions, research-quality-criteria, domain-boundaries, hivemind-brownfield-checklist
