/**
 * Locale-keyed error message templates for IntentLockBlockedError
 * (P27.2-LANG-SUPPLEMENT T23).
 *
 * Each entry maps a state name to the 4-field error pattern:
 * [stateDescription, reasonTemplate, fixSteps, hint]
 * where fixSteps is a newline-separated enumerated string.
 */

export interface LocaleErrorTemplate {
  state: string
  reason: string
  fix: string
  hint: string
}

export type ErrorTemplateMap = Record<string, LocaleErrorTemplate>

/**
 * English error message templates (default).
 */
export const en: ErrorTemplateMap = {
  UNLOCKED: {
    state: "UNLOCKED — No intent declared for this session.",
    reason: "The gate is active but no intent has been declared yet. Declare an intent to proceed with code changes.",
    fix:
      "1. Declare intent via hm-spec-phase command.\n" +
      "2. Wait for the intent classification to complete.\n" +
      "3. Confirm the classified intent at the C1.3 checkpoint.",
    hint: "Run hm-spec-phase to declare your intent.",
  },
  LOCKED_CODE_CHANGE: {
    state: "LOCKED_CODE_CHANGE — Intent declared, awaiting phase authorization.",
    reason: "A code-change intent is locked. Provide landscape evidence and phase readiness artifacts to advance to PHASE_READY.",
    fix:
      "1. Commit landscape artifact.\n" +
      "2. Ensure ROADMAP.md and STATE.md are synced.\n" +
      "3. Call hm-intent-checkpoint with action='submit' to provide checkpoint evidence.",
    hint: "Commit landscape and sync planning docs, then call hm-intent-checkpoint.",
  },
  PHASE_READY: {
    state: "PHASE_READY — Landscape committed, awaiting phase authorization.",
    reason: "The phase landscape is committed but phase authorization has not been confirmed yet.",
    fix:
      "1. Verify ROADMAP.md has the target phase entry.\n" +
      "2. Verify STATE.md reflects the active phase.\n" +
      "3. Call hm-intent-checkpoint with action='submit' to provide checkpoint evidence.",
    hint: "Sync planning documents and submit checkpoint evidence.",
  },
  PHASE_AUTHORIZED: {
    state: "PHASE_AUTHORIZED — Phase authorized, awaiting execution confirmation.",
    reason: "The phase is authorized but execution has not been confirmed yet.",
    fix:
      "1. Commit phase manifest artifact.\n" +
      "2. Verify manifest references correct phase and dependencies.\n" +
      "3. Call hm-intent-checkpoint with action='submit' to provide checkpoint evidence.",
    hint: "Commit phase manifest and submit checkpoint evidence.",
  },
  EXECUTING: {
    state: "EXECUTING — Execution in progress, must gather verification evidence.",
    reason: "Code changes are in progress. Gather verification evidence before transitioning to VERIFYING/COMPLETED.",
    fix:
      "1. Run the test suite (npm test).\n" +
      "2. Collect verification artifacts.\n" +
      "3. Call hm-intent-checkpoint with action='confirm' for user confirmation at critical transitions.",
    hint: "Run tests and collect verification artifacts, then call hm-intent-checkpoint.",
  },
}

/**
 * Vietnamese error message templates.
 */
export const vi: ErrorTemplateMap = {
  UNLOCKED: {
    state: "UNLOCKED — Chưa khai báo ý định cho phiên này.",
    reason: "Cổng đang hoạt động nhưng chưa có ý định nào được khai báo. Hãy khai báo ý định để tiến hành thay đổi mã.",
    fix:
      "1. Khai báo ý định qua lệnh hm-spec-phase.\n" +
      "2. Chờ phân loại ý định hoàn tất.\n" +
      "3. Xác nhận ý định đã phân loại tại điểm kiểm tra C1.3.",
    hint: "Chạy hm-spec-phase để khai báo ý định.",
  },
  LOCKED_CODE_CHANGE: {
    state: "LOCKED_CODE_CHANGE — Đã khai báo ý định, đang chờ ủy quyền giai đoạn.",
    reason: "Ý định thay đổi mã đã được khóa. Cung cấp bằng chứng landscape và các tạo phẩm sẵn sàng của giai đoạn để tiến tới PHASE_READY.",
    fix:
      "1. Cam kết tạo phẩm landscape.\n" +
      "2. Đảm bảo ROADMAP.md và STATE.md đã được đồng bộ.\n" +
      "3. Gọi hm-intent-checkpoint với action='submit' để cung cấp bằng chứng.",
    hint: "Cam kết landscape và đồng bộ tài liệu kế hoạch, sau đó gọi hm-intent-checkpoint.",
  },
  PHASE_READY: {
    state: "PHASE_READY — Landscape đã cam kết, đang chờ ủy quyền giai đoạn.",
    reason: "Landscape giai đoạn đã được cam kết nhưng ủy quyền giai đoạn chưa được xác nhận.",
    fix:
      "1. Xác minh ROADMAP.md có mục giai đoạn mục tiêu.\n" +
      "2. Xác minh STATE.md phản ánh đúng giai đoạn đang hoạt động.\n" +
      "3. Gọi hm-intent-checkpoint với action='submit' để cung cấp bằng chứng.",
    hint: "Đồng bộ tài liệu kế hoạch và gửi bằng chứng điểm kiểm tra.",
  },
  PHASE_AUTHORIZED: {
    state: "PHASE_AUTHORIZED — Giai đoạn đã được ủy quyền, đang chờ xác nhận thực thi.",
    reason: "Giai đoạn đã được ủy quyền nhưng chưa được xác nhận thực thi.",
    fix:
      "1. Cam kết tạo phẩm manifest giai đoạn.\n" +
      "2. Xác minh manifest tham chiếu đúng giai đoạn và phụ thuộc.\n" +
      "3. Gọi hm-intent-checkpoint với action='submit' để cung cấp bằng chứng.",
    hint: "Cam kết manifest giai đoạn và gửi bằng chứng điểm kiểm tra.",
  },
  EXECUTING: {
    state: "EXECUTING — Đang thực thi, phải thu thập bằng chứng xác minh.",
    reason: "Đang tiến hành thay đổi mã. Thu thập bằng chứng xác minh trước khi chuyển sang VERIFYING/COMPLETED.",
    fix:
      "1. Chạy bộ kiểm thử (npm test).\n" +
      "2. Thu thập các tạo phẩm xác minh.\n" +
      "3. Gọi hm-intent-checkpoint với action='confirm' để xác nhận người dùng tại các chuyển tiếp quan trọng.",
    hint: "Chạy kiểm thử và thu thập tạo phẩm xác minh, sau đó gọi hm-intent-checkpoint.",
  },
}
