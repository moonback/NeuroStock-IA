export type AssistantState =
  | "Idle"
  | "Connecting"
  | "Listening"
  | "Speaking"
  | "Thinking"
  | "Muted"
  | "Error";

export type AssistantToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type UpdateStockArgs = {
  barcode: string;
  quantity: number; // delta quantity (positive = add, negative = remove)
};

