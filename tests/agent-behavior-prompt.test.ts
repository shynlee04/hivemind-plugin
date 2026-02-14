/**
 * Agent Behavior Prompt Tests
 * Verifies that the agent configuration prompt is generated correctly.
 */

import { generateAgentBehaviorPrompt, DEFAULT_AGENT_BEHAVIOR, LANGUAGES, EXPERT_LEVELS, OUTPUT_STYLES } from "../src/schemas/config.js";
import type { AgentBehaviorConfig } from "../src/schemas/config.js";

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

function testDefaults() {
  process.stderr.write("\n--- agent-behavior: defaults ---\n");
  const prompt = generateAgentBehaviorPrompt(DEFAULT_AGENT_BEHAVIOR);

  assert(prompt.includes("MANDATORY: You MUST obey"), "includes mandatory header");
  assert(prompt.includes("[LANGUAGE] Respond ONLY in English"), "default language is English");
  assert(prompt.includes("[EXPERT LEVEL] INTERMEDIATE"), "default expert level is intermediate");
  assert(prompt.includes("[OUTPUT STYLE] EXPLANATORY"), "default output style is explanatory");
  assert(prompt.includes("- ALWAYS explain your reasoning"), "includes default constraint: explain reasoning");
}

function testMatrixCoverage() {
  process.stderr.write("\n--- agent-behavior: matrix coverage ---\n");

  // Test all languages
  for (const lang of LANGUAGES) {
    const config = { ...DEFAULT_AGENT_BEHAVIOR, language: lang };
    const prompt = generateAgentBehaviorPrompt(config);
    if (lang === "en") assert(prompt.includes("Respond ONLY in English"), `language ${lang} correct`);
    if (lang === "vi") assert(prompt.includes("Respond ONLY in Vietnamese"), `language ${lang} correct`);
  }

  // Test all expert levels
  for (const level of EXPERT_LEVELS) {
    const config = { ...DEFAULT_AGENT_BEHAVIOR, expert_level: level };
    const prompt = generateAgentBehaviorPrompt(config);
    assert(prompt.includes(`[EXPERT LEVEL] ${level.toUpperCase()}`), `expert level ${level} correct`);
  }

  // Test all output styles
  for (const style of OUTPUT_STYLES) {
    const config = { ...DEFAULT_AGENT_BEHAVIOR, output_style: style };
    const prompt = generateAgentBehaviorPrompt(config);
    assert(prompt.includes(`[OUTPUT STYLE] ${style.toUpperCase()}`), `output style ${style} correct`);
  }
}

function testConstraints() {
  process.stderr.write("\n--- agent-behavior: constraints ---\n");
  const config: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    constraints: {
      ...DEFAULT_AGENT_BEHAVIOR.constraints,
      require_code_review: true,
      enforce_tdd: true,
      be_skeptical: true,
      max_response_tokens: 5000,
    },
  };
  const prompt = generateAgentBehaviorPrompt(config);
  assert(prompt.includes("- MUST review code before accepting"), "includes require_code_review");
  assert(prompt.includes("- TDD REQUIRED"), "includes enforce_tdd");
  assert(prompt.includes("- BE SKEPTICAL"), "includes be_skeptical");
  assert(prompt.includes("~5000 tokens"), "includes custom token limit");
}

function main() {
  process.stderr.write("=== Agent Behavior Prompt Tests ===\n");

  testDefaults();
  testMatrixCoverage();
  testConstraints();

  process.stderr.write(`\n=== Agent Behavior: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
