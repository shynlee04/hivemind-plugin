# Table of Contents — @json-render/react Stack

## Root
- `SKILL.md` — Entry point, quick start, core concepts
- `metadata.json` — Version, package metadata, repomix output ID

## References

### Architecture
- `references/architecture.md` — How json-render works: spec format, rendering pipeline, state management, streaming

### API
- `references/api/components.md` — React components: Renderer, JSONUIProvider, StateProvider, ActionProvider, VisibilityProvider, ValidationProvider
- `references/api/schemas.md` — Spec, Catalog, UIElement, Element schemas and how to define them
- `references/api/rendering.md` — Rendering pipeline: defineCatalog → defineRegistry → Renderer, dynamic props, visibility
- `references/api/types.md` — TypeScript types: Spec, UIElement, ComponentContext, EventHandle, StateStore, etc.

### Patterns
- `references/patterns/dashboard.md` — Dashboard development: streaming specs, data binding, metric widgets
- `references/patterns/widgets.md` — Widget creation: custom components, actions, validation, repeat scopes
- `references/integration.md` — Cross-stack integration: Next.js App Router, Vercel AI SDK chat, error boundaries, Vitest testing, code export, debugging workflow, catalog design methodology

## Scripts
- `scripts/update.sh` — Re-download repomix output and refresh references
