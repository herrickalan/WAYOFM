import { type StationPage } from '../config';
import { decideMediaNavigation, isEmbeddedPlayerUrl, mediaPageFromUrl, type MediaNavigation } from './embeddedMedia';

function parsedUrl(value: string): URL | null {
  try { return new URL(value); } catch { return null; }
}

export function isStationWebsiteUrl(value: string): boolean {
  const url = parsedUrl(value);
  return !!url && url.protocol === 'https:' && !url.username && !url.password
    && ['wayofm.org', 'www.wayofm.org'].includes(url.hostname);
}

export function isMediaPage(page: StationPage): boolean {
  return !!page.embed || !!mediaPageFromUrl(page.url);
}

export type PageNavigation = MediaNavigation | { action: 'external'; url: string };

export function decidePageNavigation(value: string, current: StationPage, isTopFrame?: boolean): PageNavigation {
  if (isMediaPage(current)) return decideMediaNavigation(value, current, isTopFrame);
  if (value === 'about:blank' || value === 'about:srcdoc') return { action: 'allow' };
  const url = parsedUrl(value);
  if (!url || url.username || url.password) return { action: 'block' };
  if (url.protocol === 'https:') {
    const media = mediaPageFromUrl(value);
    if (media && isTopFrame !== false && !isEmbeddedPlayerUrl(value)) return { action: 'open', page: media };
    // Ordinary website links stay in this WebView, including HTTPS redirects.
    return { action: 'allow' };
  }
  if (['tel:', 'sms:', 'mailto:'].includes(url.protocol)) return { action: 'external', url: value };
  return { action: 'block' };
}
