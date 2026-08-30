const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Navigating...");
  await page.goto('https://mekina.net/cars/search?sort=date_desc');

  console.log("Waiting for cards...");
  // Wait for some cars to load
  try {
    await page.waitForSelector('.group.overflow-hidden', { timeout: 10000 });
  } catch(e) {
    console.log("Could not find standard layout, maybe cloudflare?");
    const html = await page.content();
    if(html.includes('cloudflare')) console.log("Cloudflare detected");
  }

  const cars = await page.evaluate(() => {
    // Select car cards. This selector might need to be tweaked based on Mekina DOM
    // Typically they are in a grid or list
    const items = document.querySelectorAll('a[href*="/cars/"]');
    const results = [];

    // Process items
    return items.length;
  });

  console.log("Total a tags to cars:", cars);
  await browser.close();
})();
