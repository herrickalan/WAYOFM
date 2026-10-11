import test from 'node:test';
import assert from 'node:assert/strict';
import { EMBED_BASE_URL, canLoadMediaUrl, embeddedPlayerHtml, mediaPageFromUrl } from '../src/services/embeddedMedia';

test('untrusted episode titles remain text in the native player document', () => {
  const html = embeddedPlayerHtml('https://www.mixcloud.com/widget/iframe/?feed=%2Fwayoradio%2Fshow%2F&light=1', 'A show "</iframe><script>alert(1)</script>"');
  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('referrerpolicy="strict-origin-when-cross-origin"'));
  assert.equal(new URL(EMBED_BASE_URL).origin, 'https://wayofm.org');
  assert.throws(() => embeddedPlayerHtml('javascript:alert(1)', 'Show'));
  assert.throws(() => embeddedPlayerHtml('https://user:password@www.mixcloud.com/widget/iframe/', 'Show'));
});

test('YouTube links become inline players without launching the provider app', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=JWuorF9K-b8', 'https://youtu.be/JWuorF9K-b8',
    'https://m.youtube.com/shorts/JWuorF9K-b8', 'https://www.youtube.com/live/JWuorF9K-b8',
  ]) {
    assert.equal(mediaPageFromUrl(url)?.url, 'https://www.youtube.com/embed/JWuorF9K-b8?playsinline=1&rel=0');
    assert.equal(mediaPageFromUrl(url)?.embed, true);
  }
  assert.equal(mediaPageFromUrl('https://www.youtube.com/watch?v=invalid'), null);
  assert.equal(mediaPageFromUrl('https://www.youtube.com.evil.example/watch?v=JWuorF9K-b8'), null);
});

test('station archive links route to the widget and live links stay in the app', () => {
  const archive = mediaPageFromUrl('https://www.mixcloud.com/wayoradio/morning-show/');
  assert.equal(archive?.url, 'https://www.mixcloud.com/widget/iframe/?hide_cover=0&light=1&feed=%2Fwayoradio%2Fmorning-show%2F');
  assert.equal(archive?.browserUrl, 'https://www.mixcloud.com/wayoradio/morning-show/');
  assert.equal(mediaPageFromUrl('https://www.mixcloud.com/live/wayoradio/')?.url, 'https://www.mixcloud.com/live/wayoradio/');
  assert.equal(mediaPageFromUrl('https://www.mixcloud.com/wayoradio/'), null);
  assert.equal(mediaPageFromUrl('https://www.mixcloud.com/another-station/show/'), null);
});

test('native navigation rejects app-launch schemes and top-level replacements while allowing player frames', () => {
  for (const url of ['youtube://watch?v=JWuorF9K-b8', 'mixcloud://wayoradio/show/', 'intent://watch?v=JWuorF9K-b8', 'http://www.youtube.com/embed/JWuorF9K-b8']) {
    assert.equal(canLoadMediaUrl(url, true, false), false, url);
    assert.equal(mediaPageFromUrl(url), null, url);
  }
  assert.equal(canLoadMediaUrl('https://www.youtube.com/watch?v=JWuorF9K-b8', true, true), false);
  assert.equal(canLoadMediaUrl('https://www.example.org/', true, true), false);
  assert.equal(canLoadMediaUrl(EMBED_BASE_URL, true, true), true);
  assert.equal(canLoadMediaUrl('https://www.youtube.com/embed/JWuorF9K-b8?playsinline=1', true, true), true);
  assert.equal(canLoadMediaUrl('https://www.mixcloud.com/widget/iframe/?feed=%2Fwayoradio%2Fshow%2F', true, false), true);
  assert.equal(canLoadMediaUrl('https://www.mixcloud.com/live/wayoradio/', false, true), true);
});
