import { createContext } from 'react';
import { AssistantState } from './types';

export interface GeminiAssistantContextValue {
  open: () => void;
  close: () => void;
  minimize: () => void;
  isOpen: boolean;
  isMinimized: boolean;
  state: AssistantState;
  error: string | null;
}

export const GeminiAssistantContext = createContext<GeminiAssistantContextValue | null>(null);
