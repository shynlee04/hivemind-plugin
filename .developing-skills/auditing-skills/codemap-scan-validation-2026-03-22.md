# Codemap Scan Validation - 2026-03-22

## Scope
- Validate `research-for-codemap-scan.md` against local evidence.
- Separate BMAD-supported scan patterns from repo-specific Repomix availability.

## Confirmed
- BMAD full-scan supports three scan levels:
  - `quick`
  - `deep`
  - `exhaustive`
- Deep/exhaustive scans use a batching strategy by subfolder.
- Deep uses `critical_directories` from documentation requirements.
- Exhaustive uses all subfolders recursively and excludes `node_modules`, `.git`, `dist`, `build`, and `coverage`.
- BMAD requires write-as-you-go behavior during deep/exhaustive scans:
  - immediately write findings
  - validate written output
  - update state file
  - purge detailed findings from context
  - keep only a short summary
- BMAD state tracking explicitly includes `findings.batches_completed` with:
  - `path`
  - `files_scanned`
  - `summary`
- BMAD embeds a parallel audit-file-refs skill in the packed XML:
  - batch files into groups of about 20
  - dispatch `Explore`/`haiku`
  - require `FILES CHECKED: N`
  - reconcile total file count before final report

## Partially Confirmed
- The file-reference audit skill is present as embedded content in `docs/research/repomix-bmad-method.xml`, but the actual `.claude/skills/bmad-os-audit-file-refs/**` files do not exist as standalone files in this repo.
- Therefore the method is transferable, but the local file-path claim in `research-for-codemap-scan.md` is only partially supported.

## Unsupported By The BMAD Full-Scan Evidence
- Repomix is not prescribed by the cited BMAD full-scan workflow itself.
- The BMAD full-scan evidence supports whole-codebase scan levels, batching, state tracking, and subagent loops, but not a mandatory Repomix step.

## Separately Validated Repomix Reality In This Repo
- `npx -y repomix --help` runs successfully in this workspace.
- `.opencode/opencode.json` configures a local `repomix --mcp` server, but it is currently `enabled: false`.
- `docs/research/hivefiver-mcp-setup-repomix.md` describes Repomix as local repository packaging and codemap-style synthesis.

## Transferable Design Rules For HiveMind Codemap
1. Keep BMAD's three scan levels.
2. Use explicit tool modes:
   - native
   - repomix
   - hybrid
3. Require scan state for deep/exhaustive work.
4. Use subfolder or file-batch loops, not one giant scan.
5. For parallel audit-like loops, require file-accounting reconciliation before final synthesis.
6. Keep write-as-you-go outputs and context purging as first-class rules.
7. Treat Repomix as an optional acceleration layer, not the only supported path.
