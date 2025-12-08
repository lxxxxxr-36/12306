import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-code-logger',
      configureServer(server) {
        server.middlewares.use('/__dev/log-code', (req, res) => {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const ts = new Date().toISOString();
              console.log(`[DEV][${ts}] Password reset code: account=${data.account} code=${data.code}`);
            } catch (e) {
              console.log('[DEV] log-code JSON parse error', e);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('ok');
          });
        });

        // Serve external media directory at /media as fallback
        server.middlewares.use('/media', (req, res, next) => {
          const urlPath = (req.url || '/').replace(/\/+$/, '');
          const fileRel = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
          const mediaRoot = path.resolve(__dirname, '../media');
          const filePath = path.join(mediaRoot, fileRel);
          if (fs.existsSync(filePath)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/png');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
          next();
        });
      },
    },
  ],
})
