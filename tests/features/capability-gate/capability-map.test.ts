import { describe, it, expect } from "vitest";
import { TOOL_CAPABILITY_MAP, ToolCategory, CapabilityGate } from "../../../src/features/capability-gate/index.ts";

const READ_ONLY_TOOLS = ["read", "glob", "grep"] as const;

describe("ToolCapabilityMap classifications", () => {
  it("classifies all 31 harness tools (map size)", () => {
    expect(TOOL_CAPABILITY_MAP.size).toBe(31);
    const validCategories = new Set(Object.values(ToolCategory));
    for (const [, record] of TOOL_CAPABILITY_MAP) {
      expect(validCategories.has(record.category)).toBe(true);
    }
  });

  it("contains all OpenCode built-ins", () => {
    for (const tool of ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command"]) {
      expect(TOOL_CAPABILITY_MAP.has(tool)).toBe(true);
    }
  });

  it("contains all 14 orphaned harness tools", () => {
    for (const tool of [
      "delegate-task",
      "delegation-status",
      "run-background-command",
      "hivemind-pressure",
      "hivemind-trajectory",
      "hivemind-session-view",
      "hivemind-command-engine",
      "create-governance-session",
      "configure-primitive",
      "bootstrap-init",
      "bootstrap-recover",
      "validate-restart",
      "hivemind-doc",
      "prompt-analyze",
    ]) {
      expect(TOOL_CAPABILITY_MAP.has(tool)).toBe(true);
    }
  });

  it("contains the remaining 10 registered harness tools", () => {
    for (const tool of [
      "session-tracker",
      "session-hierarchy",
      "session-context",
      "session-journal-export",
      "session-delegation-query",
      "hivemind-agent-work-create",
      "hivemind-agent-work-export",
      "hivemind-sdk-supervisor",
      "session-patch",
      "prompt-skim",
    ]) {
      expect(TOOL_CAPABILITY_MAP.has(tool)).toBe(true);
    }
  });

  it("resolveToolsForAgent returns non-empty for known agent", () => {
    const gate = new CapabilityGate();
    const result = gate.resolveToolsForAgent("hm-l0-orchestrator");
    expect(result.length).toBeGreaterThan(0);
    for (const tool of result) {
      expect(typeof tool).toBe("string");
    }
  });

  it("resolveToolsForAgent returns read-only defaults for unknown agent", () => {
    const gate = new CapabilityGate();
    const result = gate.resolveToolsForAgent("nonexistent-agent-xyz");
    for (const tool of READ_ONLY_TOOLS) {
      expect(result).toContain(tool);
    }
  });

  it("grant + revoke mutate snapshot", () => {
    const gate = new CapabilityGate();
    gate.grantCapability("session-1", "agent-1", "read");
    const snapshot1 = gate.getCapabilitySnapshot();
    expect(snapshot1.grants.has("session-1")).toBe(true);
    expect(snapshot1.grants.get("session-1")!.has("agent-1")).toBe(true);
    expect(snapshot1.grants.get("session-1")!.get("agent-1")!.includes("read")).toBe(true);

    gate.revokeCapability("session-1", "agent-1", "read");
    const snapshot2 = gate.getCapabilitySnapshot();
    const agent1Tools = snapshot2.grants.get("session-1")?.get("agent-1");
    expect(agent1Tools === undefined || !agent1Tools.includes("read")).toBe(true);
  });
});
