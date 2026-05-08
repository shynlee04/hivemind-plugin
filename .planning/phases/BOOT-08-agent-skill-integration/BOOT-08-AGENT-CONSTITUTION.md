# BOOT-08: Agent Integration Constitution

**Type:** L5 Governance Evidence
**Date:** 2026-05-08
**Authority:** Phase 0 Governance Gate (P0-01 through P0-06, all PASSED)

---

## 1. Lineage Classification

| Prefix | Domain | Ship Eligibility | Notes |
|--------|--------|-------------------|-------|
| `hm-*` | Hivemind product-development agents | Shipped primitives | Strict lineage. Product dev, requirements, planning, execution, validation, debugging, research. |
| `hf-*` | HiveFiver meta-authoring agents | Shipped primitives | Flexible lineage. Authoring, repairing, configuring, auditing Hivemind meta-concepts. |
| `gate-*` | Quality gate agents | Internal only (unless productized) | Evidence-honesty gates. Blocks readiness claims when evidence insufficient. |
| `stack-*` | Reference agents | Reference-only | Framework/package knowledge support. Does not own Hivemind behavior. |
| `gsd-*` | GSD workflow agents | **NEVER shipped** | Internal dev tooling only. Excluded from all migration and shipped primitive counts. |

### Rules

- Every agent MUST have a lineage prefix matching one of the above.
- `gsd-*` agents exist in `.opencode/agents/` for developer workflow but are excluded from Hivemind product primitives.
- MCM doctor MUST classify each agent as shipped, dev-only, or internal before migration.
- No agent may claim multiple lineages. When an agent serves multiple domains, the primary domain determines the prefix.

---

## 2. Permission Model

### Tool Access

Agents declare tool permissions in their frontmatter (`tools:` field). The permission model follows CQRS:

- **Write-side tools** (delegate-task, session-patch, etc.): Require explicit allow-listing. Only L0/L1 agents may use write-side tools by default.
- **Read-side hooks** (system transform, messages transform, etc.): Available to all agents unless explicitly denied.

### Delegation Authority

| Agent Level | May Delegate To | Max Depth |
|-------------|-----------------|-----------|
| L0 (Orchestrator) | L1, L2, L3 | Unlimited within hierarchy |
| L1 (Coordinator) | L2, L3 | 2 levels |
| L2 (Specialist) | L3 (subagent) | 1 level |
| L3 (Leaf) | None | 0 |

### CQRS Boundaries

- Agents in `.opencode/agents/` are **definitions only** — they declare capabilities, not state.
- Runtime state lives in `.hivemind/` (per Q6). Agents may read `.hivemind/` state via tools but may NOT write directly to `.opencode/` definitions at runtime.
- The plugin composition root (`plugin.ts`) is the sole authority for tool/hook registration.

---

## 3. Hierarchy Contracts

### L0 — Orchestrator

- Top-level coordinator for multi-agent workflows.
- Delegates to L1 coordinators or directly to L2 specialists.
- Manages wave-based parallelization, checkpoint gates, and handoff protocols.
- Never implements directly — routes work only.

### L1 — Coordinator

- Domain-specific coordinator (e.g., hm-l1-coordinator, hf-l1-coordinator).
- Dispatches L2 specialists in parallel waves.
- Collects structured results and runs inline quality validation.
- May delegate to L3 subagents for trivial tasks.

### L2 — Specialist

- Domain expert (researcher, builder, critic, auditor, etc.).
- Performs actual work: code, analysis, documentation, validation.
- May delegate to L3 subagents for isolated subtasks.
- Reports structured results back to L1 coordinator.

### L3 — Leaf

- Single-purpose subagent for trivial tasks.
- Cannot delegate further.
- Returns results to parent L2 agent.

---

## 4. Discovery and Validation

### Agent Discovery Pipeline

1. `.opencode/agents/` is scanned by OpenCode runtime at startup.
2. Each `.md` file with YAML frontmatter is registered as an agent.
3. Frontmatter must include: `name`, `description`, `tools`, `temperature`.
4. Agent files without valid frontmatter are silently ignored.

### Validation Requirements

- MCM doctor MUST verify: agent exists in `.opencode/agents/`, has valid frontmatter, lineage prefix is correct, tools permissions are declared.
- Doctor MUST report: total agent count, shipped vs dev-only breakdown, broken references.
- Config plane MUST verify: shipped agents are present and valid before runtime use.

---

## References

- Phase 0: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`
- Phase 0: `.planning/architecture/hivefiver-meta-authoring-architecture-2026-05-07.md`
- Q6 State Root: `.hivemind/` canonical, `.opencode/` primitives-only
