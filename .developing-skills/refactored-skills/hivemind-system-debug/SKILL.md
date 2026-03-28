---
name: hivemind-system-debug
description: Debug-to-refactor transitions — reproducibility, narrowing, containment, rollback logic, and transition rules for unresolved breakage.
parent: use-hivemind
---

# hivemind-system-debug

## Table of Contents

- [Load Position](#load-position)
- [Purpose](#purpose)
- [Use This For](#use-this-for)
- [Do Not Use This For](#do-not-use-this-for)
- [Core Process](#core-process)
- [Context Distrust in Debugging](#context-distrust-in-debugging)
- [Debug Output Storage](#debug-output-storage)
- [Orchestrator Integration](#orchestrator-integration)
- [Outputs](#outputs)
- [Conditional Loading](#conditional-loading)
- [Bundled Resources](#bundled-resources)

## Load Position

Layer: Depth. Requires `use-hivemind` (entry router) loaded first.

This is the deep system-debug branch family for `use-hivemind`.

## Purpose
- reproduce failures before proposing repair
- narrow the failure domain systematically
- define rollback and containment boundaries
- decide when the work can transition from debug to refactor

## Use This For
- failing verification with unclear cause
- incident investigation during detox work
- risk containment before structural edits
- evidence collection for later refactor strategy selection

## Do Not Use This For
- speculative fixes without reproduction
- architecture mapping when the primary issue is still structural uncertainty
- late-stage verification after the cause is already known and fixed

## Core Process
1. Capture the failing behavior and reproducibility target.
2. Bound the symptom to the smallest known slice.
3. Collect evidence and track hypotheses.
4. Record rollback and containment posture before risky changes.
5. Declare either root cause, bounded unknown, or return-to-codemap decision.
6. Hand off only after debug-to-refactor readiness is explicit.

## Context Distrust in Debugging

During debugging, context rot is especially dangerous because misleading signals can send investigation in the wrong direction.

1. **Do not trust test output blindly during debug.** A test may pass because it encodes the wrong behavior, or fail because of setup noise — neither proves or disproves the bug being investigated. Apply the false signal detection protocol from `use-hivemind-context/references/false-signal-detection.md`.
2. **Do not trust documents that describe the system's intended behavior.** During debug, verify what the system *actually does* from code reads and execution, not from what docs say it *should* do.
3. **Record evidence classification.** For each piece of evidence collected, note whether it is `confirmed` (directly observed), `inferred` (reconstructed), or `unverified` (claimed but not checked).

## Debug Output Storage

Debug artifacts are stored in `{project}/.hivemind/activity/debug/{session_id}/`:

- `debug-report.json` — structured report with hypotheses, evidence, and conclusions
- `containment-notes.json` — rollback posture and risk assessment
- `evidence/` — subfolder for captured output, screenshots, or log extracts

This ensures debug work is inspectable and resumable across turns.

## Orchestrator Integration

Debug work is **always delegated** from the orchestrator. The orchestrator:
1. Provides the failing behavior description and scope boundary in the delegation packet.
2. Receives only: root cause or bounded unknown, evidence classification (confirmed/inferred/unverified), containment posture, and recommended next action.
3. Does NOT load raw debug logs, test output, or multi-file evidence into its own session.
4. Uses the return to decide whether to proceed to refactor (Stage 7+) or re-delegate for further narrowing.

## Outputs
- debug stage report
- containment notes
- refactor readiness recommendation
- evidence classification (confirmed / inferred / unverified)

## OpenCode Tool Matrix

| Debug Step | Preferred Tool | Why |
| --- | --- | --- |
| isolate failing files | `glob` + `grep` | narrow the search space |
| inspect the failing implementation | `read` | exact code path |
| run the failing probe | `bash` | real runtime evidence |
| inspect external docs or APIs | `context7_query-docs` / `webfetch` | current source of truth |

## Concrete Bash Examples

```bash
npx tsx --test tests/failing.test.ts 2>&1 | head -20
npx tsc --noEmit 2>&1 | head -20
npm run build 2>&1 | head -20
```

## Debug Decision Tree

1. **IF** the failure cannot be reproduced, **THEN** stop and request a tighter reproduction.
2. **IF** the failure reproduces but spans many modules, **THEN** isolate the smallest failing command before touching code.
3. **IF** the suspected fix changes contracts or architecture, **THEN** escalate instead of improvising.
4. **IF** the original probe passes but broader verification fails, **THEN** continue diagnosis instead of claiming success.

## Diagnosis Artifacts

Use `references/debug-workflow-reference.md` for the reproduce → isolate → hypothesize → test → fix → verify loop. Use `references/diagnosis-template.md` for narrative notes and `templates/diagnosis-report.json` for machine-readable output.

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Entry router — triggers this skill for debug workflows |
| `use-hivemind-delegation` | Delegation protocol — debug dispatches through this |
| `hivemind-execution` | Execution workflow — receives confirmed debug findings for remediation |

## Conditional Loading

| Condition | Load Reference |
|-----------|---------------|
| Runtime error encountered | `debug-loop.md` |
| Test failure to investigate | `verification-before-completion.md` |
| Build failure diagnosis | `debug-loop.md` + delegation to `hivemind-execution` |
| Multi-system integration issue | `debug-loop.md` + `hivemind-codemap` scan |
| Flaky test detection | `verification-before-completion.md` + `hivemind-gatekeeping` |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| Debug Loop | `references/debug-loop.md` | Debug-to-refactor transition loop protocol |
| Verification Before Completion | `references/verification-before-completion.md` | Evidence-before-assertions gate protocol |
| Direct Invocation | `tests/direct-invocation.md` | Test scenario for direct skill invocation |

## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `.hivemind/pathing/active-paths.json` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** Run `bash use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}` to confirm compliance.
