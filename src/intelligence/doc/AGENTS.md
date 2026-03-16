# src/intelligence/doc/ — Document Intelligence Surface

Routes document knowledge surfaces based on purpose class and exposes the first standalone read-only doc-intel foundation.

## Audit Findings (2026-03-15)

> [!CAUTION]
> The legacy multi-format, write-capable doc-intel stack is still not restored. Current live scope is intentionally narrower: router mapping plus a markdown-first, read-only library surface.

## Boundary

| File | Status | Purpose |
|------|--------|---------|
| `doc-surface-router.ts` | ✅ Minimal | Maps purpose class → required doc surfaces |
| `types.ts` | ✅ Live | Read-side doc-intel types |
| `safety.ts` | ✅ Live | Standalone path and markdown file safety helpers |
| `formats/md.ts` | ✅ Live | Markdown parsing, section reads, and chunking |
| `read-ops.ts` | ✅ Live | Standalone `skim`, `read`, `chunk`, and `search` behavior |
| `index.ts` | ✅ Live | Barrel exports router + read foundation |

## Restoration Needed

If doc intelligence is a priority, the following must be rebuilt:
- Public `hivemind-doc` tool exposure for the read-only foundation
- Multi-format support beyond markdown-first reads
- Cross-document integrity/index/xref layers
- Any write-capable or inspect-heavy restoration after the read foundation is stable
