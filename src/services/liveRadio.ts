export interface PlaybackSnapshot {
  playing: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  currentTime: number;
  error?: string | null;
  didJustFinish?: boolean;
  timeControlStatus?: string;
}

export type RadioPhase = 'idle' | 'connecting' | 'playing' | 'buffering' | 'retrying' | 'failed';
export interface RadioState { phase: RadioPhase; retries: number; error: string | null }
export const INITIAL_RADIO_STATE: RadioState = { phase: 'idle', retries: 0, error: null };

export const LIVE_RADIO_POLICY = {
  connectionTimeoutMs: 15000,
  stallTimeoutMs: 12000,
  stablePlaybackMs: 30000,
  retryDelaysMs: [1000, 2000],
} as const;

export interface RadioTransport {
  prepare(): Promise<void>;
  resolveUrl(): Promise<string>;
  start(url: string): void;
  stop(): void;
  readStatus(): PlaybackSnapshot;
}

// Keep listening intent separate from the player's buffering/playing flags.
// A stalled native player can retain those flags without delivering audio.
export class LiveRadioController {
  private state = INITIAL_RADIO_STATE;
  private wanted = false;
  private systemPaused = false;
  private disposed = false;
  private foreground = true;
  private generation = 0;
  private sourceStarted = false;
  private hasPlayed = false;
  private deadline = 0;
  private progressAt = 0;
  private lastPosition: number | null = null;
  private stableSince: number | null = null;
  private retryAt = 0;
  private retries = 0;

  constructor(
    private transport: RadioTransport,
    private publish: (state: RadioState) => void,
    private now: () => number = Date.now,
  ) {}

  toggle() {
    if (this.disposed) return;
    if (this.wanted) { this.pause(); return; }
    this.wanted = true;
    this.systemPaused = false;
    this.retries = 0;
    void this.launchAttempt();
  }

  pause() {
    if (this.disposed) return;
    this.wanted = false;
    this.systemPaused = false;
    this.sourceStarted = false;
    this.deadline = 0;
    this.generation++;
    this.stopTransport();
    this.setState('idle');
  }

  private setState(phase: RadioPhase, error: string | null = null) {
    const next = { phase, retries: this.retries, error };
    if (this.state.phase === phase && this.state.retries === next.retries && this.state.error === error) return;
    this.state = next;
    this.publish(next);
  }

  private stopTransport() {
    // The source may already have been released by the native audio module.
    try { this.transport.stop(); } catch {}
  }

  private async launchAttempt() {
    if (!this.wanted || this.disposed) return;
    const token = ++this.generation;
    this.sourceStarted = false;
    this.hasPlayed = false;
    this.lastPosition = null;
    this.stableSince = null;
    this.progressAt = this.now();
    // Include audio-session setup and URL resolution in the timeout.
    this.deadline = this.now() + LIVE_RADIO_POLICY.connectionTimeoutMs;
    this.stopTransport();
    this.setState(this.retries ? 'retrying' : 'connecting');
    try {
      await this.transport.prepare();
      if (!this.isCurrent(token)) return;
      const url = await this.transport.resolveUrl();
      if (!this.isCurrent(token)) return;
      this.sourceStarted = true;
      this.transport.start(url);
    } catch {
      if (this.isCurrent(token)) this.failAttempt();
    }
  }

  private isCurrent(token: number) {
    return this.wanted && !this.disposed && token === this.generation;
  }

  private failAttempt() {
    if (!this.wanted || this.disposed) return;
    this.generation++;
    this.sourceStarted = false;
    this.deadline = 0;
    this.stopTransport();
    const delay = LIVE_RADIO_POLICY.retryDelaysMs[this.retries];
    if (delay === undefined) {
      this.wanted = false;
      this.setState('failed', 'The live broadcast could not be played. We tried three connections. Check your connection, then try again or listen on the website.');
      return;
    }
    this.retries++;
    this.retryAt = this.now() + delay;
    this.setState('retrying');
  }

  update(status: PlaybackSnapshot) {
    if (this.disposed) return;
    if (!this.wanted) {
      // Keep native controls available after a system pause. A native resume
      // requests a fresh live connection rather than replaying a paused buffer.
      if (this.systemPaused && status.playing && status.isLoaded && status.timeControlStatus === 'playing') this.toggle();
      return;
    }
    if (!this.sourceStarted) return;
    if (status.error || status.didJustFinish) { this.failAttempt(); return; }
    // Respect iOS lock-screen pauses and audio-session interruptions.
    if (this.hasPlayed && status.timeControlStatus === 'paused' && status.isLoaded && !status.isBuffering && !status.playing) {
      this.wanted = false;
      this.systemPaused = true;
      this.sourceStarted = false;
      this.deadline = 0;
      this.generation++;
      this.setState('idle');
      return;
    }
    const now = this.now();
    const position = Number.isFinite(status.currentTime) ? status.currentTime : null;
    const advancing = position !== null && this.lastPosition !== null && position > this.lastPosition + 0.01;
    this.lastPosition = position;
    if (advancing && status.playing && status.isLoaded && !status.isBuffering) {
      this.hasPlayed = true;
      this.deadline = 0;
      this.progressAt = now;
      this.stableSince ??= now;
      // Short bursts of sound must not grant unlimited retries.
      if (now - this.stableSince >= LIVE_RADIO_POLICY.stablePlaybackMs) this.retries = 0;
      this.setState('playing');
    } else if (this.hasPlayed && (status.isBuffering || now - this.progressAt > 1500)) {
      this.stableSince = null;
      this.setState('buffering');
    }
  }

  tick() {
    if (!this.wanted || this.disposed || !this.foreground) return;
    if (!this.sourceStarted && this.deadline === 0 && this.state.phase === 'retrying') {
      if (this.now() >= this.retryAt) void this.launchAttempt();
      return;
    }
    if (this.sourceStarted) {
      try { this.update(this.transport.readStatus()); } catch { this.failAttempt(); }
    }
    if (!this.wanted || this.disposed) return;
    if (this.sourceStarted && this.hasPlayed && this.now() - this.progressAt >= LIVE_RADIO_POLICY.stallTimeoutMs) {
      this.failAttempt();
    } else if (this.deadline !== 0 && this.now() >= this.deadline) {
      this.failAttempt();
    }
  }

  setForeground(active: boolean) {
    this.foreground = active;
    if (active && this.wanted) {
      // JS timers can be suspended while native audio continues in the background.
      this.progressAt = this.now();
      this.lastPosition = null;
      this.stableSince = null;
      if (this.deadline !== 0) this.deadline = this.now() + LIVE_RADIO_POLICY.connectionTimeoutMs;
    }
  }

  dispose() {
    this.disposed = true;
    this.wanted = false;
    this.generation++;
  }
}
