# RFC 6902 JSON Patch Patterns for Agent-Work-Contract

**Analysis Date:** 2026-03-20
**Source:** json-render codebase patterns
**Purpose:** Technical reference for progressive contract construction

---

## Executive Summary

The json-render library implements RFC 6902 JSON Patch streaming for progressive AI-generated specification building. This document captures the core patterns transferable to HiveMind's agent-work-contract system.

---

## 1. JSON Patch Operations (RFC 6902)

### Standard Operations

| Operation | Required Fields | Description |
|-----------|----------------|-------------|
| `add` | `op`, `path`, `value` | Add value at path (creates parent objects as needed) |
| `remove` | `op`, `path` | Remove value at path |
| `replace` | `op`, `path`, `value` | Replace existing value |
| `move` | `op`, `path`, `from` | Move value from `from` to `path` |
| `copy` | `op`, `path`, `from` | Copy value from `from` to `path` |
| `test` | `op`, `path`, `value` | Test that value at path equals `value` (throws on mismatch) |

### Type Definition

```typescript
/**
 * RFC 6902 JSON Patch Operation
 * @see https://datatracker.ietf.org/doc/html/rfc6902
 */
export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;        // JSON Pointer path (e.g., "/elements/main")
  value?: unknown;     // Value for add, replace, test
  from?: string;       // Source path for move, copy
}
```

### Path Syntax

```typescript
// JSON Pointer (RFC 6901) paths
"/root"           // top-level property
"/elements/main"  // nested property
"/items/0"        // array index
"/items/-"        // append to array (special)
"/data/~field"    // escaped ~ (encoded as ~0, / as ~1)
```

---

## 2. Core Patch Application Algorithm

### Implementation Pattern

```typescript
/**
 * Apply a single JSON Patch operation to an object.
 * Mutates the object in place and returns it for chaining.
 * 
 * @param obj Target object to patch
 * @param patch Single JSON Patch operation
 * @returns Mutated object
 * @throws Error if path is invalid or test fails
 */
export function applySpecStreamPatch<T extends Record<string, unknown>>(
  obj: T,
  patch: JsonPatch,
): T {
  switch (patch.op) {
    case 'add':
      addByPath(obj, patch.path, patch.value);
      break;
      
    case 'replace':
      setByPath(obj, patch.path, patch.value);
      break;
      
    case 'remove':
      removeByPath(obj, patch.path);
      break;
      
    case 'move':
      const moveValue = getByPath(obj, patch.from!);
      removeByPath(obj, patch.from!);
      addByPath(obj, patch.path, moveValue);
      break;
      
    case 'copy':
      const copyValue = getByPath(obj, patch.from!);
      addByPath(obj, patch.path, copyValue);
      break;
      
    case 'test':
      if (!deepEqual(getByPath(obj, patch.path), patch.value)) {
        throw new Error(
          `JSON Patch test failed at path ${patch.path}: ` +
          `expected ${JSON.stringify(patch.value)}, ` +
          `got ${JSON.stringify(getByPath(obj, patch.path))}`
        );
      }
      break;
  }
  
  return obj;
}
```

### Path Operations

```typescript
/**
 * Parse JSON Pointer path into segments.
 */
function parsePath(path: string): string[] {
  if (!path.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer: ${path} (must start with /)`);
  }
  return path
    .slice(1)
    .split('/')
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/**
 * Get value at JSON Pointer path.
 */
function getByPath(obj: unknown, path: string): unknown {
  const segments = parsePath(path);
  let current: unknown = obj;
  
  for (const segment of segments) {
    if (current === null || current === undefined) {
      throw new Error(`Path traversal failed at ${segment}: null/undefined`);
    }
    
    if (Array.isArray(current)) {
      const index = segment === '-' ? current.length - 1 : parseInt(segment, 10);
      current = current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new Error(`Cannot traverse non-object/array at segment ${segment}`);
    }
  }
  
  return current;
}

/**
 * Add value at path, creating parent objects as needed.
 */
function addByPath(obj: unknown, path: string, value: unknown): void {
  const segments = parsePath(path);
  const lastSegment = segments.pop()!;
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  
  // Navigate/create parent path
  for (const segment of segments) {
    if (!(segment in current)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  
  // Handle array append
  if (Array.isArray(current) && lastSegment === '-') {
    current.push(value);
  } else {
    current[lastSegment] = value;
  }
}

/**
 * Set value at path (replace existing or add new).
 */
function setByPath(obj: unknown, path: string, value: unknown): void {
  const segments = parsePath(path);
  const lastSegment = segments.pop()!;
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  
  for (const segment of segments) {
    current = current[segment] as Record<string, unknown>;
  }
  
  current[lastSegment] = value;
}

/**
 * Remove value at path.
 */
function removeByPath(obj: unknown, path: string): void {
  const segments = parsePath(path);
  const lastSegment = segments.pop()!;
  let current: Record<string, unknown> = obj as Record<string, unknown>;
  
  for (const segment of segments) {
    current = current[segment] as Record<string, unknown>;
  }
  
  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    current.splice(index, 1);
  } else {
    delete current[lastSegment];
  }
}
```

---

## 3. Stream Compiler Pattern

### SpecStreamCompiler Interface

```typescript
/**
 * Compiler for progressive JSON Patch application.
 * Handles streaming patches from LLM output with incremental state updates.
 */
export interface SpecStreamCompiler<T> {
  /**
   * Push a text chunk to the compiler.
   * Parses and applies any completepatch lines.
   * 
   * @param chunk Text chunk (may contain multiple lines)
   * @returns Updated result and newly applied patches
   */
  push(chunk: string): { result: T; newPatches: JsonPatch[] };
  
  /**
   * Get the current compiled result.
   * Flushes any remaining buffer before returning.
   */
  getResult(): T;
  
  /**
   * Get all applied patches since creation or last reset.
   */
  getPatches(): JsonPatch[];
  
  /**
   * Reset compiler state with optional new initial value.
   */
  reset(initial?: Partial<T>): void;
}
```

### Compiler Implementation

```typescript
export function createSpecStreamCompiler<T = Record<string, unknown>>(
  initial: Partial<T> = {},
): SpecStreamCompiler<T> {
  // Internal state
  let result = { ...initial } as T;
  let buffer = "";
  const appliedPatches: JsonPatch[] = [];
  const processedLines = new Set<string>();
  
  return {
    push(chunk: string): { result: T; newPatches: JsonPatch[] } {
      buffer += chunk;
      const newPatches: JsonPatch[] = [];
      
      // Split into lines, keeping incomplete line in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and duplicates
        if (!trimmed || processedLines.has(trimmed)) {
          continue;
        }
        processedLines.add(trimmed);
        
        // Parse and apply patch
        const patch = parseSpecStreamLine(trimmed);
        if (patch) {
          applySpecStreamPatch(result as Record<string, unknown>, patch);
          appliedPatches.push(patch);
          newPatches.push(patch);
        }
      }
      
      // Return shallow copy to trigger re-renders
      if (newPatches.length > 0) {
        result = { ...result };
      }
      
      return { result, newPatches };
    },
    
    getResult(): T {
      // Process any remaining buffer
      if (buffer.trim()) {
        const patch = parseSpecStreamLine(buffer.trim());
        if (patch) {
          applySpecStreamPatch(result as Record<string, unknown>, patch);
          appliedPatches.push(patch);
        }
        buffer = '';
      }
      return result;
    },
    
    getPatches(): JsonPatch[] {
      return [...appliedPatches];
    },
    
    reset(newInitial: Partial<T> = {}): void {
      result = { ...newInitial } as T;
      buffer = '';
      appliedPatches.length = 0;
      processedLines.clear();
    },
  };
}

/**
 * Parse a single line as JSON Patch.
 * Returns null if line is not a valid patch (e.g., plain text).
 */
function parseSpecStreamLine(line: string): JsonPatch | null {
  // Must start with { for JSON
  if (!line.startsWith('{')) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(line);
    
    // Validate RFC 6902 structure
    if (typeof parsed.op !== 'string') {
      return null;
    }
    if (typeof parsed.path !== 'string') {
      return null;
    }
    
    // Validate operation type
    const validOps = ['add', 'remove', 'replace', 'move', 'copy', 'test'];
    if (!validOps.includes(parsed.op)) {
      return null;
    }
    
    return parsed as JsonPatch;
  } catch {
    return null;
  }
}
```

---

## 4. Diff Algorithm for Generating Patches

### Diff to Patches

```typescript
/**
 * Generate JSON Patch operations to transform oldObj into newObj.
 * Deep comparison with recursive traversal.
 * 
 * @param oldObj Original object
 * @param newObj Target object
 * @param basePath Base path for recursion
 * @returns Array of JSON Patch operations
 */
export function diffToPatches(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  basePath = '',
): JsonPatch[] {
  const patches: JsonPatch[] = [];
  
  // Keys present in newObj (additions and changes)
  for (const key of Object.keys(newObj)) {
    const path = buildPath(basePath, key);
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    
    if (!(key in oldObj)) {
      // Key doesn't exist in old - ADD
      patches.push({ op: 'add', path, value: newVal });
      continue;
    }
    
    // Both exist - compare values
    if (isPlainObject(oldVal) && isPlainObject(newVal)) {
      // Both objects - recurse
      patches.push(...diffToPatches(
        oldVal as Record<string, unknown>,
        newVal as Record<string, unknown>,
        path,
      ));
    } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      // Both arrays - compare for equality
      if (!arraysEqual(oldVal, newVal)) {
        patches.push({ op: 'replace', path, value: newVal });
      }
    } else if (oldVal !== newVal) {
      // Primitive values differ - REPLACE
      patches.push({ op: 'replace', path, value: newVal });
    }
  }
  
  // Keys removed from old (deletions)
  for (const key of Object.keys(oldObj)) {
    if (!(key in newObj)) {
      const path = buildPath(basePath, key);
      patches.push({ op: 'remove', path });
    }
  }
  
  return patches;
}

/**
 * Build JSON Pointer path from base and segment.
 */
function buildPath(base: string, segment: string): string {
  // Escape special characters
  const escaped = segment.replace(/~/g, '~0').replace(/\//g, '~1');
  return base === '' ? `/${escaped}` : `${base}/${escaped}`;
}

/**
 * Check if value is a plain object (not array, not null).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Compare arrays for shallow equality.
 */
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i] || 
    (isPlainObject(val) && isPlainObject(b[i]) && 
      JSON.stringify(val) === JSON.stringify(b[i])));
}

/**
 * Deep equality check.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }
  
  return false;
}
```

---

## 5. Mixed Stream Parsing (Text + Patches)

### For Chat + Structured Output

```typescript
/**
 * Callbacks for mixed stream parsing.
 */
export interface MixedStreamCallbacks {
  onPatch: (patch: JsonPatch) => void;
  onText: (text: string) => void;
}

/**
 * Parser for streams containing both text and JSON patches.
 * Supports two modes:
 * 1. Fence mode: Lines between ```spec and ``` are patches
 * 2. Heuristic mode: Lines starting with { are patches
 */
export interface MixedStreamParser {
  push(chunk: string): void;
  flush(): void;
}

export function createMixedStreamParser(
  callbacks: MixedStreamCallbacks,
): MixedStreamParser {
  let buffer = '';
  let inSpecFence = false;
  
  function processLine(line: string): void {
    const trimmed = line.trim();
    
    // Fence detection
    if (!inSpecFence && trimmed.startsWith('```spec')) {
      inSpecFence = true;
      return;
    }
    if (inSpecFence && trimmed === '```') {
      inSpecFence = false;
      return;
    }
    
    if (!trimmed) return;
    
    if (inSpecFence) {
      // Inside fence: all lines are patches
      const patch = parseSpecStreamLine(trimmed);
      if (patch) callbacks.onPatch(patch);
      return;
    }
    
    // Outside fence: try heuristic
    const patch = parseSpecStreamLine(trimmed);
    if (patch) {
      callbacks.onPatch(patch);
    } else {
      callbacks.onText(line);
    }
  }
  
  return {
    push(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        processLine(line);
      }
    },
    
    flush(): void {
      if (buffer.trim()) {
        processLine(buffer);
      }
      buffer = '';
    },
  };
}
```

---

## 6. Integration Approach for Agent-Work-Contract

### Schema Definition

```typescript
// src/features/agent-work-contract/schema/contract.ts

import { z } from 'zod';

/**
 * AgentWorkContract Schema - work contract structure.
 */
export const AgentWorkContractSchema = z.object({
  workflow: z.object({
    id: z.string(),
    status: z.enum(['pending', 'running', 'paused', 'completed', 'failed']),
    steps: z.array(z.object({
      id: z.string(),
      type: z.string(),  // References catalog.stepTypes
      input: z.record(z.unknown()).optional(),
      output: z.record(z.unknown()).optional(),
      status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
      predicates: z.array(z.string()).optional(),
    })),
  }),
  
  tasks: z.record(z.object({
    id: z.string(),
    kind: z.enum(['task', 'subtask']),
    workflowId: z.string(),
    status: z.enum(['pending', 'active', 'completed', 'failed', 'blocked']),
    predicates: z.array(z.string()).optional(),
  })),
  
  trajectories: z.record(z.object({
    id: z.string(),
    workflowId: z.string(),
    sessionId: z.string(),
    checkpoints: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      state: z.record(z.unknown()),
    })),
  })).optional(),
  
  handoffs: z.record(z.object({
    id: z.string(),
    sourceSession: z.string(),
    targetSession: z.string(),
    scope: z.array(z.string()),
    constraints: z.record(z.unknown()).optional(),
  })).optional(),
});

export type AgentWorkContract = z.infer<typeof AgentWorkContractSchema>;
```

### Contract Store Integration

```typescript
// src/features/agent-work-contract/engine/contract-store.ts

import { createSpecStreamCompiler, JsonPatch } from './patch-engine';
import { AgentWorkContract } from '../schema/contract';

/**
 * ContractStore - manages .hivemind/agent-work-contract/ files.
 * Uses RFC 6902 patches for incremental updates.
 */
export interface ContractStore {
  /**
   * Create or reset contract with initial state.
   */
  initialize(contract: AgentWorkContract): void;
  
  /**
   * Apply patches to active contract.
   * Returns updated contract and patches logged.
   */
  applyPatches(patches: JsonPatch[]): { contract: AgentWorkContract; applied: JsonPatch[] };
  
  /**
   * Generate patches from diff of old and new states.
   */
  diffFrom(old: AgentWorkContract, newContract: AgentWorkContract): JsonPatch[];
  
  /**
   * Get current contract state.
   */
  getActive(): AgentWorkContract;
  
  /**
   * Persist contract to disk.
   */
  persist(): Promise<void>;
}

export function createContractStore(
  contractPath: string,
): ContractStore {
  const compiler = createSpecStreamCompiler<AgentWorkContract>();
  
  return {
    initialize(contract: AgentWorkContract): void {
      compiler.reset(contract);
    },
    
    applyPatches(patches: JsonPatch[]): { contract: AgentWorkContract; applied: JsonPatch[] } {
      let contract = compiler.getActive();
      const applied: JsonPatch[] = [];
      
      for (const patch of patches) {
        try {
          const { result } = compiler.push(JSON.stringify(patch));
          contract = result;
          applied.push(patch);
        } catch (error) {
          console.error(`Patch failed: ${patch.op} ${patch.path}`, error);
        }
      }
      
      return { contract, applied };
    },
    
    diffFrom(old: AgentWorkContract, newContract: AgentWorkContract): JsonPatch[] {
      return diffToPatches(old, newContract);
    },
    
    getActive(): AgentWorkContract {
      return compiler.getResult();
    },
    
    async persist(): Promise<void> {
      const contract = compiler.getResult();
      // Write to contractPath
    },
  };
}
```

### Streaming Contract Building

```typescript
// src/features/agent-work-contract/engine/contract-stream.ts

import { createMixedStreamParser, JsonPatch } from './patch-engine';

/**
 * Stream handler for LLM-generated contract updates.
 * Parses mixed text + patch output and applies incrementally.
 */
export function handleContractStream(
  onContractUpdate: (contract: AgentWorkContract) => void,
  onPlanText: (text: string) => void,
): {
  push(chunk: string): void;
  flush(): AgentWorkContract;
} {
  const compiler = createSpecStreamCompiler<AgentWorkContract>();
  
  const parser = createMixedStreamParser({
    onPatch: (patch: JsonPatch) => {
      const { result } = compiler.push(JSON.stringify(patch));
      onContractUpdate(result);
    },
    onText: (text: string) => {
      onPlanText(text);
    },
  });
  
  return {
    push(chunk: string): void {
      parser.push(chunk);
    },
    
    flush(): AgentWorkContract {
      parser.flush();
      return compiler.getResult();
    },
  };
}
```

---

## 7. Validation Patterns

### Pre-Application Validation

```typescript
/**
 * Validate patches before application.
 * Checks path existence, type compatibility, and required fields.
 */
export function validatePatch(
  obj: Record<string, unknown>,
  patch: JsonPatch,
): { valid: boolean; error?: string } {
  // Required fields check
  if (!patch.op) {
    return { valid: false, error: 'Missing required field: op' };
  }
  if (!patch.path) {
    return { valid: false, error: 'Missing required field: path' };
  }
  
  // Operation-specific validation
  switch (patch.op) {
    case 'add':
    case 'replace':
    case 'test':
      if (patch.value === undefined) {
        return { valid: false, error: `${patch.op} requires 'value'` };
      }
      break;
      
    case 'move':
    case 'copy':
      if (!patch.from) {
        return { valid: false, error: `${patch.op} requires 'from'` };
      }
      break;
      
    case 'remove':
      // No additional fields needed
      break;
      
    default:
      return { valid: false, error: `Unknown operation: ${patch.op}` };
  }
  
  // Path validity check
  try {
    parsePath(patch.path);
  } catch (error) {
    return { valid: false, error: `Invalid path: ${patch.path}` };
  }
  
  // For test operation, verify existence
  if (patch.op === 'test') {
    try {
      const current = getByPath(obj, patch.path);
      if (!deepEqual(current, patch.value)) {
        return { valid: false, error: `Test failed at ${patch.path}` };
      }
    } catch (error) {
      return { valid: false, error: `Path does not exist: ${patch.path}` };
    }
  }
  
  // For remove/replace, verify path exists
  if (patch.op === 'remove' || patch.op === 'replace') {
    try {
      getByPath(obj, patch.path);
    } catch (error) {
      return { valid: false, error: `Path does not exist: ${patch.path}` };
    }
  }
  
  // For move/copy, verify from path exists
  if ((patch.op === 'move' || patch.op === 'copy') && patch.from) {
    try {
      getByPath(obj, patch.from);
    } catch (error) {
      return { valid: false, error: `From path does not exist: ${patch.from}` };
    }
  }
  
  return { valid: true };
}
```

### Schema Validation After Patch

```typescript
import { z } from 'zod';

/**
 * Validate contract against schema after patching.
 * Returns validation errors or success.
 */
export function validateContract(
  contract: unknown,
  schema: z.ZodSchema,
): { valid: boolean; errors?: z.ZodError } {
  const result = schema.safeParse(contract);
  
  if (result.success) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errors: result.error,
  };
}
```

---

## 8. Usage Examples

### Progressive Contract Building

```typescript
const compiler = createSpecStreamCompiler<WorkContract>();

// Stream patches from LLM
for await (const chunk of llmStream) {
  const { result, newPatches } = compiler.push(chunk);
  
  if (newPatches.length > 0) {
    // Real-time UI update
    updateContractDisplay(result);
    
    // Debug logging
    console.log('Applied patches:', newPatches);
  }
}

// Get final result
const finalContract = compiler.getResult();
```

### Diff-Based Updates

```typescript
const oldContract = store.getActive();
const newContract = proposeChanges(oldContract);

// Generate minimal patches
const patches = diffToPatches(oldContract, newContract);

// Apply with validation
for (const patch of patches) {
  const validation = validatePatch(oldContract, patch);
  if (!validation.valid) {
    console.error('Invalid patch:', validation.error);
    continue;
  }
  
  applySpecStreamPatch(oldContract, patch);
}

// Validate final state
const { valid, errors } = validateContract(oldContract, schema);
if (!valid) {
  console.error('Schema validation failed:', errors);
}
```

---

## 9. Anti-Patterns

1. **Don't mutate objects directly** - Always use patches for change tracking
   ```typescript
   // ❌ Bad
   contract.workflow.status = 'completed';
   
   // ✅ Good
   applyPatch(contract, { op: 'replace', path: '/workflow/status', value: 'completed' });
   ```

2. **Don't skip validation** - Always validate before applying
   ```typescript
   // ❌ Bad - may corrupt state
   applyPatch(contract, patch);
   
   // ✅ Good - validates first
   const { valid, error } = validatePatch(contract, patch);
   if (valid) applyPatch(contract, patch);
   ```

3. **Don't mix patch formats** - Use RFC 6902 consistently
   ```typescript
   // ❌ Bad - mixing formats
   { "add": "/path", "value": x }    // Non-standard
   { "op": "add", "path": "/path" }   // RFC 6902
   
   // ✅ Good - consistent RFC 6902
   { "op": "add", "path": "/path", "value": x }
   ```

---

## 10. Reference Summary

| Pattern | Purpose | File Reference |
|---------|---------|----------------|
| `createSpecStreamCompiler<T>()` | Progressive patch application with buffering | `json-render-core/stream` |
| `applySpecStreamPatch()` | Apply single patch operation | `json-render-core/patch` |
| `diffToPatches()` | Generate patches from objectdiff | `json-render-core/diff` |
| `parseSpecStreamLine()` | Parse JSON Patch from text line | `json-render-core/parse` |
| `createMixedStreamParser()` | Handle text + patch streams | `json-render-core/mixed` |
| `validatePatch()` | Pre-application validation | `json-render-core/validate` |

---

*Pattern reference for agent-work-contract integration: 2026-03-20*