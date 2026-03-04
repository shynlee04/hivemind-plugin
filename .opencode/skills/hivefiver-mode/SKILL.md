---
name: hivefiver-mode
description: "Second direct hivefiver entry skill. Use after hivefiver-prime to determine current stage, load the correct helper skill, and route references with bounded context."
---

# Hivefiver Mode Routing

Determine current stage and route to correct command + workflow + references.

## Stage Detection

Determine stage using one of two paths:

1) If bash is allowed, run `scripts/route-stage.sh` directly.

```bash
./scripts/route-stage.sh /Users/apple/hivemind-plugin
```

2) If bash is denied (common for hivefiver), delegate to `hivexplorer` and request the script output JSON with evidence.

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

For clean-context delegation, compose an `opencode run` command from route-stage output.
Use this direct shell path only when bash is explicitly allowed in the session.
In default blind mode, request `hivexplorer` evidence for stage routing and delegate without local shell execution.

```bash
# Get stage routing
ROUTE=$(./scripts/route-stage.sh "$(pwd)")
STAGE=$(echo "$ROUTE" | jq -r '.stage')
COMMAND=$(echo "$ROUTE" | jq -r '.command')

# Compose parsed prompt as workflow instruction
PROMPT="Load hivefiver-prime first, then hivefiver-mode.
Current stage: $STAGE
Execute: $COMMAND
Constraints: stay in .opencode/** and .hivemind/** only.
Then load only the stage helper skill (hivefiver-coordination when gate checks are required).
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

1. Load this skill after `hivefiver-prime`
2. Obtain stage route JSON (direct bash OR delegated `hivexplorer` evidence)
3. Parse route output and determine stage
4. Load only the helper skill required for that stage (usually one)
5. Execute or self-delegate based on stage requirements
6. Before claiming completion, verify stage outputs through `hivexplorer`
7. For pipeline-closing stages, ensure handoff/export artifact is created

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
