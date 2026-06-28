import type { AssistantToolCall } from "./types";

export type ToolDefinition = {
  name: AssistantToolCall["name"];
  description: string;
};

export const tools: ToolDefinition[] = [
  {
    name: "searchProduct",
    description: "Recherche un produit à partir d'un code-barres (barcode).",
  },
  {
    name: "updateStock",
    description:
      "Modifier le stock (ajout/retrait) d'un produit. Retourne l'état mis à jour côté outil métier.",
  },
  {
    name: "createCategory",
    description: "Créer une catégorie d'inventaire.",
  },
  {
    name: "renameCategory",
    description: "Renommer une catégorie.",
  },
  {
    name: "deleteProduct",
    description: "Supprimer un produit de l'inventaire.",
  },
  {
    name: "exportCSV",
    description: "Exporter l'inventaire au format CSV.",
  },
];

