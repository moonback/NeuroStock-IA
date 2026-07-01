import type { ToolDefinition } from './types';

export const tools: ToolDefinition[] = [
  { name: 'searchProduct', description: 'Recherche un produit et renvoie sa fiche complete', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'semanticSearchProduct', description: 'Recherche semantique de produits (comprend le sens, pas seulement les mots)', parameters: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
  { name: 'regenerateEmbeddings', description: 'Regenerer les embeddings pour tous les produits ou un produit specifique', sensitive: true, parameters: { type: 'object', properties: { barcode: { type: 'string' } } } },
  { name: 'openProductDetails', description: "Ouvrir la fiche detaillee d'un produit present dans l'inventaire", parameters: { type: 'object', properties: { query: { type: 'string' }, barcode: { type: 'string' } } } },
  { name: 'closeModal', description: 'Fermer le modal produit ou formulaire actuellement ouvert', parameters: { type: 'object', properties: {} } },
  { name: 'navigateTo', description: "Naviguer vers une page de l'application (scan, stock, categories, pos, dashboard, settings)", parameters: { type: 'object', properties: { destination: { type: 'string' } }, required: ['destination'] } },
  { name: 'getDashboardSummary', description: "Obtenir un resume analytique de l'inventaire (KPIs, top produits par quantite et valeur,alertes stock, repartition categories, derniers scans)", parameters: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'updateStock', description: 'Modifier un stock. Par défaut, quantity est un delta relatif (ajout/retrait). Pour un réglage absolu, utiliser operation: "set".', sensitive: true, parameters: { type: 'object', properties: { barcode: { type: 'string' }, query: { type: 'string' }, name: { type: 'string' }, quantity: { type: 'number' }, operation: { type: 'string', enum: ['add', 'remove', 'set'] } }, required: ['quantity'] } },
  {
    name: 'updateProduct',
    description: 'Modifier un produit (prix, nom, marque, categorie, etc.)',
    sensitive: true,
    parameters: {
      type: 'object',
      properties: {
        barcode: { type: 'string', description: 'Code-barres du produit' },
        query: { type: 'string', description: 'Nom ou marque du produit pour recherche' },
        name: { type: 'string', description: 'Nouveau nom du produit' },
        brand: { type: 'string', description: 'Nouvelle marque du produit' },
        category: { type: 'string', description: 'Nouvelle categorie du produit' },
        purchasePrice: { type: 'number', description: 'Nouveau prix d\'achat' },
        salesPrice: { type: 'number', description: 'Nouveau prix de vente' },
        imageUrl: { type: 'string', description: 'Nouvelle URL de l\'image' },
      },
    },
  },
  {
    name: 'createProduct',
    description: 'Creer un produit dans l inventaire a partir d un code-barres ou d un nom avec marque, en recherchant OpenFoodFacts',
    sensitive: true,
    parameters: {
      type: 'object',
      properties: {
        barcode: { type: 'string', description: 'Code-barres du produit si disponible' },
        name: { type: 'string', description: 'Nom du produit si le code-barres n est pas fourni' },
        quantity: { type: 'number' },
        brand: { type: 'string', description: 'Marque du produit, requise si le code-barres n est pas fourni' },
        category: { type: 'string' },
        imageUrl: { type: 'string' },
        purchasePrice: { type: 'number' },
        salesPrice: { type: 'number' },
      },
    },
  },
  { name: 'createCategory', description: 'Créer une catégorie', sensitive: true, parameters: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'renameCategory', description: 'Renommer une catégorie', sensitive: true, parameters: { type: 'object', properties: { oldName: { type: 'string' }, newName: { type: 'string' } }, required: ['oldName', 'newName'] } },
  { name: 'deleteProduct', description: 'Supprimer un produit', sensitive: true, parameters: { type: 'object', properties: { barcode: { type: 'string' } }, required: ['barcode'] } },
  { name: 'exportCSV', description: 'Exporter en CSV', sensitive: true, parameters: { type: 'object', properties: {} } },
  {
    name: 'batchUpdatePrices',
    description: 'Modifier plusieurs prix de vente ou d\'achat en une seule commande (ex: "mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70")',
    sensitive: true,
    parameters: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          description: 'Liste des mises à jour de prix',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Nom ou code-barres du produit' },
              salesPrice: { type: 'number', description: 'Nouveau prix de vente' },
              purchasePrice: { type: 'number', description: 'Nouveau prix d\'achat' },
            },
            required: ['query'],
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'getCategoryInventory',
    description: 'Obtenir tous les produits d\'une catégorie spécifique avec leurs détails (stock, prix, etc.)',
    parameters: {
      type: 'object',
      properties: {
        categoryName: { type: 'string', description: 'Nom de la catégorie' },
        includeOutOfStock: { type: 'boolean', description: 'Inclure les produits en rupture (par défaut: true)' },
      },
      required: ['categoryName'],
    },
  },
  {
    name: 'getOutOfStockList',
    description: 'Obtenir la liste de tous les produits en rupture de stock (quantité = 0)',
    parameters: {
      type: 'object',
      properties: {
        categoryFilter: { type: 'string', description: 'Filtrer par catégorie (optionnel)' },
      },
    },
  },
  {
    name: 'getLowStockList',
    description: 'Obtenir la liste de tous les produits en stock faible (quantité <= seuil)',
    parameters: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'Seuil de stock faible (par défaut: 5)' },
        categoryFilter: { type: 'string', description: 'Filtrer par catégorie (optionnel)' },
        excludeOutOfStock: { type: 'boolean', description: 'Exclure les produits en rupture (par défaut: false)' },
      },
    },
  },
];

export const sensitiveTools = new Set(tools.filter((tool) => tool.sensitive).map((tool) => tool.name));

export function isSensitiveTool(name: string): boolean {
  return sensitiveTools.has(name as never);
}

export function getToolDescription(name: string): string {
  return tools.find((tool) => tool.name === name)?.description ?? `Action ${name}`;
}

export function getToolsDeclaration(): Array<Record<string, unknown>> {
  return tools.map(({ name, description, parameters }) => ({ name, description, parameters: parameters ?? { type: 'object', properties: {} } }));
}

export const TOOLS = tools;
export const isDestructiveTool = isSensitiveTool;
