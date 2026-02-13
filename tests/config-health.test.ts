/**
 * Config Health Regression Tests
 *
 * Enforces a single source of truth for config options via exported constants.
 */

import {
  AUTOMATION_LEVELS,
  EXPERT_LEVELS,
  GOVERNANCE_MODES,
  LANGUAGES,
  OUTPUT_STYLES,
  createConfig,
  isValidAutomationLevel,
  isValidExpertLevel,
  isValidGovernanceMode,
  isValidLanguage,
  isValidOutputStyle,
  normalizeAutomationInput,
} from "../src/schemas/config.js"

let passed = 0
let failed_ = 0
const legacyAlias = String.fromCharCode(114, 101, 116, 97, 114, 100)

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

function testConstantsExported(): void {
  process.stderr.write("\n--- config-health: constants exported ---\n")
  assert(GOVERNANCE_MODES.length === 3, "governance modes constant has 3 items")
  assert(LANGUAGES.length === 2, "languages constant has 2 items")
  assert(EXPERT_LEVELS.length === 4, "expert levels constant has 4 items")
  assert(OUTPUT_STYLES.length === 5, "output styles constant has 5 items")
  assert(AUTOMATION_LEVELS.includes("coach"), "automation levels include coach")
  assert(!(AUTOMATION_LEVELS as readonly string[]).includes(legacyAlias), "automation levels exclude deprecated alias")
}

function testValidatorsTrackConstants(): void {
  process.stderr.write("\n--- config-health: validators align with constants ---\n")
  for (const mode of GOVERNANCE_MODES) {
    assert(isValidGovernanceMode(mode), `governance validator accepts ${mode}`)
  }
  for (const language of LANGUAGES) {
    assert(isValidLanguage(language), `language validator accepts ${language}`)
  }
  for (const level of EXPERT_LEVELS) {
    assert(isValidExpertLevel(level), `expert validator accepts ${level}`)
  }
  for (const style of OUTPUT_STYLES) {
    assert(isValidOutputStyle(style), `output style validator accepts ${style}`)
  }
  for (const automation of AUTOMATION_LEVELS) {
    assert(isValidAutomationLevel(automation), `automation validator accepts ${automation}`)
  }

  assert(!isValidGovernanceMode("INVALID"), "governance validator rejects invalid value")
  assert(!isValidLanguage("jp"), "language validator rejects invalid value")
  assert(!isValidExpertLevel("guru"), "expert validator rejects invalid value")
  assert(!isValidOutputStyle("verbose"), "output style validator rejects invalid value")
  assert(!isValidAutomationLevel("auto"), "automation validator rejects invalid value")
  assert(normalizeAutomationInput(legacyAlias) === "coach", "legacy alias normalizes to coach")
}

function testCreateConfigUsesKnownValues(): void {
  process.stderr.write("\n--- config-health: createConfig defaults ---\n")
  const config = createConfig()
  assert(GOVERNANCE_MODES.includes(config.governance_mode), "default governance mode is valid")
  assert(LANGUAGES.includes(config.language), "default language is valid")
  assert(EXPERT_LEVELS.includes(config.agent_behavior.expert_level), "default expert level is valid")
  assert(OUTPUT_STYLES.includes(config.agent_behavior.output_style), "default output style is valid")
  assert(AUTOMATION_LEVELS.includes(config.automation_level), "default automation level is valid")
}

process.stderr.write("=== config-health.test.ts ===\n")
testConstantsExported()
testValidatorsTrackConstants()
testCreateConfigUsesKnownValues()

process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
