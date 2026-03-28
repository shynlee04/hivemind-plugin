/**
 * Types for the hivemind_hm_doctor tool.
 * Handles diagnostic scope and findings.
 */

export type HmDoctorScope = 'all' | 'skills' | 'agents' | 'config' | 'paths'

export interface HmDoctorToolArgs {
  /** Diagnostic scope */
  scope: HmDoctorScope
  /** Apply fixes (requires user authorization) */
  fix: boolean
}

export interface HmDoctorFinding {
  category: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
}

export interface HmDoctorProposedFix {
  finding: string
  action: string
  target: string
}

export interface HmDoctorResult {
  scope: HmDoctorScope
  findings: HmDoctorFinding[]
  proposedFixes: HmDoctorProposedFix[]
  authorizationRequired: boolean
}
