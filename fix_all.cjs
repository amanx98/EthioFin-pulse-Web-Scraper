const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /    setGlobalResults\(results\.slice\(0, 20\)\);\r?\n  \}, \[globalSearch\]\);\r?\n\r?\n    <div className=/;

const replacement = `    setGlobalResults(results.slice(0, 20));
  }, [globalSearch]);

  const exportCSV = () => {
    if (!filteredRecords.length) return;
    const headers = Object.keys(filteredRecords[0]).filter(k => k !== 'input');
    const rows = [headers.join(','), ...filteredRecords.map(row => headers.map(h => \`"\${String(row[h] ?? '').replace(/"/g, '""')}"\`).join(','))];
    const blob = new Blob([rows.join('\\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = \`ethiofin_\${activeStreamKey}_\${Date.now()}.csv\`; a.click();
    URL.revokeObjectURL(url);
    triggerToast(\`Exported \${filteredRecords.length} records\`);
  };

  return (
    <div className=`;

app = app.replace(regex, replacement);

const oldLogsStateRegex = /const \[logs, setLogs\] = useState\(\(\) => Array\.from[^;]+;/;
const newLogsState = "const [logs, setLogs] = useState([`[${new Date().toISOString()}] SYSTEM READY`, `[${new Date().toISOString()}] WAITING FOR SCRAPE TRIGGER...`]);";
app = app.replace(oldLogsStateRegex, newLogsState);

fs.writeFileSync('frontend/src/App.jsx', app);

let css = fs.readFileSync('frontend/src/index.css', 'utf8');
const oldPrintBlockRegex = /@media print \{[\s\S]*?\}/g;

const newPrintBlock = `@media print {
  @page { size: landscape; margin: 0.5in; }
  body, html, * { 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important; 
    background-color: #ffffff !important; 
    color: #000000 !important; 
  }
  span, div, p, h1, h2, h3, h4, h5, h6, kbd {
    color: #000000 !important;
  }
  .bg-\\[\\#0c0d12\\], .bg-\\[\\#121317\\] {
    background-color: #ffffff !important;
    border: 1px solid #e5e7eb !important;
  }
  .border-\\[\\#1c1d22\\] {
    border-color: #e5e7eb !important;
  }
  svg polyline { stroke: #000 !important; }
  header, select, button, nav, .stream-switcher { display: none !important; }
  .grid { page-break-inside: avoid; }
}`;

css = css.replace(oldPrintBlockRegex, newPrintBlock);
fs.writeFileSync('frontend/src/index.css', css);

console.log('App patched!');
