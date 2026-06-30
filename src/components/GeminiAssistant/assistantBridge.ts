let assistantSpeaker: ((text: string) => void) | null = null;

export function registerAssistantSpeaker(speaker: ((text: string) => void) | null): void {
  assistantSpeaker = speaker;
}

export function speakAssistantText(text: string): void {
  const message = text?.trim();
  if (!message) {
    return;
  }
  assistantSpeaker?.(message);
}
