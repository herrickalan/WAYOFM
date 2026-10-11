import test from 'node:test';
import assert from 'node:assert/strict';
import { secureAudioUrl, resolveLiveStream } from '../src/services/station';
import { mergeEpisodes, mixcloudEmbed, parseArchive, validArchivePage } from '../src/services/mixcloud';
import { LINKS } from '../src/config';

test('uses the published station stream and supports a secure deployment override', async () => {
  const previous = process.env.EXPO_PUBLIC_LIVE_STREAM_URL;
  try {
    delete process.env.EXPO_PUBLIC_LIVE_STREAM_URL;
    assert.equal(await resolveLiveStream(), 'https://streaming.wayofm.org/wayo-192');
    process.env.EXPO_PUBLIC_LIVE_STREAM_URL = 'https://radio.example.org/live';
    assert.equal(await resolveLiveStream(), 'https://radio.example.org/live');
    process.env.EXPO_PUBLIC_LIVE_STREAM_URL = 'http://radio.example.org/live';
    await assert.rejects(resolveLiveStream(), /HTTPS/);
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_LIVE_STREAM_URL;
    else process.env.EXPO_PUBLIC_LIVE_STREAM_URL = previous;
  }
});

test('rejects insecure sources, credential-bearing URLs, and relative URLs', () => {
  assert.equal(secureAudioUrl('http://radio.example.org/stream'), null);
  assert.equal(secureAudioUrl('https://user:secret@radio.example.org/stream'), null);
  assert.equal(secureAudioUrl('/stream'), null);
  assert.equal(secureAudioUrl('javascript:alert(1)'), null);
});

const sample = {
  key: '/wayoradio/test-show/', name: 'Test Show', url: 'https://www.mixcloud.com/wayoradio/test-show/',
  pictures: { large: 'https://images.example.com/cover.jpg' }, created_time: '2026-10-10T12:00:00Z', audio_length: 3600,
};

test('parses real API shape, skips malformed records, and uses trusted pagination', () => {
  const next = 'https://api.mixcloud.com/wayoradio/cloudcasts/?limit=20&offset=20';
  const parsed = parseArchive({ data: [sample, null, { ...sample, key: '/another-user/test-show/' }], paging: { next } });
  assert.equal(parsed.episodes.length, 1);
  assert.equal(parsed.episodes[0]?.duration, 3600);
  assert.equal(parsed.next, next);
  assert.equal(parseArchive({ data: [sample], paging: { next: 'https://evil.example.com' } }).next, null);
  assert.throws(() => parseArchive({ message: 'error' }));
});

test('deduplicates overlapping pages and validates Mixcloud embeds', () => {
  const { episodes } = parseArchive({ data: [sample] });
  assert.equal(mergeEpisodes(episodes, episodes).length, 1);
  assert.equal(mixcloudEmbed(sample.key), 'https://www.mixcloud.com/widget/iframe/?hide_cover=0&light=1&feed=%2Fwayoradio%2Ftest-show%2F');
  assert.throws(() => mixcloudEmbed('javascript:alert(1)'));
  assert.equal(validArchivePage('https://api.mixcloud.com/wayoradio/cloudcasts/?offset=20'), true);
  assert.equal(validArchivePage('https://api.mixcloud.com.evil.test/wayoradio/cloudcasts/'), false);
});

test('call and text use the numeric phone number and all requested destinations use HTTPS', () => {
  assert.equal(LINKS.call, 'tel:+15852039296');
  assert.equal(LINKS.text, 'sms:+15852039296');
  assert.equal(LINKS.email, 'mailto:info@wayofm.org');
  for (const [name, url] of Object.entries(LINKS)) {
    if (!['call', 'text', 'email', 'musicEmail', 'mediaEmail'].includes(name)) assert.equal(new URL(url).protocol, 'https:', name);
  }
});
