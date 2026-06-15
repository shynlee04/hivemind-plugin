<purpose>
Initialize a new Hivemind-powered project workspace, establishing the target directories, files, and initial configuration schemas to bootstrap the execution lifecycle.
</purpose>

<required_reading>
@.opencode/references/hm-coordination-contracts.md
</required_reading>

<downstream_awareness>
The output directory structure and configurations feed directly into the harness validation tools:
1. **doctor command**: Evaluates whether all expected directories and gitkeep files exist.
2. **all downstream workflows**: Rely on these target paths (`.opencode/`, `.hivemind/`, `.planning/`) for caching, session persistence, and lineage tracking.
</downstream_awareness>

<scope_guardrail>
**CRITICAL: Structure-only setup.** This workflow initializes the workspace layout and minimal configurations. It does NOT generate business logic or source code files. Any attempts to write code beyond default templates/configs must be deferred.
</scope_guardrail>

<process>

<step name="validate_parameters" priority="first">
Parse process arguments ($ARGUMENTS):
- Target project path (positional).
- `--scope` (project or global config path, default: project).
- `--force` (overwrite existing configs if present).
</step>

<step name="create_directories">
Establish the directory structure recursively:
- `.opencode/agent/`
- `.opencode/skill/`
- `.opencode/command/`
- `.opencode/workflows/`
- `.opencode/references/`
- `.opencode/templates/`
- `.hivemind/state/`
- `.hivemind/logs/`
- `.planning/phases/`
</step>

<step name="gitkeep_persistence">
Write empty `.gitkeep` files inside every newly created folder to ensure directory tracking is registered in git.
</step>

<step name="generate_configurations">
Write the base configurations:
1. **configs.json** under `.hivemind/` matching default schema constraints.
2. **configs.schema.json** generated from the active Zod schema engine.
3. Write initial `version.json` in `.hivemind/state/` documenting package details.
</step>

<step name="run_doctor_audit">
Invoke the `doctor` diagnostic suite to check the initialized directory structure and config schema integrity.
</step>

</process>

<success_criteria>
- All target folders successfully created.
- `.gitkeep` files exist in every subfolder.
- `configs.json` and `configs.schema.json` compiled and validated.
- Doctor check passes with green exit code.
</success_criteria>
