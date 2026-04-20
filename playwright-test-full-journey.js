const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testTrackingId = `E2E-TEST-${Date.now()}`;
  console.log('Testing with ID:', testTrackingId);

  page.on('console', msg => console.log(`BROWSER [${msg.type()}]:`, msg.text()));
  page.on('response', response => {
      if (response.url().includes('script.google.com') || response.url().includes('localhost')) {
          console.log(`API [${response.status()}]: ${response.url()}`);
      }
  });

  try {
    // 1. Dashboard
    console.log('Navigating to Dashboard...');
    await page.goto(TARGET_URL);
    await page.waitForLoadState('networkidle');

    // 2. Entry
    console.log('Navigating to Entry...');
    await page.click('text="บันทึกไปรษณีย์ภัณฑ์"');
    await page.waitForTimeout(1000);

    console.log('Filling Entry Form...');
    // Select Dept (First Combobox)
    await page.waitForSelector('div[role="combobox"]', { state: 'visible', timeout: 10000 });
    await page.locator('div[role="combobox"]').nth(0).click();
    // Wait for dropdown to populate from Master Data
    await page.waitForSelector('ul[role="listbox"] li', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500); // Buffer for react synthetic events
    await page.locator('ul[role="listbox"] li').first().click();
    
    // Fill tracking
    await page.fill('input[placeholder="สแกนหรือพิมพ์เลข..."]', testTrackingId);
    
    // Fill recipient (Second Combobox)
    await page.waitForTimeout(600);
    await page.locator('div[role="combobox"]').nth(1).click();
    await page.waitForTimeout(500); // Wait for auto-focus
    await page.keyboard.type('E2E Automated Bot');
    await page.waitForSelector('li:has-text("ระบุเอง")', { state: 'visible', timeout: 10000 });
    await page.locator('li:has-text("ระบุเอง")').click();

    // Add to cart
    await page.click('text=เพิ่มลงในตะกร้ารายการบันทึก');

    // Submit batch
    await page.click('button:has-text("ยืนยันบันทึกเข้าระบบ")');
    console.log('Waiting for Google Sheets API to fulfill Entry payload...');
    // The submit button shows a spinner. When done, the queue resets to "ยังไม่มีรายการ..."
    await page.waitForSelector('text="ยังไม่มีรายการด่วนในคิว"', { state: 'visible', timeout: 60000 });
    console.log('Entry completed successfully.');

    // Wait a moment for DB sync before navigating
    await page.waitForTimeout(2000);

    // 3. Pending List (Delivery)
    console.log('Navigating to Delivery...');
    await page.click('text="การนำจ่ายไปรษณีย์ภัณฑ์"');
    await page.waitForTimeout(1000);

    console.log('Searching and delivering package...');
    let packageFound = false;
    for (let i = 0; i < 5; i++) {
        await page.fill('input[placeholder*="ค้นหาชื่อผู้รับ"]', testTrackingId);
        await page.waitForTimeout(2000); // Wait for react state filter to apply
        
        const btnCount = await page.locator('button:has-text("เลือกทั้งหมด")').count();
        if (btnCount > 0) {
            packageFound = true;
            break;
        }
        
        console.log(`Package not found yet (Attempt ${i+1}/5). Refreshing Delivery list from GAS...`);
        // Trigger a fresh API call by clicking the refresh button or re-clicking the tab
        await page.click('text="การนำจ่ายไปรษณีย์ภัณฑ์"');
        await page.waitForTimeout(5000); // Buffer for GS fetch
    }
    
    if (!packageFound) {
        throw new Error('Critical Timeout: Package never appeared in Delivery list after 30 seconds of polling. GAS failed or lagged infinitely.');
    }

    // The package is inside a collapsible card. 
    // If the building is collapsed, 'เลือกทั้งหมด' will not be visible.
    const selectAllBtn = page.locator('button:has-text("เลือกทั้งหมด")').first();
    if (!(await selectAllBtn.isVisible())) {
        console.log('Building collapsed. Expanding...');
        await page.locator('button', { hasText: 'ชิ้น' }).first().click();
        await page.waitForTimeout(500);
    }
    await selectAllBtn.click({ timeout: 10000 });

    // Click confirm selected
    await page.waitForTimeout(500);
    await page.click('button:has-text("ยืนยันการนำจ่ายที่เลือก")');

    // Wait for Signature Canvas
    await page.waitForSelector('canvas', { state: 'visible' });

    // Fill receiverName combobox inside the modal
    await page.locator('div[role="dialog"] div[role="combobox"], div[role="combobox"]').last().click();
    await page.waitForTimeout(500);
    await page.keyboard.type('E2E Receiver');
    await page.waitForSelector('li:has-text("ระบุเอง")', { state: 'visible', timeout: 10000 });
    await page.locator('li:has-text("ระบุเอง")').last().click();

    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 30, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.up();
    }
    
    // Wait for the signature to register visually
    await page.waitForTimeout(500);

    // Click text 'ยืนยันตัวตนและบันทึก' inside signature pad UI
    await page.click('button:has-text("ยืนยันตัวตนและบันทึก")');

    // Verify modal disappears (GAS Latency check)
    console.log('Waiting for Google Sheets API to fulfill Delivery payload...');
    await page.waitForSelector('button:has-text("ยืนยันตัวตนและบันทึก")', { state: 'hidden', timeout: 60000 });
    console.log('Delivery completed successfully.');

    await page.waitForTimeout(2000);

    // 4. Search Page
    console.log('Navigating to Search...');
    await page.click('text="ค้นหาไปรษณีย์ภัณฑ์"');
    await page.waitForTimeout(1000);

    console.log('Verifying delivered status...');
    await page.fill('input[placeholder*="ค้นหาด้วย"]', testTrackingId);
    // Explicit click search button if needed, but enter should work
    await page.keyboard.press('Enter');
    
    // Assert status updated to success/Delivered
    await page.waitForTimeout(2000); // Wait for search API
    
    // The search page has a default filter for 'ธุรการกลาง'. We must clear it if it blocked our search.
    const clearBtn = page.locator('button:has-text("ล้างการกรองทั้งหมด")');
    if (await clearBtn.isVisible()) {
        console.log('Filters blocked search. Clearing filters...');
        await clearBtn.click();
        await page.waitForTimeout(1000);
        // Click the actual submit button instead of pressing Enter while focus is lost
        await page.click('button[type="submit"]', { timeout: 10000 });
        await page.waitForTimeout(3000);
    }
    
    try {
        const cardText = await page.locator('.group.relative.p-6').first().innerText({ timeout: 10000 });
        console.log('>>> Search Card Extracted Text:', cardText);
        
        if (!cardText.includes('สำเร็จ') && !cardText.includes('รับแล้ว') && !cardText.includes('ส่งมอบ')) {
           throw new Error('Status not updated properly. Card Text: ' + cardText);
        }
    } catch (e) {
        console.log('Search Assertion Failed. Dumping active UI Text...');
        const bodyText = await page.locator('body').innerText();
        console.error('--- PAGE BODY DUMP ---', bodyText);
        throw e;
    }
    
    console.log('✅ Full E2E Journey completed successfully!');
    await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/51d40fa2-6ca8-4acc-8e0a-b3ea000c75f0/media__e2e_full_success.png', fullPage: true });

  } catch (error) {
    console.error('❌ E2E Failed:', error);
    await page.screenshot({ path: 'C:/Users/Admin/.gemini/antigravity/brain/51d40fa2-6ca8-4acc-8e0a-b3ea000c75f0/media__e2e_full_failed.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
