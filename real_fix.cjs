const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /      clearInterval\(fpsInterval\);\r?\n  const triggerToast = \(msg\) => \{/;
const replacement = `      clearInterval(fpsInterval);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsShortcutsOpen(false);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setIsShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const triggerToast = (msg) => {`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log('Fixed!');
} else {
  console.log('Not found!');
}
