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
  });
});
