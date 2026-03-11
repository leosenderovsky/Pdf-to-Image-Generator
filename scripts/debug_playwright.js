import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1500);
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY LENGTH:', html.length);
  console.log(html.slice(0, 4000));
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  await browser.close();
})();
