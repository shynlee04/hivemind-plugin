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

// Phase 2 stubs (tree-sitter)
export { createTreeSitterLoader } from "./tree-sitter-loader.js"
export { extractSignatures } from "./signature-extractor.js"
