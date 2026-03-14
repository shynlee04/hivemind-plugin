import * as fs from 'node:fs'
import * as path from 'node:path'

import { getHivemindPath } from '../../shared/paths.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'
import type { KernelLineage, SessionScope } from '../../context/prompt-packet/prompt-packet-types.js'

export interface WorkflowAuthorityIssue {
  severity: 'blocking' | 'warning'
  code: string
  message: string
}

export interface WorkflowAuthorityInput {
  workflowId?: string
  taskIds?: string[]
  sessionScope?: SessionScope
  purposeClass?: string
  lineage?: KernelLineage
}

export interface WorkflowAuthorityStatus {
  exists: boolean
  healthy: boolean
  planningReady: boolean
  taskReady: boolean
  hivemindPath: string
  planningPath: string
  stateTasksPath: string
  graphTasksPath: string
  issues: WorkflowAuthorityIssue[]
  linkedWorkflowId?: string
  linkedTaskIds: string[]
  evidenceRefs: string[]
  pressureContract: ReturnType<typeof getRuntimePressureContract>
}

function parseTaskCollection(filePath: string): { tasks: Array<{ id: string; status?: string }> } | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as { tasks: Array<{ id: string; status?: string }> }
  } catch {
    return null
  }
}

export function inspectWorkflowAuthority(
  projectRoot: string,
  input: WorkflowAuthorityInput = {},
): WorkflowAuthorityStatus {
  const hivemindPath = getHivemindPath(projectRoot)
  const planningPath = path.join(hivemindPath, 'project', 'planning')
  const stateTasksPath = path.join(hivemindPath, 'state', 'tasks.json')
  const graphTasksPath = path.join(hivemindPath, 'graph', 'tasks.json')
  const exists = fs.existsSync(hivemindPath)
  const issues: WorkflowAuthorityIssue[] = []

  if (!exists) {
    issues.push({
      severity: 'blocking',
      code: 'missing-hivemind',
      message: 'The .hivemind authority root is missing.',
    })
  }

  const planningReady = fs.existsSync(planningPath)
  if (exists && !planningReady) {
    issues.push({
      severity: 'blocking',
      code: 'missing-planning-root',
      message: 'The planning root for workflow authority is missing.',
    })
  }

  const stateTasks = parseTaskCollection(stateTasksPath)
  const graphTasks = parseTaskCollection(graphTasksPath)
  const taskReady = !!stateTasks && !!graphTasks

  if (exists && !stateTasks) {
    issues.push({
      severity: 'blocking',
      code: 'missing-state-tasks',
      message: 'The canonical task ledger is missing or unreadable.',
    })
  }

  if (exists && !graphTasks) {
    issues.push({
      severity: 'blocking',
      code: 'missing-graph-tasks',
      message: 'The graph task projection is missing or unreadable.',
    })
  }

  const linkedTaskIds = input.taskIds ?? []
  if (input.sessionScope === 'sub-session' && linkedTaskIds.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'missing-task-link',
      message: 'Sub-session entry is not linked to any task or sub-task authority.',
    })
  }

  if (linkedTaskIds.length > 0 && stateTasks) {
    const validTaskIds = new Set(stateTasks.tasks.map((task) => task.id))
    const missingLinkedTask = linkedTaskIds.find((taskId) => !validTaskIds.has(taskId))
    if (missingLinkedTask) {
      issues.push({
        severity: 'warning',
        code: 'unknown-task-link',
        message: `Linked task ${missingLinkedTask} is not present in the canonical task ledger.`,
      })
    }
  }

  const evidenceRefs = [hivemindPath, planningPath, stateTasksPath, graphTasksPath]
  const pressureContract = getRuntimePressureContract(
    issues.some((issue) => issue.severity === 'blocking')
      ? 'control-plane-repair'
      : linkedTaskIds.length > 0
        ? 'task-mutation'
        : 'steady-state',
  )

  return {
    exists,
    healthy: !issues.some((issue) => issue.severity === 'blocking'),
    planningReady,
    taskReady,
    hivemindPath,
    planningPath,
    stateTasksPath,
    graphTasksPath,
    issues,
    linkedWorkflowId: input.workflowId,
    linkedTaskIds,
    evidenceRefs,
    pressureContract,
  }
}

export function bootstrapWorkflowAuthority(
  projectRoot: string,
  input: WorkflowAuthorityInput = {},
): WorkflowAuthorityStatus {
  const status = inspectWorkflowAuthority(projectRoot, input)
  const phaseDir = path.join(status.planningPath, 'phases', '00-control-plane')

  fs.mkdirSync(phaseDir, { recursive: true })
  fs.mkdirSync(path.dirname(status.stateTasksPath), { recursive: true })
  fs.mkdirSync(path.dirname(status.graphTasksPath), { recursive: true })

  if (!fs.existsSync(path.join(status.planningPath, 'index.json'))) {
    fs.writeFileSync(
      path.join(status.planningPath, 'index.json'),
      JSON.stringify({ version: '1.0.0', workflows: [] }, null, 2),
    )
  }

  if (!fs.existsSync(path.join(status.planningPath, 'project-state.json'))) {
    fs.writeFileSync(
      path.join(status.planningPath, 'project-state.json'),
      JSON.stringify({ version: '1.0.0', lineage: input.lineage ?? 'hiveminder' }, null, 2),
    )
  }

  if (!fs.existsSync(path.join(phaseDir, '00-01-PLAN.md'))) {
    fs.writeFileSync(
      path.join(phaseDir, '00-01-PLAN.md'),
      '# Control Plane\n\nWorkflow authority is anchored here.\n',
    )
  }

  if (!fs.existsSync(status.stateTasksPath)) {
    fs.writeFileSync(status.stateTasksPath, JSON.stringify({ version: '1.0.0', tasks: [] }, null, 2))
  }

  if (!fs.existsSync(status.graphTasksPath)) {
    fs.writeFileSync(status.graphTasksPath, JSON.stringify({ version: '1.0.0', tasks: [] }, null, 2))
  }

  return inspectWorkflowAuthority(projectRoot, input)
}

export interface RepairWorkflowAuthorityResult {
  status: WorkflowAuthorityStatus
  repaired: string[]
}

export function repairWorkflowAuthority(
  projectRoot: string,
  input: WorkflowAuthorityInput = {},
): RepairWorkflowAuthorityResult {
  const before = inspectWorkflowAuthority(projectRoot, input)
  const repaired: string[] = []

  if (!before.exists || !before.planningReady || !before.taskReady) {
    bootstrapWorkflowAuthority(projectRoot, input)
    repaired.push('bootstrap-workflow-authority')
  }

  return {
    status: inspectWorkflowAuthority(projectRoot, input),
    repaired,
  }
}
