export class AudioManager {
  private audioContext: AudioContext | null = null;
  private microphoneStream: MediaStream | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private speakerDestination: AudioDestinationNode | null = null;
  private audioBuffers: Int16Array[] = [];
  private isRecording = false;
  private onAudioData: ((data: Int16Array) => void) | null = null;

  private static INSTANCE: AudioManager | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager.INSTANCE) {
      AudioManager.INSTANCE = new AudioManager();
    }
    return AudioManager.INSTANCE;
  }

  private constructor() {}

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.speakerDestination = this.audioContext.destination;
    }
  }

  async startMicrophone(): Promise<void> {
    if (this.isRecording || !this.audioContext) return;

    try {
      this.audioBuffers = [];
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      this.microphoneSource = this.audioContext.createMediaStreamSource(
        this.microphoneStream,
      );

      try {
        this.workletNode = new AudioWorkletNode(
          this.audioContext,
          'pcm-processor',
        );
      } catch {
        await this.audioContext.audioWorklet.addModule(
          URL.createObjectURL(
            new Blob(
              [
                `
              class PCMProcessor extends AudioWorkletProcessor {
                process(inputs) {
                  const input = inputs[0];
                  if (input && input[0]) {
                    const floatData = input[0];
                    const int16Data = new Int16Array(floatData.length);
                    for (let i = 0; i < floatData.length; i++) {
                      int16Data[i] = Math.max(-32768, Math.min(32767, Math.round(floatData[i] * 32768)));
                    }
                    this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
                  }
                  return true;
                }
              }
              registerProcessor('pcm-processor', PCMProcessor);
            `,
              ],
              { type: 'application/javascript' },
            ),
          ),
        );
        this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');
      }

      this.workletNode.port.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const int16Data = new Int16Array(event.data);
          if (this.onAudioData) {
            this.onAudioData(int16Data);
          }
          this.audioBuffers.push(int16Data);
        }
      };

      this.microphoneSource.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);
      this.isRecording = true;
    } catch (error) {
      console.error('Erreur microphone:', error);
      throw new Error(
        "Impossible d'accéder au microphone. Vérifiez les permissions.",
      );
    }
  }

  stopMicrophone(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.microphoneSource) {
      this.microphoneSource.disconnect();
      this.microphoneSource = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }

    this.isRecording = false;
  }

  async playAudio(pcmData: Int16Array): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) return;

    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 32768;
    }

    const audioBuffer = this.audioContext.createBuffer(
      1,
      floatData.length,
      16000,
    );
    audioBuffer.copyToChannel(floatData, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  async playAudioFromBase64(base64Audio: string): Promise<void> {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Data = new Int16Array(bytes.buffer);
      return this.playAudio(int16Data);
    } catch (error) {
      console.error('Erreur lecture audio:', error);
    }
  }

  onAudioChunk(callback: (data: Int16Array) => void): void {
    this.onAudioData = callback;
  }

  getRecordedAudio(): Int16Array {
    const totalLength = this.audioBuffers.reduce(
      (sum, buf) => sum + buf.length,
      0,
    );
    const result = new Int16Array(totalLength);
    let offset = 0;
    for (const buf of this.audioBuffers) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return result;
  }

  clearRecordedAudio(): void {
    this.audioBuffers = [];
  }

  isMicrophoneActive(): boolean {
    return this.isRecording;
  }

  async resumeContext(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  destroy(): void {
    this.stopMicrophone();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    this.speakerDestination = null;
    this.onAudioData = null;
    this.audioBuffers = [];
  }
}

export function int16ArrayToBase64(data: Int16Array): string {
  const bytes = new Uint8Array(data.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
