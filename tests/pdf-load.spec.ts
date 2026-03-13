import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localPdfPath = path.resolve(__dirname, '..', 'test.pdf');

test.describe('PDF loading', () => {
  test('loads PDF from local file input', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('#drop-zone input[type="file"]');
    await fileInput.setInputFiles(localPdfPath);

    await expect(page.locator('#pdf-info')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#pdf-info-text')).toContainText('.pdf');
    await expect(page.locator('#thumbnails-container .thumbnail').first()).toBeVisible();
  });

  test('loads PDF from public URL', async ({ page }) => {
    await page.goto('/');

    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill('https://www.w3.org/WAI/WCAG21/wcag21.pdf');
    await page.getByRole('button', { name: 'Load' }).click();

    await expect(page.locator('#pdf-info')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('#thumbnails-container .thumbnail').first()).toBeVisible();
  });

  test('loads PDF from Google Drive link format', async ({ page }) => {
    await page.goto('/');

    const fakeId = 'TEST_FILE_ID_12345';
    const driveLink = `https://drive.google.com/file/d/${fakeId}/view?usp=sharing`;
    const directUrl = `https://drive.google.com/uc?export=download&id=${fakeId}`;
    const proxiedUrl = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;

    const pdfBuffer = fs.readFileSync(localPdfPath);

    await page.route(proxiedUrl, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        body: pdfBuffer
      });
    });

    const urlInput = page.locator('input[type="text"]').first();
    await urlInput.fill(driveLink);
    await page.getByRole('button', { name: 'Load' }).click();

    await expect(page.locator('#pdf-info')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#thumbnails-container .thumbnail').first()).toBeVisible();
  });
});


