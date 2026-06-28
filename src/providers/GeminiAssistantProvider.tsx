import { createContext, useCallback, useMemo, useState } from "react";
import type { InventoryItem, CategoryItem } from "../types";
import { GeminiAssistant } from "../components/GeminiAssistant/GeminiAssistant";
import type { InventoryContextSnapshot } from "../components/GeminiAssistant/typesInternal";

export type GeminiAssistantAPI = {
  open: () => void;
  close: () => void;
  minimize: () => void;
};

export const GeminiAssistantContext = createContext<GeminiAssistantAPI>({
  open: () => void 0,
  close: () => void 0,
  minimize: () => void 0,
});

export function GeminiAssistantProvider(props: {
  apiKey: string;
  inventory: InventoryItem[];
  categories: CategoryItem[];
  userEmail: string;
  modeOffline: boolean;
  connectedState: string;
  stats: {
    totalItems: number;
    totalPurchaseVal: number;
    totalSalesVal: number;
    potentialMargin: number;
  };
  toolHandlers: {
    updateStock: (args: { barcode: string; quantity: number }) => Promise<void | { queued?: boolean }>;
    exportCSV: () => void;
  };
  children: React.ReactNode;
}) {
  const {
    apiKey,
    inventory,
    categories,
    userEmail,
    modeOffline,
    connectedState,
    stats,
    toolHandlers,
    children,
  } = props;

  const [minimized, setMinimized] = useState(true);

  const open = useCallback(() => setMinimized(false), []);
  const close = useCallback(() => setMinimized(true), []);
  const minimize = useCallback(() => setMinimized(true), []);

  const value = useMemo(() => ({ open, close, minimize }), [open, close, minimize]);

  const snapshot: InventoryContextSnapshot = useMemo(
    () => ({
      user: { email: userEmail },
      modeOffline,
      inventory,
      categories,
      stats,
      connectedState,
    }),
    [userEmail, modeOffline, inventory, categories, stats, connectedState],
  );

  return (
    <GeminiAssistantContext.Provider value={value}>
      {children}
      <GeminiAssistant
        apiKey={apiKey}
        inventorySnapshot={snapshot}
        connectedState={connectedState}
        minimizedByDefault={minimized}
        toolHandlers={toolHandlers}
      />
    </GeminiAssistantContext.Provider>
  );
}

