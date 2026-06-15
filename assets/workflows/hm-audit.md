<purpose>
Audit workspace structures, config schemas, session tracker continuity, and lineage trees to detect drift and automatically repair recoverable warnings.
</purpose>

<required_reading>
@.opencode/references/hm-coordination-contracts.md
@.opencode/references/hm-gate-triad.md
</required_reading>

<downstream_awareness>
The audit outputs and repairs feed directly into the doctor command:
1. **doctor tool**: Uses the resolved state and directories to verify that health checks pass.
2. **session-tracker**: Integrates clean records and closes orphaned journals.
</downstream_awareness>

<scope_guardrail>
**CRITICAL: Read-only by default.** The audit must perform checks without modifying files. Writing/patching is strictly restricted to automatically recoverable targets (like missing `.gitkeep` files) ONLY when `--fix` is explicitly provided.
</scope_guardrail>

<process>

<step name="initialize" priority="first">
Parse arguments ($ARGUMENTS):
- `--strict` (treat warnings as errors, causing non-zero exit codes).
- `--fix` (enable automatic repairs of minor warnings).
</step>

<step name="structure_audit">
Scan target workspace paths:
- Verify all Tier-1 directories (`state`, `delegation`, etc.) exist under `.hivemind/`.
- Check that every directory has a `.gitkeep` file.
If `--fix` is enabled: Write any missing `.gitkeep` files.
</step>

<step name="config_audit">
Validate `configs.json` against the compiled schema `configs.schema.json`.
Confirm that the package version in `package.json` matches the recorded version in `.hivemind/state/version.json`.
</step>

<step name="session_lineage_audit">
Scan `.hivemind/session-tracker/`:
- Detect active or pending sessions.
- Verify lineage hierarchy references (all child sessions link back to a valid parent).
- Identify orphaned session logs or incomplete journal entries.
If `--fix` is enabled: Archive or close orphaned active sessions.
</step>

<step name="health_check_execution">
Run diagnostic scripts:
- Compile TypeScript to verify no type check errors.
- Run unit test suite to verify code correctness.
</step>

<step name="generate_report">
Compile all warnings, validation failures, and repaired items into a structured report. Output the verdict (PASS / FAIL / WARNINGS).
</step>

</process>

<success_criteria>
- Structure and gitkeep files audited.
- Configuration and schema validated.
- Session tracker and lineage continuity checked.
- All errors resolved or repaired via `--fix`.
</success_criteria>
