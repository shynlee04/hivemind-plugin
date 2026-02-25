# Data Models

- Generated: 2026-02-24T22:37:15+0700

## Data Architecture Overview

This project uses browser-side persistence (Dexie/IndexedDB) with Zod-backed canonical domain schemas.

## Domain Schema Catalog

| Schema File | Core Entities |
|---|---|
| `src/domain/schemas/project.schema.ts` | Project, layout, storage/device metadata, plugin enablement |
| `src/domain/schemas/thread.schema.ts` | Thread, thread message, tool call metadata |
| `src/domain/schemas/file.schema.ts` | File metadata, sync state/status records |
| `src/domain/schemas/note.schema.ts` | Note entities and hierarchical note tree |
| `src/domain/schemas/plugin.schema.ts` | Plugin types/capabilities and project plugin config |

## Persistence Model

`ViaGentDatabase` (`src/infrastructure/persistence/dexie-db-class.ts`) declares typed table groups for:

- core project/IDE state
- AI and chat state
- sync and file metadata
- knowledge indexing and notes
- plugin marketplace/state
- study/quiz content
- workflow and snippet persistence

Migration history is registered centrally in `src/infrastructure/persistence/dexie-db-migrations.ts`.
