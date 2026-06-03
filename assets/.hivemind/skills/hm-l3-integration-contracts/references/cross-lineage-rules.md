# Cross-Lineage Bridging Rules

Enforces **D-AD-01** (hm↔hf skill loading boundaries) and **D-02** (gate-* internal-only). These rules govern which lineages may load which skills and under what conditions.

## Rule Summary

| Rule | Direction | Access | Justification Required | Decision Ref |
|------|-----------|--------|----------------------|-------------|
| hm→hm | Within hm-* | ALWAYS | No | D-AD-01 STRICT |
| hm→hf | hm agent loading hf skill | NEVER | N/A (violation) | D-AD-01 STRICT |
| hf→hf | Within hf-* | ALWAYS | No | D-AD-01 default |
| hf→hm | hf agent loading hm skill | CONDITIONAL | Yes (must justify) | D-AD-01 FLEXIBLE |
| hf→gate | hf agent loading gate skill | CONDITIONAL | Yes (hf-auditor only) | D-02 |
| hm→gate | hm agent loading gate skill | CONDITIONAL | Domain-dependent | D-02 |
| any→stack | Any lineage loading stack skill | ALWAYS | No | stack read-only |
| any→unprefixed | Any lineage loading unprefixed | CONDITIONAL | Per-skill | unprefixed |

## D-AD-01 STRICT: hm agents MUST NOT load hf skills

**Rationale:** The hm-* (product dev) lineage is self-contained. It covers planning, research, execution, quality, debug, and routing. There is no legitimate case for a product-dev agent to load a meta-builder (hf-*) skill.

**Violation example:**
```
❌ hm-l2-planner loads hf-agent-composition
   → hm planners do not build agents. Remove the hf skill from the planner's load list.
```

**Exception:** None. This rule has zero exceptions.

## D-AD-01 FLEXIBLE: hf agents MAY load hm skills when justified

**Rationale:** Meta-builder agents sometimes need codebase investigation, quality verification, or synthesis of product-dev findings. Loading hm-* skills is permitted when the task requires it, but must be documented.

**Valid justifications:**
1. **Codebase investigation:** hf-auditor loading hm-l3-detective to scan source code
2. **Quality verification:** hf-auditor loading gate-evidence-truth to validate implementations
3. **Synthesis:** hf-synthesizer loading hm-l3-synthesis for artifact compression of product-dev findings
4. **Refactoring:** hf-refactorer loading hm-l2-refactor for code restructuring methodology
5. **Platform knowledge:** hf-agent-builder loading hm-l3-opencode-platform-reference for OpenCode SDK awareness

**Justification format in SKILL.md:**
```yaml
metadata:
  consumed-by:
    - "hm-l2-researcher"
    - "hf-auditor"
  cross-lineage-justification: "hf-auditor loads for codebase investigation during skill/agent quality audits"
```

## D-02: gate-* skills are THIS PROJECT ONLY

**Rationale:** The internal gate triad (evidence-truth, spec-compliance, lifecycle-integration) is project-internal quality infrastructure. These skills are NOT shipped to end users and MUST NOT appear in shipped agent loading lists.

**Permitted consumers:**
- hm-l2-auditor (all 3 gate skills)
- hm-l2-reviewer (gate-evidence-truth only)
- hm-l2-validator (gate-evidence-truth only)
- hm-l2-critic (gate-evidence-truth only)
- hm-l2-assessor (gate-evidence-truth only)
- hf-auditor (gate-evidence-truth only, with justification)

**Prohibited:** Any other agent type. gate-* skills are never loaded by executors, planners, researchers, builders, orchestrators, or any shipped agent.

## stack-* Skills: Read-Only, Always Available

Stack reference skills document third-party framework APIs (bun-pty, json-render, nextjs, opencode, vitest, zod). They contain no project logic, no project decisions, and no project state. They are read-only reference packs available to any lineage without justification.

## Cross-Lineage Justification Template

When adding a cross-lineage consumer to a skill's `consumed-by` list, append the justification to the skill's metadata:

```yaml
metadata:
  consumed-by:
    - "hm-l2-researcher"        # primary, same-lineage
    - "hf-agent-builder"     # cross-lineage, see justification below
  cross-lineage-justification: >
    hf-agent-builder loads this skill to reference OpenCode SDK signatures
    when constructing agent definitions that interact with the platform. The
    agent builder needs canonical platform knowledge to set correct permissions.
```

## Enforcement

Run `scripts/validate-contracts.sh` to detect cross-lineage violations:
```bash
./scripts/validate-contracts.sh --check-cross-lineage
```

Expected output for a clean scan:
```
✅ hm→hm: 0 violations (all hm agents use only hm skills)
✅ hm→hf: 0 violations (no hm agent loads hf skills — D-AD-01 STRICT)
✅ hf→hf: 0 violations (all hf agents use only hf skills)
⚠️  hf→hm: 3 justified cross-lineage loads (hf-auditor→hm-detective, hf-synthesizer→hm-synthesis, hf-refactorer→hm-refactor)
✅ gate-*: 0 leaks (no shipped agent loads gate skills)
✅ stack-*: 6 skills available to both lineages
```
