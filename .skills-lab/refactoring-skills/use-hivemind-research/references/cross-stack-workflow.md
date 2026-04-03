# Cross-Stack Workflow

Cross-stack research must sequence broad discovery, official validation, and local truth in a controlled order. Do not parallelize rate-limited providers inside one packet.

## Governing Rules

1. Start with the **question shape**: greenfield or brownfield.
2. Run **vocabulary discovery** before external search.
3. Use **broad discovery** before deep validation.
4. Use **official docs** before community summaries.
5. End with **local code truth** for brownfield work.

## Greenfield Workflow

### Goal

Turn user intent into a spec-backed research recommendation without being biased by one familiar stack.

### Sequence

1. Capture user intent, stakeholders, and constraints.
2. Convert intent into a first-pass spec question set.
3. Run vocabulary discovery to produce expert terms and exclusions.
4. Run broad MCP search:
   - `exa_web_search_exa` for semantic landscape
   - `tavily_tavily_search` for extractable evidence
   - `brave-search_brave_web_search` only for current-state confirmation
5. Validate shortlisted frameworks with:
   - `context7_resolve-library-id`
   - `context7_query-docs`
   - `deepwiki_ask_question` for public repo behavior
6. Research key dependencies and integration risks.
7. Package findings into a claims-evidence table and stop when mode thresholds are met.

### Greenfield Evidence Mix

- official docs
- repository docs or Deepwiki answers
- ecosystem articles or migration notes
- at least one counter-perspective query for Standard+

## Brownfield Workflow

### Goal

Explain the current system before recommending change.

### Sequence

1. Read `package.json`, lockfiles, and workspace manifests.
2. Validate README freshness against actual versions and scripts.
3. Build a version-traced dependency graph from:
   - `npm ls --depth=0`
   - import search (`grep` / `rg`)
   - direct manifest reads
4. Run vocabulary discovery from local dependency names and error strings.
5. Validate each important dependency with Context7.
6. Ask Deepwiki or pack with Repomix when upstream repo behavior matters.
7. Search the web only after official/local mismatch or unresolved gaps appear.
8. Package local truth, upstream guidance, and known uncertainty separately.

### Brownfield Evidence Mix

- local manifests and imports
- official version-specific docs
- upstream repository answers
- targeted web evidence for known bugs, migrations, or deprecations

## MCP Chaining Protocol

### Preferred Order

1. `exa_web_search_exa` or `tavily_tavily_search` for broad discovery
2. `brave-search_brave_web_search` only for freshness or mainstream coverage
3. `deepwiki_ask_question` for public repo understanding
4. `repomix_pack_codebase` or `repomix_pack_remote_repository` for code truth
5. `context7_resolve-library-id` → `context7_query-docs` for version-specific validation

### Why This Order

- Discovery providers help decide **what** matters.
- Repo/code providers help decide **how it actually works**.
- Context7 helps confirm **what the official surface says now**.

## Rate-Limit Discipline

Never parallelize these within the same packet when rate pressure is possible:

- Context7 free-tier calls
- Tavily advanced/research calls
- GitHub-heavy repo APIs

### Safe Sequencing Pattern

1. Resolve all package names locally.
2. Resolve Context7 IDs once.
3. Run the smallest number of Context7 doc queries needed.
4. Run Tavily extract only on shortlisted URLs.
5. Reserve Brave as the last web fallback.

## Fallback Routes

| Scenario | Primary | Fallback 1 | Fallback 2 |
|---|---|---|---|
| Library docs | Context7 | Tavily Skill | official docs via `webfetch` |
| Public repo behavior | Deepwiki | Repomix remote | GitHub code search |
| Broad semantic discovery | Exa | Tavily | Brave |
| Extracted page content | Tavily Extract | Exa Crawling | Fetch/Webfetch |
| Local code truth | Repomix local | `glob` + `grep` + `read` | manual narrow reads |

## Stopping Rules

- Stop adding new providers when the next provider would only repeat already confirmed claims.
- Stop broad search once mode source thresholds are met and only validation gaps remain.
- Stop official-doc loops after one fallback if the issue is clearly local-code-specific.

## Deliverable Fields

Every cross-stack packet should emit:

- `primary_type`
- `vocabulary_map`
- `search_queries.primary`
- `search_queries.counter_perspective`
- `mcp_tool_chain`
- `claims`
- `evidence`
- `blocked_routes`

## Anti-Patterns

- Starting with community blogs before identifying versions
- Treating README text as fresher than manifests and lockfiles
- Querying every provider with the same raw phrase
- Running rate-limited providers in parallel because it "seems faster"
