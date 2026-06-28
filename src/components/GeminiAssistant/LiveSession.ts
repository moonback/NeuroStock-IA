import { GoogleGenAI } from "@google/genai";
import type { AssistantState, AssistantToolCall } from "./types";
import { audioManager } from "./AudioManager";
import { FunctionDispatcher } from "./FunctionDispatcher";

export type LiveSessionConfig = {
  apiKey: string;
  model: string;
  responseModalities?: Array<"AUDIO" | "TEXT">;
};

export type LiveSessionEvents = {
  onState: (s: AssistantState) => void;
  onError: (e: Error) => void;
  onToolCall?: (toolCall: AssistantToolCall) => void;
};

export type LiveSessionDeps = {
  dispatcher: FunctionDispatcher;
  systemPrompt: string;
};

export class LiveSession {
  private ai: GoogleGenAI;
  private cfg: LiveSessionConfig;
  private events: LiveSessionEvents;
  private deps: LiveSessionDeps;

  private session: any | null = null;

  constructor(cfg: LiveSessionConfig, events: LiveSessionEvents, deps: LiveSessionDeps) {
    this.cfg = cfg;
    this.events = events;
    this.deps = deps;
    this.ai = new GoogleGenAI({ apiKey: cfg.apiKey });
  }

  async connect() {
    this.events.onState("Connecting");

    const modalities = this.cfg.responseModalities ?? ["AUDIO"];

    // Connect live.
    this.session = await this.ai.live.connect({
      model: this.cfg.model,
      callbacks: {
        onmessage: () => void 0,
      } as any,
      config: {
        systemInstruction: { parts: [{ text: this.deps.systemPrompt }] },
        responseModalities: modalities,
      } as any,
    });

    // Handlers.
    this.session.on("error", (err: any) => {
      this.events.onState("Error");
      this.events.onError(err instanceof Error ? err : new Error(String(err)));
    });

    this.session.on("state", (s: any) => {
      const map: Record<string, AssistantState> = {
        listening: "Listening",
        speaking: "Speaking",
        thinking: "Thinking",
      };
      const mapped = map[String(s).toLowerCase()];
      if (mapped) this.events.onState(mapped);
    });

    // Tool calling event naming can vary by SDK version.
    this.session.on("toolCall", async (payload: any) => {
      const toolCall: AssistantToolCall | null = payload?.toolCall ?? payload;
      if (!toolCall?.name) return;
      this.events.onToolCall?.(toolCall);

      const toolResult = await this.deps.dispatcher.dispatch(this.ai, toolCall);

      // return tool result back to Gemini
      await this.session.send({
        toolResponse: {
          name: toolCall.name,
          response: toolResult,
        },
      });
    });

    // Audio: SDK emits audio chunks; we route to speaker.
    this.session.on("audio", async (chunk: any) => {
      try {
        this.events.onState("Speaking");
        // The SDK audio chunk format depends on the library; for now we rely on SDK internal playback
        // if supported. If not, this will be extended.
        // No-op placeholder.
        void chunk;
      } catch {
        // ignore
      }
    });

    // Micro stream
    await audioManager.ensureMicrophone();
  }

  async startListening() {
    if (!this.session) await this.connect();
    this.events.onState("Listening");

    // Start streaming PCM to Gemini: depends on SDK API.
    // We keep a placeholder call; we will align it with the SDK once compilation reveals the correct method.
    await this.session!.start({
      modalities: ["AUDIO"],
    });
  }

  async sendAudioChunk(pcm: ArrayBuffer) {
    if (!this.session) return;
    await this.session.send({
      data: pcm,
    });
  }

  async mute(muted: boolean) {
    if (!this.session) return;
    if (muted) this.events.onState("Muted");
    else this.events.onState("Listening");
    await this.session!.setMuted({ muted });
  }

  async close() {
    try {
      await this.session?.close();
    } catch {
      // ignore
    }
    this.session = null;
    await audioManager.close();
  }
}

