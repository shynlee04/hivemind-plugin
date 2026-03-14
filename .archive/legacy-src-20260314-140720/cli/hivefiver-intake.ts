import {
  buildHiveFiverDiscoveryProfile,
  classifyHiveFiverIntent,
  routeHiveFiverStage,
} from "../lib/hivefiver-intake.js"

export type HiveFiverIntakeAction = "classify-intent" | "guided-discovery" | "route-stage"

export interface HiveFiverIntakeOptions {
  action: HiveFiverIntakeAction
  text: string
}

/**
 * Execute the compatibility HiveFiver intake bridge from the CLI layer.
 *
 * @param options - Requested bridge action and user text.
 * @returns JSON-serializable compatibility payload.
 */
export function runHiveFiverIntakeBridge(options: HiveFiverIntakeOptions): unknown {
  switch (options.action) {
    case "classify-intent":
      return classifyHiveFiverIntent(options.text)
    case "guided-discovery":
      return buildHiveFiverDiscoveryProfile(options.text)
    case "route-stage":
      return routeHiveFiverStage(options.text)
    default:
      throw new Error(`Unsupported hivefiver-intake action: ${options.action satisfies never}`)
  }
}
