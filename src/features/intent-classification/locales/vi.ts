/**
 * Vietnamese keyword map for intent classification (P27.2 T22).
 *
 * Uses Unicode regex patterns. Avoids `\b` word boundaries for
 * Vietnamese compound words per P27.2-LANG-SUPPLEMENT Pitfall 2.
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["triển khai", /tri.n.khai/i],
    ["sửa lỗi", /s.a l(i|ô)..i/i],
    ["thêm", /th.m/i],
    ["tạo", /t.o/i],
    ["xây dựng", /x.y d.ng/i],
    ["cập nhật", /c.p nh.t/i],
    ["viết", /vi.t/i],
    ["sửa đổi", /s.a (đ|d)(ô|o)i/i],
    ["viết code", /vi.t code/i],
    ["code", /\bcode\b/i],
  ],
  RESEARCH: [
    ["giải thích", /gi.i th.ch/i],
    ["là gì", /l. g.ì/i],
    ["như thế nào", /nh. th. n.o/i],
    ["mô tả", /m. t.ả/i],
    ["tài liệu", /t.i li.u/i],
    ["tổng quan", /t.ng quan/i],
    ["giới thiệu", /gi.i thi.u/i],
    ["cách", /c.ch/i],
  ],
  INVESTIGATION: [
    ["tại sao", /t.i sao/i],
    ["tìm", /t.m/i],
    ["gốc rễ", /g.c r.ễ/i],
    ["debug", /\bdebug/i],
    ["điều tra", /(đ|d)i.u tra/i],
    ["chẩn đoán", /ch.n (đ|d)o.n/i],
    ["lỗi", /l.i/i],
    ["hỏng", /h.ng/i],
    ["sập", /s.p/i],
    ["nguyên nhân", /nguyn nh.n/i],
  ],
  EXPLORATION: [
    ["nếu", /n.u/i],
    ["thiết kế", /thi.t k./i],
    ["khám phá", /kh.m ph./i],
    ["ý tưởng", /. t.ng/i],
    ["cân nhắc", /cn nh.c/i],
    ["lựa chọn", /l.a ch.n/i],
    ["có thể", /c. th./i],
    ["phương án", /phng n/i],
  ],
}
