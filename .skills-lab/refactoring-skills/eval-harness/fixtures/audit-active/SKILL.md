---
name: meta-builder
description: Routes user intent to the right skill and loads prerequisite skills
version: 1.0.0
triggers:
  - "route this request"
  - "which skill should I use"
  - "load skills for"
  - "figure out what to do"
  - "plan my approach"
---

# Meta-Builder

Routes user intent to the correct skill and manages prerequisite skill loading.

## FIRST ACTION

1. Run `bash scripts/preflight.sh "<user-request>"`
2. Parse output: PRIMARY_SKILL, GROUP, STACK_SKILLS, QUESTIONS_ALLOWED
3. Load prerequisite skills based on GROUP
4. Block if preflight fails (exit 1)
