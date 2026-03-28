# Substantive Skills Expansion Plan

**Plan ID:** substantive-expansion-plan-2026-03-29
**Created:** 2026-03-29
**Status:** validated
**Estimated Batches:** 6
**Estimated Total New Lines:** ~8,400
**Estimated Total New Files:** 42
**Estimated Total Modified Files:** 18

---

## Goal

Transform 18 structurally-compliant but substantively-empty SKILL.md files into executable, tool-referenced, template-rich, decision-matrix-driven skill packages that an agent can execute without asking clarifying questions. Every skill must SHOW HOW — concrete tool names, bash commands, MCP integration, fill-in templates, decision trees with IF/THEN conditions, and measurable success criteria.

## Evidence Sources

| Source | Path | Key Findings |
|--------|------|-------------|
| Skills Depth Audit | `.hivemind/activity/agents/hivexplorer/skills-depth-audit-2026-03-29.md` | 0/18 EXECUTABLE across all 8 dimensions; top score 7/10; 13 skills have zero bash commands |
| Activity Folder Forensics | `.hivemind/activity/agents/hivexplorer/activity-forensics-2026-03-29/investigation-report.md` | 178 files, 60% without date stamps, 2,915 mislabeled error logs, ghost directories |
| OpenCode Tool Ecosystem | `.hivemind/activity/agents/hiverd/opencode-tool-ecosystem-2026-03-29.md` | 14 built-in tools with use-case matrix, 20 decision scenarios, LSP deep-dive |
| MCP Capabilities Catalog | `.hivemind/activity/agents/hiverd/mcp-capabilities-catalog-2026-03-29.md` | 14 servers, 60+ tools, rate limits, fallback chains for web/content/docs/code |
| External Repos Synthesis | `.hivemind/activity/agents/hiverd/external-repos-synthesis-2026-03-29.md` | 20 gaps vs HiveMind, 7 integration recommendations, vocabulary-first research |
| User Feedback | `.developing-skills/users-prompting/feed-back-creation-of-hivemind-synthesis.md` | "Horrendous and shallow" — must show HOW, not describe WHAT |
| Skill Design Principles | `.developing-skills/skills-essential-knowledge.md` | Progressive disclosure, imperative form, expert knowledge delta |

---

## Cross-Cutting Specifications (ALL batches MUST comply)

### CS-1: OpenCode Built-In Tool Matrix

Every skill that involves reading, searching, or writing must include this adapted table:

```markdown
## OpenCode Tool Selection

| Task | Primary Tool | Fallback | Never Use |
|------|-------------|----------|-----------|
| Find files by pattern | `glob { "pattern": "**/*.ts" }` | `list` then manual | `grep` (content tool) |
| Search content across files | `grep { "pattern": "regex", "include": "*.ts" }` | `bash` + `rg` | `read` (too slow) |
| Read file section | `read { "filePath": "path", "offset": N, "limit": N }` | `bash` + `sed` | `grep` (no line range) |
| Edit specific text | `edit { "filePath": "path", "oldString": "...", "newString": "..." }` | `write` (full overwrite) | `patch` (overkill) |
| Create new file | `write { "content": "...", "filePath": "path" }` | — | `edit` (needs existing) |
| Run commands | `bash { "command": "npm test" }` | — | Any other tool |
| Find symbol definition | `lsp { "operation": "goToDefinition", ... }` | `grep` (less precise) | `read` (scanning blind) |
| Find all usages | `lsp { "operation": "findReferences", ... }` | `grep` (broader) | `read` (scanning blind) |
```

### CS-2: MCP Integration Protocol

Every skill that involves research or external data must include:

```markdown
## MCP Tool Priority Order

| Priority | Server | Rate Limit | Use Case |
|----------|--------|-----------|----------|
| 1 (free) | Deepwiki `deepwiki_ask_question` | No auth, unlimited | Public repo docs/Q&A |
| 2 (rate-limited) | Context7 `context7_resolve-library-id` → `context7_query-docs` | 60 req/hr free | Library-specific docs |
| 3 (credit-based) | Tavily `tavily_tavily_search` / `tavily_tavily_extract` | 1000 credits/mo free | General web + extraction |
| 4 (paid semantic) | Exa `exa_web_search_exa` | 10 QPS, $7/1k | Semantic/discovery search |
| 5 (paid real-time) | Brave `brave-search_brave_web_search` | 50 QPS, $5/1k | Real-time/news search |
| 6 (local) | Repomix `repomix_pack_codebase` | No external limits | Local codebase packing |
```

### CS-3: Activity Pathing Protocol

Every skill that produces artifacts must use:

- **Filename format:** `{category}-{semantic-id}-{YYYY-MM-DD}[-{variant}].{ext}`
- **ISO 8601 timestamps:** `YYYY-MM-DDTHH-mm-ssZ`
- **_meta in all JSON:** `{ "created_at": "ISO8601", "updated_at": "ISO8601", "producer": "{skill_name}" }`
- **Output paths:** Declared in SKILL.md `Storage` section with exact pattern

### CS-4: Minimum 1 Fill-in Template

Every skill must ship at least 1 fill-in template with:
- Field names with types
- Example filled values
- Schema description

### CS-5: Minimum 3 Bash Examples

Every skill must include at least 3 concrete bash command examples with:
- Full command syntax
- Expected output format
- Error conditions

### CS-6: Minimum 1 Decision Tree

Every skill must include at least 1 IF/THEN decision tree with:
- Concrete conditions (file paths, tool names, exit codes)
- Fallback routes
- Terminal states

---

## BATCH 1: Research Package

**Priority:** CRITICAL (weakest skill per user feedback)
**Skills Affected:** `use-hivemind-research`
**Target Agent:** hivemaker

### Batch Scope

Transform `use-hivemind-research` from a 167-line conceptual router into a complete executable research pipeline with MCP integration, templates, workflows, depth scaling, and vocabulary-first methodology.

### Files to CREATE

| # | File | Lines (est.) | Content Outline |
|---|------|-------------|-----------------|
| 1 | `references/mcp-tool-protocols.md` | 300 | Per-server function signatures with parameters, rate limits, fallback chains. Context7: `resolve-library-id(query, libraryName)` → `query-docs(libraryId, query)`. Tavily: `tavily_search(query, max_results, search_depth)` → `tavily_extract(urls)`. Exa: `web_search_exa(query, numResults)` → `crawling_exa(urls)`. Deepwiki: `ask_question(repoName, question)`. Repomix: `pack_codebase(directory)` → `grep_repomix_output(outputId, pattern)`. Brave: `brave_web_search(query, count)`. Full fallback chains per scenario. |
| 2 | `references/research-classification.md` | 250 | 4-mode depth scaling (Quick/Standard/Deep/UltraDeep) with time budgets, source count thresholds, and credibility floors. Decision-stakes calibration matrix. R0-R7 diagnostic state machine. Research type taxonomy (technology-eval, codebase-investigation, cross-stack-analysis, greenfield-spec, brownfield-trace). |
| 3 | `references/vocabulary-discovery.md` | 150 | Phase 1 vocabulary-first methodology from jwynia/agent-skills. Expert vs outsider term mapping. Cross-domain synonym table template. 5-step terminology expansion process. |
| 4 | `references/cross-stack-workflow.md` | 200 | Greenfield workflow: User intent → spec → broad MCP search → framework validation → dependency research. Brownfield workflow: package.json → README validation → version-traced dependency graph → MCP research. MCP chaining protocol: Exa → Tavily → Brave → Repomix → Deepwiki → Context7 with rate limiting between calls. |
| 5 | `references/evidence-contract.md` | 150 | Evidence grading schema (HIGH/MEDIUM/LOW). Source credibility scoring (0-100) with domain authority, recency, expertise, bias components. Claims-evidence table format. Return contract JSON schema for research packets. |
| 6 | `templates/research-packet.json` | 80 | Fill-in template with: mode, depth, topic, stakeholders, domains, controversies, vocabulary_map, search_queries (primary + counter-perspective), mcp_tool_chain, evidence_thresholds, stop_conditions, output_path. |
| 7 | `templates/claims-evidence-table.md` | 60 | Markdown template: Claim # | Claim Text | Evidence Quote | Source URL | Source Title | Credibility Score | Confidence Level. |
| 8 | `scripts/hm-research-validate.sh` | 80 | Bash script: validates research output JSON for _meta, date stamps, evidence count ≥ threshold, credibility scoring present, no placeholder text. Returns exit code 0/1 with diagnostic output. |

### Sections to ADD to SKILL.md

| Section | Lines (est.) | Content |
|---------|-------------|---------|
| OpenCode Tool Matrix | 15 | Tool selection table (CS-1) adapted for research |
| MCP Priority Table | 15 | MCP tool priority order (CS-2) |
| 4-Mode Depth Workflow | 40 | Quick → Standard → Deep → UltraDeep with time budgets, source thresholds, phase gates |
| Vocabulary Discovery Phase | 25 | Phase 0.5 expert terminology extraction before deep search |
| Counter-Perspective Protocol | 20 | Explicit adversarial search with exclusion terms |
| Bash Examples (5) | 35 | `context7_resolve-library-id`, `deepwiki_ask_question`, `tavily_tavily_search`, `exa_web_search_exa`, `repomix_pack_codebase` |
| Decision Tree: Research Type → Tool Chain | 25 | IF technology-eval → Context7 + Deepwiki. IF cross-stack → Repomix + Exa. IF brownfield → Tavily + Context7. |
| Cross-Skill Chaining | 15 | Loads `use-hivemind-delegation` for multi-packet research. Loads `hivemind-synthesis` for evidence assembly. |
| Metrics & Verification | 15 | Source count thresholds per mode. Average credibility floor. Claims-evidence coverage %. Placeholder text detection. |
| Template References | 10 | Pointers to `templates/` with load conditions |

**SKILL.md net addition:** ~215 lines (from 167 → ~380)

### Tool Integration Specifics

**OpenCode Built-in:**
- `glob { "pattern": "package.json" }` — locate dependency manifests for brownfield analysis
- `grep { "pattern": "from ['\"]@", "include": "*.ts" }` — extract import dependencies
- `read { "filePath": "README.md", "limit": 50 }` — validate documentation freshness
- `bash { "command": "npm ls --depth=0 2>/dev/null" }` — list installed dependencies

**MCP Tools (with fallback chains):**
1. Context7: `resolve-library-id(query="zod", libraryName="zod")` → `query-docs(libraryId="/colinhacks/zod", query="schema validation")`
   - Rate: 60 req/hr free. Fallback: Tavily Skill
2. Deepwiki: `ask_question(repoName="colinhacks/zod", question="How does z.infer work?")`
   - Rate: unlimited free. Fallback: Repomix pack remote
3. Tavily: `tavily_search(query="zod v4 migration guide 2026", max_results=5, search_depth="advanced")` → `tavily_extract(urls=[...])`
   - Rate: 1000 credits/mo. Fallback: Exa
4. Exa: `web_search_exa(query="zod schema validation patterns TypeScript", numResults=5)` → `crawling_exa(urls=[...])`
   - Rate: 10 QPS. Fallback: Brave
5. Brave: `brave_web_search(query="zod v4 release notes", count=5)`
   - Rate: 50 QPS. Fallback: Google
6. Repomix: `pack_remote_repository(remote="colinhacks/zod", includePatterns="src/**")` → `grep_repomix_output(outputId, pattern="export function")`

### Decision Matrix

```
RESEARCH TYPE?
├── technology-eval (compare X vs Y)
│   ├── Need library docs? → Context7 resolve → query-docs
│   ├── Need repo analysis? → Deepwiki ask_question OR Repomix pack_remote
│   ├── Need community opinion? → Exa web_search + Tavily search
│   └── Need version currency? → Tavily search (freshness: "month") + Brave news
├── codebase-investigation (local analysis)
│   ├── Structure? → glob + list + read
│   ├── References? → grep + lsp findReferences
│   └── Full analysis? → Repomix pack_codebase → grep_repomix_output
├── cross-stack-analysis (multi-dependency)
│   ├── Package scan? → bash "npm ls" → grep imports → Context7 per dep
│   ├── Repo deep-dive? → Repomix per repo → synthesis
│   └── Compatibility? → Deepwiki ask_question per dep + version check
├── greenfield-spec (new project)
│   ├── Broad landscape? → Exa web_search (semantic) → Tavily extract
│   ├── Framework docs? → Context7 → Deepwiki
│   └── Architecture patterns? → Exa get_code_context + Brave search
└── brownfield-trace (existing project)
    ├── Validate docs? → read README → bash "npm ls" → compare versions
    ├── Trace deps? → grep imports → Context7 per dep → Deepwiki
    └── Find issues? → Tavily search (errors/patterns) → Exa semantic
```

### Metrics & Verification

| Metric | Quick | Standard | Deep | UltraDeep |
|--------|-------|----------|------|-----------|
| Min sources | 5 | 10 | 15 | 25 |
| Avg credibility floor | 50 | 60 | 70 | 75 |
| Time budget | 3 min | 8 min | 15 min | 30 min |
| Claims-evidence coverage | 50% | 75% | 90% | 95% |
| Counter-perspective queries | 0 | 1 | 2 | 3+ |

**Verification:** `bash scripts/hm-research-validate.sh {output_path}` returns exit 0.

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 8 |
| Files to modify | 1 (SKILL.md) |
| New lines (references) | 1,050 |
| New lines (templates) | 140 |
| New lines (scripts) | 80 |
| New lines (SKILL.md additions) | 215 |
| **Total new lines** | **~1,485** |

---

## BATCH 2: Synthesis Package

**Priority:** HIGH
**Skills Affected:** `hivemind-synthesis`
**Target Agent:** hivemaker

### Batch Scope

Transform `hivemind-synthesis` from a 318-line conceptual pipeline into a complete synthesis engine with claims-evidence tables, source credibility scoring, progressive assembly, and counterevidence registers.

### Files to CREATE

| # | File | Lines (est.) | Content Outline |
|---|------|-------------|-----------------|
| 1 | `references/claims-evidence-framework.md` | 250 | Claims-evidence table schema. Per-claim confidence assignment (HIGH/MEDIUM/LOW). Counterevidence register format. Novel insights section template. Diminishing-returns detection signals. Triangulation protocol (3+ sources per core claim). |
| 2 | `references/source-credibility-scoring.md` | 200 | 0-100 composite scoring: domain authority (35%), recency (20%), expertise (25%), bias (20%). HIGH_AUTHORITY_DOMAINS list (arxiv, nature, IEEE, gov, official docs). MODERATE_AUTHORITY_DOMAINS (tech news, industry). LOW_AUTHORITY_INDICATORS (blogspot, wordpress, subdomains). Scoring algorithm with examples. |
| 3 | `references/progressive-assembly.md` | 180 | Section-by-section generation strategy. Report auto-continuation for >18K words. Disk-persisted citations survive context compaction. Anti-truncation rules. Outline refinement with evidence-driven adaptation. |
| 4 | `references/synthesis-validation.md` | 150 | 9 automated quality checks: section presence, citation formatting, bibliography completeness, placeholder detection, word count, source count, internal links, credibility scoring present, counterevidence present. Validation loop protocol (max 3 cycles). |
| 5 | `templates/claims-evidence-table.json` | 60 | JSON template: `{ claims: [{ id, claim_text, evidence: [{ quote, source_url, source_title, credibility_score, confidence }], counter_evidence: [...], verdict }] }` |
| 6 | `templates/synthesis-report.md` | 100 | Markdown template: Executive Summary, Main Analysis (findings with claims-evidence), Counterevidence Register, Novel Insights, Recommendations, Bibliography, Methodology Appendix. |
| 7 | `scripts/hm-synthesis-validate.sh` | 90 | Validates synthesis output: checks section presence, citation format, source count ≥10, no placeholders, credibility scores present, claims have ≥1 evidence. Returns exit 0/1 with diagnostics. |

### Sections to ADD to SKILL.md

| Section | Lines (est.) | Content |
|---------|-------------|---------|
| OpenCode Tool Matrix | 15 | Tool selection table for synthesis operations |
| MCP Tool Usage in Synthesis | 20 | When to use which MCP for synthesis input gathering |
| Claims-Evidence Protocol | 30 | How to build claims-evidence tables during synthesis |
| Source Credibility Scoring | 25 | Quick-reference scoring algorithm with examples |
| Progressive Assembly Strategy | 20 | Section-by-section generation with disk persistence |
| Bash Examples (5) | 35 | `repomix_pack_codebase`, `repomix_grep_repomix_output`, `context7_query-docs`, `tavily_tavily_extract`, `deepwiki_ask_question` |
| Decision Tree: Synthesis Type → Output Format | 20 | IF codebase-analysis → Repomix pack → grep → claims table. IF literature-review → Exa/Tavily search → evidence table. IF multi-source → all MCP → triangulated claims. |
| Cross-Skill Chaining | 15 | Loads `use-hivemind-research` for evidence gathering. Loads `hivemind-gatekeeping` for synthesis gates. |
| Metrics & Verification | 15 | Validation checks, source count, credibility floor, claims coverage. |

**SKILL.md net addition:** ~195 lines (from 318 → ~510, but with content moved to references, net SKILL.md stays ~380)

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 7 |
| Files to modify | 1 |
| New lines (references) | 780 |
| New lines (templates) | 160 |
| New lines (scripts) | 90 |
| New lines (SKILL.md additions) | 195 |
| **Total new lines** | **~1,225** |

---

## BATCH 3: Delegation Package

**Priority:** HIGH
**Skills Affected:** `use-hivemind-delegation`
**Target Agent:** hivemaker

### Batch Scope

Transform `use-hivemind-delegation` from a 410-line conceptual protocol into a complete multi-packet delegation system with structured evidence returns, cross-domain multi-subagent support, and hierarchical JSON/schema configuration.

### Files to CREATE

| # | File | Lines (est.) | Content Outline |
|---|------|-------------|-----------------|
| 1 | `references/multi-packet-protocol.md` | 250 | Cross-domain multi-packet delegation for full-stack analysis. Hierarchical JSON schema for investigation results (domain → slice → finding). TOC/jump-reading support. Offset-reading for large results. Metadata grep for date/producer filtering. Chained delegation packets for sequential investigation. |
| 2 | `references/evidence-return-schema.md` | 200 | Structured evidence object: `{ claim, evidence_quote, source_url, source_title, confidence }`. Return contract per agent type. JSON schema for hivexplorer, hiverd, hiveq, hivemaker returns. Schema validation at ingestion. |
| 3 | `references/cross-domain-coordination.md` | 200 | Sequential vs parallel decision matrix. Shared-state detection. Merge-by-synthesis protocol. Cognitive limits in delegation (7±2 items, 15-20 files). Delta-query specification for gap-filling. |
| 4 | `templates/delegation-packet.json` | 70 | Complete fill-in template: target_agent, scope, context, constraints, expected_return (with evidence schema), output_path, parent_packet_id. |
| 5 | `templates/multi-domain-investigation.json` | 80 | Hierarchical schema: `{ investigation_id, domains: [{ name, slices: [{ id, agent, status, findings, evidence_refs }] }], cross_domain_claims, synthesis_queue }` |
| 6 | `templates/evidence-return.json` | 50 | Fill-in template for agent returns: `{ status, evidence: [{ claim, quote, source, confidence }], blocked_routes, recommended_next }` |
| 7 | `scripts/hm-packet-validate.sh` | 70 | Validates delegation packet JSON: required fields, agent exists, scope bounded, return contract specified. Validates return evidence: claim-evidence pairs present, confidence scored. |

### Sections to ADD to SKILL.md

| Section | Lines (est.) | Content |
|---------|-------------|---------|
| OpenCode Tool Matrix | 15 | Tool selection for delegation operations |
| Multi-Packet Protocol | 30 | How to decompose full-stack investigation into parallel packets |
| Evidence Return Contract | 25 | Structured evidence schema for all agent returns |
| Cross-Domain Coordination | 25 | When sequential vs parallel, shared-state detection |
| Bash Examples (5) | 35 | `cat .hivemind/activity/delegation/packet.json | jq '.scope'`, `ls .hivemind/activity/agents/*/`, `grep -r "blocked_routes" .hivemind/activity/`, `jq '._meta.producer' .hivemind/activity/**/*.json`, `find .hivemind/activity -name "*.json" -mtime -1` |
| Decision Tree: Delegation Pattern | 25 | IF single-domain → single packet. IF cross-domain → multi-packet parallel. IF deep investigation → chained sequential packets with synthesis checkpoints. IF context-sensitive → delta-queries. |
| Cross-Skill Chaining | 15 | Loads `use-hivemind-research` for investigation packets. Loads `hivemind-gatekeeping` for return validation. |
| Metrics & Verification | 10 | Packet completeness, evidence return rate, blocked route tracking. |

**SKILL.md net addition:** ~180 lines

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 7 |
| Files to modify | 1 |
| New lines (references) | 650 |
| New lines (templates) | 200 |
| New lines (scripts) | 70 |
| New lines (SKILL.md additions) | 180 |
| **Total new lines** | **~1,100** |

---

## BATCH 4: Refactor Package

**Priority:** HIGH
**Skills Affected:** `hivemind-refactor`
**Target Agent:** hivemaker

### Batch Scope

Transform `hivemind-refactor` from a 353-line process guide into a complete refactor engine with code review checklists using concrete tool references, refactor technique catalog with LSP integration, and automated verification scripts.

### Files to CREATE

| # | File | Lines (est.) | Content Outline |
|---|------|-------------|-----------------|
| 1 | `references/refactor-techniques-catalog.md` | 300 | 9 refactor techniques with BEFORE/AFTER TypeScript code: Extract Function, Inline, Move, Rename, Collapse Hierarchy, Extract Interface, Replace Magic Number, Introduce Parameter Object, Replace Conditional with Polymorphism. Risk levels, test impact, rollback ease per technique. |
| 2 | `references/code-review-checklist.md` | 250 | Checklist with concrete tool references: `lsp findReferences` for impact analysis, `grep` for pattern detection, `npx tsc --noEmit` for type safety, `npm test` for regression. Per-item: what to check, which tool, expected output, pass condition. |
| 3 | `references/lsp-refactor-workflows.md` | 150 | LSP-based refactor workflows: goToDefinition for dependency tracing, findReferences for impact analysis, prepareCallHierarchy + incomingCalls for dead code detection, documentSymbol for structure analysis. Commands with file/position examples. |
| 4 | `templates/refactor-checklist.json` | 60 | `{ technique, risk_level, files_affected, references_found, tests_impact, rollback_plan, verification_commands }` |
| 5 | `templates/refactor-session.json` | 50 | `{ refactor_id, target_files, technique, before_snapshot, steps: [{ action, tool, command, expected }], after_snapshot, verification_result }` |
| 6 | `scripts/hm-refactor-verify.sh` | 80 | Pre-refactor snapshot (git diff --stat), post-refactor verification (tsc, test, lint, build), regression detection, rollback command generation. |

### Sections to ADD to SKILL.md

| Section | Lines (est.) | Content |
|---------|-------------|---------|
| OpenCode Tool Matrix for Refactoring | 20 | Tool selection adapted for refactor operations (lsp, grep, read, edit, bash) |
| LSP Integration for Refactoring | 25 | When to use lsp goToDefinition, findReferences, callHierarchy during refactor |
| Code Review Checklist Reference | 15 | Pointer to `references/code-review-checklist.md` with load conditions |
| Bash Examples (5) | 35 | `npx tsc --noEmit 2>&1`, `npm test 2>&1 | tail -5`, `git diff --stat`, `git checkout -- <files>`, `lsp { operation: "findReferences" }` |
| Decision Tree: Refactor Technique Selection | 25 | IF god function → Extract Function. IF scattered parameters → Introduce Parameter Object. IF type switch → Replace Conditional with Polymorphism. IF dead code → lsp incomingCalls (0 incoming = orphan). |
| Cross-Skill Chaining | 10 | Loads `hivemind-gatekeeping` for verification gates. Loads `use-hivemind-tdd` for red-green-refactor cycles. |
| Metrics & Verification | 10 | Pre/post snapshot, test regression count, type error delta, lint warning delta. |

**SKILL.md net addition:** ~140 lines

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 6 |
| Files to modify | 1 |
| New lines (references) | 700 |
| New lines (templates) | 110 |
| New lines (scripts) | 80 |
| New lines (SKILL.md additions) | 140 |
| **Total new lines** | **~1,030** |

---

## BATCH 5: Activity Folder Protocol

**Priority:** HIGH (cross-cutting)
**Skills Affected:** ALL skills that produce artifacts
**Target Agent:** hivemaker

### Batch Scope

Create a governance protocol for the `.hivemind/activity/` folder that enforces naming conventions, _meta schemas, producer attribution, and pathing registry. Create a shared reference that ALL skills can import.

### Files to CREATE

| # | File | Lines (est.) | Content Outline |
|---|------|-------------|-----------------|
| 1 | `.hivemind/activity/PROTOCOL.md` | 150 | Canonical activity folder protocol: naming (`{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`), timestamps (ISO 8601), _meta schema (`created_at`, `updated_at`, `producer`, `producer_version`, `parent_packet_id`), hierarchy map, producer attribution table. |
| 2 | `.hivemind/pathing/active-paths.json` | 30 | Path registry mapping activity categories to resolved paths. `{ "plans": ".hivemind/activity/plans/", "delegation": ".hivemind/activity/delegation/", ... }` |
| 3 | `shared/references/activity-pathing-protocol.md` | 200 | Reference file for all skills to import. Full naming protocol, _meta schema, producer attribution, ghost directory prevention, JSON validation rules, cleanup procedures. |
| 4 | `shared/templates/artifact-meta.json` | 20 | Canonical _meta template: `{ "_meta": { "created_at": "ISO8601", "updated_at": "ISO8601", "producer": "string", "producer_version": "string", "parent_packet_id": "string?" } }` |
| 5 | `shared/scripts/hm-artifact-validate.sh` | 60 | Validates any activity artifact: filename has date, JSON has _meta with created_at+updated_at, producer field present, path matches active-paths.json. |
| 6 | `shared/scripts/hm-artifact-create.sh` | 50 | Creates activity artifact with auto-populated _meta: takes category, semantic-id, producer as args; generates filename with date; writes _meta; creates parent dirs. |

**Location:** Files 3-6 go into a shared location that all skills reference. Since HiveMind skills are in `.developing-skills/refactored-skills/`, the shared location should be `.developing-skills/shared-refs/`.

### Sections to ADD to EVERY SKILL.md (cross-cutting)

Each skill's SKILL.md gets a 15-line `Activity Output` section referencing the shared protocol:

```markdown
## Activity Output

All artifacts produced by this skill follow the Activity Folder Protocol.

**Pathing:** See `.hivemind/pathing/active-paths.json` for resolved output paths.
**Naming:** `{category}-{semantic-id}-{YYYY-MM-DD}.{ext}`
**Meta:** All JSON includes `_meta.created_at`, `_meta.updated_at`, `_meta.producer`.
**Validation:** `bash scripts/hm-artifact-validate.sh {path}` confirms compliance.
```

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 6 |
| Files to modify | 18 (all SKILL.md files get 15-line activity output section) |
| New lines (protocol + reference) | 380 |
| New lines (templates) | 20 |
| New lines (scripts) | 110 |
| New lines (SKILL.md additions × 18) | 270 |
| **Total new lines** | **~780** |

---

## BATCH 6: Remaining Skills

**Priority:** MEDIUM
**Skills Affected:** `hivemind-execution`, `hivemind-architecture`, `hivemind-patterns`, `hivemind-codemap`, `hivemind-system-debug`, `hivemind-spec-driven`, `use-hivemind-planning`, `use-hivemind-tdd`, `use-hivemind-context`, `use-hivemind-git-memory`, `hivemind-gatekeeping`, `use-hivemind-skill-authoring`, `hivemind-atomic-commit`, `use-hivemind`
**Target Agent:** hivemaker

### Batch Scope

Bring the remaining 14 skills up to the minimum executable bar: 3+ bash examples, 1+ decision tree, 1+ template, OpenCode tool matrix, MCP integration where relevant, activity output section.

### Per-Skill Additions Summary

| Skill | Current Score | New Files | New Ref Lines | SKILL Additions | Key Additions |
|-------|-------------|-----------|---------------|----------------|---------------|
| `hivemind-execution` | 6/10 | 1 template | 50 | 80 | Quality gate template, 3 bash examples, decision tree for gate failure |
| `hivemind-architecture` | 2/10 | 2 references + 1 template | 300 | 120 | Pattern selection reference, ADR template, tool matrix, 3 bash examples |
| `hivemind-patterns` | 1/10 | 1 reference + 1 template | 250 | 100 | Pattern catalog with code examples, selection decision tree, tool matrix |
| `hivemind-codemap` | 6/10 | 1 reference + 1 template | 150 | 80 | LSP integration for code mapping, scan plan template, MCP for remote repos |
| `hivemind-system-debug` | 1/10 | 2 references + 1 template | 250 | 120 | Debug workflow reference, diagnosis template, tool matrix, 3 bash examples |
| `hivemind-spec-driven` | 3/10 | 1 template | 50 | 80 | Spec candidate template enhancement, tool matrix, 3 bash examples |
| `use-hivemind-planning` | 5/10 | 1 reference | 100 | 80 | Dependency analysis reference, 3 bash examples, MCP for external research |
| `use-hivemind-tdd` | 7/10 | 0 | 0 | 50 | Cross-skill chaining, MCP integration for test patterns |
| `use-hivemind-context` | 3/10 | 1 reference | 100 | 80 | Freshness probe reference, concrete git commands, 3 bash examples |
| `use-hivemind-git-memory` | 4/10 | 1 reference | 100 | 80 | Git command reference with actual commands, 3 bash examples |
| `hivemind-gatekeeping` | 7/10 | 0 | 0 | 50 | MCP integration for external verification, cross-skill chaining |
| `use-hivemind-skill-authoring` | 2/10 | 1 reference | 150 | 100 | Audit checklist with tool references, 3 bash examples, template |
| `hivemind-atomic-commit` | 3/10 | 1 reference | 100 | 80 | Git gate reference with actual scripts, 3 bash examples, template |
| `use-hivemind` | 3/10 | 0 | 0 | 60 | Tool matrix, MCP priority, bash examples for session entry |

### Estimated Effort

| Metric | Count |
|--------|-------|
| Files to create | 15 |
| Files to modify | 14 |
| New lines (references) | 1,550 |
| New lines (templates) | 200 |
| New lines (scripts) | 0 |
| New lines (SKILL.md additions) | 1,180 |
| **Total new lines** | **~2,930** |

---

## Dependency Graph

```
BATCH 5 (Activity Protocol) ←── MUST COMPLETE FIRST
  │
  ├── BATCH 1 (Research) ←── can start after BATCH 5
  ├── BATCH 2 (Synthesis) ←── depends on BATCH 1 (uses research output format)
  ├── BATCH 3 (Delegation) ←── can start after BATCH 5
  ├── BATCH 4 (Refactor) ←── can start after BATCH 5
  │
  └── BATCH 6 (Remaining) ←── depends on BATCH 5 (activity output section)
        └── Within BATCH 6, all skills are independent
```

### Parallel Opportunities

- BATCH 1 + BATCH 3 + BATCH 4 can run in parallel after BATCH 5
- BATCH 2 must wait for BATCH 1 (shares evidence format)
- BATCH 6 can run in parallel with BATCH 1-4 (only needs BATCH 5)

### Critical Path

```
BATCH 5 → BATCH 1 → BATCH 2 (longest chain)
```

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| SKILL.md exceeds 500 lines | HIGH for BATCH 1,2 | MEDIUM | Move detailed content to references/; keep SKILL.md as lean router |
| MCP tool function signatures change | LOW | LOW | References documented with source URLs and access dates |
| Cross-skill conflicts (two skills define same template) | MEDIUM | HIGH | Use skill-specific namespaces: `research-packet.json`, `delegation-packet.json` |
| Bash scripts not portable (macOS vs Linux) | LOW | LOW | Use POSIX-compatible commands; test on macOS (dev env) |
| Reference files too large (>10k words) | MEDIUM | MEDIUM | Include grep search patterns in SKILL.md for large references |
| Existing skill content conflicts with new additions | MEDIUM | MEDIUM | New content is ADDITIVE — never modify existing sections, only append new sections |

---

## Architect Decisions Needed

| Decision | Context | Urgency |
|----------|---------|---------|
| Shared references location | Where do shared protocol files live? `.developing-skills/shared-refs/` or per-skill? | Before BATCH 5 |
| SKILL.md line budget | Max 500 lines per SKILL.md? What if references are insufficient? | Before any batch |
| Script execution environment | Should scripts assume bash 3+ (macOS) or bash 4+ (Linux)? | Before BATCH 5 |
| Template format standard | JSON templates or Markdown templates? Or both per use case? | Before BATCH 1 |

---

## Verification Gate

Before returning this plan:

- [x] Every batch has a target agent (hivemaker)
- [x] Every batch has verifiable success criteria (file count, line count, tool references)
- [x] Dependencies are correctly sequenced (BATCH 5 first)
- [x] Each batch is independently deliverable (no cross-batch dependencies within a batch)
- [x] No circular dependencies
- [x] All 18 skills covered across batches
- [x] All 5 evidence sources consulted
- [x] Cross-cutting specs defined for all batches
- [x] Activity output section planned for every skill

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Batches | 6 |
| Total New Files | 42 |
| Total Modified Files | 18 |
| Total New Lines (estimated) | ~8,550 |
| Batch 1 (Research) | 9 files, ~1,485 lines |
| Batch 2 (Synthesis) | 8 files, ~1,225 lines |
| Batch 3 (Delegation) | 8 files, ~1,100 lines |
| Batch 4 (Refactor) | 7 files, ~1,030 lines |
| Batch 5 (Activity Protocol) | 24 files (6 new + 18 modified), ~780 lines |
| Batch 6 (Remaining) | 29 files (15 new + 14 modified), ~2,930 lines |
| Blocked Routes | 0 |
| Recommended Next Action | Execute BATCH 5 first (Activity Protocol), then dispatch BATCH 1, 3, 4 in parallel |

---

*Plan created by hiveplanner — Terminal Planning Specialist*
*Plan ID: substantive-expansion-plan-2026-03-29*
