/**
 * Evidence Reporter - Operator-Facing Surface for Evidence Lane Status
 *
 * Provides structured reporting of evidence lane validation results
 * for operators, CLI output, and control-plane dashboards.
 *
 * This addresses SURF-02: operator-facing surfaces must remain coherent
 * across docs and implementation.
 *
 * @module plugin/evidence-reporter
 */

import { type EvidenceResult, EvidenceLane } from '../shared/evidence-lane.js'

export interface EvidenceStatusReport {
  timestamp: string
  totalResults: number
  byLane: Record<EvidenceLane, LaneReport>
  nonLiveEvidenceItems: NonLiveEvidenceReport[]
  overallStatus: 'fully_evidence' | 'partial_evidence' | 'non_live_only'
}

export interface LaneReport {
  total: number
  pass: number
  fail: number
  unavailable: number
  notApplicable: number
}

export interface NonLiveEvidenceReport {
  lane: EvidenceLane
  justification: string
  evidence: Record<string, unknown>
  upgradePath: string | null
}

/**
 * Format an EvidenceResult for operator display
 */
export function formatEvidenceResult(result: EvidenceResult): string {
  const parts: string[] = []

  // Lane badge
  const laneBadge = formatLaneBadge(result.lane)
  parts.push(`[${laneBadge}]`)

  // Status
  const statusStr = result.status === 'pass' ? 'PASS' : result.status === 'fail' ? 'FAIL' : 'NON-LIVE'
  parts.push(statusStr)

  // Label if present
  if (result.label) {
    parts.push(result.label)
  }

  // Message or justification
  if (result.message) {
    parts.push(`— ${result.message}`)
  } else if (result.justification) {
    parts.push(`— ${result.justification}`)
  }

  return parts.join(' ')
}

/**
 * Format lane name for display
 */
export function formatLaneName(lane: EvidenceLane): string {
  switch (lane) {
    case EvidenceLane.LOCAL_DIAGNOSTICS:
      return 'Local Diagnostics'
    case EvidenceLane.INTEGRATION_CHECKS:
      return 'Integration Checks'
    case EvidenceLane.LIVE_OFFICIAL_INTERFACE_PROOF:
      return 'Live Proof'
  }
}

/**
 * Format lane badge for display
 */
function formatLaneBadge(lane: EvidenceLane): string {
  switch (lane) {
    case EvidenceLane.LOCAL_DIAGNOSTICS:
      return 'LOCAL'
    case EvidenceLane.INTEGRATION_CHECKS:
      return 'INTEG'
    case EvidenceLane.LIVE_OFFICIAL_INTERFACE_PROOF:
      return 'LIVE'
  }
}

/**
 * Generate upgrade path from evidence
 */
function extractUpgradePath(result: EvidenceResult): string | null {
  const evidence = result.evidence as Record<string, unknown>
  if (evidence.upgradePath && typeof evidence.upgradePath === 'string') {
    return evidence.upgradePath
  }
  if (evidence.blockedReason) {
    return `Resolve: ${evidence.blockedReason}`
  }
  return null
}

/**
 * Report evidence status from validation results
 */
export function reportEvidenceStatus(results: EvidenceResult[]): EvidenceStatusReport {
  const byLane: Record<EvidenceLane, LaneReport> = {
    [EvidenceLane.LOCAL_DIAGNOSTICS]: { total: 0, pass: 0, fail: 0, unavailable: 0, notApplicable: 0 },
    [EvidenceLane.INTEGRATION_CHECKS]: { total: 0, pass: 0, fail: 0, unavailable: 0, notApplicable: 0 },
    [EvidenceLane.LIVE_OFFICIAL_INTERFACE_PROOF]: { total: 0, pass: 0, fail: 0, unavailable: 0, notApplicable: 0 },
  }

  const nonLiveEvidenceItems: NonLiveEvidenceReport[] = []

  for (const result of results) {
    byLane[result.lane].total++

    switch (result.status) {
      case 'pass':
        byLane[result.lane].pass++
        break
      case 'fail':
        byLane[result.lane].fail++
        break
      case 'unavailable':
        byLane[result.lane].unavailable++
        break
      case 'not_applicable':
        byLane[result.lane].notApplicable++
        break
    }

    if (result.label === '[non-live evidence]' || result.status === 'unavailable') {
      nonLiveEvidenceItems.push({
        lane: result.lane,
        justification: result.justification || 'No justification provided',
        evidence: result.evidence as Record<string, unknown>,
        upgradePath: extractUpgradePath(result),
      })
    }
  }

  const hasFailures = Object.values(byLane).some((lane) => lane.fail > 0)
  const hasNonLive = nonLiveEvidenceItems.length > 0

  let overallStatus: 'fully_evidence' | 'partial_evidence' | 'non_live_only'
  if (!hasFailures && !hasNonLive) {
    overallStatus = 'fully_evidence'
  } else if (hasNonLive && !hasFailures) {
    overallStatus = 'partial_evidence'
  } else {
    overallStatus = 'non_live_only'
  }

  return {
    timestamp: new Date().toISOString(),
    totalResults: results.length,
    byLane,
    nonLiveEvidenceItems,
    overallStatus,
  }
}

/**
 * Format evidence status report for console output
 */
export function formatEvidenceReport(report: EvidenceStatusReport): string {
  const lines: string[] = []

  lines.push('═'.repeat(60))
  lines.push('Evidence Status Report')
  lines.push('═'.repeat(60))
  lines.push(`Timestamp: ${report.timestamp}`)
  lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`)
  lines.push('')

  // By lane breakdown
  lines.push('─── By Lane ───')
  for (const lane of Object.values(EvidenceLane)) {
    const laneReport = report.byLane[lane]
    const passStr = laneReport.pass > 0 ? `✓ ${laneReport.pass}` : ''
    const failStr = laneReport.fail > 0 ? `✗ ${laneReport.fail}` : ''
    const nonLiveStr = laneReport.unavailable > 0 ? `⚠ ${laneReport.unavailable}` : ''
    const naStr = laneReport.notApplicable > 0 ? `— ${laneReport.notApplicable}` : ''

    const parts = [formatLaneName(lane), ':', passStr, failStr, nonLiveStr, naStr].filter(Boolean)
    lines.push(parts.join(' '))
  }

  // Non-live evidence items
  if (report.nonLiveEvidenceItems.length > 0) {
    lines.push('')
    lines.push('─── [non-live evidence] Items ───')
    for (const item of report.nonLiveEvidenceItems) {
      lines.push(`[${formatLaneName(item.lane)}] ${item.justification}`)
      if (item.upgradePath) {
        lines.push(`  Upgrade: ${item.upgradePath}`)
      }
    }
  }

  lines.push('═'.repeat(60))

  return lines.join('\n')
}

/**
 * Console output for evidence status
 */
export function consoleEvidenceStatus(results: EvidenceResult[]): void {
  const report = reportEvidenceStatus(results)
  console.log(formatEvidenceReport(report))
}
