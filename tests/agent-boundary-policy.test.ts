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

    // Check YAML header
    assert.match(content, /tools:\s*write:\s*false/);
    assert.match(content, /edit:\s*false/);
    assert.match(content, /bash:\s*false/);

    // Check Markdown table forbids src/ and tests/
    assert.match(content, /Forbidden.*src\/.*tests\//);
  });

  it("hivefiver is constrained to framework assets", () => {
    const content = readAgent("agents/hivefiver.md");

    // Check YAML header tools
    assert.match(content, /write:\s*false/);
    assert.match(content, /edit:\s*false/);
    assert.match(content, /read:\s*false/);

    // Check Markdown scoping
    assert.match(content, /Forbidden.*src\/\*\*/);
    assert.match(content, /Forbidden.*tests\/\*\*/);
    assert.match(content, /In Scope.*\.opencode\/agents\/\*\*/);
  });

  it("implementation agents are scoped appropriately", () => {
    const maker = readAgent("agents/hivemaker.md");

    // Check YAML header tools
    assert.match(maker, /write:\s*true/);
    assert.match(maker, /edit:\s*true/);

    // Check permissions
    assert.match(maker, /edit:\s*allow/);
    assert.match(maker, /bash:\s*"\*":\s*allow/);

    // Check Markdown scoping
    assert.match(maker, /Scope.*src\/.*tests\/.*docs\//);
    assert.match(maker, /Forbidden.*framework assets/i);
  });

  it("runtime mirror matches canonical agent files", () => {
    const canonicalFiles = [
      "hitea.md",
      "hivefiver.md",
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
