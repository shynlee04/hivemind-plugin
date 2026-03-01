---
name: hivefiver-mode
description: "Use at the start of every hivefiver turn to determine current stage, load correct command and workflow, and route references. Triggers on: session start, turn start, stage transition, 'what should I do next', context recovery."
---

# Hivefiver Mode Routing

Determine current stage and route to correct command + workflow + references.

## Stage Detection

Execute `scripts/route-stage.sh` with current working directory:

```bash
./scripts/route-stage.sh /Users/apple/hivemind-plugin
```

The script reads:
- `.hivemind/state/hierarchy.json` — Trajectory → Tactic → Action tree
- `.hivemind/hive-modules/hivefiver-v2/STATE.md` — Module state (if exists)

Output JSON:
```json
{
  "stage": "spec",
  "command": "/hivefiver spec",
  "workflow": ".opencode/workflows/hivefiver-spec.yaml",
  "refs": ["references/opencode-asset-authoring.md"]
}
```

## Stage → Command Mapping

| Stage | Command | Workflow | Primary Reference |
|-------|---------|----------|-------------------|
| `start` | `/hivefiver start` | `hivefiver-start.yaml` | governance-rules.md |
| `intake` | `/hivefiver intake` | `hivefiver-intake.yaml` | governance-rules.md |
| `spec` | `/hivefiver spec` | `hivefiver-spec.yaml` | asset-contracts.md |
| `architect` | `/hivefiver architect` | `hivefiver-architect.yaml` | asset-contracts.md |
| `build` | `/hivefiver build` | `hivefiver-build.yaml` | asset-contracts.md |
| `audit` | `/hivefiver audit` | `hivefiver-audit.yaml` | completion-criteria.md |
| `doctor` | `/hivefiver doctor` | `hivefiver-doctor.yaml` | completion-criteria.md |

## Progressive Disclosure Rules

Load references by depth:

- **L0**: Always present — skill name + description
- **L1**: On invoke — SKILL.md body (~500-2K tokens)
- **L2**: On complexity > 2 — domain references (~1K-5K)
- **L3**: Audit mode only — full reference bundle

## SOT Parent-Down Walk Algorithm

1. Read hierarchy.json root.trajectory.content
2. Walk: trajectory → tactic → action
3. Find deepest action with status !== "complete"
4. Map action content to stage keyword
5. If no match → default to `start`

## Self-Delegation Checkpoint Pattern

When stage requires continuation beyond current context:

1. Emit checkpoint: current stage, completed gates, next action
2. Self-delegate with mode = next stage
3. Preserve loaded skills across delegation

```yaml
delegation_packet:
  objective: "Continue from stage X to stage Y"
  in_scope_paths: [".opencode/skills/hivefiver-mode/**"]
  constraints: ["preserve loaded skills", "no recursive delegation"]
  required_outputs: ["stage_advance", "evidence"]
```

## Session-Based Delegation

For clean-context delegation, compose an `opencode run` command from route-stage.sh output:

```bash
# Get stage routing
ROUTE=$(./scripts/route-stage.sh "$(pwd)")
STAGE=$(echo "$ROUTE" | jq -r '.stage')
COMMAND=$(echo "$ROUTE" | jq -r '.command')

# Compose parsed prompt as workflow instruction
PROMPT="Load hivefiver-mode and hivefiver-coordination skills first.
Current stage: $STAGE
Execute: $COMMAND
Constraints: stay in .opencode/** and .hivemind/** only.
Quality gate: run quality-check.sh $STAGE before claiming completion."

# Delegate with clean session
opencode run --agent hivefiver --title "hivefiver:stage:$STAGE" "$PROMPT"
```

### Parsed Prompt Composition

The prompt IS the workflow instruction. Compose from:

1. **Skill loading directives** — which skills to load first
2. **Stage context** — current stage from SOT
3. **Command to execute** — the mapped command
4. **Constraints** — scope boundaries, permission limits
5. **Quality gate** — what to verify before completion
6. **Parent context** — 2-3 line summary from current session

### Permission Constraint Templates

Per-stage permission rulesets:

| Stage | Allowed Edits | Denied Edits | Task Delegation |
|-------|--------------|--------------|-----------------|
| start | `.hivemind/**` | `.opencode/**`, `src/**` | hivefiver only |
| intake | `.hivemind/**` | `.opencode/**`, `src/**` | hivefiver only |
| spec | `.hivemind/**`, `docs/**` | `.opencode/**`, `src/**` | hivefiver only |
| architect | `.opencode/**`, `.hivemind/**` | `src/**` | hivefiver only |
| build | `.opencode/**` | `src/**`, `tests/**` | hivefiver only |
| audit | none (read-only) | `*` | hivefiver only |
| doctor | `.opencode/**`, `.hivemind/**` | `src/**` | hivefiver only |

## Fallback Behavior

If SOT unreadable → output:
```json
{ "stage": "start", "command": "/hivefiver", "workflow": null, "refs": [] }
```

## Execution Protocol

1. Load this skill at turn start
2. **Run runtime-gate.sh pre-turn** (MANDATORY — non-negotiable):
   ```bash
   bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .
   ```
3. Execute route-stage.sh
4. Parse JSON output
5. Load indicated command + workflow + references
6. Execute or self-delegate based on stage requirements
7. **Run runtime-gate.sh post-turn** (MANDATORY — before claiming stage complete):
   ```bash
   bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
   ```
8. For pipeline-closing stages, **run runtime-gate.sh export**:
   ```bash
   bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh export .
   ```

### Runtime Enforcement Rationale

Forensic audit of session `ses_356f` (10,668 lines) proved that without mandatory runtime-gate invocation, agents skip ALL enforcement 100% of the time — 14 scripts existed, 12 were never executed, zero quality gates ran. The runtime-gate.sh is the unified enforcer that prevents this failure mode.

## References

Load required references from `references/` directory:
- opencode-asset-authoring.md — Agent/command/skill/permission schemas
- opencode-delegation-patterns.md — Context engineering, session API, quality gates
- session-delegation.md — Self-delegation API quick reference

Cross-reference from `hivefiver-coordination/references/`:
- governance-rules.md — Source of truth, parity, blocked patterns
- asset-contracts.md — Contract schemas for each asset type
- delegation-templates.md — Self-delegation packet templates
- completion-criteria.md — Per-stage completion checklists
