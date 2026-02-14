/**
 * String Utilities Tests
 * Tests for shared string manipulation functions
 */

import { calculateSimilarity } from "../src/utils/string.js";

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

function test_calculate_similarity() {
  process.stderr.write("\n--- calculate-similarity ---\n");

  // 1. Exact match returns 1
  assert(calculateSimilarity("hello", "hello") === 1, "exact match returns 1");

  // 2. Complete mismatch returns 0
  assert(calculateSimilarity("abc", "def") === 0, "complete mismatch returns 0");

  // 3. Partial overlap (actual Levenshtein)
  // "abc" vs "abd": diff = 1 (subst 'c' -> 'd'). maxLen = 3. ratio = 1 - 1/3 = 0.666...
  const sim = calculateSimilarity("abc", "abd");
  assert(sim > 0.6 && sim < 0.7, `partial overlap returns correct ratio (got ${sim.toFixed(2)})`);

  // 4. Empty strings returns 1 (edge case)
  assert(calculateSimilarity("", "") === 1, "empty strings returns 1"); // debatable, but current impl

  // 5. One empty string returns 0
  assert(calculateSimilarity("abc", "") === 0, "one empty string returns 0");
  assert(calculateSimilarity("", "abc") === 0, "one empty string returns 0 (reverse)");

  // 6. Very different lengths returns low score
  // "a" vs "aaaaaaa": diff = 6 (insertions). maxLen = 7. ratio = 1 - 6/7 = 1/7 ~= 0.14
  const simLong = calculateSimilarity("a", "aaaaaaa");
  assert(simLong < 0.2 && simLong > 0.1, `very different lengths returns low score (got ${simLong.toFixed(2)})`);
}

// ─── Runner ──────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== String Utilities Tests ===\n");

  test_calculate_similarity();

  process.stderr.write(`\n=== String Utilities: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
