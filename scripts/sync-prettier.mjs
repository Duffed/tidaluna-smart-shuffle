import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function validatePrettier(manifest, code) {
  if (manifest.name !== '@Duffed/tidaluna-prettier' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('Invalid Prettier identity/version');
  if (createHash('sha256').update(code).digest('hex') !== manifest.hash) throw new Error('Prettier code/manifest hash mismatch');
  return manifest;
}

export async function syncPrettier() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  const headResponse = await fetch('https://api.github.com/repos/Duffed/tidaluna-prettier/commits/main', { headers, cache: 'no-store' });
  if (!headResponse.ok) throw new Error(`Source commit: HTTP ${headResponse.status}`);
  const { sha } = await headResponse.json();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid source commit');
  const base = `https://raw.githubusercontent.com/Duffed/tidaluna-prettier/${sha}/dist/tidaluna-prettier`;
  const responses = await Promise.all(['json', 'mjs'].map(ext => fetch(`${base}.${ext}`, { cache: 'no-store' })));
  if (responses.some(r => !r.ok)) throw new Error('Source build download failed');
  const [json, code] = await Promise.all(responses.map(r => r.text()));
  const manifest = validatePrettier(JSON.parse(json), code);
  // Both files come from one immutable commit and are verified before either is written.
  await mkdir('dist', { recursive: true });
  await writeFile('dist/tidaluna-prettier.json', json);
  await writeFile('dist/tidaluna-prettier.mjs', code);
  console.log(`Prettier ${manifest.version} from ${sha}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await syncPrettier();
