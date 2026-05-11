---
sessionID: ses_1e81e05bcffeapmHqdn80AwdLG
created: 2026-05-11T16:32:26.196Z
updated: 2026-05-11T16:32:26.196Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

You are the subagent hm-l2-researcher. You are being delegated by hm-l1-coordinator for a research task. You must fulfill your work within the boundaries set below.

## TASK
Scrape and research OpenCode's official documentation and GitHub repository to understand its runtime architecture — specifically how it manages context across turns, sessions, compactions, multi-agent operations, and how the SDK/plugin system exposes context interception points.

## SCOPE
**Include:**
- https://opencode.ai/ and its /docs/* sections
- https://github.com/anomalyco/opencode — README, docs, source code structure
- @opencode-ai/plugin npm package documentation
- OpenCode's agent definitions, plugin system, tool registration API
- Any documentation about session lifecycle, context compaction, or context window management
- Hook system documentation (PreToolUse, PostToolUse, etc.)
- Skill loading, command execution, and how these inject context

**Exclude:**
- General AI/LLM theory not specific to OpenCode
- Unrelated GitHub repos
- Hivemind's own codebase (this is about OpenCode, not Hivemind)

## CONTEXT
We are building a context continuity and dynamic pruning system for the Hivemind harness. We need to understand OpenCode's runtime internals to know what APIs we can hook into.

Key questions to answer:
1. How does OpenCode compose context for each LLM turn? What does the LLM actually "see"?
2. What is the session lifecycle — from start through compaction to disconnect?
3. How does OpenCode manage context window size? What pruning/compaction mechanisms exist?
4. What hooks/APIs exist for intercepting or filtering context?
5. How do agent definitions (temperature, tools, permissions) affect runtime context?
6. How are skills loaded/injected into context at runtime?
7. How does delegation (subagent dispatch) affect the parent agent's context window?
8. How does tool output (especially large outputs) get managed in context?

## PROCESS
1. Start with web search for "OpenCode AI agent framework documentation"
2. Crawl/scrape https://opencode.ai/ and its documentation pages
3. Explore https://github.com/anomalyco/opencode — README, docs/, source structure
4. Search for "@opencode-ai/plugin" npm package docs
5. Search the OpenCode repo for context-related code (compaction, context, pruning, session)
6. Look for any blog posts, tutorials, or community discussions about OpenCode internals
7. Search for "opencode context management", "opencode session lifecycle", "opencode hooks"

Use these tools in order:
- exa_web_search_exa for finding documentation pages and references
- exa_web_fetch_exa or web-reader_webReader for reading full documentation pages
- tavily_tavily_search as backup search
- github_get_file_contents for reading specific files from anomalyco/opencode
- zread_get_repo_structure for exploring the repo structure
- zread_search_doc for searching within the repo
- deepwiki_ask_question for asking about the OpenCode repository
- deepwiki_read_wiki_contents for reading documentation about the repo

## EXPECTED OUTPUT
Return a structured markdown document with these sections:
1. **Sources Found** — list all URLs and references discovered with brief descriptions
2. **OpenCode SDK & Architecture** — architecture overview, client-server, plugin system
3. **Session & Context Management** — session lifecycle, context composition, compaction
4. **Agent Profiles & Primitives** — agent definitions, skills, commands, how they affect context
5. **Context Pruning & Interception** — hooks, APIs, built-in mechanisms
6. **Code References** — key files in anomalyco/opencode that handle context, sessions, etc.
7. **Gaps** — what information was NOT found in documentation

Each claim must include:
- Source citation (URL, doc section, file path)
- Confidence level (HIGH/MEDIUM/LOW)
- Direct quotes or paraphrased evidence

Write all findings to disk at:
`/Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t1-opencode-docs.md`

## VERIFICATION
- At least 5 distinct documentation URLs/sources must be cited
- Every claim must have a confidence level
- Gaps must be explicitly documented
- Output file must exist at the specified path
- Use fresh web searches — do not rely on training data assumptions

## HANDOFF METADATA
source_agent: hm-l1-coordinator
target_agent: hm-l2-researcher
handoff_reason: docs-and-sdk-scraping
allowed_destinations: []
history_policy: fresh-context-only
expected_return: DONE + structured markdown at specified path + confidence levels + citations
resume_pointer: read output file at /Users/apple/hivemind-plugin-private/.hivemind/research/opencode-context-architecture-2026-05-11/wave1-t1-opencode-docs.md

### Tool: skill

**Input:**
```json
{
  "name": "hm-l3-deep-research"
}
```

**Output:** (pruned)
```
# Skill: hm-l3-deep-research
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_yaFyJdjsrDzF0tEYEXAA2099"
}
```


### Tool: exa_web_search_exa

**Input:**
```json
{
  "callID": "call_01_Qvz2t6E3cTKxeO1fn5JJ3354"
}
```


### Tool: exa_web_search_exa

**Input:**
```json
{
  "callID": "call_02_laoL4p8DCnNBfvNZXLMT0655"
}
```


### Tool: exa_web_search_exa

**Input:**
```json
{
  "callID": "call_03_AA6IGpwHNK6gngaPZjeI6388"
}
```


### Tool: exa_web_search_exa

**Input:**
```json
{
  "callID": "call_01_mT4pRdq3wOQjfuftk2xg0737"
}
```


### Tool: webfetch

**Input:**
```json
{
  "callID": "call_02_hBWJvRCqc5mpb34HEysp5200"
}
```


### Tool: zread_get_repo_structure

**Input:**
```json
{
  "callID": "call_00_jLK9W9rMrCAX9B3IdKhs4867"
}
```


### Tool: webfetch

**Input:**
```json
{
  "callID": "call_03_lLIATGUASE33dO9Bvkvj5899"
}
```


### Tool: zread_get_repo_structure

**Input:**
```json
{
  "callID": "call_00_73ItAhthHAcJHch3xkQA0833"
}
```


### Tool: webfetch

**Input:**
```json
{
  "callID": "call_02_Fguq7413V6irHbgiQ1jk7177"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_01_Qft0S6zakRWscTaOB9C32522"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_00_MFxXMQacatrkMTTFn7dc9296"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_01_BQOx3DGWKPT92KVHo9QV1561"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_02_pWl3C8bRyR3lZH6reYWb0541"
}
```


### Tool: zread_read_file

**Input:**
```json
{
  "callID": "call_00_lKKttCYZyvXheXya0iRc7050"
}
```


### Tool: exa_web_search_exa

**Input:**
```json
{
  "callID": "call_01_mcpe9B6d0P2IapFtZAAZ9498"
}
```


### Tool: deepwiki_ask_question

**Input:**
```json
{
  "callID": "call_02_3G6eGhYayq0QhjjMO2Qz8694"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_M83wW2CcjXBmtfpiAQrh0022"
}
```

