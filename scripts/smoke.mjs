/** Real Chromium end-to-end smoke tests for a local preview or deployed URL. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import JSZip from 'jszip';

const baseURL = process.argv.find(a => a.startsWith('--url='))?.slice(6) || process.env.BASE_URL || 'http://127.0.0.1:4173/';
const executablePath = process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', err => errors.push(err.message));
try {
  const response = await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30000 });
  assert.equal(response?.status(), 200);
  await page.getByRole('heading', { name: 'Free Barcode Studio' }).waitFor();
  assert.equal(await page.locator('.barcode-item').count(), 3);

  await page.locator('input[type=file]').setInputFiles({
    name: 'inventory.csv', mimeType: 'text/csv',
    buffer: Buffer.from('Barcode,Caption\nITEM-42,Large widget\nITEM-42,Small widget\n'),
  });
  assert.equal(await page.locator('.barcode-item').count(), 2);
  assert.match(await page.locator('.barcode-item').first().innerText(), /Large widget/);
  assert.equal(await page.locator('.print-root .print-label').count(), 2);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    page.getByRole('button', { name: 'Download all SVG (ZIP)' }).click(),
  ]);
  assert.match(download.suggestedFilename(), /\.zip$/);
  const zip = await JSZip.loadAsync(await readFile(await download.path()));
  assert.equal(Object.keys(zip.files).length, 2);

  await page.locator('.sequence-controls summary').click();
  await page.getByLabel('Prefix').fill('CASE-');
  await page.getByLabel('Start').fill('8');
  await page.getByLabel('Count (max 1,000)').fill('2');
  await page.getByRole('button', { name: 'Generate sequence' }).click();
  assert.equal(await page.locator('#values-input').inputValue(), 'CASE-0008\nCASE-0009');

  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.print-root').evaluate(el => getComputedStyle(el).display), 'block');
  assert.equal(await page.locator('.screen-only').evaluate(el => getComputedStyle(el).display), 'none');
  await page.emulateMedia({ media: 'screen' });

  await page.getByRole('radio', { name: 'QR Code' }).check();
  assert((await page.locator('.barcode-item svg').count()) > 0);
  assert.deepEqual(errors, []);
  console.log('PASS: HTTP 200, Code 128, CSV captions, bulk ZIP, sequences, print CSS, QR Code, no JS errors.');
} finally {
  await browser.close();
}
