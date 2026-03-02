# Skill: hitea-visual-regression

# VLM-Driven Visual Regression Testing

Use when implementing self-healing visual tests that understand UI intent. Triggers on: 'visual regression', 'visual testing', 'e2e visual', 'playwright visual', 'screenshot testing'.

## The Visual AI Revolution

Traditional visual regression compares pixels — brittle and noisy. VLM-driven testing understands **what the user sees**, not just what pixels are rendered.

### Traditional vs VLM-Driven

```javascript
// Traditional (brittle)
expect(await page.screenshot()).toMatchSnapshot('checkout.png');
// Fails if: any pixel changes, font renders differently, ad loads

// VLM-Driven (intelligent)
const result = await vlm.assert(page, 'Checkout shows cart total in header');
// Passes if: intent is satisfied (total is visible and correct)
// Self-heals if: layout changes but intent is preserved
```

## Core Concepts

### 1. Intent-Based Assertions
Instead of pixel matching, define what the UI should communicate:

```javascript
await page.goto('/product/123');
await vlm.assert(page, 'Product title is visible and readable');
await vlm.assert(page, 'Add to cart button is prominent');
await vlm.assert(page, 'Price is displayed in expected format');
```

### 2. Self-Healing Selectors
VLM finds elements by description, not brittle selectors:

```javascript
// Old way (breaks on class change)
await page.click('.add-to-cart-btn-primary-v2');

// VLM way (understands intent)
await vlm.click(page, 'Add to cart button');
```

### 3. Dynamic Content Handling
VLM understands that some content is dynamic:

```javascript
// Ignores dynamic timestamps, personalized content
await vlm.assert(page, 'Order confirmation shows order number', {
  ignore: ['timestamp', 'user-name']
});
```

## Implementation with Playwright + VLM

### Setup
```typescript
import { test, expect } from '@playwright/test';
import { VLMAssertion } from '@hitea/vlm-playwright';

test.describe('Visual Tests', () => {
  let vlm: VLMAssertion;

  test.beforeEach(async ({ page }) => {
    vlm = new VLMAssertion(page);
  });

  test('checkout flow visual integrity', async ({ page }) => {
    await page.goto('/cart');
    
    await vlm.assert('Cart shows all added items');
    await vlm.assert('Total is calculated and visible');
    await vlm.assert('Proceed to checkout button is enabled');
    
    await vlm.click('Proceed to checkout');
    
    await vlm.assert('Shipping form is displayed');
    await vlm.assert('All required fields are marked');
  });
});
```

### Best Practices

1. **Test User Intent, Not Pixels**
   - ❌ `expect(screenshot).toMatchSnapshot()`
   - ✅ `await vlm.assert(page, 'Error message is visible')`

2. **Use Semantic Descriptions**
   - ❌ `await vlm.assert(page, 'Button is blue')`
   - ✅ `await vlm.assert(page, 'Primary action button is prominent')`

3. **Handle Dynamic Content**
   - ❌ `await vlm.assert(page, 'Welcome John')`
   - ✅ `await vlm.assert(page, 'Welcome message shows user name')`

4. **Test Accessibility Visually**
   ```javascript
   await vlm.assert(page, 'Focus state is visible on active element');
   await vlm.assert(page, 'Error states are clearly indicated with color and icon');
   ```

## Scripts

### Run Visual Tests
```bash
# Run visual tests
npx playwright test --project=visual

# Update baselines
npx playwright test --project=visual --update-snapshots
```

## Templates

### Visual Test Template
```typescript
import { test } from '@playwright/test';
import { VLMAssertion } from '@hitea/vlm-playwright';

test.describe('Visual: [Component/Page]', () => {
  test('[scenario description]', async ({ page }) => {
    const vlm = new VLMAssertion(page);
    
    await page.goto('/[path]');
    
    await vlm.assert('[visual assertion 1]');
    await vlm.assert('[visual assertion 2]');
    
    await vlm.click('[action button]');
    
    await vlm.assert('[expected result]');
  });
});
```

## References

- `references/vlm-api.md` — VLM assertion API reference
- `references/playwright-integration.md` — Playwright + VLM setup guide
- `references/visual-a11y.md` — Visual accessibility testing patterns
