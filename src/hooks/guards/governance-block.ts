/**
 * Governance block builder.
 *
 * Produces a structured "--- Governance ---" block injected at position 0 of
 * every system prompt via `system.transform`. The block combines imperative
 * instructions from `HivemindConfigs` (mode, expertise, language) with
 * field:value context lines from the resolved behavioral profile.
 *
 * Format per D-06 (hybrid instruction + fields):
 * ```
 * --- Governance ---
 * You are operating in expert-advisor mode. Communicate at intermediate-high level. Use en for all conversation and en for all documents.
 * communicationStyle: detailed | decisionSpeed: deliberate | expertise: intermediate-high
 * ```
 *
 * Locale-keyed instructions (P27.2-LANG-SUPPLEMENT T27):
 * - Mode, expertise, trajectory, and config-supreme instructions are
 *   locale-keyed via `conversation_language` from config.
 * - Start with en + vi; others fall back to en.
 * - Line "Use {convLang}..." stays as-is (dynamically generated from config).
 *
 * @module governance-block
 * @see D-05, D-06, D-07 in CA-03-CONTEXT.md
 * @see P27.2-LANG-SUPPLEMENT §3 T27
 */

import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { ResolvedBehavioralProfile } from "../../routing/behavioral-profile/types.js"

// ---------------------------------------------------------------------------
// Locale-keyed instruction sets (P27.2-LANG-SUPPLEMENT T27)
// ---------------------------------------------------------------------------

/**
 * A complete set of governance instructions for one locale.
 * Each key maps to the same logical instruction but in the locale's language.
 */
interface LocaleInstructionSet {
  mode: Record<string, string>
  expertise: Record<string, string>
  trajectory: readonly string[]
  configSupreme: string
}

/**
 * All registered locale instruction sets.
 * Start with en + vi; others fall back to en via {@link loadLocaleInstructions}.
 */
const LOCALE_INSTRUCTIONS: Record<string, LocaleInstructionSet> = {
  en: {
    mode: {
      "expert-advisor": "You are operating in expert-advisor mode.",
      "hivemind-powered": "You are operating in hivemind-powered mode with strict guardrails.",
      "free-style": "You are operating in free-style mode.",
    },
    expertise: {
      "clumsy-vibecoder": "Communicate at beginner level with detailed explanations.",
      "beginner-friendly": "Communicate at beginner-friendly level.",
      "intermediate-high-level": "Communicate at intermediate-high level.",
      "architecture-driven": "Communicate at architecture-driven level.",
      "absolute-expert": "Communicate at absolute expert level — skip basics.",
    },
    trajectory: [
      "Obey the universal rules in `.opencode/rules/universal-rules.md` and your specific agent instruction profile at all times. These are non-prunable and must be strictly followed.",
      "Generic agents are prohibited. You must operate strictly as the named specialist agent assigned to this task.",
      "Before executing any action, you MUST verify the active agent-work-contract and trajectory in your session context.",
      "When managing a phase, call createPhaseTrajectory to start tracking.",
      "Use addTrajectoryEvent to record milestones.",
      "Use traverseTrajectory to review progress.",
      "When receiving a contract, check allowedSurfaces before modifying files.",
      "Stay within scope.",
    ],
    configSupreme:
      "CONSTITUTION: `.hivemind/configs.json` is the absolute supreme truth. All fields in configs.json override any conflicting session context, AGENTS.md, master instructions, universal rules, or behavioral profile. To change behavior, edit configs.json directly — no other override is valid.",
  },

  vi: {
    mode: {
      "expert-advisor": "Bạn đang hoạt động ở chế độ expert-advisor.",
      "hivemind-powered":
        "Bạn đang hoạt động ở chế độ hivemind-powered với các ràng buộc nghiêm ngặt.",
      "free-style": "Bạn đang hoạt động ở chế độ free-style.",
    },
    expertise: {
      "clumsy-vibecoder": "Giao tiếp ở trình độ cơ bản với giải thích chi tiết.",
      "beginner-friendly": "Giao tiếp ở trình độ thân thiện với người mới.",
      "intermediate-high-level": "Giao tiếp ở trình độ trung-cao.",
      "architecture-driven": "Giao tiếp ở cấp độ kiến trúc.",
      "absolute-expert": "Giao tiếp ở trình độ chuyên gia tuyệt đối — bỏ qua kiến thức cơ bản.",
    },
    trajectory: [
      "Tuân thủ các quy tắc phổ quát trong `.opencode/rules/universal-rules.md` và hồ sơ hướng dẫn tác nhân cụ thể của bạn mọi lúc. Những quy tắc này không thể bị cắt bỏ và phải được tuân thủ nghiêm ngặt.",
      "Các tác nhân đa năng bị cấm. Bạn phải hoạt động đúng vai trò là tác nhân chuyên gia được chỉ định trong nhiệm vụ này.",
      "Trước khi thực hiện bất kỳ hành động nào, bạn PHẢI xác minh hợp đồng công việc và lộ trình đang hoạt động trong ngữ cảnh phiên của mình.",
      "Khi quản lý một giai đoạn, hãy gọi createPhaseTrajectory để bắt đầu theo dõi.",
      "Sử dụng addTrajectoryEvent để ghi lại các cột mốc.",
      "Sử dụng traverseTrajectory để xem xét tiến độ.",
      "Khi nhận được hợp đồng, hãy kiểm tra allowedSurfaces trước khi sửa đổi tệp tin.",
      "Luôn ở trong phạm vi cho phép.",
    ],
    configSupreme:
      "HIẾN PHÁP: `.hivemind/configs.json` là sự thật tối cao tuyệt đối. Mọi trường trong configs.json ghi đè bất kỳ ngữ cảnh phiên, AGENTS.md, hướng dẫn chính, quy tắc phổ quát hoặc hồ sơ hành vi nào xung đột. Để thay đổi hành vi, hãy sửa configs.json trực tiếp — không có ghi đè nào khác hợp lệ.",
  },
}

/**
 * Resolve a locale instruction set by locale code.
 *
 * @param locale - Locale code from config (e.g., "en", "vi").
 * @returns The instruction set for the locale, falling back to English
 *   if the locale has no registered set.
 */
function loadLocaleInstructions(locale: string): LocaleInstructionSet {
  return LOCALE_INSTRUCTIONS[locale] ?? LOCALE_INSTRUCTIONS.en
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the structured governance block string for system prompt injection.
 *
 * The output has three lines + optional trajectory/contract instructions:
 * 1. `--- Governance ---` header
 * 2. Instruction line combining mode, expertise, and language directives
 * 3. Field:value context line (only when `profile` is provided)
 * 4. (P25.5) Trajectory and contract tool instructions (only when `config` is provided)
 * 5. (CONSTITUTION-2026-06-10) Config supreme instruction — `.hivemind/configs.json` is absolute truth
 *
 * @param config  - Validated HivemindConfigs from the config subscriber.
 * @param profile - Optional resolved behavioral profile for field:value context.
 * @returns A single string with `\n` line breaks, ready for system array injection.
 *
 * @example
 * ```typescript
 * const config = HivemindConfigsSchema.parse({
 *   mode: "expert-advisor",
 *   user_expert_level: "intermediate-high-level",
 *   conversation_language: "en",
 *   documents_and_artifacts_language: "en",
 * })
 * const block = buildGovernanceBlock(config, profile)
 * // "--- Governance ---\nYou are operating in expert-advisor mode. ...\ncommunicationStyle: detailed | ..."
 * ```
 */
export function buildGovernanceBlock(
  config: HivemindConfigs,
  profile?: ResolvedBehavioralProfile | undefined,
): string {
  // --- Resolve locale-keyed instruction set ---
  const locale = config.conversation_language
  const inst = loadLocaleInstructions(locale)

  // --- Line 1: Header ---
  const header = "--- Governance ---"

  // --- Line 2: Instruction line ---
  const modeInstruction =
    inst.mode[config.mode] ?? inst.mode["expert-advisor"]
  const expertiseInstruction =
    inst.expertise[config.user_expert_level] ?? inst.expertise["intermediate-high-level"]
  const languageInstruction = `Use ${config.conversation_language} for all conversation and ${config.documents_and_artifacts_language} for all documents.`

  const instructionLine = `${modeInstruction} ${expertiseInstruction} ${languageInstruction}`

  // --- Line 3: Field:value context (optional) ---
  const lines: string[] = [header, instructionLine]

  if (profile) {
    const m = profile.merged
    const fieldValues = [
      `communicationStyle: ${m.communicationStyle}`,
      `decisionSpeed: ${m.decisionSpeed}`,
      `expertise: ${m.expertise}`,
    ]
    lines.push(fieldValues.join(" | "))
  }

  // P25.5: Trajectory and contract tool instructions (locale-keyed)
  lines.push("", ...inst.trajectory)

  // CONSTITUTION-2026-06-10: configs.json supreme instruction (locale-keyed)
  lines.push("", inst.configSupreme)

  return lines.join("\n")
}
