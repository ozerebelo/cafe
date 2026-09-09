/* Servidor de desenvolvimento: serve o index.html e encaminha /api/… para
   as mesmas funções que a Vercel corre em produção, com os atalhos de
   resposta que elas esperam. Precisa de DATABASE_URL apontada a um
   Postgres e, para um local, de PG_DRIVER=pg. */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);

const routes = {
  '/api/state': (await import('../api/state.js')).default,
  '/api/runs': (await import('../api/runs.js')).default,
  '/api/people': (await import('../api/people.js')).default,
};

function decorate(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (value) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(value));
    return res;
  };
  return res;
}

http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const handler = routes[path];
  if (handler) return handler(req, decorate(res));

  if (path === '/' || path === '/index.html') {
    const html = await readFile(join(root, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('não encontrado');
}).listen(port, () => console.log('http://localhost:' + port));
