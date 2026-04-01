# Repomix Mode

## Local Validation
- `npx -y repomix --help` runs successfully in this workspace.
- `.opencode/opencode.json` defines a local `repomix --mcp` server, but it is currently disabled.

## Rule
- Repomix is optional acceleration for codemap work.
- If Repomix is unavailable or disabled, fall back to `native` mode.
- Prefer `hybrid` when pack-level synthesis needs direct file verification.

## Useful CLI Patterns

### Metadata-only structural map
```bash
npx -y repomix --stdout --style xml --no-files .
```

### Compressed whole-repo pack
```bash
npx -y repomix --stdout --style xml --compress .
```

### Focused slice pack
```bash
npx -y repomix --stdout --style xml --include "src/**/*.ts,skills/**/*.md" .
```

### Token-heavy file discovery
```bash
npx -y repomix --token-count-tree 100 .
```

## When To Prefer Repomix
- high-level codemap bootstrap on large repos
- compressed structure extraction before native verification
- scoped slice export for synthesis-heavy analysis

## When Not To Rely On Repomix Alone
- when exact line-level verification matters
- when a packed view hides the need for live file-by-file accounting
- when the scan depends on ignored/generated-path judgment better handled natively
