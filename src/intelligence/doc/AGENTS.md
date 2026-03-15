# src/intelligence/doc/ — Document Intelligence Surface

Routes document knowledge surfaces based on purpose class.

## Audit Findings (2026-03-15)

> [!CAUTION]
> **Implementation gutted.** Only `doc-surface-router.ts` with a single `resolveDocKnowledgeSurfaces()` function remains. The full doc intelligence implementation (DocWeaver, AST markdown manipulation, 20-operation tool) referenced in historical documentation does not exist in the current source.

## Boundary

| File | Status | Purpose |
|------|--------|---------|
| `doc-surface-router.ts` | ✅ Minimal | Maps purpose class → required doc surfaces |
| `index.ts` | ⚠️ Empty | Barrel — needs re-export |

## Restoration Needed

If doc intelligence is a priority, the following must be rebuilt:
- Document parsing and section manipulation
- Multi-format support (markdown, YAML frontmatter)
- Cross-document integrity checking
- Integration with `hivemind_doc` tool (currently absent)
