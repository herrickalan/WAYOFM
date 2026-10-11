import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_RADIO_STATE, LIVE_RADIO_POLICY, LiveRadioController, type PlaybackSnapshot, type RadioState, type RadioTransport } from '../src/services/liveRadio';

const stream = 'https://streaming.wayofm.org/wayo-192';
async function settle() { for (let i = 0; i < 5; i++) await Promise.resolve(); }

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function fixture(overrides: Partial<RadioTransport> = {}) {
  let now = 0;
  let stops = 0;
  let state: RadioState = INITIAL_RADIO_STATE;
  const starts: string[] = [];
  const status: PlaybackSnapshot = { playing: false, isLoaded: false, isBuffering: true, currentTime: 0 };
  const radio = new LiveRadioController({
    prepare: async () => {}, resolveUrl: async () => stream,
    start: url => { starts.push(url); }, stop: () => { stops++; },
    readStatus: () => status, ...overrides,
  }, next => { state = next; }, () => now);
  return {
    radio, starts, status,
    get state() { return state; }, get stops() { return stops; },
    step(ms: number, patch: Partial<PlaybackSnapshot> = {}) {
      now += ms;
      Object.assign(status, patch);
      radio.tick();
    },
    async connect() { radio.toggle(); await settle(); },
    play() {
      Object.assign(status, { playing: true, isLoaded: true, isBuffering: false, currentTime: 0, timeControlStatus: 'playing' });
      radio.update(status);
      this.step(500, { currentTime: 0.5 });
      assert.equal(state.phase, 'playing');
    },
  };
}

test('times out audio-session setup and URL resolution, ignoring late results', async () => {
  for (const stage of ['prepare', 'resolveUrl'] as const) {
    const pending = deferred<string>();
    const f = fixture(stage === 'prepare'
      ? { prepare: () => pending.promise.then(() => {}) }
      : { resolveUrl: () => pending.promise });
    await f.connect();
    f.step(LIVE_RADIO_POLICY.connectionTimeoutMs);
    assert.equal(f.state.phase, 'retrying', stage);
    pending.resolve(stream);
    await settle();
    assert.equal(f.starts.length, 0, `expired ${stage} must not start audio`);
    f.radio.pause();
  }
});

test('loaded and playing flags alone cannot hide a startup with no audio progress', async () => {
  const f = fixture();
  await f.connect();
  f.step(500, { isLoaded: true, playing: true, isBuffering: false });
  assert.equal(f.state.phase, 'connecting');
  f.step(LIVE_RADIO_POLICY.connectionTimeoutMs);
  assert.equal(f.state.phase, 'retrying');
});

test('polling detects a frozen playback clock and a fresh connection recovers', async () => {
  const f = fixture();
  await f.connect();
  f.play();
  const stoppedBeforeStall = f.stops;
  // No new native events and flags still claim playback is healthy.
  f.step(LIVE_RADIO_POLICY.stallTimeoutMs);
  assert.equal(f.state.phase, 'retrying');
  assert.equal(f.stops, stoppedBeforeStall + 1);
  f.step(LIVE_RADIO_POLICY.retryDelaysMs[0]);
  await settle();
  assert.equal(f.starts.length, 2);
  f.play();
  assert.equal(f.state.phase, 'playing');
});

test('buffering after playback is bounded by the stall timeout', async () => {
  const f = fixture();
  await f.connect();
  f.play();
  f.step(500, { playing: false, isBuffering: true, timeControlStatus: 'waitingToPlayAtSpecifiedRate' });
  assert.equal(f.state.phase, 'buffering');
  f.step(LIVE_RADIO_POLICY.stallTimeoutMs);
  assert.equal(f.state.phase, 'retrying');
});

test('cancel releases a buffering connection and prevents late asynchronous playback', async () => {
  const pending = deferred<string>();
  const f = fixture({ resolveUrl: () => pending.promise });
  await f.connect();
  const stops = f.stops;
  f.radio.toggle();
  assert.equal(f.state.phase, 'idle');
  assert.equal(f.stops, stops + 1);
  pending.resolve(stream);
  await settle();
  f.step(60000);
  assert.equal(f.starts.length, 0);
  assert.equal(f.state.phase, 'idle');

  const active = fixture();
  await active.connect();
  active.play();
  active.step(LIVE_RADIO_POLICY.stallTimeoutMs);
  active.radio.toggle();
  active.step(60000);
  await settle();
  assert.equal(active.starts.length, 1, 'cancel during retry backoff must not reconnect');
  assert.equal(active.state.phase, 'idle');
});

test('repeated stream errors stop after two retries and manual retry gets a fresh budget', async () => {
  const f = fixture();
  await f.connect();
  for (const delay of LIVE_RADIO_POLICY.retryDelaysMs) {
    f.radio.update({ ...f.status, error: 'Network unavailable' });
    assert.equal(f.state.phase, 'retrying');
    f.step(delay);
    await settle();
  }
  f.radio.update({ ...f.status, error: 'Network unavailable' });
  assert.equal(f.starts.length, 3);
  assert.equal(f.state.phase, 'failed');
  assert.match(f.state.error!, /try again or listen on the website/);
  f.step(60000);
  assert.equal(f.starts.length, 3);
  await f.connect();
  assert.equal(f.state.phase, 'connecting');
  assert.equal(f.state.retries, 0);
  assert.equal(f.state.error, null);
});

test('brief recoveries cannot create an unlimited reconnect loop', async () => {
  const f = fixture();
  await f.connect();
  for (const delay of LIVE_RADIO_POLICY.retryDelaysMs) {
    f.play();
    f.step(LIVE_RADIO_POLICY.stallTimeoutMs);
    f.step(delay);
    await settle();
  }
  f.play();
  f.step(LIVE_RADIO_POLICY.stallTimeoutMs);
  assert.equal(f.state.phase, 'failed');
  assert.equal(f.starts.length, 3);
});

test('sustained playback restores the budget for a later connection loss', async () => {
  const f = fixture();
  await f.connect();
  f.radio.update({ ...f.status, error: 'Network unavailable' });
  f.step(LIVE_RADIO_POLICY.retryDelaysMs[0]);
  await settle();
  f.play();
  for (let i = 0; i < 60; i++) f.step(500, { currentTime: f.status.currentTime + 0.5 });
  assert.equal(f.state.retries, 0);
  f.step(LIVE_RADIO_POLICY.stallTimeoutMs);
  assert.equal(f.state.phase, 'retrying');
  assert.equal(f.state.retries, 1);
});

test('system pauses prevent reconnects and native resume starts at the live edge', async () => {
  const f = fixture();
  await f.connect();
  f.play();
  const stops = f.stops;
  f.radio.update({ ...f.status, playing: false, timeControlStatus: 'paused' });
  assert.equal(f.state.phase, 'idle');
  assert.equal(f.stops, stops, 'keep the native player registered for lock-screen resume');
  f.step(60000);
  assert.equal(f.starts.length, 1);
  f.radio.update({ ...f.status, playing: true, timeControlStatus: 'playing' });
  await settle();
  assert.equal(f.starts.length, 2);
  f.play();
});

test('returning from suspended background timers does not restart healthy native audio', async () => {
  const f = fixture();
  await f.connect();
  f.play();
  f.radio.setForeground(false);
  f.step(60000, { currentTime: 60.5 });
  f.radio.setForeground(true);
  f.radio.tick();
  f.step(500, { currentTime: 61 });
  assert.equal(f.state.phase, 'playing');
  assert.equal(f.starts.length, 1);
});

test('disposing the screen invalidates pending audio-session work', async () => {
  const pending = deferred<void>();
  const f = fixture({ prepare: () => pending.promise });
  await f.connect();
  f.radio.dispose();
  pending.resolve();
  await settle();
  f.step(60000);
  assert.equal(f.starts.length, 0);
});
