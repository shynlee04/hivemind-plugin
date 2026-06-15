/**
 * Indonesian keyword map for intent classification (P27.2 T22).
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["menerapkan", /\b(menerapkan|terapkan|diterapkan)\b/i],
    ["memperbaiki", /\b(memperbaiki|perbaiki|diperbaiki)\b/i],
    ["menambahkan", /\b(menambahkan|tambah|ditambahkan)\b/i],
    ["membuat", /\b(membuat|buat|dibuat)\b/i],
    ["membangun", /\b(membangun|bangun|dibangun)\b/i],
    ["refaktor", /\b(refaktor|refactoring)\b/i],
    ["mengubah", /\b(mengubah|ubah|diubah)\b/i],
    ["memperbarui", /\b(memperbarui|perbarui|diperbarui)\b/i],
    ["menulis", /\b(menulis|tulis|ditulis)\b/i],
    ["menimpa", /\b(menimpa|timpa)\b/i],
    ["kode", /\bkode\b/i],
  ],
  RESEARCH: [
    ["bagaimana", /\b(bagaimana)\b/i],
    ["jelaskan", /\b(jelaskan|menjelaskan|dijelaskan)\b/i],
    ["apa itu", /\b(apa.itu|apakah)\b/i],
    ["deskripsikan", /\b(deskripsikan|mendeskripsikan)\b/i],
    ["dokumentasi", /\b(dokumentasi|dokumen)\b/i],
    ["gambaran", /\b(gambaran|gambaran.umum)\b/i],
    ["perkenalkan", /\b(perkenalkan|memperkenalkan)\b/i],
    ["ceritakan", /\b(ceritakan)\b/i],
  ],
  INVESTIGATION: [
    ["mengapa", /\b(mengapa|kenapa)\b/i],
    ["temukan", /\b(temukan|menemukan|ditemukan)\b/i],
    ["akar masalah", /\b(akar.masalah|penyebab)\b/i],
    ["debug", /\bdebug/i],
    ["selidiki", /\b(selidiki|menyelidiki)\b/i],
    ["diagnosis", /\b(diagnosis|mendiagnosis)\b/i],
    ["pecahkan masalah", /\b(pecahkan.masalah|pemecahan.masalah)\b/i],
    ["rusak", /\b(rusak|patah)\b/i],
    ["gagal", /\b(gagal|kegagalan)\b/i],
    ["kesalahan", /\b(kesalahan|error)\b/i],
    ["eror", /\beror\b/i],
  ],
  EXPLORATION: [
    ["bagaimana jika", /\b(bagaimana.jika)\b/i],
    ["desain", /\b(desain|mendesain)\b/i],
    ["curah pendapat", /\b(curah.pendapat)\b/i],
    ["jelajahi", /\b(jelajahi|menjelajahi)\b/i],
    ["pertimbangkan", /\b(pertimbangkan|mempertimbangkan)\b/i],
    ["pilihan", /\b(pilihan|opsi)\b/i],
    ["alternatif", /\b(alternatif)\b/i],
    ["kemungkinan", /\b(kemungkinan)\b/i],
    ["bisa jadi", /\b(bisa.jadi|mungkin.kita)\b/i],
  ],
}
