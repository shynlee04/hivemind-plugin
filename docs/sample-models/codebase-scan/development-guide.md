# Development Guide

- Generated: 2026-02-24T22:37:15+0700

## Prerequisites

- Node.js 20+
- pnpm 10+
- Modern Chromium-based browser for full local feature support

## Install

```bash
pnpm install
```

## Run Locally

```bash
pnpm dev
```

Alternative deploy-target dev modes:

```bash
pnpm dev:cloudflare
```

## Build

```bash
pnpm build
pnpm build:cloudflare
pnpm build:vercel
pnpm build:netlify
```

## Typecheck and Tests

```bash
pnpm typecheck
pnpm typecheck:fast
pnpm test
pnpm test:fast
pnpm test:e2e
```

## Governance Checks

```bash
pnpm governance
pnpm governance:size
pnpm governance:imports
pnpm deps:circular
```

## Common Developer Workflows

- Lint/fix: `pnpm lint`, `pnpm lint:fix`
- i18n extraction: `pnpm i18n:extract`
- Contract/schema sync: `pnpm contracts:check`
- Bundle analysis: `pnpm build:analyze`
