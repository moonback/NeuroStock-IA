import { useContext } from "react";
import { GeminiAssistantContext } from "../providers/GeminiAssistantProvider";

export function useGeminiAssistant() {
  return useContext(GeminiAssistantContext);
}

