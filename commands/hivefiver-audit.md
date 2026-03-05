---
name: hivefiver-audit
description: "Run system-wide health check across all framework assets and produce a prioritized findings report."
agent: hivefiver
subtask: true
---

<enforcement>
Gate check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/gate-check.sh audit .`

Pipeline state (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh read .`

Pipeline orchestrator (auto-executed — what comes after audit):
!`bash .opencode/skills/hivefiver-coordination/scripts/pipeline-orchestrator.sh status .`

Quality check (auto-executed):
!`bash .opencode/skills/hivefiver-coordination/scripts/quality-check.sh audit .`

QA scoping (auto-executed — audit-specific diagnostic questions):
!`bash .opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh audit_health L1 medium`

Runtime enforcement pre-turn (auto-executed — MANDATORY quality/state baseline):
!`bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh pre-turn .`

Unified MUST pack (auto-executed — intent/profile/journey obligations):
!`bash .opencode/skills/hivefiver-coordination/scripts/hivefiver-must-pack.sh audit "$ARGUMENTS" .`

Note: audit always passes gate check — it bypasses the pipeline.
</enforcement>

## Non-Interactive Shell Awareness (Canonical)

- Shell is non-interactive (no TTY/PTY). Never run commands that wait for prompts or UI input.
- Always use non-interactive flags and explicit messages (`-y`, `--yes`, `--non-interactive`, `--no-edit`, `-f`).
- If a tool can still block, provide deterministic input (`yes |`, heredoc) or fail fast with a timeout.

<objective>
Scan all framework assets under `.opencode/` for contract violations, dead references, anti-pattern violations, and drift — producing a severity-ranked findings report.
</objective>

<context>
User input: $ARGUMENTS

Current state:
@.hivemind/hive-modules/hivefiver-v2/STATE.md
</context>

<process>
Step 1: Read QA scoping from enforcement block.
- If user specified a scope (partial audit), use it
- If no scope specified, run full audit
- Use QA scoping questions to confirm: "I'll audit [scope]. Want me to check everything or focus on specific areas?"

Step 2: Inventory all assets:
- List all files under `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/`, `.opencode/workflows/`
- Record file count per category

Step 3: Contract validation — for each asset:
- Agents: has `description` with what + when-to-use? Permissions deny-by-default?
- Commands: has required frontmatter (name, description, agent)? Body has `<objective>` and `<output_contract>`?
- Skills: has SKILL.md with "Use when..." description? references/ directory present?
- Workflows: has entry/exit criteria?

Step 4: Cross-reference integrity:
- Every `required_skills` reference resolves to an existing skill directory
- Every `agent` field references an existing agent profile
- Every `next_command` references an existing command file
- No symlinks (verify with `find .opencode -type l`)

Step 5: Anti-pattern scan (G-01 through G-10):
- G-01: Wildcard delegation in any agent profile
- G-02: Unrestricted bash permissions
- G-03: Shallow alias commands without deterministic behavior
- G-08: Contract-free commands (no output_contract)
- G-09: Parity drift between `.opencode/` mirrors

Step 6: Produce findings report ranked by severity:
- Critical: broken references, contract violations
- High: anti-pattern violations
- Medium: missing optional fields
- Low: style inconsistencies

Step 7: Escalation decision:
- If CRITICAL findings → recommend `/hivefiver-doctor` and update state
- If audit is part of `improve` pipeline → recommend `/hivefiver-intake` for remediation planning

Step 8: Update STATE.md:
```bash
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh add-completed audit .
bash .opencode/skills/hivefiver-coordination/scripts/state-update.sh set-checkpoint .
```
- If improve pipeline: set `current_stage` to `intake`
- If standalone audit: set `pipeline_active` to `false`

Step 9: Run runtime enforcement post-turn (MANDATORY):
```bash
bash .opencode/skills/hivefiver-coordination/scripts/runtime-gate.sh post-turn .
```
Include the output as evidence in your completion claim.
</process>

<quality_gate>
Audit is read-only — no files are modified during this stage.
- [ ] Every asset file was read and checked
- [ ] All findings have file path + line number evidence
- [ ] Severity ranking applied consistently
- [ ] Report includes actionable remediation suggestions
</quality_gate>

<output_contract>
Return:
- inventory: asset counts by category
- findings: severity-ranked list with file paths and evidence
- cross_reference_report: pass/fail per reference
- anti_pattern_report: G-01 through G-10 scan results
- recommended_action: /hivefiver-doctor (if critical findings) or "healthy"
- must_pack: unified MUST obligations payload from hivefiver-must-pack.sh
- runtime_gate_post_turn: evidence output from runtime-gate.sh post-turn
</output_contract>

<guided_interaction>
At every step of the audit stage, the agent MUST announce:

1. **What I'm doing**: "Scanning [asset_category] — [N] files to check..."
2. **Progress**: "✅ Agents scanned | ⏳ Commands scanning | ⬚ Skills, Workflows pending"
3. **Live findings**: "Found [severity] issue in [file]: [description]. Running total: [N] findings."
4. **Summary preview**: "Audit complete. [N] critical, [M] high, [P] medium, [Q] low findings."
5. **What comes next**: "[If critical findings: Recommend /hivefiver-doctor to fix. | If clean: Framework is healthy.]"

Present findings as a structured table with severity icons. Never dump raw grep output.
</guided_interaction>
