# Hivemind — Requirements

**Created:** 2026-05-07  
**Source:** Full audit reconciliation (SRC, Planning, Primitives) + Codebase Map + HIVEMIND-PHILOSOPHY-2026-04-10.md + PROJECT-ISSUES-2026-05-05.md

**Phase 0 authority:** `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` supersedes older package/CLI naming. Product = Hivemind. Package/bin = `hivemind`. `opencode-harness` and `hivemind-tools` are legacy aliases only.

---

## Path 1 — Agent-Callable Deterministic Features

Features agents can explicitly call or skills can activate.

| ID | Description | Priority | Status | Evidence |
|----|-------------|----------|--------|----------|
| f-01 | NL command routing (`nl-route` tool) | HIGH | DELIVERED | `src/tools/nl-route.ts`, test coverage |
| f-02 | Delegation dispatch (`delegate-task` tool) | HIGH | DELIVERED | `src/tools/delegate-task.ts`, `delegation-manager.ts` (450 LOC) |
| f-03a | Agent registry with permission enforcement | HIGH | PARTIAL | 89 agent files exist, no runtime enforcement |
| f-03b | Skill registry with consumption tracking | HIGH | PARTIAL | 123 active skill directories plus `.gitkeep`; integration-contracts skill maps bindings |
| f-03c | Tool registry and wiring | HIGH | PARTIAL | 16 tools in plugin.ts, no unified registry |
| f-03e | Custom tool registry and stacking | MEDIUM | PARTIAL | Tools exist, no stacking |
| f-03f | Hook registry and feature wiring | MEDIUM | PARTIAL | 6 hook types wired, no registry |
| f-06 | Multi-lane delegation (native/SDK/PTY) | HIGH | PARTIAL | Core WaiterModel works, lanes exist but not routed |
| f-06a | Background shell / PTY control-plane contract | HIGH | SPEC READY | CP-PTY-00 phase skeleton defines lanes, permission gates, bounded output, fallback, lifecycle, and restart truth |
| f-07 | Trajectory and task-plus lifecycle | MEDIUM | PARTIAL | Modules exist, not wired to lifecycle |

---

## Path 2 — Runtime Programmatic Features

Automatic operations via OpenCode hooks, events, injections, transforms.

| ID | Description | Priority | Status | Evidence |
|----|-------------|----------|--------|----------|
| f-08 | Event-tracker (queryable context from session events) | CRITICAL | PARTIAL | Event-tracker writes but output is noise; needs redesign (HER-3) |
| f-09 | Long-haul session survival (compaction hooks) | MEDIUM | PARTIAL | Compaction-preservation wired (HER-2) |
| f-10 | SDK/server API injection and hook steering | MEDIUM | PARTIAL | session-api.ts wraps SDK calls |
| f-04a.i | Intent analyzer / purpose classifier | MEDIUM | PARTIAL | purpose-classifier 8 classes, no auto-routing |
| GOV-01 | Governance block injection at system.transform | HIGH | DELIVERED | CA-03: governance-block.ts wired into create-core-hooks.ts |
| TOG-01 | Toggle gate infrastructure (isToggleEnabled, getDiscussMode) | HIGH | DELIVERED | CA-03: toggle-gates.ts, 6 toggles wired |
| BEH-01 | Behavioral profile resolution from config mode | HIGH | DELIVERED | CA-02: behavioral-profile/ module, mode → profile mapping |

---

## Path 3 — Governance / Registry / Permissions / Configuration

The control layer — what exists, what is allowed, what is wired.

| ID | Description | Priority | Status | Evidence |
|----|-------------|----------|--------|----------|
| HIVEMIND-STATE-01 | `.hivemind/` canonical directory structure | CRITICAL | BOOTSTRAPPED | BOOT-03 proves init creates 19 roots; typed CRUD ownership remains partial |
| HIVEMIND-STATE-02 | `configs.json` full schema operational | CRITICAL | DELIVERED | CA-01: Zod schema with 29 fields, readConfigs()/writeConfigs() |
| HIVEMIND-STATE-03 | File format conventions for `.hivemind/` artifacts | HIGH | PARTIAL | Conventions documented, no enforcement |
| REGISTRY-01 | Unified primitive registry (agents/skills/commands/tools) | HIGH | PARTIAL | Individual scanners exist, no unified registry |
| REGISTRY-02 | Permission matrix with runtime enforcement | HIGH | MISSING | No runtime permission enforcement |
| REGISTRY-04 | Cross-primitive validation on compile | MEDIUM | PARTIAL | config-compiler.ts exists |
| f-04 | Auto-commands engine with $ARGUMENTS parsing | HIGH | MISSING | command-engine/ stub only; f-04 entirely missing |
| f-04a | Workflow router with conditional dispatch | HIGH | MISSING | No workflow routing exists |

---

## Path 4 — Sidecar / Onboarding / Configuration

User-facing setup, configuration, and control surfaces.

| ID | Description | Priority | Status | Evidence |
|----|-------------|----------|--------|----------|
| BOOTSTRAP-01 | npm package: `npm install hivemind` | CRITICAL | FOUNDATION | package.json configured, not yet published |
| BOOTSTRAP-02 | `npx hivemind init` interactive setup | CRITICAL | DELIVERED | BOOT-02 through BOOT-07 prove CLI/init, state creation, recovery, config defaults, doctor, and clean-state E2E proof |
| BOOTSTRAP-04 | Doctor/checkup mode for primitive health | HIGH | DELIVERED | BOOT-06 proves doctor health-check PASS with structure, primitives, config, SDK, typecheck, tests, and modules |
| SIDECAR-01 | Sidecar reads artifact JSON from `.hivemind/` and `.planning/` | MEDIUM | PARTIAL | readonly-state.ts exists |
| SIDECAR-PTY-01 | Read-only terminal/progress projection | LOW-MEDIUM | DEFERRED | SC-PTY-01 skeleton; blocked on CP-PTY-01 and Q2 sidecar confirmation |
| CONF-01 | Config consumer wiring | CRITICAL | PARTIAL | Phase 0 config contract maps active fields; unresolved fields must be wired or explicitly deferred |

---

## Critical Gaps (MISSING)

| ID | Description | Blocked By |
|----|-------------|------------|
| f-04 | Auto-commands + workflow router + intent classification | Needs design from skeleton §5.2 |
| BOOTSTRAP-02-RUNTIME-PROOF | CLI init command must prove `.hivemind/` and `.opencode/` bootstrap behavior end-to-end | RESOLVED by BOOT-07 |
| BOOTSTRAP-RECOVERY | Primitives bootstrap on deletion (postinstall or restore) | RESOLVED for local CLI recovery by BOOT-04 and BOOT-07; package postinstall remains future packaging work if desired |
| CONF-01-CONSUMERS | Config field runtime consumers | Needs Phase 0 config contract follow-through and runtime proof |
| LIFECYCLE-GATE | gate-l3-lifecycle-integration criteria docs | Needs synthesis from ARCHITECTURE.md |
| CPPTY-IMPLEMENTATION | Runtime shell/PTY control-plane MVP | Blocked on CP-PTY-00 + BOOT-07 unless explicitly authorized earlier |

---

## Quality Contracts

| Contract | Scope | Status |
|----------|-------|--------|
| HMQUAL-01 through HMQUAL-08 | All hm-* skills quality | Synthesized Phase 26; 48/51 skills ≥6/8 |
| RICH-8 gate | All hm-* skills | 0 currently pass (Q5 honest), target: post-f-04 |
| Gate triad | Lifecycle → Spec → Evidence | gate skills exist, lifecycle references empty |

---
## CP-PTY Draft Requirement Links

- Phase requirements: `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/REQUIREMENTS-2026-05-08.md`
- Phase spec: `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/SPEC-2026-05-08.md`
- Route: `.planning/roadmap/shell-pty-control-plane-route-2026-05-08.md`

*Last updated: 2026-05-08 after BOOT-07 E2E proof completion*
