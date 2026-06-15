# Installing Hivemind

Hivemind ships in three forms. Pick the one that matches your situation.

---

## 1. For users — install Hivemind into your own project

You want OpenCode in **your** project to load the Hivemind plugin.

```bash
# 1. Install the package (uses your existing package manager)
npm install hivemind-3.0
# or: pnpm add hivemind-3.0
# or: yarn add hivemind-3.0
# or: bun add hivemind-3.0

# 2. Bootstrap Hivemind's OpenCode primitives into your project
#    (interactive wizard — asks for language, expert level, delegation mode)
npx hivemind init

# 2b. Or non-interactive with defaults:
npx hivemind init --non-interactive

# 3. Add the plugin reference to your opencode.json
cat >> opencode.json <<'EOF'
{
  "plugin": ["hivemind-3.0"]
}
EOF
```

That's it. Next time you start OpenCode, Bun will auto-install `hivemind-3.0` and its dependencies into `~/.cache/opencode/node_modules/` and load the plugin from the published `dist/plugin.js`.

If your project already has an `opencode.json`, edit it directly and add the `plugin` array.

The `hivemind init` step copies all Hivemind agents (`hm-orchestrator`,
`hm-planner`, `hm-executor`, etc.), skills, commands, and rules into your
project's `.opencode/` directory. Without it, the plugin loads but no
agents are available.

---

## 2. For contributors — clone the repo and run Hivemind locally

You want to **develop on Hivemind itself** — read its source, modify hooks, run tests.

```bash
git clone https://github.com/shynlee04/hivemind-plugin.git
cd hivemind-plugin
npm install
opencode           # any later invocation
```

**No build step required.** The repo ships a thin local bridge at
`.opencode/plugins/harness-control-plane.ts` that re-exports directly from
`src/plugin.ts`. OpenCode auto-loads this file at startup via Bun, which
runs TypeScript natively — so the harness works from source the moment
`npm install` finishes (the `postinstall` script mirrors the assets
directory into `.opencode/`).

If you want to run the compiled `dist/` form instead (e.g. to verify the
publishing pipeline), build it with `npm run build` and point
`opencode.json` at `"./dist/plugin.js"`.

### Running the test suite

```bash
npm test                # full vitest run (~3,500 tests)
npm run typecheck       # tsc --noEmit
npm run build           # compile to dist/ + regenerate JSON schema
```

---

## 3. For maintainers — publish a new version

You want to cut a new npm release.

A template for the local auth file lives at `.npmrc.example` — copy it to
`~/.npmrc` and add your publish token (do not commit the populated file).
For CI, set `NPM_TOKEN` as a GitHub Actions secret; see
`.github/workflows/publish.yml`.

```bash
# 1. Verify the build is clean
npm run typecheck
npm test
npm run build

# 2. Bump the version
npm version patch       # or minor / major

# 3. Publish (prepack runs 'npm run build' automatically)
npm publish
```

The package declares `hivemind-3.0` as its name, `"./plugin": "./dist/plugin.js"`
as the plugin subpath export, and `@opencode-ai/plugin ^1.15.13` as a
peer dependency. OpenCode resolves `"plugin": ["hivemind-3.0"]` to the
`./plugin` subpath automatically.

---

## What `hivemind init` does

Running `npx hivemind init` in your project:

1. Creates `.hivemind/configs.json` with your chosen language, expert level,
   delegation mode, governance rules, and tool access pattern.
2. Installs symlinks (or copies) from `node_modules/hivemind-3.0/assets/*` into
   your project's `.opencode/`:
   - `.opencode/agents/` — `hm-orchestrator`, `hm-planner`, `hm-executor`,
     `hm-verifier`, plus all `hm-l2-*`, `hm-l3-*`, `hm-coord-*`, `hm-debug-*`
     product-dev agents and `hf-*` meta-builder agents
   - `.opencode/skills/` — `hm-coord-router`, `hm-routing-skill`, all
     `hm-l2-*` execution skills, `gate-*` quality gates, `hf-*` meta-builder
     skills, `stack-*` references
   - `.opencode/commands/` — `hm-*` and `hf-*` slash commands
   - `.opencode/rules/` — `universal-rules.md` and friends
   - `.opencode/workflows/` — phase-loop and routing workflows
   - `.opencode/templates/` — config and document templates
   - `.opencode/plugins/` — local plugin bridge if you ever clone the source
3. Idempotent — re-running it does not duplicate files.

The interactive TTY wizard (powered by `@clack/prompts`) asks for:
- Conversation language (`en`, `vi`, `zh`, `ja`, `ko`, etc.)
- Documents/artifacts language
- User expert level (`clumsy-vibecoder`, `mid`, `senior`, `principal`)
- Delegation mode (`waiter`, `fire-and-forget`)
- Guardrail level (`strict`, `moderate`, `permissive`)
- Hivemind mode (`hivemind-powered`, `standalone`)

In non-interactive mode (`--non-interactive` or no TTY), it uses sane defaults
from `.hivemind/configs.schema.json`.

---

## What you get

Hivemind registers **28 custom tools** and **12 lifecycle hooks** at OpenCode
startup. The tools, grouped by registration source:

| Group | Count | Tools |
|-------|-------|-------|
| `registerDelegationTools` | 3 | `delegate-task`, `delegation-status`, `run-background-command` |
| `registerSessionTools` | 7 | `execute-slash-command`, `session-patch`, `session-journal-export`, `session-tracker`, `session-hierarchy`, `session-context`, `create-governance-session` |
| `registerHivemindTools` | 9 | `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `session-delegation-query` |
| `registerConfigTools` | 6 | `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`, `prompt-skim`, `prompt-analyze` |
| Inline in `src/plugin.ts` | 3 | `tmux-copilot`, `tmux-state-query`, `hivemind-steer` |

The plugin is also a typed runtime composition engine — it composes 12
lifecycle hooks (`session.start`, `session.idle`, `tool.execute.before`,
`tool.execute.after`, `chat.message`, `event`, plus 6 observer/transform
hooks) for delegation tracking, budget enforcement, session continuity,
and tmux visual orchestration.

The full OpenCode primitive surface is also shipped: `hm-*` product-dev
agents, `hf-*` meta-builder agents, `gate-*` quality gates, `hm-*` / `hf-*`
skills, slash commands, the universal rules file at
`.opencode/rules/universal-rules.md`, and the `opencode.json` config
schema. See `assets/agents/`, `assets/skills/`, and `assets/commands/`
for the full inventory.

---

## Troubleshooting

**`Cannot find module '../../dist/plugin.js'` on first run**
The local bridge now imports from `src/plugin.ts` instead of `dist/plugin.js`,
so this should not happen on a fresh clone. If you see it, you are likely
running an older build of the bridge — pull the latest and re-run.

**`Plugin 'hivemind-3.0' not found` after `npm install`**
Ensure your `opencode.json` is at the project root and the `plugin` field
is an array of strings, e.g. `"plugin": ["hivemind-3.0"]`. Restart OpenCode
so Bun re-runs the package installer.

**`.opencode/plugins/harness-control-plane.ts` was deleted**
Run `node scripts/sync-assets.js` — the file lives in `assets/plugins/`
(added in commit 8ebe844) and is mirrored to `.opencode/plugins/` on every
sync. If you want to recreate it manually, the template is:

```ts
export { HivemindControlPlane as default, HivemindControlPlane } from "../../src/plugin.ts"
```

**Tests fail with `state` or `delegation` errors**
Some tests in `tests/lib/coordination/delegation/` are sensitive to timing
and may flake in heavily loaded CI. Re-run with `npm test -- --retry 2`.
