import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Starting automated browser verification...');
  fs.mkdirSync('scratch_inspect', { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1672,941']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1672, height: 941 });

  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // Wait for loader to disappear
  await page.waitForSelector('#hero-loader.loaded', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 600));

  // 0. Initial Load (0% scroll - verify Phase 1 text is already visible on start)
  console.log('Capturing initial state at 0% scroll (Phase 1 text visible on start)...');
  await page.screenshot({ path: 'scratch_inspect/test_initial_load.png' });

  // 1. Initial Frame (Stage 1 - Left Middle)
  console.log('Scrolling to Phase 1 (10% progress, Left-Middle)...');
  await page.evaluate(() => {
    const container = document.getElementById('hero-scroll-container');
    const maxScroll = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.10, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_inspect/test_stage1.png' });

  // 2. Scroll to Stage 2 (approx 35% progress, Right-Middle)
  console.log('Scrolling to Stage 2 (Phase 2, Right-Middle)...');
  await page.evaluate(() => {
    const container = document.getElementById('hero-scroll-container');
    const maxScroll = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.35, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_inspect/test_stage2.png' });

  // 3. Scroll to Stage 3 (approx 58% progress, Bottom-Beneath)
  console.log('Scrolling to Stage 3 (Phase 3, Bottom-Beneath)...');
  await page.evaluate(() => {
    const container = document.getElementById('hero-scroll-container');
    const maxScroll = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.58, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_inspect/test_stage3.png' });

  // 4. Scroll to Stage 4 / Final Hero Hold (approx 88% of scrollable range - Sanitär active initially)
  console.log('Scrolling to Stage 4 (Final Hero Hold - Sanitär active initially)...');
  await page.evaluate(() => {
    const container = document.getElementById('hero-scroll-container');
    const maxScroll = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.88, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch_inspect/test_final_hero_sanitaer_initial.png' });

  // 5. Toggle to Heizung
  console.log('Clicking Heizung toggle button...');
  await page.click('#btn-toggle-heizung');
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: 'scratch_inspect/test_final_hero_heizung_toggled.png' });

  // 6. Toggle back to Sanitär
  console.log('Clicking Sanitär toggle button...');
  await page.click('#btn-toggle-sanitaer');
  await new Promise((r) => setTimeout(r, 700));

  // 7. Scroll past hero to post-hero section
  console.log('Scrolling past hero to Über Uns section...');
  await page.evaluate(() => {
    const about = document.getElementById('about');
    if (about) {
      about.scrollIntoView({ behavior: 'instant' });
    } else {
      const container = document.getElementById('hero-scroll-container');
      const target = container.offsetTop + container.offsetHeight + 100;
      window.scrollTo({ top: target, behavior: 'instant' });
    }
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: 'scratch_inspect/test_about_desktop.png' });
  await page.screenshot({ path: 'scratch_inspect/test_post_hero_released.png' });

  // 8. Mobile responsive viewport test (390x844)
  console.log('Testing mobile viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    const container = document.getElementById('hero-scroll-container');
    const maxScroll = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll * 0.88, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_inspect/test_mobile_hero.png' });

  // 9. Mobile About Section Test
  console.log('Testing mobile About section...');
  await page.evaluate(() => {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_inspect/test_about_mobile.png' });

  await browser.close();
  console.log('All automated browser tests completed successfully!');
}

run().catch((err) => {
  console.error('Error during test runner:', err);
  process.exit(1);
});
