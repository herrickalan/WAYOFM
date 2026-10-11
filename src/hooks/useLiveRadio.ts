import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { resolveLiveStream } from '../services/station';

export function useLiveRadio() {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const stream = useRef<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimeoutRef = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
  }, []);

  const pause = useCallback(() => {
    request.current++;
    clearTimeoutRef();
    setConnecting(false);
    player.pause();
  }, [player, clearTimeoutRef]);

  const toggle = useCallback(async () => {
    if (player.playing || connecting) { pause(); return; }
    const token = ++request.current;
    setConnecting(true);
    setError(null);
    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
      const url = stream.current || await resolveLiveStream();
      if (token !== request.current) return;
      stream.current = url;
      // Replace on resume so a paused live stream returns to the live edge.
      player.replace({ uri: url });
      if (Platform.OS !== 'web') {
        player.setActiveForLockScreen(true, { title: 'WAYO 104.3FM', artist: 'Live from Rochester, NY' }, {
          showSeekBackward: false, showSeekForward: false,
        });
      }
      player.play();
      timeout.current = setTimeout(() => {
        if (token !== request.current) return;
        player.pause();
        setConnecting(false);
        stream.current = null;
        setError('The stream is taking too long to connect. Try again or listen on the website.');
      }, 20000);
    } catch (cause) {
      if (token !== request.current) return;
      clearTimeoutRef();
      setConnecting(false);
      stream.current = null;
      setError(cause instanceof Error ? cause.message : 'Unable to start the live broadcast. Please try again.');
    }
  }, [player, connecting, pause, clearTimeoutRef]);

  useEffect(() => {
    if (status.error) {
      pause();
      stream.current = null;
      setError('The live broadcast could not be played. Please try again or listen on the website.');
    }
  }, [status.error, pause]);

  useEffect(() => {
    if (status.isLoaded && status.playing && !status.isBuffering) {
      clearTimeoutRef();
      setConnecting(false);
    }
  }, [status.isLoaded, status.playing, status.isBuffering, clearTimeoutRef]);

  useEffect(() => () => { request.current++; clearTimeoutRef(); }, [clearTimeoutRef]);

  return {
    playing: status.playing,
    busy: connecting || status.isBuffering,
    error,
    toggle,
    pause,
    label: connecting || status.isBuffering ? 'Connecting to WAYO…' : status.playing ? 'You’re listening live' : 'Live from Rochester, NY',
  };
}

export type LiveRadio = ReturnType<typeof useLiveRadio>;
