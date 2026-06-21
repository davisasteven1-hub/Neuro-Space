import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_PATH = resolve(__dirname, 'data/exams.json');
const DIST_DIR = resolve(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
    // API routes
    if (req.url === '/api/exams') {
        if (req.method === 'GET') {
            const data = readFileSync(DATA_PATH, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
            return;
        }
        if (req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => { body += chunk.toString(); });
            req.on('end', () => {
                writeFileSync(DATA_PATH, body, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            });
            return;
        }
        res.writeHead(405);
        res.end('Method not allowed');
        return;
    }

    // Static file serving from dist/
    let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    if (!existsSync(filePath)) {
        filePath = join(DIST_DIR, 'index.html'); // SPA fallback
    }

    const ext = extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Exam data stored at: ${DATA_PATH}`);
});
