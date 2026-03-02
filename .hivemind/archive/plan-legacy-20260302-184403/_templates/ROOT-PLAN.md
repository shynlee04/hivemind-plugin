---
id: "${TYPE}${ID}"
type: root
scope: "${SCOPE}"
title: "${TITLE}"
status: open
parent: null
children: []
dependencies: []
tags: []
created: "${DATE}"
last_updated: "${DATE}"
owner: "${AGENT}"
session_ref: null
completion_pct: 0
---

# ${TITLE}

> **Plan ID**: `${TYPE}${ID}` | **Status**: `open` | **Owner**: `${AGENT}`
> **Children**: See `sub-plan/${TYPE}${ID}-SUB*-PLAN.md`

<context>
<!-- Brief situational context — WHY this plan exists. 2-3 sentences max. -->
<!-- Agents read this section FIRST for fast orientation. -->
</context>

---

## Overview

<!-- What does this plan accomplish? What's the end state? -->

## Prerequisites

<!-- Dependencies, access, tools, prior knowledge required -->

- [ ] Prerequisite 1
- [ ] Prerequisite 2

---

## Branches (Sub-Plans)

<!-- Each branch maps to a sub-plan file in sub-plan/ -->

| ID | Title | Status | Dep | File |
|----|-------|--------|-----|------|
| SUB01 | <!-- title --> | `open` | — | [`${TYPE}${ID}-SUB01-PLAN.md`](sub-plan/${TYPE}${ID}-SUB01-PLAN.md) |
| SUB02 | <!-- title --> | `open` | SUB01 | [`${TYPE}${ID}-SUB02-PLAN.md`](sub-plan/${TYPE}${ID}-SUB02-PLAN.md) |

---

<decisions>
<!-- Structured decision log — machine-extractable -->

| # | Decision | Rationale | Date | Reversible? | Impact |
|---|----------|-----------|------|-------------|--------|
| 1 | <!-- decision --> | <!-- why --> | ${DATE} | YES/NO | <!-- which nodes affected --> |

</decisions>

---

<action_items>
<!-- Active work items — status tracked here, not in sub-plans -->

- [ ] `OPEN` — Action item 1
- [ ] `OPEN` — Action item 2

</action_items>

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| <!-- risk --> | H/M/L | H/M/L | <!-- strategy --> |

## Rollback Plan

<!-- How to undo if this plan goes sideways -->

---

<symlinks>
<!-- Cross-references to related artifacts. Keep current. -->

- Validation: [`VALIDATION-${TYPE}${ID}-PLAN.md`](VALIDATION-${TYPE}${ID}-PLAN.md)
- State: [`_state.json`](_state.json)

</symlinks>

---

<footer>

## Session Notes

<!-- Append notes per session. Format: [DATE] [SESSION_TYPE] note -->

## Next Actions

<!-- The LAST thing written before session ends. Copy-paste ready for next session. -->

## Context for Continuation

<!-- If compact or restart happens, this section IS the handoff. -->
<!-- Include: what's done, what's in progress, what's blocked, exact next step. -->

</footer>
