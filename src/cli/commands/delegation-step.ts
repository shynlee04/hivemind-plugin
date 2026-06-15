import type * as ClackPrompts from "@clack/prompts"

import type { DelegationSystems, HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

/**
 * Configure governance and safety settings.
 * Sets `parallelization`, `atomic_commit`, `commit_docs`, and `delegation_systems`.
 */
export async function stepGovernanceAndSafety(
  prompts: PromptModule,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  prompts.log.step("Governance & Safety")

  const parallelization = await prompts.confirm({
    message: "Allow parallel task execution? Multiple independent tasks run simultaneously.",
    initialValue: config.parallelization ?? true,
  })

  if (!prompts.isCancel(parallelization)) {
    config.parallelization = parallelization as boolean
  }

  const atomicCommit = await prompts.confirm({
    message: "Require atomic commits? Each task gets its own commit for easy rollback.",
    initialValue: config.atomic_commit ?? true,
  })

  if (!prompts.isCancel(atomicCommit)) {
    config.atomic_commit = atomicCommit as boolean
  }

  const commitDocs = await prompts.confirm({
    message: "Include docs in commits? Planning artifacts are committed with code changes.",
    initialValue: config.commit_docs ?? true,
  })

  if (!prompts.isCancel(commitDocs)) {
    config.commit_docs = commitDocs as boolean
  }

  // Delegation systems
  const currentDelegation = config.delegation_systems ?? {
    native_task: true,
    delegate_task: true,
    background_delegation: true,
  }

  const delegationSystems = await prompts.multiselect({
    message: "Delegation systems — which subagent dispatch methods to enable",
    required: false,
    initialValues: [
      ...(currentDelegation.native_task ? ["native_task"] : []),
      ...(currentDelegation.delegate_task ? ["delegate_task"] : []),
      ...(currentDelegation.background_delegation ? ["background_delegation"] : []),
    ],
    options: [
      { value: "native_task", label: "native_task", hint: "basic OpenCode task tool (always available)" },
      { value: "delegate_task", label: "delegate_task", hint: "advanced delegation with context stacking" },
      { value: "background_delegation", label: "background_delegation", hint: "fire-and-forget background tasks" },
    ],
  })

  if (!prompts.isCancel(delegationSystems)) {
    const selected = new Set(delegationSystems as string[])
    config.delegation_systems = {
      native_task: selected.has("native_task"),
      delegate_task: selected.has("delegate_task"),
      background_delegation: selected.has("background_delegation"),
    } satisfies DelegationSystems
  }
}
