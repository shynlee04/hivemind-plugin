# Session Inspection Export

- ses_id: `ses_2da7d7080ffe6d01WOFBe5r04J`
- prepared_at: `2026-03-25T15:00:31.315Z`

## Assistant Output

## package.json — Extracted Fields

### 1. `"files"` field (lines 27–37)

```json
"files": [
  "dist",
  "bin",
  "skills",
  "commands",
  "agents",
  "workflows",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
]
```

### 2. `"main"` and `"exports"` fields (lines 6–17)

```json
"main": "dist/index.js",

"exports": {
  ".": {
    "import": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "./plugin": {
    "import": "./dist/plugin/opencode-plugin.js",
    "types": "./dist/plugin/opencode-plugin.d.ts"
  }
}
```

### 3. `"scripts"` field (lines 49–59)

```json
"scripts": {
  "clean": "rm -rf dist",
  "build": "npm run clean && tsc && chmod +x dist/cli.js",
  "dev": "tsc --watch",
  "typecheck": "npm run typecheck:core",
  "typecheck:core": "tsc --noEmit",
  "lint:boundary": "bash scripts/check-sdk-boundary.sh && bash scripts/check-state-write-boundary.sh && bash scripts/check-docs-ownership-boundary.sh && bash scripts/check-no-event-bus.sh && bash scripts/check-no-core-session.sh && bash scripts/check-tool-schema.sh && bash scripts/check-hooks-readonly.sh && bash scripts/check-plugin-assembly.sh && bash scripts/check-agents-presence.sh && bash scripts/check-asset-refs.sh",
  "guard:public": "bash scripts/guard-public-branch.sh origin/master HEAD",
  "test": "npm run lint:boundary && tsx --test \"tests/**/*.test.ts\" \"src/**/*.test.ts\"",
  "prepublishOnly": "npm run typecheck && npm test && npm run build"
}
```

### 4. All mentions of "config" in the file

| Line | Content |
|------|---------|
| 74   | `"publishConfig": {` |
| 75   | `"access": "public"` |

The only occurrence of the literal string `config` is within the `"publishConfig"` key at line 74. There is no standalone `"config"` field.