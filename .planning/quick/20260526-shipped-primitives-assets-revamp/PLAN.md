---
phase: quick-assets-revamp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/bootstrap/structure.ts
  - src/tools/config/bootstrap-init.ts
  - src/tools/config/bootstrap-recover.ts
  - src/cli/commands/doctor.ts
  - src/schema-kernel/bootstrap.schema.ts
  - package.json
  - tests/tools/bootstrap-init.test.ts
  - tests/tools/bootstrap-recover.test.ts
  - tests/cli/commands/init.test.ts
  - tests/cli/commands/doctor.test.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "All shipped-with primitives are copied directly to .opencode/ as real files/directories instead of symlinks"
    - "Primitive installation supports both singular and plural directory forms (agent/agents, command/commands, skill/skills)"
    - "Only registered primitives are overwritten during bootstrap/rebuild, leaving end-user custom primitives untouched"
    - "Shipped primitives are copied/integrated from assets/ subdirectories in the package root"
---

<objective>
Tháo gỡ hoàn toàn cơ chế symlink của các primitives trong OpenCode, chuyển nguồn dữ liệu primitives về thư mục `assets/` ở root của dự án, và cập nhật luồng cài đặt/phục hồi/kiểm tra (bootstrap-init, bootstrap-recover, doctor) để sao chép trực tiếp các tệp/thư mục thay vì tạo liên kết tượng trưng (symlinks). Đồng thời, hỗ trợ nhận diện động cả thư mục dạng số ít và số nhiều (agent/agents, command/commands, skill/skills) ở `.opencode/` phía client-side và bảo vệ các primitives tùy chỉnh của người dùng cuối. Archive toàn bộ các agent thuộc hm-l1/l2/l3.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
- **Thực trạng**: Hiện tại, các primitives của Hivemind được symlink từ `.hivefiver-meta-builder/...` sang `.opencode/`. Trong sản phẩm thực tế phân phối qua npm, `.hivefiver-meta-builder` không tồn tại, khiến việc cài đặt lỗi hoặc không đúng thiết kế. Các primitives đi kèm cần nằm trong `assets/` và được copy trực tiếp vào `.opencode/` của người dùng.
- **Yêu cầu của người dùng**:
  1. Loại bỏ symlink, copy trực tiếp tệp/thư mục.
  2. Nguồn chứa primitives đi kèm sản phẩm (shipped-with) chuyển về `assets/agents`, `assets/skills`, `assets/commands`.
  3. Cài đặt động: nếu thư mục số ít (agent, command, skill) tồn tại thì ghi vào đó, nếu không thì ghi vào số nhiều (agents, commands, skills).
  4. Cơ chế ghi đè độc lập: ghi đè *chỉ* các tệp được đăng ký (shipped-with), không đụng chạm đến các primitives tùy chỉnh khác của người dùng.
  5. Archive các agent cũ thuộc hm-l1/l2/l3 (đã hoàn thành di chuyển sang thư mục archive).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Đồng bộ các primitives hiện tại vào assets/</name>
  <files>
    - assets/agents/
    - assets/skills/
    - assets/commands/
  </files>
  <action>
    - Viết một script tạm hoặc dùng lệnh sao chép toàn bộ các primitives đang hoạt động (không nằm trong archive) từ `.hivefiver-meta-builder/` sang `assets/`.
    - Đảm bảo cấu trúc:
      - `assets/agents/` chứa các tệp `.md` của agent.
      - `assets/skills/` chứa các thư mục skill (mỗi thư mục chứa `SKILL.md`).
      - `assets/commands/` chứa các tệp `.md` của command.
  </action>
</task>

<task type="auto">
  <name>Task 2: Cập nhật Cấu trúc Đường dẫn và Định nghĩa Schema</name>
  <files>
    - src/features/bootstrap/structure.ts
    - src/schema-kernel/bootstrap.schema.ts
  </files>
  <action>
    - Cập nhật `src/features/bootstrap/structure.ts`:
      - Thay đổi `resolveMetaBuilderRoot` thành resolve nguồn assets của package. Sử dụng vị trí tương đối so với tệp chạy hoặc định vị qua `import.meta.url`.
      - Cập nhật danh sách kiểm tra của doctor (ví dụ: đổi check `symlinks` thành `primitives` hoặc giữ nguyên key nhưng đổi mô tả/ý nghĩa thành kiểm tra tính hợp lệ của primitives).
    - Cập nhật `src/schema-kernel/bootstrap.schema.ts`:
      - Thay đổi trường `primitiveSymlinks` trong `BootstrapInitResultSchema` thành `primitiveFiles` (hoặc giữ nguyên trường nhưng đổi logic đếm nếu cần tương thích ngược, tuy nhiên đổi thành `primitiveFiles` sẽ chuẩn xác hơn).
  </action>
</task>

<task type="auto">
  <name>Task 3: Refactor luồng Bootstrap Init và Recover</name>
  <files>
    - src/tools/config/bootstrap-init.ts
    - src/tools/config/bootstrap-recover.ts
  </files>
  <action>
    - Cập nhật `listPrimitiveSources` để quét trực tiếp từ thư mục `assets/` đi kèm package thay vì `.hivefiver-meta-builder/`.
    - Viết lại hàm `resolvePrimitiveTargetPath` để hỗ trợ nhận diện động thư mục số ít/số nhiều. Nếu thư mục số ít tương ứng (ví dụ: `agent/` thay vì `agents/`) tồn tại dưới `.opencode/`, sử dụng nó.
    - Thay thế hàm tạo symlink bằng hàm copy/overwrite trực tiếp tệp/thư mục:
      - Nếu tệp đích đã tồn tại (dưới dạng symlink cũ hoặc tệp cũ), xóa tệp đích đó đi và sao chép tệp mới từ `assets/` vào.
      - Không xóa hoặc chỉnh sửa bất kỳ tệp nào của người dùng (tức là chỉ xử lý các đích thuộc danh sách primitives được cung cấp bởi `listPrimitiveSources`).
  </action>
</task>

<task type="auto">
  <name>Task 4: Cập nhật lệnh Doctor</name>
  <files>
    - src/cli/commands/doctor.ts
  </files>
  <action>
    - Refactor `runSymlinkCheck` (hoặc đổi tên thành `runPrimitivesCheck`) để kiểm tra xem các tệp primitives đã được copy đầy đủ từ `assets/` sang `.opencode/` và không phải là symlinks.
  </action>
</task>

<task type="auto">
  <name>Task 5: Refactor và Cập nhật Unit Tests</name>
  <files>
    - tests/tools/bootstrap-init.test.ts
    - tests/tools/bootstrap-recover.test.ts
    - tests/cli/commands/init.test.ts
    - tests/cli/commands/doctor.test.ts
  </files>
  <action>
    - Cập nhật toàn bộ các bài kiểm thử để mock sao chép file thay vì tạo symlink.
    - Kiểm tra xem việc đếm số lượng primitives copy có chính xác không.
    - Đảm bảo tất cả kiểm thử liên quan đều PASS.
  </action>
</task>

</tasks>

<verification>
- Chạy `npm run typecheck && npm run build` để kiểm tra biên dịch.
- Chạy `npm test` để xác minh tất cả 2.540+ kiểm thử hoạt động bình thường sau khi sửa đổi.
- Thực hiện kiểm tra thủ công bằng cách chạy `hivemind init` hoặc công cụ tương đương để xem các file có được sao chép trực tiếp vào `.opencode/` dưới dạng file thật hay không.
</verification>
