/**
 * Unit tests for ToolIntelligenceEngine — config-driven contract.
 *
 * The engine is now config-driven: severities for R1/R2/R4 detectors
 * come from `.hivemind/configs.json` `governance.rules[].action.type`.
 * The 4 detectors (R1/R2/R3/R4) classify events; config decides.
 *
 * The SAMPLE_RULES inline below mirrors production:
 *   - R1-malformed-task              → block
 *   - R2-child-recursive-task        → needs_jit_grant
 *   - R4-delegate-task-code-intent   → block
 *   - default                        → allow
 *
 * Engine bug fix under test: `findMatchingRule(event, detectorRuleId)`
 * filters R-prefixed rules so they only fire when the corresponding
 * detector classified the event. Without this filter, a config rule
 * with `toolNames: ["delegate-task"]` would over-block every
 * `delegate-task` call regardless of intent.
 *
 * Evidence label: `runtime-truthful` — every test exercises the public
 * `evaluateToolCall` / `grantJIT` / `hasJITGrant` / `renderGuidance` /
 * `getToolIntelligenceEngine` seam. No internals are mocked.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ToolIntelligenceEngine,
  getToolIntelligenceEngine,
  resetToolIntelligenceEngine,
  renderGuidance,
} from "../../../src/features/tool-intelligence/index.js";
import type {
  GovernanceActionType,
} from "../../../src/features/tool-intelligence/index.js";
import type { ToolIntelligenceEvent } from "../../../src/features/tool-intelligence/types.js";

// ---------------------------------------------------------------------------
// SAMPLE_RULES — inline governance rule set mirroring production
// ---------------------------------------------------------------------------

type SampleRule = {
  id: string;
  enabled: boolean;
  condition: {
    toolNames?: readonly string[];
    sessionIDs?: readonly string[];
    depth?: { min?: number; max?: number };
  };
  action: { type: GovernanceActionType };
};

const SAMPLE_RULES: ReadonlyArray<SampleRule> = [
  {
    id: "R1-malformed-task",
    enabled: true,
    condition: { toolNames: ["task"] },
    action: { type: "block" },
  },
  {
    id: "R2-child-recursive-task",
    enabled: true,
    condition: { toolNames: ["task"] },
    action: { type: "needs_jit_grant" },
  },
  {
    id: "R4-delegate-task-code-intent",
    enabled: true,
    condition: { toolNames: ["delegate-task"] },
    action: { type: "block" },
  },
  {
    id: "default",
    enabled: true,
    condition: {},
    action: { type: "allow" },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a well-formed event with sensible defaults. */
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

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — constructor", () => {
  it("accepts an inline rule set and preserves the rules order", () => {
    const engine = new ToolIntelligenceEngine(SAMPLE_RULES);
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "no subagent" } }),
    );
    expect(decision.kind).toBe("block");
  });

  it("accepts no-arg constructor and defaults to allow for everything", () => {
    const engine = new ToolIntelligenceEngine();
    const decision = engine.evaluateToolCall(makeEvent());
    expect(decision.kind).toBe("allow");
  });

  it("treats omitted `enabled` as true when building the rule set", () => {
    const engine = new ToolIntelligenceEngine([
      {
        id: "R1-malformed-task",
        condition: { toolNames: ["task"] },
        action: { type: "block" },
      },
    ]);
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "missing" } }),
    );
    expect(decision.kind).toBe("block");
  });

  it("skips disabled rules", () => {
    const engine = new ToolIntelligenceEngine([
      {
        id: "R1-malformed-task",
        enabled: false,
        condition: { toolNames: ["task"] },
        action: { type: "block" },
      },
      {
        id: "default",
        condition: {},
        action: { type: "allow" },
      },
    ]);
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "missing" } }),
    );
    expect(decision.kind).toBe("allow");
  });
});

// ---------------------------------------------------------------------------
// R1 — malformed task (missing subagent_type)
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — R1 (malformed task)", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("blocks a task call missing subagent_type", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "do something" } }),
    );
    expect(decision.kind).toBe("block");
  });

  it("blocks a task call with empty subagent_type", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { subagent_type: "", prompt: "do something" } }),
    );
    expect(decision.kind).toBe("block");
  });

  it("R1 reason text references the R1 detector and config severity", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "missing target" } }),
    );
    expect(decision.reason).toContain("Malformed task call");
    expect(decision.reason).toContain("R1-malformed-task");
  });

  it("R1 populates guidance with all five fields", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "no target" } }),
    );
    expect(decision.guidance).toBeDefined();
    expect(decision.guidance!.agent).toBe("hm-l0-orchestrator");
    expect(decision.guidance!.tool).toBe("task");
    expect(decision.guidance!.reason).toContain("subagent_type");
    expect(decision.guidance!.useInstead).toContain("subagent_type");
    expect(decision.guidance!.context).toContain("ses_root123");
  });
});

// ---------------------------------------------------------------------------
// R2 — recursive task in child session without JIT grant
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — R2 (child recursive task)", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("requests a JIT grant when child session calls task without one", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: true,
        delegationDepth: 1,
        args: { subagent_type: "hm-l2-coder", prompt: "implement" },
      }),
    );
    expect(decision.kind).toBe("needs_jit_grant");
  });

  it("R2 reason text references the R2 detector", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: true,
        delegationDepth: 1,
        args: { subagent_type: "hm-l2-coder", prompt: "implement" },
      }),
    );
    expect(decision.reason).toContain("Child session");
    expect(decision.reason).toContain("R2-child-recursive-task");
  });

  it("allows child session task once a JIT grant is in place", () => {
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

  it("R2 populates guidance with useInstead pointing to the parent", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: true,
        delegationDepth: 1,
        args: { subagent_type: "hm-l2-coder", prompt: "implement" },
      }),
    );
    expect(decision.guidance).toBeDefined();
    expect(decision.guidance!.useInstead.toLowerCase()).toContain("parent");
  });
});

// ---------------------------------------------------------------------------
// R3 — root/front-facing orchestration task dispatch (allow path)
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — R3 (root/front-facing task)", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("allows a root session task with valid subagent_type", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: false,
        delegationDepth: 0,
        args: { subagent_type: "hm-l2-researcher", prompt: "investigate" },
      }),
    );
    expect(decision.kind).toBe("allow");
  });

  it("R3 reason text mentions root/front-facing dispatch", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: false,
        delegationDepth: 0,
        args: { subagent_type: "hm-l2-researcher", prompt: "investigate" },
      }),
    );
    expect(decision.reason).toContain("Root/front-facing");
  });

  it("R3 sets fromCapabilityBaseline=true", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: false,
        delegationDepth: 0,
        args: { subagent_type: "hm-l2-researcher", prompt: "investigate" },
      }),
    );
    expect(decision.fromCapabilityBaseline).toBe(true);
  });

  it("R3 path produces no guidance field (allow is silent)", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        isChildSession: false,
        delegationDepth: 0,
        args: { subagent_type: "hm-l2-researcher", prompt: "investigate" },
      }),
    );
    expect(decision.guidance).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// R4 — delegate-task with code/artifact editing intent
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — R4 (delegate-task code intent)", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("blocks delegate-task with 'implement' intent", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        toolName: "delegate-task",
        args: { prompt: "Implement the new feature for authentication" },
      }),
    );
    expect(decision.kind).toBe("block");
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

  it("allows delegate-task with research intent (R4 detector does not fire)", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        toolName: "delegate-task",
        args: { prompt: "Research the best practices for token rotation" },
      }),
    );
    expect(decision.kind).toBe("allow");
  });

  it("allows delegate-task with analysis intent (R4 detector does not fire)", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        toolName: "delegate-task",
        args: { prompt: "Analyze the current architecture for improvements" },
      }),
    );
    expect(decision.kind).toBe("allow");
  });

  it("R4 reason text references the R4 detector and config severity", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({
        toolName: "delegate-task",
        args: { prompt: "Implement the new feature" },
      }),
    );
    expect(decision.reason).toContain("delegate-task with code/artifact intent");
    expect(decision.reason).toContain("R4-delegate-task-code-intent");
  });
});

// ---------------------------------------------------------------------------
// Default — allow unmatched tools
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — default (unmatched tool)", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("allows read tool by default (no detector, default rule fires)", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ toolName: "read", args: { filePath: "/some/file.ts" } }),
    );
    expect(decision.kind).toBe("allow");
  });

  it("default reason text indicates no rule matched", () => {
    const decision = engine.evaluateToolCall(
      makeEvent({ toolName: "read", args: { filePath: "/some/file.ts" } }),
    );
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

describe("ToolIntelligenceEngine — JIT grant lifecycle", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("starts with no JIT grants", () => {
    expect(engine.hasJITGrant("ses_1", "agent", "task")).toBe(false);
  });

  it("grantJIT() records a grant and hasJITGrant() returns true", () => {
    engine.grantJIT("ses_1", "agent", "task", "coordinator needs to delegate");
    expect(engine.hasJITGrant("ses_1", "agent", "task")).toBe(true);
  });

  it("isolates JIT grants by the session+agent+tool tuple", () => {
    engine.grantJIT("ses_1", "agent-a", "task", "reason");
    expect(engine.hasJITGrant("ses_1", "agent-a", "task")).toBe(true);
    expect(engine.hasJITGrant("ses_1", "agent-b", "task")).toBe(false);
    expect(engine.hasJITGrant("ses_2", "agent-a", "task")).toBe(false);
  });

  it("grantJIT can overwrite a prior grant for the same tuple", () => {
    engine.grantJIT("ses_1", "agent", "task", "first");
    engine.grantJIT("ses_1", "agent", "task", "second");
    expect(engine.hasJITGrant("ses_1", "agent", "task")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// renderGuidance
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — renderGuidance", () => {
  it("renders all five guidance fields as a multi-line string", () => {
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

  it("renderGuidance output uses newline separators", () => {
    const text = renderGuidance({
      agent: "a",
      tool: "t",
      reason: "r",
      useInstead: "u",
      context: "c",
    });
    expect(text.split("\n")).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Singleton + reset
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — getToolIntelligenceEngine + reset", () => {
  afterEach(() => {
    resetToolIntelligenceEngine();
  });

  it("returns the same instance on repeated calls", () => {
    const a = getToolIntelligenceEngine();
    const b = getToolIntelligenceEngine();
    expect(a).toBe(b);
  });

  it("resetToolIntelligenceEngine() forces the next call to return a new instance", () => {
    const a = getToolIntelligenceEngine();
    resetToolIntelligenceEngine();
    const b = getToolIntelligenceEngine();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Decision metadata
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — decision metadata", () => {
  let engine: ToolIntelligenceEngine;

  beforeEach(() => {
    engine = new ToolIntelligenceEngine(SAMPLE_RULES);
  });

  it("always includes a valid ISO 8601 timestamp", () => {
    const decision = engine.evaluateToolCall(makeEvent());
    expect(decision.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes toolCategory from TOOL_CAPABILITY_MAP when available", () => {
    const decision = engine.evaluateToolCall(makeEvent({ toolName: "task" }));
    expect(decision.toolCategory).toBeDefined();
  });

  it("R3 path sets fromCapabilityBaseline=true; all other paths set false", () => {
    const r3 = engine.evaluateToolCall(
      makeEvent({ isChildSession: false, delegationDepth: 0 }),
    );
    expect(r3.fromCapabilityBaseline).toBe(true);

    const r1 = engine.evaluateToolCall(
      makeEvent({ args: { prompt: "no target" } }),
    );
    expect(r1.fromCapabilityBaseline).toBe(false);

    const defaultDecision = engine.evaluateToolCall(
      makeEvent({ toolName: "read", args: { filePath: "/x" } }),
    );
    expect(defaultDecision.fromCapabilityBaseline).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Config-driven severity mutability
// ---------------------------------------------------------------------------

describe("ToolIntelligenceEngine — config-driven severity mutability", () => {
  it("changing R1 action.type from block to warn changes the decision kind", () => {
    const blocking = new ToolIntelligenceEngine([
      {
        id: "R1-malformed-task",
        condition: { toolNames: ["task"] },
        action: { type: "block" },
      },
      { id: "default", condition: {}, action: { type: "allow" } },
    ]);
    const warning = new ToolIntelligenceEngine([
      {
        id: "R1-malformed-task",
        condition: { toolNames: ["task"] },
        action: { type: "warn" },
      },
      { id: "default", condition: {}, action: { type: "allow" } },
    ]);
    const event = makeEvent({ args: { prompt: "no target" } });
    expect(blocking.evaluateToolCall(event).kind).toBe("block");
    expect(warning.evaluateToolCall(event).kind).toBe("warn");
  });

  it("R-prefix rules do not over-match when the corresponding detector did not fire", () => {
    // R4 rule has toolNames: ["delegate-task"], but the test prompt has
    // research intent — the R4 detector should NOT fire, so the engine
    // must fall through to the default allow. Without the
    // detectorRuleId filter, the walker would match R4 and block.
    const engine = new ToolIntelligenceEngine([
      {
        id: "R4-delegate-task-code-intent",
        condition: { toolNames: ["delegate-task"] },
        action: { type: "block" },
      },
      { id: "default", condition: {}, action: { type: "allow" } },
    ]);
    const decision = engine.evaluateToolCall(
      makeEvent({
        toolName: "delegate-task",
        args: { prompt: "Research the best practices for token rotation" },
      }),
    );
    expect(decision.kind).toBe("allow");
  });
});
