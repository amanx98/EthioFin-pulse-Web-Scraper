import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function scraperApiPlugin() {
  return {
    name: 'scraper-api',
    configureServer(server) {
      server.middlewares.use('/api/scrape', (req, res, next) => {
        // Only handle GET/POST to /api/scrape/TARGET
        const target = req.url.split('?')[0].slice(1); // e.g. "mekina"
        if (!target) return next();

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Execute the scraper in the parent directory
        const child = spawn('node', ['scraper_app.js', '--target=' + target], {
          cwd: path.resolve(__dirname, '..')
        });

        child.stdout.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          lines.forEach(line => {
            if (line.trim()) res.write(`data: ${JSON.stringify(line)}\n\n`);
          });
        });

        child.stderr.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          lines.forEach(line => {
            if (line.trim()) res.write(`data: ${JSON.stringify('ERROR: ' + line)}\n\n`);
          });
        });

        child.on('close', (code) => {
          res.write(`data: ${JSON.stringify('DONE')}\n\n`);
          res.end();
        });
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    scraperApiPlugin()
  ],
})