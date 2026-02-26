/** @jsxImportSource @opentui/react */
import * as OpenTUICore from "@opentui/core";
import * as OpenTUIReact from "@opentui/react";
import type {} from "@opentui/react/jsx-runtime";
import React from "react";
import { apiClient } from "./api.js";
import { t } from "./i18n.js";
import type { DashboardLanguage } from "./i18n.js";
import { COLORS } from "./constants.js";
import { InputModal } from "./components/InputModal.js";
import { MainPanel } from "./components/MainPanel.js";
import { HelpOverlay } from "./components/HelpOverlay.js";
import { useDashboardData } from "./hooks/useDashboardData.js";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler.js";
import {
  TAB_KEYS,
  createInitialState,
  reducer,
} from "./state.js";

const openTUICoreCompat = OpenTUICore as unknown as {
  createCliRenderer: () => Promise<any>;
};

const openTUIReactCompat = OpenTUIReact as unknown as {
  createRoot: (renderer: any) => { render: (node: React.ReactNode) => void };
};

function getTabs(lang: DashboardLanguage): string[] {
  return TAB_KEYS.map((key) => t(key as any, lang));
}

function getJumpHint(): string {
  if (TAB_KEYS.length <= 9) {
    return `1-${TAB_KEYS.length}`;
  }
  return "1-9/0";
}

function App({ renderer }: { renderer: any }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, createInitialState);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const refresh = useDashboardData(dispatch);
  useKeyboardHandler({ stateRef, dispatch, renderer, refresh });

  return (
    <box backgroundColor={COLORS.bg} flexDirection="column" flexGrow={1} padding={1}>
      {/* HEADER */}
      <box 
        border 
        borderStyle="single" 
        borderColor={COLORS.neonGreen} 
        paddingX={2} 
        paddingY={1}
        marginBottom={1}
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor={COLORS.panelBg}
      >
        <box flexDirection="row">
          <text fg={COLORS.neonGreen}><strong>HIVEMIND</strong></text>
          <text fg={COLORS.text}><strong>_v3.0</strong></text>
          <text fg={COLORS.dimText}><strong>::</strong></text>
          <text fg={COLORS.neonBlue}><strong>{t("header.subtitle", state.lang)}</strong></text>
        </box>
        <box flexDirection="row" gap={2}>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.session", state.lang)}: </text>
            <text fg={COLORS.neonBlue}>{state.snapshot?.overview?.sessionId?.slice(0, 12) || t("misc.na", state.lang)}</text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.server", state.lang)}: </text>
            <text fg={state.serverData?.connected ? COLORS.neonGreen : COLORS.neonAmber}>
              {state.serverData?.connected ? t("status.online", state.lang) : t("status.offline", state.lang)}
            </text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("header.status", state.lang)}: </text>
            <text fg={state.connected ? COLORS.neonGreen : COLORS.error}>{state.connected ? t("status.ok", state.lang) : t("status.err", state.lang)}</text>
          </box>
          <box flexDirection="row">
            <text fg={COLORS.dimText}>{t("misc.lang", state.lang)}: </text>
            <text fg={COLORS.neonBlue}>{state.lang.toUpperCase()}</text>
          </box>
        </box>
      </box>

      {/* MAIN LAYOUT - 2 Columns */}
      <box flexDirection="row" flexGrow={1} height={18}>
        {/* LEFT SIDEBAR - Navigation */}
        <box 
          width={22} 
          border 
          borderStyle="single" 
          borderColor={COLORS.border} 
          flexDirection="column" 
          backgroundColor={COLORS.panelBg}
          marginRight={1}
        >
          <box border borderStyle="single" borderColor={COLORS.border} paddingX={1}>
            <text fg={COLORS.neonBlue}><strong>{t("nav.title", state.lang)}</strong></text>
          </box>
          
          {getTabs(state.lang).map((tab: string, index: number) => {
            const active = index === state.activeTab;
            return (
              <box 
                key={tab} 
                paddingX={1} 
                paddingY={0}
                backgroundColor={active ? COLORS.border : undefined}
              >
                <text fg={active ? COLORS.neonGreen : COLORS.dimText}>
                  {active ? "▶" : " "} {index + 1}. {tab}
                </text>
              </box>
            );
          })}
          
          {/* Quick Stats in sidebar */}
          <box flexGrow={1} />
          <box border borderStyle="single" borderColor={COLORS.border} paddingX={1}>
            <box flexDirection="row">
              <text fg={COLORS.dimText}>DRIFT: </text>
              <text fg={(state.snapshot?.overview?.driftScore ?? 0) >= 50 ? COLORS.neonGreen : COLORS.neonAmber}>{state.snapshot?.overview?.driftScore ?? 0}</text>
            </box>
          </box>
        </box>

        {/* RIGHT - Main Content Area */}
        <box flexGrow={1} flexDirection="column">
          <MainPanel state={state} />
        </box>
      </box>

      {/* FOOTER */}
      <box 
        border 
        borderStyle="single" 
        borderColor={state.connected ? COLORS.neonGreen : COLORS.error} 
        paddingX={1} 
        paddingY={0}
        marginTop={1}
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor={COLORS.panelBg}
      >
        <box flexDirection="row">
          <text fg={state.connected ? COLORS.neonGreen : COLORS.error}>
            <strong>● {state.connected ? t("status.connected", state.lang) : t("status.disconnected", state.lang)}</strong>
          </text>
          <text fg={COLORS.dimText}> {state.loading ? t("status.syncing", state.lang) : ""}</text>
          <text fg="gray"> | </text>
          <text fg={state.serverData?.connected ? COLORS.neonGreen : COLORS.neonAmber}>
            {state.serverData?.connected
              ? `${t("header.server", state.lang)}:${t("status.online", state.lang)}`
              : `${t("header.server", state.lang)}:${t("status.offline", state.lang)}`}
          </text>
        </box>
        <box flexDirection="row">
          <text fg={COLORS.dimText}>[Tab/j/k] {t("footer.navigate", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[{getJumpHint()}] {t("footer.jump", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[r] {t("footer.refresh", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[cmaxt] {t("footer.server", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[l] {t("action.toggle_lang", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[?] {t("help.title", state.lang)}</text>
          <text fg="gray"> | </text>
          <text fg={COLORS.dimText}>[q] {t("action.quit", state.lang)}</text>
        </box>
      </box>

      {/* MODAL OVERLAY */}
      {state.modal && (
        <InputModal
          title={
            state.modal.type === "session-create" ? t("modal.title_session", state.lang) :
            state.modal.type === "message" ? t("modal.title_message", state.lang) :
            t("modal.title_command", state.lang)
          }
          placeholder={t("modal.placeholder", state.lang)}
          submitLabel={t("modal.submit", state.lang)}
          cancelLabel={t("modal.cancel", state.lang)}
          onSubmit={async (value: string) => {
            const currentModal = state.modal;
            if (!currentModal) {
              dispatch({ type: "CLOSE_MODAL" });
              return;
            }

            dispatch({ type: "ACTION_LOADING", value: true });
            try {
              if (currentModal.type === "session-create") {
                const session = await apiClient.createSession();
                if (session) {
                  dispatch({ type: "SET_SESSION", value: session.id });
                  dispatch({ type: "LAST_ACTION", value: `[OK] Session created: ${session.id.slice(0, 8)}...` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: "[ERROR] Failed to create session" });
                }
              } else if (currentModal.type === "message" && currentModal.payload?.sessionId) {
                const result = await apiClient.sendMessage(currentModal.payload.sessionId, value);
                if (result.success) {
                  dispatch({ type: "LAST_ACTION", value: `[OK] Message sent` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: `[ERROR] ${result.error || "Failed"}` });
                }
              } else if (currentModal.type === "command" && currentModal.payload?.sessionId) {
                const result = await apiClient.executeCommand(currentModal.payload.sessionId, value);
                if (result.success) {
                  dispatch({ type: "LAST_ACTION", value: `[OK] Command executed` });
                } else {
                  dispatch({ type: "LAST_ACTION", value: `[ERROR] ${result.error || "Failed"}` });
                }
              }
            } catch (error) {
              dispatch({ type: "LAST_ACTION", value: `[ERROR] ${error instanceof Error ? error.message : String(error)}` });
            } finally {
              dispatch({ type: "ACTION_LOADING", value: false });
              dispatch({ type: "CLOSE_MODAL" });
            }
          }}
          onCancel={() => {
            dispatch({ type: "CLOSE_MODAL" });
          }}
        />
      )}

      {/* HELP OVERLAY */}
      {state.helpOverlay && !state.modal && (
        <HelpOverlay lang={state.lang} />
      )}
    </box>
  );
}

const renderer = await openTUICoreCompat.createCliRenderer();
openTUIReactCompat.createRoot(renderer).render(<App renderer={renderer} />);
