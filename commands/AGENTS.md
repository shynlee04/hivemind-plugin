# /commands — OpenCode Command Contracts

## Responsibilities
- Store shipped slash-command projections as markdown files with frontmatter and structured sections.
- Represent command intent, routing context, process, and output contract in a form that mirrors OpenCode command concepts.
- Stay thin: the executable install/runtime logic belongs to `src/`, not to root markdown content.
- Reserve root `commands/` for bundle-backed or control-plane-adapter command assets.

## Rules
- Commands are thin OpenCode-facing projections, not runtime authority.
- Every command file must declare frontmatter at minimum: `description`, `agent`, and `subtask`.
- Keep command content focused on orchestration behavior, not implementation details of runtime modules.
- User-facing command assets must reference active governance artifacts such as `MASTER.active.md`, `task_plan.active.md`, and `progress.active.md` instead of legacy root planning files.
- Stable governance and SOT references inside command assets should use non-date-stamped authority paths.
- **If a command file is not referenced by `src/commands/slash-command/command-bundles.ts`, it does not belong in `commands/` as a live surface.**
- Command markdown may not rely on `.opencode/skills/**` shell pipelines or direct `.hivemind/**` mutation as hidden runtime engines.
- **User-space protection**: Commands operate in user-side spaces (`.hivemind/**`); any state mutations must use `context.ask()` for explicit user consent.

---

## Command Registry Status

### Registered Commands (10) — ACTIVE

These commands are backed by `SlashCommandBundle` entries in `src/commands/slash-command/command-bundles.ts`:

| Command | Agent | Purpose |
|---------|-------|---------|
| `hm-init` | hivefiver | Initialize control plane |
| `hm-doctor` | hivefiver | Repair broken control plane |
| `hm-harness` | hivefiver | Validate workflow readiness |
| `hm-settings` | hivefiver | Reconfigure control plane settings |
| `hm-research` | hiverd | Run research and synthesis workflow |
| `hm-plan` | hivefiver | Build structured implementation plan |
| `hm-implement` | hivefiver | Execute implementation workflow |
| `hm-verify` | hiveq | Run verification and review workflow |
| `hm-tdd` | hiveq | Enforce test-driven development flow |
| `hm-course-correct` | hivefiver | Recover or realign an active workflow |

---

## Noise/Disconnected Commands (33) — NOISE

These command files are NOT registered in `command-bundles.ts` and should be removed or never used:

### Hivefiver Subcommands (15) — NOISE

These are fake commands that don't exist in the bundle registry:

| Command | Reason |
|---------|--------|
| `hivefiver.md` | **VIOLATES RULES**: Contains `<enforcement>` blocks with shell scripts calling non-existent `.opencode/skills/hivefiver-*/scripts/`. This is a hidden runtime engine violation. |
| `hivefiver-start.md` | Not registered |
| `hivefiver-plan-spawn.md` | Not registered |
| `hivefiver-spec.md` | Not registered |
| `hivefiver-doctor.md` | Not registered |
| `hivefiver-discovery.md` | Not registered |
| `hivefiver-intake.md` | Not registered |
| `hivefiver-audit.md` | Not registered |
| `hivefiver-build.md` | Not registered |
| `hivefiver-continue.md` | Not registered |
| `hivefiver-architect.md` | Not registered |

### HiveRD Commands (6) — NOISE

| Command | Reason |
|---------|--------|
| `hiverd-synthesize.md` | Not registered |
| `hiverd-research.md` | Not registered |
| `hiverd-analyze.md` | Not registered |
| `hiverd-brainstorm.md` | Not registered |
| `hiverd-compare.md` | Not registered |

### HiveQ Commands (6) — NOISE

| Command | Reason |
|---------|--------|
| `hiveq-verify.md` | Not registered |
| `hiveq-gate-check.md` | Not registered |
| `hiveq-lint.md` | Not registered |
| `hiveq-regression.md` | Not registered |
| `hiveq-compliance.md` | Not registered |
| `hiveq-audit.md` | Not registered |

### HiveMind Commands (11) — NOISE

| Command | Reason |
|---------|--------|
| `hiveminder-orchestrate.md` | Not registered |
| `hivemind-status.md` | Not registered |
| `hivemind-scan.md` | Not registered |
| `hivemind-delegate.md` | Not registered |
| `hivemind-lint.md` | Not registered |
| `hivemind-debug-verify.md` | Not registered |
| `hivemind-clarify.md` | Not registered |
| `hivemind-compact.md` | Not registered |
| `hivemind-dashboard.md` | Not registered |
| `hivemind-debug-trigger.md` | Not registered |
| `hivemind-context.md` | Not registered |
| `hivemind-pre-stop.md` | Not registered |

---

## Why These Should Be Detached

1. **Violate AGENTS.md rules**: `hivefiver.md` uses shell scripts as hidden runtime engines
2. **No bundle backing**: Not registered in `command-bundles.ts`
3. **Misleading**: Appear to be valid commands but are never executed
4. **Non-existent skills**: `hivefiver.md` references `.opencode/skills/hivefiver-mode/` and `hivefiver-coordination/` which do not exist

## Do Not Reconnect

Do not reconnect these noise commands to the build:
- They reference non-existent skills and tools
- They bypass the bundle registry which is the runtime authority
- They violate the command markdown governance rules
- They create confusion about what is actually executable
