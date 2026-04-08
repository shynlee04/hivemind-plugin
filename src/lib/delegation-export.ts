import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { buildDelegationArtifactPacket, packetToJSON } from "./delegation-packet.js"
import type { SessionContinuityRecord } from "./types.js"

export type DelegationExportPolicy = {
  enabled: boolean
  outputDir: string
}

export type DelegationManifest = {
  generatedAt: number
  active: string[]
  terminal: string[]
  packets: string[]
}

export type DelegationExportResult = {
  enabled: boolean
  outputDir: string
  manifestPath: string | null
  packetPaths: string[]
}

function sortRecords(records: readonly SessionContinuityRecord[]): SessionContinuityRecord[] {
  return [...records].sort((left, right) => left.sessionID.localeCompare(right.sessionID))
}

export function buildDelegationManifest(
  records: readonly SessionContinuityRecord[],
): DelegationManifest {
  const ordered = sortRecords(records)
  const active: string[] = []
  const terminal: string[] = []

  for (const record of ordered) {
    const status = record.metadata.delegationPacket?.status
    if (status === "completed" || status === "failed") {
      terminal.push(record.sessionID)
      continue
    }
    active.push(record.sessionID)
  }

  return {
    generatedAt: Date.now(),
    active,
    terminal,
    packets: ordered.map((record) => record.sessionID),
  }
}

export function exportDelegationArtifacts(args: {
  records: readonly SessionContinuityRecord[]
  policy: DelegationExportPolicy
}): DelegationExportResult {
  const outputDir = resolve(args.policy.outputDir)
  if (!args.policy.enabled) {
    return {
      enabled: false,
      outputDir,
      manifestPath: null,
      packetPaths: [],
    }
  }

  const records = sortRecords(args.records).filter((record) => record.metadata.delegationPacket)
  mkdirSync(outputDir, { recursive: true })

  const packetPaths = records.map((record) => {
    const packetPath = join(outputDir, `${record.sessionID}.json`)
    writeFileSync(packetPath, `${packetToJSON(buildDelegationArtifactPacket(record))}\n`, "utf8")
    return packetPath
  })

  const manifestPath = join(outputDir, "manifest.json")
  writeFileSync(
    manifestPath,
    `${JSON.stringify(buildDelegationManifest(records), null, 2)}\n`,
    "utf8",
  )

  return {
    enabled: true,
    outputDir,
    manifestPath,
    packetPaths,
  }
}
