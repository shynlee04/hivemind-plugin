// @ts-nocheck — plugin types expect Zod v3 shapes; we have Zod v4 installed
import { z } from "zod";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { safeTool } from "./safe-tool.ts";

export const sessionPatch = safeTool({
  description: "Patch specific sections in session file with backup",
  args: {
    sessionFilePath: z.string().describe("Absolute path to session-context-prompt.md"),
    section: z.string().describe("Section heading to patch (e.g., '## Identified Risks')"),
    newContent: z.string().describe("New content for the section (without the heading)"),
  },
  execute: async ({ sessionFilePath, section, newContent }) => {
    if (!existsSync(sessionFilePath)) {
      return { status: "error", error: "Session file not found" };
    }

    // Create backup
    const backupDir = join(dirname(sessionFilePath), ".patches");
    mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = join(backupDir, `backup-${timestamp}.md`);
    const original = readFileSync(sessionFilePath, "utf-8");
    writeFileSync(backupPath, original);

    // Patch section
    const headingRegex = new RegExp(`(${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})[\\s\\S]*?(?=\\n## |$)`);
    const match = original.match(headingRegex);

    if (!match) {
      return { status: "error", error: `Section '${section}' not found` };
    }

    const updated = original.replace(headingRegex, `${section}\n${newContent}\n`);
    writeFileSync(sessionFilePath, updated);

    // Update patch_count in frontmatter
    const patchCountMatch = updated.match(/^patch_count:\s*(\d+)/m);
    const currentCount = patchCountMatch ? parseInt(patchCountMatch[1], 10) : 0;
    const withUpdatedCount = updated.replace(
      /^patch_count:\s*\d+/m,
      `patch_count: ${currentCount + 1}`
    );
    writeFileSync(sessionFilePath, withUpdatedCount);

    return {
      status: "ok",
      backup_path: backupPath,
      old_length: original.length,
      new_length: withUpdatedCount.length,
      patch_count: currentCount + 1,
    };
  },
});
