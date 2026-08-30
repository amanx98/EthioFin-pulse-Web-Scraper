const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://shega.co/');

  const news = await page.evaluate(() => {
    // Shega uses a lot of different classes, let's grab links that look like news
    const items = document.querySelectorAll('.td-module-container');
    return Array.from(items).map(el => {
        const titleEl = el.querySelector('.entry-title a');
        const imgEl = el.querySelector('.entry-thumb');
        const dateEl = el.querySelector('.entry-date');
        const authorEl = el.querySelector('.td-post-author-name a');

        return {
            headline: titleEl ? titleEl.innerText.trim() : null,
            url: titleEl ? titleEl.href : null,
            author: authorEl ? authorEl.innerText.trim() : 'Shega News',
            sector_tag: 'Technology',
            summary: 'Read the full story on Shega.',
            publication_date: dateEl ? dateEl.innerText.trim() : new Date().toISOString(),
            image_url: imgEl ? (imgEl.getAttribute('data-img-url') || imgEl.style.backgroundImage.slice(5, -2)) : null
        };
    }).filter(i => i.headline && i.url);
  });

  console.log("Shega news found:", news.length);
  if (news.length) console.log(news[0]);
  await browser.close();
})();
