---
id: "${TYPE}${ID}-SUB${NN}-A${AA}"
type: atomic
scope: "${SCOPE}"
title: "${TITLE}"
status: open
parent: "${TYPE}${ID}-SUB${NN}"
dependencies: []
tags: []
created: "${DATE}"
last_updated: "${DATE}"
owner: "${AGENT}"
session_ref: null
files_touched: []
git_evidence: []
---

# ${TITLE}

> **Atomic ID**: `${TYPE}${ID}-SUB${NN}-A${AA}` | **Status**: `open`
> **Parent**: [`${TYPE}${ID}-SUB${NN}-PLAN.md`](../${TYPE}${ID}-SUB${NN}-PLAN.md)

<context>
<!-- What is this atomic task? Single concrete action. -->
</context>

---

## Task

**Objective**: <!-- one sentence -->

**Files**:
- Create: `<!-- path -->`
- Modify: `<!-- path:lines -->`
- Test: `<!-- path -->`

---

## Steps

- [ ] Step 1: <!-- action -->
- [ ] Step 2: <!-- action -->
- [ ] Step 3: <!-- verify -->

---

## Evidence

<!-- Populated on completion. Machine-parsable. -->

```
git_commits: []
test_output: ""
verification_cmd: ""
verification_result: ""
```

---

## Completion Criteria

- [ ] Task executed
- [ ] Evidence collected (git commit hash, test output, or verification command)
- [ ] Parent sub-plan's atomic table updated
- [ ] No regressions introduced

---

<symlinks>

- Parent: [`${TYPE}${ID}-SUB${NN}-PLAN.md`](../${TYPE}${ID}-SUB${NN}-PLAN.md)
- Root: [`${TYPE}${ID}-PLAN.md`](../../${TYPE}${ID}-PLAN.md)

</symlinks>

---

<footer>

## Session Notes

## Next Actions

</footer>
