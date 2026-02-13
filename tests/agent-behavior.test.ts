/**
 * Agent Behavior Prompt Tests
 * Verifies the generation of the mandatory agent configuration prompt
 */

import {
  generateAgentBehaviorPrompt,
  DEFAULT_AGENT_BEHAVIOR,
  AgentBehaviorConfig,
  Language,
  ExpertLevel,
  OutputStyle,
  LANGUAGES,
  EXPERT_LEVELS,
  OUTPUT_STYLES
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

// ─── Test Cases ──────────────────────────────────────────────────────

function test_default_behavior() {
  process.stderr.write("\n--- default behavior ---\n");
  const prompt = generateAgentBehaviorPrompt(DEFAULT_AGENT_BEHAVIOR);

  assert(prompt.includes("<agent-configuration>"), "includes opening tag");
  assert(prompt.includes("</agent-configuration>"), "includes closing tag");
  assert(prompt.includes("MANDATORY: You MUST obey these constraints"), "includes mandatory warning");
  assert(prompt.includes("[LANGUAGE] Respond ONLY in English"), "default language is English");
  assert(prompt.includes("[EXPERT LEVEL] INTERMEDIATE"), "default expert level is intermediate");
  assert(prompt.includes("[OUTPUT STYLE] EXPLANATORY"), "default output style is explanatory");
  assert(prompt.includes("- ALWAYS explain your reasoning"), "default constraint includes explain_reasoning");
  assert(prompt.includes("~2000 tokens"), "default max tokens is 2000");
}

function test_language_enforcement() {
  process.stderr.write("\n--- language enforcement ---\n");

  const viConfig: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    language: "vi"
  };
  const prompt = generateAgentBehaviorPrompt(viConfig);
  assert(prompt.includes("[LANGUAGE] Respond ONLY in Vietnamese"), "sets Vietnamese language");
}

function test_expert_levels() {
  process.stderr.write("\n--- expert levels ---\n");

  const descriptions: Record<ExpertLevel, string> = {
    beginner: "Explain everything simply",
    intermediate: "Standard technical depth",
    advanced: "Concise, sophisticated",
    expert: "Terse, reference advanced concepts"
  };

  for (const level of EXPERT_LEVELS) {
    const config: AgentBehaviorConfig = {
      ...DEFAULT_AGENT_BEHAVIOR,
      expert_level: level
    };
    const prompt = generateAgentBehaviorPrompt(config);
    assert(prompt.includes(`[EXPERT LEVEL] ${level.toUpperCase()}`), `includes ${level} header`);
    assert(prompt.includes(descriptions[level]), `includes ${level} description`);
  }
}

function test_output_styles() {
  process.stderr.write("\n--- output styles ---\n");

  const snippets: Record<OutputStyle, string> = {
    explanatory: "Explain WHY, not just WHAT",
    outline: "Use bullet points and structured lists",
    skeptical: "Challenge assumptions in the request",
    architecture: "Start with high-level design",
    minimal: "Code only, minimal prose"
  };

  for (const style of OUTPUT_STYLES) {
    const config: AgentBehaviorConfig = {
      ...DEFAULT_AGENT_BEHAVIOR,
      output_style: style
    };
    const prompt = generateAgentBehaviorPrompt(config);
    assert(prompt.includes(`[OUTPUT STYLE] ${style.toUpperCase()}`), `includes ${style} header`);
    assert(prompt.includes(snippets[style]), `includes unique instruction for ${style}`);
  }
}

function test_constraints() {
  process.stderr.write("\n--- constraints ---\n");

  // Test code review
  const reviewConfig: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    constraints: { ...DEFAULT_AGENT_BEHAVIOR.constraints, require_code_review: true }
  };
  assert(
    generateAgentBehaviorPrompt(reviewConfig).includes("MUST review code before accepting"),
    "includes code review constraint"
  );

  // Test TDD
  const tddConfig: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    constraints: { ...DEFAULT_AGENT_BEHAVIOR.constraints, enforce_tdd: true }
  };
  assert(
    generateAgentBehaviorPrompt(tddConfig).includes("TDD REQUIRED"),
    "includes TDD constraint"
  );

  // Test Skeptical
  const skepticConfig: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    constraints: { ...DEFAULT_AGENT_BEHAVIOR.constraints, be_skeptical: true }
  };
  assert(
    generateAgentBehaviorPrompt(skepticConfig).includes("BE SKEPTICAL: Question requirements"),
    "includes be_skeptical constraint"
  );

  // Test max tokens
  const tokenConfig: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    constraints: { ...DEFAULT_AGENT_BEHAVIOR.constraints, max_response_tokens: 5000 }
  };
  assert(
    generateAgentBehaviorPrompt(tokenConfig).includes("~5000 tokens"),
    "reflects custom max token count"
  );
}

// ─── Runner ─────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== Agent Behavior Prompt Tests ===\n");

  test_default_behavior();
  test_language_enforcement();
  test_expert_levels();
  test_output_styles();
  test_constraints();

  process.stderr.write(`\n=== Agent Behavior: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main();
