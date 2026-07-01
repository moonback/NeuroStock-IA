import type { ReactNode } from 'react';

export enum AssistantState {
  Idle = 'idle',
  Connecting = 'connecting',
  Listening = 'listening',
  Speaking = 'speaking',
  Thinking = 'thinking',
  Muted = 'muted',
  Error = 'error',
}

export type ToolName =
  | 'searchProduct'
  | 'semanticSearchProduct'
  | 'regenerateEmbeddings'
  | 'openProductDetails'
  | 'closeModal'
  | 'updateStock'
  | 'updateProduct'
  | 'createProduct'
  | 'createCategory'
  | 'renameCategory'
  | 'deleteProduct'
  | 'exportCSV'
  | 'navigateTo'
  | 'getDashboardSummary'
  | 'batchUpdatePrices'
  | 'getCategoryInventory'
  | 'getOutOfStockList'
  | 'getLowStockList';

export interface GeminiToolCall {
  id: string;
  name: ToolName | string;
  args: Record<string, unknown>;
}

export interface GeminiToolResult {
  id: string;
  name: string;
  response: { success: boolean; data?: unknown; error?: string; denied?: boolean };
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters?: Record<string, unknown>;
  sensitive?: boolean;
}

export interface InventoryProductSnapshot {
  barcode: string;
  name: string;
  quantity: number;
  category?: string;
  brand?: string;
  imageUrl?: string;
  purchasePrice?: number;
  salesPrice?: number;
  lastMovement?: number;
  lastUpdated?: number;
}

export interface InventoryCategorySnapshot {
  id?: string;
  name: string;
  icon?: string;
}

export interface AssistantExternalContext {
  inventory?: InventoryProductSnapshot[];
  categories?: InventoryCategorySnapshot[];
  user?: { id?: string; name?: string; email?: string; role?: string };
  language?: string;
  offlineMode?: boolean;
  businessRules?: string[];
  storeName?: string;
  assistantName?: string;
  activeProduct?: {
    name?: string;
    barcode?: string;
    brand?: string;
  } | null;
}

export type ExternalContextReader = () => AssistantExternalContext | Promise<AssistantExternalContext>;

export type ToolHandler = (args: Record<string, unknown>, ctx: AssistantExternalContext) => unknown | Promise<unknown>;

export type ToolHandlers = Partial<Record<ToolName, ToolHandler>>;

export interface PermissionRequest {
  id: string;
  toolName: string;
  description: string;
  args: Record<string, unknown>;
  resolve: (allowed: boolean) => void;
}

export interface GeminiAssistantContextValue {
  state: AssistantState;
  isOpen: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  error: string | null;
  autoAccept: boolean;
  setAutoAccept: (value: boolean) => void;
  open: () => Promise<void>;
  close: () => Promise<void>;
  minimize: () => void;
  expand: () => void;
  mute: () => void;
  unmute: () => void;
  stop: () => Promise<void>;
}

export interface GeminiAssistantProviderProps {
  children: ReactNode;
  getContext?: ExternalContextReader;
  toolHandlers?: ToolHandlers;
  autoRender?: boolean;
  assistantName?: string;
}

// ============================================================================
// Types pour les nouveaux tools multi-actions
// ============================================================================

/**
 * Structure d'une mise à jour de prix dans un batch
 */
export interface PriceUpdateEntry {
  query: string;
  salesPrice?: number;
  purchasePrice?: number;
}

/**
 * Résultat d'une mise à jour de prix individuelle
 */
export interface PriceUpdateResult {
  query: string;
  barcode?: string;
  name?: string;
  success: boolean;
  salesPrice?: number;
  purchasePrice?: number;
  error?: string;
  ambiguous?: boolean;
  matches?: Array<{
    barcode: string;
    name: string;
    brand?: string;
  }>;
}

/**
 * Réponse du tool batchUpdatePrices
 */
export interface BatchUpdatePricesResponse {
  total: number;
  success: number;
  failed: number;
  results: PriceUpdateResult[];
}

/**
 * Produit résumé pour les listes d'inventaire
 */
export interface ProductSummary {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  quantity: number;
  purchasePrice?: number;
  salesPrice?: number;
}

/**
 * Réponse du tool getCategoryInventory
 */
export interface CategoryInventoryResponse {
  categoryName: string;
  count: number;
  totalStock: number;
  totalValue: number;
  products: ProductSummary[];
}

/**
 * Réponse du tool getOutOfStockList
 */
export interface OutOfStockListResponse {
  count: number;
  categoryFilter: string;
  products: ProductSummary[];
}

/**
 * Réponse du tool getLowStockList
 */
export interface LowStockListResponse {
  count: number;
  threshold: number;
  categoryFilter: string;
  excludeOutOfStock: boolean;
  products: ProductSummary[];
}

/**
 * Arguments pour batchUpdatePrices
 */
export interface BatchUpdatePricesArgs {
  updates: PriceUpdateEntry[];
}

/**
 * Arguments pour getCategoryInventory
 */
export interface GetCategoryInventoryArgs {
  categoryName: string;
  includeOutOfStock?: boolean;
}

/**
 * Arguments pour getOutOfStockList
 */
export interface GetOutOfStockListArgs {
  categoryFilter?: string;
}

/**
 * Arguments pour getLowStockList
 */
export interface GetLowStockListArgs {
  threshold?: number;
  categoryFilter?: string;
  excludeOutOfStock?: boolean;
}
