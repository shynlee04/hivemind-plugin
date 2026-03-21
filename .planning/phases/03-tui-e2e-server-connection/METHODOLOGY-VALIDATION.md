# Methodology Validation

**Created:** 2026-03-21
**Phase:** 03-tui-e2e-server-connection
**Purpose:** Phase 3 closeout artifact validating the completion loop methodology

---

## Deliverables Checklist

### BOUNDED-SLICE-TEMPLATE.md

- [ ] **Exists:** `test -f .planning/phases/03-tui-e2e-server-connection/BOUNDED-SLICE-TEMPLATE.md`
- [ ] **Header Section:** Phase context, module name, bounded scope statement
- [ ] **Ownership Section:** Authoritative owner, thin adapter policy, integration seam
- [ ] **Completion Criteria:** Source ownership clarity, integration path, validation evidence
- [ ] **Exit Gate:** All four gates documented
- [ ] **Worked Example:** Runtime entry module demonstration
- [ ] **References:** VER-01/VER-02/VER-03, dual-plane architecture, ARCH-02 thin-adapter

### MODULE-INVENTORY.md

- [ ] **Exists:** `test -f .planning/phases/03-tui-e2e-server-connection/MODULE-INVENTORY.md`
- [ ] **Module Catalog:** All src/ modules cataloged with paths and descriptions
- [ ] **Dependency Map:** Forward dependencies and reverse dependencies documented
- [ ] **Execution Order:** Numbered sequence showing recommended execution order
- [ ] **Inheritance Contract:** Sequencing Rule, Bounded Slice Rule, Evidence Inheritance, Blocking Rule

---

## Cross-Reference Validation

### BOUNDED-SLICE-TEMPLATE References VER-01/VER-02/VER-03

| Reference | Location in Template |
|-----------|---------------------|
| VER-01 (Local diagnostics) | Validation Evidence section |
| VER-02 (Integration checks) | Validation Evidence section |
| VER-03 (Live official-interface proof) | Validation Evidence section |

**Validation:** ✅ Template contains validation evidence section with all three evidence lanes

### MODULE-INVENTORY Follows Sequencing Heuristic from 03-CONTEXT.md

| Heuristic from 03-CONTEXT | Implementation in MODULE-INVENTORY |
|---------------------------|----------------------------------|
| "Modules with fewer dependencies first" | Execution Order: `src/shared/` (0 deps) first, then modules with increasing dependencies |
| "Modules that downstream phases depend on take priority" | `src/schema-kernel/` (contract authority) at position 2, `src/sdk-supervisor/` at position 3 |

**Validation:** ✅ MODULE-INVENTORY implements the sequencing heuristic correctly

### Inheritance Contract Consistent with Phase 1 Dual-Plane and Phase 2 Runtime Operations

| Phase | Principle | Inheritance Contract Alignment |
|-------|-----------|-------------------------------|
| Phase 1 | Dual-plane architecture (SDK control-plane + plugin execution-plane) | Sequencing distinguishes control-plane modules (`src/control-plane/`, `src/cli/`) from execution-plane modules |
| Phase 2 | Unified runtime operations | Runtime tools and supervisor come early in sequence (positions 5, 3) |

**Validation:** ✅ Inheritance contract is consistent with Phase 1 dual-plane and Phase 2 runtime operations

---

## Phase 3 Completion Loop Contract

The bounded-slice delivery model is now established. Future phases inherit the following contract:

### 1. Pattern

**Choose one module → finish its ownership + integration path → run required validation → only then authorize the next module**

This pattern ensures:
- Each module has clear source ownership before expansion
- Integration paths are defined and tested before consumers depend on them
- Validation evidence meets proof standards before claims are made
- The execution spine remains auditable and traceable

### 2. Template

**BOUNDED-SLICE-TEMPLATE.md must be used as the starting point for each module slice**

Every future module slice MUST:
- Follow the Header → Ownership → Completion Criteria → Exit Gate structure
- Include a worked example for the specific module
- Reference the applicable evidence lane standards

### 3. Sequence

**MODULE-INVENTORY.md defines the dependency-ordered execution sequence**

The sequence is binding unless explicitly justified:
- Position 1-5: Foundation and orchestration (`shared/` → `schema-kernel/` → `sdk-supervisor/` → `hooks/` → `tools/runtime/`)
- Position 6-14: Core tools and state modules
- Position 15-23: Feature modules
- Position 24-29: Plugin assembly and entry points

### 4. Evidence

**Each slice must produce validation evidence following the proof standards in BOUNDED-SLICE-TEMPLATE.md**

| Evidence Lane | When Required |
|---------------|---------------|
| VER-01 (Local diagnostics) | Always — type check, lint |
| VER-02 (Integration checks) | When module has integration paths |
| VER-03 (Live official-interface proof) | When claims are runtime-facing |

### 5. Gate

**Runtime-facing completion claims require live official-interface proof or explicit non-live labeling**

No completion claim may claim "runtime" behavior without:
- Live official-interface proof via real OpenCode server/client/plugin boundary, OR
- Explicit `[non-live evidence]` label with written justification

---

## Contract Binding

**This Completion Loop Contract is binding on Phase 4 and all subsequent phases.**

Future phases MUST:
- Use BOUNDED-SLICE-TEMPLATE.md as the starting point for module slices
- Follow the dependency-ordered sequence from MODULE-INVENTORY.md
- Produce validation evidence per the evidence lane standards
- Label non-live evidence explicitly

This contract may only be amended by a new Phase 3+ iteration that re-validates the methodology and updates the relevant artifacts (BOUNDED-SLICE-TEMPLATE.md, MODULE-INVENTORY.md, and this document).

---

## Phase 3 Closeout Status

| Deliverable | Status |
|-------------|--------|
| BOUNDED-SLICE-TEMPLATE.md | ✅ Complete |
| MODULE-INVENTORY.md | ✅ Complete |
| METHODOLOGY-VALIDATION.md | ✅ Complete (this document) |
| Cross-reference validation | ✅ Passed |
| Completion Loop Contract | ✅ Established |

**Phase 3 Status: CLOSED — Methodology validated and ready for downstream inheritance**
