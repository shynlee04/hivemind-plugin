export type DashboardLanguage = "en" | "vi";

export type Tier = "INFO" | "WARN" | "CRITICAL" | "DEGRADED";

export interface SessionView {
  id: string;
  status: string;
  mode: string;
  governanceMode: string;
  automationLevel: string;
  coachProfile: boolean;
}

export interface HierarchyView {
  lines: string[];
  totalNodes: number;
  depth: number;
  activeNodes: number;
}

export interface MetricsView {
  turnCount: number;
  driftScore: number;
  filesTouched: number;
  contextUpdates: number;
  violations: number;
  healthScore: number;
  writeWithoutReadCount: number;
}

export interface AlertView {
  tier: Tier;
  message: string;
  evidence: string;
  suggestion?: string;
}

export interface TraceEntry {
  label: string;
  value: string;
}

export interface TraceView {
  nowIso: string;
  gitHash: string;
  timeline: TraceEntry[];
}

export interface DashboardSnapshot {
  session: SessionView;
  hierarchy: HierarchyView;
  metrics: MetricsView;
  alerts: AlertView[];
  trace: TraceView;
}
