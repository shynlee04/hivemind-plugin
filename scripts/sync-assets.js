import { existsSync, mkdirSync, readdirSync, rmSync, cpSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const assetsRoot = join(projectRoot, "assets");

const PRIMITIVE_MAP = {
  agents: join(projectRoot, ".opencode", "agents"),
  skills: join(projectRoot, ".opencode", "skills"),
  commands: join(projectRoot, ".opencode", "commands"),
  workflows: join(projectRoot, ".opencode", "workflows"),
  references: join(projectRoot, ".hivemind", "references"),
  templates: join(projectRoot, ".hivemind", "templates"),
};

console.log("[Harness Build] Reflecting primitives from assets/ to runtime locations...");

for (const [kind, targetDir] of Object.entries(PRIMITIVE_MAP)) {
  const sourceDir = join(assetsRoot, kind);

  if (!existsSync(sourceDir)) {
    console.log(`[Harness Build] Skipping ${kind}: no assets/${kind} directory`);
    continue;
  }

  // Clean target then recreate
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    if (entry === ".gitkeep") continue;
    if (entry.startsWith("gsd-") || entry === "gsd") continue;

    const srcPath = join(sourceDir, entry);
    const destPath = join(targetDir, entry);

    cpSync(srcPath, destPath, { recursive: true });
  }
  console.log(`[Harness Build] Reflected ${kind} from assets/${kind} to ${targetDir}`);
}
console.log("[Harness Build] Assets reflection completed successfully.");
