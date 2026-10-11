import { test, expect, type Page } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Close page' }).click();
  await page.getByRole('tab', { name: 'Explore' }).click();
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://wayofm.org/schedule/day');
  await page.getByRole('button', { name: 'Close page' }).click();
  await page.getByRole('tab', { name: 'Community' }).click();
  await expect(page.getByText('1237 E Main St', { exact: false })).toBeAttached();
  await expect(page.getByRole('button', { name: 'Call WAYO', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Text WAYO', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email us', exact: true })).toBeVisible();
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
  await page.getByRole('button', { name: 'Close page' }).click();
  await expect(page.getByRole('button', { name: 'Listen to broadcast' })).toBeVisible();
});

test('unavailable audio stream shows a useful fallback', async ({ page }) => {
  await page.route('https://streaming.wayofm.org/wayo-192', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play live radio', exact: true }).click();
  await expect(page.getByText('The live broadcast could not be played.', { exact: false })).toBeVisible({ timeout: 25000 });
  await expect(page.getByRole('button', { name: 'Open website' })).toBeVisible();
});
