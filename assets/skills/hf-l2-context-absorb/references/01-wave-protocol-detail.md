# Wave Protocol Detail

## Per-Wave Input/Output Schemas

### Wave 0: State Load

**Input:**
- User's raw input text (full, unmodified)
- File path to session-context-prompt.md

**Output — Delta Report:**
```
delta_report:
  total_input_elements: <int>
  new_elements: <int>
  duplicate_elements: <int>
  categories:
    urls: [<url1>, <url2>]
    file_paths: [<path1>, <path2>]
    actors: [<name1>, <name2>]
    events: [{date: <date>, description: <text>}]
    domains: [<term1>, <term2>]
    narrative_segments: [<segment_count>]
    unknown: [<element1>, <element2>]
  existing_state:
    dates_active: [<date1>, <date2>]
    actors: [<name1>, <name2>]
    domains: [<domain1>]
    line_count: <int>
    yaml_version: <int>
```

### Wave 1: Outline Formation

**Input:** Wave 0 delta report + user's raw input

**Output — Subagent 1A (Content Parser):**
```
categorization:
  - element: <text>
    type: url|file_path|actor_name|event_date|domain_term|narrative_segment|unknown
    confidence: high|medium|low
    source_location: <char_offset_or_line>
```

**Output — Subagent 1B (Context Matcher):**
```
matches:
  - input_element: <text>
    existing_location: <line_range>
    similarity: high|medium|low
    overlap_type: identical|superset|subset|related
    recommendation: skip|merge|append|replace_flagged
```

**Output — Subagent 1C (Disk File Scanner):**
```
files:
  - path: <filepath>
    lines: <int>
    depth_used: SKIM|SCAN|DEEP
    title: <extracted_title>
    entities: [<entity1>, <entity2>]
    domain_terms: [<term1>]
    relationships: [{target: <path>, type: imports|references|extends}]
```

### Wave 2: Deep Processing

**Input:** Wave 0 + Wave 1 outputs combined

**Output — Subagent 2A (URL Deep Extract):**
```
extractions:
  - url: <url>
    title: <extracted_title>
    key_claims: [<claim1>, <claim2>]
    entities: [<entity1>]
    domain: <domain>
    date_published: <date_or_null>
    relevance_to_session: high|medium|low
    extraction_status: success|failed
    failure_reason: <null_or_reason>
    tool_used: <tool_name>
```

**Output — Subagent 2B (Narrative Synthesis):**
```
narrative:
  main_story: <1-3 sentence summary>
  sub_plots:
    - description: <text>
      actors: [<name1>]
      temporal_anchor: <date_or_null>
  actor_motivations:
    - actor: <name>
      motivation: <text>
      evidence: <source_citation>
  temporal_sequence:
    - date: <date>
      event: <description>
      confidence: confirmed|inferred|speculative
  open_questions:
    - question: <text>
      evidence: <source_citation>
```

**Output — Subagent 2C (Cross-Reference):**
```
cross_refs:
  shared_entities:
    - entity: <name>
      in_disk: [<file1>]
      in_urls: [<url1>]
  conflicting_claims:
    - claim: <text>
      disk_says: <text> (source: <file>)
      url_says: <text> (source: <url>)
      resolution: <text_or_null>
  complementary_information:
    - topic: <text>
      disk_contributes: <text>
      url_contributes: <text>
  dependency_chains:
    - chain: [<element1> → <element2> → <element3>]
```

### Wave 3: Clarification

**Input:** Wave 2 outputs + ambiguity list

**Output:**
```
clarifications:
  - question: <text>
    source: <url_or_file>
    text_excerpt: <exact_quote>
    ambiguity: <what_is_unclear>
    resolution_options: [<option1>, <option2>]
    answer: <user_response_or_null>
    status: resolved|open|escalated
```

### Wave 4: Assemble & Append

**Input:** All wave outputs merged

**Output:**
```
append_result:
  yaml_merged: true|false
  body_appended: true|false
  validation:
    new_block_count: <int>
    yaml_balanced: true|false
    line_count_delta: <int>
    content_preserved: true|false
  errors: [<error1>, <error2>]
```

## Subagent Dispatch Templates

### Template for Wave 1A (Content Parser)

```
You are a content parsing subagent for the hf-context-absorb skill.

[Session Context]
Phase: hf-absorb Wave 1
Existing context size: {line_count} lines
Goals: Categorize every element in the user's input for the absorption pipeline
Constraints: Classify everything. Mark unknowns explicitly. No guessing.
Input: {raw_user_input}
Wave findings so far: {wave0_delta_summary}

Task:
1. Scan the input for URLs, file paths, named entities, dates, domain terms
2. Classify each element into: url, file_path, actor_name, event_date, domain_term, narrative_segment, unknown
3. Assign confidence: high (certain), medium (likely), low (guessing)
4. Output the categorization list

Format your output as a structured list. Max 200 lines.
```

### Template for Wave 2A (URL Deep Extract)

```
You are a URL extraction subagent for the hf-context-absorb skill.

[Session Context]
Phase: hf-absorb Wave 2
Existing context size: {line_count} lines
Goals: Extract full content from every URL found in Wave 1
Constraints: Tokens don't matter. Accuracy does. Use ALL available tools aggressively.
Input: {url_list_from_wave1}
Wave findings so far: {wave1_categorization_summary}

Tools to use (in priority order):
1. tavily_extract — batch up to 20 URLs
2. context7_resolve-library-id → context7_query-docs — for library docs
3. deepwiki_ask_question — for GitHub repos
4. brave_web_search — fallback for blocked content
5. tavily_research — deep multi-source for complex topics

For each URL extract: title, key claims, entities, domain, date_published, relevance.
Flag failed extractions with reason. Max 300 lines output.
```

### Template for Wave 2B (Narrative Synthesis)

```
You are a narrative synthesis subagent for the hf-context-absorb skill.

[Session Context]
Phase: hf-absorb Wave 2
Existing context size: {line_count} lines
Goals: Weave all categorized elements into coherent narrative threads
Constraints: Stay grounded in evidence. Mark inferences as such.
Input: {all_wave1_outputs_combined}
Wave findings so far: {wave1_full_summary}

Task:
1. Identify the main story arc from all elements
2. Map sub-plots with their actors and temporal anchors
3. Document actor motivations with evidence citations
4. Build chronological timeline of events
5. List open questions with source citations

Load hm-synthesis skill and use FOCUSED tier for compression.
Max 300 lines output.
```

## Wave Transition Guards

Between each wave, verify:

| Transition | Guard Check | Fail Action |
|-----------|-------------|-------------|
| Wave 0 → 1 | Delta report has `total_input_elements > 0` | Abort: empty input |
| Wave 1 → 2 | Categorization covers ≥80% of input elements | Loop: refine patterns |
| Wave 2 → 3 | Unresolved elements > 5 OR ambiguities exist | Skip Wave 3 if none |
| Wave 3 → 4 | All questions asked or open_questions list finalized | Proceed to assembly |
