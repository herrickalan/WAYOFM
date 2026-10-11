import { STATION } from '../config';

export function secureAudioUrl(candidate: string): string | null {
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export async function fetchWithTimeout(url: string, timeout = 12000, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try { return await fetch(url, { signal: controller.signal }); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

export async function resolveLiveStream(): Promise<string> {
  const configured = process.env.EXPO_PUBLIC_LIVE_STREAM_URL?.trim();
  const url = secureAudioUrl(configured || STATION.liveStream);
  if (!url) throw new Error('The live stream must use a valid HTTPS audio URL.');
  return url;
}
