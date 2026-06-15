/**
 * French keyword map for intent classification (P27.2 T22).
 *
 * Uses Unicode regex with diacritic normalization support.
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["implémenter", /\b(implémenter|implementer|implémente|implemente)\b/i],
    ["corriger", /\b(corriger|corrige|corrigé|corrigée)\b/i],
    ["ajouter", /\b(ajouter|ajoute|ajouté|ajoutée)\b/i],
    ["créer", /\b(créer|creer|crée|cree|créé|crée)\b/i],
    ["construire", /\b(construire|construit)\b/i],
    ["refactoriser", /\b(refactoriser|refactorise|refactorisé)\b/i],
    ["modifier", /\b(modifier|modifie|modifié)\b/i],
    ["mettre à jour", /\b(mettre.?.jour|mis.?.jour)\b/i],
    ["écrire", /\b(écrire|ecrire|écris|ecris)\b/i],
    ["changer", /\b(changer|change|changé)\b/i],
    ["réécrire", /\b(réécrire|reécrire|réécris|reécris)\b/i],
  ],
  RESEARCH: [
    ["comment", /\b(comment)\b/i],
    ["expliquer", /\b(expliquer|explique|expliqué)\b/i],
    ["qu'est-ce que", /\b(qu'est.ce.que|quest.ce.que)\b/i],
    ["décrire", /\b(décrire|decrire|décris|decris)\b/i],
    ["documenter", /\b(documenter|documente|documenté)\b/i],
    ["aperçu", /\b(aperçu|apercu)\b/i],
    ["présenter", /\b(présenter|presenter|présente|presente)\b/i],
    ["parle-moi", /\b(parle.moi|parlez.moi)\b/i],
  ],
  INVESTIGATION: [
    ["pourquoi", /\b(pourquoi)\b/i],
    ["trouver", /\b(trouver|trouve|trouvé)\b/i],
    ["cause racine", /\b(cause.racine|cause.?racine)\b/i],
    ["déboguer", /\b(déboguer|deboguer|débogue|debogue)\b/i],
    ["enquêter", /\b(enquêter|enqueter|enquête|enquete)\b/i],
    ["diagnostiquer", /\b(diagnostiquer|diagnostique|diagnostiqué)\b/i],
    ["dépanner", /\b(dépanner|depanner|dépanne|depanne)\b/i],
    ["cassé", /\b(cassé|casse|cassée)\b/i],
    ["échec", /\b(échec|echec|échoue|echoue)\b/i],
    ["erreur", /\b(erreur|erreurs)\b/i],
    ["plantage", /\b(plantage|plante|planté)\b/i],
  ],
  EXPLORATION: [
    ["et si", /\b(et.si)\b/i],
    ["concevoir", /\b(concevoir|conçu|conçue)\b/i],
    ["remue-méninges", /\b(remue.méninges|remue.meninges)\b/i],
    ["explorer", /\b(explorer|explore|exploré)\b/i],
    ["envisager", /\b(envisager|envisage|envisagé)\b/i],
    ["options", /\b(options|option)\b/i],
    ["alternative", /\b(alternative|alternatives)\b/i],
    ["possibilité", /\b(possibilité|possibilités)\b/i],
    ["pourrait-on", /\b(pourrait.on|pourrions.nous)\b/i],
  ],
}
