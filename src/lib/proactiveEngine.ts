export interface ProactiveInput {
  products: Array<{
    id?: string;
    barcode?: string;
    name: string;
    category?: string;
    quantity: number;
    purchasePrice?: number;
    salesPrice?: number;
    lastMovement?: number; // Unix timestamp (ms)
  }>;
  categories: Array<{
    id?: string;
    name: string;
  }>;
  now?: number; // Timestamp de référence (par défaut Date.now())
}

export type ProactiveSignalType =
  | 'low_stock'
  | 'out_of_stock'
  | 'dormant_stock'
  | 'category_empty'
  | 'low_margin';

export type ProactiveSignalSeverity = 'info' | 'warning' | 'critical';

export interface ProactiveSignal {
  id: string;
  type: ProactiveSignalType;
  message: string;
  severity: ProactiveSignalSeverity;
  itemId?: string;
  timestamp: number;
  acknowledged?: boolean;
}

/**
 * Génère des signaux proactifs à partir des données d’inventaire et de catégories.
 * Complexité : O(n + m) où n = produits et m = catégories (linéaire par rapport aux données).
 */
export function buildProactiveSignals(input: ProactiveInput): ProactiveSignal[] {
  const { products, categories, now = Date.now() } = input;
  const signals: ProactiveSignal[] = [];

  // 1. Compter les produits par catégorie en une seule passe
  const categoryProductCount = new Map<string, number>();
  for (const p of products) {
    if (p.category) {
      categoryProductCount.set(p.category, (categoryProductCount.get(p.category) || 0) + 1);
    }
  }

  // 2. Générer les signaux par produit
  for (const p of products) {
    const key = p.barcode || p.name;
    const isOut = p.quantity === 0;
    const isLow = !isOut && p.quantity <= 3;
    const hasRecentMovement =
      typeof p.lastMovement === 'number' && now - p.lastMovement < 7 * 24 * 60 * 60 * 1000;

    // Stocks bas / rupture avec mouvement récent
    if (isOut && hasRecentMovement) {
      signals.push({
        id: `out_of_stock_${key}`,
        type: 'out_of_stock',
        message: `Rupture de stock pour « ${p.name} » malgré une activité récente.`,
        severity: 'critical',
        itemId: p.barcode,
        timestamp: now,
      });
    } else if (isLow && hasRecentMovement) {
      signals.push({
        id: `low_stock_${key}`,
        type: 'low_stock',
        message: `Stock bas pour « ${p.name} » avec rotation récente.`,
        severity: 'warning',
        itemId: p.barcode,
        timestamp: now,
      });
    }

    // Stock dormant (+7 jours sans mouvement)
    const isDormant =
      typeof p.lastMovement === 'number' && now - p.lastMovement > 7 * 24 * 60 * 60 * 1000;
    if (isDormant && p.quantity > 0) {
      signals.push({
        id: `dormant_stock_${key}`,
        type: 'dormant_stock',
        message: `« ${p.name} » est dormant depuis plus de 7 jours.`,
        severity: 'info',
        itemId: p.barcode,
        timestamp: now,
      });
    }

    // Marge basse (< 15 %)
    if (typeof p.purchasePrice === 'number' && typeof p.salesPrice === 'number' && p.salesPrice > 0) {
      const marginRatio = (p.salesPrice - p.purchasePrice) / p.salesPrice;
      if (marginRatio < 0.15) {
        signals.push({
          id: `low_margin_${key}`,
          type: 'low_margin',
          message: `Marge faible pour « ${p.name} » (${(marginRatio * 100).toFixed(1)} %).`,
          severity: 'warning',
          itemId: p.barcode,
          timestamp: now,
        });
      }
    }
  }

  // 3. Catégories sans produits
  for (const cat of categories) {
    const count = categoryProductCount.get(cat.name) ?? 0;
    if (count === 0) {
      signals.push({
        id: `category_empty_${cat.name}`,
        type: 'category_empty',
        message: `La catégorie « ${cat.name} » n’a aucun produit référencé.`,
        severity: 'info',
        timestamp: now,
      });
    }
  }

  return signals;
}
