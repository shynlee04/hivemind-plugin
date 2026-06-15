import { describe, it, expect } from "vitest";
import { TOOL_CATEGORY_MAP, ToolCategory, CapabilityGate, READ_ONLY_TOOLS } from "../../../src/features/capability-gate/index.ts";
import {
  BUILD_PASSTHROUGH_PROFILE,
  UNKNOWN_AGENT_CAPABILITY_PROFILE,
  resolveSeedProfileForAgent,
} from "../../../src/features/capability-gate/agent-capability-profiles.ts";

describe("TOOL_CATEGORY_MAP", () => {
  it("has exactly 34 entries (name → category only)", () => {
    expect(TOOL_CATEGORY_MAP.size).toBe(34);
    const validCategories = new Set(Object.values(ToolCategory));
    for (const [, category] of TOOL_CATEGORY_MAP) {
      expect(validCategories.has(category as ToolCategory)).toBe(true);
    }
  });

  it("contains all OpenCode built-ins", () => {
    for (const tool of ["read", "edit", "write", "bash", "glob", "grep", "execute-slash-command", "task"]) {
      expect(TOOL_CATEGORY_MAP.has(tool)).toBe(true);
    }
  });

  it("classifies native task as delegate", () => {
    expect(TOOL_CATEGORY_MAP.get("task")).toBe(ToolCategory.Delegate);
  });

  it("contains all hivemind tools", () => {
    for (const tool of [
      "delegate-task", "delegation-status", "run-background-command",
      "hivemind-pressure", "hivemind-trajectory", "hivemind-session-view",
      "hivemind-command-engine", "create-governance-session",
      "configure-primitive", "bootstrap-init", "bootstrap-recover", "validate-restart",
      "hivemind-doc", "prompt-analyze", "session-tracker", "session-hierarchy",
      "session-context", "session-journal-export", "session-delegation-query",
      "hivemind-agent-work-create", "hivemind-agent-work-export", "hivemind-sdk-supervisor",
      "session-patch", "prompt-skim", "tmux-copilot", "tmux-state-query",
    ]) {
      expect(TOOL_CATEGORY_MAP.has(tool)).toBe(true);
    }
  });
});

describe("resolveSeedProfileForAgent (post-consolidation)", () => {
  it("returns BUILD_PASSTHROUGH_PROFILE for the 'build' agent", () => {
    expect(resolveSeedProfileForAgent("build")).toBe(BUILD_PASSTHROUGH_PROFILE);
  });

  it("returns UNKNOWN_AGENT_CAPABILITY_PROFILE for any other agent", () => {
    expect(resolveSeedProfileForAgent("hm-l0-orchestrator")).toBe(UNKNOWN_AGENT_CAPABILITY_PROFILE);
    expect(resolveSeedProfileForAgent("hf-meta-builder")).toBe(UNKNOWN_AGENT_CAPABILITY_PROFILE);
    expect(resolveSeedProfileForAgent("custom-agent")).toBe(UNKNOWN_AGENT_CAPABILITY_PROFILE);
  });
});

describe("CapabilityGate (post-consolidation)", () => {
  it("resolveToolsForAgent returns read-only defaults for any agent", () => {
    const gate = new CapabilityGate();
    expect(gate.resolveToolsForAgent("hm-l0-orchestrator")).toEqual([...READ_ONLY_TOOLS]);
    expect(gate.resolveToolsForAgent("nonexistent-agent-xyz")).toEqual([...READ_ONLY_TOOLS]);
    expect(gate.resolveToolsForAgent("build")).toEqual([...READ_ONLY_TOOLS]);
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

  it("getCapabilitySnapshot returns empty tools map", () => {
    const gate = new CapabilityGate();
    const snapshot = gate.getCapabilitySnapshot();
    expect(snapshot.tools.size).toBe(0);
  });
});
