import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ROOT } from './build.mjs';
import { validateConfig } from './model.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };

export async function serve({ root = ROOT, port = 4173 } = {}) {
  const config = validateConfig(JSON.parse(await readFile(path.join(root, 'portfolio.config.json'), 'utf8')));
  const directory = await realpath(path.join(root, 'dist'));
  const server = createServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(request.method)) return send(405, 'Method not allowed');
    try {
      const url = new URL(request.url, 'http://localhost');
      let pathname = decodeURIComponent(url.pathname);
      if (config.basePath) {
        if (pathname === config.basePath) {
          response.writeHead(302, { location: `${config.basePath}/` }); response.end(); return;
        }
        if (!pathname.startsWith(`${config.basePath}/`)) return send(404, 'Not found');
        pathname = pathname.slice(config.basePath.length);
      }
      if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) return send(404, 'Not found');
      let target = path.resolve(directory, `.${pathname}`);
      if (!target.startsWith(directory + path.sep) && target !== directory) return send(404, 'Not found');
      const info = await stat(target);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(302, { location: config.basePath + pathname + '/' }); response.end(); return;
        }
        target = path.join(target, 'index.html');
      }
      const resolved = await realpath(target);
      if (!resolved.startsWith(directory + path.sep)) return send(404, 'Not found');
      const type = types[path.extname(target)] || 'application/octet-stream';
      if (target.endsWith('.html')) response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      send(200, await readFile(target), type);
    } catch (error) {
      if (error instanceof URIError) return send(400, 'Bad URL');
      try { send(404, await readFile(path.join(directory, '404.html')), types['.html']); }
      catch { send(404, 'Not found. Run npm run build first.'); }
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf('--port');
  const port = flag === -1 ? 4173 : Number(process.argv[flag + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port must be 1–65535');
  const server = await serve({ port });
  const config = JSON.parse(await readFile(path.join(ROOT, 'portfolio.config.json'), 'utf8'));
  console.log(`Local preview only: http://127.0.0.1:${server.address().port}${config.basePath}/`);
}
