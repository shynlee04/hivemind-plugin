/**
 * HiveMind Dashboard-v2 State Management
 *
 * Extracted from index.tsx for W0.1 Component Restructuring.
 * Contains all state types, constants, and reducer logic.
 *
 * @module state
 */

import { getPersistedLang, persistLang } from "./i18n.js";
import type { DashboardLanguage } from "./i18n.js";

// TAB keys for i18n
export const TAB_KEYS = [
  "tab.overview",
  "tab.pipeline",
  "tab.swarm",
  "tab.hierarchy",
  "tab.incidents",
  "tab.codeintel",
  "tab.governance",
  "tab.settings",
] as const;

// AppState interface
export interface AppState {
  activeTab: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
  snapshot: any | null;
  serverData: {
    connected: boolean;
    version: string | null;
    sessions: Array<{ id: string; title?: string }>;
    agents: Array<{ id: string; name: string }>;
  };
  lastAction: string | null;
  currentSessionId: string | null;
  modal: { type: string; payload?: any } | null;
  actionLoading: boolean;
  lang: DashboardLanguage;
  helpOverlay: boolean;
}

// AppAction union type
export type AppAction =
  | { type: "TAB_NEXT" }
  | { type: "TAB_PREV" }
  | { type: "TAB_SET"; value: number }
  | { type: "CONNECTED"; value: boolean }
  | { type: "SNAPSHOT"; value: any }
  | { type: "SERVER_DATA"; value: any }
  | { type: "LAST_ACTION"; value: string }
  | { type: "ERROR"; value: string }
  | { type: "SET_SESSION"; value: string | null }
  | { type: "ACTION_LOADING"; value: boolean }
  | { type: "SET_LANG"; value: DashboardLanguage }
  | { type: "OPEN_MODAL"; value: { type: string; payload?: any } }
  | { type: "CLOSE_MODAL" }
  | { type: "TOGGLE_HELP_OVERLAY" }
  | { type: "CLOSE_HELP_OVERLAY" };

// Initial state factory
export function createInitialState(): AppState {
  return {
    activeTab: 0,
    connected: false,
    loading: true,
    error: null,
    snapshot: null,
    serverData: {
      connected: false,
      version: null,
      sessions: [],
      agents: [],
    },
    lastAction: null,
    currentSessionId: null,
    actionLoading: false,
    lang: getPersistedLang(),
    modal: null,
    helpOverlay: false,
  };
}

// Reducer function
export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TAB_NEXT":
      return { ...state, activeTab: (state.activeTab + 1) % TAB_KEYS.length };
    case "TAB_PREV":
      return { ...state, activeTab: (state.activeTab - 1 + TAB_KEYS.length) % TAB_KEYS.length };
    case "TAB_SET":
      return { ...state, activeTab: action.value };
    case "CONNECTED":
      return { ...state, connected: action.value };
    case "SNAPSHOT":
      return { ...state, snapshot: action.value, loading: false, error: null };
    case "SERVER_DATA":
      return { ...state, serverData: action.value, connected: action.value.connected };
    case "LAST_ACTION":
      return { ...state, lastAction: action.value };
    case "ERROR":
      return { ...state, loading: false, error: action.value };
    case "SET_SESSION":
      return { ...state, currentSessionId: action.value };
    case "ACTION_LOADING":
      return { ...state, actionLoading: action.value };
    case "SET_LANG":
      persistLang(action.value);
      return { ...state, lang: action.value };
    case "OPEN_MODAL":
      return { ...state, modal: action.value };
    case "CLOSE_MODAL":
      return { ...state, modal: null };
    case "TOGGLE_HELP_OVERLAY":
      return { ...state, helpOverlay: !state.helpOverlay };
    case "CLOSE_HELP_OVERLAY":
      return { ...state, helpOverlay: false };
    default:
      return state;
  }
}
