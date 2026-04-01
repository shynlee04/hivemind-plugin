# LSP Refactor Workflows

Use these workflows when the refactor needs symbol-aware impact analysis. All examples assume the OpenCode `lsp` tool is enabled with `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`.

## Workflow 1: Dependency Tracing with `goToDefinition`

### Goal

Confirm where a symbol is declared before renaming, moving, or extracting it.

### Steps

1. Place the cursor on the target symbol in the current file.
2. Run `goToDefinition`.
3. Read the declaration and confirm ownership.
4. Check the import path around the definition for dependency direction.

### Example

```json
{
  "operation": "goToDefinition",
  "filePath": "src/orders/service.ts",
  "position": { "line": 42, "character": 14 }
}
```

### Use it for

- rename safety
- move validation
- finding the true owning module

## Workflow 2: Impact Analysis with `findReferences`

### Goal

List all read/write or call-site usages before touching a symbol.

### Steps

1. Run `findReferences` on the target declaration.
2. Group results by file.
3. Compare the result set with the planned `files_affected` list.
4. Stop if unplanned consumers appear.

### Example

```json
{
  "operation": "findReferences",
  "filePath": "src/orders/service.ts",
  "position": { "line": 42, "character": 14 }
}
```

### Review rule

If `findReferences` returns more files than the refactor plan lists, update the plan first.

## Workflow 3: Dead Code Detection with Call Hierarchy

### Goal

Find functions or methods that may be orphaned before removing or inlining them.

### Steps

1. Run `prepareCallHierarchy` on the candidate symbol.
2. Use the returned item with `incomingCalls`.
3. Confirm whether there are real internal callers.
4. Cross-check exported symbols with `findReferences` or `grep`.

### Example 1: Prepare hierarchy

```json
{
  "operation": "prepareCallHierarchy",
  "filePath": "src/orders/helpers.ts",
  "position": { "line": 18, "character": 9 }
}
```

### Example 2: Incoming calls

```json
{
  "operation": "incomingCalls",
  "filePath": "src/orders/helpers.ts",
  "position": { "line": 18, "character": 9 }
}
```

### Pass condition

Treat zero incoming calls as a removal candidate only after checking exports and tests.

## Workflow 4: Structure Analysis with `documentSymbol`

### Goal

Inspect file structure before extracting, splitting, or collapsing code.

### Steps

1. Run `documentSymbol` on the target file.
2. Note top-level functions, classes, methods, and nested symbols.
3. Identify long files, multi-purpose modules, and oversized classes.
4. Use the outline to pick the smallest safe seam.

### Example

```json
{
  "operation": "documentSymbol",
  "filePath": "src/orders/service.ts"
}
```

### Signals to watch

- one file owns several unrelated concerns
- one class contains multiple vertical slices
- helper functions are buried and should move or extract

## Workflow 5: Rename Execution Guardrail

### Sequence

1. `goToDefinition` — confirm canonical declaration.
2. `findReferences` — count the full blast radius.
3. Perform rename.
4. `findReferences` on the old name via `grep` — confirm no stale references.
5. Run `npx tsc --noEmit` and `npm test`.

## Workflow 6: Move Refactor Guardrail

### Sequence

1. `documentSymbol` — understand current module contents.
2. `findReferences` — map all importers.
3. Move the symbol to the new owner.
4. `goToDefinition` from one caller — confirm import rewiring.
5. Run type, test, lint, and build verification.

## Workflow 7: Replace Conditional with Polymorphism Guardrail

### Sequence

1. Use `grep` to locate the condition tree.
2. Use `documentSymbol` to inspect current host structure.
3. Use `findReferences` to find callers that depend on current branching output.
4. Introduce the shared interface/base type.
5. Re-run `findReferences` on old branch helpers to ensure no stragglers remain.

## Suggested Fallbacks When LSP Is Unavailable

| Need | LSP tool | Fallback |
|---|---|---|
| Definition | `goToDefinition` | `grep` for declaration pattern + `read` |
| References | `findReferences` | `grep` by symbol name |
| Dead code | `incomingCalls` | `grep` for direct callers plus export scan |
| Structure | `documentSymbol` | `read` file outline manually |

## Verification Pairing

Pair every LSP-assisted refactor with these commands:

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
```
