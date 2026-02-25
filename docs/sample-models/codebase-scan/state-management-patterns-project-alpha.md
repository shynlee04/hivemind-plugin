# State Management Patterns (project-alpha)

- Generated: 2026-02-24T22:37:15+0700

## Core Pattern

The codebase uses Zustand as the primary state layer, with selective persistence via `zustand/middleware` and Dexie-backed custom storage adapters.

## Observed Store Topology

- Consolidated exports via `src/infrastructure/persistence/stores/index.ts`.
- Store families include: IDE, project/workspace, chat/conversation, providers, permissions, filesystem snapshots, RAG, study, notifications, layout, terminal.
- React integration frequently uses `useShallow` selectors to reduce re-renders and stabilize object selector usage.

## Persistence Strategy

- In-memory + localStorage for lightweight preferences.
- Dexie-backed storage for heavier or durable state domains (`conversationState`, `ragState`, `agentConfigs`, etc.).
- Hydration utilities and migration helpers present for state evolution.
