import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const agentsDir = "./assets/agents";
const instructionsDir = "./assets/agent-instructions";

async function main() {
  const files = await fs.readdir(agentsDir);
  const hmFiles = files.filter(f => f.startsWith("hm-") && f.endsWith(".md") && f !== "hm-l0-orchestrator.md");

  console.log(`[Instructions Generator] Found ${hmFiles.length} non-orchestrator hm-* agents.`);

  await fs.mkdir(instructionsDir, { recursive: true });

  for (const file of hmFiles) {
    const agentName = file.replace(/\.md$/, "");
    const agentPath = path.join(agentsDir, file);
    const content = await fs.readFile(agentPath, "utf-8");
    const parsed = matter(content);

    const description = parsed.data.description || "";
    
    // Determine write permission bounds
    const permissions = parsed.data.permission || {};
    const writeAllowed = permissions.write === "allow" || permissions.edit === "allow" || permissions.write === true || permissions.edit === true;
    
    const permissionBounds = writeAllowed
      ? "Write-State Specialist: You are authorized to modify files under your domain. You MUST run build, typecheck, and tests to verify compiler states before completing code changes."
      : "Read-Only Specialist: You are strictly banned from writing or editing source code files. Your role is purely analysis, review, or verification.";

    // Generate instruction content (strategic, concise, non-redundant)
    const instructionContent = `# ${agentName} Instruction Profile

## 1. Role & Capability Scope
* **Specialization**: ${description}
* **Permission Bounds**: ${permissionBounds}
* **Lineage Boundary**: You belong to the **HM lineage** (Harness Modules product developer). You are strictly prohibited from implementing or modifying GSD internal developer tooling files, which are tracked in \`.opencode/gsd-file-manifest.json\`.
* **Analysis Paralysis Guard**: If you execute more than 5 consecutive read/grep/glob/command actions without generating output or advancing the workflow state: STOP, write a status report, and return control.

## 2. Delegation, Stacking & GSD Boundaries
* **Delegation Limits**: Only delegate tasks that fall outside your specialized capability. When delegating, route to the appropriate L2/L3 specialist.
* **Session Stacking**: Before invoking any subtask, call \`delegation-status({ action: "find-stackable" })\`. If a matching session exists, stack onto it using the \`task_id\` or \`stackOnSessionId\` parameters to preserve parent context.
* **GSD Tooling Boundary**: For any repository maintenance, local testing infrastructure, or GSD tasks, you MUST delegate to \`gsd-*\` agents instead of implementing them inline.

## 3. Commit & Verification Governance
* **Atomic Commits**: Enforce strict atomic commits (one logical change per commit). Commit source code changes, tests, and documentation separately.
* **Verification Gate**: Do not bypass verification gates. All outputs must be validated by the verification specialist before returning success.
`;

    // Write instruction file
    const instructionFilePath = path.join(instructionsDir, `${agentName}.md`);
    await fs.writeFile(instructionFilePath, instructionContent, "utf-8");
    console.log(`[Instructions Generator] Generated instructions for ${agentName}`);

    // Update agent frontmatter (if needed, gray-matter preserves it)
    parsed.data.instruction = [
      ".opencode/rules/universal-rules.md",
      "AGENTS.md",
      `.opencode/agent-instructions/${agentName}.md`
    ];

    const updatedContent = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(agentPath, updatedContent, "utf-8");
    console.log(`[Instructions Generator] Updated frontmatter for ${file}`);
  }

  console.log("[Instructions Generator] Completed generation and frontmatter updates for all agents.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
