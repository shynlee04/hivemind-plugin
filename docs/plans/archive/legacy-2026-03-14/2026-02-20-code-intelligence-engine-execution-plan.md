# Code Intelligence Engine Execution Plan

Date: 2026-02-20  
Status: Execution-ready planning baseline  
Scope: Production implementation plan for code-intelligence engine

## 1) Audit Summary (as of 2026-02-19)

### Evidence Snapshot
- Architecture plan exists: `docs/plans/2026-02-19-code-intelligence-engine-architecture.md`.
- Runtime/path placeholders exist for codemap concepts: `src/lib/paths.ts`, `src/lib/manifest.ts`, `src/cli/init.ts`.
- No concrete implementation modules found under `src/lib/code-intel/`.

### Status Conclusion
- Architecture design: **Done** (documented).
- Core implementation: **Mostly missing**.
- Operational integration: **Partial** (path/manifest readiness only).
- Production readiness: **Not started**.

## 2) Execution Slices by Phase (Exact Targets)

### Phase 1 - Foundation Scanner (MVP)

Target modules (new):
- `src/lib/code-intel/index.ts`
- `src/lib/code-intel/gitignore-filter.ts`
- `src/lib/code-intel/binary-detector.ts`
- `src/lib/code-intel/token-counter.ts`
- `src/lib/code-intel/secret-detector.ts`
- `src/lib/code-intel/file-scanner.ts`
- `src/lib/code-intel/codemap-io.ts`

Target modules (extend):
- `src/lib/paths.ts` (codemap file path helpers if needed)

Test targets:
- `tests/code-intel/gitignore-filter.test.ts`
- `tests/code-intel/binary-detector.test.ts`
- `tests/code-intel/token-counter.test.ts`
- `tests/code-intel/secret-detector.test.ts`
- `tests/code-intel/file-scanner.test.ts`

Exit criteria:
- `codemap.json` generated deterministically.
- gitignore/binary/secret filtering validated.
- token count error within configured tolerance.

### Phase 2 - Compression + Incremental Pipeline

Target modules (new):
- `src/lib/code-intel/tree-sitter-loader.ts`
- `src/lib/code-intel/signature-extractor.ts`
- `src/lib/code-intel/compressed-codemap.ts`
- `src/lib/code-intel/incremental-updater.ts`
- `src/lib/code-intel/watch-integration.ts`

Target modules (extend):
- `src/lib/event-bus.ts` (event contracts if required)
- `src/lib/watcher.ts` (integration glue only if needed)

Test targets:
- `tests/code-intel/signature-extractor.test.ts`
- `tests/code-intel/incremental-updater.test.ts`
- `tests/code-intel/watch-integration.test.ts`

Exit criteria:
- compression ratio >= 60% baseline.
- single-file incremental update < 500ms p95.
- watch updates produce consistent codemap deltas.

### Phase 3 - Cognitive Integration + Retrieval

Target modules (new):
- `src/lib/code-intel/selective-injector.ts`
- `src/lib/code-intel/pattern-search.ts`
- `src/lib/code-intel/knowledge-commits.ts`

Target modules (extend):
- `src/lib/cognitive-packer.ts`
- `src/schemas/events.ts`
- `src/schemas/graph-nodes.ts` (only if new code-entity node is approved)

Test targets:
- `tests/code-intel/selective-injector.test.ts`
- `tests/code-intel/pattern-search.test.ts`
- `tests/lib/cognitive-packer-code-intel.test.ts`

Exit criteria:
- file-lock-driven source injection works under token budget.
- pattern-first retrieval returns correct locations.
- no duplicate context payload inflation.

## 3) Dependencies and Risk Controls

### Dependencies
- `tiktoken` (token counting)
- `ignore` (gitignore parsing)
- `is-binary-path` (binary filtering)
- `web-tree-sitter` + language grammars (compression)

### Risk Controls
- Dependency gating: fail gracefully if parser package missing; fallback to Phase 1 output.
- Security gating: secret detector runs before persistence and before context injection.
- Performance gating: cap per-file size and enforce debounce/update budget.
- Determinism gating: stable sort + stable serialization for codemap artifacts.
- Safety gating: use existing path safety helpers and forbid traversal.

## 4) Success Metrics and Test/Benchmark Matrix

### Metrics
- Full scan throughput: <= 30s for 10k files baseline.
- Incremental update latency: < 500ms p95 per changed file.
- Compression ratio: >= 60% (target 70%).
- Retrieval precision: >= 95% for signature/pattern queries in validation suite.
- Secret leak rate: 0 known secrets persisted in codemap outputs.

### Verification Matrix

```bash
# correctness gates
npx tsc --noEmit
npm test

# focused suites (examples)
npx tsx --test tests/code-intel/file-scanner.test.ts
npx tsx --test tests/code-intel/incremental-updater.test.ts
npx tsx --test tests/lib/cognitive-packer-code-intel.test.ts

# ecosystem / chain checks
node bin/hivemind-tools.cjs source-audit
node bin/hivemind-tools.cjs ecosystem-check
```

Benchmark matrix (minimum):
- Scan benchmark: small/medium/large repositories.
- Incremental benchmark: create/modify/delete events.
- Injection benchmark: low/medium/high file-lock counts.
- Regression benchmark: repeated watch cycles (memory growth and drift).

## 5) Status Checklist (Not Started / Partial / Done)

### Phase 1
- [ ] Not started: `src/lib/code-intel/` module scaffold exists in repository.
- [ ] Not started: scanner pipeline implemented and persisted to codemap.
- [ ] Not started: Phase 1 test suite green.

### Phase 2
- [ ] Not started: tree-sitter loader and signature extraction implemented.
- [ ] Not started: incremental updater + watch integration validated.
- [ ] Not started: compression benchmarks recorded.

### Phase 3
- [ ] Not started: selective injector integrated into `cognitive-packer.ts`.
- [ ] Not started: pattern search and retrieval ranking implemented.
- [ ] Not started: end-to-end token-budget regression suite green.

### Existing Partials
- [x] Partial: codemap conceptual paths and manifest-level references exist.
- [x] Partial: architecture document defines end-state modules and criteria.

### Done
- [x] Done: architecture-level scope and phased decomposition documented.

## 6) Execution Rule

Implement strictly in phase order. Do not begin Phase 2 until Phase 1 correctness and benchmark gates pass; do not begin Phase 3 until Phase 2 latency/compression gates pass.
