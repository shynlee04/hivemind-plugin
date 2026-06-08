# SDK Compliance Checks — API Surface Validation

## Purpose

This reference defines how to validate that proposed SDK usage matches actual API signatures. Covers import path verification, method signature checking, type compatibility, and platform-specific SDK validation patterns.

## When to Load This Reference

Load when:
- A proposed code change uses an SDK method or API call
- A feature spec references specific API endpoints or SDK methods
- Validating that a proposed dependency's API surface matches documented/expected behavior
- Verifying OpenCode-specific plugin/hook/tool API usage

## Core Validation Steps

### Step 1: Verify Import Path Exists

```bash
# For TypeScript/Node SDKs
ls node_modules/<package>/dist/<path>.js 2>/dev/null || \
ls node_modules/<package>/<path>.d.ts 2>/dev/null

# For Python packages
python3 -c "import <package>.<module>" 2>&1

# For Go modules
grep '<import-path>' go.mod
```

**Decision:**
- Path exists in installed package → continue to Step 2
- Path does not exist → FAIL (wrong import, missing sub-package, or version mismatch)

### Step 2: Verify Method/Function Signature

```bash
# TypeScript: check type declarations
grep -A 10 "export.*function <methodName>" node_modules/<package>/*.d.ts 2>/dev/null

# Python: inspect function signature
python3 -c "import inspect; import <module>; print(inspect.signature(<module>.<function>))" 2>/dev/null

# Go: check exported symbols
grep "func <MethodName>(" $(go env GOPATH)/pkg/mod/<package>@<version>/*.go 2>/dev/null
```

**Checklist:**
- [ ] Function/method name exists in package export
- [ ] Parameter count matches proposed usage
- [ ] Parameter types match (or are compatible)
- [ ] Return type matches expected usage
- [ ] Async/sync pattern matches (Promise vs callback vs sync return)

### Step 3: Type Compatibility (TypeScript)

For TypeScript projects:

```bash
# Run type-check on proposed usage
npx tsc --noEmit 2>&1 | grep -i "error TS"

# Check that types package is installed
ls node_modules/@types/<package> 2>/dev/null || echo "NO TYPES — flag NEEDS_INVESTIGATION"
```

**Decision:**
- Types exist and pass → PASS
- No types available → NEEDS_INVESTIGATION (recommend `declare module` or `@types/`)
- Type errors detected → FAIL (with specific error messages)

### Step 4: Runtime Pattern Compliance

Verify that the proposed usage follows the SDK's expected patterns:

| SDK Pattern | Check |
|-------------|-------|
| **Builder/Chain pattern** | Methods return `this` — verify chaining works |
| **Factory pattern** | Use `create*` or `build*` methods, not `new Constructor()` |
| **Plugin pattern** | Register via `.use()` or `.register()`, not direct instantiation |
| **Middleware pattern** | Signature is `(req, res, next)` or equivalent |
| **Event emitter** | Use `.on()`, `.emit()`, `.off()` — not ad-hoc callbacks |
| **Promise-based** | Must be awaited or `.then()` chained |
| **Callback-based** | Last parameter is callback with `(err, result)` |
| **Stream-based** | Use `.pipe()`, `.on('data')`, `.on('end')` |

```bash
# Check if SDK uses CommonJS or ESM
grep '"type"' node_modules/<package>/package.json 2>/dev/null
grep '"exports"' node_modules/<package>/package.json 2>/dev/null
```

---

## OpenCode-Specific SDK Validation

When validating code that uses the OpenCode plugin API, verify against these rules:

### Plugin Registration

```typescript
// Correct pattern
export default definePlugin({
  name: "my-plugin",
  tools: () => [myTool1, myTool2],
  hooks: () => [myHook1],
});

// Common mistakes to flag
// ❌ Missing definePlugin wrapper
// ❌ Wrong export (named instead of default)
// ❌ tools/hooks as arrays instead of functions
```

**Validation command:**
```bash
# Check plugin.ts for definePlugin pattern
grep -n "definePlugin\|export default" src/plugin.ts 2>/dev/null
```

### Tool Definition

```typescript
// Correct pattern
export const myTool = defineTool({
  name: "tool-name",
  description: "...",
  parameters: z.object({...}),
  async execute(params, context) {
    // implementation
  }
});

// Common mistakes to flag
// ❌ Missing defineTool wrapper
// ❌ Parameters not using Zod schema
// ❌ execute not async
// ❌ Missing name and description
```

### Hook Definition

```typescript
// Correct pattern
export const myHook = defineHook({
  event: "before:delegate" | "after:delegate" | "on:error",
  async handler(context) { ... }
});
```

### SDK Cross-Reference

For detailed OpenCode platform API documentation, reference the `hm-opencode-platform-reference` skill. This skill only validates compliance — it does not contain the full API surface.

---

## Common SDK Misuses

| Misuse | Detection | Correction |
|--------|-----------|------------|
| **Using internal APIs** | Importing from `.../lib/` or `.../internal/` | Use only public API from package root |
| **Wrong constructor signature** | `new Client()` when factory is `Client.create()` | Read SDK docs for initialization pattern |
| **Missing error handling** | No `.catch()`, no `try/catch` around awaited call | Add error handling matching SDK's error types |
| **Incorrect config shape** | Config object missing required fields or wrong types | Check SDK's config type/interface |
| **Version-specific API usage** | Using method/option introduced in newer version | Check installed version, verify API availability |
| **Sync usage of async API** | Calling async function without `await` | Add `await` or handle Promise |
| **CJS import in ESM context** | `require()` in a module with `"type": "module"` | Use `import` instead |
| **ESM import in CJS context** | `import` in a `.js` file without `"type": "module"` | Use `require()` or rename to `.mjs` |

---

## Automated SDK Compliance Check

### TypeScript/Node Project

```bash
#!/bin/bash
# Quick SDK compliance check for Node/TS projects
PACKAGE_NAME="$1"
PROPOSED_IMPORT="$2"

# 1. Check package installed
if ls node_modules/"$PACKAGE_NAME"/package.json 2>/dev/null; then
  echo "✓ Package installed: $PACKAGE_NAME"
else
  echo "✗ Package NOT installed: $PACKAGE_NAME"
  exit 1
fi

# 2. Check types
if ls node_modules/@types/"$PACKAGE_NAME" 2>/dev/null || \
   grep -q '"types"' node_modules/"$PACKAGE_NAME"/package.json 2>/dev/null; then
  echo "✓ Types available"
else
  echo "⚠ No types found — NEEDS_INVESTIGATION"
fi

# 3. Check ESM/CJS compatibility
NODE_TYPE=$(grep '"type"' package.json 2>/dev/null | grep -oP '"\K(module|commonjs)(?=")')
PKG_TYPE=$(grep '"type"' node_modules/"$PACKAGE_NAME"/package.json 2>/dev/null | grep -oP '"\K(module|commonjs)(?=")')
echo "  Project module type: ${NODE_TYPE:-commonjs}"
echo "  Package module type: ${PKG_TYPE:-commonjs}"

# 4. Verify import path
IMPORT_PATH=$(echo "$PROPOSED_IMPORT" | sed 's/^@//' | tr '/' '-')
if grep -q "\"$PROPOSED_IMPORT\"" node_modules/"$PACKAGE_NAME"/package.json 2>/dev/null; then
  echo "✓ Import path valid"
else
  echo "⚠ Import path not found in exports — NEEDS_INVESTIGATION"
fi

# 5. Type-check (if TypeScript)
if ls tsconfig.json 2>/dev/null; then
  npx tsc --noEmit 2>&1 | grep -i "$PACKAGE_NAME" && echo "⚠ Type errors found" || echo "✓ No type errors"
fi
```

### Python Project

```bash
#!/bin/bash
# Quick SDK compliance check for Python projects
PACKAGE_NAME="$1"
PROPOSED_IMPORT="$2"

# 1. Check package installed
python3 -c "import $PACKAGE_NAME" 2>&1 && echo "✓ Package installed: $PACKAGE_NAME" || echo "✗ Package NOT installed: $PACKAGE_NAME"

# 2. Check module exists
python3 -c "import $PROPOSED_IMPORT" 2>&1 && echo "✓ Import path valid" || echo "✗ Import path invalid"

# 3. Run pip check for dependency conflicts
pip check 2>&1 && echo "✓ No dependency conflicts" || echo "⚠ Dependency conflicts detected"
```

---

## Gate Checks

Before passing any SDK compliance check:

- [ ] Package is installed at the expected version
- [ ] All import paths used in code resolve to actual files
- [ ] Method signatures match (parameter count, types, return type)
- [ ] ESM/CJS import pattern matches project module system
- [ ] Error handling follows SDK patterns (try/catch, .catch(), error callback)
- [ ] No internal/unstable APIs are being used
- [ ] TypeScript types are available or a `declare module` fallback is planned
- [ ] For OpenCode SDK usage: `definePlugin`, `defineTool`, `defineHook` wrappers used correctly
