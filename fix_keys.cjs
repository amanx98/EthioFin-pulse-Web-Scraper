const fs = require('fs');
let app = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const badBlock = `    return () => {
      if (lenis) lenis.destroy();
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(fpsInterval);
  const triggerToast = (msg) => {`;

const goodBlock = `    return () => {
      if (lenis) lenis.destroy();
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(fpsInterval);
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

app = app.replace(badBlock, goodBlock);
fs.writeFileSync('frontend/src/App.jsx', app);
console.log('Restored useEffect block and injected keybindings!');
