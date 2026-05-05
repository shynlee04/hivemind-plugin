# Legacy Concept Catalog — Archived `legacy-src-20260314-140720`

**Source:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.archive/legacy-src-20260314-140720/`
**Analyzed:** 2026-05-05
**Total files analyzed:** 127 (12 hooks, 73 lib, 15 schemas, 22 tools, 5 misc)
**Total concepts extracted:** 84
**Confidence:** HIGH (direct source file analysis)

---

## Path Legend

| Path | Scope |
|------|-------|
| **Path 1** | Agent-callable tools (registered in plugin, exposed to LLM) |
| **Path 2** | Runtime programmatic (hooks, auto-write, parse, event-driven) |
| **Path 3** | Governance, permissions, registry, validation |
| **Path 4** | Side-car, onboarding, configurations, dashboards |

---

## Complete Concept Catalog

### HOOKS (12 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| H1 | Session Lifecycle Hook | hook-pattern | hooks/session-lifecycle.ts | System prompt transformation on every turn | Compiles signals (governance counters, hierarchy, drift) into system prompt injections. Re-reads config from disk each invocation (config-hot-reload). | Path 2 |
| H2 | Soft Governance Hook | hook-pattern | hooks/soft-governance.ts | Counter/detection engine after every tool call | Tracks: turn count, tool health, consecutive failures, section repetition, stuck keywords, governance violations, chain breaks, drift, long session. Writes to brain.json.metrics. Never transforms prompts — stores signals for session-lifecycle to compile. | Path 2 |
| H3 | Tool Gate Hook | hook-pattern | hooks/tool-gate.ts | Pre-execution tool governance | Classifies tools as universal/workflow/deterministic. Enforces role-based permissions (write tools require specific roles). Exempt tools bypass governance. Framework conflict detection blocks unsafe tools. | Path 3 |
| H4 | Compaction Hook | hook-pattern | hooks/compaction.ts | Context window compaction trigger | Detects when context is filling up and triggers compaction with preservation of critical state markers. | Path 2 |
| H5 | Event Handler Hook | hook-pattern | hooks/event-handler.ts | Lifecycle event routing (session.created, etc.) | Routes session lifecycle events to appropriate handlers. Triggers session intent classification on creation. | Path 2 |
| H6 | Messages Transform Hook | hook-pattern | hooks/messages-transform.ts | Intent clarification injection into message stream | Transforms outgoing messages to inject clarification prompts, intent capture, and context anchoring. Absorbed intent-clarification logic. | Path 2 |
| H7 | SDK Context Hook | hook-pattern | hooks/sdk-context.ts | OpenCode SDK client initialization and access | Provides typed access to OpencodeClient, Project, and PluginInput. Singleton pattern for logger initialization. Re-exports pure accessors from lib. | Path 2 |
| H8 | Session Coherence Hook | hook-pattern | hooks/session_coherence/ | Main session start coherence validation | Validates session continuity across turns. Tracks message parts, first-turn configuration, coherence types. | Path 2 |
| H9 | Session Lifecycle Helpers | hook-pattern | hooks/session-lifecycle-helpers.ts | Project snapshot collection for context | Collects package.json, tech stack, and project metadata at session start for injection into system prompt. | Path 2 |
| H10 | Config Hot-Reload | hook-pattern | hooks/soft-governance.ts (embedded) | Re-read config from disk each hook invocation | Every hook call reads config.json from disk rather than caching, allowing runtime config changes without restart. | Path 2 |
| H11 | Hook CQRS Boundary | hook-pattern | hooks/* (systemic) | Hooks are read-only, tools are write-side | Hooks never directly mutate state — they queue mutations via state-mutation-queue for tools to flush. CQRS compliance. | Path 2 |
| H12 | Try/Catch Never-Break | hook-pattern | hooks/soft-governance.ts (P3 rule) | Hooks never break tool execution | Every hook wraps in try/catch so governance failures never block agent operations. | Path 2 |

### LIB — SESSION MANAGEMENT (10 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| S1 | Session Kernel | session-management | lib/session-kernel.ts | Bootstrap health check and integrity grading | Kernel boot health (clean/dirty/recovery), integrity grade (A-F), branch status tracking, session map with lineage resolution. | Path 2 |
| S2 | Session Runtime | session-management | lib/session-runtime.ts | Session profile creation and resolution | EnsureSessionProfile creates/reuses profiles from seeds. Lineage scope resolution, session kind classification, role source tracking. | Path 2 |
| S3 | Session Engine | session-management | lib/session-engine.ts | Orchestration over session lifecycle | Coordinates kernel, runtime, export, and governance for session operations. Uses graph tasks and trajectory state. | Path 2 |
| S4 | Session Intent Classifier | session-management | lib/session-intent-classifier.ts | Auto-classify session into 6 intent categories | discovery/research/planning/implementing/debug/testing. Pure function, no I/O. Keyword-based with confidence scoring and recommended mode/output style. | Path 2 |
| S5 | Session Export | session-management | lib/session-export.ts | Archive sessions to JSON files | Pure functions for generating exportable session data. Session existence check, load, prune operations. | Path 2 |
| S6 | Session Split | session-management | lib/session-split.ts | Auto-split long sessions | Detects when sessions exceed thresholds and triggers automatic session creation with continuity handoff. | Path 2 |
| S7 | Session Governance | session-management | lib/session-governance.ts | Session-level governance enforcement | Coordinates detection state, governance counters, and session locking. | Path 3 |
| S8 | Session Boundary | session-management | lib/session-boundary.ts | Session scope isolation | Enforces boundaries between main/sub/unresolved sessions. | Path 3 |
| S9 | Session Role | session-management | lib/session-role.ts | Role-based context resolution | Determines if session is human-facing or sub-agent, applies appropriate governance suppression. | Path 3 |
| S10 | Runtime Session Lineage | session-management | lib/runtime-session-lineage.ts | SDK-based session lineage resolution | Resolves session lineage from runtime SDK payload with caching. Extracts session kind, lineage scope, role source. | Path 2 |

### LIB — CONTEXT MANAGEMENT (6 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| C1 | Cognitive Packer | context-management | lib/cognitive-packer.ts | Compile all state into XML for system injection | Reads trajectory, graph tasks, plans, mems, codemap, and checklist into structured XML `<hivemind_state>` block. Budget-aware selection of sources via selective-injector. | Path 2 |
| C2 | Context Purifier | context-management | lib/context-purifier.ts | Deduplication and fingerprinting of context | Content normalization, SHA-256 fingerprinting, line-level deduplication, fragment classification. Pure functions. | Path 2 |
| C3 | Injection Orchestrator | context-management | lib/injection-orchestrator.ts | Budget-aware turn-level injection management | Two channels: core-system and core-message. Turn injection ledger with caps, TTL, priority ordering. Detects existing injection presence to avoid duplication. | Path 2 |
| C4 | Budget Manager | context-management | lib/budget.ts | Context window budget allocation | DEFAULT_CONTEXT_BUDGET=15360, INJECTION_BUDGET_PERCENT=0.15, MIN_SHARED_INJECTION_CAP=6000. Configurable. | Path 2 |
| C5 | Staleness Detection | context-management | lib/staleness.ts | Time-based relevance scoring for memory nodes | MS_PER_DAY calculations, configurable TTL, relevance scoring based on age and access patterns. | Path 2 |
| C6 | Long Session Detection | context-management | lib/long-session.ts | Detect when sessions exceed turn thresholds | Pure function. Returns LongSessionInfo with compact threshold, turn count, auto-compact trigger. | Path 2 |

### LIB — INTELLIGENCE ENGINES (16 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| I1 | AST Surgeon | intelligence-engine | lib/code-intel/ast-surgeon.ts | AST-aware code patching via tree-sitter | SkeletonMap extraction (imports, exports, signatures). patchSymbol() for targeted replacement without full file rewrite. | Path 1 |
| I2 | Compressed Codemap | intelligence-engine | lib/code-intel/compressed-codemap.ts | Token-efficient codebase representation | Signature objects: type, name, exported flag, params, return type. Language-aware extraction. ~70% token reduction vs full source. | Path 1 |
| I3 | Codemap I/O | intelligence-engine | lib/code-intel/codemap-io.ts | Read/write codemap files to disk | CodeMapEntry and CodeMap types with file-level signature storage. Persistence layer for code intelligence. | Path 2 |
| I4 | Doc Weaver | intelligence-engine | lib/code-intel/doc-weaver.ts | Heading-aware document section management | HeadingHierarchy, DocumentChunk structures. Insert/update sections by heading path. Format-agnostic weaver interface. | Path 1 |
| I5 | File Scanner | intelligence-engine | lib/code-intel/file-scanner.ts | Project file discovery with filtering | ScanOptions (legacy) and FullScanOptions (codemap). Gitignore-aware, binary detection, secret scanning integration. | Path 2 |
| I6 | Pattern Search | intelligence-engine | lib/code-intel/pattern-search.ts | Multi-criteria code pattern finder | PatternQuery with functionName, typeName, exportName, importSource. Returns match locations with context. | Path 1 |
| I7 | Selective Injector | intelligence-engine | lib/code-intel/selective-injector.ts | Budget-aware source code injection | SelectedFile with injection method (signature/full/range). Token cost tracking. Render as XML or markdown. | Path 2 |
| I8 | Signature Extractor | intelligence-engine | lib/code-intel/signature-extractor.ts | Language-aware function/type signature extraction | Language aliases, regex fallback when tree-sitter unavailable. Extract params, return types, export status. | Path 1 |
| I9 | Token Counter | intelligence-engine | lib/code-intel/token-counter.ts | Token estimation for context budgeting | cl100k_base encoding with deterministic fallback. countTokens(), countTokensForFile(). | Path 2 |
| I10 | Tree-Sitter Loader | intelligence-engine | lib/code-intel/tree-sitter-loader.ts | Lazy tree-sitter instance management | TreeSitterInstance interface with parse(), getLanguage(), isSupported(). Lazy loading pattern. | Path 2 |
| I11 | Incremental Updater | intelligence-engine | lib/code-intel/incremental-updater.ts | File change → codemap delta updates | UpdateResult with changed/added/removed files. UpdateListener pattern for reactive codemap updates. | Path 2 |
| I12 | Watch Integration | intelligence-engine | lib/code-intel/watch-integration.ts | File system watcher for codemap freshness | WatchIntegration interface with start()/stop(). Debounced change detection. | Path 2 |
| I13 | Binary Detector | intelligence-engine | lib/code-intel/binary-detector.ts | Skip binary files during scanning | Extension-based binary detection. | Path 2 |
| I14 | Secret Detector | intelligence-engine | lib/code-intel/secret-detector.ts | API key/credential detection | SecretMatch with type, file, line. Legacy compat (SecretFinding alias). | Path 3 |
| I15 | Gitignore Filter | intelligence-engine | lib/code-intel/gitignore-filter.ts | Respect .gitignore during scanning | Combines default patterns with project .gitignore. Uses `ignore` npm package. | Path 2 |
| I16 | Knowledge Commits | intelligence-engine | lib/code-intel/knowledge-commits.ts | Governance-traceable auto-commits | KnowledgeCommitOptions with taskId, [skip ci], message override. Commit = state snapshot. | Path 2 |

### LIB — DOCUMENT INTELLIGENCE (8 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| D1 | Format Weaver Interface | intelligence-engine | lib/doc-intel/types.ts | Abstract weaver for multi-format documents | FormatWeaver interface: parseHeadings(), readSection(), writeSection(), createDocument(). HeadingHierarchy and DocumentChunk types. | Path 2 |
| D2 | Markdown Weaver | intelligence-engine | lib/doc-intel/formats/md.ts | MDAST-based markdown operations | Uses mdast for AST-accurate heading extraction. estimateTokens(). Section body normalization. | Path 2 |
| D3 | JSON Weaver | intelligence-engine | lib/doc-intel/formats/json.ts | JSON document section operations | Parse JSON keys as "headings". Read/write nested paths. | Path 2 |
| D4 | XML Weaver | intelligence-engine | lib/doc-intel/formats/xml.ts | XML document section operations | Tag-based heading hierarchy. Attribute preservation. | Path 2 |
| D5 | YAML Weaver | intelligence-engine | lib/doc-intel/formats/yaml.ts | YAML document section operations | Key-based heading hierarchy. YAML safe-load/dump. | Path 2 |
| D6 | Read Ops | intelligence-engine | lib/doc-intel/read-ops.ts | Document skimming, chunking, search | DocumentSkim interface. TOC extraction, chunk-based reading, keyword search within documents. | Path 1 |
| D7 | Write Ops | intelligence-engine | lib/doc-intel/write-ops.ts | Safe document writing with governance | Batch edit operations, verification receipts, createDocument with template. WriteResult with success/failure per operation. | Path 2 |
| D8 | Safety Layer | intelligence-engine | lib/doc-intel/safety.ts | Path validation and governance boundary enforcement | WRITABLE_EXTENSIONS whitelist, DOCUMENT_EXTENSIONS detection, governance boundary checks. | Path 3 |

### LIB — GRAPH/KNOWLEDGE (6 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| G1 | FK Validator | graph-knowledge | lib/graph/fk-validator.ts | Foreign key validation across graph nodes | Validates tasks against trajectory, plans against trajectory, mems against tasks. Lifecycle lineage snapshots. | Path 3 |
| G2 | Graph Reader | graph-knowledge | lib/graph/reader.ts | Read graph state from disk | Loads tasks, mems, trajectory, plans. Orphan detection. Staleness calculation. | Path 2 |
| G3 | Graph Writer | graph-knowledge | lib/graph/writer.ts | Write graph state with invalidation | Save tasks, mems, trajectory, plans. Invalidation and reconciliation on write. File-locked writes. | Path 2 |
| G4 | Graph Shared | graph-knowledge | lib/graph/shared.ts | Shared graph utilities | Re-exports file lock, paths, manifest loading. Common types for graph operations. | Path 2 |
| G5 | Graph I/O | graph-knowledge | lib/graph-io.ts | High-level graph I/O facade | Unified read/write/validate for all graph node types. Orphan quarantine integration. FK validation coordination. | Path 2 |
| G6 | Orphan Quarantine | graph-knowledge | lib/orphan-quarantine.ts | Quarantine orphaned graph nodes | OrphanRecord with reason, detected_at, resolved. Parse failure signals. Version-stamped quarantine file. | Path 3 |

### LIB — GOVERNANCE/PATTERNS (14 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| P1 | Gatekeeper | governance-pattern | lib/gatekeeper.ts | Pre-action validation gate | GatekeeperViolation + GatekeeperResult. Validates session state before write operations. | Path 3 |
| P2 | State Mutation Queue | governance-pattern | lib/state-mutation-queue.ts | CQRS-compliant state mutation for hooks | Hooks queue mutations, tools flush. MutationType: UPDATE_STATE, UPDATE_HIERARCHY, etc. Atomic merge and save. Checksum verification. | Path 2 |
| P3 | Event Bus | governance-pattern | lib/event-bus.ts | In-process pub/sub for lifecycle events | InProcessEventBus extends EventEmitter. Singleton. ArtifactEvent typed events with max listeners. | Path 2 |
| P4 | Ideation Engine (Q.U.A.N.T.) | governance-pattern | lib/ideation-engine.ts | Spec clarity scoring (5 dimensions) | Q=Quantifiable Ambiguity, U=Unhappy Path Saturation (MECE 5-state), A=Architectural Grounding, N=Noun Resolution, T=TDD Materialization. Pure function. | Path 3 |
| P5 | Tool Activation Advisor | governance-pattern | lib/tool-activation.ts | Suggest tools based on session context | Drift score threshold, long session turns, ToolHint with priority. Context-aware tool recommendations. | Path 2 |
| P6 | Framework Context | governance-pattern | lib/framework-context.ts | Detect active development frameworks | FrameworkMode: gsd/spec-kit/both/none. Async detection with pathExists. FrameworkSelectionMenu for UI. | Path 4 |
| P7 | Planning Authority | governance-pattern | lib/planning-authority.ts | Date-stamped planning path management | ACTIVE_PHASE_INDEX_FILENAME with date stamps. PlanArchiveClassification. Migration path management. | Path 3 |
| P8 | Manifest (Core Relationships) | governance-pattern | lib/manifest.ts | Core node relationship tracing | CoreNode types, CoreRelation (governs/materializes). CoreMaterializationChain. Root-level manifest read/write with structure version. | Path 2 |
| P9 | Hierarchy Tree | governance-pattern | lib/hierarchy-tree.ts | Trajectory/tactic/action hierarchy tracking | HierarchyLevel with ContextStatus. File-handle-based persistence with locking. TimestampGap tracking. | Path 3 |
| P10 | Chain Analysis | governance-pattern | lib/chain-analysis.ts | Detect hierarchy chain breaks | ChainBreak detection: action without tactic, tactic without trajectory, stale links. Pure function. | Path 3 |
| P11 | SOT Governance | governance-pattern | lib/sot-governance.ts | Source-of-truth verification ledger | VerificationLedgerEntry with artifact path, hash, timestamp, verified_by. Ledger state management. | Path 3 |
| P12 | Tool Response Envelope | governance-pattern | lib/tool-response.ts | Standard tool output format | toSuccessOutput/toErrorOutput wrappers. Consistent tool response structure. | Path 1 |
| P13 | Entity Checklist | governance-pattern | lib/entity-checklist.ts | Pre-action entity validation | Checklist items with pass/warn/fail. Evaluation against governance constitution. | Path 3 |
| P14 | Auto-Commit | governance-pattern | lib/auto-commit.ts | Deterministic auto-commit decisions | shouldAutoCommit() with context-based decision. BunShell integration. Modified file extraction. | Path 2 |

### SCHEMAS (12 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| Z1 | Brain State Schema | schema-pattern | schemas/brain-state.ts | Central session state definition | SessionMode, GovernanceStatus, SessionKind, LineageScope, RoleSource, FieldLifecycle (runtime/persistent/hybrid). SessionState with all tracking fields. | Path 2 |
| Z2 | Config Schema | schema-pattern | schemas/config.ts | Governance and behavior configuration | GovernanceMode (permissive/assisted/strict), AutomationLevel, ExpertLevel, OutputStyle (5 variants), V29OutputStyle. Legacy migration map. | Path 4 |
| Z3 | Event Schema | schema-pattern | schemas/events.ts | Typed lifecycle events | ArtifactEventType enum, CodemapUpdatedEvent, artifact change tracking. Zod schemas for all events. | Path 2 |
| Z4 | Graph State Schema | schema-pattern | schemas/graph-state.ts | Graph node state containers | TrajectoryState, PlansState, GraphTasksState, GraphMemsState, ProjectsState. All Zod-validated. | Path 2 |
| Z5 | Graph Nodes Schema | schema-pattern | schemas/graph-nodes.ts | Graph node type definitions | UnifiedStatus, PlanningLifecycleLevel, RalphUserStory. FK-ready node definitions with export_id. | Path 2 |
| Z6 | Governance Constitution | schema-pattern | schemas/governance-constitution.ts | Constitutional rules and entity checklists | ConstitutionalRule with severity, scope, enforcement. EntityChecklistItem with pass/warn/fail criteria. | Path 3 |
| Z7 | Session Kernel Schema | schema-pattern | schemas/session-kernel.ts | Session bootstrap and integrity state | KERNEL_STATE_VERSION=3.0.0. KernelBootHealth, KernelIntegrityGrade, KernelBranchStatus, KernelSessionStatus. Lineage enum (hivefiver/hiveminder). | Path 2 |
| Z8 | Session Profile Schema | schema-pattern | schemas/session-profile.ts | Session identity and scope definition | SessionProfileSchema with lineage, kind, scope, role. SessionProfileSeed for creation. | Path 2 |
| Z9 | Skill Registry Schema | schema-pattern | schemas/skill-registry.ts | Skill metadata and progressive disclosure | ProgressiveDisclosureLevel (L0-L3), SkillBundle enum, SkillStatus (active/experimental/deprecated), SkillMetadata with tags and load rules. | Path 3 |
| Z10 | Manifest Schema | schema-pattern | schemas/manifest.ts | Task and workflow tracking | TaskLineageOwner, TaskSessionKind, TaskWorkflowTopology. TaskItem with dependencies, evidence, status. | Path 2 |
| Z11 | Ideation State Schema | schema-pattern | schemas/ideation-state.ts | Ideation/brainstorming state | FeatureStateMatrix, IdeationRequirement, IdeationSpec. Structured ideation with quantifiable clarity. | Path 1 |
| Z12 | Delegation Packet Schema | schema-pattern | schemas/delegation-packet.ts | Structured delegation instructions | DelegationEvidenceItem, DelegationScope, DelegationFailurePolicy, DelegationPacket with constraints. | Path 2 |

### TOOLS (16 concepts)

| # | Concept Name | Category | Source File | Purpose | Pattern Summary | Path |
|---|-------------|----------|------------|---------|-----------------|------|
| T1 | hivemind-session | tool-concept | tools/hivemind-session.ts | Session state management tool | Sync trajectory to graph, session lifecycle operations. Core session tool. | Path 1 |
| T2 | hivemind-inspect | tool-concept | tools/hivemind-inspect.ts | Codebase inspection and analysis | Inspect code structure, dependencies, patterns. Read-only analysis tool. | Path 1 |
| T3 | hivemind-memory | tool-concept | tools/hivemind-memory.ts | Memory shelving and retrieval | BUILTIN_SHELVES: decisions, patterns, errors, solutions, context. Graph-backed with search. FK-validated. | Path 1 |
| T4 | hivemind-anchor | tool-concept | tools/hivemind-anchor.ts | Context anchoring and bookmarking | Anchor points for session continuity. FK chaining support. JSON response format. | Path 1 |
| T5 | hivemind-hierarchy | tool-concept | tools/hivemind-hierarchy.ts | Hierarchy chain management | Manage trajectory/tactic/action levels. Validate chain integrity. | Path 1 |
| T6 | hivemind-cycle | tool-concept | tools/hivemind-cycle.ts | Session export lifecycle | export (archive), list (show exports), prune (delete old). Session management. | Path 1 |
| T7 | hivemind-context | tool-concept | tools/hivemind-context.ts | Context state reader | Read current brain state, governance counters, drift score. State manager access. | Path 1 |
| T8 | hivemind-codemap | tool-concept | tools/hivemind-codemap.ts | Codebase map generation | Generate/update compressed codemap. File scanning + signature extraction. | Path 1 |
| T9 | hivemind-ideate | tool-concept | tools/hivemind-ideate.ts | Structured ideation and spec evaluation | Q.U.A.N.T. clarity scoring, feature state matrix, requirement validation. | Path 1 |
| T10 | hivemind-read-skeleton | tool-concept | tools/hivemind-read-skeleton.ts | AST skeleton extraction | Returns imports, exports, signatures, token counts via tree-sitter. | Path 1 |
| T11 | hivemind-precision-patch | tool-concept | tools/hivemind-precision-patch.ts | AST-aware code patching | Target symbol by name, patch via tree-sitter without full file rewrite. | Path 1 |
| T12 | hivemind-declare | tool-concept | tools/hivemind-declare.ts | Agent declaration at turn start | AgentDeclaration: role, mode, context state, confidence, intent. Establishes session clarity before action. | Path 1 |
| T13 | hivemind-plan | tool-concept | tools/hivemind-plan.ts | Planning state management | Phase/requirement tracking with validation. Plan lifecycle operations. | Path 1 |
| T14 | hiveops-gate | tool-concept | tools/hiveops-gate.ts | Quality gate check/pass/status | G0-G5 gate definitions with criteria. GateRecord with evidence, status, failure reasons. Agent-driven gate system. | Path 3 |
| T15 | hiveops-sot | tool-concept | tools/hiveops-sot.ts | Source-of-truth artifact registry | SotArtifact with id, path, tags, domain, type, parent/children. Tag index for search. Staleness tracking (48h threshold). | Path 3 |
| T16 | hiveops-todo | tool-concept | tools/hiveops-todo.ts | Task state machine (add/complete/start/block/cancel/list/deps/export) | LegacyTodoItem with status, priority, hierarchy_node_id, depends_on, blocks, workflow_topology, domain, plan_id, evidence. MAX_ACTIVE_ITEMS=40. | Path 1 |

---

## TOP 20 Most Valuable Concepts for Re-implementation

Ranked by value to the new harness redesign:

| Rank | Concept | Why Valuable | Path |
|------|---------|-------------|------|
| 1 | **CQRS State Mutation Queue** (P2) | Solves the fundamental hook write-safety problem. Current harness doesn't have this. Critical for governance hooks. | Path 2 |
| 2 | **Cognitive Packer / Context Compiler** (C1) | Compiles all state into structured XML for system injection. Current harness has no equivalent. Essential for context-aware behavior. | Path 2 |
| 3 | **Injection Orchestrator** (C3) | Budget-aware, channel-based injection with ledger tracking. Sophisticated context management pattern. | Path 2 |
| 4 | **Session Intent Classifier** (S4) | Auto-classifies sessions into 6 categories. Current harness has intent-classifier but simpler. Keyword-based classification is proven pattern. | Path 2 |
| 5 | **Tool Gate / Tool Policies** (H3) | Role-based tool access with tier classification (universal/workflow/deterministic). Current harness lacks this governance layer. | Path 3 |
| 6 | **Q.U.A.N.T. Ideation Clarity Engine** (P4) | 5-dimension spec quality scoring. Weasel word detection, MECE state matrix, noun resolution. Unique pattern. | Path 3 |
| 7 | **Document Intelligence Weavers** (D1-D5) | Format-agnostic document operations with safety layer. Current harness has hivemind-doc but not this structured. | Path 2 |
| 8 | **Graph FK Validation** (G1) | Foreign key integrity across graph nodes. Current harness has no graph layer. Essential for knowledge base. | Path 3 |
| 9 | **Quality Gate System** (T14) | G0-G5 gate definitions with criteria, evidence, status tracking. Current harness has gate skills but not tool-level gates. | Path 3 |
| 10 | **Compressed Codemap** (I2) | Token-efficient codebase representation via signatures. ~70% token reduction. Current harness has codemap.ts but could be enhanced. | Path 1 |
| 11 | **Agent Declaration** (T12) | Structured context declaration at turn start (role, mode, confidence, intent). Unique self-awareness pattern. | Path 1 |
| 12 | **Soft Governance Counter Engine** (H2) | Tracks 15+ governance metrics per session without blocking execution. Diagnostic pattern. | Path 2 |
| 13 | **Session Kernel Bootstrap** (S1) | Boot health check, integrity grading, branch status. Current harness has lifecycle-manager but no health grading. | Path 2 |
| 14 | **Staleness Detection** (C5) | Time-based relevance scoring for memory/knowledge nodes. Important for long-running sessions. | Path 2 |
| 15 | **Orphan Quarantine** (G6) | Quarantine orphaned graph nodes rather than deleting. Recovery-friendly approach. | Path 3 |
| 16 | **Selective Injector** (I7) | Budget-aware source code selection with token tracking. Smart context management. | Path 2 |
| 17 | **Chain Break Detection** (P10) | Detects hierarchy chain breaks (action without tactic, etc.). Governance pattern. | Path 3 |
| 18 | **SOT Artifact Registry** (T15) | Tagged artifact registry with staleness tracking and parent/child relationships. Knowledge management. | Path 3 |
| 19 | **Brain State Field Lifecycle** (Z1) | Runtime/persistent/hybrid field classification for session state. Smart serialization. | Path 2 |
| 20 | **Skill Registry with Progressive Disclosure** (Z9) | L0-L3 disclosure levels, skill bundles, status tracking. Current harness has skills but no registry schema. | Path 3 |

---

## Concepts to NOT Re-implement (Outdated/Unnecessary)

| Concept | Source | Why Skip |
|---------|--------|----------|
| Brain State as monolithic JSON | schemas/brain-state.ts | Too large, couples everything. New harness uses modular state (continuity.ts + session-journal.ts) |
| Ralph Bridge | lib/bridges/ralph-bridge.ts | Legacy auto-loop. New harness has ralph-loop.ts with cleaner design |
| V29 Output Style migration | schemas/config.ts | Legacy compatibility layer. Not needed in clean redesign |
| HiveOps Export (tool version) | tools/hiveops-export.ts | Superseded by session-journal-export.ts in new harness |
| Config re-read from disk every hook call | H10 | Performance issue. New harness uses runtime-policy.ts with proper caching |
| Knowledge Commits | lib/code-intel/knowledge-commits.ts | Coupled to old governance model. New harness has cleaner auto-commit patterns |
| MECE 5-state matrix as hard requirement | lib/ideation-engine.ts | Over-engineered for most use cases. Keep as optional scoring, not gate |
| LSP Bridge | lib/code-intel/lsp-bridge.ts | Requires running LSP server. New harness should use AST tools directly |
| Toast Throttle | lib/toast-throttle.ts | UI-specific pattern from legacy dashboard. Not applicable to plugin architecture |
| File Lock (generic) | lib/file-lock.ts | New harness uses Bun/Node native file locking through continuity.ts |
| HiveOps Paths (separate from paths.ts) | lib/hiveops-paths.ts | Redundant path management. New harness uses unified path resolution |
| HiveMind Ingress Policy | lib/hivemind-ingress-policy.ts | Overly complex for plugin architecture. New harness has simpler intake-gate.ts |
| Doc Intel (standalone module) | lib/doc-intel.ts | Top-level re-export. Fold into tool implementation directly |
| HiveFiver Integration/Intake | lib/hivefiver-*.ts | Coupled to old meta-framework pattern. New harness has cleaner primitive-loader |
| Tree-sitter direct dependency | lib/code-intel/tree-sitter-loader.ts | Heavy native dependency. Use regex-based extraction or external tools |
| Session Memory Purge | lib/session-memory-purge.ts | Over-engineered. New harness handles this through compaction-preservation.ts |
| Session Coherence as separate module | lib/session_coherence.ts + hooks/session_coherence/ | Better handled by messages-transform.ts in new harness |
| GraphQL-style node definitions | schemas/graph-nodes.ts | Over-abstracted for current needs. Keep simpler task/delegation types |

---

## UNIQUE Patterns NOT Found in Current `src/`

| Pattern | Legacy Source | Status in Current Harness | Recommendation |
|---------|--------------|--------------------------|----------------|
| CQRS State Mutation Queue | lib/state-mutation-queue.ts | **MISSING** | High priority — fundamental for hook safety |
| Cognitive Packer (XML state injection) | lib/cognitive-packer.ts | **MISSING** | High priority — context awareness |
| Injection Orchestrator (budget-aware) | lib/injection-orchestrator.ts | **MISSING** | High priority — context budget management |
| Q.U.A.N.T. Clarity Scoring | lib/ideation-engine.ts | **MISSING** | Medium priority — useful for spec validation |
| Agent Declaration Protocol | tools/hivemind-declare.ts | **MISSING** | Medium priority — self-awareness pattern |
| Tool Tier Classification (universal/workflow/deterministic) | hooks/tool-gate.ts | **MISSING** | High priority — governance foundation |
| FK Validation across graph nodes | lib/graph/fk-validator.ts | **MISSING** | Medium priority — knowledge integrity |
| Progressive Disclosure (L0-L3) for skills | schemas/skill-registry.ts | **MISSING** | Low priority — nice-to-have for skill system |
| Format Weaver interface (multi-format doc ops) | lib/doc-intel/types.ts | **PARTIAL** (hivemind-doc exists) | Medium priority — extend existing tool |
| Orphan Quarantine for graph nodes | lib/orphan-quarantine.ts | **MISSING** | Low priority — needed if graph layer added |
| Brain State Field Lifecycle (runtime/persistent/hybrid) | schemas/brain-state.ts | **MISSING** | Medium priority — smart serialization |
| Session Intent Classifier (6 categories) | lib/session-intent-classifier.ts | **PARTIAL** (intent-classifier exists) | Medium priority — enhance existing |
| SOT Artifact Registry with tagging | tools/hiveops-sot.ts | **MISSING** | Low priority — knowledge management |
| Chain Break Detection | lib/chain-analysis.ts | **MISSING** | Low priority — governance pattern |
| Staleness Scoring with TTL | lib/staleness.ts | **MISSING** | Medium priority — memory management |
| Session Kernel Health Grading (A-F) | lib/session-kernel.ts | **MISSING** | Medium priority — diagnostic capability |

---

## Verification Summary

| Metric | Count |
|--------|-------|
| Total files analyzed | 127 |
| Total concepts extracted | 84 |
| Hook concepts | 12 |
| Session management concepts | 10 |
| Context management concepts | 6 |
| Intelligence engine concepts | 16 |
| Document intelligence concepts | 8 |
| Graph/knowledge concepts | 6 |
| Governance/pattern concepts | 14 |
| Schema concepts | 12 |
| Tool concepts | 16 |
| Concepts mapped to Path 1 (tools) | 24 |
| Concepts mapped to Path 2 (runtime) | 36 |
| Concepts mapped to Path 3 (governance) | 18 |
| Concepts mapped to Path 4 (side-car) | 3 |
| Unmapped concepts | 0 (all 84 mapped) ✅ |
| Unique patterns missing from current harness | 16 |
| Concepts recommended for re-implementation | 20 |
| Concepts recommended to skip | 18 |
