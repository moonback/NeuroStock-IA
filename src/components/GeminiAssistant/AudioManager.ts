export type PcmChunkHandler = (pcm: Int16Array) => void;

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export class AudioManager {
  private static instance: AudioManager | null = null;
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onChunk: PcmChunkHandler | null = null;
  private muted = false;
  private lastSentAt = 0;

  static getInstance(): AudioManager {
    AudioManager.instance ??= new AudioManager();
    return AudioManager.instance;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    this.context ??= new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    if (this.context.state === 'suspended') await this.context.resume();
  }

  onMicrophoneChunk(handler: PcmChunkHandler | null): void {
    this.onChunk = handler;
  }

  async startMicrophone(): Promise<void> {
    await this.initialize();
    if (!this.context || this.stream) return;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, sampleRate: INPUT_SAMPLE_RATE } });
    this.source = this.context.createMediaStreamSource(this.stream);
    this.processor = this.context.createScriptProcessor(2048, 1, 1);
    this.processor.onaudioprocess = (event) => {
      if (this.muted) return;
      const now = Date.now();
      if (now - this.lastSentAt < 20) return;
      this.lastSentAt = now;
      this.onChunk?.(floatToPcm16(event.inputBuffer.getChannelData(0)));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stopMicrophone(): void {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.processor = null;
    this.source = null;
    this.stream = null;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  async playPcm16(pcm: Int16Array, sampleRate = OUTPUT_SAMPLE_RATE): Promise<void> {
    await this.initialize();
    if (!this.context) return;
    const buffer = this.context.createBuffer(1, pcm.length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i += 1) channel[i] = Math.max(-1, Math.min(1, pcm[i] / 32768));
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start();
    await new Promise<void>((resolve) => { source.onended = () => resolve(); });
  }

  async playBase64Pcm(base64: string): Promise<void> {
    await this.playPcm16(base64ToInt16(base64));
  }

  async destroy(): Promise<void> {
    this.stopMicrophone();
    if (this.context && this.context.state !== 'closed') await this.context.close();
    this.context = null;
    this.onChunk = null;
  }
}

export function floatToPcm16(floatData: Float32Array): Int16Array {
  const pcm = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i += 1) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(floatData[i] * 32767)));
  return pcm;
}

export function int16ToBase64(data: Int16Array): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}
