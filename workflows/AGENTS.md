# /workflows — Disconnected Workflow Definitions

## Status: LEGACY/NOISE — Disconnected from Current Build

## Classification

All YAML workflow files in this directory are **LEGACY/NOISE** and should not be used.

### Reason

1. **Not referenced by command bundles**: `command-bundles.ts` does not reference any workflow YAML files
2. **Reference non-existent tools**: Workflows define `tool: hivefiver-*` entries (e.g., `hivefiver-specforge`, `hivefiver-gsd-bridge`) that don't exist
3. **Reference non-existent skills**: Workflows reference `skill_bundles` like `hivefiver-persona-routing`, `meta-builder-governance` that don't exist in `.opencode/skills/`
4. **No runtime consumer**: No code in `src/` consumes these workflow YAML files

---

## Workflow Files (22) — All NOISE

| File | Target Agent | Issue |
|------|--------------|-------|
| `hivefiver-enterprise.yaml` | hivefiver | References non-existent tools/skills |
| `hivefiver-enterprise-architect.yaml` | hivefiver | References non-existent tools/skills |
| `hivefiver-floppy-engineer.yaml` | hivefiver | References non-existent tools/skills |
| `hivefiver-vibecoder.yaml` | hivefiver | References non-existent tools/skills |
| `hivefiver-mcp-fallback.yaml` | hivefiver | References non-existent tools/skills |
| `hiverd-synthesis-pipeline.yaml` | hiverd | Disconnected from current architecture |
| `hiverd-deep-research.yaml` | hiverd | Disconnected from current architecture |
| `hiverd-brainstorm-session.yaml` | hiverd | Disconnected from current architecture |
| `hiverd-comparative-analysis.yaml` | hiverd | Disconnected from current architecture |
| `hiveq-regression-suite.yaml` | hiveq | Disconnected from current architecture |
| `hiveq-verification-pipeline.yaml` | hiveq | Disconnected from current architecture |
| `hiveq-audit-workflow.yaml` | hiveq | Disconnected from current architecture |
| `hiveq-gate-enforcement.yaml` | hiveq | Disconnected from current architecture |
| `sequential-delegation-workflow.yaml` | ? | Unknown purpose, disconnected |
| `verification-gate.yaml` | ? | Unknown purpose, disconnected |
| `spec-generation.yaml` | ? | Unknown purpose, disconnected |
| `research-synthesis.yaml` | ? | Unknown purpose, disconnected |
| `hivemind-brownfield-bootstrap.yaml` | ? | Unknown purpose, disconnected |
| `feature-sprint.yaml` | ? | Unknown purpose, disconnected |
| `composed-workflow.yaml` | ? | Unknown purpose, disconnected |
| `bug-remediation.yaml` | ? | Unknown purpose, disconnected |

---

## Why These Should Be Detached

1. **No runtime path**: The current architecture uses `command-bundles.ts` for command execution, not workflow YAML files
2. **Broken references**: All `hivefiver-*` tools and skill bundles referenced don't exist
3. **Legacy design**: These appear to be from an older architecture that has been superseded
4. **Misleading**: Creates confusion about what workflow system is actually used

## Do Not Reconnect

Do not reconnect these workflows to the current build:
- They are from a deprecated architecture
- The current architecture uses command bundles and agent dispatch
- No migration path exists between this YAML format and command bundles
- These would require significant work to make functional and are not worth the effort
