import { getContextAction } from "./session_coherence.js"

export interface ClarificationQuestion {
  id: string
  prompt: string
  options: string[]
  rationale: string
}

export interface ClarificationPacket {
  confidence: number
  action: "proceed" | "gather" | "clarify"
  questions: ClarificationQuestion[]
  constraints: string[]
  max_questions_reached: boolean
}

export function shouldTriggerClarification(confidence: number, threshold = 80): boolean {
  return confidence < threshold
}

export function deriveConstraintSet(message: string): string[] {
  const constraints: string[] = []
  const lower = message.toLowerCase()
  if (lower.includes("urgent") || lower.includes("asap")) constraints.push("time-sensitive")
  if (lower.includes("no refactor") || lower.includes("minimal change")) constraints.push("minimal-diff")
  if (lower.includes("test") || lower.includes("verify")) constraints.push("verification-required")
  if (lower.includes("no downtime")) constraints.push("zero-downtime")
  return constraints
}

export function buildClarificationPacket(input: {
  confidence: number
  userMessage: string
  recommendations?: string[]
  askedCount?: number
  maxQuestions?: number
}): ClarificationPacket {
  const askedCount = input.askedCount ?? 0
  const maxQuestions = input.maxQuestions ?? 5
  const action = getContextAction(input.confidence)
  const constraints = deriveConstraintSet(input.userMessage)

  const questions: ClarificationQuestion[] = []
  const recommendations = input.recommendations ?? []

  if (action === "clarify") {
    questions.push({
      id: "target_scope",
      prompt: "What exact target should be changed first?",
      options: ["single file/function", "single feature slice", "cross-cutting refactor"],
      rationale: "Locks implementation scope before edits.",
    })
  }

  if (recommendations.some((item) => item.toLowerCase().includes("trajectory"))) {
    questions.push({
      id: "trajectory_alignment",
      prompt: "Should we continue current trajectory or start a new one?",
      options: ["continue current trajectory", "start a new trajectory"],
      rationale: "Prevents hierarchy drift.",
    })
  }

  if (constraints.length === 0) {
    questions.push({
      id: "constraints",
      prompt: "Which constraint matters most for this task?",
      options: ["speed", "safety", "minimal change"],
      rationale: "Resolves tradeoffs before implementation.",
    })
  }

  return {
    confidence: input.confidence,
    action,
    questions: questions.slice(0, maxQuestions),
    constraints,
    max_questions_reached: askedCount >= maxQuestions,
  }
}

export function renderClarificationPacket(packet: ClarificationPacket): string {
  const lines: string[] = []
  lines.push("<hivemind-clarify>")
  lines.push(`confidence=${packet.confidence}`)
  lines.push(`action=${packet.action}`)
  if (packet.constraints.length > 0) {
    lines.push(`constraints=${packet.constraints.join(",")}`)
  }
  for (const question of packet.questions) {
    lines.push(`q:${question.id} :: ${question.prompt}`)
    lines.push(`options: ${question.options.join(" | ")}`)
    lines.push(`why: ${question.rationale}`)
  }
  lines.push("</hivemind-clarify>")
  return lines.join("\n")
}
