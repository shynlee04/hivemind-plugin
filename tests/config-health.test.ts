/**
 * Config Health Tests - Verifies consolidation of configuration constants
 */

import {
  GOVERNANCE_MODES,
  LANGUAGES,
  AUTOMATION_LEVELS,
  EXPERT_LEVELS,
  OUTPUT_STYLES,
  isValidGovernanceMode,
  isValidLanguage,
  isValidExpertLevel,
  isValidOutputStyle,
  isValidAutomationLevel,
} from "../src/schemas/config.js";

// ─── Harness ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    process.stderr.write(`  PASS: ${name}\n`);
  } else {
    failed++;
    process.stderr.write(`  FAIL: ${name}\n`);
  }
}

// ─── Constant Tests ─────────────────────────────────────────────────

function test_constants_exist() {
  process.stderr.write("\n--- config-health: constants existence ---\n");
  assert(Array.isArray(GOVERNANCE_MODES), "GOVERNANCE_MODES is an array");
  assert(Array.isArray(LANGUAGES), "LANGUAGES is an array");
  assert(Array.isArray(AUTOMATION_LEVELS), "AUTOMATION_LEVELS is an array");
  assert(Array.isArray(EXPERT_LEVELS), "EXPERT_LEVELS is an array");
  assert(Array.isArray(OUTPUT_STYLES), "OUTPUT_STYLES is an array");
}

function test_validation_functions() {
  process.stderr.write("\n--- config-health: validation functions ---\n");

  // Governance Mode
  assert(isValidGovernanceMode("permissive"), "permissive is valid");
  assert(isValidGovernanceMode("assisted"), "assisted is valid");
  assert(isValidGovernanceMode("strict"), "strict is valid");
  assert(!isValidGovernanceMode("invalid"), "invalid governance mode is rejected");

  // Language
  assert(isValidLanguage("en"), "en is valid");
  assert(isValidLanguage("vi"), "vi is valid");
  assert(!isValidLanguage("fr"), "fr is invalid");

  // Automation Level
  assert(isValidAutomationLevel("manual"), "manual is valid");
  assert(isValidAutomationLevel("retard"), "retard is valid");
  assert(!isValidAutomationLevel("expert"), "expert is not an automation level");

  // Expert Level
  assert(isValidExpertLevel("beginner"), "beginner is valid");
  assert(isValidExpertLevel("expert"), "expert is valid expert level");
  assert(!isValidExpertLevel("manual"), "manual is not an expert level");

  // Output Style
  assert(isValidOutputStyle("explanatory"), "explanatory is valid");
  assert(isValidOutputStyle("minimal"), "minimal is valid");
  assert(!isValidOutputStyle("verbose"), "verbose is invalid style");
}

function test_constants_match_validation() {
  process.stderr.write("\n--- config-health: constants match validation ---\n");

  GOVERNANCE_MODES.forEach(mode => {
    assert(isValidGovernanceMode(mode), `${mode} from GOVERNANCE_MODES is valid`);
  });

  LANGUAGES.forEach(lang => {
    assert(isValidLanguage(lang), `${lang} from LANGUAGES is valid`);
  });

  AUTOMATION_LEVELS.forEach(level => {
    assert(isValidAutomationLevel(level), `${level} from AUTOMATION_LEVELS is valid`);
  });

  EXPERT_LEVELS.forEach(level => {
    assert(isValidExpertLevel(level), `${level} from EXPERT_LEVELS is valid`);
  });

  OUTPUT_STYLES.forEach(style => {
    assert(isValidOutputStyle(style), `${style} from OUTPUT_STYLES is valid`);
  });
}

// ─── Runner ─────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== Config Health Tests ===\n");

  test_constants_exist();
  test_validation_functions();
  test_constants_match_validation();

  process.stderr.write(`\n=== Config Health: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main();
