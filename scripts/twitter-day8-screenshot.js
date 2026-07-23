const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('file://' + path.resolve(__dirname, 'twitter-day8.html'));
  await page.waitForTimeout(500); // ensure fonts render
  await page.screenshot({
    path: path.resolve(__dirname, '../test-results/twitter/day8-format-guide.png'),
    clip: { x: 0, y: 0, width: 1200, height: 900 }
  });
  await browser.close();
  console.log('✅ Screenshot saved: test-results/twitter/day8-format-guide.png');
})();
