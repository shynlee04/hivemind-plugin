/**
 * HiveMind Dashboard Internationalization
 *
 * Supports EN/VI locales.
 *
 * TODO [US-032]: Migrate to @opentui/i18n when available.
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
  swarm_monitor: string;
  mem_creation: string;
  swarm_orchestrator: string;
  time_travel: string;
  tool_registry: string;
  status_locked: string;
  status_open: string;
  view_main: string;
  view_swarm: string;
  view_timetravel: string;
  view_tools: string;
  view_settings: string;
  drift_score: string;
  turns: string;
  files: string;
  context_updates: string;
  violations: string;
  health: string;
  write_without_read: string;
}

const STRINGS: Record<DashboardLanguage, DashboardStrings> = {
  en: {
    title: "HiveMind Live Governance Dashboard",
    session: "Session",
    hierarchy: "Hierarchy",
    metrics: "Telemetry Header",
    alerts: "Autonomic Log",
    trace: "Traceability",
    controls: "Controls: [1-5] View  [L] Lang  [R] Refresh  [Q] Quit",
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
    status_locked: "LOCKED",
    status_open: "OPEN",
    view_main: "Main",
    view_swarm: "Swarm",
    view_timetravel: "TimeTravel",
    view_tools: "Tools",
    view_settings: "Settings",
    drift_score: "Drift",
    turns: "Turns",
    files: "Files",
    context_updates: "Updates",
    violations: "Violations",
    health: "Health",
    write_without_read: "Write w/o Read",
  },
  vi: {
    title: "Bang Dieu Khien HiveMind (Truc Tiep)",
    session: "Phien",
    hierarchy: "Phan Cap",
    metrics: "Tieu De Do Luong",
    alerts: "Nhat Ky Tu Dong",
    trace: "Truy Vet",
    controls: "Phim: [1-5] Xem  [L] Ngon ngu  [R] Lam moi  [Q] Thoat",
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
    status_locked: "KHOA",
    status_open: "MO",
    view_main: "Chinh",
    view_swarm: "Swarm",
    view_timetravel: "TimeTravel",
    view_tools: "Cong Cu",
    view_settings: "Cai Dat",
    drift_score: "Do Lech",
    turns: "Luot",
    files: "Tap tin",
    context_updates: "Cap nhat",
    violations: "Vi pham",
    health: "Suc khoe",
    write_without_read: "Ghi k/Doc",
  },
};

export function getDashboardStrings(language: DashboardLanguage): DashboardStrings {
  return STRINGS[language] ?? STRINGS.en;
}
