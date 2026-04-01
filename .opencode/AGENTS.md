# .opencode — Harness Configuration

Runtime config for the OpenCode harness. Loaded by `opencode.json` at session start.

## STRUCTURE

```
.opencode/
├── agents/              # Specialist agent prompt definitions
│   ├── conductor.md     # Orchestrator — routes, never builds
│   ├── builder.md       # Code implementer — reads, edits, writes, tests
│   ├── researcher.md    # Read-only investigator — reads, greps, globs, web
│   └── critic.md        # Quality verifier — reads, greps, runs tests
├── commands/            # Slash commands (/plan, /start-work, etc.)
│   ├── plan.md          # Structured planning workflow
│   ├── start-work.md    # Begin implementation from plan
│   ├── deep-init.md     # Deep AGENTS.md generation (this init-deep)
│   ├── harness-doctor.md # Diagnose harness health
│   └── ultrawork.md     # Focused execution mode
├── plugins/
│   └── harness-control-plane.ts  # Re-exports HarnessControlPlane from dist
├── rules/
│   └── harness-rules.md # Injected into every session via opencode.json instructions
├── skills/              # Knowledge loaded on-demand
│   ├── harness-overview/    # Architecture quick-ref
│   ├── planning-with-files/ # File-based planning methodology
│   ├── shell-safety/        # Non-interactive shell patterns
│   └── wisdom-accumulation/ # Cross-session learning via .harness/wisdom/
├── state/
│   └── opencode-harness/    # Runtime state dir (continuity JSON lives here)
└── tools/
    └── context-checkpoint.ts # Session checkpoint save/restore
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Change agent behavior/prompts | `agents/<agent>.md` — each is a full system prompt |
| Add a new slash command | `commands/<name>.md` — auto-discovered by OpenCode |
| Change session-wide rules | `rules/harness-rules.md` — injected into ALL agents |
| Change plugin registration | `plugins/harness-control-plane.ts` + root `opencode.json` |
| Change skill knowledge | `skills/<name>/SKILL.md` — each is a self-contained reference |
| Change state storage path | `state/opencode-harness/` — continuity JSON file location |

## CONVENTIONS

- **Agent prompts** are markdown files with behavioral rules (NEVER/ALWAYS directives)
- **Conductor** never edits files directly — routes to builder/researcher/critic only
- **Each agent** has explicit tool allowlists and denylists matching `src/lib/helpers.ts` restriction tables
- **Rules** in `harness-rules.md` are NON-NEGOTIABLE — loaded into every session via `opencode.json.instructions`
- **Skills** use progressive disclosure — SKILL.md entry point, references/ for detail
- **State dir** is the runtime persistence location — do not commit contents

## ANTI-PATTERNS

- **NEVER** edit `plugins/harness-control-plane.ts` logic — it re-exports from `dist/`. Change `src/plugin.ts` instead, then rebuild.
- **NEVER** add agent tool restrictions only in agent `.md` files — must also update `src/lib/helpers.ts` + `src/plugin.ts` permission factory (4 locations total, see root AGENTS.md)
- **NEVER** modify `state/` contents manually — all mutations go through `src/lib/continuity.ts`

## NOTES

- `opencode.json` at repo root wires this together: `instructions` → rules, `plugin` → plugins + superpowers
- Agent definitions reference the same specialist agents as `VALID_AGENTS` in `src/lib/types.ts`
- The `harness-doctor` command can diagnose mismatches between agent configs and code restriction tables
