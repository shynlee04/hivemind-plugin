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

    // Check YAML header — hiveminder is orchestrator: no write/edit/read
    assert.match(content, /tools:\s*write:\s*false/);
    assert.match(content, /edit:\s*false/);
    assert.match(content, /read:\s*false/);

    assert.match(content, /may_execute:\s*false/);
    assert.match(content, /may_delegate:\s*true/);
    assert.match(content, /NEVER implement code/i);
    assert.match(content, /edit files directly/i);
  });

  it("hivefiver is constrained to framework assets", () => {
    const content = readAgent("agents/hivefiver.md");

    assert.match(content, /write:\s*true/);
    assert.match(content, /edit:\s*true/);
    assert.match(content, /read:\s*true/);
    assert.match(content, /may_execute:\s*true/);

    assert.match(content, /src\/\*\*/);
    assert.match(content, /tests\/\*\*/);
    assert.match(content, /\.opencode\/agents\/\*\*/);
    assert.match(content, /edit `src\/\*\*` or `tests\/\*\*`/);
  });

  it("implementation agents are scoped appropriately", () => {
    const maker = readAgent("agents/hivemaker.md");

    // Check YAML header tools
    assert.match(maker, /write:\s*true/);
    assert.match(maker, /edit:\s*true/);

    // Check permissions
    assert.match(maker, /edit:\s*allow/);
    assert.match(maker, /bash:\s*"\*":\s*allow/);

    assert.match(maker, /scope_paths:[\s\S]*src\/\*\*[\s\S]*tests\/\*\*[\s\S]*docs\/\*\*/);
    assert.match(maker, /author or edit framework assets like/i);
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
