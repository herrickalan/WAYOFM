import { fetchWithTimeout } from './station';

export type Episode = {
  key: string;
  name: string;
  url: string;
  image: string | null;
  created: string;
  duration: number;
};
export type EpisodePage = { episodes: Episode[]; next: string | null };
export const ARCHIVE_URL = 'https://api.mixcloud.com/wayoradio/cloudcasts/?limit=20';

export function validArchivePage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'api.mixcloud.com'
      && !parsed.username && !parsed.password && parsed.pathname === '/wayoradio/cloudcasts/';
  } catch { return false; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function httpsUrl(value: unknown, host?: string): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && (!host || url.hostname === host) ? url.href : null;
  } catch { return null; }
}

export function parseArchive(payload: unknown): EpisodePage {
  if (!isRecord(payload) || !Array.isArray(payload.data)) throw new Error('Mixcloud returned an unexpected response.');
  const episodes: Episode[] = [];
  for (const item of payload.data) {
    if (!isRecord(item) || typeof item.key !== 'string' || typeof item.name !== 'string') continue;
    if (!/^\/wayoradio\/[^/]+\/$/.test(item.key)) continue;
    const url = httpsUrl(item.url, 'www.mixcloud.com');
    if (!url) continue;
    const pictures = isRecord(item.pictures) ? item.pictures : {};
    episodes.push({
      key: item.key, name: item.name, url,
      image: httpsUrl(pictures.large) || httpsUrl(pictures.medium),
      created: typeof item.created_time === 'string' ? item.created_time : '',
      duration: typeof item.audio_length === 'number' && item.audio_length > 0 ? item.audio_length : 0,
    });
  }
  const paging = isRecord(payload.paging) ? payload.paging : {};
  const candidate = typeof paging.next === 'string' ? paging.next : null;
  return { episodes, next: candidate && validArchivePage(candidate) ? candidate : null };
}

export async function getEpisodes(url = ARCHIVE_URL, signal?: AbortSignal): Promise<EpisodePage> {
  if (!validArchivePage(url)) throw new Error('Invalid archive page.');
  const response = await fetchWithTimeout(url, 15000, signal);
  if (!response.ok) throw new Error('Mixcloud is temporarily unavailable. Try again or browse the WAYO archive.');
  return parseArchive(await response.json());
}

export function mergeEpisodes(previous: Episode[], incoming: Episode[]): Episode[] {
  return [...new Map([...previous, ...incoming].map(episode => [episode.key, episode])).values()];
}

export function mixcloudEmbed(key: string): string {
  if (!/^\/wayoradio\/[^/]+\/$/.test(key)) throw new Error('Invalid episode.');
  return `https://www.mixcloud.com/widget/iframe/?hide_cover=0&light=1&feed=${encodeURIComponent(key)}`;
}

export function episodeDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'WAYO archive' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function episodeDuration(seconds: number): string {
  return seconds > 0 ? `${Math.round(seconds / 60)} min` : 'Episode';
}
