import { test, expect, type Page } from '@playwright/test';

declare global { interface Window { __wayoTestAudios: HTMLAudioElement[] } }

const episode = (slug: string, name: string) => ({
  key: `/wayoradio/${slug}/`, name, url: `https://www.mixcloud.com/wayoradio/${slug}/`,
  pictures: {}, created_time: '2026-10-10T12:00:00Z', audio_length: 3600,
});

async function archives(page: Page) {
  await page.route('https://api.mixcloud.com/wayoradio/cloudcasts/**', async route => {
    const next = route.request().url().includes('offset=20');
    await route.fulfill({ json: {
      data: next ? [episode('morning', 'Morning Show'), episode('evening', 'Evening Show')] : [episode('morning', 'Morning Show')],
      paging: next ? {} : { next: 'https://api.mixcloud.com/wayoradio/cloudcasts/?limit=20&offset=20' },
    } });
  });
}

test('native navigation and station pages use the requested destinations', async ({ page }) => {
  await page.route('https://wayofm.org/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>WAYO station page fixture</body></html>' }));
  await page.goto('/');
  await expect(page.getByText('A little different.')).toBeVisible();
  await page.getByRole('button', { name: 'Show Guide', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://wayofm.org/shows/all');
  await expect(page.getByRole('button', { name: 'WAYO home' })).toBeVisible();
  for (const name of ['Listen', 'Explore', 'Archives', 'Community']) await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Listen' }).click();
  await page.getByRole('tab', { name: 'Explore' }).click();
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://wayofm.org/schedule/day');
  await page.getByRole('button', { name: 'Back to Explore' }).click();
  await page.getByRole('tab', { name: 'Community' }).click();
  await expect(page.getByText('1237 E Main St', { exact: false })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Call WAYO', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Text WAYO', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email us', exact: true })).toBeVisible();
  for (const destination of [{ title: 'Contact information', path: '/contact' }, { title: 'Volunteer', path: '/volunteer' }, { title: 'Subscribe', path: '/signup' }]) {
    await page.getByRole('button', { name: destination.title, exact: true }).click();
    await expect(page.locator('iframe')).toHaveAttribute('src', `https://wayofm.org${destination.path}`);
    await expect(page.getByRole('tab', { name: 'Community', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back to Community' }).click();
  }
});

test('browsing the station website keeps Home and tabs on screen and blocks browser escapes', async ({ page, context }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route('https://wayofm.org/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: 'text/html', body: `<html><body>
      <h1>${path === '/news' ? 'Station news fixture' : 'Show Guide fixture'}</h1>
      <a href="/news">Station news</a>
      <a href="/contact" target="_blank">Popup contact</a>
      <a href="https://wayofm.org/" target="_top">Replace app</a>
    </body></html>` });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Show Guide', exact: true }).click();
  await page.frameLocator('iframe').getByRole('link', { name: 'Station news', exact: true }).click();
  await expect(page.frameLocator('iframe').getByText('Station news fixture')).toBeVisible();
  await page.frameLocator('iframe').getByRole('link', { name: 'Popup contact' }).click();
  await page.frameLocator('iframe').getByRole('link', { name: 'Replace app' }).click();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Back to Listen' })).toBeInViewport();
  for (const name of ['Listen', 'Explore', 'Archives', 'Community']) await expect(page.getByRole('tab', { name, exact: true })).toBeInViewport();
  expect(context.pages()).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath('website-navigation-320.png') });
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByText('A little different.')).toBeVisible();
  await page.getByRole('tab', { name: 'Explore' }).click();
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.getByRole('tab', { name: 'Community' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Contact information', exact: true })).toBeVisible();
});

test('website browsing retains live-radio controls and pausing does not close the website', async ({ page }) => {
  await page.route('https://wayofm.org/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Station website fixture</body></html>' }));
  await page.route('https://streaming.wayofm.org/wayo-192', route => route.fulfill({ contentType: 'audio/wav', body: silenceWav() }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
  await page.getByRole('button', { name: 'Show Guide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause broadcast' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause broadcast' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://wayofm.org/shows/all');
  await page.getByRole('button', { name: 'Listen to broadcast' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
});

test('archives search, pagination, state preservation, and Mixcloud player', async ({ page }) => {
  await archives(page);
  await page.route('https://www.mixcloud.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Mixcloud test player</body></html>' }));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Archives' }).click();
  await expect(page.getByRole('button', { name: 'Play Morning Show' })).toBeVisible();
  await page.getByRole('button', { name: 'Load more episodes' }).click();
  await expect(page.getByText('2 episodes loaded')).toBeVisible();
  await page.getByRole('textbox', { name: 'Search loaded episodes' }).fill('evening');
  await expect(page.getByRole('button', { name: 'Play Morning Show' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Listen', exact: true }).click();
  await page.getByRole('tab', { name: 'Archives' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('evening');
  await page.getByRole('button', { name: 'Play Evening Show' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /feed=%2Fwayoradio%2Fevening%2F/);
  await expect(page.getByRole('button', { name: 'WAYO home' })).toBeVisible();
  for (const name of ['Listen', 'Explore', 'Archives', 'Community']) await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Archives' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('textbox')).toHaveValue('evening');
  await expect(page.getByRole('button', { name: 'Play Evening Show' })).toBeVisible();
  await page.getByRole('button', { name: 'Play Evening Show' }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByText('A little different.')).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Archives' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('evening');
});

test('archive failures provide retry and a website fallback', async ({ page }) => {
  await page.route('https://api.mixcloud.com/**', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Archives' }).click();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open website' })).toBeVisible();
  await archives(page);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('button', { name: 'Play Morning Show' })).toBeVisible();
});

function silenceWav() {
  const dataLength = 22050 * 2 * 60;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataLength, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(22050, 24); buffer.writeUInt32LE(44100, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

test('audio loads and plays, persists across tabs, and pauses before archive playback', async ({ page }) => {
  await archives(page);
  await page.route('https://streaming.wayofm.org/wayo-192', route => route.fulfill({ contentType: 'audio/wav', body: silenceWav(), headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route('https://www.mixcloud.com/**', route => route.fulfill({ contentType: 'text/html', body: 'Mixcloud test player' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible({ timeout: 20000 });
  await page.getByRole('tab', { name: 'Explore' }).click();
  await expect(page.getByRole('button', { name: 'Pause broadcast' })).toBeVisible();
  await page.getByRole('tab', { name: 'Archives' }).click();
  await page.getByRole('button', { name: 'Play Morning Show' }).click();
  await page.getByRole('button', { name: 'Back to Archives' }).click();
  await expect(page.getByRole('button', { name: 'Listen to broadcast' })).toBeVisible();
  await page.getByRole('button', { name: 'Play Morning Show' }).click();
  await page.getByRole('button', { name: 'Listen to broadcast' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Listen', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
});

test('unavailable audio stream shows a useful fallback', async ({ page }) => {
  let requests = 0;
  await page.route('https://streaming.wayofm.org/wayo-192', route => {
    requests++;
    return route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByText('The live broadcast could not be played.', { exact: false })).toBeVisible({ timeout: 25000 });
  await expect(page.getByRole('button', { name: 'Open website' })).toBeVisible();
  expect(requests).toBe(3);
});

test('a frozen audio clock reconnects even when the player still reports playing', async ({ page }) => {
  let requests = 0;
  await page.addInitScript(() => {
    const audios: HTMLAudioElement[] = [];
    window.__wayoTestAudios = audios;
    window.Audio = new Proxy(window.Audio, {
      construct(Target, args) {
        const audio = new Target(args[0]);
        audios.push(audio);
        return audio;
      },
    });
  });
  await page.route('https://streaming.wayofm.org/wayo-192', route => {
    requests++;
    return route.fulfill({ contentType: 'audio/wav', body: silenceWav() });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
  await page.evaluate(() => {
    const audio = [...window.__wayoTestAudios].reverse().find(item => !item.paused);
    if (!audio) throw new Error('The fixture audio never started');
    const frozenTime = audio.currentTime;
    Object.defineProperty(audio, 'currentTime', { configurable: true, get: () => frozenTime });
  });
  await expect(page.getByRole('button', { name: 'Cancel connection', exact: true })).toBeVisible();
  await expect.poll(() => requests, { timeout: 18000 }).toBeGreaterThanOrEqual(2);
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause live radio' }).click();
  await expect(page.getByRole('button', { name: 'Play live radio', exact: true })).toBeVisible();
});

test('cancelling an unresponsive stream clears the connection instead of staying busy', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route('https://streaming.wayofm.org/wayo-192', async route => {
    requested = true;
    await pending;
    // Removing the source can abort this request before the fixture responds.
    try { await route.fulfill({ contentType: 'audio/wav', body: silenceWav() }); } catch {}
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect.poll(() => requested).toBe(true);
  await page.getByRole('button', { name: 'Cancel connection', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play live radio', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen to broadcast' })).toBeVisible();
  release();
});

test('YouTube and Mixcloud Live open inside the app and video pauses live radio', async ({ page, context }, testInfo) => {
  await page.route('https://streaming.wayofm.org/wayo-192', route => route.fulfill({ contentType: 'audio/wav', body: silenceWav() }));
  await page.route('https://www.youtube.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>YouTube player fixture</body></html>' }));
  await page.route('https://www.mixcloud.com/live/wayoradio/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Mixcloud Live player fixture</body></html>' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause live radio' })).toBeVisible();
  await page.getByRole('button', { name: 'Watch WAYO on YouTube' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://www.youtube.com/embed/JWuorF9K-b8?playsinline=1&rel=0');
  await expect(page.locator('iframe')).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  await expect(page.locator('iframe')).toHaveAttribute('allow', /fullscreen/);
  await expect(page.getByRole('button', { name: 'WAYO home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to Listen' })).toBeVisible();
  for (const name of ['Listen', 'Explore', 'Archives', 'Community']) await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Rayanna and the Feral Dogs · Live at WAYO' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /embed\/6T_sRQx2x94/);
  await page.screenshot({ path: testInfo.outputPath('youtube-app.png') });
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play live radio', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Live at WAYO', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Watch live', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Watch', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://www.mixcloud.com/live/wayoradio/');
  await expect(page.frameLocator('iframe').getByText('Mixcloud Live player fixture')).toBeVisible();
  await expect(page.getByText('Watch WAYO', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Explore' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Community' }).click();
  await page.getByRole('button', { name: 'YouTube', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /embed\/JWuorF9K-b8/);
  await expect(page.getByRole('button', { name: 'Back to Community' })).toBeVisible();
  await page.getByRole('button', { name: 'WAYO home' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByText('A little different.')).toBeVisible();
  expect(context.pages()).toHaveLength(1);
});

for (const provider of ['YouTube', 'Mixcloud'] as const) {
  test(`${provider} player links cannot replace WAYO or launch a new browser window`, async ({ page, context }) => {
    await archives(page);
    const host = provider === 'YouTube' ? 'https://www.youtube.com/**' : 'https://www.mixcloud.com/**';
    await page.route(host, route => route.fulfill({ contentType: 'text/html', body: `<html><body>
      <a href="https://www.youtube.com/watch?v=JWuorF9K-b8" target="_blank">Provider website</a>
      <a href="https://www.youtube.com/watch?v=JWuorF9K-b8" target="_top">Replace app</a>
    </body></html>` }));
    await page.goto('/');
    if (provider === 'YouTube') await page.getByRole('button', { name: 'Watch WAYO on YouTube' }).click();
    else {
      await page.getByRole('tab', { name: 'Archives' }).click();
      await page.getByRole('button', { name: 'Play Morning Show' }).click();
    }
    const player = page.frameLocator('iframe');
    await player.getByRole('link', { name: 'Provider website' }).click();
    await player.getByRole('link', { name: 'Replace app' }).click();
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Listen', exact: true })).toBeVisible();
    expect(context.pages()).toHaveLength(1);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.getByText('A little different.')).toBeVisible();
  });
}

test('player return controls and WAYO tabs remain visible on short, narrow phones', async ({ page }, testInfo) => {
  await page.route('https://www.youtube.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>YouTube player fixture</body></html>' }));
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Watch WAYO on YouTube' }).click();
    await expect(page.getByRole('button', { name: 'Back to Listen' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeInViewport();
    for (const name of ['Listen', 'Explore', 'Archives', 'Community']) await expect(page.getByRole('tab', { name, exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: testInfo.outputPath(`media-navigation-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await expect(page.locator('iframe')).toHaveCount(0);
  }
});

test('the supplied rocket is visible on the app loading screen', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*.ttf', async route => { await pending; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  try { await expect(page.getByRole('img', { name: 'WAYO rocket loading image' })).toBeVisible(); }
  finally { release(); }
  await expect(page.getByText('A little different.', { exact: false })).toBeVisible();
});
