import { LINKS, type StationPage } from '../config';
import { mixcloudEmbed } from './mixcloud';

// A real HTTPS base URL gives nested players an origin and a Referer.
// YouTube requires client identification; a bare embed URL in a native WebView
// can fail with player error 153 when no Referer is sent.
export const EMBED_BASE_URL = 'https://wayofm.org/';
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-presentation';

function httpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch { return null; }
}

// Convert provider links to players instead of handing them to Safari or another app.
export function mediaPageFromUrl(value: string, title?: string): StationPage | null {
  const url = httpsUrl(value);
  if (!url) return null;
  if (['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1)
      : url.pathname === '/watch' ? url.searchParams.get('v')
      : url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})\/?$/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return {
      title: title ?? 'YouTube video', embed: true,
      url: `https://www.youtube.com/embed/${id}?playsinline=1&rel=0`,
      browserUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  if (!['www.mixcloud.com', 'mixcloud.com'].includes(url.hostname)) return null;
  if (/^\/live\/wayoradio\/?$/.test(url.pathname)) return { title: title ?? 'Watch WAYO', url: LINKS.watch, browserUrl: LINKS.watch };
  const key = `${url.pathname.replace(/\/$/, '')}/`;
  if (!/^\/wayoradio\/[^/]+\/$/.test(key)) return null;
  return { title: title ?? 'WAYO archive', url: mixcloudEmbed(key), embed: true, browserUrl: `https://www.mixcloud.com${key}` };
}

export function isEmbeddedPlayerUrl(value: string): boolean {
  const url = httpsUrl(value);
  return !!url && ((url.hostname === 'www.youtube.com' && /^\/embed\/[\w-]{11}\/?$/.test(url.pathname))
    || (url.hostname === 'www.mixcloud.com' && url.pathname === '/widget/iframe/'));
}

export function canLoadMediaUrl(value: string, embedded: boolean, isTopFrame?: boolean): boolean {
  if (value === 'about:blank' || value === 'about:srcdoc') return true;
  const url = httpsUrl(value);
  if (!url) return false; // Includes youtube://, mixcloud:// and Android intent:// links.
  if (isTopFrame === false) return true;
  if (url.href === EMBED_BASE_URL) return true;
  return embedded ? isEmbeddedPlayerUrl(value)
    : url.hostname === 'www.mixcloud.com' && /^\/live\/wayoradio\/?$/.test(url.pathname);
}

export type MediaNavigation = { action: 'allow' | 'block' } | { action: 'open'; page: StationPage };

export function decideMediaNavigation(value: string, current: StationPage, isTopFrame?: boolean): MediaNavigation {
  const next = mediaPageFromUrl(value);
  // Watch is a full provider page, not an iframe URL. Its initial request and
  // canonical redirects must load normally instead of being routed back to itself.
  if (!current.embed && next?.url === current.url) return { action: 'allow' };
  if (next && !isEmbeddedPlayerUrl(value)) {
    // A provider's "watch on website" link for the current episode must keep
    // its embedded player; links to other playable content open inside WAYO.
    return next.url === current.url ? { action: 'block' } : { action: 'open', page: next };
  }
  return { action: canLoadMediaUrl(value, !!current.embed, isTopFrame) ? 'allow' : 'block' };
}

function htmlAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function embeddedPlayerHtml(url: string, title: string): string {
  const source = new URL(url);
  if (source.protocol !== 'https:' || source.username || source.password
    || !['www.youtube.com', 'www.mixcloud.com'].includes(source.hostname)) {
    throw new Error('Unsupported embedded player.');
  }
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#16191b}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe src="${htmlAttribute(source.href)}" title="${htmlAttribute(title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" sandbox="${EMBED_SANDBOX}" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}
