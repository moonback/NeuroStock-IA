type SpeakerState = {
  audioContext: AudioContext | null;
  stream: MediaStream | null;
  pcmReady: boolean;
};

class AudioManager {
  private static instance: AudioManager;
  private state: SpeakerState = {
    audioContext: null,
    stream: null,
    pcmReady: false,
  };

  static getInstance() {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  getAudioContext(): AudioContext {
    if (!this.state.audioContext) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.state.audioContext = new Ctx();
    }
    return this.state.audioContext!;
  }

  async ensureMicrophone(): Promise<MediaStream> {
    if (this.state.stream) return this.state.stream;
    this.state.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return this.state.stream;
  }

  async close() {
    try {
      this.state.stream?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    this.state.stream = null;
    try {
      await this.state.audioContext?.close();
    } catch {
      // ignore
    }
    this.state.audioContext = null;
    this.state.pcmReady = false;
  }
}

export const audioManager = AudioManager.getInstance();

