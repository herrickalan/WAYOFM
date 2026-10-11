import test from 'node:test';
import assert from 'node:assert/strict';
import { LINKS } from '../src/config';
import { decidePageNavigation, isMediaPage, isStationWebsiteUrl } from '../src/services/pageNavigation';
import { mediaPageFromUrl } from '../src/services/embeddedMedia';

const page = { title: 'Show Guide', url: LINKS.shows };

test('WAYO website destinations stay inside the app, including volunteer and subscription pages', () => {
  for (const url of [LINKS.shows, LINKS.schedule, LINKS.volunteer, LINKS.subscribe, 'https://www.wayofm.org/contact']) assert.equal(isStationWebsiteUrl(url), true, url);
  for (const url of [LINKS.donate, LINKS.dj, 'https://wayofm.org.evil.example/', 'http://wayofm.org/', 'https://user:secret@wayofm.org/']) assert.equal(isStationWebsiteUrl(url), false, url);
  assert.equal(isMediaPage(page), false);
});

test('website initial loads, internal links, and HTTPS popup targets remain in the viewer', () => {
  for (const url of [page.url, LINKS.news, LINKS.contact, 'https://www.wayofm.org/shows/all', 'https://docs.google.com/forms/']) {
    assert.equal(decidePageNavigation(url, page, true).action, 'allow', url);
  }
  assert.equal(decidePageNavigation('https://www.youtube.com/embed/JWuorF9K-b8', page, false).action, 'allow', 'loading a website iframe must not switch screens');
  for (const url of ['youtube://watch?v=JWuorF9K-b8', 'intent://watch', 'javascript:alert(1)', 'http://wayofm.org/', 'https://user:secret@wayofm.org/']) assert.equal(decidePageNavigation(url, page, true).action, 'block', url);
  for (const url of [LINKS.call, LINKS.text, LINKS.email]) assert.deepEqual(decidePageNavigation(url, page, true), { action: 'external', url });
});

test('website links to playable media open an app player while Watch still loads its own page', () => {
  for (const url of ['https://www.youtube.com/watch?v=JWuorF9K-b8', 'https://www.mixcloud.com/wayoradio/morning-show/', LINKS.watch]) {
    const next = decidePageNavigation(url, page, true);
    assert.equal(next.action, 'open', url);
    if (next.action === 'open') assert.equal(isMediaPage(next.page), true);
  }
  const watch = mediaPageFromUrl(LINKS.watch)!;
  assert.equal(decidePageNavigation(watch.url, watch, true).action, 'allow');
  const video = mediaPageFromUrl('https://www.youtube.com/watch?v=JWuorF9K-b8')!;
  assert.equal(decidePageNavigation(video.url, video, false).action, 'allow');
});
