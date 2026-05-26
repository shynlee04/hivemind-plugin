# Anti-Patterns Reference

## Decision Framework

```
Need read-only display?     → $state
Need two-way binding?       → $bindState
Need derived values?        → $computed
Need conditional rendering? → $cond
Need iteration?             → $each
Spec has 100+ elements?     → Use streaming via useUIStream
AI-generated spec?          → Run validateSpec + autoFixSpec first
Child key not in elements?  → checkOrphans: true in validateSpec (AP-09)
Streaming + user state?     → Separate user state from AI state (AP-10)
```

---

## AP-01: Unknown component types silently render fallback [CRITICAL]

The renderer does not throw when it encounters an unrecognized `type` field. It falls back to a generic `<div>` or skips the node entirely, making misspelled or unregistered components invisible in the UI with zero console feedback.

### ❌ WRONG

```json
{
  "type": "Cardd",
  "children": "Hello"
}
```

```tsx
// No validation — typo renders nothing, no error thrown
const tree = renderSpec(spec, registry);
```

### ✅ CORRECT

```tsx
import { validateSpec } from "@json-render/react";

const result = validateSpec(spec, registry);
if (!result.valid) {
  for (const err of result.errors) {
    console.error(`[json-render] Unknown component type: "${err.node.type}" at path ${err.path}`);
  }
  throw new Error(`Spec validation failed: ${result.errors.length} unknown component type(s)`);
}

const tree = renderSpec(spec, registry);
```

### Why it breaks

The renderer uses a lookup map (`registry[type]`) and returns a fallback element when the key is missing. No error boundary catches this because it is not an exception — it is a silent `undefined` return. In production, this manifests as mysterious blank areas in the UI that are nearly impossible to trace back to a spec error because there is no console output, no React warning, and no visual indicator.

The root cause is architectural: the Renderer's lookup is intentionally tolerant (to support partial streaming where components arrive out of order). But once streaming completes, you MUST validate the final spec or you lose all error visibility.

### Detection

```bash
grep -rn 'type:.*"[A-Z]' src/ | grep -iv '"Card"\|"Text"\|"Button"\|"Stack"\|"Row"\|"Column"\|"Image"\|"Input"\|"List"\|"Modal"\|"Table"\|"Badge"\|"Icon"\|"Avatar"\|"Divider"\|"Heading"'
```

---

## AP-02: Circular children references cause infinite loops [CRITICAL]

A spec node that references itself (directly or transitively) through its `children` array creates an infinite render loop. The renderer does not track visited nodes by default.

### ❌ WRONG

```json
{
  "type": "Card",
  "children": [
    {
      "type": "Card",
      "$ref": "#"
    }
  ]
}
```

```tsx
// No depth guard — this hangs or blows the call stack
const tree = renderSpec(spec, registry);
```

### ✅ CORRECT

```tsx
const MAX_RENDER_DEPTH = 32;

function safeRenderSpec(spec: SpecNode, registry: Registry, depth = 0): ReactNode {
  if (depth > MAX_RENDER_DEPTH) {
    console.error(`[json-render] Max depth ${MAX_RENDER_DEPTH} exceeded — possible circular reference`);
    return null;
  }

  const Component = registry[spec.type];
  if (!Component) return null;

  const children = Array.isArray(spec.children)
    ? spec.children.map((child) =>
        typeof child === "object" && child !== null
          ? safeRenderSpec(child, registry, depth + 1)
          : child
      )
    : spec.children;

  return React.createElement(Component, spec.props ?? {}, children);
}
```

### Why it breaks

The default `renderSpec` recurses through `children` without a depth counter or visited set. Circular references expand forever until the call stack overflows. This is particularly insidious because the circular reference can be indirect (A→B→C→A), making it invisible in spec review. The Renderer itself does NOT enforce a depth limit — this is by design to allow arbitrarily deep nesting for legitimate use cases. You must add your own guard.

### Detection

```bash
grep -rn '\$ref.*"#"' specs/
```

---

## AP-03: $template expression injection risk [CRITICAL]

AI-generated specs can contain `$template` strings with arbitrary JavaScript. If the template engine evaluates raw strings, malicious or malformed expressions execute in the render context.

### ❌ WRONG

```json
{
  "type": "Text",
  "$template": "${constructor.constructor('return process')().exit(1)}"
}
```

```tsx
// Direct eval — allows arbitrary code execution
const rendered = eval(`\`${spec.$template}\``);
```

### ✅ CORRECT

```tsx
import { autoFixSpec } from "@json-render/react";

const ALLOWED_TEMPLATE_PATTERN = /^[a-zA-Z0-9_$.\[\]"'\\\s]+$/;

function sanitizeTemplate(expr: string): string {
  if (!ALLOWED_TEMPLATE_PATTERN.test(expr)) {
    throw new Error(`[json-render] Template contains disallowed characters: ${expr.slice(0, 60)}`);
  }
  return expr;
}

const safeSpec = autoFixSpec(spec);
if (safeSpec.$template) {
  safeSpec.$template = sanitizeTemplate(safeSpec.$template);
}
```

### Why it breaks

Template expressions that reach `eval` or `Function()` without sanitization can access the runtime scope. The spec format is JSON, so there is no execution boundary between data and code unless you enforce one.

### Detection

```bash
grep -rn '\$template' specs/ | grep -i 'constructor\|process\|require\|import\|fetch\|eval'
```

---

## AP-04: State path typos silently return undefined [WARNING]

JSON Pointer paths in `$state`, `$bindState`, and `$computed` that do not match any key in the store resolve to `undefined` without warnings. The UI renders empty or broken content with no indication of the path mismatch.

### ❌ WRONG

```json
{
  "type": "Text",
  "$state": "/user/namme"
}
```

```tsx
// Typo in "name" — renders "undefined" as a string or shows nothing
const value = store.get("/user/namme");
```

### ✅ CORRECT

```tsx
function safeGetState(store: Store, path: string): unknown {
  const value = store.get(path);
  if (value === undefined) {
    const knownPaths = store.listPaths();
    const suggestion = didYouMean(path, knownPaths);
    console.warn(
      `[json-render] State path "${path}" resolved to undefined.` +
      (suggestion ? ` Did you mean "${suggestion}"?` : ` Known paths: ${knownPaths.join(", ")}`)
    );
  }
  return value;
}
```

### Why it breaks

JSON Pointer resolution (`/user/namme`) walks the state tree key-by-key. A missing key produces `undefined` at each step, and the final `undefined` is a valid JavaScript value — no exception is thrown.

### Detection

```bash
grep -rn '\$state.*"/' src/ specs/ | grep -v '$bindState'
```

---

## AP-05: Missing registry entry for component type [WARNING]

When a component type is used in a spec but not registered in the component registry, the renderer falls back silently. This often happens after refactoring or renaming components.

### ❌ WRONG

```tsx
const registry = {
  Card,
  Text,
  Button,
};

// Spec references "Modal" but it was never added to registry
// Renders fallback — no warning in production
const tree = renderSpec(spec, registry);
```

### ✅ CORRECT

```tsx
function createDefensiveRegistry(entries: Record<string, ComponentType>): Registry {
  const registry = { ...entries };

  return new Proxy(registry, {
    get(target, prop: string) {
      if (!(prop in target)) {
        console.error(`[json-render] Registry miss: "${prop}" is not registered. Available: ${Object.keys(target).join(", ")}`);
        return () => React.createElement("div", {
          style: { border: "2px dashed red", padding: 8 },
          "data-missing-component": prop,
        }, `Missing component: ${prop}`);
      }
      return target[prop];
    },
  });
}

const registry = createDefensiveRegistry({ Card, Text, Button, Modal });
const tree = renderSpec(spec, registry);
```

### Why it breaks

The renderer looks up `registry[type]` and receives `undefined` for missing entries. Without a proxy or guard, the undefined value is swallowed by the optional chaining in the render path.

### Detection

```bash
grep -rn 'type:.*"[A-Z]' specs/ | sed 's/.*"type":\s*"//;s/".*//' | sort -u > /tmp/used_types.txt
grep -rn 'registry\[' src/ | sed 's/.*registry\["//;s/".*//' | sort -u > /tmp/registered_types.txt
comm -23 /tmp/used_types.txt /tmp/registered_types.txt
```

---

## AP-06: Large specs without streaming [WARNING]

Specs with hundreds of nodes rendered in a single pass block the main thread and cause visible frame drops. The streaming API (`useUIStream`) renders chunks incrementally.

### ❌ WRONG

```tsx
function LargeDashboard({ spec }: { spec: SpecNode }) {
  const tree = renderSpec(spec, registry);
  return <div>{tree}</div>;
}
```

### ✅ CORRECT

```tsx
import { useUIStream } from "@json-render/react";

function LargeDashboard({ spec }: { spec: SpecNode }) {
  const { elements, isStreaming } = useUIStream(spec, registry, {
    chunkSize: 20,
    onError: (err, path) => {
      console.error(`[json-render] Stream error at ${path}:`, err);
    },
  });

  return (
    <div>
      {elements}
      {isStreaming && <div aria-busy="true" className="sr-only">Loading…</div>}
    </div>
  );
}
```

### Why it breaks

`renderSpec` is synchronous and recursive. A spec with 500+ nodes creates 500+ React elements in a single microtask, which blocks the browser's paint cycle for tens to hundreds of milliseconds.

### Detection

```bash
find specs/ -name '*.json' -exec sh -c 'count=$(grep -c "\"type\"" "$1"); if [ "$count" -gt 100 ]; then echo "$1: $count nodes"; fi' _ {} \;
```

---

## AP-07: Not using validateSpec before rendering [WARNING]

Skipping pre-render validation means structural errors (missing required fields, invalid nesting, wrong prop types) surface as runtime exceptions deep in React's reconciler instead of clean, actionable error messages.

### ❌ WRONG

```tsx
const spec = await ai.generateSpec(userPrompt);
const tree = renderSpec(spec, registry);
return tree;
```

### ✅ CORRECT

```tsx
import { validateSpec, autoFixSpec } from "@json-render/react";

const rawSpec = await ai.generateSpec(userPrompt);
const fixed = autoFixSpec(rawSpec);

const result = validateSpec(fixed, registry, {
  strict: true,
  allowUnknownProps: false,
});

if (!result.valid) {
  console.group("[json-render] Spec validation failed");
  for (const err of result.errors) {
    console.error(`  ${err.severity}: ${err.message} at ${err.path}`);
  }
  console.groupEnd();
  return <ErrorFallback errors={result.errors} />;
}

const tree = renderSpec(fixed, registry);
return tree;
```

### Why it breaks

`renderSpec` assumes the spec is well-formed. Missing `type` fields, invalid prop values, or wrong nesting are only caught when React tries to create elements and fails with cryptic "Element type is invalid" errors.

### Detection

```bash
grep -rn 'renderSpec' src/ | grep -v 'validateSpec\|autoFixSpec'
```

---

## AP-08: Disposing subscriptions in wrong order [INFO]

Event subscriptions created via `$bindState` or custom event listeners must be disposed before the renderer unmounts. Disposing in the wrong order causes stale callbacks to fire on unmounted components.

### ❌ WRONG

```tsx
function MyComponent() {
  const store = useStore();

  useEffect(() => {
    store.on("change", handleChange);
    // No cleanup — subscription leaks across remounts
  }, []);

  return <div>{renderSpec(spec, registry)}</div>;
}
```

### ✅ CORRECT

```tsx
function MyComponent() {
  const store = useStore();
  const subscriptionsRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsub = store.on("change", handleChange);
    subscriptionsRef.current.push(unsub);

    return () => {
      for (const dispose of subscriptionsRef.current) {
        dispose();
      }
      subscriptionsRef.current = [];
    };
  }, [store]);

  return <div>{renderSpec(spec, registry)}</div>;
}
```

### Why it breaks

React's cleanup runs after the component unmounts. If the store emits an event during the unmount phase, the handler references stale closure variables. Subscription references that are not tracked cannot be disposed.

### Detection

```bash
grep -rn 'store\.on\|\.subscribe\|addEventListener' src/ | grep -v 'useEffect\|useRef\|cleanup\|dispose\|unsub'
```

---

## AP-09: Orphaned child key references [CRITICAL]

Spec elements that reference child keys not present in the `elements` map cause the Renderer to silently skip rendering those children. No error is thrown — the child simply does not appear.

### ❌ WRONG

```json
{
  "root": "card-1",
  "elements": {
    "card-1": {
      "type": "Card",
      "props": { "title": "Dashboard" },
      "children": ["metric-1", "metric-2"]
    }
  }
}
```

In this spec, `"metric-1"` and `"metric-2"` are referenced as children but do not exist in the `elements` map. The Card renders with empty content — no metric widgets visible.

### ✅ CORRECT

```tsx
import { validateSpec } from "@json-render/core";

const result = validateSpec(spec, { checkOrphans: true });
if (!result.valid) {
  const orphans = result.issues.filter((i) => i.code === "orphan_reference");
  for (const o of orphans) {
    console.error(`[json-render] Element "${o.path}" references missing child "${o.detail}"`);
  }
}

const { spec: fixed, fixes } = autoFixSpec(spec);
```

### Why it breaks

The Renderer looks up each child key via `elements[childKey]`. When the key does not exist, the result is `undefined`, which React treats as "no child to render." This is a frequent error during streaming (patches arrive out of order) and after AI generation (the model sometimes forgets to include all referenced elements). The `checkOrphans` flag in `validateSpec` catches this, but it is not enabled by default.

### Detection

```bash
node -e "
const spec = require('./path/to/spec.json');
const keys = new Set(Object.keys(spec.elements));
for (const [k, el] of Object.entries(spec.elements)) {
  for (const child of el.children ?? []) {
    if (!keys.has(child)) console.error('Orphan:', k, '→', child);
  }
}
"
```

---

## AP-10: Race condition in streaming + state mutations [WARNING]

When a user interaction modifies state while a stream is still applying patches, the state can be overwritten by stale data from the stream. The stream compiler does not merge with current state — it applies patches to the spec's initial state.

### ❌ WRONG

```tsx
function Dashboard() {
  const { spec, isStreaming, send } = useUIStream({ api: "/api/gen" });
  const [userPrefs, setUserPrefs] = useState({ theme: "light" });

  return (
    <JSONUIProvider
      spec={spec}
      initialState={{ ...userPrefs, ...spec?.state }}
      onStateChange={(changes) => {
        for (const c of changes) {
          if (c.path.startsWith("/theme")) setUserPrefs((p) => ({ ...p, theme: c.value }));
        }
      }}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}
```

### ✅ CORRECT

```tsx
function Dashboard() {
  const { spec, isStreaming, send } = useUIStream({ api: "/api/gen" });

  const userPrefsRef = useRef({ theme: "light" });

  const mergedState = useMemo(() => ({
    ...userPrefsRef.current,
    ...(spec?.state ?? {}),
  }), [spec]);

  return (
    <JSONUIProvider
      spec={spec}
      initialState={mergedState}
      onStateChange={(changes) => {
        for (const c of changes) {
          if (c.path.startsWith("/theme")) {
            userPrefsRef.current = { ...userPrefsRef.current, theme: c.value };
          }
        }
      }}
    >
      <Renderer spec={spec} registry={registry} loading={isStreaming} />
    </JSONUIProvider>
  );
}
```

### Why it breaks

`useUIStream` updates the spec reactively as patches stream in. Each new spec may contain `spec.state` from the AI model. If `initialState` is recomputed on every render with the new `spec.state`, user mutations made between patches are lost. The fix is to separate user-controlled state (in a ref) from AI-generated state (in spec.state) and merge them deterministically.

### Detection

```bash
grep -rn 'initialState.*spec\|spec.*state.*spread' src/ | grep -v 'useRef\|useMemo\|useCallback'
```
