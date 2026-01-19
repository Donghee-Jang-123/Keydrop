export class AudioEngine {
  private static _instance: AudioEngine | null = null;
  public readonly ctx: AudioContext;

  private constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  static get instance() {
    if (!this._instance) this._instance = new AudioEngine();
    return this._instance;
  }

  async resume() {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  get state() {
    return this.ctx.state;
  }
}