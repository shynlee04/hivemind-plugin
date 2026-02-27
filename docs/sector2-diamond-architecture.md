# Sector-2 Diamond Architecture

## Purpose
Stabilize Sector-2 as an independent runtime layer with strict ontology boundaries, canonical routing, and skill-governed micro-execution.

## Canonical Boundaries
- `Agent` = Who
  - Owns role, scope, permissions, delegation policy.
  - Must not own domain tutorials or procedural pipelines.
- `Command` = Intent Router (When/Trigger)
  - Parses intent and routes to one workflow path.
  - Must not own deep business logic.
- `Workflow` = Pipeline (Deterministic Procedure)
  - Owns ordered steps, guards, retry/abort semantics.
  - Must not own role/permission policy.
- `Skill` = How-To Lens (Knowledge Delta)
  - Owns atomic domain know-how loaded on demand.
  - Must not own orchestration policy.
- `Prompt` = Context Wrapper
  - Formatting layer only.
- `Reference` = Static Knowledge Source
  - Read-only support material.
- `Tool` = Primitive
  - Deterministic execution unit only.

## Runtime Model
- Root folders are Source of Truth.
- `.opencode/` is deployment mirror output only.
- Default runtime profile is canonical (`core`), legacy compatibility is opt-in only (`legacy-compat`).
- If `.hivemind` lineage is inconsistent, runtime enters doctor mode before normal execution.

## Skill Governance
- Registry SOT: `skills/registry.yaml`.
- Required skill metadata:
  - `name`, `domain`, `bundle`, `knowledge_delta_score`, `status`, `owner`, `disclosure_level`, `triggers`, `supersedes`, `depends_on`.
- Allowed bundles:
  - `governance-core`, `routing-core`, `planning-core`, `research-core`, `verification-core`, `repair-core`, `meta-core`.
- Progressive disclosure levels:
  - `L0`: bootstrap minimal
  - `L1`: command-required
  - `L2`: workflow-step-specific
  - `L3`: escalation-only

## Canonical Chain
- Command -> Workflow -> Step-level skill bundle load.
- Loader policy:
  - local-first skill resolution
  - bundle-constrained load
  - disclosure-level constrained load
  - token-budget aware selection

## Profiles and Cutover
- `core`: canonical minimum runtime surfaces.
- `balanced`: core + templates + references.
- `full`: canonical full surfaces.
- `legacy-compat`: compatibility aliases enabled, never default.

## Contracts
- Command frontmatter v2:
  - `name`, `description`, `owner_agent`, `kind`, `execution_context|alias_resolved_to`, `required_skills`, `required_templates`, `chain_group`, `entry_gate`.
- Workflow schema v2:
  - `name`, `target_agent`, `steps[]`, `guards[]`.
- Agent minimal profile:
  - `identity`, `allowed_tools`, `scope_paths`, `permissions`, `delegation_policy`, `verification_obligations`.
- Delegation packet schema:
  - `intent_id`, `source_command`, `target_agent`, `target_workflow`, `skills_to_load`, `scope`, `constraints`, `success_metrics`, `acceptance_criteria`, `required_evidence`, `failure_policy`.
- Execution knot schema:
  - `knot_id`, `objective`, `in_scope_paths`, `out_of_scope_paths`, `required_skill_bundles`, `disclosure_level`, `token_budget`, `gate_commands`, `required_evidence`, `acceptance_criteria`, `failure_policy`, `max_parallel`.

## Validation Gates
- `bash scripts/validate-framework.sh`
- `npx tsc --noEmit`
- `npm test`
- Strict parity (optional hard gate):
  - `VALIDATE_STRICT_PARITY=1 bash scripts/validate-framework.sh`
