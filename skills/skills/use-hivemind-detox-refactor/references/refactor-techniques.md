# Refactor Techniques

## 1. Authority extraction
- Purpose: move each concern to one real owner and remove competing authorities.
- Fits: Stages 4, 7, and 11.
- Prerequisites: authority baseline, route inventory.
- Output artifacts: detox assessment report, refactor stage report.
- Complements router by converting vague bundle overlap into one owner per concern.
- Synthesis expectation: record which surface now owns the concern and which no longer does.

## 2. Route tombstoning
- Purpose: block phantom or unsafe routes instead of inventing replacements.
- Fits: Stages 2, 5, and 7.
- Prerequisites: verified missing-target evidence.
- Output artifacts: investigation report, verification handoff.
- Complements router by making refusals explicit and auditable.
- Synthesis expectation: record each removed/refused route and its reason.

## 3. Seam isolation
- Purpose: split cross-bundle leaks into explicit seams and bounded interfaces.
- Fits: Stages 4, 5, and 7.
- Prerequisites: decomposition map and containment plan.
- Output artifacts: partition plan, refactor stage report.
- Complements router by allowing safe sequential or parallel work later.
- Synthesis expectation: record seam owners, invariants, and follow-on risks.

## 4. Staged strangler restoration
- Purpose: restore polluted routes slice-by-slice with gates between slices.
- Fits: Stages 7, 8, and 9.
- Prerequisites: chosen strategy and verification plan.
- Output artifacts: refactor stage report, verification handoff, stabilization report.
- Complements router by keeping restoration bounded and reversible.
- Synthesis expectation: record which old route is replaced, what remains, and what the next slice is.
