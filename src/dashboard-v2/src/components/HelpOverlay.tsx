/** @jsxImportSource @opentui/react */
import type {} from "@opentui/react/jsx-runtime";
import { t } from "../i18n.js";
import type { DashboardLanguage } from "../i18n.js";
import { COLORS } from "../constants.js";

export function HelpOverlay({ lang }: { lang: DashboardLanguage }) {
  return (
    <box
      position="absolute"
      top={2}
      left={4}
      width={50}
      border
      borderStyle="double"
      borderColor={COLORS.neonBlue}
      backgroundColor={COLORS.panelBg}
      padding={1}
      flexDirection="column"
    >
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: {t("help.title", lang)}</strong></text>
      </box>

      <box marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>{t("help.navigation", lang)}</strong></text>
      </box>
      <box paddingLeft={1} flexDirection="column">
        <text fg={COLORS.dimText}>Tab / j / ↓  - {t("footer.navigate", lang)}</text>
        <text fg={COLORS.dimText}>Shift+Tab / k / ↑ - {t("footer.navigate", lang)} (prev)</text>
        <text fg={COLORS.dimText}>1-7 - {t("footer.jump", lang)}</text>
      </box>

      <box marginTop={1} marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>{t("help.actions", lang)}</strong></text>
      </box>
      <box paddingLeft={1} flexDirection="column">
        <text fg={COLORS.dimText}>r - {t("footer.refresh", lang)}</text>
        <text fg={COLORS.dimText}>? - {t("help.title", lang)}</text>
        <text fg={COLORS.dimText}>l - {t("action.toggle_lang", lang)}</text>
        <text fg={COLORS.dimText}>q - {t("action.quit", lang)}</text>
      </box>

      <box marginTop={1} marginBottom={1}>
        <text fg={COLORS.neonAmber}><strong>{t("help.server", lang)}</strong></text>
      </box>
      <box paddingLeft={1} flexDirection="column">
        <text fg={COLORS.dimText}>c - {t("action.create_session", lang).slice(0, 30)}...</text>
        <text fg={COLORS.dimText}>m - {t("action.send_message", lang).slice(0, 30)}...</text>
        <text fg={COLORS.dimText}>x - {t("action.execute_command", lang).slice(0, 30)}...</text>
        <text fg={COLORS.dimText}>t - {t("action.show_todos", lang).slice(0, 30)}...</text>
        <text fg={COLORS.dimText}>a - {t("action.list_agents", lang)}</text>
      </box>

      <box marginTop={1}>
        <text fg={COLORS.neonGreen}>{t("help.close", lang)}</text>
      </box>
    </box>
  );
}
