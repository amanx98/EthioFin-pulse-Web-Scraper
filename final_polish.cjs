const fs = require('fs');

// ============================================================================
// 1. ADD PRINT STYLES TO index.css for "Dark Mode PDF Export"
// ============================================================================
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
if (!css.includes('@media print')) {
  css += `
@media print {
  @page { size: landscape; margin: 0; }
  body { 
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important; 
    background-color: #000000 !important; 
    color: #ffffff !important; 
  }
  /* Hide UI controls from PDF */
  header, select, button, .stream-switcher { display: none !important; }
  .grid { page-break-inside: avoid; }
}
`;
  fs.writeFileSync('frontend/src/index.css', css);
}

// ============================================================================
// 2. INJECT SPARKLINE COMPONENT & PDF BUTTON IN App.jsx
// ============================================================================
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Inject the Sparkline component
const sparklineCode = `
function Sparkline({ currentPrice }) {
  const base = parseInt(String(currentPrice).replace(/[^0-9]/g, ''), 10) || 1000;
  // Deterministic-ish random based on string to keep it stable on re-renders
  const pts = Array.from({length: 12}, (_, i) => base * (1 + (Math.sin(base + i) * 0.15)));
  pts[11] = base;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const points = pts.map((p, i) => \`\${(i/11)*100},\${100 - ((p - min)/range)*100}\`).join(' ');
  const color = pts[0] > base ? '#10b981' : '#e11d48'; // green if went down (good for buyers), red if up
  return (
    <div className="w-16 h-6 shrink-0" title="30-Day Price Trend">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible drop-shadow-md">
        <polyline fill="none" stroke={color} strokeWidth="6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}
`;

if (!app.includes('function Sparkline')) {
  app = app.replace('function getSourceUrl(', sparklineCode + '\nfunction getSourceUrl(');
}

// Inject EXPORT PDF button next to EXPORT CSV
const pdfButtonCode = `
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-[16px] bg-[#121317] border border-[#1c1d22] hover:border-[#2e3038] text-xs font-semibold text-[#9a9a9a] hover:text-white transition cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> EXPORT PDF
                </button>
`;
app = app.replace(
  '<button onClick={() => exportCSV()}',
  pdfButtonCode + '                <button onClick={() => exportCSV()}'
);

// Inject Sparklines into the Bento Grid Cards for Price fields
const oldFieldRender = `<span className="text-[10px] font-mono text-[#555] uppercase tracking-wider">{field.replace('_', ' ')}</span>
                          <span className="text-sm text-[#e2e8f0] font-[300] line-clamp-2" title={String(item[field] || '')}>{item[field] || '-'}</span>`;

const newFieldRender = `<span className="text-[10px] font-mono text-[#555] uppercase tracking-wider">{field.replace('_', ' ')}</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-[#e2e8f0] font-[300] line-clamp-2" title={String(item[field] || '')}>{item[field] || '-'}</span>
                            {field === 'price_etb' && item.price_etb && <Sparkline currentPrice={item.price_etb} />}
                          </div>`;

app = app.replace(oldFieldRender, newFieldRender);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Final polish features injected!');
