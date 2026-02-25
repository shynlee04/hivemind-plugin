# Deployment Guide

- Generated: 2026-02-24T22:37:15+0700

## Supported Targets

- Cloudflare Workers (primary)
- Vercel
- Netlify

## Cloudflare

- Config: `wrangler.jsonc`
- Build: `pnpm build:cloudflare`
- Deploy: `pnpm deploy`

GitHub workflow: `.github/workflows/deploy.yml` (`deploy-cloudflare` job).

## Vercel

- Adapter entry: `api/index.js`
- Config: `vercel.json`
- Build: `pnpm build:vercel`
- Deploy: `pnpm deploy:vercel` or `pnpm deploy:vercel:build`

GitHub workflow: `.github/workflows/deploy.yml` (`deploy-vercel` job).

## Netlify

- Config: `netlify.toml`
- Build: `pnpm build:netlify`
- Deploy: `pnpm deploy:netlify`

## CI/CD Workflows

- `ci.yml`: governance, typecheck, test, build artifact upload
- `deploy.yml`: manual target-based deployment
- `dependency-audit.yml`: scheduled/manual dependency checks
- `sync-to-main.yml`: filtered branch sync automation
