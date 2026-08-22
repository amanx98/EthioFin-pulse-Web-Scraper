const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add isScraping state
app = app.replace(
  "const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);",
  "const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);\n  const [isScraping, setIsScraping] = useState(false);"
);

// 2. Add handleScrape function
const handleScrapeFn = `
  const handleScrape = () => {
    if (isScraping) return;
    setIsLogViewerOpen(true);
    setIsScraping(true);
    setLogs([
      \`[\${new Date().toISOString()}] INFO: Initializing autonomous pipeline...\`,
      \`[\${new Date().toISOString()}] INFO: Target → \${currentStream.name}\`
    ]);

    const evtSource = new EventSource('/api/scrape/' + activeStreamKey);
    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data === 'DONE') {
        evtSource.close();
        setIsScraping(false);
        triggerToast('Scrape complete! UI syncing...');
        // Force a small delay then re-fetch the data to bypass static import caching
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setLogs(prev => [...prev, \`[\${new Date().toISOString()}] \${data}\`]);
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
      setIsScraping(false);
      triggerToast('Scrape connection lost');
    };
  };
`;

app = app.replace("const currentStream = REGISTRY[activeStreamKey]", handleScrapeFn + "\n  const currentStream = REGISTRY[activeStreamKey]");

// 3. Update the Scrape button to use it
app = app.replace(
  `<button onClick={() => triggerToast('Scrape triggered! Run: npm run scrape:' + activeStreamKey)} className="flex items-center gap-1.5 px-4 py-2 rounded-[16px] bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-semibold uppercase transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.25)]">\n                  <Rocket className="w-3.5 h-3.5" /> SCRAPE NOW\n                </button>`,
  `<button onClick={handleScrape} disabled={isScraping} className={\`flex items-center gap-1.5 px-4 py-2 rounded-[16px] text-white text-xs font-semibold uppercase transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.25)] \${isScraping ? 'bg-[#be123c] opacity-80 cursor-wait' : 'bg-[#e11d48] hover:bg-[#be123c]'}\`}>\n                  <Rocket className={\`w-3.5 h-3.5 \${isScraping ? 'animate-pulse' : ''}\`} /> {isScraping ? 'SCRAPING...' : 'SCRAPE NOW'}\n                </button>`
);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Added handleScrape!');
