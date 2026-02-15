/**
 * HiveMind Dashboard Internationalization
 *
 * Supports EN/VI locales.
 */

export type DashboardLanguage = "en" | "vi";

export interface DashboardStrings {
  title: string;
  session: string;
  hierarchy: string;
  metrics: string;
  alerts: string;
  trace: string;
  controls: string;
  no_session: string;
  no_hierarchy: string;
  active: string;
  mode: string;
  governance: string;
  automation: string;
  coach_profile: string;
  // New strings for placeholders
  swarm_monitor: string;
  mem_creation: string;
  swarm_orchestrator: string;
  time_travel: string;
  tool_registry: string;
}

const STRINGS: Record<DashboardLanguage, DashboardStrings> = {
  en: {
    title: "HiveMind Live Governance Dashboard",
    session: "Session",
    hierarchy: "Hierarchy",
    metrics: "Metrics",
    alerts: "Escalation Alerts",
    trace: "Traceability",
    controls: "Controls: [q] quit  [l] language  [r] refresh",
    no_session: "No session initialized. Run `hivemind init`.",
    no_hierarchy: "No hierarchy declared yet.",
    active: "Active",
    mode: "Mode",
    governance: "Governance",
    automation: "Automation",
    coach_profile: "Coach profile active: strict + skeptical + code-review",
    swarm_monitor: "Swarm Monitor",
    mem_creation: "Memory Creation",
    swarm_orchestrator: "Swarm Orchestrator",
    time_travel: "Time Travel Debugger",
    tool_registry: "Tool Registry",
  },
  vi: {
    title: "Bang Dieu Khien HiveMind (Truc Tiep)",
    session: "Phien",
    hierarchy: "Phan Cap",
    metrics: "Chi So",
    alerts: "Canh Bao Leo Thang",
    trace: "Truy Vet",
    controls: "Phim: [q] thoat  [l] ngon ngu  [r] lam moi",
    no_session: "Chua khoi tao phien. Hay chay `hivemind init`.",
    no_hierarchy: "Chua khai bao phan cap.",
    active: "Dang Hoat Dong",
    mode: "Che Do",
    governance: "Quan Tri",
    automation: "Tu Dong Hoa",
    coach_profile: "Che do coach: strict + skeptical + bat buoc review",
    swarm_monitor: "Giam Sat Swarm",
    mem_creation: "Tao Bo Nho",
    swarm_orchestrator: "Dieu Phoi Swarm",
    time_travel: "Trinh Go Loi Time Travel",
    tool_registry: "So Dang Ky Cong Cu",
  },
};

export function getDashboardStrings(language: DashboardLanguage): DashboardStrings {
  return STRINGS[language] ?? STRINGS.en;
}
