/**
 * String Utilities Tests
 * Tests for shared string manipulation functions
 */

import { levenshteinSimilarity } from "../src/utils/string.js";

// ─── Harness ─────────────────────────────────────────────────────────

let passed = 0;
let failed_ = 0;
function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    process.stderr.write(`  PASS: ${name}\n`);
  } else {
    failed_++;
    process.stderr.write(`  FAIL: ${name}\n`);
  }
}

// ─── Levenshtein Similarity Tests ────────────────────────────────────

function test_levenshtein_similarity() {
  process.stderr.write("\n--- levenshtein-similarity ---\n");

  // 1. Exact match returns 1
  assert(levenshteinSimilarity("hello", "hello") === 1, "exact match returns 1");

  // 2. Complete mismatch returns 0
  assert(levenshteinSimilarity("abc", "def") === 0, "complete mismatch returns 0");

  // 3. Partial overlap returns ratio (0-1)
  // "abc" and "abd" -> overlap "a", "b" (2 chars). total unique "a", "b", "c", "d" (4 chars). 2/4 = 0.5
  assert(levenshteinSimilarity("abc", "abd") === 0.5, "partial overlap returns correct ratio");

  // 4. Empty strings returns 1
  assert(levenshteinSimilarity("", "") === 1, "empty strings returns 1");

  // 5. One empty string returns 0
  assert(levenshteinSimilarity("abc", "") === 0, "one empty string returns 0");
  assert(levenshteinSimilarity("", "abc") === 0, "one empty string returns 0 (reverse)");

  // 6. Very different lengths returns 0 (optimization)
  // "a" (1) and "aaaaaaa" (7). abs(1-7)/7 = 6/7 > 0.5. Should be 0.
  assert(levenshteinSimilarity("a", "aaaaaaa") === 0, "very different lengths returns 0");

  // 7. Case sensitivity (current implementation is case sensitive? No, the function uses split directly, so yes case sensitive.
  // Wait, in detection.ts usage, it calls .toLowerCase() before passing to this function.
  // But the function itself is just set overlap.
  // "A" and "a" -> overlap 0.
  assert(levenshteinSimilarity("A", "a") === 0, "case sensitive (no overlap)");
}

// ─── Runner ──────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== String Utilities Tests ===\n");

  test_levenshtein_similarity();

  process.stderr.write(`\n=== String Utilities: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
