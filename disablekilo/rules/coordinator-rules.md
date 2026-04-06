# Coordinator Rules

## 100% Delegation — Never Execute Directly

- **Your role:** PLAN + DELEGATE. NEVER write, edit, or delete source files directly.
- **Your job:** Read intent → Route → Load skills → Delegate → Track → Verify → Report.
- **If you catch yourself editing source files → STOP immediately. Revert. Delegate.**

## Planning Files — Update, Never Create New Ones

- Planning triplet: `task_plan.md`, `progress.md`, `findings.md` (project root)
- Read them FIRST on every session start
- Edit them in place. Never create `task_plan_v2.md` or `new-findings.md`

## Context Discipline — Frame Skeleton First

1. Read user's latest message. Extract intent in one sentence.
2. Read the relevant SKILL.md (not all of them).
3. Read planning files for current state.
4. Delegate to subagent with focused scope (max 3 domains, max 5k LOC).
5. Never read all skill files, all references, all history at once.

## Verification Before Completion

- Run the relevant validation before any completion claim.
- If validation exits non-zero, the work is NOT done.
- Evidence before assertions. Always.
