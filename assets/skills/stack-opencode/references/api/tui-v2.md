# API: TUI v2 Keymap API

> Version 1.14.44 | Source: `packages/plugin/src/tui.ts`

## Overview

The TUI v2 keymap API replaces the legacy `api.command` API for keybinding registration. It introduces a layered keybinding system via `api.keymap.registerLayer()` that supports command dispatch, multi-key sequences, and leader-key patterns.

## Migration: api.command → api.keymap

### Legacy (DEPRECATED — still works for backward compatibility)

```typescript
// OLD: v1 API — DEPRECATED in v1.14.44
const TuiPluginV1: TuiPlugin = async (api) => {
  api.command?.register([{
    name: "my-custom-command",
    handler: () => console.log("executed"),
  }])
}
```

### New: api.keymap.registerLayer()

```typescript
// NEW: v2 API — recommended for all new plugins
const TuiPluginV2: TuiPlugin = async (api) => {
  api.keymap.registerLayer({
    commands: [
      {
        name: "my-custom-command",
        description: "Does something useful",
        handler: () => console.log("executed"),
      },
    ],
    bindings: [
      { keys: [{ name: "c", ctrl: true }], command: "my-custom-command" },
      { keys: [{ leader: "g" }, { name: "s" }], command: "session.search" },
    ],
  })
}
```

## TuiPluginApi Keymap Interface

```typescript
type TuiPluginApi = {
  // ...
  keymap: TuiKeymap          // NEW: typed as Keymap<Renderable, KeyEvent>
  keys: TuiKeys              // Key constants (backspace, enter, arrows, etc.)
  command?: TuiCommandApi    // DEPRECATED: kept for v1 plugin compatibility
  // ...
}
```

### TuiKeymap (aliased from @opentui/keymap)

```typescript
type TuiKeymap = Keymap<Renderable, KeyEvent>

// Methods available on TuiKeymap:
interface Keymap<T, E> {
  registerLayer(layer: {
    commands: Array<{
      name: string
      description?: string
      handler: () => void | Promise<void>
    }>
    bindings: Array<{
      keys: KeySequencePart[]    // Array of key events (supports multi-key chords)
      command: string            // Command name to dispatch
    }>
  }): () => void                 // Returns unregister function

  dispatchCommand(name: string): void     // Programmatically trigger a command
  showCommandPalette(): void              // Open the command palette UI
}
```

## Key Types

### TuiKeys — Built-in Key Constants

```typescript
type TuiKeys = {
  backspace: KeyEvent
  delete: KeyEvent
  enter: KeyEvent
  escape: KeyEvent
  tab: KeyEvent
  up: KeyEvent
  down: KeyEvent
  left: KeyEvent
  right: KeyEvent
  home: KeyEvent
  end: KeyEvent
  pageUp: KeyEvent
  pageDown: KeyEvent
  space: KeyEvent
  f1: KeyEvent through f12: KeyEvent
}
```

### KeyEvent (from @opentui/keymap)

```typescript
type KeyEvent = {
  name: string          // Key name: "a", "enter", "space", etc.
  ctrl?: boolean
  meta?: boolean        // Alt/Option
  shift?: boolean
  super?: boolean       // Cmd (macOS) / Win (Windows)
}
```

### KeySequencePart

```typescript
type KeySequencePart = 
  | { name: string; ctrl?: boolean; meta?: boolean; shift?: boolean; super?: boolean }
  | { leader: string }    // Leader prefix key (e.g., { leader: "g" })
```

## Binding Examples

### Single Key Binding

```typescript
// Ctrl+C to cancel
{ keys: [{ name: "c", ctrl: true }], command: "cancel" }
```

### Leader Key Sequences

```typescript
// "g s" → go to session search (vim-style leader key)
{ keys: [{ leader: "g" }, { name: "s" }], command: "session.search" }

// "g p" → command palette
{ keys: [{ leader: "g" }, { name: "p" }], command: "command.palette.show" }
```

### Multi-Modifier Keys

```typescript
// Ctrl+Shift+K → kill session
{ keys: [{ name: "k", ctrl: true, shift: true }], command: "session.kill" }

// Cmd+Shift+P → command palette (macOS style)
{ keys: [{ name: "p", meta: true, shift: true }], command: "command.palette.show" }
```

## Programmatic Command Dispatch

```typescript
// Dispatch a command from anywhere in the TUI plugin
api.keymap.dispatchCommand("my-custom-command")

// Show the command palette
api.keymap.dispatchCommand("command.palette.show")
```

## Cleanup Pattern

`registerLayer()` returns an unregister function. Use with `api.lifecycle.onDispose()`:

```typescript
const TuiPluginV2: TuiPlugin = async (api) => {
  const unregister = api.keymap.registerLayer({
    commands: [/* ... */],
    bindings: [/* ... */],
  })

  // Clean up on plugin dispose
  api.lifecycle.onDispose(() => {
    unregister()
  })
}
```

## Migration Checklist

When migrating from `api.command` to `api.keymap`:

- [ ] Replace `api.command.register([...])` with `api.keymap.registerLayer({ commands: [...], bindings: [...] })`
- [ ] Add explicit keybindings — the legacy API had no binding mechanism
- [ ] Replace `api.command.dispatch(name)` with `api.keymap.dispatchCommand(name)`
- [ ] Replace `api.command.prompt()` with `api.keymap.dispatchCommand("command.palette.show")`
- [ ] Store the unregister function and call it in `onDispose`
- [ ] Remove any v1 TuiCommandApi type references

## Related Types

See [types.md](types.md) for:
- `TuiKeybind` — legacy keybind interface
- `TuiCommand` — command definition shape
- `TuiCommandApi` — deprecated v1 API (for reference)
- `TuiPluginApi` — full TUI plugin API surface
