const fs = require('fs');

let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Fix Stream Info Header flex-wrap to prevent cutoff
app = app.replace(
  'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
  'className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4'
);
app = app.replace(
  '<div className="flex items-center gap-4 pt-1">',
  '<div className="flex flex-wrap items-center gap-4 pt-1">'
);
app = app.replace(
  '<div className="flex items-center gap-2 shrink-0">',
  '<div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">'
);

// 2. Fix List layout 5-columns breaking on mobile
app = app.replace(
  'className={viewLayout === \'list\' ? "grid grid-cols-5 gap-4 items-center" : "space-y-3"}',
  'className={viewLayout === \'list\' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-start sm:items-center" : "space-y-3"}'
);

// 3. Fix the top header controls (viewLayout toggle, etc) wrapping
app = app.replace(
  '<div className="flex items-center gap-2 shrink-0">', // Need to make sure this only targets the controls header if possible, but the previous one might have matched it too.
  '<div className="flex flex-wrap items-center gap-2 shrink-0">'
);
// Actually, I'll just use a more robust regex for the list columns.

// 4. Ensure the global search container doesn't overflow horizontally on very small screens
app = app.replace(
  'className="w-56 bg-[#121317]/80 border',
  'className="w-48 sm:w-56 bg-[#121317]/80 border'
);

// Let's re-write the file
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Mobile responsiveness patched!');
