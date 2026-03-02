---
id: "${TYPE}${ID}-SUB${NN}"
type: sub
scope: "${SCOPE}"
title: "${TITLE}"
status: open
parent: "${TYPE}${ID}"
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

> **Plan ID**: `${TYPE}${ID}-SUB${NN}` | **Status**: `open` | **Parent**: [`${TYPE}${ID}-PLAN.md`](../${TYPE}${ID}-PLAN.md)
> **Atomics**: See `atomic-plan/${TYPE}${ID}-SUB${NN}-A*-PLAN.md`

<context>
<!-- What is this sub-plan solving? How does it connect to the parent? -->
<!-- 2-3 sentences. Agents read this for fast orientation. -->
</context>

---

## Goal

<!-- Single measurable outcome for this sub-plan -->

## Scope

| In Scope | Out of Scope |
|----------|-------------|
| <!-- paths, concepts --> | <!-- explicitly excluded --> |

---

## Atomic Tasks

<!-- Each atomic maps to a file in atomic-plan/ OR is inline if trivial -->

| ID | Task | Status | Dep | Est | File |
|----|------|--------|-----|-----|------|
| A01 | <!-- task --> | `open` | — | S/M/L | [`${TYPE}${ID}-SUB${NN}-A01-PLAN.md`](atomic-plan/${TYPE}${ID}-SUB${NN}-A01-PLAN.md) |
| A02 | <!-- task --> | `open` | A01 | S/M/L | inline |

### Inline Atomics (trivial tasks — no separate file needed)

**A02**: <!-- description -->
- [ ] Step 1
- [ ] Step 2
- Evidence: <!-- what proves completion -->

---

<decisions>

| # | Decision | Rationale | Date | Reversible? |
|---|----------|-----------|------|-------------|

</decisions>

---

<findings>
<!-- Investigation/research findings cached here to prevent repeat exploration -->
<!-- Format: [DATE] [SOURCE] finding -->

</findings>

---

<action_items>

- [ ] `OPEN` — Action item 1

</action_items>

---

## Completion Criteria

- [ ] All atomics marked `completed` or `pivoted`
- [ ] Validation artifact exists: `VALIDATION-${TYPE}${ID}-SUB${NN}-PLAN.md`
- [ ] Parent plan's branch table updated with status
- [ ] No open blockers

---

<symlinks>

- Parent: [`${TYPE}${ID}-PLAN.md`](../${TYPE}${ID}-PLAN.md)
- Validation: [`VALIDATION-${TYPE}${ID}-SUB${NN}-PLAN.md`](VALIDATION-${TYPE}${ID}-SUB${NN}-PLAN.md)
- Siblings: <!-- link to related SUB plans -->

</symlinks>

---

<footer>

## Session Notes

## Next Actions

## Context for Continuation

</footer>
