[LANGUAGE: Write this file in en per Language Governance.]
# Audit TODO — Hivemind Session Management / Coordination / Delegation Tools

**Date:** 2026-06-04
**Owner:** hm-l0-orchestrator
**Context:** 9-track architectural audit + parallel findings

---

## OPEN TODOs (in priority order)

[LANGUAGE: Write this file in en per Language Governance.]
### TODO-1 [DONE] — Deep research: session-tracker cluster complexity
- **Why:** User says "session-tracker is intricate, route to TODO, not as simple as you propose"
- **Scope:** Map the full session-tracker cluster including:
  - Child + parent session tracking
  - Atomic writer
  - Logics
  - Event tracker
  - Child event tracker
  - All tools that interact with session-tracker
  - Trace tools + trace session-tracker
- **Result:** `.planning/research/session-tracker-cluster-map-2026-06-04.md` (969 lines, 38 TS files, 9990 LOC)
- **Key findings:**
  - Top 5 most-coupled modules identified (atomic-write.ts:33/141, SessionTracker index.ts:100, HierarchyIndex hierarchy-index.ts:48, ChildWriter child-writer.ts:30, SessionIndexWriter session-index-writer.ts:31)
  - `delegationType` MVD: 10 files, ~80 lines, zero schema breaks (all new field `?: DelegationType` and `.optional()` in Zod)
  - 10 risks identified (R1-R10)
  - 10 open questions (need L0/user input before TODO-2)

[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
### TODO-2 [DONE] — Design + Apply `delegationType` discriminator
- **Why:** Differentiate the different delegation mechanisms (Hivemind async vs native task vs slash command vs sdk-direct)
- **Depends on:** TODO-1
- **User decisions (2026-06-04):**
  - Q1 enum naming: `async-spawn` (NOT `delegate-task`)
  - Q2 user-issued task: `native-task` (NOT `task`)
  - Q3 execute-slash-command: `slash-cmd` (NOT `execute-slash-command`)
  - 4th (research): `sdk-direct` (for direct SDK calls without tool)
- **Final enum:** `async-spawn` | `native-task` | `slash-cmd` | `sdk-direct`
- **Implementation:** 5 atomic commits (c8c32a19, fe5483ef, f4356082, 8a3424de, 31627a7b)
- **Scope applied:**
  - 10 source files modified
  - `DelegationType` type + Zod schema at `src/features/session-tracker/types.ts:60-78`
  - Mirrored in `ChildSessionRecord` + `HierarchyManifestChild` + `ChildHierarchyEntry`
  - 6 writer sites set the field at WRITE time
  - Setter convention: `delegate-task` → `async-spawn`; `task` → `native-task`; `execute-slash-command` → `slash-cmd`; other → `sdk-direct`
  - 14 new tests in `tests/lib/session-tracker/delegation-type.test.ts`
- **Verification:** typecheck 0, build success, 292/292 MVD-touching tests pass
- **Backward compat:** all new fields `?.optional()` — existing on-disk files parse unchanged

### TODO-3 [PENDING] — Filter plumbing in query tools
- **Why:** delegation-status, session-tracker, session-hierarchy, session-view need `?delegationType` filter param
- **Depends on:** TODO-2
- **Scope:** Add filter param to each query tool; default "return all" (no filter applied)
- **Output target:** Implementation + tests

### TODO-3 [PENDING] — Update query tools to filter on `delegationType`
- **Why:** delegation-status, session-tracker, session-hierarchy, session-view all need to filter
- **Depends on:** TODO-2
- **Scope:** Add filter param to each tool, default behavior (return all), progressive disclosure

### TODO-4 [PENDING] — Apply mirror-vs-owner audit to full 9 tracks
- **Why:** After learning the correct model (Hivemind HAS custom tools, session-tracker tracks Hivemind-specific concepts), re-lens the 9 tracks
- **Scope:** For each track, identify what is mirror (OpenCode) vs what is Hivemind-specific
- **Note:** Mirror-not-owner as a concept was OVER-applied. Correct: Hivemind's session-tracker mirrors OpenCode events + adds Hivemind-specific discriminators

### TODO-5 [PENDING] — Apply /hivemind-setup design (original)
- **Depends on:** TODO-2 (for the `delegationType` field to be documented in setup flow)
- **Scope:** Apply the architect's design (templates, /hivemind-setup command)

---

## Decisions Log

- **D1 (2026-06-04):** Mirror-not-owner principle REFINED — Hivemind has custom tools (delegate-task, execute-slash-command) with distinct behaviors. session-tracker mirrors OpenCode events + adds Hivemind-specific metadata. Abolish the "abolish duplicated state" framing; keep the "track discriminators" framing.
- **D2 (2026-06-04):** Use `task` tool (synchronous, visible in main session) over `delegate-task` for orchestration-level dispatches when tmux integration is fragile.
- **D3 (2026-06-04):** Port directive verified: OpenCode default is **4096** (not 4069). Use 4096 with override via env.
- **D4 (2026-06-04):** 8 MCP servers are REQUIRED for end users: context7, repomix, exa, tavily, deepwiki, gitmcp, brave-search, github. LLM providers are OPTIONAL.
- **D5 (2026-06-04):** `.env` must reflect ACTUAL OpenCode env vars; 6 legacy `OPENCODE_EXPERIMENTAL_*` flags marked REMOVED, commented out with migration guidance. 4 new flags enabled: `OPENCODE_PURE=false`, `OPENCODE_CLIENT=cli`, `OPENCODE_DISABLE_PROJECT_CONFIG=false`, `OPENCODE_EXPERIMENTAL_REFERENCES=true`.
