/**
 * Vitest setup file — registers @testing-library/jest-dom matchers.
 *
 * Without this, vitest's `expect()` cannot resolve matchers like
 * `toBeInTheDocument`, `toHaveStyle`, `toHaveTextContent`, etc.
 * that ship with @testing-library/jest-dom.
 *
 * This file is referenced from `vitest.config.ts` via `setupFiles`
 * and runs once per test environment bootstrap.
 *
 * @see https://testing-library.com/docs/ecosystem-jest-dom
 */

import "@testing-library/jest-dom/vitest"
