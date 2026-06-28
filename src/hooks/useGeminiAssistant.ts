import { useContext } from 'react';
import { GeminiAssistantContext } from './GeminiAssistantContext';

export function useGeminiAssistant() {
  const context = useContext(GeminiAssistantContext);

  if (!context) {
    throw new Error(
      'useGeminiAssistant must be used within a GeminiAssistantProvider',
    );
  }

  return {
    open: context.open,
    close: context.close,
    minimize: context.minimize,
    isOpen: context.isOpen,
    isMinimized: context.isMinimized,
    state: context.state,
    error: context.error,
  };
}
