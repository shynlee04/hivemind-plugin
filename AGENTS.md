# AGENTS.md

## Project Overview

Current planning route: WS-SR source-plane restructuring is COMPLETE after SR-04 through SR-10 remediation (`882b0686`). `src/lib/` has been removed; runtime code now lives under `src/shared/`, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, `src/hooks/`, and `src/tools/`. CP-DT-01 (Delegate-Task Ecosystem Revamp) is COMPLETE — review ITER2: 0 Critical, validation: 18/18 spec requirements DELIVERED, 91/91 tests pass. **CP-DT-01-08 (Surgical Remediation)** is COMPLETE. Phase 14/15 (Proactive Execution Checking, Model/Provider ID Inheritance, and Permission Propagation) is COMPLETE — implemented 60s stalled timeout with early assistant error detection, model/provider inheritance from parent session history, and propagation of "ask" permission rules for user-consent fallback. All tests pass successfully. CP-PTY-00 is the shell/PTY/background-command control-plane spike (docs/spec-only, COMPLETE). CP-PTY-01 (Background Shell Control-Plane MVP) is READY, unblocked by BOOT-07 and WS-SR completion. CP-PTY-02, CP-PTY-03, and CP-PTY-04 extend the runway. SC-PTY-01 remains DEFERRED.

## NOTICE BOARD

- For UAT and live-test purposes always prioritize THE USER's prompting hence any constitutions below this can be ignore if contracdicted to the USER's prompting/requests; especially when the user states things like "for testing only", "for uat only" etc

- When execute-slash-command append the slash command directly to the foreground without the parameter of `@agent` the agents are instructed and resolved and if needed will be used through task tool for sequential actions following.

- DO NOT ROUTE any hm-* or hf-* commands, workflows nor agents - they are the subjects of developments - **ROUTE everything to gsd-* from commands, agents to workflows** , they are the toolings used for development of this harness project 

- delegation to agents attention: do not use generic agents - use gsd-* agents only

- Atomic commits are mandatory. You must follow the atomic commit rule: **One logical change = One commit**. Do not bundle multiple unrelated changes into a single commit. If a change is large, break it down into smaller, atomic commits with meaningful messages. Every commit must pass validation (typecheck, tests, gatekeeping) and be atomic, preventing any partial build or test failure states. Commit even the documents changes

## NON-NEGOTIABLE RULES

- PRACTICE EXTREMELY STRICT TEST-DRIVEN DEVELOPMENTS, SPEC-DRIVEN, REQRUIREMENTS AND SPEC COMPLIANCES GATE KEEPING WITH STRICT INTEGRATION LOOPS AND VALIDATION. **NO EXCEPTION** 

- WHEN REQUEST IS CONFUSING AND LARGE -> never try to audit everything at once master planning - loop on phases with traversal and progressive batch of research - investigate - planning - implementing - verification then moving to the next batch -> reapt the integrated cycles with regression validation and integration loops of gatekeeping - never try to handle everything at once

- DO DELEGATION IN BATCH SEQUENTIALLY, DO NOT ALLOW MORE THAN 2 PARALLEL TASK DELEGATION. DO NOT USE ANY CUSTOM TOOLS YET. DO NOT USE INTERACTIVE BASH OR PTY COMMANDS!

- Handoff and artifacts between sessions, from research, audit, planning, review, verification, must all commit, written-to-local-disk and referenced as master jump links

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- **DELEGATION STACKING — attach work onto ANY existing session:** Both `task` and `delegate-task` support attaching new work as a child of a completed main session — NOT just resuming aborted tasks. Pattern: pass the existing session ID directly.
  - **`task` tool:** set `task_id` parameter to any existing session ID (not just a previous task_id from task tool). The new subagent attaches as a child of that session.
  - **`delegate-task` tool:** pass `context` as JSON: `{"parentSessionId": "<session-id>"}`. The new delegation attaches as a child of that session.
  - Do NOT inject the session ID into the prompt text — that creates a new independent session. The correct approach is passing it as a parameter so OpenCode's hierarchy tracking properly chains the sessions.
  - **Prompt stays simple** — context from the target session is preserved through the session chain. No need to re-describe old work in the prompt. This is the same principle as `subagent_type`/`agent` parameter: you specify the agent name to select the handler, you specify `task_id`/`parentSessionId` to select the session to attach to.
  - This pattern covers BOTH use cases: **resume** (incomplete session) and **stack-on** (completed session to add new work as a child).

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

- when lost -> access real-time eventracker at `/.hivemind/session-tracker/*` - list/glob first - then look for the correct session id -use hm-detective skill to investigate the sessions

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




Hivemind is a **runtime composition engine** for OpenCode. It is an npm package (`hivemind`) that provides tools, hooks, and a plugin for delegated session orchestration, continuity persistence, concurrency control, and runtime guardrails. The project has progressed through 31 phases covering runtime architecture, delegation revamp, skills quality, and planning documentation refresh. Phase 26 completed the quality synthesis that established HMQUAL-01 through HMQUAL-08 as the project-level quality contract for all `hm-*` skills.

**This is NOT a skill-pack project.** Skills are one component. The product is the harness: a TypeScript plugin that wires tools + hooks into OpenCode with zero business logic in the plugin layer.

### Two Halves (never confuse them)

| Half | What | Where | Architecture Reference |
|------|------|-------|----------------------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf), Task-Management (state), Coordination (delegation), Features (runtime), Config, Routing | `src/` | `.planning/codebase/ARCHITECTURE.md` — CQRS, 9-surface model |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions — NEVER development implementation, NEVER runtime state | `.opencode/` | `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — primitives-only |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, vector/graph memory — NEVER stored in `.opencode/` | `.hivemind/` | `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — canonical Q6 root |
| **Meta-Authoring** (source-of-truth) | Lab environment for authoring primitives before reflection to `.opencode/` | `.hivefiver-meta-builder/` | `.planning/codebase/ARCHITECTURE.md` — Source-of-Truth layer |
| **Governance** (planning/authorization) | Requirements, roadmaps, architecture maps, phase authorization — never runtime code | `.planning/` | `.planning/AGENTS.md` — Planning/Governance sector |

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
├── shared/                    # Leaf utilities, types, SDK wrappers, runtime policy, security
├── task-management/           # Continuity, journal, event tracker, recovery, trajectory, lifecycle
├── coordination/              # Delegation, completion, concurrency, SDK/command delegation, spawner
├── features/                  # Standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, work contracts
├── config/                    # Config subscriber/compiler/workflow
├── routing/                   # Session entry, behavioral profile, command engine
├── hooks/                     # Lifecycle, guards, observers, transforms, composition
├── tools/                     # Delegation, session, config, hivemind, prompt tool entrypoints
└── schema-kernel/             # Zod schemas and generated config schema support

tests/lib/                     # Legacy test grouping for moved runtime modules
tests/tools/                   # Tool-focused unit tests
.opencode/                 # Soft meta-concepts (skills, agents, commands) — NO state storage
.hivemind/               # Internal deep module state (journals, lineage, runtime state) — canonical per Q6
```

### Dependency rules (non-negotiable)

- `src/shared/types.ts` is leaf-like shared contract authority; avoid adding deep runtime imports without a source-backed decision
- `src/shared/helpers.ts`, `src/coordination/concurrency/queue.ts`, `src/coordination/completion/detector.ts` — leaf or near-leaf
- `src/task-management/lifecycle/index.ts` is the lifecycle manager surface
- No circular dependencies
- Max module size: 500 LOC
- `src/task-management/continuity/delegation-persistence.ts` — delegation record I/O

### Where to find things

| Task | File |
|------|------|
| Change session persistence format | `src/task-management/continuity/index.ts` |
| Add a lifecycle phase | `src/shared/types.ts` + `src/task-management/lifecycle/index.ts` |
| Change SDK call patterns | `src/shared/session-api.ts` |
| Change concurrency model | `src/coordination/concurrency/queue.ts` |
| Change delegation behavior | `src/coordination/delegation/manager.ts` — DelegationManager class (WaiterModel dispatch, dual-signal completion) |
| Change delegate-task tool | `src/tools/delegation/delegate-task.ts` — dispatch tool wrapper |
| Check delegation status | `src/tools/delegation/delegation-status.ts` — status polling tool |
| Change completion detection | `src/coordination/completion/detector.ts` |
| Change task status transitions | `src/shared/task-status.ts` |
| Change agent config (temperature, tools) | `src/plugin.ts` — `AGENT_DEFAULTS`, `AGENT_TOOLS` |
| Change circuit breaker / tool budget | `src/plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD`, `MAX_TOOL_CALLS_PER_SESSION` |
| Persist delegation records | `src/task-management/continuity/delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()` |
| Change tool response envelope | `src/shared/tool-response.ts` — standard response wrapper |
| Change prompt-enhance schemas | `src/schema-kernel/prompt-enhance.schema.ts` — Zod schemas for skim/analyze/patch |

---

## Testing Instructions

- Run all tests: `npm test`
- Run single test file: `npx vitest run tests/lib/helpers.test.ts`
- Run tests matching pattern: `npx vitest run -t "<test name>"`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage` — covers `src/**/*.ts`, excludes `src/index.ts`
- Test files live in `tests/lib/` and `tests/tools/` — mirror `src/` modules and `src/tools/`
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
  - `hivemind` → `./dist/index.js`
  - `hivemind/plugin` → `./dist/plugin.js`
- Prepack runs build automatically: `npm pack` / `npm publish`
- Runtime state path: `.hivemind/state/` (canonical per Q6; legacy `.opencode/state/opencode-harness/` supported via compatibility bridge during migration)

---

## OpenCode Integration

- Plugin loaded via `.opencode/plugins/harness-control-plane.ts` (thin wrapper re-exporting `dist/`)
- Config: `opencode.json` at repo root — references `AGENTS.md` as instructions
- 89 agents AUTHORED in `.hivefiver-meta-builder/agents-lab/active/refactoring/` and reflected to `.opencode/agents/`: 33 GSD specialist agents (internal project build tools — NOT shipped) + 45 hm-* agents (harness module specialists + core/internal agents: analyst, architect, assessor, auditor, brainstormer, build, conductor, connector, context-mapper, context-purifier, coordinator, critic, curator, debugger, ecologist, executor, finisher, general, guardian, integrator, intent-loop, investigator, mentor, meta-synthesis, operator, optimizer, orchestrator, persistor, phase-guardian, planner, prompt-analyzer, prompt-repackager, prompt-skimmer, researcher, reviewer, risk-assessor, router, scout, spec-verifier, strategist, synthesizer, technician, test-router, validator, writer) + 11 hf-* agents (hf-prompter, hf-l2-agent-builder, hf-l2-command-builder, hf-l0-hm-l0-orchestrator, hf-l2-skill-builder, hf-l2-tool-builder, hf-l2-meta-builder + 4 additional). Note: explore agent is MISSING from the filesystem.
- 59 skills AUTHORED in `.hivefiver-meta-builder/skills-lab/` and reflected to `.opencode/skills/`: 35 hm-* (product dev: brainstorm, requirements-analysis, feature-ecosystem, product-validation, coordinating-loop, user-intent-interactive-loop, cross-cutting-change, spec-driven-authoring, test-driven-execution, debug, refactor, deep-research, detective, synthesis, research-chain, completion-looping, phase-loop, phase-execution, planning-persistence, subagent-delegation-patterns, production-readiness, roadmap-maintainability, tech-context-compliance, tech-stack-ingest, omo-reference, opencode-platform-reference, opencode-non-interactive-shell, opencode-project-audit, gate-orchestrator, lineage-router, brainstorm, skill-router, hivemind-engine-contracts, hivemind-state-reference, integration-contracts) + 13 hf-* (meta-builder: agent-composition, agents-and-subagents-dev, agents-md-sync, command-dev, command-parser, context-absorb, custom-tools-dev, delegation-gates, meta-builder, skill-synthesis, use-authoring-skills) + 3 gate-* (internal quality gate triad: evidence-truth, lifecycle-integration, spec-compliance — THIS PROJECT ONLY, not shipped) + 6 stack-* (reference: bun-pty, json-render, nextjs, opencode, vitest, zod) + 1 unprefixed (opencode-config-workflow) + 1 hivemind-* (governance: hivemind-power-on — cross-lineage session governance, loaded FIRST by all hm-* and hf-* L0/L1 agents). Note: the previously disabled `hm-planning-with-files` skill has been removed.
- Note: 65 gsd-* skills and 33 gsd-* agents are AUTHORED in `.hivefiver-meta-builder/` and reflected to `.opencode/` as developer tooling (GSD framework used to build this project). They are NOT shipped primitives. Any synthesis from gsd-* must be transformed to hm-*/hf-* conventions.
- 19 commands AUTHORED in `.hivefiver-meta-builder/commands-lab/active/refactoring/` and reflected to `.opencode/commands/`: 7 core (start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, harness-audit, ultrawork) + 7 extended (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack) + 1 sync (sync-agents-md) + 4 test (test-echo, test-list, test-spike-execute, test-status)

### `.opencode/` = Soft Meta-Concepts ONLY — NEVER Development Assets

`.opencode/` is **ONLY** for OpenCode configurable primitives (agents, commands, skills, rules, permissions) that compose runtime behavior from outside the npm package. **No internal runtime state** is stored here. **No development implementation** lives here. **No build artifacts** belong here.

This is a critical distinction:
- **`.opencode/` IS:** Agent definitions, skill packages, command files, permission rules, plugin loader wrappers → these CONFIGURE runtime behavior
- **`.opencode/` IS NOT:** Source code, compiled output, business logic, state persistence, development tools, npm package assets → these belong in `src/`, `dist/`, or `.hivemind/`

All Hivemind deep module state (journals, lineage, runtime state, graph/vector memory) writes to `.hivemind/` at project root per Q6. This prevents corruption by other plugins or user dependencies.

### Canonical Skill Location

`.hivefiver-meta-builder/skills-lab/` is the **ONLY** canonical source-of-truth for project skills. All skill authoring happens there and is reflected to `.opencode/skills/` (runtime copies) via directory-level symlink.

IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are **third-party sync artifacts**, not project deliverables. They are gitignored and must never be committed. `.claude/skills/` does not exist in this repository.

---

## Architecture Foundation (Authoritative Docs)

### Must-Have References (current as of 2026-05-10)

| Document | Purpose | Authority |
|----------|---------|-----------|
| `.planning/codebase/ARCHITECTURE.md` | CQRS model, 9-surface authority, component graph, dependency rules | Source-backed architecture map |
| `.planning/codebase/STRUCTURE.md` | File tree, placement conventions, naming, folder registration | Source-backed structure map |
| `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` | Surface ownership model, Phase 0 mutation gates, target source planes | Governance baseline |
| `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | Naming contract, lineage contract (hm/hf/gate/stack/gsd), L0-L3 hierarchy | Governance baseline |
| `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md` | Target sector AGENTS.md shape, deferred implementation | Target architecture |
| `.planning/research/omo-adaptation-architecture-2026-05-07.md` | OMO adapt/reject table, Hivemind surface preservation rules | Research foundation |
| `.hivemind/planning/agents-system-overhaul-2026-05-10/` | Agent/skill/command overhaul: 15 REQs, 12 phases, shipped count = 49 | Overhaul planning |

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

<!-- Last synced: 2026-05-11 — Phase 11 audit: skill count corrected to 58 (disabled removed), commands 18→19, package name `hivemind` per P0-ID -->

## Current Phase Context

**Completed phase (2026-05-18):** CP-DT-01 — Delegate-Task Ecosystem Revamp. ✅ COMPLETE.
**Review ITER2:** 0 Critical, 3 Warning (LOC/type-safety), 1 Info. 8/8 prior findings resolved.
**Validation:** 18/18 spec requirements DELIVERED, 91/91 tests pass, `npm run typecheck` → clean.
**Commits:** `c465b310`..`761046b4` (execution), `f4fd36e0` (review ITER2), `1ca16a3a` (validation).
**Artifacts:** SPEC, CONTEXT, RESEARCH, PATTERN, 5 PLAN/SUMMARY pairs, REVIEW, REVIEW-FIX, REVIEW-ITER2, VALIDATION.
**Remaining:** Live native Task UAT deferred to integration phase (L1 runtime proof manual-only).

**Next phase:** CP-PTY-01 (Background Shell Control-Plane MVP) — READY, unblocked by BOOT-07 and WS-SR/CP-DT-01 completion.
