# Dashboard-v2 Phase 8 W1.delta Retune Packet

> Date: 2026-02-26
> Wave: `W1.delta`
> Trigger: `W1` post-gate failure on dashboard-v2 type baseline
> Mode: strict, plan_driven
> Constraints: no-subdelegation, no-new-research, main-session controlled

---

## 1) Delta Trigger and Evidence

W1 post-gate status moved to partial/blocked due to dashboard-v2 type baseline failure.

Evidence commands (already executed):
- `npm test` (repo root): pass
- `npx tsc --noEmit` (repo root): pass
- `bunx tsc --noEmit` (`src/dashboard-v2`): fail

Failure evidence (dashboard-v2):
- Total TypeScript diagnostics: `320`
- Error class distribution:
  - `TS2339`: `165` (`box` missing on `JSX.IntrinsicElements`)
  - `TS2322`: `133` (`fg` and related props typed as DOM/SVG attrs)
  - `TS2305`: `5` (missing exports from `@opentui/core` / `@opentui/react`)
  - `TS2304`: `6` (`localStorage` / `navigator` missing)
  - `TS2614`: `2` (React named export mismatch)
  - `TS7006`: `2` (implicit `any` parameters)
  - `TS2345`: `1` (input handler type mismatch)

Primary evidence refs:
- `/Users/apple/.local/share/opencode/tool-output/tool_c99b57c98001GUYmLOiy6Um9mG`
- `src/dashboard-v2/src/index.tsx`
- `src/dashboard-v2/src/components/InputModal.tsx`
- `src/dashboard-v2/src/i18n.ts`

---

## 2) W1.delta Objective

Normalize dashboard-v2 TypeScript baseline for OpenTUI/JSX so the real-time spine work can continue under W1 gate discipline.

Delta success target:
- `bunx tsc --noEmit` in `src/dashboard-v2` returns zero errors.
- Root gates stay green (`npm test`, `npx tsc --noEmit`).

---

## 3) Scoped Retune Lanes

### D1: Runtime and package contract lock

Goal:
- Align imports and runtime entry points with installed OpenTUI package versions.

Files in scope:
- `src/dashboard-v2/package.json`
- `src/dashboard-v2/src/index.tsx`
- `src/dashboard-v2/src/components/InputModal.tsx`

Acceptance:
- No `TS2305` on OpenTUI imports.
- No `TS2614` React import mismatch.

### D2: JSX namespace and intrinsic element typing

Goal:
- Ensure JSX uses OpenTUI component typing, not DOM/SVG assumptions.

Files in scope:
- `src/dashboard-v2/src/index.tsx`
- `src/dashboard-v2/src/components/InputModal.tsx`
- dashboard-v2 TS config / type declaration files (as required by existing project layout)

Acceptance:
- `TS2339` (`box` missing) eliminated.
- `TS2322` (`fg` prop incompatibility) eliminated.

### D3: Environment boundary guards (TUI vs browser globals)

Goal:
- Remove unguarded browser globals from TUI runtime path.

Files in scope:
- `src/dashboard-v2/src/i18n.ts`

Acceptance:
- No `TS2304` for `localStorage`/`navigator`.
- Behavior remains deterministic in non-browser runtime.

### D4: Input/event typing cleanup

Goal:
- Normalize callback signatures and remove implicit-any paths.

Files in scope:
- `src/dashboard-v2/src/components/InputModal.tsx`
- `src/dashboard-v2/src/index.tsx`

Acceptance:
- No `TS7006` or `TS2345` in dashboard-v2 compile run.

---

## 4) Gate Matrix (W1.delta)

### Pre-gate
- Scope restricted to D1-D4 only.
- Constraint lock confirmed (no delegation expansion, no new research).
- Evidence baseline captured from failing compile.

### In-gate
- Apply one lane at a time (D1 -> D2 -> D3 -> D4).
- Run `bunx tsc --noEmit` after each lane to verify reduction trajectory.
- If error count rises, rollback lane-local changes before continuing.

### Post-gate
- Mandatory commands:
  - `cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit`
  - `cd /Users/apple/hivemind-plugin && npm test`
  - `cd /Users/apple/hivemind-plugin && npx tsc --noEmit`
- Adjudicate pass/partial/fail with evidence logs.

---

## 5) Controlled Execution Sequence

S1. Baseline confirm
- Re-run dashboard-v2 typecheck and snapshot diagnostic distribution.

S2. D1 remediation and verify
- Resolve OpenTUI/React import contract issues.

S3. D2 remediation and verify
- Fix JSX intrinsic typing and prop-type alignment.

S4. D3 remediation and verify
- Guard browser-global access for TUI runtime.

S5. D4 remediation and verify
- Fix handler typing and strict-mode callback signatures.

S6. Global gates
- Execute root test and root typecheck.

S7. Closeout decision
- Pass: advance W1.
- Partial/fail: emit `W1.delta2` with unresolved blockers mapped.

---

## 6) Risk Register (Delta)

| Risk | Impact | Probability | Mitigation | Fallback |
|------|--------|-------------|------------|----------|
| Wrong OpenTUI API assumption | High | Medium | verify against installed package surface before edits | isolate to D1 and rollback |
| JSX typing fix breaks render behavior | High | Medium | lane-local compile + run checks | split into `W1.delta2` |
| Browser guard alters i18n behavior | Medium | Medium | deterministic fallback language path | defer to P9 verification |
| Hidden cross-file coupling in index.tsx | High | High | sequential lane gates with compile after each | controlled defer + explicit blocker |

---

## 7) Phase 9 Linkage (If carry-forward required)

If `W1.delta` cannot close completely, emit obligations:
- P9.1 Reliability: runtime guard hardening for environment-specific APIs.
- P9.2 Refactor: reduce `index.tsx` coupling and isolate typed UI primitives.
- P9.3 Verification: add focused compile/test guard for dashboard-v2 lane.

---

## 8) Constraint Footer (Immutable)

- No sub-of-sub delegation allowed.
- No further research/inventory waves for this delta.
- Main session remains sole orchestration authority.
