/**
 * Exemples de commandes vocales pour les fonctionnalités multi-actions
 * Ces exemples peuvent être utilisés pour tester l'assistant vocal
 */

export const multiActionsExamples = {
  batchUpdatePrices: [
    {
      command: "Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70",
      expectedToolCall: {
        name: "batchUpdatePrices",
        args: {
          updates: [
            { query: "Coca", salesPrice: 1.80 },
            { query: "Fanta", salesPrice: 1.60 },
            { query: "Sprite", salesPrice: 1.70 },
          ],
        },
      },
    },
    {
      command: "Change les prix : Coca 1.80, Fanta 1.60, Sprite 1.70",
      expectedToolCall: {
        name: "batchUpdatePrices",
        args: {
          updates: [
            { query: "Coca", salesPrice: 1.80 },
            { query: "Fanta", salesPrice: 1.60 },
            { query: "Sprite", salesPrice: 1.70 },
          ],
        },
      },
    },
    {
      command: "Fixe le prix d'achat du lait à 0.90 et du pain à 0.50",
      expectedToolCall: {
        name: "batchUpdatePrices",
        args: {
          updates: [
            { query: "lait", purchasePrice: 0.90 },
            { query: "pain", purchasePrice: 0.50 },
          ],
        },
      },
    },
  ],

  getCategoryInventory: [
    {
      command: "Fais l'inventaire des boissons",
      expectedToolCall: {
        name: "getCategoryInventory",
        args: {
          categoryName: "boissons",
        },
      },
    },
    {
      command: "Montre-moi tous les snacks",
      expectedToolCall: {
        name: "getCategoryInventory",
        args: {
          categoryName: "snacks",
        },
      },
    },
    {
      command: "Liste les produits de la catégorie fruits et légumes",
      expectedToolCall: {
        name: "getCategoryInventory",
        args: {
          categoryName: "fruits et légumes",
        },
      },
    },
  ],

  getOutOfStockList: [
    {
      command: "Quels produits sont en rupture ?",
      expectedToolCall: {
        name: "getOutOfStockList",
        args: {},
      },
    },
    {
      command: "Qu'est-ce qui manque dans les boissons ?",
      expectedToolCall: {
        name: "getOutOfStockList",
        args: {
          categoryFilter: "boissons",
        },
      },
    },
    {
      command: "Montre-moi les produits épuisés",
      expectedToolCall: {
        name: "getOutOfStockList",
        args: {},
      },
    },
  ],

  getLowStockList: [
    {
      command: "Quels produits ont un stock faible ?",
      expectedToolCall: {
        name: "getLowStockList",
        args: {
          threshold: 5,
        },
      },
    },
    {
      command: "Qu'est-ce qui descend sous 10 ?",
      expectedToolCall: {
        name: "getLowStockList",
        args: {
          threshold: 10,
        },
      },
    },
    {
      command: "Liste les snacks qui descendent sous 10",
      expectedToolCall: {
        name: "getLowStockList",
        args: {
          threshold: 10,
          categoryFilter: "snacks",
        },
      },
    },
    {
      command: "Montre-moi les produits bientôt épuisés sans les ruptures",
      expectedToolCall: {
        name: "getLowStockList",
        args: {
          threshold: 5,
          excludeOutOfStock: true,
        },
      },
    },
  ],

  multiStep: [
    {
      command: "Fais l'inventaire des boissons et dis-moi ce qui manque",
      description: "Cette commande devrait déclencher deux tool calls séquentiels",
      expectedToolCalls: [
        {
          name: "getCategoryInventory",
          args: {
            categoryName: "boissons",
          },
        },
        {
          name: "getOutOfStockList",
          args: {
            categoryFilter: "boissons",
          },
        },
      ],
    },
    {
      command: "Montre-moi les ruptures et les produits en stock faible",
      description: "Cette commande devrait déclencher deux tool calls séquentiels",
      expectedToolCalls: [
        {
          name: "getOutOfStockList",
          args: {},
        },
        {
          name: "getLowStockList",
          args: {
            threshold: 5,
          },
        },
      ],
    },
  ],
};

/**
 * Réponses vocales attendues pour différents scénarios
 */
export const expectedVoiceResponses = {
  batchUpdatePricesSuccess: {
    scenario: "Tous les prix ont été mis à jour avec succès",
    expectedPattern:
      /prix (mis à jour|modifié|changé)/i,
    examples: [
      "Prix mis à jour : Coca-Cola à 1,80 €, Fanta à 1,60 €, Sprite à 1,70 €",
      "J'ai changé les prix de 3 produits",
    ],
  },

  batchUpdatePricesPartial: {
    scenario: "Certains produits ont été mis à jour, d'autres non trouvés",
    expectedPattern:
      /(mis à jour|modifié).*(non trouvé|introuvable)/i,
    examples: [
      "J'ai mis à jour Coca et Fanta, mais je n'ai pas trouvé Sprite",
      "2 prix modifiés, 1 produit non trouvé",
    ],
  },

  categoryInventoryEmpty: {
    scenario: "Aucun produit dans la catégorie",
    expectedPattern:
      /(aucun|pas de) produit/i,
    examples: [
      "Aucun produit dans la catégorie snacks",
      "La catégorie est vide",
    ],
  },

  categoryInventorySuccess: {
    scenario: "Inventaire d'une catégorie avec produits",
    expectedPattern:
      /\d+ produits?/i,
    examples: [
      "24 produits dans les snacks, 156 unités en stock",
      "Catégorie boissons : 18 produits",
    ],
  },

  outOfStockNone: {
    scenario: "Aucun produit en rupture",
    expectedPattern:
      /(aucun|pas de).*(rupture|épuisé)/i,
    examples: [
      "Aucun produit en rupture",
      "Tous les produits sont en stock",
    ],
  },

  outOfStockFound: {
    scenario: "Des produits sont en rupture",
    expectedPattern:
      /\d+ produits?.*(rupture|épuisé)/i,
    examples: [
      "3 produits en rupture : Coca, Pain, Lait",
      "Il y a 5 produits épuisés",
    ],
  },

  lowStockNone: {
    scenario: "Aucun produit en stock faible",
    expectedPattern:
      /(aucun|pas de).*(stock faible|bientôt épuisé)/i,
    examples: [
      "Aucun produit en stock faible",
      "Tous les stocks sont au-dessus du seuil",
    ],
  },

  lowStockFound: {
    scenario: "Des produits ont un stock faible",
    expectedPattern:
      /\d+ produits?.*(stock faible|bientôt|descend)/i,
    examples: [
      "7 produits ont un stock faible",
      "Fanta (3 unités), Sprite (2 unités) sont bientôt épuisés",
    ],
  },
};

/**
 * Scénarios de test complets pour validation manuelle ou automatique
 */
export const testScenarios = [
  {
    name: "Modification de prix groupée - Succès total",
    steps: [
      {
        action: "speak",
        text: "Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70",
      },
      {
        action: "expect",
        toolCalls: ["batchUpdatePrices"],
        voiceResponse: /3 produits?/i,
      },
    ],
  },
  {
    name: "Inventaire catégorie avec ruptures",
    steps: [
      {
        action: "speak",
        text: "Fais l'inventaire des boissons et dis-moi ce qui manque",
      },
      {
        action: "expect",
        toolCalls: ["getCategoryInventory", "getOutOfStockList"],
        voiceResponse: /produits?.*(rupture|manque)/i,
      },
    ],
  },
  {
    name: "Liste de réapprovisionnement",
    steps: [
      {
        action: "speak",
        text: "Montre-moi les ruptures et les produits en stock faible",
      },
      {
        action: "expect",
        toolCalls: ["getOutOfStockList", "getLowStockList"],
        voiceResponse: /\d+.*produits?/i,
      },
    ],
  },
];

/**
 * Messages d'erreur attendus pour différents cas limites
 */
export const errorScenarios = {
  batchUpdatePricesNoUpdates: {
    input: { updates: [] },
    expectedError: "Aucune mise à jour de prix fournie",
  },
  
  getCategoryInventoryNoName: {
    input: { categoryName: "" },
    expectedError: "Nom de catégorie requis",
  },
  
  productNotFound: {
    scenario: "Produit inexistant dans batch update",
    expectedResponse: {
      success: false,
      error: "Produit non trouvé",
    },
  },
  
  ambiguousProduct: {
    scenario: "Plusieurs produits correspondent",
    expectedResponse: {
      success: false,
      ambiguous: true,
      matches: expect.arrayContaining([
        expect.objectContaining({
          barcode: expect.any(String),
          name: expect.any(String),
        }),
      ]),
    },
  },
};
