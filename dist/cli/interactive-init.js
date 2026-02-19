/**
 * HiveMind Interactive Init — Guided setup wizard using @clack/prompts.
 *
 * When `npx hivemind init` is run without flags, this wizard guides users
 * through governance mode, language, automation level, expert level, and
 * output style — making the configuration discoverable and coherent.
 */
import * as p from "@clack/prompts";
import { PROFILE_PRESETS, isCoachAutomation, normalizeAutomationLabel, } from "../schemas/config.js";
export const ASSET_TARGET_LABELS = {
    project: "Project only (.opencode/ in this project)",
    global: "Global only (~/.config/opencode/)",
    both: "Both project and global",
};
/**
 * Run the interactive init wizard.
 * Returns InitOptions populated from user choices.
 * Returns null if user cancels.
 */
export async function runInteractiveInit() {
    p.intro("🐝 HiveMind + HiveFiver v2 — Setup Wizard");
    // ── Profile Selection - FIRST ───────────────────────────────
    const profileKey = await p.select({
        message: "What kind of developer are you?",
        options: [
            {
                value: "beginner",
                label: "Beginner",
                hint: "Learning with AI. Maximum guidance, asks before acting.",
            },
            {
                value: "intermediate",
                label: "Intermediate (recommended)",
                hint: "Comfortable with AI tools. Balanced automation.",
            },
            {
                value: "advanced",
                label: "Advanced",
                hint: "Experienced. Permissive, outline responses, full control.",
            },
            {
                value: "expert",
                label: "Expert",
                hint: "Senior developer. Minimal guidance, terse responses.",
            },
            {
                value: "coach",
                label: "Coach (max guidance)",
                hint: "Strict governance, skeptical, asks everything.",
            },
        ],
    });
    if (p.isCancel(profileKey)) {
        p.cancel("Setup cancelled.");
        return null;
    }
    const selectedProfile = PROFILE_PRESETS[profileKey];
    // ── Governance Mode - with profile default ────────────────────
    const governanceMode = await p.select({
        message: "Governance mode — how strict should session enforcement be?",
        initialValue: selectedProfile.governance_mode,
        options: [
            {
                value: "assisted",
                label: "Assisted (recommended)",
                hint: "Session starts OPEN. Warns on drift but never blocks.",
            },
            {
                value: "strict",
                label: "Strict",
                hint: "Session starts LOCKED. Must declare_intent before writing.",
            },
            {
                value: "permissive",
                label: "Permissive",
                hint: "Always OPEN. Silent tracking only, zero pressure.",
            },
        ],
    });
    if (p.isCancel(governanceMode)) {
        p.cancel("Setup cancelled.");
        return null;
    }
    const language = await p.select({
        message: "Language for agent responses?",
        options: [
            { value: "en", label: "English" },
            { value: "vi", label: "Tiếng Việt" },
        ],
    });
    if (p.isCancel(language)) {
        p.cancel("Setup cancelled.");
        return null;
    }
    const automationLevel = await p.select({
        message: "Automation level — how much should HiveMind intervene?",
        initialValue: selectedProfile.automation_level,
        options: [
            {
                value: "manual",
                label: "Manual",
                hint: "Minimal automation. You drive everything.",
            },
            {
                value: "guided",
                label: "Guided",
                hint: "Gentle nudges when drift detected.",
            },
            {
                value: "assisted",
                label: "Assisted (recommended)",
                hint: "Active guidance with evidence-based warnings.",
            },
            {
                value: "full",
                label: "Full",
                hint: "Maximum governance. System argues back with evidence when claims lack proof.",
            },
            {
                value: "coach",
                label: "Coach (max guidance)",
                hint: "Forces strict mode, skeptical review, code review required. Maximum guidance.",
            },
        ],
    });
    if (p.isCancel(automationLevel)) {
        p.cancel("Setup cancelled.");
        return null;
    }
    // Skip expert/style for coach mode (auto-set)
    // Use profile defaults as initial values
    let expertLevel = selectedProfile.expert_level;
    let outputStyle = selectedProfile.output_style;
    let requireCodeReview = selectedProfile.require_code_review;
    let enforceTdd = selectedProfile.enforce_tdd;
    if (!isCoachAutomation(automationLevel)) {
        const expert = await p.select({
            message: "Your expertise level — affects response depth and assumptions?",
            initialValue: selectedProfile.expert_level,
            options: [
                {
                    value: "beginner",
                    label: "Beginner",
                    hint: "Explain everything, assume little prior knowledge.",
                },
                {
                    value: "intermediate",
                    label: "Intermediate (recommended)",
                    hint: "Standard technical depth, balanced explanations.",
                },
                {
                    value: "advanced",
                    label: "Advanced",
                    hint: "Skip basics, focus on implementation details.",
                },
                {
                    value: "expert",
                    label: "Expert",
                    hint: "Minimal explanation, code-first, challenge my assumptions.",
                },
            ],
        });
        if (p.isCancel(expert)) {
            p.cancel("Setup cancelled.");
            return null;
        }
        expertLevel = expert;
        const style = await p.select({
            message: "Output style — how should the agent format responses?",
            initialValue: selectedProfile.output_style,
            options: [
                {
                    value: "explanatory",
                    label: "Explanatory (recommended)",
                    hint: "Detailed explanations with reasoning.",
                },
                {
                    value: "outline",
                    label: "Outline",
                    hint: "Bullet points and structured summaries.",
                },
                {
                    value: "skeptical",
                    label: "Skeptical",
                    hint: "Critical review, challenge assumptions.",
                },
                {
                    value: "architecture",
                    label: "Architecture",
                    hint: "Focus on design patterns and structure.",
                },
                {
                    value: "minimal",
                    label: "Minimal",
                    hint: "Brief, code-only responses.",
                },
            ],
        });
        if (p.isCancel(style)) {
            p.cancel("Setup cancelled.");
            return null;
        }
        outputStyle = style;
        const extras = await p.multiselect({
            message: "Additional constraints (optional, press Enter to skip):",
            initialValues: [
                ...(selectedProfile.require_code_review ? ["code-review"] : []),
                ...(selectedProfile.enforce_tdd ? ["tdd"] : []),
            ],
            options: [
                {
                    value: "code-review",
                    label: "Require code review",
                    hint: "Agent must review code before accepting.",
                },
                {
                    value: "tdd",
                    label: "Enforce TDD",
                    hint: "Write failing test first, then implementation.",
                },
            ],
            required: false,
        });
        if (!p.isCancel(extras)) {
            requireCodeReview = extras.includes("code-review");
            enforceTdd = extras.includes("tdd");
        }
    }
    // Init is intentionally project-local to avoid global drift.
    const syncTarget = "project";
    // Summary
    p.note([
        `Profile:     ${selectedProfile.label}`,
        `Governance:  ${isCoachAutomation(automationLevel) ? "strict (forced)" : governanceMode}`,
        `Language:    ${language === "en" ? "English" : "Tiếng Việt"}`,
        `Automation:  ${normalizeAutomationLabel(automationLevel)}${isCoachAutomation(automationLevel) ? " (max guidance)" : ""}`,
        "HiveFiver:   v2 root command enabled (`/hivefiver <action>`)",
        "MCP posture: DeepWiki on by default, Context7/Tavily/Repomix/Exa guided setup",
        `Expert:      ${isCoachAutomation(automationLevel) ? "beginner (forced)" : expertLevel}`,
        `Style:       ${isCoachAutomation(automationLevel) ? "skeptical (forced)" : outputStyle}`,
        `Permissions: ${JSON.stringify(selectedProfile.permissions)}`,
        `Target:      ${ASSET_TARGET_LABELS[syncTarget]}`,
        requireCodeReview || isCoachAutomation(automationLevel) ? `✓ Code review required` : "",
        enforceTdd ? `✓ TDD enforced` : "",
    ]
        .filter(Boolean)
        .join("\n"), "Configuration Summary");
    const shouldProceed = await p.confirm({
        message: "Proceed with this configuration?",
    });
    if (p.isCancel(shouldProceed) || !shouldProceed) {
        p.cancel("Setup cancelled.");
        return null;
    }
    p.outro("Initializing HiveMind...");
    return {
        governanceMode: isCoachAutomation(automationLevel) ? "strict" : governanceMode,
        language,
        automationLevel,
        expertLevel: isCoachAutomation(automationLevel) ? "beginner" : expertLevel,
        outputStyle: isCoachAutomation(automationLevel) ? "skeptical" : outputStyle,
        requireCodeReview: requireCodeReview || isCoachAutomation(automationLevel),
        enforceTdd,
        syncTarget,
        profile: profileKey,
    };
}
//# sourceMappingURL=interactive-init.js.map