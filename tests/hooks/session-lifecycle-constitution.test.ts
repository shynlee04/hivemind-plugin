import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { initProject } from "../../src/cli/init.js";
import { createSessionLifecycleHook } from "../../src/hooks/session-lifecycle.js";
import { noopLogger } from "../../src/lib/logging.js";
import { getEffectivePaths } from "../../src/lib/paths.js";
import { loadConfig } from "../../src/lib/persistence.js";
import { GOVERNANCE_MARKER } from "../../src/lib/governance-instruction.js";
import { createConfig } from "../../src/schemas/config.js";

const CHECKLIST_REMINDER_TOKEN = "CHECKLIST BEFORE STOPPING";

function createTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function countMarkerOccurrences(lines: string[]): number {
  return lines.join("\n").split(GOVERNANCE_MARKER).length - 1;
}

function ensureChecklistPassArtifacts(directory: string): void {
  const paths = getEffectivePaths(directory);

  const requiredFiles: Array<{ path: string; contents: string }> = [
    {
      path: paths.anchors,
      contents: JSON.stringify({ version: "1", anchors: [] }, null, 2),
    },
    {
      path: paths.mems,
      contents: JSON.stringify({ version: "1", mems: [] }, null, 2),
    },
    {
      path: paths.hierarchy,
      contents: JSON.stringify({ version: "1", root_id: null, nodes: [] }, null, 2),
    },
    {
      path: paths.plansManifest,
      contents: JSON.stringify({ version: "1", plans: [] }, null, 2),
    },
  ];

  for (const requiredFile of requiredFiles) {
    if (!existsSync(requiredFile.path)) {
      mkdirSync(dirname(requiredFile.path), { recursive: true });
      writeFileSync(requiredFile.path, `${requiredFile.contents}\n`, "utf-8");
    }
  }
}

describe("session-lifecycle constitution injection", () => {
  it("compiled governance injected on first call", async () => {
    const directory = createTempDir("hm-k1-t05-first-");

    try {
      await initProject(directory, { governanceMode: "assisted", language: "en", silent: true });
      const config = await loadConfig(directory);
      const hook = createSessionLifecycleHook(noopLogger, directory, config);

      const output = { system: [] as string[] };
      await hook({ sessionID: "session-first-call" }, output);

      assert.ok(
        output.system.some((entry) => entry.includes(GOVERNANCE_MARKER)),
        "expected governance marker to be injected",
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("governance not duplicated on second call", async () => {
    const directory = createTempDir("hm-k1-t05-dedup-");

    try {
      await initProject(directory, { governanceMode: "assisted", language: "en", silent: true });
      const config = await loadConfig(directory);
      const hook = createSessionLifecycleHook(noopLogger, directory, config);

      const output = { system: [] as string[] };
      await hook({ sessionID: "session-dedup" }, output);
      await hook({ sessionID: "session-dedup" }, output);

      assert.equal(countMarkerOccurrences(output.system), 1);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("checklist failure appends system reminder", async () => {
    const directory = createTempDir("hm-k1-t05-fail-");

    try {
      const hook = createSessionLifecycleHook(noopLogger, directory, createConfig());
      const output = { system: [] as string[] };

      await hook({ sessionID: "session-checklist-fail" }, output);

      const text = output.system.join("\n");
      assert.ok(text.includes(CHECKLIST_REMINDER_TOKEN));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("checklist pass does not append reminder", async () => {
    const directory = createTempDir("hm-k1-t05-pass-");

    try {
      await initProject(directory, { governanceMode: "assisted", language: "en", silent: true });
      ensureChecklistPassArtifacts(directory);

      const config = await loadConfig(directory);
      const hook = createSessionLifecycleHook(noopLogger, directory, config);
      const output = { system: [] as string[] };

      await hook({ sessionID: "session-checklist-pass" }, output);

      const text = output.system.join("\n");
      assert.ok(!text.includes(CHECKLIST_REMINDER_TOKEN));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("compiled governance uses typed rules", async () => {
    const directory = createTempDir("hm-k1-t05-rules-");

    try {
      await initProject(directory, { governanceMode: "assisted", language: "en", silent: true });
      const config = await loadConfig(directory);
      const hook = createSessionLifecycleHook(noopLogger, directory, config);

      const output = { system: [] as string[] };
      await hook({ sessionID: "session-typed-rules" }, output);

      const text = output.system.join("\n");
      assert.ok(text.includes("ROLE & BOUNDARY DISCIPLINE"));
      assert.ok(text.includes("CONTEXT-FIRST PROTOCOL"));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
