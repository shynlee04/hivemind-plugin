/**
 * Spanish keyword map for intent classification (P27.2 T22).
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["implementar", /\b(implementar|implementa|implementado|implementé)\b/i],
    ["arreglar", /\b(arreglar|arregla|arreglado|arreglé)\b/i],
    ["añadir", /\b(añadir|anadir|agregar|agrega)\b/i],
    ["crear", /\b(crear|crea|creado|creé)\b/i],
    ["construir", /\b(construir|construye|construido|construí)\b/i],
    ["refactorizar", /\b(refactorizar|refactoriza|refactorizado)\b/i],
    ["modificar", /\b(modificar|modifica|modificado|modifiqué)\b/i],
    ["actualizar", /\b(actualizar|actualiza|actualizado)\b/i],
    ["escribir", /\b(escribir|escribe|escrito|escribí)\b/i],
    ["cambiar", /\b(cambiar|cambia|cambiado|cambié)\b/i],
    ["reescribir", /\b(reescribir|reescribe|reescrito)\b/i],
  ],
  RESEARCH: [
    ["cómo", /\b(cómo|como)\b/i],
    ["explicar", /\b(explicar|explica|explicado|explique)\b/i],
    ["qué es", /\b(qué.es|que.es)\b/i],
    ["describir", /\b(describir|describe|descrito)\b/i],
    ["documentar", /\b(documentar|documenta|documentado)\b/i],
    ["visión general", /\b(visión.general|vision.general)\b/i],
    ["introducir", /\b(introducir|introduce|introducido)\b/i],
    ["hablar sobre", /\b(hablar.sobre|háblame|hablame)\b/i],
  ],
  INVESTIGATION: [
    ["por qué", /\b(por.qué|porque|razón)\b/i],
    ["encontrar", /\b(encontrar|encuentra|encontró|encontrado)\b/i],
    ["causa raíz", /\b(causa.raíz|causa.raiz)\b/i],
    ["depurar", /\b(depurar|depura|depurado)\b/i],
    ["investigar", /\b(investigar|investiga|investigado)\b/i],
    ["diagnosticar", /\b(diagnosticar|diagnostica|diagnosticado)\b/i],
    ["solucionar problemas", /\b(solucionar.problemas|soluciona)\b/i],
    ["roto", /\b(roto|rompe|rompió)\b/i],
    ["fallo", /\b(fallo|falla|fallido)\b/i],
    ["error", /\b(error|errores)\b/i],
    ["bloqueo", /\b(bloqueo|bloquea|bloqueado|crash)\b/i],
  ],
  EXPLORATION: [
    ["y si", /\b(y.si|que.tal)\b/i],
    ["diseñar", /\b(diseñar|disenar|diseña|diseñado)\b/i],
    ["lluvia de ideas", /\b(lluvia.de.ideas)\b/i],
    ["explorar", /\b(explorar|explora|explorado)\b/i],
    ["considerar", /\b(considerar|considera|considerado)\b/i],
    ["opciones", /\b(opciones|opción|opcion)\b/i],
    ["alternativa", /\b(alternativa|alternativas)\b/i],
    ["posibilidad", /\b(posibilidad|posibilidades)\b/i],
    ["podríamos", /\b(podríamos|podriamos|pudieramos)\b/i],
  ],
}
