# hm-settings Side-Car Dashboard Rendering Investigation

**Date:** 2026-03-30  
**Investigator:** hivexplorer  
**Scope:** Root cause analysis of plain-text/unstructured UI rendering in `apps/side-car`  

---

## Investigation Summary

The dashboard renders as plain text instead of styled UI because **Tailwind CSS v4 is missing shadcn/ui design token definitions**.

The `globals.css` at `apps/side-car/app/globals.css:1` only contains:
```css
@import "tailwindcss";
```

This imports Tailwind's default theme but **NOT** shadcn/ui's `@theme` block which defines CSS custom properties like `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--primary`, `--ring`, etc.

The `@json-render/shadcn` components (Card, Tabs, Button, Input, Stack, etc.) use these Tailwind-utility forms: `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `focus-visible:ring-ring/50`, etc.

Without shadcn's `@theme` CSS block, these utilities resolve to Tailwind's default colors or nothing, causing the near-plain-text appearance.

---

## Top 5 Root Causes (Ranked by Confidence)

### Cause #1 — MISSING shadcn/ui `@theme` CSS Block (CRITICAL — Confidence: 95%)

| Field | Value |
|-------|-------|
| **File** | `apps/side-car/app/globals.css:1` |
| **Evidence** | `@import "tailwindcss";` — only imports Tailwind base, not shadcn design tokens |

**What it causes:** All shadcn components render with broken/missing styles:
- `bg-card` → no `--card` variable → renders as transparent/white (indistinguishable from page background)
- `text-card-foreground` → no `--card-foreground` variable → defaults to browser/user-agent text color
- `bg-muted` → no `--muted` variable → transparent
- `text-muted-foreground` → no `--muted` variable → same as body text
- `focus-visible:ring-ring/50` → no `--ring` variable → no visible focus ring
- `border-border` → no `--border` variable → invisible borders

**Explains symptoms:** Card containers appear invisible (no visual boundaries), text has no color hierarchy, buttons look like plain text links, inputs have no borders, focus states are invisible.

---

### Cause #2 — No `tailwind.config.ts` for Tailwind v4 Theming (Confidence: 90%)

| Field | Value |
|-------|-------|
| **File** | `apps/side-car/tailwind.config.ts` (does not exist) |
| **Evidence** | Glob found **0** tailwind config files |

Tailwind v4 does NOT require `tailwind.config.ts` for the default theme, but shadcn/ui in Tailwind v4 requires a `@theme` block in CSS to define design tokens. There is no CSS file containing `@theme { --card: ...; --card-foreground: ...; ... }`.

**Explains:** Even though Tailwind v4 processes `@import "tailwindcss"` correctly, the resulting CSS has no shadcn tokens, so all shadcn utility classes (`bg-card`, `text-muted-foreground`, etc.) resolve to undefined/nothing.

---

### Cause #3 — `@json-render/shadcn` Components ARE Properly Wired (Confidence: 85% — partial)

| Field | Value |
|-------|-------|
| **File** | `apps/side-car/lib/registry.tsx:6-42` |
| **Evidence** | All 10 components correctly map `shadcnComponentDefinitions.X` (catalog) and `shadcnComponents.X` (render implementation) |

The registry wiring is correct:
- `registry.tsx:12-22` — catalog definitions from `@json-render/shadcn/catalog`
- `registry.tsx:32-42` — React implementations from `@json-render/shadcn`
- `registry.tsx:30` — `defineRegistry()` correctly combines both

**BUT** — the rendered React components (`shadcnComponents.Card`, etc.) use Tailwind classes that reference CSS variables that don't exist.

---

### Cause #4 — Dashboard Spec JSON IS Structured Correctly (Confidence: 80%)

| Field | Value |
|-------|-------|
| **File** | `.hivemind/activity/state/dashboard-spec.json` |
| **Evidence** | Proper element tree: root (Stack/vertical) → body (Stack/horizontal) → left-card + right-card (Card) → children properly nested with tabs, inputs, buttons |

The JSON spec is well-formed with proper component hierarchy:
- `root` (Stack vertical) → `heading` (Heading) + `body` (Stack horizontal)
- `body` → `left-card` (Card) + `right-card` (Card)
- `right-card` contains `Tabs`, `Select`, `Input`, `Button` properly nested
- State bindings (`$bindState`) are correctly specified

**Even if styled**, the spec has a minor UX issue: `right-settings` (line 110-116) is a `Text` component showing raw key:value pairs as plain text (`"preferredUserName: unset\nchatLanguage: en\n..."`). This is by design per the spec but looks unstructured.

---

### Cause #5 — `JSONUIProvider` + `Renderer` Integration IS Correct (Confidence: 85%)

| Field | Value |
|-------|-------|
| **File** | `apps/side-car/app/page.tsx:31-37` and `page.tsx:55-63` |
| **Evidence** | `JSONUIProvider` wraps `Renderer`, passing `registry`, `handlers`, and `initialState` |

```tsx
// page.tsx:32-37 — DashboardInner
<JSONUIProvider registry={registry} handlers={resolvedHandlers}>
  <Renderer spec={spec} registry={registry} />
</JSONUIProvider>

// page.tsx:55-63 — DashboardContent
<JSONUIProvider registry={registry} initialState={spec.state} onStateChange={handleStateChange}>
  <DashboardInner spec={spec} />
</JSONUIProvider>
```

The provider nesting is correct. The inner `JSONUIProvider` is redundant but not harmful.

---

## Symptom-to-Cause Mapping

| Screenshot Symptom | Root Cause |
|--------------------|------------|
| **"IdentityExpertiseGovernance" tabs render as plain text** | Cause #1 — Tabs use `bg-muted`, `data-[state=active]:bg-background` which resolve to nothing without `--muted` and `--background` tokens |
| **"SaveReset" buttons look like text** | Cause #1 — Buttons use `bg-primary`, `text-primary-foreground` which are undefined |
| **Card containers have no visual boundaries** | Cause #1 — Card uses `bg-card text-card-foreground border` but `--card` is undefined, `border` becomes invisible (no `--border` color) |
| **No spacing between elements** | **Partially** Cause #1 — Stack gap utilities (`gap-2`, `gap-6`) ARE standard Tailwind and should work, BUT if Card backgrounds are missing the card visually collapses |
| **Settings shown as `\n`-separated text** | Cause #4 — `right-settings` is a Text component with raw key:value string, not a design flaw |
| **"degraded" badge looks like plain text** | Cause #1 — Badge uses `bg-muted text-muted-foreground` which are undefined |

---

## Registry Wiring Analysis

### Catalog Definition (Correct)
```tsx
// apps/side-car/lib/registry.tsx:12-22
const catalog = defineCatalog(schema, {
  components: {
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Card: shadcnComponentDefinitions.Card,
    // ... 6 more
  },
  actions: { saveSettings, resetSettings }
})
```

### Registry Implementation (Correct)
```tsx
// apps/side-car/lib/registry.tsx:32-42
export const { registry, handlers } = defineRegistry(catalog, {
  components: {
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Card: shadcnComponents.Card,
    // ... 6 more
  },
  actions: { saveSettings, resetSettings }
})
```

The wiring is **NOT** the problem.

---

## Next.js App Structure Analysis

### layout.tsx (Minimal but Functional)
```tsx
// apps/side-car/app/layout.tsx:9-16
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
```

**Issue:** `bg-background` and `text-foreground` are ALSO shadcn utilities requiring `--background` and `--foreground` tokens. The layout applies these classes but they resolve to nothing without the theme.

### globals.css (Missing shadcn Theme)
```css
/* apps/side-car/app/globals.css:1 */
@import "tailwindcss";
```

This is the **sole root cause file**.

---

## Recommended Fixes

### Fix 1 — Add shadcn/ui `@theme` CSS (Smallest, Correct)

Add to `apps/side-car/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Background colors */
  --background: oklch(0.99 0.02 90);
  --foreground: oklch(0.15 0.03 260);
  
  /* Card */
  --card: oklch(0.99 0.02 90);
  --card-foreground: oklch(0.15 0.03 260);
  
  /* Popover */
  --popover: oklch(0.99 0.02 90);
  --popover-foreground: oklch(0.15 0.03 260);
  
  /* Primary */
  --primary: oklch(0.55 0.22 265);
  --primary-foreground: oklch(0.98 0.01 265);
  
  /* Secondary */
  --secondary: oklch(0.96 0.02 260);
  --secondary-foreground: oklch(0.15 0.03 260);
  
  /* Muted */
  --muted: oklch(0.96 0.02 260);
  --muted-foreground: oklch(0.55 0.02 260);
  
  /* Destructive */
  --destructive: oklch(0.60 0.25 25);
  --destructive-foreground: oklch(0.98 0.01 25);
  
  /* Border & Input */
  --border: oklch(0.90 0.02 260);
  --input: oklch(0.90 0.02 260);
  --ring: oklch(0.55 0.22 265);
  
  /* Radius */
  --radius: 0.625rem;
}
```

This is the **minimum fix** to make the dashboard visually styled.

### Fix 2 — Import shadcn/ui Base CSS (Alternative)

If `@json-render/shadcn` ships with a base CSS file (it does NOT — checked `dist/`):
```css
@import "tailwindcss";
@import "@json-render/shadcn/base.css"; /* Does not exist */
```

Since no base CSS is exported, Fix 1 is the only option.

### Fix 3 — Use Tailwind v4 + shadcn/ui CLI (Proper Setup)

For a production app, run:
```bash
cd apps/side-car
npx shadcn@latest init
npx shadcn@latest add button card tabs input select badge separator
```

This will generate proper `globals.css` with `@theme` block and component-specific CSS.

---

## Files Referenced

| File | Purpose |
|------|---------|
| `apps/side-car/app/globals.css:1` | **ROOT CAUSE** — missing `@theme` |
| `apps/side-car/app/layout.tsx:9-16` | Uses `bg-background text-foreground` which need theme |
| `apps/side-car/lib/registry.tsx:6-42` | Correct wiring (not the problem) |
| `apps/side-car/app/page.tsx:31-37` | Correct provider/renderer usage |
| `.hivemind/activity/state/dashboard-spec.json` | Valid JSON spec |
| `node_modules/@json-render/shadcn/dist/index.js` | Uses `bg-card`, `text-muted-foreground` etc. |
| `node_modules/@json-render/shadcn/package.json:68-72` | Peer deps: `tailwindcss: ^4.0.0` |

---

## Git Context

```
Latest commit: 8ddf40e fix: migrate side-car from edge to node runtime for sdk compatibility
Modified files:
  apps/side-car/app/api/config/route.ts
  apps/side-car/app/api/dashboard/route.ts
  apps/side-car/next.config.ts
  apps/side-car/package.json
```

---

## Conclusion

**The dashboard is NOT styled because `apps/side-car/app/globals.css` is missing the shadcn/ui `@theme` CSS block that defines design tokens (--card, --foreground, --muted, --primary, --ring, --border, etc.).**

The `@json-render/shadcn` components at `node_modules/@json-render/shadcn/dist/index.js` ARE properly using Tailwind utility classes like `bg-card`, `text-muted-foreground`, `border-border`, `focus-visible:ring-ring/50` — but these utilities reference CSS custom properties that are defined by shadcn's `@theme` block, which is entirely absent from `globals.css`.

**Fix:** Add the `@theme { ... }` block with shadcn design tokens to `apps/side-car/app/globals.css`.
