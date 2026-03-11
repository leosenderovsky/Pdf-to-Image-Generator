import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.beforeEach(async ({ page }) => {
  await page.goto(BASE);
});

test('prevent paste negative and block minus key', async ({ page }) => {
  const ancho = page.locator('#out-width');
  const alto = page.locator('#out-height');

  // Wait until inputs are present in DOM
  await page.waitForSelector('#out-width', { state: 'attached' });
  await page.waitForSelector('#out-height', { state: 'attached' });
  await ancho.evaluate((el: HTMLElement) => { el.style.display = 'block'; el.style.visibility = 'visible'; el.scrollIntoView(); });
  await alto.evaluate((el: HTMLElement) => { el.style.display = 'block'; el.style.visibility = 'visible'; el.scrollIntoView(); });

  // Try to dispatch a paste with negative value for ancho
  await ancho.focus();
  await ancho.evaluate((el) => {
    const data = new DataTransfer();
    data.setData('text/plain', '-999');
    const ev = new ClipboardEvent('paste', { clipboardData: data });
    el.dispatchEvent(ev);
  });
  const anchoAfterPaste = await ancho.inputValue();
  expect(anchoAfterPaste).not.toContain('-');

  // Try typing a minus key (should not insert '-')
  // Simulate entering a negative string; input sanitizer should remove it
  await ancho.evaluate((el: HTMLInputElement) => {
    el.value = '-100';
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  const anchoAfterMinus = await ancho.inputValue();
  expect(anchoAfterMinus).not.toContain('-');

  // Test blur behavior for 0 -> should reset to default 1080 (use evaluate to avoid visibility issues)
  await alto.evaluate((el: HTMLInputElement) => {
    el.value = '0';
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  });
  // allow handlers to run
  await page.waitForTimeout(50);
  expect(await alto.inputValue()).toBe('1080');

  // Test blur behavior for 9000 -> should clamp to 8000
  await ancho.evaluate((el: HTMLInputElement) => {
    el.value = '9000';
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  });
  await page.waitForTimeout(50);
  expect(await ancho.inputValue()).toBe('8000');
});
