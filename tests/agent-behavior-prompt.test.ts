/**
 * Agent Behavior Prompt Tests
 * Verifies that the agent configuration prompt is generated correctly.
 */

import { generateAgentBehaviorPrompt, DEFAULT_AGENT_BEHAVIOR } from "../src/schemas/config.js";
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

function testLanguage() {
  process.stderr.write("\n--- agent-behavior: language ---\n");
  const config: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    language: "vi",
  };
  const prompt = generateAgentBehaviorPrompt(config);
  assert(prompt.includes("[LANGUAGE] Respond ONLY in Vietnamese (Tiếng Việt)"), "supports Vietnamese");
}

function testExpertLevel() {
  process.stderr.write("\n--- agent-behavior: expert level ---\n");
  const config: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    expert_level: "beginner",
  };
  const prompt = generateAgentBehaviorPrompt(config);
  assert(prompt.includes("[EXPERT LEVEL] BEGINNER"), "supports beginner");
  assert(prompt.includes("Explain everything simply"), "beginner description correct");
}

function testOutputStyle() {
  process.stderr.write("\n--- agent-behavior: output style ---\n");
  const config: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    output_style: "minimal",
  };
  const prompt = generateAgentBehaviorPrompt(config);
  assert(prompt.includes("[OUTPUT STYLE] MINIMAL"), "supports minimal style");
  assert(prompt.includes("- Code only, minimal prose"), "minimal description correct");
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
  testLanguage();
  testExpertLevel();
  testOutputStyle();
  testConstraints();

  process.stderr.write(`\n=== Agent Behavior: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
