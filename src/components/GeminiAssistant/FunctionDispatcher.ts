import type { GoogleGenAI } from "@google/genai";
import type { InventoryItem } from "../../types";
import type { AssistantToolCall, UpdateStockArgs } from "./types";

export type ToolConfirmContext = {
  showConfirmation: (params: {
    title: string;
    detail?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }) => Promise<boolean>;
};

export type ToolHandlers = {
  updateStock: (args: UpdateStockArgs) => Promise<void | { queued?: boolean }>;
  exportCSV: () => void;
  // placeholders pour extension
  searchProduct?: (args: { barcode: string }) => Promise<InventoryItem | null>;
};

function safeNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export class FunctionDispatcher {
  private handlers: ToolHandlers;
  private confirmCtx: ToolConfirmContext;

  constructor(handlers: ToolHandlers, confirmCtx: ToolConfirmContext) {
    this.handlers = handlers;
    this.confirmCtx = confirmCtx;
  }

  async dispatch(ai: GoogleGenAI | null, toolCall: AssistantToolCall): Promise<any> {
    // ai param kept for future tool-result routing; current dispatcher returns tool result payload
    switch (toolCall.name) {
      case "updateStock": {
        const barcode = String(toolCall.args?.barcode ?? "").trim();
        const quantity = safeNumber(toolCall.args?.quantity);
        if (!barcode || quantity === null) {
          throw new Error("updateStock: args invalides");
        }

        const sign = quantity >= 0 ? "+" : "";
        const detail = `Barcode: ${barcode}\nQuantité: ${sign}${quantity}`;
        const ok = await this.confirmCtx.showConfirmation({
          title: "Confirmation requise",
          detail,
          confirmLabel: "Oui",
          cancelLabel: "Non",
        });

        if (!ok) {
          return { ok: false, cancelled: true };
        }

        await this.handlers.updateStock({ barcode, quantity });
        return { ok: true };
      }

      case "exportCSV": {
        this.handlers.exportCSV();
        return { ok: true };
      }

      default:
        throw new Error(`Tool non supporté: ${toolCall.name}`);
    }
  }
}

