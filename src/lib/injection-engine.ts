import type { RecoveryResumeState } from "./session-recovery.js"
import type { DelegationCategory, DelegationMeta, DelegationRouteResolution, SpecialistAgent } from "./types.js"

export type InjectionPhase = "session-start" | "compaction"

export type InjectionPayload = {
  rules: string[]
  commands: string[]
  skills: string[]
  tools: string[]
}

export type InjectionAuditDecision = "applied" | "skipped"

export type InjectionAuditEntry = {
  injectionID: string
  phase: InjectionPhase
  decision: InjectionAuditDecision
  reason: string
  evidence: string[]
}

export type InjectionGovernanceState = {
  blockedInjections?: string[]
  reasonByInjectionID?: Partial<Record<string, string>>
}

export type InjectionEvaluationContext = {
  sessionID?: string
  phase: InjectionPhase
  agent?: SpecialistAgent
  category?: DelegationCategory
  delegation?: DelegationMeta
  route?: DelegationRouteResolution
  recovery?: RecoveryResumeState
  governance?: InjectionGovernanceState
}

export type InjectionEvaluationResult = {
  injections: InjectionPayload
  auditLog: InjectionAuditEntry[]
}

type CandidateEvaluation = {
  matched: boolean
  reason: string
  evidence: string[]
}

type InjectionCandidate = {
  id: string
  evaluate: (context: InjectionEvaluationContext) => CandidateEvaluation
  payload: InjectionPayload
}

const EMPTY_PAYLOAD: InjectionPayload = {
  rules: [],
  commands: [],
  skills: [],
  tools: [],
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

export function recordInjectionDecision(input: InjectionAuditEntry): InjectionAuditEntry {
  return {
    ...input,
    evidence: [...input.evidence],
  }
}

function appendPayload(target: InjectionPayload, payload: InjectionPayload): void {
  target.rules.push(...payload.rules)
  target.commands.push(...payload.commands)
  target.skills.push(...payload.skills)
  target.tools.push(...payload.tools)
}

const INJECTION_CANDIDATES: readonly InjectionCandidate[] = [
  {
    id: "specialist-route-guidance",
    evaluate: (context) => {
      if (!context.route) {
        return {
          matched: false,
          reason: "No specialist route was available for this session.",
          evidence: [],
        }
      }

      if (context.route.fallbackUsed) {
        return {
          matched: false,
          reason: "Routing fell back to the generalist lane, so no specialist guidance should inject.",
          evidence: [`preset=${context.route.presetKey}`],
        }
      }

      return {
        matched: true,
        reason: `Route matched the ${context.route.effectiveAgent} specialist lane.`,
        evidence: [
          `agent=${context.route.effectiveAgent}`,
          `preset=${context.route.presetKey}`,
          `source=${context.route.agentSource}`,
        ],
      }
    },
    payload: {
      rules: ["Honor the routed builder specialist guidance for this session."],
      commands: [],
      skills: ["builder-specialist-lane"],
      tools: [],
    },
  },
  {
    id: "delegation-lineage-guardrail",
    evaluate: (context) => {
      if (!context.delegation || context.delegation.depth <= 0) {
        return {
          matched: false,
          reason: "Session is not executing inside a delegated lineage.",
          evidence: context.delegation ? [`depth=${context.delegation.depth}`] : [],
        }
      }

      return {
        matched: true,
        reason: "Delegated lineage is active and requires scope-preserving runtime guidance.",
        evidence: [
          `root=${context.delegation.rootID}`,
          `depth=${context.delegation.depth}`,
          `category=${context.delegation.category ?? "none"}`,
        ],
      }
    },
    payload: {
      rules: [
        "Preserve delegated scope and report back through the parent lineage before expanding work.",
      ],
      commands: ["record-handoff-context"],
      skills: ["delegation-hygiene"],
      tools: ["task"],
    },
  },
  {
    id: "recovery-review-guardrail",
    evaluate: (context) => {
      if (!context.recovery) {
        return {
          matched: false,
          reason: "No recovery snapshot exists for this session.",
          evidence: [],
        }
      }

      if (context.recovery.assessment.recommendedAction !== "review") {
        return {
          matched: false,
          reason: "Recovery state does not require a review-first resume path.",
          evidence: [`action=${context.recovery.assessment.recommendedAction}`],
        }
      }

      return {
        matched: true,
        reason: "Recovery assessment requires a review before autonomous continuation.",
        evidence: [
          `risk=${context.recovery.assessment.level}`,
          `stale=${context.recovery.assessment.stale}`,
          `pendingDelegation=${context.recovery.pendingDelegation ?? "none"}`,
        ],
      }
    },
    payload: {
      rules: ["Review recovered session state before resuming autonomous work."],
      commands: ["review-recovery-state"],
      skills: ["session-recovery-review"],
      tools: ["read"],
    },
  },
] as const

export function evaluateInjections(context: InjectionEvaluationContext): InjectionEvaluationResult {
  const applied: InjectionPayload = {
    rules: [],
    commands: [],
    skills: [],
    tools: [],
  }
  const blocked = new Set(context.governance?.blockedInjections ?? [])
  const auditLog = INJECTION_CANDIDATES.map((candidate) => {
    const evaluation = candidate.evaluate(context)

    if (!evaluation.matched) {
      return recordInjectionDecision({
        injectionID: candidate.id,
        phase: context.phase,
        decision: "skipped",
        reason: evaluation.reason,
        evidence: evaluation.evidence,
      })
    }

    if (blocked.has(candidate.id)) {
      return recordInjectionDecision({
        injectionID: candidate.id,
        phase: context.phase,
        decision: "skipped",
        reason:
          context.governance?.reasonByInjectionID?.[candidate.id] ??
          "Governance blocked this runtime injection candidate.",
        evidence: [...evaluation.evidence, "governance=blocked"],
      })
    }

    appendPayload(applied, candidate.payload)
    return recordInjectionDecision({
      injectionID: candidate.id,
      phase: context.phase,
      decision: "applied",
      reason: evaluation.reason,
      evidence: evaluation.evidence,
    })
  })

  return {
    injections: {
      rules: dedupe(applied.rules),
      commands: dedupe(applied.commands),
      skills: dedupe(applied.skills),
      tools: dedupe(applied.tools),
    },
    auditLog,
  }
}

export function hasAnyInjection(payload: InjectionPayload): boolean {
  return (
    payload.rules.length > 0 ||
    payload.commands.length > 0 ||
    payload.skills.length > 0 ||
    payload.tools.length > 0
  )
}

export function emptyInjectionPayload(): InjectionPayload {
  return {
    ...EMPTY_PAYLOAD,
    rules: [],
    commands: [],
    skills: [],
    tools: [],
  }
}
