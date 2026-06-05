[LANGUAGE: Write this file in en per Language Governance.]
# W2 — Source-of-Truth Model Specification

> **Phase**: source-of-truth-audit-2026-06-05 / W2 (Spec)
> **Author**: gsd-executor (subagent of hm-l0-orchestrator)
> **Date**: 2026-06-05
> **Status**: DRAFT — locked after W2 commit, refined through W3-W6
> **Parent artifact**: W1-source-map-findings.md (commit `10cecfa4`)
> **Related**: SoT-POLICY.md (W5), sync verification (W4)

---

## 1. Purpose

This document is the formal specification of the Hivemind plugin's three-layer source-of-truth (SoT) model. It locks the model, the authority of each layer, the contracts that bind them, and the verification gates that prove the model holds. The spec is the foundation for the policy in `SoT-POLICY.md` (W5) and the verification work in W4.

The 6-wave source-of-truth audit (2026-06-05) produced W1 findings that exposed two sync violations and an undocumented source layer. W2 is the spec that names the model, the contract, and the gates — turning findings into a contract.

---

## 2. Scope

**In scope:**
- The three source-of-truth layers and their authority
- The sync chain that moves content from source to deployment
- The contracts that each layer must satisfy
- The verification gates that catch drift

**Out of scope:**
- Runtime composition engine behavior (covered in `.planning/codebase/ARCHITECTURE.md`)
- Skill/agent/command content semantics (each primitive has its own contract)
- AGENTS.md content (hand-maintained root guide, not part of sync chain)
- `agent-instructions/` condensed profiles (separate artifact, not synced)

---

## 3. The Three-Layer Model

### 3.1 Layer 1 — Lab (`assets/...`)

**Not the source of truth for the harness.** The lab is a working environment for authoring primitives. It is the canonical source for gsd-* (the GSD skill development framework), but for hm-*/hf-*/gate-*/stack-*/hivemind-* (the Hivemind lineage), the lab is upstream of the source layer and not directly deployed.

- **Authority**: Working draft area for GSD-sourced primitives
- **Owner**: `hf-meta-builder` lineage (subject of development)
- **Read by**: `transform-gsd-to-hm.js` (in-place gsd→hm rename) and any human author
- **Deployed by**: Hand-mirror or transform script, NOT `sync-assets.js`
- **Mutated by**: `hf-agent-builder`, `hf-skill-builder`, `hf-command-builder` (specialist authors)
- **Contract**: Must be git-tracked; must include `hf-naming-syndicate` compliant names

### 3.2 Layer 2 — Source (`assets/...`)

**The source of truth for shipped hm-*/hf-*/gate-*/stack-*/hivemind-* primitives.** This is the canonical author location. Every change to a shipped primitive must originate here.

- **Authority**: Canonical source for shipped primitives
- **Owner**: `hm-*` lineage (product developers) and `hf-*` lineage (meta-builders) — strictly separated by lineage prefix
- **Read by**: `sync-assets.js` (sync engine)
- **Deployed by**: `sync-assets.js` destination → Layer 3
- **Mutated by**: `hm-*` and `hf-*` lineage authors; mutation must respect AQUAL-01..08 quality contract
- **Contract**:
  - Every shipped primitive MUST exist here (single source)
  - Every mutation MUST be a git commit (atomic, append-only by default)
  - Primitive names MUST follow `hf-naming-syndicate`
  - The `transform-gsd-to-hm.js` script may rewrite in place during the lab→source transition
  - Hand-maintained files (e.g., `AGENTS.md`, `scripts/sync-assets.js`) are NOT in the PRIMITIVE_MAP and not part of this contract

### 3.3 Layer 3 — Deployed (`.opencode/...`)

**The deployment surface.** This layer is the working copy OpenCode reads at runtime. It is fully derived from Layer 2; any mutation here is a sync violation unless explicitly authorized (e.g., emergency hotfix during partial sync).

- **Authority**: None. Deployed layer is a function of source layer.
- **Owner**: `sync-assets.js` (read-side only)
- **Read by**: OpenCode runtime (skill loader, agent registry, command engine)
- **Mutated by**: `sync-assets.js` exclusively; human edits are violations
- **Contract**:
  - Content MUST equal what `sync-assets.js` would produce from Layer 2
  - Drift from Layer 2 indicates a broken sync chain (W4 verification)
  - The `.backup/` directory preserves prior deployed versions on incremental sync (not a substitute for source authority)
  - A full rebuild (`rm -rf .opencode && node scripts/sync-assets.js`) MUST be reproducible from Layer 2 alone

---

## 4. Sync Chain Contract

### 4.1 Engine: `scripts/sync-assets.js`

The sync engine is the only sanctioned mechanism for moving content from Layer 2 to Layer 3.

| Property | Value |
|----------|-------|
| Source | `assets/{skills,agents,commands,workflows,references,templates,rules}/` |
| Destination | `.opencode/{skills,agents,commands,workflows,references,templates,rules}/` |
| Mode | Incremental (default) — preserves `.backup/` of modified files |
| Trigger | Manual `node scripts/sync-assets.js` or build hook |
| Idempotency | MUST be safe to re-run; MUST NOT lose data on repeated runs |
| Atomicity | File-level (each primitive synced as a unit); NOT cross-file transactional |

### 4.2 PRIMITIVE_MAP (current state)

The sync engine uses a `PRIMITIVE_MAP` to know what to sync. As of 2026-06-05, the map covers:
- `agents/`
- `commands/`
- `workflows/`
- `skills/`
- `references/`
- `templates/`
- `rules/`

**Not in the map** (intentionally or by oversight — see §6):
- Root `AGENTS.md` (hand-maintained, intentionally not synced)
- `agent-instructions/` (different artifact, not synced)
- Lab files under `.hivefiver-meta-builder/` (separate sync mechanism)

### 4.3 The `.backup/` Convention

When `sync-assets.js` runs in incremental mode, modified files are copied to `.backup/` before overwrite. The backup:
- Preserves the prior deployed version
- Is itself part of Layer 3
- Is NOT a source of truth
- Should be periodically pruned (not in scope for this audit)

---

## 5. Hand-Maintained vs. Synced Boundary

The audit identifies three classes of files that exist outside the sync chain:

| Class | Example | Sync status | Owner |
|-------|---------|-------------|-------|
| Root governance | `AGENTS.md` (651L) | Not synced | Hand-maintained by L0 orchestrator |
| Condensed profile | `agent-instructions/` (46L) | Not synced | Hand-curated reference |
| Build/runtime scripts | `scripts/sync-assets.js`, `scripts/transform-gsd-to-hm.js` | Not synced | Hand-maintained code |

These files are NOT source-of-truth violations. They are explicitly outside the sync chain. Their content is authored by hand and does not flow through `sync-assets.js`.

**Implication**: When the L0 orchestrator wants to update `AGENTS.md`, it edits the file directly. It does NOT expect the change to flow through sync. Conversely, when the L0 orchestrator updates a skill in `assets/skills/`, it expects `.opencode/skills/` to be updated by running `sync-assets.js`.

---

## 6. Sync Violations (Known)

The W1 audit identified two sync violations. Both are addressed in W3 (IMPL):

### 6.1 Violation A — TDD Section in Deployed Layer Missing from Source

- **Symptom**: `.opencode/rules/universal-rules.md` (deployed) contains §6/§7/§8 TDD section (102L); `assets/rules/universal-rules.md` (source) does NOT (102L)
- **Root cause**: Prior W4 commit (`8cc7006b`) updated Layer 3 directly, bypassing Layer 2
- **W3 fix**: Add the TDD section to `assets/rules/universal-rules.md` at the matching line offset
- **W4 verification**: Run `sync-assets.js`; confirm deployed layer still contains the section (no regression); source layer now contains it (sync chain unbroken)

### 6.2 Violation B — Root `AGENTS.md` Not in PRIMITIVE_MAP

- **Symptom**: Root `AGENTS.md` is hand-maintained (651L); the sync engine's PRIMITIVE_MAP does NOT include it
- **Root cause**: Intentional design (see §5) — but the design is undocumented
- **W3 fix**: Document the hand-maintained status in `SoT-POLICY.md` (W5); leave the file itself untouched
- **W4 verification**: Confirm `sync-assets.js` does NOT touch `AGENTS.md` after a full rebuild

---

## 7. Verification Gates

The audit establishes three gates that verify the source-of-truth model holds:

### 7.1 Gate 1 — Identity Gate

**Question**: Does the source layer exist for every shipped primitive?

**Method**: Glob `assets/{skills,agents,commands,workflows,references,templates,rules}/**/*` and `.opencode/{...}/**/*`. For each `.opencode` file, confirm a corresponding source file exists (or the file is in the hand-maintained exclusion list).

**Pass criteria**: Zero orphans. Every deployed file has a source counterpart OR is in the documented exclusion list.

### 7.2 Gate 2 — Sync Chain Gate

**Question**: Does the sync engine correctly propagate source changes to deployment?

**Method**:
1. Mutate a single file in `assets/` (e.g., add a comment line)
2. Run `node scripts/sync-assets.js`
3. Confirm the corresponding `.opencode/` file reflects the change
4. Confirm no other files were modified (atomicity)

**Pass criteria**: One source mutation → exactly one deployed mutation. No collateral changes.

### 7.3 Gate 3 — Authority Gate

**Question**: Is the source layer truly the authority, or are there hidden sources of truth?

**Method**: Search for any non-source layer that contains shipped primitive content. Examples to check:
- `.opencode/` files modified outside the sync window (git log check)
- `agent-instructions/` overlap with `assets/skills/`
- `assets/.../AGENTS.md` files (nested) that might shadow the root one

**Pass criteria**: No hidden sources. Every shipped primitive has exactly one canonical location.

### 7.4 Gate Execution (W4)

The three gates are executed in W4 (VERIFY) and the results documented in `W4-sync-verification.md`. Each gate produces a PASS/FAIL verdict with file:line evidence.

---

## 8. Authority Hierarchy (Locked)

| Layer | Authority | Mutated by | Verified by |
|-------|-----------|-----------|-------------|
| Lab (`.hivefiver-meta-builder/...`) | Working draft (gsd-* only) | `hf-*` authors | Lab→source transform check |
| Source (`assets/...`) | **Canonical** | `hm-*`/`hf-*` authors, atomic commits | Gate 1, Gate 2 |
| Deployed (`.opencode/...`) | None (derived) | `sync-assets.js` only | Gate 2, Gate 3 |

The source layer is the single source of truth for shipped primitives. The deployed layer is fully derived. The lab layer is a working area, not a source of truth for the harness.

---

## 9. Open Questions (deferred to W3-W6)

1. **Should `transform-gsd-to-hm.js` become part of the sync chain?** Currently it runs separately. If the audit decides to fold it in, the sync engine needs to know how to invoke it.
2. **What is the canonical way to revert a sync violation?** If someone mutates Layer 3 directly, the audit needs a documented remediation flow.
3. **Should the `.backup/` convention be standardized across all primitive types?** Currently it works for `rules/` but may not be uniformly applied to `skills/`, `agents/`, etc.
4. **How are breaking changes in the source layer communicated to deployed-layer consumers?** Skill/agent/command changes can break runtime behavior even if the sync chain is correct.

These are deferred to W3-W6 or to a follow-up audit phase. The W2 spec locks the model; the policy (W5) and the verification (W4) handle the immediate questions.

---

## 10. Acceptance Criteria

This spec is considered locked when:
- [x] Three layers named and scoped
- [x] Authority of each layer stated
- [x] Sync chain contract defined
- [x] Hand-maintained vs synced boundary clarified
- [x] Two known sync violations identified
- [x] Three verification gates defined
- [x] Authority hierarchy table locked
- [ ] Verified against W3 implementation (W4 gate triad)
- [ ] Incorporated into SoT-POLICY.md (W5)

W2 commits the spec. W3-W6 verify the spec against actual code state. W5 distills the spec into policy.

---

## 11. Cross-References

- **W1**: source-map findings (`10cecfa4`) — discovery basis for this spec
- **W3**: implementation — applies W4 TDD section fix to source layer
- **W4**: verification — runs Gate 1, 2, 3 against actual filesystem state
- **W5**: policy — distills this spec into `SoT-POLICY.md` ADR
- **W6**: gate triad — final lifecycle → spec → evidence verification
- **`AGENTS.md` §CONSTITUTION**: Source vs Deploy constitution (Layer 2 vs Layer 3 only — does not address Lab layer)
- **`scripts/sync-assets.js`**: sync engine source (Layer 2 → Layer 3)
- **`.hivefiver-meta-builder/`**: lab layer (Layer 1) — not in scope of this spec
