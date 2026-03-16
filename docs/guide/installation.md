# HiveMind Installation Guide

This guide is the single install/bootstrap entry for the `ecosystem-revamp` branch.

## Principles

- Use one bootstrap path.
- Let runtime create `.hivemind/` and the user-local `.opencode/**` projection.
- Do not hand-author `.hivemind/`, `.opencode/commands/`, `.opencode/agents/`, or `.opencode/plugins/`.
- Treat root `src/`, `agents/`, `commands/`, `workflows/`, and `skills/` as package authority; treat `.opencode/**` as projection only.

## Prerequisite

- OpenCode is already installed and runnable on the machine.

## Install And Bootstrap

From the target project root, run:

```bash
npx hivemind-context-governance init --preset guided-onboarding
```

This bootstrap entry:

1. Creates or repairs `.hivemind/`.
2. Mirrors shipped command and agent assets into the user-local `.opencode/**` projection.
3. Writes `.opencode/plugins/hivemind-context-governance.ts` as the local plugin stub.
4. Seeds the runtime attachment and bootstrap profile used by later runtime invocations.

## Verify

Run:

```bash
npx hivemind-context-governance harness --json
```

Healthy output should confirm runtime attachment and recommend the next runtime-safe command.

## First-Run Runtime Behavior

- If runtime state is missing, the entry kernel should auto-route toward `hm-init`.
- If runtime state is broken, the entry kernel should auto-route toward `hm-doctor`.
- `harness` is diagnostic only; it must not create runtime projection files by itself.

## Upgrade Or Repair

When upgrading or repairing an existing project, use the same bounded entry:

```bash
npx hivemind-context-governance init --preset guided-onboarding
```

If the runtime is damaged, run:

```bash
npx hivemind-context-governance doctor
```

Then re-check:

```bash
npx hivemind-context-governance harness --json
```
