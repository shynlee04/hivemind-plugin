/**
 * Unit tests for ToolIntelligenceEngine.
 *
 * Covers the 4 narrow rules + default allow:
 * 1. Block malformed task (missing subagent_type)
 * 2. Block recursive task in child sessions without JIT grant
 * 3. Allow native task for root/front-facing orchestration
 * 4. Block delegate-task for code/artifact editing intent
 * 5. Default allow for unmatched tools
 *
 * Also covers JIT grant lifecycle and guidance rendering.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  ToolIntelligenceEngine,
  getToolIntelligenceEngine,
  renderGuidance,
} from "../../../src/features/tool-intelligence/index.ts";
import type { ToolIntelligenceEvent } from "../../../src/features/tool-intelligence/types.ts";

/** Helper to create a well-formed event with sensible defaults. */
function makeEvent(overrides: Partial<ToolIntelligenceEvent> = {}): ToolIntelligenceEvent {
  return {
    sessionID: "ses_root123",
    agentName: "hm-l0-orchestrator",
    toolName: "task",
    args: { subagent_type: "hm-l2-researcher", prompt: "research this" },
    callID: "call-1",
    delegationDepth: 0,
    isChildSession: false,
    recentToolSequence: [],
    ...overrides,
  };
}

describe("ToolIntelligenceEngine", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine();
  });

  // ---------------------------------------------------------------------------
  // Rule 1: Block malformed task (missing subagent_type)
  // ---------------------------------------------------------------------------
  describe("Rule 1: malformed task call", () => {
    it("blocks task without subagent_type", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({ args: { prompt: "do something" } }),
      );
      expect(decision.kind).toBe("block");
      expect(decision.reason).toContain("missing subagent_type");
      expect(decision.guidance).toBeDefined();
      expect(decision.guidance!.tool).toBe("task");
      expect(decision.guidance!.useInstead).toContain("subagent_type");
    });

    it("blocks task with empty subagent_type", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({ args: { subagent_type: "", prompt: "do something" } }),
      );
      expect(decision.kind).toBe("block");
    });

    it("allows task with valid subagent_type from root", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({ args: { subagent_type: "hm-l2-researcher", prompt: "research" } }),
      );
      expect(decision.kind).toBe("allow");
    });
  });

  // ---------------------------------------------------------------------------
  // Rule 2: Block recursive task in child sessions without JIT grant
  // ---------------------------------------------------------------------------
  describe("Rule 2: recursive task in child session", () => {
    it("blocks task in child session without JIT grant", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          isChildSession: true,
          delegationDepth: 1,
          args: { subagent_type: "hm-l2-coder", prompt: "implement" },
        }),
      );
      expect(decision.kind).toBe("needs_jit_grant");
      expect(decision.reason).toContain("Child session");
      expect(decision.guidance).toBeDefined();
      expect(decision.guidance!.reason).toContain("ecursive");
    });

    it("allows task in child session with JIT grant", () => {
      engine.grantJIT("ses_child1", "hm-l1-coordinator", "task", "coordinator chain");
      const decision = engine.evaluateToolCall(
        makeEvent({
          sessionID: "ses_child1",
          agentName: "hm-l1-coordinator",
          isChildSession: true,
          delegationDepth: 1,
          args: { subagent_type: "hm-l2-coder", prompt: "implement" },
        }),
      );
      expect(decision.kind).toBe("allow");
    });
  });

  // ---------------------------------------------------------------------------
  // Rule 3: Allow native task for root/front-facing orchestration
  // ---------------------------------------------------------------------------
  describe("Rule 3: root orchestration task dispatch", () => {
    it("allows task from root session with valid subagent_type", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          isChildSession: false,
          delegationDepth: 0,
          args: { subagent_type: "hm-l2-researcher", prompt: "investigate" },
        }),
      );
      expect(decision.kind).toBe("allow");
      expect(decision.reason).toContain("Root/front-facing");
      expect(decision.fromCapabilityBaseline).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule 4: Block delegate-task for code/artifact editing intent
  // ---------------------------------------------------------------------------
  describe("Rule 4: delegate-task with code intent", () => {
    it("blocks delegate-task with 'implement' intent", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          toolName: "delegate-task",
          args: { prompt: "Implement the new feature for authentication" },
        }),
      );
      expect(decision.kind).toBe("block");
      expect(decision.reason).toContain("delegate-task blocked for code/artifact");
      expect(decision.guidance!.useInstead).toContain("task");
    });

    it("blocks delegate-task with 'write code' intent", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          toolName: "delegate-task",
          args: { prompt: "Write code to fix the bug in auth.ts" },
        }),
      );
      expect(decision.kind).toBe("block");
    });

    it("blocks delegate-task with 'edit file' intent", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          toolName: "delegate-task",
          args: { prompt: "Edit file src/auth.ts to add validation" },
        }),
      );
      expect(decision.kind).toBe("block");
    });

    it("allows delegate-task with research intent", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          toolName: "delegate-task",
          args: { prompt: "Research the best practices for token rotation" },
        }),
      );
      expect(decision.kind).toBe("allow");
    });

    it("allows delegate-task with analysis intent", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({
          toolName: "delegate-task",
          args: { prompt: "Analyze the current architecture for improvements" },
        }),
      );
      expect(decision.kind).toBe("allow");
    });
  });

  // ---------------------------------------------------------------------------
  // Default: allow
  // ---------------------------------------------------------------------------
  describe("Default: allow unmatched tools", () => {
    it("allows read tool by default", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({ toolName: "read", args: { filePath: "/some/file.ts" } }),
      );
      expect(decision.kind).toBe("allow");
      expect(decision.reason).toContain("No tool intelligence rule matched");
    });

    it("allows bash tool by default", () => {
      const decision = engine.evaluateToolCall(
        makeEvent({ toolName: "bash", args: { command: "npm test" } }),
      );
      expect(decision.kind).toBe("allow");
    });
  });

  // ---------------------------------------------------------------------------
  // JIT grant lifecycle
  // ---------------------------------------------------------------------------
  describe("JIT grant lifecycle", () => {
    it("tracks JIT grants", () => {
      expect(engine.hasJITGrant("ses_1", "agent", "task")).toBe(false);
      engine.grantJIT("ses_1", "agent", "task", "coordinator needs to delegate");
      expect(engine.hasJITGrant("ses_1", "agent", "task")).toBe(true);
    });

    it("isolates JIT grants by session+agent+tool tuple", () => {
      engine.grantJIT("ses_1", "agent-a", "task", "reason");
      expect(engine.hasJITGrant("ses_1", "agent-a", "task")).toBe(true);
      expect(engine.hasJITGrant("ses_1", "agent-b", "task")).toBe(false);
      expect(engine.hasJITGrant("ses_2", "agent-a", "task")).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Guidance rendering
  // ---------------------------------------------------------------------------
  describe("renderGuidance", () => {
    it("renders all 5 guidance fields as multi-line string", () => {
      const text = renderGuidance({
        agent: "hm-l0-orchestrator",
        tool: "delegate-task",
        reason: "Use native task for code editing",
        useInstead: "task({ subagent_type: '...' })",
        context: "depth=0, root session",
      });
      expect(text).toContain("Agent: hm-l0-orchestrator");
      expect(text).toContain("Tool: delegate-task");
      expect(text).toContain("Reason: Use native task for code editing");
      expect(text).toContain("Use instead: task({ subagent_type: '...' })");
      expect(text).toContain("Context: depth=0, root session");
    });
  });

  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------
  describe("getToolIntelligenceEngine singleton", () => {
    it("returns the same instance on repeated calls", () => {
      const a = getToolIntelligenceEngine();
      const b = getToolIntelligenceEngine();
      expect(a).toBe(b);
    });
  });

  // ---------------------------------------------------------------------------
  // Decision metadata
  // ---------------------------------------------------------------------------
  describe("decision metadata", () => {
    it("always includes timestamp", () => {
      const decision = engine.evaluateToolCall(makeEvent());
      expect(decision.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("includes toolCategory from TOOL_CAPABILITY_MAP when available", () => {
      const decision = engine.evaluateToolCall(makeEvent({ toolName: "task" }));
      expect(decision.toolCategory).toBeDefined();
    });

    it("sets fromCapabilityBaseline=true only for Rule 3 (root task)", () => {
      const rootDecision = engine.evaluateToolCall(
        makeEvent({ isChildSession: false, delegationDepth: 0 }),
      );
      expect(rootDecision.fromCapabilityBaseline).toBe(true);

      const defaultDecision = engine.evaluateToolCall(
        makeEvent({ toolName: "read", args: { filePath: "/x" } }),
      );
      expect(defaultDecision.fromCapabilityBaseline).toBe(false);
    });
  });
});
