const fs = require('fs');

let css = fs.readFileSync('frontend/src/index.css', 'utf8');

// Find the index of @media print
const mediaIndex = css.indexOf('@media print');
if (mediaIndex !== -1) {
  // Cut off everything from @media print onwards
  css = css.substring(0, mediaIndex);
}

// Append the correct new block
css += `@media print {
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

fs.writeFileSync('frontend/src/index.css', css);
console.log('Fixed CSS correctly!');
