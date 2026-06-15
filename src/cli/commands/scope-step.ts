import type * as ClackPrompts from "@clack/prompts"

import type { HivemindConfigs, DiscussMode } from "../../schema-kernel/hivemind-configs.schema.js"
import { HivemindConfigsSchema } from "../../schema-kernel/hivemind-configs.schema.js"

type PromptModule = typeof ClackPrompts

/**
 * Configure workflow feature toggles.
 * Sets workflow research, plan_check, verifier, discuss_mode, use_worktrees, intent_lock, etc.
 */
export async function stepWorkflowToggles(
  prompts: PromptModule,
  config: Partial<HivemindConfigs>,
): Promise<void> {
  prompts.log.step("Workflow Toggles")

  // Initialize workflow with defaults if not present
  if (!config.workflow) {
    config.workflow = HivemindConfigsSchema.shape.workflow.parse({})
  }

  const research = await prompts.confirm({
    message: "Enable research-before-planning? Agent investigates codebase before creating plans.",
    initialValue: config.workflow.research,
  })

  if (!prompts.isCancel(research)) {
    config.workflow.research = research
  }

  const crossSessionDeps = await prompts.confirm({
    message: "Validate task dependencies across session boundaries? Ensures tasks from prior sessions are verified.",
    initialValue: config.workflow.cross_session_tasks_dependencies_validation,
  })

  if (!prompts.isCancel(crossSessionDeps)) {
    config.workflow.cross_session_tasks_dependencies_validation = crossSessionDeps
  }

  const trajectoryControl = await prompts.confirm({
    message: "Enable trajectory ledger tracking? Records phase transitions and decision points for audit trails.",
    initialValue: config.workflow.trajectory_control,
  })

  if (!prompts.isCancel(trajectoryControl)) {
    config.workflow.trajectory_control = trajectoryControl
  }

  const advancedContinuity = await prompts.confirm({
    message: "Enable deep continuity checks? Validates restored session state matches last known good state.",
    initialValue: config.workflow.advanced_continuity_validation,
  })

  if (!prompts.isCancel(advancedContinuity)) {
    config.workflow.advanced_continuity_validation = advancedContinuity
  }

  const taskPlus = await prompts.confirm({
    message: "Enable extended task status tracking? Sub-task breakdown and progress percentages.",
    initialValue: config.workflow.task_plus_enabled,
  })

  if (!prompts.isCancel(taskPlus)) {
    config.workflow.task_plus_enabled = taskPlus
  }

  const planCheck = await prompts.confirm({
    message: "Enable plan validation? Plan-checker verifies goal coverage before execution.",
    initialValue: config.workflow.plan_check,
  })

  if (!prompts.isCancel(planCheck)) {
    config.workflow.plan_check = planCheck
  }

  const verifier = await prompts.confirm({
    message: "Enable verification agent? Validates implementation after phase execution.",
    initialValue: config.workflow.verifier,
  })

  if (!prompts.isCancel(verifier)) {
    config.workflow.verifier = verifier
  }

  const uiPhase = await prompts.confirm({
    message: "Enable UI design contract phase? Generates UI-SPEC.md for frontend work.",
    initialValue: config.workflow.ui_phase,
  })

  if (!prompts.isCancel(uiPhase)) {
    config.workflow.ui_phase = uiPhase
  }

  const uiSafetyGate = await prompts.confirm({
    message: "Enable UI safety gate? Validates accessibility and visual correctness before shipping.",
    initialValue: config.workflow.ui_safety_gate,
  })

  if (!prompts.isCancel(uiSafetyGate)) {
    config.workflow.ui_safety_gate = uiSafetyGate
  }

  const aiIntegrationPhase = await prompts.confirm({
    message: "Enable AI integration design contract phase? Generates AI-SPEC.md for LLM/ML components.",
    initialValue: config.workflow.ai_integration_phase,
  })

  if (!prompts.isCancel(aiIntegrationPhase)) {
    config.workflow.ai_integration_phase = aiIntegrationPhase
  }

  const researchBeforeQuestions = await prompts.confirm({
    message: "Require research before asking clarifying questions? Agent investigates first, then asks only what cannot be inferred.",
    initialValue: config.workflow.research_before_questions,
  })

  if (!prompts.isCancel(researchBeforeQuestions)) {
    config.workflow.research_before_questions = researchBeforeQuestions
  }

  const discussMode = await prompts.select({
    message: "Discussion intensity — how much context to gather before planning",
    initialValue: config.workflow.discuss_mode,
    options: [
      { value: "sufficient-phase-discussion", label: "sufficient", hint: "gather enough context, then move on (default)" },
      { value: "intensive-phase-discussion", label: "intensive", hint: "deep exploration before planning" },
      { value: "skip-phase-discussion", label: "skip", hint: "go straight to planning" },
    ],
  })

  if (!prompts.isCancel(discussMode)) {
    config.workflow.discuss_mode = discussMode as DiscussMode
  }

  const useWorktrees = await prompts.confirm({
    message: "Use git worktrees for isolated task execution? Enables parallel work without branch switching.",
    initialValue: config.workflow.use_worktrees,
  })

  if (!prompts.isCancel(useWorktrees)) {
    config.workflow.use_worktrees = useWorktrees
  }

  const intentLock = await prompts.confirm({
    message: "Enable intent-lock governance gate? Sessions must pass 4-step validation before file mutations.",
    initialValue: config.workflow.intent_lock.enabled,
  })

  if (!prompts.isCancel(intentLock)) {
    config.workflow.intent_lock = { enabled: intentLock }
  }
}
