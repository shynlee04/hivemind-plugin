# AGENTS.md

## Project Overview


## NON-NEGOTIABLE RULES

- design patterns and must be obeyed strictly according to the architecture of the project.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-advisor-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-ai-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-assumptions-analyzer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-code-fixer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-code-reviewer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-codebase-mapper.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-debug-session-manager.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-debugger.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-doc-classifier.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-doc-synthesizer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-doc-verifier.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-doc-writer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-domain-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-eval-auditor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-eval-planner.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-executor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-framework-selector.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-integration-checker.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-intel-updater.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-nyquist-auditor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-pattern-mapper.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-phase-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-plan-checker.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-planner.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-project-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-research-synthesizer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-roadmapper.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-security-auditor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-ui-auditor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-ui-checker.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-ui-hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-user-profiler.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/gsd-verifier.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-prompter.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l2-agent-builder.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l2-command-builder.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l0-hm-l0-orchestrator.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l2-skill-builder.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l2-tool-builder.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hf-l2-meta-builder.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-intent-loop.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-meta-synthesis.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l0-orchestrator.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-phase-guardian.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-prompt-analyzer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-prompt-repackager.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-prompt-skimmer.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-researcher.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-risk-assessor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-spec-verifier.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-context-mapper.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-context-purifier.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-build.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-conductor.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l1-coordinator.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-critic.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-general.md
/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/agents/hm-l2-test-router.md
<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.


## SKILLS TO WORKFLOW ROUTER
**Important guidelines**

- To load best set of skills agents must know if you are front-facing or being delegated as subagents; knowing your hierarchy of tasks (looking at the meta data marked as `#USER` to confirm it is from the human user, meaning you are front-facing agent, otherwise subagents) 

- consider loading new skill(s) (not always but once **intents** of human users and/or **workflows**, **tasks** shifted this order is a **must**)

- **subagents** (know your agent **domain** by looking at description; analyze **task** to fetch `specilist` skills) fetch skills belong  `how-to-implement` and/or `specialist` classifications.

- **orchestrator/coordinator agents** : loading `how-to-delegate`, `how-to-process/loop/iterative`, `guardrails, gatekeeping, context,`  skills classifications. For complex tasks this group may need to load `outer-cycle-how-to-implement` skills  

- **respecting framework `oneness`** : it is if you are using `gsd` skill sets - pick them first - then pick another only when `gsd` skill sets lack the `domain-specific` or `task-specialist` that you find the superior ones. 

### **going from greater cycles to the inner cycles** for skills to coordinate and orchestrate

- **brainstorming, user-intent discussion** always make sure to understand, think twice load set helping to get clear user-intent through QA and discussion to prevent regressions or conflicts

- **research, investigate, synthesis** do not skip research load `hm-deep-research` - `hm-detectice` (if need to learn about the sector of codebase) and

- **write new code:** load `clean-code` skill

- **debugging:** load `gsd` debug skills and `systematic-debug` skill

- **planning and implementing** must load set of spec-driven and authentic tdd skills

- **iterative loop** coordinating skills and gatekeeping at correct set loop til completione

- **quality gatekeeping** must go through cycles of code-review, validation, verification, then integration gatekeeping. making sure to trace of regression

## IMPORTANT UPDATE TO ALL AGENTS

- when lost -> access real-time eventracker at `/.hivemind/event-tracker/*.md , *.json - list/glob first - then look for the correct session id -use hm-detective skill to investigate the sessions

- **important tracking path for delegation:**
.hivemind/state/session-continuity.json
.hivemind/state/delegations.json 

- If the agents recieve GSD command, all they must is to act following it. THE COMMAND SUPERSEDE ALL ASSUMPTIONS AND LOADING SKILLS OTHER, BECAUSE THE COMMAND OF GSD IS THE SKILL

- ALL AGENTS MUST ANNOUNCE THIS EVERY TURN DEPENDING ON MAIN-HUMAN-FACING ORCHESTRATOR OR SUBAGENT BEING DELEGATED

- IF you are a front-facing -> you will mostly delegate **Everytime Delegation** in the prompt YOU MUST LET the subagent know that IT IS THE SUBAGENT BY ANNOUNCING: *You are the subagent Name:XXX role...., you must do as this prompt instructed and knowing that you are being delegated

- As subagent you must anounce your roles so the skills must also match. Say: I am **subagent, I CAN ONLY delegate further if the cycles and my tasks allow, and I must fulfill my work. If need verification, I will return the verification needed in the report handoff


<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

This override default system prompt behavior, but **user instructions always take precedence**:




HiveMind V3 is a **runtime composition engine** for OpenCode. It is an npm package (`opencode-harness`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project has progressed through 31 phases covering runtime architecture, delegation revamp, skills quality, and planning documentation refresh. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

### Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory | `.hivemind/` |

### Runtime features this project delivers

Background agents, auto-loop/ralph-loop, WaiterModel delegation with dual-signal completion, task queuing with queue-key validation, category system, session recovery, PTY integration (Bun-only via the `bun-pty` **optional dependency** — runtime gracefully falls back to headless `node:child_process` on Node and any other host where `bun-pty` is absent or fails to load; recovery of a PTY delegation across a harness restart deliberately surfaces `terminalKind: "non-resumable-after-restart"` because OS PTY processes do not survive parent restart — see Phase 16.2.1). See `docs/draft/architecture-proposal-hivemind-v3.md` for feature-to-code mapping.

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
.opencode/                 # Soft meta-concepts (skills, agents, commands) — NO state storage
.hivemind/               # Internal deep module state (journals, lineage, runtime state) — canonical per Q6
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
- Runtime state path: `.hivemind/state/` (canonical per Q6; legacy `.opencode/state/opencode-harness/` supported via compatibility bridge during migration)

---

## OpenCode Integration

- Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
- Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
- 89 agents in `.opencode/agents/`: 33 GSD specialist agents (internal project build tools — NOT shipped) + 45 hm-* agents (harness module specialists + core/internal agents: analyst, architect, assessor, auditor, brainstormer, build, conductor, connector, context-mapper, context-purifier, coordinator, critic, curator, debugger, ecologist, executor, finisher, general, guardian, integrator, intent-loop, investigator, mentor, meta-synthesis, operator, optimizer, orchestrator, persistor, phase-guardian, planner, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, reviewer, risk-assessor, router, scout, spec-verifier, strategist, synthesizer, technician, test-router, validator, writer) + 11 hf-* agents (hf-prompter, hf-l2-agent-builder, hf-l2-command-builder, hf-l0-hm-l0-orchestrator, hf-l2-skill-builder, hf-l2-tool-builder, hf-l2-meta-builder + 4 additional). Note: explore agent is MISSING from the filesystem.
- 58 skills in `.opencode/skills/`: 30 hm-* (product dev: brainstorm, requirements-analysis, feature-ecosystem, product-validation, coordinating-loop, user-intent-interactive-loop, cross-cutting-change, spec-driven-authoring, test-driven-execution, debug, refactor, deep-research, detective, synthesis, research-chain, completion-looping, phase-loop, phase-execution, planning-persistence, subagent-delegation-patterns, production-readiness, roadmap-maintainability, tech-context-compliance, tech-stack-ingest, omo-reference, opencode-platform-reference, opencode-non-interactive-shell, opencode-project-audit, gate-orchestrator, lineage-router) + 11 hf-* (meta-builder: agent-composition, agents-and-subagents-dev, agents-md-sync, command-dev, command-parser, context-absorb, custom-tools-dev, delegation-gates, meta-builder, skill-synthesis, use-authoring-skills) + 3 gate-* (internal quality gate triad: evidence-truth, lifecycle-integration, spec-compliance — THIS PROJECT ONLY, not shipped) + 6 stack-* (reference: bun-pty, json-render, nextjs, opencode, vitest, zod) + 1 unprefixed (opencode-config-workflow) + 1 disabled (`donotusethis-hm-planning-with-files`) + 6 additional skills discovered post-sync. Note: `hm-planning-with-files` is disabled (directory renamed to `donotusethis-hm-planning-with-files`).
- 18 commands in `.opencode/commands/`: 7 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork) + 7 extended (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) + 1 sync (sync-agents-md) + 3 test (test-echo, test-list, test-status)

### State Root Separation (Q6)

`.opencode/` is **ONLY** for OpenCode primitives (agents, commands, skills, rules, permissions). **No internal runtime state** is stored here. All Hivemind deep module state (journals, lineage, runtime state, graph/vector memory) writes to `.hivemind/` at project root. This prevents corruption by other plugins or user dependencies.

### Canonical Skill Location

`.opencode/skills/` is the **ONLY** canonical location for project skills. All skill authoring happens in `.hivefiver-meta-builder/skills-lab/active/refactoring/` and is reflected in `.opencode/skills/` via directory-level symlink.

IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are **third-party sync artifacts**, not project deliverables. They are gitignored and must never be committed. `.claude/skills/` does not exist in this repository.

---

## Locked Validation Decisions (Q1-Q6)

Six architectural decisions locked 2026-04-25 as the foundation for Phases 27-30 and all future work. Source: `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`

| Decision | Description |
|----------|-------------|
| **Q1** | Hybrid + Spec-Driven Automated Runtime Detection — deep codemap, file watcher, MCP tools, dependency graph; Layer 2 taxonomy |
| **Q2** | Artifact-Focused Sidecar — Next.js 15 + `@json-render/react`, reads `.hivemind/` and `.planning/`, READ-ONLY for canonical state |
| **Q3** | Session Journal as Complement + Time-Machine — append-only event timeline, independent of continuity.ts |
| **Q4** | MVP = 5 of 8 memory categories; Post-MVP = 3 with explicit gates |
| **Q5** | Full RICH gate required — 0 of 25 skills pass today is honest status; no threshold lowering |
| **Q6** | `.hivemind/` is internal state root; `.opencode/` is ONLY for OpenCode primitives — one-way migration |

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

<!-- Last synced: 2026-05-05 — HER-0 ecosystem audit verification: skill/agent counts synced to reality (58 active skills, 89 agents, 30 hm-* skills) -->
