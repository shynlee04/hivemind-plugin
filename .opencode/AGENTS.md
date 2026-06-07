# .opencode/AGENTS.md

Scope: rules that apply when reading, writing, or auditing code under `.opencode/`. Inherits the root `AGENTS.md` rules; this file deepens the OpenCode primitive governance. Source of truth: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` and `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`.

## Source vs Deploy Reminder (binding)

`assets/` is the **source of truth** for all shipped primitives in this directory. NEVER develop directly in `.opencode/`. Edit in `assets/` → `node scripts/sync-assets.js` → verify in `.opencode/`. The `sync-assets.js` script is regenerable from scratch.

**Exception:** `gsd-*` primitives (agents, commands, skills under `get-shit-done/`) are developer tooling, NOT shipped, and may live directly in `.opencode/`.

## Lineage Taxonomy (5 prefixes)

Every agent, skill, command, and gate MUST declare a lineage prefix. Naming follows the **hf-naming-syndicate** rules.

| Prefix | Lineage | Purpose | Authority |
|--------|---------|---------|-----------|
| `hm-*` | Hivemind Main | Product-dev specialists, gate orchestrators, routing skills | Hivemind core — owned by `hm-l0-orchestrator` |
| `hf-*` | Hivemind Factory | Meta-builder skills for creating/auditing/configuring OpenCode primitives | `hf-meta-builder-core` |
| `gate-*` | Quality Gate | Internal quality gates run in fixed sequence | `hm-l2-gate-orchestrator` |
| `stack-*` | Stack Reference | On-demand third-party API/library reference packs | Lazy-loaded by `hm-l3-tech-stack-ingest` |
| `gsd-*` | Get-Shit-Done | GSD framework (Anthropic's released v1) — developer tooling only | Ships in `get-shit-done/`; not part of Hivemind product |

**Discovery:** When in doubt, look at the agent's `lineage:` frontmatter field. If the field is missing, the agent is misconfigured — fix the frontmatter, do not patch around it.

## Soft Meta-Concepts (user-configurable)

These primitives are the user-configurable layer of the harness. They are version-controlled but expected to be customized per deployment.

- **Skills** (`.opencode/skills/<name>/SKILL.md`): Packaged procedure units. Loaded via the `skill` tool on demand. Each skill MUST have a `description:` field that includes trigger phrases for routing.
- **Agents** (`.opencode/agents/<name>.md`): Specialist unit of work. Frontmatter MUST declare `description`, `tools`, and either `lineage` or a valid `model` config.
- **Commands** (`.opencode/command/*.md`, `.opencode/commands/*.md`): Slash commands. Two sub-roots exist; the legacy `command/` directory holds the original set, `commands/` holds the expanded set. Both are loaded.
- **Rules** (`.opencode/rules/*.md`): Always-on constraints. Loaded via `opencode.json` `instructions` field. Editing `universal-rules.md` is a high-risk action — it is in every agent's prompt.
- **Permissions** (`.opencode/opencode.json`, agent frontmatter `permission:` field): Per-agent tool allow/deny/ask matrix. Do not expand an agent's tool set without a quality gate review.

## L0 & Specialist Coordination (binding)

Front-facing L0/L1 orchestrators are strictly limited. These are the orchestrators:

- `hm-l0-orchestrator` — top-level intent classification + delegation
- `hm-orchestrator` — mid-level phase/cycle coordination

**Inline banishment (L0/L1):** MUST classify intent, route, coordinate, and gatekeep. **Banned from inline work**: no reading files for comprehension, no writing code, no running tests, no auditing. Delegate ALL detail work to `hm-*` / `hf-*` specialists via the `task` tool.

**Generic agent prohibition:** `general`, `Explore`, `Plan`, and untyped default agents are PROHIBITED. All dispatch goes to domain-specific specialists.

**Coordination contracts:**

- **Discover first:** `delegation-status({ action: "find-stackable" })` before any new delegation. Stack onto existing sessions via `task_id` / `stackOnSessionId`.
- **Never create duplicate sessions** — stack retry onto the FAILED session to preserve context.
- **Dual-signal completion:** doer specialist + verifier specialist must both pass. Sequential preferred over parallel for inherited knowledge.
- **Stack onto existing sessions, especially after failure.** The SDK supports stacking onto ANY valid session ID, both within the current delegation tree AND across independent sessions.

## OpenCode Integration Notes (compressed)

- **OpenCode SDK version:** `@opencode-ai/plugin@1.16.2` (see `package.json` `peerDependencies`). OpenCode CLI requires `>=1.16.2` per `engines.opencode`.
- **Plugin load order:** `opencode.json` → `package.json` plugin export → `src/plugin.ts` `HarnessControlPlane` → tool/hook registration in `src/plugin-registration.ts`.
- **Tool registration:** Use the `tool()` factory from `@opencode-ai/plugin` with a Zod schema for `args`. The execute function returns a JSON envelope; errors must include `code` and `message`.
- **Hook registration:** Use the `hook()` factory. The mutation passed to the next middleware in the chain is the public seam. Early-return values must be honored.
- **Plugin shape:** The public `Plugin` interface is assembled in `src/plugin.ts` and registered via `src/plugin-registration.ts`. Do not hand-wire plugins in the CLI.
- **Per-agent frontmatter:** The `instruction:` / `instructions:` field is eagerly resolved at session start. The `skills:` field is eagerly resolved. The `permission:` field is honored at tool-call time.
- **Subdirectory walk-up:** OpenCode 1.16.2 walks up from cwd and loads the closest `AGENTS.md` (read-triggered only). This is the basis of the progressive disclosure design.

**Verification gate:** SDK signature changes between OpenCode minor versions. Validate against the pinned `@opencode-ai/plugin` types in `node_modules/@opencode-ai/plugin/` before writing new tool/hook code.

## Locked Validation Decisions (Q1-Q6)

Locked in `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`. These are governance decisions and are NOT subject to in-PR debate.

| Q | Decision | Implication |
|---|----------|-------------|
| Q1 | Architecture style | 9-surface, CQRS, runtime composition. No monoliths. |
| Q2 | Plugin pattern | Hard Harness, zero business logic in plugin layer. Tools and hooks only. |
| Q3 | Delegation model | `task` tool + `stackOnSessionId`. No custom delegation wire. |
| Q4 | State root | `.hivemind/` is canonical. `.opencode/` is for OpenCode primitives only. One-way migration. |
| Q5 | Test discipline | TDD with `runtime-truthful` evidence, coverage thresholds, public-interface discipline. |
| Q6 | Quality gates | `gate-lifecycle-integration` → `gate-spec-compliance` → `gate-evidence-truth` in strict sequence. |

**Q1-Q6 are read by L0 only when validating spec gates.** Other agents cite by reference, not by re-explanation.

## Architecture Foundation (Authoritative Docs)

These documents are the canonical architecture source. Do not duplicate their content — cite by reference.

- 9-surface model + component graph: `.planning/codebase/ARCHITECTURE.md`
- File tree + placement conventions: `.planning/codebase/STRUCTURE.md`
- Source plane ownership (where each surface writes): `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
- Lineage taxonomy (hm/hf/gate/stack/gsd): `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
- Locked Q1-Q6 validation decisions: `docs/proposals/VALIDATION-DECISIONS-2026-04-25.md`

## Notice Board (read once on session start)

- UAT override mode is active when the user invokes `gsd-verify-work` directly. In this mode, the user IS the verifier; dual-signal completion collapses to single-signal.
- Command routing: prefer the L0-orchestrator's command engine (`hm-command-engine`) over the OpenCode-native command loader. Native commands still work for `gsd-*` lineage.
- Plan storage: plans live in `.planning/phases/<NN>-<name>/PLAN.md` (active) or `.planning/milestones/<M>/phases/<NN>-<name>/PLAN.md` (archived).
- Phase numbering: `NN-name` for sequential, `NN.M-name` for decimal (inserted between existing phases). Backlog parking uses `999.x`.

## Git Commit Discipline

- One logical change = one commit. Every commit MUST pass `npm run typecheck` and `npm test` before being marked ready.
- Commit message format: Conventional Commits (`type(scope): summary`). Examples: `feat(tools): add delegation-status tool`, `fix(hooks): guard against empty session id`, `docs(agents): slim root AGENTS.md to 80 lines`.
- Atomic commits enable bisect. Do not batch unrelated changes.
- Branching: feature branches from `main` for non-trivial work. PR is the merge boundary, not the commit boundary.

## Where to Find More

- OpenCode SDK surface: `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`
- Engine contracts: `.opencode/skills/hm-l3-hivemind-engine-contracts/SKILL.md`
- Subagent delegation patterns: `.opencode/skills/hm-l3-subagent-delegation-patterns/SKILL.md`
- Stack reference packs (lazy-loaded): `.opencode/skills/stack-*/SKILL.md`
- Quality gate triad: `.opencode/skills/hm-l2-gate-orchestrator/SKILL.md`
- Code under harness: `src/AGENTS.md`
- State under harness: `.hivemind/AGENTS.md`
