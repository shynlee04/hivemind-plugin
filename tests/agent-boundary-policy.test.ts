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
    assert.match(content, /bash:\s*true/);
    assert.match(content, /may_execute:\s*true/);
    assert.match(content, /may_delegate:\s*true/);

    assert.match(content, /agents\/\*\*/);
    assert.match(content, /commands\/\*\*/);
    assert.match(content, /workflows\/\*\*/);
    assert.match(content, /skills\/\*\*/);
    assert.doesNotMatch(content, /\n\s*-\s+\.opencode\//);
  });

  it("implementation and planning agents stay terminal and scoped appropriately", () => {
    const maker = readAgent("agents/hivemaker.md");
    const healer = readAgent("agents/hivehealer.md");
    const planner = readAgent("agents/hiveplanner.md");

    // Check YAML header tools
    assert.match(maker, /write:\s*true/);
    assert.match(maker, /edit:\s*true/);
    assert.match(maker, /task:\s*false/);
    assert.match(maker, /may_delegate:\s*false/);
    assert.match(maker, /terminal:\s*true/);

    // Check permissions
    assert.match(maker, /edit:\s*allow/);
    assert.match(maker, /bash:\s*"\*":\s*allow/);

    assert.match(maker, /scope_paths:[\s\S]*src\/\*\*[\s\S]*tests\/\*\*[\s\S]*docs\/\*\*/);
    assert.match(maker, /author or edit framework assets like/i);
    assert.match(healer, /task:\s*false/);
    assert.match(healer, /may_delegate:\s*false/);
    assert.match(healer, /terminal:\s*true/);
    assert.match(healer, /NEVER[\s\S]*edit framework assets/i);

    assert.match(planner, /task:\s*false/);
    assert.match(planner, /may_delegate:\s*false/);
    assert.match(planner, /terminal:\s*true/);
    assert.match(planner, /NEVER[\s\S]*implement product or framework code/i);
  });
});
