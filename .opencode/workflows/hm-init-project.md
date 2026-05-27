---
description: "Project initialization workflow: directory check → structure setup → config generation → verification."
---

# hm-init-project

## Goal
Establish a structured project directory format with namespace rules, gitkeep trackers, and config templates.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Setup | hm-orchestrator | Reads arguments, creates directories, generates defaults |

## Execution Phases
1. **Initialize**: Check if `.opencode/`, `.hivemind/`, and `.planning/` directories exist.
2. **Directory Creation**: Generate required subdirectories:
   - `.hivemind/state/`, `.hivemind/templates/`, `.hivemind/references/`
   - `.planning/phases/`, `.planning/codebase/`, `.planning/specs/`
3. **Tracking Setup**: Create `.gitkeep` files in every newly created directory to ensure git tracks them.
4. **Config Boilerplate**: Copy default `opencode.json` and `.hivemind/governance/config.json` config if missing.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `human-verify` | Verify directory listing and files on disk |

## Output Contract
- Directory structure registered
- `.gitkeep` trackers present
- Default configurations initialized
