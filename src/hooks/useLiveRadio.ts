import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { resolveLiveStream } from '../services/station';
import { INITIAL_RADIO_STATE, LiveRadioController } from '../services/liveRadio';

export function useLiveRadio() {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const [state, setState] = useState(INITIAL_RADIO_STATE);
  const controller = useRef<LiveRadioController | null>(null);

  useEffect(() => {
    const radio = new LiveRadioController({
      prepare: () => setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }),
      resolveUrl: resolveLiveStream,
      start: url => {
        // Every connection starts at the live edge, including automatic retries.
        player.replace({ uri: url });
        if (Platform.OS !== 'web') {
          player.setActiveForLockScreen(true, { title: 'WAYO 104.3FM', artist: 'Live from Rochester, NY' }, {
            showSeekBackward: false, showSeekForward: false,
          });
        }
        player.play();
      },
      stop: () => {
        try { player.pause(); } finally { player.replace(null); }
        if (Platform.OS !== 'web') player.clearLockScreenControls();
      },
      readStatus: () => player.currentStatus,
    }, setState);
    controller.current = radio;
    radio.setForeground(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
    const statusListener = player.addListener('playbackStatusUpdate', status => radio.update(status));
    const appListener = AppState.addEventListener('change', next => radio.setForeground(next === 'active'));
    // Poll too: a frozen player may stop publishing status updates entirely.
    const timer = setInterval(() => radio.tick(), 500);
    return () => {
      radio.dispose();
      clearInterval(timer);
      statusListener.remove();
      appListener.remove();
      controller.current = null;
    };
  }, [player]);

  const pause = useCallback(() => controller.current?.pause(), []);
  const toggle = useCallback(async () => controller.current?.toggle(), []);
  const busy = ['connecting', 'buffering', 'retrying'].includes(state.phase);
  const label = state.phase === 'retrying' ? `Reconnecting to WAYO… (${state.retries}/2)`
    : state.phase === 'buffering' ? 'Broadcast interrupted. Reconnecting…'
    : state.phase === 'connecting' ? 'Connecting to WAYO…'
    : state.phase === 'playing' ? 'You’re listening live'
    : state.phase === 'failed' ? 'Broadcast unavailable' : 'Live from Rochester, NY';

  return {
    playing: state.phase === 'playing',
    busy,
    error: state.error,
    toggle,
    pause,
    label,
  };
}

export type LiveRadio = ReturnType<typeof useLiveRadio>;
