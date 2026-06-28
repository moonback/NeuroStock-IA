import type { InventoryItem, CategoryItem } from "../../types";

export type InventoryContextSnapshot = {
  user: { email: string };
  modeOffline: boolean;
  inventory: InventoryItem[];
  categories: CategoryItem[];
  stats: {
    totalItems: number;
    totalPurchaseVal: number;
    totalSalesVal: number;
    potentialMargin: number;
  };
  connectedState: string;
};

