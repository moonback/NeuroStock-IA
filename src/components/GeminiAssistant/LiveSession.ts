import { FunctionCallRequest, LiveSessionState } from './types';
import { buildSystemPrompt } from './systemPrompt';
import { getToolsDeclaration, isDestructiveTool } from './tools';
import { AudioManager, int16ArrayToBase64 } from './AudioManager';
import { AssistantContext } from './types';

const GEMINI_LIVE_MODEL = 'gemini-2.5-flash-preview-native-audio-dialog';
const WEBSOCKET_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

type SetupMessage = {
  setup: {
    model: string;
    generationConfig: {
      responseModalities: string[];
      speechConfig?: {
        voiceConfig?: {
          prebuiltVoiceConfig?: {
            voiceName: string;
          };
        };
      };
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    tools?: Array<{
      functionDeclarations: Array<{
        name: string;
        description: string;
        parameters: unknown;
      }>;
    }>;
  };
};

type ContentMessage = {
  realtimeInput: {
    mediaChunks: Array<{
      mimeType: string;
      data: string;
    }>;
  };
};

type ToolResponseMessage = {
  toolResponse: {
    functionResponses: Array<{
      id: string;
      name: string;
      response: unknown;
    }>;
  };
};

type IncomingMessage = {
  sessionResumptionUpdate?: {
    newHandle: string;
  };
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
        functionCall?: {
          id: string;
          name: string;
          args: Record<string, unknown>;
        };
      }>;
    };
    turnComplete?: boolean;
  };
  toolResponse?: {
    functionResponses: Array<{
      id: string;
      name: string;
      response: unknown;
      error?: string;
    }>;
  };
  setupComplete?: boolean;
  error?: {
    code: number;
    message: string;
  };
};

type LiveSessionCallbacks = {
  onConnect: () => void;
  onDisconnect: () => void;
  onSpeakingStart: () => void;
  onSpeakingEnd: () => void;
  onListeningStart: () => void;
  onListeningEnd: () => void;
  onFunctionCall: (call: FunctionCallRequest, isDestructive: boolean) => Promise<unknown>;
  onError: (error: string) => void;
};

export class LiveSession {
  private websocket: WebSocket | null = null;
  private audioManager: AudioManager;
  private state: LiveSessionState = {
    isConnected: false,
    isReady: false,
    error: null,
  };
  private callbacks: LiveSessionCallbacks | null = null;
  private context: AssistantContext | null = null;
  private isProcessingTurn = false;
  private pendingFunctionCalls: FunctionCallRequest[] = [];
  private sessionHandle: string | null = null;

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  setCallbacks(callbacks: LiveSessionCallbacks): void {
    this.callbacks = callbacks;
  }

  setContext(context: AssistantContext): void {
    this.context = context;
  }

  async connect(apiKey: string): Promise<void> {
    if (this.websocket) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${WEBSOCKET_URL}?key=${encodeURIComponent(apiKey)}`;

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          void this.sendSetup(apiKey);
        };

        this.websocket.onmessage = async (event) => {
          try {
            const message: IncomingMessage = JSON.parse(event.data);
            await this.handleMessage(message);
          } catch (err) {
            console.error('Erreur parsing message:', err);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('Erreur WebSocket:', error);
          this.callbacks?.onError('Erreur de connexion WebSocket');
          reject(new Error('Erreur de connexion'));
        };

        this.websocket.onclose = (event) => {
          this.state.isConnected = false;
          this.state.isReady = false;
          this.callbacks?.onDisconnect();
        };

        const setupTimeout = setTimeout(() => {
          reject(new Error('Timeout de connexion'));
          this.disconnect();
        }, 15000);

        const originalOnMessage = this.websocket.onmessage;
        this.websocket.onmessage = async (event) => {
          clearTimeout(setupTimeout);
          this.websocket!.onmessage = originalOnMessage;
          try {
            const message: IncomingMessage = JSON.parse(event.data);
            await this.handleMessage(message);
            resolve();
          } catch (err) {
            console.error('Erreur parsing message:', err);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private sendSetup(apiKey: string): void {
    if (!this.websocket || !this.context) return;

    const systemPrompt = buildSystemPrompt(this.context);
    const tools = getToolsDeclaration();

    const setupMsg: SetupMessage = {
      setup: {
        model: `models/${GEMINI_LIVE_MODEL}`,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Orus',
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    };

    this.websocket.send(JSON.stringify(setupMsg));
  }

  private async handleMessage(message: IncomingMessage): Promise<void> {
    if (message.error) {
      console.error('Erreur Gemini:', message.error);
      this.callbacks?.onError(message.error.message);
      return;
    }

    if (message.setupComplete) {
      this.state.isConnected = true;
      this.state.isReady = true;
      this.callbacks?.onConnect();
      return;
    }

    if (message.sessionResumptionUpdate) {
      this.sessionHandle = message.sessionResumptionUpdate.newHandle;
    }

    if (message.serverContent) {
      const { modelTurn, turnComplete } = message.serverContent;

      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.inlineData?.mimeType?.startsWith('audio/')) {
            this.callbacks?.onSpeakingStart();
            await this.audioManager.playAudioFromBase64(part.inlineData.data);
            this.callbacks?.onSpeakingEnd();
          }

          if (part.functionCall) {
            const call: FunctionCallRequest = {
              id: part.functionCall.id,
              name: part.functionCall.name,
              args: part.functionCall.args,
            };
            this.pendingFunctionCalls.push(call);
          }
        }
      }

      if (turnComplete) {
        await this.processPendingFunctionCalls();
      }
    }
  }

  private async processPendingFunctionCalls(): Promise<void> {
    if (this.pendingFunctionCalls.length === 0 || this.isProcessingTurn) return;

    this.isProcessingTurn = true;
    const calls = [...this.pendingFunctionCalls];
    this.pendingFunctionCalls = [];

    const responses: Array<{ id: string; name: string; response: unknown; error?: string }> = [];

    for (const call of calls) {
      try {
        const isDestructive = isDestructiveTool(call.name);
        const result = await this.callbacks?.onFunctionCall(call, isDestructive);
        responses.push({
          id: call.id,
          name: call.name,
          response: result ?? { success: true },
        });
      } catch (error) {
        responses.push({
          id: call.id,
          name: call.name,
          response: { error: true },
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    const toolResponseMsg: ToolResponseMessage = {
      toolResponse: {
        functionResponses: responses,
      },
    };

    this.websocket?.send(JSON.stringify(toolResponseMsg));
    this.isProcessingTurn = false;
  }

  sendAudioChunk(pcmData: Int16Array): void {
    if (!this.websocket || !this.state.isReady) return;

    const base64Audio = int16ArrayToBase64(pcmData);

    const msg: ContentMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          },
        ],
      },
    };

    this.websocket.send(JSON.stringify(msg));
  }

  sendText(text: string): void {
    if (!this.websocket || !this.state.isReady) return;

    const msg: ContentMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'text/plain',
            data: btoa(text),
          },
        ],
      },
    };

    this.websocket.send(JSON.stringify(msg));
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.state.isConnected = false;
    this.state.isReady = false;
    this.sessionHandle = null;
    this.pendingFunctionCalls = [];
    this.isProcessingTurn = false;
  }

  getState(): LiveSessionState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.isConnected && this.state.isReady;
  }
}
