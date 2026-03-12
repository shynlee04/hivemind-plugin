# Doc Intel Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden document creation so requested bodies persist, structured formats cannot be reported as successful when invalid, and create/materialize flows emit receipts backed by post-write verification.

**Architecture:** Keep `src/lib/doc-intel.ts` as the canonical write contract and keep `src/tools/hivemind-doc.ts` as a thin adapter. Add regression coverage first, then implement format-aware create/materialize semantics in the library, and finally surface verification receipts through the tool response metadata.

**Tech Stack:** TypeScript, Node.js `fs/promises`, OpenCode Plugin SDK, `node:test`, existing DocWeaver helpers

---

### Phase 1: RED baseline for create/materialize hardening

**Files:**
- Create: `docs/plans/2026-03-12-doc-intel-hardening-plan.md`
- Modify: `tests/hivemind-doc.test.ts`
- Verify: `npx tsx --test tests/hivemind-doc.test.ts`

**Step 1: Add a library regression for markdown body persistence**

Write a failing test that calls `createDocument(...)` with markdown body content and proves the created `.md` file still only contains the title stub.

**Step 2: Add tool regressions for create-action persistence and structured-format integrity**

Write failing tests that call `createHivemindDocTool(...).execute({ action: "create", ... })` and prove:
- requested markdown body content is dropped from the created `.md` file
- `.json` creation cannot return `status: "success"` when the written file is not valid JSON

**Step 3: Run the targeted test file and capture the expected failures**

Run: `npx tsx --test tests/hivemind-doc.test.ts`
Expected RED signals:
- markdown body persistence assertions fail for library and tool create flows
- JSON integrity assertion fails because create reports success for markdown-shaped output

### Phase 2: GREEN the canonical library contract

**Files:**
- Modify: `src/lib/doc-intel.ts`
- Verify: `npx tsx --test tests/hivemind-doc.test.ts`

**Step 1: Extend create/materialize semantics in `createDocument`**

Accept requested body content, materialize markdown bodies for `.md`, and define structured-format behavior for `.json`, `.yaml`, `.yml`, and `.xml` instead of always emitting markdown scaffolding.

**Step 2: Add post-write validation before success returns**

Verify the on-disk bytes after `atomicWrite`, reject invalid structured content, and keep hash/opId generation tied to the verified file contents.

**Step 3: Re-run the targeted regression file until the Phase 1 failures turn green**

### Phase 3: GREEN the tool adapter contract

**Files:**
- Modify: `src/tools/hivemind-doc.ts`
- Verify: `npx tsx --test tests/hivemind-doc.test.ts`

**Step 1: Thread `content` through the `create` action**

Pass requested body content into the canonical library create/materialize path instead of dropping it at the tool boundary.

**Step 2: Surface verification receipts in success metadata**

Return the verified path/hash/opId plus any format-validation receipt fields needed by future callers.

### Phase 4: Refactor and broaden verification

**Files:**
- Modify: `tests/hivemind-doc.test.ts`
- Modify: `src/lib/doc-intel.ts`
- Modify: `src/tools/hivemind-doc.ts`

**Step 1: Consolidate shared create verification helpers**

Keep format-aware validation logic in one place so library and tool callers cannot drift.

**Step 2: Add follow-up regressions for receipts and malformed structured content**

Cover invalid YAML/XML payloads, verify post-write receipt fields, and preserve the RED-GREEN-REFACTOR cycle for each new rule.
