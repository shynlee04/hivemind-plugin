Refactor, split, and modernize the document-intelligence layer centered on the following TypeScript files, then redesign it into a cleaner, more reliable tool architecture.

## Primary refactor targets

```markdown
/Users/apple/hivemind-plugin/src/lib/doc-intel.ts
/Users/apple/hivemind-plugin/src/lib/code-intel/doc-weaver.ts
/Users/apple/hivemind-plugin/src/tools/hivemind-doc.ts
```

## Legacy or context-rot-prone modules to review for migration, consolidation, or archival

Evaluate each of these explicitly and decide whether it should be:

- migrated into one of the new tool families,
- refactored into a supporting library,
- reduced to a compatibility shim,
- or archived because it no longer fits the new model.

```markdown
/Users/apple/hivemind-plugin/src/tools/hivemind-inspect.ts
/Users/apple/hivemind-plugin/src/tools/hivemind-read-skeleton.ts
/Users/apple/hivemind-plugin/src/tools/hivemind-hierarchy.ts
/Users/apple/hivemind-plugin/src/tools/hiveops-export.ts
/Users/apple/hivemind-plugin/src/tools/hiveops-sot.ts
/Users/apple/hivemind-plugin/src/tools/hiveops-gate.ts
/Users/apple/hivemind-plugin/src/lib/anchors.ts
/Users/apple/hivemind-plugin/src/lib/detection.ts
/Users/apple/hivemind-plugin/src/lib/gatekeeper.ts
/Users/apple/hivemind-plugin/src/lib/hierarchy-tree.ts
/Users/apple/hivemind-plugin/src/lib/hiveops-paths.ts
/Users/apple/hivemind-plugin/src/lib/inspect-engine.ts
/Users/apple/hivemind-plugin/src/lib/paths.ts
/Users/apple/hivemind-plugin/src/lib/project-snapshot.ts
/Users/apple/hivemind-plugin/src/lib/session-governance.ts
/Users/apple/hivemind-plugin/src/lib/session-engine.ts
/Users/apple/hivemind-plugin/src/lib/session-memory-purge.ts
/Users/apple/hivemind-plugin/src/lib/session-runtime.ts
/Users/apple/hivemind-plugin/src/lib/staleness.ts
/Users/apple/hivemind-plugin/src/lib/state-snapshot.ts
/Users/apple/hivemind-plugin/src/lib/task-governance.ts
/Users/apple/hivemind-plugin/src/lib/toast-throttle.ts
/Users/apple/hivemind-plugin/src/lib/tool-activation.ts
/Users/apple/hivemind-plugin/src/lib/tool-names.ts
/Users/apple/hivemind-plugin/src/lib/tool-response.ts
/Users/apple/hivemind-plugin/src/hooks/session_coherence/main_session_start.ts
/Users/apple/hivemind-plugin/src/hooks/event-handler.ts
/Users/apple/hivemind-plugin/src/hooks/soft-governance.ts
/Users/apple/hivemind-plugin/src/hooks/tool-gate.ts
```

---

# Background and intent

The current stack has useful capabilities, but too many concerns are mixed together: document intelligence, hierarchy traversal, inspection, task/session artifacts, handoff/export logic, and governance-dependent flows. This makes the system fragile under context-rot, unstable session state, noisy workflows, or broken `.hivemind` lineage dependencies.

The new design must prioritize a dependable, standalone, search-first and hierarchy-aware utility layer that remains useful even when session engines, governance hooks, planning artifacts, or framework pathing are unstable or unavailable.

The redesign must also improve practical usability so these tools become natural first-choice utilities for agents: easier to discover, easier to compose, safer for large files, better for chunked reads, and more suitable for iterative workflows, delegation, validation, and synthesis.

---

# Existing capability baseline to preserve and improve

Use the current `doc-intel` and `hivemind_doc` capabilities as the baseline, but refactor them into a cleaner structure.

## `doc-intel` baseline

- `skimDocument` — parse one file’s heading hierarchy and metadata
- `skimDirectory` — batch skim across multiple files
- `readSection` — extract a single section by heading
- `readChunked` — token-budget-aware chunked read
- `upsertSection` — replace a section body or create the section if absent
- `writeSection` — replace a section body
- `appendSection` — append to a section body
- `insertSection` — insert a new section after a heading
- `deleteSection` — delete a section by heading
- `readMetadata` — extract YAML frontmatter
- `writeMetadata` — set or update YAML frontmatter fields
- `searchDocuments` — keyword or regex search across document headings and body
- `listDocuments` — list document files with summary metadata
- `createDocument` — create a new document with frontmatter template
- `generateTOC` — render a markdown table of contents from headings

### Existing safety expectations

- Write operations only on `.md`, `.xml`, `.json`, `.yaml`, `.yml`
- Write operations on files larger than 600 LOC return a `chunk_required` signal
- All write operations must follow a read-before-write invariant

## `hivemind_doc` V2 baseline

- `skim`
- `read`
- `read_lines`
- `metadata`
- `list`
- `search`
- `inspect`
- `index`
- `xref`
- `context`
- `write`
- `upsert`
- `append`
- `insert`
- `delete`
- `batch`
- `batch_files`
- `set_metadata`
- `create`
- `toc`

### Existing philosophy to keep and strengthen

1. Read before write
2. Chunk discipline
3. Hierarchy-first navigation
4. Context-on-demand
5. File-type safety
6. Swarm-safe operations with advisory locks, atomic writes, and content hashing

`hivemind_doc` should remain the main unified document intelligence tool, while the surrounding concerns are reorganized more cleanly.

---

# Required new structure

Split and restructure the current capabilities into these 3 main tool families.

## 1) `hivemind-doc`

This is the primary document and artifact intelligence toolset.

### Core responsibility

Support hierarchy-aware creation, reading, indexing, search, update, deletion, and integrity checks across document and artifact trees, including directories, subdirectories, and shard files.

Current common targets include:

- `docs/**/*`
- `.md`
- `.xml`
- `.yaml`
- `.yml`
- `.json`

The tool must support both:

- purpose/workflow-based hierarchies
- date/time-based hierarchies

### Required functional groups

#### A. Creation
Improve and group creation-oriented actions, including:

- create
- upsert
- write
- append
- insert
- batch create
- batch multi-section writes
- batch multi-file writes
- frontmatter/template creation
- auto-pathing and file naming helpers where appropriate

Creation flows should be low-friction and optimized for common agent workflows.

#### B. Update
Improve and group update-oriented actions, including:

- update section/body
- structured search-and-replace
- hierarchy updates
- rename/move/path updates
- metadata updates
- diff-aware updates
- LSP-assisted or structure-aware edits where beneficial

Support pathing and naming conventions explicitly.

#### C. Read and search
Improve and group read/search actions, including:

- hierarchy and outline reads
- chunked reads
- targeted section reads
- line-range reads
- offset-based reads
- directory skims
- keyword and regex search
- metadata reads
- TOC generation
- cross-link / reference discovery
- structured output with excerpt, path, heading, metadata, and relevant links

Improve folder and file naming conventions to support stronger searchability and retrieval.

#### D. Delete
Support safe deletion of:

- sections
- metadata fields
- generated indices where appropriate
- whole files when allowed by explicit operation mode

Deletion must be conservative, auditable, and safe.

### Additional requirements

- Support multiple and batch operations cleanly
- Improve usability for indexing, hierarchy traversal, CRUD, and retrieval
- Treat headings, metadata, links, numbering chains, and file naming as first-class navigational structures
- Handle unnamed or malformed documents gracefully with fallbacks
- Support integrity validation across hierarchy, numbering, links, and metadata relationships
- Support iterative and incremental document growth without forcing full rewrites

---

## 2) `hivemind-handoff` (new)

Create a new tool family dedicated to delegation records, sub-session outputs, task handoff artifacts, validation traces, and reusable synthesis inputs.

### Core responsibility

Capture and structure delegated work so sub-session results are:

- monitored,
- validated,
- preserved,
- retrievable,
- reusable for future synthesis,
- and not lost across interruptions or context resets.

### Required capabilities

#### A. Delegation-aware task records
Support task classification and workflow-aware output structures for delegated work, including improved prompting payloads for orchestrator-driven delegation flows such as `hiveminder` and `hivefiver`.

These structures should capture:

- task type
- workflow type
- user intent
- requirements
- acceptance criteria
- validation criteria
- metrics
- execution notes
- proof of work
- important tool calls
- tool order or sequence where useful
- parent session id
- sub-session id
- agent identifier if available
- timestamps
- completion status
- continuation markers for interrupted chains

#### B. Exportable and parseable handoff artifacts
Support automatic export or generation into templated `.md` handoff files, with YAML frontmatter and predictable location strategy under a main session or task folder.

The artifacts should be structured for:

- fast retrieval
- sorted navigation
- classification
- indexing
- selective synthesis
- future resumption instead of re-research

#### C. Naming and hierarchy conventions
Design naming rules and folder conventions so handoff artifacts remain easy to retrieve, diff, sort, and reuse.

Support:

- parent-child relationships
- chronological ordering
- task/workflow grouping
- resumability
- synthesis-ready indexing

#### D. Validation and collaboration integrity
Design for delegated workflows where intermediate outputs may be required at multiple checkpoints during a sub-session, not only at the end.

Support:

- iterative stops
- checkpoint summaries
- validation gates
- synthesis across related handoffs
- cross-domain linking without excessive token cost
- preserving context continuity after disconnects or resets

### Design priority

This tool family should integrate well with orchestration and delegation flows later, but must not depend on them in order to function now.

---

## 3) `hivemind-inspect`

This tool family should focus on investigation and structural inspection of documents, artifacts, and code files, especially when `.hivemind` state, session management, task artifacts, or workflow engines are unstable.

### Core responsibility

Provide reliable inspection primitives that work independently for code and document investigation.

### Required capabilities

#### A. Hierarchy and skeleton inspection
Support:

- file hierarchy reads
- document outlines
- code skeleton reads
- export and symbol summaries
- heading and section maps
- multi-file relationship overviews

#### B. Selective context extraction
Support:

- chunked reads
- sampled reads
- stepwise exploration
- multi-file relational inspection
- offset-based reading
- targeted context windows
- metadata-aware reads
- selective traversal of only relevant parts

#### C. Link and structure inspection
Support:

- metadata inspection
- cross-link inspection
- reference discovery
- TOC or structure comparison
- document/code relationship tracing
- quick investigation workflows using built-in search tools

#### D. JSDoc and comment intelligence
Upgrade JSDoc and comment tracing so it becomes useful for investigation, overlap detection, and conflict analysis within a file and across related files.

This includes:

- extracting JSDoc blocks
- extracting code comments
- relating comments to exports, symbols, and sections
- identifying missing, weak, stale, or conflicting annotations
- improving investigation of duplicated logic or overlapping responsibilities

If current guidance in `AGENTS.md` is too naive, propose a better structure or enforcement direction as part of the redesign.

---

# Cross-cutting design principles

Apply these principles consistently across all three tool families.

## 1. Standalone-first operation
These tools must run without requiring preconditions from:

- `.hivemind` session state
- session management engines
- governance pipelines
- task planning artifacts
- internal pathing engines
- blockable framework hooks
- other volatile plugin subsystems
- `/Users/apple/hivemind-plugin/dist` dependencies that may be unstable

They must remain independently usable now, while still being easy to integrate later.

## 2. Hierarchy-first and traversal-first intelligence
Prefer:

- outline before body
- hierarchy before full read
- targeted section retrieval before broad reads
- relational traversal over flat search-only behavior

The goal is stronger integrity, less noise, and more reliable coverage.

## 3. Context-on-demand
Only pull the context that is needed. Improve token efficiency through:

- chunking
- section targeting
- offset reads
- sampling
- indexing
- cached or structured summaries where helpful

## 4. Read-before-write discipline
Every write path must follow read-before-write and preserve chunk safety for large files.

## 5. Large-file discipline
Do not allow unsafe single-shot writes to large files. Design robust fallback behavior such as:

- `chunk_required`
- staged edits
- section-level edits
- multi-pass update plans

## 6. File-type-aware behavior
Differentiate behavior appropriately for:

- Markdown
- XML
- YAML
- JSON

Do not treat them as identical. Respect each format’s structure and edge cases.

## 7. Concurrency and integrity safety
Handle edge cases such as:

- simultaneous operations
- advisory locking
- atomic writes
- content hashing
- stale reads
- merge conflicts
- malformed structure
- partial metadata corruption

## 8. Naming, numbering, and path intelligence
Support conventions and validation for:

- file names
- folder names
- numbering chains
- child document auto-pathing
- hierarchy consistency
- retrieval-friendly organization

## 9. Search quality and structured output
Search, inspect, and context tools should return structured output where useful, including:

- path
- file type
- heading or symbol
- excerpt
- metadata
- match reason
- related links or cross-references
- confidence or relevance indicators where useful

## 10. Reliability under noisy environments
Design these tools to remain dependable in environments with:

- context-rot
- interrupted workflows
- incomplete lineage data
- stale planning artifacts
- missing governance state
- noisy session histories

---

# Opencode-native design expectations

Use Opencode’s built-in capabilities as first-class building blocks before inventing unnecessary custom complexity.

## Prioritize built-in tools and compositions where relevant

- create/edit: `edit`, `write`, `patch`, `bash`
- search/read: `glob`, `grep`, `list`, `search`, `read`, offset-based read
- LSP-assisted inspection and edits where appropriate

## Synthesize best uses from these references

- https://opencode.ai/docs/tools/
- https://opencode.ai/docs/custom-tools/
- https://opencode.ai/docs/cli/
- https://opencode.ai/docs/commands/
- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/sdk/

Do not force usage of every reference. Use them to derive the best design decisions.

## Additional guidance

- Prefer composing built-in tools over duplicating them
- Do not replace built-in tools unnecessarily
- If custom tools are added, avoid name collisions with built-ins
- Use multiple-tools-per-file structure when it improves maintainability
- Consider helper scripts, command stacking, and lightweight utilities that reduce friction for common workflows

---

# What to deliver

Produce a complete refactor and redesign proposal with implementation direction.

## Required output structure

### 1. Architecture split
Define the new architecture for:

- `hivemind-doc`
- `hivemind-handoff`
- `hivemind-inspect`

Include clear boundaries, shared libraries, and what should stay unified vs split.

### 2. File-by-file migration map
For every target and legacy file listed above, classify it as:

- keep and refactor
- merge
- split
- rename
- convert to shared lib
- compatibility shim
- archive

Include a short rationale for each.

### 3. Tool API and action design
List the proposed actions for each main tool, grouped logically, with concise intent and behavior.

### 4. Internal library design
Describe which core reusable libraries should exist under `src/lib`, especially for:

- parsing
- hierarchy extraction
- metadata handling
- indexing
- chunking
- xref/link analysis
- write safety
- locking
- naming/path conventions
- handoff schema generation
- code/JSDoc inspection

### 5. Data and artifact conventions
Define naming, folder layout, metadata/frontmatter schemas, and indexing conventions for documents and handoff artifacts.

### 6. Safety and edge-case handling
Document the expected behavior for:

- large files
- malformed files
- missing headings
- malformed metadata
- concurrent writes
- missing session lineage
- interrupted delegations
- unnamed documents
- ambiguous paths
- cross-link integrity failures

### 7. Opencode workflow recommendations
Recommend the best built-in tool combinations, call order, and workflow patterns for:

- investigation
- research
- synthesis
- planning
- spec-driven edits
- gatekeeping or validation-oriented flows
- delegation and handoff preservation
- document CRUD and indexing

### 8. Implementation order
Give a staged implementation plan that starts with the highest-value, lowest-fragility core.

### 9. Backward compatibility and deprecation strategy
Explain how to preserve useful existing behavior while retiring outdated or redundant surfaces cleanly.

---

# Quality bar

The redesign must be:

- practical, not abstract
- strict and precise enough for implementation
- easy to follow
- resilient under framework instability
- optimized for agent workflows
- strong on hierarchy, chunking, and retrieval
- strong on standalone operation
- explicit about safety and migration decisions

Keep the response direct, implementation-focused, and structured. Do not add roleplay, meta commentary, or unnecessary narration.cati