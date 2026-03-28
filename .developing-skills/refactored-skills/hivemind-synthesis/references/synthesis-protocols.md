# Synthesis Protocols

## Table of Contents

- [Research + Investigation → Synthesis Pipeline](#research--investigation--synthesis-pipeline)
- [Phase 1: INVESTIGATE](#phase-1-investigate)
- [Phase 2: EXTRACT](#phase-2-extract)
- [Phase 3: VALIDATE](#phase-3-validate)
- [Phase 4: SYNTHESIZE](#phase-4-synthesize)
- [Phase 5: GATE](#phase-5-gate)
- [Wave Sequencing](#wave-sequencing)

## Research + Investigation → Synthesis Pipeline

```
INVESTIGATE → EXTRACT → VALIDATE → SYNTHESIZE → GATE
```

Each phase gates the next. No skipping. No merging phases.

**If you skip INVESTIGATE, you synthesize assumptions. If you skip VALIDATE, you synthesize lies. If you skip GATE, you ship broken synthesis.**

## Phase 1: INVESTIGATE

Four investigation streams run in parallel or sequence:

| Stream | Source | Output |
|--------|--------|--------|
| Codebase investigation | Repomix pack + grep + attach | Module graph, interface inventory, dependency chains |
| Session investigation | Session exports, session-inspection dirs, sessions | Decision records, workflow patterns, delegation chains |
| Activity investigation | Planning, delegation, handoff, TDD, verification records | Execution evidence, outcome tracking |
| External research | MCP tools (Context7, Deepwiki, Tavily, Exa) | Library docs, ecosystem context, best practices |

**Investigation output format:**
```
Stream: {codebase|session|activity|external}
Finding: {what was found}
Source: {file path, session ID, MCP tool reference}
Confidence: {high|medium|low}
Evidence: {command output, grep result, MCP response}
```

## Phase 2: EXTRACT

Pull findings from investigation output. Structure each finding:

| Field | Content |
|-------|---------|
| Finding | What was discovered |
| Source | Where it came from (file:line, session ID, MCP tool) |
| Confidence | high / medium / low |
| Evidence | Actual output (grep result, command output, API response) |

**Extraction rules:**
- Every finding MUST have evidence — no claims without proof
- Confidence is based on source quality: code > git > tests > docs > memory
- Findings from different streams are kept separate until Phase 4

## Phase 3: VALIDATE

Cross-check findings against reality:

| Check | Method | Gate Type |
|-------|--------|-----------|
| Code check | Verify finding against actual source code | Hard — code is truth |
| MCP validation | Use Context7/Deepwiki to verify API claims | Medium — external authority |
| Git verification | Correlate session findings with git history | Hard — git is recorded |
| Pre-gatekeeping | Tests pass, build succeeds, types clean | Hard — blocks |

**Validation rules:**
- Code contradicts docs → code wins
- Git contradicts session memory → git wins
- MCP tool contradicts local claim → investigate further, prefer MCP for external APIs
- Pre-gatekeeping fails → synthesis cannot proceed

## Phase 4: SYNTHESIZE

Combine validated findings into unified understanding:

| Output | Contents |
|--------|----------|
| Domain model | How modules, APIs, and features relate |
| API contracts | What each interface exposes and how it behaves |
| Cross-dependency map | How modules depend on each other |
| Gap report | What was expected but not found |
| Contradiction report | What findings conflict and resolution |

**Synthesis output to:** `.hivemind/activity/synthesis/`

**Synthesis format:**
```json
{
  "synthesis_id": "synth-001",
  "timestamp": "2026-03-28T21:00:00Z",
  "investigation_streams": ["codebase", "session", "external"],
  "findings_count": 42,
  "validated_count": 38,
  "gaps": ["missing API for X", "no test coverage for Y"],
  "contradictions": [],
  "domain_model": { ... },
  "api_contracts": { ... },
  "cross_dependencies": { ... }
}
```

## Phase 5: GATE

Three gate layers, in order:

| Gate | What It Checks | Blocks? |
|------|---------------|---------|
| **Pre-gatekeeping** | Tests, build, types (see `references/pre-gatekeeping.md`) | Yes |
| **Synthesis gate** | Findings validated, gaps documented, contradictions resolved | Yes |
| **Integration checkpoint** | Cross-batch verification, no conflicts with prior synthesis | Yes |

**All three must pass for synthesis output to be trusted.**

## Wave Sequencing

For complex investigations, use wave-based synthesis:

| Wave | Scope | Agents | Output |
|------|-------|--------|--------|
| **Wave 1** (broad) | Full codebase, all sessions, all activity | hivexplorer (parallel) | Broad findings |
| → Synthesis | Combine Wave 1 findings | — | Gap list, targeted questions |
| **Wave 2** (targeted) | Specific modules, sessions, external research | hiverd, hivexplorer | Targeted findings |
| → Synthesis | Combine Wave 1 + Wave 2 | — | Validation questions |
| **Wave 3** (validation) | Cross-check, pre-gatekeeping | hiveq, architect | Validated synthesis |
| → GATE | All gates | — | Trusted synthesis output |

**Wave rules:**
- Each wave must complete synthesis before the next wave starts
- Wave N+1 scope is informed by Wave N gaps
- Final wave includes pre-gatekeeping before GATE
