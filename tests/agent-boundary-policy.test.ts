import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

function readAgent(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("agent boundary policy", () => {
  it("hiveminder forbids direct implementation paths", () => {
    const content = readAgent("agents/hiveminder.md");

    assert.match(content, /name:\s*hiveminder/);
    assert.match(content, /role:\s*supreme_orchestrator/);
    assert.match(content, /recursive_delegation:\s*false/);
    assert.match(content, /-\s*"src\/\*\*"/);
    assert.match(content, /-\s*"tests\/\*\*"/);
  });

  it("hivefiver is constrained to framework assets", () => {
    const content = readAgent("agents/hivefiver.md");

    assert.match(content, /name:\s*hivefiver/);
    assert.match(content, /role:\s*meta_builder/);
    assert.match(content, /recursive_delegation:\s*false/);
    assert.match(content, /-\s*"src\/\*\*"/);
    assert.match(content, /-\s*"tests\/\*\*"/);
    assert.match(content, /-\s*"agents\/\*\*"/);
    assert.match(content, /-\s*"commands\/\*\*"/);
    assert.match(content, /-\s*"workflows\/\*\*"/);
    assert.match(content, /-\s*"skills\/\*\*"/);
    assert.match(content, /-\s*"docs\/framework\/\*\*"/);
  });

  it("hivefiver keeps blind mode while preserving context-navigation tools", () => {
    const content = readAgent("agents/hivefiver.md");

    assert.match(content, /read:\s*deny/);
    assert.match(content, /glob:\s*deny/);
    assert.match(content, /grep:\s*deny/);
    assert.match(content, /hivemind_inspect:\s*allow/);
    assert.match(content, /hivemind_cycle:\s*allow/);
    assert.match(content, /scan_hierarchy:\s*allow/);
    assert.match(content, /think_back:\s*allow/);
    assert.match(content, /recall_mems:\s*allow/);
    assert.match(content, /"hivexplorer":\s*allow/);
  });

  it("hivefiver reserved profile preserves blind mode and context navigation", () => {
    const reserved = readAgent("agents/hivefiver-reserved.md");

    assert.match(reserved, /read:\s*deny/);
    assert.match(reserved, /glob:\s*deny/);
    assert.match(reserved, /grep:\s*deny/);
    assert.match(reserved, /hivemind_inspect:\s*allow/);
    assert.match(reserved, /hivemind_cycle:\s*allow/);
    assert.match(reserved, /scan_hierarchy:\s*allow/);
    assert.match(reserved, /think_back:\s*allow/);
    assert.match(reserved, /recall_mems:\s*allow/);
    assert.match(reserved, /"hivexplorer":\s*allow/);
  });

  it("implementation agents are scoped to docs/implementation", () => {
    const maker = readAgent("agents/hivemaker.md");
    const healer = readAgent("agents/hivehealer.md");

    assert.match(maker, /docs\/implementation\/\*\*: allow/);
    assert.match(healer, /docs\/implementation\/\*\*: allow/);
    assert.match(maker, /-\s*docs\/implementation\/\*\*/);
    assert.match(healer, /-\s*docs\/implementation\/\*\*/);
  });

  it("runtime mirror matches canonical agent files", () => {
    const canonicalFiles = [
      "hitea.md",
      "hivefiver.md",
      "hivefiver-reserved.md",
      "hivehealer.md",
      "hivemaker.md",
      "hiveminder.md",
      "hiveplanner.md",
      "hiveq.md",
      "hiverd.md",
      "hivexplorer.md",
    ];

    for (const file of canonicalFiles) {
      const canonical = readAgent(`agents/${file}`);
      const mirror = readAgent(`.opencode/agents/${file}`);
      assert.equal(mirror, canonical, `${file} mirror drift detected`);
    }
  });
});
