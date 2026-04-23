# AGENTS.md

## Project Overview

## NOTICE BOARD



## IMPORTANT UPDATE TO ALL AGENTS

- If the agents recieve GSD command, all they must is to act following it. THE COMMAND SUPERSEDE ALL ASSUMPTIONS AND LOADING SKILLS OTHER, BECAUSE THE COMMAND OF GSD IS THE SKILL

- ALL AGENTS MUST ANNOUNCE THIS EVERY TURN DEPENDING ON MAIN-HUMAN-FACING ORCHESTRATOR OR SUBAGENT BEING DELEGATED

- IF you are a front-facing -> you will mostly delegate **Everytime Delegation** in the prompt YOU MUST LET the subagent know that IT IS THE SUBAGENT BY ANNOUNCING: *You are the subagent Name:XXX role...., you must do as this prompt instructed and knowing that you are being delegated

- As subagent you must anounce your roles so the skills must also match. Say: I am **subagent, I can't delegate further, and I must fulfill my work. If need verification, I will return the verification needed in the report handoff


<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

This override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority



HiveMind V3 is a **runtime composition engine** for OpenCode. It is an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails.

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

### Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |

### Runtime features this project delivers

Background agents, auto-loop/ralph-loop, WaiterModel delegation with dual-signal completion, task queuing with queue-key validation, category system, session recovery, PTY integration (lazy-loaded bun-pty with graceful fallback). See `docs/draft/architecture-proposal-hivemind-v3.md` for feature-to-code mapping.

---

## Setup Commands

```bash
npm install                    # Install dependencies
npm run build                  # Clean + compile TypeScript to dist/
npm run typecheck              # Type-check without emitting
npm run test                   # Run all tests (vitest)
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report (src/**/*.ts)
```

- Requires Node.js >= 20.0.0
- Peer dependency: `@opencode-ai/plugin` >= 1.1.0
- No environment variables required for build/test
- Runtime state overrides: `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`

---

## Project Structure

```
src/
├── plugin.ts                  # Composition root
├── index.ts                   # Public API re-exports
├── hooks/                     # Event hook factories
├── tools/                     # Plugin tools
│   ├── delegate-task.ts       # DelegationManager-backed delegation tool
│   ├── delegation-status.ts   # Delegation status polling and result retrieval
│   ├── prompt-skim/           # Prompt skimming tool
│   ├── prompt-analyze/        # Prompt analysis tool
│   └── session-patch/         # Session patching tool
└── lib/                       # Core library modules
    ├── types.ts               # Shared types + constants (leaf — no imports)
    ├── task-status.ts         # Task status transitions + guards
    ├── state.ts               # In-memory Maps (sessionStats, rootBudgets)
    ├── helpers.ts             # Pure utilities only
    ├── concurrency.ts         # Keyed semaphore (FIFO queue)
    ├── continuity.ts          # Durable JSON persistence (~401 LOC)
    ├── session-api.ts         # Typed OpenCode SDK wrappers
    ├── runtime.ts             # Event→status mapping
    ├── completion-detector.ts # Two-signal completion detection
    ├── notification-handler.ts # Async completion notification
    ├── lifecycle-manager.ts   # Session lifecycle state machine (~152 LOC, STUB)
    ├── runtime-policy.ts      # Trusted runtime policy loading and resolution
    ├── delegation-manager.ts  # Core delegation orchestrator
    └── delegation-persistence.ts # Delegation record persistence helper
shared/                      # Cross-cutting tool utilities
    ├── tool-response.ts      # Standard tool response envelope
    └── tool-helpers.ts       # Tool helper conventions
schema-kernel/                # Zod schemas for prompt-enhance pipeline
    ├── index.ts              # Schema re-exports
    └── prompt-enhance.schema.ts  # Prompt skim/analyze/patch schemas

tests/lib/                     # Unit tests (vitest, globals: true)
tests/tools/                   # Tool-focused unit tests
.opencode/                 # Soft meta-concepts (skills, agents, commands)
```

### Dependency rules (non-negotiable)

- `types.ts` is leaf — depends on nothing
- `helpers.ts`, `concurrency.ts`, `completion-detector.ts` — leaf or near-leaf
- `lifecycle-manager.ts` depends on most modules (deepest chain: 2 levels)
- No circular dependencies
- Max module size: 500 LOC
- `delegation-persistence.ts` — depends on `types.ts`, `continuity.ts` (delegation record I/O)

### Where to find things

| Task | File |
|------|------|
| Change session persistence format | `src/lib/continuity.ts` |
| Add a lifecycle phase | `src/lib/types.ts` + `src/lib/lifecycle-manager.ts` |
| Change SDK call patterns | `src/lib/session-api.ts` |
| Change concurrency model | `src/lib/concurrency.ts` |
| Change delegation behavior | `src/lib/delegation-manager.ts` — DelegationManager class (WaiterModel dispatch, dual-signal completion) |
| Change delegate-task tool | `src/tools/delegate-task.ts` — dispatch tool wrapper |
| Check delegation status | `src/tools/delegation-status.ts` — status polling tool |
| Change completion detection | `src/lib/completion-detector.ts` |
| Change task status transitions | `src/lib/task-status.ts` |
| Change agent config (temperature, tools) | `src/plugin.ts` — `AGENT_DEFAULTS`, `AGENT_TOOLS` |
| Change circuit breaker / tool budget | `src/plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |
| Persist delegation records | `src/lib/delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()` |
| Change tool response envelope | `src/shared/tool-response.ts` — standard response wrapper |
| Change prompt-enhance schemas | `src/schema-kernel/prompt-enhance.schema.ts` — Zod schemas for skim/analyze/patch |

---

## Testing Instructions

- Run all tests: `npm test`
- Run single test file: `npx vitest run tests/lib/helpers.test.ts`
- Run tests matching pattern: `npx vitest run -t "<test name>"`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage` — covers `src/**/*.ts`, excludes `src/index.ts`
- Test files live in `tests/lib/` and `tests/tools/` — mirror `src/lib/` and `src/tools/`
- Tests use vitest globals (no imports needed for `describe`, `it`, `expect`)
- **Type-check before committing:** `npm run typecheck`

---

## Code Style

- TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`)
- ES2022 target, NodeNext module resolution
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- Deep-clone-on-read in continuity store
- `[Harness]` prefix on all thrown errors
- Dual-layer state: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`)
- No `any` types on new code
- Max module size: 500 LOC

---

## Build and Deployment

- Build: `npm run build` — compiles `src/` → `dist/` with declarations + source maps
- Package entrypoints:
  - `opencode-harness` → `./dist/index.js`
  - `opencode-harness/plugin` → `./dist/plugin.js`
- Prepack runs build automatically: `npm pack` / `npm publish`
- Runtime state path: `.opencode/state/opencode-harness/` (outside package source)

---

## OpenCode Integration

- Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
- Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
- 57 agents in `.opencode/agents/`: 6 core (coordinator, conductor, researcher, builder, critic, explore) + 30+ GSD specialist agents + 21 hivefiver/meta agents
- 22 skills in `.opencode/skills/`: 5 core (meta-builder, coordinating-loop, planning-with-files, use-authoring-skills, user-intent-interactive-loop) + 17 extended (agent-authorization, command-dev, custom-tools-dev, harness-audit, hm-deep-research, hm-detective, hm-synthesis, hf-context-absorb, gsd-agent-composition, agents-and-subagents-dev, command-parser, harness-delegation-inspection, oh-my-openagent-reference, opencode-non-interactive-shell, opencode-platform-reference, session-context-manager, phase-loop)
- 13 commands in `.opencode/commands/`: 6 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, ultrawork) + 7 extended (hf-absorb, hf-audit, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack, harness-audit)

### Canonical Skill Location

`.opencode/skills/` is the **ONLY** canonical location for project skills. All skill authoring happens in `.hivefiver-meta-builder/skills-lab/active/refactoring/` and is reflected in `.opencode/skills/` via directory-level symlink.

IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are **third-party sync artifacts**, not project deliverables. They are gitignored and must never be committed. `.claude/skills/` does not exist in this repository.

---

## Architecture Rules (from architecture-proposal-hivemind-v3.md)

### Script rule
A script should **REPORT FACTS** and **LEAVE JUDGMENT TO THE AGENT**. Pure helpers only (exit 0, no governance). No hardcoded paths, no state mutation outside CQRS tools.

### Anti-patterns to avoid
- Static `.md` files acting as agent definitions (they are templates/references only)
- Bash scripts outside `bin/` CLI substrate
- Governance scripts that block progression (facts only)
- Feature bloat: keep modules under 500 LOC, total codebase target ~4,000-5,000 LOC
- Skill proliferation: target ~20 SKILL.md files, not hundreds

### Target architecture (from proposal)
5 tools (~500 LOC total), hooks (~800 LOC), lifecycle (~400 LOC), delegation (~400 LOC), continuity (~400 LOC), CLI substrate (~500 LOC), control-plane (~400 LOC), shared (~800 LOC).

---

## Git Commit Discipline

- Commit message format: `phase: what changed — why it matters`
- Commit after each meaningful change (subagent returns, phase completes, gate passes)
- Never accumulate changes across multiple phases without committing
- Agents may only manage commits for their own work — they do not constrain or override commits from other development activity

---

## Terminology

| Use | Not |
|-----|-----|
| Harness | Framework, system |
| Agent (specialist: researcher/builder/critic) | Claude, AI, model |
| Skill | Prompt, instruction |
| Runtime composition | Static definition |
| Delegation packet | Task assignment |

<!-- GSD:profile-start -->
## Developer Profile

> Generated by GSD from session_analysis. Run `/gsd-profile-user --refresh` to update.

| Dimension | Rating | Confidence |
|-----------|--------|------------|
| Communication | mixed | LOW |
| Decisions | fast-intuitive | LOW |
| Explanations | concise | LOW |
| Debugging | fix-first | UNSCORED |
| UX Philosophy | backend-focused | LOW |
| Vendor Choices | pragmatic-fast | UNSCORED |
| Frustrations | scope-creep | UNSCORED |
| Learning | self-directed | LOW |

**Directives:**
- **Communication:** Adapt communication style to context — accept terse directives for execution, provide structured responses when the developer establishes context. When uncertain, match the developer's current message length and formality.
- **Decisions:** Present recommendations directly and proceed quickly when accepted — this developer makes execution decisions fast. If a decision has significant architectural impact, briefly note the stakes before proceeding but do not over-deliberate.
- **Explanations:** Provide brief explanations of approach alongside code. Focus on architectural decisions and their impact. Skip conceptual background unless the developer explicitly asks. When in doubt, ask if more detail is needed.
- **Debugging:** No strong preference detected. Ask the developer when this dimension is relevant.
- **UX Philosophy:** Focus on backend architecture, code quality, and system design. No UI/UX polish needed for current work. If the project shifts to frontend, ask the developer about their UX preferences.
- **Vendor Choices:** No strong preference detected. Ask the developer when this dimension is relevant.
- **Frustrations:** Stay within stated scope and deliver honest assessments. Do not overstate capabilities or add unrequested features. When presenting work, be factual about what was delivered versus what was promised.
- **Learning:** Provide code and architectural details for independent assessment. Ask targeted questions rather than offering walkthroughs. When the developer explores a new domain, offer concise references and let them direct the learning pace.
<!-- GSD:profile-end -->
