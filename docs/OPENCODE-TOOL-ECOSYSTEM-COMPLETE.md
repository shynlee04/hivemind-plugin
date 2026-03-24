# OpenCode Tool Ecosystem — Complete Reference

**Date**: 2026-03-23  
**Scope**: Every tool available to OpenCode agents — built-in, MCP servers, custom HiveMind tools, verification commands, and git operations.

---

## 1. Built-in OpenCode Tools

These are native to the OpenCode runtime and available to ALL agents.

| Tool | Purpose | Limitations | When to Use |
|------|---------|-------------|-------------|
| **Read** | Read file contents from workspace | Max ~2000 lines per call; no binary files | Before any file inspection; understanding code context |
| **Write** | Create new files or overwrite existing | Must use Read first for existing files; no partial writes | Creating new files, reports, artifacts |
| **Edit** | Surgical string replacement in files | Must use Read first; exact string match required; no regex | Modifying existing code, fixing bugs, refactoring |
| **Bash** | Execute shell commands | No TTY; timeout 120s default; no interactive prompts | Git operations, builds, tests, system commands |
| **Grep** | Content search using regex patterns | Case-sensitive by default; searches file contents | Finding code patterns, debugging, code review |
| **Glob** | File pattern matching (filename-based) | No content search; filename patterns only | Finding files by name, discovering structure |
| **Task** | Spawn subagent for isolated work | Context isolation; cannot access parent session state | Complex research, parallel work, delegation |
| **Skill** | Load specialized skill instructions | One skill per call; replaces context | Domain-specific workflows, structured processes |
| **TodoRead** | Read current task tracking state | Read-only; no modification | Understanding current progress |
| **TodoWrite** | Write/update task tracking state | Overwrites entire list; no partial updates | Tracking multi-step work progress |
| **WebFetch** | Retrieve web page content | No JavaScript rendering; basic extraction | Official documentation, web content |
| **WebSearch** | Search the web (Exa AI) | Rate-limited; requires API key | Current information, ecosystem discovery |
| **CodeSearch** | Search for code patterns (Exa Code) | Rate-limited; requires API key | SDK/API patterns, library examples |

### Tool Context Properties (Available in execute function)

```typescript
context.sessionID    // Current session identifier
context.agent        // Calling agent name
context.directory    // Project root path
context.worktree     // Worktree root path
context.abort        // AbortSignal for cancellation
context.metadata()   // Set tool metadata
context.ask()        // Request user permission
```

---

## 2. MCP Server Tools

### 2.1 GitMCP (`gitmcp_*`)

**Purpose**: GitHub documentation and code search  
**Auth**: None required  
**Naming**: Tools prefixed with `gitmcp_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **fetch_github_com_documentation** | `gitmcp_fetch_github_com_documentation` | Fetch entire documentation from a GitHub repo | When you need complete docs for a repository |
| **search_github_com_documentation** | `gitmcp_search_github_com_documentation` | Semantic search within GitHub repo docs | Finding specific documentation topics |
| **search_github_com_code** | `gitmcp_search_github_com_code` | Search code across GitHub repositories | Finding implementation patterns, code examples |
| **fetch_generic_url_content** | `gitmcp_fetch_generic_url_content` | Fetch content from any URL (respects robots.txt) | Retrieving referenced URLs from documentation |

**Agent Access**: hivexplorer, hiveq, hiveplanner, architect

### 2.2 Context7 (`context7_*`)

**Purpose**: Official library/framework documentation  
**Auth**: None (public endpoint) or API key for higher limits  
**Naming**: Tools prefixed with `context7_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **resolve-library-id** | `context7_resolve-library-id` | Resolve package name to Context7-compatible ID | Before querying docs; finds library matches |
| **query-docs** | `context7_query-docs` | Retrieve documentation with code examples | SDK patterns, framework docs, library usage |

**Workflow**: Always call `resolve-library-id` first, then use returned ID with `query-docs`.

**Agent Access**: hivexplorer, hiveq, hiveplanner, architect, hivemaker

### 2.3 Brave Search (`brave-search_*`)

**Purpose**: General web search with specialized variants  
**Auth**: `BRAVE_API_KEY` environment variable required  
**Naming**: Tools prefixed with `brave-search_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **brave_web_search** | `brave-search_brave_web_search` | General web search | Primary web search; finding information |
| **brave_local_search** | `brave-search_brave_local_search` | Location-based search | Finding local businesses, places, services |
| **brave_video_search** | `brave-search_brave_video_search` | Video search | Finding tutorials, demonstrations |
| **brave_image_search** | `brave-search_brave_image_search` | Image search | Finding visual references, screenshots |
| **brave_news_search** | `brave-search_brave_news_search` | News article search | Current events, recent developments |
| **brave_summarizer** | `brave-search_brave_summarizer` | AI-generated summaries | Quick overview of complex topics (requires Pro AI) |

**Agent Access**: All agents for web_search; news_search for hiveq; summarizer for research agents

### 2.4 Repomix (`repomix_*`)

**Purpose**: Repository packing and analysis for agent consumption  
**Auth**: None (local execution via npx)  
**Naming**: Tools prefixed with `repomix_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **pack_codebase** | `repomix_pack_codebase` | Pack local code directory | Analyzing current project structure |
| **pack_remote_repository** | `repomix_pack_remote_repository` | Pack remote GitHub repository | Analyzing external repos |
| **generate_skill** | `repomix_generate_skill` | Generate Claude Agent Skill from codebase | Creating reusable project references |
| **attach_packed_output** | `repomix_attach_packed_output` | Attach existing packed output | Reusing previously packed codebases |
| **read_repomix_output** | `repomix_read_repomix_output` | Read packed output content | Consuming packed codebase data |
| **grep_repomix_output** | `repomix_grep_repomix_output` | Search within packed output | Finding patterns in packed code |
| **file_system_read_file** | `repomix_file_system_read_file` | Read file from local filesystem | Direct file access with security validation |
| **file_system_read_directory** | `repomix_file_system_read_directory` | List directory contents | Exploring project structure |

**Agent Access**: hivexplorer, hiveq, hiveplanner, architect, hivemaker, hivehealer

### 2.5 Fetcher (`fetcher_*`)

**Purpose**: Advanced web content retrieval with browser capabilities  
**Auth**: None  
**Naming**: Tools prefixed with `fetcher_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **fetch_url** | `fetcher_fetch_url` | Fetch single URL with advanced options | When WebFetch is insufficient; need JS rendering |
| **fetch_urls** | `fetcher_fetch_urls` | Fetch multiple URLs in parallel | Batch content retrieval |
| **browser_install** | `fetcher_browser_install` | Install Playwright Chromium binary | When browser automation is needed |

**vs WebFetch**: Use Fetcher when you need JavaScript rendering, advanced extraction, or parallel fetching.

**Agent Access**: hivexplorer, hiveq, hivemaker

### 2.6 DeepWiki (`deepwiki_*`)

**Purpose**: GitHub repository documentation and synthesis  
**Auth**: None  
**Naming**: Tools prefixed with `deepwiki_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **read_wiki_structure** | `deepwiki_read_wiki_structure` | Get documentation topics for a repo | Understanding repo documentation organization |
| **read_wiki_contents** | `deepwiki_read_wiki_contents` | View documentation about a repo | Reading comprehensive repo documentation |
| **ask_question** | `deepwiki_ask_question` | Ask AI-powered questions about a repo | Getting specific answers about codebase |

**Agent Access**: hivexplorer, hiveq, hiveplanner, architect

### 2.7 Notion (`notion_*`)

**Purpose**: Notion workspace integration  
**Auth**: Notion API token required  
**Naming**: Tools prefixed with `notion_API-`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **get-user** | `notion_API-get-user` | Retrieve a specific user | User management, permissions |
| **get-users** | `notion_API-get-users` | List all users | User directory, team management |
| **get-self** | `notion_API-get-self` | Retrieve bot user info | Verifying integration identity |
| **post-search** | `notion_API-post-search` | Search by title | Finding pages and databases |
| **get-block-children** | `notion_API-get-block-children` | Retrieve block children | Reading page content |
| **patch-block-children** | `notion_API-patch-block-children` | Append block children | Adding content to pages |
| **retrieve-a-block** | `notion_API-retrieve-a-block` | Retrieve a specific block | Reading block details |
| **update-a-block** | `notion_API-update-a-block` | Update a block | Modifying content |
| **delete-a-block** | `notion_API-delete-a-block` | Delete a block | Removing content |
| **retrieve-a-page** | `notion_API-retrieve-a-page` | Retrieve page details | Reading page properties |
| **patch-page** | `notion_API-patch-page` | Update page properties | Modifying page metadata |
| **post-page** | `notion_API-post-page` | Create a page | Creating new content |
| **retrieve-a-page-property** | `notion_API-retrieve-a-page-property` | Retrieve page property | Reading specific properties |
| **query-data-source** | `notion_API-query-data-source` | Query a data source | Database queries, filtering |
| **retrieve-a-data-source** | `notion_API-retrieve-a-data-source` | Retrieve data source | Reading database schema |
| **update-a-data-source** | `notion_API-update-a-data-source` | Update data source | Modifying database schema |
| **create-a-data-source** | `notion_API-create-a-data-source` | Create a data source | Creating new databases |
| **list-data-source-templates** | `notion_API-list-data-source-templates` | List templates | Finding database templates |
| **retrieve-a-database** | `notion_API-retrieve-a-database` | Retrieve database | Reading database details |
| **move-page** | `notion_API-move-page` | Move a page | Reorganizing content |
| **retrieve-a-comment** | `notion_API-retrieve-a-comment` | Retrieve comments | Reading discussions |
| **create-a-comment** | `notion_API-create-a-comment` | Create comment | Adding discussions |

**Agent Access**: hivexplorer, hiveq (for knowledge management workflows)

### 2.8 Stitch (`stitch_*`)

**Purpose**: UI design generation and editing  
**Auth**: Google Cloud authentication  
**Naming**: Tools prefixed with `stitch_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **create_project** | `stitch_create_project` | Create new UI design project | Starting new design work |
| **get_project** | `stitch_get_project` | Retrieve project details | Reading project information |
| **list_projects** | `stitch_list_projects` | List all projects | Finding existing designs |
| **list_screens** | `stitch_list_screens` | List screens in project | Viewing design screens |
| **get_screen** | `stitch_get_screen` | Retrieve specific screen | Reading screen details |
| **generate_screen_from_text** | `stitch_generate_screen_from_text` | Generate UI from text prompt | Creating designs from descriptions |
| **edit_screens** | `stitch_edit_screens` | Edit existing screens | Modifying designs |
| **generate_variants** | `stitch_generate_variants` | Generate design variants | Exploring design alternatives |

**Agent Access**: hivemaker (for UI implementation workflows)

### 2.9 Netlify (`netlify_*`)

**Purpose**: Netlify deployment and project management  
**Auth**: Netlify API token  
**Naming**: Tools prefixed with `netlify_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **netlify-coding-rules** | `netlify_netlify-coding-rules` | Get coding rules for Netlify | Before writing serverless/edge functions |
| **get-user** | `netlify_netlify-user-services-reader` | Get user information | User management |
| **get-deploy** | `netlify_netlify-deploy-services-reader` | Get deploy details | Deployment status |
| **get-deploy-for-site** | `netlify_netlify-deploy-services-reader` | Get deploy for site | Site deployment status |
| **deploy-site** | `netlify_netlify-deploy-services-updater` | Deploy a site | Deploying applications |
| **get-teams** | `netlify_netlify-team-services-reader` | List teams | Team management |
| **get-team** | `netlify_netlify-team-services-reader` | Get team details | Team information |
| **get-project** | `netlify_netlify-project-services-reader` | Get project details | Project information |
| **get-projects** | `netlify_netlify-project-services-reader` | List projects | Finding projects |
| **get-forms-for-project** | `netlify_netlify-project-services-reader` | Get forms | Form management |
| **update-visitor-access-controls** | `netlify_netlify-project-services-updater` | Update access controls | Security management |
| **update-forms** | `netlify_netlify-project-services-updater` | Update forms | Form configuration |
| **manage-form-submissions** | `netlify_netlify-project-services-updater` | Manage submissions | Form data management |
| **update-project-name** | `netlify_netlify-project-services-updater` | Update project name | Project management |
| **manage-env-vars** | `netlify_netlify-project-services-updater` | Manage environment variables | Configuration management |
| **create-new-project** | `netlify_netlify-project-services-updater` | Create new project | Project creation |
| **get-extensions** | `netlify_netlify-extension-services-reader` | List extensions | Extension management |
| **get-full-extension-details** | `netlify_netlify-extension-services-reader` | Get extension details | Extension information |
| **change-extension-installation** | `netlify_netlify-extension-services-updater` | Change extension installation | Extension management |
| **initialize-database** | `netlify_netlify-extension-services-updater` | Initialize database | Database setup |

**Agent Access**: hivemaker (for deployment workflows)

### 2.10 Exa (`exa_*`)

**Purpose**: Code-aware web search  
**Auth**: `EXA_API_KEY` environment variable  
**Naming**: Tools prefixed with `exa_`

| Tool | Full Name | Purpose | When to Use |
|------|-----------|---------|-------------|
| **web_search_exa** | `exa_web_search_exa` | Web search with clean content | Finding current information, news, facts |
| **get_code_context_exa** | `exa_get_code_context_exa` | Find code examples and documentation | Programming questions, API usage, examples |

**vs Brave Search**: Use Exa for code-specific searches; Brave for general web/news.

**Agent Access**: All agents for code_context; hivexplorer, hiveq for web_search

---

## 3. Custom HiveMind Tools

These are project-specific tools built on the OpenCode plugin SDK.

### 3.1 hivemind_task

**Purpose**: Canonical task and subtask authority for workflows  
**Actions**: `create`, `list`, `get`, `activate`, `rotate`, `verify`, `complete`

| Action | Purpose | Required Args |
|--------|---------|---------------|
| **create** | Create new task/subtask | workflowId, title, kind |
| **list** | List tasks in workflow | workflowId |
| **get** | Get task details | taskId |
| **activate** | Activate task for work | taskId |
| **rotate** | Rotate task state | taskId |
| **verify** | Verify task completion | taskId, verificationContractId |
| **complete** | Mark task complete | taskId, evidenceRefs |

**Agent Access**: hivemaker, hivehealer, orchestrator

### 3.2 hivemind_trajectory

**Purpose**: Trajectory control surface for session story management  
**Actions**: `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`

| Action | Purpose | Required Args |
|--------|---------|---------------|
| **inspect** | View trajectory state | trajectoryId |
| **traverse** | Navigate trajectory | trajectoryId |
| **attach** | Bind trajectory to session | workflowId, sessionId, lineage, purposeClass |
| **checkpoint** | Create recovery checkpoint | trajectoryId, source, resumeTarget |
| **event** | Record trajectory event | trajectoryId, kind, summary |
| **close** | Close trajectory | trajectoryId, summary |

**Agent Access**: hiveminder, orchestrator, hivehealer

### 3.3 hivemind_handoff

**Purpose**: Delegation and handoff artifact management  
**Actions**: `create`, `read`, `list`, `update`, `validate`, `close`

| Action | Purpose | Required Args |
|--------|---------|---------------|
| **create** | Create handoff packet | sourceSessionId, targetAgent, scope |
| **read** | Read handoff details | id |
| **list** | List handoffs | (optional filters) |
| **update** | Update handoff | id, (update fields) |
| **validate** | Validate handoff contract | id |
| **close** | Close handoff | id, summary, evidence |

**Agent Access**: hiveminder, orchestrator, handoff agent

### 3.4 hivemind_doc

**Purpose**: Read-only document intelligence for markdown artifacts  
**Actions**: `skim`, `skim_directory`, `read`, `chunk`, `search`

| Action | Purpose | Required Args |
|--------|---------|---------------|
| **skim** | Get document outline | filePath |
| **skim_directory** | List markdown files in directory | dirPath |
| **read** | Read document section | filePath, heading |
| **chunk** | Read in token-sized chunks | filePath, maxTokens |
| **search** | Search across documents | dirPath, query |

**Agent Access**: hivexplorer, hiveq, hiveplanner, architect

### 3.5 hivemind_runtime_status

**Purpose**: Inspect active HiveMind runtime state  
**Actions**: None (inspection-only)

**Returns**: Attachment status, trajectory state, workflow state, command availability

**Agent Access**: All agents (read-only inspection)

### 3.6 hivemind_runtime_command

**Purpose**: Execute HiveMind hm-* command bundles  
**Args**: command, arguments, userMessage, preferredUserName, language, artifactLanguage, governanceMode, automationLevel, expertLevel, outputStyle, presetId, requestedSettingsGroups, intakeEvidence

**Agent Access**: orchestrator, hiveminder

---

## 4. Git Tools via Bash

### 4.1 Read-Only Operations (Most Agents)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `git status` | Show working tree status | Before any git operation; understanding current state |
| `git log` | Show commit history | Understanding project history, finding commits |
| `git diff` | Show changes | Reviewing modifications before commit |
| `git show` | Show commit details | Examining specific commits |
| `git branch` | List branches | Understanding branch structure |
| `git remote` | List remotes | Understanding remote configuration |
| `git blame` | Show line-by-line authorship | Understanding code ownership |

### 4.2 Write Operations (Specific Agents)

| Command | Purpose | Agent Access |
|---------|---------|--------------|
| `git add` | Stage changes | hivemaker, hivehealer |
| `git commit` | Create commit | hivemaker, hivehealer |
| `git push` | Push to remote | hivemaker (with confirmation) |
| `git pull` | Pull from remote | hivemaker, hivehealer |
| `git checkout` | Switch branches | hivemaker, hivehealer |
| `git merge` | Merge branches | hivemaker (with confirmation) |
| `git rebase` | Rebase branches | hivemaker (with confirmation) |

### 4.3 Debugging Operations

| Command | Purpose | Agent Access |
|---------|---------|--------------|
| `git bisect` | Binary search for bugs | hivehealer |
| `git stash` | Stash changes | hivemaker, hivehealer |
| `git reflog` | Show reference log | hivehealer (recovery) |

---

## 5. Verification Tools

### 5.1 TypeScript/JavaScript

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx tsc --noEmit` | Type checking | After any TypeScript changes |
| `npm test` | Run test suite | Before claiming completion |
| `npm run build` | Build verification | Before deployment |
| `npm run lint` | Lint checking | Code quality gate |
| `npx eslint` | ESLint checking | Code style enforcement |
| `npx vitest` | Vitest test runner | Unit/integration tests |
| `npx jest` | Jest test runner | Alternative test runner |

### 5.2 Project-Specific

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run typecheck` | Project type checking | Alternative to tsc |
| `npm run lint:fix` | Auto-fix lint issues | After code changes |
| `npm run test:watch` | Watch mode testing | Development workflow |

---

## 6. Research Tools Priority Matrix

### 6.1 By Research Need

| Need | First Choice | Second Choice | Third Choice |
|------|--------------|---------------|--------------|
| **SDK/API patterns** | CodeSearch | Context7 query-docs | WebSearch |
| **Library documentation** | Context7 resolve-library-id → query-docs | DeepWiki ask_question | WebFetch official docs |
| **Current information** | WebSearch | Brave news_search | Exa web_search_exa |
| **Code examples** | CodeSearch | GitMCP search_github_com_code | Repomix grep_repomix_output |
| **Quick overview** | Brave summarizer | Exa web_search_exa | WebSearch |
| **Repository analysis** | Repomix pack_remote_repository | DeepWiki read_wiki_contents | GitMCP fetch_github_com_documentation |
| **Local codebase** | Repomix pack_codebase | Grep | Glob + Read |

### 6.2 Quality vs Speed Tradeoff

| Tool | Quality | Speed | Best For |
|------|---------|-------|----------|
| **CodeSearch** | Highest | Slow | Critical API patterns, exact examples |
| **Context7** | High | Medium | Official documentation, verified patterns |
| **WebFetch** | High | Medium | Specific official documentation URLs |
| **WebSearch** | Medium | Fast | Broad discovery, current information |
| **Brave Summarizer** | Medium | Fastest | Quick topic overview, initial research |

---

## 7. Agent Tool Access Matrix

### 7.1 Built-in Tools (All Agents)

| Agent | Read | Write | Edit | Bash | Grep | Glob | Task | Skill | Todo | Web | Research |
|-------|------|-------|------|------|------|------|------|-------|------|-----|----------|
| **hiveminder** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivefiver** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **orchestrator** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivemaker** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivehealer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivexplorer** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hiveq** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hiveplanner** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **architect** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **verifier** | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hitea** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **handoff** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **code-skeptic** | ✅ | ❌ | ❌ | Limited | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 7.2 MCP Tools by Agent

| Agent | GitMCP | Context7 | Brave | Repomix | Fetcher | DeepWiki | Notion | Stitch | Netlify | Exa |
|-------|--------|----------|-------|---------|---------|----------|--------|--------|---------|-----|
| **hiveminder** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **hivefiver** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **hivemaker** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **hivehealer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **hivexplorer** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **hiveq** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **hiveplanner** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **architect** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **verifier** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **hitea** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **handoff** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **code-skeptic** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### 7.3 Custom HiveMind Tools by Agent

| Agent | hivemind_task | hivemind_trajectory | hivemind_handoff | hivemind_doc | hivemind_runtime_status | hivemind_runtime_command |
|-------|---------------|---------------------|------------------|--------------|------------------------|------------------------|
| **hiveminder** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivefiver** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **hivemaker** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **hivehealer** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **hivexplorer** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **hiveq** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **hiveplanner** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **architect** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **verifier** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **hitea** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| **handoff** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **code-skeptic** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 8. Workflow Patterns

### 8.1 Research Workflow

```
1. hivemind_doc (skim) → understand structure
2. Context7 resolve-library-id → find library
3. Context7 query-docs → get documentation
4. CodeSearch → find implementation patterns
5. WebSearch → current information
6. Brave summarizer → quick overview
```

### 8.2 Implementation Workflow

```
1. hivemind_task (activate) → start work
2. Read/Grep/Glob → understand code
3. Context7/CodeSearch → find patterns
4. Edit/Write → implement changes
5. npx tsc --noEmit → type check
6. npm test → verify
7. hivemind_task (complete) → finish
```

### 8.3 Debugging Workflow

```
1. hivemind_trajectory (inspect) → understand state
2. git bisect → find problematic commit
3. Grep → find error patterns
4. CodeSearch → find solutions
5. Edit → implement fix
6. npm test → verify fix
7. hivemind_trajectory (checkpoint) → save state
```

### 8.4 Delegation Workflow

```
1. hivemind_handoff (create) → create packet
2. Task (spawn) → delegate to subagent
3. Subagent uses handoff packet
4. Subagent completes work
5. hivemind_handoff (validate) → verify contract
6. hivemind_handoff (close) → complete handoff
```

---

## 9. Environment Variables Required

| Variable | Provider | Where to Get |
|----------|----------|--------------|
| `BRAVE_API_KEY` | Brave Search | https://brave.com/search/api/ |
| `EXA_API_KEY` | Exa | https://exa.ai/ |
| `TAVILY_API_KEY` | Tavily | https://tavily.com/ |
| `CONTEXT7_API_KEY` | Context7 (optional) | https://context7.com/ |

---

## 10. MCP Server Configuration Template

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "description": "Official library/framework documentation retrieval"
    },
    "deepwiki": {
      "type": "remote",
      "url": "https://mcp.deepwiki.com/mcp",
      "description": "Repository synthesis and source navigation"
    },
    "repomix": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "repomix", "--mcp"],
      "description": "Local/remote repository packing and analysis"
    },
    "tavily": {
      "type": "remote",
      "url": "https://mcp.tavily.com/mcp",
      "description": "Web search with AI extraction"
    },
    "exa": {
      "type": "remote",
      "url": "https://mcp.exa.ai/mcp",
      "description": "Code-focused web search enrichment"
    },
    "sequential-thinking": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "description": "Multi-step reasoning chains"
    },
    "grep": {
      "type": "remote",
      "url": "https://mcp.grep.app/mcp",
      "description": "GitHub code search with grep patterns"
    },
    "brave-search": {
      "type": "remote",
      "url": "https://mcp.brave.com/mcp",
      "description": "General web search with news and video"
    }
  }
}
```

---

**Document Owner**: OpenCode Tool Ecosystem Reference  
**Last Updated**: 2026-03-23  
**Source**: OpenCode SDK documentation, HiveMind plugin source, MCP provider documentation
