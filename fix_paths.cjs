const fs = require('fs');

// 1. Fix scraper_app.js paths
let scraper = fs.readFileSync('scraper_app.js', 'utf8');
scraper = scraper.replace(/output: 'data\//g, "output: 'frontend/src/data/");
fs.writeFileSync('scraper_app.js', scraper);

// 2. Fix App.jsx timestamp logic to use localStorage dynamically so the "4 hours ago" updates instantly
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// The replacement logic: we want to replace the hardcoded "lastScraped" logic with a dynamic one that checks localStorage first.
// Currently it uses: `currentStream.lastScraped`
const oldTimestampCode = `<span className={getFreshnessColor(currentStream.lastScraped)}>Scraped {currentStream.lastScraped ? getRelativeTime(currentStream.lastScraped) : 'N/A'}</span>`;
const newTimestampCode = `<span className={getFreshnessColor(localStorage.getItem('lastScraped_' + activeStreamKey) || currentStream.lastScraped)}>Scraped {getRelativeTime(localStorage.getItem('lastScraped_' + activeStreamKey) || currentStream.lastScraped || Date.now())}</span>`;

app = app.replace(oldTimestampCode, newTimestampCode);

// When data === 'DONE', set the localStorage timestamp before reloading
const oldDoneCode = `      if (data === 'DONE') {
        evtSource.close();
        setIsScraping(false);
        triggerToast('Scrape complete! UI syncing...');
        // Force a small delay then re-fetch the data to bypass static import caching
        setTimeout(() => window.location.reload(), 2000);
      }`;

const newDoneCode = `      if (data === 'DONE') {
        evtSource.close();
        setIsScraping(false);
        localStorage.setItem('lastScraped_' + activeStreamKey, new Date().toISOString());
        triggerToast('Scrape complete! UI syncing...');
        setTimeout(() => window.location.reload(), 2000);
      }`;

app = app.replace(oldDoneCode, newDoneCode);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Fixed scraper output path and UI timestamp logic.');
