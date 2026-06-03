# Hivemind Sidecar

Next.js 16 standalone application serving as the sidecar GUI for the
Hivemind runtime composition engine. Part of the Sidecar Control Plane
(SC) phase sequence.

## Architecture

Two-server model:

- **Plugin server** (SC-01/SC-02): Embedded HTTP server inside the Hivemind
  OpenCode plugin. Serves REST state endpoints, SSE events, and tool proxy
  POST routes on a random localhost port. Port is published to
  `.hivemind/state/sidecar-port.json`.

- **Sidecar app** (SC-03): This Next.js 16 standalone app. Runs on port 3099
  (default). Discovers the plugin port from the sentinel file and communicates
  exclusively via localhost HTTP. No direct filesystem access to Hivemind state.

## Getting Started

### Development

```bash
# Install dependencies
cd sidecar && npm install

# Start the plugin server (separate terminal)
# From the project root: npm run dev (or equivalent)

# Start the sidecar in dev mode
cd sidecar && npx next dev
```

Browse to http://localhost:3099.

### Production Build

```bash
cd sidecar && npm run build
```

Standalone output at `.next/standalone/server.js`.

### Production Run

```bash
# HIVEMIND_DIR must point to the project root
HIVEMIND_DIR=/path/to/project node .next/standalone/server.js
```

The `HIVEMIND_DIR` env var is required in standalone mode because `process.cwd()`
resolves to `.next/standalone/`, not the project root.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.2.2 | App framework with standalone output |
| react/react-dom | ^19.0.0 | UI runtime |
| @json-render/core | ^0.19.0 | Catalog definition (defineCatalog) |
| @json-render/react | ^0.19.0 | Renderer, StateProvider, createStateStore |
| @json-render/shadcn | ^0.19.0 | 36 pre-built shadcn component definitions |
| tailwindcss | ^4.0.0 | CSS framework |
| zod | ^4.0.0 | Schema validation for json-render |

## Port Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3099 | Sidecar Next.js app port |
| NEXT_PUBLIC_PLUGIN_PORT | — | Plugin server port (set when sentinel file not used) |

## Fallback Port

When the plugin server is not running and no port is configured, the
sidecar falls back to port 3199 and shows a "not available" state.
This enables independent development of the sidecar UI without
requiring the plugin server.

## Verification Commands

```bash
# Typecheck
cd sidecar && npx tsc --noEmit

# Unit tests
cd sidecar && npx vitest run

# Production build
cd sidecar && npx next build
```
