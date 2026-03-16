# HiveMind Master Model

Date: 2026-03-16
Status: Main reference for product definition, OpenCode fit, and production-readiness gates

This document supersedes fragmented interpretation for this topic. If older docs, plans, READMEs, or command copy disagree with this file about what HiveMind is supposed to be, this file takes priority unless current source code or official OpenCode behavior proves otherwise.

## 1. What HiveMind is

HiveMind should be the plain-language guidance layer that helps OpenCode handle messy real-world work without getting lost.

In user terms, that means:

- A user can show up with an unclear, mixed, or overloaded request.
- HiveMind figures out what kind of help is needed first.
- HiveMind keeps the work on track across planning, research, implementation, recovery, and verification.
- HiveMind remembers enough state to continue safely.
- HiveMind asks for the right information when needed, instead of pretending it already knows.
- HiveMind stays compatible with normal OpenCode commands, agents, skills, tools, and config.

HiveMind is not supposed to be a second app, a new terminal runtime, or a pile of internal theory. It is a plugin and runtime guidance layer built for OpenCode that makes exploratory AI work dependable.

## 2. The main product categories

The stress-test use cases point to six product categories that matter to users.

### A. Entry, setup, and recovery

Users need the system to handle first run, broken state, partial state, upgrades, and recovery without guesswork.

This includes:

- first-run setup
- health checks
- repair after damaged local state
- clear next-step guidance when work cannot continue yet

### B. Prompt untangling and routing

Users often ask for several things at once. HiveMind should turn a messy request into a safe next action.

This includes:

- identifying whether the user is exploring, researching, planning, building, fixing, or verifying
- detecting mixed intent instead of grabbing the first keyword
- deciding whether to continue current work, resume old work, or start fresh
- picking the right command path, tool path, or agent path

### C. Guided work modes

Users need a system that can move between research, planning, implementation, test-first work, and course correction without losing the thread.

This includes:

- clear work stages
- smooth handoff between stages
- explicit evidence expectations before saying something is done

### D. Continuity and memory

Users need the session to survive long work, compaction, and resume moments.

This includes:

- active work thread or focus tracking
- workflow and task continuity
- recovery checkpoints
- enough saved context to restart without making things up

### E. Safety and proof

Users need the system to prevent false confidence.

This includes:

- proof before completion claims
- checks before risky actions
- clear blocked state when required inputs or health checks fail
- visible safety posture rather than hidden assumptions

### F. Delivery through OpenCode

Users should get all of this through normal OpenCode surfaces, not through a parallel universe.

This includes:

- plugin hooks
- custom tools
- command bundles
- agents and skills
- project and global config surfaces

## 3. What best-in-class should look like

HiveMind should combine the best practical ideas from tools like GSD and oh-my-openagent, but in a form that fits OpenCode naturally.

### From GSD, HiveMind should keep

- plain user-facing language
- a small number of clear entry points
- explicit stage progression
- durable project state that helps the next turn do better work
- trust built through verification, not slogans

### From oh-my-openagent, HiveMind should keep

- strong defaults that reduce setup pain
- practical orchestration instead of theory-heavy workflows
- good use of multiple agents, tools, and MCP-style research surfaces
- fast routing from user intent to useful action
- a feeling that the system is helping complete work, not just documenting it

### HiveMind's own best-in-class shape

If HiveMind is excellent, it feels like this:

- one obvious way to start
- one obvious way to recover
- one obvious explanation for what the system is doing now
- minimal jargon in the user-facing layer
- predictable runtime behavior in code, flexible guidance in prompts
- strong compatibility with OpenCode's official plugin, config, command, skill, and agent model
- safe handling of ambiguity, stale context, broken state, and overconfident completion claims

The ideal result is not "maximum orchestration." It is "the user can bring a messy request and still get a reliable path to done."

## 4. The expected user journey for a messy prompt

For a prompt like: "I was thinking we may need to refactor session handling, but first research what other frameworks do, and also there is a failing test, and should we add TDD for this?"

HiveMind should behave like this:

1. Recognize that the request mixes research, debugging, planning, and implementation decisions.
2. Refuse to flatten that into one blind action.
3. Summarize the request in plain language: what is known, what is mixed, and what must happen first.
4. Pick the safest next step, usually clarification or a research/planning path before implementation.
5. If the environment is not ready, route to setup or repair first.
6. Create or attach to the active work thread so future turns know what this work belongs to.
7. Preserve the current state and recommended next command or mode.
8. Only move into implementation after the earlier uncertainty has been reduced enough.
9. Require verification before calling the work complete.

The user experience should feel like "the system understood the real shape of my request and kept me from skipping important steps," not "the system made me learn its own internal model."

## 5. Required system behaviors and success rules

HiveMind is only correct if it does the following consistently.

### Core behavior rules

- Detect first-run, damaged state, missing profile input, and broken continuity before normal work starts.
- Route mixed prompts conservatively when confidence is low.
- Prefer explicit recovery or clarification over silent misrouting.
- Track active work in a way that supports resume, attach, and repair paths.
- Make command transitions and tool transitions visible.
- Separate runtime truth from prompt wording.
- Require evidence before claiming success on implementation, repair, or verification work.

### System responsibility rules

- Plugin code owns predictable runtime behavior.
- Commands remain prompt definitions, not fake executors.
- Skills remain reusable instruction packs loaded on demand.
- Tools remain explicit callable operations with typed arguments.
- Safety checks must produce blocked or gated outcomes when requirements are not met.

### Edge cases that must be handled

- clean repo with no prior state
- corrupt local HiveMind state
- active sub-session without valid parent or task link
- mixed-intent prompts
- prompts with no obvious keywords
- user switching language midstream
- stale plans or docs that no longer match repo reality
- long sessions that compact
- handoffs that claim work is done without proof
- conflicting active work threads or lineage switches

### What defines success

Success is not that every subsystem exists. Success is that users can reliably:

- start work
- recover work
- untangle ambiguous work
- continue work safely
- verify work honestly
- stay inside normal OpenCode behavior

## 6. OpenCode compatibility rules

HiveMind must fit the official OpenCode model instead of fighting it.

### A. Config rules

HiveMind must respect OpenCode config precedence and delivery surfaces:

- global config in `~/.config/opencode/opencode.json`
- project config in `opencode.json`
- project or global `.opencode/` directories for commands, agents, plugins, skills, and related surfaces
- npm plugin loading through the `plugin` array in config

HiveMind may add project-local assets or ship npm plugin assets, but it must not assume it owns the whole OpenCode environment.

### B. Plugin rules

HiveMind runtime behavior belongs in the plugin layer and custom tools.

That means:

- hooks are the right place for injection, observation, permissions, environment shaping, and compaction context
- `tool.schema` must define tool arguments
- `client.app.log()` is the preferred structured logging path
- `client.tui.showToast()` is the preferred non-blocking user notification path
- plugin behavior must stay compatible with OpenCode's hook execution model and plugin load order

### C. Command rules

OpenCode commands are prompt templates. HiveMind must treat command markdown as user-facing prompt definitions, not as hard runtime engines.

If a command needs deterministic stateful behavior, that behavior must live in source code, then be invoked through the right tool or handler path.

### D. Agent rules

HiveMind agents must map cleanly onto OpenCode's primary-agent and subagent model.

That means:

- agent descriptions should be understandable by OpenCode routing
- permissions should use the official tool and task permission model
- subagent usage should respect OpenCode session and child-session behavior
- hidden or specialized agents should not become invisible product logic that users cannot reason about

### E. Skill rules

HiveMind skills must remain normal OpenCode-discoverable skills and must match the real skill surfaces users and the runtime can see:

- one folder per skill
- `SKILL.md` with valid frontmatter, including required `name` and `description` fields
- loaded through the `skill` tool when needed
- used for reusable behavior, not for hiding core runtime state changes

In practice, skill discovery should stay compatible with current OpenCode behavior and the skill locations the runtime actually uses:

- project-local OpenCode skills may live in `.opencode/skills/` when a project uses that surface
- project skills may also live in `.claude/skills/`, which is a common local project skill surface and is present in this repo
- this repo also carries project-scoped authoring skills in `.agents/skills/`, and the current loaded skill set can resolve skills from there
- if a repo uses mirror or compatibility directories, the product docs must describe which path is the source of truth and which path is only a local mirror or inactive backup

### F. Shell and tool rules

HiveMind must assume OpenCode shell usage is non-interactive. Any important flow must work without waiting for interactive prompts. Risky operations must be handled through permissions, explicit questions, or deterministic handlers.

## 7. Current repo status against this model

This section is based on current source and package surfaces, not on older marketing or architecture prose.

### What already exists

- A real CLI entrypoint exists in `src/cli.ts` for `init`, `doctor`, `settings`, and `harness`.
- A real OpenCode plugin entry exists in `src/plugin/opencode-plugin.ts`.
- The plugin already uses official OpenCode-style hooks such as `event`, `chat.message`, `permission.ask`, `tool.execute.before`, `tool.execute.after`, `shell.env`, `experimental.chat.system.transform`, `experimental.chat.messages.transform`, and `experimental.session.compacting`.
- Custom tools exist, including runtime tools in `src/tools/runtime/tools.ts` and workflow-facing tools in `src/tools/task/tools.ts`, `src/tools/trajectory/tools.ts`, and `src/tools/handoff/tools.ts`.
- Runtime attachment state exists through `src/shared/runtime-attachment.ts`.
- Start-work routing exists through `src/hooks/start-work/start-work-router.ts`.
- Handlers exist for `hm-init`, `hm-doctor`, `hm-harness`, and `hm-settings` in `src/control-plane/control-plane-handler.ts`.
- There is active test coverage across plugin, CLI, routing, tool, and recovery surfaces in `tests/`.

### What is partial

- Prompt untangling exists, but purpose classification is still mostly keyword-driven in `src/hooks/start-work/purpose-classifier.ts`.
- Command bundles are defined and routed, but many other commands still resolve to preview-style prompt execution rather than a predictable end-to-end engine.
- Continuity exists through work-thread, workflow, and checkpoint structures, but the user-facing story is still fragmented and harder to understand than it should be.
- Recovery exists in code, but the product promise around recovery, readiness, and next-step guidance is not yet presented as one coherent user model.
- OpenCode compatibility knowledge exists in `src/shared/opencode-knowledge.ts`, but the wider docs still mix old assumptions with the newer plugin-native approach.

### What is missing

- The repo had been missing a single plain-language master document that explained the whole product in user terms.
- A clearly proven end-to-end story for mixed-intent prompts from entry through verification.
- A simpler and more trustworthy product narrative that matches current source reality.
- Strong ambiguity handling beyond keyword-first classification.
- Strong stale-artifact handling as a visible user-facing rule.
- Solid proof that every shipped command, agent, skill, and workflow surface lines up with the current source-owned runtime.

### What is misleading today

- `README.md` describes a different and older product shape than the current source tree and package surfaces support.
- Older docs still describe HiveMind as a much broader system with many claimed tools and lifecycle surfaces that are not the right source of truth for the current revamp work.
- The stress-test matrix is useful for use cases and failure modes, but several of its architecture claims are already stale because current `src/` now contains a real CLI, recovery path, runtime tools, and test coverage.
- The repo still exposes command and doc surfaces whose names suggest a more finished runtime than the code has actually standardized.

## 8. Hard release gates for calling HiveMind production-ready

HiveMind should not be called production-ready until all of the following are true.

### Product gates

- The product can be explained to a new user in plain language without internal terminology.
- One main document defines the model, journey, controls, and success rules.
- The README and shipped command descriptions no longer overclaim relative to source reality.

### Runtime gates

- First-run setup works in a clean project.
- Recovery works on intentionally damaged local state.
- Mixed-intent prompt routing behaves conservatively and predictably.
- Active work-thread attach, resume, and sub-session bounds behave consistently.
- Evidence gates block unsupported completion claims.

### OpenCode fit gates

- All shipped behavior respects official OpenCode config precedence and plugin loading behavior.
- Commands that need deterministic behavior are backed by real runtime handlers or tools.
- Skills are used as skills, not as hidden runtime state engines.
- Tool definitions use `tool.schema` and remain aligned with OpenCode expectations.

### Surface consistency gates

- `package.json`, `src/**`, shipped commands, shipped skills, and public docs describe the same product.
- Stale or contradictory docs are either updated, clearly marked obsolete, or removed from the user path.
- The project has a clear list of what is source authority, what is delivery surface, and what is legacy explanation only.

### Verification gates

- `npx tsc --noEmit` passes.
- `npm test` passes.
- Key end-to-end scenarios are covered by tests or direct reproducible checks: fresh init, broken-state doctor, harness readiness, mixed-intent start-work routing, runtime command execution, and compaction-safe continuity.

## 9. Bottom line

HiveMind should become the layer built for OpenCode that turns messy intent into safe, trackable progress.

The current repo already contains meaningful pieces of that system: routing, runtime attachment, plugin hooks, command handlers, recovery structures, and tests. What it still lacks is a single plain model that aligns the code, the shipped surfaces, and the product promise.

This document defines that model.
