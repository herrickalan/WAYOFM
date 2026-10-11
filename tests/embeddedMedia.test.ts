import test from 'node:test';
import assert from 'node:assert/strict';
import { EMBED_BASE_URL, embeddedPlayerHtml } from '../src/services/embeddedMedia';

test('untrusted episode titles remain text in the native player document', () => {
  const html = embeddedPlayerHtml('https://www.mixcloud.com/widget/iframe/?feed=%2Fwayoradio%2Fshow%2F&light=1', 'A show "</iframe><script>alert(1)</script>"');
  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('referrerpolicy="strict-origin-when-cross-origin"'));
  assert.equal(new URL(EMBED_BASE_URL).origin, 'https://wayofm.org');
  assert.throws(() => embeddedPlayerHtml('javascript:alert(1)', 'Show'));
  assert.throws(() => embeddedPlayerHtml('https://user:password@www.mixcloud.com/widget/iframe/', 'Show'));
});
