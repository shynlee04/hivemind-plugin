---
description: Diagnose and repair broken framework chains, dead references, and contract violations.
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh doctor .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — pipeline status and health):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

QA diagnostics (auto-executed — fix-specific diagnostic questions):
!`bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh fix_broken L1 medium`

Dead reference scan (auto-executed):
!`grep -rl "meta-builder-governance\|hivefiver-persona-routing\|hivefiver-spec-distillation\|hivefiver-specforge\|hivefiver-skillforge\|hivefiver-gsd-bridge\|hivefiver-ralph-bridge\|hivefiver-gsd-compat" .opencode/ 2>/dev/null || echo "CLEAN: No dead references found"`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh doctor "$ARGUMENTS" .`

Note: doctor always passes gate check — it bypasses the pipeline.
</enforcement>

<objective>
Take audit findings or user-reported problems, diagnose root causes, propose fixes, apply them with user approval, and verify the repairs hold.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Identify the problem source:
- If coming from /hivefiver-audit: read the findings report from STATE.md
- If user-reported: use QA diagnostics from enforcement block to ask structured questions:
  - "What's broken?" (symptom description)
  - "When did it break?" (timeline)
  - "What changed before it broke?" (root cause candidates)
  - "Which assets are affected?" (scope)
- Check the dead reference scan from the enforcement block above
- Check pipeline_error field from pipeline state — if present, this is an error recovery doctor

Step 2: Diagnose root cause for each finding:
- Trace the broken chain: which asset references what, and where does the chain break?
- Identify whether the fix is: delete reference, create missing asset, or rewrite referencing asset
- Classify fix complexity: trivial (delete dead ref) | moderate (rewrite section) | complex (redesign)

Step 3: Propose fix plan:
- List each fix with: file path, current state, proposed change, risk assessment
- Present to user for approval before applying

Step 4: Apply fixes (after user approval):
- **Read before write** — always read the target file first
- **Schema guard snapshot (MANDATORY before frontmatter edits)**:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh snapshot <file_path> .
  ```
- Apply the minimal change needed (no gratuitous rewrites)
- Verify each fix by re-reading the modified file
- **Schema guard verify (MANDATORY after frontmatter edits)**:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/schema-guard.sh verify <file_path> .
  ```

Step 5: Post-fix verification:
- Re-run the dead reference scan: `grep -rl` for known deleted asset names
- Confirm zero new broken references introduced
- Run anti-pattern scan on modified files

Step 6: Error recovery (if pipeline_error exists):
```bash
# Clear the error after successful fix
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-recovery "retry" .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh clear-error .
```

Step 7: Update STATE.md:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed doctor .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
```
- Record: fixes applied (file path + change summary)
- Record: verification evidence (command outputs)
- Record: residual risks (anything that couldn't be fixed automatically)

Step 8: Run runtime enforcement post-turn (MANDATORY):
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```
Include the output as evidence in your completion claim.
</process>

<quality_gate>
Gate 3 (Evidence Integrity):
- [ ] Every fix traces to a diagnosed root cause
- [ ] Read-before-write enforced for all modifications
- [ ] Post-fix verification shows zero regressions
- [ ] Evidence collected for each repair (before/after)

Gate 4 (Export Integrity):
- [ ] Handoff payload includes residual risks
- [ ] Next steps are deterministic
- [ ] STATE.md updated with repair log
</quality_gate>

<output_contract>
Return:
- diagnosis: root cause analysis per finding
- fixes_applied: list of file paths with change summaries
- verification_evidence: post-fix check outputs
- residual_risks: issues that couldn't be auto-fixed
- next_action: "healthy" or specific follow-up command
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>

<guided_interaction>
At every step of the doctor stage, the agent MUST announce:

1. **What I'm doing**: "Diagnosing [finding_id]: [description]..."
2. **Root cause**: "The chain breaks at [file:line] because [reason]. Fix complexity: [trivial/moderate/complex]."
3. **Proposed fix**: "I'll [action] in [file]. Here's the before/after preview:"
4. **Approval request**: "Ready to apply [N] fixes. Please confirm before I modify any files."
5. **Post-fix verification**: "Fix applied. Re-running checks: [pass/fail]. [If fail: Adjusting approach...]"

Always show before/after for each fix. Never apply changes without explicit user approval.
</guided_interaction>
