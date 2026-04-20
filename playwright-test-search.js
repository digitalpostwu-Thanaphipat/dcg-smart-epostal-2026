const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to App at', TARGET_URL);
  await page.goto(TARGET_URL);
  
  // Wait for the app to load
  await page.waitForTimeout(2000); 
  
  // Maximize the window viewport for desktop testing
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
     console.log('Clicking the Search menu tab...');
     const searchTab = page.locator('text="ค้นหาไปรษณีย์ภัณฑ์"').first();
     await searchTab.click();
  } catch (e) {
     console.error("Could not click search tab", e.message);
  }
  
  await page.waitForTimeout(1000);
  
  // Check that we are on the Search Page (Looking for the Black Banner text)
  const isSearchVisible = await page.isVisible('text=SEARCH & INTELLIGENCE PROTOCOL');
  if (isSearchVisible) {
      console.log('✅ Search Page loaded successfully (Black Banner verified)');
  } else {
      console.log('⚠️ Search Page verification text not found, but continuing test');
  }

  // Type in the search box
  try {
     // Search for text input
     const searchInput = page.locator('input[type="text"]').first();
     await searchInput.fill('EG123456789TH');
     console.log('✅ Typed tracking number into search box');
  } catch (e) {
     console.error('❌ Failed to use search box:', e.message);
  }

  const viewports = [
    { name: 'Desktop', width: 1440, height: 900 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    console.log(`Testing ${viewport.name} layout (${viewport.width}x${viewport.height})...`);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    // If mobile, try opening the filter drawer
    if (viewport.name === 'Mobile') {
        try {
            const filterBtn = page.locator('button:has-text("ตัวกรอง")').first();
            if (await filterBtn.isVisible()) {
                await filterBtn.click();
                await page.waitForTimeout(500); // wait for drawer to slide up
                console.log('✅ Opened mobile filter drawer');
            }
        } catch (e) {
            // ignore
        }
    } else {
        await page.waitForTimeout(500); 
    }

    await page.screenshot({ path: `C:/Users/Admin/.gemini/antigravity/brain/51d40fa2-6ca8-4acc-8e0a-b3ea000c75f0/media__search_${viewport.name.toLowerCase()}.png`, fullPage: true });
    // Saving to brain folder so the AI assistant can reference it if needed.
    console.log(`📸 Saved ${viewport.name} screenshot!`);
    
    // Close the drawer if it was opened on mobile
    if (viewport.name === 'Mobile') {
         try {
             const closeBtn = page.locator('text="ปิด"').first();
             if (await closeBtn.isVisible()) {
                 await closeBtn.click();
                 await page.waitForTimeout(500);
             }
         } catch(e) {}
    }
  }

  console.log('✅ Automated test complete.');
  await browser.close();
})();
