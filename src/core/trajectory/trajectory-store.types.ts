import * as path from 'node:path'

import { getHivemindPath } from '../../shared/paths.js'

export const TRAJECTORY_LEDGER_VERSION = '1.0.0'

/**
 * Returns the file path for the trajectory ledger JSON file.
 * @param projectRoot - The project root directory
 * @returns The absolute path to trajectory-ledger.json
 */
export function getTrajectoryLedgerPath(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'state', 'trajectory-ledger.json')
}
