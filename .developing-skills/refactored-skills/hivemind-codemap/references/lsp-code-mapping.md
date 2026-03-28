# LSP Code Mapping Reference

## Goal

Use semantic navigation before falling back to text search when mapping ownership, call flow, or seam boundaries.

## Recommended Operations

| Need | Tool | Example |
| --- | --- | --- |
| Definition owner | `lsp.goToDefinition` | symbol under cursor → defining file |
| All usages | `lsp.findReferences` | exported function → caller map |
| Local structure | `lsp.documentSymbol` | file outline before detailed reads |
| Workspace search | `lsp.workspaceSymbol` | class or interface by exact name |

## IF/THEN Routing

1. **IF** the repository has working LSP servers, **THEN** use `lsp` before `grep` for symbol tracing.
2. **IF** LSP is unavailable or the language server fails, **THEN** fall back to `grep` for call-site discovery.
3. **IF** the repo is remote-only, **THEN** use `repomix_pack_remote_repository` or `deepwiki_ask_question` before guessing structure.

## Remote Repo Escalation

- `repomix_pack_remote_repository` for full repo packing
- `deepwiki_read_wiki_structure` for indexed repo navigation
- `gitmcp_search_github_com_code` for targeted public GitHub search

## Example Flow

1. `glob` to locate candidate files.
2. `lsp.documentSymbol` to outline the file.
3. `lsp.goToDefinition` on key seam interfaces.
4. `lsp.findReferences` to map consumers.
5. `grep` only for cross-check or when LSP misses dynamic usages.
