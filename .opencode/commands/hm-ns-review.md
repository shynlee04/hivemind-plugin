---
description: "quality gates | code review debug audit security eval ui"
argument-hint: ""
requires: [code-review, audit-uat, secure-phase, eval-review, ui-review, validate-phase, debug, forensics]
tools:
  read: true
  skill: true
---

Route to the appropriate quality / review skill based on the user's intent.
`hm-code-review-fix` was absorbed by `hm-code-review --fix` in #2790.

| User wants | Invoke |
|---|---|
| Review code for quality and correctness | hm-code-review |
| Auto-fix code review findings | hm-code-review --fix |
| Audit UAT / acceptance testing | hm-audit-uat |
| Security review of a phase | hm-secure-phase |
| Evaluate AI response quality | hm-eval-review |
| Review UI for design and accessibility | hm-ui-review |
| Validate phase outputs | hm-validate-phase |
| Debug a failing feature or error | hm-debug |
| Forensic investigation of a broken system | hm-forensics |

Invoke the matched skill directly using the Skill tool.
