import { ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
  {
    name: 'searchProduct',
    description: 'Rechercher un produit dans l\'inventaire par son nom, code-barres, marque ou catégorie. Retourne les informations du produit trouvé.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Le terme de recherche : nom du produit, code-barres, marque ou catégorie',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'updateStock',
    description: 'Modifier le stock d\'un produit. Peut ajouter ou retirer des unités. Nécessite le code-barres du produit et le nouveau stock total.',
    parameters: {
      type: 'object',
      properties: {
        barcode: {
          type: 'string',
          description: 'Le code-barres du produit à modifier',
        },
        quantity: {
          type: 'number',
          description: 'La NOUVELLE quantité totale en stock (pas un delta)',
        },
        delta: {
          type: 'number',
          description: 'OPTIONNEL : Le nombre d\'unités à ajouter (positif) ou retirer (négatif)',
        },
      },
      required: ['barcode'],
    },
  },
  {
    name: 'createProduct',
    description: 'Créer un nouveau produit dans l\'inventaire. Nécessite un code-barres et un nom.',
    parameters: {
      type: 'object',
      properties: {
        barcode: {
          type: 'string',
          description: 'Le code-barres du nouveau produit',
        },
        name: {
          type: 'string',
          description: 'Le nom du produit',
        },
        quantity: {
          type: 'number',
          description: 'La quantité initiale en stock (défaut: 1)',
        },
        category: {
          type: 'string',
          description: 'La catégorie du produit (optionnel)',
        },
        brand: {
          type: 'string',
          description: 'La marque du produit (optionnel)',
        },
      },
      required: ['barcode', 'name'],
    },
  },
  {
    name: 'deleteProduct',
    description: 'ATTENTION: Supprimer définitivement un produit de l\'inventaire. Cette action est irréversible et nécessite une confirmation explicite de l\'utilisateur.',
    parameters: {
      type: 'object',
      properties: {
        barcode: {
          type: 'string',
          description: 'Le code-barres du produit à supprimer',
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation explicite de l\'utilisateur (doit être true)',
        },
      },
      required: ['barcode', 'confirm'],
    },
  },
  {
    name: 'createCategory',
    description: 'Créer une nouvelle catégorie pour organiser les produits.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Le nom de la nouvelle catégorie',
        },
        icon: {
          type: 'string',
          description: 'L\'emoji/icône de la catégorie (optionnel)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'renameCategory',
    description: 'Renommer une catégorie existante. Tous les produits de cette catégorie seront automatiquement mis à jour.',
    parameters: {
      type: 'object',
      properties: {
        oldName: {
          type: 'string',
          description: 'Le nom actuel de la catégorie',
        },
        newName: {
          type: 'string',
          description: 'Le nouveau nom de la catégorie',
        },
      },
      required: ['oldName', 'newName'],
    },
  },
  {
    name: 'deleteCategory',
    description: 'Supprimer une catégorie. Les produits associés ne seront pas supprimés mais n\'auront plus de catégorie.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Le nom de la catégorie à supprimer',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'exportCSV',
    description: 'Exporter l\'inventaire complet en fichier CSV téléchargeable.',
    parameters: {
      type: 'object',
      properties: {
        includePrices: {
          type: 'boolean',
          description: 'Inclure les prix d\'achat et de vente (défaut: true)',
        },
      },
    },
  },
  {
    name: 'getStats',
    description: 'Obtenir les statistiques de l\'inventaire : nombre de références, total des unités, alertes stock faible, valeur totale.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getLowStock',
    description: 'Lister les produits en stock faible (5 unités ou moins).',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Nombre maximum de produits à retourner (défaut: 10)',
        },
      },
    },
  },
];

export function getToolsDeclaration(): unknown[] {
  return TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters ?? { type: 'object', properties: {} },
  }));
}

export const DESTRUCTIVE_TOOLS = ['deleteProduct', 'deleteCategory'];

export function isDestructiveTool(toolName: string): boolean {
  return DESTRUCTIVE_TOOLS.includes(toolName);
}

export function getToolDescription(toolName: string): string | undefined {
  const tool = TOOLS.find((t) => t.name === toolName);
  return tool?.description;
}
