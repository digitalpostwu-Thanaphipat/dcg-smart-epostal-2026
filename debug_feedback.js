const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); // Mobile viewport
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    const btn = page.locator('button[title="ส่งข้อเสนอแนะ/แจ้งปัญหา"]');
    if (await btn.isVisible()) {
      console.log('✅ Button IS visible on mobile viewport!');
      await btn.click();
      await page.waitForTimeout(1000);
      const modal = page.locator('text="ส่งคำนำแนะถึงทีมพัฒนา"');
      if (await modal.isVisible()) {
         console.log('✅ Modal opened successfully!');
         // Take screenshot of the open modal
         await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/51d40fa2-6ca8-4acc-8e0a-b3ea000c75f0/media__feedback_modal.png' });
      } else {
         console.log('❌ Modal NOT opened!');
      }
    } else {
      console.log('❌ Button NOT VISIBLE on Mobile Viewport!');
      const bodyText = await page.locator('body').innerText();
      console.log('Body dump:', bodyText.slice(0, 500));
    }
    await browser.close();
  } catch(e) { console.error(e); }
})();
