/**
 * Agent Behavior Prompt Regression Tests
 *
 * Verifies prompt generation across language, level, style, and constraints.
 */

import {
  DEFAULT_AGENT_BEHAVIOR,
  generateAgentBehaviorPrompt,
  type AgentBehaviorConfig,
  type ExpertLevel,
  type Language,
  type OutputStyle,
} from "../src/schemas/config.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

function buildConfig(overrides: Partial<AgentBehaviorConfig>): AgentBehaviorConfig {
  return {
    ...DEFAULT_AGENT_BEHAVIOR,
    ...overrides,
    constraints: {
      ...DEFAULT_AGENT_BEHAVIOR.constraints,
      ...(overrides.constraints ?? {}),
    },
  }
}

function testDefaultPromptShape(): void {
  process.stderr.write("\n--- agent-behavior: default prompt shape ---\n")
  const prompt = generateAgentBehaviorPrompt(DEFAULT_AGENT_BEHAVIOR)

  assert(prompt.includes("<agent-configuration>"), "opens with agent configuration tag")
  assert(prompt.includes("</agent-configuration>"), "closes with agent configuration tag")
  assert(prompt.includes("[LANGUAGE] Respond ONLY in English. No exceptions."), "default language policy is English")
  assert(prompt.includes("[EXPERT LEVEL] INTERMEDIATE:"), "default expert level is intermediate")
  assert(prompt.includes("[OUTPUT STYLE] EXPLANATORY:"), "default output style is explanatory")
  assert(prompt.includes("- ALWAYS explain your reasoning"), "default includes explain reasoning constraint")
  assert(prompt.includes("- Maximum response: ~2000 tokens"), "default includes max response token line")
  assert(prompt.includes("VIOLATION: If you cannot obey these constraints"), "default includes violation policy")
  assert(!prompt.includes("- MUST review code before accepting"), "default omits code review constraint when disabled")
  assert(!prompt.includes("- TDD REQUIRED: Write failing test first, then implementation"), "default omits TDD constraint when disabled")
  assert(!prompt.includes("- BE SKEPTICAL: Question requirements, point out gaps"), "default omits skeptical constraint when disabled")
}

function testLanguageVariants(): void {
  process.stderr.write("\n--- agent-behavior: language variants ---\n")
  const en = generateAgentBehaviorPrompt(buildConfig({ language: "en" }))
  const vi = generateAgentBehaviorPrompt(buildConfig({ language: "vi" }))

  assert(en.includes("Respond ONLY in English"), "english language text renders")
  assert(vi.includes("Respond ONLY in Vietnamese (Tiếng Việt)"), "vietnamese language text renders")
}

function testExpertLevels(): void {
  process.stderr.write("\n--- agent-behavior: expert levels ---\n")
  const levels: Array<{ level: ExpertLevel; expected: string }> = [
    { level: "beginner", expected: "Explain everything simply." },
    { level: "intermediate", expected: "Standard technical depth." },
    { level: "advanced", expected: "Concise, sophisticated." },
    { level: "expert", expected: "Terse, reference advanced concepts." },
  ]

  for (const { level, expected } of levels) {
    const prompt = generateAgentBehaviorPrompt(buildConfig({ expert_level: level }))
    assert(prompt.includes(`[EXPERT LEVEL] ${level.toUpperCase()}:`), `expert header renders for ${level}`)
    assert(prompt.includes(expected), `expert description renders for ${level}`)
  }
}

function testOutputStyles(): void {
  process.stderr.write("\n--- agent-behavior: output styles ---\n")
  const styles: Array<{ style: OutputStyle; expected: string }> = [
    { style: "explanatory", expected: "- Explain WHY, not just WHAT" },
    { style: "outline", expected: "- Use bullet points and structured lists" },
    { style: "skeptical", expected: "- Challenge assumptions in the request" },
    { style: "architecture", expected: "- Start with high-level design" },
    { style: "minimal", expected: "- Code only, minimal prose" },
  ]

  for (const { style, expected } of styles) {
    const prompt = generateAgentBehaviorPrompt(buildConfig({ output_style: style }))
    assert(prompt.includes(`[OUTPUT STYLE] ${style.toUpperCase()}:`), `style header renders for ${style}`)
    assert(prompt.includes(expected), `style guidance renders for ${style}`)
  }
}

function testConstraintFlagsAndTokenLimits(): void {
  process.stderr.write("\n--- agent-behavior: constraints and token limits ---\n")
  const strictPrompt = generateAgentBehaviorPrompt(buildConfig({
    constraints: {
      require_code_review: true,
      enforce_tdd: true,
      max_response_tokens: 1234,
      explain_reasoning: true,
      be_skeptical: true,
    },
  }))

  assert(strictPrompt.includes("- MUST review code before accepting"), "code review constraint renders")
  assert(strictPrompt.includes("- TDD REQUIRED: Write failing test first, then implementation"), "TDD constraint renders")
  assert(strictPrompt.includes("- ALWAYS explain your reasoning"), "reasoning constraint renders")
  assert(strictPrompt.includes("- BE SKEPTICAL: Question requirements, point out gaps"), "skeptical constraint renders")
  assert(strictPrompt.includes("- Maximum response: ~1234 tokens"), "custom max token line renders")

  const relaxedPrompt = generateAgentBehaviorPrompt(buildConfig({
    constraints: {
      require_code_review: false,
      enforce_tdd: false,
      max_response_tokens: 0,
      explain_reasoning: false,
      be_skeptical: false,
    },
  }))

  assert(!relaxedPrompt.includes("- MUST review code before accepting"), "disabled code review line omitted")
  assert(!relaxedPrompt.includes("- TDD REQUIRED: Write failing test first, then implementation"), "disabled TDD line omitted")
  assert(!relaxedPrompt.includes("- ALWAYS explain your reasoning"), "disabled explain reasoning line omitted")
  assert(!relaxedPrompt.includes("- BE SKEPTICAL: Question requirements, point out gaps"), "disabled skeptical line omitted")
  assert(relaxedPrompt.includes("- Maximum response: ~0 tokens"), "zero token limit renders explicitly")
}

function testAllLanguagesWithAllStyles(): void {
  process.stderr.write("\n--- agent-behavior: language/style matrix smoke ---\n")
  const languages: Language[] = ["en", "vi"]
  const styles: OutputStyle[] = ["explanatory", "outline", "skeptical", "architecture", "minimal"]

  for (const language of languages) {
    for (const style of styles) {
      const prompt = generateAgentBehaviorPrompt(buildConfig({ language, output_style: style }))
      assert(prompt.includes("<agent-configuration>"), `prompt opens for ${language}/${style}`)
      assert(prompt.includes("</agent-configuration>"), `prompt closes for ${language}/${style}`)
    }
  }
}

process.stderr.write("=== agent-behavior-prompt.test.ts ===\n")
testDefaultPromptShape()
testLanguageVariants()
testExpertLevels()
testOutputStyles()
testConstraintFlagsAndTokenLimits()
testAllLanguagesWithAllStyles()
process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
