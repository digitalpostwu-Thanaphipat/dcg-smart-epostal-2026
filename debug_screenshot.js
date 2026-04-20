const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    const savePath = 'C:/Users/Admin/.gemini/antigravity/brain/51d40fa2-6ca8-4acc-8e0a-b3ea000c75f0/media__feedback_location.png';
    await page.screenshot({ path: savePath });
    console.log('Saved to', savePath);
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
