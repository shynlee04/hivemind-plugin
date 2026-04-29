# Surgical Edits

LSP-aware edit protocol with before/after examples.

---

## The 5-Step Protocol

Every edit follows this exact sequence. No shortcuts.

### Step 1: Locate

```bash
grep -n "target" file.ts
```

Get exact line numbers. Never edit without knowing where the target is.

### Step 2: Read Context

```
Read file.ts, offset=(line-20), limit=40
```

Read 20 lines before and 20 lines after the target. Understand the surrounding code structure, indentation, and imports.

### Step 3: Edit with Precise oldString

```
Edit file.ts:
  oldString: "exact code to replace"
  newString: "exact replacement code"
```

**Rules for oldString**:
- Must match the file content EXACTLY (whitespace, indentation, newlines)
- Include enough surrounding context to make the match unique
- Minimum: the full line being changed
- Maximum: 50 lines (if you need more, you're doing too much in one edit)

### Step 4: Verify Size

Never edit more than 50 lines in one operation. If the change is larger:
- Split into multiple sequential edits
- Each edit must pass verification before the next one starts

### Step 5: Verify Result

```bash
grep -n "expectedResult" file.ts
```

Confirm the edit landed correctly. Check that:
- The new code is present
- The old code is gone
- No unintended changes occurred

---

## LSP Awareness

The Edit tool uses LSP (Language Server Protocol) to validate edits. This means:

| LSP Feature | What It Does | How to Use It |
|-------------|-------------|---------------|
| Symbol resolution | Knows where functions/types are defined | Edit tool will reject edits that break references |
| Type checking | Validates type correctness | Ensure new code has correct types |
| Import management | Tracks import/export relationships | Don't break import chains |
| Rename safety | Prevents accidental symbol collisions | Use unique names for new symbols |

### LSP-Safe Edit Patterns

**Safe**: Adding a new function at the end of a file.

```
oldString: "export const lastFunction = () => {};"
newString: "export const lastFunction = () => {};\n\nexport const newFunction = () => {\n  // implementation\n};"
```

**Safe**: Modifying a function body while preserving its signature.

```
oldString: "export function handleError(err: Error) {\n  console.error(err);\n}"
newString: "export function handleError(err: Error) {\n  logger.error(err.message, { stack: err.stack });\n}"
```

**Unsafe**: Changing a function signature that other files import.

```
// BAD: This breaks all callers
oldString: "export function process(data: string[]) {"
newString: "export function process(data: Record<string, unknown>) {"
```

**Fix for Unsafe**: First update all callers, then change the signature. Or use a transitional approach:

```
// Step 1: Add overload
oldString: "export function process(data: string[]) {"
newString: "export function process(data: string[]): void;\nexport function process(data: Record<string, unknown>): void;\nexport function process(data: unknown) {"
```

---

## Before/After Examples

### Example 1: Add Error Handling

**Before**:
```typescript
export function fetchData(url: string) {
  const response = fetch(url);
  return response.json();
}
```

**Edit**:
```
oldString: "export function fetchData(url: string) {\n  const response = fetch(url);\n  return response.json();\n}"
newString: "export async function fetchData(url: string) {\n  const response = await fetch(url);\n  if (!response.ok) {\n    throw new Error(`[Harness] Fetch failed: ${response.status} ${response.statusText}`);\n  }\n  return response.json();\n}"
```

**Verify**:
```bash
grep -n "Harness\] Fetch failed" file.ts
```

### Example 2: Rename a Variable

**Before**:
```typescript
const config = loadConfig();
const result = processConfig(config);
```

**Edit** (two sequential edits for safety):
```
Edit 1:
  oldString: "const config = loadConfig();"
  newString: "const appConfig = loadConfig();"

Edit 2:
  oldString: "const result = processConfig(config);"
  newString: "const result = processConfig(appConfig);"
```

**Verify**:
```bash
grep -n "config" file.ts  # Should show appConfig, not bare config
```

### Example 3: Extract a Function

**Before**:
```typescript
function handleRequest(req: Request) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("Missing token");
  const decoded = verifyToken(token);
  if (!decoded) throw new Error("Invalid token");
  return decoded;
}
```

**Edit** (add new function first, then simplify caller):
```
Edit 1 — Add extractAuthUser before handleRequest:
  oldString: "function handleRequest(req: Request) {"
  newString: "function extractAuthUser(req: Request): DecodedToken {\n  const token = req.headers.authorization?.split(\" \")[1];\n  if (!token) throw new Error(\"[Harness] Missing token\");\n  const decoded = verifyToken(token);\n  if (!decoded) throw new Error(\"[Harness] Invalid token\");\n  return decoded;\n}\n\nfunction handleRequest(req: Request) {"

Edit 2 — Simplify handleRequest:
  oldString: "function handleRequest(req: Request) {\n  const token = req.headers.authorization?.split(\" \")[1];\n  if (!token) throw new Error(\"Missing token\");\n  const decoded = verifyToken(token);\n  if (!decoded) throw new Error(\"Invalid token\");\n  return decoded;\n}"
  newString: "function handleRequest(req: Request) {\n  return extractAuthUser(req);\n}"
```

**Verify**:
```bash
grep -n "extractAuthUser" file.ts  # Should appear in both definition and call
grep -c "verifyToken" file.ts     # Should be 1 (only in extractAuthUser)
```

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Edit Blast Zone | oldString > 50 lines | Split into multiple edits |
| Blind Edit | Editing without grep -n first | Always Step 1: locate |
| Context Blindness | Editing without reading ±20 lines | Always Step 2: read context |
| Unverified Edit | No grep after edit | Always Step 5: verify |
| Signature Break | Changing exported function signature | Update all callers first, or use overloads |
| Whitespace Mismatch | Edit fails with "oldString not found" | Read the file again, copy exact whitespace |

---

## Edit Size Guidelines

| Change Type | Expected Lines | Edit Strategy |
|-------------|---------------|---------------|
| Fix typo | 1 line | Single edit |
| Add error handling | 3-10 lines | Single edit |
| Rename variable (local) | 1-5 lines | Sequential edits (one per usage) |
| Extract function | 10-30 lines | Two edits (add function, simplify caller) |
| Refactor module | 30-50 lines | Multiple sequential edits, verify each |
| Rewrite module | >50 lines | DO NOT. Create new file, update imports, delete old |
