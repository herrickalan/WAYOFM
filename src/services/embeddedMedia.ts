// A real HTTPS base URL gives nested players an origin and a Referer.
// YouTube requires client identification; a bare embed URL in a native WebView
// can fail with player error 153 when no Referer is sent.
export const EMBED_BASE_URL = 'https://wayofm.org/';

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
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><style>html,body{margin:0;height:100%;background:#16191b}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe src="${htmlAttribute(source.href)}" title="${htmlAttribute(title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}
