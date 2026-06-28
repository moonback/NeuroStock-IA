export enum AssistantState {
  Idle = 'idle',
  Connecting = 'connecting',
  Listening = 'listening',
  Speaking = 'speaking',
  Thinking = 'thinking',
  Muted = 'muted',
  Error = 'error',
}

export interface AssistantConfig {
  apiKey: string;
  model?: string;
  language?: string;
  voiceName?: string;
}

export interface LiveSessionState {
  isConnected: boolean;
  isReady: boolean;
  error: string | null;
}

export interface AudioState {
  microphoneEnabled: boolean;
  speakerEnabled: boolean;
  microphoneMuted: boolean;
}

export interface FunctionCallRequest {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface FunctionCallResponse {
  id: string;
  result: unknown;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  audioContent?: string;
  functionCall?: FunctionCallRequest;
}

export interface InventorySnapshot {
  items: Array<{
    barcode: string;
    name: string;
    quantity: number;
    category?: string;
    brand?: string;
  }>;
  categories: Array<{
    name: string;
    icon?: string;
  }>;
  totalItems: number;
  lowStockCount: number;
  offlineMode: boolean;
  pendingSync: number;
}

export interface AssistantContext {
  inventory: InventorySnapshot;
  userEmail?: string;
  storeName?: string;
  isOnline: boolean;
}

export interface PermissionRequest {
  toolName: string;
  description: string;
  args: Record<string, unknown>;
  onConfirm: () => void;
  onDeny: () => void;
}
