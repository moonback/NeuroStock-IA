export interface ProductLookupData {
  name: string;
  imageUrl?: string;
  brand?: string;
  category?: string;
  purchasePrice?: number;
  salesPrice?: number;
  lastMovement?: number;
  /** Contenance/format renvoyé par OpenFoodFacts (ex : « 330 ml »). Transitoire, non persisté. */
  format?: string;
  /** Nutri-Score a–e renvoyé par OpenFoodFacts. Transitoire, non persisté. */
  nutriScore?: string;
}

export interface InventoryItem extends ProductLookupData {
  barcode: string;
  name: string;
  quantity: number;
  imageUrl?: string;
  brand?: string;
  category?: string;
  lastUpdated: number;
  purchasePrice?: number;
  salesPrice?: number;
  lastMovement?: number;
  embedding?: number[];
}

export interface CategoryItem {
  id?: string;
  name: string;
  icon?: string;
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

export type { ProactiveInput } from './lib/proactiveEngine';
export { buildProactiveSignals } from './lib/proactiveEngine';

