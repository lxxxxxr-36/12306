import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      },
    },
  ],
})
