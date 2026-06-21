import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function examApiPlugin(): Plugin {
    const dataPath = path.resolve(__dirname, 'data/exams.json');
    return {
        name: 'exam-api',
        configureServer(server) {
            server.middlewares.use('/api/exams', (req, res) => {
                if (req.method === 'GET') {
                    const data = fs.readFileSync(dataPath, 'utf-8');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(data);
                } else if (req.method === 'PUT') {
                    let body = '';
                    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                    req.on('end', () => {
                        fs.writeFileSync(dataPath, body, 'utf-8');
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ ok: true }));
                    });
                } else {
                    res.statusCode = 405;
                    res.end('Method not allowed');
                }
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), examApiPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
