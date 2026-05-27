---
description: "Initialize a new Hivemind-powered project structure with namespaces, directories, and standard config files."
---

# hm-init-project

## Goal
Establish a new Hivemind-powered project workspace containing standard directories, templates, references, and default composition configuration.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Composition Root | hm-orchestrator | Coordinate folder structure initialization and default state validation |

## Execution Phases
1. **Directory Structure**: Create target directories if they do not exist:
   - `.opencode/command/`
   - `.opencode/workflows/`
   - `.opencode/skills/`
   - `.hivemind/templates/`
   - `.hivemind/references/`
   - `.planning/`
2. **Gitkeep Persistence**: Write `.gitkeep` to all subfolders to preserve git tracking.
3. **Configuration**: Generate standard `opencode.json` and `.hivemind/state/config-workflows.json`.
4. **Validation**: Run checklist to verify all folders are tracked.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `human-verify` | Verify directory listing matches target workspace structure |

## Exit Criteria
- Directory structure fully established.
- `.gitkeep` files written and staged.
- Standard configuration files compiled successfully.
