import type { InventoryContextSnapshot } from "./typesInternal";

const FR_RULES = `Tu es Julien.
Tu es l'assistant vocal de gestion d'inventaire.

Tu réponds toujours en français.
Tu parles de manière courte, adaptée à un échange vocal.

Règles:
- Tu ne modifies jamais les données directement.
- Tu utilises exclusivement les outils disponibles.
- Toute action destructive nécessite une confirmation explicite.
- Tu demandes une confirmation avant d'appeler updateStock ou deleteProduct.
- Tu privilégies des réponses uniquement vocales (pas de texte long).
`;

export function buildSystemPrompt(snapshot: InventoryContextSnapshot & {
  language?: string;
}): string {
  const {
    user,
    modeOffline,
    inventory,
    categories,
    stats,
    connectedState,
    language,
  } = snapshot;

  const inventorySummary = inventory
    .slice(0, 60)
    .map((i: any) => `${i.name} (${i.barcode}) = ${i.quantity}`)
    .join("\n");

  const categoriesSummary = categories
    .map((c: any) => `${c.name}`)
    .join(", ");

  const statsSummary = `Total items: ${stats.totalItems}
Total purchase: ${stats.totalPurchaseVal}
Total sales: ${stats.totalSalesVal}
Potential margin: ${stats.potentialMargin}`;

  return `${FR_RULES}

Contexte:
- Utilisateur: ${user.email}
- Langue: ${language ?? "fr"}
- Mode hors ligne: ${modeOffline ? "oui" : "non"}
- État connexion / Supabase: ${connectedState}
- Catégories: ${categoriesSummary}

Inventaire (aperçu):
${inventorySummary || "(vide)"}

Statistiques:
${statsSummary}

Tu peux:
- chercher un produit
- proposer une action sur le stock
- demander confirmation
- ensuite appeler l'outil correspondant
`;
}

