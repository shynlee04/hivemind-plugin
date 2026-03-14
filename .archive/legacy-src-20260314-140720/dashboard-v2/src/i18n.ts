/**
 * HiveMind Dashboard-v2 Internationalization
 *
 * Supports EN/VI locales with localStorage persistence.
 *
 * @module i18n
 */

export type DashboardLanguage = "en" | "vi";

export interface DashboardStrings {
  // Header
  "header.title": string;
  "header.subtitle": string;
  "header.version": string;
  "header.session": string;
  "header.server": string;
  "header.status": string;

  // Navigation
  "nav.title": string;

  // Tabs
  "tab.overview": string;
  "tab.pipeline": string;
  "tab.swarm": string;
  "tab.hierarchy": string;
  "tab.incidents": string;
  "tab.codeintel": string;
  "tab.tool_registry": string;
  "tab.time_travel": string;
  "tab.governance": string;
  "tab.settings": string;

  // Status labels
  "status.online": string;
  "status.offline": string;
  "status.connected": string;
  "status.disconnected": string;
  "status.ok": string;
  "status.err": string;
  "status.syncing": string;
  "status.loading": string;

  // Actions (keyboard shortcuts)
  "action.create_session": string;
  "action.send_message": string;
  "action.execute_command": string;
  "action.show_todos": string;
  "action.list_agents": string;
  "action.refresh": string;
  "action.quit": string;
  "action.toggle_lang": string;

  // Footer
  "footer.navigate": string;
  "footer.jump": string;
  "footer.refresh": string;
  "footer.server": string;

  // Overview panel
  "overview.session_id": string;
  "overview.server_status": string;
  "overview.connection": string;
  "overview.version": string;
  "overview.sessions": string;
  "overview.agents": string;
  "overview.last_action": string;
  "overview.mode": string;
  "overview.governance": string;
  "overview.drift": string;
  "overview.turns": string;
  "overview.files_touched": string;
  "overview.updated": string;

  // Pipeline panel
  "pipeline.task_distribution": string;
  "pipeline.active": string;
  "pipeline.pending": string;
  "pipeline.blocked": string;
  "pipeline.done": string;
  "pipeline.delegation_lanes": string;
  "pipeline.active_trajectory_tasks": string;
  "pipeline.no_active_tasks": string;

  // Hierarchy panel
  "hierarchy.cognitive_graph": string;
  "hierarchy.nodes": string;
  "hierarchy.depth": string;
  "hierarchy.active": string;

  // Incidents panel
  "incidents.level": string;
  "incidents.signals": string;

  // CodeIntel panel
  "codeintel.engine": string;
  "codeintel.source": string;
  "codeintel.entities": string;
  "codeintel.files": string;
  "codeintel.tokens": string;
  "codeintel.compression": string;
  "codeintel.discovered_modules": string;

  // Governance panel
  "governance.checks": string;
  "governance.anchors": string;
  "governance.none": string;
  "governance.memory_shelves": string;

  // Settings panel
  "settings.sidecar_boundaries": string;
  "settings.keyboard_controls": string;
  "settings.next_tab": string;
  "settings.prev_tab": string;
  "settings.jump_tab": string;
  "settings.refresh_snapshot": string;
  "settings.create_session": string;
  "settings.send_message": string;
  "settings.exec_command": string;
  "settings.show_todos": string;
  "settings.list_agents": string;
  "settings.quit": string;
  "settings.toggle_lang": string;

  // Errors
  "error.load_failed": string;
  "error.server_required": string;
  "error.no_agents": string;

  // Misc
  "misc.na": string;
  "misc.lang": string;

  // Modal
  "modal.title_session": string;
  "modal.title_message": string;
  "modal.title_command": string;
  "modal.placeholder": string;
  "modal.submit": string;
  "modal.cancel": string;

  // Help Overlay
  "help.title": string;
  "help.navigation": string;
  "help.actions": string;
  "help.server": string;
  "help.misc": string;
  "help.close": string;
}

const STRINGS: Record<DashboardLanguage, DashboardStrings> = {
  en: {
    // Header
    "header.title": "HIVEMIND",
    "header.subtitle": "RELATIONAL_ENGINE",
    "header.version": "_v3.0",
    "header.session": "SESSION",
    "header.server": "SERVER",
    "header.status": "STATUS",

    // Navigation
    "nav.title": "NAVIGATION",

    // Tabs
    "tab.overview": "Overview",
    "tab.pipeline": "Pipeline",
    "tab.swarm": "Swarm",
    "tab.hierarchy": "Hierarchy",
    "tab.incidents": "Incidents",
    "tab.codeintel": "Code-Intel",
    "tab.tool_registry": "Tool Registry",
    "tab.time_travel": "Time Travel",
    "tab.governance": "Governance",
    "tab.settings": "Settings",

    // Status labels
    "status.online": "ONLINE",
    "status.offline": "OFFLINE",
    "status.connected": "CONNECTED",
    "status.disconnected": "DISCONNECTED",
    "status.ok": "OK",
    "status.err": "ERR",
    "status.syncing": "(SYNCING...)",
    "status.loading": "LOADING_SNAPSHOT...",

    // Actions
    "action.create_session": "Press 'c' to create session - OpenCode server required",
    "action.send_message": "Press 'm' to send message - OpenCode server required",
    "action.execute_command": "Press 'x' to execute command - OpenCode server required",
    "action.show_todos": "Press 't' for todo list - OpenCode server required",
    "action.list_agents": "Agents",
    "action.refresh": "Refreshed",
    "action.quit": "Quit",
    "action.toggle_lang": "Language",

    // Footer
    "footer.navigate": "Navigate",
    "footer.jump": "Jump",
    "footer.refresh": "Refresh",
    "footer.server": "Server",

    // Overview panel
    "overview.session_id": "SESSION_ID",
    "overview.server_status": "SERVER_STATUS",
    "overview.connection": "CONNECTION",
    "overview.version": "VERSION",
    "overview.sessions": "SESSIONS",
    "overview.agents": "AGENTS",
    "overview.last_action": "LAST_ACTION",
    "overview.mode": "MODE",
    "overview.governance": "GOVERNANCE",
    "overview.drift": "DRIFT",
    "overview.turns": "TURNS",
    "overview.files_touched": "FILES_TOUCHED",
    "overview.updated": "UPDATED",

    // Pipeline panel
    "pipeline.task_distribution": "TASK_DISTRIBUTION",
    "pipeline.active": "ACTIVE",
    "pipeline.pending": "PENDING",
    "pipeline.blocked": "BLOCKED",
    "pipeline.done": "DONE",
    "pipeline.delegation_lanes": "DELEGATION_LANES",
    "pipeline.active_trajectory_tasks": "ACTIVE_TRAJECTORY_TASKS",
    "pipeline.no_active_tasks": "[no active_task_ids in trajectory.json]",

    // Hierarchy panel
    "hierarchy.cognitive_graph": "COGNITIVE_GRAPH",
    "hierarchy.nodes": "NODES",
    "hierarchy.depth": "DEPTH",
    "hierarchy.active": "ACTIVE",

    // Incidents panel
    "incidents.level": "INCIDENT_LEVEL",
    "incidents.signals": "SIGNALS",

    // CodeIntel panel
    "codeintel.engine": "CODE_INTEL_ENGINE",
    "codeintel.source": "SOURCE",
    "codeintel.entities": "ENTITIES",
    "codeintel.files": "FILES",
    "codeintel.tokens": "TOKENS",
    "codeintel.compression": "COMPRESSION",
    "codeintel.discovered_modules": "DISCOVERED_MODULES",

    // Governance panel
    "governance.checks": "GOVERNANCE_CHECKS",
    "governance.anchors": "ANCHORS",
    "governance.none": "[none]",
    "governance.memory_shelves": "MEMORY_SHELVES",

    // Settings panel
    "settings.sidecar_boundaries": "SIDECAR_BOUNDARIES",
    "settings.keyboard_controls": "KEYBOARD_CONTROLS",
    "settings.next_tab": "Tab / j / ↓ - Next tab",
    "settings.prev_tab": "Shift+Tab / k / ↑ - Prev tab",
    "settings.jump_tab": "1-9 / 0 - Jump to tab",
    "settings.refresh_snapshot": "r - Refresh snapshot",
    "settings.create_session": "c - Create session (server)",
    "settings.send_message": "m - Send message (server)",
    "settings.exec_command": "x - Execute command (server)",
    "settings.show_todos": "t - Show todos (server)",
    "settings.list_agents": "a - List agents (server)",
    "settings.quit": "q - Quit dashboard",
    "settings.toggle_lang": "l - Toggle language (EN/VI)",

    // Errors
    "error.load_failed": "ERROR: Dashboard data load failed",
    "error.server_required": "OpenCode server required",
    "error.no_agents": "No agents available - Server offline",

    // Misc
    "misc.na": "N/A",
    "misc.lang": "LANG",

    // Modal
    "modal.title_session": "New Session Title",
    "modal.title_message": "Enter Message",
    "modal.title_command": "Enter Command",
    "modal.placeholder": "Type here...",
    "modal.submit": "Submit",
    "modal.cancel": "Cancel",

    // Help Overlay
    "help.title": "KEYBOARD_SHORTCUTS",
    "help.navigation": "NAVIGATION",
    "help.actions": "ACTIONS",
    "help.server": "SERVER_ACTIONS",
    "help.misc": "MISC",
    "help.close": "Press ? / Escape / q to close",
  },
  vi: {
    // Header
    "header.title": "HIVEMIND",
    "header.subtitle": "BỘ_MÁY_QUAN_HỆ",
    "header.version": "_v3.0",
    "header.session": "PHIÊN",
    "header.server": "MÁY_CHỦ",
    "header.status": "TRẠNG_THÁI",

    // Navigation
    "nav.title": "ĐIỀU_HƯỚNG",

    // Tabs
    "tab.overview": "Tổng quan",
    "tab.pipeline": "Pipeline",
    "tab.swarm": "Bầy tác vụ",
    "tab.hierarchy": "Cây phân cấp",
    "tab.incidents": "Sự cố",
    "tab.codeintel": "Code-Intel",
    "tab.tool_registry": "Kho công cụ",
    "tab.time_travel": "Du hành trạng thái",
    "tab.governance": "Quản trị",
    "tab.settings": "Cài đặt",

    // Status labels
    "status.online": "TRỰC_TUYẾN",
    "status.offline": "NGOẠI_TUYẾN",
    "status.connected": "ĐÃ_KẾT_NỐI",
    "status.disconnected": "NGẮT_KẾT_NỐI",
    "status.ok": "OK",
    "status.err": "LỖI",
    "status.syncing": "(ĐANG_ĐỒNG_BỘ...)",
    "status.loading": "ĐANG_TẢI_SNAPSHOT...",

    // Actions
    "action.create_session": "Nhấn 'c' để tạo phiên - Cần máy chủ OpenCode",
    "action.send_message": "Nhấn 'm' để gửi tin nhắn - Cần máy chủ OpenCode",
    "action.execute_command": "Nhấn 'x' để thực thi lệnh - Cần máy chủ OpenCode",
    "action.show_todos": "Nhấn 't' để xem todo - Cần máy chủ OpenCode",
    "action.list_agents": "Agent",
    "action.refresh": "Đã làm mới",
    "action.quit": "Thoát",
    "action.toggle_lang": "Ngôn ngữ",

    // Footer
    "footer.navigate": "Điều hướng",
    "footer.jump": "Nhảy",
    "footer.refresh": "Làm mới",
    "footer.server": "Máy chủ",

    // Overview panel
    "overview.session_id": "ID_PHIÊN",
    "overview.server_status": "TRẠNG_THÁI_MÁY_CHỦ",
    "overview.connection": "KẾT_NỐI",
    "overview.version": "PHIÊN_BẢN",
    "overview.sessions": "PHIÊN",
    "overview.agents": "AGENT",
    "overview.last_action": "HÀNH_ĐỘNG_CUỐI",
    "overview.mode": "CHẾ_ĐỘ",
    "overview.governance": "QUẢN_TRỊ",
    "overview.drift": "ĐỘ_LỆCH",
    "overview.turns": "LƯỢT",
    "overview.files_touched": "TỆP_TIN",
    "overview.updated": "CẬP_NHẬT",

    // Pipeline panel
    "pipeline.task_distribution": "PHÂN_BỔ_TÁC_VỤ",
    "pipeline.active": "ĐANG_HOẠT_ĐỘNG",
    "pipeline.pending": "ĐANG_CHỜ",
    "pipeline.blocked": "BỊ_CHẶN",
    "pipeline.done": "HOÀN_THÀNH",
    "pipeline.delegation_lanes": "LÀN_ƯỶ_QUYỀN",
    "pipeline.active_trajectory_tasks": "TÁC_VỤ_TRAJECTORY",
    "pipeline.no_active_tasks": "[không có active_task_ids trong trajectory.json]",

    // Hierarchy panel
    "hierarchy.cognitive_graph": "ĐỒ_THỊ_TRI_THỨC",
    "hierarchy.nodes": "NÚT",
    "hierarchy.depth": "ĐỘ_SÂU",
    "hierarchy.active": "HOẠT_ĐỘNG",

    // Incidents panel
    "incidents.level": "MỨC_ĐỘ_SỰ_CỐ",
    "incidents.signals": "TÍN_HIỆU",

    // CodeIntel panel
    "codeintel.engine": "BỘ_MÁY_CODE_INTEL",
    "codeintel.source": "NGUỒN",
    "codeintel.entities": "THỰC_THỂ",
    "codeintel.files": "TỆP",
    "codeintel.tokens": "TOKEN",
    "codeintel.compression": "NÉN",
    "codeintel.discovered_modules": "MODULE_PHÁT_HIỆN",

    // Governance panel
    "governance.checks": "KIỂM_TRA_QUẢN_TRỊ",
    "governance.anchors": "NEO",
    "governance.none": "[không có]",
    "governance.memory_shelves": "KỆ_BỘ_NHỚ",

    // Settings panel
    "settings.sidecar_boundaries": "RANH_GIỚI_SIDECAR",
    "settings.keyboard_controls": "ĐIỀU_KHIỂN_PHÍM",
    "settings.next_tab": "Tab / j / ↓ - Tab tiếp",
    "settings.prev_tab": "Shift+Tab / k / ↑ - Tab trước",
    "settings.jump_tab": "1-9 / 0 - Nhảy đến tab",
    "settings.refresh_snapshot": "r - Làm mới snapshot",
    "settings.create_session": "c - Tạo phiên (máy chủ)",
    "settings.send_message": "m - Gửi tin nhắn (máy chủ)",
    "settings.exec_command": "x - Thực thi lệnh (máy chủ)",
    "settings.show_todos": "t - Xem todo (máy chủ)",
    "settings.list_agents": "a - Danh sách agent (máy chủ)",
    "settings.quit": "q - Thoát dashboard",
    "settings.toggle_lang": "l - Đổi ngôn ngữ (EN/VI)",

    // Errors
    "error.load_failed": "LỖI: Không thể tải dữ liệu dashboard",
    "error.server_required": "Cần máy chủ OpenCode",
    "error.no_agents": "Không có agent - Máy chủ ngoại tuyến",

    // Misc
    "misc.na": "KHÔNG_CÓ",
    "misc.lang": "NGÔN_NGỮ",

    // Modal
    "modal.title_session": "Tiêu Đề Phiên Mới",
    "modal.title_message": "Nhập Tin Nhắn",
    "modal.title_command": "Nhập Lệnh",
    "modal.placeholder": "Nhập tại đây...",
    "modal.submit": "Gửi",
    "modal.cancel": "Hủy",

    // Help Overlay
    "help.title": "PHÍM_TẮT",
    "help.navigation": "ĐIỀU_HƯỚNG",
    "help.actions": "HÀNH_ĐỘNG",
    "help.server": "HÀNH_ĐỘNG_MÁY_CHỦ",
    "help.misc": "KHÁC",
    "help.close": "Nhấn ? / Escape / q để đóng",
  },
};

/**
 * Get translation string for a key in the specified language.
 * Falls back to key if translation not found.
 */
export function t(key: keyof DashboardStrings, lang: DashboardLanguage = "en"): string {
  return STRINGS[lang]?.[key] ?? key;
}

/**
 * Get all strings for a language (for components that need bulk access).
 */
export function getStrings(lang: DashboardLanguage): DashboardStrings {
  return STRINGS[lang] ?? STRINGS.en;
}

/**
 * Storage key for language preference persistence.
 */
const LANG_STORAGE_KEY = "hivemind-dashboard-lang";

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function getBrowserStorage(): StorageLike | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }
  if (!("localStorage" in globalThis)) {
    return null;
  }
  const storage = (globalThis as { localStorage?: StorageLike }).localStorage;
  return storage ?? null;
}

function getNavigatorLanguage(): string | undefined {
  if (typeof globalThis !== "object" || globalThis === null) {
    return undefined;
  }
  if (!("navigator" in globalThis)) {
    return undefined;
  }
  const nav = (globalThis as { navigator?: { language?: string } }).navigator;
  return nav?.language;
}

/**
 * Get persisted language preference from localStorage.
 * Falls back to system language detection or 'en'.
 */
export function getPersistedLang(): DashboardLanguage {
  const storage = getBrowserStorage();

  // Try localStorage first
  if (storage) {
    try {
      const stored = storage.getItem(LANG_STORAGE_KEY);
      if (stored === "en" || stored === "vi") {
        return stored;
      }
    } catch {
      // Ignore storage access errors in restricted runtimes.
    }
  }

  // Try system language detection
  const navLang = getNavigatorLanguage()?.toLowerCase();
  if (navLang?.startsWith("vi")) {
    return "vi";
  }

  // Default to English
  return "en";
}

/**
 * Persist language preference to localStorage.
 */
export function persistLang(lang: DashboardLanguage): void {
  const storage = getBrowserStorage();
  if (storage) {
    try {
      storage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage access errors in restricted runtimes.
    }
  }
}

/**
 * Toggle between EN and VI languages.
 */
export function toggleLang(current: DashboardLanguage): DashboardLanguage {
  return current === "en" ? "vi" : "en";
}
