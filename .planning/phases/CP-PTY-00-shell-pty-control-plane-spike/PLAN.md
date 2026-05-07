---
phase: CP-PTY-00-shell-pty-control-plane-spike
status: ready
created: 2026-05-08
evidence_level: L5
depends_on:
  - BOOT-02R-governance-reconciliation
parallel_with:
  - BOOT-03-state-init
  - BOOT-04-primitives-recovery
  - BOOT-05-config-bootstrap-defaults
blocks:
  - CP-PTY-01-background-shell-control-plane-mvp
  - f-04 routing if routing will invoke background command lanes
allowed_surfaces:
  - .planning/**
forbidden_surfaces:
  - src/**
  - tests/**
  - .opencode/**
  - .hivemind/**
---

# CP-PTY-00 Plan

## Goal

Complete the shell/PTY control-plane spike so future implementation has source-backed requirements, architecture boundaries, and dependency gates.

## Tasks

| Task | Description | Output |
|---|---|---|
| CPPTY00-T01 | Reconcile codebase surfaces and risk lanes. | `CONTEXT-2026-05-08.md` |
| CPPTY00-T02 | Preserve external ecosystem research and adopt/adapt/reject decisions. | `RESEARCH-2026-05-08.md` |
| CPPTY00-T03 | Lock draft requirements and blocked runtime claims. | `REQUIREMENTS-2026-05-08.md` |
| CPPTY00-T04 | Produce implementation-entry spec for CP-PTY-01. | `SPEC-2026-05-08.md` |
| CPPTY00-T05 | Update roadmap, state, requirements, and codebase maps. | Governance diffs |

## Verification

- Inspect that every CP-PTY-00 requirement maps to a spec section.
- Inspect that ROADMAP and STATE identify CP-PTY-00 as docs/spec only.
- Inspect that CP-PTY-01 remains blocked on BOOT-07 or explicit user authorization.
