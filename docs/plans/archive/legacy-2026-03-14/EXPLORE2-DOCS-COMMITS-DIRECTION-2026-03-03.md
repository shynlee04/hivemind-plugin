# Explore2 — Documentation, Commits, and Directional-Change Synthesis

> **Document ID:** EXPLORE2-DOCS-COMMITS-DIRECTION-2026-03-03  
> **Phase:** P4-Explore2  
> **Date:** 2026-03-03  
> **Scope:** Documentation/commit trajectory, directional terminology pivots, compact/governance agreements (no implementation)

---

## 1) Executive Synthesis

This investigation confirms that Compact Superiority rollout risk is **not primarily architectural code risk** (covered in Explore1), but a **governance-contract drift risk** across planning docs, commands, skills, and legacy OpenCode-era artifacts.

**Terminology policy note:**
- **OpenCode terminology is canonical for project artifacts.**
- **Kilocode mode terminology is orchestration-only for this development environment.**

Most blocking conflicts are concentrated in five areas:
1. Main-session confirmation vs sub-session deterministic execution
2. Canonical hierarchy/state path drift
3. Dual governance semantics (`governance_mode` vs `governance_status`)
4. Multiple governance/agent source-of-truth surfaces
5. Terminology boundary drift (OpenCode-canonical artifact wording vs unlabeled orchestration aliases)

---

## 2) Evidence Base

Primary evidence sets used:
- Root governance: `AGENTS.md`, `AGENT_RULES.md`, `MASTER-NOTICE-BOARD.md`
- Compact/governance commands: `commands/hivemind-compact.md`, `commands/hivemind-context.md`, `commands/hivemind-pre-stop.md`
- Core skills: `skills/hivemind-governance/SKILL.md`, `skills/session-lifecycle/SKILL.md`
- Current phase anchors: `docs/plans/SPEC-COMPACT-SUPERIORITY-ARCHITECTURE-2026-03-03.md`, `docs/plans/ENTITY-RELATIONAL-MAP-2026-03-03.md`, `docs/plans/EXPLORE1-ARCH-STRUCTURE-2026-03-03.md`
- Conflict/canonicalization artifacts: `docs/plans/conflict-map-2026-03-03.md`, `docs/plans/forensics-report-2026-03-03.md`, `docs/plans/2026-03-03-meta03-cycle0-governance-canonicalization.md`, denoise plan/report docs
- Trajectory evidence: `CHANGELOG.md` and `git log` history across governance/planning anchors

---

## 3) Timeline of Major Directional Pivots (dated)

| Date | Pivot | Directional Change | Evidence |
|------|-------|--------------------|----------|
| 2026-02-11 | `.opencode` planning → `.hivemind` structure | Shift from OpenCode planning location toward HiveMind state-centric topology | git commit `9f5e9d1` (`feat: migrate from .opencode/planning/ to .hivemind/ directory structure`) |
| 2026-02-11 to 2026-02-12 | Lifecycle/governance tools become core operating model | Formalization of `declare_intent`, `map_context`, `compact_session`, hierarchy, and drift enforcement | `CHANGELOG.md` entries for 1.0.0–2.2.0 |
| 2026-02-16 | Session coherence + confidence/clarification era | First-turn injection, confidence scoring, and compaction/continuity logic expanded | `MASTER-NOTICE-BOARD.md` session entries and patch notes |
| 2026-03-02 | Governance cleanup (“v3.0-clean”) | `AGENTS.md` reframed as active operational quick standard after context-rot concerns | `AGENTS.md` metadata + `docs/context-rot-analysis-2026-03-02.md` |
| 2026-03-03 | META03 canonicalization + denoise rollout | Explicit conflict remediation wave (depth/path/load-order/session-boundary) and gate-based denoise outcomes | `docs/plans/2026-03-03-meta03-cycle0-governance-canonicalization.md`, `docs/plans/hivefiver-denoise-rollout-report-2026-03-03.md` |

### Top 5 Directional Pivots (condensed)
1. File-system/plan topology pivot to `.hivemind` state-first structure
2. Lifecycle toolchain (`declare_intent/map_context/compact_session`) as governance backbone
3. Context confidence + compaction continuity becoming explicit control plane
4. AGENTS cleanup from polluted/stale doctrine toward concise operational baseline
5. META03/denoise transition from implicit conventions to explicit, gate-verified canonicalization

---

## 4) Compact/Agreement Matrix (source, statement, status, conflict)

| Theme | Source | Agreement Statement | Status | Conflict / Risk |
|------|--------|---------------------|--------|-----------------|
| Compact protocol | `commands/hivemind-compact.md` | Pre-compact: scan/review/save; then `compact_session`; then instruct next-session declaration | Active | Conflicts when other docs imply compact can proceed without explicit lifecycle closure discipline |
| Context-before-action | `commands/hivemind-context.md` | Investigation/read evidence required before any write/edit | Active | Can conflict with auto-mechanisms that mutate/commit/split without transparent user-level context gate |
| Pre-stop governance gate | `commands/hivemind-pre-stop.md` | Mandatory validation + export + memory + verification + compact sequence | Active | Strong but heavy; conflicts with “quick” operational patterns and silent automation triggers |
| Universal strict confirmation | `skills/hivemind-governance/SKILL.md` | “Before ANY file change… WAIT yes/proceed” | Active text | Deadlock with delegated sub-session deterministic execution policies |
| Sub-session exception (planned canonicalization) | `docs/plans/2026-03-03-meta03-cycle0-governance-canonicalization.md` | Delegated sub-sessions should execute packet scope **without** additional user confirmation | Planned/resolution artifact | Direct contradiction with strict universal confirmation wording until synced into active skill text |
| Session lifecycle state path | `skills/session-lifecycle/SKILL.md` | Lists `.hivemind/hierarchy.json` as source of truth | Active text (stale) | Conflicts with canonical state path model (`.hivemind/state/...`) and path-governance direction |
| Path canonicality | `AGENTS.md` + canonicalization docs | Path resolution via centralized path logic; avoid hardcoded path drift | Active intent | Skill/document remnants still contain stale path references |
| Dual governance state semantics | `docs/plans/conflict-map-2026-03-03.md` | Reports `governance_mode` vs `governance_status` ambiguity | Active unresolved conflict | Runtime/operator ambiguity across config vs live enforcement state |
| Dual source-of-truth agent definitions | `docs/plans/conflict-map-2026-03-03.md` | Agent definitions exist both in files and config, no auto-sync | Active unresolved conflict | Drift risk in delegation boundaries and role contracts |
| CQRS governance posture | `AGENTS.md`, `AGENT_RULES.md`, Explore1 | Hooks read-only, tools write-only, mutation queue centrality | Active but unevenly operationalized | Convention-based enforcement still allows surface-level drift risks (Explore1 findings) |

---

## 5) Terminology Boundary Clarification: OpenCode Canonical + Kilocode Orchestration Aliases

### 5.1 Canonical + alias map from Compact Superiority spec

| OpenCode canonical term (project artifacts) | Kilocode alias (orchestration-only) | Notes |
|------------------|-------------------------------------------|-------|
| agents/subagents | modes | OpenCode remains canonical in artifacts; alias is internal routing shorthand |
| delegation / delegation packet | handoff / handoff packet | Alias may be used in packet-routing metadata only |
| context window | budget | Alias may be used in runtime diagnostics and thresholds |

### 5.2 Expanded boundary map for operational use

| OpenCode canonical expression | Kilocode orchestration alias | Boundary rule |
|---------------------------|--------------------------------------|-----------|
| front-facing coordinator agent | `orchestrator` mode (or mode acting as coordinator) | Keep OpenCode role wording in project artifacts; alias only in orchestration lanes |
| builder/executor agent | `code` / `debug` mode (task-specific) | Keep role wording in architecture docs; alias only in environment execution metadata |
| research/explorer subagent | `ask` / research-oriented mode path | Keep OpenCode role language in artifacts; alias only for mode routing |
| delegation packet | handoff packet | Use `delegation packet` in project docs; alias allowed in internal packet operations |
| auto-compact continuation | continuity recovery session | Treat as equivalent labels; prefer artifact-local OpenCode phrasing outside orchestration notes |

### 5.3 Terminology drift that still exists
- Many artifacts still mix **OpenCode-canonical** and **mode-alias** language without explicit boundary labeling.
- “Delegation” and “handoff” are both used as normative terms where artifact-level canonical selection is not declared.
- “Session boundary,” “compact continuity,” and “post-compact recovery” remain semantically close but not consistently boundary-labeled across skill/command docs.

---

## 6) Top Compact Conflicts Blocking Clean Rollout

1. **Confirmation deadlock (P0)**  
   Universal “wait for yes/proceed before file change” vs delegated sub-session autonomy contract.

2. **Hierarchy path inconsistency (P0)**  
   Stale `.hivemind/hierarchy.json` references vs canonical `.hivemind/state/...` direction.

3. **Dual governance semantics (P1)**  
   `governance_mode` vs `governance_status` creates operator/runtime ambiguity.

4. **Dual governance/agent source-of-truth (P1)**  
   Agent contracts and governance directives split across multiple unsynchronized surfaces.

5. **Automation vs explicit human gate (P1/P2)**  
   Auto-realign/auto-commit/auto-split patterns can bypass or blur command-level explicit gate contracts.

---

## 7) Rollout Risk Register (P0/P1/P2)

| Priority | Risk | Trigger | Impact | Mitigation Direction |
|----------|------|---------|--------|----------------------|
| P0 | Session-boundary confirmation contradiction | Main-session strict confirmation + delegated sub-session execution contracts diverge | Governance deadlock or inconsistent behavior under delegation | Canonicalize main/sub/recovery contract in one normative doc and update skill text accordingly |
| P0 | Canonical path drift | Stale path references in active lifecycle docs | Wrong state target, broken validation assumptions | Enforce path glossary + automated stale-path checks in governance quality gate |
| P1 | Dual governance fields | Config/runtime governance semantics diverge | Incorrect enforcement interpretation | Collapse to one canonical governance state model with migration notes |
| P1 | Source-of-truth fragmentation | Same contract appears in AGENTS, AGENT_RULES, skills, plans with drift | Teams follow different “truths” | Establish hierarchy of authority and cross-doc sync policy |
| P1 | Auto-mechanism override ambiguity | Auto-split/auto-commit/autorealign with weak user-visible gating | Perceived non-determinism and trust erosion | Require explicit audit trail + visible gate events in all automatic transitions |
| P2 | Terminology mixed vocabulary | OpenCode-canonical terms and orchestration aliases used without boundary labeling | Onboarding and coordination confusion | Publish canonical boundary map and lint active docs for unlabeled alias usage |
| P2 | Historical doc residue | Old OpenCode-era language remains in active references | Continuous reintroduction of drift | Archive/label historical docs as non-normative and keep active docs minimal |

---

## 8) Recommendations — Canonical Single-Source-of-Truth Path

### 8.1 Recommended authority stack

1. **Operational SSoT (active):** `AGENTS.md` (concise, current operational rules)
2. **Contract delta log (active, dated):** `docs/plans/` canonicalization docs (e.g., META03 cycle docs)
3. **Constitutional reference (non-operational default):** `AGENT_RULES.md` as architectural philosophy/reference
4. **Executable contract surfaces:** commands + skills must be synchronized to #1 and #2

### 8.2 Canonicalization path (practical)

- Step A: Create/maintain one **governance contract matrix** as the single conflict-resolution index (dated, versioned).
- Step B: Treat any command/skill rule not present in matrix as **non-canonical** until ratified.
- Step C: Run periodic drift checks for: confirmation policy, path references, governance field semantics, and terminology map.
- Step D: Keep legacy OpenCode-era docs explicitly labeled “historical/non-normative.”

### 8.3 Minimal canonical glossary (immediate)

- **Agents/Subagents** are canonical in project artifacts; **modes** are orchestration-only aliases
- **Delegation packet** is canonical in project artifacts; **handoff packet** is orchestration-only alias
- **Context window** is canonical in project artifacts; **budget** is orchestration-only alias
- **Continuity recovery session** for post-compact start state

---

## 9) Final Terminology Boundary Summary (for rollout packet)

**Canonical artifact policy:**
- OpenCode terminology is canonical for project artifacts.
- Kilocode mode terminology is orchestration-only for this development environment.

**Alias equivalence set (for orchestration mechanics only):**
- agents/subagents ↔ modes
- delegation/delegation packet ↔ handoff/handoff packet
- context window ↔ budget
- coordinator/executor/research agent roles ↔ orchestrator/code-debug/ask mode lanes

**Rollout principle:** preserve OpenCode ecosystem framing in governance docs, skills, commands, and plans; use mode aliases only in explicitly orchestration-labeled sections.

---

## 10) Conclusion

Explore2 confirms that Compact Superiority rollout viability depends on **documentation/governance contract convergence** more than new architecture invention. The strongest near-term path is to lock canonical policy in one matrix-driven SSoT chain, then align commands/skills and terminology to that chain before further expansion.
