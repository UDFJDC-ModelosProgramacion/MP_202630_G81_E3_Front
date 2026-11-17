import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
// Sin BACKEND_URL se busca el back en los puertos habituales: 8080 (java -jar, Docker) y
// 8999 (`./mvnw spring-boot:run`, definido en el pom del back).
const CANDIDATES = ['http://localhost:8080', 'http://localhost:8999'];
let backend = new URL(process.env.BACKEND_URL ?? CANDIDATES[0]);

function isAlive(url) {
  return new Promise((resolve) => {
    const probe = http.get(new URL('/api/', url), (res) => {
      res.resume();
      resolve(true);
    });
    probe.setTimeout(1500, () => probe.destroy());
    probe.on('error', () => resolve(false));
  });
}

async function detectBackend() {
  if (process.env.BACKEND_URL) return;
  for (const candidate of CANDIDATES) {
    if (await isAlive(candidate)) {
      backend = new URL(candidate);
      return;
    }
  }
}
const port = Number(process.env.PORT ?? 3000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function proxy(req, res) {
  const client = backend.protocol === 'https:' ? https : http;
  const upstream = client.request(
    {
      hostname: backend.hostname,
      port: backend.port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: backend.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `No se pudo conectar con el back en ${backend.origin}` }));
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = path.normalize(path.join(root, decodeURIComponent(requested)));

  // Evita salir de `src/` con rutas como ../../etc/passwd
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end('Prohibido');
    return;
  }
  fs.readFile(file, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
}

await detectBackend();

http
  .createServer((req, res) =>
    req.url.startsWith('/api/') ? proxy(req, res) : serveStatic(req, res),
  )
  .listen(port, () => {
    console.log(`Front en http://localhost:${port}  ·  /api → ${backend.origin}`);
  });
