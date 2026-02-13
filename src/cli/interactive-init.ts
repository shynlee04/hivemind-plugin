/**
 * HiveMind Interactive Init — Guided setup wizard using @clack/prompts.
 *
 * When `npx hivemind init` is run without flags, this wizard guides users
 * through governance mode, language, automation level, expert level, and
 * output style — making the configuration discoverable and coherent.
 */

import * as p from "@clack/prompts"
import type { InitOptions } from "./init.js"
import type {
  GovernanceMode,
  Language,
  AutomationLevel,
  ExpertLevel,
  OutputStyle,
} from "../schemas/config.js"

const PROMPTS = {
  en: {
    intro: "🐝 HiveMind Context Governance — Setup Wizard",
    cancel: "Setup cancelled.",
    governance: {
      message: "Governance mode — how strict should session enforcement be?",
      assisted: { label: "Assisted (recommended)", hint: "Session starts OPEN. Warns on drift but never blocks." },
      strict: { label: "Strict", hint: "Session starts LOCKED. Must declare_intent before writing." },
      permissive: { label: "Permissive", hint: "Always OPEN. Silent tracking only, zero pressure." }
    },
    automation: {
      message: "Automation level — how much should HiveMind intervene?",
      manual: { label: "Manual", hint: "Minimal automation. You drive everything." },
      guided: { label: "Guided", hint: "Gentle nudges when drift detected." },
      assisted: { label: "Assisted (recommended)", hint: "Active guidance with evidence-based warnings." },
      full: { label: "Full", hint: "Maximum governance. System argues back with evidence when claims lack proof." },
      retard: { label: '"I am retard — lead me"', hint: "Forces strict mode, skeptical review, code review required. Maximum handholding." }
    },
    expert: {
      message: "Your expertise level — affects response depth and assumptions?",
      beginner: { label: "Beginner", hint: "Explain everything, assume little prior knowledge." },
      intermediate: { label: "Intermediate (recommended)", hint: "Standard technical depth, balanced explanations." },
      advanced: { label: "Advanced", hint: "Skip basics, focus on implementation details." },
      expert: { label: "Expert", hint: "Minimal explanation, code-first, challenge my assumptions." }
    },
    style: {
      message: "Output style — how should the agent format responses?",
      explanatory: { label: "Explanatory (recommended)", hint: "Detailed explanations with reasoning." },
      outline: { label: "Outline", hint: "Bullet points and structured summaries." },
      skeptical: { label: "Skeptical", hint: "Critical review, challenge assumptions." },
      architecture: { label: "Architecture", hint: "Focus on design patterns and structure." },
      minimal: { label: "Minimal", hint: "Brief, code-only responses." }
    },
    extras: {
      message: "Additional constraints (optional, press Enter to skip):",
      code_review: { label: "Require code review", hint: "Agent must review code before accepting." },
      tdd: { label: "Enforce TDD", hint: "Write failing test first, then implementation." }
    },
    summary: {
      title: "Configuration Summary",
      governance: "Governance",
      language: "Language",
      automation: "Automation",
      expert: "Expert",
      style: "Style",
      code_review: "Code review required",
      tdd: "TDD enforced",
      proceed: "Proceed with this configuration?",
      initializing: "Initializing HiveMind..."
    }
  },
  vi: {
    intro: "🐝 HiveMind Context Governance — Trình Cài Đặt",
    cancel: "Đã hủy cài đặt.",
    governance: {
      message: "Chế độ quản trị — mức độ nghiêm ngặt?",
      assisted: { label: "Hỗ trợ (khuyên dùng)", hint: "Session MỞ. Cảnh báo khi lạc đề nhưng không chặn." },
      strict: { label: "Nghiêm ngặt", hint: "Session KHÓA. Phải khai báo (declare_intent) trước khi viết code." },
      permissive: { label: "Tự do", hint: "Luôn MỞ. Chỉ theo dõi âm thầm, không can thiệp." }
    },
    automation: {
      message: "Mức độ tự động hóa — HiveMind can thiệp bao nhiêu?",
      manual: { label: "Thủ công", hint: "Tự động tối thiểu. Bạn kiểm soát mọi thứ." },
      guided: { label: "Chỉ dẫn", hint: "Nhắc nhở nhẹ nhàng khi phát hiện lạc đề." },
      assisted: { label: "Hỗ trợ (khuyên dùng)", hint: "Chỉ dẫn chủ động với cảnh báo dựa trên bằng chứng." },
      full: { label: "Đầy đủ", hint: "Quản trị tối đa. Hệ thống tranh luận lại nếu thiếu bằng chứng." },
      retard: { label: '"Tôi là gà mờ — hãy dẫn dắt tôi"', hint: "Bắt buộc chế độ nghiêm ngặt, hoài nghi, review code. Cầm tay chỉ việc." }
    },
    expert: {
      message: "Trình độ chuyên môn của bạn — ảnh hưởng độ sâu phản hồi?",
      beginner: { label: "Người mới", hint: "Giải thích mọi thứ, giả định chưa biết gì." },
      intermediate: { label: "Trung cấp (khuyên dùng)", hint: "Độ sâu kỹ thuật chuẩn, giải thích cân bằng." },
      advanced: { label: "Nâng cao", hint: "Bỏ qua cơ bản, tập trung vào chi tiết triển khai." },
      expert: { label: "Chuyên gia", hint: "Giải thích tối thiểu, ưu tiên code, thách thức giả định." }
    },
    style: {
      message: "Phong cách đầu ra — agent nên định dạng phản hồi thế nào?",
      explanatory: { label: "Giải thích (khuyên dùng)", hint: "Giải thích chi tiết kèm lý luận." },
      outline: { label: "Dàn ý", hint: "Gạch đầu dòng và tóm tắt có cấu trúc." },
      skeptical: { label: "Hoài nghi", hint: "Đánh giá phản biện, thách thức giả định." },
      architecture: { label: "Kiến trúc", hint: "Tập trung vào mẫu thiết kế và cấu trúc." },
      minimal: { label: "Tối giản", hint: "Ngắn gọn, chỉ đưa code." }
    },
    extras: {
      message: "Ràng buộc bổ sung (tùy chọn, nhấn Enter để bỏ qua):",
      code_review: { label: "Yêu cầu review code", hint: "Agent phải review code trước khi chấp nhận." },
      tdd: { label: "Bắt buộc TDD", hint: "Viết test fail trước, sau đó mới implement." }
    },
    summary: {
      title: "Tóm Tắt Cấu Hình",
      governance: "Quản trị",
      language: "Ngôn ngữ",
      automation: "Tự động hóa",
      expert: "Trình độ",
      style: "Phong cách",
      code_review: "Yêu cầu review code",
      tdd: "Bắt buộc TDD",
      proceed: "Tiến hành với cấu hình này?",
      initializing: "Đang khởi tạo HiveMind..."
    }
  }
}

/**
 * Run the interactive init wizard.
 * Returns InitOptions populated from user choices.
 * Returns null if user cancels.
 */
export async function runInteractiveInit(): Promise<InitOptions | null> {
  // Always start with language selection (hardcoded bilingual prompt)
  const language = await p.select({
    message: "Language / Ngôn ngữ?",
    options: [
      { value: "en" as Language, label: "English" },
      { value: "vi" as Language, label: "Tiếng Việt" },
    ],
  })

  if (p.isCancel(language)) {
    p.cancel("Cancelled.")
    return null
  }

  // Select strings based on language
  const T = PROMPTS[language as "en" | "vi"]

  p.intro(T.intro)

  const governanceMode = await p.select({
    message: T.governance.message,
    options: [
      {
        value: "assisted" as GovernanceMode,
        label: T.governance.assisted.label,
        hint: T.governance.assisted.hint,
      },
      {
        value: "strict" as GovernanceMode,
        label: T.governance.strict.label,
        hint: T.governance.strict.hint,
      },
      {
        value: "permissive" as GovernanceMode,
        label: T.governance.permissive.label,
        hint: T.governance.permissive.hint,
      },
    ],
  })

  if (p.isCancel(governanceMode)) {
    p.cancel(T.cancel)
    return null
  }

  const automationLevel = await p.select({
    message: T.automation.message,
    options: [
      {
        value: "manual" as AutomationLevel,
        label: T.automation.manual.label,
        hint: T.automation.manual.hint,
      },
      {
        value: "guided" as AutomationLevel,
        label: T.automation.guided.label,
        hint: T.automation.guided.hint,
      },
      {
        value: "assisted" as AutomationLevel,
        label: T.automation.assisted.label,
        hint: T.automation.assisted.hint,
      },
      {
        value: "full" as AutomationLevel,
        label: T.automation.full.label,
        hint: T.automation.full.hint,
      },
      {
        value: "retard" as AutomationLevel,
        label: T.automation.retard.label,
        hint: T.automation.retard.hint,
      },
    ],
  })

  if (p.isCancel(automationLevel)) {
    p.cancel(T.cancel)
    return null
  }

  // Skip expert/style for retard mode (auto-set)
  let expertLevel: ExpertLevel = "intermediate"
  let outputStyle: OutputStyle = "explanatory"
  let requireCodeReview = false
  let enforceTdd = false

  if (automationLevel !== "retard") {
    const expert = await p.select({
      message: T.expert.message,
      options: [
        {
          value: "beginner" as ExpertLevel,
          label: T.expert.beginner.label,
          hint: T.expert.beginner.hint,
        },
        {
          value: "intermediate" as ExpertLevel,
          label: T.expert.intermediate.label,
          hint: T.expert.intermediate.hint,
        },
        {
          value: "advanced" as ExpertLevel,
          label: T.expert.advanced.label,
          hint: T.expert.advanced.hint,
        },
        {
          value: "expert" as ExpertLevel,
          label: T.expert.expert.label,
          hint: T.expert.expert.hint,
        },
      ],
    })

    if (p.isCancel(expert)) {
      p.cancel(T.cancel)
      return null
    }
    expertLevel = expert

    const style = await p.select({
      message: T.style.message,
      options: [
        {
          value: "explanatory" as OutputStyle,
          label: T.style.explanatory.label,
          hint: T.style.explanatory.hint,
        },
        {
          value: "outline" as OutputStyle,
          label: T.style.outline.label,
          hint: T.style.outline.hint,
        },
        {
          value: "skeptical" as OutputStyle,
          label: T.style.skeptical.label,
          hint: T.style.skeptical.hint,
        },
        {
          value: "architecture" as OutputStyle,
          label: T.style.architecture.label,
          hint: T.style.architecture.hint,
        },
        {
          value: "minimal" as OutputStyle,
          label: T.style.minimal.label,
          hint: T.style.minimal.hint,
        },
      ],
    })

    if (p.isCancel(style)) {
      p.cancel(T.cancel)
      return null
    }
    outputStyle = style

    const extras = await p.multiselect({
      message: T.extras.message,
      options: [
        {
          value: "code-review" as string,
          label: T.extras.code_review.label,
          hint: T.extras.code_review.hint,
        },
        {
          value: "tdd" as string,
          label: T.extras.tdd.label,
          hint: T.extras.tdd.hint,
        },
      ],
      required: false,
    })

    if (!p.isCancel(extras)) {
      requireCodeReview = extras.includes("code-review")
      enforceTdd = extras.includes("tdd")
    }
  }

  // Summary
  const forcedModeText = automationLevel === "retard"
    ? (language === "en" ? "strict (forced)" : "nghiêm ngặt (bắt buộc)")
    : governanceMode

  const automationText = `${automationLevel}${automationLevel === "retard" ? (language === "en" ? ' ("I am retard — lead me")' : ' ("Tôi là gà mờ — hãy dẫn dắt tôi")') : ""}`

  const expertText = automationLevel === "retard"
    ? (language === "en" ? "beginner (forced)" : "người mới (bắt buộc)")
    : expertLevel

  const styleText = automationLevel === "retard"
    ? (language === "en" ? "skeptical (forced)" : "hoài nghi (bắt buộc)")
    : outputStyle

  p.note(
    [
      `${T.summary.governance}:  ${forcedModeText}`,
      `${T.summary.language}:    ${language === "en" ? "English" : "Tiếng Việt"}`,
      `${T.summary.automation}:  ${automationText}`,
      `${T.summary.expert}:      ${expertText}`,
      `${T.summary.style}:       ${styleText}`,
      requireCodeReview || automationLevel === "retard" ? `✓ ${T.summary.code_review}` : "",
      enforceTdd ? `✓ ${T.summary.tdd}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    T.summary.title
  )

  const shouldProceed = await p.confirm({
    message: T.summary.proceed,
  })

  if (p.isCancel(shouldProceed) || !shouldProceed) {
    p.cancel(T.cancel)
    return null
  }

  p.outro(T.summary.initializing)

  return {
    governanceMode: automationLevel === "retard" ? "strict" : governanceMode,
    language: language as Language,
    automationLevel,
    expertLevel: automationLevel === "retard" ? "beginner" : expertLevel,
    outputStyle: automationLevel === "retard" ? "skeptical" : outputStyle,
    requireCodeReview: requireCodeReview || automationLevel === "retard",
    enforceTdd,
  }
}
