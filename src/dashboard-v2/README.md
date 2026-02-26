# dashboard-v2

Terminal dashboard for HiveMind Phase 7, implemented with OpenTUI React and wired to existing Code-Intel artifacts.

## Commands

```bash
bun install
bun run typecheck
bun run dev
```

## Keyboard

- `Tab` / `Shift+Tab` - switch tabs
- `j` / `k` - switch tabs
- `q` - destroy renderer and exit UI loop

## Integration

The Code-Intel tab reads one of the following files at runtime:

- `.hivemind/codebase/code-intel/codemap-summary.json`
- `.hivemind/codemap/compressed-codemap.json`
