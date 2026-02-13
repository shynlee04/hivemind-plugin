import { test } from "node:test";
import assert from "node:assert";
import { generateAgentBehaviorPrompt, AgentBehaviorConfig } from "../src/schemas/config.js";

test("generateAgentBehaviorPrompt matrix", async (t) => {
  await t.test("enforces language", () => {
    const prompt = generateAgentBehaviorPrompt({
        language: "vi",
        expert_level: "intermediate",
        output_style: "explanatory",
        constraints: {
            require_code_review: false,
            enforce_tdd: false,
            max_response_tokens: 1000,
            explain_reasoning: true,
            be_skeptical: false
        }
    });
    assert.match(prompt, /Respond ONLY in Vietnamese/);
  });

  await t.test("enforces expert level", () => {
    const prompt = generateAgentBehaviorPrompt({
        language: "en",
        expert_level: "expert",
        output_style: "minimal",
        constraints: {
            require_code_review: false,
            enforce_tdd: false,
            max_response_tokens: 1000,
            explain_reasoning: true,
            be_skeptical: false
        }
    });
    assert.match(prompt, /\[EXPERT LEVEL\] EXPERT: Terse/);
  });

  await t.test("enforces output style", () => {
    const prompt = generateAgentBehaviorPrompt({
        language: "en",
        expert_level: "intermediate",
        output_style: "skeptical",
        constraints: {
            require_code_review: false,
            enforce_tdd: false,
            max_response_tokens: 1000,
            explain_reasoning: true,
            be_skeptical: true
        }
    });
    assert.match(prompt, /\[OUTPUT STYLE\] SKEPTICAL:/);
    assert.match(prompt, /- Challenge assumptions/);
  });

  await t.test("enforces constraints", () => {
     const prompt = generateAgentBehaviorPrompt({
        language: "en",
        expert_level: "intermediate",
        output_style: "explanatory",
        constraints: {
            require_code_review: true,
            enforce_tdd: true,
            max_response_tokens: 500,
            explain_reasoning: true,
            be_skeptical: false
        }
    });
    assert.match(prompt, /- MUST review code before accepting/);
    assert.match(prompt, /- TDD REQUIRED/);
    assert.match(prompt, /Maximum response: ~500 tokens/);
  });

  await t.test("handles edge cases", () => {
      // 0 tokens
     const prompt = generateAgentBehaviorPrompt({
        language: "en",
        expert_level: "intermediate",
        output_style: "explanatory",
        constraints: {
            require_code_review: false,
            enforce_tdd: false,
            max_response_tokens: 0,
            explain_reasoning: true,
            be_skeptical: false
        }
    });
    assert.match(prompt, /Maximum response: ~0 tokens/);
  });
});
