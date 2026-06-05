[LANGUAGE: Write this file in en per Language Governance.]
# Source-of-Truth Policy

**Document ID:** SoT-POLICY
**Authority:** Locked ADR derived from W2 (`7a47b31c`) and verified by W4 (`e42a429f`)
**Created:** 2026-06-05
**Status:** Locked (post-W6 gate-triad verification)

---

## 1. Context

The Hivemind harness maintains a 3-layer primitive architecture (Lab, Source, Deployed) governed by the constitution declared in `AGENTS.md` §CONSTITUTION: Source vs Deploy (L3) and the project overview table at `AGENTS.md` L211 (Two Halves). The 2026-06-05 source-of-truth audit (`source-of-truth-audit-2026-06-05`) discovered two sync violations in which prior wave work edited the Deployed layer (`.opencode/...`) directly instead of the Source layer (`assets/...`). These edits were wiped on subsequent `node scripts/sync-assets.js` runs, producing a 88-line drift asymmetry between the two layers for `rules/universal-rules.md`.

This policy locks the model, the sync chain, and the hand-maintained boundary so future wave work cannot recreate the violation.

---

## 2. Decision

The Source layer (`assets/...`) is the **single source of truth** for every primitive that ships in the npm package. The Deployed layer (`.opencode/...`) is **fully derived** from Source and contains no authoritative content. The Lab layer (`.hivefiver-meta-builder/{skills-lab,agents-lab,commands-lab,workflows-lab,references-lab}/`) is a working area for `gsd-*` primitive iteration and is not a source of truth for the harness.

| Layer | Path | Authority | Mutated by |
|-------|------|-----------|------------|
| Lab (working area) | `.hivefiver-meta-builder/{skills-lab,agents-lab,commands-lab,workflows-lab,references-lab}/` | Working draft only (not shipped) | `hf-*` authors, meta-builder playbooks |
| **Source (canonical)** | `assets/{agents,skills,commands,workflows,references,templates,rules}/` | **Single source of truth for shipped primitives** | `hm-*` / `hf-*` authors, atomic commits |
| Deployed (derived) | `.opencode/{agents,skills,commands,workflows,references,templates,rules}/` | None (derived) | `node scripts/sync-assets.js` only |

**Invariants:**
- `assets/` is the git-tracked source of truth for sync-managed primitives.
- `.opencode/` MUST be regeneratable from `assets/` via `rm -rf .opencode && node scripts/sync-assets.js`.
- Lab → Source promotion is a SEPARATE process from Source → Deployed deployment.
- Direct edits to `.opencode/...` are a **sync violation** unless part of a documented recovery workflow.

---

## 3. Sync Chain

The **only** sanctioned path from Source to Deployed is:

```bash
node scripts/sync-assets.js
```

`sync-assets.js` (verified 512L, located at `scripts/sync-assets.js`) implements the `PRIMITIVE_MAP` for seven primitive types: `agents`, `skills`, `commands`, `workflows`, `references`, `templates`, `rules`. For each primitive, it reads from `assets/${kind}/` and writes to `.opencode/${kind}/`.

**Sync chain behavior:**
- Reads `pruned-agent-paths.json` to preserve intentionally-pruned Deployed entries.
- Overwrites Deployed files when Source differs.
- Backs up user-modified Deployed files to `.opencode/${kind}/.backup/${filename}` BEFORE overwriting (L92-97 of `sync-assets.js`).
- Runs `scripts/transform-gsd-to-hm.js` in-place within `assets/agents/` BEFORE agent sync, renaming `gsd-*` primitives to `hm-*`.
- Loads the `gsd-file-manifest.json` protected-paths list (424 paths verified during W4 sync) and refuses to overwrite any path on that list unless the Source layer is canonical.

**The Deployed layer is disposable.** On a fresh `rm -rf .opencode && node scripts/sync-assets.js`, every Deployed file is regenerated from Source. Backup files at `.opencode/${kind}/.backup/` are destroyed on fresh install — they only protect incremental overwrites.

---

## 4. Hand-Maintained Exclusions

The following paths are **outside** the sync chain. They are hand-maintained and must NOT appear under `assets/` or `.opencode/`:

| Path | Reason for exclusion | Owner |
|------|---------------------|-------|
| `AGENTS.md` (root) | Hand-maintained project constitution; mirrors `assets/rules/` content but ships at the repo root for OpenCode auto-discovery. Edits go through the constitution process described in `AGENTS.md` §CONSTITUTION. | Project owner |
| `scripts/sync-assets.js` | The sync engine itself. It cannot be the thing it syncs. | Project owner |
| `scripts/transform-gsd-to-hm.js` | The gsd→hm rename transform. Runs separately from sync-assets.js; question of integration is Open Question §7.1. | `hf-meta-builder` |
| `package.json` | npm manifest; managed via `npm` tooling, not sync-assets.js. | Project owner |
| `tsconfig.json` | TypeScript compiler config; managed via TypeScript tooling. | Project owner |
| `.hivefiver-meta-builder/...` | The Lab layer (Layer 1). Promotion to `assets/` is a SEPARATE process governed by meta-builder playbooks. | `hf-*` authors |

**Convention note:** The previous audit recommended an `agent-instructions/` hand-maintained directory. Verification on 2026-06-05 confirmed this directory does not exist on disk and is not part of the current hand-maintained boundary. If introduced in the future, it must be added to this exclusion list with explicit ownership and a documented edit flow.

**Rule:** If you need to add a new hand-maintained file or directory, document it here with reason and owner BEFORE writing the first edit. Direct edits to undocumented paths in the repo root are a sync violation only if they shadow a Source-layer primitive; otherwise they are unrestricted.

---

## 5. Consequences

**If you edit `assets/...` correctly:**
- The next `node scripts/sync-assets.js` propagates the change to `.opencode/...`.
- The change is durable, atomic-committable, and survives fresh `rm -rf .opencode` reinstalls.
- Gate 1 (Lifecycle) and Gate 2 (Spec) verify the propagation automatically.

**If you edit `.opencode/...` directly:**
- The edit is a **sync violation** (Sync Violation B-class).
- The next sync run will either (a) silently overwrite your edit if Source is canonical, or (b) back it up to `.opencode/${kind}/.backup/` if it differs from last-known-good.
- The edit will not appear in git diff against `assets/...` and will be lost on fresh install.
- Recovery: revert the Deployed edit, apply the change to `assets/...`, re-run sync, commit both layers atomically.

**If you edit the Lab layer (`.hivefiver-meta-builder/...`):**
- The change is local to the working area and does NOT propagate to `assets/` automatically.
- Promotion to `assets/` requires a separate commit following the meta-builder playbooks (`HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md`, `SKILLS-REFACTORING-REVAMP.md`, `SKILL-CRITERIA-SHORT.md`, `ONBOARDING-WORKFLOW-PROTOCOL.md`).
- Until promoted, the Lab change is invisible to sync-assets.js and to the Deployed layer.

**If you bypass `sync-assets.js` and copy files manually:**
- The Deployed layer is no longer guaranteed derivable from Source.
- Gate 3 (Evidence) verification will fail because the Source/Deployed byte-identity invariant is broken.
- Recovery: delete `.opencode/${kind}/<file>`, re-run `node scripts/sync-assets.js`, verify the file reappears from Source, commit the Source change.

---

## 6. References

- **AGENTS.md** §CONSTITUTION: Source vs Deploy — `AGENTS.md` L3
- **AGENTS.md** §Two Halves (never confuse them) — `AGENTS.md` L211
- **W1 source-map findings** — `.hivemind/planning/source-of-truth-audit-2026-06-05/W1-source-map-findings.md` (commit `10cecfa4`)
- **W2 source-of-truth model spec** — `.hivemind/planning/source-of-truth-audit-2026-06-05/W2-sot-model-spec.md` (commit `7a47b31c`)
- **W3 source-layer TDD §6 restoration** — commit `12549f9b` (fixes Sync Violation A)
- **W4 sync verification** — `.hivemind/planning/source-of-truth-audit-2026-06-05/W4-sync-verification.md` (commit `e42a429f`, 121L, all 3 gates PASS)
- **Sync engine** — `scripts/sync-assets.js` (512L)
- **Transform script** — `scripts/transform-gsd-to-hm.js`
- **Protected paths manifest** — `gsd-file-manifest.json` (424 paths)
- **Lab layer** — `.hivefiver-meta-builder/{skills-lab,agents-lab,commands-lab,workflows-lab,references-lab}/`

---

## 7. Open Questions

These four questions are deferred from W2 §9 and remain open as of this policy:

1. **Should `transform-gsd-to-hm.js` become part of the sync chain?** Currently it runs separately from `sync-assets.js`. Folding it in would require the sync engine to invoke the transform during agent sync, and would commit the rename to a stable point in the Source → Deployed pipeline.
2. **What is the canonical way to revert a sync violation?** If someone mutates Layer 3 directly, the recovery flow (described in §5 above) is documented informally but lacks a tested playbook. A documented remediation runbook with worked examples should be authored in a follow-up wave.
3. **Should the `.backup/` convention be standardized across all primitive types?** Currently `.backup/` works for `rules/` per `sync-assets.js` L92-97, but may not be uniformly applied to `skills/`, `agents/`, `commands/`, etc. Audit needed to confirm the convention is enforced per-primitive.
4. **How are breaking changes in the Source layer communicated to Deployed-layer consumers?** A Source-layer change can break runtime behavior even if the sync chain is correct. There is no automated deprecation or migration warning system today. This needs a contract-level discussion (consumer impact, deprecation window, migration script).

These questions do not block the W2 spec or the W4 verification. They are tracked here for resolution in a follow-up wave or audit phase.

---

**End of SoT-POLICY**
