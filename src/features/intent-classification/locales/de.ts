/**
 * German keyword map for intent classification (P27.2 T22).
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["implementieren", /\b(implementieren|implementiert|implementiere)\b/i],
    ["beheben", /\b(beheben|behebt|behoben)\b/i],
    ["hinzufügen", /\b(hinzufügen|hinzugefügt|füge.hinzu)\b/i],
    ["erstellen", /\b(erstellen|erstellt|erstellte)\b/i],
    ["bauen", /\b(bauen|baut|baute|gebaut)\b/i],
    ["refaktorisieren", /\b(refaktorisieren|refaktoriert|refaktorierte)\b/i],
    ["ändern", /\b(ändern|ändert|änderte|geändert)\b/i],
    ["aktualisieren", /\b(aktualisieren|aktualisiert|aktualisierte)\b/i],
    ["schreiben", /\b(schreiben|schreibt|schrieb|geschrieben)\b/i],
    ["umbauen", /\b(umbauen|baut.um|baute.um)\b/i],
    ["patchen", /\b(patchen|gepatcht|patcht)\b/i],
  ],
  RESEARCH: [
    ["wie", /\b(wie|wie.man|wie.kann)\b/i],
    ["erklären", /\b(erklären|erklärt|erklär)\b/i],
    ["was ist", /\b(was.ist|was.sind)\b/i],
    ["beschreiben", /\b(beschreiben|beschreibt|beschrieb)\b/i],
    ["dokumentieren", /\b(dokumentieren|dokumentiert)\b/i],
    ["überblick", /\b(überblick|ueberblick)\b/i],
    ["vorstellen", /\b(vorstellen|vorgestellt)\b/i],
    ["erläutern", /\b(erläutern|erläutert|erläutere)\b/i],
  ],
  INVESTIGATION: [
    ["warum", /\b(warum|wieso|weshalb)\b/i],
    ["finden", /\b(finden|findet|fand|gefunden)\b/i],
    ["grundursache", /\b(grundursache|grund.ursache)\b/i],
    ["debuggen", /\b(debuggen|debuggt|gedebuggt)\b/i],
    ["untersuchen", /\b(untersuchen|untersucht|untersuchte)\b/i],
    ["diagnostizieren", /\b(diagnostizieren|diagnostiziert)\b/i],
    ["fehlersuche", /\b(fehlersuche|fehler.suche)\b/i],
    ["kaputt", /\b(kaputt|defekt|zerbrochen)\b/i],
    ["fehler", /\b(fehler|fehlgeschlagen)\b/i],
    ["absturz", /\b(absturz|abgestürzt|abgestuerzt)\b/i],
  ],
  EXPLORATION: [
    ["was wäre wenn", /\b(was.wäre.wenn|waere)\b/i],
    ["entwerfen", /\b(entwerfen|entwirf|entworfen)\b/i],
    ["brainstorming", /\b(brainstorming|ideenfindung)\b/i],
    ["erkunden", /\b(erkunden|erkundet|erkundigte)\b/i],
    ["erwägen", /\b(erwägen|erwägt|erwogen)\b/i],
    ["optionen", /\b(optionen|option|möglichkeiten)\b/i],
    ["alternative", /\b(alternative|alternativen)\b/i],
    ["möglichkeit", /\b(möglichkeit|möglichkeiten)\b/i],
    ["könnten wir", /\b(könnten.wir|koennten.wir)\b/i],
  ],
}
