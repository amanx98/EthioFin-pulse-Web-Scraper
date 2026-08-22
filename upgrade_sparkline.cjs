const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldSparklineRegex = /function Sparkline\(\{ currentPrice \}\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/;

const newSparkline = `function Sparkline({ currentPrice }) {
  const base = parseInt(String(currentPrice).replace(/[^0-9]/g, ''), 10) || 1000;
  // Generate 14 deterministic data points
  const pts = Array.from({length: 14}, (_, i) => base * (1 + (Math.sin(base + i) * 0.12)));
  pts[13] = base;
  
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  
  // Format for SVG
  const points = pts.map((p, i) => \`\${(i/13)*100},\${100 - ((p - min)/range)*100}\`).join(' ');
  const polygonPoints = \`0,100 \${points} 100,100\`;
  
  const startPrice = pts[0];
  const isDrop = base < startPrice; 
  const color = isDrop ? '#10b981' : '#e11d48'; // Green for price drops (good for buyers)
  const pct = (((base - startPrice) / startPrice) * 100).toFixed(1);
  const trendSign = pct > 0 ? '+' : '';

  return (
    <div className="flex flex-col items-end gap-1 shrink-0 w-24" title="30-Day Trend">
      <div className="w-full h-8 relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={\`grad-\${base}\`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={polygonPoints} fill={\`url(#grad-\${base})\`} />
          <polyline fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={points} />
        </svg>
      </div>
      <div className="flex items-center gap-1.5 justify-between w-full border-t border-[#1c1d22] pt-1">
        <span className="text-[8px] font-mono text-[#555]">30D TREND</span>
        <span className={\`text-[9px] font-mono font-bold \${isDrop ? 'text-emerald-400' : 'text-red-400'}\`}>
          {trendSign}{pct}%
        </span>
      </div>
    </div>
  );
}`;

app = app.replace(oldSparklineRegex, newSparkline);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Sparkline upgraded to Bloomberg Terminal style!');
