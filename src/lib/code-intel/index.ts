// Code Intelligence Engine — barrel exports

// Gitignore + binary detection
export { createGitignoreFilter } from "./gitignore-filter.js"
export { isBinaryPathSafe } from "./binary-detector.js"

// Secret detection
export { detectSecrets, hasSecrets, getSecretTypes, detectSecretsLegacy } from "./secret-detector.js"
export type { SecretMatch, SecretFinding } from "./secret-detector.js"

// Token counting
export { countTokens, countTokensForFile, getEncoding } from "./token-counter.js"

// File scanning (legacy + full)
export { scanFilesToCodeMap, scanToFullCodeMap, detectLanguage } from "./file-scanner.js"
export type { ScanOptions, FullScanOptions } from "./file-scanner.js"

// Codemap I/O (new + legacy)
export { createEmptyCodeMap, saveCodeMap, loadCodeMap, computeCodeMapStats, scanProjectToCodeMap, loadCodeMapFromDir } from "./codemap-io.js"
export type { CodeMap, CodeMapEntry } from "./codemap-io.js"

// Phase 2 — Tree-sitter loader
export { createTreeSitterFactory, createTreeSitterLoader, extensionToLanguage, getSupportedExtensions } from "./tree-sitter-loader.js"
export type { TreeSitterInstance, TreeSitterNode, TreeSitterFactory } from "./tree-sitter-loader.js"

// Phase 2 — Signature extraction (AST + regex fallback)
export { extractSignatures, extractImportsRegex, extractExportsRegex } from "./signature-extractor.js"
export type { ExtractSignaturesInput } from "./signature-extractor.js"
export type { Signature, Parameter } from "./signature-extractor.js"

// Phase 2 — Compressed codemap
export { compressCodemap, compressSingleFile, renderCompressedCodemap, createEmptyCompressedCodemap, computeCompressionRatio } from "./compressed-codemap.js"
export type { CompressedCodemap, CompressedFileInfo, CompressOptions } from "./compressed-codemap.js"

// Phase 2 — Incremental updater
export { IncrementalUpdater } from "./incremental-updater.js"
export type { UpdateResult, UpdateListener } from "./incremental-updater.js"

// Phase 2 — Watch integration (watcher → updater → event-bus)
export { startWatchIntegration } from "./watch-integration.js"
export type { WatchIntegration, WatchStatus, WatchIntegrationOptions } from "./watch-integration.js"

// Phase 3 — Selective source injector (file_locks → context injection)
export { selectSourceForInjection, renderSourceSelectionXml } from "./selective-injector.js"
export type { SourceSelection, SelectedFile } from "./selective-injector.js"

// Phase 3 — Pattern-first search (signatures without full file reads)
export { searchPatterns, findFunction, findType, findExport, findByPattern, findImporters } from "./pattern-search.js"
export type { PatternQuery, PatternMatch } from "./pattern-search.js"

// Phase 3 — Knowledge commits (atomic git commits for code-intel state)
export { commitKnowledgeState, hasKnowledgeChanged, getLastKnowledgeCommit } from "./knowledge-commits.js"
export type { KnowledgeCommitOptions, KnowledgeCommitResult, LastKnowledgeCommit } from "./knowledge-commits.js"
