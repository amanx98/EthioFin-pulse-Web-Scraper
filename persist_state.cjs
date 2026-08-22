const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

app = app.replace(
  "const [viewMode, setViewMode] = useState('landing');",
  "const [viewMode, setViewMode] = useState(localStorage.getItem('ethiofin_view') || 'landing');"
);

app = app.replace(
  "const [activeStreamKey, setActiveStreamKey] = useState('2merkato');",
  "const [activeStreamKey, setActiveStreamKey] = useState(localStorage.getItem('ethiofin_stream') || '2merkato');"
);

const useEffectPersist = `  useEffect(() => { localStorage.setItem('ethiofin_view', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('ethiofin_stream', activeStreamKey); }, [activeStreamKey]);`;

app = app.replace('  const dataset = currentStream.data || [];', '  const dataset = currentStream.data || [];\n' + useEffectPersist);

fs.writeFileSync('frontend/src/App.jsx', app);
console.log('App.jsx patched for state persistence.');
