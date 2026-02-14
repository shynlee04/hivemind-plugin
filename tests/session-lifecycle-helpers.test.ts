import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  formatHintList,
  localized,
  getNextStepHint,
  generateBootstrapBlock,
  collectProjectSnapshot,
  compileFirstTurnContext,
  generateSetupGuidanceBlock
} from "../src/hooks/session-lifecycle-helpers.js";
import { createBrainState } from "../src/schemas/brain-state.js";
import { createConfig } from "../src/schemas/config.js";

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), "hm-lifecycle-test-"));
}

describe("Session Lifecycle Helpers", () => {
  describe("formatHintList", () => {
    it("should format list", () => {
      assert.equal(formatHintList(["a", "b"]), "a, b");
    });
    it("should handle empty list", () => {
      assert.equal(formatHintList([]), "none detected");
    });
  });

  describe("localized", () => {
    it("should return english", () => {
      assert.equal(localized("en", "hello", "xin chao"), "hello");
    });
    it("should return vietnamese", () => {
      assert.equal(localized("vi", "hello", "xin chao"), "xin chao");
    });
  });

  describe("getNextStepHint", () => {
    it("should suggest declare_intent if no trajectory", () => {
      const hint = getNextStepHint("en", { trajectory: "", tactic: "", action: "" });
      assert.ok(hint.includes("declare_intent"));
    });
    it("should suggest map_context tactic if no tactic", () => {
        const hint = getNextStepHint("en", { trajectory: "foo", tactic: "", action: "" });
        assert.ok(hint.includes("map_context"));
        assert.ok(hint.includes("tactic"));
    });
    it("should suggest map_context action if no action", () => {
        const hint = getNextStepHint("en", { trajectory: "foo", tactic: "bar", action: "" });
        assert.ok(hint.includes("map_context"));
        assert.ok(hint.includes("action"));
    });
    it("should suggest continue if all set", () => {
        const hint = getNextStepHint("en", { trajectory: "foo", tactic: "bar", action: "baz" });
        assert.ok(hint.includes("continue execution"));
    });
  });

  describe("generateBootstrapBlock", () => {
    it("should generate bootstrap content", () => {
        const block = generateBootstrapBlock("strict", "en");
        assert.ok(block.includes("<hivemind-bootstrap>"));
        assert.ok(block.includes("REQUIRED WORKFLOW"));
    });
  });

  describe("collectProjectSnapshot", () => {
    it("should detect package.json dependencies", async () => {
      const dir = createTempDir();
      writeFileSync(join(dir, "package.json"), JSON.stringify({
        name: "test-proj",
        dependencies: { "react": "18.0.0" }
      }));

      const snapshot = await collectProjectSnapshot(dir);
      assert.equal(snapshot.projectName, "test-proj");
      assert.ok(snapshot.stackHints.includes("React"));
    });

    it("should detect ecosystem files", async () => {
      const dir = createTempDir();
      writeFileSync(join(dir, "go.mod"), "module test");

      const snapshot = await collectProjectSnapshot(dir);
      assert.ok(snapshot.stackHints.includes("Go"));
    });

    it("should detect artifacts", async () => {
        const dir = createTempDir();
        writeFileSync(join(dir, "README.md"), "# Readme");
        const snapshot = await collectProjectSnapshot(dir);
        assert.ok(snapshot.artifactHints.includes("README.md"));
    });
  });

  describe("compileFirstTurnContext", () => {
      it("should return empty string if no context", async () => {
          const dir = createTempDir();
          mkdirSync(join(dir, ".hivemind"), { recursive: true });
          // No files present

          const state = createBrainState("test", createConfig());
          const context = await compileFirstTurnContext(dir, state);
          assert.equal(context, "");
      });

      it("should include anchors", async () => {
          const dir = createTempDir();
          mkdirSync(join(dir, ".hivemind", "state"), { recursive: true });

          writeFileSync(join(dir, ".hivemind", "state", "anchors.json"), JSON.stringify({
              anchors: [{ key: "test", value: "val", created_at: 1, session_id: "s1" }],
              version: "1"
          }));

          const state = createBrainState("test", createConfig());
          const context = await compileFirstTurnContext(dir, state);
          assert.ok(context.includes("Anchors (1): [test] val"));
      });

      it("should include mems", async () => {
          const dir = createTempDir();
          mkdirSync(join(dir, ".hivemind", "memory"), { recursive: true });

          writeFileSync(join(dir, ".hivemind", "memory", "mems.json"), JSON.stringify({
              mems: [{ id: "1", shelf: "context", content: "mem1", tags: [], session_id: "s1", created_at: 1 }],
              version: "1"
          }));

          const state = createBrainState("test", createConfig());
          const context = await compileFirstTurnContext(dir, state);
          assert.ok(context.includes("Mems (1)"));
          assert.ok(context.includes("mem1"));
      });

      it("should include prior session trajectory", async () => {
          const dir = createTempDir();
          mkdirSync(join(dir, ".hivemind", "sessions"), { recursive: true });

          writeFileSync(join(dir, ".hivemind", "sessions", "manifest.json"), JSON.stringify({
              sessions: [{
                  stamp: "2026",
                  file: "s1.md",
                  status: "archived",
                  created: 1,
                  summary: "Previous work",
                  trajectory: "Build X",
                  linked_plans: []
              }]
          }));

          const state = createBrainState("test", createConfig());
          const context = await compileFirstTurnContext(dir, state);
          assert.ok(context.includes("Prior session"));
          assert.ok(context.includes("Build X"));
      });
  });
});
