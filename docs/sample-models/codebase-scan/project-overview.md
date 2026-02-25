# Via-gent Project Overview

- Generated: 2026-02-24T22:37:15+0700
- Scan Mode: Exhaustive (`full_rescan`)
- Repository Type: Monolith
- Project Type: Web (TanStack Start + React)

## Executive Summary

Via-gent is a TypeScript-first web application built with React 19, TanStack Start/Router, and Vite. The project combines IDE-style workflows (editor, terminal, file tree), AI chat/provider orchestration, notes/knowledge features, and rich plugin-driven UI modules in a single codebase.

## High-Level Metrics

- Source files scanned (`src/**/*.{ts,tsx,js,jsx}`): 1457
- Source lines scanned: 285926
- UI components in `src/presentation/components`: 388
- Test files in `src` + `e2e`: 149
- API route entries under `src/routes/api`: 6

## Primary Stack

- Runtime: Node.js 20+ (local/dev), Cloudflare Workers / Netlify / Vercel (deploy targets)
- Language: TypeScript (strict)
- UI: React 19, TanStack Router/Start, Radix UI, Tailwind CSS 4
- State: Zustand v5 + Dexie persistence
- Storage: IndexedDB (Dexie), optional File System Access integration
- Testing: Vitest + Playwright

## Key Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)
