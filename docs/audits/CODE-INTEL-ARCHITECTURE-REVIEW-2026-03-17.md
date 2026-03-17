# Expert Architectural Review: Document & Code Intelligence Modernization

**Date:** 2026-03-17
**Scope:** Review of proposed architecture drafts (`docs/planning-draft/modernize-doc-intelligence-layer.md` and `docs/synthesis/ADVANCED-TOOLS-CODE-INTEL.md`) against OpenCode SDK best practices.

## Executive Summary

The proposed modernization plans outline a highly sophisticated shift from naive text-based document parsing to a deterministic, AST-backed intelligence layer. 

The strategy to split the legacy monolith into three focused tool families (`hivemind-doc`, `hivemind-handoff`, `hivemind-inspect`) and introduce a `web-tree-sitter` backed `code-intel` module is **conceptually sound and aligns perfectly with 2026 agentic best practices.**

However, an audit of the current `src/` directory reveals that this architecture is purely aspirational. The `src/lib/code-intel/` directory does not exist, and the current `hivemind_doc` tool still relies on naive string matching. 

This review validates the proposed design and provides strict guidelines for implementing it using the OpenCode SDK.

---

## 1. Validation of the Proposed Architecture

### A. The Three-Pillar Strategy (Valid)
The `modernize-doc-intelligence-layer.md` proposes splitting concerns:
1. **`hivemind-doc`**: CRUD, chunking, and metadata parsing for standard text/markdown files.
2. **`hivemind-handoff`**: State preservation and delegation records for sub-agent continuity.
3. **`hivemind-inspect`**: Structural inspection of code and documents.

**Architectural Verdict: PASS.** 
This is an excellent CQRS (Command Query Responsibility Segregation) boundary. It prevents the primary agent from loading a monolithic tool that consumes excessive context window space with unused arguments.

### B. AST-Backed Code Intelligence (Valid & Critical)
The `ADVANCED-TOOLS-CODE-INTEL.md` proposes using `web-tree-sitter` to extract byte-perfect `startIndex` and `endIndex` coordinates for code signatures (functions, classes, interfaces).

**Architectural Verdict: PASS.** 
In 2026, regex-based code modification by AI agents is an anti-pattern. Agents frequently break syntax when applying naive diffs to complex files. Capturing exact AST offsets enables the use of `magic-string` for surgical, byte-perfect patches. This is a best-in-class approach.

---

## 2. Integration with OpenCode SDK (The Missing Links)

The draft documents describe *what* to build, but they miss crucial details on *how* to wire this safely into the OpenCode SDK (`@opencode-ai/plugin`). When implementing `code-intel` and `hivemind-inspect`, the team must adhere to the following OpenCode-native patterns:

### A. Strict Zod Schemas (`tool.schema`)
The new tools must define their inputs rigorously. For example, the `hivemind-inspect` tool should expose an AST query interface:

```typescript
args: {
  action: tool.schema.enum(['ast_outline', 'ast_read_symbol', 'ast_find_references']),
  filePath: tool.schema.string(),
  symbolName: tool.schema.string().optional(),
}
```

### B. Wiring `context.abort` to WASM Execution
`web-tree-sitter` is extremely fast, but loading the WASM binary and parsing massive files (e.g., minified bundles) can occasionally hang the thread.
**Actionable Requirement:** The `TreeSitterFactory` proposed in the draft MUST be wired to the OpenCode `ToolContext.abort` signal. If the agent cancels the request or a timeout is reached, the WASM execution must yield.

### C. Replacing Legacy Search with Native SDK Capabilities
The draft proposes maintaining internal search capabilities. 
**Actionable Requirement:** Before building custom grep/glob logic in `hivemind-doc`, the team must evaluate OpenCode's native `client.find.text()` and `client.find.files()`. A custom tool should only be built if it wraps these native clients with specific project context (e.g., automatically filtering out `.gitignore` and `.hivemind/state`).

---

## 3. Implementation Roadmap & Guardrails

To transition from the current naive state to the AST-backed architecture, follow this strict sequence:

### Phase 1: The Foundation (WASM & Interfaces)
1. Install the required dependencies: `web-tree-sitter`, `magic-string`.
2. Implement `src/intelligence/code/tree-sitter-loader.ts` EXACTLY as defined in the `ADVANCED-TOOLS-CODE-INTEL.md` draft, ensuring `startIndex` and `endIndex` are mapped.
3. *Do not expose this to the LLM yet.* Write purely programmatic unit tests to verify the AST parsing.

### Phase 2: The Inspection Tool (`hivemind-inspect`)
1. Create `src/tools/inspect/tools.ts`.
2. Expose a read-only tool that uses the new `code-intel` layer to return a compressed, AST-generated outline of a file. 
3. *Benefit:* This immediately reduces token consumption for the LLM when exploring large files, without risking code corruption.

### Phase 3: The Surgical Patcher
1. Once inspection is stable, implement `ast-surgeon.ts` using `magic-string`.
2. Expose an `ast_patch` action that takes a `filePath`, a `symbolName`, and the `newCode`. The tool will use TreeSitter to find the exact byte offsets of the symbol and replace it cleanly.

### Phase 4: Migration & Pruning
1. Deprecate the legacy regex-based read/write tools.
2. Formally split out `hivemind-handoff` to handle the `.hivemind/state` serialization, completely decoupling "code reading" from "session state tracking."

## Conclusion
The architectural drafts are brilliant and represent the correct evolution for a mature AI agent framework. The immediate next step is to stop writing planning documents and begin executing **Phase 1**, strictly binding the new logic to the `@opencode-ai/plugin` context and Zod schemas.