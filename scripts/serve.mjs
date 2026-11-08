import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/store.json', ['dist/store.json', 'application/json']],
  ['/local.smart-shuffle.json', ['dist/local.smart-shuffle.json', 'application/json']],
  ['/local.smart-shuffle.mjs', ['dist/local.smart-shuffle.mjs', 'text/javascript']],
  ['/local.smart-shuffle.mjs.map', ['dist/local.smart-shuffle.mjs.map', 'application/json']],
]);
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  const file = files.get(path);
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  try {
    const data = await readFile(file[0]);
    response.writeHead(200, { 'Content-Type': file[1] });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404); response.end('Run pnpm build first.'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(3000, '127.0.0.1', () => console.log('Plugin: http://127.0.0.1:3000/local.smart-shuffle\nStore: http://127.0.0.1:3000/store.json'));
