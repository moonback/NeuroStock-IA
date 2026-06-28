import { GoogleGenAI } from '@google/genai';
import { AudioManager, int16ToBase64 } from './AudioManager';
import type { GeminiToolCall, GeminiToolResult } from './types';
import { buildSystemPrompt } from './systemPrompt';
import { getToolsDeclaration } from './tools';
import type { AssistantExternalContext } from './types';

const MODEL = 'gemini-3.1-flash-live-preview';

type LiveCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onAudio?: () => void;
  onThinking?: () => void;
  onFunctionCall?: (call: GeminiToolCall) => Promise<GeminiToolResult>;
  onError?: (message: string) => void;
};

export class LiveSession {
  private ai: GoogleGenAI | null = null;
  private session: any = null;
  private reconnectAttempts = 0;
  private closedByUser = false;

  constructor(private readonly audio = AudioManager.getInstance(), private callbacks: LiveCallbacks = {}) {}

  setCallbacks(callbacks: LiveCallbacks): void { this.callbacks = callbacks; }
  isConnected(): boolean { return Boolean(this.session); }

  async connect(context: AssistantExternalContext): Promise<void> {
    this.closedByUser = false;
    this.ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    this.session = await (this.ai as any).live.connect({
      model: MODEL,
      config: {
        responseModalities: ['AUDIO'],
        systemInstruction: { parts: [{ text: buildSystemPrompt(context) }] },
        tools: [{ functionDeclarations: getToolsDeclaration() }],
      },
      callbacks: {
        onopen: () => this.callbacks.onOpen?.(),
        onclose: () => void this.handleClose(context),
        onerror: (event: unknown) => this.callbacks.onError?.(event instanceof Error ? event.message : 'Erreur Gemini Live'),
        onmessage: (message: unknown) => void this.handleMessage(message),
      },
    });

    this.audio.onMicrophoneChunk((pcm) => this.sendAudio(pcm));
  }

  async startAudio(): Promise<void> { await this.audio.startMicrophone(); }

  sendAudio(pcm: Int16Array): void {
    if (!this.session) return;
    this.session.sendRealtimeInput?.({ media: { mimeType: 'audio/pcm;rate=16000', data: int16ToBase64(pcm) } });
  }

  async sendToolResult(result: GeminiToolResult): Promise<void> {
    this.session?.sendToolResponse?.({ functionResponses: [{ id: result.id, name: result.name, response: result.response }] });
  }

  async disconnect(): Promise<void> {
    this.closedByUser = true;
    this.audio.onMicrophoneChunk(null);
    this.audio.stopMicrophone();
    this.session?.close?.();
    this.session = null;
    this.callbacks.onClose?.();
  }

  private async handleMessage(message: any): Promise<void> {
    const parts = message?.serverContent?.modelTurn?.parts ?? message?.modelTurn?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        this.callbacks.onAudio?.();
        await this.audio.playBase64Pcm(part.inlineData.data);
      }
      if (part.functionCall && this.callbacks.onFunctionCall) {
        this.callbacks.onThinking?.();
        const result = await this.callbacks.onFunctionCall({ id: part.functionCall.id ?? crypto.randomUUID(), name: part.functionCall.name, args: part.functionCall.args ?? {} });
        await this.sendToolResult(result);
      }
    }
  }

  private async handleClose(context: AssistantExternalContext): Promise<void> {
    this.session = null;
    this.callbacks.onClose?.();
    if (this.closedByUser || this.reconnectAttempts >= 3) return;
    const delay = 500 * 2 ** this.reconnectAttempts;
    this.reconnectAttempts += 1;
    window.setTimeout(() => void this.connect(context).catch((error: unknown) => this.callbacks.onError?.(error instanceof Error ? error.message : 'Reconnexion impossible')), delay);
  }
}
