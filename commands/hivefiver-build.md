---
name: hivefiver-build
description: "Create or modify framework assets following the architecture plan with contract compliance."
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh build .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — pipeline completion status):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

Quality check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh build .`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

⛔ IF the gate check above shows "allowed": false — STOP. Report the reason to the user. DO NOT proceed.
</enforcement>

<objective>
Execute the architecture plan by creating or modifying framework assets in dependency order, validating each against its contract before proceeding to the next.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read STATE.md to locate the approved architecture from the architect stage.
Step 2: Retrieve the build order (dependency-sorted asset list).
Step 3: For each asset in build order:

  a. **Read before write** — if the file exists, read it first (OpenCode enforces this).
  b. **Compose content** — following asset standards:
     - Agents: description (what + when-to-use), permissions (deny-by-default), delegation list
     - Commands: frontmatter (name, description, agent), body with `<objective>`, `<process>`, `<output_contract>`
     - Skills: SKILL.md with description ("Use when..."), references/ for domain knowledge
     - Workflows: entry/exit criteria, dependency ordering, verification loop
  c. **Validate contract** — check against asset-contracts.md schema
  d. **Write file** — create or update the asset
  e. **Verify** — re-read the file to confirm write succeeded

Step 4: After all assets written, run cross-reference check:
- Every `required_skills` reference points to an existing skill
- Every `agent` reference points to an existing agent profile
- Every `next_command` reference points to an existing command
- No orphan references remain

Step 5: Collect evidence — list of files created/modified with before/after diff summaries.
Step 6: Update STATE.md Pipeline State:
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed build .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-stage none .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-active false .
  bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
  ```

Step 7: Run runtime enforcement post-turn + export (MANDATORY):
  ```bash
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
  bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh export .
  ```
  Include BOTH outputs as evidence. The export artifact is the proof of production-ready completion.
</process>

<quality_gate>
Gate 3 (Evidence Integrity):
- [ ] Every created asset passes its contract schema validation
- [ ] Cross-reference check shows zero dangling references
- [ ] Each file write verified by re-read
- [ ] Evidence collected for all modifications (file list + diffs)
- [ ] No blocked anti-patterns introduced (G-01 through G-10)
</quality_gate>

<output_contract>
Return:
- assets_created: list of file paths created or modified
- cross_reference_check: pass/fail with details
- evidence: file diffs and verification outputs
- gate_3_passed: boolean
- next_action: pipeline complete or follow-up needed
</output_contract>

<guided_interaction>
At every step of the build stage, the agent MUST announce:

1. **What I'm doing**: "Building asset [N] of [total]: [asset_id] at [file_path]..."
2. **Progress**: "✅ [completed] built | ⏳ [current] building | ⬚ [remaining] pending"
3. **Contract check**: "Asset [name] passes contract validation: [yes/no]. [If no: fixing X before proceeding]"
4. **Cross-reference status**: "All references resolve: [yes/no]. [If no: [broken_ref] → [fix action]]"
5. **What comes next**: "Build complete. Running final quality gate. Pipeline will close after verification."

Show real-time progress. Never silently create files without announcing what and why.
</guided_interaction>
