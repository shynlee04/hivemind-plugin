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

# 2. Add the plugin reference to your opencode.json
cat >> opencode.json <<'EOF'
{
  "plugin": ["hivemind-3.0"]
}
EOF
```

That's it. Next time you start OpenCode, Bun will auto-install `hivemind-3.0` and its dependencies into `~/.cache/opencode/node_modules/` and load the plugin from the published `dist/plugin.js`.

If your project already has an `opencode.json`, edit it directly and add the `plugin` array.

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
It's not in `assets/`, so the `sync-assets.js` script does not restore it.
Re-create it from this template:

```ts
export { HivemindControlPlane as default, HivemindControlPlane } from "../../src/plugin.ts"
```

**Tests fail with `state` or `delegation` errors**
Some tests in `tests/lib/coordination/delegation/` are sensitive to timing
and may flake in heavily loaded CI. Re-run with `npm test -- --retry 2`.
