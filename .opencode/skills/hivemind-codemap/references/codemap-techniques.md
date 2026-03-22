# Codemap Techniques

## 1. Layered Scan Lattice
- Purpose: move from high-level map to low-level proof without drowning the session.
- Fit: default codemap technique.
- Prerequisites: scan goal and authority surfaces known.
- Outputs: scan plan, seam hypotheses, bounded slices.

## 2. Critical-Directory Deep Pass
- Purpose: reuse BMAD's deep-scan idea for targeted codebase understanding.
- Fit: when only certain directories are likely to matter.
- Prerequisites: critical directories or hotspot seams identified.
- Outputs: seam inventory, hotspot list.

## 3. Pack-Then-Verify
- Purpose: use Repomix or a packed representation for overview, then verify critical slices natively.
- Fit: large repos or synthesis-heavy routing decisions.
- Prerequisites: repomix available or equivalent pack artifact available.
- Outputs: repomix extraction report, verified seam inventory.

## 4. Write-Validate-Purge Loop
- Purpose: prevent context saturation during exhaustive scans.
- Fit: long-running codemap passes.
- Prerequisites: batch state tracking.
- Outputs: batch summaries, codemap synthesis, resume-safe state.
