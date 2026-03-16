import type { RuntimePressureContract } from '../../shared/pressure-contract.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'

export type HivemindDocAction = 'skim' | 'skim_directory' | 'read' | 'chunk' | 'search'

export interface HivemindDocToolArgs {
  action: HivemindDocAction
  filePath?: string
  dirPath?: string
  heading?: string
  maxTokens?: number
  query?: string
  globFilter?: string
}

export const docActionPressureContracts: Record<HivemindDocAction, RuntimePressureContract> = {
  skim: getRuntimePressureContract('steady-state'),
  skim_directory: getRuntimePressureContract('steady-state'),
  read: getRuntimePressureContract('steady-state'),
  chunk: getRuntimePressureContract('steady-state'),
  search: getRuntimePressureContract('steady-state'),
}
