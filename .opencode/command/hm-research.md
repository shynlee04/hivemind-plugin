---
namespace: hm
agent: hm-phase-researcher
subtask: false
description: "Conduct dense stack research and codebase investigation for a roadmap phase."
argument-hint: "<phase-number> [--deep]"
requires: []
validation-gates: ["spec-compliance-gate"]
output-templates: ["hm-research.md"]
coordination-model: "waiter-model"
completion-signals: ["research-completed"]
tools:
  read: true
  write: true
  bash: true
  glob: true
  grep: true
  agent: true
---

<objective>
Investigate the target technology stack, codebase reuse patterns, dependency versions, and threat vectors for a roadmap phase — producing a structured RESEARCH.md that the planner uses to make informed implementation decisions.

**How it works:**
1. Resolve phase number from $ARGUMENTS and load existing context (CONTEXT.md, ROADMAP.md, prior RESEARCH.md)
2. Identify target libraries and frameworks from phase spec — extract package names and required versions
3. Validate dependencies against the workspace lockfile — use Context7 MCP tools to resolve library IDs and fetch canonical documentation
4. Map codebase coordinates — locate interfaces, source files, and patterns relevant to the phase's implementation scope
5. Analyze threat vectors — formulate STRIDE threats specific to the phase's domain, map trust boundaries
6. Resolve open questions — document architectural alternatives, risks, and recommended approaches
7. Write RESEARCH.md and commit — structured document consumed by hm-plan and hm-gate

**Output:** `{phase_dir}/{padded_phase}-RESEARCH.md` — stack validations, codebase paths, threat model, and recommendations
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<context>
Phase ID: $ARGUMENTS (required — first positional argument)
Optional flags:
  --deep    Perform full upstream research: fetch docs via Context7 MCP, crawl library changelogs, validate version compatibility

Namespace: hm
Routed Agent: hm-phase-researcher
Validation gates: spec-compliance-gate (RESEARCH.md serves as evidence for downstream spec compliance checks)
</context>

<process>
**Mode routing:**
```bash
RESEARCH_MODE=$(hm-sdk query config-get workflow.research_mode 2>/dev/null || echo "standard")
```

If `--deep` is in $ARGUMENTS or RESEARCH_MODE is `"deep"`:
  Read and execute `.opencode/workflows/hm-research-deep.md` if available, or extend the standard workflow with:
  - Full Context7 MCP resolution for every dependency in the phase scope
  - Package changelog and migration-guide review for version gaps >1 minor
  - Codebase-wide impact analysis via Repomix packing of affected directories
  - Cross-referencing threat model against OWASP Top 10 or CVE databases for flagged packages

Otherwise (`"standard"` / unset / any other value):
  Read and execute `.opencode/workflows/hm-research.md` end-to-end.

  The workflow processes research in ordered steps:
  1. **Initialize** — validate phase number, load existing context boundaries from ROADMAP.md and CONTEXT.md
  2. **Investigate stack** — inspect `package.json` and lockfiles for exact installed versions; compare against phase requirements
  3. **Resolve via MCP** — for each library, call `context7_resolve-library-id` to obtain the Context7-compatible library ID, then query canonical docs for usage patterns, API signatures, and migration notes
  4. **Map codebase** — locate source files, interfaces, and test patterns relevant to the phase; record relative paths and reusable assets
  5. **Analyze threats** — formulate STRIDE threat model: Spoofing (auth bypasses), Tampering (data integrity), Repudiation (audit gaps), Information Disclosure (leaked state), DoS (resource exhaustion), Elevation of Privilege (scope escalation)
  6. **Resolve questions** — document open architectural choices, recommended alternatives, and risk mitigation strategies
  7. **Write RESEARCH.md** — generate structured document using the hm-research template; substitute stack versions, codebase paths, and threat details
  8. **Commit** — stage and commit RESEARCH.md atomically; update STATE.md with research completion marker

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections here are summaries — the workflow file contains the complete step-by-step process.

**MCP verification rules:**
- Every library identified in the phase scope MUST be resolved via `context7_resolve-library-id` — do NOT rely on training knowledge for version-specific API behavior
- If Context7 MCP tools are unavailable, use the CLI fallback: `ctx7 library <name> "<query>"`
- Record the resolved library ID, fetched version, and a snippet of the relevant documentation in RESEARCH.md as L3 evidence
- If a package cannot be resolved (no Context7 entry, no docs), flag it as `UNRESOLVED` with a note for the planner

**Scope guardrail:** Research is investigation-only. The researcher must NOT write code, modify configurations, or implement any part of the phase. All output is read-side documentation.
</process>

<success_criteria>
- Phase context loaded and boundaries respected (no re-researching already-decided questions)
- All target library versions confirmed against workspace lockfile and package.json
- Context7 MCP resolution completed for each library in the phase scope
- Codebase paths mapped with relative links to interfaces, source files, and test patterns
- STRIDE threat model formulated with at least one scenario per category applicable to the phase
- Open questions documented with recommended approaches and risk assessment
- RESEARCH.md written in structured format using the hm-research template
- RESEARCH.md committed atomically to git
- STATE.md updated with research completion marker
- In --deep mode: changelog review completed for every dependency with version gaps; cross-repo impact analysis documented
- All UNRESOLVED packages flagged explicitly for planner attention
</success_criteria>
