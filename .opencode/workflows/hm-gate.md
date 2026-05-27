<purpose>
Orchestrate the L3 quality gate triad (lifecycle, spec compliance, evidence truth) sequentially to authorize phase completion and block merge/compaction on failure.
</purpose>

<required_reading>
@.opencode/references/hm-gate-triad.md
@.opencode/references/hm-dual-signal-completion.md
</required_reading>

<downstream_awareness>
Clearing the gate triad is the terminal gate requirement:
1. **Compaction / Archiving**: Blocked until all gates report green PASS status.
2. **Main branch merge**: The CI/CD gates verify this gate clearance record.
</downstream_awareness>

<scope_guardrail>
**CRITICAL: Sequential enforcement.** Run gates in strict order: lifecycle -> spec compliance -> evidence truth. If any gate fails, execution must HALT immediately; do not run subsequent gates.
</scope_guardrail>

<process>

<step name="initialize" priority="first">
Load phase details. Check for existence of `PLAN.md`, `SUMMARY.md`, and `VERIFICATION.md`.
</step>

<step name="gate_1_lifecycle">
Evaluate the **Lifecycle Integration Gate**:
- Verify compliance with the 9-surface mutation authority.
- Check CQRS boundary constraints and actor hierarchy.
- Ensure all custom tools, hooks, and commands are correctly registered.
If this gate fails: HALT and output a detailed lifecycle gap report.
</step>

<step name="gate_2_spec_compliance">
Evaluate the **Spec Compliance Gate**:
- Conduct bidirectional traceability sweeps (spec-to-code, spec-to-test).
- Validate all acceptance criteria match EARS structures.
- Scan for the seven lethal anti-patterns (e.g. coverage theater, orphan drift).
If this gate fails: HALT and output a spec gap report.
</step>

<step name="gate_3_evidence_truth">
Evaluate the **Evidence Truth Gate**:
- Scan `VERIFICATION.md` for must-haves and truths.
- Ensure evidence levels meet requirements (L1 live runtime output for core features).
- Run the mock curtain scanner to detect fake/mocked integration results.
If this gate fails: HALT and output an evidence gap report.
</step>

<step name="remediation_routing">
If any gate failed, route to the appropriate remediation path:
- Lifecycle failure -> route to codebase refactoring / lifecycle fixes.
- Spec failure -> route to `hm-plan` or requirements analysis.
- Evidence failure -> route to TDD execution / test updates.
Terminate execution with non-zero exit code.
</step>

<step name="clear_gates">
If all three gates pass:
- Log gate clearance status with timestamp and signatures.
- Write the final gate status to `.planning/STATE.md` and `.hivemind/state/lineage/`.
</step>

<step name="git_commit">
Commit the updated state and gate clearance logs atomically to git.
</step>

</process>

<success_criteria>
- Gates run in exact sequence (lifecycle -> spec -> evidence).
- Hard halt applied on any failure.
- Traceability matrices and mock checks verified.
- Gate clearance status written and committed.
</success_criteria>
